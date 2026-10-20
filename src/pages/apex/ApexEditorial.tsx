/**
 * APEX brochure — editorial feature pages (newspaper / government proposal style)
 * and live embeds of original Partners brochure pages.
 * Credits: Imagine Engine Studios Corp.
 */
import React from 'react';

const APEX_LOGO = '/partners/apex-accelerators-logo.png';
const INK = '#0b1020';
const BODY = '#1e293b';
const MUTED = '#5b6478';
const PURPLE = '#6d28d9';
const TEAL = '#0e7490';
const RULE = 'rgba(11,16,32,0.85)';
const SERIF = "'Playfair Display', Georgia, serif";
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";

/** Shows a page of another brochure exactly as designed there. */
export const EmbeddedPage = ({ route, page, title }: { route: string; page: number; title: string }) => (
  <section className="absolute inset-0 overflow-hidden" style={{ background: '#ffffff' }}>
    <iframe
      src={`${route}?bsEmbed=${page}`}
      title={title}
      loading="eager"
      className="absolute inset-0 w-full h-full border-0"
      style={{ pointerEvents: 'none' }}
    />
  </section>
);

export interface Feature {
  no: string;
  title: string;
  map?: [string, string[]][];
  section: string;
  headline: string;
  deck: string;
  lead: string;
  body: string[];
  quote: string;
  facts: [string, string][];
}

export const FEATURES: Feature[] = [
  {
    no: '01', title: 'Centralized Resource Hubs', section: 'Resources',
    headline: 'Every resource a startup needs, mapped in one hub',
    deck: 'We map capital, programs, infrastructure and perks by industry, stage and need, so each founder sees what applies to them.',
    lead: '', body: [], quote: '',
    map: [
      ['Investors', ['Venture capital funds', 'Angel networks and syndicates', 'Corporate venture arms', 'Family offices']],
      ['Incubators and accelerators', ['University incubators', 'Cohort and corporate accelerators', 'Industry-specific programs', 'International soft-landing programs']],
      ['Labs', ['Research and national labs', 'University labs', 'Maker and hardware labs', 'Testing and prototyping facilities']],
      ['Technology transfer programs', ['University tech transfer offices', 'Federal lab licensing', 'Patent and IP licensing', 'Research commercialization grants']],
      ['Banks and lenders', ['Business banking', 'SBA-backed loans', 'Venture debt', 'Revenue-based financing']],
      ['Grants and public funding', ['SBIR and STTR', 'Federal agency grants', 'State and local economic development', 'Foundation grants']],
    ],
    facts: [['11', 'Resource categories'], ['3', 'Filters: industry, stage, need'], ['1', 'Searchable hub']],
  },
  {
    no: '01', title: 'Centralized Resource Hubs', section: 'Resources',
    headline: 'Contracting, training, perks, events and offices, in one hub',
    deck: 'The second half of our resource map: what founders need to sell to government, build skills, lower costs, meet the ecosystem and find a place to work.',
    lead: '', body: [], quote: '',
    map: [
      ['Government contracting', ['SAM.gov registration', 'Contract opportunities', 'Certifications and set-asides', 'Proposal preparation']],
      ['Programs and training', ['Courses and workshops', 'Pitch and investor readiness', 'Legal and financial guides', 'Templates and toolkits']],
      ['Partner perks', ['Cloud and software credits', 'Legal and accounting services', 'Marketing and sales tools', 'Workspace discounts']],
      ['Events', ['Pitch days and demo days', 'Investor and networking events', 'Industry days and conferences', 'Webinars and workshops']],
      ['Office spaces', ['Private offices', 'Coworking desks', 'Meeting rooms', 'Virtual offices and business addresses']],
    ],
    facts: [],
  },
  {
    no: '02', title: 'Network of Mentors and Advisors', section: 'Mentorship',
    headline: 'A mentor network that shows its value',
    deck: 'Profiles with expertise, industry and availability, scheduling built in, and feedback that proves which relationships work.',
    lead: 'Mentorship is the most valuable asset an accelerator has, and the hardest to measure. The platform turns it into a managed, visible program.',
    body: [
      'Mentors and advisors publish their expertise, industry and availability. Founders book directly through built-in calendars, without email chains.',
      'Meeting records, follow-ups, ratings and feedback are kept in one place, so APEX can see which relationships move companies forward.',
    ],
    quote: 'Every meeting recorded, every follow-up tracked, every outcome visible.',
    facts: [['Built-in', 'Scheduling and calendars'], ['Rated', 'Mentor feedback'], ['Tracked', 'Follow-ups']],
  },
  {
    no: '03', title: 'AI-Powered Business and Strategic Intelligence', section: 'Intelligence',
    headline: 'Strategy that knows where each company stands',
    deck: 'AI that reads each startup\u2019s profile and stage, across every industry, and suggests concrete next actions.',
    lead: 'Generic advice serves no one. A pre-seed hardware team and a growth-stage fintech need entirely different guidance, and the platform knows the difference.',
    body: [
      'The AI analyzes each company\u2019s profile, industry and stage, then recommends specific next steps, resources and strategies.',
      'Pre-seed hardware teams receive validation, prototyping and readiness guidance. Growth fintechs receive scaling, market-expansion and capital strategy.',
    ],
    quote: 'Guidance matched to where each startup actually is.',
    facts: [['Every', 'Industry covered'], ['Stage', 'Aware recommendations'], ['24/7', 'Availability']],
  },
  {
    no: '04', title: 'Journey Mapping', section: 'Journey',
    headline: 'A clear path from idea to growth',
    deck: 'Six stages, each with milestones, recommended resources and suggested mentors.',
    lead: 'Founders progress faster when they know what comes next. Journey Mapping makes the path explicit, from first idea to scaled operations.',
    body: [
      'Idea, MVP, Technology Readiness, Commercialization, Investment and Growth: each stage carries defined milestones and the resources that support them.',
      'Technology readiness is tracked through TRL stages, giving APEX and its government partners a common language for maturity.',
    ],
    quote: 'Each stage has milestones, resources and the right mentors attached.',
    facts: [['6', 'Journey stages'], ['TRL', 'Readiness tracking'], ['1', 'Shared roadmap']],
  },
  {
    no: '05', title: 'Administrator Management', section: 'Administration',
    headline: 'A control center for the whole program',
    deck: 'Add resources, manage mentors, onboard cohorts and assign pathways, without technical support.',
    lead: 'Program staff should run programs, not software. Administrator Management gives APEX one place to operate everything.',
    body: [
      'Staff add and update resources, manage mentors and advisors, onboard cohorts and assign startups to pathways from a single console.',
      'Activity across the program is visible at a glance, so administrators intervene where it matters instead of chasing status updates.',
    ],
    quote: 'One console to run the program, with no technical support needed.',
    facts: [['1', 'Control center'], ['0', 'Developers required'], ['All', 'Cohorts in one view']],
  },
  {
    no: '06', title: 'Embedded Corporate Partner Resources', section: 'Partners',
    headline: 'Corporate partner value, delivered in context',
    deck: 'Partner offers, tools, credits and programs integrated where founders need them.',
    lead: 'Partner perks often go unused because founders never find them. On the platform, they appear at the stage where they matter.',
    body: [
      'Offers, software credits and partner programs are already integrated. Founders see them in context, alongside the milestone they support.',
      'There is no integration work for APEX or for partners, and partners gain visibility and measurable engagement with qualified companies.',
    ],
    quote: 'Partner resources that founders actually find, and actually use.',
    facts: [['Embedded', 'Partner offers'], ['0', 'Integration work'], ['Measured', 'Engagement']],
  },
  {
    no: '07', title: 'Data Analytics', section: 'Analytics',
    headline: 'A live view of the ecosystem',
    deck: 'Data that guides decisions, informs stakeholders and demonstrates impact.',
    lead: 'Decisions about public programs deserve current data. Analytics gives APEX a continuous picture of the ecosystem and its own performance.',
    body: [
      'Industry growth trends, investment activity, resource allocation and utilization, stage progression and commercialization outcomes are tracked live.',
      'Leadership sees what is working, reallocates effort with evidence and reports to stakeholders without manual data collection.',
    ],
    quote: 'Evidence, not estimates, behind every program decision.',
    facts: [['5', 'Core indicators'], ['Live', 'Dashboards'], ['Ready', 'For stakeholders']],
  },
  {
    no: '08', title: 'Space for National and International Expansion', section: 'Expansion',
    headline: 'Space for national and international growth',
    deck: '5,800 locations in 130 countries, including 1,500 in the United States.',
    lead: 'Opening a new hub usually means site-by-site negotiation. Through one partner, APEX can operate in new cities and run the same program everywhere.',
    body: [
      'Access to a global network of flexible workspaces lets APEX extend its footprint without long leases or local procurement.',
      'Every location runs on the same platform, so founders in any city receive the same resources, mentors and standards.',
    ],
    quote: 'One partner, one program, thousands of locations.',
    facts: [['5,800', 'Locations'], ['130', 'Countries'], ['1,500', 'In the United States']],
  },
  {
    no: '09', title: 'Investor Network', section: 'Capital',
    headline: 'Investor-ready companies, matched to the right investors',
    deck: 'Investor profiles by focus area and stage, with introductions and outcomes tracked.',
    lead: 'When a company reaches the investment stage, the right introduction is decisive. The Investor Network makes that match deliberate.',
    body: [
      'Investors maintain profiles with focus areas and stage preferences. Startups that reach investment readiness are connected to relevant investors.',
      'APEX tracks every introduction and its outcome, building a record of capital mobilized through the program.',
    ],
    quote: 'Every introduction deliberate, every outcome on record.',
    facts: [['Focus', 'Matched profiles'], ['Stage', 'Preferences respected'], ['Tracked', 'Introductions']],
  },
  {
    no: '10', title: 'AI Grant and Funding Matching', section: 'Funding',
    headline: 'Non-dilutive funding, matched by AI',
    deck: 'Grants and non-dilutive programs matched by industry, stage and technology readiness.',
    lead: 'Grant opportunities are numerous and fragmented. AI matching puts the right programs in front of the right companies.',
    body: [
      'Each startup is matched to grants and non-dilutive funding according to its industry, stage and technology readiness level.',
      'APEX sees how much funding its companies pursue and win, a direct measure of the program\u2019s economic contribution.',
    ],
    quote: 'More founders pursuing, and winning, the funding they qualify for.',
    facts: [['AI', 'Grant matching'], ['TRL', 'Aware filters'], ['Visible', 'Funding won']],
  },
  {
    no: '11', title: 'Global Soft-Landing', section: 'Global',
    headline: 'A soft landing in any market',
    deck: 'Test and enter a new country from inside the APEX program.',
    lead: 'International expansion is risky for small companies. Global Soft-Landing lowers that risk by keeping founders inside a familiar program.',
    body: [
      'A startup can establish local presence in a new country with workspace, the same platform, mentors and resources it already uses.',
      'APEX extends its reach abroad while its companies keep continuity of support across borders.',
    ],
    quote: 'New markets, the same program, the same support.',
    facts: [['130', 'Countries reachable'], ['Same', 'Platform abroad'], ['Local', 'Workspace']],
  },
  {
    no: '12', title: 'Impact Reporting', section: 'Impact',
    headline: 'Impact reports, ready for sponsors and government',
    deck: 'Jobs created, capital raised and companies commercialized, exported on demand.',
    lead: 'Public programs answer to sponsors and government partners. Impact Reporting turns program activity into clear, exportable evidence.',
    body: [
      'Reports for sponsors, government partners and investors show jobs created, capital raised and startups commercialized.',
      'Data is collected as the program runs, so no one compiles spreadsheets by hand at the end of a reporting period.',
    ],
    quote: 'Accountability built into the platform, not added at year end.',
    facts: [['Jobs', 'Created'], ['Capital', 'Raised'], ['Export', 'On demand']],
  },
  {
    no: '13', title: 'White-Label Branding', section: 'Brand',
    headline: 'APEX\u2019s own innovation platform',
    deck: 'Full white-label branding for startups, mentors and partners.',
    lead: 'The platform carries the APEX name. Founders, mentors and partners experience it as APEX\u2019s innovation platform, end to end.',
    body: [
      'Branding, domain and identity reflect APEX throughout, reinforcing the institution\u2019s role at the center of its ecosystem.',
      'Startup Factory Hub operates the technology in the background, so APEX owns the relationship and the experience.',
    ],
    quote: 'APEX owns the experience. We power it.',
    facts: [['100%', 'APEX branding'], ['1', 'Unified identity'], ['0', 'Third-party logos']],
  },
];

export const EditorialPage = ({ f, total }: { f: Feature; total: string }) => (
  <section className="absolute inset-0 flex flex-col overflow-hidden" style={{
    background: `radial-gradient(ellipse at 100% 0%, ${PURPLE}12 0%, transparent 45%), linear-gradient(180deg,#fdfcf9 0%,#f4f2ec 100%)`,
    color: BODY, padding: '5% 6% 3.5%',
  }}>
    <div className="absolute inset-0 pointer-events-none" style={{
      backgroundImage: `linear-gradient(${PURPLE}0a 1px, transparent 1px), linear-gradient(90deg, ${PURPLE}0a 1px, transparent 1px)`,
      backgroundSize: '28px 28px', maskImage: 'linear-gradient(180deg, transparent, black 30%, transparent)',
      WebkitMaskImage: 'linear-gradient(180deg, transparent, black 30%, transparent)',
    }} />
    {/* Masthead */}
    <header className="relative">
      <div className="flex items-end justify-between pb-2">
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 21, color: INK, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{f.title}</div>
        <img src={APEX_LOGO} alt="APEX Accelerators" className="h-6 w-auto object-contain" />
      </div>
      <div style={{ height: 3, background: RULE }} />
      <div className="flex justify-between font-mono uppercase py-1.5" style={{ fontSize: 10, letterSpacing: '0.24em', color: MUTED }}>
        <span>Proposal to APEX Accelerators</span>
        <span style={{ color: PURPLE, fontWeight: 700 }}>Capability {f.no} / 13 · {f.section}</span>
        <span>Edition 2026</span>
      </div>
      <div style={{ height: 1, background: RULE }} />
    </header>

    {/* Headline */}
    <div className={f.map ? 'relative mt-3' : 'relative mt-5'}>
      <div className="font-mono uppercase font-bold" style={{ fontSize: 11, letterSpacing: '0.32em', color: TEAL }}>{f.section}</div>
      <h2 className="mt-2" style={{ fontFamily: SERIF, fontSize: f.map ? 25 : 31, fontWeight: 800, lineHeight: 1.05, color: INK, letterSpacing: '-0.015em' }}>{f.headline}</h2>
      <p className="mt-3 italic" style={{ fontFamily: SERIF, fontSize: f.map ? 13.5 : 15.5, lineHeight: 1.4, color: MUTED }}>{f.deck}</p>
      <div className="mt-4 h-[2px] w-24" style={{ background: `linear-gradient(90deg, ${PURPLE}, ${TEAL})` }} />
    </div>

    {f.map ? (
      <div className="relative mt-4 grid grid-cols-3 gap-x-5 gap-y-2.5 flex-1 min-h-0 overflow-hidden" style={{ fontFamily: SANS }}>
        {f.map.map(([cat, items], i) => (
          <div key={cat} className="pt-2" style={{ borderTop: `2px solid ${i % 3 === 1 ? PURPLE : INK}` }}>
            <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 800, color: INK, lineHeight: 1.15 }}>{cat}</div>
            <ul className="mt-1.5 flex flex-col">
              {items.map((t) => <li key={t} style={{ fontSize: 11.5, lineHeight: 1.3, color: BODY }}>{t}</li>)}
            </ul>
          </div>
        ))}
      </div>
    ) : (
    <div className="relative mt-4 grid grid-cols-2 gap-6 flex-1 min-h-0 overflow-hidden" style={{ fontFamily: SANS }}>
      <div className="min-w-0">
        <p style={{ fontSize: 14, lineHeight: 1.5, color: INK, fontWeight: 600 }}>
          <span className="float-left mr-2" style={{ fontFamily: SERIF, fontSize: 48, lineHeight: 0.85, fontWeight: 900, color: PURPLE }}>{f.lead[0]}</span>
          {f.lead.slice(1)}
        </p>
        <p className="mt-3 clear-both" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{f.body[0]}</p>
      </div>
      <div className="min-w-0 pl-6" style={{ borderLeft: '1px solid rgba(11,16,32,0.18)' }}>
        <p style={{ fontSize: 13.5, lineHeight: 1.5 }}>{f.body[1]}</p>
        <blockquote className="mt-4 py-3" style={{ borderTop: `2px solid ${INK}`, borderBottom: '1px solid rgba(11,16,32,0.25)' }}>
          <p style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.3, fontWeight: 700, fontStyle: 'italic', color: INK }}>&ldquo;{f.quote}&rdquo;</p>
        </blockquote>
      </div>
    </div>
    )}

    {/* Data strip */}
    {!f.map && <div className="relative grid grid-cols-3 mt-3" style={{ borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
      {f.facts.map(([v, l], i) => (
        <div key={l} className="py-3 px-3" style={{ borderLeft: i ? '1px solid rgba(11,16,32,0.18)' : undefined }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 900, lineHeight: 1, color: i === 1 ? PURPLE : INK }}>{v}</div>
          <div className="mt-1 font-mono uppercase" style={{ fontSize: 10, letterSpacing: '0.18em', color: MUTED }}>{l}</div>
        </div>
      ))}
    </div>}

    <footer className="relative flex justify-between font-mono uppercase pt-2" style={{ fontSize: 10, letterSpacing: '0.22em', color: MUTED }}>
      <span>Startup Factory Hub × APEX Accelerators</span>
      <span style={{ color: PURPLE, fontWeight: 700 }}>{total} pp.</span>
    </footer>
  </section>
);
