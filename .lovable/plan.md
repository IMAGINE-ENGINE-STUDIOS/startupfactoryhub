
## Goal
Replace the **Partnership Models** section's square cards with a completely different visual design — no rectangles/squares.

## Investigation
<lov-tool-use id="toolu_vrtx_01N2zRp9F14ZDELPeekS4bfW" name="code--search_files" integration-id="code" data="{\"query\": \"Partnership Models|partnership models|PARTNERSHIP MODELS\", \"include_patterns\": \"src/pages/Brochure.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01RxX5xmZ47zzDecMhLkwPzj" name="code--search_files" integration-id="code" data="{\"query\": \"Partnership Models|partnership models|PARTNERSHIP MODELS|Partnership Tiers|partnership tiers\", \"include_patterns\": \"src/pages/Brochure.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01NY6WQcvw6q1RhPc98vk4AH" name="code--view" integration-id="code" data="{\"file_path\": \"src/pages/Brochure.tsx\", \"lines\": \"900-1100\"}">
</lov-tool-use>
I have what I need. Let me design a non-square layout for the Partnership Models section.

<lov-plan>

## Goal
Replace the **Partnership Models** slide (page 7b) — currently 4 squares in a 2×2 grid + a wide University banner — with a completely different, non-square layout.

## New Design — "Hexagonal Orbit" Layout

A central hub with the 4 partner types arranged as **hexagonal nodes** orbiting it, connected by glowing lines. The University Partners stays as a distinct full-width emphasis bar below (it already wasn't a square).

### Layout structure
```text
                 ┌────────────────────┐
                 │   Corporate (top)  │
                 └─────────┬──────────┘
                           │
   Investment ──────[ STARTUP FACTORY ]────── Technology
        (left)            HUB CORE          (right)
                           │
                 ┌─────────┴──────────┐
                 │  Institutional &   │
                 │  Government (btm)  │
                 └────────────────────┘

   ━━━━━━━━━━━━━ University Partners (full-width bar) ━━━━━━━━━━━━━
```

### Visual elements
- **Center hub**: large hexagon (clip-path) labeled "Ecosystem Core" with Handshake icon, gradient teal→purple glow
- **4 partner nodes**: hexagon-shaped (`clip-path: polygon(...)`) — NOT squares — placed at top, right, bottom, left of the hub
- **Connector lines**: SVG lines/curves with gradient stroke from center to each node, with subtle animated glow
- Each hex node contains: icon, title, and 2 short bullet points (compact, readable)
- Color per node: Corporate=teal, Investment=purple, Technology=cyan, Institutional=amber
- **University Partners bar** below: keep current full-width gradient bar (unchanged — it's not a square)

### Implementation in `src/pages/Brochure.tsx` (lines 919–1033)
- Replace `grid grid-cols-2 gap-3` block (lines 937–1003) with a `relative` positioned container using absolute positioning for the 4 hex nodes around a centered hub
- Use inline `style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}` for hexagons
- Add SVG layer for connector lines between hub and nodes
- Keep all 4 partner data (titles, icons, color codes, points) **verbatim**
- Keep University Partners section (1006–1030) unchanged

### Sizing for A4 page
- Container: `flex-1 relative min-h-[420px]`
- Hub: ~150×130px
- Each hex node: ~220×190px
- Text inside nodes: title `text-[13px] font-bold`, bullets `text-[10.5px] leading-snug`

### What stays
- Page header chip "Strategic Partner Mapping" + "Partnership Models" title + tagline
- All partner copy (titles + bullet points)
- University Partners full-width section
- Background, TechGrid, FloatingHexagons, EnergyLines, CornerAccents

