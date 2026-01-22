import { Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail, ExternalLink, Printer, Search, Network, BarChart3, Briefcase, GraduationCap, Building2, Diamond, Video, FileText, Calendar, Cpu, DollarSign, Handshake, Zap, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import sfhLogo from '@/assets/sfh-logo-sphere.png';
import rocketLaunchBg from '@/assets/rocket-launch-bg.jpg';
import astronautBg from '@/assets/astronaut-bg.jpg';
import moonEarthBg from '@/assets/moon-earth.jpg';

// Enhanced Geometric Pattern Components (matching marketing banners)
const TechGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden">
    {/* Horizontal lines */}
    {[...Array(25)].map((_, i) => (
      <div 
        key={`h-${i}`} 
        className="absolute w-full h-px bg-gradient-to-r from-transparent via-teal-500/8 to-transparent"
        style={{ top: `${(i + 1) * 4}%` }}
      />
    ))}
    {/* Vertical lines */}
    {[...Array(25)].map((_, i) => (
      <div 
        key={`v-${i}`} 
        className="absolute h-full w-px bg-gradient-to-b from-transparent via-teal-500/8 to-transparent"
        style={{ left: `${(i + 1) * 4}%` }}
      />
    ))}
    {/* Grid intersection dots */}
    {[...Array(6)].map((_, i) => (
      [...Array(6)].map((_, j) => (
        <div 
          key={`dot-${i}-${j}`} 
          className="absolute w-1 h-1 rounded-full bg-teal-500/20"
          style={{ top: `${(i + 1) * 16}%`, left: `${(j + 1) * 16}%` }}
        />
      ))
    ))}
  </div>
);

const FloatingHexagons = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden">
    {/* Large hexagon top right */}
    <div className="absolute top-[10%] right-[5%] w-40 h-40 border-2 border-teal-500/15 rotate-12" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    {/* Medium hexagon top right */}
    <div className="absolute top-[18%] right-[12%] w-24 h-24 border border-cyan-500/12 -rotate-6" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    {/* Small hexagon top left */}
    <div className="absolute top-[15%] left-[8%] w-20 h-20 border border-teal-500/10 rotate-30" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    {/* Bottom left cluster */}
    <div className="absolute bottom-[15%] left-[5%] w-32 h-32 border-2 border-teal-500/12 rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    <div className="absolute bottom-[25%] left-[2%] w-16 h-16 border border-cyan-500/10 -rotate-12" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    {/* Bottom right */}
    <div className="absolute bottom-[10%] right-[8%] w-28 h-28 border border-teal-500/10 rotate-15" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
  </div>
);

const EnergyLines = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden">
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
  </div>
);

const CornerAccents = () => (
  <div className="absolute inset-0 pointer-events-none print:hidden">
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
  </div>
);

// Slide wrapper for consistent 16:9 aspect ratio scaling
const SlideWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full min-h-screen flex items-center justify-center bg-slate-950 p-2 sm:p-4 print:min-h-0 print:p-0 print:bg-white">
    <div className="relative w-full max-w-[1920px] aspect-video overflow-hidden print:aspect-auto print:max-w-none">
      {children}
    </div>
  </div>
);

// Cover slide with background image
const CoverSlideContainer = ({ children }: { children: React.ReactNode }) => (
  <SlideWrapper>
    <section className="absolute inset-0 flex flex-col items-center justify-center p-[4%] overflow-hidden print:relative print:p-8 print:break-after-page print:bg-white">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat print:hidden"
        style={{ backgroundImage: `url(${rocketLaunchBg})` }}
      />
      {/* Dark cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 print:hidden" />
      {/* Scan lines effect */}
      <div className="absolute inset-0 print:hidden" style={{ 
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(20, 184, 166, 0.02) 2px, rgba(20, 184, 166, 0.02) 4px)',
      }} />
      {/* Border frame */}
      <div className="absolute inset-[2%] border-2 border-teal-500/40 rounded-lg print:border-gray-300" />
      <TechGrid />
      <FloatingHexagons />
      <EnergyLines />
      <CornerAccents />
      <div className="relative z-10 w-full max-w-[90%] mx-auto">
        {children}
      </div>
    </section>
  </SlideWrapper>
);

// Standard slide container
const SlideContainer = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <SlideWrapper>
    <section className={`absolute inset-0 flex flex-col items-center justify-center p-[4%] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 print:relative print:p-8 print:break-after-page print:bg-white ${className}`}>
      {/* Border frame */}
      <div className="absolute inset-[2%] border-2 border-teal-500/30 rounded-lg print:border-gray-300" />
      <TechGrid />
      <FloatingHexagons />
      <EnergyLines />
      <CornerAccents />
      <div className="relative z-10 w-full max-w-[90%] mx-auto">
        {children}
      </div>
    </section>
  </SlideWrapper>
);

const SectionDivider = ({ title }: { title: string }) => (
  <div className="flex items-center gap-4 mb-8">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-teal-500" />
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-teal-500 rotate-45" />
      <span className="text-sm font-semibold text-teal-400 tracking-widest uppercase print:text-gray-700">{title}</span>
      <div className="w-2 h-2 bg-teal-500 rotate-45" />
    </div>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-teal-500/50 to-teal-500" />
  </div>
);

const TechCard = ({ children, className = "", glowColor = "teal" }: { children: React.ReactNode; className?: string; glowColor?: string }) => {
  const glowClasses = {
    teal: "border-teal-500/40 hover:border-teal-500/60 shadow-teal-500/10",
    cyan: "border-cyan-500/40 hover:border-cyan-500/60 shadow-cyan-500/10",
    purple: "border-purple-500/40 hover:border-purple-500/60 shadow-purple-500/10",
    emerald: "border-emerald-500/40 hover:border-emerald-500/60 shadow-emerald-500/10",
    amber: "border-amber-500/40 hover:border-amber-500/60 shadow-amber-500/10",
    rose: "border-rose-500/40 hover:border-rose-500/60 shadow-rose-500/10",
  };
  return (
    <div className={`relative bg-slate-900/80 border-2 rounded-lg p-6 backdrop-blur-sm shadow-lg print:bg-white print:border-gray-300 print:shadow-none ${glowClasses[glowColor as keyof typeof glowClasses] || glowClasses.teal} ${className}`}>
      {/* Top glow line */}
      <div className={`absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-${glowColor}-500/60 to-transparent print:hidden`} />
      {children}
    </div>
  );
};

const IconBadge = ({ icon: Icon, color = "teal" }: { icon: React.ComponentType<{ className?: string }>; color?: string }) => {
  const colorClasses = {
    teal: "bg-teal-500/20 text-teal-400 border-teal-500/40",
    cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    rose: "bg-rose-500/20 text-rose-400 border-rose-500/40",
  };
  return (
    <div className={`w-12 h-12 rounded-lg border flex items-center justify-center print:bg-gray-100 print:border-gray-300 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.teal}`}>
      <Icon className="h-6 w-6 print:text-gray-700" />
    </div>
  );
};

export default function Deck() {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white print:bg-white print:text-black">
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
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-teal-500/50 text-teal-400 hover:bg-teal-500/10 hover:border-teal-500">
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Export PDF</span>
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="pt-16 print:pt-0">
        {/* SLIDE 1: Cover */}
        <CoverSlideContainer>
          <div className="flex flex-col items-center text-center">
            {/* Logo with glow */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-teal-500/30 blur-3xl rounded-full print:hidden" />
              <img src={sfhLogo} alt="Startup Factory Hub" className="relative w-28 h-28 md:w-36 md:h-36 object-contain" />
              {/* Orbit ring */}
              <div className="absolute inset-[-20px] border border-dashed border-teal-500/40 rounded-full animate-spin print:hidden" style={{ animationDuration: '20s' }} />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight print:text-black">
              Startup Factory Hub
            </h1>
            
            <p className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-6 print:text-teal-700">
              The Central Operating Hub for Tech Startups
            </p>
            
            {/* Key Value Proposition */}
            <div className="max-w-3xl mb-6">
              <p className="text-base md:text-lg text-slate-300 leading-relaxed print:text-gray-700">
                An AI-powered hybrid technology platform that connects founders with partners, resources, and capital—guiding startups from idea to growth-stage scale.
              </p>
            </div>
            
            <SectionDivider title="Built for Everyone" />
            
            {/* User Types Grid - 5 columns */}
            <div className="grid grid-cols-5 gap-3 max-w-4xl w-full mb-6">
              {/* Startups */}
              <div className="relative group">
                <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative flex flex-col items-center p-4 bg-slate-900/80 border border-teal-500/40 rounded-lg hover:border-teal-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-12 h-12 mb-3 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                    <div className="absolute w-12 h-12 bg-gradient-to-br from-teal-500/30 to-teal-600/30 border border-teal-500/60" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                    <Rocket className="h-5 w-5 text-teal-400 z-10 print:text-teal-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-200 print:text-gray-700">Startups</span>
                </div>
              </div>

              {/* Mentors */}
              <div className="relative group">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative flex flex-col items-center p-4 bg-slate-900/80 border border-cyan-500/40 rounded-lg hover:border-cyan-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-12 h-12 mb-3 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                    <div className="absolute w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-cyan-600/30 border border-cyan-500/60" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                    <Users className="h-5 w-5 text-cyan-400 z-10 print:text-cyan-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-200 print:text-gray-700">Mentors</span>
                </div>
              </div>

              {/* Investors */}
              <div className="relative group">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative flex flex-col items-center p-4 bg-slate-900/80 border border-purple-500/40 rounded-lg hover:border-purple-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-12 h-12 mb-3 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                    <div className="absolute w-12 h-12 bg-gradient-to-br from-purple-500/30 to-purple-600/30 border border-purple-500/60" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                    <Diamond className="h-5 w-5 text-purple-400 z-10 print:text-purple-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-200 print:text-gray-700">Investors</span>
                </div>
              </div>

              {/* Students */}
              <div className="relative group">
                <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative flex flex-col items-center p-4 bg-slate-900/80 border border-rose-500/40 rounded-lg hover:border-rose-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-12 h-12 mb-3 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                    <div className="absolute w-12 h-12 bg-gradient-to-br from-rose-500/30 to-rose-600/30 border border-rose-500/60" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                    <GraduationCap className="h-5 w-5 text-rose-400 z-10 print:text-rose-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-200 print:text-gray-700">Students</span>
                </div>
              </div>

              {/* Accelerators */}
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative flex flex-col items-center p-4 bg-slate-900/80 border border-emerald-500/40 rounded-lg hover:border-emerald-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-12 h-12 mb-3 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                    <div className="absolute w-12 h-12 bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 border border-emerald-500/60" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                    <Building2 className="h-5 w-5 text-emerald-400 z-10 print:text-emerald-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-200 print:text-gray-700">Accelerators</span>
                </div>
              </div>
            </div>
            
            {/* Differentiator */}
            <div className="bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 border border-teal-500/30 rounded-lg px-6 py-4 max-w-3xl print:bg-gray-50 print:border-gray-300">
              <p className="text-sm md:text-base text-slate-300 print:text-gray-700">
                <span className="text-teal-400 font-semibold print:text-teal-700">Unlike traditional accelerators:</span> A continuous execution environment supporting founders before, during, and after acceleration—with a global, hybrid-first model that scales alongside the startup.
              </p>
            </div>
          </div>
        </CoverSlideContainer>

        {/* SLIDE 2: Company Summary - Mechanism Journey */}
        <SlideWrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[4%] overflow-hidden print:relative print:p-8 print:break-after-page print:bg-white">
            {/* Background image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat print:hidden"
              style={{ backgroundImage: `url(${astronautBg})` }}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 print:hidden" />
            {/* Border frame */}
            <div className="absolute inset-[2%] border-2 border-teal-500/30 rounded-lg print:border-gray-300" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[90%] mx-auto">
              <div className="flex flex-col items-center">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-teal-500 rotate-45" />
              <span className="text-sm font-semibold text-teal-400 tracking-[0.3em] uppercase print:text-gray-600">System Architecture</span>
              <div className="w-3 h-3 bg-teal-500 rotate-45" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 print:text-black">Company Summary</h2>
            <p className="text-lg text-slate-400 text-center mb-6 print:text-gray-600">The Execution Mechanism</p>
            
            {/* Company Description Text */}
            <div className="max-w-4xl w-full mb-8 space-y-4">
              <div className="bg-slate-900/60 border border-teal-500/30 rounded-lg p-5 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                <p className="text-base text-slate-300 leading-relaxed text-center print:text-gray-700">
                  <span className="text-teal-400 font-semibold print:text-teal-700">Startup Factory Hub</span> is an AI-powered hybrid technology platform designed to help tech startups succeed. The platform serves as a <span className="text-cyan-400 font-medium print:text-cyan-700">central operating hub</span> for the entire startup ecosystem, connecting founders with partners, resources, and capital while guiding startups from idea to growth-stage scale.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="h-4 w-4 text-cyan-400 print:text-cyan-700" />
                    <span className="text-sm font-semibold text-cyan-400 print:text-cyan-700">AI-Driven Execution</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed print:text-gray-600">
                    Integrates digital infrastructure, human expertise, corporate partnerships, and capital access to accelerate company building and reduce execution friction.
                  </p>
                </div>
                <div className="bg-slate-900/60 border border-purple-500/30 rounded-lg p-4 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-purple-400 print:text-purple-700" />
                    <span className="text-sm font-semibold text-purple-400 print:text-purple-700">Global Hybrid Model</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed print:text-gray-600">
                    Unlike traditional accelerators, operates as a continuous execution environment supporting founders before, during, and after acceleration.
                  </p>
                </div>
              </div>
            </div>

            {/* Mechanism Flow - 4 Pillars */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl w-full mb-8">
              {/* Pillar 1 */}
              <div className="relative group">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-teal-500/60 to-teal-500/20 print:hidden" />
                <div className="bg-slate-900/80 border border-teal-500/40 rounded-lg p-4 backdrop-blur-sm hover:border-teal-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto mb-3 print:bg-gray-100">
                    <Cpu className="h-5 w-5 text-teal-400 print:text-teal-700" />
                  </div>
                  <h4 className="text-sm font-bold text-teal-400 text-center mb-2 print:text-teal-700">Digital Infrastructure</h4>
                  <p className="text-xs text-slate-400 text-center leading-relaxed print:text-gray-600">AI-powered tools & automation</p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="relative group">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-cyan-500/60 to-cyan-500/20 print:hidden" />
                <div className="bg-slate-900/80 border border-cyan-500/40 rounded-lg p-4 backdrop-blur-sm hover:border-cyan-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto mb-3 print:bg-gray-100">
                    <Users className="h-5 w-5 text-cyan-400 print:text-cyan-700" />
                  </div>
                  <h4 className="text-sm font-bold text-cyan-400 text-center mb-2 print:text-cyan-700">Human Expertise</h4>
                  <p className="text-xs text-slate-400 text-center leading-relaxed print:text-gray-600">Mentors, advisors & network</p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="relative group">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-purple-500/60 to-purple-500/20 print:hidden" />
                <div className="bg-slate-900/80 border border-purple-500/40 rounded-lg p-4 backdrop-blur-sm hover:border-purple-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-3 print:bg-gray-100">
                    <Building2 className="h-5 w-5 text-purple-400 print:text-purple-700" />
                  </div>
                  <h4 className="text-sm font-bold text-purple-400 text-center mb-2 print:text-purple-700">Corporate Partners</h4>
                  <p className="text-xs text-slate-400 text-center leading-relaxed print:text-gray-600">Strategic alliances & deals</p>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="relative group">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-emerald-500/60 to-emerald-500/20 print:hidden" />
                <div className="bg-slate-900/80 border border-emerald-500/40 rounded-lg p-4 backdrop-blur-sm hover:border-emerald-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 print:bg-gray-100">
                    <DollarSign className="h-5 w-5 text-emerald-400 print:text-emerald-700" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-400 text-center mb-2 print:text-emerald-700">Capital Access</h4>
                  <p className="text-xs text-slate-400 text-center leading-relaxed print:text-gray-600">Investor network & funding</p>
                </div>
              </div>
            </div>

            <div className="relative max-w-4xl w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-cyan-500/10 to-teal-500/5 rounded-lg print:hidden" />
              <div className="relative border border-teal-500/30 rounded-lg p-5 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse print:animate-none" />
                    <span className="text-xs font-bold text-teal-400 tracking-widest uppercase print:text-teal-700">Continuous Execution</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-teal-500/40 to-transparent print:bg-gray-300" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed print:text-gray-600">
                  <span className="text-teal-400 font-semibold print:text-teal-700">Unlike traditional accelerators:</span> Startup Factory Hub operates as a continuous execution environment, supporting founders <span className="text-cyan-400 font-medium print:text-cyan-700">before, during, and after</span> acceleration—with a global, hybrid-first model that scales alongside the startup.
                </p>
              </div>
            </div>
            </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 3: The Problem - System Failure */}
        <SlideWrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[4%] overflow-hidden print:relative print:p-8 print:break-after-page print:bg-white">
            {/* Background image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat print:hidden"
              style={{ backgroundImage: `url(${moonEarthBg})` }}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-900/80 to-slate-950/85 print:hidden" />
            {/* Border frame */}
            <div className="absolute inset-[2%] border-2 border-rose-500/30 rounded-lg print:border-gray-300" />
            <TechGrid />
            <FloatingHexagons />
            <EnergyLines />
            <CornerAccents />
            <div className="relative z-10 w-full max-w-[90%] mx-auto">
              <div className="flex flex-col items-center">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-rose-500 rotate-45" />
              <span className="text-sm font-semibold text-rose-400 tracking-[0.3em] uppercase print:text-gray-600">System Failure</span>
              <div className="w-3 h-3 bg-rose-500 rotate-45" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 print:text-black">The Problem</h2>
            
            {/* Main Problem Statement */}
            <div className="max-w-3xl w-full mb-8">
              <p className="text-lg md:text-xl text-center text-slate-300 leading-relaxed print:text-gray-700">
                Startups don't fail due to lack of ideas — <span className="text-rose-400 font-semibold print:text-rose-700">they fail because execution breaks between stages.</span>
              </p>
            </div>
            
            {/* Visual Broken System Flow */}
            <div className="relative max-w-5xl w-full mb-8">
              {/* Broken flow line */}
              <div className="absolute top-12 left-0 right-0 h-1 print:hidden">
                <div className="absolute left-0 w-[18%] h-full bg-gradient-to-r from-teal-500/60 to-rose-500/60" />
                <div className="absolute left-[20%] w-4 h-4 -top-1.5 rotate-45 border-2 border-rose-500 bg-slate-950 flex items-center justify-center">
                  <span className="text-rose-500 text-xs font-bold">✕</span>
                </div>
                <div className="absolute left-[24%] w-[14%] h-full bg-gradient-to-r from-rose-500/30 to-rose-500/60 opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, currentColor 4px, currentColor 8px)' }} />
                <div className="absolute left-[40%] w-4 h-4 -top-1.5 rotate-45 border-2 border-rose-500 bg-slate-950 flex items-center justify-center">
                  <span className="text-rose-500 text-xs font-bold">✕</span>
                </div>
                <div className="absolute left-[44%] w-[14%] h-full bg-gradient-to-r from-rose-500/30 to-rose-500/60 opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, currentColor 4px, currentColor 8px)' }} />
                <div className="absolute left-[60%] w-4 h-4 -top-1.5 rotate-45 border-2 border-rose-500 bg-slate-950 flex items-center justify-center">
                  <span className="text-rose-500 text-xs font-bold">✕</span>
                </div>
                <div className="absolute left-[64%] w-[14%] h-full bg-gradient-to-r from-rose-500/30 to-rose-500/60 opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, currentColor 4px, currentColor 8px)' }} />
                <div className="absolute left-[80%] w-4 h-4 -top-1.5 rotate-45 border-2 border-rose-500 bg-slate-950 flex items-center justify-center">
                  <span className="text-rose-500 text-xs font-bold">✕</span>
                </div>
                <div className="absolute left-[84%] w-[16%] h-full bg-gradient-to-r from-rose-500/30 to-slate-500/20 opacity-50" />
              </div>
              
              {/* Journey Stages - Disconnected */}
              <div className="grid grid-cols-5 gap-2 relative">
                {/* Stage 1: Education */}
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500/30 to-teal-600/20 border-2 border-teal-500/60 flex items-center justify-center z-10 print:bg-white print:border-teal-400">
                    <GraduationCap className="h-6 w-6 text-teal-400 print:text-teal-700" />
                  </div>
                  <div className="mt-3 text-center">
                    <h5 className="text-xs font-bold text-teal-400 print:text-teal-700">Education</h5>
                  </div>
                </div>

                {/* Stage 2: Product */}
                <div className="flex flex-col items-center opacity-70">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-rose-500/40 border-dashed flex items-center justify-center z-10 print:bg-white print:border-gray-400">
                    <Cpu className="h-6 w-6 text-slate-500 print:text-gray-500" />
                  </div>
                  <div className="mt-3 text-center">
                    <h5 className="text-xs font-bold text-slate-500 print:text-gray-500">Product</h5>
                  </div>
                </div>

                {/* Stage 3: Market */}
                <div className="flex flex-col items-center opacity-70">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-rose-500/40 border-dashed flex items-center justify-center z-10 print:bg-white print:border-gray-400">
                    <Target className="h-6 w-6 text-slate-500 print:text-gray-500" />
                  </div>
                  <div className="mt-3 text-center">
                    <h5 className="text-xs font-bold text-slate-500 print:text-gray-500">Market</h5>
                  </div>
                </div>

                {/* Stage 4: Revenue */}
                <div className="flex flex-col items-center opacity-70">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-rose-500/40 border-dashed flex items-center justify-center z-10 print:bg-white print:border-gray-400">
                    <DollarSign className="h-6 w-6 text-slate-500 print:text-gray-500" />
                  </div>
                  <div className="mt-3 text-center">
                    <h5 className="text-xs font-bold text-slate-500 print:text-gray-500">Revenue</h5>
                  </div>
                </div>

                {/* Stage 5: Scale */}
                <div className="flex flex-col items-center opacity-40">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600/40 border-dashed flex items-center justify-center z-10 print:bg-white print:border-gray-400">
                    <TrendingUp className="h-6 w-6 text-slate-600 print:text-gray-400" />
                  </div>
                  <div className="mt-3 text-center">
                    <h5 className="text-xs font-bold text-slate-600 print:text-gray-400">Scale</h5>
                  </div>
                </div>
              </div>
            </div>

            <SectionDivider title="Core Gaps" />
            
            {/* Core Gaps - Visual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 max-w-5xl w-full">
              <div className="relative group">
                <div className="absolute inset-0 bg-rose-500/10 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative bg-slate-900/80 border border-rose-500/30 rounded-lg p-3 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Network className="h-4 w-4 text-rose-400 print:text-rose-700" />
                    <span className="text-xs font-bold text-rose-400 print:text-rose-700">01</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed print:text-gray-600">Fragmented tools & platforms</p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-rose-500/10 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative bg-slate-900/80 border border-rose-500/30 rounded-lg p-3 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-rose-400 print:text-rose-700" />
                    <span className="text-xs font-bold text-rose-400 print:text-rose-700">02</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed print:text-gray-600">No support post-demo day</p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-rose-500/10 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative bg-slate-900/80 border border-rose-500/30 rounded-lg p-3 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-rose-400 print:text-rose-700" />
                    <span className="text-xs font-bold text-rose-400 print:text-rose-700">03</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed print:text-gray-600">Limited access to operators</p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-rose-500/10 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative bg-slate-900/80 border border-rose-500/30 rounded-lg p-3 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-rose-400 print:text-rose-700" />
                    <span className="text-xs font-bold text-rose-400 print:text-rose-700">04</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed print:text-gray-600">Capital ≠ execution</p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-rose-500/10 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative bg-slate-900/80 border border-rose-500/30 rounded-lg p-3 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-rose-400 print:text-rose-700" />
                    <span className="text-xs font-bold text-rose-400 print:text-rose-700">05</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed print:text-gray-600">Education ≠ revenue</p>
                </div>
              </div>
            </div>
            </div>
            </div>
          </section>
        </SlideWrapper>

        {/* SLIDE 4: Solution */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <IconBadge icon={Lightbulb} color="teal" />
              <h2 className="text-2xl md:text-3xl font-bold text-white print:text-black">Solution</h2>
            </div>
            <p className="text-base md:text-lg text-teal-400 font-semibold text-center mb-1 print:text-teal-700">AI-Powered Hybrid Acceleration Platform</p>
            <p className="text-xs md:text-sm text-slate-400 text-center mb-6 max-w-3xl print:text-gray-600">
              Startup Factory Hub provides a unified execution platform that combines AI, human expertise, physical infrastructure, and capital access to help startups move from idea to growth-stage scale.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-5xl w-full">
              {/* AI-Driven Execution Engine */}
              <TechCard glowColor="teal" className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-teal-500/20 flex items-center justify-center">
                    <Cpu className="h-3.5 w-3.5 text-teal-400" />
                  </div>
                  <h3 className="font-semibold text-xs text-teal-400 print:text-teal-700">AI-Driven Execution Engine</h3>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-400 print:text-gray-600">
                  A comprehensive algorithm guides startups through strategy, product development, market validation, go-to-market, and scaling—reducing execution risk at every stage.
                </p>
              </TechCard>

              {/* Hybrid Digital + Physical Model */}
              <TechCard glowColor="cyan" className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-xs text-cyan-400 print:text-cyan-700">Hybrid Digital + Physical</h3>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-400 print:text-gray-600">
                  Startups operate digitally through the platform while accessing local innovation hubs worldwide through partnerships with IWG, enabling founders to work from 5,800+ locations across 130 countries.
                </p>
              </TechCard>

              {/* Human Capital & Expertise */}
              <TechCard glowColor="purple" className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-xs text-purple-400 print:text-purple-700">Human Capital & Expertise</h3>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-400 print:text-gray-600">
                  On-demand access to mentors, operators, technical experts, interns, and advisors aligned to each startup's specific execution needs.
                </p>
              </TechCard>

              {/* Corporate & Market Access */}
              <TechCard glowColor="amber" className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center">
                    <Building2 className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-xs text-amber-400 print:text-amber-700">Corporate & Market Access</h3>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-400 print:text-gray-600">
                  Direct pathways to corporate partnerships, pilot programs, customers, and industry collaborators to accelerate real-world traction.
                </p>
              </TechCard>

              {/* Capital & Investor Connectivity */}
              <TechCard glowColor="emerald" className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">
                    <Diamond className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-xs text-emerald-400 print:text-emerald-700">Capital & Investor Connectivity</h3>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-400 print:text-gray-600">
                  Integrated investor engagement, pitch readiness, and access to VCs, family offices, and strategic capital—connected directly to execution progress.
                </p>
              </TechCard>

              {/* Global Resource Map */}
              <TechCard glowColor="rose" className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-rose-500/20 flex items-center justify-center">
                    <Globe className="h-3.5 w-3.5 text-rose-400" />
                  </div>
                  <h3 className="font-semibold text-xs text-rose-400 print:text-rose-700">Global Resource Map</h3>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-400 print:text-gray-600">
                  A comprehensive 3D global visualization tool to map resources across the world—coworking spaces, labs, accelerators, grants, and partners in one interactive view.
                </p>
              </TechCard>
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 4: Key Features */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              <IconBadge icon={Cpu} color="teal" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">Key Features</h2>
            </div>
            <p className="text-xl text-slate-400 text-center mb-12 print:text-gray-600">Powered by Innovation</p>
            
            <div className="grid md:grid-cols-3 gap-4 max-w-5xl w-full">
              {[
                { icon: Cpu, title: "AI Recommendations", desc: "Smart matching algorithms for optimal connections", color: "teal" },
                { icon: Video, title: "Video Conferencing", desc: "Integrated virtual meetings and pitch sessions", color: "cyan" },
                { icon: FileText, title: "Document Suite", desc: "LightPaper productivity and collaboration tools", color: "purple" },
                { icon: Calendar, title: "Global Events", desc: "Networking opportunities and demo days", color: "emerald" },
                { icon: Briefcase, title: "Job Board", desc: "Talent acquisition and career opportunities", color: "amber" },
                { icon: BarChart3, title: "Market Intelligence", desc: "Real-time insights and analytics", color: "rose" },
              ].map((feature, i) => (
                <TechCard key={i} glowColor={feature.color} className="text-center">
                  <div className="flex justify-center mb-3">
                    <IconBadge icon={feature.icon} color={feature.color} />
                  </div>
                  <h4 className={`font-semibold text-${feature.color}-400 mb-2 print:text-gray-700`}>{feature.title}</h4>
                  <p className="text-sm text-slate-400 print:text-gray-600">{feature.desc}</p>
                </TechCard>
              ))}
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 5: Our Network */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              <IconBadge icon={Users} color="teal" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">Our Network</h2>
            </div>
            <p className="text-xl text-slate-400 text-center mb-12 print:text-gray-600">Growing Global Community</p>
            
            <div className="grid md:grid-cols-4 gap-6 max-w-4xl w-full">
              {[
                { icon: Rocket, value: "500+", label: "Startups", color: "emerald" },
                { icon: Lightbulb, value: "150+", label: "Mentors", color: "cyan" },
                { icon: Diamond, value: "75+", label: "Investors", color: "purple" },
                { icon: Globe, value: "25+", label: "Countries", color: "amber" },
              ].map((stat, i) => (
                <TechCard key={i} glowColor={stat.color} className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <IconBadge icon={stat.icon} color={stat.color} />
                  </div>
                  <div className={`text-4xl md:text-5xl font-black bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-300 bg-clip-text text-transparent mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-slate-400 font-medium print:text-gray-600">{stat.label}</div>
                </TechCard>
              ))}
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 6: Market Opportunity */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              <IconBadge icon={TrendingUp} color="teal" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">Market Opportunity</h2>
            </div>
            <p className="text-xl text-slate-400 text-center mb-12 print:text-gray-600">$25B+ Global Accelerator Market</p>
            
            <div className="max-w-3xl w-full space-y-6">
              <TechCard glowColor="teal">
                <h3 className="font-semibold text-lg mb-4 text-teal-400 flex items-center gap-2 print:text-teal-700">
                  <TrendingUp className="h-5 w-5" /> Growth Drivers
                </h3>
                <ul className="space-y-4 text-slate-300 print:text-gray-600">
                  <li className="flex items-center gap-4">
                    <IconBadge icon={TrendingUp} color="emerald" />
                    <span>15% CAGR in startup ecosystem growth</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <IconBadge icon={Globe} color="cyan" />
                    <span>Increasing global entrepreneurship</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <IconBadge icon={Cpu} color="purple" />
                    <span>Digital transformation of business support</span>
                  </li>
                </ul>
              </TechCard>
              <TechCard glowColor="cyan">
                <h3 className="font-semibold text-lg mb-2 text-cyan-400 flex items-center gap-2 print:text-cyan-700">
                  <Globe className="h-5 w-5" /> Target Markets
                </h3>
                <p className="text-slate-300 print:text-gray-600">North America, Europe, Asia-Pacific, Latin America, Middle East & Africa</p>
              </TechCard>
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 7: Business Model */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              <IconBadge icon={DollarSign} color="emerald" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">Business Model</h2>
            </div>
            <p className="text-xl text-slate-400 text-center mb-12 print:text-gray-600">Sustainable Revenue Streams</p>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
              <TechCard glowColor="emerald">
                <h3 className="font-semibold text-lg mb-4 text-emerald-400 flex items-center gap-2 print:text-emerald-700">
                  <Award className="h-5 w-5" /> Subscription Tiers
                </h3>
                <ul className="space-y-3 text-slate-300 print:text-gray-600">
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> Free tier for startups</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> Premium for advanced features</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> Enterprise for accelerators</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> Investor Pro access</li>
                </ul>
              </TechCard>
              <TechCard glowColor="purple">
                <h3 className="font-semibold text-lg mb-4 text-purple-400 flex items-center gap-2 print:text-purple-700">
                  <Handshake className="h-5 w-5" /> Additional Revenue
                </h3>
                <ul className="space-y-3 text-slate-300 print:text-gray-600">
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-purple-500" /> Cohort enrollment fees</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-purple-500" /> Success-based commissions</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-purple-500" /> Corporate partnerships</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-purple-500" /> Sponsored events</li>
                </ul>
              </TechCard>
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 8: Contact */}
        <SlideContainer className="print:break-after-avoid">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-4 mb-4">
              <IconBadge icon={Rocket} color="teal" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">Join Our Mission</h2>
            </div>
            <p className="text-xl text-slate-400 mb-8 print:text-gray-600">Let's Build the Future Together</p>
            
            <p className="text-lg text-slate-400 max-w-2xl mb-8 print:text-gray-600">
              We're looking for partners, investors, and innovators who share our vision of democratizing access to startup success.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <a 
                href="mailto:contact@startupfactoryhub.com" 
                className="inline-flex items-center gap-3 bg-slate-900/80 border-2 border-teal-500/40 rounded-lg px-6 py-3 hover:border-teal-500/60 transition-colors print:bg-white print:border-gray-300"
              >
                <Mail className="h-5 w-5 text-teal-400 print:text-gray-700" />
                <span className="text-slate-200 font-medium print:text-gray-700">contact@startupfactoryhub.com</span>
              </a>
              <a 
                href="https://startupfactoryhub.lovable.app" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-3 bg-slate-900/80 border-2 border-cyan-500/40 rounded-lg px-6 py-3 hover:border-cyan-500/60 transition-colors print:bg-white print:border-gray-300"
              >
                <ExternalLink className="h-5 w-5 text-cyan-400 print:text-gray-700" />
                <span className="text-slate-200 font-medium print:text-gray-700">startupfactoryhub.lovable.app</span>
              </a>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500/20 blur-2xl rounded-full print:hidden" />
              <img src={sfhLogo} alt="Startup Factory Hub" className="relative w-24 h-24 object-contain" />
            </div>
            
            <p className="text-sm text-slate-600 mt-8 print:text-gray-400">© 2025 Startup Factory Hub. All rights reserved.</p>
          </div>
        </SlideContainer>
      </div>
    </div>
  );
}
