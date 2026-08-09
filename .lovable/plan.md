# Add the Resource Map to Slide 02 of the Accelerator Brochure

## What's happening today

Slide 02 ("The Operating System for the Next Generation of Founders") has no map at all. Its right-hand column is a static background photo with a tint overlay, the vertical "Infrastructure First" label and the floating "Platform by the Numbers" stat card. The only live map in the brochure is the auto-rotating globe on slide 03.

## What will be built

Replace the static photo panel on slide 02 with a live **Resource Network Map** while keeping the slide's magazine layout, the vertical label, and the stats card exactly as they are.

- New component `src/components/brochure/BrochureResourceMap.tsx`:
  - Mapbox map in flat (Mercator) world view, dark style matching the brochure palette, non-interactive (no drag, scroll or zoom) so it never fights the page-flip gesture.
  - Markers pulled from the real resources data (`useResources`), color-coded by resource type, with the existing neon glow marker treatment used by the globe.
  - Slow ambient drift/auto-pan instead of full spin, so the flat map stays readable.
  - Graceful fallback to the current `visionHub` image if Mapbox fails to initialise, same pattern as `SFHNetworkGlobe`.
  - A small legend chip row (resource type counts) in the corner, in the slide's mono/uppercase style.
- Slide 02 integration in `src/pages/AcceleratorBrochure.tsx`:
  - Map renders behind the existing tint gradient so the stats card and label stay legible.
  - Panel labelled "Global Resource Network" in the same corner-label style used on slide 03.
  - Wrapped in `data-no-flip` so touching the map never turns the page.

## Technical notes

- Reuses the existing Mapbox token resolution already used by `SFHNetworkGlobe` (connector env var with hardcoded fallback).
- Does **not** reuse `GlobalResourcesMap` directly — that component carries the full app UI (sidebar, filters, search, bookmarks, Earth Intelligence) and would break the brochure layout. The new component is a presentation-only view over the same resource data.
- Markers are capped (e.g. first ~120 resources) to keep the flipbook frame rate smooth.
- No changes to slide 03's globe, no slide renumbering, page count stays 13.

## Verification

Load `/accelerator-brochure`, confirm the map canvas renders on slide 02, markers appear, and clicking/dragging over the map does not flip the page.
