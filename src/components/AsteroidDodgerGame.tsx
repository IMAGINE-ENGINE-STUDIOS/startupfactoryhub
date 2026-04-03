import { useRef, useEffect, useState, useCallback } from "react";
import { useGameTouchControls } from "@/hooks/useGameTouchControls";

const W = 340, H = 400;

const AsteroidDodgerGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"menu" | "playing" | "over">("menu");
  const [score, setScore] = useState(0);
  const [hi, setHi] = useState(() => parseInt(localStorage.getItem("artemis-asteroid-hs") || "0"));
  const gRef = useRef({
    ship: { x: W / 2, y: H - 40 },
    asteroids: [] as { x: number; y: number; r: number; speed: number; rot: number }[],
    keys: {} as Record<string, boolean>,
    frame: 0, score: 0, spawnRate: 60,
  });

  const start = useCallback(() => {
    const g = gRef.current;
    g.ship = { x: W / 2, y: H - 40 };
    g.asteroids = [];
    g.frame = 0; g.score = 0; g.spawnRate = 60;
    setScore(0);
    setState("playing");
  }, []);

  useGameTouchControls({
    canvasRef,
    keys: gRef.current.keys,
    enabled: state === "playing",
    mode: "4dir",
  });

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { gRef.current.keys[e.key] = true; if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) e.preventDefault(); };
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
      g.score = Math.floor(g.frame / 10);
      setScore(g.score);

      if (g.keys["ArrowLeft"] || g.keys["a"]) g.ship.x = Math.max(10, g.ship.x - 2);
      if (g.keys["ArrowRight"] || g.keys["d"]) g.ship.x = Math.min(W - 10, g.ship.x + 2);
      if (g.keys["ArrowUp"] || g.keys["w"]) g.ship.y = Math.max(10, g.ship.y - 1.5);
      if (g.keys["ArrowDown"] || g.keys["s"]) g.ship.y = Math.min(H - 10, g.ship.y + 1.5);

      if (g.frame % Math.max(15, g.spawnRate) === 0) {
        g.asteroids.push({ x: Math.random() * W, y: -20, r: 8 + Math.random() * 14, speed: 1.5 + Math.random() * 2 + g.frame * 0.001, rot: Math.random() * Math.PI * 2 });
      }
      if (g.frame % 300 === 0 && g.spawnRate > 15) g.spawnRate -= 5;

      g.asteroids = g.asteroids.filter(a => { a.y += a.speed; a.rot += 0.02; return a.y < H + 30; });

      for (const a of g.asteroids) {
        const dx = a.x - g.ship.x, dy = a.y - g.ship.y;
        if (Math.sqrt(dx * dx + dy * dy) < a.r + 8) {
          setState("over");
          if (g.score > hi) { setHi(g.score); localStorage.setItem("artemis-asteroid-hs", g.score.toString()); }
          return;
        }
      }

      ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(100,255,150,0.12)";
      for (let i = 0; i < 30; i++) ctx.fillRect((i * 97 + g.frame * 0.05) % W, (i * 53) % H, 1, 1);

      for (const a of g.asteroids) {
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot);
        ctx.fillStyle = "#886644"; ctx.beginPath();
        for (let i = 0; i < 6; i++) { const angle = (Math.PI * 2 / 6) * i; const r = a.r * (0.8 + Math.sin(i * 3) * 0.2); i === 0 ? ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r) : ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r); }
        ctx.closePath(); ctx.fill(); ctx.restore();
      }

      ctx.fillStyle = "#00ff88";
      ctx.beginPath(); ctx.moveTo(g.ship.x, g.ship.y - 12); ctx.lineTo(g.ship.x - 10, g.ship.y + 8); ctx.lineTo(g.ship.x + 10, g.ship.y + 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(0,255,136,0.3)"; ctx.fillRect(g.ship.x - 3, g.ship.y + 8, 6, 3 + Math.random() * 4);

      ctx.fillStyle = "#00ff88"; ctx.font = "10px monospace"; ctx.fillText(`SCORE: ${g.score}`, 8, 16);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state, hi]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas ref={canvasRef} width={W} height={H} className="rounded-lg border border-primary/20" style={{ imageRendering: "pixelated" }} />
        {state !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg backdrop-blur-sm">
            <span className="text-primary font-futuristic text-sm font-bold tracking-wider mb-1">{state === "over" ? "MISSION FAILED" : "ASTEROID DODGER"}</span>
            {state === "over" && <span className="text-muted-foreground text-xs font-mono mb-1">SCORE: {score}</span>}
            {hi > 0 && <span className="text-muted-foreground/50 text-[10px] font-mono mb-3">HI: {hi}</span>}
            <button onClick={start} className="glass-morphism border border-primary/40 text-primary hover:bg-primary/20 px-4 py-1.5 rounded-lg text-xs font-futuristic tracking-wider transition-all">{state === "menu" ? "START MISSION" : "RETRY"}</button>
            <span className="text-muted-foreground/40 text-[9px] font-mono mt-2">← → ↑ ↓ MOVE</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsteroidDodgerGame;
