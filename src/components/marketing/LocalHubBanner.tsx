import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image } from 'lucide-react';
import { toast } from 'sonner';
import sfhLogo from '@/assets/sfh-logo-sphere.png';
import sfhQrCode from '@/assets/sfh-qr-code.png';

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
    const qrImage = new window.Image();

    let loadedCount = 0;

    const tryDraw = () => {
      loadedCount++;
      if (loadedCount === 3) {
        drawBanner(ctx, displayWidth, displayHeight, galaxyImage, logoImage, qrImage);
        setIsRendering(false);
      }
    };

    galaxyImage.onload = tryDraw;
    logoImage.onload = tryDraw;
    qrImage.onload = tryDraw;

    galaxyImage.src = '/images/galaxy-hub-bg.webp';
    logoImage.src = sfhLogo;
    qrImage.src = sfhQrCode;
  }, []);

  const drawBanner = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bgImage: HTMLImageElement,
    logoImage: HTMLImageElement,
    qrImage: HTMLImageElement
  ) => {
    // === BACKGROUND ===
    const bgRatio = bgImage.width / bgImage.height;
    const canvasRatio = width / height;
    let dw = width, dh = height, ox = 0, oy = 0;
    if (bgRatio > canvasRatio) { dw = height * bgRatio; ox = -(dw - width) / 2; }
    else { dh = width / bgRatio; oy = -(dh - height) / 2; }
    ctx.drawImage(bgImage, ox, oy, dw, dh);

    // Dark cinematic overlay (matching first banner)
    const overlay = ctx.createLinearGradient(0, 0, width, height);
    overlay.addColorStop(0, 'rgba(0, 15, 25, 0.88)');
    overlay.addColorStop(0.5, 'rgba(0, 18, 30, 0.82)');
    overlay.addColorStop(1, 'rgba(0, 12, 22, 0.90)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    // === TECH GRID (scaled for 1200x630) ===
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // === FLOATING HEXAGONS ===
    const hexagons = [
      { x: 80, y: 80, size: 25, opacity: 0.08 },
      { x: 200, y: 560, size: 20, opacity: 0.06 },
      { x: 1050, y: 100, size: 22, opacity: 0.07 },
      { x: 1120, y: 520, size: 28, opacity: 0.09 },
      { x: 950, y: 550, size: 18, opacity: 0.05 },
      { x: 150, y: 350, size: 15, opacity: 0.05 },
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
    });

    // === ENERGY ARCS ===
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-80, height / 2, 350, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width + 80, height / 2, 350, Math.PI * 0.67, Math.PI * 1.33);
    ctx.stroke();

    // === CORNER ACCENTS ===
    const corners = [
      { x: 18, y: 18, dx: 1, dy: 1 },
      { x: width - 18, y: 18, dx: -1, dy: 1 },
      { x: 18, y: height - 18, dx: 1, dy: -1 },
    ];
    corners.forEach(c => {
      const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 14);
      glow.addColorStop(0, 'rgba(20, 184, 166, 0.5)');
      glow.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(c.x, c.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#14b8a6';
      ctx.beginPath(); ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2); ctx.fill();
    });

    // === CENTERED LOGO ===
    const logoSize = 75;
    const logoX = width / 2;
    const logoY = 55;

    // Logo glow
    const logoGlow = ctx.createRadialGradient(logoX, logoY, 0, logoX, logoY, logoSize);
    logoGlow.addColorStop(0, 'rgba(20, 184, 166, 0.35)');
    logoGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = logoGlow;
    ctx.beginPath(); ctx.arc(logoX, logoY, logoSize, 0, Math.PI * 2); ctx.fill();

    // Orbit rings
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(logoX, logoY, logoSize / 2 + 14, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([5, 12]);
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.15)';
    ctx.beginPath(); ctx.arc(logoX, logoY, logoSize / 2 + 26, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // Logo image
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoSize / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImage, logoX - logoSize / 2 + 2, logoY - logoSize / 2 + 2, logoSize - 4, logoSize - 4);
    ctx.restore();

    // Logo ring
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(logoX, logoY, logoSize / 2, 0, Math.PI * 2); ctx.stroke();

    // === HEADLINE - Centered ===
    ctx.textAlign = 'center';

    // "CREATE YOUR OWN"
    ctx.font = '300 28px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('🌍  CREATE YOUR OWN', width / 2, 128);

    // "LOCAL HUB" - big gradient text
    ctx.font = '900 56px "Segoe UI", system-ui, sans-serif';
    const hubGrad = ctx.createLinearGradient(width / 2 - 200, 175, width / 2 + 200, 175);
    hubGrad.addColorStop(0, '#14b8a6');
    hubGrad.addColorStop(0.5, '#22d3ee');
    hubGrad.addColorStop(1, '#14b8a6');
    ctx.fillStyle = hubGrad;
    ctx.shadowColor = 'rgba(20, 184, 166, 0.5)';
    ctx.shadowBlur = 25;
    ctx.fillText('LOCAL HUB', width / 2, 180);
    ctx.shadowBlur = 0;

    // Tagline
    ctx.font = '400 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Build the innovation hub your city or country deserves', width / 2, 212);

    // === SECTION DIVIDER ===
    const divY = 238;
    const divLineLen = 100;
    const divDiamondOff = 130;

    // Left line
    const leftGrad = ctx.createLinearGradient(width / 2 - divLineLen - divDiamondOff, divY, width / 2 - divDiamondOff, divY);
    leftGrad.addColorStop(0, 'rgba(20, 184, 166, 0)');
    leftGrad.addColorStop(1, 'rgba(20, 184, 166, 0.6)');
    ctx.strokeStyle = leftGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(width / 2 - divLineLen - divDiamondOff, divY); ctx.lineTo(width / 2 - divDiamondOff, divY); ctx.stroke();

    // Left diamond
    ctx.fillStyle = '#14b8a6';
    ctx.save(); ctx.translate(width / 2 - divDiamondOff + 5, divY); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-3.5, -3.5, 7, 7); ctx.restore();

    // Center text
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('Hub Owner Program', width / 2, divY + 5);

    // Right diamond
    ctx.fillStyle = '#14b8a6';
    ctx.save(); ctx.translate(width / 2 + divDiamondOff - 5, divY); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-3.5, -3.5, 7, 7); ctx.restore();

    // Right line
    const rightGrad = ctx.createLinearGradient(width / 2 + divDiamondOff, divY, width / 2 + divLineLen + divDiamondOff, divY);
    rightGrad.addColorStop(0, 'rgba(20, 184, 166, 0.6)');
    rightGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = rightGrad;
    ctx.beginPath(); ctx.moveTo(width / 2 + divDiamondOff, divY); ctx.lineTo(width / 2 + divLineLen + divDiamondOff, divY); ctx.stroke();

    // === BENEFIT CARDS - 2 rows x 3 columns, centered ===
    const benefits = [
      { icon: '🚀', label: 'AI Platform', desc: 'Global startup-building tools', color: '#10b981' },
      { icon: '🏛️', label: 'Proven Model', desc: 'Idea-to-scale program', color: '#06b6d4' },
      { icon: '🌐', label: 'Global Network', desc: 'Founders & investors', color: '#8b5cf6' },
      { icon: '💡', label: 'Activate Innovation', desc: 'University & industry', color: '#f59e0b' },
      { icon: '🎯', label: 'Lead Ecosystem', desc: 'Shape your region', color: '#ec4899' },
      { icon: '🔑', label: 'Full Ownership', desc: 'Your hub, your vision', color: '#14b8a6' },
    ];

    const cardW = 170;
    const cardH = 72;
    const cardGap = 14;
    const cols = 3;
    const totalW = cols * cardW + (cols - 1) * cardGap;
    const cardsStartX = (width - totalW) / 2;
    const cardsStartY = 262;

    benefits.forEach((b, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = cardsStartX + col * (cardW + cardGap);
      const y = cardsStartY + row * (cardH + 10);
      const cx = x + cardW / 2;

      // Card bg glow
      const bgGlow = ctx.createRadialGradient(cx, y + cardH / 2, 0, cx, y + cardH / 2, cardW * 0.7);
      bgGlow.addColorStop(0, `${b.color}15`);
      bgGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath(); ctx.arc(cx, y + cardH / 2, cardW * 0.6, 0, Math.PI * 2); ctx.fill();

      // Card bg
      ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
      ctx.beginPath(); ctx.roundRect(x, y, cardW, cardH, 12); ctx.fill();

      // Card border gradient
      const border = ctx.createLinearGradient(x, y, x + cardW, y + cardH);
      border.addColorStop(0, b.color);
      border.addColorStop(0.5, 'rgba(255,255,255,0.1)');
      border.addColorStop(1, b.color);
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x, y, cardW, cardH, 12); ctx.stroke();

      // Top glow line
      ctx.strokeStyle = `${b.color}88`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 30, y); ctx.lineTo(x + cardW - 30, y); ctx.stroke();

      // Icon
      ctx.font = '22px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.icon, x + 28, y + 32);

      // Label
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(b.label, x + 50, y + 28);

      // Desc
      ctx.font = '400 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(b.desc, x + 50, y + 46);
    });

    // === EXISTING HUBS ROW - centered ===
    const hubsY = 430;

    // "Active Hubs" label
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.8)';
    ctx.fillText('ACTIVE HUBS', width / 2 - 130, hubsY + 12);

    const hubs = [
      { name: 'Orlando', flag: '🇺🇸', label: 'HQ' },
      { name: 'Santiago', flag: '🇨🇱', label: 'LATAM' },
      { name: 'Tokyo', flag: '🇯🇵', label: 'APAC' },
      { name: 'Sevilla', flag: '🇪🇸', label: 'EMEA' },
    ];

    const hubChipW = 95;
    const hubChipH = 30;
    const hubGap = 10;
    const hubTotalW = hubs.length * hubChipW + (hubs.length - 1) * hubGap;
    const hubStartX = (width - hubTotalW) / 2 + 50;

    hubs.forEach((hub, i) => {
      const x = hubStartX + i * (hubChipW + hubGap);
      const y = hubsY;

      // Chip bg
      ctx.fillStyle = 'rgba(0, 20, 40, 0.6)';
      ctx.beginPath(); ctx.roundRect(x, y, hubChipW, hubChipH, 15); ctx.fill();

      // Chip border
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x, y, hubChipW, hubChipH, 15); ctx.stroke();

      // Flag + name
      ctx.textAlign = 'center';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(`${hub.flag} ${hub.name}`, x + hubChipW / 2, y + hubChipH / 2 + 4);
    });

    // === "YOUR CITY?" highlight - centered ===
    const yourY = hubsY + 48;
    const yourW = 260;
    const yourX = (width - yourW) / 2;
    const yourH = 42;

    // Glow
    const yourGlow = ctx.createRadialGradient(yourX + yourW / 2, yourY + yourH / 2, 0, yourX + yourW / 2, yourY + yourH / 2, 130);
    yourGlow.addColorStop(0, 'rgba(20, 184, 166, 0.15)');
    yourGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = yourGlow;
    ctx.beginPath(); ctx.arc(yourX + yourW / 2, yourY + yourH / 2, 130, 0, Math.PI * 2); ctx.fill();

    // Dashed box
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(yourX, yourY, yourW, yourH, 12); ctx.stroke();
    ctx.setLineDash([]);

    // Text
    ctx.font = '900 20px "Segoe UI", system-ui, sans-serif';
    const yourTextGrad = ctx.createLinearGradient(yourX, yourY + 24, yourX + yourW, yourY + 24);
    yourTextGrad.addColorStop(0, '#14b8a6');
    yourTextGrad.addColorStop(0.5, '#22d3ee');
    yourTextGrad.addColorStop(1, '#14b8a6');
    ctx.fillStyle = yourTextGrad;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(20, 184, 166, 0.4)';
    ctx.shadowBlur = 12;
    ctx.fillText('YOUR CITY COULD BE NEXT 🌎', yourX + yourW / 2, yourY + yourH / 2 + 7);
    ctx.shadowBlur = 0;

    // === CTA BUTTON - centered ===
    const btnW = 260;
    const btnH = 44;
    const btnX = (width - btnW) / 2;
    const btnY = 548;

    // Button glow
    const btnGlow = ctx.createRadialGradient(btnX + btnW / 2, btnY + btnH / 2, 0, btnX + btnW / 2, btnY + btnH / 2, 130);
    btnGlow.addColorStop(0, 'rgba(20, 184, 166, 0.3)');
    btnGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = btnGlow;
    ctx.beginPath(); ctx.arc(btnX + btnW / 2, btnY + btnH / 2, 130, 0, Math.PI * 2); ctx.fill();

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
    ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('APPLY TO LEAD A HUB →', btnX + btnW / 2, btnY + btnH / 2 + 5);

    // Website below button
    ctx.font = '400 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('startupfactoryhub.com', width / 2, btnY + btnH + 22);

    // === QR CODE - bottom right ===
    const qrSize = 85;
    const qrX = width - qrSize - 35;
    const qrY = height - qrSize - 35;

    ctx.font = 'bold 10px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN TO APPLY', qrX + qrSize / 2, qrY - 10);

    // QR bg
    ctx.fillStyle = 'rgba(0, 20, 35, 0.8)';
    ctx.beginPath(); ctx.roundRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 8); ctx.stroke();

    ctx.save();
    ctx.beginPath(); ctx.roundRect(qrX, qrY, qrSize, qrSize, 5); ctx.clip();
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    ctx.restore();

    // === HASHTAGS - bottom left ===
    ctx.textAlign = 'left';
    ctx.font = '400 9px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.4)';
    ctx.fillText('#StartupFactoryHub  #InnovationHubs  #ChapterLeaders  #GlobalInnovation', 30, height - 15);
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
