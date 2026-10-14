/**
 * APEX brochure — "Network of Mentors and Advisors" page, built on the
 * Mentoring Platform design template (dark navy, neon green/cyan, terminal panel).
 * Copy comes from the feature entry in ApexEditorial so text stays in one place.
 * Credits: Imagine Engine Studios Corp.
 */
import React from 'react';
import { CalendarCheck, MessagesSquare, Users, Star, ListChecks } from 'lucide-react';
import type { Feature } from './ApexEditorial';
import { ScaledA4 } from './PartnersPages';

const APEX_LOGO = '/partners/apex-accelerators-logo.png';
const GREEN = '#22e58a';
const CYAN = '#22d3ee';
const AMBER = '#f59e0b';
const TEXT = '#e2e8f0';
const DIM = '#94a3b8';
const FAINT = '#64748b';
const GROTESK = "'Space Grotesk', system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const PANEL = 'linear-gradient(180deg, rgba(15,30,58,0.85) 0%, rgba(10,20,40,0.85) 100%)';
const BORDER = '1px solid rgba(148,163,184,0.16)';

const Kicker = ({ children, color = CYAN }: { children: React.ReactNode; color?: string }) => (
  <div className="flex items-center gap-3" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.24em', color, textTransform: 'uppercase' }}>
    <span style={{ width: 32, height: 1, background: `${color}66` }} />{children}
  </div>
);

export const MentorsPage = ({ f, total }: { f: Feature; total: string }) => {
  const [line1, ...rest] = f.title.split(' of ');
  const line2 = rest.join(' of ');
  const icons = [CalendarCheck, MessagesSquare];
  const accents = [GREEN, CYAN];
  const tags = ['01 // PROFILES_AND_BOOKING', '02 // RECORDS_AND_FEEDBACK'];
  const factIcons = [CalendarCheck, Star, ListChecks];

  return (
    <ScaledA4>
      <style>{`@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap");`}</style>
      <section className="absolute inset-0 overflow-hidden flex flex-col" style={{
        background: 'radial-gradient(ellipse at 85% 0%, rgba(34,211,238,0.10) 0%, transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(34,229,138,0.08) 0%, transparent 50%), linear-gradient(180deg,#0a1628 0%,#07101f 100%)',
        color: TEXT, fontFamily: GROTESK,
      }}>
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${GREEN}, ${CYAN}, ${AMBER}, transparent)` }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Header */}
        <header className="relative flex items-center justify-between" style={{ padding: '34px 48px 26px', borderBottom: BORDER }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg" style={{ width: 34, height: 34, background: GREEN, color: '#04210f', fontFamily: MONO, fontWeight: 700, fontSize: 14, boxShadow: `0 0 18px ${GREEN}66` }}>SF</div>
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

        <div className="relative flex-1 flex flex-col" style={{ padding: '30px 48px 28px' }}>
          {/* Hero */}
          <div className="grid gap-8" style={{ gridTemplateColumns: '1.1fr 1fr' }}>
            <div>
              <Kicker>{f.section}</Kicker>
              <h1 className="mt-4" style={{ fontWeight: 700, fontSize: 50, lineHeight: 0.98, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
                <span style={{ color: '#ffffff' }}>{line1}{line2 ? ' of' : ''}</span><br />
                <span style={{ color: 'transparent', WebkitTextStroke: `1.5px ${GREEN}`, textShadow: `0 0 22px ${GREEN}55` }}>{line2 || ''}</span>
              </h1>
              <p className="mt-5" style={{ fontSize: 16, lineHeight: 1.6, color: '#cbd5e1' }}>{f.deck}</p>
              <div className="mt-5 inline-flex items-center gap-3 rounded-full px-4 py-2" style={{ border: `1px solid ${GREEN}55`, background: `${GREEN}12`, fontFamily: MONO, fontSize: 12.5, color: GREEN }}>
                <span style={{ color: DIM }}>&gt;</span>{f.headline}
              </div>
            </div>

            {/* Terminal panel */}
            <div className="relative rounded-xl overflow-hidden self-start" style={{ background: '#0b1526', border: BORDER, boxShadow: '0 30px 60px -30px rgba(0,0,0,0.8), 0 0 40px rgba(34,211,238,0.06)' }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: BORDER }}>
                {['#ef4444', '#f59e0b', '#22c55e'].map((c) => <span key={c} className="rounded-full" style={{ width: 9, height: 9, background: c }} />)}
                <span className="ml-3" style={{ fontFamily: MONO, fontSize: 11, color: DIM, letterSpacing: '0.08em' }}>mentor_network://overview</span>
                <span className="ml-auto rounded-full" style={{ width: 7, height: 7, background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
              </div>
              <div className="p-4">
                <div style={{ fontFamily: MONO, fontSize: 12, color: DIM }}><span style={{ color: GREEN }}>$</span> sfh mentors --apex</div>
                <div className="mt-3 rounded-lg p-4" style={{ background: 'rgba(15,30,58,0.7)', border: BORDER }}>
                  <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.2em', color: CYAN }}><Users className="h-3.5 w-3.5" />MENTORSHIP</div>
                  <p className="mt-2" style={{ fontSize: 14.5, lineHeight: 1.55, color: TEXT }}>{f.lead}</p>
                </div>
                <div className="mt-3 rounded-lg p-3" style={{ background: `${GREEN}10`, border: `1px solid ${GREEN}40` }}>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.18em', color: GREEN }}>&#8627; MANAGED · VISIBLE · MEASURED</div>
                </div>
              </div>
              <div className="absolute -bottom-0 right-4 translate-y-[-8px] rotate-[-2deg] rounded-full px-3 py-1" style={{ background: AMBER, color: '#1c1206', fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em' }}>APEX-READY</div>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {f.facts.map(([v, l], i) => {
              const Icon = factIcons[i] ?? ListChecks;
              return (
                <div key={l} className="rounded-lg px-4 py-3" style={{ background: PANEL, border: BORDER }}>
                  <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.2em', color: DIM, textTransform: 'uppercase' }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: accents[i % 2] }} />{l}
                  </div>
                  <div className="mt-1" style={{ fontFamily: MONO, fontWeight: 700, fontSize: 20, color: '#ffffff' }}>{v}</div>
                </div>
              );
            })}
          </div>

          {/* Modules */}
          <div className="mt-7"><Kicker color={DIM}>Core protocols // {String(f.body.length).padStart(2, '0')} modules</Kicker></div>
          <div className="mt-4 grid grid-cols-2 gap-4 flex-1 min-h-0">
            {f.body.map((p, i) => {
              const Icon = icons[i] ?? Users;
              const c = accents[i % 2];
              return (
                <div key={i} className="relative rounded-xl p-5 flex flex-col" style={{ background: PANEL, border: BORDER }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-md" style={{ width: 34, height: 34, border: `1px solid ${c}55`, background: `${c}14` }}><Icon className="h-4 w-4" style={{ color: c }} /></div>
                    <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.14em', color: c }}>{tags[i] ?? ''}</span>
                    <span className="ml-auto rounded-full" style={{ width: 7, height: 7, background: c, boxShadow: `0 0 8px ${c}` }} />
                  </div>
                  <p className="mt-4" style={{ fontFamily: MONO, fontSize: 13.5, lineHeight: 1.65, color: '#cbd5e1' }}>{p}</p>
                </div>
              );
            })}
          </div>

          {/* Footer strip */}
          <div className="mt-6 flex items-center gap-4 rounded-xl px-5 py-4" style={{ background: `${GREEN}0f`, border: `1px solid ${GREEN}40` }}>
            <div className="flex items-center justify-center rounded-md shrink-0" style={{ width: 30, height: 30, background: GREEN }}><ListChecks className="h-4 w-4" style={{ color: '#04210f' }} /></div>
            <p style={{ fontFamily: MONO, fontSize: 13.5, letterSpacing: '0.04em', color: TEXT, lineHeight: 1.5 }}>{f.quote}</p>
          </div>

          <footer className="mt-5 pt-4 flex justify-between" style={{ borderTop: BORDER, fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: FAINT, textTransform: 'uppercase' }}>
            <span><span style={{ color: GREEN }}>startupfactoryhub.com</span> · Startup Factory Hub × APEX Accelerators</span>
            <span style={{ color: GREEN, fontWeight: 700 }}>{total} pp.</span>
          </footer>
        </div>
      </section>
    </ScaledA4>
  );
};
