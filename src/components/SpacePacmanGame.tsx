import { useRef, useEffect, useState, useCallback } from "react";
import { useGameTouchControls } from "@/hooks/useGameTouchControls";

const W = 340, H = 400;
const TILE = 20;
const COLS = Math.floor(W / TILE);
const ROWS = Math.floor(H / TILE);

// 1 = wall, 0 = dot, 2 = empty, 3 = power pellet
const BASE_MAP = [
  "1111111111111111",
  "1000000110000001",
  "1011010110101101",
  "1300000000000031",
  "1011011111011101",
  "1000010000100001",
  "1110110110110111",
  "0000010000100000",
  "1110110110110111",
  "1000000000000001",
  "1011011111011101",
  "1000010000100001",
  "1011010110101101",
  "1300000110000031",
  "1011010000101101",
  "1000000110000001",
  "1011011111011101",
  "1000000000000001",
  "1111111111111111",
  "0000000000000000",
];

type Dir = { dx: number; dy: number };
const DIRS: Dir[] = [{ dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }];

interface Ghost {
  x: number; y: number; dir: number; color: string; scared: boolean; scaredTimer: number;
}

const SpacePacmanGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"menu" | "playing" | "over" | "won">("menu");
  const [score, setScore] = useState(0);
  const [hi, setHi] = useState(() => parseInt(localStorage.getItem("artemis-pacman-hs") || "0"));

  const gRef = useRef({
    map: [] as number[][],
    px: 1, py: 1, pdir: 1, nextDir: 1,
    mouthOpen: true, mouthTimer: 0,
    ghosts: [] as Ghost[],
    keys: {} as Record<string, boolean>,
    frame: 0, score: 0, totalDots: 0,
    moveTimer: 0,
  });

  const initMap = useCallback(() => {
    const map: number[][] = [];
    let dots = 0;
    for (let r = 0; r < ROWS; r++) {
      const row: number[] = [];
      for (let c = 0; c < COLS; c++) {
        if (r < BASE_MAP.length && c < BASE_MAP[r].length) {
          const v = parseInt(BASE_MAP[r][c]);
          row.push(v);
          if (v === 0 || v === 3) dots++;
        } else {
          row.push(2);
        }
      }
      map.push(row);
    }
    return { map, dots };
  }, []);

  const start = useCallback(() => {
    const g = gRef.current;
    const { map, dots } = initMap();
    g.map = map;
    g.totalDots = dots;
    g.px = 1; g.py = 1; g.pdir = 1; g.nextDir = 1;
    g.mouthOpen = true; g.mouthTimer = 0;
    g.frame = 0; g.score = 0; g.moveTimer = 0;
    g.ghosts = [
      { x: 7, y: 7, dir: 0, color: "#ff4444", scared: false, scaredTimer: 0 },
      { x: 8, y: 7, dir: 2, color: "#ff88ff", scared: false, scaredTimer: 0 },
      { x: 7, y: 8, dir: 1, color: "#44ccff", scared: false, scaredTimer: 0 },
    ];
    setScore(0);
    setState("playing");
  }, [initMap]);

  useGameTouchControls({
    canvasRef,
    keys: gRef.current.keys,
    enabled: state === "playing",
    mode: "4dir",
  });

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      gRef.current.keys[e.key] = true;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        const g = gRef.current;
        if (e.key === "ArrowUp" || e.key === "w") g.nextDir = 0;
        if (e.key === "ArrowRight" || e.key === "d") g.nextDir = 1;
        if (e.key === "ArrowDown" || e.key === "s") g.nextDir = 2;
        if (e.key === "ArrowLeft" || e.key === "a") g.nextDir = 3;
      }
    };
    const ku = (e: KeyboardEvent) => { gRef.current.keys[e.key] = false; };
    if (gRef.current.keys["w"]) gRef.current.nextDir = 0;
    if (gRef.current.keys["d"]) gRef.current.nextDir = 1;
    if (gRef.current.keys["s"]) gRef.current.nextDir = 2;
    if (gRef.current.keys["a"]) gRef.current.nextDir = 3;
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  useEffect(() => {
    if (state !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf: number;

    const canMove = (x: number, y: number, dir: number) => {
      const nx = x + DIRS[dir].dx;
      const ny = y + DIRS[dir].dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
      return gRef.current.map[ny][nx] !== 1;
    };

    const loop = () => {
      const g = gRef.current;
      g.frame++;
      g.mouthTimer++;
      if (g.mouthTimer % 8 === 0) g.mouthOpen = !g.mouthOpen;

      // Move player every 6 frames
      if (g.frame % 6 === 0) {
        if (canMove(g.px, g.py, g.nextDir)) g.pdir = g.nextDir;
        if (canMove(g.px, g.py, g.pdir)) {
          g.px += DIRS[g.pdir].dx;
          g.py += DIRS[g.pdir].dy;
          if (g.px < 0) g.px = COLS - 1;
          if (g.px >= COLS) g.px = 0;
        }

        // Eat dot
        if (g.map[g.py][g.px] === 0) {
          g.map[g.py][g.px] = 2;
          g.score += 10;
          g.totalDots--;
          setScore(g.score);
        } else if (g.map[g.py][g.px] === 3) {
          g.map[g.py][g.px] = 2;
          g.score += 50;
          g.totalDots--;
          setScore(g.score);
          g.ghosts.forEach(gh => { gh.scared = true; gh.scaredTimer = 120; });
        }

        if (g.totalDots <= 0) {
          if (g.score > hi) { setHi(g.score); localStorage.setItem("artemis-pacman-hs", g.score.toString()); }
          setState("won");
          return;
        }
      }

      // Move ghosts every 8 frames (independent of player)
      if (g.frame % 8 === 0) {
        for (const gh of g.ghosts) {
          if (gh.scared) { gh.scaredTimer--; if (gh.scaredTimer <= 0) gh.scared = false; }
          const possible = [0, 1, 2, 3].filter(d => canMove(gh.x, gh.y, d));
          if (possible.length > 0) {
            // Prefer moving toward player if not scared, away if scared
            if (Math.random() < 0.7) {
              possible.sort((a, b) => {
                const ax = gh.x + DIRS[a].dx, ay = gh.y + DIRS[a].dy;
                const bx = gh.x + DIRS[b].dx, by = gh.y + DIRS[b].dy;
                const da = Math.abs(ax - g.px) + Math.abs(ay - g.py);
                const db = Math.abs(bx - g.px) + Math.abs(by - g.py);
                return gh.scared ? db - da : da - db;
              });
            } else {
              // Random shuffle for unpredictability
              for (let i = possible.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [possible[i], possible[j]] = [possible[j], possible[i]];
              }
            }
            gh.dir = possible[0];
            gh.x += DIRS[gh.dir].dx;
            gh.y += DIRS[gh.dir].dy;
            if (gh.x < 0) gh.x = COLS - 1;
            if (gh.x >= COLS) gh.x = 0;
          }

          // Check collision
          if (gh.x === g.px && gh.y === g.py) {
            if (gh.scared) {
              gh.x = 7; gh.y = 7; gh.scared = false;
              g.score += 200;
              setScore(g.score);
            } else {
              if (g.score > hi) { setHi(g.score); localStorage.setItem("artemis-pacman-hs", g.score.toString()); }
              setState("over");
              return;
            }
          }
        }
      }

      // Also check ghost-player collision every frame (in case player walks into ghost)
      for (const gh of g.ghosts) {
        if (gh.x === g.px && gh.y === g.py) {
          if (gh.scared) {
            gh.x = 7; gh.y = 7; gh.scared = false;
            g.score += 200;
            setScore(g.score);
          } else {
            if (g.score > hi) { setHi(g.score); localStorage.setItem("artemis-pacman-hs", g.score.toString()); }
            setState("over");
            return;
          }
        }
      }

      // Draw
      ctx.fillStyle = "#050510"; ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = "rgba(100,150,255,0.08)";
      for (let i = 0; i < 30; i++) ctx.fillRect((i * 97) % W, (i * 53 + g.frame * 0.02) % H, 1, 1);

      // Map
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const v = g.map[r]?.[c];
          if (v === 1) {
            ctx.fillStyle = "#1a1a4a";
            ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
            ctx.strokeStyle = "#3344aa";
            ctx.strokeRect(c * TILE + 0.5, r * TILE + 0.5, TILE - 1, TILE - 1);
          } else if (v === 0) {
            ctx.fillStyle = "#00ff88";
            ctx.beginPath();
            ctx.arc(c * TILE + TILE / 2, r * TILE + TILE / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (v === 3) {
            ctx.fillStyle = "#00ffcc";
            ctx.beginPath();
            ctx.arc(c * TILE + TILE / 2, r * TILE + TILE / 2, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Player (space pac-man)
      const px = g.px * TILE + TILE / 2;
      const py = g.py * TILE + TILE / 2;
      const angle = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI][g.pdir];
      const mouth = g.mouthOpen ? 0.3 : 0.05;
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.arc(px, py, TILE / 2 - 2, angle + mouth, angle + Math.PI * 2 - mouth);
      ctx.lineTo(px, py);
      ctx.closePath();
      ctx.fill();
      // Visor
      ctx.fillStyle = "#00aa55";
      const eyeX = px + Math.cos(angle) * 3;
      const eyeY = py + Math.sin(angle) * 3;
      ctx.beginPath(); ctx.arc(eyeX - Math.sin(angle) * 2, eyeY + Math.cos(angle) * 2, 2, 0, Math.PI * 2); ctx.fill();

      // Ghosts (space alien style)
      for (const gh of g.ghosts) {
        const gx = gh.x * TILE + TILE / 2;
        const gy = gh.y * TILE + TILE / 2;
        ctx.fillStyle = gh.scared ? (gh.scaredTimer < 30 && g.frame % 10 < 5 ? "#ffffff" : "#4444ff") : gh.color;
        // Body
        ctx.beginPath();
        ctx.arc(gx, gy - 2, TILE / 2 - 2, Math.PI, 0);
        ctx.lineTo(gx + TILE / 2 - 2, gy + TILE / 2 - 4);
        for (let i = 0; i < 3; i++) {
          const waveX = gx + TILE / 2 - 2 - (i + 1) * ((TILE - 4) / 3);
          ctx.lineTo(waveX + (TILE - 4) / 6, gy + TILE / 2 - 7);
          ctx.lineTo(waveX, gy + TILE / 2 - 4);
        }
        ctx.closePath(); ctx.fill();
        // Eyes
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(gx - 3, gy - 3, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + 3, gy - 3, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = gh.scared ? "#fff" : "#111";
        ctx.beginPath(); ctx.arc(gx - 3, gy - 3, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + 3, gy - 3, 1, 0, Math.PI * 2); ctx.fill();
      }

      // HUD
      ctx.fillStyle = "#00ff88"; ctx.font = "10px monospace";
      ctx.fillText(`SCORE: ${g.score}`, 8, H - 6);

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
              {state === "over" ? "GAME OVER" : state === "won" ? "SECTOR CLEARED!" : "SPACE PAC-MAN"}
            </span>
            {state !== "menu" && <span className="text-muted-foreground text-xs font-mono mb-1">SCORE: {score}</span>}
            {hi > 0 && <span className="text-muted-foreground/50 text-[10px] font-mono mb-3">HI: {hi}</span>}
            <button onClick={start} className="glass-morphism border border-primary/40 text-primary hover:bg-primary/20 px-4 py-1.5 rounded-lg text-xs font-futuristic tracking-wider transition-all">{state === "menu" ? "START MISSION" : "RETRY"}</button>
            <span className="text-muted-foreground/40 text-[9px] font-mono mt-2">← → ↑ ↓ MOVE</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpacePacmanGame;
