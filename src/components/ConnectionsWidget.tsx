import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, UserPlus } from "lucide-react";

const ConnectionsWidget = () => {
  const recommendedConnections = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "FinTech Mentor",
      company: "Ex-Stripe, Ex-Goldman Sachs",
      expertise: ["Payments", "Compliance", "Series A"],
      avatar: "/placeholder.svg",
      matchScore: 95
    },
    {
      id: 2,
      name: "Marcus Rodriguez",
      role: "Seed Investor",
      company: "TechStart Ventures",
      expertise: ["FinTech", "B2B SaaS", "Early Stage"],
      avatar: "/placeholder.svg",
      matchScore: 88
    },
    {
      id: 3,
      name: "Emma Thompson",
      role: "Product Lead",
      company: "Looking for opportunities",
      expertise: ["Product Management", "UX", "FinTech"],
      avatar: "/placeholder.svg",
      matchScore: 82
    }
  ];

  const getMatchColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 80) return "text-ocean-primary";
    return "text-yellow-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Users className="w-5 h-5 mr-2 text-ocean-primary" />
          Recommended Connections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendedConnections.map((connection) => (
          <div key={connection.id} className="flex items-start space-x-3 p-3 rounded-lg border border-ocean-border/50 hover:bg-ocean-surface/10 transition-colors">
            <Avatar className="h-10 w-10">
              <AvatarImage src={connection.avatar} alt={connection.name} />
              <AvatarFallback>{connection.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm truncate">{connection.name}</h4>
                <Badge variant="outline" className={`text-xs ${getMatchColor(connection.matchScore)}`}>
                  {connection.matchScore}% match
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-1">{connection.role}</p>
              <p className="text-xs text-muted-foreground mb-2">{connection.company}</p>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {connection.expertise.slice(0, 2).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {connection.expertise.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{connection.expertise.length - 2}
                  </Badge>
                )}
              </div>
              
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
        ))}
        
        <Button variant="outline" className="w-full mt-4">
          View All Recommendations
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConnectionsWidget;