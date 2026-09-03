/**
 * /basic-plan — Startup Factory Hub Membership brochure.
 *
 * Editorial flipbook brochure inspired by the BDV brochure system: light
 * glass surfaces, HUD framing, A4 pages and a two-page desktop spread.
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
  MessageSquare, MapPin, Code2, Rocket, Percent, CalendarDays, HandCoins,
  GraduationCap, HeartHandshake, ArrowLeftRight, BadgeCheck, Lock, Check,
  ChevronLeft, ChevronRight, Mail, Globe, ArrowUpRight, Sparkles, Users,
  ShieldCheck, Loader2, LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBasicPlan, formatCents } from '@/features/basic-plan/hooks/useBasicPlan';
import { useMembershipAccess } from '@/features/basic-plan/hooks/useMembershipAccess';
import { createBasicPlanCheckout } from '@/features/basic-plan/api/basicPlanApi';
import type { BillingCycle, Entitlement } from '@/features/basic-plan/types';

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

const ICONS: Record<string, LucideIcon> = {
  MessageSquare, MapPin, Code2, Rocket, Percent, CalendarDays, HandCoins,
  GraduationCap, HeartHandshake, ArrowLeftRight, BadgeCheck,
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

const Scanlines = () => (
  <div className="absolute inset-0 pointer-events-none" style={{
    backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(15,23,42,0.012) 3px, rgba(15,23,42,0.012) 4px)',
  }} />
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
    background: 'linear-gradient(140deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.46) 100%)',
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

const NeonBadge = ({ icon: Icon, color = NEON.cyan }: { icon: LucideIcon; color?: string }) => (
  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{
    background: `linear-gradient(135deg, ${color}30, ${color}05)`,
    border: `1px solid ${color}60`,
    boxShadow: `0 0 18px ${color}35, inset 0 0 12px ${color}18`,
  }}>
    <Icon className="h-5 w-5" style={{ color }} />
  </div>
);

const PageTitle = ({ kicker, title, accent = NEON.cyan }: { kicker: string; title: React.ReactNode; accent?: string }) => (
  <div className="mb-5">
    <div className="flex items-center gap-3 mb-3">
      <span className="h-px w-12" style={{ background: `linear-gradient(90deg, transparent, ${accent})` }} />
      <span className="font-mono text-[13px] uppercase tracking-[0.4em]" style={{ color: accent }}>{kicker}</span>
    </div>
    <h2 className="font-black tracking-tight break-words" style={{
      fontSize: 'clamp(30px, 5vw, 44px)',
      lineHeight: 1.08,
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
    <Scanlines />
    <Frame />

    <div className="absolute top-5 left-12 right-12 flex items-center justify-between font-mono text-[12px] tracking-[0.32em] uppercase pointer-events-none z-20">
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
      <div className="flex items-center justify-between gap-6 font-mono text-[10px] tracking-[0.22em] uppercase leading-none whitespace-nowrap">
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
const JoinButton = ({ cycle, label }: { cycle: BillingCycle; label: string }) => {
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

  return (
    <button
      onClick={go}
      disabled={busy}
      className="inline-flex items-center gap-3 px-7 py-4 rounded-2xl transition hover:scale-[1.03] disabled:opacity-60"
      style={{
        background: `linear-gradient(135deg, ${NEON.cyan}25, ${NEON.blue}25)`,
        border: `1px solid ${NEON.cyan}80`,
        boxShadow: `0 0 40px ${NEON.cyan}35, inset 0 0 20px ${NEON.cyan}10`,
      }}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: NEON.cyan }} />
        : <Sparkles className="h-4 w-4" style={{ color: NEON.cyan }} />}
      <span className="text-sm font-bold tracking-[0.18em] uppercase text-slate-900">{label}</span>
      <ArrowUpRight className="h-4 w-4" style={{ color: NEON.cyan }} />
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
  const yearlyIfMonthly = formatCents(plan.monthly_price_cents * 12);

  const pages = (
    <>
      {/* ---------------- 01 · COVER ---------------- */}
      <BookPage>
        <A4Wrapper>
          <section className="absolute inset-0 overflow-hidden" style={{
            background: `radial-gradient(ellipse at 15% 10%, ${NEON.cyan}26 0%, transparent 55%), radial-gradient(ellipse at 85% 90%, ${NEON.blue}20 0%, transparent 55%), linear-gradient(180deg, #ffffff 0%, #eaf0f7 100%)`,
          }}>
            <HudGrid />
            <Scanlines />
            <Frame />
            <div className="absolute inset-0 z-10 flex flex-col justify-center px-16">
              <div className="font-mono text-[13px] tracking-[0.45em] uppercase mb-6" style={{ color: NEON.cyan }}>
                Startup Factory Hub · Membership
              </div>
              <h1 className="font-black tracking-tight" style={{
                fontSize: 'clamp(46px, 8vw, 86px)', lineHeight: 0.95, ...PLATINUM_TITLE,
                textShadow: `0 0 60px ${NEON.cyan}45`,
              }}>
                ONE<br />MEMBERSHIP.<br />THE WHOLE<br />ECOSYSTEM.
              </h1>
              <div className="mt-8 h-[3px] w-[300px]" style={{
                background: `linear-gradient(90deg, transparent, ${NEON.cyan}, ${NEON.blue}, transparent)`,
                boxShadow: `0 0 20px ${NEON.cyan}`,
              }} />
              <p className="mt-8 text-xl text-slate-700 max-w-xl leading-relaxed">
                Feed, resource map, open-source technology, acceleration programs, events,
                investor access, internships, volunteering, technology transfer and certified courses —
                unlocked with a single annual membership.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <GlassCard padding="px-5 py-4">
                  <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-slate-500">Monthly</div>
                  <div className="text-3xl font-black text-slate-900">{monthly}</div>
                </GlassCard>
                <GlassCard padding="px-5 py-4" accent={NEON.emerald}>
                  <div className="font-mono text-[11px] tracking-[0.3em] uppercase" style={{ color: NEON.emerald }}>
                    Yearly · −{savingsPercent}%
                  </div>
                  <div className="text-3xl font-black text-slate-900">{yearly}</div>
                </GlassCard>
              </div>
              <div className="mt-10 flex items-center gap-8 font-mono text-[12px] uppercase tracking-[0.35em] text-slate-500">
                <div className="flex items-center gap-2"><Globe className="h-3 w-3" style={{ color: NEON.cyan }} />GLOBAL</div>
                <div className="flex items-center gap-2"><Users className="h-3 w-3" style={{ color: NEON.cyan }} />200+ MEMBERS</div>
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
            <p className="text-[15px] text-slate-700 leading-relaxed mb-6 max-w-2xl">
              Startup Factory Hub is now a membership platform. Anyone can create an account and
              browse the ecosystem — but publishing, applying, contacting investors and enrolling
              are reserved for members. This keeps the network signal high and the community real.
            </p>
            <div className="grid grid-cols-2 gap-5 flex-1">
              <GlassCard accent="#94a3b8">
                <div className="flex items-center gap-3 mb-4">
                  <NeonBadge icon={Lock} color="#94a3b8" />
                  <div>
                    <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-slate-500">Tier 00</div>
                    <div className="text-xl font-black text-slate-900">Free account</div>
                  </div>
                </div>
                <ul className="space-y-2.5 text-[14px] text-slate-600">
                  {['Browse the community feed', 'View the global resource map', 'Read public program pages', 'Discover events and members'].map(t => (
                    <li key={t} className="flex gap-2"><Check className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" />{t}</li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t border-slate-200 text-[13px] text-slate-500">
                  Read-only. Publishing, applications, investor contact and enrollment are locked.
                </div>
              </GlassCard>

              <GlassCard accent={NEON.cyan}>
                <div className="flex items-center gap-3 mb-4">
                  <NeonBadge icon={ShieldCheck} />
                  <div>
                    <div className="font-mono text-[11px] tracking-[0.3em] uppercase" style={{ color: NEON.cyan }}>Tier 01+</div>
                    <div className="text-xl font-black text-slate-900">Member</div>
                  </div>
                </div>
                <ul className="space-y-2.5 text-[14px] text-slate-700">
                  {['Post in the feed and on the resource map', 'Apply to acceleration & MVP programs', 'Contact investors directly', 'Attend meetings, conferences and pitch events', 'Internships, volunteering & technology transfer', 'Certified courses and member pricing'].map(t => (
                    <li key={t} className="flex gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: NEON.emerald }} />{t}</li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t border-slate-200 text-[13px] text-slate-600">
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
            <div className="grid grid-cols-2 gap-4 flex-1 content-start">
              {entitlements.slice(0, 6).map((e: Entitlement, i) => {
                const Icon = ICONS[e.icon] ?? Sparkles;
                return (
                  <GlassCard key={e.key} accent={NEON.emerald} padding="p-5">
                    <div className="flex items-start gap-3">
                      <NeonBadge icon={Icon} color={NEON.emerald} />
                      <div>
                        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-slate-400">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <div className="text-[16px] font-black text-slate-900 leading-tight">{e.label}</div>
                        <p className="text-[13px] text-slate-600 leading-snug mt-1">{e.description}</p>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
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
              {entitlements.slice(6).map((e: Entitlement, i) => {
                const Icon = ICONS[e.icon] ?? Sparkles;
                return (
                  <GlassCard key={e.key} accent={NEON.emerald} padding="p-5">
                    <div className="flex items-start gap-3">
                      <NeonBadge icon={Icon} color={NEON.emerald} />
                      <div>
                        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-slate-400">
                          {String(i + 7).padStart(2, '0')}
                        </div>
                        <div className="text-[16px] font-black text-slate-900 leading-tight">{e.label}</div>
                        <p className="text-[13px] text-slate-600 leading-snug mt-1">{e.description}</p>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
            <GlassCard className="mt-6" accent={NEON.cyan}>
              <div className="font-mono text-[11px] tracking-[0.3em] uppercase mb-2" style={{ color: NEON.cyan }}>
                Included with every tier
              </div>
              <p className="text-[14px] text-slate-700 leading-relaxed">
                Higher memberships add capacity — dedicated mentoring hours, program seats and
                partner services — on top of everything listed here. Nothing in this list is ever
                removed from a paid account.
              </p>
            </GlassCard>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 05 · PRICING ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="04" label="COMMERCIAL MODEL" pageNum={5}>
            <PageTitle kicker="Annual membership" title={<>PAY MONTHLY<br />OR SAVE {savingsPercent}%</>} />
            <p className="text-[15px] text-slate-700 leading-relaxed mb-6 max-w-2xl">
              The membership is an annual commitment. Choose a monthly installment or pay the full
              year upfront and keep {savingsPercent}% of it.
            </p>
            <div className="grid grid-cols-2 gap-5">
              <GlassCard accent={NEON.cyan} padding="p-7">
                <div className="font-mono text-[11px] tracking-[0.32em] uppercase text-slate-500 mb-3">
                  Option A · Monthly billing
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-black text-slate-900">{monthly}</span>
                  <span className="text-slate-500 mb-2 text-sm">/ month</span>
                </div>
                <div className="mt-2 text-[13px] text-slate-600">{yearlyIfMonthly} per year · 12 installments</div>
                <ul className="mt-5 space-y-2 text-[14px] text-slate-700">
                  <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5" style={{ color: NEON.cyan }} />Annual term, billed every month</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5" style={{ color: NEON.cyan }} />Full access from day one</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5" style={{ color: NEON.cyan }} />Secure card payment</li>
                </ul>
              </GlassCard>

              <GlassCard accent={NEON.emerald} padding="p-7">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-mono text-[11px] tracking-[0.32em] uppercase text-slate-500">
                    Option B · Annual upfront
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-[0.18em]" style={{
                    background: `${NEON.emerald}18`, color: NEON.emerald, border: `1px solid ${NEON.emerald}55`,
                  }}>−{savingsPercent}%</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-black text-slate-900">{yearly}</span>
                  <span className="text-slate-500 mb-2 text-sm">/ year</span>
                </div>
                <div className="mt-2 text-[13px] text-slate-600">
                  {yearlyPerMonth} effective per month · save {formatCents(plan.monthly_price_cents * 12 - plan.yearly_price_cents)}
                </div>
                <ul className="mt-5 space-y-2 text-[14px] text-slate-700">
                  <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5" style={{ color: NEON.emerald }} />One payment, full year of access</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5" style={{ color: NEON.emerald }} />Best value for founders and teams</li>
                  <li className="flex gap-2"><Check className="h-4 w-4 mt-0.5" style={{ color: NEON.emerald }} />Priority onboarding</li>
                </ul>
              </GlassCard>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <JoinButton cycle="monthly" label="Join monthly" />
              <JoinButton cycle="yearly" label={`Join yearly · −${savingsPercent}%`} />
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 06 · HOW IT WORKS ---------------- */}
      <BookPage>
        <A4Wrapper>
          <PageFrame code="05" label="ONBOARDING" pageNum={6}>
            <PageTitle kicker="How it works" title={<>FOUR STEPS<br />TO FULL ACCESS</>} />
            <div className="space-y-4 flex-1">
              {[
                { t: 'Create your account', d: 'Sign up free and complete your founder, investor, mentor or student profile.' },
                { t: 'Activate the membership', d: 'Choose monthly or annual billing and complete the secure checkout.' },
                { t: 'Everything unlocks instantly', d: 'Posting, map publishing, program applications, investor contact and courses go live on your account.' },
                { t: 'Grow inside the ecosystem', d: 'Join events, apply to programs, hire and get hired, transfer technology and earn certifications.' },
              ].map((s, i) => (
                <GlassCard key={s.t} padding="p-5">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl font-black leading-none" style={{ color: `${NEON.cyan}55` }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <div className="text-[17px] font-black text-slate-900">{s.t}</div>
                      <p className="text-[14px] text-slate-600 leading-snug mt-1">{s.d}</p>
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
                { q: 'Is the membership annual?', a: 'Yes. The membership runs for a full year. You can pay it monthly or upfront with a 20% discount.' },
                { q: 'What happens to my free account?', a: 'Nothing is deleted. You keep browsing access; publishing, applying and investor contact stay locked until you activate a membership.' },
                { q: 'Do higher memberships include this?', a: 'Yes. Every paid membership includes the full list of services in this brochure.' },
                { q: 'Can my whole team join?', a: 'Yes. Each member holds an individual account; contact us for team onboarding.' },
                { q: 'How do I pay?', a: 'Secure card checkout through Stripe. Invoices are available on request for organizations.' },
              ].map(f => (
                <GlassCard key={f.q} accent={NEON.blue} padding="p-5">
                  <div className="text-[16px] font-black text-slate-900">{f.q}</div>
                  <p className="text-[14px] text-slate-600 leading-snug mt-1">{f.a}</p>
                </GlassCard>
              ))}
            </div>
          </PageFrame>
        </A4Wrapper>
      </BookPage>

      {/* ---------------- 08 · JOIN ---------------- */}
      <BookPage>
        <A4Wrapper>
          <section className="absolute inset-0 overflow-hidden" style={{
            background: `radial-gradient(ellipse at 80% 10%, ${NEON.cyan}22 0%, transparent 55%), linear-gradient(180deg, #ffffff 0%, #eaf0f7 100%)`,
          }}>
            <HudGrid />
            <Scanlines />
            <Frame />
            <div className="absolute inset-0 z-10 flex flex-col justify-center px-16">
              <div className="font-mono text-[13px] tracking-[0.45em] uppercase mb-5" style={{ color: NEON.cyan }}>
                Join the hub
              </div>
              <h1 className="font-black tracking-tight" style={{
                fontSize: 'clamp(40px, 7vw, 74px)', lineHeight: 0.98, ...PLATINUM_TITLE,
                textShadow: `0 0 60px ${NEON.cyan}45`,
              }}>
                BECOME<br />A MEMBER
              </h1>
              <p className="mt-7 text-lg text-slate-700 max-w-xl leading-relaxed">
                {monthly}/month or {yearly}/year with {savingsPercent}% off. Full access to the
                Startup Factory Hub ecosystem, worldwide.
              </p>
              <div className="mt-8 flex items-center gap-6">
                <div className="p-3 rounded-2xl bg-white shadow-lg">
                  <QRCodeSVG value="https://startupfactoryhub.com/basic-plan" size={104} />
                </div>
                <div className="space-y-3">
                  <JoinButton cycle="yearly" label="Activate membership" />
                  <a href="mailto:info@startupfactoryhub.com"
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                    <Mail className="h-4 w-4" style={{ color: NEON.cyan }} />
                    info@startupfactoryhub.com
                  </a>
                </div>
              </div>
              <div className="mt-12 h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${NEON.cyan}66, transparent)` }} />
              <div className="mt-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.3em]">
                <span className="text-slate-500">// startupfactoryhub.com</span>
                <span style={{ color: NEON.cyan }}>END · TRANSMISSION</span>
              </div>
            </div>
          </section>
        </A4Wrapper>
      </BookPage>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-16 px-2 sm:px-4">
        {/* status strip */}
        <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-center gap-3">
          <span className="px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.25em] border border-primary/30 bg-primary/10 text-primary">
            {isMember ? `Active membership · ${tier}` : 'Free account · limited access'}
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
