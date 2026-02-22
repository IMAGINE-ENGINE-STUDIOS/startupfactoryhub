
# Add Subscription Tab to All User Profiles

## Overview
Add a new "Subscription" subtab to every user profile view (Startup, Investor, Advisor, Student, Accelerator) where users can view their current subscription status, upgrade/downgrade plans, and manage billing through Stripe Customer Portal.

## What will be built

### 1. Shared SubscriptionTab Component
A single reusable `ProfileSubscriptionTab` component used across all profile views. It will display:
- Current plan name, status badge (active/free/cancelled), and renewal date
- Tier cards showing all membership plans with the user's current plan highlighted
- "Manage Subscription" button (opens Stripe Customer Portal for existing subscribers)
- "Upgrade" / "Get Started" buttons for non-subscribers (opens Stripe Checkout)
- "Refresh Status" button to re-check membership from Stripe

### 2. Customer Portal Edge Function
A new `customer-portal` edge function so users can manage billing, cancel, or change payment method directly through Stripe.

### 3. Profile View Updates
Add a "Subscription" tab to these 5 profile views:
- **StartupProfileView** (has Tabs already -- add 4th tab)
- **CompanyProfileManager** (has Tabs already -- add 4th tab)
- **InvestorProfileView** (has Tabs already -- add 4th tab)
- **AcceleratorProfileView** (has Tabs already -- add 4th tab)
- **StudentProfileView** (no Tabs -- wrap existing content and add Subscription tab)
- **AdvisorProfileView** (no Tabs -- wrap existing content and add Subscription tab)

---

## Technical Details

### New Files
1. **`src/components/ProfileSubscriptionTab.tsx`** -- Shared subscription management component
   - Calls `check-membership` edge function to get current tier/status
   - Displays current plan with visual highlight
   - Shows all available tiers from `MEMBERSHIP_TIERS` constant
   - Subscribe button calls `create-membership-checkout`
   - Manage button calls new `customer-portal` edge function
   - Auto-refreshes status on mount

2. **`supabase/functions/customer-portal/index.ts`** -- Stripe Customer Portal session creator
   - Authenticates user, finds Stripe customer by email
   - Creates billing portal session and returns URL
   - Uses existing `STRIPE_SECRET_KEY` secret

### Modified Files
- **`src/components/InvestorProfileView.tsx`** -- Add Subscription TabsTrigger + TabsContent, update grid-cols-3 to grid-cols-4
- **`src/components/AcceleratorProfileView.tsx`** -- Add Subscription TabsTrigger + TabsContent, update grid-cols-3 to grid-cols-4
- **`src/components/CompanyProfileManager.tsx`** -- Add Subscription TabsTrigger + TabsContent, update grid-cols-3 to grid-cols-4
- **`src/components/StartupProfileView.tsx`** -- Add Subscription TabsTrigger + TabsContent, update grid-cols-3 to grid-cols-4
- **`src/components/StudentProfileView.tsx`** -- Add Tabs wrapper with "Profile" and "Subscription" tabs
- **`src/components/AdvisorProfileView.tsx`** -- Add Tabs wrapper with "Profile" and "Subscription" tabs

### Data Flow
The component uses existing infrastructure:
- `check-membership` edge function (already exists) to fetch current tier
- `create-membership-checkout` edge function (already exists) for Stripe Checkout
- `customer-portal` edge function (new) for subscription management
- `MEMBERSHIP_TIERS` constant (already exists) for tier definitions
- `user_subscriptions` table (already exists) for persisted subscription data
