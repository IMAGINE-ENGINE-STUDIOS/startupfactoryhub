/**
 * APEX brochure — every founder perk currently in the network (Tools tab list).
 * Follows the Embedded Corporate Partner Resources page palette.
 * Credits: Imagine Engine Studios Corp.
 */
import { PERKS } from '@/config/perks';

const AMBER = '#fbbf24';
const ROSE = '#fb7185';

export const ApexPerksPage = () => (
  <section className="absolute inset-0 flex flex-col overflow-hidden" style={{
    background: 'radial-gradient(ellipse at 90% 10%, rgba(251,191,36,0.14) 0%, transparent 50%), linear-gradient(180deg,#2a0b17 0%,#16050c 100%)',
    color: '#fde7ef',
  }}>
    <div className="absolute inset-0 pointer-events-none opacity-40" style={{
      backgroundImage: `linear-gradient(${AMBER}10 1px, transparent 1px), linear-gradient(90deg, ${AMBER}10 1px, transparent 1px)`,
      backgroundSize: '28px 28px',
    }} />
    <div className="relative z-10 flex flex-col h-full px-[5%] pt-[4%] pb-[3%]">
      <div className="flex items-center justify-between font-mono uppercase" style={{ fontSize: 11, letterSpacing: '0.28em' }}>
        <span style={{ color: AMBER, fontWeight: 700 }}>partner_perks://network</span>
        <span style={{ color: '#f5d0fe', opacity: 0.8 }}>{PERKS.length} live perks</span>
      </div>
      <h2 className="mt-3" style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1, color: '#fff' }}>
        Perks already in the network
      </h2>
      <p className="mt-1.5" style={{ fontSize: 12.5, lineHeight: 1.35, color: '#fbd5e2' }}>
        Credits, discounts and partner programs every founder can use today from the Tools tab.
      </p>
      <div className="mt-3 h-[2px] w-16 rounded-full" style={{ background: `linear-gradient(90deg, ${AMBER}, ${ROSE})` }} />
      <div className="mt-2 flex-1 min-h-0 grid grid-cols-3 gap-1.5" style={{ gridTemplateRows: `repeat(${Math.ceil(PERKS.length / 3)}, minmax(0, 1fr))` }}>
        {PERKS.map((p) => (
          <div key={p.name} className="flex items-center gap-2 rounded-lg px-2 py-1 min-w-0 min-h-0 overflow-hidden" style={{
            background: 'rgba(74,18,40,0.62)', border: `1px solid ${AMBER}33`,
          }}>
            <img
              src={`https://www.google.com/s2/favicons?sz=64&domain=${p.domain}`}
              alt="" className="w-6 h-6 rounded bg-white/90 p-0.5 shrink-0" loading="lazy"
            />
            <div className="min-w-0">
              <div className="truncate" style={{ fontSize: 11.5, fontWeight: 800, color: '#fff' }}>{p.name}</div>
              <div className="font-mono uppercase truncate" style={{ fontSize: 8.5, letterSpacing: '0.12em', color: AMBER }}>{p.badge}</div>
              <div style={{
                fontSize: 9.5, lineHeight: 1.3, color: '#fbd5e2', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{p.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
