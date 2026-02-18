import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image } from 'lucide-react';
import { toast } from 'sonner';
import sfhLogo from '@/assets/sfh-logo-sphere.png';
import mentorBg from '@/assets/mentor-banner-bg.png';

const MentorBanner = () => {
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
    bgImage.src = mentorBg;
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

    // Dark overlay - stronger on left, lighter on right to show photo
    const overlay = ctx.createLinearGradient(0, 0, width, 0);
    overlay.addColorStop(0, 'rgba(0, 12, 22, 0.97)');
    overlay.addColorStop(0.42, 'rgba(0, 15, 28, 0.90)');
    overlay.addColorStop(0.62, 'rgba(0, 15, 28, 0.70)');
    overlay.addColorStop(1, 'rgba(0, 10, 20, 0.55)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    // Vertical gradient on top and bottom for blending
    const topFade = ctx.createLinearGradient(0, 0, 0, 80);
    topFade.addColorStop(0, 'rgba(0, 12, 22, 0.6)');
    topFade.addColorStop(1, 'rgba(0, 12, 22, 0)');
    ctx.fillStyle = topFade;
    ctx.fillRect(0, 0, width, 80);

    const botFade = ctx.createLinearGradient(0, height - 80, 0, height);
    botFade.addColorStop(0, 'rgba(0, 12, 22, 0)');
    botFade.addColorStop(1, 'rgba(0, 12, 22, 0.8)');
    ctx.fillStyle = botFade;
    ctx.fillRect(0, height - 80, width, 80);

    // === TECH GRID (left side only) ===
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width * 0.55; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width * 0.55, y); ctx.stroke();
    }

    // Grid dots
    for (let x = 60; x < width * 0.55; x += 120) {
      for (let y = 60; y < height; y += 120) {
        ctx.fillStyle = 'rgba(20, 184, 166, 0.08)';
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      }
    }

    // === FLOATING HEXAGONS ===
    const hexagons = [
      { x: 50, y: 55, size: 22, opacity: 0.09 },
      { x: 490, y: 38, size: 14, opacity: 0.05 },
      { x: 80, y: 560, size: 18, opacity: 0.06 },
      { x: 320, y: 595, size: 12, opacity: 0.04 },
      { x: 430, y: 480, size: 16, opacity: 0.05 },
    ];
    hexagons.forEach(hex => {
      ctx.strokeStyle = `rgba(20, 184, 166, ${hex.opacity})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = hex.x + hex.size * Math.cos(angle);
        const py = hex.y + hex.size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = `rgba(20, 184, 166, ${hex.opacity * 0.3})`;
      ctx.fill();
    });

    // === ENERGY ARCS ===
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.07)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-100, height / 2, 380, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.05)';
    ctx.beginPath();
    ctx.arc(width / 4, -200, 400, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    // === DIAGONAL DASHED LINES ===
    const drawDashLine = (x1: number, y1: number, x2: number, y2: number, op: number) => {
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, `rgba(20, 184, 166, 0)`);
      g.addColorStop(0.3, `rgba(20, 184, 166, ${op})`);
      g.addColorStop(0.7, `rgba(20, 184, 166, ${op})`);
      g.addColorStop(1, `rgba(20, 184, 166, 0)`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
    };
    drawDashLine(0, 120, 460, 420, 0.06);
    drawDashLine(200, 0, 550, 600, 0.04);

    // === PARTICLES ===
    const particles = [
      { x: 400, y: 80, r: 2 }, { x: 280, y: 50, r: 1.5 }, { x: 350, y: 520, r: 2 },
      { x: 180, y: 300, r: 1 }, { x: 460, y: 520, r: 1 }, { x: 90, y: 400, r: 1.5 },
    ];
    particles.forEach(p => {
      const pGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      pGlow.addColorStop(0, 'rgba(20, 184, 166, 0.25)');
      pGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = pGlow;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(20, 184, 166, 0.6)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });

    // === CORNER ACCENTS ===
    const corners = [
      { x: 18, y: 18 },
      { x: width - 18, y: 18 },
      { x: 18, y: height - 18 },
      { x: width - 18, y: height - 18 },
    ];
    corners.forEach(c => {
      const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 14);
      glow.addColorStop(0, 'rgba(20, 184, 166, 0.5)');
      glow.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(c.x, c.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#14b8a6';
      ctx.beginPath(); ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2); ctx.fill();
      const len = 20;
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.3)';
      ctx.lineWidth = 1.5;
      const dx = c.x < width / 2 ? 1 : -1;
      const dy = c.y < height / 2 ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(c.x, c.y + dy * len); ctx.lineTo(c.x, c.y); ctx.lineTo(c.x + dx * len, c.y); ctx.stroke();
    });

    // ============================================================
    // LEFT SIDE — Logo + Headline + Benefits
    // ============================================================
    const leftX = 60;

    // Logo
    const logoSize = 65;
    const logoY = 52;

    const logoGlow = ctx.createRadialGradient(leftX + logoSize / 2, logoY, 0, leftX + logoSize / 2, logoY, logoSize);
    logoGlow.addColorStop(0, 'rgba(20, 184, 166, 0.35)');
    logoGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = logoGlow;
    ctx.beginPath(); ctx.arc(leftX + logoSize / 2, logoY, logoSize, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(leftX + logoSize / 2, logoY, logoSize / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImage, leftX + 2, logoY - logoSize / 2 + 2, logoSize - 4, logoSize - 4);
    ctx.restore();

    ctx.strokeStyle = 'rgba(20, 184, 166, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(leftX + logoSize / 2, logoY, logoSize / 2, 0, Math.PI * 2); ctx.stroke();

    // Orbit ring
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(leftX + logoSize / 2, logoY, logoSize / 2 + 12, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // "BECOME A"
    ctx.textAlign = 'left';
    ctx.font = '300 22px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText('BECOME A', leftX, 120);

    // "MENTOR"
    ctx.font = '900 58px "Segoe UI", system-ui, sans-serif';
    const mentorGrad = ctx.createLinearGradient(leftX, 175, leftX + 320, 175);
    mentorGrad.addColorStop(0, '#14b8a6');
    mentorGrad.addColorStop(0.5, '#22d3ee');
    mentorGrad.addColorStop(1, '#14b8a6');
    ctx.fillStyle = mentorGrad;
    ctx.shadowColor = 'rgba(20, 184, 166, 0.55)';
    ctx.shadowBlur = 22;
    ctx.fillText('MENTOR', leftX, 178);
    ctx.shadowBlur = 0;

    // Tagline
    ctx.font = '400 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillText('Shape the next generation of startup founders', leftX, 206);

    // Accent line
    const lineGrad = ctx.createLinearGradient(leftX, 220, leftX + 300, 220);
    lineGrad.addColorStop(0, '#14b8a6');
    lineGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(leftX, 220); ctx.lineTo(leftX + 300, 220); ctx.stroke();

    // Benefits list
    const benefits = [
      'Direct impact on high-potential startups',
      'AI-powered matching with founders',
      'Flexible scheduling & session tools',
      'Global mentor recognition & badges',
      'Join a network of elite advisors',
      'Co-invest & advise equity opportunities',
    ];

    const benefitStartY = 248;
    const benefitSpacing = 28;

    benefits.forEach((item, i) => {
      const y = benefitStartY + i * benefitSpacing;

      ctx.fillStyle = '#14b8a6';
      ctx.beginPath(); ctx.arc(leftX + 6, y - 4, 4, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(leftX + 3.5, y - 4);
      ctx.lineTo(leftX + 5.5, y - 2);
      ctx.lineTo(leftX + 9, y - 6.5);
      ctx.stroke();

      ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'left';
      ctx.fillText(item, leftX + 22, y);
    });

    // ============================================================
    // RIGHT SIDE — "What You'll Do" — 4 stacked role cards
    // ============================================================
    const rightX = 500;
    const cardAreaW = width - rightX - 50;

    ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText('WHAT MENTORS DO AT SFH', rightX, 48);

    const accentGrad = ctx.createLinearGradient(rightX, 56, rightX + cardAreaW, 56);
    accentGrad.addColorStop(0, 'rgba(20, 184, 166, 0.6)');
    accentGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = accentGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(rightX, 56); ctx.lineTo(rightX + cardAreaW, 56); ctx.stroke();

    const roles = [
      { title: 'Guide Startup Founders', desc: '1-on-1 sessions, roadmap reviews & strategic advice', color: '#10b981', glowColor: 'rgba(16, 185, 129, 0.25)', icon: 'handshake' },
      { title: 'Evaluate Business Models', desc: 'Review pitches, financials & growth strategies', color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.25)', icon: 'chart' },
      { title: 'Build Your Network', desc: 'Connect with investors, accelerators & co-mentors', color: '#8b5cf6', glowColor: 'rgba(139, 92, 246, 0.25)', icon: 'network' },
      { title: 'Earn Recognition & Equity', desc: 'Get acknowledged, badged, and rewarded for impact', color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.25)', icon: 'award' },
    ];

    const cardH = 78;
    const cardGapY = 6;

    const drawRoleIcon = (iconType: string, ix: number, iy: number, sz: number) => {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      switch (iconType) {
        case 'handshake':
          // Two hands meeting
          ctx.beginPath();
          ctx.moveTo(ix - sz * 0.7, iy + sz * 0.1);
          ctx.lineTo(ix, iy - sz * 0.1);
          ctx.lineTo(ix + sz * 0.7, iy + sz * 0.1);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ix - sz * 0.7, iy + sz * 0.4); ctx.lineTo(ix - sz * 0.35, iy + sz * 0.1);
          ctx.moveTo(ix + sz * 0.7, iy + sz * 0.4); ctx.lineTo(ix + sz * 0.35, iy + sz * 0.1);
          ctx.stroke();
          ctx.beginPath(); ctx.arc(ix, iy - sz * 0.1, sz * 0.13, 0, Math.PI * 2); ctx.fill();
          break;
        case 'chart':
          // Bar chart
          ctx.beginPath();
          ctx.moveTo(ix - sz * 0.6, iy + sz * 0.7); ctx.lineTo(ix - sz * 0.6, iy + sz * 0.2); ctx.lineTo(ix - sz * 0.35, iy + sz * 0.2); ctx.lineTo(ix - sz * 0.35, iy + sz * 0.7);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ix - sz * 0.15, iy + sz * 0.7); ctx.lineTo(ix - sz * 0.15, iy - sz * 0.1); ctx.lineTo(ix + sz * 0.1, iy - sz * 0.1); ctx.lineTo(ix + sz * 0.1, iy + sz * 0.7);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ix + sz * 0.3, iy + sz * 0.7); ctx.lineTo(ix + sz * 0.3, iy + sz * 0.4); ctx.lineTo(ix + sz * 0.6, iy + sz * 0.4); ctx.lineTo(ix + sz * 0.6, iy + sz * 0.7);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ix - sz * 0.7, iy + sz * 0.7); ctx.lineTo(ix + sz * 0.7, iy + sz * 0.7);
          ctx.stroke();
          break;
        case 'network':
          // Network nodes
          ctx.beginPath(); ctx.arc(ix, iy - sz * 0.5, sz * 0.2, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(ix - sz * 0.6, iy + sz * 0.4, sz * 0.2, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(ix + sz * 0.6, iy + sz * 0.4, sz * 0.2, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ix - sz * 0.05, iy - sz * 0.3);
          ctx.lineTo(ix - sz * 0.5, iy + sz * 0.25);
          ctx.moveTo(ix + sz * 0.05, iy - sz * 0.3);
          ctx.lineTo(ix + sz * 0.5, iy + sz * 0.25);
          ctx.moveTo(ix - sz * 0.4, iy + sz * 0.4); ctx.lineTo(ix + sz * 0.4, iy + sz * 0.4);
          ctx.stroke();
          break;
        case 'award':
          // Trophy / star
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            const outerA = (s * 4 * Math.PI) / 5 - Math.PI / 2;
            const innerA = ((s * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
            const ox2 = ix + sz * 0.65 * Math.cos(outerA);
            const oy2 = iy - sz * 0.05 + sz * 0.65 * Math.sin(outerA);
            const inx = ix + sz * 0.28 * Math.cos(innerA);
            const iny = iy - sz * 0.05 + sz * 0.28 * Math.sin(innerA);
            if (s === 0) ctx.moveTo(ox2, oy2); else ctx.lineTo(ox2, oy2);
            ctx.lineTo(inx, iny);
          }
          ctx.closePath();
          ctx.stroke();
          // Pedestal
          ctx.beginPath();
          ctx.moveTo(ix - sz * 0.3, iy + sz * 0.7); ctx.lineTo(ix + sz * 0.3, iy + sz * 0.7);
          ctx.moveTo(ix, iy + sz * 0.6); ctx.lineTo(ix, iy + sz * 0.7);
          ctx.stroke();
          break;
      }
      ctx.restore();
    };

    roles.forEach((r, i) => {
      const cx = rightX;
      const cy = 66 + i * (cardH + cardGapY);

      const bgGlow = ctx.createRadialGradient(cx + cardAreaW / 2, cy + cardH / 2, 0, cx + cardAreaW / 2, cy + cardH / 2, cardAreaW * 0.6);
      bgGlow.addColorStop(0, r.glowColor);
      bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath(); ctx.arc(cx + cardAreaW / 2, cy + cardH / 2, cardAreaW * 0.5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'rgba(0, 20, 40, 0.75)';
      ctx.beginPath(); ctx.roundRect(cx, cy, cardAreaW, cardH, 18); ctx.fill();

      const border = ctx.createLinearGradient(cx, cy, cx + cardAreaW, cy + cardH);
      border.addColorStop(0, r.color);
      border.addColorStop(0.5, 'rgba(255,255,255,0.12)');
      border.addColorStop(1, r.color);
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.roundRect(cx, cy, cardAreaW, cardH, 18); ctx.stroke();

      ctx.strokeStyle = `${r.color}aa`;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx + 30, cy); ctx.lineTo(cx + cardAreaW - 30, cy); ctx.stroke();

      const hexX = cx + 50;
      const hexY = cy + cardH / 2;
      const hexSize = 28;

      const hexGlow = ctx.createRadialGradient(hexX, hexY, 0, hexX, hexY, hexSize + 18);
      hexGlow.addColorStop(0, r.glowColor);
      hexGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = hexGlow;
      ctx.beginPath(); ctx.arc(hexX, hexY, hexSize + 18, 0, Math.PI * 2); ctx.fill();

      ctx.beginPath();
      for (let hi = 0; hi < 6; hi++) {
        const angle = (Math.PI / 3) * hi - Math.PI / 2;
        const px = hexX + hexSize * Math.cos(angle);
        const py = hexY + hexSize * Math.sin(angle);
        if (hi === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      const hexFill = ctx.createLinearGradient(hexX - hexSize, hexY - hexSize, hexX + hexSize, hexY + hexSize);
      hexFill.addColorStop(0, r.color);
      hexFill.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = hexFill;
      ctx.fill();
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = `${r.color}50`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 5]);
      ctx.arc(hexX, hexY, hexSize + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(angle => {
        const dotX = hexX + Math.cos(angle) * (hexSize + 10);
        const dotY = hexY + Math.sin(angle) * (hexSize + 10);
        ctx.fillStyle = r.color;
        ctx.beginPath(); ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2); ctx.fill();
      });

      drawRoleIcon(r.icon, hexX, hexY, 14);

      const cornerLen = 14;
      const cornerInset = 7;
      ctx.strokeStyle = `${r.color}60`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx + cornerInset, cy + cornerInset + cornerLen); ctx.lineTo(cx + cornerInset, cy + cornerInset); ctx.lineTo(cx + cornerInset + cornerLen, cy + cornerInset); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + cardAreaW - cornerInset - cornerLen, cy + cornerInset); ctx.lineTo(cx + cardAreaW - cornerInset, cy + cornerInset); ctx.lineTo(cx + cardAreaW - cornerInset, cy + cornerInset + cornerLen); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + cornerInset, cy + cardH - cornerInset - cornerLen); ctx.lineTo(cx + cornerInset, cy + cardH - cornerInset); ctx.lineTo(cx + cornerInset + cornerLen, cy + cardH - cornerInset); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + cardAreaW - cornerInset - cornerLen, cy + cardH - cornerInset); ctx.lineTo(cx + cardAreaW - cornerInset, cy + cardH - cornerInset); ctx.lineTo(cx + cardAreaW - cornerInset, cy + cardH - cornerInset - cornerLen); ctx.stroke();

      ctx.font = 'bold 17px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(r.title, cx + 90, hexY - 8);

      ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(r.desc, cx + 90, hexY + 14);
    });

    // ============================================================
    // BOTTOM — CTA spread across full width
    // ============================================================
    const sepY = 440;
    const sepGrad = ctx.createLinearGradient(60, sepY, width - 60, sepY);
    sepGrad.addColorStop(0, 'rgba(20, 184, 166, 0)');
    sepGrad.addColorStop(0.3, 'rgba(20, 184, 166, 0.3)');
    sepGrad.addColorStop(0.7, 'rgba(20, 184, 166, 0.3)');
    sepGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = sepGrad;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(60, sepY); ctx.lineTo(width - 60, sepY); ctx.stroke();

    // Headline
    ctx.font = '900 28px "Segoe UI", system-ui, sans-serif';
    const ctaGrad = ctx.createLinearGradient(leftX, 490, leftX + 500, 490);
    ctaGrad.addColorStop(0, '#14b8a6');
    ctaGrad.addColorStop(0.5, '#22d3ee');
    ctaGrad.addColorStop(1, '#14b8a6');
    ctx.fillStyle = ctaGrad;
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(20, 184, 166, 0.4)';
    ctx.shadowBlur = 15;
    ctx.fillText('YOUR EXPERTISE CHANGES LIVES', leftX, 490);
    ctx.shadowBlur = 0;

    ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('Join 500+ mentors guiding startups from idea to market on the Startup Factory Hub platform.', leftX, 515);

    // CTA Button
    const btnW = 240;
    const btnH = 44;
    const btnX = width - 60 - btnW;
    const btnY = 472;

    const btnGlow = ctx.createRadialGradient(btnX + btnW / 2, btnY + btnH / 2, 0, btnX + btnW / 2, btnY + btnH / 2, 120);
    btnGlow.addColorStop(0, 'rgba(20, 184, 166, 0.25)');
    btnGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = btnGlow;
    ctx.beginPath(); ctx.arc(btnX + btnW / 2, btnY + btnH / 2, 120, 0, Math.PI * 2); ctx.fill();

    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
    btnGrad.addColorStop(0, '#0d9488');
    btnGrad.addColorStop(0.5, '#14b8a6');
    btnGrad.addColorStop(1, '#0d9488');
    ctx.fillStyle = btnGrad;
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 22); ctx.fill();

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 22); ctx.stroke();

    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('APPLY TO MENTOR →', btnX + btnW / 2, btnY + btnH / 2 + 5);

    // Bottom bar
    ctx.textAlign = 'left';
    ctx.font = '400 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillText('startupfactoryhub.com', leftX, height - 22);

    ctx.textAlign = 'right';
    ctx.font = '400 9px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.35)';
    ctx.fillText('#StartupFactoryHub  #Mentorship  #StartupMentors  #GlobalMentors', width - 60, height - 22);
  };

  const downloadBanner = (format: 'png' | 'jpg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'jpg' ? 0.95 : undefined;
    link.download = `startup-factory-hub-mentor-banner.${format}`;
    link.href = canvas.toDataURL(mimeType, quality);
    link.click();
    toast.success(`Downloaded as ${format.toUpperCase()}`);
  };

  return (
    <div>
      <div className="tech-card border-0 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Mentor Recruitment Banner (1200×630)</h2>
            <p className="text-muted-foreground text-sm">
              Call to action targeting experienced professionals to join as mentors on SFH.
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

export default MentorBanner;
