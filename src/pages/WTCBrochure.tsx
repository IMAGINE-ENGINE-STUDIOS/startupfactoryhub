import { useState, useRef, useEffect, useCallback, forwardRef, Children } from 'react';
import {
  Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail,
  Network, BarChart3, GraduationCap, Building2, Cpu, DollarSign,
  Handshake, MapPin, Brain, Briefcase, ShieldCheck, Sparkles,
  Globe2, Scan, Box, Eye, Smartphone, Zap, Orbit, ArrowUpRight,
  ChevronLeft, ChevronRight, CircuitBoard, Radio, Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
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

/* =========================================================================
   NEON COLOR TOKENS — used throughout via inline style for max fidelity
   ========================================================================= */
// Palette: cyan / electric blue / lime / teal — no pink, purple or orange tones.
const NEON = {
  cyan: '#22e6ff',
  cyanSoft: 'rgba(34,230,255,0.6)',
  magenta: '#3d9bff',          // repointed: electric blue (was magenta)
  magentaSoft: 'rgba(61,155,255,0.55)',
  lime: '#7dff8a',
  amber: '#5eead4',            // repointed: teal (was amber)
  ink: '#04060d',
  inkSoft: 'rgba(4,6,13,0.55)',
};

/* =========================================================================
   MATRIX RAIN BACKDROP — characters falling, dual-tone
   ========================================================================= */
const MATRIX_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩABCDEF0123456789@#$%&*";
const MatrixLayer = ({ density = 0.25, columns = 40, tone = 'cyan' }: { density?: number; columns?: number; tone?: 'cyan' | 'magenta' | 'mix' }) => {
  const cols = Array.from({ length: columns }, (_, i) => i);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ opacity: density }}>
      {cols.map((c) => {
        const charsInCol = 24 + Math.floor(Math.random() * 14);
        const left = (c / columns) * 100;
        const delay = (Math.random() * 6).toFixed(2);
        const duration = 14 + Math.random() * 10;
        const color = tone === 'mix' ? (c % 4 === 0 ? NEON.magenta : NEON.cyan) : tone === 'magenta' ? NEON.magenta : NEON.cyan;
        return (
          <div
            key={c}
            className="absolute top-0 font-mono text-[12px] leading-[15px] whitespace-pre"
            style={{
              left: `${left}%`,
              color,
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              animation: `matrix-fall ${duration}s linear ${delay}s infinite`,
              textShadow: `0 0 8px ${color}`,
            }}
          >
            {Array.from({ length: charsInCol }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]).join('')}
          </div>
        );
      })}
    </div>
  );
};

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
    backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(255,255,255,0.025) 3px, rgba(255,255,255,0.025) 4px)',
  }} />
);

const HUDCorners = ({ color = NEON.cyan, size = 28 }: { color?: string; size?: number }) => (
  <>
    <span className="absolute top-3 left-3 pointer-events-none" style={{ width: size, height: size, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`, boxShadow: `0 0 12px ${color}88` }} />
    <span className="absolute top-3 right-3 pointer-events-none" style={{ width: size, height: size, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}`, boxShadow: `0 0 12px ${color}88` }} />
    <span className="absolute bottom-3 left-3 pointer-events-none" style={{ width: size, height: size, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}`, boxShadow: `0 0 12px ${color}88` }} />
    <span className="absolute bottom-3 right-3 pointer-events-none" style={{ width: size, height: size, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}`, boxShadow: `0 0 12px ${color}88` }} />
  </>
);

/* =========================================================================
   GLASS CARD — glassmorphism with neon gradient border + corner accents
   ========================================================================= */
const GlassCard = ({
  children, className = '', accent = NEON.cyan, glow = true, padding = 'p-6',
}: { children: React.ReactNode; className?: string; accent?: string; glow?: boolean; padding?: string }) => (
  <div className={`relative rounded-2xl ${padding} ${className}`} style={{
    background: `linear-gradient(140deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: `1px solid ${accent}40`,
    boxShadow: glow ? `0 0 0 1px ${accent}10 inset, 0 20px 60px -20px ${accent}30, 0 0 40px -10px ${accent}25` : undefined,
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
    background: `radial-gradient(ellipse at 30% 0%, ${accent}15 0%, transparent 50%), radial-gradient(ellipse at 70% 100%, ${NEON.magenta}10 0%, transparent 55%), linear-gradient(180deg, #050810 0%, #02040a 100%)`,
  }}>
    <MatrixLayer density={0.10} columns={28} tone="cyan" />
    <HudGrid />
    <Scanlines />
    <HUDCorners color={accent} />

    {/* top hud bar */}
    <div className="absolute top-5 left-12 right-12 flex items-center justify-between font-mono text-[10px] tracking-[0.32em] uppercase pointer-events-none z-20">
      <div className="flex items-center gap-2" style={{ color: accent }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
        <span>SEC // {code}</span>
      </div>
      <div className="text-white/40">{label}</div>
      <div style={{ color: accent }}>P/{String(pageNum).padStart(2, '0')} · 13</div>
    </div>

    {/* bottom hud bar */}
    <div className="absolute bottom-5 left-12 right-12 flex items-center justify-between font-mono text-[9px] tracking-[0.3em] uppercase pointer-events-none z-20">
      <span className="text-white/35">// WTC × SFH · ORLANDO INNOVATION NEXUS</span>
      <span className="text-white/35">28°32′N · 81°22′W</span>
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
    <h2 className="font-futuristic font-black text-white leading-[0.95] tracking-tight" style={{
      fontSize: 'clamp(34px, 5vw, 56px)',
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
    <div ref={containerRef} className="w-full" style={{ background: '#02040a', position: 'relative', overflow: 'hidden', aspectRatio: `${BASE_W}/${BASE_H}` }}>
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
  <div ref={ref} className="overflow-hidden" style={{ background: '#02040a' }}>{children}</div>
));
BookPage.displayName = "BookPage";

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */
export default function WTCBrochure() {
  const navigate = useNavigate();
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(13);
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
    <div className="min-h-screen text-white" style={{ background: '#02040a' }}>
      {/* Nav bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3" style={{
        background: 'rgba(4,6,13,0.7)',
        backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${NEON.cyan}30`,
      }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 text-white hover:bg-white/5" style={{ color: NEON.cyan }}>
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={flipPrev} className="h-8 w-8 hover:bg-white/5" style={{ color: NEON.cyan }} disabled={!flipbookSupported}>
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
          <Button variant="ghost" size="icon" onClick={flipNext} className="h-8 w-8 hover:bg-white/5" style={{ color: NEON.cyan }} disabled={!flipbookSupported}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="w-[88px]" />
      </div>

      <div
        className="pt-20 pb-12 min-h-screen flex items-center justify-center px-2 sm:px-6"
        style={{ background: `radial-gradient(ellipse at center, ${NEON.cyan}15 0%, #02040a 65%)` }}
      >
        {(() => {
          const pages = (
            <>
              {/* ====================================================
                   PAGE 1 — COVER
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <section className="absolute inset-0 overflow-hidden" style={{ background: '#02040a' }}>
                    <MatrixLayer density={0.35} columns={42} tone="mix" />
                    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 45%, ${NEON.cyan}20 0%, transparent 55%), radial-gradient(ellipse at 50% 80%, ${NEON.magenta}15 0%, transparent 50%)` }} />
                    <Scanlines />
                    <HUDCorners color={NEON.cyan} size={42} />

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
                          background: `linear-gradient(180deg, #ffffff 0%, ${NEON.cyan} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
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
                        className="mt-8 text-xl text-white/80 max-w-xl leading-relaxed font-light"
                      >
                        A next-generation innovation destination where founders, capital, corporations and global commerce converge.
                      </motion.p>

                      <div className="mt-10 flex items-center gap-3">
                        <img src={sfhLogo} alt="SFH" className="h-12 object-contain" style={{ filter: `drop-shadow(0 0 16px ${NEON.cyan}90)` }} />
                      </div>
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
                            background: `linear-gradient(120deg, rgba(2,4,10,0.92) 0%, rgba(2,4,10,0.75) 45%, rgba(2,4,10,0.55) 100%), radial-gradient(ellipse at 80% 20%, ${NEON.cyan}30 0%, transparent 55%)`,
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
                            <p className="text-[40px] leading-[1.1] font-light text-white tracking-tight" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}>
                              Establish <span className="font-black" style={{ color: NEON.cyan, textShadow: `0 0 24px ${NEON.cyan}` }}>Orlando</span> as the global capital for <span className="font-black text-white">entrepreneurship</span>, international commerce, capital and <span className="font-black" style={{ color: NEON.lime, textShadow: `0 0 24px ${NEON.lime}` }}>innovation</span>.
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: `${NEON.cyan}40` }}>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.lime, boxShadow: `0 0 10px ${NEON.lime}` }} />
                              <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/70">JV · WTC × SFH</span>
                            </div>
                            <span className="font-mono text-[10px] tracking-[0.4em] uppercase" style={{ color: NEON.cyan }}>ORLANDO · FL · USA</span>
                          </div>
                        </div>
                      </GlassCard>

                      {/* BOTTOM STAT STRIP */}
                      <div className="grid grid-cols-3 gap-4 h-[230px]">
                        {[
                          { v: '300+', l: 'WTC Cities Worldwide', c: NEON.cyan, i: Globe2, img: kpiCities },
                          { v: '4,000+', l: 'Central Florida Network', c: NEON.magenta, i: Network, img: kpiNetwork },
                          { v: '$200M', l: 'Capital Raised', c: NEON.lime, i: TrendingUp, img: kpiCapital },
                        ].map((s, i) => (
                          <GlassCard key={i} accent={s.c} padding="p-0" className="relative overflow-hidden min-w-0">
                            {/* bg image */}
                            <div className="absolute inset-0" style={{ backgroundImage: `url(${s.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            {/* darkening + neon wash */}
                            <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, rgba(2,4,10,0.88) 0%, rgba(2,4,10,0.72) 55%, rgba(2,4,10,0.55) 100%), radial-gradient(ellipse at 100% 100%, ${s.c}28 0%, transparent 60%)` }} />

                            <div className="relative p-5 h-full flex flex-col justify-between">
                              <div className="flex items-center justify-between">
                                <NeonBadge icon={s.i} color={s.c} size="md" />
                                <span className="font-mono text-[9px] tracking-[0.35em] uppercase" style={{ color: s.c }}>KPI·{String(i+1).padStart(2,'0')}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="font-futuristic font-black text-white leading-none truncate" style={{ fontSize: '44px', textShadow: `0 0 24px ${s.c}90, 0 2px 8px rgba(0,0,0,0.8)` }}>{s.v}</div>
                                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/85 leading-snug">{s.l}</div>
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
                    <PageTitle kicker="02 · The Opportunity" title={<>Orlando has the growth. <br/><span style={{ color: NEON.magenta }}>It needs the convergence.</span></>} accent={NEON.magenta} />

                    <div className="grid grid-cols-2 grid-rows-2 gap-5 flex-1">
                      {[
                        { v: '#1', l: 'Fastest growing metro in the U.S.', c: NEON.cyan, i: Rocket, sub: 'Sustained population & GDP growth' },
                        { v: '2.8M', l: 'Central Florida population', c: NEON.magenta, i: Users, sub: 'Diverse, multilingual talent base' },
                        { v: '76M', l: 'Annual international visitors', c: NEON.lime, i: Globe2, sub: "World's #1 tourism destination" },
                        { v: '0', l: 'Centralized innovation destination', c: NEON.amber, i: Target, sub: 'Until now — the gap we close' },
                      ].map((q, i) => (
                        <GlassCard key={i} accent={q.c} padding="p-7" className="flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <NeonBadge icon={q.i} color={q.c} size="lg" />
                            <span className="font-mono text-[10px] tracking-[0.35em] uppercase" style={{ color: `${q.c}` }}>METRIC·{String(i+1).padStart(2,'0')}</span>
                          </div>
                          <div>
                            <div className="font-futuristic font-black text-white leading-none mb-3" style={{ fontSize: '78px', color: q.c, textShadow: `0 0 30px ${q.c}80` }}>{q.v}</div>
                            <div className="text-lg font-bold text-white leading-tight">{q.l}</div>
                            <div className="mt-2 text-sm text-white/60 leading-snug">{q.sub}</div>
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
                    <PageTitle kicker="03 · Joint Venture" title={<>One mission. <span style={{ color: NEON.cyan }}>50</span> / <span style={{ color: NEON.magenta }}>50</span> strategic partnership.</>} />

                    <div className="relative flex-1 flex items-center justify-center">
                      {/* ambient rings */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-[520px] h-[520px] rounded-full border-2 border-dashed" style={{ borderColor: `${NEON.cyan}20`, animation: 'slow-spin 60s linear infinite' }} />
                        <div className="absolute w-[360px] h-[360px] rounded-full border" style={{ borderColor: `${NEON.magenta}25`, animation: 'slow-spin-reverse 45s linear infinite' }} />
                      </div>

                      {/* connecting bridge */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[2px] pointer-events-none z-0"
                           style={{ background: `linear-gradient(90deg, ${NEON.cyan}, ${NEON.lime}, ${NEON.magenta})`, boxShadow: `0 0 14px ${NEON.lime}` }} />

                      <div className="relative grid grid-cols-[1fr_auto_1fr] gap-6 z-10 w-full items-center">
                        {/* WTC */}
                        <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.7 }}>
                          <GlassCard accent={NEON.cyan} padding="p-7" className="text-center h-full">
                            <NeonBadge icon={Building2} color={NEON.cyan} size="lg" />
                            <div className="font-mono text-[11px] uppercase tracking-[0.35em] mt-5 mb-2 text-white/50">PARTNER · A</div>
                            <div className="text-xl text-white font-bold mb-3">WTC Club Orlando</div>
                            <div className="font-futuristic font-black leading-none" style={{
                              fontSize: '120px',
                              background: `linear-gradient(180deg, #ffffff, ${NEON.cyan})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              textShadow: `0 0 50px ${NEON.cyan}50`,
                            }}>50<span style={{ fontSize: '60px' }}>%</span></div>
                            <div className="mt-2 text-xs font-mono uppercase tracking-[0.3em]" style={{ color: NEON.cyan }}>Ownership</div>
                            <div className="mt-4 text-sm text-white/70 leading-relaxed">Institutional prestige · Physical HQ · Global trade network</div>
                          </GlassCard>
                        </motion.div>

                        {/* CENTER JV CORE */}
                        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                          <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: `radial-gradient(circle, ${NEON.lime}55 0%, transparent 70%)`, filter: 'blur(20px)' }} />
                          <div className="relative w-[140px] h-[140px] flex items-center justify-center hexagon" style={{
                            background: `linear-gradient(135deg, ${NEON.cyan}, ${NEON.lime}, ${NEON.magenta})`,
                            boxShadow: `0 0 40px ${NEON.lime}80, inset 0 0 20px rgba(0,0,0,0.4)`,
                          }}>
                            <div className="w-[124px] h-[124px] flex flex-col items-center justify-center hexagon" style={{ background: '#02040a' }}>
                              <span className="font-mono text-[9px] tracking-[0.35em] uppercase" style={{ color: NEON.lime }}>JV CORE</span>
                              <span className="font-futuristic font-black text-white text-[40px] leading-none mt-1" style={{ textShadow: `0 0 18px ${NEON.lime}` }}>100%</span>
                              <span className="font-mono text-[8px] tracking-[0.3em] uppercase text-white/60 mt-1">Aligned</span>
                            </div>
                          </div>
                        </motion.div>

                        {/* SFH */}
                        <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.1 }}>
                          <GlassCard accent={NEON.magenta} padding="p-7" className="text-center h-full">
                            <NeonBadge icon={Rocket} color={NEON.magenta} size="lg" />
                            <div className="font-mono text-[11px] uppercase tracking-[0.35em] mt-5 mb-2 text-white/50">PARTNER · B</div>
                            <div className="text-xl text-white font-bold mb-3">Startup Factory Hub</div>
                            <div className="font-futuristic font-black leading-none" style={{
                              fontSize: '120px',
                              background: `linear-gradient(180deg, #ffffff, ${NEON.magenta})`,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              textShadow: `0 0 50px ${NEON.magenta}50`,
                            }}>50<span style={{ fontSize: '60px' }}>%</span></div>
                            <div className="mt-2 text-xs font-mono uppercase tracking-[0.3em]" style={{ color: NEON.magenta }}>Ownership</div>
                            <div className="mt-4 text-sm text-white/70 leading-relaxed">Accelerator engine · Digital platform · Ecosystem ops</div>
                          </GlassCard>
                        </motion.div>
                      </div>
                    </div>

                    {/* governance strip */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      {[
                        { l: 'Equal Equity', c: NEON.cyan },
                        { l: 'Shared Governance', c: NEON.lime },
                        { l: 'Joint Strategic Authority', c: NEON.magenta },
                      ].map((g, i) => (
                        <div key={i} className="flex items-center justify-center gap-2 py-2 rounded-md border" style={{ borderColor: `${g.c}40`, background: `${g.c}08` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: g.c, boxShadow: `0 0 8px ${g.c}` }} />
                          <span className="font-mono text-[10px] tracking-[0.35em] uppercase" style={{ color: g.c }}>{g.l}</span>
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
                                <div className="text-xl font-bold text-white">{n.t}</div>
                                <div className="text-sm text-white/65 mt-1 leading-relaxed">{n.b}</div>
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
                                <div className="text-xl font-bold text-white">{n.t}</div>
                                <div className="text-sm text-white/65 mt-1 leading-relaxed">{n.b}</div>
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
                            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white font-semibold leading-tight">{cap.l}</div>
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
                    <PageTitle kicker="07 · Digital Platform" title={<>The operating system <br/>of the <span style={{ color: NEON.cyan }}>Innovation Nexus.</span></>} />

                    <div className="grid grid-cols-2 gap-6 flex-1">
                      {/* Left: device mockup */}
                      <GlassCard accent={NEON.cyan} padding="p-0" className="overflow-hidden relative">
                        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, ${NEON.cyan}20, transparent 65%)` }} />
                        <div className="relative h-full flex items-center justify-center p-8">
                          <div className="relative">
                            <div className="absolute -inset-8 rounded-3xl" style={{ background: `radial-gradient(circle, ${NEON.cyan}40, transparent 70%)`, filter: 'blur(30px)' }} />
                            <img src={dashboardMockup} alt="Platform" className="relative rounded-xl border" style={{ borderColor: `${NEON.cyan}60`, boxShadow: `0 0 40px ${NEON.cyan}40, 0 30px 60px rgba(0,0,0,0.5)` }} />
                            <HUDCorners color={NEON.cyan} size={20} />
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em]">
                          <span style={{ color: NEON.cyan }}>● LIVE</span>
                          <span className="text-white/50">v4.2 · BUILD 2026.06</span>
                        </div>
                      </GlassCard>

                      {/* Right: 4 feature blocks */}
                      <div className="grid grid-rows-4 gap-3">
                        {[
                          { i: Network, t: 'Member · Founder · Investor Portals', b: 'Three-tier identity with role-based intelligence.', c: NEON.cyan },
                          { i: Brain, t: 'AI Matchmaking Engine', b: 'Founders ↔ mentors ↔ capital, in real time.', c: NEON.magenta },
                          { i: Radio, t: 'Live Deal Flow & Discovery', b: 'A continuously updating pipeline of opportunities.', c: NEON.lime },
                          { i: Globe2, t: 'Global WTC Directory Access', b: '300+ cities, instantly navigable from one screen.', c: NEON.amber },
                        ].map((f, i) => (
                          <GlassCard key={i} accent={f.c} padding="p-4" className="flex items-center gap-4">
                            <NeonBadge icon={f.i} color={f.c} />
                            <div className="flex-1">
                              <div className="text-base font-bold text-white leading-tight">{f.t}</div>
                              <div className="text-xs text-white/60 mt-1 leading-snug">{f.b}</div>
                            </div>
                            <ArrowUpRight className="h-4 w-4" style={{ color: f.c }} />
                          </GlassCard>
                        ))}
                      </div>
                    </div>
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
                      <img src={coworkingSpace} alt="AR" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${NEON.magenta}30 0%, transparent 40%, ${NEON.cyan}30 100%), linear-gradient(180deg, transparent 30%, rgba(2,4,10,0.95) 100%)` }} />
                      <MatrixLayer density={0.18} columns={30} tone="magenta" />
                      <HUDCorners color={NEON.magenta} size={32} />

                      <div className="absolute inset-0 flex flex-col justify-between p-10">
                        <div className="flex justify-between items-start">
                          <GlassCard accent={NEON.magenta} padding="p-5" className="max-w-xs">
                            <div className="flex items-center gap-3 mb-2">
                              <Scan className="h-5 w-5" style={{ color: NEON.magenta }} />
                              <span className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: NEON.magenta }}>AR · ACTIVE</span>
                            </div>
                            <div className="text-sm text-white/85 leading-relaxed">
                              Any smartphone becomes a portal into the Innovation Nexus — 3D startup pavilions, holographic speakers, interactive WTC global map.
                            </div>
                          </GlassCard>
                          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-right text-white/60">
                            <div>LAT 28°32′N</div>
                            <div>LON 81°22′W</div>
                            <div className="mt-1" style={{ color: NEON.magenta }}>● TRACKING</div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-futuristic font-black text-white leading-[0.95] mb-5" style={{ fontSize: '64px', textShadow: `0 0 30px ${NEON.magenta}80` }}>
                            Walk through the<br /><span style={{ color: NEON.magenta }}>future of commerce.</span>
                          </h3>
                          <div className="grid grid-cols-4 gap-3">
                            {[
                              { i: Smartphone, l: 'WebAR · No install' },
                              { i: Box, l: '3D Startup Booths' },
                              { i: Globe2, l: 'Global 3D Map' },
                              { i: Sparkles, l: 'Holo Speakers' },
                            ].map((p, i) => (
                              <GlassCard key={i} accent={NEON.magenta} padding="p-3" className="text-center">
                                <p.i className="h-5 w-5 mx-auto mb-2" style={{ color: NEON.magenta }} />
                                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white font-semibold">{p.l}</div>
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
                              <div className="text-2xl font-bold text-white mb-1">{ph.t}</div>
                              <div className="font-mono text-xs text-white/50 mb-4">{ph.d}</div>
                              <ul className="space-y-2">
                                {ph.items.map((it, j) => (
                                  <li key={j} className="flex items-start gap-2 text-sm text-white/80 leading-snug">
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
                   PAGE 11 — FINANCIAL MODEL
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.amber} code="10" label="ECONOMICS" pageNum={11}>
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
                          <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">{k.l}</div>
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
                            <span className="text-white font-semibold">{r.l}</span>
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
                   PAGE 12 — GOVERNANCE & NEXT STEPS
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <PageFrame accent={NEON.cyan} code="11" label="GOVERNANCE · NEXT" pageNum={12}>
                    <PageTitle kicker="11 · Governance" title={<>Equal seats. <span style={{ color: NEON.cyan }}>Shared authority.</span></>} />

                    <div className="grid grid-cols-2 gap-6 flex-1">
                      {/* left: governance */}
                      <GlassCard accent={NEON.cyan} padding="p-7" className="flex flex-col">
                        <NeonBadge icon={CircuitBoard} color={NEON.cyan} size="lg" />
                        <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.35em] mb-3" style={{ color: NEON.cyan }}>OPERATING ENTITY</div>
                        <h3 className="text-3xl font-black text-white leading-tight mb-5">WTC Innovation Hub LLC</h3>
                        <div className="space-y-3">
                          {[
                            { l: 'Ownership', v: '50 / 50' },
                            { l: 'Board Seats', v: '2 + 2' },
                            { l: 'Strategy', v: 'Joint' },
                            { l: 'Operations', v: 'SFH-led' },
                            { l: 'Facility', v: 'WTC-anchored' },
                          ].map((r, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: `${NEON.cyan}20` }}>
                              <span className="font-mono text-xs uppercase tracking-[0.25em] text-white/55">{r.l}</span>
                              <span className="text-white font-bold">{r.v}</span>
                            </div>
                          ))}
                        </div>
                      </GlassCard>

                      {/* right: next steps */}
                      <GlassCard accent={NEON.magenta} padding="p-7" className="flex flex-col">
                        <NeonBadge icon={Zap} color={NEON.magenta} size="lg" />
                        <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.35em] mb-3" style={{ color: NEON.magenta }}>NEXT STEPS · 90 DAYS</div>
                        <h3 className="text-3xl font-black text-white leading-tight mb-5">From here to launch</h3>
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
                                <div className="text-white font-bold">{step.t}</div>
                                <div className="text-xs text-white/55 mt-0.5">{step.s}</div>
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
                   PAGE 13 — CLOSING
                  ==================================================== */}
              <BookPage>
                <A4Wrapper>
                  <section className="absolute inset-0 overflow-hidden" style={{ background: '#02040a' }}>
                    <MatrixLayer density={0.4} columns={40} tone="mix" />
                    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at center, ${NEON.cyan}20 0%, transparent 60%), radial-gradient(circle at 50% 100%, ${NEON.magenta}25, transparent 50%)` }} />
                    <Scanlines />
                    <HUDCorners color={NEON.cyan} size={42} />

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-[600px] h-[600px] rounded-full border" style={{ borderColor: `${NEON.cyan}20`, animation: 'slow-spin 60s linear infinite' }} />
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-[440px] h-[440px] rounded-full border-2 border-dashed" style={{ borderColor: `${NEON.magenta}25`, animation: 'slow-spin-reverse 45s linear infinite' }} />
                    </div>

                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-14">
                      <Orbit className="h-10 w-10 mb-6" style={{ color: NEON.cyan, filter: `drop-shadow(0 0 18px ${NEON.cyan})` }} />

                      <div className="font-mono text-[11px] uppercase tracking-[0.45em] mb-6" style={{ color: NEON.cyan }}>// CLOSING TRANSMISSION</div>

                      <h1 className="font-futuristic font-black leading-[0.9] tracking-tight" style={{
                        fontSize: '88px',
                        background: `linear-gradient(180deg, #ffffff 0%, ${NEON.cyan} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: `0 0 60px ${NEON.cyan}50`,
                      }}>
                        LET'S BUILD<br />THE FUTURE
                      </h1>

                      <div className="mt-6 h-[3px] w-[280px]" style={{
                        background: `linear-gradient(90deg, transparent, ${NEON.cyan}, ${NEON.magenta}, transparent)`,
                        boxShadow: `0 0 20px ${NEON.cyan}`,
                      }} />

                      <p className="mt-8 text-xl text-white/80 max-w-xl leading-relaxed">
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
                        <span className="text-base font-bold tracking-[0.18em] uppercase text-white">Schedule a Presentation</span>
                        <ArrowUpRight className="h-5 w-5" style={{ color: NEON.cyan }} />
                      </a>

                      <div className="mt-12 flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.35em] text-white/50">
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.cyan }} />ORLANDO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.magenta }} />SANTIAGO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.lime }} />TOKYO</div>
                        <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.amber }} />SEVILLA</div>
                      </div>
                    </div>

                    <div className="absolute bottom-8 left-12 right-12 flex items-center justify-between font-mono text-[10px] tracking-[0.4em] uppercase z-20">
                      <span className="text-white/40">// startupfactoryhub.com</span>
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
