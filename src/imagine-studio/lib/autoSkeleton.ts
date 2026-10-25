// @ts-nocheck -- Imagine Studio v2
/**
 * Auto-skeleton (auto-rig) for unrigged humanoid meshes.
 *
 * Some models arrive as ONE merged mesh with no skeleton at all (no bones,
 * no skin weights), so the Rig Controller Room cannot pose them — every
 * controller, action pose and rig save keys off THREE.Bone objects. This
 * module builds a standard skeleton FOR such a mesh, in place:
 *
 *   1. analyzeHumanoid() reads the geometry's position attribute and
 *      estimates anatomical landmarks (hip / knee / ankle / shoulder /
 *      elbow / wrist / neck heights + left/right limb column offsets)
 *      from the bounding box and horizontal slice profiles.
 *   2. buildAutoSkeleton() creates a Mixamo-named THREE.Bone hierarchy
 *      (mixamorig:Hips, …) so the room's controller patterns — and
 *      actionPoses.ts — resolve all 17 controllers instantly, then
 *      converts the mesh(es) to SkinnedMesh with rigid-per-part weights
 *      blended across each joint line.
 *
 * Forward-axis assumption: the character faces +Z (the same convention
 * the rest of the studio uses for characters). Left side = +X when facing
 * +Z in a right-handed frame.
 *
 * Known limitation: proportions are ESTIMATES from the silhouette. When a
 * model's arms hang merged against the torso, the arm joints land at the
 * torso edge and the side mass moves approximately — the joints can be
 * refined afterwards with the room's move gizmo.
 */
import * as THREE from "three";
import { autoMapControllers, collectBones } from "./actionPoses";

export interface HumanoidLandmarks {
  /** Total height (geometry units) and the vertical range it spans. */
  height: number;
  minY: number;
  maxY: number;
  /** Central body axis in geometry space. */
  centerX: number;
  centerZ: number;
  /** Joint-line heights (geometry units). */
  hipY: number;
  ankleY: number;
  shoulderY: number;
  neckY: number;
  /** Head joint height (inside the head, above the neck line). */
  headY: number;
  headTopY: number;
  kneeY: { l: number; r: number };
  elbowY: { l: number; r: number };
  wristY: { l: number; r: number };
  /** Absolute geometry-space x of each joint column. */
  legX: { l: number; r: number };
  kneeX: { l: number; r: number };
  ankleX: { l: number; r: number };
  /** Arm (glenohumeral) joint x per side. */
  shoulderX: { l: number; r: number };
  elbowX: { l: number; r: number };
  wristX: { l: number; r: number };
  clavicleX: { l: number; r: number };
  /** True when the legs never separated into two clusters in any slice. */
  legsMerged: boolean;
  armsMerged: { l: boolean; r: boolean };
  /** Slice profile the skinning classifier reads torso widths from. */
  bandCount: number;
  bandHalfW: number[];
}

export interface AutoSkeletonResult {
  bones: THREE.Bone[];
  skeleton: THREE.Skeleton;
  mapping: Record<string, string | null>;
}

const NB = 80; // horizontal slice bands for the profile
const HB = 40; // x-histogram bins per band (leg/arm cluster detection)

/**
 * Estimate humanoid landmarks from a geometry's position attribute.
 * Returns null when the mesh is clearly not humanoid-proportioned:
 * the height must dominate the horizontal extents, and a hips band with
 * real mass must exist between the legs and the torso.
 */
export function analyzeHumanoid(geometry: THREE.BufferGeometry): HumanoidLandmarks | null {
  const pos = geometry?.getAttribute?.("position");
  if (!pos || pos.count < 100) return null;
  const count = pos.count;

  // ---- pass A: bounding box + per-band extents -------------------------
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  const xs = new Float32Array(count), ys = new Float32Array(count), zs = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    xs[i] = x; ys[i] = y; zs[i] = z;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  const H = maxY - minY, W = maxX - minX, D = maxZ - minZ;
  if (!(H > 0) || !(W > 0)) return null;
  // Guard: height must dominate — a standing figure, not a car / blob / disc.
  if (H < 1.25 * Math.max(W, D)) return null;
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

  const bandOf = (y: number) => Math.min(NB - 1, Math.max(0, Math.floor(((y - minY) / H) * NB)));
  const bandY = (b: number) => minY + ((b + 0.5) / NB) * H;
  const bandCount = new Float64Array(NB);
  const bandXMin = new Float64Array(NB).fill(Infinity), bandXMax = new Float64Array(NB).fill(-Infinity);
  const bandZMin = new Float64Array(NB).fill(Infinity), bandZMax = new Float64Array(NB).fill(-Infinity);
  for (let i = 0; i < count; i++) {
    const b = bandOf(ys[i]);
    bandCount[b]++;
    if (xs[i] < bandXMin[b]) bandXMin[b] = xs[i];
    if (xs[i] > bandXMax[b]) bandXMax[b] = xs[i];
    if (zs[i] < bandZMin[b]) bandZMin[b] = zs[i];
    if (zs[i] > bandZMax[b]) bandZMax[b] = zs[i];
  }
  const bandWidth = (b: number) => (bandCount[b] > 0 ? bandXMax[b] - bandXMin[b] : 0);
  const bandZExt = (b: number) => (bandCount[b] > 0 ? bandZMax[b] - bandZMin[b] : 0);

  // ---- pass B: x-histogram per band + arm-column (outer) stats ----------
  const bandHist: Float64Array[] = [];
  const outCount = { l: new Float64Array(NB), r: new Float64Array(NB) };
  const outXSum = { l: new Float64Array(NB), r: new Float64Array(NB) };
  const outMinX = { l: new Float64Array(NB).fill(Infinity), r: new Float64Array(NB).fill(Infinity) };
  const outMaxX = { l: new Float64Array(NB).fill(-Infinity), r: new Float64Array(NB).fill(-Infinity) };
  for (let b = 0; b < NB; b++) bandHist.push(new Float64Array(HB));
  const binW = W / HB;
  for (let i = 0; i < count; i++) {
    const b = bandOf(ys[i]);
    const bin = Math.min(HB - 1, Math.max(0, Math.floor(((xs[i] - minX) / W) * HB)));
    bandHist[b][bin]++;
    // "Outer" = beyond 60% of this band's half-width — where arms live when
    // they hang beside the torso instead of merging into its silhouette.
    const halfW = bandWidth(b) / 2;
    if (halfW > 0 && Math.abs(xs[i] - cx) > 0.6 * halfW) {
      const side = xs[i] >= cx ? "l" : "r";
      outCount[side][b]++;
      outXSum[side][b] += xs[i];
      if (xs[i] < outMinX[side][b]) outMinX[side][b] = xs[i];
      if (xs[i] > outMaxX[side][b]) outMaxX[side][b] = xs[i];
    }
  }

  /** Distinct x-clusters in a band: runs of occupied histogram bins. */
  const clustersOf = (b: number): { center: number; width: number; mass: number }[] => {
    if (!bandCount[b]) return [];
    const hist = bandHist[b];
    let maxBin = 0;
    for (let k = 0; k < HB; k++) if (hist[k] > maxBin) maxBin = hist[k];
    const thresh = Math.max(1, maxBin * 0.18);
    const runs: { start: number; end: number; mass: number; wx: number }[] = [];
    let cur: (typeof runs)[number] | null = null;
    for (let k = 0; k < HB; k++) {
      if (hist[k] >= thresh) {
        if (!cur) cur = { start: k, end: k, mass: 0, wx: 0 };
        cur.end = k;
        cur.mass += hist[k];
        cur.wx += hist[k] * (minX + (k + 0.5) * binW);
      } else if (cur && k - cur.end > 2) {
        runs.push(cur);
        cur = null;
      }
    }
    if (cur) runs.push(cur);
    return runs
      .filter((r) => r.mass >= bandCount[b] * 0.05)
      .map((r) => ({ center: r.wx / r.mass, width: (r.end - r.start + 1) * binW, mass: r.mass }));
  };
  const twoClusters = (b: number) => clustersOf(b).length >= 2;
  /**
   * A true LEG slice: mass on both sides of the axis and NO cluster near the
   * center — above the crotch the pelvis/torso fills the middle, and arm
   * slices beside a torso also carry a central cluster, so neither of those
   * counts as legs even when the raw cluster count is ≥ 2.
   */
  const legPair = (b: number) => {
    const cs = clustersOf(b);
    if (cs.length < 2) return false;
    if (cs.some((c) => Math.abs(c.center - cx) <= 0.14 * W)) return false;
    return cs.some((c) => c.center < cx) && cs.some((c) => c.center > cx);
  };
  const clusterOnSide = (b: number, side: "l" | "r") => {
    const cs = clustersOf(b);
    if (!cs.length) return null;
    if (cs.length === 1) return cs[0];
    return side === "l"
      ? cs.reduce((a, c) => (c.center > a.center ? c : a))
      : cs.reduce((a, c) => (c.center < a.center ? c : a));
  };

  // ---- hips: where the two leg clusters merge into one mass -------------
  // Iterate POPULATED bands only: on sparse / low-poly shells many bands are
  // empty, and an empty band is "unknown", not "merged".
  const populated: number[] = [];
  for (let b = 0; b < NB; b++) if (bandCount[b] > 0) populated.push(b);
  let hipBand = -1;
  let legBands = 0;
  for (let i = 0; i < populated.length; i++) {
    const b = populated[i];
    if (legPair(b)) { legBands++; continue; }
    if (legBands >= 4) {
      let merged = true;
      for (let j = i + 1; j < Math.min(populated.length, i + 3); j++) {
        if (legPair(populated[j])) { merged = false; break; }
      }
      if (merged) { hipBand = b; break; }
    }
  }
  const legsMerged = hipBand < 0;
  let hipY = legsMerged ? minY + 0.52 * H : bandY(hipBand) + 0.03 * H;
  hipY = Math.min(Math.max(hipY, minY + 0.34 * H), minY + 0.64 * H);
  // Guard: the hips band must actually exist (pelvis mass around the line).
  let hipMass = 0;
  for (let i = 0; i < count; i++) if (Math.abs(ys[i] - hipY) <= 0.05 * H) hipMass++;
  if (hipMass < count * 0.004) return null;

  // ---- ankle: where the foot flare (long z) settles back to leg width ---
  const legZBands: number[] = [];
  for (let b = 0; b < NB; b++) {
    const y = bandY(b);
    if (y >= minY + 0.18 * H && y <= minY + 0.42 * H && bandCount[b] > 0) legZBands.push(bandZExt(b));
  }
  legZBands.sort((a, b2) => a - b2);
  const legZ = legZBands.length ? legZBands[Math.floor(legZBands.length / 2)] : D;
  let ankleY = minY + 0.07 * H;
  {
    let clearRun = 0;
    for (let b = 0; b < NB && bandY(b) < minY + 0.24 * H; b++) {
      if (bandCount[b] > 0 && bandZExt(b) <= Math.max(1.35 * legZ, legZ + 0.02 * H)) {
        clearRun++;
        if (clearRun >= 2 && b >= 2) { ankleY = bandY(b); break; }
      } else clearRun = 0;
    }
    ankleY = Math.min(Math.max(ankleY, minY + 0.04 * H), minY + 0.2 * H);
  }
  const legSpan = Math.max(hipY - ankleY, 0.1 * H);

  // ---- knees: narrowest slice in the middle of each leg -----------------
  const kneeFor = (side: "l" | "r") => {
    const lo = ankleY + 0.16 * legSpan, hi = hipY - 0.16 * legSpan;
    const mid = ankleY + 0.5 * legSpan;
    const cands: { w: number; y: number; center: number }[] = [];
    for (let b = 0; b < NB; b++) {
      const y = bandY(b);
      if (y < lo || y > hi) continue;
      const c = clusterOnSide(b, side);
      if (!c) continue;
      const w = clustersOf(b).length >= 2 ? c.width : c.width / 2;
      cands.push({ w, y, center: c.center });
    }
    if (!cands.length) return { y: mid, x: cx + (side === "l" ? 1 : -1) * 0.12 * W };
    // Narrowest slice wins; among near-ties (uniform legs) prefer mid-leg.
    const wMin = Math.min(...cands.map((c) => c.w));
    const best = cands
      .filter((c) => c.w <= wMin * 1.15)
      .reduce((a, c) => (Math.abs(c.y - mid) < Math.abs(a.y - mid) ? c : a));
    return { y: best.y, x: best.center };
  };
  const kneeL = kneeFor("l"), kneeR = kneeFor("r");
  const legXFor = (side: "l" | "r", fallbackX: number) => {
    // The band right under the hip line is usually pelvis mass (one central
    // cluster) — scan down for the first true leg-pair slice and take that
    // side's cluster center, so the hip joints land over the legs, not the
    // body axis.
    for (let b = bandOf(hipY - 0.05 * legSpan); b >= bandOf(ankleY + 0.3 * legSpan); b--) {
      if (!legPair(b)) continue;
      const c = clusterOnSide(b, side);
      if (c && Math.abs(c.center - cx) > 0.03 * W) return c.center;
    }
    return fallbackX;
  };
  const ankleXFor = (side: "l" | "r", fallbackX: number) => {
    const b = bandOf(ankleY + 0.02 * H);
    const c = clusterOnSide(b, side);
    return c ? c.center : fallbackX;
  };

  // ---- shoulders / neck / head -------------------------------------------
  let shoulderBand = 0, shoulderW = -1;
  for (let b = 0; b < NB; b++) {
    const y = bandY(b);
    if (y < maxY - 0.4 * H || y > maxY - 0.08 * H) continue;
    if (bandWidth(b) > shoulderW) shoulderW = bandWidth(b);
  }
  // The shoulder line is the TOP of the wide plateau (arms + torso span the
  // same width for a stretch below it) — take the highest near-max band.
  for (let b = NB - 1; b >= 0; b--) {
    const y = bandY(b);
    if (y < maxY - 0.4 * H || y > maxY - 0.08 * H) continue;
    if (bandWidth(b) >= 0.97 * shoulderW) { shoulderBand = b; break; }
  }
  const shoulderY = bandY(shoulderBand);
  let neckY = Math.min(shoulderY + 0.055 * H, maxY - 0.05 * H);
  {
    let neckBand = -1, neckW = Infinity;
    for (let b = 0; b < NB; b++) {
      const y = bandY(b);
      if (y <= shoulderY + 0.02 * H || y >= maxY - 0.03 * H || !bandCount[b]) continue;
      if (bandWidth(b) < neckW) { neckW = bandWidth(b); neckBand = b; }
    }
    if (neckBand >= 0 && neckW <= 0.82 * shoulderW) neckY = bandY(neckBand);
  }
  const headY = neckY + 0.35 * (maxY - neckY);
  // Guard: something must live above the shoulders (a head).
  let headMass = 0;
  for (let i = 0; i < count; i++) if (ys[i] > shoulderY) headMass++;
  if (headMass < count * 0.003) return null;

  // ---- arms: outer-column mass beside the torso ---------------------------
  const armFor = (side: "l" | "r") => {
    const sign = side === "l" ? 1 : -1;
    const counts = outCount[side];
    // Wrist = lowest band (down from the shoulder) still carrying arm mass.
    // Tolerate short empty gaps (sparse / low-poly shells) before giving up.
    let wristBand = -1;
    // Never scan far below the hip line: past it, leg side-walls register as
    // "outer" mass and the wrist would dive into the legs.
    const lowestB = bandOf(hipY - 0.06 * H);
    const gapTol = Math.max(3, Math.round(0.06 * NB));
    for (let b = shoulderBand; b >= lowestB; b--) {
      if (counts[b] >= Math.max(3, 0.012 * bandCount[b])) wristBand = b;
      else if (wristBand >= 0 && b < wristBand - gapTol) break;
    }
    const merged = wristBand < 0;
    const wristY = merged ? hipY - 0.02 * H : bandY(wristBand);
    // Elbow = narrowest outer slice in the middle of the arm span; among
    // near-ties (uniform arms) prefer the middle of the span.
    const span = Math.max(shoulderY - wristY, 0.05 * H);
    let elbowY = shoulderY - 0.5 * span;
    {
      const mid = shoulderY - 0.5 * span;
      const widths: { w: number; y: number }[] = [];
      for (let b = 0; b < NB; b++) {
        const y = bandY(b);
        if (y < wristY + 0.18 * span || y > shoulderY - 0.18 * span) continue;
        if (counts[b] < 3) continue;
        widths.push({ w: outMaxX[side][b] - outMinX[side][b], y });
      }
      if (widths.length) {
        const wMin = Math.min(...widths.map((s) => s.w));
        elbowY = widths
          .filter((s) => s.w <= wMin * 1.15)
          .reduce((a, s) => (Math.abs(s.y - mid) < Math.abs(a.y - mid) ? s : a)).y;
      }
    }
    const centroidAt = (y: number, fallback: number) => {
      const b = bandOf(y);
      return counts[b] >= 3 ? outXSum[side][b] / counts[b] : fallback;
    };
    const shoulderX = centroidAt(shoulderY, cx + sign * 0.78 * (shoulderW / 2));
    const elbowX = centroidAt(elbowY, shoulderX);
    const wristX = merged ? shoulderX : centroidAt(wristY, elbowX);
    return {
      merged,
      wristY,
      elbowY,
      shoulderX,
      elbowX,
      wristX,
      clavicleX: cx + (shoulderX - cx) * 0.38,
    };
  };
  const armL = armFor("l"), armR = armFor("r");

  const bandHalfW: number[] = [];
  for (let b = 0; b < NB; b++) bandHalfW.push(bandWidth(b) / 2);

  return {
    height: H,
    minY, maxY,
    centerX: cx, centerZ: cz,
    hipY, ankleY, shoulderY, neckY, headY, headTopY: maxY,
    kneeY: { l: kneeL.y, r: kneeR.y },
    elbowY: { l: armL.elbowY, r: armR.elbowY },
    wristY: { l: armL.wristY, r: armR.wristY },
    legX: { l: legXFor("l", kneeL.x), r: legXFor("r", kneeR.x) },
    kneeX: { l: kneeL.x, r: kneeR.x },
    ankleX: { l: ankleXFor("l", kneeL.x), r: ankleXFor("r", kneeR.x) },
    shoulderX: { l: armL.shoulderX, r: armR.shoulderX },
    elbowX: { l: armL.elbowX, r: armR.elbowX },
    wristX: { l: armL.wristX, r: armR.wristX },
    clavicleX: { l: armL.clavicleX, r: armR.clavicleX },
    legsMerged,
    armsMerged: { l: armL.merged, r: armR.merged },
    bandCount: NB,
    bandHalfW,
  };
}

/**
 * Build a Mixamo-named skeleton for an unrigged model, in place.
 *
 * `modelObject` is the model root whose meshes get skinned (bones are added
 * under it); `root` is what the controller mapping is computed against —
 * in the Rig Room both are the same cloned scene. Returns null when the
 * model already has bones, has no meshes, or isn't humanoid-proportioned.
 */
export function buildAutoSkeleton(root: THREE.Object3D, modelObject: THREE.Object3D): AutoSkeletonResult | null {
  if (!root || !modelObject) return null;
  // Already rigged — never touch a native skeleton.
  if (collectBones(modelObject).length > 0) return null;

  const meshes: THREE.Mesh[] = [];
  modelObject.traverse((o: any) => { if (o.isMesh && !o.isSkinnedMesh) meshes.push(o as THREE.Mesh); });
  if (!meshes.length) return null;
  // Landmarks come from the largest mesh; every other mesh's vertices are
  // classified in that reference space, so multi-part models still work.
  const ref = meshes.reduce((a, b) =>
    (b.geometry?.getAttribute("position")?.count ?? 0) > (a.geometry?.getAttribute("position")?.count ?? 0) ? b : a,
  );
  const lm = analyzeHumanoid(ref.geometry);
  if (!lm) return null;

  modelObject.updateWorldMatrix(true, true);
  const refInv = new THREE.Matrix4().copy(ref.matrixWorld).invert();
  const toWorld = (x: number, y: number, z: number) =>
    new THREE.Vector3(x, y, z).applyMatrix4(ref.matrixWorld);

  // ---- bone hierarchy (Mixamo names → every existing pattern resolves) ---
  const bones: THREE.Bone[] = [];
  const byName = new Map<string, THREE.Bone>();
  const mkBone = (name: string, parent: THREE.Object3D, worldPos: THREE.Vector3): THREE.Bone => {
    const bone = new THREE.Bone();
    bone.name = name;
    parent.add(bone);
    parent.updateWorldMatrix(true, false);
    bone.position.copy(parent.worldToLocal(worldPos.clone()));
    bone.updateMatrixWorld(true);
    bones.push(bone);
    byName.set(name, bone);
    return bone;
  };

  const cx = lm.centerX, cz = lm.centerZ;
  const torsoSpan = lm.neckY - lm.hipY;
  const hips = mkBone("mixamorig:Hips", modelObject, toWorld(cx, lm.hipY, cz));
  const spine = mkBone("mixamorig:Spine", hips, toWorld(cx, lm.hipY + torsoSpan / 3, cz));
  const spine1 = mkBone("mixamorig:Spine1", spine, toWorld(cx, lm.hipY + (2 * torsoSpan) / 3, cz));
  const spine2 = mkBone("mixamorig:Spine2", spine1, toWorld(cx, lm.hipY + torsoSpan * 0.86, cz));
  const neck = mkBone("mixamorig:Neck", spine2, toWorld(cx, lm.neckY, cz));
  mkBone("mixamorig:Head", neck, toWorld(cx, lm.headY, cz));
  for (const side of ["l", "r"] as const) {
    const S = side === "l" ? "Left" : "Right";
    const shoulder = mkBone(`mixamorig:${S}Shoulder`, spine2, toWorld(lm.clavicleX[side], lm.shoulderY, cz));
    const arm = mkBone(`mixamorig:${S}Arm`, shoulder, toWorld(lm.shoulderX[side], lm.shoulderY, cz));
    const fore = mkBone(`mixamorig:${S}ForeArm`, arm, toWorld(lm.elbowX[side], lm.elbowY[side], cz));
    mkBone(`mixamorig:${S}Hand`, fore, toWorld(lm.wristX[side], lm.wristY[side], cz));
    const upLeg = mkBone(`mixamorig:${S}UpLeg`, hips, toWorld(lm.legX[side], lm.hipY, cz));
    const leg = mkBone(`mixamorig:${S}Leg`, upLeg, toWorld(lm.kneeX[side], lm.kneeY[side], cz));
    mkBone(`mixamorig:${S}Foot`, leg, toWorld(lm.ankleX[side], lm.ankleY, cz));
  }
  modelObject.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  const idx = new Map<string, number>();
  bones.forEach((b, i) => idx.set(b.name, i));
  const B = (short: string) => idx.get(`mixamorig:${short}`)!;

  // ---- skinning: rigid per part, 2-bone blend across each joint line -----
  const H = lm.height;
  const win = 0.03 * H; // ±3% of height blend window around a joint line
  const sstep = (t: number) => {
    t = Math.min(1, Math.max(0, t));
    return t * t * (3 - 2 * t);
  };
  const torsoHalfAt = (y: number) => {
    const b = Math.min(lm.bandCount - 1, Math.max(0, Math.floor(((y - lm.minY) / H) * lm.bandCount)));
    return (lm.bandHalfW[b] || 0) * 0.72;
  };
  /**
   * Region weights along a vertical chain. `boundaries` are ascending joint
   * lines; `owners[i]` owns the region below boundaries[i] and owners[last]
   * owns everything above the last line. Inside a blend window only the two
   * neighbouring owners mix, so weights stay continuous everywhere.
   */
  const regionWeights = (y: number, boundaries: number[], owners: number[]): [number, number, number, number] => {
    let bi = -1, bd = Infinity;
    for (let i = 0; i < boundaries.length; i++) {
      const d = Math.abs(y - boundaries[i]);
      if (d < bd) { bd = d; bi = i; }
    }
    if (bi >= 0 && bd <= win) {
      const t = sstep((y - (boundaries[bi] - win)) / (2 * win));
      return [owners[bi], 1 - t, owners[bi + 1], t];
    }
    let r = 0;
    while (r < boundaries.length && y >= boundaries[r]) r++;
    return [owners[r], 1, owners[r], 0];
  };

  const t1 = lm.hipY + torsoSpan / 3, t2 = lm.hipY + (2 * torsoSpan) / 3;
  const headLine = lm.neckY + 0.45 * (lm.maxY - lm.neckY);
  // Half the distance between the two leg columns: inside it, mass below
  // the hip line is pelvis (Hips), not leg.
  const pelvisHalf = 0.45 * Math.max(Math.abs(lm.legX.l - cx), Math.abs(lm.legX.r - cx), 0.05 * H);

  const classify = (x: number, y: number): [number, number, number, number] => {
    const dx = x - cx;
    const side = dx >= 0 ? "l" : "r";
    const S = side === "l" ? "Left" : "Right";
    const outer = Math.abs(dx) > torsoHalfAt(y);
    // Arm column: beside the torso, from just above the shoulder line down
    // to just below the wrist.
    if (outer && y <= lm.shoulderY + win && y >= lm.wristY[side] - 0.06 * H) {
      return regionWeights(y, [lm.wristY[side], lm.elbowY[side], lm.shoulderY], [
        B(`${S}Hand`), B(`${S}ForeArm`), B(`${S}Arm`), B("Spine2"),
      ]);
    }
    // Leg column: below the hip line, outside the pelvis core.
    if (y < lm.hipY + win && Math.abs(dx) > pelvisHalf) {
      return regionWeights(y, [lm.ankleY, lm.kneeY[side], lm.hipY], [
        B(`${S}Foot`), B(`${S}Leg`), B(`${S}UpLeg`), B("Hips"),
      ]);
    }
    // Central column: pelvis → spine chain → neck → head.
    return regionWeights(y, [lm.hipY, t1, t2, lm.neckY, headLine], [
      B("Hips"), B("Spine"), B("Spine1"), B("Spine2"), B("Neck"), B("Head"),
    ]);
  };

  const v = new THREE.Vector3();
  for (const mesh of meshes) {
    const geo = mesh.geometry.clone();
    const posAttr = geo.getAttribute("position");
    const n = posAttr.count;
    const skinIndex = new Uint16Array(n * 4);
    const skinWeight = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(posAttr as any, i).applyMatrix4(mesh.matrixWorld).applyMatrix4(refInv);
      const [i1, w1, i2, w2] = classify(v.x, v.y);
      skinIndex[i * 4] = i1;
      skinIndex[i * 4 + 1] = i2;
      skinWeight[i * 4] = w1;
      skinWeight[i * 4 + 1] = w2;
    }
    geo.setAttribute("skinIndex", new THREE.BufferAttribute(skinIndex, 4));
    geo.setAttribute("skinWeight", new THREE.BufferAttribute(skinWeight, 4));

    const skinned = new THREE.SkinnedMesh(geo, mesh.material);
    skinned.name = mesh.name;
    skinned.position.copy(mesh.position);
    skinned.quaternion.copy(mesh.quaternion);
    skinned.scale.copy(mesh.scale);
    skinned.castShadow = (mesh as any).castShadow;
    skinned.receiveShadow = (mesh as any).receiveShadow;
    skinned.frustumCulled = false;
    const parent = mesh.parent;
    if (parent) {
      const at = parent.children.indexOf(mesh);
      parent.remove(mesh);
      parent.add(skinned);
      // Restore the original sibling order so layered materials sort as before.
      parent.children.splice(parent.children.indexOf(skinned), 1);
      parent.children.splice(Math.max(0, at), 0, skinned);
    }
    skinned.updateWorldMatrix(true, false);
    skinned.bind(skeleton);
  }
  modelObject.updateMatrixWorld(true);

  const mapping = autoMapControllers(root) as Record<string, string | null>;
  return { bones, skeleton, mapping };
}
