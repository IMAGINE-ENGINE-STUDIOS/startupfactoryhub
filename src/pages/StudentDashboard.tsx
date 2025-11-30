import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { useUserRole } from '@/hooks/useUserRole';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import UnifiedJobsBoard from '@/components/UnifiedJobsBoard';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import NetworkBrowser from '@/components/NetworkBrowser';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import EducationalResources from '@/components/EducationalResources';
import StudentProfileView from '@/components/StudentProfileView';
import StudyRooms from '@/components/StudyRooms';
import FloatingChat from '@/components/FloatingChat';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Users, MessageCircle, UserCircle, Network, BookOpen, Briefcase, BarChart, Brain, Wrench } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { format, parseISO } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
export default function StudentDashboard() {
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
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
            <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-9 max-w-7xl whitespace-nowrap">
              <TabsTrigger value="social" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden md:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden md:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="gap-2">
                <Network className="h-4 w-4" />
                <span className="hidden md:inline">Network</span>
              </TabsTrigger>
              <TabsTrigger value="learning" className="gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden md:inline">Learning</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden md:inline">Jobs</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden md:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart className="h-4 w-4" />
                <span className="hidden md:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden md:inline">Intelligence</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden md:inline">Tools</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="social" className="space-y-4">
            <UnifiedCommunityFeed />
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
              userRole="student"
              onItemClick={item => {
                if (item.type === 'event') {
                  setSelectedEvent(item);
                  setShowEventDetails(true);
                }
              }} 
              filterTypes={['event', 'session', 'availability']} 
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4">
            <MarketIntelligenceWidget />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <AIFeaturesHub />
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
    </div>;
}