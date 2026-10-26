// @ts-nocheck -- Imagine Studio v2
/**
 * ANIMATED GROUNDING (founder reports 2026-10-26: "feet underground",
 * recurring — Floor 100 especially). Every character renderer used to
 * ground its model by measuring the STATIC pose once — but the idle
 * and walk clips plant the feet LOWER than that pose, so characters
 * stood sunk into the floor.
 *
 * The first sampler watched only the first 2.2 seconds and capped the
 * lift at 0.30: any clip that started later (the walk cycle when the
 * character actually moves — exactly what the founder watches on
 * Floor 100) or that dips deeper was never corrected. This tracker is
 * CONTINUOUS: it re-measures the model's real skinned bounding box
 * every ~0.1s for as long as the character lives, remembers the
 * deepest deficit ever seen, and returns INCREMENTAL lifts (callers
 * add each return to the model's y — the original one-shot contract).
 * Total lift is capped at 0.60 so a bad measurement can never launch
 * a character, only un-bury it. Shared by every character surface
 * (player, peers, published characters, studio characters).
 */
import * as THREE from "three";

export function makeGroundSampler() {
  let acc = 0;
  let issued = 0;
  return (model: THREE.Object3D, dt: number): number | null => {
    if (!model) return null;
    acc += dt;
    if (acc < 0.1) return null; // ~10 measurements a second is plenty
    acc = 0;
    try {
      const b = new THREE.Box3().setFromObject(model);
      if (!isFinite(b.min.y)) return null;
      const deficit = -b.min.y; // how far the lowest point sits below y=0 right now
      if (deficit <= 0.002) return null;
      const totalNeeded = Math.min(0.6, issued + deficit);
      if (totalNeeded <= issued + 0.002) return null;
      const inc = totalNeeded - issued;
      issued = totalNeeded;
      return inc;
    } catch { /* keep tracking */ }
    return null;
  };
}
