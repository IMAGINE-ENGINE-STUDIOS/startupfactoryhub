/**
 * APEX proposal — the short proposal that opens the brochure,
 * followed by a divider introducing the supporting material.
 * Proposal text set by the founder 2026-11-03: Objective first, then the
 * APEX Accelerator — AI-Powered Innovation Ecosystem proposal with its
 * seven capabilities, then pricing, then why it matters.
 * Credits: Imagine Engine Studios Corp.
 */
import React from 'react';
import { APEX_LICENSING } from './licensing';

const SERIF = "'Playfair Display', Georgia, serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const P = '#6d28d9';
const INK = '#0f172a';
const BODY = '#334155';
const BG = 'linear-gradient(165deg,#f8fafc 0%,#eef0f6 55%,#e7e3f3 100%)';

const Shell = ({ no, label, children }: { no: string; label: string; children: React.ReactNode }) => (
  <section className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: BG, color: INK }}>
    <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${P}, #a78bfa, #cbd5e1)` }} />
    <div className="flex items-center justify-between px-[7%] pt-6" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.24em', color: '#64748b' }}>
      <span>THE PROPOSAL · {no}</span><span>{label}</span>
    </div>
    <div className="flex-1 min-h-0 flex flex-col px-[7%] pt-4 pb-6">{children}</div>
  </section>
);

/** Page 1 — the objective of the proposal (founder text, 2026-11-03). */
export const ProposalObjectivePage = () => (
  <Shell no="01" label="OBJECTIVE">
    <h2 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 800, lineHeight: 1.06 }}>Objective</h2>
    <p className="mt-5" style={{ fontSize: 16.5, lineHeight: 1.65, color: BODY }}>
      The objective of this proposal is to introduce Startup Factory Hub as a centralized, AI-powered innovation ecosystem designed to maximize the impact and effectiveness of APEX Accelerator&rsquo;s programs.
    </p>
    <p className="mt-4" style={{ fontSize: 16.5, lineHeight: 1.65, color: BODY }}>
      Our platform integrates technology, resources, expertise, and business opportunities into a single environment, empowering APEX counselors to deliver personalized support, streamline operations, and help clients navigate the journey from business readiness to government contracting and commercial growth.
    </p>
    <p className="mt-4" style={{ fontSize: 16.5, lineHeight: 1.65, color: BODY }}>
      By leveraging artificial intelligence to connect businesses with relevant funding, procurement opportunities, strategic partners, and specialized resources, Startup Factory Hub will strengthen APEX&rsquo;s ability to support entrepreneurs, accelerate innovation, and generate measurable economic impact.
    </p>
  </Shell>
);

/** Page 4 — why APEX should care. */
export const ProposalWhyPage = () => (
  <Shell no="04" label="WHY THIS MATTERS TO APEX">
    <h2 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 800, lineHeight: 1.06 }}>More businesses ready to compete, with the same counselors</h2>
    <p className="mt-4" style={{ fontSize: 15, lineHeight: 1.6, color: BODY }}>
      APEX Accelerators are the front door for American businesses entering government contracting, with more than 300 offices giving one-on-one help.
      That help is personal and valuable, but it is hard to scale: each counselor can only work with so many clients, and client progress lives in many separate places.
    </p>
    <div className="mt-5 grid grid-cols-1 gap-3">
      {[
        ['The challenge', 'Clients arrive at different stages of readiness. Counselors repeat the same groundwork, and offices see little of what happens between meetings.'],
        ['What we propose', 'An innovation platform built around what APEX already does, branded for APEX Accelerators and supporting the seven services APEX already delivers. Clients keep moving between sessions, and counselors spend their time where it matters most.'],
        ['What APEX gains', 'More clients served per counselor, a stronger pipeline of suppliers ready to compete and deliver, and clear reporting on progress across offices.'],
      ].map(([t, d]) => (
        <div key={t} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(15,23,42,0.08)', borderLeft: `3px solid ${P}` }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.2em', color: P, fontWeight: 700 }}>{t.toUpperCase()}</div>
          <p className="mt-1.5" style={{ fontSize: 14.5, lineHeight: 1.5, color: BODY }}>{d}</p>
        </div>
      ))}
    </div>
    <p className="mt-auto pt-4" style={{ fontSize: 13, color: '#64748b' }}>The pages that follow show how each of the seven APEX services is supported, how pricing is structured, and the supporting detail.</p>
  </Shell>
);

const SEVEN = [
  ['AI-Powered Business Readiness', 'Create a comprehensive digital profile for every client, identifying business capabilities, certifications, readiness gaps, and growth opportunities. AI-powered assessments help counselors deliver personalized guidance and track client progress.'],
  ['AI-Powered Opportunity & Grant Matching', 'Automatically match clients with relevant government grants, funding programs, procurement opportunities, and other resources based on their business profile, capabilities, eligibility, and strategic objectives.'],
  ['AI-Powered Government Contracting Readiness', 'Help clients assess their readiness to work with government agencies by identifying registration requirements, certifications, compliance gaps, and recommended next steps. Give counselors visibility into each client’s progress and readiness.'],
  ['AI-Powered Grant & Funding Intelligence', 'Identify relevant government grants, funding programs, and non-dilutive funding opportunities based on each client’s technology, business stage, eligibility, and development objectives. Help counselors connect clients with funding resources that support innovation and growth.'],
  ['Market Intelligence & Strategic Research', 'Provide AI-powered market research to identify target agencies, procurement trends, competitors, potential partners, and market opportunities aligned with each client’s products and services.'],
  ['Centralized Innovation Resources & Expert Network', 'Connect clients and counselors to a centralized ecosystem of mentors, advisors, technical experts, industry partners, and educational resources to support business development, commercialization, and growth.'],
  ['Client Progress & Impact Intelligence', 'Provide APEX counselors and program administrators with a centralized dashboard to monitor client progress, identify support needs, track milestones, and measure program outcomes. Turn client activity into actionable insights that help APEX improve service delivery and demonstrate its impact.'],
];

/** Page 2 — the proposal: title, promise, and its seven capabilities (founder text, 2026-11-03). */
export const ProposalSevenPage = () => (
  <Shell no="02" label="THE PROPOSAL">
    <h2 style={{ fontFamily: SERIF, fontSize: 31, fontWeight: 800, lineHeight: 1.08 }}>APEX Accelerator — AI-Powered Innovation Ecosystem</h2>
    <p className="mt-2" style={{ fontSize: 15.5, lineHeight: 1.45, color: P, fontWeight: 700 }}>One centralized platform. Smarter support. Better outcomes.</p>
    <p className="mt-2" style={{ fontSize: 13.5, lineHeight: 1.5, color: BODY }}>We don’t replace APEX counselors. We empower them and their clients with an AI-powered platform that centralizes resources, streamlines workflows, and connects businesses with the right opportunities, expertise, and support to accelerate their growth.</p>
    <div className="mt-3 flex-1 min-h-0 flex flex-col justify-between" style={{ borderTop: '1px solid rgba(15,23,42,0.12)' }}>
      {SEVEN.map(([t, d], i) => (
        <div key={t} className="flex gap-4 py-1.5" style={{ borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 800, color: P, width: 32, lineHeight: 1 }}>{i + 1}</div>
          <div className="flex-1">
            <div style={{ fontSize: 14.5, fontWeight: 800 }}>{t}</div>
            <div className="mt-0.5" style={{ fontSize: 12.8, lineHeight: 1.42, color: BODY }}>{d}</div>
          </div>
        </div>
      ))}
    </div>
  </Shell>
);

/** Page 3 — annual location licensing, additional AI credits and the next step. */
export const ProposalPricingPage = ({ url }: { url: string }) => (
  <Shell no="03" label="HOW PRICING IS STRUCTURED">
    <h2 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 800, lineHeight: 1.06 }}>Simple to start, grows with the program</h2>
    <div className="mt-4 grid grid-cols-2 gap-3">
      {[
        ['White-label and setup', 'One-time', `$${APEX_LICENSING.whiteLabelSetupUsd.toLocaleString('en-US')} to set up the APEX-branded platform.`],
        ['Platform license', 'Annual', `$${APEX_LICENSING.annualPriceUsd.toLocaleString('en-US')} per ${APEX_LICENSING.billingUnit} per year, covering counselors, clients and reporting.`],
        ['AI credits', 'Additional', APEX_LICENSING.aiCreditsIncluded ? 'Included in the annual APEX license.' : 'AI credits are purchased separately, in addition to the annual APEX license.'],
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
    <p className="mt-4" style={{ fontSize: 14, lineHeight: 1.5, color: BODY }}>${APEX_LICENSING.annualPriceUsd.toLocaleString('en-US')} per {APEX_LICENSING.billingPeriod} per {APEX_LICENSING.billingUnit}, plus AI credits and ${APEX_LICENSING.whiteLabelSetupUsd.toLocaleString('en-US')} for one-time white-label and setup.</p>
    <div className="mt-auto rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,#1e1033,#3b1d6e)', color: '#f5f3ff' }}>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.22em', color: '#c4b5fd' }}>PROPOSED NEXT STEP</div>
      <p className="mt-2" style={{ fontSize: 15, lineHeight: 1.5 }}>A 30-minute working session to pick the offices for the first phase and agree the scope.</p>
      <p className="mt-2" style={{ fontSize: 13, color: '#ddd6fe' }}>{url.replace('https://', '')}</p>
    </div>
  </Shell>
);

/** Divider — everything after this page is supporting material. */
export const SupportingDividerPage = () => (
  <section className="absolute inset-0 flex flex-col items-center justify-center text-center px-[10%]" style={{ background: 'linear-gradient(160deg,#07050f 0%,#140b2b 55%,#05040b 100%)', color: '#f5f3ff' }}>
    <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.4em', color: '#c4b5fd' }}>APPENDIX</div>
    <h2 className="mt-4" style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 800, lineHeight: 1.05 }}>Supporting material</h2>
    <div className="mt-4 h-[2px] w-32" style={{ background: 'linear-gradient(90deg, transparent, #a855f7, transparent)' }} />
    <p className="mt-5" style={{ fontSize: 15, lineHeight: 1.6, color: '#ddd6fe', maxWidth: '40ch' }}>Detail on the platform, its features, expected outcomes, the rollout plan and our team, for readers who want to go deeper.</p>
  </section>
);
