

## Payouts Management Tab + Event Payment Flow Polish

### Overview
Add a new "Payouts" sub-tab to all 5 profile views (Student, Startup, Investor, Advisor/Mentor, Accelerator) that shows earnings from events and districts. Also ensure the paid event registration flow is fully gated.

---

### 1. New Component: `ProfilePayoutsTab.tsx`

Create a new shared component that displays:
- **Earnings Summary Cards**: Total earnings, platform fees paid, net earnings (from events + districts)
- **Event Earnings Table**: Lists all events the user organized that had paid tickets, showing ticket count sold, total revenue, platform fee, and net payout per event
- **District Earnings Section**: (Future-ready placeholder) -- currently districts pay creation fees TO the platform, so this section will note "No district payouts yet" or show district creation payments made
- Data source: Query `event_payments` joined with `events` where `events.organizer_id = current user` and `payment_status = 'paid'`

The component will:
- Aggregate `amount_cents` and `platform_fee_cents` from `event_payments` for events the user organizes
- Show a table with columns: Event Name, Tickets Sold, Gross Revenue, Platform Fee (10%), Net Payout
- Display a summary card at the top with totals

---

### 2. Add "Payouts" Tab to All Profile Views

Add a new `TabsTrigger` and `TabsContent` for "Payouts" in each profile view, placed after the "Subscription" tab:

**Files to modify:**
- `src/components/StudentProfileView.tsx` -- add tab (grid-cols-3 becomes grid-cols-4)
- `src/components/StartupProfileView.tsx` -- add tab
- `src/components/InvestorProfileView.tsx` -- add tab
- `src/components/AdvisorProfileView.tsx` -- add tab
- `src/components/AcceleratorProfileView.tsx` -- add tab

Each file gets:
- Import `ProfilePayoutsTab`
- New `<TabsTrigger value="payouts">Payouts</TabsTrigger>`
- New `<TabsContent value="payouts"><ProfilePayoutsTab /></TabsContent>`

---

### 3. Verify Event Payment Gate (Already Implemented)

The current implementation already:
- Shows "Buy Ticket" button for paid events in `EventDetailsDialog.tsx` (line 556-588)
- Only shows RSVP buttons after payment is confirmed (line 591)
- Gates external registration page for paid events (line 445-459 in `PublicEventRegistration.tsx`)
- Checks `hasPaidTicket` state via `event_payments` table query

No changes needed here -- the gate is working correctly.

---

### 4. Public Event Registration Sync

The public registration page (`PublicEventRegistration.tsx`) already:
- Shows ticket price badge (line 279-283)
- Blocks free registration form for paid events (line 319)
- Shows "Log In to Buy Ticket" for paid events (line 445-459)

No additional changes needed.

---

### Technical Details

**New file:**
- `src/components/ProfilePayoutsTab.tsx`

**Modified files (5 profile views):**
- `src/components/StudentProfileView.tsx`
- `src/components/StartupProfileView.tsx`
- `src/components/InvestorProfileView.tsx`
- `src/components/AdvisorProfileView.tsx`
- `src/components/AcceleratorProfileView.tsx`

**Database:** No schema changes needed. The `event_payments` table already has all required columns (`event_id`, `user_id`, `amount_cents`, `platform_fee_cents`, `payment_status`).

**Query for payouts:**
```sql
SELECT 
  e.id, e.title, e.start_date, e.ticket_price_cents,
  COUNT(ep.id) as tickets_sold,
  SUM(ep.amount_cents) as gross_revenue,
  SUM(ep.platform_fee_cents) as total_platform_fee
FROM events e
LEFT JOIN event_payments ep ON ep.event_id = e.id AND ep.payment_status = 'paid'
WHERE e.organizer_id = :current_user_id AND e.is_paid = true
GROUP BY e.id
ORDER BY e.start_date DESC
```

This will be implemented using Supabase client queries (two queries: one for user's paid events, one for associated payments, then aggregated in JS).

