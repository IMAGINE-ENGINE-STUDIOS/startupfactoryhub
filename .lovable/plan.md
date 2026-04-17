

## Goal
Transform `/brochure` from a vertical scroll into an **interactive flipbook** (Apple Books / magazine style): cover page first, then 2-page spreads with realistic page-flip animation.

## Approach — Use `react-pageflip`

Industry-standard library (`react-pageflip` / `HTMLFlipBook`) — supports cover-first single page, then 2-page spreads, drag-to-flip, click corners, swipe on mobile, hard cover styling. Used by many Apple Books–style web demos.

```bash
npm i react-pageflip
```

## Implementation — `src/pages/Brochure.tsx`

### 1. Wrap each existing `<A4Wrapper>` page as a flipbook page
Keep all current page content untouched. Just stop stacking them and feed them into `<HTMLFlipBook>` as children. Each child = one page.

### 2. Flipbook configuration
```tsx
<HTMLFlipBook
  width={595}              // A4 ratio (BASE_W/2 scaled)
  height={841}
  size="stretch"           // responsive
  minWidth={315} maxWidth={800}
  minHeight={400} maxHeight={1100}
  showCover={true}         // page 1 stands alone, then spreads
  mobileScrollSupport={true}
  drawShadow={true}
  flippingTime={700}
  maxShadowOpacity={0.5}
  className="mx-auto"
>
  {/* Page 1 = cover (single) */}
  {/* Pages 2+ = pairs shown as spreads */}
</HTMLFlipBook>
```

### 3. Layout changes
- Remove `max-w-[700px] mx-auto` vertical stack
- Container becomes: dark backdrop (`bg-slate-950`), centered flipbook, with subtle radial glow behind for "table" feel
- Each page wrapped: `<div className="page-shell bg-slate-950 overflow-hidden">{<A4Wrapper>...children...</A4Wrapper>}</div>`
- A4Wrapper already handles aspect ratio + scaling — leaves content intact

### 4. Navigation controls (top bar additions)
- Prev / Next buttons + page indicator (e.g. "3 / 16") next to existing Home/Export buttons
- Use a `bookRef` with `pageFlip().flipPrev() / flipNext()` and `onFlip` event to track current page
- Keyboard: ArrowLeft / ArrowRight to flip
- Keep existing Export PDF — `data-slide` elements still queryable inside flipbook DOM

### 5. Visual polish (book feel)
- Add a soft "spine" gradient down the center of spreads (subtle dark vertical line via CSS)
- Add `box-shadow: 0 30px 80px rgba(0,0,0,0.6)` on book wrapper
- Cursor `grab` on hover, `grabbing` while flipping (library handles this)
- Background page area: deep gradient `from-slate-950 to-black` with subtle stars/grid (already exists via existing FloatingHexagons usage option)

### 6. Mobile
- `size="stretch"` makes pages scale; on screens <768px the library auto-switches to single-page mode (set via `usePortrait={true}`-equivalent prop is automatic)
- `mobileScrollSupport={true}` allows scroll-past on small screens

## What stays the same
- All existing page content (Cover, Overview, Problem, Solution, Ecosystem, Partnership Models mosaic, Track Record, NASDAQ, How to Partner, etc.) — untouched
- Export PDF logic (still iterates `data-slide` elements)
- A4Wrapper scaling
- Top nav bar (Home + Export PDF), with new prev/next/indicator added

## Files touched
- `src/pages/Brochure.tsx` — restructure render tree only
- `package.json` — add `react-pageflip`

