# WTC Brochure Redesign — Orlando World-Class Innovation Center

Rebuild `/wtcbrochure` (`src/pages/WTCBrochure.tsx`) as a dynamic, modern, glassmorphic flipbook with neon-light accents and matrix-style background details. Every page fills its A4 canvas edge-to-edge with large typography, no empty whitespace, and animated visual elements.

## Design Language

**Aesthetic**: Glassmorphism + neon HUD + matrix rain. Think "Orlando Innovation Command Center."

- **Palette** (semantic tokens, added to `index.css`):
  - Base: deep midnight `220 40% 4%` with subtle blue/teal gradients
  - Neon primary: cyan `180 100% 55%`
  - Neon secondary: magenta `300 100% 60%` for accent contrast
  - Neon tertiary: lime `150 100% 55%` for data highlights
  - Glass surface: `220 40% 8% / 0.4` with `backdrop-blur-xl` and 1px gradient borders
- **Typography**: 
  - Display: `Orbitron` (already in tailwind config) for page numbers, KPIs, section codes
  - Headings: `Sora` 700/800, sizes bumped — page titles `text-6xl`/`text-7xl`, section headers `text-4xl`
  - Body: `Manrope` `text-lg`/`text-xl` minimum (no more `text-sm` body copy)
  - Mono: `JetBrains Mono` for HUD labels, coordinates, indices
- **Motion**: framer-motion fade/slide on page flip, animated gradient borders, pulsing neon dots, scanning lines across hero cards, slow-rotating accent rings.

## Page-by-Page Rebuild (13 pages, A4 portrait, content fills 100%)

1. **Cover** — Full-bleed matrix rain + animated globe/orbit SVG. Massive Orbitron title "ORLANDO INNOVATION NEXUS" with neon underline scan. Stamp: "Joint Venture · WTC × SFH". Coordinates HUD strip at bottom.
2. **Vision** — Split layout: left huge quote in glass card with gradient border, right vertical stat stack (3 neon KPI tiles, each filling 1/3 height).
3. **The Opportunity** — 4-quadrant glass grid edge-to-edge, each quadrant a metric (market size, jobs, GDP, timeline) with animated counter aesthetic.
4. **Joint Venture Structure** — Center: large 50/50 visual (two interlocking neon hexagons filling height). Sides: equity, governance, contribution lists in glass cards.
5. **WTC Contribution** — Vertical full-height timeline rail with 5 glowing nodes; each node expands to a glass card with icon badge.
6. **SFH Contribution** — Mirror of page 5, opposite rail direction, magenta accent instead of cyan.
7. **Capability Matrix** — 4×4 grid of 16 capabilities filling page; each cell a mini glass tile with hover glow, icon, and short label in mono.
8. **Digital Platform** — Hero device mockup glass frame on left filling vertical, right column = 4 feature blocks stacked, each with neon icon badge. add AR component to play witht he ar in ohone view 
9. **AR / Immersive Layer** — Full-bleed image background with glass overlay panel; neon HUD corners; tagline in 6xl.
10. **Roadmap** — Horizontal phased timeline filling page width with 4 phases, each a glass column with neon top border and milestone bullets.
11. **Financial Model** — 3 large glass KPI cards top row (filling 50% height), bottom = revenue stream bars with animated gradient fills.
12. **Governance & Next Steps** — Two-column: left signing block glass card, right next-step checklist with neon check icons.
13. **Closing** — Full matrix-rain background, centered Orbitron "LET'S BUILD THE FUTURE", contact HUD strip, animated orbit ring.

## Shared Components (in-file)

- `GlassCard` — `backdrop-blur-xl bg-[hsl(var(--background)/0.4)] border` with animated gradient border via `::before` pseudo (CSS variable driven).
- `NeonBadge` — icon tile with neon ring + glow shadow.
- `HUDCorners` — 4 absolute-positioned L-brackets with neon stroke.
- `ScanLine` — animated gradient sweep across card top.
- `MatrixLayer` — reuse existing `MatrixSymbolLayer`, retuned to cyan/magenta.
- `PageFrame` — wraps every page with page number (Orbitron), section code (mono), HUD corners, and matrix layer at low opacity.

## Technical Notes

- Single file edit: `src/pages/WTCBrochure.tsx` (full rewrite of page contents and shared components).
- Add ~6 new design tokens to `src/index.css` under `:root` and `.dark` (neon hues, glass gradient, neon shadows). No hardcoded colors in JSX — all via tokens.
- Keep existing `react-pageflip` `A4Wrapper` and 842×1190 sizing logic untouched.
- Keep route registration in `src/App.tsx` as-is.
- Use `framer-motion` (already installed) for entrance animations on each page.

## Out of Scope

- Other pages, routes, or components.
- No backend or data changes.
- `/wtc` partnership presentation stays untouched.