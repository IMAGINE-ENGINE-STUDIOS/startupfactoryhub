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
    const id = window.setInterval(() => setStage((s) => (s >= 3 ? 0 : s + 1)), 3200);
    return () => window.clearInterval(id);
  }, [pinned]);

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-6">
      {/* ---------------- left: narrative + benefits ---------------- */}
      <div className="flex flex-col gap-3 min-h-0">
        <p className="text-[14px] leading-relaxed text-slate-600">
          A partnership with Startup Factory Hub is not a service contract — it is a living system.
          Your <strong className="text-slate-800 font-semibold">brand, capital, market access and mandate</strong> feed
          the roots; every batch adds a branch, and the canopy your organization stands under keeps widening.
        </p>

        <div className="grid grid-cols-1 gap-2.5 min-h-0">
          {benefits.map((b, i) => {
            const on = b.stage <= stage;
            return (
              <div
                key={b.id}
                onMouseEnter={() => { setPinned(true); setStage(b.stage); }}
                onMouseLeave={() => setPinned(false)}
                className="rounded-xl px-4 py-3 flex items-start gap-3 transition-all duration-300 cursor-default"
                style={{
                  border: `1px solid ${accent}${on ? '55' : '1f'}`,
                  background: on ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.45)',
                  boxShadow: on ? `0 6px 22px -14px ${accent}` : undefined,
                }}
              >
                <span
                  className="font-mono text-[11px] font-bold shrink-0 rounded-md px-1.5 py-1 leading-none"
                  style={{ color: accent, background: `${accent}14`, border: `1px solid ${accent}33` }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[12.5px] uppercase tracking-[0.18em] font-bold text-slate-900">
                    {b.label}
                  </span>
                  <span className="block text-[13px] leading-[1.5] text-slate-600 mt-1">{b.line}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------- right: 3D tree + timeline ---------------- */}
      <div className="relative min-h-0 flex flex-col text-slate-700">
        <div className="relative flex-1 min-h-0 rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${accent}22`, background: `radial-gradient(circle at 50% 62%, ${accent}12, transparent 68%)` }}>
          <GrowthTree3D accent={accent} accent2={accent2} stage={stage} />

          {/* root inputs — outside the canopy, no overlap */}
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 px-4 pointer-events-none">
            {ROOT_INPUTS.map((r) => (
              <span
                key={r}
                className="font-mono text-[10.5px] uppercase tracking-[0.2em] rounded-full px-3 py-1 whitespace-nowrap"
                style={{ color: accent, border: `1px solid ${accent}33`, background: 'rgba(255,255,255,0.72)' }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* month timeline — single row, never wraps */}
        <div className="mt-3 flex items-stretch gap-2">
          {GROWTH_STAGES.map((s, i) => {
            const on = i <= stage;
            return (
              <button
                key={s.label}
                type="button"
                data-no-flip
                onClick={() => { setStage(i); setPinned(true); }}
                className="flex-1 min-w-0 rounded-xl px-2 py-2 text-center transition-all"
                style={{
                  border: `1px solid ${on ? accent : 'rgba(15,23,42,0.12)'}`,
                  background: i === stage ? `${accent}16` : 'rgba(255,255,255,0.5)',
                  boxShadow: i === stage ? `0 0 18px -6px ${accent}` : undefined,
                }}
              >
                <span
                  className="block font-mono text-[11px] uppercase tracking-[0.16em] font-bold whitespace-nowrap"
                  style={{ color: on ? accent : 'rgba(15,23,42,0.45)' }}
                >
                  {s.label}
                </span>
                <span className="block text-[11.5px] text-slate-500 mt-0.5 whitespace-nowrap truncate">{s.note}</span>
              </button>
            );
          })}
        </div>

        {/* current month focus */}
        <div
          className="mt-2.5 rounded-xl px-4 py-3"
          style={{ border: `1px solid ${accent}2e`, background: 'rgba(255,255,255,0.6)' }}
        >
          <span className="font-mono text-[10.5px] uppercase tracking-[0.24em] font-bold" style={{ color: accent }}>
            {GROWTH_STAGES[stage].label} · Focus
          </span>
          <p className="text-[13px] leading-relaxed text-slate-600 mt-1">{MONTH_FOCUS[stage]}</p>
        </div>
      </div>
    </div>
  );
};

export default GrowthSection;
