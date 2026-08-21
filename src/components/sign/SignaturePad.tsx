import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Eraser, Pencil, Save, Trash2, Undo2 } from "lucide-react";

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  height?: number;
}

type Point = { x: number; y: number };
type Stroke = Point[];
type SavedSignature = { id: string; dataUrl: string; createdAt: number; label: string };

const SAVED_SIGNATURES_KEY = "sfh_saved_signatures_v1";

const SIGNATURE_FONTS = [
  { label: "Script", family: "'Brush Script MT', cursive" },
  { label: "Cursive", family: "'Dancing Script', cursive" },
  { label: "Elegant", family: "'Parisienne', cursive" },
  { label: "Bold", family: "'Segoe Script', cursive" },
];

/** Draw a typed name onto an off-screen canvas and return a PNG data URL. */
const renderTypedSignature = (name: string, fontFamily: string): string | null => {
  if (!name.trim()) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111827";
  ctx.font = `48px ${fontFamily}`;
  ctx.textBaseline = "middle";
  const metrics = ctx.measureText(name.trim());
  const x = Math.max(16, (canvas.width - metrics.width) / 2);
  const y = canvas.height / 2;
  ctx.fillText(name.trim(), x, y);
  return canvas.toDataURL("image/png");
};

/**
 * Multi-stroke signature pad with Draw / Type tabs and saved signatures.
 * The signature is only produced when the user taps "Done" (Draw) or "Insert" (saved list).
 */
export default function SignaturePad({ onChange, height = 180 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const [strokeCount, setStrokeCount] = useState(0);
  const [saved, setSaved] = useState<SavedSignature[]>([]);
  const [activeTab, setActiveTab] = useState("draw");
  const [typedName, setTypedName] = useState("");
  const [typedFontIndex, setTypedFontIndex] = useState(0);
  const [typedPreview, setTypedPreview] = useState<string | null>(null);

  const hasInk = strokeCount > 0;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_SIGNATURES_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const persistSaved = useCallback((next: SavedSignature[]) => {
    setSaved(next);
    try {
      localStorage.setItem(SAVED_SIGNATURES_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

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
    redraw();
  };

  const clear = () => {
    strokes.current = [];
    current.current = null;
    setStrokeCount(0);
    redraw();
  };

  const doneDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    const dataUrl = canvas.toDataURL("image/png");
    const next: SavedSignature = {
      id: crypto.randomUUID(),
      dataUrl,
      createdAt: Date.now(),
      label: `Hand-drawn ${new Date().toLocaleString()}`,
    };
    persistSaved([next, ...saved].slice(0, 6));
    onChange(dataUrl);
  };

  const insertSaved = (sig: SavedSignature) => {
    onChange(sig.dataUrl);
  };

  const deleteSaved = (id: string) => {
    const next = saved.filter((s) => s.id !== id);
    persistSaved(next);
  };

  const saveTyped = () => {
    if (!typedPreview) return;
    const next: SavedSignature = {
      id: crypto.randomUUID(),
      dataUrl: typedPreview,
      createdAt: Date.now(),
      label: `Typed: ${typedName.trim()}`,
    };
    persistSaved([next, ...saved].slice(0, 6));
    onChange(typedPreview);
  };

  useEffect(() => {
    setTypedPreview(renderTypedSignature(typedName, SIGNATURE_FONTS[typedFontIndex].family));
  }, [typedName, typedFontIndex]);

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw">
            <Pencil className="h-4 w-4 mr-2" /> Draw
          </TabsTrigger>
          <TabsTrigger value="type">
            <span className="font-serif italic mr-2">T</span> Type
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="space-y-3">
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
                Draw your signature here
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Draw as many strokes as you need. Your signature is created only when you tap Save.
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={undo} disabled={!hasInk}>
              <Undo2 className="h-4 w-4 mr-1" /> Undo
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={clear} disabled={!hasInk}>
              <Eraser className="h-4 w-4 mr-1" /> Clear
            </Button>
            <Button type="button" size="sm" className="ml-auto" onClick={doneDrawing} disabled={!hasInk}>
              <Check className="h-4 w-4 mr-1" /> Done
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="type" className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type your name</label>
            <Input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Jane Doe"
              className="bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SIGNATURE_FONTS.map((font, idx) => (
                <button
                  key={font.label}
                  type="button"
                  onClick={() => setTypedFontIndex(idx)}
                  className={`rounded-lg border px-3 py-2 text-center transition ${
                    typedFontIndex === idx
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 hover:bg-muted"
                  }`}
                >
                  <span style={{ fontFamily: font.family }} className="text-lg">
                    {font.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="relative rounded-xl border border-border/60 bg-white overflow-hidden flex items-center justify-center" style={{ height }}>
            {typedPreview ? (
              <img src={typedPreview} alt="Typed signature preview" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-sm text-muted-foreground/70">Preview will appear here</span>
            )}
          </div>
          <Button type="button" size="sm" className="w-full" onClick={saveTyped} disabled={!typedPreview}>
            <Save className="h-4 w-4 mr-1" /> Save typed signature
          </Button>
        </TabsContent>
      </Tabs>

      {saved.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/40">
          <h4 className="text-sm font-medium">Saved Signatures ({saved.length})</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {saved.map((sig) => (
              <div
                key={sig.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-white/50 p-2"
              >
                <img src={sig.dataUrl} alt={sig.label} className="h-12 w-24 object-contain" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{sig.label}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" size="sm" onClick={() => insertSaved(sig)}>
                    <Check className="h-4 w-4 mr-1" /> Insert
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => deleteSaved(sig.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
