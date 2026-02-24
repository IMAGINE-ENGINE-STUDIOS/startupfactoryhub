

## Stripe Payments for Events + 10% Commission on Events and Districts

**Clarification:** Subscriptions are 100% yours -- no commission. The 10% platform commission only applies to user-sold products: **paid events** (ticket sales) and **district creation**.

---

### 1. Database Changes

**Add columns to `events` table:**
- `ticket_price_cents` (bigint, default 0) -- ticket price set by the event organizer in cents
- `is_paid` (boolean, default false) -- quick flag for filtering

**Create `event_payments` table:**
- `id` (uuid, PK, default gen_random_uuid())
- `event_id` (uuid, FK to events)
- `user_id` (uuid, FK to profiles)
- `stripe_session_id` (text)
- `amount_cents` (bigint) -- total charged to user (base + 10%)
- `platform_fee_cents` (bigint) -- the 10% portion
- `payment_status` (text, default 'pending')
- `created_at` (timestamptz, default now())
- `completed_at` (timestamptz, nullable)
- RLS: users can read their own payments

---

### 2. Event Creation -- Add Ticket Price

**File: `src/components/CreateEventDialog.tsx`**
- Add a "Ticket Price (USD)" number input below "Maximum Attendees"
- Helper text: "Leave at $0 for free events. A 10% platform fee will be charged to attendees on paid events."
- On submit, store `ticket_price_cents` (price * 100) and `is_paid` (true if price > 0)

---

### 3. New Edge Function: `create-event-payment`

- Receives `{ eventId }` from an authenticated user
- Looks up the event to get `ticket_price_cents` and `organizer_id`
- Calculates total: `Math.round(ticket_price_cents * 1.10)` (10% fee added)
- Creates a Stripe Checkout session (mode: "payment") with `price_data`
- Inserts a pending record into `event_payments`
- Returns the checkout URL

---

### 4. New Edge Function: `verify-event-payment`

- Receives `{ sessionId }` from frontend after Stripe redirect
- Retrieves the Stripe session, checks `payment_status === 'paid'`
- Updates `event_payments` record to `paid`
- Auto-registers the user as `going` in `event_attendees`
- Returns success with event ID

---

### 5. Event Details -- Payment Gate for Paid Events

**File: `src/components/EventDetailsDialog.tsx`**
- If event has `ticket_price_cents > 0`:
  - Show ticket price (e.g., "$25.00 + $2.50 platform fee")
  - Replace the Going/Maybe/Can't Go buttons with a "Buy Ticket -- $27.50" button
  - The button calls `create-event-payment`, then redirects to Stripe Checkout
  - After payment (via URL param `?ticket_paid=1&session_id=...`), verify and show attendance status
- If user already has a paid `event_payments` record for this event, show the normal RSVP status
- Free events remain completely unchanged

---

### 6. Public Event Registration -- Show Price

**File: `src/pages/PublicEventRegistration.tsx`**
- Display ticket price on the event header card if `ticket_price_cents > 0`
- For paid events, show a "Buy Ticket" button instead of the free registration form
- The button redirects to Stripe Checkout via `create-event-payment`

---

### 7. Update useEvents Hook

**File: `src/hooks/useEvents.ts`**
- Add `ticket_price_cents` and `is_paid` to the `Event` interface

---

### 8. District Creation -- Add 10% Fee

**File: `supabase/functions/create-village-payment/index.ts`**
- Change `unit_amount` from `20000` ($200) to `22000` ($220)
- Update the product description to mention the platform fee
- The extra $20 is the 10% platform commission

---

### 9. Config Updates

**File: `supabase/config.toml`**
- Add entries for new edge functions:
  - `[functions.create-event-payment]` verify_jwt = false
  - `[functions.verify-event-payment]` verify_jwt = false

---

### What Does NOT Change

- **Subscriptions** (`create-membership-checkout`, `check-membership`): No changes. 100% of subscription revenue goes to you.
- **Cohort payments**: No changes to the existing accelerator cohort payment system.

---

### Fee Summary

```text
Events:
  Organizer sets ticket price (e.g. $50.00)
  Platform adds 10% fee
  Attendee pays: $55.00
  Platform keeps: $5.00

Districts:
  Base creation fee: $200.00
  Platform 10% fee: $20.00
  User pays: $220.00

Subscriptions:
  No commission -- 100% revenue to you
```

