

# Move Community Districts Between Shorts and "Share Your Journey"

## What Changes
The Districts section will appear directly after the Shorts carousel and before the "Share your journey" post composer in the Social tab feed. Currently it appears after the 4th post in the feed -- this moves it up to the correct position.

## Technical Details

### File: `src/components/UnifiedCommunityFeed.tsx`

1. **Move interstitial rendering location**: Instead of injecting `interstitialContent` inside the posts loop (after post index N), render it immediately after the `<ShortsCarousel />` component and before the "Share your journey" `<Card>` section.

2. **Layout order will become**:
   - Shorts Carousel
   - interstitialContent (DistrictRooms)
   - "Share your journey" post composer
   - Posts feed

3. **Remove the `wrapWithInterstitial` helper** from the posts mapping loop since the interstitial is no longer injected between posts.

4. **Keep the `interstitialContent` and `interstitialAfterIndex` props** (the prop is still used, just rendered in a different spot; `interstitialAfterIndex` becomes unused but harmless to keep for backward compatibility).

### No changes to dashboard files
All five dashboards (Student, Mentor, Advisor, Investor, Accelerator) already pass `<DistrictRooms />` as `interstitialContent` -- they remain unchanged.

