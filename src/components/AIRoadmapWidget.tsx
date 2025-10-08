import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";
export default function AIRoadmapWidget() {
  const suggestions = [{
    title: "Complete your company profile",
    priority: "high",
    aiGenerated: true,
    impact: "Increases visibility by 60%"
  }, {
    title: "Connect with 3 mentors",
    priority: "medium",
    aiGenerated: true,
    impact: "Accelerates growth"
  }, {
    title: "Upload pitch deck",
    priority: "high",
    aiGenerated: true,
    impact: "Essential for investors"
  }];
  return <Card className="tech-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Roadmap Suggestions
        </CardTitle>
        <CardDescription>
          Personalized next steps based on your progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, idx) => <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-sm">{suggestion.title}</h4>
                <Badge variant={suggestion.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                  {suggestion.priority}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {suggestion.impact}
              </p>
              {suggestion.aiGenerated && <Badge variant="outline" className="text-xs gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Generated
                </Badge>}
            </div>
          </div>)}
        
      </CardContent>
    </Card>;
}