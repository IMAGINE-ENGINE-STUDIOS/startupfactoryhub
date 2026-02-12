import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, ExternalLink, Bookmark, MapPin, Loader2, Filter } from "lucide-react";
import { useResources, JOURNEY_STEPS, JourneyStep } from "@/hooks/useResources";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResourcesWidgetProps {
  currentJourneyStep?: JourneyStep;
  userCity?: string;
}

const ResourcesWidget = ({ currentJourneyStep, userCity }: ResourcesWidgetProps) => {
  const [selectedStep, setSelectedStep] = useState<JourneyStep | undefined>(currentJourneyStep);
  const [selectedCity, setSelectedCity] = useState<string | undefined>(userCity);

  const { data: resources, isLoading } = useResources({
    journeyStep: selectedStep,
    city: selectedCity,
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      lab: "bg-orange-500/10 text-orange-600",
      accelerator_incubator: "bg-purple-500/10 text-purple-600",
      perk: "bg-green-500/10 text-green-600",
      government_grant: "bg-blue-500/10 text-blue-600",
      coworking: "bg-teal-500/10 text-teal-600",
      university: "bg-red-500/10 text-red-600",
      investor_network: "bg-yellow-500/10 text-yellow-600",
      community: "bg-pink-500/10 text-pink-600",
      national_archives: "bg-violet-500/10 text-violet-600",
    };
    return colors[type] || "bg-muted/10 text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Building className="w-5 h-5 mr-2 text-ocean-primary" />
            Resources
          </div>
          <Badge variant="secondary" className="text-xs">
            {resources?.length || 0} available
          </Badge>
        </CardTitle>
        
        {/* Filters */}
        <div className="flex gap-2 mt-2">
          <Select 
            value={selectedStep || "all"} 
            onValueChange={(v) => setSelectedStep(v === "all" ? undefined : v as JourneyStep)}
          >
            <SelectTrigger className="flex-1 h-8 text-xs">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Journey Step" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {JOURNEY_STEPS.filter(s => s.value !== 'all').map(step => (
                <SelectItem key={step.value} value={step.value}>{step.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : resources && resources.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-2">
              {resources.slice(0, 10).map((resource) => (
                <div 
                  key={resource.id} 
                  className="p-3 rounded-lg border transition-all hover:shadow-md border-ocean-border/50 hover:border-ocean-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-sm text-foreground truncate">{resource.title}</h4>
                        {resource.is_official_partner && (
                          <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600">
                            ⭐ Partner
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${getTypeColor(resource.resource_type)}`}>
                          {resource.resource_type.replace(/_/g, ' ')}
                        </Badge>
                        {resource.city && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 mr-1" />
                            {resource.city}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Bookmark className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {resource.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {resource.description}
                    </p>
                  )}

                  {/* Journey steps badges */}
                  {resource.journey_steps && resource.journey_steps.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {resource.journey_steps.slice(0, 3).map((step) => (
                        <Badge key={step} variant="outline" className="text-xs">
                          {step}
                        </Badge>
                      ))}
                      {resource.journey_steps.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{resource.journey_steps.length - 3}</Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {resource.website_url && (
                      <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" asChild>
                        <a href={resource.website_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Visit
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No resources found for the selected filters
          </div>
        )}
        
        <Button variant="outline" className="w-full mt-2">
          Browse All Resources
        </Button>
      </CardContent>
    </Card>
  );
};

export default ResourcesWidget;