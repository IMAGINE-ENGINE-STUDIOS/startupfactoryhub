import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@google/model-viewer';
import roverAsset from '@/assets/perseverance-rover.glb.asset.json';
import { Button } from '@/components/ui/button';
import {
  Rocket, Hammer, Users, FlaskConical, Globe, DollarSign, Presentation, FileCheck2, Cpu,
  Satellite, MapPin, Brain, Coffee, PenLine, Building2, Store, CalendarDays, FileText, Landmark,
  View, ArrowRight, ChevronDown, Percent, Orbit,
} from 'lucide-react';

const BENEFITS = [
  { code: 'BLD', icon: Hammer, title: 'Build your MVP', desc: 'Move from concept to shipped product in weeks with dedicated engineering, design and product support embedded in your batch.' },
  { code: 'MTR', icon: Users, title: 'Mentorship & Advisory', desc: 'Weekly 1:1 sessions with founders and operators who have built, scaled and exited companies in your vertical.' },
  { code: 'VAL', icon: FlaskConical, title: 'Market Validation', desc: 'Run structured experiments, interview real customers and collect telemetry that proves product-market fit before demo day.' },
  { code: 'NET', icon: Globe, title: 'Global Network', desc: 'Plug into a worldwide mesh of partners, offices, enterprise clients and distribution channels across three continents.' },
  { code: 'CAP', icon: DollarSign, title: 'Funding Access', desc: 'Get introduced to active seed and pre-seed investors, plus optional capital from the program and its alumni syndicate.' },
  { code: 'DMO', icon: Presentation, title: 'Demo Day', desc: 'Pitch on a curated stage in front of investors, corporates and press with a polished narrative and live product demo.' },
  { code: 'RDY', icon: FileCheck2, title: 'Investor Readiness', desc: 'Leave the program with a data room, financial model, cap table, pitch deck and the storytelling skills to close a round.' },
  { code: 'TCH', icon: Cpu, title: 'Technology & AI Stack', desc: 'Full access to the Startup Factory Hub platform: AI tools, business intelligence engine, 200+ open-source technologies and cloud credits.' },
];

const EXTRAS = [
  { icon: Satellite, title: 'Space Industry Access', desc: 'Connections through our space ecosystem, including NASA Kennedy Space Center and UK Space Agency programs.' },
  { icon: MapPin, title: '130 Countries, 5,800 Locations', desc: 'Physical workspace and hubs across the network, wherever your team operates.' },
  { icon: Brain, title: 'Genius AI Co-Pilot', desc: 'AI guidance for strategy, market research, documents and next steps, every day.' },
  { icon: Rocket, title: 'Accelerated Fundraising', desc: 'AI investor matching and warm introductions through our fundraising engine.' },
  { icon: Building2, title: 'Corporate Pilots', desc: 'Direct access to corporate partners for pilots and first enterprise customers.' },
  { icon: PenLine, title: 'Digital Equity Contracts', desc: 'Sign agreements online with live documents and a full activity record.' },
  { icon: Landmark, title: 'Grants & Programs', desc: 'Guidance to grants, government programs and non-dilutive capital.' },
  { icon: Store, title: 'Marketplace', desc: 'Sell and buy services, tools and products inside the community.' },
  { icon: CalendarDays, title: 'Events & Districts', desc: 'Host and join events and community districts across the network.' },
  { icon: FileText, title: 'LightPaper', desc: 'Publish and share your startup documents in one place.' },
  { icon: Coffee, title: 'Members Club', desc: 'Access to the Members Club community and its perks.' },
];

const STEPS = [
  { n: '01', t: 'Create your account', d: 'Sign up on Startup Factory Hub and complete your startup profile.' },
  { n: '02', t: 'Submit your application', d: 'Tell us about your team, technology, stage, market and goals.' },
  { n: '03', t: 'Review & interview', d: 'Our team reviews your application and meets with the founders.' },
  { n: '04', t: 'Sign digitally', d: 'Accepted startups sign the equity agreement online.' },
  { n: '05', t: 'Launch', d: 'Get full access to the network, platform and program from day one.' },
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('eq-in')),
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function EquityProgram() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const mvRef = useRef<HTMLElement>(null);
  useReveal();

  useEffect(() => {
    document.title = 'Equity Program | Startup Factory Hub';
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = mvRef.current;
    if (!el) return;
    const onLoad = () => setLoaded(true);
    el.addEventListener('load', onLoad);
    return () => el.removeEventListener('load', onLoad);
  }, []);

  const apply = () => navigate('/auth?mode=signup');

  return (
    <div
      className="relative min-h-screen overflow-x-hidden text-foreground"
      style={{ background: 'linear-gradient(160deg,#030712 0%,#040b1c 45%,#02040c 100%)' }}
    >
      <style>{`
        [data-reveal]{opacity:0;transform:translateY(40px);transition:opacity .9s ease,transform .9s cubic-bezier(.2,.8,.2,1)}
        [data-reveal].eq-in{opacity:1;transform:none}
        @keyframes eq-orbit{to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes eq-scan{0%{top:0}100%{top:100%}}
        @keyframes eq-pulse{0%,100%{opacity:.35}50%{opacity:1}}
        @keyframes eq-star{from{transform:translateY(0)}to{transform:translateY(-2000px)}}
        @keyframes eq-trace{0%{stroke-dashoffset:400}100%{stroke-dashoffset:0}}
        @keyframes eq-node{0%,100%{opacity:.25;transform:scale(.85)}50%{opacity:1;transform:scale(1.15)}}
        @keyframes eq-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes eq-sweep{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
      `}</style>

      {/* Deep-space starfield */}
      <div aria-hidden className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute inset-0 h-[4000px] animate-[eq-star_140s_linear_infinite]" style={{
          backgroundImage: 'radial-gradient(1px 1px at 20px 30px,rgba(255,255,255,.8),transparent),radial-gradient(1px 1px at 140px 90px,rgba(255,255,255,.5),transparent),radial-gradient(1.5px 1.5px at 260px 160px,rgba(34,211,238,.9),transparent),radial-gradient(1px 1px at 380px 50px,rgba(255,255,255,.6),transparent),radial-gradient(1.2px 1.2px at 320px 200px,rgba(129,140,248,.8),transparent)',
          backgroundSize: '420px 220px',
        }} />
      </div>

      {/* HERO · same design as MVP / Accelerated Fundraising, rover on the left */}
      <section className="relative overflow-hidden border-b border-white/10">
        {/* nebula glows */}
        <div className="pointer-events-none absolute -left-40 top-0 h-[600px] w-[600px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.28),transparent 70%)' }} />
        <div className="pointer-events-none absolute right-0 -bottom-40 h-[520px] w-[520px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle,rgba(20,184,166,0.25),transparent 70%)' }} />
        <div className="pointer-events-none absolute left-1/3 top-1/4 h-72 w-72 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle,rgba(236,72,153,0.12),transparent 70%)' }} />
        {/* tech grid + intersection dots */}
        <div className="pointer-events-none absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(20,184,166,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.07) 1px, transparent 1px), radial-gradient(rgba(20,184,166,0.28) 1.4px, transparent 1.5px)',
          backgroundSize: '50px 50px, 50px 50px, 50px 50px',
        }} />
        {/* orbital rings behind rover */}
        {[520, 720, 920].map((s, i) => (
          <div key={s} aria-hidden className="pointer-events-none absolute left-[28%] top-1/2 rounded-full border"
            style={{ width: s, height: s, borderColor: 'rgba(34,211,238,0.14)', animation: `eq-orbit ${40 + i * 20}s linear infinite${i % 2 ? ' reverse' : ''}` }}>
            <span className="absolute -top-1.5 left-1/2 h-3 w-3 rounded-full" style={{ background: '#22d3ee', boxShadow: '0 0 20px #22d3ee' }} />
          </div>
        ))}
        {/* circuit traces */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1200 630" aria-hidden>
          {['M0,180 L440,620', 'M60,0 L560,500', 'M660,0 L1200,540', 'M456,630 L1200,126', 'M0,346 L360,0'].map((d, i) => (
            <path key={d} d={d} stroke="rgba(34,211,238,0.18)" strokeWidth="1.2" fill="none" strokeDasharray="6 14"
              style={{ animation: `eq-trace ${14 + i * 3}s linear infinite` }} />
          ))}
          {[[245, 165], [460, 390], [130, 420], [880, 180], [1040, 470]].map(([cx, cy], i) => (
            <circle key={cx} cx={cx} cy={cy} r="4" fill={i % 2 ? '#22d3ee' : '#14b8a6'}
              style={{ animation: `eq-node ${3 + i * 0.6}s ease-in-out infinite` }} />
          ))}
        </svg>
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,#14b8a6,#22d3ee,#818cf8)' }} />
        {['left-5 top-5 border-l-2 border-t-2', 'right-5 top-5 border-r-2 border-t-2', 'bottom-5 left-5 border-b-2 border-l-2', 'bottom-5 right-5 border-b-2 border-r-2'].map((c) => (
          <span key={c} aria-hidden className={`pointer-events-none absolute h-8 w-8 ${c}`} style={{ borderColor: 'rgba(20,184,166,0.6)' }} />
        ))}

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
          {/* Interactive 3D rover (left) */}
          <div className="relative h-[460px] sm:h-[580px]" style={{ animation: 'eq-float 8s ease-in-out infinite' }}>
            <div className="absolute inset-0 overflow-hidden rounded-3xl backdrop-blur-sm"
              style={{ border: '1px solid rgba(34,211,238,0.3)', background: 'radial-gradient(circle at 50% 60%,rgba(20,184,166,0.12),rgba(4,10,24,0.6) 70%)', boxShadow: '0 0 60px -20px rgba(34,211,238,0.5)' }}>
              <span aria-hidden className="pointer-events-none absolute inset-x-0 h-px animate-[eq-scan_4s_linear_infinite]" style={{ background: 'linear-gradient(90deg,transparent,#22d3ee,transparent)' }} />
              {['left-3 top-3 border-l border-t', 'right-3 top-3 border-r border-t', 'left-3 bottom-3 border-l border-b', 'right-3 bottom-3 border-r border-b'].map((c) => (
                <span key={c} aria-hidden className={`pointer-events-none absolute h-6 w-6 ${c}`} style={{ borderColor: 'rgba(34,211,238,0.7)' }} />
              ))}
              <model-viewer
                ref={mvRef as never}
                src={roverAsset.url}
                alt="Interactive 3D model of NASA's Perseverance Mars rover"
                ar
                ar-modes="webxr scene-viewer quick-look"
                ar-scale="auto"
                ar-placement="floor"
                environment-image="neutral"
                auto-rotate
                camera-controls
                touch-action="pan-y"
                loading="eager"
                shadow-intensity="1.5"
                exposure="1.15"
                camera-orbit="35deg 72deg auto"
                interaction-prompt="auto"
                style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
              >
                <button slot="ar-button" className="absolute bottom-5 right-5 z-10 flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur"
                  style={{ background: 'linear-gradient(90deg,#0d9488,#14b8a6)', border: '1px solid rgba(34,211,238,0.6)' }}>
                  <View className="h-4 w-4" /> View in AR
                </button>
              </model-viewer>
              {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center font-mono text-xs uppercase tracking-[0.3em] animate-[eq-pulse_1.6s_ease-in-out_infinite]" style={{ color: '#22d3ee' }}>
                  Loading rover…
                </div>
              )}
              <div className="pointer-events-none absolute left-5 top-5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
                <p style={{ color: '#22d3ee' }}>Perseverance · NASA</p>
                <p>Drag to rotate · Pinch to zoom</p>
              </div>
              <div className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: '#22d3ee' }}>
                <span className="h-2 w-2 rounded-full animate-[eq-pulse_1.2s_ease-in-out_infinite]" style={{ background: '#22d3ee' }} /> Live 3D · AR ready
              </div>
            </div>
          </div>

          {/* Copy (right) */}
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: '#14b8a6', border: '1px solid rgba(20,184,166,0.5)', background: 'linear-gradient(90deg, rgba(20,184,166,0.25), rgba(20,184,166,0.05))' }}>
                <Orbit className="h-3.5 w-3.5" /> Startup Factory Hub&nbsp; | &nbsp;Equity Program
              </span>
              <span className="relative inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
                style={{ borderColor: 'rgba(34,211,238,0.45)', color: '#22d3ee', background: 'rgba(34,211,238,0.08)' }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: '#22d3ee' }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: '#22d3ee' }} />
                </span>
                Applications Open
              </span>
            </div>

            <h1 className="font-black uppercase leading-[0.92] tracking-tight">
              <span className="block text-2xl font-light tracking-[0.06em] text-white/85 sm:text-4xl">Launch with the whole network</span>
              <span className="block text-[2.6rem] leading-[0.9] sm:text-[3.8rem] lg:text-[4.6rem]"
                style={{ backgroundImage: 'linear-gradient(90deg,#f59e0b 0%,#22d3ee 45%,#6366f1 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 0 28px rgba(34,211,238,0.4))' }}>
                Equity Program
              </span>
              <span className="block text-2xl font-light tracking-[0.06em] text-white/85 sm:text-4xl">For just 1% equity</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: 'rgba(34,211,238,0.9)' }}>
              The full Startup Factory Hub accelerator: build, validate, raise and scale.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
              With 130 countries and 5,800 locations at your side, from day one.
            </p>

            <div className="mt-6 h-px w-full max-w-md" style={{ background: 'linear-gradient(90deg, rgba(20,184,166,0.8), rgba(20,184,166,0.25), transparent)' }} />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={apply}
                className="group relative overflow-hidden rounded-full px-9 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white transition-transform duration-300 hover:scale-[1.03]"
                style={{ background: 'linear-gradient(90deg,#0d9488,#14b8a6,#0d9488)', border: '1.5px solid rgba(34,211,238,0.55)', boxShadow: '0 0 45px -8px rgba(20,184,166,0.75)' }}>
                <span className="relative z-10">Apply now →</span>
                <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
              <button onClick={() => document.getElementById('terms')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-full px-9 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white transition-transform duration-300 hover:scale-[1.03]"
                style={{ background: 'linear-gradient(90deg,#4f46e5,#818cf8,#4f46e5)', border: '1.5px solid rgba(167,139,250,0.7)', boxShadow: '0 0 45px -10px rgba(129,140,248,0.7)' }}>
                See the Terms
              </button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-xl"
              style={{ background: 'rgba(20,184,166,0.18)', border: '1px solid rgba(20,184,166,0.25)' }}>
              {[['Equity', '1%'], ['Countries', '130'], ['Locations', '5,800']].map(([k, v]) => (
                <div key={k} className="px-4 py-4 backdrop-blur-sm" style={{ background: 'rgba(4,14,26,0.85)' }}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(34,211,238,0.75)' }}>{k}</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-white">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TERMS */}
      <section id="terms" className="relative mx-auto max-w-6xl px-6 py-28">
        <div data-reveal className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">The Terms</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">Simple. Aligned. 1%.</h2>
        </div>
        <div data-reveal className="relative mt-16 grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="relative mx-auto flex h-72 w-72 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-primary/30 animate-[spin_30s_linear_infinite]" />
            <div className="absolute inset-6 rounded-full border border-dashed border-primary/40 animate-[spin_20s_linear_infinite_reverse]" />
            <div className="absolute inset-12 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative text-center">
              <p className="text-8xl font-bold text-primary drop-shadow-[0_0_30px_hsl(var(--primary)/0.6)]">1<Percent className="inline h-14 w-14" /></p>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Equity</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              ['1% equity stake', 'Startup Factory Hub takes 1% equity in exchange for full program and network access.'],
              ['We win when you win', 'Our return comes from your success, so every part of the network works for your growth.'],
              ['Signed online', 'The agreement is signed digitally on the platform, with a full record of every step.'],
              ['Full access from day one', 'Every benefit on this page opens up as soon as you are accepted.'],
            ].map(([t, d]) => (
              <div key={t} className="tech-card border-0 rounded-2xl p-6">
                <h3 className="text-xl font-semibold">{t}</h3>
                <p className="mt-1 text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW TO APPLY */}
      <section className="relative mx-auto max-w-6xl px-6 py-28">
        <div data-reveal className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">How to Apply</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">Five steps to launch</h2>
        </div>
        <div className="relative mt-16">
          <div aria-hidden className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent md:left-1/2" />
          {STEPS.map((s, i) => (
            <div key={s.n} data-reveal className={`relative mb-10 flex md:w-1/2 ${i % 2 ? 'md:ml-auto md:pl-12' : 'md:pr-12 md:text-right'} pl-16 md:pl-0`}>
              <span className={`absolute top-4 left-6 -translate-x-1/2 h-4 w-4 rounded-full bg-primary shadow-[0_0_20px_hsl(var(--primary))] ${i % 2 ? 'md:left-0' : 'md:left-auto md:right-0 md:translate-x-1/2'}`} />
              <div className="tech-card border-0 w-full rounded-2xl p-6">
                <p className="font-mono text-sm text-primary">{s.n}</p>
                <h3 className="mt-1 text-2xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="relative mx-auto max-w-7xl px-6 py-28">
        <div data-reveal className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">Why Join the Program</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">From idea to investable MVP</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">A structured acceleration experience designed to take a startup from idea to investable MVP in a single, high-intensity batch.</p>
        </div>
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, i) => (
            <div key={b.code} data-reveal style={{ transitionDelay: `${(i % 4) * 90}ms` }}
              className="group tech-card border-0 relative overflow-hidden rounded-2xl p-6 transition-transform duration-500 hover:-translate-y-2">
              <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity opacity-0 group-hover:opacity-100" />
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/5">
                  <b.icon className="h-6 w-6 text-primary" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{b.code} · 0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* EXTRAS */}
      <section className="relative mx-auto max-w-7xl px-6 py-28">
        <div data-reveal className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">Plus the Full Network</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">Everything else we unlock</h2>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXTRAS.map((e, i) => (
            <div key={e.title} data-reveal style={{ transitionDelay: `${(i % 3) * 80}ms` }}
              className="group tech-card border-0 flex gap-4 rounded-2xl p-5 transition-colors hover:bg-primary/5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 shadow-[0_0_24px_hsl(var(--primary)/0.25)]">
                <e.icon className="h-5 w-5 text-primary" />
              </span>
              <div>
                <h3 className="font-semibold">{e.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-32 text-center">
        <div aria-hidden className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div data-reveal className="relative">
          <h2 className="text-5xl font-bold tracking-tight sm:text-7xl">Ready for launch?</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">Apply to the Equity Program and bring your startup into the network.</p>
          <Button size="lg" onClick={apply} className="mt-10 gap-2 px-10 shadow-[0_0_50px_hsl(var(--primary)/0.5)]">
            Apply Now <Rocket className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
