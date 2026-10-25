// @ts-nocheck -- Imagine Studio v2
// Plaza District as an editable 3D Studio level (mirrors the built-in /plaza world).
import { EMPTY_SCENE, type LevelScene, type PrimitiveObject } from "@/imagine-studio/lib/levelTypes";
import { createLocalLevel, ensurePlazaLevel, getLocalLevel, listLocalLevels, preserveLocalDraft, resolveWorldSyncLevel, setBoundWorldKey, updateLocalLevel, type LocalLevelRecord } from "@/imagine-studio/lib/localLevels";

export const PLAZA_LEVEL_NAME = "Plaza District";
/** Same bright daylight as the live /plaza game: sky/ground fill, no dark contact-shadow patch. */
export const PLAZA_ENVIRONMENT: LevelScene["environment"] = {
  ...EMPTY_SCENE.environment,
  background: "#9ec9ee",
  ambient: 0.6,
  gi: { enabled: true, skyColor: "#dfefff", groundColor: "#6b8f4e", hemisphereIntensity: 0.4, contactShadows: false, contactOpacity: 0, contactBlur: 2.5 },
};
export const PLAZA_PUBLISHED_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/studio-published/plaza-district.json`;

const hex = (h: string, a = 1): [number, number, number, number] => {
  const n = parseInt(h.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a];
};
let n = 0;
const P = (name: string, shape: PrimitiveObject["shape"], position, scale, color: string, extra: Partial<PrimitiveObject> = {}): PrimitiveObject => ({
  id: `plaza_${++n}`, kind: "primitive", name, shape, position, rotation: [0, 0, 0], scale, visible: true,
  color: hex(color), metalness: 0, roughness: 0.85, ...extra,
});

/** Fetches the scene the live /plaza game is actually playing (the published JSON). */
export async function fetchPublishedPlazaScene(): Promise<LevelScene | null> {
  try {
    const r = await fetch(`${PLAZA_PUBLISHED_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return null;
    const d: any = await r.json();
    const scene = d?.scene ?? (d?.objects ? d : null);
    return scene?.objects ? (scene as LevelScene) : null;
  } catch {
    return null;
  }
}

const stableStringify = (v: any): string => {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(v[k])}`).join(",")}}`;
};

/**
 * Opens the Plaza District level for editing with its scene set to the CURRENT
 * published version — the exact scene the /plaza game renders, models included.
 * If the local copy has diverged (stale seed or unpublished edits), the divergent
 * scene is first preserved as its own local level so no work is lost, then the
 * Plaza level is reset to the published scene. Falls back to the existing local
 * level (or the built-in mirror) only when the published JSON is unreachable.
 */
export async function syncPlazaLevelToPublished(): Promise<LocalLevelRecord> {
  const publishedScene = await fetchPublishedPlazaScene();
  // Identity is binding-first (founder segregation rule 2026-10-25): the
  // level pinned to "plaza" is the Plaza level whatever it is named, and
  // a level bound to another world is never eligible — this sync can
  // never overwrite the Office, or vice versa.
  let existing = resolveWorldSyncLevel("plaza", PLAZA_LEVEL_NAME);
  if (!existing) {
    existing = ensurePlazaLevel(publishedScene ? () => publishedScene : buildPlazaScene, PLAZA_LEVEL_NAME);
    setBoundWorldKey(existing.id, "plaza");
    return getLocalLevel(existing.id) ?? existing;
  }
  setBoundWorldKey(existing.id, "plaza");
  if (!publishedScene) return existing;
  if (stableStringify(existing.scene) !== stableStringify(publishedScene)) {
    preserveLocalDraft(existing, PLAZA_LEVEL_NAME, "Local edits preserved when the Plaza District level was re-synced to the published version");
    updateLocalLevel(existing.id, { scene: JSON.parse(JSON.stringify(publishedScene)) });
  }
  return getLocalLevel(existing.id) ?? existing;
}

export function buildPlazaScene(): LevelScene {
  n = 0;
  const o: PrimitiveObject[] = [];
  const flat = [-Math.PI / 2, 0, 0] as [number, number, number];
  o.push(P("Lawn", "cylinder", [0, -0.05, 0], [90, 0.1, 90], "#6b8f4e"));
  o.push(P("Stone Plaza", "cylinder", [0, 0.01, 0], [56, 0.04, 56], "#cfc6b6", { roughness: 0.9 }));
  // Fountain
  o.push(P("Fountain Basin", "cylinder", [0, 0.45, 0], [7.2, 0.9, 7.2], "#9aa0a6"));
  o.push(P("Fountain Water", "cylinder", [0, 0.62, 0], [6.5, 0.9, 6.5], "#2f7fd1", { color: hex("#2f7fd1", 0.7), roughness: 0.1, metalness: 0.2, playBehavior: { collision: "none" } }));
  o.push(P("Fountain Column", "cylinder", [0, 1.4, 0], [0.8, 2.6, 0.8], "#8a9096"));
  o.push(P("Fountain Tier", "cylinder", [0, 2.2, 0], [2.2, 0.25, 2.2], "#9aa0a6"));
  o.push(P("Fountain Crown", "sphere", [0, 2.9, 0], [0.9, 0.9, 0.9], "#8a9096"));
  // Benches
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2, x = Math.cos(a) * 12, z = Math.sin(a) * 12, ry = -a + Math.PI / 2;
    o.push(P(`Bench ${i + 1}`, "box", [x, 0.45, z], [2, 0.1, 0.5], "#8b5a2b", { rotation: [0, ry, 0], playBehavior: { collision: "walkable", sittable: { key: "E" }, interactRadius: 1.6 } }));
    o.push(P(`Bench ${i + 1} Back`, "box", [x - Math.sin(ry) * 0.22 * -1, 0.8, z - Math.cos(ry) * 0.22], [2, 0.5, 0.08], "#8b5a2b", { rotation: [0, ry, 0] }));
  }
  // Trees (north gap left open for the theater)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, x = Math.cos(a) * 32, z = Math.sin(a) * 32;
    if (z < -24 && Math.abs(x) < 14) continue;
    o.push(P(`Tree ${i + 1} Trunk`, "cylinder", [x, 1.2, z], [0.5, 2.4, 0.5], "#6b4423"));
    o.push(P(`Tree ${i + 1} Crown`, "cone", [x, 3.2, z], [3.2, 3, 3.2], "#2f6b3a"));
  }
  // Street lights
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4, x = Math.cos(a) * 20, z = Math.sin(a) * 20;
    o.push(P(`Street Light ${i + 1} Pole`, "cylinder", [x, 2, z], [0.18, 4, 0.18], "#222222"));
    o.push(P(`Street Light ${i + 1} Lamp`, "sphere", [x, 4.1, z], [0.6, 0.6, 0.6], "#fff6d5", { metalness: 0, roughness: 0.2 }));
  }
  // Theater on the north lawn (screen content itself is live in /plaza)
  o.push(P("Theater Screen", "box", [0, 5.5, -36], [16.4, 9.4, 0.3], "#111318", { metalness: 0.3, roughness: 0.4 }));
  o.push(P("Theater Pylon Left", "box", [-8.6, 5, -36], [0.6, 10, 0.6], "#2a2d33"));
  o.push(P("Theater Pylon Right", "box", [8.6, 5, -36], [0.6, 10, 0.6], "#2a2d33"));
  o.push(P("Theater Stage", "box", [0, 0.15, -34.5], [18, 0.3, 4], "#3a3d44"));
  // Election booth
  o.push(P("Election Booth", "box", [10, 1.1, -6], [2.4, 2.2, 1.6], "#1f3a8a", { playBehavior: { collision: "walkable", usable: { key: "E", label: "Vote" }, interactRadius: 2.5 } }));

  return {
    ...EMPTY_SCENE,
    objects: o,
    lights: [
      { id: "plaza_sun", name: "Sun", kind: "directional", position: [20, 30, 10], color: [1, 0.97, 0.9, 1], intensity: 1.4, castShadow: true },
      { id: "plaza_ambient", name: "Ambient", kind: "ambient", position: [0, 0, 0], color: [1, 1, 1, 1], intensity: 0.6 },
      { id: "plaza_theater_bounce", name: "Theater Bounce", kind: "point", position: [0, 3, -30], color: [0.6, 0.75, 1, 1], intensity: 1.2 },
    ],
    environment: PLAZA_ENVIRONMENT,
  };
}
