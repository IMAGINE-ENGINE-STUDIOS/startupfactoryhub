import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useResources, JourneyStep } from "@/hooks/useResources";
import { ExternalLink, MapPin, Loader2, Building, Bookmark } from "lucide-react";

interface JourneyResourcesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journeyStep: JourneyStep;
  stepTitle: string;
  userCity?: string;
}

export const JourneyResourcesDialog = ({
  open,
  onOpenChange,
  journeyStep,
  stepTitle,
  userCity,
}: JourneyResourcesDialogProps) => {
  const { data: resources, isLoading } = useResources({
    journeyStep,
    city: userCity,
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
    };
    return colors[type] || "bg-muted/10 text-muted-foreground";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Resources for {stepTitle}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : resources && resources.length > 0 ? (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{resource.title}</h4>
                        {resource.is_official_partner && (
                          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                            ⭐ Partner
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={getTypeColor(resource.resource_type)}>
                          {resource.resource_type.replace(/_/g, ' ')}
                        </Badge>
                        {resource.city && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-1" />
                            {resource.city}, {resource.country}
                          </div>
                        )}
                      </div>

                      {resource.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {resource.description}
                        </p>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {resource.website_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={resource.website_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Visit Website
                            </a>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Bookmark className="w-4 h-4 mr-1" />
                          Bookmark
                        </Button>
                      </div>
                    </div>

                    {resource.logo_url && (
                      <img
                        src={resource.logo_url}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No resources found for "{stepTitle}"</p>
            <p className="text-sm mt-1">
              {userCity ? `Try removing the city filter or check back later` : 'Check back later for new resources'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};