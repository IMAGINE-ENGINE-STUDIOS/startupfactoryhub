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
    <div className="min-h-screen bg-background text-foreground">
      <style>{`
        @keyframes mvp-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes mvp-scan { 0% { transform: translateY(-10%); opacity: 0; } 40% { opacity: .8; } 100% { transform: translateY(1100%); opacity: 0; } }
        @keyframes mvp-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 50% 30%, black, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black, transparent 75%)',
          }}
        />
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-primary/50 animate-[mvp-scan_7s_linear_infinite]" />
        <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                SFH / Program 001
              </span>
              {profile?.is_accepting_applications && (
                <span className="relative inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  Applications Open
                </span>
              )}
            </div>

            <div className="mb-6 flex items-center gap-5">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-primary/30 bg-primary/[0.05] p-3 backdrop-blur-sm sm:h-36 sm:w-36">
                <img src={sfhLogo} alt="Startup Factory Hub logo" className="h-full w-full object-contain" />
                <span aria-hidden className="pointer-events-none absolute -inset-1.5 rounded-3xl border border-primary/20 animate-pulse" />
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-6 rounded-full opacity-50 blur-2xl"
                  style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.35) 0%, transparent 70%)' }}
                />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                Startup Factory Hub
              </span>
            </div>


            <h1 className="text-[2.6rem] font-black leading-[0.95] tracking-tight sm:text-6xl">

              MVP
              <span className="block bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
                Development
              </span>
              <span className="block text-muted-foreground/70">Program</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {profile?.description ||
                'An intensive build sprint that converts a raw idea into a market-ready product — capital, engineering, mentorship and a global distribution mesh, deployed around your team.'}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="px-8 text-base" onClick={() => navigate('/auth?mode=signup')}>
                Start Application
              </Button>
              {profile?.website && (
                <Button size="lg" variant="outline" className="text-base" onClick={() => window.open(profile.website!, '_blank')}>
                  Program Overview
                </Button>
              )}
            </div>

            {hud.length > 0 && (
              <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40 sm:grid-cols-3">
                {hud.map(({ k, v }) => (
                  <div key={k} className="bg-background/70 px-4 py-4 backdrop-blur-sm">
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{k}</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-foreground">{v}</p>
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

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden border-t border-border/50">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(ellipse at 50% 50%, black, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black, transparent 78%)',
          }}
        />
        <div className="pointer-events-none absolute -left-28 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 bottom-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-20 lg:py-28">
          <div className="group relative overflow-hidden rounded-3xl border border-border/60 bg-background/50 backdrop-blur-xl">
            {/* AR frame */}
            <span aria-hidden className="pointer-events-none absolute left-4 top-4 h-6 w-6 border-l border-t border-primary/50" />
            <span aria-hidden className="pointer-events-none absolute right-4 top-4 h-6 w-6 border-r border-t border-primary/50" />
            <span aria-hidden className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 border-b border-l border-primary/50" />
            <span aria-hidden className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 border-b border-r border-primary/50" />
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-[mvp-scan_6s_linear_infinite]" />
            <span
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
              style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.5) 0%, transparent 70%)' }}
            />

            <div className="relative grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-[1.15fr_0.85fr] lg:p-14">
              <div>
                <div className="flex items-center gap-3">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary">Launch Sequence</p>
                </div>

                <h2 className="mt-5 text-[2.1rem] font-black leading-[0.98] tracking-tight sm:text-5xl">
                  Ready to build
                  <span className="block bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
                    your MVP?
                  </span>
                </h2>

                <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Create your free Startup Factory Hub account and submit your application through the
                  platform. Applications are reviewed on a rolling basis.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="px-8 text-base" onClick={() => navigate('/auth?mode=signup')}>
                    Create Free Account
                  </Button>
                  <Button size="lg" variant="outline" className="text-base" onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                </div>

                {profile?.website && (
                  <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </p>
                )}
              </div>

              {/* Console readout */}
              <div className="relative grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40">
                {[
                  { k: 'Step 01', v: 'Create account' },
                  { k: 'Step 02', v: 'Submit application' },
                  { k: 'Step 03', v: 'Selection review' },
                  { k: 'Step 04', v: 'Batch onboarding' },
                ].map((s, i) => (
                  <div key={s.k} className="relative flex items-center gap-4 bg-background/70 px-5 py-4 backdrop-blur-sm">
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/70">{s.k}</span>
                    <span className="h-px flex-1 bg-border/60" />
                    <span className="text-sm font-medium">{s.v}</span>
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full bg-primary"
                      style={{ animation: `mvp-float 3s ease-in-out ${i * 0.35}s infinite` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
