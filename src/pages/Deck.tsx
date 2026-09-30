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
import slide2Img from '@/assets/deck-slide2-exec.jpg';
import slide3Img from '@/assets/deck-slide3-exec.jpg';
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
import teamStuberAsset from '@/assets/team-stuber.jpg.asset.json';
import teamCatramboneAsset from '@/assets/team-catrambone.png.asset.json';
import teamUlschAsset from '@/assets/team-ulsch.jpg.asset.json';
import teamRicardoAsset from '@/assets/team-ricardo-new.png.asset.json';
import teamKhaliaAsset from '@/assets/team-khalia-new.png.asset.json';
import { PARTNERS } from '@/config/partners';
import { supabase } from '@/integrations/supabase/client';
import nasdaqTower from '@/assets/nasdaq-feature.jpg';
import earthPlanet from '@/assets/earth-intelligence-pass.jpg';

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
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  useEffect(() => {
    supabase.from('profiles').select('id', { count: 'exact', head: true }).then(({ count }) => { if (typeof count === 'number' && count > 0) setTotalUsers(count); });
  }, []);
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
          <section className="absolute inset-0 overflow-hidden bg-[#03080a] print:relative print:break-after-page">
            <img src={slide2Img} alt="Startup team working together" className="absolute inset-0 h-full w-full object-cover opacity-60 scale-105" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,8,10,0.2)_0%,rgba(3,8,10,0.75)_45%,rgba(3,8,10,0.97)_62%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(3,8,10,0.9)_0%,transparent_35%)]" />
            <div className="absolute right-[-200px] top-[-200px] w-[800px] h-[800px] rounded-full bg-teal-400/10 blur-[140px]" />

            {/* Top editorial bar */}
            <div className="absolute top-[70px] left-[110px] right-[110px] flex items-center justify-between text-[16px] tracking-[0.4em] uppercase text-slate-400 z-10">
              <span>Startup Factory Hub</span>
              <span className="flex-1 mx-10 h-px bg-white/15" />
              <span className="text-teal-300">02</span>
            </div>

            {/* Left caption over photo */}
            <div className="absolute left-[110px] bottom-[90px] z-10 max-w-[560px]">
              <p className="text-[18px] tracking-[0.35em] uppercase text-teal-300">AI-Powered · Human-Led</p>
              <p className="mt-3 text-[18px] tracking-[0.35em] uppercase text-slate-300">Hybrid · Global</p>
            </div>

            <div className="relative z-10 h-full ml-auto w-[46%] flex flex-col justify-center pr-[110px]">
              <span className="text-[18px] tracking-[0.4em] uppercase text-teal-300">End-to-End Startup Execution</span>
              <h2 className="mt-6 text-[84px] leading-[1] font-bold tracking-tight bg-gradient-to-r from-white via-teal-100 to-cyan-300 bg-clip-text text-transparent">
                The AI-Powered Hybrid Accelerator
              </h2>
              <div className="mt-8 w-24 h-[2px] bg-gradient-to-r from-teal-300 to-transparent" />
              <p className="mt-8 text-[26px] leading-[1.5] font-light text-slate-300">
                A continuous accelerator taking startups from <span className="text-white font-normal">idea to MVP, MVP to market, and market to scale.</span>
              </p>

              <div className="mt-14 grid grid-cols-2 border-t border-white/10">
                {[
                  { icon: Cpu, title: "AI-Powered Execution" },
                  { icon: Globe, title: "Digital + Physical" },
                  { icon: Users, title: "Human Expertise" },
                  { icon: Network, title: "Strategic Ecosystem" },
                  { icon: DollarSign, title: "Capital & Market Access" },
                  { icon: Zap, title: "Continuous Acceleration" },
                ].map((p, i) => (
                  <div key={i} className={`group flex items-center gap-5 py-7 border-b border-white/10 ${i % 2 === 0 ? 'pr-8 border-r' : 'pl-8'} transition-colors hover:bg-white/[0.03]`}>
                    <span className="text-[15px] font-mono text-teal-300/70">0{i + 1}</span>
                    <p.icon className="h-7 w-7 text-teal-300 shrink-0" strokeWidth={1.4} />
                    <h4 className="text-[24px] font-normal text-white">{p.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 3: The Problem - The Execution Gap */}
        <SlideWrapper>
          <section className="absolute inset-0 overflow-hidden bg-[#0a0406] print:relative print:break-after-page">
            <img src={slide3Img} alt="Founder under pressure" className="absolute inset-0 h-full w-full object-cover opacity-55 grayscale-[40%]" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(10,4,6,0.15)_0%,rgba(10,4,6,0.75)_42%,rgba(10,4,6,0.97)_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(10,4,6,0.9)_0%,transparent_35%)]" />
            <div className="absolute left-[-200px] bottom-[-250px] w-[800px] h-[800px] rounded-full bg-rose-500/10 blur-[140px]" />

            <div className="absolute top-[70px] left-[110px] right-[110px] flex items-center justify-between text-[16px] tracking-[0.4em] uppercase text-slate-400 z-10">
              <span className="text-rose-300">03</span>
              <span className="flex-1 mx-10 h-px bg-white/15" />
              <span>The Problem</span>
            </div>

            <div className="relative z-10 h-full w-[50%] flex flex-col justify-center pl-[110px]">
              <span className="text-[18px] tracking-[0.4em] uppercase text-rose-300">The Problem</span>
              <h2 className="mt-6 text-[96px] leading-none font-bold tracking-tight bg-gradient-to-r from-white via-rose-100 to-rose-300 bg-clip-text text-transparent">
                The Execution Gap
              </h2>
              <div className="mt-8 w-24 h-[2px] bg-gradient-to-r from-rose-300 to-transparent" />
              <p className="mt-8 text-[26px] leading-[1.5] font-light text-slate-300">
                Resources are <span className="text-white font-normal">fragmented</span>. Founders get support at one stage, then navigate the next alone.
              </p>

              <div className="mt-12 flex flex-col border-t border-white/10">
                {[
                  "Fragmented Support",
                  "Short-Term Programs",
                  "Limited Operator Access",
                  "Capital Is Not Enough",
                  "Learning Doesn't Equal Traction",
                ].map((t, i) => (
                  <div key={t} className="group flex items-center gap-8 py-5 border-b border-white/10 transition-colors hover:bg-white/[0.03]">
                    <span className="text-[15px] font-mono text-rose-300/80 w-8">0{i + 1}</span>
                    <h4 className="text-[30px] font-light text-white">{t}</h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Broken journey caption over photo */}
            <div className="absolute right-[110px] bottom-[90px] z-10 flex items-center gap-4 text-[17px] tracking-[0.3em] uppercase">
              {["Education", "Product", "Market", "Revenue", "Scale"].map((s, i) => (
                <span key={s} className="flex items-center gap-4">
                  <span className="text-white/90">{s}</span>
                  {i < 4 && <span className="w-8 h-px bg-gradient-to-r from-rose-400 to-transparent" />}
                </span>
              ))}
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 4: Solution - Unified Execution */}
        <SlideWrapper>
          <section className="absolute inset-0 overflow-hidden bg-slate-950 print:relative print:break-after-page print:bg-white">
            <div className="absolute right-[-200px] top-[-200px] w-[800px] h-[800px] rounded-full bg-emerald-400/10 blur-[120px] print:hidden" />
            <div className="absolute left-[120px] top-[200px] w-[700px] h-[700px] rounded-full bg-teal-400/15 blur-[140px] print:hidden" />
            <div className="absolute inset-x-0 bottom-0 h-[40%] opacity-30 print:hidden [background-image:linear-gradient(rgba(45,212,191,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.25)_1px,transparent_1px)] [background-size:80px_80px] [transform:perspective(900px)_rotateX(60deg)] origin-bottom [mask-image:linear-gradient(to_top,black,transparent)]" />

            {/* Planet behind the platform screens */}
            <img src={earthPlanet} alt="" aria-hidden className="absolute left-[-6%] bottom-[-38%] w-[58%] mix-blend-screen opacity-90 print:hidden" crossOrigin="anonymous" />
            <div className="absolute left-[2%] bottom-[-10%] w-[46%] h-[40%] rounded-full bg-sky-400/20 blur-[100px] print:hidden" />

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
          <section className="absolute inset-0 overflow-hidden bg-slate-950 print:relative print:break-after-page print:bg-white">
            <img src={issMarketBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 print:hidden" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/60 print:hidden" />
            <div className="absolute right-[-120px] top-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-teal-400/10 blur-[140px] print:hidden" />
            <div className="absolute inset-x-0 bottom-0 h-[30%] opacity-25 print:hidden [background-image:linear-gradient(rgba(45,212,191,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.25)_1px,transparent_1px)] [background-size:80px_80px] [transform:perspective(900px)_rotateX(60deg)] origin-bottom [mask-image:linear-gradient(to_top,black,transparent)]" />

            <div className="relative z-10 h-full flex">
              {/* Left: headline + segments */}
              <div className="w-[52%] flex flex-col justify-center pl-[100px] pr-[40px]">
                <span className="text-[22px] font-medium text-teal-300 tracking-[0.35em] uppercase print:text-gray-600">Growth Landscape</span>
                <h2 className="mt-4 text-[88px] leading-none font-bold tracking-tight bg-gradient-to-r from-white via-teal-100 to-emerald-300 bg-clip-text text-transparent print:text-black">Market Opportunity</h2>
                <p className="mt-6 text-[28px] text-slate-300 print:text-gray-700">
                  <span className="text-white font-semibold">$25B+</span> global accelerator & startup services market.
                </p>

                <span className="mt-14 text-[18px] tracking-[0.35em] uppercase text-slate-400">Market by segment</span>
                <div className="mt-6 space-y-5">
                  {[
                    { label: "Startup Accelerators", amount: "$9.2B", v: 9.2 },
                    { label: "AI/ML Startup Tools", amount: "$6.8B", v: 6.8 },
                    { label: "Coworking & Innovation Hubs", amount: "$4.1B", v: 4.1 },
                    { label: "Venture Services Platforms", amount: "$3.2B", v: 3.2 },
                    { label: "EdTech for Entrepreneurs", amount: "$1.9B", v: 1.9 },
                  ].map((s, i) => (
                    <div key={s.label} className="group">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[21px] text-white font-medium">{s.label}</span>
                        <span className="text-[24px] font-bold bg-gradient-to-r from-teal-200 to-emerald-300 bg-clip-text text-transparent">{s.amount}</span>
                      </div>
                      <div className="mt-2 h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-teal-300 to-emerald-300 shadow-[0_0_14px_rgba(94,234,212,0.9)]" style={{ width: `${(s.v / 9.2) * 100}%`, animation: `slideInWidth 1.4s ease-out ${0.2 + i * 0.15}s both` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 flex gap-12">
                  {[
                    { stat: "15%", t: "Ecosystem CAGR" },
                    { stat: "3.2x", t: "AI adoption" },
                    { stat: "582M", t: "Entrepreneurs" },
                    { stat: "+40%", t: "Hybrid demand" },
                  ].map((d) => (
                    <div key={d.t}>
                      <p className="text-[40px] font-bold leading-none text-white">{d.stat}</p>
                      <p className="mt-2 text-[16px] tracking-[0.2em] uppercase text-teal-300/80">{d.t}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: TAM / SAM / SOM orbit */}
              <div className="w-[48%] relative flex items-center justify-center">
                <div className="relative w-[720px] h-[720px]">
                  <div className="absolute inset-0 rounded-full border border-teal-300/30 bg-teal-400/[0.03]" />
                  <div className="absolute inset-0 animate-[spin_50s_linear_infinite] print:hidden">
                    <span className="absolute left-1/2 top-[-6px] w-3 h-3 rounded-full bg-teal-300 shadow-[0_0_20px_rgba(94,234,212,1)]" />
                  </div>
                  <div className="absolute inset-[130px] rounded-full border border-dashed border-teal-300/40 bg-teal-400/[0.05] animate-[spin_80s_linear_infinite] print:hidden" />
                  <div className="absolute inset-[130px] rounded-full border border-teal-300/20" />
                  <div className="absolute inset-[250px] rounded-full bg-emerald-400/15 ring-1 ring-emerald-300/60 shadow-[0_0_80px_rgba(52,211,153,0.45)]" />

                  <div className="absolute left-1/2 top-[40px] -translate-x-1/2 text-center">
                    <p className="text-[18px] tracking-[0.35em] text-teal-300/80">TAM</p>
                    <p className="text-[52px] font-bold text-white leading-none">$25B+</p>
                  </div>
                  <div className="absolute left-1/2 top-[160px] -translate-x-1/2 text-center">
                    <p className="text-[18px] tracking-[0.35em] text-teal-300/80">SAM</p>
                    <p className="text-[44px] font-bold text-white leading-none">$8.5B</p>
                  </div>
                  <div className="absolute inset-[250px] flex flex-col items-center justify-center text-center">
                    <p className="text-[18px] tracking-[0.35em] text-emerald-300">SOM · Y5</p>
                    <p className="text-[52px] font-bold leading-none bg-gradient-to-r from-teal-200 to-emerald-300 bg-clip-text text-transparent">$250M</p>
                  </div>
                </div>
                <p className="absolute bottom-[80px] text-[18px] tracking-[0.3em] uppercase text-slate-400">
                  North America 35% · Europe 28% · APAC 22% · LatAm 10% · MEA 5%
                </p>
              </div>
            </div>
            <style>{`@keyframes slideInWidth { from { width: 0%; } }`}</style>
          </section>
        </SlideWrapper>

        {/* SLIDE 7: Business Model & Revenue Streams */}
        <SlideWrapper>
          <section className="absolute inset-0 overflow-hidden bg-slate-950 print:relative print:break-after-page print:bg-white">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(20,184,166,0.18),transparent_55%),radial-gradient(ellipse_at_85%_80%,rgba(52,211,153,0.12),transparent_50%)] print:hidden" />
            <div className="absolute inset-x-0 bottom-0 h-[30%] opacity-25 print:hidden [background-image:linear-gradient(rgba(45,212,191,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.25)_1px,transparent_1px)] [background-size:80px_80px] [transform:perspective(900px)_rotateX(60deg)] origin-bottom [mask-image:linear-gradient(to_top,black,transparent)]" />
            <div className="relative z-10 h-full flex flex-col px-[100px] py-[80px]">
              <span className="text-[22px] font-medium text-teal-300 tracking-[0.35em] uppercase print:text-gray-600">Monetization</span>
              <h2 className="mt-3 text-[80px] leading-none font-bold tracking-tight bg-gradient-to-r from-white via-teal-100 to-emerald-300 bg-clip-text text-transparent print:text-black">Business Model</h2>
              <p className="mt-5 text-[26px] text-slate-300 print:text-gray-700">Recurring subscriptions at the core. <span className="text-white font-semibold">Programs, partners and transactions on top.</span></p>

              <div className="mt-12 flex items-center gap-4">
                <span className="w-3 h-3 rounded-full bg-teal-300 shadow-[0_0_16px_rgba(94,234,212,1)]" />
                <span className="text-[20px] tracking-[0.3em] uppercase text-teal-300">Core recurring revenue · in projections</span>
                <div className="flex-1 h-px bg-gradient-to-r from-teal-300/50 to-transparent" />
              </div>
              <div className="mt-6 grid grid-cols-5 gap-6">
                {[
                  { icon: Building2, name: "Global Desk", price: "$550", unit: "/ month" },
                  { icon: Globe, name: "Global Office", price: "$950", unit: "/ month" },
                  { icon: Award, name: "Members Club", price: "$50", unit: "/ month" },
                  { icon: Rocket, name: "Accelerator as a Service", price: "$5K", unit: "software + $5K / startup" },
                  { icon: Cpu, name: "AI Credits", price: "$9–$29", unit: "/ month + usage packs" },
                ].map((r) => (
                  <div key={r.name} className="group rounded-3xl bg-white/[0.04] ring-1 ring-teal-300/25 p-7 shadow-[0_0_40px_rgba(45,212,191,0.12)] transition-all duration-500 hover:-translate-y-1 hover:ring-teal-200/60 hover:shadow-[0_0_60px_rgba(45,212,191,0.35)]">
                    <div className="w-[60px] h-[60px] rounded-full bg-slate-950 ring-1 ring-teal-300/50 flex items-center justify-center shadow-[0_0_25px_rgba(45,212,191,0.4)]">
                      <r.icon className="w-7 h-7 text-teal-300" />
                    </div>
                    <p className="mt-6 text-[22px] font-semibold text-white leading-tight">{r.name}</p>
                    <p className="mt-3 text-[52px] font-bold leading-none bg-gradient-to-r from-teal-200 to-emerald-300 bg-clip-text text-transparent">{r.price}</p>
                    <p className="mt-2 text-[17px] text-slate-400">{r.unit}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex items-center gap-4">
                <span className="w-3 h-3 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,1)]" />
                <span className="text-[20px] tracking-[0.3em] uppercase text-emerald-300">Additional revenue · upside, not in projections</span>
                <div className="flex-1 h-px bg-gradient-to-r from-emerald-300/50 to-transparent" />
              </div>
              <div className="mt-6 grid grid-cols-4 gap-x-10 gap-y-7">
                {[
                  { icon: Target, name: "MVP Program", price: "$5,000 / startup" },
                  { icon: Diamond, name: "Equity Participation", price: "Up to 5% equity + 5% profit share" },
                  { icon: Handshake, name: "Corporate Partners", price: "$100K / year" },
                  { icon: Lightbulb, name: "Pilot Programs", price: "$200K / pilot" },
                  { icon: Network, name: "New Chapters", price: "$200K / chapter" },
                  { icon: Award, name: "Sponsorships", price: "$5K–$50K" },
                  { icon: GraduationCap, name: "Education Programs", price: "$10K avg" },
                  { icon: DollarSign, name: "Transaction Fees", price: "5% events · 10% marketplace · 20% donations" },
                ].map((r) => (
                  <div key={r.name} className="flex items-start gap-4">
                    <div className="w-[50px] h-[50px] shrink-0 rounded-full bg-slate-950 ring-1 ring-emerald-300/40 flex items-center justify-center">
                      <r.icon className="w-6 h-6 text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-[21px] font-semibold text-white leading-tight">{r.name}</p>
                      <p className="mt-1 text-[17px] text-slate-400 leading-snug">{r.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 8: Financial Projections */}
        <SlideWrapper>
          <section className="absolute inset-0 overflow-hidden bg-slate-950 print:relative print:break-after-page print:bg-white">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,rgba(20,184,166,0.18),transparent_55%),radial-gradient(ellipse_at_85%_20%,rgba(34,211,238,0.12),transparent_50%)] print:hidden" />
            <div className="absolute inset-x-0 bottom-0 h-[380px] opacity-40 print:hidden" style={{ backgroundImage: 'linear-gradient(rgba(45,212,191,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.25) 1px, transparent 1px)', backgroundSize: '80px 80px', transform: 'perspective(600px) rotateX(60deg)', transformOrigin: 'bottom', maskImage: 'linear-gradient(to top, black, transparent)' }} />
            <div className="absolute right-[-200px] top-[-200px] w-[800px] h-[800px] rounded-full border border-cyan-400/10 animate-[spin_90s_linear_infinite] print:hidden">
              <div className="absolute top-1/2 left-0 w-3 h-3 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_24px_6px_rgba(103,232,249,0.6)]" />
            </div>

            <div className="relative z-10 h-full flex px-[110px] py-[80px] gap-[90px]">
              {/* LEFT: hero + growth curve */}
              <div className="flex-[1.35] flex flex-col">
                <span className="text-[22px] font-medium text-teal-300 tracking-[0.35em] uppercase print:text-gray-600">5-Year Financial Projections</span>
                <div className="mt-4 flex items-end gap-6">
                  <h2 className="text-[150px] leading-[0.9] font-bold tracking-tight bg-gradient-to-r from-white via-teal-100 to-cyan-300 bg-clip-text text-transparent print:text-black">$60.9M</h2>
                  <div className="pb-4">
                    <p className="text-[24px] text-slate-400 uppercase tracking-[0.2em]">Year 5 Revenue</p>
                    <p className="text-[30px] font-semibold text-teal-300 flex items-center gap-2"><TrendingUp className="h-8 w-8" />10x from $6.09M</p>
                  </div>
                </div>

                {/* Growth curve */}
                <div className="relative mt-10 flex-1">
                  <svg viewBox="0 0 1000 440" preserveAspectRatio="xMidYMax meet" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="finArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="finLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#67e8f9" />
                      </linearGradient>
                      <filter id="finGlow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    </defs>
                    {(() => {
                      const vals = [6.09, 10.83, 19.26, 34.25, 60.9];
                      const pts = vals.map((v, i) => [80 + i * 210, 400 - (v / 66) * 380]);
                      const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
                      return (
                        <>
                          {[0, 1, 2, 3].map(g => <line key={g} x1="0" x2="1000" y1={40 + g * 120} y2={40 + g * 120} stroke="rgba(148,163,184,0.12)" strokeDasharray="4 8" />)}
                          <path d={`${line} L ${pts[4][0]} 400 L ${pts[0][0]} 400 Z`} fill="url(#finArea)" />
                          <path d={line} fill="none" stroke="url(#finLine)" strokeWidth="5" filter="url(#finGlow)" strokeLinecap="round" />
                          {pts.map((p, i) => (
                            <g key={i}>
                              <line x1={p[0]} x2={p[0]} y1={p[1]} y2={400} stroke="rgba(45,212,191,0.25)" strokeDasharray="3 6" />
                              <circle cx={p[0]} cy={p[1]} r="16" fill="rgba(45,212,191,0.15)" className="animate-pulse" />
                              <circle cx={p[0]} cy={p[1]} r="7" fill="#a5f3fc" filter="url(#finGlow)" />
                              <text x={p[0]} y={p[1] - 30} textAnchor="middle" fill="#fff" fontSize="30" fontWeight="700">${vals[i]}M</text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                  <div className="absolute left-0 right-0 -bottom-2 flex" style={{ paddingLeft: '3%', paddingRight: '7%' }}>
                    {['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'].map((y, i) => (
                      <div key={y} className="flex-1 text-center">
                        <span className="text-[20px] text-slate-400 uppercase tracking-[0.2em]">{y}</span>
                        {i > 0 && <span className="block text-[18px] text-teal-300">{['+78%', '+78%', '+78%', '+78%'][i - 1]}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: Y1 engine + raise */}
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-[20px] text-slate-400 uppercase tracking-[0.3em]">Year 1 Revenue Engine</p>
                <p className="text-[64px] font-bold text-white leading-none mt-2">$6.09M</p>
                <div className="mt-8 space-y-5">
                  {[
                    { icon: Briefcase, t: "500 Global Desk", s: "$550 / month", v: "$3.3M", w: 54.2 },
                    { icon: Building2, t: "100 Global Office", s: "$950 / month", v: "$1.14M", w: 18.7 },
                    { icon: Users, t: "1,000 Members", s: "$50 / month", v: "$600K", w: 9.9 },
                    { icon: Rocket, t: "10 Accelerators-as-a-Service", s: "$5K software + $5K / startup (min 10)", v: "$550K", w: 9.0 },
                    { icon: Cpu, t: "2,200 AI Credit Plans", s: "20% of 11,000 users (incl. free) · $19 avg / mo", v: "$500K", w: 8.2 },
                  ].map((r, i) => (
                    <div key={i} className="group">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-400/10 shadow-[0_0_24px_rgba(45,212,191,0.25)] group-hover:shadow-[0_0_36px_rgba(103,232,249,0.6)] transition-shadow">
                          <r.icon className="h-6 w-6 text-teal-300" />
                        </span>
                        <div className="flex-1">
                          <p className="text-[25px] font-semibold text-white leading-tight">{r.t}</p>
                          <p className="text-[18px] text-slate-400">{r.s}</p>
                        </div>
                        <span className="text-[28px] font-bold text-teal-300">{r.v}</span>
                      </div>
                      <div className="mt-2 ml-16 h-[3px] rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" style={{ width: `${Math.max(r.w, 3)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl px-6 py-5 bg-emerald-400/[0.06] ring-1 ring-emerald-300/25 shadow-[0_0_40px_rgba(52,211,153,0.15)]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-400/10 shadow-[0_0_24px_rgba(52,211,153,0.35)]">
                      <Percent className="h-6 w-6 text-emerald-300" />
                    </span>
                    <div className="flex-1">
                      <p className="text-[24px] font-semibold text-white leading-tight">Equity Program · 100 startups / year</p>
                      <p className="text-[17px] text-slate-400">1% equity each · 10% exit at $50M+ · upside, not in revenue totals</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[28px] font-bold text-emerald-300 leading-none">$5M</p>
                      <p className="text-[14px] text-slate-400 uppercase tracking-[0.15em] mt-1">per cohort</p>
                    </div>
                  </div>
                  <p className="mt-3 ml-16 text-[17px] text-emerald-200/90">10 exits / year × $500K · $25M equity value by Year 5</p>
                </div>

                <div className="mt-8 pt-6 border-t border-teal-400/15">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[34px] font-bold text-cyan-300">Raising $1.5M</p>
                    <p className="text-[18px] text-slate-400 uppercase tracking-[0.2em]">Seed · 18-Month Runway</p>
                  </div>
                  <div className="mt-4 flex h-[10px] rounded-full overflow-hidden gap-1">
                    <div className="bg-teal-400 shadow-[0_0_14px_rgba(45,212,191,0.8)]" style={{ width: '55%' }} />
                    <div className="bg-cyan-400" style={{ width: '25%' }} />
                    <div className="bg-sky-500" style={{ width: '12%' }} />
                    <div className="bg-slate-500" style={{ width: '8%' }} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-[19px] text-slate-300">
                    <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-400 mr-2" />Growth & Distribution <b className="text-white">55%</b></span>
                    <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 mr-2" />Product & Tech <b className="text-white">25%</b></span>
                    <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500 mr-2" />Operations & Legal <b className="text-white">12%</b></span>
                    <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-500 mr-2" />Strategic Reserve <b className="text-white">8%</b></span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </SlideWrapper>
        {/* SLIDE: Traction */}
        <SlideWrapper>
          <section className="absolute inset-0 overflow-hidden bg-slate-950 print:relative print:break-after-page print:bg-white">
            <div className="absolute inset-y-0 left-0 w-[52%] print:hidden">
              <img src={nasdaqTower} alt="Startup Factory Hub featured on the Nasdaq Tower in Times Square" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/30 to-slate-950" />
              <div className="absolute left-[60px] bottom-[60px] flex items-center gap-3 px-6 py-3 rounded-full bg-slate-950/80 backdrop-blur ring-1 ring-cyan-300/40">
                <span className="w-3 h-3 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
                <span className="text-[20px] text-white uppercase tracking-[0.2em]">Nasdaq Tower · Times Square, NYC</span>
              </div>
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(20,184,166,0.18),transparent_55%)] print:hidden" />
            <div className="relative z-10 h-full ml-[50%] flex flex-col justify-center pr-[110px] pl-[40px]">
              <span className="text-[22px] font-medium text-teal-300 tracking-[0.35em] uppercase print:text-gray-600">Traction</span>
              <h2 className="mt-3 text-[88px] leading-[1] font-bold tracking-tight bg-gradient-to-r from-white via-teal-100 to-cyan-300 bg-clip-text text-transparent print:text-black">Real Momentum</h2>
              <div className="mt-12 flex items-end gap-6">
                <span className="text-[170px] leading-[0.85] font-bold text-white drop-shadow-[0_0_40px_rgba(45,212,191,0.45)] print:text-black">{totalUsers !== null ? totalUsers.toLocaleString() : '—'}</span>
                <div className="pb-4">
                  <p className="text-[30px] font-semibold text-teal-300">Total Users</p>
                  <p className="text-[20px] text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Live on platform</p>
                </div>
              </div>
              <div className="mt-14 space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-[190px] h-[96px] shrink-0 rounded-2xl bg-white flex items-center justify-center p-4 shadow-[0_0_36px_rgba(45,212,191,0.3)]">
                    <img src="/nasdaq-logo.png" alt="Nasdaq" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-[34px] font-semibold text-white leading-tight">Featured on the Nasdaq Tower</p>
                    <p className="text-[24px] text-slate-400">Times Square, with Nasdaq Entrepreneurial Center and Lehigh University</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-[190px] h-[96px] shrink-0 rounded-2xl bg-white flex items-center justify-center p-4 shadow-[0_0_36px_rgba(45,212,191,0.3)]">
                    <img src="/partners/apex-accelerators-logo.png" alt="APEX Accelerators" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-[34px] font-semibold text-white leading-tight">Used by APEX Accelerators</p>
                    <p className="text-[24px] text-slate-400">Powering startup support for APEX Accelerators</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-[190px] h-[96px] shrink-0 rounded-2xl bg-white flex items-center justify-center p-4 shadow-[0_0_36px_rgba(45,212,191,0.3)]">
                    <img src="/partners/nasa-t2-logo.webp" alt="NASA Technology Transfer" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-[34px] font-semibold text-white leading-tight">Used by NASA Technology Transfer</p>
                    <p className="text-[24px] text-slate-400">Kennedy Space Center (KSC)</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-[190px] h-[96px] shrink-0 rounded-2xl bg-white flex items-center justify-center p-4 shadow-[0_0_36px_rgba(45,212,191,0.3)]">
                    <img src="/partners/uksa-logo.png" alt="UK Space Agency" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-[34px] font-semibold text-white leading-tight">Used by UK Space Agency</p>
                    <p className="text-[24px] text-slate-400">UKSA</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 8: Our Partners */}
        <SlideWrapper>
          <section className="absolute inset-0 overflow-hidden bg-slate-950 print:relative print:break-after-page print:bg-white">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(20,184,166,0.18),transparent_55%),radial-gradient(ellipse_at_90%_90%,rgba(34,211,238,0.12),transparent_50%)] print:hidden" />
            <div className="absolute inset-x-0 bottom-0 h-[320px] opacity-30 print:hidden" style={{ backgroundImage: 'linear-gradient(rgba(45,212,191,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.25) 1px, transparent 1px)', backgroundSize: '80px 80px', transform: 'perspective(600px) rotateX(60deg)', transformOrigin: 'bottom', maskImage: 'linear-gradient(to top, black, transparent)' }} />
            <div className="relative z-10 h-full flex flex-col px-[110px] py-[70px]">
              <div className="flex items-end justify-between gap-12">
                <div>
                  <span className="text-[22px] font-medium text-teal-300 tracking-[0.35em] uppercase print:text-gray-600">Strategic Network</span>
                  <h2 className="mt-3 text-[88px] leading-[1] font-bold tracking-tight bg-gradient-to-r from-white via-teal-100 to-cyan-300 bg-clip-text text-transparent print:text-black">Partners & Network</h2>
                </div>
                <div className="flex items-center gap-6">
                  {PARTNERS.filter(p => p.name.startsWith('NASA')).map(p => (
                    <div key={p.name} className="flex flex-col items-center gap-3">
                      <div className="w-[230px] h-[130px] rounded-3xl bg-white flex items-center justify-center p-5 shadow-[0_0_50px_rgba(45,212,191,0.35)] ring-1 ring-teal-300/40">
                        <img src={p.logo} alt={p.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <span className="text-[18px] text-slate-300 uppercase tracking-[0.15em]">{p.name.includes('Transfer') ? 'NASA Technology Transfer' : 'NASA'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-12 grid grid-cols-10 gap-5 flex-1 content-start">
                {PARTNERS.filter(p => !p.name.startsWith('NASA')).map((p) => (
                  <div key={p.name} className="group h-[130px] rounded-2xl bg-white/95 flex items-center justify-center px-5 py-4 ring-1 ring-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_36px_rgba(103,232,249,0.5)]" title={p.name}>
                    <img src={p.logo} alt={p.name} className="max-h-[76px] max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).replaceWith(Object.assign(document.createElement('span'), { textContent: p.name, className: 'text-[18px] font-semibold text-slate-800 text-center' })); }} />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-4 text-[20px] text-slate-400 uppercase tracking-[0.25em]">
                <span className="h-px w-16 bg-teal-400/60" />
                {PARTNERS.length} partners · Space · Technology · Investment · Academic · Workspace · Legal · Community
              </div>
            </div>
          </section>
        </SlideWrapper>




        {/* SLIDE: Leadership Team */}
        <SlideWrapper>
          <section className="absolute inset-0 overflow-hidden bg-slate-950 print:relative print:break-after-page">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(20,184,166,0.18),transparent_60%)]" />
            <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 w-[1500px] h-[1500px] rounded-full border border-teal-400/10 animate-[spin_120s_linear_infinite]">
              <div className="absolute top-0 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-300 shadow-[0_0_24px_6px_rgba(45,212,191,0.6)]" />
            </div>
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-[110px]">
              <span className="text-[22px] font-medium text-teal-300 tracking-[0.35em] uppercase">Leadership</span>
              <h2 className="mt-4 text-[96px] leading-none font-bold tracking-tight bg-gradient-to-r from-white via-teal-100 to-cyan-300 bg-clip-text text-transparent">The Team</h2>
              <p className="mt-5 text-[26px] text-slate-300">Operators, founders and advisors building the next generation of startups.</p>
              <div className="mt-14 grid grid-cols-5 gap-8 w-full items-start">
                {[
                  { name: "Khalia Padilla", bio: "Founder & CEO, Imagine Engine venture studio. CEO & Co-Founder, Lightware Technologies (photonic networks). VC investor building AI-powered accelerators; former advisor, USF Muma Design Thinking Program.", role: "CEO & Co-Founder", loc: null, img: teamKhaliaAsset.url, linkedin: "https://www.linkedin.com/in/khaliapadilla/" },
                  { name: "Ricardo Font", bio: "Chairman of the Board, Startup Factory Hub. Managing Partner, Decahedron Ventures. Business Advisor, Startupbootcamp. Physicist and inventor in photonics, aerospace and fintech.", role: "COO & Co-Founder", loc: null, img: teamRicardoAsset.url, linkedin: "https://www.linkedin.com/in/ricardo-font-952034248/" },
                  { name: "James Stuber", bio: "Attorney and entrepreneur, 40+ years. Founding Managing Partner, Security Capital Partners. Legislative Counsel, Coalition for a Prosperous America. Former Hogan & Hartson; Georgetown J.D.", role: "Legal", loc: null, img: teamStuberAsset.url, linkedin: "https://www.linkedin.com/in/jamesstuber" },
                  { name: "Dominic Catrambone", bio: "40+ years of executive leadership in financial services, banking and investment management. Former CEO and President; founded an NYSE-listed ETF organization. Senior Strategy Consultant, Pathfinder.", role: "CFO", loc: null, img: teamCatramboneAsset.url, linkedin: "https://www.linkedin.com/in/dom-catrambone/" },
                  { name: "N. MacDonnell Ulsch", bio: "Cybersecurity and national security expert, 30+ years. Former Senior Managing Director, PwC; founder & CEO, ZeroPoint Risk Research. Guest Lecturer, West Point; Research Fellow, Boston College.", role: "Senior Advisor", loc: null, img: teamUlschAsset.url, linkedin: "https://www.linkedin.com/in/n-macdonnell-ulsch-38abb21" },
                ].map((m) => (
                  <div key={m.name} className="group flex flex-col items-center text-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-teal-400/30 blur-2xl scale-110 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="relative w-[200px] h-[200px] rounded-full p-[3px] bg-gradient-to-br from-teal-300 via-cyan-400/40 to-transparent">
                        <img src={m.img} alt={m.name} className="w-full h-full rounded-full object-cover bg-slate-900" crossOrigin="anonymous" />
                      </div>
                    </div>
                    <p className="mt-6 text-[34px] leading-tight font-bold text-white">{m.name}</p>
                    <p className="mt-2 text-[22px] font-semibold tracking-[0.15em] uppercase text-teal-300">{m.role}</p>
                    <p className="mt-4 text-[21px] leading-snug text-slate-200 max-w-[320px]">{m.bio}</p>
                    {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="mt-3 text-[20px] text-slate-300 hover:text-teal-300">LinkedIn</a>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 10: Contact */}
        <SlideWrapper>
          <section className="absolute inset-0 overflow-hidden bg-[#020b0a] print:relative print:break-after-avoid">
            <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: `url(${rocketLaunchBg})` }} />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(2,11,10,0.55)_0%,rgba(2,11,10,0.95)_70%)]" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] rounded-full border border-teal-400/10" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-teal-400/15 animate-[spin_60s_linear_infinite]" style={{ borderStyle: 'dashed' }} />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-[120px]" />

            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-[6%]">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-teal-400/40 blur-3xl rounded-full scale-150" />
                <img src={sfhLogo} alt="Startup Factory Hub" className="relative w-40 h-40 object-contain drop-shadow-[0_0_40px_rgba(45,212,191,0.6)]" />
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-px bg-gradient-to-r from-transparent to-teal-300" />
                <span className="text-[20px] tracking-[0.4em] uppercase text-teal-300">Get Involved</span>
                <div className="w-16 h-px bg-gradient-to-l from-transparent to-teal-300" />
              </div>

              <h2 className="text-[120px] leading-none font-black tracking-tight bg-gradient-to-r from-white via-teal-100 to-teal-300 bg-clip-text text-transparent">
                Join Our Mission
              </h2>
              <p className="mt-6 text-[34px] font-light text-slate-300">Let's build the future together.</p>

              <div className="mt-10 flex items-center gap-8 text-[20px] tracking-[0.3em] uppercase text-slate-400">
                <span>Partners</span>
                <span className="w-2 h-2 rounded-full bg-teal-300 shadow-[0_0_12px_rgba(94,234,212,1)]" />
                <span>Investors</span>
                <span className="w-2 h-2 rounded-full bg-teal-300 shadow-[0_0_12px_rgba(94,234,212,1)]" />
                <span>Innovators</span>
              </div>

              <a href="mailto:info@startupfactoryhub.com" className="mt-14 inline-flex items-center gap-5 rounded-full px-12 py-6 bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-300 text-[#02110f] shadow-[0_0_60px_rgba(45,212,191,0.55)] hover:shadow-[0_0_90px_rgba(45,212,191,0.8)] transition-shadow">
                <Mail className="h-8 w-8" />
                <span className="text-[30px] font-bold">info@startupfactoryhub.com</span>
              </a>
              <p className="mt-6 text-[20px] text-slate-400">startupfactoryhub.com</p>

              <p className="absolute bottom-10 text-[16px] text-slate-600">© 2026 Startup Factory Hub. All rights reserved.</p>
            </div>
          </section>
        </SlideWrapper>
      </div>
    </div>;
}