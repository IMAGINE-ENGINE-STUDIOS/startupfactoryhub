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
  Check, ChevronLeft, ChevronRight, Mail, ArrowUpRight, Loader2,
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

const TOTAL = 8;

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
        <span className="shrink-0" style={{ color: accent }}>ANNUAL · MONTHLY OR UPFRONT</span>
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


/* ============================ PAGE ============================ */
export default function BasicPlanBrochure() {
  const { plan, entitlements, savingsPercent } = useBasicPlan();
  const { isMember, tier } = useMembershipAccess();
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { supported: flipSupported, spread, width, height } = useFlipEnv();

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
                unlocked with a single annual membership.
              </p>

              <div className="mt-10 flex flex-wrap gap-5">
                <div className="rounded-2xl px-8 py-6" style={{
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(16px)',
                }}>
                  <div className="font-mono text-[13px] tracking-[0.3em] uppercase text-white/60">Monthly</div>
                  <div className="text-[56px] leading-none font-black text-white mt-1">{monthly}</div>
                  <div className="text-white/60 text-base mt-2">per month · annual term</div>
                </div>
                <div className="rounded-2xl px-8 py-6" style={{
                  background: `linear-gradient(140deg, ${NEON.emerald}33, rgba(255,255,255,0.06))`,
                  border: `1px solid ${NEON.emerald}88`, backdropFilter: 'blur(16px)',
                }}>
                  <div className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: '#6ee7b7' }}>
                    Yearly · save {savingsPercent}%
                  </div>
                  <div className="text-[56px] leading-none font-black text-white mt-1">{yearly}</div>
                  <div className="text-white/60 text-base mt-2">{yearlyPerMonth} effective / month</div>
                </div>
              </div>

              <div className="mt-10 flex items-center gap-10 font-mono text-[14px] uppercase tracking-[0.35em] text-white/60">
                <span>GLOBAL</span>
                <span>200+ MEMBERS</span>
                <span>11 SERVICES</span>
              </div>
            </div>
          </section>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 02 · THE NEW STANDARD ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="01" label="THE NEW STANDARD" pageNum={2}>
            <PageTitle kicker="Access model" title={<>FREE TO EXPLORE.<br />MEMBER TO BUILD.</>} />
            <ImagePlate src={imgCampus} alt="Members collaborating inside a modern innovation campus" caption="Institutional campus · member workspaces" height={230} className="mb-6" />
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

      {/* ---------------- 03 · WHAT YOU UNLOCK (1/2) ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="02" label="ENTITLEMENTS" pageNum={3} accent={NEON.emerald}>
            <PageTitle kicker="What you unlock" title={<>{entitlements.length} SERVICES,<br />ONE MEMBERSHIP</>} accent={NEON.emerald} />
            <ImagePlate src={imgLab} alt="Engineers working in an advanced research laboratory" caption="Open-source technology · engineering resources" accent={NEON.emerald} height={200} className="mb-5" />
            <div className="grid grid-cols-2 gap-4 flex-1 content-start">
              {entitlements.slice(0, 6).map((e: Entitlement, i) => (
                <GlassCard key={e.key} accent={NEON.emerald} padding="p-5">
                  <div className="flex items-start gap-4">
                    <IndexPlate n={i + 1} color={NEON.emerald} />
                    <div>
                      <div className="text-[19px] font-black text-slate-900 leading-tight">{e.label}</div>
                      <p className="text-[15px] text-slate-600 leading-snug mt-1.5">{e.description}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 04 · WHAT YOU UNLOCK (2/2) ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="03" label="ENTITLEMENTS" pageNum={4} accent={NEON.emerald}>
            <PageTitle kicker="What you unlock" title={<>CAREER, CAMPUS<br />& TECHNOLOGY</>} accent={NEON.emerald} />
            <div className="grid grid-cols-2 gap-4 content-start">
              {entitlements.slice(6).map((e: Entitlement, i) => (
                <GlassCard key={e.key} accent={NEON.emerald} padding="p-5">
                  <div className="flex items-start gap-4">
                    <IndexPlate n={i + 7} color={NEON.emerald} />
                    <div>
                      <div className="text-[19px] font-black text-slate-900 leading-tight">{e.label}</div>
                      <p className="text-[15px] text-slate-600 leading-snug mt-1.5">{e.description}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-7">
              <RadialStat value="11" label="Services unlocked" pct={1} color={NEON.emerald} />
              <RadialStat value="200" suffix="+" label="Active members" pct={0.82} color={NEON.cyan} />
              <RadialStat value="24" suffix="/7" label="Global access" pct={0.95} color={NEON.blue} />
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 05 · PRICING ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="04" label="COMMERCIAL MODEL" pageNum={5}>
            <PageTitle kicker="Annual membership" title={<>PAY MONTHLY<br />OR SAVE {savingsPercent}%</>} />
            <div className="grid grid-cols-2 gap-6">
              <GlassCard accent={NEON.cyan} padding="p-8">
                <div className="font-mono text-[13px] tracking-[0.32em] uppercase text-slate-500 mb-4">
                  Option A · Monthly
                </div>
                <div className="flex items-end gap-3">
                  <span className="font-black text-slate-900" style={{ fontSize: 96, lineHeight: 0.85 }}>{monthly}</span>
                  <span className="text-slate-500 mb-3 text-xl">/ mo</span>
                </div>
                <div className="mt-4 text-[17px] text-slate-600">{yearlyIfMonthly} per year · 12 installments</div>
                <ul className="mt-6 space-y-3 text-[17px] text-slate-700">
                  <li className="flex gap-2"><Check className="h-5 w-5 mt-0.5" style={{ color: NEON.cyan }} />Annual term, billed monthly</li>
                  <li className="flex gap-2"><Check className="h-5 w-5 mt-0.5" style={{ color: NEON.cyan }} />Full access from day one</li>
                  <li className="flex gap-2"><Check className="h-5 w-5 mt-0.5" style={{ color: NEON.cyan }} />Secure card payment</li>
                </ul>
              </GlassCard>

              <GlassCard accent={NEON.emerald} padding="p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-mono text-[13px] tracking-[0.32em] uppercase text-slate-500">
                    Option B · Annual
                  </div>
                  <span className="px-3 py-1.5 rounded-full text-[13px] font-black tracking-[0.18em]" style={{
                    background: `${NEON.emerald}18`, color: NEON.emerald, border: `1px solid ${NEON.emerald}55`,
                  }}>−{savingsPercent}%</span>
                </div>
                <div className="flex items-end gap-3">
                  <span className="font-black text-slate-900" style={{ fontSize: 96, lineHeight: 0.85 }}>{yearly}</span>
                  <span className="text-slate-500 mb-3 text-xl">/ yr</span>
                </div>
                <div className="mt-4 text-[17px] text-slate-600">
                  {yearlyPerMonth} effective per month
                </div>
                <ul className="mt-6 space-y-3 text-[17px] text-slate-700">
                  <li className="flex gap-2"><Check className="h-5 w-5 mt-0.5" style={{ color: NEON.emerald }} />One payment, full year of access</li>
                  <li className="flex gap-2"><Check className="h-5 w-5 mt-0.5" style={{ color: NEON.emerald }} />Best value for founders and teams</li>
                  <li className="flex gap-2"><Check className="h-5 w-5 mt-0.5" style={{ color: NEON.emerald }} />Priority onboarding</li>
                </ul>
              </GlassCard>
            </div>

            <GlassCard className="mt-6" padding="p-7">
              <div className="font-mono text-[13px] tracking-[0.3em] uppercase text-slate-500 mb-5">
                Cost comparison · one year
              </div>
              <SavingsChart
                monthlyTotal={monthlyTotalCents}
                yearlyTotal={plan.yearly_price_cents}
                savingsPercent={savingsPercent}
              />
            </GlassCard>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <JoinButton cycle="monthly" label="Join monthly" size="lg" />
              <JoinButton cycle="yearly" label={`Join yearly · −${savingsPercent}%`} size="lg" />
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 06 · HOW IT WORKS ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="05" label="ONBOARDING" pageNum={6}>
            <PageTitle kicker="How it works" title={<>FOUR STEPS<br />TO FULL ACCESS</>} />
            <ImagePlate src={imgSummit} alt="Founder presenting at an investor summit" caption="Pitch events · investor access" height={210} className="mb-6" />
            <div className="space-y-4 flex-1">
              {[
                { t: 'Create your account', d: 'Sign up free and complete your founder, investor, mentor or student profile.' },
                { t: 'Activate the membership', d: 'Choose monthly or annual billing and complete the secure checkout.' },
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

      {/* ---------------- 07 · FAQ ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="06" label="QUESTIONS" pageNum={7} accent={NEON.blue}>
            <PageTitle kicker="FAQ" title="GOOD TO KNOW" accent={NEON.blue} />
            <div className="grid grid-cols-1 gap-4">
              {[
                { q: 'Is the membership annual?', a: `Yes. The membership runs for a full year. You can pay it monthly (${monthly}/mo) or upfront (${yearly}) with a ${savingsPercent}% discount.` },
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

      {/* ---------------- 08 · JOIN ---------------- */}
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
            <div className="absolute inset-0 z-10 flex flex-col justify-center px-16">
              <div className="font-mono text-[15px] tracking-[0.45em] uppercase mb-5" style={{ color: '#67e8f9' }}>
                Join the hub
              </div>
              <h1 className="font-black tracking-tight text-white" style={{
                fontSize: 'clamp(52px, 8vw, 88px)', lineHeight: 0.95,
                textShadow: `0 0 60px ${NEON.cyan}55`,
              }}>
                BECOME<br /><span style={{ color: '#67e8f9' }}>A MEMBER</span>
              </h1>
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="rounded-2xl px-7 py-5" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.24)' }}>
                  <div className="text-[44px] font-black text-white leading-none">{monthly}</div>
                  <div className="font-mono text-[12px] uppercase tracking-[0.28em] text-white/60 mt-2">per month</div>
                </div>
                <div className="rounded-2xl px-7 py-5" style={{ background: `linear-gradient(140deg, ${NEON.emerald}33, rgba(255,255,255,0.06))`, border: `1px solid ${NEON.emerald}77` }}>
                  <div className="text-[44px] font-black text-white leading-none">{yearly}</div>
                  <div className="font-mono text-[12px] uppercase tracking-[0.28em] mt-2" style={{ color: '#6ee7b7' }}>per year · −{savingsPercent}%</div>
                </div>
              </div>
              <div className="mt-9 flex items-center gap-6">
                <div className="p-3 rounded-2xl bg-white shadow-lg">
                  <QRCodeSVG value="https://startupfactoryhub.com/basic-plan" size={112} />
                </div>
                <div className="space-y-4">
                  <JoinButton cycle="yearly" label="Activate membership" size="lg" tone="dark" />
                  <a href="mailto:info@startupfactoryhub.com"
                    className="flex items-center gap-2 text-base text-white/70 hover:text-white">
                    <Mail className="h-5 w-5" style={{ color: '#67e8f9' }} />
                    info@startupfactoryhub.com
                  </a>
                </div>
              </div>
              <div className="mt-12 h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${NEON.cyan}66, transparent)` }} />
              <div className="mt-3 flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.3em]">
                <span className="text-white/50">// startupfactoryhub.com</span>
                <span style={{ color: '#67e8f9' }}>END · TRANSMISSION</span>
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

      <Navigation />
      <div className="relative pt-24 pb-16 px-2 sm:px-4">
        {/* status strip */}
        <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-center gap-3">
          <span className="px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.25em] border border-primary/30 bg-primary/10 text-primary">
            {isMember ? `Active membership · ${tier}` : 'Free account · limited access'}
          </span>
          <span className="px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.25em] border border-primary/30 bg-background/60">
            {monthly}/mo · {yearly}/yr −{savingsPercent}%
          </span>
          <Button asChild variant="outline" size="sm">
            <Link to="/">Back to Startup Factory Hub</Link>
          </Button>
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
