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
import { OfficeBotCharacter, OfficeTheaterScreen } from "@/imagine-studio/pages/OfficePage";
import { OFFICE_BOTS, OFFICE_BOUNDS, OFFICE_DESKS } from "@/imagine-studio/lib/officeWorld";
import { UnifiedPlayer } from "@/imagine-studio/components/player/UnifiedPlayer";
import { playerControllerFor, controllerForCharacter } from "@/imagine-studio/lib/controllers";
import MobileTouchControls from "@/imagine-studio/components/level/play/MobileTouchControls";
import { resolveLevelWorld } from "@/imagine-studio/lib/worldBindings";

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
  const dragRef = useRef<{ x: number; y: number } | null>(null);

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

  // The snapshot's own controller — the test plays with the world's real one.
  const testDef = useMemo(() => {
    const chars = ((snapshot as any)?.objects ?? []).filter((o: any) => o?.kind === "character");
    const pc = chars.find((o: any) => o.playable) ?? chars[0];
    return pc?.controllerId ? controllerForCharacter(snapshot ?? undefined, pc) : playerControllerFor(snapshot ?? undefined);
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
      <Canvas dpr={[1, 1.75]} camera={{ position: [4, 3.4, 7], fov: 55 }} gl={{ antialias: true }}>
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
              <UnifiedPlayer def={testDef} world={{ spawn: [4, 0, 0], bounds: OFFICE_BOUNDS, colliders: OFFICE_DESKS.map((d) => ({ x: d.x, z: d.z, r: 1.0 })), camClamp: { minX: -21, maxX: 21, minY: 0.7, maxY: 6.5, minZ: -13.2, maxZ: 13.2 } }} lookRef={camRef} />
            </>
          ) : (
            <UnifiedPlayer def={testDef} world={{ spawn: [spawn[0], 0, spawn[1]] }} lookRef={camRef} />
          )}
        </Suspense>
      </Canvas>

      {/* HUD */}
      <div data-test-ui className="absolute top-0 inset-x-0 z-30 flex items-start justify-between gap-3 p-3 pointer-events-none">
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

      {/* Mobile controls — the same shared touch UI as every published world */}
      <MobileTouchControls visible layerClass="z-10" />
    </div>
  );
}
