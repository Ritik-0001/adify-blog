#!/usr/bin/env node
/**
 * publish-next.js
 *
 * Moves the oldest MDX file from /posts/queue/ to /posts/.
 * Triggered by the GitHub Action on a schedule or via n8n → GitHub API.
 */

const fs = require('fs')
const path = require('path')

const queueDir = path.join(__dirname, '..', 'posts', 'queue')
const postsDir = path.join(__dirname, '..', 'posts')

if (!fs.existsSync(queueDir)) {
  console.log('Queue directory not found — nothing to do.')
  process.exit(0)
}

// Collect all .mdx files in the queue, sorted oldest-first (FIFO)
const queued = fs
  .readdirSync(queueDir)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => {
    const fullPath = path.join(queueDir, f)
    return { name: f, fullPath, mtime: fs.statSync(fullPath).mtimeMs }
  })
  .sort((a, b) => a.mtime - b.mtime)

if (queued.length === 0) {
  console.log('Queue is empty — nothing to publish.')
  process.exit(0)
}

// Skip any queued files that already exist in /posts/ (conflict resolution)
const conflicts = []
const next = queued.find((f) => {
  const dest = path.join(postsDir, f.name)
  if (fs.existsSync(dest)) {
    conflicts.push(f)
    return false
  }
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

const dest = path.join(postsDir, next.name)
fs.renameSync(next.fullPath, dest)

console.log(`Published: posts/queue/${next.name} → posts/${next.name}`)
console.log(`Remaining in queue: ${queued.length - conflicts.length - 1}`)
