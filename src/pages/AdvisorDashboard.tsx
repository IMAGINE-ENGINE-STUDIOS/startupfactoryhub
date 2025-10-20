import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { Calendar as CalendarIcon, Users, MessageSquare, TrendingUp, Star, Clock, Award, Plus, MapPin, MessageCircle, Network, FileText, BarChart, Brain, Wrench, Briefcase, Settings, CheckCircle, XCircle, ExternalLink, Video, User, BookOpen } from 'lucide-react';
import companyLogo from '@/assets/company-logo.png';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import FloatingChat from '@/components/FloatingChat';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import UnifiedJobsBoard from '@/components/UnifiedJobsBoard';
import AdvisorJobTaskViewer from '@/components/AdvisorJobTaskViewer';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import StartupProfileDialog from '@/components/StartupProfileDialog';
import NetworkBrowser from '@/components/NetworkBrowser';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import { DashboardHeader } from '@/components/DashboardHeader';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';

import { useMentorDashboard } from '@/hooks/useMentorDashboard';
import AdvisorProfileView from '@/components/AdvisorProfileView';
import MenteeSessions from '@/components/MenteeSessions';

import { useEvents } from '@/hooks/useEvents';
import { format, parseISO } from 'date-fns';

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
  const [activeTab, setActiveTab] = useState("social");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const { profile: profileWithRole } = useProfileWithRole();
  const { upcomingEvents } = useEvents();
  const { pendingRequests, activeMentees, todaySessions, loading: dashboardLoading, refetch } = useMentorDashboard();
  
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
      // Get mentor profile
      const { data: mentorProfile } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get active mentorships count
      const { count: activeMenteesCount } = await supabase
        .from('mentorship_relationships')
        .select('*', { count: 'exact', head: true })
        .eq('mentor_id', user.id)
        .eq('status', 'active');

      // Get pending mentorship requests
      const { count: pendingCount } = await supabase
        .from('mentorship_relationships')
        .select('*', { count: 'exact', head: true })
        .eq('mentor_id', user.id)
        .eq('status', 'pending');

      // Get sessions this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: sessionsThisMonth } = await supabase
        .from('mentoring_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('mentor_id', user.id)
        .eq('status', 'completed')
        .gte('scheduled_at', startOfMonth.toISOString());

      setMentorStats({
        activeMentees: activeMenteesCount || 0,
        totalSessions: mentorProfile?.total_sessions || 0,
        sessionsThisMonth: sessionsThisMonth || 0,
        pendingRequests: pendingCount || 0,
        averageRating: mentorProfile?.average_rating || 0
      });
    } catch (error) {
      console.error('Error fetching mentor stats:', error);
    }
  };

  const fetchMentorProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mentor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setMentorProfile(data);
    }
  };

  const handleMentorshipRequest = async (requestId: string, action: 'accept' | 'decline') => {
    const { error } = await supabase
      .from('mentorship_relationships')
      .update({ 
        status: action === 'accept' ? 'active' : 'declined',
        start_date: action === 'accept' ? new Date().toISOString() : null
      })
      .eq('id', requestId);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} mentorship request`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: action === 'accept' ? "Request Accepted!" : "Request Declined",
      description: action === 'accept' 
        ? "You can now schedule sessions with your new mentee."
        : "The mentorship request has been declined.",
    });

    refetch();
    fetchStartups();
    fetchMentorStats();
  };

  const offerMentorship = async (companyId: string, menteeUserId: string, startupName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('mentorship_relationships')
        .insert({
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
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      // Get advisor profile for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const advisorName = profile?.full_name || 'An advisor';

      // Send notification to startup
      await supabase
        .from('notifications')
        .insert({
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
        description: `Your mentorship offer to ${startupName} has been sent.`,
      });

      // Remove the startup from the list immediately
      setStartups(prevStartups => 
        prevStartups.filter(s => s.id !== companyId)
      );
    } catch (error) {
      console.error('Error offering mentorship:', error);
      toast({
        title: "Error",
        description: "Failed to offer mentorship. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchStartups = async () => {
    if (!user) return;

    // Fetch all companies
    const { data: allCompanies, error } = await supabase
      .from('companies')
      .select(`
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
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching startups:', error);
      return;
    }

    // Fetch existing mentorship relationships for this advisor
    const { data: existingRelationships } = await supabase
      .from('mentorship_relationships')
      .select('mentee_id')
      .eq('mentor_id', user.id);

    // Filter out companies where mentorship already exists
    const existingMenteeIds = new Set(
      (existingRelationships || []).map(r => r.mentee_id)
    );

    const availableStartups = (allCompanies || []).filter(
      company => !existingMenteeIds.has(company.user_id)
    );

    setStartups(availableStartups);
  };

  const stats = [
    { 
      title: 'Active Mentees', 
      value: mentorStats.activeMentees.toString(), 
      icon: Users, 
      color: 'text-primary' 
    },
    { 
      title: 'Sessions This Month', 
      value: mentorStats.sessionsThisMonth.toString(), 
      icon: CalendarIcon, 
      color: 'text-accent' 
    },
    { 
      title: 'Total Sessions', 
      value: mentorStats.totalSessions.toString(), 
      icon: TrendingUp, 
      color: 'text-green-500' 
    },
    { 
      title: 'Rating', 
      value: mentorStats.averageRating.toFixed(1), 
      icon: Star, 
      color: 'text-yellow-500' 
    },
  ];

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-6 relative">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile: Only Avatar */}
              <div className="md:hidden">
                <RoleBasedAvatar 
                  avatarUrl={profileWithRole?.avatar_url} 
                  role="advisor"
                  fallbackText={user?.email || 'A'}
                  className="h-16 w-16"
                />
              </div>
              
              {/* Desktop: Full Welcome Section */}
              <div className="hidden md:flex items-center space-x-4">
                <RoleBasedAvatar 
                  avatarUrl={profileWithRole?.avatar_url} 
                  role="advisor"
                  fallbackText={user?.email || 'A'}
                  className="h-16 w-16"
                />
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
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-9 max-w-5xl">
              <TabsTrigger value="social" className="flex-shrink-0 gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden md:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex-shrink-0 gap-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-shrink-0 gap-2">
                <Network className="h-4 w-4" />
                <span className="hidden md:inline">Network</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex-shrink-0 gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden md:inline">Jobs</span>
              </TabsTrigger>
              <TabsTrigger value="mentees" className="flex-shrink-0 gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Mentees</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-shrink-0 gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden md:inline">Calendar</span>
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

          <TabsContent value="social" className="space-y-4">
            <UnifiedCommunityFeed />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <AdvisorProfileView />
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <NetworkBrowser />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <UnifiedJobsBoard />
            <AdvisorJobTaskViewer />
          </TabsContent>

          <TabsContent value="mentees" className="space-y-4">
            <MenteeSessions />
            
            {/* Today's Sessions */}
            {todaySessions.length > 0 && (
              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Today's Sessions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todaySessions.map((session: any) => (
                      <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
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
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Pending Mentorship Requests</span>
                    <Badge variant="secondary">{pendingRequests.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingRequests.map((request: any) => (
                      <Card key={request.id} className="hover:border-primary/50 transition-colors">
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
                                {request.companies && (
                                  <>
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
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 md:w-48 flex-shrink-0">
                              {request.companies && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    setSelectedStartup(request.companies);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Profile
                                </Button>
                              )}
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleMentorshipRequest(request.id, 'decline')}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => handleMentorshipRequest(request.id, 'accept')}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active Mentees */}
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Active Mentees</span>
                  {activeMentees.length > 0 && <Badge variant="secondary">{activeMentees.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeMentees.length > 0 ? (
                    activeMentees.map((mentorship: any) => (
                      <Card key={mentorship.id} className="border border-border/50 hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={mentorship.mentee?.avatar_url} />
                              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                {mentorship.mentee?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-foreground truncate">
                                {mentorship.mentee?.full_name || 'Anonymous'}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {mentorship.companies?.name || 'Startup Founder'}
                              </p>
                              {mentorship.companies && (
                                <div className="flex space-x-1 mt-2">
                                  <Badge variant="secondary" className="text-xs">{mentorship.companies.stage}</Badge>
                                  <Badge variant="outline" className="text-xs">{mentorship.companies.industry}</Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" className="flex-1">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => setCreateSessionDialogOpen(true)}>
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              Schedule
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No active mentees yet</h3>
                      <p className="text-muted-foreground mb-4">Find startups seeking mentorship below</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* New Opportunities */}
            {startups.length > 0 && (
              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>New Mentorship Opportunities</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {startups.map((startup) => (
                      <div key={startup.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <RoleBasedAvatar 
                            avatarUrl={startup.logo_url}
                            role="startup"
                            fallbackText={startup.name}
                            className="h-12 w-12"
                          />
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 md:flex-initial"
                            onClick={() => {
                              setSelectedStartup(startup);
                              setDialogOpen(true);
                            }}
                          >
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1 md:flex-initial"
                            onClick={() => offerMentorship(startup.id, startup.user_id, startup.name)}
                          >
                            Offer Mentorship
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
            {upcomingEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingEvents.slice(0, 6).map((event) => (
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
            
            <UnifiedCalendar
              showCreateButton={false}
              userRole="advisor"
              onItemClick={(item) => {
                if (item.type === 'event') {
                  setSelectedEvent(item);
                  setShowEventDetails(true);
                }
              }}
              filterTypes={['event', 'session', 'availability']}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {/* Advisor Stats */}
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
      </div>

      <StartupProfileDialog
        company={selectedStartup}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />


      {/* Floating Chat with AI */}
      <FloatingChat />
      <CreateSessionDialog 
        open={createSessionDialogOpen}
        onOpenChange={setCreateSessionDialogOpen}
        onSessionCreated={() => {
          setCreateSessionDialogOpen(false);
        }}
      />
      <CreateEventDialog 
        open={createEventDialogOpen}
        onOpenChange={setCreateEventDialogOpen}
        onEventCreated={() => {
          setCreateEventDialogOpen(false);
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