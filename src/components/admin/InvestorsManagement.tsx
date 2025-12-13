import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, AreaChart, Area } from "recharts";
import { Search, TrendingUp, Users, DollarSign, Briefcase, Building2, Target } from "lucide-react";
import { INDUSTRIES, getIndustryLabel } from "@/lib/constants";

interface InvestorProfile {
  id: string;
  user_id: string;
  investment_range_min: number | null;
  investment_range_max: number | null;
  preferred_stages: string[] | null;
  preferred_industries: string[] | null;
  portfolio_size: number | null;
  total_invested: number | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    location: string | null;
  } | null;
}

interface Investment {
  id: string;
  investor_id: string;
  company_id: string;
  amount: number | null;
  investment_date: string | null;
  round_name: string | null;
  company?: {
    name: string;
    industry: string | null;
    stage: string | null;
  } | null;
}

const STAGE_COLORS: Record<string, string> = {
  'pre_seed': 'hsl(var(--chart-1))',
  'seed': 'hsl(var(--chart-2))',
  'series_a': 'hsl(var(--chart-3))',
  'series_b': 'hsl(var(--chart-4))',
  'series_c': 'hsl(var(--chart-5))',
  'growth': 'hsl(var(--primary))',
};

export function InvestorsManagement() {
  const [investors, setInvestors] = useState<InvestorProfile[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [selectedInvestor, setSelectedInvestor] = useState<InvestorProfile | null>(null);
  const [investorInvestments, setInvestorInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch investor profiles with user profile data
      const { data: investorData } = await supabase
        .from('investor_profiles')
        .select('*');

      // Fetch profile data separately to avoid join issues
      const userIds = investorData?.map(i => i.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, location')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const investorsWithProfiles = investorData?.map(inv => ({
        ...inv,
        profile: profilesMap.get(inv.user_id) || null
      })) || [];

      // Fetch all investments with company data
      const { data: investmentData } = await supabase
        .from('investments')
        .select('id, investor_id, company_id, amount, investment_date, round_name, company:companies(name, industry, stage)')
        .order('investment_date', { ascending: false });

      setInvestors(investorsWithProfiles);
      setInvestments((investmentData as any) || []);
    } catch (error) {
      console.error('Error fetching investor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const formatRange = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Not specified';
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  // Calculate stats
  const totalInvestors = investors.length;
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const avgInvestment = investments.length > 0 ? totalInvested / investments.length : 0;
  const totalDeals = investments.length;

  // Prepare chart data
  const stageData = investments.reduce((acc, inv) => {
    const stage = inv.round_name || 'unknown';
    const existing = acc.find(d => d.name === stage);
    if (existing) {
      existing.value += 1;
      existing.amount += inv.amount || 0;
    } else {
      acc.push({ name: stage, value: 1, amount: inv.amount || 0 });
    }
    return acc;
  }, [] as { name: string; value: number; amount: number }[]);

  const industryData = investments.reduce((acc, inv) => {
    const industry = inv.company?.industry || 'other';
    const existing = acc.find(d => d.name === industry);
    if (existing) {
      existing.value += 1;
      existing.amount += inv.amount || 0;
    } else {
      acc.push({ name: industry, value: 1, amount: inv.amount || 0 });
    }
    return acc;
  }, [] as { name: string; value: number; amount: number }[]);

  // Investment activity over time (last 12 months)
  const activityData = (() => {
    const months: { month: string; count: number; amount: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push({ month: monthKey, count: 0, amount: 0 });
    }

    investments.forEach(inv => {
      if (inv.investment_date) {
        const date = new Date(inv.investment_date);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const existing = months.find(m => m.month === monthKey);
        if (existing) {
          existing.count += 1;
          existing.amount += inv.amount || 0;
        }
      }
    });

    return months;
  })();

  // Filter investors
  const filteredInvestors = investors.filter(inv => {
    const matchesSearch = !searchQuery || 
      inv.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || 
      inv.preferred_stages?.includes(stageFilter);
    
    const matchesIndustry = industryFilter === 'all' || 
      inv.preferred_industries?.includes(industryFilter);
    
    return matchesSearch && matchesStage && matchesIndustry;
  });

  const handleViewInvestor = async (investor: InvestorProfile) => {
    setSelectedInvestor(investor);
    
    // Fetch this investor's investments
    const { data } = await supabase
      .from('investments')
      .select('id, investor_id, company_id, amount, investment_date, round_name, company:companies(name, industry, stage)')
      .eq('investor_id', investor.user_id)
      .order('investment_date', { ascending: false });
    
    setInvestorInvestments((data as any) || []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Investors</p>
                <p className="text-2xl font-bold">{totalInvestors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Investment</p>
                <p className="text-2xl font-bold">{formatCurrency(avgInvestment)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Briefcase className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Deals</p>
                <p className="text-2xl font-bold">{totalDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investments by Stage */}
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="text-base">Investments by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            {stageData.length > 0 ? (
              <ChartContainer config={{}} className="h-[200px]">
                <PieChart>
                  <Pie
                    data={stageData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {stageData.map((entry, index) => (
                      <Cell 
                        key={entry.name} 
                        fill={STAGE_COLORS[entry.name] || `hsl(${index * 60}, 70%, 50%)`} 
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No investment data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investments by Industry */}
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="text-base">Investments by Industry</CardTitle>
          </CardHeader>
          <CardContent>
            {industryData.length > 0 ? (
              <ChartContainer config={{}} className="h-[200px]">
                <BarChart data={industryData.slice(0, 6)}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No investment data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Activity */}
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="text-base">Investment Activity (12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[200px]">
              <AreaChart data={activityData}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)" 
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Investor Directory */}
      <Card className="tech-card border-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>Investor Directory</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search investors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-[200px]"
                />
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                  <SelectItem value="seed">Seed</SelectItem>
                  <SelectItem value="series_a">Series A</SelectItem>
                  <SelectItem value="series_b">Series B</SelectItem>
                  <SelectItem value="series_c">Series C+</SelectItem>
                </SelectContent>
              </Select>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {INDUSTRIES.map(ind => (
                    <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredInvestors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No investors found
                </div>
              ) : (
                filteredInvestors.map((investor) => (
                  <div
                    key={investor.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/80 cursor-pointer transition-colors"
                    onClick={() => handleViewInvestor(investor)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={investor.profile?.avatar_url || undefined} />
                        <AvatarFallback>
                          {investor.profile?.full_name?.charAt(0) || 'I'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{investor.profile?.full_name || 'Unknown Investor'}</p>
                        <p className="text-sm text-muted-foreground">
                          {investor.profile?.location || 'Location not set'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-muted-foreground">Investment Range</p>
                        <p className="font-medium">
                          {formatRange(investor.investment_range_min, investor.investment_range_max)}
                        </p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-muted-foreground">Preferred Stages</p>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {investor.preferred_stages?.slice(0, 2).map(stage => (
                            <Badge key={stage} variant="secondary" className="text-xs">
                              {stage.replace('_', ' ')}
                            </Badge>
                          )) || <span className="text-muted-foreground">—</span>}
                        </div>
                      </div>
                      <div className="text-right hidden lg:block">
                        <p className="text-muted-foreground">Industries</p>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {investor.preferred_industries?.slice(0, 2).map(ind => (
                            <Badge key={ind} variant="outline" className="text-xs">
                              {getIndustryLabel(ind)}
                            </Badge>
                          )) || <span className="text-muted-foreground">—</span>}
                        </div>
                      </div>
                      <div className="text-right hidden xl:block">
                        <p className="text-muted-foreground">Portfolio</p>
                        <p className="font-medium">{investor.portfolio_size || 0} companies</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Investments Table */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle>Recent Investments</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {investments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No investments recorded
                </div>
              ) : (
                investments.slice(0, 20).map((investment) => (
                  <div
                    key={investment.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{investment.company?.name || 'Unknown Company'}</p>
                        <p className="text-xs text-muted-foreground">
                          {investment.company?.industry ? getIndustryLabel(investment.company.industry) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-medium text-emerald-500">{formatCurrency(investment.amount)}</p>
                        <p className="text-xs text-muted-foreground">{investment.round_name || 'Unknown round'}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-muted-foreground">
                          {investment.investment_date 
                            ? new Date(investment.investment_date).toLocaleDateString()
                            : 'Date unknown'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Investor Detail Dialog */}
      <Dialog open={!!selectedInvestor} onOpenChange={() => setSelectedInvestor(null)}>
        <DialogContent className="tech-card border-0 !transition-none max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedInvestor?.profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {selectedInvestor?.profile?.full_name?.charAt(0) || 'I'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>{selectedInvestor?.profile?.full_name || 'Investor Profile'}</p>
                <p className="text-sm font-normal text-muted-foreground">
                  {selectedInvestor?.profile?.location || 'Location not set'}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Investment Preferences */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-card/50">
                <p className="text-sm text-muted-foreground mb-1">Investment Range</p>
                <p className="font-medium">
                  {formatRange(selectedInvestor?.investment_range_min || null, selectedInvestor?.investment_range_max || null)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card/50">
                <p className="text-sm text-muted-foreground mb-1">Portfolio Size</p>
                <p className="font-medium">{selectedInvestor?.portfolio_size || 0} companies</p>
              </div>
            </div>

            {/* Preferred Stages */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Preferred Stages</p>
              <div className="flex flex-wrap gap-2">
                {selectedInvestor?.preferred_stages?.map(stage => (
                  <Badge key={stage} variant="secondary">
                    <Target className="h-3 w-3 mr-1" />
                    {stage.replace('_', ' ')}
                  </Badge>
                )) || <span className="text-muted-foreground">Not specified</span>}
              </div>
            </div>

            {/* Preferred Industries */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Preferred Industries</p>
              <div className="flex flex-wrap gap-2">
                {selectedInvestor?.preferred_industries?.map(ind => (
                  <Badge key={ind} variant="outline">
                    {getIndustryLabel(ind)}
                  </Badge>
                )) || <span className="text-muted-foreground">Not specified</span>}
              </div>
            </div>

            {/* Investments History */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Investment History ({investorInvestments.length})</p>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {investorInvestments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No recorded investments</p>
                  ) : (
                    investorInvestments.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-card/30">
                        <div>
                          <p className="font-medium">{inv.company?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {inv.round_name} • {inv.company?.industry ? getIndustryLabel(inv.company.industry) : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-emerald-500">{formatCurrency(inv.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {inv.investment_date ? new Date(inv.investment_date).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
