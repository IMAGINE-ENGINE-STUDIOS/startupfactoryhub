

## Goal
Make the Partnership Models hexagons readable: enlarge nodes, fix overlapping, and make the University Partners bar bigger/clearer.

## Problem
- Hex nodes (230×195) overlap the central hub when positioned with `top-0`, `left-0`, etc. on a ~420px container → text gets clipped/unreadable
- Hexagon clip-path wastes ~25% horizontal space on each side, so text area is tiny
- University Partners bar is currently small (p-3.5, text-[12px]) and feels secondary

## Fix — `src/pages/Brochure.tsx` lines 937–1104

### 1. Enlarge orbit container & space the nodes properly
- Container: `min-h-[420px]` → `min-h-[540px]`
- Use a true positioning grid: nodes anchored via percentage offsets so they DON'T overlap the hub
  - Top: `top-[2%]`
  - Bottom: `bottom-[2%]`
  - Left: `left-[1%]`
  - Right: `right-[1%]`

### 2. Make hex nodes substantially bigger
- Node size: `w-[230px] h-[195px]` → `w-[300px] h-[260px]`
- Inner content padding: `px-5 py-4` → `px-8 py-6` (hexagon needs more horizontal padding because of clipped corners)
- Icon badge: `w-7 h-7` → `w-9 h-9`, icon `w-3.5` → `w-5`
- Title: `text-[12px]` → `text-[15px]`
- Bullets: `text-[9.5px]` → `text-[12px]`, `leading-snug` → `leading-relaxed`
- Bullet dot: `w-1 h-1` → `w-1.5 h-1.5`

### 3. Enlarge central hub (so it stays proportional)
- Hub: `w-[160px] h-[140px]` → `w-[190px] h-[165px]`
- Hub icon: `w-6 h-6` → `w-8 h-8`
- Hub title: `text-[10px]` → `text-[12px]`
- Subtitle: `text-[9px]` → `text-[10px]`

### 4. Update SVG connector endpoints
- Adjust line endpoints so they meet the new node positions cleanly:
  - Top: `y2="12%"` → `y2="22%"`
  - Right: `x2="88%"` → `x2="78%"`
  - Bottom: `y2="88%"` → `y2="78%"`
  - Left: `x2="12%"` → `x2="22%"`

### 5. Make University Partners bar bigger/more readable
- Padding: `p-3.5` → `p-5`
- Header icon: `w-9 h-9` → `w-11 h-11`, icon `w-4` → `w-5`
- Title: `text-[15px]` → `text-[17px]`
- Description: `text-[12.5px]` → `text-[14px]`
- Bullets: `text-[12px]` → `text-[13.5px]`, gap-y `1.5` → `2`
- Margin top: `mt-3` → `mt-4`

### 6. Header spacing
- `min-h-[420px]` already updated; keep header chip + title unchanged

## What stays
- Hexagonal "orbit" concept and clip-path geometry
- All copy verbatim (partner titles, bullets, university bullets)
- Color palette, gradients, SVG connector style (dashed)
- Background, TechGrid, FloatingHexagons, EnergyLines, CornerAccents

