

## Brochure: Bigger Cards, Ecosystem Schema, Blur + Tech Styling Everywhere

### Changes

**1. Page 4 — Platform Features: Bigger cards**
- Change grid from `grid-cols-3 gap-2` to `grid-cols-3 gap-3`
- Each feature card: increase padding from `p-2` to `p-4`, icon from `w-6 h-6` to `w-8 h-8`, label from `text-sm` to `text-base`, description from `text-[11px]` to `text-sm`
- Use `TechCard` with `backdrop-blur-sm` styling matching the "How to Partner" card size

**2. Page 7 — Features by Role: Bigger cards**
- Change grid from `grid-cols-4 gap-2.5` to `grid-cols-2 gap-4` (2x2 layout like How to Partner)
- Each role card: increase padding from `p-2.5` to `p-5`, icon from `w-7 h-7` to `w-10 h-10`, title from `text-sm` to `text-lg`, feature labels from `text-[11px]` to `text-sm`, descriptions from `text-[10px]` to `text-[11px]`
- Add `backdrop-blur-sm` and `bg-slate-800/50` styling to match How to Partner cards

**3. Page 8 — Events & Collaborations: Bigger event cards**
- Increase `min-h-[160px]` to `min-h-[200px]` on event cards
- Increase card padding from `p-3` to `p-4`
- Increase title from `text-sm` to `text-base`, description text stays `text-sm`
- Add `backdrop-blur-sm` to all event cards

**4. Page 9 — NASDAQ Tower: Move overlays to top**
- Reorder so `TechGrid`, `FloatingHexagons`, `EnergyLines`, `CornerAccents` render above the content `z-10` layer — ensure they sit at the top visually by placing them after the gradient overlay but keeping proper z-index

**5. Page 6 — Ecosystem View: Gear schema + Journey below**
- Replace the 4x2 grid of stakeholder cards with a **circular gear diagram**:
  - SFH logo (`w-24 h-24`) centered in the middle with a glowing border
  - 8 ecosystem members positioned radially around it using absolute positioning in a circle
  - Each member shown as a gear-shaped node (using CSS `clip-path` or border styling) with icon + label
  - Add CSS animation: slow rotation of the outer ring (`animate-spin` with 30s duration) while inner logo stays static
- Keep the "Startup Journey Roadmap" section below the gear diagram unchanged

**6. All slides — Blur effect + Tech card styling**
- Partners page (Page 8 partners): add `backdrop-blur-sm` to section overlay (currently `bg-slate-950/78`, change to include `backdrop-blur-sm`)
- Events page (Page 8 events): already has overlays, add `backdrop-blur-sm` to main gradient overlay
- Any page missing `backdrop-blur-sm` on its gradient overlay: add it
- All card elements across all pages: ensure they use `bg-slate-800/50 backdrop-blur-sm border` styling consistent with TechCard/How to Partner aesthetic

### Files Modified
- **`src/pages/Brochure.tsx`** — All changes in this single file

### Page order stays the same (11 pages, no additions or removals)

