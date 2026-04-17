
## Goal
Center Platform Features and Membership Tiers slides like the Overview slide (vertically centered title + content), and make Membership tier cards bigger using a 2-per-row layout.

## Changes — `src/pages/Brochure.tsx`

### Slide 4 — Platform Features (lines ~610-641)
- Replace simple `PageContainer` header with **Overview-style centered structure**:
  - Add chip header: `◆ ECOSYSTEM CAPABILITIES ◆` (teal/emerald accent)
  - Bigger centered title `text-4xl` like Overview
  - Decorative separator line with center `Diamond` icon
- Wrap content in `flex-1 flex flex-col justify-center` so the 9 feature cards are vertically centered on the page
- Keep existing 3-column grid and tech-card styling
- Change grid `content-start` → `content-center`

### Slide 5 — Membership Tiers (lines ~643-688)
- Same Overview-style centered header treatment (chip + big title + separator with diamond)
- **Change grid from 3 columns to 2 columns** (`grid-cols-3` → `grid-cols-2`)
- **Make cards bigger**:
  - Padding `p-3` → `p-5`
  - Icon box `w-7 h-7` → `w-10 h-10`, icon `h-3.5 w-3.5` → `h-5 w-5`
  - Tier name `text-sm` → `text-lg`
  - Target text `text-[10px]` → `text-xs`
  - Price `text-lg` → `text-2xl`
  - Period `text-[9px]` → `text-xs`
  - Feature items `text-[11px]` → `text-sm`, check icon `h-3 w-3` → `h-4 w-4`
  - Gap `gap-2.5` → `gap-4`
- Wrap grid in `flex-1 flex flex-col justify-center` for vertical centering
- Keep all 6 tiers, no content removed
- Keep tech-card styling and "RECOMMENDED" badge

### What stays untouched
- All other slides (Cover, Overview, Problem, Solution, Ecosystem, etc.)
- Tech-card styling system
- Matrix background
- Card content (no copy changes)
- Color accents per tier
