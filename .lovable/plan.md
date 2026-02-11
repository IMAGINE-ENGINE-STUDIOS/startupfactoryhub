

## Fixed-Resolution Slide Scaling for Deck

### Problem
Currently, slides adapt/reflow their content to fit different screen sizes. The user wants slides to always render at a fixed desktop resolution and simply scale down on smaller screens.

### Solution
Modify the `SlideWrapper` component to use a fixed 1920x1080 pixel canvas with CSS `transform: scale()` to fit any viewport. This follows the standard presentation scaling pattern.

### Technical Changes

**File: `src/pages/Deck.tsx`**

1. **Update `SlideWrapper`** to:
   - Render an outer container that measures available space
   - Place a fixed `1920x1080` inner div
   - Calculate scale factor as `Math.min(containerWidth / 1920, containerHeight / 1080)`
   - Apply `transform: scale(factor)` with `transform-origin: center center`
   - Center the fixed-size slide using absolute positioning with negative margins

2. **Implementation approach**:
   - Use a `useRef` + `useEffect` with `ResizeObserver` on the outer container to get its dimensions
   - Store the computed scale in state
   - The inner slide div is always exactly `1920px x 1080px`, positioned at `left: 50%; top: 50%` with `margin-left: -960px; margin-top: -540px`
   - The outer container keeps `overflow: hidden` and `position: relative`

3. **Result**: On mobile/tablet, slides appear as a scaled-down version of the exact desktop layout -- no text reflow, no layout shifts, just a miniature version of the full slide.

Since `SlideWrapper` is used by all slides (`CoverSlideContainer`, `SlideContainer`, and direct `SlideWrapper` usages), this single change will fix all slides at once.

