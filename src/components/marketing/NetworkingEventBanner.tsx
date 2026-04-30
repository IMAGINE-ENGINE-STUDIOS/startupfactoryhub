import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, Network } from 'lucide-react';
import { toast } from 'sonner';
import networkBg from '@/assets/networking-data-bg.jpg';
import sfhEmblem from '@/assets/sfh-logo-emblem.png';

const NetworkingEventBanner = () => {
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
    bg.src = networkBg;
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

    // === DARK CINEMATIC OVERLAY (cyan/teal cast) ===
    const overlay = ctx.createLinearGradient(0, 0, 0, H);
    overlay.addColorStop(0, 'rgba(2, 12, 24, 0.55)');
    overlay.addColorStop(0.6, 'rgba(2, 14, 28, 0.75)');
    overlay.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, W, H);

    // === NETWORK NODES / CONNECTIONS (decorative) ===
    const nodes: { x: number; y: number }[] = [];
    for (let i = 0; i < 36; i++) {
      nodes.push({ x: Math.random() * W, y: Math.random() * H });
    }
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.hypot(dx, dy);
        if (d < 160) {
          ctx.globalAlpha = 1 - d / 160;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    nodes.forEach((n) => {
      ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // === GRID LINES ===
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
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
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
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
    ctx.fillStyle = 'rgba(2, 18, 30, 0.85)';
    ctx.fillRect(0, 0, W, 32);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 32); ctx.lineTo(W, 32); ctx.stroke();
    ctx.font = '600 11px "Courier New", monospace';
    ctx.fillStyle = 'rgba(186, 230, 253, 0.9)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('> SYS://NETWORKING_EVENT.LIVE  ●  STATUS: REGISTRATION_OPEN  ●  GLOBAL_FOUNDERS', 18, 16);
    ctx.textAlign = 'right';
    ctx.fillText('ONLINE // LIVE', W - 18, 16);

    // === LOGO (left side) ===
    const logoCX = 270;
    const logoCY = H / 2 + 10;
    const logoH = 320;
    const logoW = (logo.width / logo.height) * logoH;

    // Glow halo (cyan)
    const halo = ctx.createRadialGradient(logoCX, logoCY, 20, logoCX, logoCY, 260);
    halo.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    halo.addColorStop(0.5, 'rgba(14, 165, 233, 0.18)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(logoCX, logoCY, 260, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(logo, logoCX - logoW / 2, logoCY - logoH / 2, logoW, logoH);

    // === RIGHT CONTENT BLOCK ===
    const rightX = 510;
    const maxRightW = W - rightX - 40; // right padding 40
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Helper: fit font size to width
    const fitFont = (text: string, baseSize: number, weight: string, family: string, maxW: number) => {
      let size = baseSize;
      ctx.font = `${weight} ${size}px ${family}`;
      while (ctx.measureText(text).width > maxW && size > 10) {
        size -= 2;
        ctx.font = `${weight} ${size}px ${family}`;
      }
      return size;
    };

    // Eyebrow tag
    ctx.font = '600 12px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = 'rgba(125, 211, 252, 0.95)';
    ctx.fillText('LIVE ONLINE EVENT  ·  FOUNDERS · INVESTORS · MENTORS', rightX, 130);

    // Title "ACCELERATED"
    fitFont('ACCELERATED', 78, '800', '"Helvetica Neue", Arial, sans-serif', maxRightW);
    const titleGrad = ctx.createLinearGradient(rightX, 150, rightX, 230);
    titleGrad.addColorStop(0, '#f0f9ff');
    titleGrad.addColorStop(1, '#0ea5e9');
    ctx.fillStyle = titleGrad;
    ctx.shadowColor = 'rgba(14, 165, 233, 0.55)';
    ctx.shadowBlur = 28;
    ctx.fillText('ACCELERATED', rightX, 220);
    ctx.shadowBlur = 0;

    // Subtitle "NETWORKING EVENT"
    fitFont('NETWORKING EVENT', 48, '900 italic', '"Impact", "Oswald", "Helvetica Neue Condensed", "Arial Narrow", sans-serif', maxRightW);
    const progGrad = ctx.createLinearGradient(rightX, 240, rightX, 290);
    progGrad.addColorStop(0, '#ffffff');
    progGrad.addColorStop(1, 'rgba(186, 230, 253, 0.9)');
    ctx.fillStyle = progGrad;
    ctx.shadowColor = 'rgba(14, 165, 233, 0.5)';
    ctx.shadowBlur = 14;
    ctx.fillText('NETWORKING EVENT', rightX, 280);
    ctx.shadowBlur = 0;

    // Divider
    const dividerW = Math.min(500, maxRightW);
    const divGrad = ctx.createLinearGradient(rightX, 0, rightX + dividerW, 0);
    divGrad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
    divGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rightX, 305);
    ctx.lineTo(rightX + dividerW, 305);
    ctx.stroke();

    // Tagline
    fitFont('Connect · Pitch · Match · Grow — One curated hour with the ecosystem', 16, '500', '"Helvetica Neue", Arial, sans-serif', maxRightW);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText('Connect · Pitch · Match · Grow — One curated hour with the ecosystem', rightX, 332);

    // Sub-tagline
    ctx.font = '400 12.5px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = 'rgba(186, 230, 253, 0.85)';
    ctx.fillText('Fast intros · Breakout rooms · Real opportunities', rightX, 352);

    // === DATE / TIME BADGE ===
    const ddY = 372;
    const ddText = 'MONDAY · JULY 1  ·  2:00 – 3:00 PM EST';
    ctx.font = '700 12.5px "Helvetica Neue", Arial, sans-serif';
    const ddW = ctx.measureText(ddText).width + 24;
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.roundRect(rightX, ddY, ddW, 28, 4);
    ctx.fill();
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1.25;
    ctx.stroke();
    ctx.fillStyle = '#062c43';
    ctx.textBaseline = 'middle';
    ctx.fillText(ddText, rightX + 12, ddY + 15);
    ctx.textBaseline = 'alphabetic';

    // === FORMAT CHIPS ===
    const chips = ['ONLINE', 'LIVE', 'FREE', 'GLOBAL'];
    let chipX = rightX;
    const chipY = 414;
    ctx.font = '600 10.5px "Helvetica Neue", Arial, sans-serif';
    chips.forEach((c) => {
      const tw = ctx.measureText(c).width;
      const cw = tw + 18;
      ctx.fillStyle = 'rgba(8, 47, 73, 0.75)';
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, cw, 22, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#bae6fd';
      ctx.textBaseline = 'middle';
      ctx.fillText(c, chipX + 9, chipY + 12);
      chipX += cw + 6;
    });
    ctx.textBaseline = 'alphabetic';

    // === PILLARS / AGENDA ROW ===
    const pillars = [
      { n: '01', t: 'WELCOME' },
      { n: '02', t: 'PITCH' },
      { n: '03', t: 'BREAKOUTS' },
      { n: '04', t: 'MATCH' },
      { n: '05', t: 'CONNECT' },
      { n: '06', t: 'NEXT STEPS' },
    ];
    const pY = 510;
    const pSpan = 600;
    const pStep = pSpan / pillars.length;
    pillars.forEach((p, i) => {
      const px = rightX + i * pStep;
      ctx.font = '800 30px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.98)';
      ctx.shadowColor = 'rgba(14, 165, 233, 0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText(p.n, px, pY);
      ctx.shadowBlur = 0;
      ctx.font = '600 11px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillText(p.t, px, pY + 20);
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'accelerated-networking-event-banner.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Banner downloaded');
  };

  return (
    <div className="tech-card border-0 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Network className="w-5 h-5 text-sky-400" />
            Accelerated Networking Event — Marketing Banner
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Monday, July 1 · 2:00 – 3:00 PM EST · Online · Founders, Investors & Mentors
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
        1200×630px · Network / data aesthetic · Optimized for social & email headers
      </p>
    </div>
  );
};

export default NetworkingEventBanner;
