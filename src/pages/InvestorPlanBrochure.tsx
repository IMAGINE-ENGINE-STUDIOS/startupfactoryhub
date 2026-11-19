/**
 * /investor-plan (alias /investor-priority) — Investor Priority brochure.
 *
 * Magazine editorial flipbook in the partners brochure (/forpartners)
 * register: A4 pages, serif display titles, institutional photography,
 * platinum titles, glass cards and animated data visuals. 13 pages: the
 * partners pages (Operating System, Events, Lava capability matrix,
 * growth tree) plus the investor value proposition — Investor Priority
 * entitlements and the Standard Program Valuation page (P.10): a signed
 * investor invests $25K–$250K into a Hub-built startup at the standard
 * 10% position, split 70% investor / 30% Startup Factory Hub. Dealflow is
 * the Hub's own startups — no external sourcing claims.
 *
 * Pricing: $500 / month or $5,000 / year. Prices and benefits are read live
 * from public.subscription_plan_config (key = 'investor') via the
 * investor-plan feature module; Stripe checkout is resolved server-side.
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
import { useBrochureLiveBridge } from '@/lib/brochureLive';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import {
  Check, ChevronLeft, ChevronRight, Mail, ArrowUpRight, Loader2, ShieldCheck, CreditCard,
  Building2, Globe2, Handshake, Award, Users, MapPin, Briefcase, Rocket, Brain,
  GraduationCap, DollarSign, Lightbulb, BarChart3, Cpu, TrendingUp, Smartphone,
} from 'lucide-react';
import GrowthSection from '@/components/brochure/GrowthSection';
import type { GrowthBenefit } from '@/components/brochure/GrowthSection';
import sfhLogo from '@/assets/sfh-logo-combined.png';
import visionHub from '@/assets/wtc-vision-hub-future.jpg.asset.json';
import eventArtemisWatchParty from '@/assets/event-artemis-watch-party.png';
import eventVoyagerOsu from '@/assets/event-voyager-osu.jpg.asset.json';
import eventLaunchingOrlando from '@/assets/event-launching-orlando.jpg';
import eventLakeCounty from '@/assets/event-lake-county.jpg';
import nasaLogo from '@/assets/nasa-logo.png';
import issSpaceStation from '@/assets/iss-space-station.jpg';
import spaceEventBg from '@/assets/space-event-bg.png';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useInvestorPlan, formatCents } from '@/features/investor-plan/hooks/useInvestorPlan';
import { createInvestorPlanCheckout } from '@/features/investor-plan/api/investorPlanApi';
import type { InvestorBillingCycle, InvestorBenefit } from '@/features/investor-plan/types';

import imgCampus from '@/assets/membership/campus-atrium.jpg';
import imgSummit from '@/assets/membership/investor-summit.jpg';
import imgLab from '@/assets/membership/research-lab.jpg';
import imgSkyline from '@/assets/membership/global-skyline.jpg';
import imgCompute from '@/assets/membership/ai-compute-dealflow.jpg';
import imgMarkets from '@/assets/membership/public-markets-dealflow.jpg';
import imgSpace from '@/assets/membership/space-tech-dealflow.jpg';
import imgStudio from '@/assets/membership/venture-studio.jpg';

/* ============================ DESIGN TOKENS ============================ */
const NEON = {
  cyan: '#0ea5b7',
  blue: '#1f2a44',
  magenta: '#1f2a44',
  lime: '#10b981',
  amber: '#0d9488',
  emerald: '#059669',
  ink: '#0f172a',
  gold: '#c9a227',
  goldSoft: '#e7c65a',
};

/** Editorial serif display stack — the partners brochure's magazine voice. */
const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };

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

/** Total pages in the flipbook. */
const TOTAL = 13;

/** Venture studio activities — what the Hub does before a deal reaches you. */
const STUDIO_ACTIVITIES = [
  { t: 'Company building', d: 'Ideas validated, incorporated and staffed inside the studio before any round opens.' },
  { t: 'MVP engineering', d: 'Product built in 4-week sprints with the Hub engineering pool and AI tooling.' },
  { t: 'Go-to-market', d: 'First customers, pricing and pipeline tested with corporate partners.' },
  { t: 'Round structuring', d: 'Cap table, data room and terms prepared with the Hub before investor introductions.' },
] as const;

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

const PageTitle = ({ kicker, title, accent = NEON.cyan, serif }: { kicker: string; title: React.ReactNode; accent?: string; serif?: boolean }) => (
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
      ...(serif ? { ...SERIF, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.06 } : null),
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
        <span className="text-slate-500 truncate">Startup Factory Hub · Investor Priority</span>
        <span className="shrink-0" style={{ color: accent }}>MONTHLY OR ANNUAL</span>
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

/**
 * Rotating editorial imagery pool used by the entitlement tiles so every
 * benefit gets its own photographic plate instead of a flat glass card.
 */
const TILE_IMAGES = [imgLab, imgStudio, imgSummit, imgCompute, imgMarkets, imgSpace, imgCampus, imgSkyline];

/**
 * Entitlement tile — editorial dark plate with a duotone photograph, an
 * oversized ghost numeral and a hover sweep. Replaces the previous white
 * glass + icon-badge card for a more modern, original register.
 */
const BenefitCard = ({
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
        backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 4px)`,
      }} />

      <span className="absolute -top-3 right-3 font-mono font-black leading-none select-none pointer-events-none"
        style={{ fontSize: 86, color: 'rgba(255,255,255,0.10)' }}>
        {String(n).padStart(2, '0')}
      </span>

      <div className="relative p-5 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
          <span className="font-mono text-[11px] uppercase tracking-[0.34em]" style={{ color: accent }}>
            {String(n).padStart(2, '0')} · Entitlement
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


/* =========================================================================
   LAVA CAPABILITY MATRIX — interactive merging slime blobs
   (lifted from the partners brochure, /forpartners page 8)
   ========================================================================= */
const LavaCapabilityMatrix = ({ accent }: { accent: string }) => {
  const CAPS = [
    { i: Building2, l: 'Corporate HQ', tag: 'SFH·01' },
    { i: Globe2, l: 'Global Network', tag: 'SFH·02' },
    { i: Handshake, l: 'Commercial Channels', tag: 'SFH·03' },
    { i: ShieldCheck, l: 'Institutional Relationships', tag: 'SFH·04' },
    { i: Award, l: 'Brand Authority', tag: 'SFH·05' },
    { i: Users, l: 'Corporate Members', tag: 'SFH·06' },
    { i: MapPin, l: 'Intl. Delegations', tag: 'SFH·07' },
    { i: Briefcase, l: 'Executive Spaces', tag: 'SFH·08' },
    { i: Rocket, l: 'Accelerator', tag: 'SFH·09' },
    { i: Brain, l: 'AI Platform', tag: 'SFH·10' },
    { i: GraduationCap, l: 'Mentor Network', tag: 'SFH·11' },
    { i: DollarSign, l: 'Investment Operations', tag: 'SFH·12' },
    { i: Lightbulb, l: 'Corporate Innovation', tag: 'SFH·13' },
    { i: BarChart3, l: 'Executive Programs', tag: 'SFH·14' },
    { i: Cpu, l: 'Digital Infrastructure', tag: 'SFH·15' },
    { i: TrendingUp, l: 'Growth Engine', tag: 'SFH·16' },
  ];
  const BLOBS = [
    { x: [14, 28, 18, 12], y: [20, 30, 48, 24], s: [1, 1.12, 0.95, 1.05], d: 14 },
    { x: [34, 24, 38, 32], y: [14, 28, 20, 16], s: [1.05, 0.92, 1.1, 1], d: 16 },
    { x: [55, 64, 50, 58], y: [18, 26, 32, 20], s: [0.95, 1.1, 1, 1.05], d: 13 },
    { x: [78, 70, 84, 80], y: [22, 30, 20, 24], s: [1.1, 1, 0.95, 1.08], d: 15 },
    { x: [20, 32, 24, 16], y: [44, 38, 52, 46], s: [1, 1.08, 0.94, 1.02], d: 17 },
    { x: [42, 50, 38, 44], y: [42, 48, 42, 40], s: [1.05, 0.95, 1.1, 1], d: 14 },
    { x: [62, 56, 68, 60], y: [44, 50, 40, 46], s: [0.95, 1.08, 1, 1.04], d: 18 },
    { x: [82, 76, 86, 84], y: [46, 42, 52, 44], s: [1.08, 1, 0.95, 1.06], d: 13 },
    { x: [16, 24, 18, 12], y: [66, 72, 62, 68], s: [1, 1.1, 0.95, 1.05], d: 16 },
    { x: [34, 42, 30, 36], y: [68, 64, 74, 66], s: [1.08, 0.95, 1.1, 1], d: 15 },
    { x: [50, 58, 46, 52], y: [66, 72, 68, 62], s: [0.95, 1.1, 1, 1.05], d: 17 },
    { x: [70, 64, 74, 72], y: [68, 64, 74, 66], s: [1.1, 1, 0.94, 1.06], d: 14 },
    { x: [86, 80, 88, 84], y: [66, 72, 64, 68], s: [1, 1.08, 0.95, 1.04], d: 19 },
    { x: [28, 36, 24, 30], y: [86, 84, 90, 86], s: [1.05, 0.95, 1.1, 1], d: 13 },
    { x: [52, 60, 48, 54], y: [88, 84, 90, 86], s: [0.95, 1.08, 1, 1.06], d: 16 },
    { x: [76, 70, 80, 78], y: [86, 90, 84, 88], s: [1.08, 1, 0.95, 1.04], d: 15 },
  ];
  // Softer, more matte palette — desaturated jewel tones (less neon)
  const SLIME = ['#4b8a7a', '#3b7a8c', '#7a5a96', '#a36584', '#7a8a52', '#5a8a6b'];

  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 rounded-3xl overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 35% 25%, #e8ecf2 0%, #d4dae3 45%, #b9c2cf 100%)',
        border: `1px solid rgba(80,100,120,0.18)`,
        boxShadow: 'inset 0 0 60px rgba(60,75,95,0.18)',
      }}
    >
      {/* SVG goo filter */}
      <svg className="absolute w-0 h-0" aria-hidden>
        <defs>
          <filter id="lavaGooInvestor">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Slime layer — multiply blend for matte fusion against the light background */}
      <div
        className="absolute inset-0"
        style={{ filter: 'url(#lavaGooInvestor)', mixBlendMode: 'multiply' }}
      >
        {BLOBS.map((b, idx) => (
          <motion.div
            key={`blob-${idx}`}
            className="absolute rounded-full"
            style={{
              width: 130,
              height: 130,
              left: `${b.x[0]}%`,
              top: `${b.y[0]}%`,
              marginLeft: -65,
              marginTop: -65,
              background: `radial-gradient(circle at 35% 30%, ${SLIME[idx % SLIME.length]} 0%, ${SLIME[(idx + 2) % SLIME.length]} 60%, ${SLIME[(idx + 4) % SLIME.length]}00 100%)`,
              opacity: 0.88,
            }}
            animate={{
              left: b.x.map((v) => `${v}%`),
              top: b.y.map((v) => `${v}%`),
              scale: b.s,
            }}
            transition={{
              duration: b.d,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Labels — centered on each blob */}
      <div className="absolute inset-0">
        {CAPS.map((cap, idx) => {
          const b = BLOBS[idx];
          const Icon = cap.i;
          return (
            <motion.div
              key={`cap-${idx}`}
              className="absolute flex flex-col items-center justify-center text-center pointer-events-none"
              style={{ left: `${b.x[0]}%`, top: `${b.y[0]}%`, width: 100, lineHeight: 1 }}
              initial={{ opacity: 0, scale: 0.6, x: '-50%', y: '-50%' }}
              animate={{
                left: b.x.map((v) => `${v}%`),
                top: b.y.map((v) => `${v}%`),
                opacity: 1,
                scale: 1,
                x: '-50%',
                y: '-50%',
              }}
              transition={{
                left: { duration: b.d, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
                top: { duration: b.d, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
                opacity: { duration: 0.6, delay: idx * 0.04 },
                scale: { duration: 0.6, delay: idx * 0.04 },
                x: { duration: 0 },
                y: { duration: 0 },
              }}
            >
              <Icon
                className="h-4 w-4 mb-1"
                style={{ color: '#ffffff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.55))' }}
              />
              <div
                className="font-black text-[10.5px] uppercase tracking-[0.12em] leading-[1.05]"
                style={{
                  color: '#ffffff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.55), 0 0 6px rgba(0,0,0,0.35)',
                }}
              >
                {cap.l}
              </div>
              <div
                className="font-mono text-[16px] tracking-[0.3em] mt-1"
                style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {cap.tag}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Soft vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 60%, rgba(40,55,75,0.22) 100%)',
        }}
      />

      {/* HUD */}
      <div
        className="absolute top-4 left-4 font-mono text-[16px] uppercase tracking-[0.3em]"
        style={{ color: '#3a5066' }}
      >
        ● LAVA · LIVE SYNTHESIS
      </div>
      <div
        className="absolute top-4 right-4 font-mono text-[16px] uppercase tracking-[0.3em] text-right"
        style={{ color: '#3a5066' }}
      >
        16 / 16 CAPABILITIES
        <br />
        <span style={{ color: accent, opacity: 0.85 }}>FUSED · ONE PLATFORM</span>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between font-mono text-[17px] uppercase tracking-[0.3em]" style={{ color: '#56697f' }}>
        <span>SFH · FUSION CORE</span>
        <span>STATUS: FLUID · MOVE THE CURSOR</span>
      </div>
    </div>
  );
};

/** What compounds for the investor across a Batch — growth tree inputs. */
const INVESTOR_GROWTH_BENEFITS: GrowthBenefit[] = [
  { id: 'dealflow', stage: 0, label: 'Proprietary dealflow', line: 'Companies built in the studio, seen before any market does.' },
  { id: 'diligence', stage: 0, label: 'Diligence intelligence', line: 'Signal Score data on every company, from day one.' },
  { id: 'allocation', stage: 1, label: 'Allocation windows', line: 'Priority entry into every Batch round, before it opens wide.' },
  { id: 'syndication', stage: 2, label: 'Syndication', line: 'Co-invest alongside the member network on shared-risk terms.' },
  { id: 'standard', stage: 2, label: 'Standard positions', line: '70% of every standard 10% position, on identical terms.' },
  { id: 'visibility', stage: 3, label: 'Portfolio visibility', line: 'Every company tracked in one investor dashboard.' },
];

const INVESTOR_GROWTH_ROOTS = ['Capital', 'Thesis', 'Sectors', 'Ticket'];

const INVESTOR_GROWTH_MONTHS = [
  'Your investor profile, thesis and ticket are set; dealflow unlocks.',
  'Studio companies build on the platform — you watch the data live.',
  'Allocation windows open; first standard positions are structured.',
  'Demo Day: the Batch presents to you and the investor network.',
];


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
      raf = requestAnimationFrame(() => {
        setEnv((prev) => {
          const next = readFlipEnv();
          // Height-only changes are the phone browser bar sliding in/out
          // while passing pages — ignore them entirely so page geometry
          // (and the flipbook) stays frozen mid-read.
          return prev.supported === next.supported &&
            prev.spread === next.spread &&
            Math.abs(prev.width - next.width) < 24
            ? prev
            : next;
        });
      });
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
}: { cycle: InvestorBillingCycle; label: string; size?: 'md' | 'lg'; tone?: 'light' | 'dark' }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Create your account to activate Investor Priority.' });
      window.location.href = '/auth';
      return;
    }
    setBusy(true);
    try {
      const url = await createInvestorPlanCheckout(cycle);
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

/**
 * Integrated Stripe checkout panel — same structure and format as the Basic
 * Plan brochure checkout, using Investor Priority pricing ($500 / mo, $5,000 / yr).
 */
const InvestorCheckoutPanel = ({
  monthly, yearly, yearlyPerMonth, savingsPercent,
}: { monthly: string; yearly: string; yearlyPerMonth: string; savingsPercent: number }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cycle, setCycle] = useState<InvestorBillingCycle>('yearly');
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Create your account to activate Investor Priority.' });
      window.location.href = '/auth';
      return;
    }
    setBusy(true);
    try {
      const url = await createInvestorPlanCheckout(cycle);
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

  const options: { key: InvestorBillingCycle; title: string; price: string; note: string; accent: string }[] = [
    { key: 'monthly', title: 'Monthly', price: monthly, note: 'Billed every month', accent: '#67e8f9' },
    { key: 'yearly', title: 'Annual', price: yearly, note: `${yearlyPerMonth} effective / mo · −${savingsPercent}%`, accent: '#6ee7b7' },
  ];

  return (
    <div className="rounded-3xl p-6 sm:p-7 w-full max-w-[560px]" style={{
      background: 'linear-gradient(150deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
      backdropFilter: 'blur(24px) saturate(140%)',
      WebkitBackdropFilter: 'blur(24px) saturate(140%)',
      border: '1px solid rgba(255,255,255,0.28)',
      boxShadow: '0 40px 90px -35px rgba(0,0,0,0.75)',
    }}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.34em] uppercase text-white/60">Secure checkout</span>
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.28em] uppercase" style={{ color: '#6ee7b7' }}>
          <ShieldCheck className="h-4 w-4" /> Stripe
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {options.map(o => {
          const active = cycle === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => setCycle(o.key)}
              className="text-left rounded-2xl px-4 py-4 transition"
              style={{
                background: active
                  ? `linear-gradient(140deg, ${o.accent}30, rgba(255,255,255,0.08))`
                  : 'rgba(255,255,255,0.06)',
                border: `1px solid ${active ? `${o.accent}aa` : 'rgba(255,255,255,0.18)'}`,
                boxShadow: active ? `0 0 0 1px ${o.accent}55, 0 18px 40px -22px ${o.accent}` : 'none',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-white/70">{o.title}</span>
                <span className="w-3.5 h-3.5 rounded-full border" style={{
                  borderColor: active ? o.accent : 'rgba(255,255,255,0.4)',
                  background: active ? o.accent : 'transparent',
                }} />
              </div>
              <div className="text-[34px] font-black text-white leading-none mt-2">{o.price}</div>
              <div className="text-[12px] text-white/60 mt-1.5 leading-snug">{o.note}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-2 text-[13px] text-white/75">
        <div className="flex items-center justify-between">
          <span>Startup Factory Hub · Investor Priority</span>
          <span className="font-bold text-white">{cycle === 'yearly' ? yearly : monthly}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Billing cycle</span>
          <span className="text-white/90">{cycle === 'yearly' ? 'Annual, one payment' : 'Monthly, 12 installments'}</span>
        </div>
        <div className="h-px w-full my-2" style={{ background: 'rgba(255,255,255,0.18)' }} />
        <div className="flex items-center justify-between text-[15px]">
          <span className="font-mono uppercase tracking-[0.22em] text-white/60">Due today</span>
          <span className="text-2xl font-black text-white">{cycle === 'yearly' ? yearly : monthly}</span>
        </div>
      </div>

      <button
        onClick={pay}
        disabled={busy}
        className="mt-5 w-full inline-flex items-center justify-center gap-3 rounded-2xl px-7 py-4 transition hover:scale-[1.02] disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, #0ea5b7, #0369a1)',
          border: '1px solid rgba(255,255,255,0.35)',
          boxShadow: '0 16px 46px -14px rgba(14,165,183,0.7)',
        }}
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <CreditCard className="h-5 w-5 text-white" />}
        <span className="font-bold tracking-[0.16em] uppercase text-white text-base">
          Pay {cycle === 'yearly' ? yearly : monthly} · activate
        </span>
      </button>

      <div className="mt-3 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.2em] text-white/45">
        <span>Cancel anytime</span>
        <a href="mailto:info@startupfactoryhub.com" className="hover:text-white/80">info@startupfactoryhub.com</a>
      </div>
    </div>
  );
};


/* ============================ PAGE ============================ */
export default function InvestorPlanBrochure({ embedded = false }: { embedded?: boolean }) {
  const { config, yearlySavingsPercent } = useInvestorPlan();
  const { toast } = useToast();
  const bookRef = useRef<any>(null);
  const { reportPage } = useBrochureLiveBridge(bookRef);
  const [currentPage, setCurrentPage] = useState(0);
  const { supported: flipSupported, spread, width, height } = useFlipEnv();

  // Feedback after returning from Stripe Checkout.
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('checkout');
    if (!status) return;
    if (status === 'success') {
      toast({
        title: 'Investor Priority activated',
        description: 'Your membership is active. Renewal is charged automatically.',
      });
    } else if (status === 'cancelled') {
      toast({ title: 'Checkout cancelled', description: 'No charge was made.' });
    }
    window.history.replaceState({}, '', window.location.pathname);
  }, [toast]);

  const pageW = spread
    ? Math.min(620, Math.floor((width - 120) / 2), Math.floor((height - 220) * (BASE_W / BASE_H)))
    : Math.min(560, width - 32);
  const pageH = Math.round(pageW * (BASE_H / BASE_W));

  const benefits: InvestorBenefit[] = config.entitlements ?? [];
  const monthly = formatCents(config.monthly_price_cents);
  const yearly = formatCents(config.yearly_price_cents);
  const yearlyPerMonth = formatCents(Math.round(config.yearly_price_cents / 12));
  const monthlyTotalCents = config.monthly_price_cents * 12;
  const yearlyIfMonthly = formatCents(monthlyTotalCents);
  const savings = yearlySavingsPercent;

  const pages = (
    <>
      {/* ---------------- 01 · COVER ---------------- */}
      <BookPage>
        <A4Wrapper>
          <section className="absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%)` }}>
            <AmbientField accent={NEON.cyan} />
            <Frame />

            {/* orbiting rings */}
            <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="relative">
                <div className="absolute -inset-[260px] rounded-full border" style={{ borderColor: `${NEON.cyan}25`, animation: 'slow-spin 40s linear infinite' }} />
                <div className="absolute -inset-[200px] rounded-full border-2 border-dashed" style={{ borderColor: `${NEON.cyan}30`, animation: 'slow-spin-reverse 60s linear infinite' }} />
                <div className="absolute -inset-[140px] rounded-full border" style={{ borderColor: `${NEON.gold}35`, animation: 'slow-spin 30s linear infinite' }} />
              </div>
            </div>

            {/* top hud strip */}
            <div className="absolute top-8 left-10 right-10 flex items-center justify-between font-mono text-[14px] tracking-[0.4em] uppercase z-20">
              <span style={{ color: NEON.cyan }}>// Investor Brochure · Startup Factory Hub</span>
              <span style={{ color: NEON.gold }}>2026 · Global · Remote + On-Site</span>
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
                className="font-mono text-[15px] tracking-[0.5em] uppercase mb-6"
                style={{ color: NEON.cyan, textShadow: `0 0 12px ${NEON.cyan}` }}
              >
                Investor Priority × The Standard Program
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.15 }}
                className="font-black leading-[0.92] tracking-tight"
                style={{
                  fontSize: 'clamp(52px, 7.5vw, 88px)',
                  ...PLATINUM_TITLE,
                  backgroundImage: `
                    repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
                    repeating-linear-gradient(-45deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 5px),
                    linear-gradient(180deg, #9ca3af 0%, #374151 35%, ${NEON.cyan} 100%)
                  `,
                  textShadow: `0 0 80px ${NEON.cyan}40`,
                }}
              >
                INVESTOR<br />PRIORITY
              </motion.h1>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="mt-6 h-[3px] w-[320px] origin-center"
                style={{
                  background: `linear-gradient(90deg, transparent, ${NEON.cyan}, ${NEON.gold}, transparent)`,
                  boxShadow: `0 0 20px ${NEON.cyan}, 0 0 30px ${NEON.gold}`,
                }}
              />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="mt-8 text-[21px] text-slate-700 max-w-xl leading-relaxed font-light"
              >
                The membership built for capital — proprietary dealflow from companies the
                Hub builds itself, and the Standard Program that puts you inside them.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1 }}
                className="mt-9 inline-flex items-center gap-3 rounded-full px-5 py-2.5"
                style={{
                  background: `linear-gradient(120deg, ${NEON.gold}26, rgba(255,255,255,0.6))`,
                  border: `1px solid ${NEON.gold}88`,
                  boxShadow: `0 0 24px ${NEON.gold}30`,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: NEON.gold, boxShadow: `0 0 10px ${NEON.gold}` }} />
                <span className="font-mono text-[13px] tracking-[0.3em] uppercase" style={{ color: '#8a6d1c' }}>
                  Inside · The Standard Program Valuation — P.10
                </span>
              </motion.div>
            </div>

            {/* bottom — live price plates + hud */}
            <div className="absolute bottom-8 left-10 right-10 z-20">
              <div className="flex gap-4 mb-6">
                {[
                  { label: 'MONTHLY', price: monthly, sub: 'per month · cancel anytime' },
                  { label: 'ANNUAL · BEST VALUE', price: yearly, sub: `per year · save ${savings}%` },
                ].map(p => (
                  <div key={p.label} className="flex-1 rounded-2xl p-5" style={{
                    background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)',
                    border: `1px solid ${NEON.cyan}33`, boxShadow: '0 24px 50px -30px rgba(15,23,42,0.35)',
                  }}>
                    <div className="font-mono text-[12px] tracking-[0.3em] text-slate-500">{p.label}</div>
                    <div className="flex items-end gap-2 mt-1.5">
                      <span className="font-black text-slate-900" style={{ fontSize: 38, lineHeight: 1, ...SERIF }}>{p.price}</span>
                      <span className="text-[14px] text-slate-500 mb-1">{p.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between font-mono text-[13px] tracking-[0.4em] uppercase">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.lime, boxShadow: `0 0 8px ${NEON.lime}` }} />
                  <span style={{ color: '#0a7a5c' }}>System · Online</span>
                </div>
                <span style={{ color: NEON.cyan }}>Membership · Open</span>
                <span style={{ color: '#8a6d1c' }}>Standard Program · P.10</span>
              </div>
            </div>
          </section>
        </A4Wrapper>
      </BookPage>

{/* ====================================================
                   PAGE 2 — STARTUP FACTORY HUB INTRODUCTION (Magazine Style)
                  ==================================================== */}
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
                      style={{
                        top: '-8%',
                        left: '-6%',
                        fontSize: '780px',
                        color: 'rgba(15,23,42,0.035)',
                        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                      }}
                    >
                      02
                    </div>

                    {/* Subtle ambient color */}
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
                      <div style={{ color: NEON.cyan }}>P/02 · 13</div>
                    </div>

                    {/* Bottom HUD bar */}
                    <div className="absolute bottom-5 left-12 right-12 flex items-center justify-between font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase z-20">
                      <span className="text-slate-900/35">// STARTUP FACTORY HUB · GLOBAL ACCELERATOR</span>
                      <span className="text-slate-900/35">GLOBAL · REMOTE + ON-SITE</span>
                    </div>

                    {/* MAIN CONTENT */}
                    <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: '58px 56px 56px 56px' }}>

                      {/* Header context */}
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
                              textDecoration: `underline`,
                              textDecorationColor: NEON.lime,
                              textUnderlineOffset: '8px',
                            }}
                          >
                            P/02
                          </span>
                        </div>
                      </motion.div>

                      {/* Hero copy block */}
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

                          <h1
                            className="font-extrabold tracking-tight text-slate-900 mb-8"
                            style={{
                              fontSize: '46px',
                              lineHeight: '1.04',
                              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                              maxWidth: '100%',
                            }}
                          >
                            The Operating System<br />
                            for the Next{' '}
                            <span
                              className="font-extrabold"
                              style={{
                                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
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
                              <div
                                className="w-[6px] h-full rounded-full"
                                style={{ background: `linear-gradient(180deg, ${NEON.cyan}, ${NEON.magenta}, ${NEON.lime})` }}
                              />
                            </div>
                            <div className="max-w-[540px] py-1">
                              <p className="text-[19px] leading-[1.55] text-slate-600 font-light mb-6">
                                Startup Factory Hub is the infrastructure layer for entrepreneurship in the AI era — connecting{' '}
                                <span className="font-semibold text-slate-900">founders, investors, mentors, advisors, accelerators</span>{' '}
                                and <span className="font-semibold text-slate-900">students</span> through an integrated
                                AI-powered acceleration platform, strategic capital and a globally connected innovation network.
                              </p>
                              <div className="p-6 bg-slate-50 border-l-4" style={{ borderColor: '#0f172a' }}>
                                <p
                                  className="text-slate-900 italic font-medium leading-snug"
                                  style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px' }}
                                >
                                  "Infrastructure is the new intellectual property. The platforms that accompany the founder's journey will define the future of innovation."
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT — visual + floating stats */}
                        <div className="col-span-5 relative">
                          <div className="h-full w-full relative overflow-hidden" style={{
                            boxShadow: '0 40px 80px -30px rgba(15,23,42,0.35)',
                          }}>
                            {/* City / hub imagery */}
                            <img loading="lazy" decoding="async" src={visionHub.url} alt="Startup Factory Hub innovation district" className="absolute inset-0 w-full h-full object-cover" />

                            {/* Tint overlay */}
                            <div
                              className="absolute inset-0"
                              style={{
                                background: `linear-gradient(180deg, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.55) 70%, rgba(15,23,42,0.92) 100%), radial-gradient(ellipse at 70% 20%, ${NEON.cyan}30 0%, transparent 55%)`,
                              }}
                            />

                            {/* Vertical decorative text */}
                            <div className="absolute top-10 right-0" style={{ transform: 'rotate(90deg)', transformOrigin: 'top right' }}>
                              <span className="text-[16px] font-black tracking-[0.5em] text-white/40 uppercase whitespace-nowrap">
                                Infrastructure First
                              </span>
                            </div>

                            {/* Floating stat card */}
                            <div
                              className="absolute inset-x-5 bottom-5 p-4 sm:p-5 backdrop-blur-xl border"
                              style={{
                                background: 'rgba(2,6,23,0.88)',
                                borderColor: 'rgba(255,255,255,0.1)',
                              }}
                            >
                              <div className="text-[12px] sm:text-[13px] font-bold tracking-[0.25em] uppercase text-slate-400 mb-3">
                                The Platform by the Numbers
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                {[
                                  { v: '300+', l: 'Members on the Platform', c: NEON.lime },
                                  { v: '50', l: 'Startups Accelerated', c: NEON.cyan },
                                  { v: '56', l: 'Partners & Collaborators', c: NEON.magenta },
                                  { v: '04', l: 'Global Hubs', c: NEON.amber },
                                ].map((s, i) => (
                                  <div key={i} className="min-w-0">
                                    <div className="text-white font-extrabold mb-1 whitespace-nowrap" style={{ fontSize: '18px', lineHeight: 1 }}>
                                      {s.v}
                                    </div>
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


              {/* ====================================================
                   PAGE 3 — EVENTS & ACTIVATIONS (Magazine Style)
                  ==================================================== */}
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
                          ecosystem meets.
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
                        <img loading="lazy" decoding="async" src={eventArtemisWatchParty} alt="Artemis 2 Watch Party AR Experience" className="absolute inset-0 w-full h-full object-cover" />
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
                          { img: eventLakeCounty, kicker: 'Institutional · NASA', title: 'Lake County · UCF Incubation · NASA', desc: 'Public-private collaboration expanding regional entrepreneurship and space-tech infrastructure.', accent: NEON.lime, logo: nasaLogo, logoAlt: 'NASA logo' },
                          { img: issSpaceStation, kicker: 'Space Agency', title: 'NASA · Kennedy Space Center', desc: 'Startups build on NASA technologies through the Technology Transfer Program at Kennedy Space Center.', accent: NEON.cyan, logo: nasaLogo, logoAlt: 'NASA logo' },
                        ].map((e, i) => (
                          <motion.div
                            key={e.title}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                            className="relative overflow-hidden min-h-0 flex bg-white"
                            style={{ boxShadow: '0 26px 50px -26px rgba(15,23,42,0.4)' }}
                          >
                            <div className="relative shrink-0" style={{ width: '38%' }}>
                              <img loading="lazy" decoding="async" src={e.img} alt={e.title} className="absolute inset-0 w-full h-full object-cover" />
                              {e.logo && (
                                <div className="absolute top-3 right-3 z-20 bg-white/90 p-1.5 shadow-md">
                                  <img loading="lazy" decoding="async" src={e.logo} alt={e.logoAlt} className="h-6 w-auto object-contain" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center px-4 py-3">
                              <div className="h-[3px] w-8 mb-2" style={{ background: e.accent }} />
                              <span className="text-[11px] font-bold tracking-[0.28em] uppercase" style={{ color: e.accent }}>{e.kicker}</span>
                              <h4
                                className="font-extrabold tracking-tight text-slate-900 leading-[1.1] mt-1 break-words"
                                style={{ fontSize: '18px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                              >
                                {e.title}
                              </h4>
                              <p className="text-[13px] leading-[1.4] text-slate-700 font-light mt-1">{e.desc}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Hot Deals — wide banner */}
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' }}
                        className="shrink-0 mt-4 flex overflow-hidden bg-white"
                        style={{ height: '118px', boxShadow: '0 26px 50px -26px rgba(15,23,42,0.4)' }}
                      >
                        <div className="relative shrink-0" style={{ width: '30%' }}>
                          <img loading="lazy" decoding="async" src={spaceEventBg} alt="Hot Deals in Space Industry" className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center px-5">
                          <div className="h-[3px] w-8 mb-1.5" style={{ background: NEON.magenta }} />
                          <span className="text-[11px] font-bold tracking-[0.28em] uppercase" style={{ color: NEON.magenta }}>Monthly · Deal Flow</span>
                          <h4
                            className="font-extrabold tracking-tight text-slate-900 leading-[1.1] mt-0.5"
                            style={{ fontSize: '21px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                          >
                            Hot Deals in Space Industry
                          </h4>
                          <p className="text-[14px] leading-[1.45] text-slate-700 font-light mt-0.5">Our monthly event where space-industry startups present live deals to investors and partners.</p>
                        </div>
                      </motion.div>

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

      {/* ---------------- 04 · ACCESS MODEL ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="03" label="THE ACCESS MODEL" pageNum={4}>
            <PageTitle kicker="Access model" serif title={<>Member to browse.<br />Priority to allocate.</>} />
            <ImagePlate src={imgSummit} alt="Investors reviewing deals at a private summit" caption="Private summits · allocation windows" height={230} className="mb-6" />
            <p className="text-[18px] text-slate-700 leading-relaxed mb-6">
              Every paid member can explore the ecosystem. Investor Priority adds the layer
              capital needs: pre-market dealflow, structured syndication and continuous
              diligence intelligence on every company in the Hub.
            </p>
            <div className="grid grid-cols-2 gap-5 flex-1">
              <GlassCard accent="#94a3b8">
                <div className="flex items-center gap-3 mb-4">
                  <IndexPlate n="01" color="#94a3b8" />
                  <div>
                    <div className="font-mono text-[12px] tracking-[0.3em] uppercase text-slate-500">Tier 01</div>
                    <div className="text-[24px] font-black text-slate-900 leading-tight">Membership</div>
                  </div>
                </div>
                <ul className="space-y-3 text-[17px] text-slate-600">
                  {['Community feed and resource map', 'Public program pages', 'Events and member directory', 'Standard meeting requests'].map(t => (
                    <li key={t} className="flex gap-2"><Check className="h-5 w-5 mt-0.5 text-slate-400 shrink-0" />{t}</li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t border-slate-200 text-[15px] text-slate-500">
                  General access. Dealflow priority and syndication are not included.
                </div>
              </GlassCard>

              <GlassCard accent={NEON.cyan}>
                <div className="flex items-center gap-3 mb-4">
                  <IndexPlate n="02" />
                  <div>
                    <div className="font-mono text-[12px] tracking-[0.3em] uppercase" style={{ color: NEON.cyan }}>Tier 02</div>
                    <div className="text-[24px] font-black text-slate-900 leading-tight">Investor Priority</div>
                  </div>
                </div>
                <ul className="space-y-3 text-[17px] text-slate-700">
                  {['Proprietary, pre-market dealflow', 'Priority allocation windows', 'Shared-risk syndication', 'Signal Score diligence data', 'Batch participation as investing partner', 'Private pitch nights and Demo Days'].map(t => (
                    <li key={t} className="flex gap-2"><Check className="h-5 w-5 mt-0.5 shrink-0" style={{ color: NEON.emerald }} />{t}</li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t border-slate-200 text-[15px] text-slate-600">
                  Includes everything in the general membership.
                </div>
              </GlassCard>
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 05 · BENEFITS (1/2) ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="04" label="ENTITLEMENTS" pageNum={5} accent={NEON.emerald}>
            <PageTitle kicker="What you unlock" serif title={<>{benefits.length} services,<br />one membership</>} accent={NEON.emerald} />
            <ImagePlate src={imgLab} alt="Analysts reviewing venture data in a research lab" caption="Diligence intelligence · Signal Score" accent={NEON.emerald} height={200} className="mb-5" />
            <div className="grid grid-cols-2 gap-4 flex-1 content-start">
              {benefits.slice(0, 6).map((b, i) => (
                <BenefitCard
                  key={b.key}
                  n={i + 1}
                  label={b.label}
                  description={b.description}
                  delay={i * 0.06}
                />
              ))}
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 06 · BENEFITS (2/2) ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="05" label="ENTITLEMENTS" pageNum={6} accent={NEON.emerald}>
            <PageTitle kicker="What you unlock" serif title={<>Portfolio, events<br />& co-investors</>} accent={NEON.emerald} />
            <ImagePlate src={imgStudio} alt="Venture studio team building a product" caption="Venture studio · built before it is funded" accent={NEON.emerald} height={170} className="mb-5" />
            <div className="grid grid-cols-2 gap-4 content-start">
              {benefits.slice(6).map((b, i) => (
                <BenefitCard
                  key={b.key}
                  n={i + 7}
                  label={b.label}
                  description={b.description}
                  delay={i * 0.06}
                />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-7">
              <RadialStat value={String(benefits.length)} label="Investor services" pct={1} color={NEON.emerald} />
              <RadialStat value="300" suffix="+" label="Platform members" pct={0.82} color={NEON.cyan} />
              <RadialStat value="24" suffix="/7" label="Global dealflow" pct={0.95} color={NEON.blue} />
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 07 · BUILT HERE — THE STUDIO ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="06" label="THE STUDIO" pageNum={7}>
            <PageTitle kicker="Where the deals come from" serif title={<>Built here.<br />Not sourced.</>} />
            <p className="text-[18px] text-slate-700 leading-relaxed mb-5">
              Every company you will ever see in this brochure was built inside Startup
              Factory Hub — our own startups, from our own venture studio and Batches.
              No lists, no marketplaces, no one else's pipeline: the Hub is the source.
            </p>
            <ImagePlate src={imgStudio} alt="The Startup Factory Hub venture studio at work" caption="The venture studio · where companies are built" height={215} className="mb-5" />
            <div className="grid grid-cols-2 gap-3">
              {STUDIO_ACTIVITIES.map((a, i) => (
                <motion.div
                  key={a.t}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.2 + i * 0.07, ease: 'easeOut' }}
                >
                  <GlassCard accent={NEON.emerald} padding="p-4" className="h-full">
                    <div className="flex items-start gap-3">
                      <IndexPlate n={i + 1} color={NEON.emerald} />
                      <div>
                        <div className="text-[17px] font-black text-slate-900 leading-tight">{a.t}</div>
                        <p className="text-[14px] text-slate-600 leading-snug mt-1">{a.d}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
            <div className="mt-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="h-px w-10" style={{ background: `linear-gradient(90deg, transparent, ${NEON.cyan})` }} />
                <span className="font-mono text-[13px] uppercase tracking-[0.34em]" style={{ color: NEON.cyan }}>
                  The three areas · software included in all of them
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { t: 'Space', d: 'Orbital services, earth intelligence and the technology-transfer frontier.' },
                  { t: 'Deep Tech', d: 'AI, robotics and hard technology with defensible engineering.' },
                  { t: 'Quantum', d: 'Quantum computing, sensing and communications, built early.' },
                ].map(a => (
                  <div key={a.t} className="rounded-2xl p-5" style={{
                    background: 'linear-gradient(150deg, #0b1220 0%, #16233c 100%)',
                    border: `1px solid ${NEON.cyan}44`,
                    boxShadow: '0 26px 50px -28px rgba(15,23,42,0.6)',
                  }}>
                    <div className="text-[22px] font-black text-white" style={SERIF}>{a.t}</div>
                    <p className="text-[13.5px] text-white/65 leading-snug mt-1.5">{a.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 08 · CAPABILITY MATRIX (LAVA) ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="07" label="CAPABILITY MATRIX" pageNum={8} accent={NEON.lime}>
            <PageTitle kicker="What stands behind the Hub" serif accent={NEON.emerald} title={<>16 combined capabilities.<br />One single platform.</>} />
            <p className="text-[16.5px] text-slate-600 leading-relaxed mb-4">
              The machine your capital plugs into: sixteen capabilities fused into one
              platform — the same fusion core partners get, working for investors.
            </p>
            <LavaCapabilityMatrix accent={NEON.emerald} />
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 09 · GROWTH TREE ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="08" label="INVESTOR GROWTH" pageNum={9} accent={NEON.emerald}>
            <PageTitle kicker="What grows for you" serif accent={NEON.emerald} title={<>Your position <span style={{ color: NEON.emerald }}>grows</span><br />with every Batch.</>} />
            <GrowthSection
              accent={NEON.emerald}
              accent2={NEON.cyan}
              benefits={INVESTOR_GROWTH_BENEFITS}
              rootInputs={INVESTOR_GROWTH_ROOTS}
              monthFocus={INVESTOR_GROWTH_MONTHS}
              focusLabel="Your Batch"
            />
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 10 · STANDARD PROGRAM VALUATION ---------------- */}
      <BookPage>
        <A4Wrapper>
          <section className="absolute inset-0 overflow-hidden" style={{ background: '#070b14' }}>
            <img
              src={imgSpace}
              alt="Satellite integration cleanroom with engineers"
              width={1536}
              height={1024}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.32 }}
            />
            <div className="absolute inset-0" style={{
              background: `linear-gradient(180deg, rgba(7,11,20,0.82) 0%, rgba(7,11,20,0.94) 60%, rgba(7,11,20,0.98) 100%), radial-gradient(ellipse at 50% 0%, ${NEON.gold}2e 0%, transparent 55%), radial-gradient(ellipse at 85% 100%, ${NEON.cyan}22 0%, transparent 55%)`,
            }} />
            <AmbientField accent={NEON.gold} />
            <Frame />

            <div className="absolute top-5 left-12 right-12 flex items-center justify-between font-mono text-[13px] tracking-[0.32em] uppercase pointer-events-none z-20">
              <div className="flex items-center gap-2" style={{ color: NEON.goldSoft }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON.gold, boxShadow: `0 0 8px ${NEON.gold}` }} />
                <span>SEC // 09</span>
              </div>
              <div className="text-white/50">Standard Program Valuation</div>
              <div style={{ color: NEON.goldSoft }}>P/10 · {TOTAL}</div>
            </div>

            <div className="absolute inset-0 z-10 flex flex-col justify-center px-14">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${NEON.gold})` }} />
                <span className="font-mono text-[15px] uppercase tracking-[0.4em]" style={{ color: NEON.goldSoft }}>
                  The Standard Program Valuation
                </span>
              </div>
              <h2 className="text-white" style={{
                fontSize: 'clamp(46px, 7vw, 74px)', lineHeight: 1.02,
                textShadow: `0 0 60px ${NEON.gold}44`,
                ...SERIF, fontWeight: 800, letterSpacing: '-0.02em',
              }}>
                One standard.<br />
                <span style={{ color: NEON.goldSoft }}>Every deal.</span>
              </h2>
              <p className="mt-5 text-[19px] text-white/80 leading-relaxed max-w-3xl">
                You sign once. We source and build the startup. You invest on the same
                standard terms as every other company in the program — no per-deal
                negotiation, ever.
              </p>

              {/* The split — the standard position, divided 70 / 30 */}
              <div className="mt-8 rounded-3xl p-7" style={{
                background: 'linear-gradient(150deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
                backdropFilter: 'blur(24px) saturate(140%)',
                WebkitBackdropFilter: 'blur(24px) saturate(140%)',
                border: `1px solid ${NEON.gold}66`,
                boxShadow: `0 40px 90px -35px rgba(0,0,0,0.8), 0 0 60px ${NEON.gold}1f`,
              }}>
                <div className="flex items-baseline justify-between mb-4">
                  <span className="font-mono text-[13px] tracking-[0.32em] uppercase text-white/60">
                    The standard position
                  </span>
                  <span className="font-mono text-[13px] tracking-[0.32em] uppercase" style={{ color: NEON.goldSoft }}>
                    10% of the startup
                  </span>
                </div>
                <div className="flex h-[74px] rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.25)' }}>
                  <motion.div
                    className="h-full flex items-center justify-center"
                    style={{ background: `linear-gradient(120deg, ${NEON.gold}, #8a6d1c)`, boxShadow: `inset 0 0 40px rgba(255,255,255,0.25)` }}
                    initial={{ width: 0 }}
                    animate={{ width: '70%' }}
                    transition={{ duration: 1.3, ease: 'easeOut', delay: 0.2 }}
                  >
                    <span className="font-black text-[#0b1220]" style={{ fontSize: 30, letterSpacing: '0.08em', ...SERIF }}>70% · YOURS</span>
                  </motion.div>
                  <motion.div
                    className="h-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(120deg, #e5e7eb, #6b7280)' }}
                    initial={{ width: 0 }}
                    animate={{ width: '30%' }}
                    transition={{ duration: 1.3, ease: 'easeOut', delay: 0.45 }}
                  >
                    <span className="font-black text-[#0b1220]" style={{ fontSize: 30, letterSpacing: '0.08em', ...SERIF }}>30%</span>
                  </motion.div>
                </div>
                <div className="grid grid-cols-2 gap-6 mt-5">
                  <div>
                    <div className="font-black" style={{ fontSize: 54, lineHeight: 1, color: NEON.goldSoft, ...SERIF }}>70%</div>
                    <div className="font-mono text-[12px] tracking-[0.26em] uppercase text-white/60 mt-2">The investor keeps</div>
                    <p className="text-[15px] text-white/75 leading-snug mt-2">
                      Seventy of every hundred shares in the position are yours — held
                      directly, on the standard terms.
                    </p>
                  </div>
                  <div>
                    <div className="font-black text-white" style={{ fontSize: 54, lineHeight: 1, ...SERIF }}>30%</div>
                    <div className="font-mono text-[12px] tracking-[0.26em] uppercase text-white/60 mt-2">Startup Factory Hub</div>
                    <p className="text-[15px] text-white/75 leading-snug mt-2">
                      Our compensation for sourcing, building and structuring the
                      company before your check ever lands.
                    </p>
                  </div>
                </div>
              </div>

              {/* Check scale */}
              <div className="mt-7">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="font-mono text-[13px] tracking-[0.32em] uppercase text-white/60">Your check</span>
                  <span className="font-mono text-[13px] tracking-[0.32em] uppercase" style={{ color: NEON.goldSoft }}>One standard valuation</span>
                </div>
                <div className="relative h-[10px] rounded-full" style={{ background: 'rgba(255,255,255,0.14)' }}>
                  <motion.div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${NEON.gold}55, ${NEON.gold})`, boxShadow: `0 0 18px ${NEON.gold}66` }}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
                <div className="flex justify-between mt-3">
                  {[
                    { v: '$25K', l: 'Minimum check' },
                    { v: '$100K', l: 'Mid position' },
                    { v: '$250K', l: 'Full standard position' },
                  ].map(m => (
                    <div key={m.v} className="text-center first:text-left last:text-right">
                      <div className="font-black text-white" style={{ fontSize: 26, ...SERIF }}>{m.v}</div>
                      <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-white/50 mt-1">{m.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* How it runs */}
              <div className="grid grid-cols-3 gap-4 mt-7">
                {[
                  { n: '01', t: 'You sign', d: 'One standard program agreement with the Hub.' },
                  { n: '02', t: 'We build', d: 'We source and build the startup inside the studio.' },
                  { n: '03', t: 'You invest', d: 'Your check lands — the 70 / 30 split applies.' },
                ].map(s => (
                  <div key={s.n} className="rounded-2xl p-5" style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)',
                  }}>
                    <div className="font-mono text-[13px] tracking-[0.3em]" style={{ color: NEON.goldSoft }}>{s.n}</div>
                    <div className="text-[19px] font-black text-white mt-1.5" style={SERIF}>{s.t}</div>
                    <p className="text-[14px] text-white/65 leading-snug mt-1">{s.d}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5">
                {['Space', 'Deep Tech', 'Quantum — software included', 'Same valuation for every company', 'No per-deal negotiation'].map(chip => (
                  <span key={chip} className="px-4 py-2 rounded-full font-mono text-[12px] tracking-[0.2em] uppercase" style={{
                    border: `1px solid ${NEON.gold}55`, color: NEON.goldSoft, background: `${NEON.gold}12`,
                  }}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none px-12 pb-4 pt-3">
              <div className="h-px w-full mb-2" style={{ background: `linear-gradient(90deg, transparent, ${NEON.gold}55, transparent)` }} />
              <div className="flex items-center justify-between gap-6 font-mono text-[11px] tracking-[0.22em] uppercase leading-none whitespace-nowrap">
                <span className="text-white/45 truncate">Startup Factory Hub · Investor Priority</span>
                <span className="shrink-0" style={{ color: NEON.goldSoft }}>Standard Program Valuation</span>
              </div>
            </div>
          </section>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 11 · PRICING ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="10" label="COMMERCIAL MODEL" pageNum={11}>
            <PageTitle kicker="Investor membership" serif title={<>Pay monthly<br />or save {savings}%</>} />
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
                  <li className="flex gap-2"><Check className="h-5 w-5 mt-0.5" style={{ color: NEON.cyan }} />Billed monthly, cancel anytime</li>
                  <li className="flex gap-2"><Check className="h-5 w-5 mt-0.5" style={{ color: NEON.cyan }} />Full dealflow access from day one</li>
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
                  }}>−{savings}%</span>
                </div>
                <div className="flex items-end gap-3">
                  <span className="font-black text-slate-900" style={{ fontSize: 96, lineHeight: 0.85 }}>{yearly}</span>
                  <span className="text-slate-500 mb-3 text-xl">/ yr</span>
                </div>
                <div className="mt-4 text-[17px] text-slate-600">
                  {yearlyPerMonth} effective per month
                </div>
                <ul className="mt-6 space-y-3 text-[17px] text-slate-700">
                  <li className="flex gap-2"><Check className="h-5 w-5 mt-0.5" style={{ color: NEON.emerald }} />One payment, full year of priority access</li>
                  <li className="flex gap-2"><Check className="h-5 w-5 mt-0.5" style={{ color: NEON.emerald }} />Best value for funds and family offices</li>
                  <li className="flex gap-2"><Check className="h-5 w-5 mt-0.5" style={{ color: NEON.emerald }} />Priority onboarding and dealflow briefing</li>
                </ul>
              </GlassCard>
            </div>

            <GlassCard className="mt-6" padding="p-7">
              <div className="font-mono text-[13px] tracking-[0.3em] uppercase text-slate-500 mb-5">
                Cost comparison · one year
              </div>
              <SavingsChart
                monthlyTotal={monthlyTotalCents}
                yearlyTotal={config.yearly_price_cents}
                savingsPercent={savings}
              />
            </GlassCard>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <JoinButton cycle="monthly" label="Join monthly" size="lg" />
              <JoinButton cycle="yearly" label={`Join yearly · −${savings}%`} size="lg" />
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 12 · HOW IT WORKS ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="11" label="ONBOARDING" pageNum={12}>
            <PageTitle kicker="How it works" serif title={<>Four steps<br />to priority</>} />
            <ImagePlate src={imgCampus} alt="Investors and founders meeting inside the innovation campus" caption="Founder access · pitch calendars" height={210} className="mb-6" />
            <div className="space-y-4 flex-1">
              {[
                { t: 'Create your investor account', d: 'Sign up and complete your investor profile, thesis, ticket size and sectors.' },
                { t: 'Activate Investor Priority', d: 'Choose monthly or annual billing and complete the secure Stripe checkout.' },
                { t: 'Dealflow unlocks instantly', d: 'Pre-market companies, Signal Score diligence data and allocation windows go live.' },
                { t: 'Allocate and syndicate', d: 'Book founders, co-invest with other members and follow your portfolio in one dashboard.' },
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

      {/* ---------------- 13 · CHECKOUT (replaces the former FAQ page) ---------------- */}
      <BookPage>
        <A4Wrapper>
          <section className="absolute inset-0 overflow-hidden" style={{ background: '#0b1220' }}>
            <img
              src={imgSummit}
              alt="Investor summit stage at golden hour"
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
            <div className="absolute inset-0 z-10 flex flex-col justify-center px-10">
              <div className="font-mono text-[13px] tracking-[0.42em] uppercase mb-3" style={{ color: '#67e8f9' }}>
                Checkout · activate priority
              </div>
              <div className="grid grid-cols-2 gap-8 items-center">
                <div>
                  <h1 className="font-black tracking-tight text-white" style={{
                    fontSize: 'clamp(40px, 5.4vw, 62px)', lineHeight: 0.95,
                    textShadow: `0 0 60px ${NEON.cyan}55`,
                  }}>
                    INVESTOR<br /><span style={{ color: '#67e8f9' }}>PRIORITY</span>
                  </h1>
                  <ul className="mt-6 space-y-2.5 text-[15px] text-white/80">
                    {[
                      'Pre-market dealflow unlocks instantly',
                      'Includes the full general membership',
                      'Cancel anytime from your dashboard',
                      'Card payment secured by Stripe',
                    ].map(t => (
                      <li key={t} className="flex gap-2">
                        <Check className="h-5 w-5 mt-0.5 shrink-0" style={{ color: '#6ee7b7' }} />{t}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 flex items-center gap-4">
                    <div className="p-2.5 rounded-2xl bg-white shadow-lg">
                      <QRCodeSVG value="https://startupfactoryhub.com/investor-plan" size={86} />
                    </div>
                    <a href="mailto:info@startupfactoryhub.com"
                      className="flex items-center gap-2 text-[15px] text-white/70 hover:text-white">
                      <Mail className="h-5 w-5" style={{ color: '#67e8f9' }} />
                      info@startupfactoryhub.com
                    </a>
                  </div>
                </div>
                <InvestorCheckoutPanel
                  monthly={monthly}
                  yearly={yearly}
                  yearlyPerMonth={yearlyPerMonth}
                  savingsPercent={savings}
                />
              </div>
              <div className="mt-8 h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${NEON.cyan}66, transparent)` }} />
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

      {!embedded && <Navigation />}
      <div className={`relative ${embedded ? 'pt-2' : 'pt-24'} pb-16 px-2 sm:px-4`}>
        {/* status strip */}
        <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-center gap-3">
          <span className="px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.25em] border border-primary/30 bg-primary/10 text-primary">
            Investor Priority · membership for capital
          </span>
          <span className="px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.25em] border border-primary/30 bg-background/60">
            {monthly}/mo · {yearly}/yr −{savings}%
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
                onFlip={(e: any) => { setCurrentPage(e.data); reportPage(e.data); }}
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
