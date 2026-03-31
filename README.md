# Adify

**AI, SaaS & Tech — Reviewed and Ranked.**

A Next.js 14 blog built for AI-assisted content publishing, with a REST API endpoint designed for n8n automation workflows.

---

## Tech Stack

- **Next.js 14** — App Router, server components, file-based routing
- **Tailwind CSS** + `@tailwindcss/typography` — dark theme, orange accents
- **MDX** via `next-mdx-remote` — rich content in `/posts/*.mdx`
- **gray-matter** — frontmatter parsing

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
adify/
├── app/
│   ├── layout.tsx                  # Root layout (Header + Footer)
│   ├── page.tsx                    # Homepage — hero + latest posts grid
│   ├── blog/
│   │   ├── page.tsx                # /blog — listing with category filter
│   │   └── [slug]/page.tsx         # /blog/[slug] — individual post + MDX
│   └── api/posts/create/
│       └── route.ts                # POST endpoint — called by n8n
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PostCard.tsx
│   └── CategoryFilter.tsx          # Client component — filters by URL param
├── lib/
│   └── posts.ts                    # getAllPosts() / getPostBySlug()
├── posts/                          # Live MDX files — auto-loaded by the blog
│   ├── best-saas-tools-2025.mdx
│   ├── best-laptops-developers-2025.mdx
│   └── queue/                      # Staged posts — NOT shown on the blog
│       └── example-queued-post.mdx
└── scripts/
    └── publish-next.js             # Moves oldest queue file → /posts/
```

---

## Frontmatter Reference

Every file in `/posts/` uses YAML frontmatter:

```yaml
---
title: "Post Title"
description: "Short description for cards and meta tags."
date: "2025-03-20"
slug: "post-slug"
category: "SaaS"            # SaaS | Laptops | Keyboards | Comparisons
affiliate_link: "https://..."
affiliate_text: "Try Free →"
seo_title: "SEO-optimized page title"
seo_description: "Meta description (150 chars max)"
---
```

All SEO fields (`seo_title`, `seo_description`) are pulled into `<head>` automatically via `generateMetadata`. OG tags and Twitter card tags are included.

---

## POST /api/posts/create

This endpoint accepts a JSON body and writes an `.mdx` file to `/posts/`. It is designed to be called by **n8n** (or any HTTP client).

### Endpoint

```
POST /api/posts/create
Content-Type: application/json
```

### Request Body

| Field              | Type   | Required | Description                                            |
|--------------------|--------|:--------:|--------------------------------------------------------|
| `title`            | string | ✅       | Post title                                             |
| `content`          | string | ✅       | MDX body (markdown + JSX)                              |
| `slug`             | string | ✅       | URL slug, e.g. `best-ai-tools-2025`                    |
| `description`      | string |          | Short summary shown in cards and meta tags             |
| `date`             | string |          | `YYYY-MM-DD` format — defaults to today                |
| `category`         | string |          | `SaaS` \| `Laptops` \| `Keyboards` \| `Comparisons`   |
| `affiliate_link`   | string |          | CTA button URL                                         |
| `affiliate_text`   | string |          | CTA button label, e.g. `"Try Free →"`                  |
| `seo_title`        | string |          | Overrides `<title>` tag                                |
| `seo_description`  | string |          | Overrides meta description                             |

### Success Response `201`

```json
{
  "success": true,
  "slug": "best-ai-tools-2025",
  "url": "/blog/best-ai-tools-2025"
}
```

### Error Response `400`

```json
{
  "error": "title, content, and slug are required fields"
}
```

### Example — curl

```bash
curl -X POST http://localhost:3000/api/posts/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Best AI Writing Tools 2025",
    "slug": "best-ai-writing-tools-2025",
    "description": "We tested 15 AI writing tools. Here are the ones worth paying for.",
    "date": "2025-03-20",
    "category": "SaaS",
    "affiliate_link": "https://example.com/ai-tools",
    "affiliate_text": "Try Free for 14 Days →",
    "seo_title": "Best AI Writing Tools 2025 — Adify",
    "seo_description": "Honest reviews of the top AI writing tools in 2025.",
    "content": "## Introduction\n\nAI writing tools have exploded in 2025...\n\n## Top Picks\n\n### 1. Tool Name\n\nDescription here."
  }'
```

---

## n8n Setup Guide

### Step 1 — Add an HTTP Request node

In your n8n workflow, add an **HTTP Request** node and configure it:

| Setting              | Value                                    |
|----------------------|------------------------------------------|
| Method               | `POST`                                   |
| URL                  | `http://your-domain.com/api/posts/create`|
| Body Content Type    | `JSON`                                   |
| Authentication       | None (or see API key section below)      |

### Step 2 — Map the JSON body

In the HTTP Request node's body, use this template and map your n8n expression fields:

```json
{
  "title": "{{ $json.title }}",
  "slug": "{{ $json.slug }}",
  "description": "{{ $json.description }}",
  "date": "{{ $now.format('YYYY-MM-DD') }}",
  "category": "{{ $json.category }}",
  "affiliate_link": "{{ $json.affiliate_link }}",
  "affiliate_text": "{{ $json.affiliate_text }}",
  "seo_title": "{{ $json.seo_title }}",
  "seo_description": "{{ $json.seo_description }}",
  "content": "{{ $json.content }}"
}
```

### Step 3 — Trigger options

| Trigger Type      | Use case                                          |
|-------------------|---------------------------------------------------|
| Schedule Trigger  | Publish posts on a recurring schedule             |
| Webhook Trigger   | Fire when an AI agent (e.g. GPT-4o) produces content |
| Manual Trigger    | Testing and one-off publishing                    |

### Step 4 — Securing the endpoint (recommended for production)

Add an API key check at the top of `app/api/posts/create/route.ts`:

```ts
const apiKey = req.headers.get('x-api-key')
if (apiKey !== process.env.CREATE_API_KEY) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Set `CREATE_API_KEY=your-secret-key` in `.env.local`, then add this header in your n8n HTTP Request node:

```
x-api-key: your-secret-key
```

---

## Queue-Based Publishing Workflow

Posts in `/posts/queue/` are **invisible to the blog** — `getAllPosts()` only reads `.mdx` files directly in `/posts/`, never from subdirectories. This lets you stage as many posts as you like without publishing them immediately.

### How it works end-to-end

```
n8n writes MDX           GitHub Action runs         Vercel auto-deploys
to /posts/queue/   →→→   scripts/publish-next.js  →→→  new post is live
via API call             (moves oldest file to          at /blog/[slug]
                          /posts/ + git push)
```

1. **n8n** generates content and calls `POST /api/posts/create` with `?queue=true` **or** writes directly to `/posts/queue/` via a separate workflow step
2. **n8n** then calls the GitHub API to fire the `publish-post` dispatch event
3. **GitHub Action** (`publish-post.yml`) runs `scripts/publish-next.js`
4. The script picks the **oldest file in `/posts/queue/`** (FIFO), moves it to `/posts/`, commits, and pushes
5. **Vercel** detects the push and redeploys automatically — the post is live

### Triggering the GitHub Action from n8n

Add an **HTTP Request** node in n8n after your content-creation step:

| Setting     | Value                                                                 |
|-------------|-----------------------------------------------------------------------|
| Method      | `POST`                                                                |
| URL         | `https://api.github.com/repos/{owner}/{repo}/dispatches`             |
| Auth header | `Authorization: Bearer {your_github_pat}`                            |
| Body        | `{ "event_type": "publish-post" }`                                    |

> **GitHub PAT scope required:** `repo` (for private repos) or `public_repo` (for public repos).

### Triggering manually

Go to **GitHub → Actions → Publish Next Queued Post → Run workflow**.

### Adding posts to the queue

**Option A — manually:** Drop any `.mdx` file with valid frontmatter into `/posts/queue/` and push to the repo.

**Option B — via n8n:** Point your n8n `POST /api/posts/create` endpoint call to write to `/posts/queue/` instead of `/posts/`. (You can extend the API route to accept a `?draft=true` query param that changes the target directory.)

### scripts/publish-next.js

The script is intentionally simple — no dependencies, runs with the Node.js that's already on the Actions runner:

- Reads all `.mdx` files from `/posts/queue/`
- Sorts by modification time ascending (oldest first = FIFO)
- Moves the first file to `/posts/` using `fs.renameSync`
- Exits with code `0` if the queue is empty (the Action still succeeds cleanly)
- Exits with code `1` if a slug conflict exists, preventing silent overwrites

---

## Deployment Notes

### Vercel (recommended)

```bash
npx vercel
```

> **Important:** Vercel's filesystem is ephemeral — files written to `/posts/` during a request won't persist across deployments. For production, consider one of:
> - **Self-host** on a VPS (Railway, Render, DigitalOcean) with a persistent volume mounted at `/posts/`
> - **Write to S3/R2** and pull posts from the bucket at build time
> - **Use a database** (PlanetScale, Supabase) to store post content and query it at render time

### Self-hosted (persistent filesystem)

```bash
npm run build
npm start
```

With a persistent volume, new posts written via `/api/posts/create` appear immediately at `/blog/[slug]` thanks to Next.js dynamic rendering.
