import { useRef, useEffect, useState, useCallback } from "react";
import { useGameTouchControls } from "@/hooks/useGameTouchControls";

interface Entity {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Bullet extends Entity {
  dy: number;
}

interface Invader extends Entity {
  alive: boolean;
}

const CANVAS_W = 340;
const CANVAS_H = 400;
const PLAYER_W = 30;
const PLAYER_H = 16;
const BULLET_W = 3;
const BULLET_H = 10;
const INV_W = 22;
const INV_H = 16;
const INV_COLS = 8;
const INV_ROWS = 4;
const INV_PAD = 6;

const SpaceInvadersGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "over" | "won">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const s = localStorage.getItem("artemis-invaders-hs");
    return s ? parseInt(s) : 0;
  });

  const gameRef = useRef({
    player: { x: CANVAS_W / 2 - PLAYER_W / 2, y: CANVAS_H - 30, w: PLAYER_W, h: PLAYER_H },
    bullets: [] as Bullet[],
    enemyBullets: [] as Bullet[],
    invaders: [] as Invader[],
    invDir: 1,
    invSpeed: 0.2,
    keys: {} as Record<string, boolean>,
    lastShot: 0,
    frame: 0,
    score: 0,
    lives: 3,
  });

  const initInvaders = useCallback(() => {
    const invaders: Invader[] = [];
    const startX = (CANVAS_W - (INV_COLS * (INV_W + INV_PAD) - INV_PAD)) / 2;
    for (let r = 0; r < INV_ROWS; r++) {
      for (let c = 0; c < INV_COLS; c++) {
        invaders.push({
          x: startX + c * (INV_W + INV_PAD),
          y: 30 + r * (INV_H + INV_PAD),
          w: INV_W,
          h: INV_H,
          alive: true,
        });
      }
    }
    return invaders;
  }, []);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.player.x = CANVAS_W / 2 - PLAYER_W / 2;
    g.bullets = [];
    g.enemyBullets = [];
    g.invaders = initInvaders();
    g.invDir = 1;
    g.invSpeed = 0.2;
    g.lastShot = 0;
    g.frame = 0;
    g.score = 0;
    g.lives = 3;
    setScore(0);
    setGameState("playing");
  }, [initInvaders]);

  useGameTouchControls({
    canvasRef,
    keys: gameRef.current.keys,
    enabled: gameState === "playing",
    mode: "horizontal-shoot",
  });

  // Input handling
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      gameRef.current.keys[e.key] = true;
      if (["ArrowLeft", "ArrowRight", " ", "ArrowUp"].includes(e.key)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keys[e.key] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const collides = (a: Entity, b: Entity) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    const loop = () => {
      const g = gameRef.current;
      g.frame++;

      // Player movement
      if (g.keys["ArrowLeft"] || g.keys["a"]) g.player.x = Math.max(0, g.player.x - 1.5);
      if (g.keys["ArrowRight"] || g.keys["d"]) g.player.x = Math.min(CANVAS_W - PLAYER_W, g.player.x + 1.5);

      // Shoot
      if ((g.keys[" "] || g.keys["ArrowUp"]) && g.frame - g.lastShot > 15) {
        g.bullets.push({ x: g.player.x + PLAYER_W / 2 - BULLET_W / 2, y: g.player.y - BULLET_H, w: BULLET_W, h: BULLET_H, dy: -2.5 });
        g.lastShot = g.frame;
      }

      // Update bullets
      g.bullets = g.bullets.filter((b) => {
        b.y += b.dy;
        return b.y > -BULLET_H;
      });

      // Enemy bullets
      g.enemyBullets = g.enemyBullets.filter((b) => {
        b.y += b.dy;
        return b.y < CANVAS_H + 10;
      });

      // Invader movement
      const aliveInvaders = g.invaders.filter((i) => i.alive);
      if (aliveInvaders.length === 0) {
        setGameState("won");
        return;
      }

      let edgeHit = false;
      for (const inv of aliveInvaders) {
        inv.x += g.invSpeed * g.invDir;
        if (inv.x <= 0 || inv.x + inv.w >= CANVAS_W) edgeHit = true;
      }
      if (edgeHit) {
        g.invDir *= -1;
        for (const inv of aliveInvaders) {
          inv.y += 10;
          if (inv.y + inv.h >= g.player.y) {
            setGameState("over");
            if (g.score > highScore) {
              setHighScore(g.score);
              localStorage.setItem("artemis-invaders-hs", g.score.toString());
            }
            return;
          }
        }
        g.invSpeed += 0.05;
      }

      // Enemy shooting
      if (g.frame % 60 === 0 && aliveInvaders.length > 0) {
        const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
        g.enemyBullets.push({ x: shooter.x + INV_W / 2, y: shooter.y + INV_H, w: BULLET_W, h: BULLET_H, dy: 1.25 });
      }

      // Bullet-invader collision
      for (const bullet of g.bullets) {
        for (const inv of g.invaders) {
          if (inv.alive && collides(bullet, inv)) {
            inv.alive = false;
            bullet.y = -100;
            g.score += 10;
            setScore(g.score);
          }
        }
      }

      // Enemy bullet-player collision
      for (const eb of g.enemyBullets) {
        if (collides(eb, g.player)) {
          eb.y = CANVAS_H + 100;
          g.lives--;
          if (g.lives <= 0) {
            setGameState("over");
            if (g.score > highScore) {
              setHighScore(g.score);
              localStorage.setItem("artemis-invaders-hs", g.score.toString());
            }
            return;
          }
        }
      }

      // Draw
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Stars
      ctx.fillStyle = "rgba(100, 255, 150, 0.15)";
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97 + g.frame * 0.02) % CANVAS_W;
        const sy = (i * 53 + g.frame * 0.01) % CANVAS_H;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // Player (spaceship shape)
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.moveTo(g.player.x + PLAYER_W / 2, g.player.y);
      ctx.lineTo(g.player.x, g.player.y + PLAYER_H);
      ctx.lineTo(g.player.x + PLAYER_W, g.player.y + PLAYER_H);
      ctx.closePath();
      ctx.fill();

      // Engine glow
      ctx.fillStyle = "rgba(0, 255, 136, 0.3)";
      ctx.fillRect(g.player.x + PLAYER_W / 2 - 3, g.player.y + PLAYER_H, 6, 4 + Math.random() * 4);

      // Bullets
      ctx.fillStyle = "#00ff88";
      for (const b of g.bullets) ctx.fillRect(b.x, b.y, b.w, b.h);

      // Enemy bullets
      ctx.fillStyle = "#ff4444";
      for (const b of g.enemyBullets) ctx.fillRect(b.x, b.y, b.w, b.h);

      // Invaders
      for (const inv of g.invaders) {
        if (!inv.alive) continue;
        ctx.fillStyle = "#ff6644";
        ctx.fillRect(inv.x + 2, inv.y + 2, inv.w - 4, inv.h - 6);
        // "eyes"
        ctx.fillStyle = "#ffaa00";
        ctx.fillRect(inv.x + 5, inv.y + 5, 3, 3);
        ctx.fillRect(inv.x + inv.w - 8, inv.y + 5, 3, 3);
        // "legs"
        ctx.fillStyle = "#ff6644";
        ctx.fillRect(inv.x, inv.y + inv.h - 5, 4, 5);
        ctx.fillRect(inv.x + inv.w - 4, inv.y + inv.h - 5, 4, 5);
      }

      // HUD
      ctx.fillStyle = "#00ff88";
      ctx.font = "10px monospace";
      ctx.fillText(`SCORE: ${g.score}`, 8, 16);
      ctx.fillText(`LIVES: ${"▲".repeat(g.lives)}`, CANVAS_W - 80, 16);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameState, highScore]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="rounded-lg border border-primary/20"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Menu / Game Over overlay */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg backdrop-blur-sm">
            <span className="text-primary font-futuristic text-sm font-bold tracking-wider mb-1">
              {gameState === "over" ? "MISSION FAILED" : gameState === "won" ? "MISSION COMPLETE" : "SPACE INVADERS"}
            </span>
            {gameState !== "menu" && (
              <span className="text-muted-foreground text-xs font-mono mb-1">SCORE: {score}</span>
            )}
            {highScore > 0 && (
              <span className="text-muted-foreground/50 text-[10px] font-mono mb-3">HI: {highScore}</span>
            )}
            <button
              onClick={startGame}
              className="glass-morphism border border-primary/40 text-primary hover:bg-primary/20 px-4 py-1.5 rounded-lg text-xs font-futuristic tracking-wider transition-all"
            >
              {gameState === "menu" ? "START MISSION" : "RETRY"}
            </button>
            <span className="text-muted-foreground/40 text-[9px] font-mono mt-2">
              ← → MOVE &nbsp; SPACE SHOOT
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceInvadersGame;
