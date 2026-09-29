/**
 * /basic-plan — Startup Factory Hub Membership brochure.
 *
 * Editorial flipbook brochure: institutional photography, large editorial
 * typography, animated data charts and an animated ambient backdrop.
 * The membership is an ANNUAL plan, payable monthly or upfront (20% off).
 */
import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  Children,
} from 'react';
import { motion } from 'framer-motion';
import HTMLFlipBook from 'react-pageflip';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import {
  Check, ChevronLeft, ChevronRight, Mail, ArrowUpRight, Loader2, ShieldCheck, CreditCard,
  Scan, Smartphone, Box, Globe2, Sparkles, Radio, Users, MapPin, Wifi,
  CalendarDays, Award, Building2, Handshake, Rocket, Brain, GraduationCap, DollarSign,
  Coffee, BadgeCheck, Code2,
} from 'lucide-react';
import '@google/model-viewer';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBasicPlan, formatCents } from '@/features/basic-plan/hooks/useBasicPlan';
import { useMembershipAccess } from '@/features/basic-plan/hooks/useMembershipAccess';
import { createBasicPlanCheckout } from '@/features/basic-plan/api/basicPlanApi';
import type { BillingCycle } from '@/features/basic-plan/types';

import imgCampus from '@/assets/membership/campus-atrium.jpg';
import imgSkyline from '@/assets/membership/global-skyline.jpg';
import imgGlobal from '@/assets/membership/plan-global.jpg';
import nasdaqFeature from '@/assets/nasdaq-feature.jpg';
import eventArtemisWatchParty from '@/assets/event-artemis-watch-party.png';
import eventVoyagerOsu from '@/assets/event-voyager-osu.jpg.asset.json';
import eventLaunchingOrlando from '@/assets/event-launching-orlando.jpg';
import eventLakeCounty from '@/assets/event-lake-county.jpg';
import eventPlugAndPlay from '@/assets/event-plug-and-play.jpg';
import nasaLogo from '@/assets/nasa-logo.png';
import innovationCoffeeTable from '@/assets/membership/innovation-coffee-table.jpg';
import foxtailLogo from '@/assets/foxtail-coffee-logo.png.asset.json';

import visionHub from '@/assets/wtc-vision-hub-future.jpg.asset.json';
import moonBackground from '@/assets/moon-background.jpg.asset.json';
import SFHNetworkGlobe from '@/components/SFHNetworkGlobe';

const NASA_BASE = 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models';
const ROVER_GLB = `${NASA_BASE}/Mars%202020%20Perseverance%20Rover/Mars%202020%20Perseverance%20Rover.glb`;

/* ============================ DESIGN TOKENS ============================ */
const NEON = {
  cyan: '#0ea5b7',
  blue: '#1f2a44',
  emerald: '#059669',
  ink: '#0f172a',
  magenta: '#d946a6',
  lime: '#65a30d',
  amber: '#f59e0b',
};

const DEEP_LIME = '#3f6212';

const Scanlines = () => (
  <div className="absolute inset-0 pointer-events-none opacity-[0.18]" style={{
    backgroundImage: 'repeating-linear-gradient(180deg, rgba(15,23,42,0.09) 0px, rgba(15,23,42,0.09) 1px, transparent 1px, transparent 3px)',
  }} />
);


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

const TOTAL = 10;

/* ============================ PRIMITIVES ============================ */
const HudGrid = () => (
  <div className="absolute inset-0 pointer-events-none" style={{
    backgroundImage: `linear-gradient(${NEON.cyan}11 1px, transparent 1px), linear-gradient(90deg, ${NEON.cyan}11 1px, transparent 1px)`,
    backgroundSize: '40px 40px',
    maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
  }} />
);

/** Animated ambient field: drifting light fields + slow scanning beam. */
const AmbientField = ({ accent = NEON.cyan }: { accent?: string }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <motion.div
      className="absolute rounded-full"
      style={{ width: 560, height: 560, left: '-14%', top: '-16%', background: `radial-gradient(circle, ${accent}26 0%, transparent 68%)`, filter: 'blur(6px)' }}
      animate={{ x: [0, 60, -20, 0], y: [0, 40, 80, 0], scale: [1, 1.12, 0.96, 1] }}
      transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute rounded-full"
      style={{ width: 620, height: 620, right: '-18%', bottom: '-20%', background: `radial-gradient(circle, ${NEON.blue}22 0%, transparent 68%)`, filter: 'blur(6px)' }}
      animate={{ x: [0, -50, 25, 0], y: [0, -35, -70, 0], scale: [1, 1.08, 0.94, 1] }}
      transition={{ duration: 27, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute left-0 right-0 h-[220px]"
      style={{ background: `linear-gradient(180deg, transparent, ${accent}14, transparent)` }}
      animate={{ y: ['-25%', '115%'] }}
      transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

const Frame = () => (
  <div className="absolute pointer-events-none z-[5]" style={{
    inset: 16,
    borderRadius: '28px',
    border: '1px solid rgba(255,255,255,0.7)',
    boxShadow: '0 0 0 1px rgba(15,23,42,0.05), 0 30px 80px -30px rgba(15,23,42,0.25), inset 0 1px 0 rgba(255,255,255,0.9)',
  }} />
);

const GlassCard = ({
  children, className = '', accent = NEON.cyan, padding = 'p-6',
}: { children: React.ReactNode; className?: string; accent?: string; padding?: string }) => (
  <div className={`relative rounded-2xl ${padding} ${className}`} style={{
    background: 'linear-gradient(140deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.52) 100%)',
    backdropFilter: 'blur(22px) saturate(140%)',
    WebkitBackdropFilter: 'blur(22px) saturate(140%)',
    border: '1px solid rgba(255,255,255,0.85)',
    boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 30px 60px -25px rgba(15,23,42,0.18), 0 0 0 1px ${accent}15`,
  }}>
    <span className="absolute top-0 left-6 right-6 h-px pointer-events-none" style={{
      background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
    }} />
    {children}
  </div>
);

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

/** Typographic index plate — replaces generic icon badges. */
const IndexPlate = ({ n, color = NEON.cyan }: { n: number | string; color?: string }) => (
  <div className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center relative" style={{
    background: `linear-gradient(140deg, ${color}22, ${color}05)`,
    border: `1px solid ${color}55`,
    boxShadow: `inset 0 0 18px ${color}14`,
  }}>
    <span className="font-mono font-black text-[20px]" style={{ color }}>
      {typeof n === 'number' ? String(n).padStart(2, '0') : n}
    </span>
    <span className="absolute -bottom-px left-3 right-3 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
  </div>
);

/** Editorial photographic plate with duotone wash and HUD caption. */
const ImagePlate = ({
  src, alt, caption, accent = NEON.cyan, className = '', height = 240, eager = false,
}: { src: string; alt: string; caption?: string; accent?: string; className?: string; height?: number; eager?: boolean }) => (
  <div className={`relative overflow-hidden rounded-2xl ${className}`} style={{
    height, border: '1px solid rgba(255,255,255,0.7)',
    boxShadow: `0 30px 60px -30px rgba(15,23,42,0.4), 0 0 0 1px ${accent}18`,
  }}>
    <motion.img
      src={src}
      alt={alt}
      width={1536}
      height={1024}
      loading={eager ? 'eager' : 'lazy'}
      className="absolute inset-0 w-full h-full object-cover"
      initial={{ scale: 1.08 }}
      animate={{ scale: 1 }}
      transition={{ duration: 12, ease: 'easeOut' }}
    />
    <div className="absolute inset-0" style={{
      background: `linear-gradient(180deg, ${NEON.ink}10 0%, ${NEON.ink}70 100%), linear-gradient(120deg, ${accent}22, transparent 60%)`,
    }} />
    <motion.div
      className="absolute left-0 right-0 h-24 pointer-events-none"
      style={{ background: `linear-gradient(180deg, transparent, ${accent}33, transparent)` }}
      animate={{ y: ['-30%', '420%'] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
    />
    {caption && (
      <div className="absolute bottom-4 left-5 right-5 font-mono text-[13px] uppercase tracking-[0.28em] text-white/90">
        {caption}
      </div>
    )}
  </div>
);

const PageTitle = ({ kicker, title, accent = NEON.cyan }: { kicker: string; title: React.ReactNode; accent?: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-3">
      <span className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${accent})` }} />
      <span className="font-mono text-[15px] uppercase tracking-[0.4em]" style={{ color: accent }}>{kicker}</span>
    </div>
    <h2 className="font-black tracking-tight break-words" style={{
      fontSize: 'clamp(38px, 6vw, 56px)',
      lineHeight: 1.03,
      paddingBottom: '6px',
      ...PLATINUM_TITLE,
      textShadow: `0 0 30px ${accent}40`,
    }}>
      {title}
    </h2>
  </div>
);

const PageFrame = ({
  children, accent = NEON.cyan, code = '', label = '', pageNum,
}: { children: React.ReactNode; accent?: string; code?: string; label?: string; pageNum: number }) => (
  <section className="absolute inset-0 overflow-hidden" style={{
    background: `radial-gradient(ellipse at 20% 0%, ${accent}1f 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, ${NEON.blue}1a 0%, transparent 55%), linear-gradient(180deg, #fbfcfe 0%, #eef2f8 100%)`,
  }}>
    <HudGrid />
    <AmbientField accent={accent} />
    <Frame />

    <div className="absolute top-5 left-12 right-12 flex items-center justify-between font-mono text-[13px] tracking-[0.32em] uppercase pointer-events-none z-20">
      <div className="flex items-center gap-2" style={{ color: accent }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
        <span>SEC // {code}</span>
      </div>
      <div className="text-slate-500">{label}</div>
      <div style={{ color: accent }}>P/{String(pageNum).padStart(2, '0')} · {TOTAL}</div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none px-12 pb-4 pt-3"
      style={{ background: 'linear-gradient(180deg, rgba(238,242,248,0) 0%, rgba(238,242,248,0.92) 45%)' }}>
      <div className="h-px w-full mb-2" style={{ background: `linear-gradient(90deg, transparent, ${accent}55, transparent)` }} />
      <div className="flex items-center justify-between gap-6 font-mono text-[11px] tracking-[0.22em] uppercase leading-none whitespace-nowrap">
        <span className="text-slate-500 truncate">Startup Factory Hub · Membership Program</span>
        <span className="shrink-0" style={{ color: accent }}>MEMBERSHIP · MONTHLY</span>
      </div>
    </div>

    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="w-full h-full flex flex-col"
        style={{ padding: '70px 50px 74px 50px' }}
      >
        {children}
      </motion.div>
    </div>
  </section>
);

/* ============================ DATA VISUALS ============================ */

/* ============================ LAYOUT SUPPORT ============================ */
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
    <div ref={containerRef} className="w-full" style={{ background: '#ffffff', position: 'relative', overflow: 'hidden', height: `${BASE_H * scale}px` }}>
      <div style={{
        width: BASE_W, height: BASE_H, position: 'absolute', left: '50%', top: 0,
        marginLeft: -(BASE_W / 2), transform: `scale(${scale})`, transformOrigin: 'top center',
      }}>
        {children}
      </div>
    </div>
  );
};

const BookPage = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => (
  <div ref={ref} className="overflow-hidden" style={{ background: 'transparent' }}>{children}</div>
));
BookPage.displayName = 'BookPage';

const readFlipEnv = () => {
  if (typeof window === 'undefined') return { supported: true, spread: true, width: 1280, height: 900 };
  const w = window.innerWidth;
  const h = window.innerHeight;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  return { supported: w >= 360 && !reduced, spread: w >= 1024, width: w, height: h };
};

const useFlipEnv = () => {
  const [env, setEnv] = useState(readFlipEnv);
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setEnv(readFlipEnv()));
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return env;
};

/* ============================ CHECKOUT CTA ============================ */
const JoinButton = ({
  cycle, label, size = 'md', tone = 'light',
}: { cycle: BillingCycle; label: string; size?: 'md' | 'lg'; tone?: 'light' | 'dark' }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Create your account to activate the membership.' });
      window.location.href = '/auth';
      return;
    }
    setBusy(true);
    try {
      const url = await createBasicPlanCheckout(cycle);
      window.open(url, '_blank');
    } catch (e) {
      toast({
        title: 'Checkout unavailable',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  // High-contrast solid CTA: white text on a saturated fill in both tones.
  const fill = tone === 'dark'
    ? `linear-gradient(135deg, #0ea5b7, #0369a1)`
    : `linear-gradient(135deg, #0f766e, #0f172a)`;

  return (
    <button
      onClick={go}
      disabled={busy}
      className={`inline-flex items-center gap-3 rounded-2xl transition hover:scale-[1.03] disabled:opacity-60 ${
        size === 'lg' ? 'px-9 py-5' : 'px-7 py-4'
      }`}
      style={{
        background: fill,
        border: '1px solid rgba(255,255,255,0.35)',
        boxShadow: `0 12px 40px -12px rgba(14,165,183,0.65)`,
      }}
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin text-white" />
        : <span className="w-2 h-2 rounded-full bg-white" />}
      <span className={`font-bold tracking-[0.18em] uppercase text-white ${size === 'lg' ? 'text-lg' : 'text-base'}`}>{label}</span>
      <ArrowUpRight className="h-5 w-5 text-white" />
    </button>
  );
};

/* ============================ INLINE CHECKOUT ============================ */
/**
 * Final page checkout: billing-cycle selector + live order summary + Stripe
 * redirect. Mirrors the dark editorial styling of the closing spread.
 */

const CheckoutPanel = ({
  monthly, isMember,
}: {
  monthly: string; isMember: boolean;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Create your account to activate the membership.' });
      window.location.href = '/auth';
      return;
    }
    setBusy(true);
    try {
      const url = await createBasicPlanCheckout('monthly');
      window.open(url, '_blank');
    } catch (e) {
      toast({
        title: 'Checkout unavailable',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl p-8 w-full h-full flex flex-col" style={{
      background: 'linear-gradient(150deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
      backdropFilter: 'blur(24px) saturate(140%)',
      WebkitBackdropFilter: 'blur(24px) saturate(140%)',
      border: '1px solid rgba(255,255,255,0.28)',
      boxShadow: '0 40px 90px -35px rgba(0,0,0,0.75)',
    }}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[12px] tracking-[0.34em] uppercase text-white/60">Secure checkout</span>
        <span className="flex items-center gap-2 font-mono text-[12px] tracking-[0.28em] uppercase" style={{ color: '#6ee7b7' }}>
          <ShieldCheck className="h-4 w-4" /> Stripe
        </span>
      </div>

      <div className="mt-6 rounded-2xl px-6 py-7" style={{
        background: 'linear-gradient(140deg, rgba(103,232,249,0.22), rgba(255,255,255,0.06))',
        border: '1px solid rgba(103,232,249,0.55)',
      }}>
        <div className="font-mono text-[12px] uppercase tracking-[0.3em] text-white/70">Membership · monthly</div>
        <div className="flex items-end gap-3 mt-2">
          <span className="text-[72px] leading-none font-black text-white">{monthly}</span>
          <span className="text-white/60 mb-3 text-lg">/ month</span>
        </div>
        <div className="text-[14px] text-white/65 mt-2">Billed every month · cancel anytime</div>
      </div>

      <div className="mt-6 space-y-3 text-[15px] text-white/75">
        <div className="flex items-center justify-between">
          <span>Startup Factory Hub · Membership</span>
          <span className="font-bold text-white">{monthly}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Billing cycle</span>
          <span className="text-white/90">Monthly</span>
        </div>
        <div className="h-px w-full my-2" style={{ background: 'rgba(255,255,255,0.18)' }} />
        <div className="flex items-center justify-between text-[16px]">
          <span className="font-mono uppercase tracking-[0.22em] text-white/60">Due today</span>
          <span className="text-3xl font-black text-white">{monthly}</span>
        </div>
      </div>

      <button
        onClick={pay}
        disabled={busy || isMember}
        className="mt-auto w-full inline-flex items-center justify-center gap-3 rounded-2xl px-7 py-5 transition hover:scale-[1.02] disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, #0ea5b7, #0369a1)',
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow: '0 16px 46px -14px rgba(14,165,183,0.7)',
        }}
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <CreditCard className="h-5 w-5 text-white" />}
        <span className="font-bold tracking-[0.16em] uppercase text-white text-lg">
          {isMember ? 'Membership active' : `Pay ${monthly} · activate`}
        </span>
      </button>

      <div className="mt-3 flex items-center justify-between text-[12px] font-mono uppercase tracking-[0.2em] text-white/45">
        <span>Cancel anytime</span>
        <a href="mailto:info@startupfactoryhub.com" className="hover:text-white/80">info@startupfactoryhub.com</a>
      </div>
    </div>
  );
};




/* ============================ PAGE ============================ */
export default function BasicPlanBrochure({ embedded = false }: { embedded?: boolean }) {
  const { plan } = useBasicPlan();
  const { isMember, tier, refetch } = useMembershipAccess();
  const { toast } = useToast();
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { supported: flipSupported, spread, width, height } = useFlipEnv();

  // After returning from Stripe Checkout, re-verify the subscription so the
  // recurring membership activates immediately for this account.
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('checkout');
    if (!status) return;
    if (status === 'success') {
      toast({
        title: 'Membership activated',
        description: 'Your recurring membership is active. Renewal is charged automatically.',
      });
      let tries = 0;
      const id = window.setInterval(() => {
        tries += 1;
        refetch();
        if (tries >= 5) window.clearInterval(id);
      }, 2500);
      refetch();
      window.history.replaceState({}, '', window.location.pathname);
      return () => window.clearInterval(id);
    }
    if (status === 'cancelled') {
      toast({ title: 'Checkout cancelled', description: 'No charge was made.' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refetch, toast]);


  const pageW = spread
    ? Math.min(620, Math.floor((width - 120) / 2), Math.floor((height - 220) * (BASE_W / BASE_H)))
    : Math.min(560, width - 32);
  const pageH = Math.round(pageW * (BASE_H / BASE_W));

  const monthly = formatCents(plan.monthly_price_cents);

  const pages = (
    <>
      {/* ---------------- 01 · COVER ---------------- */}
      <BookPage>
        <A4Wrapper>
          <section className="absolute inset-0 overflow-hidden" style={{ background: '#0b1220' }}>
            <img
              src={imgSkyline}
              alt="Global financial district skyline at blue hour"
              width={1536}
              height={1024}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{
              background: `linear-gradient(180deg, rgba(8,14,26,0.55) 0%, rgba(8,14,26,0.82) 55%, rgba(8,14,26,0.95) 100%), radial-gradient(ellipse at 20% 20%, ${NEON.cyan}30 0%, transparent 60%)`,
            }} />
            <AmbientField />
            <Frame />
            <div className="absolute inset-0 z-10 flex flex-col justify-center px-16">
              <div className="font-mono text-[15px] tracking-[0.45em] uppercase mb-6" style={{ color: '#67e8f9' }}>
                Startup Factory Hub · Membership
              </div>
              <h1 className="font-black tracking-tight text-white" style={{
                fontSize: 'clamp(54px, 9vw, 96px)', lineHeight: 0.94,
                textShadow: `0 0 60px ${NEON.cyan}55`,
              }}>
                ONE<br />MEMBERSHIP.<br />
                <span style={{ color: '#67e8f9' }}>THE WHOLE<br />ECOSYSTEM.</span>
              </h1>
              <motion.div
                className="mt-8 h-[3px]"
                style={{ background: `linear-gradient(90deg, ${NEON.cyan}, transparent)`, boxShadow: `0 0 20px ${NEON.cyan}` }}
                initial={{ width: 0 }} animate={{ width: 360 }} transition={{ duration: 1.2, ease: 'easeOut' }}
              />
              <p className="mt-8 text-[23px] text-white/85 max-w-2xl leading-relaxed">
                Feed, resource map, acceleration programs, events,
                investor access, internships, volunteering and certified courses —
                unlocked with a single membership.
              </p>

              <div className="mt-10">
                <div className="inline-block rounded-2xl px-10 py-7" style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(16px)',
                }}>
                  <div className="font-mono text-[13px] tracking-[0.3em] uppercase text-white/60">Membership</div>
                  <div className="text-[72px] leading-none font-black text-white mt-1">{monthly}</div>
                  <div className="text-white/60 text-base mt-2">per month · cancel anytime</div>
                </div>
              </div>
            </div>
          </section>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 02 · ABOUT · WHERE THE ECOSYSTEM MEETS ---------------- */}
      <BookPage>
        <A4Wrapper>
          <section className="absolute inset-0 overflow-hidden" style={{
            background: '#ffffff',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}>
            {/* Giant background "02" */}
            <div
              aria-hidden
              className="absolute select-none pointer-events-none font-extrabold leading-none tracking-tighter z-0"
              style={{ top: '-8%', left: '-6%', fontSize: '780px', color: 'rgba(15,23,42,0.035)' }}
            >
              02
            </div>

            <div className="absolute inset-0 pointer-events-none z-0" style={{
              background: `radial-gradient(ellipse at 85% 10%, ${NEON.cyan}10 0%, transparent 55%), radial-gradient(ellipse at 10% 95%, ${NEON.lime}0d 0%, transparent 50%)`,
            }} />

            {/* Top HUD bar */}
            <div className="absolute top-5 left-12 right-12 flex items-center justify-between font-mono text-[16px] tracking-[0.32em] uppercase z-20">
              <div className="flex items-center gap-2" style={{ color: NEON.cyan }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON.cyan, boxShadow: `0 0 8px ${NEON.cyan}` }} />
                <span>SEC // 01 · EDITION 01</span>
              </div>
              <div className="text-slate-500">INTRODUCTION · STARTUP FACTORY HUB</div>
              <div style={{ color: NEON.cyan }}>P/02 · {TOTAL}</div>
            </div>

            {/* Bottom HUD bar */}
            <div className="absolute bottom-5 left-12 right-12 flex items-center justify-between font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase z-20">
              <span className="text-slate-900/35">// STARTUP FACTORY HUB · MEMBERSHIP PROGRAM</span>
              <span className="text-slate-900/35">GLOBAL · REMOTE + ON-SITE</span>
            </div>

            {/* MAIN CONTENT */}
            <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: '58px 56px 56px 56px' }}>
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-start justify-between mb-8"
              >
                <div className="flex items-center gap-4">
                  <div className="h-px w-16" style={{ background: NEON.cyan }} />
                  <span className="text-[16px] font-bold tracking-[0.4em] text-slate-400 uppercase">
                    Startup Factory Hub · Vol. 01 · 2026
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className="text-[44px] font-light tracking-tighter italic"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: 'rgba(15,23,42,0.18)',
                      textDecoration: 'underline',
                      textDecorationColor: NEON.lime,
                      textUnderlineOffset: '8px',
                    }}
                  >
                    P/02
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="flex-1 grid grid-cols-12 gap-0 min-h-0"
              >
                {/* LEFT — dramatic copy column */}
                <div className="col-span-7 flex flex-col justify-center pr-10 min-w-0">
                  <span className="text-[16px] font-bold tracking-[0.32em] uppercase mb-5" style={{ color: NEON.cyan }}>
                    About Startup Factory Hub
                  </span>

                  <h1 className="font-extrabold tracking-tight text-slate-900 mb-8" style={{ fontSize: '46px', lineHeight: '1.04', maxWidth: '100%' }}>
                    The Operating System<br />
                    for the Next{' '}
                    <span
                      className="font-extrabold"
                      style={{
                        background: `linear-gradient(135deg, ${NEON.cyan} 0%, ${NEON.magenta} 55%, ${NEON.lime} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      Generation
                    </span>
                    <br />
                    of Founders.
                  </h1>

                  <div className="flex gap-7">
                    <div className="shrink-0 self-stretch">
                      <div className="w-[6px] h-full rounded-full" style={{ background: `linear-gradient(180deg, ${NEON.cyan}, ${NEON.magenta}, ${NEON.lime})` }} />
                    </div>
                    <div className="max-w-[540px] py-1">
                      <p className="text-[19px] leading-[1.55] text-slate-600 font-light mb-6">
                        Startup Factory Hub is the infrastructure layer for entrepreneurship in the AI era — connecting{' '}
                        <span className="font-semibold text-slate-900">founders, investors, mentors, advisors, accelerators</span>{' '}
                        and <span className="font-semibold text-slate-900">students</span> through an integrated
                        AI-powered acceleration platform, strategic capital and a globally connected innovation network.
                      </p>
                      <div className="p-6 bg-slate-50 border-l-4" style={{ borderColor: '#0f172a' }}>
                        <p className="text-slate-900 italic font-medium leading-snug" style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px' }}>
                          "Infrastructure is the new intellectual property. The platforms that accompany the founder's journey will define the future of innovation."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT — visual + floating stats */}
                <div className="col-span-5 relative">
                  <div className="h-full w-full relative overflow-hidden" style={{ boxShadow: '0 40px 80px -30px rgba(15,23,42,0.35)' }}>
                    <img src={visionHub.url} alt="Startup Factory Hub innovation district" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{
                      background: `linear-gradient(180deg, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.55) 70%, rgba(15,23,42,0.92) 100%), radial-gradient(ellipse at 70% 20%, ${NEON.cyan}30 0%, transparent 55%)`,
                    }} />
                    <div className="absolute top-10 right-0" style={{ transform: 'rotate(90deg)', transformOrigin: 'top right' }}>
                      <span className="text-[16px] font-black tracking-[0.5em] text-white/40 uppercase whitespace-nowrap">
                        Infrastructure First
                      </span>
                    </div>
                    <div className="absolute inset-x-5 bottom-5 p-4 sm:p-5 backdrop-blur-xl border" style={{ background: 'rgba(2,6,23,0.88)', borderColor: 'rgba(255,255,255,0.1)' }}>
                      <div className="text-[12px] sm:text-[13px] font-bold tracking-[0.25em] uppercase text-slate-400 mb-3">
                        The Platform by the Numbers
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {[
                          { v: '200+', l: 'Members on the Platform', c: NEON.lime },
                          { v: '40+', l: 'Startups Accelerated', c: NEON.cyan },
                          { v: '350+', l: 'Network Members', c: NEON.magenta },
                          { v: '04', l: 'Global Hubs', c: NEON.amber },
                        ].map((s, i) => (
                          <div key={i} className="min-w-0">
                            <div className="text-white font-extrabold mb-1 whitespace-nowrap" style={{ fontSize: '18px', lineHeight: 1 }}>{s.v}</div>
                            <div className="h-[2px] w-6 mb-1.5" style={{ background: s.c }} />
                            <div className="text-[11px] sm:text-[12px] uppercase tracking-[0.12em] text-slate-400 font-bold leading-tight">{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Footer — partner ticker */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.4 }}
                className="mt-7 pt-5 border-t relative overflow-hidden"
                style={{ borderColor: 'rgba(15,23,42,0.08)' }}
              >
                <div className="absolute inset-y-0 left-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, #ffffff, transparent)' }} />
                <div className="absolute inset-y-0 right-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(270deg, #ffffff, transparent)' }} />
                <div className="flex items-center" style={{ width: 'max-content', animation: 'partners-scroll 60s linear infinite' }}>
                  {(() => {
                    const partners = [
                      { n: 'NASA', l: '/partners/nasa-logo.png' },
                      { n: 'NASA T2', l: '/partners/nasa-t2-logo.webp' },
                      { n: 'NVIDIA Inception', l: '/partners/nvidia-inception-logo.png' },
                      { n: 'Google', l: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png' },
                      { n: 'GitHub', l: '/github-logo.png' },
                      { n: 'Nasdaq', l: '/nasdaq-logo.png' },
                      { n: 'IWG', l: '/partners/iwg-logo.png' },
                      { n: 'HSBC', l: '/partners/hsbc-logo.png' },
                      { n: 'Lehigh University', l: '/lehigh-university-logo.png' },
                      { n: 'MongoDB', l: '/mongodb-logo.webp' },
                      { n: 'F6S', l: '/partners/f6s-logo.png' },
                      { n: 'TradingView', l: '/partners/tradingview-logo.png' },
                      { n: 'Lovable', l: '/partners/lovable-logo.png' },
                      { n: 'Decahedron', l: '/partners/decahedron-ventures-logo.jpg' },
                      { n: 'Flusso Capital', l: '/partners/flusso-capital-logo.png' },
                    ];
                    return [...partners, ...partners].map((p, i) => (
                      <div key={i} className="partner-logo-card flex-shrink-0 px-10 h-18 flex items-center justify-center">
                        <img
                          src={p.l}
                          alt={p.n}
                          className="max-h-16 max-w-[200px] object-contain opacity-80 grayscale hover:opacity-100 hover:grayscale-0 transition-all"
                          onError={(e) => {
                            const card = e.currentTarget.closest('.partner-logo-card') as HTMLElement | null;
                            if (card) card.style.display = 'none';
                          }}
                        />
                      </div>
                    ));
                  })()}
                </div>
              </motion.div>
            </div>
            <style>{`@keyframes partners-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
          </section>
        </A4Wrapper>
      </BookPage>



      {/* ---------------- 03 · EVENTS · WHERE THE ECOSYSTEM CONNECTS ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame accent={NEON.magenta} code="03" label="EVENTS & ACTIVATIONS" pageNum={3}>
            {/* Ghost numeral */}
            <div
              className="absolute select-none pointer-events-none font-extrabold leading-none tracking-tighter z-0"
              style={{
                top: '-8%',
                left: '-6%',
                fontSize: '780px',
                color: 'rgba(15,23,42,0.035)',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              }}
            >
              03
            </div>

            <div className="relative z-10 flex-1 min-h-0 flex flex-col">
              {/* Editorial header */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-start justify-between mb-5"
              >
                <div className="flex items-center gap-4">
                  <div className="h-px w-16" style={{ background: NEON.magenta }} />
                  <span className="text-[16px] font-bold tracking-[0.4em] text-slate-400 uppercase">
                    Events &amp; Activations · Vol. 01
                  </span>
                </div>
                <span
                  className="text-[44px] font-light tracking-tighter italic"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: 'rgba(15,23,42,0.18)',
                    textDecoration: 'underline',
                    textDecorationColor: NEON.magenta,
                    textUnderlineOffset: '8px',
                  }}
                >
                  P/03
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="font-extrabold tracking-tight text-slate-900 mb-5"
                style={{ fontSize: '46px', lineHeight: 1.04, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
              >
                Where the{' '}
                <span
                  className="font-extrabold"
                  style={{
                    background: `linear-gradient(135deg, ${NEON.magenta} 0%, ${NEON.cyan} 60%, ${NEON.lime} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  ecosystem connects.
                </span>
              </motion.h1>

              {/* Featured — editorial split */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="relative overflow-hidden shrink-0"
                style={{ height: '33%', boxShadow: '0 40px 80px -30px rgba(15,23,42,0.35)' }}
              >
                <img src={eventArtemisWatchParty} alt="Artemis 2 Watch Party AR Experience" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.72) 42%, rgba(255,255,255,0.05) 74%, transparent 100%)' }} />
                <div className="relative z-10 h-full flex gap-6 items-center px-6 max-w-[68%]">
                  <div className="shrink-0 self-stretch py-4">
                    <div className="w-[6px] h-full rounded-full" style={{ background: `linear-gradient(180deg, ${NEON.magenta}, ${NEON.cyan}, ${NEON.lime})` }} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[13px] font-bold tracking-[0.32em] uppercase" style={{ color: NEON.magenta }}>
                      Official Host · Featured
                    </span>
                    <h3
                      className="font-extrabold tracking-tight text-slate-900 leading-[1.06] mt-2"
                      style={{ fontSize: '30px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                    >
                      Artemis 2 Watch Party — AR Experience
                    </h3>
                    <p className="text-[16px] leading-[1.5] text-slate-600 font-light mt-2">
                      Startup Factory Hub is the <span className="font-semibold text-slate-900">Official Host</span> of the Artemis 2
                      Watch Party, delivering an immersive AR experience celebrating humanity's return to the Moon.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Grid of four — magazine plates */}
              <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-4 mt-4">
                {[
                  { img: eventVoyagerOsu.url, kicker: 'Pitch Competition', title: 'Voyager Technologies · Ohio State University', desc: 'High-energy pitch competition connecting startups with NASA technologies, space leaders and venture capital.', accent: NEON.cyan },
                  { img: eventLaunchingOrlando, kicker: 'Community', title: 'Startup Factory Hub Launching Party', desc: 'Founders, mentors and investors gathering for the official platform launch.', accent: NEON.magenta },
                  { img: eventLakeCounty, kicker: 'Institutional · NASA', title: 'Lake County Mayor · UCF Incubation · NASA', desc: 'Public-private collaboration expanding regional entrepreneurship and space-tech infrastructure.', accent: NEON.lime, logo: nasaLogo, logoAlt: 'NASA logo' },
                  { img: eventPlugAndPlay, kicker: 'Deal Flow', title: 'Plug and Play · Accelerator Selection Day', desc: 'Screening and selecting high-potential ventures alongside global accelerators.', accent: NEON.cyan },
                ].map((e, i) => (
                  <motion.div
                    key={e.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                    className="relative overflow-hidden min-h-0"
                    style={{ boxShadow: '0 26px 50px -26px rgba(15,23,42,0.4)' }}
                  >
                    <img src={e.img} alt={e.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 34%, rgba(255,255,255,0.9) 62%, rgba(255,255,255,0.97) 100%)' }} />
                    {e.logo && (
                      <div className="absolute top-3 right-3 z-20 bg-white/90 p-1.5 shadow-md">
                        <img src={e.logo} alt={e.logoAlt} className="h-6 w-auto object-contain" />
                      </div>
                    )}
                    <div className="relative z-10 h-full flex flex-col justify-end p-4">
                      <div className="h-[3px] w-8 mb-2" style={{ background: e.accent }} />
                      <span className="text-[11px] font-bold tracking-[0.28em] uppercase" style={{ color: e.accent }}>{e.kicker}</span>
                      <h4
                        className="font-extrabold tracking-tight text-slate-900 leading-[1.1] mt-1 break-words"
                        style={{ fontSize: '18px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                      >
                        {e.title}
                      </h4>
                      <p className="text-[13px] leading-[1.45] text-slate-600 font-light mt-1">{e.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Upcoming — editorial pull quote strip */}
              <div className="shrink-0 mt-4 flex items-center gap-5 p-5 bg-slate-50 border-l-4" style={{ borderColor: NEON.magenta }}>
                <span className="text-[11px] font-bold tracking-[0.32em] uppercase shrink-0" style={{ color: NEON.magenta }}>
                  Upcoming
                </span>
                <div className="min-w-0">
                  <p
                    className="text-slate-900 italic font-medium leading-snug"
                    style={{ fontFamily: "'Playfair Display', serif", fontSize: '19px' }}
                  >
                    "Space Symposium — Times Square XR Experience: an immersive activation showcasing space technology innovation."
                  </p>
                </div>
                <Smartphone className="h-6 w-6 shrink-0 ml-auto" style={{ color: NEON.magenta }} />
              </div>
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>


      {/* ---------------- 04 · CENTRAL FLORIDA MEMBERS CLUB ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="04" label="CENTRAL FLORIDA MEMBERS" pageNum={4} accent={NEON.amber}>
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={innovationCoffeeTable}
                alt="Central Florida founders meeting over coffee"
                width={1200}
                height={1600}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(180deg, rgba(7,18,22,0.94) 0%, rgba(7,18,22,0.58) 40%, rgba(7,18,22,0.22) 67%, rgba(7,18,22,0.94) 100%)',
                }}
              />
              <div className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${NEON.cyan}25, transparent 52%, ${NEON.amber}16)` }} />

              <div className="relative z-10 flex h-full flex-col px-12 pb-14 pt-16">
                <motion.div
                  initial={{ opacity: 0, y: -14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex items-start justify-between gap-5"
                >
                  <div className="max-w-[580px]">
                    <div className="mb-4 flex items-center gap-3 font-mono text-[14px] uppercase tracking-[0.34em]" style={{ color: '#fcd34d' }}>
                      <span className="h-px w-12" style={{ background: '#fcd34d' }} />
                      Exclusive Central Florida Members
                    </div>
                    <h2 className="text-[52px] font-black leading-[0.98] tracking-tight text-white" style={{ textShadow: '0 8px 35px rgba(0,0,0,0.55)' }}>
                      Your meeting point:<br />
                      <span style={{ color: '#fcd34d' }}>Innovation Coffee Table.</span>
                    </h2>
                  </div>

                  <div className="shrink-0 rounded-xl border border-white/25 bg-white/95 p-3 shadow-2xl">
                    <img src={foxtailLogo.url} alt="Foxtail Coffee Co." className="h-10 w-auto object-contain" />
                  </div>
                </motion.div>

                <div className="mt-auto grid grid-cols-[1.35fr_0.65fr] items-end gap-5">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.65 }}
                    className="rounded-2xl border border-white/20 bg-slate-950/75 p-6 backdrop-blur-xl"
                    style={{ boxShadow: '0 22px 55px rgba(0,0,0,0.42)' }}
                  >
                    <p className="text-[19px] font-medium leading-relaxed text-white/90">
                      A dedicated place for Central Florida members to connect, exchange ideas and build relationships over coffee at Foxtail Coffee Co. · Belle Isle.
                    </p>
                    <div className="mt-5 flex items-center gap-4 border-t border-white/15 pt-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `${NEON.amber}25`, border: `1px solid ${NEON.amber}70` }}>
                        <Coffee className="h-6 w-6" style={{ color: '#fcd34d' }} />
                      </div>
                      <div>
                        <div className="text-[24px] font-black leading-none text-white">Two coffees included</div>
                        <div className="mt-1 font-mono text-[12px] uppercase tracking-[0.25em] text-white/55">with your Members Club experience</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45, duration: 0.55 }}
                    className="rounded-2xl border border-white/20 bg-white/95 p-5 text-slate-900 shadow-2xl"
                  >
                    <BadgeCheck className="mb-4 h-8 w-8" style={{ color: NEON.cyan }} />
                    <div className="font-mono text-[12px] uppercase tracking-[0.28em]" style={{ color: NEON.cyan }}>Members Only</div>
                    <div className="mt-2 text-[22px] font-black leading-tight">A local table for a global community.</div>
                  </motion.div>
                </div>
              </div>
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>


      {/* ---------------- 05 · GLOBAL OFFICE: CONNECT WITH FOUNDERS ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="05" label="GLOBAL NETWORK" pageNum={5} accent={NEON.cyan}>
            <PageTitle
              kicker="Connect with founders everywhere"
              title={<><span style={{ color: NEON.cyan }}>A global office</span><br />without walls.</>}
              accent={NEON.cyan}
            />
            <div
              className="relative flex-1 rounded-3xl overflow-hidden"
              style={{
                border: `1px solid ${NEON.cyan}55`,
                boxShadow: `0 0 60px ${NEON.cyan}25, inset 0 0 40px rgba(0,0,0,0.5)`,
              }}
            >
              <SFHNetworkGlobe accent={NEON.cyan} />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, ${NEON.ink}10 0%, ${NEON.ink}44 48%, ${NEON.ink}f2 100%)`,
                }}
              />

              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="absolute top-6 left-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full z-10"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${NEON.cyan}55`,
                  boxShadow: '0 6px 20px rgba(2,4,10,0.35)',
                }}
              >
                <Radio className="h-3 w-3 animate-pulse" style={{ color: NEON.cyan }} />
                <span className="font-mono text-[16px] uppercase tracking-[0.3em] text-slate-900">LIVE · GLOBAL</span>
              </motion.div>

              <div className="absolute inset-0 z-10 flex flex-col justify-end p-8">
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.55 }}
                  className="text-white/80 text-lg font-medium max-w-2xl mb-8 leading-relaxed"
                >
                  Membership is not a building — it is a network. Join founders, mentors and
                  operators from 30+ countries through virtual rooms, regional meetups and
                  always-on async channels.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="grid grid-cols-3 gap-4"
                >
                  {[
                    {
                      icon: <Users className="h-6 w-6" style={{ color: NEON.cyan }} />,
                      title: 'Founder-first community',
                      body: 'Permanent rooms, weekly stand-ups and peer-led circles built for builders.',
                    },
                    {
                      icon: <MapPin className="h-6 w-6" style={{ color: NEON.cyan }} />,
                      title: 'Regional hubs',
                      body: 'In-person activations where the ecosystem gathers: NYC, Miami, Caracas, Madrid and more.',
                    },
                    {
                      icon: <Wifi className="h-6 w-6" style={{ color: NEON.cyan }} />,
                      title: 'Always connected',
                      body: 'Timezone coverage, async channels and 24/7 access to the platform.',
                    },
                  ].map((card, i) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 + i * 0.08, duration: 0.5 }}
                      className="rounded-2xl p-5"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(14px)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        boxShadow: '0 16px 40px -16px rgba(2,4,10,0.45)',
                      }}
                    >
                      <div className="mb-3">{card.icon}</div>
                      <h4 className="font-black text-white text-lg leading-tight mb-2">{card.title}</h4>
                      <p className="text-white/70 text-sm leading-snug">{card.body}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>


      {/* ---------------- 06 · SFH CAPABILITIES ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame accent={NEON.cyan} code="06" label="SFH CAPABILITIES" pageNum={6}>
            <PageTitle kicker="06 · SFH Capabilities" title={<>Global platform. <span style={{ color: NEON.cyan }}>Proven execution.</span></>} />

            <div className="relative flex-1 pl-16 flex flex-col">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute left-5 top-0 bottom-0 w-[2px] origin-top"
                style={{ background: `linear-gradient(180deg, transparent, ${NEON.cyan} 15%, ${NEON.cyan} 85%, transparent)`, boxShadow: `0 0 18px ${NEON.cyan}, 0 0 40px ${NEON.cyan}80` }}
              />
              <motion.div
                initial={{ top: '0%', opacity: 0 }}
                animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2.2, delay: 0.4, ease: 'easeInOut' }}
                className="absolute left-[14px] w-3 h-3 rounded-full"
                style={{ background: NEON.cyan, boxShadow: `0 0 24px ${NEON.cyan}, 0 0 60px ${NEON.cyan}` }}
              />

              <div className="grid grid-cols-1 gap-5 flex-1">
                {[
                  { i: CalendarDays, t: 'Events Platform', b: 'Demo days, summits and hybrid events with registration, ticketing, live streaming and immersive rooms — operated end-to-end from the platform.' },
                  { i: Award, t: 'Credibility & Brand Authority', b: 'Presence on the Nasdaq Tower in Times Square, partnerships with NVIDIA Inception and VC funds that back every program and announcement.' },
                  { i: Building2, t: 'Offices Worldwide', b: 'Access to a global network of hubs and workspaces, enabling startups to land immediately in key markets.' },
                  { i: Handshake, t: 'International Trade Channels', b: 'Established trade routes and corporate relationships that open markets and customers beyond your home market.' },
                ].map((n, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -40, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.55, delay: 0.6 + idx * 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex-1"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.6 + idx * 0.22 }}
                      className="absolute -left-[52px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full z-10"
                      style={{ background: NEON.cyan, boxShadow: `0 0 24px ${NEON.cyan}, 0 0 8px ${NEON.cyan}` }}
                    />
                    <span className="absolute -left-[58px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 animate-pulse" style={{ borderColor: `${NEON.cyan}60` }} />
                    <span className="absolute -left-[38px] top-1/2 h-px w-8" style={{ background: `linear-gradient(90deg, ${NEON.cyan}, transparent)` }} />

                    <GlassCard accent={NEON.cyan} padding="p-6" className="flex items-center gap-6 h-full relative overflow-hidden group">
                      <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: NEON.cyan }} />
                      <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: NEON.cyan }} />
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `linear-gradient(110deg, transparent 40%, ${NEON.cyan}25 50%, transparent 60%)` }} />

                      <div className="scale-125 origin-center">
                        <NeonBadge icon={n.i} color={NEON.cyan} />
                      </div>
                      <div className="flex-1 relative z-10">
                        <div className="text-[26px] font-black text-slate-900 leading-tight tracking-tight">{n.t}</div>
                        <div className="text-[17px] text-slate-900/75 mt-2 leading-relaxed">{n.b}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 relative z-10">
                        <span className="font-mono text-[16px] tracking-[0.3em] font-bold" style={{ color: NEON.cyan }}>W/{String(idx + 1).padStart(2, '0')}</span>
                        <span className="font-mono text-[17px] tracking-[0.25em] text-slate-500">VECTOR</span>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>


      {/* ---------------- 07 · WHAT WE BRING ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame accent={NEON.magenta} code="07" label="SFH CONTRIBUTION" pageNum={7}>
            <PageTitle kicker="07 · What SFH Brings" title={<>Entrepreneurial engine. <span style={{ color: NEON.magenta }}>Digital backbone.</span></>} accent={NEON.magenta} />

            <div className="relative flex-1 pr-16 flex flex-col">
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="absolute right-5 top-0 bottom-0 w-[2px] origin-top"
                style={{ background: `linear-gradient(180deg, transparent, ${NEON.magenta} 15%, ${NEON.magenta} 85%, transparent)`, boxShadow: `0 0 18px ${NEON.magenta}, 0 0 40px ${NEON.magenta}80` }}
              />
              <motion.div
                initial={{ top: '0%', opacity: 0 }}
                animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2.2, delay: 0.4, ease: 'easeInOut' }}
                className="absolute right-[14px] w-3 h-3 rounded-full"
                style={{ background: NEON.magenta, boxShadow: `0 0 24px ${NEON.magenta}, 0 0 60px ${NEON.magenta}` }}
              />

              <div className="grid grid-cols-1 gap-5 flex-1">
                {[
                  { i: Rocket, t: 'Accelerator Operations', b: 'End-to-end program design, batch management, founder support and results reporting.' },
                  { i: Brain, t: 'AI-Powered Digital Platform', b: 'A proprietary operating system for members, founders, mentors and investors. Live deal flow. Real intelligence.' },
                  { i: GraduationCap, t: 'Mentor & Expert Network', b: '150+ active mentors. 300+ investors. A directory of 1,500+ investors. A relationship-building machine.' },
                  { i: DollarSign, t: 'Investor & Capital Relationships', b: 'Curated capital pipelines and demo-day infrastructure tuned from Series A through growth stages.' },
                  { i: Users, t: 'Community Access', b: 'Plug into a curated network of founders, mentors, investors and corporate partners — built for introductions, not impressions.' },
                ].map((n, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 40, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.55, delay: 0.6 + idx * 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex-1"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.6 + idx * 0.22 }}
                      className="absolute -right-[52px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full z-10"
                      style={{ background: NEON.magenta, boxShadow: `0 0 24px ${NEON.magenta}, 0 0 8px ${NEON.magenta}` }}
                    />
                    <span className="absolute -right-[58px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 animate-pulse" style={{ borderColor: `${NEON.magenta}60` }} />
                    <span className="absolute -right-[38px] top-1/2 h-px w-8" style={{ background: `linear-gradient(270deg, ${NEON.magenta}, transparent)` }} />

                    <GlassCard accent={NEON.magenta} padding="p-6" className="flex items-center gap-6 h-full relative overflow-hidden group">
                      <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: NEON.magenta }} />
                      <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: NEON.magenta }} />
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `linear-gradient(110deg, transparent 40%, ${NEON.magenta}25 50%, transparent 60%)` }} />

                      <div className="flex flex-col items-start gap-1 relative z-10">
                        <span className="font-mono text-[16px] tracking-[0.3em] font-bold" style={{ color: NEON.magenta }}>S/{String(idx + 1).padStart(2, '0')}</span>
                        <span className="font-mono text-[17px] tracking-[0.25em] text-slate-500">MODULE</span>
                      </div>
                      <div className="flex-1 relative z-10">
                        <div className="text-[26px] font-black text-slate-900 leading-tight tracking-tight">{n.t}</div>
                        <div className="text-[17px] text-slate-900/75 mt-2 leading-relaxed">{n.b}</div>
                      </div>
                      <div className="scale-125 origin-center">
                        <NeonBadge icon={n.i} color={NEON.magenta} />
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>



      {/* ---------------- 08 · NASDAQ TOWER ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame accent={NEON.lime} code="08" label="GLOBAL VISIBILITY" pageNum={8}>
            <PageTitle kicker="Nasdaq Tower · Times Square" title={<>On the <span style={{ color: NEON.lime }}>world stage.</span></>} />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="relative flex-1 rounded-3xl overflow-hidden"
              style={{
                border: `1px solid ${NEON.lime}55`,
                boxShadow: `0 0 60px ${NEON.lime}25, inset 0 0 40px rgba(0,0,0,0.6)`,
              }}
            >
              <div className="absolute inset-0" style={{
                backgroundImage: `url(${nasdaqFeature})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }} />
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(180deg, rgba(2,4,10,0.10) 0%, rgba(255,255,255,0.55) 42%, rgba(255,255,255,0.93) 72%, rgba(255,255,255,0.97) 100%)',
              }} />
              <div className="absolute inset-0" style={{
                background: `radial-gradient(ellipse at 50% 20%, ${NEON.lime}22, transparent 60%)`,
              }} />
              <Scanlines />

              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
                className="absolute top-6 left-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full z-10"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${DEEP_LIME}55`,
                  boxShadow: '0 6px 20px rgba(2,4,10,0.35)',
                }}
              >
                <Radio className="h-3 w-3 animate-pulse" style={{ color: DEEP_LIME }} />
                <span className="font-mono text-[16px] uppercase tracking-[0.3em] text-slate-900">LIVE · TIMES SQUARE</span>
              </motion.div>

              <div className="absolute inset-x-0 bottom-0 z-10 px-8 pb-7 pt-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
                >
                  <div className="font-mono text-[16px] uppercase tracking-[0.4em] mb-3" style={{ color: DEEP_LIME }}>// FEATURED</div>
                  <h3 className="font-black leading-[1.05] mb-3" style={{ fontSize: '34px', ...PLATINUM_TITLE, textShadow: 'none' }}>
                    Startup Factory Hub<br />
                    <span style={{ color: DEEP_LIME, WebkitTextFillColor: DEEP_LIME }}>on the Nasdaq Tower</span>
                  </h3>
                  <p className="text-sm text-slate-800 leading-relaxed max-w-xl mb-4 font-medium">
                    Live broadcast in Times Square, New York — the ecosystem's brand projected on the Nasdaq Tower screen in front of millions.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.6 }}
                  className="grid grid-cols-4 gap-3"
                >
                  {[
                    { k: '350K+', l: 'Daily viewers' },
                    { k: 'NYC', l: 'Times Square' },
                    { k: 'Global', l: 'Media reach' },
                    { k: '24/7', l: 'Brand presence' },
                  ].map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.08, duration: 0.45 }}
                      className="rounded-xl px-2.5 py-2.5 min-w-0"
                      style={{
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${DEEP_LIME}35`,
                        boxShadow: '0 6px 18px rgba(2,4,10,0.18)',
                      }}
                    >
                      <div className="font-black text-base leading-none whitespace-nowrap" style={{ color: DEEP_LIME }}>{m.k}</div>
                      <div className="font-mono text-[16px] uppercase tracking-[0.12em] text-slate-700 mt-1 leading-tight break-words">{m.l}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 09 · AR EVENTS ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame accent={NEON.magenta} code="09" label="AR · IMMERSIVE" pageNum={9}>
            <PageTitle kicker="Virtual & Augmented Reality" title={<><span style={{ color: NEON.magenta }}>VR events.</span> No borders.</>} accent={NEON.magenta} />

            <div className="relative flex-1 rounded-2xl overflow-hidden" style={{ border: `1px solid ${NEON.magenta}50` }}>
              <img src={moonBackground.url} alt="Moon" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${NEON.magenta}30 0%, transparent 40%, ${NEON.cyan}30 100%), linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.82) 100%)` }} />

              <div className="absolute inset-0 flex flex-col justify-between p-8">
                <div className="flex justify-between items-start gap-6">
                  <GlassCard accent={NEON.magenta} padding="p-6" className="max-w-md">
                    <div className="flex items-center gap-3 mb-3">
                      <Scan className="h-6 w-6" style={{ color: NEON.magenta }} />
                      <span className="font-mono text-xs uppercase tracking-[0.35em] font-bold" style={{ color: NEON.magenta }}>VR · LIVE EVENTS</span>
                    </div>
                    <div className="text-base text-slate-900 leading-relaxed font-medium">
                      Members join any Startup Factory Hub event in Virtual Reality: Demo Days, investor rounds, masterclasses and talent fairs in 3D venues with avatars, holographic stages and spatial networking. Attendees join from their browser or headset — no installs, no travel.
                    </div>
                  </GlassCard>
                  <div className="font-mono text-xs uppercase tracking-[0.3em] text-right text-slate-700 font-semibold">
                    <div>GLOBAL</div>
                    <div>REMOTE + ON-SITE</div>
                    <div className="mt-1.5 text-sm" style={{ color: NEON.magenta }}>● TRACKING</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-black leading-[0.95] mb-4" style={{ fontSize: '38px', color: '#ffffff', textShadow: `0 2px 18px rgba(0,0,0,0.85), 0 0 40px ${NEON.magenta}90` }}>
                    Every membership event,<br /><span style={{ color: '#f9a8d4' }}>an immersive experience.</span>
                  </h3>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="relative rounded-2xl overflow-hidden mb-5"
                    style={{
                      height: '230px',
                      border: `1px solid ${NEON.cyan}60`,
                      boxShadow: `0 0 50px ${NEON.cyan}40, inset 0 0 30px rgba(0,0,0,0.5)`,
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
                      interaction-prompt="none"
                      auto-rotate
                      auto-rotate-delay="0"
                      rotation-per-second="20deg"
                      touch-action="none"
                      exposure="1"
                      shadow-intensity="1"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent', zIndex: 10, cursor: 'grab', touchAction: 'none' }}
                    />
                    <a
                      href={`intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(ROVER_GLB)}&mode=ar_preferred&title=NASA%20Perseverance%20Rover#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`}
                      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-[0.28em] font-bold"
                      style={{ background: NEON.cyan, color: '#0a1020', boxShadow: `0 0 24px ${NEON.cyan}` }}
                    >
                      <Smartphone className="h-4 w-4" /> Launch Google XR
                    </a>
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: `linear-gradient(135deg, ${NEON.cyan}20 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.5) 100%)`,
                      zIndex: 11,
                    }} />

                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 12 }}>
                      {[
                        'top-4 left-4 border-t-2 border-l-2',
                        'top-4 right-4 border-t-2 border-r-2',
                        'bottom-4 left-4 border-b-2 border-l-2',
                        'bottom-4 right-4 border-b-2 border-r-2',
                      ].map((cls, i) => (
                        <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: NEON.cyan, boxShadow: `0 0 10px ${NEON.cyan}` }} />
                      ))}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 animate-pulse" style={{ borderColor: NEON.cyan, boxShadow: `0 0 18px ${NEON.cyan}, inset 0 0 18px ${NEON.cyan}50` }} />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ background: NEON.cyan, boxShadow: `0 0 12px ${NEON.cyan}` }} />
                    </div>

                    <div className="absolute top-4 left-4 ml-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full pointer-events-none" style={{
                      background: 'rgba(255,255,255,0.55)',
                      backdropFilter: 'blur(6px)',
                      border: `1px solid ${NEON.cyan}70`,
                      zIndex: 12,
                    }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.cyan, boxShadow: `0 0 8px ${NEON.cyan}` }} />
                      <span className="font-mono text-[16px] uppercase tracking-[0.3em] text-slate-900 font-bold">AR · SCANNING</span>
                    </div>
                    <div className="absolute top-4 right-4 mr-10 font-mono text-[16px] uppercase tracking-[0.28em] text-slate-800 text-right font-semibold pointer-events-none" style={{ zIndex: 12 }}>
                      <div>OBJ · NASA ROVER</div>
                      <div style={{ color: NEON.cyan }}>DIST 4.3M</div>
                    </div>
                    <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between pointer-events-none" style={{ zIndex: 12 }}>
                      <div>
                        <div className="font-mono text-[16px] uppercase tracking-[0.3em] font-bold" style={{ color: NEON.cyan }}>// LIVE VIEW</div>
                        <div className="font-black leading-tight mt-1" style={{ ...PLATINUM_TITLE, fontSize: '16px', textShadow: `0 0 14px ${NEON.cyan}`, whiteSpace: 'nowrap' }}>
                          Mars Rover · Scanning
                        </div>
                      </div>
                      <div className="font-mono text-[16px] uppercase tracking-[0.3em] text-slate-700 text-right font-semibold">
                        <div>LAT −4.5°  LON 137.4°</div>
                        <div style={{ color: NEON.magenta }}>● TRACKED</div>
                      </div>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { i: Smartphone, l: 'VR Demo Day', s: '3D stage, no install required' },
                      { i: Box, l: 'Startup Pavilions', s: 'Navigable virtual booths' },
                      { i: Globe2, l: 'Global Audience', s: 'Investors joining from anywhere' },
                      { i: Sparkles, l: 'Holographic Speakers', s: 'Networking with avatars' },
                    ].map((p, i) => (
                      <GlassCard key={i} accent={NEON.magenta} padding="p-5" className="text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${NEON.magenta}80, transparent 65%)` }} />
                        <div className="relative">
                          <p.i className="h-7 w-7 mx-auto mb-2.5" style={{ color: NEON.magenta, filter: `drop-shadow(0 0 10px ${NEON.magenta})` }} />
                          <div className="font-black text-base text-slate-900 leading-tight">{p.l}</div>
                          <div className="font-mono text-[16px] uppercase tracking-[0.22em] text-slate-600 mt-1">{p.s}</div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>



      {/* ---------------- 10 · JOIN ---------------- */}
      <BookPage>
        <A4Wrapper>
          <section className="absolute inset-0 overflow-hidden" style={{ background: '#0b1220' }}>
            <img
              src={imgCampus}
              alt="Innovation campus atrium at golden hour"
              width={1536}
              height={1024}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{
              background: `linear-gradient(180deg, rgba(8,14,26,0.72) 0%, rgba(8,14,26,0.92) 100%), radial-gradient(ellipse at 80% 10%, ${NEON.cyan}33 0%, transparent 60%)`,
            }} />
            <AmbientField />
            <Frame />
            <div className="absolute inset-0 z-10 flex flex-col px-10 py-12">
              <div className="font-mono text-[13px] tracking-[0.42em] uppercase mb-3" style={{ color: '#67e8f9' }}>
                Checkout · activate access
              </div>
              <h1 className="font-black tracking-tight text-white" style={{
                fontSize: 56, lineHeight: 0.95, textShadow: `0 0 60px ${NEON.cyan}55`,
              }}>
                BECOME <span style={{ color: '#67e8f9' }}>A MEMBER</span>
              </h1>

              <div
                className="mt-5 inline-flex items-center gap-4 self-start rounded-2xl px-5 py-3.5"
                style={{
                  background: 'linear-gradient(140deg, rgba(103,232,249,0.16), rgba(255,255,255,0.05))',
                  border: '1px solid rgba(103,232,249,0.45)',
                  boxShadow: `0 12px 34px -14px rgba(14,165,183,0.55), inset 0 0 18px rgba(103,232,249,0.08)`,
                }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{
                  background: 'linear-gradient(135deg, rgba(103,232,249,0.25), rgba(103,232,249,0.05))',
                  border: '1px solid rgba(103,232,249,0.5)',
                }}>
                  <Code2 className="h-5 w-5" style={{ color: '#67e8f9' }} />
                </div>
                <div className="leading-tight">
                  <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/55">
                    Included with membership
                  </div>
                  <div className="text-white font-bold text-[17px] mt-0.5">
                    Access to our open source technologies
                  </div>
                </div>
              </div>

              <div className="mt-5 flex-1 min-h-0">
                <CheckoutPanel monthly={monthly} isMember={isMember} />
              </div>

              <div className="mt-6 flex items-center gap-5">
                <div className="p-2.5 rounded-2xl bg-white shadow-lg">
                  <QRCodeSVG value="https://startupfactoryhub.com/basic-plan" size={78} />
                </div>
                <a href="mailto:info@startupfactoryhub.com"
                  className="flex items-center gap-2 text-[15px] text-white/70 hover:text-white">
                  <Mail className="h-5 w-5" style={{ color: '#67e8f9' }} />
                  info@startupfactoryhub.com
                </a>
                <span className="ml-auto font-mono text-[12px] uppercase tracking-[0.3em]" style={{ color: '#67e8f9' }}>
                  END · TRANSMISSION
                </span>
              </div>
            </div>
          </section>
        </A4Wrapper>
      </BookPage>
    </>
  );


  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* animated ambient page background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute rounded-full"
          style={{ width: '55vw', height: '55vw', left: '-15vw', top: '-10vw', background: `radial-gradient(circle, ${NEON.cyan}1f 0%, transparent 65%)`, filter: 'blur(20px)' }}
          animate={{ x: [0, 80, -40, 0], y: [0, 60, 120, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ width: '50vw', height: '50vw', right: '-12vw', bottom: '-12vw', background: `radial-gradient(circle, ${NEON.emerald}1a 0%, transparent 65%)`, filter: 'blur(20px)' }}
          animate={{ x: [0, -70, 30, 0], y: [0, -50, -100, 0] }}
          transition={{ duration: 36, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {!embedded && <Navigation />}
      <div className={`relative ${embedded ? 'pt-2' : 'pt-24'} pb-16 px-2 sm:px-4`}>
        {/* status strip */}
        <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-center gap-3">
          <span className="px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.25em] border border-primary/30 bg-primary/10 text-primary">
            {isMember ? `Active membership · ${tier}` : 'Free account · limited access'}
          </span>
          <span className="px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.25em] border border-primary/30 bg-background/60">
            {monthly} / month
          </span>
          {!embedded && (
            <Button asChild variant="outline" size="sm">
              <Link to="/">Back to Startup Factory Hub</Link>
            </Button>
          )}
        </div>

        {flipSupported ? (
          <>
            <div className="mx-auto" style={{ width: spread ? pageW * 2 : pageW, maxWidth: '100%', touchAction: 'pan-y' }}>
              <HTMLFlipBook
                key={`${spread ? 'spread' : 'single'}-${pageW}x${pageH}`}
                ref={bookRef}
                width={pageW}
                height={pageH}
                size="fixed"
                minWidth={280}
                maxWidth={900}
                minHeight={396}
                maxHeight={1280}
                showCover={false}
                mobileScrollSupport={true}
                drawShadow={spread}
                flippingTime={spread ? 650 : 450}
                maxShadowOpacity={spread ? 0.45 : 0.2}
                usePortrait={!spread}
                startPage={0}
                startZIndex={0}
                autoSize={false}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={spread ? 120 : 90}
                showPageCorners={spread}
                disableFlipByClick={true}
                className="mx-auto"
                style={{ margin: '0 auto' }}
                onFlip={(e: any) => setCurrentPage(e.data)}
              >
                {Children.toArray((pages as any).props.children)}
              </HTMLFlipBook>
            </div>
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" onClick={() => bookRef.current?.pageFlip()?.flipPrev()}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase">
                {String(currentPage + 1).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
              </span>
              <Button variant="outline" size="icon" onClick={() => bookRef.current?.pageFlip()?.flipNext()}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="w-full max-w-[560px] md:max-w-[780px] mx-auto flex flex-col gap-4 sm:gap-6">
            {pages}
          </div>
        )}
      </div>
    </div>
  );
}
