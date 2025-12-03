import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, ExternalLink, Bookmark, MapPin } from "lucide-react";

const ResourcesWidget = () => {
  const suggestedResources = [
    {
      id: 1,
      title: "FinTech Regulatory Lab",
      type: "Lab Access",
      location: "London, UK",
      description: "Regulatory sandbox for FinTech testing",
      tags: ["Compliance", "Testing", "FCA"],
      featured: true
    },
    {
      id: 2,
      title: "Techstars FinTech Accelerator",
      type: "Program",
      location: "NYC, USA",
      description: "4-month acceleration program with $120K funding",
      tags: ["Accelerator", "Funding", "Mentorship"],
      featured: false
    },
    {
      id: 3,
      title: "AWS Activate Credits",
      type: "Perk",
      location: "Global",
      description: "$100,000 in AWS credits for startups",
      tags: ["Cloud", "Credits", "Infrastructure"],
      featured: false
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Lab Access": return "bg-ocean-primary/10 text-ocean-primary";
      case "Program": return "bg-accent/10 text-accent";
      case "Perk": return "bg-green-500/10 text-green-600";
      default: return "bg-muted/10 text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Building className="w-5 h-5 mr-2 text-ocean-primary" />
          Suggested Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestedResources.map((resource) => (
          <div 
            key={resource.id} 
            className={`p-4 rounded-lg border transition-all hover:shadow-md ${
              resource.featured 
                ? "border-ocean-primary bg-ocean-primary/5" 
                : "border-ocean-border/50 hover:border-ocean-border"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-sm text-foreground">{resource.title}</h4>
                  {resource.featured && (
                    <Badge variant="secondary" className="text-xs bg-ocean-primary text-white">
                      Recommended
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className={`text-xs ${getTypeColor(resource.type)}`}>
                    {resource.type}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 mr-1" />
                    {resource.location}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Bookmark className="w-3 h-3" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">
              {resource.description}
            </p>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {resource.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                <ExternalLink className="w-3 h-3 mr-1" />
                Learn More
              </Button>
              <Button variant="hero" size="sm" className="flex-1">
                Apply Now
              </Button>
            </div>
          </div>
        ))}
        
        <Button variant="outline" className="w-full mt-4">
          Browse All Resources
        </Button>
      </CardContent>
    </Card>
  );
};

export default ResourcesWidget;