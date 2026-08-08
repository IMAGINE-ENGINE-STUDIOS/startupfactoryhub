# Accelerator as a Service — brochure fixes

Four targeted changes in `src/pages/AcceleratorBrochure.tsx`. No other page is touched.

## 1. Cover title is too big
The "ACCELERATOR / AS A / SERVICE" headline is locked at 92px on a 3-line stack, which dominates the cover.
Reduce it to a responsive size (~62px, scaled down further on small viewports) so the neon underline, subtitle and bottom HUD breathe.

## 2. Slide 03 — centered globe
Slide 03 currently shows a static "Global Innovation Network" photo tile in the left column.
Replace it with an interactive rotating globe (Mapbox GL, already used in this project) rendered in globe projection:
- Dark, label-light style so it matches the slide's cyan/navy panel.
- Auto-rotating, non-interactive (no scroll/drag hijack while flipping pages).
- Centered in the tile, with hub markers for the network cities.
- Keeps the existing "Global Innovation Network / Global · Remote + On-Site / 360°" HUD labels.
- Falls back to the current image if the map fails to load, so the page never renders blank.

Since this deck is the general-partner version, the globe stays generic (worldwide network) with no single-city framing.

## 3. Slide 04 — Commercial Model without pricing
Remove all monetary figures from the commercial slide and keep only the descriptive information:
- Drop the `$3,500`, `$5,000`, `$1,000` price figures, the "per startup / monthly / per course" units and the per-line total chips.
- Drop the `$72,500` grand-total bar entirely.
- Keep the three service lines (Acceleration Batch, Platform & License, Mentor Certification) with their titles, notes and descriptions, rebalanced into a clean 3-card layout now that the price column is gone.
- Replace the total bar with a neutral summary strip: 4-month batch, minimum 15 startups, includes acceleration + platform + certification — no numbers with currency.
- Header keeps "Duration: 4 months" and "Minimum: 15 startups".

## 4. Unreadable green text
On the emerald gradient panel, the eyebrow/label text uses the same emerald `#10b981` as the background, so it disappears.
Switch those labels to a high-contrast pale mint / white (`#d1fae5` / `#ffffff`) and darken the panel behind the line items slightly, so every label, note and description passes a readable contrast on the green background.

## Technical notes
- All edits are presentational and live inside `src/pages/AcceleratorBrochure.tsx`.
- The globe uses `mapbox-gl` (already a dependency) with the existing project Mapbox token setup; if no token is available it renders the current image fallback.
- No database, routing, or business-logic changes.
