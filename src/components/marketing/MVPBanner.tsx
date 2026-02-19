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
    // ═══════════════════════════════════════════════
    // TRON-STYLE DEEP BLACK BASE
    // ═══════════════════════════════════════════════
    ctx.fillStyle = '#000810';
    ctx.fillRect(0, 0, width, height);

    // Subtle bg image overlay (very dark)
    const bgRatio = bgImage.width / bgImage.height;
    const canvasRatio = width / height;
    let dw = width, dh = height, ox = 0, oy = 0;
    if (bgRatio > canvasRatio) { dw = height * bgRatio; ox = -(dw - width) / 2; }
    else { dh = width / bgRatio; oy = -(dh - height) / 2; }
    ctx.globalAlpha = 0.08;
    ctx.drawImage(bgImage, ox, oy, dw, dh);
    ctx.globalAlpha = 1;

    // Deep blue gradient base
    const baseGrad = ctx.createLinearGradient(0, 0, width, height);
    baseGrad.addColorStop(0, 'rgba(0, 4, 20, 0.98)');
    baseGrad.addColorStop(0.4, 'rgba(0, 8, 30, 0.95)');
    baseGrad.addColorStop(0.7, 'rgba(0, 12, 40, 0.88)');
    baseGrad.addColorStop(1, 'rgba(0, 6, 25, 0.92)');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, width, height);

    // ═══════════════════════════════════════════════
    // TRON PERSPECTIVE GRID (vanishing point)
    // ═══════════════════════════════════════════════
    const vpX = width * 0.5, vpY = height * 0.42;
    ctx.save();

    // Horizontal lines — perspective
    const horizLines = 18;
    for (let i = 0; i < horizLines; i++) {
      const t = i / (horizLines - 1);
      const y = vpY + (height - vpY) * Math.pow(t, 1.6);
      if (y > height) break;
      const alpha = 0.04 + t * 0.12;
      const lineColor = t > 0.7 ? `rgba(0, 200, 255, ${alpha})` : `rgba(0, 180, 230, ${alpha * 0.6})`;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = t > 0.8 ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines — converging to vanishing point
    const vertLines = 24;
    for (let i = 0; i <= vertLines; i++) {
      const t = i / vertLines;
      const startX = t * width;
      const alpha = 0.04 + Math.abs(t - 0.5) * 0.08;
      ctx.strokeStyle = `rgba(0, 180, 230, ${alpha})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(startX, height);
      ctx.stroke();
    }
    ctx.restore();

    // ═══════════════════════════════════════════════
    // TOP FLAT GRID (above vanishing point — ceiling plane)
    // ═══════════════════════════════════════════════
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = 0.7;
    for (let x = 0; x <= width; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, vpY); ctx.stroke();
    }
    for (let y = 0; y <= vpY; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ═══════════════════════════════════════════════
    // NEON LIGHT TRAILS (Tron-style horizontal beams)
    // ═══════════════════════════════════════════════
    const drawLightTrail = (y: number, xStart: number, xEnd: number, col: string, alpha: number, thick: number) => {
      // Glow aura
      const glow = ctx.createLinearGradient(xStart, y, xEnd, y);
      glow.addColorStop(0, 'rgba(0,0,0,0)');
      glow.addColorStop(0.3, `${col}${Math.round(alpha * 0.4 * 255).toString(16).padStart(2, '0')}`);
      glow.addColorStop(0.7, `${col}${Math.round(alpha * 0.4 * 255).toString(16).padStart(2, '0')}`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.strokeStyle = glow;
      ctx.lineWidth = thick * 8;
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.moveTo(xStart, y); ctx.lineTo(xEnd, y); ctx.stroke();
      // Core line
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = col;
      ctx.lineWidth = thick;
      ctx.shadowColor = col;
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(xStart, y); ctx.lineTo(xEnd, y); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    // Tron light trails
    drawLightTrail(120, 0, 580, '#00c8ff', 0.9, 2);
    drawLightTrail(120, 0, 580, '#00c8ff', 0.5, 6);
    drawLightTrail(220, 0, 480, '#00eeff', 0.7, 1.5);
    drawLightTrail(340, 0, 620, '#00c8ff', 0.6, 1);
    drawLightTrail(460, 0, 550, '#0088cc', 0.5, 1);

    // Right side trails
    drawLightTrail(80,  700, 1200, '#00c8ff', 0.6, 1.5);
    drawLightTrail(200, 650, 1200, '#00eeff', 0.5, 1);
    drawLightTrail(400, 680, 1200, '#00c8ff', 0.4, 1);

    // ═══════════════════════════════════════════════
    // VERTICAL NEON LINES
    // ═══════════════════════════════════════════════
    const drawVLine = (x: number, yStart: number, yEnd: number, col: string, alpha: number, thick: number) => {
      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = thick;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = col;
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(x, yStart); ctx.lineTo(x, yEnd); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    drawVLine(60, 0, height, '#00c8ff', 0.7, 2.5);
    drawVLine(60, 0, height, '#00c8ff', 0.3, 8);
    drawVLine(width - 60, 0, height, '#00c8ff', 0.5, 1.5);
    drawVLine(width - 60, 0, height, '#00c8ff', 0.2, 6);
    drawVLine(620, 0, height, '#004466', 0.6, 1);

    // ═══════════════════════════════════════════════
    // CORNER HUD BRACKETS (large, sharp, Tron-style)
    // ═══════════════════════════════════════════════
    const drawHUDBracket = (bx: number, by: number, flipX: boolean, flipY: boolean) => {
      const bLen = 50, bThick = 3;
      const sx = flipX ? -1 : 1, sy = flipY ? -1 : 1;
      ctx.save();
      ctx.strokeStyle = '#00c8ff';
      ctx.lineWidth = bThick;
      ctx.shadowColor = '#00c8ff';
      ctx.shadowBlur = 15;
      ctx.globalAlpha = 0.9;
      // Outer L shape
      ctx.beginPath();
      ctx.moveTo(bx + sx * bLen, by);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx, by + sy * bLen);
      ctx.stroke();
      // Inner accent dot
      ctx.fillStyle = '#00eeff';
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fill();
      // Tick marks along the bracket arms
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      for (let t = 0; t < 3; t++) {
        const tPos = bLen * 0.2 + t * bLen * 0.25;
        ctx.beginPath();
        ctx.moveTo(bx + sx * tPos, by);
        ctx.lineTo(bx + sx * tPos, by + sy * 6);
        ctx.stroke();
      }
      ctx.restore();
    };

    drawHUDBracket(30, 30, false, false);
    drawHUDBracket(width - 30, 30, true, false);
    drawHUDBracket(30, height - 30, false, true);
    drawHUDBracket(width - 30, height - 30, true, true);

    // ═══════════════════════════════════════════════
    // SCANNING LINE EFFECT (horizontal sweep)
    // ═══════════════════════════════════════════════
    const scanY = height * 0.6;
    const scanGrad = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
    scanGrad.addColorStop(0, 'rgba(0, 200, 255, 0)');
    scanGrad.addColorStop(0.5, 'rgba(0, 200, 255, 0.15)');
    scanGrad.addColorStop(1, 'rgba(0, 200, 255, 0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 2, width, 4);

    // ═══════════════════════════════════════════════
    // CENTRAL ENERGY CORE (left side glow origin)
    // ═══════════════════════════════════════════════
    const coreX = 320, coreY = height * 0.42;
    const coreGlow = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, 200);
    coreGlow.addColorStop(0, 'rgba(0, 180, 255, 0.12)');
    coreGlow.addColorStop(0.4, 'rgba(0, 100, 200, 0.06)');
    coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGlow;
    ctx.fillRect(0, 0, width * 0.55, height);

    // ═══════════════════════════════════════════════
    // DIAGONAL SPEED LINES
    // ═══════════════════════════════════════════════
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([40, 80]);
    [[0, 0, 350, 630], [100, 0, 500, 630], [0, 150, 280, 630], [200, 0, 630, 630]].forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();

    // ═══════════════════════════════════════════════
    // FLOATING TRON HEXAGONS
    // ═══════════════════════════════════════════════
    const drawTronHex = (hx: number, hy: number, hr: number, alpha: number, filled = false) => {
      ctx.save();
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const ang = (Math.PI / 3) * a + Math.PI / 6;
        const px = hx + hr * Math.cos(ang), py = hy + hr * Math.sin(ang);
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (filled) {
        ctx.fillStyle = `rgba(0, 180, 255, ${alpha * 0.08})`;
        ctx.fill();
      }
      ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.shadowColor = '#00c8ff';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.restore();
    };

    [
      { x: 150, y: 80,  r: 40, a: 0.15, f: true },
      { x: 520, y: 50,  r: 28, a: 0.1 },
      { x: 80,  y: 550, r: 50, a: 0.12, f: true },
      { x: 420, y: 500, r: 35, a: 0.08 },
      { x: 1050,y: 100, r: 45, a: 0.1, f: true },
      { x: 1150,y: 500, r: 30, a: 0.08 },
      { x: 700, y: 580, r: 38, a: 0.07 },
      { x: 960, y: 360, r: 22, a: 0.09 },
    ].forEach(h => drawTronHex(h.x, h.y, h.r, h.a, (h as any).f));

    // ═══════════════════════════════════════════════
    // LOGO
    // ═══════════════════════════════════════════════
    const logoSize = 68;
    const logoX = 80, logoY = 36;
    // Glow ring
    ctx.save();
    ctx.shadowColor = '#00c8ff';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 5, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    ctx.restore();

    // ═══════════════════════════════════════════════
    // PROGRAM BADGE (HUD style)
    // ═══════════════════════════════════════════════
    const badgeX = 80, badgeY = 126;
    const badgeW = 228, badgeH = 28;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 20, 50, 0.85)';
    ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 2); ctx.fill();
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#00c8ff';
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 2); ctx.stroke();
    // Left accent bar
    ctx.fillStyle = '#00c8ff';
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.roundRect(badgeX, badgeY, 3, badgeH, [2, 0, 0, 2]); ctx.fill();
    ctx.restore();
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#00eeff';
    ctx.textAlign = 'left';
    ctx.fillText('STARTUP FACTORY HUB  //  8-WEEK PROGRAM', badgeX + 10, badgeY + 19);

    // ═══════════════════════════════════════════════
    // HEADLINE (Tron-style glowing text)
    // ═══════════════════════════════════════════════
    ctx.save();
    ctx.font = '300 36px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180, 230, 255, 0.75)';
    ctx.textAlign = 'left';
    ctx.letterSpacing = '6px';
    ctx.fillText('LAUNCH YOUR', 80, 204);

    // MVP — massive neon glow
    ctx.shadowColor = '#00c8ff';
    ctx.shadowBlur = 40;
    const mvpGrad = ctx.createLinearGradient(80, 230, 440, 310);
    mvpGrad.addColorStop(0, '#ffffff');
    mvpGrad.addColorStop(0.3, '#00eeff');
    mvpGrad.addColorStop(0.7, '#00c8ff');
    mvpGrad.addColorStop(1, '#0088cc');
    ctx.font = '900 88px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = mvpGrad;
    ctx.fillText('MVP', 80, 305);
    // Double glow pass
    ctx.globalAlpha = 0.35;
    ctx.shadowBlur = 80;
    ctx.fillText('MVP', 80, 305);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    ctx.font = '300 36px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(180, 230, 255, 0.75)';
    ctx.fillText('SOFTWARE STARTUP', 80, 352);
    ctx.restore();

    // Subtext
    ctx.font = '400 13px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0, 200, 255, 0.7)';
    ctx.textAlign = 'left';
    ctx.fillText('> Functionally MVP software — built, validated & launched in 8 weeks.', 80, 380);

    // ═══════════════════════════════════════════════
    // DIVIDER LINE (neon)
    // ═══════════════════════════════════════════════
    ctx.save();
    ctx.shadowColor = '#00c8ff';
    ctx.shadowBlur = 6;
    const divGrad = ctx.createLinearGradient(80, 0, 560, 0);
    divGrad.addColorStop(0, '#00c8ff');
    divGrad.addColorStop(0.6, 'rgba(0, 200, 255, 0.3)');
    divGrad.addColorStop(1, 'rgba(0, 200, 255, 0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(80, 398); ctx.lineTo(560, 398); ctx.stroke();
    ctx.restore();

    // ═══════════════════════════════════════════════
    // 8-WEEK BUTTON (Tron blue with sharp edges)
    // ═══════════════════════════════════════════════
    const wkX = 80, wkY = 416, wkW = 174, wkH = 42;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 15, 40, 0.9)';
    ctx.beginPath(); ctx.rect(wkX, wkY, wkW, wkH); ctx.fill();
    // Top edge glow line
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00c8ff';
    ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.rect(wkX, wkY, wkW, wkH); ctx.stroke();
    // Diagonal cut corner
    ctx.fillStyle = '#000c20';
    ctx.beginPath();
    ctx.moveTo(wkX + wkW - 14, wkY);
    ctx.lineTo(wkX + wkW, wkY + 14);
    ctx.lineTo(wkX + wkW, wkY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = '#00eeff';
    ctx.textAlign = 'center';
    ctx.fillText('8-WEEK PROGRAM', wkX + wkW / 2, wkY + wkH / 2 + 5);

    // ═══════════════════════════════════════════════
    // APPLY NOW BUTTON (bright teal neon)
    // ═══════════════════════════════════════════════
    const btnX = 270, btnY = 416, btnW = 180, btnH = 42;
    ctx.save();
    const btnFill = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    btnFill.addColorStop(0, 'rgba(0, 200, 255, 0.22)');
    btnFill.addColorStop(1, 'rgba(0, 120, 200, 0.15)');
    ctx.fillStyle = btnFill;
    ctx.beginPath(); ctx.rect(btnX, btnY, btnW, btnH); ctx.fill();
    ctx.strokeStyle = '#00eeff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00eeff';
    ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.rect(btnX, btnY, btnW, btnH); ctx.stroke();
    // Diagonal cut corner
    ctx.fillStyle = '#000c20';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(btnX + btnW - 14, btnY);
    ctx.lineTo(btnX + btnW, btnY + 14);
    ctx.lineTo(btnX + btnW, btnY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('[ APPLY NOW → ]', btnX + btnW / 2, btnY + btnH / 2 + 5);

    // ═══════════════════════════════════════════════
    // WEBSITE
    // ═══════════════════════════════════════════════
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0, 200, 255, 0.4)';
    ctx.textAlign = 'left';
    ctx.fillText('// startupfactoryhub.com', 80, 490);

    // ═══════════════════════════════════════════════
    // HEX HELPER FOR CARDS
    // ═══════════════════════════════════════════════
    const drawHex = (hcx: number, hcy: number, hr: number) => {
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const angle = (Math.PI / 3) * a - Math.PI / 6;
        const px = hcx + hr * Math.cos(angle), py = hcy + hr * Math.sin(angle);
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    // ═══════════════════════════════════════════════
    // ICON DRAWERS
    // ═══════════════════════════════════════════════
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
    };

    const drawIconBusinessPlan = (icx: number, icy: number, ir: number, col: string) => {
      const dw2 = ir * 0.88, dh2 = ir * 1.08, fold = ir * 0.22;
      const dx2 = icx - dw2 / 2, dy2 = icy - dh2 / 2;
      ctx.fillStyle = `${col}22`; ctx.strokeStyle = col; ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(dx2, dy2); ctx.lineTo(dx2 + dw2 - fold, dy2);
      ctx.lineTo(dx2 + dw2, dy2 + fold); ctx.lineTo(dx2 + dw2, dy2 + dh2);
      ctx.lineTo(dx2, dy2 + dh2); ctx.closePath(); ctx.fill(); ctx.stroke();
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
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(bx3 + bw3 * 0.7 + 3, by3 + bh3 / 2 - ir * 0.3);
      ctx.lineTo(bx3 + bw3 * 0.7 + 3 + ir * 0.35, by3 + bh3 / 2);
      ctx.lineTo(bx3 + bw3 * 0.7 + 3, by3 + bh3 / 2 + ir * 0.3);
      ctx.closePath(); ctx.fill();
    };

    // ═══════════════════════════════════════════════
    // TRON CARD (sharp edges, neon border)
    // ═══════════════════════════════════════════════
    const drawTronCard = (x: number, y: number, w: number, h: number, color: string) => {
      const cutSize = 10;
      // Clipping path with cut corners
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + cutSize, y);
      ctx.lineTo(x + w - cutSize, y);
      ctx.lineTo(x + w, y + cutSize);
      ctx.lineTo(x + w, y + h - cutSize);
      ctx.lineTo(x + w - cutSize, y + h);
      ctx.lineTo(x + cutSize, y + h);
      ctx.lineTo(x, y + h - cutSize);
      ctx.lineTo(x, y + cutSize);
      ctx.closePath();

      // Card background
      const bg = ctx.createLinearGradient(x, y, x, y + h);
      bg.addColorStop(0, 'rgba(0, 15, 40, 0.95)');
      bg.addColorStop(1, 'rgba(0, 8, 25, 0.92)');
      ctx.fillStyle = bg;
      ctx.fill();

      // Inner shimmer
      ctx.clip();
      const shimmer = ctx.createLinearGradient(x, y, x + w, y + h);
      shimmer.addColorStop(0, `${color}12`);
      shimmer.addColorStop(0.5, `${color}06`);
      shimmer.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shimmer;
      ctx.fillRect(x, y, w, h);

      // Scanline texture
      ctx.globalAlpha = 0.04;
      ctx.fillStyle = '#00c8ff';
      for (let ly = y; ly < y + h; ly += 4) {
        ctx.fillRect(x, ly, w, 1);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Border with cut corners
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + cutSize, y);
      ctx.lineTo(x + w - cutSize, y);
      ctx.lineTo(x + w, y + cutSize);
      ctx.lineTo(x + w, y + h - cutSize);
      ctx.lineTo(x + w - cutSize, y + h);
      ctx.lineTo(x + cutSize, y + h);
      ctx.lineTo(x, y + h - cutSize);
      ctx.lineTo(x, y + cutSize);
      ctx.closePath();
      ctx.strokeStyle = `${color}90`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();

      // Top neon accent bar
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + cutSize, y + 1.25);
      ctx.lineTo(x + w * 0.6, y + 1.25);
      ctx.stroke();
      ctx.restore();

      // Corner accent dots
      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      [[x + w - cutSize - 2, y + 2], [x + 2, y + h - cutSize - 2]].forEach(([cx, cy]) => {
        ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
    };

    // ═══════════════════════════════════════════════
    // TRON ICON CONTAINER (hex with neon)
    // ═══════════════════════════════════════════════
    const drawTronIconContainer = (icx2: number, icy2: number, ir2: number, col2: string) => {
      // Outer dashed ring
      ctx.save();
      ctx.strokeStyle = `${col2}40`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.arc(icx2, icy2, ir2 + 10, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      // Hex fill + glow
      const ig2 = ctx.createRadialGradient(icx2, icy2, 0, icx2, icy2, ir2);
      ig2.addColorStop(0, `${col2}35`);
      ig2.addColorStop(1, `${col2}08`);
      ctx.fillStyle = ig2;
      drawHex(icx2, icy2, ir2); ctx.fill();

      // Hex border
      ctx.strokeStyle = col2;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = col2;
      ctx.shadowBlur = 10;
      drawHex(icx2, icy2, ir2); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    // ═══════════════════════════════════════════════
    // RIGHT SIDE — PROGRAM CARDS GRID
    // ═══════════════════════════════════════════════
    const gridStartX = 638;
    const gridEndX = width - 24;
    const gridW = gridEndX - gridStartX;
    const gap = 10;

    const squareW = (gridW - gap * 2) / 3;
    const maxH = (height - 40 - gap - 24) / 2;
    const squareH = Math.min(squareW, maxH);
    const topRowY = 20;
    const topRowOffsetX = (gridW - 2 * squareW - gap) / 2;

    const topSquares = [
      { label: 'MENTORSHIP', sub: 'Expert guidance\nfrom industry leaders', color: '#00c8ff', drawIcon: drawIconMentorship },
      { label: 'ADVISING', sub: 'Strategic direction &\nbusiness model coaching', color: '#00eeff', drawIcon: drawIconAdvising },
    ];

    topSquares.forEach((sq, i) => {
      const sx = gridStartX + topRowOffsetX + i * (squareW + gap);
      const sy = topRowY;
      drawTronCard(sx, sy, squareW, squareH, sq.color);
      const iconX2 = sx + squareW / 2, iconY2 = sy + squareH * 0.35;
      drawTronIconContainer(iconX2, iconY2, 24, sq.color);
      sq.drawIcon(iconX2, iconY2, 14, sq.color);

      ctx.save();
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = sq.color;
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText(sq.label, sx + squareW / 2, sy + squareH * 0.65);
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.font = '9px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(150, 210, 255, 0.5)';
      ctx.textAlign = 'center';
      sq.sub.split('\n').forEach((line, li) => ctx.fillText(line, sx + squareW / 2, sy + squareH * 0.78 + li * 13));
    });

    const bottomY = topRowY + squareH + gap;

    const bottomSquares = [
      { label: 'DECK PITCH', sub: 'Investor-ready\npresentation', color: '#00c8ff', drawIcon: drawIconDeckPitch },
      { label: 'BUSINESS PLAN', sub: 'Go-to-market &\nfinancial model', color: '#00eeff', drawIcon: drawIconBusinessPlan },
      { label: 'PROMO VIDEO', sub: 'Professional\npitch video', color: '#4db8ff', drawIcon: drawIconPromoVideo },
    ];

    bottomSquares.forEach((sq, i) => {
      const sx = gridStartX + i * (squareW + gap);
      const sy = bottomY;
      drawTronCard(sx, sy, squareW, squareH, sq.color);
      const iconX3 = sx + squareW / 2, iconY3 = sy + squareH * 0.35;
      drawTronIconContainer(iconX3, iconY3, 24, sq.color);
      sq.drawIcon(iconX3, iconY3, 14, sq.color);

      ctx.save();
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = sq.color;
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText(sq.label, sx + squareW / 2, sy + squareH * 0.65);
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.font = '9px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(150, 210, 255, 0.5)';
      ctx.textAlign = 'center';
      sq.sub.split('\n').forEach((line, li) => ctx.fillText(line, sx + squareW / 2, sy + squareH * 0.78 + li * 13));
    });

    // ═══════════════════════════════════════════════
    // BOTTOM STATUS BAR (HUD element)
    // ═══════════════════════════════════════════════
    ctx.save();
    ctx.fillStyle = 'rgba(0, 200, 255, 0.04)';
    ctx.fillRect(0, height - 36, width, 36);
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, height - 36); ctx.lineTo(width, height - 36); ctx.stroke();
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(0, 200, 255, 0.35)';
    ctx.textAlign = 'left';
    ctx.fillText('SYS//STARTUP_FACTORY_HUB  >  MVP_PROGRAM_v8.0  >  STATUS: ACCEPTING_APPLICATIONS', 30, height - 13);
    ctx.textAlign = 'right';
    ctx.fillText('startupfactoryhub.com', width - 30, height - 13);
    ctx.restore();
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
