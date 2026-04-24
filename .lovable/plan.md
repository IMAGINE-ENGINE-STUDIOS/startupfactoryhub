## PDF Layout Fix: 2-Column Rows for Certifications & Skills

**File:** `src/pages/KhaliaPadillaCV.tsx`

### Changes
1. **Certifications section** — Replace the flat `.map()` over individual cards with a grouped `.map()` that pairs items two-at-a-time. Wrap each pair in a `<div data-pdf-block>` with `grid grid-cols-2 gap-4`. Remove `data-pdf-block` from the inner `<Card>` elements.

2. **Skills section** — Same treatment: group skill categories into pairs, wrap each pair in `<div data-pdf-block class="grid grid-cols-2 gap-4">`, move the PDF block marker to the wrapper.

3. **PDF CSS overrides** (inside `handleDownloadPDF`) — Ensure `[data-pdf-block]` row wrappers render as 2-column grids in the cloned PDF DOM, with `page-break-inside: avoid` so pairs don't split across pages.

### Result
PDF export shows certifications and skills as compact 2-up rows matching the on-screen desktop layout, instead of giant full-width stacked cards. No other sections, copy, or styling are touched.