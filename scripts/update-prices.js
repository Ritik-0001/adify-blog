#!/usr/bin/env node
/**
 * update-prices.js
 * Weekly price updater — scrapes Amazon India search results to refresh prices
 * in MDX post files. Processes 50 posts per run, oldest-checked-first.
 * Commits changes back to GitHub → Vercel redeploys automatically.
 */

const https = require('https')
const fs    = require('fs')
const path  = require('path')

const POSTS_DIR = path.join(__dirname, '..', 'posts')
const LOG_FILE  = path.join(__dirname, 'price-log.json')
const MAX_POSTS = 50
const DELAY_MS  = 3000

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
]

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

function randomUA() { return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)] }

function loadLog() {
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')) }
  catch { return { runs: [], posts: {} } }
}

function saveLog(log) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2))
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  const fm = {}
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*"(.+)"$/)
    if (m) fm[m[1]] = m[2]
  }
  return fm
}

function extractAmazonSearchTerm(content) {
  // Pull search term from affiliate_link frontmatter k= param
  const m = content.match(/affiliate_link:\s*"https:\/\/www\.amazon\.in\/s\?k=([^&"]+)/)
  if (m) return decodeURIComponent(m[1].replace(/\+/g, ' '))
  // Fallback: first Check ... on Amazon link
  const m2 = content.match(/amazon\.in\/s\?k=([^&\)]+)/)
  if (m2) return decodeURIComponent(m2[1].replace(/\+/g, ' '))
  return null
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const ua = randomUA()
    const opts = {
      method: 'GET',
      headers: {
        'User-Agent':      ua,
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        'Accept-Encoding': 'identity',
        'Connection':      'keep-alive',
        'Cache-Control':   'no-cache',
      },
    }

    const urlObj = new URL(url)
    const reqOpts = { ...opts, hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search }

    const req = https.request(reqOpts, (res) => {
      // Follow redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchPage(res.headers.location))
      }
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => resolve({ status: res.statusCode, html: data }))
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Request timeout')) })
    req.end()
  })
}

function extractPriceFromHtml(html) {
  // Try multiple price patterns Amazon uses
  const patterns = [
    // JSON price data
    /"price":"₹([\d,]+)"/,
    /"priceAmount":([\d.]+)/,
    // HTML price spans
    /class="a-price-whole"[^>]*>\s*([\d,]+)\s*</,
    /a-price"[^>]*>[^<]*<[^>]*>([\d,]+)</,
    // ₹ in text followed by digits
    /₹\s*([\d,]+)/,
  ]
  for (const pat of patterns) {
    const m = html.match(pat)
    if (m) {
      const raw = m[1].replace(/,/g, '')
      const num = parseInt(raw, 10)
      if (num > 100 && num < 10000000) return num // sanity: ₹100 to ₹1cr
    }
  }
  return null
}

function formatIndianPrice(n) {
  const s = String(n)
  if (s.length <= 3) return s
  const last3 = s.slice(-3)
  let rest = s.slice(0, -3)
  const groups = []
  while (rest.length > 2) { groups.unshift(rest.slice(-2)); rest = rest.slice(0, -2) }
  if (rest) groups.unshift(rest)
  return groups.join(',') + ',' + last3
}

function updatePriceInContent(content, productName, newPriceNum) {
  const rupee     = '₹'
  const formatted = `${rupee}${formatIndianPrice(newPriceNum)}`
  // Find the product row in the price table and update the Amazon Price column
  const tableRowRe = new RegExp(
    `(\\|\\s*${productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^|]*\\|\\s*)${rupee}[\\d,]+(?:[\\s\\u2013\\-]+${rupee}[\\d,]+)?(\\s*\\|)`,
    'g'
  )
  const updated = content.replace(tableRowRe, `$1${formatted}$2`)
  return { content: updated, changed: updated !== content }
}

async function processPost(filePath, log) {
  const fname   = path.basename(filePath)
  const raw     = fs.readFileSync(filePath, 'utf8')
  const fm      = parseFrontmatter(raw)
  const slug    = fm.slug || fname.replace('.mdx', '')

  // Skip posts with no price table
  if (!raw.includes('## Current Prices in India')) {
    return { slug, skipped: 'no price table' }
  }

  const searchTerm = extractAmazonSearchTerm(raw)
  if (!searchTerm) {
    return { slug, skipped: 'no amazon search term' }
  }

  const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(searchTerm)}&tag=adifystore-21`

  let html, status
  try {
    ;({ html, status } = await fetchPage(searchUrl))
  } catch (e) {
    return { slug, error: `fetch failed: ${e.message}` }
  }

  if (status === 503 || (html && html.includes('Robot Check'))) {
    return { slug, error: 'Amazon blocked (CAPTCHA/503)' }
  }

  if (status !== 200) {
    return { slug, error: `HTTP ${status}` }
  }

  const price = extractPriceFromHtml(html)
  if (!price) {
    return { slug, error: 'price not found in page' }
  }

  // Find first product name from the price table header
  const tableMatch = raw.match(/## Current Prices in India[\s\S]*?\n\|[^\n]+\|\n\|[-|]+\|\n\|\s*([^|]+?)\s*\|/)
  if (!tableMatch) return { slug, skipped: 'table parse failed' }

  const firstProduct = tableMatch[1].trim()
  const { content: newContent, changed } = updatePriceInContent(raw, firstProduct, price)

  if (!changed) return { slug, skipped: 'price unchanged' }

  fs.writeFileSync(filePath, newContent, 'utf8')
  return { slug, updated: true, price: `₹${formatIndianPrice(price)}`, product: firstProduct }
}

async function main() {
  console.log(`Price Update Bot starting — ${new Date().toISOString()}`)
  console.log(`Max posts this run: ${MAX_POSTS}`)

  const log = loadLog()

  // Collect all posts, sort by last-checked time (oldest first)
  const allFiles = fs.readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.mdx') && fs.statSync(path.join(POSTS_DIR, f)).isFile())
    .map((f) => ({
      name:        f,
      fullPath:    path.join(POSTS_DIR, f),
      lastChecked: log.posts[f]?.lastChecked || 0,
    }))
    .sort((a, b) => a.lastChecked - b.lastChecked)
    .slice(0, MAX_POSTS)

  console.log(`Processing ${allFiles.length} posts...`)

  const runResults = { timestamp: new Date().toISOString(), updated: [], skipped: [], errors: [] }

  for (let i = 0; i < allFiles.length; i++) {
    const { name, fullPath } = allFiles[i]
    process.stdout.write(`[${i + 1}/${allFiles.length}] ${name}... `)

    let result
    try {
      result = await processPost(fullPath, log)
    } catch (e) {
      result = { slug: name, error: e.message }
    }

    log.posts[name] = { lastChecked: Date.now(), ...result }

    if (result.updated) {
      runResults.updated.push(result)
      console.log(`✓ Updated price to ${result.price}`)
    } else if (result.error) {
      runResults.errors.push(result)
      console.log(`✗ ${result.error}`)
    } else {
      runResults.skipped.push(result)
      console.log(`- ${result.skipped}`)
    }

    // Delay between requests to avoid rate limiting
    if (i < allFiles.length - 1) await sleep(DELAY_MS)
  }

  log.runs = [runResults, ...(log.runs || [])].slice(0, 20) // keep last 20 runs
  saveLog(log)

  const { updated, errors } = runResults
  console.log(`\nDone. Updated: ${updated.length} | Skipped: ${runResults.skipped.length} | Errors: ${errors.length}`)
  if (updated.length > 0) {
    console.log('Updated posts:')
    updated.forEach((r) => console.log(`  - ${r.slug}: ${r.product} → ${r.price}`))
  }

  // Exit non-zero if nothing was updated (so workflow can conditionally commit)
  process.exit(updated.length > 0 ? 0 : 2)
}

main().catch((e) => { console.error(e); process.exit(1) })
