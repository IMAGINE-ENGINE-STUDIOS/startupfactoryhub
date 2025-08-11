import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Bot, CheckCircle, Clock, ArrowRight, Target } from "lucide-react";

const AIRoadmapWidget = () => {
  const milestones = [
    {
      id: 1,
      title: "Regulatory Compliance Review",
      description: "Complete financial services compliance audit",
      status: "in-progress",
      progress: 75,
      priority: "high",
      dueDate: "This Week"
    },
    {
      id: 2,
      title: "MVP User Testing",
      description: "Launch beta with 50 target users",
      status: "completed",
      progress: 100,
      priority: "medium",
      dueDate: "Completed"
    },
    {
      id: 3,
      title: "Investor Deck Preparation",
      description: "Prepare Series A pitch deck and financial projections",
      status: "upcoming",
      progress: 0,
      priority: "high",
      dueDate: "Next Week"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-500";
      case "in-progress": return "text-ocean-primary";
      case "upcoming": return "text-muted-foreground";
      default: return "text-muted-foreground";
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  return (
    <Card className="glass-morphism">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Bot className="w-5 h-5 mr-2 text-ocean-primary" />
              AI-Generated Roadmap
            </CardTitle>
            <CardDescription>
              Personalized milestones based on your FinTech startup stage
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Target className="w-4 h-4 mr-2" />
            Customize
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <div 
              key={milestone.id}
              className="glass-morphism p-4 rounded-lg border-l-4 border-ocean-primary hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium">{milestone.title}</h4>
                    <Badge variant={getPriorityVariant(milestone.priority)} className="text-xs">
                      {milestone.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {milestone.description}
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className={`flex items-center ${getStatusColor(milestone.status)}`}>
                      {milestone.status === "completed" ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : (
                        <Clock className="w-4 h-4 mr-1" />
                      )}
                      <span className="text-xs font-medium capitalize">
                        {milestone.status.replace("-", " ")}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      • {milestone.dueDate}
                    </span>
                  </div>
                </div>
              </div>
              
              {milestone.status !== "completed" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{milestone.progress}%</span>
                  </div>
                  <Progress value={milestone.progress} className="h-2" />
                </div>
              )}
              
              {milestone.status === "upcoming" && (
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  Start Milestone
                  <ArrowRight className="w-3 h-3 ml-2" />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-ocean-surface/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm">Overall Progress</h4>
              <p className="text-xs text-muted-foreground">8 of 12 milestones completed</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-ocean-primary">67%</div>
              <Progress value={67} className="w-20 mt-1" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIRoadmapWidget;