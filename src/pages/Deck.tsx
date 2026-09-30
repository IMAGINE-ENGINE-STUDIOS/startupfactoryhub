import { useState, useRef, useEffect, useCallback } from 'react';
import { Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail, ExternalLink, Printer, Search, Network, BarChart3, Briefcase, GraduationCap, Building2, Diamond, Video, FileText, Calendar, Cpu, DollarSign, Handshake, Zap, ArrowRight, MapPin, Smartphone, Loader2, Percent, Heart } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import sfhLogo from '@/assets/sfh-logo-sphere.png';
import rocketLaunchBg from '@/assets/rocket-launch-bg.jpg';
import astronautBg from '@/assets/astronaut-bg.jpg';
import slide2Img from '@/assets/deck-slide2-hybrid.jpg';
import slide3Img from '@/assets/deck-slide3-gap.jpg';
import shotJourney from '@/assets/features/journey.jpg';
import shotMatching from '@/assets/features/matching.jpg';
import shotAITools from '@/assets/features/ai-tools.jpg';
import moonEarthBg from '@/assets/moon-earth.jpg';
import galaxyBg from '@/assets/galaxy-bg.webp';
import blackHoleBg from '@/assets/black-hole-bg.jpg';
import jupiterBg from '@/assets/jupiter-bg.jpg';
import nebulaBg from '@/assets/nebula-bg.jpg';
import issMarketBg from '@/assets/hubble-star-bg.jpg';
import artemisTeamBg from '@/assets/artemis-team-bg.jpg';
import moonTeamBg from '@/assets/moon-team-bg.jpg';

import mockupDashboard from '@/assets/mockup-dashboard.png';
import mockupResources from '@/assets/mockup-resources.png';
import mockupHubs from '@/assets/mockup-hubs.png';
import mockupJourney from '@/assets/mockup-journey.png';
import mockupMobile from '@/assets/mockup-mobile.png';
import teamKhalia from '@/assets/team-khalia.jpg';
import teamRicardo from '@/assets/team-ricardo.jpg';
import teamSteven from '@/assets/team-steven.png';
import teamGary from '@/assets/team-gary.png';

// Enhanced Geometric Pattern Components (matching marketing banners)
const TechGrid = () => <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden">
    {/* Horizontal lines */}
    {[...Array(25)].map((_, i) => <div key={`h-${i}`} className="absolute w-full h-px bg-gradient-to-r from-transparent via-teal-500/8 to-transparent" style={{
    top: `${(i + 1) * 4}%`
  }} />)}
    {/* Vertical lines */}
    {[...Array(25)].map((_, i) => <div key={`v-${i}`} className="absolute h-full w-px bg-gradient-to-b from-transparent via-teal-500/8 to-transparent" style={{
    left: `${(i + 1) * 4}%`
  }} />)}
    {/* Grid intersection dots */}
    {[...Array(6)].map((_, i) => [...Array(6)].map((_, j) => <div key={`dot-${i}-${j}`} className="absolute w-1 h-1 rounded-full bg-teal-500/20" style={{
    top: `${(i + 1) * 16}%`,
    left: `${(j + 1) * 16}%`
  }} />))}
  </div>;
const FloatingHexagons = () => <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden">
    {/* Large hexagon top right */}
    <div className="absolute top-[10%] right-[5%] w-40 h-40 border-2 border-teal-500/15 rotate-12" style={{
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
  }} />
    {/* Medium hexagon top right */}
    <div className="absolute top-[18%] right-[12%] w-24 h-24 border border-cyan-500/12 -rotate-6" style={{
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
  }} />
    {/* Small hexagon top left */}
    <div className="absolute top-[15%] left-[8%] w-20 h-20 border border-teal-500/10 rotate-30" style={{
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
  }} />
    {/* Bottom left cluster */}
    <div className="absolute bottom-[15%] left-[5%] w-32 h-32 border-2 border-teal-500/12 rotate-45" style={{
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
  }} />
    <div className="absolute bottom-[25%] left-[2%] w-16 h-16 border border-cyan-500/10 -rotate-12" style={{
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
  }} />
    {/* Bottom right */}
    <div className="absolute bottom-[10%] right-[8%] w-28 h-28 border border-teal-500/10 rotate-15" style={{
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
  }} />
  </div>;
const EnergyLines = () => <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden">
    {/* Left sweeping arc */}
    <div className="absolute top-1/4 -left-32 w-96 h-96 border-2 border-teal-500/10 rounded-full" />
    <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] border border-teal-500/5 rounded-full" />
    {/* Right sweeping arc */}
    <div className="absolute top-1/4 -right-32 w-96 h-96 border-2 border-cyan-500/10 rounded-full" />
    <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] border border-cyan-500/5 rounded-full" />
    {/* Glowing particles */}
    <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-teal-400 rounded-full shadow-lg shadow-teal-500/50" />
    <div className="absolute top-[30%] left-[15%] w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50" />
    <div className="absolute top-[25%] right-[12%] w-2 h-2 bg-teal-400 rounded-full shadow-lg shadow-teal-500/50" />
    <div className="absolute top-[35%] right-[8%] w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50" />
    <div className="absolute bottom-[30%] left-[8%] w-1.5 h-1.5 bg-teal-400 rounded-full shadow-lg shadow-teal-500/50" />
    <div className="absolute bottom-[25%] right-[15%] w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50" />
    {/* Connection lines (dashed) */}
    <div className="absolute top-[22%] left-[11%] w-16 h-px bg-gradient-to-r from-teal-500/30 to-transparent rotate-45" />
    <div className="absolute top-[27%] right-[10%] w-20 h-px bg-gradient-to-l from-cyan-500/30 to-transparent -rotate-30" />
  </div>;
const CornerAccents = () => <div className="absolute inset-0 pointer-events-none print:hidden">
    {/* Top left */}
    <div className="absolute top-6 left-6">
      <div className="w-16 h-0.5 bg-gradient-to-r from-teal-500 to-transparent" />
      <div className="w-0.5 h-16 bg-gradient-to-b from-teal-500 to-transparent" />
    </div>
    {/* Top right */}
    <div className="absolute top-6 right-6">
      <div className="w-16 h-0.5 bg-gradient-to-l from-teal-500 to-transparent ml-auto" />
      <div className="w-0.5 h-16 bg-gradient-to-b from-teal-500 to-transparent ml-auto" />
    </div>
    {/* Bottom left */}
    <div className="absolute bottom-6 left-6">
      <div className="w-0.5 h-16 bg-gradient-to-t from-teal-500 to-transparent" />
      <div className="w-16 h-0.5 bg-gradient-to-r from-teal-500 to-transparent" />
    </div>
    {/* Bottom right */}
    <div className="absolute bottom-6 right-6">
      <div className="w-0.5 h-16 bg-gradient-to-t from-teal-500 to-transparent ml-auto" />
      <div className="w-16 h-0.5 bg-gradient-to-l from-teal-500 to-transparent ml-auto" />
    </div>
  </div>;

// Slide wrapper for consistent 16:9 aspect ratio scaling
const SlideWrapper = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / 1920, height / 1080));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full aspect-video bg-slate-950 print:aspect-auto print:min-h-0 print:p-0 print:bg-white" style={{ position: 'relative', overflow: 'hidden' }}>
      <div data-slide style={{
        width: 1920,
        height: 1080,
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginLeft: -960,
        marginTop: -540,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}>
        {children}
      </div>
    </div>
  );
};

// Cover slide with background image
const CoverSlideContainer = ({
  children
}: {
  children: React.ReactNode;
}) => <SlideWrapper>
    <section className="absolute inset-0 flex flex-col items-center justify-center p-[1.5%] overflow-hidden print:relative print:p-8 print:break-after-page print:bg-white">
      {/* Background image */}
      <img src={rocketLaunchBg} alt="" className="absolute inset-0 w-full h-full object-cover print:hidden" crossOrigin="anonymous" />
      {/* Dark cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 print:hidden" />
      {/* Scan lines effect */}
      <div className="absolute inset-0 print:hidden" style={{
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(20, 184, 166, 0.02) 2px, rgba(20, 184, 166, 0.02) 4px)'
    }} />
      {/* Border frame */}
      <div className="absolute inset-[1%] border-2 border-teal-500/40 rounded-lg print:border-gray-300" />
      <TechGrid />
      <FloatingHexagons />
      <EnergyLines />
      <CornerAccents />
      <div className="relative z-10 w-full max-w-[99%] mx-auto">
        {children}
      </div>
    </section>
  </SlideWrapper>;

// Standard slide container
const SlideContainer = ({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) => <SlideWrapper>
    <section className={`absolute inset-0 flex flex-col items-center justify-center p-[1.5%] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 print:relative print:p-8 print:break-after-page print:bg-white ${className}`}>
      {/* Border frame */}
      <div className="absolute inset-[1%] border-2 border-teal-500/30 rounded-lg print:border-gray-300" />
      <TechGrid />
      <FloatingHexagons />
      <EnergyLines />
      <CornerAccents />
      <div className="relative z-10 w-full max-w-[99%] mx-auto">
        {children}
      </div>
    </section>
  </SlideWrapper>;
const SectionDivider = ({
  title
}: {
  title: string;
}) => <div className="flex items-center gap-4 mb-8">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-teal-500" />
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-teal-500 rotate-45" />
      <span className="text-sm font-semibold text-teal-400 tracking-widest uppercase print:text-gray-700">{title}</span>
      <div className="w-2 h-2 bg-teal-500 rotate-45" />
    </div>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-teal-500/50 to-teal-500" />
  </div>;
const TechCard = ({
  children,
  className = "",
  glowColor = "teal"
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) => {
  const glowClasses = {
    teal: "border-teal-500/40 hover:border-teal-500/60 shadow-teal-500/10",
    cyan: "border-cyan-500/40 hover:border-cyan-500/60 shadow-cyan-500/10",
    purple: "border-purple-500/40 hover:border-purple-500/60 shadow-purple-500/10",
    emerald: "border-emerald-500/40 hover:border-emerald-500/60 shadow-emerald-500/10",
    amber: "border-amber-500/40 hover:border-amber-500/60 shadow-amber-500/10",
    rose: "border-rose-500/40 hover:border-rose-500/60 shadow-rose-500/10"
  };
  return <div className={`relative bg-slate-900/80 border-2 rounded-lg p-6 backdrop-blur-sm shadow-lg print:bg-white print:border-gray-300 print:shadow-none ${glowClasses[glowColor as keyof typeof glowClasses] || glowClasses.teal} ${className}`}>
      {/* Top glow line */}
      <div className={`absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-${glowColor}-500/60 to-transparent print:hidden`} />
      {children}
    </div>;
};
const IconBadge = ({
  icon: Icon,
  color = "teal"
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  color?: string;
}) => {
  const colorClasses = {
    teal: "bg-teal-500/20 text-teal-400 border-teal-500/40",
    cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    rose: "bg-rose-500/20 text-rose-400 border-rose-500/40"
  };
  return <div className={`w-12 h-12 rounded-lg border flex items-center justify-center print:bg-gray-100 print:border-gray-300 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.teal}`}>
      <Icon className="h-6 w-6 print:text-gray-700" />
    </div>;
};
export default function Deck() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = useCallback(async () => {
    if (!deckRef.current || isExporting) return;
    setIsExporting(true);
    toast.info("Generating PDF... This may take a moment.");

    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });
      const slideEls = deckRef.current.querySelectorAll<HTMLDivElement>('[data-slide]');

      for (let i = 0; i < slideEls.length; i++) {
        const slideEl = slideEls[i];
        const parentEl = slideEl.parentElement as HTMLDivElement;
        
        // Save original styles for both slide and parent
        const origSlide = {
          transform: slideEl.style.transform,
          position: slideEl.style.position,
          left: slideEl.style.left,
          top: slideEl.style.top,
          marginLeft: slideEl.style.marginLeft,
          marginTop: slideEl.style.marginTop,
        };
        const origParent = {
          overflow: parentEl.style.overflow,
          width: parentEl.style.width,
          height: parentEl.style.height,
          minHeight: parentEl.style.minHeight,
          position: parentEl.style.position,
        };

        // Expand parent to full slide size and remove overflow clipping
        parentEl.style.overflow = 'visible';
        parentEl.style.width = '1920px';
        parentEl.style.height = '1080px';
        parentEl.style.minHeight = '1080px';
        parentEl.style.position = 'relative';

        // Reset slide to natural position at full size
        slideEl.style.transform = 'none';
        slideEl.style.position = 'relative';
        slideEl.style.left = '0';
        slideEl.style.top = '0';
        slideEl.style.marginLeft = '0';
        slideEl.style.marginTop = '0';

        // Wait for images inside this slide to fully load
        const imgs = slideEl.querySelectorAll('img');
        await Promise.all(Array.from(imgs).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        }));

        const canvas = await html2canvas(slideEl, {
          width: 1920,
          height: 1080,
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#020617',
          logging: false,
          windowWidth: 1920,
          windowHeight: 1080,
        });

        // Restore original styles
        Object.assign(slideEl.style, origSlide);
        Object.assign(parentEl.style, origParent);

        if (i > 0) pdf.addPage([1920, 1080], 'landscape');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 1920, 1080);
      }

      pdf.save('Startup-Factory-Hub-Pitch-Deck.pdf');
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  return <div ref={deckRef} className="min-h-screen bg-slate-950 text-white">
      {/* Bump body text sizes across the deck for readability */}
      <style>{`
        [data-slide] .text-xs { font-size: 16px !important; line-height: 1.5 !important; }
        [data-slide] .text-sm { font-size: 19px !important; line-height: 1.55 !important; }
        [data-slide] .text-base { font-size: 22px !important; line-height: 1.55 !important; }
        [data-slide] .text-lg { font-size: 26px !important; line-height: 1.5 !important; }
        [data-slide] .text-xl { font-size: 30px !important; line-height: 1.45 !important; }
        [data-slide] .md\\:text-xl { font-size: 30px !important; }
        [data-slide] .md\\:text-2xl { font-size: 36px !important; }
        [data-slide] .md\\:text-lg { font-size: 26px !important; }
      `}</style>
      {/* Navigation Bar - Hidden in Print */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/95 backdrop-blur-sm border-b border-teal-500/30 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 text-white hover:bg-slate-800 hover:text-teal-400">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
          <span className="text-sm text-teal-400 font-medium tracking-wide">STARTUP FACTORY HUB // PITCH DECK</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting} className="gap-2 border-teal-500/50 text-teal-400 hover:bg-teal-500/10 hover:border-teal-500">
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="pt-16 print:pt-0">
        {/* SLIDE 1: Cover */}
        <SlideWrapper>
          <section className="absolute inset-0 overflow-hidden print:relative print:break-after-page print:bg-white">
            <img src={rocketLaunchBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35 print:hidden" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(45,212,191,0.28),transparent_40%),radial-gradient(ellipse_at_50%_110%,rgba(34,211,238,0.18),transparent_50%),linear-gradient(180deg,rgba(2,6,23,0.8),rgba(2,6,23,0.97))] print:hidden" />
            {/* Perspective floor grid */}
            <div className="absolute left-[-20%] right-[-20%] bottom-[-10%] h-[45%] print:hidden" style={{ transform: 'perspective(700px) rotateX(62deg)', backgroundImage: 'linear-gradient(rgba(45,212,191,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.18) 1px, transparent 1px)', backgroundSize: '80px 80px', maskImage: 'linear-gradient(to top, black, transparent)', WebkitMaskImage: 'linear-gradient(to top, black, transparent)' }} />

            <div className="relative z-10 h-full flex flex-col items-center text-center px-[140px] pt-[70px] pb-[60px]">
              {/* Logo core with orbits */}
              <div className="relative w-[300px] h-[300px] flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-teal-400/25 blur-[70px] print:hidden" />
                <div className="absolute inset-0 rounded-full border border-teal-300/25 animate-[spin_24s_linear_infinite] print:hidden">
                  <span className="absolute top-0 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-200 shadow-[0_0_20px_6px_rgba(94,234,212,0.7)]" />
                </div>
                <div className="absolute inset-[-50px] rounded-full border border-cyan-300/15 animate-[spin_40s_linear_infinite_reverse] print:hidden">
                  <span className="absolute bottom-0 left-1/2 w-2 h-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_16px_4px_rgba(103,232,249,0.7)]" />
                </div>
                <img src={sfhLogo} alt="Startup Factory Hub" className="relative w-[210px] h-[210px] object-contain drop-shadow-[0_0_40px_rgba(45,212,191,0.5)]" />
              </div>

              <h1 className="mt-10 text-[128px] leading-[0.95] font-black tracking-[-0.04em] bg-gradient-to-b from-white via-white to-teal-200/70 bg-clip-text text-transparent print:text-black">
                Startup Factory Hub
              </h1>
              <p className="mt-6 text-[40px] font-semibold leading-tight bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent print:text-teal-700">
                The AI-Powered Hybrid Accelerator for Building Startups from Idea to Scale
              </p>
              <p className="mt-7 max-w-[1350px] text-[26px] leading-[1.5] text-slate-300 print:text-gray-700">
                Startup Factory Hub is a <span className="text-white font-semibold">hybrid digital-physical accelerator</span> that combines <span className="text-white font-semibold">AI-powered technology</span>, expert mentorship, strategic resources, and a global network to help founders build, validate, launch, and scale companies.
              </p>
              <p className="mt-5 text-[24px] tracking-[0.25em] uppercase text-teal-300 print:text-teal-700">
                From idea to MVP <span className="text-slate-500">/</span> From MVP to market <span className="text-slate-500">/</span> From market to scale
              </p>

              <div className="mt-auto w-full">
                <p className="max-w-[1350px] mx-auto text-[22px] leading-[1.5] text-slate-400 print:text-gray-700">
                  <span className="text-teal-300 font-semibold">Hybrid A.I. Accelerator:</span> Not just software—an <span className="text-white">intelligent operating system</span> that merges AI automation, physical workspaces, global resources, and human expertise into one continuous execution engine across global locations.
                </p>
                <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
                <div className="mt-6 flex items-center justify-between text-[20px] tracking-[0.2em] uppercase">
                  <div className="flex items-center gap-8 text-slate-300">
                    {[{ icon: Rocket, l: "Startups" }, { icon: Users, l: "Mentors" }, { icon: Diamond, l: "Investors" }, { icon: GraduationCap, l: "Students" }, { icon: Building2, l: "Accelerators" }].map((u) => (
                      <span key={u.l} className="flex items-center gap-2"><u.icon className="h-5 w-5 text-teal-300" />{u.l}</span>
                    ))}
                  </div>
                  <span className="flex items-center gap-2 text-cyan-300"><Globe className="h-5 w-5" />Orlando · Santiago · Tokyo · Sevilla</span>
                </div>
              </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 2: End-to-End Startup Execution */}
        <SlideWrapper>
          <section className="absolute inset-0 overflow-hidden bg-slate-950 print:relative print:break-after-page print:bg-white">
            <img src={slide2Img} alt="Founders around a holographic AI globe" className="absolute left-0 top-0 h-full w-[58%] object-cover print:hidden" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.1)_0%,rgba(2,6,23,0.35)_35%,rgba(2,6,23,0.95)_55%,rgb(2,6,23)_65%)] print:hidden" />
            <div className="absolute left-[46%] top-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-teal-400/10 animate-[spin_80s_linear_infinite] print:hidden">
              <div className="absolute top-0 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300 shadow-[0_0_24px_6px_rgba(45,212,191,0.6)]" />
            </div>

            <div className="relative z-10 h-full ml-auto w-[48%] flex flex-col justify-center pr-[110px]">
              <span className="text-[22px] font-medium text-teal-300 tracking-[0.35em] uppercase print:text-gray-600">End-to-End Startup Execution</span>
              <h2 className="mt-5 text-[80px] leading-[1] font-bold tracking-tight bg-gradient-to-r from-white via-teal-100 to-cyan-300 bg-clip-text text-transparent print:text-black">
                The AI-Powered Hybrid Accelerator
              </h2>
              <p className="mt-6 text-[24px] tracking-[0.2em] text-slate-300 uppercase print:text-gray-600">
                AI-Powered <span className="text-teal-400">•</span> Human-Led <span className="text-teal-400">•</span> Hybrid <span className="text-teal-400">•</span> Global
              </p>
              <p className="mt-6 text-[26px] leading-[1.45] text-slate-300 print:text-gray-700">
                A <span className="text-white font-semibold">continuous accelerator</span> taking startups from <span className="text-teal-300">idea to MVP, MVP to market, and market to scale.</span>
              </p>

              <div className="mt-12 grid grid-cols-2 gap-x-10 gap-y-8">
                {[
                  { icon: Cpu, title: "AI-Powered Execution" },
                  { icon: Globe, title: "Digital + Physical" },
                  { icon: Users, title: "Human Expertise" },
                  { icon: Network, title: "Strategic Ecosystem" },
                  { icon: DollarSign, title: "Capital & Market Access" },
                  { icon: Zap, title: "Continuous Acceleration" },
                ].map((p, i) => (
                  <div key={i} className="group flex items-center gap-4 transition-transform duration-500 hover:translate-x-1">
                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-teal-400/10 shadow-[0_0_30px_rgba(45,212,191,0.25)] group-hover:shadow-[0_0_40px_rgba(103,232,249,0.55)] transition-shadow">
                      <p.icon className="h-7 w-7 text-teal-300 print:text-teal-700" />
                    </span>
                    <h4 className="text-[27px] font-semibold text-white print:text-black">{p.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 3: The Problem - The Execution Gap */}
        <SlideWrapper>
          <section className="absolute inset-0 overflow-hidden bg-slate-950 print:relative print:break-after-page print:bg-white">
            <img src={slide3Img} alt="Founder facing a broken path" className="absolute right-0 top-0 h-full w-[58%] object-cover print:hidden" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(2,6,23,0.05)_0%,rgba(2,6,23,0.35)_35%,rgba(2,6,23,0.95)_55%,rgb(2,6,23)_65%)] print:hidden" />

            <div className="relative z-10 h-full w-[52%] flex flex-col justify-center pl-[110px]">
              <span className="text-[22px] font-medium text-rose-300 tracking-[0.35em] uppercase print:text-gray-600">The Problem</span>
              <h2 className="mt-5 text-[96px] leading-none font-bold tracking-tight bg-gradient-to-r from-white via-rose-100 to-rose-300 bg-clip-text text-transparent print:text-black">
                The Execution Gap
              </h2>
              <p className="mt-6 text-[26px] leading-[1.45] text-slate-300 print:text-gray-700">
                Resources are <span className="text-white font-semibold">fragmented</span>. Founders get support at one stage—then navigate the next alone.
              </p>

              <div className="mt-10 flex items-center gap-3 text-[20px] tracking-[0.18em] uppercase">
                {["Education", "Product", "Market", "Revenue", "Scale"].map((s, i) => (
                  <span key={s} className="flex items-center gap-3">
                    <span className="text-white font-semibold">{s}</span>
                    {i < 4 && <span className="text-rose-400 font-bold">×</span>}
                  </span>
                ))}
              </div>

              <div className="mt-12 flex flex-col gap-5">
                {[
                  "Fragmented Support",
                  "Short-Term Programs",
                  "Limited Operator Access",
                  "Capital Is Not Enough",
                  "Learning Doesn't Equal Traction",
                ].map((t, i) => (
                  <div key={t} className="group flex items-baseline gap-6 transition-transform duration-500 hover:translate-x-1">
                    <span className="text-[30px] font-bold w-12 bg-gradient-to-b from-rose-200 to-rose-500/50 bg-clip-text text-transparent">0{i + 1}</span>
                    <h4 className="text-[32px] font-semibold text-white print:text-black">{t}</h4>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 4: Solution - Unified Execution */}
        <SlideWrapper>
          <section className="absolute inset-0 overflow-hidden bg-slate-950 print:relative print:break-after-page print:bg-white">
            <div className="absolute right-[-200px] top-[-200px] w-[800px] h-[800px] rounded-full bg-emerald-400/10 blur-[120px] print:hidden" />
            <div className="absolute left-[120px] top-[200px] w-[700px] h-[700px] rounded-full bg-teal-400/15 blur-[140px] print:hidden" />
            <div className="absolute inset-x-0 bottom-0 h-[40%] opacity-30 print:hidden [background-image:linear-gradient(rgba(45,212,191,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.25)_1px,transparent_1px)] [background-size:80px_80px] [transform:perspective(900px)_rotateX(60deg)] origin-bottom [mask-image:linear-gradient(to_top,black,transparent)]" />

            {/* Live platform interface */}
            <div className="absolute left-[4%] top-1/2 -translate-y-1/2 w-[36%] aspect-[4/3] print:hidden" style={{ perspective: 1800 }}>
              <div className="absolute left-0 top-[10%] w-[88%] rounded-2xl overflow-hidden bg-slate-900 ring-1 ring-emerald-300/30 shadow-[0_0_80px_rgba(45,212,191,0.35),0_40px_80px_rgba(0,0,0,0.6)] transition-transform duration-700 hover:[transform:rotateY(0deg)_rotateX(0deg)]" style={{ transform: 'rotateY(14deg) rotateX(4deg)' }}>
                <div className="flex items-center gap-2 px-4 h-9 bg-slate-950/90 border-b border-white/5">
                  <span className="w-3 h-3 rounded-full bg-rose-400/70" /><span className="w-3 h-3 rounded-full bg-amber-300/70" /><span className="w-3 h-3 rounded-full bg-emerald-400/70" />
                  <span className="ml-4 text-[14px] text-slate-400 tracking-wide">startupfactoryhub.com / journey</span>
                </div>
                <img src={shotJourney} alt="Startup Factory Hub Journey interface" className="w-full block" crossOrigin="anonymous" />
              </div>
              <div className="absolute right-0 top-0 w-[38%] rounded-xl overflow-hidden ring-1 ring-teal-300/40 shadow-[0_0_50px_rgba(45,212,191,0.4),0_30px_60px_rgba(0,0,0,0.6)] animate-[float_6s_ease-in-out_infinite]" style={{ transform: 'rotateY(14deg)' }}>
                <img src={shotMatching} alt="AI matching interface" className="w-full block" crossOrigin="anonymous" />
              </div>
              <div className="absolute right-0 bottom-0 w-[42%] rounded-xl overflow-hidden ring-1 ring-emerald-300/40 shadow-[0_0_50px_rgba(52,211,153,0.4),0_30px_60px_rgba(0,0,0,0.6)] animate-[float_7s_ease-in-out_infinite_1s]" style={{ transform: 'rotateY(14deg)' }}>
                <img src={shotAITools} alt="AI tools interface" className="w-full block" crossOrigin="anonymous" />
              </div>
              <div className="absolute left-[4%] bottom-[2%] flex items-center gap-3 px-5 py-3 rounded-full bg-slate-950/80 backdrop-blur ring-1 ring-emerald-300/30">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                <span className="text-[16px] tracking-[0.25em] uppercase text-emerald-200">Live Platform</span>
              </div>
            </div>

            <div className="relative z-10 h-full ml-auto w-[58%] flex flex-col justify-center pr-[100px]">
              <span className="text-[22px] font-medium text-emerald-300 tracking-[0.35em] uppercase print:text-gray-600">Solution</span>
              <h2 className="mt-4 text-[88px] leading-none font-bold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-teal-300 bg-clip-text text-transparent print:text-black">
                Unified Execution
              </h2>
              <p className="mt-4 text-[30px] font-semibold text-teal-300 print:text-teal-700">The AI-Powered Hybrid Accelerator</p>
              <p className="mt-5 text-[25px] leading-[1.45] text-slate-300 print:text-gray-700">
                AI, people, resources, market access, and capital—<span className="text-white font-semibold">in one continuous accelerator.</span> No more program to program, tool to tool, mentor to mentor.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-x-10 gap-y-7">
                {[
                  { icon: Cpu, t: "AI-Powered Acceleration" },
                  { icon: Globe, t: "Digital + Physical" },
                  { icon: Users, t: "Human Expertise" },
                  { icon: Building2, t: "Market & Corporate Access" },
                  { icon: DollarSign, t: "Capital Connectivity" },
                  { icon: Network, t: "Global Resource Network" },
                ].map((p) => (
                  <div key={p.t} className="group flex items-center gap-4 transition-transform duration-500 hover:translate-x-1">
                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-400/10 shadow-[0_0_30px_rgba(52,211,153,0.25)] group-hover:shadow-[0_0_40px_rgba(52,211,153,0.55)] transition-shadow">
                      <p.icon className="h-7 w-7 text-emerald-300 print:text-emerald-700" />
                    </span>
                    <h4 className="text-[26px] font-semibold text-white print:text-black">{p.t}</h4>
                  </div>
                ))}
              </div>

              <div className="mt-12">
                <p className="text-[22px] tracking-[0.3em] uppercase text-slate-400">One Accelerator. Every Stage.</p>
                <div className="mt-4 flex items-center gap-3 text-[24px] font-semibold tracking-[0.15em] uppercase">
                  {["Idea", "Build", "Validate", "Launch", "Fund", "Scale"].map((s, i) => (
                    <span key={s} className="flex items-center gap-3">
                      <span className="text-white">{s}</span>
                      {i < 5 && <ArrowRight className="h-5 w-5 text-emerald-400" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 5: Ecosystem Overview - Orbital ecosystem + journey */}
        <SlideWrapper>
          <section className="absolute inset-0 overflow-hidden bg-slate-950 print:relative print:break-after-page print:bg-white">
            <div className="absolute left-[-150px] top-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-teal-400/10 blur-[140px] print:hidden" />
            <div className="absolute right-[-200px] bottom-[-200px] w-[700px] h-[700px] rounded-full bg-emerald-400/10 blur-[120px] print:hidden" />
            <div className="absolute inset-x-0 bottom-0 h-[35%] opacity-25 print:hidden [background-image:linear-gradient(rgba(45,212,191,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.25)_1px,transparent_1px)] [background-size:80px_80px] [transform:perspective(900px)_rotateX(60deg)] origin-bottom [mask-image:linear-gradient(to_top,black,transparent)]" />

            {/* Orbital ecosystem */}
            <div className="absolute left-[5%] top-1/2 -translate-y-1/2 w-[720px] h-[720px]">
              <div className="absolute inset-0 rounded-full border border-teal-300/20" />
              <div className="absolute inset-[90px] rounded-full border border-dashed border-teal-300/25 animate-[spin_60s_linear_infinite] print:hidden" />
              <div className="absolute inset-[190px] rounded-full border border-emerald-300/20" />
              <div className="absolute inset-[260px] rounded-full bg-teal-400/20 blur-3xl print:hidden" />
              <div className="absolute inset-0 animate-[spin_40s_linear_infinite] print:hidden">
                <span className="absolute left-1/2 top-[-6px] w-3 h-3 rounded-full bg-teal-300 shadow-[0_0_20px_rgba(94,234,212,1)]" />
              </div>
              <img src={sfhLogo} alt="Startup Factory Hub" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] object-contain drop-shadow-[0_0_60px_rgba(45,212,191,0.6)]" crossOrigin="anonymous" />
              {[
                { icon: Rocket, label: "Startups" },
                { icon: Diamond, label: "Investors" },
                { icon: Lightbulb, label: "Mentors" },
                { icon: Award, label: "Advisors" },
                { icon: GraduationCap, label: "Students" },
                { icon: Building2, label: "Accelerators" },
                { icon: Handshake, label: "Corporates" },
                { icon: Network, label: "Admins" },
              ].map((u, i) => {
                const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
                const r = 270;
                return (
                  <div key={u.label} className="group absolute flex flex-col items-center gap-2 -translate-x-1/2 -translate-y-1/2" style={{ left: 360 + Math.cos(a) * r, top: 360 + Math.sin(a) * r }}>
                    <div className="w-[76px] h-[76px] rounded-full bg-slate-950 ring-1 ring-teal-300/50 flex items-center justify-center shadow-[0_0_30px_rgba(45,212,191,0.35)] transition-all duration-500 group-hover:scale-110 group-hover:ring-teal-200 group-hover:shadow-[0_0_50px_rgba(45,212,191,0.7)]">
                      <u.icon className="w-8 h-8 text-teal-300" />
                    </div>
                    <span className="text-[17px] font-semibold tracking-wide text-white whitespace-nowrap">{u.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Content */}
            <div className="relative z-10 h-full ml-auto w-[52%] flex flex-col justify-center pr-[100px]">
              <span className="text-[22px] font-medium text-teal-300 tracking-[0.35em] uppercase print:text-gray-600">Ecosystem</span>
              <h2 className="mt-4 text-[88px] leading-none font-bold tracking-tight bg-gradient-to-r from-white via-teal-100 to-emerald-300 bg-clip-text text-transparent print:text-black">
                Ecosystem Overview
              </h2>
              <p className="mt-6 text-[26px] leading-[1.45] text-slate-300 print:text-gray-700">
                One platform. <span className="text-white font-semibold">8 stakeholder types.</span> Role-specific dashboards and AI-powered workflow automation.
              </p>

              <span className="mt-14 text-[18px] tracking-[0.35em] uppercase text-slate-400">Startup Journey Roadmap</span>
              <div className="relative mt-8">
                <div className="absolute left-[34px] right-[34px] top-[34px] h-[2px] bg-gradient-to-r from-teal-300/10 via-teal-300/70 to-emerald-300/10" />
                <div className="absolute left-[34px] right-[34px] top-[34px] h-[6px] -translate-y-[2px] bg-teal-300/30 blur-md print:hidden" />
                <div className="relative grid grid-cols-6">
                  {[
                    { icon: Lightbulb, label: "Idea" },
                    { icon: Search, label: "Research" },
                    { icon: Cpu, label: "MVP" },
                    { icon: Target, label: "Validation" },
                    { icon: Rocket, label: "Launch" },
                    { icon: TrendingUp, label: "Growth" },
                  ].map((s, i) => (
                    <div key={s.label} className="group flex flex-col items-center">
                      <div className="w-[68px] h-[68px] rounded-full bg-slate-950 ring-1 ring-emerald-300/50 flex items-center justify-center shadow-[0_0_25px_rgba(52,211,153,0.35)] transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_45px_rgba(52,211,153,0.7)]">
                        <s.icon className="w-7 h-7 text-emerald-300" />
                      </div>
                      <span className="mt-4 text-[14px] tracking-[0.3em] text-teal-300/70">0{i + 1}</span>
                      <span className="mt-1 text-[20px] font-semibold text-white">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </SlideWrapper>
        {/* SLIDE 6: Market Opportunity */}
        <SlideWrapper>
           <section className="absolute inset-0 flex flex-col items-center justify-center p-[1.5%] print:relative print:p-8 print:break-after-page print:bg-white">
            <img src={issMarketBg} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 print:hidden" />
            <div className="absolute inset-[1%] border-2 border-teal-500/30 rounded-lg print:border-gray-300" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full mx-auto px-[2%]">
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-3 h-3 bg-teal-500 rotate-45" />
              <span className="text-base font-semibold text-teal-400 tracking-[0.3em] uppercase print:text-gray-600">Growth Landscape</span>
              <div className="w-3 h-3 bg-teal-500 rotate-45" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 print:text-black">Market Opportunity</h2>
            <p className="text-xl md:text-2xl text-slate-300 text-center mb-5 print:text-gray-600">$25B+ Global Accelerator & Startup Services Market</p>
            
            {/* TAM / SAM / SOM Concentric Rings */}
            <div className="flex flex-col md:flex-row items-center gap-10 w-full mb-6">
              {/* Animated Concentric Circles */}
              <div className="relative shrink-0 mx-auto" style={{ width: 320, height: 320 }}>
                {/* TAM - Outer */}
                <div className="absolute inset-0 rounded-full border-2 border-teal-500/30 animate-[pulse_3s_ease-in-out_infinite] flex items-center justify-center">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-teal-500/20 border border-teal-500/40 rounded text-sm font-bold text-teal-400 whitespace-nowrap">TAM $25B+</div>
                </div>
                {/* SAM - Middle */}
                <div className="absolute inset-[18%] rounded-full border-2 border-cyan-500/40 bg-cyan-500/5 animate-[pulse_3s_ease-in-out_infinite_0.5s] flex items-center justify-center">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded text-sm font-bold text-cyan-400 whitespace-nowrap">SAM $8.5B</div>
                </div>
                {/* SOM - Inner */}
                <div className="absolute inset-[38%] rounded-full border-2 border-emerald-500/60 bg-emerald-500/10 animate-[pulse_3s_ease-in-out_infinite_1s] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-black text-emerald-400">$250M</div>
                    <div className="text-xs text-emerald-400/80 font-medium">SOM Y5</div>
                  </div>
                </div>
              </div>

              {/* Market Segments - Animated Bars */}
              <div className="flex-1 w-full space-y-4">
                <h3 className="text-base font-bold text-teal-400 mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Industry Growth by Segment
                </h3>
                {[
                  { label: "Startup Accelerators", value: 78, amount: "$9.2B", color: "from-teal-500 to-teal-400", delay: "0.2s" },
                  { label: "AI/ML Startup Tools", value: 92, amount: "$6.8B", color: "from-cyan-500 to-cyan-400", delay: "0.4s" },
                  { label: "Coworking & Innovation Hubs", value: 65, amount: "$4.1B", color: "from-purple-500 to-purple-400", delay: "0.6s" },
                  { label: "Venture Services Platforms", value: 55, amount: "$3.2B", color: "from-emerald-500 to-emerald-400", delay: "0.8s" },
                  { label: "EdTech for Entrepreneurs", value: 45, amount: "$1.9B", color: "from-amber-500 to-amber-400", delay: "1s" },
                ].map((segment, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-300 font-medium">{segment.label}</span>
                      <span className="text-sm text-slate-400 font-bold">{segment.amount}</span>
                    </div>
                    <div className="w-full h-6 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                      <div 
                        className={`h-full bg-gradient-to-r ${segment.color} rounded-full relative`}
                        style={{ 
                          width: `${segment.value}%`, 
                          animation: `slideInWidth 1.5s ease-out ${segment.delay} both`
                        }}
                      >
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white/90">{segment.value}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Drivers + Regions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
              <TechCard glowColor="teal" className="p-5">
                <h3 className="font-semibold text-base mb-3 text-teal-400 flex items-center gap-2 print:text-teal-700">
                  <TrendingUp className="h-5 w-5" /> Growth Drivers
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: TrendingUp, text: "15% CAGR in startup ecosystem growth", color: "emerald", stat: "15%" },
                    { icon: Cpu, text: "AI adoption in business services accelerating", color: "cyan", stat: "3.2x" },
                    { icon: Globe, text: "Global entrepreneurship at record levels", color: "purple", stat: "582M" },
                    { icon: Building2, text: "Hybrid work driving coworking demand", color: "amber", stat: "+40%" },
                  ].map((driver, i) => (
                    <div key={i} className="flex items-center gap-3 group" style={{ animation: `fade-in 0.5s ease-out ${0.3 + i * 0.15}s both` }}>
                      <div className={`w-12 h-12 rounded-lg bg-${driver.color}-500/20 border border-${driver.color}-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <span className={`text-sm font-black text-${driver.color}-400`}>{driver.stat}</span>
                      </div>
                      <span className="text-sm text-slate-300 leading-relaxed">{driver.text}</span>
                    </div>
                  ))}
                </div>
              </TechCard>

              <TechCard glowColor="cyan" className="p-5">
                <h3 className="font-semibold text-base mb-3 text-cyan-400 flex items-center gap-2 print:text-cyan-700">
                  <Globe className="h-5 w-5" /> Target Regions
                </h3>
                <div className="space-y-3">
                  {[
                    { region: "North America", share: 35, color: "from-teal-500 to-teal-400" },
                    { region: "Europe", share: 28, color: "from-cyan-500 to-cyan-400" },
                    { region: "Asia-Pacific", share: 22, color: "from-purple-500 to-purple-400" },
                    { region: "Latin America", share: 10, color: "from-amber-500 to-amber-400" },
                    { region: "Middle East & Africa", share: 5, color: "from-rose-500 to-rose-400" },
                  ].map((r, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-slate-300">{r.region}</span>
                        <span className="text-sm text-slate-400 font-bold">{r.share}%</span>
                      </div>
                      <div className="w-full h-4 bg-slate-800/80 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${r.color} rounded-full`}
                          style={{ 
                            width: `${r.share}%`, 
                            animation: `slideInWidth 1.2s ease-out ${0.5 + i * 0.15}s both`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </TechCard>
            </div>

            {/* Inline keyframes style */}
            <style>{`
              @keyframes slideInWidth {
                from { width: 0%; }
              }
            `}</style>
          </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 7: Business Model & Revenue Streams */}
        <SlideContainer>
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-3 h-3 bg-emerald-500 rotate-45" />
              <span className="text-base font-semibold text-emerald-400 tracking-[0.3em] uppercase print:text-gray-600">Monetization</span>
              <div className="w-3 h-3 bg-emerald-500 rotate-45" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 print:text-black">Business Model & Revenue Streams</h2>
            <p className="text-lg md:text-xl text-slate-300 text-center mb-5 print:text-gray-600">
              Freemium adoption drives monetization through tiered subscriptions + enterprise revenue streams
            </p>
            
            {/* Core Growth Model */}
            <div className="grid grid-cols-3 gap-5 w-full mb-5">
              <TechCard glowColor="teal" className="p-5">
                <h3 className="font-semibold text-sm text-teal-400 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Growth Engine
                </h3>
                <div className="space-y-2 text-sm text-slate-300 print:text-gray-600">
                  <p><span className="text-teal-400 font-medium">Start:</span> 100 startups Month 1</p>
                  <p><span className="text-teal-400 font-medium">Growth:</span> 10% MoM compound</p>
                  <p><span className="text-teal-400 font-medium">Model:</span> 40% Free / 60% Paid</p>
                </div>
              </TechCard>
              
              <TechCard glowColor="emerald" className="p-5">
                <h3 className="font-semibold text-sm text-emerald-400 mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5" /> Subscription Tiers
                </h3>
                <div className="space-y-2 text-sm text-slate-300 print:text-gray-600">
                  <div className="flex justify-between"><span>Early Stage</span><span className="text-emerald-400">$350/mo</span></div>
                  <div className="flex justify-between"><span>Build Stage</span><span className="text-emerald-400">$550/mo</span></div>
                  <div className="flex justify-between"><span>Growth Stage</span><span className="text-emerald-400">$950/mo</span></div>
                  <div className="flex justify-between"><span>Scale Stage</span><span className="text-emerald-400">$1,500/mo</span></div>
                  <div className="flex justify-between border-t border-emerald-500/30 pt-2 mt-2"><span className="font-medium">Blended ARPU</span><span className="text-emerald-400 font-bold">$813/mo</span></div>
                </div>
              </TechCard>
              
              <TechCard glowColor="cyan" className="p-5">
                <h3 className="font-semibold text-sm text-cyan-400 mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> 5-Year Startup Growth
                </h3>
                <div className="space-y-2 text-sm text-slate-300 print:text-gray-600">
                  <div className="flex justify-between"><span>Year 1</span><span className="text-cyan-400">~190 startups</span></div>
                  <div className="flex justify-between"><span>Year 2</span><span className="text-cyan-400">~540 startups</span></div>
                  <div className="flex justify-between"><span>Year 3</span><span className="text-cyan-400">~1,550 startups</span></div>
                  <div className="flex justify-between"><span>Year 4</span><span className="text-cyan-400">~4,420 startups</span></div>
                  <div className="flex justify-between"><span>Year 5</span><span className="text-cyan-400 font-bold">~12,650 startups</span></div>
                </div>
              </TechCard>
            </div>
            
            {/* Revenue Streams Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 w-full">
              <TechCard glowColor="purple" className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-purple-400">Corporate Partners</h3>
                </div>
                <p className="text-sm text-slate-300 print:text-gray-600">
                  <span className="text-purple-400 font-medium">$100K/year</span> per partner
                </p>
              </TechCard>
              
              <TechCard glowColor="amber" className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Target className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-amber-400">Pilot Programs</h3>
                </div>
                <p className="text-sm text-slate-300 print:text-gray-600">
                  <span className="text-amber-400 font-medium">$200K</span> per pilot (2+/year)
                </p>
              </TechCard>
              
              <TechCard glowColor="rose" className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-rose-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-rose-400">New Chapters</h3>
                </div>
                <p className="text-sm text-slate-300 print:text-gray-600">
                  <span className="text-rose-400 font-medium">$200K</span> per chapter (2+/year)
                </p>
              </TechCard>
              
              <TechCard glowColor="teal" className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                    <Award className="h-5 w-5 text-teal-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-teal-400">Sponsorships</h3>
                </div>
                <p className="text-sm text-slate-300 print:text-gray-600">
                  <span className="text-teal-400 font-medium">$5K-$50K</span> (avg $20K/sponsor)
                </p>
              </TechCard>
              
              <TechCard glowColor="cyan" className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-cyan-400">Education Programs</h3>
                </div>
                <p className="text-sm text-slate-300 print:text-gray-600">
                  <span className="text-cyan-400 font-medium">$10K avg</span> (100 students Y1, 2x/year)
                </p>
              </TechCard>
              
              <TechCard glowColor="emerald" className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-emerald-400">Platform Transaction Fees</h3>
                </div>
                <p className="text-sm text-slate-300 print:text-gray-600">
                  <span className="text-emerald-400 font-medium">10%</span> on event tickets & marketplace · <span className="text-emerald-400 font-medium">20%</span> on donations
                </p>
              </TechCard>

            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 8: Financial Projections */}
        <SlideContainer>
          <div className="flex flex-col items-center h-full w-full">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-3 h-3 bg-emerald-500 rotate-45" />
              <span className="text-base font-semibold text-emerald-400 tracking-[0.3em] uppercase print:text-gray-600">Projections</span>
              <div className="w-3 h-3 bg-emerald-500 rotate-45" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 print:text-black">5-Year Financial Projections</h2>
            <p className="text-base md:text-lg text-slate-300 text-center mb-4 print:text-gray-600">
              Compounding growth delivers <span className="text-emerald-400 font-semibold">8.6x revenue increase</span> over 5 years
            </p>
            
            {/* Charts Row: Bar Chart + Funding Allocation */}
            <div className="flex gap-5 w-full mb-4">
              {/* Revenue Bar Chart */}
              <div className="flex-[3]">
                <TechCard glowColor="emerald" className="p-5 h-full">
                  <div className="flex">
                    {/* Y-axis */}
                    <div className="flex flex-col justify-between h-56 pr-3 text-right shrink-0">
                      <span className="text-xs text-slate-500">$50M</span>
                      <span className="text-xs text-slate-500">$40M</span>
                      <span className="text-xs text-slate-500">$30M</span>
                      <span className="text-xs text-slate-500">$20M</span>
                      <span className="text-xs text-slate-500">$10M</span>
                      <span className="text-xs text-slate-500">$0</span>
                    </div>
                    {/* Chart area */}
                    <div className="flex-1 relative h-56 border-b border-l border-slate-700/40">
                      {[20, 40, 60, 80].map((p) => (
                        <div key={p} className="absolute w-full border-t border-dashed border-slate-700/20" style={{ bottom: `${p}%` }} />
                      ))}
                      <div className="absolute inset-0 flex items-end px-4 gap-3">
                        {[
                          { revenue: "$5.34M", value: 5.34, color: "bg-gradient-to-t from-teal-700 to-teal-400" },
                          { revenue: "$9.65M", value: 9.65, color: "bg-gradient-to-t from-teal-600 to-cyan-400" },
                          { revenue: "$16.50M", value: 16.50, color: "bg-gradient-to-t from-cyan-600 to-cyan-400" },
                          { revenue: "$27.30M", value: 27.30, color: "bg-gradient-to-t from-cyan-600 to-emerald-400" },
                          { revenue: "$46.00M", value: 46.00, color: "bg-gradient-to-t from-emerald-600 to-emerald-400" },
                        ].map((item, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                            <span className="text-xs font-bold text-emerald-400 mb-1 shrink-0">{item.revenue}</span>
                            <div
                              className={`w-full max-w-[60px] ${item.color} rounded-t-md relative overflow-hidden shadow-lg shadow-emerald-500/10 shrink-0`}
                              style={{ height: `${(item.value / 50) * 224}px` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex pl-10">
                    {[
                      { year: "Year 1", pct: "" },
                      { year: "Year 2", pct: "+81%" },
                      { year: "Year 3", pct: "+71%" },
                      { year: "Year 4", pct: "+65%" },
                      { year: "Year 5", pct: "+68%" },
                    ].map((item, i) => (
                      <div key={i} className="flex-1 text-center pt-2">
                        <span className="text-xs text-slate-400 font-medium block">{item.year}</span>
                        {item.pct && <span className="text-xs text-emerald-400/80 font-semibold">{item.pct}</span>}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-emerald-500/20">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-slate-300">
                      <span className="text-emerald-400 font-semibold">+762%</span> growth • 10% MoM • $5.34M → $46M
                    </span>
                  </div>
                </TechCard>
              </div>

              {/* Funding Allocation */}
              <div className="flex-[2]">
                <TechCard glowColor="cyan" className="p-5 h-full flex flex-col items-center justify-center">
                  <h4 className="text-base font-bold text-cyan-400 mb-1 text-center">Raising $1.5M</h4>
                  <p className="text-xs text-slate-500 mb-3 text-center">Seed Round · 18-Month Runway</p>
                  
                  {/* Pie SVG Chart */}
                  <div className="relative w-[240px] h-[240px] mx-auto mb-4">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {(() => {
                        const cx = 100, cy = 100, r = 85;
                        const segments = [
                          { pct: 55, color: '#14b8a6', label: '55%' },
                          { pct: 25, color: '#06b6d4', label: '25%' },
                          { pct: 12, color: '#a855f7', label: '12%' },
                          { pct: 8, color: '#f59e0b', label: '8%' },
                        ];
                        let startAngle = -90;
                        return segments.map((seg, i) => {
                          const sweep = (seg.pct / 100) * 360;
                          const endAngle = startAngle + sweep;
                          const midAngle = startAngle + sweep / 2;
                          const startRad = (startAngle * Math.PI) / 180;
                          const endRad = (endAngle * Math.PI) / 180;
                          const midRad = (midAngle * Math.PI) / 180;
                          const x1 = cx + r * Math.cos(startRad);
                          const y1 = cy + r * Math.sin(startRad);
                          const x2 = cx + r * Math.cos(endRad);
                          const y2 = cy + r * Math.sin(endRad);
                          const largeArc = sweep > 180 ? 1 : 0;
                          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                          const labelR = r * 0.6;
                          const lx = cx + labelR * Math.cos(midRad);
                          const ly = cy + labelR * Math.sin(midRad);
                          startAngle = endAngle;
                          return (
                            <g key={i}>
                              <path d={path} fill={seg.color} stroke="rgba(15,23,42,0.8)" strokeWidth="2" opacity="0.85" />
                              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="13" fontWeight="bold">{seg.label}</text>
                            </g>
                          );
                        });
                      })()}
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-1 gap-2 w-full">
                    {[
                      { label: 'Growth & Distribution', pct: '55%', amount: '$825K', color: 'bg-teal-500' },
                      { label: 'Product & Technology', pct: '25%', amount: '$375K', color: 'bg-cyan-500' },
                      { label: 'Operations & Legal', pct: '12%', amount: '$180K', color: 'bg-purple-500' },
                      { label: 'Strategic Reserve', pct: '8%', amount: '$120K', color: 'bg-amber-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-sm ${item.color} shrink-0`} />
                        <span className="text-sm text-slate-300 flex-1">{item.label}</span>
                        <span className="text-sm font-bold text-white">{item.pct}</span>
                        <span className="text-xs text-slate-500">{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </TechCard>

              </div>
            </div>
            
            {/* Year 5 Revenue Breakdown - Horizontal Stacked Bar */}
            <div className="w-full mb-4">
              <TechCard glowColor="teal" className="p-4">
                <h4 className="text-sm font-semibold text-center text-teal-400 mb-3">Year 5 Revenue Mix: $46M · driven by SaaS + platform fees (10% marketplace / 20% donations)</h4>
                <div className="flex items-center h-9 rounded-lg overflow-hidden border border-slate-700/50">
                  <div className="h-full bg-gradient-to-r from-teal-600 to-teal-500 flex items-center justify-center relative" style={{ width: '68%' }}>
                    <span className="text-xs font-medium text-white">Subscriptions $31.3M</span>
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-slate-900/50" />
                  </div>
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center relative" style={{ width: '14%' }}>
                    <span className="text-xs font-medium text-white">Fees $6.4M</span>
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-slate-900/50" />
                  </div>
                  <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-500 flex items-center justify-center relative" style={{ width: '11%' }}>
                    <span className="text-xs font-medium text-white">Edu $5.1M</span>
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-slate-900/50" />
                  </div>
                  <div className="h-full bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center" style={{ width: '7%' }}>
                    <span className="text-xs font-medium text-white">Ent $3.2M</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2 px-1">
                  <span>Subscriptions 68%</span>
                  <span>Platform Fees 14%</span>
                  <span>Education 11%</span>
                  <span>Enterprise 7%</span>
                </div>

              </TechCard>
            </div>
            
            {/* Revenue Streams Summary - Compact Grid */}
            <div className="grid grid-cols-6 gap-3 w-full mb-3">
              {[{
              label: "Startups Y5",
              value: "~12,650",
              icon: Rocket,
              color: "teal"
            }, {
              label: "ARPU",
              value: "$750/mo",
              icon: DollarSign,
              color: "emerald"
            }, {
              label: "Corporate",
              value: "$100K/yr",
              icon: Building2,
              color: "purple"
            }, {
              label: "Pilots",
              value: "$200K ea",
              icon: Target,
              color: "amber"
            }, {
              label: "Marketplace Fee",
              value: "10%",
              icon: Percent,
              color: "emerald"
            }, {
              label: "Donation Fee",
              value: "20%",
              icon: Heart,
              color: "rose"
            }, {
              label: "Education",
              value: "2x/yr",
              icon: GraduationCap,
              color: "cyan"
            }].map((item, i) => <div key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-3 text-center">
                  <item.icon className={`h-5 w-5 mx-auto mb-2 text-${item.color}-400`} />
                  <p className={`text-sm font-bold text-${item.color}-400`}>{item.value}</p>
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>)}
            </div>
            
            {/* Model Summary */}
            <div className="w-full">
              <div className="bg-slate-900/40 border border-emerald-500/20 rounded-lg px-4 py-3">
                <p className="text-sm text-center text-slate-400">
                  <span className="text-emerald-400 font-medium">Model:</span> $1.5M seed → 100 startups → 10% MoM growth → 60% paid ($750 ARPU) + 10% marketplace fees + 20% donation fees + enterprise = $46M Year 5
                </p>
              </div>
            </div>

          </div>
        </SlideContainer>
        {/* SLIDE 8: Our Partners */}
        <SlideWrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[1.5%] overflow-hidden print:relative print:p-8 print:break-after-page print:bg-white">
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat print:hidden" style={{ backgroundImage: `url(${jupiterBg})` }} />
            <div className="absolute inset-0 bg-slate-950/70 print:hidden" />
            <div className="absolute inset-[1%] border-2 border-teal-500/30 rounded-lg print:border-gray-300 z-[1]" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full mx-auto px-[2%]">
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-3 h-3 bg-teal-500 rotate-45" />
              <span className="text-base font-semibold text-teal-400 tracking-[0.3em] uppercase print:text-gray-600">Strategic Network</span>
              <div className="w-3 h-3 bg-teal-500 rotate-45" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 print:text-black">Our Partners & Network</h2>
            <p className="text-lg md:text-xl text-slate-300 text-center mb-6 print:text-gray-600">
              Backed by industry leaders and innovators shaping the future
            </p>
            
            {/* Partners Grid - 6 columns enlarged */}
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4 w-full">
              {[
                { name: "NASA", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/200px-NASA_logo.svg.png" },
                { name: "Google", logo: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" },
                { name: "HSBC Innovation Banking", logo: "/partners/hsbc-logo.png" },
                { name: "Nasdaq", logo: "/nasdaq-logo.png" },
                { name: "GitHub", logo: "/github-logo.png" },
                { name: "TradingView", logo: "/partners/tradingview-logo.png" },
                { name: "MongoDB", logo: "/mongodb-logo.webp" },
                { name: "NVIDIA Inception", logo: "https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/02-nvidia-logo-color-grn-500x200-4c25-p.png" },
                { name: "F6S", logo: "/partners/f6s-logo.png" },
                { name: "Flippa", logo: "/partners/flippa-logo.png" },
                { name: "IWG", logo: "/partners/iwg-logo.png" },
                { name: "Startup Factory Hub", logo: "/partners/regus-logo.png" },
                { name: "Advantary Capital", logo: "/partners/advantary-logo.jpg" },
                { name: "Lovable", logo: "/partners/lovable-logo.png" },
                { name: "Lehigh University", logo: "/lehigh-university-logo.png" },
                { name: "HubSpot", logo: "https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png" },
                { name: "Datadog", logo: "https://imgix.datadoghq.com/img/dd_logo_n_70x75.png" },
                { name: "LivePlan", logo: "/partners/liveplan-logo.png" },
                { name: "Decahedron Ventures", logo: "/partners/decahedron-ventures-logo.jpg" },
                { name: "Flusso Capital", logo: "/partners/flusso-capital-logo.png" },
                { name: "UK Venture Partners", logo: "/partners/uk-venture-logo.jpg" },
                { name: "Ducere University", logo: "/partners/ducere-logo.png" },
                { name: "HackerEarth", logo: "/partners/hackerearth-logo.png" },
                { name: "Orlandopreneur", logo: "/partners/orlandopreneur-logo.png" },
                { name: "Grupo Incostas", logo: "/partners/incostas-logo.png" },
                { name: "LOT Network", logo: "/partners/lotnetwork-logo.png" },
                { name: "Nouel Consult", logo: "/partners/nouel-logo.png" },
                { name: "PitchPerfecter.AI", logo: "/partners/pitchperfecter-logo.png" },
                { name: "WorkingAdvantage", logo: "/working-advantage-logo.png" },
              ].map((partner, i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-3 flex items-center justify-center h-20 hover:border-teal-500/40 transition-colors print:bg-gray-50 print:border-gray-300">
                  <img 
                    src={partner.logo} 
                    alt={partner.name}
                    className="max-h-12 max-w-[100px] object-contain filter brightness-90 hover:brightness-110 transition-all print:filter-none"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
            
            {/* Partner categories */}
            <div className="flex flex-wrap justify-center gap-3 mt-5">
              {["Technology", "Investment", "Academic", "Marketplace", "Legal", "Community"].map((category, i) => (
                <span key={i} className="px-4 py-1.5 text-sm font-medium bg-slate-800/60 border border-teal-500/20 rounded-full text-teal-400/80 print:bg-gray-100 print:border-gray-300 print:text-gray-600">
                  {category}
                </span>
              ))}
            </div>
          </div>
           </div>
          </section>
        </SlideWrapper>




        {/* SLIDE 10: Contact */}
        <SlideWrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[1.5%] overflow-hidden print:relative print:p-8 print:break-after-avoid print:bg-white">
            {/* Full background image */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat print:hidden" style={{ backgroundImage: `url(${rocketLaunchBg})` }} />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 print:hidden" />
            <div className="absolute inset-[1%] border-2 border-teal-500/30 rounded-lg print:border-gray-300 z-[1]" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full mx-auto px-[3%]">
          <div className="flex flex-col items-center text-center w-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-teal-500 rotate-45" />
              <span className="text-base font-semibold text-teal-400 tracking-[0.3em] uppercase print:text-gray-600">Get Involved</span>
              <div className="w-3 h-3 bg-teal-500 rotate-45" />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-3 print:text-black">Join Our Mission</h2>
            <p className="text-2xl md:text-3xl text-slate-300 mb-6 print:text-gray-600">Let's Build the Future Together</p>
            
            <p className="text-xl text-slate-400 max-w-4xl mb-10 leading-relaxed print:text-gray-600">
              We're looking for partners, investors, and innovators who share our vision of democratizing access to startup success.
            </p>
            
            <div className="flex flex-wrap gap-6 justify-center mb-10">
              <a href="mailto:contact@startupfactoryhub.com" className="inline-flex items-center gap-4 bg-slate-900/80 border-2 border-teal-500/40 rounded-xl px-10 py-5 hover:border-teal-500/60 transition-colors print:bg-white print:border-gray-300">
                <Mail className="h-7 w-7 text-teal-400 print:text-gray-700" />
                <span className="text-xl text-slate-200 font-medium print:text-gray-700">contact@startupfactoryhub.com</span>
              </a>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full scale-150 print:hidden" />
              <img src={sfhLogo} alt="Startup Factory Hub" className="relative w-36 h-36 object-contain" />
            </div>
            
            <p className="text-base text-slate-500 mt-10 print:text-gray-400">© 2025 Startup Factory Hub. All rights reserved.</p>
          </div>
            </div>
          </section>
        </SlideWrapper>
      </div>
    </div>;
}