

## Plan: Subscription-Gated Regus Workspace in Resource Map

### What This Does
When a user subscribes to any paid SFH tier via Stripe, the "Workplace" category in the Resource Map unlocks, showing Regus locations globally. Subscribers can book workspaces without payment (internal request). If subscription lapses, access locks again. Admins approve/reject bookings, and users see booking status in their dashboard.

### Implementation Steps

#### 1. Database: Create `regus_locations` table
- Fields: `id`, `name`, `address`, `city`, `country`, `latitude`, `longitude`, `office_type` (text), `capacity`, `amenities` (text[]), `image_url`, `images` (text[]), `videos` (text[]), `rating` (numeric), `is_active` (boolean, default true), `created_at`
- RLS: authenticated users can SELECT active locations

#### 2. Database: Add `admin_notes` column to `hub_bookings`
- `ALTER TABLE hub_bookings ADD COLUMN admin_notes text;`
- Ensure status values support: `pending`, `confirmed`, `needs_action`, `cancelled`

#### 3. Seed Regus Locations
- Insert 50-100 global Regus office locations (major cities across US, Europe, Asia, LATAM) via SQL insert

#### 4. Create `useMembershipStatus` hook
- Calls `check-membership` edge function
- Returns `{ isSubscribed, tier, status, loading }`
- Cached via React Query (60s stale time)
- Checks for `active` status; `past_due`/`canceled` = not subscribed

#### 5. Create `useRegusLocations` hook
- Fetches from `regus_locations` table with filters (city, country, office_type, search)
- Returns data shaped as `Workspace[]` to reuse existing HubsLab components

#### 6. Add "Workplace" category to `GlobalResourcesMap.tsx` RESOURCE_CONFIG
- New entry: `workplace: { icon: Building2, color: '#0d9488', label: 'Workplace' }`
- When selected:
  - **Not subscribed**: Show lock overlay with "Subscribe to unlock Regus workspaces" CTA
  - **Subscribed**: Replace resource list with HubsLab-style UI:
    - Workspace type sub-filters (Hot Desk, Private Office, Meeting Room, Coworking, Event Space)
    - `HubsWorkspaceCard` components in compact mode
    - Map markers switch to Regus locations
    - Clicking marker/card opens `HubsDetailPanel`
    - "Book Now" opens `RegusBookingModal`

#### 7. Create `RegusBookingModal` component
- Fork of `HubsBookingModal` but:
  - **No price display, no Stripe redirect**
  - Submit inserts into `hub_bookings` with `status: 'pending'`, `provider: 'regus'`
  - Same media carousel, date/time picker, duration selector, notes
  - Success: "Booking request submitted — pending admin confirmation"

#### 8. Subscription lockout logic
- `useMembershipStatus` also checks `past_due`/`canceled` from Stripe via `check-membership`
- If inactive: hide Regus markers, show lock on Workplace category, disable booking
- On subscription activation: immediately unlock (React Query refetch)

#### 9. User Dashboard: "My Bookings" section
- Add booking list in user profile/dashboard
- Query `hub_bookings` for current user, display with status badges:
  - Pending (yellow), Confirmed (green), Needs Action (orange), Cancelled (red)

#### 10. Admin: Workspace Bookings management
- Add a booking management section in admin dashboard
- List pending Regus bookings with approve (→ confirmed), flag (→ needs_action), reject (→ cancelled) actions
- Admin can add `admin_notes`

### Technical Details

- **Subscription tiers** already mapped in `check-membership` edge function (TIER_MAP with 4 product IDs)
- **All paid tiers** (community, self_paced_office, global_access, corporate) unlock Workplace
- `user_subscriptions` table already exists and is upserted by `check-membership`
- Reuse existing `HubsWorkspaceCard`, `HubsDetailPanel`, `HubsBookingModal` components — only fork the booking modal to remove payment
- `ResourceType` union in `useResources.ts` needs `workplace` added

