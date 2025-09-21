import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, TrendingUp, Building, PieChart, Target, Users, Filter, Search } from 'lucide-react';
import companyLogo from '@/assets/company-logo.png';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';

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
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInvestments();
      fetchOpportunities();
    }
  }, [user]);

  const fetchInvestments = async () => {
    // For demo purposes, we'll use companies table as investments
    const { data, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        description,
        stage,
        industry,
        funding_amount,
        user_id
      `)
      .not('funding_amount', 'is', null)
      .limit(6);

    if (!error && data) {
      setInvestments(data);
    }
  };

  const fetchOpportunities = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        description,
        stage,
        industry,
        funding_amount,
        user_id
      `)
      .limit(8);

    if (!error && data) {
      setOpportunities(data);
    }
  };

  const stats = [
    { title: 'Portfolio Value', value: '$12.4M', icon: DollarSign, color: 'text-green-500' },
    { title: 'Active Investments', value: '23', icon: Building, color: 'text-primary' },
    { title: 'ROI', value: '24.7%', icon: TrendingUp, color: 'text-accent' },
    { title: 'Due Diligence', value: '8', icon: Target, color: 'text-yellow-500' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
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
                        <Button variant="outline" size="sm">
                          Due Diligence
                        </Button>
                        <Button size="sm" className="pulse-primary">
                          Invest
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                    <span>Portfolio Distribution</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="font-medium">Technology</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-primary/20 rounded-full">
                          <div className="w-12 h-2 bg-primary rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <span className="font-medium">Healthcare</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-accent/20 rounded-full">
                          <div className="w-4 h-2 bg-accent rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <span className="font-medium">Fintech</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-green-500/20 rounded-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-sm font-medium">10%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-accent" />
                    <span>Investment Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-foreground">TechStart AI</span>
                        <span className="text-green-500 font-bold">+340%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Series B → IPO Pipeline</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-foreground">GreenTech Solutions</span>
                        <span className="text-primary font-bold">+180%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Seed → Series A</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-foreground">DataFlow Pro</span>
                        <span className="text-accent font-bold">+95%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Pre-seed → Seed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}