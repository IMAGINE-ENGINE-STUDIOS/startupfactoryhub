

## Problem
Current PDF export captures each `[data-pdf-section]` as a single image:
- Leaves large blank space at the bottom of pages when the next section doesn't fit
- The Experience section (15+ items) is one giant image — sliced at arbitrary pixel rows, cutting cards in half
- No limit of 7 experiences per page
- Section gap (4mm) compounds the white space

## Fix — rewrite `handleDownloadPDF` only

Refactor to **item-level pagination** with tighter packing:

1. **Wider content area** — reduce margins from `8mm` → `6mm` (more usable width, less side blank space).

2. **Sub-section captures** — instead of 1 image per section, capture each section's *child blocks* individually:
   - Add `data-pdf-block` to: each experience card wrapper, each research project card, each interview card, each education card, each certification card, each honors list, each skills group card, each beyond-work card.
   - Each section header (the 3-line title row) gets `data-pdf-block` too, so the header travels with its first item.

3. **Greedy pack algorithm** — for each section:
   - Capture header block first.
   - For each child block: measure its height in mm; if it fits in the remaining page space, place it; if not, start a new page and place it there.
   - Use a small **2mm gap** between blocks within a section, **0mm extra** between sections (the next section's header just continues on the current page if it fits).

4. **Experience hard cap** — track `experienceItemsOnPage`; after 7 experience cards, force a new page even if more fit.

5. **Oversized block fallback** — if a single block is taller than a full page (rare), slice that single block only (current slicing logic, scoped to one block).

6. **Background fill** — keep `fillPageBg()` so dark background extends edge-to-edge on every page.

### Files touched
- `src/pages/KhaliaPadillaCV.tsx` — only the `handleDownloadPDF` function and adding `data-pdf-block` attributes to repeating items inside each section. No visual/UI changes to the page itself.

### Result
- No blank tail space (next block fills remaining page height)
- No mid-card cuts (page breaks happen between blocks)
- Max 7 experience cards per page
- Wider content (12mm extra width from reduced margins)

