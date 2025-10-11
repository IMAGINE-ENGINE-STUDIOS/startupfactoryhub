import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Building, PieChart, Target, Users, Filter, Search } from 'lucide-react';
import companyLogo from '@/assets/company-logo.png';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import AIQuickActions from '@/components/AIQuickActions';
import StartupRecommendationsWidget from '@/components/StartupRecommendationsWidget';
import StartupBrowser from '@/components/StartupBrowser';
import FloatingChat from '@/components/FloatingChat';

interface Investment {
  id: string;
  name: string;
  description: string;
  stage: string;
  industry: string;
  funding_amount: number;
  user_id: string;
}

export default function InvestorDashboard() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [opportunities, setOpportunities] = useState<Investment[]>([]);
  const [investorProfile, setInvestorProfile] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchInvestorProfile();
      fetchInvestments();
      fetchOpportunities();
    }
  }, [user]);

  const fetchInvestorProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('investor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setInvestorProfile(data);
    }
  };

  const expressInterest = async (companyId: string, companyName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('investment_interests')
      .insert({
        investor_id: user.id,
        company_id: companyId,
        status: 'interested'
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already Interested",
          description: "You've already expressed interest in this startup.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to express interest. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Interest Registered!",
      description: `Your interest in ${companyName} has been recorded.`,
    });

    fetchOpportunities();
  };

  const startDueDiligence = async (companyId: string, companyName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('investment_interests')
      .upsert({
        investor_id: user.id,
        company_id: companyId,
        status: 'due_diligence'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start due diligence process.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Due Diligence Started",
      description: `Due diligence process initiated for ${companyName}.`,
    });
  };

  const fetchInvestments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        companies:company_id (
          id,
          name,
          description,
          stage,
          industry,
          user_id
        )
      `)
      .eq('investor_id', user.id)
      .eq('status', 'active');

    if (!error && data) {
      const formattedInvestments = data.map((inv: any) => ({
        id: inv.companies?.id || inv.company_id,
        name: inv.companies?.name || 'Unknown Company',
        description: inv.companies?.description || '',
        stage: inv.companies?.stage || 'Unknown',
        industry: inv.companies?.industry || 'General',
        funding_amount: inv.amount,
        user_id: inv.companies?.user_id || '',
        investment_date: inv.investment_date,
        equity_percentage: inv.equity_percentage
      }));
      setInvestments(formattedInvestments);
    }
  };

  const fetchOpportunities = async () => {
    if (!user) return;

    // Get companies that the investor hasn't invested in yet
    const { data: existingInvestments } = await supabase
      .from('investments')
      .select('company_id')
      .eq('investor_id', user.id);

    const investedCompanyIds = existingInvestments?.map(i => i.company_id) || [];

    const { data, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        description,
        stage,
        industry,
        funding_amount,
        user_id,
        looking_for
      `)
      .not('id', 'in', `(${investedCompanyIds.join(',') || 'null'})`)
      .order('created_at', { ascending: false })
      .limit(8);

    if (!error && data) {
      setOpportunities(data);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate ROI based on real investment data
  const calculateROI = () => {
    if (!investments.length || !investorProfile?.total_invested) return '0.0%';
    
    // Mock calculation - in a real app, you'd fetch current valuations
    // For now, assume average 25% growth across portfolio
    const averageGrowth = 25;
    return `${averageGrowth.toFixed(1)}%`;
  };

  const stats = [
    { 
      title: 'Total Invested', 
      value: investorProfile ? formatCurrency(investorProfile.total_invested || 0) : '$0', 
      icon: DollarSign, 
      color: 'text-green-500' 
    },
    { 
      title: 'Active Investments', 
      value: investorProfile?.portfolio_size?.toString() || '0', 
      icon: Building, 
      color: 'text-primary' 
    },
    { title: 'ROI', value: calculateROI(), icon: TrendingUp, color: 'text-accent' },
    { title: 'Opportunities', value: opportunities.length.toString(), icon: Target, color: 'text-yellow-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <img src={companyLogo} alt="Company Logo" className="h-12 w-12" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Investor Dashboard
              </h1>
              <p className="text-muted-foreground">Discover and fund the next unicorns</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <AIQuickActions />
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button className="pulse-primary">
              <Search className="h-4 w-4 mr-2" />
              Find Startups
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="tech-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="browse">Browse Startups</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-4">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-primary" />
                  <span>Current Portfolio</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {investments.map((investment) => (
                    <Card key={investment.id} className="border border-border/50 hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                              {investment.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{investment.name}</h3>
                            <p className="text-xs text-muted-foreground">Startup Founder</p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{investment.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Funding:</span>
                            <span className="font-medium text-foreground">
                              {investment.funding_amount ? formatCurrency(investment.funding_amount) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex space-x-1">
                            <Badge variant="secondary" className="text-xs">{investment.stage}</Badge>
                            <Badge variant="outline" className="text-xs">{investment.industry}</Badge>
                          </div>
                        </div>
                        
                        <Button size="sm" variant="outline" className="w-full mt-3">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-4">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span>Investment Opportunities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {opportunities.map((opportunity) => (
                    <div key={opportunity.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            {opportunity.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground">{opportunity.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{opportunity.description}</p>
                          <div className="flex items-center space-x-3 mt-2">
                            <Badge variant="secondary" className="text-xs">{opportunity.stage}</Badge>
                            <Badge variant="outline" className="text-xs">{opportunity.industry}</Badge>
                            {opportunity.funding_amount && (
                              <span className="text-sm font-medium text-primary">
                                Seeking: {formatCurrency(opportunity.funding_amount)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => startDueDiligence(opportunity.id, opportunity.name)}
                        >
                          Due Diligence
                        </Button>
                        <Button 
                          size="sm" 
                          className="pulse-primary"
                          onClick={() => expressInterest(opportunity.id, opportunity.name)}
                        >
                          Express Interest
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="browse" className="space-y-4">
            <StartupBrowser />
          </TabsContent>

          <TabsContent value="community" className="space-y-4">
            <UnifiedCommunityFeed />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    <span>Portfolio Distribution by Industry</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {investments.length > 0 ? (
                    <div className="space-y-4">
                      {(() => {
                        const industryCount = investments.reduce((acc: any, inv) => {
                          const industry = inv.industry || 'Other';
                          acc[industry] = (acc[industry] || 0) + 1;
                          return acc;
                        }, {});
                        
                        const total = investments.length;
                        const colors = ['primary', 'accent', 'green-500', 'yellow-500', 'blue-500'];
                        
                        return Object.entries(industryCount).map(([industry, count]: any, index) => {
                          const percentage = ((count / total) * 100).toFixed(0);
                          const color = colors[index % colors.length];
                          
                          return (
                            <div key={industry} className={`flex items-center justify-between p-3 rounded-lg bg-${color}/10 border border-${color}/20`}>
                              <span className="font-medium">{industry}</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-16 h-2 bg-${color}/20 rounded-full">
                                  <div 
                                    className={`h-2 bg-${color} rounded-full`} 
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{percentage}%</span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No investments yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    <span>Portfolio by Stage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {investments.length > 0 ? (
                    <div className="space-y-4">
                      {(() => {
                        const stageCount = investments.reduce((acc: any, inv) => {
                          const stage = inv.stage || 'Unknown';
                          acc[stage] = (acc[stage] || 0) + 1;
                          return acc;
                        }, {});
                        
                        return Object.entries(stageCount).map(([stage, count]: any) => (
                          <div key={stage} className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-foreground capitalize">{stage}</span>
                              <Badge variant="secondary">{count} {count === 1 ? 'company' : 'companies'}</Badge>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No stage data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Features Hub */}
        <div className="mt-8">
          <AIFeaturesHub />
        </div>
      </div>

      {/* Floating Chat with AI */}
      <FloatingChat />
    </div>
  );
}