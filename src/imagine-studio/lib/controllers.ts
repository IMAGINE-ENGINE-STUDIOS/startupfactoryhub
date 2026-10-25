// @ts-nocheck -- Imagine Studio controllers: ONE movement/camera system for
// every world (plaza, office, play test) and every character.
//
// A controller is DATA, not code paths:
//   { id, name, mode, walkSpeed, sprintMultiplier, canJump, jumpHeight,
//     cameraDistance, cameraHeight, script? }
// - mode 'third'  : camera follows behind the character (the default).
// - mode 'first'  : camera sits at the character's eyes; the body is hidden.
// - mode 'npc'    : not player-controlled (bots, decorations).
//
// Characters CARRY a controller: scene character objects have `controllerId`;
// dropping a character assigns the default controller automatically. Worlds
// can define their own controllers in `scene.controllers` (created in the
// studio by form, by pasted code/JSON, or by Genius — the schema below is
// the contract all three use) and pick the world's player controller in
// `scene.playerControllerId`.

export interface ControllerDef {
  id: string;
  name: string;
  mode: 'third' | 'first' | 'npc';
  walkSpeed: number;        // metres per second
  sprintMultiplier: number; // × walkSpeed while sprinting
  canJump: boolean;
  jumpHeight: number;       // metres (converted to velocity internally)
  cameraDistance: number;   // third person: metres behind the character
  cameraHeight: number;     // third person: metres above the ground pivot
  script?: string;          // optional per-frame hook, see runControllerScript
}

export const DEFAULT_CONTROLLER: ControllerDef = {
  id: 'default',
  name: 'Third Person (default)',
  mode: 'third',
  walkSpeed: 4.2,
  sprintMultiplier: 1.7,
  canJump: true,
  jumpHeight: 1.1,
  cameraDistance: 6.5,
  cameraHeight: 2.6,
};

export const FIRST_PERSON_CONTROLLER: ControllerDef = {
  id: 'first-person',
  name: 'First Person',
  mode: 'first',
  walkSpeed: 4.2,
  sprintMultiplier: 1.7,
  canJump: true,
  jumpHeight: 1.1,
  cameraDistance: 0,
  cameraHeight: 1.62,
};

export const NPC_CONTROLLER: ControllerDef = {
  id: 'npc',
  name: 'NPC (not player-controlled)',
  mode: 'npc',
  walkSpeed: 0,
  sprintMultiplier: 1,
  canJump: false,
  jumpHeight: 0,
  cameraDistance: 0,
  cameraHeight: 0,
};

export const BUILTIN_CONTROLLERS: ControllerDef[] = [DEFAULT_CONTROLLER, FIRST_PERSON_CONTROLLER, NPC_CONTROLLER];

/** Every controller available in a scene: built-ins + the scene's own. */
export function sceneControllers(scene: any): ControllerDef[] {
  const custom: any[] = Array.isArray(scene?.controllers) ? scene.controllers : [];
  const out = [...BUILTIN_CONTROLLERS];
  for (const c of custom) {
    const def = normalizeController(c);
    if (def && !out.some((b) => b.id === def.id)) out.push(def);
  }
  return out;
}

/** Coerce loose data (form input, pasted JSON, a Genius proposal) into a
 *  valid ControllerDef, or null when it has no usable id/name. */
export function normalizeController(raw: any): ControllerDef | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || '').trim();
  if (!id) return null;
  const num = (v: any, d: number, min: number, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
  };
  return {
    id,
    name: String(raw.name || id).slice(0, 60),
    mode: raw.mode === 'first' || raw.mode === 'npc' ? raw.mode : 'third',
    walkSpeed: num(raw.walkSpeed, 4.2, 0, 30),
    sprintMultiplier: num(raw.sprintMultiplier, 1.7, 1, 4),
    canJump: raw.canJump !== false,
    jumpHeight: num(raw.jumpHeight, 1.1, 0, 6),
    cameraDistance: num(raw.cameraDistance, 6.5, 0, 30),
    cameraHeight: num(raw.cameraHeight, 2.6, 0, 12),
    script: typeof raw.script === 'string' && raw.script.trim() ? raw.script.slice(0, 8000) : undefined,
  };
}

/** The controller a character uses: its own controllerId when set (and
 *  resolvable), else the default. Dropped characters get 'default'. */
export function controllerForCharacter(scene: any, character: any): ControllerDef {
  const list = sceneControllers(scene);
  const id = character?.controllerId || 'default';
  return list.find((c) => c.id === id) || DEFAULT_CONTROLLER;
}

/** The controller the local player uses in a published world. */
export function playerControllerFor(scene: any): ControllerDef {
  const list = sceneControllers(scene);
  const id = scene?.playerControllerId || 'default';
  const def = list.find((c) => c.id === id) || DEFAULT_CONTROLLER;
  return def.mode === 'npc' ? DEFAULT_CONTROLLER : def;
}

/* ------------------------- script controllers -------------------------
   A controller script is a small JS body that runs once per frame AFTER the
   built-in movement, with a frozen API:
     api.dt            seconds since last frame
     api.input         { x, z, sprint, jump } — axes in character space
     api.position      { x, y, z } — read/write (metres)
     api.yaw           read/write (radians)
     api.speed         current horizontal speed (m/s)
     api.setSpeed(mult) scale this frame's movement
   Example (moonwalk — drift backwards while walking):
     api.yaw += Math.sin(performance.now() / 600) * 0.004;
   Scripts are compiled once per controller id; a throwing script disables
   itself after the first error so a bad script can never freeze a world. */
const scriptCache = new Map<string, { fn: ((api: any) => void) | null }>();
export function runControllerScript(def: ControllerDef, api: any): void {
  if (!def.script) return;
  let entry = scriptCache.get(def.id + ':' + def.script.length);
  if (!entry) {
    try {
      const fn = new Function('api', '"use strict";\n' + def.script) as (api: any) => void;
      entry = { fn };
    } catch { entry = { fn: null }; }
    scriptCache.set(def.id + ':' + def.script.length, entry);
  }
  if (!entry.fn) return;
  try { entry.fn(api); } catch { entry.fn = null; }
}
