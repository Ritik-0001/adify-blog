import { NextRequest, NextResponse } from 'next/server'
import amazonPaapi from 'amazon-paapi'

export const maxDuration = 60

const TAG = process.env.ASSOCIATE_TAG || 'adifystore-21'

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

// Extracts ASIN from /dp/XXXXXXXXXX or /gp/product/XXXXXXXXXX path segments
function asinFromPath(url: string): string | null {
  const m = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)
  return m ? m[1].toUpperCase() : null
}

// Follows an amzn.to / amzn.in redirect and returns the resolved full URL
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

// ── Keyword extraction ────────────────────────────────────────────────────────

function keywordFromAmazonUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const kw =
      u.searchParams.get('k') ||
      u.searchParams.get('q') ||
      u.searchParams.get('field-keywords')
    if (kw) return decodeURIComponent(kw).replace(/\+/g, ' ')
    const seg = u.pathname.split('/').filter(Boolean)
    if (seg[0] && seg[0] !== 'dp' && seg[0] !== 's' && seg[0].length > 4) {
      return seg[0].replace(/-/g, ' ')
    }
  } catch (_) {}
  return null
}

// Brand names that need specific casing
const BRAND_CASES: Record<string, string> = {
  lg: 'LG', tcl: 'TCL', jbl: 'JBL', hp: 'HP', jvc: 'JVC',
  aoc: 'AOC', vu: 'Vu', mi: 'Mi', boat: 'boAt', oneplus: 'OnePlus',
  oppo: 'OPPO', poco: 'POCO', iqoo: 'iQOO',
}

// TV OS / platform names and their display form
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
    const parts = u.pathname.split('/').filter(Boolean)
    // Flipkart path: /<product-slug>/p/itm... — slug is always first segment
    const slug = parts[0]
    if (!slug || slug === 'p' || slug.length <= 3) return null

    const segs = slug.split('-').filter(p => p.length > 0)
    if (segs.length < 2) return slug.replace(/-/g, ' ')

    const brand = fkCap(segs[0])
    const isTV = segs.some(s => s.toLowerCase() === 'tv')

    // ── Extract size in inches ─────────────────────────────────────────────
    // Prefer explicit "N inch(es)" in slug; fall back to converting cm.
    // Flipkart sometimes writes decimal cm as two segments: "138-68-cm" = 138.68 cm
    let sizeInch: string | null = null
    for (let i = 0; i < segs.length - 1; i++) {
      if (/^\d+$/.test(segs[i]) && /^inch(es)?$/i.test(segs[i + 1])) {
        sizeInch = segs[i]
        break
      }
    }
    if (!sizeInch) {
      for (let i = 0; i < segs.length - 1; i++) {
        if (/^\d{2,3}$/.test(segs[i])) {
          const next = segs[i + 1] ?? ''
          if (next === 'cm') {
            sizeInch = String(Math.round(parseInt(segs[i]) / 2.54))
            break
          }
          // Decimal format: "138-68-cm"
          if (/^\d{1,2}$/.test(next) && (segs[i + 2] ?? '') === 'cm') {
            sizeInch = String(Math.round(parseFloat(`${segs[i]}.${next}`) / 2.54))
            break
          }
        }
      }
    }

    // ── TV-specific query: brand + model + size + tech/OS + "Smart TV" ─────
    if (isTV) {
      const out: string[] = [brand]

      // Model identifier: 2nd segment if it's a word (not a number/generic)
      const GENERIC_2ND = new Set(['series', 'tv', 'smart', 'ultra', 'full', 'hd', 'led', 'lcd', 'new', 'cm', 'inch'])
      const second = segs[1] ?? ''
      if (second && !/^\d/.test(second) && !GENERIC_2ND.has(second.toLowerCase())) {
        out.push(fkCap(second))
      }

      if (sizeInch) out.push(`${sizeInch} inch`)

      // "mini-led" — check adjacent parts
      const miniIdx = segs.findIndex(s => s.toLowerCase() === 'mini')
      if (miniIdx !== -1 && (segs[miniIdx + 1] ?? '').toLowerCase() === 'led') {
        out.push('Mini LED')
      }

      // OS / platform
      const osWord = segs.find(s => TV_OS[s.toLowerCase()])
      if (osWord) out.push(TV_OS[osWord.toLowerCase()])

      out.push('Smart TV')
      return out.join(' ')
    }

    // ── Non-TV: brand + up to 3 meaningful words + size ───────────────────
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
      // Skip bare measurement numbers (e.g. "138" before "cm", "68" as decimal)
      if (/^\d+$/.test(segs[i])) {
        const nxt = (segs[i + 1] ?? '').toLowerCase()
        if (UNIT_NEXT.has(nxt)) continue
        // Skip decimal fraction of a cm measurement: "138-68-cm"
        if (/^\d{1,2}$/.test(segs[i]) && (segs[i + 1] ?? '') === 'cm') continue
        const prev = (segs[i - 1] ?? '').toLowerCase()
        if (UNIT_NEXT.has(prev)) continue
      }
      out.push(fkCap(segs[i]))
      added++
    }
    if (sizeInch) out.push(`${sizeInch} inch`)

    return out.length > 1 ? out.join(' ') : null
  } catch (_) {}
  return null
}

// ── Job classification ────────────────────────────────────────────────────────

type DirectJob  = { kind: 'direct';   originalUrl: string; asin: string }
type RedirectJob= { kind: 'redirect'; originalUrl: string }
type SearchJob  = { kind: 'search';   originalUrl: string; keyword: string }
type Job = DirectJob | RedirectJob | SearchJob

function classifyUrl(url: string, label: string | null): Job | null {
  // ── link.amazon[.com]/ASIN — ASIN is the first path segment ──────────────
  // Handles https://link.amazon/ASIN and bare link.amazon/ASIN
  // Use ≥9 chars to be tolerant of slightly non-standard IDs
  const linkAmazon = url.match(/link\.amazon(?:\.com)?\/([A-Z0-9]{9,12})(?:[/?#]|$)/i)
  if (linkAmazon) {
    return { kind: 'direct', originalUrl: url, asin: linkAmazon[1].toUpperCase() }
  }

  // ── amzn.to / amzn.in short links — need redirect resolution ──────────────
  if (/amzn\.to|amzn\.in/i.test(url)) {
    return { kind: 'redirect', originalUrl: url }
  }

  // ── Full amazon.in URLs ────────────────────────────────────────────────────
  if (/amazon\.in/i.test(url)) {
    const asin = asinFromPath(url)
    if (asin) return { kind: 'direct', originalUrl: url, asin }
    const kw = keywordFromAmazonUrl(url) || label
    if (kw) return { kind: 'search', originalUrl: url, keyword: kw }
    return null
  }

  // ── Flipkart (bare or https) ───────────────────────────────────────────────
  if (/flipkart\.com/i.test(url)) {
    const keyword = keywordFromFlipkartUrl(url) || label
    if (keyword) return { kind: 'search', originalUrl: url, keyword }
    return null
  }

  return null
}

// ── URL detection from text ───────────────────────────────────────────────────

// Markdown links — capture label and URL
const MD_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g

// Bare HTTPS links (Amazon shortlinks, full amazon.in, full flipkart)
const BARE_HTTPS_RE = /https?:\/\/(?:(?:www\.)?(?:amazon\.in|amzn\.to|amzn\.in|flipkart\.com)|link\.amazon(?:\.com)?)[^\s)>\],"']*/g

// Bare link.amazon without https (e.g. link.amazon/B0hjOGS1V)
const BARE_LINK_AMAZON_RE = /(?<![/\w])link\.amazon(?:\.com)?\/[A-Z0-9]{10}\b/gi

// Bare flipkart.com without https (e.g. flipkart.com/product-slug/p/itm...)
const BARE_FLIPKART_RE = /(?<![/\w])(?:www\.)?flipkart\.com\/[^\s)>\],"']*/gi

function collectJobs(text: string): Job[] {
  const jobs: Job[] = []
  const seen = new Set<string>()

  function add(url: string, label: string | null) {
    // Trim trailing punctuation that isn't part of the URL
    const clean = url.replace(/[.,;!?)'"\]]+$/, '')
    if (seen.has(clean)) return
    seen.add(clean)
    const job = classifyUrl(clean, label)
    if (job) jobs.push(job)
  }

  // 1. Markdown links (label gives us a better keyword than the URL slug)
  MD_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = MD_RE.exec(text)) !== null) {
    add(m[2], m[1])
  }

  // 2. Bare HTTPS URLs
  BARE_HTTPS_RE.lastIndex = 0
  while ((m = BARE_HTTPS_RE.exec(text)) !== null) add(m[0], null)

  // 3. Bare link.amazon (no protocol)
  BARE_LINK_AMAZON_RE.lastIndex = 0
  while ((m = BARE_LINK_AMAZON_RE.exec(text)) !== null) add(m[0], null)

  // 4. Bare flipkart.com (no protocol)
  BARE_FLIPKART_RE.lastIndex = 0
  while ((m = BARE_FLIPKART_RE.exec(text)) !== null) add(m[0], null)

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
    const msg =
      err?.response?.data?.Errors?.[0]?.Message || err?.message || 'unknown'
    console.error(`PA API error for "${keyword}": ${msg}`)
    return null
  }
}

// ── Text replacement ──────────────────────────────────────────────────────────

function applyReplacements(text: string, map: Map<string, string>): string {
  // Sort longest original URL first to prevent partial matches
  const entries = Array.from(map.entries()).sort(
    (a, b) => b[0].length - a[0].length
  )
  let result = text
  for (const [original, replacement] of entries) {
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escaped, 'g'), replacement)
  }
  return result
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
    return NextResponse.json({
      result: description,
      replaced: 0,
      log: ['No Amazon or Flipkart links found.'],
    })
  }

  const replacementMap = new Map<string, string>()
  const log: string[] = []

  // ── Step 1: direct replacements (no I/O needed) ───────────────────────────
  for (const job of jobs) {
    if (job.kind === 'direct') {
      replacementMap.set(job.originalUrl, buildAsinUrl(job.asin))
      log.push(`✓ direct  ${job.originalUrl} → ${job.asin}`)
    }
  }

  // ── Step 2: resolve short-link redirects in parallel ─────────────────────
  const redirectJobs = jobs.filter((j): j is RedirectJob => j.kind === 'redirect')
  if (redirectJobs.length > 0) {
    const resolved = await Promise.all(
      redirectJobs.map(async j => {
        const fullUrl = await resolveRedirect(j.originalUrl)
        return { job: j, fullUrl }
      })
    )
    for (const { job, fullUrl } of resolved) {
      if (!fullUrl) {
        log.push(`✗ redirect ${job.originalUrl} — redirect failed, link unchanged`)
        continue
      }
      const asin = asinFromPath(fullUrl)
      if (asin) {
        replacementMap.set(job.originalUrl, buildAsinUrl(asin))
        log.push(`✓ redirect ${job.originalUrl} → ${asin} (via ${fullUrl})`)
      } else {
        // Non-product page (goldbox, /b/ category, /gp/ — no /dp/ in URL)
        // Replace with a generic affiliate search so the tag is still applied
        const fallback = `https://www.amazon.in/s?k=best+deals+today&tag=${TAG}`
        replacementMap.set(job.originalUrl, fallback)
        log.push(`~ redirect ${job.originalUrl} → no ASIN (${fullUrl}) — used generic deals link`)
      }
    }
  }

  // ── Step 3: PA API searches (sequential, rate-limited) ───────────────────
  const searchJobs = jobs.filter((j): j is SearchJob => j.kind === 'search')

  // Deduplicate by keyword so identical products are searched once
  const keywordToAsin = new Map<string, string | null>()
  for (const job of searchJobs) {
    if (keywordToAsin.has(job.keyword)) continue

    process.stdout.write(`Searching PA API: "${job.keyword}" ... `)
    const asin = await searchAsin(job.keyword)
    keywordToAsin.set(job.keyword, asin)
    console.log(asin ?? 'not found')

    // Stay within PA API 1 req/sec rate limit
    await new Promise(r => setTimeout(r, 1100))
  }

  for (const job of searchJobs) {
    const asin = keywordToAsin.get(job.keyword)
    if (asin) {
      replacementMap.set(job.originalUrl, buildAsinUrl(asin))
      log.push(`✓ search  "${job.keyword}" → ${asin}`)
    } else {
      log.push(`✗ search  "${job.keyword}" — not found, link unchanged`)
    }
  }

  const result = applyReplacements(description, replacementMap)
  return NextResponse.json({
    result,
    replaced: replacementMap.size,
    total: jobs.length,
    log,
  })
}
