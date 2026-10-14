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
  Building2, Rocket, Check, Mail, MapPin, Video,
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
      <span className="font-mono">{code} / 12</span>
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
          Helping more small businesses win government contracts
        </h1>
        <p className="mt-5 max-w-[85%]" style={{ color: C.body, fontSize: 18, lineHeight: 1.55 }}>
          A joint program that pairs APEX Accelerators' procurement expertise with Startup Factory Hub's AI accelerator, network and digital platform.
        </p>
        <div className="mt-10 uppercase" style={{ color: C.muted, fontSize: 12.5, letterSpacing: '0.18em' }}>Startup Factory Hub · Orlando, Florida</div>
      </section>
    ),
  },
  {
    key: 'summary',
    node: (
      <Frame code="01" label="Executive Summary">
        <Title sub="APEX Accelerators help businesses enter and succeed in the government marketplace. Many of the companies you serve are young, technical, and new to contracting. They need more than counseling sessions: they need a structured path, tools, and a network.">
          One shared goal
        </Title>
        <Card icon={Target} title="Your mission" text="Grow the defense and government industrial base by helping businesses find, compete for and perform on contracts." />
        <Card icon={Rocket} title="Our role" text="Turn early-stage companies into contract-ready businesses with a hybrid accelerator, AI tools and a live founder network." accent={C.emerald} />
        <Card icon={Handshake} title="Together" text="APEX counselors keep the procurement guidance. We supply cohorts, curriculum, software and visibility that extend your reach." accent={C.navy} />
      </Frame>
    ),
  },
  {
    key: 'needs',
    node: (
      <Frame code="02" label="APEX Needs">
        <Title sub="These are the most common gaps between a promising company and a winning bid.">The challenges we address</Title>
        <Bullets accent={C.teal} items={[
          'More qualified businesses to counsel, with limited counselor time.',
          'Founders with strong technology but no business or contracting foundation.',
          'Long, confusing path from registration to a first award.',
          'Weak capability statements, pitch materials and online presence.',
          'Cybersecurity and compliance readiness that starts too late.',
          'Few direct introductions to primes, investors and mentors.',
          'Hard to show measurable outcomes to stakeholders.',
        ]} />
      </Frame>
    ),
  },
  {
    key: 'pipeline',
    node: (
      <Frame code="03" label="Need 1 · Pipeline">
        <Title sub="We bring APEX a steady flow of prepared companies.">Finding and preparing more businesses</Title>
        <NeedSolve need="Reach more small and emerging businesses in the region." solve="Our cohorts, events and online community feed screened companies straight into APEX counseling." />
        <NeedSolve need="Clients arrive unprepared for procurement advice." solve="Founders complete business basics first: model, market, finances and pitch, so counseling time goes further." />
        <NeedSolve need="Limited counselor hours." solve="Group workshops and recorded sessions on our Live Video platform let one session serve many companies." />
      </Frame>
    ),
  },
  {
    key: 'readiness',
    node: (
      <Frame code="04" label="Need 2 · Contract Readiness" accent={C.emerald}>
        <Title sub="A clear, step-by-step track that companies follow alongside their APEX counselor.">From registration to first bid</Title>
        <Bullets items={[
          'Readiness checklist: business setup, registrations and certifications to review with APEX.',
          'Market research: identifying agencies and buyers that fit the company.',
          'Bid preparation: understanding solicitations and building a response plan.',
          'Teaming: finding partners and subcontracting opportunities through our network.',
          'Performance: building the team, processes and finances to deliver.',
        ]} />
        <p style={{ fontSize: 14, lineHeight: 1.5, color: C.muted }}>APEX remains the official source of procurement counseling; our track supports and reinforces it.</p>
      </Frame>
    ),
  },
  {
    key: 'ai',
    node: (
      <Frame code="05" label="Need 3 · Better Materials">
        <Title sub="Our AI tools help founders write clear, professional documents in hours instead of weeks.">AI that writes the first draft</Title>
        <Card icon={FileText} title="LightPaper documents" text="Guided AI writing for capability statements, company overviews and business plans, with live co-editing." />
        <Card icon={Brain} title="Genius AI assistant" text="Answers founder questions, reviews drafts and suggests improvements in plain language." accent={C.emerald} />
        <Card icon={Building2} title="Company pages & websites" text="A public company profile and website builder so buyers and primes can find and verify the business." accent={C.navy} />
      </Frame>
    ),
  },
  {
    key: 'compliance',
    node: (
      <Frame code="06" label="Need 4 · Compliance" accent={C.navy}>
        <Title sub="Compliance is easier when it starts on day one.">Cyber and compliance readiness</Title>
        <Card icon={ShieldCheck} title="Early awareness" text="Workshops introduce cybersecurity and compliance expectations for government work before companies bid." accent={C.navy} />
        <Card icon={GraduationCap} title="Expert sessions" text="Our advisors, including legal and security leadership, run focused sessions on contracts, data protection and risk." />
        <Card icon={Check} title="Referral back to APEX" text="Companies leave each session with action items to bring to their APEX counselor." accent={C.emerald} />
      </Frame>
    ),
  },
  {
    key: 'network',
    node: (
      <Frame code="07" label="Need 5 · Connections">
        <Title sub="Winning work often starts with the right introduction.">A network that opens doors</Title>
        <Card icon={Network} title="Matching" text="Our platform matches founders with mentors, investors and partners based on real profile data." />
        <Card icon={Users} title="Mentors & advisors" text="Experienced operators help with strategy, finance, legal and growth." accent={C.emerald} />
        <Card icon={CalendarDays} title="Events & industry days" text="Pitch days, networking nights and partner events across Central Florida and online." accent={C.navy} />
      </Frame>
    ),
  },
  {
    key: 'platform',
    node: (
      <Frame code="08" label="The Platform" accent={C.emerald}>
        <Title sub="Everything runs on one platform that APEX counselors and founders can share.">One place for the whole program</Title>
        <Bullets items={[
          'Cohort dashboards showing each company\'s progress.',
          'Meeting scheduling and video rooms for counseling and workshops.',
          'Document signing and shared files.',
          'Community feed, groups and direct messaging.',
          'Resource map of local programs, spaces and partners.',
        ]} />
        <div className="flex gap-3 mt-1">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: `${C.teal}12`, color: C.teal, fontSize: 14, fontWeight: 700 }}><Video className="h-4 w-4" />Live Video</div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: `${C.emerald}12`, color: C.emerald, fontSize: 14, fontWeight: 700 }}><MapPin className="h-4 w-4" />Resource Map</div>
        </div>
      </Frame>
    ),
  },
  {
    key: 'outcomes',
    node: (
      <Frame code="09" label="Need 6 · Outcomes" accent={C.navy}>
        <Title sub="We track real results so APEX can report them with confidence.">Measurable impact</Title>
        <Card icon={BarChart3} title="What we measure" text="Companies enrolled, readiness milestones completed, bids submitted, awards won, jobs and capital raised." accent={C.navy} />
        <Card icon={FileText} title="Shared reports" text="Regular cohort reports for APEX leadership and stakeholders, based only on data the companies report." />
        <Card icon={Target} title="Targets set together" text="We agree goals with APEX at the start of each cohort and review them at the end." accent={C.emerald} />
      </Frame>
    ),
  },
  {
    key: 'model',
    node: (
      <Frame code="10" label="How We Work Together">
        <Title sub="A simple, low-risk way to start.">Partnership model</Title>
        <Bullets accent={C.teal} items={[
          'Step 1 — Intro meeting to align goals, region and target industries.',
          'Step 2 — Pilot cohort with co-branded outreach and joint workshops.',
          'Step 3 — Shared reporting on readiness and contract results.',
          'Step 4 — Expand to recurring cohorts and new regions.',
        ]} />
        <div className="rounded-xl p-4" style={{ background: `${C.teal}0f`, border: `1px solid ${C.teal}33` }}>
          <p style={{ fontSize: 15.5, lineHeight: 1.5, color: C.ink, fontWeight: 600 }}>Each partnership is tailored. Terms are agreed directly with the APEX team.</p>
        </div>
      </Frame>
    ),
  },
  {
    key: 'team',
    node: (
      <Frame code="11" label="Our Team" accent={C.emerald}>
        <Title sub="Operators, legal and finance leaders who build and support startups every day.">Who you will work with</Title>
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
    key: 'contact',
    node: (
      <Frame code="12" label="Next Step">
        <Title sub="Let's plan a pilot cohort for the businesses APEX serves.">Start the conversation</Title>
        <div className="flex items-center gap-5 rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
          <div className="p-2 rounded-lg" style={{ background: '#ffffff', border: `1px solid ${C.line}` }}>
            <QRCodeSVG value={CONTACT_URL} size={110} />
          </div>
          <div className="flex flex-col gap-2">
            <span style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>Scan to open this proposal</span>
            <span className="flex items-center gap-2" style={{ fontSize: 15, color: C.body }}><Mail className="h-4 w-4" style={{ color: C.teal }} />startupfactoryhub.com</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
          APEX Accelerators is a program of the U.S. Department of Defense Office of Small Business Programs. This proposal does not imply endorsement.
        </p>
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
