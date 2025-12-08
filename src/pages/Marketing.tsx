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

    // Add cinematic dark gradient overlay
    const overlayGradient = ctx.createLinearGradient(0, 0, width, height);
    overlayGradient.addColorStop(0, 'rgba(0, 20, 30, 0.5)');
    overlayGradient.addColorStop(0.4, 'rgba(0, 10, 20, 0.3)');
    overlayGradient.addColorStop(0.7, 'rgba(0, 15, 25, 0.4)');
    overlayGradient.addColorStop(1, 'rgba(0, 20, 35, 0.6)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw network connections
    drawNetworkConnections(ctx, width, height);

    // Draw glowing particles
    drawGlowingParticles(ctx, width, height);

    // Draw logo
    drawLogo(ctx, width, height, logoImage);

    // Draw brand name
    drawBrandName(ctx, width, height);

    // Draw tagline
    drawTagline(ctx, width, height);

    // Draw call to action
    drawCTA(ctx, width, height);

    // Draw website URL
    drawWebsiteURL(ctx, width, height);

    // Draw corner accents
    drawCornerAccents(ctx, width, height);
  };

  const drawNetworkConnections = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Network nodes positioned around the canvas
    const nodes = [
      { x: 180, y: 120, size: 8, glow: true },
      { x: 350, y: 200, size: 6, glow: false },
      { x: 150, y: 350, size: 7, glow: true },
      { x: 280, y: 480, size: 5, glow: false },
      { x: 100, y: 600, size: 8, glow: true },
      { x: 220, y: 750, size: 6, glow: false },
      { x: 380, y: 850, size: 7, glow: true },
      { x: 1650, y: 100, size: 8, glow: true },
      { x: 1750, y: 250, size: 6, glow: false },
      { x: 1580, y: 380, size: 7, glow: true },
      { x: 1700, y: 520, size: 5, glow: false },
      { x: 1820, y: 650, size: 8, glow: true },
      { x: 1600, y: 780, size: 6, glow: false },
      { x: 1720, y: 920, size: 7, glow: true },
      { x: 500, y: 150, size: 5, glow: false },
      { x: 1400, y: 180, size: 5, glow: false },
      { x: 600, y: 900, size: 6, glow: true },
      { x: 1300, y: 880, size: 6, glow: true },
    ];

    // Connection paths
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
      [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13],
      [0, 14], [14, 7],
      [6, 16], [16, 17], [17, 13],
      [1, 14], [8, 15],
    ];

    // Draw connections with gradient
    connections.forEach(([from, to]) => {
      const fromNode = nodes[from];
      const toNode = nodes[to];
      
      const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
      gradient.addColorStop(0, 'rgba(20, 184, 166, 0.6)');
      gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.3)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.6)');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach(node => {
      if (node.glow) {
        // Glow effect
        const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size * 4);
        glowGradient.addColorStop(0, 'rgba(20, 184, 166, 0.5)');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node core
      const nodeGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.size);
      nodeGradient.addColorStop(0, '#14b8a6');
      nodeGradient.addColorStop(0.7, '#0d9488');
      nodeGradient.addColorStop(1, '#0f766e');
      
      ctx.fillStyle = nodeGradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(node.x - node.size * 0.3, node.y - node.size * 0.3, node.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawGlowingParticles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const particles = [
      { x: 450, y: 300, size: 3, opacity: 0.8 },
      { x: 1480, y: 350, size: 2.5, opacity: 0.7 },
      { x: 700, y: 180, size: 2, opacity: 0.6 },
      { x: 1250, y: 220, size: 3, opacity: 0.8 },
      { x: 550, y: 820, size: 2.5, opacity: 0.7 },
      { x: 1380, y: 800, size: 2, opacity: 0.6 },
      { x: 850, y: 950, size: 3, opacity: 0.5 },
      { x: 1100, y: 920, size: 2.5, opacity: 0.6 },
    ];

    particles.forEach(p => {
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 8);
      glow.addColorStop(0, `rgba(6, 182, 212, ${p.opacity})`);
      glow.addColorStop(0.5, `rgba(20, 184, 166, ${p.opacity * 0.3})`);
      glow.addColorStop(1, 'transparent');
      
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawLogo = (ctx: CanvasRenderingContext2D, width: number, height: number, logoImage: HTMLImageElement) => {
    const logoSize = 140;
    const logoX = width / 2 - logoSize / 2;
    const logoY = 180;

    // Glow behind logo
    const glowGradient = ctx.createRadialGradient(
      width / 2, logoY + logoSize / 2, logoSize * 0.3,
      width / 2, logoY + logoSize / 2, logoSize * 1.2
    );
    glowGradient.addColorStop(0, 'rgba(20, 184, 166, 0.4)');
    glowGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.2)');
    glowGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(width / 2, logoY + logoSize / 2, logoSize * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Draw logo image
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

    // Add subtle ring around logo
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width / 2, logoY + logoSize / 2, logoSize / 2 + 10, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawBrandName = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text shadow/glow
    ctx.shadowColor = 'rgba(20, 184, 166, 0.8)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('STARTUP FACTORY HUB', width / 2, 380);
    ctx.shadowBlur = 0;

    // Decorative line
    const lineGradient = ctx.createLinearGradient(width / 2 - 200, 0, width / 2 + 200, 0);
    lineGradient.addColorStop(0, 'transparent');
    lineGradient.addColorStop(0.2, 'rgba(20, 184, 166, 0.8)');
    lineGradient.addColorStop(0.5, 'rgba(6, 182, 212, 1)');
    lineGradient.addColorStop(0.8, 'rgba(20, 184, 166, 0.8)');
    lineGradient.addColorStop(1, 'transparent');
    
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 200, 420);
    ctx.lineTo(width / 2 + 200, 420);
    ctx.stroke();
  };

  const drawTagline = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Main tagline
    ctx.font = '600 56px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow effect
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('The technology designed to help', width / 2, 520);
    ctx.shadowBlur = 0;

    // Second line with gradient
    const gradient = ctx.createLinearGradient(width / 2 - 400, 590, width / 2 + 400, 590);
    gradient.addColorStop(0, '#14b8a6');
    gradient.addColorStop(0.3, '#06b6d4');
    gradient.addColorStop(0.7, '#10b981');
    gradient.addColorStop(1, '#14b8a6');
    
    ctx.shadowColor = 'rgba(20, 184, 166, 0.6)';
    ctx.shadowBlur = 25;
    ctx.fillStyle = gradient;
    ctx.font = 'bold 60px "Segoe UI", Arial, sans-serif';
    ctx.fillText('deep tech startups succeed.', width / 2, 600);
    ctx.shadowBlur = 0;
  };

  const drawCTA = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const ctaX = width / 2;
    const ctaY = 750;
    const ctaWidth = 380;
    const ctaHeight = 70;

    // Button glow
    ctx.shadowColor = 'rgba(20, 184, 166, 0.8)';
    ctx.shadowBlur = 40;

    // Button background gradient
    const btnGradient = ctx.createLinearGradient(ctaX - ctaWidth / 2, ctaY, ctaX + ctaWidth / 2, ctaY);
    btnGradient.addColorStop(0, '#0d9488');
    btnGradient.addColorStop(0.5, '#14b8a6');
    btnGradient.addColorStop(1, '#0d9488');

    ctx.fillStyle = btnGradient;
    ctx.beginPath();
    ctx.roundRect(ctaX - ctaWidth / 2, ctaY - ctaHeight / 2, ctaWidth, ctaHeight, 12);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Button border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(ctaX - ctaWidth / 2, ctaY - ctaHeight / 2, ctaWidth, ctaHeight, 12);
    ctx.stroke();

    // Button text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START YOUR JOURNEY →', ctaX, ctaY);
  };

  const drawWebsiteURL = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.font = '22px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('startupfactoryhub.com', width / 2, 850);
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
      
      // Corner lines
      const lineGradient = ctx.createLinearGradient(0, 0, 60, 0);
      lineGradient.addColorStop(0, 'rgba(20, 184, 166, 0.8)');
      lineGradient.addColorStop(1, 'transparent');
      
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(60, 0);
      ctx.stroke();

      const lineGradient2 = ctx.createLinearGradient(0, 0, 0, 60);
      lineGradient2.addColorStop(0, 'rgba(20, 184, 166, 0.8)');
      lineGradient2.addColorStop(1, 'transparent');
      
      ctx.strokeStyle = lineGradient2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 60);
      ctx.stroke();

      // Corner dot
      ctx.fillStyle = '#14b8a6';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
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
