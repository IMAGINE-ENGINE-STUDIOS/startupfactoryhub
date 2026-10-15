/**
 * APEX Accelerators partnership brochure (/apex).
 * High-readability flipbook explaining how Startup Factory Hub supports
 * APEX Accelerators' mission of helping small businesses win government contracts.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Home, Target, ShieldCheck, Network, Brain,
  GraduationCap, BarChart3, Handshake, FileText, Users, CalendarDays,
  Building2, Rocket, Check, Mail, FolderOpen, Settings, Globe, TrendingUp, Coins, Award,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import BrochureResourceMap from '@/components/brochure/BrochureResourceMap';
import sfhLogo from '@/assets/sfh-logo-combined.png';
import { EditorialPage, FEATURES } from './apex/ApexEditorial';
import { PartnersAboutPage, PartnersEcosystemPage } from './apex/PartnersPages';
import { FragmentedToolsPage } from './apex/FragmentedToolsPage';
import { TechFeaturePage } from './apex/TechFeaturePage';
import { EcosystemOrbit } from './apex/EcosystemOrbit';
import { ValueForEveryonePage } from './apex/ValueForEveryonePage';
import { UnifiedPlatformPage } from './apex/UnifiedPlatformPage';
import { ApexPerksPage } from './apex/PerksPage';
import { ApexImagineEnginePage } from './apex/ImagineEnginePage';
import { ApexTeamPage, ApexRoadmapPage, ApexNextStepsPage } from './apex/TeamRoadmapPages';
import { PartnersARPage, PartnersNasdaqPage } from './AcceleratorBrochure';

const APEX_LOGO = '/partners/apex-accelerators-logo.png';
const CONTACT_URL = 'https://startupfactoryhub.com/apex';

// Brochure palette — matches the /forpartners light-glass style, tuned for contrast.
const C = {
  ink: '#0f172a',
  body: '#1e293b',
  muted: '#475569',
  teal: '#0e7490',
  navy: '#1f2a44',
  emerald: '#047857',
  line: 'rgba(15,23,42,0.12)',
  card: 'rgba(255,255,255,0.92)',
};

/* ---------- Building blocks ---------- */
const BookPage = forwardRef<HTMLDivElement, { children: React.ReactNode; hard?: boolean }>(({ children, hard }, ref) => (
  <div ref={ref} data-density={hard ? 'hard' : 'soft'} className="overflow-hidden" style={{ background: '#ffffff' }}>{children}</div>
));
BookPage.displayName = 'BookPage';

// Platinum / carbon-fiber headline treatment shared with /forpartners.
const PLATINUM: React.CSSProperties = {
  backgroundImage: `
    repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 5px),
    linear-gradient(180deg, #64748b 0%, #1f2937 45%, #0f172a 60%, #334155 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.18))',
};

const HudBackdrop = ({ accent }: { accent: string }) => (
  <>
    <div className="absolute inset-0 pointer-events-none" style={{
      backgroundImage: `linear-gradient(${accent}12 1px, transparent 1px), linear-gradient(90deg, ${accent}12 1px, transparent 1px)`,
      backgroundSize: '40px 40px',
      maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
      WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
    }} />
    <div className="absolute pointer-events-none" style={{
      inset: 14, borderRadius: 24, border: '1px solid rgba(255,255,255,0.75)',
      boxShadow: '0 0 0 1px rgba(15,23,42,0.05), 0 30px 80px -30px rgba(15,23,42,0.25), inset 0 1px 0 rgba(255,255,255,0.9)',
    }} />
  </>
);

const Frame = ({ code, label, accent = C.teal, children }: {
  code: string; label: string; accent?: string; children: React.ReactNode;
}) => (
  <section className="absolute inset-0 flex flex-col overflow-hidden" style={{
    background: `radial-gradient(ellipse at 15% 0%, ${accent}22 0%, transparent 55%), radial-gradient(ellipse at 85% 100%, ${C.navy}1c 0%, transparent 55%), linear-gradient(180deg,#fbfcfe 0%,#eef2f8 100%)`,
    color: C.body,
  }}>
    <HudBackdrop accent={accent} />
    <header className="relative z-10 flex items-center justify-between px-[6%] pt-[4.5%] pb-[2%] font-mono uppercase" style={{ fontSize: 12.5, letterSpacing: '0.28em' }}>
      <div className="flex items-center gap-2" style={{ color: accent, fontWeight: 700 }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
        SEC // {code}
      </div>
      <span style={{ color: C.muted, fontWeight: 600 }}>{label}</span>
      <img src={APEX_LOGO} alt="APEX Accelerators" className="h-6 w-auto object-contain" />
    </header>
    <div className="relative z-10 flex-1 px-[6%] pb-[2%] flex flex-col gap-4 overflow-hidden">{children}</div>
    <footer className="relative z-10 px-[6%] pb-[3.5%] pt-2 font-mono uppercase" style={{ fontSize: 10.5, letterSpacing: '0.22em', color: C.muted }}>
      <div className="h-px w-full mb-2" style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }} />
      <div className="flex items-center justify-between">
        <span>Startup Factory Hub × APEX Accelerators</span>
        <span style={{ color: accent, fontWeight: 700 }}>P/{code} · {TOTAL}</span>
      </div>
    </footer>
  </section>
);

const Title = ({ children, sub, accent = C.teal }: { children: React.ReactNode; sub?: string; accent?: string }) => (
  <div>
    <div className="h-[3px] w-14 mb-3 rounded-full" style={{ background: `linear-gradient(90deg, ${accent}, ${C.navy})`, boxShadow: `0 0 12px ${accent}66` }} />
    <h2 className="font-futuristic" style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.01em', paddingBottom: 4, ...PLATINUM }}>{children}</h2>
    {sub && <p className="mt-2" style={{ color: C.body, fontSize: 19, lineHeight: 1.5 }}>{sub}</p>}
  </div>
);

const glass: React.CSSProperties = {
  background: 'linear-gradient(140deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.62) 100%)',
  backdropFilter: 'blur(18px) saturate(140%)',
  WebkitBackdropFilter: 'blur(18px) saturate(140%)',
  border: '1px solid rgba(255,255,255,0.9)',
  boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 24px 50px -28px rgba(15,23,42,0.28), 0 0 0 1px rgba(15,23,42,0.05)',
};

const Card = ({ icon: Icon, title, text, accent = C.teal }: {
  icon: React.ElementType; title: string; text: string; accent?: string;
}) => (
  <div className="relative rounded-2xl p-4 flex gap-3" style={glass}>
    <span className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    <div className="shrink-0 h-11 w-11 rounded-xl flex items-center justify-center" style={{
      background: `linear-gradient(135deg, ${accent}30, ${accent}08)`, border: `1px solid ${accent}55`,
      boxShadow: `0 0 16px ${accent}33, inset 0 0 10px ${accent}1a`, color: accent,
    }}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <h3 style={{ color: C.ink, fontSize: 17, fontWeight: 800, lineHeight: 1.25 }}>{title}</h3>
      <p className="mt-1" style={{ color: C.body, fontSize: 15, lineHeight: 1.5 }}>{text}</p>
    </div>
  </div>
);

const NeedSolve = ({ need, solve }: { need: string; solve: string }) => (
  <div className="relative grid grid-cols-2 gap-3 rounded-2xl p-3.5" style={glass}>
    <div>
      <div className="font-mono uppercase font-bold" style={{ fontSize: 11, letterSpacing: '0.2em', color: C.muted }}>// APEX need</div>
      <p className="mt-1" style={{ fontSize: 15, lineHeight: 1.45, color: C.ink, fontWeight: 600 }}>{need}</p>
    </div>
    <div className="pl-3" style={{ borderLeft: `2px solid ${C.emerald}55` }}>
      <div className="font-mono uppercase font-bold" style={{ fontSize: 11, letterSpacing: '0.2em', color: C.emerald }}>// How we solve it</div>
      <p className="mt-1" style={{ fontSize: 15, lineHeight: 1.45, color: C.body }}>{solve}</p>
    </div>
  </div>
);

const Bullets = ({ items, accent = C.emerald }: { items: string[]; accent?: string }) => (
  <ul className="flex flex-col gap-2.5">
    {items.map((t) => (
      <li key={t} className="flex gap-2.5 items-start" style={{ fontSize: 15.5, lineHeight: 1.5, color: C.body }}>
        <span className="shrink-0 mt-0.5 h-5 w-5 rounded-md flex items-center justify-center" style={{ background: `${accent}18`, border: `1px solid ${accent}55` }}>
          <Check className="h-3.5 w-3.5" style={{ color: accent }} />
        </span>
        <span>{t}</span>
      </li>
    ))}
  </ul>
);

/* ---------- Pages ---------- */
const TOTAL = '28';
const PAGES: { key: string; node: React.ReactNode }[] = [
  {
    key: 'cover',
    node: (
      <section className="absolute inset-0 flex flex-col items-center justify-between text-center py-[9%] px-[8%] overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 40%, #7c3aed55 0%, transparent 55%), radial-gradient(ellipse at 15% 100%, #a855f733 0%, transparent 50%), radial-gradient(ellipse at 90% 0%, #c4b5fd22 0%, transparent 45%), linear-gradient(160deg,#07050f 0%,#140b2b 50%,#05040b 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#a78bfa14 1px, transparent 1px), linear-gradient(90deg, #a78bfa14 1px, transparent 1px)', backgroundSize: '36px 36px', maskImage: 'radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)' }} />
        {[300, 420, 560].map((d, i) => (
          <div key={d} className="absolute rounded-full pointer-events-none" style={{ width: d, height: d, left: '50%', top: '44%', transform: 'translate(-50%,-50%)', border: `1px ${i === 1 ? 'dashed' : 'solid'} ${i === 0 ? '#c4b5fd66' : '#a78bfa2e'}`, boxShadow: i === 0 ? '0 0 60px #7c3aed55, inset 0 0 60px #7c3aed33' : undefined }} />
        ))}
        <div className="relative font-mono uppercase" style={{ fontSize: 12, letterSpacing: '0.4em', color: '#c4b5fd', fontWeight: 700 }}>SEC // 00</div>
        <div className="relative flex flex-col items-center">
          <div className="relative rounded-full p-8" style={{ background: 'radial-gradient(circle, #ffffff 0%, #ede9fe 60%, #c4b5fd 100%)', boxShadow: '0 0 0 1px #ffffff55, 0 0 80px #7c3aedaa, 0 20px 60px #000a' }}>
            <img src={APEX_LOGO} alt="APEX Accelerators" className="h-28 w-28 object-contain" />
          </div>
          <h1 className="mt-10 font-futuristic" style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.05, letterSpacing: '0.04em', paddingBottom: 6, background: 'linear-gradient(180deg,#ffffff 0%,#e5e7eb 35%,#9ca3af 50%,#f5f3ff 65%,#c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 18px #7c3aed88)' }}>APEX</h1>
          <div className="mt-3 h-[2px] w-40 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #a855f7, #e9d5ff, #a855f7, transparent)', boxShadow: '0 0 14px #a855f7' }} />
          <div className="mt-4 font-mono uppercase font-bold" style={{ fontSize: 15, letterSpacing: '0.42em', color: '#ddd6fe' }}>Powered by Startup Factory</div>
        </div>
        <div className="relative rounded-2xl px-6 py-3" style={{ background: 'linear-gradient(180deg,#ffffff,#ede9fe)', boxShadow: '0 0 0 1px #ffffff66, 0 0 40px #7c3aed88' }}><img src={sfhLogo} alt="Startup Factory Hub" className="h-10 w-auto object-contain" /></div>
      </section>
    ),
  },
  { key: 'about', node: <PartnersAboutPage /> },
  { key: 'ecosystem', node: <PartnersEcosystemPage /> },
  {
    key: 'summary',
    node: (
      <section className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(155deg,#050b16 0%,#08182a 45%,#04121b 100%)' }}>
        <div className="absolute inset-0 z-0 apex-globe">
          <BrochureResourceMap />
          <style>{`.apex-globe .mapboxgl-ctrl{display:none!important}`}</style>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(3,8,18,0.92) 0%, rgba(3,8,18,0.55) 34%, rgba(3,8,18,0.05) 55%, rgba(3,8,18,0.25) 78%, rgba(3,8,18,0.9) 100%)' }} />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-between pointer-events-none" style={{ padding: '6% 6% 4%' }}>
          <div>
            <div className="flex items-center justify-between font-mono uppercase" style={{ fontSize: 11, letterSpacing: '0.3em', color: '#67e8f9' }}>
              <span>SEC // 03 · Executive Summary</span>
              <img src={APEX_LOGO} alt="APEX Accelerators" className="h-6 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <h2 className="mt-4" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 38, fontWeight: 800, lineHeight: 1.04, color: '#f8fafc' }}>Acceleration at scale</h2>
            <p className="mt-3" style={{ fontSize: 14.5, lineHeight: 1.55, color: '#cbd5e1', maxWidth: '92%' }}>One platform for Apex: startups find resources, meet mentors, receive AI-driven strategy and follow a clear path from idea to investment, while Apex manages and measures the whole program.</p>
            <div className="mt-4 grid grid-cols-3" style={{ borderTop: '1px solid rgba(103,232,249,0.45)' }}>
              {[['Right resources, right time', 'The right resource to the right founder at the right moment.'], ['The right people', 'Mentors, advisors and investors who can help.'], ['Knowing what works', 'Visibility into progress, resource use and outcomes.']].map(([t, d], i) => (
                <div key={t} className="pt-2.5 pr-3" style={{ paddingLeft: i ? 12 : 0, borderLeft: i ? '1px solid rgba(255,255,255,0.12)' : undefined }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>{t}</div>
                  <div className="mt-1" style={{ fontSize: 11.5, lineHeight: 1.4, color: '#94a3b8' }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-5" style={{ borderTop: '1px solid rgba(103,232,249,0.45)' }}>
            {[['5,800', 'Office locations'], ['130', 'Countries'], ['1,500', 'U.S. locations'], ['350+', 'Network members'], ['04', 'Global hubs']].map(([v, l], i) => (
              <div key={l} className="pt-2.5" style={{ paddingLeft: i ? 10 : 0, borderLeft: i ? '1px solid rgba(255,255,255,0.12)' : undefined }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 800, lineHeight: 1, color: '#f8fafc' }}>{v}</div>
                <div className="mt-1 font-mono uppercase" style={{ fontSize: 9, letterSpacing: '0.16em', color: '#67e8f9' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),
  },
  {
    key: 'opportunity',
    node: (
      <FragmentedToolsPage total={TOTAL} />
    ),
  },
  {
    key: 'conclusion',
    node: <UnifiedPlatformPage logo={sfhLogo} url={CONTACT_URL} />,
  },
  ...FEATURES.flatMap((f, i) => f.no === '11' ? [] : f.no === '04' || f.no === '05' || f.no === '13'
    ? [{ key: `feature-${f.no}-${i}`, node: <TechFeaturePage f={f} index={i} total={TOTAL} part="main" /> },
       { key: `feature-${f.no}-${i}-detail`, node: <TechFeaturePage f={f} index={i} total={TOTAL} part="detail" /> }]
    : f.no === '12'
    ? [{ key: `feature-${f.no}-${i}`, node: <TechFeaturePage f={f} index={i} total={TOTAL} /> },
       { key: 'imagine-engine', node: <ApexImagineEnginePage total={TOTAL} /> }]
    : f.no === '06'
    ? [{ key: `feature-${f.no}-${i}`, node: <TechFeaturePage f={f} index={i} total={TOTAL} /> },
       { key: 'perks', node: <ApexPerksPage /> }]
    : [{ key: `feature-${f.no}-${i}`, node: f.no === '13' ? <EditorialPage f={f} total={TOTAL} /> : <TechFeaturePage f={f} index={i} total={TOTAL} /> }]),
  {
    key: 'how',
    node: <ValueForEveryonePage />,
  },
  {
    key: 'outcomes',
    node: (
      <Frame code="19" label="Expected Outcomes" accent={C.emerald}>
        <Title>What Apex can expect</Title>
        <Bullets items={[
          'Faster progression of startups through stages',
          'Higher resource utilization and partner engagement',
          'More effective, better-measured mentor engagement',
          'Better-prepared startups at the investment stage',
          'Clear, data-backed reporting on program impact',
          'Less administrative effort for Apex staff',
        ]} />
      </Frame>
    ),
  },
  {
    key: 'implementation',
    node: (
      <ApexRoadmapPage />
    ),
  },
  {
    key: 'next',
    node: <ApexNextStepsPage />,
  },
  {
    key: 'team',
    node: (
      <ApexTeamPage />
    ),
  },
  {
    key: 'ar-events',
    node: (<div className="relative w-full h-full overflow-hidden bg-white"><PartnersARPage /></div>),
  },
  {
    key: 'nasdaq',
    node: (<div className="relative w-full h-full overflow-hidden bg-white"><PartnersNasdaqPage /></div>),
  },
];
/** Back hard cover: same design as the front cover. */
PAGES.push({ key: 'back-cover', node: PAGES[0].node });


/* ---------- Page ---------- */
export default function ApexBrochure() {
  const navigate = useNavigate();
  const bookRef = useRef<any>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState({ w: 560, h: 792, spread: true });

  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'APEX Accelerators × Startup Factory Hub';
    const calc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight - 72;
      const spread = vw >= 1100;
      const maxW = spread ? (vw - 140) / 2 : vw - 24;
      const w = Math.floor(Math.min(maxW, vh / 1.414, 760));
      setSize({ w: Math.max(300, w), h: Math.max(424, Math.floor(Math.max(300, w) * 1.414)), spread });
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const go = useCallback((dir: 1 | -1) => {
    const f = bookRef.current?.pageFlip?.();
    if (!f) return;
    dir === 1 ? f.flipNext() : f.flipPrev();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(14,116,144,0.18) 0%, transparent 60%), linear-gradient(180deg,#0b1220 0%,#111a2e 100%)' }}>
      <div className="w-full flex items-center justify-between px-4 py-1.5">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ color: C.ink, background: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 }}>
          <Home className="h-4 w-4" />Home
        </button>
        <span className="font-mono" style={{ color: '#cbd5e1', fontSize: 14, fontWeight: 700, letterSpacing: '0.2em' }}>{page + 1} / {PAGES.length}</span>
      </div>
      <div className="flex-1 flex items-center justify-center w-full gap-3 px-2">
        <button aria-label="Previous page" onClick={() => go(-1)} className="hidden sm:flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.9)', color: C.ink }}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div ref={boxRef} style={{ width: size.spread ? size.w * 2 : size.w, maxWidth: '100%' }}>
          {/* @ts-expect-error react-pageflip typing requires every prop */}
          <HTMLFlipBook
            key={`${size.spread}-${size.w}`}
            ref={bookRef}
            width={size.w}
            height={size.h}
            size="fixed"
            showCover
            usePortrait={!size.spread}
            mobileScrollSupport
            drawShadow={size.spread}
            flippingTime={550}
            disableFlipByClick
            onFlip={(e: any) => setPage(e.data)}
            onChangeState={(e: any) => {
              const flipping = e.data !== 'read';
              boxRef.current?.classList.toggle('apex-flipping', flipping);
              window.dispatchEvent(new CustomEvent('sfh:flip-state', { detail: { flipping } }));
            }}
          >
            {PAGES.map((p, i) => (
              <BookPage key={p.key} hard={i === 0 || i === PAGES.length - 1}>
                <div className="relative w-full h-full">
                  <div data-bp-root={i} className="relative w-full h-full">{p.node}</div>
                </div>
              </BookPage>
            ))}
          </HTMLFlipBook>
        </div>
        <button aria-label="Next page" onClick={() => go(1)} className="hidden sm:flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.9)', color: C.ink }}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="flex sm:hidden gap-3 py-3">
        <button aria-label="Previous page" onClick={() => go(-1)} className="h-11 w-11 flex items-center justify-center rounded-full" style={{ background: '#ffffff', color: C.ink }}><ChevronLeft className="h-5 w-5" /></button>
        <button aria-label="Next page" onClick={() => go(1)} className="h-11 w-11 flex items-center justify-center rounded-full" style={{ background: '#ffffff', color: C.ink }}><ChevronRight className="h-5 w-5" /></button>
      </div>
    </div>
  );
}
