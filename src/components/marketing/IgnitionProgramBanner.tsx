import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, Flame } from 'lucide-react';
import { toast } from 'sonner';
import cosmicBg from '@/assets/ignition-cosmic-bg.jpg';
import sfhEmblem from '@/assets/sfh-logo-emblem.png';

const IgnitionProgramBanner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = 2;
    const W = 1200;
    const H = 630;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const bg = new window.Image();
    const logo = new window.Image();
    let loaded = 0;
    const ready = () => {
      loaded++;
      if (loaded === 2) {
        draw(ctx, W, H, bg, logo);
        setIsRendering(false);
      }
    };
    bg.onload = ready;
    logo.onload = ready;
    bg.src = cosmicBg;
    logo.src = sfhEmblem;
  }, []);

  const draw = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    bg: HTMLImageElement,
    logo: HTMLImageElement,
  ) => {
    // === BACKGROUND (cover) ===
    const bgRatio = bg.width / bg.height;
    const cRatio = W / H;
    let dw = W, dh = H, ox = 0, oy = 0;
    if (bgRatio > cRatio) { dw = H * bgRatio; ox = -(dw - W) / 2; }
    else { dh = W / bgRatio; oy = -(dh - H) / 2; }
    ctx.drawImage(bg, ox, oy, dw, dh);

    // === DARK CINEMATIC OVERLAY ===
    const overlay = ctx.createLinearGradient(0, 0, 0, H);
    overlay.addColorStop(0, 'rgba(0, 8, 6, 0.55)');
    overlay.addColorStop(0.6, 'rgba(0, 10, 8, 0.75)');
    overlay.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, W, H);

    // === MATRIX RAIN (digital code) ===
    ctx.font = '14px "Courier New", monospace';
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';
    for (let col = 0; col < 60; col++) {
      const x = (col / 60) * W + Math.random() * 8;
      const trailLen = 6 + Math.floor(Math.random() * 14);
      const startY = Math.random() * H;
      for (let i = 0; i < trailLen; i++) {
        const y = startY + i * 16;
        if (y > H) continue;
        const alpha = (1 - i / trailLen) * (0.18 + Math.random() * 0.22);
        ctx.fillStyle = i === 0
          ? `rgba(180, 255, 220, ${alpha + 0.3})`
          : `rgba(34, 197, 94, ${alpha})`;
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y);
      }
    }

    // === GRID LINES ===
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // === SIDE VIGNETTE ===
    const vig = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 800);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // === CORNER BRACKETS (HUD) ===
    const drawBracket = (cx: number, cy: number, dx: number, dy: number, len = 50) => {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * len);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * len, cy);
      ctx.stroke();
    };
    drawBracket(28, 28, 1, 1);
    drawBracket(W - 28, 28, -1, 1);
    drawBracket(28, H - 28, 1, -1);
    drawBracket(W - 28, H - 28, -1, -1);

    // === TOP RIBBON (status bar) ===
    ctx.fillStyle = 'rgba(0, 20, 14, 0.85)';
    ctx.fillRect(0, 0, W, 32);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 32); ctx.lineTo(W, 32); ctx.stroke();
    ctx.font = '600 11px "Courier New", monospace';
    ctx.fillStyle = 'rgba(134, 239, 172, 0.9)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('> SYS://IGNITION_PROGRAM.INIT  ●  STATUS: ACCEPTING_APPLICATIONS  ●  COHORT_2026', 18, 16);
    ctx.textAlign = 'right';
    ctx.fillText('ORLANDO_FL // USA', W - 18, 16);

    // === LOGO (left side, large) ===
    const logoCX = 270;
    const logoCY = H / 2 + 10;
    const logoH = 320;
    const logoW = (logo.width / logo.height) * logoH;

    // Glow halo
    const halo = ctx.createRadialGradient(logoCX, logoCY, 20, logoCX, logoCY, 260);
    halo.addColorStop(0, 'rgba(34, 197, 94, 0.45)');
    halo.addColorStop(0.5, 'rgba(20, 184, 166, 0.18)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(logoCX, logoCY, 260, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(logo, logoCX - logoW / 2, logoCY - logoH / 2, logoW, logoH);

    // === RIGHT CONTENT BLOCK ===
    const rightX = 530;

    // Tag: "IN-PERSON · 2 WEEKS · ORLANDO"
    ctx.font = '600 13px "Courier New", monospace';
    ctx.fillStyle = 'rgba(34, 197, 94, 0.95)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('[ 2-WEEK IN-PERSON IMMERSION  ·  ORLANDO, FL ]', rightX, 165);

    // Title "IGNITION"
    ctx.font = '900 110px "Arial Black", "Helvetica", sans-serif';
    const titleGrad = ctx.createLinearGradient(rightX, 180, rightX, 290);
    titleGrad.addColorStop(0, '#d1fae5');
    titleGrad.addColorStop(0.5, '#34d399');
    titleGrad.addColorStop(1, '#059669');
    ctx.fillStyle = titleGrad;
    ctx.shadowColor = 'rgba(34, 197, 94, 0.7)';
    ctx.shadowBlur = 30;
    ctx.fillText('IGNITION', rightX, 270);
    ctx.shadowBlur = 0;

    // Subtitle "PROGRAM"
    ctx.font = '300 48px "Helvetica Neue", "Arial", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.letterSpacing = '12px' as any;
    ctx.fillText('P R O G R A M', rightX, 318);

    // Divider
    const divGrad = ctx.createLinearGradient(rightX, 0, rightX + 400, 0);
    divGrad.addColorStop(0, 'rgba(34, 197, 94, 0.9)');
    divGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rightX, 345);
    ctx.lineTo(rightX + 500, 345);
    ctx.stroke();

    // Tagline
    ctx.font = '500 19px "Helvetica Neue", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillText('Expand to the U.S. — Build · Connect · Raise · Hire', rightX, 378);

    // Sub-tagline
    ctx.font = '400 14px "Helvetica Neue", sans-serif';
    ctx.fillStyle = 'rgba(167, 243, 208, 0.85)';
    ctx.fillText('For Pre-Seed founders ready to scale in the United States', rightX, 402);

    // === DEMO DAY HIGHLIGHT (Kennedy Space Center) ===
    const ddY = 422;
    const ddText = 'DEMO DAY @ KENNEDY SPACE CENTER';
    ctx.font = '800 13px "Courier New", monospace';
    const ddW = ctx.measureText(ddText).width + 28;
    const ddGrad = ctx.createLinearGradient(rightX, ddY, rightX + ddW, ddY);
    ddGrad.addColorStop(0, 'rgba(16, 185, 129, 0.95)');
    ddGrad.addColorStop(1, 'rgba(5, 150, 105, 0.95)');
    ctx.fillStyle = ddGrad;
    ctx.beginPath();
    ctx.roundRect(rightX, ddY, ddW, 28, 4);
    ctx.fill();
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#022c22';
    ctx.textBaseline = 'middle';
    ctx.fillText(ddText, rightX + 14, ddY + 15);

    // === VERTICAL CHIPS (sectors) ===
    const chips = ['AEROSPACE', 'DEEP TECH', 'PHOTONICS', 'A.I.'];
    let chipX = rightX;
    const chipY = 460;
    ctx.font = '700 11px "Courier New", monospace';
    chips.forEach((c) => {
      const tw = ctx.measureText(c).width;
      const cw = tw + 22;
      ctx.fillStyle = 'rgba(6, 78, 59, 0.7)';
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, cw, 26, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#6ee7b7';
      ctx.textBaseline = 'middle';
      ctx.fillText(c, chipX + 11, chipY + 14);
      chipX += cw + 8;
    });

    // === PILLARS ROW ===
    const pillars = [
      { n: '01', t: 'BUILD' },
      { n: '02', t: 'CONNECT' },
      { n: '03', t: 'RAISE' },
      { n: '04', t: 'MENTOR' },
      { n: '05', t: 'HIRE' },
      { n: '06', t: 'DEMO DAY' },
    ];
    const pY = 495;
    const pSpan = 540;
    const pStep = pSpan / pillars.length;
    pillars.forEach((p, i) => {
      const px = rightX + i * pStep;
      ctx.font = '900 22px "Courier New", monospace';
      ctx.fillStyle = 'rgba(52, 211, 153, 0.95)';
      ctx.textAlign = 'left';
      ctx.fillText(p.n, px, pY);
      ctx.font = '600 11px "Helvetica Neue", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(p.t, px, pY + 16);
    });

    // === CTA on right edge ===
    const ctaW = 200;
    const ctaH = 52;
    const ctaX = W - ctaW - 50;
    const ctaY = 540;
    const ctaGrad = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaW, ctaY + ctaH);
    ctaGrad.addColorStop(0, '#10b981');
    ctaGrad.addColorStop(1, '#059669');
    ctx.fillStyle = ctaGrad;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 6);
    ctx.fill();
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '800 15px "Helvetica Neue", sans-serif';
    ctx.fillStyle = '#022c22';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('APPLY → IGNITION', ctaX + ctaW / 2, ctaY + ctaH / 2);

    // === FOOTER ===
    ctx.font = '500 11px "Courier New", monospace';
    ctx.fillStyle = 'rgba(167, 243, 208, 0.7)';
    ctx.textAlign = 'left';
    ctx.fillText('startupfactoryhub.com/ignition', 50, H - 20);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'ignition-program-banner.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Banner downloaded');
  };

  return (
    <div className="tech-card border-0 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Flame className="w-5 h-5 text-emerald-400" />
            Ignition Program — Marketing Banner
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            2-week in-person U.S. expansion program · Aerospace · Deep Tech · Photonics · A.I.
          </p>
        </div>
        <Button onClick={handleDownload} disabled={isRendering} size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download PNG
        </Button>
      </div>

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
        1200×630px · Matrix / cosmic aesthetic · Optimized for social & email headers
      </p>
    </div>
  );
};

export default IgnitionProgramBanner;
