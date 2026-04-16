

# Enable Apple Pay on Hot Deals Donations

## Overview
Stripe Checkout **already supports Apple Pay and Google Pay** automatically when enabled in the Stripe Dashboard. The only code change needed is to explicitly include wallet payment methods in the checkout session configuration to guarantee they appear.

## Changes

### 1. Update `supabase/functions/create-hot-deals-donation/index.ts`
- Add `payment_method_types: ["card", "link"]` to the checkout session params
- Stripe Checkout automatically shows Apple Pay and Google Pay as overlay options on supported devices when `card` is included — no separate payment method type needed
- Optionally add `payment_method_options` to enable wallet promotions

### 2. Stripe Dashboard Configuration (Manual Step)
- The user needs to verify that **Apple Pay** is enabled under Stripe Dashboard → Settings → Payment Methods
- Apple Pay requires domain verification: add `startupfactoryhub.com` in Stripe Dashboard → Settings → Apple Pay

### 3. Redeploy the Edge Function
- Deploy via `supabase--deploy_edge_functions`

## Important Notes
- Apple Pay appears automatically in Stripe Checkout on Safari/iOS when enabled — no frontend UI changes needed
- Google Pay also appears automatically on Chrome/Android
- The domain `startupfactoryhub.com` must be registered in Stripe's Apple Pay settings for it to work on the live site

## Technical Details
- Stripe Checkout handles all Apple Pay UX (biometric auth, card selection) — no additional frontend code required
- The `payment_method_types: ["card", "link"]` ensures card + Link wallets; Apple Pay/Google Pay are automatic overlays on `card`

