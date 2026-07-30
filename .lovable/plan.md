# Weekly Investment Newsletter — Fridays, 1:00 PM EST

An automated newsletter that goes out every Friday at 1:00 PM Eastern to all platform users, combining Startup Factory Hub ecosystem activity with external startup-funding news.

## What the newsletter contains

1. **Funding Radar (external)** — top 6–10 startup funding rounds of the past 7 days pulled from the news API, each with startup name, round/amount when detected, one-line summary, source link.
2. **Inside the Hub (internal)** — new startups onboarded, new investments recorded in `investments`, new investors/mentors/accelerators joined, new events and resources from the last 7 days.
3. **Weekly numbers** — counts: new startups, new members, capital recorded this week.
4. Footer with unsubscribe link and a CTA to the platform.

## Data sources

- **External:** the news API already wired into `fetch-news` (uses the existing `WEBZ_API_TOKEN`). Queries such as "raises Series A", "seed round", "funding round", "venture capital", filtered to the last 7 days and deduplicated.
- **AI cleanup:** each article is passed through Gemini (Lovable AI gateway) to extract `{ startup, amount, round, investors, one_liner }` and drop irrelevant results. Only news with a detected startup + funding signal is kept.
- **Internal:** `companies`, `investments`, `profiles_data`, `events`, `resources` filtered on `created_at >= now() - 7 days`.

## Pieces to build

**1. New table `weekly_funding_news`** (cache + audit)
- `id`, `source_url` (unique), `title`, `startup_name`, `amount_text`, `round_type`, `investors`, `summary`, `image_url`, `published_at`, `week_of` (date), `created_at`
- RLS: read for authenticated, all writes service_role only; explicit GRANTs.

**2. New table `newsletter_sends`** (delivery log, prevents duplicate Friday sends)
- `id`, `week_of` (unique), `status`, `recipients_count`, `sent_count`, `error_count`, `last_error`, `html_snapshot`, `created_at`, `completed_at`
- Admin read-only via RLS; service_role writes.

**3. Edge function `collect-funding-news`**
- Calls the news API with the funding queries, dedupes by URL against `weekly_funding_news`, runs the AI extraction, inserts rows tagged with the current `week_of`.
- Safe to run repeatedly; stops on repeated 4xx and logs into `api_usage_logs` like `fetch-news` does.

**4. Edge function `send-weekly-newsletter`**
- Guard: exits if a `newsletter_sends` row for this `week_of` is already `sent`.
- Runs `collect-funding-news` logic first (fresh data), gathers internal stats, renders the HTML (same visual language as `weekly-digest`: dark shell, green gradient header, section cards, Lucide-style inline SVG marks — no emojis).
- Recipients: all `profiles_data` rows with a non-null email. Sent in batches of ~50 with a short delay between batches; per-batch errors recorded, never aborting the whole run.
- Accepts `{ testEmail }` in the body to send a single preview without touching the log.

**5. Scheduling (pg_cron + pg_net)**
- Cron entry runs Fridays at both 17:00 and 18:00 UTC; the function itself checks that the current `America/New_York` local hour is 13 before sending, so it lands at 1:00 PM Eastern in both EST and EDT and never double-sends (the `week_of` guard).

**6. Admin UI** — a "Weekly Investment Newsletter" card in the admin Emails tab (`EmailMonitor`) showing: next scheduled send, last send status/counts, the funding items collected for the current week, plus **Preview**, **Send test to me**, and **Run now** buttons. No changes to existing email panels beyond adding this card.

## Technical notes

- No new paid API keys required; reuses `WEBZ_API_TOKEN` and the AI gateway.
- Sending path reuses the same email transport as the existing `weekly-digest` function.
- Unsubscribe: newsletter respects a new `newsletter_opt_out` boolean on `profiles_data` (default false) with a one-click opt-out link handled by a small public edge route.
