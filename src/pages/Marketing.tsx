import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Image, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import marketingBg from '@/assets/marketing-bg.jpg';
import sfhLogo from '@/assets/sfh-logo-sphere.png';

// User type badge images - load from assets
import startupBadge from '@/assets/startup-badge.png';
import investorBadge from '@/assets/investor-badge.png';
import mentorBadge from '@/assets/mentor-badge.png';
import advisorBadge from '@/assets/advisor-badge.png';
import studentBadge from '@/assets/student-badge.png';

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

    // Load images
    const bgImage = new window.Image();
    const logoImage = new window.Image();
    
    let loadedCount = 0;
    const totalImages = 2;

    const tryDraw = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
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

    // Cinematic dark gradient overlay - darker on right
    const overlayGradient = ctx.createLinearGradient(0, 0, width, 0);
    overlayGradient.addColorStop(0, 'rgba(0, 10, 15, 0.15)');
    overlayGradient.addColorStop(0.4, 'rgba(0, 15, 20, 0.35)');
    overlayGradient.addColorStop(0.7, 'rgba(0, 18, 25, 0.7)');
    overlayGradient.addColorStop(1, 'rgba(0, 20, 30, 0.9)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, width, height);

    // Content area - right side
    const contentX = width - 750;
    const contentPadding = 60;

    // Draw the logo - large and prominent
    const logoSize = 140;
    const logoX = contentX + 480;
    const logoY = 80;
    
    // Logo glow effect
    ctx.shadowColor = 'rgba(20, 184, 166, 0.5)';
    ctx.shadowBlur = 40;
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    ctx.shadowBlur = 0;

    // Brand name - right aligned
    ctx.textAlign = 'right';
    ctx.font = '800 52px "Segoe UI", system-ui, sans-serif';
    
    // Text shadow for depth
    ctx.shadowColor = 'rgba(20, 184, 166, 0.4)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('STARTUP FACTORY', width - contentPadding, 300);
    
    // "HUB" with gradient
    ctx.font = '900 64px "Segoe UI", system-ui, sans-serif';
    const hubGradient = ctx.createLinearGradient(width - 250, 0, width - contentPadding, 0);
    hubGradient.addColorStop(0, '#0d9488');
    hubGradient.addColorStop(0.5, '#14b8a6');
    hubGradient.addColorStop(1, '#2dd4bf');
    ctx.fillStyle = hubGradient;
    ctx.fillText('HUB', width - contentPadding, 370);
    ctx.shadowBlur = 0;

    // Decorative line
    const lineGradient = ctx.createLinearGradient(contentX, 0, width - contentPadding, 0);
    lineGradient.addColorStop(0, 'transparent');
    lineGradient.addColorStop(0.3, 'rgba(20, 184, 166, 0.2)');
    lineGradient.addColorStop(1, 'rgba(20, 184, 166, 0.8)');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(contentX, 405);
    ctx.lineTo(width - contentPadding, 405);
    ctx.stroke();

    // Tagline
    ctx.font = '300 32px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('The technology designed to help', width - contentPadding, 470);
    
    ctx.font = '600 36px "Segoe UI", system-ui, sans-serif';
    const tagGradient = ctx.createLinearGradient(contentX + 200, 0, width - contentPadding, 0);
    tagGradient.addColorStop(0, '#14b8a6');
    tagGradient.addColorStop(1, '#06b6d4');
    ctx.fillStyle = tagGradient;
    ctx.fillText('deep tech startups succeed.', width - contentPadding, 520);

    // "Built for Everyone" section
    ctx.font = '600 16px "Segoe UI", system-ui, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('BUILT FOR EVERYONE', width - contentPadding, 590);

    // User type cards - premium hexagon style matching main page
    const userTypes = [
      { name: 'Startups', icon: '🚀', color: '#10b981', desc: 'Build & grow' },
      { name: 'Investors', icon: '💎', color: '#8b5cf6', desc: 'Discover deals' },
      { name: 'Mentors', icon: '🎯', color: '#f59e0b', desc: 'Guide founders' },
      { name: 'Advisors', icon: '⚡', color: '#3b82f6', desc: 'Share expertise' },
      { name: 'Students', icon: '🎓', color: '#ec4899', desc: 'Learn & earn' },
      { name: 'Accelerators', icon: '🏛️', color: '#14b8a6', desc: 'Scale programs' },
    ];

    // Draw user type cards in a 2x3 grid
    const cardWidth = 200;
    const cardHeight = 80;
    const cardGap = 16;
    const gridStartX = width - contentPadding - (cardWidth * 2 + cardGap);
    let cardY = 620;

    userTypes.forEach((user, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const cardX = gridStartX + col * (cardWidth + cardGap);
      const currentY = cardY + row * (cardHeight + cardGap);

      // Card background with glassmorphism
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.roundRect(cardX, currentY, cardWidth, cardHeight, 16);
      ctx.fill();

      // Card border with user color
      ctx.strokeStyle = `${user.color}60`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cardX, currentY, cardWidth, cardHeight, 16);
      ctx.stroke();

      // Glow accent on top
      const glowGradient = ctx.createLinearGradient(cardX, currentY, cardX + cardWidth, currentY);
      glowGradient.addColorStop(0, 'transparent');
      glowGradient.addColorStop(0.5, `${user.color}80`);
      glowGradient.addColorStop(1, 'transparent');
      ctx.strokeStyle = glowGradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cardX + 30, currentY);
      ctx.lineTo(cardX + cardWidth - 30, currentY);
      ctx.stroke();

      // Hexagon icon container
      const hexX = cardX + 44;
      const hexY = currentY + cardHeight / 2;
      const hexSize = 26;
      
      // Hexagon background
      ctx.fillStyle = `${user.color}30`;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 30) * Math.PI / 180;
        const x = hexX + hexSize * Math.cos(angle);
        const y = hexY + hexSize * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
      // Hexagon border
      ctx.strokeStyle = `${user.color}80`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Icon emoji
      ctx.textAlign = 'center';
      ctx.font = '22px Arial';
      ctx.fillText(user.icon, hexX, hexY + 8);

      // User name
      ctx.textAlign = 'left';
      ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(user.name, cardX + 80, currentY + 38);

      // Description
      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(user.desc, cardX + 80, currentY + 58);
    });

    // CTA Button
    const ctaY = 930;
    const ctaWidth = 320;
    const ctaHeight = 60;
    const ctaX = width - contentPadding - ctaWidth;

    // Button glow
    ctx.shadowColor = 'rgba(20, 184, 166, 0.6)';
    ctx.shadowBlur = 30;

    // Button gradient
    const ctaGradient = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaWidth, ctaY);
    ctaGradient.addColorStop(0, '#0d9488');
    ctaGradient.addColorStop(0.5, '#14b8a6');
    ctaGradient.addColorStop(1, '#0d9488');
    ctx.fillStyle = ctaGradient;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, 30);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Button text
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('START YOUR JOURNEY →', ctaX + ctaWidth / 2, ctaY + 38);

    // Website URL
    ctx.textAlign = 'right';
    ctx.font = '18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('startupfactoryhub.com', width - contentPadding, 1040);

    // Draw corner accents
    drawCornerAccents(ctx, width, height);
    
    // Add floating particles for depth
    drawParticles(ctx, width, height);
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Subtle floating particles on the left side
    const particles = [
      { x: 120, y: 200, size: 3, opacity: 0.3 },
      { x: 280, y: 450, size: 2, opacity: 0.2 },
      { x: 150, y: 700, size: 4, opacity: 0.25 },
      { x: 400, y: 300, size: 2, opacity: 0.15 },
      { x: 320, y: 850, size: 3, opacity: 0.2 },
      { x: 500, y: 150, size: 2, opacity: 0.15 },
      { x: 600, y: 600, size: 3, opacity: 0.1 },
    ];

    particles.forEach(p => {
      ctx.fillStyle = `rgba(20, 184, 166, ${p.opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Subtle glow
      ctx.fillStyle = `rgba(20, 184, 166, ${p.opacity * 0.3})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();
    });
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
      
      const lineGradient = ctx.createLinearGradient(0, 0, 60, 0);
      lineGradient.addColorStop(0, 'rgba(20, 184, 166, 0.7)');
      lineGradient.addColorStop(1, 'transparent');
      
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(60, 0);
      ctx.stroke();

      const lineGradient2 = ctx.createLinearGradient(0, 0, 0, 60);
      lineGradient2.addColorStop(0, 'rgba(20, 184, 166, 0.7)');
      lineGradient2.addColorStop(1, 'transparent');
      
      ctx.strokeStyle = lineGradient2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 60);
      ctx.stroke();

      // Corner dot with glow
      ctx.shadowColor = 'rgba(20, 184, 166, 0.8)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#14b8a6';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
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
