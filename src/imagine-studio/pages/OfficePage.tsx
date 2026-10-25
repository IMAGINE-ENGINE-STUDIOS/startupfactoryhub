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
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useGLTF, useAnimations } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { Room, RoomEvent, Track } from 'livekit-client';
import { Bot as BotIcon, Box as BoxIcon, Check, ChevronDown, ChevronLeft, ChevronRight, Clapperboard, FileUp, LayoutDashboard, Loader2, Maximize2, MessageCircle, Mic, MicOff, MonitorUp, Play, Send, Sparkles, Square, Video, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { PublishedWorld } from '@/imagine-studio/components/plaza/PublishedWorld';

const SFHCallAgents = lazy(() => import('@/components/call-agents/SFHCallAgents'));
import { useSourceTexture, type TheaterSource } from '@/imagine-studio/components/plaza/TheaterScreen';
import { openTheaterFullscreen } from '@/imagine-studio/components/plaza/TheaterFullscreen';
import { OFFICE_BOTS, OFFICE_BOUNDS, OFFICE_DESKS, OFFICE_LEVEL_NAME, OFFICE_SCENE_VERSION, OFFICE_WAYPOINTS, buildOfficeScene, fetchPublishedOfficeMeta, mergeOfficeScenes, syncOfficeLevelToPublished, type OfficeBot } from '@/imagine-studio/lib/officeWorld';
import { UnifiedPlayer } from '@/imagine-studio/components/player/UnifiedPlayer';
import { playerControllerFor } from '@/imagine-studio/lib/controllers';
import MobileTouchControls from '@/imagine-studio/components/level/play/MobileTouchControls';
import { applyPose, buildSeatedLegsPose } from '@/imagine-studio/lib/actionPoses';
import { findWorldLevelId } from '@/imagine-studio/lib/worldBindings';
import StudioMobileNav from '@/imagine-studio/components/shared/StudioMobileNav';

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

type CalJoint = { bone: any; axis: 'x' | 'y' | 'z'; sign: 1 | -1 };
const _cq = new THREE.Quaternion();
const _cv = new THREE.Vector3();
/** Finds the local rotation on `bone` that swings `child` most toward
 * `dirWorld` — the same calibration trick the Rig Room poses use, so the
 * typing pose fits whatever humanoid rig the body carries. */
function calibrateJoint(rootObj: THREE.Object3D, bone: any, child: any, dirWorld: THREE.Vector3): CalJoint | null {
  rootObj.updateMatrixWorld(true);
  const before = child.getWorldPosition(new THREE.Vector3());
  const saved = bone.quaternion.clone();
  let best: (CalJoint & { score: number }) | null = null;
  for (const axis of ['x', 'y', 'z'] as const) {
    for (const sign of [1, -1] as const) {
      bone.quaternion.copy(saved);
      _cq.setFromAxisAngle(axis === 'x' ? _cv.set(1, 0, 0) : axis === 'y' ? _cv.set(0, 1, 0) : _cv.set(0, 0, 1), sign * 0.4);
      bone.quaternion.multiply(_cq);
      rootObj.updateMatrixWorld(true);
      const after = child.getWorldPosition(new THREE.Vector3());
      const score = after.sub(before).dot(dirWorld);
      if (!best || score > best.score) best = { bone, axis, sign, score };
    }
  }
  bone.quaternion.copy(saved);
  rootObj.updateMatrixWorld(true);
  return best && best.score > 1e-4 ? { bone: best.bone, axis: best.axis, sign: best.sign } : null;
}
const boneByName = (rootObj: THREE.Object3D, pats: string[]) => {
  let f: any = null;
  rootObj.traverse((o: any) => { if (!f && o.isBone && pats.some((p) => o.name.toLowerCase().includes(p))) f = o; });
  return f;
};
/** Calibrated typing rig for one body: upper arms raised toward the desk,
 * forearms bent, palms tapping — or null when the body has no arms to pose. */
function buildTypingRig(rootObj: THREE.Object3D, model: THREE.Object3D, rotY: number) {
  const fwd = new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY));
  const fwdUp = fwd.clone().add(new THREE.Vector3(0, 0.35, 0)).normalize();
  const side = (s: 'l' | 'r') => {
    const up = boneByName(model, [`upperarm.${s}`, `upperarm_${s}`, `${s === 'l' ? 'left' : 'right'}upperarm`, `${s === 'l' ? 'left' : 'right'}arm`]);
    const lo = boneByName(model, [`lowerarm.${s}`, `lowerarm_${s}`, `${s === 'l' ? 'left' : 'right'}forearm`, `${s === 'l' ? 'left' : 'right'}lowerarm`]);
    const palm = boneByName(model, [`palm1.${s}`, `palm.${s}`, `${s === 'l' ? 'left' : 'right'}hand`]);
    if (!up || !lo) return null;
    const u = calibrateJoint(rootObj, up, lo, fwd);
    const l = calibrateJoint(rootObj, lo, palm || lo.children?.[0] || lo, fwdUp);
    const p = palm ? calibrateJoint(rootObj, palm, palm, fwd) : null;
    return u && l ? { up: { ...u, bone: up }, lo: { ...l, bone: lo }, palm: p && palm ? { ...p, bone: palm } : null } : null;
  };
  const L = side('l'), R = side('r');
  return L || R ? { L, R } : null;
}
const stampJoint = (j: CalJoint | null, angle: number) => {
  if (!j) return;
  _cq.setFromAxisAngle(j.axis === 'x' ? _cv.set(1, 0, 0) : j.axis === 'y' ? _cv.set(0, 1, 0) : _cv.set(0, 0, 1), j.sign * angle);
  j.bone.quaternion.multiply(_cq);
};

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
    m.traverse((o: any) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; const mats = Array.isArray(o.material) ? o.material : [o.material]; const next = mats.map((mt: any) => { const c = mt.clone(); if (c.color && !c.map) c.color.copy(skin); return c; }); o.material = Array.isArray(o.material) ? next : next[0]; } });
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
  const typeRigRef = useRef<any | undefined>(undefined);
  useEffect(() => { botPos.set(bot.key, new THREE.Vector3(home[0], 0, home[2])); return () => { botPos.delete(bot.key); }; }, [bot.key]); // eslint-disable-line
  useFrame((state, dtRaw) => {
    const g = root.current; if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const s = st.current;
    const pos = { x: g.position.x, z: g.position.z };
    // A fresh job pins the bot to its desk, from wherever it is.
    if (pinnedRef.current && s.phase === 'hang') { s.path = officePath(pos, { x: home[0], z: home[2] }); s.after = 'work'; setPhase('walk'); }
    if (s.phase === 'work') {
      // Sit (clip clamped on its last frame, or the procedural legs pose)
      // and TYPE: the calibrated arm rig is stamped after the mixer, the
      // hands alternating like keystrokes.
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
        if (typeRigRef.current === undefined) { g.updateMatrixWorld(true); try { typeRigRef.current = buildTypingRig(g as any, model, rotY); } catch { typeRigRef.current = null; } }
        const rig = typeRigRef.current;
        if (rig) {
          const t = state.clock.elapsedTime * 9;
          for (const [sideRig, ph] of [[rig.L, 0], [rig.R, Math.PI]] as const) {
            if (!sideRig) continue;
            stampJoint(sideRig.up, 0.52);
            stampJoint(sideRig.lo, 0.6 + Math.sin(t + ph) * 0.1);
            stampJoint(sideRig.palm, Math.sin(t + ph + 0.7) * 0.07);
          }
        }
      } else {
        playClip(clipOf.idle);
      }
      let dyaw = rotY - g.rotation.y; while (dyaw > Math.PI) dyaw -= Math.PI * 2; while (dyaw < -Math.PI) dyaw += Math.PI * 2;
      g.rotation.y += dyaw * Math.min(1, dt * 6);
      s.t -= dt;
      if (s.t <= 0 && roam && !pinnedRef.current) {
        const wp = OFFICE_WAYPOINTS[(seed + Math.floor(state.clock.elapsedTime / 47)) % OFFICE_WAYPOINTS.length];
        s.path = officePath(pos, { x: wp[0], z: wp[1] });
        s.after = 'hang'; s.waved = false;
        if (s.path.length) setPhase('walk'); else { s.t = 8; }
      }
    } else if (s.phase === 'walk') {
      playClip(clipOf.walk || clipOf.idle);
      const target = s.path[0];
      if (!target) { setPhase(s.after === 'hang' ? 'hang' : 'work'); s.t = s.after === 'hang' ? 6 + (seed % 9) : 22 + (seed % 34); }
      else {
        const dx = target[0] - pos.x, dz = target[1] - pos.z;
        const dist = Math.hypot(dx, dz);
        const step = Math.min(dist, dt * 1.3);
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
      // Hanging around: idle, a slow look around the room, the odd wave.
      if (clipOf.wave && !s.waved && seed % 2 === 0) { s.waved = true; playClip(clipOf.wave, true); }
      else {
        const wa = clipOf.wave ? actions[clipOf.wave] : null;
        if (!(wa && wa.isRunning() && wa.time < wa.getClip().duration - 0.05)) playClip(clipOf.idle);
      }
      g.rotation.y = rotY + Math.sin(state.clock.elapsedTime * 0.35 + seed) * 0.45;
      s.t -= dt;
      if (s.t <= 0) { s.path = officePath(pos, { x: home[0], z: home[2] }); s.after = 'work'; if (s.path.length) setPhase('walk'); else { setPhase('work'); s.t = 22 + (seed % 34); } }
    }
    botPos.set(bot.key, new THREE.Vector3(g.position.x, 0, g.position.z));
  });
  const dot = status === 'Working' ? '#34d399' : status === 'Walking' ? '#38bdf8' : '#fbbf24';
  return (
    <group ref={root} position={home} rotation={[0, rotY, 0]} onClick={(e) => { e.stopPropagation(); onOpen(bot); }}>
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
type PeerInfo = { x: number; z: number; ry: number; m: boolean; n: string; c: string };
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
    m.traverse((o: any) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; const mats = Array.isArray(o.material) ? o.material : [o.material]; const next = mats.map((mt: any) => { const c = mt.clone(); if (c.color && !c.map) c.color.copy(skin); return c; }); o.material = Array.isArray(o.material) ? next : next[0]; } });
    return m;
  }, [scene, info.c]);
  const root = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, root);
  const cur = useRef(new THREE.Vector3(info.x, 0, info.z));
  useFrame((_, dt) => {
    const g = root.current; if (!g) return;
    const k = Math.min(1, dt * 8);
    cur.current.x += (info.x - cur.current.x) * k;
    cur.current.z += (info.z - cur.current.z) * k;
    g.position.set(cur.current.x, 0, cur.current.z);
    let diff = info.ry - g.rotation.y; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
    g.rotation.y += diff * k;
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
  return brand;
}

export function OfficeTheaterScreen({ source, screenBot, screenLink, screenAgent, screenRuns, onPages }: {
  source: OfficeTheater;
  screenBot: OfficeBot | null; screenLink: BotLink; screenAgent: any; screenRuns: any[];
  onPages: (n: number) => void;
}) {
  const texSrc = source && source.kind !== 'dashboard' ? (source as TheaterSource) : null;
  const { tex, pages } = useSourceTexture(texSrc);
  useEffect(() => { onPages(pages); }, [pages]); // eslint-disable-line
  const brand = useOfficeBrand();
  const idle = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 576;
    const g = c.getContext('2d')!; g.fillStyle = '#0d1117'; g.fillRect(0, 0, 1024, 576);
    g.fillStyle = '#e6edf3'; g.textAlign = 'center';
    const title = `${brand.name} Theater`;
    let size = 52; g.font = `600 ${size}px sans-serif`;
    while (g.measureText(title).width > 940 && size > 22) { size -= 4; g.font = `600 ${size}px sans-serif`; }
    g.fillText(title, 512, 268); g.font = '27px sans-serif'; g.fillStyle = '#8b949e';
    g.fillText('Ready — an admin can share a screen, camera, document or AI dashboard', 512, 328);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [brand]);
  const isDash = source?.kind === 'dashboard';
  return (
    <group position={[0, 2.15, -15.55]}>
      <mesh position={[0, 0, -0.16]}><boxGeometry args={[7.5, 3.55, 0.18]} /><meshStandardMaterial color="#14171c" /></mesh>
      {!isDash && (
        <mesh>
          <planeGeometry args={[7.2, 3.3]} />
          <meshBasicMaterial map={tex || idle} toneMapped={false} />
        </mesh>
      )}
      {isDash && screenBot && (
        <Html position={[0, 0, 0.05]} center distanceFactor={10.4} zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'none', width: 720, height: 330, boxSizing: 'border-box', background: '#0b1220', color: '#e6ecff', borderRadius: 14, padding: '20px 24px', font: '400 15px system-ui', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 16, height: 16, borderRadius: 999, background: screenBot.tint, display: 'inline-block' }} />
              <span style={{ font: '700 24px system-ui' }}>{screenBot.name}</span>
              <span style={{ opacity: 0.75 }}>{screenBot.duty}</span>
            </div>
            <div style={{ marginTop: 6, opacity: 0.85 }}>{screenAgent ? `Powered by AI — ${screenAgent.name}` : 'NPC bot — not linked to an agent yet'}</div>
            <div style={{ marginTop: 14, font: '600 13px system-ui', letterSpacing: 1, opacity: 0.6 }}>LATEST JOBS</div>
            {screenRuns.length === 0 && <div style={{ marginTop: 8, opacity: 0.75 }}>No jobs yet. Open this bot&rsquo;s dashboard and assign the first one.</div>}
            {screenRuns.slice(0, 3).map((r) => (
              <div key={r.id} style={{ marginTop: 10, background: 'rgba(255,255,255,.05)', borderRadius: 10, padding: '8px 12px' }}>
                <div style={{ font: '600 12px system-ui', opacity: 0.7 }}>{r.status === 'ok' ? 'DONE' : String(r.status).toUpperCase()} · {new Date(r.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                {r.input && <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.input}</div>}
                {r.output && <div style={{ opacity: 0.75, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.output}</div>}
              </div>
            ))}
          </div>
        </Html>
      )}
      {source && !isDash && (
        <Html position={[0, -2.25, 0.2]} center distanceFactor={18} style={{ pointerEvents: 'none' }}>
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

/* ---------------- Per-agent Genius panel ----------------
 * What a bot click opens (founder directive 2026-10-25): a chat in the
 * Genius bubble's full-screen language — emerald glass, mono micro-labels —
 * scoped to THIS agent, with its slice of the task pipeline (in progress /
 * in queue / done) and a button into the entire Agents tab. The queue is
 * the same localStorage queue the Agents tab runs ('sfh:agents-task-queue:v1'),
 * so tasks line up identically in the office and in the dashboard. */
function OfficeAgentPanel({ bot, link, agents, signedIn, working, onSaveLink, onOpenConsole }: {
  bot: OfficeBot; link: BotLink; agents: any[]; signedIn: boolean; working: boolean;
  onSaveLink: (patch: BotLink) => void; onOpenConsole: () => void;
}) {
  const agentId = link.agentId;
  const linkedAgent = agents.find((a) => a.id === agentId);
  const [msgs, setMsgs] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [runs, setRuns] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [pick, setPick] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);
  const loadRuns = async () => {
    if (!agentId) { setRuns([]); return; }
    const { data } = await supabase.from('call_agent_runs').select('id, input, output, status, created_at').eq('agent_id', agentId).order('created_at', { ascending: false }).limit(6);
    setRuns(data || []);
  };
  const loadQueue = () => {
    try { const all = JSON.parse(localStorage.getItem('sfh:agents-task-queue:v1') || '[]'); setQueue(Array.isArray(all) ? all.filter((q: any) => q?.agentId === agentId) : []); } catch { setQueue([]); }
  };
  useEffect(() => { setMsgs([]); setInput(''); void loadRuns(); loadQueue(); const iv = setInterval(loadQueue, 5000); return () => clearInterval(iv); }, [bot.key, agentId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const el = threadRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs, busy]);
  const send = async () => {
    const text = input.trim();
    if (!text || busy || !agentId) return;
    setInput('');
    setMsgs((m) => [...m, { role: 'user', content: text }]);
    setBusy(true);
    try {
      const r = await callAgentsApi({ action: 'run', agent_id: agentId, message: text });
      const out = (r?.steps || []).map((s: any) => s.output).filter(Boolean).join('\n\n') || r?.output || 'Done.';
      setMsgs((m) => [...m, { role: 'assistant', content: out }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: 'assistant', content: `That run failed: ${e?.message || 'unknown error'}` }]);
    }
    setBusy(false);
    void loadRuns(); loadQueue();
  };
  const laneLabel = "font-mono text-[10px] uppercase tracking-wider text-emerald-300/70 w-24 shrink-0 pt-0.5";
  return (
    <div className="flex h-full flex-col bg-[#050d0a] text-emerald-50">
      <div className="shrink-0 border-b border-emerald-400/10 px-4 py-3 space-y-2.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: bot.tint }} />
          {linkedAgent ? <span className="truncate">Powered by <b>{linkedAgent.name}</b></span> : <span className="text-emerald-100/70 truncate">NPC bot — not linked to one of your agents yet</span>}
          <span className={`ml-auto shrink-0 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${working ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-emerald-100/50'}`}>{working ? 'On a job now' : 'Idle'}</span>
        </div>
        <div className="grid gap-1.5 text-xs">
          <div className="flex gap-2"><span className={laneLabel}>In progress</span>{busy ? <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Running your task…</span> : <span className="text-emerald-100/50">Nothing running</span>}</div>
          <div className="flex gap-2"><span className={laneLabel}>In queue</span>{queue.length ? <span className="truncate">{queue.length} queued · next: “{String(queue[0].message || '').slice(0, 60)}”</span> : <span className="text-emerald-100/50">Empty — line tasks up in the Agents tab</span>}</div>
          <div className="flex gap-2"><span className={laneLabel}>Done</span>
            <div className="min-w-0 flex-1 space-y-1">
              {runs.length === 0 && <span className="text-emerald-100/50">No finished tasks yet</span>}
              {runs.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center gap-1.5 min-w-0">
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full shrink-0 ${r.status === 'ok' ? 'bg-emerald-500 text-emerald-950' : 'bg-red-500/80 text-white'}`}>{r.status === 'ok' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}</span>
                  <span className="truncate">{r.input || r.output || 'Task'}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-emerald-100/40">{new Date(r.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div ref={threadRef} className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4 space-y-3">
        {msgs.length === 0 && <div className="text-sm text-emerald-100/60 leading-relaxed">This is {bot.name} — {bot.duty} Give it a task below and it runs right here; finished work lands in Done above and in the Agents tab.</div>}
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[88%] rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'ml-auto bg-emerald-500/15 border-emerald-400/25' : 'bg-white/5 border-white/10'}`}>
            {m.role === 'assistant' ? <div className="prose prose-sm prose-invert max-w-none [&>p]:my-1.5"><ReactMarkdown>{m.content}</ReactMarkdown></div> : m.content}
          </div>
        ))}
        {busy && <div className="flex items-center gap-2 text-xs text-emerald-100/60"><Loader2 className="w-4 h-4 animate-spin" />{bot.name} is working…</div>}
      </div>
      <div className="shrink-0 border-t border-emerald-400/10 px-4 py-3 space-y-2.5">
        {!signedIn ? (
          <div className="text-xs text-emerald-100/60">Sign in to chat with {bot.name} and hand it tasks.</div>
        ) : !agentId ? (
          <div className="flex gap-2">
            <select value={pick} onChange={(e) => setPick(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-emerald-400/20 bg-black/40 px-3 py-2.5 text-sm outline-none">
              <option value="">Choose one of your agents…</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button disabled={!pick} onClick={() => onSaveLink({ agentId: pick, aiOn: true })} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 disabled:opacity-50">Link</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void send(); }} placeholder={`Give ${bot.name} a task…`} className="min-w-0 flex-1 rounded-xl border border-emerald-400/20 bg-black/40 px-3.5 py-2.5 text-sm outline-none placeholder:text-emerald-100/35" />
            <button onClick={() => void send()} disabled={busy || !input.trim()} className="rounded-xl bg-emerald-500 px-3.5 py-2.5 text-emerald-950 disabled:opacity-50" aria-label="Send task"><Send className="h-4 w-4" /></button>
          </div>
        )}
        <button onClick={onOpenConsole} className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20">
          <LayoutDashboard className="h-4 w-4" />See the entire Agents tab
        </button>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function OfficePage() {
  const brand = useOfficeBrand();
  const [published, setPublished] = useState<any>(undefined);
  const [pubMeta, setPubMeta] = useState<{ publishedAt: string | null; live: boolean } | null>(null);
  useEffect(() => {
    let off = false;
    fetchPublishedOfficeMeta()
      .then((m) => { if (off) return; if (m) { setPublished(m.scene); setPubMeta({ publishedAt: m.publishedAt, live: true }); } else setPubMeta({ publishedAt: null, live: false }); })
      .catch(() => { if (!off) setPubMeta({ publishedAt: null, live: false }); });
    return () => { off = true; };
  }, []);
  const codeScene = useMemo(() => buildOfficeScene(), []);
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
    const chairs = (scene?.objects || []).filter((o: any) => /^Agent Chair \d+$/.test(o.name || ''));
    return OFFICE_BOTS.map((bot, i) => {
      const c = chars.find((o: any) => (o.name || '').toLowerCase().includes(bot.name.toLowerCase())) || chars[i];
      const home: [number, number, number] = c ? [c.position[0], 0, c.position[2]] : [OFFICE_DESKS[i].x, 0, OFFICE_DESKS[i].z + OFFICE_DESKS[i].facing * 0.85];
      const rotY = c ? (c.rotation?.[1] ?? 0) : (OFFICE_DESKS[i].facing === 1 ? Math.PI : 0);
      // Seat height from the nearest chair object (top surface), fallback standard.
      let seatY = 0.52; let bd = 1.6;
      for (const ch of chairs) { const d = Math.hypot(ch.position[0] - home[0], ch.position[2] - home[2]); if (d < bd) { bd = d; seatY = ch.position[1] + (ch.scale?.[1] ?? 0.07) / 2; } }
      return { bot, home, rotY, seatY };
    });
  }, [scene]);

  const [openBot, setOpenBot] = useState<OfficeBot | null>(null);
  const [panelView, setPanelView] = useState<'genius' | 'console'>('genius');
  useEffect(() => { setPanelView('genius'); }, [openBot?.key]);
  const [nearKey, setNearKey] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, BotLink>>(loadLinks);
  const [agents, setAgents] = useState<any[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [agentsKey, setAgentsKey] = useState(0);
  const [introGone, setIntroGone] = useState(false);
  const camRef = useRef({ yaw: Math.PI, pitch: 0.25 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  /* ---- Theater / LiveKit ---- */
  const [theater, setTheater] = useState<OfficeTheater>(null);
  const [theaterMenu, setTheaterMenu] = useState(false);

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
        const { data, error } = await supabase.functions.invoke('livekit-token', { body: { roomName: 'office', identity, name: nameRef.current } });
        if (error || !data?.token || cancelled) return;
        const r = new Room({ adaptiveStream: false, dynacast: true });
        roomRef.current = r;
        r.on(RoomEvent.DataReceived, (payload, p) => {
          try {
            const m = JSON.parse(dec.decode(payload));
            if (!m) return;
            if (m.t === 'pos' && p?.identity && socialRef.current.presence) {
              peersRef.current.set(p.identity, { x: +m.x || 0, z: +m.z || 0, ry: +m.ry || 0, m: !!m.m, n: String(m.n || 'Guest'), c: String(m.c || '#38bdf8') });
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
          r.localParticipant.publishData(enc.encode(JSON.stringify({ t: 'pos', x: +playerPos.x.toFixed(2), z: +playerPos.z.toFixed(2), ry: +playerYaw.current.toFixed(2), m: moved, n: nameRef.current, c: myColorRef.current })), { reliable: false }).catch(() => {});
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
  }, []);

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
    const bot = OFFICE_BOTS.find((b) => b.key === botKey); if (!bot) return;
    if (presenting) await stopPresenting();
    stopDoc();
    const l = links[botKey] || {};
    const agentName = agents.find((a) => a.id === l.agentId)?.name;
    setTheater({ kind: 'dashboard', botKey, by: nameRef.current, agentName });
    sendTheater({ kind: 'dashboard', botKey, agentName });
  };
  const stopTheater = () => { stopDoc(); if (presenting) { void stopPresenting(); } setTheater(null); sendTheater({ kind: 'stop' }); };

  const screenBot = theater?.kind === 'dashboard' ? OFFICE_BOTS.find((b) => b.key === theater.botKey) ?? null : null;
  const screenLink = screenBot ? links[screenBot.key] || {} : {};
  const screenAgent = agents.find((a) => a.id === screenLink.agentId) || (theater?.kind === 'dashboard' && theater.agentName ? { name: theater.agentName } : undefined);
  useEffect(() => {
    if (!screenBot || !screenLink.aiOn || !screenLink.agentId) { setScreenRuns([]); return; }
    supabase.from('call_agent_runs').select('id, input, output, status, created_at').eq('agent_id', screenLink.agentId).order('created_at', { ascending: false }).limit(5).then(({ data }) => setScreenRuns(data || []));
  }, [screenBot?.key, screenLink.agentId, screenLink.aiOn]);

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
      try { const r = await callAgentsApi({ action: 'list' }); if (live) setAgents(r.agents || []); } catch { /* list retries on open */ }
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session?.user?.id ?? null)).catch(() => {});
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { void apply(session?.user?.id ?? null); });
    return () => { live = false; sub.subscription.unsubscribe(); };
  }, []);

  const link = openBot ? links[openBot.key] || {} : {};
  const linkedAgent = agents.find((a) => a.id === link.agentId);
  const refreshAgents = async () => {
    try { const r = await callAgentsApi({ action: 'list' }); setAgents(r.agents || []); } catch { /* keep the current list */ }
    setAgentsKey((k) => k + 1);
  };

  const saveLink = (patch: BotLink) => {
    if (!openBot) return;
    const next = { ...links, [openBot.key]: { ...links[openBot.key], ...patch } };
    setLinks(next);
    try { localStorage.setItem(LINKS_KEY, JSON.stringify(next)); } catch {}
  };
  const botLink = useMemo(() => openBot ? { botName: openBot.name, agentId: link.agentId, aiOn: link.aiOn, onChange: (patch: BotLink) => saveLink(patch) } : undefined, [openBot, link.agentId, link.aiOn]); // eslint-disable-line react-hooks/exhaustive-deps
  const nearBot = nearKey ? OFFICE_BOTS.find((b) => b.key === nearKey) : null;
  const agentChars = useMemo(() => ((scene?.objects || []) as any[]).filter((o) => o.kind === 'character' && o.agentId), [scene]);
  /* ---- Who is on a job right now: a bot whose linked agent produced a run
   * in the last 3 minutes is pinned to its desk (sitting + typing). ---- */
  const linksRef = useRef(links); linksRef.current = links;
  const agentCharsRef = useRef<any[]>([]); agentCharsRef.current = agentChars;
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
  useEffect(() => { if (!scene) return; const t = setTimeout(() => setIntroGone(true), 2100); return () => clearTimeout(t); }, [scene]);
  const uiGuard = (e: any) => !!(e.target as HTMLElement)?.closest?.('[data-office-ui]');

  return (
    <div className="fixed inset-0 bg-[#02070E] text-foreground select-none touch-none"
      onPointerDown={(e) => { if (uiGuard(e)) return; void maybeAutoMic(); dragRef.current = { x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => { if (!dragRef.current) return; const evs = (e.nativeEvent as any).getCoalescedEvents?.() as PointerEvent[] | undefined; const last = evs?.length ? evs[evs.length - 1] : e.nativeEvent; const dx = last.clientX - dragRef.current.x, dy = last.clientY - dragRef.current.y; dragRef.current = { x: last.clientX, y: last.clientY }; const sens = e.pointerType === 'touch' ? 0.0042 : 0.005; camRef.current.yaw -= dx * sens; camRef.current.pitch = THREE.MathUtils.clamp(camRef.current.pitch + dy * 0.003, -0.1, 0.9); }}
      onPointerUp={() => { dragRef.current = null; }}>
      <Canvas dpr={[1, 1.75]} camera={{ position: [4, 3.4, 7], fov: 55 }}>
        <color attach="background" args={['#bfd9ec']} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[26, 34, 14]} intensity={1.7} color="#fff2df" />
        <Suspense fallback={null}>
          {scene && <PublishedWorld scene={scene} renderCharacters={false} />}
          {scene && bots.map(({ bot, home, rotY, seatY }) => <OfficeBotCharacter key={bot.key} bot={bot} home={home} rotY={rotY} seatY={seatY} onOpen={setOpenBot} roam pinnedWork={workingKeys.has(bot.key)} />)}
          {scene && agentChars.map((o) => (
            <OfficeBotCharacter key={`agent_${o.id}`} bot={{ key: `agent_${o.id}`, name: o.name || 'Agent', duty: 'AI agent character', model: o.url || '/models/plaza/RobotExpressive.glb', tint: colorFor(String(o.id)) }} home={[o.position?.[0] ?? 0, 0, o.position?.[2] ?? 5]} rotY={o.rotation?.[1] ?? 0} seatY={o.seatHeight ?? 0.52} seated={!!o.startSeated} pinnedWork={workingKeys.has(`agent_${o.id}`)} onOpen={(b) => { setLinks((cur) => { const next = { ...cur, [b.key]: { agentId: o.agentId, aiOn: true } }; try { localStorage.setItem(LINKS_KEY, JSON.stringify(next)); } catch {} return next; }); setOpenBot(b); }} />
          ))}
          {scene && socialFlags.presence && Object.entries(peers).map(([id, info]) => <PeerAvatar key={id} info={info} speaking={speakingIds.includes(id)} />)}
          {scene && socialFlags.theater && <OfficeTheaterScreen source={theater} screenBot={screenBot} screenLink={screenLink} screenAgent={screenAgent} screenRuns={screenRuns} onPages={setPdfPages} />}
          {scene && <UnifiedPlayer def={playerDef} model="/models/plaza/RobotExpressive.glb" tint="#ffffff" world={{ spawn: [4, 0, 0], bounds: OFFICE_BOUNDS, colliders: OFFICE_DESKS.map((d) => ({ x: d.x, z: d.z, r: 1.0 })), camClamp: { minX: -21, maxX: 21, minY: 0.7, maxY: 7.3, minZ: -13.2, maxZ: 13.2 } }} lookRef={camRef} onMove={(x, z, ry) => { playerPos.set(x, 0, z); playerYaw.current = ry; }} />}
        </Suspense>
        <Proximity onNear={setNearKey} />
      </Canvas>

      {!scene && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-[#02070E] text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <div className="text-sm">Loading the live office…</div>
        </div>
      )}

      {isAdmin && (
        <div data-office-ui className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
          {outdated && scene && (
            <button onClick={() => { void publishUpdatedScene(); }} disabled={publishing} className="rounded-full bg-emerald-500 text-emerald-950 font-semibold px-3.5 py-2 text-xs flex items-center gap-1.5 shadow-lg disabled:opacity-60">
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{publishing ? 'Publishing…' : 'Publish the updated office (white floor · tall ceiling · daylight)'}
            </button>
          )}
          {pubNote && <div className="rounded-lg bg-background/90 border border-border px-3 py-1.5 text-xs max-w-[320px]">{pubNote}</div>}
          <button onClick={async () => { const bid = findWorldLevelId('office'); if (bid) { window.location.href = `/imagine-studio/${bid}`; return; } const l = await syncOfficeLevelToPublished(); window.location.href = `/imagine-studio/${l.id}`; }} className="rounded-full bg-background/90 border border-border px-3 py-2 text-xs flex items-center gap-1.5">
            <BoxIcon className="w-4 h-4" />Edit in 3D Studio
          </button>
          {socialFlags.theater && (
          <div className="relative">
            <button onClick={() => setTheaterMenu((o) => !o)} className="rounded-full bg-background/90 border border-border px-3.5 py-2 text-xs font-medium flex items-center gap-1.5">
              <Clapperboard className="w-4 h-4" />Theater{theater ? ' · on air' : ''}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${theaterMenu ? 'rotate-180' : ''}`} />
            </button>
            {theaterMenu && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-60 max-h-[70vh] overflow-y-auto touch-pan-y rounded-xl bg-background/95 backdrop-blur border border-border shadow-2xl p-1.5">
                <TheaterMenuItem icon={presenting ? Square : MonitorUp} label={presenting ? 'Stop sharing' : 'Share screen'} onClick={() => { void shareScreen(false); setTheaterMenu(false); }} />
                <TheaterMenuItem icon={Video} label="Share camera" onClick={() => { void shareScreen(true); setTheaterMenu(false); }} />
                <TheaterMenuItem icon={docRef.current ? Square : FileUp} label={docRef.current ? 'Stop document' : 'Present document'} onClick={() => { if (docRef.current) stopDoc(); else fileInputRef.current?.click(); setTheaterMenu(false); }} />
                <TheaterMenuItem icon={micOn ? Mic : MicOff} label={micOn ? 'Mic on' : 'Mic off'} onClick={() => { void toggleMic(); setTheaterMenu(false); }} />
                {theater && theater.kind !== 'dashboard' && <TheaterMenuItem icon={Square} label="Stop theater" onClick={() => { stopTheater(); setTheaterMenu(false); }} />}
                <div className="px-2.5 pt-2.5 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" />AI dashboard on theater
                </div>
                {theater?.kind === 'dashboard' && <TheaterMenuItem icon={Square} label="Stop dashboard" onClick={() => { stopTheater(); setTheaterMenu(false); }} />}
                <div className="grid grid-cols-2 gap-1 p-1">
                  {OFFICE_BOTS.map((b) => (
                    <button key={b.key} onClick={() => { void showDashboardOnTheater(b.key); setTheaterMenu(false); }} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs hover:bg-muted text-left">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.tint }} />{b.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
          {theaterNote && <div className="rounded-lg bg-destructive/90 text-destructive-foreground px-3 py-1.5 text-xs max-w-[300px]">{theaterNote}</div>}
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
          <button onClick={() => { if (theater.kind === 'dashboard' && screenBot) setOpenBot(screenBot); else if (theater.kind !== 'dashboard') openTheaterFullscreen(theater as TheaterSource); }} className="rounded-full bg-background/90 border border-border px-3 py-2 text-xs flex items-center gap-1.5">
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
                <input value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }} placeholder="Message the room…" className="flex-1 min-w-0 bg-transparent border border-border rounded-lg px-2.5 py-2 text-sm outline-none" />
                <button onClick={sendChat} className="rounded-lg bg-primary text-primary-foreground px-3" aria-label="Send chat message"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}

      {nearBot && !openBot && (
        <button data-office-ui onClick={() => setOpenBot(nearBot)} className="absolute bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-lg flex items-center gap-2">
          <Play className="w-4 h-4" />Open {nearBot.name}&rsquo;s dashboard
        </button>
      )}

      {/* Mobile controls — the SAME shared touch UI as every world (joystick + jump/run/interact + look pad) */}
      {!openBot && <MobileTouchControls visible layerClass="z-10" />}

      {/* Agents console — the dashboard Agents tab (2D Muse AI console), inside the office */}
      {openBot && (
        <div data-office-ui className="absolute z-30 inset-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[min(940px,100vw)] bg-background sm:border-l border-border shadow-2xl flex flex-col">
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
            {isAdmin && OFFICE_BOTS.some((b) => b.key === openBot.key) && <button onClick={() => { void showDashboardOnTheater(openBot.key); }} className="hidden sm:flex rounded-full border border-border px-3 py-1.5 text-xs items-center gap-1.5 hover:bg-muted"><LayoutDashboard className="w-3.5 h-3.5" />Theater</button>}
            <button onClick={() => { setOpenBot(null); void refreshAgents(); }} className="p-1.5 rounded-full hover:bg-muted" aria-label="Close agents"><X className="w-5 h-5" /></button>
          </div>
          {panelView === 'genius' ? (
            <div className="flex-1 min-h-0">
              <OfficeAgentPanel bot={openBot} link={link} agents={agents} signedIn={signedIn} working={workingKeys.has(openBot.key)} onSaveLink={saveLink} onOpenConsole={() => setPanelView('console')} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y">
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
      <StudioMobileNav />
    </div>
  );
}
