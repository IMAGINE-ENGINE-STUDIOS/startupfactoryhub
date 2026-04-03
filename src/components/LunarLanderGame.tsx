import { useRef, useEffect, useState, useCallback } from "react";
import { useGameTouchControls } from "@/hooks/useGameTouchControls";

const W = 340, H = 400;
const GRAVITY = 0.02;
const THRUST = -0.06;

const LunarLanderGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"menu" | "playing" | "landed" | "crashed">("menu");
  const [score, setScore] = useState(0);
  const gRef = useRef({
    lander: { x: W / 2, y: 40, vx: 0, vy: 0, fuel: 100, angle: 0 },
    terrain: [] as { x: number; y: number }[],
    padX: 0, padW: 50,
    keys: {} as Record<string, boolean>,
    frame: 0,
  });

  const genTerrain = useCallback(() => {
    const points: { x: number; y: number }[] = [];
    const padStart = 100 + Math.random() * (W - 200);
    gRef.current.padX = padStart;
    for (let x = 0; x <= W; x += 10) {
      if (x >= padStart && x <= padStart + 50) {
        points.push({ x, y: H - 40 });
      } else {
        points.push({ x, y: H - 30 - Math.random() * 60 });
      }
    }
    return points;
  }, []);

  const start = useCallback(() => {
    const g = gRef.current;
    g.lander = { x: W / 2, y: 40, vx: 0.3, vy: 0, fuel: 100, angle: 0 };
    g.terrain = genTerrain();
    g.frame = 0;
    setScore(0);
    setState("playing");
  }, [genTerrain]);

  useGameTouchControls({
    canvasRef,
    keys: gRef.current.keys,
    enabled: state === "playing",
    mode: "horizontal-thrust",
  });

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { gRef.current.keys[e.key] = true; if (["ArrowLeft","ArrowRight","ArrowUp"," "].includes(e.key)) e.preventDefault(); };
    const ku = (e: KeyboardEvent) => { gRef.current.keys[e.key] = false; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  useEffect(() => {
    if (state !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const loop = () => {
      const g = gRef.current;
      g.frame++;
      const l = g.lander;

      l.vy += GRAVITY;
      if ((g.keys["ArrowUp"] || g.keys[" "]) && l.fuel > 0) { l.vy += THRUST; l.fuel = Math.max(0, l.fuel - 0.3); }
      if (g.keys["ArrowLeft"] || g.keys["a"]) l.vx -= 0.05;
      if (g.keys["ArrowRight"] || g.keys["d"]) l.vx += 0.05;

      l.x += l.vx; l.y += l.vy;
      if (l.x < 5) { l.x = 5; l.vx = 0; }
      if (l.x > W - 5) { l.x = W - 5; l.vx = 0; }

      // Check terrain collision
      for (let i = 0; i < g.terrain.length - 1; i++) {
        const p1 = g.terrain[i], p2 = g.terrain[i + 1];
        if (l.x >= p1.x && l.x <= p2.x) {
          const t = (l.x - p1.x) / (p2.x - p1.x);
          const groundY = p1.y + t * (p2.y - p1.y);
          if (l.y + 8 >= groundY) {
            const onPad = l.x >= g.padX && l.x <= g.padX + g.padW;
            const softLanding = Math.abs(l.vy) < 1.2 && Math.abs(l.vx) < 0.8;
            if (onPad && softLanding) {
              const fuelBonus = Math.floor(l.fuel);
              const speedBonus = Math.floor((1.2 - Math.abs(l.vy)) * 50);
              setScore(100 + fuelBonus + speedBonus);
              setState("landed");
            } else {
              setState("crashed");
            }
            return;
          }
        }
      }

      // Draw
      ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(100,255,150,0.1)";
      for (let i = 0; i < 25; i++) ctx.fillRect((i * 97) % W, (i * 53) % H, 1, 1);

      // Terrain
      ctx.strokeStyle = "#555"; ctx.lineWidth = 1; ctx.beginPath();
      g.terrain.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
      ctx.fillStyle = "#1a1a1a"; ctx.fill(); ctx.stroke();

      // Landing pad
      ctx.fillStyle = "#00ff88"; ctx.fillRect(g.padX, H - 41, g.padW, 3);

      // Lander
      ctx.fillStyle = "#cccccc";
      ctx.fillRect(l.x - 8, l.y - 4, 16, 10);
      ctx.fillRect(l.x - 4, l.y - 8, 8, 4);
      // Legs
      ctx.strokeStyle = "#999"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(l.x - 8, l.y + 6); ctx.lineTo(l.x - 12, l.y + 10); ctx.moveTo(l.x + 8, l.y + 6); ctx.lineTo(l.x + 12, l.y + 10); ctx.stroke();

      // Thrust flame
      if ((g.keys["ArrowUp"] || g.keys[" "]) && l.fuel > 0) {
        ctx.fillStyle = "#ff8800";
        ctx.beginPath(); ctx.moveTo(l.x - 4, l.y + 6); ctx.lineTo(l.x, l.y + 14 + Math.random() * 8); ctx.lineTo(l.x + 4, l.y + 6); ctx.closePath(); ctx.fill();
      }

      // HUD
      ctx.fillStyle = "#00ff88"; ctx.font = "10px monospace";
      ctx.fillText(`FUEL: ${Math.floor(l.fuel)}%`, 8, 16);
      ctx.fillText(`VY: ${l.vy.toFixed(1)}`, W - 70, 16);
      ctx.fillText(`VX: ${l.vx.toFixed(1)}`, W - 70, 28);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-lg border border-primary/20" style={{ imageRendering: "pixelated" }} />
        {state !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg backdrop-blur-sm">
            <span className="text-primary font-futuristic text-sm font-bold tracking-wider mb-1">
              {state === "crashed" ? "CRASH LANDING" : state === "landed" ? "PERFECT LANDING!" : "LUNAR LANDER"}
            </span>
            {(state === "landed" || state === "crashed") && <span className="text-muted-foreground text-xs font-mono mb-3">SCORE: {score}</span>}
            <button onClick={start} className="glass-morphism border border-primary/40 text-primary hover:bg-primary/20 px-4 py-1.5 rounded-lg text-xs font-futuristic tracking-wider transition-all">{state === "menu" ? "START MISSION" : "RETRY"}</button>
            <span className="text-muted-foreground/40 text-[9px] font-mono mt-2">← → STEER &nbsp; ↑/SPACE THRUST</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LunarLanderGame;
