

# Redesign "The Product" Slide - Tron-Inspired, Stunning & Coherent

## Problem
The current Product slide uses a custom section layout that differs from other slides (no `SlideContainer`, no `FloatingHexagons`, no `EnergyLines`, title positioned differently). It lacks the Tron-style light effects and geometric details present in the rest of the deck.

## Design Vision
A Tron-inspired, cinematic slide with glowing neon light trails, geometric backgrounds, and a coherent title placement matching all other slides.

## Changes (all in `src/pages/Deck.tsx`, lines 897-1029)

### 1. Use SlideContainer-consistent structure
- Wrap content in the same `SlideWrapper > section` pattern with `bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950`
- Include ALL geometric components: `TechGrid`, `FloatingHexagons`, `EnergyLines`, `CornerAccents`
- Add the standard `border-2 border-teal-500/30` inner frame at `inset-[2%]`

### 2. Title placement matching other slides
- Center the title at top like other slides (e.g., Global Footprint, Ecosystem Overview):
  - Centered `IconBadge + "The Product"` heading
  - Subtitle below: "All-in-One Startup Operating System"

### 3. Tron-style neon light effects (new decorative elements)
- **Glowing circuit lines**: Horizontal and diagonal neon lines with `bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent` and animated glow via `shadow-emerald-500/50`
- **Neon ring accents**: Concentric circles with emerald/cyan glow (`box-shadow: 0 0 20px`) placed strategically
- **Light beam rays**: Diagonal light beams radiating from behind the mockups using gradient overlays
- **Glowing particle dots**: Animated bright dots (emerald, cyan, teal) scattered across the background, larger and brighter than current `EnergyLines`
- **Pulsing corner nodes**: Small glowing squares at grid intersections that pulse

### 4. Mockup layout (kept but enhanced)
- Keep the split layout: left description (22%) + right 3D scene (78%)
- Feature list remains with its emerald accent styling
- Monitor, floating pages, and phone mockup stay in position
- Add **neon glow borders** to the monitor and phone: `shadow-[0_0_30px_rgba(16,185,129,0.3)]` (emerald glow)
- Add subtle **cyan glow** to floating pages: `shadow-[0_0_20px_rgba(6,182,212,0.2)]`

### 5. Bottom accent bar
- A horizontal glowing line below the content area, matching the `SectionDivider` style but as a decorative footer element

## Technical Details

- Only `src/pages/Deck.tsx` is modified (lines ~897-1029)
- No new dependencies or files needed
- Reuses existing `TechGrid`, `FloatingHexagons`, `EnergyLines`, `CornerAccents`, `IconBadge` components
- All new effects are pure CSS (gradients, box-shadows, borders) -- no JS animations added
- Print styles preserved with `print:hidden` on decorative elements

