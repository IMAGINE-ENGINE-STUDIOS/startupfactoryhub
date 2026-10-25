// @ts-nocheck -- imported Imagine Studio v2
import { EMPTY_SCENE, LevelScene } from "@/imagine-studio/lib/levelTypes";

export interface LocalLevelRecord {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  is_public: boolean;
  updated_at: string;
  created_at: string;
  owner_id: string;
  scene: LevelScene;
}

const LEVELS_KEY = "startupfactoryhub:local-levels:v1";
const OWNER_KEY = "startupfactoryhub:local-level-owner:v1";

const cloneScene = (scene: LevelScene): LevelScene => JSON.parse(JSON.stringify(scene));

export function isLocalLevelId(id: string | undefined | null): id is string {
  return typeof id === "string" && id.startsWith("local_");
}

export function getLocalLevelOwnerId(): string {
  try {
    const existing = window.localStorage.getItem(OWNER_KEY);
    if (existing) return existing;
    const next = `local_owner_${crypto.randomUUID()}`;
    window.localStorage.setItem(OWNER_KEY, next);
    return next;
  } catch {
    return "local_owner_fallback";
  }
}

function readLocalLevels(): LocalLevelRecord[] {
  try {
    const raw = window.localStorage.getItem(LEVELS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalLevels(levels: LocalLevelRecord[]) {
  window.localStorage.setItem(LEVELS_KEY, JSON.stringify(levels));
}

function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: number; message?: string };
  return (
    e.name === "QuotaExceededError" ||
    e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    e.code === 22 ||
    e.code === 1014 ||
    (typeof e.message === "string" && /quota/i.test(e.message))
  );
}

/**
 * Write levels with automatic pruning if localStorage is full.
 * Drops the oldest local drafts (except the one we're trying to save) until the
 * write succeeds, or throws QuotaExceededError if nothing else can be removed.
 */
function safeWriteLocalLevels(levels: LocalLevelRecord[], protectId?: string) {
  let working = [...levels];
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      writeLocalLevels(working);
      return;
    } catch (err) {
      if (!isQuotaError(err)) throw err;
      // Drop oldest (excluding the protected one). Sort by updated_at asc.
      const sorted = [...working].sort((a, b) => Date.parse(a.updated_at) - Date.parse(b.updated_at));
      const victim = sorted.find((l) => l.id !== protectId);
      if (!victim) throw err;
      working = working.filter((l) => l.id !== victim.id);
      console.warn("[localLevels] localStorage full — pruned old draft", victim.id, victim.name);
    }
  }
  throw new Error("localStorage quota exceeded");
}

export function listLocalLevels(): LocalLevelRecord[] {
  return readLocalLevels().sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
}

export function getLocalLevel(id: string): LocalLevelRecord | null {
  return readLocalLevels().find((level) => level.id === id) ?? null;
}

export function createLocalLevel(scene: LevelScene = EMPTY_SCENE): LocalLevelRecord {
  const now = new Date().toISOString();
  const level: LocalLevelRecord = {
    id: `local_${crypto.randomUUID()}`,
    name: "Untitled Level",
    description: null,
    thumbnail_url: null,
    is_public: false,
    updated_at: now,
    created_at: now,
    owner_id: getLocalLevelOwnerId(),
    scene: cloneScene(scene),
  };
  safeWriteLocalLevels([level, ...readLocalLevels()], level.id);
  return level;
}

export function updateLocalLevel(id: string, patch: Partial<Omit<LocalLevelRecord, "id" | "created_at" | "owner_id">>) {
  const levels = readLocalLevels();
  const index = levels.findIndex((level) => level.id === id);
  if (index < 0) return false;
  levels[index] = { ...levels[index], ...patch, updated_at: new Date().toISOString() };
  try {
    safeWriteLocalLevels(levels, id);
    return true;
  } catch (err) {
    console.warn("[localLevels] write failed", err);
    return false;
  }
}

export function deleteLocalLevel(id: string) {
  writeLocalLevels(readLocalLevels().filter((level) => level.id !== id));
}

/* ------------------------------------------------------------------ */
/* Level → world bindings: the SINGLE store (key shared with            */
/* lib/worldBindings, which builds its public API on these helpers).   */
/* A binding is a level's pinned identity — "THIS level is Floor 100" — */
/* and it outranks the level's name everywhere, so a renamed,          */
/* duplicated or draft level can never steal a world's route, and a    */
/* world's sync can never overwrite another world's level.             */
/* ------------------------------------------------------------------ */

export const normLevelName = (s: string): string =>
  (s || "").toLowerCase().replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();

const WORLD_BINDINGS_KEY = "sfh:level-worlds:v1";

export function readLevelWorldBindings(): Record<string, string> {
  try { return JSON.parse(window.localStorage.getItem(WORLD_BINDINGS_KEY) || "{}"); } catch { return {}; }
}

export function getBoundWorldKey(levelId?: string | null): string | null {
  if (!levelId) return null;
  return readLevelWorldBindings()[levelId] ?? null;
}

export function setBoundWorldKey(levelId: string, key: string | null) {
  try {
    const m = readLevelWorldBindings();
    if (key) m[levelId] = key; else delete m[levelId];
    window.localStorage.setItem(WORLD_BINDINGS_KEY, JSON.stringify(m));
  } catch { /* storage unavailable */ }
}

/** The level pinned to a world key, when it still exists. */
export function findBoundLevelId(key: string): string | null {
  const m = readLevelWorldBindings();
  const id = Object.keys(m).find((k) => m[k] === key);
  return id && getLocalLevel(id) ? id : null;
}

const isDraftName = (name: string) => normLevelName(name).includes("- local draft");

/**
 * Resolves THE editable level of a named world for its sync helper:
 * the bound level first (whatever it is currently named — a binding is
 * identity), otherwise an UNBOUND level carrying the world's canonical
 * name. Levels bound to a DIFFERENT world and draft backups are never
 * eligible, so one world's sync can never touch another world's level.
 */
export function resolveWorldSyncLevel(key: string, canonicalName: string, aliases: string[] = []): LocalLevelRecord | null {
  const boundId = findBoundLevelId(key);
  if (boundId) return getLocalLevel(boundId);
  const bindings = readLevelWorldBindings();
  const names = [canonicalName, ...aliases].map(normLevelName);
  return (
    listLocalLevels().find(
      (l) => !bindings[l.id] && !isDraftName(l.name) && names.includes(normLevelName(l.name)),
    ) ?? null
  );
}

function stableStringifyLocal(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(stableStringifyLocal).join(",")}]`;
  const keys = Object.keys(v as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringifyLocal((v as Record<string, unknown>)[k])}`).join(",")}}`;
}

/**
 * Preserves a world's divergent local scene as a draft level before the
 * sync resets it to the published scene. Three guards keep this from
 * ever flooding the library (founder report 2026-10-25 — drafts were
 * multiplying into separate "projects" on every visit):
 *  - identical divergence is backed up ONCE, not on every sync;
 *  - the draft joins the SAME project as the world's level;
 *  - only the newest 2 drafts per world are kept.
 */
export function preserveLocalDraft(existing: LocalLevelRecord, canonicalName: string, note: string) {
  const prefix = `${canonicalName} — local draft`;
  const drafts = listLocalLevels()
    .filter((l) => l.name.startsWith(prefix))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const sceneStr = stableStringifyLocal(existing.scene);
  if (!drafts.some((d) => stableStringifyLocal(d.scene) === sceneStr)) {
    const backup = createLocalLevel(existing.scene);
    updateLocalLevel(backup.id, {
      name: `${prefix} ${new Date().toISOString().slice(0, 10)}`,
      description: note,
      ...(((existing as any).projectId ? { projectId: (existing as any).projectId } : {}) as any),
    });
  }
  for (const stale of listLocalLevels().filter((l) => l.name.startsWith(prefix)).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(2)) {
    deleteLocalLevel(stale.id);
  }
}
/** Finds (or seeds) the editable Plaza District level. */
export function ensurePlazaLevel(build: () => LevelScene, name: string): LocalLevelRecord {
  const found = readLocalLevels().find((l) => l.name === name);
  if (found) return found;
  const lvl = createLocalLevel(build());
  updateLocalLevel(lvl.id, { name, description: "Editable copy of the live /plaza district" });
  return { ...lvl, name };
}
