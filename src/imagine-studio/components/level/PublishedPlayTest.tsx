// Play-test EXACTLY as published. The studio's Play button mounts this
// overlay: the scene is JSON round-tripped (the identical payload Publish
// writes) and rendered by PublishedWorld — the same renderer the live
// /plaza and /office pages use — with a published-style walker. What the
// founder tests here is what visitors get; there is no separate simulation.
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { X } from "lucide-react";
import { PublishedWorld } from "@/imagine-studio/components/plaza/PublishedWorld";
import { matchNamedWorld } from "@/imagine-studio/lib/worldSync";

export default function PublishedPlayTest({ name, scene, onExit }: { name: string; scene: any; onExit: () => void }) {
  // The exact payload Publish would write: JSON round-trip strips anything
  // editor-only, so the test renders byte-for-byte the published structure.
  const snapshot = useMemo(() => JSON.parse(JSON.stringify(scene)), [scene]);
  const world = matchNamedWorld(name);
  const joy = useRef({ x: 0, y: 0 });
  const joyBase = useRef<HTMLDivElement>(null);
  const joyKnob = useRef<HTMLDivElement>(null);

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

  return (
    <div className="fixed inset-0 z-[90] bg-[#02070E]" style={{ touchAction: "none" }}>
      <Canvas dpr={[1, 1.75]} camera={{ fov: 55, near: 0.1, far: 500, position: [spawn[0], 1.7, spawn[1]] }} gl={{ antialias: true }}>
        <color attach="background" args={["#02070E"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[12, 20, 8]} intensity={0.95} color="#cfe6ff" />
        <PublishedWorld scene={snapshot} />
        <TestPlayerWithJoy spawn={spawn} joy={joy} joyKnob={joyKnob} />
      </Canvas>

      {/* HUD */}
      <div data-test-ui className="absolute top-0 inset-x-0 flex items-start justify-between gap-3 p-3 pointer-events-none">
        <div className="pointer-events-auto rounded-xl bg-black/70 backdrop-blur px-3.5 py-2.5 text-white max-w-[78vw]">
          <div className="text-[13px] font-bold tracking-wide">TESTING AS PUBLISHED</div>
          <div className="text-[11px] text-white/60 leading-snug mt-0.5">
            {name} — same renderer, same scene data as the live page. WASD / drag to look · Shift runs · Esc exits.
          </div>
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

      {/* mobile joystick */}
      <div
        data-test-ui
        ref={joyBase}
        className="absolute bottom-6 left-5 w-28 h-28 rounded-full bg-white/8 border border-white/15 backdrop-blur-sm sm:hidden"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => {
          if (!e.buttons) return;
          const r = joyBase.current!.getBoundingClientRect();
          const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
          const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
          const m = Math.hypot(dx, dy) || 1;
          const c = Math.min(1, m);
          joy.current = { x: (dx / m) * c, y: (dy / m) * c };
          if (joyKnob.current) joyKnob.current.style.transform = `translate(${joy.current.x * 26}px, ${joy.current.y * 26}px)`;
        }}
        onPointerUp={() => { joy.current = { x: 0, y: 0 }; if (joyKnob.current) joyKnob.current.style.transform = ""; }}
        onPointerCancel={() => { joy.current = { x: 0, y: 0 }; }}
      >
        <div ref={joyKnob} className="absolute left-1/2 top-1/2 -ml-6 -mt-6 w-12 h-12 rounded-full bg-white/25 border border-white/40" />
      </div>
    </div>
  );
}

function TestPlayerWithJoy({ spawn, joy, joyKnob }: { spawn: [number, number]; joy: React.MutableRefObject<{ x: number; y: number }>; joyKnob: React.RefObject<HTMLDivElement | null> }) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(Math.PI);
  const pitch = useRef(-0.08);
  const pos = useRef(new THREE.Vector3(spawn[0], 1.7, spawn[1]));
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const dn = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    const el = gl.domElement;
    const pd = (e: PointerEvent) => { if ((e.target as HTMLElement).closest("[data-test-ui]")) return; drag.current = { x: e.clientX, y: e.clientY }; };
    const pm = (e: PointerEvent) => {
      if (!drag.current) return;
      const evs = (e as any).getCoalescedEvents ? (e as any).getCoalescedEvents() : [e];
      const last = evs[evs.length - 1] || e;
      yaw.current -= (last.clientX - drag.current.x) * 0.005;
      pitch.current = THREE.MathUtils.clamp(pitch.current - (last.clientY - drag.current.y) * 0.005, -1.2, 1.2);
      drag.current = { x: last.clientX, y: last.clientY };
    };
    const pu = () => { drag.current = null; };
    el.addEventListener("pointerdown", pd);
    window.addEventListener("pointermove", pm);
    window.addEventListener("pointerup", pu);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); el.removeEventListener("pointerdown", pd); window.removeEventListener("pointermove", pm); window.removeEventListener("pointerup", pu); };
  }, [gl]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const sp = (keys.current.ShiftLeft || keys.current.ShiftRight ? 8.5 : 4.2) * dt;
    const f = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const r = new THREE.Vector3(-f.z, 0, f.x);
    const mv = new THREE.Vector3();
    if (keys.current.KeyW || keys.current.ArrowUp) mv.add(f);
    if (keys.current.KeyS || keys.current.ArrowDown) mv.sub(f);
    if (keys.current.KeyD || keys.current.ArrowRight) mv.add(r);
    if (keys.current.KeyA || keys.current.ArrowLeft) mv.sub(r);
    if (joy.current.y) mv.addScaledVector(f, -joy.current.y);
    if (joy.current.x) mv.addScaledVector(r, joy.current.x);
    if (mv.lengthSq() > 0) pos.current.addScaledVector(mv.normalize(), sp);
    camera.position.copy(pos.current);
    camera.lookAt(pos.current.x - Math.sin(yaw.current) * Math.cos(pitch.current), pos.current.y + Math.sin(pitch.current), pos.current.z - Math.cos(yaw.current) * Math.cos(pitch.current));
  });
  return null;
}
