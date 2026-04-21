import { useRef, useEffect, useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, Upload, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import sfhLogo from '@/assets/sfh-logo-sphere.png';
import conferenceBg from '@/assets/conference-hall-bg.webp';

const HotDealsWinnerBanner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [logoSrc, setLogoSrc] = useState<string>(sfhLogo);
  const [winnerName, setWinnerName] = useState<string>('YOUR STARTUP');
  const [pitchTitle, setPitchTitle] = useState<string>('Hot Deals in the Space Industry');

  const renderBanner = () => {
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const bgImage = new window.Image();
    const logoImage = new window.Image();
    logoImage.crossOrigin = 'anonymous';

    let loadedCount = 0;
    const tryDraw = () => {
      loadedCount++;
      if (loadedCount === 2) {
        drawBanner(ctx, displayWidth, displayHeight, bgImage, logoImage);
        setIsRendering(false);
      }
    };

    bgImage.onload = tryDraw;
    logoImage.onload = tryDraw;
    logoImage.onerror = () => {
      // Fallback to default logo if uploaded image fails
      logoImage.src = sfhLogo;
    };
    bgImage.src = conferenceBg;
    logoImage.src = logoSrc;
  };

  useEffect(() => {
    setIsRendering(true);
    renderBanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoSrc, winnerName, pitchTitle]);

  const drawBanner = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bgImage: HTMLImageElement,
    logoImage: HTMLImageElement,
  ) => {
    // === BACKGROUND IMAGE (cover) ===
    const bgRatio = bgImage.width / bgImage.height;
    const canvasRatio = width / height;
    let dw = width, dh = height, ox = 0, oy = 0;
    if (bgRatio > canvasRatio) { dw = height * bgRatio; ox = -(dw - width) / 2; }
    else { dh = width / bgRatio; oy = -(dh - height) / 2; }
    ctx.drawImage(bgImage, ox, oy, dw, dh);

    // === DARK CINEMATIC OVERLAY ===
    const overlay = ctx.createLinearGradient(0, 0, 0, height);
    overlay.addColorStop(0, 'rgba(8, 5, 0, 0.55)');
    overlay.addColorStop(0.5, 'rgba(8, 5, 0, 0.65)');
    overlay.addColorStop(1, 'rgba(8, 5, 0, 0.85)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    // === RADIAL SPOTLIGHT (top-center, like a stage light) ===
    const spotlight = ctx.createRadialGradient(width / 2, 80, 50, width / 2, 80, 600);
    spotlight.addColorStop(0, 'rgba(250, 204, 21, 0.18)');
    spotlight.addColorStop(0.5, 'rgba(234, 88, 12, 0.08)');
    spotlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spotlight;
    ctx.fillRect(0, 0, width, height);

    // === SIDE GRADIENTS (vignette) ===
    const leftVig = ctx.createLinearGradient(0, 0, width * 0.3, 0);
    leftVig.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
    leftVig.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = leftVig;
    ctx.fillRect(0, 0, width * 0.3, height);

    const rightVig = ctx.createLinearGradient(width * 0.7, 0, width, 0);
    rightVig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    rightVig.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = rightVig;
    ctx.fillRect(width * 0.7, 0, width * 0.3, height);

    // === TOP RIBBON ===
    const ribbonGrad = ctx.createLinearGradient(0, 0, width, 0);
    ribbonGrad.addColorStop(0, 'rgba(220, 38, 38, 0.95)');
    ribbonGrad.addColorStop(0.5, 'rgba(234, 88, 12, 0.95)');
    ribbonGrad.addColorStop(1, 'rgba(250, 204, 21, 0.95)');
    ctx.fillStyle = ribbonGrad;
    ctx.fillRect(0, 0, width, 42);

    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆  HOT DEALS IN THE SPACE INDUSTRY  ·  WINNER ANNOUNCEMENT  🏆', width / 2, 21);

    // === CORNER ACCENTS ===
    const drawCorner = (cx: number, cy: number, dx: number, dy: number) => {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * 40);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * 40, cy);
      ctx.stroke();
    };
    drawCorner(30, 70, 1, 1);
    drawCorner(width - 30, 70, -1, 1);
    drawCorner(30, height - 30, 1, -1);
    drawCorner(width - 30, height - 30, -1, -1);

    // === CENTER STAGE - LOGO ===
    const logoSize = 130;
    const logoCX = width / 2;
    const logoCY = 175;

    // Logo glow
    const logoGlow = ctx.createRadialGradient(logoCX, logoCY, 0, logoCX, logoCY, logoSize);
    logoGlow.addColorStop(0, 'rgba(250, 204, 21, 0.55)');
    logoGlow.addColorStop(0.5, 'rgba(234, 88, 12, 0.25)');
    logoGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = logoGlow;
    ctx.beginPath();
    ctx.arc(logoCX, logoCY, logoSize, 0, Math.PI * 2);
    ctx.fill();

    // Logo background circle (white plate so any logo reads)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
    ctx.beginPath();
    ctx.arc(logoCX, logoCY, logoSize / 2 + 8, 0, Math.PI * 2);
    ctx.fill();

    // Logo image (clipped to circle)
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoCX, logoCY, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    // contain-fit
    const lr = logoImage.width / logoImage.height;
    let lw = logoSize, lh = logoSize;
    if (lr > 1) { lh = logoSize / lr; } else { lw = logoSize * lr; }
    ctx.drawImage(
      logoImage,
      logoCX - lw / 2,
      logoCY - lh / 2,
      lw,
      lh,
    );
    ctx.restore();

    // Gold ring
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(logoCX, logoCY, logoSize / 2 + 8, 0, Math.PI * 2);
    ctx.stroke();

    // Outer dashed ring
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(logoCX, logoCY, logoSize / 2 + 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // === LAUREL WREATHS (left & right of logo) ===
    const drawLaurel = (cx: number, cy: number, side: 1 | -1) => {
      ctx.strokeStyle = '#facc15';
      ctx.fillStyle = '#facc15';
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const t = i / 7;
        const angle = (-Math.PI / 2.5) + t * (Math.PI / 1.6);
        const r = logoSize / 2 + 38 + Math.sin(t * Math.PI) * 8;
        const lx = cx + side * Math.cos(angle) * r;
        const ly = cy + Math.sin(angle) * r;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(side * (angle + Math.PI / 2));
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };
    drawLaurel(logoCX, logoCY, -1);
    drawLaurel(logoCX, logoCY, 1);

    // === "AND THE WINNER IS" LABEL ===
    ctx.font = '500 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(250, 204, 21, 0.95)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.letterSpacing = '6px' as any;
    ctx.fillText('— AND THE WINNER IS —', width / 2, 305);

    // === WINNER NAME ===
    ctx.font = '900 64px "Segoe UI", system-ui, sans-serif';
    const nameGrad = ctx.createLinearGradient(0, 330, 0, 400);
    nameGrad.addColorStop(0, '#fef3c7');
    nameGrad.addColorStop(0.5, '#facc15');
    nameGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = nameGrad;
    ctx.shadowColor = 'rgba(220, 38, 38, 0.6)';
    ctx.shadowBlur = 30;
    ctx.fillText(winnerName.toUpperCase(), width / 2, 380);
    ctx.shadowBlur = 0;

    // === PITCH TITLE ===
    ctx.font = '400 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(pitchTitle, width / 2, 410);

    // === DIVIDER ===
    const divGrad = ctx.createLinearGradient(width / 2 - 200, 432, width / 2 + 200, 432);
    divGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
    divGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.8)');
    divGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 200, 432);
    ctx.lineTo(width / 2 + 200, 432);
    ctx.stroke();

    // Center diamond on divider
    ctx.save();
    ctx.translate(width / 2, 432);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();

    // === PRIZE BADGE ===
    const badgeY = 478;
    const badgeW = 460;
    const badgeH = 78;
    const badgeX = width / 2 - badgeW / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14);
    ctx.fill();

    const badgeBorder = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
    badgeBorder.addColorStop(0, '#dc2626');
    badgeBorder.addColorStop(0.5, '#facc15');
    badgeBorder.addColorStop(1, '#dc2626');
    ctx.strokeStyle = badgeBorder;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14);
    ctx.stroke();

    ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(250, 204, 21, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText('GRAND PRIZE', width / 2, badgeY + 22);

    ctx.font = '900 22px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('1 YEAR FREE COMMUNITY MEMBERSHIP', width / 2, badgeY + 47);

    ctx.font = '500 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
    ctx.fillText('+ Earth Intelligence Access  ·  $5,940 Value', width / 2, badgeY + 67);

    // === FOOTER ===
    ctx.font = '500 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.textAlign = 'center';
    ctx.fillText('startupfactoryhub.com  ·  Powered by Startup Factory Hub', width / 2, height - 18);
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoSrc(ev.target?.result as string);
      toast.success('Logo updated');
    };
    reader.readAsDataURL(file);
  };

  const resetLogo = () => {
    setLogoSrc(sfhLogo);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Logo reset to default');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `hot-deals-winner-${winnerName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Banner downloaded');
  };

  return (
    <div className="tech-card border-0 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Hot Deals Winner Announcement
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Editable winner template — upload a different logo, change the name, download.
          </p>
        </div>
        <Button onClick={handleDownload} disabled={isRendering} size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download PNG
        </Button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-lg bg-muted/30 border border-border">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Winner Name
          </label>
          <input
            type="text"
            value={winnerName}
            onChange={(e) => setWinnerName(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Startup name"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Subtitle
          </label>
          <input
            type="text"
            value={pitchTitle}
            onChange={(e) => setPitchTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Pitch title or subtitle"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Logo
          </label>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="winner-logo-upload"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload
            </Button>
            {logoSrc !== sfhLogo && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetLogo}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Canvas preview */}
      <div className="relative rounded-lg overflow-hidden border border-border bg-black">
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <div className="flex items-center gap-2 text-white text-sm">
              <ImageIcon className="w-4 h-4 animate-pulse" />
              Rendering…
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="w-full h-auto block" />
      </div>

      <p className="text-xs text-muted-foreground">
        1200×630px · Optimized for social sharing & email headers · Background: conference hall
      </p>
    </div>
  );
};

export default HotDealsWinnerBanner;
