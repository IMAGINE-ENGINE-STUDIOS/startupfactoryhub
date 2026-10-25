// @ts-nocheck -- Imagine Studio v2
/**
 * Muse HQ — NYC Office. A published world like the Plaza District: perimeter
 * window walls, 20 simple desk stations, and one NPC bot per Muse agent.
 * Bots work at their desks and stroll between waypoints; click a bot (or walk
 * up to it) to open its dashboard — link it to one of your SFH Agents, watch
 * its job activity (call_agent_runs), and assign new jobs (call-agents run).
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, useGLTF, useAnimations } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { Bot as BotIcon, Box as BoxIcon, Loader2, Play, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PublishedWorld } from '@/imagine-studio/components/plaza/PublishedWorld';
import { OFFICE_BOTS, OFFICE_BOUNDS, OFFICE_DESKS, OFFICE_LEVEL_NAME, OFFICE_WAYPOINTS, buildOfficeScene, fetchPublishedOfficeScene, syncOfficeLevelToPublished, type OfficeBot } from '@/imagine-studio/lib/officeWorld';
import StudioMobileNav from '@/imagine-studio/components/shared/StudioMobileNav';

const LINKS_KEY = 'sfh:office-bots:v1';
type BotLink = { agentId?: string; aiOn?: boolean };
const loadLinks = (): Record<string, BotLink> => { try { return JSON.parse(localStorage.getItem(LINKS_KEY) || '{}'); } catch { return {}; } };

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

/* ---------------- Bots ---------------- */
const botPos = new Map<string, THREE.Vector3>();

function BotCharacter({ bot, home, onOpen }: { bot: OfficeBot; home: [number, number, number]; onOpen: (b: OfficeBot) => void }) {
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
  const st = useRef({ mode: 'work' as 'work' | 'walk', target: new THREE.Vector3(home[0], 0, home[2]), until: performance.now() + 4000 + Math.random() * 12000, moving: false });
  useEffect(() => { botPos.set(bot.key, new THREE.Vector3(home[0], 0, home[2])); return () => { botPos.delete(bot.key); }; }, [bot.key]);
  useFrame((_, dt) => {
    const g = root.current; if (!g) return;
    const s = st.current; const now = performance.now();
    const pos = g.position;
    if (s.mode === 'work' && now > s.until) {
      const wp = OFFICE_WAYPOINTS[Math.floor(Math.random() * OFFICE_WAYPOINTS.length)];
      s.target.set(Math.random() < 0.45 ? home[0] + (Math.random() * 4 - 2) : wp[0], 0, Math.random() < 0.45 ? home[2] + (Math.random() * 4 - 2) : wp[1]);
      s.mode = 'walk';
    }
    if (s.mode === 'walk') {
      const to = new THREE.Vector3().subVectors(s.target, pos); to.y = 0;
      const dist = to.length();
      if (dist < 0.25) { s.mode = 'work'; s.until = now + 5000 + Math.random() * 14000; s.moving = false; if (Math.random() < 0.5) { s.target.set(home[0], 0, home[2]); s.mode = 'walk'; } }
      else {
        to.normalize();
        pos.addScaledVector(to, Math.min(dist, 1.35 * dt));
        const targetYaw = Math.atan2(to.x, to.z);
        let cur = g.rotation.y; let diff = targetYaw - cur; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
        g.rotation.y = cur + diff * Math.min(1, dt * 8);
        s.moving = true;
      }
    }
    botPos.set(bot.key, pos);
    const idleName = names.find((x) => /idle/i.test(x)) ?? names[0];
    const walkName = names.find((x) => /walk/i.test(x)) ?? idleName;
    const want = s.moving ? walkName : idleName;
    const a = want ? actions[want] : undefined;
    if (a && !a.isRunning()) { Object.values(actions).forEach((x) => x?.fadeOut(0.2)); a.reset().fadeIn(0.2).play(); }
  });
  return (
    <group ref={root} position={home} onClick={(e) => { e.stopPropagation(); onOpen(bot); }}>
      <primitive object={model} />
      <Html position={[0, 2.1, 0]} center distanceFactor={16} zIndexRange={[10, 0]}>
        <div style={{ pointerEvents: 'none', textAlign: 'center', font: '600 42px system-ui', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,.8)', whiteSpace: 'nowrap' }}>
          {bot.name}<div style={{ font: '500 30px system-ui', opacity: 0.85 }}>{bot.duty}</div>
        </div>
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
  const moving = useRef(false);
  useEffect(() => {
    const dn = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);
  useFrame(({ camera }, dt) => {
    const g = root.current; if (!g) return;
    const k = keys.current; const joy = joyRef.current || { x: 0, y: 0 };
    let ix = (k['a'] || k['arrowleft'] ? -1 : 0) + (k['d'] || k['arrowright'] ? 1 : 0) + (joy.x || 0);
    let iz = (k['s'] || k['arrowdown'] ? -1 : 0) + (k['w'] || k['arrowup'] ? 1 : 0) + (joy.y || 0);
    const len = Math.hypot(ix, iz); if (len > 1) { ix /= len; iz /= len; }
    const yaw = camRef.current.yaw;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const wx = iz * sin - ix * cos, wz = iz * cos + ix * sin;
    const speed = k['shift'] ? 7 : 4.2;
    const isMoving = Math.abs(wx) + Math.abs(wz) > 0.05;
    if (isMoving) {
      const nx = THREE.MathUtils.clamp(g.position.x + wx * speed * dt, -OFFICE_BOUNDS.x, OFFICE_BOUNDS.x);
      const nz = THREE.MathUtils.clamp(g.position.z + wz * speed * dt, -OFFICE_BOUNDS.z, OFFICE_BOUNDS.z);
      let blocked = false;
      for (const d of OFFICE_DESKS) { if (Math.hypot(nx - d.x, nz - d.z) < 1.0) { blocked = true; break; } }
      if (!blocked) { g.position.x = nx; g.position.z = nz; }
      const targetYaw = Math.atan2(wx, wz);
      let cur = g.rotation.y; let diff = targetYaw - cur; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
      g.rotation.y = cur + diff * Math.min(1, dt * 10);
    }
    moving.current = isMoving;
    playerPos.copy(g.position);
    const pitch = camRef.current.pitch;
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

/* ---------------- Page ---------------- */
export default function OfficePage() {
  const [published, setPublished] = useState<any>(undefined);
  useEffect(() => { let off = false; fetchPublishedOfficeScene().then((s) => { if (!off) setPublished(s); }); return () => { off = true; }; }, []);
  const fallback = useMemo(() => buildOfficeScene(), []);
  const scene = published ?? fallback;
  const bots = useMemo(() => {
    const chars = (scene?.objects || []).filter((o: any) => o.kind === 'character');
    return OFFICE_BOTS.map((bot, i) => {
      const c = chars.find((o: any) => (o.name || '').toLowerCase().includes(bot.name.toLowerCase())) || chars[i];
      const home: [number, number, number] = c ? [c.position[0], 0, c.position[2]] : [OFFICE_DESKS[i].x, 0, OFFICE_DESKS[i].z + OFFICE_DESKS[i].facing * 0.85];
      return { bot, home };
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

  return (
    <div className="fixed inset-0 bg-[#0b0f1a] text-foreground select-none"
      onPointerDown={(e) => { dragRef.current = { x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => { if (!dragRef.current) return; const dx = e.clientX - dragRef.current.x, dy = e.clientY - dragRef.current.y; dragRef.current = { x: e.clientX, y: e.clientY }; camRef.current.yaw -= dx * 0.005; camRef.current.pitch = THREE.MathUtils.clamp(camRef.current.pitch + dy * 0.003, -0.1, 0.9); }}
      onPointerUp={() => { dragRef.current = null; }}>
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 3.5, 19], fov: 55 }}>
        <color attach="background" args={['#a8c8e8']} />
        <ambientLight intensity={0.65} />
        <directionalLight position={[18, 26, 12]} intensity={1.5} />
        <Suspense fallback={null}>
          {scene && <PublishedWorld scene={scene} />}
          {bots.map(({ bot, home }) => <BotCharacter key={bot.key} bot={bot} home={home} onOpen={setOpenBot} />)}
          <Player joyRef={joyRef} camRef={camRef} />
        </Suspense>
        <Proximity onNear={setNearKey} />
      </Canvas>

      <div className="absolute top-3 left-3 z-20 rounded-xl bg-background/90 border border-border px-3.5 py-2.5 max-w-[78vw]">
        <div className="text-sm font-semibold flex items-center gap-2"><BotIcon className="w-4 h-4" />{OFFICE_LEVEL_NAME}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">Walk with WASD or the joystick, drag to look around. Click a bot — or walk up to it — to open its dashboard.</div>
      </div>
      {isAdmin && (
        <button onClick={async () => { const l = await syncOfficeLevelToPublished(); window.location.href = `/imagine-studio/${l.id}`; }} className="absolute top-3 right-3 z-20 rounded-full bg-background/90 border border-border px-3 py-2 text-xs flex items-center gap-1.5">
          <BoxIcon className="w-4 h-4" />Edit in 3D Studio
        </button>
      )}
      {nearBot && !openBot && (
        <button onClick={() => setOpenBot(nearBot)} className="absolute bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium shadow-lg flex items-center gap-2">
          <Play className="w-4 h-4" />Open {nearBot.name}&rsquo;s dashboard
        </button>
      )}

      {/* Mobile joystick */}
      <div className="sm:hidden absolute bottom-20 left-4 z-20 w-28 h-28 rounded-full bg-background/40 border border-white/25 backdrop-blur-sm touch-none"
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (!(e.buttons & 1)) return; const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width - 0.5) * 2, y = ((e.clientY - r.top) / r.height - 0.5) * 2; joyRef.current = { x: Math.max(-1, Math.min(1, x)), y: -Math.max(-1, Math.min(1, y)) }; }}
        onPointerUp={() => { joyRef.current = { x: 0, y: 0 }; }}
        onPointerCancel={() => { joyRef.current = { x: 0, y: 0 }; }}>
        <div className="absolute inset-0 flex items-center justify-center text-white/70 text-[10px] font-medium">MOVE</div>
      </div>

      {/* Bot dashboard */}
      {openBot && (
        <div className="absolute z-30 inset-x-0 bottom-0 sm:inset-x-auto sm:right-0 sm:top-0 sm:w-[400px] max-h-[82vh] sm:max-h-none overflow-y-auto bg-background border-t sm:border-t-0 sm:border-l border-border shadow-2xl">
          <div className="p-4 space-y-4">
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
