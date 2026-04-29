## Goal

Build a public **/ignition** landing page that shares the matrix/cosmic visual language of the existing Ignition banner, presents the full program offer, and lets visitors apply to the **"Ignition — Startup Factory Hub"** cohort. Also seed that cohort in the database under the main Startup Factory Hub accelerator so the existing apply flow works.

## 1. Seed the cohort in DB (migration via insert tool)

Use the existing `accelerator_cohorts` table (already powers `/cohorts/:cohortId/apply`). Create one row:

- `accelerator_id` = the SFH accelerator profile (looked up by `organization_name ILIKE '%startup factory%'`, fallback to oldest `accelerator_profiles` row per Core memory rule)
- `name` = `Ignition`
- `description` = full Ignition pitch (1 week in Orlando, Demo Day at KSC, mentorship, advisory, tech access, company registration, webinars, industry day, networking with Orlando tech ecosystem, social media exposure)
- `status` = `applications_open`
- `focus_industries` = `['Aerospace','Deep Tech','Photonics','AI/ML']`
- `enrollment_fee` = 0, `payment_type` = `one_time`
- `max_startups` = 10

We will keep the cohort `id` returned and reference it from the landing page (no hardcoded UUID — page will look it up at runtime by name + accelerator).

## 2. New route + page: `/ignition`

Add lazy route `/ignition` → new `src/pages/Ignition.tsx` in `App.tsx`.

Page sections (matrix/cosmic aesthetic — reuses the same `ignition-cosmic-bg.jpg`, emerald palette, Courier matrix rain, HUD brackets, tech-card glassmorphism per Core memory):

1. **Hero** — full-bleed cosmic bg + animated matrix rain canvas overlay, large "IGNITION" gradient title (ecfdf5 → 10b981), subtitle "PROGRAM — Startup Factory Hub", tagline "1 Week in Orlando · Demo Day @ Kennedy Space Center", primary CTA **Apply to Cohort** (smooth-scroll to form), secondary "Learn more".
2. **What you get** grid (Lucide icons only, no emojis) — 9 tech-cards:
   - 1 Week in Orlando (Plane)
   - Presentation Day at KSC (Rocket)
   - Mentorship (Users)
   - Advisory (Briefcase)
   - Access to Technologies (Cpu)
   - U.S. Company Registration (Building2)
   - Webinars (Video)
   - Industry Day (Factory)
   - Networking with Orlando Tech Ecosystem (Network)
   - Social Media Exposure on platform (Megaphone)
3. **Program timeline / pillars** — reuse the 6-step pillars (01 LAND → 06 DEMO DAY) as horizontal stepper.
4. **Who it's for** — Seed-stage founders, Aerospace / Deep Tech / Photonics / AI chips.
5. **Apply form** — embedded inline (no redirect). Same fields and same insert as `PublicCohortApplication.tsx`: startup_name, founder_name, email, phone, industry, stage, website, pitch_deck_url, video_pitch_url, why_applying → insert into `public_cohort_applications` with the looked-up `cohort_id`. On success show the same green confirmation card.
6. **Footer** — small print, link to main site.

Loading state: page fetches the Ignition cohort once on mount (oldest row named `Ignition` under SFH accelerator). If not found, shows a friendly "Cohort coming soon" state instead of crashing.

## 3. Visual consistency rules

- Reuse `tech-card border-0` glassmorphism and emerald/teal color tokens.
- Matrix rain: extract the rain logic from `IgnitionProgramAnimatedBanner.tsx` into a small reusable `<MatrixRain />` background component used in the hero.
- HUD corner brackets on the hero card.
- Lucide icons everywhere — no emojis (Core rule).
- Mobile responsive: hero stacks, grid collapses to 1 col, form full-width.

## 4. Files

```text
NEW  src/pages/Ignition.tsx
NEW  src/components/marketing/MatrixRain.tsx       (extracted background)
EDIT src/App.tsx                                   (+ lazy route /ignition)
DB   insert 1 row into accelerator_cohorts         (Ignition cohort under SFH)
```

## 5. Out of scope

- No payment integration (cohort is free).
- No changes to existing `IgnitionProgramBanner` / `IgnitionProgramAnimatedBanner` — those stay as-is on `/marketing`.
- No edits to `PublicCohortApplication.tsx` — `/ignition` has its own embedded form for a tighter narrative, but writes to the same table so admin pipeline continues to work.
