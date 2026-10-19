import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import GIF from 'gif.js';
import cosmicBg from '@/assets/ignition-cosmic-bg.jpg';
import {
  agentLlama33,
  agentMaverick,
  agentScout,
  agentSpark,
  agentInstant,
} from '@/assets/agents/characters';

const W = 1200;
const H = 630;

// Agents banner — same design system as the Ignition Program banners
// (cosmic bg, emerald matrix rain, HUD brackets, mono status ribbon,
// huge gradient title, chips + numbered bottom row) applied to the new
// SFH Agents platform feature: 5 Llama-powered specialists users can
// create, customize, chain into pipelines and run from the Agents tab.

const TEAM = [
  { role: 'BUILDER', src: agentLlama33 },
  { role: 'LAUNCHER', src: agentMaverick },
  { role: 'ANALYST', src: agentScout },
  { role: 'ARCHITECT', src: agentSpark },
  { role: 'IDEATOR', src: agentInstant },
];

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
  faces: HTMLImageElement[],
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

  // Matrix rain
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

  // Grid
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Scan sweep
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

  // HUD corner brackets
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

  // Top status ribbon
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
  ctx.fillText(`> SYS://AGENTS.INIT  ●  STATUS: NOW_LIVE  ●  NEW_PLATFORM_FEATURE ${cursor}`, 18, 16);
  ctx.textAlign = 'right';
  ctx.fillText('STARTUPFACTORYHUB.COM', W - 18, 16);

  // === LEFT: hero agent portrait in orbit ring + team thumbs ===
  const heroCX = 265;
  const heroCY = 292;
  const heroR = 148;

  const breath = 0.5 + 0.5 * Math.sin(t * 1.6);
  const haloR = heroR + 70 + breath * 34;
  const halo = ctx.createRadialGradient(heroCX, heroCY, 20, heroCX, heroCY, haloR);
  halo.addColorStop(0, `rgba(34, 197, 94, ${0.32 + breath * 0.22})`);
  halo.addColorStop(0.5, 'rgba(20, 184, 166, 0.15)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(heroCX, heroCY, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Rotating dashed orbit ring
  ctx.save();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.lineDashOffset = -t * 22;
  ctx.beginPath();
  ctx.arc(heroCX, heroCY, heroR + 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Orbit satellite dots
  [0, Math.PI * 0.66, Math.PI * 1.33].forEach((off) => {
    const a = t * 0.5 + off;
    const dx = heroCX + Math.cos(a) * (heroR + 16);
    const dy = heroCY + Math.sin(a) * (heroR + 16);
    ctx.fillStyle = '#6ee7b7';
    ctx.shadowColor = 'rgba(16, 185, 129, 0.9)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(dx, dy, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
  ctx.restore();

  // Hero portrait (cover-cropped into the circle)
  const hero = faces[0];
  if (hero) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(heroCX, heroCY, heroR, 0, Math.PI * 2);
    ctx.clip();
    const s = Math.max((heroR * 2) / hero.width, (heroR * 2) / hero.height);
    const iw = hero.width * s;
    const ih = hero.height * s;
    ctx.drawImage(hero, heroCX - iw / 2, heroCY - ih / 2, iw, ih);
    ctx.restore();
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(heroCX, heroCY, heroR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Team thumbs — the other four specialists
  const thumbR = 27;
  const thumbY = 520;
  const thumbGap = 66;
  const thumbStartX = heroCX - (thumbGap * (TEAM.length - 1)) / 2;
  TEAM.forEach((member, i) => {
    const tx = thumbStartX + i * thumbGap;
    const img = faces[i];
    const active = Math.floor(t * 1.2) % TEAM.length === i;
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(tx, thumbY, thumbR, 0, Math.PI * 2);
      ctx.clip();
      const s = Math.max((thumbR * 2) / img.width, (thumbR * 2) / img.height);
      ctx.drawImage(img, tx - (img.width * s) / 2, thumbY - (img.height * s) / 2, img.width * s, img.height * s);
      ctx.restore();
    }
    ctx.strokeStyle = active ? 'rgba(110, 231, 183, 1)' : 'rgba(52, 211, 153, 0.45)';
    ctx.lineWidth = active ? 2.5 : 1.5;
    ctx.shadowColor = active ? 'rgba(16, 185, 129, 0.8)' : 'rgba(0,0,0,0)';
    ctx.shadowBlur = active ? 10 : 0;
    ctx.beginPath();
    ctx.arc(tx, thumbY, thumbR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.font = '600 8.5px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = active ? 'rgba(167, 243, 208, 1)' : 'rgba(255, 255, 255, 0.65)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(member.role, tx, thumbY + thumbR + 15);
  });

  // === RIGHT CONTENT BLOCK ===
  const rightX = 530;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.font = '600 12px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(110, 231, 183, 0.95)';
  ctx.fillText('NEW PLATFORM FEATURE  ·  NOW LIVE IN EVERY DASHBOARD', rightX, 130);

  const flicker = 0.85 + 0.15 * Math.sin(t * 14) + 0.05 * Math.sin(t * 33);
  const glowPulse = 22 + 16 * (0.5 + 0.5 * Math.sin(t * 2.2));
  ctx.font = '800 124px "Helvetica Neue", Arial, sans-serif';
  const titleGrad = ctx.createLinearGradient(rightX, 150, rightX, 240);
  titleGrad.addColorStop(0, '#ecfdf5');
  titleGrad.addColorStop(1, '#10b981');
  ctx.fillStyle = titleGrad;
  ctx.shadowColor = `rgba(16, 185, 129, ${0.55 * flicker})`;
  ctx.shadowBlur = glowPulse;
  ctx.globalAlpha = flicker;
  ctx.fillText('AGENTS', rightX, 240);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  ctx.font = '900 italic 52px "Impact", "Oswald", "Helvetica Neue Condensed", "Arial Narrow", sans-serif';
  const progGrad = ctx.createLinearGradient(rightX, 250, rightX, 295);
  progGrad.addColorStop(0, '#ffffff');
  progGrad.addColorStop(1, 'rgba(167, 243, 208, 0.9)');
  ctx.fillStyle = progGrad;
  ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
  ctx.shadowBlur = 14;
  ctx.fillText('YOUR AI TEAM', rightX, 290);
  ctx.shadowBlur = 0;

  const divGrad = ctx.createLinearGradient(rightX, 0, rightX + 400, 0);
  divGrad.addColorStop(0, 'rgba(34, 197, 94, 0.9)');
  divGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rightX, 308);
  ctx.lineTo(rightX + 400, 308);
  ctx.stroke();

  ctx.font = '500 16px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText('Create your own AI agents — chain them into pipelines', rightX, 332);

  ctx.font = '400 12.5px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(167, 243, 208, 0.85)';
  ctx.fillText('Powered by Meta Llama · 5 specialists · Solo or pipeline runs', rightX, 352);

  // Highlight pill
  const ddY = 370;
  const ddText = 'NOW LIVE — FIND THE "AGENTS" TAB AFTER TOOLS';
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

  // Specialist chips
  const chips = TEAM.map((m) => m.role);
  let chipX = rightX;
  const chipY = 410;
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

  // Workflow row — lights up in sequence
  const steps = [
    { n: '01', t: 'CREATE' },
    { n: '02', t: 'CUSTOMIZE' },
    { n: '03', t: 'CHAIN' },
    { n: '04', t: 'RUN' },
  ];
  const pY = 510;
  const pSpan = 600;
  const pStep = pSpan / steps.length;
  steps.forEach((p, i) => {
    const px = rightX + i * pStep;
    const phase = (t * 1.2) % steps.length;
    const dist = Math.abs(((phase - i + steps.length) % steps.length));
    const hi = Math.max(0, 1 - dist * 0.8);
    ctx.font = '800 30px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = `rgba(${110 + hi * 145}, ${231 + hi * 24}, ${183 + hi * 50}, ${0.9 + hi * 0.1})`;
    ctx.shadowColor = 'rgba(16, 185, 129, 0.7)';
    ctx.shadowBlur = 8 + hi * 14;
    ctx.fillText(p.n, px, pY);
    ctx.shadowBlur = 0;
    ctx.font = '600 11px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.fillText(p.t, px, pY + 20);
  });

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
};

const AgentsAnimatedBanner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const facesRef = useRef<HTMLImageElement[]>([]);
  const colsRef = useRef<Column[]>(initColumns());
  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number>(performance.now());
  const tSecRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const bg = new window.Image();
    const faces: HTMLImageElement[] = TEAM.map(() => new window.Image());
    let loaded = 0;
    const total = 1 + faces.length;
    const done = () => {
      loaded++;
      if (loaded === total) {
        bgRef.current = bg;
        facesRef.current = faces;
        setReady(true);
      }
    };
    bg.onload = done;
    bg.src = cosmicBg;
    faces.forEach((img, i) => {
      img.onload = done;
      img.src = TEAM[i].src;
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
      stepColumns(colsRef.current, dt);
      drawFrame(ctx, bgRef.current!, facesRef.current, colsRef.current, tSecRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready]);

  const handleDownloadGif = useCallback(async () => {
    if (!ready || !bgRef.current) {
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
        drawFrame(wCtx, bgRef.current!, facesRef.current, exportCols, t);
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
        a.download = 'agents-animated.gif';
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
            Agents — Animated GIF
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Live matrix rain · pulsing AGENTS glow · rotating orbit ring · team thumbs light in sequence · sequential workflow wave
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
