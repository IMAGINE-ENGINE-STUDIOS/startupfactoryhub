import { useState } from 'react';
import DashboardNavigation from '@/components/DashboardNavigation';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import VideoConferencing from '@/components/VideoConferencing';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Calendar as CalendarIcon, Clock, User, CheckCircle2, XCircle, Loader2, Plus, MapPin, Users } from 'lucide-react';
import { useMentoringSessions } from '@/hooks/useMentoringSessions';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export default function Calendar() {
  const { user } = useAuth();
  const { upcomingSessions, pastSessions, loading, updateSession, refetch } = useMentoringSessions();
  const { upcomingEvents, loading: eventsLoading } = useEvents();
  const [activeCallUrl, setActiveCallUrl] = useState<string | undefined>();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleJoinSession = (session: any) => {
    if (session.meeting_link) {
      setActiveCallUrl(session.meeting_link);
    }
  };

  const handleUpdateStatus = async (sessionId: string, status: string) => {
    await updateSession(sessionId, { status });
  };

  const handleItemClick = (item: any) => {
    if (item.type === 'event') {
      setSelectedEvent(item);
      setShowEventDetails(true);
    } else if (item.type === 'session' && item.meeting_link) {
      setActiveCallUrl(item.meeting_link);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      
      <div className="container mx-auto px-4 py-6 pt-20 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Calendar & Sessions</h1>
            <p className="text-sm text-muted-foreground">
              Manage events, mentoring sessions, and your availability
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setScheduleDialogOpen(true)} variant="outline">
              <Video className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
            <Button onClick={() => setCreateEventDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Unified Calendar View */}
          <TabsContent value="calendar" className="space-y-6">
            <UnifiedCalendar 
              showCreateButton={false}
              onItemClick={handleItemClick}
              filterTypes={['event', 'session', 'availability']}
            />
            
            {/* Upcoming Events Grid with Banners */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events & Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Community Events with Banners */}
                  {upcomingEvents.slice(0, 3).map((event) => (
                    <div
                      key={`event-${event.id}`}
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
                          <Badge variant="outline" className="mt-2 bg-purple-500/10 text-purple-500">
                            Event
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Mentoring Sessions */}
                  {upcomingSessions.slice(0, 3).map((session) => {
                    const isMentor = session.mentor_id === user?.id;
                    const otherUser = isMentor ? session.mentee_profile : session.mentor_profile;
                    
                    return (
                      <div
                        key={`session-${session.id}`}
                        className="group cursor-pointer"
                        onClick={() => handleJoinSession(session)}
                      >
                        <div className="relative overflow-hidden rounded-lg border hover:border-primary transition-all">
                          <div className="w-full h-48 bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                            <Video className="h-16 w-16 text-blue-500/30" />
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold mb-2 line-clamp-1">{session.topic}</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                {format(new Date(session.scheduled_at), 'MMM d, h:mm a')}
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                <span className="line-clamp-1">
                                  {isMentor ? 'Mentee' : 'Mentor'}: {otherUser?.full_name || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Video className="h-3 w-3" />
                                {session.duration_minutes} min
                              </div>
                            </div>
                            <Badge 
                              variant="outline"
                              className="mt-2 bg-blue-500/10 text-blue-500"
                            >
                              Session - {session.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {activeCallUrl && (
              <VideoConferencing 
                roomUrl={activeCallUrl}
                onLeave={() => setActiveCallUrl(undefined)}
              />
            )}
          </TabsContent>

          {/* Upcoming Sessions */}
          <TabsContent value="sessions" className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-2 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : upcomingSessions.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No upcoming sessions scheduled</p>
                    <Button 
                      className="mt-4"
                      onClick={() => setScheduleDialogOpen(true)}
                    >
                      Schedule Your First Session
                    </Button>
                  </Card>
                ) : (
                  upcomingSessions.map((session) => {
                    const isMentor = session.mentor_id === user?.id;
                    const otherUser = isMentor ? session.mentee_profile : session.mentor_profile;
                    
                    return (
                      <Card key={session.id} className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-lg">{session.topic}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span>
                                    {isMentor ? 'Mentee' : 'Mentor'}: {otherUser?.full_name || 'Unknown'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{session.duration_minutes} min</span>
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant={session.status === 'confirmed' ? 'default' : 'secondary'}
                            >
                              {session.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="h-4 w-4" />
                            <span>
                              {format(new Date(session.scheduled_at), 'PPP p')} 
                              {' '}({formatDistanceToNow(new Date(session.scheduled_at), { addSuffix: true })})
                            </span>
                          </div>

                          {session.description && (
                            <p className="text-sm text-muted-foreground">{session.description}</p>
                          )}

                          <div className="flex gap-2">
                            {session.meeting_link && (
                              <Button 
                                className="flex-1"
                                onClick={() => handleJoinSession(session)}
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Join Session
                              </Button>
                            )}
                            {isMentor && session.status === 'pending' && (
                              <Button 
                                variant="outline"
                                onClick={() => handleUpdateStatus(session.id, 'confirmed')}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Confirm
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleUpdateStatus(session.id, 'cancelled')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                <VideoConferencing 
                  roomUrl={activeCallUrl}
                  onLeave={() => setActiveCallUrl(undefined)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Past Sessions & Events */}
          <TabsContent value="history" className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-2 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : pastSessions.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No past sessions yet</p>
                  </Card>
                ) : (
                  pastSessions.map((session) => {
                    const isMentor = session.mentor_id === user?.id;
                    const otherUser = isMentor ? session.mentee_profile : session.mentor_profile;
                    
                    return (
                      <Card key={session.id} className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-lg">{session.topic}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span>
                                    {isMentor ? 'Mentee' : 'Mentor'}: {otherUser?.full_name || 'Unknown'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{session.duration_minutes} min</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {session.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{format(new Date(session.scheduled_at), 'PPP')}</span>
                          </div>

                          {session.notes && (
                            <div className="pt-2 border-t">
                              <p className="text-sm text-muted-foreground">{session.notes}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                <VideoConferencing 
                  roomUrl={activeCallUrl}
                  onLeave={() => setActiveCallUrl(undefined)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateSessionDialog 
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onSessionCreated={refetch}
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
          open={showEventDetails}
          onOpenChange={setShowEventDetails}
          event={selectedEvent}
          onEventUpdated={() => {
            setShowEventDetails(false);
          }}
        />
      )}
    </div>
  );
}
