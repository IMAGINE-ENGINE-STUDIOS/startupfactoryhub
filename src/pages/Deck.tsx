import { Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail, ExternalLink, Printer, Search, Network, BarChart3, Briefcase, GraduationCap, Building2, Diamond, Video, FileText, Calendar, Cpu, DollarSign, Handshake, Zap, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import sfhLogo from '@/assets/sfh-logo-sphere.png';
import rocketLaunchBg from '@/assets/rocket-launch-bg.jpg';
import astronautBg from '@/assets/astronaut-bg.jpg';
import moonEarthBg from '@/assets/moon-earth.jpg';

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
}) => <div className="w-full min-h-screen flex items-center justify-center bg-slate-950 p-2 sm:p-4 print:min-h-0 print:p-0 print:bg-white">
    <div className="relative w-full max-w-[1920px] aspect-video overflow-hidden print:aspect-auto print:max-w-none">
      {children}
    </div>
  </div>;

// Cover slide with background image
const CoverSlideContainer = ({
  children
}: {
  children: React.ReactNode;
}) => <SlideWrapper>
    <section className="absolute inset-0 flex flex-col items-center justify-center p-[4%] overflow-hidden print:relative print:p-8 print:break-after-page print:bg-white">
      {/* Background image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat print:hidden" style={{
      backgroundImage: `url(${rocketLaunchBg})`
    }} />
      {/* Dark cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 print:hidden" />
      {/* Scan lines effect */}
      <div className="absolute inset-0 print:hidden" style={{
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(20, 184, 166, 0.02) 2px, rgba(20, 184, 166, 0.02) 4px)'
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
  </SlideWrapper>;

// Standard slide container
const SlideContainer = ({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) => <SlideWrapper>
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
  const handlePrint = () => {
    window.print();
  };
  return <div className="min-h-screen bg-slate-950 text-white print:bg-white print:text-black">
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
              <div className="absolute inset-[-20px] border border-dashed border-teal-500/40 rounded-full animate-spin print:hidden" style={{
              animationDuration: '20s'
            }} />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight print:text-black">
              Startup Factory Hub
            </h1>
            
            <p className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4 print:text-teal-700">
              The Online Hybrid Accelerator Platform Powered by A.I.
            </p>
            
            {/* Key Value Proposition */}
            <div className="max-w-3xl mb-4">
              <p className="text-base md:text-lg text-slate-300 leading-relaxed print:text-gray-700">
                A <span className="text-teal-400 font-semibold">hybrid digital-physical</span> execution platform with global locations, <span className="text-cyan-400 font-semibold">AI-driven workflows</span>, and human expertise—enabling founders to build consistently from <span className="text-teal-400 font-semibold">idea to scale</span>.
              </p>
            </div>
            
            {/* Global Presence Highlight */}
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">4 Global Hubs</span>
              <span className="text-slate-500 mx-2">•</span>
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-400">Orlando • Santiago • Tokyo • Sevilla</span>
            </div>
            
            <SectionDivider title="Built for Everyone" />
            
            {/* User Types Grid - 5 columns */}
            <div className="grid grid-cols-5 gap-3 max-w-4xl w-full mb-6">
              {/* Startups */}
              <div className="relative group">
                <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative flex flex-col items-center p-4 bg-slate-900/80 border border-teal-500/40 rounded-lg hover:border-teal-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-12 h-12 mb-3 flex items-center justify-center" style={{
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                }}>
                    <div className="absolute w-12 h-12 bg-gradient-to-br from-teal-500/30 to-teal-600/30 border border-teal-500/60" style={{
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                  }} />
                    <Rocket className="h-5 w-5 text-teal-400 z-10 print:text-teal-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-200 print:text-gray-700">Startups</span>
                </div>
              </div>

              {/* Mentors */}
              <div className="relative group">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative flex flex-col items-center p-4 bg-slate-900/80 border border-cyan-500/40 rounded-lg hover:border-cyan-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-12 h-12 mb-3 flex items-center justify-center" style={{
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                }}>
                    <div className="absolute w-12 h-12 bg-gradient-to-br from-cyan-500/30 to-cyan-600/30 border border-cyan-500/60" style={{
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                  }} />
                    <Users className="h-5 w-5 text-cyan-400 z-10 print:text-cyan-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-200 print:text-gray-700">Mentors</span>
                </div>
              </div>

              {/* Investors */}
              <div className="relative group">
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative flex flex-col items-center p-4 bg-slate-900/80 border border-purple-500/40 rounded-lg hover:border-purple-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-12 h-12 mb-3 flex items-center justify-center" style={{
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                }}>
                    <div className="absolute w-12 h-12 bg-gradient-to-br from-purple-500/30 to-purple-600/30 border border-purple-500/60" style={{
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                  }} />
                    <Diamond className="h-5 w-5 text-purple-400 z-10 print:text-purple-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-200 print:text-gray-700">Investors</span>
                </div>
              </div>

              {/* Students */}
              <div className="relative group">
                <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative flex flex-col items-center p-4 bg-slate-900/80 border border-rose-500/40 rounded-lg hover:border-rose-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-12 h-12 mb-3 flex items-center justify-center" style={{
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                }}>
                    <div className="absolute w-12 h-12 bg-gradient-to-br from-rose-500/30 to-rose-600/30 border border-rose-500/60" style={{
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                  }} />
                    <GraduationCap className="h-5 w-5 text-rose-400 z-10 print:text-rose-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-200 print:text-gray-700">Students</span>
                </div>
              </div>

              {/* Accelerators */}
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-lg opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
                <div className="relative flex flex-col items-center p-4 bg-slate-900/80 border border-emerald-500/40 rounded-lg hover:border-emerald-500/80 transition-all print:bg-gray-50 print:border-gray-300">
                  <div className="w-12 h-12 mb-3 flex items-center justify-center" style={{
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                }}>
                    <div className="absolute w-12 h-12 bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 border border-emerald-500/60" style={{
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                  }} />
                    <Building2 className="h-5 w-5 text-emerald-400 z-10 print:text-emerald-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-200 print:text-gray-700">Accelerators</span>
                </div>
              </div>
            </div>
            
            {/* Differentiator - Hybrid Model */}
            <div className="bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 border border-teal-500/30 rounded-lg px-6 py-3 max-w-3xl print:bg-gray-50 print:border-gray-300">
              <p className="text-sm text-slate-300 print:text-gray-700">
                <span className="text-teal-400 font-semibold print:text-teal-700">Hybrid A.I. Accelerator:</span> Not just software—an <span className="text-cyan-400">intelligent operating system</span> that merges AI automation, physical workspaces, and human expertise into one continuous execution engine across global locations.
              </p>
            </div>
          </div>
        </CoverSlideContainer>

        {/* SLIDE 2: Company Summary - Mechanism Journey */}
        <SlideWrapper>
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[4%] overflow-hidden print:relative print:p-8 print:break-after-page print:bg-white">
            {/* Background image */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat print:hidden" style={{
            backgroundImage: `url(${astronautBg})`
          }} />
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
              <span className="text-sm font-semibold text-teal-400 tracking-[0.3em] uppercase print:text-gray-600">End-to-End Execution</span>
              <div className="w-3 h-3 bg-teal-500 rotate-45" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 print:text-black">The Online Hybrid Accelerator</h2>
            <p className="text-lg text-slate-400 text-center mb-6 print:text-gray-600">AI-Powered • Hybrid Execution • Global Scale</p>
            
            {/* Core Philosophy - Big Statement */}
            <div className="max-w-4xl w-full mb-6">
              <div className="bg-slate-900/60 border-2 border-teal-500/40 rounded-xl p-5 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                <p className="text-lg text-center text-slate-200 leading-relaxed print:text-gray-700">
                  <span className="text-teal-400 font-bold print:text-teal-700">We are not a 3-month program.</span> We are an <span className="text-cyan-400 font-semibold">AI-powered hybrid accelerator platform</span>—a permanent operating system that combines intelligent automation, physical hubs, mentorship, and capital access into one continuous execution engine for founders worldwide.
                </p>
              </div>
            </div>
            
            {/* What Makes Us Different - 3 Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl w-full mb-6">
              <div className="bg-slate-900/60 border border-teal-500/30 rounded-lg p-4 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-teal-400 print:text-teal-700" />
                  <span className="text-sm font-bold text-teal-400 print:text-teal-700">AI-Driven Workflows</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed print:text-gray-600">
                  Intelligent automation powers every stage—from <span className="text-white">AI matching and roadmaps</span> to real-time analytics. No manual gaps, just continuous execution.
                </p>
              </div>
              <div className="bg-slate-900/60 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-5 w-5 text-cyan-400 print:text-cyan-700" />
                  <span className="text-sm font-bold text-cyan-400 print:text-cyan-700">Digital + Physical Hybrid</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed print:text-gray-600">
                  <span className="text-white">Online platform + 4 flagship hubs</span> + 5,800 partner locations. Build anywhere with local community and global reach.
                </p>
              </div>
              <div className="bg-slate-900/60 border border-purple-500/30 rounded-lg p-4 backdrop-blur-sm print:bg-gray-50 print:border-gray-300">
                <div className="flex items-center gap-2 mb-3">
                  <Network className="h-5 w-5 text-purple-400 print:text-purple-700" />
                  <span className="text-sm font-bold text-purple-400 print:text-purple-700">Integrated Ecosystem</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed print:text-gray-600">
                  <span className="text-white">AI + Mentors + Corporates + Capital</span> in one platform. No fragmented tools—one consistent workflow.
                </p>
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
          <section className="absolute inset-0 flex flex-col items-center justify-center p-[4%] overflow-hidden print:relative print:p-8 print:break-after-page print:bg-white">
            {/* Background image */}
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat print:hidden" style={{
            backgroundImage: `url(${moonEarthBg})`
          }} />
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
                <div className="absolute left-[24%] w-[14%] h-full bg-gradient-to-r from-rose-500/30 to-rose-500/60 opacity-50" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, currentColor 4px, currentColor 8px)'
                  }} />
                <div className="absolute left-[40%] w-4 h-4 -top-1.5 rotate-45 border-2 border-rose-500 bg-slate-950 flex items-center justify-center">
                  <span className="text-rose-500 text-xs font-bold">✕</span>
                </div>
                <div className="absolute left-[44%] w-[14%] h-full bg-gradient-to-r from-rose-500/30 to-rose-500/60 opacity-50" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, currentColor 4px, currentColor 8px)'
                  }} />
                <div className="absolute left-[60%] w-4 h-4 -top-1.5 rotate-45 border-2 border-rose-500 bg-slate-950 flex items-center justify-center">
                  <span className="text-rose-500 text-xs font-bold">✕</span>
                </div>
                <div className="absolute left-[64%] w-[14%] h-full bg-gradient-to-r from-rose-500/30 to-rose-500/60 opacity-50" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, currentColor 4px, currentColor 8px)'
                  }} />
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

        {/* NEW SLIDE: Global Footprint & Hybrid Philosophy */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <IconBadge icon={Globe} color="cyan" />
              <h2 className="text-2xl md:text-3xl font-bold text-white print:text-black">Global Footprint</h2>
            </div>
            <p className="text-base md:text-lg text-cyan-400 font-semibold text-center mb-1 print:text-cyan-700">Hybrid Digital-Physical Presence</p>
            <p className="text-xs md:text-sm text-slate-400 text-center mb-6 max-w-3xl print:text-gray-600">
              Unlike purely digital platforms, we combine software with physical hubs—creating real communities where founders work, meet, and scale together.
            </p>
            
            {/* 4 Flagship Locations - Prominent */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-6">
              {[
                { city: "Orlando", country: "USA", flag: "🇺🇸", type: "HQ", color: "emerald" },
                { city: "Santiago", country: "Chile", flag: "🇨🇱", type: "LATAM", color: "amber" },
                { city: "Tokyo", country: "Japan", flag: "🇯🇵", type: "APAC", color: "rose" },
                { city: "Sevilla", country: "Spain", flag: "🇪🇸", type: "EMEA", color: "cyan" },
              ].map((location, i) => (
                <div key={i} className={`relative bg-slate-900/80 border-2 rounded-xl p-4 backdrop-blur-sm text-center transition-all hover:scale-105 print:bg-gray-50 ${
                  location.type === "HQ" 
                    ? "border-emerald-500/60 ring-2 ring-emerald-500/20" 
                    : `border-${location.color}-500/40 hover:border-${location.color}-500/60`
                }`}>
                  {location.type === "HQ" && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 rounded text-[8px] font-bold text-white">
                      HEADQUARTERS
                    </div>
                  )}
                  <span className="text-3xl mb-2 block">{location.flag}</span>
                  <h4 className={`text-base font-bold text-${location.color}-400 print:text-${location.color}-700`}>{location.city}</h4>
                  <p className="text-xs text-slate-500">{location.country}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-medium bg-${location.color}-500/20 text-${location.color}-400 rounded`}>
                    {location.type}
                  </span>
                </div>
              ))}
            </div>

            {/* Hybrid Philosophy Section */}
            <SectionDivider title="Our Philosophy" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl w-full mb-4">
              <TechCard glowColor="teal" className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-teal-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-teal-400">Continuous Execution</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Not a 3-month program—a <span className="text-teal-400">permanent operating system</span> for your startup. We support founders before, during, and after acceleration phases.
                </p>
              </TechCard>

              <TechCard glowColor="cyan" className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-cyan-400">Physical + Digital</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real workspaces in 4 cities across 3 continents. <span className="text-cyan-400">5,800+ partner locations</span> via IWG. Software that works anywhere, community that meets in person.
                </p>
              </TechCard>

              <TechCard glowColor="purple" className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <Network className="h-4 w-4 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-sm text-purple-400">Ecosystem Integration</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Not isolated—<span className="text-purple-400">connected to accelerators, universities, corporates</span>, and investors globally. Your success network expands with us.
                </p>
              </TechCard>
            </div>

            {/* IWG Partnership Callout */}
            <div className="bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-lg px-6 py-3 max-w-4xl">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-cyan-400">Global Workspace Network:</span>
                </div>
                <span className="text-sm text-slate-300">
                  <span className="text-white font-bold">5,800+</span> locations • 
                  <span className="text-white font-bold"> 130</span> countries • 
                  <span className="text-white font-bold"> IWG</span> partnership
                </span>
              </div>
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 5: Ecosystem Overview - Consolidated Users + Key Value */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <IconBadge icon={Users} color="teal" />
              <h2 className="text-2xl md:text-3xl font-bold text-white print:text-black">Ecosystem Overview</h2>
            </div>
            <p className="text-base text-slate-400 text-center mb-6 max-w-3xl print:text-gray-600">
              A unified platform serving 8 stakeholder types with role-specific dashboards and AI-powered workflow automation.
            </p>
            
            {/* Compact User Grid - 8 columns */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2 max-w-5xl w-full mb-6">
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
                <div key={i} className={`bg-slate-900/60 border border-${user.color}-500/30 rounded-lg p-2 text-center hover:border-${user.color}-500/60 transition-all print:bg-gray-50`}>
                  <div className={`w-8 h-8 rounded-lg bg-${user.color}-500/20 flex items-center justify-center mx-auto mb-1`}>
                    <user.icon className={`h-4 w-4 text-${user.color}-400`} />
                  </div>
                  <span className={`text-[9px] font-medium text-${user.color}-400`}>{user.label}</span>
                </div>
              ))}
            </div>

            <SectionDivider title="Core Value Drivers" />
            
            {/* Key Value Props - What We Deliver */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl w-full">
              <TechCard glowColor="teal" className="p-3 text-center">
                <div className="text-2xl font-bold text-teal-400 mb-1">24/7</div>
                <p className="text-xs text-slate-400">AI-Powered Guidance</p>
                <p className="text-[9px] text-slate-500 mt-1">Automated roadmaps & recommendations</p>
              </TechCard>

              <TechCard glowColor="cyan" className="p-3 text-center">
                <div className="text-2xl font-bold text-cyan-400 mb-1">6</div>
                <p className="text-xs text-slate-400">Physical Hub Cities</p>
                <p className="text-[9px] text-slate-500 mt-1">Real workspaces & community events</p>
              </TechCard>

              <TechCard glowColor="purple" className="p-3 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">100+</div>
                <p className="text-xs text-slate-400">Partner Network</p>
                <p className="text-[9px] text-slate-500 mt-1">Investors, corporates & accelerators</p>
              </TechCard>

              <TechCard glowColor="emerald" className="p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400 mb-1">∞</div>
                <p className="text-xs text-slate-400">Continuous Support</p>
                <p className="text-[9px] text-slate-500 mt-1">Before, during & after acceleration</p>
              </TechCard>
            </div>
          </div>
        </SlideContainer>
        {/* SLIDE 6: Market Opportunity */}
        <SlideContainer>
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center gap-4 mb-2">
              <IconBadge icon={TrendingUp} color="teal" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">Market Opportunity</h2>
            </div>
            <p className="text-lg text-slate-400 text-center mb-6 print:text-gray-600">$25B+ Global Accelerator & Startup Services Market</p>
            
            {/* TAM / SAM / SOM Concentric Rings */}
            <div className="flex flex-col md:flex-row items-center gap-8 max-w-5xl w-full mb-6">
              {/* Animated Concentric Circles */}
              <div className="relative w-64 h-64 shrink-0 mx-auto">
                {/* TAM - Outer */}
                <div className="absolute inset-0 rounded-full border-2 border-teal-500/30 animate-[pulse_3s_ease-in-out_infinite] flex items-center justify-center">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-teal-500/20 border border-teal-500/40 rounded text-[9px] font-bold text-teal-400 whitespace-nowrap">TAM $25B+</div>
                </div>
                {/* SAM - Middle */}
                <div className="absolute inset-[18%] rounded-full border-2 border-cyan-500/40 bg-cyan-500/5 animate-[pulse_3s_ease-in-out_infinite_0.5s] flex items-center justify-center">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/40 rounded text-[9px] font-bold text-cyan-400 whitespace-nowrap">SAM $8.5B</div>
                </div>
                {/* SOM - Inner */}
                <div className="absolute inset-[38%] rounded-full border-2 border-emerald-500/60 bg-emerald-500/10 animate-[pulse_3s_ease-in-out_infinite_1s] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-black text-emerald-400">$250M</div>
                    <div className="text-[8px] text-emerald-400/80 font-medium">SOM Y5</div>
                  </div>
                </div>
              </div>

              {/* Market Segments - Animated Bars */}
              <div className="flex-1 w-full space-y-3">
                <h3 className="text-sm font-bold text-teal-400 mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Industry Growth by Segment
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
                      <span className="text-[11px] text-slate-300 font-medium">{segment.label}</span>
                      <span className="text-[11px] text-slate-400 font-bold">{segment.amount}</span>
                    </div>
                    <div className="w-full h-5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                      <div 
                        className={`h-full bg-gradient-to-r ${segment.color} rounded-full relative`}
                        style={{ 
                          width: `${segment.value}%`, 
                          animation: `slideInWidth 1.5s ease-out ${segment.delay} both`
                        }}
                      >
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white/90">{segment.value}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Drivers + Regions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl w-full">
              <TechCard glowColor="teal" className="p-4">
                <h3 className="font-semibold text-sm mb-3 text-teal-400 flex items-center gap-2 print:text-teal-700">
                  <TrendingUp className="h-4 w-4" /> Growth Drivers
                </h3>
                <div className="space-y-2.5">
                  {[
                    { icon: TrendingUp, text: "15% CAGR in startup ecosystem growth", color: "emerald", stat: "15%" },
                    { icon: Cpu, text: "AI adoption in business services accelerating", color: "cyan", stat: "3.2x" },
                    { icon: Globe, text: "Global entrepreneurship at record levels", color: "purple", stat: "582M" },
                    { icon: Building2, text: "Hybrid work driving coworking demand", color: "amber", stat: "+40%" },
                  ].map((driver, i) => (
                    <div key={i} className="flex items-center gap-3 group" style={{ animation: `fade-in 0.5s ease-out ${0.3 + i * 0.15}s both` }}>
                      <div className={`w-10 h-10 rounded-lg bg-${driver.color}-500/20 border border-${driver.color}-500/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <span className={`text-xs font-black text-${driver.color}-400`}>{driver.stat}</span>
                      </div>
                      <span className="text-xs text-slate-300 leading-relaxed">{driver.text}</span>
                    </div>
                  ))}
                </div>
              </TechCard>

              <TechCard glowColor="cyan" className="p-4">
                <h3 className="font-semibold text-sm mb-3 text-cyan-400 flex items-center gap-2 print:text-cyan-700">
                  <Globe className="h-4 w-4" /> Target Regions
                </h3>
                <div className="space-y-2">
                  {[
                    { region: "North America", share: 35, color: "from-teal-500 to-teal-400" },
                    { region: "Europe", share: 28, color: "from-cyan-500 to-cyan-400" },
                    { region: "Asia-Pacific", share: 22, color: "from-purple-500 to-purple-400" },
                    { region: "Latin America", share: 10, color: "from-amber-500 to-amber-400" },
                    { region: "Middle East & Africa", share: 5, color: "from-rose-500 to-rose-400" },
                  ].map((r, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[11px] text-slate-300">{r.region}</span>
                        <span className="text-[11px] text-slate-400 font-bold">{r.share}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden">
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
        </SlideContainer>

        {/* SLIDE 7: Business Model & Revenue Streams */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-3">
              <IconBadge icon={DollarSign} color="emerald" />
              <h2 className="text-2xl md:text-3xl font-bold text-white print:text-black">Business Model & Revenue Streams</h2>
            </div>
            <p className="text-base text-slate-400 text-center mb-4 print:text-gray-600">
              Freemium adoption drives monetization through tiered subscriptions + enterprise revenue streams
            </p>
            
            {/* Core Growth Model */}
            <div className="grid grid-cols-3 gap-3 max-w-5xl w-full mb-4">
              <TechCard glowColor="teal" className="p-3">
                <h3 className="font-semibold text-xs text-teal-400 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Growth Engine
                </h3>
                <div className="space-y-1.5 text-[10px] text-slate-300 print:text-gray-600">
                  <p><span className="text-teal-400 font-medium">Start:</span> 100 startups Month 1</p>
                  <p><span className="text-teal-400 font-medium">Growth:</span> 10% MoM compound</p>
                  <p><span className="text-teal-400 font-medium">Model:</span> 40% Free / 60% Paid</p>
                </div>
              </TechCard>
              
              <TechCard glowColor="emerald" className="p-3">
                <h3 className="font-semibold text-xs text-emerald-400 mb-2 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" /> Subscription Tiers
                </h3>
                <div className="space-y-1 text-[10px] text-slate-300 print:text-gray-600">
                  <div className="flex justify-between"><span>Early Stage</span><span className="text-emerald-400">$300/mo</span></div>
                  <div className="flex justify-between"><span>Build Stage</span><span className="text-emerald-400">$500/mo</span></div>
                  <div className="flex justify-between"><span>Growth Stage</span><span className="text-emerald-400">$950/mo</span></div>
                  <div className="flex justify-between"><span>Scale Stage</span><span className="text-emerald-400">$1,500/mo</span></div>
                  <div className="flex justify-between border-t border-emerald-500/30 pt-1 mt-1"><span className="font-medium">Blended ARPU</span><span className="text-emerald-400 font-bold">$750/mo</span></div>
                </div>
              </TechCard>
              
              <TechCard glowColor="cyan" className="p-3">
                <h3 className="font-semibold text-xs text-cyan-400 mb-2 flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" /> 5-Year Startup Growth
                </h3>
                <div className="space-y-1 text-[10px] text-slate-300 print:text-gray-600">
                  <div className="flex justify-between"><span>Year 1</span><span className="text-cyan-400">~190 startups</span></div>
                  <div className="flex justify-between"><span>Year 2</span><span className="text-cyan-400">~540 startups</span></div>
                  <div className="flex justify-between"><span>Year 3</span><span className="text-cyan-400">~1,550 startups</span></div>
                  <div className="flex justify-between"><span>Year 4</span><span className="text-cyan-400">~4,420 startups</span></div>
                  <div className="flex justify-between"><span>Year 5</span><span className="text-cyan-400 font-bold">~12,650 startups</span></div>
                </div>
              </TechCard>
            </div>
            
            {/* Revenue Streams Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-5xl w-full">
              <TechCard glowColor="purple" className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
                    <Building2 className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-xs text-purple-400">Corporate Partners</h3>
                </div>
                <p className="text-[10px] text-slate-300 print:text-gray-600">
                  <span className="text-purple-400 font-medium">$100K/year</span> per partner
                </p>
              </TechCard>
              
              <TechCard glowColor="amber" className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center">
                    <Target className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-xs text-amber-400">Pilot Programs</h3>
                </div>
                <p className="text-[10px] text-slate-300 print:text-gray-600">
                  <span className="text-amber-400 font-medium">$200K</span> per pilot (2+/year)
                </p>
              </TechCard>
              
              <TechCard glowColor="rose" className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-rose-500/20 flex items-center justify-center">
                    <Globe className="h-3.5 w-3.5 text-rose-400" />
                  </div>
                  <h3 className="font-semibold text-xs text-rose-400">New Chapters</h3>
                </div>
                <p className="text-[10px] text-slate-300 print:text-gray-600">
                  <span className="text-rose-400 font-medium">$200K</span> per chapter (2+/year)
                </p>
              </TechCard>
              
              <TechCard glowColor="teal" className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-teal-500/20 flex items-center justify-center">
                    <Award className="h-3.5 w-3.5 text-teal-400" />
                  </div>
                  <h3 className="font-semibold text-xs text-teal-400">Sponsorships</h3>
                </div>
                <p className="text-[10px] text-slate-300 print:text-gray-600">
                  <span className="text-teal-400 font-medium">$5K-$50K</span> (avg $20K/sponsor)
                </p>
              </TechCard>
              
              <TechCard glowColor="cyan" className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center">
                    <GraduationCap className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-xs text-cyan-400">Education Programs</h3>
                </div>
                <p className="text-[10px] text-slate-300 print:text-gray-600">
                  <span className="text-cyan-400 font-medium">$10K avg</span> (100 students Y1, 2x/year)
                </p>
              </TechCard>
              
              <TechCard glowColor="emerald" className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-xs text-emerald-400">Revenue Formula</h3>
                </div>
                <p className="text-[9px] text-slate-300 print:text-gray-600">
                  Subscriptions + Corporate + Pilots + Chapters + Sponsors + Education
                </p>
              </TechCard>
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 8: Financial Projections */}
        <SlideContainer>
          <div className="flex flex-col items-center h-full">
            <div className="flex items-center gap-3 mb-2">
              <IconBadge icon={BarChart3} color="emerald" />
              <h2 className="text-xl md:text-2xl font-bold text-white print:text-black">5-Year Financial Projections</h2>
            </div>
            <p className="text-xs text-slate-400 text-center mb-3 print:text-gray-600">
              Compounding growth delivers <span className="text-emerald-400 font-semibold">8.6x revenue increase</span> over 5 years
            </p>
            
            {/* Main Chart - Bar Chart */}
            <div className="max-w-4xl w-full mb-3">
              <TechCard glowColor="emerald" className="p-4">
                <div className="flex">
                  {/* Y-axis */}
                  <div className="flex flex-col justify-between h-48 pr-2 text-right shrink-0">
                    <span className="text-[8px] text-slate-500">$50M</span>
                    <span className="text-[8px] text-slate-500">$40M</span>
                    <span className="text-[8px] text-slate-500">$30M</span>
                    <span className="text-[8px] text-slate-500">$20M</span>
                    <span className="text-[8px] text-slate-500">$10M</span>
                    <span className="text-[8px] text-slate-500">$0</span>
                  </div>
                  {/* Chart area */}
                  <div className="flex-1 relative h-48 border-b border-l border-slate-700/40">
                    {/* Grid lines */}
                    {[20, 40, 60, 80].map((p) => (
                      <div key={p} className="absolute w-full border-t border-dashed border-slate-700/20" style={{ bottom: `${p}%` }} />
                    ))}
                    {/* Bars container */}
                    <div className="absolute inset-0 flex items-end px-4 gap-2">
                      {[
                        { revenue: "$5.34M", value: 5.34, color: "bg-gradient-to-t from-teal-700 to-teal-400" },
                        { revenue: "$9.65M", value: 9.65, color: "bg-gradient-to-t from-teal-600 to-cyan-400" },
                        { revenue: "$16.50M", value: 16.50, color: "bg-gradient-to-t from-cyan-600 to-cyan-400" },
                        { revenue: "$27.30M", value: 27.30, color: "bg-gradient-to-t from-cyan-600 to-emerald-400" },
                        { revenue: "$46.00M", value: 46.00, color: "bg-gradient-to-t from-emerald-600 to-emerald-400" },
                      ].map((item, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                          <span className="text-[10px] md:text-xs font-bold text-emerald-400 mb-1 shrink-0">{item.revenue}</span>
                          <div
                            className={`w-12 md:w-16 ${item.color} rounded-t-md relative overflow-hidden shadow-lg shadow-emerald-500/10 shrink-0`}
                            style={{ height: `${(item.value / 50) * 192}px` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0" />
                            <div className="absolute top-0 left-0 right-0 h-px bg-white/30" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* X-axis labels */}
                <div className="flex pl-8">
                  {[
                    { year: "Year 1", pct: "" },
                    { year: "Year 2", pct: "+81%" },
                    { year: "Year 3", pct: "+71%" },
                    { year: "Year 4", pct: "+65%" },
                    { year: "Year 5", pct: "+68%" },
                  ].map((item, i) => (
                    <div key={i} className="flex-1 text-center pt-1.5">
                      <span className="text-[9px] md:text-[10px] text-slate-400 font-medium block">{item.year}</span>
                      {item.pct && <span className="text-[8px] text-emerald-400/80 font-semibold">{item.pct}</span>}
                    </div>
                  ))}
                </div>
                
                {/* Growth Arrow Indicator */}
                <div className="flex items-center justify-center gap-2 mt-3 pt-2 border-t border-emerald-500/20">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[10px] text-slate-300">
                    <span className="text-emerald-400 font-semibold">+762%</span> total growth • 10% MoM compound • $5.34M → $46M
                  </span>
                </div>
              </TechCard>
            </div>
            
            {/* Year 5 Revenue Breakdown - Horizontal Stacked Bar */}
            <div className="max-w-4xl w-full mb-3">
              <TechCard glowColor="teal" className="p-3">
                <h4 className="text-[10px] font-semibold text-center text-teal-400 mb-2">Year 5 Revenue Mix: $46M</h4>
                <div className="flex items-center h-7 rounded-lg overflow-hidden border border-slate-700/50">
                  <div className="h-full bg-gradient-to-r from-teal-600 to-teal-500 flex items-center justify-center relative" style={{
                  width: '74%'
                }}>
                    <span className="text-[8px] md:text-[9px] font-medium text-white">Subscriptions $34.2M</span>
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-slate-900/50" />
                  </div>
                  <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-500 flex items-center justify-center relative" style={{
                  width: '18%'
                }}>
                    <span className="text-[8px] font-medium text-white">Edu</span>
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-slate-900/50" />
                  </div>
                  <div className="h-full bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center" style={{
                  width: '8%'
                }}>
                    <span className="text-[8px] font-medium text-white">+</span>
                  </div>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500 mt-1 px-1">
                  <span>Subscriptions (74%)</span>
                  <span>Education (18%)</span>
                  <span>Other (8%)</span>
                </div>
              </TechCard>
            </div>
            
            {/* Revenue Streams Summary - Compact Grid */}
            <div className="grid grid-cols-6 gap-2 max-w-4xl w-full mb-2">
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
              label: "Chapters",
              value: "$200K ea",
              icon: Globe,
              color: "rose"
            }, {
              label: "Education",
              value: "2x/yr",
              icon: GraduationCap,
              color: "cyan"
            }].map((item, i) => <div key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2 text-center">
                  <item.icon className={`h-3 w-3 mx-auto mb-1 text-${item.color}-400`} />
                  <p className={`text-[9px] font-bold text-${item.color}-400`}>{item.value}</p>
                  <p className="text-[7px] text-slate-500">{item.label}</p>
                </div>)}
            </div>
            
            {/* Model Summary */}
            <div className="max-w-4xl w-full">
              <div className="bg-slate-900/40 border border-emerald-500/20 rounded-lg px-3 py-2">
                <p className="text-[9px] text-center text-slate-400">
                  <span className="text-emerald-400 font-medium">Model:</span> 100 startups → 10% MoM growth → 60% paid ($750 ARPU) + enterprise streams = $46M Year 5
                </p>
              </div>
            </div>
          </div>
        </SlideContainer>
        {/* SLIDE 8: Our Partners */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-3">
              <IconBadge icon={Handshake} color="teal" />
              <h2 className="text-2xl md:text-3xl font-bold text-white print:text-black">Our Partners & Network</h2>
            </div>
            <p className="text-base text-slate-400 text-center mb-6 print:text-gray-600">
              Backed by industry leaders and innovators shaping the future
            </p>
            
            {/* Partners Grid - Compact 6 columns */}
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3 max-w-5xl w-full">
              {[
                { name: "NASA", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/200px-NASA_logo.svg.png" },
                { name: "GitHub", logo: "/github-logo.png" },
                { name: "Google", logo: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" },
                { name: "MongoDB", logo: "/mongodb-logo.webp" },
                { name: "Nasdaq", logo: "/nasdaq-logo.png" },
                { name: "HubSpot", logo: "https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png" },
                { name: "Lovable", logo: "/partners/lovable-logo.png" },
                { name: "Lehigh University", logo: "/lehigh-university-logo.png" },
                { name: "Datadog", logo: "https://imgix.datadoghq.com/img/dd_logo_n_70x75.png" },
                { name: "LivePlan", logo: "/partners/liveplan-logo.png" },
                { name: "Flippa", logo: "/partners/flippa-logo.png" },
                { name: "F6S", logo: "/partners/f6s-logo.png" },
                { name: "Decahedron Ventures", logo: "/partners/decahedron-ventures-logo.jpg" },
                { name: "Flusso Capital", logo: "/partners/flusso-capital-logo.png" },
                { name: "UK Venture Partners", logo: "/partners/uk-venture-logo.jpg" },
                { name: "Advantary Capital", logo: "/partners/advantary-logo.jpg" },
                { name: "Ducere University", logo: "/partners/ducere-logo.png" },
                { name: "HackerEarth", logo: "/partners/hackerearth-logo.png" },
                { name: "Orlandopreneur", logo: "/partners/orlandopreneur-logo.png" },
                { name: "Grupo Incostas", logo: "/partners/incostas-logo.png" },
                { name: "LOT Network", logo: "/partners/lotnetwork-logo.png" },
                { name: "Nouel Consult", logo: "/partners/nouel-logo.png" },
                { name: "PitchPerfecter.AI", logo: "/partners/pitchperfecter-logo.png" },
                { name: "WorkingAdvantage", logo: "/working-advantage-logo.png" },
              ].map((partner, i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-lg p-2 flex items-center justify-center h-14 hover:border-teal-500/40 transition-colors print:bg-gray-50 print:border-gray-300">
                  <img 
                    src={partner.logo} 
                    alt={partner.name}
                    className="max-h-8 max-w-[80px] object-contain filter brightness-90 hover:brightness-110 transition-all print:filter-none"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
            
            {/* Partner categories */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["Technology", "Investment", "Academic", "Marketplace", "Legal", "Community"].map((category, i) => (
                <span key={i} className="px-2 py-0.5 text-[9px] font-medium bg-slate-800/60 border border-teal-500/20 rounded-full text-teal-400/80 print:bg-gray-100 print:border-gray-300 print:text-gray-600">
                  {category}
                </span>
              ))}
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 9: Contact */}
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
              <a href="mailto:contact@startupfactoryhub.com" className="inline-flex items-center gap-3 bg-slate-900/80 border-2 border-teal-500/40 rounded-lg px-6 py-3 hover:border-teal-500/60 transition-colors print:bg-white print:border-gray-300">
                <Mail className="h-5 w-5 text-teal-400 print:text-gray-700" />
                <span className="text-slate-200 font-medium print:text-gray-700">contact@startupfactoryhub.com</span>
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
    </div>;
}