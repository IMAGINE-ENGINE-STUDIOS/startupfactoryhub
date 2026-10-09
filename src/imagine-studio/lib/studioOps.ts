// @ts-nocheck -- Imagine Studio v2
// Applies Genius 3D operations (from the studio-genius function) to a LevelScene.
import type { LevelScene } from "@/imagine-studio/lib/levelTypes";

const num = (v, d) => (typeof v === "number" && isFinite(v) ? v : d);
const v3 = (v, d) => (Array.isArray(v) && v.length === 3 ? v.map((x, i) => num(x, d[i])) : d);
const rgba = (v, d) => {
  if (typeof v === "string" && /^#?[0-9a-f]{6}$/i.test(v)) { const n = parseInt(v.replace("#", ""), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1]; }
  if (Array.isArray(v) && v.length >= 3) return [num(v[0], 1), num(v[1], 1), num(v[2], 1), num(v[3], 1)];
  return d;
};
const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 10)}`;
const SHAPES = ["box", "sphere", "plane", "cylinder", "cone", "torus"];

/** Compact context for the AI: level, selection, objects, lights, environment. */
export function sceneContext(scene: LevelScene, levelName: string, selectedId: string | null) {
  const brief = (o) => ({ id: o.id, name: o.name, kind: o.kind, shape: o.shape, position: o.position, rotation: o.rotation, scale: o.scale, color: o.color, ...(o.interactions?.length ? { scripts: o.interactions.map((i) => i.name) } : {}) });
  const sel = scene.objects.find((o) => o.id === selectedId);
  return {
    level: levelName,
    selected: sel ? { ...brief(sel), metalness: sel.metalness, roughness: sel.roughness, fileName: sel.fileName } : null,
    objects: scene.objects.slice(0, 250).map(brief),
    lights: scene.lights.map((l) => ({ id: l.id, kind: l.kind, position: l.position, intensity: l.intensity })),
    environment: scene.environment,
  };
}

/** Returns a new scene with the ops applied, plus a count of applied ops. */
export function applyStudioOps(input: LevelScene, ops: any[], layerId?: string): { scene: LevelScene; applied: number; newIds: string[] } {
  const s: LevelScene = structuredClone(input);
  const alias = new Map<string, string>();
  const real = (id) => alias.get(id) ?? id;
  const newIds: string[] = [];
  let applied = 0;
  for (const op of ops || []) {
    try {
      if (op.op === "add" && op.object) {
        const o = op.object;
        const id = uid("obj");
        if (o.id) alias.set(String(o.id), id);
        const base = { id, name: String(o.name || "Object").slice(0, 80), position: v3(o.position, [0, 0.5, 0]), rotation: v3(o.rotation, [0, 0, 0]), scale: v3(o.scale, [1, 1, 1]), visible: true, ...(layerId ? { layerId } : {}) };
        if (o.kind === "model" && typeof o.url === "string") s.objects.push({ ...base, kind: "model", url: o.url, fileName: o.fileName });
        else s.objects.push({ ...base, kind: "primitive", shape: SHAPES.includes(o.shape) ? o.shape : "box", color: rgba(o.color, [0.8, 0.8, 0.8, 1]), metalness: num(o.metalness, 0), roughness: num(o.roughness, 0.7) });
        newIds.push(id); applied++;
      } else if (op.op === "update") {
        const o = s.objects.find((x) => x.id === real(op.id)); if (!o) continue;
        const p = op.patch || {};
        if (p.position) o.position = v3(p.position, o.position);
        if (p.rotation) o.rotation = v3(p.rotation, o.rotation);
        if (p.scale) o.scale = v3(p.scale, o.scale);
        if (p.name) o.name = String(p.name).slice(0, 80);
        if (typeof p.visible === "boolean") o.visible = p.visible;
        if (o.kind === "primitive") {
          if (p.color) o.color = rgba(p.color, o.color);
          if (p.metalness != null) o.metalness = num(p.metalness, o.metalness);
          if (p.roughness != null) o.roughness = num(p.roughness, o.roughness);
          if (p.shape && SHAPES.includes(p.shape)) o.shape = p.shape;
        } else if (o.kind === "model" && (p.color || p.metalness != null || p.roughness != null)) {
          o.materialOverrides = { ...(o.materialOverrides || {}), "*": { ...(p.color ? { color: rgba(p.color, [1, 1, 1, 1]) } : {}), ...(p.metalness != null ? { metalness: p.metalness } : {}), ...(p.roughness != null ? { roughness: p.roughness } : {}) } };
        }
        applied++;
      } else if (op.op === "remove") {
        const before = s.objects.length; s.objects = s.objects.filter((x) => x.id !== real(op.id)); if (s.objects.length < before) applied++;
      } else if (op.op === "environment" && op.patch) {
        const p = op.patch;
        if (typeof p.background === "string") s.environment.background = p.background;
        if (p.ambient != null) s.environment.ambient = num(p.ambient, s.environment.ambient);
        if (p.fog === null) delete s.environment.fog;
        else if (p.fog) s.environment.fog = { color: String(p.fog.color || "#888888"), near: num(p.fog.near, 10), far: num(p.fog.far, 80) };
        applied++;
      } else if (op.op === "light" && op.light) {
        const l = op.light;
        s.lights.push({ id: uid("light"), name: String(l.name || "Light"), kind: ["point", "spot", "directional", "ambient"].includes(l.kind) ? l.kind : "point", position: v3(l.position, [0, 4, 0]), color: rgba(l.color, [1, 1, 1, 1]), intensity: num(l.intensity, 1) });
        applied++;
      } else if (op.op === "script" && op.interaction) {
        const o = s.objects.find((x) => x.id === real(op.id)); if (!o) continue;
        const it = op.interaction;
        const inter = { id: uid("ix"), name: String(it.name || "Script").slice(0, 60), kind: it.js ? "js" : "preset", trigger: it.trigger || "onClick", triggerKey: it.triggerKey, triggerDistance: it.triggerDistance, ...(it.js ? { js: String(it.js).slice(0, 8000) } : { preset: it.preset }) };
        o.interactions = [...(o.interactions || []), inter];
        if (inter.trigger === "onClick" || inter.trigger === "key" || inter.trigger === "onPlayerNear") {
          o.actionButtons = [...(o.actionButtons || []), { id: uid("btn"), label: inter.name, pinVisible: inter.trigger !== "onPlayerNear", actionId: inter.id,
            trigger: inter.trigger === "key" ? { kind: "key", keys: [inter.triggerKey || "E"] } : inter.trigger === "onPlayerNear" ? { kind: "proximity", distance: inter.triggerDistance || 2.5 } : { kind: "click" } }];
        }
        applied++;
      } else if (op.op === "play" && op.behavior) {
        const o = s.objects.find((x) => x.id === real(op.id)); if (!o) continue;
        o.playBehavior = { collision: "walkable", ...op.behavior }; applied++;
      }
    } catch (e) { console.warn("[genius3d] op failed", op, e); }
  }
  return { scene: s, applied, newIds };
}
