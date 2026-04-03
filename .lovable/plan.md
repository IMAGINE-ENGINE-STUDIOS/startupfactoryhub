
# Hot Deals Voting: Dynamic Ranking, Demo Data, Mobile, Layout Fix

## Changes

### 1. Insert 5 demo startups into `hot_deals_invited_startups`
Use the insert tool to add 5 confirmed demo startups with space-themed names, descriptions, and pitch titles for testing the voting system.

### 2. Sort startups dynamically by vote count in `HotDealsVoting.tsx`
- After building the cards array, sort them by vote tally (highest first)
- Add a rank number (#1 to #5) displayed prominently on each card
- Show vote count clearly next to rank
- Cards reorder in real-time as votes come in (with CSS transition)
- Change "Voting as: Hot" label to show voter name properly

### 3. Mobile-friendly improvements in `HotDealsVoting.tsx`
- Ensure card layout stacks properly on small screens
- Reduce padding/sizing on mobile
- Make vote button and rank number accessible on small screens

### 4. Move PartnersCarousel below Voting in `HotDealsPortal.tsx`
Reorder so Partners appears right after Voting, before the 3D Models/Arcade section.

### 5. Full portal mobile pass in `HotDealsPortal.tsx`
- Ensure header, share menu, iframe, and all sections work on mobile viewports
- Already mostly responsive but verify no overflow issues

## Files Modified

### `src/components/HotDealsVoting.tsx`
- Sort cards by vote count descending (placeholders always at bottom)
- Add rank badge (#1, #2, etc.) to each card
- Add smooth reorder with CSS transitions
- Mobile layout adjustments (smaller padding, stacked layout on xs)

### `src/pages/HotDealsPortal.tsx`
- Move `<PartnersCarousel />` to right after `<HotDealsVoting />`

### Database insert (via insert tool)
- 5 demo startups in `hot_deals_invited_startups` with `confirmed = true`
