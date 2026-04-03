

# Hot Deals: Startup Donation Support via Stripe

## Overview

Add a "💲 Support" button on each startup card in the Hot Deals portal. Donors can contribute any amount to a startup. The platform takes 10% of each donation. Startups receive funds via their connected Stripe account (existing payout_accounts system).

## Database Changes

### New table: `hot_deals_donations`
```sql
CREATE TABLE public.hot_deals_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES hot_deals_invited_startups(id) ON DELETE CASCADE,
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 100),
  platform_fee_cents INTEGER NOT NULL,
  net_amount_cents INTEGER NOT NULL,
  stripe_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```
- RLS: public SELECT (everyone sees totals), anonymous INSERT (to record pending donations)

### Add `stripe_connect_account_id` to `hot_deals_invited_startups`
```sql
ALTER TABLE hot_deals_invited_startups 
  ADD COLUMN stripe_connect_account_id TEXT;
```
This links each startup to their Stripe Connect account for receiving donations. Startups with a `user_id` can reuse their existing `payout_accounts` record, or set this directly.

## Edge Function: `create-hot-deals-donation`

- Receives: `startup_id`, `amount_cents`, `donor_name`, `donor_email`
- Calculates 10% platform fee
- Looks up startup's Stripe Connect account (from `hot_deals_invited_startups.stripe_connect_account_id` or fallback to `payout_accounts`)
- If startup has no connected account, donation goes to platform only (or show error)
- Creates Stripe Checkout session with `payment_intent_data.application_fee_amount` set to 10% and `payment_intent_data.transfer_data.destination` set to the startup's connected account
- Returns checkout URL

## Edge Function: `verify-hot-deals-donation`

- Called on the success page callback
- Verifies Stripe session payment status
- Updates `hot_deals_donations` status to "completed"

## Frontend Changes

### `src/components/HotDealsVoting.tsx`
- Add a "💲 Support" button next to the vote button on each startup card
- Clicking opens a small modal/popover with amount selection ($5, $10, $25, $50, custom)
- Shows total raised per startup in real-time (query `hot_deals_donations` where status = 'completed')
- Donor must enter name and email before donating
- On submit, calls `create-hot-deals-donation` edge function and redirects to Stripe Checkout

### `src/pages/HotDealsPortal.tsx`
- Add a success route handler or use query params to verify donation on return

## Flow

```text
User clicks "💲 Support" → Amount picker modal → Enter name/email →
Edge function creates Stripe Checkout (with 10% app fee + transfer to startup) →
User pays on Stripe → Redirected back → verify-hot-deals-donation updates status →
Real-time total raised updates on card
```

## Technical Details

- Uses Stripe Connect's `application_fee_amount` for the 10% platform cut (same pattern as existing event payments)
- Startups connect Stripe via existing payout onboarding flow (already built)
- Real-time donation totals via Supabase realtime subscriptions on `hot_deals_donations`
- No authentication required for donors (guest checkout), only name + email

## Files Created
- `supabase/functions/create-hot-deals-donation/index.ts`
- `supabase/functions/verify-hot-deals-donation/index.ts`

## Files Modified
- `src/components/HotDealsVoting.tsx` — add support button, amount modal, total raised display
- Migration SQL for new table + column

