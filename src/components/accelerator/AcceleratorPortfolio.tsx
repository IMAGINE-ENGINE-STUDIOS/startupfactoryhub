import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Grid3X3, 
  List, 
  TrendingUp, 
  Users, 
  DollarSign,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  Building2
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
  company?: {
    id: string;
    name: string;
    description: string | null;
    industry: string | null;
    stage: string | null;
    logo_url: string | null;
    user_id: string;
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
}

export const AcceleratorPortfolio = ({
  startups,
  cohorts,
  totalFundingRaised = 0,
  onViewStartup
}: AcceleratorPortfolioProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredStartups = startups.filter(startup => {
    const matchesSearch = !searchQuery || 
      startup.company?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      startup.company?.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCohort = selectedCohort === 'all' || startup.cohort_id === selectedCohort;
    const matchesStage = selectedStage === 'all' || startup.current_stage === selectedStage;
    return matchesSearch && matchesCohort && matchesStage;
  });

  const getCohortName = (cohortId: string) => {
    return cohorts.find(c => c.id === cohortId)?.name || 'Unknown';
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

  // Stats
  const activeStartups = startups.filter(s => s.current_stage === 'active').length;
  const graduatedStartups = startups.filter(s => s.current_stage === 'graduated').length;
  const totalMentors = new Set(startups.flatMap(s => s.mentor_assignments?.map(m => m.mentor_id) || [])).size;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-morphism border-border/50">
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

        <Card className="glass-morphism border-border/50">
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

        <Card className="glass-morphism border-border/50">
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

        <Card className="glass-morphism border-border/50">
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
              className="glass-morphism border-border/50 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer group"
              onClick={() => onViewStartup(startup)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={startup.company?.logo_url || undefined} />
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-lg">
                      {startup.company?.name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg group-hover:text-emerald-400 transition-colors">
                      {startup.company?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {startup.company?.industry || 'Technology'}
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
                  {startup.company?.description || 'No description available'}
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
        <Card className="glass-morphism border-border/50">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {filteredStartups.map((startup) => (
                <div 
                  key={startup.id}
                  className="flex items-center gap-4 p-4 hover:bg-background/50 cursor-pointer transition-colors"
                  onClick={() => onViewStartup(startup)}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={startup.company?.logo_url || undefined} />
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                      {startup.company?.name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium">{startup.company?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {startup.company?.industry || 'Technology'}
                    </p>
                  </div>
                  <Badge className={getStageColor(startup.current_stage)}>
                    {startup.current_stage}
                  </Badge>
                  <Badge variant="outline">{getCohortName(startup.cohort_id)}</Badge>
                  <div className="w-32">
                    <Progress value={startup.progress_percentage} className="h-2" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredStartups.length === 0 && (
        <Card className="glass-morphism border-border/50">
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
