import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, Heart, Hammer, Shield } from 'lucide-react';
import { toast } from 'sonner';
import sfhLogo from '@/assets/sfh-logo-sphere.png';

const VenezuelaRebuildBanner = () => {
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

    const logo = new window.Image();
    let loaded = 0;
    const ready = () => {
      loaded++;
      if (loaded === 1) {
        draw(ctx, W, H, logo);
        setIsRendering(false);
      }
    };
    logo.onload = ready;
    logo.src = sfhLogo;
  }, []);

  const draw = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    logo: HTMLImageElement,
  ) => {
    // === BACKGROUND ===
    // Deep navy-to-charcoal gradient (respectful, serious)
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#0a1628');
    bgGrad.addColorStop(0.5, '#0f1f35');
    bgGrad.addColorStop(1, '#0a1a2e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // === SUBTLE GOLDEN GLOW (hope / rebuilding) ===
    const hopeGlow = ctx.createRadialGradient(W / 2, H / 3, 80, W / 2, H / 3, 500);
    hopeGlow.addColorStop(0, 'rgba(245, 158, 11, 0.08)');
    hopeGlow.addColorStop(0.5, 'rgba(234, 179, 8, 0.03)');
    hopeGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = hopeGlow;
    ctx.fillRect(0, 0, W, H);

    // === SUBTLE TEAL GLOW (SFH brand) ===
    const tealGlow = ctx.createRadialGradient(W * 0.85, H * 0.75, 50, W * 0.85, H * 0.75, 350);
    tealGlow.addColorStop(0, 'rgba(20, 184, 166, 0.06)');
    tealGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = tealGlow;
    ctx.fillRect(0, 0, W, H);

    // === TECH GRID ===
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // === CORNER BRACKETS ===
    const drawBracket = (cx: number, cy: number, dx: number, dy: number, len = 45) => {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * len);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * len, cy);
      ctx.stroke();
    };
    drawBracket(24, 24, 1, 1);
    drawBracket(W - 24, 24, -1, 1);
    drawBracket(24, H - 24, 1, -1);
    drawBracket(W - 24, H - 24, -1, -1);

    // === TOP RIBBON ===
    ctx.fillStyle = 'rgba(10, 22, 40, 0.9)';
    ctx.fillRect(0, 0, W, 36);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 36); ctx.lineTo(W, 36); ctx.stroke();

    ctx.font = '600 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('VENEZUELA REBUILD INITIATIVE  —  EMERGENCY RESPONSE THROUGH INNOVATION', 20, 18);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.85)';
    ctx.fillText('STARTUP FACTORY HUB', W - 20, 18);
    ctx.textBaseline = 'alphabetic';

    // === LOGO (top left, below ribbon) ===
    const logoSize = 55;
    const logoX = 35;
    const logoY = 75;

    const logoGlow = ctx.createRadialGradient(logoX + logoSize / 2, logoY + logoSize / 2, 0, logoX + logoSize / 2, logoY + logoSize / 2, logoSize);
    logoGlow.addColorStop(0, 'rgba(20, 184, 166, 0.25)');
    logoGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = logoGlow;
    ctx.beginPath(); ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, logoX + 2, logoY + 2, logoSize - 4, logoSize - 4);
    ctx.restore();

    ctx.strokeStyle = 'rgba(20, 184, 166, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2); ctx.stroke();

    // === LEFT CONTENT ===
    const leftX = 35;

    // Heart icon (simulated with arc)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.beginPath();
    const hx = leftX + 12, hy = 155, hs = 8;
    ctx.moveTo(hx, hy + hs * 0.3);
    ctx.bezierCurveTo(hx, hy - hs * 0.5, hx - hs, hy - hs * 0.5, hx - hs, hy);
    ctx.bezierCurveTo(hx - hs, hy + hs * 0.8, hx, hy + hs * 1.2, hx, hy + hs * 1.5);
    ctx.bezierCurveTo(hx, hy + hs * 1.2, hx + hs, hy + hs * 0.8, hx + hs, hy);
    ctx.bezierCurveTo(hx + hs, hy - hs * 0.5, hx, hy - hs * 0.5, hx, hy + hs * 0.3);
    ctx.fill();

    // Eyebrow
    ctx.font = '600 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.95)';
    ctx.textAlign = 'left';
    ctx.fillText('Nuestro corazón está con todas las familias afectadas', leftX + 28, 162);

    // Main headline
    ctx.font = '900 48px "Segoe UI", system-ui, sans-serif';
    const headlineGrad = ctx.createLinearGradient(leftX, 195, leftX + 500, 195);
    headlineGrad.addColorStop(0, '#fbbf24');
    headlineGrad.addColorStop(0.5, '#f59e0b');
    headlineGrad.addColorStop(1, '#fbbf24');
    ctx.fillStyle = headlineGrad;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.35)';
    ctx.shadowBlur = 20;
    ctx.fillText('VENEZUELA', leftX, 230);
    ctx.shadowBlur = 0;

    ctx.font = '900 38px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText('REBUILD INITIATIVE', leftX, 275);

    // Tagline
    ctx.font = '400 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('Convocatoria para emprendedores, ingenieros,', leftX, 310);
    ctx.fillText('inversionistas y aliados estratégicos.', leftX, 332);

    // Divider
    const divGrad = ctx.createLinearGradient(leftX, 355, leftX + 320, 355);
    divGrad.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
    divGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(leftX, 355); ctx.lineTo(leftX + 320, 355); ctx.stroke();

    // Manifesto
    ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('Venezuela no necesita lástima.', leftX, 385);
    ctx.font = '900 17px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.95)';
    ctx.fillText('Venezuela necesita constructores.', leftX, 410);

    // === RIGHT SIDE — PILLARS / TECH CAPABILITIES ===
    const rightX = 560;
    const rightW = W - rightX - 35;

    // Section label
    ctx.font = '700 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.9)';
    ctx.fillText('TECNOLOGÍA PARA LA RECONSTRUCCIÓN', rightX, 85);

    // Accent line
    const accentGrad = ctx.createLinearGradient(rightX, 94, rightX + rightW, 94);
    accentGrad.addColorStop(0, 'rgba(20, 184, 166, 0.6)');
    accentGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = accentGrad;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(rightX, 94); ctx.lineTo(rightX + rightW, 94); ctx.stroke();

    const pillars = [
      { title: 'Comunicaciones de emergencia', color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.25)' },
      { title: 'Evaluación de daños con IA', color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.25)' },
      { title: 'Soluciones satelitales y mapeo', color: '#14b8a6', glowColor: 'rgba(20, 184, 166, 0.25)' },
      { title: 'Coordinación logística y cadena de suministro', color: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.25)' },
    ];

    const cardH = 60;
    const cardGap = 10;

    pillars.forEach((p, i) => {
      const cy = 110 + i * (cardH + cardGap);

      // Card glow
      const cGlow = ctx.createRadialGradient(rightX + rightW / 2, cy + cardH / 2, 0, rightX + rightW / 2, cy + cardH / 2, rightW * 0.5);
      cGlow.addColorStop(0, p.glowColor);
      cGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cGlow;
      ctx.beginPath(); ctx.arc(rightX + rightW / 2, cy + cardH / 2, rightW * 0.4, 0, Math.PI * 2); ctx.fill();

      // Card bg
      ctx.fillStyle = 'rgba(10, 25, 45, 0.75)';
      ctx.beginPath(); ctx.roundRect(rightX, cy, rightW, cardH, 14); ctx.fill();

      // Card border
      const borderGrad = ctx.createLinearGradient(rightX, cy, rightX + rightW, cy + cardH);
      borderGrad.addColorStop(0, p.color);
      borderGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
      borderGrad.addColorStop(1, p.color);
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(rightX, cy, rightW, cardH, 14); ctx.stroke();

      // Number
      ctx.font = '800 28px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = p.color;
      ctx.fillText(`0${i + 1}`, rightX + 18, cy + 40);

      // Title
      ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.fillText(p.title, rightX + 65, cy + 37);
    });

    // === CTA STRIP (bottom) ===
    const ctaY = H - 75;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.fillRect(0, ctaY, W, 75);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, ctaY); ctx.lineTo(W, ctaY); ctx.stroke();

    ctx.font = '700 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.95)';
    ctx.textAlign = 'center';
    ctx.fillText('LIDERAZGO · COLABORACIÓN · ACCIÓN', W / 2, ctaY + 30);

    ctx.font = '500 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Si estás desarrollando tecnologías para respuesta de emergencia, recuperación de infraestructura o logística humanitaria — queremos conectar contigo.', W / 2, ctaY + 55);

    // === WEBSITE ===
    ctx.font = '600 11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText('startupfactoryhub.com', W - 28, H - 18);
    ctx.textAlign = 'left';
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'venezuela-rebuild-initiative-banner.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Banner downloaded');
  };

  return (
    <div className="tech-card border-0 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Heart className="w-5 h-5 text-amber-400" />
            Venezuela Rebuild Initiative — Marketing Banner
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Emergency response through innovation. Rebuilding stronger, smarter, more resilient systems for the future.
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
        1200×630px · Optimized for social media, email headers & presentations
      </p>
    </div>
  );
};

export default VenezuelaRebuildBanner;
