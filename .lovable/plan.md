

# Calendar Booking: Block Days/Hours + Profile Sync on Public Page

## What We're Building

1. **Blocked dates/hours table** — let users block specific dates or hour ranges so those are excluded from bookable slots
2. **Block management UI** in the AvailabilityManager — add/remove blocked dates and time ranges
3. **Public booking page improvements** — show host's email alongside name/avatar/bio, and respect blocked dates/hours when generating slots
4. **Profile sync** — fetch and display the host's email on the public `/meet/:slug` page

## Technical Plan

### Step 1: Database Migration — `calendar_blocked_times` table

```sql
CREATE TABLE public.calendar_blocked_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_date date NOT NULL,
  start_time time DEFAULT NULL,  -- NULL = entire day blocked
  end_time time DEFAULT NULL,
  reason text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.calendar_blocked_times ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own blocked times
CREATE POLICY "Users manage own blocked times"
  ON public.calendar_blocked_times FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Public read for booking page
CREATE POLICY "Anyone can read blocked times"
  ON public.calendar_blocked_times FOR SELECT TO anon, authenticated
  USING (true);
```

### Step 2: Hook — `useBlockedTimes.ts`

- CRUD hook for `calendar_blocked_times` (fetch, add, delete)
- Used by AvailabilityManager for the owner, and by PublicBooking for read-only

### Step 3: Update `AvailabilityManager.tsx`

- Add a "Block Dates/Hours" section below existing availability slots
- Calendar date picker to select a date to block
- Option to block entire day or specific hours (start/end time)
- List of current blocked dates with delete button

### Step 4: Update `PublicBooking.tsx`

- Fetch `calendar_blocked_times` for the host alongside availability
- Filter out blocked dates entirely from calendar (disable those dates)
- Filter out blocked hour ranges from time slots on partially blocked days
- Add host email to the profile display (fetch `email` from profiles)
- Show avatar, full name, email, and bio in the host info section

### Files Modified
- **New**: `src/hooks/useBlockedTimes.ts`
- **Migration**: new `calendar_blocked_times` table
- **Edit**: `src/components/AvailabilityManager.tsx` — add block dates/hours UI
- **Edit**: `src/pages/PublicBooking.tsx` — respect blocked times + show email

