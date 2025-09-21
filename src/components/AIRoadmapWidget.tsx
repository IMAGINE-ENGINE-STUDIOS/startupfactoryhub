import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Bot, CheckCircle, Clock, ArrowRight, Target } from "lucide-react";
const AIRoadmapWidget = () => {
  const milestones = [{
    id: 1,
    title: "Regulatory Compliance Review",
    description: "Complete financial services compliance audit",
    status: "in-progress",
    progress: 75,
    priority: "high",
    dueDate: "This Week"
  }, {
    id: 2,
    title: "MVP User Testing",
    description: "Launch beta with 50 target users",
    status: "completed",
    progress: 100,
    priority: "medium",
    dueDate: "Completed"
  }, {
    id: 3,
    title: "Investor Deck Preparation",
    description: "Prepare Series A pitch deck and financial projections",
    status: "upcoming",
    progress: 0,
    priority: "high",
    dueDate: "Next Week"
  }];
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "in-progress":
        return "text-ocean-primary";
      case "upcoming":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <span>AI-Powered Roadmap</span>
        </CardTitle>
        <CardDescription>Your personalized startup journey milestones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="flex items-start space-x-4 p-4 rounded-lg border border-border/50">
            <div className="flex-shrink-0">
              {milestone.status === "completed" ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : milestone.status === "in-progress" ? (
                <Clock className="h-6 w-6 text-primary" />
              ) : (
                <Target className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-foreground">{milestone.title}</h3>
                <Badge variant={getPriorityVariant(milestone.priority)}>
                  {milestone.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
              <div className="flex items-center justify-between">
                <Progress value={milestone.progress} className="flex-1 mr-4" />
                <span className="text-sm font-medium text-foreground">{milestone.progress}%</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{milestone.dueDate}</span>
                <Button size="sm" variant="outline">
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
export default AIRoadmapWidget;