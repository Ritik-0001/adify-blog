# Adify (adify.store) — Project Guide for Claude

This file orients any future Claude session working in this repo. Read it before writing posts or touching the publishing pipeline.

## What this is

`adify.store` is a Next.js 14 (App Router) Amazon-affiliate content site targeting **India**. It publishes "best X under ₹Y" / comparison / buying-guide blog posts, each ending in an Amazon India affiliate search link (`tag=adifystore-21`). The README describes it as "AI, SaaS & Tech — Reviewed and Ranked," but in practice the vast majority of content is Indian consumer-electronics and home-appliance buying guides (laptops, ACs, refrigerators, TVs, monitors, printers, water purifiers, audio, kitchen appliances, etc.), plus a smaller SaaS/comparisons vertical from the site's earlier phase.

Tech stack: Next.js 14 App Router, Tailwind (`@tailwindcss/typography`), MDX via `next-mdx-remote` + `remark-gfm`, frontmatter parsed with `gray-matter`. Posts render at `/blog/[slug]`. Deployed on Vercel — every push to `main` triggers a build.

## Directory structure

```
posts/                  # LIVE posts — getAllPosts() reads .mdx files directly here (not recursive)
posts/queue/             # Staged/pending posts — invisible to the blog until published
posts/queue/priority.txt # Ordered list of slugs (one per line) — publish order
app/blog/[slug]/         # Post page (renders MDX + frontmatter)
app/api/posts/create/    # POST endpoint for n8n / external content creation
app/admin/link-replacer/ # Unrelated admin tool: converts Amazon/Flipkart links in social
                          # media captions into affiliate links (ASIN lookup + PA-API search).
                          # Not part of the blog publishing flow — do not confuse the two.
lib/posts.ts              # getAllPosts()/getPostBySlug() — category is a free-form string,
                          # no fixed enum
scripts/publish-next.js  # Moves the next queued post into /posts (see below)
scripts/update-prices.js # Weekly price-table refresher
scripts/reddit-post.js, quora-monitor.js, backlink-outreach.js  # other automations (see below)
.github/workflows/       # 5 GitHub Actions — the entire automation layer
```

## How publishing actually works — READ THIS BEFORE ASKING "did it publish?"

Writing a file to `posts/queue/` does **not** put it live. A GitHub Action does that automatically:

- **`.github/workflows/publish-post.yml`** runs **8×/day** (every 2 hours, 08:00–22:00 IST) plus on manual dispatch / `repository_dispatch`.
- Each run calls `node scripts/publish-next.js`, which publishes **exactly one post**:
  1. Reads `posts/queue/priority.txt` — slugs listed there go first, in order.
  2. Any queued `.mdx` files not in `priority.txt` are appended, oldest-`mtime`-first.
  3. Picks the first candidate that doesn't already have a same-named file in `/posts/` (conflicts are skipped and logged, not overwritten).
  4. Stamps the frontmatter `date:` to *today* (so it sorts to the top of the blog listing).
  5. Moves the file `posts/queue/X.mdx` → `posts/X.mdx`, removes `X` from `priority.txt`.
  6. Commits as `"publish: move next queued post to /posts"` and pushes directly to `main`.
- On successful publish it also pings IndexNow and Bing's sitemap endpoint for the new URL.

**Consequence for every session:** the remote `main` branch moves on its own, independent of anything you do locally, roughly every 2 hours. Before pushing anything, and before trusting a local post/queue count, run:
```bash
git fetch origin main && git log --oneline HEAD..origin/main | wc -l
git pull --rebase origin main   # if behind
```
If you skip this, your push will be rejected as non-fast-forward, or worse, you'll silently reintroduce an already-published file into `posts/queue/`.

**Checking current counts** (published vs. queued):
```bash
ls posts/*.mdx | wc -l          # live post count
ls posts/queue/*.mdx | wc -l    # still queued
wc -l < posts/queue/priority.txt
```

## Other automations (GitHub Actions)

| System | Workflow | Schedule | Status |
|---|---|---|---|
| IndexNow / Bing ping | part of `publish-post.yml` | on every publish | **Active** |
| Weekly price updater | `price-updater.yml` → `scripts/update-prices.js` | Sundays 6am IST | Active — scrapes Amazon search result pages for each post's price table; ~30–50% success rate (Amazon blocks scrapers), retries oldest-first next week |
| Reddit auto-post | `reddit-auto-post.yml` → `scripts/reddit-post.js` | **disabled** (manual dispatch only; the `workflow_run` trigger is commented out) | Inactive |
| Quora answer generator | `quora-auto-answer.yml` → `scripts/quora-monitor.js` | **disabled** (cron commented out) | Inactive — writes to `scripts/quora-queue.json` for manual posting (no public Quora API) |
| Backlink outreach | `backlink-outreach.yml` → `scripts/backlink-outreach.js` | Mondays 9am IST, caps 10 emails/week | Active |

Full setup/credential instructions are in `scripts/AUTOMATION-SETUP.md` — read that before touching any workflow's secrets or re-enabling Reddit/Quora.

## Writing a new blog post

1. **Check for duplicates first**, in both directories:
   ```bash
   [ -f "posts/$SLUG.mdx" ] || [ -f "posts/queue/$SLUG.mdx" ] && echo DUPLICATE
   ```
2. **Write the file to `posts/queue/[slug].mdx`** — never write directly to `posts/`.
3. **Frontmatter** (all fields expected; `category` is free text, see taxonomy below):
   ```yaml
   ---
   title: "Best Laptop Under ₹55000 India 2026"
   slug: "best-laptop-under-55000-india-2026"
   date: "2026-09-07"          # gets overwritten to publish-day date automatically
   category: "Laptops"
   description: "One or two sentences, direct-answer style, used on cards/meta."
   seo_title: "..."
   seo_description: "..."
   affiliate_link: "https://www.amazon.in/s?k=SEARCH+TERM&tag=adifystore-21"
   affiliate_text: "Check ... on Amazon"
   ---
   ```
4. **Body format** (established convention across hundreds of posts — follow it):
   - First sentence directly answers the title's implied question (product + price + why), no throat-clearing intro.
   - A `> **Quick Pick:**` blockquote right after the intro paragraph(s), naming the top pick, price, key specs, and an inline Amazon link.
   - `---` divider, then `## Numbered product sections` (1., 2., 3. …) each with price, specs, a short "why this matters" paragraph, and an Amazon search link.
   - Close with a short `## Recommendation` / "who should buy what" section.
   - Target 800–1,200 words. Real brand/model names and real-looking ₹ pricing throughout, not generic placeholders.
5. **Add the new slug(s) to the top of `posts/queue/priority.txt`** (prepend, one slug per line, no extension) so the publish Action picks them up ahead of whatever's already queued. Time-sensitive content (festive sales, etc.) should go first.
6. **Commit and push** `posts/queue/*.mdx` + `priority.txt`. You do **not** need to move files into `/posts/` yourself or run the publish script — the scheduled Action does that within a couple of hours.

## The #1 recurring build-breaker: `<` immediately before a digit

MDX parses a bare `<` followed by a digit as the start of a JSX tag and **fails the entire Vercel build** (`Unexpected character... before name, expected a character that can start a name`). This has broken production more than once in this project's history.

- ❌ `under ₹10000`, `<45dB`, `ΔE<2`, `<2 seconds`
- ✅ `under ₹10,000`, `under 45dB`, `ΔE under 2`, `under 2 seconds`

**Before pushing any batch of new/edited posts, grep for it:**
```bash
grep -rlE '<[0-9]' posts/*.mdx posts/queue/*.mdx
```
(Use `-E`, not `-P` — Git Bash's grep on Windows doesn't support PCRE.) If Vercel build logs ever show this error for a specific slug, it's always this pattern — find it with the grep above scoped to that file and rewrite with words ("under", "over") instead of `<`/`>`.

## Category taxonomy (organic, not enforced by code)

`category` is a free string — `lib/posts.ts` does no validation or enum-checking. Over time the site has converged on a fairly specific taxonomy; reuse existing values rather than inventing new generic ones (check `grep -h "^category:" posts/*.mdx | sort -u` if unsure). Examples in active use: `Laptops`, `Inverter AC`, `Appliances`, `Refrigerators`, `Washing Machines`, `TVs`, `Monitors`, `Audio`, `Kitchen`, `Smartphones`, `Dash Cams`, `Electric Scooters`, `Electric Toothbrushes`, `Fitness Equipment`, `Photography & Drones`, `Robot Vacuums`, `Health`, `SaaS`, `Accessories`, `Comparisons` (used heavily for "X vs Y" posts).

## Cross-linking budget posts to high-ticket posts

There's a standing pattern (added Sept 2026) of appending a `## You Might Also Need` section to the bottom of budget-tier posts (roughly under ₹5,000), linking to a topically-related higher-ticket post to route cheap-intent traffic toward higher-commission products. Format:
```markdown

---

## You Might Also Need

{One-line teaser}. [{Target post title}](/blog/{target-slug}).
```
Link to a topically adjacent premium post (power banks/webcams/routers → laptops; earbuds/headphones/speakers → premium soundbar; kitchen small appliances → refrigerator; smartwatches → premium electric scooter or similar lifestyle upgrade; personal care/misc → a general "premium deals"/"big ticket" guide). When doing this at scale, a small bash script appending to matching files by category is far faster than editing one-by-one — see git history around commit `332fd95` for the exact approach used.

## Hindi-language posts

A handful of posts (`bharat-mein-*` slugs) are written entirely in Hindi (Devanagari script) for the Indian Hindi-speaking search audience, using the same frontmatter/structure/Quick-Pick format as English posts. `category` and slugs stay in English/romanized form; only the body and title are Hindi.

## Practical gotchas learned the hard way

- **Windows path typos**: this machine's working directory is `c:\Users\HP\Desktop\blogAutomation` (also seen as `C:\Users\HP\Desktop\blogAutomation` — case varies harmlessly). A stray `c:\HP\...` (missing `Users\`) silently creates files in an unrelated `C:\HP\` system directory — always double-check absolute paths before a `Write`.
- **CRLF warnings on `git add`** (`LF will be replaced by CRLF`) are expected/harmless on this Windows checkout — don't try to "fix" them.
- **`amazon.in/s?k=...&tag=adifystore-21`** is the standard affiliate search-link format used everywhere in this repo (no product-specific ASINs in blog posts — those are reserved for the separate link-replacer admin tool's social-caption use case).
- Slug collisions: if a `Write` to `posts/queue/X.mdx` reports "updated successfully" instead of "created," a file with that slug already existed — verify it wasn't an accidental overwrite of real content before proceeding.
