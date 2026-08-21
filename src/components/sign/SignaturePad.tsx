import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Eraser, PenLine, Undo2 } from "lucide-react";

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  height?: number;
}

type Point = { x: number; y: number };
type Stroke = Point[];

/**
 * Multi-stroke canvas signature pad (mouse + touch).
 * The user can draw as many separate traces as needed, undo the last one,
 * and confirm with "Insert signature".
 */
export default function SignaturePad({ onChange, height = 180 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const [strokeCount, setStrokeCount] = useState(0);
  const [inserted, setInserted] = useState(false);

  const hasInk = strokeCount > 0;

  /** Repaint every stored stroke at the current canvas size. */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, rect.width * ratio);
    canvas.height = Math.max(1, height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, rect.width, height);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    for (const stroke of strokes.current) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y);
      else for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
      ctx.stroke();
    }
  }, [height]);

  useEffect(() => {
    redraw();
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
  }, [redraw]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    current.current = [pos(e)];
    strokes.current = [...strokes.current, current.current];
    setInserted(false);
    setStrokeCount(strokes.current.length);
    redraw();
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!current.current) return;
    current.current.push(pos(e));
    redraw();
  };

  const end = () => {
    if (!current.current) return;
    current.current = null;
  };

  const undo = () => {
    strokes.current = strokes.current.slice(0, -1);
    setStrokeCount(strokes.current.length);
    setInserted(false);
    redraw();
    onChange(strokes.current.length ? canvasRef.current?.toDataURL("image/png") ?? null : null);
  };

  const clear = () => {
    strokes.current = [];
    current.current = null;
    setStrokeCount(0);
    setInserted(false);
    redraw();
    onChange(null);
  };

  const insert = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    onChange(canvas.toDataURL("image/png"));
    setInserted(true);
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border border-border/60 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{ height, touchAction: "none" }}
          className="w-full block cursor-crosshair"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-muted-foreground/70 text-sm">
            <PenLine className="h-4 w-4" />
            Draw your signature — as many strokes as you need
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {hasInk
            ? inserted
              ? "Signature ready"
              : `${strokeCount} stroke${strokeCount > 1 ? "s" : ""} — press Insert when done`
            : "Multi-stroke supported"}
        </span>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={undo} disabled={!hasInk}>
            <Undo2 className="h-4 w-4 mr-1" /> Undo
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!hasInk}>
            <Eraser className="h-4 w-4 mr-1" /> Clear
          </Button>
          <Button type="button" size="sm" onClick={insert} disabled={!hasInk}>
            <Check className="h-4 w-4 mr-1" /> Insert
          </Button>
        </div>
      </div>
    </div>
  );
}
