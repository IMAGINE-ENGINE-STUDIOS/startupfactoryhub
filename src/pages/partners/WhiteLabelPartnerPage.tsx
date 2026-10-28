/**
 * /forpartners brochure — "White-label the platform" page (silver edition).
 * For partners who want the full platform and network under their own brand.
 * © Imagine Engine Studios Corp — Startup Factory Hub.
 */
import { Network, Palette, Globe2, ShieldCheck, Layers, Users } from 'lucide-react';

const SERIF = "'Playfair Display', 'Times New Roman', serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const INK = '#1c2230';
const STEEL = '#5b6577';

const ITEMS = [
  { icon: Palette, t: 'Your brand, end to end', d: 'Your name, logo, colors and domain across every screen, email and certificate.' },
  { icon: Network, t: 'The whole network included', d: 'Your members plug into our founders, mentors, advisors, investors and corporates worldwide.' },
  { icon: Layers, t: 'Every platform feature', d: 'Programs, journey mapping, resources, events, Genius AI, data rooms and analytics.' },
  { icon: Users, t: 'Your own community', d: 'Run your cohorts, mentors and partners in your space, with your rules and your staff.' },
  { icon: Globe2, t: 'Global from day one', d: 'Access to our hubs, offices, events and soft-landing partners in multiple countries.' },
  { icon: ShieldCheck, t: 'We run the technology', d: 'Hosting, security, updates and support handled by Startup Factory Hub in the background.' },
];

export default function WhiteLabelPartnerPage({ pageNum }: { pageNum: number }) {
  return (
    <section className="absolute inset-0 overflow-hidden" style={{
      background: 'linear-gradient(145deg, #f4f6f9 0%, #d9dee6 38%, #eef1f5 62%, #c3cad5 100%)',
      color: INK,
    }}>
      {/* brushed metal sheen */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 1px, transparent 1px 4px), radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.9) 0%, transparent 55%)',
      }} />
      <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #8a94a6, #ffffff, #8a94a6, transparent)' }} />

      <div className="relative z-10 h-full flex flex-col" style={{ padding: '44px 46px 40px' }}>
        <div className="flex items-center justify-between" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.32em', color: STEEL }}>
          <span>WHITE-LABEL · PARTNER EDITION</span>
          <span>P/{String(pageNum).padStart(2, '0')}</span>
        </div>

        <div className="mt-7" style={{ fontFamily: MONO, fontSize: 13, letterSpacing: '0.38em', color: STEEL }}>FOR PARTNERS</div>
        <h2 style={{ fontFamily: SERIF, fontSize: 50, lineHeight: 1.02, fontWeight: 700, marginTop: 8 }}>
          White-label the platform.<br />
          <span style={{
            background: 'linear-gradient(90deg, #4b5566, #9aa3b2, #3a4352)', WebkitBackgroundClip: 'text', color: 'transparent',
          }}>Keep the whole network.</span>
        </h2>
        <p className="mt-4" style={{ fontSize: 18, lineHeight: 1.5, color: '#3a4352', maxWidth: 640 }}>
          Launch Startup Factory Hub as your own innovation platform. Your brand sits on top; our global
          network of founders, mentors, investors and corporates powers everything underneath.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3.5 flex-1 min-h-0">
          {ITEMS.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl p-4 flex gap-3" style={{
              background: 'linear-gradient(160deg, rgba(255,255,255,0.85), rgba(226,230,237,0.6))',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 10px 26px rgba(28,34,48,0.12), inset 0 1px 0 #fff',
            }}>
              <div className="shrink-0 flex items-center justify-center rounded-xl" style={{
                width: 40, height: 40, background: 'linear-gradient(145deg, #3a4352, #7b8597)', boxShadow: '0 4px 12px rgba(28,34,48,0.25)',
              }}>
                <Icon className="h-5 w-5" style={{ color: '#f4f6f9' }} />
              </div>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 700, lineHeight: 1.15 }}>{t}</div>
                <div className="mt-1" style={{ fontSize: 14.5, lineHeight: 1.45, color: '#3a4352' }}>{d}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl px-5 py-4 flex items-center justify-between gap-4" style={{
          background: 'linear-gradient(90deg, #232a37, #4b5566)', color: '#f4f6f9',
        }}>
          <span style={{ fontFamily: SERIF, fontSize: 19, fontStyle: 'italic' }}>You own the experience. We power it.</span>
          <span style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: '0.28em', color: '#c3cad5' }}>POWERED BY STARTUP FACTORY HUB</span>
        </div>
      </div>
    </section>
  );
}
