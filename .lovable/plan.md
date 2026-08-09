# Slide 08 — Growth Tree Rebuild

Slide 08 ("Benefits to Your Organization") currently shows a thin flat SVG tree with no visible canopy, root labels colliding with the ground line, tiny 11px benefit text, a timeline that wraps onto two rows, and a "Year 0 → Year 3" story that contradicts the 4-month batch. Rebuild it.

## 1. Real 3D tree

Replace the hand-drawn SVG with a real 3D tree rendered in `three.js` (already installed — no react-three-fiber needed), using the open-source **proctree.js** procedural tree algorithm (MIT, by Paul Brunt / used in Sketchfab's tree generator). It generates trunk + branch + twig geometry from parameters, so the tree can literally grow.

- Slow auto-rotate, soft emerald/teal material, glowing leaf sprites, subtle bloom-free glow that fits the light glass brochure background.
- Growth is driven by the stage index: branch depth, twig count and canopy density increase per stage, animated with an eased transition.
- Static fallback: if WebGL is unavailable or `prefers-reduced-motion` is set, render a single high-quality still frame (or the simplified SVG) so the PDF/print view never breaks.
- Wrapped in `data-no-flip` so dragging the canvas never turns the brochure page.

## 2. Timeline = the 4-month program (no "years")

Remove all Year 0–Year 3 language. New four stages, matching the batch:

```text
MONTH 1 · Onboard   MONTH 2 · Build   MONTH 3 · Traction   MONTH 4 · Demo Day
```

Rendered as one single non-wrapping row of pills under the tree. Metric counters below re-scale to realistic batch outcomes instead of multi-year totals (exact figures to be confirmed — see Open item).

## 3. Readable, non-overlapping content

- Benefit cards: bump label to ~13px and description to ~13px, more padding, generous line-height, and a numbered chip that matches the numbered node on the tree.
- Root labels (Brand / Capital / Market / Mandate) move out of the canvas into a clean labelled row beneath the tree, so nothing overlaps the ground line.
- Column split changes to roughly `360px | 1fr` so the text column has real breathing room and the tree gets a taller, squarer stage.
- Hovering a benefit card highlights its branch on the tree, and vice versa.

## Technical notes

- New component `src/components/brochure/GrowthTree3D.tsx` (three.js scene + proctree geometry helper in `src/lib/proctree.ts`), replacing `GrowthTree.tsx` usage on slide 08 only.
- Renderer is created once, paused when the page is not visible (IntersectionObserver) to keep the flipbook smooth.
- Colors come from the existing `NEON` palette on the brochure page; no new hardcoded hexes in the slide.
- `GROWTH_BENEFITS` copy stays the same, only `stage` values remap to months 1–4.

## Open item

The counters currently read 48 ventures / 40 innovation projects / 31k reach across 3 years. For a 4-month batch these need real numbers. I will use the actual batch size (10 startups) and leave any figure I cannot source as a visibly marked placeholder for you to confirm.
