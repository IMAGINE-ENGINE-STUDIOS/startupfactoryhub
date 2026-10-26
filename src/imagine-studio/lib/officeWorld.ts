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

export const LOBBY_LEVEL_NAME = "Lobby & Plaza — Ground Floor";

/** LOBBY & PLAZA — the building's ground floor as ONE level (founder
 * directive 2026-10-26: "lobby and building plaza are supposed to be
 * one thing — eliminate the building plaza level"). The double-height
 * lobby hall (16 m) opens through its glass doors straight onto the
 * plaza: terrace, grand fountain, parterre gardens, tree allées, lamp
 * rows and the theater screen at the far end — all walkable, no podium,
 * no white box underneath. The elevator is a round glass shaft with
 * bronze rings and a warm-lit cabin. NO desks, NO characters. */
export function buildLobbyScene(): LevelScene {
  n = 0;
  const o: PrimitiveObject[] = [];
  const W = 48, D = 32, H = 16, T = 0.18;
  const glass: [number, number, number, number] = [0.72, 0.86, 0.97, 0.22];
  const bronze = "#8a6a34";
  const TZ = 52; // the fountain's z — the plaza's heart
  /* ---------- the grounds (the plaza half) ---------- */
  o.push(P("Plaza Lawn", "box", [0, -0.06, 39], [190, 0.12, 152], "#3c6a32", { roughness: 1, metalness: 0 }));
  o.push(P("Terrace", "box", [0, -0.03, 25], [64, 0.06, 20], "#ddd3ba", { roughness: 0.95, metalness: 0 }));
  o.push(P("Central Walk", "box", [0, -0.02, 66], [14, 0.05, 66], "#e2d9c4", { roughness: 0.95, metalness: 0 }));
  o.push(P("Theater Apron", "box", [0, -0.02, 100], [34, 0.05, 8], "#d8cfbc", { roughness: 0.95, metalness: 0 }));
  // The grand fountain.
  o.push(P("Fountain Basin", "cylinder", [0, 0.55, TZ], [26, 1.1, 26], "#ece7db", { roughness: 0.8, metalness: 0 }));
  o.push(P("Fountain Rim", "torus", [0, 1.15, TZ], [25.2, 1.6, 25.2], "#e0d8c6", { rotation: [Math.PI / 2, 0, 0], roughness: 0.8, metalness: 0 }));
  o.push(P("Fountain Water", "cylinder", [0, 0.95, TZ], [23.6, 0.12, 23.6], "#79a8a4", { roughness: 0.25, metalness: 0.1 }));
  o.push(P("Fountain Pedestal", "cylinder", [0, 2.2, TZ], [5.2, 2.6, 5.2], "#e6e0d0", { roughness: 0.8, metalness: 0 }));
  o.push(P("Fountain Tier", "cylinder", [0, 3.6, TZ], [9.2, 0.5, 9.2], "#ece7db", { roughness: 0.8, metalness: 0 }));
  o.push(P("Fountain Tier Water", "cylinder", [0, 3.8, TZ], [8.4, 0.1, 8.4], "#79a8a4", { roughness: 0.25, metalness: 0.1 }));
  o.push(P("Fountain Column", "cylinder", [0, 4.8, TZ], [1.6, 2.2, 1.6], "#e6e0d0", { roughness: 0.8, metalness: 0 }));
  o.push(P("Fountain Crown", "sphere", [0, 6.2, TZ], [2.2, 2.2, 2.2], "#ece7db", { roughness: 0.7, metalness: 0 }));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    o.push(P("Fountain Jet", "cone", [Math.cos(a) * 7, 1.7, TZ + Math.sin(a) * 7], [0.5, 1.2, 0.5], "#a8c8c4", { roughness: 0.3, metalness: 0.1 }));
    o.push(P("Fountain Orb", "sphere", [Math.cos(a + 0.5) * 11.2, 1.65, TZ + Math.sin(a + 0.5) * 11.2], [1.1, 1.1, 1.1], bronze, { metalness: 0.8, roughness: 0.3 }));
  }
  // Parterre gardens — four mirrored quadrants.
  for (const sx of [-1, 1]) for (const pz of [42, 70]) {
    const cx = sx * 27;
    o.push(P("Parterre Gravel", "box", [cx, 0.02, pz], [20, 0.05, 12], "#e6dfcd", { roughness: 1, metalness: 0 }));
    o.push(P("Parterre Hedge N", "box", [cx, 0.4, pz - 6], [20.6, 0.8, 0.7], "#2d5a2c", { roughness: 1, metalness: 0 }));
    o.push(P("Parterre Hedge S", "box", [cx, 0.4, pz + 6], [20.6, 0.8, 0.7], "#2d5a2c", { roughness: 1, metalness: 0 }));
    o.push(P("Parterre Hedge W", "box", [cx - 10, 0.4, pz], [0.7, 0.8, 11.3], "#2d5a2c", { roughness: 1, metalness: 0 }));
    o.push(P("Parterre Hedge E", "box", [cx + 10, 0.4, pz], [0.7, 0.8, 11.3], "#2d5a2c", { roughness: 1, metalness: 0 }));
    o.push(P("Parterre Cross NS", "box", [cx, 0.3, pz], [1.1, 0.6, 11.3], "#2d5a2c", { roughness: 1, metalness: 0 }));
    o.push(P("Parterre Cross EW", "box", [cx, 0.3, pz], [19.3, 0.6, 1.1], "#2d5a2c", { roughness: 1, metalness: 0 }));
    o.push(P("Flower Bed A", "box", [cx - 5, 0.16, pz - 3], [7.5, 0.3, 4], "#b8492f", { roughness: 1, metalness: 0 }));
    o.push(P("Flower Bed B", "box", [cx + 5, 0.16, pz + 3], [7.5, 0.3, 4], "#e0a33c", { roughness: 1, metalness: 0 }));
    o.push(P("Topiary Pot", "cylinder", [cx, 0.35, pz], [1.3, 0.7, 1.3], "#8a5a38", { roughness: 0.9, metalness: 0 }));
    o.push(P("Topiary Cone", "cone", [cx, 1.9, pz], [1.7, 2.6, 1.7], "#2f6b2f", { roughness: 1, metalness: 0 }));
  }
  // Tree allées along the axis + the side rows.
  const tree = (x: number, z: number, s = 1) => {
    o.push(P("Allée Trunk", "cylinder", [x, 1.1 * s, z], [0.5 * s, 2.2 * s, 0.5 * s], "#5a4230", { roughness: 1, metalness: 0 }));
    o.push(P("Allée Crown", "sphere", [x, 3.4 * s, z], [3.4 * s, 3.4 * s, 3.4 * s], "#356b31", { roughness: 1, metalness: 0 }));
    o.push(P("Allée Crown Top", "sphere", [x, 4.6 * s, z], [2.3 * s, 2.3 * s, 2.3 * s], "#3d7a37", { roughness: 1, metalness: 0 }));
  };
  for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) tree(sx * 10.5, 38 + i * 13.5);
  for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) tree(sx * 44, 20 + i * 18, 1.25);
  // Lamp pairs along the walk.
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) {
    const lz = 36 + i * 15;
    o.push(P("Plaza Lamp Post", "cylinder", [sx * 8.4, 1.6, lz], [0.22, 3.2, 0.22], "#232a31", { metalness: 0.5, roughness: 0.5 }));
    o.push(P("Plaza Lamp Globe", "sphere", [sx * 8.4, 3.5, lz], [0.72, 0.72, 0.72], "#fff2cf", { emissive: hex("#ffca66"), emissiveIntensity: 0.8 } as any));
  }
  // Benches facing the theater + the THEATER SCREEN (founder: keep it).
  for (const bz of [86, 90.5, 95]) for (const bx of [-12, -4, 4, 12]) {
    o.push(P("Theater Bench", "box", [bx, 0.5, bz], [5.6, 0.18, 0.7], "#cfc6ae", { roughness: 0.9, metalness: 0 }));
    o.push(P("Theater Bench Leg", "box", [bx - 2.2, 0.22, bz], [0.35, 0.45, 0.6], "#6b5a41", { roughness: 0.9, metalness: 0 }));
    o.push(P("Theater Bench Leg", "box", [bx + 2.2, 0.22, bz], [0.35, 0.45, 0.6], "#6b5a41", { roughness: 0.9, metalness: 0 }));
  }
  const screen = P("Theater Screen", "plane", [0, 5, 104], [24, 8.5, 1], "#0a1220", { roughness: 0.6, metalness: 0 }) as any;
  screen.theater = true;
  o.push(screen);
  o.push(P("Theater Screen Back", "box", [0, 5, 104.4], [25, 9.3, 0.5], "#141a22", { roughness: 0.8, metalness: 0.2 }));
  for (const sx of [-1, 1]) {
    o.push(P("Theater Pylon", "box", [sx * 13.4, 3.4, 104.3], [1.1, 6.8, 1.1], "#232a31", { metalness: 0.4, roughness: 0.5 }));
    o.push(P("Theater Hedge", "box", [sx * 19, 0.9, 103], [10, 1.8, 1.6], "#2d5a2c", { roughness: 1, metalness: 0 }));
  }
  // Garden borders.
  o.push(P("Garden Hedge Back", "box", [0, 0.9, 113], [124, 1.8, 1.6], "#2d5a2c", { roughness: 1, metalness: 0 }));
  for (const sx of [-1, 1]) {
    o.push(P("Garden Hedge Side", "box", [sx * 62, 0.9, 71], [1.6, 1.8, 84], "#2d5a2c", { roughness: 1, metalness: 0 }));
    o.push(P("Corner Topiary Pot", "cylinder", [sx * 56, 0.4, 107], [1.6, 0.8, 1.6], "#8a5a38", { roughness: 0.9, metalness: 0 }));
    o.push(P("Corner Topiary", "cone", [sx * 56, 2.6, 107], [2.4, 3.6, 2.4], "#2f6b2f", { roughness: 1, metalness: 0 }));
  }
  /* ---------- the lobby hall ---------- */
  o.push(P("Lobby Floor", "box", [0, -0.05, 0], [W, 0.1, D], "#d8cfbc", { roughness: 0.9, metalness: 0 }));
  o.push(P("Lobby Ceiling", "box", [0, H + 0.06, 0], [W, 0.12, D], "#eef2f5", { roughness: 0.95, metalness: 0 }));
  o.push(P("Lobby Runner", "box", [0, 0.03, 9.5], [6.4, 0.04, 12], "#5a2320", { roughness: 1, metalness: 0 }));
  for (const lx of [-16, 0, 16]) for (const lz of [-7, 7]) {
    o.push(P("Ceiling Light Bar", "box", [lx, H - 0.06, lz], [5.5, 0.07, 0.45], "#d5dde4", { emissive: hex("#ffffff"), emissiveIntensity: 0.9 } as any));
  }
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
  // SOUTH wall: two runs with a 7 m doorway; the GLASS DOORS stand OPEN
  // — walk straight out onto the terrace and the plaza.
  wall("S", W, 0, D / 2, 0, -W / 2, -3.5);
  wall("S", W, 0, D / 2, 0, 3.5, W / 2);
  o.push(P("Door Lintel", "box", [0, H - 0.45, D / 2], [7.2, 0.9, T], "#bfcbd6", { roughness: 0.45, metalness: 0.35 }));
  o.push(P("Glass Door Left", "box", [-4.7, 3, 14.1], [3.4, 6, 0.06], glass, { rotation: [0, 1.85, 0], roughness: 0.08, metalness: 0.1 }));
  o.push(P("Glass Door Right", "box", [4.7, 3, 14.1], [3.4, 6, 0.06], glass, { rotation: [0, -1.85, 0], roughness: 0.08, metalness: 0.1 }));
  o.push(P("Door Handle Left", "box", [-3.6, 1.6, 13.2], [0.07, 0.9, 0.07], "#8b98a5", { metalness: 0.7, roughness: 0.3 }));
  o.push(P("Door Handle Right", "box", [3.6, 1.6, 13.2], [0.07, 0.9, 0.07], "#8b98a5", { metalness: 0.7, roughness: 0.3 }));
  /* THE ELEVATOR — redesigned (founder: "the elevator SUCKS, make
   * something pretty"): a ROUND glass shaft with bronze rings, a
   * warm-lit glass cabin, a bronze medallion in the floor. */
  o.push(P("Elevator Medallion", "cylinder", [0, 0.03, 0], [10, 0.06, 10], "#241c12", { roughness: 0.6, metalness: 0.3 }));
  o.push(P("Elevator Medallion Ring", "torus", [0, 0.09, 0], [8.8, 0.5, 8.8], "#b08d4f", { rotation: [Math.PI / 2, 0, 0], metalness: 0.8, roughness: 0.3 }));
  o.push(P("Elevator Shaft Glass", "cylinder", [0, H / 2, 0], [5.4, H, 5.4], glass, { roughness: 0.08, metalness: 0.1 }));
  for (const ry of [0.5, 8, 15.5]) {
    o.push(P("Elevator Bronze Ring", "torus", [0, ry, 0], [5.5, 0.55, 5.5], bronze, { rotation: [Math.PI / 2, 0, 0], metalness: 0.8, roughness: 0.3 }));
  }
  for (const [mx, mz] of [[0, 2.68], [0, -2.68], [2.68, 0], [-2.68, 0]] as [number, number][]) {
    o.push(P("Elevator Mullion", "box", [mx, H / 2, mz], [0.18, H, 0.18], bronze, { metalness: 0.8, roughness: 0.3 }));
  }
  o.push(P("Elevator Cabin Glass", "cylinder", [0, 1.62, 0], [4.3, 2.9, 4.3], glass, { roughness: 0.08, metalness: 0.1 }));
  o.push(P("Elevator Cabin Crown", "cylinder", [0, 3.22, 0], [4.55, 0.35, 4.55], bronze, { metalness: 0.8, roughness: 0.3 }));
  o.push(P("Elevator Cabin Base", "cylinder", [0, 0.18, 0], [4.55, 0.35, 4.55], bronze, { metalness: 0.8, roughness: 0.3 }));
  o.push(P("Elevator Cabin Light", "cylinder", [0, 2.98, 0], [3.4, 0.06, 3.4], "#ffe9c4", { emissive: hex("#ffd9a0"), emissiveIntensity: 1.3 } as any));
  o.push(P("Elevator Door Left", "box", [-0.62, 1.55, 2.08], [1.05, 2.9, 0.08], bronze, { metalness: 0.8, roughness: 0.3 }));
  o.push(P("Elevator Door Right", "box", [0.62, 1.55, 2.08], [1.05, 2.9, 0.08], bronze, { metalness: 0.8, roughness: 0.3 }));
  o.push(P("Elevator Call Column", "box", [3.7, 1.5, 2.5], [0.5, 3, 0.5], bronze, { metalness: 0.8, roughness: 0.3 }));
  o.push(P("Elevator Call Panel", "box", [3.7, 2.55, 2.78], [0.34, 0.52, 0.06], "#1c1410", { emissive: hex("#ffb84d"), emissiveIntensity: 1.1 } as any));
  for (const sx of [-1, 1]) {
    o.push(P("Elevator Planter", "cylinder", [sx * 4.8, 0.35, 0], [1.5, 0.7, 1.5], "#3a3f45", { roughness: 0.7, metalness: 0.2 }));
    o.push(P("Elevator Planter Green", "sphere", [sx * 4.8, 1.15, 0], [1.35, 1.1, 1.35], "#2f6b2f", { roughness: 1, metalness: 0 }));
    o.push(P("Lobby Bench", "box", [sx * 9, 0.5, 5.5], [4.4, 0.16, 0.8], "#8a6a34", { metalness: 0.4, roughness: 0.5 }));
    o.push(P("Lobby Bench Leg", "box", [sx * 9 - 1.7, 0.22, 5.5], [0.3, 0.45, 0.7], "#3a3f45", { roughness: 0.7, metalness: 0.3 }));
    o.push(P("Lobby Bench Leg", "box", [sx * 9 + 1.7, 0.22, 5.5], [0.3, 0.45, 0.7], "#3a3f45", { roughness: 0.7, metalness: 0.3 }));
  }
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
      lobbyVersion: 2,
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
  // Rename migration (founder directive 2026-10-26): the level IS
  // "Lobby & Plaza" now — a level still carrying the old "Lobby" name
  // is this level; rename it in place.
  if (existing.name !== LOBBY_LEVEL_NAME) {
    updateLocalLevel(existing.id, { name: LOBBY_LEVEL_NAME });
    existing = getLocalLevel(existing.id) ?? existing;
  }
  if (!publishedScene) {
    // No published scene: an existing local level built before the
    // Lobby & Plaza merge (lobbyVersion < 2) is reseeded from the
    // current builder, its old scene preserved as a draft.
    if ((((existing.scene as any)?.environment?.lobbyVersion) ?? 1) < 2) {
      preserveLocalDraft(existing, LOBBY_LEVEL_NAME, "Local edits preserved when the Lobby level was upgraded to Lobby & Plaza");
      updateLocalLevel(existing.id, { scene: JSON.parse(JSON.stringify(buildLobbyScene())) });
      return getLocalLevel(existing.id) ?? existing;
    }
    return existing;
  }
  if (stableStringify(existing.scene) !== stableStringify(publishedScene)) {
    preserveLocalDraft(existing, LOBBY_LEVEL_NAME, "Local edits preserved when the Lobby level was re-synced to the published version");
    updateLocalLevel(existing.id, { scene: JSON.parse(JSON.stringify(publishedScene)) });
  }
  return getLocalLevel(existing.id) ?? existing;
}
