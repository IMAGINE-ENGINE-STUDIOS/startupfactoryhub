

# Hot Deals Portal: Major Layout & Feature Overhaul

## Changes Overview

### 1. Move Live Pitch Room to the very top (below header, above banner)
Relocate the Whereby iframe to be the first thing users see, right after the header.

### 2. Redesign Agenda as a thin interactive ticker bar
Replace the full agenda card with a slim horizontal bar that auto-cycles through agenda items, showing the current topic with a progress indicator. Sits below the pitch room. Admin edit button still available via the password gate.

### 3. Bigger speaker profiles
Increase avatar to `h-24 w-24`, add larger text, show full bio. Make cards more prominent with a "credit card" style layout.

### 4. Bigger startup cards (credit-card style) with single vote per user
- Redesign cards to be large horizontal "credit card" style: big logo, company name, pitch title, full description, pitch deck link
- Change voting from 1-5 fire rating to **single vote per user** (one startup only). Users click one 🔥 to cast their vote for that startup
- Show real-time vote counts with animated fire effects when votes come in
- Registration required to vote (name + email via sessionStorage), but everyone sees live tallies

### 5. Real-time vote animation
Add a pulse/glow animation that triggers on each startup card when it receives a new vote via the realtime subscription.

### 6. Live Chat at the bottom
Create a new `HotDealsLiveChat` component:
- New `hot_deals_chat` table (id, sender_name, sender_email, message, created_at)
- Everyone can see messages in real-time (Supabase realtime subscription)
- Must register (name + email) to send messages — reuse the voter registration from sessionStorage
- Shows last 100 messages, auto-scrolls to bottom
- Orange-themed chat bubbles

### 7. Update agenda seed data
Update agenda items to reflect: 20 min NASA Technology Transfer Program speaking first, then 5 startups x 5 min pitching each.

## Database Changes

### New table: `hot_deals_chat`
```sql
CREATE TABLE public.hot_deals_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Public read, public insert, RLS enabled
```

### Modify voting: Change from 1-5 rating per startup to single vote across all startups
- Current: `UNIQUE(startup_id, voter_name)` with rating 1-5
- New behavior: Each voter_name can only vote for ONE startup total (not one per startup)
- We'll enforce this in the app layer by checking if voter_name exists in any row before inserting
- Keep the rating column but always insert rating=1 (simplifies the change)

## File Changes

### New: `src/components/HotDealsLiveChat.tsx`
- Real-time chat with registration gate
- Fetches last 100 messages, subscribes to inserts
- Registration reuses sessionStorage `hot_deals_voter` key

### Modified: `src/pages/HotDealsPortal.tsx`
- Reorder: Header → Pitch Room → Agenda Ticker → Banner → Speakers → Startup Cards → Live Chat → Widgets → Footer

### Modified: `src/components/HotDealsAgenda.tsx`
- Convert to thin ticker bar that auto-rotates through items
- Show current item prominently with time, collapsible to see full agenda

### Modified: `src/components/HotDealsSpeakers.tsx`
- Larger avatars (h-24 w-24), bigger text, full bio display, credit-card style layout

### Modified: `src/components/HotDealsVoting.tsx`
- Credit-card sized horizontal cards
- Single vote per user (one startup only, not 1-5 per startup)
- Real-time pulse animation on vote received
- Registration prompt includes name (reuse existing)
- Everyone sees live vote counts, only registered users can vote

### Migration
- Create `hot_deals_chat` table

