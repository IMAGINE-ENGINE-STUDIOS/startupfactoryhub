import { useState, useEffect } from 'react';
import CalendarBookingSettings from '@/components/CalendarBookingSettings';
import BookingsList from '@/components/BookingsList';
import { AvailabilityScheduleCard, BlockedTimesCard } from '@/components/AvailabilityManager';
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
import { Calendar as CalendarIcon, Users, TrendingUp, Star, Clock, Plus, MapPin, Bell, MessageCircle, Network, FileText, BarChart, Brain, Wrench, Briefcase, Globe, Video, ExternalLink, XCircle, CheckCircle, ChevronDown } from 'lucide-react';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import DistrictRooms from '@/components/DistrictRooms';
import NotificationsPanel from '@/components/NotificationsPanel';
import LiveRooms from '@/components/LiveRooms';
import FloatingChat from '@/components/FloatingChat';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { IntelligenceHub } from '@/components/intelligence/IntelligenceHub';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import UnifiedJobsBoard from '@/components/UnifiedJobsBoard';
import AdvisorJobTaskViewer from '@/components/AdvisorJobTaskViewer';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import StartupProfileDialog from '@/components/StartupProfileDialog';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import MentorOffersBoard from '@/components/MentorOffersBoard';
import OfficialMentorChecklist from '@/components/OfficialMentorChecklist';

export default function AdvisorDashboard() {
  
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
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
      const {
        data: sessionIds
      } = await supabase.from('mentoring_sessions').select('id').eq('mentor_id', user.id);
      let averageRating = 0;
      if (sessionIds && sessionIds.length > 0) {
        const {
          data: feedback
        } = await supabase.from('session_feedback').select('rating').in('session_id', sessionIds.map(s => s.id));
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
    onUpdate: fetchMentorStats
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
    fetchMentorStats();
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="items-start justify-between flex flex-row">
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
          <div className="overflow-x-auto scrollbar-thin px-2 sm:mx-0 sm:px-0 mx-0">
            <TabsList className="flex w-full whitespace-nowrap tech-card border-0 p-1.5 sm:p-1 gap-1 h-auto">
              <TabsTrigger value="social" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Social</span>
              </TabsTrigger>
              <TabsTrigger value="meetings" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Video className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Meetings</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Network className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Network</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Briefcase className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Jobs</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <CalendarIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <BarChart className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Brain className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Intelligence</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Wrench className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Tools</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Globe className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Resources</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="social" className="space-y-6">
            <OfficialMentorChecklist />
            <UnifiedCommunityFeed showCreatePost={true} interstitialContent={<DistrictRooms />} interstitialAfterIndex={3} />
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <LiveRooms />
            
            {/* Unified Sessions & Mentees */}
            <Card className="tech-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Active Mentees & Sessions
                    {activeMentees.length > 0 && <Badge variant="secondary" className="text-xs">{activeMentees.length} mentees</Badge>}
                  </span>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCreateSessionDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Schedule
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Today's Sessions - Priority */}
                {todaySessions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today</p>
                    {todaySessions.map((session: any) => (
                      <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-3">
                          <Video className="h-4 w-4 text-primary" />
                          <div>
                            <h4 className="font-medium text-sm text-foreground">
                              {session.companies?.name || session.mentee?.full_name || 'Session'}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {session.topic || 'Mentoring Session'} • {formatTime(session.scheduled_at)}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" className="gap-1.5">
                          <Video className="h-3.5 w-3.5" />
                          Join
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Active Mentees - Horizontal scroll */}
                {activeMentees.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Mentees</p>
                    <ScrollArea className="w-full">
                      <div className="flex gap-3 pb-2">
                        {activeMentees.map((mentee: any) => (
                          <div key={mentee.id} className="flex-shrink-0 w-[200px] p-3 rounded-lg border border-border/40 hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-2.5 mb-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={mentee.mentee?.avatar_url} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {mentee.mentee?.full_name?.[0] || 'M'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{mentee.mentee?.full_name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{mentee.companies?.name || ''}</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => {
                                setSelectedMenteeId(mentee.mentee_id);
                                setCreateSessionDialogOpen(true);
                              }}>
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                Book
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => window.dispatchEvent(new CustomEvent('openFloatingChat', { detail: { userId: mentee.mentee_id } }))}>
                                <MessageCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                )}

                {/* Upcoming sessions via MenteeSessions */}
                <MenteeSessions onJoinMeeting={(link, sessionData) => setActiveVideoSession(sessionData)} />
              </CardContent>
            </Card>

            {/* Session History - collapsible */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Card className="tech-card border-0 cursor-pointer hover:bg-muted/10 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Session History
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <MentorSessionHistory showStats={false} />
              </CollapsibleContent>
            </Collapsible>

            {/* Past Mentees - Compact */}
            {pastMentees && pastMentees.length > 0 && (
              <Collapsible>
                <Card className="tech-card border-0">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/10 transition-colors pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          Past Mentees
                          <Badge variant="secondary" className="text-xs">{pastMentees.length}</Badge>
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {pastMentees.map(mentee => (
                          <div key={mentee.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border/40">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={mentee.mentee.avatar_url} />
                              <AvatarFallback className="text-xs">{mentee.mentee.full_name?.[0] || 'M'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{mentee.mentee.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{mentee.companies?.name || 'No company'}</p>
                            </div>
                            <Badge variant="secondary" className="text-[10px]">Completed</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* Offer Mentorship - Expandable */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Card className="tech-card border-0 cursor-pointer hover:bg-muted/10 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Offer Mentorship
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                    </CardTitle>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <MentorOffersBoard />
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>


          <TabsContent value="network" className="space-y-4">
            <MatchingSystem />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <UnifiedJobsBoard />
            <AdvisorJobTaskViewer />
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
          }} filterTypes={['event', 'session', 'availability', 'accelerator']} />

            {/* Availability Manager - Bottom of Calendar Tab */}
            
            {/* Booking Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <CalendarBookingSettings />
              <BookingsList />
              <AvailabilityScheduleCard />
              <BlockedTimesCard />
            </div>

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
            <IntelligenceHub />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <AIFeaturesHub />
          </TabsContent>


          <TabsContent value="resources" className="mt-0 relative overflow-hidden" style={{ height: 'calc(100vh - 12rem)', minHeight: '500px' }}>
            <div className="absolute inset-0">
              <GlobalResourcesMap />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <AdvisorProfileView />
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

      <CreateAdvisorSessionDialog 
        open={createSessionDialogOpen} 
        onOpenChange={(open) => {
          setCreateSessionDialogOpen(open);
          if (!open) setSelectedMenteeId(null);
        }}
        onSessionCreated={() => {
          setCreateSessionDialogOpen(false);
          setSelectedMenteeId(null);
          refetch();
        }}
        preSelectedMenteeId={selectedMenteeId || undefined}
      />
      <CreateEventDialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen} onEventCreated={() => {
      setCreateEventDialogOpen(false);
    }} />
      {selectedEvent && <EventDetailsDialog event={selectedEvent} open={showEventDetails} onOpenChange={setShowEventDetails} onEventUpdated={() => {
      setShowEventDetails(false);
    }} />}
    </div>;
}