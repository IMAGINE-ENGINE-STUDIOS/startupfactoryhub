/**
 * One-click model optimizer: simplifies every mesh in a model (meshoptimizer),
 * strips unused data and re-saves it as a lighter GLB that replaces the object's file.
 * The original file is kept so the change can be reverted. Rigged (skinned) meshes are kept intact.
 */
import { useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { MeshoptSimplifier } from "meshoptimizer";
import { Gauge, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const OPTIMIZE_LEVELS = { light: 0.5, lighter: 0.25, lightest: 0.1 } as const;
export type OptimizeLevel = keyof typeof OPTIMIZE_LEVELS;

const countTris = (root: THREE.Object3D) => {
  let t = 0;
  root.traverse((n: any) => { if (n.isMesh) { const g = n.geometry; t += (g.index ? g.index.count : g.getAttribute("position")?.count || 0) / 3; } });
  return Math.round(t);
};

/** Returns a lighter GLB as a data URL plus before/after triangle counts. */
export async function optimizeModelUrl(url: string, ratio: number) {
  await MeshoptSimplifier.ready;
  const gltf = await new GLTFLoader().loadAsync(url);
  const root = gltf.scene;
  const before = countTris(root);
  root.traverse((n: any) => {
    if (!n.isMesh || n.isSkinnedMesh) return;
    let g = n.geometry as THREE.BufferGeometry;
    const pos = g.getAttribute("position"); if (!pos || pos.count < 12) return;
    const idx = g.index ? new Uint32Array(g.index.array) : new Uint32Array(pos.count).map((_, i) => i);
    if (idx.length / 3 < 64) return;
    const verts = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) { verts[i * 3] = pos.getX(i); verts[i * 3 + 1] = pos.getY(i); verts[i * 3 + 2] = pos.getZ(i); }
    const target = Math.max(36, Math.floor((idx.length * ratio) / 3) * 3);
    const [out] = MeshoptSimplifier.simplify(idx, verts, 3, target, 0.08, ["LockBorder"]);
    if (out.length >= idx.length) return;
    g = g.clone(); g.setIndex(new THREE.BufferAttribute(out, 1));
    n.geometry = g;
  });
  const after = countTris(root);
  const glb: ArrayBuffer = await new Promise((res, rej) =>
    new GLTFExporter().parse(root, (r) => res(r as ArrayBuffer), (e) => rej(e), { binary: true, animations: gltf.animations, onlyVisible: true }),
  );
  const blob = new Blob([glb], { type: "model/gltf-binary" });
  const dataUrl: string = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(blob); });
  return { url: dataUrl, before, after, bytes: blob.size };
}

export default function ModelOptimizer({ obj, disabled, onPatch }: { obj: any; disabled?: boolean; onPatch: (p: any) => void }) {
  const [busy, setBusy] = useState(false);
  const [level, setLevel] = useState<OptimizeLevel>("lighter");
  const run = async () => {
    setBusy(true);
    try {
      const r = await optimizeModelUrl(obj.url, OPTIMIZE_LEVELS[level]);
      if (r.after >= r.before) { toast.message("This model is already light - nothing to reduce."); return; }
      onPatch({ url: r.url, originalUrl: obj.originalUrl || obj.url, optimized: { level, before: r.before, after: r.after } });
      toast.success(`Optimized: ${r.before.toLocaleString()} to ${r.after.toLocaleString()} triangles (${(r.bytes / 1048576).toFixed(1)} MB)`);
    } catch (e: any) {
      toast.error("Could not optimize this model: " + (e?.message || "unknown error"));
    } finally { setBusy(false); }
  };
  return (
    <div className="space-y-2 border-t border-border/40 pt-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Optimize (auto LOD)</div>
      <div className="grid grid-cols-3 gap-1">
        {(Object.keys(OPTIMIZE_LEVELS) as OptimizeLevel[]).map((k) => (
          <Button key={k} size="sm" variant={level === k ? "default" : "outline"} className="h-7 text-[11px] capitalize" onClick={() => setLevel(k)} disabled={busy || disabled}>{k}</Button>
        ))}
      </div>
      <Button size="sm" className="w-full h-8" onClick={run} disabled={busy || disabled || !obj.url}>
        {busy ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Gauge className="w-3.5 h-3.5 mr-1" />}
        {busy ? "Optimizing..." : "Optimize model"}
      </Button>
      {obj.optimized && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="mr-auto">{obj.optimized.before.toLocaleString()} → {obj.optimized.after.toLocaleString()} triangles</span>
          {obj.originalUrl && (
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" disabled={busy || disabled}
              onClick={() => onPatch({ url: obj.originalUrl, originalUrl: undefined, optimized: undefined })}>
              <Undo2 className="w-3 h-3 mr-1" />Original
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
