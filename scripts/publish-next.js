#!/usr/bin/env node
/**
 * publish-next.js
 *
 * Moves the next MDX file from /posts/queue/ to /posts/.
 * Priority order: slugs listed in posts/queue/priority.txt come first,
 * then remaining files sorted oldest-mtime-first.
 * Always stamps the frontmatter date to today so the post appears at the top.
 */

const fs   = require('fs')
const path = require('path')

const queueDir    = path.join(__dirname, '..', 'posts', 'queue')
const postsDir    = path.join(__dirname, '..', 'posts')
const priorityFile = path.join(queueDir, 'priority.txt')

if (!fs.existsSync(queueDir)) {
  console.log('Queue directory not found — nothing to do.')
  process.exit(0)
}

// Build set of all queued .mdx files
const allQueued = fs
  .readdirSync(queueDir)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => {
    const fullPath = path.join(queueDir, f)
    return { name: f, slug: f.replace(/\.mdx$/, ''), fullPath, mtime: fs.statSync(fullPath).mtimeMs }
  })

if (allQueued.length === 0) {
  console.log('Queue is empty — nothing to publish.')
  process.exit(0)
}

// Build ordered list: priority slugs first, then by mtime ascending
let prioritySlugs = []
if (fs.existsSync(priorityFile)) {
  prioritySlugs = fs
    .readFileSync(priorityFile, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
}

const queueMap = new Map(allQueued.map((f) => [f.slug, f]))
const ordered  = []

// Add priority slugs that are still in queue
for (const slug of prioritySlugs) {
  if (queueMap.has(slug)) ordered.push(queueMap.get(slug))
}

// Then remaining files sorted oldest-first
const prioritySet = new Set(prioritySlugs)
const remaining   = allQueued
  .filter((f) => !prioritySet.has(f.slug))
  .sort((a, b) => a.mtime - b.mtime)
ordered.push(...remaining)

// Skip conflicts (already in /posts/)
const conflicts = []
const next = ordered.find((f) => {
  const dest = path.join(postsDir, f.name)
  if (fs.existsSync(dest)) { conflicts.push(f); return false }
  return true
})

if (conflicts.length > 0) {
  console.warn(
    `Skipped ${conflicts.length} conflict(s) — already exist in /posts/:\n` +
      conflicts.map((f) => `  • ${f.name}`).join('\n')
  )
}

if (!next) {
  console.log('All queued files already exist in /posts/ — nothing to publish.')
  process.exit(0)
}

// Move file and stamp today's date in frontmatter
const dest    = path.join(postsDir, next.name)
const today   = new Date().toISOString().split('T')[0]
let   content = fs.readFileSync(next.fullPath, 'utf8')

// Replace existing date field in frontmatter (between --- delimiters)
content = content.replace(/^(date:\s*)["']?[\d-]+["']?/m, `$1"${today}"`)

fs.writeFileSync(dest, content)
fs.unlinkSync(next.fullPath)

// Remove the published slug from priority.txt if present
if (fs.existsSync(priorityFile) && prioritySlugs.includes(next.slug)) {
  const updated = prioritySlugs.filter((s) => s !== next.slug).join('\n') + '\n'
  fs.writeFileSync(priorityFile, updated)
}

console.log(`Published: posts/queue/${next.name} → posts/${next.name}  (date → ${today})`)
console.log(`Remaining in queue: ${allQueued.length - conflicts.length - 1}`)
