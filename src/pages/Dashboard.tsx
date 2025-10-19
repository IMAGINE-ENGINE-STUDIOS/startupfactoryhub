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
import StartupAIRecommendations from '@/components/StartupAIRecommendations';
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
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import JobTaskManager from '@/components/JobTaskManager';
import { Plus, Target, Calendar as CalendarIcon, Clock, MapPin, Users, MessageCircle, Network, Map, UserCircle, Briefcase, GraduationCap, BarChart, Brain, Wrench } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import GuestPrompt from '@/components/GuestPrompt';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { useStartupAnalytics } from '@/hooks/useStartupAnalytics';
import { useRoadmapProgress } from '@/hooks/useRoadmapProgress';
import { useEvents } from '@/hooks/useEvents';
import { format, parseISO } from 'date-fns';


const Dashboard = () => {
  const {
    user,
    loading
  } = useAuth();
  const [profile, setProfile] = useState<any>(null);
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
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);
  const fetchProfile = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    if (!error && data) {
      setProfile(data);
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
  return <div className="min-h-screen bg-background pb-28 md:pb-6 relative overflow-x-hidden">
      <DashboardHeader />
      
      <div className="container mx-auto px-2 sm:px-4 md:px-6 pt-20 sm:pt-24 pb-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
            <RoleBasedAvatar avatarUrl={profile?.avatar_url} role={profileWithRole?.role || 'startup'} fallbackText={user?.email || 'U'} className="h-12 w-12 sm:h-16 sm:w-16" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
                Welcome, {profile?.full_name || 'Startup'}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Build, connect, and grow your startup</p>
            </div>
          </div>
          
          <NotificationCenter />
        </div>


        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto scrollbar-thin">
            <TabsList className="inline-flex w-auto lg:grid lg:w-full lg:grid-cols-10 max-w-7xl whitespace-nowrap">
              <TabsTrigger value="social" className="flex-shrink-0 gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden md:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-shrink-0 gap-2">
                <Network className="h-4 w-4" />
                <span className="hidden md:inline">Network</span>
              </TabsTrigger>
              <TabsTrigger value="journey" className="flex-shrink-0 gap-2">
                <Map className="h-4 w-4" />
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
          <TabsContent value="social" className="space-y-4">
            <UnifiedCommunityFeed showCreatePost={true} />
          </TabsContent>

          {/* Journey Tab */}
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

          {/* Calendar Tab */}
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
            {upcomingEvents.length > 0 && <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingEvents.slice(0, 6).map(event => <div key={event.id} className="group cursor-pointer" onClick={() => {
                  setSelectedEvent(event);
                  setShowEventDetails(true);
                }}>
                        <div className="relative overflow-hidden rounded-lg border hover:border-primary transition-all">
                          {event.banner_url ? <img src={event.banner_url} alt={event.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-48 bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                              <CalendarIcon className="h-16 w-16 text-purple-500/30" />
                            </div>}
                          <div className="p-4">
                            <h3 className="font-semibold mb-2 line-clamp-1">{event.title}</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(event.start_date), 'MMM d, h:mm a')}
                              </div>
                              {event.location && <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  <span className="line-clamp-1">{event.location}</span>
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
                </CardContent>
              </Card>}
            
            <UnifiedCalendar showCreateButton={false} onItemClick={item => {
            if (item.type === 'event') {
              setSelectedEvent(item);
              setShowEventDetails(true);
            }
          }} filterTypes={['event', 'session', 'availability']} />
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-4">
            <MatchingSystem />
            <NetworkBrowser />
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <CompanyProfileManager />
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <UnifiedJobsBoard />
            <JobTaskManager />
          </TabsContent>


          {/* Learn Tab */}
          <TabsContent value="learn" className="space-y-4">
            <EducationalResources />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {/* Journey Progress - unique metric not in AnalyticsDashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Journey Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{roadmapProgress.percentage}%</div>
                <p className="text-xs text-muted-foreground">{roadmapProgress.completedSteps} of {roadmapProgress.totalSteps} steps</p>
              </CardContent>
            </Card>
            <AnalyticsDashboard />
          </TabsContent>

          {/* Intelligence Tab */}
          <TabsContent value="intelligence" className="space-y-4">
            <MarketIntelligenceWidget />
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4">
            
            <AIFeaturesHub />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Buttons */}
      <FloatingChat />

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
    </div>;
};
export default Dashboard;