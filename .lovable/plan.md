

# Sync Hot Deals Donations with Profile Payouts Dashboard

## Overview

Add a "Hot Deals Donations" section to the Profile Payouts tab that shows startups their donation earnings. Donations remain anonymous (no donor names/emails shown). The 10% platform fee is already calculated in the `hot_deals_donations` table (`platform_fee_cents`, `net_amount_cents`). We need to fetch and display this data, and include it in the overall earnings totals.

## Changes

### 1. Update `ProfilePayoutsTab.tsx` — Fetch donation earnings for the startup

- Query `hot_deals_donations` joined with `hot_deals_invited_startups` where `user_id = current user` and `status = 'completed'`
- Aggregate: total gross (amount_cents), total platform fees (platform_fee_cents), total net (net_amount_cents), donation count
- Add donation totals to the overall earnings overview (totalGross, totalFees, totalNet, availableBalance)

### 2. Create new component `PayoutDonationEarnings.tsx`

A new card in `src/components/payouts/` showing a table of Hot Deals donations received:
- Columns: Date, Amount (gross), Platform Fee (10%), Net Payout
- No donor identity shown (anonymous)
- Summary row with totals
- Place it between Event Earnings and Withdrawal History sections

### 3. Wire donation totals into `PayoutEarningsOverview`

The existing overview already accepts totalGross/totalFees/totalNet. We just add donation amounts to these totals in `ProfilePayoutsTab.tsx` alongside event and referral earnings.

## Technical Details

**Data flow:**
```text
hot_deals_donations (startup_id) 
  → hot_deals_invited_startups (user_id = auth.uid())
  → aggregate completed donations
  → display in payouts dashboard
```

**Query approach** (in ProfilePayoutsTab):
1. Fetch `hot_deals_invited_startups` where `user_id = current user`
2. Use those startup IDs to fetch `hot_deals_donations` where `status = 'completed'`
3. Aggregate totals and pass to overview + new donation table

**No database changes needed** — all columns already exist.

## Files Modified
- `src/components/ProfilePayoutsTab.tsx` — add donation fetch, include in totals
- `src/components/payouts/PayoutDonationEarnings.tsx` — new component for donation earnings table

