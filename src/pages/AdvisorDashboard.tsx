import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useRealtime } from '@/hooks/useRealtime';
import { Calendar as CalendarIcon, Users, MessageSquare, TrendingUp, Star, Clock, Award, Plus, MapPin, MessageCircle, Network, FileText, BarChart, Brain, Wrench, Briefcase, Settings, CheckCircle, XCircle, ExternalLink, Video, User, BookOpen } from 'lucide-react';
import companyLogo from '@/assets/company-logo.png';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import FloatingChat from '@/components/FloatingChat';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import UnifiedJobsBoard from '@/components/UnifiedJobsBoard';
import AdvisorJobTaskViewer from '@/components/AdvisorJobTaskViewer';
import AvailabilityManager from '@/components/AvailabilityManager';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import StartupProfileDialog from '@/components/StartupProfileDialog';
import NetworkBrowser from '@/components/NetworkBrowser';
import MatchingSystem from '@/components/MatchingSystem';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import { DashboardHeader } from '@/components/DashboardHeader';
import CreateAdvisorSessionDialog from '@/components/CreateAdvisorSessionDialog';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import { useMentorDashboard } from '@/hooks/useMentorDashboard';
import AdvisorProfileView from '@/components/AdvisorProfileView';
import MenteeSessions from '@/components/MenteeSessions';
import MentorSessionHistory from '@/components/MentorSessionHistory';
import ActiveMenteesCards from '@/components/ActiveMenteesCards';
import ProfilePostsMosaic from '@/components/ProfilePostsMosaic';
import { useEvents } from '@/hooks/useEvents';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import VideoConferencing from '@/components/VideoConferencing';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
interface Startup {
  id: string;
  name: string;
  description: string;
  stage: string;
  industry: string;
  user_id: string;
  logo_url?: string | null;
}
export default function AdvisorDashboard() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || "social");
  const [activeVideoSession, setActiveVideoSession] = useState<any>(null);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    role,
    loading: roleLoading
  } = useUserRole();

  // Sync URL tab param to activeTab
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
      setSearchParams({});
    }
  }, [urlTab, activeTab, setSearchParams]);
  const {
    profile: profileWithRole
  } = useProfileWithRole();
  const {
    upcomingEvents
  } = useEvents();
  const {
    pendingRequests,
    activeMentees,
    pastMentees,
    todaySessions,
    loading: dashboardLoading,
    refetch
  } = useMentorDashboard();
  const [mentorStats, setMentorStats] = useState({
    activeMentees: 0,
    totalSessions: 0,
    sessionsThisMonth: 0,
    pendingRequests: 0,
    averageRating: 0
  });
  useEffect(() => {
    if (user) {
      fetchMentorProfile();
      fetchStartups();
      fetchMentorStats();
    }
  }, [user]);

  // Redirect if wrong role
  useEffect(() => {
    if (!roleLoading && role && role !== 'advisor' && role !== 'mentor') {
      navigate('/dashboard');
    }
  }, [role, roleLoading, navigate]);
  const fetchMentorStats = async () => {
    if (!user) return;
    try {
      // Get active mentorships count
      const {
        count: activeMenteesCount
      } = await supabase.from('mentorship_relationships').select('*', {
        count: 'exact',
        head: true
      }).eq('mentor_id', user.id).eq('status', 'active');

      // Get pending mentorship requests
      const {
        count: pendingCount
      } = await supabase.from('mentorship_relationships').select('*', {
        count: 'exact',
        head: true
      }).eq('mentor_id', user.id).eq('status', 'pending');

      // Get sessions this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const {
        count: sessionsThisMonth
      } = await supabase.from('mentoring_sessions').select('*', {
        count: 'exact',
        head: true
      }).eq('mentor_id', user.id).eq('status', 'completed').gte('scheduled_at', startOfMonth.toISOString());

      // Get total sessions count
      const {
        count: totalSessionsCount
      } = await supabase.from('mentoring_sessions').select('*', {
        count: 'exact',
        head: true
      }).eq('mentor_id', user.id).in('status', ['completed', 'scheduled']);

      // Calculate average rating from session_feedback
      const { data: sessionIds } = await supabase
        .from('mentoring_sessions')
        .select('id')
        .eq('mentor_id', user.id);

      let averageRating = 0;
      if (sessionIds && sessionIds.length > 0) {
        const { data: feedback } = await supabase
          .from('session_feedback')
          .select('rating')
          .in('session_id', sessionIds.map(s => s.id));

        if (feedback && feedback.length > 0) {
          const totalRating = feedback.reduce((sum, f) => sum + (f.rating || 0), 0);
          averageRating = totalRating / feedback.length;
        }
      }

      setMentorStats({
        activeMentees: activeMenteesCount || 0,
        totalSessions: totalSessionsCount || 0,
        sessionsThisMonth: sessionsThisMonth || 0,
        pendingRequests: pendingCount || 0,
        averageRating: averageRating
      });
    } catch (error) {
      console.error('Error fetching mentor stats:', error);
    }
  };

  // Real-time subscription for rating updates
  useRealtime({
    table: 'session_feedback',
    onInsert: fetchMentorStats,
    onUpdate: fetchMentorStats,
  });

  const fetchMentorProfile = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('mentor_profiles').select('*').eq('user_id', user.id).single();
    if (!error && data) {
      setMentorProfile(data);
    }
  };
  const handleMentorshipRequest = async (requestId: string, action: 'accept' | 'decline') => {
    const {
      error
    } = await supabase.from('mentorship_relationships').update({
      status: action === 'accept' ? 'active' : 'declined',
      start_date: action === 'accept' ? new Date().toISOString() : null
    }).eq('id', requestId);
    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} mentorship request`,
        variant: "destructive"
      });
      return;
    }
    toast({
      title: action === 'accept' ? "Request Accepted!" : "Request Declined",
      description: action === 'accept' ? "You can now schedule sessions with your new mentee." : "The mentorship request has been declined."
    });
    refetch();
    fetchStartups();
    fetchMentorStats();
  };
  const offerMentorship = async (companyId: string, menteeUserId: string, startupName: string) => {
    if (!user) return;
    try {
      const {
        error
      } = await supabase.from('mentorship_relationships').insert({
        mentor_id: user.id,
        mentee_id: menteeUserId,
        status: 'pending',
        goals: `Mentorship offer for ${startupName}`
      });
      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Offered",
            description: "You've already offered mentorship to this startup.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      // Get advisor profile for notification
      const {
        data: profile
      } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
      const advisorName = profile?.full_name || 'An advisor';

      // Send notification to startup
      await supabase.from('notifications').insert({
        user_id: menteeUserId,
        type: 'connection',
        title: 'New Mentorship Offer',
        message: `${advisorName} has offered to mentor your startup!`,
        data: {
          mentor_id: user.id,
          startup_name: startupName
        }
      });
      toast({
        title: "Mentorship Offered!",
        description: `Your mentorship offer to ${startupName} has been sent.`
      });

      // Remove the startup from the list immediately
      setStartups(prevStartups => prevStartups.filter(s => s.id !== companyId));
    } catch (error) {
      console.error('Error offering mentorship:', error);
      toast({
        title: "Error",
        description: "Failed to offer mentorship. Please try again.",
        variant: "destructive"
      });
    }
  };
  const fetchStartups = async () => {
    if (!user) return;

    // Fetch all companies
    const {
      data: allCompanies,
      error
    } = await supabase.from('companies').select(`
        id,
        name,
        description,
        stage,
        industry,
        user_id,
        logo_url,
        pitch_deck_url,
        website,
        location,
        team_size,
        funding_amount,
        looking_for
      `).order('created_at', {
      ascending: false
    });
    if (error) {
      console.error('Error fetching startups:', error);
      return;
    }

    // Fetch existing mentorship relationships for this advisor
    const {
      data: existingRelationships
    } = await supabase.from('mentorship_relationships').select('mentee_id').eq('mentor_id', user.id);

    // Filter out companies where mentorship already exists
    const existingMenteeIds = new Set((existingRelationships || []).map(r => r.mentee_id));
    const availableStartups = (allCompanies || []).filter(company => !existingMenteeIds.has(company.user_id));
    setStartups(availableStartups);
  };
  const stats = [{
    title: 'Active Mentees',
    value: mentorStats.activeMentees.toString(),
    icon: Users,
    color: 'text-primary'
  }, {
    title: 'Sessions This Month',
    value: mentorStats.sessionsThisMonth.toString(),
    icon: CalendarIcon,
    color: 'text-accent'
  }, {
    title: 'Total Sessions',
    value: mentorStats.totalSessions.toString(),
    icon: TrendingUp,
    color: 'text-green-500'
  }, {
    title: 'Rating',
    value: mentorStats.averageRating.toFixed(1),
    icon: Star,
    color: 'text-yellow-500'
  }];
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  return <div className="min-h-screen bg-gradient-hero pb-6 relative">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 pt-14 sm:pt-16 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile: Only Avatar */}
              <div className="md:hidden">
                <RoleBasedAvatar avatarUrl={profileWithRole?.avatar_url} role="advisor" fallbackText={user?.email || 'A'} className="h-16 w-16" />
              </div>
              
              {/* Desktop: Full Welcome Section */}
              <div className="hidden md:flex items-center space-x-4">
                <RoleBasedAvatar avatarUrl={profileWithRole?.avatar_url} role="advisor" fallbackText={user?.email || 'A'} className="h-16 w-16" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {profileWithRole?.full_name || 'Advisor'} Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground">Guide the next generation of entrepreneurs</p>
                </div>
              </div>
            </div>
          </div>
        </div>


        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto scrollbar-thin -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-8 max-w-5xl tech-card border-0 p-1.5 sm:p-1 gap-1 h-auto">
              <TabsTrigger value="social" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Social</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Network className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Network</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Briefcase className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Jobs</span>
              </TabsTrigger>
              <TabsTrigger value="mentees" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Users className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Mentees</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <CalendarIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <BarChart className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Brain className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Intelligence</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Wrench className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Tools</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="social" className="space-y-4">
            <UnifiedCommunityFeed />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <AdvisorProfileView />
            
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfilePostsMosaic userId={user?.id || ''} isOwnProfile={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <MatchingSystem />
            <NetworkBrowser />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <UnifiedJobsBoard />
            <AdvisorJobTaskViewer />
          </TabsContent>

          <TabsContent value="mentees" className="space-y-4">
            <MenteeSessions onJoinMeeting={(link, sessionData) => setActiveVideoSession(sessionData)} />
            
            {/* Today's Sessions */}
            {todaySessions.length > 0 && <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Today's Sessions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todaySessions.map((session: any) => <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
                        <div className="flex items-center space-x-3">
                          <Video className="h-5 w-5 text-primary" />
                          <div>
                            <h4 className="font-medium text-foreground">
                              {session.companies?.name || session.mentee?.full_name || 'Session'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {session.topic || 'Mentoring Session'} • {formatTime(session.scheduled_at)}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" className="gap-2">
                          <Video className="h-4 w-4" />
                          Join
                        </Button>
                      </div>)}
                  </div>
                </CardContent>
              </Card>}

            {/* Pending Requests */}
            {pendingRequests.length > 0 && <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Pending Mentorship Requests</span>
                    <Badge variant="secondary">{pendingRequests.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingRequests.map((request: any) => <Card key={request.id} className="tech-card border-0 hover:scale-[1.02] transition-transform">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex items-start space-x-4 flex-1">
                              <Avatar className="h-12 w-12 flex-shrink-0">
                                <AvatarImage src={request.mentee?.avatar_url} />
                                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                  {request.mentee?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground">
                                  {request.mentee?.full_name || 'Anonymous User'}
                                </h3>
                                {request.companies && <>
                                    <p className="text-sm text-muted-foreground">
                                      {request.companies.name}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <Badge variant="secondary" className="text-xs">{request.companies.stage}</Badge>
                                      <Badge variant="outline" className="text-xs">{request.companies.industry}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                      {request.companies.description}
                                    </p>
                                  </>}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 md:w-48 flex-shrink-0">
                              {request.companies && <Button variant="outline" size="sm" className="w-full" onClick={() => {
                          setSelectedStartup(request.companies);
                          setDialogOpen(true);
                        }}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Profile
                                </Button>}
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleMentorshipRequest(request.id, 'decline')}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                                <Button size="sm" className="flex-1" onClick={() => handleMentorshipRequest(request.id, 'accept')}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>)}
                  </div>
                </CardContent>
              </Card>}

            {/* Active Mentees */}
            <ActiveMenteesCards 
              mentees={activeMentees}
              onScheduleSession={() => setCreateSessionDialogOpen(true)}
              onMessage={(menteeId) => navigate('/messages')}
            />

            {/* Session History with Ratings */}
            <MentorSessionHistory showStats={false} />

            {/* Past Mentees Section */}
            {pastMentees && pastMentees.length > 0 && <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle>Past Mentees</CardTitle>
                  <CardDescription>Previous mentorship relationships</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pastMentees.map(mentee => <div key={mentee.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Avatar>
                          <AvatarImage src={mentee.mentee.avatar_url} />
                          <AvatarFallback>{mentee.mentee.full_name?.[0] || 'M'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{mentee.mentee.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {mentee.companies?.name || 'No company info'}
                          </p>
                        </div>
                        <Badge variant="secondary">Completed</Badge>
                      </div>)}
                  </div>
                </CardContent>
              </Card>}

            {/* New Opportunities */}
            {startups.length > 0 && <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>New Mentorship Opportunities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {startups.map(startup => <div key={startup.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <RoleBasedAvatar avatarUrl={startup.logo_url} role="startup" fallbackText={startup.name} className="h-12 w-12" />
                          <div>
                            <h3 className="font-semibold text-foreground">{startup.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{startup.description}</p>
                            <div className="flex space-x-2 mt-2">
                              <Badge variant="secondary" className="text-xs">{startup.stage}</Badge>
                              <Badge variant="outline" className="text-xs">{startup.industry}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 w-full md:w-auto">
                          <Button variant="outline" size="sm" className="flex-1 md:flex-initial" onClick={() => {
                      setSelectedStartup(startup);
                      setDialogOpen(true);
                    }}>
                            View Details
                          </Button>
                          <Button size="sm" className="flex-1 md:flex-initial" onClick={() => offerMentorship(startup.id, startup.user_id, startup.name)}>
                            Offer Mentorship
                          </Button>
                        </div>
                      </div>)}
                  </div>
                </CardContent>
              </Card>}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 mb-4">
              <Button onClick={() => setCreateSessionDialogOpen(true)} variant="outline" className="gap-2 w-full sm:w-auto">
                <CalendarIcon className="h-4 w-4" />
                <span className="sm:inline">Schedule Session</span>
              </Button>
              <Button onClick={() => setCreateEventDialogOpen(true)} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Create Event</span>
              </Button>
            </div>

            {/* Upcoming Events with Banners */}
            {upcomingEvents.length > 0 && <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <div className="flex gap-4 pb-4">
                      {upcomingEvents.slice(0, 6).map(event => <div key={event.id} className="group cursor-pointer flex-shrink-0 w-[300px] sm:w-[350px]" onClick={() => {
                    setSelectedEvent(event);
                    setShowEventDetails(true);
                  }}>
                          <div className="relative overflow-hidden rounded-lg border hover:border-primary transition-all">
                            {event.banner_url ? <img src={event.banner_url} alt={event.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-48 bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                                <CalendarIcon className="h-16 w-16 text-purple-500/30" />
                              </div>}
                            <div className="p-4 min-h-[120px] flex flex-col">
                              <h3 className="font-semibold mb-2 line-clamp-1">{event.title}</h3>
                              <div className="space-y-1 text-sm text-muted-foreground flex-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {format(parseISO(event.start_date), 'MMM d, h:mm a')}
                                </div>
                                {event.location && <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {event.location.startsWith('http') ? <a href={event.location} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline line-clamp-1" onClick={e => e.stopPropagation()}>
                                        {event.location}
                                      </a> : <span className="line-clamp-1">{event.location}</span>}
                                  </div>}
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  {event.attendees} attending
                                  {event.max_attendees && ` / ${event.max_attendees}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>)}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>}
            
            <UnifiedCalendar showCreateButton={false} userRole="advisor" onItemClick={item => {
            if (item.type === 'event') {
              setSelectedEvent(item);
              setShowEventDetails(true);
            } else if (item.type === 'session' && item.meeting_link) {
              setActiveVideoSession(item);
            }
          }} filterTypes={['event', 'session', 'availability']} />

            {/* Availability Manager - Bottom of Calendar Tab */}
            
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {/* Advisor Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6">
              {stats.map(stat => <Card key={stat.title} className="tech-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>)}
            </div>
            
            {/* Session History with Ratings */}
            <MentorSessionHistory showStats={false} />
            
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4">
            <MarketIntelligenceWidget />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <AIFeaturesHub />
          </TabsContent>
        </Tabs>
      </div>

      <StartupProfileDialog company={selectedStartup} open={dialogOpen} onOpenChange={setDialogOpen} />


      {/* Floating Chat with AI */}
      <FloatingChat />

      {/* Video Conferencing Dialog */}
      <Dialog open={!!activeVideoSession} onOpenChange={open => !open && setActiveVideoSession(null)}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          {activeVideoSession && <VideoConferencing roomUrl={activeVideoSession.meeting_link} userId={user?.id} hostId={activeVideoSession.host_id || activeVideoSession.mentor_id} userName={profileWithRole?.full_name || user?.email || 'User'} meetingTitle={activeVideoSession.topic || 'Mentoring Session'} onLeave={() => setActiveVideoSession(null)} />}
        </DialogContent>
      </Dialog>

      <CreateAdvisorSessionDialog open={createSessionDialogOpen} onOpenChange={setCreateSessionDialogOpen} onSessionCreated={() => {
      setCreateSessionDialogOpen(false);
      refetch();
    }} />
      <CreateEventDialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen} onEventCreated={() => {
      setCreateEventDialogOpen(false);
    }} />
      {selectedEvent && <EventDetailsDialog event={selectedEvent} open={showEventDetails} onOpenChange={setShowEventDetails} onEventUpdated={() => {
      setShowEventDetails(false);
    }} />}
    </div>;
}