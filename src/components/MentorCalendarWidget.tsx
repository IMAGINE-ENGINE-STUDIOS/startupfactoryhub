import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, Users } from "lucide-react";

const MentorCalendarWidget = () => {
  const upcomingSessions = [
    {
      id: 1,
      startup: "FinPay Solutions",
      founder: "John Doe",
      time: "Tomorrow 2:00 PM",
      duration: "1 hour",
      type: "Strategy Session",
      mode: "video"
    },
    {
      id: 2,
      startup: "GreenTech",
      founder: "Emma Wilson",
      time: "Friday 10:00 AM",
      duration: "45 mins",
      type: "Product Review",
      mode: "in-person"
    },
    {
      id: 3,
      startup: "AI Healthcare",
      founder: "Mike Chen",
      time: "Next Mon 3:00 PM",
      duration: "30 mins",
      type: "Quick Check-in",
      mode: "video"
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Strategy Session": return "bg-ocean-primary/10 text-ocean-primary";
      case "Product Review": return "bg-accent/10 text-accent";
      case "Quick Check-in": return "bg-green-500/10 text-green-600";
      default: return "bg-muted/10 text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-ocean-primary" />
          Upcoming Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingSessions.map((session) => (
          <div 
            key={session.id}
            className="p-3 rounded-lg border border-ocean-border/50 hover:bg-ocean-surface/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{session.startup}</h4>
              <Badge className={`text-xs ${getTypeColor(session.type)}`}>
                {session.type}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mb-2">with {session.founder}</p>
            
            <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-3">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {session.time}
              </div>
              <div className="flex items-center">
                {session.mode === "video" ? (
                  <Video className="w-3 h-3 mr-1" />
                ) : (
                  <Users className="w-3 h-3 mr-1" />
                )}
                {session.duration}
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="w-full">
              {session.mode === "video" ? "Join Video Call" : "View Details"}
            </Button>
          </div>
        ))}
        
        <Button variant="outline" className="w-full mt-4">
          <Calendar className="w-4 h-4 mr-2" />
          View Full Calendar
        </Button>
      </CardContent>
    </Card>
  );
};

export default MentorCalendarWidget;