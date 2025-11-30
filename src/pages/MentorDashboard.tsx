import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MentorRoadmapWidget from "@/components/MentorRoadmapWidget";
import MentorCalendarWidget from "@/components/MentorCalendarWidget";
import AvailabilityManager from "@/components/AvailabilityManager";
import UnifiedCommunityFeed from "@/components/UnifiedCommunityFeed";
import AIFeaturesHub from "@/components/AIFeaturesHub";
import MentorshipRequests from "@/components/MentorshipRequests";
import ConnectionsWidget from "@/components/ConnectionsWidget";
import FloatingChat from "@/components/FloatingChat";
import UnifiedJobsBoard from "@/components/UnifiedJobsBoard";
import AdvisorJobTaskViewer from "@/components/AdvisorJobTaskViewer";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useMentorDashboard } from "@/hooks/useMentorDashboard";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AdvisorProfileView from "@/components/AdvisorProfileView";
import MarketIntelligenceWidget from "@/components/MarketIntelligenceWidget";
import RoleBasedAvatar from "@/components/RoleBasedAvatar";
import ProfilePostsMosaic from "@/components/ProfilePostsMosaic";
import { useProfileWithRole } from "@/hooks/useProfileWithRole";
import StartupBrowser from "@/components/StartupBrowser";
import NetworkBrowser from "@/components/NetworkBrowser";
import MatchingSystem from "@/components/MatchingSystem";
import MentorOffersBoard from "@/components/MentorOffersBoard";
import MenteeSessions from "@/components/MenteeSessions";
import { DashboardHeader } from "@/components/DashboardHeader";
import { 
  Users, 
  TrendingUp, 
  Calendar as CalendarIcon,
  MessageSquare,
  Bell,
  Settings,
  Plus,
  Award,
  Clock,
  Target,
  MapPin,
  MessageCircle,
  Network,
  BarChart,
  Brain,
  Wrench,
  BookOpen,
  Briefcase,
  User
} from "lucide-react";
import UnifiedCalendar from '@/components/UnifiedCalendar';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import { useEvents } from '@/hooks/useEvents';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import VideoConferencing from '@/components/VideoConferencing';
import { Video } from 'lucide-react';

const MentorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const { profile: profileWithRole } = useProfileWithRole();
  const { activeMentees, pastMentees, todaySessions } = useMentorDashboard();
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || "social");
  const [activeVideoSession, setActiveVideoSession] = useState<any>(null);
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
    if (!roleLoading && role && role !== 'mentor' && role !== 'advisor') {
      navigate('/dashboard');
    }
  }, [role, roleLoading, navigate]);

  return (
    <div className="min-h-screen bg-background pb-6 relative">
      <DashboardHeader />
      
      <div className="container mx-auto px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 pb-4 sm:pb-8">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile: Only Avatar */}
          <div className="md:hidden flex justify-start mb-4">
            <RoleBasedAvatar 
              avatarUrl={profileWithRole?.avatar_url} 
              role="mentor"
              fallbackText={user?.email || 'M'}
              className="h-16 w-16"
            />
          </div>
          
          {/* Desktop: Full Welcome Section */}
          <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <RoleBasedAvatar 
                avatarUrl={profileWithRole?.avatar_url} 
                role="mentor"
                fallbackText={user?.email || 'M'}
                className="h-16 w-16"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Welcome back, {profileWithRole?.full_name || 'Mentor'}! 👋</h1>
                <p className="text-sm text-muted-foreground mt-1">Ready to guide the next generation of entrepreneurs?</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Bell className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Notifications</span>
              </Button>
              <Button variant="hero" size="sm" className="flex-1 sm:flex-none">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Share Insights</span>
              </Button>
            </div>
          </div>
        </div>


        {/* Tabbed Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-8 max-w-5xl">
              <TabsTrigger value="social" className="flex-shrink-0 gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden md:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-shrink-0 gap-2">
                <Network className="h-4 w-4" />
                <span className="hidden md:inline">Network</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex-shrink-0 gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden md:inline">Jobs</span>
              </TabsTrigger>
              <TabsTrigger value="mentees" className="flex-shrink-0 gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Mentees</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-shrink-0 gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden md:inline">Calendar</span>
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

          <TabsContent value="social" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <MentorRoadmapWidget />
                <UnifiedCommunityFeed showCreatePost={false} limit={5} />
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/messages")}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message Mentees
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/calendar")}>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Schedule Session
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Award className="w-4 h-4 mr-2" />
                      View Programs
                    </Button>
                  </CardContent>
                </Card>
                <ConnectionsWidget />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <AdvisorProfileView />
            
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

          <TabsContent value="network" className="space-y-4">
            <MatchingSystem />
            <NetworkBrowser />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <UnifiedJobsBoard />
            <AdvisorJobTaskViewer />
          </TabsContent>

          <TabsContent value="mentees" className="space-y-6">
            <MenteeSessions onJoinMeeting={(link, sessionData) => setActiveVideoSession(sessionData)} />
            <MentorshipRequests />
            <MentorOffersBoard />
            
            {/* Past Mentees Section */}
            {pastMentees && pastMentees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Past Mentees</CardTitle>
                  <CardDescription>Previous mentorship relationships</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pastMentees.map(mentee => (
                      <div key={mentee.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Avatar>
                          <AvatarImage src={mentee.mentee.avatar_url} />
                          <AvatarFallback>{mentee.mentee.full_name?.[0] || 'M'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{mentee.mentee.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {mentee.companies?.name || 'No company info'}
                          </p>
                        </div>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
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
            {upcomingEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <div className="flex gap-4 pb-4">
                      {upcomingEvents.slice(0, 6).map((event) => (
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
                              <img
                                src={event.banner_url}
                                alt={event.title}
                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                              />
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
              </Card>
            )}
            
            <UnifiedCalendar
              showCreateButton={false}
              userRole={role || 'mentor'}
              onItemClick={(item) => {
                if (item.type === 'event') {
                  setSelectedEvent(item);
                  setShowEventDetails(true);
                } else if (item.type === 'session' && item.meeting_link) {
                  setActiveVideoSession(item);
                }
              }}
              filterTypes={['event', 'session', 'availability']}
            />

            {/* Availability Manager - Bottom of Calendar Tab */}
            <div className="pt-6 border-t">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Availability Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Set your recurring weekly availability for mentoring sessions
                </p>
              </div>
              <AvailabilityManager />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Mentor Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Mentees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeMentees.length}</div>
                  <p className="text-xs text-muted-foreground">Currently mentoring</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sessions Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todaySessions.length}</div>
                  <p className="text-xs text-muted-foreground">{todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0)} min scheduled</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Success Stories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Impact Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-ocean-primary">-</div>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
            </div>
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6">
            <MarketIntelligenceWidget />
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <AIFeaturesHub />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Chat with AI */}
      <FloatingChat />
      
      {/* Video Conferencing Dialog */}
      <Dialog open={!!activeVideoSession} onOpenChange={(open) => !open && setActiveVideoSession(null)}>
        <DialogContent className="max-w-6xl h-[90vh] p-0">
          {activeVideoSession && (
            <VideoConferencing
              roomUrl={activeVideoSession.meeting_link}
              userId={user?.id}
              hostId={activeVideoSession.host_id || activeVideoSession.mentor_id}
              userName={profileWithRole?.full_name || user?.email || 'User'}
              meetingTitle={activeVideoSession.topic || 'Mentoring Session'}
              onLeave={() => setActiveVideoSession(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <CreateSessionDialog
        open={createSessionDialogOpen}
        onOpenChange={setCreateSessionDialogOpen}
        onSessionCreated={() => {
          setCreateSessionDialogOpen(false);
        }}
      />
      <CreateEventDialog 
        open={createEventDialogOpen}
        onOpenChange={setCreateEventDialogOpen}
        onEventCreated={() => {
          setCreateEventDialogOpen(false);
        }}
      />
      {selectedEvent && (
        <EventDetailsDialog 
          event={selectedEvent}
          open={showEventDetails}
          onOpenChange={setShowEventDetails}
          onEventUpdated={() => {
            setShowEventDetails(false);
          }}
        />
      )}
    </div>
  );
};

export default MentorDashboard;