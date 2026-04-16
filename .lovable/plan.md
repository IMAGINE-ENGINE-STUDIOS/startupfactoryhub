

## Plan: Anonymous Event Experience Feedback

Add an anonymous feedback widget on the Hot Deals Portal where attendees can rate their experience of the live event (1–5 stars) and leave optional comments. Results are tallied live and shown publicly so the room can see aggregate sentiment.

### What gets built

**1. New database table `hot_deals_event_feedback`** (migration)
- `id uuid pk`, `rating int 1–5`, `comment text nullable`, `category text` (overall / pitches / production / community), `session_token text` (browser-local id, prevents duplicate submissions per browser), `created_at timestamptz`
- RLS: public `INSERT` allowed, public `SELECT` allowed (aggregate display), no UPDATE/DELETE.
- Unique constraint on `(session_token, category)` so each browser rates each category once.

**2. New component `HotDealsEventFeedback.tsx`**
- Anonymous — no name input, uses a random token stored in `localStorage` (`hot_deals_feedback_token`).
- Compact card with the same racing/industrial aesthetic (orange/red gradient, `racing-card` class, `font-futuristic` headings, Lucide `Star`/`MessageCircle` icons — no emojis).
- Star selector (1–5) + optional textarea + Submit button.
- After submit: shows "Thanks!" state and reveals live aggregate (average rating, total responses, recent anonymous comments stream).
- Realtime: subscribes to `hot_deals_event_feedback` INSERTs to update the aggregate live.
- Toggleable category tabs: Overall / Pitches / Production (default Overall).

**3. Mount on `HotDealsPortal.tsx`**
- Insert `<HotDealsEventFeedback />` between `HotDealsVoting` and `PartnersCarousel` (natural place after the race board).

### Aesthetic / rules respected
- No emojis — Lucide icons only.
- `racing-card` glassmorphism, orange `font-futuristic` headings.
- No fake/mock data — empty state shows "Be the first to rate".
- Anonymous: never collects user_id, name, or email. Uses a random local token to prevent the same browser spamming.

### Out of scope
- No moderation UI (can add later if abuse appears).
- Not tied to startup voting — that already exists in `HotDealsVoting`.

