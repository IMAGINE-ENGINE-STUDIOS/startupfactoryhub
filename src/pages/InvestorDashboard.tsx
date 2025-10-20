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
import { DollarSign, TrendingUp, Building, PieChart, Target, Users, Calendar as CalendarIcon, ExternalLink, Video, Plus, Bell, Clock, MapPin, MessageCircle, Network, UserCircle, BarChart, Brain, Wrench } from 'lucide-react';
import companyLogo from '@/assets/company-logo.png';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import { format, parseISO } from 'date-fns';

import StartupBrowser from '@/components/StartupBrowser';
import NetworkBrowser from '@/components/NetworkBrowser';
import MatchingSystem from '@/components/MatchingSystem';
import FloatingChat from '@/components/FloatingChat';
import InvestorProfileForm from '@/components/InvestorProfileForm';
import InvestorStartupNetwork from '@/components/InvestorStartupNetwork';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import InvestorAvailabilityManager from '@/components/InvestorAvailabilityManager';
import InvestorProfileView from '@/components/InvestorProfileView';
import VideoConferencing from '@/components/VideoConferencing';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { DashboardHeader } from '@/components/DashboardHeader';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import CreateSessionDialog from '@/components/CreateSessionDialog';

import { useEvents } from '@/hooks/useEvents';

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
  const [activeTab, setActiveTab] = useState('social');
  const [pitchMeetings, setPitchMeetings] = useState<any[]>([]);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | undefined>();
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile: profileWithRole } = useProfileWithRole();
  const { upcomingEvents } = useEvents();

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
    { title: 'ROI (Est.)', value: calculateROI(), icon: TrendingUp, color: 'text-accent' },
    { title: 'Opportunities', value: opportunities.length.toString(), icon: Target, color: 'text-yellow-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero pb-6 relative">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile: Only Avatar */}
          <div className="md:hidden flex justify-start mb-4">
            <RoleBasedAvatar 
              avatarUrl={profileWithRole?.avatar_url} 
              role="investor"
              fallbackText={user?.email || 'I'}
              className="h-16 w-16"
            />
          </div>
          
          {/* Desktop: Full Welcome Section */}
          <div className="hidden md:flex items-center space-x-4">
            <RoleBasedAvatar 
              avatarUrl={profileWithRole?.avatar_url} 
              role="investor"
              fallbackText={user?.email || 'I'}
              className="h-16 w-16"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {profileWithRole?.full_name || 'Investor'} Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Discover and fund the next unicorns</p>
            </div>
          </div>
        </div>


        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto scrollbar-thin -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto lg:grid lg:w-full lg:grid-cols-8 max-w-7xl whitespace-nowrap">
              <TabsTrigger value="social" className="flex-shrink-0 gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden md:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-shrink-0 gap-2">
                <Network className="h-4 w-4" />
                <span className="hidden md:inline">Network</span>
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex-shrink-0 gap-2">
                <Building className="h-4 w-4" />
                <span className="hidden md:inline">Portfolio</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-shrink-0 gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden md:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex-shrink-0 gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden md:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-shrink-0 gap-2">
                <BarChart className="h-4 w-4" />
                <span className="hidden md:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="flex-shrink-0 gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden md:inline">Intelligence</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex-shrink-0 gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden md:inline">Tools</span>
              </TabsTrigger>
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

          <TabsContent value="network" className="space-y-4">
            <MatchingSystem />
            <NetworkBrowser />
          </TabsContent>

          {/* Calendar Tab - Merged Events & Pitches */}
          <TabsContent value="calendar" className="space-y-6">
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <Button onClick={() => setCreateSessionDialogOpen(true)} variant="outline" className="gap-2 w-full sm:w-auto">
                <CalendarIcon className="h-4 w-4" />
                <span className="sm:inline">Schedule Session</span>
              </Button>
              <Button onClick={() => setCreateEventDialogOpen(true)} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Create Event</span>
              </Button>
            </div>

            {/* Upcoming Events with Banners - AT TOP */}
            {upcomingEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingEvents.slice(0, 6).map(event => (
                      <div 
                        key={event.id} 
                        className="group cursor-pointer" 
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventDetails(true);
                        }}
                      >
                        <div className="relative overflow-hidden rounded-lg border hover:border-primary transition-all">
                          {event.banner_url ? (
                            <img 
                              src={event.banner_url} 
                              alt={event.title} 
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform" 
                            />
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                              <CalendarIcon className="h-16 w-16 text-purple-500/30" />
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-semibold mb-2 line-clamp-1">{event.title}</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(event.start_date), 'MMM d, h:mm a')}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  <span className="line-clamp-1">{event.location}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                {event.attendees} attending
                                {event.max_attendees && ` / ${event.max_attendees}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Unified Calendar - IN MIDDLE */}
            <UnifiedCalendar 
              showCreateButton={false}
              userRole="investor"
              filterTypes={['event', 'session', 'pitch']}
              onItemClick={(item) => {
                if (item.type === 'event') {
                  setSelectedEvent(item);
                  setShowEventDetails(true);
                } else if ((item.type === 'session' || item.type === 'pitch') && item.meeting_link) {
                  setActiveVideoUrl(item.meeting_link);
                }
              }}
            />

            {/* Upcoming Pitch Meetings - AT BOTTOM */}
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  <span>Upcoming Pitch Meetings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pitchMeetings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
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
                                  <CalendarIcon className="h-4 w-4" />
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
            <InvestorProfileView />
            <Card>
              <CardHeader>
                <CardTitle>Investment Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <InvestorProfileForm />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Availability Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <InvestorAvailabilityManager />
              </CardContent>
            </Card>
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

      {/* Dialogs */}
      <CreateEventDialog 
        open={createEventDialogOpen} 
        onOpenChange={setCreateEventDialogOpen} 
        onEventCreated={() => {
          setCreateEventDialogOpen(false);
        }} 
      />
      <CreateSessionDialog 
        open={createSessionDialogOpen} 
        onOpenChange={setCreateSessionDialogOpen} 
        onSessionCreated={() => {
          setCreateSessionDialogOpen(false);
        }} 
      />
      {selectedEvent && (
        <EventDetailsDialog 
          event={selectedEvent} 
          open={showEventDetails} 
          onOpenChange={setShowEventDetails} 
          onEventUpdated={() => {
            setShowEventDetails(false);
          }} 
        />
      )}
    </div>
  );
}