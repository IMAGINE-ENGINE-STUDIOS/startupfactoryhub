

# Redesign DJ Console + Add Space Tetris Game

## Part 1: Realistic DJ Console Redesign

**Goal:** Transform the current flat DJ console into a realistic, solid CDJ/turntable unit with proper vinyl disc styling, brushed metal textures, and physical depth.

### Visual Changes to `HotDealsDJConsole.tsx`

**Vinyl Discs (replacing current platters):**
- Realistic vinyl record: black base with concentric groove rings using subtle radial gradients and thin ring borders
- Vinyl label center with track name text, styled like a real record label (circular gradient, bold branding)
- Reflective light streak across the vinyl (a thin diagonal white-to-transparent gradient overlay that rotates with the disc)
- Proper spindle hole in the center (small dark circle)
- Tonearm redesigned as a proper angled arm with a pivot point and cartridge head

**Console Body:**
- Brushed metal texture effect using repeating linear gradients (fine horizontal lines over dark gray)
- Raised/beveled panel sections with `box-shadow` insets to create physical depth
- Rounded metal knobs for volume (circular divs with radial gradients and shadow) instead of flat slider
- LED-style segmented displays for BPM (green-on-black LCD look using monospace font with text-shadow glow)
- Jog wheel ring around each vinyl (thick metallic border with highlight gradient)

**Effects Strip:**
- Redesigned as physical toggle switches with on/off LED indicators (small colored dots)
- Metallic button styling with pressed/unpressed states using box-shadow shifts

**VU Meter:**
- Taller, segmented LED bars (green at bottom, yellow middle, red top) with individual segment gaps

### No changes to audio logic or broadcast hook — only visual/CSS updates.

## Part 2: Space Tetris Game

**New file:** `src/components/SpaceTetrisGame.tsx`

Canvas-based Tetris game (340x400 canvas, matching other games) with space theme:

- **Grid:** 10 columns x 20 rows
- **Pieces:** Standard 7 tetrominoes (I, O, T, S, Z, J, L) colored in space-themed palette (cyan, orange, red, green, purple, yellow, blue)
- **Controls:** Arrow keys (left/right move, up rotate, down soft drop, space hard drop) + touch controls via `useGameTouchControls` hook (4dir mode)
- **Rendering:** Dark space background with faint star dots, neon-glow piece outlines, grid lines in subtle dark gray
- **Scoring:** 100 per line, 300 for double, 500 for triple, 800 for tetris
- **Speed:** Increases every 10 lines cleared
- **States:** menu, playing, over — same overlay pattern as other games
- **High score:** persisted in localStorage as `artemis-tetris-hs`

**Modified file:** `src/components/SpaceArcade.tsx`
- Import `SpaceTetrisGame`
- Add to GAMES array with id `"tetris"`, name `"TETRIS"`, icon `LayoutGrid` from lucide-react

## Files Summary

| File | Action |
|------|--------|
| `src/components/HotDealsDJConsole.tsx` | Redesign — realistic vinyl discs, brushed metal body, LED displays, physical knobs |
| `src/components/SpaceTetrisGame.tsx` | New — space-themed Tetris game |
| `src/components/SpaceArcade.tsx` | Add Tetris to game tabs |

