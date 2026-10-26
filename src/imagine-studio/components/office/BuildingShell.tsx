// @ts-nocheck -- 3D building shell: three-stdlib only, no React state per frame.
/**
 * THE BUILDING, FOR LOOKS (founder directive, repeated, 2026-10-26):
 * standing on any floor you see the whole tower — floors 100 down to 1 —
 * as ONE lightweight instanced shell: a slab + a glass band per level,
 * two draw calls for all 100 floors. The floors directly above and
 * below you are NOT generic: they render a box-proxy of that floor's
 * REAL published scene (every primitive at its true position, size and
 * color, characters excluded), so Floor 99 looks like Floor 99 seen
 * from 100, and Floor 100 looks like Floor 100 seen from 99. Nothing
 * here loads a model, a texture or another floor's runtime — it is
 * scenery only, never interactive.
 */
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { allFloors, type FloorDef } from "@/imagine-studio/lib/floors";
import { buildBuildingPlazaScene, buildFloor99Scene, buildOfficeScene, publishedWorldUrl } from "@/imagine-studio/lib/officeWorld";
import type { PrimitiveObject } from "@/imagine-studio/lib/levelTypes";

export const BUILDING_TOP = 100;
export const BUILDING_BOTTOM = 1;
/** Floor-to-floor height: the office room itself is 8 units tall
 * (buildOfficeScene H), so levels stack at exactly that pitch and the
 * neighbour's walls land flush against your ceiling/floor line. */
export const FLOOR_H = 8;
const PLATE_W = 48;
const PLATE_D = 32;

const HAZE = new THREE.Color("#b9cfdd");
const SLAB_BASE = new THREE.Color("#cfd8e1");
const GLASS_BASE = new THREE.Color("#8fb8d8");

/** Atmospheric fade with distance: a tower read from its top floor
 * cannot resolve floor 1 — the far levels melt into the sky haze,
 * which also keeps the shell graceful inside the photo skybox. */
function faded(base: THREE.Color, levelsAway: number): THREE.Color {
  const t = Math.min(1, Math.abs(levelsAway) / 30);
  return base.clone().lerp(HAZE, t * 0.85);
}

function TowerSlabs({ currentId, detailed }: { currentId: number; detailed: Set<number> }) {
  const { slabs, facades } = useMemo(() => {
    const levels: number[] = [];
    for (let id = BUILDING_BOTTOM; id <= BUILDING_TOP; id++) {
      if (id === currentId || detailed.has(id)) continue;
      levels.push(id);
    }
    const box = new THREE.BoxGeometry(1, 1, 1);
    const slabMesh = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0.05 }), levels.length);
    slabMesh.name = "building-tower-slabs";
    /* OPAQUE framed facades instead of transparent glass bands
     * (founder directive 2026-10-26: the see-through bands on ~97
     * floors shimmered like water; the fill floors now wear the same
     * framed windows as the real floors, too deep to see into).
     * Facades + corner columns ride ONE instanced mesh. */
    type Part = { p: [number, number, number]; s: [number, number, number]; glass?: boolean; away: number };
    const parts: Part[] = [];
    const facadeC = new THREE.Color("#3d5f82");
    levels.forEach((id) => {
      const off = (id - currentId) * FLOOR_H;
      const away = id - currentId;
      const add = (p: [number, number, number], s: [number, number, number], glass = false) => parts.push({ p, s, glass, away });
      add([0, off + FLOOR_H / 2, -(PLATE_D / 2 + 0.02)], [PLATE_W + 0.24, FLOOR_H - 0.6, 0.3], true);
      add([0, off + FLOOR_H / 2, PLATE_D / 2 + 0.02], [PLATE_W + 0.24, FLOOR_H - 0.6, 0.3], true);
      add([-(PLATE_W / 2 + 0.02), off + FLOOR_H / 2, 0], [0.3, FLOOR_H - 0.6, PLATE_D + 0.24], true);
      add([PLATE_W / 2 + 0.02, off + FLOOR_H / 2, 0], [0.3, FLOOR_H - 0.6, PLATE_D + 0.24], true);
      for (const cx of [-(PLATE_W / 2 + 0.1), PLATE_W / 2 + 0.1]) for (const cz of [-(PLATE_D / 2 + 0.1), PLATE_D / 2 + 0.1]) add([cx, off + FLOOR_H / 2, cz], [0.55, FLOOR_H, 0.55]);
    });
    const facadeMesh = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.25 }), parts.length);
    facadeMesh.name = "building-tower-facades";
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    levels.forEach((id, i) => {
      const off = (id - currentId) * FLOOR_H;
      m.compose(new THREE.Vector3(0, off - 0.22, 0), q, new THREE.Vector3(PLATE_W + 0.4, 0.45, PLATE_D + 0.4));
      slabMesh.setMatrixAt(i, m);
      slabMesh.setColorAt(i, faded(SLAB_BASE, id - currentId));
    });
    parts.forEach((pt, i) => {
      m.compose(new THREE.Vector3(...pt.p), q, new THREE.Vector3(...pt.s));
      facadeMesh.setMatrixAt(i, m);
      facadeMesh.setColorAt(i, faded(pt.glass ? facadeC : SLAB_BASE, pt.away));
    });
    slabMesh.frustumCulled = false;
    facadeMesh.frustumCulled = false;
    return { slabs: slabMesh, facades: facadeMesh };
  }, [currentId, detailed]);
  useEffect(() => () => {
    slabs.geometry.dispose(); (slabs.material as THREE.Material).dispose();
    facades.geometry.dispose(); (facades.material as THREE.Material).dispose();
  }, [slabs, facades]);
  return (
    <>
      <primitive object={slabs} />
      <primitive object={facades} />
    </>
  );
}

/** Normalise a floor's scene objects from either source into the
 * primitive list the proxy renders. */
function primitivesOf(json: any): PrimitiveObject[] | null {
  const objs = json?.scene?.objects || json?.objects;
  if (!Array.isArray(objs)) return null;
  const prims = objs.filter((o: any) => o && o.kind === "primitive" && o.visible !== false);
  return prims.length ? (prims as PrimitiveObject[]) : null;
}

function codeSceneFor(floor: FloorDef): PrimitiveObject[] | null {
  try {
    if (floor.id === 100) return primitivesOf(buildOfficeScene());
    if (floor.id === 99) return primitivesOf(buildFloor99Scene());
  } catch { /* dynamic floors have no code scene — generic slab stands */ }
  return null;
}

/** Box-proxy instancing shared by neighbour floors and the plaza:
 * opaque and glassy primitives as two InstancedMeshes at true
 * position/rotation/scale. */
function proxyMeshes(prims: PrimitiveObject[], name: string) {
  const opaque = prims.filter((p) => (p.color?.[3] ?? 1) >= 0.99);
  const glassy = prims.filter((p) => (p.color?.[3] ?? 1) < 0.99);
  const build = (list: PrimitiveObject[], transparent: boolean, meshName: string) => {
    if (!list.length) return null;
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      transparent
        ? new THREE.MeshStandardMaterial({ roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.3, depthWrite: false })
        : new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.05 }),
      list.length,
    );
    mesh.name = meshName;
    const m = new THREE.Matrix4();
    list.forEach((p, i) => {
      const e = new THREE.Euler(p.rotation?.[0] || 0, p.rotation?.[1] || 0, p.rotation?.[2] || 0);
      m.compose(
        new THREE.Vector3(p.position?.[0] || 0, p.position?.[1] || 0, p.position?.[2] || 0),
        new THREE.Quaternion().setFromEuler(e),
        new THREE.Vector3(Math.abs(p.scale?.[0] || 1), Math.abs(p.scale?.[1] || 1), Math.abs(p.scale?.[2] || 1)),
      );
      mesh.setMatrixAt(i, m);
      const c = p.color || [1, 1, 1, 1];
      mesh.setColorAt(i, new THREE.Color(c[0], c[1], c[2]));
    });
    mesh.frustumCulled = false;
    return mesh;
  };
  return { opaque: build(opaque, false, name), glassy: build(glassy, true, `${name}-glass`) };
}

/** One neighbour floor, rendered as a faithful box-proxy of its real
 * published layout at its true height in the tower. */
function NeighborProxy({ floor, currentId }: { floor: FloorDef; currentId: number }) {
  const [prims, setPrims] = useState<PrimitiveObject[] | null>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      let found: PrimitiveObject[] | null = null;
      try {
        const r = await fetch(publishedWorldUrl(floor.publishedFile));
        if (r.ok) found = primitivesOf(await r.json());
      } catch { /* fall through to the code scene */ }
      if (!found) found = codeSceneFor(floor);
      if (live) setPrims(found);
    })();
    return () => { live = false; };
  }, [floor]);

  const meshes = useMemo(() => (prims ? proxyMeshes(prims, "building-neighbor-proxy") : null), [prims]);

  if (!meshes) return null;
  const y = (floor.id - currentId) * FLOOR_H;
  return (
    <group position={[0, y, 0]}>
      {meshes.opaque && <primitive object={meshes.opaque} />}
      {meshes.glassy && <primitive object={meshes.glassy} />}
    </group>
  );
}

/** The BUILDING PLAZA at the tower's base in the live office: the
 * plaza level's own scene (published building-plaza.json when it
 * exists, the code seed otherwise) as a box-proxy at ground level,
 * so looking down from any floor the building lands on its plaza —
 * podium, fountain, planters and the theater screen included. */
function PlazaBase({ currentId }: { currentId: number }) {
  const [prims, setPrims] = useState<PrimitiveObject[] | null>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      let found: PrimitiveObject[] | null = null;
      try {
        const r = await fetch(publishedWorldUrl("building-plaza.json"));
        if (r.ok) found = primitivesOf(await r.json());
      } catch { /* fall through to the code scene */ }
      if (!found) { try { found = primitivesOf(buildBuildingPlazaScene()); } catch { /* no plaza */ } }
      if (live) setPrims(found);
    })();
    return () => { live = false; };
  }, []);
  const meshes = useMemo(() => (prims ? proxyMeshes(prims, "building-plaza-base") : null), [prims]);
  if (!meshes) return null;
  return (
    <group position={[0, (0 - currentId) * FLOOR_H, 0]}>
      {meshes.opaque && <primitive object={meshes.opaque} />}
      {meshes.glassy && <primitive object={meshes.glassy} />}
    </group>
  );
}

export default function BuildingShell({ currentFloorId }: { currentFloorId: number }) {
  const neighbors = useMemo(
    () => allFloors().filter((f) => Math.abs(f.id - currentFloorId) === 1),
    [currentFloorId],
  );
  const detailed = useMemo(() => new Set(neighbors.map((f) => f.id)), [neighbors]);
  return (
    <group>
      <TowerSlabs currentId={currentFloorId} detailed={detailed} />
      {neighbors.map((f) => (
        <NeighborProxy key={f.key} floor={f} currentId={currentFloorId} />
      ))}
      <PlazaBase currentId={currentFloorId} />
    </group>
  );
}
