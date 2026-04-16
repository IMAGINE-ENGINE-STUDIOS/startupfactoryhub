

The user wants to:
1. Create an email template to send to the **winning startup** of the Hot Deals event
2. Email announces they won **1 year of Community membership** (free)
3. Include the **total yearly value** (Community yearly = $3,780)
4. Include a **special promo code** they can use to claim the free year subscription
5. Implement the code generation/redemption logic

## Investigation

From the codebase:
- Community tier yearly: **$3,780/year** (`MEMBERSHIP_TIERS.community.yearly_price`)
- Yearly price ID: `price_1T7RV3K5N1RcUVuYMhTIZLSV`
- Winner is tracked in `hot_deals_winner` table → links to `hot_deals_invited_startups`
- Stripe checkout already supports `allow_promotion_codes: true` in `create-membership-checkout`
- Project uses Resend for transactional emails (matches existing `send-hot-deals-starting-now` pattern)

## Plan

### 1. Create Stripe 100% Off Coupon (12 months duration)
- Use `stripe--create_coupon` to generate a `100% off, repeating, 12 months` coupon
- This gives the winner 1 free year of Community membership

### 2. Database: Track Winner Promo Codes
Create migration for new table `hot_deals_winner_codes`:
- `id` (uuid, pk)
- `winner_id` (uuid, fk → hot_deals_winner.id)
- `startup_id` (uuid)
- `promo_code` (text, unique) — human-readable e.g. `HOTDEALS-WINNER-XXXX`
- `stripe_coupon_id` (text)
- `stripe_promotion_code_id` (text)
- `tier` (text, default 'community')
- `yearly_value_cents` (int, default 378000)
- `redeemed` (boolean, default false)
- `redeemed_at` (timestamptz, nullable)
- `created_at` (timestamptz)
- RLS: admins can manage, winner can view own

### 3. New Edge Function: `create-winner-promo-code`
- Generates a unique promo code (e.g. `WINNER-${random8chars}`)
- Creates a Stripe Promotion Code linked to the 100% off coupon, restricted to community yearly price
- Inserts row into `hot_deals_winner_codes`
- Returns code

### 4. New Edge Function: `send-hot-deals-winner-email`
- Accepts: `to`, `recipientName`, `companyName`, `promoCode`
- Sends a celebration email via Resend with:
  - 🏆 Trophy header / "RACE WINNER" branding (matches existing HotDealsWinner styling: red/orange/yellow gradient)
  - Prize announcement: "1 Year Community Membership"
  - **Total Value: $3,780** prominently displayed
  - Promo code in a styled code box (copy-friendly)
  - Big CTA button → `/membership?plan=community&billing=yearly&promo={CODE}`
  - Instructions to redeem at checkout

### 5. Update `create-membership-checkout` Edge Function
- Accept optional `promoCode` parameter
- If provided, look it up in Stripe and pass `discounts: [{ promotion_code: id }]` to the checkout session
- (Already has `allow_promotion_codes: true` so users can also enter manually)

### 6. Trigger Flow
After plan approval, the AI will:
1. Run the migration
2. Create the Stripe coupon
3. Deploy both new edge functions
4. Update existing checkout function
5. Generate the promo code for the current winner (NuView, based on context)
6. Send the winner email

### Files to create/edit
- **Migration**: new `hot_deals_winner_codes` table
- **New**: `supabase/functions/create-winner-promo-code/index.ts`
- **New**: `supabase/functions/send-hot-deals-winner-email/index.ts`
- **Edit**: `supabase/functions/create-membership-checkout/index.ts` (add promoCode support)

### Email Design (matches existing brand)
- Red/orange/yellow gradient header (consistent with `HotDealsWinner.tsx`)
- White body, Lucide-style trophy icon (image), no emojis except 🏆 in subject for inbox impact
- Value displayed as: ~~$3,780~~ → **FREE for 1 Year**
- Code in monospace box with subtle glow

### Notes
- Winner identification: I'll query `hot_deals_winner` for the latest winner's startup, then look up the founder's email from `hot_deals_invited_startups` or related profile
- The promo code is single-use, restricted to community yearly price, 100% off

