

## Brochure: Add NASDAQ Tower Feature Page

### What Changes

**New Page: NASDAQ Tower Feature (insert after Page 8 "Events & Collaborations", before Contact/CTA)**

A full-bleed page using the existing `nasdaq-feature.jpg` asset as background, styled similarly to the `NasdaqFeature` component but adapted for the A4 portrait brochure format:

- Full background image with heavy gradient overlay (`from-slate-950/90`) and `backdrop-blur-sm` for the dark tech aesthetic
- "AS FEATURED IN" badge at top (teal accent, matching brochure style)
- Large title: **"Featured on the NASDAQ Tower"** with "NASDAQ Tower" in teal gradient text
- Subtitle: "Startup Factory Hub showcased in Times Square, New York City"
- A brief 2-3 sentence description about the significance of the feature
- Corner accents, tech grid, and energy lines overlays consistent with other pages

### Page Order (updates)
- Page 8: Events & Collaborations (unchanged)
- **Page 9: NASDAQ Tower Feature (NEW)**
- Page 10: How to Partner (renumbered)
- Page 11: Contact / CTA (renumbered)

### Files Modified
- **`src/pages/Brochure.tsx`**:
  - Import `nasdaqFeature` from `@/assets/nasdaq-feature.jpg`
  - Insert new `A4Wrapper` section between Page 8 (Events) and the current Page 9 (Contact/CTA or How to Partner)
  - Update page numbering in comments

