import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import sfhLogo from '@/assets/sfh-logo-emblem.png';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

const SFH_ACCELERATOR_ID = 'abd41d15-f707-4e36-b2f5-3a08d7b7b13a';

interface ProgramProfile {
  organization_name: string;
  description: string | null;
  website: string | null;
  external_link: string | null;
  program_duration: string | null;
  equity_percentage: number | null;
  funding_offered: number | null;
  is_accepting_applications: boolean | null;
  logo_url: string | null;
  location: string | null;
  total_cohorts: number | null;
  total_startups_supported: number | null;
}

interface OpenCohort {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  application_deadline: string | null;
  max_startups: number;
  current_startups: number;
  funding_per_startup: number | null;
  equity_percentage: number | null;
  focus_industries: string[] | null;
  enrollment_fee: number | null;
  status: string;
}

const WHY_JOIN = [
  {
    id: '01',
    code: 'BLD',
    title: 'Build your MVP',
    desc: 'Move from concept to shipped product in weeks with dedicated engineering, design and product support embedded in your batch.',
    detail: ['Dedicated build squad', 'Weekly shipping cadence', 'Production-grade stack'],
    glow: 'hsl(160 84% 45% / 0.55)',
  },
  {
    id: '02',
    code: 'MTR',
    title: 'Mentorship & Advisory',
    desc: 'Weekly 1:1 sessions with founders and operators who have built, scaled and exited companies in your vertical.',
    detail: ['1:1 operator sessions', 'Vertical-matched mentors', 'Advisory board access'],
    glow: 'hsl(200 90% 55% / 0.5)',
  },
  {
    id: '03',
    code: 'VAL',
    title: 'Market Validation',
    desc: 'Run structured experiments, interview real customers and collect telemetry that proves product-market fit before demo day.',
    detail: ['Customer discovery loops', 'Experiment framework', 'Telemetry dashboards'],
    glow: 'hsl(275 80% 62% / 0.5)',
  },
  {
    id: '04',
    code: 'NET',
    title: 'Global Network',
    desc: 'Plug into a worldwide mesh of partners, offices, enterprise clients and distribution channels across three continents.',
    detail: ['Offices on 3 continents', 'Enterprise intros', 'Partner marketplace'],
    glow: 'hsl(28 92% 58% / 0.5)',
  },
  {
    id: '05',
    code: 'CAP',
    title: 'Funding Access',
    desc: 'Get introduced to active seed and pre-seed investors, plus optional capital from the program and its alumni syndicate.',
    detail: ['Investor mesh access', 'Alumni syndicate', 'Program capital option'],
    glow: 'hsl(142 76% 45% / 0.5)',
  },
  {
    id: '06',
    code: 'DMO',
    title: 'Demo Day',
    desc: 'Pitch on a curated stage in front of investors, corporates and press with a polished narrative and live product demo.',
    detail: ['Curated investor room', 'Narrative coaching', 'Live product demo'],
    glow: 'hsl(340 82% 60% / 0.5)',
  },
  {
    id: '07',
    code: 'RDY',
    title: 'Investor Readiness',
    desc: 'Leave the program with a data room, financial model, cap table, pitch deck and the storytelling skills to close a round.',
    detail: ['Data room build-out', 'Financial model & cap table', 'Deck + storytelling'],
    glow: 'hsl(190 85% 50% / 0.5)',
  },
  {
    id: '08',
    code: 'TCH',
    title: 'Technology & AI Stack',
    desc: 'Full access to the Startup Factory Hub platform: AI tools, business intelligence engine, 200+ open-source technologies and cloud credits.',
    detail: ['AI toolset & credits', 'Business intelligence engine', '200+ open-source repos'],
    glow: 'hsl(52 95% 55% / 0.5)',
  },

];

/* ── Benefit tile: tools-tab style bento card with AR overlays ── */
function BenefitTile({ benefit }: { benefit: (typeof WHY_JOIN)[number] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      style={{ ['--tile-glow' as never]: benefit.glow }}
      className={`group relative tech-card border-0 rounded-2xl p-5 overflow-hidden text-left transition-all duration-300
        hover:-translate-y-1 hover:shadow-[0_18px_50px_-12px_var(--tile-glow)]
        ${expanded ? 'sm:col-span-2 min-h-[260px]' : 'min-h-[212px]'}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
        style={{ background: `radial-gradient(circle, ${benefit.glow} 0%, transparent 70%)` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] transition-opacity group-hover:opacity-[0.13]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* AR corner brackets */}
      <span aria-hidden className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l border-t border-primary/40 transition-all duration-300 group-hover:h-6 group-hover:w-6" />
      <span aria-hidden className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r border-t border-primary/40 transition-all duration-300 group-hover:h-6 group-hover:w-6" />
      <span aria-hidden className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b border-l border-primary/40 transition-all duration-300 group-hover:h-6 group-hover:w-6" />
      <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b border-r border-primary/40 transition-all duration-300 group-hover:h-6 group-hover:w-6" />
      {/* AR scan sweep on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[mvp-scan_2.4s_linear_infinite]"
      />

      <div className="relative flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-primary/30 bg-primary/[0.06] font-mono text-[11px] font-bold tracking-[0.12em] text-primary backdrop-blur-sm">
            {benefit.code}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-xl border border-primary/20"
              style={{ animation: 'mvp-float 6s ease-in-out infinite' }}
            />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            {benefit.id}
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-tight tracking-tight sm:text-lg">{benefit.title}</h3>
          <p className={`mt-1.5 text-xs leading-relaxed text-muted-foreground ${expanded ? '' : 'line-clamp-3'}`}>
            {benefit.desc}
          </p>

          {expanded && (
            <ul className="mt-3 space-y-1.5">
              {benefit.detail.map((d) => (
                <li key={d} className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  {d}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary/40 transition-colors group-hover:text-primary/70">
            {expanded ? '— Collapse' : '+ Expand'}
          </p>
        </div>
      </div>
    </button>
  );
}


/* ── AR holographic scene: rotating wireframe orbit + floating data nodes ── */
function ARHologram() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '160 84% 39%';
    const col = (a: number) => `hsla(${primary} / ${a})`;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const points: { lat: number; lon: number }[] = [];
    for (let i = 0; i < 260; i++) {
      const y = 1 - (i / 259) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = i * 2.399963;
      points.push({ lat: Math.asin(y), lon: theta % (Math.PI * 2) });
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.34;
      t += 0.0038;

      // wireframe meridians
      ctx.lineWidth = dpr;
      for (let m = 0; m < 14; m++) {
        const phase = (m / 14) * Math.PI * 2 + t;
        ctx.beginPath();
        for (let s = 0; s <= 60; s++) {
          const a = (s / 60) * Math.PI - Math.PI / 2;
          const x3 = Math.cos(a) * Math.sin(phase);
          const z3 = Math.cos(a) * Math.cos(phase);
          const y3 = Math.sin(a);
          const scale = 1 / (2.4 - z3);
          const px = cx + x3 * R * scale * 2.4;
          const py = cy + y3 * R * scale * 2.4;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = col(0.10 + 0.10 * Math.abs(Math.cos(phase)));
        ctx.stroke();
      }

      // latitude rings
      for (let l = 1; l < 7; l++) {
        const lat = -Math.PI / 2 + (l / 7) * Math.PI;
        ctx.beginPath();
        for (let s = 0; s <= 72; s++) {
          const lon = (s / 72) * Math.PI * 2 + t;
          const x3 = Math.cos(lat) * Math.sin(lon);
          const z3 = Math.cos(lat) * Math.cos(lon);
          const y3 = Math.sin(lat);
          const scale = 1 / (2.4 - z3);
          const px = cx + x3 * R * scale * 2.4;
          const py = cy + y3 * R * scale * 2.4;
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = col(0.10);
        ctx.stroke();
      }

      // data nodes
      points.forEach((p, i) => {
        const lon = p.lon + t * 1.6;
        const x3 = Math.cos(p.lat) * Math.sin(lon);
        const z3 = Math.cos(p.lat) * Math.cos(lon);
        const y3 = Math.sin(p.lat);
        if (z3 < -0.15) return;
        const scale = 1 / (2.4 - z3);
        const px = cx + x3 * R * scale * 2.4;
        const py = cy + y3 * R * scale * 2.4;
        const pulse = 0.5 + 0.5 * Math.sin(t * 6 + i);
        ctx.beginPath();
        ctx.arc(px, py, (0.9 + pulse * 1.1) * dpr, 0, Math.PI * 2);
        ctx.fillStyle = col(0.25 + z3 * 0.55);
        ctx.fill();
      });

      // orbit ellipse
      ctx.beginPath();
      for (let s = 0; s <= 120; s++) {
        const a = (s / 120) * Math.PI * 2;
        const px = cx + Math.cos(a) * R * 1.55;
        const py = cy + Math.sin(a) * R * 0.42;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = col(0.28);
      ctx.lineWidth = dpr;
      ctx.stroke();

      // orbiting satellite
      const oa = t * 3.2;
      const sx = cx + Math.cos(oa) * R * 1.55;
      const sy = cy + Math.sin(oa) * R * 0.42;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.2 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = col(1);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full aspect-square max-w-[520px] mx-auto">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* AR reticle corners */}
      <div className="pointer-events-none absolute inset-6">
        {['top-0 left-0 border-l-2 border-t-2', 'top-0 right-0 border-r-2 border-t-2', 'bottom-0 left-0 border-l-2 border-b-2', 'bottom-0 right-0 border-r-2 border-b-2'].map((c) => (
          <div key={c} className={`absolute h-8 w-8 border-primary/60 ${c}`} />
        ))}
      </div>
      {/* floating AR labels */}
      <div className="pointer-events-none absolute left-0 top-[18%] animate-fade-in">
        <div className="rounded-lg border border-primary/30 bg-background/60 px-3 py-1.5 backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Build Cycle</p>
          <p className="font-mono text-xs text-foreground">04 WEEKS</p>
        </div>
      </div>
      <div className="pointer-events-none absolute right-0 top-[42%] animate-fade-in">
        <div className="rounded-lg border border-primary/30 bg-background/60 px-3 py-1.5 backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Signal</p>
          <p className="font-mono text-xs text-foreground">LIVE / STABLE</p>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-[14%] left-[10%] animate-fade-in">
        <div className="rounded-lg border border-primary/30 bg-background/60 px-3 py-1.5 backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Node</p>
          <p className="font-mono text-xs text-foreground">MVP.FACTORY</p>
        </div>
      </div>
    </div>
  );
}

function Ticker({ items }: { items: string[] }) {
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-border/50 bg-background/40 py-3">
      <div className="flex w-max animate-[mvp-marquee_38s_linear_infinite] gap-10">
        {loop.map((s, i) => (
          <span key={i} className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            {s}
            <span className="ml-10 text-primary">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MVPProgram() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProgramProfile | null>(null);
  const [cohorts, setCohorts] = useState<OpenCohort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: profileData }, { data: cohortsData }] = await Promise.all([
        supabase
          .from('accelerator_profiles')
          .select('organization_name,description,website,external_link,program_duration,equity_percentage,funding_offered,is_accepting_applications,logo_url,location,total_cohorts,total_startups_supported')
          .eq('id', SFH_ACCELERATOR_ID)
          .single(),
        supabase
          .from('accelerator_cohorts')
          .select('id,name,description,start_date,end_date,application_deadline,max_startups,current_startups,funding_per_startup,equity_percentage,focus_industries,enrollment_fee,status')
          .eq('accelerator_id', SFH_ACCELERATOR_ID)
          .in('status', ['upcoming', 'applications_open'])
          .order('start_date', { ascending: true }),
      ]);
      if (profileData) setProfile(profileData as ProgramProfile);
      if (cohortsData) setCohorts(cohortsData as OpenCohort[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'applications_open') return 'bg-primary/15 text-primary border-primary/40';
    return 'bg-muted text-muted-foreground border-border';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const programName = profile?.organization_name || 'Startup Factory Hub MVP Accelerator';

  const hud = [
    profile?.program_duration ? { k: 'Duration', v: profile.program_duration } : null,
    profile?.funding_offered ? { k: 'Capital', v: `$${profile.funding_offered.toLocaleString()}` } : null,
    profile?.equity_percentage ? { k: 'Equity', v: `${profile.equity_percentage}%` } : null,
    profile?.location ? { k: 'Base', v: profile.location } : null,
    profile?.total_startups_supported ? { k: 'Startups', v: `${profile.total_startups_supported}` } : null,
    profile?.total_cohorts ? { k: 'Batches', v: `${profile.total_cohorts}` } : null,
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <div
      className="min-h-screen text-foreground"
      style={{
        // Palette synced with the /marketing MVP announcement banner
        ['--mvp-teal' as string]: '#14b8a6',
        ['--mvp-cyan' as string]: '#22d3ee',
        ['--mvp-indigo' as string]: '#818cf8',
        background: 'linear-gradient(160deg,#050b16 0%,#04101f 45%,#050914 100%)',
      }}
    >
      <style>{`
        @keyframes mvp-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes mvp-scan { 0% { transform: translateY(-10%); opacity: 0; } 40% { opacity: .8; } 100% { transform: translateY(1100%); opacity: 0; } }
        @keyframes mvp-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes mvp-trace { 0% { stroke-dashoffset: 400; } 100% { stroke-dashoffset: 0; } }
        @keyframes mvp-node { 0%,100% { opacity:.25; transform: scale(.85);} 50% { opacity:1; transform: scale(1.15);} }
      `}</style>

      {/* ── Hero · synced with marketing banner ── */}
      <section className="relative overflow-hidden border-b border-white/10">
        {/* banner background plate */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${mvpBg})` }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(0,8,20,0.97) 0%, rgba(0,10,25,0.92) 45%, rgba(0,10,25,0.72) 70%, rgba(0,5,15,0.5) 100%)',
          }}
        />
        {/* tech grid + intersection dots */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(20,184,166,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.07) 1px, transparent 1px), radial-gradient(rgba(20,184,166,0.28) 1.4px, transparent 1.5px)',
            backgroundSize: '50px 50px, 50px 50px, 50px 50px',
          }}
        />
        {/* circuit traces */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1200 630" aria-hidden>
          {[
            'M0,180 L440,620', 'M60,0 L560,500', 'M660,0 L1200,540', 'M456,630 L1200,126', 'M0,346 L360,0',
          ].map((d, i) => (
            <path
              key={d}
              d={d}
              stroke="rgba(34,211,238,0.18)"
              strokeWidth="1.2"
              fill="none"
              strokeDasharray="6 14"
              style={{ animation: `mvp-trace ${14 + i * 3}s linear infinite` }}
            />
          ))}
          {[[245,165],[460,390],[130,420],[880,180],[1040,470]].map(([cx, cy], i) => (
            <circle key={`${cx}`} cx={cx} cy={cy} r="4" fill={i % 2 ? '#22d3ee' : '#14b8a6'}
              style={{ animation: `mvp-node ${3 + i * 0.6}s ease-in-out infinite` }} />
          ))}
        </svg>
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,#14b8a6,#22d3ee,#818cf8)' }} />
        <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle,rgba(20,184,166,0.28),transparent 70%)' }} />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle,rgba(129,140,248,0.25),transparent 70%)' }} />

        {/* corner brackets */}
        <span aria-hidden className="pointer-events-none absolute left-5 top-5 h-8 w-8 border-l-2 border-t-2" style={{ borderColor: 'rgba(20,184,166,0.6)' }} />
        <span aria-hidden className="pointer-events-none absolute right-5 top-5 h-8 w-8 border-r-2 border-t-2" style={{ borderColor: 'rgba(20,184,166,0.6)' }} />
        <span aria-hidden className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 border-b-2 border-l-2" style={{ borderColor: 'rgba(20,184,166,0.6)' }} />
        <span aria-hidden className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 border-b-2 border-r-2" style={{ borderColor: 'rgba(20,184,166,0.6)' }} />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 pl-8 sm:pl-12 lg:grid-cols-2 lg:py-28">
          {/* vertical accent rail with glowing nodes */}
          <span aria-hidden className="pointer-events-none absolute bottom-14 left-2 top-14 w-[3px] rounded-full sm:left-4" style={{ background: 'linear-gradient(180deg,#14b8a6,rgba(20,184,166,0.15))' }} />
          {[12, 34, 58, 80].map((t, i) => (
            <span
              key={t}
              aria-hidden
              className="pointer-events-none absolute left-2 h-2.5 w-2.5 -translate-x-[4px] rounded-full sm:left-4"
              style={{ top: `${t}%`, background: '#14b8a6', boxShadow: '0 0 18px 6px rgba(20,184,166,0.45)', animation: `mvp-node ${3 + i * 0.5}s ease-in-out infinite` }}
            />
          ))}

          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center rounded-full px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: '#14b8a6',
                  border: '1px solid rgba(20,184,166,0.5)',
                  background: 'linear-gradient(90deg, rgba(20,184,166,0.25), rgba(20,184,166,0.05))',
                }}
              >
                Startup Factory Hub&nbsp; | &nbsp;{profile?.program_duration || '4-Week Program'}
              </span>
              {profile?.is_accepting_applications && (
                <span className="relative inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
                  style={{ borderColor: 'rgba(34,211,238,0.45)', color: '#22d3ee', background: 'rgba(34,211,238,0.08)' }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: '#22d3ee' }} />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: '#22d3ee' }} />
                  </span>
                  Applications Open
                </span>
              )}
            </div>

            <div className="mb-8 flex items-center gap-5">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full p-2 sm:h-36 sm:w-36"
                style={{ border: '2px solid rgba(20,184,166,0.7)', background: 'rgba(5,15,25,0.5)' }}>
                <img src={sfhLogo} alt="Startup Factory Hub logo" className="h-full w-full rounded-full object-contain" />
                <span aria-hidden className="pointer-events-none absolute -inset-6 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.4), transparent 70%)' }} />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
                startupfactoryhub.com
              </span>
            </div>

            <h1 className="font-black uppercase leading-[0.92] tracking-tight">
              <span className="block text-2xl font-light tracking-[0.06em] text-white/85 sm:text-4xl">Launch your startup</span>
              <span
                className="block text-[4.5rem] leading-[0.85] sm:text-[7rem]"
                style={{
                  backgroundImage: 'linear-gradient(90deg,#14b8a6 0%,#22d3ee 45%,#818cf8 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  filter: 'drop-shadow(0 0 28px rgba(20,184,166,0.55))',
                }}
              >
                MVP
              </span>
              <span className="block text-2xl font-light tracking-[0.06em] text-white/85 sm:text-4xl">Software startup</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: 'rgba(20,184,166,0.9)' }}>
              Functionally complete MVP software — built, validated and launched in {profile?.program_duration || '4 weeks'}.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
              {profile?.description ||
                'An intensive build sprint that converts a raw idea into a market-ready product — capital, engineering, mentorship and a global distribution mesh, deployed around your team.'}
            </p>

            <div className="mt-6 h-px w-full max-w-md" style={{ background: 'linear-gradient(90deg, rgba(20,184,166,0.8), rgba(20,184,166,0.25), transparent)' }} />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/auth?mode=signup')}
                className="group relative overflow-hidden rounded-full px-9 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white transition-transform duration-300 hover:scale-[1.03]"
                style={{
                  background: 'linear-gradient(90deg,#0d9488,#14b8a6,#0d9488)',
                  border: '1.5px solid rgba(34,211,238,0.55)',
                  boxShadow: '0 0 45px -8px rgba(20,184,166,0.75)',
                }}
              >
                <span className="relative z-10">Apply now →</span>
                <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
              <button
                onClick={() => (profile?.website ? window.open(profile.website!, '_blank') : navigate('/auth'))}
                className="rounded-full px-9 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white transition-transform duration-300 hover:scale-[1.03]"
                style={{
                  background: 'linear-gradient(90deg,#4f46e5,#818cf8,#4f46e5)',
                  border: '1.5px solid rgba(167,139,250,0.7)',
                  boxShadow: '0 0 45px -10px rgba(129,140,248,0.7)',
                }}
              >
                {profile?.program_duration || '4-Week Program'}
              </button>
            </div>

            {hud.length > 0 && (
              <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl sm:grid-cols-3"
                style={{ background: 'rgba(20,184,166,0.18)', border: '1px solid rgba(20,184,166,0.25)' }}>
                {hud.map(({ k, v }) => (
                  <div key={k} className="px-4 py-4 backdrop-blur-sm" style={{ background: 'rgba(4,14,26,0.85)' }}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: 'rgba(34,211,238,0.75)' }}>{k}</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-white">{v}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative" style={{ animation: 'mvp-float 8s ease-in-out infinite' }}>
            <ARHologram />
          </div>
        </div>
      </section>


      <Ticker
        items={[
          'Product Engineering',
          'Seed Capital',
          'Investor Mesh',
          'AI Tooling',
          'Go To Market',
          'Global Offices',
          'Business Intelligence',
        ]}
      />

      {/* ── Why Join the Program ── */}
      <section className="relative overflow-hidden border-y border-border/50">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-primary/40 animate-[mvp-scan_9s_linear_infinite]" />

        <div className="relative mx-auto max-w-6xl px-4 py-20 lg:py-28">
          <div className="mb-14 max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary">Advantages</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              Why join the program
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              A structured acceleration experience designed to take a startup from idea to
              investable MVP in a single, high-intensity batch.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_JOIN.map((b) => (
              <BenefitTile key={b.id} benefit={b} />
            ))}
          </div>

        </div>
      </section>


      {/* ── Open Batches ── */}
      {cohorts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="mb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary">Intake</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Open Batches</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {cohorts.map((cohort) => (
              <Card key={cohort.id} className="tech-card relative overflow-hidden border-0">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="flex h-full flex-col gap-5 p-7">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight">{cohort.name}</h3>
                      {cohort.description && (
                        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{cohort.description}</p>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(cohort.status)} shrink-0 font-mono text-[10px] uppercase tracking-[0.16em]`}>
                      {cohort.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border/50 bg-border/40">
                    {[
                      cohort.start_date ? { k: 'Starts', v: format(new Date(cohort.start_date), 'MMM d, yyyy') } : null,
                      cohort.application_deadline ? { k: 'Deadline', v: format(new Date(cohort.application_deadline), 'MMM d') } : null,
                      cohort.funding_per_startup ? { k: 'Per Startup', v: `$${(cohort.funding_per_startup / 1000).toFixed(0)}K` } : null,
                      { k: 'Spots Left', v: `${cohort.max_startups - cohort.current_startups}` },
                      cohort.enrollment_fee && cohort.enrollment_fee > 0
                        ? { k: 'Fee', v: `$${(cohort.enrollment_fee / 100).toLocaleString()}` }
                        : null,
                      cohort.equity_percentage ? { k: 'Equity', v: `${cohort.equity_percentage}%` } : null,
                    ]
                      .filter(Boolean)
                      .map((d) => {
                        const item = d as { k: string; v: string };
                        return (
                          <div key={item.k} className="bg-background/60 px-4 py-3">
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{item.k}</p>
                            <p className="mt-0.5 font-mono text-sm font-semibold">{item.v}</p>
                          </div>
                        );
                      })}
                  </div>

                  {cohort.focus_industries && cohort.focus_industries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {cohort.focus_industries.map((ind) => (
                        <Badge key={ind} variant="outline" className="font-mono text-[10px] uppercase tracking-[0.14em]">
                          {ind}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex gap-2 border-t border-border/50 pt-5">
                    <Button className="flex-1" onClick={() => navigate('/auth?mode=signup')}>
                      Apply via Account
                    </Button>
                    <Button variant="outline" onClick={() => window.open(`/cohorts/${cohort.id}/apply`, '_blank')}>
                      Direct
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Final CTA · Launch Console ── */}
      <section className="relative overflow-hidden border-t border-border/50">
        <style>{`
          @keyframes mvp-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes mvp-orbit-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
          @keyframes mvp-sweep { 0% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
          @keyframes mvp-flicker { 0%,100% { opacity: .35; } 50% { opacity: 1; } }
          @keyframes mvp-rise { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: .9; } 100% { transform: translateY(-260px); opacity: 0; } }
        `}</style>

        {/* horizon grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 55%, black, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 55%, black, transparent 80%)',
          }}
        />

        {/* orbital rings */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2">
          <div className="absolute inset-0 rounded-full border border-primary/15" style={{ animation: 'mvp-orbit 48s linear infinite' }}>
            <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_18px_4px_hsl(var(--primary)/0.6)]" />
          </div>
          <div className="absolute inset-16 rounded-full border border-primary/10" style={{ animation: 'mvp-orbit-rev 34s linear infinite' }}>
            <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/80 shadow-[0_0_14px_3px_hsl(var(--primary)/0.5)]" />
          </div>
          <div className="absolute inset-36 rounded-full border border-dashed border-primary/10" style={{ animation: 'mvp-orbit 70s linear infinite' }} />
        </div>

        {/* rising particles */}
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute bottom-0 h-1 w-1 rounded-full bg-primary/70"
              style={{
                left: `${(i * 7.3 + 4) % 98}%`,
                animation: `mvp-rise ${7 + (i % 5) * 1.7}s linear ${i * 0.8}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-24 lg:py-32">
          {/* status rail */}
          <div className="mx-auto mb-10 flex w-full max-w-md items-center gap-3 rounded-full border border-primary/25 bg-background/60 px-4 py-2 backdrop-blur-xl">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-primary">Launch sequence · armed</span>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground" style={{ animation: 'mvp-flicker 2.6s ease-in-out infinite' }}>
              intake open
            </span>
          </div>

          {/* kinetic headline */}
          <div className="relative text-center">
            <h2 className="text-[13vw] font-black uppercase leading-[0.82] tracking-tighter sm:text-[8.5rem]">
              <span className="block bg-gradient-to-b from-foreground via-foreground to-foreground/25 bg-clip-text text-transparent">
                Ready to
              </span>
              <span className="relative block">
                <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
                  build
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                  <span
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/25 to-transparent"
                    style={{ animation: 'mvp-sweep 4.5s ease-in-out infinite' }}
                  />
                </span>
              </span>
            </h2>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.55em] text-primary sm:text-sm">
              your&nbsp;&nbsp;m&nbsp;v&nbsp;p
            </p>
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
            Create your free Startup Factory Hub account and submit your application through the platform.
            Applications are reviewed on a rolling basis.
          </p>

          {/* actions */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="group relative overflow-hidden rounded-xl border border-primary/60 bg-primary px-10 py-4 font-mono text-xs uppercase tracking-[0.28em] text-primary-foreground shadow-[0_0_40px_-8px_hsl(var(--primary))] transition-all duration-300 hover:shadow-[0_0_60px_-4px_hsl(var(--primary))]"
            >
              <span className="relative z-10">Initiate · Create account</span>
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="group relative overflow-hidden rounded-xl border border-primary/30 bg-background/50 px-10 py-4 font-mono text-xs uppercase tracking-[0.28em] text-foreground backdrop-blur-xl transition-colors duration-300 hover:border-primary/70 hover:text-primary"
            >
              Sign in
            </button>
          </div>

          {/* telemetry strip */}
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 lg:grid-cols-4">
            {[
              { k: '01', v: 'Create account' },
              { k: '02', v: 'Submit application' },
              { k: '03', v: 'Selection review' },
              { k: '04', v: 'Batch onboarding' },
            ].map((s, i) => (
              <div key={s.k} className="group relative bg-background/70 px-5 py-6 backdrop-blur-sm">
                <span aria-hidden className="absolute left-3 top-3 h-3 w-3 border-l border-t border-primary/40" />
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/70">Step {s.k}</p>
                <p className="mt-2 text-sm font-semibold">{s.v}</p>
                <span
                  aria-hidden
                  className="mt-4 block h-px w-full origin-left bg-gradient-to-r from-primary/70 to-transparent"
                  style={{ animation: `mvp-flicker ${3 + i * 0.4}s ease-in-out infinite` }}
                />
              </div>
            ))}
          </div>

          {profile?.website && (
            <p className="mt-10 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            </p>
          )}
        </div>
      </section>


    </div>
  );
}
