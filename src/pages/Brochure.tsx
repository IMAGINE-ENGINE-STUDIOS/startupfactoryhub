import { useState, useRef, useEffect, useCallback } from 'react';
import { Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail, Printer, Search, Network, BarChart3, GraduationCap, Building2, Diamond, Cpu, DollarSign, Handshake, MapPin, Smartphone, Loader2, Calendar, Telescope, Radio, Star } from 'lucide-react';
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
import mockupDashboard from '@/assets/mockup-dashboard.png';
import mockupResources from '@/assets/mockup-resources.png';
import mockupHubs from '@/assets/mockup-hubs.png';
import mockupJourney from '@/assets/mockup-journey.png';
import mockupMobile from '@/assets/mockup-mobile.png';

// Geometric overlays reused from Deck
const TechGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => <div key={`h-${i}`} className="absolute w-full h-px bg-gradient-to-r from-transparent via-teal-500/8 to-transparent" style={{ top: `${(i + 1) * 5}%` }} />)}
    {[...Array(20)].map((_, i) => <div key={`v-${i}`} className="absolute h-full w-px bg-gradient-to-b from-transparent via-teal-500/8 to-transparent" style={{ left: `${(i + 1) * 5}%` }} />)}
  </div>
);

const FloatingHexagons = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[10%] right-[5%] w-32 h-32 border-2 border-teal-500/15 rotate-12" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    <div className="absolute top-[18%] right-[12%] w-20 h-20 border border-cyan-500/12 -rotate-6" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    <div className="absolute bottom-[15%] left-[5%] w-24 h-24 border-2 border-teal-500/12 rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    <div className="absolute bottom-[10%] right-[8%] w-20 h-20 border border-teal-500/10 rotate-15" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
  </div>
);

const EnergyLines = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-1/4 -left-24 w-72 h-72 border-2 border-teal-500/10 rounded-full" />
    <div className="absolute top-1/4 -right-24 w-72 h-72 border-2 border-cyan-500/10 rounded-full" />
    <div className="absolute top-[20%] left-[10%] w-1.5 h-1.5 bg-teal-400 rounded-full shadow-lg shadow-teal-500/50" />
    <div className="absolute top-[30%] right-[12%] w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50" />
    <div className="absolute bottom-[25%] left-[8%] w-1.5 h-1.5 bg-teal-400 rounded-full shadow-lg shadow-teal-500/50" />
  </div>
);

const CornerAccents = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-4 left-4">
      <div className="w-12 h-0.5 bg-gradient-to-r from-teal-500 to-transparent" />
      <div className="w-0.5 h-12 bg-gradient-to-b from-teal-500 to-transparent" />
    </div>
    <div className="absolute top-4 right-4">
      <div className="w-12 h-0.5 bg-gradient-to-l from-teal-500 to-transparent ml-auto" />
      <div className="w-0.5 h-12 bg-gradient-to-b from-teal-500 to-transparent ml-auto" />
    </div>
    <div className="absolute bottom-4 left-4">
      <div className="w-0.5 h-12 bg-gradient-to-t from-teal-500 to-transparent" />
      <div className="w-12 h-0.5 bg-gradient-to-r from-teal-500 to-transparent" />
    </div>
    <div className="absolute bottom-4 right-4">
      <div className="w-0.5 h-12 bg-gradient-to-t from-teal-500 to-transparent ml-auto" />
      <div className="w-12 h-0.5 bg-gradient-to-l from-teal-500 to-transparent ml-auto" />
    </div>
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

// A4 landscape wrapper: 1190x842
const A4Wrapper = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / 1190, height / 842));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full bg-slate-950" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1190/842' }}>
      <div data-slide style={{
        width: 1190,
        height: 842,
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginLeft: -595,
        marginTop: -421,
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
    <section className={`absolute inset-0 flex flex-col items-center justify-center p-[2%] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden ${className}`}>
      <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg" />
      <TechGrid />
      <FloatingHexagons />
      <EnergyLines />
      <CornerAccents />
      <div className="relative z-10 w-full max-w-[97%] mx-auto h-full flex flex-col justify-center">
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
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1190, 842] });
      const slideEls = deckRef.current.querySelectorAll<HTMLDivElement>('[data-slide]');
      for (let i = 0; i < slideEls.length; i++) {
        const slideEl = slideEls[i];
        const parentEl = slideEl.parentElement as HTMLDivElement;
        const origSlide = { transform: slideEl.style.transform, position: slideEl.style.position, left: slideEl.style.left, top: slideEl.style.top, marginLeft: slideEl.style.marginLeft, marginTop: slideEl.style.marginTop };
        const origParent = { overflow: parentEl.style.overflow, width: parentEl.style.width, height: parentEl.style.height, minHeight: parentEl.style.minHeight, position: parentEl.style.position };
        parentEl.style.overflow = 'visible';
        parentEl.style.width = '1190px';
        parentEl.style.height = '842px';
        parentEl.style.minHeight = '842px';
        parentEl.style.position = 'relative';
        slideEl.style.transform = 'none';
        slideEl.style.position = 'relative';
        slideEl.style.left = '0';
        slideEl.style.top = '0';
        slideEl.style.marginLeft = '0';
        slideEl.style.marginTop = '0';
        const imgs = slideEl.querySelectorAll('img');
        await Promise.all(Array.from(imgs).map(img => img.complete ? Promise.resolve() : new Promise<void>(r => { img.onload = () => r(); img.onerror = () => r(); })));
        const canvas = await html2canvas(slideEl, { width: 1190, height: 842, scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#020617', logging: false, windowWidth: 1190, windowHeight: 842 });
        Object.assign(slideEl.style, origSlide);
        Object.assign(parentEl.style, origParent);
        if (i > 0) pdf.addPage([1190, 842], 'landscape');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 1190, 842);
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

      <div className="pt-14">
        {/* SECTION 1: Cover */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[2%] overflow-hidden">
            <img src={rocketLaunchBg} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90" />
            <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(20,184,166,0.02) 2px, rgba(20,184,166,0.02) 4px)' }} />
            <div className="absolute inset-[0.8%] border-2 border-teal-500/40 rounded-lg" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-teal-500/30 blur-3xl rounded-full" />
                <img src={sfhLogo} alt="SFH" className="relative w-28 h-28 object-contain" />
                <div className="absolute inset-[-16px] border border-dashed border-teal-500/40 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
              </div>
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Startup Factory Hub</h1>
              <p className="text-xl font-semibold bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-3">
                The Online Hybrid Accelerator Platform Powered by A.I.
              </p>
              <p className="text-sm text-slate-300 max-w-lg leading-relaxed mb-4">
                A hybrid digital-physical execution platform with global locations, AI-driven workflows, and human expertise — enabling founders to build consistently from idea to scale.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-400">4 Global Hubs</span>
                <span className="text-slate-500 mx-1">|</span>
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">Orlando  |  Santiago  |  Tokyo  |  Sevilla</span>
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* SECTION 2: The Problem */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[2%] overflow-hidden">
            <img src={moonEarthBg} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/88 via-slate-900/82 to-slate-950/88" />
            <div className="absolute inset-[0.8%] border-2 border-rose-500/30 rounded-lg" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[95%] mx-auto">
              <div className="flex items-center gap-2 justify-center mb-1">
                <div className="w-2 h-2 bg-rose-500 rotate-45" />
                <span className="text-[10px] font-semibold text-rose-400 tracking-[0.3em] uppercase">System Failure</span>
                <div className="w-2 h-2 bg-rose-500 rotate-45" />
              </div>
              <h2 className="text-3xl font-bold text-white text-center mb-2">The Problem</h2>
              <p className="text-sm text-center text-slate-300 mb-5 max-w-lg mx-auto">
                Startups don't fail due to lack of ideas — <span className="text-rose-400 font-semibold">they fail because execution breaks between stages.</span>
              </p>

              {/* Broken journey flow */}
              <div className="relative w-full mb-5">
                <div className="absolute top-[28px] left-[10%] right-[10%] h-0.5">
                  <div className="w-full h-full bg-gradient-to-r from-teal-500/40 via-rose-500/40 to-slate-500/20" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(244,63,94,0.4) 6px, rgba(244,63,94,0.4) 10px)' }} />
                </div>
                <div className="grid grid-cols-5 gap-3 relative">
                  {[
                    { icon: GraduationCap, label: "Education", active: true, color: "teal" },
                    { icon: Cpu, label: "Product", active: false, color: "slate" },
                    { icon: Target, label: "Market", active: false, color: "slate" },
                    { icon: DollarSign, label: "Revenue", active: false, color: "slate" },
                    { icon: TrendingUp, label: "Scale", active: false, color: "slate" },
                  ].map((s, i) => (
                    <div key={i} className={`flex flex-col items-center ${!s.active ? 'opacity-60' : ''}`}>
                      <div className={`w-14 h-14 rounded-full ${s.active ? 'bg-teal-500/20 border-2 border-teal-500/60' : 'bg-slate-800 border-2 border-rose-500/40 border-dashed'} flex items-center justify-center`}>
                        <s.icon className={`h-6 w-6 ${s.active ? 'text-teal-400' : 'text-slate-500'}`} />
                      </div>
                      <span className={`text-[10px] font-bold mt-1.5 ${s.active ? 'text-teal-400' : 'text-slate-500'}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <SectionDivider title="Core Gaps" />
              <div className="grid grid-cols-5 gap-3 w-full">
                {[
                  { icon: Network, num: "01", desc: "Fragmented tools & platforms" },
                  { icon: Calendar, num: "02", desc: "No support post-demo day" },
                  { icon: Users, num: "03", desc: "Limited access to operators" },
                  { icon: DollarSign, num: "04", desc: "Capital without execution" },
                  { icon: TrendingUp, num: "05", desc: "Education without revenue" },
                ].map((g, i) => (
                  <div key={i} className="bg-slate-900/60 border border-rose-500/30 rounded-lg p-3 text-center">
                    <span className="text-lg font-black text-rose-500/30">{g.num}</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center mx-auto my-1.5">
                      <g.icon className="h-4 w-4 text-rose-400" />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{g.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* SECTION 3: The Solution */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[2%] overflow-hidden">
            <img src={astronautBg} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90" />
            <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[95%] mx-auto">
              <div className="flex items-center gap-2 justify-center mb-1">
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
                <span className="text-[10px] font-semibold text-teal-400 tracking-[0.3em] uppercase">End-to-End Execution</span>
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
              </div>
              <h2 className="text-3xl font-bold text-white text-center mb-2">The Solution</h2>

              <div className="bg-slate-900/60 border border-teal-500/40 rounded-lg p-4 mb-4 backdrop-blur-sm">
                <p className="text-sm text-center text-slate-200 leading-relaxed">
                  <span className="text-teal-400 font-bold">We are not a 3-month program.</span> We are an <span className="text-cyan-400 font-semibold">AI-powered hybrid accelerator platform</span> — a permanent operating system that merges intelligent automation, physical hubs, mentorship, and capital access into one continuous execution engine.
                </p>
              </div>

              {/* 4 Pillars */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { icon: BarChart3, label: "A.I. Business Intelligence Engine", desc: "AI-powered analytics, risk modeling, and strategic recommendations", color: "teal" },
                  { icon: GraduationCap, label: "Education", desc: "Structured learning, courses, and certification programs", color: "cyan" },
                  { icon: Globe, label: "Digital + Physical Hybrid", desc: "Online platform + 4 flagship hubs + 5,800 partner locations", color: "purple" },
                  { icon: Network, label: "Integrated Ecosystem", desc: "AI + Mentors + Corporates + Capital in one unified workflow", color: "emerald" },
                ].map((p, i) => (
                  <div key={i} className={`bg-slate-900/60 border border-${p.color}-500/30 rounded-lg p-3 backdrop-blur-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg bg-${p.color}-500/20 border border-${p.color}-500/40 flex items-center justify-center`}>
                        <p.icon className={`h-4 w-4 text-${p.color}-400`} />
                      </div>
                      <span className={`text-xs font-bold text-${p.color}-400`}>{p.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>

              {/* 4 Mechanisms */}
              <SectionDivider title="Execution Mechanisms" />
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: Cpu, label: "Digital Infrastructure", desc: "AI-powered tools & automation", color: "teal" },
                  { icon: Users, label: "Human Expertise", desc: "Mentors, advisors & network", color: "cyan" },
                  { icon: Building2, label: "Corporate Partners", desc: "Strategic alliances & deals", color: "purple" },
                  { icon: DollarSign, label: "Capital Access", desc: "Investor network & funding", color: "emerald" },
                ].map((m, i) => (
                  <div key={i} className={`bg-slate-900/80 border border-${m.color}-500/40 rounded-lg p-3 backdrop-blur-sm text-center`}>
                    <div className={`w-10 h-10 rounded-lg bg-${m.color}-500/20 border border-${m.color}-500/40 flex items-center justify-center mx-auto mb-2`}>
                      <m.icon className={`h-5 w-5 text-${m.color}-400`} />
                    </div>
                    <h4 className={`text-xs font-bold text-${m.color}-400 mb-1`}>{m.label}</h4>
                    <p className="text-[9px] text-slate-400">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* SECTION 4: Platform Features */}
        <PageContainer>
          <div className="flex items-center gap-2 justify-center mb-1">
            <IconBadge icon={Cpu} color="emerald" />
            <h2 className="text-2xl font-bold text-white">Platform Features</h2>
          </div>
          <p className="text-xs text-emerald-400 font-semibold text-center mb-4">All-in-One Startup Operating System</p>

          {/* 2x3 Feature Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { icon: Cpu, label: "AI Strategies", desc: "Smart growth recommendations and roadmaps powered by machine learning", color: "emerald" },
              { icon: BarChart3, label: "Business Intelligence", desc: "Market insights, analytics dashboards and real-time performance tracking", color: "cyan" },
              { icon: MapPin, label: "Resources Map", desc: "Global partner network with 5,800+ locations and exclusive startup perks", color: "teal" },
              { icon: Rocket, label: "Startup Journey", desc: "Guided execution path from idea validation to full market scale", color: "emerald" },
              { icon: Users, label: "Mentorship", desc: "AI-matched mentors and advisors with domain expertise", color: "purple" },
              { icon: Diamond, label: "Investor Match", desc: "Smart investor matching, pitch preparation and capital raising tools", color: "amber" },
            ].map((f, i) => (
              <TechCard key={i} glowColor={f.color} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-${f.color}-500/20 flex items-center justify-center`}>
                    <f.icon className={`h-4 w-4 text-${f.color}-400`} />
                  </div>
                  <span className={`text-xs font-bold text-${f.color}-400`}>{f.label}</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-relaxed">{f.desc}</p>
              </TechCard>
            ))}
          </div>

          {/* Product mockups */}
          <div className="relative h-[260px] w-full">
            <div className="absolute bg-white rounded overflow-hidden shadow-[0_6px_30px_rgba(0,0,0,0.35),0_0_15px_rgba(6,182,212,0.2)]" style={{ width: '30%', aspectRatio: '16/10', left: '3%', top: '5%', transform: 'rotateY(4deg) rotateZ(-1deg)', zIndex: 1 }}>
              <img src={mockupResources} alt="Resources" className="w-full h-full object-cover object-top" />
            </div>
            <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2" style={{ width: '42%', zIndex: 3 }}>
              <div className="rounded-lg overflow-hidden bg-black p-[3px] shadow-[0_15px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(16,185,129,0.2)]">
                <div className="bg-black flex justify-center py-[2px]"><div className="w-1.5 h-1.5 rounded-full bg-slate-700" /></div>
                <div className="bg-white rounded-sm overflow-hidden"><img src={mockupDashboard} alt="Dashboard" className="w-full h-auto block" /></div>
              </div>
            </div>
            <div className="absolute bg-white rounded overflow-hidden shadow-[0_6px_30px_rgba(0,0,0,0.35),0_0_15px_rgba(6,182,212,0.2)]" style={{ width: '28%', aspectRatio: '16/10', right: '3%', top: '8%', transform: 'rotateY(-4deg) rotateZ(1deg)', zIndex: 1 }}>
              <img src={mockupJourney} alt="Journey" className="w-full h-full object-cover object-top" />
            </div>
            <div className="absolute" style={{ right: '14%', bottom: '2%', width: '9%', zIndex: 4 }}>
              <div className="rounded-[8px] overflow-hidden bg-black p-[2px] shadow-[0_10px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(16,185,129,0.2)]">
                <div className="bg-white overflow-hidden"><img src={mockupMobile} alt="Mobile" className="w-full h-auto block" /></div>
              </div>
            </div>
          </div>
        </PageContainer>

        {/* SECTION 5: User Profiles */}
        <PageContainer>
          <div className="flex items-center gap-2 justify-center mb-1">
            <IconBadge icon={Users} color="teal" />
            <h2 className="text-2xl font-bold text-white">Ecosystem Overview</h2>
          </div>
          <p className="text-xs text-slate-400 text-center mb-4">A unified platform serving 8 stakeholder types with role-specific dashboards</p>

          <div className="grid grid-cols-8 gap-2 mb-5">
            {[
              { icon: Rocket, label: "Startups", color: "emerald" },
              { icon: Diamond, label: "Investors", color: "purple" },
              { icon: Lightbulb, label: "Mentors", color: "cyan" },
              { icon: Award, label: "Advisors", color: "amber" },
              { icon: GraduationCap, label: "Students", color: "rose" },
              { icon: Building2, label: "Accelerators", color: "teal" },
              { icon: Handshake, label: "Corporates", color: "purple" },
              { icon: Network, label: "Admins", color: "slate" },
            ].map((u, i) => (
              <div key={i} className={`bg-slate-900/60 border border-${u.color}-500/30 rounded-lg p-2 text-center`}>
                <div className={`w-8 h-8 rounded-lg bg-${u.color}-500/20 flex items-center justify-center mx-auto mb-1`}>
                  <u.icon className={`h-4 w-4 text-${u.color}-400`} />
                </div>
                <span className={`text-[9px] font-semibold text-${u.color}-400`}>{u.label}</span>
              </div>
            ))}
          </div>

          <SectionDivider title="Startup Journey Roadmap" />

          {/* Timeline */}
          <div className="relative w-full mt-2">
            <div className="absolute top-[44px] left-[8%] right-[8%] h-[3px] z-0">
              <div className="w-full h-full bg-gradient-to-r from-amber-500/50 via-teal-500/70 via-purple-500/60 to-rose-500/50 rounded-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-teal-500/30 to-rose-500/20 rounded-full blur-lg" />
            </div>
            <div className="grid grid-cols-6 gap-3 relative z-10">
              {[
                { icon: Lightbulb, label: "Idea", desc: "Validate concept & market need", color: "amber", step: "01" },
                { icon: Search, label: "Research", desc: "Analyze market & competitors", color: "cyan", step: "02" },
                { icon: Cpu, label: "MVP", desc: "Build minimum viable product", color: "teal", step: "03" },
                { icon: Target, label: "Validation", desc: "User testing & iteration", color: "purple", step: "04" },
                { icon: Rocket, label: "Launch", desc: "Go-to-market execution", color: "emerald", step: "05" },
                { icon: TrendingUp, label: "Growth", desc: "Scale operations & raise", color: "rose", step: "06" },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className={`text-[8px] font-bold text-${s.color}-400/80 tracking-widest mb-1`}>STEP {s.step}</span>
                  <div className="relative mb-2">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-${s.color}-500/30 to-${s.color}-600/20 border-2 border-${s.color}-500/50 flex items-center justify-center`}>
                      <s.icon className={`h-6 w-6 text-${s.color}-400`} />
                    </div>
                  </div>
                  <div className={`bg-slate-900/70 border border-${s.color}-500/20 rounded-lg p-2 text-center w-full`}>
                    <p className={`text-xs font-bold text-${s.color}-400 mb-0.5`}>{s.label}</p>
                    <p className="text-[8px] text-slate-400 leading-tight">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>

        {/* SECTION 6: Partners & Network */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[2%] overflow-hidden">
            <img src={jupiterBg} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-slate-950/75" />
            <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg z-[1]" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[95%] mx-auto">
              <div className="flex items-center gap-2 justify-center mb-1">
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
                <span className="text-[10px] font-semibold text-teal-400 tracking-[0.3em] uppercase">Strategic Network</span>
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
              </div>
              <h2 className="text-3xl font-bold text-white text-center mb-1">Our Partners & Network</h2>
              <p className="text-xs text-slate-300 text-center mb-4">Backed by industry leaders and innovators shaping the future</p>

              <div className="grid grid-cols-6 gap-2.5 w-full mb-4">
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
                ].map((p, i) => (
                  <div key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2 flex items-center justify-center h-14 hover:border-teal-500/40 transition-colors">
                    <img src={p.logo} alt={p.name} className="max-h-8 max-w-[80px] object-contain filter brightness-90" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {["Technology", "Investment", "Academic", "Marketplace", "Legal", "Community"].map((c, i) => (
                  <span key={i} className="px-3 py-1 text-[10px] font-medium bg-slate-800/60 border border-teal-500/20 rounded-full text-teal-400/80">{c}</span>
                ))}
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* SECTION 7: Track Record & Events */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[2%] overflow-hidden">
            <img src={nebulaBg} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90" />
            <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[95%] mx-auto">
              <div className="flex items-center gap-2 justify-center mb-1">
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
                <span className="text-[10px] font-semibold text-teal-400 tracking-[0.3em] uppercase">Track Record</span>
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
              </div>
              <h2 className="text-3xl font-bold text-white text-center mb-1">Events & Collaborations</h2>
              <p className="text-xs text-slate-300 text-center mb-4">Strategic partnerships with NASA and the Orlando entrepreneurial ecosystem</p>

              <div className="grid grid-cols-5 gap-3">
                {/* Event 1: NASA TTP at KSC */}
                <div className="relative overflow-hidden rounded-lg border border-teal-500/30 bg-slate-900/80">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent z-[1]" />
                  <img src={spaceEventBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                  <div className="relative z-[2] p-3 flex flex-col h-full min-h-[280px]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <img src={nasaTTPLogo} alt="NASA TTP" className="h-6 w-auto object-contain" />
                    </div>
                    <h3 className="text-xs font-bold text-teal-400 mb-1 leading-tight">Accelerating Research & Technology Development</h3>
                    <p className="text-[8px] text-slate-400 leading-relaxed flex-1">
                      Partnership with NASA Technology Transfer Program at Kennedy Space Center to bridge space technology with commercial applications.
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Telescope className="h-3 w-3 text-teal-400" />
                      <span className="text-[7px] text-teal-400/80 font-semibold tracking-wider">NASA TTP / KSC</span>
                    </div>
                  </div>
                </div>

                {/* Event 2: Hot Deals in Space */}
                <div className="relative overflow-hidden rounded-lg border border-emerald-500/30 bg-slate-900/80">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent z-[1]" />
                  <img src={spaceEventBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                  <div className="relative z-[2] p-3 flex flex-col h-full min-h-[280px]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <img src={nasaLogo} alt="NASA" className="h-6 w-auto object-contain" />
                    </div>
                    <h3 className="text-xs font-bold text-emerald-400 mb-1 leading-tight">Hot Deals in Space</h3>
                    <p className="text-[8px] text-slate-400 leading-relaxed flex-1">
                      Flagship event connecting startups with NASA technologies, space industry leaders, and venture capital in the space economy.
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-3 w-3 text-emerald-400" />
                      <span className="text-[7px] text-emerald-400/80 font-semibold tracking-wider">NASA TTP EVENT</span>
                    </div>
                  </div>
                </div>

                {/* Event 3: Artemis II Watch Party */}
                <div className="relative overflow-hidden rounded-lg border border-cyan-500/30 bg-slate-900/80">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent z-[1]" />
                  <img src={artemisBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                  <div className="relative z-[2] p-3 flex flex-col h-full min-h-[280px]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <img src={nasaLogo} alt="NASA" className="h-5 w-auto object-contain" />
                      <div className="bg-slate-800/80 px-1.5 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                        <Radio className="w-2 h-2 text-red-500" />
                        <span className="text-[6px] text-cyan-400 font-semibold tracking-wider">LIVE</span>
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-cyan-400 mb-1 leading-tight">Artemis II Online Watch Party</h3>
                    <p className="text-[8px] text-slate-400 leading-relaxed flex-1">
                      Official community watch party for NASA's Artemis II mission — humanity's return to the Moon. Global live stream event.
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Globe className="h-3 w-3 text-cyan-400" />
                      <span className="text-[7px] text-cyan-400/80 font-semibold tracking-wider">OFFICIAL HOST</span>
                    </div>
                  </div>
                </div>

                {/* Event 4: Orlandopreneur */}
                <div className="relative overflow-hidden rounded-lg border border-amber-500/30 bg-slate-900/80">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-950/40 z-[1]" />
                  <div className="relative z-[2] p-3 flex flex-col h-full min-h-[280px]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <img src="/partners/orlandopreneur-logo.png" alt="Orlandopreneur" className="h-6 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <h3 className="text-xs font-bold text-amber-400 mb-1 leading-tight">Orlandopreneur Collaboration</h3>
                    <p className="text-[8px] text-slate-400 leading-relaxed flex-1">
                      Strategic partnership with Orlando's premier entrepreneurial community, co-hosting events and connecting local founders with global resources.
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Handshake className="h-3 w-3 text-amber-400" />
                      <span className="text-[7px] text-amber-400/80 font-semibold tracking-wider">COMMUNITY PARTNER</span>
                    </div>
                  </div>
                </div>

                {/* Event 5: Space Symposium / Times Square XR */}
                <div className="relative overflow-hidden rounded-lg border border-purple-500/30 bg-slate-900/80">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-950/40 z-[1]" />
                  <div className="relative z-[2] p-3 flex flex-col h-full min-h-[280px]">
                    <div className="bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-2 self-start">
                      <span className="text-[7px] text-purple-400 font-bold tracking-wider">UPCOMING</span>
                    </div>
                    <h3 className="text-xs font-bold text-purple-400 mb-1 leading-tight">Space Symposium — Times Square XR Experience</h3>
                    <p className="text-[8px] text-slate-400 leading-relaxed flex-1">
                      Featured immersive XR experience at Times Square showcasing space technology innovation and the future of commercial space ventures.
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Smartphone className="h-3 w-3 text-purple-400" />
                      <span className="text-[7px] text-purple-400/80 font-semibold tracking-wider">XR EXPERIENCE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </A4Wrapper>

        {/* SECTION 8: Contact / CTA */}
        <A4Wrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[2%] overflow-hidden">
            <img src={rocketLaunchBg} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90" />
            <div className="absolute inset-[0.8%] border border-teal-500/30 rounded-lg z-[1]" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
                <span className="text-[10px] font-semibold text-teal-400 tracking-[0.3em] uppercase">Get Involved</span>
                <div className="w-2 h-2 bg-teal-500 rotate-45" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">Join Our Mission</h2>
              <p className="text-xl text-slate-300 mb-4">Let's Build the Future Together</p>
              <p className="text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
                We're looking for partners, investors, and innovators who share our vision of democratizing access to startup success.
              </p>

              <a href="mailto:contact@startupfactoryhub.com" className="inline-flex items-center gap-3 bg-slate-900/80 border-2 border-teal-500/40 rounded-xl px-8 py-4 hover:border-teal-500/60 transition-colors mb-6">
                <Mail className="h-5 w-5 text-teal-400" />
                <span className="text-base text-slate-200 font-medium">contact@startupfactoryhub.com</span>
              </a>

              <div className="relative">
                <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full scale-150" />
                <img src={sfhLogo} alt="SFH" className="relative w-24 h-24 object-contain" />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-xs text-slate-400">Orlando | Santiago | Tokyo | Sevilla</span>
              </div>

              <p className="text-[10px] text-slate-500 mt-4">startupfactoryhub.com</p>
            </div>
          </section>
        </A4Wrapper>
      </div>
    </div>
  );
}
