/**
 * /forpartners brochure — "White-label the platform" page (silver edition).
 * For partners who want the full platform and network under their own brand.
 * © Imagine Engine Studios Corp — Startup Factory Hub.
 */
import sfhLogo from '@/assets/sfh-logo-combined.png';

const ITEMS = [
  { t: 'Your brand, end to end', d: 'Your name, logo, colors and domain across every screen, email and certificate.' },
  { t: 'The whole network included', d: 'Your members connect with founders, mentors, advisors, investors and corporates worldwide.' },
  { t: 'Every platform feature', d: 'Programs, journey mapping, resources, events, Genius AI, data rooms and analytics.' },
  { t: 'Your own community', d: 'Run your cohorts, mentors and partners in your space, with your rules and your staff.' },
  { t: 'Global from day one', d: 'Access our hubs, offices, events and soft-landing partners in multiple countries.' },
  { t: 'We run the technology', d: 'Hosting, security, updates and support handled by Startup Factory Hub in the background.' },
];

const NODES = ['Founders', 'Mentors', 'Investors', 'Corporates', 'Advisors', 'Global hubs'];

export default function WhiteLabelPartnerPage({ pageNum }: { pageNum: number }) {
  return (
    <section className="partner-white-label absolute inset-0 overflow-hidden" aria-label="White-label partner platform">
      <div className="wl-metal-sheen" aria-hidden="true" />
      <div className="wl-content">
        <div className="wl-eyebrow"><span>PARTNER EDITION / WHITE-LABEL</span><span>P/{String(pageNum).padStart(2, '0')}</span></div>
        <h2 className="wl-title">Your brand.<br /><span>Our entire ecosystem.</span></h2>
        <p className="wl-intro">White-label Startup Factory Hub. Launch your own innovation platform, connected to our global network from day one.</p>

        <div className="wl-network" role="img" aria-label="Your branded platform connected to founders, mentors, investors, corporates, advisors and global hubs">
          <div className="wl-code-rain" aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => <span key={i}>{('01アイウSFHケコ101テナニ001'.repeat(5)).slice(i % 9)}</span>)}
          </div>
          <div className="wl-network-grid" aria-hidden="true" />
          <div className="wl-network-top"><span>ONE PLATFORM. NO SILOS.</span><span>SFH / NETWORK</span></div>
          <svg className="wl-connections" viewBox="0 0 750 330" aria-hidden="true">
            {[70, 165, 260].flatMap((y) => [150, 600].map((x) => <path key={`${x}-${y}`} d={`M375 165 C${x === 150 ? 270 : 480} 165 ${x === 150 ? 270 : 480} ${y} ${x} ${y}`} />))}
            <ellipse className="wl-orbit" cx="375" cy="165" rx="130" ry="104" />
            <ellipse className="wl-orbit wl-orbit-inner" cx="375" cy="165" rx="111" ry="84" />
            {[70, 165, 260].flatMap((y) => [150, 600].map((x) => <circle key={`${x}-${y}`} r="3"><animateMotion dur="3.5s" repeatCount="indefinite" path={`M${x} ${y} C${x === 150 ? 270 : 480} ${y} ${x === 150 ? 270 : 480} 165 375 165`} /></circle>))}
          </svg>
          <div className="wl-core"><span>WHITE-LABEL</span><strong>Your<br />platform.</strong><small>POWERED BY SFH</small></div>
          <div className="wl-node-list">{NODES.map((node, i) => <div className={`wl-node wl-node-${i}`} key={node}><span className="wl-node-mark" /><span>{node}</span></div>)}</div>
          <div className="wl-network-bottom"><span>YOUR IDENTITY</span><span>SHARED GLOBAL REACH</span></div>
        </div>

        <div className="wl-benefits">{ITEMS.map(({ t, d }, i) => <article className="wl-benefit" key={t}><span className="wl-index">0{i + 1}</span><div><h3>{t}</h3><p>{d}</p></div></article>)}</div>
        <footer className="wl-footer"><div><span>YOUR BRAND. YOUR COMMUNITY.</span><p>You own the experience.<br />We power it.</p></div><img src={sfhLogo} alt="Startup Factory Hub" /></footer>
      </div>
    </section>
  );
}
