// Explicit level → world route bindings. A level's name used to be the only
// link to its public route (/plaza, /office), so a renamed or duplicated
// copy silently published to the generic library instead of the live world.
// A binding is the owner's explicit assignment — "THIS level is the one that
// publishes to startupfactoryhub.com/office" — and it wins over name
// matching everywhere (editor sync, publish target, open buttons, route
// chips). Stored per level id in localStorage, so it works for both local
// and cloud-stored levels without a schema change.
import { allNamedWorlds, matchNamedWorld, type NamedWorld } from "./worldSync";
import { listLocalLevels, readLevelWorldBindings, getBoundWorldKey, setBoundWorldKey } from "./localLevels";

/* The binding store itself lives in lib/localLevels (readLevelWorld-
 * Bindings / getBoundWorldKey / setBoundWorldKey) so the world sync
 * helpers in officeWorld/plazaLevel can use it without an import cycle
 * through worldSync. This module remains the public API. */

function read(): Record<string, string> {
  return readLevelWorldBindings();
}

export function worldForKey(key?: string | null): NamedWorld | null {
  return allNamedWorlds().find((w) => w.key === key) ?? null;
}

export function getLevelWorldKey(levelId?: string | null): string | null {
  return getBoundWorldKey(levelId);
}

export function setLevelWorld(levelId: string, key: string | null) {
  setBoundWorldKey(levelId, key);
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
