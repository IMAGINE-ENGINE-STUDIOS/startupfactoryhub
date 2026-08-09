import { useEffect, useState } from 'react';

type Board = {
  title: string;
  sub: string;
  kicker: string;
  hue: string; // rgb triplet
};

const BOARDS: Board[] = [
  { kicker: 'Build', title: 'MVP IN 4 WEEKS', sub: 'Idea → shipped product', hue: '20,184,166' },
  { kicker: 'Capital', title: 'SEED FUNDING', sub: 'Cash into your build sprint', hue: '129,140,248' },
  { kicker: 'Network', title: 'INVESTOR MESH', sub: 'Warm intros, global reach', hue: '34,211,238' },
  { kicker: 'Mentors', title: 'ELITE ADVISORY', sub: 'Operators who have shipped', hue: '244,114,182' },
  { kicker: 'AI', title: 'AI TOOLING STACK', sub: 'Ship 10x faster', hue: '250,204,21' },
  { kicker: 'Launch', title: 'DEMO DAY', sub: 'Center stage, live audience', hue: '248,113,113' },
  { kicker: 'Growth', title: 'GO TO MARKET', sub: 'First users, first revenue', hue: '74,222,128' },
  { kicker: 'Global', title: 'WORLDWIDE HUBS', sub: '100% remote, any city', hue: '96,165,250' },
];

function BillboardCard({ b, index }: { b: Board; index: number }) {
  return (
    <div
      className="relative w-[76vw] max-w-[300px] shrink-0 snap-center overflow-hidden rounded-2xl sm:w-[360px] sm:max-w-none"
      style={{
        border: `1.5px solid rgba(${b.hue},0.5)`,
        background: 'rgba(4,14,26,0.92)',
        boxShadow: `0 0 60px -18px rgba(${b.hue},0.9), inset 0 0 40px -22px rgba(${b.hue},0.8)`,
      }}
    >
      {/* LED dot matrix */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(rgba(${b.hue},0.55) 1px, transparent 1px)`,
          backgroundSize: '5px 5px',
        }}
      />
      {/* scanline sweep */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 h-16 opacity-40"
        style={{
          background: `linear-gradient(180deg, transparent, rgba(${b.hue},0.28), transparent)`,
          animation: `sfh-board-scan 4.5s linear ${index * 0.4}s infinite`,
        }}
      />
      <div className="relative p-4 sm:p-7">
        <span
          className="inline-block rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] sm:px-3 sm:text-[10px] sm:tracking-[0.28em]"
          style={{ color: `rgb(${b.hue})`, border: `1px solid rgba(${b.hue},0.45)`, background: `rgba(${b.hue},0.08)` }}
        >
          {b.kicker}
        </span>
        <p
          className="mt-3 font-black uppercase leading-[0.95] tracking-tight text-xl sm:mt-5 sm:text-3xl"
          style={{
            color: `rgb(${b.hue})`,
            textShadow: `0 0 18px rgba(${b.hue},0.85), 0 0 46px rgba(${b.hue},0.45)`,
            animation: `sfh-board-flicker ${5 + (index % 4)}s ease-in-out ${index * 0.3}s infinite`,
          }}
        >
          {b.title}
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-white/55 sm:mt-3 sm:text-[11px] sm:tracking-[0.18em]">{b.sub}</p>

        {/* marquee bulbs */}
        <div className="mt-4 flex gap-1.5 sm:mt-6">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: `rgb(${b.hue})`,
                animation: `sfh-board-bulb 1.4s linear ${i * 0.09}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NeonBillboardCarousel() {
  const [paused, setPaused] = useState(false);
  const loop = [...BOARDS, ...BOARDS];

  return (
    <section className="relative overflow-hidden border-y border-border/50 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, rgba(20,184,166,0.10), transparent 70%)' }}
      />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

      <div className="mb-8 px-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-primary">Times Square Feed</p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
          The program, in lights
        </h2>
      </div>

      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex w-max gap-6 px-6"
          style={{
            animation: 'sfh-board-marquee 46s linear infinite',
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {loop.map((b, i) => (
            <BillboardCard key={`${b.title}-${i}`} b={b} index={i} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes sfh-board-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes sfh-board-scan { 0% { top: -20%; } 100% { top: 110%; } }
        @keyframes sfh-board-bulb { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } }
        @keyframes sfh-board-flicker {
          0%,100% { opacity: 1; }
          42% { opacity: 1; }
          44% { opacity: 0.55; }
          46% { opacity: 1; }
          72% { opacity: 0.7; }
          74% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="sfh-board-"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
