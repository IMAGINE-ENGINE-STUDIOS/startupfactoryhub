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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBasicPlan, formatCents } from '@/features/basic-plan/hooks/useBasicPlan';
import { useMembershipAccess } from '@/features/basic-plan/hooks/useMembershipAccess';
import { createBasicPlanCheckout } from '@/features/basic-plan/api/basicPlanApi';
import type { BillingCycle, Entitlement } from '@/features/basic-plan/types';

import imgCampus from '@/assets/membership/campus-atrium.jpg';
import imgSummit from '@/assets/membership/investor-summit.jpg';
import imgLab from '@/assets/membership/research-lab.jpg';
import imgSkyline from '@/assets/membership/global-skyline.jpg';
import imgCompute from '@/assets/membership/ai-compute-dealflow.jpg';
import imgMarkets from '@/assets/membership/public-markets-dealflow.jpg';
import imgSpace from '@/assets/membership/space-tech-dealflow.jpg';
import imgStudio from '@/assets/membership/venture-studio.jpg';
import nasdaqFeature from '@/assets/nasdaq-feature.jpg';

/* ============================ DESIGN TOKENS ============================ */
const NEON = {
  cyan: '#0ea5b7',
  blue: '#1f2a44',
  emerald: '#059669',
  ink: '#0f172a',
};

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
/** Animated comparison bars: 12 monthly installments vs annual upfront. */
const SavingsChart = ({
  monthlyTotal, yearlyTotal, savingsPercent,
}: { monthlyTotal: number; yearlyTotal: number; savingsPercent: number }) => {
  const ratio = monthlyTotal > 0 ? yearlyTotal / monthlyTotal : 1;
  const rows = [
    { label: '12 monthly installments', value: monthlyTotal, pct: 1, color: NEON.cyan },
    { label: 'One annual payment', value: yearlyTotal, pct: ratio, color: NEON.emerald },
  ];
  return (
    <div className="space-y-5">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between mb-2">
            <span className="font-mono text-[13px] uppercase tracking-[0.26em] text-slate-500">{r.label}</span>
            <span className="text-2xl font-black text-slate-900">{formatCents(r.value)}</span>
          </div>
          <div className="h-6 rounded-full overflow-hidden" style={{ background: 'rgba(15,23,42,0.06)' }}>
            <motion.div
              className="h-full rounded-full relative"
              style={{ background: `linear-gradient(90deg, ${r.color}, ${r.color}88)`, boxShadow: `0 0 24px ${r.color}55` }}
              initial={{ width: 0 }}
              animate={{ width: `${r.pct * 100}%` }}
              transition={{ duration: 1.1, delay: 0.25 + i * 0.2, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
      <div className="font-mono text-[14px] uppercase tracking-[0.24em]" style={{ color: NEON.emerald }}>
        You keep {savingsPercent}% · {formatCents(monthlyTotal - yearlyTotal)} saved per year
      </div>
    </div>
  );
};

/** Animated radial gauge used for value metrics. */
const RadialStat = ({
  value, suffix = '', label, color = NEON.cyan, pct,
}: { value: string; suffix?: string; label: string; color?: string; pct: number }) => {
  const R = 46;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-[120px] h-[120px]">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="10" />
          <motion.circle
            cx="60" cy="60" r={R} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - pct) }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[26px] font-black text-slate-900">{value}<span className="text-[16px]">{suffix}</span></span>
        </div>
      </div>
      <div className="mt-2 font-mono text-[12px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
    </div>
  );
};

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
/**
 * Rotating editorial imagery pool used by the entitlement tiles so every
 * service gets its own photographic plate instead of a flat glass card.
 */
const TILE_IMAGES = [imgLab, imgStudio, imgSummit, imgCompute, imgMarkets, imgSpace, imgCampus, imgSkyline];

/**
 * Entitlement tile — editorial dark plate with a duotone photograph, an
 * oversized ghost numeral and a hover sweep (modern, imagery-led register).
 */
const EntitlementTile = ({
  n, label, description, accent = NEON.emerald, delay = 0,
}: { n: number; label: string; description: string; accent?: string; delay?: number }) => {
  const img = TILE_IMAGES[(n - 1) % TILE_IMAGES.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      whileHover={{ y: -6 }}
      className="h-full group relative overflow-hidden rounded-2xl"
      style={{
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: `0 26px 50px -28px rgba(15,23,42,0.55), 0 0 0 1px ${accent}22`,
      }}
    >
      <img
        src={img}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover scale-105 transition-transform duration-[1200ms] group-hover:scale-110"
      />
      <div className="absolute inset-0" style={{
        background: `linear-gradient(135deg, ${NEON.ink}f2 0%, ${NEON.ink}e0 52%, ${accent}55 100%)`,
      }} />
      <div className="absolute inset-0 opacity-[0.35]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 4px)',
      }} />
      <span className="absolute -top-3 right-3 font-mono font-black leading-none select-none pointer-events-none"
        style={{ fontSize: 86, color: 'rgba(255,255,255,0.10)' }}>
        {String(n).padStart(2, '0')}
      </span>
      <div className="relative p-5 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
          <span className="font-mono text-[11px] uppercase tracking-[0.34em]" style={{ color: accent }}>
            {String(n).padStart(2, '0')} · Service
          </span>
        </div>
        <div className="text-[19px] font-black text-white leading-tight">{label}</div>
        <p className="text-[14.5px] text-white/70 leading-snug mt-2">{description}</p>
        <motion.span
          className="mt-auto pt-4 block h-[2px] rounded-full"
          style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
          initial={{ width: 0 }}
          animate={{ width: '60%' }}
          transition={{ duration: 0.9, delay: delay + 0.2, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
};

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
  const { plan, entitlements, savingsPercent } = useBasicPlan();
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
  const yearly = formatCents(plan.yearly_price_cents);
  const yearlyPerMonth = formatCents(Math.round(plan.yearly_price_cents / 12));
  const monthlyTotalCents = plan.monthly_price_cents * 12;
  const yearlyIfMonthly = formatCents(monthlyTotalCents);

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
                Feed, resource map, open-source technology, acceleration programs, events,
                investor access, internships, volunteering, technology transfer and certified courses —
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
          <PageFrame code="01" label="ABOUT" pageNum={2}>
            <PageTitle kicker="About" title={<>WHERE THE<br />ECOSYSTEM MEETS</>} />
            <ImagePlate src={imgCampus} alt="Founders, investors and mentors meeting inside the Startup Factory Hub campus" caption="Founders · investors · mentors · institutions" height={240} className="mb-6" />
            <p className="text-[18px] text-slate-700 leading-relaxed mb-6">
              Startup Factory Hub is the meeting point of the innovation ecosystem: founders,
              investors, mentors, corporations, universities and public institutions working on one
              platform. Everything that usually lives in separate rooms — capital, talent, technology
              and programs — happens in the same place.
            </p>
            <div className="grid grid-cols-2 gap-5 flex-1 content-start">
              {[
                { t: 'Founders & startups', d: 'Publish, raise, apply to programs and find the team, tools and technology to build.' },
                { t: 'Investors & funds', d: 'Curated dealflow, pitch events and direct conversations with the founders behind them.' },
                { t: 'Mentors & advisors', d: 'Certified programs, sessions and advisory tracks with startups worldwide.' },
                { t: 'Institutions & corporates', d: 'Technology transfer, acceleration partnerships and access to global innovation talent.' },
              ].map((c, i) => (
                <GlassCard key={c.t} accent={i % 2 ? NEON.emerald : NEON.cyan}>
                  <div className="flex items-start gap-4">
                    <IndexPlate n={i + 1} color={i % 2 ? NEON.emerald : NEON.cyan} />
                    <div>
                      <div className="text-[21px] font-black text-slate-900 leading-tight">{c.t}</div>
                      <p className="text-[16px] text-slate-600 leading-snug mt-1.5">{c.d}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 03 · THE NEW STANDARD ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="02" label="THE NEW STANDARD" pageNum={3}>
            <PageTitle kicker="Access model" title={<>FREE TO EXPLORE.<br />MEMBER TO BUILD.</>} />
            <ImagePlate src={imgStudio} alt="Members collaborating inside a modern innovation campus" caption="Institutional campus · member workspaces" height={230} className="mb-6" />
            <p className="text-[18px] text-slate-700 leading-relaxed mb-6">
              Startup Factory Hub is a membership platform. Anyone can create an account and
              browse the ecosystem — publishing, applying, contacting investors and enrolling
              are reserved for members.
            </p>
            <div className="grid grid-cols-2 gap-5 flex-1">
              <GlassCard accent="#94a3b8">
                <div className="flex items-center gap-3 mb-4">
                  <IndexPlate n="00" color="#94a3b8" />
                  <div>
                    <div className="font-mono text-[12px] tracking-[0.3em] uppercase text-slate-500">Tier 00</div>
                    <div className="text-[24px] font-black text-slate-900 leading-tight">Free account</div>
                  </div>
                </div>
                <ul className="space-y-3 text-[17px] text-slate-600">
                  {['Browse the community feed', 'View the global resource map', 'Read public program pages', 'Discover events and members'].map(t => (
                    <li key={t} className="flex gap-2"><Check className="h-5 w-5 mt-0.5 text-slate-400 shrink-0" />{t}</li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t border-slate-200 text-[15px] text-slate-500">
                  Read-only. Publishing, applications, investor contact and enrollment are locked.
                </div>
              </GlassCard>

              <GlassCard accent={NEON.cyan}>
                <div className="flex items-center gap-3 mb-4">
                  <IndexPlate n="01" />
                  <div>
                    <div className="font-mono text-[12px] tracking-[0.3em] uppercase" style={{ color: NEON.cyan }}>Tier 01+</div>
                    <div className="text-[24px] font-black text-slate-900 leading-tight">Member</div>
                  </div>
                </div>
                <ul className="space-y-3 text-[17px] text-slate-700">
                  {['Post in the feed and on the resource map', 'Apply to acceleration & MVP programs', 'Contact investors directly', 'Attend meetings, conferences and pitch events', 'Internships, volunteering & technology transfer', 'Certified courses and member pricing'].map(t => (
                    <li key={t} className="flex gap-2"><Check className="h-5 w-5 mt-0.5 shrink-0" style={{ color: NEON.emerald }} />{t}</li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t border-slate-200 text-[15px] text-slate-600">
                  Included in Basic — and in every higher paid membership.
                </div>
              </GlassCard>
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 04 · WHAT YOU UNLOCK (ALL SERVICES) ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="03" label="ENTITLEMENTS" pageNum={4} accent={NEON.emerald}>
            <PageTitle kicker="What you unlock" title={<>{entitlements.length} SERVICES,<br />ONE MEMBERSHIP</>} accent={NEON.emerald} />
            <div className="grid grid-cols-3 gap-3.5 flex-1 content-start">
              {entitlements.map((e: Entitlement, i) => (
                <EntitlementTile key={e.key} n={i + 1} label={e.label} description={e.description} delay={i * 0.04} />
              ))}
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 05 · PRICING ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="04" label="COMMERCIAL MODEL" pageNum={5}>
            <PageTitle kicker="Membership" title={<>ONE PRICE.<br />{monthly} / MONTH.</>} />
            <ImagePlate src={imgSummit} alt="Members at a Startup Factory Hub summit" caption="Everything included · one monthly price" height={200} className="mb-6" />
            <GlassCard accent={NEON.cyan} padding="p-9" className="flex-1">
              <div className="font-mono text-[13px] tracking-[0.32em] uppercase text-slate-500 mb-4">
                Startup Factory Hub · Membership
              </div>
              <div className="flex items-end gap-3">
                <span className="font-black text-slate-900" style={{ fontSize: 120, lineHeight: 0.85 }}>{monthly}</span>
                <span className="text-slate-500 mb-4 text-2xl">/ month</span>
              </div>
              <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3.5 text-[17px] text-slate-700">
                {[
                  'All member services unlocked',
                  'Billed monthly · cancel anytime',
                  'Full access from day one',
                  'Secure card payment with Stripe',
                  'Events, programs and courses included',
                  'Same price worldwide',
                ].map(t => (
                  <li key={t} className="flex gap-2"><Check className="h-5 w-5 mt-0.5 shrink-0" style={{ color: NEON.cyan }} />{t}</li>
                ))}
              </ul>
              <div className="mt-9">
                <JoinButton cycle="monthly" label={`Join for ${monthly} / month`} size="lg" />
              </div>
            </GlassCard>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 06 · NASDAQ TOWER ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="05" label="GLOBAL VISIBILITY" pageNum={6}>
            <PageTitle kicker="Nasdaq Tower · Times Square" title={<>FEATURED ON THE<br />WORLD&apos;S STAGE</>} />
            <div className="relative flex-1 rounded-3xl overflow-hidden" style={{
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: `0 30px 70px -30px rgba(15,23,42,0.45), 0 0 0 1px ${NEON.cyan}22`,
            }}>
              <img
                src={nasdaqFeature}
                alt="Startup Factory Hub featured on the NASDAQ Tower in Times Square, New York City"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(180deg, rgba(8,14,26,0.15) 0%, rgba(8,14,26,0.55) 50%, rgba(8,14,26,0.96) 100%)',
              }} />
              <div className="absolute top-6 left-6 inline-flex items-center gap-2 px-4 py-2 rounded-full z-10" style={{
                background: 'rgba(8,14,26,0.65)', backdropFilter: 'blur(8px)', border: `1px solid ${NEON.cyan}70`,
              }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#67e8f9', boxShadow: '0 0 10px #67e8f9' }} />
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-white">Live · Times Square</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 z-10 p-9">
                <div className="font-mono text-[12px] uppercase tracking-[0.4em] mb-3" style={{ color: '#67e8f9' }}>// Featured</div>
                <h3 className="font-black leading-[1.05] text-white mb-4" style={{ fontSize: 44, textShadow: '0 2px 14px rgba(0,0,0,0.9)' }}>
                  Startup Factory Hub<br />
                  <span style={{ color: '#67e8f9' }}>on the Nasdaq Tower</span>
                </h3>
                <p className="text-[17px] text-white/85 leading-relaxed max-w-xl">
                  Members build inside a brand already broadcast to Times Square — global visibility
                  your startup inherits from the day you join.
                </p>
              </div>
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 07 · AR EVENTS ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="06" label="AR EVENTS" pageNum={7} accent={NEON.emerald}>
            <PageTitle kicker="Augmented reality" title={<>AR EVENTS,<br />NO BORDERS</>} accent={NEON.emerald} />
            <ImagePlate src={imgSpace} alt="Immersive augmented reality event stage" caption="Immersive stages · spatial networking" accent={NEON.emerald} height={230} className="mb-6" />
            <p className="text-[18px] text-slate-700 leading-relaxed mb-6">
              Members join Startup Factory Hub events in augmented reality: demo days, masterclasses,
              investor rounds and exhibitions rendered as 3D scenes you can walk through from a browser
              or a headset. No installs, no travel.
            </p>
            <div className="grid grid-cols-2 gap-5 content-start">
              {[
                { t: 'AR demo days', d: 'Present your product as an interactive 3D model investors can inspect from any device.' },
                { t: 'Immersive conferences', d: 'Keynotes and panels on virtual stages with live audio and spatial networking rooms.' },
                { t: 'AR resource drops', d: 'Place technology, launches and opportunities on the world map and open them in AR.' },
                { t: 'Global attendance', d: 'Every session is remote-first and recorded, so members join from any time zone.' },
              ].map((c, i) => (
                <GlassCard key={c.t} accent={NEON.emerald}>
                  <div className="flex items-start gap-4">
                    <IndexPlate n={i + 1} color={NEON.emerald} />
                    <div>
                      <div className="text-[20px] font-black text-slate-900 leading-tight">{c.t}</div>
                      <p className="text-[16px] text-slate-600 leading-snug mt-1.5">{c.d}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 08 · HOW IT WORKS ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="07" label="ONBOARDING" pageNum={8}>
            <PageTitle kicker="How it works" title={<>FOUR STEPS<br />TO FULL ACCESS</>} />
            <ImagePlate src={imgMarkets} alt="Founder presenting at an investor summit" caption="Pitch events · investor access" height={210} className="mb-6" />
            <div className="space-y-4 flex-1">
              {[
                { t: 'Create your account', d: 'Sign up free and complete your founder, investor, mentor or student profile.' },
                { t: 'Activate the membership', d: `Pay ${monthly} per month through the secure checkout.` },
                { t: 'Everything unlocks instantly', d: 'Posting, map publishing, program applications, investor contact and courses go live.' },
                { t: 'Grow inside the ecosystem', d: 'Join events, apply to programs, hire and get hired, transfer technology and earn certifications.' },
              ].map((s, i) => (
                <GlassCard key={s.t} padding="p-5">
                  <div className="flex items-start gap-5">
                    <IndexPlate n={i + 1} />
                    <div>
                      <div className="text-[21px] font-black text-slate-900">{s.t}</div>
                      <p className="text-[16px] text-slate-600 leading-snug mt-1">{s.d}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 09 · FAQ ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="08" label="QUESTIONS" pageNum={9} accent={NEON.blue}>
            <PageTitle kicker="FAQ" title="GOOD TO KNOW" accent={NEON.blue} />
            <div className="grid grid-cols-1 gap-4">
              {[
                { q: 'How much is the membership?', a: `${monthly} per month, billed monthly. You can cancel anytime from your dashboard.` },
                { q: 'What happens to my free account?', a: 'Nothing is deleted. You keep browsing access; publishing, applying and investor contact stay locked until you activate a membership.' },
                { q: 'Do higher memberships include this?', a: 'Yes. Every paid membership includes the full list of services in this brochure.' },
                { q: 'Can my whole team join?', a: 'Yes. Each member holds an individual account; contact us for team onboarding.' },
                { q: 'How do I pay?', a: 'Secure card checkout through Stripe. Invoices are available on request for organizations.' },
              ].map(f => (
                <GlassCard key={f.q} accent={NEON.blue} padding="p-5">
                  <div className="text-[19px] font-black text-slate-900">{f.q}</div>
                  <p className="text-[16px] text-slate-600 leading-snug mt-1.5">{f.a}</p>
                </GlassCard>
              ))}
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

              <div className="mt-6 flex-1 min-h-0">
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
