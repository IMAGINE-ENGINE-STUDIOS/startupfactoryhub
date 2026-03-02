import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users, FileText, Briefcase, Calendar as CalendarIcon, Globe, MessageCircle, 
  Building2, Plus, Clock, MapPin, Network, BarChart, Presentation, 
  ChevronDown, Check, X, Brain, Wrench
} from 'lucide-react';
import { useAcceleratorProfile } from '@/hooks/useAcceleratorProfile';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useEvents } from '@/hooks/useEvents';
import { format, parseISO, isBefore } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtime } from '@/hooks/useRealtime';
import { CohortManagement } from '@/components/accelerator/CohortManagement';
import { CohortApplicationsManager } from '@/components/accelerator/CohortApplicationsManager';
import { StartupJourneyTracker } from '@/components/accelerator/StartupJourneyTracker';
import { AlumniPortfolio } from '@/components/accelerator/AlumniPortfolio';
import { MentorAdvisorAssignment } from '@/components/accelerator/MentorAdvisorAssignment';
import { StartupDetailDialog } from '@/components/accelerator/StartupDetailDialog';
import { PortfolioStartupDialog } from '@/components/accelerator/PortfolioStartupDialog';
import { CohortDetailsDialog } from '@/components/accelerator/CohortDetailsDialog';
import AddStartupToPortfolioDialog from '@/components/accelerator/AddStartupToPortfolioDialog';
import AcceleratorSchedulePitchDialog from '@/components/accelerator/AcceleratorSchedulePitchDialog';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import DistrictRooms from '@/components/DistrictRooms';
import LiveRooms from '@/components/LiveRooms';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import UnifiedJobsBoard from '@/components/UnifiedJobsBoard';
import { DashboardHeader } from '@/components/DashboardHeader';
import FloatingChat from '@/components/FloatingChat';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import PitchMeetingCard from '@/components/PitchMeetingCard';
import MatchingSystem from '@/components/MatchingSystem';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { IntelligenceHub } from '@/components/intelligence/IntelligenceHub';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import AcceleratorProfileView from '@/components/AcceleratorProfileView';
import AIFeaturesHub from '@/components/AIFeaturesHub';

const AcceleratorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();
  const { profile: profileWithRole } = useProfileWithRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || 'social');
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { upcomingEvents } = useEvents();
  const {
    profile,
    cohorts,
    applications,
    portfolioStartups,
    loading,
    createCohort,
    updateCohort,
    updateApplicationStatus,
    acceptStartupToCohort,
    assignMentor,
    assignAdvisor,
    addMilestone,
    updateMilestone,
    refetch
  } = useAcceleratorProfile();

  // Real-time sync for portfolio and applications
  useRealtime({
    table: 'cohort_startups',
    onInsert: () => refetch(),
    onUpdate: () => refetch(),
    onDelete: () => refetch()
  });

  useRealtime({
    table: 'cohort_applications',
    onInsert: () => refetch(),
    onUpdate: () => refetch(),
    onDelete: () => refetch()
  });

  useRealtime({
    table: 'startup_mentor_assignments',
    onInsert: () => refetch(),
    onUpdate: () => refetch(),
    onDelete: () => refetch()
  });

  useRealtime({
    table: 'startup_advisor_assignments',
    onInsert: () => refetch(),
    onUpdate: () => refetch(),
    onDelete: () => refetch()
  });
  const [selectedCohort, setSelectedCohort] = useState<any>(null);
  const [showCohortDetails, setShowCohortDetails] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const [showStartupDetails, setShowStartupDetails] = useState(false);
  const [selectedPortfolioStartup, setSelectedPortfolioStartup] = useState<any>(null);
  const [showPortfolioDetails, setShowPortfolioDetails] = useState(false);
  const [schedulePitchDialogOpen, setSchedulePitchDialogOpen] = useState(false);
  const [addStartupDialogOpen, setAddStartupDialogOpen] = useState(false);
  
  // Meeting states
  const [startupMeetings, setStartupMeetings] = useState<any[]>([]);
  const [investorMeetings, setInvestorMeetings] = useState<any[]>([]);
  const [selectedApplicationForPitch, setSelectedApplicationForPitch] = useState<any>(null);

  const fetchMeetings = async () => {
    if (!user) return;
    
    // Fetch startup meetings (where accelerator is investor_id)
    const { data: startupData, error: startupError } = await supabase
      .from('pitch_meetings')
      .select(`
        *,
        company:companies(id, name, logo_url, industry),
        startup_profile:profiles!pitch_meetings_startup_id_fkey(id, full_name, avatar_url)
      `)
      .eq('investor_id', user.id)
      .order('scheduled_date', { ascending: true });

    if (!startupError && startupData) {
      setStartupMeetings(startupData);
    }

    // Fetch investor meetings (where accelerator is startup_id)
    const { data: investorData, error: investorError } = await supabase
      .from('pitch_meetings')
      .select(`
        *,
        company:companies(id, name, logo_url, industry),
        investor_profile:profiles!pitch_meetings_investor_id_fkey(id, full_name, avatar_url)
      `)
      .eq('startup_id', user.id)
      .order('scheduled_date', { ascending: true });

    if (!investorError && investorData) {
      setInvestorMeetings(investorData);
    }
  };

  // Fetch pitch meetings for accelerator
  useEffect(() => {
    fetchMeetings();
  }, [user]);

  // Real-time meeting updates
  useRealtime({
    table: 'pitch_meetings',
    onInsert: () => fetchMeetings(),
    onUpdate: () => fetchMeetings(),
    onDelete: () => fetchMeetings()
  });

  const handleSelectCohort = (cohort: any) => {
    setSelectedCohort(cohort);
    setShowCohortDetails(true);
  };

  const handleViewStartup = (startup: any) => {
    setSelectedStartup(startup);
    setShowStartupDetails(true);
  };

  const handleViewPortfolioStartup = (startup: any) => {
    setSelectedPortfolioStartup(startup);
    setShowPortfolioDetails(true);
  };

  // Sync URL tab param to activeTab
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
      setSearchParams({});
    }
  }, [urlTab, activeTab, setSearchParams]);

  // Redirect if wrong role
  useEffect(() => {
    if (!roleLoading && role && role !== 'accelerator') {
      navigate('/dashboard');
    }
  }, [role, roleLoading, navigate]);

  const handleAcceptMeeting = async (meetingId: string) => {
    try {
      const { error } = await supabase
        .from('pitch_meetings')
        .update({ status: 'scheduled' })
        .eq('id', meetingId);

      if (error) throw error;
      
      toast({ title: 'Meeting accepted', description: 'The meeting has been scheduled.' });
      
      // Real-time sync will handle refresh via useRealtime hook
      fetchMeetings();
    } catch (error) {
      console.error('Error accepting meeting:', error);
      toast({ title: 'Error', description: 'Failed to accept meeting', variant: 'destructive' });
    }
  };

  const handleRejectMeeting = async (meetingId: string) => {
    try {
      const { error } = await supabase
        .from('pitch_meetings')
        .update({ status: 'cancelled' })
        .eq('id', meetingId);

      if (error) throw error;
      
      toast({ title: 'Meeting declined', description: 'The meeting has been declined.' });
      
      // Real-time sync will handle refresh via useRealtime hook
      fetchMeetings();
    } catch (error) {
      console.error('Error rejecting meeting:', error);
      toast({ title: 'Error', description: 'Failed to decline meeting', variant: 'destructive' });
    }
  };

  // Categorize startup meetings
  const now = new Date();
  const startupIncoming = startupMeetings.filter(m => m.status === 'pending' && m.host_id !== user?.id);
  const startupSent = startupMeetings.filter(m => m.status === 'pending' && m.host_id === user?.id);
  const startupUpcoming = startupMeetings.filter(m => m.status === 'scheduled' && !isBefore(new Date(m.scheduled_date), now));
  const startupPast = startupMeetings.filter(m => m.status === 'completed' || (m.status === 'scheduled' && isBefore(new Date(m.scheduled_date), now)));

  // Categorize investor meetings
  const investorIncoming = investorMeetings.filter(m => m.status === 'pending' && m.host_id !== user?.id);
  const investorSent = investorMeetings.filter(m => m.status === 'pending' && m.host_id === user?.id);
  const investorUpcoming = investorMeetings.filter(m => m.status === 'scheduled' && !isBefore(new Date(m.scheduled_date), now));
  const investorPast = investorMeetings.filter(m => m.status === 'completed' || (m.status === 'scheduled' && isBefore(new Date(m.scheduled_date), now)));

  // Delete portfolio startup handler
  const deletePortfolioStartup = async (startupId: string) => {
    try {
      const { error } = await supabase
        .from('cohort_startups')
        .delete()
        .eq('id', startupId);

      if (error) throw error;
      
      toast({ title: 'Startup removed', description: 'The startup has been removed from your portfolio.' });
      refetch();
    } catch (error) {
      console.error('Error deleting portfolio startup:', error);
      toast({ title: 'Error', description: 'Failed to remove startup from portfolio', variant: 'destructive' });
    }
  };

  // Remove mentor assignment handler
  const removeMentorAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('startup_mentor_assignments')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', assignmentId);

      if (error) throw error;
      
      toast({ title: 'Mentor removed', description: 'The mentor has been removed from the startup.' });
      refetch();
    } catch (error) {
      console.error('Error removing mentor:', error);
      toast({ title: 'Error', description: 'Failed to remove mentor', variant: 'destructive' });
    }
  };

  // Remove advisor assignment handler
  const removeAdvisorAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('startup_advisor_assignments')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', assignmentId);

      if (error) throw error;
      
      toast({ title: 'Advisor removed', description: 'The advisor has been removed from the startup.' });
      refetch();
    } catch (error) {
      console.error('Error removing advisor:', error);
      toast({ title: 'Error', description: 'Failed to remove advisor', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading accelerator dashboard...</p>
        </div>
      </div>
    );
  }

  // Stats
  const pendingApplications = applications.filter(a => a.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background pb-6 relative">
      <DashboardHeader />
      
      <div className="container mx-auto px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 pb-4 sm:pb-8">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile: Only Avatar */}
          <div className="md:hidden flex justify-start mb-4">
            <RoleBasedAvatar avatarUrl={profile?.logo_url || profileWithRole?.avatar_url} role="accelerator" fallbackText={profile?.organization_name || 'A'} className="h-16 w-16" />
          </div>
          
          {/* Desktop: Full Welcome Section */}
          <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <RoleBasedAvatar avatarUrl={profile?.logo_url || profileWithRole?.avatar_url} role="accelerator" fallbackText={profile?.organization_name || 'A'} className="h-16 w-16" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Welcome back, {profile?.organization_name || 'Accelerator'}! 👋</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your cohorts, applications, and portfolio companies</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto scrollbar-thin -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="flex w-full whitespace-nowrap tech-card border-0 p-1.5 sm:p-1 gap-1 h-auto">
              <TabsTrigger value="social" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Social</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Network className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Network</span>
              </TabsTrigger>
              <TabsTrigger value="cohorts" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Users className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Cohorts</span>
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <FileText className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Apps</span>
                {pendingApplications > 0 && <Badge className="ml-1 bg-emerald-500 text-xs">{pendingApplications}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Building2 className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Portfolio</span>
              </TabsTrigger>
              <TabsTrigger value="meetings" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Presentation className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Meetings</span>
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

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            <UnifiedCommunityFeed showCreatePost={true} interstitialContent={<DistrictRooms />} interstitialAfterIndex={3} />
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-6">
            <MatchingSystem />
          </TabsContent>

          {/* Cohorts Tab - Now includes Journey Tracker and Mentor/Advisor Assignments */}
          <TabsContent value="cohorts" className="space-y-6">
            {/* Cohort Management */}
            <CohortManagement cohorts={cohorts} onCreateCohort={createCohort} onUpdateCohort={updateCohort} onSelectCohort={handleSelectCohort} />
            
            {/* Active Startups Section - Filter for non-graduated startups */}
            {(() => {
              const activeStartups = portfolioStartups.filter(s => s.current_stage !== 'graduated');
              if (activeStartups.length === 0) return null;
              return (
                <>
                  {/* Startup Journey Tracker - For active cohort startups */}
                  <div className="pt-6 border-t border-border/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Active Startup Journey</h2>
                        <p className="text-xs text-muted-foreground">Track milestones for startups in active cohorts</p>
                      </div>
                    </div>
                    <StartupJourneyTracker startups={activeStartups} onAddMilestone={addMilestone} onUpdateMilestone={updateMilestone} />
                  </div>
                  
                  {/* Mentor/Advisor Assignment - For active cohort startups */}
                  <div className="pt-6 border-t border-border/50">
                    <MentorAdvisorAssignment startups={activeStartups} onAssignMentor={assignMentor} onAssignAdvisor={assignAdvisor} onRemoveMentor={removeMentorAssignment} onRemoveAdvisor={removeAdvisorAssignment} />
                  </div>
                </>
              );
            })()}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <CohortApplicationsManager 
              applications={applications} 
              cohorts={cohorts} 
              onUpdateStatus={updateApplicationStatus} 
              onAcceptStartup={acceptStartupToCohort}
              onSchedulePitch={(app) => {
                setSelectedApplicationForPitch(app);
                setSchedulePitchDialogOpen(true);
              }}
            />
          </TabsContent>

          {/* Portfolio Tab - Now focused on Alumni (graduated companies) */}
          <TabsContent value="portfolio" className="space-y-6">
            <AlumniPortfolio 
              startups={portfolioStartups} 
              cohorts={cohorts} 
              totalFundingRaised={profile?.total_funding_raised || 0} 
              onViewStartup={handleViewPortfolioStartup} 
              onDeleteStartup={deletePortfolioStartup}
              onAddAlumni={() => setAddStartupDialogOpen(true)}
            />
          </TabsContent>

          {/* Meetings Tab - Two Column Layout (Startup Dashboard Style) */}
          <TabsContent value="meetings" className="space-y-6">
            <LiveRooms />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Presentation className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Meetings</h2>
                  <p className="text-xs text-muted-foreground">Manage meetings with startups and investors</p>
                </div>
              </div>
              <Button 
                onClick={() => setSchedulePitchDialogOpen(true)} 
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Startup Pitches */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Startup Pitches</h3>
                    <p className="text-xs text-muted-foreground">Meetings with startups</p>
                  </div>
                </div>

                {/* Incoming Requests */}
                <Collapsible defaultOpen className="tech-card rounded-xl border-0">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-medium">Incoming Requests</h4>
                        <p className="text-xs text-muted-foreground">From startups</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {startupIncoming.length > 0 && <Badge variant="secondary">{startupIncoming.length}</Badge>}
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    {startupIncoming.length > 0 ? (
                      <div className="space-y-2">
                        {startupIncoming.map((meeting) => (
                          <Card key={meeting.id} className="tech-card border-0">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{meeting.company?.name || 'Unknown Startup'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(meeting.scheduled_date), 'MMM d, yyyy h:mm a')}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleAcceptMeeting(meeting.id)}>
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleRejectMeeting(meeting.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No incoming requests</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Sent Requests */}
                <Collapsible defaultOpen className="tech-card rounded-xl border-0">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Presentation className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-medium">Sent Requests</h4>
                        <p className="text-xs text-muted-foreground">Awaiting response</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {startupSent.length > 0 && <Badge variant="secondary">{startupSent.length}</Badge>}
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    {startupSent.length > 0 ? (
                      <div className="space-y-2">
                        {startupSent.map((meeting) => (
                          <PitchMeetingCard 
                            key={meeting.id}
                            meeting={meeting}
                            variant="upcoming"
                            viewerType="investor"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No sent requests</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Upcoming Pitches */}
                <Collapsible defaultOpen className="tech-card rounded-xl border-0">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <CalendarIcon className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-medium">Upcoming Pitches</h4>
                        <p className="text-xs text-muted-foreground">Scheduled meetings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {startupUpcoming.length > 0 && <Badge variant="secondary">{startupUpcoming.length}</Badge>}
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    {startupUpcoming.length > 0 ? (
                      <div className="space-y-2">
                        {startupUpcoming.map((meeting) => (
                          <PitchMeetingCard 
                            key={meeting.id}
                            meeting={meeting}
                            variant="upcoming"
                            viewerType="investor"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No upcoming pitches</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Past Pitches */}
                <Collapsible className="tech-card rounded-xl border-0">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-medium">Past Pitches</h4>
                        <p className="text-xs text-muted-foreground">Completed meetings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {startupPast.length > 0 && <Badge variant="secondary">{startupPast.length}</Badge>}
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    {startupPast.length > 0 ? (
                      <div className="space-y-2">
                        {startupPast.map((meeting) => (
                          <PitchMeetingCard 
                            key={meeting.id}
                            meeting={meeting}
                            variant="past"
                            viewerType="investor"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No past pitches</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Right Column - Investor Meetings */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Investor Meetings</h3>
                    <p className="text-xs text-muted-foreground">Meetings with investors</p>
                  </div>
                </div>

                {/* Incoming Requests */}
                <Collapsible defaultOpen className="tech-card rounded-xl border-0">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-medium">Incoming Requests</h4>
                        <p className="text-xs text-muted-foreground">From investors</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {investorIncoming.length > 0 && <Badge variant="secondary">{investorIncoming.length}</Badge>}
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    {investorIncoming.length > 0 ? (
                      <div className="space-y-2">
                        {investorIncoming.map((meeting) => (
                          <Card key={meeting.id} className="tech-card border-0">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{meeting.investor_profile?.full_name || 'Unknown Investor'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(meeting.scheduled_date), 'MMM d, yyyy h:mm a')}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleAcceptMeeting(meeting.id)}>
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleRejectMeeting(meeting.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No incoming requests</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Sent Requests */}
                <Collapsible defaultOpen className="tech-card rounded-xl border-0">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Presentation className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-medium">Sent Requests</h4>
                        <p className="text-xs text-muted-foreground">Awaiting response</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {investorSent.length > 0 && <Badge variant="secondary">{investorSent.length}</Badge>}
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    {investorSent.length > 0 ? (
                      <div className="space-y-2">
                        {investorSent.map((meeting) => (
                          <PitchMeetingCard 
                            key={meeting.id}
                            meeting={meeting}
                            variant="upcoming"
                            viewerType="startup"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No sent requests</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Upcoming Meetings */}
                <Collapsible defaultOpen className="tech-card rounded-xl border-0">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <CalendarIcon className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-medium">Upcoming Meetings</h4>
                        <p className="text-xs text-muted-foreground">Scheduled meetings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {investorUpcoming.length > 0 && <Badge variant="secondary">{investorUpcoming.length}</Badge>}
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    {investorUpcoming.length > 0 ? (
                      <div className="space-y-2">
                        {investorUpcoming.map((meeting) => (
                          <PitchMeetingCard 
                            key={meeting.id}
                            meeting={meeting}
                            variant="upcoming"
                            viewerType="startup"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No upcoming meetings</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Past Meetings */}
                <Collapsible className="tech-card rounded-xl border-0">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-xl group">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-medium">Past Meetings</h4>
                        <p className="text-xs text-muted-foreground">Completed meetings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {investorPast.length > 0 && <Badge variant="secondary">{investorPast.length}</Badge>}
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-4">
                    {investorPast.length > 0 ? (
                      <div className="space-y-2">
                        {investorPast.map((meeting) => (
                          <PitchMeetingCard 
                            key={meeting.id}
                            meeting={meeting}
                            variant="past"
                            viewerType="startup"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No past meetings</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <UnifiedJobsBoard />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 mb-4">
              <Button onClick={() => setCreateEventDialogOpen(true)} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Create Event</span>
              </Button>
            </div>

            {/* Upcoming Events with Banners */}
            {upcomingEvents.length > 0 && (
              <Card className="tech-card border-0">
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
                              <div className="w-full h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/5 flex items-center justify-center">
                                <CalendarIcon className="h-16 w-16 text-emerald-500/30" />
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
                                    <span className="line-clamp-1">{event.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            <UnifiedCalendar userRole="accelerator" filterTypes={['event', 'session', 'availability', 'pitch', 'accelerator']} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Intelligence Tab */}
          <TabsContent value="intelligence" className="space-y-4">
            <IntelligenceHub />
          </TabsContent>


          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4">
            <AIFeaturesHub />
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="mt-0 relative overflow-hidden" style={{
            height: 'calc(100vh - 12rem)',
            minHeight: '500px'
          }}>
            <div className="absolute inset-0">
              <GlobalResourcesMap />
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <AcceleratorProfileView />
          </TabsContent>
        </Tabs>
      </div>

      <FloatingChat />
      
      <CreateEventDialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen} onEventCreated={() => {}} />
      
      {selectedEvent && <EventDetailsDialog event={selectedEvent} open={showEventDetails} onOpenChange={setShowEventDetails} onEventUpdated={() => {}} />}

      {/* Cohort Details Dialog */}
      <CohortDetailsDialog
        cohort={selectedCohort}
        open={showCohortDetails}
        onOpenChange={setShowCohortDetails}
        onUpdateCohort={updateCohort}
        onViewApplications={() => {
          setShowCohortDetails(false);
          setActiveTab('applications');
        }}
      />

      {/* Startup Detail Dialog */}
      <StartupDetailDialog
        startup={selectedStartup}
        open={showStartupDetails}
        onOpenChange={setShowStartupDetails}
        onAddMilestone={addMilestone}
        onUpdateMilestone={updateMilestone}
        cohortName={cohorts.find(c => c.id === selectedStartup?.cohort_id)?.name}
      />

      {/* Portfolio Startup Dialog - Company Profile & Investment Performance */}
      <PortfolioStartupDialog
        startup={selectedPortfolioStartup}
        open={showPortfolioDetails}
        onOpenChange={setShowPortfolioDetails}
        cohortName={cohorts.find(c => c.id === selectedPortfolioStartup?.cohort_id)?.name}
      />

      {/* Add Alumni to Portfolio Dialog */}
      <AddStartupToPortfolioDialog
        open={addStartupDialogOpen}
        onOpenChange={setAddStartupDialogOpen}
        cohorts={cohorts}
        onStartupAdded={() => {
          refetch();
        }}
        isAlumniMode={true}
      />

      {/* Schedule Pitch Meeting Dialog */}
      <AcceleratorSchedulePitchDialog
        open={schedulePitchDialogOpen}
        onOpenChange={(open) => {
          setSchedulePitchDialogOpen(open);
          if (!open) setSelectedApplicationForPitch(null);
        }}
        portfolioStartups={portfolioStartups}
        applications={applications}
        cohorts={cohorts}
        onPitchScheduled={() => {
          fetchMeetings();
        }}
        preSelectedApplication={selectedApplicationForPitch}
      />
    </div>
  );
};

export default AcceleratorDashboard;