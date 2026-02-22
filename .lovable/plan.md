

# Add Tier Descriptions, Target Audience, and Feature Lists to Subscription Cards

## Overview
Update the subscription tier cards in `ProfileSubscriptionTab.tsx` to include detailed descriptions, "best for" audience info, and bullet-point feature lists for each tier -- matching the content you provided.

## Changes

### 1. Add tier content data to `TIER_CONFIG`
Each tier gets three new fields:
- **description** -- short paragraph about the tier
- **bestFor** -- who the tier is ideal for
- **features** -- array of included features as bullet points

| Tier | Description | Best For | Features |
|------|------------|----------|----------|
| Community (Self-Paced) | Full digital access, virtual events, community, and mentor interactions. | Remote-first teams or early MVP-stage founders | Full resource library, Mentor sessions (virtual), Startup physical hub community access |
| Self-Paced + Office | Adds local IWG coworking space access (1 country) to the community plan. | Founders needing flexible workspace + virtual resources | All community features, Local coworking access (1 country), Mentor + event access, Eligible for Accelerated Tier |
| Global Access | All platform features + unlimited office global access (130+ countries, 5,600+ sites). | Globally distributed teams, traveling founders | All features + global private office access, Eligible for Accelerated Tier |
| Corporate | Designed for corporate innovation teams and growth-stage startups with teams across regions. | Scale-ups or corporate venture units | All features + team dashboard, Unlimited travel (11 countries), Global coworking access, Soft Landing optional ($5,000), Accelerated Tier if eligible |

### 2. Update card layout in `ProfileSubscriptionTab.tsx`
Between the price and the action button, add:
- A short description paragraph (text-xs, muted)
- A "Best for:" line (text-xs, semi-bold)
- A feature list with small check icons

The card will grow taller to fit the content, keeping the action button pinned at the bottom via flex layout.

### File Modified
- `src/components/ProfileSubscriptionTab.tsx` -- Add description/bestFor/features to `TIER_CONFIG` and render them inside each tier card

No other files are changed. The existing UI structure, styling, and functionality (upgrade/downgrade/manage buttons, glow effects, current plan highlight) remain untouched.
