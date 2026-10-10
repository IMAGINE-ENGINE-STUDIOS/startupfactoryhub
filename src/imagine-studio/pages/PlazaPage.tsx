/**
 * Multiplayer Plaza — every visitor owns a 3D character (Character Room), walks
 * with keyboard or the on-screen joystick, talks through the mic (voices fade
 * with distance), chats, and votes in district elections.
 * Presence/positions/chat travel over the LiveKit data channel; no user cap.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Sky, useGLTF, useAnimations } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { Room, RoomEvent, Track, RemoteParticipant, RemoteTrack, RemoteAudioTrack } from 'livekit-client';
import { Mic, MicOff, Loader2, LogOut, MessageSquare, Vote, X, Send, RotateCcw, RotateCw, MonitorUp, FileUp, ChevronLeft, ChevronRight, Square } from 'lucide-react';
import { districtChat } from '@/lib/districtChatBus';
import { TheaterScreen, type TheaterSource } from '@/imagine-studio/components/plaza/TheaterScreen';
import { openTheaterFullscreen } from '@/imagine-studio/components/plaza/TheaterFullscreen';
import { Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DistrictElectionPanel from '@/components/DistrictElectionPanel';
import { PublishedWorld, usePublishedPlaza } from '@/imagine-studio/components/plaza/PublishedWorld';
import { buildPlazaScene, PLAZA_LEVEL_NAME } from '@/imagine-studio/lib/plazaLevel';
import { ensurePlazaLevel } from '@/imagine-studio/lib/localLevels';
import { Box as BoxIcon } from 'lucide-react';

const ROOM = 'plaza';
const NEAR = 3;
const FAR = 25;
const SPEED = 4.5;
const BOUND = 38;
const TANK_R = 3.6; // fountain tank outer radius (collision)
/** Walk limits derived from the published plaza (edited in 3D Studio). */
const walk: { bound: number; fountain: boolean; blockers: { x: number; z: number; r: number }[] } = { bound: BOUND, fountain: true, blockers: [] };
function setWalkFromScene(scene: any) {
  if (!scene?.objects) { walk.bound = BOUND; walk.fountain = true; walk.blockers = []; return; }
  const objs = scene.objects.filter((o: any) => o.visible !== false);
  let ext = 0;
  for (const o of objs) {
    if (o.kind === 'trajectory') continue;
    const sx = Math.abs(o.scale?.[0] ?? 1), sz = Math.abs(o.scale?.[2] ?? 1);
    if (Math.max(sx, sz) >= 10) ext = Math.max(ext, Math.hypot(Math.abs(o.position[0]) + sx / 2, Math.abs(o.position[2]) + sz / 2) * 0.72);
  }
  const lim = scene.walkLimits || {};
  walk.bound = typeof lim.radius === 'number' ? lim.radius : Math.max(15, Math.min(1000, ext || BOUND));
  walk.fountain = !lim.noFountainBlock && objs.some((o: any) => /fountain|basin|tank/i.test(o.name || '') && Math.hypot(o.position[0], o.position[2]) < 2);
  walk.blockers = objs.filter((o: any) => o.playBehavior?.collision === 'blocking').map((o: any) => ({ x: o.position[0], z: o.position[2], r: Math.max(Math.abs(o.scale?.[0] ?? 1), Math.abs(o.scale?.[2] ?? 1)) / 2 + 0.4 }));
}
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

/* Character room. Each entry carries its rig controller: target height, facing, ground hover,
 * which clips play for walk/idle, playback speed and an optional skin tint (tints reuse a model, so they add no download). */
export type CharDef = { id: string; label: string; url: string; yaw: number; height?: number; hover?: number; walk?: RegExp; idle?: RegExp; speed?: number; tint?: string; loopIdle?: boolean };
const M = '/models/plaza/';
export const CHARACTERS: CharDef[] = [
  { id: 'xbot', label: 'Xbot', url: M + 'Xbot.glb', yaw: 0 },
  { id: 'soldier', label: 'Soldier', url: M + 'Soldier.glb', yaw: Math.PI },
  { id: 'robot', label: 'Robot', url: M + 'RobotExpressive.glb', yaw: 0 },
  { id: 'classic', label: 'Classic', url: '', yaw: 0 },
  // new rigged characters
  { id: 'cesium', label: 'Runner', url: M + 'CesiumMan.glb', yaw: 0, walk: /./ },
  { id: 'figure', label: 'Mannequin', url: M + 'RiggedFigure.glb', yaw: 0, walk: /./ },
  { id: 'fox', label: 'Fox', url: M + 'Fox.glb', yaw: 0, height: 0.9, walk: /^walk$/i, idle: /survey/i },
  { id: 'horse', label: 'Horse', url: M + 'Horse.glb', yaw: 0, height: 1.7, walk: /./, speed: 0.8 },
  { id: 'flamingo', label: 'Flamingo', url: M + 'Flamingo.glb', yaw: 0, height: 0.9, hover: 1.4, walk: /./, loopIdle: true },
  { id: 'parrot', label: 'Parrot', url: M + 'Parrot.glb', yaw: 0, height: 0.7, hover: 1.5, walk: /./, loopIdle: true },
  { id: 'stork', label: 'Stork', url: M + 'Stork.glb', yaw: 0, height: 0.9, hover: 1.5, walk: /./, loopIdle: true },
  // skins: same rigs, new looks
  { id: 'xbot-gold', label: 'Gold Bot', url: M + 'Xbot.glb', yaw: 0, tint: '#f5c542' },
  { id: 'xbot-crimson', label: 'Crimson Bot', url: M + 'Xbot.glb', yaw: 0, tint: '#e0435a' },
  { id: 'xbot-ice', label: 'Ice Bot', url: M + 'Xbot.glb', yaw: 0, tint: '#8fd8ff' },
  { id: 'xbot-shadow', label: 'Shadow Bot', url: M + 'Xbot.glb', yaw: 0, tint: '#3a3f4b' },
  { id: 'soldier-desert', label: 'Desert Ranger', url: M + 'Soldier.glb', yaw: Math.PI, tint: '#d8b98a' },
  { id: 'soldier-arctic', label: 'Arctic Ranger', url: M + 'Soldier.glb', yaw: Math.PI, tint: '#e8eef5' },
  { id: 'soldier-jungle', label: 'Jungle Ranger', url: M + 'Soldier.glb', yaw: Math.PI, tint: '#6f9a5a' },
  { id: 'soldier-urban', label: 'Urban Ranger', url: M + 'Soldier.glb', yaw: Math.PI, tint: '#8a8f99' },
  { id: 'robot-ruby', label: 'Ruby Robot', url: M + 'RobotExpressive.glb', yaw: 0, tint: '#ff5c7a' },
  { id: 'robot-emerald', label: 'Emerald Robot', url: M + 'RobotExpressive.glb', yaw: 0, tint: '#3ddc97' },
  { id: 'robot-sapphire', label: 'Sapphire Robot', url: M + 'RobotExpressive.glb', yaw: 0, tint: '#4f8cff' },
  { id: 'robot-neon', label: 'Neon Robot', url: M + 'RobotExpressive.glb', yaw: 0, tint: '#c86bff' },
];
type CharId = string;
const charOf = (id: string) => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];

type Peer = { x: number; z: number; ry: number; moving: boolean; color: string; name: string; char: string; tx: number; tz: number; tr: number; speaking: boolean; seen?: number };
type ChatMsg = { from: string; text: string; at: number; me?: boolean };
const enc = new TextEncoder(), dec = new TextDecoder();

function volumeFor(d: number) {
  if (d <= NEAR) return 1;
  if (d >= FAR) return 0;
  return Math.pow(1 - (d - NEAR) / (FAR - NEAR), 2);
}

/* ---------- Characters ---------- */
function GlbCharacter({ def, moving, tint }: { def: CharDef; moving: boolean; tint: string }) {
  const { url, yaw } = def;
  const { scene, animations } = useGLTF(url);
  const model = useMemo(() => {
    const m = skeletonClone(scene) as THREE.Object3D;
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m);
    const h = box.max.y - box.min.y || 1;
    const s = (def.height ?? 1.8) / h;
    m.scale.setScalar(s);
    m.position.y = -box.min.y * s + (def.hover ?? 0);
    const skin = def.tint ? new THREE.Color(def.tint) : null;
    m.traverse((o: any) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.frustumCulled = false;
      if (skin) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        const next = mats.map((mt: any) => { const c = mt.clone(); if (c.color) c.color.copy(skin); return c; });
        o.material = Array.isArray(o.material) ? next : next[0];
      }
    });
    return m;
  }, [scene, def]);
  const root = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, root);
  useEffect(() => {
    const walk = def.walk ? names.find((n) => def.walk!.test(n)) : names.find((n) => /walk/i.test(n)) ?? names.find((n) => /run/i.test(n));
    const idle = def.idle ? names.find((n) => def.idle!.test(n)) : names.find((n) => /idle/i.test(n));
    const next = moving ? walk : idle ?? (def.loopIdle ? walk : undefined);
    const a = next ? actions[next] : undefined;
    if (!a) { Object.values(actions).forEach((x) => x?.fadeOut(0.2)); return; }
    a.timeScale = def.speed ?? 1;
    a.reset().fadeIn(0.2).play();
    return () => { a.fadeOut(0.2); };
  }, [moving, actions, names, def]);
  return (
    <group ref={root} rotation={[0, yaw, 0]}>
      <primitive object={model} />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.45, 0.55, 32]} /><meshBasicMaterial color={tint} /></mesh>
    </group>
  );
}

function ClassicCharacter({ color, moving }: { color: string; moving: boolean }) {
  const body = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!body.current) return;
    const t = clock.getElapsedTime();
    body.current.position.y = moving ? Math.abs(Math.sin(t * 10)) * 0.12 : Math.sin(t * 2) * 0.02;
  });
  return (
    <group ref={body}>
      <mesh position={[0, 0.9, 0]} castShadow><capsuleGeometry args={[0.35, 0.8, 6, 16]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
      <mesh position={[0, 1.75, 0]} castShadow><sphereGeometry args={[0.3, 24, 24]} /><meshStandardMaterial color="#f1d3b3" roughness={0.6} /></mesh>
      <mesh position={[0.11, 1.8, 0.26]}><sphereGeometry args={[0.045, 12, 12]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[-0.11, 1.8, 0.26]}><sphereGeometry args={[0.045, 12, 12]} /><meshStandardMaterial color="#111" /></mesh>
    </group>
  );
}

function Avatar({ char, color, name, moving, speaking, me }: { char: string; color: string; name: string; moving: boolean; speaking: boolean; me?: boolean }) {
  const c = charOf(char);
  return (
    <group>
      {c.url ? (
        <Suspense fallback={<ClassicCharacter color={color} moving={moving} />}>
          <GlbCharacter def={c} moving={moving} tint={color} />
        </Suspense>
      ) : <ClassicCharacter color={color} moving={moving} />}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><circleGeometry args={[0.45, 24]} /><meshBasicMaterial color="#000" transparent opacity={0.25} depthWrite={false} /></mesh>
      <Html position={[0, 2.05, 0]} center distanceFactor={10} zIndexRange={[10, 0]}>
        <div className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur ${speaking ? 'bg-emerald-500/90 text-white' : me ? 'bg-primary/90 text-primary-foreground' : 'bg-background/80 text-foreground'}`}>
          {name}
        </div>
      </Html>
    </group>
  );
}

/* ---------- World ---------- */
function Fountain() {
  const water = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => { if (water.current) water.current.position.y = 0.62 + Math.sin(clock.getElapsedTime() * 1.5) * 0.01; });
  return (
    <group>
      {/* Tank: floor, outer + inner walls, rim — a real basin holding the water */}
      <mesh position={[0, 0.06, 0]} receiveShadow><cylinderGeometry args={[TANK_R, TANK_R, 0.12, 48]} /><meshStandardMaterial color="#7d848b" /></mesh>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow><cylinderGeometry args={[TANK_R, TANK_R, 0.9, 48, 1, true]} /><meshStandardMaterial color="#9aa0a6" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[TANK_R - 0.3, TANK_R - 0.3, 0.9, 48, 1, true]} /><meshStandardMaterial color="#8a9096" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[TANK_R - 0.3, TANK_R, 48]} /><meshStandardMaterial color="#b4b9be" /></mesh>
      {/* Water volume — sits below the rim, inside the tank */}
      <mesh ref={water} position={[0, 0.62, 0]}>
        <cylinderGeometry args={[TANK_R - 0.32, TANK_R - 0.32, 0.9, 48]} />
        <meshStandardMaterial color="#2f7fd1" transparent opacity={0.7} roughness={0.1} metalness={0.2} depthWrite={false} />
      </mesh>
      {/* Centre column */}
      <mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.3, 0.5, 2.6, 16]} /><meshStandardMaterial color="#8a9096" /></mesh>
      <mesh position={[0, 2.2, 0]} castShadow><cylinderGeometry args={[1.1, 0.4, 0.25, 24]} /><meshStandardMaterial color="#9aa0a6" /></mesh>
      <mesh position={[0, 2.9, 0]} castShadow><sphereGeometry args={[0.45, 24, 24]} /><meshStandardMaterial color="#8a9096" /></mesh>
    </group>
  );
}

function PlazaWorld() {
  const trees = useMemo(() => Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return [Math.cos(a) * 32, Math.sin(a) * 32] as [number, number]; }).filter(([x, z]) => !(z < -24 && Math.abs(x) < 14)), []);
  const benches = useMemo(() => Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 + 0.2; return { x: Math.cos(a) * 12, z: Math.sin(a) * 12, r: -a + Math.PI / 2 }; }), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[45, 64]} /><meshStandardMaterial color="#6b8f4e" /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow><circleGeometry args={[28, 64]} /><meshStandardMaterial color="#cfc6b6" roughness={0.9} /></mesh>
      {[8, 14, 22].map((r) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><ringGeometry args={[r - 0.15, r, 64]} /><meshStandardMaterial color="#a89f8f" /></mesh>
      ))}
      <Fountain />
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
      {[0, 1, 2, 3].map((i) => { const a = i * Math.PI / 2 + Math.PI / 4; return (
        <group key={i} position={[Math.cos(a) * 20, 0, Math.sin(a) * 20]}>
          <mesh position={[0, 2, 0]}><cylinderGeometry args={[0.08, 0.1, 4, 8]} /><meshStandardMaterial color="#222" /></mesh>
          <mesh position={[0, 4.1, 0]}><sphereGeometry args={[0.3, 16, 16]} /><meshStandardMaterial color="#fff6d5" emissive="#ffe9a8" emissiveIntensity={1.5} /></mesh>
        </group>); })}
    </group>
  );
}

/* ---------- Player + peers ---------- */
type Input = { joy: { x: number; y: number }; turn: number };

function Game({ me, peers, input, onMove }: { me: { color: string; name: string; char: string }; peers: React.MutableRefObject<Map<string, Peer>>; input: React.MutableRefObject<Input>; onMove: (x: number, z: number, ry: number, moving: boolean) => void }) {
  const self = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  // Spawn chosen ONCE — re-renders must never move the player.
  const spawn = useMemo<[number, number, number]>(() => { const a = Math.random() * Math.PI * 2; return [Math.cos(a) * 10, 0, Math.sin(a) * 10]; }, []);
  const [peerIds, setPeerIds] = useState<string[]>([]);
  const [peerMoving, setPeerMoving] = useState<Record<string, boolean>>({});
  const [moving, setMoving] = useState(false);
  const { camera } = useThree();
  const groups = useRef(new Map<string, THREE.Group>());
  const lastSend = useRef(0);
  const camYaw = useRef(Math.atan2(spawn[0], spawn[2]));
  const camInit = useRef(false);

  useEffect(() => {
    const d = (e: KeyboardEvent) => { if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return; keys.current[e.key.toLowerCase()] = true; };
    const u = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    const blur = () => { keys.current = {}; };
    window.addEventListener('keydown', d); window.addEventListener('keyup', u); window.addEventListener('blur', blur);
    const t = setInterval(() => {
      const ids = [...peers.current.keys()];
      setPeerIds((prev) => (prev.join() === ids.join() ? prev : ids));
      const mv: Record<string, boolean> = {}; peers.current.forEach((p, id) => { mv[id] = p.moving; });
      setPeerMoving((prev) => (JSON.stringify(prev) === JSON.stringify(mv) ? prev : mv));
    }, 250);
    return () => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); window.removeEventListener('blur', blur); clearInterval(t); };
  }, [peers]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const g = self.current; if (!g) return;
    const k = keys.current, inp = input.current;
    let turn = inp.turn; if (k['q']) turn += 1; if (k['e']) turn -= 1;
    camYaw.current += turn * dt * 2;
    let f = -inp.joy.y, s = inp.joy.x;
    if (k['w'] || k['arrowup']) f += 1;
    if (k['s'] || k['arrowdown']) f -= 1;
    if (k['a'] || k['arrowleft']) s -= 1;
    if (k['d'] || k['arrowright']) s += 1;
    const mag = Math.min(1, Math.hypot(f, s));
    const mv = mag > 0.15;
    if (mv) {
      const yaw = camYaw.current;
      const dx = -Math.sin(yaw) * f + Math.cos(yaw) * s;
      const dz = -Math.cos(yaw) * f - Math.sin(yaw) * s;
      const len = Math.hypot(dx, dz) || 1;
      let nx = g.position.x + (dx / len) * SPEED * mag * dt, nz = g.position.z + (dz / len) * SPEED * mag * dt;
      const r = Math.hypot(nx, nz);
      if (r > walk.bound) { nx *= walk.bound / r; nz *= walk.bound / r; }
      const minR = TANK_R + 0.5;
      const r2 = Math.hypot(nx, nz);
      if (walk.fountain && r2 < minR) { nx *= minR / (r2 || 1); nz *= minR / (r2 || 1); }
      for (const b of walk.blockers) {
        const ddx = nx - b.x, ddz = nz - b.z, dd = Math.hypot(ddx, ddz);
        if (dd < b.r) { nx = b.x + (ddx / (dd || 1)) * b.r; nz = b.z + (ddz / (dd || 1)) * b.r; }
      }
      g.position.x = nx; g.position.z = nz;
      const target = Math.atan2(dx, dz);
      let dr = target - g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr));
      g.rotation.y += dr * (1 - Math.exp(-12 * dt));
    }
    if (mv !== moving) setMoving(mv);
    const yaw = camYaw.current;
    const want = new THREE.Vector3(g.position.x + Math.sin(yaw) * 7, 4.2, g.position.z + Math.cos(yaw) * 7);
    if (!camInit.current) { camera.position.copy(want); camInit.current = true; }
    else camera.position.lerp(want, 1 - Math.exp(-6 * dt));
    camera.lookAt(g.position.x, 1.4, g.position.z);
    const a = 1 - Math.exp(-10 * dt);
    peers.current.forEach((p, id) => {
      p.x += (p.tx - p.x) * a; p.z += (p.tz - p.z) * a;
      let dr = p.tr - p.ry; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); p.ry += dr * a;
      const pg = groups.current.get(id);
      if (pg) { pg.position.set(p.x, 0, p.z); pg.rotation.y = p.ry; }
    });
    const now = performance.now();
    if (now - lastSend.current > 100) { lastSend.current = now; onMove(g.position.x, g.position.z, g.rotation.y, mv); }
  });

  return (
    <>
      <group ref={self} position={spawn}>
        <Avatar char={me.char} color={me.color} name={me.name} moving={moving} speaking={false} me />
      </group>
      {peerIds.map((id) => { const p = peers.current.get(id); if (!p) return null; return (
        <group key={id} ref={(el) => { if (el) { groups.current.set(id, el); el.position.set(p.x, 0, p.z); } else groups.current.delete(id); }}>
          <Avatar char={p.char} color={p.color} name={p.name} moving={!!peerMoving[id]} speaking={p.speaking} />
        </group>); })}
    </>
  );
}

/* ---------- Mobile joystick ---------- */
function Joystick({ input }: { input: React.MutableRefObject<Input> }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const move = (e: React.PointerEvent) => {
    const b = base.current!.getBoundingClientRect();
    let x = (e.clientX - (b.left + b.width / 2)) / (b.width / 2);
    let y = (e.clientY - (b.top + b.height / 2)) / (b.height / 2);
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    input.current.joy = { x, y }; setKnob({ x, y });
  };
  const end = () => { input.current.joy = { x: 0, y: 0 }; setKnob({ x: 0, y: 0 }); };
  return (
    <div ref={base} className="relative w-32 h-32 rounded-full bg-background/40 backdrop-blur border border-border touch-none select-none"
      onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); move(e); }}
      onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') move(e); }}
      onPointerUp={end} onPointerCancel={end}>
      <div className="absolute w-12 h-12 rounded-full bg-primary/80 left-1/2 top-1/2 pointer-events-none"
        style={{ transform: `translate(calc(-50% + ${knob.x * 40}px), calc(-50% + ${knob.y * 40}px))` }} />
    </div>
  );
}

function TurnButton({ dir, input }: { dir: 1 | -1; input: React.MutableRefObject<Input> }) {
  const Icon = dir === 1 ? RotateCcw : RotateCw;
  return (
    <button aria-label={dir === 1 ? 'Turn camera left' : 'Turn camera right'}
      className="w-12 h-12 rounded-full bg-background/60 backdrop-blur border border-border flex items-center justify-center touch-none select-none"
      onPointerDown={() => { input.current.turn = dir; }} onPointerUp={() => { input.current.turn = 0; }} onPointerLeave={() => { input.current.turn = 0; }} onPointerCancel={() => { input.current.turn = 0; }}>
      <Icon className="w-5 h-5" />
    </button>
  );
}

/* ---------- Character Room preview ---------- */
function Spinner({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * 0.6; });
  return <group ref={g} position={[0, -0.6, 0]}>{children}</group>;
}

function CharacterPreview({ char, color }: { char: string; color: string }) {
  return (
    <Canvas camera={{ position: [0, 1.3, 3.6], fov: 40 }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 3]} intensity={1.3} />
      <Spinner><Avatar char={char} color={color} name="" moving={false} speaking={false} /></Spinner>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}><circleGeometry args={[1.4, 48]} /><meshStandardMaterial color="#cfc6b6" /></mesh>
    </Canvas>
  );
}

/* ---------- Districts voting panel ---------- */
function DistrictsPanel({ onClose }: { onClose: () => void }) {
  const [rooms, setRooms] = useState<{ id: string; name: string; active_election?: boolean }[] | null>(null);
  const [vote, setVote] = useState<{ id: string; name: string } | null>(null);
  useEffect(() => {
    supabase.from('live_rooms').select('id,name,active_election').eq('room_category', 'village').eq('is_active', true).order('created_at')
      .then(({ data }) => setRooms((data as any) ?? []));
  }, []);
  return (
    <div className="absolute right-3 top-14 bottom-24 w-[min(320px,calc(100vw-24px))] rounded-2xl bg-background/95 border border-border flex flex-col overflow-hidden z-20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-medium text-sm">District elections</span>
        <button onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {rooms === null && <Loader2 className="w-4 h-4 animate-spin mx-auto" />}
        {rooms?.length === 0 && <p className="text-sm text-muted-foreground">No districts yet.</p>}
        {rooms?.map((r) => (
          <div key={r.id} className="rounded-lg border border-border p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.active_election ? 'Election open' : 'No election running'}</p>
            </div>
            <button onClick={() => setVote({ id: r.id, name: r.name })} className="text-xs rounded-full bg-primary text-primary-foreground px-3 py-1 shrink-0">
              {r.active_election ? 'Vote' : 'Open'}
            </button>
          </div>
        ))}
      </div>
      {vote && <DistrictElectionPanel open onOpenChange={(o) => !o && setVote(null)} roomId={vote.id} roomName={vote.name} />}
    </div>
  );
}

/* ---------- Chat panel ---------- */
function ChatPanel({ msgs, onSend, onClose }: { msgs: ChatMsg[]; onSend: (t: string) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);
  const send = () => { const t = text.trim(); if (!t) return; onSend(t.slice(0, 500)); setText(''); };
  return (
    <div className="absolute left-3 top-14 bottom-24 w-[min(320px,calc(100vw-24px))] rounded-2xl bg-background/95 border border-border flex flex-col overflow-hidden z-20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-medium text-sm">Plaza chat</span>
        <button onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {msgs.length === 0 && <p className="text-sm text-muted-foreground">Say hello to everyone in the Plaza.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={`text-sm break-words ${m.me ? 'text-right' : ''}`}>
            <span className="text-xs text-muted-foreground block">{m.from}</span>
            <span className={`inline-block rounded-xl px-3 py-1.5 ${m.me ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{m.text}</span>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="flex gap-2 p-3 border-t border-border">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Write a message" className="flex-1 min-w-0 rounded-lg border bg-background px-3 py-2 text-sm" />
        <button onClick={send} aria-label="Send" className="rounded-lg bg-primary text-primary-foreground px-3"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function PlazaPage() {
  const [name, setName] = useState(() => localStorage.getItem('sfh-plaza-name') || '');
  const [color, setColor] = useState(() => localStorage.getItem('sfh-plaza-color') || COLORS[0]);
  const [char, setChar] = useState<CharId>(() => (localStorage.getItem('sfh-plaza-char') as CharId) || 'xbot');
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [mic, setMic] = useState(false);
  const [count, setCount] = useState(1);
  const [panel, setPanel] = useState<'chat' | 'vote' | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(panel); panelRef.current = panel;
  const touch = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches, []);
  const room = useRef<Room | null>(null);
  const peers = useRef(new Map<string, Peer>());
  const audio = useRef(new Map<string, { track: RemoteAudioTrack; el: HTMLMediaElement }>());
  const mePos = useRef({ x: 0, z: 0 });
  const input = useRef<Input>({ joy: { x: 0, y: 0 }, turn: 0 });
  const meRef = useRef({ name, color, char }); meRef.current = { name, color, char };
  const [isAdmin, setIsAdmin] = useState(false);
  const published = usePublishedPlaza();
  setWalkFromScene(published);
  const [theater, setTheater] = useState<TheaterSource>(null);
  const [pdfPages, setPdfPages] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const docRef = useRef<{ kind: 'image' | 'pdf'; url: string; name: string; page: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const sendChatRef = useRef<(t: string) => void>(() => {});

  // Expose the plaza chat inside the Genius bubble.
  useEffect(() => {
    if (!joined) { districtChat.publish(null); return; }
    districtChat.publish({ id: ROOM, title: 'Plaza chat', msgs, online: count });
  }, [joined, msgs, count]);
  useEffect(() => districtChat.onSend((t) => sendChatRef.current(t)), []);
  useEffect(() => () => districtChat.publish(null), []);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }).then(({ data }) => setIsAdmin(!!data));
    });
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || name) return;
      const { data } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle();
      if (data?.full_name) setName(data.full_name);
    });
    return () => { room.current?.disconnect(); audio.current.forEach(({ el }) => el.remove()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    localStorage.setItem('sfh-plaza-name', name.trim()); localStorage.setItem('sfh-plaza-color', color); localStorage.setItem('sfh-plaza-char', char);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const identity = (user?.id || 'guest') + '-' + Math.random().toString(36).slice(2, 8);
      const { data, error } = await supabase.functions.invoke('livekit-token', { body: { roomName: ROOM, identity, name: name.trim() } });
      if (error || !data?.token) throw new Error(data?.error || 'Could not join the plaza.');
      const r = new Room({ adaptiveStream: false, dynacast: true });
      r.on(RoomEvent.DataReceived, (payload: Uint8Array, p?: RemoteParticipant) => {
        if (!p) return;
        try {
          const m = JSON.parse(dec.decode(payload));
          if (m.t === 'theater') {
            if (m.kind === 'video') { p.trackPublications.forEach((pub: any) => { if (pub.source === Track.Source.ScreenShare && !pub.isSubscribed) pub.setSubscribed(true); }); return; }
            if (m.kind === 'stop') setTheater((cur) => (cur && cur.kind !== 'video' ? null : cur));
            else if ((m.kind === 'image' || m.kind === 'pdf') && typeof m.url === 'string' && /^https:\/\//.test(m.url))
              setTheater(m.kind === 'pdf' ? { kind: 'pdf', url: m.url, name: String(m.name || ''), page: Number(m.page) || 1, by: String(m.by || p.name || 'Host') } : { kind: 'image', url: m.url, name: String(m.name || ''), by: String(m.by || p.name || 'Host') });
            return;
          }
          if (m.t === 'chat' && typeof m.text === 'string') {
            setMsgs((prev) => [...prev.slice(-199), { from: String(m.n || p.name || 'Guest').slice(0, 40), text: m.text.slice(0, 500), at: Date.now() }]);
            setUnread((u) => u + 1);
            return;
          }
          if (m.t !== 'pos' || !Number.isFinite(m.x) || !Number.isFinite(m.z)) return;
          const cur = peers.current.get(p.identity);
          if (cur) Object.assign(cur, { seen: Date.now(), tx: m.x, tz: m.z, tr: m.ry, moving: !!m.m, color: m.c, name: m.n, char: m.ch || 'classic' });
          else peers.current.set(p.identity, { x: m.x, z: m.z, ry: m.ry, tx: m.x, tz: m.z, tr: m.ry, moving: !!m.m, color: m.c, name: m.n, char: m.ch || 'classic', speaking: false, seen: Date.now() });
        } catch { /* ignore */ }
      });
      r.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _pub, p: RemoteParticipant) => {
        if (track.kind === Track.Kind.Video && track.source === Track.Source.ScreenShare) {
          const el = track.attach() as HTMLVideoElement; el.muted = true; el.playsInline = true; el.autoplay = true;
          // Keep it rendered (not display:none) so the browser keeps decoding and LiveKit keeps sending frames.
          el.style.cssText = 'position:fixed;right:0;bottom:0;width:4px;height:4px;opacity:0.01;pointer-events:none';
          document.body.appendChild(el); el.play().catch(() => {});
          setTheater({ kind: 'video', el, by: p.name || 'Host' });
          return;
        }
        if (track.kind !== Track.Kind.Audio) return;
        const el = track.attach(); el.style.display = 'none'; document.body.appendChild(el);
        audio.current.set(p.identity, { track: track as RemoteAudioTrack, el });
        (track as RemoteAudioTrack).setVolume(0);
      });
      r.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, _pub, p: RemoteParticipant) => {
        track.detach().forEach((e) => e.remove());
        if (track.source === Track.Source.ScreenShare) { setTheater((cur) => (cur?.kind === 'video' ? null : cur)); return; }
        audio.current.delete(p.identity);
      });
      r.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => { peers.current.delete(p.identity); setCount(r.remoteParticipants.size + 1); });
      r.on(RoomEvent.ParticipantConnected, () => {
        setCount(r.remoteParticipants.size + 1);
        // Late joiners: re-send the document on the theater screen.
        if (r.localParticipant.isScreenShareEnabled) r.localParticipant.publishData(enc.encode(JSON.stringify({ t: 'theater', kind: 'video', by: meRef.current.name })), { reliable: true }).catch(() => {});
        const d = docRef.current; if (d) r.localParticipant.publishData(enc.encode(JSON.stringify({ t: 'theater', ...d, by: meRef.current.name })), { reliable: true }).catch(() => {});
      });
      r.on(RoomEvent.LocalTrackUnpublished, (pub) => { if (pub.source === Track.Source.ScreenShare) { setPresenting(false); setTheater((cur) => (cur?.kind === 'video' ? null : cur)); } });
      r.on(RoomEvent.ActiveSpeakersChanged, (sp) => {
        const ids = new Set(sp.map((s) => s.identity));
        peers.current.forEach((p, id) => { p.speaking = ids.has(id); });
      });
      await Promise.race([
        r.connect(data.url || import.meta.env.VITE_LIVEKIT_URL, data.token),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000)),
      ]).catch((e) => { r.disconnect(); throw Object.assign(e, { solo: true }); });
      room.current = r;
      setCount(r.remoteParticipants.size + 1);
      setJoined(true);
      try { await r.localParticipant.setMicrophoneEnabled(true); setMic(true); } catch { setErr('Microphone blocked — allow it in your browser to talk.'); }
    } catch (e: any) {
      if (e?.solo) { setJoined(true); setErr('Voice and chat are unavailable right now — you are exploring solo.'); return; }
      setErr(e?.message || 'Could not join the plaza.');
    } finally { setBusy(false); }
  };

  const onMove = (x: number, z: number, ry: number, m: boolean) => {
    mePos.current = { x, z };
    const r = room.current; if (!r) return;
    const me = meRef.current;
    r.localParticipant.publishData(enc.encode(JSON.stringify({ t: 'pos', x, z, ry, m, c: me.color, n: me.name, ch: me.char })), { reliable: false }).catch(() => {});
  };

  const sendChat = (text: string) => {
    setMsgs((prev) => [...prev.slice(-199), { from: name, text, at: Date.now(), me: true }]);
    room.current?.localParticipant.publishData(enc.encode(JSON.stringify({ t: 'chat', text, n: name })), { reliable: true }).catch(() => {});
  };

  sendChatRef.current = sendChat;

  // Drop peers that stopped sending for 8s (closed tab, lost network).
  useEffect(() => {
    if (!joined) return;
    const t = setInterval(() => { const now = Date.now(); peers.current.forEach((p, id) => { if (p.seen && now - p.seen > 8000) peers.current.delete(id); }); }, 2000);
    return () => clearInterval(t);
  }, [joined]);

  const sendTheater = (msg: object) => room.current?.localParticipant.publishData(enc.encode(JSON.stringify({ t: 'theater', ...msg, by: meRef.current.name })), { reliable: true }).catch(() => {});

  const shareScreen = async () => {
    const r = room.current; if (!r) return setErr('Theater sharing needs the live plaza connection.');
    try {
      if (presenting) { await r.localParticipant.setScreenShareEnabled(false); setPresenting(false); setTheater(null); return; }
      stopDoc();
      const pub = await r.localParticipant.setScreenShareEnabled(true, { audio: false, resolution: { width: 1920, height: 1080, frameRate: 30 } });
      const mst = pub?.track?.mediaStreamTrack; if (!mst) return;
      const el = document.createElement('video'); el.muted = true; el.playsInline = true; el.srcObject = new MediaStream([mst]); el.style.cssText = 'position:fixed;right:0;bottom:0;width:4px;height:4px;opacity:0.01;pointer-events:none'; document.body.appendChild(el); el.play().catch(() => {});
      setTheater({ kind: 'video', el, by: meRef.current.name }); setPresenting(true); sendTheater({ kind: 'video' });
    } catch { setErr('Screen sharing was cancelled or blocked.'); }
  };

  const stopDoc = () => { if (docRef.current) { docRef.current = null; sendTheater({ kind: 'stop' }); setTheater(null); } };

  const onDocFile = async (f?: File) => {
    if (!f) return;
    const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    if (!isPdf && !f.type.startsWith('image/')) return setErr('Share a PDF or an image.');
    if (presenting) await shareScreen();
    setErr('Uploading ' + f.name + '...');
    const path = `plaza/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('live-shares').upload(path, f, { contentType: f.type || undefined });
    if (error) return setErr('Could not upload the file.');
    const { data } = await supabase.storage.from('live-shares').createSignedUrl(path, 60 * 60 * 24);
    if (!data?.signedUrl) return setErr('Could not share the file.');
    setErr('');
    const d = { kind: (isPdf ? 'pdf' : 'image') as 'pdf' | 'image', url: data.signedUrl, name: f.name, page: 1 };
    docRef.current = d; sendTheater(d);
    setTheater(isPdf ? { ...d, kind: 'pdf', by: meRef.current.name } : { kind: 'image', url: d.url, name: d.name, by: meRef.current.name });
  };

  const turnPage = (dir: number) => {
    const d = docRef.current; if (!d || d.kind !== 'pdf') return;
    d.page = Math.min(Math.max(1, d.page + dir), pdfPages || 1);
    sendTheater(d); setTheater({ ...d, kind: 'pdf', by: meRef.current.name });
  };

  const toggleMic = async () => {
    const r = room.current; if (!r) return;
    try { await r.localParticipant.setMicrophoneEnabled(!mic); setMic(!mic); } catch { setErr('Microphone blocked by the browser.'); }
  };

  const leave = () => { districtChat.publish(null); setTheater(null); setPresenting(false); docRef.current = null; room.current?.disconnect(); room.current = null; peers.current.clear(); audio.current.forEach(({ el }) => el.remove()); audio.current.clear(); setJoined(false); setPanel(null); };

  if (!joined) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
        <div className="tech-card border-0 w-full max-w-md rounded-2xl p-5 space-y-4">
          <div>
            <h1 className="text-xl font-semibold">The Plaza</h1>
            <p className="text-sm text-muted-foreground">Pick your character, then walk around and talk. Voices get quieter the farther away people are.</p>
          </div>
          <div className="h-56 rounded-xl overflow-hidden bg-muted/40"><CharacterPreview char={char} color={color} /></div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Character room</p>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
              {CHARACTERS.map((c) => (
                <button key={c.id} onClick={() => setChar(c.id)}
                  className={`rounded-lg border px-2 py-2 text-xs ${char === c.id ? 'border-primary bg-primary/10' : 'border-border'}`}>{c.label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Color</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} aria-label={`Color ${c}`}
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`} style={{ background: c }} />
              ))}
            </div>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={40}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button onClick={join} disabled={busy} className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium flex items-center justify-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Enter the Plaza
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background select-none">
      <Canvas shadows camera={{ fov: 55, position: [0, 6, 20] }} dpr={[1, 1.75]}>
        <Sky sunPosition={[50, 30, 20]} />
        <ambientLight intensity={0.6} />
        <hemisphereLight args={['#dfefff', '#6b8f4e', 0.4]} />
        <directionalLight position={[30, 40, 20]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-45} shadow-camera-right={45} shadow-camera-top={45} shadow-camera-bottom={-45} />
        {published ? <PublishedWorld scene={published} /> : <PlazaWorld />}
        <TheaterScreen source={theater} onPages={setPdfPages} />
        <Game me={{ color, name, char }} peers={peers} input={input} onMove={onMove} />
      </Canvas>
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
        <div className="rounded-full bg-background/80 backdrop-blur px-3 py-1.5 text-xs pointer-events-auto">
          {count} in the Plaza{!touch && ' · WASD / arrows to walk · Q/E to turn'}
        </div>
      </div>
      {err && <div className="absolute top-12 left-3 rounded-lg bg-destructive/90 text-destructive-foreground px-3 py-1.5 text-xs z-30">{err}</div>}
      {theater && (
        <button onClick={() => openTheaterFullscreen(theater)} className="absolute bottom-24 right-4 z-20 rounded-full bg-background/90 border border-border px-3 py-2 text-xs flex items-center gap-1.5">
          <Maximize2 className="w-4 h-4" />Watch full screen
        </button>
      )}
      {isAdmin && (
        <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button onClick={() => { const l = ensurePlazaLevel(buildPlazaScene, PLAZA_LEVEL_NAME); window.location.href = `/imagine-studio/${l.id}`; }} className="rounded-full bg-background/90 px-3 py-2 text-xs flex items-center gap-1.5">
              <BoxIcon className="w-4 h-4" />Edit in 3D Studio
            </button>
            <button onClick={shareScreen} className="rounded-full bg-background/90 px-3 py-2 text-xs flex items-center gap-1.5">
              {presenting ? <Square className="w-4 h-4" /> : <MonitorUp className="w-4 h-4" />}{presenting ? 'Stop sharing' : 'Share screen to theater'}
            </button>
            <button onClick={() => (docRef.current ? stopDoc() : fileInput.current?.click())} className="rounded-full bg-background/90 px-3 py-2 text-xs flex items-center gap-1.5">
              {docRef.current ? <Square className="w-4 h-4" /> : <FileUp className="w-4 h-4" />}{docRef.current ? 'Stop document' : 'Present document'}
            </button>
          </div>
          {theater?.kind === 'pdf' && docRef.current && (
            <div className="flex items-center gap-2 rounded-full bg-background/90 px-2 py-1 text-xs">
              <button onClick={() => turnPage(-1)} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
              <span>{theater.page} / {pdfPages || '?'}</span>
              <button onClick={() => turnPage(1)} aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
          <input ref={fileInput} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => { onDocFile(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      )}
      {panel === 'vote' && <DistrictsPanel onClose={() => setPanel(null)} />}
      {touch && (
        <>
          <div className="absolute left-4 bottom-24 z-10"><Joystick input={input} /></div>
          <div className="absolute right-4 bottom-28 z-10 flex gap-2"><TurnButton dir={1} input={input} /><TurnButton dir={-1} input={input} /></div>
        </>
      )}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        <button onClick={toggleMic} aria-label={mic ? 'Mute' : 'Unmute'}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${mic ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
          {mic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button onClick={() => { districtChat.open(); setUnread(0); }} aria-label="Chat" className="relative w-12 h-12 rounded-full bg-background/90 flex items-center justify-center">
          <MessageSquare className="w-5 h-5" />
          {unread > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">{unread}</span>}
        </button>
        <button onClick={() => setPanel(panel === 'vote' ? null : 'vote')} aria-label="District elections" className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center"><Vote className="w-5 h-5" /></button>
        <button onClick={leave} aria-label="Leave" className="w-12 h-12 rounded-full bg-background/90 flex items-center justify-center"><LogOut className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

// Only the default rigs preload; other characters download when picked or seen.
['Xbot', 'Soldier', 'RobotExpressive'].forEach((n) => useGLTF.preload(M + n + '.glb'));
