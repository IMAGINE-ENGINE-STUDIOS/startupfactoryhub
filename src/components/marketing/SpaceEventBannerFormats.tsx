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

interface BannerFormat {
  id: string;
  label: string;
  width: number;
  height: number;
  bgSrc: string;
}

const FORMATS: BannerFormat[] = [
  { id: 'ig-square', label: 'Instagram Square', width: 1080, height: 1080, bgSrc: eventBg1 },
  { id: 'ig-story', label: 'Instagram Story', width: 1080, height: 1920, bgSrc: eventBg2 },
  { id: 'twitter-header', label: 'Twitter / X Header', width: 1500, height: 500, bgSrc: eventBg3 },
  { id: 'fb-cover', label: 'Facebook Cover', width: 820, height: 312, bgSrc: eventBg4 },
  { id: 'linkedin', label: 'LinkedIn Post', width: 1200, height: 627, bgSrc: eventBg5 },
];

// ====== SHARED DRAWING HELPERS ======

const drawCoverBg = (ctx: CanvasRenderingContext2D, w: number, h: number, img: HTMLImageElement) => {
  const bgR = img.width / img.height;
  const cR = w / h;
  let dw = w, dh = h, ox = 0, oy = 0;
  if (bgR > cR) { dw = h * bgR; ox = -(dw - w) / 2; }
  else { dh = w / bgR; oy = -(dh - h) / 2; }
  ctx.drawImage(img, ox, oy, dw, dh);
};

const drawOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  const ov = ctx.createLinearGradient(0, 0, w, 0);
  ov.addColorStop(0, 'rgba(0,4,15,0.95)');
  ov.addColorStop(0.5, 'rgba(0,6,20,0.88)');
  ov.addColorStop(1, 'rgba(0,4,15,0.70)');
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, w, h);
  const bf = ctx.createLinearGradient(0, h * 0.7, 0, h);
  bf.addColorStop(0, 'rgba(0,4,15,0)');
  bf.addColorStop(1, 'rgba(0,4,15,0.85)');
  ctx.fillStyle = bf;
  ctx.fillRect(0, 0, w, h);
};

const drawTechGrid = (ctx: CanvasRenderingContext2D, w: number, h: number, spacing: number) => {
  ctx.strokeStyle = 'rgba(255,107,53,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y <= h; y += spacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,107,53,0.10)';
  for (let x = 0; x <= w; x += spacing) {
    for (let y = 0; y <= h; y += spacing) {
      ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
    }
  }
};

const drawCornerBrackets = (ctx: CanvasRenderingContext2D, w: number, h: number, bSize = 22, bGap = 14) => {
  ctx.strokeStyle = 'rgba(255,107,53,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bGap + bSize, bGap); ctx.lineTo(bGap, bGap); ctx.lineTo(bGap, bGap + bSize); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - bGap - bSize, bGap); ctx.lineTo(w - bGap, bGap); ctx.lineTo(w - bGap, bGap + bSize); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bGap + bSize, h - bGap); ctx.lineTo(bGap, h - bGap); ctx.lineTo(bGap, h - bGap - bSize); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w - bGap - bSize, h - bGap); ctx.lineTo(w - bGap, h - bGap); ctx.lineTo(w - bGap, h - bGap - bSize); ctx.stroke();
};

const drawAccentLine = (ctx: CanvasRenderingContext2D, h: number, x: number, topM: number, botM: number) => {
  ctx.strokeStyle = 'rgba(255,107,53,0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x, topM); ctx.lineTo(x, h - botM); ctx.stroke();
  const dots = [topM + 30, topM + (h - topM - botM) * 0.35, topM + (h - topM - botM) * 0.65, h - botM - 30];
  dots.forEach(y => {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 18);
    glow.addColorStop(0, 'rgba(255,107,53,0.7)');
    glow.addColorStop(1, 'rgba(255,107,53,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  });
};

const drawHexagons = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  const hexes = [
    { x: w * 0.08, y: h * 0.82, r: Math.min(w, h) * 0.04, a: 0.10, c: '#ff6b35' },
    { x: w * 0.28, y: h * 0.1, r: Math.min(w, h) * 0.03, a: 0.08, c: '#14b8a6' },
    { x: w * 0.75, y: h * 0.7, r: Math.min(w, h) * 0.05, a: 0.06, c: '#ff6b35' },
    { x: w * 0.55, y: h * 0.3, r: Math.min(w, h) * 0.035, a: 0.07, c: '#14b8a6' },
    { x: w * 0.9, y: h * 0.15, r: Math.min(w, h) * 0.03, a: 0.06, c: '#ff8c42' },
  ];
  hexes.forEach(({ x, y, r, a, c }) => {
    ctx.save();
    ctx.strokeStyle = `${c}${Math.round(a * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI / 3) * i - Math.PI / 6;
      const px = x + r * Math.cos(ang), py = y + r * Math.sin(ang);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  });
};

const drawEnergyArcs = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.save();
  [
    { cx: w * 0.25, cy: h * 0.5, r: Math.min(w, h) * 0.2, s: -0.3, e: 0.9, col: '#ff6b35', a: 0.08 },
    { cx: w * 0.75, cy: h * 0.3, r: Math.min(w, h) * 0.15, s: 0.5, e: 2.1, col: '#14b8a6', a: 0.07 },
    { cx: w * 0.5, cy: h * 0.8, r: Math.min(w, h) * 0.18, s: 3.5, e: 5.5, col: '#ff8c42', a: 0.06 },
  ].forEach(arc => {
    ctx.strokeStyle = `${arc.col}${Math.round(arc.a * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 12]);
    ctx.beginPath(); ctx.arc(arc.cx, arc.cy, arc.r, arc.s, arc.e); ctx.stroke();
    ctx.setLineDash([]);
  });
  ctx.restore();
};

const drawNodes = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  [
    { x: w * 0.2, y: h * 0.25, col: '#ff6b35', a: 0.3 },
    { x: w * 0.6, y: h * 0.6, col: '#14b8a6', a: 0.25 },
    { x: w * 0.4, y: h * 0.85, col: '#ff8c42', a: 0.2 },
  ].forEach(({ x, y, col, a }) => {
    ctx.save();
    const ng = ctx.createRadialGradient(x, y, 0, x, y, 16);
    ng.addColorStop(0, `${col}${Math.round(a * 255).toString(16).padStart(2, '0')}`);
    ng.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col; ctx.globalAlpha = a * 1.4;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
};

const drawSfhLogo = (ctx: CanvasRenderingContext2D, logoImg: HTMLImageElement, x: number, y: number, size: number) => {
  const cx = x + size / 2, cy = y + size / 2;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size);
  glow.addColorStop(0, 'rgba(255,107,53,0.35)');
  glow.addColorStop(1, 'rgba(255,107,53,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, size, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, size / 2, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(logoImg, x, y, size, size);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,107,53,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, size / 2 + 3, 0, Math.PI * 2); ctx.stroke();
};

const drawCollabBadge = (ctx: CanvasRenderingContext2D, x: number, y: number, maxW: number) => {
  const bW = Math.min(maxW, 400), bH = 26;
  const bg = ctx.createLinearGradient(x, y, x + bW, y);
  bg.addColorStop(0, 'rgba(255,107,53,0.25)');
  bg.addColorStop(1, 'rgba(255,107,53,0.05)');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(x, y, bW, bH, 13); ctx.fill();
  ctx.strokeStyle = 'rgba(255,107,53,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, bW, bH, 13); ctx.stroke();
  ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#ff6b35';
  ctx.textAlign = 'left';
  ctx.fillText('IN COLLABORATION WITH NASA TECHNOLOGY TRANSFER PROGRAM', x + 10, y + 17);
};

const drawTopicIcon = (ctx: CanvasRenderingContext2D, ix: number, iy: number, index: number, color: string) => {
  ctx.save();
  if (index === 0) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.fillStyle = `${color}44`;
    ctx.beginPath();
    ctx.moveTo(ix, iy - 7); ctx.lineTo(ix + 3.5, iy - 2); ctx.lineTo(ix + 2.5, iy + 4);
    ctx.lineTo(ix, iy + 2.5); ctx.lineTo(ix - 2.5, iy + 4); ctx.lineTo(ix - 3.5, iy - 2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(ix - 1.5, iy + 4); ctx.lineTo(ix, iy + 7.5); ctx.lineTo(ix + 1.5, iy + 4); ctx.fill();
  } else if (index === 1) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(ix, iy, 4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(ix, iy, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `${color}55`;
    ctx.fillRect(ix - 10, iy - 2.5, 4, 5);
    ctx.fillRect(ix + 6, iy - 2.5, 4, 5);
    ctx.strokeRect(ix - 10, iy - 2.5, 4, 5);
    ctx.strokeRect(ix + 6, iy - 2.5, 4, 5);
  } else {
    ctx.strokeStyle = color; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(ix, iy, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(ix, iy, 3.5, 7, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ix - 7, iy); ctx.lineTo(ix + 7, iy); ctx.stroke();
  }
  const dg = ctx.createRadialGradient(ix, iy, 0, ix, iy, 14);
  dg.addColorStop(0, `${color}33`);
  dg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = dg;
  ctx.beginPath(); ctx.arc(ix, iy, 14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};

const drawRegisterBtn = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.6);
  glow.addColorStop(0, 'rgba(255,107,53,0.3)');
  glow.addColorStop(1, 'rgba(255,107,53,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, w * 0.6, 0, Math.PI * 2); ctx.fill();
  const bg = ctx.createLinearGradient(x, y, x + w, y);
  bg.addColorStop(0, '#cc4a1a');
  bg.addColorStop(0.5, '#ff6b35');
  bg.addColorStop(1, '#cc4a1a');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,140,66,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.stroke();
  ctx.font = `bold ${Math.max(11, Math.round(h * 0.33))}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('REGISTER NOW  \u2192', x + w / 2, y + h / 2 + Math.round(h * 0.12));
};

const drawFreeBadge = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  const bg = ctx.createLinearGradient(x, y, x + w, y);
  bg.addColorStop(0, 'rgba(20,184,166,0.3)');
  bg.addColorStop(1, 'rgba(20,184,166,0.1)');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(20,184,166,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.stroke();
  ctx.font = `bold ${Math.max(10, Math.round(h * 0.38))}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = '#14b8a6';
  ctx.textAlign = 'center';
  ctx.fillText('FREE', x + w / 2, y + h / 2 + Math.round(h * 0.14));
};

const drawNasaCard = (
  ctx: CanvasRenderingContext2D,
  nasaImg: HTMLImageElement,
  cx: number, cy: number, cardW: number, cardH: number
) => {
  const cardX = cx - cardW / 2, cardY = cy - cardH / 2;
  // Glow
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, cardW * 0.7);
  glow.addColorStop(0, 'rgba(255,107,53,0.10)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, cardW * 0.7, 0, Math.PI * 2); ctx.fill();
  // Card bg
  const cbg = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  cbg.addColorStop(0, 'rgba(255,255,255,0.97)');
  cbg.addColorStop(1, 'rgba(245,245,245,0.95)');
  ctx.fillStyle = cbg;
  ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 14); ctx.fill();
  // Shimmer
  const shimmer = ctx.createLinearGradient(cardX, cardY, cardX + cardW * 0.5, cardY + cardH * 0.4);
  shimmer.addColorStop(0, 'rgba(255,107,53,0.05)');
  shimmer.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shimmer;
  ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 14); ctx.fill();
  // Border
  ctx.strokeStyle = 'rgba(255,107,53,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, cardH, 14); ctx.stroke();
  // Top accent
  const ta = ctx.createLinearGradient(cardX, cardY, cardX + cardW * 0.6, cardY);
  ta.addColorStop(0, '#ff6b35');
  ta.addColorStop(0.6, 'rgba(255,107,53,0.4)');
  ta.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ta;
  ctx.beginPath(); ctx.roundRect(cardX, cardY, cardW, 3, [14, 14, 0, 0]); ctx.fill();
  // Status dot
  const dotX = cardX + cardW - 14, dotY = cardY + 14;
  const dg = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 8);
  dg.addColorStop(0, '#ff6b35'); dg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(dotX, dotY, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2); ctx.fill();
  // NASA logo
  const pad = Math.min(cardW, cardH) * 0.12;
  const aspect = nasaImg.width / nasaImg.height;
  const maxW = cardW - pad * 2, maxH = cardH - pad * 2 - 20;
  let nw: number, nh: number;
  if (maxW / aspect <= maxH) { nw = maxW; nh = maxW / aspect; }
  else { nh = maxH; nw = maxH * aspect; }
  ctx.drawImage(nasaImg, cx - nw / 2, cy - nh / 2 - 8, nw, nh);
  // Label
  ctx.font = `bold ${Math.max(9, Math.round(cardH * 0.06))}px "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(100,100,100,0.7)';
  ctx.textAlign = 'center';
  ctx.fillText('OFFICIAL COLLABORATOR', cx, cardY + cardH - Math.max(10, cardH * 0.06));
};

// ====== FORMAT-SPECIFIC DRAW FUNCTIONS ======

const drawInstagramSquare = (ctx: CanvasRenderingContext2D, w: number, h: number, bg: HTMLImageElement, logo: HTMLImageElement, nasa: HTMLImageElement) => {
  drawCoverBg(ctx, w, h, bg);
  drawOverlay(ctx, w, h);
  drawTechGrid(ctx, w, h, 45);
  drawHexagons(ctx, w, h);
  drawEnergyArcs(ctx, w, h);
  drawNodes(ctx, w, h);
  drawCornerBrackets(ctx, w, h);
  drawAccentLine(ctx, h, 36, 40, 40);

  drawSfhLogo(ctx, logo, 60, 36, 56);
  drawCollabBadge(ctx, 60, 106, w - 120);

  ctx.font = '300 24px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'left';
  ctx.fillText('UPCOMING EVENT', 60, 168);

  const hotGrad = ctx.createLinearGradient(60, 200, 500, 200);
  hotGrad.addColorStop(0, '#ff6b35');
  hotGrad.addColorStop(0.5, '#ff8c42');
  hotGrad.addColorStop(1, '#ffab76');
  ctx.font = '900 64px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = hotGrad;
  ctx.shadowColor = 'rgba(255,107,53,0.5)';
  ctx.shadowBlur = 25;
  ctx.fillText('HOT DEALS', 60, 240);
  ctx.shadowBlur = 0;

  ctx.font = '300 28px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('IN THE SPACE INDUSTRY', 60, 280);

  ctx.font = '400 14px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,140,66,0.95)';
  ctx.fillText('April 16th, 2025  ·  2:00 PM – 3:30 PM EST', 60, 310);

  const divG = ctx.createLinearGradient(60, 0, 400, 0);
  divG.addColorStop(0, 'rgba(255,107,53,0.8)');
  divG.addColorStop(1, 'rgba(255,107,53,0)');
  ctx.strokeStyle = divG;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, 326); ctx.lineTo(400, 326); ctx.stroke();

  const topics = ['Hot Startups Right Now', 'Technology Transfer Program', "What's New in Space Industry"];
  const colors = ['#ff6b35', '#ff8c42', '#14b8a6'];
  topics.forEach((t, i) => {
    const ty = 354 + i * 34;
    drawTopicIcon(ctx, 74, ty, i, colors[i]);
    ctx.font = '400 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText(t, 94, ty + 5);
  });

  drawRegisterBtn(ctx, 60, 460, 200, 42);
  drawFreeBadge(ctx, 270, 466, 60, 30);

  // NASA card — bottom half
  drawNasaCard(ctx, nasa, w / 2, 730, w * 0.7, 280);

  ctx.font = '400 11px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'left';
  ctx.fillText('startupfactoryhub.com', 60, h - 30);
};

const drawInstagramStory = (ctx: CanvasRenderingContext2D, w: number, h: number, bg: HTMLImageElement, logo: HTMLImageElement, nasa: HTMLImageElement) => {
  drawCoverBg(ctx, w, h, bg);
  drawOverlay(ctx, w, h);
  drawTechGrid(ctx, w, h, 50);
  drawHexagons(ctx, w, h);
  drawEnergyArcs(ctx, w, h);
  drawNodes(ctx, w, h);
  drawCornerBrackets(ctx, w, h, 26, 16);
  drawAccentLine(ctx, h, 36, 40, 40);

  drawSfhLogo(ctx, logo, 60, 60, 64);
  drawCollabBadge(ctx, 60, 142, w - 120);

  ctx.font = '300 26px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'left';
  ctx.fillText('UPCOMING EVENT', 60, 220);

  const hotGrad = ctx.createLinearGradient(60, 260, 600, 260);
  hotGrad.addColorStop(0, '#ff6b35');
  hotGrad.addColorStop(0.5, '#ff8c42');
  hotGrad.addColorStop(1, '#ffab76');
  ctx.font = '900 72px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = hotGrad;
  ctx.shadowColor = 'rgba(255,107,53,0.5)';
  ctx.shadowBlur = 28;
  ctx.fillText('HOT DEALS', 60, 310);
  ctx.shadowBlur = 0;

  ctx.font = '300 30px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('IN THE SPACE', 60, 360);
  ctx.fillText('INDUSTRY', 60, 398);

  ctx.font = '400 16px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,140,66,0.95)';
  ctx.fillText('April 16th, 2025', 60, 440);
  ctx.fillText('2:00 PM – 3:30 PM EST', 60, 462);

  const divG = ctx.createLinearGradient(60, 0, 450, 0);
  divG.addColorStop(0, 'rgba(255,107,53,0.8)');
  divG.addColorStop(1, 'rgba(255,107,53,0)');
  ctx.strokeStyle = divG;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, 484); ctx.lineTo(450, 484); ctx.stroke();

  const topics = ['Hot Startups Right Now', 'Technology Transfer Program', "What's New in Space Industry"];
  const colors = ['#ff6b35', '#ff8c42', '#14b8a6'];
  topics.forEach((t, i) => {
    const ty = 520 + i * 44;
    drawTopicIcon(ctx, 78, ty, i, colors[i]);
    ctx.font = '400 17px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText(t, 100, ty + 6);
  });

  drawRegisterBtn(ctx, 60, 670, 240, 50);
  drawFreeBadge(ctx, 316, 678, 70, 34);

  // NASA card — large centered bottom
  drawNasaCard(ctx, nasa, w / 2, 1050, w * 0.82, 380);

  // Pulse rings
  [{ cx: w / 2, cy: 1400, col: '#ff6b35' }].forEach(p => {
    [80, 140, 200].forEach((r, ri) => {
      ctx.save();
      ctx.strokeStyle = p.col;
      ctx.globalAlpha = 0.05 - ri * 0.012;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.cx, p.cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
  });

  ctx.font = '400 12px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'center';
  ctx.fillText('startupfactoryhub.com', w / 2, h - 50);
};

const drawTwitterHeader = (ctx: CanvasRenderingContext2D, w: number, h: number, bg: HTMLImageElement, logo: HTMLImageElement, nasa: HTMLImageElement) => {
  drawCoverBg(ctx, w, h, bg);
  drawOverlay(ctx, w, h);
  drawTechGrid(ctx, w, h, 40);
  drawHexagons(ctx, w, h);
  drawEnergyArcs(ctx, w, h);
  drawCornerBrackets(ctx, w, h, 18, 10);
  drawAccentLine(ctx, h, 30, 30, 30);

  drawSfhLogo(ctx, logo, 50, (h - 44) / 2 - 40, 44);
  
  // Compact layout for wide format
  ctx.font = '300 16px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'left';
  ctx.fillText('UPCOMING EVENT', 110, h * 0.3);

  const hotGrad = ctx.createLinearGradient(110, h * 0.4, 500, h * 0.4);
  hotGrad.addColorStop(0, '#ff6b35');
  hotGrad.addColorStop(0.5, '#ff8c42');
  hotGrad.addColorStop(1, '#ffab76');
  ctx.font = '900 48px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = hotGrad;
  ctx.shadowColor = 'rgba(255,107,53,0.4)';
  ctx.shadowBlur = 20;
  ctx.fillText('HOT DEALS', 110, h * 0.62);
  ctx.shadowBlur = 0;

  ctx.font = '300 20px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('IN THE SPACE INDUSTRY', 110, h * 0.78);

  ctx.font = '400 11px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,140,66,0.95)';
  ctx.fillText('April 16th, 2025  ·  2:00 PM – 3:30 PM EST', 110, h * 0.92);

  // Topics inline mid-section
  const topics = ['Hot Startups', 'Tech Transfer', 'Space News'];
  const colors = ['#ff6b35', '#ff8c42', '#14b8a6'];
  topics.forEach((t, i) => {
    const tx = 520 + i * 160;
    drawTopicIcon(ctx, tx, h * 0.42, i, colors[i]);
    ctx.font = '400 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(t, tx, h * 0.62);
  });

  drawRegisterBtn(ctx, 520, h * 0.68, 160, 34);
  drawFreeBadge(ctx, 690, h * 0.70, 52, 26);

  // NASA card right
  drawNasaCard(ctx, nasa, w - 200, h / 2, 280, h - 60);

  ctx.font = '400 10px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.textAlign = 'left';
  ctx.fillText('startupfactoryhub.com', 110, h - 16);
};

const drawFacebookCover = (ctx: CanvasRenderingContext2D, w: number, h: number, bg: HTMLImageElement, logo: HTMLImageElement, nasa: HTMLImageElement) => {
  drawCoverBg(ctx, w, h, bg);
  drawOverlay(ctx, w, h);
  drawTechGrid(ctx, w, h, 35);
  drawHexagons(ctx, w, h);
  drawCornerBrackets(ctx, w, h, 14, 8);

  drawSfhLogo(ctx, logo, 20, (h - 36) / 2 - 30, 36);

  ctx.font = '300 12px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.textAlign = 'left';
  ctx.fillText('UPCOMING EVENT', 70, h * 0.28);

  const hotGrad = ctx.createLinearGradient(70, h * 0.4, 380, h * 0.4);
  hotGrad.addColorStop(0, '#ff6b35');
  hotGrad.addColorStop(0.5, '#ff8c42');
  hotGrad.addColorStop(1, '#ffab76');
  ctx.font = '900 36px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = hotGrad;
  ctx.shadowColor = 'rgba(255,107,53,0.4)';
  ctx.shadowBlur = 16;
  ctx.fillText('HOT DEALS', 70, h * 0.58);
  ctx.shadowBlur = 0;

  ctx.font = '300 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('IN THE SPACE INDUSTRY', 70, h * 0.76);

  ctx.font = '400 10px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,140,66,0.95)';
  ctx.fillText('April 16th, 2025 · 2:00 PM – 3:30 PM EST', 70, h * 0.92);

  // Compact topics
  const topics = ['Hot Startups', 'Tech Transfer', 'Space News'];
  const colors = ['#ff6b35', '#ff8c42', '#14b8a6'];
  topics.forEach((t, i) => {
    const tx = 400 + i * 110;
    drawTopicIcon(ctx, tx, h * 0.35, i, colors[i]);
    ctx.font = '400 10px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(t, tx, h * 0.56);
  });

  drawRegisterBtn(ctx, 400, h * 0.66, 120, 28);
  drawFreeBadge(ctx, 528, h * 0.68, 44, 22);

  // NASA card compact right
  drawNasaCard(ctx, nasa, w - 110, h / 2, 160, h - 40);
};

const drawLinkedIn = (ctx: CanvasRenderingContext2D, w: number, h: number, bg: HTMLImageElement, logo: HTMLImageElement, nasa: HTMLImageElement) => {
  drawCoverBg(ctx, w, h, bg);
  drawOverlay(ctx, w, h);
  drawTechGrid(ctx, w, h, 50);
  drawHexagons(ctx, w, h);
  drawEnergyArcs(ctx, w, h);
  drawNodes(ctx, w, h);
  drawCornerBrackets(ctx, w, h);
  drawAccentLine(ctx, h, 44, 45, 45);

  drawSfhLogo(ctx, logo, 74, 36, 64);
  drawCollabBadge(ctx, 74, 116, 420);

  ctx.font = '300 26px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'left';
  ctx.fillText('UPCOMING EVENT', 74, 178);

  const hotGrad = ctx.createLinearGradient(74, 210, 500, 210);
  hotGrad.addColorStop(0, '#ff6b35');
  hotGrad.addColorStop(0.5, '#ff8c42');
  hotGrad.addColorStop(1, '#ffab76');
  ctx.font = '900 62px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = hotGrad;
  ctx.shadowColor = 'rgba(255,107,53,0.5)';
  ctx.shadowBlur = 25;
  ctx.fillText('HOT DEALS', 74, 252);
  ctx.shadowBlur = 0;

  ctx.font = '300 28px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('IN THE SPACE INDUSTRY', 74, 290);

  ctx.font = '400 14px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,140,66,0.95)';
  ctx.fillText('April 16th, 2025  ·  2:00 PM – 3:30 PM EST', 74, 322);

  const divG = ctx.createLinearGradient(74, 0, 480, 0);
  divG.addColorStop(0, 'rgba(255,107,53,0.8)');
  divG.addColorStop(1, 'rgba(255,107,53,0)');
  ctx.strokeStyle = divG;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(74, 340); ctx.lineTo(480, 340); ctx.stroke();

  const topics = ['Hot Startups Right Now', 'Technology Transfer Program', "What's New in Space Industry"];
  const colors = ['#ff6b35', '#ff8c42', '#14b8a6'];
  topics.forEach((t, i) => {
    const ty = 368 + i * 34;
    drawTopicIcon(ctx, 88, ty, i, colors[i]);
    ctx.font = '400 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText(t, 108, ty + 5);
  });

  drawRegisterBtn(ctx, 74, 488, 200, 42);
  drawFreeBadge(ctx, 284, 494, 60, 30);

  // NASA card right side
  const nasaCardW = w - 620 - 40;
  drawNasaCard(ctx, nasa, 620 + nasaCardW / 2, h / 2, nasaCardW, h - 80);

  ctx.font = '400 11px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'left';
  ctx.fillText('startupfactoryhub.com', 74, h - 24);
};

// ====== INDIVIDUAL BANNER CANVAS ======

const BannerCanvas = ({ format }: { format: BannerFormat }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = 2;
    canvas.width = format.width * dpr;
    canvas.height = format.height * dpr;
    canvas.style.width = `${format.width}px`;
    canvas.style.height = `${format.height}px`;
    ctx.scale(dpr, dpr);

    const bgImg = new window.Image();
    const logoImg = new window.Image();
    const nasaImg = new window.Image();
    let loaded = 0;
    const tryDraw = () => {
      loaded++;
      if (loaded === 3) {
        const drawFn = {
          'ig-square': drawInstagramSquare,
          'ig-story': drawInstagramStory,
          'twitter-header': drawTwitterHeader,
          'fb-cover': drawFacebookCover,
          'linkedin': drawLinkedIn,
        }[format.id];
        if (drawFn) drawFn(ctx, format.width, format.height, bgImg, logoImg, nasaImg);
        setIsRendering(false);
      }
    };
    bgImg.onload = tryDraw;
    logoImg.onload = tryDraw;
    nasaImg.onload = tryDraw;
    bgImg.src = format.bgSrc;
    logoImg.src = sfhLogo;
    nasaImg.src = nasaLogo;
  }, [format]);

  const downloadImage = (fmt: 'png' | 'jpg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement('a');
      link.download = `sfh-hot-deals-${format.id}.${fmt}`;
      link.href = canvas.toDataURL(fmt === 'png' ? 'image/png' : 'image/jpeg', 0.95);
      link.click();
      toast.success(`${format.label} banner downloaded as ${fmt.toUpperCase()}`);
    } catch {
      toast.error('Download failed.');
    }
  };

  return (
    <div className="tech-card border-0 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{format.label}</h3>
          <p className="text-xs text-muted-foreground">{format.width}×{format.height}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => downloadImage('png')} disabled={isRendering} className="gap-1.5 h-7 text-xs">
            <Download className="h-3 w-3" />
            PNG
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadImage('jpg')} disabled={isRendering} className="gap-1.5 h-7 text-xs">
            <Image className="h-3 w-3" />
            JPG
          </Button>
        </div>
      </div>
      <div className="relative w-full overflow-hidden rounded-lg bg-muted/20" style={{ aspectRatio: `${format.width}/${format.height}` }}>
        <canvas ref={canvasRef} className="w-full h-full object-contain" style={{ maxWidth: '100%', height: 'auto' }} />
        {isRendering && (
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

// ====== MAIN COMPONENT ======

const SpaceEventBannerFormats = () => {
  return (
    <div>
      <div className="tech-card border-0 p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Hot Deals in the Space Industry — Format Variations
        </h2>
        <p className="text-muted-foreground text-sm">
          5 banner formats optimized for different social media platforms. Each includes full design system elements.
        </p>
      </div>
      <div className="grid gap-6">
        {FORMATS.map(f => (
          <BannerCanvas key={f.id} format={f} />
        ))}
      </div>
    </div>
  );
};

export default SpaceEventBannerFormats;
