import DashboardNavigation from '@/components/DashboardNavigation';
import CalendarIntegration from '@/components/CalendarIntegration';
import VideoConferencing from '@/components/VideoConferencing';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Calendar, Clock, User, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useMentoringSessions } from '@/hooks/useMentoringSessions';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';

export default function MentoringSessions() {
  const { user } = useAuth();
  const { upcomingSessions, pastSessions, loading, updateSession, refetch } = useMentoringSessions();
  const [activeCallUrl, setActiveCallUrl] = useState<string | undefined>();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const handleJoinSession = (session: any) => {
    if (session.meeting_link) {
      setActiveCallUrl(session.meeting_link);
    }
  };

  const handleUpdateStatus = async (sessionId: string, status: string) => {
    await updateSession(sessionId, { status });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      
      <div className="container mx-auto px-4 py-6 pt-20 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Mentoring Sessions</h1>
            <p className="text-sm text-muted-foreground">
              Manage your mentoring schedule and video calls
            </p>
          </div>
          <Button onClick={() => setScheduleDialogOpen(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past Sessions</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="mt-6 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : upcomingSessions.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No upcoming sessions scheduled</p>
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
                            <Calendar className="h-4 w-4" />
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
              </TabsContent>

              <TabsContent value="past" className="mt-6 space-y-4">
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
                            <Calendar className="h-4 w-4" />
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
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 lg:space-y-6">
            <VideoConferencing 
              roomUrl={activeCallUrl}
              onLeave={() => setActiveCallUrl(undefined)}
            />
            <CalendarIntegration />
          </div>
        </div>
      </div>

      <CreateSessionDialog 
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onSessionCreated={refetch}
      />
    </div>
  );
}
