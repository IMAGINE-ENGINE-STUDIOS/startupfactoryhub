import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image } from 'lucide-react';
import { toast } from 'sonner';
import sfhLogo from '@/assets/sfh-logo-sphere.png';
import spaceEventBg from '@/assets/space-event-bg.png';
import nasaLogo from '@/assets/nasa-tech-transfer.webp';

const SpaceEventBanner = () => {
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
    // Use max-width:100% + auto height for responsiveness — no fixed px inline styles
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    ctx.scale(dpr, dpr);

    const bgImage = new window.Image();
    const logoImage = new window.Image();
    const nasaImg = new window.Image();
    let loadedCount = 0;
    const tryDraw = () => {
      loadedCount++;
      if (loadedCount === 3) {
        drawBanner(ctx, displayWidth, displayHeight, bgImage, logoImage, nasaImg);
        setIsRendering(false);
      }
    };
    bgImage.onload = tryDraw;
    logoImage.onload = tryDraw;
    nasaImg.onload = tryDraw;
    bgImage.src = spaceEventBg;
    logoImage.src = sfhLogo;
    nasaImg.src = nasaLogo;
  }, []);

  const drawBanner = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bgImage: HTMLImageElement,
    logoImage: HTMLImageElement,
    nasaImg: HTMLImageElement,
  ) => {
    // === BACKGROUND ===
    const bgRatio = bgImage.width / bgImage.height;
    const canvasRatio = width / height;
    let dw = width, dh = height, ox = 0, oy = 0;
    if (bgRatio > canvasRatio) { dw = height * bgRatio; ox = -(dw - width) / 2; }
    else { dh = width / bgRatio; oy = -(dh - height) / 2; }
    ctx.drawImage(bgImage, ox, oy, dw, dh);

    // Dark overlay
    const overlay = ctx.createLinearGradient(0, 0, width, 0);
    overlay.addColorStop(0, 'rgba(0, 4, 15, 0.97)');
    overlay.addColorStop(0.45, 'rgba(0, 6, 20, 0.92)');
    overlay.addColorStop(0.7, 'rgba(0, 6, 20, 0.75)');
    overlay.addColorStop(1, 'rgba(0, 4, 15, 0.55)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    // Bottom gradient
    const bottomFade = ctx.createLinearGradient(0, height * 0.7, 0, height);
    bottomFade.addColorStop(0, 'rgba(0,4,15,0)');
    bottomFade.addColorStop(1, 'rgba(0,4,15,0.85)');
    ctx.fillStyle = bottomFade;
    ctx.fillRect(0, 0, width, height);

    // === TECH GRID ===
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 107, 53, 0.12)';
    for (let x = 0; x <= width; x += 50) {
      for (let y = 0; y <= height; y += 50) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // === DIAGONAL CIRCUIT TRACES ===
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.07)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 14]);
    [
      { x1: 0, y1: 180, x2: 440, y2: 620 },
      { x1: 60, y1: 0, x2: 560, y2: 500 },
      { x1: width * 0.55, y1: 0, x2: width, y2: height * 0.55 },
      { x1: width * 0.38, y1: height, x2: width, y2: height * 0.2 },
      { x1: 0, y1: height * 0.55, x2: width * 0.3, y2: 0 },
    ].forEach(l => {
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();

    // === FLOATING HEXAGONS ===
    const drawBgHex = (hx: number, hy: number, hr: number, alpha: number, color = '#ff6b35') => {
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
      { x: 80, y: 520, r: 55, a: 0.12 },
      { x: 340, y: 60, r: 38, a: 0.09, c: '#14b8a6' },
      { x: 500, y: 430, r: 70, a: 0.07 },
      { x: 160, y: 300, r: 28, a: 0.08, c: '#14b8a6' },
      { x: 420, y: 200, r: 48, a: 0.06 },
      { x: 750, y: 560, r: 36, a: 0.06, c: '#14b8a6' },
      { x: 940, y: 80, r: 44, a: 0.07 },
      { x: 1120, y: 420, r: 32, a: 0.06, c: '#14b8a6' },
      { x: 660, y: 310, r: 60, a: 0.05 },
      { x: 270, y: 580, r: 42, a: 0.07, c: '#14b8a6' },
    ].forEach(h => drawBgHex(h.x, h.y, h.r, h.a, (h as any).c));

    // === ENERGY ARCS ===
    ctx.save();
    [
      { cx: 300, cy: 315, r: 200, s: -0.3, e: 0.9, col: '#ff6b35', a: 0.10 },
      { cx: 550, cy: 80, r: 140, s: 0.5, e: 2.1, col: '#14b8a6', a: 0.08 },
      { cx: 100, cy: 450, r: 160, s: 3.5, e: 5.5, col: '#ff6b35', a: 0.07 },
      { cx: 900, cy: 500, r: 180, s: 1.2, e: 3.2, col: '#14b8a6', a: 0.08 },
      { cx: 1050, cy: 150, r: 120, s: 0.2, e: 1.8, col: '#ff8c42', a: 0.06 },
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
      { x: 245, y: 165, col: '#ff6b35', a: 0.35 },
      { x: 460, y: 390, col: '#14b8a6', a: 0.28 },
      { x: 130, y: 420, col: '#ff8c42', a: 0.22 },
      { x: 380, y: 520, col: '#ff6b35', a: 0.20 },
      { x: 505, y: 120, col: '#14b8a6', a: 0.18 },
    ].forEach(n => drawNode(n.x, n.y, n.col, n.a));

    // === RADIAL PULSE RINGS ===
    [
      { cx: 300, cy: 315, col: '#ff6b35' },
      { cx: 900, cy: 315, col: '#14b8a6' },
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
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(44, 50); ctx.lineTo(44, height - 50); ctx.stroke();

    // Glowing dots on accent line
    [90, 220, 380, 500].forEach(y => {
      const glow = ctx.createRadialGradient(44, y, 0, 44, y, 22);
      glow.addColorStop(0, 'rgba(255, 107, 53, 0.7)');
      glow.addColorStop(1, 'rgba(255, 107, 53, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(44, y, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff6b35';
      ctx.beginPath(); ctx.arc(44, y, 5, 0, Math.PI * 2); ctx.fill();
    });

    // === CORNER BRACKETS ===
    const bSize = 28, bGap = 18;
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(bGap + bSize, bGap); ctx.lineTo(bGap, bGap); ctx.lineTo(bGap, bGap + bSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width - bGap - bSize, bGap); ctx.lineTo(width - bGap, bGap); ctx.lineTo(width - bGap, bGap + bSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bGap + bSize, height - bGap); ctx.lineTo(bGap, height - bGap); ctx.lineTo(bGap, height - bGap - bSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width - bGap - bSize, height - bGap); ctx.lineTo(width - bGap, height - bGap); ctx.lineTo(width - bGap, height - bGap - bSize); ctx.stroke();

    // === SFH LOGO (top-left) ===
    const logoSize = 72;
    const logoX = 78, logoY = 40;
    const logoGlow = ctx.createRadialGradient(logoX + logoSize / 2, logoY + logoSize / 2, 0, logoX + logoSize / 2, logoY + logoSize / 2, logoSize);
    logoGlow.addColorStop(0, 'rgba(255, 107, 53, 0.4)');
    logoGlow.addColorStop(1, 'rgba(255, 107, 53, 0)');
    ctx.fillStyle = logoGlow;
    ctx.beginPath(); ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2); ctx.stroke();

    // === COLLABORATION BADGE ===
    const badgeX = 80, badgeY = 130;
    const badgeW = 420, badgeH = 30;
    const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
    badgeGrad.addColorStop(0, 'rgba(255, 107, 53, 0.25)');
    badgeGrad.addColorStop(1, 'rgba(255, 107, 53, 0.05)');
    ctx.fillStyle = badgeGrad;
    ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 15); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 15); ctx.stroke();
    ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ff6b35';
    ctx.textAlign = 'left';
    ctx.fillText('IN COLLABORATION WITH NASA TECHNOLOGY TRANSFER PROGRAM', badgeX + 12, badgeY + 20);

    // === HEADLINE ===
    ctx.font = '300 28px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText('UPCOMING EVENT', 80, 200);

    // HOT DEALS gradient text
    const hotGrad = ctx.createLinearGradient(80, 230, 550, 230);
    hotGrad.addColorStop(0, '#ff6b35');
    hotGrad.addColorStop(0.5, '#ff8c42');
    hotGrad.addColorStop(1, '#ffab76');
    ctx.font = '900 68px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = hotGrad;
    ctx.shadowColor = 'rgba(255, 107, 53, 0.5)';
    ctx.shadowBlur = 28;
    ctx.fillText('HOT DEALS', 80, 270);
    ctx.shadowBlur = 0;

    ctx.font = '300 32px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('IN THE SPACE INDUSTRY', 80, 312);

    // === DATE & TIME ===
    ctx.font = '400 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 140, 66, 0.95)';
    ctx.fillText('April 16th, 2026  ·  2:00 PM – 3:30 PM EST', 80, 348);

    // === DIVIDER ===
    const divGrad = ctx.createLinearGradient(80, 0, 520, 0);
    divGrad.addColorStop(0, 'rgba(255, 107, 53, 0.8)');
    divGrad.addColorStop(0.6, 'rgba(255, 107, 53, 0.3)');
    divGrad.addColorStop(1, 'rgba(255, 107, 53, 0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(80, 366); ctx.lineTo(520, 366); ctx.stroke();

    // === TOPICS with canvas-drawn icons ===
    const topics = [
      { text: 'Hot Startups Right Now', color: '#ff6b35' },
      { text: 'Technology Transfer Program', color: '#ff8c42' },
      { text: "What's New in Space Industry", color: '#14b8a6' },
    ];

    topics.forEach((topic, i) => {
      const ty = 396 + i * 38;

      // Draw rocket / satellite / globe icon
      ctx.save();
      const ix = 92, iy = ty;

      if (i === 0) {
        // Rocket icon
        ctx.strokeStyle = topic.color; ctx.lineWidth = 1.8; ctx.fillStyle = `${topic.color}44`;
        ctx.beginPath();
        ctx.moveTo(ix, iy - 8); ctx.lineTo(ix + 4, iy - 3); ctx.lineTo(ix + 3, iy + 5);
        ctx.lineTo(ix, iy + 3); ctx.lineTo(ix - 3, iy + 5); ctx.lineTo(ix - 4, iy - 3);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Flame
        ctx.fillStyle = topic.color;
        ctx.beginPath(); ctx.moveTo(ix - 2, iy + 5); ctx.lineTo(ix, iy + 9); ctx.lineTo(ix + 2, iy + 5); ctx.fill();
      } else if (i === 1) {
        // Satellite icon
        ctx.strokeStyle = topic.color; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(ix, iy, 5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = topic.color;
        ctx.beginPath(); ctx.arc(ix, iy, 2, 0, Math.PI * 2); ctx.fill();
        // Panels
        ctx.fillStyle = `${topic.color}55`;
        ctx.fillRect(ix - 12, iy - 3, 5, 6);
        ctx.fillRect(ix + 7, iy - 3, 5, 6);
        ctx.strokeRect(ix - 12, iy - 3, 5, 6);
        ctx.strokeRect(ix + 7, iy - 3, 5, 6);
      } else {
        // Globe icon
        ctx.strokeStyle = topic.color; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(ix, iy, 8, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(ix, iy, 4, 8, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ix - 8, iy); ctx.lineTo(ix + 8, iy); ctx.stroke();
      }
      ctx.restore();

      // Glow around icon
      const dotGlow = ctx.createRadialGradient(ix, iy, 0, ix, iy, 16);
      dotGlow.addColorStop(0, `${topic.color}33`);
      dotGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = dotGlow;
      ctx.beginPath(); ctx.arc(ix, iy, 16, 0, Math.PI * 2); ctx.fill();

      ctx.font = '400 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'left';
      ctx.fillText(topic.text, 112, ty + 5);
    });

    // === REGISTER CTA BUTTON ===
    const btnX = 80, btnY = 510, btnW = 220, btnH = 46;
    const btnGlow = ctx.createRadialGradient(btnX + btnW / 2, btnY + btnH / 2, 0, btnX + btnW / 2, btnY + btnH / 2, 130);
    btnGlow.addColorStop(0, 'rgba(255, 107, 53, 0.35)');
    btnGlow.addColorStop(1, 'rgba(255, 107, 53, 0)');
    ctx.fillStyle = btnGlow;
    ctx.beginPath(); ctx.arc(btnX + btnW / 2, btnY + btnH / 2, 130, 0, Math.PI * 2); ctx.fill();
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
    btnGrad.addColorStop(0, '#cc4a1a');
    btnGrad.addColorStop(0.5, '#ff6b35');
    btnGrad.addColorStop(1, '#cc4a1a');
    ctx.fillStyle = btnGrad;
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 23); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 140, 66, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 23); ctx.stroke();
    ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('REGISTER NOW  \u2192', btnX + btnW / 2, btnY + btnH / 2 + 5);

    // === FREE BADGE ===
    const freeX = btnX + btnW + 16, freeY = btnY + 6, freeW = 70, freeH = 34;
    const freeGrad = ctx.createLinearGradient(freeX, freeY, freeX + freeW, freeY);
    freeGrad.addColorStop(0, 'rgba(20, 184, 166, 0.3)');
    freeGrad.addColorStop(1, 'rgba(20, 184, 166, 0.1)');
    ctx.fillStyle = freeGrad;
    ctx.beginPath(); ctx.roundRect(freeX, freeY, freeW, freeH, 17); ctx.fill();
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(freeX, freeY, freeW, freeH, 17); ctx.stroke();
    ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#14b8a6';
    ctx.textAlign = 'center';
    ctx.fillText('FREE', freeX + freeW / 2, freeY + freeH / 2 + 4);

    // === WEBSITE ===
    ctx.font = '400 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'left';
    ctx.fillText('startupfactoryhub.com', 80, 580);

    // =========================================================
    // === RIGHT SIDE — NASA LOGO CARD (large, centered) ===
    // =========================================================
    const gridStartX = 620;
    const nasaCardW = width - gridStartX - 40;
    const nasaCardH = height - 90;
    const nasaCardX = gridStartX;
    const nasaCardY = 46;

    // Card glow
    const nasaOuterGlow = ctx.createRadialGradient(
      nasaCardX + nasaCardW / 2, nasaCardY + nasaCardH / 2, 0,
      nasaCardX + nasaCardW / 2, nasaCardY + nasaCardH / 2, nasaCardW * 0.8
    );
    nasaOuterGlow.addColorStop(0, 'rgba(255, 107, 53, 0.12)');
    nasaOuterGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = nasaOuterGlow;
    ctx.beginPath(); ctx.arc(nasaCardX + nasaCardW / 2, nasaCardY + nasaCardH / 2, nasaCardW * 0.8, 0, Math.PI * 2); ctx.fill();

    // Card background
    const cardBg = ctx.createLinearGradient(nasaCardX, nasaCardY, nasaCardX, nasaCardY + nasaCardH);
    cardBg.addColorStop(0, 'rgba(255, 255, 255, 0.97)');
    cardBg.addColorStop(1, 'rgba(245, 245, 245, 0.95)');
    ctx.fillStyle = cardBg;
    ctx.beginPath(); ctx.roundRect(nasaCardX, nasaCardY, nasaCardW, nasaCardH, 18); ctx.fill();

    // Shimmer
    const shimmer = ctx.createLinearGradient(nasaCardX, nasaCardY, nasaCardX + nasaCardW * 0.5, nasaCardY + nasaCardH * 0.4);
    shimmer.addColorStop(0, 'rgba(255, 107, 53, 0.06)');
    shimmer.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shimmer;
    ctx.beginPath(); ctx.roundRect(nasaCardX, nasaCardY, nasaCardW, nasaCardH, 18); ctx.fill();

    // Card border
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(nasaCardX, nasaCardY, nasaCardW, nasaCardH, 18); ctx.stroke();

    // Top accent line on card
    const topAccent = ctx.createLinearGradient(nasaCardX, nasaCardY, nasaCardX + nasaCardW * 0.65, nasaCardY);
    topAccent.addColorStop(0, '#ff6b35');
    topAccent.addColorStop(0.65, 'rgba(255,107,53,0.5)');
    topAccent.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topAccent;
    ctx.beginPath(); ctx.roundRect(nasaCardX, nasaCardY, nasaCardW, 3, [18, 18, 0, 0]); ctx.fill();

    // Status dot on card
    const dotX = nasaCardX + nasaCardW - 18, dotY = nasaCardY + 18;
    const dg = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 10);
    dg.addColorStop(0, '#ff6b35'); dg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(dotX, dotY, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(dotX, dotY, 3, 0, Math.PI * 2); ctx.fill();

    // Draw NASA logo centered and large inside card
    const nasaLogoAspect = nasaImg.width / nasaImg.height;
    const nasaPadding = 50;
    const maxLogoW = nasaCardW - nasaPadding * 2;
    const maxLogoH = nasaCardH - nasaPadding * 2 - 40;
    let nasaDrawW, nasaDrawH;
    if (maxLogoW / nasaLogoAspect <= maxLogoH) {
      nasaDrawW = maxLogoW;
      nasaDrawH = maxLogoW / nasaLogoAspect;
    } else {
      nasaDrawH = maxLogoH;
      nasaDrawW = maxLogoH * nasaLogoAspect;
    }
    const nasaImgX = nasaCardX + (nasaCardW - nasaDrawW) / 2;
    const nasaImgY = nasaCardY + (nasaCardH - nasaDrawH) / 2 - 10;
    ctx.drawImage(nasaImg, nasaImgX, nasaImgY, nasaDrawW, nasaDrawH);

    // OFFICIAL PARTNER label
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICIAL COLLABORATOR', nasaCardX + nasaCardW / 2, nasaCardY + nasaCardH - 22);
  };

  const downloadImage = (format: 'png' | 'jpg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = format === 'jpg' ? 0.95 : undefined;
      const link = document.createElement('a');
      link.download = `sfh-space-event-hot-deals.${format}`;
      link.href = canvas.toDataURL(mimeType, quality);
      link.click();
      toast.success(`Space Event banner downloaded as ${format.toUpperCase()}`);
    } catch {
      toast.error('Download failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="tech-card border-0 p-2 sm:p-4 overflow-hidden">
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1200/630' }}>
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

export default SpaceEventBanner;
