/**
 * APEX brochure — Leadership team and Implementation roadmap pages.
 * Dark HUD style with SFH cyan/purple accents.
 * Credits: Imagine Engine Studios Corp.
 */
import React from 'react';
import khalia from '@/assets/team-khalia-new.png.asset.json';
import ricardo from '@/assets/team-ricardo-new.png.asset.json';
import stuber from '@/assets/team-stuber.jpg.asset.json';
import catrambone from '@/assets/team-catrambone.png.asset.json';
import ulsch from '@/assets/team-ulsch.jpg.asset.json';

const SERIF = "'Playfair Display', Georgia, serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const CY = '#22d3ee';
const PU = '#a78bfa';

const Shell = ({ code, label, children }: { code: string; label: string; children: React.ReactNode }) => (
  <div className="relative w-full h-full overflow-hidden" style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(124,58,237,0.28), transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(34,211,238,0.18), transparent 50%), linear-gradient(180deg,#050914,#0b1324)', color: '#e2e8f0' }}>
    <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.18, backgroundImage: 'linear-gradient(rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px)', backgroundSize: '36px 36px', maskImage: 'linear-gradient(180deg, black, transparent 85%)' }} />
    <div className="relative h-full flex flex-col px-8 pt-7 pb-6">
      <div className="flex items-center justify-between" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em', color: '#94a3b8' }}>
        <span><span style={{ color: CY }}>SEC // {code}</span> · {label.toUpperCase()}</span>
        <span>APEX × SFH</span>
      </div>
      <div className="mt-2 h-px" style={{ background: `linear-gradient(90deg, ${CY}, ${PU}, transparent)` }} />
      {children}
    </div>
  </div>
);

const TEAM = [
  { n: 'Khalia Padilla', r: 'Chief Executive Officer', img: khalia.url, li: 'https://www.linkedin.com/in/khaliapadilla/', h: 'linkedin.com/in/khaliapadilla', bio: 'Founder & CEO, Imagine Engine venture studio. CEO & Co-Founder, Lightware Technologies (photonic networks). VC investor building AI-powered accelerators; former advisor, USF Muma Design Thinking Program.' },
  { n: 'Ricardo Font', r: 'Chief Operating Officer', img: ricardo.url, li: 'https://www.linkedin.com/in/ricardo-font-952034248/', h: 'linkedin.com/in/ricardo-font', bio: 'Chairman of the Board, Startup Factory Hub. Managing Partner, Decahedron Ventures. Business Advisor, Startupbootcamp. Physicist and inventor in photonics, aerospace and fintech.' },
  { n: 'Dominic Catrambone', r: 'Chief Financial Officer', img: catrambone.url, li: 'https://www.linkedin.com/in/dom-catrambone/', h: 'linkedin.com/in/dom-catrambone', bio: '40+ years of executive leadership in financial services, banking and investment management. Former CEO and President; founded an NYSE-listed ETF organization. Senior Strategy Consultant, Pathfinder.' },
  { n: 'James Stuber', r: 'Legal', img: stuber.url, li: 'https://www.linkedin.com/in/jamesstuber', h: 'linkedin.com/in/jamesstuber', bio: 'Attorney and entrepreneur, 40+ years. Founding Managing Partner, Security Capital Partners. Legislative Counsel, Coalition for a Prosperous America. Former Hogan & Hartson; Georgetown J.D.' },
  { n: 'N. MacDonnell Ulsch', r: 'Senior Advisor', img: ulsch.url, li: 'https://www.linkedin.com/in/n-macdonnell-ulsch-38abb21', h: 'linkedin.com/in/n-macdonnell-ulsch', bio: 'Cybersecurity and national security expert, 30+ years. Former Senior Managing Director, PwC; founder & CEO, ZeroPoint Risk Research. Guest Lecturer, West Point; Research Fellow, Boston College.' },
];

const Member = ({ m, i }: { m: typeof TEAM[number]; i: number }) => (
  <div className="relative flex-1 min-h-0 flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(15,23,42,0.62)', boxShadow: '0 14px 30px -18px rgba(34,211,238,0.4)' }}>
    <div className="relative shrink-0 h-full" style={{ aspectRatio: '1 / 1' }}>
      <img src={m.img} alt={m.n} decoding="async" className="absolute inset-0 w-full h-full object-cover object-top" />
      <div className="absolute inset-y-0 right-0 w-[3px]" style={{ background: `linear-gradient(180deg, ${CY}, ${PU})` }} />
    </div>
    <div className="min-w-0 flex-1 flex flex-col justify-center px-4 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span style={{ fontSize: 17, fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>{m.n}</span>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.15em', color: CY }}>ID-0{i + 1}</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.12em', color: PU, marginTop: 2, textTransform: 'uppercase' }}>{m.r}</div>
      <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.4, marginTop: 4 }}>{m.bio}</p>
      <a href={m.li} target="_blank" rel="noopener noreferrer" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="mt-1.5 inline-flex items-center gap-1.5 self-start" style={{ fontSize: 11, color: CY, textDecoration: 'none' }}>
        <span className="inline-flex items-center justify-center rounded-[3px]" style={{ width: 15, height: 15, background: CY, color: '#050914', fontSize: 9.5, fontWeight: 800 }}>in</span>
        <span style={{ fontFamily: MONO }}>{m.h}</span>
      </a>
    </div>
  </div>
);

export const ApexTeamPage = () => (
  <Shell code="22" label="Our Team">
    <h2 className="mt-4" style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.02em', color: '#f8fafc' }}>
      Startup Factory Hub <span style={{ background: `linear-gradient(90deg, ${CY}, ${PU})`, WebkitBackgroundClip: 'text', color: 'transparent' }}>leadership</span>
    </h2>
    <p className="mt-1" style={{ fontSize: 14.5, color: '#94a3b8' }}>Who you will work with.</p>
    <div className="mt-3 flex-1 min-h-0 flex flex-col gap-2">
      {TEAM.map((m, i) => <Member key={m.n} m={m} i={i} />)}
    </div>
  </Shell>
);

const PHASES = [
  { t: 'Setup', tag: 'Configure', d: 'Apex branding, resource library, mentor network and journey stages configured on the platform.', out: ['White-label platform', 'Resources loaded', 'Mentors onboarded'] },
  { t: 'Pilot', tag: 'One state', d: 'Launch in a single state with an initial cohort to validate the model in the field.', out: ['First cohort live', 'Feedback loop', 'AI recommendations tuned'] },
  { t: 'Scale', tag: 'All Apex', d: 'Extend to every Apex program, startup, mentor and partner.', out: ['All Apex centers', 'Shared reporting', 'Partner perks unlocked'] },
  { t: 'Nationwide', tag: 'Full adoption', d: 'Full nationwide adaptation across states and regions.', out: ['National coverage', 'Regional hubs', 'Unified analytics'] },
  { t: 'Optimize', tag: 'Continuous', d: 'Ongoing optimization and adjustment based on feedback and program data.', out: ['Impact reviews', 'Feature refinements', 'Expanded capabilities'] },
];

export const ApexRoadmapPage = () => (
  <Shell code="20" label="Proposed Implementation">
    <h2 className="mt-3" style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.02em', color: '#f8fafc' }}>
      Implementation <span style={{ background: `linear-gradient(90deg, ${CY}, ${PU})`, WebkitBackgroundClip: 'text', color: 'transparent' }}>roadmap</span>
    </h2>
    <p className="mt-1" style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.35 }}>From a single-state pilot to nationwide adoption. Timelines, scope and commercial terms to be defined together with Apex.</p>
    <div className="relative mt-3 flex-1 min-h-0 flex flex-col justify-between gap-1.5">
      <div className="absolute top-3 bottom-3" style={{ left: 17, width: 2, background: `linear-gradient(180deg, ${CY}, ${PU})`, boxShadow: `0 0 12px ${CY}` }} />
      {PHASES.map((p, i) => (
        <div key={p.t} className="relative flex gap-3 items-stretch min-h-0">
          <div className="relative z-10 shrink-0 h-9 w-9 rounded-full flex items-center justify-center" style={{ background: '#050914', border: `2px solid ${i % 2 ? PU : CY}`, boxShadow: `0 0 14px ${i % 2 ? PU : CY}88`, fontFamily: MONO, fontSize: 13, fontWeight: 700, color: i % 2 ? PU : CY }}>0{i + 1}</div>
          <div className="flex-1 min-w-0 rounded-xl px-3 py-1.5" style={{ background: 'rgba(15,23,42,0.65)', border: '1px solid rgba(148,163,184,0.2)' }}>
            <div className="flex items-baseline justify-between gap-2">
              <span style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>{p.t}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: i % 2 ? PU : CY, textTransform: 'uppercase' }}>Phase {i + 1} · {p.tag}</span>
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.3, marginTop: 1 }}>{p.d}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {p.out.map((o) => <span key={o} className="rounded-full px-2 py-px" style={{ fontSize: 10, color: '#e2e8f0', background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.2)' }}>{o}</span>)}
            </div>
          </div>
        </div>
      ))}
    </div>
  </Shell>
);
