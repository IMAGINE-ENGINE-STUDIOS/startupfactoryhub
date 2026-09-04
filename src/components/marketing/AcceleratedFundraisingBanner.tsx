import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Cog, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import GIF from 'gif.js';
import accelBg from '@/assets/accelerated-fundraising-bg.jpg';
import sfhEmblem from '@/assets/sfh-logo-emblem.png';

const W = 1200;
const H = 630;

const TEAL = '20,184,166';
const CYAN = '34,211,238';
const AMBER = '245,158,11';

type Particle = { x: number; y: number; r: number; s: number; a: number };

const initParticles = (): Particle[] =>
  Array.from({ length: 70 }).map(() => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.6 + Math.random() * 1.8,
    s: 6 + Math.random() * 22,
    a: 0.15 + Math.random() * 0.5,
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

// ── Icosahedron geometry (same dynamic element as the program hero) ──
const PHI = (1 + Math.sqrt(5)) / 2;
const RAW_VERTS: number[][] = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
].map(([x, y, z]) => {
  const n = Math.sqrt(x * x + y * y + z * z);
  return [x / n, y / n, z / n];
});
const EDGES: [number, number][] = [];
for (let i = 0; i < RAW_VERTS.length; i++) {
  for (let j = i + 1; j < RAW_VERTS.length; j++) {
    const [ax, ay, az] = RAW_VERTS[i];
    const [bx, by, bz] = RAW_VERTS[j];
    if (Math.hypot(ax - bx, ay - by, az - bz) < 1.1) EDGES.push([i, j]);
  }
}
const SPARKS = Array.from({ length: 42 }, (_, i) => ({
  ang: Math.random() * Math.PI * 2,
  rad: 0.62 + Math.random() * 0.55,
  speed: 0.4 + Math.random() * 0.9,
  tilt: (Math.random() - 0.5) * Math.PI,
  size: 0.8 + Math.random() * 1.6,
  hot: i % 3 === 0,
}));
const rotYv = ([x, y, z]: number[], a: number) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
const rotXv = ([x, y, z]: number[], a: number) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];

/** Rotating amber icosahedron with pulsing energy core — same dynamic element as the program hero. */
const drawIcosahedron = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  t: number,
) => {
  const amber = (a: number) => `rgba(${AMBER},${a})`;
  const amberHot = (a: number) => `rgba(251,191,36,${a})`;
  const cyan = (a: number) => `rgba(${CYAN},${a})`;
  const project = (x: number, y: number, z: number) => {
    const s = 1 / (2.6 - z);
    return { x: cx + x * R * s * 2.6, y: cy + y * R * s * 2.6, s, z };
  };

  const verts = RAW_VERTS.map((v) => rotXv(rotYv(v, t * 1.1), Math.sin(t * 0.6) * 0.35));
  const proj = verts.map((v) => project(v[0], v[1], v[2]));

  // edges with depth shading
  EDGES.forEach(([a, b]) => {
    const pa = proj[a];
    const pb = proj[b];
    const depth = (pa.z + pb.z) / 2;
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.strokeStyle = amber(0.15 + (depth + 1) * 0.28);
    ctx.lineWidth = 0.8 + (depth + 1) * 0.7;
    ctx.stroke();
  });
  // hot vertex glow
  proj.forEach((p, i) => {
    const pulse = 0.5 + 0.5 * Math.sin(t * 5 + i * 1.3);
    ctx.beginPath();
    ctx.arc(p.x, p.y, (1.6 + pulse * 1.6) * (0.6 + p.s), 0, Math.PI * 2);
    ctx.fillStyle = amberHot(0.35 + (p.z + 1) * 0.3);
    ctx.shadowColor = 'rgba(251,191,36,0.9)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // pulsing energy core
  const corePulse = 0.5 + 0.5 * Math.sin(t * 3.4);
  const coreR = R * (0.2 + corePulse * 0.05);
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.6);
  grad.addColorStop(0, amberHot(0.85));
  grad.addColorStop(0.35, amber(0.35));
  grad.addColorStop(1, 'rgba(245,158,11,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, coreR * 2.6, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, coreR * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,240,200,0.95)';
  ctx.fill();

  // orbiting sparks
  SPARKS.forEach((s) => {
    s.ang += 0.01 * s.speed;
    let p = [Math.cos(s.ang) * s.rad, 0, Math.sin(s.ang) * s.rad];
    p = rotXv(p, s.tilt);
    p = rotYv(p, t * 0.5);
    const pr = project(p[0], p[1], p[2]);
    const tw = 0.4 + 0.6 * Math.sin(t * 7 * s.speed + s.ang * 3);
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, s.size * pr.s, 0, Math.PI * 2);
    ctx.fillStyle = s.hot ? amberHot(0.9 * tw) : cyan(0.55 * tw);
    ctx.fill();
  });

  // scan sweep line
  const sy = cy + Math.sin(t * 1.7) * R * 1.3;
  const sweep = ctx.createLinearGradient(cx - R * 1.6, sy, cx + R * 1.6, sy);
  sweep.addColorStop(0, 'rgba(251,191,36,0)');
  sweep.addColorStop(0.5, amberHot(0.28));
  sweep.addColorStop(1, 'rgba(251,191,36,0)');
  ctx.fillStyle = sweep;
  ctx.fillRect(cx - R * 1.6, sy - 1, R * 3.2, 2);
};

const drawFrame = (
  ctx: CanvasRenderingContext2D,
  bg: HTMLImageElement,
  logo: HTMLImageElement,
  ps: Particle[],
  t: number,
) => {
  // ── background image, cover-fit with slow drift ──
  const bgRatio = bg.width / bg.height;
  const cRatio = W / H;
  let dw = W, dh = H, ox = 0, oy = 0;
  if (bgRatio > cRatio) { dw = H * bgRatio; ox = -(dw - W) / 2; }
  else { dh = W / bgRatio; oy = -(dh - H) / 2; }
  ctx.drawImage(bg, ox + Math.sin(t * 0.35) * 6, oy, dw, dh);

  const overlay = ctx.createLinearGradient(0, 0, W, H);
  overlay.addColorStop(0, 'rgba(3, 11, 20, 0.92)');
  overlay.addColorStop(0.55, 'rgba(4, 16, 26, 0.82)');
  overlay.addColorStop(1, 'rgba(2, 8, 16, 0.94)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  // ── ambient glows ──
  const g1 = ctx.createRadialGradient(60, 120, 10, 60, 120, 320);
  g1.addColorStop(0, `rgba(${TEAL},0.30)`);
  g1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(W - 120, H - 60, 10, W - 120, H - 60, 380);
  g2.addColorStop(0, 'rgba(129,140,248,0.26)');
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // ── grid ──
  ctx.strokeStyle = `rgba(${TEAL},0.07)`;
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // ── particles ──
  for (const p of ps) {
    ctx.fillStyle = `rgba(${CYAN},${p.a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── rotating icosahedron (same dynamic element as the program hero) ──
  drawIcosahedron(ctx, W - 230, H / 2 + 50, 148, t);

  // ── radar sweep ring ──
  const rcx = 128, rcy = H - 112, rr = 62;
  ctx.save();
  ctx.beginPath();
  ctx.arc(rcx, rcy, rr, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${TEAL},0.45)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.clip();
  const sweep = t * 1.6;
  const sg = ctx.createLinearGradient(
    rcx, rcy,
    rcx + Math.cos(sweep) * rr, rcy + Math.sin(sweep) * rr,
  );
  sg.addColorStop(0, `rgba(${CYAN},0.45)`);
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.moveTo(rcx, rcy);
  ctx.arc(rcx, rcy, rr, sweep - 0.9, sweep);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── scan line ──
  const scanY = ((t * 110) % (H + 240)) - 120;
  const sc = ctx.createLinearGradient(0, scanY - 46, 0, scanY + 46);
  sc.addColorStop(0, `rgba(${CYAN},0)`);
  sc.addColorStop(0.5, `rgba(${CYAN},0.13)`);
  sc.addColorStop(1, `rgba(${CYAN},0)`);
  ctx.fillStyle = sc;
  ctx.fillRect(0, scanY - 46, W, 92);

  // ── vignette ──
  const vig = ctx.createRadialGradient(W / 2, H / 2, 220, W / 2, H / 2, 820);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // ── corner brackets ──
  const bracket = (cx: number, cy: number, dx: number, dy: number, len = 42) => {
    ctx.strokeStyle = `rgba(${TEAL},0.75)`;
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

  // ── left accent rail with pulsing nodes ──
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

  // ── logo + domain ──
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
  // draw "cover"-style: preserve aspect ratio, center-crop to the square box
  const lw = logo.naturalWidth || logo.width;
  const lh = logo.naturalHeight || logo.height;
  const box = logoR * 2;
  const scale = Math.max(box / lw, box / lh);
  const cropW = box / scale;
  const cropH = box / scale;
  const cropX = (lw - cropW) / 2;
  const cropY = (lh - cropH) / 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(logo, cropX, cropY, cropW, cropH, logoCX - logoR, logoCY - logoR, box, box);
  ctx.restore();
  ctx.strokeStyle = `rgba(${TEAL},0.7)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(logoCX, logoCY, logoR + 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = '600 11px "Courier New", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillText('S T A R T U P F A C T O R Y H U B . C O M', logoCX + logoR + 22, logoCY);

  // ── eyebrow pills ──
  const pillY = 140;
  ctx.font = '700 10.5px "Helvetica Neue", Arial, sans-serif';
  const p1 = 'STARTUP FACTORY HUB  |  SCALE-UP SPRINT';
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

  const p2 = 'APPLICATIONS OPEN';
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

  // ── headline ──
  ctx.textBaseline = 'alphabetic';
  ctx.font = '300 28px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('SCALE YOUR AEROSPACE STARTUP', x0, 210);

  const titleGrad = ctx.createLinearGradient(x0, 0, x0 + 700, 0);
  titleGrad.addColorStop(0, '#f59e0b');
  titleGrad.addColorStop(0.45, '#22d3ee');
  titleGrad.addColorStop(1, '#6366f1');
  ctx.font = '900 64px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = titleGrad;
  ctx.shadowColor = `rgba(${AMBER},${0.35 + 0.2 * Math.sin(t * 2)})`;
  ctx.shadowBlur = 26 + 12 * Math.sin(t * 2);
  ctx.fillText('ACCELERATED', x0, 282);
  ctx.fillText('FUNDRAISING', x0, 348);
  ctx.shadowBlur = 0;

  ctx.font = '300 26px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('SCALE-UP HARDWARE SPRINT', x0, 388);

  // ── divider ──
  const dg = ctx.createLinearGradient(x0, 0, x0 + 460, 0);
  dg.addColorStop(0, `rgba(${TEAL},0.85)`);
  dg.addColorStop(1, `rgba(${TEAL},0)`);
  ctx.strokeStyle = dg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, 406);
  ctx.lineTo(x0 + 460, 406);
  ctx.stroke();

  // ── copy ──
  ctx.font = '500 15px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = `rgba(${AMBER},0.92)`;
  ctx.fillText('For hardware founders in aerospace, defense and space.', x0, 434);
  ctx.font = '400 13px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.58)';
  ctx.fillText('Investor sprints · Strategic introductions · Technology access', x0, 456);

  // ── pillars ──
  const pillars = ['INVESTOR SPRINTS', 'STRATEGIC INTROS', 'TECHNOLOGY ACCESS'];
  let cx2 = x0;
  ctx.font = '700 10px "Helvetica Neue", Arial, sans-serif';
  pillars.forEach((c, i) => {
    const tw = ctx.measureText(c).width;
    const cw = tw + 22;
    const hi = Math.max(0, 1 - Math.abs(((t * 0.9) % 3) - i) * 0.9);
    ctx.fillStyle = `rgba(6,52,60,${0.6 + hi * 0.25})`;
    ctx.beginPath();
    ctx.roundRect(cx2, 480, cw, 24, 4);
    ctx.fill();
    ctx.strokeStyle = `rgba(${CYAN},${0.35 + hi * 0.5})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = `rgba(167,243,208,${0.75 + hi * 0.25})`;
    ctx.textBaseline = 'middle';
    ctx.fillText(c, cx2 + 11, 492);
    ctx.textBaseline = 'alphabetic';
    cx2 += cw + 8;
  });

  // ── CTA ──
  const ctaY = 528;
  const ctaText = 'APPLY NOW →';
  ctx.font = '800 13px "Helvetica Neue", Arial, sans-serif';
  const ctaW = ctx.measureText(ctaText).width + 56;
  const cg = ctx.createLinearGradient(x0, 0, x0 + ctaW, 0);
  cg.addColorStop(0, '#0d9488');
  cg.addColorStop(0.5, '#14b8a6');
  cg.addColorStop(1, '#0d9488');
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

  // ── right HUD panel ──
  const hudX = W - 372;
  const hudY = 250;
  const hudW = 300;
  const rows = ['SCALE-UP SPRINT', 'AEROSPACE HARDWARE', 'HARDWARE SCALE-UP'];
  const hudH = rows.length * 40 + 18;
  ctx.fillStyle = 'rgba(4,14,26,0.82)';
  ctx.beginPath();
  ctx.roundRect(hudX, hudY, hudW, hudH, 12);
  ctx.fill();
  ctx.strokeStyle = `rgba(${TEAL},0.3)`;
  ctx.lineWidth = 1;
  ctx.stroke();
  rows.forEach((v, i) => {
    const ry = hudY + 12 + i * 40;
    ctx.font = '700 17px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(v, hudX + 18, ry + 20);
    if (i < rows.length - 1) {
      ctx.strokeStyle = `rgba(${TEAL},0.16)`;
      ctx.beginPath();
      ctx.moveTo(hudX + 14, ry + 38);
      ctx.lineTo(hudX + hudW - 14, ry + 38);
      ctx.stroke();
    }
  });

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
};

const AcceleratedFundraisingBanner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
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
    bg.src = accelBg;
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
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTRef.current) / 1000);
      lastTRef.current = now;
      tSecRef.current += dt;
      stepParticles(partsRef.current, dt);
      drawFrame(ctx, bgRef.current!, logoRef.current!, partsRef.current, tSecRef.current);
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
    const sCtx = still.getContext('2d')!;
    drawFrame(sCtx, bgRef.current!, logoRef.current!, initParticles(), 1.2);
    return still;
  }, []);

  const downloadStill = useCallback(
    (type: 'image/png' | 'image/jpeg') => {
      if (!ready || !bgRef.current || !logoRef.current) {
        toast.error('Assets not loaded yet');
        return;
      }
      const still = renderStill();
      const url = still.toDataURL(type, type === 'image/jpeg' ? 0.94 : undefined);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accelerated-fundraising-banner.${type === 'image/jpeg' ? 'jpg' : 'png'}`;
      a.click();
      toast.success(`${type === 'image/jpeg' ? 'JPG' : 'PNG'} downloaded`);
    },
    [ready, renderStill],
  );

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
        drawFrame(wCtx, bgRef.current!, logoRef.current!, exportParts, t);
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
        a.download = 'accelerated-fundraising-banner.gif';
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
            <Cog className="w-5 h-5 text-teal-400" />
            Accelerated Fundraising — Marketing Banner
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Same design as the program hero · rotating icosahedron, radar sweep, particles and CTA shine
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
        Still exports: 1200×630 PNG / JPG · GIF: 900×473 · 3s loop · 18 fps
      </p>
    </div>
  );
};

export default AcceleratedFundraisingBanner;
