import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video } from "lucide-react";
import { useMentoringSessions } from "@/hooks/useMentoringSessions";
import { format } from "date-fns";

interface MentorCalendarWidgetProps {
  onJoinMeeting?: (meetingLink: string) => void;
}

export default function MentorCalendarWidget({ onJoinMeeting }: MentorCalendarWidgetProps = {}) {
  const { upcomingSessions, loading } = useMentoringSessions();

  // Filter to next 3 sessions
  const nextSessions = upcomingSessions
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 3);

  const handleJoinMeeting = (meetingLink?: string) => {
    if (meetingLink) {
      if (onJoinMeeting) {
        onJoinMeeting(meetingLink);
      } else {
        window.open(meetingLink, '_blank');
      }
    }
  };

  return (
    <Card className="tech-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Sessions
        </CardTitle>
        <CardDescription>
          Your next mentoring sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : nextSessions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No upcoming sessions
          </div>
        ) : (
          nextSessions.map((session) => {
            const sessionDate = new Date(session.scheduled_at);
            const now = new Date();
            const isWithin30Min = sessionDate.getTime() - now.getTime() < 30 * 60 * 1000;
            
            return (
              <div key={session.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-sm">
                        {session.mentee_profile?.full_name || 'Mentee'}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {session.topic || 'Mentoring Session'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {session.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(sessionDate, 'MMM d, h:mm a')}
                    </span>
                    <span>{session.duration_minutes} min</span>
                  </div>
                  {isWithin30Min && session.meeting_link && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => handleJoinMeeting(session.meeting_link)}
                    >
                      <Video className="h-3 w-3" />
                      Join Session
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <Button variant="outline" className="w-full mt-2">
          View Full Calendar
        </Button>
      </CardContent>
    </Card>
  );
}
