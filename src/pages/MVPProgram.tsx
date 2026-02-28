import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Rocket,
  Users,
  DollarSign,
  Clock,
  Calendar,
  CheckCircle,
  ArrowRight,
  Globe,
  Building2,
  Zap,
  Target,
  TrendingUp,
  Star,
  ExternalLink,
} from 'lucide-react';
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

const BENEFITS = [
  {
    icon: <DollarSign className="h-6 w-6 text-emerald-400" />,
    title: 'Funding Access',
    desc: 'Direct access to seed funding and investor network',
  },
  {
    icon: <Zap className="h-6 w-6 text-amber-400" />,
    title: 'Rapid Growth',
    desc: 'Accelerate your MVP from idea to market in weeks',
  },
  {
    icon: <Target className="h-6 w-6 text-blue-400" />,
    title: 'Expert Mentorship',
    desc: 'Guidance from seasoned entrepreneurs and advisors',
  },
  {
    icon: <Globe className="h-6 w-6 text-purple-400" />,
    title: 'Global Network',
    desc: 'Connect with founders, investors and partners worldwide',
  },
  {
    icon: <TrendingUp className="h-6 w-6 text-rose-400" />,
    title: 'Market Validation',
    desc: 'Prove your concept with real customers and data',
  },
  {
    icon: <Star className="h-6 w-6 text-yellow-400" />,
    title: 'Alumni Community',
    desc: 'Lifetime access to our growing founder ecosystem',
  },
];

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
    if (status === 'applications_open') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const programName = profile?.organization_name || 'Startup Factory Hub MVP Accelerator';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background border-b border-border/50">
        {/* grid decoration */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          {/* Logo / icon */}
          <div className="flex justify-center mb-6">
            {profile?.logo_url ? (
              <img src={profile.logo_url} alt={programName} className="h-20 w-20 rounded-2xl object-cover ring-2 ring-primary/30" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center ring-2 ring-primary/30">
                <Rocket className="h-10 w-10 text-primary" />
              </div>
            )}
          </div>

          {profile?.is_accepting_applications && (
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-1">
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              Now Accepting Applications
            </Badge>
          )}

          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            {programName}
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {profile?.description ||
              'A 4-week intensive program that transforms your startup idea into a market-ready MVP. Get funding, mentorship, and a global network to launch faster.'}
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {profile?.program_duration && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                {profile.program_duration} program
              </div>
            )}
            {profile?.funding_offered && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Up to ${profile.funding_offered.toLocaleString()} funding
              </div>
            )}
            {profile?.equity_percentage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                {profile.equity_percentage}% equity
              </div>
            )}
            {profile?.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4 text-blue-400" />
                {profile.location}
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/auth?mode=signup')}
              className="gap-2 text-base px-8"
            >
              <Rocket className="h-5 w-5" />
              Create Account to Apply
              <ArrowRight className="h-4 w-4" />
            </Button>
            {profile?.website && (
              <Button size="lg" variant="outline" onClick={() => window.open(profile.website!, '_blank')} className="gap-2 text-base">
                <Globe className="h-5 w-5" />
                Visit Website
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Why create an account ──────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Why Join Through the Platform?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Creating an account gives your startup a verified presence in our ecosystem and
            puts your application directly in front of our selection committee.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENEFITS.map(({ icon, title, desc }) => (
            <Card key={title} className="tech-card border-0 hover:border-primary/20 transition-colors">
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="p-2.5 rounded-xl bg-muted shrink-0">{icon}</div>
                <div>
                  <p className="font-semibold mb-1">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Open Cohorts ──────────────────────────────────────── */}
      {cohorts.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 pb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Open Cohorts</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {cohorts.map((cohort) => (
              <Card key={cohort.id} className="tech-card border-0 flex flex-col">
                <CardContent className="p-6 flex flex-col gap-4 h-full">
                  {/* header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-lg">{cohort.name}</h3>
                      {cohort.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{cohort.description}</p>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(cohort.status)} shrink-0 capitalize text-xs`}>
                      {cohort.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {cohort.start_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 text-primary shrink-0" />
                        Starts {format(new Date(cohort.start_date), 'MMM d, yyyy')}
                      </div>
                    )}
                    {cohort.application_deadline && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                        Deadline {format(new Date(cohort.application_deadline), 'MMM d')}
                      </div>
                    )}
                    {cohort.funding_per_startup && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4 text-emerald-400 shrink-0" />
                        ${(cohort.funding_per_startup / 1000).toFixed(0)}K per startup
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4 text-blue-400 shrink-0" />
                      {cohort.max_startups - cohort.current_startups} spots left
                    </div>
                    {cohort.enrollment_fee && cohort.enrollment_fee > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4 text-amber-400 shrink-0" />
                        ${(cohort.enrollment_fee / 100).toLocaleString()} application fee
                      </div>
                    )}
                  </div>

                  {/* industries */}
                  {cohort.focus_industries && cohort.focus_industries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {cohort.focus_industries.map((ind) => (
                        <Badge key={ind} variant="outline" className="text-xs">
                          {ind}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="mt-auto pt-4 border-t border-border/50 flex gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => navigate('/auth?mode=signup')}
                    >
                      <Rocket className="h-4 w-4" />
                      Apply via Account
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(`/cohorts/${cohort.id}/apply`, '_blank')}
                      title="Apply without account"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <div className="border-t border-border/50 bg-primary/5">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4 opacity-60" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Build Your MVP?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Create your free Startup Factory Hub account today and submit your application
            directly through our platform. Our team reviews applications on a rolling basis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/auth?mode=signup')} className="gap-2 px-8">
              <Rocket className="h-5 w-5" />
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="gap-2">
              Already have an account? Sign In
            </Button>
          </div>
          {profile?.website && (
            <p className="mt-6 text-sm text-muted-foreground">
              Learn more at{' '}
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {profile.website}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
