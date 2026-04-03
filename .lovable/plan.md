# Hot Deals in the Space Industry — Event Portal

## Overview

Create a new event portal at `/hot-deals` similar to the Artemis Watch Party, but themed with orange colors, fire effects, and a startup pitch voting system. This is an invitation-only event where invited startups pitch and the audience votes in real-time using fire icons (1-5).

## Database (3 new tables via migration)

### `hot_deals_invited_startups`

Tracks startups invited to pitch at the event.

- `id` (uuid, PK)
- `user_id` (uuid, references profiles)
- `company_name`, `pitch_title`, `description`, `logo_url`
- `invited_at` (timestamptz)
- `confirmed` (boolean, default false)
- RLS: public read, authenticated insert/update own

### `hot_deals_votes`

Stores audience votes (no account required, name required).

- `id` (uuid, PK)
- `startup_id` (uuid, references hot_deals_invited_startups)
- `voter_name` (text, not null)
- `rating` (int, 1-5)
- `created_at` (timestamptz)
- RLS: public insert + select (anonymous voting allowed)

### `hot_deals_winner`

Single-row table to announce the winner.

- `id` (uuid, PK)
- `startup_id` (uuid, references hot_deals_invited_startups)
- `announced_at` (timestamptz)
- RLS: public read, admin-only insert

## New Components

### 1. `src/components/OrangeMatrixBackground.tsx`

Fork of `MatrixBackground.tsx` but uses orange hues (`hsl(25, 95%, 53%)`) instead of green. Add fire emoji characters (🔥) randomly in the character set for a fire-in-the-matrix effect.

### 2. `src/pages/HotDealsPortal.tsx`

Main portal page, structured like ArtemisWatchParty but orange-themed:

- **Header**: Back button, logo, "LIVE EVENT" badge (orange), INVITE/share menu (same pattern as Artemis)
- **Top**: Event banner area with "Hot Deals in the Space Industry" branding + date/time
- **Whereby Room**: 200-person community video room (new Whereby room URL for this event) full size mian screen 
- **Invited Startups Section**: Grid of startup profile cards (avatar, name, pitch title, deck pitch pdf, description) fetched from `hot_deals_invited_startups`
- **Voting Section**: Fire icon voting (1-5 🔥) per startup. Audience submits name once, then can vote on each startup. Real-time vote tallies displayed.
- **Winner Announcement**: When a row exists in `hot_deals_winner`, display a celebration banner with confetti-style animation showing the winning startup
- **3D Space Explorer**: Reuse `SpaceModelViewer` with NASA models
- **Space Arcade**: Reuse `SpaceArcade` component
- **Partners Carousel**: Reuse `PartnersCarousel` component
- **Share menu**: Same pattern as Artemis, with branded `startupfactoryhub.com/hot-deals` URL

### 3. `src/components/HotDealsVoting.tsx`

- Fetches invited startups from DB
- Shows each startup card with fire rating buttons (1-5 fire emojis)
- Prompts voter name via a simple input (stored in sessionStorage after first vote)
- Inserts vote into `hot_deals_votes`
- Realtime subscription to aggregate votes and display live totals (average rating, total votes per startup)
- Prevents duplicate votes per voter_name + startup_id (unique constraint in DB)

### 4. `src/components/HotDealsStartupProfiles.tsx`

- Grid display of registered/confirmed startups with their profile info
- Avatar, company name, pitch title, description
- Fetches from `hot_deals_invited_startups` where `confirmed = true`

### 5. `src/components/HotDealsWinner.tsx`

- Subscribes to `hot_deals_winner` table in realtime
- When a winner is announced, displays a celebration banner with the winning startup's info and final vote tally

## Email Template

### Edge Function: `send-hot-deals-invite`

Sends a branded invitation email to invited startups:

- Subject: "🔥 You're Invited — Hot Deals in the Space Industry"
- Body: Congratulations message, event details (April 16, 2026, 2:00-3:30 PM EST), "Be prepared to pitch", CTA button to the portal
- Orange-themed design matching the event branding
- From: `info@startupfactoryhub.com`

Also register the template in the Email Template Manager (`EmailTemplates.tsx`) for admin broadcast.

## Route Registration

Add `/hot-deals-space` route in `App.tsx`.

## Implementation Order

1. Database migration (3 tables + RLS + unique constraint on votes)
2. `OrangeMatrixBackground` component
3. `HotDealsVoting`, `HotDealsStartupProfiles`, `HotDealsWinner` components
4. `HotDealsPortal` page + route
5. `send-hot-deals-invite` edge function + email template registration
6. Share link branded as `startupfactoryhub.com/hot-deals-space`

## Files Created

- `src/components/OrangeMatrixBackground.tsx`
- `src/components/HotDealsVoting.tsx`
- `src/components/HotDealsStartupProfiles.tsx`
- `src/components/HotDealsWinner.tsx`
- `src/pages/HotDealsPortal.tsx`
- `supabase/functions/send-hot-deals-invite/index.ts`

## Files Modified

- `src/App.tsx` — add route
- `src/pages/EmailTemplates.tsx` — register template
- Migration SQL for 3 tables