/**
 * Ecosystem Partners brochure — the white-label licensing proposal.
 * A copy of the APEX proposal (same design, same seven capabilities),
 * re-directed to general clients who want to license the Startup Factory
 * Hub platform under their own brand (founder, 2026-11-03).
 * APEX-specific wording (counselors, APEX programs) is swapped for the
 * general partner framing (your team, your members, your programs).
 * Pricing mirrors the APEX licensing figures with the unit generalized
 * to "organization" — founder to confirm.
 * Credits: Imagine Engine Studios Corp.
 */
import React from 'react';
import BrochureResourceMap from '@/components/brochure/BrochureResourceMap';

const SERIF = "'Playfair Display', Georgia, serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const P = '#6d28d9';
const INK = '#0f172a';
const BODY = '#334155';
const BG = 'linear-gradient(165deg,#f8fafc 0%,#eef0f6 55%,#e7e3f3 100%)';

export const PARTNER_URL = 'startupfactoryhub.com/ecosystempartners';

const Shell = ({ no, label, children }: { no: string; label: string; children: React.ReactNode }) => (
  <section className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: BG, color: INK }}>
    <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${P}, #a78bfa, #cbd5e1)` }} />
    <div className="flex items-center justify-between px-[7%] pt-6" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.24em', color: '#64748b' }}>
      <span>THE PROPOSAL · {no}</span><span>{label}</span>
    </div>
    <div className="flex-1 min-h-0 flex flex-col px-[7%] pt-4 pb-6">{children}</div>
  </section>
);

/** Cover — dark, in the spirit of the APEX cover. */
export const EcosystemCoverPage = () => (
  <section className="absolute inset-0 flex flex-col items-center justify-center text-center px-[9%] overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 40%, #7c3aed55 0%, transparent 55%), radial-gradient(ellipse at 15% 100%, #a855f733 0%, transparent 50%), linear-gradient(160deg,#07050f 0%,#140b2b 50%,#05040b 100%)', color: '#f5f3ff' }}>
    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.4em', color: '#c4b5fd' }}>A WHITE-LABEL PROPOSAL FOR</div>
    <h1 className="mt-5" style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 800, lineHeight: 1.04 }}>Ecosystem<br />Partners</h1>
    <div className="mt-5 h-[2px] w-32" style={{ background: 'linear-gradient(90deg, transparent, #a855f7, transparent)' }} />
    <p className="mt-5" style={{ fontSize: 17, lineHeight: 1.55, color: '#ddd6fe', maxWidth: '42ch' }}>License the Startup Factory Hub platform under your own brand — and run your own AI-powered innovation ecosystem.</p>
    <p className="mt-8" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.24em', color: '#a78bfa' }}>POWERED BY STARTUP FACTORY HUB · {PARTNER_URL.toUpperCase()}</p>
  </section>
);

/** Page 1 — the objective of the proposal. */
export const EcosystemObjectivePage = () => (
  <Shell no="01" label="OBJECTIVE">
    <h2 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 800, lineHeight: 1.06 }}>Objective</h2>
    <p className="mt-5" style={{ fontSize: 16.5, lineHeight: 1.65, color: BODY }}>
      The objective of this proposal is to introduce Startup Factory Hub as a centralized, AI-powered innovation ecosystem that your organization can license under its own brand — designed to maximize the impact and effectiveness of your programs.
    </p>
    <p className="mt-4" style={{ fontSize: 16.5, lineHeight: 1.65, color: BODY }}>
      Our platform integrates technology, resources, expertise, and business opportunities into a single environment, empowering your team to deliver personalized support, streamline operations, and help your members navigate the journey from business readiness to government contracting and commercial growth.
    </p>
    <p className="mt-4" style={{ fontSize: 16.5, lineHeight: 1.65, color: BODY }}>
      By leveraging artificial intelligence to connect businesses with relevant funding, procurement opportunities, strategic partners, and specialized resources, Startup Factory Hub will strengthen your ability to support entrepreneurs, accelerate innovation, and generate measurable economic impact.
    </p>
  </Shell>
);

const SEVEN = [
  ['AI-Powered Business Readiness', 'Create a comprehensive digital profile for every member, identifying business capabilities, certifications, readiness gaps, and growth opportunities. AI-powered assessments help your team deliver personalized guidance and track member progress.'],
  ['AI-Powered Opportunity & Grant Matching', 'Automatically match members with relevant government grants, funding programs, procurement opportunities, and other resources based on their business profile, capabilities, eligibility, and strategic objectives.'],
  ['AI-Powered Government Contracting Readiness', 'Help members assess their readiness to work with government agencies by identifying registration requirements, certifications, compliance gaps, and recommended next steps. Give your team visibility into each member’s progress and readiness.'],
  ['AI-Powered Grant & Funding Intelligence', 'Identify relevant government grants, funding programs, and non-dilutive funding opportunities based on each member’s technology, business stage, eligibility, and development objectives. Help your team connect members with funding resources that support innovation and growth.'],
  ['Market Intelligence & Strategic Research', 'Provide AI-powered market research to identify target agencies, procurement trends, competitors, potential partners, and market opportunities aligned with each member’s products and services.'],
  ['Centralized Innovation Resources & Expert Network', 'Connect members and your team to a centralized ecosystem of mentors, advisors, technical experts, industry partners, and educational resources to support business development, commercialization, and growth.'],
  ['Member Progress & Impact Intelligence', 'Provide your team and program administrators with a centralized dashboard to monitor member progress, identify support needs, track milestones, and measure program outcomes. Turn member activity into actionable insights that help you improve service delivery and demonstrate your impact.'],
];

const SevenRows = ({ items, from }: { items: typeof SEVEN; from: number }) => (
  <div className="flex-1 min-h-0 flex flex-col justify-between" style={{ borderTop: '1px solid rgba(15,23,42,0.12)' }}>
    {items.map(([t, d], i) => (
      <div key={t} className="flex gap-4 py-2.5" style={{ borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
        <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 800, color: P, width: 36, lineHeight: 1 }}>{from + i + 1}</div>
        <div className="flex-1">
          <div style={{ fontSize: 16, fontWeight: 800 }}>{t}</div>
          <div className="mt-1" style={{ fontSize: 13.8, lineHeight: 1.5, color: BODY }}>{d}</div>
        </div>
      </div>
    ))}
  </div>
);

/** Page 2 — the proposal opens: title, promise, intro, capabilities 1–4. */
export const EcosystemProposalPage = () => (
  <Shell no="02" label="THE PROPOSAL">
    <h2 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 800, lineHeight: 1.08 }}>Ecosystem Partners — AI-Powered Innovation Ecosystem</h2>
    <p className="mt-2" style={{ fontSize: 15.5, lineHeight: 1.45, color: P, fontWeight: 700 }}>One centralized platform. Smarter support. Better outcomes.</p>
    <p className="mt-2" style={{ fontSize: 13.8, lineHeight: 1.5, color: BODY }}>We don’t replace your team. We empower them and your members with an AI-powered platform that centralizes resources, streamlines workflows, and connects businesses with the right opportunities, expertise, and support to accelerate their growth.</p>
    <div className="mt-3 flex-1 min-h-0 flex flex-col">
      <SevenRows items={SEVEN.slice(0, 4)} from={0} />
    </div>
  </Shell>
);

/** Page 3 — the proposal continues: capabilities 5–7 and the closing line. */
export const EcosystemProposalMorePage = () => (
  <Shell no="03" label="THE PROPOSAL · CONTINUED">
    <div className="flex-1 min-h-0 flex flex-col">
      <SevenRows items={SEVEN.slice(4)} from={4} />
    </div>
    <div className="mt-5 rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#1e1033,#3b1d6e)', color: '#f5f3ff' }}>
      <p style={{ fontSize: 17, lineHeight: 1.45, fontWeight: 700 }}>One centralized platform. Smarter support. Better outcomes.</p>
      <p className="mt-1.5" style={{ fontSize: 13.5, lineHeight: 1.5, color: '#ddd6fe' }}>Seven capabilities, one ecosystem — under your brand, working for your team and the businesses you serve.</p>
    </div>
  </Shell>
);

const VIDEO_POINTS = [
  ['Rooms inside your platform', 'Meetings open on your own live video pages, branded for your ecosystem — no Zoom links, no Teams, nothing to install.'],
  ['Instant or scheduled', 'Start a room now, or book ahead from the calendar. Members join from their dashboard or a meeting link, and a dropped connection lets them straight back in.'],
  ['Screen sharing', 'Walk a member through a registration, a certification form, or a proposal draft — live, on the call.'],
  ['Chat, raise hand & reactions', 'Run one-on-one sessions, panels, and cohort events with order and real participation. Sessions run up to eight hours.'],
  ['Backgrounds & host controls', 'Virtual backgrounds and blur for a professional setting; hosts admit guests and manage the room.'],
  ['Recording, transcripts & notes', 'Sessions can be recorded, and the transcript and notes are saved to the member’s record — progress stays visible between meetings.'],
];

/** Page 4 — online video meetings, in the proposal's own style. */
export const EcosystemVideoPage = () => (
  <Shell no="04" label="ONLINE VIDEO MEETINGS">
    <h2 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 800, lineHeight: 1.08 }}>Online Video Meetings, Built In</h2>
    <p className="mt-2" style={{ fontSize: 13.8, lineHeight: 1.5, color: BODY }}>Your ecosystem meets face to face inside the platform — every meeting on your own live video, never on an outside tool.</p>
    <div className="mt-3 flex-1 min-h-0 flex flex-col justify-between" style={{ borderTop: '1px solid rgba(15,23,42,0.12)' }}>
      {VIDEO_POINTS.map(([t, d]) => (
        <div key={t} className="flex gap-4 py-2.5" style={{ borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
          <div className="flex-1">
            <div style={{ fontSize: 15.5, fontWeight: 800 }}>{t}</div>
            <div className="mt-0.5" style={{ fontSize: 13.5, lineHeight: 1.48, color: BODY }}>{d}</div>
          </div>
        </div>
      ))}
    </div>
  </Shell>
);

/** Page 5 — white-label licensing: setup, annual license, AI credits, next step. */
export const EcosystemPricingPage = () => (
  <Shell no="05" label="HOW PRICING IS STRUCTURED">
    <h2 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 800, lineHeight: 1.06 }}>Simple to start, grows with the program</h2>
    <div className="mt-4 grid grid-cols-2 gap-3">
      {[
        ['White-label and setup', 'One-time', '$10,000 to set up your branded platform — your name, your brand, your ecosystem.'],
        ['Platform license', 'Annual', '$950 per organization per year, covering your team, your members and reporting.'],
        ['AI credits', 'Additional', 'Purchased separately at the global price — $0.06 per Credit, and 1 Credit runs any AI action. An enterprise option is available.'],
      ].map(([t, k, d]) => (
        <div key={t} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(15,23,42,0.08)', borderTop: `3px solid ${P}` }}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
            <span style={{ fontSize: 16, fontWeight: 800 }}>{t}</span>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.16em', color: P }}>{k.toUpperCase()}</span>
          </div>
          <p className="mt-1.5" style={{ fontSize: 13.5, lineHeight: 1.45, color: BODY }}>{d}</p>
        </div>
      ))}
    </div>
    <p className="mt-4" style={{ fontSize: 14, lineHeight: 1.5, color: BODY }}>$950 per year per organization, plus AI credits at $0.06 per Credit (enterprise option available) and $10,000 for one-time white-label and setup.</p>
    <div className="mt-auto rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#1e1033,#3b1d6e)', color: '#f5f3ff' }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.22em', color: '#c4b5fd' }}>PROPOSED NEXT STEP</div>
      <p className="mt-2" style={{ fontSize: 15, lineHeight: 1.5 }}>A 30-minute working session to map your program onto the platform and agree the scope of your white-label launch.</p>
      <p className="mt-2" style={{ fontSize: 13, color: '#ddd6fe' }}>{PARTNER_URL}</p>
    </div>
  </Shell>
);

/** Page 6 — why this matters to a licensing partner. */
export const EcosystemWhyPage = () => (
  <Shell no="06" label="WHY THIS MATTERS TO YOU">
    <h2 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 800, lineHeight: 1.06 }}>More businesses ready to compete, with the same team</h2>
    <p className="mt-4" style={{ fontSize: 15, lineHeight: 1.6, color: BODY }}>
      Organizations like yours are the front door for businesses in your region and sector. That help is personal and valuable, but it is hard to scale: each advisor can only work with so many members, and member progress lives in many separate places.
    </p>
    <div className="mt-5 grid grid-cols-1 gap-3">
      {[
        ['The challenge', 'Members arrive at different stages of readiness. Your team repeats the same groundwork, and you see little of what happens between meetings.'],
        ['What we propose', 'An innovation platform built around what your organization already does, branded as your own and supporting the services you already deliver. Members keep moving between sessions, and your team spends its time where it matters most.'],
        ['What you gain', 'More members served per advisor, a stronger pipeline of businesses ready to compete and deliver, and clear reporting on progress across your whole program.'],
      ].map(([t, d]) => (
        <div key={t} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(15,23,42,0.08)', borderLeft: `3px solid ${P}` }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.2em', color: P, fontWeight: 700 }}>{t.toUpperCase()}</div>
          <p className="mt-1.5" style={{ fontSize: 14.5, lineHeight: 1.5, color: BODY }}>{d}</p>
        </div>
      ))}
    </div>
    <p className="mt-auto pt-4" style={{ fontSize: 13, color: '#64748b' }}>Everything runs under your brand — your members see your ecosystem, powered by Startup Factory Hub.</p>
  </Shell>
);

/** Executive summary — the APEX book's globe page, partner wording. */
export const EcosystemSummaryPage = () => (
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
          <span>ECOSYSTEM PARTNERS</span>
        </div>
        <h2 className="mt-4" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 800, lineHeight: 1.04, color: '#f8fafc' }}>Acceleration at scale</h2>
        <p className="mt-3" style={{ fontSize: 14.5, lineHeight: 1.55, color: '#cbd5e1', maxWidth: '92%' }}>One platform for your ecosystem: startups find resources, meet mentors, receive AI-driven strategy and follow a clear path from idea to investment, while you manage and measure the whole program.</p>
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
            <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 800, lineHeight: 1, color: '#f8fafc' }}>{v}</div>
            <div className="mt-1 font-mono uppercase" style={{ fontSize: 9, letterSpacing: '0.16em', color: '#67e8f9' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/** Closing page. */
export const EcosystemClosingPage = () => (
  <section className="absolute inset-0 flex flex-col items-center justify-center text-center px-[10%] overflow-hidden" style={{ background: 'linear-gradient(160deg,#07050f 0%,#140b2b 55%,#05040b 100%)', color: '#f5f3ff' }}>
    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.4em', color: '#c4b5fd' }}>NEXT STEP</div>
    <h2 className="mt-4" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 800, lineHeight: 1.08 }}>Launch your ecosystem</h2>
    <div className="mt-4 h-[2px] w-32" style={{ background: 'linear-gradient(90deg, transparent, #a855f7, transparent)' }} />
    <p className="mt-5" style={{ fontSize: 15.5, lineHeight: 1.6, color: '#ddd6fe', maxWidth: '44ch' }}>Book a 30-minute working session and we will map your program onto the platform — branding, members, and the scope of your white-label launch.</p>
    <p className="mt-6" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.24em', color: '#a78bfa' }}>{PARTNER_URL.toUpperCase()}</p>
  </section>
);
