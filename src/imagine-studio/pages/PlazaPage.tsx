/**
 * Multiplayer Plaza — every visitor owns a 3D character, walks with WASD/arrows,
 * and talks through the mic. Voices fade with distance (proximity audio).
 * Presence and positions travel over the LiveKit data channel; no user cap.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Sky, useGLTF, useAnimations } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Suspense } from 'react';
import * as THREE from 'three';
import { Room, RoomEvent, Track, RemoteParticipant, RemoteTrack, RemoteAudioTrack } from 'livekit-client';
import { Mic, MicOff, Loader2, LogOut, MessageSquare, Vote, X, Send, RotateCcw, RotateCw } from 'lucide-react';
import DistrictElectionPanel from '@/components/DistrictElectionPanel';
import { supabase } from '@/integrations/supabase/client';

const ROOM = 'plaza';
const NEAR = 3;    // full volume within 3 m
const FAR = 25;    // silent beyond 25 m
const SPEED = 5;
const BOUND = 38;
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

type Peer = { x: number; z: number; ry: number; moving: boolean; color: string; name: string; tx: number; tz: number; tr: number; speaking: boolean };
const enc = new TextEncoder(), dec = new TextDecoder();

function volumeFor(d: number) {
  if (d <= NEAR) return 1;
  if (d >= FAR) return 0;
  const t = (d - NEAR) / (FAR - NEAR);
  return Math.pow(1 - t, 2);
}

function Avatar({ color, name, moving, speaking, me }: { color: string; name: string; moving: boolean; speaking: boolean; me?: boolean }) {
  const body = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!body.current) return;
    const t = clock.getElapsedTime();
    body.current.position.y = moving ? Math.abs(Math.sin(t * 10)) * 0.12 : Math.sin(t * 2) * 0.02;
    body.current.rotation.z = moving ? Math.sin(t * 10) * 0.05 : 0;
  });
  return (
    <group>
      <group ref={body}>
        <mesh position={[0, 0.9, 0]} castShadow><capsuleGeometry args={[0.35, 0.8, 6, 16]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
        <mesh position={[0, 1.75, 0]} castShadow><sphereGeometry args={[0.3, 24, 24]} /><meshStandardMaterial color="#f1d3b3" roughness={0.6} /></mesh>
        <mesh position={[0.11, 1.8, 0.26]}><sphereGeometry args={[0.045, 12, 12]} /><meshStandardMaterial color="#111" /></mesh>
        <mesh position={[-0.11, 1.8, 0.26]}><sphereGeometry args={[0.045, 12, 12]} /><meshStandardMaterial color="#111" /></mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><circleGeometry args={[0.45, 24]} /><meshBasicMaterial color="#000" transparent opacity={0.25} /></mesh>
      <Html position={[0, 2.35, 0]} center distanceFactor={10} zIndexRange={[10, 0]}>
        <div className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur ${speaking ? 'bg-emerald-500/90 text-white' : me ? 'bg-primary/90 text-primary-foreground' : 'bg-background/80 text-foreground'}`}>
          {name}
        </div>
      </Html>
    </group>
  );
}

function PlazaWorld() {
  const trees = useMemo(() => Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return [Math.cos(a) * 32, Math.sin(a) * 32] as [number, number]; }), []);
  const benches = useMemo(() => Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 + 0.2; return { x: Math.cos(a) * 12, z: Math.sin(a) * 12, r: -a + Math.PI / 2 }; }), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[45, 64]} /><meshStandardMaterial color="#6b8f4e" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow><circleGeometry args={[28, 64]} /><meshStandardMaterial color="#cfc6b6" roughness={0.9} /></mesh>
      {[6, 14, 22].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><ringGeometry args={[r - 0.15, r, 64]} /><meshStandardMaterial color="#a89f8f" /></mesh>
      ))}
      {/* Fountain */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow><cylinderGeometry args={[3, 3.2, 0.6, 40]} /><meshStandardMaterial color="#9aa0a6" /></mesh>
      <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[2.7, 2.7, 0.1, 40]} /><meshStandardMaterial color="#3b82f6" transparent opacity={0.75} metalness={0.3} roughness={0.1} /></mesh>
      <mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.3, 0.5, 2, 16]} /><meshStandardMaterial color="#8a9096" /></mesh>
      <mesh position={[0, 2.5, 0]} castShadow><sphereGeometry args={[0.6, 24, 24]} /><meshStandardMaterial color="#8a9096" /></mesh>
      {benches.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.r, 0]}>
          <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[2, 0.1, 0.5]} /><meshStandardMaterial color="#8b5a2b" /></mesh>
          <mesh position={[0, 0.8, -0.22]} castShadow><boxGeometry args={[2, 0.5, 0.08]} /><meshStandardMaterial color="#8b5a2b" /></mesh>
          {[-0.85, 0.85].map((x) => <mesh key={x} position={[x, 0.22, 0]}><boxGeometry args={[0.1, 0.45, 0.45]} /><meshStandardMaterial color="#333" /></mesh>)}
        </group>
      ))}
      {trees.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.2, 0.3, 2.4, 8]} /><meshStandardMaterial color="#6b4423" /></mesh>
          <mesh position={[0, 3.2, 0]} castShadow><coneGeometry args={[1.6, 3, 10]} /><meshStandardMaterial color="#2f6b3a" /></mesh>
        </group>
      ))}
      {/* Lamp posts */}
      {[0, 1, 2, 3].map((i) => { const a = i * Math.PI / 2 + Math.PI / 4; return (
        <group key={i} position={[Math.cos(a) * 20, 0, Math.sin(a) * 20]}>
          <mesh position={[0, 2, 0]}><cylinderGeometry args={[0.08, 0.1, 4, 8]} /><meshStandardMaterial color="#222" /></mesh>
          <mesh position={[0, 4.1, 0]}><sphereGeometry args={[0.3, 16, 16]} /><meshStandardMaterial color="#fff6d5" emissive="#ffe9a8" emissiveIntensity={1.5} /></mesh>
        </group>); })}
    </group>
  );
}

function Game({ me, peers, onMove }: { me: { color: string; name: string }; peers: React.MutableRefObject<Map<string, Peer>>; onMove: (x: number, z: number, ry: number, moving: boolean) => void }) {
  const self = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const [, force] = useState(0);
  const [moving, setMoving] = useState(false);
  const { camera } = useThree();
  const groups = useRef(new Map<string, THREE.Group>());
  const lastSend = useRef(0);
  const camYaw = useRef(0);

  useEffect(() => {
    const d = (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.tagName === 'INPUT') return; keys.current[e.key.toLowerCase()] = true; };
    const u = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', d); window.addEventListener('keyup', u);
    const t = setInterval(() => force((n) => n + 1), 500); // refresh peer list
    return () => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); clearInterval(t); };
  }, []);

  useFrame((_, dt) => {
    const g = self.current; if (!g) return;
    const k = keys.current;
    if (k['q']) camYaw.current += dt * 2;
    if (k['e']) camYaw.current -= dt * 2;
    let f = 0, s = 0;
    if (k['w'] || k['arrowup']) f += 1;
    if (k['s'] || k['arrowdown']) f -= 1;
    if (k['a'] || k['arrowleft']) s -= 1;
    if (k['d'] || k['arrowright']) s += 1;
    const mv = f !== 0 || s !== 0;
    if (mv) {
      const yaw = camYaw.current;
      const dx = (-Math.sin(yaw) * f + Math.cos(yaw) * s);
      const dz = (-Math.cos(yaw) * f - Math.sin(yaw) * s);
      const len = Math.hypot(dx, dz) || 1;
      let nx = g.position.x + (dx / len) * SPEED * dt, nz = g.position.z + (dz / len) * SPEED * dt;
      const r = Math.hypot(nx, nz);
      if (r > BOUND) { nx *= BOUND / r; nz *= BOUND / r; }
      if (r < 3.4) { nx *= 3.4 / (r || 1); nz *= 3.4 / (r || 1); } // fountain
      g.position.x = nx; g.position.z = nz;
      g.rotation.y = Math.atan2(dx, dz);
    }
    if (mv !== moving) setMoving(mv);
    // Camera follow
    const yaw = camYaw.current;
    const target = new THREE.Vector3(g.position.x + Math.sin(yaw) * 7, 4.5, g.position.z + Math.cos(yaw) * 7);
    camera.position.lerp(target, 0.12);
    camera.lookAt(g.position.x, 1.5, g.position.z);
    // Peers: interpolate + proximity volume
    peers.current.forEach((p, id) => {
      p.x += (p.tx - p.x) * 0.2; p.z += (p.tz - p.z) * 0.2;
      let dr = p.tr - p.ry; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); p.ry += dr * 0.2;
      const pg = groups.current.get(id);
      if (pg) { pg.position.set(p.x, 0, p.z); pg.rotation.y = p.ry; }
    });
    const now = performance.now();
    if (now - lastSend.current > 80) { lastSend.current = now; onMove(g.position.x, g.position.z, g.rotation.y, mv); }
  });

  return (
    <>
      <group ref={self} position={[(Math.random() - 0.5) * 16, 0, 10 + Math.random() * 6]}>
        <Avatar color={me.color} name={me.name} moving={moving} speaking={false} me />
      </group>
      {[...peers.current.entries()].map(([id, p]) => (
        <group key={id} ref={(el) => { if (el) groups.current.set(id, el); else groups.current.delete(id); }}>
          <Avatar color={p.color} name={p.name} moving={p.moving} speaking={p.speaking} />
        </group>
      ))}
    </>
  );
}

export default function PlazaPage() {
  const [name, setName] = useState(() => localStorage.getItem('sfh-plaza-name') || '');
  const [color, setColor] = useState(() => localStorage.getItem('sfh-plaza-color') || COLORS[0]);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [mic, setMic] = useState(false);
  const [count, setCount] = useState(1);
  const room = useRef<Room | null>(null);
  const peers = useRef(new Map<string, Peer>());
  const audio = useRef(new Map<string, { track: RemoteAudioTrack; el: HTMLMediaElement }>());
  const mePos = useRef({ x: 0, z: 0 });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || name) return;
      const { data } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle();
      if (data?.full_name) setName(data.full_name);
    });
    return () => { room.current?.disconnect(); audio.current.forEach(({ el }) => el.remove()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Proximity volume loop
  useEffect(() => {
    if (!joined) return;
    const t = setInterval(() => {
      audio.current.forEach(({ track }, id) => {
        const p = peers.current.get(id);
        const d = p ? Math.hypot(p.x - mePos.current.x, p.z - mePos.current.z) : FAR;
        track.setVolume(volumeFor(d));
      });
    }, 100);
    return () => clearInterval(t);
  }, [joined]);

  const join = async () => {
    if (!name.trim()) return setErr('Please enter your name.');
    setBusy(true); setErr('');
    localStorage.setItem('sfh-plaza-name', name.trim()); localStorage.setItem('sfh-plaza-color', color);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const identity = (user?.id || 'guest') + '-' + Math.random().toString(36).slice(2, 8);
      const { data, error } = await supabase.functions.invoke('livekit-token', { body: { roomName: ROOM, identity, name: name.trim() } });
      if (error || !data?.token) throw new Error(data?.error || 'Could not join the plaza.');
      const r = new Room({ adaptiveStream: true, dynacast: true });
      r.on(RoomEvent.DataReceived, (payload: Uint8Array, p?: RemoteParticipant) => {
        if (!p) return;
        try {
          const m = JSON.parse(dec.decode(payload));
          if (m.t !== 'pos') return;
          const cur = peers.current.get(p.identity);
          if (cur) Object.assign(cur, { tx: m.x, tz: m.z, tr: m.ry, moving: m.m, color: m.c, name: m.n });
          else peers.current.set(p.identity, { x: m.x, z: m.z, ry: m.ry, tx: m.x, tz: m.z, tr: m.ry, moving: m.m, color: m.c, name: m.n, speaking: false });
        } catch { /* ignore */ }
      });
      r.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub, p: RemoteParticipant) => {
        if (track.kind !== Track.Kind.Audio) return;
        const el = track.attach(); el.style.display = 'none'; document.body.appendChild(el);
        audio.current.set(p.identity, { track: track as RemoteAudioTrack, el });
        (track as RemoteAudioTrack).setVolume(0);
      });
      r.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, _pub, p: RemoteParticipant) => {
        track.detach().forEach((e) => e.remove()); audio.current.delete(p.identity);
      });
      r.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => { peers.current.delete(p.identity); setCount(r.remoteParticipants.size + 1); });
      r.on(RoomEvent.ParticipantConnected, () => setCount(r.remoteParticipants.size + 1));
      r.on(RoomEvent.ActiveSpeakersChanged, (sp) => {
        const ids = new Set(sp.map((s) => s.identity));
        peers.current.forEach((p, id) => { p.speaking = ids.has(id); });
      });
      await r.connect(data.url || import.meta.env.VITE_LIVEKIT_URL, data.token);
      room.current = r;
      setCount(r.remoteParticipants.size + 1);
      setJoined(true);
      try { await r.localParticipant.setMicrophoneEnabled(true); setMic(true); } catch { setErr('Microphone blocked — allow it in your browser to talk.'); }
    } catch (e: any) {
      setErr(e?.message || 'Could not join the plaza.');
    } finally { setBusy(false); }
  };

  const onMove = (x: number, z: number, ry: number, m: boolean) => {
    mePos.current = { x, z };
    const r = room.current; if (!r) return;
    r.localParticipant.publishData(enc.encode(JSON.stringify({ t: 'pos', x, z, ry, m, c: color, n: name })), { reliable: false }).catch(() => {});
  };

  const toggleMic = async () => {
    const r = room.current; if (!r) return;
    try { await r.localParticipant.setMicrophoneEnabled(!mic); setMic(!mic); } catch { setErr('Microphone blocked by the browser.'); }
  };

  const leave = () => { room.current?.disconnect(); room.current = null; peers.current.clear(); audio.current.forEach(({ el }) => el.remove()); audio.current.clear(); setJoined(false); };

  if (!joined) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
        <div className="tech-card border-0 w-full max-w-sm rounded-2xl p-6 space-y-4">
          <h1 className="text-xl font-semibold">The Plaza</h1>
          <p className="text-sm text-muted-foreground">Walk around and talk. Voices get quieter the farther away people are.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={40}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <div>
            <p className="text-xs text-muted-foreground mb-2">Character color</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} aria-label={`Color ${c}`}
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`} style={{ background: c }} />
              ))}
            </div>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button onClick={join} disabled={busy} className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium flex items-center justify-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Enter the Plaza
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <Canvas shadows camera={{ fov: 55, position: [0, 6, 20] }} dpr={[1, 1.75]}>
        <Sky sunPosition={[50, 30, 20]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[30, 40, 20]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-45} shadow-camera-right={45} shadow-camera-top={45} shadow-camera-bottom={-45} />
        <PlazaWorld />
        <Game me={{ color, name }} peers={peers} onMove={onMove} />
      </Canvas>
      <div className="absolute top-3 left-3 rounded-full bg-background/80 backdrop-blur px-3 py-1.5 text-xs">
        {count} in the Plaza · WASD / arrows to walk · Q/E to turn camera
      </div>
      {err && <div className="absolute top-12 left-3 rounded-lg bg-destructive/90 text-destructive-foreground px-3 py-1.5 text-xs">{err}</div>}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3">
        <button onClick={toggleMic} aria-label={mic ? 'Mute' : 'Unmute'}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${mic ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
          {mic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button onClick={leave} aria-label="Leave" className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center"><LogOut className="w-5 h-5" /></button>
      </div>
    </div>
  );
}
