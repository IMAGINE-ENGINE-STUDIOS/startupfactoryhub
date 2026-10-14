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
import sfhLogo from '@/assets/sfh-logo-combined.png';

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
const BookPage = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => (
  <div ref={ref} className="overflow-hidden" style={{ background: '#ffffff' }}>{children}</div>
));
BookPage.displayName = 'BookPage';

const Frame = ({ code, label, accent = C.teal, children }: {
  code: string; label: string; accent?: string; children: React.ReactNode;
}) => (
  <section className="absolute inset-0 flex flex-col" style={{ background: 'linear-gradient(180deg,#ffffff 0%,#f6f8fb 100%)', color: C.body }}>
    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${C.navy})` }} />
    <header className="flex items-center justify-between px-[6%] pt-[4%] pb-[2%]">
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold" style={{ color: accent, fontSize: 15, letterSpacing: '0.12em' }}>{code}</span>
        <span className="font-bold uppercase" style={{ color: C.muted, fontSize: 13, letterSpacing: '0.16em' }}>{label}</span>
      </div>
      <img src={APEX_LOGO} alt="APEX Accelerators" className="h-7 w-auto object-contain" />
    </header>
    <div className="flex-1 px-[6%] pb-[3%] flex flex-col gap-4 overflow-hidden">{children}</div>
    <footer className="flex items-center justify-between px-[6%] py-[2.5%] border-t" style={{ borderColor: C.line, fontSize: 12, color: C.muted }}>
      <span>Startup Factory Hub × APEX Accelerators</span>
      <span className="font-mono">{code} / {TOTAL}</span>
    </footer>
  </section>
);

const Title = ({ children, sub }: { children: React.ReactNode; sub?: string }) => (
  <div>
    <h2 style={{ color: C.ink, fontSize: 30, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.015em' }}>{children}</h2>
    {sub && <p className="mt-2" style={{ color: C.body, fontSize: 16.5, lineHeight: 1.55 }}>{sub}</p>}
  </div>
);

const Card = ({ icon: Icon, title, text, accent = C.teal }: {
  icon: React.ElementType; title: string; text: string; accent?: string;
}) => (
  <div className="rounded-xl p-4 flex gap-3" style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: '0 4px 16px -10px rgba(15,23,42,0.25)' }}>
    <div className="shrink-0 h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: `${accent}14`, color: accent }}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <h3 style={{ color: C.ink, fontSize: 17, fontWeight: 800, lineHeight: 1.25 }}>{title}</h3>
      <p className="mt-1" style={{ color: C.body, fontSize: 15, lineHeight: 1.5 }}>{text}</p>
    </div>
  </div>
);

const NeedSolve = ({ need, solve }: { need: string; solve: string }) => (
  <div className="grid grid-cols-2 gap-3 rounded-xl p-3.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
    <div>
      <div className="uppercase font-bold" style={{ fontSize: 11.5, letterSpacing: '0.14em', color: C.muted }}>APEX need</div>
      <p className="mt-1" style={{ fontSize: 15, lineHeight: 1.45, color: C.ink, fontWeight: 600 }}>{need}</p>
    </div>
    <div className="pl-3 border-l" style={{ borderColor: C.line }}>
      <div className="uppercase font-bold" style={{ fontSize: 11.5, letterSpacing: '0.14em', color: C.emerald }}>How we solve it</div>
      <p className="mt-1" style={{ fontSize: 15, lineHeight: 1.45, color: C.body }}>{solve}</p>
    </div>
  </div>
);

const Bullets = ({ items, accent = C.emerald }: { items: string[]; accent?: string }) => (
  <ul className="flex flex-col gap-2.5">
    {items.map((t) => (
      <li key={t} className="flex gap-2.5" style={{ fontSize: 15.5, lineHeight: 1.5, color: C.body }}>
        <Check className="h-5 w-5 shrink-0 mt-0.5" style={{ color: accent }} />
        <span>{t}</span>
      </li>
    ))}
  </ul>
);

/* ---------- Pages ---------- */
const TOTAL = '17';
const PAGES: { key: string; node: React.ReactNode }[] = [
  {
    key: 'cover',
    node: (
      <section className="absolute inset-0 flex flex-col items-center justify-center text-center px-[8%]" style={{ background: 'linear-gradient(180deg,#ffffff 0%,#eef3f8 100%)' }}>
        <div className="flex items-center gap-6 mb-10">
          <img src={sfhLogo} alt="Startup Factory Hub" className="h-14 w-auto object-contain" />
          <span style={{ color: C.muted, fontSize: 28, fontWeight: 300 }}>×</span>
          <img src={APEX_LOGO} alt="APEX Accelerators" className="h-14 w-auto object-contain" />
        </div>
        <div className="uppercase font-bold" style={{ color: C.teal, fontSize: 14, letterSpacing: '0.22em' }}>Partnership Proposal</div>
        <h1 className="mt-4" style={{ color: C.ink, fontSize: 44, fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em' }}>
          Apex's Innovation Platform
        </h1>
        <p className="mt-5 max-w-[85%]" style={{ color: C.body, fontSize: 18, lineHeight: 1.55 }}>
          One place where startups find resources, meet mentors, receive AI-driven strategy and follow a clear path from idea to investment, and where Apex manages and measures the whole program.
        </p>
        <div className="mt-10 uppercase" style={{ color: C.muted, fontSize: 12.5, letterSpacing: '0.18em' }}>Startup Factory Hub · Orlando, Florida</div>
      </section>
    ),
  },
  {
    key: 'summary',
    node: (
      <Frame code="01" label="Executive Summary">
        <Title sub="Apex accelerates startups, but acceleration at scale depends on three things. Startup Factory Hub is a single platform that does all three.">
          Acceleration at scale
        </Title>
        <Card icon={FolderOpen} title="Right resources, right time" text="Getting the right resource to the right founder at the right moment." />
        <Card icon={Users} title="The right people" text="Connecting founders with the mentors, advisors and investors who can help." accent={C.emerald} />
        <Card icon={BarChart3} title="Knowing what works" text="Clear visibility into progress, resource use and outcomes." accent={C.navy} />
      </Frame>
    ),
  },
  {
    key: 'opportunity',
    node: (
      <Frame code="02" label="The Opportunity" accent={C.navy}>
        <Title sub="Most accelerators run on fragmented tools: resources in shared drives, mentors scheduled over email, progress tracked in spreadsheets, and partner offers startups never find. This creates four problems.">
          The cost of fragmented tools
        </Title>
        <Bullets accent={C.navy} items={[
          'Founders lose time searching for resources and guidance instead of building.',
          'Mentor relationships are hard to manage, and their impact is hard to see.',
          'Guidance is generic rather than tailored to a startup\'s industry and stage.',
          'Apex has limited visibility into startup progress, resource use and outcomes.',
        ]} />
      </Frame>
    ),
  },
  {
    key: 'c1-2',
    node: (
      <Frame code="03" label="Capabilities 1 · 2">
        <Title sub="Thirteen capabilities, one platform.">Resources and mentors</Title>
        <Card icon={FolderOpen} title="1. Centralized Resource Hubs" text="Templates, toolkits, training, legal and financial guides, tools and funding information in one searchable hub, organized by industry, stage and need." />
        <Card icon={Users} title="2. Network of Mentors and Advisors" text="Profiles with expertise, industry and availability; built-in scheduling and calendars; meeting records and follow-ups; ratings and feedback so Apex sees which relationships create value." accent={C.emerald} />
      </Frame>
    ),
  },
  {
    key: 'c3',
    node: (
      <Frame code="04" label="Capability 3" accent={C.emerald}>
        <Title sub="Guidance matched to where each startup actually is.">AI-Powered Business and Strategic Intelligence</Title>
        <Card icon={Brain} title="Profile-aware AI" text="The AI analyzes each startup's profile and stage, across every industry, and suggests concrete next actions and strategies." accent={C.emerald} />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ background: `${C.teal}0f`, border: `1px solid ${C.teal}33` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.teal, letterSpacing: '0.1em' }} className="uppercase">Pre-seed hardware</div>
            <p className="mt-1" style={{ fontSize: 15, color: C.body, lineHeight: 1.45 }}>Validation, prototyping and readiness guidance.</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: `${C.navy}0f`, border: `1px solid ${C.navy}33` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, letterSpacing: '0.1em' }} className="uppercase">Growth fintech</div>
            <p className="mt-1" style={{ fontSize: 15, color: C.body, lineHeight: 1.45 }}>Scaling, market expansion and capital strategy.</p>
          </div>
        </div>
      </Frame>
    ),
  },
  {
    key: 'c4',
    node: (
      <Frame code="05" label="Capability 4 · Journey Mapping">
        <Title sub="Each stage has clear milestones, recommended resources and suggested mentors.">From idea to growth</Title>
        {[
          ['Idea', 'Problem validation, market research, concept definition'],
          ['MVP', 'Building and testing the first product'],
          ['Technology readiness', 'Maturing the technology through TRL stages'],
          ['Commercialization', 'Go-to-market, customers and revenue'],
          ['Investment', 'Investor readiness, fundraising, introductions'],
          ['Growth', 'Scaling operations, teams and markets'],
        ].map(([t, d], i) => (
          <div key={t} className="flex items-center gap-3 rounded-xl px-4 py-2.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <span className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-bold" style={{ background: `${C.teal}18`, color: C.teal, fontSize: 15 }}>{i + 1}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>{t}</div>
              <div style={{ fontSize: 14, color: C.body, lineHeight: 1.4 }}>{d}</div>
            </div>
          </div>
        ))}
      </Frame>
    ),
  },
  {
    key: 'c5-6',
    node: (
      <Frame code="06" label="Capabilities 5 · 6" accent={C.navy}>
        <Title>Run the program, with partners built in</Title>
        <Card icon={Settings} title="5. Administrator Management" text="A control center to add and update resources, manage mentors and advisors, onboard cohorts, assign startups to pathways and oversee activity, without technical support." accent={C.navy} />
        <Card icon={Handshake} title="6. Embedded Corporate Partner Resources" text="Partner offers, tools, credits and programs already integrated. Startups see them in context, at the stage where they matter. No integration work for Apex or partners." />
      </Frame>
    ),
  },
  {
    key: 'c7',
    node: (
      <Frame code="07" label="Capability 7 · Data Analytics" accent={C.emerald}>
        <Title sub="A live view of the ecosystem and the program, to guide decisions, report to stakeholders and show impact.">Data Analytics</Title>
        <Bullets items={[
          'Industry growth trends',
          'Investment activity',
          'Resource allocation and utilization',
          'Startup growth and stage progression',
          'Commercialization pathways and outcomes',
        ]} />
      </Frame>
    ),
  },
  {
    key: 'c8-11',
    node: (
      <Frame code="08" label="Capabilities 8 · 11">
        <Title sub="5,800 locations in 130 countries, including 1,500 in the United States.">Physical space and global soft-landing</Title>
        <Card icon={Building2} title="8. Space for national and international expansion" text="Open Apex hubs in new cities through one partner instead of site-by-site arrangements, and run the same program everywhere." />
        <Card icon={Globe} title="11. Global Soft-Landing" text="A startup can test and enter a new country from inside the Apex program, with local space and the same platform, mentors and resources." accent={C.emerald} />
      </Frame>
    ),
  },
  {
    key: 'c9-10',
    node: (
      <Frame code="09" label="Capabilities 9 · 10" accent={C.navy}>
        <Title>Investors and non-dilutive funding</Title>
        <Card icon={TrendingUp} title="9. Investor Network" text="Investor profiles with focus areas and stage preferences. Startups that reach the investment stage are connected to relevant investors, and Apex tracks introductions and outcomes." accent={C.navy} />
        <Card icon={Coins} title="10. AI Grant and Funding Matching" text="AI matches each startup to grants and non-dilutive funding by industry, stage and technology readiness. Apex sees how much funding startups pursue and win." />
      </Frame>
    ),
  },
  {
    key: 'c12-13',
    node: (
      <Frame code="10" label="Capabilities 12 · 13" accent={C.emerald}>
        <Title>Show impact, under Apex's brand</Title>
        <Card icon={FileText} title="12. Impact Reporting" text="Exportable reports for sponsors, government partners and investors: jobs created, capital raised, startups commercialized. No compiling data by hand." accent={C.emerald} />
        <Card icon={Award} title="13. White-Label Branding" text="The platform carries Apex's own branding, so startups, mentors and partners experience it as Apex's innovation platform." accent={C.navy} />
      </Frame>
    ),
  },
  {
    key: 'how',
    node: (
      <Frame code="11" label="How It Works for Apex">
        <Title>Value for everyone in the program</Title>
        <Card icon={Rocket} title="Startups" text="One login: a personalized journey, relevant resources, mentors and AI-suggested next steps." />
        <Card icon={GraduationCap} title="Mentors and advisors" text="Simple scheduling, clear context on each startup, recognition through ratings." accent={C.emerald} />
        <Card icon={Settings} title="Apex administrators" text="One place to run the program, manage resources and see what is working." accent={C.navy} />
        <Card icon={Handshake} title="Corporate partners" text="Visibility and engagement with startups, with no integration work." />
      </Frame>
    ),
  },
  {
    key: 'outcomes',
    node: (
      <Frame code="12" label="Expected Outcomes" accent={C.emerald}>
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
      <Frame code="13" label="Proposed Implementation" accent={C.navy}>
        <Title sub="Timelines, scope and commercial terms to be defined together with Apex.">Four phases</Title>
        {[
          ['Setup', 'Configure Apex branding, resource library, mentor network and journey stages'],
          ['Pilot', 'Launch with an initial cohort, gather feedback, tune the AI recommendations'],
          ['Rollout', 'Extend to all Apex startups, mentors and partners'],
          ['Optimize', 'Use analytics to refine the program and expand capabilities'],
        ].map(([t, d], i) => (
          <div key={t} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <span className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center font-bold" style={{ background: `${C.navy}14`, color: C.navy, fontSize: 16 }}>{i + 1}</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>{t}</div>
              <div style={{ fontSize: 14.5, color: C.body, lineHeight: 1.45 }}>{d}</div>
            </div>
          </div>
        ))}
      </Frame>
    ),
  },
  {
    key: 'next',
    node: (
      <Frame code="14" label="Next Steps">
        <Title>Getting started</Title>
        <Bullets accent={C.teal} items={[
          'Discovery session with the Apex team to confirm priorities and current resources',
          'Live platform demonstration',
          'Agree on the pilot scope and success metrics',
          'Finalize the partnership terms',
        ]} />
      </Frame>
    ),
  },
  {
    key: 'team',
    node: (
      <Frame code="15" label="Our Team" accent={C.emerald}>
        <Title sub="Who you will work with.">Startup Factory Hub leadership</Title>
        {[
          ['Khalia Padilla', 'Chief Executive Officer'],
          ['Ricardo Font', 'Chief Operating Officer'],
          ['James Stuber', 'Legal'],
          ['Dominic Catrambone', 'Chief Financial Officer'],
          ['N. MacDonnell Ulsch', 'Senior Advisor'],
        ].map(([n, r]) => (
          <div key={n} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>{n}</span>
            <span style={{ fontSize: 14.5, color: C.muted, fontWeight: 600 }}>{r}</span>
          </div>
        ))}
      </Frame>
    ),
  },
  {
    key: 'conclusion',
    node: (
      <Frame code="16" label="Conclusion">
        <Title sub="Centralized resources, a managed mentor network, AI-driven strategy, a clear path from idea to investment, powerful administration, embedded partner resources and real-time analytics. Together, we can help Apex's startups build faster and grow further.">
          One unified innovation platform
        </Title>
        <div className="flex items-center gap-5 rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="p-2 rounded-lg" style={{ background: '#ffffff', border: `1px solid ${C.line}` }}>
            <QRCodeSVG value={CONTACT_URL} size={110} />
          </div>
          <div className="flex flex-col gap-2">
            <span style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>Scan to open this proposal</span>
            <span className="flex items-center gap-2" style={{ fontSize: 15, color: C.body }}><Mail className="h-4 w-4" style={{ color: C.teal }} />startupfactoryhub.com</span>
          </div>
        </div>
      </Frame>
    ),
  },
];


/* ---------- Page ---------- */
export default function ApexBrochure() {
  const navigate = useNavigate();
  const bookRef = useRef<any>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState({ w: 560, h: 792, spread: true });

  useEffect(() => {
    document.title = 'APEX Accelerators × Startup Factory Hub';
    const calc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight - 140;
      const spread = vw >= 1100;
      const maxW = spread ? (vw - 80) / 2 : vw - 24;
      const w = Math.floor(Math.min(maxW, vh / 1.414, 620));
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
    <div className="min-h-screen w-full flex flex-col items-center" style={{ background: 'linear-gradient(180deg,#e9eef5 0%,#dfe6ef 100%)' }}>
      <div className="w-full flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ color: C.ink, background: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 }}>
          <Home className="h-4 w-4" />Home
        </button>
        <span style={{ color: C.muted, fontSize: 14, fontWeight: 700 }}>{page + 1} / {PAGES.length}</span>
      </div>
      <div className="flex-1 flex items-center justify-center w-full gap-3 px-2">
        <button aria-label="Previous page" onClick={() => go(-1)} className="hidden sm:flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.9)', color: C.ink }}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div style={{ width: size.spread ? size.w * 2 : size.w, maxWidth: '100%' }}>
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
          >
            {PAGES.map((p) => (
              <BookPage key={p.key}>
                <div className="relative w-full h-full">{p.node}</div>
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
