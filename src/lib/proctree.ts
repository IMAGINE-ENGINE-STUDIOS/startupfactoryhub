/* =========================================================================
   proctree.ts — compact procedural tree generator (MIT-style algorithm,
   inspired by proctree.js / Sketchfab's tree generator by Paul Brunt).
   Produces plain data (segments + twig points) so any renderer can consume it.
   ========================================================================= */

export type TreeSegment = {
  /** start point */
  a: [number, number, number];
  /** end point */
  b: [number, number, number];
  /** radius at start */
  r0: number;
  /** radius at end */
  r1: number;
  /** recursion level, 0 = trunk */
  level: number;
};

export type TreeData = {
  segments: TreeSegment[];
  /** leaf / twig anchor points, grouped by level */
  twigs: { p: [number, number, number]; level: number }[];
  /** root flares below ground */
  roots: TreeSegment[];
  maxLevel: number;
};

export type TreeOptions = {
  seed?: number;
  levels?: number;
  trunkLength?: number;
  trunkRadius?: number;
  /** how much each child shrinks */
  lengthFalloff?: number;
  radiusFalloff?: number;
  /** children per node */
  branches?: number;
  /** spread angle in radians */
  spread?: number;
  /** upward bias 0..1 */
  climb?: number;
  /** segments per branch (curvature) */
  segmentsPerBranch?: number;
};

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type V3 = [number, number, number];

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export function generateTree(opts: TreeOptions = {}): TreeData {
  const {
    seed = 7,
    levels = 5,
    trunkLength = 3.1,
    trunkRadius = 0.28,
    lengthFalloff = 0.74,
    radiusFalloff = 0.58,
    branches = 3,
    spread = 0.72,
    climb = 0.62,
    segmentsPerBranch = 5,
  } = opts;

  const rnd = mulberry32(seed);
  const segments: TreeSegment[] = [];
  const twigs: TreeData['twigs'] = [];
  const roots: TreeSegment[] = [];

  const grow = (origin: V3, dir: V3, length: number, radius: number, level: number) => {
    let p: V3 = origin;
    let d: V3 = dir;
    const steps = segmentsPerBranch;
    const stepLen = length / steps;

    for (let i = 0; i < steps; i++) {
      // gentle curvature: bend toward vertical, plus a touch of noise
      const bend: V3 = [
        (rnd() - 0.5) * 0.14,
        climb * 0.09,
        (rnd() - 0.5) * 0.14,
      ];
      d = norm(add(d, bend));
      const next = add(p, scale(d, stepLen));
      const t0 = i / steps;
      const t1 = (i + 1) / steps;
      segments.push({
        a: p,
        b: next,
        r0: radius * (1 - t0 * 0.45),
        r1: radius * (1 - t1 * 0.45),
        level,
      });
      p = next;
    }

    if (level >= levels - 1) {
      twigs.push({ p, level });
      // small cluster of leaf anchors around the tip
      for (let k = 0; k < 4; k++) {
        twigs.push({
          p: [
            p[0] + (rnd() - 0.5) * 0.5,
            p[1] + (rnd() - 0.5) * 0.42,
            p[2] + (rnd() - 0.5) * 0.5,
          ],
          level,
        });
      }
      return;
    }

    const kids = level === 0 ? branches + 1 : branches;
    const baseAngle = rnd() * Math.PI * 2;
    for (let i = 0; i < kids; i++) {
      const az = baseAngle + (i / kids) * Math.PI * 2 + (rnd() - 0.5) * 0.5;
      const s = spread * (0.7 + rnd() * 0.6);
      const childDir = norm([
        d[0] + Math.cos(az) * s,
        d[1] + climb * 0.5,
        d[2] + Math.sin(az) * s,
      ]);
      grow(
        p,
        childDir,
        length * lengthFalloff * (0.85 + rnd() * 0.3),
        radius * radiusFalloff,
        level + 1,
      );
    }
  };

  grow([0, 0, 0], [0, 1, 0], trunkLength, trunkRadius, 0);

  // surface roots
  const rootCount = 5;
  for (let i = 0; i < rootCount; i++) {
    const az = (i / rootCount) * Math.PI * 2 + 0.3;
    const dirX = Math.cos(az);
    const dirZ = Math.sin(az);
    let p: V3 = [0, 0.06, 0];
    let r = trunkRadius * 0.72;
    for (let s = 0; s < 3; s++) {
      const next: V3 = [
        p[0] + dirX * (0.42 + s * 0.16),
        Math.max(-0.05, p[1] - 0.06 - s * 0.02),
        p[2] + dirZ * (0.42 + s * 0.16),
      ];
      roots.push({ a: p, b: next, r0: r, r1: r * 0.6, level: 0 });
      p = next;
      r *= 0.6;
    }
  }

  return { segments, twigs, roots, maxLevel: levels - 1 };
}
