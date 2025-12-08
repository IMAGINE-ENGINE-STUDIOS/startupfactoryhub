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

    // Set canvas dimensions
    canvas.width = 1920;
    canvas.height = 1080;

    // Load images and draw
    const bgImage = new window.Image();
    const logoImage = new window.Image();
    
    let bgLoaded = false;
    let logoLoaded = false;

    const tryDraw = () => {
      if (bgLoaded && logoLoaded) {
        drawMarketingGraphic(ctx, canvas.width, canvas.height, bgImage, logoImage);
        setIsRendering(false);
      }
    };

    bgImage.onload = () => {
      bgLoaded = true;
      tryDraw();
    };

    logoImage.onload = () => {
      logoLoaded = true;
      tryDraw();
    };

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
    // Draw background image with cover behavior
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

    // Dark gradient overlay - darker on right for content readability
    const overlayGradient = ctx.createLinearGradient(0, 0, width, 0);
    overlayGradient.addColorStop(0, 'rgba(0, 10, 15, 0.2)');
    overlayGradient.addColorStop(0.5, 'rgba(0, 15, 25, 0.4)');
    overlayGradient.addColorStop(1, 'rgba(0, 20, 30, 0.85)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, width, height);

    // Right side content panel
    const panelX = width - 700;
    const panelY = 60;
    const panelWidth = 620;
    const panelHeight = 960;

    // Glassmorphism panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 20);
    ctx.fill();

    // Panel border
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 20);
    ctx.stroke();

    // Logo - right aligned
    const logoSize = 100;
    const logoX = panelX + panelWidth - logoSize - 40;
    ctx.drawImage(logoImage, logoX, panelY + 40, logoSize, logoSize);

    // Brand name - right aligned
    ctx.textAlign = 'right';
    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('STARTUP FACTORY HUB', panelX + panelWidth - 40, panelY + 190);

    // Decorative line
    const lineGradient = ctx.createLinearGradient(panelX + 100, 0, panelX + panelWidth - 40, 0);
    lineGradient.addColorStop(0, 'transparent');
    lineGradient.addColorStop(1, 'rgba(20, 184, 166, 0.8)');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(panelX + 100, panelY + 220);
    ctx.lineTo(panelX + panelWidth - 40, panelY + 220);
    ctx.stroke();

    // Tagline
    ctx.font = '600 28px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('The technology designed to help', panelX + panelWidth - 40, panelY + 280);
    
    const tagGradient = ctx.createLinearGradient(panelX, 0, panelX + panelWidth, 0);
    tagGradient.addColorStop(0, '#14b8a6');
    tagGradient.addColorStop(1, '#06b6d4');
    ctx.fillStyle = tagGradient;
    ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
    ctx.fillText('deep tech startups succeed.', panelX + panelWidth - 40, panelY + 320);

    // Built for everyone section
    ctx.font = '600 18px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('BUILT FOR EVERYONE', panelX + panelWidth - 40, panelY + 390);

    // User type badges
    const userTypes = [
      { name: 'Startups', icon: '🚀', color: '#10b981' },
      { name: 'Investors', icon: '💎', color: '#8b5cf6' },
      { name: 'Mentors', icon: '🎯', color: '#f59e0b' },
      { name: 'Advisors', icon: '⚡', color: '#3b82f6' },
      { name: 'Students', icon: '📚', color: '#ec4899' },
      { name: 'Accelerators', icon: '🏛️', color: '#14b8a6' },
    ];

    let badgeY = panelY + 430;
    const badgeWidth = 240;
    const badgeHeight = 52;

    userTypes.forEach((user) => {
      const badgeX = panelX + panelWidth - badgeWidth - 40;

      // Badge background
      ctx.fillStyle = `${user.color}20`;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 10);
      ctx.fill();

      // Badge border
      ctx.strokeStyle = `${user.color}50`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 10);
      ctx.stroke();

      // Icon
      ctx.textAlign = 'left';
      ctx.font = '24px Arial';
      ctx.fillText(user.icon, badgeX + 16, badgeY + 34);

      // Name
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = user.color;
      ctx.fillText(user.name, badgeX + 54, badgeY + 33);

      badgeY += 62;
    });

    // CTA Button
    const ctaY = panelY + panelHeight - 140;
    const ctaWidth = 280;
    const ctaHeight = 56;
    const ctaX = panelX + panelWidth - ctaWidth - 40;

    // Button glow
    ctx.shadowColor = 'rgba(20, 184, 166, 0.6)';
    ctx.shadowBlur = 25;

    // Button gradient
    const ctaGradient = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaWidth, ctaY);
    ctaGradient.addColorStop(0, '#0d9488');
    ctaGradient.addColorStop(1, '#14b8a6');
    ctx.fillStyle = ctaGradient;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, 28);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Button text
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('START YOUR JOURNEY →', ctaX + ctaWidth / 2, ctaY + 35);

    // Website URL
    ctx.textAlign = 'right';
    ctx.font = '18px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('startupfactoryhub.com', panelX + panelWidth - 40, panelY + panelHeight - 50);

    // Corner accents
    drawCornerAccents(ctx, width, height);
  };

  const drawCornerAccents = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const corners = [
      { x: 40, y: 40, angle: 0 },
      { x: width - 40, y: 40, angle: Math.PI / 2 },
      { x: width - 40, y: height - 40, angle: Math.PI },
      { x: 40, y: height - 40, angle: -Math.PI / 2 },
    ];

    corners.forEach(corner => {
      ctx.save();
      ctx.translate(corner.x, corner.y);
      ctx.rotate(corner.angle);
      
      const lineGradient = ctx.createLinearGradient(0, 0, 50, 0);
      lineGradient.addColorStop(0, 'rgba(20, 184, 166, 0.6)');
      lineGradient.addColorStop(1, 'transparent');
      
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(50, 0);
      ctx.stroke();

      const lineGradient2 = ctx.createLinearGradient(0, 0, 0, 50);
      lineGradient2.addColorStop(0, 'rgba(20, 184, 166, 0.6)');
      lineGradient2.addColorStop(1, 'transparent');
      
      ctx.strokeStyle = lineGradient2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 50);
      ctx.stroke();

      ctx.fillStyle = '#14b8a6';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

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
            @media print {
              body { background: white; }
              img { width: 100%; }
            }
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
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          
          <h1 className="text-lg font-semibold text-foreground">Marketing Graphics</h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadImage('png')}
              disabled={isRendering}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadImage('jpg')}
              disabled={isRendering}
              className="gap-2"
            >
              <Image className="h-4 w-4" />
              JPG
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              disabled={isRendering}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas Preview */}
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto">
          <div className="tech-card border-0 p-6 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">Marketing Banner (1920×1080)</h2>
            <p className="text-muted-foreground text-sm">
              High-resolution marketing graphic ready for print, social media, or presentations. 
              Download as PNG for best quality or JPG for smaller file size.
            </p>
          </div>
          
          <div className="tech-card border-0 p-4 overflow-hidden">
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain rounded-lg"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
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

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="tech-card border-0 p-4">
              <h3 className="font-medium text-foreground mb-1">Print Ready</h3>
              <p className="text-sm text-muted-foreground">
                1920×1080 resolution, perfect for banners, posters, and presentations.
              </p>
            </div>
            <div className="tech-card border-0 p-4">
              <h3 className="font-medium text-foreground mb-1">Social Media</h3>
              <p className="text-sm text-muted-foreground">
                Optimized 16:9 aspect ratio for LinkedIn, Twitter, and YouTube.
              </p>
            </div>
            <div className="tech-card border-0 p-4">
              <h3 className="font-medium text-foreground mb-1">Brand Consistent</h3>
              <p className="text-sm text-muted-foreground">
                Uses official Startup Factory Hub colors and design language.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketing;
