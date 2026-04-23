import NvidiaInceptionCard from '@/components/NvidiaInceptionCard';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import StartupRoadmap from '@/components/StartupRoadmap';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import FloatingChat from '@/components/FloatingChat';
import MatchingSystem from '@/components/MatchingSystem';
import EducationalResources from '@/components/EducationalResources';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { IntelligenceHub } from '@/components/intelligence/IntelligenceHub';
import CompanyProfileManager from '@/components/CompanyProfileManager';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import UnifiedJobsBoard from '@/components/UnifiedJobsBoard';
import ProfilePostsMosaic from '@/components/ProfilePostsMosaic';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import JobTaskManager from '@/components/JobTaskManager';
import ManageJobPosts from '@/components/ManageJobPosts';
import CreatePitchMeetingDialog from '@/components/CreatePitchMeetingDialog';
import PitchMeetingCard from '@/components/PitchMeetingCard';
import StartupMentorshipOffers from '@/components/StartupMentorshipOffers';
import StartupActiveMentors from '@/components/StartupActiveMentors';
import StartupMentoringSessions from '@/components/StartupMentoringSessions';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import BookingsList from '@/components/BookingsList';
import BookingLinkBar from '@/components/BookingLinkBar';
import UserMeetingsList from '@/components/UserMeetingsList';
import { Plus, Target, Calendar as CalendarIcon, Clock, MapPin, Users, MessageCircle, Network, Map as MapIcon, Briefcase, GraduationCap, BarChart, Brain, Wrench, ChevronDown, Presentation, Sparkles, History, Globe, Bell, X, Rocket, ExternalLink, FileText } from "lucide-react";

import { CohortApplicationDialog } from '@/components/accelerator/CohortApplicationDialog';
import { getIndustryLabel } from '@/lib/constants';
import LiveRooms from '@/components/LiveRooms';
import DistrictRooms from '@/components/DistrictRooms';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import GuestPrompt from '@/components/GuestPrompt';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { useStartupAnalytics } from '@/hooks/useStartupAnalytics';
import { useRoadmapProgress } from '@/hooks/useRoadmapProgress';
import { useEvents } from '@/hooks/useEvents';
import { useEventPaymentVerification } from '@/hooks/useEventPaymentVerification';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || "social");

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
  const analytics = useStartupAnalytics();
  const roadmapProgress = useRoadmapProgress();
  const {
    upcomingEvents,
    refetch: refetchEvents
  } = useEvents();
  useEventPaymentVerification(refetchEvents);
  const navigate = useNavigate();
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [createPitchDialogOpen, setCreatePitchDialogOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [connectedInvestors, setConnectedInvestors] = useState<Array<{id: string;name: string;}>>([]);
  const [pitchMeetings, setPitchMeetings] = useState<any[]>([]);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | undefined>();
  const [openCohorts, setOpenCohorts] = useState<any[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<any>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  // Track counts for mentorship sections to hide empty ones
  const [pendingOffersCount, setPendingOffersCount] = useState(0);
  const [activeMentorsCount, setActiveMentorsCount] = useState(0);
  const [upcomingSessionsCount, setUpcomingSessionsCount] = useState(0);
  const [pastSessionsCount, setPastSessionsCount] = useState(0);
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

  // Fetch open accelerator cohorts
  useEffect(() => {
    const fetchOpenCohorts = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('accelerator_cohorts')
        .select('*, accelerator_profiles(organization_name, logo_url, user_id, external_link)')
        .eq('status', 'applications_open')
        .gte('start_date', today)
        .order('application_deadline', { ascending: true });
      setOpenCohorts(data || []);
    };
    fetchOpenCohorts();
  }, []);

  const fetchPitchMeetings = async () => {
    if (!user) return;

    const { data, error } = await supabase.
    from('pitch_meetings').
    select(`
        *,
        company:companies(name, logo_url)
      `).
    eq('startup_id', user.id).
    order('scheduled_date', { ascending: true });

    if (!error && data) {
      // Fetch investor profiles separately
      const investorIds = [...new Set(data.map((m) => m.investor_id))];
      const { data: profiles } = await supabase.
      from('profiles').
      select('user_id, full_name, avatar_url').
      in('user_id', investorIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      const enrichedData = data.map((meeting) => ({
        ...meeting,
        investor: profileMap.get(meeting.investor_id) || { full_name: 'Unknown', avatar_url: null }
      }));

      setPitchMeetings(enrichedData);
    }
  };

  const handleAcceptPitch = async (pitchId: string) => {
    try {
      const { error } = await supabase.
      from('pitch_meetings').
      update({ status: 'scheduled' }).
      eq('id', pitchId);

      if (error) throw error;

      toast({
        title: 'Pitch Accepted',
        description: 'The investor has been notified'
      });

      const meeting = pitchMeetings.find((m) => m.id === pitchId);
      if (meeting) {
        await supabase.from('notifications').insert({
          user_id: meeting.investor_id,
          title: 'Pitch Meeting Accepted',
          message: `Your pitch meeting request has been accepted`,
          type: 'success'
        });
      }

      fetchPitchMeetings();
    } catch (error) {
      console.error('Error accepting pitch:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept pitch meeting',
        variant: 'destructive'
      });
    }
  };

  const handleRejectPitch = async (pitchId: string) => {
    try {
      const { error } = await supabase.
      from('pitch_meetings').
      update({ status: 'cancelled' }).
      eq('id', pitchId);

      if (error) throw error;

      toast({
        title: 'Pitch Declined',
        description: 'The investor has been notified'
      });

      const meeting = pitchMeetings.find((m) => m.id === pitchId);
      if (meeting) {
        await supabase.from('notifications').insert({
          user_id: meeting.investor_id,
          title: 'Pitch Meeting Declined',
          message: `Your pitch meeting request was declined`,
          type: 'info'
        });
      }

      fetchPitchMeetings();
    } catch (error) {
      console.error('Error rejecting pitch:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline pitch meeting',
        variant: 'destructive'
      });
    }
  };

  const handleOutcomeChange = async (pitchId: string, outcome: string | null) => {
    try {
      const { error } = await supabase.
      from('pitch_meetings').
      update({ outcome }).
      eq('id', pitchId);

      if (error) throw error;

      toast({
        title: 'Outcome Updated',
        description: `Pitch marked as "${outcome?.replace('_', ' ') || 'unmarked'}"`
      });

      setPitchMeetings((prev) =>
      prev.map((m) => m.id === pitchId ? { ...m, outcome } : m)
      );
    } catch (error) {
      console.error('Error updating outcome:', error);
      toast({
        title: 'Error',
        description: 'Failed to update pitch outcome',
        variant: 'destructive'
      });
    }
  };

  const fetchCompanyInfo = async () => {
    if (!user) return;

    const { data } = await supabase.
    from('companies').
    select('id, name').
    eq('user_id', user.id).
    maybeSingle();

    if (data) {
      setCompanyId(data.id);
      setCompanyName(data.name);

      // Fetch connected investors who have invested
      const { data: investments } = await supabase.
      from('investments').
      select('investor_id, profiles(full_name)').
      eq('company_id', data.id).
      eq('status', 'active');

      const investors = (investments || []).map((inv) => ({
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
            className="h-16 w-16" />

          </div>
          
          {/* Desktop: Full Welcome Section */}
          <div className="hidden md:flex items-center space-x-4">
            <RoleBasedAvatar
            avatarUrl={profileWithRole?.avatar_url}
            role={profileWithRole?.role || 'startup'}
            fallbackText={user?.email || 'U'}
            className="h-16 w-16" />

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
            <TabsList className="flex w-full whitespace-nowrap tech-card border-0 p-1.5 sm:p-1 gap-1 h-auto">
              <TabsTrigger value="social" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.social')}</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Globe className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.resources')}</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Wrench className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.tools')}</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Network className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">My Connections</span>
              </TabsTrigger>
              <TabsTrigger value="learn" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <GraduationCap className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.learn')}</span>
              </TabsTrigger>
              <TabsTrigger value="meetings" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Presentation className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.meetings')}</span>
              </TabsTrigger>
              {/* Calendar tab moved to top-right header icon bar (next to clock) */}
              <TabsTrigger value="intelligence" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Brain className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.intelligence')}</span>
              </TabsTrigger>
              <TabsTrigger value="journey" data-tour="journey-tab" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <MapIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.journey')}</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <BarChart className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.analytics')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Social Tab */}
          {activeTab === "social" &&
        <TabsContent value="social" className="space-y-4">
              <UnifiedCommunityFeed showCreatePost={true} interstitialContent={<DistrictRooms />} interstitialAfterIndex={3} />
            </TabsContent>
        }

          {/* Journey Tab */}
          {activeTab === "journey" &&
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
        }

          {/* Calendar Tab */}
          {activeTab === "calendar" &&
        <TabsContent value="calendar" className="space-y-4">
            {/* Booking link — quick access at top of Calendar */}
            <BookingLinkBar />

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
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
                        variant: 'destructive'
                      });
                    } else {
                      setCreatePitchDialogOpen(true);
                    }
                  }}
                  className="gap-2"
                  disabled={connectedInvestors.length === 0}>

                    <Briefcase className="h-4 w-4" />
                    <span>Book Pitch Meeting</span>
                    {connectedInvestors.length > 0 &&
                  <Badge variant="secondary" className="ml-auto">
                        {connectedInvestors.length}
                      </Badge>
                  }
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setCreateEventDialogOpen(true)} data-tour="create-event" className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Create Event</span>
              </Button>
            </div>

            {/* Unified Calendar — now the top calendar section */}
            <UnifiedCalendar
            showCreateButton={false}
            userRole="startup"
            onItemClick={(item) => {
              if (item.type === 'event') {
                setSelectedEvent(item);
                setShowEventDetails(true);
              } else if ((item.type === 'session' || item.type === 'pitch') && item.meeting_link) {
                window.open(item.meeting_link, '_blank');
              }
            }}
            filterTypes={['event', 'session', 'pitch', 'accelerator', 'booking']} />

            {/* Upcoming Events with Banners */}
            {upcomingEvents.length > 0 && <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <div className="flex gap-4 pb-4">
                      {upcomingEvents.slice(0, 6).map((event) =>
                  <div
                    key={event.id}
                    className="group cursor-pointer flex-shrink-0 w-[300px] sm:w-[350px]"
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowEventDetails(true);
                    }}>

                          <div className="relative overflow-hidden rounded-lg border hover:border-primary transition-all">
                            {event.banner_url ?
                      <img src={event.banner_url} alt={event.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" /> :

                      <div className="w-full h-48 bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                                <CalendarIcon className="h-16 w-16 text-purple-500/30" />
                              </div>
                      }
                            <div className="p-4 min-h-[120px] flex flex-col">
                              <h3 className="font-semibold mb-2 line-clamp-1">{event.title}</h3>
                              <div className="space-y-1 text-sm text-muted-foreground flex-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {format(parseISO(event.start_date), 'MMM d, h:mm a')}
                                </div>
                                {event.location &&
                          <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {event.location.startsWith('http') ?
                            <a
                              href={event.location}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline line-clamp-1"
                              onClick={(e) => e.stopPropagation()}>

                                        {event.location}
                                      </a> :

                            <span className="line-clamp-1">{event.location}</span>
                            }
                                  </div>
                          }
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  {event.attendees} attending
                                  {event.max_attendees && ` / ${event.max_attendees}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                  )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>}

            {/* Upcoming Accelerator Programs */}
            {(
              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-emerald-500" />
                    Upcoming Accelerator Programs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <div className="flex gap-4 pb-4">
                      <NvidiaInceptionCard />
                      {openCohorts.map(cohort => {
                        const spotsLeft = (cohort.max_startups || 0) - (cohort.current_startups || 0);
                        return (
                          <div key={cohort.id} className="flex-shrink-0 w-[320px] sm:w-[380px]">
                            <div className="rounded-lg border hover:border-emerald-500/50 transition-all p-4 space-y-3 h-full flex flex-col cursor-pointer"
                              onClick={() => {
                                setSelectedCohort({
                                  cohort_id: cohort.id,
                                  name: cohort.name,
                                  description: cohort.description,
                                  deadline: cohort.application_deadline,
                                  funding: cohort.funding_per_startup,
                                  equity: cohort.equity_percentage,
                                  enrollment_fee: cohort.enrollment_fee,
                                  industries: cohort.focus_industries,
                                  accelerator_name: cohort.accelerator_profiles?.organization_name,
                                  accelerator_logo: cohort.accelerator_profiles?.logo_url,
                                });
                                setShowApplicationDialog(true);
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {cohort.accelerator_profiles?.logo_url ? (
                                  <img src={cohort.accelerator_profiles.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <Rocket className="h-5 w-5 text-emerald-500" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold line-clamp-1">{cohort.name}</h3>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {cohort.accelerator_profiles?.organization_name}
                                  </p>
                                </div>
                              </div>

                              {cohort.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{cohort.description}</p>
                              )}

                              <div className="space-y-1 text-xs text-muted-foreground">
                                {cohort.start_date && (
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-3 w-3" />
                                    Starts: {format(parseISO(cohort.start_date), 'MMM d, yyyy')}
                                  </div>
                                )}
                                {cohort.application_deadline && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-orange-500" />
                                    Deadline: {format(parseISO(cohort.application_deadline), 'MMM d, yyyy')}
                                  </div>
                                )}
                                {cohort.max_startups && (
                                  <div className="flex items-center gap-2">
                                    <Users className="h-3 w-3" />
                                    {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                                  </div>
                                )}
                              </div>

                              {cohort.focus_industries && cohort.focus_industries.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {cohort.focus_industries.slice(0, 3).map((ind: string) => (
                                    <Badge key={ind} variant="outline" className="text-[10px] px-1.5 py-0">
                                      {getIndustryLabel(ind)}
                                    </Badge>
                                  ))}
                                  {cohort.focus_industries.length > 3 && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                      +{cohort.focus_industries.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-2 mt-auto pt-2">
                                <Button
                                  size="sm"
                                  className="flex-1 gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCohort({
                                      cohort_id: cohort.id,
                                      name: cohort.name,
                                      description: cohort.description,
                                      deadline: cohort.application_deadline,
                                      funding: cohort.funding_per_startup,
                                      equity: cohort.equity_percentage,
                                      enrollment_fee: cohort.enrollment_fee,
                                      industries: cohort.focus_industries,
                                      accelerator_name: cohort.accelerator_profiles?.organization_name,
                                      accelerator_logo: cohort.accelerator_profiles?.logo_url,
                                    });
                                    setShowApplicationDialog(true);
                                  }}
                                >
                                  <Rocket className="h-3 w-3" />
                                  Apply
                                </Button>
                                {cohort.accelerator_profiles?.external_link && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(cohort.accelerator_profiles.external_link, '_blank');
                                    }}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Bookings are surfaced directly inside <UnifiedCalendar /> above
                as 'booking' items — no separate list needed. */}

            </TabsContent>
        }

          {/* Network Tab — My Connections (with Jobs sub-tab) */}
          {activeTab === "network" &&
        <TabsContent value="network" className="space-y-4">
              <Tabs defaultValue="connections" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                  <TabsTrigger value="connections" className="gap-2">
                    <Network className="h-4 w-4" />
                    My Connections
                  </TabsTrigger>
                  <TabsTrigger value="jobs" className="gap-2">
                    <Briefcase className="h-4 w-4" />
                    Jobs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="connections" className="space-y-4">
                  <MatchingSystem />
                </TabsContent>

                <TabsContent value="jobs" className="space-y-4">
                  <Tabs defaultValue="opportunities" className="w-full">
                    <TabsList className="grid w-full max-w-lg grid-cols-3 mb-6">
                      <TabsTrigger value="opportunities">Job Opportunities</TabsTrigger>
                      <TabsTrigger value="manage-posts">Manage Job Posts</TabsTrigger>
                      <TabsTrigger value="manage-tasks">Manage Tasks</TabsTrigger>
                    </TabsList>

                    <TabsContent value="opportunities">
                      <UnifiedJobsBoard />
                    </TabsContent>
                    <TabsContent value="manage-posts">
                      <ManageJobPosts />
                    </TabsContent>
                    <TabsContent value="manage-tasks">
                      <JobTaskManager />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>
            </TabsContent>
        }

          {/* Profile Tab */}
          {activeTab === "profile" &&
        <TabsContent value="profile" className="space-y-4">
              <CompanyProfileManager />
            </TabsContent>
        }

          {/* Learn Tab */}
          {activeTab === "learn" &&
        <TabsContent value="learn" className="space-y-4">
              <EducationalResources />
            </TabsContent>
        }

          {/* Analytics Tab */}
          {activeTab === "analytics" &&
        <TabsContent value="analytics" className="space-y-4">
              <AnalyticsDashboard />
            </TabsContent>
        }

          {/* Intelligence Tab */}
          {activeTab === "intelligence" &&
        <TabsContent value="intelligence" className="space-y-4">
              <IntelligenceHub />
            </TabsContent>
        }

          {/* Tools Tab */}
          {activeTab === "tools" &&
        <TabsContent value="tools" className="space-y-4">
              
              <AIFeaturesHub />
            </TabsContent>
        }

          {/* Meetings Tab */}
          {activeTab === "meetings" && (() => {
          // Activity-first helpers
          const incomingCount = pitchMeetings.filter((m) => m.status === 'pending' && m.host_id === m.investor_id).length;
          const sentCount = pitchMeetings.filter((m) => m.status === 'pending' && m.host_id === m.startup_id).length;
          const upcomingCount = pitchMeetings.filter((m) => m.status === 'scheduled' && new Date(m.scheduled_date) >= new Date()).length;
          const pastPitchCount = pitchMeetings.filter((m) => (m.status === 'scheduled' || m.status === 'completed') && new Date(m.scheduled_date) < new Date()).length;

          type Section = {key: string;hasContent: boolean;element: JSX.Element;};

          const pitchSections: Section[] = [
          {
            key: 'incoming',
            hasContent: incomingCount > 0,
            element:
            <Collapsible key="incoming" defaultOpen className="tech-card rounded-xl border-0">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Bell className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-medium">Incoming Requests</h3>
                          <p className="text-xs text-muted-foreground">From investors</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {incomingCount > 0 && <Badge className="bg-amber-500 text-white border-0 text-xs">{incomingCount} new</Badge>}
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      {incomingCount === 0 ?
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">No incoming requests</p>
                        </div> :

                <div className="grid gap-3">
                          {pitchMeetings.filter((m) => m.status === 'pending' && m.host_id === m.investor_id).map((meeting) =>
                  <PitchMeetingCard key={meeting.id} meeting={meeting} variant="incoming" viewerType="startup" onAccept={handleAcceptPitch} onReject={handleRejectPitch} />
                  )}
                        </div>
                }
                    </CollapsibleContent>
                  </Collapsible>

          },
          {
            key: 'sent',
            hasContent: sentCount > 0,
            element:
            <Collapsible key="sent" defaultOpen className="tech-card rounded-xl border-0">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Presentation className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-medium">Sent Requests</h3>
                          <p className="text-xs text-muted-foreground">Awaiting response</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sentCount > 0 && <Badge variant="secondary" className="text-xs">{sentCount} pending</Badge>}
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      {sentCount === 0 ?
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">No pending requests</p>
                        </div> :

                <div className="grid gap-3">
                          {pitchMeetings.filter((m) => m.status === 'pending' && m.host_id === m.startup_id).map((meeting) =>
                  <PitchMeetingCard key={meeting.id} meeting={meeting} variant="sent" viewerType="startup" />
                  )}
                        </div>
                }
                    </CollapsibleContent>
                  </Collapsible>

          },
          {
            key: 'upcoming',
            hasContent: upcomingCount > 0,
            element:
            <Collapsible key="upcoming" defaultOpen className="tech-card rounded-xl border-0">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <CalendarIcon className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-medium">Upcoming Pitches</h3>
                          <p className="text-xs text-muted-foreground">Confirmed meetings</p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      {upcomingCount === 0 ?
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
                          <p className="text-sm text-muted-foreground">No upcoming pitches</p>
                        </div> :

                <div className="grid gap-3">
                          {pitchMeetings.filter((m) => m.status === 'scheduled' && new Date(m.scheduled_date) >= new Date()).
                  sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()).
                  map((meeting) =>
                  <PitchMeetingCard key={meeting.id} meeting={meeting} variant="upcoming" viewerType="startup" onJoin={setActiveVideoUrl} />
                  )}
                        </div>
                }
                    </CollapsibleContent>
                  </Collapsible>

          },
          // Past pitches are consolidated into the unified "Past Sessions, Pitches & Transcripts" card below.
          ].
          sort((a, b) => Number(b.hasContent) - Number(a.hasContent));

          const mentorSections: Section[] = [
          {
            key: 'pending-offers',
            hasContent: pendingOffersCount > 0,
            element:
            <Collapsible key="pending-offers" defaultOpen className="tech-card rounded-xl border-0">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-medium">Pending Offers</h3>
                          <p className="text-xs text-muted-foreground">From mentors & advisors</p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <StartupMentorshipOffers onOfferHandled={fetchPitchMeetings} onCountChange={setPendingOffersCount} />
                    </CollapsibleContent>
                  </Collapsible>

          },
          {
            key: 'active-mentors',
            hasContent: activeMentorsCount > 0,
            element:
            <Collapsible key="active-mentors" defaultOpen className="tech-card rounded-xl border-0">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-medium">Active Mentors</h3>
                          <p className="text-xs text-muted-foreground">Your current mentors</p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <StartupActiveMentors onJoin={setActiveVideoUrl} onCountChange={setActiveMentorsCount} />
                    </CollapsibleContent>
                  </Collapsible>

          },
          {
            key: 'upcoming-sessions',
            hasContent: upcomingSessionsCount > 0,
            element:
            <Collapsible key="upcoming-sessions" defaultOpen className="tech-card rounded-xl border-0">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <CalendarIcon className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-medium">Upcoming Sessions</h3>
                          <p className="text-xs text-muted-foreground">Scheduled mentoring</p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <StartupMentoringSessions type="upcoming" onJoin={setActiveVideoUrl} onCountChange={setUpcomingSessionsCount} />
                    </CollapsibleContent>
                  </Collapsible>

          },
          {
            key: 'past-sessions',
            hasContent: pastSessionsCount > 0,
            element:
            <Collapsible key="past-sessions" defaultOpen className="tech-card rounded-xl border-0">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <History className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-medium">Past Sessions</h3>
                          <p className="text-xs text-muted-foreground">Rate your experience</p>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <StartupMentoringSessions type="past" onSessionUpdated={fetchPitchMeetings} onCountChange={setPastSessionsCount} />
                    </CollapsibleContent>
                  </Collapsible>

          }];

          // Sort with content first; render all so child components mount and report counts.
          const sortedPitch = [...pitchSections].sort((a, b) => Number(b.hasContent) - Number(a.hasContent));
          const sortedMentor = [...mentorSections].sort((a, b) => Number(b.hasContent) - Number(a.hasContent));
          const anyPitchContent = pitchSections.some((s) => s.hasContent);
          const anyMentorContent = mentorSections.some((s) => s.hasContent);

          return (
            <TabsContent value="meetings" className="space-y-6">
                {/* Quick action: Create a new meeting */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 tech-card border-0 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Create a New Meeting</h3>
                      <p className="text-xs text-muted-foreground">Schedule mentoring or pitch sessions in seconds</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="gap-2 w-full sm:w-auto">
                          <Plus className="h-4 w-4" />
                          New Meeting
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-60">
                        <DropdownMenuLabel>Meeting Type</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setCreateSessionDialogOpen(true)} className="gap-2">
                          <Users className="h-4 w-4" />
                          <span>Mentoring Session</span>
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
                          <span>Pitch Meeting</span>
                          {connectedInvestors.length > 0 && (
                            <Badge variant="secondary" className="ml-auto">{connectedInvestors.length}</Badge>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCreateEventDialogOpen(true)} className="gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Event</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Live Rooms + Village Rooms */}
                <LiveRooms />

                {/* Unified Sessions & Recordings — every meeting the user has, with transcripts/translation/lightpaper */}
                <Card className="tech-card border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-5 w-5 text-primary" />
                      Your Sessions & Transcripts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UserMeetingsList defaultFilter="all" />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                  {/* Left Column: Investor Pitches — activity sorted, hidden sections kept mounted for count tracking */}
                  <div className="space-y-5">
                    <div className={`flex items-center gap-3 ${anyPitchContent ? '' : 'hidden'}`}>
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Presentation className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Investor Pitches</h2>
                        <p className="text-xs text-muted-foreground">Manage meetings with investors</p>
                      </div>
                    </div>
                    {sortedPitch.map((s) => (
                      <div key={s.key} className={s.hasContent ? '' : 'hidden'}>{s.element}</div>
                    ))}
                  </div>

                  {/* Right Column: Mentorship — activity sorted, hidden sections kept mounted for count tracking */}
                  <div className="space-y-5">
                    <div className={`flex items-center gap-3 ${anyMentorContent ? '' : 'hidden'}`}>
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Mentorship</h2>
                        <p className="text-xs text-muted-foreground">Your mentor & advisor network</p>
                      </div>
                    </div>
                    {sortedMentor.map((s) => (
                      <div key={s.key} className={s.hasContent ? '' : 'hidden'}>{s.element}</div>
                    ))}
                  </div>
                </div>
              </TabsContent>);

        })()}

          {/* Resources Tab */}
          {activeTab === "resources" &&
        <TabsContent value="resources" className="mt-0 relative overflow-hidden" style={{ height: 'calc(100vh - 12rem)', minHeight: '500px' }}>
              <div className="absolute inset-0">
                <GlobalResourcesMap />
              </div>
            </TabsContent>
        }
        </Tabs>
      </div>

      {/* Floating Buttons */}
      <FloatingChat />

      {/* Video Meeting Dialog */}
      {activeVideoUrl &&
    <div className="fixed inset-0 z-50 bg-background">
          <div className="relative w-full h-full">
            <Button
          variant="outline"
          className="absolute top-4 right-4 z-10"
          onClick={() => setActiveVideoUrl(undefined)}>

              <X className="h-4 w-4 mr-2" />
              Leave Meeting
            </Button>
            <iframe
          src={activeVideoUrl}
          allow="camera; microphone; fullscreen; speaker; display-capture"
          className="w-full h-full" />

          </div>
        </div>
    }

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
      {companyId && companyName &&
    <CreatePitchMeetingDialog
      open={createPitchDialogOpen}
      onOpenChange={setCreatePitchDialogOpen}
      companyId={companyId}
      companyName={companyName} />

    }
      <CohortApplicationDialog
        open={showApplicationDialog}
        onOpenChange={setShowApplicationDialog}
        cohortData={selectedCohort}
        onApplicationSubmitted={() => setShowApplicationDialog(false)}
      />
    </div>;
};
export default Dashboard;