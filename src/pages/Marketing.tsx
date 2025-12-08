import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Image, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import marketingBg from '@/assets/marketing-bg.jpg';
import sfhLogo from '@/assets/sfh-logo-sphere.png';

const Marketing = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1920;
    canvas.height = 1080;

    const bgImage = new window.Image();
    const logoImage = new window.Image();
    
    let loadedCount = 0;

    const tryDraw = () => {
      loadedCount++;
      if (loadedCount === 2) {
        drawMarketingGraphic(ctx, canvas.width, canvas.height, bgImage, logoImage);
        setIsRendering(false);
      }
    };

    bgImage.onload = tryDraw;
    logoImage.onload = tryDraw;

    bgImage.src = marketingBg;
    logoImage.src = sfhLogo;
  }, []);

  const drawMarketingGraphic = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number,
    bgImage: HTMLImageElement,
    logoImage: HTMLImageElement
  ) => {
    // Draw background
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

    // Cinematic overlay
    const overlayGradient = ctx.createLinearGradient(0, 0, width, 0);
    overlayGradient.addColorStop(0, 'rgba(0, 8, 12, 0.1)');
    overlayGradient.addColorStop(0.35, 'rgba(0, 12, 18, 0.3)');
    overlayGradient.addColorStop(0.6, 'rgba(0, 15, 22, 0.6)');
    overlayGradient.addColorStop(1, 'rgba(0, 18, 28, 0.88)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative elements - geometric shapes
    drawGeometricAccents(ctx, width, height);

    // Large Logo with intense glow
    const logoSize = 220;
    const logoX = width - 320;
    const logoY = 60;
    
    // Multiple glow layers
    ctx.shadowColor = 'rgba(20, 184, 166, 0.6)';
    ctx.shadowBlur = 60;
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    ctx.shadowBlur = 0;

    // Orbit ring around logo
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Orbit dots
    const orbitDots = [0, 90, 180, 270];
    orbitDots.forEach(angle => {
      const rad = angle * Math.PI / 180;
      const dotX = logoX + logoSize/2 + (logoSize/2 + 30) * Math.cos(rad);
      const dotY = logoY + logoSize/2 + (logoSize/2 + 30) * Math.sin(rad);
      ctx.fillStyle = '#14b8a6';
      ctx.shadowColor = 'rgba(20, 184, 166, 0.8)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Brand Name - HUGE and bold
    ctx.textAlign = 'right';
    const brandX = width - 80;
    
    ctx.font = '900 72px "Segoe UI", system-ui, sans-serif';
    ctx.shadowColor = 'rgba(20, 184, 166, 0.4)';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('STARTUP FACTORY', brandX, 380);
    
    // "HUB" massive with gradient
    ctx.font = '900 100px "Segoe UI", system-ui, sans-serif';
    const hubGradient = ctx.createLinearGradient(width - 400, 0, brandX, 0);
    hubGradient.addColorStop(0, '#0d9488');
    hubGradient.addColorStop(0.5, '#14b8a6');
    hubGradient.addColorStop(1, '#2dd4bf');
    ctx.fillStyle = hubGradient;
    ctx.fillText('HUB', brandX, 480);
    ctx.shadowBlur = 0;

    // Accent line under brand
    const lineGradient = ctx.createLinearGradient(width - 700, 0, brandX, 0);
    lineGradient.addColorStop(0, 'transparent');
    lineGradient.addColorStop(0.2, 'rgba(20, 184, 166, 0.3)');
    lineGradient.addColorStop(1, 'rgba(20, 184, 166, 1)');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width - 700, 510);
    ctx.lineTo(brandX, 510);
    ctx.stroke();

    // Tagline - large and readable
    ctx.font = '400 38px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText('The technology designed to help', brandX, 580);
    
    ctx.font = '700 44px "Segoe UI", system-ui, sans-serif';
    const tagGradient = ctx.createLinearGradient(width - 600, 0, brandX, 0);
    tagGradient.addColorStop(0, '#14b8a6');
    tagGradient.addColorStop(1, '#06b6d4');
    ctx.fillStyle = tagGradient;
    ctx.fillText('deep tech startups succeed.', brandX, 640);

    // "Built for Everyone" header
    ctx.font = '700 22px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('BUILT FOR EVERYONE', brandX, 720);

    // User type badges - larger 3x2 grid
    const userTypes = [
      { name: 'Startups', icon: '🚀', color: '#10b981' },
      { name: 'Investors', icon: '💎', color: '#8b5cf6' },
      { name: 'Mentors', icon: '🎯', color: '#f59e0b' },
      { name: 'Advisors', icon: '⚡', color: '#3b82f6' },
      { name: 'Students', icon: '🎓', color: '#ec4899' },
      { name: 'Accelerators', icon: '🏛️', color: '#14b8a6' },
    ];

    const badgeWidth = 180;
    const badgeHeight = 60;
    const badgeGap = 14;
    const gridStartX = brandX - (badgeWidth * 3 + badgeGap * 2);
    const badgeStartY = 760;

    userTypes.forEach((user, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const badgeX = gridStartX + col * (badgeWidth + badgeGap);
      const badgeY = badgeStartY + row * (badgeHeight + badgeGap);

      // Badge background
      ctx.fillStyle = `${user.color}25`;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 12);
      ctx.fill();

      // Badge border
      ctx.strokeStyle = `${user.color}70`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 12);
      ctx.stroke();

      // Top glow line
      ctx.strokeStyle = `${user.color}90`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(badgeX + 20, badgeY);
      ctx.lineTo(badgeX + badgeWidth - 20, badgeY);
      ctx.stroke();

      // Icon
      ctx.textAlign = 'left';
      ctx.font = '28px Arial';
      ctx.fillText(user.icon, badgeX + 16, badgeY + 42);

      // Name
      ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(user.name, badgeX + 56, badgeY + 40);
    });

    // CTA Button - prominent
    const ctaY = 920;
    const ctaWidth = 380;
    const ctaHeight = 70;
    const ctaX = brandX - ctaWidth;

    ctx.shadowColor = 'rgba(20, 184, 166, 0.7)';
    ctx.shadowBlur = 40;

    const ctaGradient = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaWidth, ctaY);
    ctaGradient.addColorStop(0, '#0d9488');
    ctaGradient.addColorStop(0.5, '#14b8a6');
    ctaGradient.addColorStop(1, '#0d9488');
    ctx.fillStyle = ctaGradient;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, 35);
    ctx.fill();
    ctx.shadowBlur = 0;

    // CTA text
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('START YOUR JOURNEY →', ctaX + ctaWidth / 2, ctaY + 45);

    // Website URL
    ctx.textAlign = 'right';
    ctx.font = '600 22px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('startupfactoryhub.com', brandX, 1040);

    // Corner accents
    drawCornerAccents(ctx, width, height);
  };

  const drawGeometricAccents = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Floating hexagons on left side
    const hexagons = [
      { x: 150, y: 200, size: 40, opacity: 0.15 },
      { x: 80, y: 500, size: 60, opacity: 0.1 },
      { x: 200, y: 750, size: 35, opacity: 0.12 },
      { x: 350, y: 350, size: 25, opacity: 0.08 },
      { x: 120, y: 900, size: 45, opacity: 0.1 },
    ];

    hexagons.forEach(hex => {
      ctx.strokeStyle = `rgba(20, 184, 166, ${hex.opacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 30) * Math.PI / 180;
        const x = hex.x + hex.size * Math.cos(angle);
        const y = hex.y + hex.size * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    });

    // Glowing particles
    const particles = [
      { x: 100, y: 150, size: 4 },
      { x: 300, y: 400, size: 3 },
      { x: 180, y: 650, size: 5 },
      { x: 400, y: 250, size: 3 },
      { x: 250, y: 850, size: 4 },
      { x: 500, y: 500, size: 3 },
      { x: 60, y: 700, size: 4 },
    ];

    particles.forEach(p => {
      ctx.fillStyle = 'rgba(20, 184, 166, 0.5)';
      ctx.shadowColor = 'rgba(20, 184, 166, 0.8)';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Connecting lines between some particles
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 150);
    ctx.lineTo(300, 400);
    ctx.lineTo(180, 650);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(400, 250);
    ctx.lineTo(500, 500);
    ctx.stroke();

    // Large decorative arc
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.08)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-200, height / 2, 500, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();
  };

  const drawCornerAccents = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const corners = [
      { x: 50, y: 50, angle: 0 },
      { x: width - 50, y: 50, angle: Math.PI / 2 },
      { x: width - 50, y: height - 50, angle: Math.PI },
      { x: 50, y: height - 50, angle: -Math.PI / 2 },
    ];

    corners.forEach(corner => {
      ctx.save();
      ctx.translate(corner.x, corner.y);
      ctx.rotate(corner.angle);
      
      const lineGradient = ctx.createLinearGradient(0, 0, 80, 0);
      lineGradient.addColorStop(0, 'rgba(20, 184, 166, 0.9)');
      lineGradient.addColorStop(1, 'transparent');
      
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(80, 0);
      ctx.stroke();

      const lineGradient2 = ctx.createLinearGradient(0, 0, 0, 80);
      lineGradient2.addColorStop(0, 'rgba(20, 184, 166, 0.9)');
      lineGradient2.addColorStop(1, 'transparent');
      
      ctx.strokeStyle = lineGradient2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 80);
      ctx.stroke();

      ctx.shadowColor = 'rgba(20, 184, 166, 0.9)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#14b8a6';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    });
  };

  const downloadImage = (format: 'png' | 'jpg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'jpg' ? 0.95 : undefined;
    
    link.download = `startup-factory-hub-marketing.${format}`;
    link.href = canvas.toDataURL(mimeType, quality);
    link.click();
    
    toast.success(`Downloaded as ${format.toUpperCase()}`);
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Startup Factory Hub - Marketing</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; }
            img { max-width: 100%; height: auto; }
            @media print { body { background: white; } img { width: 100%; } }
          </style>
        </head>
        <body>
          <img src="${canvas.toDataURL('image/png')}" />
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          
          <h1 className="text-lg font-semibold text-foreground">Marketing Graphics</h1>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadImage('png')} disabled={isRendering} className="gap-2">
              <Download className="h-4 w-4" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadImage('jpg')} disabled={isRendering} className="gap-2">
              <Image className="h-4 w-4" />
              JPG
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint} disabled={isRendering} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto">
          <div className="tech-card border-0 p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">Marketing Banner (1920×1080)</h2>
            <p className="text-muted-foreground text-sm">
              High-resolution marketing graphic ready for print, social media, or presentations.
            </p>
          </div>
          
          <div className="tech-card border-0 p-4 overflow-hidden">
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
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

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="tech-card border-0 p-4">
              <h3 className="font-medium text-foreground mb-1">Print Ready</h3>
              <p className="text-sm text-muted-foreground">1920×1080 resolution for banners and presentations.</p>
            </div>
            <div className="tech-card border-0 p-4">
              <h3 className="font-medium text-foreground mb-1">Social Media</h3>
              <p className="text-sm text-muted-foreground">Optimized 16:9 for LinkedIn, Twitter, and YouTube.</p>
            </div>
            <div className="tech-card border-0 p-4">
              <h3 className="font-medium text-foreground mb-1">Brand Consistent</h3>
              <p className="text-sm text-muted-foreground">Official Startup Factory Hub design language.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketing;
