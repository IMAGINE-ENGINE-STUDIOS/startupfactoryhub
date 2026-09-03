# Basic Membership — Simulation Page (/basic-plan)

A self-contained, unpublished simulation of the new Basic subscription. Nothing is added to the main navigation, home page or dashboards until you approve going live.

## The offer

Basic Plan — $50/month, or $480/year (20% off). Both amounts are admin-configurable, not hardcoded.

Unlocked services:
1. Post in the social feed
2. Post in the resource map
3. Access to open-source technologies
4. Access to acceleration programs
5. Discounts on SFH services
6. Access to online and in-person meetings, conferences and pitch events
7. Contact investors through the platform
8. Access to internships
9. Access to volunteering roles
10. Technology transfer programs
11. Certified courses

## What the page does

Route `/basic-plan`, reachable only by direct URL.

- **Plan card**: monthly/yearly toggle, live price from the database, savings badge, the 7 entitlements listed with Lucide icons.
- **Simulated user panel**: a switch that flips the viewer between "Free user" and "Basic member" without touching real data, so you can see how each unlocked service looks in both states.
- **Entitlement preview**: each of the 7 services rendered as a gated tile — locked with a "Requires Basic" state for free, unlocked with its action for members.
- **Stripe test checkout**: a "Subscribe (test mode)" button that opens a real Stripe Checkout session against the test price, so the payment path can be validated end to end. Returning from checkout refreshes real status; the simulation switch stays available for previewing.
- **Admin price editor**: visible only to platform admins on this page — edit monthly price, yearly price and the entitlement list; saved to the database and reflected immediately.

## Architecture

Everything lives in its own folder so it can be lifted into the product later without touching existing code.

```text
src/features/basic-plan/
  index.ts                     public exports
  types.ts                     BasicPlanConfig, Entitlement, SimulatedUserState
  config/entitlements.ts       the 7 services: key, label, description, icon, demo action
  api/basicPlanApi.ts          plan config read/write + checkout invocation
  hooks/useBasicPlan.ts        loads plan config (price, entitlements)
  hooks/useSimulatedMembership.ts  simulated vs real membership state
  components/
    BasicPlanHero.tsx
    BasicPlanPricingCard.tsx
    BillingCycleToggle.tsx
    EntitlementGrid.tsx
    EntitlementTile.tsx
    SimulationControls.tsx
    AdminPricePanel.tsx
src/pages/BasicPlanLab.tsx     thin page: composes the feature, nothing else
```

Route registered in `src/App.tsx` as `/basic-plan` only. No links added elsewhere.

## Technical details

- **Database**: new `public.subscription_plan_config` table (`key`, `name`, `monthly_price_cents`, `yearly_price_cents`, `stripe_monthly_price_id`, `stripe_yearly_price_id`, `entitlements jsonb`, `is_active`, timestamps). Seeded with the `basic` row at 5000 / 48000 cents. Grants: `SELECT` to `anon` and `authenticated`, full to `service_role`. RLS: everyone reads active plans; only admins (`has_role(auth.uid(),'admin')`) insert/update.
- **Stripe**: create a Basic product with monthly ($50) and yearly ($480) test prices, store the price IDs in the config row. New edge function `create-basic-plan-checkout` (mirrors `create-membership-checkout`) resolves the price ID from the config table server-side rather than trusting the client, and returns the Checkout URL. Existing `check-membership` is extended with the Basic product ID in its `TIER_MAP` so real status resolves correctly.
- **Simulation isolation**: the simulated state is React state in `useSimulatedMembership`, defaulting to real membership from `useMembershipStatus`. No writes, no localStorage bleed into other pages.
- **Style**: `tech-card border-0` glassmorphism, Lucide icons only, semantic tokens — no hardcoded colors.
- Every file gets a header comment stating its responsibility; entitlement definitions are the single source of truth reused by the grid, the pricing card and any future gating.

## Out of scope for now

No enforcement of the entitlements anywhere else in the app, no nav entry, no home-page pricing change. Those come in a second pass once the simulation is approved.
