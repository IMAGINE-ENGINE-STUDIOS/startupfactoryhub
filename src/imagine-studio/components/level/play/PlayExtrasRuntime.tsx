// @ts-nocheck -- Imagine Studio v2
// Play-mode extras: drivable vehicles (E to enter/exit, WASD to drive, chase
// camera) and level portals (walk in or press a key to load a linked level).
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { objectWorldRefs, playerRef, drivingState, splineDrivenIds } from "@/imagine-studio/components/level/locomotion/locomotionState";

const v = new THREE.Vector3(), w = new THREE.Vector3();

export default function PlayExtrasRuntime({ objects }: { objects: any[] }) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const near = useRef<{ kind: "car" | "portal"; obj: any } | null>(null);
  const car = useRef({ speed: 0 });
  const fired = useRef(new Set<string>());
  const [prompt, setPrompt] = useState<string | null>(null);
  const live = useRef(objects); live.current = objects;

  const cars = objects.filter((o) => o.playBehavior?.drivable);
  const portals = objects.filter((o) => o.portal?.levelId || o.portal?.levelName);

  const go = (o: any) => window.dispatchEvent(new CustomEvent("ie-load-level", { detail: o.portal }));

  useEffect(() => {
    const d = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const k = e.key.toLowerCase(); keys.current[k] = true;
      if (drivingState.carId && k === (cars.find((c) => c.id === drivingState.carId)?.playBehavior.drivable.key || "e").toLowerCase()) {
        const p = playerRef.current, root = objectWorldRefs.get(drivingState.carId);
        splineDrivenIds.delete(drivingState.carId);
        if (p && root) { root.getWorldPosition(v); w.set(2, 0, 0).applyQuaternion(root.quaternion); v.add(w); if (p.parent) p.parent.worldToLocal(v); p.position.copy(v); p.visible = true; }
        drivingState.carId = null; car.current.speed = 0; return;
      }
      const n = near.current; if (!n) return;
      if (n.kind === "car" && k === (n.obj.playBehavior.drivable.key || "e").toLowerCase()) {
        drivingState.carId = n.obj.id; splineDrivenIds.add(n.obj.id); car.current.speed = 0;
        if (playerRef.current) playerRef.current.visible = false;
      } else if (n.kind === "portal" && n.obj.portal.trigger === "key" && k === (n.obj.portal.key || "e").toLowerCase()) go(n.obj);
    };
    const u = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", d); window.addEventListener("keyup", u);
    return () => {
      window.removeEventListener("keydown", d); window.removeEventListener("keyup", u);
      if (drivingState.carId) splineDrivenIds.delete(drivingState.carId);
      drivingState.carId = null;
      if (playerRef.current) playerRef.current.visible = true;
    };
  }, [cars.length, portals.length]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const p = playerRef.current;
    // ---- driving ----
    if (drivingState.carId) {
      const o = live.current.find((x) => x.id === drivingState.carId);
      const root = objectWorldRefs.get(drivingState.carId);
      if (!o || !root) { drivingState.carId = null; return; }
      const cfg = o.playBehavior.drivable; const max = cfg.speed ?? 14, turn = cfg.turnSpeed ?? 2.2;
      const k = keys.current;
      const thr = (k["w"] || k["arrowup"] ? 1 : 0) - (k["s"] || k["arrowdown"] ? 1 : 0);
      const st = (k["a"] || k["arrowleft"] ? 1 : 0) - (k["d"] || k["arrowright"] ? 1 : 0);
      const c = car.current;
      c.speed += thr * max * 1.2 * dt;
      c.speed *= Math.exp(-(thr ? 0.4 : 1.6) * dt);
      c.speed = Math.max(-max * 0.4, Math.min(max, c.speed));
      root.rotation.y += st * turn * dt * Math.min(1, Math.abs(c.speed) / 3) * Math.sign(c.speed || 1);
      root.position.x += Math.sin(root.rotation.y) * c.speed * dt;
      root.position.z += Math.cos(root.rotation.y) * c.speed * dt;
      root.getWorldPosition(v);
      if (p) { w.copy(v); if (p.parent) p.parent.worldToLocal(w); p.position.copy(w); p.visible = false; }
      const back = new THREE.Vector3(-Math.sin(root.rotation.y) * 8, 4, -Math.cos(root.rotation.y) * 8).add(v);
      camera.position.lerp(back, 1 - Math.exp(-5 * dt));
      camera.lookAt(v.x, v.y + 1, v.z);
      setPromptSafe("Driving · WASD to steer · E to exit");
      return;
    }
    if (!p) return;
    p.getWorldPosition(v);
    let best: any = null, bd = Infinity;
    for (const o of cars) {
      const r = objectWorldRefs.get(o.id); if (!r) continue;
      r.getWorldPosition(w); const d = w.distanceTo(v);
      if (d < 3.5 && d < bd) { bd = d; best = { kind: "car", obj: o }; }
    }
    for (const o of portals) {
      const r = objectWorldRefs.get(o.id); if (!r) continue;
      r.getWorldPosition(w); const d = Math.hypot(w.x - v.x, w.z - v.z);
      const rad = o.portal.radius ?? Math.max(1.5, Math.max(o.scale?.[0] ?? 1, o.scale?.[2] ?? 1) / 2 + 0.5);
      if (o.portal.trigger === "walk") {
        if (d < rad && !fired.current.has(o.id)) { fired.current.add(o.id); go(o); }
        if (d > rad + 1) fired.current.delete(o.id);
      } else if (d < rad + 1.5 && d < bd) { bd = d; best = { kind: "portal", obj: o }; }
    }
    near.current = best;
    setPromptSafe(best ? (best.kind === "car" ? `Press ${(best.obj.playBehavior.drivable.key || "E").toUpperCase()} to drive ${best.obj.name}` : `Press ${(best.obj.portal.key || "E").toUpperCase()} · ${best.obj.portal.label || "Go to " + (best.obj.portal.levelName || "level")}`) : null);
  });

  const last = useRef<string | null>(null);
  function setPromptSafe(t: string | null) { if (last.current !== t) { last.current = t; setPrompt(t); } }

  if (!prompt) return null;
  return (
    <Html fullscreen style={{ pointerEvents: "none" }} zIndexRange={[40, 0]}>
      <div style={{ position: "absolute", left: "50%", bottom: 96, transform: "translateX(-50%)" }} className="rounded-lg bg-background/90 border border-border/50 px-3 py-1.5 text-xs font-medium text-foreground">
        {prompt}
      </div>
    </Html>
  );
}
