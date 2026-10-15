/**
 * APEX brochure — closing "One unified innovation platform" page,
 * styled after the Startup Factory Hub interface (neon green, matrix grid).
 * Credits: Imagine Engine Studios Corp.
 */
import { QRCodeSVG } from 'qrcode.react';
import { EcosystemOrbit } from './EcosystemOrbit';

const NEO = '#22e58a';
const CY = '#22d3ee';
const MONO = "'JetBrains Mono', ui-monospace, monospace";

export const UnifiedPlatformPage = ({ logo, url }: { logo: string; url: string }) => (
  <section className="absolute inset-0 flex flex-col overflow-hidden" style={{
    background: 'radial-gradient(ellipse at 50% 45%, rgba(34,229,138,0.12) 0%, transparent 55%), linear-gradient(180deg,#020806 0%,#000302 100%)',
    color: '#d1fae5',
  }}>
    <div className="absolute inset-0 pointer-events-none" style={{
      backgroundImage: `linear-gradient(${NEO}10 1px, transparent 1px), linear-gradient(90deg, ${NEO}10 1px, transparent 1px)`,
      backgroundSize: '26px 26px',
    }} />
    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.25) 0 1px, transparent 1px 3px)' }} />
    <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${NEO}, ${CY}, transparent)` }} />

    <div className="relative z-10 flex flex-col h-full px-[7%] pt-[6%] pb-[5%]">
      <div className="flex items-center justify-between" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.26em', color: NEO }}>
        <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEO, boxShadow: `0 0 8px ${NEO}` }} />SFH://PLATFORM</span>
        <span style={{ color: '#4ade80aa' }}>SYSTEM ONLINE</span>
      </div>
      <h2 className="mt-4" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 30, fontWeight: 700, lineHeight: 1.08, color: '#f0fdf4' }}>
        One unified <span style={{ color: NEO, textShadow: `0 0 18px ${NEO}88` }}>innovation platform</span>
      </h2>
      <p className="mt-2" style={{ fontSize: 15, lineHeight: 1.5, color: '#a7f3d0cc' }}>
        Centralized resources, a managed mentor network, AI-driven strategy, a clear path from idea to investment, powerful administration, embedded partner resources and real-time analytics. Together, we can help Apex's startups build faster and grow further.
      </p>
      <div className="flex-1 min-h-0 flex items-center justify-center my-2">
        <EcosystemOrbit logo={logo} size={340} />
      </div>
      <div className="flex items-center gap-4 rounded-lg p-3" style={{ background: 'rgba(2,20,12,0.8)', border: `1px solid ${NEO}55`, boxShadow: `0 0 24px ${NEO}22` }}>
        <div className="p-1.5 rounded" style={{ background: '#f0fdf4' }}><QRCodeSVG value={url} size={60} /></div>
        <div className="flex flex-col gap-1">
          <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.2em', color: NEO }}>&gt; SCAN_TO_OPEN</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#f0fdf4' }}>Open this proposal</span>
          <span style={{ fontFamily: MONO, fontSize: 13, color: '#a7f3d0' }}>startupfactoryhub.com</span>
        </div>
      </div>
    </div>
  </section>
);
