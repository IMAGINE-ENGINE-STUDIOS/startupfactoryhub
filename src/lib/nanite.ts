/* Nanite-style virtualized detail for WebGL.
 * Heavy meshes get a chain of simplified geometries (meshoptimizer, error-bounded).
 * Every frame each mesh picks the cheapest level whose projected geometric error
 * stays under ~1 pixel, so dense models cost almost nothing when far away and
 * look identical up close. Materials/overrides are untouched (only geometry swaps). */
import * as THREE from "three";
import { MeshoptSimplifier } from "meshoptimizer";

const MIN_TRIS = 8000; // below this the mesh is already cheap
const RATIOS = [0.5, 0.2, 0.06, 0.015];
type Level = { geo: THREE.BufferGeometry; error: number };

export async function buildNaniteLods(root: THREE.Object3D): Promise<number> {
  await MeshoptSimplifier.ready;
  let count = 0;
  const meshes: THREE.Mesh[] = [];
  root.traverse((n: any) => { if (n.isMesh && !n.isSkinnedMesh && !n.userData.__nanite) meshes.push(n); });
  for (const m of meshes) {
    const g = m.geometry as THREE.BufferGeometry;
    const pos = g.getAttribute("position");
    if (!pos || pos.count < 3) continue;
    const idx = g.index ? g.index.array : null;
    const tris = (idx ? idx.length : pos.count) / 3;
    if (tris < MIN_TRIS) continue;
    const indices = idx ? new Uint32Array(idx) : new Uint32Array(pos.count).map((_, i) => i);
    const verts = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) { verts[i * 3] = pos.getX(i); verts[i * 3 + 1] = pos.getY(i); verts[i * 3 + 2] = pos.getZ(i); }
    g.computeBoundingSphere();
    const radius = g.boundingSphere?.radius || 1;
    const scale = MeshoptSimplifier.getScale(verts, 3);
    const levels: Level[] = [{ geo: g, error: 0 }];
    let prevLen = indices.length;
    for (const r of RATIOS) {
      const target = Math.floor((indices.length * r) / 3) * 3;
      if (target < 36) break;
      const [out, err] = MeshoptSimplifier.simplify(indices, verts, 3, target, 0.05, ["LockBorder"]);
      if (out.length >= prevLen * 0.9) continue;
      prevLen = out.length;
      const lg = g.clone();
      lg.setIndex(new THREE.BufferAttribute(out, 1));
      levels.push({ geo: lg, error: err * scale });
    }
    if (levels.length < 2) continue;
    if (!g.index) g.setIndex(new THREE.BufferAttribute(indices, 1));
    m.userData.__nanite = { levels, radius, cur: 0 };
    count++;
  }
  return count;
}

const _v = new THREE.Vector3();
/** Pick a level per mesh: projected error (px) = error / distance * (screenH / (2 tan(fov/2))). */
export function updateNanite(root: THREE.Object3D, camera: THREE.Camera, screenH: number, pixelBudget = 1) {
  const fov = (camera as THREE.PerspectiveCamera).fov ?? 50;
  const proj = screenH / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));
  root.traverse((n: any) => {
    const nd = n.userData?.__nanite; if (!nd) return;
    n.getWorldPosition(_v);
    const s = n.matrixWorld.getMaxScaleOnAxis();
    const dist = Math.max(0.001, _v.distanceTo(camera.position) - nd.radius * s);
    let pick = 0;
    for (let i = nd.levels.length - 1; i > 0; i--) {
      if ((nd.levels[i].error * s / dist) * proj <= pixelBudget) { pick = i; break; }
    }
    if (pick !== nd.cur) { n.geometry = nd.levels[pick].geo; nd.cur = pick; }
  });
}
