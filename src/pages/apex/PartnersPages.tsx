/**
 * Native copies of the two /forpartners pages shown in the APEX brochure
 * (About Startup Factory Hub, Where the ecosystem meets).
 * Rendered directly instead of iframes so they are ready instantly and never
 * reload a whole second app while pages flip.
 * Credits: Imagine Engine Studios Corp.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Smartphone } from 'lucide-react';
import visionHub from '@/assets/wtc-vision-hub-future.jpg.asset.json';
import eventArtemisWatchParty from '@/assets/event-artemis-watch-party.png';
import eventVoyagerOsu from '@/assets/event-voyager-osu.jpg.asset.json';
import eventLaunchingOrlando from '@/assets/event-launching-orlando.jpg';
import eventLakeCounty from '@/assets/event-lake-county.jpg';
import eventPlugAndPlay from '@/assets/event-plug-and-play.jpg';
import nasaLogo from '@/assets/nasa-logo.png';

const NEON = { cyan: '#0ea5b7', magenta: '#1f2a44', lime: '#10b981', amber: '#0d9488' };
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";
const SERIF = "'Playfair Display', serif";
const BASE_W = 842;
const BASE_H = 1190;

/** Lays out an 842x1190 design and scales it to fill the book page. */
const ScaledA4 = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 1 && h > 1) setScale(Math.min(w / BASE_W, h / BASE_H));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" style={{ background: '#ffffff' }}>
      <div style={{
        position: 'absolute', left: '50%', top: 0, width: BASE_W, height: BASE_H, marginLeft: -BASE_W / 2,
        transform: `scale(${scale || 0.0001})`, transformOrigin: 'top center', visibility: scale ? 'visible' : 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
};

const GhostNumeral = ({ n }: { n: string }) => (
  <div aria-hidden className="absolute select-none pointer-events-none font-extrabold leading-none tracking-tighter z-0"
    style={{ top: '-8%', left: '-6%', fontSize: '780px', color: 'rgba(15,23,42,0.035)', fontFamily: SANS }}>{n}</div>
);

const PARTNERS = [
  { n: 'NASA', l: '/partners/nasa-logo.png' },
  { n: 'NASA T2', l: '/partners/nasa-t2-logo.webp' },
  { n: 'NVIDIA Inception', l: '/partners/nvidia-inception-logo.png' },
  { n: 'Google', l: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png' },
  { n: 'GitHub', l: '/github-logo.png' },
  { n: 'Nasdaq', l: '/nasdaq-logo.png' },
  { n: 'IWG', l: '/partners/iwg-logo.png' },
  { n: 'HSBC', l: '/partners/hsbc-logo.png' },
  { n: 'Lehigh University', l: '/lehigh-university-logo.png' },
  { n: 'MongoDB', l: '/mongodb-logo.webp' },
  { n: 'F6S', l: '/partners/f6s-logo.png' },
  { n: 'TradingView', l: '/partners/tradingview-logo.png' },
  { n: 'Lovable', l: '/partners/lovable-logo.png' },
  { n: 'Decahedron', l: '/partners/decahedron-ventures-logo.jpg' },
  { n: 'Flusso Capital', l: '/partners/flusso-capital-logo.png' },
];

const gradText = (bg: string): React.CSSProperties => ({ background: bg, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' });

export const PartnersAboutPage = () => (
  <ScaledA4>
    <section className="absolute inset-0 overflow-hidden" style={{ background: '#ffffff', fontFamily: SANS }}>
      <GhostNumeral n="02" />
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: `radial-gradient(ellipse at 85% 10%, ${NEON.cyan}10 0%, transparent 55%), radial-gradient(ellipse at 10% 95%, ${NEON.lime}0d 0%, transparent 50%)` }} />
      <div className="absolute top-5 left-12 right-12 flex items-center justify-between font-mono text-[16px] tracking-[0.32em] uppercase z-20">
        <div className="flex items-center gap-2" style={{ color: NEON.cyan }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: NEON.cyan, boxShadow: `0 0 8px ${NEON.cyan}` }} />
          <span>SEC // 01 · EDITION 01</span>
        </div>
        <div className="text-slate-500">INTRODUCTION · STARTUP FACTORY HUB</div>
        <div style={{ color: NEON.cyan }}>P/02 · 14</div>
      </div>
      <div className="absolute bottom-5 left-12 right-12 flex items-center justify-between font-mono text-[11px] tracking-[0.18em] uppercase z-20">
        <span className="text-slate-900/35">// STARTUP FACTORY HUB · GLOBAL ACCELERATOR</span>
        <span className="text-slate-900/35">GLOBAL · REMOTE + ON-SITE</span>
      </div>

      <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: '58px 56px 56px 56px' }}>
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-px w-16" style={{ background: NEON.cyan }} />
            <span className="text-[16px] font-bold tracking-[0.4em] text-slate-400 uppercase">Startup Factory Hub · Vol. 01 · 2026</span>
          </div>
          <span className="text-[44px] font-light tracking-tighter italic" style={{ fontFamily: SERIF, color: 'rgba(15,23,42,0.18)', textDecoration: 'underline', textDecorationColor: NEON.lime, textUnderlineOffset: '8px' }}>P/02</span>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-0 min-h-0">
          <div className="col-span-7 flex flex-col justify-center pr-10 min-w-0">
            <span className="text-[16px] font-bold tracking-[0.32em] uppercase mb-5" style={{ color: NEON.cyan }}>About Startup Factory Hub</span>
            <h1 className="font-extrabold tracking-tight text-slate-900 mb-8" style={{ fontSize: '46px', lineHeight: '1.04', fontFamily: SANS }}>
              The Operating System<br />for the Next{' '}
              <span className="font-extrabold" style={gradText(`linear-gradient(135deg, ${NEON.cyan} 0%, ${NEON.magenta} 55%, ${NEON.lime} 100%)`)}>Generation</span>
              <br />of Founders.
            </h1>
            <div className="flex gap-7">
              <div className="shrink-0 self-stretch">
                <div className="w-[6px] h-full rounded-full" style={{ background: `linear-gradient(180deg, ${NEON.cyan}, ${NEON.magenta}, ${NEON.lime})` }} />
              </div>
              <div className="max-w-[540px] py-1">
                <p className="text-[19px] leading-[1.55] text-slate-600 font-light mb-6">
                  Startup Factory Hub is the infrastructure layer for entrepreneurship in the AI era — connecting{' '}
                  <span className="font-semibold text-slate-900">founders, investors, mentors, advisors, accelerators</span>{' '}
                  and <span className="font-semibold text-slate-900">students</span> through an integrated
                  AI-powered acceleration platform, strategic capital and a globally connected innovation network.
                </p>
                <div className="p-6 bg-slate-50 border-l-4" style={{ borderColor: '#0f172a' }}>
                  <p className="text-slate-900 italic font-medium leading-snug" style={{ fontFamily: SERIF, fontSize: '20px' }}>
                    "Infrastructure is the new intellectual property. The platforms that accompany the founder's journey will define the future of innovation."
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-5 relative">
            <div className="h-full w-full relative overflow-hidden" style={{ boxShadow: '0 40px 80px -30px rgba(15,23,42,0.35)' }}>
              <img src={visionHub.url} alt="Startup Factory Hub innovation district" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.55) 70%, rgba(15,23,42,0.92) 100%), radial-gradient(ellipse at 70% 20%, ${NEON.cyan}30 0%, transparent 55%)` }} />
              <div className="absolute top-10 right-0" style={{ transform: 'rotate(90deg)', transformOrigin: 'top right' }}>
                <span className="text-[16px] font-black tracking-[0.5em] text-white/40 uppercase whitespace-nowrap">Infrastructure First</span>
              </div>
              <div className="absolute inset-x-5 bottom-5 p-5 border" style={{ background: 'rgba(2,6,23,0.92)', borderColor: 'rgba(255,255,255,0.1)' }}>
                <div className="text-[13px] font-bold tracking-[0.25em] uppercase text-slate-400 mb-3">The Platform by the Numbers</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {[
                    { v: '200+', l: 'Members on the Platform', c: NEON.lime },
                    { v: '40+', l: 'Startups Accelerated', c: NEON.cyan },
                    { v: '350+', l: 'Network Members', c: NEON.magenta },
                    { v: '04', l: 'Global Hubs', c: NEON.amber },
                  ].map((s) => (
                    <div key={s.l} className="min-w-0">
                      <div className="text-white font-extrabold mb-1 whitespace-nowrap" style={{ fontSize: '18px', lineHeight: 1 }}>{s.v}</div>
                      <div className="h-[2px] w-6 mb-1.5" style={{ background: s.c }} />
                      <div className="text-[12px] uppercase tracking-[0.12em] text-slate-400 font-bold leading-tight">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 pt-5 border-t relative overflow-hidden" style={{ borderColor: 'rgba(15,23,42,0.08)' }}>
          <div className="absolute inset-y-0 left-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, #ffffff, transparent)' }} />
          <div className="absolute inset-y-0 right-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(270deg, #ffffff, transparent)' }} />
          <div className="flex items-center apex-partners-track" style={{ width: 'max-content' }}>
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <div key={i} className="partner-logo-card flex-shrink-0 px-10 h-18 flex items-center justify-center">
                <img src={p.l} alt={p.n} decoding="async" className="max-h-16 max-w-[200px] object-contain opacity-80 grayscale"
                  onError={(e) => { const card = e.currentTarget.closest('.partner-logo-card') as HTMLElement | null; if (card) card.style.display = 'none'; }} />
              </div>
            ))}
          </div>
          <style>{`@keyframes apex-partners-scroll { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
            .apex-partners-track { animation: apex-partners-scroll 60s linear infinite; will-change: transform; }
            .apex-flipping .apex-partners-track { animation-play-state: paused; }`}</style>
        </div>
      </div>
    </section>
  </ScaledA4>
);

const EVENTS = [
  { img: eventVoyagerOsu.url, kicker: 'Pitch Competition', title: 'Voyager Technologies · Ohio State University', desc: 'High-energy pitch competition connecting startups with NASA technologies, space leaders and venture capital.', accent: NEON.cyan },
  { img: eventLaunchingOrlando, kicker: 'Community', title: 'Startup Factory Hub Launching Party', desc: 'Founders, mentors and investors gathering for the official platform launch.', accent: NEON.magenta },
  { img: eventLakeCounty, kicker: 'Institutional · NASA', title: 'Lake County Mayor · UCF Incubation · NASA', desc: 'Public-private collaboration expanding regional entrepreneurship and space-tech infrastructure.', accent: NEON.lime, logo: nasaLogo },
  { img: eventPlugAndPlay, kicker: 'Deal Flow', title: 'Plug and Play · Accelerator Selection Day', desc: 'Screening and selecting high-potential ventures alongside global accelerators.', accent: NEON.cyan },
];

export const PartnersEcosystemPage = () => {
  const accent = NEON.magenta;
  return (
    <ScaledA4>
      <section className="absolute inset-0 overflow-hidden" style={{ background: `radial-gradient(ellipse at 20% 0%, ${accent}1f 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, ${NEON.magenta}1a 0%, transparent 55%), linear-gradient(180deg, #fbfcfe 0%, #eef2f8 100%)`, fontFamily: SANS }}>
        <div className="absolute pointer-events-none z-[5]" style={{ inset: 16, borderRadius: 28, border: '1px solid rgba(255,255,255,0.7)', boxShadow: '0 0 0 1px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.9)' }} />
        <div className="absolute top-5 left-12 right-12 flex items-center justify-between font-mono text-[16px] tracking-[0.32em] uppercase pointer-events-none z-20">
          <div className="flex items-center gap-2" style={{ color: accent }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
            <span>SEC // 03</span>
          </div>
          <div className="text-slate-500">EVENTS & ACTIVATIONS</div>
          <div style={{ color: accent }}>P/03 · 14</div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none px-12 pb-4 pt-3" style={{ background: 'linear-gradient(180deg, rgba(238,242,248,0) 0%, rgba(238,242,248,0.92) 45%)' }}>
          <div className="h-px w-full mb-2" style={{ background: `linear-gradient(90deg, transparent, ${accent}55, transparent)` }} />
          <div className="flex items-center justify-between gap-6 font-mono text-[10px] tracking-[0.22em] uppercase leading-none whitespace-nowrap">
            <span className="text-slate-500 truncate">STARTUP FACTORY HUB · ACCELERATOR AS A SERVICE</span>
            <span className="shrink-0" style={{ color: accent }}>GLOBAL · REMOTE + ON-SITE</span>
          </div>
        </div>

        <div className="absolute inset-0 z-10 flex flex-col" style={{ padding: '70px 50px 74px 50px' }}>
          <GhostNumeral n="03" />
          <div className="relative z-10 flex-1 min-h-0 flex flex-col">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="h-px w-16" style={{ background: accent }} />
                <span className="text-[16px] font-bold tracking-[0.4em] text-slate-400 uppercase">Events &amp; Activations · Vol. 01</span>
              </div>
              <span className="text-[44px] font-light tracking-tighter italic" style={{ fontFamily: SERIF, color: 'rgba(15,23,42,0.18)', textDecoration: 'underline', textDecorationColor: accent, textUnderlineOffset: '8px' }}>P/03</span>
            </div>

            <h1 className="font-extrabold tracking-tight text-slate-900 mb-5" style={{ fontSize: '46px', lineHeight: 1.04, fontFamily: SANS }}>
              Where the{' '}
              <span className="font-extrabold" style={gradText(`linear-gradient(135deg, ${NEON.magenta} 0%, ${NEON.cyan} 60%, ${NEON.lime} 100%)`)}>ecosystem meets.</span>
            </h1>

            <div className="relative overflow-hidden shrink-0" style={{ height: '33%', boxShadow: '0 40px 80px -30px rgba(15,23,42,0.35)' }}>
              <img src={eventArtemisWatchParty} alt="Artemis 2 Watch Party AR Experience" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.72) 42%, rgba(255,255,255,0.05) 74%, transparent 100%)' }} />
              <div className="relative z-10 h-full flex gap-6 items-center px-6 max-w-[68%]">
                <div className="shrink-0 self-stretch py-4">
                  <div className="w-[6px] h-full rounded-full" style={{ background: `linear-gradient(180deg, ${NEON.magenta}, ${NEON.cyan}, ${NEON.lime})` }} />
                </div>
                <div className="min-w-0">
                  <span className="text-[13px] font-bold tracking-[0.32em] uppercase" style={{ color: accent }}>Official Host · Featured</span>
                  <h3 className="font-extrabold tracking-tight text-slate-900 leading-[1.06] mt-2" style={{ fontSize: '30px', fontFamily: SANS }}>Artemis 2 Watch Party — AR Experience</h3>
                  <p className="text-[16px] leading-[1.5] text-slate-600 font-light mt-2">
                    Startup Factory Hub is the <span className="font-semibold text-slate-900">Official Host</span> of the Artemis 2
                    Watch Party, delivering an immersive AR experience celebrating humanity's return to the Moon.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-4 mt-4">
              {EVENTS.map((e) => (
                <div key={e.title} className="relative overflow-hidden min-h-0" style={{ boxShadow: '0 26px 50px -26px rgba(15,23,42,0.4)' }}>
                  <img src={e.img} alt={e.title} decoding="async" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 34%, rgba(255,255,255,0.9) 62%, rgba(255,255,255,0.97) 100%)' }} />
                  {e.logo && (
                    <div className="absolute top-3 right-3 z-20 bg-white/90 p-1.5 shadow-md">
                      <img src={e.logo} alt="NASA logo" className="h-6 w-auto object-contain" />
                    </div>
                  )}
                  <div className="relative z-10 h-full flex flex-col justify-end p-4">
                    <div className="h-[3px] w-8 mb-2" style={{ background: e.accent }} />
                    <span className="text-[11px] font-bold tracking-[0.28em] uppercase" style={{ color: e.accent }}>{e.kicker}</span>
                    <h4 className="font-extrabold tracking-tight text-slate-900 leading-[1.1] mt-1 break-words" style={{ fontSize: '18px', fontFamily: SANS }}>{e.title}</h4>
                    <p className="text-[13px] leading-[1.45] text-slate-600 font-light mt-1">{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 mt-4 flex items-center gap-5 p-5 bg-slate-50 border-l-4" style={{ borderColor: accent }}>
              <span className="text-[11px] font-bold tracking-[0.32em] uppercase shrink-0" style={{ color: accent }}>Upcoming</span>
              <p className="min-w-0 text-slate-900 italic font-medium leading-snug" style={{ fontFamily: SERIF, fontSize: '19px' }}>
                "Space Symposium — Times Square XR Experience: an immersive activation showcasing space technology innovation."
              </p>
              <Smartphone className="h-6 w-6 shrink-0 ml-auto" style={{ color: accent }} />
            </div>
          </div>
        </div>
      </section>
    </ScaledA4>
  );
};
