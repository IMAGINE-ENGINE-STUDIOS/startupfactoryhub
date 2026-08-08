import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Rocket, Users, CalendarClock } from 'lucide-react';
import lvlupLogo from '@/assets/lvlup-logo.jpg.asset.json';
import nvidiaLogo from '@/assets/nvidia-logo.webp.asset.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';


interface InvestorFirm {
  id: string;
  name: string;
  description: string;
  logo: string;
  url: string;
  focus: string;
  accent: string;
  cta: string;
}

const FIRMS: InvestorFirm[] = [
  {
    id: 'advantary',
    name: 'Advantary Capital Partners',
    description:
      'Investment partner of Startup Factory Hub. Growth and venture capital for founders scaling beyond the MVP stage.',
    logo: '/partners/advantary-logo.jpg',
    url: 'https://share.hsforms.com/1OFBERDqqS6SpeTBrtJW3pg2bo06?utm_source=chatgpt.com',
    focus: 'Venture & Growth',
    accent: 'from-indigo-500 via-violet-500 to-fuchsia-500',
    cta: 'Apply for funding',
  },
  {
    id: 'lvlup',
    name: 'LvlUp Ventures',
    description:
      'Early-stage venture firm backing bold founders with capital, network access and go-to-market firepower.',
    logo: lvlupLogo.url,
    url: 'https://www.lvlup.vc',
    focus: 'Pre-Seed & Seed',
    accent: 'from-emerald-500 via-teal-500 to-cyan-500',
    cta: 'Visit firm',
  },
  {
    id: 'nvidia-inception',
    name: 'NVIDIA Inception',
    description:
      'Global program for AI and data science startups: GPU credits, technical training, go-to-market support and investor introductions.',
    logo: nvidiaLogo.url,
    url: 'https://www.nvidia.com/en-us/startups/',
    focus: 'AI & Deep Tech',
    accent: 'from-lime-500 via-green-500 to-emerald-500',
    cta: 'Join Inception',
  },
];

function FirmLogo({ firm }: { firm: InvestorFirm }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="text-sm font-bold text-foreground">
        {firm.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
      </span>
    );
  }
  return (
    <img
      src={firm.logo}
      alt={`${firm.name} logo`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full rounded-[10px] object-contain bg-background p-1"
    />
  );
}

interface ActiveCohort {
  id: string;
  name: string;
  description: string | null;
  status: string;
  application_deadline: string | null;
  funding_per_startup: number | null;
  equity_percentage: number | null;
  max_startups: number | null;
  current_startups: number | null;
  org_name: string;
  logo_url: string | null;
}

function ActiveCohorts() {
  const [cohorts, setCohorts] = useState<ActiveCohort[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('accelerator_cohorts')
        .select('id,name,description,status,application_deadline,funding_per_startup,equity_percentage,max_startups,current_startups,accelerator_id')
        .in('status', ['applications_open', 'active', 'upcoming'])
        .order('application_deadline', { ascending: true })
        .limit(12);
      if (!data || cancelled) return;

      const ids = Array.from(new Set(data.map((c: any) => c.accelerator_id).filter(Boolean)));
      let profiles: any[] = [];
      if (ids.length) {
        const [byId, byUser] = await Promise.all([
          supabase.from('accelerator_profiles').select('id,user_id,organization_name,logo_url').in('id', ids),
          supabase.from('accelerator_profiles').select('id,user_id,organization_name,logo_url').in('user_id', ids),
        ]);
        profiles = [...(byId.data || []), ...(byUser.data || [])];
      }
      const lookup = new Map<string, any>();
      profiles.forEach(p => {
        lookup.set(p.id, p);
        if (p.user_id) lookup.set(p.user_id, p);
      });

      if (cancelled) return;
      setCohorts(
        data.map((c: any) => ({
          ...c,
          org_name: lookup.get(c.accelerator_id)?.organization_name || 'Startup Factory Hub',
          logo_url: lookup.get(c.accelerator_id)?.logo_url || null,
        }))
      );
    })();
    return () => { cancelled = true; };
  }, []);

  if (!cohorts.length) return null;

  const statusLabel = (s: string) =>
    s === 'applications_open' ? 'Applications Open' : s === 'active' ? 'In Progress' : 'Upcoming';

  return (
    <>

        {cohorts.map(c => {
          const spots = (c.max_startups || 0) - (c.current_startups || 0);
          return (
            <Card
              key={c.id}
              className="group tech-card border-0 relative overflow-hidden transition-all duration-500 hover:-translate-y-1 min-w-[300px] max-w-[340px] flex-shrink-0 snap-start"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <CardHeader className="pb-2 pt-4 px-4 relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-[1.5px] shrink-0">
                        <div className="h-full w-full rounded-[10px] bg-background flex items-center justify-center overflow-hidden">
                          {c.logo_url ? (
                            <img src={c.logo_url} alt={`${c.org_name} logo`} loading="lazy" className="h-full w-full rounded-[10px] object-contain bg-background p-1" />
                          ) : (
                            <Rocket className="h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-bold truncate tracking-tight">{c.name}</CardTitle>
                        <p className="text-[11px] text-muted-foreground truncate">{c.org_name}</p>
                      </div>
                    </div>
                    {c.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.description}</p>
                    )}
                  </div>
                  <Badge className="text-[10px] px-1.5 py-0 h-5 bg-emerald-500/10 text-emerald-600 border-0 shrink-0">
                    {statusLabel(c.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-4 pt-1 relative space-y-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  {c.funding_per_startup ? (
                    <span className="text-foreground font-semibold">
                      ${c.funding_per_startup.toLocaleString()}
                      {c.equity_percentage ? ` for ${c.equity_percentage}%` : ''}
                    </span>
                  ) : null}
                  {c.max_startups ? (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {spots > 0 ? `${spots} spots left` : 'Full'}
                    </span>
                  ) : null}
                  {c.application_deadline ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" />
                      {new Date(c.application_deadline).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 border-0 text-white hover:opacity-90"
                  onClick={() => { window.location.href = '/dashboard?tab=accelerators'; }}
                >
                  <Rocket className="h-3 w-3" />
                  View program
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


export default function InvestorCommunity() {
  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Community Investors</h2>
          <p className="text-xs text-muted-foreground">Firms under contract with Startup Factory Hub</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 pt-1 snap-x snap-mandatory -mx-1 px-1">
        {FIRMS.map(firm => (
          <Card
            key={firm.id}
            className="group tech-card border-0 relative overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.5)] min-w-[300px] max-w-[340px] flex-shrink-0 snap-start"
            onClick={() => window.open(firm.url, '_blank', 'noopener,noreferrer')}
          >
            <div
              className={`pointer-events-none absolute -inset-px rounded-[inherit] bg-gradient-to-br ${firm.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 [mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] [mask-composite:exclude] p-px`}
            />
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
              <div
                className={`absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br ${firm.accent} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-700`}
              />
            </div>
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${firm.accent}`} />

            <CardHeader className="pb-2 pt-4 px-4 relative">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`relative h-9 w-9 rounded-xl bg-gradient-to-br ${firm.accent} p-[1.5px] shrink-0`}>
                      <div className="h-full w-full rounded-[10px] bg-background flex items-center justify-center overflow-hidden">
                        <FirmLogo firm={firm} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-bold truncate tracking-tight">{firm.name}</CardTitle>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{firm.description}</p>
                </div>
                <Badge className="text-[10px] px-1.5 py-0 h-5 bg-indigo-500/10 text-indigo-600 border-0 flex items-center gap-0.5 shrink-0">
                  {firm.focus}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-1 relative">
              <Button
                size="sm"
                className={`w-full h-8 text-xs gap-1.5 bg-gradient-to-r ${firm.accent} border-0 text-white hover:opacity-90`}
                onClick={e => {
                  e.stopPropagation();
                  window.open(firm.url, '_blank', 'noopener,noreferrer');
                }}
              >
                {firm.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <ActiveCohorts />
    </>

  );
}
