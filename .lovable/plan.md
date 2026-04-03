

# Hot Deals Portal: Banner + Layout Reorder

## Changes

### 1. Add SpaceEventBanner above PartnersCarousel in the portal
Import `SpaceEventBanner` from `@/components/marketing/SpaceEventBanner` and place it just above the `PartnersCarousel` section. Remove the download buttons wrapper since this is for display only — or keep the full component as-is (it includes its own download UI).

### 2. Add scan-line animation to the banner
Wrap the SpaceEventBanner canvas area with the existing `scan-effect` CSS class (same animation used by the Artemis banner in the Artemis Watch Party portal). This gives it the sweeping scan-line effect.

### 3. Ensure banner says 2026
In `SpaceEventBanner.tsx`, update the date text from `"April 16th, 2025"` to `"April 16th, 2026"` (line ~233 in the canvas draw code) and the badge date `"April 16, 2026"` is already correct in the portal.

### 4. Reorder sections in HotDealsPortal.tsx
Current order: Pitch Room → Agenda → Banner → Speakers → Winner → Voting → Live Chat → Widgets → Partners

New order:
1. **Pitch Room** (top, unchanged)
2. **Agenda Ticker**
3. **Live Chat** (moved up, right under agenda)
4. **Speakers** (moved under live chat)
5. **Winner**
6. **Voting Cards**
7. **Widgets (3D + Arcade)**
8. **SpaceEventBanner** (new, with scan-effect animation)
9. **Partners Carousel**

Remove the existing inline event banner (lines 129-142 in HotDealsPortal.tsx) since the SpaceEventBanner replaces it.

## Files Modified

- **`src/pages/HotDealsPortal.tsx`** — import SpaceEventBanner, reorder sections, remove inline banner, add scan-effect wrapper
- **`src/components/marketing/SpaceEventBanner.tsx`** — change date from 2025 to 2026

