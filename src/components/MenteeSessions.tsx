import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMentoringSessions } from '@/hooks/useMentoringSessions';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  Video, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Users,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

interface MenteeSessionsProps {
  onJoinMeeting?: (meetingLink: string) => void;
}

export default function MenteeSessions({ onJoinMeeting }: MenteeSessionsProps = {}) {
  const { sessions, loading, updateSession } = useMentoringSessions();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const requestedSessions = sessions.filter(
    s => s.status === 'pending' || s.status === 'requested'
  );

  const scheduledSessions = sessions.filter(
    s => s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
  );

  const handleAccept = async (sessionId: string) => {
    setProcessingId(sessionId);
    const { error } = await updateSession(sessionId, { status: 'scheduled' });
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept session request',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Session Accepted',
        description: 'The session has been scheduled successfully',
      });
    }
    setProcessingId(null);
  };

  const handleDecline = async (sessionId: string) => {
    setProcessingId(sessionId);
    const { error } = await updateSession(sessionId, { status: 'declined' });
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to decline session request',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Session Declined',
        description: 'The session request has been declined',
      });
    }
    setProcessingId(null);
  };

  const handleCancel = async (sessionId: string) => {
    setProcessingId(sessionId);
    const { error } = await updateSession(sessionId, { status: 'cancelled' });
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel session',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Session Cancelled',
        description: 'The session has been cancelled',
      });
    }
    setProcessingId(null);
  };

  const handleJoinMeeting = (meetingLink?: string) => {
    if (meetingLink) {
      if (onJoinMeeting) {
        onJoinMeeting(meetingLink);
      } else {
        window.open(meetingLink, '_blank');
      }
    } else {
      toast({
        title: 'No Meeting Link',
        description: 'This session does not have a meeting link',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading sessions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Requested Sessions */}
      {requestedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Session Requests
              <Badge variant="secondary">{requestedSessions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requestedSessions.map((session) => (
                <Card key={session.id} className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={session.mentee_profile?.avatar_url} />
                          <AvatarFallback>
                            {session.mentee_profile?.full_name?.[0] || 'M'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground">
                            {session.mentee_profile?.full_name || 'Mentee'}
                          </h4>
                          <p className="text-sm font-medium text-primary mt-1">
                            {session.topic || 'Mentoring Session'}
                          </p>
                          {session.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {session.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(session.scheduled_at), 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(session.scheduled_at), 'h:mm a')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {session.duration_minutes} min
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(session.id)}
                          disabled={processingId === session.id}
                          className="flex-1 sm:flex-none gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecline(session.id)}
                          disabled={processingId === session.id}
                          className="flex-1 sm:flex-none gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Sessions */}
      {scheduledSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Upcoming Sessions
              <Badge variant="secondary">{scheduledSessions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledSessions.map((session) => {
                const sessionDate = new Date(session.scheduled_at);
                const now = new Date();
                const isWithin30Min = sessionDate.getTime() - now.getTime() < 30 * 60 * 1000;
                const isWithin2Hours = sessionDate.getTime() - now.getTime() < 2 * 60 * 60 * 1000;

                return (
                  <Card 
                    key={session.id} 
                    className={isWithin2Hours ? 'border-primary' : 'border-muted'}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={session.mentee_profile?.avatar_url} />
                            <AvatarFallback>
                              {session.mentee_profile?.full_name?.[0] || 'M'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground">
                              {session.mentee_profile?.full_name || 'Mentee'}
                            </h4>
                            <p className="text-sm font-medium text-primary mt-1">
                              {session.topic || 'Mentoring Session'}
                            </p>
                            {session.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {session.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                              <div className={`flex items-center gap-1 ${isWithin2Hours ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                <Calendar className="h-3 w-3" />
                                {format(sessionDate, 'MMM d, yyyy')}
                              </div>
                              <div className={`flex items-center gap-1 ${isWithin2Hours ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                <Clock className="h-3 w-3" />
                                {format(sessionDate, 'h:mm a')}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {session.duration_minutes} min
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex sm:flex-col gap-2">
                          {isWithin30Min && (
                            <Button
                              size="sm"
                              onClick={() => handleJoinMeeting(session.meeting_link)}
                              className="flex-1 sm:flex-none gap-2"
                            >
                              <Video className="h-4 w-4" />
                              Join Meeting
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(session.id)}
                            disabled={processingId === session.id}
                            className="flex-1 sm:flex-none gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {requestedSessions.length === 0 && scheduledSessions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
            <p className="text-sm text-muted-foreground">
              Session requests and scheduled sessions will appear here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
