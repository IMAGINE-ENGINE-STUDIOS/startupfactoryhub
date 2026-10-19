import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, Bot } from 'lucide-react';
import { toast } from 'sonner';
import cosmicBg from '@/assets/ignition-cosmic-bg.jpg';
import {
  agentLlama33,
  agentMaverick,
  agentScout,
  agentSpark,
  agentInstant,
} from '@/assets/agents/characters';

const TEAM = [
  { role: 'BUILDER', src: agentLlama33 },
  { role: 'LAUNCHER', src: agentMaverick },
  { role: 'ANALYST', src: agentScout },
  { role: 'ARCHITECT', src: agentSpark },
  { role: 'IDEATOR', src: agentInstant },
];

// Static twin of AgentsAnimatedBanner — same design system as the
// Ignition Program banner (cosmic bg, emerald matrix rain, HUD
// brackets, mono status ribbon, huge gradient title, chips +
// numbered workflow row), drawn once for a PNG download.
const AgentsBanner = () => {
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
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const bg = new window.Image();
    const faces = TEAM.map(() => new window.Image());
    let loaded = 0;
    const total = 1 + faces.length;
    const ready = () => {
      loaded++;
      if (loaded === total) {
        draw(ctx, W, H, bg, faces);
        setIsRendering(false);
      }
    };
    bg.onload = ready;
    bg.src = cosmicBg;
    faces.forEach((img, i) => {
      img.onload = ready;
      img.src = TEAM[i].src;
    });
  }, []);

  const draw = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    bg: HTMLImageElement,
    faces: HTMLImageElement[],
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

    // === MATRIX RAIN (static snapshot) ===
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
    ctx.fillText('> SYS://AGENTS.INIT  ●  STATUS: NOW_LIVE  ●  NEW_PLATFORM_FEATURE', 18, 16);
    ctx.textAlign = 'right';
    ctx.fillText('STARTUPFACTORYHUB.COM', W - 18, 16);

    // === LEFT: hero agent portrait + team thumbs ===
    const heroCX = 265;
    const heroCY = 292;
    const heroR = 148;

    const halo = ctx.createRadialGradient(heroCX, heroCY, 20, heroCX, heroCY, 260);
    halo.addColorStop(0, 'rgba(34, 197, 94, 0.45)');
    halo.addColorStop(0.5, 'rgba(20, 184, 166, 0.18)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(heroCX, heroCY, 260, 0, Math.PI * 2);
    ctx.fill();

    // Dashed orbit ring
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(heroCX, heroCY, heroR + 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const hero = faces[0];
    if (hero) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(heroCX, heroCY, heroR, 0, Math.PI * 2);
      ctx.clip();
      const s = Math.max((heroR * 2) / hero.width, (heroR * 2) / hero.height);
      const iw = hero.width * s;
      const ih = hero.height * s;
      ctx.drawImage(hero, heroCX - iw / 2, heroCY - ih / 2, iw, ih);
      ctx.restore();
      ctx.strokeStyle = 'rgba(110, 231, 183, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(heroCX, heroCY, heroR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Team thumbs
    const thumbR = 27;
    const thumbY = 520;
    const thumbGap = 66;
    const thumbStartX = heroCX - (thumbGap * (TEAM.length - 1)) / 2;
    TEAM.forEach((member, i) => {
      const tx = thumbStartX + i * thumbGap;
      const img = faces[i];
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(tx, thumbY, thumbR, 0, Math.PI * 2);
        ctx.clip();
        const s = Math.max((thumbR * 2) / img.width, (thumbR * 2) / img.height);
        ctx.drawImage(img, tx - (img.width * s) / 2, thumbY - (img.height * s) / 2, img.width * s, img.height * s);
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tx, thumbY, thumbR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '600 8.5px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(member.role, tx, thumbY + thumbR + 15);
    });

    // === RIGHT CONTENT BLOCK ===
    const rightX = 530;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    ctx.font = '600 12px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = 'rgba(110, 231, 183, 0.95)';
    ctx.fillText('NEW PLATFORM FEATURE  ·  NOW LIVE IN EVERY DASHBOARD', rightX, 130);

    // Title "AGENTS"
    ctx.font = '800 124px "Helvetica Neue", Arial, sans-serif';
    const titleGrad = ctx.createLinearGradient(rightX, 150, rightX, 240);
    titleGrad.addColorStop(0, '#ecfdf5');
    titleGrad.addColorStop(1, '#10b981');
    ctx.fillStyle = titleGrad;
    ctx.shadowColor = 'rgba(16, 185, 129, 0.55)';
    ctx.shadowBlur = 28;
    ctx.fillText('AGENTS', rightX, 240);
    ctx.shadowBlur = 0;

    // Subtitle "YOUR AI TEAM"
    ctx.font = '900 italic 52px "Impact", "Oswald", "Helvetica Neue Condensed", "Arial Narrow", sans-serif';
    const progGrad = ctx.createLinearGradient(rightX, 250, rightX, 295);
    progGrad.addColorStop(0, '#ffffff');
    progGrad.addColorStop(1, 'rgba(167, 243, 208, 0.9)');
    ctx.fillStyle = progGrad;
    ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
    ctx.shadowBlur = 14;
    ctx.fillText('YOUR AI TEAM', rightX, 290);
    ctx.shadowBlur = 0;

    // Divider
    const divGrad = ctx.createLinearGradient(rightX, 0, rightX + 400, 0);
    divGrad.addColorStop(0, 'rgba(34, 197, 94, 0.9)');
    divGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rightX, 308);
    ctx.lineTo(rightX + 400, 308);
    ctx.stroke();

    // Tagline
    ctx.font = '500 16px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText('Create your own AI agents — chain them into pipelines', rightX, 332);

    ctx.font = '400 12.5px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = 'rgba(167, 243, 208, 0.85)';
    ctx.fillText('Powered by Meta Llama · 5 specialists · Solo or pipeline runs', rightX, 352);

    // Highlight pill
    const ddY = 370;
    const ddText = 'NOW LIVE — FIND THE "AGENTS" TAB AFTER TOOLS';
    ctx.font = '700 12px "Helvetica Neue", Arial, sans-serif';
    const ddW = ctx.measureText(ddText).width + 24;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(rightX, ddY, ddW, 26, 4);
    ctx.fill();
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 1.25;
    ctx.stroke();
    ctx.fillStyle = '#022c22';
    ctx.textBaseline = 'middle';
    ctx.fillText(ddText, rightX + 12, ddY + 14);
    ctx.textBaseline = 'alphabetic';

    // Specialist chips
    let chipX = rightX;
    const chipY = 410;
    ctx.font = '600 10.5px "Helvetica Neue", Arial, sans-serif';
    TEAM.forEach((member) => {
      const c = member.role;
      const tw = ctx.measureText(c).width;
      const cw = tw + 18;
      ctx.fillStyle = 'rgba(6, 78, 59, 0.75)';
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, cw, 22, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#a7f3d0';
      ctx.textBaseline = 'middle';
      ctx.fillText(c, chipX + 9, chipY + 12);
      chipX += cw + 6;
    });
    ctx.textBaseline = 'alphabetic';

    // Workflow row
    const steps = [
      { n: '01', t: 'CREATE' },
      { n: '02', t: 'CUSTOMIZE' },
      { n: '03', t: 'CHAIN' },
      { n: '04', t: 'RUN' },
    ];
    const pY = 510;
    const pSpan = 600;
    const pStep = pSpan / steps.length;
    steps.forEach((p, i) => {
      const px = rightX + i * pStep;
      ctx.font = '800 30px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = 'rgba(52, 211, 153, 0.98)';
      ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
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
    link.download = 'agents-banner.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Banner downloaded');
  };

  return (
    <div className="tech-card border-0 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            Agents — Marketing Banner
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            New platform feature · Your AI team of 5 Llama-powered specialists · Create · Customize · Chain · Run
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

export default AgentsBanner;
