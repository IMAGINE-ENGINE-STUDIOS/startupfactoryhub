import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Image, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Marketing = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

    // Draw the marketing graphic
    drawMarketingGraphic(ctx, canvas.width, canvas.height);
    setIsRendering(false);
  }, []);

  const drawMarketingGraphic = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Background gradient - deep tech dark
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#030712');
    bgGradient.addColorStop(0.3, '#0a1628');
    bgGradient.addColorStop(0.7, '#041420');
    bgGradient.addColorStop(1, '#020617');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw circuit grid pattern
    drawCircuitGrid(ctx, width, height);

    // Draw glowing orbs
    drawGlowingOrbs(ctx, width, height);

    // Draw hexagon pattern
    drawHexagonPattern(ctx, width, height);

    // Draw main content area with glassmorphism effect
    drawGlassmorphismCard(ctx, width, height);

    // Draw logo placeholder circle
    drawLogoArea(ctx, width, height);

    // Draw tagline
    drawTagline(ctx, width, height);

    // Draw call to action
    drawCTA(ctx, width, height);

    // Draw brand name
    drawBrandName(ctx, width, height);

    // Draw decorative elements
    drawDecorativeElements(ctx, width, height);

    // Draw website URL
    drawWebsiteURL(ctx, width, height);
  };

  const drawCircuitGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.08)';
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Circuit nodes
    ctx.fillStyle = 'rgba(20, 184, 166, 0.15)';
    for (let x = 0; x < width; x += 180) {
      for (let y = 0; y < height; y += 180) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Circuit paths
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.lineWidth = 2;
    const paths = [
      [[100, 200], [300, 200], [300, 400], [500, 400]],
      [[1600, 100], [1600, 300], [1400, 300], [1400, 500]],
      [[200, 800], [400, 800], [400, 600], [600, 600]],
      [[1700, 700], [1500, 700], [1500, 900], [1300, 900]],
    ];

    paths.forEach(path => {
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      path.slice(1).forEach(point => {
        ctx.lineTo(point[0], point[1]);
      });
      ctx.stroke();
    });
  };

  const drawGlowingOrbs = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const orbs = [
      { x: 150, y: 150, radius: 200, color: 'rgba(20, 184, 166, 0.15)' },
      { x: width - 200, y: 200, radius: 250, color: 'rgba(6, 182, 212, 0.12)' },
      { x: 300, y: height - 200, radius: 180, color: 'rgba(16, 185, 129, 0.1)' },
      { x: width - 300, y: height - 150, radius: 220, color: 'rgba(20, 184, 166, 0.08)' },
      { x: width / 2, y: height / 2, radius: 400, color: 'rgba(6, 182, 212, 0.05)' },
    ];

    orbs.forEach(orb => {
      const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
      gradient.addColorStop(0, orb.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawHexagonPattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.06)';
    ctx.lineWidth = 1;

    const hexSize = 40;
    const hexHeight = hexSize * Math.sqrt(3);

    for (let row = 0; row < height / hexHeight + 1; row++) {
      for (let col = 0; col < width / (hexSize * 1.5) + 1; col++) {
        const x = col * hexSize * 1.5;
        const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
        
        if (Math.random() > 0.7) {
          drawHexagon(ctx, x, y, hexSize * 0.4);
        }
      }
    }
  };

  const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const hx = x + size * Math.cos(angle);
      const hy = y + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
  };

  const drawGlassmorphismCard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const cardX = width / 2 - 600;
    const cardY = height / 2 - 280;
    const cardWidth = 1200;
    const cardHeight = 560;
    const radius = 30;

    // Card background with glassmorphism
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, radius);
    ctx.fill();

    // Card border glow
    const borderGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
    borderGradient.addColorStop(0, 'rgba(20, 184, 166, 0.5)');
    borderGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.3)');
    borderGradient.addColorStop(1, 'rgba(16, 185, 129, 0.5)');
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, radius);
    ctx.stroke();

    // Inner glow
    const innerGlow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 600);
    innerGlow.addColorStop(0, 'rgba(20, 184, 166, 0.08)');
    innerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.roundRect(cardX + 10, cardY + 10, cardWidth - 20, cardHeight - 20, radius - 5);
    ctx.fill();
  };

  const drawLogoArea = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const logoX = width / 2;
    const logoY = height / 2 - 140;
    const logoRadius = 60;

    // Logo circle with gradient border
    const logoGradient = ctx.createLinearGradient(logoX - logoRadius, logoY - logoRadius, logoX + logoRadius, logoY + logoRadius);
    logoGradient.addColorStop(0, '#14b8a6');
    logoGradient.addColorStop(1, '#06b6d4');
    
    ctx.strokeStyle = logoGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Logo glow
    const glowGradient = ctx.createRadialGradient(logoX, logoY, logoRadius * 0.5, logoX, logoY, logoRadius * 2);
    glowGradient.addColorStop(0, 'rgba(20, 184, 166, 0.3)');
    glowGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Rocket icon representation
    ctx.fillStyle = '#14b8a6';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚀', logoX, logoY);
  };

  const drawTagline = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const taglineY = height / 2 + 20;

    // Main tagline with gradient
    ctx.font = 'bold 52px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text glow
    ctx.shadowColor = 'rgba(20, 184, 166, 0.5)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('The technology designed to help', width / 2, taglineY);
    
    // Second line with accent color
    const gradient = ctx.createLinearGradient(width / 2 - 300, taglineY + 60, width / 2 + 300, taglineY + 60);
    gradient.addColorStop(0, '#14b8a6');
    gradient.addColorStop(0.5, '#06b6d4');
    gradient.addColorStop(1, '#10b981');
    ctx.fillStyle = gradient;
    ctx.fillText('deep tech startups succeed.', width / 2, taglineY + 70);

    ctx.shadowBlur = 0;
  };

  const drawCTA = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const ctaX = width / 2;
    const ctaY = height / 2 + 180;
    const ctaWidth = 320;
    const ctaHeight = 60;

    // CTA button background
    const ctaGradient = ctx.createLinearGradient(ctaX - ctaWidth / 2, ctaY, ctaX + ctaWidth / 2, ctaY);
    ctaGradient.addColorStop(0, '#14b8a6');
    ctaGradient.addColorStop(1, '#06b6d4');

    ctx.fillStyle = ctaGradient;
    ctx.beginPath();
    ctx.roundRect(ctaX - ctaWidth / 2, ctaY - ctaHeight / 2, ctaWidth, ctaHeight, 12);
    ctx.fill();

    // CTA glow
    ctx.shadowColor = 'rgba(20, 184, 166, 0.6)';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.roundRect(ctaX - ctaWidth / 2, ctaY - ctaHeight / 2, ctaWidth, ctaHeight, 12);
    ctx.fill();
    ctx.shadowBlur = 0;

    // CTA text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START YOUR JOURNEY →', ctaX, ctaY);
  };

  const drawBrandName = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('STARTUP FACTORY HUB', width / 2, height / 2 - 210);

    // Decorative line under brand
    const lineGradient = ctx.createLinearGradient(width / 2 - 150, 0, width / 2 + 150, 0);
    lineGradient.addColorStop(0, 'transparent');
    lineGradient.addColorStop(0.5, 'rgba(20, 184, 166, 0.6)');
    lineGradient.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 150, height / 2 - 190);
    ctx.lineTo(width / 2 + 150, height / 2 - 190);
    ctx.stroke();
  };

  const drawDecorativeElements = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Corner accents
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
      
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(40, 0);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 40);
      ctx.stroke();

      ctx.fillStyle = 'rgba(20, 184, 166, 0.6)';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // Floating particles
    ctx.fillStyle = 'rgba(20, 184, 166, 0.3)';
    const particles = [
      { x: 200, y: 300, size: 4 },
      { x: 1700, y: 400, size: 3 },
      { x: 300, y: 700, size: 5 },
      { x: 1600, y: 750, size: 4 },
      { x: 500, y: 150, size: 3 },
      { x: 1400, y: 180, size: 4 },
      { x: 180, y: 550, size: 3 },
      { x: 1750, y: 600, size: 5 },
    ];

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawWebsiteURL = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.font = '20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.fillText('startupfactoryhub.com', width / 2, height / 2 + 250);
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
      <div className="pt-20 pb-8 px-4" ref={containerRef}>
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
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <div className="text-muted-foreground">Rendering graphic...</div>
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
