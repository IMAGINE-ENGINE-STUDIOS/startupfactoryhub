import React, { useEffect, useState } from 'react';
import GrowthTree3D, { GROWTH_STAGES } from '@/components/brochure/GrowthTree3D';

export type GrowthBenefit = {
  id: string;
  label: string;
  line: string;
  /** 0-based month of the 4-month batch where this benefit starts compounding */
  stage: number;
};

const ROOT_INPUTS = ['Brand', 'Capital', 'Market', 'Mandate'];

const MONTH_FOCUS = [
  'Onboarding, discovery and problem validation with your teams.',
  'Ventures build their MVPs on the shared platform and toolchain.',
  'First pilots, users and traction inside your market.',
  'Demo Day: ventures presented to your network and to investors.',
];

export const GrowthSection = ({
  accent,
  accent2,
  benefits,
}: {
  accent: string;
  accent2: string;
  benefits: GrowthBenefit[];
}) => {
  const [stage, setStage] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (pinned) return;
    const id = window.setInterval(() => setStage((s) => (s >= 3 ? 0 : s + 1)), 3600);
    return () => window.clearInterval(id);
  }, [pinned]);

  return (
    <div className="relative flex-1 min-h-0 h-full overflow-hidden rounded-2xl">
      {/* ---------------- full-slide 3D tree background ---------------- */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 62% 60%, ${accent}12, transparent 70%)` }}
      >
        <GrowthTree3D accent={accent} accent2={accent2} stage={stage} />
      </div>

      {/* soft veil so the AR panel keeps contrast over the canopy */}
      <div
        className="absolute inset-y-0 left-0 w-full sm:w-[62%] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.86) 0%, rgba(255,255,255,0.66) 55%, transparent 100%)' }}
      />

      {/* root inputs — bottom right, clear of the AR panel */}
      <div className="absolute bottom-2 right-3 flex flex-wrap justify-end gap-1.5 max-w-[45%] pointer-events-none">
        {ROOT_INPUTS.map((r) => (
          <span
            key={r}
            className="font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.12em] rounded-full px-2 py-1 whitespace-nowrap"
            style={{ color: accent, border: `1px solid ${accent}33`, background: 'rgba(255,255,255,0.75)' }}
          >
            {r}
          </span>
        ))}
      </div>

      {/* ---------------- AR overlay panel (left side only) ---------------- */}
      <div className="relative z-10 h-full w-full sm:w-[56%] max-w-[560px] flex flex-col gap-2 p-3 sm:p-4 min-h-0">
        <p className="text-[13.5px] sm:text-[14px] leading-snug text-slate-700">
          Your <strong className="font-semibold" style={{ color: accent }}>brand, capital, market access and mandate</strong> feed
          the roots. Every batch adds a branch — and the canopy your organization stands under keeps widening.
        </p>

        {/* AR benefit cards */}
        <div className="flex-1 min-h-0 grid grid-cols-1 gap-2 sm:gap-2" style={{ gridAutoRows: '1fr' }}>
          {benefits.map((b, i) => {
            const on = b.stage <= stage;
            return (
              <div
                key={b.id}
                onMouseEnter={() => { setPinned(true); setStage(b.stage); }}
                onMouseLeave={() => setPinned(false)}
                className="rounded-lg px-3 sm:px-3 py-2 sm:py-2 flex items-center gap-3 transition-all duration-300 cursor-default min-h-0"
                style={{
                  border: `1px solid ${accent}${on ? '66' : '22'}`,
                  background: on
                    ? `linear-gradient(120deg, ${accent}1a, rgba(255,255,255,0.9))`
                    : 'rgba(255,255,255,0.66)',
                  boxShadow: on ? `0 6px 20px -14px ${accent}` : undefined,
                }}
              >
                <span
                  className="font-mono text-[12px] sm:text-[12px] font-bold shrink-0 rounded px-2 py-1 leading-none"
                  style={{ color: on ? '#fff' : accent, background: on ? accent : `${accent}14`, border: `1px solid ${accent}44` }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0">
                  <span
                    className="block font-mono text-[12px] sm:text-[13px] uppercase tracking-[0.08em] font-bold leading-tight"
                    style={{ color: on ? accent : 'rgba(15,23,42,0.55)' }}
                  >
                    {b.label}
                  </span>
                  <span className="block text-[12.5px] sm:text-[13px] leading-snug text-slate-700">{b.line}</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* month timeline */}
        <div className="flex items-stretch gap-2 shrink-0">
          {GROWTH_STAGES.map((s, i) => {
            const on = i <= stage;
            return (
              <button
                key={s.label}
                type="button"
                data-no-flip
                onClick={() => { setStage(i); setPinned(true); }}
                className="flex-1 min-w-0 rounded-lg px-1.5 py-1.5 text-center transition-all"
                style={{
                  border: `1px solid ${on ? accent : 'rgba(15,23,42,0.12)'}`,
                  background: i === stage ? `${accent}1f` : 'rgba(255,255,255,0.7)',
                }}
              >
                <span
                  className="block font-mono text-[11px] sm:text-[11px] uppercase tracking-[0.04em] font-bold whitespace-nowrap"
                  style={{ color: on ? accent : 'rgba(15,23,42,0.45)' }}
                >
                  {s.label}
                </span>
                <span className="block text-[11px] sm:text-[11px] whitespace-nowrap truncate" style={{ color: on ? accent : 'rgba(15,23,42,0.45)' }}>{s.note}</span>
              </button>
            );
          })}
        </div>

        {/* current month focus */}
        <div
          className="rounded-lg px-3 py-2.5 shrink-0"
          style={{ border: `1px solid ${accent}2e`, background: 'rgba(255,255,255,0.78)' }}
        >
          <span className="font-mono text-[11px] sm:text-[11px] uppercase tracking-[0.14em] font-bold" style={{ color: accent }}>
            {GROWTH_STAGES[stage].label} · Focus
          </span>
          <p className="text-[12.5px] sm:text-[13px] leading-snug text-slate-700 mt-1">{MONTH_FOCUS[stage]}</p>
        </div>
      </div>
    </div>
  );
};

export default GrowthSection;
