# Reorganize Calendar Tab: Calendar on Top, Tool Squares Below

## Current Layout

The Calendar tab currently shows: buttons → upcoming events → accelerator programs → UnifiedCalendar → CalendarBookingSettings + BookingsList (2-col) → AvailabilityManager (full width).

## Proposed Layout

1. **Top**: UnifiedCalendar (full width, with action buttons above it)
2. **Bottom**: 2 square cards in a 2x2 grid:
  &nbsp;
   **1-Booking Settings** — share link, slug, duration, buffer
  **1-Bookings List** — incoming/outgoing bookings with confirm/decline
  **2-Availability Schedule** — weekly recurring slots (from AvailabilityManager)
  **2-Block Dates & Hours** — block specific dates/times (from AvailabilityManager)

## Changes

### File: `src/pages/Dashboard.tsx` (Calendar tab section, ~lines 430-708)

- Keep action buttons and upcoming events/accelerator cards at top
- Keep `UnifiedCalendar` right after those
- Replace the current `CalendarBookingSettings + BookingsList` 2-col grid and standalone `AvailabilityManager` with a **2x2 grid** of 2 cards:
  1. `CalendarBookingSettings`
  2. `BookingsList`
  3. New `AvailabilityScheduleCard` (weekly slots portion only)
  4. New `BlockedTimesCard` (blocked dates portion only)

### File: `src/components/AvailabilityManager.tsx`

- Split into two exported components:
  - `AvailabilityScheduleCard` — the weekly recurring availability slots section (top card from current component)
  - `BlockedTimesCard` — the block dates/hours section (bottom card from current component)
- Keep the default export as-is for backward compatibility, but also export the two sub-components

### File: Same changes replicated in `MentorDashboard.tsx`, `AdvisorDashboard.tsx`, `InvestorDashboard.tsx`

- Apply the same 2x2 grid layout in their Calendar tabs

## Result

The calendar view stays prominent at the top. Below it, two equal square cards give quick access to all booking management tools in a clean grid. space optimizr to fit the full feaures 