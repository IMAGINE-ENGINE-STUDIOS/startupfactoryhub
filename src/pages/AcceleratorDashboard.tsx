import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Rocket, Users, FileText, Briefcase, Calendar as CalendarIcon, BarChart3, Globe, MessageSquare, Building2, Target, TrendingUp, Plus, Bell, Clock, MapPin, MessageCircle, Network, BarChart, User } from 'lucide-react';
import { useAcceleratorProfile } from '@/hooks/useAcceleratorProfile';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useEvents } from '@/hooks/useEvents';
import { format, parseISO } from 'date-fns';
import { CohortManagement } from '@/components/accelerator/CohortManagement';
import { CohortApplicationsManager } from '@/components/accelerator/CohortApplicationsManager';
import { StartupJourneyTracker } from '@/components/accelerator/StartupJourneyTracker';
import { AcceleratorPortfolio } from '@/components/accelerator/AcceleratorPortfolio';
import { MentorAdvisorAssignment } from '@/components/accelerator/MentorAdvisorAssignment';
import { StartupDetailDialog } from '@/components/accelerator/StartupDetailDialog';
import { CohortDetailsDialog } from '@/components/accelerator/CohortDetailsDialog';
import AddStartupToPortfolioDialog from '@/components/accelerator/AddStartupToPortfolioDialog';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import { DashboardHeader } from '@/components/DashboardHeader';
import FloatingChat from '@/components/FloatingChat';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import NetworkBrowser from '@/components/NetworkBrowser';
import MatchingSystem from '@/components/MatchingSystem';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import AcceleratorRoadmapWidget from '@/components/accelerator/AcceleratorRoadmapWidget';
import ConnectionsWidget from '@/components/ConnectionsWidget';
import AcceleratorProfileView from '@/components/AcceleratorProfileView';
import StartupBrowser from '@/components/StartupBrowser';

const AcceleratorDashboard = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    role,
    loading: roleLoading
  } = useUserRole();
  const {
    profile: profileWithRole
  } = useProfileWithRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || 'social');
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const {
    upcomingEvents
  } = useEvents();
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
    updateMilestone
  } = useAcceleratorProfile();
  const [selectedCohort, setSelectedCohort] = useState<any>(null);
  const [showCohortDetails, setShowCohortDetails] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const [showStartupDetails, setShowStartupDetails] = useState(false);
  const [addStartupDialogOpen, setAddStartupDialogOpen] = useState(false);

  const handleSelectCohort = (cohort: any) => {
    setSelectedCohort(cohort);
    setShowCohortDetails(true);
  };

  const handleViewStartup = (startup: any) => {
    setSelectedStartup(startup);
    setShowStartupDetails(true);
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
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading accelerator dashboard...</p>
        </div>
      </div>;
  }

  // Stats
  const pendingApplications = applications.filter(a => a.status === 'pending').length;
  const activeStartups = portfolioStartups.filter(s => s.current_stage === 'active').length;
  const activeCohorts = cohorts.filter(c => c.status === 'in_progress' || c.status === 'applications_open').length;
  return <div className="min-h-screen bg-background pb-6 relative">
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              
              
            </div>
          </div>
        </div>

        {/* Tabbed Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto scrollbar-thin -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-9 max-w-7xl tech-card border-0 p-1.5 sm:p-1 gap-1 h-auto">
              <TabsTrigger value="social" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Social</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Network className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Network</span>
              </TabsTrigger>
              <TabsTrigger value="cohorts" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Users className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Cohorts</span>
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <FileText className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Apps</span>
                {pendingApplications > 0 && <Badge className="ml-1 bg-emerald-500 text-xs">{pendingApplications}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Building2 className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Portfolio</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <CalendarIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <BarChart className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Globe className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Resources</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <User className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Profile</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            <UnifiedCommunityFeed showCreatePost={true} />
          </TabsContent>


          {/* Network Tab */}
          <TabsContent value="network" className="space-y-6">
            <MatchingSystem />
            <NetworkBrowser />
            <StartupBrowser />
          </TabsContent>

          {/* Cohorts Tab */}
          <TabsContent value="cohorts">
            <CohortManagement cohorts={cohorts} onCreateCohort={createCohort} onUpdateCohort={updateCohort} onSelectCohort={handleSelectCohort} />
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <CohortApplicationsManager applications={applications} cohorts={cohorts} onUpdateStatus={updateApplicationStatus} onAcceptStartup={acceptStartupToCohort} />
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setAddStartupDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Startup
              </Button>
            </div>
            <AcceleratorPortfolio startups={portfolioStartups} cohorts={cohorts} totalFundingRaised={profile?.total_funding_raised || 0} onViewStartup={handleViewStartup} />
            <StartupJourneyTracker startups={portfolioStartups} onAddMilestone={addMilestone} onUpdateMilestone={updateMilestone} />
            <MentorAdvisorAssignment startups={portfolioStartups} onAssignMentor={assignMentor} onAssignAdvisor={assignAdvisor} />
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
                            {event.banner_url ? <img src={event.banner_url} alt={event.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/5 flex items-center justify-center">
                                <CalendarIcon className="h-16 w-16 text-emerald-500/30" />
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
                                    <span className="line-clamp-1">{event.location}</span>
                                  </div>}
                              </div>
                            </div>
                          </div>
                        </div>)}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>}

            <UnifiedCalendar userRole="accelerator" />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
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

      {/* Add Startup to Portfolio Dialog */}
      <AddStartupToPortfolioDialog
        open={addStartupDialogOpen}
        onOpenChange={setAddStartupDialogOpen}
        cohorts={cohorts}
        onStartupAdded={() => {
          // Trigger refetch of portfolio
          window.location.reload();
        }}
      />
    </div>;
};
export default AcceleratorDashboard;