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
  { n: 'Khalia Padilla', r: 'Chief Executive Officer', img: khalia.url },
  { n: 'Ricardo Font', r: 'Chief Operating Officer', img: ricardo.url },
  { n: 'Dominic Catrambone', r: 'Chief Financial Officer', img: catrambone.url },
  { n: 'James Stuber', r: 'Legal', img: stuber.url },
  { n: 'N. MacDonnell Ulsch', r: 'Senior Advisor', img: ulsch.url },
];

const Member = ({ m, i, big }: { m: typeof TEAM[number]; i: number; big?: boolean }) => (
  <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(15,23,42,0.6)', boxShadow: '0 20px 40px -20px rgba(34,211,238,0.35)' }}>
    <div className="relative" style={{ aspectRatio: big ? '4 / 4.2' : '4 / 4.4' }}>
      <img src={m.img} alt={m.n} decoding="async" className="absolute inset-0 w-full h-full object-cover object-top" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 45%, rgba(5,9,20,0.95))' }} />
      <span className="absolute top-2 left-2 rounded px-1.5 py-0.5" style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.15em', color: CY, background: 'rgba(5,9,20,0.7)', border: `1px solid ${CY}55` }}>ID-0{i + 1}</span>
      <div className="absolute inset-x-3 bottom-2.5">
        <div style={{ fontSize: big ? 17 : 14.5, fontWeight: 800, color: '#f8fafc', lineHeight: 1.15 }}>{m.n}</div>
        <div style={{ fontFamily: MONO, fontSize: big ? 10.5 : 9.5, letterSpacing: '0.12em', color: PU, marginTop: 3, textTransform: 'uppercase' }}>{m.r}</div>
      </div>
    </div>
    <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${CY}, ${PU})` }} />
  </div>
);

export const ApexTeamPage = () => (
  <Shell code="22" label="Our Team">
    <h2 className="mt-5" style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.02em', color: '#f8fafc' }}>
      Startup Factory Hub<br /><span style={{ background: `linear-gradient(90deg, ${CY}, ${PU})`, WebkitBackgroundClip: 'text', color: 'transparent' }}>leadership</span>
    </h2>
    <p className="mt-2" style={{ fontSize: 15.5, color: '#94a3b8' }}>Who you will work with.</p>
    <div className="mt-5 grid grid-cols-2 gap-3">
      {TEAM.slice(0, 2).map((m, i) => <Member key={m.n} m={m} i={i} big />)}
    </div>
    <div className="mt-3 grid grid-cols-3 gap-3">
      {TEAM.slice(2).map((m, i) => <Member key={m.n} m={m} i={i + 2} />)}
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
    <h2 className="mt-5" style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.02em', color: '#f8fafc' }}>
      Implementation <span style={{ background: `linear-gradient(90deg, ${CY}, ${PU})`, WebkitBackgroundClip: 'text', color: 'transparent' }}>roadmap</span>
    </h2>
    <p className="mt-2" style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.45 }}>From a single-state pilot to nationwide adoption. Timelines, scope and commercial terms to be defined together with Apex.</p>
    <div className="relative mt-5 flex-1 flex flex-col gap-2.5">
      <div className="absolute top-3 bottom-3" style={{ left: 19, width: 2, background: `linear-gradient(180deg, ${CY}, ${PU})`, boxShadow: `0 0 12px ${CY}` }} />
      {PHASES.map((p, i) => (
        <div key={p.t} className="relative flex gap-4 items-stretch">
          <div className="relative z-10 shrink-0 h-10 w-10 rounded-full flex items-center justify-center" style={{ background: '#050914', border: `2px solid ${i % 2 ? PU : CY}`, boxShadow: `0 0 14px ${i % 2 ? PU : CY}88`, fontFamily: MONO, fontSize: 13, fontWeight: 700, color: i % 2 ? PU : CY }}>0{i + 1}</div>
          <div className="flex-1 rounded-xl px-4 py-2.5" style={{ background: 'rgba(15,23,42,0.65)', border: '1px solid rgba(148,163,184,0.2)' }}>
            <div className="flex items-baseline justify-between gap-2">
              <span style={{ fontSize: 17, fontWeight: 800, color: '#f8fafc' }}>{p.t}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: i % 2 ? PU : CY, textTransform: 'uppercase' }}>Phase {i + 1} · {p.tag}</span>
            </div>
            <div style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.4, marginTop: 2 }}>{p.d}</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {p.out.map((o) => <span key={o} className="rounded-full px-2 py-0.5" style={{ fontSize: 11, color: '#e2e8f0', background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.2)' }}>{o}</span>)}
            </div>
          </div>
        </div>
      ))}
    </div>
  </Shell>
);
