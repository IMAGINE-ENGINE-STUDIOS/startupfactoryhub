import { useEffect, useRef, useState, useCallback } from "react";
import { useGameTouchControls } from "@/hooks/useGameTouchControls";

const COLS = 10;
const ROWS = 20;
const CELL = 17;
const W = COLS * CELL;
const H = ROWS * CELL;

const PIECES = [
  { shape: [[1,1,1,1]], color: "#00e5ff" },         // I
  { shape: [[1,1],[1,1]], color: "#ffc107" },        // O
  { shape: [[0,1,0],[1,1,1]], color: "#ab47bc" },    // T
  { shape: [[0,1,1],[1,1,0]], color: "#66bb6a" },    // S
  { shape: [[1,1,0],[0,1,1]], color: "#ef5350" },    // Z
  { shape: [[1,0,0],[1,1,1]], color: "#42a5f5" },    // J
  { shape: [[0,0,1],[1,1,1]], color: "#ff9800" },    // L
];

type Piece = { shape: number[][]; color: string; x: number; y: number };

const rotate = (shape: number[][]): number[][] => {
  const rows = shape.length, cols = shape[0].length;
  const r: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      r[x][rows - 1 - y] = shape[y][x];
  return r;
};

const SpaceTetrisGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu");
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [hiscore, setHiscore] = useState(() => Number(localStorage.getItem("artemis-tetris-hs") || "0"));
  const keys = useRef<Record<string, boolean>>({}).current;
  const stateRef = useRef<{
    board: (string | null)[][];
    piece: Piece | null;
    next: Piece | null;
    score: number;
    lines: number;
    dropTimer: number;
    speed: number;
    lastKeys: Record<string, boolean>;
  }>({
    board: [],
    piece: null,
    next: null,
    score: 0,
    lines: 0,
    dropTimer: 0,
    speed: 500,
    lastKeys: {},
  });

  useGameTouchControls({ canvasRef, keys, enabled: phase === "playing", mode: "4dir" });

  const newBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  const randomPiece = (): Piece => {
    const p = PIECES[Math.floor(Math.random() * PIECES.length)];
    return { shape: p.shape, color: p.color, x: Math.floor((COLS - p.shape[0].length) / 2), y: 0 };
  };

  const collides = (board: (string | null)[][], piece: Piece, dx = 0, dy = 0, shape?: number[][]) => {
    const s = shape || piece.shape;
    for (let y = 0; y < s.length; y++)
      for (let x = 0; x < s[0].length; x++)
        if (s[y][x]) {
          const nx = piece.x + x + dx, ny = piece.y + y + dy;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
    return false;
  };

  const merge = (board: (string | null)[][], piece: Piece) => {
    const b = board.map(r => [...r]);
    for (let y = 0; y < piece.shape.length; y++)
      for (let x = 0; x < piece.shape[0].length; x++)
        if (piece.shape[y][x] && piece.y + y >= 0)
          b[piece.y + y][piece.x + x] = piece.color;
    return b;
  };

  const clearLines = (board: (string | null)[][]) => {
    const kept = board.filter(r => r.some(c => !c));
    const cleared = ROWS - kept.length;
    while (kept.length < ROWS) kept.unshift(Array(COLS).fill(null));
    return { board: kept, cleared };
  };

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.board = newBoard();
    s.piece = randomPiece();
    s.next = randomPiece();
    s.score = 0;
    s.lines = 0;
    s.dropTimer = 0;
    s.speed = 500;
    s.lastKeys = {};
    setScore(0);
    setLines(0);
    setPhase("playing");
  }, []);

  // Key listeners
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys[e.key] = true; if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault(); };
    const up = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Stars
  const starsRef = useRef(Array.from({ length: 30 }, () => ({
    x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.5 + 0.5, b: Math.random(),
  })));

  // Game loop
  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      const s = stateRef.current;
      if (!s.piece) { raf = requestAnimationFrame(loop); return; }

      // Input
      const pressed = (k: string) => keys[k] && !s.lastKeys[k];

      if (pressed("ArrowLeft") && !collides(s.board, s.piece, -1, 0)) s.piece.x--;
      if (pressed("ArrowRight") && !collides(s.board, s.piece, 1, 0)) s.piece.x++;
      if (pressed("ArrowUp")) {
        const rotated = rotate(s.piece.shape);
        if (!collides(s.board, s.piece, 0, 0, rotated)) s.piece.shape = rotated;
      }
      if (keys["ArrowDown"]) {
        if (!collides(s.board, s.piece, 0, 1)) { s.piece.y++; s.dropTimer = 0; }
      }
      if (pressed(" ")) {
        while (!collides(s.board, s.piece, 0, 1)) s.piece.y++;
        s.dropTimer = s.speed;
      }

      s.lastKeys = { ...keys };

      // Drop
      s.dropTimer += dt;
      if (s.dropTimer >= s.speed) {
        s.dropTimer = 0;
        if (!collides(s.board, s.piece, 0, 1)) {
          s.piece.y++;
        } else {
          // Lock
          s.board = merge(s.board, s.piece);
          const { board: nb, cleared } = clearLines(s.board);
          s.board = nb;
          if (cleared > 0) {
            const pts = [0, 100, 300, 500, 800][cleared] || 800;
            s.score += pts;
            s.lines += cleared;
            s.speed = Math.max(80, 500 - Math.floor(s.lines / 10) * 40);
            setScore(s.score);
            setLines(s.lines);
          }
          s.piece = s.next;
          s.next = randomPiece();
          if (collides(s.board, s.piece!)) {
            // Game over
            if (s.score > Number(localStorage.getItem("artemis-tetris-hs") || "0")) {
              localStorage.setItem("artemis-tetris-hs", String(s.score));
              setHiscore(s.score);
            }
            setScore(s.score);
            setPhase("over");
            return;
          }
        }
      }

      // Draw
      ctx.fillStyle = "#05050a";
      ctx.fillRect(0, 0, W, H);

      // Stars
      starsRef.current.forEach(st => {
        ctx.globalAlpha = 0.3 + Math.sin(now / 1000 + st.b * 10) * 0.2;
        ctx.fillStyle = "#fff";
        ctx.fillRect(st.x, st.y, st.s, st.s);
      });
      ctx.globalAlpha = 1;

      // Grid
      ctx.strokeStyle = "#ffffff08";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke(); }
      for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke(); }

      // Board
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++)
          if (s.board[y][x]) {
            ctx.fillStyle = s.board[y][x]!;
            ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
            ctx.strokeStyle = "#ffffff22";
            ctx.lineWidth = 1;
            ctx.strokeRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
          }

      // Current piece
      if (s.piece) {
        for (let y = 0; y < s.piece.shape.length; y++)
          for (let x = 0; x < s.piece.shape[0].length; x++)
            if (s.piece.shape[y][x]) {
              const px = (s.piece.x + x) * CELL, py = (s.piece.y + y) * CELL;
              ctx.fillStyle = s.piece.color;
              ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
              ctx.shadowColor = s.piece.color;
              ctx.shadowBlur = 6;
              ctx.strokeStyle = s.piece.color;
              ctx.lineWidth = 1;
              ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
              ctx.shadowBlur = 0;
            }
      }

      // Next piece preview
      if (s.next) {
        ctx.fillStyle = "#ffffff11";
        ctx.fillRect(W - 50, 4, 46, 36);
        ctx.fillStyle = "#ffffff44";
        ctx.font = "7px monospace";
        ctx.fillText("NEXT", W - 46, 12);
        for (let y = 0; y < s.next.shape.length; y++)
          for (let x = 0; x < s.next.shape[0].length; x++)
            if (s.next.shape[y][x]) {
              ctx.fillStyle = s.next.color;
              ctx.fillRect(W - 44 + x * 9, 16 + y * 9, 8, 8);
            }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <div className="relative flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-lg border border-primary/20 bg-black w-full"
        style={{ maxWidth: W, imageRendering: "pixelated" }}
      />
      {/* Score bar */}
      <div className="flex gap-4 mt-2 text-[10px] font-futuristic text-muted-foreground">
        <span>SCORE: <span className="text-primary">{score}</span></span>
        <span>LINES: <span className="text-primary">{lines}</span></span>
        <span>HI: <span className="text-primary">{hiscore}</span></span>
      </div>

      {phase === "menu" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
          <span className="text-primary text-lg font-futuristic font-bold tracking-widest mb-2">SPACE TETRIS</span>
          <span className="text-muted-foreground text-[10px] font-futuristic mb-4">Stack blocks in zero gravity</span>
          <button onClick={startGame} className="px-6 py-2 rounded-lg bg-primary/20 border border-primary/40 text-primary text-xs font-futuristic tracking-wider hover:bg-primary/30 transition-colors">
            START
          </button>
        </div>
      )}

      {phase === "over" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
          <span className="text-red-400 text-lg font-futuristic font-bold tracking-widest mb-1">GAME OVER</span>
          <span className="text-primary text-sm font-mono mb-1">{score} PTS</span>
          {score >= hiscore && score > 0 && <span className="text-yellow-400 text-[10px] font-futuristic mb-3">NEW HIGH SCORE</span>}
          <button onClick={startGame} className="px-6 py-2 rounded-lg bg-primary/20 border border-primary/40 text-primary text-xs font-futuristic tracking-wider hover:bg-primary/30 transition-colors">
            RETRY
          </button>
        </div>
      )}
    </div>
  );
};

export default SpaceTetrisGame;
