# Automated MVP Program LinkedIn Campaign

Auto-post the MVP Development Program to the Startup Factory Hub LinkedIn Company Page every 2 days at 10:00 AM, each time with a freshly written announcement, a live countdown to the September 30, 2026 deadline, and a banner image that shows the remaining days.

## What each post contains

- A unique AI-written announcement (never the same twice), well structured: hook line, what founders get, who it is for, urgency line, call to action.
- Countdown: "X days left to apply" (to September 30, 2026).
- Cohort size: 20 startups per batch.
- Apply link: `https://startupfactoryhub.com/mvp-program?_build=2026-08-08T17%3A41%3A10.173Z`
- A generated MVP banner image (1200x630) matching the existing MVP banner design, with the badge showing the live day count and the 20-startup cohort size.

## How it works

```text
pg_cron (every 2 days, 10:00 AM)
        |
        v
 post-mvp-program  (edge function)
        |-- computes days-left to 2026-09-30
        |-- picks an unused "angle" + reads last 10 posts to avoid repeats
        |-- AI writes the post text (structured, with countdown + link)
        |-- renders MVP banner PNG (server-side SVG -> PNG)
        |-- uploads image to LinkedIn, publishes to the Company Page
        |-- logs result in marketing_posts_log
```

### 1. Banner renderer

Add an MVP variant to the existing server-side banner renderer (`supabase/functions/_shared/announcement-banner.ts`), reusing its resvg/SVG pipeline so no browser canvas is needed. It reproduces the current MVP banner look (dark tech grid, teal/cyan/indigo accents, SFH logo, "MVP DEVELOPMENT PROGRAM" headline, the deliverables row) with two dynamic fields:
- badge: `X DAYS LEFT TO APPLY`
- sub-line: `20 STARTUPS PER BATCH · DEADLINE SEP 30, 2026`

### 2. Copy generation

Uses Lovable AI (`openai/gpt-5.6-sol`) server-side. The prompt receives the program facts, the days remaining, the cohort size, the apply link, and the text of the last 10 posts so the model must produce a different angle and opening each run. Angles rotate through a themed list (founder pain, speed-to-market, mentorship, demo day, equity-free build, deadline urgency, etc.). If AI fails, the run is logged as failed and retried on the next schedule — no fake or duplicate content is posted.

### 3. Publishing

New edge function `post-mvp-program` reuses the same LinkedIn Company Page flow already used by `announce-new-startup`: reads the active row from `linkedin_org_tokens`, registers the image upload, PUTs the PNG, then publishes a `ugcPosts` IMAGE share authored by the org URN. Failures return the LinkedIn status and body and are logged.

### 4. Scheduling

A `pg_cron` job runs the function every 2 days at 10:00 AM (America/New_York, i.e. 14:00 UTC during EDT) and stops automatically after the September 30, 2026 deadline passes (the function exits early once days-left is below zero).

### 5. Admin controls in /marketing

A small "MVP Program Auto-Posting" card in the marketing page showing:
- next scheduled post, days remaining, campaign on/off toggle
- "Preview next post" (renders text + banner without posting)
- "Post now" (manual trigger)
- history table of previous auto-posts with status and LinkedIn post id

## Technical details

- New table `mvp_campaign_posts` (id, posted_at, days_left, angle, post_text, linkedin_post_id, status, error_message) with GRANTs and RLS limiting reads/writes to admins; the edge function writes with the service role.
- New setting row for enabled/disabled and the deadline date, so the deadline can be changed without a code edit.
- New edge function: `supabase/functions/post-mvp-program/index.ts`.
- Shared banner: extend `supabase/functions/_shared/announcement-banner.ts` with `renderMvpBanner()`.
- Cron created via a Supabase insert (not a migration) since it embeds the project URL and anon key.
- No changes to `src/components/marketing/MVPBanner.tsx` (the on-screen studio banner stays as is).
