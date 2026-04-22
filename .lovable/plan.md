

# Reminder Email + Auto-Start Tour for Official Mentors/Advisors

Two-part plan: (1) build a follow-up reminder email system for invitees who haven't finished their profile, and (2) auto-trigger the existing interactive tour for them after they accept the invitation, so onboarding becomes effortless.

## Part 1 — Reminder Email

### New Edge Function: `send-official-mentor-reminder`
Mirrors `send-official-mentor-invite` but with:
- Reminder-styled subject and copy ("Just one step left to unlock your Official badge").
- Re-uses the existing `invitation_token` (no new token) so the original invite link still works.
- Includes the 3-step checklist (Profile → Verify Email → Connection) with a clear CTA back to the invitation page.
- Adds `?startTour=1` to the invite URL so the tour kicks off automatically once they land in the dashboard.
- Records the reminder send in a new column on `official_mentor_invitations` (see schema change).

### Schema change (small, additive)
Add to `official_mentor_invitations`:
- `last_reminder_sent_at timestamptz NULL`
- `reminder_count int NOT NULL DEFAULT 0`

This lets admins see who was reminded and when, and prevents accidental spam.

### Admin UI updates — `OfficialProgramManagement.tsx`
In the "Invitations" table:
- Add a "Reminder" column showing last sent date + count.
- Add a per-row **"Send Reminder"** button (visible only when `status = 'pending'` and the email isn't suppressed).
- Add a top-of-table **"Send Reminder to All Pending"** bulk action.
- After sending, refresh the table.

In the "Member Progress" table (accepted but not yet official):
- Add a **"Nudge to Finish"** button per row that sends the same reminder template (helps people who accepted but stalled at step 2 or 3).

### Eligibility rules (enforced in the edge function)
- Only `status = 'pending'` invitations OR users whose `official_mentor_status.is_official = false`.
- Skip if `last_reminder_sent_at` is within the last 48 hours (rate limit).
- Skip suppressed emails.

## Part 2 — Auto-Start Tour After Acceptance

### `OfficialMentorInvite.tsx`
After successful acceptance, navigate to `/dashboard?startTour=1` instead of plain `/dashboard`.

### `Auth.tsx`
Preserve the `startTour=1` query param through the redirect chain so it survives sign-in/sign-up before the user reaches the dashboard.

### `InteractiveTour.tsx`
Add a small effect on mount that:
- Reads `?startTour=1` from the URL.
- If present AND `localStorage.sfh.tour.completed !== '1'`, dispatches `sfh:start-tour` automatically.
- Strips the param from the URL afterwards (so reloads don't restart it).

This reuses the entire existing tour engine — no new tour content, no new components.

## Technical Details

**Files created**
- `supabase/functions/send-official-mentor-reminder/index.ts` — new edge function.
- One migration adding `last_reminder_sent_at` and `reminder_count` to `official_mentor_invitations`.

**Files modified**
- `src/components/admin/OfficialProgramManagement.tsx` — per-row + bulk reminder buttons, new column, nudge button on Member Progress.
- `src/pages/OfficialMentorInvite.tsx` — append `?startTour=1` on post-accept navigation.
- `src/pages/Auth.tsx` — preserve `startTour` query param through the auth → dashboard redirect.
- `src/components/InteractiveTour.tsx` — auto-start when `?startTour=1` is present on the URL.

**Email infra**
- Uses the existing Resend integration (same as `send-official-mentor-invite`). No new secrets needed.
- Email template matches the existing branded look (gold accent `#d4a937`, dark header) with reminder-specific copy.

**No data deletion or destructive changes.** All new fields are additive; existing invitations keep working unchanged.

