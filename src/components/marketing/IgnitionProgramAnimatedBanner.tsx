import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Flame, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import GIF from 'gif.js';
import cosmicBg from '@/assets/ignition-cosmic-bg.jpg';
import sfhEmblem from '@/assets/sfh-logo-emblem.png';

const W = 1200;
const H = 630;

type Column = {
  x: number;
  y: number;
  speed: number;
  trailLen: number;
  chars: string[];
  charSwapTimer: number;
};

const CHARSET = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ<>{}[]/\\=+';
const COL_COUNT = 70;
const COL_W = W / COL_COUNT;

const initColumns = (): Column[] => {
  const cols: Column[] = [];
  for (let i = 0; i < COL_COUNT; i++) {
    const trailLen = 8 + Math.floor(Math.random() * 16);
    const chars: string[] = [];
    for (let j = 0; j < trailLen; j++) {
      chars.push(CHARSET[Math.floor(Math.random() * CHARSET.length)]);
    }
    cols.push({
      x: i * COL_W + (Math.random() * 4 - 2),
      y: Math.random() * H,
      speed: 1.2 + Math.random() * 2.4,
      trailLen,
      chars,
      charSwapTimer: Math.random() * 6,
    });
  }
  return cols;
};

const stepColumns = (cols: Column[], dt: number) => {
  for (const c of cols) {
    c.y += c.speed * dt * 16;
    if (c.y - c.trailLen * 16 > H) {
      c.y = -Math.random() * 80;
      c.speed = 1.2 + Math.random() * 2.4;
    }
    c.charSwapTimer -= dt;
    if (c.charSwapTimer <= 0) {
      const idx = Math.floor(Math.random() * c.chars.length);
      c.chars[idx] = CHARSET[Math.floor(Math.random() * CHARSET.length)];
      c.charSwapTimer = 0.05 + Math.random() * 0.15;
    }
  }
};

const drawFrame = (
  ctx: CanvasRenderingContext2D,
  bg: HTMLImageElement,
  logo: HTMLImageElement,
  cols: Column[],
  t: number,
) => {
  const bgRatio = bg.width / bg.height;
  const cRatio = W / H;
  let dw = W, dh = H, ox = 0, oy = 0;
  if (bgRatio > cRatio) { dw = H * bgRatio; ox = -(dw - W) / 2; }
  else { dh = W / bgRatio; oy = -(dh - H) / 2; }
  const drift = Math.sin(t * 0.4) * 6;
  ctx.drawImage(bg, ox + drift, oy, dw, dh);

  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, 'rgba(0, 8, 6, 0.55)');
  overlay.addColorStop(0.6, 'rgba(0, 10, 8, 0.78)');
  overlay.addColorStop(1, 'rgba(0, 0, 0, 0.93)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  ctx.font = '14px "Courier New", monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  for (const c of cols) {
    for (let i = 0; i < c.trailLen; i++) {
      const y = c.y - i * 16;
      if (y < -16 || y > H + 16) continue;
      const alphaBase = (1 - i / c.trailLen);
      if (i === 0) {
        ctx.fillStyle = `rgba(200, 255, 230, ${0.85})`;
        ctx.shadowColor = 'rgba(34, 197, 94, 0.9)';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = `rgba(34, 197, 94, ${alphaBase * 0.55})`;
        ctx.shadowBlur = 0;
      }
      ctx.fillText(c.chars[i], c.x, y);
    }
  }
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(34, 197, 94, 0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const scanY = ((t * 90) % (H + 200)) - 100;
  const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
  scanGrad.addColorStop(0, 'rgba(34, 197, 94, 0)');
  scanGrad.addColorStop(0.5, 'rgba(110, 231, 183, 0.18)');
  scanGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
  ctx.fillStyle = scanGrad;
  ctx.fillRect(0, scanY - 40, W, 80);

  const vig = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 820);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  const drawBracket = (cx: number, cy: number, dx: number, dy: number, len = 50) => {
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * len);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * len, cy);
    ctx.stroke();
  };
  drawBracket(28, 28, 1, 1);
  drawBracket(W - 28, 28, -1, 1);
  drawBracket(28, H - 28, 1, -1);
  drawBracket(W - 28, H - 28, -1, -1);

  ctx.fillStyle = 'rgba(0, 20, 14, 0.88)';
  ctx.fillRect(0, 0, W, 32);
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 32); ctx.lineTo(W, 32); ctx.stroke();
  ctx.font = '600 11px "Courier New", monospace';
  ctx.fillStyle = 'rgba(134, 239, 172, 0.95)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const cursor = Math.floor(t * 2) % 2 === 0 ? '█' : ' ';
  ctx.fillText(`> SYS://IGNITION_PROGRAM.INIT  ●  STATUS: ACCEPTING_APPLICATIONS  ●  COHORT_2026 ${cursor}`, 18, 16);
  ctx.textAlign = 'right';
  ctx.fillText('ORLANDO_FL // USA', W - 18, 16);

  const logoCX = 270;
  const logoCY = H / 2 + 10;
  const logoH = 320;
  const logoW = (logo.width / logo.height) * logoH;

  const breath = 0.5 + 0.5 * Math.sin(t * 1.6);
  const haloR = 240 + breath * 40;
  const halo = ctx.createRadialGradient(logoCX, logoCY, 20, logoCX, logoCY, haloR);
  halo.addColorStop(0, `rgba(34, 197, 94, ${0.35 + breath * 0.25})`);
  halo.addColorStop(0.5, 'rgba(20, 184, 166, 0.16)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, haloR, 0, Math.PI * 2);
  ctx.fill();

  ctx.drawImage(logo, logoCX - logoW / 2, logoCY - logoH / 2, logoW, logoH);

  const rightX = 530;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.font = '600 12px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(110, 231, 183, 0.95)';
  ctx.fillText('1-WEEK IN-PERSON IMMERSION  ·  ORLANDO, FL', rightX, 130);

  const flicker = 0.85 + 0.15 * Math.sin(t * 14) + 0.05 * Math.sin(t * 33);
  const glowPulse = 18 + 14 * (0.5 + 0.5 * Math.sin(t * 2.2));
  ctx.font = '800 92px "Helvetica Neue", Arial, sans-serif';
  const titleGrad = ctx.createLinearGradient(rightX, 145, rightX, 215);
  titleGrad.addColorStop(0, '#ecfdf5');
  titleGrad.addColorStop(1, '#10b981');
  ctx.fillStyle = titleGrad;
  ctx.shadowColor = `rgba(16, 185, 129, ${0.5 * flicker})`;
  ctx.shadowBlur = glowPulse;
  ctx.globalAlpha = flicker;
  ctx.fillText('IGNITION', rightX, 215);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  ctx.font = '900 italic 44px "Impact", "Oswald", "Helvetica Neue Condensed", "Arial Narrow", sans-serif';
  const progGrad = ctx.createLinearGradient(rightX, 225, rightX, 265);
  progGrad.addColorStop(0, '#ffffff');
  progGrad.addColorStop(1, 'rgba(167, 243, 208, 0.9)');
  ctx.fillStyle = progGrad;
  ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
  ctx.shadowBlur = 14;
  ctx.fillText('PROGRAM', rightX, 260);
  ctx.shadowBlur = 0;

  const divGrad = ctx.createLinearGradient(rightX, 0, rightX + 400, 0);
  divGrad.addColorStop(0, 'rgba(34, 197, 94, 0.9)');
  divGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rightX, 272);
  ctx.lineTo(rightX + 400, 272);
  ctx.stroke();

  ctx.font = '500 17px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText('Expand to the U.S. — Build · Connect · Raise · Hire', rightX, 298);

  ctx.font = '400 13px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(167, 243, 208, 0.85)';
  ctx.fillText('For Seed-stage founders ready to scale in the United States', rightX, 320);

  const ddY = 340;
  const ddText = 'DEMO DAY @ KENNEDY SPACE CENTER';
  ctx.font = '700 12px "Helvetica Neue", Arial, sans-serif';
  const ddW = ctx.measureText(ddText).width + 24;
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(rightX, ddY, ddW, 26, 4);
  ctx.fill();
  ctx.strokeStyle = `rgba(167, 243, 208, ${0.7 + 0.3 * Math.sin(t * 3)})`;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = '#022c22';
  ctx.textBaseline = 'middle';
  ctx.fillText(ddText, rightX + 12, ddY + 14);
  ctx.textBaseline = 'alphabetic';

  const chips = ['AEROSPACE', 'DEEP TECH', 'PHOTONICS', 'A.I.'];
  let chipX = rightX;
  const chipY = 380;
  ctx.font = '600 10.5px "Helvetica Neue", Arial, sans-serif';
  chips.forEach((c) => {
    const tw = ctx.measureText(c).width;
    const cw = tw + 18;
    ctx.fillStyle = 'rgba(6, 78, 59, 0.78)';
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, cw, 22, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#a7f3d0';
    ctx.textBaseline = 'middle';
    ctx.fillText(c, chipX + 9, chipY + 12);
    chipX += cw + 6;
  });
  ctx.textBaseline = 'alphabetic';

  const pillars = [
    { n: '01', t: 'BUILD' },
    { n: '02', t: 'CONNECT' },
    { n: '03', t: 'RAISE' },
    { n: '04', t: 'MENTOR' },
    { n: '05', t: 'HIRE' },
    { n: '06', t: 'DEMO DAY' },
  ];
  const pY = 440;
  const pSpan = 600;
  const pStep = pSpan / pillars.length;
  pillars.forEach((p, i) => {
    const px = rightX + i * pStep;
    const phase = (t * 1.2) % pillars.length;
    const dist = Math.abs(((phase - i + pillars.length) % pillars.length));
    const hi = Math.max(0, 1 - dist * 0.8);
    ctx.font = '700 18px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = `rgba(${110 + hi * 145}, ${231 + hi * 24}, ${183 + hi * 50}, ${0.85 + hi * 0.15})`;
    ctx.shadowColor = 'rgba(16, 185, 129, 0.7)';
    ctx.shadowBlur = hi * 12;
    ctx.fillText(p.n, px, pY);
    ctx.shadowBlur = 0;
    ctx.font = '600 10px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(p.t, px, pY + 14);
  });

  const ctaW = 190;
  const ctaH = 44;
  const ctaX = W - ctaW - 50;
  const ctaY = 530;
  const ctaPulse = 0.5 + 0.5 * Math.sin(t * 2.4);
  const ctaGrad = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaW, ctaY + ctaH);
  ctaGrad.addColorStop(0, '#10b981');
  ctaGrad.addColorStop(1, '#059669');
  ctx.fillStyle = ctaGrad;
  ctx.beginPath();
  ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 6);
  ctx.fill();
  ctx.shadowColor = `rgba(16, 185, 129, ${0.4 + ctaPulse * 0.4})`;
  ctx.shadowBlur = 10 + ctaPulse * 14;
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = '700 14px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#022c22';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMING SOON', ctaX + ctaW / 2, ctaY + ctaH / 2);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
};

const IgnitionProgramAnimatedBanner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const colsRef = useRef<Column[]>(initColumns());
  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number>(performance.now());
  const tSecRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const bg = new window.Image();
    const logo = new window.Image();
    let loaded = 0;
    const done = () => {
      loaded++;
      if (loaded === 2) {
        bgRef.current = bg;
        logoRef.current = logo;
        setReady(true);
      }
    };
    bg.onload = done;
    logo.onload = done;
    bg.src = cosmicBg;
    logo.src = sfhEmblem;
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
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTRef.current) / 1000);
      lastTRef.current = now;
      tSecRef.current += dt;
      stepColumns(colsRef.current, dt);
      drawFrame(ctx, bgRef.current!, logoRef.current!, colsRef.current, tSecRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready]);

  const handleDownloadGif = useCallback(async () => {
    if (!ready || !bgRef.current || !logoRef.current) {
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

      const exportCols = initColumns();

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
        stepColumns(exportCols, 1 / FPS);
        drawFrame(wCtx, bgRef.current!, logoRef.current!, exportCols, t);
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
        a.download = 'ignition-program-animated.gif';
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
            <Flame className="w-5 h-5 text-emerald-400" />
            Ignition Program — Animated GIF
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Live matrix rain · pulsing IGNITION glow · breathing logo halo · sequential pillar wave
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

export default IgnitionProgramAnimatedBanner;
