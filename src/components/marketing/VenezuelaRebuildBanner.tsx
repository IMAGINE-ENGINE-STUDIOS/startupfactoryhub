import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, Heart } from 'lucide-react';
import { toast } from 'sonner';
import sfhLogo from '@/assets/sfh-logo-sphere.png';
import bgImage from '@/assets/robots-building.jpg';

type Lang = 'en' | 'es';

interface Copy {
  metaLeft: string;
  metaRight: string;
  pill: string;
  headline1: string;
  headline2: string;
  subline: string;
  quoteSmall: string;
  quoteLeft: string;
  quoteAccent: string;
  bodyA: string;
  bodyB: string;
  capsHeader: string;
  pillars: { code: string; title: string; sub: string }[];
  footerTagline: string;
  cta: string;
  fileName: string;
}

const COPY: Record<Lang, Copy> = {
  en: {
    metaLeft: 'VRI · 001  ·  HUMANITARIAN ENGINEERING PROTOCOL',
    metaRight: 'STARTUP FACTORY HUB  ·  GLOBAL CALL',
    pill: 'LIVE  ·  CALL FOR BUILDERS',
    headline1: 'Venezuela',
    headline2: 'Rebuild.',
    subline: 'Initiative — engineered for resilience.',
    quoteSmall: 'Venezuela does not need pity.',
    quoteLeft: 'Venezuela needs ',
    quoteAccent: 'builders.',
    bodyA: 'A call to founders, engineers, investors and',
    bodyB: 'strategic allies building tomorrow.',
    capsHeader: '// CAPABILITIES  ·  TECH STACK FOR RECOVERY',
    pillars: [
      { code: '01', title: 'Emergency Communications', sub: 'Mesh networks · offline-first comms' },
      { code: '02', title: 'AI Damage Assessment', sub: 'Computer vision · risk modeling' },
      { code: '03', title: 'Satellite & Mapping', sub: 'Earth observation · geospatial intel' },
      { code: '04', title: 'Logistics & Supply Chain', sub: 'Routing · resource coordination' },
    ],
    footerTagline: 'Leadership  ·  Collaboration  ·  Action',
    cta: 'JOIN  ·  startupfactoryhub.com  →',
    fileName: 'venezuela-rebuild-en.png',
  },
  es: {
    metaLeft: 'VRI · 001  ·  PROTOCOLO DE INGENIERÍA HUMANITARIA',
    metaRight: 'STARTUP FACTORY HUB  ·  CONVOCATORIA GLOBAL',
    pill: 'EN VIVO  ·  CONVOCATORIA',
    headline1: 'Venezuela',
    headline2: 'Reconstruir.',
    subline: 'Iniciativa — diseñada para la resiliencia.',
    quoteSmall: 'Venezuela no necesita lástima.',
    quoteLeft: 'Venezuela necesita ',
    quoteAccent: 'constructores.',
    bodyA: 'Convocatoria para emprendedores, ingenieros,',
    bodyB: 'inversionistas y aliados que construyen futuro.',
    capsHeader: '// CAPACIDADES  ·  STACK PARA LA RECUPERACIÓN',
    pillars: [
      { code: '01', title: 'Comunicaciones de Emergencia', sub: 'Redes mesh · comunicación offline' },
      { code: '02', title: 'Evaluación de Daños con IA', sub: 'Visión por computador · modelado' },
      { code: '03', title: 'Satélite y Mapeo', sub: 'Observación terrestre · geoinformación' },
      { code: '04', title: 'Logística y Cadena de Suministro', sub: 'Ruteo · coordinación de recursos' },
    ],
    footerTagline: 'Liderazgo  ·  Colaboración  ·  Acción',
    cta: 'ÚNETE  ·  startupfactoryhub.com  →',
    fileName: 'venezuela-rebuild-es.png',
  },
};

// New palette: electric cyan + magenta ember, anchored on deep slate
const PALETTE = {
  accent: '#22d3ee',       // cyan-400
  accentSoft: '#67e8f9',   // cyan-300
  accentDeep: '#0891b2',   // cyan-600
  ember: '#f43f5e',        // rose-500
  emberSoft: '#fb7185',    // rose-400
  ink: '#03070f',
  inkSoft: '#0b1220',
};

const BannerCanvas = ({ lang, sharedAssets }: { lang: Lang; sharedAssets: { logo: HTMLImageElement | null; bg: HTMLImageElement | null } }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(true);
  const copy = COPY[lang];

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

    draw(ctx, W, H, sharedAssets.logo, sharedAssets.bg, copy);
    setRendering(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedAssets.logo, sharedAssets.bg, lang]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = copy.fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success(`Banner downloaded (${lang.toUpperCase()})`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {lang === 'en' ? 'English' : 'Español'}
        </span>
        <Button onClick={handleDownload} disabled={rendering} size="sm" variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          PNG
        </Button>
      </div>
      <div className="relative rounded-lg overflow-hidden border border-border bg-black">
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <div className="flex items-center gap-2 text-white text-sm">
              <ImageIcon className="w-4 h-4 animate-pulse" />
              Rendering…
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="w-full h-auto block" />
      </div>
    </div>
  );
};

// Auto-shrink a font string's pixel size until the text fits maxWidth.
// Mutates ctx.font. Returns nothing.
const fitFont = (
  ctx: CanvasRenderingContext2D,
  text: string,
  baseFont: string,
  basePx: number,
  maxWidth: number,
  minPx = 8,
) => {
  let px = basePx;
  ctx.font = baseFont.replace(/(\d+(?:\.\d+)?)px/, `${px}px`);
  while (ctx.measureText(text).width > maxWidth && px > minPx) {
    px -= 1;
    ctx.font = baseFont.replace(/(\d+(?:\.\d+)?)px/, `${px}px`);
  }
};

const draw = (
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  logo: HTMLImageElement | null,
  bg: HTMLImageElement | null,
  copy: Copy,
) => {
  // === BASE INK ===
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(0, 0, W, H);

  // === BG IMAGE: robots building, cover-fit, dimmed ===
  if (bg) {
    const ir = bg.width / bg.height;
    const cr = W / H;
    let sx = 0, sy = 0, sw = bg.width, sh = bg.height;
    if (ir > cr) {
      sw = bg.height * cr;
      sx = (bg.width - sw) / 2;
    } else {
      sh = bg.width / cr;
      sy = (bg.height - sh) / 2;
    }
    ctx.drawImage(bg, sx, sy, sw, sh, 0, 0, W, H);
  }

  // === DARKENING + COLOR GRADE ===
  const dark = ctx.createLinearGradient(0, 0, W, H);
  dark.addColorStop(0, 'rgba(3, 7, 15, 0.92)');
  dark.addColorStop(0.5, 'rgba(3, 7, 15, 0.78)');
  dark.addColorStop(1, 'rgba(8, 145, 178, 0.55)');
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, W, H);

  // left-side vignette to anchor copy
  const leftFade = ctx.createLinearGradient(0, 0, W * 0.65, 0);
  leftFade.addColorStop(0, 'rgba(3, 7, 15, 0.92)');
  leftFade.addColorStop(0.6, 'rgba(3, 7, 15, 0.55)');
  leftFade.addColorStop(1, 'rgba(3, 7, 15, 0)');
  ctx.fillStyle = leftFade;
  ctx.fillRect(0, 0, W * 0.7, H);

  // cyan glow top-left
  const glow1 = ctx.createRadialGradient(W * 0.12, H * 0.2, 20, W * 0.12, H * 0.2, 540);
  glow1.addColorStop(0, 'rgba(34, 211, 238, 0.18)');
  glow1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);

  // ember glow bottom-right
  const glow2 = ctx.createRadialGradient(W * 0.88, H * 0.85, 20, W * 0.88, H * 0.85, 480);
  glow2.addColorStop(0, 'rgba(244, 63, 94, 0.22)');
  glow2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // ultra-fine grid for the tech feel
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // === TOP META BAR ===
  const metaMaxW = (W - 96) / 2 - 24;
  fitFont(ctx, copy.metaLeft, '500 10.5px "Inter", system-ui, sans-serif', 10.5, metaMaxW);
  ctx.fillStyle = PALETTE.accentSoft;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(copy.metaLeft, 48, 36);

  fitFont(ctx, copy.metaRight, '500 10.5px "Inter", system-ui, sans-serif', 10.5, metaMaxW);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText(copy.metaRight, W - 48, 36);
  ctx.textBaseline = 'alphabetic';

  const meta = ctx.createLinearGradient(48, 56, W - 48, 56);
  meta.addColorStop(0, 'rgba(255,255,255,0)');
  meta.addColorStop(0.5, 'rgba(34, 211, 238, 0.35)');
  meta.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = meta;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(48, 56); ctx.lineTo(W - 48, 56); ctx.stroke();

  // === LEFT COLUMN ===
  const leftX = 60;

  // Eyebrow pill
  const pillX = leftX, pillY = 92, pillW = 240, pillH = 28;
  ctx.fillStyle = 'rgba(34, 211, 238, 0.10)';
  ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, 14); ctx.stroke();

  ctx.fillStyle = PALETTE.ember;
  ctx.beginPath(); ctx.arc(pillX + 14, pillY + pillH / 2, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(244, 63, 94, 0.3)';
  ctx.beginPath(); ctx.arc(pillX + 14, pillY + pillH / 2, 7, 0, Math.PI * 2); ctx.fill();

  ctx.font = '600 10.5px "Inter", system-ui, sans-serif';
  ctx.fillStyle = '#ecfeff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(copy.pill, pillX + 28, pillY + pillH / 2 + 0.5);
  ctx.textBaseline = 'alphabetic';

  // Headline — sleek thin
  ctx.font = '200 78px "Inter", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 18;
  ctx.fillText(copy.headline1, leftX, 200);

  // Accent word — cyan-to-magenta gradient
  const accentGrad = ctx.createLinearGradient(leftX, 240, leftX + 600, 290);
  accentGrad.addColorStop(0, PALETTE.accentSoft);
  accentGrad.addColorStop(0.55, PALETTE.accent);
  accentGrad.addColorStop(1, PALETTE.ember);
  ctx.font = '900 78px "Inter", system-ui, sans-serif';
  ctx.fillStyle = accentGrad;
  ctx.shadowColor = 'rgba(34, 211, 238, 0.55)';
  ctx.shadowBlur = 28;
  ctx.fillText(copy.headline2, leftX, 278);
  ctx.shadowBlur = 0;

  // Subline italic
  ctx.font = '300 italic 26px "Inter", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.fillText(copy.subline, leftX, 318);
  ctx.shadowBlur = 0;

  // Quote block
  const mY = 360, mH = 96;
  const mGrad = ctx.createLinearGradient(leftX, mY, leftX, mY + mH);
  mGrad.addColorStop(0, PALETTE.accent);
  mGrad.addColorStop(1, PALETTE.ember);
  ctx.fillStyle = mGrad;
  ctx.fillRect(leftX, mY, 2, mH);

  ctx.font = '400 14px "Inter", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText(copy.quoteSmall, leftX + 18, mY + 22);

  ctx.font = '600 19px "Inter", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
  ctx.fillText(copy.quoteLeft, leftX + 18, mY + 52);
  const tw = ctx.measureText(copy.quoteLeft).width;
  ctx.fillStyle = PALETTE.accent;
  ctx.fillText(copy.quoteAccent, leftX + 18 + tw, mY + 52);

  ctx.font = '400 12.5px "Inter", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText(copy.bodyA, leftX + 18, mY + 76);
  ctx.fillText(copy.bodyB, leftX + 18, mY + 92);

  // === RIGHT COLUMN — capabilities ===
  const rightX = 700;
  const rightW = W - rightX - 60;

  ctx.font = '500 10.5px "Inter", system-ui, sans-serif';
  ctx.fillStyle = PALETTE.accentSoft;
  ctx.textAlign = 'left';
  ctx.fillText(copy.capsHeader, rightX, 100);

  let sxh = rightX;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i === 0 ? PALETTE.accent : 'rgba(255, 255, 255, 0.14)';
    ctx.fillRect(sxh, 110, 24, 2);
    sxh += 30;
  }

  const accents = [PALETTE.accent, PALETTE.accentSoft, PALETTE.ember, PALETTE.emberSoft];
  const rowY0 = 138, rowH = 70;

  copy.pillars.forEach((p, i) => {
    const y = rowY0 + i * (rowH + 6);
    const color = accents[i];

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath(); ctx.roundRect(rightX, y, rightW, rowH, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(rightX, y, rightW, rowH, 12); ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(rightX, y + 14, 3, rowH - 28, 2); ctx.fill();

    ctx.font = '300 32px "Inter", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.fillText(p.code, rightX + 22, y + 44);

    ctx.font = '600 16px "Inter", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.fillText(p.title, rightX + 78, y + 30);

    ctx.font = '400 12px "Inter", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(p.sub, rightX + 78, y + 50);

    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(rightX + rightW - 22, y + rowH / 2, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = color + '55';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(rightX + rightW - 22, y + rowH / 2, 8, 0, Math.PI * 2); ctx.stroke();
  });

  // === FOOTER ===
  const fY = H - 58;
  const fLine = ctx.createLinearGradient(48, fY, W - 48, fY);
  fLine.addColorStop(0, 'rgba(255,255,255,0)');
  fLine.addColorStop(0.5, 'rgba(34, 211, 238, 0.45)');
  fLine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = fLine;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(48, fY); ctx.lineTo(W - 48, fY); ctx.stroke();

  if (logo) {
    const ls = 30, lx = 60, ly = fY + 14;
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx + ls / 2, ly + ls / 2, ls / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logo, lx, ly, ls, ls);
    ctx.restore();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(lx + ls / 2, ly + ls / 2, ls / 2, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.font = '600 12px "Inter", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'left';
  ctx.fillText('STARTUP FACTORY HUB', 105, fY + 28);
  ctx.font = '400 10.5px "Inter", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText(copy.footerTagline, 105, fY + 42);

  const ctaW = 240, ctaH = 36;
  const ctaX = W - 60 - ctaW;
  const ctaY = fY + 11;
  const ctaGrad = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaW, ctaY);
  ctaGrad.addColorStop(0, PALETTE.accent);
  ctaGrad.addColorStop(1, PALETTE.ember);
  ctx.fillStyle = ctaGrad;
  ctx.beginPath(); ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 18); ctx.fill();

  ctx.font = '700 12px "Inter", system-ui, sans-serif';
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(copy.cta, ctaX + ctaW / 2, ctaY + ctaH / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // Corner marks
  const corner = (cx: number, cy: number, dx: number, dy: number) => {
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
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

const VenezuelaRebuildBanner = () => {
  const [assets, setAssets] = useState<{ logo: HTMLImageElement | null; bg: HTMLImageElement | null } | null>(null);

  useEffect(() => {
    let loaded = 0;
    const out: { logo: HTMLImageElement | null; bg: HTMLImageElement | null } = { logo: null, bg: null };
    const done = () => { loaded++; if (loaded === 2) setAssets(out); };

    const l = new window.Image();
    l.onload = () => { out.logo = l; done(); };
    l.onerror = done;
    l.src = sfhLogo;

    const b = new window.Image();
    b.onload = () => { out.bg = b; done(); };
    b.onerror = done;
    b.src = bgImage;
  }, []);

  return (
    <div className="tech-card border-0 p-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-400" />
          Venezuela Rebuild Initiative — Marketing Banners
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Robots-building backdrop · cyan/ember palette · English + Spanish editions.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {assets && <BannerCanvas lang="en" sharedAssets={assets} />}
        {assets && <BannerCanvas lang="es" sharedAssets={assets} />}
        {!assets && (
          <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="w-4 h-4 animate-pulse" />
            Loading assets…
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        1200×630px each · Optimized for social, email headers & presentations
      </p>
    </div>
  );
};

export default VenezuelaRebuildBanner;
