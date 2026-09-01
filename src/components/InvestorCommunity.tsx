import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Rocket, Users, CalendarClock, DollarSign, Zap, TrendingUp, ArrowUpRight, Building2 } from 'lucide-react';

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
  enrollment_fee: number | null;
  funding_per_startup: number | null;
  equity_percentage: number | null;
  max_startups: number | null;
  current_startups: number | null;
  org_name: string;
  logo_url: string | null;
}

function ActiveCohorts() {
  const navigate = useNavigate();
  const [cohorts, setCohorts] = useState<ActiveCohort[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('accelerator_cohorts')
        .select('id,name,description,status,application_deadline,enrollment_fee,funding_per_startup,equity_percentage,max_startups,current_startups,accelerator_id')
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
      const mapped = data.map((c: any) => ({
        ...c,
        org_name: lookup.get(c.accelerator_id)?.organization_name || 'Startup Factory Hub',
        logo_url: lookup.get(c.accelerator_id)?.logo_url || null,
      }));
      // Feature the MVP Development program first
      const isMvp = (n: string) => /mvp/i.test(n || '');
      mapped.sort((a: any, b: any) => Number(isMvp(b.name)) - Number(isMvp(a.name)));
      setCohorts(mapped);
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
          const isMvp = /mvp/i.test(c.name || '');
          return (
            <div
              key={c.id}
              className={isMvp
                ? 'relative min-w-[320px] md:min-w-[720px] lg:min-w-[920px] max-w-[95vw] flex-shrink-0 snap-center group'
                : 'relative min-w-[300px] max-w-[340px] flex-shrink-0 snap-start group'
              }
            >
              {isMvp && (
                <>
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 opacity-75 blur animate-pulse pointer-events-none" />
                  <div className="absolute -inset-1 rounded-[20px] bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 blur-lg pointer-events-none" />
                </>
              )}
              <Card
                className={isMvp
                  ? 'relative overflow-hidden tech-card border-2 border-fuchsia-400/80 transition-all duration-500 hover:-translate-y-1 h-full md:grid md:grid-cols-2'
                  : 'group relative overflow-hidden tech-card border-0 rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.5)] h-full flex flex-col'
                }
              >
                <div className={isMvp
                  ? 'absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500'
                  : 'absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-accent to-primary opacity-70'
                } />

                {isMvp && (
                  <div className="absolute top-3 -right-12 rotate-45 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] font-bold uppercase tracking-wider px-12 py-1 shadow-lg z-20">
                    MVP Batch
                  </div>
                )}

                {isMvp ? (
                  <>
                    <CardHeader className="pb-2 pt-5 px-5 relative flex flex-col justify-center">
                      <div className="flex items-start gap-3">
                        <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 p-[2px] shrink-0">
                          <div className="h-full w-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden">
                            {c.logo_url ? (
                              <img src={c.logo_url} alt={`${c.org_name} logo`} loading="lazy" className="h-full w-full rounded-[14px] object-contain bg-background p-1" />
                            ) : (
                              <Rocket className="h-6 w-6 text-fuchsia-500" />
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 pr-6">
                          <CardTitle className="text-base md:text-lg font-bold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300">
                            {c.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">{c.org_name}</p>
                        </div>
                      </div>
                      {c.description && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{c.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge className="text-[10px] px-2 py-0 h-5 bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 shrink-0">
                          {statusLabel(c.status)}
                        </Badge>
                        <Badge className="text-[10px] px-2 py-0 h-5 bg-violet-500/15 text-violet-300 border border-violet-500/30 shrink-0">
                          <Zap className="h-3 w-3 mr-1" />
                          High Priority
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="px-5 pb-5 pt-1 relative flex flex-col justify-center h-full">
                      <div className="rounded-xl border border-fuchsia-500/20 bg-background/40 backdrop-blur-sm p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <MvpStat
                            icon={CalendarClock}
                            label="Deadline"
                            value={c.application_deadline ? new Date(c.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            accent="text-cyan-400"
                          />
                          <MvpStat
                            icon={Users}
                            label="Spots left"
                            value={c.max_startups ? `${spots} / ${c.max_startups}` : '—'}
                            accent="text-fuchsia-400"
                          />
                          <MvpStat
                            icon={DollarSign}
                            label="Program fee"
                            value={c.enrollment_fee ? `$${(c.enrollment_fee / 100).toLocaleString()}` : '—'}
                            accent="text-violet-400"
                            className="col-span-2"
                          />
                        </div>

                        {spots > 0 && spots <= 5 && (
                          <p className="text-xs font-semibold text-fuchsia-300 flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5" />
                            Only {spots} spot{spots === 1 ? '' : 's'} left — apply soon
                          </p>
                        )}

                        <Button
                          size="default"
                          className="w-full h-10 text-sm font-bold gap-2 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 border-0 text-white hover:opacity-90 animate-pulse shadow-lg shadow-fuchsia-500/25"
                          onClick={() => navigate(`/cohorts/${c.id}/apply`)}
                        >
                          <Rocket className="h-4 w-4" />
                          Apply to MVP Batch
                        </Button>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <>
                    <CardHeader className="pb-2 pt-5 px-5 relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent p-[1.5px] shrink-0">
                            <div className="h-full w-full rounded-[10px] bg-card flex items-center justify-center overflow-hidden">
                              {c.logo_url ? (
                                <img src={c.logo_url} alt={`${c.org_name} logo`} loading="lazy" className="h-full w-full rounded-[10px] object-contain bg-card p-1" />
                              ) : (
                                <Rocket className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-bold truncate tracking-tight">{c.name}</CardTitle>
                            <p className="text-[11px] text-muted-foreground truncate">{c.org_name}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 border border-primary/20 bg-primary/10 text-primary shrink-0">
                          {statusLabel(c.status)}
                        </Badge>
                      </div>
                      {c.description && (
                        <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">{c.description}</p>
                      )}
                    </CardHeader>

                    <CardContent className="px-5 pb-5 pt-1 relative">
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                            <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                            Spots
                          </div>
                          <div className="text-sm font-semibold text-foreground truncate">{c.max_startups ? `${spots} / ${c.max_startups}` : '—'}</div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                            <CalendarClock className="h-3.5 w-3.5 shrink-0 text-accent" />
                            Deadline
                          </div>
                          <div className="text-sm font-semibold text-foreground truncate">
                            {c.application_deadline ? new Date(c.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full h-9 text-xs font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-0"
                        onClick={() => navigate(`/cohorts/${c.id}/apply`)}
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                        {c.status === 'applications_open' ? 'Apply now' : 'View program'}
                        <ArrowUpRight className="h-3 w-3 ml-auto opacity-70" />
                      </Button>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          );
        })}
    </>

  );
}

function MvpStat({ icon: Icon, label, value, accent, className }: { icon: React.ElementType; label: string; value: string; accent: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-white/5 p-2.5 ${className || ''}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${accent}`} />
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground truncate">{value}</div>
    </div>
  );
}


export default function InvestorCommunity() {
  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Community Investors & Accelerators</h2>
          <p className="text-xs text-muted-foreground">Firms under contract and active accelerator batches</p>

        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 pt-1 snap-x snap-mandatory -mx-1 px-1">
        <ActiveCohorts />
        {FIRMS.map(firm => (
          <Card
            key={firm.id}
            className="group relative overflow-hidden tech-card border-0 rounded-2xl cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.5)] min-w-[300px] max-w-[340px] flex-shrink-0 snap-start"
            onClick={() => window.open(firm.url, '_blank', 'noopener,noreferrer')}
          >
            <div
              className={`pointer-events-none absolute -inset-px rounded-[inherit] bg-gradient-to-br ${firm.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500 [mask:linear-gradient(#000,#000)_content-box,linear-gradient(#000,#000)] [mask-composite:exclude] p-px`}
            />
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${firm.accent}`} />

            <CardHeader className="pb-2 pt-5 px-5 relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`relative h-10 w-10 rounded-xl bg-gradient-to-br ${firm.accent} p-[1.5px] shrink-0`}>
                    <div className="h-full w-full rounded-[10px] bg-card flex items-center justify-center overflow-hidden">
                      <FirmLogo firm={firm} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-bold truncate tracking-tight">{firm.name}</CardTitle>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">Investment Partner</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 border border-primary/20 bg-primary/10 text-primary shrink-0">
                  {firm.focus}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-3 line-clamp-3 leading-relaxed">{firm.description}</p>
            </CardHeader>

            <CardContent className="px-5 pb-5 pt-1 relative">
              <Button
                size="sm"
                className={`w-full h-9 text-xs font-semibold gap-2 bg-gradient-to-r ${firm.accent} border-0 text-white hover:opacity-90`}
                onClick={e => {
                  e.stopPropagation();
                  window.open(firm.url, '_blank', 'noopener,noreferrer');
                }}
              >
                {firm.cta}
                <ArrowUpRight className="h-3.5 w-3.5 ml-auto opacity-80" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

    </>

  );
}
