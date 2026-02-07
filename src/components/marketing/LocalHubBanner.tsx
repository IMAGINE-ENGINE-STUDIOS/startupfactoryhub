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

    // === FLOATING HEXAGONS ===
    const hexagons = [
      { x: 60, y: 60, size: 22, opacity: 0.07 },
      { x: 1140, y: 80, size: 25, opacity: 0.08 },
      { x: 1100, y: 560, size: 20, opacity: 0.06 },
      { x: 100, y: 550, size: 18, opacity: 0.05 },
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
      'Full ownership of your local hub',
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
    // RIGHT SIDE — "Who We're Looking For" cards
    // ============================================================
    const rightX = 560;
    const cardW = 280;
    const cardH = 60;
    const cardGapY = 12;

    // Section label
    ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText('WHO WE\'RE LOOKING FOR', rightX, 52);

    // Accent line
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rightX, 60); ctx.lineTo(rightX + cardW, 60); ctx.stroke();

    const personas = [
      { title: 'Visionary Ecosystem Builders', desc: 'Leaders ready to shape regional innovation', color: '#10b981' },
      { title: 'University & Industry Partners', desc: 'Connected to academic and public institutions', color: '#06b6d4' },
      { title: 'Startup Operators', desc: 'Ready to support and scale founders locally', color: '#8b5cf6' },
      { title: 'Global Connectors', desc: 'Believe innovation should be borderless', color: '#f59e0b' },
    ];

    personas.forEach((p, i) => {
      const y = 74 + i * (cardH + cardGapY);

      // Card bg
      ctx.fillStyle = 'rgba(0, 20, 40, 0.7)';
      ctx.beginPath(); ctx.roundRect(rightX, y, cardW, cardH, 10); ctx.fill();

      // Card border
      const border = ctx.createLinearGradient(rightX, y, rightX + cardW, y + cardH);
      border.addColorStop(0, `${p.color}66`);
      border.addColorStop(1, 'rgba(255,255,255,0.05)');
      ctx.strokeStyle = border;
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(rightX, y, cardW, cardH, 10); ctx.stroke();

      // Top accent line
      ctx.strokeStyle = `${p.color}88`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(rightX + 20, y); ctx.lineTo(rightX + cardW - 20, y); ctx.stroke();

      // Color indicator
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(rightX + 18, y + cardH / 2, 5, 0, Math.PI * 2); ctx.fill();

      // Title
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(p.title, rightX + 32, y + 24);

      // Desc
      ctx.font = '400 11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillText(p.desc, rightX + 32, y + 42);
    });

    // ============================================================
    // RIGHT SIDE — Active Hubs row
    // ============================================================
    const hubsY = 370;

    ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.7)';
    ctx.textAlign = 'left';
    ctx.fillText('ACTIVE HUBS', rightX, hubsY);

    const hubs = [
      { name: 'Orlando', label: 'HQ' },
      { name: 'Santiago', label: 'LATAM' },
      { name: 'Tokyo', label: 'APAC' },
      { name: 'Sevilla', label: 'EMEA' },
    ];

    const hubChipW = 62;
    const hubChipH = 24;
    const hubGap = 8;

    hubs.forEach((hub, i) => {
      const x = rightX + i * (hubChipW + hubGap);
      const y = hubsY + 10;

      ctx.fillStyle = 'rgba(0, 20, 40, 0.6)';
      ctx.beginPath(); ctx.roundRect(x, y, hubChipW, hubChipH, 12); ctx.fill();

      ctx.strokeStyle = 'rgba(20, 184, 166, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x, y, hubChipW, hubChipH, 12); ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillText(hub.name, x + hubChipW / 2, y + hubChipH / 2 + 3.5);
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
