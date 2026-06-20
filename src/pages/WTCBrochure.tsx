import { useState, useRef, useEffect, useCallback, forwardRef, Children } from 'react';
import {
  Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail,
  Network, BarChart3, GraduationCap, Building2, Cpu, DollarSign,
  Handshake, MapPin, Brain, Briefcase, ShieldCheck, Sparkles,
  Globe2, Scan, Box, Eye, Smartphone, Zap, Orbit, ArrowUpRight,
  ChevronLeft, ChevronRight, CircuitBoard, Radio, Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import "@google/model-viewer";
const NASA_BASE = "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models";
const ROVER_GLB = `${NASA_BASE}/Mars%202020%20Perseverance%20Rover/Mars%202020%20Perseverance%20Rover.glb`;
import HTMLFlipBook from 'react-pageflip';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import sfhLogo from '@/assets/sfh-logo-combined.png';
import nasdaqFeature from '@/assets/nasdaq-feature.jpg';
import coworkingSpace from '@/assets/coworking-space.jpg';
import dashboardMockup from '@/assets/mockup-dashboard.png';
import visionHub from '@/assets/wtc-vision-hub.jpg';
import kpiCities from '@/assets/wtc-kpi-cities.jpg';
import kpiNetwork from '@/assets/wtc-kpi-network.jpg';
import kpiCapital from '@/assets/wtc-kpi-capital.jpg';
import oppGrowth from '@/assets/wtc-opp-growth.jpg';
import oppPopulation from '@/assets/wtc-opp-population.jpg';
import oppVisitors from '@/assets/wtc-opp-visitors.jpg';
import oppGap from '@/assets/wtc-opp-gap.jpg';
import platformMobile from '@/assets/wtc-platform-mobile.jpg';
import arRover from '@/assets/wtc-ar-rover.jpg';
import wtcInstitutional from '@/assets/wtc-institutional.jpg';
import moonBackground from '@/assets/moon-background.jpg.asset.json';

/* =========================================================================
   NEON COLOR TOKENS — used throughout via inline style for max fidelity
   ========================================================================= */
// Light/glass palette — soft, elegant, next-gen. Accents stay luminous but desaturated for light surfaces.
const NEON = {
  cyan: '#0ea5b7',             // teal-cyan, readable on white
  cyanSoft: 'rgba(14,165,183,0.45)',
  magenta: '#3b82f6',          // soft electric blue
  magentaSoft: 'rgba(59,130,246,0.4)',
  lime: '#10b981',             // emerald
  emerald: '#059669',
  amber: '#0d9488',            // teal
  ink: '#0f172a',              // slate-900 for text
  inkSoft: 'rgba(15,23,42,0.65)',
};

// Platinum / carbon-fiber title treatment: replaces flat black headings with a dark metallic weave + light sheen.
const PLATINUM_TITLE: React.CSSProperties = {
  backgroundImage: `
    repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
    repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 5px),
    linear-gradient(180deg, #9ca3af 0%, #4b5563 25%, #1f2937 50%, #374151 75%, #9ca3af 100%)
  `,
  backgroundBlendMode: 'overlay, overlay, normal',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))',
};

/* =========================================================================
   MATRIX RAIN BACKDROP — characters falling, dual-tone
   ========================================================================= */
const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩABCDEF0123456789@#$%&*";
const MatrixLayer = (_: { density?: number; columns?: number; tone?: 'cyan' | 'magenta' | 'mix' }) => null;

/* =========================================================================
   HUD GRID + SCANLINES
   ========================================================================= */
const HudGrid = () => (
  <div className="absolute inset-0 pointer-events-none" style={{
    backgroundImage: `
      linear-gradient(${NEON.cyan}11 1px, transparent 1px),
      linear-gradient(90deg, ${NEON.cyan}11 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
  }} />
);

const Scanlines = () => (
  <div className="absolute inset-0 pointer-events-none" style={{
    backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(15,23,42,0.012) 3px, rgba(15,23,42,0.012) 4px)',
  }} />
);

const NeonEmeraldFrame = ({ inset = 16, radius = '28px' }: { inset?: number; radius?: string }) => (
  <div className="absolute pointer-events-none z-[5]" style={{
    inset,
    borderRadius: radius,
    border: `1px solid rgba(255,255,255,0.7)`,
    boxShadow: `0 0 0 1px rgba(15,23,42,0.05), 0 30px 80px -30px rgba(15,23,42,0.25), inset 0 1px 0 rgba(255,255,255,0.9)`,
  }} />
);

/* =========================================================================
   GLASS CARD — glassmorphism with neon gradient border + corner accents
   ========================================================================= */
const GlassCard = ({
  children, className = '', accent = NEON.cyan, glow = true, padding = 'p-6',
}: { children: React.ReactNode; className?: string; accent?: string; glow?: boolean; padding?: string }) => (
  <div className={`relative rounded-2xl ${padding} ${className}`} style={{
    background: `linear-gradient(140deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.45) 100%)`,
    backdropFilter: 'blur(22px) saturate(140%)',
    WebkitBackdropFilter: 'blur(22px) saturate(140%)',
    border: `1px solid rgba(255,255,255,0.8)`,
    boxShadow: glow ? `0 1px 0 rgba(255,255,255,0.9) inset, 0 30px 60px -25px rgba(15,23,42,0.18), 0 0 0 1px ${accent}15` : undefined,
  }}>
    {/* animated gradient border via top scanline */}
    <span className="absolute top-0 left-6 right-6 h-px pointer-events-none" style={{
      background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
    }} />
    {/* tiny neon dot in corner */}
    <span className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full pointer-events-none" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
    {children}
  </div>
);

/* =========================================================================
   NEON BADGE — icon with glow ring
   ========================================================================= */
const NeonBadge = ({ icon: Icon, color = NEON.cyan, size = 'md' }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; color?: string; size?: 'sm' | 'md' | 'lg' }) => {
  const dims = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const iconSize = size === 'lg' ? 'h-6 w-6' : size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <div className={`${dims} rounded-xl flex items-center justify-center shrink-0`} style={{
      background: `linear-gradient(135deg, ${color}30, ${color}05)`,
      border: `1px solid ${color}60`,
      boxShadow: `0 0 18px ${color}40, inset 0 0 12px ${color}20`,
    }}>
      <Icon className={iconSize} style={{ color }} />
    </div>
  );
};

/* =========================================================================
   PAGE FRAME — wraps every page with hud chrome
   ========================================================================= */
const PageFrame = ({
  children, accent = NEON.cyan, code = '', label = '', pageNum,
}: { children: React.ReactNode; accent?: string; code?: string; label?: string; pageNum: number }) => (
  <section className="absolute inset-0 overflow-hidden" style={{
    background: `radial-gradient(ellipse at 20% 0%, ${accent}1f 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, ${NEON.magenta}1a 0%, transparent 55%), linear-gradient(180deg, #fbfcfe 0%, #eef2f8 100%)`,
  }}>
    <MatrixLayer density={0.10} columns={28} tone="cyan" />
    <HudGrid />
    <Scanlines />
    <NeonEmeraldFrame />

    {/* top hud bar */}
    <div className="absolute top-5 left-12 right-12 flex items-center justify-between font-mono text-[10px] tracking-[0.32em] uppercase pointer-events-none z-20">
      <div className="flex items-center gap-2" style={{ color: accent }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
        <span>SEC // {code}</span>
      </div>
      <div className="text-slate-500">{label}</div>
      <div style={{ color: accent }}>P/{String(pageNum).padStart(2, '0')} · 15</div>
    </div>

    {/* bottom hud bar */}
    <div className="absolute bottom-5 left-12 right-12 flex items-center justify-between font-mono text-[9px] tracking-[0.3em] uppercase pointer-events-none z-20">
      <span className="text-slate-900/35">// WTC × SFH · ORLANDO INNOVATION NEXUS</span>
      <span className="text-slate-900/35">28°32′N · 81°22′W</span>
    </div>

    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="w-full h-full flex flex-col"
        style={{ padding: '70px 50px 60px 50px' }}
      >
        {children}
      </motion.div>
    </div>
  </section>
);

/* =========================================================================
   SECTION TITLE — big and bold
   ========================================================================= */
const PageTitle = ({ kicker, title, accent = NEON.cyan }: { kicker: string; title: React.ReactNode; accent?: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-3">
      <span className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${accent})` }} />
      <span className="font-mono text-[11px] uppercase tracking-[0.4em]" style={{ color: accent }}>{kicker}</span>
    </div>
    <h2 className="font-futuristic font-black leading-[0.95] tracking-tight" style={{
      fontSize: 'clamp(34px, 5vw, 56px)',
      ...PLATINUM_TITLE,
      textShadow: `0 0 30px ${accent}40`,
    }}>
      {title}
    </h2>
  </div>
);

/* =========================================================================
   FLIPBOOK SUPPORT
   ========================================================================= */
const useFlipbookSupported = () => {
  const [supported, setSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const ua = window.navigator.userAgent;
    const isChromium = /Chrome|Chromium|CriOS/.test(ua) && !/Edg|EdgiOS|OPR|SamsungBrowser/.test(ua);
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/.test(ua);
    return isChromium && !isMobile;
  });
  useEffect(() => { setSupported((s) => s); }, []);
  return supported;
};

/* =========================================================================
   A4 WRAPPER
   ========================================================================= */
const BASE_W = 842;
const BASE_H = 1190;
const A4Wrapper = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / BASE_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={containerRef} className="w-full" style={{ background: '#ffffff', position: 'relative', overflow: 'hidden', aspectRatio: `${BASE_W}/${BASE_H}` }}>
      <div style={{
        width: BASE_W, height: BASE_H, position: 'absolute', left: '50%', top: '50%',
        marginLeft: -(BASE_W / 2), marginTop: -(BASE_H / 2),
        transform: `scale(${scale})`, transformOrigin: 'center center',
      }}>
        {children}
      </div>
    </div>
  );
};

const BookPage = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => (
  <div ref={ref} className="overflow-hidden" style={{ background: 'transparent' }}>{children}</div>
));
BookPage.displayName = "BookPage";

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */
export default function WTCBrochure() {
  const navigate = useNavigate();
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(15);
  const flipPrev = useCallback(() => bookRef.current?.pageFlip()?.flipPrev(), []);
  const flipNext = useCallback(() => bookRef.current?.pageFlip()?.flipNext(), []);

  useEffect(() => {
    document.title = "WTC × Startup Factory Hub — Orlando Innovation Nexus";
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') flipPrev();
      else if (e.key === 'ArrowRight') flipNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipPrev, flipNext]);

  const flipbookSupported = useFlipbookSupported();

  return (
    <div className="min-h-screen" style={{ background: '#ffffff', color: NEON.ink }}>
      {/* Nav bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3" style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        borderBottom: `1px solid rgba(15,23,42,0.08)`,
      }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 text-slate-900 hover:bg-slate-900/5" style={{ color: NEON.cyan }}>
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={flipPrev} className="h-8 w-8 hover:bg-slate-900/5" style={{ color: NEON.cyan }} disabled={!flipbookSupported}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.cyan, boxShadow: `0 0 10px ${NEON.cyan}` }} />
            <span className="text-xs sm:text-sm font-mono tracking-widest tabular-nums" style={{ color: NEON.cyan }}>
              {flipbookSupported
                ? `${String(currentPage + 1).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`
                : `${String(totalPages).padStart(2, '0')} pages`}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={flipNext} className="h-8 w-8 hover:bg-slate-900/5" style={{ color: NEON.cyan }} disabled={!flipbookSupported}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="w-[88px]" />
      </div>

      <div
        className="pt-20 pb-12 min-h-screen flex items-center justify-center px-2 sm:px-6"
        style={{ background: `radial-gradient(ellipse at center, rgba(15,23,42,0.03) 0%, #ffffff 65%)` }}
      >
        {(() => {
          const pages = (
            <>
              {/* ====================================================
                   PAGE 1 — COVER
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <section className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(180deg, #ffffff 0%, #f9fafc 100%)` }}>
                    <MatrixLayer density={0.35} columns={42} tone="mix" />
                    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 45%, ${NEON.cyan}20 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, ${NEON.magenta}15 0%, transparent 50%)` }} />
                    <Scanlines />
                    <NeonEmeraldFrame inset={20} radius="32px" />

                    {/* orbiting rings */}
                    <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="relative">
                        <div className="absolute -inset-[260px] rounded-full border" style={{ borderColor: `${NEON.cyan}25`, animation: 'slow-spin 40s linear infinite' }} />
                        <div className="absolute -inset-[200px] rounded-full border-2 border-dashed" style={{ borderColor: `${NEON.cyan}30`, animation: 'slow-spin-reverse 60s linear infinite' }} />
                        <div className="absolute -inset-[140px] rounded-full border" style={{ borderColor: `${NEON.magenta}30`, animation: 'slow-spin 30s linear infinite' }} />
                      </div>
                    </div>

                    {/* top hud strip */}
                    <div className="absolute top-8 left-10 right-10 flex items-center justify-between font-mono text-[10px] tracking-[0.4em] uppercase z-20">
                      <span style={{ color: NEON.cyan }}>// CLASSIFIED · JV PROPOSAL</span>
                      <span style={{ color: NEON.magenta }}>JUNE 2026 · ORLANDO FL</span>
                    </div>

                    {/* top logo */}
                    <div className="absolute top-20 left-0 right-0 z-20 flex items-center justify-center pointer-events-none">
                      <motion.img
                        src={sfhLogo}
                        alt="Startup Factory Hub"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="h-24 w-auto object-contain"
                        style={{ filter: `drop-shadow(0 0 24px ${NEON.cyan}90)` }}
                      />
                    </div>

                    {/* center stack */}
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-12">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="font-mono text-[11px] tracking-[0.5em] uppercase mb-6"
                        style={{ color: NEON.cyan, textShadow: `0 0 12px ${NEON.cyan}` }}
                      >
                        World Trade Center  ×  Startup Factory Hub
                      </motion.div>

                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.15 }}
                        className="font-futuristic font-black leading-[0.88] tracking-tight"
                        style={{
                          fontSize: '92px',
                          ...PLATINUM_TITLE,
                          backgroundImage: `
                            repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
                            repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 5px),
                            linear-gradient(180deg, #9ca3af 0%, #374151 35%, ${NEON.cyan} 100%)
                          `,
                          textShadow: `0 0 80px ${NEON.cyan}40`,
                        }}
                      >
                        ORLANDO<br />INNOVATION<br />NEXUS
                      </motion.h1>

                      {/* neon underline */}
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="mt-6 h-[3px] w-[320px] origin-center"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${NEON.cyan}, ${NEON.magenta}, transparent)`,
                          boxShadow: `0 0 20px ${NEON.cyan}, 0 0 30px ${NEON.magenta}`,
                        }}
                      />

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="mt-8 text-xl text-slate-700 max-w-xl leading-relaxed font-light"
                      >
                        A next-generation innovation destination where founders, capital, corporations and global commerce converge.
                      </motion.p>
                    </div>

                    {/* bottom hud */}
                    <div className="absolute bottom-8 left-10 right-10 z-20">
                      <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.4em] uppercase">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.lime, boxShadow: `0 0 8px ${NEON.lime}` }} />
                          <span style={{ color: NEON.lime }}>SYS · ONLINE</span>
                        </div>
                        <span style={{ color: NEON.cyan }}>JV · 50 / 50</span>
                        <span style={{ color: NEON.magenta }}>BUILD · v1.0</span>
                      </div>
                    </div>
                  </section>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 2 — VISION
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="01" label="VISION" pageNum={2}>
                    <PageTitle kicker="01 · Vision" title={<>A globally recognized <span style={{ color: NEON.cyan }}>command center</span> for innovation.</>} />

                    <div className="flex-1 flex flex-col gap-5">
                      {/* HERO ROW: massive statement card + animated orbit */}
                      <GlassCard accent={NEON.cyan} padding="p-0" className="relative overflow-hidden flex-1">
                        {/* background image */}
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `url(${visionHub})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                        {/* darkening + neon tint overlay */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(120deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0.42) 100%), radial-gradient(ellipse at 80% 20%, ${NEON.cyan}30 0%, transparent 55%)`,
                          }}
                        />
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute -right-32 -top-32 w-[460px] h-[460px] rounded-full border" style={{ borderColor: `${NEON.cyan}30`, animation: 'slow-spin 60s linear infinite' }} />
                          <div className="absolute -right-20 -top-20 w-[340px] h-[340px] rounded-full border-2 border-dashed" style={{ borderColor: `${NEON.cyan}40`, animation: 'slow-spin-reverse 45s linear infinite' }} />
                        </div>

                        <div className="relative p-10 h-full flex flex-col justify-between">
                          <div className="flex items-center gap-3">
                            <Eye className="h-7 w-7" style={{ color: NEON.cyan, filter: `drop-shadow(0 0 12px ${NEON.cyan})` }} />
                            <span className="font-mono text-[11px] tracking-[0.4em] uppercase" style={{ color: NEON.cyan }}>// MISSION DIRECTIVE</span>
                          </div>

                          <div className="max-w-[88%]">
                            <p className="text-[40px] leading-[1.1] font-light tracking-tight" style={{ color: '#1f2937', textShadow: '0 2px 16px rgba(255,255,255,0.6)' }}>
                              Establish <span className="font-black" style={{ color: NEON.cyan, textShadow: `0 0 24px ${NEON.cyan}` }}>Orlando</span> as the global capital for <span className="font-black" style={{ color: '#111827', filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.5))' }}>entrepreneurship</span>, international commerce, capital and <span className="font-black" style={{ color: NEON.lime, textShadow: `0 0 24px ${NEON.lime}` }}>innovation</span>.
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: `${NEON.cyan}40` }}>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.lime, boxShadow: `0 0 10px ${NEON.lime}` }} />
                              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-slate-700">JV · WTC × SFH</span>
                            </div>
                            <span className="font-mono text-[10px] tracking-[0.4em] uppercase" style={{ color: NEON.cyan }}>ORLANDO · FL · USA</span>
                          </div>
                        </div>
                      </GlassCard>

                      {/* BOTTOM STAT STRIP — SFH track record */}
                      <div className="grid grid-cols-3 gap-4 h-[230px]">
                        {[
                          { v: '4', l: 'Global Hubs', c: NEON.cyan, i: Globe2, img: kpiCities },
                          { v: '40,000+', l: 'Central Florida Network', c: NEON.magenta, i: Network, img: kpiNetwork },
                          { v: '$200M', l: 'Capital Raised', c: NEON.lime, i: TrendingUp, img: kpiCapital },
                        ].map((s, i) => (
                          <GlassCard key={i} accent={s.c} padding="p-0" className="relative overflow-hidden min-w-0">
                            {/* bg image */}
                            <div className="absolute inset-0" style={{ backgroundImage: `url(${s.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            {/* darkening + neon wash */}
                            <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.5) 55%, rgba(255,255,255,0.42) 100%), radial-gradient(ellipse at 100% 100%, ${s.c}28 0%, transparent 60%)` }} />

                            <div className="relative p-5 h-full flex flex-col justify-between">
                              <div className="flex items-center justify-between">
                                <NeonBadge icon={s.i} color={s.c} size="md" />
                                <span className="font-mono text-[9px] tracking-[0.35em] uppercase" style={{ color: s.c }}>KPI·{String(i+1).padStart(2,'0')}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="font-futuristic font-black leading-none truncate" style={{ fontSize: '44px', ...PLATINUM_TITLE, textShadow: `0 0 24px ${s.c}90, 0 2px 8px rgba(255,255,255,0.7)` }}>{s.v}</div>
                                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] leading-snug" style={{ color: '#374151' }}>{s.l}</div>
                              </div>
                            </div>
                          </GlassCard>
                        ))}
                      </div>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 3 — THE OPPORTUNITY
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.magenta} code="02" label="OPPORTUNITY" pageNum={3}>
                    {/* HEADER: title + dual logos */}
                    <div className="flex items-start justify-between gap-6 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[11px] tracking-[0.4em] uppercase mb-2" style={{ color: NEON.magenta }}>02 · The Opportunity</div>
                        <h2 className="font-display font-black leading-[0.95]" style={{ fontSize: '46px', ...PLATINUM_TITLE }}>
                          Orlando has the growth.<br/>
                          <span style={{ color: NEON.magenta, textShadow: `0 0 28px ${NEON.magenta}90` }}>It needs the convergence.</span>
                        </h2>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 pt-1">
                        {/* WTC mark */}
                        <div className="flex flex-col items-center justify-center w-[78px] h-[78px] rounded-full border-2 backdrop-blur-md" style={{ borderColor: `${NEON.cyan}90`, background: `${NEON.cyan}15`, boxShadow: `0 0 18px ${NEON.cyan}60` }}>
                          <Globe2 className="w-6 h-6" style={{ color: NEON.cyan }} />
                          <span className="font-futuristic font-black text-[11px] tracking-wider" style={{ color: NEON.cyan }}>WTC</span>
                        </div>
                        <span className="font-mono text-2xl" style={{ color: `${NEON.cyan}80` }}>×</span>
                        {/* SFH logo */}
                        <div className="flex items-center justify-center w-[78px] h-[78px] rounded-full border-2 backdrop-blur-md p-2" style={{ borderColor: `${NEON.lime}90`, background: `${NEON.lime}15`, boxShadow: `0 0 18px ${NEON.lime}60` }}>
                          <img src={sfhLogo} alt="Startup Factory Hub" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC TICKER STRIP */}
                    <div className="relative overflow-hidden rounded-md border mb-4" style={{ borderColor: `${NEON.magenta}40`, background: 'rgba(255,255,255,0.38)' }}>
                      <div className="flex items-center gap-8 py-2 px-4 font-mono text-[11px] tracking-[0.3em] uppercase whitespace-nowrap animate-pulse" style={{ color: `${NEON.cyan}cc` }}>
                        <span>● LIVE</span>
                        <span style={{ color: NEON.lime }}>ORLANDO MSA</span>
                        <span style={{ color: NEON.magenta }}>GDP +5.4% YoY</span>
                        <span style={{ color: NEON.cyan }}>JOBS +52K</span>
                        <span style={{ color: NEON.amber }}>VC INFLOW $1.2B</span>
                        <span style={{ color: NEON.lime }}>TOURISM #1 USA</span>
                        <span style={{ color: NEON.magenta }}>INNOV HUB · MISSING</span>
                      </div>
                    </div>

                    {/* 4-QUADRANT METRIC GRID WITH IMAGES */}
                    <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-1">
                      {[
                        { v: '#1', l: 'Fastest growing metro in the U.S.', c: NEON.cyan, i: Rocket, sub: 'Sustained population & GDP growth', img: oppGrowth },
                        { v: '2.8M', l: 'Central Florida population', c: NEON.magenta, i: Users, sub: 'Diverse, multilingual talent base', img: oppPopulation },
                        { v: '76M', l: 'Annual international visitors', c: NEON.lime, i: Globe2, sub: "World's #1 tourism destination", img: oppVisitors },
                        { v: '0', l: 'Centralized innovation destination', c: NEON.amber, i: Target, sub: 'Until now — the gap we close', img: oppGap },
                      ].map((q, i) => (
                        <GlassCard key={i} accent={q.c} padding="p-0" className="relative overflow-hidden flex flex-col">
                          {/* background image */}
                          <div className="absolute inset-0" style={{ backgroundImage: `url(${q.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                          {/* darkening + neon wash */}
                          <div className="absolute inset-0" style={{ background: `linear-gradient(140deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.5) 55%, rgba(255,255,255,0.42) 100%)` }} />
                          <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 85% 15%, ${q.c}35 0%, transparent 55%)` }} />
                          {/* scanning gradient line */}
                          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${q.c}, transparent)`, boxShadow: `0 0 10px ${q.c}` }} />

                          <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                            <div className="flex items-start justify-between">
                              <NeonBadge icon={q.i} color={q.c} size="lg" />
                              <span className="font-mono text-[10px] tracking-[0.35em] uppercase px-2 py-1 rounded border" style={{ color: q.c, borderColor: `${q.c}60`, background: `${q.c}10` }}>METRIC·{String(i+1).padStart(2,'0')}</span>
                            </div>
                            <div>
                              <div className="font-futuristic font-black leading-none mb-2" style={{ fontSize: '68px', color: q.c, textShadow: `0 0 28px ${q.c}90, 0 2px 8px rgba(0,0,0,0.9)` }}>{q.v}</div>
                              <div className="text-[17px] font-bold text-slate-900 leading-tight">{q.l}</div>
                              <div className="mt-1.5 text-[13px] text-slate-700 leading-snug">{q.sub}</div>
                              {/* animated bar */}
                              <div className="mt-3 h-[3px] rounded-full overflow-hidden" style={{ background: `${q.c}20` }}>
                                <div className="h-full rounded-full animate-pulse" style={{ width: '85%', background: `linear-gradient(90deg, ${q.c}, ${q.c}80)`, boxShadow: `0 0 8px ${q.c}` }} />
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 4 — JOINT VENTURE STRUCTURE
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="03" label="STRUCTURE" pageNum={4}>
                    <PageTitle kicker="03 · Joint Venture" title={<>One mission. <span style={{ color: NEON.cyan }}>50</span> / <span style={{ color: NEON.magenta }}>50</span> partnership.</>} />

                    {/* Modern dual-partner composition — bold typography, no photos */}
                    <div className="relative flex-1 grid grid-cols-2 gap-6 min-h-0">
                      {/* WTC PARTNER CARD */}
                      <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="relative rounded-3xl overflow-hidden border h-full flex flex-col p-8"
                        style={{
                          borderColor: `${NEON.cyan}55`,
                          background: `linear-gradient(155deg, ${NEON.cyan}22 0%, rgba(255,255,255,0.68) 45%, rgba(255,255,255,0.82) 100%)`,
                          boxShadow: `0 0 60px ${NEON.cyan}30, inset 0 0 0 1px ${NEON.cyan}25`,
                        }}
                      >
                        {/* glow orb */}
                        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full" style={{ background: `radial-gradient(circle, ${NEON.cyan}55, transparent 70%)`, filter: 'blur(20px)' }} />
                        {/* grid texture */}
                        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `linear-gradient(${NEON.cyan} 1px, transparent 1px), linear-gradient(90deg, ${NEON.cyan} 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
                        {/* corner brackets */}
                        <span className="absolute top-5 left-5 w-7 h-7 border-t-2 border-l-2" style={{ borderColor: NEON.cyan }} />
                        <span className="absolute bottom-5 right-5 w-7 h-7 border-b-2 border-r-2" style={{ borderColor: NEON.cyan }} />

                        <div className="relative z-10 flex items-start justify-between">
                          <NeonBadge icon={Building2} color={NEON.cyan} size="lg" />
                          <span className="font-mono text-[11px] tracking-[0.35em] uppercase px-3 py-1.5 rounded-md border" style={{ color: NEON.cyan, borderColor: `${NEON.cyan}60`, background: `${NEON.cyan}15` }}>PARTNER · A</span>
                        </div>

                        <div className="relative z-10 mt-6">
                          <div className="font-mono text-[12px] uppercase tracking-[0.35em]" style={{ color: NEON.cyan }}>Institutional Anchor</div>
                          <div className="mt-2 text-[34px] font-black leading-[1.0] tracking-tight" style={{ ...PLATINUM_TITLE, fontSize: '34px' }}>WTC Club<br/>Orlando</div>
                        </div>

                        <div className="relative z-10 mt-6 flex items-end gap-4">
                          <div className="font-futuristic font-black leading-none" style={{
                            fontSize: '108px',
                            ...PLATINUM_TITLE,
                            backgroundImage: `
                              repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
                              repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 5px),
                              linear-gradient(180deg, #9ca3af 0%, #374151 35%, ${NEON.cyan} 100%)
                            `,
                            filter: `drop-shadow(0 0 22px ${NEON.cyan}60)`,
                          }}>50<span style={{ fontSize: '52px' }}>%</span></div>
                          <div className="pb-3 font-mono text-[12px] uppercase tracking-[0.3em] font-semibold" style={{ color: NEON.cyan }}>Equity<br/>Stake</div>
                        </div>

                        <div className="relative z-10 mt-auto pt-5 space-y-2">
                          {[
                            { t: 'Premium HQ & Facilities', s: 'Class-A workspace' },
                            { t: 'WTC Global Network', s: '300+ cities worldwide' },
                            { t: 'Government & Trade Relations', s: 'Institutional access' },
                            { t: 'Brand Authority', s: 'Global credibility' },
                          ].map((row) => (
                            <div key={row.t} className="flex items-center gap-3 rounded-xl px-3.5 py-2 border" style={{ background: 'rgba(255,255,255,0.48)', borderColor: `${NEON.cyan}25` }}>
                              <Check className="w-4 h-4 shrink-0" style={{ color: NEON.cyan }} />
                              <div className="flex-1 min-w-0">
                                <div className="text-[16px] font-bold text-slate-900 leading-tight">{row.t}</div>
                                <div className="text-[12px] text-slate-700 leading-tight mt-0.5">{row.s}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* SFH PARTNER CARD */}
                      <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="relative rounded-3xl overflow-hidden border h-full flex flex-col p-8"
                        style={{
                          borderColor: `${NEON.magenta}55`,
                          background: `linear-gradient(205deg, ${NEON.magenta}22 0%, rgba(255,255,255,0.68) 45%, rgba(255,255,255,0.82) 100%)`,
                          boxShadow: `0 0 60px ${NEON.magenta}30, inset 0 0 0 1px ${NEON.magenta}25`,
                        }}
                      >
                        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full" style={{ background: `radial-gradient(circle, ${NEON.magenta}55, transparent 70%)`, filter: 'blur(20px)' }} />
                        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: `linear-gradient(${NEON.magenta} 1px, transparent 1px), linear-gradient(90deg, ${NEON.magenta} 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
                        <span className="absolute top-5 right-5 w-7 h-7 border-t-2 border-r-2" style={{ borderColor: NEON.magenta }} />
                        <span className="absolute bottom-5 left-5 w-7 h-7 border-b-2 border-l-2" style={{ borderColor: NEON.magenta }} />

                        <div className="relative z-10 flex items-start justify-between">
                          <span className="font-mono text-[11px] tracking-[0.35em] uppercase px-3 py-1.5 rounded-md border" style={{ color: NEON.magenta, borderColor: `${NEON.magenta}60`, background: `${NEON.magenta}15` }}>PARTNER · B</span>
                          <NeonBadge icon={Rocket} color={NEON.magenta} size="lg" />
                        </div>

                        <div className="relative z-10 mt-6 text-right">
                          <div className="font-mono text-[12px] uppercase tracking-[0.35em]" style={{ color: NEON.magenta }}>Operating Engine</div>
                          <div className="mt-2 text-[34px] font-black leading-[1.0] tracking-tight" style={{ ...PLATINUM_TITLE, fontSize: '34px' }}>Startup<br/>Factory Hub</div>
                        </div>

                        <div className="relative z-10 mt-6 flex items-end gap-4 justify-end">
                          <div className="pb-3 font-mono text-[12px] uppercase tracking-[0.3em] font-semibold text-right" style={{ color: NEON.magenta }}>Equity<br/>Stake</div>
                          <div className="font-futuristic font-black leading-none" style={{
                            fontSize: '108px',
                            ...PLATINUM_TITLE,
                            backgroundImage: `
                              repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
                              repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 5px),
                              linear-gradient(180deg, #9ca3af 0%, #374151 35%, ${NEON.magenta} 100%)
                            `,
                            filter: `drop-shadow(0 0 22px ${NEON.magenta}60)`,
                          }}>50<span style={{ fontSize: '52px' }}>%</span></div>
                        </div>

                        <div className="relative z-10 mt-auto pt-5 space-y-2">
                          {[
                            { t: 'Accelerator Operations', s: 'Programs & cohorts' },
                            { t: 'AI-Powered Digital Platform', s: 'Tech infrastructure' },
                            { t: 'Mentor & Investor Network', s: '500+ active members' },
                            { t: 'Marketing, Brand & Growth', s: 'Global outreach' },
                          ].map((row) => (
                            <div key={row.t} className="flex items-center gap-3 rounded-xl px-3.5 py-2 border" style={{ background: 'rgba(255,255,255,0.48)', borderColor: `${NEON.magenta}25` }}>
                              <Check className="w-4 h-4 shrink-0" style={{ color: NEON.magenta }} />
                              <div className="flex-1 min-w-0">
                                <div className="text-[16px] font-bold text-slate-900 leading-tight">{row.t}</div>
                                <div className="text-[12px] text-slate-700 leading-tight mt-0.5">{row.s}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>

                    </div>

                    {/* governance strip */}
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      {[
                        { l: 'Equal Equity', c: NEON.cyan },
                        { l: 'Shared Governance', c: NEON.lime },
                        { l: 'Joint Authority', c: NEON.magenta },
                      ].map((g, i) => (
                        <div key={i} className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl border" style={{ borderColor: `${g.c}55`, background: `${g.c}12` }}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.c, boxShadow: `0 0 12px ${g.c}` }} />
                          <span className="font-mono text-[13px] tracking-[0.3em] uppercase font-bold" style={{ color: g.c }}>{g.l}</span>
                        </div>
                      ))}
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>


              {/* ====================================================
                   PAGE 5 — WTC CONTRIBUTION (timeline rail left → right)
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="04" label="WTC CONTRIBUTION" pageNum={5}>
                    <PageTitle kicker="04 · WTC Brings" title={<>Institutional gravity. <span style={{ color: NEON.cyan }}>Global reach.</span></>} />

                    <div className="relative flex-1 pl-12">
                      {/* vertical rail */}
                      <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: `linear-gradient(180deg, transparent, ${NEON.cyan}, transparent)`, boxShadow: `0 0 12px ${NEON.cyan}` }} />

                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { i: Building2, t: 'Premium HQ & Facilities', b: 'A signature, executive-class destination ready to host founders, capital and global delegations.' },
                          { i: Globe2, t: 'WTC Global Network', b: 'Direct access to the World Trade Centers Association — 300+ cities, 100+ countries.' },
                          { i: Handshake, t: 'International Trade Channels', b: 'Established diplomatic and trade relationships unlocking market entry for portfolio companies.' },
                          { i: ShieldCheck, t: 'Government & Civic Relations', b: 'Direct lines to state, municipal and federal economic development authorities.' },
                          { i: Award, t: 'Brand Credibility & Authority', b: 'A world-renowned mark of trust that elevates every program, partner and announcement.' },
                        ].map((n, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.08 }}
                            className="relative"
                          >
                            {/* glowing node */}
                            <span className="absolute -left-[40px] top-6 w-4 h-4 rounded-full" style={{ background: NEON.cyan, boxShadow: `0 0 18px ${NEON.cyan}, 0 0 6px ${NEON.cyan}` }} />
                            <span className="absolute -left-[44px] top-5 w-6 h-6 rounded-full border" style={{ borderColor: `${NEON.cyan}60` }} />

                            <GlassCard accent={NEON.cyan} padding="p-5" className="flex items-center gap-5">
                              <NeonBadge icon={n.i} color={NEON.cyan} />
                              <div className="flex-1">
                                <div className="text-xl font-bold text-slate-900">{n.t}</div>
                                <div className="text-sm text-slate-900/65 mt-1 leading-relaxed">{n.b}</div>
                              </div>
                              <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: NEON.cyan }}>W/{String(idx + 1).padStart(2, '0')}</span>
                            </GlassCard>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 6 — SFH CONTRIBUTION (mirrored, magenta)
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.magenta} code="05" label="SFH CONTRIBUTION" pageNum={6}>
                    <PageTitle kicker="05 · SFH Brings" title={<>Entrepreneurial engine. <span style={{ color: NEON.magenta }}>Digital backbone.</span></>} accent={NEON.magenta} />

                    <div className="relative flex-1 pr-12">
                      <div className="absolute right-4 top-0 bottom-0 w-px" style={{ background: `linear-gradient(180deg, transparent, ${NEON.magenta}, transparent)`, boxShadow: `0 0 12px ${NEON.magenta}` }} />

                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { i: Rocket, t: 'Accelerator Operations', b: 'End-to-end program design, cohort delivery, founder support and outcome reporting.' },
                          { i: Brain, t: 'AI-Powered Digital Platform', b: 'A proprietary OS for members, founders, mentors and investors. Live deal flow. Real intelligence.' },
                          { i: GraduationCap, t: 'Mentor & Expert Network', b: '150+ active mentors. 300+ investors. 1,500+ investor directory. A relationship machine.' },
                          { i: DollarSign, t: 'Investor & Capital Relations', b: 'Curated capital pipelines and demo day infrastructure tuned for Series A through growth.' },
                          { i: Sparkles, t: 'Marketing, Brand & Growth', b: 'Editorial, content, events and global PR — already featured on Nasdaq Tower, Times Square.' },
                        ].map((n, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: idx * 0.08 }}
                            className="relative"
                          >
                            <span className="absolute -right-[40px] top-6 w-4 h-4 rounded-full" style={{ background: NEON.magenta, boxShadow: `0 0 18px ${NEON.magenta}, 0 0 6px ${NEON.magenta}` }} />
                            <span className="absolute -right-[44px] top-5 w-6 h-6 rounded-full border" style={{ borderColor: `${NEON.magenta}60` }} />

                            <GlassCard accent={NEON.magenta} padding="p-5" className="flex items-center gap-5">
                              <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: NEON.magenta }}>S/{String(idx + 1).padStart(2, '0')}</span>
                              <div className="flex-1">
                                <div className="text-xl font-bold text-slate-900">{n.t}</div>
                                <div className="text-sm text-slate-900/65 mt-1 leading-relaxed">{n.b}</div>
                              </div>
                              <NeonBadge icon={n.i} color={NEON.magenta} />
                            </GlassCard>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 7 — CAPABILITY MATRIX (4×4)
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.lime} code="06" label="CAPABILITY MATRIX" pageNum={7}>
                    <PageTitle kicker="06 · Capability Matrix" title={<>16 combined capabilities. <span style={{ color: NEON.lime }}>One platform.</span></>} accent={NEON.lime} />

                    <div className="grid grid-cols-4 gap-3 flex-1">
                      {[
                        { i: Building2, l: 'HQ Facility', c: NEON.cyan },
                        { i: Globe2, l: 'Global Network', c: NEON.cyan },
                        { i: Handshake, l: 'Trade Channels', c: NEON.cyan },
                        { i: ShieldCheck, l: 'Govt Relations', c: NEON.cyan },
                        { i: Award, l: 'Brand Authority', c: NEON.cyan },
                        { i: Users, l: 'Corp Members', c: NEON.cyan },
                        { i: MapPin, l: 'Intl Delegations', c: NEON.cyan },
                        { i: Briefcase, l: 'Exec Spaces', c: NEON.cyan },
                        { i: Rocket, l: 'Accelerator', c: NEON.magenta },
                        { i: Brain, l: 'AI Platform', c: NEON.magenta },
                        { i: GraduationCap, l: 'Mentor Net', c: NEON.magenta },
                        { i: DollarSign, l: 'Investor Ops', c: NEON.magenta },
                        { i: Lightbulb, l: 'Corp Innov', c: NEON.magenta },
                        { i: BarChart3, l: 'Exec Programs', c: NEON.magenta },
                        { i: Cpu, l: 'Digital Infra', c: NEON.magenta },
                        { i: TrendingUp, l: 'Growth Eng', c: NEON.magenta },
                      ].map((cap, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: i * 0.025 }}
                        >
                          <GlassCard accent={cap.c} padding="p-4" className="h-full flex flex-col items-center justify-center text-center gap-3 aspect-square">
                            <NeonBadge icon={cap.i} color={cap.c} />
                            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-900 font-semibold leading-tight">{cap.l}</div>
                            <div className="font-mono text-[9px] tracking-[0.3em]" style={{ color: cap.c }}>{i < 8 ? 'WTC' : 'SFH'}·{String((i % 8) + 1).padStart(2, '0')}</div>
                          </GlassCard>
                        </motion.div>
                      ))}
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 8 — DIGITAL PLATFORM
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="07" label="DIGITAL PLATFORM" pageNum={8}>
                    <PageTitle kicker="07 · Digital Platform" title={<>Try the live <span style={{ color: NEON.cyan }}>Innovation Nexus</span> app.</>} />

                    <GlassCard accent={NEON.cyan} padding="p-0" className="flex-1 overflow-hidden relative">
                      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] pointer-events-none">
                        <span style={{ color: NEON.cyan }}>● LIVE EMULATOR · INTERACTIVE</span>
                        <span className="text-slate-500">startupfactoryhub.com</span>
                      </div>
                      <div className="absolute inset-0 pt-8 p-2">
                        <iframe
                          src="/"
                          title="Startup Factory Hub — live app emulator"
                          loading="lazy"
                          className="w-full h-full rounded-2xl bg-white"
                          style={{ border: `1px solid ${NEON.cyan}40`, boxShadow: `0 0 40px ${NEON.cyan}30` }}
                        />
                      </div>
                    </GlassCard>

                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 9 — AR / IMMERSIVE
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.magenta} code="08" label="AR · IMMERSIVE" pageNum={9}>
                    <PageTitle kicker="08 · Augmented Reality" title={<><span style={{ color: NEON.magenta }}>Point.</span> Scan. Step inside.</>} accent={NEON.magenta} />

                    <div className="relative flex-1 rounded-2xl overflow-hidden" style={{ border: `1px solid ${NEON.magenta}50` }}>
                      <img src={moonBackground.url} alt="Moon" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${NEON.magenta}30 0%, transparent 40%, ${NEON.cyan}30 100%), linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.82) 100%)` }} />
                      <MatrixLayer density={0.18} columns={30} tone="magenta" />

                      <div className="absolute inset-0 flex flex-col justify-between p-10">
                        <div className="flex justify-between items-start">
                          <GlassCard accent={NEON.magenta} padding="p-5" className="max-w-xs">
                            <div className="flex items-center gap-3 mb-2">
                              <Scan className="h-5 w-5" style={{ color: NEON.magenta }} />
                              <span className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: NEON.magenta }}>AR · ACTIVE</span>
                            </div>
                            <div className="text-sm text-slate-900/85 leading-relaxed">
                              Any smartphone becomes a portal into the Innovation Nexus — 3D startup pavilions, holographic speakers, interactive WTC global map.
                            </div>
                          </GlassCard>
                          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-right text-slate-600">
                            <div>LAT 28°32′N</div>
                            <div>LON 81°22′W</div>
                            <div className="mt-1" style={{ color: NEON.magenta }}>● TRACKING</div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-futuristic font-black leading-[0.95] mb-5" style={{ fontSize: '52px', ...PLATINUM_TITLE, textShadow: `0 0 30px ${NEON.magenta}80` }}>
                            Walk through the<br /><span style={{ color: NEON.magenta }}>future of commerce.</span>
                          </h3>

                          {/* AR ROVER VIEWPORT */}
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="relative rounded-2xl overflow-hidden mb-4"
                            style={{
                              height: '180px',
                              border: `1px solid ${NEON.cyan}60`,
                              boxShadow: `0 0 40px ${NEON.cyan}30, inset 0 0 30px rgba(0,0,0,0.5)`,
                            }}
                          >
                            {/* @ts-ignore */}
                            <model-viewer
                              src={ROVER_GLB}
                              ar
                              ar-modes="webxr scene-viewer quick-look"
                              ar-placement="floor"
                              xr-environment
                              camera-controls
                              auto-rotate
                              touch-action="pan-y"
                              exposure="1"
                              shadow-intensity="1"
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent' }}
                            />
                            <a
                              href={`intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(ROVER_GLB)}&mode=ar_preferred&title=NASA%20Perseverance%20Rover#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`}
                              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-[0.25em] font-bold"
                              style={{ background: NEON.cyan, color: '#f4f7fb', boxShadow: `0 0 20px ${NEON.cyan}` }}
                            >
                              <Smartphone className="h-3.5 w-3.5" /> Launch Google XR
                            </a>
                            <div className="absolute inset-0" style={{
                              background: `linear-gradient(135deg, ${NEON.cyan}20 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.68) 100%)`,
                            }} />

                            {/* AR reticle / HUD */}
                            <div className="absolute inset-0 pointer-events-none">
                              {/* corner brackets */}
                              {[
                                'top-3 left-3 border-t-2 border-l-2',
                                'top-3 right-3 border-t-2 border-r-2',
                                'bottom-3 left-3 border-b-2 border-l-2',
                                'bottom-3 right-3 border-b-2 border-r-2',
                              ].map((cls, i) => (
                                <div key={i} className={`absolute w-6 h-6 ${cls}`} style={{ borderColor: NEON.cyan, boxShadow: `0 0 8px ${NEON.cyan}` }} />
                              ))}
                              {/* center reticle */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 animate-pulse" style={{ borderColor: NEON.cyan, boxShadow: `0 0 14px ${NEON.cyan}, inset 0 0 14px ${NEON.cyan}50` }} />
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ background: NEON.cyan, boxShadow: `0 0 10px ${NEON.cyan}` }} />
                            </div>

                            {/* HUD labels */}
                            <div className="absolute top-3 left-3 ml-8 inline-flex items-center gap-2 px-2.5 py-1 rounded-full" style={{
                              background: 'rgba(255,255,255,0.55)',
                              backdropFilter: 'blur(6px)',
                              border: `1px solid ${NEON.cyan}70`,
                            }}>
                              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON.cyan, boxShadow: `0 0 8px ${NEON.cyan}` }} />
                              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-900">AR · SCANNING</span>
                            </div>
                            <div className="absolute top-3 right-3 mr-8 font-mono text-[9px] uppercase tracking-[0.25em] text-slate-700 text-right">
                              <div>OBJ · NASA ROVER</div>
                              <div style={{ color: NEON.cyan }}>DIST 4.3M</div>
                            </div>
                            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                              <div>
                                <div className="font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: NEON.cyan }}>// LIVE VIEWPORT</div>
                                <div className="font-futuristic font-black text-lg leading-tight mt-0.5" style={{ ...PLATINUM_TITLE, fontSize: '18px', textShadow: `0 0 12px ${NEON.cyan}` }}>
                                  Mars Rover · Surface Scan
                                </div>
                              </div>
                              <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-600 text-right">
                                <div>LAT −4.5°  LON 137.4°</div>
                                <div style={{ color: NEON.magenta }}>● TRACKED</div>
                              </div>
                            </div>
                          </motion.div>

                          <div className="grid grid-cols-4 gap-3">
                            {[
                              { i: Smartphone, l: 'WebAR · No install' },
                              { i: Box, l: '3D Startup Booths' },
                              { i: Globe2, l: 'Global 3D Map' },
                              { i: Sparkles, l: 'Holo Speakers' },
                            ].map((p, i) => (
                              <GlassCard key={i} accent={NEON.magenta} padding="p-3" className="text-center">
                                <p.i className="h-5 w-5 mx-auto mb-2" style={{ color: NEON.magenta }} />
                                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-900 font-semibold">{p.l}</div>
                              </GlassCard>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 10 — ROADMAP
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.lime} code="09" label="ROADMAP" pageNum={10}>
                    <PageTitle kicker="09 · Roadmap" title={<>From signed term sheet to <span style={{ color: NEON.lime }}>flagship destination.</span></>} accent={NEON.lime} />

                    <div className="relative flex-1">
                      {/* horizontal rail */}
                      <div className="absolute left-0 right-0 top-[40px] h-px" style={{ background: `linear-gradient(90deg, transparent, ${NEON.lime}, ${NEON.cyan}, ${NEON.magenta}, transparent)`, boxShadow: `0 0 12px ${NEON.lime}` }} />

                      <div className="grid grid-cols-4 gap-4 h-full">
                        {[
                          { p: 'PHASE 01', t: 'Foundation', d: 'Q3 · 26', c: NEON.lime, items: ['JV term sheet signed', 'Operating entity formed', 'Founding team in place'] },
                          { p: 'PHASE 02', t: 'Launch', d: 'Q4 · 26', c: NEON.cyan, items: ['Hub officially open', 'First cohort recruited', 'Platform v1 live'] },
                          { p: 'PHASE 03', t: 'Scale', d: '2027', c: NEON.amber, items: ['Corp innovation programs', 'AR experience deployed', 'Global delegations'] },
                          { p: 'PHASE 04', t: 'Expand', d: '2028+', c: NEON.magenta, items: ['Satellite hubs in WTC cities', 'Fund vehicle launched', 'Global cohort exchange'] },
                        ].map((ph, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="relative"
                          >
                            {/* node */}
                            <div className="flex justify-center mb-6">
                              <div className="w-5 h-5 rounded-full" style={{ background: ph.c, boxShadow: `0 0 18px ${ph.c}, 0 0 6px ${ph.c}` }} />
                            </div>
                            <GlassCard accent={ph.c} padding="p-5" className="h-full">
                              <div className="font-mono text-[10px] uppercase tracking-[0.35em] mb-2" style={{ color: ph.c }}>{ph.p}</div>
                              <div className="text-2xl font-bold text-slate-900 mb-1">{ph.t}</div>
                              <div className="font-mono text-xs text-slate-500 mb-4">{ph.d}</div>
                              <ul className="space-y-2">
                                {ph.items.map((it, j) => (
                                  <li key={j} className="flex items-start gap-2 text-sm text-slate-700 leading-snug">
                                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: ph.c }} />
                                    <span>{it}</span>
                                  </li>
                                ))}
                              </ul>
                            </GlassCard>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 10b — KPIs / SUCCESS DASHBOARD
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.lime} code="10B" label="KPI · DASHBOARD" pageNum={11}>
                    <PageTitle kicker="10b · Key Performance Indicators" title={<>Year-One <span style={{ color: NEON.lime }}>success</span> dashboard.</>} accent={NEON.lime} />

                    <div className="flex-1 flex flex-col gap-5 min-h-0">
                      {/* TARGETS STRIP — 6 hero metrics with animated counters + icons */}
                      <div className="grid grid-cols-6 gap-3">
                        {[
                          { v: 50,   suf: '',  pre: '',  l: 'Startups',       c: NEON.cyan,    i: Rocket },
                          { v: 200,  suf: '',  pre: '',  l: 'SFH Members',    c: NEON.lime,    i: Users },
                          { v: 150,  suf: '',  pre: '',  l: 'WTC Members',    c: NEON.magenta, i: Building2 },
                          { v: 5,    suf: 'M', pre: '$', l: 'Capital Raised', c: NEON.emerald, i: DollarSign },
                          { v: 150,  suf: '',  pre: '',  l: 'Jobs Created',   c: NEON.amber,   i: Briefcase },
                          { v: 90,   suf: '%', pre: '',  l: 'Satisfaction',   c: NEON.cyan,    i: TrendingUp },
                        ].map((k, i) => {
                          const Icon = k.i;
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 20, scale: 0.9 }}
                              whileInView={{ opacity: 1, y: 0, scale: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.55, delay: i * 0.07, type: 'spring', stiffness: 120 }}
                            >
                              <GlassCard accent={k.c} padding="p-4" className="text-center relative overflow-hidden">
                                {/* glow halo */}
                                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${k.c}55, transparent 60%)` }} />
                                <div className="relative">
                                  <Icon className="mx-auto h-5 w-5 mb-2" style={{ color: k.c, filter: `drop-shadow(0 0 10px ${k.c})` }} />
                                  <div className="font-futuristic font-black leading-none flex items-baseline justify-center gap-0.5" style={{ color: k.c, textShadow: `0 0 18px ${k.c}` }}>
                                    <span style={{ fontSize: '20px' }}>{k.pre}</span>
                                    <motion.span
                                      style={{ fontSize: '44px' }}
                                      initial={{ opacity: 0 }}
                                      whileInView={{ opacity: 1 }}
                                      viewport={{ once: true }}
                                    >
                                      <motion.span
                                        initial={{ '--n': 0 } as any}
                                        whileInView={{ '--n': k.v } as any}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.6, delay: 0.2 + i * 0.07, ease: 'easeOut' }}
                                      >
                                        {k.v}
                                      </motion.span>
                                    </motion.span>
                                    <span style={{ fontSize: '20px' }}>{k.suf}</span>
                                  </div>
                                  <div className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-slate-700 mt-2">{k.l}</div>
                                  {/* underline pulse */}
                                  <motion.div
                                    className="mt-2 h-[2px] mx-auto rounded-full"
                                    initial={{ width: 0 }}
                                    whileInView={{ width: '70%' }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1, delay: 0.5 + i * 0.07 }}
                                    style={{ background: `linear-gradient(90deg, transparent, ${k.c}, transparent)`, boxShadow: `0 0 8px ${k.c}` }}
                                  />
                                </div>
                              </GlassCard>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* CATEGORY GRID — 6 KPI domains */}
                      <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
                        {[
                          {
                            icon: Rocket, c: NEON.cyan, code: 'A', title: 'Startup & Innovation', pct: 78,
                            items: ['Startups accelerated', 'Survival rate', 'Capital raised', 'Jobs created', 'Revenue growth', 'IP / patents', 'Founders served', 'Graduation rate'],
                          },
                          {
                            icon: Users, c: NEON.lime, code: 'B', title: 'Membership Growth', pct: 84,
                            items: ['New SFH memberships', 'New WTC memberships', 'Retention rate', 'International members', 'Corporate members'],
                          },
                          {
                            icon: Building2, c: NEON.magenta, code: 'C', title: 'Corporate Engagement', pct: 72,
                            items: ['Innovation projects', 'Strategic partnerships', 'Pilot projects', 'Sponsorship revenue', 'Executive participation'],
                          },
                          {
                            icon: DollarSign, c: NEON.emerald, code: 'D', title: 'Investment Metrics', pct: 66,
                            items: ['Investors engaged', 'Pitch events hosted', 'Capital deployed', 'Venture funds participating', 'Investor meetings'],
                          },
                          {
                            icon: Globe2, c: NEON.amber, code: 'E', title: 'International Impact', pct: 58,
                            items: ['Delegations hosted', 'Countries represented', 'Foreign companies', 'Soft Landing participants', 'Trade initiatives'],
                          },
                          {
                            icon: Network, c: NEON.cyan, code: 'F', title: 'Community & Facility', pct: 88,
                            items: ['Events hosted', 'Annual attendance', 'Mentor participation', 'Media mentions', 'Workspace occupancy', 'NPS score'],
                          },
                        ].map((cat, idx) => {
                          const Icon = cat.icon;
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 24 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.55, delay: 0.3 + idx * 0.08 }}
                              className="min-h-0"
                            >
                              <GlassCard accent={cat.c} padding="p-4" className="h-full flex flex-col relative overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none" style={{ background: cat.c }} />
                                <div className="flex items-center gap-3 mb-3 relative">
                                  <NeonBadge icon={Icon} color={cat.c} size="md" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-mono text-[9px] uppercase tracking-[0.32em]" style={{ color: cat.c }}>KPI · {cat.code}</div>
                                    <div className="font-futuristic font-black text-[16px] leading-tight" style={PLATINUM_TITLE}>{cat.title}</div>
                                  </div>
                                  {/* ring score */}
                                  <div className="relative w-12 h-12 shrink-0">
                                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
                                      <circle cx="20" cy="20" r="16" fill="none" stroke={`${cat.c}25`} strokeWidth="3" />
                                      <motion.circle
                                        cx="20" cy="20" r="16" fill="none"
                                        stroke={cat.c} strokeWidth="3" strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 16}`}
                                        initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                                        whileInView={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - cat.pct / 100) }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.4, delay: 0.5 + idx * 0.08, ease: 'easeOut' }}
                                        style={{ filter: `drop-shadow(0 0 6px ${cat.c})` }}
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center font-futuristic font-black text-[11px]" style={{ color: cat.c }}>{cat.pct}%</div>
                                  </div>
                                </div>
                                <ul className="space-y-1.5 flex-1">
                                  {cat.items.map((it, j) => (
                                    <li key={j} className="flex items-start gap-2">
                                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cat.c, boxShadow: `0 0 8px ${cat.c}` }} />
                                      <span className="text-[12px] text-slate-800 leading-snug font-medium">{it}</span>
                                    </li>
                                  ))}
                                </ul>
                                {/* animated bar */}
                                <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: `${cat.c}18` }}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${cat.pct}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.3, delay: 0.5 + idx * 0.08, ease: 'easeOut' }}
                                    className="h-full rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${cat.c}, ${cat.c}80)`, boxShadow: `0 0 12px ${cat.c}` }}
                                  />
                                </div>
                              </GlassCard>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* FOOTER STRIP — year one targets summary */}
                      <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55, delay: 0.85 }}
                      >
                        <GlassCard accent={NEON.lime} padding="p-3.5" className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-2.5">
                            <Target className="h-5 w-5 animate-pulse" style={{ color: NEON.lime, filter: `drop-shadow(0 0 10px ${NEON.lime})` }} />
                            <span className="font-mono text-[11px] uppercase tracking-[0.32em] font-bold" style={{ color: NEON.lime }}>Year One · Targets</span>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-900/85 flex-wrap">
                            {[
                              ['40', 'Corp Partners'],
                              ['100', 'Mentors'],
                              ['25', 'Investor Orgs'],
                              ['60', 'Events'],
                              ['3,000', 'Attendees'],
                              ['10', 'Delegations'],
                            ].map(([n, l], i, arr) => (
                              <span key={i} className="flex items-center gap-3">
                                <span><b className="text-slate-900 font-futuristic text-[14px]" style={{ textShadow: `0 0 10px ${NEON.lime}` }}>{n}</b> <span className="text-slate-700">{l}</span></span>
                                {i < arr.length - 1 && <span style={{ color: NEON.cyan }}>·</span>}
                              </span>
                            ))}
                          </div>
                        </GlassCard>
                      </motion.div>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 11 — BUSINESS MODELS
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="11" label="REVENUE ARCHITECTURE" pageNum={12}>
                    <PageTitle kicker="11 · Business Models" title={<>A diversified <span style={{ color: NEON.cyan }}>revenue architecture</span> across twenty engines.</>} accent={NEON.cyan} />

                    <div className="flex-1 flex flex-col gap-4 min-h-0">
                      {/* 5 category cards */}
                      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                        {[
                          {
                            icon: Users, c: NEON.cyan, code: '01', title: 'Access & Membership',
                            models: ['Membership subscriptions', 'Coworking & workspace', 'Community access', 'Franchising'],
                          },
                          {
                            icon: Rocket, c: NEON.magenta, code: '02', title: 'Venture & Startups',
                            models: ['Accelerator fees & equity', 'Venture studio builds', 'Venture capital carry', 'Corporate innovation programs'],
                          },
                          {
                            icon: GraduationCap, c: NEON.lime, code: '03', title: 'Knowledge & Media',
                            models: ['Education & training', 'Events & conferences', 'Strategic sponsorships', 'Media & content'],
                          },
                          {
                            icon: Cpu, c: NEON.amber, code: '04', title: 'Platform & Services',
                            models: ['Marketplace matchmaking', 'Platform-as-a-Service', 'IP licensing', 'Strategic consulting'],
                          },
                          {
                            icon: Globe, c: '#a78bfa', code: '05', title: 'Global & Economic Development',
                            models: ['International soft-landing', 'Economic development', 'Trade & commerce', 'Managed innovation ecosystems'],
                          },
                        ].map((cat, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.12 + idx * 0.08 }}
                            className={`min-h-0 ${idx === 4 ? 'col-span-2' : ''}`}
                          >
                            <GlassCard accent={cat.c} padding="p-5" className="h-full flex flex-col justify-between">
                              <div className="flex items-center gap-3 mb-3">
                                <NeonBadge icon={cat.icon} color={cat.c} size="md" />
                                <div>
                                  <div className="font-mono text-[9px] uppercase tracking-[0.3em]" style={{ color: cat.c }}>MODEL · {cat.code}</div>
                                  <div className="font-futuristic font-black text-[17px] leading-tight" style={PLATINUM_TITLE}>{cat.title}</div>
                                </div>
                              </div>
                              <div className={`grid gap-2 ${idx === 4 ? 'grid-cols-4' : 'grid-cols-2'}`}>
                                {cat.models.map((m, i) => (
                                  <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: `${cat.c}10`, border: `1px solid ${cat.c}25` }}>
                                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cat.c, boxShadow: `0 0 6px ${cat.c}` }} />
                                    <span className="text-[11.5px] text-slate-800 font-medium leading-tight">{m}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: `${cat.c}12` }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${65 + idx * 5}%` }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 1, delay: 0.4 + idx * 0.1, ease: 'easeOut' }}
                                  className="h-full rounded-full"
                                  style={{ background: `linear-gradient(90deg, ${cat.c}, ${cat.c}70)`, boxShadow: `0 0 10px ${cat.c}` }}
                                />
                              </div>
                            </GlassCard>
                          </motion.div>
                        ))}
                      </div>

                      {/* Hybrid recommendation banner */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                      >
                        <GlassCard accent={NEON.lime} padding="p-5" className="relative overflow-hidden">
                          <div className="absolute inset-0 pointer-events-none" style={{
                            background: `linear-gradient(90deg, ${NEON.cyan}10, ${NEON.magenta}10, ${NEON.lime}10)`,
                          }} />
                          <div className="relative flex items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                                background: `linear-gradient(135deg, ${NEON.cyan}30, ${NEON.magenta}30)`,
                                border: `1px solid ${NEON.lime}60`,
                                boxShadow: `0 0 20px ${NEON.lime}40`,
                              }}>
                                <Orbit className="h-6 w-6" style={{ color: NEON.lime }} />
                              </div>
                              <div>
                                <div className="font-mono text-[9px] uppercase tracking-[0.35em] mb-1" style={{ color: NEON.lime }}>Recommended Hybrid Model</div>
                                <div className="font-futuristic font-black text-[18px] leading-tight" style={PLATINUM_TITLE}>Nine integrated engines powering the WTC Innovation Hub</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2 max-w-[55%]">
                              {['Membership','Innovation Platform','Corporate Innovation','Accelerator','Education','Events','International Trade','Workspace','Venture Capital'].map((tag, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-[0.15em]" style={{
                                  background: `${NEON.lime}15`, border: `1px solid ${NEON.lime}40`, color: '#eafff0',
                                }}>{tag}</span>
                              ))}
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 12 — FINANCIAL MODEL
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.amber} code="12" label="ECONOMICS" pageNum={13}>
                    <PageTitle kicker="10 · Economics" title={<>A diversified, <span style={{ color: NEON.amber }}>self-reinforcing</span> revenue model.</>} accent={NEON.amber} />

                    {/* top KPI row */}
                    <div className="grid grid-cols-3 gap-5 mb-6">
                      {[
                        { v: '$200M', l: 'Capital Raised by Portfolio', c: NEON.cyan, i: TrendingUp },
                        { v: '40+', l: 'Startups Accelerated', c: NEON.magenta, i: Rocket },
                        { v: '4,000+', l: 'Network Reach', c: NEON.lime, i: Network },
                      ].map((k, i) => (
                        <GlassCard key={i} accent={k.c} padding="p-6" className="text-center">
                          <NeonBadge icon={k.i} color={k.c} size="lg" />
                          <div className="font-futuristic font-black mt-4 leading-none" style={{ fontSize: '64px', color: k.c, textShadow: `0 0 28px ${k.c}60` }}>{k.v}</div>
                          <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.25em] text-slate-700">{k.l}</div>
                        </GlassCard>
                      ))}
                    </div>

                    {/* revenue streams */}
                    <div className="font-mono text-[10px] uppercase tracking-[0.4em] mb-3" style={{ color: NEON.amber }}>// REVENUE STREAMS</div>
                    <div className="space-y-3 flex-1">
                      {[
                        { l: 'Membership & Corporate Partnerships', pct: 35, c: NEON.cyan },
                        { l: 'Accelerator & Cohort Fees', pct: 22, c: NEON.magenta },
                        { l: 'Events, Conferences & Sponsorships', pct: 18, c: NEON.lime },
                        { l: 'Platform Licensing & Data', pct: 15, c: NEON.amber },
                        { l: 'Investment Vehicle Carry', pct: 10, c: '#a78bfa' },
                      ].map((r, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-2 text-sm">
                            <span className="text-slate-900 font-semibold">{r.l}</span>
                            <span className="font-mono font-bold" style={{ color: r.c }}>{r.pct}%</span>
                          </div>
                          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${r.c}30` }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${r.pct * 2}%` }}
                              transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${r.c}, ${r.c}80)`, boxShadow: `0 0 12px ${r.c}80` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 13 — GOVERNANCE & NEXT STEPS
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="13" label="GOVERNANCE · NEXT" pageNum={14}>
                    <PageTitle kicker="11 · Governance" title={<>Equal seats. <span style={{ color: NEON.cyan }}>Shared authority.</span></>} />

                    <div className="grid grid-cols-2 gap-6 flex-1">
                      {/* left: governance */}
                      <GlassCard accent={NEON.cyan} padding="p-7" className="flex flex-col">
                        <NeonBadge icon={CircuitBoard} color={NEON.cyan} size="lg" />
                        <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.35em] mb-3" style={{ color: NEON.cyan }}>OPERATING ENTITY</div>
                        <h3 className="text-3xl font-black leading-tight mb-5" style={PLATINUM_TITLE}>WTC Innovation Hub LLC</h3>
                        <div className="space-y-3">
                          {[
                            { l: 'Ownership', v: '50 / 50' },
                            { l: 'Board Seats', v: '2 + 2' },
                            { l: 'Strategy', v: 'Joint' },
                            { l: 'Operations', v: 'SFH-led' },
                            { l: 'Facility', v: 'WTC-anchored' },
                          ].map((r, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: `${NEON.cyan}20` }}>
                              <span className="font-mono text-xs uppercase tracking-[0.25em] text-slate-900/55">{r.l}</span>
                              <span className="text-slate-900 font-bold">{r.v}</span>
                            </div>
                          ))}
                        </div>
                      </GlassCard>

                      {/* right: next steps */}
                      <GlassCard accent={NEON.magenta} padding="p-7" className="flex flex-col">
                        <NeonBadge icon={Zap} color={NEON.magenta} size="lg" />
                        <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.35em] mb-3" style={{ color: NEON.magenta }}>NEXT STEPS · 90 DAYS</div>
                        <h3 className="text-3xl font-black leading-tight mb-5" style={PLATINUM_TITLE}>From here to launch</h3>
                        <div className="space-y-4 flex-1">
                          {[
                            { d: '01', t: 'Executive presentation', s: 'WTC Club Orlando leadership' },
                            { d: '02', t: 'Term sheet review', s: 'Counsel-supported alignment' },
                            { d: '03', t: 'Definitive JV agreement', s: 'Operating entity formed' },
                            { d: '04', t: 'Public announcement', s: 'Launch communications' },
                            { d: '05', t: 'Hub activation', s: 'First cohort + opening event' },
                          ].map((step, i) => (
                            <div key={i} className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-futuristic font-black text-sm" style={{
                                background: `${NEON.magenta}15`, border: `1px solid ${NEON.magenta}60`, color: NEON.magenta, boxShadow: `0 0 12px ${NEON.magenta}40`,
                              }}>{step.d}</div>
                              <div className="flex-1 pt-1">
                                <div className="text-slate-900 font-bold">{step.t}</div>
                                <div className="text-xs text-slate-900/55 mt-0.5">{step.s}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    </div>
                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 14 — NASDAQ FEATURE
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.lime} code="14" label="GLOBAL VISIBILITY" pageNum={15}>
                    <PageTitle kicker="12 · Nasdaq Tower · Times Square" title={<>Featured on the <span style={{ color: NEON.lime }}>world's stage.</span></>} />

                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="relative flex-1 rounded-3xl overflow-hidden"
                      style={{
                        border: `1px solid ${NEON.lime}55`,
                        boxShadow: `0 0 60px ${NEON.lime}25, inset 0 0 40px rgba(0,0,0,0.6)`,
                      }}
                    >
                      {/* Full-bleed hero image */}
                      <div className="absolute inset-0" style={{
                        backgroundImage: `url(${nasdaqFeature})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }} />
                      <div className="absolute inset-0" style={{
                        background: `linear-gradient(180deg, rgba(2,4,10,0.15) 0%, rgba(255,255,255,0.42) 55%, rgba(2,4,10,0.96) 100%)`,
                      }} />
                      <div className="absolute inset-0" style={{
                        background: `radial-gradient(ellipse at 50% 20%, ${NEON.lime}22, transparent 60%)`,
                      }} />
                      <Scanlines />

                      {/* Top-left live badge */}
                      <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.25, duration: 0.5 }}
                        className="absolute top-6 left-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full z-10"
                        style={{
                          background: 'rgba(2,4,10,0.65)',
                          backdropFilter: 'blur(8px)',
                          border: `1px solid ${NEON.lime}70`,
                          boxShadow: `0 0 18px ${NEON.lime}50`,
                        }}
                      >
                        <Radio className="h-3 w-3 animate-pulse" style={{ color: NEON.lime }} />
                        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-900">LIVE · TIMES SQUARE</span>
                      </motion.div>

                      {/* Bottom content panel */}
                      <div className="absolute inset-x-0 bottom-0 z-10 p-10">
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
                        >
                          <div className="font-mono text-[11px] uppercase tracking-[0.4em] mb-3" style={{ color: NEON.lime }}>// FEATURED</div>
                          <h3 className="font-futuristic font-black leading-[1.05] mb-4" style={{
                            fontSize: '44px',
                            ...PLATINUM_TITLE,
                            textShadow: `0 2px 14px rgba(0,0,0,0.95), 0 0 30px ${NEON.lime}40`,
                          }}>
                            Startup Factory Hub<br />
                            <span style={{ color: NEON.lime }}>on the Nasdaq Tower</span>
                          </h3>
                          <p className="text-base text-slate-900/85 leading-relaxed max-w-xl mb-6">
                            Times Square broadcast — the WTC × SFH alliance placed alongside the world's most recognized brands, in front of a global financial audience.
                          </p>
                        </motion.div>

                        {/* Inline metric strip */}
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.55, duration: 0.6, staggerChildren: 0.08 }}
                          className="grid grid-cols-4 gap-3"
                        >
                          {[
                            { k: '350K+', l: 'Daily viewers' },
                            { k: 'NYC', l: 'Times Square' },
                            { k: 'Global', l: 'Press reach' },
                            { k: '24/7', l: 'Brand presence' },
                          ].map((m, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 16 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.6 + i * 0.08, duration: 0.45 }}
                              className="rounded-xl px-4 py-3"
                              style={{
                                background: 'rgba(255,255,255,0.42)',
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${NEON.lime}40`,
                                boxShadow: `inset 0 0 18px ${NEON.lime}10`,
                              }}
                            >
                              <div className="font-futuristic font-black text-xl" style={{ color: NEON.lime, textShadow: `0 0 14px ${NEON.lime}70` }}>{m.k}</div>
                              <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-900/65 mt-0.5">{m.l}</div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    </motion.div>

                  </PageFrame>
                </A4Wrapper>
              </BookPage>

              {/* ====================================================
                   PAGE 15 — CLOSING
                  ==================================================== */}

              <BookPage>
                <A4Wrapper>
                  <section className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(180deg, #ffffff 0%, #f9fafc 100%)` }}>
                    <MatrixLayer density={0.4} columns={40} tone="mix" />
                    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${NEON.cyan}20 0%, transparent 60%), radial-gradient(circle at 50% 100%, ${NEON.magenta}25, transparent 50%)` }} />
                    <Scanlines />
                    <NeonEmeraldFrame inset={20} radius="32px" />

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-[600px] h-[600px] rounded-full border" style={{ borderColor: `${NEON.cyan}20`, animation: 'slow-spin 60s linear infinite' }} />
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-[440px] h-[440px] rounded-full border-2 border-dashed" style={{ borderColor: `${NEON.magenta}25`, animation: 'slow-spin-reverse 45s linear infinite' }} />
                    </div>

                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-14">
                      <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
                        className="mb-5"
                      >
                        <img
                          src={sfhLogo}
                          alt="Startup Factory Hub"
                          className="h-20 object-contain"
                          style={{ filter: `drop-shadow(0 0 24px ${NEON.cyan}80)` }}
                        />
                      </motion.div>

                      <Orbit className="h-10 w-10 mb-6" style={{ color: NEON.cyan, filter: `drop-shadow(0 0 18px ${NEON.cyan})` }} />

                      <div className="font-mono text-[11px] uppercase tracking-[0.45em] mb-6" style={{ color: NEON.cyan }}>// CLOSING TRANSMISSION</div>

                      <h1 className="font-futuristic font-black leading-[0.9] tracking-tight" style={{
                        fontSize: '88px',
                        ...PLATINUM_TITLE,
                        backgroundImage: `
                          repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
                          repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 5px),
                          linear-gradient(180deg, #9ca3af 0%, #374151 35%, ${NEON.cyan} 100%)
                        `,
                        textShadow: `0 0 60px ${NEON.cyan}50`,
                      }}>
                        LET'S BUILD<br />THE FUTURE
                      </h1>

                      <div className="mt-6 h-[3px] w-[280px]" style={{
                        background: `linear-gradient(90deg, transparent, ${NEON.cyan}, ${NEON.magenta}, transparent)`,
                        boxShadow: `0 0 20px ${NEON.cyan}`,
                      }} />

                      <p className="mt-8 text-xl text-slate-700 max-w-xl leading-relaxed">
                        Orlando's flagship for innovation and global commerce is ready to be built — together.
                      </p>

                      <a
                        href="mailto:partnerships@startupfactoryhub.com"
                        className="mt-10 inline-flex items-center gap-4 px-8 py-5 rounded-2xl transition hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${NEON.cyan}25, ${NEON.magenta}25)`,
                          border: `1px solid ${NEON.cyan}80`,
                          boxShadow: `0 0 40px ${NEON.cyan}40, inset 0 0 20px ${NEON.cyan}10`,
                        }}
                      >
                        <Mail className="h-5 w-5" style={{ color: NEON.cyan }} />
                        <span className="text-base font-bold tracking-[0.18em] uppercase text-slate-900">Schedule a Presentation</span>
                        <ArrowUpRight className="h-5 w-5" style={{ color: NEON.cyan }} />
                      </a>

                      <div className="mt-12 flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.35em] text-slate-500">
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.cyan }} />ORLANDO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.magenta }} />SANTIAGO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.lime }} />TOKYO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.amber }} />SEVILLA</div>
                      </div>
                    </div>

                    <div className="absolute bottom-8 left-12 right-12 flex items-center justify-between font-mono text-[10px] tracking-[0.4em] uppercase z-20">
                      <span className="text-slate-500">// startupfactoryhub.com</span>
                      <span style={{ color: NEON.cyan }}>END · TRANSMISSION</span>
                    </div>
                  </section>
                </A4Wrapper>
              </BookPage>
            </>
          );

          if (!flipbookSupported) {
            return (
              <div className="w-full max-w-[700px] mx-auto flex flex-col gap-6">
                {pages}
              </div>
            );
          }
          return (
            <HTMLFlipBook
              ref={bookRef}
              width={595}
              height={841}
              size="stretch"
              minWidth={300}
              maxWidth={700}
              minHeight={420}
              maxHeight={990}
              showCover={false}
              mobileScrollSupport={true}
              drawShadow={true}
              flippingTime={700}
              maxShadowOpacity={0.5}
              usePortrait={true}
              startPage={0}
              startZIndex={0}
              autoSize={true}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={false}
              disableFlipByClick={false}
              className="mx-auto shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
              style={{}}
              onFlip={(e: any) => setCurrentPage(e.data)}
              onInit={(e: any) => setTotalPages(e.data?.pages ?? totalPages)}
            >
              {Children.toArray((pages as any).props.children)}
            </HTMLFlipBook>
          );
        })()}
      </div>
    </div>
  );
}
