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

    // === TECH GRID ===
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width * 0.65; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width * 0.65, y); ctx.stroke();
    }

    // Grid intersection dots (left side only)
    ctx.fillStyle = 'rgba(20, 184, 166, 0.18)';
    for (let x = 0; x < width * 0.65; x += 60) {
      for (let y = 0; y < height; y += 60) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

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
    const badgeW = 210, badgeH = 30;
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
    ctx.fillText('STARTUP FACTORY HUB  |  8-WEEK PROGRAM', badgeX + 12, badgeY + 20);

    // === HEADLINE ===
    ctx.font = '300 38px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText('LAUNCH YOUR', 80, 208);

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
    ctx.fillText('Functionally MVP software — built, validated & launched in 8 weeks.', 80, 380);

    // === DIVIDER ===
    const divGrad = ctx.createLinearGradient(80, 0, 480, 0);
    divGrad.addColorStop(0, 'rgba(20, 184, 166, 0.8)');
    divGrad.addColorStop(0.6, 'rgba(20, 184, 166, 0.3)');
    divGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(80, 398); ctx.lineTo(480, 398); ctx.stroke();

    // === 8-WEEK BADGE ===
    const wkX = 80, wkY = 420;
    const wkGlow = ctx.createRadialGradient(wkX + 55, wkY + 22, 0, wkX + 55, wkY + 22, 60);
    wkGlow.addColorStop(0, 'rgba(129,140,248,0.35)');
    wkGlow.addColorStop(1, 'rgba(129,140,248,0)');
    ctx.fillStyle = wkGlow;
    ctx.beginPath(); ctx.arc(wkX + 55, wkY + 22, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(129, 140, 248, 0.15)';
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(wkX, wkY, 130, 44, 22); ctx.fill(); ctx.stroke();
    ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#818cf8';
    ctx.textAlign = 'center';
    ctx.fillText('8 WEEKS', wkX + 65, wkY + 20);
    ctx.font = '10px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('INTENSIVE PROGRAM', wkX + 65, wkY + 36);

    // === CTA BUTTON ===
    const btnX = 80, btnY = 490, btnW = 200, btnH = 44;
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
    ctx.fillText('startupfactoryhub.com', 80, 560);

    // =========================================================
    // === RIGHT SIDE — 2x2 GRID + WIDE TOP CARD ===
    // Layout:
    //   [  Mentorship + Advising (wide)  ]
    //   [ Deck Pitch ] [ Business Plan ] [ Promo Video ]
    // =========================================================
    const gridStartX = 570;
    const gridEndX = width - 26;
    const gridW = gridEndX - gridStartX;
    const gap = 12;

    // --- TOP WIDE CARD: Mentorship + Advising ---
    const topCardH = 170;
    const topCardY = 55;
    const drawWideCard = (x: number, y: number, w: number, h: number) => {
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, 'rgba(20, 30, 50, 0.88)');
      grad.addColorStop(1, 'rgba(10, 18, 38, 0.78)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
      // border
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.stroke();
      // top accent bar
      const topAcc = ctx.createLinearGradient(x, y, x + w, y);
      topAcc.addColorStop(0, '#14b8a6');
      topAcc.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topAcc;
      ctx.beginPath(); ctx.roundRect(x, y, w, 3, [3, 3, 0, 0]); ctx.fill();
    };

    drawWideCard(gridStartX, topCardY, gridW, topCardH);

    // Top card header label
    ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('CORE PROGRAM TRACK', gridStartX + gridW / 2, topCardY + 18);

    // Two sub-items inside wide card side by side
    const subItems = [
      { icon: '🧠', label: 'Mentorship', sub: 'Expert guidance from industry leaders on your startup journey' },
      { icon: '💡', label: 'Advising', sub: 'Strategic direction & hands-on business model coaching' },
    ];
    const halfW = (gridW - gap * 3) / 2;
    subItems.forEach((item, i) => {
      const sx = gridStartX + gap + i * (halfW + gap);
      const sy = topCardY + 30;
      const sh = topCardH - 40;

      // Inner sub-card
      ctx.fillStyle = 'rgba(20, 184, 166, 0.07)';
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(sx, sy, halfW, sh, 10); ctx.fill(); ctx.stroke();

      // Icon circle
      const ix = sx + 30, iy = sy + sh / 2;
      const iglow = ctx.createRadialGradient(ix, iy, 0, ix, iy, 22);
      iglow.addColorStop(0, 'rgba(20, 184, 166, 0.4)');
      iglow.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = iglow;
      ctx.beginPath(); ctx.arc(ix, iy, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(10, 20, 40, 0.7)';
      ctx.beginPath(); ctx.arc(ix, iy, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ix, iy, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '13px serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(item.icon, ix, iy + 5);

      // Text
      ctx.textAlign = 'left';
      ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(item.label, sx + 56, sy + 35);
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      // simple word wrap
      const subWords = item.sub.split(' ');
      let sl = '', sly = sy + 54;
      subWords.forEach((w, wi) => {
        const t = sl + (sl ? ' ' : '') + w;
        if (ctx.measureText(t).width > halfW - 60 && sl) {
          ctx.fillText(sl, sx + 56, sly);
          sl = w; sly += 15;
        } else { sl = t; }
        if (wi === subWords.length - 1) ctx.fillText(sl, sx + 56, sly);
      });
    });

    // --- BOTTOM 3 EQUAL SQUARES: Deck Pitch / Business Plan / Promo Video ---
    const bottomY = topCardY + topCardH + gap;
    const bottomH = height - bottomY - 30;
    const squareW = (gridW - gap * 2) / 3;

    const squares = [
      { icon: '📊', label: 'Deck Pitch', sub: 'Investor-ready presentation', color: '#22d3ee', glow: 'rgba(34,211,238,0.3)' },
      { icon: '📋', label: 'Business Plan', sub: 'Go-to-market & financial model', color: '#14b8a6', glow: 'rgba(20,184,166,0.3)' },
      { icon: '🎬', label: 'Promo Video', sub: 'Professional pitch video', color: '#818cf8', glow: 'rgba(129,140,248,0.3)' },
    ];

    squares.forEach((sq, i) => {
      const sx = gridStartX + i * (squareW + gap);
      const sy = bottomY;
      const sw = squareW;
      const sh = bottomH;

      // Card bg
      const cg = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
      cg.addColorStop(0, 'rgba(20, 30, 50, 0.88)');
      cg.addColorStop(1, 'rgba(10, 18, 38, 0.78)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 14); ctx.fill();

      // Border
      ctx.strokeStyle = `${sq.color}55`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 14); ctx.stroke();

      // Top accent bar
      const ta = ctx.createLinearGradient(sx, sy, sx + sw, sy);
      ta.addColorStop(0, sq.color);
      ta.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ta;
      ctx.beginPath(); ctx.roundRect(sx, sy, sw, 3, [3, 3, 0, 0]); ctx.fill();

      // Glowing indicator dot top-right
      const dot = ctx.createRadialGradient(sx + sw - 16, sy + 16, 0, sx + sw - 16, sy + 16, 8);
      dot.addColorStop(0, sq.color); dot.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = dot;
      ctx.beginPath(); ctx.arc(sx + sw - 16, sy + 16, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = sq.color;
      ctx.beginPath(); ctx.arc(sx + sw - 16, sy + 16, 3.5, 0, Math.PI * 2); ctx.fill();

      // Icon circle (centered)
      const cx2 = sx + sw / 2;
      const cy2 = sy + sh * 0.38;
      const ir = 26;
      const iglow2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, ir + 12);
      iglow2.addColorStop(0, sq.glow);
      iglow2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = iglow2;
      ctx.beginPath(); ctx.arc(cx2, cy2, ir + 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(10, 20, 40, 0.85)';
      ctx.beginPath(); ctx.arc(cx2, cy2, ir, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = sq.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx2, cy2, ir, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(sq.icon, cx2, cy2 + 7);

      // Label
      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(sq.label, cx2, sy + sh * 0.65);

      // Sub
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      const subWds = sq.sub.split(' ');
      let sl2 = '', sly2 = sy + sh * 0.78;
      subWds.forEach((w, wi) => {
        const t = sl2 + (sl2 ? ' ' : '') + w;
        if (ctx.measureText(t).width > sw - 20 && sl2) {
          ctx.fillText(sl2, cx2, sly2); sl2 = w; sly2 += 15;
        } else { sl2 = t; }
        if (wi === subWds.length - 1) ctx.fillText(sl2, cx2, sly2);
      });
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
