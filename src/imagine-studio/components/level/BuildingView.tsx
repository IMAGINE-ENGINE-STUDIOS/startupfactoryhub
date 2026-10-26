// @ts-nocheck -- Imagine Studio v2
/**
 * THE BUILDING VIEW — edit mode only (founder directive 2026-10-25).
 *
 * A world that is a building (the Startup Office) holds LEVELS, one per
 * floor. Opening the world in the 3D Studio shows the whole building:
 * every level stacked like a real building, one floor snapped on top of
 * the next — Level 100 on top, Level 99 directly below it. Clicking a
 * level opens THAT level in the editor and only that level: its agents
 * and content load, the other levels are not loaded at all. The
 * published/live side is unchanged — there, visitors move floor to
 * floor with the BUILDING buttons.
 */
import { Suspense, useEffect, useMemo, useState, startTransition } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { X } from "lucide-react";
import { PublishedWorld } from "@/imagine-studio/components/plaza/PublishedWorld";
import SkyboxDome from "@/imagine-studio/components/level/SkyboxDome";
import { DEFAULT_SKYBOX } from "@/imagine-studio/lib/skyboxes";
import { buildingLevels, type NamedWorld } from "@/imagine-studio/lib/worldSync";
import { findWorldLevelId } from "@/imagine-studio/lib/worldBindings";
import { getLocalLevel } from "@/imagine-studio/lib/localLevels";

/** One story of the building: the office room is 8 m tall, so levels
 * stack with an 8 m pitch — each floor's ceiling snaps to the next
 * floor's floor. */
const STORY = 8;
const offsetY = (floor?: number) => ((floor ?? 100) - 100) * STORY;

/**
 * THE REST OF THE TOWER, FOR LOOKS (founder directive, repeated,
 * 2026-10-26): the building runs from Floor 100 down to Floor 1. The
 * real levels render their actual scenes; every other floor is a
 * lightweight instanced slab + glass band — two draw calls for the
 * whole tower — fading into haze with distance, exactly as the live
 * office shell does. Without this the "building" was two rooms
 * floating in the sky.
 */
function TowerFill({ taken }: { taken: Set<number> }) {
  const { slabs, glass, columns } = useMemo(() => {
    const ids: number[] = [];
    for (let f = 1; f < 100; f++) if (!taken.has(f)) ids.push(f);
    const box = new THREE.BoxGeometry(1, 1, 1);
    const haze = new THREE.Color("#33506e");
    const slabMesh = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0.05 }), ids.length);
    slabMesh.name = "building-view-tower-slabs";
    const glassMesh = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.42, depthWrite: false }), ids.length);
    glassMesh.name = "building-view-tower-glass";
    /* Corner columns: without verticals the stack read as a zigzag
     * ribbon of slab edges (founder screenshot 2026-10-26). A post at
     * each corner of every story gives the tower a frame the eye can
     * follow from top to ground. */
    const colMesh = new THREE.InstancedMesh(box, new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.15 }), ids.length * 4);
    colMesh.name = "building-view-tower-columns";
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const slabBase = new THREE.Color("#cfd8e1");
    const glassBase = new THREE.Color("#6f9ec4");
    const colBase = new THREE.Color("#93a7ba");
    const corners: [number, number][] = [[-24.1, -16.1], [24.1, -16.1], [-24.1, 16.1], [24.1, 16.1]];
    ids.forEach((f, i) => {
      const y = offsetY(f);
      const fade = Math.min(1, (100 - f) / 34);
      m.compose(new THREE.Vector3(0, y - 0.3, 0), q, new THREE.Vector3(48.4, 0.6, 32.4));
      slabMesh.setMatrixAt(i, m);
      slabMesh.setColorAt(i, slabBase.clone().lerp(haze, fade * 0.8));
      m.compose(new THREE.Vector3(0, y + STORY / 2, 0), q, new THREE.Vector3(48.24, STORY - 0.55, 32.24));
      glassMesh.setMatrixAt(i, m);
      glassMesh.setColorAt(i, glassBase.clone().lerp(haze, fade * 0.8));
      corners.forEach(([cx, cz], ci) => {
        m.compose(new THREE.Vector3(cx, y + STORY / 2, cz), q, new THREE.Vector3(0.55, STORY, 0.55));
        colMesh.setMatrixAt(i * 4 + ci, m);
        colMesh.setColorAt(i * 4 + ci, colBase.clone().lerp(haze, fade * 0.8));
      });
    });
    slabMesh.frustumCulled = false;
    glassMesh.frustumCulled = false;
    colMesh.frustumCulled = false;
    return { slabs: slabMesh, glass: glassMesh, columns: colMesh };
  }, [taken]);
  return (
    <>
      <primitive object={slabs} />
      <primitive object={glass} />
      <primitive object={columns} />
      {/* The ground the tower stands on. */}
      <mesh position={[0, offsetY(1) - 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1300, 48]} />
        <meshStandardMaterial color="#131e2a" roughness={1} />
      </mesh>
    </>
  );
}

export type BuildingExtra = { id: string; name: string; floor: number; scene: any };

export function BuildingView({ current, currentScene, extras = [], onSelect, onSelectExtra, onClose }: {
  current: NamedWorld;
  currentScene: any;
  /** Extra levels the user added to this world’s project: each stacks
   * BELOW the registered floors as another floor — the building grows
   * downward as levels are added (founder directive 2026-10-25). */
  extras?: BuildingExtra[];
  onSelect: (w: NamedWorld) => void;
  onSelectExtra?: (id: string) => void;
  onClose: () => void;
}) {
  const levels = useMemo(() => buildingLevels(current), [current]);
  const totalFloors = levels.length + extras.length;
  const [scenes, setScenes] = useState<Record<string, any>>({ [current.key]: currentScene });
  const [hover, setHover] = useState<string | null>(null);

  /* Sibling levels render from their own editor level (or their
   * published scene) — geometry only. No agents, no other level's
   * content loads into the editor itself. A level that has NEITHER yet
   * (never opened, never published — Floor 99 before its first publish)
   * is seeded on the spot, exactly the way opening it would seed it,
   * so EVERY floor of the building is represented in the stack, in
   * both directions. */
  useEffect(() => {
    let off = false;
    (async () => {
      for (const w of levels) {
        if (w.key === current.key) continue;
        const lid = findWorldLevelId(w.key);
        const local = lid ? getLocalLevel(lid) : null;
        if (local?.scene) { if (!off) setScenes((s) => ({ ...s, [w.key]: local.scene })); continue; }
        const pub = await w.fetchPublished().catch(() => null);
        if (pub) { if (!off) setScenes((s) => ({ ...s, [w.key]: pub })); continue; }
        try {
          const rec = await w.syncLevel();
          const sc = (rec as any)?.scene ?? getLocalLevel((rec as any)?.id)?.scene;
          if (!off && sc) setScenes((s) => ({ ...s, [w.key]: sc }));
        } catch { /* the slab + label still represent the level */ }
      }
    })();
    return () => { off = true; };
  }, [levels, current.key]);

  const sky = currentScene?.skybox?.url ? currentScene.skybox : DEFAULT_SKYBOX;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-[#0b1526] text-white">
      <div className="flex shrink-0 items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{current.building} — the building</div>
          <div className="truncate text-[11px] text-white/60">Every level stacked like a real building. Click a level to open it in the editor — only that level loads, with its agents; the others stay unloaded. This view is edit mode only.</div>
        </div>
        <button onClick={onClose} className="shrink-0 rounded-full p-1.5 hover:bg-white/10" aria-label="Close building view"><X className="h-5 w-5" /></button>
      </div>
      <div className="relative min-h-0 flex-1">
        <Canvas dpr={[1, 1.75]} camera={{ position: [430, -170, 430], fov: 48, far: 7000 }}>
          <color attach="background" args={["#0b1526"]} />
          <fog attach="fog" args={["#0b1526", 700, 3200]} />
          <ambientLight intensity={1.0} />
          <hemisphereLight args={["#ffffff", "#5a6a78", 0.5]} />
          <Suspense fallback={null}>
            {/* The skybox must CONTAIN the building (founder report
                2026-10-26: "the skybox isn't big enough"): the stock
                dome is 420 units around the top floor, but the tower
                runs 792 down — it hung out of the photo's bottom into
                the void. In this view the dome is scaled x6.5 and
                centered on the tower's midpoint. */}
            <group position={[0, offsetY(1) / 2, 0]} scale={6.5}>
              <SkyboxDome url={sky.url} />
            </group>
            <TowerFill taken={new Set([...levels.map((w) => w.floor ?? 100), ...extras.map((x) => x.floor), 100])} />
            {levels.map((w) => {
              const s = scenes[w.key];
              const off = offsetY(w.floor);
              const isCurrent = w.key === current.key;
              const hot = hover === w.key;
              return (
                <group key={w.key} position={[0, off, 0]}>
                  {s ? <PublishedWorld scene={{ ...s, skybox: undefined }} renderCharacters={false} /> : null}
                  {/* The floor slab: the building's snap line between
                      levels, and the click target for the whole level. */}
                  <mesh
                    position={[0, 0.18, 0]}
                    onClick={(e) => { e.stopPropagation(); onSelect(w); }}
                    onPointerOver={(e) => { e.stopPropagation(); startTransition(() => setHover(w.key)); }}
                    onPointerOut={() => startTransition(() => setHover((h) => (h === w.key ? null : h)))}
                  >
                    <boxGeometry args={[46, 0.36, 30]} />
                    <meshBasicMaterial color={isCurrent ? "#2EF8A0" : "#00E5FF"} transparent opacity={hot ? 0.3 : isCurrent ? 0.18 : 0.07} depthWrite={false} />
                  </mesh>
                  <Html position={[25.5, 3.6, 0]} center style={{ pointerEvents: "none" }}>
                    <div style={{ whiteSpace: "nowrap", borderRadius: 999, background: isCurrent ? "rgba(6,40,28,.88)" : "rgba(5,10,20,.82)", color: "#fff", padding: "5px 12px", font: "600 12px system-ui", border: isCurrent ? "1px solid #2EF8A0" : "1px solid rgba(255,255,255,.25)" }}>
                      LEVEL {w.floor} — {w.levelLabel?.split("—")[1]?.trim() || w.name}{isCurrent ? " · you are editing this level" : ""}
                    </div>
                  </Html>
                </group>
              );
            })}
            {extras.map((x) => {
              const off = offsetY(x.floor);
              const key = `x:${x.id}`;
              const hot = hover === key;
              return (
                <group key={key} position={[0, off, 0]}>
                  {x.scene ? <PublishedWorld scene={{ ...x.scene, skybox: undefined }} renderCharacters={false} /> : null}
                  <mesh
                    position={[0, 0.18, 0]}
                    onClick={(e) => { e.stopPropagation(); onSelectExtra?.(x.id); }}
                    onPointerOver={(e) => { e.stopPropagation(); startTransition(() => setHover(key)); }}
                    onPointerOut={() => startTransition(() => setHover((h) => (h === key ? null : h)))}
                  >
                    <boxGeometry args={[46, 0.36, 30]} />
                    <meshBasicMaterial color="#00E5FF" transparent opacity={hot ? 0.3 : 0.07} depthWrite={false} />
                  </mesh>
                  <Html position={[25.5, 3.6, 0]} center style={{ pointerEvents: "none" }}>
                    <div style={{ whiteSpace: "nowrap", borderRadius: 999, background: "rgba(5,10,20,.82)", color: "#fff", padding: "5px 12px", font: "600 12px system-ui", border: "1px solid rgba(255,255,255,.25)" }}>
                      LEVEL {x.floor} — {x.name}
                    </div>
                  </Html>
                </group>
              );
            })}
          </Suspense>
          <OrbitControls makeDefault target={[0, offsetY(1) / 2, 0]} maxDistance={2400} minDistance={6} />
        </Canvas>
        <div className="absolute right-3 top-3 flex w-60 flex-col gap-2">
          {levels.map((w) => (
            <button
              key={w.key}
              onClick={() => onSelect(w)}
              onMouseEnter={() => setHover(w.key)}
              onMouseLeave={() => setHover(null)}
              className={`rounded-xl border px-3.5 py-3 text-left backdrop-blur transition ${w.key === current.key ? "border-emerald-400/70 bg-emerald-500/15" : "border-white/15 bg-black/45 hover:border-cyan-300/60"}`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Level {w.floor}</div>
              <div className="mt-0.5 text-sm font-semibold leading-tight">{w.levelLabel?.split("—")[1]?.trim() || w.name}</div>
              <div className="mt-0.5 text-[11px] text-white/55">{w.key === current.key ? "You are editing this level" : scenes[w.key] ? "Click to open this level in the editor" : "Click to open — it seeds from the published scene"}</div>
            </button>
          ))}
          {extras.map((x) => (
            <button
              key={`x-${x.id}`}
              onClick={() => onSelectExtra?.(x.id)}
              onMouseEnter={() => setHover(`x:${x.id}`)}
              onMouseLeave={() => setHover(null)}
              className="rounded-xl border border-white/15 bg-black/45 px-3.5 py-3 text-left backdrop-blur transition hover:border-cyan-300/60"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Level {x.floor}</div>
              <div className="mt-0.5 text-sm font-semibold leading-tight">{x.name}</div>
              <div className="mt-0.5 text-[11px] text-white/55">Added to this project — click to open in the editor</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
