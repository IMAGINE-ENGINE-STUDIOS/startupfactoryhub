import { useEffect, useState } from 'react';
import { PARTNERS, type Partner } from '@/config/partners';

function PartnerCard({ partner, index }: { partner: Partner; index: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <div
      className="group relative w-[76vw] max-w-[280px] shrink-0 snap-center overflow-hidden rounded-2xl sm:w-[260px] sm:max-w-none"
      style={{
        border: '1.5px solid rgba(20,184,166,0.35)',
        background: 'rgba(4,14,26,0.92)',
        boxShadow: '0 0 50px -18px rgba(20,184,166,0.45), inset 0 0 40px -22px rgba(20,184,166,0.25)',
      }}
    >
      {/* LED dot matrix */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: 'radial-gradient(rgba(20,184,166,0.45) 1px, transparent 1px)',
          backgroundSize: '5px 5px',
        }}
      />
      {/* scanline sweep */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 h-16 opacity-30"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(20,184,166,0.22), transparent)',
          animation: `sfh-board-scan 4.5s linear ${index * 0.4}s infinite`,
        }}
      />
      <div className="relative flex h-44 flex-col items-center justify-center p-5 sm:h-48 sm:p-6">
        <div className="flex h-20 w-full items-center justify-center">
          <img
            src={partner.logo}
            alt={partner.name}
            className="max-h-14 max-w-[190px] object-contain opacity-80 transition-all duration-500 group-hover:opacity-100 group-hover:drop-shadow-[0_0_18px_rgba(20,184,166,0.55)]"
            onError={() => setFailed(true)}
          />
        </div>
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.22em] text-white/50 sm:text-[10px] sm:tracking-[0.28em]">
          {partner.tier}
        </p>

        {/* marquee bulbs */}
        <div className="mt-4 flex gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="h-1 w-1.5 rounded-full"
              style={{
                background: 'rgb(20,184,166)',
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
  const [isTouch, setIsTouch] = useState(false);
  const [failedNames, setFailedNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (max-width: 639px)');
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const visiblePartners = PARTNERS.filter(p => !failedNames.has(p.name));
  const loop = isTouch ? visiblePartners : [...visiblePartners, ...visiblePartners];

  return (
    <section className="relative overflow-hidden border-y border-border/50 py-8 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, rgba(20,184,166,0.10), transparent 70%)' }}
      />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#050b16] to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#050b16] to-transparent sm:w-24" />

      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className={
            isTouch
              ? 'flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              : 'flex w-max gap-6 px-6'
          }
          style={
            isTouch
              ? { scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }
              : {
                  animation: 'sfh-board-marquee 56s linear infinite',
                  animationPlayState: paused ? 'paused' : 'running',
                }
          }
        >
          {loop.map((p, i) => (
            <PartnerCard
              key={`${p.name}-${i}`}
              partner={p}
              index={i}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes sfh-board-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes sfh-board-scan { 0% { top: -20%; } 100% { top: 110%; } }
        @keyframes sfh-board-bulb { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          [style*="sfh-board-"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
