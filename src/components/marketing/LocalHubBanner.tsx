import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image } from 'lucide-react';
import { toast } from 'sonner';
import sfhLogo from '@/assets/sfh-logo-sphere.png';


const LocalHubBanner = () => {
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

    const galaxyImage = new window.Image();
    const logoImage = new window.Image();

    let loadedCount = 0;

    const tryDraw = () => {
      loadedCount++;
      if (loadedCount === 2) {
        drawBanner(ctx, displayWidth, displayHeight, galaxyImage, logoImage);
        setIsRendering(false);
      }
    };

    galaxyImage.onload = tryDraw;
    logoImage.onload = tryDraw;

    galaxyImage.src = '/images/galaxy-hub-bg.webp';
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

    // Dark overlay
    const overlay = ctx.createLinearGradient(0, 0, width, height);
    overlay.addColorStop(0, 'rgba(0, 15, 25, 0.90)');
    overlay.addColorStop(0.5, 'rgba(0, 18, 30, 0.85)');
    overlay.addColorStop(1, 'rgba(0, 12, 22, 0.92)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    // === TECH GRID ===
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // === GRID INTERSECTION DOTS ===
    for (let x = 60; x < width; x += 120) {
      for (let y = 60; y < height; y += 120) {
        ctx.fillStyle = 'rgba(20, 184, 166, 0.08)';
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      }
    }

    // === FLOATING HEXAGONS (more of them, varied sizes) ===
    const hexagons = [
      { x: 50, y: 55, size: 24, opacity: 0.09 },
      { x: 480, y: 40, size: 16, opacity: 0.05 },
      { x: 1150, y: 70, size: 28, opacity: 0.10 },
      { x: 1100, y: 560, size: 22, opacity: 0.07 },
      { x: 80, y: 560, size: 20, opacity: 0.06 },
      { x: 520, y: 590, size: 14, opacity: 0.04 },
      { x: 950, y: 30, size: 18, opacity: 0.06 },
      { x: 300, y: 600, size: 12, opacity: 0.04 },
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
      // Inner glow fill
      ctx.fillStyle = `rgba(20, 184, 166, ${hex.opacity * 0.3})`;
      ctx.fill();
    });

    // === ENERGY ARCS ===
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.07)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-100, height / 2, 380, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width + 100, height / 2, 380, Math.PI * 0.67, Math.PI * 1.33);
    ctx.stroke();
    // Top arc
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.05)';
    ctx.beginPath();
    ctx.arc(width / 2, -200, 400, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    // === DIAGONAL CONNECTION LINES ===
    const drawConnectionLine = (x1: number, y1: number, x2: number, y2: number, opacity: number) => {
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, `rgba(20, 184, 166, 0)`);
      grad.addColorStop(0.3, `rgba(20, 184, 166, ${opacity})`);
      grad.addColorStop(0.7, `rgba(20, 184, 166, ${opacity})`);
      grad.addColorStop(1, `rgba(20, 184, 166, 0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
    };
    drawConnectionLine(0, 120, 520, 440, 0.06);
    drawConnectionLine(width, 100, 540, 440, 0.06);
    drawConnectionLine(200, 0, 600, 630, 0.04);
    drawConnectionLine(1000, 0, 600, 630, 0.04);

    // === FLOATING DIAMONDS ===
    const diamonds = [
      { x: 530, y: 315, size: 6, opacity: 0.15 },
      { x: 540, y: 200, size: 4, opacity: 0.10 },
      { x: 1050, y: 450, size: 5, opacity: 0.12 },
      { x: 150, y: 470, size: 4, opacity: 0.08 },
    ];
    diamonds.forEach(d => {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = `rgba(20, 184, 166, ${d.opacity})`;
      ctx.fillRect(-d.size, -d.size, d.size * 2, d.size * 2);
      ctx.strokeStyle = `rgba(20, 184, 166, ${d.opacity * 2})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(-d.size, -d.size, d.size * 2, d.size * 2);
      ctx.restore();
    });

    // === PARTICLE SCATTER (small glowing dots) ===
    const particles = [
      { x: 420, y: 80, r: 2 }, { x: 750, y: 50, r: 1.5 }, { x: 900, y: 580, r: 2 },
      { x: 350, y: 520, r: 1.5 }, { x: 680, y: 600, r: 1 }, { x: 1050, y: 150, r: 2 },
      { x: 200, y: 300, r: 1 }, { x: 850, y: 300, r: 1.5 }, { x: 480, y: 500, r: 1 },
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
      // Corner bracket lines
      const len = 20;
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.3)';
      ctx.lineWidth = 1.5;
      const dx = c.x < width / 2 ? 1 : -1;
      const dy = c.y < height / 2 ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(c.x, c.y + dy * len); ctx.lineTo(c.x, c.y); ctx.lineTo(c.x + dx * len, c.y); ctx.stroke();
    });

    // ============================================================
    // LEFT SIDE — Logo + Headline + Tagline
    // ============================================================
    const leftX = 60;

    // Logo
    const logoSize = 65;
    const logoY = 52;

    const logoGlow = ctx.createRadialGradient(leftX + logoSize / 2, logoY, 0, leftX + logoSize / 2, logoY, logoSize);
    logoGlow.addColorStop(0, 'rgba(20, 184, 166, 0.3)');
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

    // "CREATE YOUR OWN"
    ctx.textAlign = 'left';
    ctx.font = '300 22px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText('CREATE YOUR OWN', leftX, 120);

    // "LOCAL HUB"
    ctx.font = '900 52px "Segoe UI", system-ui, sans-serif';
    const hubGrad = ctx.createLinearGradient(leftX, 165, leftX + 300, 165);
    hubGrad.addColorStop(0, '#14b8a6');
    hubGrad.addColorStop(0.5, '#22d3ee');
    hubGrad.addColorStop(1, '#14b8a6');
    ctx.fillStyle = hubGrad;
    ctx.shadowColor = 'rgba(20, 184, 166, 0.5)';
    ctx.shadowBlur = 20;
    ctx.fillText('LOCAL HUB', leftX, 168);
    ctx.shadowBlur = 0;

    // Tagline
    ctx.font = '400 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillText('Build the innovation hub your city deserves', leftX, 196);

    // Accent line under tagline
    const lineGrad = ctx.createLinearGradient(leftX, 210, leftX + 280, 210);
    lineGrad.addColorStop(0, '#14b8a6');
    lineGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(leftX, 210); ctx.lineTo(leftX + 280, 210); ctx.stroke();

    // ============================================================
    // LEFT SIDE — Benefits list (below headline)
    // ============================================================
    const benefitItems = [
      'Global AI startup-building platform',
      'Proven idea-to-scale program model',
      'International founder & investor network',
      'University & industry activation tools',
      'Lead your region\'s startup ecosystem',
      'Hybrid operational model',
    ];

    const benefitStartY = 238;
    const benefitSpacing = 28;

    benefitItems.forEach((item, i) => {
      const y = benefitStartY + i * benefitSpacing;

      // Checkmark dot
      ctx.fillStyle = '#14b8a6';
      ctx.beginPath(); ctx.arc(leftX + 6, y - 4, 4, 0, Math.PI * 2); ctx.fill();

      // Inner check
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(leftX + 3.5, y - 4);
      ctx.lineTo(leftX + 5.5, y - 2);
      ctx.lineTo(leftX + 9, y - 6.5);
      ctx.stroke();

      // Text
      ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'left';
      ctx.fillText(item, leftX + 22, y);
    });

    // ============================================================
    // RIGHT SIDE — "Who We're Looking For" — 4 large stacked cards
    // ============================================================
    const rightX = 500;
    const cardAreaW = width - rightX - 50;

    // Section label
    ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText('WHO WE\'RE LOOKING FOR', rightX, 48);

    // Accent line
    const accentGrad = ctx.createLinearGradient(rightX, 56, rightX + cardAreaW, 56);
    accentGrad.addColorStop(0, 'rgba(20, 184, 166, 0.6)');
    accentGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = accentGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(rightX, 56); ctx.lineTo(rightX + cardAreaW, 56); ctx.stroke();

    const personas = [
      { title: 'Visionary Ecosystem Builders', desc: 'Leaders ready to shape regional innovation ecosystems', color: '#10b981', glowColor: 'rgba(16, 185, 129, 0.25)', icon: 'building' },
      { title: 'University & Industry Partners', desc: 'Connected to academic & public institutions worldwide', color: '#06b6d4', glowColor: 'rgba(6, 182, 212, 0.25)', icon: 'gradcap' },
      { title: 'Startup Operators & Founders', desc: 'Ready to support and scale founders locally', color: '#8b5cf6', glowColor: 'rgba(139, 92, 246, 0.25)', icon: 'rocket' },
      { title: 'Global Connectors & Investors', desc: 'Believe innovation should be borderless', color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.25)', icon: 'diamond' },
    ];

    const cardH2 = 88;
    const cardGapY2 = 8;

    // Helper: draw styled icon
    const drawIcon = (iconType: string, ix: number, iy: number, sz: number) => {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      switch (iconType) {
        case 'building':
          ctx.beginPath();
          ctx.moveTo(ix - sz * 0.5, iy + sz * 0.7);
          ctx.lineTo(ix - sz * 0.5, iy - sz * 0.5);
          ctx.lineTo(ix, iy - sz * 0.8);
          ctx.lineTo(ix + sz * 0.5, iy - sz * 0.5);
          ctx.lineTo(ix + sz * 0.5, iy + sz * 0.7);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ix - sz * 0.25, iy + sz * 0.7); ctx.lineTo(ix - sz * 0.25, iy - sz * 0.3);
          ctx.moveTo(ix, iy + sz * 0.7); ctx.lineTo(ix, iy - sz * 0.3);
          ctx.moveTo(ix + sz * 0.25, iy + sz * 0.7); ctx.lineTo(ix + sz * 0.25, iy - sz * 0.3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ix - sz * 0.6, iy + sz * 0.7); ctx.lineTo(ix + sz * 0.6, iy + sz * 0.7);
          ctx.stroke();
          break;
        case 'gradcap':
          ctx.beginPath();
          ctx.moveTo(ix, iy - sz * 0.5);
          ctx.lineTo(ix + sz * 0.8, iy);
          ctx.lineTo(ix, iy + sz * 0.3);
          ctx.lineTo(ix - sz * 0.8, iy);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ix + sz * 0.5, iy - sz * 0.1); ctx.lineTo(ix + sz * 0.5, iy + sz * 0.6);
          ctx.stroke();
          ctx.beginPath(); ctx.arc(ix + sz * 0.5, iy + sz * 0.7, sz * 0.12, 0, Math.PI * 2); ctx.fill();
          break;
        case 'rocket':
          ctx.beginPath();
          ctx.moveTo(ix, iy - sz);
          ctx.lineTo(ix + sz * 0.5, iy + sz * 0.3);
          ctx.lineTo(ix, iy + sz * 0.1);
          ctx.lineTo(ix - sz * 0.5, iy + sz * 0.3);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ix - sz * 0.5, iy + sz * 0.3); ctx.lineTo(ix - sz * 0.7, iy + sz * 0.7); ctx.lineTo(ix - sz * 0.2, iy + sz * 0.3);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ix + sz * 0.5, iy + sz * 0.3); ctx.lineTo(ix + sz * 0.7, iy + sz * 0.7); ctx.lineTo(ix + sz * 0.2, iy + sz * 0.3);
          ctx.stroke();
          ctx.beginPath(); ctx.arc(ix, iy - sz * 0.3, sz * 0.2, 0, Math.PI * 2); ctx.stroke();
          break;
        case 'diamond':
          ctx.beginPath();
          ctx.moveTo(ix, iy - sz * 0.7);
          ctx.lineTo(ix + sz * 0.6, iy);
          ctx.lineTo(ix, iy + sz * 0.7);
          ctx.lineTo(ix - sz * 0.6, iy);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ix, iy - sz * 0.7); ctx.lineTo(ix, iy + sz * 0.7);
          ctx.moveTo(ix - sz * 0.6, iy); ctx.lineTo(ix + sz * 0.6, iy);
          ctx.stroke();
          break;
      }
      ctx.restore();
    };

    personas.forEach((p, i) => {
      const cx = rightX;
      const cy = 66 + i * (cardH2 + cardGapY2);

      // Card background glow
      const bgGlow = ctx.createRadialGradient(cx + cardAreaW / 2, cy + cardH2 / 2, 0, cx + cardAreaW / 2, cy + cardH2 / 2, cardAreaW * 0.6);
      bgGlow.addColorStop(0, p.glowColor);
      bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath(); ctx.arc(cx + cardAreaW / 2, cy + cardH2 / 2, cardAreaW * 0.5, 0, Math.PI * 2); ctx.fill();

      // Card bg
      ctx.fillStyle = 'rgba(0, 20, 40, 0.75)';
      ctx.beginPath(); ctx.roundRect(cx, cy, cardAreaW, cardH2, 18); ctx.fill();

      // Card border gradient
      const border = ctx.createLinearGradient(cx, cy, cx + cardAreaW, cy + cardH2);
      border.addColorStop(0, p.color);
      border.addColorStop(0.5, 'rgba(255,255,255,0.12)');
      border.addColorStop(1, p.color);
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.roundRect(cx, cy, cardAreaW, cardH2, 18); ctx.stroke();

      // Top glow line
      ctx.strokeStyle = `${p.color}aa`;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx + 30, cy); ctx.lineTo(cx + cardAreaW - 30, cy); ctx.stroke();

      // Hexagon icon container
      const hexX = cx + 50;
      const hexY = cy + cardH2 / 2;
      const hexSize = 28;

      // Hex glow
      const hexGlow = ctx.createRadialGradient(hexX, hexY, 0, hexX, hexY, hexSize + 18);
      hexGlow.addColorStop(0, p.glowColor);
      hexGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = hexGlow;
      ctx.beginPath(); ctx.arc(hexX, hexY, hexSize + 18, 0, Math.PI * 2); ctx.fill();

      // Hexagon shape
      ctx.beginPath();
      for (let hi = 0; hi < 6; hi++) {
        const angle = (Math.PI / 3) * hi - Math.PI / 2;
        const px = hexX + hexSize * Math.cos(angle);
        const py = hexY + hexSize * Math.sin(angle);
        if (hi === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      const hexFill = ctx.createLinearGradient(hexX - hexSize, hexY - hexSize, hexX + hexSize, hexY + hexSize);
      hexFill.addColorStop(0, p.color);
      hexFill.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = hexFill;
      ctx.fill();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Orbit ring
      ctx.beginPath();
      ctx.strokeStyle = `${p.color}50`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 5]);
      ctx.arc(hexX, hexY, hexSize + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Orbit dots
      [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(angle => {
        const dotX = hexX + Math.cos(angle) * (hexSize + 10);
        const dotY = hexY + Math.sin(angle) * (hexSize + 10);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2); ctx.fill();
      });

      // Draw icon inside hexagon
      drawIcon(p.icon, hexX, hexY, 14);

      // Corner accents
      const cornerLen = 14;
      const cornerInset = 7;
      ctx.strokeStyle = `${p.color}60`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx + cornerInset, cy + cornerInset + cornerLen); ctx.lineTo(cx + cornerInset, cy + cornerInset); ctx.lineTo(cx + cornerInset + cornerLen, cy + cornerInset); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + cardAreaW - cornerInset - cornerLen, cy + cornerInset); ctx.lineTo(cx + cardAreaW - cornerInset, cy + cornerInset); ctx.lineTo(cx + cardAreaW - cornerInset, cy + cornerInset + cornerLen); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + cornerInset, cy + cardH2 - cornerInset - cornerLen); ctx.lineTo(cx + cornerInset, cy + cardH2 - cornerInset); ctx.lineTo(cx + cornerInset + cornerLen, cy + cardH2 - cornerInset); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + cardAreaW - cornerInset - cornerLen, cy + cardH2 - cornerInset); ctx.lineTo(cx + cardAreaW - cornerInset, cy + cardH2 - cornerInset); ctx.lineTo(cx + cardAreaW - cornerInset, cy + cardH2 - cornerInset - cornerLen); ctx.stroke();

      // Title — bigger
      ctx.font = 'bold 17px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(p.title, cx + 90, hexY - 8);

      // Description — bigger
      ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(p.desc, cx + 90, hexY + 14);
    });


    // ============================================================
    // BOTTOM — "Your City Could Be Next" + CTA spread across full width
    // ============================================================

    // Separator line
    const sepY = 440;
    const sepGrad = ctx.createLinearGradient(60, sepY, width - 60, sepY);
    sepGrad.addColorStop(0, 'rgba(20, 184, 166, 0)');
    sepGrad.addColorStop(0.3, 'rgba(20, 184, 166, 0.3)');
    sepGrad.addColorStop(0.7, 'rgba(20, 184, 166, 0.3)');
    sepGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = sepGrad;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(60, sepY); ctx.lineTo(width - 60, sepY); ctx.stroke();

    // "YOUR CITY COULD BE NEXT" — left aligned
    ctx.font = '900 28px "Segoe UI", system-ui, sans-serif';
    const nextGrad = ctx.createLinearGradient(leftX, 490, leftX + 500, 490);
    nextGrad.addColorStop(0, '#14b8a6');
    nextGrad.addColorStop(0.5, '#22d3ee');
    nextGrad.addColorStop(1, '#14b8a6');
    ctx.fillStyle = nextGrad;
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(20, 184, 166, 0.4)';
    ctx.shadowBlur = 15;
    ctx.fillText('YOUR CITY COULD BE NEXT', leftX, 490);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('Drive real economic growth, empower founders, and put your region on the global innovation map.', leftX, 515);

    // CTA button — right side
    const btnW = 240;
    const btnH = 44;
    const btnX = width - 60 - btnW;
    const btnY = 472;

    // Button glow
    const btnGlow = ctx.createRadialGradient(btnX + btnW / 2, btnY + btnH / 2, 0, btnX + btnW / 2, btnY + btnH / 2, 120);
    btnGlow.addColorStop(0, 'rgba(20, 184, 166, 0.25)');
    btnGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = btnGlow;
    ctx.beginPath(); ctx.arc(btnX + btnW / 2, btnY + btnH / 2, 120, 0, Math.PI * 2); ctx.fill();

    // Button bg
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY);
    btnGrad.addColorStop(0, '#0d9488');
    btnGrad.addColorStop(0.5, '#14b8a6');
    btnGrad.addColorStop(1, '#0d9488');
    ctx.fillStyle = btnGrad;
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 22); ctx.fill();

    // Button border
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 22); ctx.stroke();

    // Button text
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('APPLY TO LEAD A HUB', btnX + btnW / 2, btnY + btnH / 2 + 5);

    // === BOTTOM BAR ===
    // Website
    ctx.textAlign = 'left';
    ctx.font = '400 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillText('startupfactoryhub.com', leftX, height - 22);

    // Hashtags — right aligned
    ctx.textAlign = 'right';
    ctx.font = '400 9px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.35)';
    ctx.fillText('#StartupFactoryHub  #InnovationHubs  #ChapterLeaders  #GlobalInnovation', width - 60, height - 22);
  };

  const downloadBanner = (format: 'png' | 'jpg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'jpg' ? 0.95 : undefined;
    link.download = `startup-factory-hub-local-hub.${format}`;
    link.href = canvas.toDataURL(mimeType, quality);
    link.click();
    toast.success(`Downloaded as ${format.toUpperCase()}`);
  };

  return (
    <div>
      <div className="tech-card border-0 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Create Your Own Local Hub (1200×630)</h2>
            <p className="text-muted-foreground text-sm">
              Call to action for Hub Owners & Chapter Leaders to launch SFH in new regions.
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

export default LocalHubBanner;
