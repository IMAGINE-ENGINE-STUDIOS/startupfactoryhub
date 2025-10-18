import DashboardNavigation from '@/components/DashboardNavigation';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import VideoConferencing from '@/components/VideoConferencing';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import { SessionRatingDialog } from '@/components/SessionRatingDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Calendar, Clock, User, CheckCircle2, XCircle, Loader2, Star } from 'lucide-react';
import { useMentoringSessions } from '@/hooks/useMentoringSessions';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export default function MentoringSessions() {
  const { user } = useAuth();
  const { upcomingSessions, pastSessions, loading, updateSession, refetch } = useMentoringSessions();
  const [activeCallUrl, setActiveCallUrl] = useState<string | undefined>();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingSessionId, setRatingSessionId] = useState<string>('');
  const [ratingSessionTopic, setRatingSessionTopic] = useState<string>('');
  const [sessionRatings, setSessionRatings] = useState<Record<string, any>>({});

  const handleJoinSession = (session: any) => {
    if (session.meeting_link) {
      setActiveCallUrl(session.meeting_link);
    }
  };

  const handleUpdateStatus = async (sessionId: string, status: string) => {
    await updateSession(sessionId, { status });
  };

  const openRatingDialog = (session: any) => {
    setRatingSessionId(session.id);
    setRatingSessionTopic(session.topic || 'Session');
    setRatingDialogOpen(true);
  };

  const fetchSessionRatings = async () => {
    if (!user || pastSessions.length === 0) return;

    const sessionIds = pastSessions.map((s) => s.id);
    const { data } = await supabase
      .from('session_feedback')
      .select('session_id, rating, feedback_text')
      .in('session_id', sessionIds)
      .eq('given_by', user.id);

    const ratingsMap: Record<string, any> = {};
    (data || []).forEach((r) => {
      ratingsMap[r.session_id] = r;
    });
    setSessionRatings(ratingsMap);
  };

  useEffect(() => {
    fetchSessionRatings();
  }, [pastSessions, user]);

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

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <UnifiedCalendar 
              showCreateButton={false}
              onItemClick={(item) => {
                if (item.type === 'session' && item.meeting_link) {
                  setActiveCallUrl(item.meeting_link);
                }
              }}
              filterTypes={['event', 'session', 'availability']}
            />
            
            {activeCallUrl && (
              <VideoConferencing 
                roomUrl={activeCallUrl}
                onLeave={() => setActiveCallUrl(undefined)}
              />
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-2 space-y-4">
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

          <TabsContent value="past" className="space-y-4">
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
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(session.scheduled_at), 'PPP')}</span>
                          </div>

                          {session.notes && (
                            <div className="pt-2 border-t">
                              <p className="text-sm text-muted-foreground">{session.notes}</p>
                            </div>
                          )}

                          {/* Rating Section */}
                          <div className="pt-3 border-t">
                            {sessionRatings[session.id] ? (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= sessionRatings[session.id].rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-muted-foreground'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-muted-foreground">
                                  You rated: {sessionRatings[session.id].rating}/5
                                </span>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRatingDialog(session)}
                                className="w-full"
                              >
                                <Star className="h-4 w-4 mr-2" />
                                Rate Session
                              </Button>
                            )}
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
        </Tabs>
      </div>

      <CreateSessionDialog 
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onSessionCreated={refetch}
      />

      <SessionRatingDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        sessionId={ratingSessionId}
        sessionTopic={ratingSessionTopic}
        onRatingSubmitted={() => {
          fetchSessionRatings();
          refetch();
        }}
      />
    </div>
  );
}
