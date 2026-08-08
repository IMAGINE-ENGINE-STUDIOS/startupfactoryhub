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
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

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

    // === TECH GRID (subtle, full canvas) ===
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.035)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // === HERO GLOW behind headline ===
    const heroGlow = ctx.createRadialGradient(300, 285, 0, 300, 285, 380);
    heroGlow.addColorStop(0, 'rgba(20, 184, 166, 0.16)');
    heroGlow.addColorStop(0.5, 'rgba(34, 211, 238, 0.06)');
    heroGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = heroGlow;
    ctx.fillRect(0, 0, width * 0.62, height);

    // === MINIMAL GEOMETRY (few, large, quiet) ===
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
      { x: 118, y: 520, r: 92, a: 0.10 },
      { x: 470, y: 470, r: 130, a: 0.06, c: '#22d3ee' },
      { x: 392, y: 118, r: 74, a: 0.07, c: '#818cf8' },
    ].forEach(h => drawBgHex(h.x, h.y, h.r, h.a, (h as any).c));

    // Two clean concentric rings anchoring the headline
    [180, 268].forEach((r, ri) => {
      ctx.save();
      ctx.strokeStyle = '#14b8a6';
      ctx.globalAlpha = 0.07 - ri * 0.025;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(300, 285, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });

    // Soft separation glow between copy column and card grid
    const seam = ctx.createLinearGradient(596, 0, 640, 0);
    seam.addColorStop(0, 'rgba(20, 184, 166, 0)');
    seam.addColorStop(0.5, 'rgba(20, 184, 166, 0.20)');
    seam.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = seam;
    ctx.fillRect(596, 40, 44, height - 80);

    const setTracking = (v: string) => { try { (ctx as any).letterSpacing = v; } catch { /* noop */ } };

    // === VERTICAL ACCENT RAIL ===
    const railGrad = ctx.createLinearGradient(0, 56, 0, height - 56);
    railGrad.addColorStop(0, 'rgba(20, 184, 166, 0)');
    railGrad.addColorStop(0.18, 'rgba(20, 184, 166, 0.85)');
    railGrad.addColorStop(0.82, 'rgba(34, 211, 238, 0.55)');
    railGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = railGrad;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(46, 56); ctx.lineTo(46, height - 56); ctx.stroke();

    [150, 300, 450].forEach(y => {
      const glow = ctx.createRadialGradient(46, y, 0, 46, y, 18);
      glow.addColorStop(0, 'rgba(20, 184, 166, 0.6)');
      glow.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(46, y, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#14b8a6';
      ctx.beginPath(); ctx.arc(46, y, 3.5, 0, Math.PI * 2); ctx.fill();
    });

    // === CORNER BRACKETS ===
    const bSize = 26, bGap = 20;
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bGap + bSize, bGap); ctx.lineTo(bGap, bGap); ctx.lineTo(bGap, bGap + bSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width - bGap - bSize, bGap); ctx.lineTo(width - bGap, bGap); ctx.lineTo(width - bGap, bGap + bSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bGap + bSize, height - bGap); ctx.lineTo(bGap, height - bGap); ctx.lineTo(bGap, height - bGap - bSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width - bGap - bSize, height - bGap); ctx.lineTo(width - bGap, height - bGap); ctx.lineTo(width - bGap, height - bGap - bSize); ctx.stroke();

    // === LOCKUP: LOGO + WORDMARK ===
    const logoSize = 58;
    const logoX = 78, logoY = 40;
    const lcx = logoX + logoSize / 2, lcy = logoY + logoSize / 2;
    const logoGlow = ctx.createRadialGradient(lcx, lcy, 0, lcx, lcy, logoSize);
    logoGlow.addColorStop(0, 'rgba(20, 184, 166, 0.38)');
    logoGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = logoGlow;
    ctx.beginPath(); ctx.arc(lcx, lcy, logoSize, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(lcx, lcy, logoSize / 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    ctx.restore();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(lcx, lcy, logoSize / 2 + 4, 0, Math.PI * 2); ctx.stroke();

    ctx.textAlign = 'left';
    setTracking('2.6px');
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText('STARTUP FACTORY HUB', logoX + logoSize + 18, lcy - 3);
    ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.85)';
    ctx.fillText('MVP DEVELOPMENT PROGRAM', logoX + logoSize + 18, lcy + 15);
    setTracking('0px');

    // === STATUS BADGE ===
    const badgeX = 80, badgeY = 122, badgeW = 214, badgeH = 28;
    const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
    badgeGrad.addColorStop(0, 'rgba(20, 184, 166, 0.26)');
    badgeGrad.addColorStop(1, 'rgba(20, 184, 166, 0.03)');
    ctx.fillStyle = badgeGrad;
    ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14); ctx.stroke();
    const dotG = ctx.createRadialGradient(badgeX + 18, badgeY + 14, 0, badgeX + 18, badgeY + 14, 8);
    dotG.addColorStop(0, 'rgba(34,211,238,0.9)');
    dotG.addColorStop(1, 'rgba(34,211,238,0)');
    ctx.fillStyle = dotG; ctx.beginPath(); ctx.arc(badgeX + 18, badgeY + 14, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22d3ee'; ctx.beginPath(); ctx.arc(badgeX + 18, badgeY + 14, 3.2, 0, Math.PI * 2); ctx.fill();
    setTracking('1.8px');
    ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('4-WEEK INTENSIVE · COHORT OPEN', badgeX + 32, badgeY + 18);
    setTracking('0px');

    // === HEADLINE ===
    setTracking('4px');
    ctx.font = '300 34px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.fillText('LAUNCH YOUR', 80, 196);
    setTracking('0px');

    const mvpGrad = ctx.createLinearGradient(80, 220, 480, 300);
    mvpGrad.addColorStop(0, '#14b8a6');
    mvpGrad.addColorStop(0.5, '#22d3ee');
    mvpGrad.addColorStop(1, '#818cf8');
    ctx.font = '900 92px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = mvpGrad;
    ctx.shadowColor = 'rgba(34, 211, 238, 0.5)';
    ctx.shadowBlur = 34;
    ctx.fillText('MVP', 78, 282);
    ctx.shadowBlur = 0;

    // Thin outline echo under the wordmark
    ctx.save();
    ctx.font = '900 92px "Segoe UI", system-ui, sans-serif';
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.16)';
    ctx.lineWidth = 1;
    ctx.strokeText('MVP', 78, 282);
    ctx.restore();

    setTracking('4px');
    ctx.font = '300 34px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.fillText('SOFTWARE STARTUP', 80, 328);
    setTracking('0px');

    // Subheadline
    ctx.font = '400 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.fillText('Functional MVP software — designed, built, validated', 80, 362);
    ctx.fillText('and launched in four weeks.', 80, 384);

    // === DIVIDER ===
    const divGrad = ctx.createLinearGradient(80, 0, 520, 0);
    divGrad.addColorStop(0, 'rgba(20, 184, 166, 0.75)');
    divGrad.addColorStop(0.55, 'rgba(34, 211, 238, 0.25)');
    divGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80, 406); ctx.lineTo(520, 406); ctx.stroke();

    // === CTA ROW ===
    const btnY = 428, btnH = 46;
    // Primary — APPLY NOW
    const btnX = 80, btnW = 196;
    const btnGlow = ctx.createRadialGradient(btnX + btnW / 2, btnY + btnH / 2, 0, btnX + btnW / 2, btnY + btnH / 2, 120);
    btnGlow.addColorStop(0, 'rgba(20, 184, 166, 0.4)');
    btnGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = btnGlow;
    ctx.beginPath(); ctx.arc(btnX + btnW / 2, btnY + btnH / 2, 120, 0, Math.PI * 2); ctx.fill();
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
    btnGrad.addColorStop(0, '#14b8a6');
    btnGrad.addColorStop(1, '#0ea5b7');
    ctx.fillStyle = btnGrad;
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 23); ctx.fill();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 23); ctx.stroke();
    setTracking('1.4px');
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#02141a';
    ctx.textAlign = 'center';
    ctx.fillText('APPLY NOW  →', btnX + btnW / 2, btnY + btnH / 2 + 5);

    // Secondary — ghost pill
    const sbX = 288, sbW = 190;
    ctx.fillStyle = 'rgba(129,140,248,0.10)';
    ctx.beginPath(); ctx.roundRect(sbX, btnY, sbW, btnH, 23); ctx.fill();
    ctx.strokeStyle = 'rgba(129,140,248,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(sbX, btnY, sbW, btnH, 23); ctx.stroke();
    ctx.fillStyle = 'rgba(199,210,254,0.95)';
    ctx.fillText('PROGRAM DETAILS', sbX + sbW / 2, btnY + btnH / 2 + 5);
    setTracking('0px');
    ctx.textAlign = 'left';

    // === FOOTER BAR ===
    const footY = 520;
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(80, footY); ctx.lineTo(560, footY); ctx.stroke();

    const stats = [
      { k: '5', v: 'DELIVERABLES' },
      { k: '4', v: 'WEEKS' },
      { k: '1:1', v: 'MENTORSHIP' },
    ];
    stats.forEach((s, i) => {
      const sx = 80 + i * 150;
      ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(s.k, sx, footY + 30);
      setTracking('1.6px');
      ctx.font = '600 9px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText(s.v, sx, footY + 46);
      setTracking('0px');
    });

    setTracking('1.6px');
    ctx.font = '600 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('STARTUPFACTORYHUB.COM', 80, footY + 76);
    setTracking('0px');



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
    const gridStartX = 648;
    const gridEndX = width - 36;
    const gridW = gridEndX - gridStartX;
    const gap = 12;


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
    const totalGridH = height - 168;
    const squareH = Math.min(squareW, (totalGridH - gap) / 2);
    const topRowY = (height - (squareH * 2 + gap)) / 2 + 14;

    // Section label above the grid
    ctx.textAlign = 'left';
    setTracking('2.4px');
    ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.9)';
    ctx.fillText('WHAT YOU SHIP', gridStartX, topRowY - 22);
    setTracking('0px');
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gridStartX + 118, topRowY - 26); ctx.lineTo(gridEndX, topRowY - 26); ctx.stroke();

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
              4-week intensive MVP software startup program — Mentorship, Advising, Deck Pitch, Business Plan & Promo Video.
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
