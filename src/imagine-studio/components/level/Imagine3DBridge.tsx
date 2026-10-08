import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Speaks the Imagine Engine 3D protocol (same as public/imagine-engine/blocks/rt3d.js)
 * so Content-tab sliders and Flow 3D steps drive the Studio when it is embedded
 * as a canvas block. No-op when the Studio is opened directly.
 */
const KEY = "ie-3d:studio3d";

export function Imagine3DBridge() {
  const { scene, camera, gl } = useThree();
  const cfg = useRef<Record<string, any>>({});
  const objs = useRef<Record<string, THREE.Object3D>>({});

  useEffect(() => {
    if (window.parent === window) return;
    try { cfg.current = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { cfg.current = {}; }
    const up = (m: any) => { try { window.parent.postMessage(m, "*"); } catch { /* ignore */ } };
    const naniteCount = () => { let n = 0; scene.traverse((o: any) => { if (o.userData?.__nanite) n++; }); return n; };
    const info = () => ({ key: KEY, cfg: cfg.current, game: false, studio: true, nanite: naniteCount() });
    const cam = camera as THREE.PerspectiveCamera;
    const camBase = cam.position.clone();

    const apply = () => {
      const c = cfg.current;
      if (c.fov != null && cam.fov != null) { cam.fov = +c.fov; cam.updateProjectionMatrix(); }
      if (c.camDist != null) cam.position.copy(camBase).multiplyScalar(+c.camDist);
      if (c.exposure != null) { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = +c.exposure; }
      if (c.bg) { scene.background = new THREE.Color(c.bg); if (scene.fog) (scene.fog as any).color = new THREE.Color(c.bg); }
      if (c.fog != null) {
        const far = 20 + (1 - +c.fog) * 280;
        if (+c.fog > 0.01) scene.fog = new THREE.Fog((scene.background as any)?.isColor ? (scene.background as THREE.Color) : new THREE.Color("#0b1220"), Math.min(far - 1, 5 + (1 - +c.fog) * 40), far);
        else scene.fog = null;
      }
      scene.traverse((o: any) => {
        if (o.isLight && !o.isAmbientLight && !o.isHemisphereLight && c.sun != null) { o.userData.__ieb ??= o.intensity; o.intensity = o.userData.__ieb * +c.sun; }
        if ((o.isAmbientLight || o.isHemisphereLight) && c.ambient != null) { o.userData.__ieb ??= o.intensity; o.intensity = o.userData.__ieb * +c.ambient; }
        if (o.isDirectionalLight && c.sunAngle != null) { const a = (+c.sunAngle * Math.PI) / 180; o.position.set(Math.cos(a) * 10, Math.max(1, Math.sin(a) * 12), 5); }
        if (o.isMesh && o.material) ([] as any[]).concat(o.material).forEach((m) => {
          if (c.wireframe != null && "wireframe" in m) m.wireframe = !!c.wireframe;
          if (c.roughness != null && m.roughness != null) m.roughness = +c.roughness;
          if (c.metalness != null && m.metalness != null) m.metalness = +c.metalness;
        });
      });
    };
    const find = (id: string) => objs.current[id] || scene.getObjectByName(id) || scene.getObjectByName(`obj-${id}`);
    const cmd = (d: any) => {
      if (d.op === "spawn") {
        const s = +d.size || 1;
        const geo = d.shape === "sphere" ? new THREE.SphereGeometry(s, 24, 16) : d.shape === "cylinder" ? new THREE.CylinderGeometry(s, s, s * 2, 24) : new THREE.BoxGeometry(s, s, s);
        const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: d.color || "#8b5cf6", roughness: 0.4, metalness: 0.2 }));
        const p = d.position || [0, 1, 0]; m.position.set(+p[0] || 0, +p[1] || 0, +p[2] || 0);
        m.castShadow = true;
        const id = d.id || "obj_" + Date.now().toString(36); m.name = id; objs.current[id] = m; scene.add(m);
        up({ ie: "state", key: "3d:last", value: id });
      } else if (d.op === "move") {
        const o = find(d.id); if (!o) return;
        const to = d.position || [0, 0, 0], from = o.position.clone(), t0 = performance.now(), dur = Math.max(1, d.duration || 600);
        const step = () => { const k = Math.min(1, (performance.now() - t0) / dur), e = k * k * (3 - 2 * k); o.position.set(from.x + (to[0] - from.x) * e, from.y + (to[1] - from.y) * e, from.z + (to[2] - from.z) * e); if (k < 1) requestAnimationFrame(step); };
        step();
        if (d.rotateY != null) o.rotation.y += (+d.rotateY * Math.PI) / 180;
      } else if (d.op === "remove") {
        const o = find(d.id); if (o) { o.parent?.remove(o); delete objs.current[d.id]; }
      } else if (d.op === "color") {
        const o: any = find(d.id); if (!o) return;
        o.traverse((x: any) => { if (x.isMesh && x.material?.color) x.material.color = new THREE.Color(d.color); });
      }
    };
    const onMsg = (e: MessageEvent) => {
      const d: any = e.data; if (!d || typeof d !== "object") return;
      if (d.__IE3D === "set") { Object.assign(cfg.current, d.cfg || {}); try { localStorage.setItem(KEY, JSON.stringify(cfg.current)); } catch { /* ignore */ } apply(); }
      else if (d.__IE3D === "reset") { cfg.current = {}; try { localStorage.removeItem(KEY); } catch { /* ignore */ } location.reload(); }
      else if (d.__IE3D === "cmd") cmd(d);
      else if (d.__IE3D === "ping") up({ __IE3D: "info", ...info() });
    };
    const onDown = () => up({ __IE3D: "pick", ...info() });
    window.addEventListener("message", onMsg);
    gl.domElement.addEventListener("pointerdown", onDown, true);
    const t = setTimeout(apply, 400);
    up({ __IE3D: "ready", key: KEY, studio: true });
    (window as any).IE3D = { emit: (key: string, value: any) => up({ ie: "state", key, value }), cfg: () => cfg.current };
    return () => { clearTimeout(t); window.removeEventListener("message", onMsg); gl.domElement.removeEventListener("pointerdown", onDown, true); };
  }, [scene, camera, gl]);
  return null;
}
