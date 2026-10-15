/**
 * APEX brochure — "Value for everyone in the program" (factory-module design).
 * Credits: Imagine Engine Studios Corp.
 */
import { Rocket, GraduationCap, SlidersHorizontal, Handshake } from 'lucide-react';

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SANS = "'Space Grotesk', system-ui, sans-serif";
const OR = '#FF5A1F';
const GR = '#00FF88';

const MODS = [
  { icon: Rocket, c: OR, title: 'Startups', tag: 'FOR STARTUPS', text: 'One login: a personalized journey, relevant resources, mentors and AI-suggested next steps.' },
  { icon: GraduationCap, c: '#22d3ee', title: 'Mentors and advisors', tag: 'FOR MENTORS', text: 'Simple scheduling, clear context on each startup, recognition through ratings.' },
  { icon: SlidersHorizontal, c: '#8b5cf6', title: 'Apex administrators', tag: 'FOR ADMINS', text: 'One place to run the program, manage resources and see what is working.' },
  { icon: Handshake, c: GR, title: 'Corporate partners', tag: 'FOR PARTNERS', text: 'Visibility and engagement with startups, with no integration work.' },
];

export const ValueForEveryonePage = () => (
  <section className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(255,90,31,0.10), transparent 50%), linear-gradient(180deg,#0b1220,#050A14)', color: '#e2e8f0', fontFamily: SANS }}>
    <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${OR}, #8b5cf6, ${GR})` }} />
    <div className="flex items-center justify-between px-[6%] py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: '#94a3b8' }}>
      <span>STARTUP FACTORY HUB × APEX</span>
      <span className="rounded-full px-3 py-1" style={{ background: OR, color: '#fff', boxShadow: `0 0 18px ${OR}66` }}>HOW IT WORKS · ECOSYSTEM</span>
      <span className="flex items-center gap-2">EDITION 2026<span className="w-1.5 h-1.5 rounded-full" style={{ background: GR }} /></span>
    </div>

    <div className="flex-1 min-h-0 flex flex-col px-[6%] pt-6 pb-4">
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: OR }}>— ECOSYSTEM VALUE // ALL STAKEHOLDERS —</div>
      <h2 className="mt-3" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 52, fontWeight: 800, lineHeight: 0.98, letterSpacing: '-0.03em', color: '#f8fafc' }}>
        Value for everyone<br /><span style={{ color: OR, textShadow: `0 0 20px ${OR}55` }}>in the program</span>
      </h2>
      <p className="mt-4" style={{ fontSize: 16, lineHeight: 1.5, color: '#94a3b8', maxWidth: '48ch' }}>One operating system. Four stakeholders. Designed as factory modules: clear, autonomous, connected.</p>

      <div className="mt-6 flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-4">
        {MODS.map((m, i) => (
          <div key={m.title} className="relative rounded-2xl flex flex-col p-5 overflow-hidden" style={{ background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(255,255,255,0.08)', borderTop: `2px solid ${m.c}` }}>
            <span className="absolute top-3 right-3 w-3.5 h-3.5" style={{ borderTop: `2px solid ${m.c}`, borderRight: `2px solid ${m.c}` }} />
            <span className="absolute bottom-3 left-3 w-3.5 h-3.5" style={{ borderBottom: `2px solid ${m.c}`, borderLeft: `2px solid ${m.c}` }} />
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center rounded-xl" style={{ width: 48, height: 48, background: `${m.c}18`, border: `1px solid ${m.c}44` }}>
                <m.icon className="h-6 w-6" style={{ color: m.c }} />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: GR, boxShadow: `0 0 8px ${GR}` }} />
              </div>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: '#64748b' }}>MOD_{String(i + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="mt-4" style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>{m.title}</h3>
            <p className="mt-2" style={{ fontSize: 16, lineHeight: 1.5, color: '#94a3b8' }}>{m.text}</p>
            <div className="mt-auto pt-3 flex items-center justify-between">
              <span className="rounded px-2 py-1" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: m.c, background: `${m.c}14`, border: `1px solid ${m.c}44` }}>{m.tag}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', color: '#475569' }}>LINK_ESTABLISHED —</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="flex items-center justify-between px-[6%] py-3" style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.06)', borderLeft: `3px solid ${OR}` }}>
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: '#94a3b8' }}>SFH OS <span style={{ color: OR }}>//</span> ONE LOGIN FOR ALL · <span style={{ color: GR }}>SYSTEMS NOMINAL</span></span>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>FUNDING <span style={{ color: OR }}>//</span> MENTORSHIP <span style={{ color: OR }}>//</span> RESOURCES <span style={{ color: OR }}>//</span> PARTNERS</span>
    </div>
  </section>
);
