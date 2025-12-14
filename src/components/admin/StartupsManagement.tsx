import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Search, 
  Eye, 
  Star, 
  Building2,
  RefreshCw,
  Globe,
  DollarSign,
  Users,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  BarChart3,
  FileText,
  Rocket
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import ProfilePostsMosaic from '@/components/ProfilePostsMosaic';

interface Company {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  stage: string | null;
  location: string | null;
  logo_url: string | null;
  website: string | null;
  funding_amount: number | null;
  team_size: number | null;
  founded_year: number | null;
  created_at: string;
  user_id: string;
  pitch_deck_url: string | null;
  looking_for: string[] | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
  journey_progress?: {
    completed_steps: number;
    total_steps: number;
    current_step: number;
    percentage: number;
  };
}

interface RoadmapProgress {
  user_id: string;
  step_id: string;
  completed: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  idea: '#6b7280',
  mvp: '#3b82f6',
  seed: '#22c55e',
  series_a: '#f59e0b',
  series_b: '#a855f7',
  series_c: '#06b6d4',
  growth: '#10b981'
};

const JOURNEY_STEPS = [
  'Company Profile',
  'Pitch Deck',
  'Team Building',
  'Market Research',
  'Product Development',
  'Funding Ready'
];

const StartupsManagement = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogTab, setDialogTab] = useState('overview');
  const isMounted = useRef(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    fetchCompanies();

    // Real-time subscription
    const channel = supabase
      .channel('companies-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          if (isMounted.current) fetchCompanies();
        }, 100);
      })
      .subscribe();

    return () => {
      isMounted.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCompanies = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*, profiles:user_id(full_name, email)')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      // Fetch roadmap progress for all users
      const { data: progressData, error: progressError } = await supabase
        .from('roadmap_progress')
        .select('*');

      if (progressError) throw progressError;

      // Map progress to companies - group by user_id
      const progressMap = new Map<string, RoadmapProgress[]>();
      (progressData || []).forEach((p: any) => {
        const existing = progressMap.get(p.user_id) || [];
        existing.push(p);
        progressMap.set(p.user_id, existing);
      });

      const companiesWithProgress = (companiesData || []).map((company: any) => {
        const progressRecords = progressMap.get(company.user_id) || [];
        const completedSteps = progressRecords.filter(p => p.completed).length;
        
        // Find first incomplete step for current_step
        let current_step = 1;
        for (let i = 1; i <= 6; i++) {
          const stepRecord = progressRecords.find(p => p.step_id === `step_${i}`);
          if (!stepRecord || !stepRecord.completed) {
            current_step = i;
            break;
          }
          if (i === 6) current_step = 6;
        }

        return {
          ...company,
          journey_progress: {
            completed_steps: completedSteps,
            total_steps: 6,
            current_step,
            percentage: Math.round((completedSteps / 6) * 100)
          }
        };
      });

      if (isMounted.current) {
        setCompanies(companiesWithProgress);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive"
      });
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const getStageBadgeColor = (stage: string | null) => {
    const colors: Record<string, string> = {
      idea: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      mvp: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      seed: 'bg-green-500/20 text-green-400 border-green-500/30',
      series_a: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      series_b: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      series_c: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      growth: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    };
    return colors[stage || ''] || 'bg-muted text-muted-foreground';
  };

  const getJourneyBadge = (progress: Company['journey_progress']) => {
    if (!progress) return <Badge variant="outline" className="bg-muted">Not Started</Badge>;
    
    if (progress.completed_steps === 6) {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">✓ Complete</Badge>;
    }
    if (progress.completed_steps === 0) {
      return <Badge variant="outline" className="bg-gray-500/20 text-gray-400">Not Started</Badge>;
    }
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
        {progress.completed_steps}/6 Steps
      </Badge>
    );
  };

  const formatFunding = (amount: number | null) => {
    if (!amount) return 'N/A';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  // Analytics data
  const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];
  const stages = [...new Set(companies.map(c => c.stage).filter(Boolean))];
  const locations = [...new Set(companies.map(c => c.location).filter(Boolean))];

  // Stage distribution
  const stageData = stages.map(stage => ({
    name: stage,
    value: companies.filter(c => c.stage === stage).length,
    color: STAGE_COLORS[stage || ''] || '#6b7280'
  }));

  // Industry distribution (top 6)
  const industryData = industries
    .map(industry => ({
      name: industry,
      count: companies.filter(c => c.industry === industry).length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Location distribution (top 6)
  const locationData = locations
    .map(location => ({
      name: location?.split(',')[0] || location,
      count: companies.filter(c => c.location === location).length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Journey progress distribution
  const journeyCompleted = companies.filter(c => c.journey_progress?.completed_steps === 6).length;
  const journeyInProgress = companies.filter(c => 
    c.journey_progress && c.journey_progress.completed_steps > 0 && c.journey_progress.completed_steps < 6
  ).length;
  const journeyNotStarted = companies.filter(c => !c.journey_progress || c.journey_progress.completed_steps === 0).length;

  const journeyData = [
    { name: 'Completed', value: journeyCompleted, color: '#10b981' },
    { name: 'In Progress', value: journeyInProgress, color: '#f59e0b' },
    { name: 'Not Started', value: journeyNotStarted, color: '#6b7280' }
  ];

  // Journey step breakdown
  const stepBreakdown = JOURNEY_STEPS.map((step, i) => {
    const count = companies.filter(c => c.journey_progress?.current_step === i + 1).length;
    return { name: `Step ${i + 1}`, count, label: step };
  });

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = !searchQuery || 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'all' || c.stage === stageFilter;
    const matchesIndustry = industryFilter === 'all' || c.industry === industryFilter;
    return matchesSearch && matchesStage && matchesIndustry;
  });

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setDialogTab('overview');
    setShowDialog(true);
  };

  const handleFeatureCompany = async (company: Company) => {
    toast({
      title: "Featured",
      description: `${company.name} has been featured on the platform.`
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Building2 className="h-5 w-5 text-blue-400 mb-2" />
            <p className="text-2xl font-bold">{companies.length}</p>
            <p className="text-xs text-muted-foreground">Total Companies</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-green-400 mb-2" />
            <p className="text-2xl font-bold">
              {formatFunding(companies.reduce((sum, c) => sum + (c.funding_amount || 0), 0))}
            </p>
            <p className="text-xs text-muted-foreground">Total Funding</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Users className="h-5 w-5 text-purple-400 mb-2" />
            <p className="text-2xl font-bold">
              {companies.reduce((sum, c) => sum + (c.team_size || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Team Members</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Globe className="h-5 w-5 text-cyan-400 mb-2" />
            <p className="text-2xl font-bold">{industries.length}</p>
            <p className="text-xs text-muted-foreground">Industries</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mb-2" />
            <p className="text-2xl font-bold">{journeyCompleted}</p>
            <p className="text-xs text-muted-foreground">Journey Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Demographics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stage Distribution */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              By Stage
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[180px]">
            {stageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No stage data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Industry Distribution */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              By Industry
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[180px]">
            {industryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No industry data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Distribution */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              By Location
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[180px]">
            {locationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10 }} />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No location data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Journey Progress */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Journey Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={journeyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {journeyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Journey Step Breakdown */}
      <Card className="tech-card border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Startups by Current Journey Step</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {stepBreakdown.map((step, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-xl font-bold">{step.count}</p>
                <p className="text-xs text-muted-foreground">{step.name}</p>
                <p className="text-[10px] text-muted-foreground/70 truncate">{step.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="tech-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 tech-card border-0"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[150px] tech-card border-0">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map(stage => (
                  <SelectItem key={stage} value={stage || ''}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[150px] tech-card border-0">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry || ''}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchCompanies} className="tech-card border-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Companies ({filteredCompanies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Journey</TableHead>
                  <TableHead>Funding</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="cursor-pointer hover:bg-muted/30" onClick={() => handleViewCompany(company)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={company.logo_url || ''} />
                          <AvatarFallback>{company.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-xs text-muted-foreground">{company.location || 'No location'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{company.industry || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStageBadgeColor(company.stage)}>
                        {company.stage || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getJourneyBadge(company.journey_progress)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatFunding(company.funding_amount)}
                    </TableCell>
                    <TableCell>{company.team_size || 1}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(company.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewCompany(company)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFeatureCompany(company)}>
                            <Star className="h-4 w-4 mr-2" />
                            Feature Company
                          </DropdownMenuItem>
                          {company.website && (
                            <DropdownMenuItem onClick={() => window.open(company.website!, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit Website
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Enhanced Company Detail Dialog with Tabs */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="tech-card border-0 !transition-none max-w-2xl max-h-[85vh]">
          <DialogHeader>
            {selectedCompany && (
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedCompany.logo_url || ''} />
                  <AvatarFallback className="text-xl">{selectedCompany.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-xl">{selectedCompany.name}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{selectedCompany.industry || 'N/A'}</Badge>
                    <Badge variant="outline" className={getStageBadgeColor(selectedCompany.stage)}>
                      {selectedCompany.stage || 'Unknown'}
                    </Badge>
                    {getJourneyBadge(selectedCompany.journey_progress)}
                  </div>
                </div>
              </div>
            )}
          </DialogHeader>

          {selectedCompany && (
            <Tabs value={dialogTab} onValueChange={setDialogTab} className="mt-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="journey">Journey</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[400px] mt-4">
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="tech-card border-0">
                      <CardContent className="p-4 text-center">
                        <DollarSign className="h-5 w-5 mx-auto text-green-400 mb-1" />
                        <p className="text-lg font-bold">{formatFunding(selectedCompany.funding_amount)}</p>
                        <p className="text-xs text-muted-foreground">Funding Raised</p>
                      </CardContent>
                    </Card>
                    <Card className="tech-card border-0">
                      <CardContent className="p-4 text-center">
                        <Users className="h-5 w-5 mx-auto text-purple-400 mb-1" />
                        <p className="text-lg font-bold">{selectedCompany.team_size || 1}</p>
                        <p className="text-xs text-muted-foreground">Team Members</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedCompany.description || 'No description provided'}
                    </p>
                  </div>

                  {selectedCompany.looking_for && selectedCompany.looking_for.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Looking For</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCompany.looking_for.map((item, i) => (
                          <Badge key={i} variant="secondary">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{selectedCompany.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Founded</p>
                      <p className="font-medium">{selectedCompany.founded_year || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      {selectedCompany.website ? (
                        <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" 
                          className="font-medium text-primary hover:underline flex items-center gap-1">
                          Visit Site <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="font-medium">N/A</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Owner</p>
                      <p className="font-medium">
                        {selectedCompany.profiles?.full_name || selectedCompany.profiles?.email || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Joined Platform</p>
                      <p className="font-medium">{format(new Date(selectedCompany.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>

                  {selectedCompany.pitch_deck_url && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Pitch Deck</h4>
                      <Button variant="outline" size="sm" onClick={() => window.open(selectedCompany.pitch_deck_url!, '_blank')}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Pitch Deck
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="journey" className="mt-0 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Journey Progress</h4>
                      <span className="text-sm font-bold text-primary">
                        {selectedCompany.journey_progress?.percentage || 0}%
                      </span>
                    </div>
                    <Progress value={selectedCompany.journey_progress?.percentage || 0} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {selectedCompany.journey_progress?.completed_steps || 0} of 6 steps completed
                    </p>
                  </div>

                  <div className="space-y-2">
                    {JOURNEY_STEPS.map((step, i) => {
                      const isCompleted = (selectedCompany.journey_progress?.completed_steps || 0) > i;
                      const isCurrent = selectedCompany.journey_progress?.current_step === i + 1;
                      
                      return (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${
                          isCompleted ? 'bg-emerald-500/10' : isCurrent ? 'bg-amber-500/10' : 'bg-muted/30'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : isCurrent ? (
                            <Clock className="h-5 w-5 text-amber-400" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                          )}
                          <div>
                            <p className={`font-medium ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-amber-400' : 'text-muted-foreground'}`}>
                              Step {i + 1}: {step}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="posts" className="mt-0">
                  <ProfilePostsMosaic userId={selectedCompany.user_id} />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StartupsManagement;