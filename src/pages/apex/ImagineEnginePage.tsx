/**
 * APEX brochure — Imagine Engine, the platform's own AI coding application.
 * Credits: Imagine Engine Studios Corp.
 */
import logo from '@/assets/imagine-engine-logo-purple.png';

const VIOLET = '#a78bfa';
const FUCHSIA = '#e879f9';

const FEATURES: [string, string][] = [
  ['Build by chatting', 'Describe an app or website and the AI writes, previews and refines it live.'],
  ['Visual canvas', 'Edit pages, layouts and content directly on screen, no code required.'],
  ['Flow automations', 'Connect steps and data visually to automate how the app works.'],
  ['Real databases', 'Plug in Supabase or SurrealDB so apps store real data from day one.'],
  ['GitHub sync', 'Push projects to GitHub to keep code owned, versioned and portable.'],
  ['Ready-made blocks', 'CRM, online store, kanban, wizards, games and 3D scenes in one click.'],
  ['3D Studio', 'Create interactive 3D worlds and products inside the same project.'],
  ['Genius AI', 'Plain-language summaries and guidance at every step of the build.'],
  ['One-click publish', 'Ship live apps founders can share with customers and investors.'],
];

export const ApexImagineEnginePage = () => (
  <section className="absolute inset-0 flex flex-col overflow-hidden" style={{
    background: 'radial-gradient(ellipse at 85% 5%, rgba(167,139,250,0.28) 0%, transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(232,121,249,0.18) 0%, transparent 55%), linear-gradient(180deg,#1a0b33 0%,#0b0518 100%)',
    color: '#ede9fe',
  }}>
    <div className="absolute inset-0 pointer-events-none opacity-40" style={{
      backgroundImage: `linear-gradient(${VIOLET}14 1px, transparent 1px), linear-gradient(90deg, ${VIOLET}14 1px, transparent 1px)`,
      backgroundSize: '28px 28px',
    }} />
    <div className="relative z-10 flex flex-col h-full px-[6%] pt-[5%] pb-[4%]">
      <div className="font-mono uppercase" style={{ fontSize: 11, letterSpacing: '0.28em', color: VIOLET, fontWeight: 700 }}>
        imagine_engine://ai-builder
      </div>
      <div className="mt-3 flex items-center gap-4">
        <img src={logo} alt="Imagine Engine" className="w-24 h-24 rounded-full shrink-0" style={{ boxShadow: `0 0 28px ${VIOLET}88` }} />
        <div className="min-w-0">
          <h2 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1, color: '#fff' }}>Imagine Engine</h2>
          <p className="mt-1" style={{ fontSize: 14, lineHeight: 1.4, color: '#ddd6fe' }}>
            Our own AI coding application. Founders turn ideas into working apps, websites and prototypes without a development team.
          </p>
        </div>
      </div>
      <div className="mt-3 h-[2px] w-16 rounded-full" style={{ background: `linear-gradient(90deg, ${VIOLET}, ${FUCHSIA})` }} />
      <div className="mt-3 flex-1 min-h-0 grid grid-cols-2 gap-2" style={{ gridAutoRows: 'minmax(0, 1fr)' }}>
        {FEATURES.map(([t, d], i) => (
          <div key={t} className={`rounded-lg p-2.5 min-h-0 overflow-hidden ${i === FEATURES.length - 1 ? 'col-span-2' : ''}`} style={{
            background: 'rgba(46,22,92,0.62)', border: `1px solid ${VIOLET}40`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{t}</div>
            <div className="mt-0.5" style={{ fontSize: 11, lineHeight: 1.35, color: '#ddd6fe' }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
