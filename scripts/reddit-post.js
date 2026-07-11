#!/usr/bin/env node
/**
 * reddit-post.js
 * Posts newly published Adify content to relevant subreddits via Reddit OAuth2.
 * Triggered by reddit-auto-post.yml after publish-post.yml completes.
 */

const https = require('https')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// --- Config ---
const CLIENT_ID     = process.env.REDDIT_CLIENT_ID
const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET
const USERNAME      = process.env.REDDIT_USERNAME
const PASSWORD      = process.env.REDDIT_PASSWORD
const USER_AGENT    = process.env.REDDIT_USER_AGENT || 'AdifyBot/1.0 by /u/adifystore'
const PUBLISH_SHA   = process.env.PUBLISH_SHA || 'HEAD'

const POSTS_DIR = path.join(__dirname, '..', 'posts')
const LOG_FILE  = path.join(__dirname, 'reddit-log.json')

const SUBREDDIT_MAP = {
  Laptops:     ['india', 'IndianGaming'],
  Appliances:  ['india', 'IndiaInvestments'],
  Audio:       ['headphones', 'india'],
  Health:      ['india'],
  Phones:      ['india', 'IndianGaming'],
  Smartphones: ['india', 'IndianGaming'],
  Printers:    ['india'],
  Gaming:      ['india', 'IndianGaming'],
  Monitors:    ['india', 'IndianGaming'],
  Cameras:     ['india'],
  Wearables:   ['india'],
  Accessories: ['india'],
  Default:     ['india'],
}

// --- Utilities ---
function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

function loadLog() {
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')) }
  catch { return { posts: [] } }
}

function saveLog(log) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2))
}

function canPostToSubreddit(log, subreddit) {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  return !log.posts.some(
    (p) => p.subreddit === subreddit && new Date(p.timestamp).getTime() > oneHourAgo
  )
}

function alreadyPostedSlug(log, slug) {
  return log.posts.some((p) => p.slug === slug && p.success)
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

function extractHighlights(content) {
  const bullets = []
  const body = content.replace(/^---[\s\S]*?---/, '')
  for (const line of body.split('\n')) {
    const m = line.match(/^-\s+(.{20,})/)
    if (m && !m[1].startsWith('[') && bullets.length < 3) {
      bullets.push(m[1].replace(/\*\*/g, '').trim())
    }
    if (bullets.length === 3) break
  }
  return bullets
}

function detectNewPost() {
  try {
    const changed = execSync(
      `git show --name-only ${PUBLISH_SHA} | grep '^posts/[^/]*\\.mdx$'`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim()
    if (!changed) return null
    return changed.split('\n')[0].trim()
  } catch {
    return null
  }
}

async function getRedditToken() {
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const body  = `grant_type=password&username=${encodeURIComponent(USERNAME)}&password=${encodeURIComponent(PASSWORD)}`
  const res = await httpsRequest({
    hostname: 'www.reddit.com',
    path:     '/api/v1/access_token',
    method:   'POST',
    headers: {
      Authorization:   `Basic ${creds}`,
      'Content-Type':  'application/x-www-form-urlencoded',
      'User-Agent':    USER_AGENT,
    },
  }, body)
  if (res.status !== 200) throw new Error(`Reddit auth failed (${res.status}): ${JSON.stringify(res.body)}`)
  return res.body.access_token
}

async function submitPost(token, subreddit, title, text) {
  const body = `api_type=json&kind=self&sr=${encodeURIComponent(subreddit)}&title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}`
  return httpsRequest({
    hostname: 'oauth.reddit.com',
    path:     '/api/submit',
    method:   'POST',
    headers: {
      Authorization:   `Bearer ${token}`,
      'Content-Type':  'application/x-www-form-urlencoded',
      'User-Agent':    USER_AGENT,
    },
  }, body)
}

async function main() {
  console.log('Reddit Auto-Post starting...')

  // Validate credentials
  if (!CLIENT_ID || !CLIENT_SECRET || !USERNAME || !PASSWORD) {
    console.error('Missing Reddit credentials. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD.')
    process.exit(1)
  }

  // Detect which post was just published
  const newFilePath = detectNewPost()
  if (!newFilePath) {
    console.log('No new post detected in latest commit — nothing to post.')
    return
  }
  console.log(`New post detected: ${newFilePath}`)

  const fullPath = path.join(__dirname, '..', newFilePath)
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`)
    process.exit(1)
  }

  const content  = fs.readFileSync(fullPath, 'utf8')
  const fm       = parseFrontmatter(content)
  const slug     = fm.slug || path.basename(newFilePath, '.mdx')
  const title    = fm.title || slug
  const category = fm.category || 'Default'

  const log = loadLog()

  if (alreadyPostedSlug(log, slug)) {
    console.log(`Already posted "${slug}" to Reddit — skipping.`)
    return
  }

  const highlights   = extractHighlights(content)
  const subreddits   = SUBREDDIT_MAP[category] || SUBREDDIT_MAP.Default
  const topic        = title.replace(/\s*[|—–].*$/, '').trim()
  const highlightMd  = highlights.length
    ? highlights.map((h) => `- ${h}`).join('\n')
    : '- Covers top picks with verified Indian pricing\n- Amazon India availability confirmed\n- After-sales service options evaluated'

  const postTitle = `[${category}] ${title}`
  const postBody  = `Hey everyone,

Just published an in-depth guide on **${topic}** specifically for Indian buyers — covers pricing in ₹, Amazon India availability, and after-sales service considerations.

**Key highlights:**
${highlightMd}
- All prices verified on Amazon India
- Updated for 2026

Full guide: https://adify.store/blog/${slug}

Happy to answer questions about specific models!

---
*I'm the author of Adify, an independent Indian tech review site. Feel free to ask me anything in the comments.*`

  // Get OAuth token
  let token
  try {
    token = await getRedditToken()
    console.log('Reddit OAuth token obtained.')
  } catch (e) {
    console.error('Reddit auth error:', e.message)
    process.exit(1)
  }

  // Post to each subreddit with rate-limit check
  for (let i = 0; i < subreddits.length; i++) {
    const subreddit = subreddits[i]

    if (!canPostToSubreddit(log, subreddit)) {
      console.log(`Skipping r/${subreddit} — posted within last hour.`)
      continue
    }

    console.log(`Posting to r/${subreddit}...`)
    try {
      const res     = await submitPost(token, subreddit, postTitle, postBody)
      const errors  = res.body?.json?.errors
      const success = Array.isArray(errors) && errors.length === 0
      const url     = res.body?.json?.data?.url || null

      log.posts.push({
        timestamp: new Date().toISOString(),
        subreddit,
        slug,
        title: postTitle,
        success,
        url,
        error: success ? null : JSON.stringify(errors),
      })

      if (success) console.log(`  ✓ https://reddit.com${url}`)
      else console.warn(`  ✗ r/${subreddit} errors:`, errors)
    } catch (e) {
      console.error(`  Error posting to r/${subreddit}:`, e.message)
      log.posts.push({ timestamp: new Date().toISOString(), subreddit, slug, success: false, error: e.message })
    }

    if (i < subreddits.length - 1) {
      console.log('  Waiting 30 seconds...')
      await sleep(30000)
    }
  }

  saveLog(log)
  console.log('Done. Log updated: scripts/reddit-log.json')
}

main().catch((e) => { console.error(e); process.exit(1) })
