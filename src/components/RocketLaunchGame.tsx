import { useRef, useEffect, useState, useCallback } from "react";

const W = 340, H = 400;

interface Stage { name: string; targetAlt: number; color: string; }
const STAGES: Stage[] = [
  { name: "STAGE 1 — LIFTOFF", targetAlt: 1000, color: "#ff6644" },
  { name: "STAGE 2 — ATMOSPHERE", targetAlt: 3000, color: "#ffaa00" },
  { name: "STAGE 3 — ORBIT", targetAlt: 6000, color: "#00aaff" },
  { name: "TRANS-LUNAR INJECTION", targetAlt: 10000, color: "#aa44ff" },
];

const RocketLaunchGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"menu" | "playing" | "orbit" | "failed">("menu");
  const [score, setScore] = useState(0);
  const [hi, setHi] = useState(() => parseInt(localStorage.getItem("artemis-rocket-hs") || "0"));

  const gRef = useRef({
    alt: 0, vel: 0, fuel: 100, thrust: 0,
    stage: 0, stageTimer: 0,
    shaking: false, particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    keys: {} as Record<string, boolean>,
    frame: 0, failed: false,
  });

  const start = useCallback(() => {
    const g = gRef.current;
    g.alt = 0; g.vel = 0; g.fuel = 100; g.thrust = 0;
    g.stage = 0; g.stageTimer = 0; g.shaking = false;
    g.particles = []; g.frame = 0; g.failed = false;
    setScore(0);
    setState("playing");
  }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { gRef.current.keys[e.key] = true; if ([" ", "ArrowUp"].includes(e.key)) e.preventDefault(); };
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

      const holding = g.keys[" "] || g.keys["ArrowUp"];
      const gravity = Math.max(0.01, 0.05 - g.alt * 0.000003);

      if (holding && g.fuel > 0) {
        g.thrust = Math.min(g.thrust + 0.008, 0.18);
        g.fuel = Math.max(0, g.fuel - 0.15);
        g.vel += g.thrust;
        g.shaking = true;
      } else {
        g.thrust *= 0.95;
        g.shaking = false;
      }

      g.vel -= gravity;
      g.alt += g.vel;

      if (g.alt < 0 && g.frame > 30) {
        setState("failed");
        return;
      }
      g.alt = Math.max(0, g.alt);

      // Stage progression
      if (g.stage < STAGES.length && g.alt >= STAGES[g.stage].targetAlt) {
        g.stage++;
        g.fuel = Math.min(100, g.fuel + 30);
        for (let i = 0; i < 15; i++) {
          g.particles.push({ x: W / 2, y: H * 0.6, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3, life: 30 + Math.random() * 20, color: STAGES[Math.min(g.stage - 1, 3)].color });
        }
      }

      if (g.stage >= STAGES.length) {
        const s = Math.floor(g.fuel * 10 + 500);
        setScore(s);
        if (s > hi) { setHi(s); localStorage.setItem("artemis-rocket-hs", s.toString()); }
        setState("orbit");
        return;
      }

      // Particles
      if (holding && g.fuel > 0 && g.frame % 2 === 0) {
        g.particles.push({ x: W / 2 + (Math.random() - 0.5) * 8, y: H * 0.6 + 20, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, life: 20, color: Math.random() > 0.5 ? "#ff6644" : "#ffaa00" });
      }
      g.particles = g.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });

      // Draw
      const shake = g.shaking ? (Math.random() - 0.5) * 2 : 0;
      ctx.save(); ctx.translate(shake, shake);

      // Sky gradient based on altitude
      const skyProgress = Math.min(1, g.alt / 6000);
      const r = Math.floor(10 * (1 - skyProgress));
      const gb = Math.floor(10 * (1 - skyProgress));
      ctx.fillStyle = `rgb(${r},${gb},${Math.floor(20 * (1 - skyProgress * 0.5))})`;
      ctx.fillRect(0, 0, W, H);

      // Stars (appear at altitude)
      if (skyProgress > 0.3) {
        ctx.fillStyle = `rgba(255,255,255,${(skyProgress - 0.3) * 0.8})`;
        for (let i = 0; i < 40; i++) ctx.fillRect((i * 83) % W, (i * 47 + g.frame * 0.1) % H, 1, 1);
      }

      // Ground (fades away)
      if (skyProgress < 0.8) {
        const groundY = H - 30 + skyProgress * 60;
        ctx.fillStyle = "#1a3320"; ctx.fillRect(0, groundY, W, H - groundY);
      }

      // Rocket
      const rocketY = H * 0.6;
      ctx.fillStyle = "#ddd"; ctx.fillRect(W / 2 - 6, rocketY - 20, 12, 30);
      ctx.fillStyle = "#ff4444"; ctx.beginPath(); ctx.moveTo(W / 2, rocketY - 28); ctx.lineTo(W / 2 - 6, rocketY - 20); ctx.lineTo(W / 2 + 6, rocketY - 20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#999"; ctx.fillRect(W / 2 - 10, rocketY + 5, 4, 8); ctx.fillRect(W / 2 + 6, rocketY + 5, 4, 8);

      // Particles
      for (const p of g.particles) {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
      ctx.globalAlpha = 1;

      // HUD
      ctx.fillStyle = "#00ff88"; ctx.font = "10px monospace";
      ctx.fillText(`ALT: ${Math.floor(g.alt)}m`, 8, 16);
      ctx.fillText(`VEL: ${g.vel.toFixed(1)}m/s`, 8, 28);
      ctx.fillText(`FUEL: ${Math.floor(g.fuel)}%`, W - 80, 16);
      if (g.stage < STAGES.length) {
        ctx.fillStyle = STAGES[g.stage].color;
        ctx.fillText(STAGES[g.stage].name, 8, H - 10);
        // Progress bar
        const prev = g.stage > 0 ? STAGES[g.stage - 1].targetAlt : 0;
        const prog = Math.min(1, (g.alt - prev) / (STAGES[g.stage].targetAlt - prev));
        ctx.fillStyle = "#333"; ctx.fillRect(8, H - 26, W - 16, 6);
        ctx.fillStyle = STAGES[g.stage].color; ctx.fillRect(8, H - 26, (W - 16) * prog, 6);
      }

      ctx.restore();
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
            <span className="text-primary font-futuristic text-sm font-bold tracking-wider mb-1">
              {state === "failed" ? "LAUNCH FAILED" : state === "orbit" ? "ORBIT ACHIEVED!" : "ROCKET LAUNCH"}
            </span>
            {state !== "menu" && <span className="text-muted-foreground text-xs font-mono mb-1">SCORE: {score}</span>}
            {hi > 0 && <span className="text-muted-foreground/50 text-[10px] font-mono mb-3">HI: {hi}</span>}
            <button onClick={start} className="glass-morphism border border-primary/40 text-primary hover:bg-primary/20 px-4 py-1.5 rounded-lg text-xs font-futuristic tracking-wider transition-all">{state === "menu" ? "START MISSION" : "RETRY"}</button>
            <span className="text-muted-foreground/40 text-[9px] font-mono mt-2">HOLD SPACE TO THRUST</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RocketLaunchGame;
