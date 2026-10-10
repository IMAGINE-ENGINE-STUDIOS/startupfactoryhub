// @ts-nocheck -- Imagine Studio v2
/**
 * 3D Studio projects: a project owns any number of levels (Plaza District is
 * one project, its Plaza level one of its levels). Levels carry `projectId`;
 * projects keep the start level. Legacy levels without a project are wrapped
 * into a project of their own on first read, so nothing is lost.
 */
import { DEFAULT_CHARACTER_URL, EMPTY_SCENE, newId, type LevelScene } from "@/imagine-studio/lib/levelTypes";
import { createLocalLevel, getLocalLevel, listLocalLevels, updateLocalLevel, type LocalLevelRecord } from "@/imagine-studio/lib/localLevels";
import { PLAZA_LEVEL_NAME } from "@/imagine-studio/lib/plazaLevel";

export interface LocalProjectRecord {
  id: string;
  name: string;
  description: string | null;
  defaultLevelId: string | null;
  created_at: string;
  updated_at: string;
}

const KEY = "startupfactoryhub:local-projects:v1";
const ACTIVE = "startupfactoryhub:active-level:v1";
export const PLAZA_PROJECT_NAME = "Plaza District";

function read(): LocalProjectRecord[] {
  try { const r = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(r) ? r : []; } catch { return []; }
}
function write(list: LocalProjectRecord[]) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} }

function newProjectRecord(name: string): LocalProjectRecord {
  const now = new Date().toISOString();
  return { id: `proj_${crypto.randomUUID()}`, name: name.slice(0, 80) || "Untitled Project", description: null, defaultLevelId: null, created_at: now, updated_at: now };
}

/** Wrap any level without a project (Plaza joins "Plaza District"). */
function migrate(): LocalProjectRecord[] {
  let list = read();
  let changed = false;
  for (const l of listLocalLevels()) {
    if (l.projectId && list.some((p) => p.id === l.projectId)) continue;
    let p: LocalProjectRecord | undefined;
    if (l.name === PLAZA_LEVEL_NAME) p = list.find((x) => x.name === PLAZA_PROJECT_NAME);
    if (!p) {
      p = newProjectRecord(l.name === PLAZA_LEVEL_NAME ? PLAZA_PROJECT_NAME : l.name);
      p.defaultLevelId = l.id; p.created_at = l.created_at; p.updated_at = l.updated_at;
      list = [p, ...list];
    }
    updateLocalLevel(l.id, { projectId: p.id } as any);
    changed = true;
  }
  if (changed) write(list);
  return list;
}

/** A ready-to-play starter: ground, light and a playable hero (same rules as /plaza). */
export function starterScene(): LevelScene {
  const s: LevelScene = JSON.parse(JSON.stringify(EMPTY_SCENE));
  s.objects.push(
    { id: newId("obj"), kind: "primitive", name: "Ground", shape: "box", position: [0, -0.05, 0], rotation: [0, 0, 0], scale: [80, 0.1, 80], visible: true, color: [0.32, 0.38, 0.34, 1], metalness: 0, roughness: 0.9 },
    { id: newId("obj"), kind: "character", name: "Hero (playable)", url: DEFAULT_CHARACTER_URL, source: "Xbot · Mixamo (MIT)", position: [0, 0, 6], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true, animationSpeed: 1, paused: false, crossfade: 0.25, playable: true, controlScheme: "both", cameraMode: "third", mobileJoystick: "auto" },
  );
  return s;
}

export function listProjects(): (LocalProjectRecord & { levels: LocalLevelRecord[] })[] {
  const list = migrate();
  const levels = listLocalLevels();
  return list
    .map((p) => {
      const ls = levels.filter((l) => l.projectId === p.id);
      const last = ls.reduce((m, l) => (l.updated_at > m ? l.updated_at : m), p.updated_at);
      return { ...p, updated_at: last, levels: ls };
    })
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
}

export function getProject(id: string) { return listProjects().find((p) => p.id === id) ?? null; }

export function projectOfLevel(levelId: string | null | undefined) {
  if (!levelId) return null;
  migrate();
  const l = getLocalLevel(levelId);
  return l?.projectId ? getProject(l.projectId) : null;
}

export function levelsOfProject(projectId: string): LocalLevelRecord[] {
  return listLocalLevels().filter((l) => l.projectId === projectId).sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
}

export function createProject(name = "Untitled Project", firstLevelName = "Level 1", scene?: LevelScene) {
  const p = newProjectRecord(name);
  const lvl = createLocalLevel(scene ?? starterScene());
  updateLocalLevel(lvl.id, { name: firstLevelName, projectId: p.id } as any);
  p.defaultLevelId = lvl.id;
  write([p, ...read()]);
  return { project: p, level: { ...lvl, name: firstLevelName, projectId: p.id } };
}

export function addLevelToProject(projectId: string, name?: string, scene?: LevelScene) {
  const n = name || `Level ${levelsOfProject(projectId).length + 1}`;
  const lvl = createLocalLevel(scene ?? starterScene());
  updateLocalLevel(lvl.id, { name: n, projectId } as any);
  touch(projectId);
  return { ...lvl, name: n, projectId };
}

export function updateProject(id: string, patch: Partial<LocalProjectRecord>) {
  write(read().map((p) => (p.id === id ? { ...p, ...patch, updated_at: new Date().toISOString() } : p)));
}
function touch(id: string) { updateProject(id, {}); }

export function deleteProject(id: string, deleteLevel: (id: string) => void) {
  for (const l of levelsOfProject(id)) deleteLevel(l.id);
  write(read().filter((p) => p.id !== id));
}

export function duplicateProject(id: string) {
  const src = getProject(id); if (!src) return null;
  const p = newProjectRecord(`${src.name} (copy)`);
  const map: Record<string, string> = {};
  for (const l of levelsOfProject(id)) {
    const c = createLocalLevel(l.scene);
    updateLocalLevel(c.id, { name: l.name, projectId: p.id } as any);
    map[l.id] = c.id;
  }
  p.defaultLevelId = (src.defaultLevelId && map[src.defaultLevelId]) || Object.values(map)[0] || null;
  write([p, ...read()]);
  return p;
}

/** The level open in the Studio; new Genius levels join its project. */
export function setActiveLevel(id: string | null) { try { id ? localStorage.setItem(ACTIVE, id) : localStorage.removeItem(ACTIVE); } catch {} }
export function getActiveLevel(): string | null { try { return localStorage.getItem(ACTIVE); } catch { return null; } }
export function activeProjectLevels(): LocalLevelRecord[] {
  const p = projectOfLevel(getActiveLevel());
  return p ? levelsOfProject(p.id) : listLocalLevels();
}
