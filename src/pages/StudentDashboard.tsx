import NvidiaInceptionCard from '@/components/NvidiaInceptionCard';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { useUserRole } from '@/hooks/useUserRole';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import UnifiedJobsBoard from '@/components/UnifiedJobsBoard';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { IntelligenceHub } from '@/components/intelligence/IntelligenceHub';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import NetworkBrowser from '@/components/NetworkBrowser';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import CalendarBookingSettings from '@/components/CalendarBookingSettings';
import BookingsList from '@/components/BookingsList';
import { AvailabilityScheduleCard, BlockedTimesCard } from '@/components/AvailabilityManager';
import EducationalResources from '@/components/EducationalResources';
import StudentProfileView from '@/components/StudentProfileView';
import StudyRooms from '@/components/StudyRooms';
import FloatingChat from '@/components/FloatingChat';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import { CohortApplicationDialog } from '@/components/accelerator/CohortApplicationDialog';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Users, MessageCircle, UserCircle, Network, BookOpen, Briefcase, BarChart, Brain, Wrench, Globe, Video, Rocket, ExternalLink } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { format, parseISO } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import DistrictRooms from '@/components/DistrictRooms';
import LiveRooms from '@/components/LiveRooms';
import { getIndustryLabel } from '@/lib/constants';
export default function StudentDashboard() {
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [openCohorts, setOpenCohorts] = useState<any[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<any>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || "social");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const { profile: profileWithRole } = useProfileWithRole();
  const { upcomingEvents } = useEvents();

  // Sync URL tab param to activeTab
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
      setSearchParams({});
    }
  }, [urlTab, activeTab, setSearchParams]);

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

  // Redirect if wrong role
  useEffect(() => {
    if (!roleLoading && role && role !== 'student') {
      navigate('/dashboard');
    }
  }, [role, roleLoading, navigate]);
  return <div className="min-h-screen bg-gradient-hero pb-6 relative">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile: Only Avatar */}
          <div className="md:hidden flex justify-start mb-4">
            <RoleBasedAvatar 
              avatarUrl={profileWithRole?.avatar_url} 
              role="student" 
              fallbackText={user?.email || 'S'} 
              className="h-16 w-16" 
            />
          </div>
          
          {/* Desktop: Full Welcome Section */}
          <div className="hidden md:flex items-center space-x-4">
            <RoleBasedAvatar 
              avatarUrl={profileWithRole?.avatar_url} 
              role="student" 
              fallbackText={user?.email || 'S'} 
              className="h-16 w-16" 
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {profileWithRole?.full_name || 'Student'} Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Learn, grow, and connect</p>
            </div>
          </div>
        </div>

        {/* Main Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto scrollbar-thin -mx-2 px-2 sm:mx-0 sm:px-0">
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
              <TabsTrigger value="learning" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <BookOpen className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Learning</span>
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

          <TabsContent value="social" className="space-y-4">
            <UnifiedCommunityFeed interstitialContent={<DistrictRooms />} interstitialAfterIndex={3} />
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <LiveRooms />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <StudentProfileView />
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <NetworkBrowser />
          </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <StudyRooms />
          <EducationalResources />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <UnifiedJobsBoard />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 mb-4">
              <Button onClick={() => setCreateSessionDialogOpen(true)} variant="outline" data-tour="create-meeting" className="gap-2 w-full sm:w-auto">
                <CalendarIcon className="h-4 w-4" />
                <span className="sm:inline">Schedule Session</span>
              </Button>
              <Button onClick={() => setCreateEventDialogOpen(true)} data-tour="create-event" className="gap-2 w-full sm:w-auto">
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
                            <div className="rounded-lg border hover:border-emerald-500/50 transition-all p-4 space-y-3 h-full flex flex-col">
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
                                  <Rocket className="h-3 w-3" />
                                  Apply
                                </Button>
                                {cohort.accelerator_profiles?.external_link && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(cohort.accelerator_profiles.external_link, '_blank')}
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
            
            <UnifiedCalendar 
              showCreateButton={false} 
              userRole="student"
              onItemClick={item => {
                if (item.type === 'event') {
                  setSelectedEvent(item);
                  setShowEventDetails(true);
                }
              }} 
              filterTypes={['event', 'session', 'availability', 'accelerator']} 
            />

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

          <TabsContent value="analytics" className="space-y-4">
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
        </Tabs>
      </div>

      {/* Floating Chat with AI */}
      <FloatingChat />
      <CreateSessionDialog open={createSessionDialogOpen} onOpenChange={setCreateSessionDialogOpen} onSessionCreated={() => {}} />
      <CreateEventDialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen} onEventCreated={() => {
      setCreateEventDialogOpen(false);
    }} />
      {selectedEvent && <EventDetailsDialog event={selectedEvent} open={showEventDetails} onOpenChange={setShowEventDetails} onEventUpdated={() => {
      setShowEventDetails(false);
    }} />}
      <CohortApplicationDialog
        open={showApplicationDialog}
        onOpenChange={setShowApplicationDialog}
        cohortData={selectedCohort}
        onApplicationSubmitted={() => setShowApplicationDialog(false)}
      />
    </div>;
}