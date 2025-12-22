import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import {
  Building2,
  Users,
  DollarSign,
  ExternalLink,
  Calendar,
  Target,
  TrendingUp,
  Globe,
  FileText,
  MapPin,
  GraduationCap,
  Percent,
  Briefcase
} from 'lucide-react';

interface CohortStartup {
  id: string;
  cohort_id: string;
  company_id: string;
  joined_at: string;
  current_stage: string;
  progress_percentage: number;
  funding_received: number | null;
  equity_given: number | null;
  graduation_date: string | null;
  notes: string | null;
  is_manual_entry?: boolean;
  external_company_name?: string | null;
  external_company_industry?: string | null;
  external_company_website?: string | null;
  external_company_logo?: string | null;
  graduation_year?: number | null;
  company?: {
    id: string;
    name: string;
    description: string | null;
    industry: string | null;
    stage: string | null;
    logo_url: string | null;
    user_id: string;
    website: string | null;
    pitch_deck_url: string | null;
    funding_amount: number | null;
    team_size: number | null;
    founded_year: number | null;
    location: string | null;
  };
}

interface PortfolioStartupDialogProps {
  startup: CohortStartup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortName?: string;
}

export const PortfolioStartupDialog = ({
  startup,
  open,
  onOpenChange,
  cohortName
}: PortfolioStartupDialogProps) => {
  if (!startup) return null;

  const getStartupName = () => {
    if (startup.is_manual_entry) return startup.external_company_name || 'Unknown';
    return startup.company?.name || 'Unknown';
  };

  const getStartupIndustry = () => {
    if (startup.is_manual_entry) return startup.external_company_industry || 'Technology';
    return startup.company?.industry || 'Technology';
  };

  const getStartupLogo = () => {
    if (startup.is_manual_entry) return startup.external_company_logo;
    return startup.company?.logo_url;
  };

  const getStartupWebsite = () => {
    if (startup.is_manual_entry) return startup.external_company_website;
    return startup.company?.website;
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'onboarding': return 'bg-blue-500/20 text-blue-400';
      case 'active': return 'bg-emerald-500/20 text-emerald-400';
      case 'graduated': return 'bg-purple-500/20 text-purple-400';
      case 'dropped': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Investment calculations
  const investedAmount = startup.funding_received || 0;
  const equityOwned = startup.equity_given || 0;
  const currentValuation = startup.company?.funding_amount || 0;
  const estimatedStakeValue = currentValuation > 0 ? (currentValuation * equityOwned / 100) : 0;
  const roi = investedAmount > 0 ? ((estimatedStakeValue - investedAmount) / investedAmount * 100) : 0;

  const getGraduationYear = () => {
    if (startup.graduation_year) return startup.graduation_year;
    if (startup.graduation_date) return new Date(startup.graduation_date).getFullYear();
    return null;
  };

  const isGraduated = startup.graduation_date || startup.current_stage === 'graduated';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] glass-morphism">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={getStartupLogo() || undefined} />
              <AvatarFallback className="bg-purple-500/20 text-purple-400 text-xl">
                {getStartupName()?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{getStartupName()}</DialogTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={getStageColor(startup.current_stage)}>
                  {isGraduated ? 'Graduated' : startup.current_stage}
                </Badge>
                {cohortName && (
                  <Badge variant="outline">{cohortName}</Badge>
                )}
                <Badge variant="secondary">{getStartupIndustry()}</Badge>
                {getGraduationYear() && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Class of {getGraduationYear()}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Company Profile Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Profile
              </h3>
              
              {/* Description */}
              {startup.company?.description && (
                <p className="text-foreground mb-4">{startup.company.description}</p>
              )}

              {/* Company Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {startup.company?.founded_year && (
                  <Card className="tech-card border-0">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Founded</p>
                        <p className="font-medium">{startup.company.founded_year}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {startup.company?.team_size && (
                  <Card className="tech-card border-0">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Team Size</p>
                        <p className="font-medium">{startup.company.team_size} people</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {startup.company?.location && (
                  <Card className="tech-card border-0">
                    <CardContent className="p-4 flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-medium truncate">{startup.company.location}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {startup.company?.stage && (
                  <Card className="tech-card border-0">
                    <CardContent className="p-4 flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Stage</p>
                        <p className="font-medium capitalize">{startup.company.stage}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-2 mt-4">
                {getStartupWebsite() && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={getStartupWebsite()!} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                )}
                {startup.company?.pitch_deck_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={startup.company.pitch_deck_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      Pitch Deck
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Investment Performance Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Investment Performance
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="tech-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Your Investment</p>
                        <p className="text-xl font-bold">
                          ${investedAmount > 0 ? (investedAmount / 1000).toFixed(0) + 'K' : '0'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="tech-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <Percent className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Equity Owned</p>
                        <p className="text-xl font-bold">{equityOwned.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="tech-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Company Valuation</p>
                        <p className="text-xl font-bold">
                          {currentValuation > 0 ? `$${(currentValuation / 1000000).toFixed(1)}M` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="tech-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Est. Stake Value</p>
                        <p className="text-xl font-bold">
                          {estimatedStakeValue > 0 ? `$${(estimatedStakeValue / 1000).toFixed(0)}K` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="tech-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roi >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        <TrendingUp className={`w-5 h-5 ${roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Est. ROI</p>
                        <p className={`text-xl font-bold ${roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {investedAmount > 0 && currentValuation > 0 ? `${roi >= 0 ? '+' : ''}${roi.toFixed(0)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="tech-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Investment Date</p>
                        <p className="text-sm font-medium">
                          {format(new Date(startup.joined_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Cohort & Progress Info */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Program Status
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Card className="tech-card border-0">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Cohort</p>
                    <p className="font-medium">{cohortName || 'Unknown'}</p>
                  </CardContent>
                </Card>
                <Card className="tech-card border-0">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Progress</p>
                    <p className="font-medium">{startup.progress_percentage}%</p>
                  </CardContent>
                </Card>
                {startup.graduation_date && (
                  <Card className="tech-card border-0">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Graduation Date</p>
                      <p className="font-medium">{format(new Date(startup.graduation_date), 'MMM d, yyyy')}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Notes */}
            {startup.notes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                <p className="text-foreground bg-background/50 p-3 rounded-lg">{startup.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
