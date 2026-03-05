import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, AreaChart, Area, Legend, ResponsiveContainer } from "recharts";
import { Search, TrendingUp, Users, DollarSign, Briefcase, Building2, Target, ExternalLink, Calendar, Wallet } from "lucide-react";
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
    email: string | null;
  } | null;
}

interface Investment {
  id: string;
  investor_id: string;
  company_id: string | null;
  amount: number | null;
  investment_date: string | null;
  investment_round: string | null;
  notes: string | null;
  external_company_name: string | null;
  external_company_industry: string | null;
  company?: {
    id: string;
    name: string;
    industry: string | null;
    stage: string | null;
    logo_url: string | null;
    description: string | null;
  } | null;
}

// Normalize stage values to consistent keys
const normalizeStage = (stage: string): string => {
  const normalized = stage.toLowerCase().replace(/[\s-]+/g, '_').replace(/\+/g, '');
  const mappings: Record<string, string> = {
    'preseed': 'pre_seed',
    'pre_seed': 'pre_seed',
    'seed': 'seed',
    'seriesa': 'series_a',
    'series_a': 'series_a',
    'seriesb': 'series_b',
    'series_b': 'series_b',
    'seriesc': 'series_c',
    'series_c': 'series_c',
    'growth': 'growth',
  };
  return mappings[normalized] || normalized;
};

const STAGE_COLORS: Record<string, string> = {
  'pre_seed': 'hsl(280, 70%, 50%)',
  'seed': 'hsl(200, 70%, 50%)',
  'series_a': 'hsl(150, 70%, 45%)',
  'series_b': 'hsl(45, 80%, 50%)',
  'series_c': 'hsl(15, 80%, 55%)',
  'growth': 'hsl(330, 70%, 50%)',
};

const STAGE_LABELS: Record<string, string> = {
  'pre_seed': 'Pre-Seed',
  'seed': 'Seed',
  'series_a': 'Series A',
  'series_b': 'Series B',
  'series_c': 'Series C+',
  'growth': 'Growth',
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
  const isMounted = useRef(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    fetchData();

    // Real-time subscriptions
    const investorChannel = supabase
      .channel('admin-investors-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investor_profiles' }, () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          if (isMounted.current) fetchData();
        }, 500);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investments' }, () => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          if (isMounted.current) fetchData();
        }, 500);
      })
      .subscribe();

    return () => {
      isMounted.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      supabase.removeChannel(investorChannel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch investor profiles
      const { data: investorData } = await supabase
        .from('investor_profiles')
        .select('*');

      // Fetch profile data separately
      const userIds = investorData?.map(i => i.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, location, email')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      const investorsWithProfiles = investorData?.map(inv => ({
        ...inv,
        profile: profilesMap.get(inv.user_id) || null
      })) || [];

      // Fetch all investments with company data including logo
      const { data: investmentData } = await supabase
        .from('investments')
        .select('id, investor_id, company_id, amount, investment_date, investment_round, notes, external_company_name, external_company_industry, company:companies(id, name, industry, stage, logo_url, description)')
        .order('investment_date', { ascending: false });

      if (isMounted.current) {
        setInvestors(investorsWithProfiles);
        setInvestments((investmentData as any) || []);
      }
    } catch (error) {
      console.error('Error fetching investor data:', error);
    } finally {
      if (isMounted.current) setLoading(false);
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

  // Count INVESTORS by their preferred stages (not investments) - normalize stage values
  const investorsByStageData = (() => {
    const stageCounts: Record<string, number> = {};
    investors.forEach(investor => {
      investor.preferred_stages?.forEach(stage => {
        const normalizedKey = normalizeStage(stage);
        stageCounts[normalizedKey] = (stageCounts[normalizedKey] || 0) + 1;
      });
    });
    return Object.entries(stageCounts)
      .map(([key, value]) => ({ 
        name: STAGE_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), 
        value,
        key 
      }))
      .sort((a, b) => b.value - a.value);
  })();

  // Count INVESTORS by their preferred industries (not investments)
  const investorsByIndustryData = (() => {
    const industryCounts: Record<string, number> = {};
    investors.forEach(investor => {
      investor.preferred_industries?.forEach(industry => {
        industryCounts[industry] = (industryCounts[industry] || 0) + 1;
      });
    });
    return Object.entries(industryCounts)
      .map(([name, value]) => ({ 
        name: getIndustryLabel(name), 
        value,
        key: name 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  })();

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
    
    // Fetch this investor's investments with full company data
    const { data } = await supabase
      .from('investments')
      .select('id, investor_id, company_id, amount, investment_date, investment_round, notes, external_company_name, external_company_industry, company:companies(id, name, industry, stage, logo_url, description)')
      .eq('investor_id', investor.user_id)
      .order('investment_date', { ascending: false });
    
    setInvestorInvestments((data as any) || []);
  };

  const getCompanyName = (investment: Investment) => {
    if (investment.company?.name) return investment.company.name;
    if (investment.external_company_name) return investment.external_company_name;
    return 'Unknown Company';
  };

  const getCompanyIndustry = (investment: Investment) => {
    if (investment.company?.industry) return getIndustryLabel(investment.company.industry);
    if (investment.external_company_industry) return getIndustryLabel(investment.external_company_industry);
    return null;
  };

  const isExternalCompany = (investment: Investment) => {
    return !investment.company_id && investment.external_company_name;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Investors by Stage */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Investors by Stage</CardTitle>
            <p className="text-xs text-muted-foreground">Count of investors preferring each stage</p>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {investorsByStageData.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={investorsByStageData}
                      dataKey="value"
                      nameKey="name"
                      cx="35%"
                      cy="50%"
                      outerRadius={50}
                      innerRadius={25}
                    >
                      {investorsByStageData.map((entry) => (
                        <Cell 
                          key={entry.key} 
                          fill={STAGE_COLORS[entry.key] || 'hsl(220, 70%, 50%)'} 
                        />
                      ))}
                    </Pie>
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ fontSize: '10px', maxWidth: '45%', paddingLeft: '8px' }}
                      formatter={(value, entry: any) => {
                        const item = investorsByStageData.find(d => d.name === value);
                        const displayName = value.length > 10 ? value.slice(0, 10) + '...' : value;
                        return <span className="text-xs">{displayName} ({item?.value || 0})</span>;
                      }}
                    />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <p className="text-sm font-medium">{payload[0].name}</p>
                              <p className="text-sm text-muted-foreground">{payload[0].value} investors</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                No investor stage preferences
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investors by Industry */}
        <Card className="tech-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Investors by Industry</CardTitle>
            <p className="text-xs text-muted-foreground">Count of investors preferring each industry</p>
          </CardHeader>
          <CardContent className="overflow-hidden">
            {investorsByIndustryData.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={investorsByIndustryData} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 8 }} 
                      width={85}
                      tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <p className="text-sm font-medium">{payload[0].payload.name}</p>
                              <p className="text-sm text-muted-foreground">{payload[0].value} investors</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                No investor industry preferences
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Activity */}
        <Card className="tech-card border-0 md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Investment Activity (12 Months)</CardTitle>
            <p className="text-xs text-muted-foreground">Number of deals per month</p>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ left: 0, right: 10 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 8 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9 }} width={30} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)" 
                  />
                  <ChartTooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="text-sm font-medium">{payload[0].payload.month}</p>
                            <p className="text-sm text-muted-foreground">{payload[0].value} deals</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
                    className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/80 cursor-pointer"
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
                          {investor.profile?.email || 'No email'}
                        </p>
                        <p className="text-xs text-muted-foreground">
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
                          {investor.preferred_stages?.length ? (
                            investor.preferred_stages.slice(0, 2).map(stage => {
                              const key = normalizeStage(stage);
                              return (
                                <Badge key={stage} variant="secondary" className="text-xs">
                                  {STAGE_LABELS[key] || stage.replace(/_/g, ' ')}
                                </Badge>
                              );
                            })
                          ) : <span className="text-muted-foreground">—</span>}
                        </div>
                      </div>
                      <div className="text-right hidden lg:block">
                        <p className="text-muted-foreground">Industries</p>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {investor.preferred_industries?.length ? (
                            investor.preferred_industries.slice(0, 2).map(ind => (
                              <Badge key={ind} variant="outline" className="text-xs">
                                {getIndustryLabel(ind)}
                              </Badge>
                            ))
                          ) : <span className="text-muted-foreground">—</span>}
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
                      {investment.company?.logo_url ? (
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={investment.company.logo_url} />
                          <AvatarFallback>
                            <Building2 className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="p-2 rounded-full bg-primary/10">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{getCompanyName(investment)}</p>
                          {isExternalCompany(investment) && (
                            <Badge variant="outline" className="text-xs">External</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getCompanyIndustry(investment) || 'Industry not set'}
                        </p>
                      </div>
                    </div>
                      <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-medium text-emerald-500">{formatCurrency(investment.amount)}</p>
                        <p className="text-xs text-muted-foreground">{investment.investment_round || 'Round not set'}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-muted-foreground">
                          {investment.investment_date 
                            ? new Date(investment.investment_date).toLocaleDateString()
                            : 'Date not set'
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

      {/* Investor Detail Dialog with Tabs */}
      <Dialog open={!!selectedInvestor} onOpenChange={() => setSelectedInvestor(null)}>
        <DialogContent className="tech-card border-0 !transition-none max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarImage src={selectedInvestor?.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {selectedInvestor?.profile?.full_name?.charAt(0) || 'I'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl">{selectedInvestor?.profile?.full_name || 'Investor Profile'}</p>
                <p className="text-sm font-normal text-muted-foreground">
                  {selectedInvestor?.profile?.email || 'No email'}
                </p>
                <p className="text-xs font-normal text-muted-foreground">
                  {selectedInvestor?.profile?.location || 'Location not set'}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Portfolio ({investorInvestments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="max-h-[calc(90vh-200px)] mt-4">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 pr-4">
                {/* Investment Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-card/50 text-center">
                    <p className="text-2xl font-bold text-primary">{investorInvestments.length}</p>
                    <p className="text-xs text-muted-foreground">Investments</p>
                  </div>
                  <div className="p-3 rounded-lg bg-card/50 text-center">
                    <p className="text-2xl font-bold text-emerald-500">
                      {formatCurrency(investorInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0))}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Invested</p>
                  </div>
                  <div className="p-3 rounded-lg bg-card/50 text-center">
                    <p className="text-2xl font-bold">{selectedInvestor?.portfolio_size || 0}</p>
                    <p className="text-xs text-muted-foreground">Portfolio Size</p>
                  </div>
                  <div className="p-3 rounded-lg bg-card/50 text-center">
                    <p className="text-lg font-bold">
                      {formatRange(selectedInvestor?.investment_range_min || null, selectedInvestor?.investment_range_max || null)}
                    </p>
                    <p className="text-xs text-muted-foreground">Investment Range</p>
                  </div>
                </div>

                {/* Preferred Stages */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Preferred Stages</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedInvestor?.preferred_stages?.length ? (
                      selectedInvestor.preferred_stages.map(stage => {
                        const key = normalizeStage(stage);
                        return (
                          <Badge key={stage} variant="secondary">
                            <Target className="h-3 w-3 mr-1" />
                            {STAGE_LABELS[key] || stage.replace(/_/g, ' ')}
                          </Badge>
                        );
                      })
                    ) : <span className="text-muted-foreground">No stages specified</span>}
                  </div>
                </div>

                {/* Preferred Industries */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Preferred Industries</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedInvestor?.preferred_industries?.length ? (
                      selectedInvestor.preferred_industries.map(ind => (
                        <Badge key={ind} variant="outline">
                          {getIndustryLabel(ind)}
                        </Badge>
                      ))
                    ) : <span className="text-muted-foreground">No industries specified</span>}
                  </div>
                </div>
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio" className="space-y-4 pr-4">
                {investorInvestments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No portfolio companies recorded</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {investorInvestments.map(inv => (
                      <div key={inv.id} className="p-4 rounded-lg bg-card/50 space-y-3">
                        <div className="flex items-start gap-3">
                          {inv.company?.logo_url ? (
                            <Avatar className="h-12 w-12 rounded-lg">
                              <AvatarImage src={inv.company.logo_url} className="object-cover" />
                              <AvatarFallback className="rounded-lg">
                                <Building2 className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{getCompanyName(inv)}</p>
                              {isExternalCompany(inv) && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  <ExternalLink className="h-2.5 w-2.5 mr-1" />
                                  External
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {getCompanyIndustry(inv) && (
                                <Badge variant="secondary" className="text-xs">
                                  {getCompanyIndustry(inv)}
                                </Badge>
                              )}
                              {inv.company?.stage && (
                                <Badge variant="outline" className="text-xs">
                                  {STAGE_LABELS[normalizeStage(inv.company.stage)] || inv.company.stage}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {inv.company?.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {inv.company.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div>
                            <p className="text-lg font-bold text-emerald-500">{formatCurrency(inv.amount)}</p>
                            <p className="text-xs text-muted-foreground">{inv.investment_round || 'Round not set'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              {inv.investment_date 
                                ? new Date(inv.investment_date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    year: 'numeric' 
                                  })
                                : 'Date not set'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-3 pr-4">
                {investorInvestments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No investment history recorded</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {investorInvestments.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                        <div className="flex items-center gap-3">
                          {inv.company?.logo_url ? (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={inv.company.logo_url} />
                              <AvatarFallback>
                                <Building2 className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="p-2 rounded-full bg-primary/10">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{getCompanyName(inv)}</p>
                              {isExternalCompany(inv) && (
                                <Badge variant="outline" className="text-xs">External</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {inv.investment_round || 'Round not set'} • {getCompanyIndustry(inv) || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-500">{formatCurrency(inv.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {inv.investment_date 
                              ? new Date(inv.investment_date).toLocaleDateString()
                              : 'Date not set'
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
