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
/** Places bots stroll to between desk work — all in clear corridors
 * (window rows behind the desk banks, side columns, center aisle ends),
 * so a straight aisle-routed path never crosses a desk. */
export const OFFICE_WAYPOINTS: [number, number][] = [[4, -14], [-20, -13], [20, 13], [12, -14], [-12, 14], [21, 0], [-21, 0], [6, 14]];

/** Scene data version of the built-in office. When the published scene is
 * OLDER than this, /office plays the built-in scene (preserving studio-added
 * characters) until an admin publishes the update from the office itself. */
export const OFFICE_SCENE_VERSION = 3;

export type OfficeBot = { key: string; name: string; duty: string; model: string; tint: string };
/** The agent character body: the founder's OWN uploaded character
 * (site-assets/models/agent.glb), RIGGED on 2026-10-25 — a Mixamo-named
 * skeleton was fitted to the mesh's measured landmarks, the mesh was
 * skinned to it (rigid robot parts, blended at the joints) and Idle /
 * Walking / Sitting / Wave clips were baked in, so her bots sit, type and
 * walk as HER character. Built by /tmp/rig-venv/build_rig.py; the same
 * auto-skeleton now lives in the Rig Room for future characters. The
 * player wears the whitened-texture twin (AGENT_PLAYER_MODEL_URL). The
 * rigged files are hosted in the site-assets bucket next to the original
 * (the code-push route cannot carry 16 MB binaries). */
export const AGENT_MODEL_URL = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/site-assets/models/GeniusAgent.glb";
export const AGENT_PLAYER_MODEL_URL = "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/site-assets/models/GeniusAgentWhite.glb";
const MODELS = [AGENT_MODEL_URL];
const TINTS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];
const ROSTER: [string, string][] = [
  ["Builder", "Builds, writes and ships — pages, plans, code and documents."],
  ["Launcher", "Launches ideas fast — campaigns, pitches and go-to-market."],
  ["Analyst", "Researches and analyzes — markets, data and competitors."],
  ["Ideator", "Quick ideas and snappy answers in seconds."],
  ["Architect", "Designs systems and strategy — deep, structured thinking."],
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
  model: MODELS[i % MODELS.length],
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
  const W = 48, D = 32, H = 8, T = 0.18;
  // Floor — flat white slab (founder directive 2026-10-25), no rug.
  o.push(P("Office Floor", "box", [0, -0.05, 0], [W, 0.1, D], "#ffffff", { roughness: 0.95, metalness: 0 }));
  // The street, ~100 floors down (founder directive 2026-10-25): the city
  // ground sits far below the windows, softened by aerial haze.
  o.push(P("City Ground", "box", [0, -300, 0], [2400, 1, 2400], "#93a8ba", { roughness: 1 }));
  // Perimeter window walls (NYC high-rise glass) with a door gap on the south side.
  const glass: [number, number, number, number] = [0.72, 0.86, 0.97, 0.22];
  const wallRun = (side: string, len: number, px: number, pz: number, rotY: number, segments: [number, number][]) => {
    for (const [from, to] of segments) {
      const segLen = to - from, mid = (from + to) / 2;
      const mx = px + Math.cos(rotY) * mid, mz = pz - Math.sin(rotY) * mid;
      const sillH = 0.15, headH = 0.45, glassH = H - sillH - headH;
      o.push(P(`Window Wall ${side} Sill`, "box", [mx, sillH / 2, mz], [segLen, sillH, T], "#c7d2dc", { rotation: [0, rotY, 0], roughness: 0.45, metalness: 0.35 }));
      o.push(P(`Window Wall ${side} Glass`, "box", [mx, sillH + glassH / 2, mz], [segLen, glassH, T * 0.35], glass, { rotation: [0, rotY, 0], roughness: 0.08, metalness: 0.1 }));
      o.push(P(`Window Wall ${side} Header`, "box", [mx, H - headH / 2, mz], [segLen, headH, T], "#c7d2dc", { rotation: [0, rotY, 0], roughness: 0.45, metalness: 0.35 }));
      const nM = Math.max(1, Math.floor(segLen / 3));
      for (let i = 0; i <= nM; i++) {
        const off = from + (segLen / nM) * i;
        o.push(P(`Window Mullion ${side}`, "box", [px + Math.cos(rotY) * off, sillH + glassH / 2, pz - Math.sin(rotY) * off], [0.12, glassH, T * 0.7], "#aebbc7", { rotation: [0, rotY, 0], roughness: 0.45, metalness: 0.35 }));
      }
    }
  };
  wallRun("N", W, 0, -D / 2, 0, [[-W / 2, W / 2]]);
  wallRun("S", W, 0, D / 2, 0, [[-W / 2, -1.8], [1.8, W / 2]]); // door gap in the middle
  wallRun("W", D, -W / 2, 0, Math.PI / 2, [[-D / 2, D / 2]]);
  wallRun("E", D, W / 2, 0, Math.PI / 2, [[-D / 2, D / 2]]);
  o.push(P("Entrance Lintel", "box", [0, (2.6 + H) / 2, D / 2], [3.6, H - 2.6, T], "#d7dee5", { roughness: 0.5, metalness: 0.3 }));
  // Theater screen — BIG (founder directive 2026-10-25), centered on the
  // north wall; live content is rendered INTO it by /office.
  o.push(P("Theater Screen", "box", [0, 3.55, -15.72], [15.6, 5.9, 0.25], "#05080e", { metalness: 0.4, roughness: 0.35, theater: true } as any));
  o.push(P("Theater Pylon Left", "box", [-8.05, 3.4, -15.72], [0.35, 6.6, 0.35], "#0a0f16"));
  o.push(P("Theater Pylon Right", "box", [8.05, 3.4, -15.72], [0.35, 6.6, 0.35], "#0a0f16"));
  o.push(P("Theater Glow Strip", "box", [0, 0.12, -15.5], [15.6, 0.06, 0.1], "#02161c", { emissive: hex("#00e5ff"), emissiveIntensity: 1.2 } as any));
  // Whiteboard on the south interior + corner plants.
  o.push(P("Whiteboard", "box", [-10, 1.7, D / 2 - 0.35], [6, 2.2, 0.08], "#f7fafc", { roughness: 0.25 }));
  o.push(P("Whiteboard Frame", "box", [-10, 1.7, D / 2 - 0.42], [6.3, 2.5, 0.05], "#b9c6d2", { roughness: 0.6 }));
  for (const [px, pz] of [[-22, -14], [22, -14], [-22, 14], [22, 14]] as const) {
    o.push(P("Plant Pot", "box", [px, 0.3, pz], [0.7, 0.6, 0.7], "#101820"));
    o.push(P("Plant", "cone", [px, 1.15, pz], [1.1, 1.2, 1.1], "#14532d", { roughness: 1 }));
  }
  // Ceiling — a real slab, MUCH higher than the old 4.2m walls (founder
  // directive 2026-10-25) so the follow camera never feels boxed in.
  o.push(P("Ceiling", "box", [0, H + 0.06, 0], [W, 0.12, D], "#eef2f5", { roughness: 0.95, metalness: 0 }));
  // Ceiling light bars + cyan floor glow strips (SFH/Matrix accents).
  for (const lx of [-16, 0, 16]) for (const lz of [-7, 7]) {
    o.push(P("Ceiling Light Bar", "box", [lx, H - 0.06, lz], [5.5, 0.07, 0.45], "#d5dde4", { emissive: hex("#ffffff"), emissiveIntensity: 0.9 } as any));
  }
  o.push(P("Floor Glow N", "box", [0, 0.03, -15.85], [47.5, 0.04, 0.1], "#02141a", { emissive: hex("#00e5ff"), emissiveIntensity: 0.8 } as any));
  o.push(P("Floor Glow S", "box", [0, 0.03, 15.85], [47.5, 0.04, 0.1], "#02141a", { emissive: hex("#00e5ff"), emissiveIntensity: 0.8 } as any));
  o.push(P("Floor Glow W", "box", [-23.85, 0.03, 0], [0.1, 0.04, 31.5], "#02141a", { emissive: hex("#00e5ff"), emissiveIntensity: 0.8 } as any));
  o.push(P("Floor Glow E", "box", [23.85, 0.03, 0], [0.1, 0.04, 31.5], "#02141a", { emissive: hex("#00e5ff"), emissiveIntensity: 0.8 } as any));
  // NYC skyline outside the glass — DAYLIGHT towers (founder directive
  // 2026-10-25): pale glass-and-steel bodies, unlit reflective window panes.
  let seed = 42;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  // FLOOR 100 (founder directive 2026-10-25): every tower stands on the
  // street ~320 m below; only its TOP matters — peer towers end around our
  // floor, a farther ring fades into the haze, clouds drift underneath.
  const tower = (cx: number, cz: number, w: number, top: number, d: number, tone: string, face: "N" | "S" | "E" | "W", windows: boolean) => {
    const base = -320, h = top - base;
    o.push(P("Skyline Tower", "box", [cx, base + h / 2, cz], [w, h, d], tone, { roughness: 0.7, metalness: 0.15 }));
    if (!windows) return;
    const rows = Math.max(2, Math.floor(Math.min(46, h) / 3.1));
    for (let rI = 0; rI < rows; rI++) {
      if (rnd() < 0.55) continue;
      const wy = top - 1.6 - rI * 3.1;
      const off = (rnd() - 0.5) * ((face === "N" || face === "S" ? w : d) - 1.4);
      const pos: [number, number, number] = face === "N" ? [cx + off, wy, cz + d / 2 + 0.04] : face === "S" ? [cx + off, wy, cz - d / 2 - 0.04] : face === "E" ? [cx - w / 2 - 0.04, wy, cz + off] : [cx + w / 2 + 0.04, wy, cz + off];
      const scl: [number, number, number] = face === "N" || face === "S" ? [0.6, 0.12, 0.06] : [0.06, 0.12, 0.6];
      o.push(P("Skyline Window", "box", pos, scl, rnd() < 0.5 ? "#7e97ab" : "#93a9bb", { roughness: 0.35, metalness: 0.2 }));
    }
  };
  // Peer towers — their tops end around our floor (some below, a few above).
  for (let i = 0; i < 8; i++) tower(-32 + i * 9.2, -40, 6 + rnd() * 3, -14 + rnd() * 20, 6 + rnd() * 3, "#b7c9da", "N", true);
  for (let i = 0; i < 7; i++) tower(-29 + i * 9.8, -29, 5 + rnd() * 2.5, -22 + rnd() * 16, 5 + rnd() * 2, "#a5bcd2", "N", true);
  for (let i = 0; i < 6; i++) tower(-28 + i * 11, 33, 6 + rnd() * 2.5, -18 + rnd() * 18, 5.5, "#c9d8e4", "S", true);
  for (let i = 0; i < 6; i++) tower(37, -24 + i * 9.8, 5.5, -20 + rnd() * 19, 5 + rnd() * 2, "#a5bcd2", "E", true);
  for (let i = 0; i < 6; i++) tower(-37, -24 + i * 9.8, 5.5, -24 + rnd() * 18, 5 + rnd() * 2, "#9db4c9", "W", true);
  // Distant ring — hazy silhouettes, no window detail.
  for (let i = 0; i < 9; i++) tower(-120 + i * 30, -120 - rnd() * 40, 14 + rnd() * 10, -48 + rnd() * 30, 14, "#c6d5e2", "N", false);
  for (let i = 0; i < 7; i++) tower(-110 + i * 34, 120 + rnd() * 40, 14 + rnd() * 10, -52 + rnd() * 28, 14, "#cdd9e4", "S", false);
  for (let i = 0; i < 6; i++) tower(130 + rnd() * 40, -90 + i * 32, 14, -50 + rnd() * 30, 14 + rnd() * 8, "#bfcfdd", "E", false);
  for (let i = 0; i < 6; i++) tower(-130 - rnd() * 40, -90 + i * 32, 14, -55 + rnd() * 28, 14 + rnd() * 8, "#c6d5e2", "W", false);
  // Cloud layer drifting below the windows.
  for (let i = 0; i < 7; i++) {
    const cx = -120 + rnd() * 240, cz = -110 + rnd() * 220;
    if (Math.abs(cx) < 34 && Math.abs(cz) < 26) continue;
    o.push(P("Cloud Layer", "box", [cx, -30 - rnd() * 22, cz], [55 + rnd() * 85, 1.4, 36 + rnd() * 44], hex("#ffffff", 0.5), { roughness: 1 }));
  }
  // 20 agent stations: desk, monitor with a glowing dashboard screen, chair, bot.
  OFFICE_DESKS.forEach((d, i) => {
    const k = i + 1, f = d.facing;
    o.push(P(`Agent Desk ${k}`, "box", [d.x, 0.74, d.z], [1.7, 0.06, 0.85], "#0e1626", { roughness: 0.6, metalness: 0.2 }));
    o.push(P(`Agent Desk ${k} Leg L`, "box", [d.x - 0.75, 0.37, d.z], [0.07, 0.74, 0.75], "#070d16"));
    o.push(P(`Agent Desk ${k} Leg R`, "box", [d.x + 0.75, 0.37, d.z], [0.07, 0.74, 0.75], "#070d16"));
    o.push(P(`Agent Screen ${k}`, "box", [d.x, 1.18, d.z - f * 0.22], [0.98, 0.58, 0.04], "#04070c", { rotation: [f * -0.1, f === 1 ? Math.PI : 0, 0], roughness: 0.3, metalness: 0.3 }));
    o.push(P(`Agent Screen ${k} Glow`, "box", [d.x, 1.18, d.z - f * 0.19], [0.9, 0.5, 0.015], "#062a33", { rotation: [f * -0.1, f === 1 ? Math.PI : 0, 0], roughness: 0.4, emissive: hex("#00e5ff"), emissiveIntensity: 1.5 } as any));
    o.push(P(`Agent Screen ${k} Stand`, "box", [d.x, 0.92, d.z - f * 0.22], [0.08, 0.36, 0.08], "#0a1018"));
    o.push(P(`Agent Chair ${k}`, "box", [d.x, 0.48, d.z + f * 0.85], [0.55, 0.07, 0.55], "#0d1622", { roughness: 0.9 }));
    o.push(P(`Agent Chair ${k} Back`, "box", [d.x, 0.95, d.z + f * 1.08], [0.55, 0.85, 0.07], "#0d1622", { roughness: 0.9 }));
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
      { id: "office_sun", name: "Sunlight", kind: "directional", position: [26, 34, 14], color: [1, 0.97, 0.9, 1], intensity: 1.8, castShadow: false },
      { id: "office_ambient", name: "Ambient", kind: "ambient", position: [0, 0, 0], color: [1, 1, 1, 1], intensity: 0.8 },
    ],
    environment: {
      ...EMPTY_SCENE.environment,
      background: "#cfe2ef",
      ambient: 0.8,
      sceneVersion: OFFICE_SCENE_VERSION,
      gi: { enabled: true, skyColor: "#e2eef7", groundColor: "#cfd8de", hemisphereIntensity: 0.8, contactShadows: false, contactOpacity: 0, contactBlur: 2.5 },
    },
  };
}

/**
 * Plays the built-in (code) scene while PRESERVING what the Studio added on
 * top of the published one: published-only objects (extra props, agent
 * characters dropped in the editor) and agent characters are carried over,
 * and the published social/player settings survive. Used when the published
 * scene predates OFFICE_SCENE_VERSION, and as the exact payload the admin
 * "publish the update" button sends — what you see is what gets published.
 */
export function mergeOfficeScenes(codeScene: LevelScene, published: LevelScene | null): LevelScene {
  if (!published) return codeScene;
  const codeById = new Map((codeScene.objects || []).map((o: any) => [o.id, o]));
  const objects: any[] = [...(codeScene.objects || [])];
  for (const o of (published.objects || []) as any[]) {
    const inCode = codeById.get(o.id);
    if (!inCode) { objects.push(o); continue; } // studio addition — keep it
    // An agent character the studio edited (moved / re-bodied) wins over the
    // built-in copy; everything else takes the refreshed built-in version.
    if (o.kind === "character" && o.agentId) {
      const i = objects.findIndex((x: any) => x.id === o.id);
      if (i >= 0) objects[i] = o;
    }
  }
  const merged: any = { ...codeScene, objects };
  const pub: any = published as any;
  if (pub.social) merged.social = pub.social;
  if (pub.playerControllerId) merged.playerControllerId = pub.playerControllerId;
  if (pub.controllers) merged.controllers = pub.controllers;
  return merged as LevelScene;
}

/** Fetches the scene the live /office world is actually playing (the published JSON). */
export async function fetchPublishedOfficeScene(): Promise<LevelScene | null> {
  const m = await fetchPublishedOfficeMeta();
  return m?.scene ?? null;
}

/** Scene + publish timestamp, so the /office player can show exactly which
 *  published version it is playing (and flag the offline fallback copy). */
export async function fetchPublishedOfficeMeta(): Promise<{ scene: LevelScene; publishedAt: string | null } | null> {
  try {
    const r = await fetch(`${OFFICE_PUBLISHED_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return null;
    const d: any = await r.json();
    const scene = d?.scene ?? (d?.objects ? d : null);
    return scene?.objects ? { scene: scene as LevelScene, publishedAt: typeof d?.publishedAt === "string" ? d.publishedAt : null } : null;
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
