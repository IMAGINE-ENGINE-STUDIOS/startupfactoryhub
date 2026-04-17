import { useState, useRef, useEffect, useCallback } from 'react';
import { Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail, Printer, Search, Network, BarChart3, GraduationCap, Building2, Diamond, Cpu, DollarSign, Handshake, MapPin, Smartphone, Loader2, Calendar, Telescope, Radio, Star, Brain, Video, Zap, Crown, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import sfhLogo from '@/assets/sfh-logo-combined.png';

// --- Static matrix-symbol background layer (CSS-based, lightweight, brand teal) ---
const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩABCDEF0123456789@#$%&*";
const MatrixSymbolLayer = ({ density = 0.08, columns = 32 }: { density?: number; columns?: number }) => {
  const cols = Array.from({ length: columns }, (_, i) => i);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ opacity: density }}>
      {cols.map((c) => {
        const charsInCol = 22 + Math.floor(Math.random() * 10);
        const left = (c / columns) * 100;
        const delay = (Math.random() * 4).toFixed(2);
        return (
          <div
            key={c}
            className="absolute top-0 text-teal-400 font-mono text-[11px] leading-[14px] whitespace-pre"
            style={{
              left: `${left}%`,
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              animation: `matrix-fall 18s linear ${delay}s infinite`,
              textShadow: '0 0 6px rgba(20,184,166,0.6)',
            }}
          >
            {Array.from({ length: charsInCol }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]).join('')}
          </div>
        );
      })}
    </div>
  );
};

// background images removed — using solid geometric backgrounds only
import nasaTTPLogo from '@/assets/nasa-tech-transfer.webp';
import nasaLogo from '@/assets/nasa-logo.png';
import nasdaqFeature from '@/assets/nasdaq-feature.jpg';

// --- Geometric overlays ---
const TechGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(24)].map((_, i) => <div key={`h-${i}`} className="absolute w-full h-px bg-gradient-to-r from-transparent via-teal-500/8 to-transparent" style={{ top: `${(i + 1) * 4}%` }} />)}
    {[...Array(16)].map((_, i) => <div key={`v-${i}`} className="absolute h-full w-px bg-gradient-to-b from-transparent via-teal-500/8 to-transparent" style={{ left: `${(i + 1) * 6}%` }} />)}
  </div>
);

const FloatingHexagons = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[8%] right-[5%] w-28 h-28 border-2 border-teal-500/15 rotate-12" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    <div className="absolute top-[15%] right-[12%] w-16 h-16 border border-cyan-500/12 -rotate-6" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    <div className="absolute bottom-[12%] left-[5%] w-20 h-20 border-2 border-teal-500/12 rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    <div className="absolute bottom-[8%] right-[8%] w-16 h-16 border border-teal-500/10 rotate-15" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
  </div>
);

const EnergyLines = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-1/4 -left-20 w-56 h-56 border-2 border-teal-500/10 rounded-full" />
    <div className="absolute top-1/3 -right-20 w-56 h-56 border-2 border-cyan-500/10 rounded-full" />
    <div className="absolute top-[15%] left-[8%] w-1.5 h-1.5 bg-teal-400 rounded-full shadow-lg shadow-teal-500/50" />
    <div className="absolute top-[25%] right-[10%] w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50" />
    <div className="absolute bottom-[20%] left-[6%] w-1.5 h-1.5 bg-teal-400 rounded-full shadow-lg shadow-teal-500/50" />
  </div>
);

const CornerAccents = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-4 left-4"><div className="w-10 h-0.5 bg-gradient-to-r from-teal-500 to-transparent" /><div className="w-0.5 h-10 bg-gradient-to-b from-teal-500 to-transparent" /></div>
    <div className="absolute top-4 right-4"><div className="w-10 h-0.5 bg-gradient-to-l from-teal-500 to-transparent ml-auto" /><div className="w-0.5 h-10 bg-gradient-to-b from-teal-500 to-transparent ml-auto" /></div>
    <div className="absolute bottom-4 left-4"><div className="w-0.5 h-10 bg-gradient-to-t from-teal-500 to-transparent" /><div className="w-10 h-0.5 bg-gradient-to-r from-teal-500 to-transparent" /></div>
    <div className="absolute bottom-4 right-4"><div className="w-0.5 h-10 bg-gradient-to-t from-teal-500 to-transparent ml-auto" /><div className="w-10 h-0.5 bg-gradient-to-l from-teal-500 to-transparent ml-auto" /></div>
  </div>
);

const SectionDivider = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-teal-500" />
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 bg-teal-500 rotate-45" />
      <span className="text-[10px] font-semibold text-teal-400 tracking-widest uppercase">{title}</span>
      <div className="w-1.5 h-1.5 bg-teal-500 rotate-45" />
    </div>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-teal-500/50 to-teal-500" />
  </div>
);

const TechCard = ({ children, className = "", glowColor = "teal" }: { children: React.ReactNode; className?: string; glowColor?: string }) => {
  const accentClasses: Record<string, string> = {
    teal: "before:bg-teal-400 after:bg-teal-400 ring-teal-500/20",
    cyan: "before:bg-cyan-400 after:bg-cyan-400 ring-cyan-500/20",
    purple: "before:bg-purple-400 after:bg-purple-400 ring-purple-500/20",
    emerald: "before:bg-emerald-400 after:bg-emerald-400 ring-emerald-500/20",
    amber: "before:bg-amber-400 after:bg-amber-400 ring-amber-500/20",
    rose: "before:bg-rose-400 after:bg-rose-400 ring-rose-500/20",
  };
  const accent = accentClasses[glowColor] || accentClasses.teal;
  return (
    <div className={`relative tech-card border-0 ring-1 ${accent.split(' ').slice(2).join(' ')} backdrop-blur-sm rounded-lg p-4 ${className}`}>
      {/* HUD corner brackets */}
      <span className={`absolute top-1 left-1 w-1.5 h-1.5 ${accent.split(' ')[0].replace('before:', '')}`} />
      <span className={`absolute top-1 right-1 w-1.5 h-1.5 ${accent.split(' ')[1].replace('after:', '')}`} />
      <span className={`absolute bottom-1 left-1 w-1.5 h-1.5 ${accent.split(' ')[0].replace('before:', '')} opacity-60`} />
      <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 ${accent.split(' ')[1].replace('after:', '')} opacity-60`} />
      <div className="relative">{children}</div>
    </div>
  );
};

const IconBadge = ({ icon: Icon, color = "teal" }: { icon: React.ComponentType<{ className?: string }>; color?: string }) => {
  const colorClasses: Record<string, string> = {
    teal: "bg-teal-500/20 text-teal-400 border-teal-500/40",
    cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    rose: "bg-rose-500/20 text-rose-400 border-rose-500/40",
  };
  return (
    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorClasses[color] || colorClasses.teal}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
};

// --- A4 Portrait wrapper: 842x1190 ---
const BASE_W = 842;
const BASE_H = 1190;

const A4Wrapper = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      setScale(width / BASE_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full bg-slate-950" style={{ position: 'relative', overflow: 'hidden', aspectRatio: `${BASE_W}/${BASE_H}` }}>
      <div data-slide style={{
        width: BASE_W,
        height: BASE_H,
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginLeft: -(BASE_W / 2),
        marginTop: -(BASE_H / 2),
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}>
        {/* Shared matrix symbol backdrop — subtle on every slide */}
        <div className="absolute inset-0 bg-slate-950 pointer-events-none" />
        <MatrixSymbolLayer density={0.07} columns={28} />
        <div className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm absolute inset-0 pointer-events-none" />
        {children}
      </div>
    </div>
  );
};

const PageContainer = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <A4Wrapper>
    <section className={`absolute inset-0 flex flex-col p-[3%] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden ${className}`}>
      <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg" />
      <TechGrid />
      <FloatingHexagons />
      <EnergyLines />
      <CornerAccents />
      <div className="relative z-10 w-full max-w-[94%] mx-auto h-full flex flex-col">
        {children}
      </div>
    </section>
  </A4Wrapper>
);

export default function Brochure() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = useCallback(async () => {
    if (!deckRef.current || isExporting) return;
    setIsExporting(true);
    toast.info("Generating PDF...");
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [BASE_W, BASE_H] });
      const slideEls = deckRef.current.querySelectorAll<HTMLDivElement>('[data-slide]');
      for (let i = 0; i < slideEls.length; i++) {
        const slideEl = slideEls[i];
        const parentEl = slideEl.parentElement as HTMLDivElement;
        const origSlide = { transform: slideEl.style.transform, position: slideEl.style.position, left: slideEl.style.left, top: slideEl.style.top, marginLeft: slideEl.style.marginLeft, marginTop: slideEl.style.marginTop };
        const origParent = { overflow: parentEl.style.overflow, width: parentEl.style.width, height: parentEl.style.height, minHeight: parentEl.style.minHeight, position: parentEl.style.position };
        parentEl.style.overflow = 'visible';
        parentEl.style.width = `${BASE_W}px`;
        parentEl.style.height = `${BASE_H}px`;
        parentEl.style.minHeight = `${BASE_H}px`;
        parentEl.style.position = 'relative';
        slideEl.style.transform = 'none';
        slideEl.style.position = 'relative';
        slideEl.style.left = '0';
        slideEl.style.top = '0';
        slideEl.style.marginLeft = '0';
        slideEl.style.marginTop = '0';
        const imgs = slideEl.querySelectorAll('img');
        await Promise.all(Array.from(imgs).map(img => img.complete ? Promise.resolve() : new Promise<void>(r => { img.onload = () => r(); img.onerror = () => r(); })));
        const canvas = await html2canvas(slideEl, { width: BASE_W, height: BASE_H, scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#020617', logging: false, windowWidth: BASE_W, windowHeight: BASE_H });
        Object.assign(slideEl.style, origSlide);
        Object.assign(parentEl.style, origParent);
        if (i > 0) pdf.addPage([BASE_W, BASE_H], 'portrait');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, BASE_W, BASE_H);
      }
      pdf.save('Startup-Factory-Hub-Brochure.pdf');
      toast.success("PDF exported!");
    } catch (e) {
      console.error('PDF export error:', e);
      toast.error("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  return (
    <div ref={deckRef} className="min-h-screen bg-slate-950 text-white">
      {/* Nav bar */}
      <div className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 text-white hover:bg-slate-800 hover:text-teal-400">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
          <span className="text-sm text-teal-400 font-medium tracking-wide">STARTUP FACTORY HUB // BROCHURE</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting} className="gap-2 border-teal-500/50 text-teal-400 hover:bg-teal-500/10 hover:border-teal-500">
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
        </Button>
      </div>

      <div className="pt-14 max-w-[700px] mx-auto">

        {/* ===== PAGE 1: COVER ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-between p-[6%] py-[8%] overflow-hidden scan-effect">
            {/* Extra-dense matrix layer (on top of A4Wrapper's subtle one) for shock */}
            <MatrixSymbolLayer density={0.22} columns={36} />
            {/* Radial vignette */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 45%, rgba(20,184,166,0.18) 0%, rgba(2,6,23,0.85) 55%, rgba(2,6,23,0.95) 100%)' }} />
            {/* Scan-line teal stripes */}
            <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(20,184,166,0.04) 3px, rgba(20,184,166,0.04) 4px)' }} />
            <div className="absolute inset-[0.8%] border-2 border-teal-500/50 rounded-lg" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />

            {/* Bold HUD corner brackets */}
            <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-teal-400 pointer-events-none" />
            <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-teal-400 pointer-events-none" />
            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-teal-400 pointer-events-none" />
            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-teal-400 pointer-events-none" />

            {/* Top section */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/15 border border-teal-500/50 rounded-full mb-2 backdrop-blur-sm shadow-[0_0_20px_rgba(20,184,166,0.4)]">
                <Star className="h-3 w-3 text-teal-300" />
                <span className="text-[11px] font-bold text-teal-300 tracking-[0.35em] uppercase">AI-Powered Accelerator Platform</span>
                <Star className="h-3 w-3 text-teal-300" />
              </div>
              <div className="font-mono text-[10px] text-teal-500/70 tracking-[0.4em]">// SYSTEM ONLINE // BOOT SEQUENCE COMPLETE //</div>
            </div>

            {/* Center logo + title */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-8">
                {/* Soft teal halo */}
                <div className="absolute inset-0 bg-teal-500/40 blur-[80px] rounded-full scale-150" />
                <div className="absolute inset-0 bg-cyan-500/20 blur-[60px] rounded-full scale-125" />
                {/* Concentric orbiting rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute w-[560px] h-[560px] border border-teal-400/20 rounded-full" style={{ animation: 'slow-spin 40s linear infinite' }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-teal-400 rounded-full shadow-[0_0_12px_rgba(20,184,166,0.9)]" />
                  </div>
                  <div className="absolute w-[640px] h-[640px] border border-cyan-400/15 rounded-full" style={{ animation: 'slow-spin-reverse 60s linear infinite' }}>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
                  </div>
                  <div className="absolute w-[720px] h-[720px] border border-teal-500/10 rounded-full" />
                </div>
                <img src={sfhLogo} alt="Startup Factory Hub" className="relative w-[480px] max-w-full object-contain drop-shadow-[0_0_60px_rgba(20,184,166,0.7)]" />
              </div>

              {/* Bold tagline */}
              <div className="relative mb-5">
                <h2 className="font-futuristic text-[22px] font-black tracking-[0.18em] uppercase bg-gradient-to-r from-teal-300 via-cyan-200 to-teal-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(20,184,166,0.6)] animate-gradient">
                  The Operating System
                </h2>
                <h2 className="font-futuristic text-[22px] font-black tracking-[0.18em] uppercase bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(20,184,166,0.6)] animate-gradient">
                  for Innovation Ecosystems
                </h2>
              </div>

              <p className="text-sm text-slate-300 max-w-lg leading-relaxed mb-6">
                A hybrid digital-physical execution platform with global locations, AI-driven workflows, and human expertise — enabling founders to build consistently from idea to scale.
              </p>

              <div className="relative tech-card border-0 ring-1 ring-teal-500/40 rounded-xl px-10 py-4 backdrop-blur-sm shadow-[0_0_40px_rgba(20,184,166,0.25)]">
                <span className="absolute -top-1 -left-1 w-2 h-2 bg-teal-400" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-400" />
                <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-teal-400" />
                <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-teal-400" />
                <p className="font-futuristic text-xl font-black text-white tracking-[0.25em] mb-1">BUILD · LAUNCH · SCALE</p>
                <p className="text-xs text-slate-400 tracking-wide">From idea validation to global expansion — all in one platform.</p>
              </div>
            </div>

            {/* Bottom section: HUD data strip */}
            <div className="relative z-10 flex flex-col items-center text-center w-full">
              <div className="flex items-center gap-4 mb-3">
                <Globe className="h-5 w-5 text-cyan-400 animate-pulse" />
                <span className="font-futuristic text-sm font-bold text-cyan-300 tracking-[0.3em]">4 GLOBAL HUBS</span>
                <Globe className="h-5 w-5 text-cyan-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-teal-400" />
                <span className="text-sm text-slate-300 tracking-widest font-mono">ORLANDO · SANTIAGO · TOKYO · SEVILLA</span>
              </div>
              {/* Live data strip */}
              <div className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm w-full flex items-center justify-between px-4 py-2 border-t border-b">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="font-mono text-[10px] text-emerald-300 tracking-widest">SYSTEM ONLINE</span>
                </div>
                <span className="font-mono text-[10px] text-teal-400/80 tracking-widest">// v2.0 //</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-cyan-300 tracking-widest">GLOBAL NETWORK ACTIVE</span>
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </div>
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== PAGE 2: OVERVIEW ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute inset-[0.8%] border-2 border-teal-500/30 rounded-lg" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />

            <div className="relative z-10 w-full max-w-[92%] mx-auto flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
                <span className="text-[11px] font-semibold text-teal-400 tracking-[0.3em] uppercase">Platform Introduction</span>
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
              </div>
              <h2 className="text-4xl font-bold text-white text-center mb-3">Overview</h2>
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-teal-500/60" />
                <Diamond className="h-3 w-3 text-teal-400" />
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-teal-500/60" />
              </div>

              {/* Lead paragraph */}
              <TechCard glowColor="teal" className="mb-4">
                <div className="flex items-start gap-3">
                  <IconBadge icon={Rocket} color="teal" />
                  <p className="text-sm text-slate-200 leading-relaxed flex-1">
                    <span className="text-teal-400 font-bold">Startup Factory Hub</span> is an integrated platform combining a <span className="text-white font-semibold">high-performance accelerator</span> with an <span className="text-white font-semibold">AI-powered business intelligence layer</span>, designed to connect strategic partners with curated, high-potential startups across <span className="text-cyan-400 font-semibold">deep tech, AI, space, and emerging industries</span>.
                  </p>
                </div>
              </TechCard>

              {/* What we provide */}
              <TechCard glowColor="cyan" className="mb-4">
                <div className="flex items-start gap-3">
                  <IconBadge icon={Network} color="cyan" />
                  <p className="text-sm text-slate-200 leading-relaxed flex-1">
                    We provide structured access to <span className="text-cyan-400 font-semibold">vetted deal flow</span>, enable <span className="text-cyan-400 font-semibold">strategic collaboration</span>, and deliver <span className="text-cyan-400 font-semibold">real-time intelligence</span> on startups, technologies, and market opportunities. Our hybrid model connects physical innovation hubs with a unified digital platform, allowing partners to engage directly with companies shaping the next generation of innovation.
                  </p>
                </div>
              </TechCard>

              {/* Outcome */}
              <TechCard glowColor="emerald">
                <div className="flex items-start gap-3">
                  <IconBadge icon={Handshake} color="emerald" />
                  <p className="text-sm text-slate-200 leading-relaxed flex-1">
                    Through this ecosystem, partners gain <span className="text-emerald-400 font-semibold">early, actionable access</span> to opportunities aligned with their <span className="text-white font-semibold">strategic, technological, and investment priorities</span>.
                  </p>
                </div>
              </TechCard>

              {/* Key pillars strip */}
              <div className="grid grid-cols-4 gap-2 mt-6">
                {[
                  { icon: Search, label: "Vetted Deal Flow", color: "teal" },
                  { icon: Brain, label: "AI Intelligence", color: "cyan" },
                  { icon: Handshake, label: "Strategic Collab", color: "emerald" },
                  { icon: Globe, label: "Hybrid Hubs", color: "purple" },
                ].map((p, i) => (
                  <div key={i} className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm flex flex-col items-center gap-1.5 rounded-lg py-3 px-2">
                    <IconBadge icon={p.icon} color={p.color} />
                    <span className="text-[10px] font-semibold text-slate-300 text-center tracking-wide">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== PAGE 3: THE PROBLEM ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute inset-[0.8%] border-2 border-rose-500/30 rounded-lg" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[92%] mx-auto flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <div className="w-2 h-2 bg-rose-500 rotate-45" />
                <span className="text-[11px] font-semibold text-rose-400 tracking-[0.3em] uppercase">System Failure</span>
                <div className="w-2 h-2 bg-rose-500 rotate-45" />
              </div>
              <h2 className="text-4xl font-bold text-white text-center mb-3">The Problem</h2>
              <p className="text-sm text-center text-slate-300 mb-5 max-w-lg mx-auto leading-relaxed">
                The current innovation ecosystem is <span className="text-rose-400 font-semibold">fragmented and inefficient</span> — startups, partners, and capital operate in disconnected silos.
              </p>

              {/* Broken journey flow */}
              <div className="relative w-full mb-6">
                <div className="absolute top-[32px] left-[10%] right-[10%] h-0.5">
                  <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(244,63,94,0.4) 6px, rgba(244,63,94,0.4) 10px)' }} />
                </div>
                <div className="grid grid-cols-5 gap-4 relative">
                  {[
                    { icon: GraduationCap, label: "Education", active: true },
                    { icon: Cpu, label: "Product", active: false },
                    { icon: Target, label: "Market", active: false },
                    { icon: DollarSign, label: "Revenue", active: false },
                    { icon: TrendingUp, label: "Scale", active: false },
                  ].map((s, i) => (
                    <div key={i} className={`flex flex-col items-center ${!s.active ? 'opacity-60' : ''}`}>
                      <div className={`w-12 h-12 rounded-full ${s.active ? 'bg-teal-500/20 border-2 border-teal-500/60' : 'bg-slate-800 border-2 border-rose-500/40 border-dashed'} flex items-center justify-center`}>
                        <s.icon className={`h-5 w-5 ${s.active ? 'text-teal-400' : 'text-slate-500'}`} />
                      </div>
                      <span className={`text-sm font-bold mt-1 ${s.active ? 'text-teal-400' : 'text-slate-500'}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <SectionDivider title="Seven Critical Gaps" />
              <div className="grid grid-cols-2 gap-3 w-full mb-3">
                {[
                  { icon: Network, num: "01", title: "Fragmented ecosystem", desc: "High-potential startups, technologies, and partners operate in disconnected environments." },
                  { icon: Search, num: "02", title: "Limited visibility into emerging tech", desc: "Critical innovation develops outside traditional corporate and investment pipelines." },
                  { icon: Handshake, num: "03", title: "Inefficient partnership channels", desc: "Sourcing, vetting, and engaging startups is time-consuming and inconsistent." },
                  { icon: Calendar, num: "04", title: "No continuity post–demo day", desc: "Most accelerator programs fail to provide ongoing execution support after initial exposure." },
                  { icon: Users, num: "05", title: "Limited access to operators", desc: "Founders lack consistent guidance from builders who have scaled companies." },
                  { icon: DollarSign, num: "06", title: "Capital without execution", desc: "Funding is often deployed without the operational support required to drive outcomes." },
                ].map((g, i) => (
                  <div key={i} className="tech-card border-0 ring-1 ring-rose-500/30 backdrop-blur-sm rounded-lg p-3 flex items-start gap-2.5">
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-sm font-black text-rose-500/40 leading-none">{g.num}</span>
                      <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center mt-1.5">
                        <g.icon className="h-4 w-4 text-rose-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-rose-300 mb-1 leading-tight">{g.title}</p>
                      <p className="text-[12.5px] text-slate-300 leading-snug">{g.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-full max-w-[55%] mx-auto">
                <div className="tech-card border-0 ring-1 ring-rose-500/30 backdrop-blur-sm rounded-lg p-3 flex items-start gap-2.5">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-sm font-black text-rose-500/40 leading-none">07</span>
                    <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center mt-1.5">
                      <GraduationCap className="h-4 w-4 text-rose-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-rose-300 mb-1 leading-tight">Education disconnected from revenue</p>
                    <p className="text-[12.5px] text-slate-300 leading-snug">Programs prioritize theory over real market traction and measurable results.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== PAGE 3: THE SOLUTION ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[92%] mx-auto flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
                <span className="text-[11px] font-semibold text-teal-400 tracking-[0.3em] uppercase">End-to-End Execution</span>
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
              </div>
              <h2 className="text-4xl font-bold text-white text-center mb-3">The Solution</h2>

              {/* Connected journey flow — all stages active */}
              <div className="relative w-full mb-5">
                <div className="absolute top-[24px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-teal-500/60 via-cyan-400/80 to-teal-500/60" />
                <div className="grid grid-cols-5 gap-4 relative">
                  {[
                    { icon: GraduationCap, label: "Education" },
                    { icon: Cpu, label: "Product" },
                    { icon: Target, label: "Market" },
                    { icon: DollarSign, label: "Revenue" },
                    { icon: TrendingUp, label: "Scale" },
                  ].map((s, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-teal-500/20 border-2 border-teal-500/60 flex items-center justify-center shadow-[0_0_12px_rgba(20,184,166,0.35)]">
                        <s.icon className="h-5 w-5 text-teal-400" />
                      </div>
                      <span className="text-sm font-bold mt-1 text-teal-400">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm rounded-lg p-3.5 mb-3">
                <p className="text-sm text-center text-slate-200 leading-relaxed mb-2">
                  <span className="text-teal-400 font-bold">Startup Factory Hub</span> delivers an integrated ecosystem that combines <span className="text-white font-semibold">acceleration, intelligence, and execution</span>.
                </p>
                <p className="text-sm text-center text-slate-300 leading-relaxed mb-2">
                  Our platform operates as a <span className="text-cyan-400 font-semibold">hybrid accelerator and AI-powered business intelligence system</span>, designed to bridge the gap between capital, technology, and execution.
                </p>
                <p className="text-sm text-center text-slate-300 leading-relaxed">
                  <span className="text-teal-400 font-bold">We are not a 3-month program.</span> We are a permanent operating system that merges intelligent automation, physical hubs, mentorship, and capital access into one continuous execution engine.
                </p>
              </div>

              {/* 4 Pillars */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { icon: Brain, label: "AI-Powered Business Intelligence Layer", desc: "Provides structured insights into startups, markets, and emerging technologies, enabling smarter partnership and investment decisions.", color: "teal" },
                  { icon: Rocket, label: "Integrated Accelerator Platform", desc: "Supports startups beyond demo day with continuous execution, operator guidance, and strategic alignment.", color: "cyan" },
                  { icon: Globe, label: "Hybrid Infrastructure", desc: "Connects physical innovation hubs with a unified digital layer, creating a seamless environment for collaboration, data flow, and opportunity tracking.", color: "purple" },
                  { icon: Network, label: "Strategic Ecosystem Access", desc: "Direct connection to startups, technologies, investors, and institutional opportunities within a single platform.", color: "emerald" },
                ].map((p, i) => (
                  <div key={i} className={`tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm border-${p.color}-500/30 rounded-lg p-3 backdrop-blur-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg bg-${p.color}-500/20 border border-${p.color}-500/40 flex items-center justify-center shrink-0`}>
                        <p.icon className={`h-4 w-4 text-${p.color}-400`} />
                      </div>
                      <span className={`text-sm font-bold text-${p.color}-400 leading-tight`}>{p.label}</span>
                    </div>
                    <p className="text-[12.5px] text-slate-300 leading-snug">{p.desc}</p>
                  </div>
                ))}
              </div>

              {/* 4 Execution Mechanisms */}
              <SectionDivider title="Execution Mechanisms" />
              <div className="grid grid-cols-4 gap-2.5 mb-3">
                {[
                  { icon: Cpu, label: "Digital Infrastructure", desc: "AI-powered tools & full automation", color: "teal" },
                  { icon: Users, label: "Human Expertise", desc: "Mentors, advisors & global network", color: "cyan" },
                  { icon: Building2, label: "Corporate Partners", desc: "Strategic alliances & enterprise deals", color: "purple" },
                  { icon: DollarSign, label: "Capital Access", desc: "Investor network & funding pipeline", color: "emerald" },
                ].map((m, i) => (
                  <div key={i} className={`tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm border-${m.color}-500/40 rounded-lg p-2.5 backdrop-blur-sm text-center`}>
                    <div className={`w-8 h-8 rounded-lg bg-${m.color}-500/20 border border-${m.color}-500/40 flex items-center justify-center mx-auto mb-1.5`}>
                      <m.icon className={`h-4 w-4 text-${m.color}-400`} />
                    </div>
                    <h4 className={`text-[12.5px] font-bold text-${m.color}-400 mb-0.5 leading-tight`}>{m.label}</h4>
                    <p className="text-[11px] text-slate-400 leading-snug">{m.desc}</p>
                  </div>
                ))}
              </div>

              {/* Closing statement */}
              <div className="bg-gradient-to-r from-teal-500/10 via-cyan-500/15 to-teal-500/10 border border-teal-500/40 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-sm text-center text-slate-100 leading-relaxed">
                  This is <span className="text-rose-400 font-semibold">not just an accelerator</span> — it is a <span className="text-teal-400 font-bold">system designed to source, analyze, and execute on innovation at scale.</span>
                </p>
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== ECOSYSTEM VIEW — GEAR SCHEMA (after Solution) ===== */}
        <PageContainer>
          <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 justify-center mb-2">
            <div className="w-2 h-2 bg-teal-500 rotate-45" />
            <span className="text-[11px] font-semibold text-teal-400 tracking-[0.3em] uppercase">Stakeholder Network</span>
            <div className="w-2 h-2 bg-teal-500 rotate-45" />
          </div>
          <h2 className="text-4xl font-bold text-white text-center mb-2">Ecosystem Overview</h2>
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-teal-500/50" />
            <Diamond className="h-3 w-3 text-teal-400" />
            <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-teal-500/50" />
          </div>
          <p className="text-sm text-slate-400 text-center mb-4">A unified platform serving 8 stakeholder types with role-specific dashboards</p>

          {/* Gear Schema - Rotating outer ring with static center logo */}
          <div className="relative w-[420px] h-[420px] mx-auto mb-4">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '30s' }}>
              {[
                { icon: Rocket, label: "Startups", color: "emerald", angle: 0 },
                { icon: Diamond, label: "Investors", color: "purple", angle: 45 },
                { icon: Lightbulb, label: "Mentors", color: "cyan", angle: 90 },
                { icon: Award, label: "Advisors", color: "amber", angle: 135 },
                { icon: GraduationCap, label: "Students", color: "rose", angle: 180 },
                { icon: Building2, label: "Accelerators", color: "teal", angle: 225 },
                { icon: Handshake, label: "Corporates", color: "purple", angle: 270 },
                { icon: Network, label: "Admins", color: "cyan", angle: 315 },
              ].map((member, i) => {
                const radius = 170;
                const rad = (member.angle * Math.PI) / 180;
                const x = 210 + radius * Math.cos(rad) - 36;
                const y = 210 + radius * Math.sin(rad) - 36;
                return (
                  <div
                    key={i}
                    className="absolute animate-spin"
                    style={{
                      left: x,
                      top: y,
                      width: 72,
                      height: 72,
                      animationDuration: '30s',
                      animationDirection: 'reverse',
                    }}
                  >
                    <div className={`tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm w-full h-full border-2 border-${member.color}-500/50 rounded-full flex flex-col items-center justify-center shadow-lg shadow-${member.color}-500/20`}
                    >
                      <member.icon className={`h-5 w-5 text-${member.color}-400 mb-1`} />
                      <span className={`text-[9px] font-bold text-${member.color}-400 leading-tight text-center`}>{member.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Connecting lines */}
            <div className="absolute inset-[60px] border-2 border-dashed border-teal-500/20 rounded-full" />
            <div className="absolute inset-[80px] border border-teal-500/10 rounded-full" />

            {/* Center logo - static */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="relative">
                <div className="absolute inset-[-12px] bg-teal-500/20 blur-2xl rounded-full" />
                <div className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm w-24 h-24 rounded-full border-2 flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <img src={sfhLogo} alt="SFH" className="w-16 h-16 object-contain" />
                </div>
              </div>
            </div>
          </div>

          <SectionDivider title="Startup Journey Roadmap" />

          {/* Timeline */}
          <div className="relative w-full mt-2">
            <div className="absolute top-[40px] left-[8%] right-[8%] h-[2px] z-0">
              <div className="w-full h-full bg-gradient-to-r from-amber-500/50 via-teal-500/70 via-purple-500/60 to-rose-500/50 rounded-full" />
            </div>
            <div className="grid grid-cols-6 gap-2.5 relative z-10">
              {[
                { icon: Lightbulb, label: "Idea", desc: "Validate concept & market need", color: "amber", step: "01" },
                { icon: Search, label: "Research", desc: "Analyze market & competitors", color: "cyan", step: "02" },
                { icon: Cpu, label: "MVP", desc: "Build minimum viable product", color: "teal", step: "03" },
                { icon: Target, label: "Validation", desc: "User testing & iteration", color: "purple", step: "04" },
                { icon: Rocket, label: "Launch", desc: "Go-to-market execution", color: "emerald", step: "05" },
                { icon: TrendingUp, label: "Growth", desc: "Scale operations & raise", color: "rose", step: "06" },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className={`text-[9px] font-bold text-${s.color}-400/80 tracking-widest mb-1`}>STEP {s.step}</span>
                  <div className="relative mb-1.5">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-${s.color}-500/30 to-${s.color}-600/20 border-2 border-${s.color}-500/50 flex items-center justify-center`}>
                      <s.icon className={`h-5 w-5 text-${s.color}-400`} />
                    </div>
                  </div>
                  <div className={`tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm border-${s.color}-500/20 rounded-lg p-2 text-center w-full`}>
                     <p className={`text-sm font-bold text-${s.color}-400 mb-0.5`}>{s.label}</p>
                     <p className="text-[11px] text-slate-400 leading-tight">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </PageContainer>

        {/* ===== PAGE 4: ALL PLATFORM FEATURES ===== */}
        <PageContainer>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 justify-center mb-2">
              <div className="w-2 h-2 bg-emerald-500 rotate-45" />
              <span className="text-[11px] font-semibold text-emerald-400 tracking-[0.3em] uppercase">Ecosystem Capabilities</span>
              <div className="w-2 h-2 bg-emerald-500 rotate-45" />
            </div>
            <h2 className="text-4xl font-bold text-white text-center mb-3">Platform Features</h2>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-500/60" />
              <Diamond className="h-3 w-3 text-emerald-400" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-emerald-500/60" />
            </div>

            <div className="grid grid-cols-3 gap-3 content-center">
              {[
                { icon: Cpu, label: "AI Strategies", desc: "Smart growth recommendations powered by ML. Analyzes stage, market position, and competition to generate actionable roadmaps.", color: "emerald" },
                { icon: BarChart3, label: "Business Intelligence", desc: "Real-time analytics with KPI tracking, performance benchmarks, and automated reporting for investors.", color: "cyan" },
                { icon: MapPin, label: "Resources Map", desc: "Global directory of 5,800+ partner locations, coworking spaces, and service providers with exclusive perks.", color: "teal" },
                { icon: Rocket, label: "Startup Journey", desc: "Guided execution from idea to scale. AI-generated milestones, task lists, and progress tracking at every stage.", color: "emerald" },
                { icon: Globe, label: "Global Hubs", desc: "Access to a network of physical locations across 130 countries in more than 5,800 locations.", color: "purple" },
                { icon: Network, label: "Matching System ", desc: "AI matching system that connects you with the right people to make your startups grow.", color: "amber" },
                { icon: Brain, label: "Intelligence Engine", desc: "Probabilistic modeling with Bayesian inference and Monte Carlo simulations to evaluate risk and forecast outcomes.", color: "rose" },
                { icon: Video, label: "Video Conference", desc: "Built-in video conferencing for mentor sessions, pitch practice, team meetings, and investor calls.", color: "cyan" },
                { icon: Calendar, label: "Events", desc: "Host and attend virtual/hybrid events, workshops, demo days, and networking sessions across the platform.", color: "teal" },
              ].map((f, i) => (
                <div key={i} className={`tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm border-${f.color}-500/40 rounded-lg p-4 flex flex-col shadow-lg shadow-${f.color}-500/10`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-md bg-${f.color}-500/20 border border-${f.color}-500/40 flex items-center justify-center shrink-0`}>
                      <f.icon className={`h-4 w-4 text-${f.color}-400`} />
                    </div>
                     <span className={`text-base font-bold text-${f.color}-400`}>{f.label}</span>
                   </div>
                   <p className="text-sm text-slate-400 leading-snug">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>

        {/* ===== PAGE 5: MEMBERSHIP TIERS ===== */}
        <PageContainer>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 justify-center mb-2">
              <div className="w-2 h-2 bg-amber-500 rotate-45" />
              <span className="text-[11px] font-semibold text-amber-400 tracking-[0.3em] uppercase">Flexible Plans for Every Stage</span>
              <div className="w-2 h-2 bg-amber-500 rotate-45" />
            </div>
            <h2 className="text-4xl font-bold text-white text-center mb-3">Membership Tiers</h2>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-500/60" />
              <Diamond className="h-3 w-3 text-amber-400" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-500/60" />
            </div>

            <div className="grid grid-cols-2 gap-4 content-center">
              {[
                { icon: Star, name: "Free", price: "$0", period: "forever", target: "Entry-level founders", color: "slate", features: ["Limited platform access", "Self-paced resources", "Community forums", "Monthly newsletter"] },
                { icon: Zap, name: "Community", price: "$350", period: "/month", target: "Early MVP-stage founders", color: "cyan", features: ["Full digital platform", "Virtual events & workshops", "Mentor interactions", "AI tools (limited)", "HUB coworking (1 country)"] },
                { icon: Building2, name: "Self-Paced + Office", price: "$550", period: "/month", target: "Founders needing workspace", color: "teal", popular: true, features: ["All Community features", "Local HUB coworking access", "Earth Intelligence data", "Eligible for Accelerated Tier"] },
                { icon: Crown, name: "Global Access", price: "$950", period: "/month", target: "Globally distributed teams", color: "purple", features: ["All platform features", "Global office (130+ countries)", "5,600+ coworking sites", "Mentor + event access", "Earth Intelligence data"] },
                { icon: Users, name: "Corporate", price: "$1,500", period: "/month", target: "Scale-ups & corporate ventures", color: "amber", features: ["All Global Access features", "Team dashboard & management", "Unlimited travel (11 countries)", "Soft Landing option ($5K)"] },
                { icon: Rocket, name: "In-Person Cohort", price: "No Fee", period: "selected startups", target: "Selected deep-tech startups", color: "emerald", features: ["All platform features", "Direct investor intros", "Demo day participation", "Full mentor network", "Priority deal flow"] },
              ].map((tier, i) => (
                <div key={i} className={`relative tech-card border-0 ring-1 ${tier.popular ? 'ring-teal-500/50 shadow-lg shadow-teal-500/20' : `ring-${tier.color}-500/30`} rounded-lg p-5 backdrop-blur-sm`}>
                  {tier.popular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-teal-500 text-[9px] font-bold text-slate-950 tracking-wider">RECOMMENDED</div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-md bg-${tier.color}-500/20 border border-${tier.color}-500/40 flex items-center justify-center`}>
                      <tier.icon className={`h-5 w-5 text-${tier.color}-400`} />
                    </div>
                    <div>
                       <span className={`text-lg font-bold text-${tier.color}-400 block leading-tight`}>{tier.name}</span>
                       <span className="text-xs text-slate-500">{tier.target}</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-2xl font-bold text-white">{tier.price}</span>
                    <span className="text-xs text-slate-500">{tier.period}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {tier.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                        <CheckCircle className={`h-4 w-4 text-${tier.color}-400 mt-0.5 shrink-0`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>

        {/* ===== PAGE 7: FEATURES BY ROLE ===== */}
        <PageContainer>
          <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 justify-center mb-2">
            <div className="w-2 h-2 bg-purple-500 rotate-45" />
            <span className="text-[11px] font-semibold text-purple-400 tracking-[0.3em] uppercase">Tailored Tools for Every Stakeholder</span>
            <div className="w-2 h-2 bg-purple-500 rotate-45" />
          </div>
          <h2 className="text-4xl font-bold text-white text-center mb-2">Features by Role</h2>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-purple-500/50" />
            <Diamond className="h-3 w-3 text-purple-400" />
            <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-purple-500/50" />
          </div>

          <div className="grid grid-cols-2 gap-3 content-start">
            {[
              { title: "Investors", color: "purple", icon: Diamond, features: [
                { icon: TrendingUp, label: "Deal Flow Pipeline", desc: "Curated startup opportunities" },
                { icon: BarChart3, label: "Portfolio Dashboard", desc: "Track investments & returns" },
                { icon: Cpu, label: "Startup Analytics", desc: "AI-powered due diligence" },
                { icon: Search, label: "Due Diligence Tools", desc: "Automated company research" },
                { icon: Mail, label: "Direct Founder Access", desc: "Warm intros & messaging" },
              ]},
              { title: "Accelerators", color: "teal", icon: Building2, features: [
                { icon: Users, label: "Cohort Management", desc: "Track startups & progress" },
                { icon: Rocket, label: "Program Builder", desc: "Create structured programs" },
                { icon: BarChart3, label: "KPI Dashboards", desc: "Monitor cohort metrics" },
                { icon: Lightbulb, label: "Mentor Assignment", desc: "Match mentors to startups" },
                { icon: Award, label: "Demo Day Tools", desc: "Organize pitch events" },
              ]},
              { title: "Mentors / Advisors", color: "cyan", icon: Lightbulb, features: [
                { icon: Calendar, label: "Session Scheduling", desc: "Booking & availability" },
                { icon: Users, label: "Mentee Matching", desc: "AI-powered matching" },
                { icon: Target, label: "Goal Tracking", desc: "Set & monitor objectives" },
                { icon: Star, label: "Feedback System", desc: "Structured reviews" },
                { icon: Globe, label: "Knowledge Sharing", desc: "Publish guides & resources" },
              ]},
              { title: "Students", color: "amber", icon: GraduationCap, features: [
                { icon: Rocket, label: "Learning Paths", desc: "Structured curriculum" },
                { icon: Cpu, label: "Project Practice", desc: "Real-world startup projects" },
                { icon: Lightbulb, label: "Mentor Access", desc: "1-on-1 guidance" },
                { icon: Users, label: "Community Forums", desc: "Peer collaboration" },
                { icon: Award, label: "Certifications", desc: "Earn credentials" },
              ]},
            ].map((role, i) => (
              <div key={i} className={`tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm border-${role.color}-500/40 rounded-xl p-3 shadow-lg shadow-${role.color}-500/10`}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-${role.color}-500/20 border border-${role.color}-500/40 flex items-center justify-center`}>
                    <role.icon className={`h-4 w-4 text-${role.color}-400`} />
                  </div>
                  <span className={`text-base font-bold text-${role.color}-400`}>{role.title}</span>
                </div>
                <ul className="space-y-1">
                  {role.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <f.icon className={`h-3.5 w-3.5 text-${role.color}-400 mt-0.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                         <span className="text-[12px] font-semibold text-slate-200 block leading-tight">{f.label}</span>
                         <span className="text-[10.5px] text-slate-400 leading-snug">{f.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Startups - full width horizontal at the end */}
          {(() => {
            const startups = { title: "Startups", color: "emerald", icon: Rocket, features: [
              { icon: Rocket, label: "Startup Journey Tracker", desc: "Idea → MVP → Launch → Scale" },
              { icon: Brain, label: "AI Strategy Generator", desc: "Personalized growth roadmaps" },
              { icon: BarChart3, label: "KPI & Metrics Dashboard", desc: "Revenue, users, runway tracking" },
              { icon: Users, label: "Mentor Matching", desc: "AI-paired expert advisors" },
              { icon: Diamond, label: "Investor Connect", desc: "Pitch deck builder & intros" },
              { icon: Building2, label: "Co-Founder Finder", desc: "Match by skills & vision" },
              { icon: DollarSign, label: "Fundraising Tools", desc: "Cap table, data room, terms" },
              { icon: Cpu, label: "Tech Resources", desc: "Cloud credits, APIs, dev tools" },
              { icon: Calendar, label: "Cohort Programs", desc: "Apply to global accelerators" },
              { icon: Globe, label: "Global Hub Access", desc: "Coworking in 130+ countries" },
            ]};
            return (
              <div className={`tech-card border-0 ring-1 ring-emerald-500/40 backdrop-blur-sm rounded-xl p-3 mt-3 shadow-lg shadow-emerald-500/10`}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center`}>
                    <startups.icon className={`h-4 w-4 text-emerald-400`} />
                  </div>
                  <span className={`text-base font-bold text-emerald-400`}>{startups.title}</span>
                </div>
                <ul className="grid grid-cols-5 gap-x-3 gap-y-1.5">
                  {startups.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-1.5">
                      <f.icon className={`h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                         <span className="text-[11px] font-semibold text-slate-200 block leading-tight">{f.label}</span>
                         <span className="text-[9.5px] text-slate-400 leading-snug">{f.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
          </div>
        </PageContainer>

        {/* ===== PAGE 7b: STRATEGIC PARTNER MAPPING ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg z-[1]" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[94%] mx-auto flex-1 flex flex-col">
              <div className="flex items-center gap-2 justify-center mb-1.5 mt-1">
                <div className="w-2 h-2 bg-purple-500 rotate-45" />
                <span className="text-[11px] font-semibold text-purple-400 tracking-[0.3em] uppercase">Strategic Partner Mapping</span>
                <div className="w-2 h-2 bg-purple-500 rotate-45" />
              </div>
              <h2 className="text-3xl font-bold text-white text-center mb-1">Partnership Models</h2>
              <p className="text-sm text-slate-400 text-center mb-3">How each partner type plugs into the Startup Factory Hub ecosystem</p>

              <div className="flex-1 min-h-[480px]">
                {(() => {
                  const partners = [
                    {
                      title: "Corporate Partners",
                      icon: Building2,
                      color: "teal",
                      tag: "Anchor",
                      points: [
                        "Lead innovation aligned with internal R&D and long-term strategy.",
                        "Operate as ecosystem anchors sourcing high-impact startups.",
                      ],
                    },
                    {
                      title: "Technology Partners",
                      icon: Cpu,
                      color: "cyan",
                      tag: "Build",
                      points: [
                        "Integrate platforms and infrastructure into the ecosystem.",
                        "Drive adoption through real-world startup use cases.",
                      ],
                    },
                    {
                      title: "Institutional & Government",
                      icon: Globe,
                      color: "amber",
                      tag: "Activate",
                      points: [
                        "Activate pipelines for economic development and tech commercialization.",
                        "Engage with ventures aligned to national & regional priorities.",
                      ],
                    },
                    {
                      title: "Investment Partners",
                      icon: Diamond,
                      color: "purple",
                      tag: "Fund",
                      points: [
                        "Access curated, intelligence-driven deal flow.",
                        "Reduce sourcing friction with structured ecosystem insights.",
                      ],
                    },
                  ];
                  const colorMap: Record<string, { bg: string; border: string; icon: string; title: string; dot: string; tag: string; accent: string }> = {
                    teal: { bg: "from-teal-500/15 via-slate-900/80 to-slate-950", border: "border-teal-400/50", icon: "text-teal-300", title: "text-teal-200", dot: "bg-teal-400", tag: "bg-teal-500/20 text-teal-300 border-teal-400/40", accent: "bg-teal-400" },
                    purple: { bg: "from-purple-500/15 via-slate-900/80 to-slate-950", border: "border-purple-400/50", icon: "text-purple-300", title: "text-purple-200", dot: "bg-purple-400", tag: "bg-purple-500/20 text-purple-300 border-purple-400/40", accent: "bg-purple-400" },
                    cyan: { bg: "from-cyan-500/15 via-slate-900/80 to-slate-950", border: "border-cyan-400/50", icon: "text-cyan-300", title: "text-cyan-200", dot: "bg-cyan-400", tag: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40", accent: "bg-cyan-400" },
                    amber: { bg: "from-amber-500/15 via-slate-900/80 to-slate-950", border: "border-amber-400/50", icon: "text-amber-300", title: "text-amber-200", dot: "bg-amber-400", tag: "bg-amber-500/20 text-amber-300 border-amber-400/40", accent: "bg-amber-400" },
                  };

                  // Mosaic: asymmetric grid — tall, wide, square tiles arranged like a magazine layout
                  // Grid: 6 cols × 2 rows
                  // [Corporate (tall 3×2)] [Tech (wide 3×1)]
                  //                        [Inst (3×1)]
                  // Then second row: [Investment (wide 3×1)] [Tech bottom]
                  // Simpler: grid-cols-6 grid-rows-6, each card spans different cells
                  const layouts = [
                    "col-span-3 row-span-4", // Corporate — tall hero
                    "col-span-3 row-span-2", // Technology — wide top right
                    "col-span-2 row-span-2", // Institutional — bottom left
                    "col-span-4 row-span-2", // Investment — wide bottom right
                  ];

                  return (
                    <div className="grid grid-cols-6 grid-rows-6 gap-2.5 h-full min-h-[480px]">
                      {partners.map((p, i) => {
                        const c = colorMap[p.color];
                        const Icon = p.icon;
                        return (
                          <div
                            key={i}
                            className={`${layouts[i]} relative rounded-xl border ${c.border} bg-gradient-to-br ${c.bg} overflow-hidden group`}
                          >
                            {/* Accent corner stripe */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${c.accent}`} />
                            <div className={`absolute top-0 left-0 h-1 w-16 ${c.accent} opacity-60`} />

                            {/* Tag chip */}
                            <span className={`absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${c.tag}`}>
                              {p.tag}
                            </span>

                            <div className="relative h-full flex flex-col p-4 pl-5">
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className={`w-10 h-10 rounded-lg bg-slate-900/60 ${c.border} border flex items-center justify-center shrink-0`}>
                                  <Icon className={`w-5 h-5 ${c.icon}`} />
                                </div>
                                <h3 className={`text-[15px] font-bold ${c.title} leading-tight`}>{p.title}</h3>
                              </div>
                              <ul className="space-y-2 flex-1">
                                {p.points.map((pt, j) => (
                                  <li key={j} className="flex items-start gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${c.dot} mt-1.5 shrink-0`} />
                                    <span className="text-[12.5px] text-slate-200 leading-relaxed">{pt}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Decorative corner glyph */}
                            <div className={`absolute bottom-2 right-2 w-8 h-8 rounded-full border ${c.border} opacity-30`} />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* University Partners — full width emphasis */}
              <div className="mt-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/15 to-emerald-500/10 border border-emerald-500/40 rounded-lg p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-11 h-11 rounded-md bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-[17px] font-bold text-emerald-300">University Partners</h3>
                  <span className="ml-auto text-[10px] uppercase tracking-widest text-emerald-400/80 font-semibold">Certified Innovation Nodes</span>
                </div>
                <p className="text-[14px] text-slate-200 leading-relaxed mb-2.5">
                  Connect directly with high-potential startups and emerging technologies. Position as certified innovation nodes within the Startup Factory Hub ecosystem.
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    "Access to top-tier startups and venture opportunities",
                    "Integration into real-world accelerator and commercialization pipelines",
                    "Official Startup Factory Hub certifications for programs, talent, and innovation initiatives",
                    "Bridge research, talent, and market execution",
                  ].map((pt, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span className="text-[13.5px] text-slate-200 leading-relaxed">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </A4Wrapper>

        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg z-[1]" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[92%] mx-auto flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
                <span className="text-[11px] font-semibold text-teal-400 tracking-[0.3em] uppercase">Strategic Network</span>
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
              </div>
               <h2 className="text-4xl font-bold text-white text-center mb-1">Our Partners & Network</h2>
               <p className="text-sm text-slate-300 text-center mb-4">Backed by industry leaders and innovators shaping the future</p>

              <div className="grid grid-cols-5 gap-2.5 w-full mb-4">
                {[
                  { name: "NASA", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/200px-NASA_logo.svg.png" },
                  { name: "Google", logo: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" },
                  { name: "HSBC", logo: "/partners/hsbc-logo.png" },
                  { name: "Nasdaq", logo: "/nasdaq-logo.png" },
                  { name: "GitHub", logo: "/github-logo.png" },
                  { name: "TradingView", logo: "/partners/tradingview-logo.png" },
                  { name: "MongoDB", logo: "/mongodb-logo.webp" },
                  { name: "NVIDIA", logo: "https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/02-nvidia-logo-color-grn-500x200-4c25-p.png" },
                  { name: "F6S", logo: "/partners/f6s-logo.png" },
                  { name: "Flippa", logo: "/partners/flippa-logo.png" },
                  { name: "IWG", logo: "/partners/iwg-logo.png" },
                  { name: "Regus", logo: "/partners/regus-logo.png" },
                  { name: "Advantary", logo: "/partners/advantary-logo.jpg" },
                  { name: "Lovable", logo: "/partners/lovable-logo.png" },
                  { name: "Lehigh Univ", logo: "/lehigh-university-logo.png" },
                  { name: "HubSpot", logo: "https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png" },
                  { name: "Datadog", logo: "https://imgix.datadoghq.com/img/dd_logo_n_70x75.png" },
                  { name: "LivePlan", logo: "/partners/liveplan-logo.png" },
                  { name: "Decahedron", logo: "/partners/decahedron-ventures-logo.jpg" },
                  { name: "Flusso", logo: "/partners/flusso-capital-logo.png" },
                  { name: "UK Venture", logo: "/partners/uk-venture-logo.jpg" },
                  { name: "Ducere", logo: "/partners/ducere-logo.png" },
                  { name: "HackerEarth", logo: "/partners/hackerearth-logo.png" },
                  { name: "Orlandopreneur", logo: "/partners/orlandopreneur-logo.png" },
                  { name: "Incostas", logo: "/partners/incostas-logo.png" },
                  { name: "LOT Network", logo: "/partners/lotnetwork-logo.png" },
                  { name: "Nouel", logo: "/partners/nouel-logo.png" },
                  { name: "PitchPerfecter", logo: "/partners/pitchperfecter-logo.png" },
                  { name: "WorkingAdvantage", logo: "/working-advantage-logo.png" },
                  { name: "More+", logo: "" },
                ].map((p, i) => (
                  <div key={i} className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm rounded-lg p-3 flex items-center justify-center h-24 hover: transition-colors">
                    {p.logo ? (
                      <img src={p.logo} alt={p.name} className="max-h-16 max-w-[120px] object-contain filter brightness-90" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.parentElement!.innerHTML = `<span class="text-sm text-slate-500 font-medium">${p.name}</span>`; }} />
                    ) : (
                      <span className="text-[12px] text-teal-400 font-bold">+More</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {["Technology", "Investment", "Academic", "Marketplace", "Legal", "Community"].map((c, i) => (
                  <span key={i} className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm px-3 py-1 text-sm font-medium rounded-full text-teal-400/80">{c}</span>
                ))}
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== PAGE 8: TRACK RECORD & EVENTS ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[92%] mx-auto flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 justify-center mb-2">
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
                <span className="text-[11px] font-semibold text-teal-400 tracking-[0.3em] uppercase">Track Record</span>
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
              </div>
               <h2 className="text-4xl font-bold text-white text-center mb-1">Events & Collaborations</h2>
               <p className="text-sm text-slate-300 text-center mb-4">Strategic partnerships with NASA and the Orlando entrepreneurial ecosystem</p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Event 1: NASA TTP at KSC */}
                <div className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent z-[1]" />
                  
                  <div className="relative z-[2] p-4 flex flex-col min-h-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={nasaTTPLogo} alt="NASA TTP" className="h-6 w-auto object-contain" />
                    </div>
                     <h3 className="text-base font-bold text-teal-400 mb-1 leading-tight">Accelerating Research & Technology Development</h3>
                     <p className="text-sm text-slate-400 leading-relaxed flex-1">
                       Partnership with NASA Technology Transfer Program at Kennedy Space Center to bridge space technology with commercial applications.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Telescope className="h-3 w-3 text-teal-400" />
                      <span className="text-[9px] text-teal-400/80 font-semibold tracking-wider">NASA TTP / KSC</span>
                    </div>
                  </div>
                </div>

                {/* Event 2: Hot Deals in Space */}
                <div className="tech-card border-0 ring-1 ring-emerald-500/30 backdrop-blur-sm relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent z-[1]" />
                  
                  <div className="relative z-[2] p-4 flex flex-col min-h-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={nasaLogo} alt="NASA" className="h-6 w-auto object-contain" />
                    </div>
                     <h3 className="text-base font-bold text-emerald-400 mb-1 leading-tight">Hot Deals in Space</h3>
                     <p className="text-sm text-slate-400 leading-relaxed flex-1">
                       Flagship event connecting startups with NASA technologies, space industry leaders, and venture capital in the space economy.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Star className="h-3 w-3 text-emerald-400" />
                      <span className="text-[9px] text-emerald-400/80 font-semibold tracking-wider">NASA TTP EVENT</span>
                    </div>
                  </div>
                </div>

                {/* Event 3: Artemis II Watch Party */}
                <div className="tech-card border-0 ring-1 ring-cyan-500/30 backdrop-blur-sm relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent z-[1]" />
                  
                  <div className="relative z-[2] p-4 flex flex-col min-h-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={nasaLogo} alt="NASA" className="h-5 w-auto object-contain" />
                      <div className="tech-card border-0 ring-1 ring-cyan-500/30 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 text-red-500" />
                        <span className="text-[8px] text-cyan-400 font-semibold tracking-wider">LIVE</span>
                      </div>
                    </div>
                     <h3 className="text-base font-bold text-cyan-400 mb-1 leading-tight">Artemis II Online Watch Party</h3>
                     <p className="text-sm text-slate-400 leading-relaxed flex-1">
                       Official community watch party for NASA's Artemis II mission — humanity's return to the Moon.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Globe className="h-3 w-3 text-cyan-400" />
                      <span className="text-[9px] text-cyan-400/80 font-semibold tracking-wider">OFFICIAL HOST</span>
                    </div>
                  </div>
                </div>

                {/* Event 4: Orlandopreneur */}
                <div className="tech-card border-0 ring-1 ring-amber-500/30 backdrop-blur-sm relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-950/40 z-[1]" />
                  <div className="relative z-[2] p-4 flex flex-col min-h-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <img src="/partners/orlandopreneur-logo.png" alt="Orlandopreneur" className="h-6 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                     <h3 className="text-base font-bold text-amber-400 mb-1 leading-tight">Orlandopreneur Collaboration</h3>
                     <p className="text-sm text-slate-400 leading-relaxed flex-1">
                       Strategic partnership with Orlando's premier entrepreneurial community, co-hosting events and connecting local founders.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Handshake className="h-3 w-3 text-amber-400" />
                      <span className="text-[9px] text-amber-400/80 font-semibold tracking-wider">COMMUNITY PARTNER</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming event - full width */}
              <div className="tech-card border-0 ring-1 ring-purple-500/30 backdrop-blur-sm relative overflow-hidden rounded-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40 z-[1]" />
                <div className="relative z-[2] p-3 flex items-center gap-4">
                  <div className="bg-purple-500/20 border border-purple-500/40 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] text-purple-400 font-bold tracking-wider">UPCOMING</span>
                  </div>
                  <div className="flex-1">
                     <h3 className="text-base font-bold text-purple-400 mb-0.5">Space Symposium — Times Square XR Experience</h3>
                     <p className="text-sm text-slate-400 leading-relaxed">
                       Featured immersive XR experience at Times Square showcasing space technology innovation.
                    </p>
                  </div>
                  <Smartphone className="h-6 w-6 text-purple-400 shrink-0" />
                </div>
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== PAGE 9: NASDAQ TOWER FEATURE ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[4%] overflow-hidden">
            <img src={nasdaqFeature} alt="Startup Factory Hub on NASDAQ Tower" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-slate-950/95 backdrop-blur-[2px]" />
            <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg z-[1]" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/15 border border-teal-500/30 rounded-full mb-6">
                <Star className="h-3.5 w-3.5 text-teal-400" />
                <span className="text-[11px] font-semibold text-teal-400 tracking-[0.3em] uppercase">As Featured In</span>
                <Star className="h-3.5 w-3.5 text-teal-400" />
              </div>
              <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
                Featured on the{' '}
                <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  NASDAQ Tower
                </span>
              </h2>
              <p className="text-lg text-slate-200 mb-4 font-medium">
                Times Square, New York City
              </p>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Startup Factory Hub was showcased on the iconic NASDAQ Tower in the heart of Times Square — a testament to our growing impact on the global innovation ecosystem and recognition as a leading platform empowering startups worldwide.
              </p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-400" />
                <span className="text-sm text-slate-400">One Times Square, Manhattan, NYC</span>
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== PAGE 10: HOW TO PARTNER ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg z-[1]" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />

            <div className="relative z-10 flex flex-col h-full">
              <div className="text-center mb-6 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-[11px] font-semibold text-teal-400 tracking-[0.3em] uppercase mb-4">
                  <Handshake className="w-3.5 h-3.5" /> Partnership Models
                </span>
                <h2 className="text-4xl font-bold text-white mt-3">
                  How to{' '}
                  <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                    Partner With Us
                  </span>
                </h2>
                <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                  Join our ecosystem and help shape the future of innovation across the globe.
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="relative max-w-3xl mx-auto w-full">
                  {/* Vertical center spine */}
                  <div className="absolute left-1/2 top-2 bottom-2 w-px bg-gradient-to-b from-teal-500/0 via-teal-500/60 to-teal-500/0 -translate-x-1/2" />

                  {[
                    {
                      icon: Globe,
                      color: "teal",
                      title: "Strategic Partner",
                      desc: "Leverage your market expertise, local network, and industry knowledge to co-develop programs and co-invest in high-potential startups within the ecosystem.",
                      tags: ["Market Access", "Co-Investment", "Local Networks"],
                    },
                    {
                      icon: Rocket,
                      color: "purple",
                      title: "Accelerator Partner",
                      desc: "Launch co-branded cohorts using our white-label program management tools. Access deal flow, mentors, and curriculum resources to run world-class accelerators.",
                      tags: ["Co-Branded Cohorts", "White-Label", "Curriculum"],
                    },
                    {
                      icon: TrendingUp,
                      color: "amber",
                      title: "Investment Partner",
                      desc: "Gain exclusive access to curated deal flow from our portfolio startups. Co-invest alongside our network of angels and VCs with full due diligence support.",
                      tags: ["Deal Flow", "Co-Investing", "Due Diligence"],
                    },
                    {
                      icon: Users,
                      color: "cyan",
                      title: "Community Partner",
                      desc: "Host events, provide mentors, and expand the ecosystem. Community partners help create vibrant local chapters and bring diverse perspectives to our startups.",
                      tags: ["Events", "Mentorship", "Local Chapters"],
                    },
                  ].map((p, i) => {
                    const palette: Record<string, { ring: string; text: string; bg: string; tagBg: string; tagBorder: string; gradient: string }> = {
                      teal: { ring: "ring-teal-500/40", text: "text-teal-400", bg: "from-teal-500/15 to-emerald-500/15", tagBg: "bg-teal-500/10 text-teal-400", tagBorder: "border-teal-500/20", gradient: "from-teal-500 to-emerald-500" },
                      purple: { ring: "ring-purple-500/40", text: "text-purple-400", bg: "from-purple-500/15 to-pink-500/15", tagBg: "bg-purple-500/10 text-purple-400", tagBorder: "border-purple-500/20", gradient: "from-purple-500 to-pink-500" },
                      amber: { ring: "ring-amber-500/40", text: "text-amber-400", bg: "from-amber-500/15 to-orange-500/15", tagBg: "bg-amber-500/10 text-amber-400", tagBorder: "border-amber-500/20", gradient: "from-amber-500 to-orange-500" },
                      cyan: { ring: "ring-cyan-500/40", text: "text-cyan-400", bg: "from-cyan-500/15 to-blue-500/15", tagBg: "bg-cyan-500/10 text-cyan-400", tagBorder: "border-cyan-500/20", gradient: "from-cyan-500 to-blue-500" },
                    };
                    const c = palette[p.color];
                    const Icon = p.icon;
                    const isLeft = i % 2 === 0;
                    return (
                      <div key={i} className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-3 last:mb-0">
                        {/* Left side */}
                        <div className={isLeft ? "block" : "invisible"}>
                          {isLeft && (
                            <div className={`tech-card border-0 ring-1 ${c.ring} backdrop-blur-sm rounded-xl p-3.5 text-right`}>
                              <div className="flex items-center gap-2 mb-1.5 justify-end">
                                <h3 className="text-base font-bold text-white">{p.title}</h3>
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.bg} flex items-center justify-center`}>
                                  <Icon className={`w-4 h-4 ${c.text}`} />
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed mb-2">{p.desc}</p>
                              <div className="flex flex-wrap gap-1 justify-end">
                                {p.tags.map((t) => (
                                  <span key={t} className={`text-[8.5px] px-1.5 py-0.5 rounded-full ${c.tagBg} border ${c.tagBorder}`}>{t}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Center node */}
                        <div className="relative z-10 flex items-center justify-center">
                          <div className={`w-10 h-10 rotate-45 bg-gradient-to-br ${c.gradient} rounded-md shadow-lg flex items-center justify-center ring-2 ring-slate-900`}>
                            <span className="-rotate-45 text-white font-bold text-sm">{i + 1}</span>
                          </div>
                        </div>

                        {/* Right side */}
                        <div className={!isLeft ? "block" : "invisible"}>
                          {!isLeft && (
                            <div className={`tech-card border-0 ring-1 ${c.ring} backdrop-blur-sm rounded-xl p-3.5`}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.bg} flex items-center justify-center`}>
                                  <Icon className={`w-4 h-4 ${c.text}`} />
                                </div>
                                <h3 className="text-base font-bold text-white">{p.title}</h3>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed mb-2">{p.desc}</p>
                              <div className="flex flex-wrap gap-1">
                                {p.tags.map((t) => (
                                  <span key={t} className={`text-[8.5px] px-1.5 py-0.5 rounded-full ${c.tagBg} border ${c.tagBorder}`}>{t}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-center mt-4">
                <p className="text-sm text-slate-400">
                  Ready to partner? Reach out at{' '}
                  <span className="text-teal-400 font-semibold">contact@startupfactoryhub.com</span>
                </p>
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== PAGE 10b: STRATEGIC BENEFITS ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg z-[1]" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />

            <div className="relative z-10 flex flex-col h-full">
              <div className="text-center mb-3 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-[11px] font-semibold text-teal-400 tracking-[0.3em] uppercase mb-2">
                  <Crown className="w-4 h-4" /> Partner Value
                </span>
                <h2 className="text-4xl font-bold text-white mt-2">
                  Strategic{' '}
                  <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                    Benefits
                  </span>
                </h2>
                <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
                  What partners gain by joining the Startup Factory Hub ecosystem.
                </p>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      icon: Crown,
                      color: "teal",
                      title: "Ecosystem Leadership & Ownership",
                      points: [
                        "Operate as a Managing Partner of your own innovation ecosystem",
                        "Architect and shape the future of your industry, region, or vertical",
                        "Build and control a network of startups, corporations, investors, and institutions aligned with your strategy"
                      ]
                    },
                    {
                      icon: Network,
                      color: "cyan",
                      title: "Connected Ecosystem Access",
                      points: [
                        "Direct access to a global network of ecosystem nodes",
                        "Engage with startups, corporate partners, investors, and live opportunities",
                        "Curated events, deal flow sessions, and strategic collaborations"
                      ]
                    },
                    {
                      icon: Brain,
                      color: "purple",
                      title: "AI-Powered Business Intelligence",
                      points: [
                        "Real-time insights into startups, technologies, and market trends",
                        "Structured data to support investment, partnership, and innovation decisions",
                        "Visibility across the full ecosystem: performance, opportunities, alignment"
                      ]
                    },
                    {
                      icon: TrendingUp,
                      color: "amber",
                      title: "Direct Access to Deal Flow",
                      points: [
                        "Vetted startups across AI, space, deep tech, and software",
                        "Investment-ready, high-potential opportunities aligned with your focus areas"
                      ]
                    },
                    {
                      icon: Lightbulb,
                      color: "emerald",
                      title: "Early Access to Innovation",
                      points: [
                        "Technologies emerging from advanced research and specialized ecosystems",
                        "Opportunities before broad market exposure or competitive saturation"
                      ]
                    },
                    {
                      icon: Handshake,
                      color: "rose",
                      title: "Strategic Collaboration & Execution",
                      points: [
                        "Pilot programs and co-development pathways with startups",
                        "Direct engagement with founders, operators, and technical teams",
                        "Ongoing execution support beyond initial introductions"
                      ]
                    },
                    {
                      icon: Globe,
                      color: "blue",
                      title: "Be Part of a Globally Recognized Network",
                      points: [
                        "Position as a leader within a high-growth innovation network",
                        "Connect with global ecosystem nodes across industries and regions",
                        "Gain visibility and credibility through network association"
                      ]
                    },
                    {
                      icon: Rocket,
                      color: "orange",
                      title: "Shape the Future of Innovation",
                      points: [
                        "Align with next-generation technologies and venture creation",
                        "Influence the direction of emerging ecosystems and industry trends",
                        "Co-create the standards of tomorrow's tech landscape"
                      ]
                    },
                  ].map((b, i) => {
                    const colorMap: Record<string, { border: string; bg: string; icon: string; dot: string }> = {
                      teal: { border: "border-teal-500/30 hover:border-teal-500/60", bg: "from-teal-500/15 to-emerald-500/15", icon: "text-teal-400", dot: "bg-teal-400" },
                      cyan: { border: "border-cyan-500/30 hover:border-cyan-500/60", bg: "from-cyan-500/15 to-blue-500/15", icon: "text-cyan-400", dot: "bg-cyan-400" },
                      purple: { border: "border-purple-500/30 hover:border-purple-500/60", bg: "from-purple-500/15 to-pink-500/15", icon: "text-purple-400", dot: "bg-purple-400" },
                      amber: { border: "border-amber-500/30 hover:border-amber-500/60", bg: "from-amber-500/15 to-orange-500/15", icon: "text-amber-400", dot: "bg-amber-400" },
                      emerald: { border: "border-emerald-500/30 hover:border-emerald-500/60", bg: "from-emerald-500/15 to-teal-500/15", icon: "text-emerald-400", dot: "bg-emerald-400" },
                      rose: { border: "border-rose-500/30 hover:border-rose-500/60", bg: "from-rose-500/15 to-pink-500/15", icon: "text-rose-400", dot: "bg-rose-400" },
                      blue: { border: "border-blue-500/30 hover:border-blue-500/60", bg: "from-blue-500/15 to-cyan-500/15", icon: "text-blue-400", dot: "bg-blue-400" },
                      orange: { border: "border-orange-500/30 hover:border-orange-500/60", bg: "from-orange-500/15 to-amber-500/15", icon: "text-orange-400", dot: "bg-orange-400" },
                    };
                    const c = colorMap[b.color];
                    const Icon = b.icon;
                    return (
                      <div key={i} className={`tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm border ${c.border} rounded-lg p-4 flex flex-col transition-colors`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-md bg-gradient-to-br ${c.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${c.icon}`} />
                          </div>
                          <h3 className="text-base font-bold text-white leading-tight">{b.title}</h3>
                        </div>
                        <ul className="space-y-1.5 flex-1">
                          {b.points.map((p, j) => (
                            <li key={j} className="flex items-start gap-2">
                              <div className={`w-1.5 h-1.5 ${c.dot} rounded-full mt-2 flex-shrink-0`} />
                              <span className="text-sm text-slate-200 leading-relaxed">{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== PAGE 11: CONTACT / CTA ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[4%] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg z-[1]" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
                <span className="text-[11px] font-semibold text-teal-400 tracking-[0.3em] uppercase">Get Involved</span>
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
              </div>
               <h2 className="text-4xl font-bold text-white mb-2">Join Our Mission</h2>
               <p className="text-sm text-slate-300 mb-4">Let's Build the Future Together</p>
               <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                 We're looking for partners, investors, and innovators who share our vision of democratizing access to startup success worldwide.
               </p>

               <a href="mailto:contact@startupfactoryhub.com" className="tech-card border-0 ring-1 ring-teal-500/30 backdrop-blur-sm inline-flex items-center gap-3 border-2 rounded-xl px-6 py-4 hover: transition-colors mb-6">
                 <Mail className="h-5 w-5 text-teal-400" />
                 <span className="text-sm text-slate-200 font-medium">contact@startupfactoryhub.com</span>
              </a>

              <div className="relative mb-4">
                <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full scale-150" />
                <img src={sfhLogo} alt="SFH" className="relative w-24 h-24 object-contain" />
              </div>

              <div className="flex items-center gap-3 mb-3">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                 <span className="text-sm text-slate-400">Orlando | Santiago | Tokyo | Sevilla</span>
               </div>

               <p className="text-sm text-slate-500">startupfactoryhub.com</p>
            </div>
          </section>
        </A4Wrapper>
      </div>
    </div>
  );
}
