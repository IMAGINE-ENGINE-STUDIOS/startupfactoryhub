/**
 * APEX brochure — "What APEX can expect" (premium outcomes design, silver edition).
 * Credits: Imagine Engine Studios Corp.
 */
import { Check } from 'lucide-react';

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SANS = "'Inter', system-ui, sans-serif";
const OR = '#FF5A1F';
const GR = '#059669';
const INK = '#0f172a';

const ITEMS: [string, string][] = [
  ['Faster', 'progression of startups through stages'],
  ['Higher', 'resource utilization and partner engagement'],
  ['More', 'effective, better-measured mentor engagement'],
  ['Better-prepared', 'startups at the investment stage'],
  ['Clear,', 'data-backed reporting on program impact'],
  ['Less', 'administrative effort for APEX staff'],
  ['Industry analytics', 'showing which sectors and technologies startups work in'],
  ['Demographics', 'of founders and teams across every program'],
  ['Regional insights', 'on where startups, mentors and partners are located'],
];

export const ExpectedOutcomesPage = () => (
  <section className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(160deg,#f8fafc 0%,#e2e8f0 38%,#cbd5e1 70%,#e5e7eb 100%)', color: INK, fontFamily: SANS }}>
    <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 85% 0%, rgba(255,255,255,0.9), transparent 55%), repeating-linear-gradient(90deg, rgba(15,23,42,0.025) 0 1px, transparent 1px 22px)' }} />
    <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${OR}, #94a3b8, ${GR})` }} />
    <span className="absolute pointer-events-none" style={{ right: '5%', top: 70, fontSize: 150, fontWeight: 800, lineHeight: 1, color: 'rgba(15,23,42,0.05)' }}>19</span>

    <div className="relative flex items-center justify-between px-[6%] py-4" style={{ borderBottom: '1px solid rgba(15,23,42,0.1)', fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: '#64748b' }}>
      <span className="flex items-center gap-2" style={{ color: GR }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: GR }} />SEC <span style={{ color: OR }}>//</span> 19</span>
      <span>EXPECTED OUTCOMES</span>
      <span style={{ fontFamily: SANS, letterSpacing: '0.04em', fontSize: 12 }}><b style={{ color: INK }}>APEX</b> ACCELERATORS</span>
    </div>

    <div className="relative flex-1 min-h-0 flex flex-col px-[7%] pt-6 pb-4">
      <div className="h-[3px] w-10 rounded-full" style={{ background: `linear-gradient(90deg, ${OR}, ${GR})` }} />
      <div className="mt-4" style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.2em', color: GR }}>— SEC // 19 — EXPECTED OUTCOMES</div>
      <h2 className="mt-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 44, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: INK }}>
        What <span style={{ color: OR }}>APEX</span> can expect
      </h2>
      <div className="mt-4 h-px" style={{ background: 'rgba(15,23,42,0.12)' }} />

      <div className="mt-3 flex-1 min-h-0 flex flex-col gap-2">
        {ITEMS.map(([b, rest], i) => {
          const c = i % 2 ? GR : OR;
          return (
            <div key={i} className="relative flex-1 min-h-0 flex items-center gap-4 rounded-2xl px-5" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(241,245,249,0.85))', border: '1px solid rgba(148,163,184,0.45)', borderLeft: `3px solid ${c}`, boxShadow: '0 6px 18px rgba(15,23,42,0.08), inset 0 1px 0 #fff' }}>
              <span className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 28, height: 28, background: '#ecfdf5', border: '1px solid #a7f3d0' }}><Check className="h-4 w-4" style={{ color: GR }} /></span>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 14, lineHeight: 1.3, color: '#334155' }}><b style={{ color: INK, fontWeight: 700 }}>{b}</b> {rest}</div>
                <div className="mt-1.5 h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, ${GR}, ${OR} 70%, rgba(148,163,184,0.3))` }} />
              </div>
              <span className="absolute -top-2 -right-2 flex items-center justify-center rounded-full" style={{ width: 24, height: 24, background: '#f1f5f9', border: '1px solid #cbd5e1', fontFamily: MONO, fontSize: 9, color: '#475569' }}>{String(i + 1).padStart(2, '0')}</span>
            </div>
          );
        })}
      </div>
    </div>

    <div className="relative flex items-center justify-between px-[6%] py-3" style={{ background: 'rgba(255,255,255,0.55)', borderTop: '1px solid rgba(15,23,42,0.1)', borderLeft: `3px solid ${OR}`, fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.14em', color: '#64748b' }}>
      <span>STARTUP FACTORY HUB × APEX ACCELERATORS</span>
      <span>BUSINESS INTELLIGENCE // MEASURABLE IMPACT</span>
    </div>
  </section>
);
