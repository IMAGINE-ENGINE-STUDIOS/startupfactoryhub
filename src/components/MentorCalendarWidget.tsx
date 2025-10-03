import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video } from "lucide-react";

export default function MentorCalendarWidget() {
  const upcomingSessions = [
    {
      mentee: "Alex Thompson",
      topic: "Pitch Deck Review",
      time: "Today, 2:00 PM",
      duration: "60 min",
      type: "scheduled"
    },
    {
      mentee: "Sarah Chen",
      topic: "Growth Strategy",
      time: "Tomorrow, 10:00 AM",
      duration: "45 min",
      type: "scheduled"
    },
    {
      mentee: "Mike Roberts",
      topic: "Fundraising Advice",
      time: "Thu, 3:00 PM",
      duration: "30 min",
      type: "scheduled"
    }
  ];

  return (
    <Card className="tech-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Sessions
        </CardTitle>
        <CardDescription>
          Your mentoring schedule this week
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingSessions.map((session, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors">
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-sm">{session.mentee}</h4>
                  <p className="text-xs text-muted-foreground">{session.topic}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {session.type}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {session.time}
                </span>
                <span>{session.duration}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Video className="h-3 w-3" />
                Join Session
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full mt-2">
          View Full Calendar
        </Button>
      </CardContent>
    </Card>
  );
}
