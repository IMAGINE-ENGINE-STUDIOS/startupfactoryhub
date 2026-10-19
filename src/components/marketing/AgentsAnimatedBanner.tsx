import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import GIF from 'gif.js';
import sfhLogoSphere from '@/assets/sfh-logo-sphere.png';
import {
  agentLlama33,
  agentMaverick,
  agentScout,
  agentSpark,
  agentInstant,
} from '@/assets/agents/characters';

const W = 1200;
const H = 630;

// MEET YOUR AGENT TEAM — an original light design built around the
// founder's own personalized agent characters (transparent cut-outs).
// A bright emerald-glass stage matching the Agents tab's approved
// glassmorphism branding: the five full-body characters stand in a
// lineup, bobbing gently, with twinkling sparkles and a cycling
// highlight chip. No dark industrial / matrix elements.

export const AGENTS_TEAM = [
  { role: 'BUILDER', src: agentLlama33 },
  { role: 'LAUNCHER', src: agentMaverick },
  { role: 'ANALYST', src: agentScout },
  { role: 'ARCHITECT', src: agentSpark },
  { role: 'IDEATOR', src: agentInstant },
];

// role, lineup index into AGENTS_TEAM, center x, height
const LINEUP: Array<{ role: string; team: number; cx: number; h: number }> = [
  { role: 'ARCHITECT', team: 3, cx: 536, h: 268 },
  { role: 'LAUNCHER', team: 1, cx: 672, h: 306 },
  { role: 'BUILDER', team: 0, cx: 852, h: 350 },
  { role: 'ANALYST', team: 2, cx: 1000, h: 296 },
  { role: 'IDEATOR', team: 4, cx: 1096, h: 264 },
];
const DRAW_ORDER = [0, 4, 1, 3, 2]; // LINEUP indices, BUILDER front
const FEET = 594;

const SPARKLES: Array<[number, number, number, number]> = [
  [498, 168, 13, 0.0], [1096, 128, 11, 1.4], [600, 268, 9, 2.6],
  [1170, 300, 10, 0.8], [452, 420, 9, 2.0], [986, 208, 8, 3.4],
  [700, 120, 8, 4.2], [380, 300, 8, 1.0],
];

const star = (
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number, alpha: number,
) => {
  ctx.save();
  ctx.fillStyle = `rgba(13, 148, 136, ${alpha})`;
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const ang = (k * Math.PI) / 4 - Math.PI / 2;
    const rr = k % 2 === 0 ? r : r * 0.24;
    const px = cx + Math.cos(ang) * rr;
    const py = cy + Math.sin(ang) * rr;
    if (k === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

export const drawAgentsFrame = (
  ctx: CanvasRenderingContext2D,
  faces: HTMLImageElement[],
  logo: HTMLImageElement | null,
  t: number,
) => {
  // === bright emerald-glass background ===
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#f2fff9');
  bg.addColorStop(0.55, '#dcf9ea');
  bg.addColorStop(1, '#bcf0d6');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // drifting blobs
  const blob = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 10, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  blob(1060 + Math.sin(t * 0.5) * 16, 90, 300, 'rgba(45, 212, 191, 0.20)');
  blob(90 + Math.cos(t * 0.4) * 14, 630, 270, 'rgba(16, 185, 129, 0.16)');
  blob(730, -60, 190, 'rgba(110, 231, 183, 0.20)');

  // dot grid
  ctx.fillStyle = 'rgba(6, 95, 70, 0.05)';
  for (let gx = 18; gx < W; gx += 26) {
    for (let gy = 18; gy < H; gy += 26) {
      ctx.fillRect(gx, gy, 2, 2);
    }
  }

  // arch stage backdrop
  const ax0 = 448, ax1 = 1176, atop = 128, abot = 616;
  const ar = (ax1 - ax0) / 2;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.arc(ax0 + ar, atop + ar, ar, Math.PI, 0);
  ctx.rect(ax0, atop + ar, ax1 - ax0, abot - (atop + ar));
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.66)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ax0 + ar, atop + ar, ar, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ax0, atop + ar); ctx.lineTo(ax0, abot); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ax1, atop + ar); ctx.lineTo(ax1, abot); ctx.stroke();
  ctx.strokeStyle = 'rgba(13, 148, 136, 0.18)';
  ctx.beginPath();
  ctx.arc(ax0 + ar, atop + ar, ar - 18, Math.PI, 0);
  ctx.stroke();

  // floor pool
  const pool = ctx.createRadialGradient(810, 592, 20, 810, 592, 400);
  pool.addColorStop(0, 'rgba(6, 95, 70, 0.16)');
  pool.addColorStop(1, 'rgba(6, 95, 70, 0)');
  ctx.fillStyle = pool;
  ctx.fillRect(400, 500, 800, 140);

  // sparkles
  SPARKLES.forEach(([sx, sy, sr, ph]) => {
    const tw = 0.5 + 0.5 * Math.sin(t * 2.4 + ph);
    star(ctx, sx, sy, sr * (0.45 + 0.55 * tw), 0.3 + 0.6 * tw);
  });

  // === header ===
  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(69, 53, 23, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, 46, 30, 46, 46);
    ctx.restore();
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 15px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#064e3b';
  try { (ctx as unknown as { letterSpacing: string }).letterSpacing = '2px'; } catch { /* older engines */ }
  ctx.fillText('STARTUP FACTORY HUB', 104, 58);
  try { (ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'; } catch { /* ignore */ }

  const rtxt = 'POWERED BY META LLAMA';
  ctx.font = '700 10px "Courier New", monospace';
  const rw = ctx.measureText(rtxt).width + 22;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.59)';
  ctx.beginPath(); ctx.roundRect(W - 46 - rw, 36, rw, 26, 13); ctx.fill();
  ctx.strokeStyle = 'rgba(13, 148, 136, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(6, 78, 59, 0.9)';
  ctx.fillText(rtxt, W - 46 - rw + 11, 53);

  // eyebrow pill
  const etxt = 'NEW FEATURE · NOW LIVE';
  ctx.font = '700 11px "Helvetica Neue", Arial, sans-serif';
  const ew = ctx.measureText(etxt).width + 34;
  ctx.fillStyle = '#10b981';
  ctx.beginPath(); ctx.roundRect(56, 112, ew, 28, 14); ctx.fill();
  const blink = Math.floor(t * 2) % 2 === 0;
  ctx.fillStyle = blink ? '#ffffff' : '#a7f3d0';
  ctx.beginPath(); ctx.arc(72, 126, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(etxt, 82, 130);

  // headline
  ctx.font = '800 64px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#043c2c';
  ctx.fillText('MEET YOUR', 56, 218);
  const shine = 0.5 + 0.5 * Math.sin(t * 1.6);
  ctx.font = '800 78px "Helvetica Neue", Arial, sans-serif';
  const hg = ctx.createLinearGradient(0, 240, 0, 316);
  hg.addColorStop(0, '#059669');
  hg.addColorStop(1, '#0d9488');
  ctx.fillStyle = hg;
  ctx.shadowColor = `rgba(16, 185, 129, ${0.25 + 0.18 * shine})`;
  ctx.shadowBlur = 16;
  ctx.fillText('AGENT TEAM', 56, 316);
  ctx.shadowBlur = 0;

  // tagline
  ctx.font = '400 16px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(6, 78, 59, 0.84)';
  ctx.fillText('Five AI specialists that build, launch, research', 56, 346);
  ctx.fillText('and ship for your startup.', 56, 370);
  ctx.font = '700 16px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(4, 60, 44, 0.94)';
  ctx.fillText('Create your own. Chain them into pipelines.', 56, 400);

  // CTA pill
  const ctxt = 'OPEN THE AGENTS TAB  →';
  ctx.font = '700 14px "Helvetica Neue", Arial, sans-serif';
  const cw = ctx.measureText(ctxt).width + 40;
  ctx.save();
  ctx.shadowColor = 'rgba(6, 95, 70, 0.35)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  const cg = ctx.createLinearGradient(56, 0, 56 + cw, 0);
  cg.addColorStop(0, '#10b981');
  cg.addColorStop(1, '#0d9488');
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.roundRect(56, 428, cw, 42, 21); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(ctxt, 76, 455);

  // step chips
  const steps = ['01 CREATE', '02 CUSTOMIZE', '03 CHAIN', '04 RUN'];
  ctx.font = '700 10px "Helvetica Neue", Arial, sans-serif';
  let cxp = 56;
  steps.forEach((s, si) => {
    const sw = ctx.measureText(s).width + 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath(); ctx.roundRect(cxp, 492, sw, 24, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(13, 148, 136, 0.31)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(6, 78, 59, 0.92)';
    ctx.fillText(s, cxp + 10, 508);
    cxp += sw + 8;
    if (si < 3) {
      ctx.fillStyle = 'rgba(13, 148, 136, 0.78)';
      ctx.fillText('›', cxp - 2, 508);
      cxp += 10;
    }
  });

  // === characters ===
  const active = Math.floor(t / 0.75) % 5;
  ctx.font = '700 11px "Helvetica Neue", Arial, sans-serif';
  DRAW_ORDER.forEach((li) => {
    const item = LINEUP[li];
    const img = faces[item.team];
    if (!img) return;
    const w2 = (img.width / img.height) * item.h;
    const bob = Math.sin(t * 2.1 + li * 1.3) * 4;
    const lift = li === active ? -8 : 0;
    const top = FEET - item.h + bob + lift;
    // ground shadow
    const shw = w2 * 0.62;
    const sg = ctx.createRadialGradient(item.cx, FEET + 5, 4, item.cx, FEET + 5, shw / 2);
    sg.addColorStop(0, 'rgba(6, 95, 70, 0.20)');
    sg.addColorStop(1, 'rgba(6, 95, 70, 0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.ellipse(item.cx, FEET + 5, shw / 2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(img, item.cx - w2 / 2, top, w2, item.h);
    // role chip
    const lw = ctx.measureText(item.role).width + 24;
    const lx0 = item.cx - lw / 2;
    const isAct = li === active;
    ctx.fillStyle = isAct ? '#10b981' : 'rgba(255, 255, 255, 0.88)';
    ctx.beginPath(); ctx.roundRect(lx0, 602, lw, 22, 11); ctx.fill();
    ctx.strokeStyle = 'rgba(13, 148, 136, 0.43)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = isAct ? '#ffffff' : '#10b981';
    ctx.beginPath(); ctx.arc(lx0 + 11, 613, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isAct ? '#ffffff' : '#064e3b';
    ctx.fillText(item.role, lx0 + 18, 617);
  });
};

const AgentsAnimatedBanner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const facesRef = useRef<HTMLImageElement[]>([]);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number>(performance.now());
  const tSecRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const faces: HTMLImageElement[] = AGENTS_TEAM.map(() => new window.Image());
    const logo = new window.Image();
    let loaded = 0;
    const total = faces.length + 1;
    const done = () => {
      loaded++;
      if (loaded === total) {
        facesRef.current = faces;
        logoRef.current = logo;
        setReady(true);
      }
    };
    logo.onload = done;
    logo.src = sfhLogoSphere;
    faces.forEach((img, i) => {
      img.onload = done;
      img.src = AGENTS_TEAM[i].src;
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTRef.current) / 1000);
      lastTRef.current = now;
      tSecRef.current += dt;
      drawAgentsFrame(ctx, facesRef.current, logoRef.current, tSecRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready]);

  const handleDownloadGif = useCallback(async () => {
    if (!ready) {
      toast.error('Assets not loaded yet');
      return;
    }
    setIsGenerating(true);
    setProgress(0);
    toast.info('Rendering animated GIF — this may take a moment…');

    try {
      const EXPORT_W = 900;
      const EXPORT_H = Math.round(EXPORT_W * (H / W));
      const FPS = 18;
      const DURATION = 3.0;
      const FRAMES = Math.round(FPS * DURATION);
      const FRAME_DELAY = Math.round(1000 / FPS);

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = EXPORT_W;
      exportCanvas.height = EXPORT_H;
      const exCtx = exportCanvas.getContext('2d')!;

      const work = document.createElement('canvas');
      work.width = W;
      work.height = H;
      const wCtx = work.getContext('2d')!;

      const gif = new GIF({
        workers: 2,
        quality: 8,
        width: EXPORT_W,
        height: EXPORT_H,
        workerScript: '/gif.worker.js',
        dither: false,
      });

      for (let f = 0; f < FRAMES; f++) {
        const t = (f / FRAMES) * DURATION;
        drawAgentsFrame(wCtx, facesRef.current, logoRef.current, t);
        exCtx.clearRect(0, 0, EXPORT_W, EXPORT_H);
        exCtx.imageSmoothingEnabled = true;
        exCtx.imageSmoothingQuality = 'high';
        exCtx.drawImage(work, 0, 0, EXPORT_W, EXPORT_H);
        gif.addFrame(exCtx, { copy: true, delay: FRAME_DELAY });
        setProgress(Math.round(((f + 1) / FRAMES) * 50));
        if (f % 4 === 0) await new Promise((r) => setTimeout(r, 0));
      }

      gif.on('progress', (p: number) => {
        setProgress(50 + Math.round(p * 50));
      });

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'agents-team-animated.gif';
        a.click();
        URL.revokeObjectURL(url);
        setIsGenerating(false);
        setProgress(0);
        toast.success('Animated GIF downloaded');
      });

      gif.render();
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
      setProgress(0);
      toast.error('Failed to generate GIF');
    }
  }, [ready]);

  return (
    <div className="tech-card border-0 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            Agents — Meet Your Agent Team — Animated GIF
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Her personalized agent characters on a glass stage · gentle bobbing · twinkling sparkles · highlight cycles through the team
          </p>
        </div>
        <Button onClick={handleDownloadGif} disabled={!ready || isGenerating} size="sm">
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {progress}%
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download GIF
            </>
          )}
        </Button>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-border bg-black">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <div className="flex items-center gap-2 text-white text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading assets…
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="w-full h-auto block" />
      </div>

      <p className="text-xs text-muted-foreground">
        Live 60fps preview · Export: 900×473 · 3s seamless loop · 18 fps · optimized for social
      </p>
    </div>
  );
};

export default AgentsAnimatedBanner;
