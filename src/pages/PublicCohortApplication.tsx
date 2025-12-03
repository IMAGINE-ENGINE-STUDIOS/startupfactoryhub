import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Rocket, 
  Calendar, 
  DollarSign, 
  Percent, 
  Clock, 
  CheckCircle,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  FileText,
  Video,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CohortDetails {
  id: string;
  name: string;
  description: string | null;
  application_deadline: string | null;
  funding_per_startup: number | null;
  equity_percentage: number | null;
  focus_industries: string[] | null;
  accelerator: {
    organization_name: string;
    logo_url: string | null;
    description: string | null;
    website: string | null;
  };
}

const STAGES = [
  'Idea',
  'Pre-Seed',
  'Seed',
  'Series A',
  'Series B',
  'Growth'
];

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'FinTech',
  'EdTech',
  'E-commerce',
  'SaaS',
  'AI/ML',
  'Blockchain',
  'CleanTech',
  'BioTech',
  'Other'
];

export default function PublicCohortApplication() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const { toast } = useToast();
  const [cohort, setCohort] = useState<CohortDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [startupName, setStartupName] = useState('');
  const [founderName, setFounderName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [stage, setStage] = useState('');
  const [website, setWebsite] = useState('');
  const [pitchDeckUrl, setPitchDeckUrl] = useState('');
  const [videoPitchUrl, setVideoPitchUrl] = useState('');
  const [whyApplying, setWhyApplying] = useState('');

  useEffect(() => {
    if (cohortId) {
      fetchCohortDetails();
    }
  }, [cohortId]);

  const fetchCohortDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('accelerator_cohorts')
        .select(`
          id,
          name,
          description,
          application_deadline,
          funding_per_startup,
          equity_percentage,
          focus_industries,
          accelerator:accelerator_profiles(
            organization_name,
            logo_url,
            description,
            website
          )
        `)
        .eq('id', cohortId)
        .single();

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: CohortDetails = {
        ...data,
        accelerator: Array.isArray(data.accelerator) ? data.accelerator[0] : data.accelerator
      };
      
      setCohort(transformedData);
    } catch (err) {
      console.error('Error fetching cohort:', err);
      toast({
        title: 'Error',
        description: 'Failed to load cohort details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startupName || !founderName || !email) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('public_cohort_applications')
        .insert({
          cohort_id: cohortId,
          startup_name: startupName,
          founder_name: founderName,
          email,
          phone: phone || null,
          industry: industry || null,
          stage: stage || null,
          website: website || null,
          pitch_deck_url: pitchDeckUrl || null,
          video_pitch_url: videoPitchUrl || null,
          why_applying: whyApplying || null
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Application Submitted!',
        description: 'Thank you for your application. The accelerator will review it shortly.'
      });
    } catch (err) {
      console.error('Error submitting application:', err);
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your application. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cohort) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="tech-card max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Cohort Not Found</h2>
            <p className="text-muted-foreground">
              This cohort may have been removed or the link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysUntilDeadline = cohort.application_deadline 
    ? differenceInDays(new Date(cohort.application_deadline), new Date())
    : null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="tech-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-4">
              Thank you for applying to {cohort.name}. The {cohort.accelerator?.organization_name} team will review your application and get back to you soon.
            </p>
            <Button variant="outline" onClick={() => window.close()}>
              Close Window
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16 border-2 border-background">
              <AvatarImage src={cohort.accelerator?.logo_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xl">
                {cohort.accelerator?.organization_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">Application for</p>
              <h1 className="text-2xl font-bold">{cohort.name}</h1>
              <p className="text-muted-foreground">{cohort.accelerator?.organization_name}</p>
            </div>
          </div>

          {/* Cohort highlights */}
          <div className="flex flex-wrap gap-3">
            {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{daysUntilDeadline} days left</span>
              </div>
            )}
            {cohort.funding_per_startup && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">${(cohort.funding_per_startup / 1000).toFixed(0)}K funding</span>
              </div>
            )}
            {cohort.equity_percentage && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 text-purple-500">
                <Percent className="w-4 h-4" />
                <span className="font-medium">{cohort.equity_percentage}% equity</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Application Form */}
          <div className="md:col-span-2">
            <Card className="tech-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-emerald-500" />
                  Apply Now
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Company Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Company Information
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startupName">Startup Name *</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="startupName"
                            value={startupName}
                            onChange={(e) => setStartupName(e.target.value)}
                            placeholder="Your startup name"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Select value={industry} onValueChange={setIndustry}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDUSTRIES.map((ind) => (
                              <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stage">Stage</Label>
                        <Select value={stage} onValueChange={setStage}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="website"
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://yoursite.com"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Contact Information
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="founderName">Founder Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="founderName"
                            value={founderName}
                            onChange={(e) => setFounderName(e.target.value)}
                            placeholder="Your full name"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="founder@startup.com"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Materials */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Application Materials
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pitchDeck">Pitch Deck URL</Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="pitchDeck"
                            type="url"
                            value={pitchDeckUrl}
                            onChange={(e) => setPitchDeckUrl(e.target.value)}
                            placeholder="Link to your pitch deck"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="videoPitch">Video Pitch URL</Label>
                        <div className="relative">
                          <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="videoPitch"
                            type="url"
                            value={videoPitchUrl}
                            onChange={(e) => setVideoPitchUrl(e.target.value)}
                            placeholder="Link to your video pitch"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whyApplying">Why are you applying? *</Label>
                      <Textarea
                        id="whyApplying"
                        value={whyApplying}
                        onChange={(e) => setWhyApplying(e.target.value)}
                        placeholder="Tell us about your startup and why you'd be a great fit for this program..."
                        rows={5}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Cohort Info */}
          <div className="space-y-6">
            <Card className="tech-card">
              <CardHeader>
                <CardTitle className="text-lg">About This Program</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cohort.description && (
                  <p className="text-sm text-muted-foreground">{cohort.description}</p>
                )}

                {cohort.application_deadline && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Deadline: {format(new Date(cohort.application_deadline), 'MMMM d, yyyy')}</span>
                  </div>
                )}

                {cohort.focus_industries && cohort.focus_industries.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Focus Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {cohort.focus_industries.map((ind) => (
                        <Badge key={ind} variant="outline" className="text-xs">
                          {ind}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {cohort.accelerator?.description && (
              <Card className="tech-card">
                <CardHeader>
                  <CardTitle className="text-lg">About {cohort.accelerator.organization_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{cohort.accelerator.description}</p>
                  {cohort.accelerator.website && (
                    <Button 
                      variant="link" 
                      className="p-0 h-auto mt-2"
                      onClick={() => window.open(cohort.accelerator?.website || '', '_blank')}
                    >
                      Visit Website
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}