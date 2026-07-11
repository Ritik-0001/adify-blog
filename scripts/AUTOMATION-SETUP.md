# Adify Automation Setup Guide

Five automation pipelines run via GitHub Actions. Here's how to enable each one.

---

## GitHub Secrets Required

Go to: **Settings → Secrets and variables → Actions → New repository secret**
URL: `https://github.com/Ritik-0001/adify-blog/settings/secrets/actions/new`

| Secret | Used By | How to Get |
|--------|---------|------------|
| `INDEXNOW_KEY` | System 1 (IndexNow) | Already set: `77623ef9-54ba-4d62-ac68-393ea0e807bd` |
| `REDDIT_CLIENT_ID` | System 2 (Reddit) | See Reddit API section below |
| `REDDIT_CLIENT_SECRET` | System 2 (Reddit) | See Reddit API section below |
| `REDDIT_USERNAME` | System 2 (Reddit) | Your Reddit username (e.g. `adifystore`) |
| `REDDIT_PASSWORD` | System 2 (Reddit) | Your Reddit account password |
| `ANTHROPIC_API_KEY` | Systems 4 & 5 | https://console.anthropic.com/keys |
| `GOOGLE_SEARCH_API_KEY` | Systems 4 & 5 | See Google Search API section below |
| `GOOGLE_SEARCH_ENGINE_ID` | Systems 4 & 5 | See Google Search API section below |
| `RESEND_API_KEY` | System 5 (Outreach) | https://resend.com/api-keys |

---

## System 1 — IndexNow (Already Live)

**Status: Active** — no setup needed.

Key file is live at: `https://adify.store/77623ef9-54ba-4d62-ac68-393ea0e807bd.txt`

Every time a post is published, the workflow automatically:
1. Pings IndexNow (notifies Bing, Yandex, etc.)
2. Pings Bing's sitemap endpoint directly

---

## System 2 — Reddit Auto-Posting

**Workflow:** `.github/workflows/reddit-auto-post.yml`
**Script:** `scripts/reddit-post.js`
**Trigger:** Automatically after each post is published
**Log:** `scripts/reddit-log.json`

### How to get Reddit API credentials

1. Go to https://www.reddit.com/prefs/apps
2. Click **"create another app..."** at the bottom
3. Fill in:
   - **Name:** AdifyBot
   - **Type:** Select **script**
   - **Redirect URI:** `http://localhost:8080`
4. Click **Create app**
5. You'll see:
   - **Client ID** — the string under "personal use script" (14 chars)
   - **Client Secret** — labeled "secret"
6. Add both as GitHub secrets (`REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`)
7. Add your Reddit account credentials as `REDDIT_USERNAME` and `REDDIT_PASSWORD`

### Important Reddit rules

- Your account must be **at least 30 days old** to post to most subreddits
- Do not post to r/india more than once per hour (the script enforces this)
- Read each subreddit's rules before the first post — some prohibit self-promotion
- Consider posting 10–15 helpful comments first before submitting links

### Subreddit mapping

| Category | Subreddits |
|----------|-----------|
| Laptops | r/india, r/IndianGaming |
| Appliances | r/india, r/IndiaInvestments |
| Audio | r/headphones, r/india |
| Phones/Smartphones | r/india, r/IndianGaming |
| Gaming | r/india, r/IndianGaming |
| All others | r/india |

---

## System 3 — Weekly Price Updater

**Workflow:** `.github/workflows/price-updater.yml`
**Script:** `scripts/update-prices.js`
**Schedule:** Every Sunday at 6am IST
**Log:** `scripts/price-log.json`

No additional secrets required — uses the default `GITHUB_TOKEN`.

### How it works

1. Loads all posts, sorted by when they were last price-checked (oldest first)
2. Processes up to 50 posts per run (3-second delay between requests)
3. Fetches Amazon India search results pages for each post's affiliate search term
4. Extracts the first price from the search results HTML
5. Updates the "Current Prices in India" table in the MDX file
6. Commits all changes → Vercel redeploys automatically

### Limitations

Amazon actively blocks scrapers. Expect 30–50% success rate on any given run.
Posts that fail will be retried on the next weekly run (oldest-first ordering).
If you want reliable price data, consider signing up for:
- **Rainforest API** (https://rainforestapi.com) — ~$50/month, reliable Amazon data
  Set `RAINFOREST_API_KEY` secret and the script can be updated to use it.

### Manual trigger

Go to: Actions → Weekly Price Updater → Run workflow

---

## System 4 — Quora Answer Generator

**Workflow:** `.github/workflows/quora-auto-answer.yml`
**Script:** `scripts/quora-monitor.js`
**Schedule:** Daily at 10am IST
**Queue:** `scripts/quora-queue.json`
**Log:** `scripts/quora-log.json`

Secrets needed: `ANTHROPIC_API_KEY`, `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`

### How to get Google Custom Search API

1. Go to https://console.cloud.google.com/
2. Create a new project (or use existing)
3. Enable the **Custom Search API**
4. Go to **APIs & Services → Credentials → Create API Key**
5. Copy the key → add as `GOOGLE_SEARCH_API_KEY`
6. Go to https://programmablesearch.google.com/
7. Click **Add** → create a search engine
   - Sites to search: `quora.com` (for System 4) or `*.in` (for System 5)
   - Name it "Adify Search"
8. Copy the **Search Engine ID (cx)** → add as `GOOGLE_SEARCH_ENGINE_ID`

> **Note:** Free tier = 100 queries/day. Both systems share this quota.

### How Quora posting works

Quora has no public posting API. The script generates answers and saves them to
`scripts/quora-queue.json`. To post them:

1. Open `scripts/quora-queue.json`
2. Copy the `answer` field for each `pending` entry
3. Go to the Quora question URL (the `url` field)
4. Paste and post the answer
5. Change the entry `status` from `"pending"` to `"posted"`

The queue file is committed to the repo after each daily run, so you can
review answers from GitHub's web interface.

---

## System 5 — Backlink Outreach

**Workflow:** `.github/workflows/backlink-outreach.yml`
**Script:** `scripts/backlink-outreach.js`
**Schedule:** Every Monday at 9am IST
**Log:** `scripts/outreach-log.json`

Secrets needed: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`

### Setting up ritik@adify.store with Resend

1. Go to https://resend.com/domains
2. Click **Add Domain** → enter `adify.store`
3. Add the DNS records Resend shows you (TXT + MX records in your domain's DNS)
4. Wait for verification (usually 5–30 minutes)
5. Once verified, emails from `ritik@adify.store` will send reliably
6. Go to https://resend.com/api-keys → create a key with Send access
7. Add as `RESEND_API_KEY` GitHub secret

### Weekly limits

The script caps at **10 emails per week** to avoid spam classification.
Outreach log (`scripts/outreach-log.json`) tracks all contacted domains to
ensure no site is contacted twice.

---

## Enabling / Disabling Each Automation

To **disable** any workflow without deleting it:

1. Go to Actions tab in GitHub
2. Click the workflow name
3. Click the `...` menu → **Disable workflow**

To **re-enable**: same steps → **Enable workflow**

Or edit the workflow YAML and comment out the `schedule:` block — push the
change and the cron will no longer fire.

---

## Monitoring

| Automation | Log file | Check this |
|------------|----------|-----------|
| Reddit | `scripts/reddit-log.json` | `success: true` entries |
| Price Updater | `scripts/price-log.json` | `updated` count in latest run |
| Quora | `scripts/quora-queue.json` | `pending` entries to post |
| Outreach | `scripts/outreach-log.json` | `sent` entries this week |

All logs are committed to the repo automatically so you can review them
directly in GitHub without SSH access.
