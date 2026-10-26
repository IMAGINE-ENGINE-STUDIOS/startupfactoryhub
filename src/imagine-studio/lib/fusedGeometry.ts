// @ts-nocheck -- Imagine Studio v2
/**
 * Fused single-instance geometry (founder directives 2026-10-26): window
 * frames and desk stations used to be dozens of separate scene objects.
 * They are now ONE object each whose parts are merged into a single
 * BufferGeometry — with per-part materials preserved (merged with groups),
 * so a station keeps its dark desk, glowing screen and chair tones while
 * selecting, moving and rendering as a single instance. Shared by the
 * Studio editor renderer (LevelScene3D) and the live world renderer
 * (PublishedWorld) so both draw the exact same fused shapes.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function unitGeometry(shape: string): THREE.BufferGeometry {
  switch (shape) {
    case "sphere": return new THREE.SphereGeometry(0.5, 32, 24);
    case "cylinder": return new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    case "cone": return new THREE.ConeGeometry(0.5, 1, 32);
    case "plane": return new THREE.PlaneGeometry(1, 1);
    case "torus": return new THREE.TorusGeometry(0.5, 0.15, 16, 64);
    default: return new THREE.BoxGeometry(1, 1, 1);
  }
}

/** The fused window frame: sill + header + every mullion in unit space
 * (the mesh scale [length, height, thickness] restores meters).
 * Proportions mirror the office walls: 0.15 sill, 0.45 header, 8 total
 * height, a mullion every ~3 m. */
export function buildFrameGridGeometry(lenMeters: number): THREE.BufferGeometry {
  const len = Math.max(1, lenMeters || 1);
  const sillF = 0.15 / 8, headF = 0.45 / 8, glassF = 1 - sillF - headF;
  const parts: THREE.BufferGeometry[] = [];
  const sill = new THREE.BoxGeometry(1, sillF, 1); sill.translate(0, -0.5 + sillF / 2, 0); parts.push(sill);
  const head = new THREE.BoxGeometry(1, headF, 1); head.translate(0, 0.5 - headF / 2, 0); parts.push(head);
  const nM = Math.max(1, Math.floor(len / 3));
  const mullW = 0.12 / len;
  for (let i = 0; i <= nM; i++) {
    const m = new THREE.BoxGeometry(mullW, glassF, 0.7);
    m.translate(-0.5 + i / nM, -0.5 + sillF + glassF / 2, 0);
    parts.push(m);
  }
  return mergeGeometries(parts, false) ?? new THREE.BoxGeometry(1, 1, 1);
}

const rgba = (c: any, fallback: [number, number, number, number] = [0.8, 0.8, 0.8, 1]): [number, number, number, number] =>
  Array.isArray(c) ? [c[0] ?? fallback[0], c[1] ?? fallback[1], c[2] ?? fallback[2], c[3] ?? 1] : fallback;

/** Explode ONE scene object into assembly parts in WORLD space (used
 * by "Make Instance": any primitive — plain, framegrid or an existing
 * assembly — becomes a flat list of colored parts). Non-primitives
 * (characters, models, polygons) return null: they cannot fuse. */
export function explodeToParts(obj: any): any[] | null {
  if (!obj || obj.kind !== "primitive") return null;
  const mat = new THREE.Matrix4().compose(
    new THREE.Vector3(obj.position?.[0] ?? 0, obj.position?.[1] ?? 0, obj.position?.[2] ?? 0),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(obj.rotation?.[0] ?? 0, obj.rotation?.[1] ?? 0, obj.rotation?.[2] ?? 0)),
    new THREE.Vector3(obj.scale?.[0] ?? 1, obj.scale?.[1] ?? 1, obj.scale?.[2] ?? 1),
  );
  const place = (local: any): any => {
    const lm = new THREE.Matrix4().compose(
      new THREE.Vector3(local.position?.[0] ?? 0, local.position?.[1] ?? 0, local.position?.[2] ?? 0),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(local.rotation?.[0] ?? 0, local.rotation?.[1] ?? 0, local.rotation?.[2] ?? 0)),
      new THREE.Vector3(local.scale?.[0] ?? 1, local.scale?.[1] ?? 1, local.scale?.[2] ?? 1),
    );
    const world = new THREE.Matrix4().multiplyMatrices(mat, lm);
    const p = new THREE.Vector3(); const q = new THREE.Quaternion(); const sc = new THREE.Vector3();
    world.decompose(p, q, sc);
    const e = new THREE.Euler().setFromQuaternion(q);
    return { ...local, position: [p.x, p.y, p.z], rotation: [e.x, e.y, e.z], scale: [sc.x, sc.y, sc.z] };
  };
  const base = { color: rgba(obj.color), roughness: obj.roughness ?? 0.85, metalness: obj.metalness ?? 0, ...(obj.emissive ? { emissive: rgba(obj.emissive), emissiveIntensity: obj.emissiveIntensity ?? 1 } : {}) };
  if (obj.shape === "assembly" && Array.isArray(obj.parts)) return obj.parts.map((p: any) => place({ ...p, color: rgba(p.color) }));
  if (obj.shape === "framegrid") {
    // Expand the fused frame back into its boxes (unit space), then
    // place them through the object's own transform.
    const len = Math.max(1, obj.scale?.[0] ?? 1);
    const sillF = 0.15 / 8, headF = 0.45 / 8, glassF = 1 - sillF - headF;
    const locals: any[] = [
      { shape: "box", position: [0, -0.5 + sillF / 2, 0], scale: [1, sillF, 1], rotation: [0, 0, 0], ...base },
      { shape: "box", position: [0, 0.5 - headF / 2, 0], scale: [1, headF, 1], rotation: [0, 0, 0], ...base },
    ];
    const nM = Math.max(1, Math.floor(len / 3));
    for (let i = 0; i <= nM; i++) locals.push({ shape: "box", position: [-0.5 + i / nM, -0.5 + sillF + glassF / 2, 0], scale: [0.12 / len, glassF, 0.7], rotation: [0, 0, 0], ...base });
    return locals.map(place);
  }
  return [place({ shape: obj.shape || "box", position: [0, 0, 0], scale: [1, 1, 1], rotation: [0, 0, 0], ...base })];
}

/** Fuse several scene objects into ONE "assembly" instance object
 * (founder directive 2026-10-26 — "Make Instance"): the new object's
 * origin is the selection's centroid; every source part is baked into
 * its local space with its own material. Returns the new object, or
 * null when nothing in `ids` can fuse. */
export function fuseToInstance(objects: any[], ids: string[], makeId: () => string): any | null {
  const src = objects.filter((o) => ids.includes(o.id));
  const parts: any[] = [];
  const used: string[] = [];
  for (const o of src) {
    const p = explodeToParts(o);
    if (p) { parts.push(...p); used.push(o.id); }
  }
  if (!used.length || !parts.length) return null;
  const cx = src.filter((o) => used.includes(o.id)).reduce((a, o) => a + (o.position?.[0] ?? 0), 0) / used.length;
  const cy = src.filter((o) => used.includes(o.id)).reduce((a, o) => a + (o.position?.[1] ?? 0), 0) / used.length;
  const cz = src.filter((o) => used.includes(o.id)).reduce((a, o) => a + (o.position?.[2] ?? 0), 0) / used.length;
  for (const p of parts) p.position = [p.position[0] - cx, p.position[1] - cy, p.position[2] - cz];
  const first = src.find((o) => used.includes(o.id));
  return {
    id: makeId(),
    kind: "primitive",
    name: used.length > 1 ? `Instance (${used.length} objects)` : `Instance — ${first?.name ?? "Object"}`,
    shape: "assembly",
    position: [cx, cy, cz],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    visible: true,
    color: rgba(first?.color),
    metalness: 0,
    roughness: 0.85,
    parts,
    __fusedIds: used,
  };
}

/** Build a fused assembly: merged geometry (with groups) + one material
 * per part, in part order. Parts are authored in the object's LOCAL
 * space (meters), each with its own color / roughness / metalness /
 * emissive, exactly like the separate objects they replaced. */
export function buildAssembly(obj: any): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const parts: any[] = Array.isArray(obj?.parts) ? obj.parts : [];
  const geos: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (const p of parts) {
    const g = unitGeometry(p.shape || "box");
    e.set(p.rotation?.[0] ?? 0, p.rotation?.[1] ?? 0, p.rotation?.[2] ?? 0);
    q.setFromEuler(e);
    m4.compose(
      new THREE.Vector3(p.position?.[0] ?? 0, p.position?.[1] ?? 0, p.position?.[2] ?? 0),
      q,
      new THREE.Vector3(p.scale?.[0] ?? 1, p.scale?.[1] ?? 1, p.scale?.[2] ?? 1),
    );
    g.applyMatrix4(m4);
    geos.push(g);
    const c = rgba(p.color);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(c[0], c[1], c[2]),
      roughness: p.roughness ?? 0.85,
      metalness: p.metalness ?? 0,
      transparent: c[3] < 1,
      opacity: c[3],
    });
    if (p.emissive) {
      const em = rgba(p.emissive);
      mat.emissive = new THREE.Color(em[0], em[1], em[2]);
      mat.emissiveIntensity = p.emissiveIntensity ?? 1;
    }
    materials.push(mat);
  }
  const geometry = geos.length ? (mergeGeometries(geos, true) ?? new THREE.BoxGeometry(1, 1, 1)) : new THREE.BoxGeometry(1, 1, 1);
  return { geometry, materials };
}
