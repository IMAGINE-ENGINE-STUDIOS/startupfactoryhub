// Named worlds registry — the single source of truth for levels that have a
// public published twin (Plaza District, Muse HQ Office, and any future
// world). Edit mode, publish, and the live players all resolve worlds through
// here so the editor can never silently diverge from what's published:
// opening a named world in the editor re-syncs it to the published scene,
// publishing verifies the exact file it wrote, and name matching tolerates
// case / dash / spacing differences instead of demanding an exact string.
import { PLAZA_LEVEL_NAME, PLAZA_PUBLISHED_URL, fetchPublishedPlazaScene } from "./plazaLevel";
import { OFFICE_LEVEL_NAME, OFFICE_PUBLISHED_URL, fetchPublishedOfficeScene, FLOOR99_LEVEL_NAME, fetchPublishedFloor99Scene, publishedWorldUrl } from "./officeWorld";
import type { LevelScene } from "./levelTypes";

export interface NamedWorld {
  key: string;
  name: string;
  /** Storage file the publish function writes and the live page reads. */
  path: string;
  /** Public route that plays the published file. */
  livePath: string;
  publishedUrl: string;
  fetchPublished: () => Promise<LevelScene | null>;
}

export const NAMED_WORLDS: NamedWorld[] = [
  { key: "plaza", name: PLAZA_LEVEL_NAME, path: "plaza-district.json", livePath: "/plaza", publishedUrl: PLAZA_PUBLISHED_URL, fetchPublished: fetchPublishedPlazaScene },
  { key: "office", name: OFFICE_LEVEL_NAME, path: "office-world.json", livePath: "/office", publishedUrl: OFFICE_PUBLISHED_URL, fetchPublished: fetchPublishedOfficeScene },
  // Floor 99 — a real level of the same building (founder directive
  // 2026-10-25): its own published file, played at /office?floor=99, and
  // reachable from the editor like every named world.
  { key: "office99", name: FLOOR99_LEVEL_NAME, path: "floor99-world.json", livePath: "/office?floor=99", publishedUrl: publishedWorldUrl("floor99-world.json"), fetchPublished: fetchPublishedFloor99Scene },
];

const norm = (s: string) => (s || "").toLowerCase().replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();

export function matchNamedWorld(name?: string | null): NamedWorld | null {
  const n = norm(name || "");
  if (!n) return null;
  return NAMED_WORLDS.find((w) => norm(w.name) === n) ?? null;
}

/** Key-order-insensitive stringify for scene equality checks. */
export function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((v as Record<string, unknown>)[k])}`).join(",")}}`;
}
