import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DollarSign,
  ChevronRight,
  GraduationCap,
  Building2,
  MoreVertical,
  Trash2,
  Award,
  ExternalLink,
  Trophy,
  Sparkles,
  Target,
  Plus
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
  notes?: string | null;
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

interface AlumniPortfolioProps {
  startups: CohortStartup[];
  cohorts: Cohort[];
  totalFundingRaised?: number;
  onViewStartup: (startup: CohortStartup) => void;
  onDeleteStartup?: (startupId: string) => Promise<void>;
  onAddAlumni?: () => void;
}

export const AlumniPortfolio = ({
  startups,
  cohorts,
  totalFundingRaised = 0,
  onViewStartup,
  onDeleteStartup,
  onAddAlumni
}: AlumniPortfolioProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [startupToDelete, setStartupToDelete] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'directory' | 'investments' | 'success'>('directory');

  // Filter only graduated startups
  const graduatedStartups = startups.filter(s => s.current_stage === 'graduated');

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

  const getStartupWebsite = (startup: CohortStartup) => {
    if (startup.is_manual_entry) return startup.external_company_website;
    return startup.company?.website;
  };

  const getGraduationYear = (startup: CohortStartup) => {
    if (startup.graduation_year) return startup.graduation_year;
    if (startup.graduation_date) return new Date(startup.graduation_date).getFullYear();
    return null;
  };

  // Get unique graduation years
  const graduationYears = [...new Set(graduatedStartups.map(s => getGraduationYear(s)).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));

  const filteredStartups = graduatedStartups.filter(startup => {
    const name = getStartupName(startup);
    const industry = getStartupIndustry(startup);
    const matchesSearch = !searchQuery || 
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCohort = selectedCohort === 'all' || startup.cohort_id === selectedCohort;
    const matchesYear = selectedYear === 'all' || getGraduationYear(startup)?.toString() === selectedYear;
    return matchesSearch && matchesCohort && matchesYear;
  });

  const getCohortName = (cohortId: string) => {
    return cohorts.find(c => c.id === cohortId)?.name || 'Unknown';
  };

  // Calculate stats
  const totalAlumni = graduatedStartups.length;
  const totalInvestment = graduatedStartups.reduce((sum, s) => sum + (s.funding_received || 0), 0);
  const totalEquity = graduatedStartups.reduce((sum, s) => sum + (s.equity_given || 0), 0) / Math.max(graduatedStartups.length, 1);
  
  // Estimate ROI (simplified - funding received vs invested)
  const estimatedROI = totalInvestment > 0 ? ((totalFundingRaised / totalInvestment - 1) * 100) : 0;

  // Success stories - companies with high funding
  const successStories = graduatedStartups
    .filter(s => (s.company?.funding_amount || 0) > 1000000)
    .sort((a, b) => (b.company?.funding_amount || 0) - (a.company?.funding_amount || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header with Add Alumni Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Alumni Portfolio</h2>
            <p className="text-xs text-muted-foreground">Track graduated companies and investments</p>
          </div>
        </div>
        {onAddAlumni && (
          <Button onClick={onAddAlumni} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Alumni
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAlumni}</p>
                <p className="text-sm text-muted-foreground">Total Alumni</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${(totalInvestment / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-muted-foreground">Total Invested</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEquity.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Avg Equity</p>
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
                <p className="text-2xl font-bold text-emerald-500">
                  {estimatedROI > 0 ? '+' : ''}{estimatedROI.toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">Est. ROI</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="directory" className="gap-2">
            <Building2 className="h-4 w-4" />
            Alumni Directory
          </TabsTrigger>
          <TabsTrigger value="investments" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Investments
          </TabsTrigger>
          <TabsTrigger value="success" className="gap-2">
            <Trophy className="h-4 w-4" />
            Success Stories
          </TabsTrigger>
        </TabsList>

        {/* Alumni Directory */}
        <TabsContent value="directory" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search alumni..."
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
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {graduationYears.map((year) => (
                    <SelectItem key={year} value={year?.toString() || ''}>
                      {year}
                    </SelectItem>
                  ))}
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

          {/* Alumni Grid/List */}
          {filteredStartups.length === 0 ? (
            <Card className="tech-card border-0">
              <CardContent className="p-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold mb-2">No Alumni Yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Add graduated companies to track their post-graduation success
                </p>
                {onAddAlumni && (
                  <Button onClick={onAddAlumni} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Alumni
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
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
                          <Trash2 className="h-4 w-4 mr-2" /> Remove from Alumni
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={getStartupLogo(startup) || undefined} />
                        <AvatarFallback className="bg-purple-500/20 text-purple-400 text-lg">
                          {getStartupName(startup)?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg group-hover:text-purple-400 transition-colors">
                            {getStartupName(startup)}
                          </h3>
                          {getStartupWebsite(startup) && (
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {getStartupIndustry(startup)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {getGraduationYear(startup) || 'Alumni'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getCohortName(startup.cohort_id)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Investment Info */}
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Investment</span>
                        <span className="font-medium text-emerald-400">
                          ${((startup.funding_received || 0) / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Equity</span>
                        <span className="font-medium">
                          {startup.equity_given || 0}%
                        </span>
                      </div>
                      {startup.company?.funding_amount && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Raised</span>
                          <span className="font-medium text-blue-400">
                            ${((startup.company.funding_amount) / 1000000).toFixed(1)}M
                          </span>
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
                        <AvatarFallback className="bg-purple-500/20 text-purple-400">
                          {getStartupName(startup)?.charAt(0) || 'A'}
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
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        {getGraduationYear(startup) || 'Alumni'}
                      </Badge>
                      <Badge variant="outline">{getCohortName(startup.cohort_id)}</Badge>
                      <div className="text-right hidden sm:block">
                        <p className="font-medium text-emerald-400">${((startup.funding_received || 0) / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-muted-foreground">{startup.equity_given || 0}% equity</p>
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
        </TabsContent>

        {/* Investment Tracking */}
        <TabsContent value="investments" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Investment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredStartups.map((startup) => (
                  <div key={startup.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={getStartupLogo(startup) || undefined} />
                      <AvatarFallback className="bg-purple-500/20 text-purple-400">
                        {getStartupName(startup)?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">{getStartupName(startup)}</h4>
                      <p className="text-xs text-muted-foreground">{getStartupIndustry(startup)} • {getGraduationYear(startup)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">${((startup.funding_received || 0) / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-muted-foreground">Invested</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{startup.equity_given || 0}%</p>
                      <p className="text-xs text-muted-foreground">Equity</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-blue-400">
                        ${((startup.company?.funding_amount || 0) / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs text-muted-foreground">Total Raised</p>
                    </div>
                    <div className="text-center">
                      {(startup.company?.funding_amount || 0) > (startup.funding_received || 0) * 2 ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Growing
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Stable
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Success Stories */}
        <TabsContent value="success" className="space-y-4">
          {successStories.length === 0 ? (
            <Card className="tech-card border-0">
              <CardContent className="p-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold mb-2">No Success Stories Yet</h3>
                <p className="text-muted-foreground text-sm">
                  Success stories will appear when alumni raise over $1M
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {successStories.map((startup, index) => (
                <Card key={startup.id} className="tech-card border-0 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {index === 0 && (
                        <div className="absolute -top-2 -right-2 w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                          <Trophy className="h-6 w-6 text-amber-500" />
                        </div>
                      )}
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={getStartupLogo(startup) || undefined} />
                        <AvatarFallback className="bg-purple-500/20 text-purple-400 text-xl">
                          {getStartupName(startup)?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{getStartupName(startup)}</h3>
                        <p className="text-sm text-muted-foreground">{getStartupIndustry(startup)}</p>
                        <Badge className="mt-1 bg-purple-500/20 text-purple-400 border-purple-500/30">
                          Class of {getGraduationYear(startup)}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-400">
                          ${((startup.company?.funding_amount || 0) / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-muted-foreground">Total Raised</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">
                          ${((startup.funding_received || 0) / 1000).toFixed(0)}K
                        </p>
                        <p className="text-xs text-muted-foreground">Our Investment</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-400">
                          {startup.equity_given || 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">Equity</p>
                      </div>
                    </div>
                    {startup.notes && (
                      <p className="mt-4 text-sm text-muted-foreground italic">
                        "{startup.notes}"
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="tech-card border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Alumni?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the company from your alumni portfolio. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AlumniPortfolio;
