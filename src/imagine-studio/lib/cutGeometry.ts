// @ts-nocheck -- Imagine Studio v2
/**
 * THE CUTTING TOOL (founder directive 2026-10-26): when two surfaces
 * share a plane they z-fight and glitch — the fix is to CUT the lower
 * surface around the upper one's footprint, the way a pool cuts the
 * ground in Wonderlands. For axis-aligned (or quarter-turn) boxes and
 * flat planes this is exact rectangle subtraction: the target comes
 * back as up to four strips (W / E / N / S) around the cutter's
 * footprint, which the caller fuses back into ONE instance object —
 * the ground stays a single object, with a real hole in it.
 */

export interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }

/** World XZ footprint of a primitive (quarter-turn rotations are
 * exact; other Y rotations fall back to the rotated corners' AABB). */
export function footprintOf(obj: any): Rect | null {
  if (!obj || obj.kind !== "primitive") return null;
  const px = obj.position?.[0] ?? 0, pz = obj.position?.[2] ?? 0;
  let w = Math.abs(obj.scale?.[0] ?? 1), d = Math.abs(obj.scale?.[2] ?? 1);
  if (obj.shape === "plane") d = Math.abs(obj.scale?.[1] ?? 1);
  if (obj.shape === "cylinder" || obj.shape === "sphere" || obj.shape === "cone") { d = w; }
  const ry = obj.rotation?.[1] ?? 0;
  const quarter = Math.round(ry / (Math.PI / 2));
  const snapped = Math.abs(ry - quarter * (Math.PI / 2)) < 0.01;
  if (snapped) {
    if (Math.abs(quarter) % 2 === 1) { const t = w; w = d; d = t; }
  } else {
    const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry));
    const nw = w * c + d * s, nd = w * s + d * c;
    w = nw; d = nd;
  }
  return { minX: px - w / 2, maxX: px + w / 2, minZ: pz - d / 2, maxZ: pz + d / 2 };
}

const EPS = 0.001;

/** Cut `target` around `cutter`'s footprint. Returns the strip
 * objects (0–4, as plain box objects carrying the target's material),
 * or null when the footprints don't overlap / the target can't cut. */
export function cutTargetAround(target: any, cutter: any, makeId: () => string): any[] | null {
  if (!target || (target.shape !== "box" && target.shape !== "plane")) return null;
  const flat = target.shape === "plane" ? Math.abs(Math.abs(target.rotation?.[0] ?? 0) - Math.PI / 2) < 0.05 || (target.rotation?.[0] ?? 0) === 0 : true;
  if (!flat) return null;
  const T = footprintOf(target), C = footprintOf(cutter);
  if (!T || !C) return null;
  const I = {
    minX: Math.max(T.minX, C.minX), maxX: Math.min(T.maxX, C.maxX),
    minZ: Math.max(T.minZ, C.minZ), maxZ: Math.min(T.maxZ, C.maxZ),
  };
  if (I.maxX - I.minX < EPS || I.maxZ - I.minZ < EPS) return null; // no overlap
  const ty = target.position?.[1] ?? 0;
  const strip = (minX: number, maxX: number, minZ: number, maxZ: number) => ({
    ...target,
    id: makeId(),
    shape: "box",
    rotation: [0, 0, 0],
    position: [(minX + maxX) / 2, ty, (minZ + maxZ) / 2],
    scale: [maxX - minX, target.scale?.[1] ?? 0.1, maxZ - minZ],
    parts: undefined,
  });
  const out: any[] = [];
  if (I.minX > T.minX + EPS) out.push(strip(T.minX, I.minX, T.minZ, T.maxZ));
  if (I.maxX < T.maxX - EPS) out.push(strip(I.maxX, T.maxX, T.minZ, T.maxZ));
  if (I.minZ > T.minZ + EPS) out.push(strip(I.minX, I.maxX, T.minZ, I.minZ));
  if (I.maxZ < T.maxZ - EPS) out.push(strip(I.minX, I.maxX, I.maxZ, T.maxZ));
  return out; // empty = the cutter swallowed the target whole
}

/** Find COPLANAR-OVERLAP pairs in a scene — the z-fighting signature:
 * two horizontal surfaces within 2 mm of each other whose footprints
 * overlap. Returns [{ aId, bId, overlapArea }] biggest first. */
export function findCoplanarOverlaps(objects: any[]): { aId: string; bId: string; area: number }[] {
  const flat = objects.filter((o) => o && o.kind === "primitive" && (o.shape === "box" || o.shape === "plane"));
  const tops = flat.map((o) => {
    const r = footprintOf(o);
    if (!r) return null;
    const top = (o.position?.[1] ?? 0) + (o.shape === "plane" ? 0 : Math.abs(o.scale?.[1] ?? 0) / 2);
    return { o, r, top };
  }).filter(Boolean) as any[];
  const hits: { aId: string; bId: string; area: number }[] = [];
  for (let i = 0; i < tops.length; i++) for (let j = i + 1; j < tops.length; j++) {
    const A = tops[i], B = tops[j];
    if (Math.abs(A.top - B.top) > 0.002) continue;
    const ix = Math.min(A.r.maxX, B.r.maxX) - Math.max(A.r.minX, B.r.minX);
    const iz = Math.min(A.r.maxZ, B.r.maxZ) - Math.max(A.r.minZ, B.r.minZ);
    if (ix > EPS && iz > EPS) hits.push({ aId: A.o.id, bId: B.o.id, area: ix * iz });
  }
  return hits.sort((a, b) => b.area - a.area);
}
