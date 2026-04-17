

## Goal
1. Add **Accelerator Partner** and **Community Partner** as new cards in the Partnership Models section
2. Delete the entire "How to Partner" slide (redundant)
3. Increase font size on the "About Us" / "Why Us" content slide

## Changes — `src/pages/Brochure.tsx`

### 1. Add 2 new partnership cards
Add to the `partners` array on the Strategic Partner Mapping page:

```tsx
{
  title: "Accelerator Partner",
  icon: Rocket,
  color: "cyan", // or new shade
  tag: "Scale",
  description: "Co-run cohorts with Startup Factory Hub — leverage our platform, mentor network, and global pipeline to scale your acceleration programs.",
  points: [
    "White-label cohort management platform",
    "Access to global mentor & investor network",
    "Joint demo days & cross-cohort exposure",
    "Shared deal flow & startup pipeline",
  ],
},
{
  title: "Community Partner",
  icon: Users,
  color: "violet", // new tone
  tag: "Connect",
  description: "Bring your community of founders, builders, or operators into the Startup Factory Hub network — events, resources, and visibility.",
  points: [
    "Joint events, AMAs & founder meetups",
    "Member access to platform tools & perks",
    "Cross-promotion across both networks",
    "Featured community presence on platform",
  ],
},
```

Add corresponding entries to `colorMap` (keep `cyan` if reusing; add `violet` as new). Total cards becomes **8** — switch the centered stack to a **2-column grid** (`grid grid-cols-2 gap-2`) so they all fit cleanly on one A4 page with the `flex-1 justify-center` wrapper. University Partners stays as a full-width card below the grid (or moves into the grid — to be decided based on layout fit; default: include it in the grid as the 9th card spanning full width via `col-span-2`, OR keep it as one of the grid cells if 8+1 = 9 odd cells, in which case University spans `col-span-2` at the bottom).

**Final layout decision**: 4 rows × 2 columns = 8 cards in grid, then University Partners as full-width emphasis row beneath. Tighten card padding to `p-2.5`, title `text-[14px]`, description `text-[11.5px]`, bullets `text-[11px]` to ensure clean fit.

### 2. Delete the "How to Partner" slide
Locate and remove the entire `<BookPage>...</BookPage>` block for the "How to Partner" page (the one with `Handshake` icon header reading "Partnership Models" tag near line ~1375). Remove the full JSX block including the `<BookPage>` wrapper.

### 3. Increase "About Us" content font size
Identify the About Us / Why Us / Overview slide and bump its body text and bullets up by ~1–2px (e.g. `text-[13px]` → `text-[15px]`, headings proportionally). Will read the relevant section first to confirm exact selectors before adjusting.

## What stays the same
- All other pages (Cover, Problem, Solution, Ecosystem, Track Record, NASDAQ, Membership Tiers, Contact, etc.)
- Flipbook structure, navigation, export logic
- University Partners emphasis card (kept, layout adjusted to fit)
- Color system, fonts, icons elsewhere

## Files touched
- `src/pages/Brochure.tsx` only

