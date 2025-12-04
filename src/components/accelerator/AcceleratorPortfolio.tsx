import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Grid3X3, 
  List, 
  TrendingUp, 
  Users, 
  DollarSign,
  ChevronRight,
  GraduationCap,
  Building2,
  MoreVertical,
  Trash2
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
  mentor_assignments?: any[];
  advisor_assignments?: any[];
  milestones?: any[];
}

interface Cohort {
  id: string;
  name: string;
}

interface AcceleratorPortfolioProps {
  startups: CohortStartup[];
  cohorts: Cohort[];
  totalFundingRaised?: number;
  onViewStartup: (startup: CohortStartup) => void;
  onDeleteStartup?: (startupId: string) => Promise<void>;
}

export const AcceleratorPortfolio = ({
  startups,
  cohorts,
  totalFundingRaised = 0,
  onViewStartup,
  onDeleteStartup
}: AcceleratorPortfolioProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [startupToDelete, setStartupToDelete] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, startupId: string) => {
    e.stopPropagation();
    setStartupToDelete(startupId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (startupToDelete && onDeleteStartup) {
      await onDeleteStartup(startupToDelete);
    }
    setDeleteDialogOpen(false);
    setStartupToDelete(null);
  };

  const getStartupName = (startup: CohortStartup) => {
    if (startup.is_manual_entry) return startup.external_company_name || 'Unknown';
    return startup.company?.name || 'Unknown';
  };

  const getStartupIndustry = (startup: CohortStartup) => {
    if (startup.is_manual_entry) return startup.external_company_industry || 'Technology';
    return startup.company?.industry || 'Technology';
  };

  const getStartupLogo = (startup: CohortStartup) => {
    if (startup.is_manual_entry) return startup.external_company_logo;
    return startup.company?.logo_url;
  };

  const getStartupDescription = (startup: CohortStartup) => {
    if (startup.is_manual_entry) return 'External company';
    return startup.company?.description || 'No description available';
  };

  const filteredStartups = startups.filter(startup => {
    const name = getStartupName(startup);
    const industry = getStartupIndustry(startup);
    const matchesSearch = !searchQuery || 
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCohort = selectedCohort === 'all' || startup.cohort_id === selectedCohort;
    const matchesStage = selectedStage === 'all' || startup.current_stage === selectedStage;
    return matchesSearch && matchesCohort && matchesStage;
  });

  const getCohortName = (cohortId: string) => {
    return cohorts.find(c => c.id === cohortId)?.name || 'Unknown';
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'onboarding': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'graduated': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'dropped': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const activeStartups = startups.filter(s => s.current_stage === 'active').length;
  const graduatedStartups = startups.filter(s => s.current_stage === 'graduated').length;
  const totalMentors = new Set(startups.flatMap(s => s.mentor_assignments?.map(m => m.mentor_id) || [])).size;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{startups.length}</p>
                <p className="text-sm text-muted-foreground">Total Startups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeStartups}</p>
                <p className="text-sm text-muted-foreground">Active Now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{graduatedStartups}</p>
                <p className="text-sm text-muted-foreground">Graduated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${(totalFundingRaised / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-muted-foreground">Total Raised</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search portfolio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[200px]"
            />
          </div>
          <Select value={selectedCohort} onValueChange={setSelectedCohort}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Cohorts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cohorts</SelectItem>
              {cohorts.map((cohort) => (
                <SelectItem key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Portfolio Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStartups.map((startup) => (
            <Card 
              key={startup.id}
              className="tech-card border-0 cursor-pointer group relative"
              onClick={() => onViewStartup(startup)}
            >
              {onDeleteStartup && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={(e) => handleDeleteClick(e, startup.id)} 
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove from Portfolio
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={getStartupLogo(startup) || undefined} />
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-lg">
                      {getStartupName(startup)?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg group-hover:text-emerald-400 transition-colors">
                        {getStartupName(startup)}
                      </h3>
                      {startup.is_manual_entry && (
                        <Badge variant="outline" className="text-xs">External</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {getStartupIndustry(startup)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStageColor(startup.current_stage)}>
                        {startup.current_stage}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getCohortName(startup.cohort_id)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                  {getStartupDescription(startup)}
                </p>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{startup.progress_percentage}%</span>
                  </div>
                  <Progress value={startup.progress_percentage} className="h-2" />
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{startup.mentor_assignments?.length || 0} mentors</span>
                  </div>
                  {startup.funding_received && (
                    <div className="flex items-center gap-1 text-sm text-emerald-400">
                      <DollarSign className="w-4 h-4" />
                      <span>${(startup.funding_received / 1000).toFixed(0)}K</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="tech-card border-0">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {filteredStartups.map((startup) => (
                <div 
                  key={startup.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer group"
                  onClick={() => onViewStartup(startup)}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={getStartupLogo(startup) || undefined} />
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                      {getStartupName(startup)?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{getStartupName(startup)}</h4>
                      {startup.is_manual_entry && <Badge variant="outline" className="text-xs">External</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getStartupIndustry(startup)}
                    </p>
                  </div>
                  <Badge className={getStageColor(startup.current_stage)}>
                    {startup.current_stage}
                  </Badge>
                  <Badge variant="outline">{getCohortName(startup.cohort_id)}</Badge>
                  <div className="w-32 hidden sm:block">
                    <Progress value={startup.progress_percentage} className="h-2" />
                  </div>
                  {onDeleteStartup && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={(e) => handleDeleteClick(e, startup.id)} 
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="tech-card border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Portfolio?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the startup from your portfolio. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty State */}
      {filteredStartups.length === 0 && (
        <Card className="tech-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Startups Found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchQuery || selectedCohort !== 'all' || selectedStage !== 'all'
                ? 'Try adjusting your filters to find startups.'
                : 'Accept applications to build your portfolio of promising startups.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
