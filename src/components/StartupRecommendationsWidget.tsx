import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, UserPlus, TrendingUp } from "lucide-react";

const StartupRecommendationsWidget = () => {
  const recommendedStartups = [
    {
      id: 1,
      name: "CodeFlow AI",
      founders: ["Alex Kim"],
      industry: "AI/ML",
      stage: "Pre-seed",
      description: "AI-powered code review and optimization platform",
      matchScore: 94,
      avatar: "/placeholder.svg",
      lookingFor: ["Technical mentorship", "Product strategy"]
    },
    {
      id: 2,
      name: "EcoDelivery",
      founders: ["Maria Santos"],
      industry: "Logistics",
      stage: "Seed",
      description: "Sustainable last-mile delivery using electric vehicles",
      matchScore: 87,
      avatar: "/placeholder.svg",
      lookingFor: ["Scaling operations", "Investor connections"]
    },
    {
      id: 3,
      name: "HealthSync",
      founders: ["David Park", "Lisa Wong"],
      industry: "HealthTech",
      stage: "Pre-seed",
      description: "Patient data synchronization across healthcare providers",
      matchScore: 83,
      avatar: "/placeholder.svg",
      lookingFor: ["Regulatory guidance", "Healthcare partnerships"]
    }
  ];

  const getMatchColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 80) return "text-ocean-primary";
    return "text-yellow-500";
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Pre-seed": return "bg-yellow-500/10 text-yellow-600";
      case "Seed": return "bg-ocean-primary/10 text-ocean-primary";
      case "Growth": return "bg-green-500/10 text-green-600";
      default: return "bg-muted/10 text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-ocean-primary" />
          Startup Matches
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Startups aligned with your expertise
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendedStartups.map((startup) => (
          <div 
            key={startup.id} 
            className="p-4 rounded-lg border border-ocean-border/50 hover:bg-ocean-surface/10 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={startup.avatar} alt={startup.name} />
                <AvatarFallback>{startup.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm truncate">{startup.name}</h4>
                  <Badge variant="outline" className={`text-xs ${getMatchColor(startup.matchScore)}`}>
                    {startup.matchScore}% match
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className={`text-xs ${getStageColor(startup.stage)}`}>
                    {startup.stage}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {startup.industry}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {startup.description}
                </p>
                
                <p className="text-xs text-muted-foreground mb-3">
                  <span className="font-medium">Looking for:</span> {startup.lookingFor.join(", ")}
                </p>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <UserPlus className="w-3 h-3 mr-1" />
                    Connect
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <Button variant="outline" className="w-full mt-4">
          <Users className="w-4 h-4 mr-2" />
          Browse All Startups
        </Button>
      </CardContent>
    </Card>
  );
};

export default StartupRecommendationsWidget;