import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, Clock, CheckCircle, Users, MessageSquare } from "lucide-react";

const MentorRoadmapWidget = () => {
  const mentees = [
    {
      id: 1,
      name: "FinPay Solutions",
      founder: "John Doe",
      stage: "Seed",
      progress: 75,
      currentMilestone: "Series A Preparation",
      nextSession: "Tomorrow 2:00 PM",
      avatar: "/placeholder.svg"
    },
    {
      id: 2,
      name: "GreenTech Innovations",
      founder: "Emma Wilson",
      stage: "Pre-seed",
      progress: 45,
      currentMilestone: "MVP Development",
      nextSession: "Friday 10:00 AM",
      avatar: "/placeholder.svg"
    },
    {
      id: 3,
      name: "AI Healthcare",
      founder: "Mike Chen",
      stage: "Growth",
      progress: 90,
      currentMilestone: "International Expansion",
      nextSession: "Next week",
      avatar: "/placeholder.svg"
    }
  ];

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Pre-seed": return "bg-yellow-500/10 text-yellow-600";
      case "Seed": return "bg-ocean-primary/10 text-ocean-primary";
      case "Growth": return "bg-green-500/10 text-green-600";
      default: return "bg-muted/10 text-muted-foreground";
    }
  };

  return (
    <Card className="glass-morphism">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Target className="w-5 h-5 mr-2 text-ocean-primary" />
              Mentee Progress Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track your mentees' roadmap progress and upcoming sessions
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mentees.map((mentee) => (
            <div 
              key={mentee.id}
              className="glass-morphism p-4 rounded-lg border border-ocean-border/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={mentee.avatar} alt={mentee.name} />
                  <AvatarFallback>{mentee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{mentee.name}</h4>
                      <p className="text-xs text-muted-foreground">Founded by {mentee.founder}</p>
                    </div>
                    <Badge className={`text-xs ${getStageColor(mentee.stage)}`}>
                      {mentee.stage}
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Current: {mentee.currentMilestone}</span>
                      <span className="font-medium">{mentee.progress}%</span>
                    </div>
                    <Progress value={mentee.progress} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 mr-1" />
                      Next session: {mentee.nextSession}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="h-7 px-2">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Roadmap
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-ocean-surface/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm">Mentorship Impact</h4>
              <p className="text-xs text-muted-foreground">Average mentee progress this month</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-ocean-primary">+23%</div>
              <Progress value={78} className="w-20 mt-1" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MentorRoadmapWidget;