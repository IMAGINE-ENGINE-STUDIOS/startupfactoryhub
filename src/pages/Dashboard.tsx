import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConnectionsWidget from '@/components/ConnectionsWidget';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import NotificationCenter from '@/components/dashboard/NotificationCenter';
import StartupRoadmap from '@/components/StartupRoadmap';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import CRMBoard from '@/components/CRMBoard';
import FloatingChat from '@/components/FloatingChat';
import MatchingSystem from '@/components/MatchingSystem';
import NetworkBrowser from '@/components/NetworkBrowser';
import EducationalResources from '@/components/EducationalResources';
import InvestorStartupNetwork from '@/components/InvestorStartupNetwork';
import MentorAdvisorNetwork from '@/components/MentorAdvisorNetwork';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import CompanyProfileManager from '@/components/CompanyProfileManager';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import UnifiedJobsBoard from '@/components/UnifiedJobsBoard';
import ProfilePostsMosaic from '@/components/ProfilePostsMosaic';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import JobTaskManager from '@/components/JobTaskManager';
import CreatePitchMeetingDialog from '@/components/CreatePitchMeetingDialog';
import PitchMeetingCard from '@/components/PitchMeetingCard';
import { Plus, Target, Calendar as CalendarIcon, Clock, MapPin, Users, MessageCircle, Network, Map as MapIcon, UserCircle, Briefcase, GraduationCap, BarChart, Brain, Wrench, ChevronDown, Presentation, Video, Bell, Check, X, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import GuestPrompt from '@/components/GuestPrompt';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { useStartupAnalytics } from '@/hooks/useStartupAnalytics';
import { useRoadmapProgress } from '@/hooks/useRoadmapProgress';
import { useEvents } from '@/hooks/useEvents';
import { useUserRole } from '@/hooks/useUserRole';
import { format, parseISO } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const Dashboard = () => {
  const {
    user,
    loading
  } = useAuth();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState("social");
  const {
    profile: profileWithRole
  } = useProfileWithRole();
  const analytics = useStartupAnalytics();
  const roadmapProgress = useRoadmapProgress();
  const {
    upcomingEvents
  } = useEvents();
  const navigate = useNavigate();
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [createPitchDialogOpen, setCreatePitchDialogOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [connectedInvestors, setConnectedInvestors] = useState<Array<{id: string, name: string}>>([]);
  const [pitchMeetings, setPitchMeetings] = useState<any[]>([]);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | undefined>();

  // Redirect if wrong role
  useEffect(() => {
    if (!roleLoading && role && role !== 'startup') {
      navigate('/dashboard');
    }
  }, [role, roleLoading, navigate]);

  // Fetch company info and pitch meetings
  useEffect(() => {
    if (user) {
      fetchCompanyInfo();
      fetchPitchMeetings();
    }
  }, [user]);

  const fetchPitchMeetings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('pitch_meetings')
      .select(`
        *,
        company:companies(name, logo_url)
      `)
      .eq('startup_id', user.id)
      .order('scheduled_date', { ascending: true });

    if (!error && data) {
      // Fetch investor profiles separately
      const investorIds = [...new Set(data.map(m => m.investor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', investorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const enrichedData = data.map(meeting => ({
        ...meeting,
        investor: profileMap.get(meeting.investor_id) || { full_name: 'Unknown', avatar_url: null }
      }));
      
      setPitchMeetings(enrichedData);
    }
  };

  const handleAcceptPitch = async (pitchId: string) => {
    try {
      const { error } = await supabase
        .from('pitch_meetings')
        .update({ status: 'scheduled' })
        .eq('id', pitchId);

      if (error) throw error;

      toast({
        title: 'Pitch Accepted',
        description: 'The investor has been notified',
      });

      const meeting = pitchMeetings.find(m => m.id === pitchId);
      if (meeting) {
        await supabase.from('notifications').insert({
          user_id: meeting.investor_id,
          title: 'Pitch Meeting Accepted',
          message: `Your pitch meeting request has been accepted`,
          type: 'success',
        });
      }

      fetchPitchMeetings();
    } catch (error) {
      console.error('Error accepting pitch:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept pitch meeting',
        variant: 'destructive',
      });
    }
  };

  const handleRejectPitch = async (pitchId: string) => {
    try {
      const { error } = await supabase
        .from('pitch_meetings')
        .update({ status: 'cancelled' })
        .eq('id', pitchId);

      if (error) throw error;

      toast({
        title: 'Pitch Declined',
        description: 'The investor has been notified',
      });

      const meeting = pitchMeetings.find(m => m.id === pitchId);
      if (meeting) {
        await supabase.from('notifications').insert({
          user_id: meeting.investor_id,
          title: 'Pitch Meeting Declined',
          message: `Your pitch meeting request was declined`,
          type: 'info',
        });
      }

      fetchPitchMeetings();
    } catch (error) {
      console.error('Error rejecting pitch:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline pitch meeting',
        variant: 'destructive',
      });
    }
  };

  const fetchCompanyInfo = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('companies')
      .select('id, name')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (data) {
      setCompanyId(data.id);
      setCompanyName(data.name);
      
      // Fetch connected investors who have invested
      const { data: investments } = await supabase
        .from('investments')
        .select('investor_id, profiles(full_name)')
        .eq('company_id', data.id)
        .eq('status', 'active');

      const investors = (investments || []).map(inv => ({
        id: inv.investor_id,
        name: inv.profiles ? (inv.profiles as any).full_name || 'Investor' : 'Investor'
      }));
      
      setConnectedInvestors(investors);
    }
  };
  if (loading || analytics.loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }

  // Guest mode
  if (!user) {
    return <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <GuestPrompt feature="Full Dashboard" description="Create an account to access your personalized dashboard, track progress, connect with mentors, and more." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connect with Mentors</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Find Investors</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Join Community</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background pb-6 relative overflow-x-hidden">
      <DashboardHeader />
      
      <div className="container mx-auto px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 pb-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile: Only Avatar */}
          <div className="md:hidden flex justify-start mb-4">
            <RoleBasedAvatar 
              avatarUrl={profileWithRole?.avatar_url} 
              role={profileWithRole?.role || 'startup'} 
              fallbackText={user?.email || 'U'} 
              className="h-16 w-16" 
            />
          </div>
          
          {/* Desktop: Full Welcome Section */}
          <div className="hidden md:flex items-center space-x-4">
            <RoleBasedAvatar 
              avatarUrl={profileWithRole?.avatar_url} 
              role={profileWithRole?.role || 'startup'} 
              fallbackText={user?.email || 'U'} 
              className="h-16 w-16" 
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
                Welcome, {profileWithRole?.full_name || 'Startup'}
              </h1>
              <p className="text-sm text-muted-foreground">Build, connect, and grow your startup</p>
            </div>
          </div>
        </div>


        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto scrollbar-thin -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto lg:grid lg:w-full lg:grid-cols-11 max-w-7xl whitespace-nowrap">
              <TabsTrigger value="social" className="flex-shrink-0 gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden md:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-shrink-0 gap-2">
                <Network className="h-4 w-4" />
                <span className="hidden md:inline">Network</span>
              </TabsTrigger>
              <TabsTrigger value="pitches" className="flex-shrink-0 gap-2 relative">
                <Presentation className="h-4 w-4" />
                <span className="hidden md:inline">Pitches</span>
                {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.investor_id).length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.investor_id).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="journey" className="flex-shrink-0 gap-2">
                <MapIcon className="h-4 w-4" />
                <span className="hidden md:inline">Journey</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-shrink-0 gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden md:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex-shrink-0 gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden md:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex-shrink-0 gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden md:inline">Jobs</span>
              </TabsTrigger>
              <TabsTrigger value="learn" className="flex-shrink-0 gap-2">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden md:inline">Learn</span>
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

          {/* Social Tab */}
          {activeTab === "social" && (
            <TabsContent value="social" className="space-y-4">
              <UnifiedCommunityFeed showCreatePost={true} />
            </TabsContent>
          )}

          {/* Journey Tab */}
          {activeTab === "journey" && (
            <TabsContent value="journey" className="space-y-4">
              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span>Your Startup Journey</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <StartupRoadmap />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Calendar Tab */}
          {activeTab === "calendar" && (
            <TabsContent value="calendar" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    <CalendarIcon className="h-4 w-4" />
                    <span className="sm:inline">Schedule Meeting</span>
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Meeting Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCreateSessionDialogOpen(true)} className="gap-2">
                    <Users className="h-4 w-4" />
                    <span>Schedule Mentoring Session</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      if (connectedInvestors.length === 0) {
                        toast({
                          title: 'No Connected Investors',
                          description: 'Connect with investors first to schedule pitch meetings',
                          variant: 'destructive',
                        });
                      } else {
                        setCreatePitchDialogOpen(true);
                      }
                    }} 
                    className="gap-2"
                    disabled={connectedInvestors.length === 0}
                  >
                    <Briefcase className="h-4 w-4" />
                    <span>Book Pitch Meeting</span>
                    {connectedInvestors.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {connectedInvestors.length}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setCreateEventDialogOpen(true)} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Create Event</span>
              </Button>
            </div>

            {/* Upcoming Events with Banners */}
            {upcomingEvents.length > 0 && <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <div className="flex gap-4 pb-4">
                      {upcomingEvents.slice(0, 6).map(event => (
                        <div 
                          key={event.id} 
                          className="group cursor-pointer flex-shrink-0 w-[300px] sm:w-[350px]" 
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventDetails(true);
                          }}
                        >
                          <div className="relative overflow-hidden rounded-lg border hover:border-primary transition-all">
                            {event.banner_url ? (
                              <img src={event.banner_url} alt={event.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-48 bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                                <CalendarIcon className="h-16 w-16 text-purple-500/30" />
                              </div>
                            )}
                            <div className="p-4 min-h-[120px] flex flex-col">
                              <h3 className="font-semibold mb-2 line-clamp-1">{event.title}</h3>
                              <div className="space-y-1 text-sm text-muted-foreground flex-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {format(parseISO(event.start_date), 'MMM d, h:mm a')}
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {event.location.startsWith('http') ? (
                                      <a 
                                        href={event.location}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline line-clamp-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {event.location}
                                      </a>
                                    ) : (
                                      <span className="line-clamp-1">{event.location}</span>
                                    )}
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
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>}
            
            <UnifiedCalendar 
              showCreateButton={false} 
              userRole="startup"
              onItemClick={item => {
                if (item.type === 'event') {
                  setSelectedEvent(item);
                  setShowEventDetails(true);
                } else if ((item.type === 'session' || item.type === 'pitch') && item.meeting_link) {
                  window.open(item.meeting_link, '_blank');
                }
              }} 
              filterTypes={['event', 'session', 'pitch']} 
            />
            </TabsContent>
          )}

          {/* Network Tab */}
          {activeTab === "network" && (
            <TabsContent value="network" className="space-y-4">
              <MatchingSystem />
              <NetworkBrowser />
            </TabsContent>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <TabsContent value="profile" className="space-y-4">
              <CompanyProfileManager />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Your Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfilePostsMosaic userId={user?.id || ''} isOwnProfile={true} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Jobs Tab */}
          {activeTab === "jobs" && (
            <TabsContent value="jobs" className="space-y-4">
              <UnifiedJobsBoard />
              <JobTaskManager />
            </TabsContent>
          )}

          {/* Learn Tab */}
          {activeTab === "learn" && (
            <TabsContent value="learn" className="space-y-4">
              <EducationalResources />
            </TabsContent>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <TabsContent value="analytics" className="space-y-4">
              <AnalyticsDashboard />
            </TabsContent>
          )}

          {/* Intelligence Tab */}
          {activeTab === "intelligence" && (
            <TabsContent value="intelligence" className="space-y-4">
              <MarketIntelligenceWidget />
            </TabsContent>
          )}

          {/* Tools Tab */}
          {activeTab === "tools" && (
            <TabsContent value="tools" className="space-y-4">
              
              <AIFeaturesHub />
            </TabsContent>
          )}

          {/* Pitches Tab */}
          {activeTab === "pitches" && (
            <TabsContent value="pitches" className="space-y-8">
              {/* 1. Incoming Pitch Requests (from investors TO startup) */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex-shrink-0">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg">Incoming Requests</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Investor pitch meeting requests</p>
                    </div>
                  </div>
                  {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.investor_id).length > 0 && (
                    <Badge className="bg-amber-500 text-white w-fit text-xs">
                      {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.investor_id).length} pending
                    </Badge>
                  )}
                </div>
                {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.investor_id).length === 0 ? (
                  <div className="text-center py-12 rounded-xl border border-dashed border-muted-foreground/20">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No incoming pitch requests</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.investor_id).map((meeting) => (
                      <PitchMeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        variant="incoming"
                        viewerType="startup"
                        onAccept={handleAcceptPitch}
                        onReject={handleRejectPitch}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Sent Pitch Requests (from startup TO investors) */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex-shrink-0">
                      <Presentation className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg">Sent Requests</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Your pitch requests to investors</p>
                    </div>
                  </div>
                  {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.startup_id).length > 0 && (
                    <Badge variant="secondary" className="w-fit text-xs">
                      {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.startup_id).length} pending
                    </Badge>
                  )}
                </div>
                {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.startup_id).length === 0 ? (
                  <div className="text-center py-12 rounded-xl border border-dashed border-muted-foreground/20">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No pending sent requests</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.startup_id).map((meeting) => (
                      <PitchMeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        variant="sent"
                        viewerType="startup"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Upcoming Pitches (scheduled, future date) */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex-shrink-0">
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg">Upcoming Pitches</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Confirmed pitch meetings</p>
                  </div>
                </div>
                {pitchMeetings.filter(m => m.status === 'scheduled' && new Date(m.scheduled_date) >= new Date()).length === 0 ? (
                  <div className="text-center py-12 rounded-xl border border-dashed border-muted-foreground/20">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No upcoming pitch meetings</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pitchMeetings
                      .filter(m => m.status === 'scheduled' && new Date(m.scheduled_date) >= new Date())
                      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                      .map((meeting) => (
                        <PitchMeetingCard
                          key={meeting.id}
                          meeting={meeting}
                          variant="upcoming"
                          viewerType="startup"
                          onJoin={setActiveVideoUrl}
                        />
                      ))}
                  </div>
                )}
              </div>

              {/* 4. Past Pitches (scheduled/completed, past date) */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-muted/50 flex-shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg">Past Pitches</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Completed meetings history</p>
                  </div>
                </div>
                {pitchMeetings.filter(m => 
                  (m.status === 'scheduled' || m.status === 'completed') && 
                  new Date(m.scheduled_date) < new Date()
                ).length === 0 ? (
                  <div className="text-center py-12 rounded-xl border border-dashed border-muted-foreground/20">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No past pitch meetings</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pitchMeetings
                      .filter(m => 
                        (m.status === 'scheduled' || m.status === 'completed') && 
                        new Date(m.scheduled_date) < new Date()
                      )
                      .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
                      .map((meeting) => (
                        <PitchMeetingCard
                          key={meeting.id}
                          meeting={meeting}
                          variant="past"
                          viewerType="startup"
                        />
                      ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Floating Buttons */}
      <FloatingChat />

      {/* Video Meeting Dialog */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="relative w-full h-full">
            <Button 
              variant="outline" 
              className="absolute top-4 right-4 z-10"
              onClick={() => setActiveVideoUrl(undefined)}
            >
              <X className="h-4 w-4 mr-2" />
              Leave Meeting
            </Button>
            <iframe
              src={activeVideoUrl}
              allow="camera; microphone; fullscreen; speaker; display-capture"
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateEventDialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen} onEventCreated={() => {
      setCreateEventDialogOpen(false);
    }} />
      <CreateSessionDialog open={createSessionDialogOpen} onOpenChange={setCreateSessionDialogOpen} onSessionCreated={() => {
      setCreateSessionDialogOpen(false);
    }} />
      {selectedEvent && <EventDetailsDialog event={selectedEvent} open={showEventDetails} onOpenChange={setShowEventDetails} onEventUpdated={() => {
      setShowEventDetails(false);
    }} />}
      {companyId && companyName && (
        <CreatePitchMeetingDialog
          open={createPitchDialogOpen}
          onOpenChange={setCreatePitchDialogOpen}
          companyId={companyId}
          companyName={companyName}
        />
      )}
    </div>;
};
export default Dashboard;