import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Factory, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import GIF from 'gif.js';
import {
  agentLlama33,
  agentMaverick,
  agentScout,
  agentSpark,
  agentInstant,
} from '@/assets/agents/characters';

const W = 1200;
const H = 630;

// THE AGENT FACTORY — an original design for the Agents feature:
// a factory production line inside Startup Factory Hub. Riveted
// steel sign plate, hanging lamps, rotating gears, and the five
// agents as units on a moving conveyor belt with station plates.
// Distinct from the Ignition banners (no cosmic bg, no matrix rain).

export const AGENTS_TEAM = [
  { role: 'BUILDER', skill: 'Builds & ships', src: agentLlama33 },
  { role: 'LAUNCHER', skill: 'Launches ideas', src: agentMaverick },
  { role: 'ANALYST', skill: 'Research & data', src: agentScout },
  { role: 'ARCHITECT', skill: 'Systems & strategy', src: agentSpark },
  { role: 'IDEATOR', skill: 'Fast ideas', src: agentInstant },
];
const AGENT_X = [140, 370, 600, 830, 1060];
const BELT_TOP = 492;
const BELT_BOT = 596;

const SPARKS = Array.from({ length: 26 }, (_, i) => ({
  x: 30 + ((i * 173) % (W - 60)),
  speed: 22 + ((i * 37) % 24),
  phase: ((i * 29) % 100) / 100,
  amber: i % 3 === 0,
}));

const drawGear = (
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, R: number, teeth: number,
  rot: number, color: string, alpha: number, lw = 5,
) => {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  const root = R * 0.84;
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts: Array<[number, number]> = [
      [0.0, root], [0.18, root], [0.32, R], [0.62, R], [0.78, root],
    ];
    pts.forEach(([frac, r], j) => {
      const ang = a + step * frac;
      const px = Math.cos(ang) * r;
      const py = Math.sin(ang) * r;
      if (i === 0 && j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
  }
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, root * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.22, 0, Math.PI * 2);
  ctx.stroke();
  for (let k = 0; k < 6; k++) {
    const ang = (k * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * R * 0.24, Math.sin(ang) * R * 0.24);
    ctx.lineTo(Math.cos(ang) * root * 0.74, Math.sin(ang) * root * 0.74);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
};

const rivet = (ctx: CanvasRenderingContext2D, x: number, y: number, r = 3) => {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.arc(x + 1, y + 1, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#9ff5e0';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e6fff8';
  ctx.beginPath(); ctx.arc(x - r / 3, y - r / 3, r / 2.4, 0, Math.PI * 2); ctx.fill();
};

export const drawAgentsFrame = (
  ctx: CanvasRenderingContext2D,
  faces: HTMLImageElement[],
  t: number,
) => {
  // === factory hall background ===
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#07332a');
  bgGrad.addColorStop(0.55, '#04231c');
  bgGrad.addColorStop(1, '#02120e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // blueprint grid
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // light pool
  const pool = ctx.createRadialGradient(W / 2, 30, 40, W / 2, 30, 560);
  pool.addColorStop(0, 'rgba(52, 211, 153, 0.20)');
  pool.addColorStop(1, 'rgba(52, 211, 153, 0)');
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, W, H);

  // roof trusses
  ctx.fillStyle = 'rgba(1, 12, 10, 0.92)';
  ctx.beginPath(); ctx.moveTo(0, 46); ctx.lineTo(300, 46); ctx.lineTo(0, 150); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(W, 46); ctx.lineTo(W - 300, 46); ctx.lineTo(W, 150); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(300, 46); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W, 150); ctx.lineTo(W - 300, 46); ctx.stroke();

  // gears
  drawGear(ctx, 1005, 208, 150, 12, t * 0.12, '#14b8a6', 0.30);
  drawGear(ctx, 836, 116, 64, 9, -t * 0.26, '#6ee7b7', 0.26);
  drawGear(ctx, 1152, 356, 88, 10, -t * 0.17, '#14b8a6', 0.20);

  // hanging lamps
  [330, 668].forEach((lx) => {
    const pulse = 0.78 + 0.22 * Math.sin(t * 2.1 + lx);
    const cone = ctx.createLinearGradient(0, 96, 0, 314);
    cone.addColorStop(0, `rgba(150, 255, 215, ${0.16 * pulse})`);
    cone.addColorStop(1, 'rgba(150, 255, 215, 0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(lx - 24, 96);
    ctx.lineTo(lx + 24, 96);
    ctx.lineTo(lx + 75, 314);
    ctx.lineTo(lx - 75, 314);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0a2821';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(lx, 46); ctx.lineTo(lx, 76); ctx.stroke();
    ctx.fillStyle = '#08221b';
    ctx.beginPath();
    ctx.moveTo(lx - 26, 96); ctx.lineTo(lx + 26, 96); ctx.lineTo(lx + 12, 74); ctx.lineTo(lx - 12, 74);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx - 26, 96); ctx.lineTo(lx + 26, 96); ctx.stroke();
    const bulb = ctx.createRadialGradient(lx, 101, 2, lx, 101, 30);
    bulb.addColorStop(0, `rgba(190, 255, 230, ${0.35 * pulse})`);
    bulb.addColorStop(1, 'rgba(190, 255, 230, 0)');
    ctx.fillStyle = bulb;
    ctx.fillRect(lx - 32, 69, 64, 64);
  });

  // sparks
  SPARKS.forEach((s) => {
    const yy = 470 - ((t * s.speed + s.phase * 300) % 300);
    const xx = s.x + Math.sin(t * 1.3 + s.phase * 9) * 8;
    const a = 0.6 * Math.max(0, 1 - (470 - yy) / 300) * (0.6 + 0.4 * Math.sin(t * 7 + s.phase * 20));
    if (a <= 0.02) return;
    ctx.fillStyle = s.amber ? `rgba(245, 158, 11, ${a})` : `rgba(110, 231, 183, ${a})`;
    ctx.beginPath(); ctx.arc(xx, yy, 1.6, 0, Math.PI * 2); ctx.fill();
  });

  // === left text block ===
  const x0 = 64;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const blink = Math.floor(t * 2) % 2 === 0;
  ctx.fillStyle = blink ? '#34ffaa' : '#107855';
  ctx.beginPath(); ctx.arc(x0 + 4, 108, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.font = '700 12px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#6ee7b7';
  ctx.fillText('NEW ON THE PLATFORM · NOW LIVE IN YOUR DASHBOARD', x0 + 18, 113);

  ctx.font = '800 92px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('THE AGENT', x0, 202);

  const shine = 0.5 + 0.5 * Math.sin(t * 1.4);
  ctx.font = '800 122px "Helvetica Neue", Arial, sans-serif';
  const fgrad = ctx.createLinearGradient(0, 232, 0, 348);
  fgrad.addColorStop(0, '#d1fae5');
  fgrad.addColorStop(1, '#0d946e');
  ctx.fillStyle = fgrad;
  ctx.shadowColor = `rgba(16, 185, 129, ${0.30 + 0.22 * shine})`;
  ctx.shadowBlur = 24;
  ctx.fillText('FACTORY', x0, 348);
  ctx.shadowBlur = 0;

  // steel beam divider
  const beamBarGrad = ctx.createLinearGradient(x0, 0, x0 + 430, 0);
  beamBarGrad.addColorStop(0, 'rgba(16, 185, 129, 0.92)');
  beamBarGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = beamBarGrad;
  ctx.fillRect(x0, 356, 430, 5);
  [x0 + 6, x0 + 220, x0 + 424].forEach((rx) => rivet(ctx, rx, 358, 2));

  ctx.font = '700 17px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.fillText('Five AI specialists. One production line.', x0, 392);
  ctx.font = '400 14px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(167, 243, 208, 0.8)';
  ctx.fillText('They build, launch, research and ship — around the clock.', x0, 418);

  // pill — steel plate style
  const pill = 'FIND THEM IN THE "AGENTS" TAB — RIGHT AFTER TOOLS';
  ctx.font = '700 12px "Helvetica Neue", Arial, sans-serif';
  const pw = ctx.measureText(pill).width + 34;
  ctx.fillStyle = 'rgba(7, 40, 32, 0.92)';
  ctx.beginPath(); ctx.roundRect(x0, 424, pw, 28, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.78)';
  ctx.lineWidth = 2;
  ctx.stroke();
  rivet(ctx, x0 + 9, 438, 2);
  rivet(ctx, x0 + pw - 9, 438, 2);
  ctx.fillStyle = '#e6fff6';
  ctx.fillText(pill, x0 + 20, 442);

  // === conveyor belt ===
  ctx.fillStyle = '#041612';
  ctx.fillRect(0, BELT_TOP, W, BELT_BOT - BELT_TOP);
  ctx.fillStyle = '#0d4235';
  ctx.fillRect(0, BELT_TOP, W, 5);
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.66)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, BELT_TOP); ctx.lineTo(W, BELT_TOP); ctx.stroke();

  // scrolling chevrons
  const off = -((t * 72) % 48);
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.13)';
  ctx.lineWidth = 3;
  for (let cx = off; cx < W + 48; cx += 48) {
    [BELT_TOP + 16, BELT_BOT - 26].forEach((yy) => {
      ctx.beginPath();
      ctx.moveTo(cx, yy);
      ctx.lineTo(cx + 12, yy + 8);
      ctx.lineTo(cx, yy + 16);
      ctx.stroke();
    });
  }

  // scanner beam
  const p = (t % 3.0) / 3.0;
  const beamX = -90 + p * (W + 180);
  const beamGrad = ctx.createLinearGradient(beamX - 55, 0, beamX + 55, 0);
  beamGrad.addColorStop(0, 'rgba(140, 255, 210, 0)');
  beamGrad.addColorStop(0.5, 'rgba(140, 255, 210, 0.20)');
  beamGrad.addColorStop(1, 'rgba(140, 255, 210, 0)');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(beamX - 55, BELT_TOP - 44, 110, BELT_BOT - BELT_TOP + 44);
  ctx.strokeStyle = 'rgba(190, 255, 226, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(beamX, BELT_TOP - 44); ctx.lineTo(beamX, BELT_BOT); ctx.stroke();

  // agents on the belt
  AGENTS_TEAM.forEach((member, i) => {
    const ax = AGENT_X[i];
    const bob = Math.sin(t * 2.2 + i * 1.1) * 2.5;
    const cy = 548 + bob;
    // station plate
    ctx.font = '700 13px "Helvetica Neue", Arial, sans-serif';
    const roleW = ctx.measureText(member.role).width;
    ctx.font = '400 10px "Helvetica Neue", Arial, sans-serif';
    const skillW = ctx.measureText(member.skill).width;
    const pw2 = Math.max(roleW, skillW) + 30;
    const px0 = ax - pw2 / 2;
    const py0 = 460;
    ctx.strokeStyle = 'rgba(120, 200, 180, 0.62)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ax - 20, 448); ctx.lineTo(ax - 20, py0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax + 20, 448); ctx.lineTo(ax + 20, py0); ctx.stroke();
    ctx.fillStyle = 'rgba(8, 42, 34, 0.97)';
    ctx.beginPath(); ctx.roundRect(px0, py0, pw2, 36, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();
    const ledOn = (Math.floor(t * 1.6) + i) % 5 !== 4;
    ctx.fillStyle = ledOn ? '#4affb2' : '#0e5a42';
    ctx.beginPath(); ctx.arc(px0 + 11, py0 + 12, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.font = '700 13px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(member.role, ax + 6, py0 + 16);
    ctx.font = '400 10px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = 'rgba(167, 243, 208, 0.75)';
    ctx.fillText(member.skill, ax + 6, py0 + 30);
    ctx.textAlign = 'left';
    // portrait
    const img = faces[i];
    const near = Math.abs(beamX - ax) < 78;
    if (img) {
      if (near) {
        const halo = ctx.createRadialGradient(ax, cy, 10, ax, cy, 62);
        halo.addColorStop(0, 'rgba(52, 255, 180, 0.28)');
        halo.addColorStop(1, 'rgba(52, 255, 180, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(ax, cy, 62, 0, Math.PI * 2); ctx.fill();
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(ax, cy, 42, 0, Math.PI * 2);
      ctx.clip();
      const s = Math.max(84 / img.width, 84 / img.height);
      ctx.drawImage(img, ax - (img.width * s) / 2, cy - (img.height * s) / 2, img.width * s, img.height * s);
      ctx.restore();
    }
    ctx.strokeStyle = near ? 'rgba(160, 255, 220, 1)' : 'rgba(52, 211, 153, 0.55)';
    ctx.lineWidth = near ? 3 : 2;
    ctx.beginPath(); ctx.arc(ax, cy, 42, 0, Math.PI * 2); ctx.stroke();
    // base stand
    ctx.fillStyle = '#0a3026';
    ctx.beginPath();
    ctx.moveTo(ax - 26, cy + 44);
    ctx.lineTo(ax + 26, cy + 44);
    ctx.lineTo(ax + 18, cy + 52);
    ctx.lineTo(ax - 18, cy + 52);
    ctx.closePath(); ctx.fill();
  });

  // fascia
  ctx.fillStyle = '#051a15';
  ctx.fillRect(0, BELT_BOT, W, H - BELT_BOT);
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.47)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, BELT_BOT); ctx.lineTo(W, BELT_BOT); ctx.stroke();
  ctx.font = '700 12px "Courier New", monospace';
  ctx.fillStyle = 'rgba(190, 245, 228, 0.92)';
  ctx.textAlign = 'center';
  ctx.fillText('CREATE ▸ CUSTOMIZE ▸ CHAIN ▸ RUN   ·   POWERED BY META LLAMA', W / 2, BELT_BOT + 18);
  ctx.textAlign = 'left';

  // hazard stripe (scrolling)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, H - 12, W, 12);
  ctx.clip();
  const hoff = (t * 20) % 32;
  for (let hx = -32 + hoff; hx < W + 32; hx += 32) {
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(hx, H); ctx.lineTo(hx + 16, H); ctx.lineTo(hx + 28, H - 12); ctx.lineTo(hx + 12, H - 12);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#020e0b';
    ctx.beginPath();
    ctx.moveTo(hx + 16, H); ctx.lineTo(hx + 32, H); ctx.lineTo(hx + 44, H - 12); ctx.lineTo(hx + 28, H - 12);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // === top sign plate (above everything) ===
  const plate = ctx.createLinearGradient(0, 0, 0, 46);
  plate.addColorStop(0, '#14503f');
  plate.addColorStop(1, '#0a3529');
  ctx.fillStyle = plate;
  ctx.fillRect(0, 0, W, 46);
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.86)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 45); ctx.lineTo(W, 45); ctx.stroke();
  rivet(ctx, 18, 23, 4);
  rivet(ctx, W - 18, 23, 4);
  ctx.font = '800 16px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('STARTUP FACTORY HUB', 40, 29);
  ctx.font = '400 11px "Courier New", monospace';
  ctx.fillStyle = 'rgba(110, 231, 183, 0.94)';
  const rtxt = 'AGENT PRODUCTION LINE · BAY 01 · SHIFT 24/7';
  ctx.fillText(rtxt, W - 40 - ctx.measureText(rtxt).width, 28);
};

const AgentsAnimatedBanner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const facesRef = useRef<HTMLImageElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number>(performance.now());
  const tSecRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const faces: HTMLImageElement[] = AGENTS_TEAM.map(() => new window.Image());
    let loaded = 0;
    const done = () => {
      loaded++;
      if (loaded === faces.length) {
        facesRef.current = faces;
        setReady(true);
      }
    };
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
      drawAgentsFrame(ctx, facesRef.current, tSecRef.current);
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
        drawAgentsFrame(wCtx, facesRef.current, t);
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
        a.download = 'agents-factory-animated.gif';
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
            <Factory className="w-5 h-5 text-emerald-400" />
            Agents — The Agent Factory — Animated GIF
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Rotating gears · moving conveyor belt · scanner beam sweeps the line · blinking station LEDs · scrolling hazard stripe
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
