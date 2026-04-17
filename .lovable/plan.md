

## Goal
Restructure **Strategic Benefits** slide: convert from 6 cards in 3-column grid → **8 cards in 2-column grid (4 rows × 2)** with bigger, more readable content. Remove the separate "Market Positioning" footer card and absorb its idea as new benefit cards (including "Be Part of a Globally Recognized Network").

## Changes — `src/pages/Brochure.tsx` (lines ~1361–1502)

### Grid restructure
- Change `grid-cols-3` → **`grid-cols-2`**
- Increase gap `gap-2.5` → `gap-3`
- Remove the separate "Market Positioning & Influence" footer block (lines 1479–1499) entirely
- Wrap grid in `flex-1 flex flex-col justify-center` so the 8 cards center vertically on the page

### Card content — 8 benefits total
Keep the existing 6, then add 2 more derived from the removed Market Positioning section:

1. Ecosystem Leadership & Ownership *(existing — teal)*
2. Connected Ecosystem Access *(existing — cyan)*
3. AI-Powered Business Intelligence *(existing — purple)*
4. Direct Access to Deal Flow *(existing — amber)*
5. Early Access to Innovation *(existing — emerald)*
6. Strategic Collaboration & Execution *(existing — rose)*
7. **NEW — Be Part of a Globally Recognized Network** *(blue)*
   - Position as a leader within a high-growth innovation network
   - Connect with global ecosystem nodes across industries and regions
   - Gain visibility and credibility through network association
8. **NEW — Shape the Future of Innovation** *(orange)*
   - Align with next-generation technologies and venture creation
   - Influence the direction of emerging ecosystems and industry trends
   - Co-create the standards of tomorrow's tech landscape

### Card sizing — make content bigger / more legible
With only 2 per row (more horizontal space), scale up:
- Card padding `p-2.5` → `p-4`
- Icon box `w-7 h-7` → `w-10 h-10`, icon `w-3.5 h-3.5` → `w-5 h-5`
- Title `text-[11px]` → `text-base` (font-bold)
- Bullet text `text-[9.5px]` → `text-sm`, leading `leading-snug` → `leading-relaxed`
- Bullet dot `w-1 h-1` → `w-1.5 h-1.5`, adjust `mt-1.5` → `mt-2`
- Header gap `gap-2` → `gap-3`, mb `mb-1.5` → `mb-3`
- List spacing `space-y-1` → `space-y-1.5`

### colorMap addition
Add `blue` and `orange` entries to the existing `colorMap` object using the same pattern:
- `blue`: border-blue-500, bg from-blue-500/15 to-cyan-500/15, icon text-blue-400, dot bg-blue-400
- `orange`: border-orange-500, bg from-orange-500/15 to-amber-500/15, icon text-orange-400, dot bg-orange-400

### Header
Keep existing chip + "Strategic Benefits" title + tagline unchanged (already correctly styled and sized).

### What stays untouched
- All other slides
- Background, TechGrid, FloatingHexagons, EnergyLines, CornerAccents
- Tech-card styling system
- Color palette / accent system
- Existing 6 benefit copies (verbatim)

