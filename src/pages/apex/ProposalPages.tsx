/**
 * APEX proposal — the short proposal that opens the brochure (pages 2–4),
 * followed by a divider introducing the supporting material.
 * Aligned to the seven ways APEX Accelerators help businesses (apexaccelerators.us).
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

/** Page 1 — why APEX should care. */
export const ProposalWhyPage = () => (
  <Shell no="02" label="WHY THIS MATTERS TO APEX">
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
  ['Suitability Assessment', 'An online readiness profile for each client, so counselors start every first meeting already knowing the gaps.'],
  ['Networking', 'Matched introductions to prime contractors, mentors, advisors and investors across our network, plus events.'],
  ['Registration Assistance', 'A guided checklist in each client’s journey, with status visible to their counselor.'],
  ['Proposals', 'AI writing help and a shared document workspace for preparing solicitation packages with counselor review.'],
  ['Market Research', 'Strategic business intelligence tools that help clients see which agencies and markets fit their product or service.'],
  ['Centralized Resources & Strategic Business Intelligence', 'One place for resources, advisors and business intelligence to help counselors and clients make informed decisions.'],
  ['Bid Opportunity Identification', 'Opportunity updates matched to each client’s profile, set up with APEX during the setup phase.'],
];

/** Page 2 — the seven APEX services, and how the platform strengthens each. */
export const ProposalSevenPage = () => (
  <Shell no="04" label="ALIGNED TO THE SEVEN APEX SERVICES">
    <h2 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 800, lineHeight: 1.06 }}>An innovation platform built around what APEX already does</h2>
    <p className="mt-2" style={{ fontSize: 14, lineHeight: 1.5, color: BODY }}>We don’t replace counselors. We give them and their clients one place to carry each service forward.</p>
    <div className="mt-4 flex-1 min-h-0 flex flex-col justify-between" style={{ borderTop: '1px solid rgba(15,23,42,0.12)' }}>
      {SEVEN.map(([t, d], i) => (
        <div key={t} className="flex gap-4 py-2" style={{ borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
          <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 800, color: P, width: 34, lineHeight: 1 }}>{i + 1}</div>
          <div className="flex-1">
            <div style={{ fontSize: 15, fontWeight: 800 }}>{t}</div>
            <div className="mt-0.5" style={{ fontSize: 13.5, lineHeight: 1.45, color: BODY }}>{d}</div>
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
    <p className="mt-2" style={{ fontSize: 14, lineHeight: 1.5, color: BODY }}>${APEX_LICENSING.annualPriceUsd.toLocaleString('en-US')} per {APEX_LICENSING.billingPeriod} per {APEX_LICENSING.billingUnit}, plus AI credits and ${APEX_LICENSING.whiteLabelSetupUsd.toLocaleString('en-US')} for one-time white-label and setup.</p>
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
