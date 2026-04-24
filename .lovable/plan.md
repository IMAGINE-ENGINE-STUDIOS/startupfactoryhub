

## Goal

Make AR drops look real: render them at **true world size** (size shrinks naturally with distance), let users place objects in **3D** with **altitude, pitch (tilt) and yaw (rotation)**, and keep everything **coordinate‑locked** to GPS + compass + LiDAR wireframe so registration stays accurate.

## What changes for the user

1. **True‑size rendering**
   - Each drop has a real‑world size in meters (default 1.5 m, configurable).
   - On screen it's projected as `pixels = (sizeMeters / distanceMeters) * focalPx` — a 2 m painting at 4 m looks the same as at 40 m, just smaller. No more arbitrary "scale with proximity" math.
   - Vertical offset uses real altitude difference + camera pitch (so a drop at +3 m altitude appears above the horizon, not pinned to it).

2. **3D placement controls** in the simplified Drop dialog
   - Single new "Position" section with three sliders + a live mini‑preview:
     - **Altitude** (−5 m to +20 m, step 0.1)
     - **Yaw** (0–360°) — which way the image/video/3D faces
     - **Pitch** (−45° to +45°) — tilt up/down
     - **Size** (0.2 m – 10 m)
   - Defaults: altitude = eye level (1.6 m), yaw = facing the user, pitch = 0°, size = 1.5 m.
   - Glass design preserved, no extra clutter — sliders collapse under a "Position & size" disclosure that's open by default.

3. **In‑AR adjustment**
   - When the owner long‑presses their own drop, instead of just dragging in 2D they get a small floating control: ↑ ↓ raise/lower altitude, ⟲ ⟳ rotate yaw, ⌃ ⌄ tilt pitch. Release pins to new values.
   - Non‑owners still can't move pinned drops.

4. **LiDAR registration stays the live truth**
   - The wireframe horizon defines pitch=0, the compass defines yaw=0, GPS defines lat/lon. All projection math uses these as the single source of truth so the drop "sticks" to its coordinates as the phone rotates/moves.

## Technical changes

### DB
- New migration: add columns to `public.ar_drops`
  - `altitude_m double precision not null default 1.6` (replaces unused `altitude`; keep both, set default)
  - `yaw_deg double precision not null default 0`
  - `pitch_deg double precision not null default 0`
  - `size_m double precision not null default 1.5`
- Update `useARDrops.ts` `ARDrop` interface + `createDrop`/`moveDrop` to round‑trip these fields. Add `updateDropTransform(id, {altitude_m, yaw_deg, pitch_deg, size_m})`.

### `DropDialog.tsx`
- Add collapsible "Position & size" panel with 4 `Slider`s (altitude, yaw, pitch, size) + numeric readouts.
- Pass the values into `onCreate`. Keep the simple upload + title + description flow above it.

### `ARCameraView.tsx` — true projection
- Replace `project(bearing, dist)` with a proper pinhole projection:
  ```ts
  const focalPx = (window.innerWidth / 2) / Math.tan((FOV_H/2)*π/180);
  // horizontal angle offset from heading
  const dx = focalPx * Math.tan(relYawRad);
  // vertical offset = altitude diff + device pitch
  const dy = focalPx * Math.tan(relPitchRad);
  const screenPxPerMeter = focalPx / dist;       // <-- true-size scaling
  const widthPx  = drop.size_m * screenPxPerMeter;
  const heightPx = drop.size_m * screenPxPerMeter;
  ```
- Read **device pitch** (`beta` from `deviceorientation`) so vertical placement reacts to tilting the phone up/down.
- Apply per‑drop `transform: rotateY(<yawFacing>) rotateX(<pitch>)` so images/videos/3D models sit at the chosen angle (a billboarded wall, a ceiling tile, etc.).
- Replace the 60 px peer orb constant with a real‑size sphere (~0.4 m diameter) using the same projection.
- Remove the arbitrary `Math.max(0.4, Math.min(1.6, 80/dist))` scale clamp and the `y = 50 + clamp(...)` heuristic.

### In‑AR transform handles
- While `grabbedId` is set, render a small bottom‑sheet HUD with 6 buttons (alt up/down, yaw ±, pitch ±). Each tap mutates a local `heldTransform` ref and the periodic `setInterval` writes `altitude_m / yaw_deg / pitch_deg` along with lat/lon via the new `updateDropTransform`.

### `DropDetailDialog.tsx`
- Show a compact "alt 2.4 m · yaw 90° · pitch 0° · size 1.5 m" line under the coordinates.
- Owner gets inline edit (same 4 sliders) that calls `updateDropTransform`.

### Files touched
- `supabase/migrations/<ts>_ar_drops_3d_transform.sql` (new)
- `src/hooks/useARDrops.ts`
- `src/components/ar-world/DropDialog.tsx`
- `src/components/ar-world/DropDetailDialog.tsx`
- `src/components/ar-world/ARCameraView.tsx`

No changes to LidarWireframe, Galaxy.tsx layout, voice, or presence.

## Out of scope (unless you ask)
- True SLAM / WebXR depth sensing (browsers don't expose iOS LiDAR; we use GPS + compass + device pitch which is the realistic ceiling on the web).
- Occlusion behind real objects.

