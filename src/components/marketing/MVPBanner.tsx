import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image } from 'lucide-react';
import { toast } from 'sonner';
import sfhLogo from '@/assets/sfh-logo-sphere.png';
import mvpBg from '@/assets/mvp-program-bg.jpg';

const MVPBanner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = 2;
    const displayWidth = 1200;
    const displayHeight = 630;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.scale(dpr, dpr);

    const bgImage = new window.Image();
    const logoImage = new window.Image();

    let loadedCount = 0;

    const tryDraw = () => {
      loadedCount++;
      if (loadedCount === 2) {
        drawBanner(ctx, displayWidth, displayHeight, bgImage, logoImage);
        setIsRendering(false);
      }
    };

    bgImage.onload = tryDraw;
    logoImage.onload = tryDraw;

    bgImage.src = mvpBg;
    logoImage.src = sfhLogo;
  }, []);

  const drawBanner = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bgImage: HTMLImageElement,
    logoImage: HTMLImageElement,
  ) => {
    // === BACKGROUND ===
    const bgRatio = bgImage.width / bgImage.height;
    const canvasRatio = width / height;
    let dw = width, dh = height, ox = 0, oy = 0;
    if (bgRatio > canvasRatio) { dw = height * bgRatio; ox = -(dw - width) / 2; }
    else { dh = width / bgRatio; oy = -(dh - height) / 2; }
    ctx.drawImage(bgImage, ox, oy, dw, dh);

    // Deep blue-tech overlay — left side darker for content readability
    const overlay = ctx.createLinearGradient(0, 0, width, 0);
    overlay.addColorStop(0, 'rgba(0, 8, 20, 0.97)');
    overlay.addColorStop(0.45, 'rgba(0, 10, 25, 0.92)');
    overlay.addColorStop(0.7, 'rgba(0, 10, 25, 0.75)');
    overlay.addColorStop(1, 'rgba(0, 5, 15, 0.55)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    // Bottom gradient fade
    const bottomFade = ctx.createLinearGradient(0, height * 0.7, 0, height);
    bottomFade.addColorStop(0, 'rgba(0,8,20,0)');
    bottomFade.addColorStop(1, 'rgba(0,8,20,0.85)');
    ctx.fillStyle = bottomFade;
    ctx.fillRect(0, 0, width, height);

    // === TECH GRID (full canvas) ===
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.045)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    // Grid intersection dots
    ctx.fillStyle = 'rgba(20, 184, 166, 0.15)';
    for (let x = 0; x <= width; x += 50) {
      for (let y = 0; y <= height; y += 50) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // === DIAGONAL CIRCUIT TRACES ===
    ctx.save();
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.08)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 14]);
    const diagLines = [
      { x1: 0, y1: 180, x2: 440, y2: 620 },
      { x1: 60, y1: 0, x2: 560, y2: 500 },
      { x1: width * 0.55, y1: 0, x2: width, y2: height * 0.55 },
      { x1: width * 0.38, y1: height, x2: width, y2: height * 0.2 },
      { x1: 0, y1: height * 0.55, x2: width * 0.3, y2: 0 },
    ];
    diagLines.forEach(l => {
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();

    // === FLOATING HEXAGONS (background geometry) ===
    const drawBgHex = (hx: number, hy: number, hr: number, alpha: number, color = '#14b8a6') => {
      ctx.save();
      ctx.strokeStyle = `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const ang = (Math.PI / 3) * a - Math.PI / 6;
        const px = hx + hr * Math.cos(ang), py = hy + hr * Math.sin(ang);
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      ctx.restore();
    };
    [
      { x: 80,  y: 520, r: 55,  a: 0.12 },
      { x: 340, y: 60,  r: 38,  a: 0.09 },
      { x: 500, y: 430, r: 70,  a: 0.07, c: '#22d3ee' },
      { x: 160, y: 300, r: 28,  a: 0.08 },
      { x: 420, y: 200, r: 48,  a: 0.06, c: '#818cf8' },
      { x: 750, y: 560, r: 36,  a: 0.06, c: '#22d3ee' },
      { x: 940, y: 80,  r: 44,  a: 0.07, c: '#818cf8' },
      { x: 1120,y: 420, r: 32,  a: 0.06 },
      { x: 660, y: 310, r: 60,  a: 0.05, c: '#818cf8' },
      { x: 270, y: 580, r: 42,  a: 0.07 },
    ].forEach(h => drawBgHex(h.x, h.y, h.r, h.a, (h as any).c));

    // === ENERGY ARCS ===
    ctx.save();
    [
      { cx: 300, cy: 315, r: 200, s: -0.3, e: 0.9, col: '#14b8a6', a: 0.12 },
      { cx: 550, cy: 80,  r: 140, s: 0.5,  e: 2.1, col: '#22d3ee', a: 0.09 },
      { cx: 100, cy: 450, r: 160, s: 3.5,  e: 5.5, col: '#14b8a6', a: 0.08 },
      { cx: 900, cy: 500, r: 180, s: 1.2,  e: 3.2, col: '#818cf8', a: 0.09 },
      { cx: 1050,cy: 150, r: 120, s: 0.2,  e: 1.8, col: '#22d3ee', a: 0.07 },
    ].forEach(arc => {
      ctx.strokeStyle = `${arc.col}${Math.round(arc.a * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.beginPath(); ctx.arc(arc.cx, arc.cy, arc.r, arc.s, arc.e); ctx.stroke();
      ctx.setLineDash([]);
    });
    ctx.restore();

    // === CIRCUIT NODE CLUSTERS ===
    const drawNode = (nx: number, ny: number, col: string, alpha: number) => {
      ctx.save();
      const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, 18);
      ng.addColorStop(0, `${col}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`);
      ng.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(nx, ny, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col; ctx.globalAlpha = alpha * 1.4;
      ctx.beginPath(); ctx.arc(nx, ny, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };
    [
      { x: 245, y: 165, col: '#14b8a6', a: 0.35 },
      { x: 460, y: 390, col: '#22d3ee', a: 0.28 },
      { x: 130, y: 420, col: '#818cf8', a: 0.22 },
      { x: 380, y: 520, col: '#14b8a6', a: 0.20 },
      { x: 505, y: 120, col: '#22d3ee', a: 0.18 },
    ].forEach(n => drawNode(n.x, n.y, n.col, n.a));

    // === RADIAL PULSE RINGS ===
    [
      { cx: 300, cy: 315, col: '#14b8a6' },
      { cx: 900, cy: 315, col: '#818cf8' },
    ].forEach(p => {
      [60, 110, 165].forEach((r, ri) => {
        ctx.save();
        ctx.strokeStyle = p.col;
        ctx.globalAlpha = 0.06 - ri * 0.015;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.cx, p.cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      });
    });

    // === VERTICAL ACCENT LINE ===
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(44, 50);
    ctx.lineTo(44, height - 50);
    ctx.stroke();

    // Glowing dots on accent line
    [90, 220, 380, 500].forEach(y => {
      const glow = ctx.createRadialGradient(44, y, 0, 44, y, 22);
      glow.addColorStop(0, 'rgba(20, 184, 166, 0.7)');
      glow.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(44, y, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#14b8a6';
      ctx.beginPath(); ctx.arc(44, y, 5, 0, Math.PI * 2); ctx.fill();
    });

    // === CORNER BRACKETS ===
    const bSize = 28, bGap = 18;
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.6)';
    ctx.lineWidth = 2.5;
    // TL
    ctx.beginPath(); ctx.moveTo(bGap + bSize, bGap); ctx.lineTo(bGap, bGap); ctx.lineTo(bGap, bGap + bSize); ctx.stroke();
    // TR
    ctx.beginPath(); ctx.moveTo(width - bGap - bSize, bGap); ctx.lineTo(width - bGap, bGap); ctx.lineTo(width - bGap, bGap + bSize); ctx.stroke();
    // BL
    ctx.beginPath(); ctx.moveTo(bGap + bSize, height - bGap); ctx.lineTo(bGap, height - bGap); ctx.lineTo(bGap, height - bGap - bSize); ctx.stroke();
    // BR
    ctx.beginPath(); ctx.moveTo(width - bGap - bSize, height - bGap); ctx.lineTo(width - bGap, height - bGap); ctx.lineTo(width - bGap, height - bGap - bSize); ctx.stroke();

    // === LOGO (top-left) ===
    const logoSize = 72;
    const logoX = 78, logoY = 40;
    const logoGlow = ctx.createRadialGradient(logoX + logoSize / 2, logoY + logoSize / 2, 0, logoX + logoSize / 2, logoY + logoSize / 2, logoSize);
    logoGlow.addColorStop(0, 'rgba(20, 184, 166, 0.4)');
    logoGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = logoGlow;
    ctx.beginPath(); ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    ctx.restore();
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2); ctx.stroke();

    // === PROGRAM BADGE ===
    const badgeX = 80, badgeY = 130;
    const badgeW = 330, badgeH = 30;
    const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
    badgeGrad.addColorStop(0, 'rgba(20, 184, 166, 0.25)');
    badgeGrad.addColorStop(1, 'rgba(20, 184, 166, 0.05)');
    ctx.fillStyle = badgeGrad;
    ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 15); ctx.fill();
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 15); ctx.stroke();

    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#14b8a6';
    ctx.textAlign = 'left';
    ctx.fillText('STARTUP FACTORY HUB  |  4-WEEK PROGRAM', badgeX + 12, badgeY + 20);

    // === HEADLINE ===
    ctx.font = '300 38px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText('LAUNCH YOUR STARTUPS', 80, 208);

    const mvpGrad = ctx.createLinearGradient(80, 240, 560, 240);
    mvpGrad.addColorStop(0, '#14b8a6');
    mvpGrad.addColorStop(0.45, '#22d3ee');
    mvpGrad.addColorStop(1, '#818cf8');
    ctx.font = '900 78px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = mvpGrad;
    ctx.shadowColor = 'rgba(20, 184, 166, 0.6)';
    ctx.shadowBlur = 28;
    ctx.fillText('MVP', 80, 298);
    ctx.shadowBlur = 0;

    ctx.font = '300 38px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('SOFTWARE STARTUP', 80, 348);

    // Subheadline
    ctx.font = '400 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.9)';
    ctx.fillText('Functionally MVP software — built, validated & launched in 4 weeks.', 80, 380);

    // === DIVIDER ===
    const divGrad = ctx.createLinearGradient(80, 0, 480, 0);
    divGrad.addColorStop(0, 'rgba(20, 184, 166, 0.8)');
    divGrad.addColorStop(0.6, 'rgba(20, 184, 166, 0.3)');
    divGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(80, 398); ctx.lineTo(480, 398); ctx.stroke();

    // === 8-WEEK BUTTON (purple, styled like APPLY NOW) ===
    const wkX = 80, wkY = 416, wkW = 170, wkH = 44;
    const wkGlow = ctx.createRadialGradient(wkX + wkW / 2, wkY + wkH / 2, 0, wkX + wkW / 2, wkY + wkH / 2, 110);
    wkGlow.addColorStop(0, 'rgba(129,140,248,0.45)');
    wkGlow.addColorStop(1, 'rgba(129,140,248,0)');
    ctx.fillStyle = wkGlow;
    ctx.beginPath(); ctx.arc(wkX + wkW / 2, wkY + wkH / 2, 110, 0, Math.PI * 2); ctx.fill();
    const wkGrad = ctx.createLinearGradient(wkX, wkY, wkX + wkW, wkY);
    wkGrad.addColorStop(0, '#4f46e5');
    wkGrad.addColorStop(0.5, '#818cf8');
    wkGrad.addColorStop(1, '#4f46e5');
    ctx.fillStyle = wkGrad;
    ctx.beginPath(); ctx.roundRect(wkX, wkY, wkW, wkH, 22); ctx.fill();
    ctx.strokeStyle = 'rgba(167,139,250,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(wkX, wkY, wkW, wkH, 22); ctx.stroke();
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('8-WEEK PROGRAM', wkX + wkW / 2, wkY + wkH / 2 + 5);

    // === CTA BUTTON (teal APPLY NOW) ===
    const btnX = 80, btnY = 474, btnW = 200, btnH = 44;
    const btnGlow = ctx.createRadialGradient(btnX + btnW / 2, btnY + btnH / 2, 0, btnX + btnW / 2, btnY + btnH / 2, 120);
    btnGlow.addColorStop(0, 'rgba(20, 184, 166, 0.35)');
    btnGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = btnGlow;
    ctx.beginPath(); ctx.arc(btnX + btnW / 2, btnY + btnH / 2, 120, 0, Math.PI * 2); ctx.fill();
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
    btnGrad.addColorStop(0, '#0d9488');
    btnGrad.addColorStop(0.5, '#14b8a6');
    btnGrad.addColorStop(1, '#0d9488');
    ctx.fillStyle = btnGrad;
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 22); ctx.fill();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 22); ctx.stroke();
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('APPLY NOW  →', btnX + btnW / 2, btnY + btnH / 2 + 5);

    // === WEBSITE ===
    ctx.font = '400 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'left';
    ctx.fillText('startupfactoryhub.com', 80, 545);

    // =========================================================
    // === CANVAS VECTOR ICON HELPERS ===
    // =========================================================
    const drawHex = (hcx: number, hcy: number, hr: number) => {
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const angle = (Math.PI / 3) * a - Math.PI / 6;
        const px = hcx + hr * Math.cos(angle), py = hcy + hr * Math.sin(angle);
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const drawIconMentorship = (icx: number, icy: number, ir: number, col: string) => {
      const off = ir * 0.42;
      [-off, off].forEach(dx => {
        const hx2 = icx + dx, hy2 = icy - ir * 0.18;
        ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.fillStyle = `${col}33`;
        ctx.beginPath(); ctx.arc(hx2, hy2 - ir * 0.2, ir * 0.23, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(hx2, hy2 + ir * 0.3, ir * 0.32, Math.PI, 0); ctx.stroke();
      });
      ctx.strokeStyle = `${col}77`; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(icx - off + ir * 0.14, icy - ir * 0.18); ctx.lineTo(icx + off - ir * 0.14, icy - ir * 0.18); ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawIconAdvising = (icx: number, icy: number, ir: number, col: string) => {
      ctx.strokeStyle = col; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(icx, icy, ir * 0.7, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(icx, icy, ir * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(icx, icy); ctx.lineTo(icx + ir * 0.08, icy - ir * 0.55); ctx.lineTo(icx - ir * 0.08, icy - ir * 0.26); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `${col}55`;
      ctx.beginPath(); ctx.moveTo(icx, icy); ctx.lineTo(icx - ir * 0.08, icy + ir * 0.55); ctx.lineTo(icx + ir * 0.08, icy + ir * 0.26); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `${col}66`; ctx.lineWidth = 1.2;
      [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(a => {
        ctx.beginPath(); ctx.moveTo(icx + Math.cos(a) * ir * 0.6, icy + Math.sin(a) * ir * 0.6);
        ctx.lineTo(icx + Math.cos(a) * ir * 0.72, icy + Math.sin(a) * ir * 0.72); ctx.stroke();
      });
    };

    const drawIconDeckPitch = (icx: number, icy: number, ir: number, col: string) => {
      const sw2 = ir * 1.2, sh2 = ir * 0.88;
      ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.fillStyle = `${col}22`;
      ctx.beginPath(); ctx.roundRect(icx - sw2 / 2, icy - sh2 / 2 - ir * 0.06, sw2, sh2, 4); ctx.fill(); ctx.stroke();
      const bw2 = ir * 0.17, bGap2 = ir * 0.07, barBase2 = icy + sh2 / 2 - ir * 0.18;
      [0.4, 0.7, 0.55, 0.9].forEach((h, idx) => {
        const bx2 = icx - sw2 / 2 + ir * 0.16 + idx * (bw2 + bGap2);
        ctx.fillStyle = idx === 3 ? col : `${col}77`;
        ctx.beginPath(); ctx.rect(bx2, barBase2 - sh2 * 0.55 * h, bw2, sh2 * 0.55 * h); ctx.fill();
      });
      ctx.strokeStyle = col; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(icx, icy + sh2 / 2 - ir * 0.06); ctx.lineTo(icx, icy + sh2 / 2 + ir * 0.18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(icx - ir * 0.26, icy + sh2 / 2 + ir * 0.18); ctx.lineTo(icx + ir * 0.26, icy + sh2 / 2 + ir * 0.18); ctx.stroke();
    };

    const drawIconBusinessPlan = (icx: number, icy: number, ir: number, col: string) => {
      const dw2 = ir * 0.88, dh2 = ir * 1.08, fold = ir * 0.22;
      const dx2 = icx - dw2 / 2, dy2 = icy - dh2 / 2;
      ctx.fillStyle = `${col}22`; ctx.strokeStyle = col; ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(dx2, dy2); ctx.lineTo(dx2 + dw2 - fold, dy2);
      ctx.lineTo(dx2 + dw2, dy2 + fold); ctx.lineTo(dx2 + dw2, dy2 + dh2);
      ctx.lineTo(dx2, dy2 + dh2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = `${col}77`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(dx2 + dw2 - fold, dy2); ctx.lineTo(dx2 + dw2 - fold, dy2 + fold); ctx.lineTo(dx2 + dw2, dy2 + fold); ctx.stroke();
      ctx.strokeStyle = `${col}99`; ctx.lineWidth = 1.4;
      [0.3, 0.47, 0.64, 0.81].forEach(frac => {
        ctx.beginPath(); ctx.moveTo(dx2 + ir * 0.14, dy2 + dh2 * frac);
        ctx.lineTo(dx2 + dw2 - ir * 0.14, dy2 + dh2 * frac); ctx.stroke();
      });
    };

    const drawIconPromoVideo = (icx: number, icy: number, ir: number, col: string) => {
      const bw3 = ir * 1.05, bh3 = ir * 0.7;
      const bx3 = icx - bw3 / 2, by3 = icy - bh3 / 2 + ir * 0.08;
      ctx.fillStyle = `${col}22`; ctx.strokeStyle = col; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.roundRect(bx3, by3, bw3 * 0.7, bh3, 5); ctx.fill(); ctx.stroke();
      const lx2 = bx3 + bw3 * 0.33, ly2 = by3 + bh3 / 2;
      ctx.fillStyle = `${col}33`; ctx.beginPath(); ctx.arc(lx2, ly2, ir * 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx2, ly2, ir * 0.09, 0, Math.PI * 2); ctx.fill();
      const tx2 = bx3 + bw3 * 0.7 + 3, ty2 = by3 + bh3 / 2;
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(tx2, ty2 - ir * 0.3); ctx.lineTo(tx2 + ir * 0.35, ty2); ctx.lineTo(tx2, ty2 + ir * 0.3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `${col}55`; ctx.strokeStyle = col; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(bx3 + ir * 0.06, by3 - ir * 0.3, bw3 * 0.58, ir * 0.26, 3); ctx.fill(); ctx.stroke();
      for (let s = 0; s < 4; s++) {
        const sx3 = bx3 + ir * 0.06 + s * (bw3 * 0.58 / 4);
        ctx.beginPath(); ctx.moveTo(sx3 + ir * 0.1, by3 - ir * 0.3); ctx.lineTo(sx3, by3 - ir * 0.04); ctx.stroke();
      }
    };

    // =========================================================
    // === RIGHT SIDE LAYOUT ===
    // =========================================================
    const gridStartX = 622;
    const gridEndX = width - 16;
    const gridW = gridEndX - gridStartX;
    const gap = 8;

    const drawTechCard = (x: number, y: number, w: number, h: number, color: string, radius = 14) => {
      const bgGlow2 = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
      bgGlow2.addColorStop(0, `${color}16`); bgGlow2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bgGlow2; ctx.fillRect(x - 12, y - 12, w + 24, h + 24);
      const cg2 = ctx.createLinearGradient(x, y, x, y + h);
      cg2.addColorStop(0, 'rgba(11, 20, 40, 0.96)'); cg2.addColorStop(1, 'rgba(6, 12, 28, 0.93)');
      ctx.fillStyle = cg2; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
      const shimmer2 = ctx.createLinearGradient(x, y, x + w * 0.5, y + h * 0.45);
      shimmer2.addColorStop(0, `${color}10`); shimmer2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shimmer2; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
      ctx.strokeStyle = `${color}60`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.stroke();
      const ta2 = ctx.createLinearGradient(x, y, x + w * 0.65, y);
      ta2.addColorStop(0, color); ta2.addColorStop(0.65, `${color}77`); ta2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ta2; ctx.beginPath(); ctx.roundRect(x, y, w, 3, [radius, radius, 0, 0]); ctx.fill();
      const dotX2 = x + w - 16, dotY2 = y + 16;
      const dg2 = ctx.createRadialGradient(dotX2, dotY2, 0, dotX2, dotY2, 10);
      dg2.addColorStop(0, color); dg2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = dg2; ctx.beginPath(); ctx.arc(dotX2, dotY2, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(dotX2, dotY2, 3, 0, Math.PI * 2); ctx.fill();
    };

    const drawIconContainer = (icx2: number, icy2: number, ir2: number, col2: string) => {
      ctx.strokeStyle = `${col2}40`; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.arc(icx2, icy2, ir2 + 11, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = `${col2}80`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(icx2, icy2, ir2 + 3, 0, Math.PI * 2); ctx.stroke();
      const ig2 = ctx.createRadialGradient(icx2, icy2, 0, icx2, icy2, ir2);
      ig2.addColorStop(0, `${col2}38`); ig2.addColorStop(1, `${col2}08`);
      ctx.fillStyle = ig2; drawHex(icx2, icy2, ir2); ctx.fill();
      ctx.strokeStyle = col2; ctx.lineWidth = 1.5; drawHex(icx2, icy2, ir2); ctx.stroke();
      const odX = icx2 + ir2 + 3, odY = icy2 - 9;
      const odg = ctx.createRadialGradient(odX, odY, 0, odX, odY, 6);
      odg.addColorStop(0, col2); odg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = odg; ctx.beginPath(); ctx.arc(odX, odY, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(odX, odY, 2.5, 0, Math.PI * 2); ctx.fill();
    };

    // === ALL 5 EQUAL SQUARES (2 top + 3 bottom) ===
    const squareW = (gridW - gap * 2) / 3;
    // Cap squareH so both rows fit: topRowY + 2*h + gap + bottomMargin <= height
    const maxH = (height - 46 - gap - 30) / 2;
    const squareH = Math.min(squareW, maxH);
    const topRowY = 46;
    // Top row: 2 squares centered (Mentorship, Advising)
    const topRowOffsetX = (gridW - 2 * squareW - gap) / 2;

    const topSquares = [
      { label: 'Mentorship', sub: 'Expert guidance\nfrom industry leaders', color: '#14b8a6', drawIcon: drawIconMentorship },
      { label: 'Advising', sub: 'Strategic direction &\nbusiness model coaching', color: '#22d3ee', drawIcon: drawIconAdvising },
    ];

    topSquares.forEach((sq, i) => {
      const sx = gridStartX + topRowOffsetX + i * (squareW + gap);
      const sy = topRowY;
      drawTechCard(sx, sy, squareW, squareH, sq.color);
      const iconX2 = sx + squareW / 2, iconY2 = sy + squareH * 0.36;
      drawIconContainer(iconX2, iconY2, 24, sq.color);
      sq.drawIcon(iconX2, iconY2, 14, sq.color);
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
      ctx.fillText(sq.label, sx + squareW / 2, sy + squareH * 0.66);
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      sq.sub.split('\n').forEach((line, li) => ctx.fillText(line, sx + squareW / 2, sy + squareH * 0.79 + li * 14));
    });

    // Bottom row: 3 squares (Deck Pitch, Business Plan, Promo Video)
    const bottomY = topRowY + squareH + gap;

    const bottomSquares = [
      { label: 'Deck Pitch', sub: 'Investor-ready\npresentation', color: '#22d3ee', drawIcon: drawIconDeckPitch },
      { label: 'Business Plan', sub: 'Go-to-market &\nfinancial model', color: '#14b8a6', drawIcon: drawIconBusinessPlan },
      { label: 'Promo Video', sub: 'Professional\npitch video', color: '#818cf8', drawIcon: drawIconPromoVideo },
    ];

    bottomSquares.forEach((sq, i) => {
      const sx = gridStartX + i * (squareW + gap);
      const sy = bottomY;
      drawTechCard(sx, sy, squareW, squareH, sq.color);
      const iconX3 = sx + squareW / 2, iconY3 = sy + squareH * 0.36;
      drawIconContainer(iconX3, iconY3, 24, sq.color);
      sq.drawIcon(iconX3, iconY3, 14, sq.color);
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
      ctx.fillText(sq.label, sx + squareW / 2, sy + squareH * 0.66);
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      sq.sub.split('\n').forEach((line, li) => ctx.fillText(line, sx + squareW / 2, sy + squareH * 0.79 + li * 14));
    });
  };

  const downloadBanner = (format: 'png' | 'jpg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement('a');
      link.download = `sfh-mvp-program-banner.${format}`;
      link.href = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.97);
      link.click();
      toast.success(`MVP Program banner downloaded as ${format.toUpperCase()}`);
    } catch {
      toast.error('Download failed. Please try again.');
    }
  };

  return (
    <div>
      <div className="tech-card border-0 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">MVP Program Banner (1200×630)</h2>
            <p className="text-muted-foreground text-sm">
              8-week intensive MVP software startup program — Mentorship, Advising, Deck Pitch, Business Plan & Promo Video.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadBanner('png')} disabled={isRendering} className="gap-2">
              <Download className="h-4 w-4" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadBanner('jpg')} disabled={isRendering} className="gap-2">
              <Image className="h-4 w-4" />
              JPG
            </Button>
          </div>
        </div>
      </div>

      <div className="tech-card border-0 p-4 overflow-hidden">
        <div className="relative w-full" style={{ aspectRatio: '1200/630' }}>
          <canvas ref={canvasRef} className="w-full h-full object-contain rounded-lg" style={{ maxWidth: '100%', height: 'auto' }} />
          {isRendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span className="text-muted-foreground">Rendering graphic...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MVPBanner;
