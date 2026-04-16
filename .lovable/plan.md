

## Plan: Hot Deals Feedback — Admin Dashboard view + Participant Feedback Page

Two additions on top of the existing `hot_deals_event_feedback` table.

### 1. Admin: new "Event Feedback" tab in Hot Deals admin area

Create `src/components/admin/HotDealsFeedbackManagement.tsx` and mount it as a new tab in `src/pages/AdminDashboard.tsx`.

Tab label: **Event Feedback** (icon: `Star`), tab key: `hot-deals-feedback`.

Component shows:
- **Summary cards** (top): total responses, overall average rating, response counts per category (Overall / Pitches / Production / Community).
- **Per-category breakdown**: average + 5★→1★ distribution bars (same visuals as the public widget but read-only).
- **Comments table**: every row from `hot_deals_event_feedback` with `created_at`, `category` badge, star rating, comment text, and a truncated `session_token` (so you can see if one browser submitted multiple categories).
- **Filters**: category dropdown, min-stars filter, "comments only" toggle, date range.
- **Export CSV** button (client-side download).
- **Realtime**: subscribes to INSERTs so new ratings appear live while admin watches.
- No emojis — Lucide `Star`, `MessageCircle`, `Users`, `Download`, `Filter` only.
- `tech-card border-0` styling consistent with other admin tabs.

No DB changes needed — RLS already allows public SELECT on the table.

### 2. Participant feedback page (shareable template)

New public route `/hot-deals/feedback` → `src/pages/HotDealsFeedbackPage.tsx`.

A standalone, full-page version of the feedback experience (so you can email/share the link to attendees who weren't in the live room or to send post-event):
- Header with the Hot Deals racing/industrial branding (orange gradient, `font-futuristic`, `Sparkles`/`Star` icons — no emojis).
- One-line context: "Tell us how the Hot Deals event went — anonymous, takes 30 seconds."
- Reuses `<HotDealsEventFeedback />` component (same anonymous flow, same dedupe via localStorage token, same realtime aggregate).
- After submit on all categories: a thank-you panel with a CTA back to `/hot-deals-space`.
- Add a small "Share this feedback page" button (copies `https://startupfactoryhub.com/hot-deals/feedback`) so admin can paste into emails/social.

Register the route in `src/App.tsx` next to the other Hot Deals routes.

### Out of scope
- No moderation/delete actions in admin (per earlier scope: anonymous, append-only). Can add later if abuse appears.
- No email blast — the admin can paste the new public link into the existing Email Monitor flow.

### Files

```text
new   src/components/admin/HotDealsFeedbackManagement.tsx
new   src/pages/HotDealsFeedbackPage.tsx
edit  src/pages/AdminDashboard.tsx        (add tab + import)
edit  src/App.tsx                          (add /hot-deals/feedback route)
```

No database migration, no edge function, no new secrets.

