import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import {
  MapPin,
  Globe,
  Users,
  Rocket,
  DollarSign,
  Percent,
  Calendar,
  Clock,
  ExternalLink,
  Building2
} from 'lucide-react';
import { CohortApplicationDialog } from '@/components/accelerator/CohortApplicationDialog';

interface AcceleratorProfileDialogProps {
  acceleratorId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AcceleratorProfileDialog = ({
  acceleratorId,
  open,
  onOpenChange
}: AcceleratorProfileDialogProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCohort, setSelectedCohort] = useState<any>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);

  useEffect(() => {
    if (acceleratorId && open) {
      fetchAcceleratorData();
    }
  }, [acceleratorId, open]);

  const fetchAcceleratorData = async () => {
    if (!acceleratorId) return;
    setLoading(true);

    try {
      // Fetch accelerator profile
      const { data: accProfile } = await supabase
        .from('accelerator_profiles')
        .select('*')
        .eq('id', acceleratorId)
        .single();

      setProfile(accProfile);

      // Fetch active cohorts
      const { data: accCohorts } = await supabase
        .from('accelerator_cohorts')
        .select('*')
        .eq('accelerator_id', acceleratorId)
        .in('status', ['upcoming', 'applications_open'])
        .order('application_deadline', { ascending: true });

      setCohorts(accCohorts || []);
    } catch (error) {
      console.error('Error fetching accelerator:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (cohort: any) => {
    setSelectedCohort({
      cohort_id: cohort.id,
      name: cohort.name,
      description: cohort.description,
      deadline: cohort.application_deadline,
      funding: cohort.funding_per_startup,
      equity: cohort.equity_percentage,
      industries: cohort.focus_industries,
      accelerator_name: profile?.organization_name,
      accelerator_logo: profile?.logo_url
    });
    setShowApplicationDialog(true);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  if (!acceleratorId) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] glass-morphism !transition-none">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
          ) : profile ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={profile.logo_url} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xl">
                      {profile.organization_name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">{profile.organization_name}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-emerald-500/20 text-emerald-400">Accelerator</Badge>
                      {profile.location && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {profile.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-6 py-4">
                  {/* Description */}
                  {profile.description && (
                    <p className="text-foreground">{profile.description}</p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="tech-card border-0">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Users className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="text-xl font-bold">{profile.total_cohorts || 0}</p>
                          <p className="text-xs text-muted-foreground">Cohorts</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="tech-card border-0">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Rocket className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="text-xl font-bold">{profile.total_startups_supported || 0}</p>
                          <p className="text-xs text-muted-foreground">Startups</p>
                        </div>
                      </CardContent>
                    </Card>
                    {profile.funding_offered && (
                      <Card className="tech-card border-0">
                        <CardContent className="p-4 flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="text-xl font-bold">{formatCurrency(profile.funding_offered)}</p>
                            <p className="text-xs text-muted-foreground">Per Startup</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {profile.equity_percentage && (
                      <Card className="tech-card border-0">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Percent className="w-5 h-5 text-amber-500" />
                          <div>
                            <p className="text-xl font-bold">{profile.equity_percentage}%</p>
                            <p className="text-xs text-muted-foreground">Equity</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Program Details */}
                  <div className="flex flex-wrap gap-3">
                    {profile.program_duration && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {profile.program_duration}
                      </Badge>
                    )}
                    {profile.website && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={profile.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-4 h-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Industries */}
                  {profile.industries_focus && profile.industries_focus.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Focus Industries</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.industries_focus.map((industry: string) => (
                          <Badge key={industry} variant="secondary">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Cohorts */}
                  {cohorts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Open Programs</h4>
                      <div className="space-y-3">
                        {cohorts.map((cohort) => {
                          const daysLeft = cohort.application_deadline 
                            ? differenceInDays(new Date(cohort.application_deadline), new Date())
                            : null;

                          return (
                            <Card key={cohort.id} className="tech-card border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-semibold">{cohort.name}</h5>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                      {cohort.funding_per_startup && (
                                        <span className="text-emerald-500">
                                          {formatCurrency(cohort.funding_per_startup)}
                                        </span>
                                      )}
                                      {daysLeft !== null && daysLeft > 0 && (
                                        <span className="flex items-center gap-1 text-amber-500">
                                          <Clock className="w-3 h-3" />
                                          {daysLeft} days left
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    className="bg-emerald-500 hover:bg-emerald-600"
                                    onClick={() => handleApply(cohort)}
                                  >
                                    Apply
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {cohorts.length === 0 && (
                    <Card className="tech-card border-0">
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No open programs at the moment. Check back later!</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Accelerator not found</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedCohort && (
        <CohortApplicationDialog
          open={showApplicationDialog}
          onOpenChange={setShowApplicationDialog}
          cohortData={selectedCohort}
        />
      )}
    </>
  );
};