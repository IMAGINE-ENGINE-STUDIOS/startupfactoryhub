
## Goal
Make the cover slide visually shocking and ensure the matrix-style symbol background appears across all slides. All cards across every slide should use the unified `tech-card` style to match branding.

## Investigation
Need to confirm current state of `src/pages/Brochure.tsx`:
- Current cover layout (logo-only, no shock factor)
- Whether `MatrixBackground` is rendered per-slide or only on cover
- Current card classes (mix of `bg-slate-900/60 border border-X/30`) — not using project's `tech-card` class

## Plan

### 1. Shocking Cover Slide
Keep the combined logo, but layer in dramatic visual elements:
- **Animated matrix rain background** (full A4 page, teal/emerald colored to match brand)
- **Radial glow halo** behind logo (large, soft teal bloom)
- **Orbiting concentric rings** around logo (thin teal strokes, subtle rotation via CSS)
- **Scan-line sweep** across the page (using existing `.scan-effect` utility)
- **Bold tagline** below logo in large futuristic font: "THE OPERATING SYSTEM FOR INNOVATION ECOSYSTEMS"
- **Corner tech brackets** (4 L-shaped corner accents in teal) for HUD feel
- **Bottom data strip** showing fake live indicators: `// SYSTEM ONLINE  //  v2.0  //  GLOBAL NETWORK ACTIVE` in mono font
- Keep solid dark gradient background (no image), just matrix symbols + glows

### 2. Matrix Symbols on Every Slide
Currently matrix background likely only on cover. Add a **subtle, low-opacity matrix symbol layer** as a shared background to every slide:
- Reuse `MatrixBackground` component (teal/emerald to match brand) at `opacity-[0.08]` on content slides, `opacity-30` on cover
- Wrap each slide's content with a relative container that has the matrix layer absolutely positioned behind
- Symbols must NOT interfere with readability — keep behind a dark overlay `bg-slate-950/80`

### 3. Unified Tech-Style Cards Across All Slides
Replace inconsistent card styling with one branded pattern. Every card across every slide gets:
- Base: `tech-card` class (already defined in `index.css` — gradient + tech border + glow shadow)
- Plus: `border border-teal-500/20` for thin neon edge
- Plus: `backdrop-blur-sm` for glassmorphism over matrix bg
- Plus: corner accent dots/brackets (small teal squares in two corners) for HUD consistency
- Color accents per slide stay (rose for problem, teal for solution, etc.) but applied as inner glow/icon color only — outer card stays the unified tech-card style
- Hover/print state retains the glow

Slides affected: Cover, Overview, Problem, Solution, Features by Role, Strategic Partner Mapping, How to Partner, Strategic Benefits, and any closing slide.

### 4. Files Touched
- `src/pages/Brochure.tsx` — cover redesign, wrap each slide with matrix bg layer, swap card class strings
- No new files, no asset changes, no content removal

### Result
- Cover hits with cinematic matrix + logo + halo + tagline + HUD brackets
- Every slide has the same subtle matrix symbol backdrop tying the deck together
- Every card uses one unified branded `tech-card` glassmorphism style — accent colors preserved per section but container styling consistent
