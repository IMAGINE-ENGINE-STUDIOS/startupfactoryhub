

# Hot Deals Portal: Layout Swap + Speakers Section

## Changes

### 1. Swap Agenda and Startup Voting positions
Currently: Startup cards (full width) → Agenda (left column) + Widgets (right column)

New layout:
- **Agenda** moves to where the startup voting cards are (full width, compact)
- **Startup voting cards** move down to the left column of the two-column grid (more space)
- Right column stays: 3D models + Arcade

### 2. Add Speakers Section
Add a new section displaying the two confirmed speakers, fetched from the `profiles` table by their known IDs:
- **Robert S. Katz** — `id: 8bf0a780-fc90-4e93-9b97-62b9accf5d14`, avatar available, email: rsk@win.ngo
- **Meredith Reeves** — `id: 726968e7-19d2-48da-8254-ab31ae336c16`, no avatar, email: meredith.reeves@nasa.gov

Place speakers section between the event banner and the Whereby room. Display avatar (or fallback initial), name, and email in orange-themed cards.

### 3. Ensure all shades are orange
Audit for any non-orange accent colors (red pulse dot, etc.) and convert to orange.

## File Changes

### `src/pages/HotDealsPortal.tsx`
- Add speakers section (hardcoded speaker IDs, fetch from profiles)
- Reorder: Banner → Speakers → Winner → Whereby → Agenda (full width, compact) → Two-column grid (Voting left | Widgets right)
- Change `bg-red-500` pulse dot to `bg-orange-500`

### `src/components/HotDealsVoting.tsx`
- No changes needed (already self-contained)

### `src/components/HotDealsAgenda.tsx`
- No changes needed (already self-contained)

