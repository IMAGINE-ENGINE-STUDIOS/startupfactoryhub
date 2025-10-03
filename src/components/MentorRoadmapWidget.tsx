import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, Users } from "lucide-react";

export default function MentorRoadmapWidget() {
  const mentorSuggestions = [
    {
      title: "Schedule session with Alex (overdue)",
      priority: "high",
      impact: "Mentee needs guidance on pitch deck"
    },
    {
      title: "Review Sarah's progress report",
      priority: "medium",
      impact: "Weekly check-in due"
    },
    {
      title: "Update your expertise areas",
      priority: "low",
      impact: "Attract more mentees"
    }
  ];

  return (
    <Card className="tech-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Mentoring Priorities
        </CardTitle>
        <CardDescription>
          AI-suggested actions for your mentees
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {mentorSuggestions.map((suggestion, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors">
            <Users className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-sm">{suggestion.title}</h4>
                <Badge variant={suggestion.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                  {suggestion.priority}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{suggestion.impact}</p>
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full mt-2 gap-2">
          <Sparkles className="h-4 w-4" />
          Generate Weekly Summary
        </Button>
      </CardContent>
    </Card>
  );
}
