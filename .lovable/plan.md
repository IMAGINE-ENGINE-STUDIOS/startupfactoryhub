# Changes: Calendar Booking Improvements

## 1. Remove empty bookings card

In `BookingsList.tsx`, remove the "No bookings yet" empty state card — just return `null` when no bookings exist (line 15-22).

## 2. Combine Availability + Blocked Times into one card

In `Dashboard.tsx` (and Mentor/Advisor/Investor dashboards), change the grid from 4 cards to 2 cards:

- Card 1: `CalendarBookingSettings`
- Card 2: Combined `AvailabilityScheduleCard` + `BlockedTimesCard` in a single card

Create a new combined component or simply nest both inside one `Card` wrapper in the dashboard layout.

## 3. Sync external bookings with UnifiedCalendar

In `UnifiedCalendar.tsx`:

- Import and fetch from `calendar_bookings` table (where `host_id` or `booker_id` matches current user)
- Map bookings to `CalendarItem` objects with a new type `'booking'` (or reuse `'session'`)
- Add realtime subscription for `calendar_bookings` table changes
- Display bookings alongside events, sessions, and pitches on the calendar

Add `'booking'` to the `CalendarItemType` union and handle its display (badge color, icon).

## 4. Remove any branding issues on public page LINK 

The public page at `PublicBooking.tsx` line 419 already says "Powered by Startup Factory Hub" — this is correct. The booking URL uses `window.location.origin` which in production resolves to `startupfactoryhub.lovable.app DELTE THE LOCABLE .APP` . In `CalendarBookingSettings.tsx`, the shareable link uses `window.location.origin` — verify no "Lovable" text appears IN THE LLINK . Currently clean.

## Files Modified

- `src/components/BookingsList.tsx` — remove empty state card
- `src/pages/Dashboard.tsx` — restructure grid to 2 columns (settings | availability+blocks combined)
- `src/pages/MentorDashboard.tsx` — same grid change
- `src/pages/AdvisorDashboard.tsx` — same grid change
- `src/pages/InvestorDashboard.tsx` — same grid change
- `src/components/UnifiedCalendar.tsx` — fetch and display calendar_bookings as calendar items
- `src/components/CalendarBookingSettings.tsx` — ensure link usesstartupfactoryhub  domain, no external branding