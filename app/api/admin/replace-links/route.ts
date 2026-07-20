import { NextRequest, NextResponse } from 'next/server'
import amazonPaapi from 'amazon-paapi'

export const maxDuration = 60

const TAG = process.env.ASSOCIATE_TAG || 'adifystore-21'
const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━━'

const commonParameters = {
  AccessKey: process.env.AMAZON_ACCESS_KEY ?? '',
  SecretKey: process.env.AMAZON_SECRET_KEY ?? '',
  PartnerTag: TAG,
  PartnerType: 'Associates' as const,
  Marketplace: 'www.amazon.in',
}

// ── ASIN / URL helpers ────────────────────────────────────────────────────────

function buildAsinUrl(asin: string): string {
  return `https://www.amazon.in/dp/${asin}?tag=${TAG}`
}

function buildSearchUrl(keyword: string): string {
  return `https://www.amazon.in/s?k=${keyword.trim().replace(/\s+/g, '+').replace(/[+]india/i, '')}&tag=${TAG}`
}

function asinFromPath(url: string): string | null {
  const m = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)
  return m ? m[1].toUpperCase() : null
}

async function resolveRedirect(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; adify-bot/1.0)' },
    })
    return res.url
  } catch (err: any) {
    console.error(`Redirect failed for ${url}: ${err.message}`)
    return null
  }
}

// ── Flipkart keyword extraction ───────────────────────────────────────────────

const BRAND_CASES: Record<string, string> = {
  lg: 'LG', tcl: 'TCL', jbl: 'JBL', hp: 'HP', jvc: 'JVC',
  aoc: 'AOC', vu: 'Vu', mi: 'Mi', boat: 'boAt', oneplus: 'OnePlus',
  oppo: 'OPPO', poco: 'POCO', iqoo: 'iQOO',
}

const TV_OS: Record<string, string> = {
  webos: 'WebOS', tizen: 'Tizen', android: 'Android',
  vidaa: 'VIDAA', fire: 'Fire TV', google: 'Google TV',
}

function fkCap(s: string): string {
  return BRAND_CASES[s.toLowerCase()] ?? (s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
}

function keywordFromFlipkartUrl(rawUrl: string): string | null {
  const normalised = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
  try {
    const u = new URL(normalised)
    const slug = u.pathname.split('/').filter(Boolean)[0]
    if (!slug || slug === 'p' || slug.length <= 3) return null

    const segs = slug.split('-').filter(p => p.length > 0)
    if (segs.length < 2) return slug.replace(/-/g, ' ')

    const brand = fkCap(segs[0])
    const isTV = segs.some(s => s.toLowerCase() === 'tv')

    // Size: prefer "N inch"; fall back to converting cm (handles decimal "138-68-cm")
    let sizeInch: string | null = null
    for (let i = 0; i < segs.length - 1; i++) {
      if (/^\d+$/.test(segs[i]) && /^inch(es)?$/i.test(segs[i + 1])) {
        sizeInch = segs[i]; break
      }
    }
    if (!sizeInch) {
      for (let i = 0; i < segs.length - 1; i++) {
        if (/^\d{2,3}$/.test(segs[i])) {
          const nxt = segs[i + 1] ?? ''
          if (nxt === 'cm') { sizeInch = String(Math.round(parseInt(segs[i]) / 2.54)); break }
          if (/^\d{1,2}$/.test(nxt) && (segs[i + 2] ?? '') === 'cm') {
            sizeInch = String(Math.round(parseFloat(`${segs[i]}.${nxt}`) / 2.54)); break
          }
        }
      }
    }

    if (isTV) {
      const out: string[] = [brand]
      const GENERIC2 = new Set(['series', 'tv', 'smart', 'ultra', 'full', 'hd', 'led', 'lcd', 'new', 'cm', 'inch'])
      const second = segs[1] ?? ''
      if (second && !/^\d/.test(second) && !GENERIC2.has(second.toLowerCase())) out.push(fkCap(second))
      if (sizeInch) out.push(`${sizeInch} inch`)
      const miniIdx = segs.findIndex(s => s.toLowerCase() === 'mini')
      if (miniIdx !== -1 && (segs[miniIdx + 1] ?? '').toLowerCase() === 'led') out.push('Mini LED')
      const osWord = segs.find(s => TV_OS[s.toLowerCase()])
      if (osWord) out.push(TV_OS[osWord.toLowerCase()])
      out.push('Smart TV')
      return out.join(' ')
    }

    // Non-TV: brand + up to 3 meaningful words + size
    const SKIP = new Set([
      'cm','inch','inches','mm','hz','ghz','mhz','gb','tb','mb','ml','kg','w','watt','watts',
      'ultra','full','hd','4k','8k','fhd','uhd','qhd','led','lcd','ips','va','oled','amoled','qled',
      'with','and','for','the','of','buy','online','new','series','edition','ii','iii','iv','vi',
      'black','white','silver','gold','blue','red','green','grey','gray',
    ])
    const UNIT_NEXT = new Set(['cm','inch','inches','mm','gb','tb','hz','mhz','ghz'])
    const out: string[] = [brand]
    let added = 0
    for (let i = 1; i < segs.length && added < 3; i++) {
      const p = segs[i].toLowerCase()
      if (SKIP.has(p)) continue
      if (/^\d+$/.test(segs[i]) && UNIT_NEXT.has((segs[i + 1] ?? '').toLowerCase())) continue
      if (/^\d{1,2}$/.test(segs[i]) && (segs[i + 1] ?? '') === 'cm') continue
      out.push(fkCap(segs[i])); added++
    }
    if (sizeInch) out.push(`${sizeInch} inch`)
    return out.length > 1 ? out.join(' ') : null
  } catch (_) {}
  return null
}

function keywordFromAmazonUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const kw = u.searchParams.get('k') || u.searchParams.get('q') || u.searchParams.get('field-keywords')
    if (kw) return decodeURIComponent(kw).replace(/\+/g, ' ')
    const seg = u.pathname.split('/').filter(Boolean)
    if (seg[0] && seg[0] !== 'dp' && seg[0] !== 's' && seg[0].length > 4) return seg[0].replace(/-/g, ' ')
  } catch (_) {}
  return null
}

// ── Job types ─────────────────────────────────────────────────────────────────

type DirectJob   = { kind: 'direct';   originalUrl: string; asin: string;   name: string }
type RedirectJob = { kind: 'redirect'; originalUrl: string;                  name: string }
type SearchJob   = { kind: 'search';   originalUrl: string; keyword: string; name: string }
type Job = DirectJob | RedirectJob | SearchJob

function classifyUrl(url: string, name: string): Job | null {
  // link.amazon[.com]/ASIN — ASIN is the first path segment
  const linkAmazon = url.match(/link\.amazon(?:\.com)?\/([A-Z0-9]{9,12})(?:[/?#]|$)/i)
  if (linkAmazon) return { kind: 'direct', originalUrl: url, asin: linkAmazon[1].toUpperCase(), name }

  if (/amzn\.to|amzn\.in/i.test(url)) return { kind: 'redirect', originalUrl: url, name }

  if (/amazon\.in/i.test(url)) {
    const asin = asinFromPath(url)
    if (asin) return { kind: 'direct', originalUrl: url, asin, name }
    const kw = keywordFromAmazonUrl(url) || name
    if (kw) return { kind: 'search', originalUrl: url, keyword: kw, name }
    return null
  }

  if (/flipkart\.com/i.test(url)) {
    const keyword = keywordFromFlipkartUrl(url) || name
    if (keyword) return { kind: 'search', originalUrl: url, keyword, name }
    return null
  }

  return null
}

// ── URL detection ─────────────────────────────────────────────────────────────

const MD_RE            = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g
const BARE_HTTPS_RE    = /https?:\/\/(?:(?:www\.)?(?:amazon\.in|amzn\.to|amzn\.in|flipkart\.com)|link\.amazon(?:\.com)?)[^\s)>\],"']*/g
const BARE_LINK_AMAZON = /(?<![/\w])link\.amazon(?:\.com)?\/[A-Z0-9]{9,12}\b/gi
const BARE_FLIPKART    = /(?<![/\w])(?:www\.)?flipkart\.com\/[^\s)>\],"']*/gi

// Extract product name from text on the same line before the URL
function nameFromLine(url: string, text: string): string {
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = text.match(new RegExp(`([^\\n]*?)\\s*${escaped}`))
  if (!m?.[1]) return ''
  return m[1]
    .replace(/^\s*\d+[.)]\s*/, '')           // strip "1. "
    .replace(/\s*[→:•\-–—]+\s*$/, '')       // strip trailing separators
    .replace(/[\uD800-\uDFFF]/g, '')          // strip emoji (surrogate pairs)
    .trim()
    .slice(0, 80)
}

function collectJobs(text: string): Job[] {
  const jobs: Job[] = []
  const seen = new Set<string>()

  function add(url: string, label: string | null) {
    const clean = url.replace(/[.,;!?)'"\]]+$/, '')
    if (seen.has(clean)) return
    seen.add(clean)
    const name = (label || nameFromLine(clean, text)).trim()
    const job = classifyUrl(clean, name)
    if (job) jobs.push(job)
  }

  let m: RegExpExecArray | null
  MD_RE.lastIndex = 0
  while ((m = MD_RE.exec(text)) !== null) add(m[2], m[1])

  BARE_HTTPS_RE.lastIndex = 0
  while ((m = BARE_HTTPS_RE.exec(text)) !== null) add(m[0], null)

  BARE_LINK_AMAZON.lastIndex = 0
  while ((m = BARE_LINK_AMAZON.exec(text)) !== null) add(m[0], null)

  BARE_FLIPKART.lastIndex = 0
  while ((m = BARE_FLIPKART.exec(text)) !== null) add(m[0], null)

  return jobs
}

// ── PA API search ─────────────────────────────────────────────────────────────

async function searchAsin(keyword: string): Promise<string | null> {
  try {
    const response = await amazonPaapi.SearchItems(commonParameters, {
      Keywords: keyword,
      SearchIndex: 'All',
      ItemCount: 1,
      Resources: ['ItemInfo.Title'],
    })
    const items = (response as any)?.SearchResult?.Items
    if (!items?.length) return null
    return (items[0].ASIN as string).toUpperCase()
  } catch (err: any) {
    const msg = err?.response?.data?.Errors?.[0]?.Message || err?.message || 'unknown'
    console.error(`PA API error for "${keyword}": ${msg}`)
    return null
  }
}

// ── Description parsing helpers ───────────────────────────────────────────────

function extractTopic(text: string): string {
  for (const line of text.split('\n')) {
    const clean = line.replace(/[#*_~`]/g, '').replace(/[\uD800-\uDFFF]/g, '').trim()
    if (clean.length > 5 && !/^\d+:\d{2}/.test(clean) && !clean.startsWith('#')) {
      return clean.split(/\s+/).slice(0, 6).join(' ')
    }
  }
  return 'Check out these top picks'
}

function extractTimestamps(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^\d{1,2}:\d{2}/.test(l))
}

function extractHashtags(text: string): string[] {
  const raw = (text.match(/#[a-zA-Z][a-zA-Z0-9_]*/g) ?? [])
  const unique = Array.from(new Set(raw.map(h => h.toLowerCase())))
  return unique.filter(h => h !== '#adify').slice(0, 3)
}

function inferCategory(jobs: Job[]): { label: string; slug: string } {
  const allText = jobs.map(j => ('keyword' in j ? j.keyword : '') + ' ' + j.name).join(' ').toLowerCase()
  if (/\btv\b|television|smart tv|webos|tizen/.test(allText))   return { label: 'smart+tv',      slug: 'best-smart-tv-india-2026' }
  if (/headphone|earphone|earbuds|neckband/.test(allText))       return { label: 'headphones',    slug: 'best-headphones-india-2026' }
  if (/laptop/.test(allText))                                     return { label: 'laptop',        slug: 'best-laptops-india-2026' }
  if (/phone|smartphone|mobile/.test(allText))                   return { label: 'smartphones',   slug: 'best-smartphones-india-2026' }
  if (/speaker|soundbar/.test(allText))                          return { label: 'speakers',      slug: 'best-speakers-india-2026' }
  if (/camera/.test(allText))                                    return { label: 'cameras',       slug: 'best-cameras-india-2026' }
  if (/keyboard/.test(allText))                                  return { label: 'keyboards',     slug: 'best-keyboards-india-2026' }
  return { label: 'electronics', slug: 'best-electronics-india-2026' }
}

// ── Output builder ────────────────────────────────────────────────────────────

interface ProductLine { name: string; url: string }

function buildOutput(
  description: string,
  products: ProductLine[],
  category: { label: string; slug: string },
): string {
  const topic      = extractTopic(description)
  const timestamps = extractTimestamps(description)
  const hashtags   = extractHashtags(description)

  const categoryUrl = `https://www.amazon.in/s?k=${category.label}+india&tag=${TAG}`
  const adifyUrl    = `https://adify.store/blog/${category.slug}`
  const tags        = [...hashtags, '#adify'].join(' ')

  const lines: string[] = [
    `🔥 ${topic}`,
    '',
    DIVIDER,
    ...products.map(p => `${p.name} → ${p.url}`),
    DIVIDER,
    `🛒 ${categoryUrl}`,
    `🔍 ${adifyUrl}`,
  ]

  if (timestamps.length > 0) {
    lines.push(DIVIDER)
    lines.push(...timestamps)
  }

  lines.push(DIVIDER)
  lines.push(tags)
  lines.push('')
  lines.push('Affiliate links — no extra cost to you.')

  return lines.join('\n')
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!commonParameters.AccessKey || !commonParameters.SecretKey) {
    return NextResponse.json(
      { error: 'AMAZON_ACCESS_KEY and AMAZON_SECRET_KEY are not configured.' },
      { status: 500 }
    )
  }

  let description: string
  try {
    const body = await req.json()
    description = body.description
    if (typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'description field is required.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const jobs = collectJobs(description)
  if (jobs.length === 0) {
    return NextResponse.json({ result: description, replaced: 0, log: ['No product links found.'] })
  }

  const urlToFinalUrl = new Map<string, string>() // originalUrl → final affiliate URL
  const log: string[] = []

  // ── Step 1: direct (link.amazon, full amazon.in with /dp/) ───────────────
  for (const job of jobs) {
    if (job.kind === 'direct') {
      const url = buildAsinUrl(job.asin)
      urlToFinalUrl.set(job.originalUrl, url)
      log.push(`✓ direct   ${job.originalUrl} → ${job.asin}`)
    }
  }

  // ── Step 2: resolve amzn.to / amzn.in redirects (parallel) ──────────────
  const redirectJobs = jobs.filter((j): j is RedirectJob => j.kind === 'redirect')
  if (redirectJobs.length > 0) {
    const results = await Promise.all(
      redirectJobs.map(async j => ({ job: j, fullUrl: await resolveRedirect(j.originalUrl) }))
    )
    for (const { job, fullUrl } of results) {
      if (!fullUrl) {
        log.push(`✗ redirect ${job.originalUrl} — failed`)
        continue
      }
      const asin = asinFromPath(fullUrl)
      if (asin) {
        urlToFinalUrl.set(job.originalUrl, buildAsinUrl(asin))
        log.push(`✓ redirect ${job.originalUrl} → ${asin}`)
      } else {
        // Non-product page (goldbox, category, etc.) → generic deals link
        const fallback = `https://www.amazon.in/s?k=best+deals+today&tag=${TAG}`
        urlToFinalUrl.set(job.originalUrl, fallback)
        log.push(`~ redirect ${job.originalUrl} → no /dp/ — generic deals link`)
      }
    }
  }

  // ── Step 3: PA API searches (sequential, rate-limited) ───────────────────
  const searchJobs = jobs.filter((j): j is SearchJob => j.kind === 'search')
  const kwToAsin = new Map<string, string | null>()
  for (const job of searchJobs) {
    if (kwToAsin.has(job.keyword)) continue
    const asin = await searchAsin(job.keyword)
    kwToAsin.set(job.keyword, asin)
    log.push(asin ? `✓ search   "${job.keyword}" → ${asin}` : `✗ search   "${job.keyword}" — not found`)
    await new Promise(r => setTimeout(r, 1100))
  }
  for (const job of searchJobs) {
    const asin = kwToAsin.get(job.keyword)
    if (asin) urlToFinalUrl.set(job.originalUrl, buildAsinUrl(asin))
    // No fallback here — handled per-product in the output builder below
  }

  // ── Step 4: build product list ────────────────────────────────────────────
  const products: ProductLine[] = jobs.map(job => {
    const finalUrl = urlToFinalUrl.get(job.originalUrl)
    const displayName = job.name || ('keyword' in job ? job.keyword : 'asin' in job ? job.asin : '')

    if (finalUrl) return { name: displayName, url: finalUrl }

    // Unfound → Amazon search fallback (never leave a product linkless)
    const kw = ('keyword' in job ? job.keyword : displayName) + ' india'
    return { name: displayName, url: buildSearchUrl(kw) }
  })

  const category = inferCategory(jobs)
  const result   = buildOutput(description, products, category)

  return NextResponse.json({
    result,
    replaced: urlToFinalUrl.size,
    total: jobs.length,
    log,
  })
}
