import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Rocket, Upload, Video, FileText, Calendar, DollarSign, Percent, Loader2 } from 'lucide-react';

interface CohortData {
  cohort_id: string;
  name: string;
  description?: string;
  deadline?: string;
  funding?: number;
  equity?: number;
  industries?: string[];
  accelerator_name?: string;
  accelerator_logo?: string;
}

interface CohortApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortData: CohortData | null;
  onApplicationSubmitted?: () => void;
}

export const CohortApplicationDialog = ({
  open,
  onOpenChange,
  cohortData,
  onApplicationSubmitted
}: CohortApplicationDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [pitchDeckUrl, setPitchDeckUrl] = useState('');
  const [videoPitchUrl, setVideoPitchUrl] = useState('');
  const [whyApplying, setWhyApplying] = useState('');
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchUserCompanies();
      checkExistingApplication();
    }
  }, [user, open, cohortData?.cohort_id]);

  const fetchUserCompanies = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, logo_url, industry, stage')
      .eq('user_id', user.id);

    if (!error && data) {
      setCompanies(data);
      if (data.length === 1) {
        setSelectedCompany(data[0].id);
      }
    }
  };

  const checkExistingApplication = async () => {
    if (!user || !cohortData?.cohort_id) return;

    const { data } = await supabase
      .from('cohort_applications')
      .select('id')
      .eq('cohort_id', cohortData.cohort_id)
      .eq('applicant_user_id', user.id)
      .maybeSingle();

    setHasApplied(!!data);
  };

  const handleSubmit = async () => {
    if (!user || !selectedCompany || !cohortData?.cohort_id) {
      toast({ title: 'Please select a startup', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cohort_applications')
        .insert({
          cohort_id: cohortData.cohort_id,
          startup_id: selectedCompany,
          applicant_user_id: user.id,
          pitch_deck_url: pitchDeckUrl || null,
          video_pitch_url: videoPitchUrl || null,
          application_answers: {
            why_applying: whyApplying
          },
          status: 'pending'
        });

      if (error) throw error;

      toast({ title: 'Application submitted successfully!' });
      onOpenChange(false);
      onApplicationSubmitted?.();
    } catch (error: any) {
      console.error('Application error:', error);
      toast({ 
        title: 'Failed to submit application', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!cohortData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg glass-morphism">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-emerald-500" />
            Apply to {cohortData.name}
          </DialogTitle>
          <DialogDescription>
            {cohortData.accelerator_name && `Accelerator: ${cohortData.accelerator_name}`}
          </DialogDescription>
        </DialogHeader>

        {hasApplied ? (
          <Card className="tech-card border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Already Applied</h3>
              <p className="text-muted-foreground">
                You have already submitted an application to this cohort. 
                Check your dashboard for application status.
              </p>
            </CardContent>
          </Card>
        ) : !user ? (
          <Card className="tech-card border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
              <p className="text-muted-foreground mb-4">
                Please sign in to apply to this accelerator program.
              </p>
              <Button onClick={() => window.location.href = '/auth'}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        ) : companies.length === 0 ? (
          <Card className="tech-card border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Create a Startup First</h3>
              <p className="text-muted-foreground mb-4">
                You need to create a startup profile before applying to accelerator programs.
              </p>
              <Button onClick={() => window.location.href = '/dashboard?tab=profile'}>
                Create Startup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Cohort Info */}
            <div className="flex flex-wrap gap-3 text-sm">
              {cohortData.deadline && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Deadline: {format(new Date(cohortData.deadline), 'MMM d, yyyy')}
                </Badge>
              )}
              {cohortData.funding && (
                <Badge variant="outline" className="flex items-center gap-1 text-emerald-500">
                  <DollarSign className="w-3 h-3" />
                  ${(cohortData.funding / 1000).toFixed(0)}K
                </Badge>
              )}
              {cohortData.equity && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  {cohortData.equity}% equity
                </Badge>
              )}
            </div>

            {/* Select Startup */}
            <div className="space-y-2">
              <Label>Select Your Startup *</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a startup" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name} {company.industry && `• ${company.industry}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Why Applying */}
            <div className="space-y-2">
              <Label>Why are you applying? *</Label>
              <Textarea
                value={whyApplying}
                onChange={(e) => setWhyApplying(e.target.value)}
                placeholder="Tell us why your startup is a good fit for this program..."
                rows={4}
              />
            </div>

            {/* Pitch Deck */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Pitch Deck URL (optional)
              </Label>
              <Input
                value={pitchDeckUrl}
                onChange={(e) => setPitchDeckUrl(e.target.value)}
                placeholder="https://drive.google.com/... or https://docsend.com/..."
              />
            </div>

            {/* Video Pitch */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video Pitch URL (optional)
              </Label>
              <Input
                value={videoPitchUrl}
                onChange={(e) => setVideoPitchUrl(e.target.value)}
                placeholder="https://youtube.com/... or https://loom.com/..."
              />
            </div>

            {/* Submit */}
            <Button 
              onClick={handleSubmit} 
              className="w-full"
              disabled={loading || !selectedCompany || !whyApplying.trim()}
            >
              {loading ? (
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};