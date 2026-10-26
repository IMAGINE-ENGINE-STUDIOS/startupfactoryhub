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
import { buildFloor99Scene, buildOfficeScene, publishedWorldUrl } from "@/imagine-studio/lib/officeWorld";
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
  const { slabs, glass } = useMemo(() => {
    const levels: number[] = [];
    for (let id = BUILDING_BOTTOM; id <= BUILDING_TOP; id++) {
      if (id === currentId || detailed.has(id)) continue;
      levels.push(id);
    }
    const box = new THREE.BoxGeometry(1, 1, 1);
    const slabMesh = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0.05 }), levels.length);
    slabMesh.name = "building-tower-slabs";
    const glassMesh = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.34, depthWrite: false }), levels.length);
    glassMesh.name = "building-tower-glass";
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const one = new THREE.Vector3(1, 1, 1);
    levels.forEach((id, i) => {
      const off = (id - currentId) * FLOOR_H;
      m.compose(new THREE.Vector3(0, off - 0.22, 0), q, new THREE.Vector3(PLATE_W + 0.4, 0.45, PLATE_D + 0.4));
      slabMesh.setMatrixAt(i, m);
      slabMesh.setColorAt(i, faded(SLAB_BASE, id - currentId));
      m.compose(new THREE.Vector3(0, off + FLOOR_H / 2, 0), q, new THREE.Vector3(PLATE_W + 0.24, FLOOR_H - 0.55, PLATE_D + 0.24));
      glassMesh.setMatrixAt(i, m);
      glassMesh.setColorAt(i, faded(GLASS_BASE, id - currentId));
    });
    slabMesh.frustumCulled = false;
    glassMesh.frustumCulled = false;
    return { slabs: slabMesh, glass: glassMesh };
  }, [currentId, detailed]);
  useEffect(() => () => {
    slabs.geometry.dispose(); (slabs.material as THREE.Material).dispose();
    glass.geometry.dispose(); (glass.material as THREE.Material).dispose();
  }, [slabs, glass]);
  return (
    <>
      <primitive object={slabs} />
      <primitive object={glass} />
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

  const meshes = useMemo(() => {
    if (!prims) return null;
    const opaque = prims.filter((p) => (p.color?.[3] ?? 1) >= 0.99);
    const glassy = prims.filter((p) => (p.color?.[3] ?? 1) < 0.99);
    const build = (list: PrimitiveObject[], transparent: boolean, name: string) => {
      if (!list.length) return null;
      const mesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        transparent
          ? new THREE.MeshStandardMaterial({ roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.3, depthWrite: false })
          : new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.05 }),
        list.length,
      );
      mesh.name = name;
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
    return {
      opaque: build(opaque, false, "building-neighbor-proxy"),
      glassy: build(glassy, true, "building-neighbor-proxy-glass"),
    };
  }, [prims]);

  if (!meshes) return null;
  const y = (floor.id - currentId) * FLOOR_H;
  return (
    <group position={[0, y, 0]}>
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
    </group>
  );
}
