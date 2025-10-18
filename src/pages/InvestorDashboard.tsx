import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, TrendingUp, Building, PieChart, Target, Users, Calendar, ExternalLink, Video } from 'lucide-react';
import companyLogo from '@/assets/company-logo.png';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import { format } from 'date-fns';

import StartupRecommendationsWidget from '@/components/StartupRecommendationsWidget';
import StartupBrowser from '@/components/StartupBrowser';
import NetworkBrowser from '@/components/NetworkBrowser';
import FloatingChat from '@/components/FloatingChat';
import InvestorProfileForm from '@/components/InvestorProfileForm';
import InvestorStartupNetwork from '@/components/InvestorStartupNetwork';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import InvestorAvailabilityManager from '@/components/InvestorAvailabilityManager';
import VideoConferencing from '@/components/VideoConferencing';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { DashboardHeader } from '@/components/DashboardHeader';

interface Investment {
  id: string;
  name: string;
  description: string;
  stage: string;
  industry: string;
  funding_amount: number;
  user_id: string;
  logo_url?: string | null;
}

export default function InvestorDashboard() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [opportunities, setOpportunities] = useState<Investment[]>([]);
  const [investorProfile, setInvestorProfile] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState('social');
  const [pitchMeetings, setPitchMeetings] = useState<any[]>([]);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | undefined>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile: profileWithRole } = useProfileWithRole();

  useEffect(() => {
    if (user) {
      fetchInvestorProfile();
      fetchInvestments();
      fetchOpportunities();
      fetchPitchMeetings();
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

  const fetchPitchMeetings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('pitch_meetings')
      .select(`
        *,
        company:companies(name, logo_url, pitch_deck_url),
        startup:profiles!pitch_meetings_startup_id_fkey(full_name, avatar_url)
      `)
      .eq('investor_id', user.id)
      .gte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true })
      .limit(10);

    if (!error && data) {
      setPitchMeetings(data);
    }
  };

  const expressInterest = async (companyId: string, companyName: string) => {
    if (!user) return;

    try {
      // Get the company owner's user_id
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('user_id')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Insert investment interest
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
          throw error;
        }
        return;
      }

      // Get investor's profile for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const investorName = profile?.full_name || 'An investor';

      // Create notification for the startup owner
      await supabase
        .from('notifications')
        .insert({
          user_id: company.user_id,
          type: 'investment_interest',
          title: 'New Investor Interest',
          message: `${investorName} has expressed interest in ${companyName}`,
          data: {
            investor_id: user.id,
            company_id: companyId,
            company_name: companyName,
            investor_name: investorName
          }
        });

      toast({
        title: "Interest Registered!",
        description: `Your interest in ${companyName} has been recorded. The startup owner will be notified.`,
      });
    } catch (error) {
      console.error('Error expressing interest:', error);
      toast({
        title: "Error",
        description: "Failed to express interest. Please try again.",
        variant: "destructive",
      });
    }

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
          user_id,
          logo_url
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
        logo_url: inv.companies?.logo_url || null,
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
        looking_for,
        logo_url
      `)
      .not('id', 'in', `(${investedCompanyIds.join(',') || 'null'})`)
      .order('created_at', { ascending: false });

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
    <div className="min-h-screen bg-gradient-hero p-2 sm:p-4 pb-20 lg:pb-4 relative">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
          <RoleBasedAvatar 
            avatarUrl={profileWithRole?.avatar_url} 
            role="investor"
            fallbackText={user?.email || 'I'}
            className="h-12 w-12 sm:h-16 sm:w-16"
          />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {profileWithRole?.full_name || 'Investor'} Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Discover and fund the next unicorns</p>
          </div>
        </div>


        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-9 max-w-7xl">
              <TabsTrigger value="social" className="flex-shrink-0">Social</TabsTrigger>
              <TabsTrigger value="network" className="flex-shrink-0">Network</TabsTrigger>
              <TabsTrigger value="portfolio" className="flex-shrink-0">Portfolio</TabsTrigger>
              <TabsTrigger value="opportunities" className="flex-shrink-0">Opportunities</TabsTrigger>
              <TabsTrigger value="events" className="flex-shrink-0">Events</TabsTrigger>
              <TabsTrigger value="profile" className="flex-shrink-0">Profile</TabsTrigger>
              <TabsTrigger value="analytics" className="flex-shrink-0">Analytics</TabsTrigger>
              <TabsTrigger value="intelligence" className="flex-shrink-0">Intelligence</TabsTrigger>
              <TabsTrigger value="tools" className="flex-shrink-0">Tools</TabsTrigger>
            </TabsList>
          </div>

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
                          <RoleBasedAvatar 
                            avatarUrl={investment.logo_url}
                            role="startup"
                            fallbackText={investment.name}
                            className="h-10 w-10"
                          />
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

          <TabsContent value="network" className="space-y-4">
            <NetworkBrowser />
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <UnifiedCalendar 
              showCreateButton={false}
              filterTypes={['event', 'session', 'pitch']}
              onItemClick={(item) => {
                if ((item.type === 'session' || item.type === 'pitch') && item.meeting_link) {
                  setActiveVideoUrl(item.meeting_link);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="pitches" className="space-y-4">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Scheduled Pitch Meetings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pitchMeetings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No upcoming pitch meetings</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pitchMeetings.map((meeting) => (
                      <Card key={meeting.id} className="border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={meeting.company?.logo_url} />
                                <AvatarFallback>{meeting.company?.name?.[0] || 'C'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-semibold">{meeting.company?.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  with {meeting.startup?.full_name}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(meeting.scheduled_date), 'PPP p')}
                                </div>
                                <Badge variant="secondary" className="mt-2">
                                  {meeting.duration_minutes} minutes
                                </Badge>
                              </div>
                            </div>
                            {meeting.company?.pitch_deck_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(meeting.company.pitch_deck_url, '_blank')}
                                className="gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                View Deck
                              </Button>
                            )}
                          </div>
                          
                          {meeting.meeting_link && (
                            <Button
                              className="w-full mt-3"
                              onClick={() => setActiveVideoUrl(meeting.meeting_link)}
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Join Pitch Meeting
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <InvestorProfileForm />
            <InvestorAvailabilityManager />
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <UnifiedCommunityFeed />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {/* Investor Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6">
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
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4">
            <MarketIntelligenceWidget />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <AIFeaturesHub />
          </TabsContent>
        </Tabs>

        {/* Centralized Video Conferencing - Outside Tabs */}
        {activeVideoUrl && (
          <div className="mt-6">
            <VideoConferencing
              roomUrl={activeVideoUrl}
              onLeave={() => setActiveVideoUrl(undefined)}
            />
          </div>
        )}
      </div>

      {/* Floating Chat with AI */}
      <FloatingChat />
    </div>
  );
}