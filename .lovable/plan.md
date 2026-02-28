

## Plan: Add Upcoming Accelerators Section & Sync to Unified Calendar

### What we're doing
1. Add a horizontal scrollable "Upcoming Accelerator Programs" section in the Calendar tab (below Upcoming Events), showing cohorts with `applications_open` status — styled like the attached screenshot (program name, description, dates, deadline, spots left, industries, apply button).
2. Add `'accelerator'` as a new `CalendarItemType` in UnifiedCalendar so accelerator deadlines and start dates appear as calendar dots/items across all dashboard tabs that use the calendar.

### Files to modify

**1. `src/components/UnifiedCalendar.tsx`**
- Add `'accelerator'` to the `CalendarItemType` union type
- Add state for accelerator cohorts (`acceleratorCohorts`)
- Add `fetchAcceleratorCohorts()` — query `accelerator_cohorts` joined with `accelerator_profiles` where `status = 'applications_open'` or `start_date >= now()`
- Subscribe to `accelerator_cohorts` changes in the realtime channel
- In `getAllItems()`, add accelerator items: one item per cohort for `start_date` (labeled "Program Starts: {name}") and one for `application_deadline` (labeled "Deadline: {name}")
- Add accelerator legend badge (emerald color) and icon (Rocket)
- Add color mapping for `'accelerator'` type in `getItemTypeColor` and `getItemTypeIcon`

**2. `src/pages/StudentDashboard.tsx`** (Calendar tab)
- Import `CohortApplicationDialog`, `Rocket`, `useState` for application dialog
- Add state for fetched open cohorts and selected cohort
- Add `useEffect` to fetch cohorts with `status = 'applications_open'` joined with `accelerator_profiles`
- Below the Upcoming Events card, add a new "Upcoming Accelerator Programs" card with a horizontal `ScrollArea`, each card showing:
  - Program name, truncated description
  - Start date, deadline, spots left (`max_startups - current_startups`)
  - Industry badges
  - "Apply via Account" button → opens `CohortApplicationDialog`
  - External link button → opens public application URL
- Update `filterTypes` prop to include `'accelerator'`

**3. Other dashboards using UnifiedCalendar** (startup, mentor, investor, accelerator, advisor)
- Add `'accelerator'` to their `filterTypes` arrays so accelerator dates appear on all calendars

### Technical details

- Query: `supabase.from('accelerator_cohorts').select('*, accelerator_profiles(organization_name, logo_url, user_id)').in('status', ['applications_open', 'in_progress']).gte('start_date', today)`
- Calendar item type color: `bg-emerald-500/10 text-emerald-500 border-emerald-500/20`
- The accelerator card in the calendar tab will match the screenshot style: dark card with program title, description, dates, spots, industry badges, and apply button
- No changes to existing UI components or styles beyond what's specified

