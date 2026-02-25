

# Referral Program + Unified Payout System

This is a large feature spanning database schema, edge functions, new pages, and modifications to existing components. Here is the full plan.

---

## 1. Database Schema (Migration)

### New Tables

**`referral_accounts`** -- Each user who joins the referral program gets a unique referral code and tracking data.

```text
referral_accounts
├── id              uuid PK
├── user_id         uuid FK → auth.users (unique)
├── referral_code   text UNIQUE (e.g. "SFH-abc123")
├── total_clicks    int default 0
├── total_referrals int default 0
├── total_earned_cents  bigint default 0
├── created_at      timestamptz
└── updated_at      timestamptz
```

**`referral_clicks`** -- Tracks every click on a referral link (anonymous).

```text
referral_clicks
├── id              uuid PK
├── referral_code   text FK → referral_accounts.referral_code
├── ip_hash         text (hashed for privacy)
├── user_agent      text
├── created_at      timestamptz
```

**`referral_conversions`** -- When a referred user subscribes.

```text
referral_conversions
├── id              uuid PK
├── referrer_id     uuid FK → referral_accounts.id
├── referred_user_id uuid FK → auth.users
├── subscription_tier text
├── subscription_amount_cents bigint
├── commission_cents bigint (20% of 1 month)
├── status          text ('pending','paid','cancelled')
├── stripe_subscription_id text
├── created_at      timestamptz
└── paid_at         timestamptz nullable
```

**`payout_accounts`** -- Unified payout method for all earnings (events, districts, referrals). Stores Stripe Connect account info.

```text
payout_accounts
├── id              uuid PK
├── user_id         uuid FK → auth.users (unique)
├── stripe_connect_account_id text
├── account_status  text ('pending','active','restricted')
├── country         text
├── created_at      timestamptz
└── updated_at      timestamptz
```

**`payout_requests`** -- Withdrawal requests.

```text
payout_requests
├── id              uuid PK
├── user_id         uuid FK → auth.users
├── amount_cents    bigint
├── source          text ('events','districts','referrals')
├── status          text ('pending','processing','completed','failed')
├── stripe_transfer_id text nullable
├── created_at      timestamptz
└── completed_at    timestamptz nullable
```

### RLS Policies
- All tables: users can only read/write their own records (`user_id = auth.uid()`)
- `referral_clicks`: insert allowed for anonymous (public), select restricted to referral owner
- `referral_conversions`: read-only for the referrer

---

## 2. Edge Functions

### `create-referral-account`
- Authenticated user joins referral program
- Generates unique referral code (e.g. `SFH-` + 8-char random)
- Creates `referral_accounts` record
- Returns the referral link: `https://startupfactoryhub.com/ref/{code}`

### `track-referral-click`
- Public endpoint (no auth required, `verify_jwt = false`)
- Receives referral code from URL
- Inserts into `referral_clicks`, increments `total_clicks` on `referral_accounts`
- Returns redirect URL to `/auth?ref={code}`

### `process-referral-conversion`
- Called from `check-membership` when a new subscription is detected
- Checks if the subscriber signed up with a referral code (stored in `profiles.referred_by` or `auth.users.raw_user_meta_data`)
- If yes, calculates 20% of first month's subscription amount
- Creates `referral_conversions` record with status `pending`
- Updates `referral_accounts.total_referrals` and `total_earned_cents`

### `create-payout-account`
- Creates a Stripe Connect Express account for the user
- Returns the Stripe onboarding URL
- Updates `payout_accounts` table

### `request-withdrawal`
- Authenticated user requests a withdrawal of available balance
- Validates sufficient balance
- Creates a Stripe Transfer to their Connect account
- Inserts `payout_requests` record

### `check-payout-account`
- Returns user's Connect account status and available balance (from events, districts, and referrals)

---

## 3. Frontend Changes

### New Page: `src/pages/ReferralProgram.tsx`
- Public landing page at `/referral`
- Explains the 20% commission program
- If logged in: shows "Join Program" button, or referral dashboard if already enrolled
- Referral dashboard shows: unique link (copy button), clicks, conversions, earnings
- Table of referral conversions with status

### New Page: `src/pages/ReferralRedirect.tsx`
- Route: `/ref/:code`
- Tracks the click via edge function
- Redirects to `/auth?ref={code}`

### Modified: `src/pages/Auth.tsx`
- Reads `ref` query param from URL
- Passes referral code to `signUp` in `raw_user_meta_data` as `referred_by`

### Modified: `src/components/Footer.tsx`
- Add "Referral Program" link in the Quick Links section with a `Gift` icon

### Modified: `src/App.tsx`
- Add routes: `/referral` and `/ref/:code`

### New Component: `src/components/PayoutAccountSetup.tsx`
- UI for connecting Stripe Connect account (for getting paid)
- Shows onboarding button or account status
- Used in ProfilePayoutsTab

### Modified: `src/components/ProfilePayoutsTab.tsx`
- Add "Payout Account" section at top (PayoutAccountSetup component)
- Add "Referral Earnings" card section alongside event/district earnings
- Add "Withdraw" button that triggers withdrawal flow
- Show available balance across all sources (events, districts, referrals)

### Modified: `src/contexts/AuthContext.tsx`
- Update `signUp` to accept optional `referralCode` parameter and store it in `raw_user_meta_data`

### Modified: `supabase/functions/check-membership/index.ts`
- After detecting a new active subscription, call referral conversion logic (check if user has `referred_by` in metadata, and if so create the conversion record)

---

## 4. Referral Flow Summary

```text
1. User A visits /referral → joins program → gets link: startupfactoryhub.com/ref/SFH-abc123
2. User A shares link
3. User B clicks link → /ref/SFH-abc123 → click tracked → redirected to /auth?ref=SFH-abc123
4. User B signs up → referral code stored in user metadata
5. User B subscribes (e.g. Community $300/mo)
6. check-membership detects new subscription → creates referral_conversion
   Commission = 20% × $300 = $60 (one-time, first month only)
7. User A sees $60 in referral earnings on Payouts tab
8. User A connects Stripe payout account → withdraws earnings
```

---

## 5. Implementation Order

1. Database migration (all new tables + RLS)
2. Edge functions: `create-referral-account`, `track-referral-click`, `create-payout-account`, `request-withdrawal`, `check-payout-account`
3. Modify `check-membership` to process referral conversions
4. Frontend: ReferralProgram page, ReferralRedirect page
5. Modify Auth.tsx to capture referral code
6. Modify Footer.tsx to add referral link
7. Create PayoutAccountSetup component
8. Update ProfilePayoutsTab with payout account + referral earnings + withdraw button
9. Add routes to App.tsx

This is a substantial feature set. Would you like me to proceed with implementation?

