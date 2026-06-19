import NvidiaInceptionCard from '@/components/NvidiaInceptionCard';
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
  ChevronDown, Check, X, Brain, Wrench, Rocket
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
import PitchMeetingsSection from '@/components/PitchMeetingsSection';
import MeetingsTwoLane from '@/components/MeetingsTwoLane';
import DistrictRooms from '@/components/DistrictRooms';
import LiveRooms from '@/components/LiveRooms';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import CalendarBookingSettings from '@/components/CalendarBookingSettings';
import BookingsList from '@/components/BookingsList';
import { AvailabilityScheduleCard, BlockedTimesCard } from '@/components/AvailabilityManager';
import JobsSection from '@/components/JobsSection';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardTabsNav } from '@/components/DashboardTabsNav';
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

        {/* User avatar */}
        <div className="mb-4 sm:mb-6 flex justify-start">
          <RoleBasedAvatar
            avatarUrl={profile?.logo_url || profileWithRole?.avatar_url}
            role="accelerator"
            fallbackText={profile?.organization_name || 'A'}
            className="h-14 w-14 sm:h-16 sm:w-16"
          />
        </div>

        {/* Tabbed Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <DashboardTabsNav
            items={[
              { value: 'social', icon: MessageCircle, label: 'Social' },
              { value: 'network', icon: Network, label: 'Net' },
              { value: 'cohorts', icon: Users, label: 'Cohorts' },
              { value: 'applications', icon: FileText, label: 'Apps', badge: pendingApplications || undefined },
              { value: 'portfolio', icon: Building2, label: 'Portfolio' },
              { value: 'meetings', icon: Presentation, label: 'Meetings' },
              { value: 'jobs', icon: Briefcase, label: 'Jobs' },
              { value: 'analytics', icon: BarChart, label: 'Analytics' },
              { value: 'intelligence', icon: Brain, label: 'Intelligence' },
              { value: 'tools', icon: Wrench, label: 'Tools' },
              { value: 'resources', icon: Globe, label: 'Resources' },
            ]}
          />


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

          {/* Meetings Tab - Simplified chip-row layout */}
          <TabsContent value="meetings" className="space-y-4">
            <div className="flex items-center justify-between gap-3 tech-card border-0 rounded-xl p-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Presentation className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold truncate">Meetings</h3>
                  <p className="text-xs text-muted-foreground truncate">Pitches with startups & investors</p>
                </div>
              </div>
              <Button size="sm" onClick={() => setSchedulePitchDialogOpen(true)} className="gap-1.5 h-9 shrink-0">
                <Plus className="h-3.5 w-3.5" />
                Schedule
              </Button>
            </div>

            <LiveRooms />

            <MeetingsTwoLane
              labels={{ pitches: 'Startup Pitches', mentorship: 'Investor Meetings' }}
              icons={{ pitches: 'startups', mentorship: 'investors' }}
              pitches={
                <PitchMeetingsSection
                  meetings={startupMeetings}
                  viewerType="investor"
                  onAccept={handleAcceptMeeting}
                  onReject={handleRejectMeeting}
                />
              }
              mentorship={
                <PitchMeetingsSection
                  meetings={investorMeetings}
                  viewerType="startup"
                  onAccept={handleAcceptMeeting}
                  onReject={handleRejectMeeting}
                />
              }
            />
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <JobsSection />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 mb-4">
              <Button onClick={() => setCreateEventDialogOpen(true)} data-tour="create-event" className="gap-2 w-full sm:w-auto">
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

            {/* Upcoming Accelerator Programs */}
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
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>

            <UnifiedCalendar userRole="accelerator" filterTypes={['event', 'session', 'availability', 'pitch', 'accelerator']} />

            {/* Booking Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <CalendarBookingSettings />
              <div className="space-y-4">
                <AvailabilityScheduleCard />
                <BlockedTimesCard />
              </div>
            </div>

            <BookingsList />
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