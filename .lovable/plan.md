

## Brochure: Bigger Content, Magazine-Style Cover, Partnership Page

### What Changes

**1. Cover page (Page 1) — Magazine-style redesign**
- Add heavy blur/shadow overlay on background (`backdrop-blur-md`, stronger gradient overlay with `from-slate-950/95`)
- Increase logo to `w-48 h-48`, title to `text-5xl`, subtitle to `text-lg`, description to `text-sm` (was `text-[12px]`)
- Add a bold tagline block below description with larger typography
- Content should fill most of the vertical space — remove tight centering, spread elements out more

**2. All pages — Increase content size to fill pages**
- Base body text from `text-[10px]`/`text-[12px]` to `text-sm` (14px)
- Section titles from `text-2xl`/`text-3xl` to `text-3xl`/`text-4xl`
- Card titles and labels proportionally larger (`text-xs` to `text-sm`)
- Feature descriptions, tier details, role features — all bumped up
- Reduce padding/margins where needed so larger text still fits
- Partner logos: increase card height from `h-20` to `h-24`, logo `max-h-14` to `max-h-16`

**3. New Page: How to Partner (insert before Contact/CTA, Page 10)**
- Title: "How to Partner With Us"
- 3-4 partnership models displayed as large cards:
  - **Strategic Partner** — Provide market expertise, local network, co-investment. For corporates & regional leaders.
  - **Accelerator Partner** — Run co-branded cohorts using our platform. White-label program management.
  - **Investment Partner** — Co-invest in portfolio startups. Access deal flow and due diligence tools.
  - **Community Partner** — Host events, provide mentors, expand local ecosystem reach.
- Each card: icon, title, 2-3 sentence description, key benefits list
- Bottom CTA: "Ready to partner? Reach out at contact@startupfactoryhub.com"

### Page Order (11 pages)
1. Cover (magazine-style with blur)
2. The Problem
3. The Solution
4. Platform Features (9 features)
5. Membership Tiers
6. User Profiles / Startup Journey
7. Features by Role
8. Partners & Network
9. Track Record & Events
10. **How to Partner** (NEW)
11. Contact / CTA

### Files Modified
- **`src/pages/Brochure.tsx`** — All changes in this single file:
  - Cover: stronger blur overlay, all text sizes increased significantly, magazine spread layout
  - All pages: body text to `text-sm`, titles to `text-3xl`/`text-4xl`, labels to `text-sm`
  - Partner logos: bigger cards and images
  - New `PageContainer` for "How to Partner" page with 4 partnership model cards in 2x2 grid
  - Reorder pages to include new partnership page before CTA

