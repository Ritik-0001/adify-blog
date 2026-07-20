#!/usr/bin/env node
/**
 * asin-replacer.js
 * Reads a YouTube description from clipboard or a file, finds all Amazon product
 * links, looks up the real ASIN via Amazon PA API, and rewrites every link to
 * https://www.amazon.in/dp/ASIN?tag=adifystore-21
 *
 * Usage:
 *   node scripts/asin-replacer.js              # reads from clipboard, writes to clipboard
 *   node scripts/asin-replacer.js -f desc.txt  # reads from file, writes to clipboard
 *   node scripts/asin-replacer.js -f desc.txt -o out.txt  # writes to file instead
 */

require('dotenv').config()

const amazonPaapi = require('amazon-paapi')
const { execSync, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// ── Config ────────────────────────────────────────────────────────────────────

const TAG = process.env.ASSOCIATE_TAG || 'adifystore-21'
const PARTNER_TAG = TAG
const HOST = 'webservices.amazon.in'
const REGION = 'eu-west-1'  // India marketplace region for PA API

const commonParameters = {
  AccessKey: process.env.AMAZON_ACCESS_KEY,
  SecretKey: process.env.AMAZON_SECRET_KEY,
  PartnerTag: PARTNER_TAG,
  PartnerType: 'Associates',
  Marketplace: 'www.amazon.in',
}

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
let inputFile = null
let outputFile = null

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-f' && args[i + 1]) { inputFile = args[i + 1]; i++ }
  if (args[i] === '-o' && args[i + 1]) { outputFile = args[i + 1]; i++ }
}

// ── Clipboard helpers (Windows + Mac + Linux) ─────────────────────────────────

function readClipboard() {
  const plat = process.platform
  if (plat === 'win32') {
    const r = spawnSync('powershell', ['-command', 'Get-Clipboard'], { encoding: 'utf8' })
    if (r.error) throw new Error('Cannot read clipboard: ' + r.error.message)
    return r.stdout
  }
  if (plat === 'darwin') {
    return execSync('pbpaste', { encoding: 'utf8' })
  }
  return execSync('xclip -selection clipboard -o', { encoding: 'utf8' })
}

function writeClipboard(text) {
  const plat = process.platform
  if (plat === 'win32') {
    const r = spawnSync('powershell', ['-command', `Set-Clipboard -Value @'\n${text}\n'@`], { encoding: 'utf8' })
    if (r.error) throw new Error('Cannot write clipboard: ' + r.error.message)
    return
  }
  if (plat === 'darwin') {
    const r = spawnSync('pbcopy', [], { input: text, encoding: 'utf8' })
    if (r.error) throw new Error('Cannot write clipboard: ' + r.error.message)
    return
  }
  spawnSync('xclip', ['-selection', 'clipboard'], { input: text, encoding: 'utf8' })
}

// ── Amazon PA API helpers ─────────────────────────────────────────────────────

async function searchAsin(productName) {
  const request = {
    Keywords: productName,
    SearchIndex: 'All',
    ItemCount: 1,
    Resources: ['ItemInfo.Title', 'Offers.Listings.Price'],
  }
  try {
    const response = await amazonPaapi.SearchItems(commonParameters, request)
    const items = response?.SearchResult?.Items
    if (!items || items.length === 0) return null
    return items[0].ASIN
  } catch (err) {
    const msg = err?.response?.data?.Errors?.[0]?.Message || err.message
    console.error(`  ⚠  PA API error for "${productName}": ${msg}`)
    return null
  }
}

// ── Link extraction & replacement ─────────────────────────────────────────────

// Matches markdown links: [text](https://www.amazon.in/...)
// and bare URLs: https://www.amazon.in/...
const MARKDOWN_LINK_RE = /\[([^\]]+)\]\((https?:\/\/(?:www\.)?amazon\.in\/[^)]+)\)/g
const BARE_URL_RE = /(?<!\()(https?:\/\/(?:www\.)?amazon\.in\/\S+)(?!\))/g

// Extract the search keyword from an existing Amazon URL.
// Priority: search query (q= or k=), then infer from URL path segments.
function extractKeywordFromUrl(url) {
  try {
    const u = new URL(url)
    const kw = u.searchParams.get('k') || u.searchParams.get('q') || u.searchParams.get('field-keywords')
    if (kw) return decodeURIComponent(kw).replace(/\+/g, ' ')

    // Try /s path with a query keyword
    // Try /dp/ASIN — no keyword available
    // Try product title from path segments (/Logitech-MK470.../dp/...)
    const segments = u.pathname.split('/').filter(Boolean)
    // If first segment looks like a product slug (contains hyphens or letters)
    if (segments[0] && segments[0] !== 'dp' && segments[0] !== 's' && segments[0].length > 4) {
      return segments[0].replace(/-/g, ' ')
    }
  } catch (_) {}
  return null
}

// Collect all unique product searches needed: {keyword, originalUrl, label}
function collectLinks(text) {
  const jobs = [] // [{keyword, originalUrl, label, type:'markdown'|'bare'}]
  const seen = new Map() // originalUrl -> index in jobs

  let m
  const textCopy = text

  // Markdown links
  MARKDOWN_LINK_RE.lastIndex = 0
  while ((m = MARKDOWN_LINK_RE.exec(textCopy)) !== null) {
    const [, label, url] = m
    if (seen.has(url)) continue
    const keyword = extractKeywordFromUrl(url) || label
    jobs.push({ keyword, originalUrl: url, label, type: 'markdown' })
    seen.set(url, jobs.length - 1)
  }

  // Bare URLs (skip those already captured as part of markdown)
  const markdownUrls = new Set(jobs.map(j => j.originalUrl))
  BARE_URL_RE.lastIndex = 0
  while ((m = BARE_URL_RE.exec(textCopy)) !== null) {
    const url = m[1]
    if (markdownUrls.has(url) || seen.has(url)) continue
    const keyword = extractKeywordFromUrl(url)
    if (!keyword) continue // can't search for an unknown product
    jobs.push({ keyword, originalUrl: url, label: null, type: 'bare' })
    seen.set(url, jobs.length - 1)
  }

  return jobs
}

function buildAsinUrl(asin) {
  return `https://www.amazon.in/dp/${asin}?tag=${TAG}`
}

function applyReplacements(text, replacements) {
  // replacements: [{originalUrl, newUrl}]
  // Sort by length desc so longer URLs are replaced first (avoid partial matches)
  const sorted = [...replacements].sort((a, b) => b.originalUrl.length - a.originalUrl.length)

  let result = text
  for (const { originalUrl, newUrl } of sorted) {
    // Escape special regex chars in the URL
    const escaped = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escaped, 'g'), newUrl)
  }
  return result
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!commonParameters.AccessKey || !commonParameters.SecretKey) {
    console.error('Error: AMAZON_ACCESS_KEY and AMAZON_SECRET_KEY must be set in environment.')
    process.exit(1)
  }

  // Read input
  let description
  if (inputFile) {
    const filePath = path.resolve(inputFile)
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      process.exit(1)
    }
    description = fs.readFileSync(filePath, 'utf8')
    console.log(`Read ${description.length} chars from ${filePath}`)
  } else {
    description = readClipboard()
    console.log(`Read ${description.length} chars from clipboard`)
  }

  // Collect all Amazon links
  const jobs = collectLinks(description)

  if (jobs.length === 0) {
    console.log('No Amazon links found in the description.')
    if (outputFile) fs.writeFileSync(outputFile, description, 'utf8')
    else writeClipboard(description)
    process.exit(0)
  }

  console.log(`\nFound ${jobs.length} Amazon link(s) to process:\n`)

  // Deduplicate by keyword so identical searches run once
  const keywordToAsin = new Map()
  const uniqueKeywords = [...new Set(jobs.map(j => j.keyword))]

  for (const keyword of uniqueKeywords) {
    process.stdout.write(`  Searching: "${keyword}" ... `)
    if (keywordToAsin.has(keyword)) {
      console.log(`(cached: ${keywordToAsin.get(keyword)})`)
      continue
    }
    const asin = await searchAsin(keyword)
    if (asin) {
      console.log(`→ ${asin}`)
      keywordToAsin.set(keyword, asin)
    } else {
      console.log('not found — link unchanged')
      keywordToAsin.set(keyword, null)
    }
    // Brief pause to avoid PA API rate limits (1 req/sec safe limit)
    await new Promise(r => setTimeout(r, 1100))
  }

  // Build replacement map
  const replacements = []
  for (const job of jobs) {
    const asin = keywordToAsin.get(job.keyword)
    if (!asin) continue
    replacements.push({ originalUrl: job.originalUrl, newUrl: buildAsinUrl(asin) })
  }

  const updated = applyReplacements(description, replacements)

  // Output
  if (outputFile) {
    fs.writeFileSync(path.resolve(outputFile), updated, 'utf8')
    console.log(`\nWritten to ${outputFile}`)
  } else {
    writeClipboard(updated)
    console.log('\nCopied to clipboard.')
  }

  // Summary
  const changed = replacements.length
  const unchanged = jobs.length - changed
  console.log(`\nDone: ${changed} link(s) updated, ${unchanged} skipped (not found).`)
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
