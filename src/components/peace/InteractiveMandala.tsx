import { useEffect, useRef, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

/**
 * Interactive kaleidoscopic mandala.
 * Drag / move the pointer inside the canvas to paint radially-symmetric
 * light trails. Fully client-side, no external deps.
 */
const PALETTES: { name: string; hues: number[] }[] = [
  { name: "JADE", hues: [140, 160, 95] },
  { name: "GOLD", hues: [42, 30, 55] },
  { name: "NEBULA", hues: [275, 195, 320] },
];

export default function InteractiveMandala({ height = 300 }: { height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const pointer = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const angleRef = useRef(0);
  const [segments, setSegments] = useState(12);
  const [palette, setPalette] = useState(0);
  const [autoSpin, setAutoSpin] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fillRect(0, 0, rect.width, rect.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;

      // trail fade
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, 0, w, h);

      if (autoSpin) angleRef.current += 0.0025;

      const p = pointer.current;
      const t = Date.now() / 1000;
      // when idle, orbit an automatic point so the mandala keeps breathing
      const px = p.active ? p.x - cx : Math.cos(t * 0.7) * (Math.min(w, h) * 0.22);
      const py = p.active ? p.y - cy : Math.sin(t * 1.1) * (Math.min(w, h) * 0.22);

      const hues = PALETTES[palette].hues;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleRef.current);
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < segments; i++) {
        ctx.rotate((Math.PI * 2) / segments);
        for (let m = 0; m < 2; m++) {
          const sy = m === 0 ? py : -py;
          const hue = hues[(i + m) % hues.length];
          const grad = ctx.createRadialGradient(px, sy, 0, px, sy, 26);
          grad.addColorStop(0, `hsla(${hue}, 90%, 72%, 0.75)`);
          grad.addColorStop(1, `hsla(${hue}, 90%, 50%, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, sy, 26, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `hsla(${hue}, 95%, 78%, 0.5)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(px, sy);
          ctx.stroke();
        }
      }
      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [segments, palette, autoSpin]);

  const updatePointer = (clientX: number, clientY: number, active: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointer.current = { x: clientX - rect.left, y: clientY - rect.top, active };
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        style={{ height }}
        className="w-full rounded-xl border border-primary/20 touch-none cursor-crosshair bg-black"
        onPointerMove={(e) => updatePointer(e.clientX, e.clientY, true)}
        onPointerDown={(e) => updatePointer(e.clientX, e.clientY, true)}
        onPointerLeave={() => (pointer.current = { ...pointer.current, active: false })}
        onPointerUp={() => (pointer.current = { ...pointer.current, active: false })}
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {PALETTES.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setPalette(i)}
              className={`px-2 py-1 rounded-md text-[10px] font-futuristic tracking-wider border transition-all ${
                i === palette
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "glass-morphism text-muted-foreground border-transparent hover:text-primary"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[9px] text-muted-foreground font-mono tracking-wider">SYM</span>
          <input
            type="range"
            min={4}
            max={24}
            step={2}
            value={segments}
            onChange={(e) => setSegments(Number(e.target.value))}
            className="w-20 accent-primary"
            aria-label="Mandala symmetry"
          />
          <button
            onClick={() => setAutoSpin((s) => !s)}
            className={`p-1.5 rounded-md border transition-all ${
              autoSpin ? "text-primary border-primary/40 bg-primary/10" : "text-muted-foreground border-border/40"
            }`}
            title="Toggle rotation"
          >
            <Sparkles className="w-3 h-3" />
          </button>
          <button
            onClick={clear}
            className="p-1.5 rounded-md border border-border/40 text-muted-foreground hover:text-primary transition-all"
            title="Clear mandala"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
