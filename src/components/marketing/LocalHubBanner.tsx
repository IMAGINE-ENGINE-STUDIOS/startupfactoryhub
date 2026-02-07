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
        drawLocalHubBanner(ctx, displayWidth, displayHeight, galaxyImage, logoImage, qrImage);
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

  const drawLocalHubBanner = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bgImage: HTMLImageElement,
    logoImage: HTMLImageElement,
    qrImage: HTMLImageElement
  ) => {
    // Draw galaxy background - cover
    const bgRatio = bgImage.width / bgImage.height;
    const canvasRatio = width / height;
    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (bgRatio > canvasRatio) {
      drawWidth = height * bgRatio;
      offsetX = -(drawWidth - width) / 2;
    } else {
      drawHeight = width / bgRatio;
      offsetY = -(drawHeight - height) / 2;
    }

    ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);

    // Dark overlay gradient - left side heavier for text legibility
    const overlayGradient = ctx.createLinearGradient(0, 0, width, 0);
    overlayGradient.addColorStop(0, 'rgba(0, 8, 20, 0.92)');
    overlayGradient.addColorStop(0.55, 'rgba(0, 12, 25, 0.78)');
    overlayGradient.addColorStop(1, 'rgba(0, 15, 30, 0.55)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle scan lines
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.02)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Left content container subtle bg
    const contentGrad = ctx.createLinearGradient(0, 0, 620, 0);
    contentGrad.addColorStop(0, 'rgba(0, 15, 30, 0.85)');
    contentGrad.addColorStop(0.75, 'rgba(0, 15, 30, 0.4)');
    contentGrad.addColorStop(1, 'rgba(0, 15, 30, 0)');
    ctx.fillStyle = contentGrad;
    ctx.fillRect(0, 0, 620, height);

    // Vertical accent line
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(40, 50);
    ctx.lineTo(40, height - 50);
    ctx.stroke();

    // Glowing dots on accent line
    const dotPositions = [70, 160, 300, 450, 560];
    dotPositions.forEach(y => {
      const glow = ctx.createRadialGradient(40, y, 0, 40, y, 18);
      glow.addColorStop(0, 'rgba(20, 184, 166, 0.7)');
      glow.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(40, y, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#14b8a6';
      ctx.beginPath();
      ctx.arc(40, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Logo - top left, small
    const logoSize = 65;
    const logoX = 70;
    const logoY = 35;

    // Logo glow
    const logoGlow = ctx.createRadialGradient(logoX + logoSize / 2, logoY + logoSize / 2, 0, logoX + logoSize / 2, logoY + logoSize / 2, logoSize);
    logoGlow.addColorStop(0, 'rgba(20, 184, 166, 0.3)');
    logoGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = logoGlow;
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    ctx.restore();

    ctx.strokeStyle = 'rgba(20, 184, 166, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Brand name next to logo
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.9)';
    ctx.fillText('STARTUP FACTORY HUB', logoX + logoSize + 15, logoY + logoSize / 2 + 5);

    // Main headline - "CREATE YOUR OWN"
    ctx.font = '300 36px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('🌍 CREATE YOUR OWN', 70, 155);

    // "LOCAL HUB" with gradient glow
    ctx.font = '900 62px "Segoe UI", system-ui, sans-serif';
    const hubGrad = ctx.createLinearGradient(70, 215, 450, 215);
    hubGrad.addColorStop(0, '#14b8a6');
    hubGrad.addColorStop(0.5, '#22d3ee');
    hubGrad.addColorStop(1, '#14b8a6');
    ctx.fillStyle = hubGrad;
    ctx.shadowColor = 'rgba(20, 184, 166, 0.5)';
    ctx.shadowBlur = 30;
    ctx.fillText('LOCAL HUB', 70, 220);
    ctx.shadowBlur = 0;

    // Subheadline
    ctx.font = '400 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('Build the innovation hub your city deserves.', 70, 260);
    ctx.fillText('Launch SFH in your region — we provide the platform.', 70, 282);

    // Divider line
    const divGrad = ctx.createLinearGradient(70, 302, 500, 302);
    divGrad.addColorStop(0, 'rgba(20, 184, 166, 0.6)');
    divGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(70, 302);
    ctx.lineTo(500, 302);
    ctx.stroke();

    // Benefits list with icons
    const benefits = [
      { icon: '🚀', text: 'Global AI startup-building platform' },
      { icon: '🏛️', text: 'Proven acceleration program model' },
      { icon: '🌐', text: 'International founder & investor network' },
      { icon: '💡', text: 'University, industry & gov activation tools' },
      { icon: '🎯', text: 'Lead & shape your regional ecosystem' },
    ];

    ctx.font = '400 15px "Segoe UI", system-ui, sans-serif';
    benefits.forEach((b, i) => {
      const y = 328 + i * 28;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(`${b.icon}  ${b.text}`, 75, y);
    });

    // "We're looking for" section
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#14b8a6';
    ctx.fillText('WE\'RE LOOKING FOR:', 75, 488);

    const profiles = [
      'Visionary ecosystem builders',
      'University & industry leaders',
      'Startup operators & accelerator managers',
    ];

    ctx.font = '400 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    profiles.forEach((p, i) => {
      ctx.fillText(`▸  ${p}`, 85, 510 + i * 22);
    });

    // CTA Button
    const btnX = 75;
    const btnY = 575;
    const btnWidth = 240;
    const btnHeight = 44;

    // Button glow
    const btnGlow = ctx.createRadialGradient(btnX + btnWidth / 2, btnY + btnHeight / 2, 0, btnX + btnWidth / 2, btnY + btnHeight / 2, 140);
    btnGlow.addColorStop(0, 'rgba(20, 184, 166, 0.3)');
    btnGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = btnGlow;
    ctx.beginPath();
    ctx.arc(btnX + btnWidth / 2, btnY + btnHeight / 2, 140, 0, Math.PI * 2);
    ctx.fill();

    // Button bg
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnWidth, btnY);
    btnGrad.addColorStop(0, '#0d9488');
    btnGrad.addColorStop(0.5, '#14b8a6');
    btnGrad.addColorStop(1, '#0d9488');
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 22);
    ctx.fill();

    // Button border
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 22);
    ctx.stroke();

    // Button text
    ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('APPLY TO LEAD A HUB →', btnX + btnWidth / 2, btnY + btnHeight / 2 + 5);

    // Right side decorative elements

    // Floating hexagons on right side
    const hexagons = [
      { x: 750, y: 120, size: 30, opacity: 0.12 },
      { x: 900, y: 80, size: 20, opacity: 0.08 },
      { x: 1050, y: 180, size: 25, opacity: 0.1 },
      { x: 850, y: 450, size: 22, opacity: 0.09 },
      { x: 1100, y: 400, size: 28, opacity: 0.11 },
      { x: 700, y: 520, size: 18, opacity: 0.07 },
    ];

    hexagons.forEach(hex => {
      ctx.strokeStyle = `rgba(20, 184, 166, ${hex.opacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = hex.x + hex.size * Math.cos(angle);
        const py = hex.y + hex.size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    });

    // Right side - hub city cards
    const cities = [
      { name: 'Orlando, FL', label: 'HQ', color: '#14b8a6' },
      { name: 'Santiago, CL', label: 'LATAM', color: '#22d3ee' },
      { name: 'Tokyo, JP', label: 'APAC', color: '#8b5cf6' },
      { name: 'Sevilla, ES', label: 'EMEA', color: '#f59e0b' },
    ];

    const cardStartX = 680;
    const cardStartY = 240;
    const cardW = 130;
    const cardH = 55;
    const cardGap = 12;

    cities.forEach((city, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = cardStartX + col * (cardW + cardGap);
      const y = cardStartY + row * (cardH + cardGap);

      // Card bg
      ctx.fillStyle = 'rgba(0, 20, 40, 0.75)';
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 10);
      ctx.fill();

      // Card border
      const cBorder = ctx.createLinearGradient(x, y, x + cardW, y + cardH);
      cBorder.addColorStop(0, city.color);
      cBorder.addColorStop(0.5, 'rgba(255,255,255,0.1)');
      cBorder.addColorStop(1, city.color);
      ctx.strokeStyle = cBorder;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 10);
      ctx.stroke();

      // Top glow line
      ctx.strokeStyle = `${city.color}99`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 25, y);
      ctx.lineTo(x + cardW - 25, y);
      ctx.stroke();

      // Label badge
      ctx.fillStyle = city.color;
      ctx.font = 'bold 9px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(city.label, x + cardW / 2, y + 20);

      // City name
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '400 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(city.name, x + cardW / 2, y + 38);
    });

    // "YOUR CITY?" card - bigger, highlighted
    const yourX = cardStartX + 30;
    const yourY = cardStartY + 2 * (cardH + cardGap) + 10;
    const yourW = cardW * 2 + cardGap;
    const yourH = 60;

    // Glow behind
    const yourGlow = ctx.createRadialGradient(yourX + yourW / 2, yourY + yourH / 2, 0, yourX + yourW / 2, yourY + yourH / 2, 120);
    yourGlow.addColorStop(0, 'rgba(20, 184, 166, 0.2)');
    yourGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = yourGlow;
    ctx.beginPath();
    ctx.arc(yourX + yourW / 2, yourY + yourH / 2, 120, 0, Math.PI * 2);
    ctx.fill();

    // Dashed border card
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(yourX, yourY, yourW, yourH, 12);
    ctx.stroke();
    ctx.setLineDash([]);

    // "YOUR CITY?" text
    ctx.font = '900 22px "Segoe UI", system-ui, sans-serif';
    const yourGrad = ctx.createLinearGradient(yourX, yourY + 35, yourX + yourW, yourY + 35);
    yourGrad.addColorStop(0, '#14b8a6');
    yourGrad.addColorStop(0.5, '#22d3ee');
    yourGrad.addColorStop(1, '#14b8a6');
    ctx.fillStyle = yourGrad;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(20, 184, 166, 0.4)';
    ctx.shadowBlur = 15;
    ctx.fillText('YOUR CITY NEXT? 🌎', yourX + yourW / 2, yourY + yourH / 2 + 8);
    ctx.shadowBlur = 0;

    // QR Code - bottom right
    const qrSize = 90;
    const qrX = width - qrSize - 40;
    const qrY = height - qrSize - 40;

    ctx.font = '400 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('startupfactoryhub.com', qrX + qrSize / 2, qrY - 30);

    ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.9)';
    ctx.fillText('SCAN TO APPLY', qrX + qrSize / 2, qrY - 16);

    // QR background
    ctx.fillStyle = 'rgba(0, 20, 35, 0.8)';
    ctx.beginPath();
    ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 10);
    ctx.fill();

    ctx.strokeStyle = 'rgba(20, 184, 166, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 10);
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrSize, qrSize, 6);
    ctx.clip();
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    ctx.restore();

    // Top right corner brackets
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width - 20, 20);
    ctx.lineTo(width - 20, 70);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width - 70, 20);
    ctx.lineTo(width - 20, 20);
    ctx.stroke();

    // Bottom left corner
    ctx.beginPath();
    ctx.moveTo(20, height - 20);
    ctx.lineTo(20, height - 70);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(20, height - 20);
    ctx.lineTo(70, height - 20);
    ctx.stroke();

    // Top right label
    ctx.textAlign = 'right';
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.7)';
    ctx.fillText('HUB OWNER PROGRAM', width - 35, 45);

    ctx.font = '400 10px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('APPLICATIONS OPEN', width - 35, 60);

    // Hashtags at bottom
    ctx.textAlign = 'left';
    ctx.font = '400 10px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.5)';
    ctx.fillText('#StartupFactoryHub  #InnovationHubs  #GlobalInnovation  #ChapterLeaders', 70, height - 15);
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
              Call to action for Hub Owners & Chapter Leaders. Galaxy-themed with global hub network.
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
