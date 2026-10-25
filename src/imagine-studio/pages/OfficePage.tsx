// @ts-nocheck -- Imagine Studio v2
/**
 * Muse HQ — NYC Office. A published world like the Plaza District: perimeter
 * window walls, 20 simple desk stations, and one NPC bot per Muse agent.
 * Bots stay at their desks; click a bot (or walk up to it) to open its
 * dashboard — link it to one of your SFH Agents, watch its job activity
 * (call_agent_runs), and assign new jobs (call-agents run). The north wall
 * carries a theater screen: admins can share a screen, a camera, documents
 * (PDF/image) with audio, or put any bot's AI dashboard on the big screen,
 * synced to everyone in the room over LiveKit (same pattern as the Plaza).
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useGLTF, useAnimations } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { Room, RoomEvent, Track } from 'livekit-client';
import { Bot as BotIcon, Box as BoxIcon, ChevronDown, ChevronLeft, ChevronRight, Clapperboard, FileUp, LayoutDashboard, Loader2, Maximize2, Mic, MicOff, MonitorUp, Play, RefreshCw, Square, Video, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PublishedWorld } from '@/imagine-studio/components/plaza/PublishedWorld';
import { useSourceTexture, type TheaterSource } from '@/imagine-studio/components/plaza/TheaterScreen';
import { openTheaterFullscreen } from '@/imagine-studio/components/plaza/TheaterFullscreen';
import { OFFICE_BOTS, OFFICE_BOUNDS, OFFICE_DESKS, OFFICE_LEVEL_NAME, buildOfficeScene, fetchPublishedOfficeMeta, syncOfficeLevelToPublished, type OfficeBot } from '@/imagine-studio/lib/officeWorld';
import { applyActionPose } from '@/imagine-studio/lib/actionPoses';
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

/* ---------------- Bots (stationary, at their desks) ---------------- */
const botPos = new Map<string, THREE.Vector3>();

function BotCharacter({ bot, home, rotY, seatY, onOpen }: { bot: OfficeBot; home: [number, number, number]; rotY: number; seatY: number; onOpen: (b: OfficeBot) => void }) {
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
    m.traverse((o: any) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; const mats = Array.isArray(o.material) ? o.material : [o.material]; const next = mats.map((mt: any) => { const c = mt.clone(); if (c.color) c.color.copy(skin); return c; }); o.material = Array.isArray(o.material) ? next : next[0]; } });
    return m;
  }, [scene, bot]);
  const root = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, root);
  useEffect(() => { botPos.set(bot.key, new THREE.Vector3(home[0], 0, home[2])); return () => { botPos.delete(bot.key); }; }, [bot.key]);
  // Every bot sits on its chair: a real Sitting clip when the model ships
  // one (RobotExpressive), otherwise a calibrated procedural sit pose.
  const sitClip = useMemo(() => names.find((x) => /sitting/i.test(x)) ?? null, [names]);
  const posedRef = useRef(false);
  useEffect(() => {
    if (sitClip || posedRef.current) return;
    root.current?.updateMatrixWorld(true);
    try { posedRef.current = applyActionPose(model, 'sit', { forward: new THREE.Vector3(Math.sin(rotY), 0, Math.cos(rotY)), seatHeight: seatY }); } catch { posedRef.current = false; }
  }, [model, sitClip, seatY, rotY]);
  useFrame(() => {
    const clipName = sitClip ?? (posedRef.current ? null : (names.find((x) => /idle/i.test(x)) ?? names[0]));
    if (!clipName) return;
    const a = actions[clipName];
    if (a && !a.isRunning()) { Object.values(actions).forEach((x) => x?.fadeOut(0.2)); a.reset().fadeIn(0.2).play(); }
  });
  return (
    <group ref={root} position={home} rotation={[0, rotY, 0]} onClick={(e) => { e.stopPropagation(); onOpen(bot); }}>
      <primitive object={model} />
      <Html position={[0, 1.52, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'none', font: '600 11px system-ui', lineHeight: 1.25, color: '#fff', background: 'rgba(5,10,20,.62)', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>{bot.name}</div>
      </Html>
    </group>
  );
}

/* ---------------- Player ---------------- */
const playerPos = new THREE.Vector3(0, 0, 12);

function Player({ joyRef, camRef }: { joyRef: any; camRef: any }) {
  const { scene, animations } = useGLTF('/models/plaza/Xbot.glb');
  const model = useMemo(() => { const m = skeletonClone(scene) as THREE.Object3D; m.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); return m; }, [scene]);
  const root = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, root);
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const dn = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);
  const vel = useRef({ x: 0, z: 0 });
  const smCam = useRef<{ yaw: number; pitch: number } | null>(null);
  useFrame(({ camera }, dt) => {
    const g = root.current; if (!g) return;
    const k = keys.current; const joy = joyRef.current || { x: 0, y: 0 };
    let ix = (k['a'] || k['arrowleft'] ? -1 : 0) + (k['d'] || k['arrowright'] ? 1 : 0) + (joy.x || 0);
    let iz = (k['s'] || k['arrowdown'] ? -1 : 0) + (k['w'] || k['arrowup'] ? 1 : 0) + (joy.y || 0);
    const len = Math.hypot(ix, iz); if (len > 1) { ix /= len; iz /= len; }
    // Camera smoothing: ease yaw/pitch toward the drag target every frame so
    // touch drags (sparse, jittery events) still glide.
    if (!smCam.current) smCam.current = { yaw: camRef.current.yaw, pitch: camRef.current.pitch };
    const kc = 1 - Math.exp(-dt * 9);
    let dyaw = camRef.current.yaw - smCam.current.yaw; while (dyaw > Math.PI) dyaw -= Math.PI * 2; while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    smCam.current.yaw += dyaw * kc;
    smCam.current.pitch += (camRef.current.pitch - smCam.current.pitch) * kc;
    const yaw = smCam.current.yaw;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const wx = iz * sin - ix * cos, wz = iz * cos + ix * sin;
    const speed = k['shift'] ? 7 : 4.2;
    const hasInput = Math.abs(wx) + Math.abs(wz) > 0.05;
    // Velocity smoothing: accelerate / decelerate instead of instant steps.
    const kv = 1 - Math.exp(-dt * 8);
    vel.current.x += ((hasInput ? wx * speed : 0) - vel.current.x) * kv;
    vel.current.z += ((hasInput ? wz * speed : 0) - vel.current.z) * kv;
    const vMag = Math.abs(vel.current.x) + Math.abs(vel.current.z);
    const isMoving = vMag > 0.3;
    if (vMag > 0.02) {
      const nx = THREE.MathUtils.clamp(g.position.x + vel.current.x * dt, -OFFICE_BOUNDS.x, OFFICE_BOUNDS.x);
      const nz = THREE.MathUtils.clamp(g.position.z + vel.current.z * dt, -OFFICE_BOUNDS.z, OFFICE_BOUNDS.z);
      let blocked = false;
      for (const d of OFFICE_DESKS) { if (Math.hypot(nx - d.x, nz - d.z) < 1.0) { blocked = true; break; } }
      if (!blocked) { g.position.x = nx; g.position.z = nz; } else { vel.current.x *= 0.3; vel.current.z *= 0.3; }
      if (isMoving) {
        const targetYaw = Math.atan2(vel.current.x, vel.current.z);
        let cur = g.rotation.y; let diff = targetYaw - cur; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
        g.rotation.y = cur + diff * Math.min(1, dt * 10);
      }
    }
    playerPos.copy(g.position);
    const pitch = smCam.current.pitch;
    const back = 6.5, height = 2.6 + pitch * 4;
    camera.position.set(g.position.x - Math.sin(yaw) * back * Math.cos(pitch), height, g.position.z - Math.cos(yaw) * back * Math.cos(pitch));
    camera.lookAt(g.position.x, 1.5, g.position.z);
    const idleName = names.find((x) => /idle/i.test(x)) ?? names[0];
    const walkName = names.find((x) => /walk/i.test(x)) ?? idleName;
    const a = (isMoving ? walkName : idleName) ? actions[isMoving ? walkName : idleName] : undefined;
    if (a && !a.isRunning()) { Object.values(actions).forEach((x) => x?.fadeOut(0.2)); a.reset().fadeIn(0.2).play(); }
  });
  return (
    <group ref={root} position={[0, 0, 12]}>
      <primitive object={model} />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.45, 0.55, 32]} /><meshBasicMaterial color="#f59e0b" /></mesh>
    </group>
  );
}

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
function OfficeTheaterScreen({ source, screenBot, screenLink, screenAgent, screenRuns, onPages }: {
  source: OfficeTheater;
  screenBot: OfficeBot | null; screenLink: BotLink; screenAgent: any; screenRuns: any[];
  onPages: (n: number) => void;
}) {
  const texSrc = source && source.kind !== 'dashboard' ? (source as TheaterSource) : null;
  const { tex, pages } = useSourceTexture(texSrc);
  useEffect(() => { onPages(pages); }, [pages]); // eslint-disable-line
  const idle = useMemo(() => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 576;
    const g = c.getContext('2d')!; g.fillStyle = '#0d1117'; g.fillRect(0, 0, 1024, 576);
    g.fillStyle = '#e6edf3'; g.font = '600 52px sans-serif'; g.textAlign = 'center';
    g.fillText('Muse HQ Theater', 512, 268); g.font = '27px sans-serif'; g.fillStyle = '#8b949e';
    g.fillText('Ready — an admin can share a screen, camera, document or AI dashboard', 512, 328);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
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

/* ---------------- Page ---------------- */
export default function OfficePage() {
  const [published, setPublished] = useState<any>(undefined);
  const [pubMeta, setPubMeta] = useState<{ publishedAt: string | null; live: boolean } | null>(null);
  useEffect(() => {
    let off = false;
    fetchPublishedOfficeMeta()
      .then((m) => { if (off) return; if (m) { setPublished(m.scene); setPubMeta({ publishedAt: m.publishedAt, live: true }); } else setPubMeta({ publishedAt: null, live: false }); })
      .catch(() => { if (!off) setPubMeta({ publishedAt: null, live: false }); });
    return () => { off = true; };
  }, []);
  const fallback = useMemo(() => buildOfficeScene(), []);
  // Never silently show the built-in copy: wait for the live published file,
  // and only fall back (clearly badged) when it truly cannot be loaded.
  const scene = published ?? (pubMeta ? fallback : null);
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
  const [nearKey, setNearKey] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, BotLink>>(loadLinks);
  const [agents, setAgents] = useState<any[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [runs, setRuns] = useState<any[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [job, setJob] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [note, setNote] = useState('');
  const joyRef = useRef({ x: 0, y: 0 });
  const camRef = useRef({ yaw: Math.PI, pitch: 0.25 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  /* ---- Theater / LiveKit ---- */
  const [theater, setTheater] = useState<OfficeTheater>(null);
  const [theaterMenu, setTheaterMenu] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [micOn, setMicOn] = useState(false);
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
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        let gid = sessionStorage.getItem('office-guest-id');
        if (!gid) { gid = `guest-${Math.random().toString(36).slice(2, 10)}`; sessionStorage.setItem('office-guest-id', gid); }
        const identity = u.user?.id || gid;
        nameRef.current = u.user?.email?.split('@')[0] || 'Guest';
        const { data, error } = await supabase.functions.invoke('livekit-token', { body: { roomName: 'office', identity, name: nameRef.current } });
        if (error || !data?.token || cancelled) return;
        const r = new Room({ adaptiveStream: false, dynacast: true });
        roomRef.current = r;
        r.on(RoomEvent.DataReceived, (payload, p) => {
          try {
            const m = JSON.parse(dec.decode(payload));
            if (!m || m.t !== 'theater') return;
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
        r.on(RoomEvent.ParticipantConnected, () => {
          const th = theaterRef.current;
          if (presentingRef.current) sendTheater({ kind: 'video' });
          else if (docRef.current) sendTheater(docRef.current);
          else if (th?.kind === 'dashboard') sendTheater({ kind: 'dashboard', botKey: th.botKey, agentName: th.agentName });
        });
        await r.connect(data.url || import.meta.env.VITE_LIVEKIT_URL, data.token);
      } catch { /* theater stays local to this browser */ }
    })();
    return () => { cancelled = true; roomRef.current?.disconnect(); roomRef.current = null; audioEls.current.forEach((el) => el.remove()); audioEls.current.clear(); };
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
  const toggleMic = async () => {
    const r = roomRef.current; if (!r) { setTheaterNote('Theater audio needs the live room connection.'); return; }
    try { await r.localParticipant.setMicrophoneEnabled(!micOn); setMicOn(!micOn); } catch { setTheaterNote('Microphone blocked by the browser.'); }
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
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setSignedIn(true);
      const { data: a } = await supabase.rpc('has_role', { _user_id: data.user.id, _role: 'admin' });
      setIsAdmin(!!a);
      try { const r = await callAgentsApi({ action: 'list' }); setAgents(r.agents || []); } catch {}
    });
  }, []);

  const link = openBot ? links[openBot.key] || {} : {};
  const linkedAgent = agents.find((a) => a.id === link.agentId);
  const loadRuns = async (agentId?: string) => {
    if (!agentId) { setRuns([]); return; }
    setRunsLoading(true);
    const { data } = await supabase.from('call_agent_runs').select('id, input, output, status, credits_charged, created_at').eq('agent_id', agentId).order('created_at', { ascending: false }).limit(20);
    setRuns(data || []);
    setRunsLoading(false);
  };
  useEffect(() => { loadRuns(link.aiOn ? link.agentId : undefined); }, [openBot?.key, link.agentId, link.aiOn]);

  const saveLink = (patch: BotLink) => {
    if (!openBot) return;
    const next = { ...links, [openBot.key]: { ...links[openBot.key], ...patch } };
    setLinks(next);
    try { localStorage.setItem(LINKS_KEY, JSON.stringify(next)); } catch {}
  };
  const assignJob = async () => {
    if (!openBot || !link.agentId || !job.trim()) return;
    setAssigning(true); setNote('');
    try {
      const r = await callAgentsApi({ action: 'run', agent_id: link.agentId, message: job.trim() });
      setNote('Job finished — the result is in the activity below.');
      setJob('');
      await loadRuns(link.agentId);
      if (r?.output) setNote(String(r.output).slice(0, 400));
    } catch (e: any) { setNote(e.message || 'The job failed to run.'); }
    setAssigning(false);
  };

  const nearBot = nearKey ? OFFICE_BOTS.find((b) => b.key === nearKey) : null;
  const fmtTime = (t: string) => new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const uiGuard = (e: any) => !!(e.target as HTMLElement)?.closest?.('[data-office-ui]');

  return (
    <div className="fixed inset-0 bg-[#02070E] text-foreground select-none touch-none"
      onPointerDown={(e) => { if (uiGuard(e)) return; dragRef.current = { x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => { if (!dragRef.current) return; const evs = (e.nativeEvent as any).getCoalescedEvents?.() as PointerEvent[] | undefined; const last = evs?.length ? evs[evs.length - 1] : e.nativeEvent; const dx = last.clientX - dragRef.current.x, dy = last.clientY - dragRef.current.y; dragRef.current = { x: last.clientX, y: last.clientY }; const sens = e.pointerType === 'touch' ? 0.0042 : 0.005; camRef.current.yaw -= dx * sens; camRef.current.pitch = THREE.MathUtils.clamp(camRef.current.pitch + dy * 0.003, -0.1, 0.9); }}
      onPointerUp={() => { dragRef.current = null; }}>
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 3.5, 19], fov: 55 }}>
        <color attach="background" args={['#02070E']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[18, 26, 12]} intensity={0.95} color="#cfe6ff" />
        <Suspense fallback={null}>
          {scene && <PublishedWorld scene={scene} />}
          {scene && bots.map(({ bot, home, rotY, seatY }) => <BotCharacter key={bot.key} bot={bot} home={home} rotY={rotY} seatY={seatY} onOpen={setOpenBot} />)}
          {scene && <OfficeTheaterScreen source={theater} screenBot={screenBot} screenLink={screenLink} screenAgent={screenAgent} screenRuns={screenRuns} onPages={setPdfPages} />}
          {scene && <Player joyRef={joyRef} camRef={camRef} />}
        </Suspense>
        <Proximity onNear={setNearKey} />
      </Canvas>

      {!scene && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-[#02070E] text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <div className="text-sm">Loading the live office…</div>
        </div>
      )}

      <div data-office-ui className="absolute top-3 left-3 z-20 rounded-xl bg-background/90 border border-border px-3.5 py-2.5 max-w-[78vw]">
        <div className="text-sm font-semibold flex items-center gap-2"><BotIcon className="w-4 h-4" />{OFFICE_LEVEL_NAME}</div>
        <div className="text-[11px] mt-0.5">
          {pubMeta?.live
            ? <span className="text-emerald-500 font-medium">● LIVE{pubMeta.publishedAt ? ` — published ${new Date(pubMeta.publishedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}</span>
            : pubMeta
              ? <span className="text-amber-500 font-medium">● Built-in copy — the live published world could not be loaded</span>
              : <span className="text-muted-foreground">Loading live world…</span>}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">Walk with WASD or the joystick, drag to look around. Click a bot — or walk up to it — to open its dashboard.</div>
      </div>

      {isAdmin && (
        <div data-office-ui className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
          <button onClick={async () => { const l = await syncOfficeLevelToPublished(); window.location.href = `/imagine-studio/${l.id}`; }} className="rounded-full bg-background/90 border border-border px-3 py-2 text-xs flex items-center gap-1.5">
            <BoxIcon className="w-4 h-4" />Edit in 3D Studio
          </button>
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
          {theaterNote && <div className="rounded-lg bg-destructive/90 text-destructive-foreground px-3 py-1.5 text-xs max-w-[300px]">{theaterNote}</div>}
          <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { onDocFile(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      )}

      {theater && (
        <div data-office-ui className="absolute bottom-24 sm:bottom-6 right-4 z-20 flex items-center gap-2">
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

      {nearBot && !openBot && (
        <button data-office-ui onClick={() => setOpenBot(nearBot)} className="absolute bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-lg flex items-center gap-2">
          <Play className="w-4 h-4" />Open {nearBot.name}&rsquo;s dashboard
        </button>
      )}

      {/* Mobile joystick */}
      {!openBot && (
        <div data-office-ui className="sm:hidden absolute bottom-20 left-4 z-20 w-28 h-28 rounded-full bg-background/40 border border-white/25 backdrop-blur-sm touch-none"
          onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { if (!(e.buttons & 1)) return; const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width - 0.5) * 2, y = ((e.clientY - r.top) / r.height - 0.5) * 2; joyRef.current = { x: Math.max(-1, Math.min(1, x)), y: -Math.max(-1, Math.min(1, y)) }; }}
          onPointerUp={() => { joyRef.current = { x: 0, y: 0 }; }}
          onPointerCancel={() => { joyRef.current = { x: 0, y: 0 }; }}>
          <div className="absolute inset-0 flex items-center justify-center text-white/70 text-[10px] font-medium">MOVE</div>
        </div>
      )}

      {/* Bot dashboard */}
      {openBot && (
        <div data-office-ui className="absolute z-30 inset-x-0 bottom-0 sm:inset-x-auto sm:right-0 sm:top-0 sm:w-[400px] max-h-[82vh] sm:max-h-none overflow-y-auto overscroll-contain touch-pan-y bg-background border-t sm:border-t-0 sm:border-l border-border shadow-2xl">
          <div className="p-4 space-y-4 pb-20 sm:pb-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-full shrink-0 border border-border" style={{ background: openBot.tint }} />
              <div className="mr-auto min-w-0">
                <div className="font-semibold">{openBot.name}</div>
                <div className="text-xs text-muted-foreground">{openBot.duty}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{link.aiOn && linkedAgent ? `Powered by AI — ${linkedAgent.name}` : 'NPC bot — not linked to an agent yet'}</div>
              </div>
              <button onClick={() => setOpenBot(null)} className="p-1.5 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>

            <div className="rounded-xl border border-border p-3 space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Power this bot with AI</div>
              {!signedIn && <div className="text-xs text-muted-foreground">Sign in to link this bot to one of your agents.</div>}
              {signedIn && agents.length === 0 && <div className="text-xs text-muted-foreground">You have no agents yet — create one in any dashboard&rsquo;s Agents tab, then link it here.</div>}
              {signedIn && agents.length > 0 && (
                <>
                  <select value={link.agentId || ''} onChange={(e) => saveLink({ agentId: e.target.value || undefined })} className="w-full h-9 rounded-md border border-border bg-background px-2 text-sm">
                    <option value="">Choose an agent…</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!link.aiOn} disabled={!link.agentId} onChange={(e) => saveLink({ aiOn: e.target.checked })} />
                    Powered by AI (jobs run on the linked agent)
                  </label>
                  {linkedAgent?.system_prompt && <div className="text-[11px] text-muted-foreground line-clamp-3">Instructions: {linkedAgent.system_prompt}</div>}
                </>
              )}
            </div>

            <div className="rounded-xl border border-border p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mr-auto">New job</div>
                {runsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              </div>
              <textarea value={job} onChange={(e) => setJob(e.target.value)} rows={3} placeholder={link.aiOn && link.agentId ? `Tell ${openBot.name} what to do…` : 'Link an agent and switch on AI power first'} disabled={!(link.aiOn && link.agentId)} className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm disabled:opacity-50" />
              <button onClick={assignJob} disabled={assigning || !(link.aiOn && link.agentId) || !job.trim()} className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}Assign job
              </button>
              {note && <div className="text-xs text-muted-foreground whitespace-pre-wrap">{note}</div>}
            </div>

            <div className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mr-auto">Activity — current &amp; previous jobs</div>
                <button onClick={() => loadRuns(link.aiOn ? link.agentId : undefined)} className="p-1 rounded hover:bg-muted" title="Refresh"><RefreshCw className="w-3.5 h-3.5" /></button>
              </div>
              {!(link.aiOn && link.agentId) && <div className="text-xs text-muted-foreground">No activity yet. When this bot is powered by an agent, every job it runs shows up here.</div>}
              {link.aiOn && link.agentId && runs.length === 0 && !runsLoading && <div className="text-xs text-muted-foreground">No jobs yet for {linkedAgent?.name || 'this agent'}. Assign the first one above.</div>}
              {runs.map((r, i) => (
                <div key={r.id} className={`rounded-lg border p-2.5 space-y-1 ${i === 0 ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className={`px-1.5 py-0.5 rounded-full font-medium ${r.status === 'ok' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-600'}`}>{r.status === 'ok' ? 'done' : r.status}</span>
                    <span>{fmtTime(r.created_at)}</span>
                    {i === 0 && <span className="font-medium text-foreground">latest</span>}
                    <span className="ml-auto">{Number(r.credits_charged || 0).toFixed(2)} credits</span>
                  </div>
                  {r.input && <div className="text-xs"><span className="text-muted-foreground">Job: </span>{r.input}</div>}
                  {r.output && <div className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">{r.output}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <StudioMobileNav />
    </div>
  );
}
