import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import GIF from 'gif.js';
import planBg from '@/assets/basic-plan-banner-bg.jpg';
import sfhEmblem from '@/assets/sfh-logo-emblem.png';
import foxtailLogoAsset from '@/assets/foxtail-coffee-logo.png.asset.json';

const W = 1200;
const H = 630;

const TEAL = '20,184,166';
const CYAN = '34,211,238';
const INDIGO = '129,140,248';

type Particle = { x: number; y: number; r: number; s: number; a: number };

const initParticles = (): Particle[] =>
  Array.from({ length: 80 }).map(() => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.5 + Math.random() * 1.7,
    s: 5 + Math.random() * 20,
    a: 0.12 + Math.random() * 0.45,
  }));

const stepParticles = (ps: Particle[], dt: number) => {
  for (const p of ps) {
    p.y -= p.s * dt;
    if (p.y < -4) {
      p.y = H + 4;
      p.x = Math.random() * W;
    }
  }
};

/** Rotating constellation sphere — nodes connected by links, evoking the member network. */
const NODES = Array.from({ length: 34 }, (_, i) => {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (i / 33) * 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const th = golden * i;
  return [Math.cos(th) * r, y, Math.sin(th) * r];
});
const LINKS: [number, number][] = [];
for (let i = 0; i < NODES.length; i++) {
  for (let j = i + 1; j < NODES.length; j++) {
    const [ax, ay, az] = NODES[i];
    const [bx, by, bz] = NODES[j];
    if (Math.hypot(ax - bx, ay - by, az - bz) < 0.62) LINKS.push([i, j]);
  }
}
const rotY = ([x, y, z]: number[], a: number) => [
  x * Math.cos(a) + z * Math.sin(a),
  y,
  -x * Math.sin(a) + z * Math.cos(a),
];
const rotX = ([x, y, z]: number[], a: number) => [
  x,
  y * Math.cos(a) - z * Math.sin(a),
  y * Math.sin(a) + z * Math.cos(a),
];

const drawNetworkSphere = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  t: number,
) => {
  const project = (x: number, y: number, z: number) => {
    const s = 1 / (2.7 - z);
    return { x: cx + x * R * s * 2.7, y: cy + y * R * s * 2.7, s, z };
  };
  const verts = NODES.map((v) => rotX(rotY(v, t * 0.42), Math.sin(t * 0.34) * 0.28));
  const proj = verts.map((v) => project(v[0], v[1], v[2]));

  // outer halo
  const halo = ctx.createRadialGradient(cx, cy, R * 0.15, cx, cy, R * 1.6);
  halo.addColorStop(0, `rgba(${CYAN},0.16)`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.6, 0, Math.PI * 2);
  ctx.fill();

  LINKS.forEach(([a, b], i) => {
    const pa = proj[a];
    const pb = proj[b];
    const depth = (pa.z + pb.z) / 2;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2 + i * 0.7);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.strokeStyle = `rgba(${TEAL},${(0.08 + (depth + 1) * 0.16) * (0.6 + pulse * 0.6)})`;
    ctx.lineWidth = 0.7 + (depth + 1) * 0.5;
    ctx.stroke();
  });

  proj.forEach((p, i) => {
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.1 + i * 1.1);
    ctx.beginPath();
    ctx.arc(p.x, p.y, (1.4 + pulse * 1.5) * (0.6 + p.s), 0, Math.PI * 2);
    ctx.fillStyle = i % 4 === 0
      ? `rgba(${CYAN},${0.5 + (p.z + 1) * 0.25})`
      : `rgba(165,243,252,${0.3 + (p.z + 1) * 0.25})`;
    ctx.shadowColor = `rgba(${CYAN},0.85)`;
    ctx.shadowBlur = 9;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // orbit ring
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(t * 0.3) * 0.25);
  ctx.scale(1, 0.32);
  ctx.beginPath();
  ctx.arc(0, 0, R * 1.32, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${INDIGO},0.35)`;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();

  // glowing core
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55);
  core.addColorStop(0, 'rgba(224,255,255,0.85)');
  core.addColorStop(0.4, `rgba(${CYAN},0.28)`);
  core.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2);
  ctx.fill();
};

const drawFrame = (
  ctx: CanvasRenderingContext2D,
  bg: HTMLImageElement,
  logo: HTMLImageElement,
  foxtailLogo: HTMLImageElement,
  ps: Particle[],
  t: number,
) => {
  // background image, cover-fit with slow drift
  const bgRatio = bg.width / bg.height;
  const cRatio = W / H;
  let dw = W, dh = H, ox = 0, oy = 0;
  if (bgRatio > cRatio) { dw = H * bgRatio; ox = -(dw - W) / 2; }
  else { dh = W / bgRatio; oy = -(dh - H) / 2; }
  ctx.drawImage(bg, ox + Math.sin(t * 0.3) * 6, oy, dw, dh);

  const overlay = ctx.createLinearGradient(0, 0, W, H);
  overlay.addColorStop(0, 'rgba(2, 10, 18, 0.93)');
  overlay.addColorStop(0.55, 'rgba(3, 16, 26, 0.8)');
  overlay.addColorStop(1, 'rgba(1, 7, 14, 0.94)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  // ambient glows
  const g1 = ctx.createRadialGradient(70, 130, 10, 70, 130, 330);
  g1.addColorStop(0, `rgba(${TEAL},0.30)`);
  g1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(W - 200, H / 2, 20, W - 200, H / 2, 420);
  g2.addColorStop(0, `rgba(${INDIGO},0.24)`);
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // grid
  ctx.strokeStyle = `rgba(${TEAL},0.06)`;
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // particles
  for (const p of ps) {
    ctx.fillStyle = `rgba(${CYAN},${p.a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawNetworkSphere(ctx, W - 232, H / 2 + 34, 150, t);

  // scan line
  const scanY = ((t * 100) % (H + 240)) - 120;
  const sc = ctx.createLinearGradient(0, scanY - 46, 0, scanY + 46);
  sc.addColorStop(0, `rgba(${CYAN},0)`);
  sc.addColorStop(0.5, `rgba(${CYAN},0.11)`);
  sc.addColorStop(1, `rgba(${CYAN},0)`);
  ctx.fillStyle = sc;
  ctx.fillRect(0, scanY - 46, W, 92);

  // vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, 220, W / 2, H / 2, 820);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // corner brackets
  const bracket = (cx: number, cy: number, dx: number, dy: number, len = 42) => {
    ctx.strokeStyle = `rgba(${TEAL},0.72)`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * len);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * len, cy);
    ctx.stroke();
  };
  bracket(26, 26, 1, 1);
  bracket(W - 26, 26, -1, 1);
  bracket(26, H - 26, 1, -1);
  bracket(W - 26, H - 26, -1, -1);

  // left accent rail
  const railX = 52;
  const rail = ctx.createLinearGradient(0, 70, 0, H - 70);
  rail.addColorStop(0, `rgba(${TEAL},1)`);
  rail.addColorStop(1, `rgba(${TEAL},0.15)`);
  ctx.strokeStyle = rail;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(railX, 70);
  ctx.lineTo(railX, H - 70);
  ctx.stroke();
  [0.12, 0.36, 0.6, 0.84].forEach((f, i) => {
    const y = 70 + (H - 140) * f;
    const pulse = 0.55 + 0.45 * Math.sin(t * 2 + i);
    ctx.fillStyle = `rgba(${TEAL},${0.6 + pulse * 0.4})`;
    ctx.shadowColor = `rgba(${TEAL},0.8)`;
    ctx.shadowBlur = 10 + pulse * 14;
    ctx.beginPath();
    ctx.arc(railX, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  const x0 = 84;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // logo + domain
  const logoR = 34;
  const logoCX = x0 + logoR;
  const logoCY = 78;
  const halo = ctx.createRadialGradient(logoCX, logoCY, 6, logoCX, logoCY, logoR * 2.1);
  halo.addColorStop(0, `rgba(${TEAL},${0.35 + 0.2 * Math.sin(t * 1.6)})`);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, logoR * 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, logoR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  const lw = logo.naturalWidth || logo.width;
  const lh = logo.naturalHeight || logo.height;
  const box = logoR * 2;
  const scale = Math.max(box / lw, box / lh);
  const cropW = box / scale;
  const cropH = box / scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(logo, (lw - cropW) / 2, (lh - cropH) / 2, cropW, cropH, logoCX - logoR, logoCY - logoR, box, box);
  ctx.restore();
  ctx.strokeStyle = `rgba(${TEAL},0.7)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, logoR + 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = '600 11px "Courier New", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('S T A R T U P F A C T O R Y H U B . C O M', logoCX + logoR + 22, logoCY);

  // eyebrow pills
  const pillY = 140;
  ctx.font = '700 10.5px "Helvetica Neue", Arial, sans-serif';
  const p1 = 'STARTUP FACTORY HUB  |  MEMBERS CLUB';
  const p1w = ctx.measureText(p1).width + 30;
  const pg = ctx.createLinearGradient(x0, 0, x0 + p1w, 0);
  pg.addColorStop(0, `rgba(${TEAL},0.28)`);
  pg.addColorStop(1, `rgba(${TEAL},0.04)`);
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.roundRect(x0, pillY - 13, p1w, 26, 13);
  ctx.fill();
  ctx.strokeStyle = `rgba(${TEAL},0.55)`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#5eead4';
  ctx.fillText(p1, x0 + 15, pillY);

  const p2 = 'ORLANDO · MEMBERS ONLY';
  const p2x = x0 + p1w + 12;
  const p2w = ctx.measureText(p2).width + 38;
  ctx.fillStyle = `rgba(${CYAN},0.09)`;
  ctx.beginPath();
  ctx.roundRect(p2x, pillY - 13, p2w, 26, 13);
  ctx.fill();
  ctx.strokeStyle = `rgba(${CYAN},0.5)`;
  ctx.stroke();
  const blink = 0.35 + 0.65 * Math.abs(Math.sin(t * 2.4));
  ctx.fillStyle = `rgba(${CYAN},${blink})`;
  ctx.beginPath();
  ctx.arc(p2x + 15, pillY, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#22d3ee';
  ctx.fillText(p2, p2x + 26, pillY);

  // headline
  ctx.textBaseline = 'alphabetic';
  ctx.font = '300 27px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('YOUR EXCLUSIVE PLACE TO BUILD & CONNECT', x0, 208);

  const titleGrad = ctx.createLinearGradient(x0, 0, x0 + 640, 0);
  titleGrad.addColorStop(0, '#5eead4');
  titleGrad.addColorStop(0.5, '#22d3ee');
  titleGrad.addColorStop(1, '#818cf8');
  ctx.font = '900 62px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = titleGrad;
  ctx.shadowColor = `rgba(${CYAN},${0.32 + 0.2 * Math.sin(t * 2)})`;
  ctx.shadowBlur = 26 + 12 * Math.sin(t * 2);
  ctx.fillText('MEMBERS CLUB', x0, 282);
  ctx.shadowBlur = 0;

  // exclusive location
  ctx.font = '800 18px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('EXCLUSIVE MEMBER LOCATION', x0, 330);
  ctx.font = '500 15px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText('7813 S Orange Ave, Suite 132 · Orlando, FL 32809', x0, 354);

  // divider
  const dg = ctx.createLinearGradient(x0, 0, x0 + 470, 0);
  dg.addColorStop(0, `rgba(${TEAL},0.85)`);
  dg.addColorStop(1, `rgba(${TEAL},0)`);
  ctx.strokeStyle = dg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, 372);
  ctx.lineTo(x0 + 470, 372);
  ctx.stroke();

  // copy
  ctx.font = '500 15px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = `rgba(94,234,212,0.95)`;
  ctx.fillText('A private home base for founders, students, advisors and innovators.', x0, 400);
  ctx.font = '400 13px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.58)';
  ctx.fillText('Connect locally · Build globally · Coffee included for members', x0, 422);

  // benefit chips
  const chips = [
    'EXCLUSIVE ORLANDO ACCESS',
    'COFFEE INCLUDED',
    'FOUNDER COMMUNITY',
    'INVESTORS & MENTORS',
    'EVENTS · AI · RESOURCES',
  ];
  let cx2 = x0;
  let rowY = 452;
  ctx.font = '700 10px "Helvetica Neue", Arial, sans-serif';
  chips.forEach((c, i) => {
    const tw = ctx.measureText(c).width;
    const cw = tw + 22;
    if (cx2 + cw > W - 430) { cx2 = x0; rowY += 30; }
    const hi = Math.max(0, 1 - Math.abs(((t * 0.9) % chips.length) - i) * 0.9);
    ctx.fillStyle = `rgba(6,48,58,${0.6 + hi * 0.25})`;
    ctx.beginPath();
    ctx.roundRect(cx2, rowY, cw, 24, 4);
    ctx.fill();
    ctx.strokeStyle = `rgba(${CYAN},${0.32 + hi * 0.5})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = `rgba(167,243,208,${0.75 + hi * 0.25})`;
    ctx.textBaseline = 'middle';
    ctx.fillText(c, cx2 + 11, rowY + 12);
    ctx.textBaseline = 'alphabetic';
    cx2 += cw + 8;
  });

  // CTA
  const ctaY = 540;
  const ctaText = 'REQUEST MEMBERSHIP →';
  ctx.font = '800 13px "Helvetica Neue", Arial, sans-serif';
  const ctaW = ctx.measureText(ctaText).width + 56;
  const cg = ctx.createLinearGradient(x0, 0, x0 + ctaW, 0);
  cg.addColorStop(0, '#0d9488');
  cg.addColorStop(0.5, '#14b8a6');
  cg.addColorStop(1, '#0e7490');
  ctx.fillStyle = cg;
  ctx.shadowColor = `rgba(${TEAL},0.7)`;
  ctx.shadowBlur = 22 + 10 * Math.sin(t * 2.2);
  ctx.beginPath();
  ctx.roundRect(x0, ctaY, ctaW, 44, 22);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(${CYAN},0.6)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(ctaText, x0 + 28, ctaY + 22);

  // Foxtail Coffee Co. — supporting location partner logo
  const partnerX = W - 370;
  const partnerY = H - 112;
  const partnerW = 196;
  const partnerH = 66;
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  ctx.beginPath();
  ctx.roundRect(partnerX, partnerY, partnerW, partnerH, 8);
  ctx.fill();
  ctx.strokeStyle = `rgba(${TEAL},0.42)`;
  ctx.lineWidth = 1;
  ctx.stroke();
  const fw = foxtailLogo.naturalWidth || foxtailLogo.width;
  const fh = foxtailLogo.naturalHeight || foxtailLogo.height;
  const fit = Math.min((partnerW - 34) / fw, (partnerH - 22) / fh);
  const drawW = fw * fit;
  const drawH = fh * fit;
  ctx.drawImage(
    foxtailLogo,
    partnerX + (partnerW - drawW) / 2,
    partnerY + (partnerH - drawH) / 2,
    drawW,
    drawH,
  );
  ctx.font = '700 8px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.48)';
  ctx.textAlign = 'center';
  ctx.fillText('COFFEE INCLUDED AT THE MEMBERS CLUB', partnerX + partnerW / 2, partnerY - 10);

  // shine sweep across CTA
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x0, ctaY, ctaW, 44, 22);
  ctx.clip();
  const shineX = x0 + ((t * 260) % (ctaW + 200)) - 100;
  const sh = ctx.createLinearGradient(shineX - 40, 0, shineX + 40, 0);
  sh.addColorStop(0, 'rgba(255,255,255,0)');
  sh.addColorStop(0.5, 'rgba(255,255,255,0.32)');
  sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(shineX - 40, ctaY, 80, 44);
  ctx.restore();

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
};

const BasicPlanBanner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const foxtailLogoRef = useRef<HTMLImageElement | null>(null);
  const partsRef = useRef<Particle[]>(initParticles());
  const rafRef = useRef<number | null>(null);
  const lastTRef = useRef<number>(performance.now());
  const tSecRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const bg = new window.Image();
    const logo = new window.Image();
    const foxtailLogo = new window.Image();
    let loaded = 0;
    const done = () => {
      loaded++;
      if (loaded === 3) {
        bgRef.current = bg;
        logoRef.current = logo;
        foxtailLogoRef.current = foxtailLogo;
        setReady(true);
      }
    };
    bg.onload = done;
    logo.onload = done;
    foxtailLogo.onload = done;
    bg.src = planBg;
    logo.src = sfhEmblem;
    foxtailLogo.src = foxtailLogoAsset.url;
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
      stepParticles(partsRef.current, dt);
      const bg = bgRef.current;
      const logo = logoRef.current;
      const foxtailLogo = foxtailLogoRef.current;
      if (!bg || !logo || !foxtailLogo) return;
      drawFrame(ctx, bg, logo, foxtailLogo, partsRef.current, tSecRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready]);

  const renderStill = useCallback(() => {
    const still = document.createElement('canvas');
    still.width = W;
    still.height = H;
    const sCtx = still.getContext('2d');
    const bg = bgRef.current;
    const logo = logoRef.current;
    const foxtailLogo = foxtailLogoRef.current;
    if (!sCtx || !bg || !logo || !foxtailLogo) return null;
    drawFrame(sCtx, bg, logo, foxtailLogo, initParticles(), 1.2);
    return still;
  }, []);

  const downloadStill = useCallback(
    (type: 'image/png' | 'image/jpeg') => {
      if (!ready || !bgRef.current || !logoRef.current || !foxtailLogoRef.current) {
        toast.error('Assets not loaded yet');
        return;
      }
      const still = renderStill();
      if (!still) {
        toast.error('Unable to render banner');
        return;
      }
      const url = still.toDataURL(type, type === 'image/jpeg' ? 0.94 : undefined);
      const a = document.createElement('a');
      a.href = url;
      a.download = `members-club-banner.${type === 'image/jpeg' ? 'jpg' : 'png'}`;
      a.click();
      toast.success(`${type === 'image/jpeg' ? 'JPG' : 'PNG'} downloaded`);
    },
    [ready, renderStill],
  );

  const handleDownloadGif = useCallback(async () => {
    if (!ready || !bgRef.current || !logoRef.current || !foxtailLogoRef.current) {
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
      const exCtx = exportCanvas.getContext('2d');

      const work = document.createElement('canvas');
      work.width = W;
      work.height = H;
      const wCtx = work.getContext('2d');
      const bg = bgRef.current;
      const logo = logoRef.current;
      const foxtailLogo = foxtailLogoRef.current;
      if (!exCtx || !wCtx || !bg || !logo || !foxtailLogo) {
        throw new Error('Unable to initialize banner renderer');
      }

      const exportParts = initParticles();

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
        stepParticles(exportParts, 1 / FPS);
        drawFrame(wCtx, bg, logo, foxtailLogo, exportParts, t);
        exCtx.clearRect(0, 0, EXPORT_W, EXPORT_H);
        exCtx.imageSmoothingEnabled = true;
        exCtx.imageSmoothingQuality = 'high';
        exCtx.drawImage(work, 0, 0, EXPORT_W, EXPORT_H);
        gif.addFrame(exCtx, { copy: true, delay: FRAME_DELAY });
        setProgress(Math.round(((f + 1) / FRAMES) * 50));
        if (f % 4 === 0) await new Promise((r) => setTimeout(r, 0));
      }

      gif.on('progress', (p: number) => setProgress(50 + Math.round(p * 50)));

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'members-club-banner.gif';
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
            <Sparkles className="w-5 h-5 text-primary" />
            Members Club — Marketing Banner
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Exclusive Orlando member location · coffee included · 1200×630 social format
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => downloadStill('image/png')} disabled={!ready} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            PNG
          </Button>
          <Button onClick={() => downloadStill('image/jpeg')} disabled={!ready} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            JPG
          </Button>
          <Button onClick={handleDownloadGif} disabled={!ready || isGenerating} size="sm">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {progress}%
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                GIF
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-border bg-background">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
            <div className="flex items-center gap-2 text-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading assets…
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="w-full h-auto block" />
      </div>

      <p className="text-xs text-muted-foreground">
        Still exports: 1200×630 PNG / JPG · GIF: 900×473 · 3s loop · 18 fps
      </p>
    </div>
  );
};

export default BasicPlanBanner;
