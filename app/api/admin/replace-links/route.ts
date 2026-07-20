import { NextRequest, NextResponse } from 'next/server'
import amazonPaapi from 'amazon-paapi'

// Each PA API call needs ~1.1s gap — allow up to ~50 links before timeout
export const maxDuration = 60

const TAG = process.env.ASSOCIATE_TAG || 'adifystore-21'

const commonParameters = {
  AccessKey: process.env.AMAZON_ACCESS_KEY ?? '',
  SecretKey: process.env.AMAZON_SECRET_KEY ?? '',
  PartnerTag: TAG,
  PartnerType: 'Associates' as const,
  Marketplace: 'www.amazon.in',
}

// ── Keyword extraction ────────────────────────────────────────────────────────

function keywordFromAmazonUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const kw = u.searchParams.get('k') || u.searchParams.get('q') || u.searchParams.get('field-keywords')
    if (kw) return decodeURIComponent(kw).replace(/\+/g, ' ')
    const segments = u.pathname.split('/').filter(Boolean)
    if (segments[0] && segments[0] !== 'dp' && segments[0] !== 's' && segments[0].length > 4) {
      return segments[0].replace(/-/g, ' ')
    }
  } catch (_) {}
  return null
}

function keywordFromFlipkartUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // Flipkart URL: /product-name-slug/p/itm... — first segment is the product slug
    const segments = u.pathname.split('/').filter(Boolean)
    if (segments[0] && segments[0] !== 'p' && segments[0].length > 4) {
      return segments[0].replace(/-/g, ' ')
    }
  } catch (_) {}
  return null
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
    return items[0].ASIN as string
  } catch (err: any) {
    const msg = err?.response?.data?.Errors?.[0]?.Message || err?.message || 'unknown'
    console.error(`PA API error for "${keyword}": ${msg}`)
    return null
  }
}

function buildAsinUrl(asin: string): string {
  return `https://www.amazon.in/dp/${asin}?tag=${TAG}`
}

// ── Link collection ───────────────────────────────────────────────────────────

type LinkJob = {
  originalUrl: string
  keyword: string
  label: string | null
}

const AMAZON_PATTERN = /https?:\/\/(?:www\.)?(?:amazon\.in|amzn\.in|amzn\.to)\/\S+/g
const FLIPKART_PATTERN = /https?:\/\/(?:www\.)?flipkart\.com\/\S+/g
const MARKDOWN_RE = /\[([^\]]+)\]\((https?:\/\/\S+?)\)/g

function collectJobs(text: string): LinkJob[] {
  const jobs: LinkJob[] = []
  const seen = new Set<string>()

  // Extract markdown links first so we can use label text as keyword
  let m: RegExpExecArray | null
  MARKDOWN_RE.lastIndex = 0
  while ((m = MARKDOWN_RE.exec(text)) !== null) {
    const [, label, url] = m
    if (seen.has(url)) continue
    seen.add(url)

    const isAmazon = /amazon\.in|amzn\.in|amzn\.to/.test(url)
    const isFlipkart = /flipkart\.com/.test(url)
    if (!isAmazon && !isFlipkart) continue

    const keyword = isFlipkart
      ? keywordFromFlipkartUrl(url) || label
      : keywordFromAmazonUrl(url) || label
    if (keyword) jobs.push({ originalUrl: url, keyword, label })
  }

  // Bare Amazon URLs
  AMAZON_PATTERN.lastIndex = 0
  while ((m = AMAZON_PATTERN.exec(text)) !== null) {
    const url = m[0].replace(/[).,;!]+$/, '') // trim trailing punctuation
    if (seen.has(url)) continue
    seen.add(url)
    const keyword = keywordFromAmazonUrl(url)
    if (keyword) jobs.push({ originalUrl: url, keyword, label: null })
  }

  // Bare Flipkart URLs
  FLIPKART_PATTERN.lastIndex = 0
  while ((m = FLIPKART_PATTERN.exec(text)) !== null) {
    const url = m[0].replace(/[).,;!]+$/, '')
    if (seen.has(url)) continue
    seen.add(url)
    const keyword = keywordFromFlipkartUrl(url)
    if (keyword) jobs.push({ originalUrl: url, keyword, label: null })
  }

  return jobs
}

function applyReplacements(text: string, map: Map<string, string>): string {
  let result = text
  // Sort longest URL first to avoid partial replacements
  const entries = Array.from(map.entries()).sort((a, b) => b[0].length - a[0].length)
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
    return NextResponse.json({ result: description, replaced: 0, log: ['No Amazon or Flipkart links found.'] })
  }

  // Deduplicate by keyword
  const keywordToAsin = new Map<string, string | null>()
  const uniqueKeywords = Array.from(new Set(jobs.map(j => j.keyword)))
  const log: string[] = []

  for (const keyword of uniqueKeywords) {
    const asin = await searchAsin(keyword)
    keywordToAsin.set(keyword, asin)
    if (asin) {
      log.push(`✓ "${keyword}" → ${asin}`)
    } else {
      log.push(`✗ "${keyword}" — not found, link unchanged`)
    }
    // 1.1s gap to stay within PA API rate limit
    await new Promise(r => setTimeout(r, 1100))
  }

  // Build replacement map: originalUrl → new ASIN URL
  const replacementMap = new Map<string, string>()
  for (const job of jobs) {
    const asin = keywordToAsin.get(job.keyword)
    if (asin) replacementMap.set(job.originalUrl, buildAsinUrl(asin))
  }

  const result = applyReplacements(description, replacementMap)
  return NextResponse.json({ result, replaced: replacementMap.size, total: jobs.length, log })
}
