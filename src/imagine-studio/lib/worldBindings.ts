// Explicit level → world route bindings. A level's name used to be the only
// link to its public route (/plaza, /office), so a renamed or duplicated
// copy silently published to the generic library instead of the live world.
// A binding is the owner's explicit assignment — "THIS level is the one that
// publishes to startupfactoryhub.com/office" — and it wins over name
// matching everywhere (editor sync, publish target, open buttons, route
// chips). Stored per level id in localStorage, so it works for both local
// and cloud-stored levels without a schema change.
import { allNamedWorlds, matchNamedWorld, type NamedWorld } from "./worldSync";
import { listLocalLevels } from "./localLevels";

const KEY = "sfh:level-worlds:v1";
type BindingMap = Record<string, string>;

function read(): BindingMap {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function write(m: BindingMap) {
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* storage unavailable */ }
}

export function worldForKey(key?: string | null): NamedWorld | null {
  return allNamedWorlds().find((w) => w.key === key) ?? null;
}

export function getLevelWorldKey(levelId?: string | null): string | null {
  if (!levelId) return null;
  return read()[levelId] ?? null;
}

export function setLevelWorld(levelId: string, key: string | null) {
  const m = read();
  if (key) m[levelId] = key; else delete m[levelId];
  write(m);
}

/** The world a level publishes to: explicit binding first, then its name. */
export function resolveLevelWorld(levelId?: string | null, name?: string | null): NamedWorld | null {
  return worldForKey(getLevelWorldKey(levelId)) ?? matchNamedWorld(name);
}

/** The local level that owns a world route: bound level first, then the
 *  name-matched one. Null when neither exists yet (callers seed via the
 *  world's sync helper). */
export function findWorldLevelId(key: string): string | null {
  const levels = listLocalLevels();
  const bound = levels.find((l) => read()[l.id] === key);
  if (bound) return bound.id;
  const w = worldForKey(key);
  const named = w ? levels.find((l) => matchNamedWorld(l.name)?.key === key) : null;
  return named?.id ?? null;
}
