

## Goal
1. Center the Partnership Models section vertically/horizontally on its page
2. Add a 6th partnership card: **Local Hub Representative** — for individuals/entities operating the platform locally in their city

## Changes — `src/pages/Brochure.tsx`

### 1. Add new partnership card
Add to the `partners` array (after University Partners), styled consistently with the others (gradient bar, icon, title, description, bullets):

```tsx
{
  icon: MapPin, // already-used Lucide icon family
  title: "Local Hub Representative",
  description: "Become the official operator of Startup Factory Hub in your city — represent the network locally and run the on-the-ground community.",
  points: [
    "Exclusive city/region territory rights",
    "Operate local events, demo days & founder meetups",
    "Onboard local startups, mentors & investors into the global network",
    "Revenue share on local memberships, events & sponsorships",
    "Co-branded presence (Startup Factory Hub — [City])",
    "Full access to platform tools, playbooks & global partner pipeline",
  ],
  color palette: amber/orange gradient (distinct from the 5 existing colors: blue, purple, emerald, cyan, rose)
}
```

### 2. Center the section
- Wrap the partners stack column in a flex container that centers vertically: `flex-1 flex flex-col justify-center items-stretch`
- Keep `gap-2.5` between cards (may tighten to `gap-2` to fit 6 cards in the A4 page height)
- Reduce per-card padding slightly (`p-4` → `p-3.5`) only if vertical overflow occurs with 6 cards
- Horizontal centering already handled by `A4Wrapper`

### 3. Verify legibility constraints
- Keep title `text-[16px]`, description `text-[13px]`, bullets `text-[12.5px]` (per prior approved sizing)
- If 6 cards push content past the page boundary, trim bullet count to 4 per card max (currently some have 4, this stays consistent)

## What stays the same
- Flipbook structure, all other pages, fonts, color system, icons, copy on other partnerships
- University Partners block (recently fixed) — untouched
- Corporate Partners additions (Co-Branded Accelerator, Spinoff, CVC arm) — untouched

## Files touched
- `src/pages/Brochure.tsx` only

