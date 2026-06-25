import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, Heart } from 'lucide-react';
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
    logo.onload = () => {
      draw(ctx, W, H, logo);
      setIsRendering(false);
    };
    logo.onerror = () => {
      draw(ctx, W, H, null);
      setIsRendering(false);
    };
    logo.src = sfhLogo;
  }, []);

  const draw = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    logo: HTMLImageElement | null,
  ) => {
    // === BASE: deep obsidian gradient ===
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#05070d');
    bg.addColorStop(0.55, '#0a0f1c');
    bg.addColorStop(1, '#070912');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // === ATMOSPHERIC AURORA ===
    const aurora1 = ctx.createRadialGradient(W * 0.18, H * 0.25, 30, W * 0.18, H * 0.25, 620);
    aurora1.addColorStop(0, 'rgba(251, 191, 36, 0.18)');
    aurora1.addColorStop(0.4, 'rgba(245, 158, 11, 0.05)');
    aurora1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aurora1;
    ctx.fillRect(0, 0, W, H);

    const aurora2 = ctx.createRadialGradient(W * 0.85, H * 0.8, 30, W * 0.85, H * 0.8, 560);
    aurora2.addColorStop(0, 'rgba(20, 184, 166, 0.16)');
    aurora2.addColorStop(0.4, 'rgba(6, 182, 212, 0.04)');
    aurora2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aurora2;
    ctx.fillRect(0, 0, W, H);

    // === ULTRA-FINE GRID (almost invisible) ===
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.018)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // === DIAGONAL LIGHT BEAM ===
    ctx.save();
    const beam = ctx.createLinearGradient(0, 0, W * 0.6, H);
    beam.addColorStop(0, 'rgba(251, 191, 36, 0)');
    beam.addColorStop(0.5, 'rgba(251, 191, 36, 0.06)');
    beam.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = beam;
    ctx.translate(W * 0.35, 0);
    ctx.rotate(-0.35);
    ctx.fillRect(-200, -100, 280, H + 400);
    ctx.restore();

    // === TOP META BAR (ultra-thin) ===
    ctx.font = '500 10.5px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.55)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('VRI · 001  ·  HUMANITARIAN INNOVATION PROTOCOL', 48, 36);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillText('STARTUP FACTORY HUB  ·  GLOBAL CALL', W - 48, 36);
    ctx.textBaseline = 'alphabetic';

    // hairline under meta
    const meta = ctx.createLinearGradient(48, 56, W - 48, 56);
    meta.addColorStop(0, 'rgba(255,255,255,0)');
    meta.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    meta.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = meta;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(48, 56); ctx.lineTo(W - 48, 56); ctx.stroke();

    // === LEFT COLUMN ===
    const leftX = 60;

    // Eyebrow pill
    const pillX = leftX;
    const pillY = 92;
    const pillW = 220;
    const pillH = 26;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
    ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, 13); ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, 13); ctx.stroke();

    // pulsing dot
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(pillX + 14, pillY + pillH / 2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
    ctx.beginPath(); ctx.arc(pillX + 14, pillY + pillH / 2, 7, 0, Math.PI * 2); ctx.fill();

    ctx.font = '600 10.5px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('LIVE  ·  CALL FOR BUILDERS', pillX + 28, pillY + pillH / 2 + 0.5);
    ctx.textBaseline = 'alphabetic';

    // === HEADLINE (oversized, refined) ===
    ctx.font = '200 78px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText('Venezuela', leftX, 200);

    // Headline accent — bold serif-feel via heavy weight
    const accent = ctx.createLinearGradient(leftX, 240, leftX + 600, 280);
    accent.addColorStop(0, '#fde68a');
    accent.addColorStop(0.5, '#fbbf24');
    accent.addColorStop(1, '#f59e0b');
    ctx.font = '900 78px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = accent;
    ctx.shadowColor = 'rgba(251, 191, 36, 0.35)';
    ctx.shadowBlur = 30;
    ctx.fillText('Rebuild.', leftX, 278);
    ctx.shadowBlur = 0;

    // Italic subline
    ctx.font = '300 italic 28px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('Initiative — engineered for resilience.', leftX, 320);

    // Manifesto block (left-bordered)
    const mY = 358;
    const mH = 90;
    const mGrad = ctx.createLinearGradient(leftX, mY, leftX, mY + mH);
    mGrad.addColorStop(0, '#fbbf24');
    mGrad.addColorStop(1, 'rgba(20, 184, 166, 0.6)');
    ctx.fillStyle = mGrad;
    ctx.fillRect(leftX, mY, 2, mH);

    ctx.font = '400 15px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText('Venezuela no necesita lástima.', leftX + 18, mY + 22);

    ctx.font = '600 19px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText('Venezuela necesita ', leftX + 18, mY + 52);
    const t1w = ctx.measureText('Venezuela necesita ').width;
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('constructores.', leftX + 18 + t1w, mY + 52);

    ctx.font = '400 13px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillText('Convocatoria para emprendedores, ingenieros, inversionistas', leftX + 18, mY + 76);
    ctx.fillText('y aliados estratégicos que construyen el futuro.', leftX + 18, mY + 92);

    // === RIGHT COLUMN — Pillars as minimal "tech briefing" ===
    const rightX = 700;
    const rightW = W - rightX - 60;

    // Section header
    ctx.font = '500 10.5px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.8)';
    ctx.textAlign = 'left';
    ctx.fillText('// CAPABILITIES  ·  TECH STACK FOR RECOVERY', rightX, 100);

    // Header underline (segmented)
    let sx = rightX;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i === 0 ? 'rgba(20, 184, 166, 0.9)' : 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(sx, 110, 24, 2);
      sx += 30;
    }

    const pillars = [
      { code: '01', title: 'Emergency Communications', sub: 'Comunicaciones de emergencia', color: '#fbbf24' },
      { code: '02', title: 'AI Damage Assessment', sub: 'Evaluación de daños con IA', color: '#fb923c' },
      { code: '03', title: 'Satellite & Mapping', sub: 'Soluciones satelitales y mapeo', color: '#14b8a6' },
      { code: '04', title: 'Logistics & Supply Chain', sub: 'Coordinación logística', color: '#60a5fa' },
    ];

    const rowY0 = 138;
    const rowH = 68;

    pillars.forEach((p, i) => {
      const y = rowY0 + i * (rowH + 6);

      // Glassmorphic row
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.beginPath(); ctx.roundRect(rightX, y, rightW, rowH, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(rightX, y, rightW, rowH, 12); ctx.stroke();

      // Left color accent bar
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.roundRect(rightX, y + 14, 3, rowH - 28, 2); ctx.fill();

      // Code label
      ctx.font = '300 32px "Inter", "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText(p.code, rightX + 22, y + 44);

      // Title
      ctx.font = '600 16px "Inter", "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillText(p.title, rightX + 78, y + 30);

      // Sub
      ctx.font = '400 12.5px "Inter", "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText(p.sub, rightX + 78, y + 50);

      // Right status node
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(rightX + rightW - 22, y + rowH / 2, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = p.color + '40';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(rightX + rightW - 22, y + rowH / 2, 8, 0, Math.PI * 2); ctx.stroke();
    });

    // === FOOTER STRIP ===
    const fY = H - 58;
    // hairline
    const fLine = ctx.createLinearGradient(48, fY, W - 48, fY);
    fLine.addColorStop(0, 'rgba(255,255,255,0)');
    fLine.addColorStop(0.5, 'rgba(251, 191, 36, 0.4)');
    fLine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = fLine;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(48, fY); ctx.lineTo(W - 48, fY); ctx.stroke();

    // Logo (small, refined)
    if (logo) {
      const ls = 30;
      const lx = 60;
      const ly = fY + 14;
      ctx.save();
      ctx.beginPath();
      ctx.arc(lx + ls / 2, ly + ls / 2, ls / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logo, lx, ly, ls, ls);
      ctx.restore();
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(lx + ls / 2, ly + ls / 2, ls / 2, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.font = '600 12px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'left';
    ctx.fillText('STARTUP FACTORY HUB', 105, fY + 28);
    ctx.font = '400 10.5px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('Leadership  ·  Collaboration  ·  Action', 105, fY + 42);

    // CTA pill
    const ctaW = 220;
    const ctaH = 36;
    const ctaX = W - 60 - ctaW;
    const ctaY = fY + 11;
    const ctaGrad = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaW, ctaY);
    ctaGrad.addColorStop(0, '#fbbf24');
    ctaGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = ctaGrad;
    ctx.beginPath(); ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 18); ctx.fill();

    ctx.font = '700 12px "Inter", "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#0a0f1c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('JOIN  ·  startupfactoryhub.com  →', ctaX + ctaW / 2, ctaY + ctaH / 2);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    // === CORNER ETCHED MARKS ===
    const corner = (cx: number, cy: number, dx: number, dy: number) => {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * 14);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * 14, cy);
      ctx.stroke();
    };
    corner(20, 20, 1, 1);
    corner(W - 20, 20, -1, 1);
    corner(20, H - 20, 1, -1);
    corner(W - 20, H - 20, -1, -1);
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
            Next-generation humanitarian innovation banner. Refined, elegant, futuristic.
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
