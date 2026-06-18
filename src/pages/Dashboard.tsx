import NvidiaInceptionCard from '@/components/NvidiaInceptionCard';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import StartupRoadmap from '@/components/StartupRoadmap';
import AIFeaturesHub from '@/components/AIFeaturesHub';

import MatchingSystem from '@/components/MatchingSystem';
import EducationalResources from '@/components/EducationalResources';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { IntelligenceHub } from '@/components/intelligence/IntelligenceHub';
import CompanyProfileManager from '@/components/CompanyProfileManager';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import UpcomingFeed from '@/components/UpcomingFeed';
import { CreateEventDialog } from '@/components/CreateEventDialog';

import ProfilePostsMosaic from '@/components/ProfilePostsMosaic';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import JobsSection from '@/components/JobsSection';
import CreatePitchMeetingDialog from '@/components/CreatePitchMeetingDialog';
import PitchMeetingCard from '@/components/PitchMeetingCard';
import PitchMeetingsSection from '@/components/PitchMeetingsSection';
import MentorshipSection from '@/components/MentorshipSection';
import MeetingsTwoLane from '@/components/MeetingsTwoLane';
import StartupMentorshipOffers from '@/components/StartupMentorshipOffers';
import StartupActiveMentors from '@/components/StartupActiveMentors';
import StartupMentoringSessions from '@/components/StartupMentoringSessions';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import BookingsList from '@/components/BookingsList';
import BookingLinkBar from '@/components/BookingLinkBar';
import MeetingTranscriptDialog, { type MeetingTranscriptMeta } from '@/components/MeetingTranscriptDialog';
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
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | undefined>(undefined);
  // Track counts for mentorship sections to hide empty ones
  const [pendingOffersCount, setPendingOffersCount] = useState(0);
  const [activeMentorsCount, setActiveMentorsCount] = useState(0);
  const [upcomingSessionsCount, setUpcomingSessionsCount] = useState(0);
  const [pastSessionsCount, setPastSessionsCount] = useState(0);
  // Transcript dialog (shared across past pitches & past mentoring sessions)
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [transcriptMeta, setTranscriptMeta] = useState<MeetingTranscriptMeta | null>(null);
  const openPitchTranscript = (meeting: any) => {
    setTranscriptMeta({
      meeting_id: meeting.id,
      meeting_type: 'pitch_meeting',
      host_id: meeting.host_id || meeting.investor_id,
      participant_ids: [meeting.startup_id, meeting.investor_id].filter(Boolean),
      title: `Pitch • ${meeting.investor?.full_name || meeting.company?.name || 'Meeting'}`,
    });
    setTranscriptOpen(true);
  };
  const openMentorshipTranscript = (session: { id: string; topic?: string; mentor_id?: string; mentor: { full_name: string } }) => {
    setTranscriptMeta({
      meeting_id: session.id,
      meeting_type: 'mentoring_session',
      host_id: session.mentor_id || '',
      participant_ids: [session.mentor_id, user?.id].filter(Boolean) as string[],
      title: session.topic || `Mentoring • ${session.mentor?.full_name || ''}`,
    });
    setTranscriptOpen(true);
  };
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
            <TabsList className="relative flex w-full whitespace-nowrap items-center gap-1 p-1.5 h-auto bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl">
              {([
                { value: 'social',       icon: MessageCircle,  label: t('nav.social') },
                { value: 'resources',    icon: Globe,          label: t('nav.resources') },
                { value: 'tools',        icon: Wrench,         label: t('nav.tools') },
                { value: 'network',      icon: Network,        label: 'My Connections' },
                { value: 'learn',        icon: GraduationCap,  label: t('nav.learn') },
                { value: 'meetings',     icon: Presentation,   label: t('nav.meetings') },
                { value: 'intelligence', icon: Brain,          label: t('nav.intelligence') },
                { value: 'journey',      icon: MapIcon,        label: t('nav.journey'), dataTour: 'journey-tab' },
                { value: 'analytics',    icon: BarChart,       label: t('nav.analytics') },
              ] as Array<{ value: string; icon: any; label: string; dataTour?: string }>).map(({ value, icon: Icon, label, dataTour }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  data-tour={dataTour}
                  className="relative group flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-transparent text-zinc-400 transition-all duration-500 hover:text-zinc-100 hover:bg-white/5 hover:border-white/5 data-[state=active]:bg-white/10 data-[state=active]:border-white/15 data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_22px_-5px_hsl(var(--primary)/0.55),0_0_40px_-12px_hsl(var(--accent)/0.4)] data-[state=active]:[&_.tab-underline]:opacity-100"
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                  <span className="hidden md:inline text-sm font-medium tracking-wide">{label}</span>
                  <span className="tab-underline pointer-events-none absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 transition-opacity duration-500" />
                </TabsTrigger>
              ))}
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
              <StartupRoadmap />
            </TabsContent>
        }

          {/* Calendar Tab */}
          {activeTab === "calendar" &&
        <TabsContent value="calendar" className="space-y-5">
            {/* Futuristic hero header */}
            <div className="relative overflow-hidden rounded-2xl tech-card border-0 p-5 md:p-6">
              <div className="absolute inset-0 pointer-events-none opacity-60">
                <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
              </div>
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-accent/30 flex items-center justify-center ring-1 ring-primary/30">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Calendar
                      </h2>
                      <Badge variant="secondary" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
                        <Sparkles className="h-3 w-3" /> LIVE
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      Sessions, pitches, events and bookings — unified.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2 h-10 rounded-xl bg-background/40 backdrop-blur-xl border-border/60 w-full sm:w-auto">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Schedule</span>
                        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
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
                              variant: 'destructive'
                            });
                          } else {
                            setCreatePitchDialogOpen(true);
                          }
                        }}
                        className="gap-2"
                        disabled={connectedInvestors.length === 0}>
                        <Briefcase className="h-4 w-4" />
                        <span>Pitch Meeting</span>
                        {connectedInvestors.length > 0 &&
                          <Badge variant="secondary" className="ml-auto">{connectedInvestors.length}</Badge>
                        }
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    onClick={() => setCreateEventDialogOpen(true)}
                    data-tour="create-event"
                    className="gap-2 h-10 px-4 rounded-xl bg-gradient-to-br from-primary to-primary/70 hover:opacity-90 shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] w-full sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Event</span>
                  </Button>
                </div>
              </div>

              {/* Booking link bar embedded */}
              <div className="relative mt-4">
                <BookingLinkBar
                  selectedDate={calendarSelectedDate}
                  onClearDate={() => setCalendarSelectedDate(undefined)}
                />
              </div>
            </div>

            {/* Unified Calendar with UpcomingFeed as side panel */}
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
              filterTypes={['event', 'session', 'pitch', 'accelerator', 'booking']}
              onSelectedDateChange={setCalendarSelectedDate}
              sidePanel={
                <UpcomingFeed
                  events={upcomingEvents}
                  cohorts={openCohorts}
                  selectedDate={calendarSelectedDate}
                  onClearDate={() => setCalendarSelectedDate(undefined)}
                  onEventClick={(event) => {
                    setSelectedEvent(event);
                    setShowEventDetails(true);
                  }}
                  onCohortApply={(cohort) => {
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
                />
              }

            />
            </TabsContent>

        }

          {/* Network Tab — My Connections (with Jobs sub-tab) */}
          {activeTab === "network" &&
        <TabsContent value="network" className="space-y-6">
              <Tabs defaultValue="connections" className="w-full">
                {/* Futuristic hero header */}
                <div className="relative overflow-hidden rounded-2xl tech-card border-0 p-5 md:p-6 mb-5">
                  <div className="absolute inset-0 pointer-events-none opacity-60">
                    <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                    <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
                  </div>
                  <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-accent/30 flex items-center justify-center ring-1 ring-primary/30">
                        <Network className="h-6 w-6 text-primary" />
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Network Grid
                          </h2>
                          <Badge variant="secondary" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
                            <Sparkles className="h-3 w-3" />
                            LIVE
                          </Badge>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          Connect with founders, mentors, investors — and discover opportunities.
                        </p>
                      </div>
                    </div>

                    {/* Neon segmented control */}
                    <TabsList className="relative h-12 p-1 rounded-2xl bg-background/40 backdrop-blur-xl border border-border/50 grid grid-cols-2 w-full md:w-auto">
                      <TabsTrigger
                        value="connections"
                        className="relative gap-2 rounded-xl h-full px-5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/70 data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_20px_-2px_hsl(var(--primary)/0.5)] transition-all"
                      >
                        <Network className="h-4 w-4" />
                        <span className="text-sm font-medium">Connections</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="jobs"
                        className="relative gap-2 rounded-xl h-full px-5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent data-[state=active]:to-accent/70 data-[state=active]:text-accent-foreground data-[state=active]:shadow-[0_0_20px_-2px_hsl(var(--accent)/0.5)] transition-all"
                      >
                        <Briefcase className="h-4 w-4" />
                        <span className="text-sm font-medium">Jobs</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                <TabsContent value="connections" className="space-y-4 animate-fade-in">
                  <MatchingSystem />
                </TabsContent>

                <TabsContent value="jobs" className="space-y-4 animate-fade-in">
                  <JobsSection />
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
          {activeTab === "meetings" && (
            <TabsContent value="meetings" className="space-y-6">
              {/* Futuristic hero header */}
              <div className="relative overflow-hidden rounded-2xl tech-card border-0 p-5 md:p-6">
                <div className="absolute inset-0 pointer-events-none opacity-60">
                  <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                  <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
                </div>
                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-accent/30 flex items-center justify-center ring-1 ring-primary/30">
                      <CalendarIcon className="h-6 w-6 text-primary" />
                      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          Meetings Hub
                        </h2>
                        <Badge variant="secondary" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
                          <Sparkles className="h-3 w-3" />
                          LIVE
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        Pitches, mentoring & events — orchestrated in one stream.
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="gap-1.5 h-10 px-4 rounded-xl shrink-0 bg-gradient-to-br from-primary to-primary/70 hover:opacity-90 shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)]">
                        <Plus className="h-4 w-4" />
                        New Meeting
                        <ChevronDown className="h-3.5 w-3.5 ml-0.5 opacity-70" />
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

              <LiveRooms />

              {/* Top-level section toggle: Pitches vs Mentorship */}
              <MeetingsTwoLane
                pitches={
                  <PitchMeetingsSection
                    meetings={pitchMeetings}
                    viewerType="startup"
                    onAccept={handleAcceptPitch}
                    onReject={handleRejectPitch}
                    onJoin={setActiveVideoUrl}
                    onOutcomeChange={handleOutcomeChange}
                    onOpenTranscript={openPitchTranscript}
                  />
                }
                mentorship={
                  <MentorshipSection
                    onJoin={setActiveVideoUrl}
                    onOpenTranscript={openMentorshipTranscript}
                    onOfferHandled={fetchPitchMeetings}
                    onSessionUpdated={fetchPitchMeetings}
                  />
                }
              />
            </TabsContent>
          )}

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
      <MeetingTranscriptDialog
        open={transcriptOpen}
        onOpenChange={setTranscriptOpen}
        meta={transcriptMeta}
      />
    </div>;
};
export default Dashboard;