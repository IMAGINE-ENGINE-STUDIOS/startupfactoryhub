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
import { useBrochureEditor, BrochureEditorPanel, AddedImages, selectAddedImage } from '@/components/brochure-editor/BrochureEditor';
import visionHub from '@/assets/wtc-vision-hub-future.jpg.asset.json';

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
    {sub && <p className="mt-2" style={{ color: C.body, fontSize: 16.5, lineHeight: 1.55 }}>{sub}</p>}
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
const TOTAL = '18';
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
  {
    key: 'about',
    node: (
      <Frame code="01" label="About Startup Factory Hub">
        <style>{`@keyframes apex-partners-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
        <div className="flex-1 grid grid-cols-12 gap-0 min-h-0">
          <div className="col-span-7 flex flex-col justify-center pr-6 min-w-0">
            <span className="font-mono uppercase font-bold mb-3" style={{ fontSize: 13, letterSpacing: '0.3em', color: C.teal }}>About Startup Factory Hub</span>
            <h1 className="font-extrabold tracking-tight mb-5" style={{ fontSize: 34, lineHeight: 1.06, color: C.ink, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
              The Operating System for the Next{' '}
              <span style={{ background: `linear-gradient(135deg, ${C.teal} 0%, ${C.navy} 55%, ${C.emerald} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Generation</span>{' '}of Founders.
            </h1>
            <div className="flex gap-4">
              <div className="w-[5px] rounded-full shrink-0" style={{ background: `linear-gradient(180deg, ${C.teal}, ${C.navy}, ${C.emerald})` }} />
              <div>
                <p className="mb-4" style={{ fontSize: 17, lineHeight: 1.55, color: C.body }}>
                  Startup Factory Hub is the infrastructure layer for entrepreneurship in the AI era, connecting <b style={{ color: C.ink }}>founders, investors, mentors, advisors, accelerators</b> and <b style={{ color: C.ink }}>students</b> through an integrated AI-powered acceleration platform, strategic capital and a globally connected innovation network.
                </p>
                <div className="p-4 border-l-4" style={{ borderColor: C.ink, background: 'rgba(241,245,249,0.85)' }}>
                  <p className="italic font-medium" style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, lineHeight: 1.4, color: C.ink }}>
                    "Infrastructure is the new intellectual property. The platforms that accompany the founder's journey will define the future of innovation."
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-5 relative rounded-2xl overflow-hidden" style={{ boxShadow: '0 40px 80px -30px rgba(15,23,42,0.35)' }}>
            <img src={visionHub.url} alt="Startup Factory Hub innovation district" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.55) 70%, rgba(15,23,42,0.92) 100%), radial-gradient(ellipse at 70% 20%, ${C.teal}30 0%, transparent 55%)` }} />
            <div className="absolute inset-x-3 bottom-3 p-3 backdrop-blur-xl border rounded-xl" style={{ background: 'rgba(2,6,23,0.88)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="font-bold uppercase mb-2" style={{ fontSize: 10.5, letterSpacing: '0.22em', color: '#94a3b8' }}>The Platform by the Numbers</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {[['200+', 'Members', '#10b981'], ['40+', 'Startups Accelerated', '#22d3ee'], ['350+', 'Network Members', '#93c5fd'], ['04', 'Global Hubs', '#2dd4bf']].map(([v, l, c]) => (
                  <div key={l}>
                    <div className="font-extrabold" style={{ fontSize: 18, lineHeight: 1, color: '#fff' }}>{v}</div>
                    <div className="h-[2px] w-6 my-1" style={{ background: c }} />
                    <div className="uppercase font-bold leading-tight" style={{ fontSize: 10, letterSpacing: '0.1em', color: '#94a3b8' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden pt-3 border-t" style={{ borderColor: C.line }}>
          <div className="flex items-center" style={{ width: 'max-content', animation: 'apex-partners-scroll 50s linear infinite' }}>
            {[0, 1].flatMap((k) => [
              ['NASA', '/partners/nasa-logo.png'], ['NASA T2', '/partners/nasa-t2-logo.webp'], ['NVIDIA Inception', '/partners/nvidia-inception-logo.png'],
              ['GitHub', '/github-logo.png'], ['Nasdaq', '/nasdaq-logo.png'], ['IWG', '/partners/iwg-logo.png'], ['HSBC', '/partners/hsbc-logo.png'],
              ['Lehigh University', '/lehigh-university-logo.png'], ['MongoDB', '/mongodb-logo.webp'], ['F6S', '/partners/f6s-logo.png'],
            ].map(([n, l]) => <img key={k + n} src={l} alt={n} className="h-7 w-auto object-contain mx-6 opacity-80" />))}
          </div>
        </div>
      </Frame>
    ),
  },
  {
    key: 'summary',
    node: (
      <Frame code="02" label="Executive Summary">
        <div>
          <div className="h-[3px] w-16 mb-4 rounded-full" style={{ background: `linear-gradient(90deg, ${C.teal}, ${C.navy})`, boxShadow: `0 0 12px ${C.teal}66` }} />
          <h2 className="font-futuristic" style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.1, paddingBottom: 4, ...PLATINUM }}>Acceleration at scale</h2>
          <p className="mt-3" style={{ color: C.body, fontSize: 20, lineHeight: 1.55 }}>Apex accelerates startups, but acceleration at scale depends on three things. Startup Factory Hub is a single platform that does all three: Apex's Innovation Platform, where startups find resources, meet mentors, receive AI-driven strategy and follow a clear path from idea to investment, and where Apex manages and measures the whole program.</p>
        </div>
        {([[FolderOpen, 'Right resources, right time', 'Getting the right resource to the right founder at the right moment.', C.teal], [Users, 'The right people', 'Connecting founders with the mentors, advisors and investors who can help.', C.emerald], [BarChart3, 'Knowing what works', 'Clear visibility into progress, resource use and outcomes.', C.navy]] as const).map(([Icon, t, d, a]) => (
          <div key={t} className="relative rounded-2xl p-5 flex gap-4 items-center" style={glass}>
            <span className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg, transparent, ${a}, transparent)` }} />
            <div className="shrink-0 h-14 w-14 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${a}30, ${a}08)`, border: `1px solid ${a}55`, boxShadow: `0 0 16px ${a}33`, color: a }}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 style={{ color: C.ink, fontSize: 21, fontWeight: 800, lineHeight: 1.2 }}>{t}</h3>
              <p className="mt-1" style={{ color: C.body, fontSize: 17.5, lineHeight: 1.5 }}>{d}</p>
            </div>
          </div>
        ))}
      </Frame>
    ),
  },
  {
    key: 'opportunity',
    node: (
      <Frame code="03" label="The Opportunity" accent={C.navy}>
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
      <Frame code="04" label="Capabilities 1 · 2">
        <Title sub="Thirteen capabilities, one platform.">Resources and mentors</Title>
        <Card icon={FolderOpen} title="1. Centralized Resource Hubs" text="Templates, toolkits, training, legal and financial guides, tools and funding information in one searchable hub, organized by industry, stage and need." />
        <Card icon={Users} title="2. Network of Mentors and Advisors" text="Profiles with expertise, industry and availability; built-in scheduling and calendars; meeting records and follow-ups; ratings and feedback so Apex sees which relationships create value." accent={C.emerald} />
      </Frame>
    ),
  },
  {
    key: 'c3',
    node: (
      <Frame code="05" label="Capability 3" accent={C.emerald}>
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
      <Frame code="06" label="Capability 4 · Journey Mapping">
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
      <Frame code="07" label="Capabilities 5 · 6" accent={C.navy}>
        <Title>Run the program, with partners built in</Title>
        <Card icon={Settings} title="5. Administrator Management" text="A control center to add and update resources, manage mentors and advisors, onboard cohorts, assign startups to pathways and oversee activity, without technical support." accent={C.navy} />
        <Card icon={Handshake} title="6. Embedded Corporate Partner Resources" text="Partner offers, tools, credits and programs already integrated. Startups see them in context, at the stage where they matter. No integration work for Apex or partners." />
      </Frame>
    ),
  },
  {
    key: 'c7',
    node: (
      <Frame code="08" label="Capability 7 · Data Analytics" accent={C.emerald}>
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
      <Frame code="09" label="Capabilities 8 · 11">
        <Title sub="5,800 locations in 130 countries, including 1,500 in the United States.">Physical space and global soft-landing</Title>
        <Card icon={Building2} title="8. Space for national and international expansion" text="Open Apex hubs in new cities through one partner instead of site-by-site arrangements, and run the same program everywhere." />
        <Card icon={Globe} title="11. Global Soft-Landing" text="A startup can test and enter a new country from inside the Apex program, with local space and the same platform, mentors and resources." accent={C.emerald} />
      </Frame>
    ),
  },
  {
    key: 'c9-10',
    node: (
      <Frame code="10" label="Capabilities 9 · 10" accent={C.navy}>
        <Title>Investors and non-dilutive funding</Title>
        <Card icon={TrendingUp} title="9. Investor Network" text="Investor profiles with focus areas and stage preferences. Startups that reach the investment stage are connected to relevant investors, and Apex tracks introductions and outcomes." accent={C.navy} />
        <Card icon={Coins} title="10. AI Grant and Funding Matching" text="AI matches each startup to grants and non-dilutive funding by industry, stage and technology readiness. Apex sees how much funding startups pursue and win." />
      </Frame>
    ),
  },
  {
    key: 'c12-13',
    node: (
      <Frame code="11" label="Capabilities 12 · 13" accent={C.emerald}>
        <Title>Show impact, under Apex's brand</Title>
        <Card icon={FileText} title="12. Impact Reporting" text="Exportable reports for sponsors, government partners and investors: jobs created, capital raised, startups commercialized. No compiling data by hand." accent={C.emerald} />
        <Card icon={Award} title="13. White-Label Branding" text="The platform carries Apex's own branding, so startups, mentors and partners experience it as Apex's innovation platform." accent={C.navy} />
      </Frame>
    ),
  },
  {
    key: 'how',
    node: (
      <Frame code="12" label="How It Works for Apex">
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
      <Frame code="13" label="Expected Outcomes" accent={C.emerald}>
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
      <Frame code="14" label="Proposed Implementation" accent={C.navy}>
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
      <Frame code="15" label="Next Steps">
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
      <Frame code="16" label="Our Team" accent={C.emerald}>
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
      <Frame code="17" label="Conclusion">
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
  const ed = useBrochureEditor('apex');
  const boxRef = useRef<HTMLDivElement>(null);

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
    <div className="min-h-screen w-full flex flex-col items-center" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(14,116,144,0.18) 0%, transparent 60%), linear-gradient(180deg,#0b1220 0%,#111a2e 100%)' }}>
      <div className="w-full flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ color: C.ink, background: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 }}>
          <Home className="h-4 w-4" />Home
        </button>
        <BrochureEditorPanel ed={ed} slug="apex" boxRef={boxRef} page={page} />
        <span className="font-mono" style={{ color: '#cbd5e1', fontSize: 14, fontWeight: 700, letterSpacing: '0.2em' }}>{page + 1} / {PAGES.length}</span>
      </div>
      <div className="flex-1 flex items-center justify-center w-full gap-3 px-2">
        <button aria-label="Previous page" onClick={() => go(-1)} className="hidden sm:flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.9)', color: C.ink }}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div ref={boxRef} style={{ width: size.spread ? size.w * 2 : size.w, maxWidth: '100%' }}>
          {/* @ts-expect-error react-pageflip typing requires every prop */}
          <HTMLFlipBook
            key={`${size.spread}-${size.w}-${ed.editing}`}
            useMouseEvents={!ed.editing}
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
            {PAGES.map((p, i) => (
              <BookPage key={p.key}>
                <div className="relative w-full h-full">
                  <div data-bp-root={i} className="relative w-full h-full">{p.node}</div>
                  <AddedImages ed={ed} page={i} selected={null} onSelect={selectAddedImage} />
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
