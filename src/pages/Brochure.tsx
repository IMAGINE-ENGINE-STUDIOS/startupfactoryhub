import { useState, useRef, useEffect, useCallback } from 'react';
import { Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail, Printer, Search, Network, BarChart3, GraduationCap, Building2, Diamond, Cpu, DollarSign, Handshake, MapPin, Smartphone, Loader2, Calendar, Telescope, Radio, Star, Brain, Video, Zap, Crown, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import sfhLogo from '@/assets/sfh-logo-sphere.png';
import rocketLaunchBg from '@/assets/rocket-launch-bg.jpg';
import astronautBg from '@/assets/astronaut-bg.jpg';
import moonEarthBg from '@/assets/moon-earth.jpg';
import jupiterBg from '@/assets/jupiter-bg.jpg';
import nebulaBg from '@/assets/nebula-bg.jpg';
import artemisBg from '@/assets/artemis-banner-bg.webp';
import spaceEventBg from '@/assets/space-event-bg.png';
import nasaTTPLogo from '@/assets/nasa-tech-transfer.webp';
import nasaLogo from '@/assets/nasa-logo.png';

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
  const glowClasses: Record<string, string> = {
    teal: "border-teal-500/40 shadow-teal-500/10",
    cyan: "border-cyan-500/40 shadow-cyan-500/10",
    purple: "border-purple-500/40 shadow-purple-500/10",
    emerald: "border-emerald-500/40 shadow-emerald-500/10",
    amber: "border-amber-500/40 shadow-amber-500/10",
    rose: "border-rose-500/40 shadow-rose-500/10",
  };
  return (
    <div className={`relative bg-slate-900/80 border rounded-lg p-4 backdrop-blur-sm shadow-lg ${glowClasses[glowColor] || glowClasses.teal} ${className}`}>
      {children}
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
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-slate-950/95 backdrop-blur-sm border-b border-teal-500/30">
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
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[4%] overflow-hidden">
            <img src={rocketLaunchBg} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/92 via-slate-900/88 to-slate-950/92" />
            <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(20,184,166,0.02) 2px, rgba(20,184,166,0.02) 4px)' }} />
            <div className="absolute inset-[0.8%] border-2 border-teal-500/40 rounded-lg" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-teal-500/30 blur-3xl rounded-full" />
                <img src={sfhLogo} alt="SFH" className="relative w-36 h-36 object-contain" />
                <div className="absolute inset-[-20px] border border-dashed border-teal-500/40 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
              </div>
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Startup Factory Hub</h1>
              <p className="text-[12px] font-semibold bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-3">
                The Online Hybrid Accelerator Platform Powered by A.I.
              </p>
              <p className="text-[12px] text-slate-300 max-w-md leading-relaxed mb-4">
                A hybrid digital-physical execution platform with global locations, AI-driven workflows, and human expertise — enabling founders to build consistently from idea to scale.
              </p>
              <div className="flex items-center gap-3 mb-3">
                <Globe className="h-4 w-4 text-cyan-400" />
                <span className="text-[12px] font-semibold text-cyan-400">4 Global Hubs</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[12px] text-slate-400">Orlando  |  Santiago  |  Tokyo  |  Sevilla</span>
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== PAGE 2: THE PROBLEM ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
            <img src={moonEarthBg} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90" />
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
              <h2 className="text-3xl font-bold text-white text-center mb-2">The Problem</h2>
              <p className="text-[12px] text-center text-slate-300 mb-6 max-w-md mx-auto leading-relaxed">
                Startups don't fail due to lack of ideas — <span className="text-rose-400 font-semibold">they fail because execution breaks between stages.</span>
              </p>

              {/* Broken journey flow */}
              <div className="relative w-full mb-8">
                <div className="absolute top-[32px] left-[10%] right-[10%] h-0.5">
                  <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(244,63,94,0.4) 6px, rgba(244,63,94,0.4) 10px)' }} />
                </div>
                <div className="grid grid-cols-5 gap-4 relative">
                  {[
                    { icon: GraduationCap, label: "Education", active: true, color: "teal" },
                    { icon: Cpu, label: "Product", active: false, color: "slate" },
                    { icon: Target, label: "Market", active: false, color: "slate" },
                    { icon: DollarSign, label: "Revenue", active: false, color: "slate" },
                    { icon: TrendingUp, label: "Scale", active: false, color: "slate" },
                  ].map((s, i) => (
                    <div key={i} className={`flex flex-col items-center ${!s.active ? 'opacity-60' : ''}`}>
                      <div className={`w-12 h-12 rounded-full ${s.active ? 'bg-teal-500/20 border-2 border-teal-500/60' : 'bg-slate-800 border-2 border-rose-500/40 border-dashed'} flex items-center justify-center`}>
                        <s.icon className={`h-5 w-5 ${s.active ? 'text-teal-400' : 'text-slate-500'}`} />
                      </div>
                      <span className={`text-[12px] font-bold mt-1 ${s.active ? 'text-teal-400' : 'text-slate-500'}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <SectionDivider title="Core Gaps" />
              <div className="grid grid-cols-3 gap-4 w-full mb-4">
                {[
                  { icon: Network, num: "01", desc: "Fragmented tools & platforms with no unified workflow" },
                  { icon: Calendar, num: "02", desc: "No ongoing support once a program ends post-demo day" },
                  { icon: Users, num: "03", desc: "Limited access to experienced operators and mentors" },
                ].map((g, i) => (
                  <div key={i} className="bg-slate-900/60 border border-rose-500/30 rounded-lg p-3 text-center">
                    <span className="text-lg font-black text-rose-500/30">{g.num}</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center mx-auto my-1">
                      <g.icon className="h-4 w-4 text-rose-400" />
                    </div>
                    <p className="text-[12px] text-slate-400 leading-relaxed">{g.desc}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-[66%] mx-auto">
                {[
                  { icon: DollarSign, num: "04", desc: "Capital injection without execution support or guidance" },
                  { icon: TrendingUp, num: "05", desc: "Education programs disconnected from real revenue outcomes" },
                ].map((g, i) => (
                  <div key={i} className="bg-slate-900/60 border border-rose-500/30 rounded-lg p-3 text-center">
                    <span className="text-lg font-black text-rose-500/30">{g.num}</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center mx-auto my-1">
                      <g.icon className="h-4 w-4 text-rose-400" />
                    </div>
                    <p className="text-[12px] text-slate-400 leading-relaxed">{g.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== PAGE 3: THE SOLUTION ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
            <img src={astronautBg} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/92 via-slate-900/87 to-slate-950/92" />
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
              <h2 className="text-3xl font-bold text-white text-center mb-3">The Solution</h2>

              <div className="bg-slate-900/60 border border-teal-500/40 rounded-lg p-4 mb-5 backdrop-blur-sm">
                <p className="text-[12px] text-center text-slate-200 leading-relaxed">
                   <span className="text-teal-400 font-bold">We are not a 3-month program.</span> We are an <span className="text-cyan-400 font-semibold">AI-powered hybrid accelerator platform</span> — a permanent operating system that merges intelligent automation, physical hubs, mentorship, and capital access into one continuous execution engine.
                </p>
              </div>

              {/* 4 Pillars */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { icon: BarChart3, label: "A.I. Business Intelligence Engine", desc: "AI-powered analytics, probabilistic risk modeling, competitive analysis, and strategic recommendations that adapt in real-time to your startup's data.", color: "teal" },
                  { icon: GraduationCap, label: "Education", desc: "Structured learning paths with courses, certifications, and skill-building programs designed for founders at every stage of their journey.", color: "cyan" },
                  { icon: Globe, label: "Digital + Physical Hybrid", desc: "A seamless blend of online platform tools and 4 flagship physical hubs plus 5,800+ partner locations worldwide for in-person collaboration.", color: "purple" },
                  { icon: Network, label: "Integrated Ecosystem", desc: "AI-driven matching connects founders with mentors, corporate partners, investors, and resources in one unified, intelligent workflow.", color: "emerald" },
                ].map((p, i) => (
                  <div key={i} className={`bg-slate-900/60 border border-${p.color}-500/30 rounded-lg p-3 backdrop-blur-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg bg-${p.color}-500/20 border border-${p.color}-500/40 flex items-center justify-center shrink-0`}>
                        <p.icon className={`h-4 w-4 text-${p.color}-400`} />
                      </div>
                      <span className={`text-[12px] font-bold text-${p.color}-400 leading-tight`}>{p.label}</span>
                    </div>
                    <p className="text-[12px] text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>

              {/* 4 Mechanisms */}
              <SectionDivider title="Execution Mechanisms" />
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: Cpu, label: "Digital Infrastructure", desc: "AI-powered tools & full automation", color: "teal" },
                  { icon: Users, label: "Human Expertise", desc: "Mentors, advisors & global network", color: "cyan" },
                  { icon: Building2, label: "Corporate Partners", desc: "Strategic alliances & enterprise deals", color: "purple" },
                  { icon: DollarSign, label: "Capital Access", desc: "Investor network & funding pipeline", color: "emerald" },
                ].map((m, i) => (
                  <div key={i} className={`bg-slate-900/80 border border-${m.color}-500/40 rounded-lg p-2.5 backdrop-blur-sm text-center`}>
                    <div className={`w-8 h-8 rounded-lg bg-${m.color}-500/20 border border-${m.color}-500/40 flex items-center justify-center mx-auto mb-1.5`}>
                      <m.icon className={`h-4 w-4 text-${m.color}-400`} />
                    </div>
                    <h4 className={`text-[12px] font-bold text-${m.color}-400 mb-0.5`}>{m.label}</h4>
                    <p className="text-[12px] text-slate-400">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== PAGE 4: ALL PLATFORM FEATURES ===== */}
        <PageContainer>
          <div className="flex items-center gap-2 justify-center mb-1 mt-2">
            <IconBadge icon={Cpu} color="emerald" />
            <h2 className="text-2xl font-bold text-white">Platform Features</h2>
          </div>
          <p className="text-[12px] text-emerald-400 font-semibold text-center mb-3">All-in-One Startup Operating System</p>

          <div className="grid grid-cols-2 gap-2.5 flex-1 content-start">
            {[
              { icon: Cpu, label: "AI Strategies", desc: "Smart growth recommendations powered by machine learning. Analyzes your startup's stage, market position, and competitive landscape to generate actionable strategy roadmaps that adapt as your business evolves.", color: "emerald" },
              { icon: BarChart3, label: "Business Intelligence", desc: "Real-time analytics dashboards with market insights, KPI tracking, and performance benchmarks. Compare metrics against industry averages. Automated reporting for investors and stakeholders.", color: "cyan" },
              { icon: MapPin, label: "Resources Map", desc: "Interactive global directory of 5,800+ partner locations, coworking spaces, accelerators, and service providers. Filter by industry, location, and resource type. Exclusive perks for platform members.", color: "teal" },
              { icon: Rocket, label: "Startup Journey", desc: "Guided execution path from idea validation through market scale. AI-generated milestones, task lists, and progress tracking. Each stage unlocks relevant tools, mentors, and resources automatically.", color: "emerald" },
              { icon: Users, label: "Mentorship", desc: "AI-matched mentors and advisors with verified domain expertise. Structured engagement with scheduled sessions, goal tracking, and feedback loops. Access a global network of experienced operators.", color: "purple" },
              { icon: Diamond, label: "Investor Match", desc: "Smart investor matching based on industry, stage, ticket size, and thesis alignment. Integrated pitch preparation tools, data room management, and warm introduction workflows.", color: "amber" },
              { icon: Brain, label: "Intelligence Engine", desc: "Probabilistic startup modeling and AI reasoning engine. BayesForge applies Bayesian inference and Monte Carlo simulations to evaluate risk, forecast outcomes, and generate data-driven recommendations.", color: "rose" },
            ].map((f, i) => (
              <TechCard key={i} glowColor={f.color} className={`p-2.5 flex flex-col ${i === 6 ? 'col-span-2' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-md bg-${f.color}-500/20 border border-${f.color}-500/40 flex items-center justify-center shrink-0`}>
                    <f.icon className={`h-3.5 w-3.5 text-${f.color}-400`} />
                  </div>
                  <span className={`text-[12px] font-bold text-${f.color}-400`}>{f.label}</span>
                </div>
                <p className="text-[12px] text-slate-400 leading-snug">{f.desc}</p>
              </TechCard>
            ))}
          </div>
        </PageContainer>

        {/* ===== PAGE 6: USER PROFILES ===== */}
        <PageContainer>
          <div className="flex items-center gap-2 justify-center mb-1 mt-4">
            <IconBadge icon={Users} color="teal" />
            <h2 className="text-3xl font-bold text-white">Ecosystem Overview</h2>
          </div>
          <p className="text-sm text-slate-400 text-center mb-6">A unified platform serving 8 stakeholder types with role-specific dashboards</p>

          <div className="grid grid-cols-4 gap-2.5 mb-6">
            {[
              { icon: Rocket, label: "Startups", desc: "Build, launch, and scale with AI-guided tools", color: "emerald" },
              { icon: Diamond, label: "Investors", desc: "Discover deals, track portfolios, and connect", color: "purple" },
              { icon: Lightbulb, label: "Mentors", desc: "Share expertise and guide founders to success", color: "cyan" },
              { icon: Award, label: "Advisors", desc: "Provide strategic counsel to growing companies", color: "amber" },
              { icon: GraduationCap, label: "Students", desc: "Learn entrepreneurship through real projects", color: "rose" },
              { icon: Building2, label: "Accelerators", desc: "Manage cohorts, programs, and deal flow", color: "teal" },
              { icon: Handshake, label: "Corporates", desc: "Access innovation and strategic partnerships", color: "purple" },
              { icon: Network, label: "Admins", desc: "Oversee the platform and manage operations", color: "cyan" },
            ].map((u, i) => (
              <div key={i} className={`bg-slate-900/60 border border-${u.color}-500/30 rounded-lg p-2.5 text-center`}>
                <div className={`w-8 h-8 rounded-lg bg-${u.color}-500/20 flex items-center justify-center mx-auto mb-1.5`}>
                  <u.icon className={`h-4 w-4 text-${u.color}-400`} />
                </div>
                <span className={`text-[12px] font-bold text-${u.color}-400 block mb-0.5`}>{u.label}</span>
                <p className="text-[12px] text-slate-400 leading-tight">{u.desc}</p>
              </div>
            ))}
          </div>

          <SectionDivider title="Startup Journey Roadmap" />

          {/* Timeline */}
          <div className="relative w-full mt-2 flex-1">
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
                  <div className={`bg-slate-900/70 border border-${s.color}-500/20 rounded-lg p-2 text-center w-full`}>
                    <p className={`text-[12px] font-bold text-${s.color}-400 mb-0.5`}>{s.label}</p>
                    <p className="text-[12px] text-slate-400 leading-tight">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>

        {/* ===== PAGE 7: PARTNERS & NETWORK ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
            <img src={jupiterBg} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-slate-950/78" />
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
              <h2 className="text-3xl font-bold text-white text-center mb-1">Our Partners & Network</h2>
              <p className="text-[12px] text-slate-300 text-center mb-4">Backed by industry leaders and innovators shaping the future</p>

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
                  <div key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3 flex items-center justify-center h-20 hover:border-teal-500/40 transition-colors">
                    {p.logo ? (
                      <img src={p.logo} alt={p.name} className="max-h-14 max-w-[120px] object-contain filter brightness-90" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.parentElement!.innerHTML = `<span class="text-[12px] text-slate-500 font-medium">${p.name}</span>`; }} />
                    ) : (
                      <span className="text-[12px] text-teal-400 font-bold">+More</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {["Technology", "Investment", "Academic", "Marketplace", "Legal", "Community"].map((c, i) => (
                  <span key={i} className="px-3 py-1 text-[12px] font-medium bg-slate-800/60 border border-teal-500/20 rounded-full text-teal-400/80">{c}</span>
                ))}
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== PAGE 8: TRACK RECORD & EVENTS ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col p-[4%] overflow-hidden">
            <img src={nebulaBg} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/92 via-slate-900/87 to-slate-950/92" />
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
              <h2 className="text-3xl font-bold text-white text-center mb-1">Events & Collaborations</h2>
              <p className="text-[12px] text-slate-300 text-center mb-4">Strategic partnerships with NASA and the Orlando entrepreneurial ecosystem</p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Event 1: NASA TTP at KSC */}
                <div className="relative overflow-hidden rounded-lg border border-teal-500/30 bg-slate-900/80">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent z-[1]" />
                  <img src={spaceEventBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                  <div className="relative z-[2] p-3 flex flex-col min-h-[160px]">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={nasaTTPLogo} alt="NASA TTP" className="h-6 w-auto object-contain" />
                    </div>
                    <h3 className="text-[12px] font-bold text-teal-400 mb-1 leading-tight">Accelerating Research & Technology Development</h3>
                    <p className="text-[12px] text-slate-400 leading-relaxed flex-1">
                      Partnership with NASA Technology Transfer Program at Kennedy Space Center to bridge space technology with commercial applications.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Telescope className="h-3 w-3 text-teal-400" />
                      <span className="text-[9px] text-teal-400/80 font-semibold tracking-wider">NASA TTP / KSC</span>
                    </div>
                  </div>
                </div>

                {/* Event 2: Hot Deals in Space */}
                <div className="relative overflow-hidden rounded-lg border border-emerald-500/30 bg-slate-900/80">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent z-[1]" />
                  <img src={spaceEventBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                  <div className="relative z-[2] p-3 flex flex-col min-h-[160px]">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={nasaLogo} alt="NASA" className="h-6 w-auto object-contain" />
                    </div>
                    <h3 className="text-[12px] font-bold text-emerald-400 mb-1 leading-tight">Hot Deals in Space</h3>
                    <p className="text-[12px] text-slate-400 leading-relaxed flex-1">
                      Flagship event connecting startups with NASA technologies, space industry leaders, and venture capital in the space economy.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Star className="h-3 w-3 text-emerald-400" />
                      <span className="text-[9px] text-emerald-400/80 font-semibold tracking-wider">NASA TTP EVENT</span>
                    </div>
                  </div>
                </div>

                {/* Event 3: Artemis II Watch Party */}
                <div className="relative overflow-hidden rounded-lg border border-cyan-500/30 bg-slate-900/80">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent z-[1]" />
                  <img src={artemisBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                  <div className="relative z-[2] p-3 flex flex-col min-h-[160px]">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={nasaLogo} alt="NASA" className="h-5 w-auto object-contain" />
                      <div className="bg-slate-800/80 px-2 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 text-red-500" />
                        <span className="text-[8px] text-cyan-400 font-semibold tracking-wider">LIVE</span>
                      </div>
                    </div>
                    <h3 className="text-[12px] font-bold text-cyan-400 mb-1 leading-tight">Artemis II Online Watch Party</h3>
                    <p className="text-[12px] text-slate-400 leading-relaxed flex-1">
                      Official community watch party for NASA's Artemis II mission — humanity's return to the Moon.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Globe className="h-3 w-3 text-cyan-400" />
                      <span className="text-[9px] text-cyan-400/80 font-semibold tracking-wider">OFFICIAL HOST</span>
                    </div>
                  </div>
                </div>

                {/* Event 4: Orlandopreneur */}
                <div className="relative overflow-hidden rounded-lg border border-amber-500/30 bg-slate-900/80">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-950/40 z-[1]" />
                  <div className="relative z-[2] p-3 flex flex-col min-h-[160px]">
                    <div className="flex items-center gap-2 mb-2">
                      <img src="/partners/orlandopreneur-logo.png" alt="Orlandopreneur" className="h-6 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <h3 className="text-[12px] font-bold text-amber-400 mb-1 leading-tight">Orlandopreneur Collaboration</h3>
                    <p className="text-[12px] text-slate-400 leading-relaxed flex-1">
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
              <div className="relative overflow-hidden rounded-lg border border-purple-500/30 bg-slate-900/80">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40 z-[1]" />
                <div className="relative z-[2] p-3 flex items-center gap-4">
                  <div className="bg-purple-500/20 border border-purple-500/40 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] text-purple-400 font-bold tracking-wider">UPCOMING</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[12px] font-bold text-purple-400 mb-0.5">Space Symposium — Times Square XR Experience</h3>
                    <p className="text-[12px] text-slate-400 leading-relaxed">
                      Featured immersive XR experience at Times Square showcasing space technology innovation.
                    </p>
                  </div>
                  <Smartphone className="h-6 w-6 text-purple-400 shrink-0" />
                </div>
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* ===== PAGE 9: CONTACT / CTA ===== */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[4%] overflow-hidden">
            <img src={rocketLaunchBg} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/92 via-slate-900/87 to-slate-950/92" />
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
              <p className="text-[12px] text-slate-300 mb-4">Let's Build the Future Together</p>
              <p className="text-[12px] text-slate-400 max-w-md mb-6 leading-relaxed">
                We're looking for partners, investors, and innovators who share our vision of democratizing access to startup success worldwide.
              </p>

              <a href="mailto:contact@startupfactoryhub.com" className="inline-flex items-center gap-3 bg-slate-900/80 border-2 border-teal-500/40 rounded-xl px-6 py-4 hover:border-teal-500/60 transition-colors mb-6">
                <Mail className="h-5 w-5 text-teal-400" />
                <span className="text-[12px] text-slate-200 font-medium">contact@startupfactoryhub.com</span>
              </a>

              <div className="relative mb-4">
                <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full scale-150" />
                <img src={sfhLogo} alt="SFH" className="relative w-24 h-24 object-contain" />
              </div>

              <div className="flex items-center gap-3 mb-3">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-[12px] text-slate-400">Orlando | Santiago | Tokyo | Sevilla</span>
              </div>

              <p className="text-[12px] text-slate-500">startupfactoryhub.com</p>
            </div>
          </section>
        </A4Wrapper>
      </div>
    </div>
  );
}
