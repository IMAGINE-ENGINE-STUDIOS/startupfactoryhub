// @ts-nocheck -- Imagine Studio v2
// Muse HQ — NYC Office: a published world like the Plaza District, built from
// simple geometries (perimeter window walls, 20 desk stations) and populated
// with 20 NPC bots, one per Muse agent. Fully editable in the 3D Studio;
// /office plays the published version and each bot carries a live dashboard.
import { EMPTY_SCENE, type LevelScene, type PrimitiveObject } from "@/imagine-studio/lib/levelTypes";
import { DEFAULT_SKYBOX } from "@/imagine-studio/lib/skyboxes";
import { createLocalLevel, ensurePlazaLevel as _ensure, getLocalLevel, listLocalLevels, normLevelName, preserveLocalDraft, resolveWorldSyncLevel, setBoundWorldKey, updateLocalLevel, type LocalLevelRecord } from "@/imagine-studio/lib/localLevels";

export const OFFICE_LEVEL_NAME = "Startup Office";
/** The office level's name before the founder renamed the world
 * (2026-10-25): the sync renames a local level carrying it in place, so
 * her existing level, binding and drafts survive the rename. */
export const LEGACY_OFFICE_LEVEL_NAME = "Muse HQ — NYC Office";
export const OFFICE_PUBLISHED_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/studio-published/office-world.json`;
/** Public URL of any floor's published scene file in the studio-published
 * bucket. Floors are isolated: a floor only ever fetches its OWN file. */
export const publishedWorldUrl = (file: string): string =>
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/studio-published/${file}`;
/** Walkable interior bounds (half-extents) for the /office player. */
export const OFFICE_BOUNDS = { x: 22.5, z: 14.5 };
/** Places bots stroll to between desk work — all in clear corridors
 * (window rows behind the desk banks, side columns, center aisle ends),
 * so a straight aisle-routed path never crosses a desk. */
export const OFFICE_WAYPOINTS: [number, number][] = [[4, -14], [-20, -13], [20, 13], [12, -14], [-12, 14], [21, 0], [-21, 0], [6, 14]];

/** Scene data version of the built-in office. When the published scene is
 * OLDER than this, /office plays the built-in scene (preserving studio-added
 * characters) until an admin publishes the update from the office itself. */
export const OFFICE_SCENE_VERSION = 11;

/** Scene objects RETIRED by later founder directives, stripped wherever
 * a published scene is consumed (live merge + editor sync), so an old
 * published file can never resurrect them:
 *  - the photo skybox (2026-10-25) retired the background geometry: the
 *    City Ground plate, Skyline towers/windows and Cloud Layer boxes;
 *  - the 10-agent floor limit (2026-10-25, for frame rate) retired the
 *    BENCH: built-in bot characters (`office_bot_<key>`) whose key is no
 *    longer on either floor's roster. Studio-added characters carry
 *    other ids and are never touched. */
const validBotCharIds = (): Set<string> =>
  new Set([...OFFICE_BOTS, ...WONDERLANDS_BOTS].map((b) => `office_bot_${b.key}`).concat("office_bot_manager"));
export const isRetiredBackground = (o: any): boolean =>
  (typeof o?.name === "string" &&
    (o.name === "City Ground" || o.name.startsWith("Skyline Tower") || o.name.startsWith("Skyline Window") || o.name.startsWith("Cloud Layer"))) ||
  (o?.kind === "character" && typeof o?.id === "string" && o.id.startsWith("office_bot_") && !validBotCharIds().has(o.id));
export const stripRetiredBackground = (scene: any): any =>
  scene && Array.isArray(scene.objects) ? { ...scene, objects: scene.objects.filter((o: any) => !isRetiredBackground(o)) } : scene;

export type OfficeBot = { key: string; name: string; duty: string; model: string; tint: string };
/** The agent character body: the founder's OWN uploaded character
 * (site-assets/models/agent.glb), RIGGED on 2026-10-25 — a Mixamo-named
 * skeleton was fitted to the mesh's measured landmarks, the mesh was
 * skinned to it (rigid robot parts, blended at the joints) and Idle /
 * Walking / Sitting / Wave clips were baked in, so her bots sit, type and
 * walk as HER character. Built by /tmp/rig-venv/build_rig.py; the same
 * auto-skeleton now lives in the Rig Room for future characters. The
 * player wears the whitened-texture twin (AGENT_PLAYER_MODEL_URL). The
 * rigged files live in the repo at public/models/plaza (uploaded through
 * the GitHub web UI — the code-push route cannot carry 16 MB binaries)
 * and are served same-origin with the site. Rig v3 (2026-10-25): every
 * connected piece of the mesh is bound rigidly to exactly ONE bone (no
 * blends, so the body can never tear), the head and torso are solid,
 * sitting moves ONLY the legs + hips drop, and typing is a small slow
 * forearm bob applied from a captured base pose — nothing accumulates. */
/* Same-origin hosting (changed 2026-10-25): the Supabase dashboard
 * uploads of the v3 GLBs showed in the Storage listing but never
 * materialized at their public URLs (404 NoSuchKey, verified against
 * the dashboard's own copied URLs), so the models ship with the site
 * itself — public/models/plaza in the repo, served by Cloudflare Pages
 * from the same origin as the app. */
export const AGENT_MODEL_URL = "/models/plaza/GeniusAgent.glb";
export const AGENT_PLAYER_MODEL_URL = "/models/plaza/GeniusAgentWhite.glb";
const MODELS = [AGENT_MODEL_URL];
const TINTS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];
/** The floor's specialists — TEN, by founder directive 2026-10-25: at
 * most 10 agents per floor (plus the Manager, the CEO and the Chairman
 * — 13 characters top) so the room holds its frame rate. These ten are
 * the assembly line the default shift plan runs on. The other ten
 * original roles (Launcher, Ideator, Scout, Fundraiser, Engineer,
 * Operator, Recruiter, Legal, Finance, Support) are BENCHED, not
 * deleted: they can staff a new floor when the CEO opens one, and any
 * of them can be swapped back in here by restoring its ROSTER + TEAM
 * lines. */
const ROSTER: [string, string][] = [
  ["Builder", "Builds, writes and ships — pages, plans, code and documents."],
  ["Analyst", "Researches and analyzes — markets, data and competitors."],
  ["Architect", "Designs systems and strategy — deep, structured thinking."],
  ["Researcher", "Deep-dives markets and competitors"],
  ["Planner", "Schedules, tracks goals and deadlines"],
  ["Designer", "Creates visuals, decks and pages"],
  ["Marketer", "Plans content and growth loops"],
  ["Writer", "Drafts posts, emails and documents"],
  ["Outreach", "Writes and sends campaigns"],
  ["Guardian", "Watches quality, safety and access"],
];
/** The Manager — a 21st character who runs the office (founder directive
 * 2026-10-25): he takes the user's goals, plans the shift, assigns the
 * specialists, and verifies their work (see lib/shiftEngine). He stands at
 * the head of the room in front of the theater screen, facing the team —
 * not a desk bot. Gold tint so he reads as leadership at a glance. */
export const OFFICE_MANAGER: OfficeBot = {
  key: "manager",
  name: "Manager",
  duty: "Runs the office — takes your goals, plans the shift, assigns the specialists and verifies their work.",
  model: AGENT_MODEL_URL,
  tint: "#FFD166",
};
export const MANAGER_HOME: [number, number, number] = [0, 0, -12.6];
export const OFFICE_CHAIRMAN: OfficeBot = {
  key: "chairman",
  name: "Chairman",
  duty: "Runs the entire building — every company, every floor. The CEOs and Managers answer to him.",
  model: AGENT_MODEL_URL,
  tint: "#B8C0CC",
};
export const CHAIRMAN_HOME: [number, number, number] = [4.6, 0, -12.6];
/** The CEO of whichever company owns the floor being viewed. */
export const ceoBot = (company: string): OfficeBot => ({
  key: "ceo",
  name: "CEO",
  duty: `Chief Executive of ${company} — sets the company's direction, directs its Manager, answers to the Chairman.`,
  model: AGENT_MODEL_URL,
  tint: "#7DD3FC",
});
export const CEO_HOME: [number, number, number] = [-4.6, 0, -12.6];

/** Floor 99's cast (founder directive 2026-10-25): Wonderlands World —
 * a real level of the same building, one floor below Floor 100, with its
 * own team and its own Manager. Keys match the shift-team role keys in
 * lib/floors (derived from the name the same way). */
export const FLOOR99_LEVEL_NAME = "Floor 99 — Wonderlands World";
const WONDERLANDS_ROSTER: [string, string][] = [
  ["Concierge", "Runs the Genius concierge — designs pools and outdoor spaces with homeowners, contractors and reps."],
  ["Designer", "Designs pools and outdoor living spaces — Genius is the designer for clients with no design experience."],
  ["Catalog", "Owns the FLIP flipbook catalog — keeps every product page current and shoppable."],
  ["Listings", "Runs the marketplace listings — synced, priced right, and followed up."],
  ["Network", "Builds the contractor and rep network — recruits, onboards and supports partners."],
  ["Socialite", "Runs the Socialite autopilot — Facebook and Instagram posts three times a day from the portfolio."],
  ["Follow-Up", "Owns unified follow-up — every inquiry from every channel answered fast and personally."],
  ["Closer", "Turns designs into signed projects — proposals, quotes and closes."],
  ["Projects", "Coordinates installations — schedules, checklists and handovers."],
  ["Writer", "Writes and archives the company's documents — and compiles this floor's shift report."],
];
const WONDERLANDS_TINTS = ["#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#14b8a6", "#eab308"];
export const WONDERLANDS_BOTS: OfficeBot[] = WONDERLANDS_ROSTER.map(([name, duty], i) => ({
  key: name.toLowerCase().replace(/[^a-z0-9]+/g, ""),
  name,
  duty,
  model: AGENT_MODEL_URL,
  tint: WONDERLANDS_TINTS[i % WONDERLANDS_TINTS.length],
}));

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
  // No built city outside the glass anymore (founder directive
  // 2026-10-25): the background buildings and ground geometry are erased
  // and a real-life photo skybox wraps the room instead (scene.skybox,
  // NYC by default — admins swap the city from edit mode).
  // Perimeter window walls (NYC high-rise glass) — all four sides run
  // continuous, no entrance bay (founder directive 2026-10-26: "I don't
  // want no entrance bay — frame the window as the rest").
  const glass: [number, number, number, number] = [0.72, 0.86, 0.97, 0.22];
  const wallRun = (side: string, len: number, px: number, pz: number, rotY: number, segments: [number, number][]) => {
    for (const [from, to] of segments) {
      const segLen = to - from, mid = (from + to) / 2;
      const mx = px + Math.cos(rotY) * mid, mz = pz - Math.sin(rotY) * mid;
      const sillH = 0.15, headH = 0.45, glassH = H - sillH - headH;
      // FUSED FRAME (founder directive 2026-10-26): sill, header and all
      // mullions are ONE solid object (shape "framegrid" — the renderer
      // merges the parts into a single geometry), not ~20 pieces.
      o.push(P(`Window Frame ${side}`, "framegrid" as any, [mx, H / 2, mz], [segLen, H, T], "#bfcbd6", { rotation: [0, rotY, 0], roughness: 0.45, metalness: 0.35 }));
      o.push(P(`Window Wall ${side} Glass`, "box", [mx, sillH + glassH / 2, mz], [segLen, glassH, T * 0.35], glass, { rotation: [0, rotY, 0], roughness: 0.08, metalness: 0.1 }));
    }
  };
  wallRun("N", W, 0, -D / 2, 0, [[-W / 2, W / 2]]);
  wallRun("S", W, 0, D / 2, 0, [[-W / 2, W / 2]]);
  wallRun("W", D, -W / 2, 0, Math.PI / 2, [[-D / 2, D / 2]]);
  wallRun("E", D, W / 2, 0, Math.PI / 2, [[-D / 2, D / 2]]);
  // Theater screen — BIG (founder directive 2026-10-25), centered on the
  // north wall; live content is rendered INTO it by /office.
  o.push(P("Theater Screen", "box", [0, 3.55, -15.72], [15.6, 5.9, 0.25], "#05080e", { metalness: 0.4, roughness: 0.35, theater: true } as any));
  o.push(P("Theater Pylon Left", "box", [-8.05, 3.4, -15.72], [0.35, 6.6, 0.35], "#0a0f16"));
  o.push(P("Theater Pylon Right", "box", [8.05, 3.4, -15.72], [0.35, 6.6, 0.35], "#0a0f16"));
  o.push(P("Theater Glow Strip", "box", [0, 0.12, -15.5], [15.6, 0.06, 0.1], "#02161c", { emissive: hex("#00e5ff"), emissiveIntensity: 1.2 } as any));
  // The whiteboard + frame were two stray white panels against the glass
  // — hidden (founder directive 2026-10-25); kept invisible so scene
  // object ids stay stable for published-scene merges.
  o.push(P("Whiteboard", "box", [-10, 1.7, D / 2 - 0.35], [6, 2.2, 0.08], "#f7fafc", { roughness: 0.25, visible: false }));
  o.push(P("Whiteboard Frame", "box", [-10, 1.7, D / 2 - 0.42], [6.3, 2.5, 0.05], "#b9c6d2", { roughness: 0.6, visible: false }));
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
  // 20 agent stations — desk, screen and chair FUSED into ONE object
  // each (founder directive 2026-10-26): an "assembly" whose parts are
  // merged into a single geometry with per-part materials. The chair is
  // built for THIS character (directive 2026-10-25): a wide seat the
  // belly rests on (top at 0.56 — OfficePage derives seatY from the
  // station), pedestal + base visible under the body, and the back is
  // ATTACHED (founder fix 2026-10-26): its front face sits flush with
  // the seat's rear edge and it runs from y 0.30 to 1.54, one solid
  // panel with the seat — close enough to read as one chair, far
  // enough (rear edge 1.375) that the body never swallows it.
  const part = (shape: string, position: number[], scale: number[], colorHex: string, extra: any = {}) => ({
    shape, position, scale, rotation: extra.rotation ?? [0, 0, 0], color: hex(colorHex),
    roughness: extra.roughness, metalness: extra.metalness,
    ...(extra.emissive ? { emissive: hex(extra.emissive), emissiveIntensity: extra.emissiveIntensity ?? 1 } : {}),
  });
  OFFICE_DESKS.forEach((d, i) => {
    const k = i + 1;
    o.push(P(`Agent Station ${k}`, "assembly" as any, [d.x, 0, d.z], [1, 1, 1], "#0e1626", {
      rotation: [0, d.facing === 1 ? 0 : Math.PI, 0],
      parts: [
        part("box", [0, 0.74, 0], [1.7, 0.06, 0.85], "#0e1626", { roughness: 0.6, metalness: 0.2 }),
        part("box", [-0.75, 0.37, 0], [0.07, 0.74, 0.75], "#070d16"),
        part("box", [0.75, 0.37, 0], [0.07, 0.74, 0.75], "#070d16"),
        part("box", [0, 1.18, -0.22], [0.98, 0.58, 0.04], "#04070c", { rotation: [-0.1, 0, 0], roughness: 0.3, metalness: 0.3 }),
        part("box", [0, 1.18, -0.19], [0.9, 0.5, 0.015], "#062a33", { rotation: [-0.1, 0, 0], roughness: 0.4, emissive: "#00e5ff", emissiveIntensity: 1.5 }),
        part("box", [0, 0.92, -0.22], [0.08, 0.36, 0.08], "#0a1018"),
        part("box", [0, 0.52, 0.85], [1.05, 0.08, 1.05], "#111c2c", { roughness: 0.9 }),
        part("box", [0, 0.24, 0.85], [0.46, 0.48, 0.46], "#0d1622", { roughness: 0.9 }),
        part("box", [0, 0.025, 0.85], [0.84, 0.05, 0.84], "#0d1622", { roughness: 0.9 }),
        part("box", [0, 0.92, 1.42], [0.98, 1.24, 0.09], "#0d1622", { roughness: 0.9 }),
      ],
    } as any));
  });
  // (The old entrance glazing went here — removed with the bay itself,
  // founder directive 2026-10-26; the south wall above now runs framed
  // and glazed end to end like the other three sides.)
  const characters = OFFICE_BOTS.map((b, i) => {
    const d = OFFICE_DESKS[i];
    return {
      id: `office_bot_${b.key}`, kind: "character", name: `Bot — ${b.name}`, url: b.model, source: "Plaza character rigs",
      position: [d.x, 0, d.z + d.facing * 0.85], rotation: [0, d.facing === 1 ? Math.PI : 0, 0], scale: [1, 1, 1], visible: true,
      animationSpeed: 1, paused: false, crossfade: 0.25, playable: false, controlScheme: "both", cameraMode: "third", mobileJoystick: "auto",
    };
  });
  const managerChar = {
    id: "office_bot_manager", kind: "character", name: "Bot — Manager", url: AGENT_MODEL_URL, source: "Plaza character rigs",
    position: MANAGER_HOME, rotation: [0, 0, 0], scale: [1, 1, 1], visible: true,
    animationSpeed: 1, paused: false, crossfade: 0.25, playable: false, controlScheme: "both", cameraMode: "third", mobileJoystick: "auto",
  };
  return {
    ...EMPTY_SCENE,
    skybox: { ...DEFAULT_SKYBOX },
    objects: [...o, ...characters, managerChar] as any,
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
    // Retired built-ins never come back: the erased background geometry,
    // and any `office_<n>` object the code no longer builds (its id
    // range is code-owned; studio additions carry editor-minted ids).
    if (isRetiredBackground(o)) continue;
    const inCode = codeById.get(o.id);
    if (!inCode && /^office_\d+$/.test(String(o.id))) continue;
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
export async function fetchPublishedOfficeMeta(url: string = OFFICE_PUBLISHED_URL): Promise<{ scene: LevelScene; publishedAt: string | null } | null> {
  try {
    const r = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
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
/** The office room populated with a given cast: the same room every
 * floor of the building shares, with that floor's own characters at the
 * desks and its Manager at the head of the room. An empty cast is a
 * brand-new department floor — the room and its Manager, ready for the
 * Manager to recruit the team (recruits live in the floor's own records,
 * not in this scene). */
export function buildSceneWithCast(cast: OfficeBot[]): LevelScene {
  const base = buildOfficeScene();
  const objects = (base.objects as any[]).filter((o) => o.kind !== "character");
  const characters = cast.map((b, i) => {
    const d = OFFICE_DESKS[i % OFFICE_DESKS.length];
    return {
      id: `office_bot_${b.key}`, kind: "character", name: `Bot — ${b.name}`, url: b.model, source: "Plaza character rigs",
      position: [d.x, 0, d.z + d.facing * 0.85], rotation: [0, d.facing === 1 ? Math.PI : 0, 0], scale: [1, 1, 1], visible: true,
      animationSpeed: 1, paused: false, crossfade: 0.25, playable: false, controlScheme: "both", cameraMode: "third", mobileJoystick: "auto",
    };
  });
  const managerChar = {
    id: "office_bot_manager", kind: "character", name: "Bot — Manager", url: AGENT_MODEL_URL, source: "Plaza character rigs",
    position: MANAGER_HOME, rotation: [0, 0, 0], scale: [1, 1, 1], visible: true,
    animationSpeed: 1, paused: false, crossfade: 0.25, playable: false, controlScheme: "both", cameraMode: "third", mobileJoystick: "auto",
  };
  return { ...base, objects: [...objects, ...characters, managerChar] as any } as LevelScene;
}

/** A new floor's starting scene: the room and its Manager only. */
export const buildBareFloorScene = (): LevelScene => buildSceneWithCast([]);

/** Floor 99's built-in scene: the same room one story BELOW Floor 100,
 * populated with the Wonderlands cast and its Manager. It inherits
 * Floor 100's photo skybox until an admin gives the floor its own city
 * from edit mode (the choice lives on the scene and publishes with it). */
export const buildFloor99Scene = (): LevelScene => buildSceneWithCast(WONDERLANDS_BOTS);

/** Fetches Floor 99's OWN published scene (floor99-world.json) — never
 * Floor 100's file. Null until an admin first publishes the floor. */
export async function fetchPublishedFloor99Scene(): Promise<LevelScene | null> {
  const m = await fetchPublishedOfficeMeta(publishedWorldUrl("floor99-world.json"));
  return m?.scene ?? null;
}

/** The editable Floor 99 level always opens on its CURRENT published
 * scene; a divergent local copy is first preserved as a draft level.
 * Same rule as Floor 100 and the Plaza. */
export async function syncFloor99LevelToPublished(): Promise<LocalLevelRecord> {
  const rawPublished99 = stripRetiredBackground(await fetchPublishedFloor99Scene());
  const publishedScene = rawPublished99 && (((rawPublished99 as any)?.environment?.sceneVersion ?? 1) < OFFICE_SCENE_VERSION)
    ? mergeOfficeScenes(buildFloor99Scene(), rawPublished99)
    : rawPublished99;
  // Binding-first identity (founder segregation rule 2026-10-25): the
  // level pinned to "office99" is Floor 99 whatever it is named; a level
  // bound to Floor 100 or the Plaza is never eligible here.
  let existing = resolveWorldSyncLevel("office99", FLOOR99_LEVEL_NAME);
  if (!existing) {
    existing = _ensure(publishedScene ? () => publishedScene : buildFloor99Scene, FLOOR99_LEVEL_NAME);
    setBoundWorldKey(existing.id, "office99");
    return getLocalLevel(existing.id) ?? existing;
  }
  setBoundWorldKey(existing.id, "office99");
  if (!publishedScene) return existing;
  if (stableStringify(existing.scene) !== stableStringify(publishedScene)) {
    preserveLocalDraft(existing, FLOOR99_LEVEL_NAME, "Local edits preserved when the Floor 99 level was re-synced to the published version");
    updateLocalLevel(existing.id, { scene: JSON.parse(JSON.stringify(publishedScene)) });
  }
  return getLocalLevel(existing.id) ?? existing;
}

/** The BUILDING PLAZA — the ground level of the Startup Office
 * building (founder directive 2026-10-26): a level of the building
 * just like /plaza is a world, holding the plaza scenario (stone
 * paving, the podium the tower stands on, fountain, planters, benches,
 * lamps) PLUS the same theater screen the office floors have. No
 * voting booth, no fake chairs — her words. The podium top sits at
 * local y=8 so in the stacked building view it meets Floor 1's slab
 * exactly, and the tower rises out of it. */
export const BUILDING_PLAZA_LEVEL_NAME = "Building Plaza";

export function buildBuildingPlazaScene(): LevelScene {
  n = 0;
  const o: PrimitiveObject[] = [];
  // FORMAL GARDEN (founder redesign 2026-10-26, from her reference photo):
  // symmetric parterres, manicured hedges, tree allées, stone terraces and
  // a tiered fountain on the main axis. No crude stand-ins — every element
  // is proportioned, trimmed and mirrored.
  const LAWN = "#47763a", LAWN_DEEP = "#3c6a32", HEDGE = "#2d5a2c", TOPIARY = "#356b35";
  const STONE = "#d8cfbc", TRAV = "#c9bb9e", WHITE = "#ece7db", GRAVEL = "#e6dfcd", WATER = "#79a8a4";
  // Ground: a full lawn carpet; the stone terrace sits on it.
  o.push(P("Garden Lawn", "box", [0, -0.55, 0], [190, 1.1, 130], LAWN_DEEP, { roughness: 1 }));
  o.push(P("Stone Terrace", "box", [0, 0.07, 6], [124, 0.14, 92], TRAV, { roughness: 0.95 }));
  o.push(P("Terrace Inlay", "box", [0, 0.15, 6], [116, 0.04, 84], STONE, { roughness: 0.9 }));
  // The tower's base is the LOBBY floor now (founder directive
  // 2026-10-26): the old podium box is erased — the double-height
  // lobby level sits here in the stacked building, its opened glass
  // doors facing this garden.
  // THE FOUNTAIN — tiered, centered on the main axis south of the tower.
  const FZ = 38;
  o.push(P("Fountain Basin", "cylinder", [0, 0.5, FZ], [23, 1, 23], WHITE, { roughness: 0.7 }));
  o.push(P("Fountain Rim", "torus", [0, 1.05, FZ], [22.4, 2.2, 22.4], STONE, { roughness: 0.7, rotation: [Math.PI / 2, 0, 0] } as any));
  o.push(P("Fountain Water", "cylinder", [0, 0.92, FZ], [20.4, 0.2, 20.4], WATER, { roughness: 0.12, metalness: 0.15 }));
  o.push(P("Fountain Pedestal", "cylinder", [0, 1.5, FZ], [2.2, 1.6, 2.2], WHITE, { roughness: 0.7 }));
  o.push(P("Fountain Tier", "cylinder", [0, 2.5, FZ], [9, 0.5, 9], WHITE, { roughness: 0.7 }));
  o.push(P("Fountain Tier Water", "cylinder", [0, 2.78, FZ], [8.2, 0.14, 8.2], WATER, { roughness: 0.12, metalness: 0.15 }));
  o.push(P("Fountain Column", "cylinder", [0, 3.3, FZ], [1.1, 1.4, 1.1], WHITE, { roughness: 0.7 }));
  o.push(P("Fountain Crown", "cylinder", [0, 4.15, FZ], [4.4, 0.4, 4.4], WHITE, { roughness: 0.7 }));
  o.push(P("Fountain Finial", "sphere", [0, 4.85, FZ], [1.15, 1.15, 1.15], STONE, { roughness: 0.6 }));
  for (const a of [45, 135, 225, 315]) {
    const r = 11.2, x = Math.cos(a * Math.PI / 180) * r, z = FZ + Math.sin(a * Math.PI / 180) * r;
    o.push(P("Fountain Orb", "sphere", [x, 1.35, z], [0.8, 0.8, 0.8], STONE, { roughness: 0.6 }));
  }
  // PARTERRE QUADRANTS — four mirrored formal beds: hedge frames, gravel
  // hearts, inner hedge crosses and a topiary at the center of each.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = sx * 40, cz = 6 + sz * 33;
    o.push(P("Parterre Lawn", "box", [cx, 0.1, cz], [44, 0.2, 30], LAWN, { roughness: 1 }));
    o.push(P("Parterre Gravel", "box", [cx, 0.16, cz], [36, 0.1, 22], GRAVEL, { roughness: 1 }));
    for (const hx of [-21.2, 21.2]) o.push(P("Parterre Hedge", "box", [cx + hx, 0.55, cz], [1.6, 0.9, 30], HEDGE, { roughness: 1 }));
    for (const hz of [-14, 14]) o.push(P("Parterre Hedge", "box", [cx, 0.55, cz + hz], [44, 0.9, 1.6], HEDGE, { roughness: 1 }));
    o.push(P("Parterre Cross", "box", [cx, 0.5, cz], [34, 0.7, 1.3], HEDGE, { roughness: 1 }));
    o.push(P("Parterre Cross", "box", [cx, 0.5, cz], [1.3, 0.7, 20], HEDGE, { roughness: 1 }));
    o.push(P("Topiary Cone", "cone", [cx, 2.2, cz], [3.4, 3.6, 3.4], TOPIARY, { roughness: 1 }));
    o.push(P("Topiary Pot", "cylinder", [cx, 0.45, cz], [2, 0.9, 2], "#7d6f57", { roughness: 1 }));
    for (const ox of [-20.5, 20.5]) for (const oz of [-13.5, 13.5])
      o.push(P("Topiary Ball", "sphere", [cx + ox * 0.92, 1.15, cz + oz * 0.92], [1.7, 1.7, 1.7], TOPIARY, { roughness: 1 }));
  }
  // TREE ALLÉES — shaped double-crown trees lining the main axis.
  for (const sx of [-1, 1]) for (const tz of [-46, -30, 22, 54]) {
    const x = sx * 15.5, z = tz === 22 || tz === 54 ? tz : tz;
    o.push(P("Allée Trunk", "cylinder", [x, 1.1, z], [0.5, 2.2, 0.5], "#5a4632", { roughness: 1 }));
    o.push(P("Allée Crown", "sphere", [x, 3.6, z], [4.4, 4.8, 4.4], TOPIARY, { roughness: 1 }));
    o.push(P("Allée Crown Top", "sphere", [x, 5.3, z], [3, 3, 3], HEDGE, { roughness: 1 }));
  }
  // Long manicured hedge walls closing the garden's north and south edges.
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
    o.push(P("Garden Hedge Wall", "box", [sx * 40, 0.85, 6 + sz * 51], [72, 1.7, 2.6], HEDGE, { roughness: 1 }));
    o.push(P("Hedge Ball", "sphere", [sx * 76, 1.5, 6 + sz * 51], [2.6, 2.6, 2.6], TOPIARY, { roughness: 1 }));
  }
  // LAMPS — black posts, warm globes, in pairs along the axis.
  for (const sx of [-1, 1]) for (const lz of [-38, -14, 12, 56]) {
    o.push(P("Lamp Post", "cylinder", [sx * 13, 2.1, lz], [0.2, 4.2, 0.2], "#232a32", { roughness: 0.5, metalness: 0.6 }));
    o.push(P("Lamp Globe", "sphere", [sx * 13, 4.5, lz], [0.95, 0.95, 0.95], "#ffe9b0", { roughness: 0.35, emissive: "#ffca66", emissiveIntensity: 0.55 } as any));
  }
  // STONE BENCHES facing the fountain.
  for (const sx of [-1, 1]) for (const bz of [24, 52]) {
    o.push(P("Bench Seat", "box", [sx * 17, 0.62, bz], [5, 0.3, 1.4], WHITE, { roughness: 0.8 }));
    o.push(P("Bench Leg", "box", [sx * 17 - 1.8, 0.25, bz], [0.5, 0.5, 1.2], STONE, { roughness: 0.85 }));
    o.push(P("Bench Leg", "box", [sx * 17 + 1.8, 0.25, bz], [0.5, 0.5, 1.2], STONE, { roughness: 0.85 }));
  }
  // THE THEATER SCREEN — the same one as the office floors, standing at
  // the garden's north end facing the tower, hedges flanking it.
  o.push(P("Theater Screen", "box", [0, 3.55, -46], [15.6, 5.9, 0.25], "#05080e", { metalness: 0.4, roughness: 0.35, theater: true } as any));
  o.push(P("Theater Pylon Left", "box", [-8.05, 3.4, -46], [0.35, 6.6, 0.35], "#0a0f16"));
  o.push(P("Theater Pylon Right", "box", [8.05, 3.4, -46], [0.35, 6.6, 0.35], "#0a0f16"));
  for (const sx of [-1, 1]) o.push(P("Screen Hedge", "box", [sx * 11.5, 1.1, -46], [4.5, 2.2, 1.8], HEDGE, { roughness: 1 }));
  return {
    ...EMPTY_SCENE,
    skybox: { ...DEFAULT_SKYBOX },
    objects: o as any,
    lights: [
      { id: "plaza_sun", name: "Sunlight", kind: "directional", position: [26, 34, 14], color: [1, 0.97, 0.9, 1], intensity: 1.8, castShadow: false },
      { id: "plaza_ambient", name: "Ambient", kind: "ambient", position: [0, 0, 0], color: [1, 1, 1, 1], intensity: 0.8 },
    ],
    environment: {
      ...EMPTY_SCENE.environment,
      background: "#cfe2ef",
      ambient: 0.8,
      gi: { enabled: true, skyColor: "#e2eef7", groundColor: "#cfd8de", hemisphereIntensity: 0.8, contactShadows: false, contactOpacity: 0, contactBlur: 2.5 },
    },
  };
}

/** The Building Plaza's OWN published scene (building-plaza.json).
 * Null until an admin first publishes the level. */
export async function fetchPublishedBuildingPlazaScene(): Promise<LevelScene | null> {
  const m = await fetchPublishedOfficeMeta(publishedWorldUrl("building-plaza.json"));
  return m?.scene ?? null;
}

/** The editable Building Plaza level always opens on its CURRENT
 * published scene; a divergent local copy is first preserved as a
 * draft level. Same rule as Floors 100 and 99. */
export async function syncBuildingPlazaLevelToPublished(): Promise<LocalLevelRecord> {
  const publishedScene = stripRetiredBackground(await fetchPublishedBuildingPlazaScene());
  let existing = resolveWorldSyncLevel("officeplaza", BUILDING_PLAZA_LEVEL_NAME);
  if (!existing) {
    existing = _ensure(publishedScene ? () => publishedScene : buildBuildingPlazaScene, BUILDING_PLAZA_LEVEL_NAME);
    setBoundWorldKey(existing.id, "officeplaza");
    return getLocalLevel(existing.id) ?? existing;
  }
  setBoundWorldKey(existing.id, "officeplaza");
  if (!publishedScene) return existing;
  if (stableStringify(existing.scene) !== stableStringify(publishedScene)) {
    preserveLocalDraft(existing, BUILDING_PLAZA_LEVEL_NAME, "Local edits preserved when the Building Plaza level was re-synced to the published version");
    updateLocalLevel(existing.id, { scene: JSON.parse(JSON.stringify(publishedScene)) });
  }
  return getLocalLevel(existing.id) ?? existing;
}

/** A department floor's editable level, same published-mirror rule as
 * every named level: it opens on its published scene when one exists,
 * and otherwise seeds from the bare room (Manager only) until the
 * floor's team exists in the floor's own records. */
export async function syncDynamicFloorLevel(levelName: string, file: string): Promise<LocalLevelRecord> {
  const m = await fetchPublishedOfficeMeta(publishedWorldUrl(file));
  const publishedScene = stripRetiredBackground(m?.scene ?? null);
  const key = `floor${file.match(/^floor(\d+)-world\.json$/)?.[1] ?? ""}`;
  let existing = resolveWorldSyncLevel(key, levelName);
  if (!existing) {
    existing = _ensure(publishedScene ? () => publishedScene : buildBareFloorScene, levelName);
    setBoundWorldKey(existing.id, key);
    return getLocalLevel(existing.id) ?? existing;
  }
  setBoundWorldKey(existing.id, key);
  if (!publishedScene) return existing;
  if (stableStringify(existing.scene) !== stableStringify(publishedScene)) {
    preserveLocalDraft(existing, levelName, "Local edits preserved when the floor level was re-synced to the published version");
    updateLocalLevel(existing.id, { scene: JSON.parse(JSON.stringify(publishedScene)) });
  }
  return getLocalLevel(existing.id) ?? existing;
}

export async function syncOfficeLevelToPublished(): Promise<LocalLevelRecord> {
  const rawPublished = stripRetiredBackground(await fetchPublishedOfficeScene());
  const publishedScene = rawPublished && (((rawPublished as any)?.environment?.sceneVersion ?? 1) < OFFICE_SCENE_VERSION)
    ? mergeOfficeScenes(buildOfficeScene(), rawPublished)
    : rawPublished;
  // Binding-first identity (founder segregation rule 2026-10-25): the
  // level pinned to "office" is Floor 100 whatever it is named; a level
  // bound to the Plaza or Floor 99 is never eligible here.
  let existing = resolveWorldSyncLevel("office", OFFICE_LEVEL_NAME, [LEGACY_OFFICE_LEVEL_NAME]);
  if (existing && normLevelName(existing.name) === normLevelName(LEGACY_OFFICE_LEVEL_NAME)) {
    // Rename migration: a level still carrying the old "Muse HQ" name IS
    // this level — rename it in place instead of seeding a duplicate.
    // (Only the legacy name is migrated; a user's own rename is kept —
    // the binding, not the name, is the level's identity.)
    updateLocalLevel(existing.id, { name: OFFICE_LEVEL_NAME });
    existing = getLocalLevel(existing.id) ?? existing;
  }
  if (!existing) {
    existing = _ensure(publishedScene ? () => publishedScene : buildOfficeScene, OFFICE_LEVEL_NAME);
    setBoundWorldKey(existing.id, "office");
    return getLocalLevel(existing.id) ?? existing;
  }
  setBoundWorldKey(existing.id, "office");
  if (!publishedScene) return existing;
  if (stableStringify(existing.scene) !== stableStringify(publishedScene)) {
    preserveLocalDraft(existing, OFFICE_LEVEL_NAME, "Local edits preserved when the Office level was re-synced to the published version");
    updateLocalLevel(existing.id, { scene: JSON.parse(JSON.stringify(publishedScene)) });
  }
  return getLocalLevel(existing.id) ?? existing;
}

/* ------------------------------------------------------------------ */
/* THE LOBBY — Floor 1 (founder directive 2026-10-26)                   */
/* ------------------------------------------------------------------ */

export const LOBBY_LEVEL_NAME = "Lobby — Ground Floor";

/** The building's ground floor: a room like Floor 100 but DOUBLE
 * height (16 m), EMPTY (no desks — the founder designs it later), with
 * opened glass doors on the garden side so users come in and out, and
 * an elevator in the middle that takes users to the other floors. */
export function buildLobbyScene(): LevelScene {
  n = 0;
  const o: PrimitiveObject[] = [];
  const W = 48, D = 32, H = 16, T = 0.18;
  const glass: [number, number, number, number] = [0.72, 0.86, 0.97, 0.22];
  // Floor — pale stone like the plaza terrace; ceiling slab at 16.
  o.push(P("Lobby Floor", "box", [0, -0.05, 0], [W, 0.1, D], "#d8cfbc", { roughness: 0.9, metalness: 0 }));
  o.push(P("Lobby Ceiling", "box", [0, H + 0.06, 0], [W, 0.12, D], "#eef2f5", { roughness: 0.95, metalness: 0 }));
  for (const lx of [-16, 0, 16]) for (const lz of [-7, 7]) {
    o.push(P("Ceiling Light Bar", "box", [lx, H - 0.06, lz], [5.5, 0.07, 0.45], "#d5dde4", { emissive: hex("#ffffff"), emissiveIntensity: 0.9 } as any));
  }
  // Full walls (fused frames + glass) on N, W, E — double height.
  const wall = (side: string, len: number, px: number, pz: number, rotY: number, from: number, to: number) => {
    const segLen = to - from, mid = (from + to) / 2;
    const mx = px + Math.cos(rotY) * mid, mz = pz - Math.sin(rotY) * mid;
    const sillH = 0.3, headH = 0.9, glassH = H - sillH - headH;
    o.push(P(`Window Frame ${side}`, "framegrid" as any, [mx, H / 2, mz], [segLen, H, T], "#bfcbd6", { rotation: [0, rotY, 0], roughness: 0.45, metalness: 0.35 }));
    o.push(P(`Window Wall ${side} Glass`, "box", [mx, sillH + glassH / 2, mz], [segLen, glassH, T * 0.35], glass, { rotation: [0, rotY, 0], roughness: 0.08, metalness: 0.1 }));
  };
  wall("N", W, 0, -D / 2, 0, -W / 2, W / 2);
  wall("W", D, -W / 2, 0, Math.PI / 2, -D / 2, D / 2);
  wall("E", D, W / 2, 0, Math.PI / 2, -D / 2, D / 2);
  // SOUTH wall: two runs with a 7 m doorway between them, a lintel over
  // the opening, and the two GLASS DOORS OPEN into the room.
  wall("S", W, 0, D / 2, 0, -W / 2, -3.5);
  wall("S", W, 0, D / 2, 0, 3.5, W / 2);
  o.push(P("Door Lintel", "box", [0, H - 0.45, D / 2], [7.2, 0.9, T], "#bfcbd6", { roughness: 0.45, metalness: 0.35 }));
  o.push(P("Glass Door Left", "box", [-4.7, 3, 14.1], [3.4, 6, 0.06], glass, { rotation: [0, 1.85, 0], roughness: 0.08, metalness: 0.1 }));
  o.push(P("Glass Door Right", "box", [4.7, 3, 14.1], [3.4, 6, 0.06], glass, { rotation: [0, -1.85, 0], roughness: 0.08, metalness: 0.1 }));
  o.push(P("Door Handle Left", "box", [-3.6, 1.6, 13.2], [0.07, 0.9, 0.07], "#8b98a5", { metalness: 0.7, roughness: 0.3 }));
  o.push(P("Door Handle Right", "box", [3.6, 1.6, 13.2], [0.07, 0.9, 0.07], "#8b98a5", { metalness: 0.7, roughness: 0.3 }));
  // THE ELEVATOR — a glass shaft in the middle of the room, cabin at
  // rest with its doors parted, indicator glowing above them.
  o.push(P("Elevator Shaft Cap", "box", [0, H - 0.25, 0], [5.6, 0.5, 5.6], "#2b3644", { roughness: 0.5, metalness: 0.4 }));
  for (const cx of [-2.6, 2.6]) for (const cz of [-2.6, 2.6]) {
    o.push(P("Elevator Shaft Column", "box", [cx, H / 2, cz], [0.35, H, 0.35], "#2b3644", { roughness: 0.5, metalness: 0.4 }));
  }
  for (const [px, pz, rotY, len] of [[0, -2.6, 0, 5.2], [-2.6, 0, Math.PI / 2, 5.2], [2.6, 0, Math.PI / 2, 5.2]] as [number, number, number, number][]) {
    o.push(P("Elevator Shaft Glass", "box", [px, H / 2, pz], [len, H - 1, 0.06], glass, { rotation: [0, rotY, 0], roughness: 0.08, metalness: 0.1 }));
  }
  // South shaft face is the cabin front: frame + parted cabin doors.
  o.push(P("Elevator Front Frame", "box", [0, H / 2, 2.6], [5.2, H - 1, 0.12], "#39434f", { roughness: 0.5, metalness: 0.4 }));
  o.push(P("Elevator Cabin", "box", [0, 1.5, 0.4], [3.8, 3, 3.6], "#1c2634", { roughness: 0.4, metalness: 0.5 }));
  o.push(P("Elevator Door Left", "box", [-1.15, 1.5, 2.28], [0.85, 3, 0.08], "#aeb9c4", { metalness: 0.7, roughness: 0.25 }));
  o.push(P("Elevator Door Right", "box", [1.15, 1.5, 2.28], [0.85, 3, 0.08], "#aeb9c4", { metalness: 0.7, roughness: 0.25 }));
  o.push(P("Elevator Indicator", "box", [0, 3.35, 2.68], [1.3, 0.28, 0.06], "#02161c", { emissive: hex("#00e5ff"), emissiveIntensity: 1.4 } as any));
  return {
    ...EMPTY_SCENE,
    skybox: { ...DEFAULT_SKYBOX },
    objects: o as any,
    lights: [
      { id: "lobby_sun", name: "Sunlight", kind: "directional", position: [26, 40, 14], color: [1, 0.97, 0.9, 1], intensity: 1.8, castShadow: false },
      { id: "lobby_ambient", name: "Ambient", kind: "ambient", position: [0, 0, 0], color: [1, 1, 1, 1], intensity: 0.85 },
    ],
    environment: {
      ...EMPTY_SCENE.environment,
      background: "#cfe2ef",
      ambient: 0.85,
      sceneVersion: OFFICE_SCENE_VERSION,
      gi: { enabled: true, skyColor: "#e2eef7", groundColor: "#cfd8de", hemisphereIntensity: 0.85, contactShadows: false, contactOpacity: 0, contactBlur: 2.5 },
    },
  } as LevelScene;
}

/** The Lobby's OWN published scene (lobby.json). Null until an admin
 * first publishes the level. */
export async function fetchPublishedLobbyScene(): Promise<LevelScene | null> {
  const m = await fetchPublishedOfficeMeta(publishedWorldUrl("lobby.json"));
  return m?.scene ?? null;
}

/** The editable Lobby level always opens on its CURRENT published
 * scene; a divergent local copy is first preserved as a draft. */
export async function syncLobbyLevelToPublished(): Promise<LocalLevelRecord> {
  const publishedScene = stripRetiredBackground(await fetchPublishedLobbyScene());
  let existing = resolveWorldSyncLevel("lobby", LOBBY_LEVEL_NAME);
  if (!existing) {
    existing = _ensure(publishedScene ? () => publishedScene : buildLobbyScene, LOBBY_LEVEL_NAME);
    setBoundWorldKey(existing.id, "lobby");
    return getLocalLevel(existing.id) ?? existing;
  }
  setBoundWorldKey(existing.id, "lobby");
  if (!publishedScene) return existing;
  if (stableStringify(existing.scene) !== stableStringify(publishedScene)) {
    preserveLocalDraft(existing, LOBBY_LEVEL_NAME, "Local edits preserved when the Lobby level was re-synced to the published version");
    updateLocalLevel(existing.id, { scene: JSON.parse(JSON.stringify(publishedScene)) });
  }
  return getLocalLevel(existing.id) ?? existing;
}
