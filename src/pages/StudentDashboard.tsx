import { useRememberedTab } from '@/lib/tabMemory';
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
import { DashboardTabsNav } from '@/components/DashboardTabsNav';
import MeetingsHubHeader from '@/components/MeetingsHubHeader';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';


import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { useUserRole } from '@/hooks/useUserRole';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import JobsSection from '@/components/JobsSection';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { IntelligenceHub } from '@/components/intelligence/IntelligenceHub';
import MVPReferralCard from "@/components/referral/MVPReferralCard";
import AIFeaturesHub from '@/components/AIFeaturesHub';
import SFHCallAgents from '@/components/call-agents/SFHCallAgents';
import { LightPaperWorkspace } from '@/components/lightpaper/LightPaperWorkspace';
import MatchingSystem from '@/components/MatchingSystem';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import CalendarBookingSettings from '@/components/CalendarBookingSettings';
import BookingsList from '@/components/BookingsList';
import { AvailabilityScheduleCard, BlockedTimesCard } from '@/components/AvailabilityManager';
import EducationalResources from '@/components/EducationalResources';
import StudentProfileView from '@/components/StudentProfileView';
import StudyRooms from '@/components/StudyRooms';

import CreateSessionDialog from '@/components/CreateSessionDialog';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import { CohortApplicationDialog } from '@/components/accelerator/CohortApplicationDialog';
import { Bot, Calendar as CalendarIcon, Plus, Clock, MapPin, Users, MessageCircle, UserCircle, Network, BookOpen, Briefcase, BarChart, Brain, Wrench, Globe, Video, Rocket, ExternalLink, FileText} from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { format, parseISO } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import InvestorCommunity from '@/components/InvestorCommunity';
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
  const [activeTab, setActiveTab] = useRememberedTab('student', urlTab, "social");
  const [learningView, setLearningView] = useState<'courses' | 'rooms'>('courses');
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
      /* routed by DashboardRouter */
    }
  }, [role, roleLoading, navigate]);
  return <div className="min-h-screen bg-gradient-hero pb-6 relative">
      <DashboardHeader />
      <div className="w-full max-w-none px-4 sm:px-6 xl:px-8 pt-2 sm:pt-4 space-y-4 sm:space-y-6">

        {/* User avatar */}
        <div className="mb-4 sm:mb-6 flex justify-start">
          <RoleBasedAvatar
            avatarUrl={profileWithRole?.avatar_url}
            role="student"
            fallbackText={user?.email || 'S'}
            className="h-14 w-14 sm:h-16 sm:w-16"
          />
        </div>

        {/* Main Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <DashboardTabsNav
            items={[
              { value: 'social', icon: MessageCircle, label: 'Social' },
              { value: 'meetings', icon: Video, label: 'Meetings' },
              { value: 'network', icon: Network, label: 'Net' },
              { value: 'learning', icon: BookOpen, label: 'Learning' },
              { value: 'jobs', icon: Briefcase, label: 'Jobs' },
              { value: 'analytics', icon: BarChart, label: 'Analytics' },
              { value: 'intelligence', icon: Brain, label: 'Intelligence' },
              { value: 'tools', icon: Wrench, label: 'Tools' },
              { value: 'call-agents', icon: Bot, label: 'SFH Call Agents' },
              { value: 'lightpaper', icon: FileText, label: 'LightPaper' },
              { value: 'resources', icon: Globe, label: 'Resources' },
            ]}
          />


          <TabsContent value="social" className="space-y-4">
            <UnifiedCommunityFeed interstitialContent={<InvestorCommunity />} interstitialAfterIndex={3} />
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <MeetingsHubHeader subtitle="Join live rooms and upcoming sessions." />
            <LiveRooms />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <StudentProfileView />
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <MatchingSystem />
          </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <div className="flex items-center gap-2 tech-card border-0 rounded-full p-1 w-fit">
            {([
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'rooms', label: 'Study Rooms', icon: Users },
            ] as const).map(opt => {
              const Icon = opt.icon;
              const active = learningView === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setLearningView(opt.id)}
                  className={`h-9 px-4 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.45)]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
          {learningView === 'courses' ? <EducationalResources /> : <StudyRooms />}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <JobsSection />
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

            <div className="space-y-4">
              <BookingsList variant="requests" />
              <BookingsList variant="scheduled" emptyLabel="No confirmed meetings yet." />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4">
            <IntelligenceHub />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <MVPReferralCard />
            <AIFeaturesHub />
          </TabsContent>

          <TabsContent value="call-agents" className="space-y-4">
            <SFHCallAgents />
          </TabsContent>
          {/* LightPaper Tab */}
          <TabsContent value="lightpaper" className="space-y-4">
            <LightPaperWorkspace />
          </TabsContent>


          <TabsContent value="resources" className="mt-0 relative overflow-hidden" style={{ height: 'calc(100vh - 12rem)', minHeight: '500px' }}>
            <div className="absolute inset-0">
              <GlobalResourcesMap />
            </div>
          </TabsContent>
        </Tabs>
      </div>

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