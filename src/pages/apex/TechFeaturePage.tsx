/**
 * APEX brochure — capability pages built on the Mentoring Platform design
 * template (tech header, outlined title, terminal panel, stat tiles, module
 * cards, footer strip). Every capability gets its own theme: background,
 * accents, pattern, title treatment and a special block where it helps
 * (resource map, journey stages, admin console, analytics indicators).
 * Copy comes from FEATURES in ApexEditorial so text stays in one place.
 * Credits: Imagine Engine Studios Corp.
 */
import React from 'react';
import {
  Layers, Users, Brain, Route, LayoutDashboard, Handshake, LineChart, Globe2, Landmark,
  BadgeDollarSign, PlaneLanding, FileBarChart, Boxes, ListChecks, Sparkles, Target, Activity,
  CalendarCheck, MessagesSquare, Star, Gauge, Building2, GraduationCap, FolderKanban, type LucideIcon,
} from 'lucide-react';
import type { Feature } from './ApexEditorial';
import { ScaledA4 } from './PartnersPages';

const APEX_LOGO = '/partners/apex-accelerators-logo.png';
const GROTESK = "'Space Grotesk', system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const TEXT = '#e2e8f0';
const DIM = '#94a3b8';
const FAINT = '#64748b';

type Pattern = 'grid' | 'dots' | 'diagonal' | 'rings' | 'lines' | 'hex';
type TitleStyle = 'outline' | 'gradient' | 'glow';
interface Theme {
  bg: string; panel: string; a: string; b: string; c: string; pattern: Pattern; title: TitleStyle;
  icon: LucideIcon; cmd: string; url: string; status: string;
}

const T = (bg: string, panel: string, a: string, b: string, c: string, pattern: Pattern, title: TitleStyle, icon: LucideIcon, cmd: string, url: string, status: string): Theme =>
  ({ bg, panel, a, b, c, pattern, title, icon, cmd, url, status });

/** One theme per FEATURES index (white-label page keeps its editorial design). */
export const THEMES: Theme[] = [
  T('radial-gradient(ellipse at 90% 0%, rgba(45,212,191,0.16) 0%, transparent 50%), linear-gradient(180deg,#04201f 0%,#03130f 100%)', 'rgba(6,46,42,0.72)', '#2dd4bf', '#a3e635', '#fbbf24', 'dots', 'outline', Layers, 'sfh resources --map --apex', 'resource_hub://map', 'INDEXED · FILTERED · MATCHED'),
  T('radial-gradient(ellipse at 10% 0%, rgba(129,140,248,0.18) 0%, transparent 50%), linear-gradient(180deg,#0b0f2e 0%,#060819 100%)', 'rgba(24,28,74,0.72)', '#818cf8', '#2dd4bf', '#f472b6', 'dots', 'gradient', Boxes, 'sfh resources --map --part 2', 'resource_hub://map/2', 'CONTRACTING · TRAINING · PERKS'),
  T('radial-gradient(ellipse at 85% 0%, rgba(34,211,238,0.10) 0%, transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(34,229,138,0.08) 0%, transparent 50%), linear-gradient(180deg,#0a1628 0%,#07101f 100%)', 'rgba(15,30,58,0.8)', '#22e58a', '#22d3ee', '#f59e0b', 'grid', 'outline', Users, 'sfh mentors --apex', 'mentor_network://overview', 'MANAGED · VISIBLE · MEASURED'),
  T('radial-gradient(circle at 80% 18%, rgba(192,132,252,0.22) 0%, transparent 42%), radial-gradient(circle at 0% 100%, rgba(236,72,153,0.14) 0%, transparent 45%), linear-gradient(180deg,#140726 0%,#0a0414 100%)', 'rgba(46,16,80,0.62)', '#c084fc', '#f472b6', '#38bdf8', 'rings', 'gradient', Brain, 'genius analyze --startup --stage', 'genius_ai://strategy', 'PROFILE · STAGE · NEXT ACTIONS'),
  T('radial-gradient(ellipse at 100% 0%, rgba(251,146,60,0.16) 0%, transparent 50%), linear-gradient(180deg,#0d1424 0%,#080c17 100%)', 'rgba(30,38,64,0.78)', '#fb923c', '#fbbf24', '#38bdf8', 'diagonal', 'outline', Route, 'sfh journey --stages 6 --trl', 'journey_map://roadmap', 'STAGES · MILESTONES · TRL'),
  T('radial-gradient(ellipse at 0% 0%, rgba(56,189,248,0.14) 0%, transparent 50%), linear-gradient(180deg,#111827 0%,#0a0f1a 100%)', 'rgba(31,41,55,0.82)', '#38bdf8', '#34d399', '#a78bfa', 'grid', 'glow', LayoutDashboard, 'sfh admin --console', 'apex_admin://console', 'NO TECHNICAL SUPPORT NEEDED'),
  T('radial-gradient(ellipse at 90% 10%, rgba(251,191,36,0.14) 0%, transparent 50%), linear-gradient(180deg,#2a0b17 0%,#16050c 100%)', 'rgba(74,18,40,0.62)', '#fbbf24', '#fb7185', '#f5d0fe', 'hex', 'gradient', Handshake, 'sfh partners --in-context', 'partner_perks://embedded', 'EMBEDDED · IN CONTEXT · MEASURED'),
  T('radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.2) 0%, transparent 55%), linear-gradient(180deg,#06122b 0%,#030916 100%)', 'rgba(14,34,78,0.72)', '#60a5fa', '#22d3ee', '#a3e635', 'lines', 'glow', LineChart, 'sfh analytics --live', 'ecosystem_data://live', 'LIVE · EVIDENCE · STAKEHOLDER READY'),
  T('radial-gradient(circle at 85% 20%, rgba(34,211,238,0.18) 0%, transparent 45%), linear-gradient(180deg,#02202b 0%,#011219 100%)', 'rgba(6,52,66,0.7)', '#22d3ee', '#5eead4', '#fde68a', 'dots', 'outline', Globe2, 'sfh spaces --countries 130', 'workspace_network://global', '5,800 LOCATIONS · ONE PROGRAM'),
  T('radial-gradient(ellipse at 100% 0%, rgba(234,179,8,0.16) 0%, transparent 50%), linear-gradient(180deg,#0c0c0e 0%,#050506 100%)', 'rgba(38,34,20,0.7)', '#eab308', '#fde68a', '#f97316', 'hex', 'gradient', Landmark, 'sfh investors --match --ready', 'investor_network://match', 'MATCHED · INTRODUCED · TRACKED'),
  T('radial-gradient(ellipse at 0% 0%, rgba(163,230,53,0.16) 0%, transparent 50%), linear-gradient(180deg,#071a0e 0%,#030d07 100%)', 'rgba(16,52,28,0.7)', '#a3e635', '#4ade80', '#facc15', 'diagonal', 'outline', BadgeDollarSign, 'genius grants --trl --industry', 'funding_ai://grants', 'NON-DILUTIVE · AI MATCHED'),
  T('radial-gradient(circle at 80% 10%, rgba(244,114,182,0.18) 0%, transparent 45%), radial-gradient(circle at 0% 100%, rgba(99,102,241,0.18) 0%, transparent 50%), linear-gradient(180deg,#120c2c 0%,#090617 100%)', 'rgba(40,28,84,0.66)', '#f472b6', '#818cf8', '#fcd34d', 'rings', 'glow', PlaneLanding, 'sfh softlanding --country', 'soft_landing://markets', 'NEW MARKET · SAME SUPPORT'),
  T('radial-gradient(ellipse at 100% 100%, rgba(52,211,153,0.16) 0%, transparent 50%), linear-gradient(180deg,#0e1512 0%,#070b09 100%)', 'rgba(24,40,33,0.78)', '#34d399', '#fb923c', '#e2e8f0', 'lines', 'gradient', FileBarChart, 'sfh impact --export', 'impact_report://export', 'COLLECTED LIVE · EXPORT READY'),
];

const patternStyle = (p: Pattern, color: string): React.CSSProperties => {
  switch (p) {
    case 'dots': return { backgroundImage: `radial-gradient(${color}22 1.2px, transparent 1.2px)`, backgroundSize: '22px 22px' };
    case 'diagonal': return { backgroundImage: `repeating-linear-gradient(135deg, ${color}0d 0 1px, transparent 1px 18px)` };
    case 'rings': return { backgroundImage: `repeating-radial-gradient(circle at 80% 18%, ${color}12 0 1px, transparent 1px 34px)` };
    case 'lines': return { backgroundImage: `linear-gradient(${color}10 1px, transparent 1px)`, backgroundSize: '100% 26px' };
    case 'hex': return { backgroundImage: `linear-gradient(30deg, ${color}0c 12%, transparent 12.5%, transparent 87%, ${color}0c 87.5%), linear-gradient(150deg, ${color}0c 12%, transparent 12.5%, transparent 87%, ${color}0c 87.5%), linear-gradient(90deg, ${color}08 2%, transparent 2.5%, transparent 97%, ${color}08 97.5%)`, backgroundSize: '40px 70px' };
    default: return { backgroundImage: 'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' };
  }
};

const BORDER = '1px solid rgba(148,163,184,0.16)';

const Kicker = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <div className="flex items-center gap-3" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.24em', color, textTransform: 'uppercase' }}>
    <span style={{ width: 32, height: 1, background: `${color}66` }} />{children}
  </div>
);

const splitTitle = (title: string): [string, string] => {
  if (title.includes(' of ')) { const [a, ...r] = title.split(' of '); return [`${a} of`, r.join(' of ')]; }
  const w = title.split(' ');
  const cut = Math.max(1, Math.floor(w.length / 2));
  return [w.slice(0, cut).join(' '), w.slice(cut).join(' ')];
};

const Title = ({ f, th }: { f: Feature; th: Theme }) => {
  const [l1, l2] = splitTitle(f.title);
  const longest = Math.max(l1.length, l2.length);
  const fs = Math.min(50, Math.floor(400 / (longest * 0.62)));
  const second: React.CSSProperties =
    th.title === 'outline' ? { color: 'transparent', WebkitTextStroke: `1.5px ${th.a}`, textShadow: `0 0 22px ${th.a}55` }
      : th.title === 'gradient' ? { background: `linear-gradient(90deg, ${th.a}, ${th.b})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
        : { color: th.a, textShadow: `0 0 18px ${th.a}88, 0 0 40px ${th.a}44` };
  return (
    <h1 className="mt-4" style={{ fontWeight: 700, fontSize: fs, lineHeight: 1, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
      <span style={{ color: '#ffffff' }}>{l1}</span><br /><span style={second}>{l2}</span>
    </h1>
  );
};

/* ---------------- Special blocks ---------------- */

const ResourceMap = ({ f, th }: { f: Feature; th: Theme }) => (
  <div className="grid grid-cols-3 gap-3 flex-1 min-h-0 content-start">
    {(f.map ?? []).map(([cat, items], i) => {
      const c = [th.a, th.b, th.c][i % 3];
      return (
        <div key={cat} className="rounded-xl p-4" style={{ background: th.panel, border: BORDER }}>
          <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.16em', color: c }}>
            <span>{String(i + 1).padStart(2, '0')} //</span>
            <span className="ml-auto rounded-full" style={{ width: 6, height: 6, background: c, boxShadow: `0 0 8px ${c}` }} />
          </div>
          <div className="mt-2" style={{ fontWeight: 700, fontSize: 19, lineHeight: 1.15, color: '#ffffff' }}>{cat}</div>
          <ul className="mt-2.5 flex flex-col gap-1">
            {items.map((t) => (
              <li key={t} className="flex items-start gap-2" style={{ fontSize: 15.5, lineHeight: 1.3, color: '#e2e8f0' }}>
                <span className="mt-[6px] shrink-0" style={{ width: 5, height: 5, background: c, borderRadius: 1 }} />{t}
              </li>
            ))}
          </ul>
        </div>
      );
    })}
  </div>
);

const STAGES: { name: string; trl: string; icon: LucideIcon; milestones: string[]; support: string }[] = [
  { name: 'Idea', trl: 'TRL 1–2', icon: Sparkles, milestones: ['Problem and customer discovery', 'Founding team and profile', 'Validation interviews'], support: 'Discovery guides, ideation mentors' },
  { name: 'MVP', trl: 'TRL 3–4', icon: Boxes, milestones: ['First prototype or product', 'Early user testing', 'Product roadmap'], support: 'Software credits, product mentors' },
  { name: 'Technology Readiness', trl: 'TRL 5–6', icon: Gauge, milestones: ['Lab and field validation', 'IP and certifications', 'Testing partners'], support: 'Labs, tech transfer, technical advisors' },
  { name: 'Commercialization', trl: 'TRL 7–8', icon: Target, milestones: ['Pilot customers', 'Pricing and go-to-market', 'Government contracting readiness'], support: 'APEX contracting support, sales mentors' },
  { name: 'Investment', trl: 'TRL 9', icon: Landmark, milestones: ['Pitch and data room', 'Investor matching', 'Grant applications'], support: 'Investor network, funding matching' },
  { name: 'Growth', trl: 'Scale', icon: LineChart, milestones: ['Hiring and operations', 'New markets', 'Partner programs'], support: 'Workspace network, soft-landing' },
];

const JourneyBlock = ({ th }: { th: Theme }) => (
  <div className="flex-1 min-h-0 flex flex-col">
    <div className="grid grid-cols-3 gap-3">
      {STAGES.map((s, i) => {
        const c = [th.a, th.b, th.c][i % 3];
        const Icon = s.icon;
        return (
          <div key={s.name} className="relative rounded-xl p-3" style={{ background: th.panel, border: BORDER }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center rounded-md" style={{ width: 28, height: 28, border: `1px solid ${c}55`, background: `${c}14` }}><Icon className="h-3.5 w-3.5" style={{ color: c }} /></div>
              <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.14em', color: c }}>STAGE {String(i + 1).padStart(2, '0')}</span>
              <span className="ml-auto rounded-full px-2 py-0.5" style={{ fontFamily: MONO, fontSize: 9.5, color: c, border: `1px solid ${c}55` }}>{s.trl}</span>
            </div>
            <div className="mt-2" style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.15, color: '#ffffff' }}>{s.name}</div>
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {s.milestones.map((m) => (
                <li key={m} className="flex items-start gap-1.5" style={{ fontSize: 13.5, lineHeight: 1.25, color: '#cbd5e1' }}>
                  <ListChecks className="h-3 w-3 mt-[2px] shrink-0" style={{ color: c }} />{m}
                </li>
              ))}
            </ul>
            <div className="mt-2 pt-1.5" style={{ borderTop: BORDER, fontFamily: MONO, fontSize: 12, color: DIM, lineHeight: 1.4 }}>{s.support}</div>
          </div>
        );
      })}
    </div>
  </div>
);

const AdminDashboard = ({ th }: { th: Theme }) => {
  const nav: [LucideIcon, string][] = [[LayoutDashboard, 'Overview'], [Layers, 'Resources'], [Users, 'Mentors & advisors'], [GraduationCap, 'Cohorts'], [Route, 'Pathways'], [Activity, 'Activity']];
  const kpis: [string, string, string][] = [['Active startups', '48', th.a], ['Mentors', '126', th.b], ['Cohorts', '3', th.c], ['Resources', '640', th.a]];
  const stages = [['Idea', 9], ['MVP', 12], ['Tech readiness', 8], ['Commercial', 10], ['Investment', 6], ['Growth', 3]] as const;
  const feed: [LucideIcon, string, string][] = [
    [GraduationCap, 'Spring cohort onboarded', '12 startups'], [Users, 'Mentor added', 'Aerospace · Propulsion'],
    [Route, 'Pathway assigned', 'Commercialization'],
  ];
  const max = Math.max(...stages.map((s) => s[1]));
  return (
    <div className="flex-1 min-h-0 rounded-xl overflow-hidden flex flex-col" style={{ background: '#0b111c', border: BORDER, boxShadow: '0 30px 60px -30px rgba(0,0,0,0.8)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: BORDER }}>
        {['#ef4444', '#f59e0b', '#22c55e'].map((c) => <span key={c} className="rounded-full" style={{ width: 8, height: 8, background: c }} />)}
        <span className="ml-3" style={{ fontFamily: MONO, fontSize: 10.5, color: DIM }}>apex.startupfactoryhub.com/admin</span>
        <span className="ml-auto rounded-full px-2 py-0.5" style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', color: th.c, border: `1px solid ${th.c}55` }}>SAMPLE VIEW</span>
      </div>
      <div className="flex-1 min-h-0 grid" style={{ gridTemplateColumns: '170px 1fr' }}>
        <aside className="p-3 flex flex-col gap-1" style={{ borderRight: BORDER, background: 'rgba(15,23,42,0.6)' }}>
          {nav.map(([Icon, l], i) => (
            <div key={l} className="flex items-center gap-2 rounded-md px-2.5 py-2" style={{ fontSize: 14, color: i === 0 ? '#ffffff' : DIM, background: i === 0 ? `${th.a}1f` : 'transparent', border: i === 0 ? `1px solid ${th.a}44` : '1px solid transparent' }}>
              <Icon className="h-3.5 w-3.5" style={{ color: i === 0 ? th.a : FAINT }} />{l}
            </div>
          ))}
        </aside>
        <div className="p-4 flex flex-col gap-3 min-h-0">
          <div className="grid grid-cols-4 gap-2">
            {kpis.map(([l, v, c]) => (
              <div key={l} className="rounded-lg p-2.5" style={{ background: 'rgba(30,41,59,0.6)', border: BORDER }}>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', color: DIM, textTransform: 'uppercase' }}>{l}</div>
                <div className="mt-1" style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: '#ffffff' }}>{v}</div>
                <div className="mt-1 h-[3px] rounded-full" style={{ background: c, width: '60%' }} />
              </div>
            ))}
          </div>
          <div className="grid gap-3 flex-1 min-h-0" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
            <div className="rounded-lg p-3 flex flex-col" style={{ background: 'rgba(30,41,59,0.6)', border: BORDER }}>
              <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.16em', color: DIM }}>STARTUPS BY JOURNEY STAGE</div>
              <div className="mt-2 flex-1 flex items-end gap-2">
                {stages.map(([l, v], i) => (
                  <div key={l} className="flex-1 flex flex-col items-center gap-1">
                    <span style={{ fontFamily: MONO, fontSize: 9.5, color: TEXT }}>{v}</span>
                    <div className="w-full rounded-t" style={{ height: `${(v / max) * 64}px`, background: `linear-gradient(180deg, ${[th.a, th.b, th.c][i % 3]}, ${[th.a, th.b, th.c][i % 3]}33)` }} />
                    <span style={{ fontSize: 8.5, color: DIM, textAlign: 'center', lineHeight: 1.1 }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'rgba(30,41,59,0.6)', border: BORDER }}>
              <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.16em', color: DIM }}>PROGRAM ACTIVITY</div>
              <div className="mt-2 flex flex-col gap-2">
                {feed.map(([Icon, t, d]) => (
                  <div key={t} className="flex items-center gap-2">
                    <div className="flex items-center justify-center rounded-md shrink-0" style={{ width: 24, height: 24, background: `${th.a}18` }}><Icon className="h-3 w-3" style={{ color: th.a }} /></div>
                    <div className="min-w-0"><div style={{ fontSize: 14, color: '#ffffff', lineHeight: 1.2 }}>{t}</div><div style={{ fontSize: 12.5, color: DIM }}>{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const INDICATORS: [string, number[]][] = [
  ['Industry growth trends', [3, 4, 4, 5, 6, 6, 7, 8]],
  ['Investment activity', [2, 3, 2, 4, 5, 4, 6, 7]],
  ['Resource allocation and utilization', [5, 5, 6, 6, 7, 7, 8, 8]],
  ['Stage progression', [1, 2, 3, 3, 4, 5, 6, 6]],
  ['Commercialization outcomes', [1, 1, 2, 2, 3, 4, 4, 5]],
];

const AnalyticsBlock = ({ th }: { th: Theme }) => (
  <div className="rounded-xl p-4 flex flex-col gap-2.5" style={{ background: th.panel, border: BORDER }}>
    <div className="flex items-center justify-between" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', color: DIM }}>
      <span>CORE INDICATORS // LIVE</span><span style={{ color: th.c }}>SAMPLE VIEW</span>
    </div>
    {INDICATORS.map(([l, pts], i) => {
      const c = [th.a, th.b, th.c][i % 3];
      const path = pts.map((v, j) => `${j === 0 ? 'M' : 'L'}${(j / (pts.length - 1)) * 160},${30 - v * 3.2}`).join(' ');
      return (
        <div key={l} className="flex items-center gap-3">
          <span style={{ fontFamily: MONO, fontSize: 10, color: c, width: 22 }}>{String(i + 1).padStart(2, '0')}</span>
          <span className="flex-1" style={{ fontSize: 17, color: '#ffffff' }}>{l}</span>
          <svg width="160" height="32" viewBox="0 0 160 32"><path d={path} fill="none" stroke={c} strokeWidth="2" /><path d={`${path} L160,32 L0,32 Z`} fill={`${c}22`} /></svg>
        </div>
      );
    })}
  </div>
);

/* ---------------- Page ---------------- */

const MODULE_ICONS: LucideIcon[][] = [
  [Layers, Target], [Boxes, Building2], [CalendarCheck, MessagesSquare], [Brain, Sparkles], [Route, Gauge],
  [FolderKanban, Activity], [Handshake, Star], [LineChart, FileBarChart], [Globe2, Building2], [Landmark, ListChecks],
  [BadgeDollarSign, Target], [PlaneLanding, Globe2], [FileBarChart, ListChecks],
];
const MENTOR_TAGS = ['PROFILES_AND_BOOKING', 'RECORDS_AND_FEEDBACK'];

export const TechFeaturePage = ({ f, index, total }: { f: Feature; index: number; total: string }) => {
  const th = THEMES[index] ?? THEMES[2];
  const Icon = th.icon;
  const accents = [th.a, th.b];
  const factIcons = [ListChecks, Star, Activity];
  const special = f.map ? 'map' : f.no === '04' ? 'journey' : f.no === '05' ? 'admin' : f.no === '07' ? 'analytics' : null;
  const tags = f.no === '02' ? MENTOR_TAGS : ['HOW_IT_WORKS', 'WHAT_APEX_GAINS'];
  const compact = special === 'journey' || special === 'admin' || special === 'analytics';

  return (
    <ScaledA4>
      <style>{`@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap");`}</style>
      <section className="absolute inset-0 overflow-hidden flex flex-col" style={{ background: th.bg, color: TEXT, fontFamily: GROTESK }}>
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${th.a}, ${th.b}, ${th.c}, transparent)` }} />
        <div className="absolute inset-0 pointer-events-none" style={patternStyle(th.pattern, th.a)} />

        <header className="relative flex items-center justify-between" style={{ padding: '30px 48px 22px', borderBottom: BORDER }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg" style={{ width: 34, height: 34, background: th.a, color: '#050a12', fontFamily: MONO, fontWeight: 700, fontSize: 14, boxShadow: `0 0 18px ${th.a}66` }}>SF</div>
            <div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 16, letterSpacing: '0.12em' }}>STARTUP FACTORY <span style={{ color: FAINT }}>//</span> HUB</div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', color: DIM }}>PROPOSAL TO APEX ACCELERATORS</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.2em', color: DIM, lineHeight: 1.7 }}>
              <div>CAPABILITY {f.no} / 13 // {f.section.toUpperCase()}</div>
              <div style={{ color: FAINT }}>EDITION 2026</div>
            </div>
            <img src={APEX_LOGO} alt="APEX Accelerators" className="h-8 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
        </header>

        <div className="relative flex-1 min-h-0 flex flex-col" style={{ padding: '26px 48px 24px' }}>
          {/* Hero */}
          <div className="grid gap-8" style={{ gridTemplateColumns: '1.1fr 1fr' }}>
            <div className="min-w-0">
              <Kicker color={th.b}>{f.section}</Kicker>
              <Title f={f} th={th} />
              <p className="mt-4" style={{ fontSize: 20, lineHeight: 1.5, color: '#e2e8f0' }}>{f.deck}</p>
              <div className="mt-4 inline-flex items-center gap-3 rounded-full px-4 py-2" style={{ border: `1px solid ${th.a}55`, background: `${th.a}12`, fontFamily: MONO, fontSize: 14.5, color: th.a }}>
                <span style={{ color: DIM }}>&gt;</span>{f.headline}
              </div>
            </div>
            <div className="relative rounded-xl self-start" style={{ background: 'rgba(5,10,20,0.75)', border: BORDER, boxShadow: `0 30px 60px -30px rgba(0,0,0,0.8), 0 0 40px ${th.a}10` }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: BORDER }}>
                {['#ef4444', '#f59e0b', '#22c55e'].map((c) => <span key={c} className="rounded-full" style={{ width: 9, height: 9, background: c }} />)}
                <span className="ml-3" style={{ fontFamily: MONO, fontSize: 11, color: DIM, letterSpacing: '0.06em' }}>{th.url}</span>
                <span className="ml-auto rounded-full" style={{ width: 7, height: 7, background: th.a, boxShadow: `0 0 8px ${th.a}` }} />
              </div>
              <div className="p-4">
                <div style={{ fontFamily: MONO, fontSize: 14, color: DIM }}><span style={{ color: th.a }}>$</span> {th.cmd}</div>
                <div className="mt-3 rounded-lg p-4" style={{ background: th.panel, border: BORDER }}>
                  <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.2em', color: th.b, textTransform: 'uppercase' }}><Icon className="h-3.5 w-3.5" />{f.section}</div>
                  <p className="mt-2" style={{ fontSize: 18, lineHeight: 1.5, color: TEXT }}>{f.lead || f.deck}</p>
                </div>
                <div className="mt-3 rounded-lg p-3" style={{ background: `${th.a}10`, border: `1px solid ${th.a}40` }}>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.18em', color: th.a }}>&#8627; {th.status}</div>
                </div>
              </div>
              <div className="absolute bottom-[-10px] left-4 rotate-[-2deg] z-10 rounded-full px-3 py-1" style={{ background: th.c, color: '#120c04', fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em' }}>APEX-READY</div>
            </div>
          </div>

          {f.facts.length > 0 && special !== 'journey' && special !== 'map' && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {f.facts.map(([v, l], i) => {
                const FI = factIcons[i] ?? ListChecks;
                return (
                  <div key={l} className="rounded-lg px-4 py-2.5" style={{ background: th.panel, border: BORDER }}>
                    <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', color: DIM, textTransform: 'uppercase' }}>
                      <FI className="h-3.5 w-3.5" style={{ color: accents[i % 2] }} />{l}
                    </div>
                    <div className="mt-1" style={{ fontFamily: MONO, fontWeight: 700, fontSize: 19, color: '#ffffff' }}>{v}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Body modules */}
          {f.body.length > 0 && (
            <>
              <div className={compact ? 'mt-5' : 'mt-6'}><Kicker color={DIM}>Core protocols // {String(f.body.length).padStart(2, '0')} modules</Kicker></div>
              <div className={`mt-3 grid grid-cols-2 gap-4 ${compact ? '' : 'flex-1 min-h-0'}`}>
                {f.body.map((p, i) => {
                  const MI = MODULE_ICONS[index]?.[i] ?? Users;
                  const c = accents[i % 2];
                  return (
                    <div key={i} className="relative rounded-xl flex flex-col" style={{ background: th.panel, border: BORDER, padding: compact ? 14 : 20 }}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center rounded-md" style={{ width: compact ? 28 : 34, height: compact ? 28 : 34, border: `1px solid ${c}55`, background: `${c}14` }}><MI className="h-4 w-4" style={{ color: c }} /></div>
                        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', color: c }}>{String(i + 1).padStart(2, '0')} // {tags[i] ?? ''}</span>
                        <span className="ml-auto rounded-full" style={{ width: 7, height: 7, background: c, boxShadow: `0 0 8px ${c}` }} />
                      </div>
                      <p className={compact ? 'mt-2.5' : 'mt-5'} style={{ fontSize: compact ? 17.5 : 23, lineHeight: 1.45, color: TEXT }}>{p}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {special && (
            <div className={`${special === 'map' ? 'mt-6' : 'mt-4'} flex-1 min-h-0 flex flex-col`}>
              {special === 'map' && <><Kicker color={DIM}>Resource map // {String(f.map!.length).padStart(2, '0')} categories</Kicker><div className="mt-3 flex-1 min-h-0 flex flex-col"><ResourceMap f={f} th={th} /></div></>}
              {special === 'journey' && <JourneyBlock th={th} />}
              {special === 'admin' && <AdminDashboard th={th} />}
              {special === 'analytics' && <AnalyticsBlock th={th} />}
            </div>
          )}

          {special !== 'journey' && <div className="mt-5 flex items-center gap-4 rounded-xl px-5 py-3.5" style={{ background: `${th.a}0f`, border: `1px solid ${th.a}40` }}>
            <div className="flex items-center justify-center rounded-md shrink-0" style={{ width: 30, height: 30, background: th.a }}><ListChecks className="h-4 w-4" style={{ color: '#050a12' }} /></div>
            <p style={{ fontFamily: MONO, fontSize: 16, letterSpacing: '0.02em', color: TEXT, lineHeight: 1.45 }}>{f.quote || th.status}</p>
          </div>}

          <footer className="mt-4 pt-3 flex justify-between" style={{ borderTop: BORDER, fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: FAINT, textTransform: 'uppercase' }}>
            <span><span style={{ color: th.a }}>startupfactoryhub.com</span> · Startup Factory Hub × APEX Accelerators</span>
            <span style={{ color: th.a, fontWeight: 700 }}>{total} pp.</span>
          </footer>
        </div>
      </section>
    </ScaledA4>
  );
};
