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
import { Suspense, useEffect, useMemo, useState } from "react";
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

export function BuildingView({ current, currentScene, onSelect, onClose }: {
  current: NamedWorld;
  currentScene: any;
  onSelect: (w: NamedWorld) => void;
  onClose: () => void;
}) {
  const levels = useMemo(() => buildingLevels(current), [current]);
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
        <Canvas dpr={[1, 1.75]} camera={{ position: [38, 15, 38], fov: 48 }}>
          <color attach="background" args={["#0b1526"]} />
          <ambientLight intensity={1.0} />
          <hemisphereLight args={["#ffffff", "#5a6a78", 0.5]} />
          <Suspense fallback={null}>
            <SkyboxDome url={sky.url} />
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
                    onPointerOver={(e) => { e.stopPropagation(); setHover(w.key); }}
                    onPointerOut={() => setHover((h) => (h === w.key ? null : h))}
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
          </Suspense>
          <OrbitControls makeDefault target={[0, levels.length > 1 ? -1 : 3, 0]} maxDistance={140} />
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
        </div>
      </div>
    </div>
  );
}
