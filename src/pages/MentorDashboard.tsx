import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardNavigation from "@/components/DashboardNavigation";
import MentorRoadmapWidget from "@/components/MentorRoadmapWidget";
import MentorCalendarWidget from "@/components/MentorCalendarWidget";
import UnifiedCommunityFeed from "@/components/UnifiedCommunityFeed";
import AIFeaturesHub from "@/components/AIFeaturesHub";
import MentorshipRequests from "@/components/MentorshipRequests";
import ConnectionsWidget from "@/components/ConnectionsWidget";
import AvailabilityManager from "@/components/AvailabilityManager";
import FloatingChat from "@/components/FloatingChat";
import UnifiedJobsBoard from "@/components/UnifiedJobsBoard";
import AdvisorJobTaskViewer from "@/components/AdvisorJobTaskViewer";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AdvisorProfileView from "@/components/AdvisorProfileView";
import MarketIntelligenceWidget from "@/components/MarketIntelligenceWidget";
import RoleBasedAvatar from "@/components/RoleBasedAvatar";
import { useProfileWithRole } from "@/hooks/useProfileWithRole";
import StartupBrowser from "@/components/StartupBrowser";
import NetworkBrowser from "@/components/NetworkBrowser";
import MentorOffersBoard from "@/components/MentorOffersBoard";
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


const MentorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const { profile: profileWithRole } = useProfileWithRole();
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("social");
  const { upcomingEvents } = useEvents();

  // Redirect if wrong role
  useEffect(() => {
    if (!roleLoading && role && role !== 'mentor' && role !== 'advisor') {
      navigate('/dashboard');
    }
  }, [role, roleLoading, navigate]);

  return (
    <div className="min-h-screen bg-background pb-6 relative">
      <DashboardHeader />
      <DashboardNavigation />
      
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
            <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-9 max-w-5xl">
              <TabsTrigger value="social" className="flex-shrink-0 gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden md:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex-shrink-0 gap-2">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">Profile</span>
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
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <NetworkBrowser />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <UnifiedJobsBoard />
            <AdvisorJobTaskViewer />
          </TabsContent>

          <TabsContent value="mentees" className="space-y-6">
            <MentorshipRequests />
            <MentorOffersBoard />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingEvents.slice(0, 6).map((event) => (
                      <div
                        key={event.id}
                        className="group cursor-pointer"
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
                          <div className="p-4">
                            <h3 className="font-semibold mb-2 line-clamp-1">{event.title}</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
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
                }
              }}
              filterTypes={['event', 'session', 'availability']}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Mentor Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Mentees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+2 this month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sessions This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">28</div>
                  <p className="text-xs text-muted-foreground">8 hours mentoring</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Success Stories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">Startups funded</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Impact Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-ocean-primary">98</div>
                  <p className="text-xs text-muted-foreground">Top 5% mentors</p>
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