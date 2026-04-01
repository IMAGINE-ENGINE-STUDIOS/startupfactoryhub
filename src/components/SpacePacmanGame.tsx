import { useRef, useEffect, useState, useCallback } from "react";
import { useGameTouchControls } from "@/hooks/useGameTouchControls";

const W = 340, H = 400;
const TILE = 20;
const COLS = Math.floor(W / TILE);
const ROWS = Math.floor(H / TILE);
const PLAYER_SPEED = 1.8; // pixels per frame
const GHOST_SPEED = 1.4;

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
const DIRS: Dir[] = [
  { dx: 0, dy: -1 }, // up
  { dx: 1, dy: 0 },  // right
  { dx: 0, dy: 1 },  // down
  { dx: -1, dy: 0 }, // left
];

interface Ghost {
  x: number; y: number; dir: number; color: string;
  scared: boolean; scaredTimer: number;
  // Sub-pixel position for smooth movement
  px: number; py: number;
  moving: boolean;
  targetX: number; targetY: number;
}

interface GameState {
  map: number[][];
  // Player tile coords + sub-pixel
  tileX: number; tileY: number;
  px: number; py: number;
  pdir: number; nextDir: number;
  moving: boolean;
  targetX: number; targetY: number;
  mouthAngle: number; mouthDir: number;
  ghosts: Ghost[];
  keys: Record<string, boolean>;
  frame: number; score: number; totalDots: number;
}

const SpacePacmanGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"menu" | "playing" | "over" | "won">("menu");
  const [score, setScore] = useState(0);
  const [hi, setHi] = useState(() => parseInt(localStorage.getItem("artemis-pacman-hs") || "0"));
  const keysRef = useRef<Record<string, boolean>>({});
  const gRef = useRef<GameState | null>(null);

  const tileCenter = (t: number) => t * TILE + TILE / 2;

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

  const isWall = (map: number[][], tx: number, ty: number) => {
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return false; // allow wrap
    return map[ty]?.[tx] === 1;
  };

  const start = useCallback(() => {
    const { map, dots } = initMap();
    const g: GameState = {
      map,
      tileX: 1, tileY: 1,
      px: tileCenter(1), py: tileCenter(1),
      pdir: 1, nextDir: 1,
      moving: false,
      targetX: 1, targetY: 1,
      mouthAngle: 0, mouthDir: 1,
      ghosts: [
        { x: 7, y: 7, dir: 0, color: "#ff4444", scared: false, scaredTimer: 0, px: tileCenter(7), py: tileCenter(7), moving: false, targetX: 7, targetY: 7 },
        { x: 8, y: 7, dir: 2, color: "#ff88ff", scared: false, scaredTimer: 0, px: tileCenter(8), py: tileCenter(7), moving: false, targetX: 8, targetY: 7 },
        { x: 7, y: 8, dir: 1, color: "#44ccff", scared: false, scaredTimer: 0, px: tileCenter(7), py: tileCenter(8), moving: false, targetX: 7, targetY: 8 },
      ],
      keys: keysRef.current,
      frame: 0, score: 0, totalDots: dots,
    };
    gRef.current = g;
    setScore(0);
    setState("playing");
  }, [initMap]);

  useGameTouchControls({
    canvasRef,
    keys: gRef.current?.keys || {},
    enabled: state === "playing",
    mode: "4dir",
  });

  // Key listeners
  useEffect(() => {
    const keys = gRef.current?.keys || {};
    const kd = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d"].includes(e.key)) {
        e.preventDefault();
      }
    };
    const ku = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  useEffect(() => {
    if (state !== "playing") return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    let raf: number;
    let lastTime = performance.now();

    const getDesiredDir = (keys: Record<string, boolean>): number | null => {
      if (keys["ArrowUp"] || keys["w"]) return 0;
      if (keys["ArrowRight"] || keys["d"]) return 1;
      if (keys["ArrowDown"] || keys["s"]) return 2;
      if (keys["ArrowLeft"] || keys["a"]) return 3;
      return null;
    };

    const moveEntity = (
      ex: number, ey: number, etx: number, ety: number,
      dir: number, speed: number, moving: boolean
    ): { px: number; py: number; arrived: boolean } => {
      const destPx = tileCenter(etx);
      const destPy = tileCenter(ety);
      const dx = destPx - ex;
      const dy = destPy - ey;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= speed) {
        return { px: destPx, py: destPy, arrived: true };
      }
      return {
        px: ex + (dx / dist) * speed,
        py: ey + (dy / dist) * speed,
        arrived: false,
      };
    };

    const loop = (now: number) => {
      const g = gRef.current;
      if (!g) return;

      const delta = Math.min(now - lastTime, 33); // cap at ~30fps min
      lastTime = now;
      const steps = Math.max(1, Math.round(delta / 16.67)); // normalize to ~60fps

      for (let step = 0; step < steps; step++) {
        g.frame++;

        // Mouth animation
        g.mouthAngle += 0.15 * g.mouthDir;
        if (g.mouthAngle > 0.35) g.mouthDir = -1;
        if (g.mouthAngle < 0.02) g.mouthDir = 1;

        // Read desired direction from keys
        const desired = getDesiredDir(g.keys);
        if (desired !== null) g.nextDir = desired;

        // Player movement - smooth sub-pixel
        if (!g.moving || (g.px === tileCenter(g.targetX) && g.py === tileCenter(g.targetY))) {
          // Arrived at tile center, decide next move
          g.tileX = g.targetX;
          g.tileY = g.targetY;
          g.px = tileCenter(g.tileX);
          g.py = tileCenter(g.tileY);
          g.moving = false;

          // Eat dot at current tile
          const cell = g.map[g.tileY]?.[g.tileX];
          if (cell === 0) {
            g.map[g.tileY][g.tileX] = 2;
            g.score += 10;
            g.totalDots--;
            setScore(g.score);
          } else if (cell === 3) {
            g.map[g.tileY][g.tileX] = 2;
            g.score += 50;
            g.totalDots--;
            setScore(g.score);
            g.ghosts.forEach(gh => { gh.scared = true; gh.scaredTimer = 300; });
          }

          if (g.totalDots <= 0) {
            if (g.score > hi) { setHi(g.score); localStorage.setItem("artemis-pacman-hs", g.score.toString()); }
            setState("won");
            return;
          }

          // Try desired direction first, then current direction
          const tryDirs = g.nextDir !== g.pdir ? [g.nextDir, g.pdir] : [g.pdir];
          for (const d of tryDirs) {
            const nx = g.tileX + DIRS[d].dx;
            const ny = g.tileY + DIRS[d].dy;
            // Wrap
            const wrappedX = nx < 0 ? COLS - 1 : nx >= COLS ? 0 : nx;
            const wrappedY = ny < 0 ? ROWS - 1 : ny >= ROWS ? 0 : ny;
            if (!isWall(g.map, wrappedX, wrappedY)) {
              g.pdir = d;
              g.targetX = wrappedX;
              g.targetY = wrappedY;
              g.moving = true;
              break;
            }
          }
        }

        if (g.moving) {
          const result = moveEntity(g.px, g.py, g.targetX, g.targetY, g.pdir, PLAYER_SPEED, g.moving);
          g.px = result.px;
          g.py = result.py;
          if (result.arrived) {
            g.tileX = g.targetX;
            g.tileY = g.targetY;
            g.moving = false;
          }
        }

        // Ghost movement - smooth and independent
        for (const gh of g.ghosts) {
          if (gh.scared) { gh.scaredTimer--; if (gh.scaredTimer <= 0) gh.scared = false; }

          if (!gh.moving || (gh.px === tileCenter(gh.targetX) && gh.py === tileCenter(gh.targetY))) {
            gh.x = gh.targetX;
            gh.y = gh.targetY;
            gh.px = tileCenter(gh.x);
            gh.py = tileCenter(gh.y);
            gh.moving = false;

            // Pick direction
            const opposite = (gh.dir + 2) % 4;
            const possible = [0, 1, 2, 3].filter(d => {
              if (d === opposite) return false; // avoid 180
              const nx = gh.x + DIRS[d].dx;
              const ny = gh.y + DIRS[d].dy;
              const wx = nx < 0 ? COLS - 1 : nx >= COLS ? 0 : nx;
              const wy = ny < 0 ? ROWS - 1 : ny >= ROWS ? 0 : ny;
              return !isWall(g.map, wx, wy);
            });

            // If no options without 180, allow it
            const choices = possible.length > 0 ? possible : [0, 1, 2, 3].filter(d => {
              const nx = gh.x + DIRS[d].dx;
              const ny = gh.y + DIRS[d].dy;
              const wx = nx < 0 ? COLS - 1 : nx >= COLS ? 0 : nx;
              const wy = ny < 0 ? ROWS - 1 : ny >= ROWS ? 0 : ny;
              return !isWall(g.map, wx, wy);
            });

            if (choices.length > 0) {
              // 60% chase/flee, 40% random
              if (Math.random() < 0.6) {
                choices.sort((a, b) => {
                  const ax = gh.x + DIRS[a].dx, ay = gh.y + DIRS[a].dy;
                  const bx = gh.x + DIRS[b].dx, by = gh.y + DIRS[b].dy;
                  const da = Math.abs(ax - g.tileX) + Math.abs(ay - g.tileY);
                  const db = Math.abs(bx - g.tileX) + Math.abs(by - g.tileY);
                  return gh.scared ? db - da : da - db;
                });
              } else {
                for (let i = choices.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [choices[i], choices[j]] = [choices[j], choices[i]];
                }
              }
              gh.dir = choices[0];
              const nx = gh.x + DIRS[gh.dir].dx;
              const ny = gh.y + DIRS[gh.dir].dy;
              gh.targetX = nx < 0 ? COLS - 1 : nx >= COLS ? 0 : nx;
              gh.targetY = ny < 0 ? ROWS - 1 : ny >= ROWS ? 0 : ny;
              gh.moving = true;
            }
          }

          if (gh.moving) {
            const spd = gh.scared ? GHOST_SPEED * 0.6 : GHOST_SPEED;
            const result = moveEntity(gh.px, gh.py, gh.targetX, gh.targetY, gh.dir, spd, gh.moving);
            gh.px = result.px;
            gh.py = result.py;
            if (result.arrived) {
              gh.x = gh.targetX;
              gh.y = gh.targetY;
              gh.moving = false;
            }
          }

          // Collision check (pixel proximity)
          const dx = gh.px - g.px;
          const dy = gh.py - g.py;
          if (dx * dx + dy * dy < (TILE * 0.6) * (TILE * 0.6)) {
            if (gh.scared) {
              gh.x = 7; gh.y = 7;
              gh.px = tileCenter(7); gh.py = tileCenter(7);
              gh.targetX = 7; gh.targetY = 7;
              gh.scared = false; gh.moving = false;
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

      // ---- DRAW ----
      ctx.fillStyle = "#050510";
      ctx.fillRect(0, 0, W, H);

      // Faint stars
      ctx.fillStyle = "rgba(100,150,255,0.08)";
      for (let i = 0; i < 30; i++) {
        ctx.fillRect((i * 97) % W, (i * 53 + g.frame * 0.02) % H, 1, 1);
      }

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

      // Player
      const angle = [Math.PI * 1.5, 0, Math.PI * 0.5, Math.PI][g.pdir];
      const mouth = g.mouthAngle;
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.arc(g.px, g.py, TILE / 2 - 2, angle + mouth, angle + Math.PI * 2 - mouth);
      ctx.lineTo(g.px, g.py);
      ctx.closePath();
      ctx.fill();
      // Eye
      ctx.fillStyle = "#00aa55";
      const eyeX = g.px + Math.cos(angle) * 3;
      const eyeY = g.py + Math.sin(angle) * 3;
      ctx.beginPath();
      ctx.arc(eyeX - Math.sin(angle) * 2, eyeY + Math.cos(angle) * 2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Ghosts
      for (const gh of g.ghosts) {
        ctx.fillStyle = gh.scared
          ? (gh.scaredTimer < 60 && g.frame % 10 < 5 ? "#ffffff" : "#4444ff")
          : gh.color;
        ctx.beginPath();
        ctx.arc(gh.px, gh.py - 2, TILE / 2 - 2, Math.PI, 0);
        ctx.lineTo(gh.px + TILE / 2 - 2, gh.py + TILE / 2 - 4);
        for (let i = 0; i < 3; i++) {
          const waveX = gh.px + TILE / 2 - 2 - (i + 1) * ((TILE - 4) / 3);
          ctx.lineTo(waveX + (TILE - 4) / 6, gh.py + TILE / 2 - 7);
          ctx.lineTo(waveX, gh.py + TILE / 2 - 4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(gh.px - 3, gh.py - 3, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(gh.px + 3, gh.py - 3, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = gh.scared ? "#fff" : "#111";
        ctx.beginPath(); ctx.arc(gh.px - 3, gh.py - 3, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(gh.px + 3, gh.py - 3, 1, 0, Math.PI * 2); ctx.fill();
      }

      // HUD
      ctx.fillStyle = "#00ff88";
      ctx.font = "10px monospace";
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
            <button onClick={start} className="glass-morphism border border-primary/40 text-primary hover:bg-primary/20 px-4 py-1.5 rounded-lg text-xs font-futuristic tracking-wider transition-all">
              {state === "menu" ? "START MISSION" : "RETRY"}
            </button>
            <span className="text-muted-foreground/40 text-[9px] font-mono mt-2">← → ↑ ↓ MOVE</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpacePacmanGame;
