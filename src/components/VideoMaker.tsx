import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, Play, Square as SquareIcon, RectangleHorizontal, RectangleVertical, Upload, X } from "lucide-react";

/* Promo-video composer: animated canvas scenes rendered live in the browser.
   Preview and export share one frame painter; export records the canvas
   stream (MP4 where the browser supports it, WebM otherwise). */

const FORMATS = [
  { id: "square", label: "Square · social post", w: 1080, h: 1080, icon: SquareIcon },
  { id: "landscape", label: "Landscape · YouTube / web", w: 1920, h: 1080, icon: RectangleHorizontal },
  { id: "portrait", label: "Portrait · Reels / Shorts", w: 1080, h: 1920, icon: RectangleVertical },
] as const;

const PALETTES = [
  { id: "sfh", label: "SFH Emerald", bg: "#04140f", a: "#14b8a6", b: "#22d3ee", c: "#818cf8", text: "#f2fbf7" },
  { id: "midnight", label: "Midnight Violet", bg: "#0d0a1f", a: "#8b5cf6", b: "#d946ef", c: "#6366f1", text: "#f5f2ff" },
  { id: "sunset", label: "Sunset", bg: "#1c0d08", a: "#f97316", b: "#ef4444", c: "#f59e0b", text: "#fff7ed" },
  { id: "ocean", label: "Ocean", bg: "#041224", a: "#0ea5e9", b: "#22d3ee", c: "#2dd4bf", text: "#eefaff" },
  { id: "mono", label: "Mono Luxe", bg: "#0a0a0a", a: "#e5e5e5", b: "#a3a3a3", c: "#f5f5f5", text: "#fafafa" },
] as const;

type Palette = (typeof PALETTES)[number];

interface SceneCfg {
  brand: string;
  headline: string;
  subtext: string;
  cta: string;
  site: string;
  palette: Palette;
}

const DURATION = 9000; // ms — 3 acts × 3s

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const trial = line ? `${line} ${w}` : w;
    if (ctx.measureText(trial).width > maxWidth && line) { lines.push(line); line = w; }
    else line = trial;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number, // seconds
  cfg: SceneCfg,
  logo: HTMLImageElement | null,
  bgImage: HTMLImageElement | null,
) {
  const { palette: p } = cfg;
  const cx = w / 2;
  // background
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);
  if (bgImage) {
    const scale = Math.max(w / bgImage.width, h / bgImage.height);
    const dw = bgImage.width * scale, dh = bgImage.height * scale;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.drawImage(bgImage, (w - dw) / 2, (h - dh) / 2, dw, dh);
    ctx.restore();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);
  }
  // living orbs (SFH animated style — motion, no static watermark)
  const orbs = [
    { fx: 0.22, fy: 0.26, r: 0.34, c: p.a, sp: 0.7, ph: 0 },
    { fx: 0.82, fy: 0.68, r: 0.40, c: p.b, sp: 0.5, ph: 2.1 },
    { fx: 0.62, fy: 0.12, r: 0.22, c: p.c, sp: 0.9, ph: 4.2 },
  ];
  for (const o of orbs) {
    const ox = (o.fx + 0.045 * Math.sin(t * o.sp + o.ph)) * w;
    const oy = (o.fy + 0.045 * Math.cos(t * o.sp * 0.8 + o.ph)) * h;
    const r = o.r * Math.min(w, h) * (1 + 0.05 * Math.sin(t * 0.9 + o.ph));
    const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
    g.addColorStop(0, o.c + "55");
    g.addColorStop(1, o.c + "00");
    ctx.fillStyle = g;
    ctx.fillRect(ox - r, oy - r, r * 2, r * 2);
  }

  const act = t / 3; // 0..3
  const unit = Math.min(w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (act < 1) {
    // Act 1 — brand reveal
    const prog = easeOut(clamp01(act * 1.4));
    const alpha = clamp01(act * 2);
    let y = h * 0.42;
    if (logo) {
      const s = unit * 0.26 * prog;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(logo, cx - s / 2, y - s / 2, s, s);
      ctx.restore();
      y += unit * 0.22;
    } else {
      // orb mark
      const r = unit * 0.075 * prog * (1 + 0.06 * Math.sin(t * 2.4));
      const g = ctx.createRadialGradient(cx, y, 0, cx, y, r * 2.2);
      g.addColorStop(0, p.b);
      g.addColorStop(0.55, p.a + "cc");
      g.addColorStop(1, p.a + "00");
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, y, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      y += unit * 0.16;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.text;
    ctx.font = `700 ${unit * 0.062}px 'Segoe UI', system-ui, sans-serif`;
    ctx.fillText(cfg.brand || "Your Brand", cx, y);
    ctx.restore();
  } else if (act < 2) {
    // Act 2 — headline + subtext
    const lt = act - 1;
    const slide = (1 - easeOut(clamp01(lt * 1.6))) * unit * 0.05;
    const alpha = clamp01(lt * 2.2);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.text;
    ctx.font = `800 ${unit * 0.068}px 'Segoe UI', system-ui, sans-serif`;
    const lines = wrapText(ctx, cfg.headline || "Your headline here", w * 0.84);
    const lineH = unit * 0.088;
    let y = h * 0.40 - ((lines.length - 1) * lineH) / 2 + slide;
    for (const ln of lines) { ctx.fillText(ln, cx, y); y += lineH; }
    if (cfg.subtext.trim()) {
      ctx.font = `400 ${unit * 0.034}px 'Segoe UI', system-ui, sans-serif`;
      ctx.fillStyle = p.text + "cc";
      const sub = wrapText(ctx, cfg.subtext, w * 0.78);
      y += unit * 0.03;
      for (const ln of sub.slice(0, 3)) { ctx.fillText(ln, cx, y); y += unit * 0.048; }
    }
    ctx.restore();
  } else {
    // Act 3 — CTA close
    const lt = act - 2;
    const alpha = clamp01(lt * 2.2);
    const pop = 0.92 + 0.08 * easeOut(clamp01(lt * 1.8));
    ctx.save();
    ctx.globalAlpha = alpha;
    if (logo) {
      const s = unit * 0.13;
      ctx.drawImage(logo, cx - s / 2, h * 0.30 - s / 2, s, s);
    }
    ctx.fillStyle = p.text;
    ctx.font = `700 ${unit * 0.05}px 'Segoe UI', system-ui, sans-serif`;
    ctx.fillText(cfg.brand || "Your Brand", cx, h * 0.42);
    if (cfg.cta.trim()) {
      const label = cfg.cta.trim();
      ctx.font = `700 ${unit * 0.036}px 'Segoe UI', system-ui, sans-serif`;
      const tw = ctx.measureText(label).width;
      const pw = (tw + unit * 0.09) * pop, ph = unit * 0.085 * pop;
      const px = cx - pw / 2, py = h * 0.54 - ph / 2;
      const grad = ctx.createLinearGradient(px, py, px + pw, py);
      grad.addColorStop(0, p.a); grad.addColorStop(0.5, p.b); grad.addColorStop(1, p.c);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, ph / 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, cx, h * 0.54 + 1);
    }
    if (cfg.site.trim()) {
      ctx.font = `500 ${unit * 0.03}px 'Segoe UI', system-ui, sans-serif`;
      ctx.fillStyle = p.text + "b3";
      ctx.fillText(cfg.site.trim(), cx, h * 0.66);
    }
    ctx.restore();
  }
  // progress hairline
  ctx.fillStyle = p.b + "88";
  ctx.fillRect(0, h - Math.max(3, h * 0.004), (t / (DURATION / 1000)) * w, Math.max(3, h * 0.004));
}

export default function VideoMaker() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(performance.now());

  const [formatId, setFormatId] = useState<string>("square");
  const [brand, setBrand] = useState("");
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [cta, setCta] = useState("Get started");
  const [site, setSite] = useState("");
  const [paletteId, setPaletteId] = useState<string>("sfh");
  const [logoName, setLogoName] = useState<string | null>(null);
  const [bgName, setBgName] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const format = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0];
  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
  const cfgRef = useRef<SceneCfg>({ brand, headline, subtext, cta, site, palette });
  cfgRef.current = { brand, headline, subtext, cta, site, palette };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const loop = () => {
      const t = ((performance.now() - startRef.current) % DURATION) / 1000;
      drawFrame(ctx, canvas.width, canvas.height, t, cfgRef.current, logoRef.current, bgRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [formatId]);

  const loadImage = (file: File, target: React.MutableRefObject<HTMLImageElement | null>, setName: (n: string | null) => void) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { target.current = img; setName(file.name); };
    img.onerror = () => toast({ title: "Image didn't load", description: "Try a PNG or JPG file.", variant: "destructive" });
    img.src = url;
  };

  const handleExport = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
      toast({ title: "Export not supported here", description: "This browser can't record the canvas. Try Chrome or Edge.", variant: "destructive" });
      return;
    }
    setRecording(true);
    setVideoUrl(null);
    try {
      const stream = canvas.captureStream(30);
      const mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : { videoBitsPerSecond: 8_000_000 });
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      const done = new Promise<Blob>((resolve) => {
        rec.onstop = () => resolve(new Blob(chunks, { type: rec.mimeType || "video/webm" }));
      });
      startRef.current = performance.now();
      rec.start(250);
      await new Promise((r) => setTimeout(r, DURATION + 150));
      rec.stop();
      const blob = await done;
      setVideoUrl(URL.createObjectURL(blob));
      toast({ title: "Video ready", description: "Preview it below, then download." });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setRecording(false);
    }
  };

  const clearImage = (which: "logo" | "bg") => {
    if (which === "logo") { logoRef.current = null; setLogoName(null); }
    else { bgRef.current = null; setBgName(null); }
  };

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        {/* ── Script & style ─────────────────────────────── */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Format</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormatId(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1.5 ${formatId === f.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                >
                  <f.icon className="h-3.5 w-3.5" /> {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Brand name</label>
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Orbit Meals" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Headline</label>
            <Textarea value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Healthy lunches, delivered to your office" rows={2} className="mt-1 resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium">Supporting line</label>
            <Textarea value={subtext} onChange={(e) => setSubtext(e.target.value)} placeholder="e.g. Chef-made meals your team will actually look forward to." rows={2} className="mt-1 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Button text</label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Get started" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Website</label>
              <Input value={site} onChange={(e) => setSite(e.target.value)} placeholder="yourstartup.com" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Palette</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPaletteId(p.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-1.5 ${paletteId === p.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                >
                  <span className="flex -space-x-1">
                    <span className="h-3 w-3 rounded-full border border-white/40" style={{ background: p.a }} />
                    <span className="h-3 w-3 rounded-full border border-white/40" style={{ background: p.b }} />
                    <span className="h-3 w-3 rounded-full border border-white/40" style={{ background: p.c }} />
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Logo (optional)</label>
              {logoName ? (
                <div className="mt-1 flex items-center gap-2 text-xs border rounded-md px-2 py-2">
                  <span className="truncate flex-1">{logoName}</span>
                  <button type="button" onClick={() => clearImage("logo")} aria-label="Remove logo"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <label className="mt-1 flex items-center justify-center gap-2 text-xs border border-dashed rounded-md px-2 py-2 cursor-pointer hover:bg-muted">
                  <Upload className="h-3.5 w-3.5" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImage(f, logoRef, setLogoName); }} />
                </label>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Backdrop image (optional)</label>
              {bgName ? (
                <div className="mt-1 flex items-center gap-2 text-xs border rounded-md px-2 py-2">
                  <span className="truncate flex-1">{bgName}</span>
                  <button type="button" onClick={() => clearImage("bg")} aria-label="Remove backdrop"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <label className="mt-1 flex items-center justify-center gap-2 text-xs border border-dashed rounded-md px-2 py-2 cursor-pointer hover:bg-muted">
                  <Upload className="h-3.5 w-3.5" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImage(f, bgRef, setBgName); }} />
                </label>
              )}
            </div>
          </div>
          <Button onClick={handleExport} disabled={recording} className="w-full gap-2">
            {recording ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {recording ? "Rendering your video…" : "Render video (9 sec)"}
          </Button>
          <p className="text-xs text-muted-foreground">
            The video renders right in your browser — nothing is uploaded. The preview loops the full 9-second piece: brand reveal, headline, call to action.
          </p>
          {videoUrl && (
            <a href={videoUrl} download={`promo-video-${brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "video"}`} className="block">
              <Button variant="outline" className="w-full gap-2">
                <Download className="h-4 w-4" /> Download the video
              </Button>
            </a>
          )}
        </div>

        {/* ── Preview ────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-black/40 flex items-center justify-center p-3">
            <canvas
              ref={canvasRef}
              key={format.id}
              width={format.w}
              height={format.h}
              className="rounded-lg max-h-[62vh] w-auto max-w-full"
              style={{ aspectRatio: `${format.w} / ${format.h}` }}
            />
          </div>
          {videoUrl && (
            <div className="rounded-2xl border border-border p-3">
              <p className="text-xs font-medium mb-2">Your rendered video</p>
              <video src={videoUrl} controls loop className="w-full rounded-lg max-h-[40vh]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
