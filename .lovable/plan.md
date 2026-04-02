

# Calendly-Like Booking System — Implementation Plan

## Overview
Build an internal scheduling/booking system where users can share their calendar via a public link, allow external or internal users to book time on their available slots, choose between virtual (Whereby room) or in-person meetings (with map pin), and optionally sync with Google/Microsoft calendars. No "Lovable" or "Whereby" branding on public links.

---

## Step 1 — Database Migration

Create new tables:

**`calendar_booking_settings`** — per-user booking preferences:
- `id` (uuid, PK), `user_id` (uuid, references profiles, unique), `booking_slug` (text, unique — used in public URL), `default_duration` (int, default 30), `buffer_minutes` (int, default 10), `timezone` (text, default 'UTC'), `google_calendar_connected` (bool), `microsoft_calendar_connected` (bool), `is_booking_enabled` (bool, default true), `created_at`, `updated_at`

**`calendar_bookings`** — individual bookings:
- `id` (uuid, PK), `host_id` (uuid, references profiles), `booker_id` (uuid, nullable — for logged-in users), `booker_name` (text), `booker_email` (text), `scheduled_at` (timestamptz), `duration_minutes` (int), `topic` (text), `status` (text: pending/confirmed/cancelled), `meeting_type` (text: virtual/in_person), `meeting_link` (text, nullable), `location` (text, nullable), `location_lat` (float, nullable), `location_lng` (float, nullable), `notes` (text), `created_at`

RLS policies:
- Hosts can read/update/delete their own bookings
- Bookers can read their own bookings
- Public insert allowed (for guest booking via public page)
- Settings readable by owner; slug lookup public (select by slug only)

---

## Step 2 — Public Booking Page (`/meet/:slug`)

New page: `src/pages/PublicBooking.tsx`
- Route: `/meet/:slug` (no Lovable/Whereby branding)
- Loads host's `calendar_booking_settings` by slug
- Loads host's availability from `mentor_availability` (by host user_id)
- Loads existing bookings to exclude occupied slots
- Shows host name + avatar (from profiles)
- Uses existing `Calendar` component to pick a date
- Shows available time slots for selected date
- Booker fills: name, email, topic, and selects **meeting type**:
  - **Virtual Meeting**: auto-creates a Whereby room via `create-whereby-room` edge function (label shown as "Video Call" — no Whereby branding)
  - **In-Person**: shows location input (text + optional lat/lng via Mapbox autocomplete)
- On submit: inserts into `calendar_bookings`, sends notification to host via existing `send-notification-email`
- Confirmation screen with meeting details

---

## Step 3 — Calendar Tab Enhancement (Dashboard)

Add to the Calendar tab across dashboards (Startup, Advisor, Mentor, Investor):

**"Share Calendar" button** — copies public booking URL (`startupfactoryhub.lovable.app/meet/{slug}`)

**"Calendar Settings" section** (collapsible or dialog):
- Set/edit booking slug
- Default meeting duration (15/30/45/60 min)
- Buffer time between meetings
- Toggle booking on/off
- Shareable link preview + copy button

**Bookings list** — show incoming bookings with status badges, option to confirm/cancel

---

## Step 4 — Availability Manager Reuse

The existing `AvailabilityManager` (using `mentor_availability` table) and `InvestorAvailabilityManager` already handle weekly slot management. The public booking page will query these tables by host user_id to determine available times.

No changes needed to the availability manager components themselves.

---

## Step 5 — In-Person Bookings on Map

When a booking has `meeting_type = 'in_person'` and `location_lat`/`location_lng`:
- Show these bookings as markers on the user's 4D Map view
- Use existing Mapbox integration and marker system
- Add a "Scheduled Meetings" layer to the map with date/time labels

---

## Step 6 — Google Calendar Sync (Edge Function)

Create `sync-google-calendar` edge function:
- Uses Google Calendar API (requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` secrets)
- OAuth flow: user connects Google account, tokens stored in `calendar_booking_settings`
- Push: platform bookings → Google Calendar events
- Pull: Google Calendar busy times → block booking slots

**Note**: User will need to provide Google OAuth credentials from Google Cloud Console.

---

## Step 7 — Microsoft Calendar Sync (Edge Function)

Create `sync-microsoft-calendar` edge function:
- Uses Microsoft Graph API (requires `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` secrets)
- Same OAuth + two-way sync pattern as Google

**Note**: User will need to provide Microsoft Azure app credentials.

---

## Files to Create
- `src/pages/PublicBooking.tsx` — public booking page
- `src/components/CalendarBookingSettings.tsx` — settings UI for booking preferences
- `src/components/BookingsList.tsx` — list of incoming bookings
- `src/hooks/useCalendarBookings.ts` — hook for bookings CRUD
- `src/hooks/useCalendarSettings.ts` — hook for settings CRUD
- `supabase/functions/sync-google-calendar/index.ts`
- `supabase/functions/sync-microsoft-calendar/index.ts`

## Files to Modify
- `src/App.tsx` — add `/meet/:slug` route
- `src/pages/Dashboard.tsx` — add Share Calendar button + settings to Calendar tab
- `src/pages/AdvisorDashboard.tsx` — same Calendar tab additions
- `src/pages/MentorDashboard.tsx` — same Calendar tab additions
- `src/pages/InvestorDashboard.tsx` — same Calendar tab additions

## Implementation Order
1. Fix current build error
2. Database migration (2 tables + RLS)
3. Hooks + Public booking page
4. Calendar tab enhancements (share + settings)
5. In-person meeting map markers
6. Google Calendar sync (requires user secrets)
7. Microsoft Calendar sync (requires user secrets)

