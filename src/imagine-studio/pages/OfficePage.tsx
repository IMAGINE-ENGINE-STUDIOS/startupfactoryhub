// @ts-nocheck -- Imagine Studio v2
/**
 * Muse HQ — NYC Office. A published world like the Plaza District: perimeter
 * window walls, 20 simple desk stations, and one NPC bot per Muse agent.
 * Bots work at their desks (sitting + typing) and stroll the office between
 * jobs; click a bot (or walk up to it) to open its Genius panel — chat with
 * the agent, watch its task pipeline, or jump into the full Agents console
 * to link it to one of your SFH Agents and assign jobs (call-agents run).
 * The north wall
 * carries a theater screen: admins can share a screen, a camera, documents
 * (PDF/image) with audio, or put any bot's AI dashboard on the big screen,
 * synced to everyone in the room over LiveKit (same pattern as the Plaza).
 */
import { Suspense, lazy, memo, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, useGLTF, useAnimations, Environment, Lightformer } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { Room, RoomEvent, Track } from 'livekit-client';
import { Armchair, ArrowUpDown, Bot as BotIcon, Box as BoxIcon, Briefcase, Building2, Check, ChevronDown, ChevronLeft, ChevronRight, Clapperboard, Crown, FileUp, LayoutDashboard, ListTodo, Loader2, Maximize2, MessageCircle, Mic, MicOff, MonitorUp, Play, Send, SlidersHorizontal, Sparkles, Square, Users, Video, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { warmVoice } from '@/lib/voice/useVoiceCall';
import { buildDocument, documentDelivery, DOC_TASK, authorViaLightPaper } from '@/imagine-studio/lib/docBuild';
import { PublishedWorld } from '@/imagine-studio/components/plaza/PublishedWorld';

const SFHCallAgents = lazy(() => import('@/components/call-agents/SFHCallAgents'));
const TaskPipeline = lazy(() => import('@/components/call-agents/TaskPipeline'));
import { inputPulse } from '@/imagine-studio/components/level/locomotion/locomotionState';
import { useSourceTexture, type TheaterSource } from '@/imagine-studio/components/plaza/TheaterScreen';
import { openTheaterFullscreen } from '@/imagine-studio/components/plaza/TheaterFullscreen';
import { ShiftPanel } from '@/imagine-studio/components/office/ShiftPanel';
import { AgentChat } from '@/imagine-studio/components/office/AgentChat';
import { OfficeAdminTab } from '@/imagine-studio/components/office/OfficeAdmin';
import { ExecPanel, type ExecTools } from '@/imagine-studio/components/office/ExecPanel';
import BuildingShell from '@/imagine-studio/components/office/BuildingShell';
import { FLOORS, allFloors, createDynamicFloor, floorById, engineFor, setFloorTeamExtras, loadCustomBots, saveCustomBots, customBotToOfficeBot, customBotToRole, loadPromptOverrides, savePromptOverride, CHAIRMAN_PROMPT, ceoPrompt, CUSTOM_TINTS, type CustomBot, type FloorDef } from '@/imagine-studio/lib/floors';
import { runOutput } from '@/imagine-studio/lib/shiftEngine';
import { MAX_AGENTS_PER_FLOOR, agentScope, applyPersonnelToRoles, ceoScope, generationOf, getPendingFirings, getPersonnel, logAction, managerScope, orgSubscribe, personaName, recordFiring, renamePerson, retiredAgentIds, setPersonnelPrompt, withCharter, addPendingFiring, updateDepartment, CHAIRMAN_SCOPE } from '@/imagine-studio/lib/org';
import { officeAdmin } from '@/imagine-studio/components/office/OfficeAdmin';
import { AGENT_MODEL_URL, AGENT_PLAYER_MODEL_URL, MANAGER_HOME, CHAIRMAN_HOME, CEO_HOME, OFFICE_BOUNDS, OFFICE_DESKS, OFFICE_LEVEL_NAME, OFFICE_SCENE_VERSION, OFFICE_WAYPOINTS, buildOfficeScene, buildFloor99Scene, buildLobbyScene, buildSceneWithCast, fetchPublishedOfficeMeta, mergeOfficeScenes, publishedWorldUrl, syncOfficeLevelToPublished, type OfficeBot } from '@/imagine-studio/lib/officeWorld';
import { UnifiedPlayer } from '@/imagine-studio/components/player/UnifiedPlayer';
import { makeGroundSampler } from '@/imagine-studio/lib/grounding';
import { playerControllerFor } from '@/imagine-studio/lib/controllers';
import MobileTouchControls from '@/imagine-studio/components/level/play/MobileTouchControls';
import { applyPose, buildSeatedLegsPose } from '@/imagine-studio/lib/actionPoses';
import { findWorldLevelId, worldForKey } from '@/imagine-studio/lib/worldBindings';

const LINKS_KEY = 'sfh:office-bots:v1';
type BotLink = { agentId?: string; aiOn?: boolean };
const loadLinks = (): Record<string, BotLink> => { try { return JSON.parse(localStorage.getItem(LINKS_KEY) || '{}'); } catch { return {}; } };
const enc = new TextEncoder(), dec = new TextDecoder();

async function callAgentsApi(body: Record<string, unknown>): Promise<any> {
  const { data, error } = await supabase.functions.invoke('call-agents', { body });
  if (error) {
    let message = error.message;
    try { const parsed = await (error as any).context?.json?.(); if (parsed?.error) message = parsed.error; } catch {}
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

type OfficeTheater = TheaterSource | { kind: 'dashboard'; botKey: string; by: string; agentName?: string } | null;

/* ---------------- Bots: rig-controller driven co-workers ----------------
 * Each bot runs a small behavior controller on top of the rig (founder
 * directive 2026-10-25): on a job it SITS at its desk and TYPES (a real
 * Sitting clip where the body has one, the calibrated seated-legs pose
 * otherwise, plus a calibrated arm pose stamped after the mixer so the
 * hands work the keyboard); off a job it gets up, strolls the office
 * corridors to a window/aisle spot, hangs around (idle, the odd wave),
 * then walks back and sits down again. A bot whose linked agent produced
 * a run in the last few minutes is PINNED to its desk — it is on a job. */
const botPos = new Map<string, THREE.Vector3>();
/* Roam budget (founder directive 2026-10-25): at most 2 bots are on
 * their feet at any moment — everyone else stays at their desk. This is
 * what stops the whole floor parading through the same aisles, crossing
 * each other and the desks, and it keeps the frame rate up. */
const roamSlots = new Set<string>();
const ROAM_MAX = 2;

const hashStr = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); };
const AISLE_Z = [-7, 0, 7];
/** Desk-safe route: out to the nearest aisle, along it, then in — the desk
 * banks (rows at z ±3.5/±10.5, columns every 8 in x) are never crossed. */
function officePath(from: { x: number; z: number }, to: { x: number; z: number }): [number, number][] {
  const nearest = (z: number) => AISLE_Z.reduce((b, a) => (Math.abs(a - z) < Math.abs(b - z) ? a : b), AISLE_Z[0]);
  const azF = nearest(from.z), azT = nearest(to.z);
  const raw: [number, number][] = [[from.x, azF], [to.x, azF], [to.x, azT], [to.x, to.z]];
  const out: [number, number][] = [];
  let px = from.x, pz = from.z;
  for (const [x, z] of raw) { if (Math.hypot(x - px, z - pz) > 0.35) { out.push([x, z]); px = x; pz = z; } }
  if (Math.hypot(to.x - px, to.z - pz) > 0.05) out.push([to.x, to.z]);
  return out;
}

const boneByName = (rootObj: THREE.Object3D, pats: string[]) => {
  let f: any = null;
  rootObj.traverse((o: any) => { if (!f && o.isBone && pats.some((p) => o.name.toLowerCase().includes(p))) f = o; });
  return f;
};
// Typing pose temps (v3): the seated typing motion SETS each forearm's
// quaternion from a captured base pose every frame — base × a small slow
// up/down bob. Nothing accumulates, nothing can spin: the old calibrated
// per-frame stamp multiplied rotations into bones the sit clip never
// resets, which wound the arms up like fans.
const _tq = new THREE.Quaternion();
const _AXIS_X = new THREE.Vector3(1, 0, 0);
const _AXIS_Y = new THREE.Vector3(0, 1, 0);

/* Character tap targets (founder report 2026-10-26: mesh onClick was
 * unreliable — the camera drag races it on desktop and eats it on
 * mobile, so panels seemed not to open at all). Characters register
 * their group here; a single canvas-level tap detector (BotTapRaycast)
 * decides tap vs drag by movement + duration and raycasts ONLY on a
 * true tap — the same press that rotates the camera can never also
 * open a panel, and a clean tap always lands, mouse or finger. */
export const botTapTargets = new Map<string, { obj: THREE.Object3D; bot: OfficeBot; onOpen: (b: OfficeBot) => void }>();

export function BotTapRaycast() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const down = useRef<{ x: number; y: number; t: number } | null>(null);
  useEffect(() => {
    const el = gl.domElement;
    const pd = (e: PointerEvent) => { down.current = { x: e.clientX, y: e.clientY, t: performance.now() }; };
    const pu = (e: PointerEvent) => {
      const d = down.current; down.current = null;
      if (!d) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10 || performance.now() - d.t > 500) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      const rc = new THREE.Raycaster();
      rc.setFromCamera(ndc, camera);
      const objs = Array.from(botTapTargets.values()).map((x) => x.obj);
      if (!objs.length) return;
      const hits = rc.intersectObjects(objs, true);
      if (!hits.length) return;
      let o: THREE.Object3D | null = hits[0].object;
      while (o) {
        const key = (o as any).userData?.botTapKey as string | undefined;
        if (key) { const t = botTapTargets.get(key); if (t) t.onOpen(t.bot); return; }
        o = o.parent;
      }
    };
    el.addEventListener('pointerdown', pd);
    el.addEventListener('pointerup', pu);
    return () => { el.removeEventListener('pointerdown', pd); el.removeEventListener('pointerup', pu); };
  }, [camera, gl]);
  return null;
}

export function OfficeBotCharacter({ bot, home, rotY, seatY, onOpen, seated = true, roam = false, pinnedWork = false }: { bot: OfficeBot; home: [number, number, number]; rotY: number; seatY: number; onOpen: (b: OfficeBot) => void; seated?: boolean; roam?: boolean; pinnedWork?: boolean }) {
  const { scene, animations } = useGLTF(bot.model);
  const model = useMemo(() => {
    const m = skeletonClone(scene) as THREE.Object3D;
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m);
    const h = box.max.y - box.min.y || 1;
    const s = 1.8 / h;
    m.scale.setScalar(s);
    m.position.y = -box.min.y * s;
    const skin = new THREE.Color(bot.tint);
    // Frustum culling ON with a generous static sphere (box is measured in
    // model space, before scaling): off-screen bots skip their 266k-vert
    // skinning entirely. The sphere is padded 1.6x so animated limbs can
    // never pop out of it. The geometry is shared by every clone, so the
    // first bot to load sets it for all.
    const cullCenter = box.getCenter(new THREE.Vector3());
    const cullRadius = (box.getSize(new THREE.Vector3()).length() / 2) * 1.6;
    m.traverse((o: any) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = true; if (o.geometry && !o.geometry.boundingSphere) o.geometry.boundingSphere = new THREE.Sphere(cullCenter, cullRadius); const mats = Array.isArray(o.material) ? o.material : [o.material]; const next = mats.map((mt: any) => { const c = mt.clone(); if (c.color && !c.map) c.color.copy(skin); if (c.isMeshStandardMaterial) { if (c.metalness > 0.6) c.metalness = 0.5; c.roughness = Math.max(c.roughness ?? 0.5, 0.35); c.envMapIntensity = 1.35; } return c; }); o.material = Array.isArray(o.material) ? next : next[0]; } });
    return m;
  }, [scene, bot]);
  const root = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, root);
  const seed = useMemo(() => hashStr(bot.key), [bot.key]);
  const clipOf = useMemo(() => ({
    sit: names.find((x) => /sitting/i.test(x)) ?? null,
    idle: names.find((x) => /idle/i.test(x)) ?? names[0] ?? null,
    walk: names.find((x) => /walk/i.test(x) && !/jump/i.test(x)) ?? null,
    wave: names.find((x) => /^wave$/i.test(x)) ?? null,
  }), [names]);
  const curClip = useRef<string | null>(null);
  const playClip = (name: string | null, once = false) => {
    if (!name) return;
    const a = actions[name]; if (!a) return;
    if (curClip.current === name) {
      // Already the active clip: a clamped one-shot (Sitting) holds its final
      // frame — never restart it. A looping clip restarts only if it stopped.
      if (!once && !a.isRunning()) { a.reset().fadeIn(0.2).play(); }
      return;
    }
    Object.values(actions).forEach((x) => { if (x && x !== a) x.fadeOut(0.25); });
    a.reset();
    if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else { a.setLoop(THREE.LoopRepeat, Infinity); a.clampWhenFinished = false; }
    a.fadeIn(0.25).play();
    curClip.current = name;
  };
  const st = useRef({
    phase: 'work' as 'work' | 'walk' | 'hang',
    t: 18 + (seed % 30),                 // seconds left in the current phase
    path: [] as [number, number][],
    after: 'hang' as 'hang' | 'work',
    waved: false,
  });
  const pinnedRef = useRef(pinnedWork); pinnedRef.current = pinnedWork;
  const [status, setStatus] = useState<'Working' | 'Walking' | 'On a break'>('Working');
  const setPhase = (p: 'work' | 'walk' | 'hang') => { st.current.phase = p; setStatus(p === 'work' ? 'Working' : p === 'walk' ? 'Walking' : 'On a break'); };
  const legsPoseRef = useRef<any[] | null>(null);
  const legsTriedRef = useRef(0);
  const typePoseRef = useRef<any | undefined>(undefined);
  useEffect(() => { botPos.set(bot.key, new THREE.Vector3(home[0], 0, home[2])); return () => { botPos.delete(bot.key); roamSlots.delete(bot.key); }; }, [bot.key]); // eslint-disable-line
  /* Register as a tap target for BotTapRaycast (replaces the old mesh
   * onClick, which the camera drag raced and mobile taps lost). */
  useEffect(() => {
    const g = root.current; if (!g) return;
    (g as any).userData.botTapKey = bot.key;
    botTapTargets.set(bot.key, { obj: g, bot, onOpen });
    return () => { if (botTapTargets.get(bot.key)?.obj === g) botTapTargets.delete(bot.key); };
  }, [bot, onOpen]);
  useFrame((state, dtRaw) => {
    const g = root.current; if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const s = st.current;
    // SEAT SNAP (founder directive 2026-10-25): the Sitting clip's final
    // frame puts the belly's underside 0.111 BELOW the group origin, so a
    // group left at floor level buries the body in the floor and the chair
    // vanishes inside it. When seated, lift the group so the belly rests
    // exactly ON the chair's seat top (the seatY prop) — the little legs
    // dangle in front of the chair, as stub legs should.
    // GROUND SNAP (founder report 2026-10-26): the model's static-pose
    // grounding leaves the ANIMATED feet a few cm under the floor — the
    // idle/walk clips plant lower than the bind pose the memo measured.
    // While standing, sample the skinned bounding box once per phase and
    // lift the group so the lowest vertex rests exactly on y=0.
    {
      const sitting = s.phase === 'work' && seated && clipOf.sit;
      let targetY = sitting ? seatY + 0.111 : 0;
      if (!sitting) {
        // CONTINUOUS deepest-point tracking (founder report 2026-10-26:
        // floor 99 fixed, floor 100 not). The old sampler measured ONCE
        // per phase and clamped the lift at 0.12 — the floor-100
        // executives'/manager's models dip DEEPER than that in their
        // idle cycle, so their feet stayed buried. Now: while standing,
        // re-measure every ~0.12s and keep the lift that satisfies the
        // DEEPEST point ever seen, up to 0.30.
        (s as any).groundAcc = ((s as any).groundAcc ?? 0) + dt;
        if ((s as any).groundAcc > 0.12) {
          (s as any).groundAcc = 0;
          try {
            const b = new THREE.Box3().setFromObject(model);
            if (isFinite(b.min.y)) {
              const need = g.position.y - b.min.y;
              (s as any).groundLift = Math.max((s as any).groundLift ?? 0, Math.max(0, Math.min(0.3, need)));
            }
          } catch { /* keep the previous lift */ }
        }
        targetY = (s as any).groundLift ?? 0;
      }
      g.position.y += (targetY - g.position.y) * Math.min(1, dt * 5);
    }
    const pos = { x: g.position.x, z: g.position.z };
    // A fresh job pins the bot to its desk, from wherever it is.
    if (pinnedRef.current && s.phase === 'hang') { s.path = officePath(pos, { x: home[0], z: home[2] }); s.after = 'work'; setPhase('walk'); }
    if (s.phase === 'work') {
      // Sit (clip clamped on its last frame, or the procedural legs pose)
      // and TYPE: a small slow forearm bob set from the clip's pose (see
      // the typing block below) — never an accumulated stamp.
      if (seated) {
        if (clipOf.sit) playClip(clipOf.sit, true);
        else {
          if (!legsPoseRef.current && legsTriedRef.current < 5) {
            legsTriedRef.current += 1;
            g.updateMatrixWorld(true);
            try { legsPoseRef.current = buildSeatedLegsPose(model, { forward: new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY)), seatHeight: seatY }); } catch { legsPoseRef.current = null; }
          }
          if (legsPoseRef.current) { playClip(clipOf.idle); applyPose(model as any, legsPoseRef.current as any); }
          else playClip(clipOf.idle);
        }
        // SEATED = RIGID (founder directive 2026-10-25): while seated the
        // body does not bend or move at all — only the legs ever move, and
        // only for walking/running. The v3 typing bob and head sway are
        // therefore ZEROED (amplitudes kept as literals so the motion can
        // be restored by changing two numbers); the block below now just
        // re-sets the captured base pose every frame.
        if (typePoseRef.current === undefined) {
          const fl = boneByName(model, ['leftforearm', 'leftlowerarm']);
          const fr = boneByName(model, ['rightforearm', 'rightlowerarm']);
          const head = boneByName(model, ['head']);
          typePoseRef.current = (fl && fr) ? { fl, fr, head, baseL: null, baseR: null, baseH: null, locked: false, since: state.clock.elapsedTime } : null;
        }
        const tp = typePoseRef.current;
        if (tp) {
          const t = state.clock.elapsedTime;
          if (!tp.locked) {
            // Re-capture the clip's own pose while the sit transition
            // settles, then lock it as the base for the whole session.
            tp.baseL = tp.fl.quaternion.clone(); tp.baseR = tp.fr.quaternion.clone();
            tp.baseH = tp.head ? tp.head.quaternion.clone() : null;
            if (t - tp.since > 1.2) tp.locked = true;
          }
          _tq.setFromAxisAngle(_AXIS_X, Math.sin(t * 2.3) * 0);
          tp.fl.quaternion.copy(tp.baseL).multiply(_tq);
          _tq.setFromAxisAngle(_AXIS_X, Math.sin(t * 2.3 + Math.PI) * 0);
          tp.fr.quaternion.copy(tp.baseR).multiply(_tq);
          if (tp.head && tp.baseH) {
            _tq.setFromAxisAngle(_AXIS_Y, Math.sin(t * 0.43 + seed) * 0);
            tp.head.quaternion.copy(tp.baseH).multiply(_tq);
            _tq.setFromAxisAngle(_AXIS_X, Math.sin(t * 0.31 + seed * 1.7) * 0);
            tp.head.quaternion.multiply(_tq);
          }
        }
      } else {
        playClip(clipOf.idle);
      }
      let dyaw = rotY - g.rotation.y; while (dyaw > Math.PI) dyaw -= Math.PI * 2; while (dyaw < -Math.PI) dyaw += Math.PI * 2;
      g.rotation.y += dyaw * Math.min(1, dt * 6);
      s.t -= dt;
      if (s.t <= 0 && roam && !pinnedRef.current) {
        if (!roamSlots.has(bot.key) && roamSlots.size >= ROAM_MAX) {
          // The room already has its walkers — stay at the desk and
          // check again in a while instead of joining the parade.
          s.t = 14 + (seed % 16);
        } else {
          // Stroll LOCALLY: the standing spot nearest this bot's own
          // desk (or a point in its own aisle when every spot is far),
          // so trips are short and neighborhoods don't collide.
          let wp = OFFICE_WAYPOINTS[0]; let bd = Infinity;
          for (const w of OFFICE_WAYPOINTS) { const d = Math.hypot(w[0] - home[0], w[1] - home[2]); if (d < bd) { bd = d; wp = w; } }
          const target = bd <= 9
            ? { x: wp[0], z: wp[1] }
            : { x: home[0] + ((seed % 5) - 2) * 1.2, z: AISLE_Z.reduce((b, a) => (Math.abs(a - home[2]) < Math.abs(b - home[2]) ? a : b), AISLE_Z[0]) };
          s.path = officePath(pos, target);
          s.after = 'hang'; s.waved = false;
          if (s.path.length) { roamSlots.add(bot.key); setPhase('walk'); } else { s.t = 8; }
        }
      }
    } else if (s.phase === 'walk') {
      typePoseRef.current = undefined; // re-capture the typing base next sit
      playClip(clipOf.walk || clipOf.idle);
      const target = s.path[0];
      if (!target) { const arrived = s.after; setPhase(arrived === 'hang' ? 'hang' : 'work'); s.t = arrived === 'hang' ? 5 + (seed % 6) : 60 + (seed % 55); if (arrived === 'work') roamSlots.delete(bot.key); }
      else {
        const dx = target[0] - pos.x, dz = target[1] - pos.z;
        const dist = Math.hypot(dx, dz);
        // Separation: never walk through another character. Slow down
        // when one is close; when one is right in the way, the bot
        // whose key sorts later waits (the other never waits for it,
        // so two bots can never deadlock face to face).
        let speed = 1.3;
        for (const [k, p] of botPos) {
          if (k === bot.key) continue;
          const d = Math.hypot(p.x - pos.x, p.z - pos.z);
          if (d < 1.7) speed = Math.min(speed, 0.55);
          if (d < 0.8 && roamSlots.has(k) && k < bot.key) { speed = 0; break; }
        }
        const step = Math.min(dist, dt * speed);
        if (dist > 0.02) {
          g.position.x += (dx / dist) * step;
          g.position.z += (dz / dist) * step;
          const targetYaw = Math.atan2(dx, dz);
          let dyaw = targetYaw - g.rotation.y; while (dyaw > Math.PI) dyaw -= Math.PI * 2; while (dyaw < -Math.PI) dyaw += Math.PI * 2;
          g.rotation.y += dyaw * Math.min(1, dt * 8);
        }
        if (dist <= 0.06) s.path.shift();
      }
    } else {
      typePoseRef.current = undefined; // re-capture the typing base next sit
      // Hanging around: idle, a slow look around the room, the odd wave.
      if (clipOf.wave && !s.waved && seed % 2 === 0) { s.waved = true; playClip(clipOf.wave, true); }
      else {
        const wa = clipOf.wave ? actions[clipOf.wave] : null;
        if (!(wa && wa.isRunning() && wa.time < wa.getClip().duration - 0.05)) playClip(clipOf.idle);
      }
      g.rotation.y = rotY + Math.sin(state.clock.elapsedTime * 0.35 + seed) * 0.45;
      s.t -= dt;
      if (s.t <= 0) { s.path = officePath(pos, { x: home[0], z: home[2] }); s.after = 'work'; if (s.path.length) setPhase('walk'); else { setPhase('work'); roamSlots.delete(bot.key); s.t = 60 + (seed % 55); } }
    }
    // Mutate the stored vector in place — no per-frame allocation.
    const bp = botPos.get(bot.key);
    if (bp) { bp.x = g.position.x; bp.y = 0; bp.z = g.position.z; }
    else botPos.set(bot.key, new THREE.Vector3(g.position.x, 0, g.position.z));
  });
  const dot = status === 'Working' ? '#34d399' : status === 'Walking' ? '#38bdf8' : '#fbbf24';
  return (
    <group ref={root} position={home} rotation={[0, rotY, 0]}>
      <primitive object={model} />
      <Html position={[0, 1.52, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 5, font: '600 11px system-ui', lineHeight: 1.25, color: '#fff', background: 'rgba(5,10,20,.62)', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: dot, display: 'inline-block' }} />{bot.name} · {status}
        </div>
      </Html>
    </group>
  );
}

/* ---------------- Social presence (Plaza parity) ---------------- */
type PeerInfo = { x: number; z: number; ry: number; m: boolean; n: string; c: string; s?: boolean };
const PEER_COLORS = ['#f59e0b', '#38bdf8', '#a78bfa', '#34d399', '#fb7185', '#facc15', '#f472b6', '#4ade80'];
const colorFor = (id: string) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0; return PEER_COLORS[Math.abs(h) % PEER_COLORS.length]; };
const playerYaw = { current: 0 };

function PeerAvatar({ info, speaking }: { info: PeerInfo; speaking: boolean }) {
  const { scene, animations } = useGLTF('/models/plaza/Xbot.glb');
  const model = useMemo(() => {
    const m = skeletonClone(scene) as THREE.Object3D;
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m);
    const h = box.max.y - box.min.y || 1;
    const s = 1.8 / h;
    m.scale.setScalar(s);
    m.position.y = -box.min.y * s;
    const skin = new THREE.Color(info.c);
    const cullCenter = box.getCenter(new THREE.Vector3());
    const cullRadius = (box.getSize(new THREE.Vector3()).length() / 2) * 1.6;
    m.traverse((o: any) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = true; if (o.geometry && !o.geometry.boundingSphere) o.geometry.boundingSphere = new THREE.Sphere(cullCenter, cullRadius); const mats = Array.isArray(o.material) ? o.material : [o.material]; const next = mats.map((mt: any) => { const c = mt.clone(); if (c.color && !c.map) c.color.copy(skin); return c; }); o.material = Array.isArray(o.material) ? next : next[0]; } });
    return m;
  }, [scene, info.c]);
  const root = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, root);
  const peerSitHeld = useRef(false);
  const peerGroundSampler = useRef(makeGroundSampler());
  const cur = useRef(new THREE.Vector3(info.x, 0, info.z));
  useFrame((_, dt) => {
    const g = root.current; if (!g) return;
    if (!info.s) {
      const lift = peerGroundSampler.current(model, Math.min(dt, 0.05));
      if (lift !== null && lift > 0) model.position.y += lift;
    }
    const k = Math.min(1, dt * 8);
    cur.current.x += (info.x - cur.current.x) * k;
    cur.current.z += (info.z - cur.current.z) * k;
    g.position.set(cur.current.x, info.s ? 0.671 : 0, cur.current.z);
    let diff = info.ry - g.rotation.y; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
    g.rotation.y += diff * k;
    if (info.s) {
      // Seated peer: the sitting clip plays once and holds its last
      // frame (same law as the bots and the local player).
      const sit = names.find((x) => /sitting/i.test(x)) ?? null;
      const a = sit ? actions[sit] : null;
      if (a && !peerSitHeld.current) {
        peerSitHeld.current = true;
        Object.values(actions).forEach((x) => { if (x && x !== a) x.fadeOut(0.2); });
        a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true;
        a.reset().fadeIn(0.2).play();
      }
      return;
    }
    peerSitHeld.current = false;
    const clip = info.m ? (names.find((x) => /walk/i.test(x)) ?? names[0]) : (names.find((x) => /idle/i.test(x)) ?? names[0]);
    const a = clip ? actions[clip] : undefined;
    if (a && !a.isRunning()) { Object.values(actions).forEach((x) => x?.fadeOut(0.2)); a.reset().fadeIn(0.2).play(); }
  });
  return (
    <group ref={root} position={[info.x, 0, info.z]}>
      <primitive object={model} />
      <Html position={[0, 2.02, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'none', font: '600 11px system-ui', lineHeight: 1.25, color: '#fff', background: speaking ? 'rgba(16,185,129,.88)' : 'rgba(5,10,20,.62)', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>{info.n}</div>
      </Html>
    </group>
  );
}

/* ---------------- Player ---------------- */
const playerPos = new THREE.Vector3(4, 0, 0);

function Proximity({ onNear }: { onNear: (key: string | null) => void }) {
  const last = useRef<string | null>(null);
  const acc = useRef(0);
  useFrame((_, dt) => {
    acc.current += dt; if (acc.current < 0.2) return; acc.current = 0;
    let best: string | null = null; let bd = 3.4;
    botPos.forEach((p, key) => { const d = Math.hypot(p.x - playerPos.x, p.z - playerPos.z); if (d < bd) { bd = d; best = key; } });
    if (best !== last.current) { last.current = best; onNear(best); }
  });
  return null;
}

/* ---------------- Theater screen (north wall) ---------------- */
/* ---------------- Account branding ----------------
   The office wears the signed-in account's identity: a startup sees its own
   company name + logo, an investor (no company on file) sees their own name.
   Signed out it falls back to Startup Factory Hub. Never "Muse HQ". */
export interface OfficeBrand { name: string; logoUrl: string | null; kind: 'company' | 'person' | 'guest' }
const SFH_BRAND: OfficeBrand = { name: 'Startup Factory Hub', logoUrl: null, kind: 'guest' };
let cachedBrand: OfficeBrand | null = null;
let brandPromise: Promise<OfficeBrand> | null = null;
export function loadOfficeBrand(): Promise<OfficeBrand> {
  if (cachedBrand) return Promise.resolve(cachedBrand);
  if (!brandPromise) {
    brandPromise = (async () => {
      try {
        const { data: ss } = await supabase.auth.getSession();
        const uid = ss.session?.user?.id;
        if (!uid) { cachedBrand = SFH_BRAND; return cachedBrand; }
        const [{ data: comp }, { data: prof }] = await Promise.all([
          supabase.from('companies').select('name, logo_url').eq('user_id', uid).order('created_at', { ascending: true }).limit(1).maybeSingle(),
          supabase.from('profiles').select('full_name, avatar_url').eq('id', uid).maybeSingle(),
        ]);
        if ((comp as any)?.name) cachedBrand = { name: (comp as any).name, logoUrl: (comp as any).logo_url || null, kind: 'company' };
        else if ((prof as any)?.full_name) cachedBrand = { name: (prof as any).full_name, logoUrl: (prof as any).avatar_url || null, kind: 'person' };
        else cachedBrand = SFH_BRAND;
      } catch { cachedBrand = SFH_BRAND; }
      return cachedBrand;
    })();
  }
  return brandPromise;
}
export function useOfficeBrand(): OfficeBrand {
  const [brand, setBrand] = useState<OfficeBrand>(cachedBrand ?? SFH_BRAND);
  useEffect(() => { let live = true; loadOfficeBrand().then((b) => { if (live) setBrand(b); }); return () => { live = false; }; }, []);
  /* Warm the voice engine (worker + speech model) as soon as the
   * office opens — by the time she opens a chat and taps Talk, the
   * cold start is already paid. */
  useEffect(() => { warmVoice(); }, []);
  return brand;
}

/* Theater canvas helpers — the Agents tab's glass-widget look, drawn. */
function glassCard(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 20) {
  g.beginPath(); g.roundRect(x, y, w, h, r);
  g.fillStyle = 'rgba(255,255,255,.055)'; g.fill();
  g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1.5; g.stroke();
}
function truncToWidth(g: CanvasRenderingContext2D, text: string, maxW: number): string {
  const t = String(text || '');
  if (g.measureText(t).width <= maxW) return t;
  let lo = 0, hi = t.length;
  while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (g.measureText(`${t.slice(0, mid)}…`).width <= maxW) lo = mid; else hi = mid - 1; }
  return `${t.slice(0, lo)}…`;
}
export type BoardRow = { bot: OfficeBot; working: boolean; current: string; queued: number; done: number };

export function OfficeTheaterScreen({ source, screenBot, screenLink, screenAgent, screenRuns, board, screenQueue, onPages }: {
  source: OfficeTheater;
  screenBot: OfficeBot | null; screenLink: BotLink; screenAgent: any; screenRuns: any[];
  board: BoardRow[]; screenQueue: any[];
  onPages: (n: number) => void;
}) {
  const texSrc = source && source.kind !== 'dashboard' ? (source as TheaterSource) : null;
  const { tex, pages } = useSourceTexture(texSrc);
  useEffect(() => { onPages(pages); }, [pages]); // eslint-disable-line
  const brand = useOfficeBrand();
  /* DEFAULT theater face (founder directive 2026-10-25): a board of ALL
   * agents' tasks and queues, in the Agents tab's glass style, until the
   * user takes over and presents something else. */
  const boardTex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 1600; c.height = 600;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 600); grad.addColorStop(0, '#08131f'); grad.addColorStop(1, '#050b14');
    g.fillStyle = grad; g.fillRect(0, 0, 1600, 600);
    const strip = g.createLinearGradient(0, 0, 1600, 0); strip.addColorStop(0, '#22d3ee'); strip.addColorStop(1, '#34d399');
    g.fillStyle = strip; g.fillRect(0, 0, 1600, 6);
    g.textAlign = 'left'; g.fillStyle = '#eef4ff'; g.font = '700 34px system-ui, sans-serif';
    g.fillText('Team board', 48, 60);
    g.font = '400 21px system-ui, sans-serif'; g.fillStyle = 'rgba(230,240,255,.55)';
    g.fillText('All agents · tasks & queue', 48, 92);
    g.textAlign = 'right'; g.font = '600 20px system-ui, sans-serif'; g.fillStyle = 'rgba(230,240,255,.5)';
    g.fillText(String(brand.name || '').toUpperCase().slice(0, 40), 1552, 56);
    g.textAlign = 'left';
    const cols = 5, cw = 288, ch = 104, gx = 16, gy = 12, x0 = 48, y0 = 116;
    board.slice(0, 20).forEach((row, i) => {
      const x = x0 + (i % cols) * (cw + gx), y = y0 + Math.floor(i / cols) * (ch + gy);
      glassCard(g, x, y, cw, ch, 18);
      g.beginPath(); g.arc(x + 24, y + 27, 8, 0, Math.PI * 2); g.fillStyle = row.bot.tint; g.fill();
      g.font = '600 24px system-ui, sans-serif'; g.fillStyle = '#eef4ff';
      g.fillText(truncToWidth(g, row.bot.name, cw - 110), x + 42, y + 35);
      if (row.queued > 0) {
        g.beginPath(); g.roundRect(x + cw - 56, y + 13, 44, 27, 13);
        g.fillStyle = 'rgba(251,191,36,.16)'; g.fill(); g.strokeStyle = 'rgba(251,191,36,.55)'; g.lineWidth = 1.2; g.stroke();
        g.font = '600 17px system-ui, sans-serif'; g.fillStyle = '#fbbf24'; g.textAlign = 'center';
        g.fillText(`+${row.queued}`, x + cw - 34, y + 32); g.textAlign = 'left';
      }
      if (row.working) {
        g.beginPath(); g.arc(x + 24, y + 58, 5, 0, Math.PI * 2); g.fillStyle = '#34d399'; g.fill();
        g.font = '600 16px system-ui, sans-serif'; g.fillStyle = '#34d399'; g.fillText('WORKING', x + 37, y + 63);
      } else {
        g.font = '600 16px system-ui, sans-serif'; g.fillStyle = 'rgba(230,240,255,.4)'; g.fillText('IDLE', x + 19, y + 63);
      }
      if (row.done > 0) {
        g.font = '500 16px system-ui, sans-serif'; g.fillStyle = 'rgba(230,240,255,.5)'; g.textAlign = 'right';
        g.fillText(`✓ ${row.done}`, x + cw - 14, y + 63); g.textAlign = 'left';
      }
      g.font = '400 20px system-ui, sans-serif'; g.fillStyle = 'rgba(230,240,255,.82)';
      g.fillText(truncToWidth(g, row.current, cw - 36), x + 18, y + 90);
    });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [board, brand]);
  useEffect(() => () => { boardTex?.dispose(); }, [boardTex]);
  const isDash = source?.kind === 'dashboard';
  /* Dashboards are drawn INTO the screen as a texture (founder directive
   * 2026-10-25) — no floating widget in front of the glass. */
  /* An agent on the theater = its task ROADMAP (founder directive
   * 2026-10-25): queued → in progress → done as glass cards in the
   * Agents tab style, task titles only — very little text. */
  const dashTex = useMemo(() => {
    if (!isDash || !screenBot) return null;
    const c = document.createElement('canvas'); c.width = 1600; c.height = 600;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 600); grad.addColorStop(0, '#08131f'); grad.addColorStop(1, '#050b14');
    g.fillStyle = grad; g.fillRect(0, 0, 1600, 600);
    g.fillStyle = screenBot.tint; g.fillRect(0, 0, 1600, 6);
    g.beginPath(); g.arc(62, 60, 17, 0, Math.PI * 2); g.fillStyle = screenBot.tint; g.fill();
    g.fillStyle = '#eef4ff'; g.font = '700 46px system-ui, sans-serif'; g.textAlign = 'left';
    g.fillText(truncToWidth(g, screenBot.name, 700), 96, 76);
    g.textAlign = 'right'; g.font = '600 20px system-ui, sans-serif'; g.fillStyle = 'rgba(230,240,255,.5)';
    g.fillText(`${brand.name} · ROADMAP`.toUpperCase().slice(0, 44), 1552, 66);
    g.textAlign = 'left';
    const running = screenRuns.filter((r: any) => r.status !== 'ok' && r.status !== 'error');
    const doneRuns = screenRuns.filter((r: any) => r.status === 'ok' || r.status === 'error');
    const lanes: { title: string; count: number; items: { text: string; color: string }[] }[] = [
      { title: 'Q U E U E D', count: screenQueue.length, items: screenQueue.map((i: any) => ({ text: String(i.message || 'Task'), color: '#fbbf24' })) },
      { title: 'I N   P R O G R E S S', count: running.length, items: running.map((r: any) => ({ text: String(r.input || 'Task'), color: '#38bdf8' })) },
      { title: 'D O N E', count: doneRuns.length, items: doneRuns.map((r: any) => ({ text: String(r.input || 'Task'), color: r.status === 'ok' ? '#34d399' : '#f87171' })) },
    ];
    const cw = 472, chh = 392, y0 = 118, xs = [48, 564, 1080];
    lanes.forEach((lane, li) => {
      const x = xs[li];
      glassCard(g, x, y0, cw, chh, 22);
      g.font = '600 20px system-ui, sans-serif'; g.fillStyle = 'rgba(230,240,255,.6)';
      g.fillText(lane.title, x + 28, y0 + 44);
      g.font = '700 52px system-ui, sans-serif'; g.fillStyle = '#eef4ff'; g.textAlign = 'right';
      g.fillText(String(lane.count), x + cw - 26, y0 + 58); g.textAlign = 'left';
      let iy = y0 + 108;
      if (!lane.items.length) {
        g.font = '400 26px system-ui, sans-serif'; g.fillStyle = 'rgba(230,240,255,.35)';
        g.fillText('—', x + 28, iy);
      }
      for (const it of lane.items.slice(0, 4)) {
        g.beginPath(); g.arc(x + 34, iy - 8, 7, 0, Math.PI * 2); g.fillStyle = it.color; g.fill();
        g.font = '500 25px system-ui, sans-serif'; g.fillStyle = '#eef4ff';
        g.fillText(truncToWidth(g, it.text, cw - 84), x + 54, iy);
        iy += 64;
      }
      if (li < 2) {
        g.font = '400 62px system-ui, sans-serif'; g.fillStyle = 'rgba(230,240,255,.35)'; g.textAlign = 'center';
        g.fillText('›', xs[li] + cw + 22, y0 + chh / 2 + 22); g.textAlign = 'left';
      }
    });
    g.font = '400 19px system-ui, sans-serif'; g.fillStyle = 'rgba(230,240,255,.4)';
    g.fillText(`${brand.name} · Floor 100`, 48, 566);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [isDash, screenBot, screenRuns, screenQueue, brand]);
  useEffect(() => () => { dashTex?.dispose(); }, [dashTex]);
  /* Aspect-correct fit (founder directive 2026-10-25: the screen DEFORMED
   * content): the texture keeps its own aspect and letterboxes inside the
   * bezel instead of stretching to the glass. Video dimensions arrive
   * async, so they are tracked in state. */
  const [vidAsp, setVidAsp] = useState(0);
  useEffect(() => {
    setVidAsp(0);
    if (!texSrc || texSrc.kind !== 'video') return;
    const v = texSrc.el;
    const upd = () => { if (v.videoWidth && v.videoHeight) setVidAsp(v.videoWidth / v.videoHeight); };
    upd();
    v.addEventListener('loadeddata', upd); v.addEventListener('resize', upd);
    return () => { v.removeEventListener('loadeddata', upd); v.removeEventListener('resize', upd); };
  }, [texSrc]);
  const activeTex = isDash ? (dashTex || boardTex) : source ? (tex || boardTex) : boardTex;
  const aspect = (() => {
    if (vidAsp && source && source.kind !== 'dashboard') return vidAsp;
    const img: any = (activeTex as any)?.image;
    const w = img?.videoWidth || img?.width, h = img?.videoHeight || img?.height;
    return w && h ? w / h : 1600 / 600;
  })();
  const SCREEN_A = 15.35 / 5.75;
  const fitSx = aspect < SCREEN_A ? aspect / SCREEN_A : 1;
  const fitSy = aspect < SCREEN_A ? 1 : SCREEN_A / aspect;
  return (
    <group position={[0, 3.6, -15.55]}>
      <mesh position={[0, 0, -0.16]}><boxGeometry args={[15.9, 6.2, 0.18]} /><meshStandardMaterial color="#14171c" /></mesh>
      <mesh scale={[fitSx, fitSy, 1]}>
        <planeGeometry args={[15.35, 5.75]} />
        <meshBasicMaterial map={activeTex} toneMapped={false} />
      </mesh>
      {source && !isDash && (
        <Html position={[0, -3.85, 0.2]} center distanceFactor={18} style={{ pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'none', whiteSpace: 'nowrap', borderRadius: 999, background: 'rgba(5,10,20,.7)', color: '#fff', padding: '3px 10px', font: '500 12px system-ui' }}>Presenting: {(source as any).by}</div>
        </Html>
      )}
    </group>
  );
}

function TheaterMenuItem({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs hover:bg-muted text-left">
      <Icon className="w-4 h-4 shrink-0" />{label}
    </button>
  );
}

/* ---------------- Per-agent panel ----------------
 * What a bot click opens (founder directive 2026-10-25): the Agents tab's
 * OWN widgets — the same glass panels, inputs, labels and gradient buttons
 * as SFHCallAgents — arranged as a chat with THIS bot's agent, the real
 * Task Pipeline widget underneath, and one button into the entire Agents
 * tab. Clicking the bot already chose the agent, so there is no agent
 * picker anywhere in here: the page auto-binds the bot to its agent when
 * the panel opens (see ensureBotAgent). */
const GLASS_CSS = `
@keyframes ca-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes ca-fadeup {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ca-pulsering {
  0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.45); }
  70% { box-shadow: 0 0 0 12px rgba(16,185,129,0); }
  100% { box-shadow: 0 0 0 12px rgba(16,185,129,0); }
}
@keyframes ca-dashflow {
  to { stroke-dashoffset: -28; }
}
@keyframes ca-borderrun {
  0%, 100% { box-shadow: 0 0 0 1px rgba(16,185,129,0.25), 0 12px 40px rgba(16,185,129,0.10); }
  50% { box-shadow: 0 0 0 2px rgba(20,184,166,0.55), 0 12px 48px rgba(20,184,166,0.22); }
}
.ca-float { animation: ca-float 5.5s ease-in-out infinite; }
.ca-fadeup { animation: ca-fadeup 0.5s ease both; }
.ca-avatar-live { animation: ca-pulsering 1.4s ease-out infinite; }
.ca-running { animation: ca-borderrun 1.8s ease-in-out infinite; }
.ca-tilt { transition: transform 0.25s ease-out; transform-style: preserve-3d; will-change: transform; }
.ca-range { -webkit-appearance: none; appearance: none; height: 8px; border-radius: 9999px; outline: none; }
.ca-range::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 9999px;
  background: linear-gradient(135deg, #10b981, #14b8a6); border: 3px solid hsl(var(--background));
  box-shadow: 0 2px 10px rgba(16,185,129,0.45); cursor: pointer;
}
.ca-range::-moz-range-thumb {
  width: 22px; height: 22px; border-radius: 9999px;
  background: linear-gradient(135deg, #10b981, #14b8a6); border: 3px solid hsl(var(--background));
  box-shadow: 0 2px 10px rgba(16,185,129,0.45); cursor: pointer;
}
`;
const GLASS_PANEL =
  "rounded-[2rem] border border-border bg-card/70 shadow-[0_10px_40px_rgba(6,78,59,0.08)] backdrop-blur-xl";
const GLASS_INPUT =
  "rounded-2xl border-input bg-background/60 backdrop-blur transition focus-visible:ring-2 focus-visible:ring-emerald-400/60";
const FIELD_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";
const GRADIENT_BUTTON =
  "rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition hover:from-emerald-600 hover:to-teal-600 disabled:shadow-none";

function OfficeAgentPanel({ bot, link, agents, signedIn, working, onOpenConsole, docFloor, teamBots, onRename, onConfigure }: {
  bot: OfficeBot; link: BotLink; agents: any[]; signedIn: boolean; working: boolean;
  onOpenConsole: () => void;
  docFloor?: { floorKey: string; floorId: number; company: string } | null;
  /** Conversational rename/configure, resolved against the floor's
   * people (this bot, its teammates, the Manager). */
  teamBots?: OfficeBot[];
  onRename?: (botKey: string, name: string) => Promise<void>;
  onConfigure?: (botKey: string, cfg: { mission?: string; vision?: string; instructions?: string; model?: string }) => Promise<void>;
}) {
  const agentId = link.agentId;
  const linkedAgent = agents.find((a) => a.id === agentId);
  // The chat is ISOLATED full-screen (founder direction): the task pipeline
  // and the rest of the Agents tab live behind the Tasks button, never
  // stacked into the chat. The thread + composer are the shared AgentChat
  // (the one Genius-bubble-style UI every office agent uses).
  const [view, setView] = useState<'chat' | 'tasks'>('chat');
  useEffect(() => { setView('chat'); }, [bot.key]);
  if (view === 'tasks') {
    return (
      <div className="flex h-full w-full min-w-0 flex-col bg-background text-foreground">
        <style>{GLASS_CSS}</style>
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
          <button onClick={() => setView('chat')} className="flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"><ChevronLeft className="h-4 w-4" />Chat</button>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Tasks — {linkedAgent?.name || bot.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">Queue work, watch it run, open finished results</div>
          </div>
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto overflow-x-clip overscroll-contain touch-pan-y px-4 py-4">
          {signedIn && agentId ? (
            <Suspense fallback={<p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading the pipeline…</p>}>
              <TaskPipeline agents={agents} onRunComplete={() => {}} />
            </Suspense>
          ) : (
            <p className="text-sm text-muted-foreground">{signedIn ? `Connecting ${bot.name} to its agent…` : `Sign in to hand ${bot.name} tasks.`}</p>
          )}
        </div>
        <div className="shrink-0 border-t border-border bg-background/80 px-4 py-3 backdrop-blur">
          <button onClick={onOpenConsole} className={`${GRADIENT_BUTTON} flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold`}>
            <LayoutDashboard className="h-4 w-4" />See the entire Agents tab
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full w-full min-w-0 flex-col bg-background text-foreground">
      <style>{GLASS_CSS}</style>
      <div className="shrink-0 px-4 pt-4">
        <div className={`${GLASS_PANEL} p-4 ca-fadeup`}>
          <div className={FIELD_LABEL}>This agent</div>
          <div className="mt-1.5 flex min-w-0 items-center gap-2">
            <span className="h-3 w-3 rounded-full shrink-0" style={{ background: bot.tint }} />
            <span className="min-w-0 truncate font-semibold">{linkedAgent?.name || bot.name}</span>
            <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${working ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{working ? 'On a job now' : 'Idle'}</span>
          </div>
          <p className="mt-1 break-words text-sm text-muted-foreground">{bot.duty}</p>
          {!signedIn && <p className="mt-2 text-xs text-muted-foreground">Sign in to chat with {bot.name} and hand it tasks.</p>}
          {signedIn && !agentId && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting {bot.name}…</p>}
        </div>
      </div>
      <div className="min-h-0 min-w-0 flex-1">
        <AgentChat
          key={bot.key}
          name={bot.name}
          onSend={async (text) => {
            if (!agentId) throw new Error('Still connecting to the agent — try again in a second.');
            const r = await callAgentsApi({ action: 'run', agent_id: agentId, message: text });
            return (r?.steps || []).map((x: any) => x.output).filter(Boolean).join('\n\n') || r?.output || 'Done.';
          }}
          emptyText={<>Chat with {bot.name} — give it a task below and it runs right here. For the task pipeline, tap <span className="font-medium text-foreground">Tasks</span>.</>}
          placeholder={`Give ${bot.name} a task…`}
          voiceAgentId={agentId}
          onAction={(d, { audit, report }) => {
            /* Conversational actions from a desk chat: delegate to
             * any of her agents by name, or route documents to the
             * Writer. Shifts/recruiting live with the Manager and
             * the executives — said honestly when asked here. */
            void (async () => {
              const runOut = (r: any) => (r?.steps || []).map((x: any) => x.output).filter(Boolean).join('\n\n') || r?.output || 'Done.';
              try {
                if (d.type === 'run_task') {
                  const want = String(d.agent || '').toLowerCase();
                  const target = !want || want === bot.name.toLowerCase()
                    ? (agentId ? { id: agentId, name: bot.name } : null)
                    : agents.find((a) => String(a.name || '').toLowerCase() === want || String(a.name || '').toLowerCase().includes(want));
                  if (!target) { audit(`⚙ No agent named "${String(d.agent || '')}" is linked yet.`); return; }
                  const task = String(d.task || '').trim();
                  audit(`⚙ ${target.name} is on it: ${task}`);
                  const out = runOut(await callAgentsApi({ action: 'run', agent_id: target.id, message: task }));
                  audit(`⚙ **${target.name} finished:**\n\n${out.slice(0, 1200)}`);
                  report(`${target.name} completed the task "${task}". Result summary: ${out.slice(0, 300)}`);
                } else if (d.type === 'build_document') {
                  const title = String(d.title || 'Untitled document');
                  const brief = String(d.brief || title);
                  const writer = agents.find((a) => /writer/i.test(String(a.name || '')));
                  audit(`⚙ The Writer is building **${title}** in LightPaper — it will arrive here when ready.`);
                  const doc = await buildDocument({
                    title,
                    brief,
                    authorRun: async () => writer
                      ? runOut(await callAgentsApi({ action: 'run', agent_id: writer.id, message: DOC_TASK(title, brief) }))
                      : authorViaLightPaper(title, brief),
                    floor: docFloor ?? null,
                  });
                  audit(documentDelivery(doc));
                  report(`The document "${doc.title}" is finished, saved in LightPaper, and delivered in the chat.`);
                } else if (d.type === 'rename' || d.type === 'configure') {
                  const want = String(d.agent || '').trim().toLowerCase();
                  const target = (!want || want === 'yourself' || want === bot.name.toLowerCase())
                    ? bot
                    : (teamBots || []).find((b) => b.name.toLowerCase() === want);
                  if (!target) { audit(`⚙ Nobody named "${String(d.agent || '')}" is on this floor.`); return; }
                  if (d.type === 'rename') {
                    const nn = String(d.name || '').trim();
                    if (!nn) { audit('⚙ The rename needs the new name.'); return; }
                    if (!onRename) { audit('⚙ Renaming is not available in this panel.'); return; }
                    await onRename(target.key, nn);
                    audit(`⚙ ${target.name} is now **${nn}** — renamed on their record and their agent.`);
                    report(`${target.name} was renamed to ${nn}, as you asked.`);
                  } else {
                    if (!onConfigure) { audit('⚙ Configuring is not available in this panel.'); return; }
                    await onConfigure(target.key, { mission: d.mission, vision: d.vision, instructions: d.instructions, model: d.model });
                    audit(`⚙ ${target.name}'s charter is updated — mission, vision and instructions now govern how they work.`);
                    report(`${target.name}'s charter was updated as you set it.`);
                  }
                } else if (d.type === 'navigate') {
                  const path = String(d.path || '');
                  if (path.startsWith('/')) { audit(`⚙ Opening ${path}…`); window.location.href = path; }
                  else audit('⚙ That destination does not look like a page path.');
                } else {
                  audit(`⚙ "${d.type}" runs from the Manager or the executive chairs — ask them and it happens from their chat.`);
                }
              } catch (e: any) {
                audit(`⚙ That action failed: ${e?.message || 'unknown error'}`);
              }
            })();
          }}
          disabledNote={!signedIn ? `Sign in to chat with ${bot.name}.` : !agentId ? `Connecting ${bot.name} to its agent…` : null}
          composerExtra={<button onClick={() => setView('tasks')} className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-2.5 text-sm font-medium hover:bg-muted" aria-label="Open tasks and pipeline"><ListTodo className="h-4 w-4" /><span className="hidden sm:inline">Tasks</span></button>}
        />
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function OfficePage() {
  const brand = useOfficeBrand();
  /* THE BUILDING (founder directive 2026-10-25): /office is one floor of a
   * building — ?floor=99 loads Floor 99's own team, Manager, shift state and
   * published scene file; it never loads another floor's world. A CEO runs
   * each company; the Chairman (floor 100) runs the building. */
  const floor = useMemo(() => floorById(new URLSearchParams(window.location.search).get('floor')), []);
  const engine = useMemo(() => engineFor(floor), [floor]);
  /* Personnel state (lib/org) lives outside React — bump to re-render
   * when a seat changes generation, a score lands or a firing queues. */
  const [orgTick, setOrgTick] = useState(0);
  useEffect(() => orgSubscribe(() => setOrgTick((x) => x + 1)), []);
  const [customBots, setCustomBots] = useState<CustomBot[]>(() => loadCustomBots(floor));
  const customBotsRef = useRef(customBots); customBotsRef.current = customBots;
  const promptOverridesRef = useRef<Record<string, string>>(loadPromptOverrides(floor));
  useEffect(() => { saveCustomBots(floor, customBots); setFloorTeamExtras(floor.key, customBots.map(customBotToRole)); }, [customBots, floor]); // eslint-disable-line react-hooks/exhaustive-deps
  const customOfficeBots = useMemo(() => customBots.map(customBotToOfficeBot), [customBots]);
  /* One identity per seat (lib/org): when a seat has been fired and
   * replaced, the CURRENT generation's name is what the office shows,
   * binds and plans with — the erased agent never reappears. */
  const scopeFor = (f: FloorDef, botKey: string): string => botKey === 'manager' ? managerScope(f.key) : botKey === 'ceo' ? ceoScope(f.key) : botKey === 'chairman' ? CHAIRMAN_SCOPE : agentScope(f.key, botKey);
  const displayBot = (f: FloorDef, bot: OfficeBot): OfficeBot => {
    const rec = getPersonnel(scopeFor(f, bot.key));
    return rec ? { ...bot, name: rec.personaName } : bot;
  };
  const TEAM_BOTS = useMemo(() => [...floor.bots.map((b) => displayBot(floor, b)), ...customOfficeBots], [floor, customOfficeBots, orgTick]); // eslint-disable-line react-hooks/exhaustive-deps
  const ALL_BOTS = useMemo(() => [...TEAM_BOTS, ...floor.executives.map((b) => displayBot(floor, b))], [TEAM_BOTS, floor, orgTick]); // eslint-disable-line react-hooks/exhaustive-deps
  const managerBot = useMemo(() => displayBot(floor, floor.manager), [floor, orgTick]); // eslint-disable-line react-hooks/exhaustive-deps
  const allBotsRef = useRef(ALL_BOTS); allBotsRef.current = ALL_BOTS;
  const [published, setPublished] = useState<any>(undefined);
  const [pubMeta, setPubMeta] = useState<{ publishedAt: string | null; live: boolean } | null>(null);
  useEffect(() => {
    let off = false;
    fetchPublishedOfficeMeta(publishedWorldUrl(floor.publishedFile))
      .then((m) => { if (off) return; if (m) { setPublished(m.scene); setPubMeta({ publishedAt: m.publishedAt, live: true }); } else setPubMeta({ publishedAt: null, live: false }); })
      .catch(() => { if (!off) setPubMeta({ publishedAt: null, live: false }); });
    return () => { off = true; };
  }, []);
  const codeScene = useMemo(() => (floor.id === 99 ? buildFloor99Scene() : floor.id === 100 ? buildOfficeScene() : floor.id === 1 ? buildLobbyScene() : buildSceneWithCast(floor.bots)), [floor]);
  // Each floor is its own LiveKit room, its own moderation and its own
  // access rules (founder directive 2026-10-25). Floor 100 keeps the
  // historic "office" room name so nothing already joined breaks.
  const ROOM_NAME = floor.id === 100 ? 'office' : `office-${floor.id}`;
  const [gate, setGate] = useState<null | { kind: string; msg: string }>(null);
  const [gateDraft, setGateDraft] = useState('');
  const [joinKey, setJoinKey] = useState(0);
  const [myIdentity, setMyIdentity] = useState('');
  const [myName, setMyName] = useState('Guest');
  const gateCreds = useRef<{ passcode?: string; invite?: string }>({});
  // Scene version gate: when the published scene predates the built-in one
  // (white floor / tall ceiling / daylight update), play the built-in scene
  // merged with the published world's studio additions, until an admin
  // publishes the update from the button in this page — then the published
  // file IS this scene and the gate never triggers again.
  const pubVersion = (published as any)?.environment?.sceneVersion ?? 1;
  const outdated = !!published && pubVersion < OFFICE_SCENE_VERSION;
  // Never silently show the built-in copy: wait for the live published file,
  // and only fall back (clearly badged) when it truly cannot be loaded.
  const scene = published && !outdated ? published : (pubMeta ? mergeOfficeScenes(codeScene, published ?? null) : null);
  // The world's own player controller (scene.playerControllerId + scene.controllers), default otherwise.
  const playerDef = useMemo(() => playerControllerFor(scene ?? undefined), [scene]);
  const [publishing, setPublishing] = useState(false);
  const [pubNote, setPubNote] = useState('');
  const publishUpdatedScene = async () => {
    if (!scene) return;
    setPublishing(true); setPubNote('');
    const { data, error } = await supabase.functions.invoke('studio-publish', { body: { target: 'office', name: OFFICE_LEVEL_NAME, scene } });
    setPublishing(false);
    if (error || (data as any)?.error) { setPubNote((data as any)?.error || error?.message || 'Publish failed — try again from the 3D Studio.'); return; }
    setPublished(scene);
    setPubNote('Published — everyone now loads this office.');
  };
  const bots = useMemo(() => {
    const chars = (scene?.objects || []).filter((o: any) => o.kind === 'character');
    // Chairs are fused INTO the station objects now: the chair spot is
    // the station position + its local (0, 0, 0.85) rotated by the
    // station's Y rotation, and the seat top is the fused part's 0.56.
    const stations = (scene?.objects || []).filter((o: any) => /^Agent Station \d+$/.test(o.name || ''));
    const chairs = stations.map((st: any) => {
      const ry = st.rotation?.[1] ?? 0;
      return { position: [st.position[0] + Math.sin(ry) * 0.85, 0.56, st.position[2] + Math.cos(ry) * 0.85] };
    });
    return floor.bots.map((bot, i) => {
      const c = chars.find((o: any) => (o.name || '').toLowerCase().includes(bot.name.toLowerCase())) || chars[i];
      const home: [number, number, number] = c ? [c.position[0], 0, c.position[2]] : [OFFICE_DESKS[i].x, 0, OFFICE_DESKS[i].z + OFFICE_DESKS[i].facing * 0.85];
      const rotY = c ? (c.rotation?.[1] ?? 0) : (OFFICE_DESKS[i].facing === 1 ? Math.PI : 0);
      // Seat height from the nearest fused station's chair (its top is
      // the constant 0.56 from the station part spec), fallback standard.
      let seatY = 0.52; let bd = 1.6;
      for (const ch of chairs) { const d = Math.hypot(ch.position[0] - home[0], ch.position[2] - home[2]); if (d < bd) { bd = d; seatY = ch.position[1]; } }
      return { bot: displayBot(floor, bot), home, rotY, seatY };
    });
  }, [scene, orgTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const [openBot, setOpenBot] = useState<OfficeBot | null>(null);
  /* ONE DOOR PER PERSON (bug fix, founder report 2026-10-26): every
   * entry point that "opens" a person — the proximity button, the
   * interact key, the theater watch button, a 3D tap — must route by
   * ROLE. The generic Genius-chat panel (setOpenBot) is only for desk
   * specialists; the Manager opens Shift Control and the CEO/Chairman
   * open the ExecPanel with their Dashboard / Departments / Reports /
   * Actions tabs. The proximity path used to send the CEO and Chairman
   * to the chat-only panel, so their tabs looked "missing" until the
   * Manager UI had been opened some other way. The router lives in a
   * ref because several consumers sit above the execOpen state. */
  const openPersonRef = useRef<(b: OfficeBot) => void>(() => {});
  // SIT AT AN EMPTY DESK (founder directive 2026-10-26): the user can
  // take any station no agent is assigned to. seatRef pins the player
  // (UnifiedPlayer eases onto the chair and plays the sitting clip);
  // peers receive s=1 in the position broadcast and render the same.
  const seatRef = useRef<{ x: number; z: number; ry: number; y: number } | null>(null);
  const [seatedAt, setSeatedAt] = useState<number | null>(null);
  const [nearSeat, setNearSeat] = useState<number | null>(null);
  const seatSpots = useMemo(() => OFFICE_DESKS.map((d, i) => ({ i, x: d.x, z: d.z + d.facing * 0.85, ry: d.facing === 1 ? Math.PI : 0 })), []);
  const sitAt = (i: number) => { const s = seatSpots[i]; if (!s) return; seatRef.current = { x: s.x, z: s.z, ry: s.ry, y: 0.671 }; setSeatedAt(i); setNearSeat(null); };
  const standUp = () => { seatRef.current = null; setSeatedAt(null); };
  useEffect(() => {
    if (seatedAt != null) return;
    const iv = setInterval(() => {
      let best: number | null = null; let bd = 1.7;
      for (const s of seatSpots) {
        const takenByBot = bots.some((b) => Math.hypot(b.home[0] - s.x, b.home[2] - s.z) < 0.6);
        if (takenByBot) continue;
        let takenByPeer = false;
        peersRef.current.forEach((p) => { if (Math.hypot(p.x - s.x, p.z - s.z) < 0.6) takenByPeer = true; });
        if (takenByPeer) continue;
        const d = Math.hypot(playerPos.x - s.x, playerPos.z - s.z);
        if (d < bd) { bd = d; best = s.i; }
      }
      setNearSeat((cur) => (cur === best ? cur : best));
    }, 350);
    return () => clearInterval(iv);
  }, [seatedAt, bots, seatSpots]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (seatedAt == null) return;
    const dn = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) standUp();
    };
    window.addEventListener('keydown', dn);
    return () => window.removeEventListener('keydown', dn);
  }, [seatedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const [shiftOpen, setShiftOpen] = useState(false);
  const [panelView, setPanelView] = useState<'genius' | 'console'>('genius');
  useEffect(() => { setPanelView('genius'); }, [openBot?.key]);
  const [nearKey, setNearKey] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, BotLink>>(loadLinks);
  const [agents, setAgents] = useState<any[]>([]);
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [agentsKey, setAgentsKey] = useState(0);
  const [introGone, setIntroGone] = useState(false);
  const camRef = useRef({ yaw: Math.PI, pitch: 0.25 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  /* ---- Theater / LiveKit ---- */
  const [theater, setTheater] = useState<OfficeTheater>(null);
  /* Simplified chrome (founder directive 2026-10-25): the office's
   * floating buttons are consolidated into THREE dropdowns — Building
   * (top-left), Office (top-right, admin) and Team (bottom-right). */
  const [buildingMenu, setBuildingMenu] = useState(false);
  const [officeMenu, setOfficeMenu] = useState(false);
  const [teamMenu, setTeamMenu] = useState(false);
  const [elevatorOpen, setElevatorOpen] = useState(false);
  const closeMenus = () => { setBuildingMenu(false); setOfficeMenu(false); setTeamMenu(false); };

  /* ---- Social (Plaza parity): presence, spatial voice, text chat ---- */
  const [peers, setPeers] = useState<Record<string, PeerInfo>>({});
  const [speakingIds, setSpeakingIds] = useState<string[]>([]);
  const [chatMsgs, setChatMsgs] = useState<{ from: string; text: string; at: number; me?: boolean }[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatText, setChatText] = useState('');
  const [unread, setUnread] = useState(0);
  const peersRef = useRef(new Map<string, PeerInfo>());
  const myColorRef = useRef('#38bdf8');
  const chatOpenRef = useRef(false); chatOpenRef.current = chatOpen;
  const socialFlags = useMemo(() => { const s = ((scene as any)?.social || {}) as Record<string, unknown>; const on = (k: string) => s[k] !== false; return { presence: on('presence'), voice: on('voice'), chat: on('chat'), theater: on('theater') }; }, [scene]);
  const socialRef = useRef(socialFlags); socialRef.current = socialFlags;
  const sendChat = () => {
    const t = chatText.trim(); if (!t) return;
    setChatText('');
    setChatMsgs((cur) => [...cur.slice(-60), { from: nameRef.current, text: t, at: Date.now(), me: true }]);
    roomRef.current?.localParticipant.publishData(enc.encode(JSON.stringify({ t: 'chat', text: t, n: nameRef.current })), { reliable: true }).catch(() => {});
  };
  const [presenting, setPresenting] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [micNote, setMicNote] = useState('');
  const [pdfPages, setPdfPages] = useState(0);
  const [theaterNote, setTheaterNote] = useState('');
  const [screenRuns, setScreenRuns] = useState<any[]>([]);
  /* Theater board data: EVERY agent's recent runs + the local task queue,
   * polled together — the theater's default face is the all-agents board,
   * and an agent's theater view is its task roadmap. */
  const [allRuns, setAllRuns] = useState<any[]>([]);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const roomRef = useRef<Room | null>(null);
  const camTrackRef = useRef<any>(null);
  const docRef = useRef<{ kind: 'image' | 'pdf'; url: string; name: string; page: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioEls = useRef(new Map<string, HTMLMediaElement>());
  const nameRef = useRef('Guest');
  const theaterRef = useRef<OfficeTheater>(null); theaterRef.current = theater;
  const presentingRef = useRef(false); presentingRef.current = presenting;

  const sendTheater = (msg: object) => roomRef.current?.localParticipant.publishData(enc.encode(JSON.stringify({ t: 'theater', ...msg, by: nameRef.current })), { reliable: true }).catch(() => {});

  useEffect(() => {
    let cancelled = false;
    let posTimer: any = null;
    let volTimer: any = null;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        let gid = sessionStorage.getItem('office-guest-id');
        if (!gid) { gid = `guest-${Math.random().toString(36).slice(2, 10)}`; sessionStorage.setItem('office-guest-id', gid); }
        const identity = u.user?.id || gid;
        myColorRef.current = colorFor(identity);
        nameRef.current = u.user?.email?.split('@')[0] || 'Guest';
        setMyIdentity(identity); setMyName(nameRef.current);
        // Floor access credentials: an invitation in the URL, or the
        // passcode entered at this floor's gate (kept for the session).
        const urlInvite = new URLSearchParams(window.location.search).get('invite') || undefined;
        if (!gateCreds.current.passcode) { try { gateCreds.current.passcode = sessionStorage.getItem(`sfh:office-pass:${ROOM_NAME}`) || undefined; } catch { /* private mode */ } }
        const { data, error } = await supabase.functions.invoke('livekit-token', { body: { roomName: ROOM_NAME, identity, name: nameRef.current, passcode: gateCreds.current.passcode || undefined, invite: gateCreds.current.invite || urlInvite } });
        if (error || !data?.token) {
          // A 403 from the join gate (ban / private / passcode) shows the
          // gate screen; any other failure keeps the old silent behavior.
          if (!cancelled && error) {
            try {
              const parsed = await (error as any).context?.json?.();
              const code = parsed?.code;
              if (code === 'banned' || code === 'invite_required' || code === 'passcode_required' || code === 'passcode_wrong') {
                setGate({ kind: code, msg: parsed?.error || 'This floor is restricted.' });
              }
            } catch { /* not a gate denial */ }
          }
          return;
        }
        if (cancelled) return;
        setGate(null);
        const r = new Room({ adaptiveStream: false, dynacast: true });
        roomRef.current = r;
        r.on(RoomEvent.DataReceived, (payload, p) => {
          try {
            const m = JSON.parse(dec.decode(payload));
            if (!m) return;
            if (m.t === 'pos' && p?.identity && socialRef.current.presence) {
              peersRef.current.set(p.identity, { x: +m.x || 0, z: +m.z || 0, ry: +m.ry || 0, m: !!m.m, n: String(m.n || 'Guest'), c: String(m.c || '#38bdf8'), s: !!m.s });
              setPeers(Object.fromEntries(peersRef.current));
              return;
            }
            if (m.t === 'chat' && typeof m.text === 'string' && socialRef.current.chat) {
              setChatMsgs((cur) => [...cur.slice(-60), { from: String(m.n || 'Guest'), text: m.text.slice(0, 500), at: Date.now() }]);
              if (!chatOpenRef.current) setUnread((n) => n + 1);
              return;
            }
            if (m.t !== 'theater') return;
            if (m.kind === 'stop') setTheater((cur) => (cur && cur.kind !== 'video' ? null : cur));
            else if (m.kind === 'pdf') setTheater({ kind: 'pdf', url: m.url, name: String(m.name || ''), page: Number(m.page) || 1, by: String(m.by || p?.name || 'Host') });
            else if (m.kind === 'image') setTheater({ kind: 'image', url: m.url, name: String(m.name || ''), by: String(m.by || p?.name || 'Host') });
            else if (m.kind === 'dashboard') setTheater({ kind: 'dashboard', botKey: String(m.botKey || ''), by: String(m.by || p?.name || 'Host'), agentName: m.agentName });
          } catch {}
        });
        r.on(RoomEvent.TrackSubscribed, (track, pub, p) => {
          if (track.kind === Track.Kind.Audio) { const el = track.attach() as HTMLMediaElement; el.style.display = 'none'; document.body.appendChild(el); audioEls.current.set(`${p.identity}:${pub.trackSid}`, el); }
          if (pub.source === Track.Source.ScreenShare && track.kind === Track.Kind.Video) { const el = track.attach() as HTMLVideoElement; el.muted = true; el.playsInline = true; setTheater({ kind: 'video', el, by: p.name || 'Host' }); }
        });
        r.on(RoomEvent.TrackUnsubscribed, (track, pub, p) => { track.detach().forEach((el) => el.remove()); audioEls.current.delete(`${p.identity}:${pub.trackSid}`); if (pub.source === Track.Source.ScreenShare) setTheater((cur) => (cur?.kind === 'video' ? null : cur)); });
        r.on(RoomEvent.LocalTrackUnpublished, (pub) => { if (pub.source === Track.Source.ScreenShare) { setPresenting(false); setTheater((cur) => (cur?.kind === 'video' ? null : cur)); } });
        r.on(RoomEvent.ParticipantDisconnected, (p) => { if (peersRef.current.delete(p.identity)) setPeers(Object.fromEntries(peersRef.current)); });
        r.on(RoomEvent.ActiveSpeakersChanged, (sp) => setSpeakingIds((sp as any[]).map((s: any) => s.identity)));
        r.on(RoomEvent.ParticipantConnected, () => {
          const th = theaterRef.current;
          if (presentingRef.current) sendTheater({ kind: 'video' });
          else if (docRef.current) sendTheater(docRef.current);
          else if (th?.kind === 'dashboard') sendTheater({ kind: 'dashboard', botKey: th.botKey, agentName: th.agentName });
        });
        await r.connect(data.url || import.meta.env.VITE_LIVEKIT_URL, data.token);
        // Social (Plaza parity): mic on, position broadcast, spatial voice.
        if (socialRef.current.voice) { try { await r.localParticipant.setMicrophoneEnabled(true); setMicOn(true); } catch { /* mic stays off until toggled */ } }
        let lx = Infinity, lz = Infinity;
        posTimer = setInterval(() => {
          if (!socialRef.current.presence) return;
          const moved = Math.hypot(playerPos.x - lx, playerPos.z - lz) > 0.02;
          if (!moved && Math.random() > 0.1) return;
          lx = playerPos.x; lz = playerPos.z;
          r.localParticipant.publishData(enc.encode(JSON.stringify({ t: 'pos', x: +playerPos.x.toFixed(2), z: +playerPos.z.toFixed(2), ry: +playerYaw.current.toFixed(2), m: moved, n: nameRef.current, c: myColorRef.current, s: seatRef.current ? 1 : 0 })), { reliable: false }).catch(() => {});
        }, 120);
        volTimer = setInterval(() => {
          audioEls.current.forEach((el, key) => {
            const peer = peersRef.current.get(key.split(':')[0]);
            const d = peer ? Math.hypot(peer.x - playerPos.x, peer.z - playerPos.z) : 999;
            (el as HTMLMediaElement).volume = socialRef.current.voice ? THREE.MathUtils.clamp(1 - d / 22, 0, 1) : 0;
          });
        }, 350);
      } catch { /* theater stays local to this browser */ }
    })();
    return () => { cancelled = true; if (posTimer) clearInterval(posTimer); if (volTimer) clearInterval(volTimer); roomRef.current?.disconnect(); roomRef.current = null; audioEls.current.forEach((el) => el.remove()); audioEls.current.clear(); };
  }, [joinKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopDoc = () => { if (docRef.current) { docRef.current = null; sendTheater({ kind: 'stop' }); setTheater(null); } };
  const stopPresenting = async () => {
    const r = roomRef.current; if (!r) return;
    if (camTrackRef.current) { try { await r.localParticipant.unpublishTrack(camTrackRef.current); } catch {} camTrackRef.current.stop(); camTrackRef.current = null; sendTheater({ kind: 'stop' }); }
    else { try { await r.localParticipant.setScreenShareEnabled(false); } catch {} }
    setPresenting(false); setTheater(null);
  };
  const shareScreen = async (camera = false) => {
    const r = roomRef.current;
    if (!r) { setTheaterNote('Theater sharing needs the live room connection — give it a second and try again.'); return; }
    try {
      if (presenting) { await stopPresenting(); return; }
      stopDoc();
      if (camera || !navigator.mediaDevices?.getDisplayMedia) {
        const cam = await (await import('livekit-client')).createLocalVideoTrack({ facingMode: camera ? 'user' : 'environment' });
        await r.localParticipant.publishTrack(cam, { source: Track.Source.ScreenShare, name: 'screen' });
        const el = document.createElement('video'); el.muted = true; el.playsInline = true; el.srcObject = new MediaStream([cam.mediaStreamTrack]); el.style.cssText = 'position:fixed;right:0;bottom:0;width:4px;height:4px;opacity:0.01;pointer-events:none'; document.body.appendChild(el); el.play().catch(() => {});
        camTrackRef.current = cam;
        setTheater({ kind: 'video', el, by: nameRef.current }); setPresenting(true); sendTheater({ kind: 'video' });
        return;
      }
      const pub = await r.localParticipant.setScreenShareEnabled(true, { audio: false, resolution: { width: 1920, height: 1080, frameRate: 30 } });
      const mst = pub?.track?.mediaStreamTrack; if (!mst) return;
      const el = document.createElement('video'); el.muted = true; el.playsInline = true; el.srcObject = new MediaStream([mst]); el.style.cssText = 'position:fixed;right:0;bottom:0;width:4px;height:4px;opacity:0.01;pointer-events:none'; document.body.appendChild(el); el.play().catch(() => {});
      setTheater({ kind: 'video', el, by: nameRef.current }); setPresenting(true); sendTheater({ kind: 'video' });
    } catch (e: any) { setTheaterNote(/NotAllowed|Abort/i.test(String(e?.name)) ? 'Sharing was cancelled.' : 'Sharing is blocked on this device. Try Present document, or allow screen/camera access for the browser.'); }
  };
  const onDocFile = async (f?: File) => {
    if (!f) return;
    const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    if (!isPdf && !f.type.startsWith('image/')) { setTheaterNote('Share a PDF or an image.'); return; }
    if (presenting) await stopPresenting();
    setTheaterNote(`Uploading ${f.name}…`);
    const path = `office/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('live-shares').upload(path, f, { contentType: f.type || undefined });
    if (error) { setTheaterNote('Could not upload the file.'); return; }
    const { data } = await supabase.storage.from('live-shares').createSignedUrl(path, 60 * 60 * 24);
    if (!data?.signedUrl) { setTheaterNote('Could not share the file.'); return; }
    setTheaterNote('');
    const d = { kind: (isPdf ? 'pdf' : 'image') as 'pdf' | 'image', url: data.signedUrl, name: f.name, page: 1 };
    docRef.current = d; sendTheater(d);
    setTheater(isPdf ? { ...d, kind: 'pdf', by: nameRef.current } : { kind: 'image', url: d.url, name: d.name, by: nameRef.current });
  };
  const turnPage = (dir: number) => {
    const d = docRef.current; if (!d || d.kind !== 'pdf') return;
    d.page = Math.min(Math.max(1, d.page + dir), pdfPages || 1);
    sendTheater(d); setTheater({ ...d, kind: 'pdf', by: nameRef.current });
  };
  // Turning the mic ON asks the browser directly first: on iOS that surfaces
  // the native permission prompt, where LiveKit's internal request can fail
  // silently. Errors are named precisely — a sticky Safari denial needs the
  // aA → Website Settings fix, and the note says so.
  const enableMic = async (manual: boolean): Promise<boolean> => {
    const r = roomRef.current;
    if (!r) { if (manual) setMicNote('Still connecting — give it a second, then tap the mic again.'); return false; }
    if (manual) {
      try {
        const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
        probe.getTracks().forEach((t) => t.stop());
      } catch (e: any) {
        if (e?.name === 'NotAllowedError') setMicNote('Safari is blocking the mic for this site. Tap the aA icon in the address bar → Website Settings → Microphone → Allow, then reload and tap the mic again. (Tap this message to dismiss.)');
        else if (e?.name === 'NotFoundError' || e?.name === 'OverconstrainedError') setMicNote('No microphone found on this device.');
        else setMicNote('Microphone could not start — reload the page and tap the mic button.');
        return false;
      }
    }
    try {
      await (r as any).startAudio?.().catch(() => {});
      await r.localParticipant.setMicrophoneEnabled(true);
      setMicOn(true); setMicNote('');
      return true;
    } catch {
      if (manual) setMicNote('Microphone could not start — reload the page and tap the mic button.');
      return false;
    }
  };
  const toggleMic = async () => {
    const r = roomRef.current; if (!r) { setMicNote('Still connecting — give it a second, then tap the mic again.'); return; }
    if (micOn) { try { await r.localParticipant.setMicrophoneEnabled(false); } catch { /* already off */ } setMicOn(false); setMicNote(''); return; }
    await enableMic(true);
  };
  // The connect-time mic attempt has no user gesture, and iOS blocks mic
  // capture without one — so the FIRST tap anywhere retries it silently.
  const micGestureTriedRef = useRef(false);
  const maybeAutoMic = async () => {
    if (micGestureTriedRef.current || micOn || !socialRef.current.voice) return;
    if (!roomRef.current) return; // room not ready: keep the one retry for later
    micGestureTriedRef.current = true;
    await enableMic(false);
  };
  const showDashboardOnTheater = async (botKey: string) => {
    const bot = allBotsRef.current.find((b) => b.key === botKey); if (!bot) return;
    if (presenting) await stopPresenting();
    stopDoc();
    if (signedIn && agentsLoaded) await ensureBotAgent(bot);
    const l = linksRef.current[botKey] || {};
    const agentName = agents.find((a) => a.id === l.agentId)?.name || bot.name;
    setTheater({ kind: 'dashboard', botKey, by: nameRef.current, agentName });
    sendTheater({ kind: 'dashboard', botKey, agentName });
  };
  const stopTheater = () => { stopDoc(); if (presenting) { void stopPresenting(); } setTheater(null); sendTheater({ kind: 'stop' }); };

  const screenBot = theater?.kind === 'dashboard' ? allBotsRef.current.find((b) => b.key === theater.botKey) ?? null : null;
  const screenLink = screenBot ? links[screenBot.key] || {} : {};
  const screenAgent = agents.find((a) => a.id === screenLink.agentId) || (theater?.kind === 'dashboard' && theater.agentName ? { name: theater.agentName } : undefined);
  useEffect(() => {
    if (!screenBot || !screenLink.aiOn || !screenLink.agentId) { setScreenRuns([]); return; }
    supabase.from('call_agent_runs').select('id, input, output, status, created_at').eq('agent_id', screenLink.agentId).order('created_at', { ascending: false }).limit(5).then(({ data }) => setScreenRuns(data || []));
  }, [screenBot?.key, screenLink.agentId, screenLink.aiOn]);
  /* Poll all runs + the task queue for the theater board / roadmaps. */
  useEffect(() => {
    if (!signedIn) return;
    let off = false;
    const tick = async () => {
      try { const raw = localStorage.getItem('sfh:agents-task-queue:v1'); const q = raw ? JSON.parse(raw) : []; if (!off && Array.isArray(q)) setQueueItems(q); } catch { /* queue unreadable */ }
      const { data } = await supabase.from('call_agent_runs').select('id, agent_id, input, status, created_at').order('created_at', { ascending: false }).limit(80);
      if (!off && data) setAllRuns(data);
    };
    void tick();
    const iv = setInterval(tick, 20_000);
    return () => { off = true; clearInterval(iv); };
  }, [signedIn]);
  const screenQueue = useMemo(() => (screenLink.agentId ? queueItems.filter((i: any) => i.agentId === screenLink.agentId) : []), [queueItems, screenLink.agentId]);
  /* The green hand button (mobile controls) fires inputPulse.interact —
   * it had NO consumer in the office, so it did nothing. Now it opens the
   * nearest agent, same as tapping the proximity button. */
  const nearBotRef = useRef<OfficeBot | null>(null);
  useEffect(() => {
    const iv = setInterval(() => {
      if (inputPulse.interact) {
        inputPulse.interact = false;
        if (nearBotRef.current) openPersonRef.current(nearBotRef.current);
      }
    }, 120);
    return () => clearInterval(iv);
  }, []);

  /* ---- Agents / dashboards ---- */
  // Session comes from the LOCAL session + the auth-state listener, never a
  // one-shot getUser(): that network validation can return null during the
  // page-load token refresh and used to strand signed-in users on the
  // "Sign in" note forever.
  useEffect(() => {
    let live = true;
    const apply = async (uid: string | null) => {
      if (!live) return;
      setSignedIn(!!uid);
      if (!uid) { setIsAdmin(false); return; }
      try { const { data: a } = await supabase.rpc('has_role', { _user_id: uid, _role: 'admin' }); if (live) setIsAdmin(!!a); } catch { /* role probe is best-effort */ }
      try { const r = await callAgentsApi({ action: 'list' }); if (live) { setAgents(r.agents || []); setAgentsLoaded(true); } } catch { /* list retries on open */ }
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session?.user?.id ?? null)).catch(() => {});
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { void apply(session?.user?.id ?? null); });
    return () => { live = false; sub.subscription.unsubscribe(); };
  }, []);

  const link = openBot ? links[openBot.key] || {} : {};
  const linkedAgent = agents.find((a) => a.id === link.agentId);
  const refreshAgents = async () => {
    try { const r = await callAgentsApi({ action: 'list' }); setAgents(r.agents || []); setAgentsLoaded(true); } catch { /* keep the current list */ }
    setAgentsKey((k) => k + 1);
  };

  const saveLinkFor = (key: string, patch: BotLink) => {
    setLinks((cur) => {
      const next = { ...cur, [key]: { ...cur[key], ...patch } };
      try { localStorage.setItem(LINKS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const saveLink = (patch: BotLink) => { if (openBot) saveLinkFor(openBot.key, patch); };
  const botLink = useMemo(() => openBot ? { botName: openBot.name, agentId: link.agentId, aiOn: link.aiOn, onChange: (patch: BotLink) => saveLink(patch) } : undefined, [openBot, link.agentId, link.aiOn]); // eslint-disable-line react-hooks/exhaustive-deps
  const nearBot = nearKey ? [...allBotsRef.current, managerBot].find((b) => b.key === nearKey) : null;
  nearBotRef.current = (nearBot as OfficeBot | null) ?? null;
  const agentChars = useMemo(() => ((scene?.objects || []) as any[]).filter((o) => o.kind === 'character' && o.agentId), [scene]);
  /* ---- Who is on a job right now: a bot whose linked agent produced a run
   * in the last 3 minutes is pinned to its desk (sitting + typing). ---- */
  const linksRef = useRef(links); linksRef.current = links;
  const agentCharsRef = useRef<any[]>([]); agentCharsRef.current = agentChars;
  /* ---- Click = chosen (founder directive 2026-10-25): opening a bot IS
   * choosing its agent. A roster bot with no link auto-binds — first to a
   * same-named agent of yours, otherwise to a new agent created in the
   * bot's own name and persona — so the chat never asks which agent. */
  const autoBindTried = useRef(new Set<string>());
  const ensureBotAgent = async (bot: OfficeBot): Promise<string | undefined> => {
    /* Personnel first: a replaced seat binds ONLY its current generation —
     * the erased agent's id is retired and is never re-linked, by id or
     * by name, ever again. */
    const scope = scopeFor(floor, bot.key);
    const rec = getPersonnel(scope);
    const retired = retiredAgentIds(scope);
    const agentName = rec?.personaName || bot.name;
    const existing = (linksRef.current[bot.key] || {}).agentId;
    if (existing && !retired.includes(existing)) return existing;
    const match = agents.find((a) => !retired.includes(a.id) && String(a.name || '').trim().toLowerCase() === agentName.trim().toLowerCase());
    if (match) { saveLinkFor(bot.key, { agentId: match.id, aiOn: true }); return match.id; }
    if (autoBindTried.current.has(bot.key)) return undefined;
    autoBindTried.current.add(bot.key);
    try {
      const custom = customBotsRef.current.find((c) => c.key === bot.key);
      const persona = rec?.prompt
        || promptOverridesRef.current[bot.key]
        || (bot.key === 'manager' ? floor.managerPrompt
          : bot.key === 'chairman' ? CHAIRMAN_PROMPT
          : bot.key === 'ceo' ? ceoPrompt(floor.company)
          : custom ? custom.prompt
          : ([...floor.team, ...customBotsRef.current.map(customBotToRole)].find((t) => t.key === bot.key)?.prompt
            || `You are ${agentName}, an AI agent working in the ${floor.company} office. Your job: ${bot.duty} Act as this specialist — take tasks, do the work, and report results clearly.`));
      const r = await callAgentsApi({ action: 'save', name: agentName, description: bot.duty, system_prompt: persona, model: 'llama-3.3-70b-versatile', tools: [] });
      const created = r?.agent;
      if (created?.id) {
        setAgents((cur) => (cur.some((a) => a.id === created.id) ? cur : [...cur, created]));
        saveLinkFor(bot.key, { agentId: created.id, aiOn: true });
        return created.id;
      }
    } catch { autoBindTried.current.delete(bot.key); /* a later open retries */ }
    return undefined;
  };
  /* Shift Mode: the engine resolves each specialist (and the Manager) to a
   * call-agent through the same auto-bind the bot panels use. */
  useEffect(() => {
    engine.bind({
      resolveAgentId: async (botKey: string) => {
        const bot = botKey === 'manager' ? floor.manager : allBotsRef.current.find((b) => b.key === botKey);
        if (!bot) return null;
        const id = await ensureBotAgent(bot);
        return id ?? null;
      },
    });
  }, [agents, links]); // eslint-disable-line react-hooks/exhaustive-deps
  /* THE BUILDING runs from any floor (founder directive 2026-10-25): the
   * CEO coordinates a whole company and the Chairman the building, so
   * EVERY floor's engine is bound — each with its OWN floor-scoped agent
   * links, customs and prompt overrides, so a shift dispatched to
   * another floor runs that floor's real team with its real personas. */
  const scopedTried = useRef(new Set<string>());
  const scopedLinksKey = (fk: string) => `sfh:office-bots:${fk}:v1`;
  const loadScopedLinks = (fk: string): Record<string, BotLink> => { try { return JSON.parse(localStorage.getItem(scopedLinksKey(fk)) || '{}'); } catch { return {}; } };
  const saveScopedLink = (fk: string, key: string, patch: BotLink | null) => {
    const all = loadScopedLinks(fk);
    if (patch === null) delete all[key]; else all[key] = { ...(all[key] || {}), ...patch };
    try { localStorage.setItem(scopedLinksKey(fk), JSON.stringify(all)); } catch {}
  };
  const ensureAgentForFloor = async (f: FloorDef, bot: OfficeBot): Promise<string | undefined> => {
    const scope = scopeFor(f, bot.key);
    const rec = getPersonnel(scope);
    const retired = retiredAgentIds(scope);
    const agentName = rec?.personaName || bot.name;
    const links = loadScopedLinks(f.key);
    const existing = (links[bot.key] || {}).agentId;
    if (existing && !retried.includes(existing)) return existing;
    const match = agents.find((a) => !retired.includes(a.id) && String(a.name || '').trim().toLowerCase() === agentName.trim().toLowerCase());
    if (match) { saveScopedLink(f.key, bot.key, { agentId: match.id, aiOn: true }); return match.id; }
    const triedKey = `${f.key}:${bot.key}`;
    if (scopedTried.current.has(triedKey)) return undefined;
    scopedTried.current.add(triedKey);
    try {
      const customs = loadCustomBots(f);
      const custom = customs.find((c) => c.key === bot.key);
      const persona = rec?.prompt
        || loadPromptOverrides(f)[bot.key]
        || (bot.key === 'manager' ? f.managerPrompt
          : bot.key === 'chairman' ? CHAIRMAN_PROMPT
          : bot.key === 'ceo' ? ceoPrompt(f.company)
          : custom ? custom.prompt
          : ([...f.team, ...customs.map(customBotToRole)].find((t) => t.key === bot.key)?.prompt
            || `You are ${agentName}, an AI agent working in the ${f.company} office. Your job: ${bot.duty} Act as this specialist — take tasks, do the work, and report results clearly.`));
      const r = await callAgentsApi({ action: 'save', name: agentName, description: bot.duty, system_prompt: persona, model: 'llama-3.3-70b-versatile', tools: [] });
      const created = r?.agent;
      if (created?.id) {
        setAgents((cur) => (cur.some((a) => a.id === created.id) ? cur : [...cur, created]));
        saveScopedLink(f.key, bot.key, { agentId: created.id, aiOn: true });
        return created.id;
      }
    } catch { scopedTried.current.delete(triedKey); }
    return undefined;
  };
  const botOnFloor = (f: FloorDef, botKey: string): OfficeBot | undefined =>
    botKey === 'manager' ? f.manager : [...f.bots, ...f.executives, ...loadCustomBots(f).map(customBotToOfficeBot)].find((b) => b.key === botKey);
  useEffect(() => {
    for (const f of allFloors()) {
      if (f.key === floor.key) continue;
      setFloorTeamExtras(f.key, loadCustomBots(f).map(customBotToRole));
      engineFor(f).bind({
        resolveAgentId: async (botKey: string) => {
          const bot = botOnFloor(f, botKey);
          if (!bot) return null;
          const id = await ensureAgentForFloor(f, bot);
          return id ?? null;
        },
      });
    }
  }, [agents, links]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!openBot || !signedIn || !agentsLoaded) return;
    if (!allBotsRef.current.some((b) => b.key === openBot.key)) return; // studio agent characters arrive pre-linked
    if ((links[openBot.key] || {}).agentId) return;
    void ensureBotAgent(openBot);
  }, [openBot?.key, signedIn, agentsLoaded, agents, links]); // eslint-disable-line react-hooks/exhaustive-deps
  const [workingKeys, setWorkingKeys] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => {
    let off = false;
    const tick = async () => {
      const byAgent = new Map<string, string>();
      Object.entries(linksRef.current).forEach(([k, l]) => { if (l?.agentId && l?.aiOn) byAgent.set(l.agentId, k); });
      agentCharsRef.current.forEach((o: any) => { if (o.agentId) byAgent.set(String(o.agentId), `agent_${o.id}`); });
      if (!byAgent.size) { if (!off) setWorkingKeys(new Set()); return; }
      const since = new Date(Date.now() - 3 * 60_000).toISOString();
      const { data } = await supabase.from('call_agent_runs').select('agent_id').in('agent_id', [...byAgent.keys()]).gte('created_at', since);
      if (off) return;
      const next = new Set<string>();
      (data || []).forEach((r: any) => { const k = byAgent.get(r.agent_id); if (k) next.add(k); });
      setWorkingKeys(next);
    };
    void tick();
    const iv = setInterval(tick, 25_000);
    return () => { off = true; clearInterval(iv); };
  }, []);
  /* One row per agent for the theater's default team board. */
  const boardRows = useMemo(() => TEAM_BOTS.map((bot) => {
    const l = links[bot.key] || {};
    const runs = l.agentId ? allRuns.filter((r: any) => r.agent_id === l.agentId) : [];
    const q = l.agentId ? queueItems.filter((i: any) => i.agentId === l.agentId) : [];
    return {
      bot,
      working: workingKeys.has(bot.key),
      current: String(runs[0]?.input || q[0]?.message || ''),
      queued: q.length,
      done: runs.filter((r: any) => r.status === 'ok').length,
    };
  }), [links, allRuns, queueItems, workingKeys, TEAM_BOTS]);
  useEffect(() => { if (!scene) return; const t = setTimeout(() => setIntroGone(true), 2100); return () => clearTimeout(t); }, [scene]);
  const createCustomAgent = async ({ name, duty, prompt }: { name: string; duty: string; prompt: string }) => {
    if (floor.bots.length + customBotsRef.current.length >= MAX_AGENTS_PER_FLOOR) {
      throw new Error(`This floor is full — ${MAX_AGENTS_PER_FLOOR} agents max per floor. Replace someone first, or use another floor.`);
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'agent';
    const cb: CustomBot = { key: `custom-${slug}-${Math.random().toString(36).slice(2, 6)}`, name, duty: duty || 'Custom specialist', prompt, tint: CUSTOM_TINTS[customBotsRef.current.length % CUSTOM_TINTS.length] };
    customBotsRef.current = [...customBotsRef.current, cb];
    setCustomBots(customBotsRef.current);
    if (signedIn) await ensureBotAgent(customBotToOfficeBot(cb));
  };
  /* Recruiting from the executive chats (conversational actions):
   * the same creation as the team tools, for ANY floor — the CEO
   * recruits onto his company's home floor, the Chairman onto
   * Floor 100. Cap law applies identically. */
  const createCustomAgentOnFloor = async (f: FloorDef, { name, duty, prompt }: { name: string; duty: string; prompt: string }) => {
    if (f.key === floor.key) return createCustomAgent({ name, duty, prompt });
    const customs = loadCustomBots(f);
    if (f.bots.length + customs.length >= MAX_AGENTS_PER_FLOOR) {
      throw new Error(`Floor ${f.id} is full — ${MAX_AGENTS_PER_FLOOR} agents max per floor. Replace someone first, or use another floor.`);
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'agent';
    const cb: CustomBot = { key: `custom-${slug}-${Math.random().toString(36).slice(2, 6)}`, name, duty: duty || 'Custom specialist', prompt, tint: CUSTOM_TINTS[customs.length % CUSTOM_TINTS.length] };
    const next = [...customs, cb];
    saveCustomBots(f, next);
    setFloorTeamExtras(f.key, next.map(customBotToRole));
    if (signedIn) await ensureAgentForFloor(f, customBotToOfficeBot(cb));
  };
  /* Rename + configure from the chats (conversational actions): the
   * founder renames a person or rewrites their charter — mission,
   * vision, standing instructions, model — by talking, never by
   * digging through settings. Any seat, any floor. */
  const renameBotOnFloor = async (f: FloorDef, botKey: string, newName: string) => {
    const bot = botOnFloor(f, botKey);
    if (!bot) throw new Error('That agent is not in the building.');
    renamePerson(scopeFor(f, botKey), newName);
    const customs = f.key === floor.key ? customBotsRef.current : loadCustomBots(f);
    const ci = customs.findIndex((c) => c.key === botKey);
    if (ci >= 0) {
      const next = [...customs]; next[ci] = { ...next[ci], name: newName };
      if (f.key === floor.key) { customBotsRef.current = next; setCustomBots(next); } else saveCustomBots(f, next);
    }
    const id = f.key === floor.key ? await ensureBotAgent(bot) : await ensureAgentForFloor(f, bot);
    if (id) {
      const list = await callAgentsApi({ action: 'list' }).catch(() => null);
      const existing = (list?.agents || []).find((a: any) => a.id === id);
      if (existing && existing.name !== newName) {
        await callAgentsApi({ action: 'save', id, name: newName, description: existing.description ?? bot.duty, model: existing.model || 'llama-3.3-70b-versatile', system_prompt: existing.system_prompt || '', tools: existing.tools ?? [] });
      }
    }
  };
  const configureBotOnFloor = async (f: FloorDef, botKey: string, cfg: { mission?: string; vision?: string; instructions?: string; model?: string }) => {
    const bot = botOnFloor(f, botKey);
    if (!bot) throw new Error('That agent is not in the building.');
    const id = f.key === floor.key ? await ensureBotAgent(bot) : await ensureAgentForFloor(f, bot);
    if (!id) throw new Error(`Could not bring ${bot.name} online to configure — sign in and try again.`);
    const list = await callAgentsApi({ action: 'list' }).catch(() => null);
    const existing = (list?.agents || []).find((a: any) => a.id === id);
    const newPrompt = withCharter(basePromptFor(f, bot), cfg);
    await callAgentsApi({ action: 'save', id, name: existing?.name || personaName(scopeFor(f, botKey), bot.name), description: bot.duty, model: cfg.model || existing?.model || 'llama-3.3-70b-versatile', system_prompt: newPrompt, tools: existing?.tools ?? [] });
    savePromptOverride(f, botKey, newPrompt);
    setPersonnelPrompt(scopeFor(f, botKey), newPrompt);
    const customs = f.key === floor.key ? customBotsRef.current : loadCustomBots(f);
    const ci = customs.findIndex((c) => c.key === botKey);
    if (ci >= 0) {
      const next = [...customs]; next[ci] = { ...next[ci], prompt: newPrompt };
      if (f.key === floor.key) { promptOverridesRef.current = { ...promptOverridesRef.current, [botKey]: newPrompt }; customBotsRef.current = next; setCustomBots(next); } else saveCustomBots(f, next);
    } else if (f.key === floor.key) {
      promptOverridesRef.current = { ...promptOverridesRef.current, [botKey]: newPrompt };
    }
  };
  const resetAgentRole = async (botKey: string, prompt: string) => {
    const bot = botKey === 'manager' ? floor.manager : allBotsRef.current.find((b) => b.key === botKey);
    if (!bot) throw new Error('That agent is not on this floor.');
    const id = await ensureBotAgent(bot);
    if (!id) throw new Error(`Could not bring ${bot.name} online to reset it — sign in and try again.`);
    const existing = agents.find((a) => a.id === id);
    await callAgentsApi({ action: 'save', id, name: existing?.name || bot.name, description: bot.duty, model: existing?.model || 'llama-3.3-70b-versatile', system_prompt: prompt, tools: existing?.tools ?? [] });
    savePromptOverride(floor, botKey, prompt);
    setPersonnelPrompt(scopeFor(floor, botKey), prompt);
    promptOverridesRef.current = { ...promptOverridesRef.current, [botKey]: prompt };
    const ci = customBotsRef.current.findIndex((c) => c.key === botKey);
    if (ci >= 0) { const next = [...customBotsRef.current]; next[ci] = { ...next[ci], prompt }; customBotsRef.current = next; setCustomBots(next); }
    if (botKey === 'manager') { try { localStorage.removeItem(floor.managerChatKey); } catch { /* noop */ } }
  };
  const teamTools = {
    bots: [...ALL_BOTS, managerBot].map((b) => ({ key: b.key, name: b.name, duty: b.duty })),
    create: createCustomAgent,
    reset: resetAgentRole,
    rename: (botKey: string, name: string) => renameBotOnFloor(floor, botKey, name),
    configure: (botKey: string, cfg: { mission?: string; vision?: string; instructions?: string; model?: string }) => configureBotOnFloor(floor, botKey, cfg),
    fire: (botKey: string) => firePerson(floor.key, botKey, 'Admin', 'removed by the admin'),
    resetAll: async (template: string): Promise<string> => {
      const targets = [...allBotsRef.current, floor.manager];
      let ok = 0; const failed: string[] = [];
      for (const b of targets) {
        const role = [...floor.team, ...customBotsRef.current.map(customBotToRole)].find((t) => t.key === b.key);
        const prompt = template.split('{name}').join(b.name).split('{title}').join(role?.title || b.duty).split('{company}').join(floor.company);
        try { await resetAgentRole(b.key, prompt); ok++; } catch { failed.push(b.name); }
      }
      return failed.length ? `Reset ${ok} agents on this floor. Failed: ${failed.join(', ')}.` : `All ${ok} agents on this floor now work under the new role.`;
    },
  };
  /* ---------------- Firing & replacement (the 94% law) ----------------
   * Anyone can be fired — agents, Managers, CEOs, the Chairman. The org
   * store records the firing and generates the replacement (new name,
   * new persona, clean slate); here we perform the live effects: the old
   * call-agent is retired and unlinked everywhere at once, chats clear,
   * and a custom agent's record is replaced by its successor. A firing
   * ordered mid-shift QUEUES and lands the moment the shift ends, so a
   * company never stops running. */
  const roleLabelFor = (f: FloorDef, bot: OfficeBot): string =>
    bot.key === 'manager' ? `Manager of ${f.company}`
    : bot.key === 'ceo' ? `CEO of ${f.company}`
    : bot.key === 'chairman' ? 'Chairman of the building'
    : ([...f.team, ...loadCustomBots(f).map(customBotToRole)].find((t) => t.key === bot.key)?.title || bot.duty);
  const basePromptFor = (f: FloorDef, bot: OfficeBot): string => {
    const rec = getPersonnel(scopeFor(f, bot.key));
    if (rec) return rec.prompt;
    const custom = loadCustomBots(f).find((c) => c.key === bot.key);
    return loadPromptOverrides(f)[bot.key]
      || (bot.key === 'manager' ? f.managerPrompt
        : bot.key === 'chairman' ? CHAIRMAN_PROMPT
        : bot.key === 'ceo' ? ceoPrompt(f.company)
        : custom ? custom.prompt
        : ([...f.team, ...loadCustomBots(f).map(customBotToRole)].find((t) => t.key === bot.key)?.prompt
          || `You are ${bot.name}, an AI agent working in the ${f.company} office. Your job: ${bot.duty}`));
  };
  const applyFireNow = async (f: FloorDef, botKey: string, by: string, reason: string) => {
    const bot = botOnFloor(f, botKey);
    if (!bot) return;
    const scope = scopeFor(f, botKey);
    const linkId = f.key === floor.key ? (linksRef.current[botKey] || {}).agentId : (loadScopedLinks(f.key)[botKey] || {}).agentId;
    const taken = allFloors().flatMap((x) => [...x.bots.map((b) => b.name), ...loadCustomBots(x).map((c) => c.name), personaName(managerScope(x.key), ''), personaName(ceoScope(x.key), '')]).filter(Boolean);
    const rec = recordFiring({
      scope, roleLabel: roleLabelFor(f, bot), company: botKey === 'chairman' ? 'The Building' : f.company,
      oldName: personaName(scope, bot.name), basePrompt: basePromptFor(f, bot), reason, by, takenNames: taken, retireAgentId: linkId || null,
    });
    if (f.key === floor.key) { saveLinkFor(botKey, { agentId: undefined, aiOn: undefined }); autoBindTried.current.delete(botKey); }
    else { saveScopedLink(f.key, botKey, null); scopedTried.current.delete(`${f.key}:${botKey}`); }
    const customs = f.key === floor.key ? customBotsRef.current : loadCustomBots(f);
    const ci = customs.findIndex((c) => c.key === botKey);
    if (ci >= 0) {
      const slug = rec.personaName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'agent';
      const next = [...customs];
      next[ci] = { ...next[ci], key: `custom-${slug}-${Math.random().toString(36).slice(2, 6)}`, name: rec.personaName, prompt: rec.prompt };
      if (f.key === floor.key) { customBotsRef.current = next; setCustomBots(next); } else saveCustomBots(f, next);
    }
    if (botKey === 'manager') { try { localStorage.removeItem(f.managerChatKey); } catch { /* noop */ } }
  };
  const firePerson = async (floorKey: string, botKey: string, by: string, reason: string): Promise<{ queued: boolean }> => {
    const f = allFloors().find((x) => x.key === floorKey);
    if (!f) return { queued: false };
    const st = engineFor(f).getState();
    if (st && (st.status === 'running' || st.status === 'planning')) {
      addPendingFiring({ scope: scopeFor(f, botKey), floorKey, botKey, reason, by });
      logAction(by, 'decision', `${by} ordered the replacement of the ${roleLabelFor(f, botOnFloor(f, botKey) || floor.manager)} on Floor ${f.id} — it lands the moment the current shift ends, so the company keeps running.`);
      return { queued: true };
    }
    await applyFireNow(f, botKey, by, reason);
    return { queued: false };
  };
  /* Queued replacements land between shifts. */
  useEffect(() => {
    for (const p of getPendingFirings()) {
      const f = allFloors().find((x) => x.key === p.floorKey);
      if (!f) continue;
      const st = engineFor(f).getState();
      if (!st || (st.status !== 'running' && st.status !== 'planning')) void applyFireNow(f, p.botKey, p.by, p.reason);
    }
  }, [orgTick]); // eslint-disable-line react-hooks/exhaustive-deps
  const [execOpen, setExecOpen] = useState<'ceo' | 'chairman' | null>(null);
  /* The role router (see openPersonRef above): assigned here, once the
   * exec state exists — every "open this person" entry point calls it. */
  openPersonRef.current = (b: OfficeBot) => {
    if (b.key === 'manager') { setOpenBot(null); setShiftOpen(true); return; }
    if (b.key === 'ceo') { setOpenBot(null); setExecOpen('ceo'); return; }
    if (b.key === 'chairman') { setOpenBot(null); setExecOpen('chairman'); return; }
    setOpenBot(b);
  };
  const openPerson = (b: OfficeBot) => openPersonRef.current(b);
  const execTools: ExecTools = {
    fire: (floorKey, botKey, by, reason) => firePerson(floorKey, botKey, by, reason),
    recruit: (f, x) => createCustomAgentOnFloor(f, x),
    rename: (f, botKey, name) => renameBotOnFloor(f, botKey, name),
    configure: (f, botKey, cfg) => configureBotOnFloor(f, botKey, cfg),
    setFloorAccess: async (f, mode, passcode) => {
      await officeAdmin(f.id === 100 ? 'office' : `office-${f.id}`, 'setAccess', passcode ? { mode, passcode } : { mode });
    },
    chatWith: async (f, botKey, text) => {
      const bot = botOnFloor(f, botKey);
      if (!bot) throw new Error('That executive is not in the building.');
      const id = f.key === floor.key ? await ensureBotAgent(bot) : await ensureAgentForFloor(f, bot);
      if (!id) throw new Error('Could not bring them online — sign in and try again.');
      const r = await callAgentsApi({ action: 'run', agent_id: id, message: text });
      return runOutput(r) || 'Done.';
    },
    resolveAgentId: async (f, botKey) => {
      const bot = botOnFloor(f, botKey);
      if (!bot) return null;
      try {
        return f.key === floor.key ? await ensureBotAgent(bot) : await ensureAgentForFloor(f, bot);
      } catch { return null; }
    },
    dispatch: async (f, goal) => { await engineFor(f).startShift(goal); },
    openFloor: (floorId) => { window.location.href = floorId === 100 ? '/office' : `/office?floor=${floorId}`; },
    createFloorForDepartment: async (deptId, name) => {
      const f = createDynamicFloor(floor.company, name, deptId);
      updateDepartment(deptId, { floorId: f.id }, 'CEO');
      return f.id;
    },
  };
  const uiGuard = (e: any) => !!(e.target as HTMLElement)?.closest?.('[data-office-ui]');

  return (
    <div className="fixed inset-0 bg-[#02070E] text-foreground select-none touch-none"
      onPointerDown={(e) => { if (uiGuard(e)) return; void maybeAutoMic(); dragRef.current = { x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => { if (!dragRef.current) return; const evs = (e.nativeEvent as any).getCoalescedEvents?.() as PointerEvent[] | undefined; const last = evs?.length ? evs[evs.length - 1] : e.nativeEvent; const dx = last.clientX - dragRef.current.x, dy = last.clientY - dragRef.current.y; dragRef.current = { x: last.clientX, y: last.clientY }; const sens = e.pointerType === 'touch' ? 0.0042 : 0.005; camRef.current.yaw -= dx * sens; camRef.current.pitch = THREE.MathUtils.clamp(camRef.current.pitch + dy * 0.003, -0.1, 0.9); }}
      onPointerUp={() => { dragRef.current = null; }}>
      <Canvas dpr={[1, 1.5]} camera={{ position: [4, 3.4, 7], fov: 55 }}>
        <color attach="background" args={['#cfe2ef']} />
        <ambientLight intensity={1.05} />
        <hemisphereLight args={['#ffffff', '#b6c4cf', 0.55]} />
        <directionalLight position={[26, 34, 14]} intensity={1.7} color="#fff2df" />
        {/* A locally rendered environment (no external HDR): soft ceiling
            panels + window strips the characters' metal shells can reflect.
            Without an env map the dark metal reads almost black. */}
        <Environment resolution={256} frames={1} background={false}>
          <Lightformer intensity={2.2} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[11, 11, 1]} color="#ffffff" />
          <Lightformer intensity={1.3} position={[0, 2.5, 7]} scale={[9, 3.5, 1]} color="#eaf4ff" />
          <Lightformer intensity={1.5} position={[-7, 2.5, 0]} rotation-y={Math.PI / 2} scale={[9, 3, 1]} color="#cfe8ff" />
          <Lightformer intensity={1.5} position={[7, 2.5, 0]} rotation-y={-Math.PI / 2} scale={[9, 3, 1]} color="#ffe9c9" />
          <Lightformer intensity={0.9} position={[0, 2.5, -7]} rotation-y={Math.PI} scale={[9, 3, 1]} color="#dfeefc" />
        </Environment>
        <Suspense fallback={null}>
          {scene && <PublishedWorld scene={scene} renderCharacters={false} />}
          <BotTapRaycast />
          <BuildingShell currentFloorId={floor.id} />
          {scene && bots.map(({ bot, home, rotY, seatY }) => <OfficeBotCharacter key={bot.key} bot={bot} home={home} rotY={rotY} seatY={seatY} onOpen={openPerson} roam pinnedWork={workingKeys.has(bot.key)} />)}
          {scene && <OfficeBotCharacter bot={managerBot} home={MANAGER_HOME} rotY={0} seatY={0.52} seated={false} onOpen={() => setShiftOpen(true)} />}
          {scene && floor.executives.map((raw) => { const b = displayBot(floor, raw); return (
            <OfficeBotCharacter key={b.key} bot={b} home={b.key === 'chairman' ? CHAIRMAN_HOME : CEO_HOME} rotY={0} seatY={0.52} seated={false} onOpen={(bb) => setExecOpen(bb.key === 'chairman' ? 'chairman' : 'ceo')} />
          ); })}
          {scene && customOfficeBots.map((b, i) => (
            <OfficeBotCharacter key={b.key} bot={b} home={[-19 + (i % 8) * 2.4, 0, 12.8]} rotY={Math.PI} seatY={0.52} seated={false} onOpen={openPerson} />
          ))}
          {scene && agentChars.map((o) => (
            <OfficeBotCharacter key={`agent_${o.id}`} bot={{ key: `agent_${o.id}`, name: o.name || 'Agent', duty: 'AI agent character', model: o.url || AGENT_MODEL_URL, tint: colorFor(String(o.id)) }} home={[o.position?.[0] ?? 0, 0, o.position?.[2] ?? 5]} rotY={o.rotation?.[1] ?? 0} seatY={o.seatHeight ?? 0.52} seated={!!o.startSeated} pinnedWork={workingKeys.has(`agent_${o.id}`)} onOpen={(b) => { setLinks((cur) => { const next = { ...cur, [b.key]: { agentId: o.agentId, aiOn: true } }; try { localStorage.setItem(LINKS_KEY, JSON.stringify(next)); } catch {} return next; }); setOpenBot(b); }} />
          ))}
          {scene && socialFlags.presence && Object.entries(peers).map(([id, info]) => <PeerAvatar key={id} info={info} speaking={speakingIds.includes(id)} />)}
          {scene && socialFlags.theater && <OfficeTheaterScreen source={theater} screenBot={screenBot} screenLink={screenLink} screenAgent={screenAgent} screenRuns={screenRuns} board={boardRows} screenQueue={screenQueue} onPages={setPdfPages} />}
          {scene && <UnifiedPlayer def={playerDef} model={AGENT_PLAYER_MODEL_URL} tint="#ffffff" seatRef={seatRef} world={floor.id === 1
            ? { spawn: [4, 0, 6], bounds: { x: 92, z: 73, cx: 0, cz: 39 }, colliders: [{ x: 0, z: 0, r: 3.4 }, { x: 0, z: 52, r: 14 }, { x: 0, z: 104, r: 8 }], camClamp: { minX: -95, maxX: 95, minY: 0.7, maxY: 15, minZ: -32, maxZ: 110 } }
            : { spawn: [4, 0, 0], bounds: OFFICE_BOUNDS, colliders: OFFICE_DESKS.map((d) => ({ x: d.x, z: d.z, r: 1.0 })), camClamp: { minX: -21, maxX: 21, minY: 0.7, maxY: 7.3, minZ: -13.2, maxZ: 13.2 } }} lookRef={camRef} onMove={(x, z, ry) => { playerPos.set(x, 0, z); playerYaw.current = ry; }} />}
        </Suspense>
        <Proximity onNear={setNearKey} />
      </Canvas>

      {!scene && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-[#02070E] text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <div className="text-sm">Loading the live office…</div>
        </div>
      )}

      {gate && (
        <div data-office-ui className="fixed inset-0 z-[70] flex items-center justify-center bg-[#02070E]/95 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-2xl">
            <div className="text-base font-semibold">Floor {floor.id} · {floor.company}</div>
            {gate.kind === 'banned' ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">You are banned from this floor, so the door stays closed. If you think this is a mistake, ask a floor admin to lift the ban.</p>
              </>
            ) : gate.kind === 'invite_required' ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">This floor is private — you need an invitation. Paste the invitation link (or just its code) from a floor admin:</p>
                <input value={gateDraft} onChange={(e) => setGateDraft(e.target.value)} placeholder="Invitation link or code" className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-base" />
                <button disabled={!gateDraft.trim()} onClick={() => { const raw = gateDraft.trim(); const token = raw.includes('invite=') ? raw.split('invite=')[1].split(/[&\s]/)[0] : raw; gateCreds.current.invite = token; setGateDraft(''); setGate(null); setJoinKey((k) => k + 1); }} className="mt-3 w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-50">Enter with invitation</button>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">This floor is protected by a passcode.</p>
                {gate.kind === 'passcode_wrong' && <p className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">That passcode did not work — try again.</p>}
                <input type="password" value={gateDraft} onChange={(e) => setGateDraft(e.target.value)} placeholder="Floor passcode" className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-base" />
                <button disabled={!gateDraft.trim()} onClick={() => { const v = gateDraft.trim(); gateCreds.current.passcode = v; try { sessionStorage.setItem(`sfh:office-pass:${ROOM_NAME}`, v); } catch { /* private mode */ } setGateDraft(''); setGate(null); setJoinKey((k) => k + 1); }} className="mt-3 w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-50">Enter</button>
              </>
            )}
            {floor.id !== 100 && <button onClick={() => { window.location.href = '/office'; }} className="mt-3 w-full rounded-full border border-border px-4 py-2 text-sm">Go to Floor 100 instead</button>}
          </div>
        </div>
      )}

      <div data-office-ui className="absolute left-3 top-3 z-30 flex flex-col gap-1.5">
        <div className="relative">
          <button onClick={() => { setBuildingMenu((o) => !o); setOfficeMenu(false); setTeamMenu(false); }} className="rounded-full bg-background/90 border border-border px-3.5 py-2 text-xs shadow flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="font-semibold">Floor {floor.id}</span>
            <span className="text-muted-foreground hidden sm:inline">{floor.id < 99 ? floor.tagline : floor.company}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${buildingMenu ? 'rotate-180' : ''}`} />
          </button>
          {buildingMenu && (
            <div className="absolute left-0 top-[calc(100%+6px)] w-64 rounded-2xl bg-background/95 backdrop-blur border border-border shadow-2xl p-1.5">
              <div className="px-2.5 pt-1.5 pb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">The building — go to a floor</div>
              {allFloors().map((f) => (
                <button key={f.id} onClick={() => { closeMenus(); if (f.id !== floor.id) window.location.href = f.id === 100 ? '/office' : `/office?floor=${f.id}`; }} className={`w-full rounded-lg px-2.5 py-2 text-left text-xs flex items-center gap-2 hover:bg-muted ${f.id === floor.id ? 'bg-emerald-500/10 font-semibold' : ''}`}>
                  <span className="flex-1">Floor {f.id} · {f.id < 99 ? f.tagline : f.company}</span>
                  {f.id === floor.id && <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">You are here</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <OfficeAdminTab
          room={ROOM_NAME}
          floorLabel={`Floor ${floor.id}`}
          floorPath={floor.id === 100 ? '/office' : `/office?floor=${floor.id}`}
          selfIdentity={myIdentity}
          people={[...(myIdentity ? [{ identity: myIdentity, name: myName, me: true }] : []), ...Object.entries(peers).map(([identity, info]) => ({ identity, name: info.n }))]}
        />
      </div>

      {isAdmin && (
        <div data-office-ui className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2">
          <div className="relative">
            <button onClick={() => { setOfficeMenu((o) => !o); setBuildingMenu(false); setTeamMenu(false); }} className="rounded-full bg-background/90 border border-border px-3.5 py-2 text-xs font-medium shadow flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />Office{theater ? ' · on air' : ''}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${officeMenu ? 'rotate-180' : ''}`} />
            </button>
            {officeMenu && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-72 max-h-[74vh] overflow-y-auto touch-pan-y rounded-2xl bg-background/95 backdrop-blur border border-border shadow-2xl p-1.5">
                <div className="px-2.5 pt-1.5 pb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">This floor</div>
                {floor.id === 100 && outdated && scene && (
                  <button onClick={() => { void publishUpdatedScene(); }} disabled={publishing} className="w-full rounded-lg bg-emerald-500 px-2.5 py-2 text-left text-xs font-semibold text-emerald-950 flex items-center gap-2 disabled:opacity-60">
                    {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{publishing ? 'Publishing…' : 'Publish the updated office'}
                  </button>
                )}
                {pubNote && <div className="mt-1 rounded-lg bg-muted px-2.5 py-2 text-[11px]">{pubNote}</div>}
                {(() => { const wkey = floor.id === 100 ? 'office' : floor.id === 99 ? 'office99' : `floor${floor.id}`; return (
                  <button onClick={async () => { closeMenus(); const bid = findWorldLevelId(wkey); if (bid) { window.location.href = `/imagine-studio/${bid}`; return; } const w = worldForKey(wkey); if (w) { const l = await w.syncLevel(); window.location.href = `/imagine-studio/${l.id}`; } }} className="mt-1 w-full rounded-lg px-2.5 py-2 text-left text-xs flex items-center gap-2 hover:bg-muted">
                    <BoxIcon className="w-4 h-4" />Edit in 3D Studio
                  </button>
                ); })()}
                {socialFlags.theater && (
                  <>
                    <div className="px-2.5 pt-3 pb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
                      <Clapperboard className="w-3.5 h-3.5" />Theater{theater ? ' · on air' : ''}
                    </div>
                    <TheaterMenuItem icon={presenting ? Square : MonitorUp} label={presenting ? 'Stop sharing' : 'Share screen'} onClick={() => { void shareScreen(false); setOfficeMenu(false); }} />
                    <TheaterMenuItem icon={Video} label="Share camera" onClick={() => { void shareScreen(true); setOfficeMenu(false); }} />
                    <TheaterMenuItem icon={docRef.current ? Square : FileUp} label={docRef.current ? 'Stop document' : 'Present document'} onClick={() => { if (docRef.current) stopDoc(); else fileInputRef.current?.click(); setOfficeMenu(false); }} />
                    <TheaterMenuItem icon={micOn ? Mic : MicOff} label={micOn ? 'Mic on' : 'Mic off'} onClick={() => { void toggleMic(); setOfficeMenu(false); }} />
                    {theater && theater.kind !== 'dashboard' && <TheaterMenuItem icon={Square} label="Stop theater" onClick={() => { stopTheater(); setOfficeMenu(false); }} />}
                    <div className="px-2.5 pt-2.5 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5" />AI dashboard on theater
                    </div>
                    {theater?.kind === 'dashboard' && <TheaterMenuItem icon={Square} label="Stop dashboard" onClick={() => { stopTheater(); setOfficeMenu(false); }} />}
                    <div className="grid grid-cols-2 gap-1 p-1">
                      {TEAM_BOTS.map((b) => (
                        <button key={b.key} onClick={() => { void showDashboardOnTheater(b.key); setOfficeMenu(false); }} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs hover:bg-muted text-left">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.tint }} />{b.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {theaterNote && <div className="mt-1 rounded-lg bg-destructive/90 text-destructive-foreground px-2.5 py-2 text-[11px]">{theaterNote}</div>}
              </div>
            )}
          </div>
          {theaterNote && !officeMenu && <div className="rounded-lg bg-destructive/90 text-destructive-foreground px-3 py-1.5 text-xs max-w-[300px]">{theaterNote}</div>}
          <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { onDocFile(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      )}

      {theater && (
        <div data-office-ui className="absolute bottom-24 sm:bottom-20 right-4 z-20 flex items-center gap-2">
          {theater.kind === 'pdf' && docRef.current && (
            <>
              <button onClick={() => turnPage(-1)} className="rounded-full bg-background/90 border border-border p-2"><ChevronLeft className="w-4 h-4" /></button>
              <span className="rounded-full bg-background/90 border border-border px-2.5 py-1.5 text-xs">{docRef.current.page} / {pdfPages || '…'}</span>
              <button onClick={() => turnPage(1)} className="rounded-full bg-background/90 border border-border p-2"><ChevronRight className="w-4 h-4" /></button>
            </>
          )}
          <button onClick={() => { if (theater.kind === 'dashboard' && screenBot) openPerson(screenBot); else if (theater.kind !== 'dashboard') openTheaterFullscreen(theater as TheaterSource); }} className="rounded-full bg-background/90 border border-border px-3 py-2 text-xs flex items-center gap-1.5">
            <Maximize2 className="w-4 h-4" />Watch full screen
          </button>
        </div>
      )}

      {socialFlags.voice && (
        <>
          <button data-office-ui onClick={() => void toggleMic()} className={`absolute left-4 bottom-52 sm:bottom-6 z-20 rounded-full border p-3 shadow-lg ${micOn ? 'bg-emerald-500/90 text-white border-emerald-300/50' : 'bg-background/90 border-border'}`} aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}>
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          {micNote && <div data-office-ui onClick={() => setMicNote('')} className="absolute left-4 bottom-[15.5rem] sm:bottom-20 z-20 max-w-[260px] cursor-pointer rounded-lg bg-destructive/90 text-destructive-foreground px-3 py-1.5 text-xs">{micNote}</div>}
        </>
      )}

      {socialFlags.chat && (
        <>
          <button data-office-ui onClick={() => { setChatOpen((o) => !o); setUnread(0); }} className="absolute bottom-40 sm:bottom-6 right-4 z-20 rounded-full bg-background/90 border border-border p-3 shadow-lg" aria-label="Office chat">
            <MessageCircle className="w-5 h-5" />
            {unread > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>}
          </button>
          {chatOpen && (
            <div data-office-ui className="absolute bottom-56 sm:bottom-20 right-4 z-30 w-[320px] max-w-[88vw] h-[380px] max-h-[52vh] flex flex-col rounded-xl bg-background/95 backdrop-blur border border-border shadow-2xl overflow-hidden">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <span className="text-sm font-medium">Office chat</span>
                <span className="text-[11px] text-muted-foreground">{Object.keys(peers).length + 1} online</span>
              </div>
              <div className="flex-1 overflow-y-auto touch-pan-y p-3 space-y-2.5">
                {chatMsgs.length === 0 && <div className="text-xs text-muted-foreground">No messages yet — say hi to the room.</div>}
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`text-xs leading-relaxed ${m.me ? 'text-right' : ''}`}>
                    <span className="font-semibold">{m.me ? 'You' : m.from}</span>
                    <span className="text-muted-foreground"> · {new Date(m.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                    <div><span className={`inline-block rounded-lg px-2.5 py-1.5 mt-0.5 text-left ${m.me ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{m.text}</span></div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-border flex gap-2">
                <input value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }} placeholder="Message the room…" className="flex-1 min-w-0 bg-transparent border border-border rounded-lg px-2.5 py-2 text-base outline-none" />
                <button onClick={sendChat} className="rounded-lg bg-primary text-primary-foreground px-3" aria-label="Send chat message"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}

      {nearBot && !openBot && (
        <button data-office-ui onClick={() => openPerson(nearBot)} className="absolute bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-lg flex items-center gap-2">
          <Play className="w-4 h-4" />Open {nearBot.name}&rsquo;s dashboard
        </button>
      )}

      {/* Mobile controls — the SAME shared touch UI as every world (joystick + jump/run/interact + look pad) */}
      {!openBot && <MobileTouchControls visible layerClass="z-10" />}

      {/* Agents console — the dashboard Agents tab (2D Muse AI console), inside the office */}
      {openBot && (
        <div data-office-ui className="absolute z-30 inset-0 w-full min-w-0 overflow-hidden bg-background shadow-2xl flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
            <span className="w-9 h-9 rounded-full shrink-0 border border-border" style={{ background: openBot.tint }} />
            <div className="mr-auto min-w-0">
              <div className="font-semibold truncate">{openBot.name} — {panelView === 'genius' ? 'Genius chat' : 'Agents'}</div>
              <div className="text-[11px] text-muted-foreground truncate">{panelView === 'genius' ? `${openBot.duty} · chat with this agent and hand it tasks` : `${openBot.duty} · the Agents console — identical to your dashboard`}</div>
            </div>
            <div className="hidden md:flex rounded-full border border-border p-0.5 shrink-0">
              <button onClick={() => setPanelView('genius')} className={`rounded-full px-3 py-1.5 text-xs ${panelView === 'genius' ? 'bg-emerald-500 text-emerald-950 font-semibold' : 'hover:bg-muted'}`}>Genius chat</button>
              <button onClick={() => setPanelView('console')} className={`rounded-full px-3 py-1.5 text-xs ${panelView === 'console' ? 'bg-emerald-500 text-emerald-950 font-semibold' : 'hover:bg-muted'}`}>Agents tab</button>
            </div>
            {isAdmin && TEAM_BOTS.some((b) => b.key === openBot.key) && <button onClick={() => { void showDashboardOnTheater(openBot.key); }} className="hidden sm:flex rounded-full border border-border px-3 py-1.5 text-xs items-center gap-1.5 hover:bg-muted"><LayoutDashboard className="w-3.5 h-3.5" />Theater</button>}
            <button onClick={() => { setOpenBot(null); void refreshAgents(); }} className="p-1.5 rounded-full hover:bg-muted" aria-label="Close agents"><X className="w-5 h-5" /></button>
          </div>
          {panelView === 'genius' ? (
            <div className="flex-1 min-h-0 min-w-0">
              <OfficeAgentPanel bot={openBot} link={link} agents={agents} signedIn={signedIn} working={workingKeys.has(openBot.key)} onOpenConsole={() => setPanelView('console')} docFloor={{ floorKey: floor.key, floorId: floor.id, company: floor.company }} teamBots={[...allBotsRef.current, floor.manager]} onRename={(k, n) => renameBotOnFloor(floor, k, n)} onConfigure={(k, cfg) => configureBotOnFloor(floor, k, cfg)} />
            </div>
          ) : (
            <div className="flex-1 min-w-0 overflow-y-auto overflow-x-clip overscroll-contain touch-pan-y">
              {signedIn ? (
                <Suspense fallback={<div className="p-6 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading the Agents console…</div>}>
                  <SFHCallAgents key={agentsKey} botLink={botLink} />
                </Suspense>
              ) : (
                <div className="p-6 text-sm text-muted-foreground">This panel is the full Agents console from your Startup Factory Hub dashboard — the same agents, runs, pipelines, sharing and vault. Sign in to use it here, standing next to {openBot.name}.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* THE ELEVATOR (founder directive 2026-10-26): in the Lobby, the
          elevator takes users to the building's other floors. */}
      {floor.id === 1 && (
        <div data-office-ui className="absolute left-1/2 -translate-x-1/2 bottom-40 sm:bottom-24 z-20 flex flex-col items-center">
          {elevatorOpen && (
            <div className="mb-2 w-64 rounded-2xl bg-background/95 backdrop-blur border border-border shadow-2xl p-1.5">
              <div className="px-2.5 pt-1.5 pb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Elevator — choose a floor</div>
              {allFloors().filter((f) => f.id !== 1).map((f) => (
                <button key={f.id} onClick={() => { window.location.href = f.id === 100 ? '/office' : `/office?floor=${f.id}`; }} className="w-full rounded-lg px-2.5 py-2 text-left text-xs hover:bg-muted flex items-center justify-between">
                  <span className="font-semibold">Floor {f.id}</span><span className="text-muted-foreground">{f.company}</span>
                </button>
              ))}
              <button onClick={() => { window.location.href = '/plaza'; }} className="w-full rounded-lg px-2.5 py-2 text-left text-xs hover:bg-muted flex items-center justify-between">
                <span className="font-semibold">Plaza</span><span className="text-muted-foreground">Outside the building</span>
              </button>
            </div>
          )}
          <button onClick={() => setElevatorOpen((v) => !v)} className="flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2.5 text-xs font-semibold shadow-lg backdrop-blur hover:bg-muted">
            <ArrowUpDown className="w-4 h-4 text-cyan-300" /> Elevator
          </button>
        </div>
      )}

      {/* Sit / stand at an empty desk (founder directive 2026-10-26). */}
      {(seatedAt != null || nearSeat != null) && (
        <div data-office-ui className="absolute left-1/2 -translate-x-1/2 bottom-24 sm:bottom-6 z-20">
          {seatedAt != null ? (
            <button onClick={standUp} className="flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2.5 text-xs font-semibold shadow-lg backdrop-blur hover:bg-muted">
              <Armchair className="w-4 h-4 text-emerald-400" /> You're seated — stand up
            </button>
          ) : (
            <button onClick={() => nearSeat != null && sitAt(nearSeat)} className="flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2.5 text-xs font-semibold shadow-lg backdrop-blur hover:bg-muted">
              <Armchair className="w-4 h-4 text-emerald-400" /> Sit at this desk
            </button>
          )}
        </div>
      )}

      {/* The Team dropdown (founder directive 2026-10-25 — simplified
          chrome): the Manager's Shift Control and the executive suite
          (CEO of this company, Chairman of the building) live behind
          ONE button now, instead of a stack of floating buttons. They
          are also in the room — walk up to them and tap. */}
      <div data-office-ui className="absolute right-4 bottom-24 sm:bottom-6 z-20">
        <div className="relative flex flex-col items-end">
          {teamMenu && (
            <div className="absolute bottom-[calc(100%+8px)] right-0 w-72 rounded-2xl bg-background/95 backdrop-blur border border-border shadow-2xl p-1.5">
              <div className="px-2.5 pt-1.5 pb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Run the company</div>
              <button onClick={() => { closeMenus(); setShiftOpen(true); }} className="w-full rounded-lg px-2.5 py-2.5 text-left hover:bg-muted flex items-start gap-2.5">
                <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-[#FFD166]" />
                <span><span className="block text-xs font-semibold">Manager · Shift Control</span><span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">Give Floor {floor.id} a goal — the Manager plans and runs the shift.</span></span>
              </button>
              <button onClick={() => { closeMenus(); setExecOpen('ceo'); }} className="w-full rounded-lg px-2.5 py-2.5 text-left hover:bg-muted flex items-start gap-2.5">
                <LayoutDashboard className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                <span><span className="block text-xs font-semibold">CEO · {floor.company}</span><span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">The whole company: floors, Managers, departments, scores.</span></span>
              </button>
              <button onClick={() => { closeMenus(); setExecOpen('chairman'); }} className="w-full rounded-lg px-2.5 py-2.5 text-left hover:bg-muted flex items-start gap-2.5">
                <Crown className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300" />
                <span><span className="block text-xs font-semibold">Chairman · Building</span><span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">Every company and floor — ratings, reports, decisions.</span></span>
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => { setTeamMenu((o) => !o); setBuildingMenu(false); setOfficeMenu(false); }} className="flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2.5 text-xs font-semibold shadow-lg backdrop-blur hover:bg-muted">
              <Users className="w-4 h-4" /> Team
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${teamMenu ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      {shiftOpen && <ShiftPanel engine={engine} team={applyPersonnelToRoles(floor.key, [...floor.team, ...customBots.map(customBotToRole)])} company={floor.company} floorLabel={`Floor ${floor.id}`} floorKey={floor.key} floorId={floor.id} archivistLabel={floor.archivistLabel} managerChatKey={floor.managerChatKey} teamTools={teamTools} signedIn={signedIn} onClose={() => setShiftOpen(false)} />}
      {execOpen && <ExecPanel kind={execOpen} floor={floor} tools={execTools} signedIn={signedIn} isAdmin={isAdmin} onClose={() => setExecOpen(null)} />}

      {/* Branded intro — the signed-in account's name + logo, not a fixed brand */}
      {!introGone && (
        <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center px-6 text-center transition-opacity duration-700 ${scene ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} style={{ background: 'radial-gradient(1200px 600px at 50% 30%, #0A1B2E 0%, #02070E 62%)' }}>
          <style>{`@keyframes sfhscan { 0% { transform: translateX(-110%); } 100% { transform: translateX(330%); } }`}</style>
          <div className="text-[11px] tracking-[0.35em] text-[#00E5FF]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{brand.kind === 'guest' ? '// STARTUP FACTORY HUB' : '// POWERED BY STARTUP FACTORY HUB'}</div>
          {brand.logoUrl && <img src={brand.logoUrl} alt={brand.name} className="mt-5 h-16 w-16 rounded-2xl object-cover border border-white/20" />}
          <div className="mt-3 max-w-[92vw] text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{brand.name.toUpperCase()}</div>
          <div className="mt-2 text-xs sm:text-sm tracking-[0.5em] text-[#2EF8A0]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{brand.kind === 'company' ? 'HEADQUARTERS' : brand.kind === 'person' ? 'VIRTUAL OFFICE' : 'NEW YORK CITY OFFICE'}</div>
          <div className="mt-5 max-w-md text-sm text-white/60">The 3D home of your AI agents. Walk in, meet the team, put them to work — together.</div>
          <div className="mt-8 h-[3px] w-56 overflow-hidden rounded bg-white/10"><div className="h-full w-1/3 rounded bg-[#00E5FF]" style={{ animation: 'sfhscan 1.15s ease-in-out infinite' }} /></div>
          <div className="mt-4 text-[11px] text-white/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{scene ? (outdated ? 'UPDATED OFFICE READY — ADMIN PUBLISH PENDING' : pubMeta?.live ? 'LIVE WORLD LOADED — WELCOME IN' : 'BUILT-IN COPY LOADED — WELCOME IN') : 'LOADING THE LIVE WORLD…'}</div>
        </div>
      )}
    </div>
  );
}
