import React, { useEffect, useMemo, useRef, useState } from 'react';

/* =========================================================================
   GROWTH TREE — an original, hand-crafted organic growth system.
   The tree literally grows as the partnership matures (Year 0 → Year 3):
   roots (what the partner brings) feed a luminous trunk (the partnership),
   branches draw themselves outward, leaves bloom, spores drift.
   ========================================================================= */

export type GrowthBenefit = {
  id: string;
  label: string;
  line: string;
  stage: number;
};

type Branch = {
  id: string;
  d: string;
  stage: number;
  tip: [number, number];
  side: 'l' | 'r';
};

const BRANCHES: Branch[] = [
  { id: 'pipeline', stage: 1, side: 'l', tip: [92, 330], d: 'M260,470 C222,452 178,424 146,390 C124,367 106,349 92,330' },
  { id: 'brand', stage: 1, side: 'r', tip: [430, 322], d: 'M260,462 C300,444 344,414 376,380 C398,357 416,340 430,322' },
  { id: 'talent', stage: 2, side: 'l', tip: [112, 214], d: 'M260,392 C232,368 196,336 168,300 C144,270 126,242 112,214' },
  { id: 'dealflow', stage: 2, side: 'r', tip: [412, 206], d: 'M260,384 C290,360 324,328 352,292 C378,258 398,232 412,206' },
  { id: 'gravity', stage: 3, side: 'l', tip: [176, 108], d: 'M260,300 C246,256 226,204 204,166 C192,144 184,126 176,108' },
  { id: 'impact', stage: 3, side: 'r', tip: [352, 96], d: 'M260,292 C276,248 296,196 318,158 C332,134 342,116 352,96' },
];

const ROOTS = [
  { d: 'M260,552 C232,566 196,576 158,584', label: 'Brand' },
  { d: 'M260,556 C240,576 214,594 182,608', label: 'Capital' },
  { d: 'M260,556 C280,576 306,594 338,608', label: 'Market' },
  { d: 'M260,552 C288,566 324,576 362,584', label: 'Mandate' },
];

const STAGES = [
  { label: 'Year 0', note: 'Signature' },
  { label: 'Year 1', note: 'First batch' },
  { label: 'Year 2', note: 'Compounding' },
  { label: 'Year 3', note: 'Ecosystem' },
];

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
};

type Leaf = { x: number; y: number; r: number; rot: number; branch: string; delay: number };

export const GrowthTree = ({
  accent = '#10b981',
  accent2 = '#0ea5b7',
  benefits,
  className = '',
}: {
  accent?: string;
  accent2?: string;
  benefits: GrowthBenefit[];
  className?: string;
}) => {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(reduced ? 3 : 0);
  const [hover, setHover] = useState<string | null>(null);
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});

  // auto-grow cycle
  useEffect(() => {
    if (reduced) { setStage(3); return; }
    const id = window.setInterval(() => setStage((s) => (s >= 3 ? 0 : s + 1)), 2600);
    return () => window.clearInterval(id);
  }, [reduced]);

  // derive leaf positions from the real branch geometry
  useEffect(() => {
    const out: Leaf[] = [];
    BRANCHES.forEach((b) => {
      const el = pathRefs.current[b.id];
      if (!el || !el.getTotalLength) return;
      const total = el.getTotalLength();
      [0.42, 0.56, 0.68, 0.79, 0.88, 0.96].forEach((f, i) => {
        const p = el.getPointAtLength(total * f);
        const jitter = (i % 2 === 0 ? 1 : -1) * (6 + (i % 3) * 4);
        out.push({
          x: p.x + (b.side === 'l' ? -jitter * 0.6 : jitter * 0.6),
          y: p.y - jitter * 0.55,
          r: 7 + ((i * 3) % 5),
          rot: (b.side === 'l' ? -1 : 1) * (18 + i * 14),
          branch: b.id,
          delay: 0.35 + i * 0.09,
        });
      });
    });
    setLeaves(out);
  }, []);

  const activeBranches = useMemo(
    () => new Set(BRANCHES.filter((b) => b.stage <= stage).map((b) => b.id)),
    [stage],
  );

  const metrics = [
    { k: 'Ventures', v: [0, 10, 26, 48][stage] },
    { k: 'Innovation projects', v: [0, 6, 19, 40][stage] },
    { k: 'Ecosystem reach', v: [0, 4, 12, 31][stage], suffix: 'k' },
  ];

  return (
    <div className={`relative w-full h-full flex flex-col min-h-0 ${className}`}>
      <svg
        viewBox="14 46 492 600"
        preserveAspectRatio="xMidYMid meet"
        className="w-full flex-1 min-h-0 block"
        style={{ overflow: 'hidden' }}
      >

        <defs>
          <linearGradient id="gt-trunk" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={accent2} stopOpacity="0.85" />
            <stop offset="55%" stopColor={accent} stopOpacity="0.95" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="gt-leaf" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
            <stop offset="100%" stopColor={accent2} stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id="gt-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <filter id="gt-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ambient halo */}
        <ellipse cx="260" cy="300" rx="250" ry="270" fill="url(#gt-halo)" />

        {/* ground line */}
        <line x1="52" y1="556" x2="468" y2="556" stroke={accent} strokeOpacity="0.28" strokeWidth="1" strokeDasharray="2 7" />

        {/* roots */}
        <g fill="none" stroke={accent2} strokeOpacity="0.5" strokeLinecap="round">
          {ROOTS.map((r, i) => (
            <path
              key={r.label}
              d={r.d}
              strokeWidth={3.2 - i * 0.2}
              style={reduced ? undefined : { animation: `gt-root-in 1.1s ${0.1 + i * 0.12}s ease-out both` }}
              pathLength={1}
            />
          ))}
        </g>
        <g className="font-mono" fontSize="11" letterSpacing="1.6" fill="currentColor" opacity="0.55" textAnchor="middle">
          <text x="150" y="600">BRAND</text>
          <text x="228" y="626">CAPITAL</text>
          <text x="326" y="626">MARKET</text>
          <text x="392" y="600">MANDATE</text>
        </g>

        {/* trunk */}
        <path
          d="M260,556 C252,470 254,392 258,318 C260,268 260,232 260,196"
          fill="none"
          stroke="url(#gt-trunk)"
          strokeWidth="11"
          strokeLinecap="round"
          filter="url(#gt-glow)"
        />
        {/* sap pulse */}
        {!reduced && (
          <path
            d="M260,556 C252,470 254,392 258,318 C260,268 260,232 260,196"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.9"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="8 92"
            style={{ animation: 'gt-sap 3.4s linear infinite' }}
          />
        )}

        {/* branches */}
        {BRANCHES.map((b, i) => {
          const on = activeBranches.has(b.id);
          const hot = hover === b.id;
          return (
            <g key={b.id}>
              <path
                ref={(el) => { pathRefs.current[b.id] = el; }}
                d={b.d}
                fill="none"
                stroke={hot ? accent : 'url(#gt-trunk)'}
                strokeWidth={hot ? 6.5 : 5}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={on ? 0 : 1}
                opacity={on ? 1 : 0}
                style={{ transition: `stroke-dashoffset 1.1s cubic-bezier(.22,.9,.24,1) ${i * 0.12}s, opacity .5s ease, stroke-width .25s ease` }}
                filter={hot ? 'url(#gt-glow)' : undefined}
              />
              {/* tip node */}
              <circle
                cx={b.tip[0]}
                cy={b.tip[1]}
                r={hot ? 8 : 5.5}
                fill={accent}
                opacity={on ? 1 : 0}
                filter="url(#gt-glow)"
                style={{ transition: `opacity .5s ease ${0.7 + i * 0.12}s, r .25s ease` }}
              />
              <circle
                cx={b.tip[0]}
                cy={b.tip[1]}
                r="13"
                fill="none"
                stroke={accent}
                strokeOpacity={on ? 0.35 : 0}
                strokeWidth="1"
                style={reduced || !on ? { transition: 'stroke-opacity .5s ease' } : { animation: `gt-ring 2.8s ${i * 0.3}s ease-out infinite` }}
              />
            </g>
          );
        })}

        {/* leaves */}
        <g>
          {leaves.map((l, i) => {
            const branch = BRANCHES.find((b) => b.id === l.branch)!;
            const on = activeBranches.has(l.branch);
            return (
              <ellipse
                key={`${l.branch}-${i}`}
                cx={l.x}
                cy={l.y}
                rx={l.r}
                ry={l.r * 0.52}
                fill="url(#gt-leaf)"
                opacity={on ? (hover && hover !== l.branch ? 0.3 : 0.92) : 0}
                transform={`rotate(${l.rot} ${l.x} ${l.y})`}
                style={{
                  transformOrigin: `${l.x}px ${l.y}px`,
                  transition: `opacity .7s ease ${l.delay + branch.stage * 0.1}s`,
                  ...(reduced ? {} : { animation: `gt-sway ${4 + (i % 5) * 0.6}s ${(i % 7) * 0.25}s ease-in-out infinite` }),
                }}
              />
            );
          })}
        </g>

        {/* drifting spores */}
        {!reduced && [...Array(10)].map((_, i) => (
          <circle
            key={`sp-${i}`}
            cx={90 + i * 36}
            cy={520 - (i % 4) * 40}
            r={1.6 + (i % 3) * 0.6}
            fill={i % 2 ? accent2 : accent}
            opacity="0.5"
            style={{ animation: `gt-drift ${9 + (i % 5) * 2.2}s ${i * 0.7}s linear infinite` }}
          />
        ))}

        {/* numbered tip badges — keyed to the benefit list beside the tree */}
        {benefits.slice(0, 6).map((bn, i) => {
          const b = BRANCHES[i];
          if (!b) return null;
          const on = activeBranches.has(b.id);
          return (
            <g
              key={bn.id}
              opacity={on ? 1 : 0}
              style={{ transition: `opacity .6s ease ${0.9 + i * 0.1}s` }}
              onMouseEnter={() => setHover(b.id)}
              onMouseLeave={() => setHover(null)}
            >
              <circle cx={b.tip[0]} cy={b.tip[1]} r="14" fill="#ffffff" fillOpacity="0.9" stroke={accent} strokeWidth="1.2" />
              <text
                x={b.tip[0]}
                y={b.tip[1] + 4}
                textAnchor="middle"
                className="font-mono"
                fontSize="12"
                fontWeight={700}
                fill={accent}
              >
                {String(i + 1).padStart(2, '0')}
              </text>
            </g>
          );
        })}


        <style>{`
          @keyframes gt-sap { 0% { stroke-dashoffset: 100 } 100% { stroke-dashoffset: 0 } }
          @keyframes gt-ring { 0% { stroke-opacity:.5; r:6 } 70% { stroke-opacity:0; r:20 } 100% { stroke-opacity:0; r:20 } }
          @keyframes gt-sway { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2.5px) } }
          @keyframes gt-drift { 0% { transform: translate(0,0); opacity:0 } 15% { opacity:.6 } 100% { transform: translate(28px,-190px); opacity:0 } }
          @keyframes gt-root-in { from { stroke-dasharray:1; stroke-dashoffset:1 } to { stroke-dasharray:1; stroke-dashoffset:0 } }
        `}</style>
      </svg>

      {/* growth timeline */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {STAGES.map((s, i) => {
          const on = i <= stage;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => setStage(i)}
              className="rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] transition-all"
              style={{
                border: `1px solid ${on ? accent : 'rgba(15,23,42,0.14)'}`,
                background: i === stage ? `${accent}1f` : 'transparent',
                color: on ? accent : 'rgba(15,23,42,0.45)',
                boxShadow: i === stage ? `0 0 18px ${accent}33` : undefined,
              }}
            >
              {s.label} · {s.note}
            </button>
          );
        })}
      </div>

      {/* counters */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div
            key={m.k}
            className="rounded-xl px-3 py-2 text-center"
            style={{ border: `1px solid ${accent}2e`, background: 'rgba(255,255,255,0.55)' }}
          >
            <div className="font-futuristic font-black leading-none" style={{ fontSize: 22, color: accent }}>
              {m.v}{m.suffix ?? ''}
            </div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-slate-500 mt-1 leading-tight">{m.k}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrowthTree;
