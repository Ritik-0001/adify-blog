#!/usr/bin/env node
/**
 * quora-monitor.js
 * Searches for relevant Quora questions via Google Custom Search API,
 * generates helpful answers using Claude API, and saves them to a
 * queue file for review/posting (Quora has no public posting API).
 *
 * Run daily at 10am IST via quora-auto-answer.yml
 */

const https  = require('https')
const fs     = require('fs')
const path   = require('path')

const ANTHROPIC_KEY    = process.env.ANTHROPIC_API_KEY
const GOOGLE_KEY       = process.env.GOOGLE_SEARCH_API_KEY
const GOOGLE_CX        = process.env.GOOGLE_SEARCH_ENGINE_ID

const LOG_FILE   = path.join(__dirname, 'quora-log.json')
const QUEUE_FILE = path.join(__dirname, 'quora-queue.json')
const POSTS_DIR  = path.join(__dirname, '..', 'posts')

const MAX_ANSWERS_PER_DAY = 5

const SEARCH_QUERIES = [
  'site:quora.com best laptop india 2026',
  'site:quora.com best AC india 2026',
  'site:quora.com best earphones india 2026',
  'site:quora.com best smartwatch india 2026',
  'site:quora.com best washing machine india',
  'site:quora.com best water purifier india 2026',
  'site:quora.com best printer india 2026',
  'site:quora.com best robot vacuum india',
  'site:quora.com best gaming laptop india budget',
  'site:quora.com best phone under 20000 india 2026',
]

// Map question keywords to relevant Adify post slugs
const TOPIC_MAP = [
  { keywords: ['laptop', 'notebook'],                  slug: 'best-gaming-laptop-under-70000-india-2026' },
  { keywords: ['ac', 'air conditioner', 'aircon'],     slug: 'best-1-5-ton-ac-india-2026' },
  { keywords: ['earphone', 'earbuds', 'headphone'],    slug: 'apple-airpods-pro-2-review-india-2026' },
  { keywords: ['smartwatch', 'watch', 'fitness band'], slug: 'best-smartwatch-under-5000-india-2026' },
  { keywords: ['washing machine'],                     slug: 'best-6kg-washing-machine-india-2026' },
  { keywords: ['water purifier', 'ro', 'purifier'],    slug: 'best-water-purifier-india-2026' },
  { keywords: ['printer'],                             slug: 'best-printer-for-home-india-2026' },
  { keywords: ['robot vacuum', 'robot cleaner'],       slug: 'best-robot-vacuums-india-2026' },
  { keywords: ['phone', 'smartphone', 'mobile'],       slug: 'best-5g-phone-under-20000-india-2026' },
  { keywords: ['monitor', 'display', 'screen'],        slug: 'best-27-inch-monitor-india-2026' },
]

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

function loadLog() {
  try { return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')) }
  catch { return { answered: [], runs: [] } }
}

function saveLog(log) { fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2)) }

function loadQueue() {
  try { return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')) }
  catch { return { pending: [], posted: [] } }
}

function saveQueue(q) { fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 2)) }

function jsonPost(hostname, path_, data, headers = {}) {
  const body = JSON.stringify(data)
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname, path: path_, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
    }, (res) => {
      let d = ''
      res.on('data', (c) => (d += c))
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }) }
        catch { resolve({ status: res.statusCode, body: d }) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { 'User-Agent': 'AdifyBot/1.0' } }, (res) => {
      let d = ''
      res.on('data', (c) => (d += c))
      res.on('end', () => {
        try { resolve(JSON.parse(d)) }
        catch { resolve(d) }
      })
    }).on('error', reject)
  })
}

async function searchQuora(query) {
  if (!GOOGLE_KEY || !GOOGLE_CX) {
    console.warn('  No Google API keys — skipping search')
    return []
  }
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&num=5&dateRestrict=w2`
  try {
    const data = await httpsGet(url)
    if (!data.items) return []
    return data.items
      .filter((item) => item.link && item.link.includes('quora.com'))
      .map((item) => ({
        title: item.title?.replace(/ - Quora$/, '').trim(),
        url:   item.link,
        snippet: item.snippet || '',
      }))
  } catch (e) {
    console.warn(`  Search error: ${e.message}`)
    return []
  }
}

function findRelevantPost(question) {
  const q = question.toLowerCase()
  for (const { keywords, slug } of TOPIC_MAP) {
    if (keywords.some((kw) => q.includes(kw))) {
      // Verify the post file exists
      const fp = path.join(POSTS_DIR, `${slug}.mdx`)
      if (fs.existsSync(fp)) return `https://adify.store/blog/${slug}`
    }
  }
  return 'https://adify.store/blog'
}

async function generateAnswer(question, relevantUrl) {
  if (!ANTHROPIC_KEY) throw new Error('Missing ANTHROPIC_API_KEY')

  const prompt = `Write a helpful Quora answer for this question: "${question}"

Requirements:
- Give specific product recommendations for Indian buyers with ₹ prices
- Be genuinely helpful and informative (200-300 words)
- Sound like a knowledgeable person, not a marketer
- Mention 2-3 specific product names with approximate ₹ prices
- End with exactly this line (replace the URL): "For a detailed comparison with full specs and current prices, I've written a comprehensive guide: ${relevantUrl}"
- Do not use markdown headers, just paragraphs and maybe a short list
- Sound conversational and helpful, not promotional`

  const res = await jsonPost(
    'api.anthropic.com',
    '/v1/messages',
    {
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages:   [{ role: 'user', content: prompt }],
    },
    {
      'x-api-key':          ANTHROPIC_KEY,
      'anthropic-version':  '2023-06-01',
    }
  )

  if (res.status !== 200) throw new Error(`Claude API error ${res.status}: ${JSON.stringify(res.body)}`)
  return res.body.content?.[0]?.text || ''
}

function answeredToday(log, url) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  return log.answered.some((a) => a.url === url && new Date(a.timestamp) >= todayStart)
}

function countAnsweredToday(log) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  return log.answered.filter((a) => new Date(a.timestamp) >= todayStart).length
}

async function main() {
  console.log(`Quora Monitor starting — ${new Date().toISOString()}`)

  if (!ANTHROPIC_KEY) {
    console.error('Missing ANTHROPIC_API_KEY — cannot generate answers.')
    process.exit(1)
  }

  const log   = loadLog()
  const queue = loadQueue()
  let answeredCount = countAnsweredToday(log)

  if (answeredCount >= MAX_ANSWERS_PER_DAY) {
    console.log(`Already generated ${MAX_ANSWERS_PER_DAY} answers today — done.`)
    return
  }

  const runResults = { timestamp: new Date().toISOString(), newAnswers: 0, questions: [] }

  for (const query of SEARCH_QUERIES) {
    if (answeredCount >= MAX_ANSWERS_PER_DAY) break

    console.log(`\nSearching: ${query}`)
    const results = await searchQuora(query)
    console.log(`  Found ${results.length} Quora questions`)

    for (const result of results) {
      if (answeredCount >= MAX_ANSWERS_PER_DAY) break
      if (!result.title || !result.url) continue
      if (answeredToday(log, result.url)) {
        console.log(`  Already queued: ${result.title.slice(0, 60)}`)
        continue
      }

      console.log(`  Generating answer for: ${result.title.slice(0, 80)}`)
      const relevantUrl = findRelevantPost(result.title + ' ' + result.snippet)

      let answer
      try {
        answer = await generateAnswer(result.title, relevantUrl)
      } catch (e) {
        console.warn(`  Failed to generate answer: ${e.message}`)
        continue
      }

      const entry = {
        id:         Date.now().toString(),
        timestamp:  new Date().toISOString(),
        question:   result.title,
        url:        result.url,
        relevantUrl,
        answer,
        status:     'pending',
      }

      queue.pending.push(entry)
      log.answered.push({ url: result.url, timestamp: entry.timestamp })
      answeredCount++
      runResults.newAnswers++
      runResults.questions.push(result.title)

      console.log(`  ✓ Answer generated (${answer.length} chars) → saved to queue`)
      await sleep(2000)
    }

    await sleep(1000)
  }

  log.runs = [runResults, ...(log.runs || [])].slice(0, 30)
  saveLog(log)
  saveQueue(queue)

  console.log(`\nDone. New answers queued: ${runResults.newAnswers}`)
  console.log(`Queue file: scripts/quora-queue.json (${queue.pending.length} pending, ${queue.posted.length} posted)`)

  if (queue.pending.length > 0) {
    console.log('\nPending answers (review and post manually on Quora):')
    queue.pending.slice(0, 5).forEach((e, i) => console.log(`  ${i + 1}. ${e.question.slice(0, 80)}`))
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
