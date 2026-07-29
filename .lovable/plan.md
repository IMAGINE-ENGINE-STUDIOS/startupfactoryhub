## Goal

On the main page (`/`): add an "AI Tools" card to the **Powerful Features** grid, remove the **AI Power Tools** section, and replace it with a Resource Map viewport showing all resources — with Earth Intelligence hidden on this page.

## Changes

**1. `src/components/FeaturesSection.tsx`**
- Add a new feature entry "AI Tools" (Lucide `Bot` or `Brain` icon) with a short description covering summaries, translation, sentiment and document analysis, matching the existing card styling and gradient pattern. Grid stays 2/3 columns (10 cards).

**2. `src/pages/Index.tsx`**
- Remove `AIAssistantPreview` (the AI Power Tools section) from the page and its import.
- Insert a new `ResourceMapSection` in the same position.

**3. New `src/components/ResourceMapSection.tsx`**
- Section header ("Global Resource Map" + one-line subtitle) matching the Features section typography.
- Lazy-loads `GlobalResourcesMap` inside a rounded, bordered container (~`h-[500px]` desktop, shorter on mobile) with a loading fallback.

**4. `src/components/GlobalResourcesMap.tsx`**
- Add an optional prop `hideEarthIntelligence?: boolean` (default `false`).
- When true, hide the Earth Intelligence category button/panel, the Earth legend widget, and the Earth viewport toolbar. No change to existing behavior elsewhere (Earth stays admin-only as today).

## Notes

- The AI Power Tools component file itself is kept in the codebase (only removed from the home page) unless you want it deleted.
- Map on the home page shows the standard (non-emergency) resource set with existing filters and clustering.
