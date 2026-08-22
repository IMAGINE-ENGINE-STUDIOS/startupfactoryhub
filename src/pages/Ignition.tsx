import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Rocket,
  Plane,
  Users,
  Briefcase,
  Cpu,
  Building2,
  Video,
  Factory,
  Network,
  Megaphone,
  Flame,
  CheckCircle,
  Loader2,
  ArrowRight,
  Mail,
  User,
  Phone,
  Globe,
  FileText,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import IgnitionProgramAnimatedBanner from '@/components/marketing/IgnitionProgramAnimatedBanner';
import orlandoWeekVideo from '@/assets/ignition/orlando-week.mp4.asset.json';
import pitchDayVideo from '@/assets/ignition/pitch-day.mp4.asset.json';
import mentorshipVideo from '@/assets/ignition/mentorship.mp4.asset.json';
import advisoryVideo from '@/assets/ignition/advisory.mp4.asset.json';
import technologiesVideo from '@/assets/ignition/technologies.mp4.asset.json';
import incorporationVideo from '@/assets/ignition/incorporation.mp4.asset.json';
import webinarsVideo from '@/assets/ignition/webinars.mp4.asset.json';
import industryDayVideo from '@/assets/ignition/industry-day.mp4.asset.json';
import networkingVideo from '@/assets/ignition/networking.mp4.asset.json';
import mediaExposureVideo from '@/assets/ignition/media-exposure.mp4.asset.json';

const SFH_ACCELERATOR_ID = '969d49dc-6b34-4d18-a6eb-7871416fff38';

const DELIVERABLES = [
  {
    video: orlandoWeekVideo.url,
    title: '1 Week in Orlando',
    desc: 'Five days on the ground in Florida with the SFH operating team: customer meetings, partner intros and a working agenda built around your U.S. entry plan.',
  },
  {
    video: pitchDayVideo.url,
    title: 'Presentation Day at KSC',
    desc: 'Pitch live at Kennedy Space Center in front of investors, aerospace primes and ecosystem leaders — with rehearsal and messaging prep before you step on stage.',
  },
  {
    video: mentorshipVideo.url,
    title: 'Mentorship',
    desc: 'Weekly 1:1 sessions with founders and operators who have already scaled in the U.S., matched to your sector and your current bottleneck.',
  },
  {
    video: advisoryVideo.url,
    title: 'Advisory',
    desc: 'Legal, tax, IP and go-to-market advisors on call to pressure-test structure, contracts and pricing before you commit to them.',
  },
  {
    video: technologiesVideo.url,
    title: 'Access to Technologies',
    desc: 'Introductions to deep-tech, photonics and AI infrastructure partners — labs, compute and test facilities you can actually use during the program.',
  },
  {
    video: incorporationVideo.url,
    title: 'U.S. Company Registration',
    desc: 'Guided incorporation end to end: entity selection, EIN, U.S. business banking, cap table and the paperwork investors will ask for.',
  },
  {
    video: webinarsVideo.url,
    title: 'Webinars',
    desc: 'A structured curriculum of live and on-demand sessions on U.S. sales, fundraising, compliance and hiring — recorded and yours to keep.',
  },
  {
    video: industryDayVideo.url,
    title: 'Industry Day',
    desc: 'Face time with industrial buyers and corporate innovation teams actively sourcing suppliers, pilots and technology partners.',
  },
  {
    video: networkingVideo.url,
    title: 'Networking with Orlando Tech',
    desc: 'Curated dinners and events with the Orlando tech ecosystem, U.S. operators and local capital — relationships that outlast the cohort.',
  },
  {
    video: mediaExposureVideo.url,
    title: 'Social Media Exposure',
    desc: 'Professional founder interview, launch feature and cohort coverage distributed across Startup Factory Hub channels and partner networks.',
  },
];


const STAGES = ['Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth'];
const INDUSTRIES = ['Aerospace', 'Deep Tech', 'Photonics', 'AI/ML', 'Robotics', 'CleanTech', 'BioTech', 'Other'];

interface CohortRow {
  id: string;
  name: string;
  description: string | null;
  application_deadline: string | null;
  focus_industries: string[] | null;
  status: string | null;
}

const Ignition = () => {
  const [cohort, setCohort] = useState<CohortRow | null>(null);
  const [loadingCohort, setLoadingCohort] = useState(true);

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startupName, setStartupName] = useState('');
  const [founderName, setFounderName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [stage, setStage] = useState('');
  const [website, setWebsite] = useState('');
  const [pitchDeckUrl, setPitchDeckUrl] = useState('');
  const [whyApplying, setWhyApplying] = useState('');

  useEffect(() => {
    const fetchCohort = async () => {
      try {
        const { data, error } = await supabase
          .from('accelerator_cohorts')
          .select('id, name, description, application_deadline, focus_industries, status')
          .eq('accelerator_id', SFH_ACCELERATOR_ID)
          .ilike('name', 'Ignition')
          .order('created_at', { ascending: true })
          .limit(1);

        if (error) throw error;
        if (data && data.length > 0) setCohort(data[0] as CohortRow);
      } catch (err) {
        console.error('[Ignition] failed to fetch cohort', err);
      } finally {
        setLoadingCohort(false);
      }
    };
    fetchCohort();
  }, []);

  // SEO meta (no react-helmet in project)
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Ignition Program — Startup Factory Hub | Orlando + KSC';
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };
    setMeta(
      'description',
      'Ignition by Startup Factory Hub: 1-week U.S. expansion program in Orlando with Demo Day at Kennedy Space Center. Mentorship, advisory, U.S. incorporation, networking and more.'
    );
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://startupfactoryhub.com/ignition';
    return () => { document.title = prevTitle; };
  }, []);

  const scrollToApply = () => {
    const el = document.getElementById('apply');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohort) {
      toast.error('Cohort is not available yet. Please try again shortly.');
      return;
    }
    if (!startupName || !founderName || !email) {
      toast.error('Please fill in startup name, founder name and email.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('public_cohort_applications').insert({
        cohort_id: cohort.id,
        startup_name: startupName,
        founder_name: founderName,
        email,
        phone: phone || null,
        industry: industry || null,
        stage: stage || null,
        website: website || null,
        pitch_deck_url: pitchDeckUrl || null,
        video_pitch_url: null,
        why_applying: whyApplying || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Application submitted. The Startup Factory Hub team will be in touch.');
    } catch (err: any) {
      console.error('[Ignition] submission error', err);
      toast.error(err?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ===================== HERO (Animated Banner) ===================== */}
      <section className="relative isolate overflow-hidden bg-black">
        {/* Top status ribbon */}
        <div className="relative z-10 border-b border-emerald-500/30 bg-emerald-950/40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-[11px] font-mono text-emerald-300/90">
            <span className="truncate">
              &gt; SYS://IGNITION_PROGRAM.INIT &nbsp;●&nbsp; STATUS:{' '}
              {cohort?.status === 'applications_open' ? 'ACCEPTING_APPLICATIONS' : (cohort?.status || 'COMING_SOON').toUpperCase()}
              &nbsp;●&nbsp; COHORT_2026
            </span>
            <span className="hidden sm:inline">ORLANDO_FL // USA</span>
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 md:py-14 space-y-8">
          {/* Embedded animated banner */}
          <div className="rounded-xl overflow-hidden border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.25)]">
            <IgnitionProgramAnimatedBanner />
          </div>

          {/* CTAs + tags */}
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="flex flex-wrap justify-center gap-2">
              {(cohort?.focus_industries ?? ['Aerospace', 'Deep Tech', 'Photonics', 'AI/ML']).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-emerald-400/50 bg-emerald-950/40 text-emerald-200 font-mono text-[11px] tracking-wider"
                >
                  {tag.toUpperCase()}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                onClick={scrollToApply}
                className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold"
              >
                <Flame className="w-4 h-4 mr-2" />
                Apply to Cohort
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('what-you-get')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/10"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>


      {/* ===================== WHAT YOU GET ===================== */}
      <section id="what-you-get" className="max-w-7xl mx-auto px-4 py-20">
        <div className="mb-10 text-center md:text-left">
          <p className="text-emerald-400 font-mono text-xs tracking-[0.2em] uppercase">
            What You Get — Specific Deliverables
          </p>
          <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">
            Everything Ignition delivers, no fluff.
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            A focused, in-person U.S. expansion sprint with measurable outputs across mentorship,
            access, infrastructure and exposure.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DELIVERABLES.map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="tech-card border-0 group transition hover:-translate-y-1">
              <CardContent className="p-6 space-y-3">
                <div className="w-11 h-11 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center group-hover:bg-emerald-500/25 transition">
                  <Icon className="w-5 h-5 text-emerald-300" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ===================== WHO IT'S FOR ===================== */}
      <section className="border-y border-emerald-500/15 bg-emerald-950/10">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
          <p className="text-emerald-400 font-mono text-xs tracking-[0.2em] uppercase">Who it's for</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">
            Seed-stage founders ready to scale in the United States
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Aerospace, Deep Tech, Photonics and A.I. companies that want a fast, structured path to
            U.S. presence — incorporation, customers, capital and talent.
          </p>
        </div>
      </section>

      {/* ===================== APPLY ===================== */}
      <section id="apply" className="max-w-3xl mx-auto px-4 py-20">
        <div className="mb-8 text-center">
          <p className="text-emerald-400 font-mono text-xs tracking-[0.2em] uppercase">Apply Now</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-tight">
            Apply to the Ignition Cohort
          </h2>
          <p className="mt-3 text-muted-foreground">
            Submissions are reviewed on a rolling basis by the Startup Factory Hub team.
          </p>
        </div>

        <Card className="tech-card border-0">
          <CardContent className="p-6 md:p-8">
            {loadingCohort ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading cohort…
              </div>
            ) : !cohort ? (
              <div className="text-center py-10 space-y-2">
                <Rocket className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-semibold">Ignition cohort coming soon</h3>
                <p className="text-sm text-muted-foreground">
                  Applications are not open yet. Please check back shortly.
                </p>
              </div>
            ) : submitted ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold">Application submitted</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Thanks for applying to Ignition. The Startup Factory Hub team will review your
                  application and get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startupName">Startup Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="startupName" value={startupName} onChange={(e) => setStartupName(e.target.value)} placeholder="Your startup name" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent className="bg-background backdrop-blur-none">
                        {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stage">Stage</Label>
                    <Select value={stage} onValueChange={setStage}>
                      <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                      <SelectContent className="bg-background backdrop-blur-none">
                        {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" className="pl-10" />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="founderName">Founder Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="founderName" value={founderName} onChange={(e) => setFounderName(e.target.value)} placeholder="Your full name" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="founder@startup.com" className="pl-10" required />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pitchDeck">Pitch Deck URL</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="pitchDeck" type="url" value={pitchDeckUrl} onChange={(e) => setPitchDeckUrl(e.target.value)} placeholder="Link to your pitch deck" className="pl-10" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="why">Why Ignition? (optional)</Label>
                  <Textarea
                    id="why"
                    value={whyApplying}
                    onChange={(e) => setWhyApplying(e.target.value)}
                    placeholder="Tell us why your startup is ready to expand to the U.S. via Ignition."
                    rows={5}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</>
                  ) : (
                    <><Flame className="w-4 h-4 mr-2" /> Submit Application</>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        <p>
          Ignition Program — operated by Startup Factory Hub · Orlando, FL · Demo Day at Kennedy Space Center
        </p>
      </footer>
    </div>
  );
};

export default Ignition;
