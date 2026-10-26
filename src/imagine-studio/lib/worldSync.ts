// Named worlds registry — the single source of truth for levels that have a
// public published twin (Plaza District, Muse HQ Office, and any future
// world). Edit mode, publish, and the live players all resolve worlds through
// here so the editor can never silently diverge from what's published:
// opening a named world in the editor re-syncs it to the published scene,
// publishing verifies the exact file it wrote, and name matching tolerates
// case / dash / spacing differences instead of demanding an exact string.
import { PLAZA_LEVEL_NAME, PLAZA_PUBLISHED_URL, fetchPublishedPlazaScene, syncPlazaLevelToPublished } from "./plazaLevel";
import { OFFICE_LEVEL_NAME, LEGACY_OFFICE_LEVEL_NAME, OFFICE_PUBLISHED_URL, fetchPublishedOfficeScene, FLOOR99_LEVEL_NAME, fetchPublishedFloor99Scene, fetchPublishedOfficeMeta, publishedWorldUrl, syncOfficeLevelToPublished, syncFloor99LevelToPublished, syncDynamicFloorLevel, BUILDING_PLAZA_LEVEL_NAME, fetchPublishedBuildingPlazaScene, syncBuildingPlazaLevelToPublished } from "./officeWorld";
import type { LevelScene } from "./levelTypes";
import type { LocalLevelRecord } from "./localLevels";

export interface NamedWorld {
  key: string;
  name: string;
  /** Storage file the publish function writes and the live page reads. */
  path: string;
  /** Public route that plays the published file. */
  livePath: string;
  publishedUrl: string;
  fetchPublished: () => Promise<LevelScene | null>;
  /** Ensures this world's editable level exists locally, synced to the
   * published scene — the same seeding the projects page runs. */
  syncLevel: () => Promise<LocalLevelRecord>;
  /** The building this world is a LEVEL of, when it is one (founder
   * directive 2026-10-25: floors are levels inside ONE world — the
   * Startup Office building — not separate worlds). */
  building?: string;
  /** Floor number inside the building (100 = the top office floor). */
  floor?: number;
  /** How the level is listed inside its building. */
  levelLabel?: string;
  /** Former names that still resolve to this world. */
  aliases?: string[];
}

export const NAMED_WORLDS: NamedWorld[] = [
  { key: "plaza", name: PLAZA_LEVEL_NAME, path: "plaza-district.json", livePath: "/plaza", publishedUrl: PLAZA_PUBLISHED_URL, fetchPublished: fetchPublishedPlazaScene, syncLevel: syncPlazaLevelToPublished },
  { key: "office", name: OFFICE_LEVEL_NAME, path: "office-world.json", livePath: "/office", publishedUrl: OFFICE_PUBLISHED_URL, fetchPublished: fetchPublishedOfficeScene, syncLevel: syncOfficeLevelToPublished, building: "Startup Office", floor: 100, levelLabel: "Level 100 — Startup Factory Hub", aliases: [LEGACY_OFFICE_LEVEL_NAME] },
  // Floor 99 — a LEVEL inside the Startup Office building (founder
  // directive 2026-10-25), one story below Level 100: its own published
  // file, played at /office?floor=99, edited like every level.
  { key: "office99", name: FLOOR99_LEVEL_NAME, path: "floor99-world.json", livePath: "/office?floor=99", publishedUrl: publishedWorldUrl("floor99-world.json"), fetchPublished: fetchPublishedFloor99Scene, syncLevel: syncFloor99LevelToPublished, building: "Startup Office", floor: 99, levelLabel: "Level 99 — Wonderlands World" },
  // The BUILDING PLAZA — the building's ground level (founder
  // directive 2026-10-26): a level like /plaza is a world, holding the
  // plaza scenario and the theater screen, with the tower rising out
  // of its podium in the stacked building view. Its live home is the
  // office building itself.
  { key: "officeplaza", name: BUILDING_PLAZA_LEVEL_NAME, path: "building-plaza.json", livePath: "/office", publishedUrl: publishedWorldUrl("building-plaza.json"), fetchPublished: fetchPublishedBuildingPlazaScene, syncLevel: syncBuildingPlazaLevelToPublished, building: "Startup Office", floor: 0, levelLabel: "Building Plaza — Ground" },
];

const norm = (s: string) => (s || "").toLowerCase().replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();

/**
 * Department floors a CEO created are levels of the Startup Office
 * building too (founder directive 2026-10-25). Their registry lives in
 * localStorage ("sfh:office-floors:v1", owned by lib/floors) — read
 * here directly so this module stays free of an import cycle, and each
 * one resolves, syncs and publishes exactly like a built-in level.
 */
export function dynamicWorlds(): NamedWorld[] {
  try {
    const raw = JSON.parse(localStorage.getItem("sfh:office-floors:v1") || "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((d) => d && typeof d.id === "number" && d.label)
      .map((d): NamedWorld => {
        const name = `Floor ${d.id} — ${d.label}`;
        const path = `floor${d.id}-world.json`;
        return {
          key: `floor${d.id}`,
          name,
          path,
          livePath: `/office?floor=${d.id}`,
          publishedUrl: publishedWorldUrl(path),
          fetchPublished: async () => {
            const m = await fetchPublishedOfficeMeta(publishedWorldUrl(path));
            return m?.scene ?? null;
          },
          syncLevel: () => syncDynamicFloorLevel(name, path),
          building: "Startup Office",
          floor: d.id,
          levelLabel: `Level ${d.id} — ${d.label}`,
        };
      });
  } catch {
    return [];
  }
}

/** Built-in named worlds plus every dynamic floor level. */
export const allNamedWorlds = (): NamedWorld[] => [...NAMED_WORLDS, ...dynamicWorlds()];

export function matchNamedWorld(name?: string | null): NamedWorld | null {
  const n = norm(name || "");
  if (!n) return null;
  return allNamedWorlds().find((w) => norm(w.name) === n || (w.aliases || []).some((a) => norm(a) === n)) ?? null;
}

/** All levels of one building, top floor first. */
export function buildingLevels(w: NamedWorld): NamedWorld[] {
  if (!w.building) return [w];
  return allNamedWorlds().filter((x) => x.building === w.building).sort((a, b) => (b.floor ?? 0) - (a.floor ?? 0));
}

/** Key-order-insensitive stringify for scene equality checks. */
export function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`).join(",")}}`;
}
