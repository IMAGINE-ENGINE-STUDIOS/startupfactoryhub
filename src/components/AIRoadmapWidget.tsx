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
  return;
};
export default AIRoadmapWidget;