// @ts-nocheck -- Imagine Studio v2
// Muse HQ — NYC Office: a published world like the Plaza District, built from
// simple geometries (perimeter window walls, 20 desk stations) and populated
// with 20 NPC bots, one per Muse agent. Fully editable in the 3D Studio;
// /office plays the published version and each bot carries a live dashboard.
import { EMPTY_SCENE, type LevelScene, type PrimitiveObject } from "@/imagine-studio/lib/levelTypes";
import { createLocalLevel, ensurePlazaLevel as _ensure, getLocalLevel, listLocalLevels, updateLocalLevel, type LocalLevelRecord } from "@/imagine-studio/lib/localLevels";

export const OFFICE_LEVEL_NAME = "Muse HQ — NYC Office";
export const OFFICE_PUBLISHED_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/studio-published/office-world.json`;
/** Walkable interior bounds (half-extents) for the /office player. */
export const OFFICE_BOUNDS = { x: 22.5, z: 14.5 };
/** Places bots stroll to between desk work. */
export const OFFICE_WAYPOINTS: [number, number][] = [[0, 12.8], [-19, -12], [19, 12], [12, -13.5], [-12, 13.5]];

export type OfficeBot = { key: string; name: string; duty: string; model: string; tint: string };
const MODELS = ["Xbot.glb", "Soldier.glb", "RobotExpressive.glb", "CesiumMan.glb", "RiggedFigure.glb"];
const TINTS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];
const ROSTER: [string, string][] = [
  ["Builder", "Builds apps and worlds in Imagine Engine"],
  ["Launcher", "Ships releases and publishes updates"],
  ["Analyst", "Reads data and scores opportunities"],
  ["Ideator", "Drafts concepts and first versions"],
  ["Architect", "Designs systems and integrations"],
  ["Scout", "Finds founders, partners and deals"],
  ["Fundraiser", "Runs investor outreach and follow-ups"],
  ["Researcher", "Deep-dives markets and competitors"],
  ["Outreach", "Writes and sends campaigns"],
  ["Designer", "Creates visuals, decks and pages"],
  ["Engineer", "Fixes bugs and hardens the platform"],
  ["Marketer", "Plans content and growth loops"],
  ["Writer", "Drafts posts, emails and documents"],
  ["Planner", "Schedules, tracks goals and deadlines"],
  ["Operator", "Keeps funnels and dashboards moving"],
  ["Guardian", "Watches quality, safety and access"],
  ["Recruiter", "Sources people and books meetings"],
  ["Legal", "Reviews terms, filings and compliance"],
  ["Finance", "Tracks money, credits and payouts"],
  ["Support", "Answers users and resolves issues"],
];
export const OFFICE_BOTS: OfficeBot[] = ROSTER.map(([name, duty], i) => ({
  key: name.toLowerCase(),
  name,
  duty,
  model: `/models/plaza/${MODELS[i % MODELS.length]}`,
  tint: TINTS[Math.floor(i / MODELS.length) % TINTS.length],
}));

/** 20 desk stations: 4 rows x 5, alternating facing so rows face each other. */
export const OFFICE_DESKS: { x: number; z: number; facing: 1 | -1 }[] = (() => {
  const out: { x: number; z: number; facing: 1 | -1 }[] = [];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) {
    out.push({ x: -16 + col * 8, z: -10.5 + row * 7, facing: row % 2 === 0 ? 1 : -1 });
  }
  return out;
})();

const hex = (h: string, a = 1): [number, number, number, number] => {
  const n = parseInt(h.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a];
};
let n = 0;
const P = (name: string, shape: PrimitiveObject["shape"], position, scale, color: string | [number, number, number, number], extra: Partial<PrimitiveObject> = {}): PrimitiveObject => ({
  id: `office_${++n}`, kind: "primitive", name, shape, position, rotation: [0, 0, 0], scale, visible: true,
  color: Array.isArray(color) ? color : hex(color), metalness: 0, roughness: 0.85, ...extra,
});

export function buildOfficeScene(): LevelScene {
  n = 0;
  const o: PrimitiveObject[] = [];
  const W = 48, D = 32, H = 4.2, T = 0.18;
  // Floor — the simple world slab.
  o.push(P("Office Floor", "box", [0, -0.05, 0], [W, 0.1, D], "#b9bcc0", { roughness: 0.95 }));
  o.push(P("Center Rug", "box", [0, 0.005, 0], [30, 0.02, 20], "#31556e", { roughness: 1 }));
  // Perimeter window walls (NYC high-rise glass) with a door gap on the south side.
  const glass: [number, number, number, number] = [0.62, 0.81, 0.95, 0.3];
  const wallRun = (side: string, len: number, px: number, pz: number, rotY: number, segments: [number, number][]) => {
    for (const [from, to] of segments) {
      const segLen = to - from, mid = (from + to) / 2;
      const mx = px + Math.cos(rotY) * mid, mz = pz - Math.sin(rotY) * mid;
      const sillH = 0.15, headH = 0.45, glassH = H - sillH - headH;
      o.push(P(`Window Wall ${side} Sill`, "box", [mx, sillH / 2, mz], [segLen, sillH, T], "#3a3f46", { rotation: [0, rotY, 0], roughness: 0.6, metalness: 0.4 }));
      o.push(P(`Window Wall ${side} Glass`, "box", [mx, sillH + glassH / 2, mz], [segLen, glassH, T * 0.35], glass, { rotation: [0, rotY, 0], roughness: 0.08, metalness: 0.1 }));
      o.push(P(`Window Wall ${side} Header`, "box", [mx, H - headH / 2, mz], [segLen, headH, T], "#3a3f46", { rotation: [0, rotY, 0], roughness: 0.6, metalness: 0.4 }));
      const nM = Math.max(1, Math.floor(segLen / 3));
      for (let i = 0; i <= nM; i++) {
        const off = from + (segLen / nM) * i;
        o.push(P(`Window Mullion ${side}`, "box", [px + Math.cos(rotY) * off, sillH + glassH / 2, pz - Math.sin(rotY) * off], [0.12, glassH, T * 0.7], "#2c3036", { rotation: [0, rotY, 0], roughness: 0.6, metalness: 0.4 }));
      }
    }
  };
  wallRun("N", W, 0, -D / 2, 0, [[-W / 2, W / 2]]);
  wallRun("S", W, 0, D / 2, 0, [[-W / 2, -1.8], [1.8, W / 2]]); // door gap in the middle
  wallRun("W", D, -W / 2, 0, Math.PI / 2, [[-D / 2, D / 2]]);
  wallRun("E", D, W / 2, 0, Math.PI / 2, [[-D / 2, D / 2]]);
  o.push(P("Entrance Lintel", "box", [0, 3.4, D / 2], [3.6, 1.6, T], "#3a3f46", { roughness: 0.6, metalness: 0.4 }));
  // Whiteboard on the south interior + corner plants.
  o.push(P("Whiteboard", "box", [-10, 1.7, D / 2 - 0.35], [6, 2.2, 0.08], "#f4f7f9", { roughness: 0.35 }));
  o.push(P("Whiteboard Frame", "box", [-10, 1.7, D / 2 - 0.42], [6.3, 2.5, 0.05], "#6b7280", { roughness: 0.6 }));
  for (const [px, pz] of [[-22, -14], [22, -14], [-22, 14], [22, 14]] as const) {
    o.push(P("Plant Pot", "box", [px, 0.3, pz], [0.7, 0.6, 0.7], "#374151"));
    o.push(P("Plant", "cone", [px, 1.15, pz], [1.1, 1.2, 1.1], "#2f7a44", { roughness: 1 }));
  }
  // 20 agent stations: desk, monitor with a glowing dashboard screen, chair, bot.
  OFFICE_DESKS.forEach((d, i) => {
    const k = i + 1, f = d.facing;
    o.push(P(`Agent Desk ${k}`, "box", [d.x, 0.74, d.z], [1.7, 0.06, 0.85], "#8a6642", { roughness: 0.7 }));
    o.push(P(`Agent Desk ${k} Leg L`, "box", [d.x - 0.75, 0.37, d.z], [0.07, 0.74, 0.75], "#5d4630"));
    o.push(P(`Agent Desk ${k} Leg R`, "box", [d.x + 0.75, 0.37, d.z], [0.07, 0.74, 0.75], "#5d4630"));
    o.push(P(`Agent Screen ${k}`, "box", [d.x, 1.18, d.z - f * 0.22], [0.98, 0.58, 0.04], "#101318", { rotation: [f * -0.1, f === 1 ? Math.PI : 0, 0], roughness: 0.3, metalness: 0.3 }));
    o.push(P(`Agent Screen ${k} Glow`, "box", [d.x, 1.18, d.z - f * 0.19], [0.9, 0.5, 0.015], "#1d7f8c", { rotation: [f * -0.1, f === 1 ? Math.PI : 0, 0], roughness: 0.4 }));
    o.push(P(`Agent Screen ${k} Stand`, "box", [d.x, 0.92, d.z - f * 0.22], [0.08, 0.36, 0.08], "#22262c"));
    o.push(P(`Agent Chair ${k}`, "box", [d.x, 0.48, d.z + f * 0.85], [0.55, 0.07, 0.55], "#26303a", { roughness: 0.9 }));
    o.push(P(`Agent Chair ${k} Back`, "box", [d.x, 0.95, d.z + f * 1.08], [0.55, 0.85, 0.07], "#26303a", { roughness: 0.9 }));
  });
  const characters = OFFICE_BOTS.map((b, i) => {
    const d = OFFICE_DESKS[i];
    return {
      id: `office_bot_${b.key}`, kind: "character", name: `Bot — ${b.name}`, url: b.model, source: "Plaza character rigs",
      position: [d.x, 0, d.z + d.facing * 0.85], rotation: [0, d.facing === 1 ? Math.PI : 0, 0], scale: [1, 1, 1], visible: true,
      animationSpeed: 1, paused: false, crossfade: 0.25, playable: false, controlScheme: "both", cameraMode: "third", mobileJoystick: "auto",
    };
  });
  return {
    ...EMPTY_SCENE,
    objects: [...o, ...characters] as any,
    lights: [
      { id: "office_sun", name: "Sun", kind: "directional", position: [18, 26, 12], color: [1, 0.98, 0.92, 1], intensity: 1.5, castShadow: true },
      { id: "office_ambient", name: "Ambient", kind: "ambient", position: [0, 0, 0], color: [1, 1, 1, 1], intensity: 0.65 },
    ],
    environment: {
      ...EMPTY_SCENE.environment,
      background: "#a8c8e8",
      ambient: 0.65,
      gi: { enabled: true, skyColor: "#e8f3ff", groundColor: "#8a8f7a", hemisphereIntensity: 0.5, contactShadows: false, contactOpacity: 0, contactBlur: 2.5 },
    },
  };
}

/** Fetches the scene the live /office world is actually playing (the published JSON). */
export async function fetchPublishedOfficeScene(): Promise<LevelScene | null> {
  try {
    const r = await fetch(`${OFFICE_PUBLISHED_URL}?t=${Date.now()}`, { cache: "no-store" });
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
 * Same rule as the Plaza: the editable Office level always opens on the CURRENT
 * published scene; a divergent local copy is first preserved as a draft level.
 */
export async function syncOfficeLevelToPublished(): Promise<LocalLevelRecord> {
  const publishedScene = await fetchPublishedOfficeScene();
  const existing = listLocalLevels().find((l) => l.name === OFFICE_LEVEL_NAME);
  if (!publishedScene) return existing ?? _ensure(buildOfficeScene, OFFICE_LEVEL_NAME);
  if (!existing) return _ensure(() => publishedScene, OFFICE_LEVEL_NAME);
  if (stableStringify(existing.scene) !== stableStringify(publishedScene)) {
    const backup = createLocalLevel(existing.scene);
    updateLocalLevel(backup.id, {
      name: `${OFFICE_LEVEL_NAME} — local draft ${new Date().toISOString().slice(0, 10)}`,
      description: "Local edits preserved when the Office level was re-synced to the published version",
    });
    updateLocalLevel(existing.id, { scene: JSON.parse(JSON.stringify(publishedScene)) });
  }
  return getLocalLevel(existing.id) ?? existing;
}
