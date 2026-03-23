import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image } from 'lucide-react';
import { toast } from 'sonner';
import sfhLogo from '@/assets/sfh-logo-sphere.png';
import nasaLogo from '@/assets/nasa-tech-transfer.webp';
import eventBg1 from '@/assets/event-bg-1.jpg';
import eventBg2 from '@/assets/event-bg-2.jpg';
import eventBg3 from '@/assets/event-bg-3.webp';
import eventBg4 from '@/assets/event-bg-4.jpg';
import eventBg5 from '@/assets/event-bg-5.webp';

interface BannerVariant {
  id: string;
  label: string;
  bgSrc: string;
}

const VARIANTS: BannerVariant[] = [
  { id: 'variant-a', label: 'Variant A — Center Stage', bgSrc: eventBg1 },
  { id: 'variant-b', label: 'Variant B — Split Dual', bgSrc: eventBg2 },
  { id: 'variant-c', label: 'Variant C — Minimal Left', bgSrc: eventBg3 },
  { id: 'variant-d', label: 'Variant D — Card Grid', bgSrc: eventBg4 },
  { id: 'variant-e', label: 'Variant E — Bold Type', bgSrc: eventBg5 },
];

const W = 1200;
const H = 630;

// ====== SHARED HELPERS ======

const coverBg = (ctx: CanvasRenderingContext2D, w: number, h: number, img: HTMLImageElement) => {
  const r = img.width / img.height, cr = w / h;
  let dw = w, dh = h, ox = 0, oy = 0;
  if (r > cr) { dw = h * r; ox = -(dw - w) / 2; } else { dh = w / r; oy = -(dh - h) / 2; }
  ctx.drawImage(img, ox, oy, dw, dh);
};

const overlay = (ctx: CanvasRenderingContext2D, w: number, h: number, leftAlpha = 0.95, rightAlpha = 0.65) => {
  const ov = ctx.createLinearGradient(0, 0, w, 0);
  ov.addColorStop(0, `rgba(0,4,15,${leftAlpha})`);
  ov.addColorStop(0.5, `rgba(0,6,20,${(leftAlpha + rightAlpha) / 2})`);
  ov.addColorStop(1, `rgba(0,4,15,${rightAlpha})`);
  ctx.fillStyle = ov; ctx.fillRect(0, 0, w, h);
  const bf = ctx.createLinearGradient(0, h * 0.7, 0, h);
  bf.addColorStop(0, 'rgba(0,4,15,0)'); bf.addColorStop(1, 'rgba(0,4,15,0.8)');
  ctx.fillStyle = bf; ctx.fillRect(0, 0, w, h);
};

const techGrid = (ctx: CanvasRenderingContext2D, w: number, h: number, sp = 50, col = 'rgba(255,107,53,0.04)') => {
  ctx.strokeStyle = col; ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += sp) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += sp) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.fillStyle = col.replace('0.04', '0.10');
  for (let x = 0; x <= w; x += sp) for (let y = 0; y <= h; y += sp) { ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill(); }
};

const cornerBrackets = (ctx: CanvasRenderingContext2D, w: number, h: number, s = 24, g = 16) => {
  ctx.strokeStyle = 'rgba(255,107,53,0.55)'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(g + s, g); ctx.lineTo(g, g); ctx.lineTo(g, g + s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - g - s, g); ctx.lineTo(w - g, g); ctx.lineTo(w - g, g + s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(g + s, h - g); ctx.lineTo(g, h - g); ctx.lineTo(g, h - g - s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - g - s, h - g); ctx.lineTo(w - g, h - g); ctx.lineTo(w - g, h - g - s); ctx.stroke();
};

const accentLine = (ctx: CanvasRenderingContext2D, x: number, y1: number, y2: number, dots: number[]) => {
  ctx.strokeStyle = 'rgba(255,107,53,0.7)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
  dots.forEach(y => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 18);
    g.addColorStop(0, 'rgba(255,107,53,0.65)'); g.addColorStop(1, 'rgba(255,107,53,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6b35'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  });
};

const hexagons = (ctx: CanvasRenderingContext2D, list: { x: number; y: number; r: number; a: number; c?: string }[]) => {
  list.forEach(({ x, y, r, a, c }) => {
    ctx.save();
    ctx.strokeStyle = `${c || '#ff6b35'}${Math.round(a * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const ang = (Math.PI / 3) * i - Math.PI / 6; const px = x + r * Math.cos(ang), py = y + r * Math.sin(ang); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
    ctx.closePath(); ctx.stroke(); ctx.restore();
  });
};

const energyArcs = (ctx: CanvasRenderingContext2D, arcs: { cx: number; cy: number; r: number; s: number; e: number; col: string; a: number }[]) => {
  ctx.save();
  arcs.forEach(arc => {
    ctx.strokeStyle = `${arc.col}${Math.round(arc.a * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 1.5; ctx.setLineDash([8, 12]);
    ctx.beginPath(); ctx.arc(arc.cx, arc.cy, arc.r, arc.s, arc.e); ctx.stroke();
    ctx.setLineDash([]);
  }); ctx.restore();
};

const nodes = (ctx: CanvasRenderingContext2D, list: { x: number; y: number; col: string; a: number }[]) => {
  list.forEach(({ x, y, col, a }) => {
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
    g.addColorStop(0, `${col}${Math.round(a * 255).toString(16).padStart(2, '0')}`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col; ctx.globalAlpha = a * 1.4;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
};

const sfhLogo_ = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, sz: number) => {
  const cx = x + sz / 2, cy = y + sz / 2;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz);
  g.addColorStop(0, 'rgba(255,107,53,0.3)'); g.addColorStop(1, 'rgba(255,107,53,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, sz, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, sz / 2, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(img, x, y, sz, sz); ctx.restore();
  ctx.strokeStyle = 'rgba(255,107,53,0.65)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, sz / 2 + 3, 0, Math.PI * 2); ctx.stroke();
};

const collabBadge = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number) => {
  const bg = ctx.createLinearGradient(x, y, x + w, y);
  bg.addColorStop(0, 'rgba(255,107,53,0.22)'); bg.addColorStop(1, 'rgba(255,107,53,0.04)');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x, y, w, 26, 13); ctx.fill();
  ctx.strokeStyle = 'rgba(255,107,53,0.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, 26, 13); ctx.stroke();
  ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#ff6b35'; ctx.textAlign = 'left';
  ctx.fillText('IN COLLABORATION WITH NASA TECHNOLOGY TRANSFER PROGRAM', x + 10, y + 17);
};

const topicIcon = (ctx: CanvasRenderingContext2D, ix: number, iy: number, i: number, col: string) => {
  ctx.save();
  if (i === 0) {
    ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.fillStyle = `${col}44`;
    ctx.beginPath(); ctx.moveTo(ix, iy - 7); ctx.lineTo(ix + 3.5, iy - 2); ctx.lineTo(ix + 2.5, iy + 4); ctx.lineTo(ix, iy + 2.5); ctx.lineTo(ix - 2.5, iy + 4); ctx.lineTo(ix - 3.5, iy - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(ix - 1.5, iy + 4); ctx.lineTo(ix, iy + 7.5); ctx.lineTo(ix + 1.5, iy + 4); ctx.fill();
  } else if (i === 1) {
    ctx.strokeStyle = col; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(ix, iy, 4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ix, iy, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `${col}55`; ctx.fillRect(ix - 10, iy - 2.5, 4, 5); ctx.fillRect(ix + 6, iy - 2.5, 4, 5);
    ctx.strokeRect(ix - 10, iy - 2.5, 4, 5); ctx.strokeRect(ix + 6, iy - 2.5, 4, 5);
  } else {
    ctx.strokeStyle = col; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(ix, iy, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(ix, iy, 3.5, 7, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ix - 7, iy); ctx.lineTo(ix + 7, iy); ctx.stroke();
  }
  const dg = ctx.createRadialGradient(ix, iy, 0, ix, iy, 14);
  dg.addColorStop(0, `${col}33`); dg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(ix, iy, 14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};

const registerBtn = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.55);
  glow.addColorStop(0, 'rgba(255,107,53,0.28)'); glow.addColorStop(1, 'rgba(255,107,53,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w * 0.55, 0, Math.PI * 2); ctx.fill();
  const bg = ctx.createLinearGradient(x, y, x + w, y);
  bg.addColorStop(0, '#cc4a1a'); bg.addColorStop(0.5, '#ff6b35'); bg.addColorStop(1, '#cc4a1a');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,140,66,0.55)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.stroke();
  ctx.font = `bold ${Math.round(h * 0.33)}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText('REGISTER NOW  \u2192', x + w / 2, y + h / 2 + Math.round(h * 0.11));
};

const freeBadge = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  const bg = ctx.createLinearGradient(x, y, x + w, y);
  bg.addColorStop(0, 'rgba(20,184,166,0.28)'); bg.addColorStop(1, 'rgba(20,184,166,0.08)');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(20,184,166,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.stroke();
  ctx.font = `bold ${Math.round(h * 0.4)}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = '#14b8a6'; ctx.textAlign = 'center';
  ctx.fillText('FREE', x + w / 2, y + h / 2 + Math.round(h * 0.14));
};

const nasaCard = (ctx: CanvasRenderingContext2D, nasa: HTMLImageElement, cx: number, cy: number, cw: number, ch: number) => {
  const x = cx - cw / 2, y = cy - ch / 2;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, cw * 0.65);
  glow.addColorStop(0, 'rgba(255,107,53,0.10)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, cw * 0.65, 0, Math.PI * 2); ctx.fill();
  const cbg = ctx.createLinearGradient(x, y, x, y + ch);
  cbg.addColorStop(0, 'rgba(255,255,255,0.97)'); cbg.addColorStop(1, 'rgba(245,245,245,0.95)');
  ctx.fillStyle = cbg; ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 14); ctx.fill();
  const shimmer = ctx.createLinearGradient(x, y, x + cw * 0.5, y + ch * 0.4);
  shimmer.addColorStop(0, 'rgba(255,107,53,0.05)'); shimmer.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shimmer; ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(255,107,53,0.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x, y, cw, ch, 14); ctx.stroke();
  const ta = ctx.createLinearGradient(x, y, x + cw * 0.6, y);
  ta.addColorStop(0, '#ff6b35'); ta.addColorStop(0.6, 'rgba(255,107,53,0.4)'); ta.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ta; ctx.beginPath(); ctx.roundRect(x, y, cw, 3, [14, 14, 0, 0]); ctx.fill();
  const dotX = x + cw - 14, dotY = y + 14;
  const dg = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 8);
  dg.addColorStop(0, '#ff6b35'); dg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(dotX, dotY, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2); ctx.fill();
  const aspect = nasa.width / nasa.height;
  const pad = Math.min(cw, ch) * 0.12;
  const maxW = cw - pad * 2, maxH = ch - pad * 2 - 20;
  let nw: number, nh: number;
  if (maxW / aspect <= maxH) { nw = maxW; nh = maxW / aspect; } else { nh = maxH; nw = maxH * aspect; }
  ctx.drawImage(nasa, cx - nw / 2, cy - nh / 2 - 6, nw, nh);
  ctx.font = `bold ${Math.max(9, Math.round(ch * 0.06))}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(100,100,100,0.7)'; ctx.textAlign = 'center';
  ctx.fillText('OFFICIAL COLLABORATOR', cx, y + ch - Math.max(10, ch * 0.07));
};

const website = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.font = '400 11px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.textAlign = 'left';
  ctx.fillText('startupfactoryhub.com', x, y);
};

const TOPICS = ['Hot Startups Right Now', 'Technology Transfer Program', "What's New in Space Industry"];
const COLORS = ['#ff6b35', '#ff8c42', '#14b8a6'];

// ====== VARIANT A — Center Stage: NASA card centered right, content left ======
const drawA = (ctx: CanvasRenderingContext2D, bg: HTMLImageElement, logo: HTMLImageElement, nasa: HTMLImageElement) => {
  coverBg(ctx, W, H, bg); overlay(ctx, W, H);
  techGrid(ctx, W, H, 50);
  hexagons(ctx, [
    { x: 80, y: 520, r: 50, a: 0.10 }, { x: 340, y: 60, r: 35, a: 0.08, c: '#14b8a6' },
    { x: 500, y: 430, r: 65, a: 0.06 }, { x: 660, y: 310, r: 55, a: 0.05, c: '#14b8a6' },
  ]);
  energyArcs(ctx, [
    { cx: 300, cy: 315, r: 200, s: -0.3, e: 0.9, col: '#ff6b35', a: 0.08 },
    { cx: 900, cy: 200, r: 150, s: 0.5, e: 2.1, col: '#14b8a6', a: 0.06 },
  ]);
  nodes(ctx, [
    { x: 245, y: 165, col: '#ff6b35', a: 0.30 }, { x: 460, y: 390, col: '#14b8a6', a: 0.22 },
  ]);
  cornerBrackets(ctx, W, H);
  accentLine(ctx, 44, 50, H - 50, [90, 220, 380, 500]);

  sfhLogo_(ctx, logo, 78, 38, 64);
  collabBadge(ctx, 78, 118, 400);

  ctx.font = '300 26px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.textAlign = 'left';
  ctx.fillText('UPCOMING EVENT', 78, 184);
  const hg = ctx.createLinearGradient(78, 220, 500, 220);
  hg.addColorStop(0, '#ff6b35'); hg.addColorStop(0.5, '#ff8c42'); hg.addColorStop(1, '#ffab76');
  ctx.font = '900 64px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = hg;
  ctx.shadowColor = 'rgba(255,107,53,0.5)'; ctx.shadowBlur = 25;
  ctx.fillText('HOT DEALS', 78, 260); ctx.shadowBlur = 0;
  ctx.font = '300 30px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('IN THE SPACE INDUSTRY', 78, 300);
  ctx.font = '400 14px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,140,66,0.95)';
  ctx.fillText('April 16th, 2025  ·  2:00 PM – 3:30 PM EST', 78, 334);
  const dg = ctx.createLinearGradient(78, 0, 480, 0);
  dg.addColorStop(0, 'rgba(255,107,53,0.8)'); dg.addColorStop(1, 'rgba(255,107,53,0)');
  ctx.strokeStyle = dg; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(78, 352); ctx.lineTo(480, 352); ctx.stroke();

  TOPICS.forEach((t, i) => { const ty = 382 + i * 34; topicIcon(ctx, 92, ty, i, COLORS[i]); ctx.font = '400 15px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.textAlign = 'left'; ctx.fillText(t, 112, ty + 5); });

  registerBtn(ctx, 78, 498, 200, 42);
  freeBadge(ctx, 288, 504, 60, 30);

  nasaCard(ctx, nasa, 620 + (W - 620 - 40) / 2, H / 2, W - 620 - 40, H - 80);
  website(ctx, 78, H - 24);
};

// ====== VARIANT B — Split: NASA card top-right, topics as cards bottom-right ======
const drawB = (ctx: CanvasRenderingContext2D, bg: HTMLImageElement, logo: HTMLImageElement, nasa: HTMLImageElement) => {
  coverBg(ctx, W, H, bg); overlay(ctx, W, H, 0.96, 0.72);
  techGrid(ctx, W, H, 55, 'rgba(20,184,166,0.035)');
  hexagons(ctx, [
    { x: 120, y: 500, r: 45, a: 0.09, c: '#14b8a6' }, { x: 400, y: 80, r: 30, a: 0.07 },
    { x: 950, y: 550, r: 50, a: 0.06, c: '#14b8a6' }, { x: 1100, y: 100, r: 35, a: 0.05 },
  ]);
  energyArcs(ctx, [
    { cx: 250, cy: 300, r: 180, s: -0.5, e: 1.0, col: '#14b8a6', a: 0.07 },
    { cx: 1000, cy: 400, r: 160, s: 2.0, e: 4.0, col: '#ff6b35', a: 0.06 },
  ]);
  cornerBrackets(ctx, W, H);

  // Left vertical teal accent
  ctx.strokeStyle = 'rgba(20,184,166,0.6)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(44, 50); ctx.lineTo(44, H - 50); ctx.stroke();
  [90, 200, 350, 490].forEach(y => {
    const g = ctx.createRadialGradient(44, y, 0, 44, y, 16);
    g.addColorStop(0, 'rgba(20,184,166,0.6)'); g.addColorStop(1, 'rgba(20,184,166,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(44, y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#14b8a6'; ctx.beginPath(); ctx.arc(44, y, 4, 0, Math.PI * 2); ctx.fill();
  });

  sfhLogo_(ctx, logo, 74, 36, 60);

  // Badge in teal
  const bx = 74, by = 112, bw = 400;
  const bbg = ctx.createLinearGradient(bx, by, bx + bw, by);
  bbg.addColorStop(0, 'rgba(20,184,166,0.22)'); bbg.addColorStop(1, 'rgba(20,184,166,0.04)');
  ctx.fillStyle = bbg; ctx.beginPath(); ctx.roundRect(bx, by, bw, 26, 13); ctx.fill();
  ctx.strokeStyle = 'rgba(20,184,166,0.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, 26, 13); ctx.stroke();
  ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = '#14b8a6'; ctx.textAlign = 'left';
  ctx.fillText('IN COLLABORATION WITH NASA TECHNOLOGY TRANSFER PROGRAM', bx + 10, by + 17);

  ctx.font = '300 24px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.textAlign = 'left';
  ctx.fillText('UPCOMING EVENT', 74, 178);

  const hg = ctx.createLinearGradient(74, 210, 480, 210);
  hg.addColorStop(0, '#ff6b35'); hg.addColorStop(0.6, '#ff8c42'); hg.addColorStop(1, '#14b8a6');
  ctx.font = '900 58px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = hg;
  ctx.shadowColor = 'rgba(255,107,53,0.45)'; ctx.shadowBlur = 22;
  ctx.fillText('HOT DEALS', 74, 248); ctx.shadowBlur = 0;

  ctx.font = '300 28px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('IN THE SPACE INDUSTRY', 74, 288);

  ctx.font = '400 13px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(20,184,166,0.9)';
  ctx.fillText('April 16th, 2025  ·  2:00 PM – 3:30 PM EST', 74, 318);

  // Topics as mini-cards
  TOPICS.forEach((t, i) => {
    const ty = 346 + i * 48;
    const cw = 440, ch = 40;
    const cbg = ctx.createLinearGradient(74, ty, 74 + cw, ty);
    cbg.addColorStop(0, `${COLORS[i]}18`); cbg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cbg; ctx.beginPath(); ctx.roundRect(74, ty, cw, ch, 8); ctx.fill();
    ctx.strokeStyle = `${COLORS[i]}30`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(74, ty, cw, ch, 8); ctx.stroke();
    topicIcon(ctx, 96, ty + ch / 2, i, COLORS[i]);
    ctx.font = '400 14px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.textAlign = 'left';
    ctx.fillText(t, 118, ty + ch / 2 + 5);
  });

  registerBtn(ctx, 74, 510, 200, 42);
  freeBadge(ctx, 284, 516, 60, 30);

  // NASA card right side — taller
  nasaCard(ctx, nasa, 870, H / 2, 340, H - 80);
  website(ctx, 74, H - 22);
};

// ====== VARIANT C — Minimal Left: huge title, NASA card bottom-right, clean ======
const drawC = (ctx: CanvasRenderingContext2D, bg: HTMLImageElement, logo: HTMLImageElement, nasa: HTMLImageElement) => {
  coverBg(ctx, W, H, bg); overlay(ctx, W, H, 0.93, 0.60);
  techGrid(ctx, W, H, 60, 'rgba(255,107,53,0.03)');
  cornerBrackets(ctx, W, H, 20, 14);

  // Diagonal circuit traces
  ctx.save(); ctx.strokeStyle = 'rgba(255,107,53,0.06)'; ctx.lineWidth = 1;
  ctx.setLineDash([6, 14]);
  [{ x1: 0, y1: 200, x2: 500, y2: H }, { x1: 700, y1: 0, x2: W, y2: 400 }].forEach(l => {
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
  });
  ctx.setLineDash([]); ctx.restore();

  // Minimal pulse rings
  [180, 280, 380].forEach((r, i) => {
    ctx.save(); ctx.strokeStyle = '#ff6b35'; ctx.globalAlpha = 0.04 - i * 0.01; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(W * 0.75, H * 0.45, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  });

  sfhLogo_(ctx, logo, 60, 40, 56);

  ctx.font = '300 18px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'left';
  ctx.fillText('UPCOMING EVENT  |  APRIL 16TH, 2025', 60, 130);

  // Massive title
  const hg = ctx.createLinearGradient(60, 180, 700, 180);
  hg.addColorStop(0, '#ff6b35'); hg.addColorStop(0.6, '#ff8c42'); hg.addColorStop(1, '#ffab76');
  ctx.font = '900 82px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = hg;
  ctx.shadowColor = 'rgba(255,107,53,0.5)'; ctx.shadowBlur = 30;
  ctx.fillText('HOT DEALS', 60, 210); ctx.shadowBlur = 0;

  ctx.font = '200 44px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillText('IN THE SPACE INDUSTRY', 60, 268);

  // Thin divider
  const dg2 = ctx.createLinearGradient(60, 0, 600, 0);
  dg2.addColorStop(0, 'rgba(255,107,53,0.6)'); dg2.addColorStop(1, 'rgba(255,107,53,0)');
  ctx.strokeStyle = dg2; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 290); ctx.lineTo(600, 290); ctx.stroke();

  // Inline topics
  TOPICS.forEach((t, i) => {
    const ty = 320 + i * 32;
    topicIcon(ctx, 76, ty, i, COLORS[i]);
    ctx.font = '400 15px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.textAlign = 'left';
    ctx.fillText(t, 96, ty + 5);
  });

  ctx.font = '400 14px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,140,66,0.9)';
  ctx.fillText('2:00 PM – 3:30 PM EST', 60, 430);

  registerBtn(ctx, 60, 458, 210, 44);
  freeBadge(ctx, 280, 464, 62, 32);

  // NASA collaborator badge
  collabBadge(ctx, 60, 530, 380);

  // NASA card — right bottom
  nasaCard(ctx, nasa, W - 220, H / 2 + 30, 340, 380);
  website(ctx, 60, H - 20);
};

// ====== VARIANT D — Card Grid: 3 topic cards on right side ======
const drawD = (ctx: CanvasRenderingContext2D, bg: HTMLImageElement, logo: HTMLImageElement, nasa: HTMLImageElement) => {
  coverBg(ctx, W, H, bg); overlay(ctx, W, H, 0.94, 0.78);
  techGrid(ctx, W, H, 45, 'rgba(255,140,66,0.035)');
  hexagons(ctx, [
    { x: 100, y: 550, r: 40, a: 0.08 }, { x: 250, y: 50, r: 32, a: 0.07, c: '#14b8a6' },
    { x: 550, y: 520, r: 55, a: 0.05 },
  ]);
  cornerBrackets(ctx, W, H);
  accentLine(ctx, 44, 50, H - 50, [100, 250, 400, 520]);

  sfhLogo_(ctx, logo, 74, 34, 58);
  collabBadge(ctx, 74, 108, 380);

  ctx.font = '300 22px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.textAlign = 'left';
  ctx.fillText('UPCOMING EVENT', 74, 170);

  const hg = ctx.createLinearGradient(74, 200, 450, 200);
  hg.addColorStop(0, '#ff6b35'); hg.addColorStop(0.5, '#ff8c42'); hg.addColorStop(1, '#ffab76');
  ctx.font = '900 56px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = hg;
  ctx.shadowColor = 'rgba(255,107,53,0.45)'; ctx.shadowBlur = 22;
  ctx.fillText('HOT DEALS', 74, 240); ctx.shadowBlur = 0;

  ctx.font = '300 26px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('IN THE SPACE INDUSTRY', 74, 278);

  ctx.font = '400 13px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,140,66,0.95)';
  ctx.fillText('April 16th, 2025  ·  2:00 PM – 3:30 PM EST', 74, 310);

  // NASA card — mid-left
  nasaCard(ctx, nasa, 290, 450, 340, 170);

  registerBtn(ctx, 74, 380, 190, 40);
  freeBadge(ctx, 274, 386, 58, 28);

  // Right side: 3 topic cards
  const cardX = 620, cardW = W - 620 - 30, cardH = (H - 80 - 16) / 3;
  TOPICS.forEach((t, i) => {
    const cy = 40 + i * (cardH + 8);
    // Card bg
    const cbg2 = ctx.createLinearGradient(cardX, cy, cardX, cy + cardH);
    cbg2.addColorStop(0, 'rgba(11,20,40,0.94)'); cbg2.addColorStop(1, 'rgba(6,12,28,0.90)');
    ctx.fillStyle = cbg2; ctx.beginPath(); ctx.roundRect(cardX, cy, cardW, cardH, 12); ctx.fill();
    // Shimmer
    const sh = ctx.createLinearGradient(cardX, cy, cardX + cardW * 0.4, cy + cardH * 0.4);
    sh.addColorStop(0, `${COLORS[i]}0d`); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.roundRect(cardX, cy, cardW, cardH, 12); ctx.fill();
    // Border
    ctx.strokeStyle = `${COLORS[i]}50`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(cardX, cy, cardW, cardH, 12); ctx.stroke();
    // Top accent
    const ta2 = ctx.createLinearGradient(cardX, cy, cardX + cardW * 0.6, cy);
    ta2.addColorStop(0, COLORS[i]); ta2.addColorStop(0.6, `${COLORS[i]}55`); ta2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ta2; ctx.beginPath(); ctx.roundRect(cardX, cy, cardW, 2.5, [12, 12, 0, 0]); ctx.fill();
    // Status dot
    const dx = cardX + cardW - 14, dy = cy + 14;
    const dg2 = ctx.createRadialGradient(dx, dy, 0, dx, dy, 8);
    dg2.addColorStop(0, COLORS[i]); dg2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dg2; ctx.beginPath(); ctx.arc(dx, dy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dx, dy, 2.5, 0, Math.PI * 2); ctx.fill();
    // Icon
    topicIcon(ctx, cardX + 30, cy + cardH / 2, i, COLORS[i]);
    // Text
    ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    ctx.fillText(t, cardX + 54, cy + cardH / 2 + 5);
  });

  website(ctx, 74, H - 20);
};

// ====== VARIANT E — Bold Type: massive typography, NASA card overlapping ======
const drawE = (ctx: CanvasRenderingContext2D, bg: HTMLImageElement, logo: HTMLImageElement, nasa: HTMLImageElement) => {
  coverBg(ctx, W, H, bg); overlay(ctx, W, H, 0.92, 0.68);
  techGrid(ctx, W, H, 50, 'rgba(255,107,53,0.03)');
  hexagons(ctx, [
    { x: 160, y: 480, r: 60, a: 0.08 }, { x: 450, y: 100, r: 40, a: 0.06, c: '#14b8a6' },
    { x: 800, y: 500, r: 50, a: 0.05 },
  ]);
  energyArcs(ctx, [
    { cx: 400, cy: 350, r: 250, s: -0.4, e: 0.8, col: '#ff6b35', a: 0.06 },
    { cx: 900, cy: 200, r: 180, s: 1.0, e: 3.0, col: '#14b8a6', a: 0.05 },
  ]);
  cornerBrackets(ctx, W, H, 26, 16);

  // Double accent lines
  accentLine(ctx, 40, 50, H - 50, [100, 260, 420, 520]);
  ctx.strokeStyle = 'rgba(255,107,53,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(52, 60); ctx.lineTo(52, H - 60); ctx.stroke();

  sfhLogo_(ctx, logo, 74, 32, 54);

  // Compact badge
  ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = '#ff6b35'; ctx.textAlign = 'left';
  ctx.fillText('NASA TECHNOLOGY TRANSFER  |  OFFICIAL COLLABORATOR', 74, 108);

  // MASSIVE stacked type
  ctx.font = '900 96px "Segoe UI", system-ui, sans-serif';
  const hg = ctx.createLinearGradient(74, 150, 700, 150);
  hg.addColorStop(0, '#ff6b35'); hg.addColorStop(0.5, '#ff8c42'); hg.addColorStop(1, '#ffab76');
  ctx.fillStyle = hg;
  ctx.shadowColor = 'rgba(255,107,53,0.55)'; ctx.shadowBlur = 35;
  ctx.fillText('HOT', 74, 200); ctx.shadowBlur = 0;

  ctx.font = '900 96px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText('DEALS', 74, 290);

  ctx.font = '200 22px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('IN THE SPACE INDUSTRY', 78, 328);

  // Divider
  const dg2 = ctx.createLinearGradient(78, 0, 500, 0);
  dg2.addColorStop(0, 'rgba(255,107,53,0.7)'); dg2.addColorStop(1, 'rgba(255,107,53,0)');
  ctx.strokeStyle = dg2; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(78, 346); ctx.lineTo(500, 346); ctx.stroke();

  // Topics horizontal
  TOPICS.forEach((t, i) => {
    const ty = 372 + i * 30;
    topicIcon(ctx, 90, ty, i, COLORS[i]);
    ctx.font = '400 14px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.textAlign = 'left';
    ctx.fillText(t, 110, ty + 4);
  });

  ctx.font = '400 14px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,140,66,0.95)';
  ctx.fillText('April 16th, 2025  ·  2:00 PM – 3:30 PM EST', 78, 474);

  registerBtn(ctx, 78, 498, 210, 44);
  freeBadge(ctx, 298, 504, 62, 32);

  // NASA card — right, slightly overlapping center
  nasaCard(ctx, nasa, W - 240, H / 2, 380, H - 70);
  website(ctx, 78, H - 20);
};

// ====== CANVAS COMPONENT ======

const BannerCanvas = ({ variant }: { variant: BannerVariant }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = 2;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    const bgImg = new window.Image();
    const logoImg = new window.Image();
    const nasaImg = new window.Image();
    let loaded = 0;
    const tryDraw = () => {
      loaded++;
      if (loaded === 3) {
        const fn = { 'variant-a': drawA, 'variant-b': drawB, 'variant-c': drawC, 'variant-d': drawD, 'variant-e': drawE }[variant.id];
        fn?.(ctx, bgImg, logoImg, nasaImg);
        setRendering(false);
      }
    };
    bgImg.onload = tryDraw; logoImg.onload = tryDraw; nasaImg.onload = tryDraw;
    bgImg.src = variant.bgSrc; logoImg.src = sfhLogo; nasaImg.src = nasaLogo;
  }, [variant]);

  const dl = (fmt: 'png' | 'jpg') => {
    const c = canvasRef.current;
    if (!c) return;
    try {
      const a = document.createElement('a');
      a.download = `sfh-hot-deals-${variant.id}.${fmt}`;
      a.href = c.toDataURL(fmt === 'png' ? 'image/png' : 'image/jpeg', 0.95);
      a.click();
      toast.success(`${variant.label} downloaded as ${fmt.toUpperCase()}`);
    } catch { toast.error('Download failed.'); }
  };

  return (
    <div className="tech-card border-0 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{variant.label}</h3>
          <p className="text-xs text-muted-foreground">{W}×{H}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => dl('png')} disabled={rendering} className="gap-1.5 h-7 text-xs">
            <Download className="h-3 w-3" /> PNG
          </Button>
          <Button variant="outline" size="sm" onClick={() => dl('jpg')} disabled={rendering} className="gap-1.5 h-7 text-xs">
            <Image className="h-3 w-3" /> JPG
          </Button>
        </div>
      </div>
      <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '1200/630' }}>
        <canvas ref={canvasRef} className="w-full h-full object-contain rounded-lg" style={{ maxWidth: '100%', height: 'auto' }} />
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              <span className="text-muted-foreground text-xs">Rendering...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SpaceEventBannerFormats = () => (
  <div>
    <div className="tech-card border-0 p-6 mb-6">
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Hot Deals in the Space Industry — Design Variations
      </h2>
      <p className="text-muted-foreground text-sm">
        5 layout variations of the event banner (1200×630). Each features unique content arrangement with full design system elements.
      </p>
    </div>
    <div className="grid gap-6">
      {VARIANTS.map(v => <BannerCanvas key={v.id} variant={v} />)}
    </div>
  </div>
);

export default SpaceEventBannerFormats;
