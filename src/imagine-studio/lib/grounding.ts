// @ts-nocheck -- Imagine Studio v2
/**
 * ANIMATED GROUNDING (founder reports 2026-10-26: "feet underground").
 * Every character renderer used to ground its model by measuring the
 * STATIC pose once — but the idle/walk clips plant the feet a few cm
 * LOWER than that pose, so characters stood sunk into the floor. This
 * sampler watches the model's real skinned bounding box over its first
 * second of animation, remembers the LOWEST point the pose ever
 * reaches, and returns the one-time lift that puts that lowest point
 * exactly on y=0. Shared by every character surface (player, peers,
 * published characters, studio characters) so the fix holds on all
 * levels at once.
 */
import * as THREE from "three";

export function makeGroundSampler() {
  let t = 0;
  let minY = Infinity;
  let done = false;
  return (model: THREE.Object3D, dt: number): number | null => {
    if (done || !model) return null;
    t += dt;
    if (t < 0.15) return null; // let the clip actually start
    try {
      const b = new THREE.Box3().setFromObject(model);
      if (isFinite(b.min.y)) minY = Math.min(minY, b.min.y);
    } catch { /* keep sampling */ }
    if (t >= 1.15) {
      done = true;
      if (minY !== Infinity && minY < -0.002) return Math.min(0.2, -minY);
      return 0;
    }
    return null;
  };
}
