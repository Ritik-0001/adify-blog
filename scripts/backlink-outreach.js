#!/usr/bin/env node
/**
 * backlink-outreach.js
 * Weekly outreach pipeline: finds Indian tech blogs via Google Custom Search,
 * generates personalised emails via Claude, sends via Resend API.
 * Max 10 emails/week to avoid spam classification.
 *
 * Run every Monday at 9am IST via backlink-outreach.yml
 */

const https = require('https')
const fs    = require('fs')
const path  = require('path')

const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY
const RESEND_KEY     = process.env.RESEND_API_KEY
const GOOGLE_KEY     = process.env.GOOGLE_SEARCH_API_KEY
const GOOGLE_CX      = process.env.GOOGLE_SEARCH_ENGINE_ID
const FROM_EMAIL     = 'ritik@adify.store'
const FROM_NAME      = 'Ritik from Adify'

const LOG_FILE = path.join(__dirname, 'outreach-log.json')
const MAX_WEEKLY_EMAILS = 10

const SEARCH_QUERIES = [
  'best laptop india 2026 review site:.in',
  'best AC india 2026 buying guide blog',
  'tech review india 2026 buying guide',
  'best earphones india blog review 2026',
  'best smartphone india 2026 review site:.in',
  'indian tech blogger gadget review 2026',
  'best gaming laptop india review blog',
  'best monitor india 2026 site:.in',
]

// Match queries to relevant Adify posts for contextual outreach
const POST_MATCH = [
  { keywords: ['laptop', 'notebook', 'gaming laptop'], url: 'https://adify.store/blog/best-gaming-laptop-under-70000-india-2026', topic: 'gaming laptops under ₹70,000' },
  { keywords: ['ac', 'air conditioner'],               url: 'https://adify.store/blog/best-1-5-ton-ac-india-2026', topic: '1.5 ton ACs in India' },
  { keywords: ['earphone', 'earbuds', 'headphone'],    url: 'https://adify.store/blog/apple-airpods-pro-2-review-india-2026', topic: 'premium earphones in India' },
  { keywords: ['smartwatch', 'wearable'],              url: 'https://adify.store/blog/best-smartwatch-under-5000-india-2026', topic: 'budget smartwatches in India' },
  { keywords: ['phone', 'smartphone', 'mobile'],       url: 'https://adify.store/blog/best-5g-phone-under-20000-india-2026', topic: '5G phones under ₹20,000' },
  { keywords: ['monitor', 'display'],                  url: 'https://adify.store/blog/best-27-inch-monitor-india-2026', topic: '27-inch monitors for India' },
  { keywords: ['tech', 'gadget', 'review'],            url: 'https://adify.store', topic: 'Indian consumer tech' },
]

const EXCLUDE_DOMAINS = [
  'amazon.in', 'flipkart.com', 'youtube.com', 'instagram.com',
  'facebook.com', 'twitter.com', 'reddit.com', 'quora.com',
  'adify.store', '91mobiles.com', 'gadgets360.com', 'gsmarena.com',
  'digit.in', 'techradar.com', 'rtings.com', 'notebookcheck.net',
]

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

function loadLog() {
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')) }
  catch { return { sent: [], runs: [] } }
}

function saveLog(log) { fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2)) }

function alreadyContacted(log, domain) {
  return log.sent.some((s) => s.domain === domain)
}

function countSentThisWeek(log) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return log.sent.filter((s) => new Date(s.timestamp).getTime() > weekAgo).length
}

function extractDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') }
  catch { return null }
}

function isExcluded(domain) {
  return !domain || EXCLUDE_DOMAINS.some((ex) => domain.includes(ex))
}

function findMatchingPost(title, snippet) {
  const text = (title + ' ' + snippet).toLowerCase()
  for (const { keywords, url, topic } of POST_MATCH) {
    if (keywords.some((kw) => text.includes(kw))) return { url, topic }
  }
  return { url: 'https://adify.store', topic: 'Indian consumer tech' }
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'AdifyBot/1.0' }, timeout: 8000 }, (res) => {
      let d = ''
      res.on('data', (c) => (d += c))
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve(d) } })
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')))
  })
}

function jsonPost(hostname, urlPath, data, headers = {}) {
  const body = JSON.stringify(data)
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname, path: urlPath, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
    }, (res) => {
      let d = ''
      res.on('data', (c) => (d += c))
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }) } catch { resolve({ status: res.statusCode, body: d }) } })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function searchBlogs(query) {
  if (!GOOGLE_KEY || !GOOGLE_CX) return []
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&num=10`
  try {
    const data = await httpsGet(url)
    return (data.items || []).map((item) => ({
      title:   item.title,
      url:     item.link,
      domain:  extractDomain(item.link),
      snippet: item.snippet || '',
    }))
  } catch (e) {
    console.warn(`  Search error: ${e.message}`)
    return []
  }
}

async function findContactEmail(domain) {
  const urls = [
    `https://${domain}/contact`,
    `https://${domain}/contact-us`,
    `https://www.${domain}/contact`,
  ]
  for (const url of urls) {
    try {
      const u   = new URL(url)
      const html = await new Promise((resolve, reject) => {
        https.get({ hostname: u.hostname, path: u.pathname, headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 6000 }, (res) => {
          let d = ''
          res.on('data', (c) => (d += c))
          res.on('end', () => resolve(d))
        }).on('error', reject).on('timeout', () => reject(new Error('timeout')))
      })
      const emailMatch = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g)
      if (emailMatch) {
        const filtered = emailMatch.filter((e) =>
          !e.includes('example') && !e.includes('youremail') && !e.includes('noreply') &&
          !e.includes('@gmail') === false && true // allow gmail
        )
        if (filtered.length) return filtered[0]
      }
    } catch { /* skip */ }
  }
  return null
}

async function generateEmail(domain, siteTitle, ourPost, ourTopic) {
  if (!ANTHROPIC_KEY) throw new Error('Missing ANTHROPIC_API_KEY')

  const prompt = `Write a short, friendly outreach email to a tech blogger in India. We run adify.store, an independent Indian tech review site.

Context:
- Their site: ${domain} (${siteTitle})
- Our relevant article: ${ourPost}
- Topic overlap: ${ourTopic}
- Goal: suggest a content partnership, guest post exchange, or natural link mention

Requirements:
- Under 120 words total
- Subject line on the first line as "Subject: [subject here]"
- Casual and genuine, not salesy or templated-sounding
- Mention something specific about what we cover (Indian pricing, local warranty, value recommendations)
- One clear ask (could they check out our guide and consider mentioning it if relevant)
- Sign off as Ritik, founder of Adify

Write just the email body (subject + body), nothing else.`

  const res = await jsonPost(
    'api.anthropic.com',
    '/v1/messages',
    {
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages:   [{ role: 'user', content: prompt }],
    },
    { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' }
  )

  if (res.status !== 200) throw new Error(`Claude error ${res.status}`)
  return res.body.content?.[0]?.text || ''
}

async function sendEmail(toEmail, subjectLine, bodyText) {
  if (!RESEND_KEY) throw new Error('Missing RESEND_API_KEY')

  const htmlBody = bodyText
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => `<p style="margin:0 0 12px">${l}</p>`)
    .join('')

  const res = await jsonPost(
    'api.resend.com',
    '/emails',
    {
      from:    `${FROM_NAME} <${FROM_EMAIL}>`,
      to:      [toEmail],
      subject: subjectLine,
      html:    `<div style="font-family:sans-serif;max-width:480px;color:#222">${htmlBody}</div>`,
      text:    bodyText,
    },
    { Authorization: `Bearer ${RESEND_KEY}` }
  )

  if (res.status !== 200 && res.status !== 201) throw new Error(`Resend error ${res.status}: ${JSON.stringify(res.body)}`)
  return res.body.id
}

async function main() {
  console.log(`Backlink Outreach starting — ${new Date().toISOString()}`)

  if (!ANTHROPIC_KEY) { console.error('Missing ANTHROPIC_API_KEY'); process.exit(1) }
  if (!RESEND_KEY)    { console.error('Missing RESEND_API_KEY'); process.exit(1) }
  if (!GOOGLE_KEY || !GOOGLE_CX) { console.error('Missing GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ENGINE_ID'); process.exit(1) }

  const log = loadLog()
  let sentThisWeek = countSentThisWeek(log)

  if (sentThisWeek >= MAX_WEEKLY_EMAILS) {
    console.log(`Already sent ${MAX_WEEKLY_EMAILS} emails this week — done.`)
    return
  }

  const runResults = { timestamp: new Date().toISOString(), contacted: [], errors: [] }
  const seenDomains = new Set()

  for (const query of SEARCH_QUERIES) {
    if (sentThisWeek >= MAX_WEEKLY_EMAILS) break

    console.log(`\nSearching: ${query}`)
    const results = await searchBlogs(query)
    console.log(`  Found ${results.length} results`)

    for (const result of results) {
      if (sentThisWeek >= MAX_WEEKLY_EMAILS) break

      const { domain, title, url, snippet } = result
      if (!domain || isExcluded(domain) || seenDomains.has(domain)) continue
      if (alreadyContacted(log, domain)) {
        console.log(`  Already contacted: ${domain}`)
        continue
      }
      seenDomains.add(domain)

      console.log(`  Checking ${domain}...`)

      // Find contact email
      const email = await findContactEmail(domain)
      if (!email) { console.log(`  No email found for ${domain}`); continue }
      console.log(`  Email found: ${email}`)

      // Match to relevant post
      const { url: postUrl, topic } = findMatchingPost(title, snippet)

      // Generate email
      let emailText
      try {
        emailText = await generateEmail(domain, title, postUrl, topic)
      } catch (e) {
        console.warn(`  Email generation failed: ${e.message}`)
        continue
      }

      // Parse subject line
      const lines      = emailText.trim().split('\n')
      const subjectLine = lines[0].replace(/^Subject:\s*/i, '').trim()
      const bodyLines  = lines.slice(1).join('\n').trim()

      // Send
      try {
        const emailId = await sendEmail(email, subjectLine, bodyLines)
        log.sent.push({
          timestamp: new Date().toISOString(),
          domain,
          email,
          subject: subjectLine,
          postUrl,
          resendId: emailId,
        })
        runResults.contacted.push({ domain, email, subject: subjectLine })
        sentThisWeek++
        console.log(`  ✓ Sent to ${email} (${emailId})`)
      } catch (e) {
        console.warn(`  Send failed: ${e.message}`)
        runResults.errors.push({ domain, error: e.message })
      }

      await sleep(3000)
    }

    await sleep(2000)
  }

  log.runs = [runResults, ...(log.runs || [])].slice(0, 20)
  saveLog(log)

  console.log(`\nDone. Emails sent: ${runResults.contacted.length} | Errors: ${runResults.errors.length}`)
  console.log(`Total sent this week: ${sentThisWeek}/${MAX_WEEKLY_EMAILS}`)
  if (runResults.contacted.length > 0) {
    runResults.contacted.forEach((c) => console.log(`  → ${c.domain} <${c.email}>`))
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
