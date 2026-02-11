import { useState, useRef, useEffect, useCallback } from 'react';
import { Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail, ExternalLink, Printer, Search, Network, BarChart3, Briefcase, GraduationCap, Building2, Diamond, Video, FileText, Calendar, Cpu, DollarSign, Handshake, Zap, ArrowRight, MapPin, Smartphone, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import sfhLogo from '@/assets/sfh-logo-sphere.png';
import rocketLaunchBg from '@/assets/rocket-launch-bg.jpg';
import astronautBg from '@/assets/astronaut-bg.jpg';
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
export default function DeckPublic() {
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

      pdf.save('Startup-Factory-Hub-Overview.pdf');
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  return <div ref={deckRef} className="min-h-screen bg-slate-950 text-white">
      {/* Navigation Bar - Hidden in Print */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/95 backdrop-blur-sm border-b border-teal-500/30 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 text-white hover:bg-slate-800 hover:text-teal-400">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
          <span className="text-sm text-teal-400 font-medium tracking-wide">STARTUP FACTORY HUB // OVERVIEW</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting} className="gap-2 border-teal-500/50 text-teal-400 hover:bg-teal-500/10 hover:border-teal-500">
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="pt-16 print:pt-0">
        {/* SLIDE 1: Cover */}
        <CoverSlideContainer>
          <div className="flex flex-col items-center text-center w-full">
            {/* Logo with glow */}
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-teal-500/30 blur-3xl rounded-full print:hidden" />
              <img src={sfhLogo} alt="Startup Factory Hub" className="relative w-36 h-36 md:w-44 md:h-44 object-contain" />
              {/* Orbit ring */}
              <div className="absolute inset-[-20px] border border-dashed border-teal-500/40 rounded-full animate-spin print:hidden" style={{
              animationDuration: '20s'
            }} />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight print:text-black">
              Startup Factory Hub
            </h1>
            
            <p className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4 print:text-teal-700">
              The Online Hybrid Accelerator Platform Powered by A.I.
            </p>
            
            {/* Key Value Proposition */}
            <div className="w-full mb-4">
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed print:text-gray-700">
                A <span className="text-teal-400 font-semibold">hybrid digital-physical</span> execution platform with global locations, <span className="text-cyan-400 font-semibold">AI-driven workflows</span>, and human expertise—enabling founders to build consistently from <span className="text-teal-400 font-semibold">idea to scale</span>.
              </p>
            </div>
            
            {/* Global Presence Highlight */}
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-6 w-6 text-cyan-400" />
              <span className="text-base font-medium text-cyan-400">4 Global Hubs</span>
              <span className="text-slate-500 mx-2">•</span>
              <MapPin className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-slate-400">Orlando • Santiago • Tokyo • Sevilla</span>
            </div>
            
            <SectionDivider title="Built for Everyone" />
            
            {/* User Types Grid - 5 columns */}
            <div className="grid grid-cols-5 gap-4 w-full mb-5">
              {[
                { icon: Rocket, label: "Startups", color: "teal" },
                { icon: Users, label: "Mentors", color: "cyan" },
                { icon: Diamond, label: "Investors", color: "purple" },
                { icon: GraduationCap, label: "Students", color: "rose" },
                { icon: Building2, label: "Accelerators", color: "emerald" },
              ].map((item, i) => (
                <div key={i} className="relative group">
                  <div className={`absolute inset-0 bg-${item.color}-500/20 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden`} />
                  <div className={`relative flex flex-col items-center p-5 bg-slate-900/80 border border-${item.color}-500/40 rounded-xl hover:border-${item.color}-500/80 transition-all print:bg-gray-50 print:border-gray-300`}>
                    <div className="w-14 h-14 mb-3 flex items-center justify-center" style={{
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                  }}>
                      <div className={`absolute w-14 h-14 bg-gradient-to-br from-${item.color}-500/30 to-${item.color}-600/30 border border-${item.color}-500/60`} style={{
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                    }} />
                      <item.icon className={`h-6 w-6 text-${item.color}-400 z-10 print:text-${item.color}-700`} />
                    </div>
                    <span className={`text-base font-semibold text-slate-200 print:text-gray-700`}>{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Differentiator - Hybrid Model */}
            <div className="bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 border border-teal-500/30 rounded-xl px-8 py-4 w-full print:bg-gray-50 print:border-gray-300">
              <p className="text-base text-slate-300 print:text-gray-700">
                <span className="text-teal-400 font-semibold print:text-teal-700">Hybrid A.I. Accelerator:</span> Not just software—an <span className="text-cyan-400">intelligent operating system</span> that merges AI automation, physical workspaces, and human expertise into one continuous execution engine across global locations.
              </p>
            </div>
          </div>
        </CoverSlideContainer>

        {/* SLIDE 2: Company Summary - Mechanism Journey */}
        <SlideWrapper>
           <section className="absolute inset-0 flex flex-col items-center justify-center p-[1.5%] overflow-hidden print:relative print:p-8 print:break-after-page print:bg-white">
            {/* Background image */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat print:hidden" style={{
            backgroundImage: `url(${astronautBg})`
          }} />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 print:hidden" />
            {/* Border frame */}
             <div className="absolute inset-[1%] border-2 border-teal-500/30 rounded-lg print:border-gray-300" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[99%] mx-auto">
            <div className="flex flex-col items-center w-full">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-teal-500 rotate-45" />
              <span className="text-base font-semibold text-teal-400 tracking-[0.3em] uppercase print:text-gray-600">End-to-End Execution</span>
              <div className="w-3 h-3 bg-teal-500 rotate-45" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 print:text-black">The Online Hybrid Accelerator</h2>
            <p className="text-xl text-slate-400 text-center mb-5 print:text-gray-600">AI-Powered • Hybrid Execution • Global Scale</p>
            
            {/* Core Philosophy - Big Statement */}
            <div className="w-full mb-5">
              <div className="bg-slate-900/60 border-2 border-teal-500/40 rounded-xl p-6 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                <p className="text-lg text-center text-slate-200 leading-relaxed print:text-gray-700">
                  <span className="text-teal-400 font-bold print:text-teal-700">We are not a 3-month program.</span> We are an <span className="text-cyan-400 font-semibold">AI-powered hybrid accelerator platform</span>—a permanent operating system that combines intelligent automation, physical hubs, mentorship, and capital access into one continuous execution engine for founders worldwide.
                </p>
              </div>
            </div>
            
            {/* What Makes Us Different - 3 Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mb-5">
              <div className="bg-slate-900/60 border border-teal-500/30 rounded-xl p-5 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-6 w-6 text-teal-400 print:text-teal-700" />
                  <span className="text-base font-bold text-teal-400 print:text-teal-700">AI-Driven Workflows</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed print:text-gray-600">
                  Intelligent automation powers every stage—from <span className="text-white">AI matching and roadmaps</span> to real-time analytics. No manual gaps, just continuous execution.
                </p>
              </div>
              <div className="bg-slate-900/60 border border-cyan-500/30 rounded-xl p-5 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-6 w-6 text-cyan-400 print:text-cyan-700" />
                  <span className="text-base font-bold text-cyan-400 print:text-cyan-700">Digital + Physical Hybrid</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed print:text-gray-600">
                  <span className="text-white">Online platform + 4 flagship hubs</span> + 5,800 partner locations. Build anywhere with local community and global reach.
                </p>
              </div>
              <div className="bg-slate-900/60 border border-purple-500/30 rounded-xl p-5 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                <div className="flex items-center gap-2 mb-3">
                  <Network className="h-6 w-6 text-purple-400 print:text-purple-700" />
                  <span className="text-base font-bold text-purple-400 print:text-purple-700">Integrated Ecosystem</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed print:text-gray-600">
                  <span className="text-white">AI + Mentors + Corporates + Capital</span> in one platform. No fragmented tools—one consistent workflow.
                </p>
              </div>
            </div>

            {/* Mechanism Flow - 4 Pillars */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 w-full mb-5">
              {[
                { icon: Cpu, label: "Digital Infrastructure", desc: "AI-powered tools & automation", color: "teal" },
                { icon: Users, label: "Human Expertise", desc: "Mentors, advisors & network", color: "cyan" },
                { icon: Building2, label: "Corporate Partners", desc: "Strategic alliances & deals", color: "purple" },
                { icon: DollarSign, label: "Capital Access", desc: "Investor network & funding", color: "emerald" },
              ].map((pillar, i) => (
                <div key={i} className="relative group">
                  <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-${pillar.color}-500/60 to-${pillar.color}-500/20 print:hidden`} />
                  <div className={`bg-slate-900/80 border border-${pillar.color}-500/40 rounded-xl p-5 backdrop-blur-sm hover:border-${pillar.color}-500/80 transition-all print:bg-gray-50 print:border-gray-300`}>
                    <div className={`w-12 h-12 rounded-lg bg-${pillar.color}-500/20 border border-${pillar.color}-500/40 flex items-center justify-center mx-auto mb-3 print:bg-gray-100`}>
                      <pillar.icon className={`h-6 w-6 text-${pillar.color}-400 print:text-${pillar.color}-700`} />
                    </div>
                    <h4 className={`text-base font-bold text-${pillar.color}-400 text-center mb-2 print:text-${pillar.color}-700`}>{pillar.label}</h4>
                    <p className="text-sm text-slate-400 text-center leading-relaxed print:text-gray-600">{pillar.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-cyan-500/10 to-teal-500/5 rounded-xl print:hidden" />
              <div className="relative border border-teal-500/30 rounded-xl p-6 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse print:animate-none" />
                    <span className="text-sm font-bold text-teal-400 tracking-widest uppercase print:text-teal-700">Continuous Execution</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-teal-500/40 to-transparent print:bg-gray-300" />
                </div>
                <p className="text-base text-slate-300 leading-relaxed print:text-gray-600">
                  <span className="text-teal-400 font-semibold print:text-teal-700">The first online hybrid accelerator:</span> AI handles the heavy lifting—matching, analytics, roadmaps—while human mentors and physical hubs deliver <span className="text-cyan-400 font-medium print:text-cyan-700">real-world execution support</span>. No graduation, no time limits—just a permanent growth engine that scales with your startup.
                </p>
              </div>
            </div>
            </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 3: The Problem - System Failure */}
        <SlideWrapper>
           <section className="absolute inset-0 flex flex-col items-center justify-center p-[1.5%] overflow-hidden print:relative print:p-8 print:break-after-page print:bg-white">
            {/* Background image */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat print:hidden" style={{
            backgroundImage: `url(${moonEarthBg})`
          }} />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/80 to-slate-950/85 print:hidden" />
            {/* Border frame */}
            <div className="absolute inset-[1%] border-2 border-rose-500/30 rounded-lg print:border-gray-300" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[99%] mx-auto">
              <div className="flex flex-col items-center w-full">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-rose-500 rotate-45" />
              <span className="text-base font-semibold text-rose-400 tracking-[0.3em] uppercase print:text-gray-600">System Failure</span>
              <div className="w-3 h-3 bg-rose-500 rotate-45" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 print:text-black">The Problem</h2>
            
            {/* Main Problem Statement */}
            <div className="w-full mb-6">
              <p className="text-xl md:text-2xl text-center text-slate-300 leading-relaxed print:text-gray-700">
                Startups don't fail due to lack of ideas — <span className="text-rose-400 font-semibold print:text-rose-700">they fail because execution breaks between stages.</span>
              </p>
            </div>
            
            {/* Visual Broken System Flow */}
            <div className="relative w-full mb-6">
              {/* Broken flow line */}
              <div className="absolute top-14 left-0 right-0 h-1 print:hidden">
                <div className="absolute left-0 w-[18%] h-full bg-gradient-to-r from-teal-500/60 to-rose-500/60" />
                <div className="absolute left-[20%] w-5 h-5 -top-2 rotate-45 border-2 border-rose-500 bg-slate-950 flex items-center justify-center">
                  <span className="text-rose-500 text-sm font-bold">✕</span>
                </div>
                <div className="absolute left-[24%] w-[14%] h-full bg-gradient-to-r from-rose-500/30 to-rose-500/60 opacity-50" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, currentColor 4px, currentColor 8px)'
                  }} />
                <div className="absolute left-[40%] w-5 h-5 -top-2 rotate-45 border-2 border-rose-500 bg-slate-950 flex items-center justify-center">
                  <span className="text-rose-500 text-sm font-bold">✕</span>
                </div>
                <div className="absolute left-[44%] w-[14%] h-full bg-gradient-to-r from-rose-500/30 to-rose-500/60 opacity-50" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, currentColor 4px, currentColor 8px)'
                  }} />
                <div className="absolute left-[60%] w-5 h-5 -top-2 rotate-45 border-2 border-rose-500 bg-slate-950 flex items-center justify-center">
                  <span className="text-rose-500 text-sm font-bold">✕</span>
                </div>
                <div className="absolute left-[64%] w-[14%] h-full bg-gradient-to-r from-rose-500/30 to-rose-500/60 opacity-50" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, currentColor 4px, currentColor 8px)'
                  }} />
                <div className="absolute left-[80%] w-5 h-5 -top-2 rotate-45 border-2 border-rose-500 bg-slate-950 flex items-center justify-center">
                  <span className="text-rose-500 text-sm font-bold">✕</span>
                </div>
                <div className="absolute left-[84%] w-[16%] h-full bg-gradient-to-r from-rose-500/30 to-slate-500/20 opacity-50" />
              </div>
              
              {/* Journey Stages - Disconnected */}
              <div className="grid grid-cols-5 gap-4 relative">
                {[
                  { icon: GraduationCap, label: "Education", active: true, color: "teal" },
                  { icon: Cpu, label: "Product", active: false, color: "slate" },
                  { icon: Target, label: "Market", active: false, color: "slate" },
                  { icon: DollarSign, label: "Revenue", active: false, color: "slate" },
                  { icon: TrendingUp, label: "Scale", active: false, color: "slate", dim: true },
                ].map((stage, i) => (
                  <div key={i} className={`flex flex-col items-center ${!stage.active ? 'opacity-70' : ''} ${(stage as any).dim ? 'opacity-40' : ''}`}>
                    <div className={`w-18 h-18 rounded-full bg-gradient-to-br ${stage.active ? `from-${stage.color}-500/30 to-${stage.color}-600/20 border-2 border-${stage.color}-500/60` : 'from-slate-800 to-slate-900 border-2 border-rose-500/40 border-dashed'} flex items-center justify-center z-10 print:bg-white`} style={{ width: 72, height: 72 }}>
                      <stage.icon className={`h-8 w-8 ${stage.active ? `text-${stage.color}-400` : 'text-slate-500'} print:text-gray-500`} />
                    </div>
                    <div className="mt-3 text-center">
                      <h5 className={`text-sm font-bold ${stage.active ? `text-${stage.color}-400` : 'text-slate-500'} print:text-gray-500`}>{stage.label}</h5>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <SectionDivider title="Core Gaps" />
            
            {/* Core Gaps - Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
              {[
                { icon: Network, num: "01", desc: "Fragmented tools & platforms" },
                { icon: Calendar, num: "02", desc: "No support post-demo day" },
                { icon: Users, num: "03", desc: "Limited access to operators" },
                { icon: DollarSign, num: "04", desc: "Capital ≠ execution" },
                { icon: TrendingUp, num: "05", desc: "Education ≠ revenue" },
              ].map((gap, i) => (
                <div key={i} className="relative group">
                  <div className="absolute inset-0 bg-rose-500/10 blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                  <div className="relative bg-slate-900/80 border border-rose-500/30 rounded-xl p-4 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                    <div className="flex items-center gap-2 mb-2">
                      <gap.icon className="h-5 w-5 text-rose-400 print:text-rose-700" />
                      <span className="text-sm font-bold text-rose-400 print:text-rose-700">{gap.num}</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed print:text-gray-600">{gap.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 4: Solution */}
        <SlideWrapper>
           <section className="absolute inset-0 flex flex-col items-center justify-center p-[1.5%] overflow-hidden print:relative print:p-8 print:break-after-page print:bg-white">
            {/* Galaxy background */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat print:hidden" style={{ backgroundImage: `url(${galaxyBg})` }} />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 print:hidden" />
            {/* Border frame */}
             <div className="absolute inset-[1%] border-2 border-teal-500/30 rounded-lg print:border-gray-300" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full mx-auto px-[2%]">
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-3 h-3 bg-teal-500 rotate-45" />
              <span className="text-base font-semibold text-teal-400 tracking-[0.3em] uppercase print:text-gray-600">Unified Execution</span>
              <div className="w-3 h-3 bg-teal-500 rotate-45" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 print:text-black">Solution</h2>
            <p className="text-xl md:text-2xl text-teal-400 font-semibold text-center mb-2 print:text-teal-700">AI-Powered Hybrid Acceleration Platform</p>
            <p className="text-base md:text-lg text-slate-300 text-center mb-6 print:text-gray-600">
              Startup Factory Hub provides a unified execution platform that combines AI, human expertise, physical infrastructure, and capital access to help startups move from idea to growth-stage scale.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 w-full">
              {/* AI-Driven Execution Engine */}
              <TechCard glowColor="teal" className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                    <Cpu className="h-5 w-5 text-teal-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-teal-400 print:text-teal-700">AI-Driven Execution Engine</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-400 print:text-gray-600">
                  A comprehensive algorithm guides startups through strategy, product development, market validation, go-to-market, and scaling—reducing execution risk at every stage.
                </p>
              </TechCard>

              {/* Hybrid Digital + Physical Model */}
              <TechCard glowColor="cyan" className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-cyan-400 print:text-cyan-700">Hybrid Digital + Physical</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-400 print:text-gray-600">
                  Startups operate digitally through the platform while accessing local innovation hubs worldwide through partnerships with IWG, enabling founders to work from 5,800+ locations across 130 countries.
                </p>
              </TechCard>

              {/* Human Capital & Expertise */}
              <TechCard glowColor="purple" className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-purple-400 print:text-purple-700">Human Capital & Expertise</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-400 print:text-gray-600">
                  On-demand access to mentors, operators, technical experts, interns, and advisors aligned to each startup's specific execution needs.
                </p>
              </TechCard>

              {/* Corporate & Market Access */}
              <TechCard glowColor="amber" className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-amber-400 print:text-amber-700">Corporate & Market Access</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-400 print:text-gray-600">
                  Direct pathways to corporate partnerships, pilot programs, customers, and industry collaborators to accelerate real-world traction.
                </p>
              </TechCard>

              {/* Capital & Investor Connectivity */}
              <TechCard glowColor="emerald" className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Diamond className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-emerald-400 print:text-emerald-700">Capital & Investor Connectivity</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-400 print:text-gray-600">
                  Integrated investor engagement, pitch readiness, and access to VCs, family offices, and strategic capital—connected directly to execution progress.
                </p>
              </TechCard>

              {/* Global Resource Map */}
              <TechCard glowColor="rose" className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-rose-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-rose-400 print:text-rose-700">Global Resource Map</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-400 print:text-gray-600">
                  A comprehensive 3D global visualization tool to map resources across the world—coworking spaces, labs, accelerators, grants, and partners in one interactive view.
                </p>
              </TechCard>
            </div>
          </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 5: The Product */}
        <SlideWrapper>
          <section className="absolute inset-0 flex items-center justify-center overflow-hidden print:relative print:p-8 print:break-after-page print:bg-white">
            {/* Background image */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat print:hidden" style={{ backgroundImage: `url(${nebulaBg})` }} />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 print:hidden" />
            <div className="absolute inset-[2%] border-2 border-teal-500/30 rounded-lg print:border-gray-300" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />

            {/* Tron-style glowing circuit lines */}
            <div className="absolute top-[30%] left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)] print:hidden" />
            <div className="absolute top-[70%] left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent shadow-[0_0_10px_rgba(6,182,212,0.2)] print:hidden" />
            <div className="absolute top-0 left-[25%] w-px h-full bg-gradient-to-b from-transparent via-emerald-500/15 to-transparent print:hidden" />
            <div className="absolute top-0 right-[20%] w-px h-full bg-gradient-to-b from-transparent via-teal-500/15 to-transparent print:hidden" />

            {/* Diagonal light beams */}
            <div className="absolute top-0 right-[30%] w-[1px] h-[60%] bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent origin-top rotate-[15deg] print:hidden" />
            <div className="absolute top-0 right-[50%] w-[1px] h-[50%] bg-gradient-to-b from-cyan-500/15 via-cyan-500/5 to-transparent origin-top rotate-[-10deg] print:hidden" />

            {/* Neon ring accents */}
            <div className="absolute top-[12%] left-[6%] w-16 h-16 rounded-full border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] print:hidden" />
            <div className="absolute top-[14%] left-[7%] w-12 h-12 rounded-full border border-emerald-500/10 print:hidden" />
            <div className="absolute bottom-[15%] right-[5%] w-20 h-20 rounded-full border border-cyan-500/15 shadow-[0_0_25px_rgba(6,182,212,0.12)] print:hidden" />
            <div className="absolute bottom-[17%] right-[6%] w-14 h-14 rounded-full border border-cyan-500/10 print:hidden" />

            {/* Glowing particle dots */}
            <div className="absolute top-[18%] left-[20%] w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.6)] print:hidden" />
            <div className="absolute top-[45%] left-[4%] w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)] print:hidden" />
            <div className="absolute bottom-[22%] left-[15%] w-1.5 h-1.5 bg-teal-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.5)] print:hidden" />
            <div className="absolute top-[55%] right-[3%] w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.6)] print:hidden" />
            <div className="absolute top-[75%] right-[18%] w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)] print:hidden" />
            <div className="absolute bottom-[40%] left-[30%] w-1.5 h-1.5 bg-teal-400 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.5)] print:hidden" />

            {/* Pulsing corner nodes */}
            <div className="absolute top-[16%] left-[16%] w-1.5 h-1.5 bg-emerald-500/40 shadow-[0_0_6px_rgba(16,185,129,0.4)] print:hidden" />
            <div className="absolute top-[32%] left-[48%] w-1.5 h-1.5 bg-teal-500/40 shadow-[0_0_6px_rgba(20,184,166,0.4)] print:hidden" />
            <div className="absolute bottom-[32%] right-[32%] w-1.5 h-1.5 bg-cyan-500/40 shadow-[0_0_6px_rgba(6,182,212,0.4)] print:hidden" />
            <div className="absolute top-[48%] right-[16%] w-1.5 h-1.5 bg-emerald-500/40 shadow-[0_0_6px_rgba(16,185,129,0.4)] print:hidden" />

            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-[4%] py-[3%]">
              {/* Centered Title */}
              <div className="flex flex-col items-center mb-4">
                <div className="flex items-center gap-3 mb-1">
                  <IconBadge icon={Cpu} color="emerald" />
                  <h2 className="text-2xl md:text-3xl font-bold text-white print:text-black">The Product</h2>
                </div>
                <p className="text-sm text-emerald-400 font-semibold">All-in-One Startup Operating System</p>
              </div>

              {/* Main layout: big screen center + overlapping screens */}
              <div className="relative flex-1 w-full min-h-0">
                
                {/* Floating screen - top left */}
                <div className="absolute bg-white rounded overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.35),0_0_20px_rgba(6,182,212,0.2)]"
                  style={{ width: '28%', aspectRatio: '16/10', left: '2%', top: '5%', transform: 'rotateY(6deg) rotateZ(-2deg)', zIndex: 2 }}>
                  <img src={mockupResources} alt="Resources" className="w-full h-full object-cover object-top" />
                </div>

                {/* Floating screen - top right */}
                <div className="absolute bg-white rounded overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.35),0_0_20px_rgba(6,182,212,0.2)]"
                  style={{ width: '26%', aspectRatio: '16/10', right: '3%', top: '3%', transform: 'rotateY(-5deg) rotateZ(2deg)', zIndex: 2 }}>
                  <img src={mockupJourney} alt="Journey" className="w-full h-full object-cover object-top" />
                </div>

                {/* Floating screen - mid left */}
                <div className="absolute bg-white rounded overflow-hidden shadow-[0_10px_45px_rgba(0,0,0,0.3),0_0_15px_rgba(16,185,129,0.15)]"
                  style={{ width: '22%', aspectRatio: '16/10', left: '5%', top: '40%', transform: 'rotateY(8deg) rotateZ(-1deg)', zIndex: 1 }}>
                  <img src={mockupHubs} alt="Hubs Map" className="w-full h-full object-cover object-center" />
                </div>

                {/* Floating screen - mid right */}
                <div className="absolute bg-white rounded overflow-hidden shadow-[0_10px_45px_rgba(0,0,0,0.3),0_0_15px_rgba(16,185,129,0.15)]"
                  style={{ width: '24%', aspectRatio: '16/10', right: '4%', top: '38%', transform: 'rotateY(-6deg) rotateZ(1deg)', zIndex: 1 }}>
                  <img src={mockupHubs} alt="Hubs" className="w-full h-full object-cover object-top" />
                </div>

                {/* Central monitor - large, dominant */}
                <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2" style={{ width: '52%', zIndex: 4 }}>
                  <div className="rounded-xl overflow-hidden bg-black p-[4px] shadow-[0_25px_80px_rgba(0,0,0,0.5),0_0_40px_rgba(16,185,129,0.25)]">
                    <div className="bg-black flex justify-center py-[3px]">
                      <div className="w-2 h-2 rounded-full bg-slate-700" />
                    </div>
                    <div className="bg-white rounded-sm overflow-hidden">
                      <img src={mockupDashboard} alt="Platform" className="w-full h-auto block" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-[5%] h-5 bg-gradient-to-b from-slate-500 to-slate-600" />
                    <div className="w-[18%] h-[3px] bg-slate-500 rounded-full" />
                  </div>
                </div>

                {/* Phone mockup - bottom right overlapping */}
                <div className="absolute" style={{ right: '14%', bottom: '6%', width: '11%', zIndex: 5 }}>
                  <div className="rounded-[12px] overflow-hidden bg-black p-[2px] shadow-[0_15px_50px_rgba(0,0,0,0.4),0_0_25px_rgba(16,185,129,0.25)]">
                    <div className="bg-black flex justify-center pt-[3px] pb-[1px] rounded-t-[10px]">
                      <div className="w-6 h-1 bg-slate-800 rounded-full" />
                    </div>
                    <div className="bg-white overflow-hidden">
                      <img src={mockupMobile} alt="Mobile App" className="w-full h-auto block" />
                    </div>
                    <div className="bg-black flex justify-center py-[2px]">
                      <div className="w-4 h-0.5 bg-slate-700 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature bubbles distributed around the slide */}
              {[
                { icon: Cpu, label: 'AI Strategies', desc: 'Smart growth recommendations', color: 'emerald', top: '8%', left: '4%' },
                { icon: BarChart3, label: 'Business Intelligence', desc: 'Market insights & analytics', color: 'cyan', top: '8%', right: '4%' },
                { icon: MapPin, label: 'Resources Map', desc: 'Global partners & perks', color: 'teal', top: '40%', left: '1%' },
                { icon: Rocket, label: 'Startup Journey', desc: 'Idea to scale guidance', color: 'emerald', bottom: '18%', left: '3%' },
                { icon: Users, label: 'Mentorship', desc: 'Mentors & advisors', color: 'purple', top: '40%', right: '1%' },
                { icon: Diamond, label: 'Investor Match', desc: 'Pitch & raise capital', color: 'amber', bottom: '18%', right: '3%' },
                { icon: Smartphone, label: 'Mobile Ready', desc: 'Any device, anywhere', color: 'cyan', bottom: '6%', left: '38%' },
                { icon: Building2, label: 'Hybrid', desc: 'Digital + physical model', color: 'rose', bottom: '6%', right: '35%' },
              ].map((item, i) => {
                const posStyle: React.CSSProperties = { zIndex: 6 };
                if (item.top) posStyle.top = item.top;
                if ((item as any).bottom) posStyle.bottom = (item as any).bottom;
                if (item.left) posStyle.left = item.left;
                if ((item as any).right) posStyle.right = (item as any).right;
                return (
                  <div
                    key={i}
                    className={`absolute backdrop-blur-md bg-slate-900/70 border border-${item.color}-500/30 rounded-xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_15px_rgba(16,185,129,0.15)] hover:border-${item.color}-500/60 transition-all`}
                    style={posStyle}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg bg-${item.color}-500/20 border border-${item.color}-500/30 flex items-center justify-center`}>
                        <item.icon className={`h-4.5 w-4.5 text-${item.color}-400`} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[11px] font-bold text-${item.color}-400 whitespace-nowrap`}>{item.label}</span>
                        <span className="text-[8px] text-slate-400 leading-tight">{item.desc}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bottom accent bar */}
              <div className="mt-1.5 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)] print:hidden" />
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 6: Ecosystem Overview */}
        <SlideContainer>
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="flex items-center gap-4 mb-3">
              <IconBadge icon={Users} color="teal" />
              <h2 className="text-4xl font-bold text-white print:text-black">Ecosystem Overview</h2>
            </div>
            <p className="text-lg text-slate-400 text-center mb-4 max-w-4xl print:text-gray-600">
              A unified platform serving 8 stakeholder types with role-specific dashboards and AI-powered workflow automation.
            </p>
            
            {/* Compact User Grid - 8 columns */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3 w-full mb-6">
              {[
                { icon: Rocket, label: "Startups", color: "emerald" },
                { icon: Diamond, label: "Investors", color: "purple" },
                { icon: Lightbulb, label: "Mentors", color: "cyan" },
                { icon: Award, label: "Advisors", color: "amber" },
                { icon: GraduationCap, label: "Students", color: "rose" },
                { icon: Building2, label: "Accelerators", color: "teal" },
                { icon: Handshake, label: "Corporates", color: "indigo" },
                { icon: Network, label: "Admins", color: "slate" },
              ].map((user, i) => (
                <div key={i} className={`bg-slate-900/60 border border-${user.color}-500/30 rounded-xl p-3 text-center hover:border-${user.color}-500/60 transition-all print:bg-gray-50`}>
                  <div className={`w-10 h-10 rounded-lg bg-${user.color}-500/20 flex items-center justify-center mx-auto mb-1.5`}>
                    <user.icon className={`h-5 w-5 text-${user.color}-400`} />
                  </div>
                  <span className={`text-xs font-semibold text-${user.color}-400`}>{user.label}</span>
                </div>
              ))}
            </div>

            <SectionDivider title="Startup Journey Roadmap" />
            
            {/* Dynamic Roadmap Timeline - Full Width */}
            <div className="relative w-full mt-2">
              {/* Glowing connection line */}
              <div className="absolute top-[72px] left-[8%] right-[8%] h-[4px] z-0">
                <div className="w-full h-full bg-gradient-to-r from-amber-500/50 via-teal-500/70 via-purple-500/60 to-rose-500/50 rounded-full" />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 via-teal-500/40 via-purple-500/30 to-rose-500/30 rounded-full blur-lg" />
                <div className="absolute inset-[-2px] bg-gradient-to-r from-amber-500/10 via-teal-500/15 to-rose-500/10 rounded-full blur-2xl" />
              </div>

              <div className="grid grid-cols-6 gap-4 relative z-10">
                {[
                  { icon: Lightbulb, label: "Idea", desc: "Validate concept & identify market need", color: "amber", step: "01" },
                  { icon: Search, label: "Research", desc: "Analyze market, competitors & segments", color: "cyan", step: "02" },
                  { icon: Cpu, label: "MVP", desc: "Build minimum viable product & core features", color: "teal", step: "03" },
                  { icon: Target, label: "Validation", desc: "User testing & iterate on real feedback", color: "purple", step: "04" },
                  { icon: Rocket, label: "Launch", desc: "Go-to-market & customer acquisition", color: "emerald", step: "05" },
                  { icon: TrendingUp, label: "Growth", desc: "Scale operations, raise funding & expand", color: "rose", step: "06" },
                ].map((stage, i) => (
                  <div key={i} className="flex flex-col items-center group relative">
                    {/* Step number badge */}
                    <div className={`text-xs font-bold tracking-widest text-${stage.color}-400/80 mb-2 uppercase`}>Step {stage.step}</div>
                    
                    {/* Glowing node circle */}
                    <div className="relative mb-4">
                      <div className={`absolute inset-[-10px] rounded-full bg-${stage.color}-500/20 blur-xl group-hover:bg-${stage.color}-500/40 transition-all duration-500`} />
                      <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-${stage.color}-500/30 to-${stage.color}-600/20 border-2 border-${stage.color}-500/50 flex items-center justify-center group-hover:border-${stage.color}-400 group-hover:scale-110 transition-all duration-500`}>
                        <stage.icon className={`h-9 w-9 text-${stage.color}-400 group-hover:text-${stage.color}-300 transition-colors`} />
                      </div>
                      <div className={`absolute inset-[-5px] rounded-full border border-${stage.color}-500/0 group-hover:border-${stage.color}-500/40 group-hover:scale-125 transition-all duration-700`} />
                    </div>

                    {/* Content card */}
                    <div className={`bg-slate-900/70 border border-${stage.color}-500/20 rounded-xl p-4 text-center w-full group-hover:border-${stage.color}-500/50 group-hover:bg-slate-800/60 transition-all duration-500`}>
                      <p className={`text-lg font-bold text-${stage.color}-400 mb-1.5`}>{stage.label}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{stage.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 7: Market Opportunity */}
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

        {/* NOTE: Business Model, Revenue Streams, and Financial Projections slides are excluded from this public version */}

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
                { name: "Regus", logo: "/partners/regus-logo.png" },
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

        {/* SLIDE 9: Team */}
        <SlideWrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[1.5%] print:relative print:p-8 print:break-after-page print:bg-white">
            <img src={moonTeamBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 print:hidden" />
            <div className="absolute inset-[1%] border-2 border-teal-500/30 rounded-lg print:border-gray-300" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[99%] mx-auto">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-6">
              <IconBadge icon={Users} color="teal" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">Leadership Team</h2>
            </div>
            <p className="text-lg text-slate-400 mb-8 text-center max-w-2xl print:text-gray-600">
              A global team of innovators and industry leaders dedicated to empowering the next generation of deep tech startups.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-6xl">
              {[
                { name: "Khalia Padilla", role: "Managing Partner & Founder", location: null, img: teamKhalia },
                { name: "Ricardo Font", role: "Managing Partner & Founder", location: null, img: teamRicardo },
                { name: "Steven Lidgreen", role: "Managing Partner", location: "SFH Tokyo", img: teamSteven },
                { name: "Gary Jinks", role: "Strategic Advisor", location: null, img: teamGary },
              ].map((member, i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-8 flex flex-col items-center text-center hover:border-teal-500/40 transition-colors print:bg-gray-50 print:border-gray-300">
                  <div className="w-40 h-40 rounded-full border-2 border-teal-500/40 overflow-hidden mb-5">
                    <img 
                      src={member.img} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<span class="flex items-center justify-center w-full h-full text-2xl font-bold text-teal-300 bg-gradient-to-br from-teal-500/30 to-cyan-500/30">${member.name.split(' ').map(n => n[0]).join('')}</span>`;
                      }}
                    />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white print:text-black">{member.name}</h3>
                  <p className="text-xs md:text-sm text-teal-400 font-medium mt-1">{member.role}</p>
                  {member.location && (
                    <div className="flex items-center gap-1 mt-2">
                      <MapPin className="h-3 w-3 text-cyan-400" />
                      <span className="text-[10px] text-cyan-400">{member.location}</span>
                    </div>
                  )}
                </div>
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
              We're looking for partners, collaborators, and innovators who share our vision of democratizing access to startup success.
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
