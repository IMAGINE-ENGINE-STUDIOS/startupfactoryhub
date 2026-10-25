// @ts-nocheck -- Imagine Studio v2
/**
 * Play-test EXACTLY as published. The studio's Play button mounts this
 * overlay with a JSON round-tripped snapshot of the editor scene (the
 * identical payload Publish writes) and renders it with the SAME components
 * the live pages use:
 *  - Office: PublishedWorld + the office's own seated bots, third-person
 *    player, orbit camera, joystick and theater screen, lifted from
 *    OfficePage itself.
 *  - Any other level: PublishedWorld + a third-person avatar with the same
 *    controller feel (WASD relative to the camera, drag-look, shift run).
 * Live rooms add other people (presence, voice, chat) on top of this exact
 * scene; the solo test is the published experience minus the other guests.
 */
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import { X } from "lucide-react";
import { PublishedWorld } from "@/imagine-studio/components/plaza/PublishedWorld";
import { OfficeBotCharacter, OfficePlayer, OfficeTheaterScreen } from "@/imagine-studio/pages/OfficePage";
import { OFFICE_BOTS, OFFICE_DESKS } from "@/imagine-studio/lib/officeWorld";
import { resolveLevelWorld } from "@/imagine-studio/lib/worldBindings";

/* Third-person avatar + follow camera with the published controller feel,
   for levels that don't have a dedicated live page component set. */
function ThirdPersonPlayer({ camRef, joyRef, spawn }: { camRef: any; joyRef: any; spawn: [number, number] }) {
  const { scene, animations } = useGLTF("/models/plaza/Xbot.glb");
  const model = useMemo(() => { const m = skeletonClone(scene) as THREE.Object3D; m.traverse((o: any) => { if (o.isMesh) o.frustumCulled = false; }); return m; }, [scene]);
  const root = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, root);
  const keys = useRef<Record<string, boolean>>({});
  const vel = useRef({ x: 0, z: 0 });
  const smCam = useRef<{ yaw: number; pitch: number } | null>(null);
  useEffect(() => {
    const dn = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", dn); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);
  useFrame(({ camera }, dt) => {
    const g = root.current; if (!g) return;
    const k = keys.current; const joy = joyRef.current || { x: 0, y: 0 };
    let ix = (k["a"] || k["arrowleft"] ? -1 : 0) + (k["d"] || k["arrowright"] ? 1 : 0) + (joy.x || 0);
    let iz = (k["s"] || k["arrowdown"] ? -1 : 0) + (k["w"] || k["arrowup"] ? 1 : 0) + (joy.y || 0);
    const len = Math.hypot(ix, iz); if (len > 1) { ix /= len; iz /= len; }
    if (!smCam.current) smCam.current = { yaw: camRef.current.yaw, pitch: camRef.current.pitch };
    const kc = 1 - Math.exp(-dt * 9);
    let dyaw = camRef.current.yaw - smCam.current.yaw; while (dyaw > Math.PI) dyaw -= Math.PI * 2; while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    smCam.current.yaw += dyaw * kc;
    smCam.current.pitch += (camRef.current.pitch - smCam.current.pitch) * kc;
    const yaw = smCam.current.yaw;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const wx = iz * sin - ix * cos, wz = iz * cos + ix * sin;
    const speed = k["shift"] ? 7 : 4.2;
    const hasInput = Math.abs(wx) + Math.abs(wz) > 0.05;
    const kv = 1 - Math.exp(-dt * 8);
    vel.current.x += ((hasInput ? wx * speed : 0) - vel.current.x) * kv;
    vel.current.z += ((hasInput ? wz * speed : 0) - vel.current.z) * kv;
    const vMag = Math.abs(vel.current.x) + Math.abs(vel.current.z);
    const isMoving = vMag > 0.3;
    if (vMag > 0.02) {
      g.position.x = THREE.MathUtils.clamp(g.position.x + vel.current.x * dt, -60, 60);
      g.position.z = THREE.MathUtils.clamp(g.position.z + vel.current.z * dt, -60, 60);
      if (isMoving) {
        const targetYaw = Math.atan2(vel.current.x, vel.current.z);
        let cur = g.rotation.y; let diff = targetYaw - cur; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
        g.rotation.y = cur + diff * Math.min(1, dt * 10);
      }
    }
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
    <group ref={root} position={[spawn[0], 0, spawn[1]]}>
      <primitive object={model} />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.45, 0.55, 32]} /><meshBasicMaterial color="#f59e0b" /></mesh>
    </group>
  );
}

export default function PublishedPlayTest({ name, levelId, scene, onExit }: { name: string; levelId?: string; scene: any; onExit: () => void }) {
  // The exact payload Publish would write: JSON round-trip strips anything
  // editor-only, so the test renders byte-for-byte the published structure.
  const snapshot = useMemo(() => JSON.parse(JSON.stringify(scene)), [scene]);
  const world = resolveLevelWorld(levelId, name);
  const isOffice = world?.key === "office";
  const socialOn = useMemo(() => {
    const s = (snapshot as any)?.social || {};
    const on = (k: string) => (s[k] !== undefined ? !!s[k] : !!world);
    return ["presence", "voice", "chat", "theater"].filter(on);
  }, [snapshot, world]);

  const camRef = useRef({ yaw: Math.PI, pitch: 0.25 });
  const joyRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const joyBase = useRef<HTMLDivElement>(null);
  const joyKnob = useRef<HTMLDivElement>(null);

  // Office bots, paired to desks and chairs exactly like the live page.
  const bots = useMemo(() => {
    if (!isOffice) return [];
    const chars = (snapshot?.objects || []).filter((o: any) => o.kind === "character");
    const chairs = (snapshot?.objects || []).filter((o: any) => /^Agent Chair \d+$/.test(o.name || ""));
    return OFFICE_BOTS.map((bot, i) => {
      const c = chars.find((o: any) => (o.name || "").toLowerCase().includes(bot.name.toLowerCase())) || chars[i];
      const home: [number, number, number] = c ? [c.position[0], 0, c.position[2]] : [OFFICE_DESKS[i].x, 0, OFFICE_DESKS[i].z + OFFICE_DESKS[i].facing * 0.85];
      const rotY = c ? (c.rotation?.[1] ?? 0) : (OFFICE_DESKS[i].facing === 1 ? Math.PI : 0);
      let seatY = 0.52; let bd = 1.6;
      for (const ch of chairs) { const d = Math.hypot(ch.position[0] - home[0], ch.position[2] - home[2]); if (d < bd) { bd = d; seatY = ch.position[1] + (ch.scale?.[1] ?? 0.07) / 2; } }
      return { bot, home, rotY, seatY };
    });
  }, [snapshot, isOffice]);

  const spawn = useMemo<[number, number]>(() => {
    const chars = (snapshot?.objects || []).filter((o: any) => o.kind === "character");
    const playable = chars.find((o: any) => o.playable) || chars[0];
    if (playable) return [playable.position[0], playable.position[2] + 4];
    return [0, 10];
  }, [snapshot]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onExit(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onExit]);

  const uiGuard = (e: any) => !!(e.target as HTMLElement)?.closest?.("[data-test-ui]");

  return (
    <div
      className="fixed inset-0 z-[90] bg-[#02070E]"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => { if (uiGuard(e)) return; dragRef.current = { x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => {
        if (!dragRef.current) return;
        const evs = (e.nativeEvent as any).getCoalescedEvents?.() as PointerEvent[] | undefined;
        const last = evs?.length ? evs[evs.length - 1] : e.nativeEvent;
        const dx = last.clientX - dragRef.current.x, dy = last.clientY - dragRef.current.y;
        dragRef.current = { x: last.clientX, y: last.clientY };
        camRef.current.yaw -= dx * (e.pointerType === "touch" ? 0.0042 : 0.005);
        camRef.current.pitch = THREE.MathUtils.clamp(camRef.current.pitch + dy * 0.003, -0.1, 0.9);
      }}
      onPointerUp={() => { dragRef.current = null; }}
    >
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 3.5, 19], fov: 55 }} gl={{ antialias: true }}>
        <color attach="background" args={["#02070E"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[18, 26, 12]} intensity={0.95} color="#cfe6ff" />
        <Suspense fallback={null}>
          <PublishedWorld scene={snapshot} />
          {isOffice ? (
            <>
              {snapshot.objects.filter((o: any) => o.kind === 'character' && o.agentId).map((o: any) => (
                <OfficeBotCharacter key={`test_agent_${o.id}`} bot={{ key: `test_agent_${o.id}`, name: o.name || 'Agent', duty: 'AI agent character', model: o.url || '/models/plaza/Xbot.glb', tint: '#a78bfa' }} home={[o.position?.[0] ?? 0, 0, o.position?.[2] ?? 5]} rotY={o.rotation?.[1] ?? 0} seatY={o.seatHeight ?? 0.52} seated={!!o.startSeated} onOpen={() => {}} />
              ))}
              {bots.map(({ bot, home, rotY, seatY }) => (
                <OfficeBotCharacter key={bot.key} bot={bot} home={home} rotY={rotY} seatY={seatY} onOpen={() => {}} />
              ))}
              <OfficeTheaterScreen source={null} screenBot={null} screenLink={{}} screenAgent={undefined} screenRuns={[]} onPages={() => {}} />
              <OfficePlayer joyRef={joyRef} camRef={camRef} />
            </>
          ) : (
            <ThirdPersonPlayer camRef={camRef} joyRef={joyRef} spawn={spawn} />
          )}
        </Suspense>
      </Canvas>

      {/* HUD */}
      <div data-test-ui className="absolute top-0 inset-x-0 flex items-start justify-between gap-3 p-3 pointer-events-none">
        <div className="pointer-events-auto rounded-xl bg-black/70 backdrop-blur px-3.5 py-2.5 text-white max-w-[78vw]">
          <div className="text-[13px] font-bold tracking-wide">TESTING AS PUBLISHED</div>
          <div className="text-[11px] text-white/60 leading-snug mt-0.5">
            {name} — the live page's own scene, characters and controller. Drag to look · WASD / joystick to walk · Shift runs · Esc exits.
          </div>
          {socialOn.length > 0 && (
            <div className="text-[11px] text-emerald-300/90 leading-snug mt-0.5">
              Social is on ({socialOn.join(" · ")}) — in the live room, other people join you here on this exact scene.
            </div>
          )}
        </div>
        <div className="flex gap-2 pointer-events-auto">
          {world && (
            <a href={world.livePath} target="_blank" rel="noreferrer" className="rounded-lg bg-white/10 hover:bg-white/20 text-white text-[12px] font-semibold px-3 py-2 backdrop-blur">
              Open live {world.livePath}
            </a>
          )}
          <button onClick={onExit} className="rounded-lg bg-red-500/85 hover:bg-red-500 text-white px-3 py-2 backdrop-blur" aria-label="Exit play test">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* mobile joystick — same as the live office */}
      <div
        data-test-ui
        ref={joyBase}
        className="absolute bottom-6 left-5 w-28 h-28 rounded-full bg-white/8 border border-white/15 backdrop-blur-sm sm:hidden"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => {
          if (!(e.buttons & 1)) return;
          const r = joyBase.current!.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width - 0.5) * 2, y = ((e.clientY - r.top) / r.height - 0.5) * 2;
          joyRef.current = { x: THREE.MathUtils.clamp(x, -1, 1), y: -THREE.MathUtils.clamp(y, -1, 1) };
          if (joyKnob.current) joyKnob.current.style.transform = `translate(${joyRef.current.x * 26}px, ${-joyRef.current.y * 26}px)`;
        }}
        onPointerUp={() => { joyRef.current = { x: 0, y: 0 }; if (joyKnob.current) joyKnob.current.style.transform = ""; }}
        onPointerCancel={() => { joyRef.current = { x: 0, y: 0 }; }}
      >
        <div ref={joyKnob} className="absolute left-1/2 top-1/2 -ml-6 -mt-6 w-12 h-12 rounded-full bg-white/25 border border-white/40" />
      </div>
    </div>
  );
}
