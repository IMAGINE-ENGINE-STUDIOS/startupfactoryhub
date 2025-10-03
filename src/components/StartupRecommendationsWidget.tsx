import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, TrendingUp, Building } from "lucide-react";

export default function StartupRecommendationsWidget() {
  const recommendations = [
    {
      name: "TechVenture AI",
      industry: "AI/ML",
      stage: "Series A",
      match: 92,
      reason: "Similar investment thesis"
    },
    {
      name: "GreenEnergy Plus",
      industry: "CleanTech",
      stage: "Seed",
      match: 88,
      reason: "Strong traction metrics"
    },
    {
      name: "HealthCare Now",
      industry: "HealthTech",
      stage: "Pre-seed",
      match: 85,
      reason: "Experienced founders"
    }
  ];

  return (
    <Card className="tech-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Startup Recommendations
        </CardTitle>
        <CardDescription>
          Curated matches based on your portfolio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary transition-colors">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-primary">
                <Building className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-sm">{rec.name}</h4>
                  <p className="text-xs text-muted-foreground">{rec.industry}</p>
                </div>
                <div className="text-right">
                  <Badge variant="default" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {rec.match}% match
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{rec.stage}</Badge>
                <span className="text-xs text-muted-foreground">{rec.reason}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View Profile
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full mt-2 gap-2">
          <Sparkles className="h-4 w-4" />
          Discover More Startups
        </Button>
      </CardContent>
    </Card>
  );
}
