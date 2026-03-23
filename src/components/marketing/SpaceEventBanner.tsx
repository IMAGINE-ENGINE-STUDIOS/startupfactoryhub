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
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

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

    // Dark overlay for readability
    const overlay = ctx.createLinearGradient(0, 0, width, 0);
    overlay.addColorStop(0, 'rgba(0, 4, 15, 0.92)');
    overlay.addColorStop(0.5, 'rgba(0, 6, 20, 0.82)');
    overlay.addColorStop(1, 'rgba(0, 4, 15, 0.65)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    // Bottom gradient
    const bottomFade = ctx.createLinearGradient(0, height * 0.75, 0, height);
    bottomFade.addColorStop(0, 'rgba(0,4,15,0)');
    bottomFade.addColorStop(1, 'rgba(0,4,15,0.9)');
    ctx.fillStyle = bottomFade;
    ctx.fillRect(0, 0, width, height);

    // === TECH GRID ===
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Grid intersection dots
    ctx.fillStyle = 'rgba(20, 184, 166, 0.12)';
    for (let x = 0; x <= width; x += 60) {
      for (let y = 0; y <= height; y += 60) {
        ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
      }
    }

    // === CORNER BRACKETS ===
    const bSize = 28, bGap = 18;
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(bGap + bSize, bGap); ctx.lineTo(bGap, bGap); ctx.lineTo(bGap, bGap + bSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width - bGap - bSize, bGap); ctx.lineTo(width - bGap, bGap); ctx.lineTo(width - bGap, bGap + bSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bGap + bSize, height - bGap); ctx.lineTo(bGap, height - bGap); ctx.lineTo(bGap, height - bGap - bSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width - bGap - bSize, height - bGap); ctx.lineTo(width - bGap, height - bGap); ctx.lineTo(width - bGap, height - bGap - bSize); ctx.stroke();

    // === VERTICAL ACCENT LINE ===
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(44, 50); ctx.lineTo(44, height - 50); ctx.stroke();

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

    // === SFH LOGO (top-left) ===
    const logoSize = 60;
    const logoX = 72, logoY = 38;
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

    // === IN COLLABORATION WITH BADGE ===
    const badgeX = 72, badgeY = 115;
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

    // === EVENT TITLE ===
    ctx.font = '300 28px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText('UPCOMING EVENT', 72, 185);

    // HOT DEALS gradient text
    const hotGrad = ctx.createLinearGradient(72, 220, 550, 220);
    hotGrad.addColorStop(0, '#ff6b35');
    hotGrad.addColorStop(0.4, '#ff8c42');
    hotGrad.addColorStop(0.7, '#14b8a6');
    hotGrad.addColorStop(1, '#22d3ee');
    ctx.font = '900 62px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = hotGrad;
    ctx.shadowColor = 'rgba(255, 107, 53, 0.5)';
    ctx.shadowBlur = 25;
    ctx.fillText('HOT DEALS', 72, 260);
    ctx.shadowBlur = 0;

    ctx.font = '300 32px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('IN THE SPACE INDUSTRY', 72, 302);

    // === DATE & TIME ===
    ctx.font = '400 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.95)';
    ctx.fillText('April 16th, 2025  ·  2:00 PM – 3:30 PM EST', 72, 340);

    // === DIVIDER ===
    const divGrad = ctx.createLinearGradient(72, 0, 520, 0);
    divGrad.addColorStop(0, 'rgba(255, 107, 53, 0.8)');
    divGrad.addColorStop(0.5, 'rgba(20, 184, 166, 0.4)');
    divGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(72, 358); ctx.lineTo(520, 358); ctx.stroke();

    // === TOPICS ===
    const topics = [
      { icon: '🚀', text: 'Hot Startups Right Now' },
      { icon: '🛰️', text: 'Technology Transfer Program' },
      { icon: '🌌', text: "What's New in Space Industry" },
    ];

    topics.forEach((topic, i) => {
      const ty = 385 + i * 36;
      
      // Bullet dot
      ctx.fillStyle = i === 0 ? '#ff6b35' : (i === 1 ? '#14b8a6' : '#22d3ee');
      ctx.beginPath(); ctx.arc(82, ty, 4, 0, Math.PI * 2); ctx.fill();
      
      // Glow around dot
      const dotGlow = ctx.createRadialGradient(82, ty, 0, 82, ty, 14);
      dotGlow.addColorStop(0, i === 0 ? 'rgba(255,107,53,0.3)' : (i === 1 ? 'rgba(20,184,166,0.3)' : 'rgba(34,211,238,0.3)'));
      dotGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = dotGlow;
      ctx.beginPath(); ctx.arc(82, ty, 14, 0, Math.PI * 2); ctx.fill();

      ctx.font = '400 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'left';
      ctx.fillText(`${topic.icon}  ${topic.text}`, 98, ty + 5);
    });

    // === REGISTER CTA BUTTON ===
    const btnX = 72, btnY = 490, btnW = 220, btnH = 46;
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
    ctx.fillText('REGISTER NOW  →', btnX + btnW / 2, btnY + btnH / 2 + 5);

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
    ctx.fillText('startupfactoryhub.com', 72, 570);

    // === NASA LOGO (right side) ===
    // Draw NASA Tech Transfer logo with white background card
    const nasaCardW = 320, nasaCardH = 200;
    const nasaCardX = width - nasaCardW - 50;
    const nasaCardY = height / 2 - nasaCardH / 2 - 20;

    // Card background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath(); ctx.roundRect(nasaCardX, nasaCardY, nasaCardW, nasaCardH, 16); ctx.fill();
    
    // Card glow
    const nasaGlow = ctx.createRadialGradient(
      nasaCardX + nasaCardW / 2, nasaCardY + nasaCardH / 2, 0,
      nasaCardX + nasaCardW / 2, nasaCardY + nasaCardH / 2, nasaCardW * 0.7
    );
    nasaGlow.addColorStop(0, 'rgba(255, 107, 53, 0.15)');
    nasaGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = nasaGlow;
    ctx.beginPath(); ctx.arc(nasaCardX + nasaCardW / 2, nasaCardY + nasaCardH / 2, nasaCardW * 0.7, 0, Math.PI * 2); ctx.fill();

    // Card border
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(nasaCardX, nasaCardY, nasaCardW, nasaCardH, 16); ctx.stroke();

    // Draw NASA logo inside card
    const nasaLogoAspect = nasaImg.width / nasaImg.height;
    const nasaDrawH = nasaCardH - 40;
    const nasaDrawW = nasaDrawH * nasaLogoAspect;
    const nasaImgX = nasaCardX + (nasaCardW - nasaDrawW) / 2;
    const nasaImgY = nasaCardY + 20;
    ctx.drawImage(nasaImg, nasaImgX, nasaImgY, nasaDrawW, nasaDrawH);

    // === PARTNERSHIP LABEL below NASA card ===
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('OFFICIAL PARTNER', nasaCardX + nasaCardW / 2, nasaCardY + nasaCardH + 28);

    // === FLOATING ORBITAL RINGS (decoration) ===
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 107, 53, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 12]);
    ctx.beginPath(); ctx.ellipse(width * 0.7, height * 0.3, 180, 60, -0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.06)';
    ctx.beginPath(); ctx.ellipse(width * 0.65, height * 0.7, 140, 45, 0.4, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };

  const downloadImage = (format: 'png' | 'jpg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'jpg' ? 0.95 : undefined;
    const dataUrl = canvas.toDataURL(mimeType, quality);
    
    const link = document.createElement('a');
    link.download = `sfh-space-event-hot-deals.${format}`;
    link.href = dataUrl;
    link.click();
    
    toast.success(`Space Event banner downloaded as ${format.toUpperCase()}`);
  };

  return (
    <div>
      <div className="tech-card border-0 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              🚀 Hot Deals in the Space Industry — Event Banner (1200×630)
            </h2>
            <p className="text-muted-foreground text-sm">
              April 16th event in collaboration with NASA Technology Transfer Program. Ready for social media & email campaigns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadImage('png')} disabled={isRendering} className="gap-2">
              <Download className="h-4 w-4" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadImage('jpg')} disabled={isRendering} className="gap-2">
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

export default SpaceEventBanner;
