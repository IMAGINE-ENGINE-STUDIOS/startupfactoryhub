import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useResources, JourneyStep } from "@/hooks/useResources";
import { 
  ExternalLink, 
  MapPin, 
  Loader2, 
  Building, 
  Bookmark,
  Beaker,
  Rocket,
  Gift,
  Landmark,
  Building2,
  GraduationCap,
  Users,
  Heart,
  Briefcase,
  Sparkles
} from "lucide-react";

interface JourneyResourcesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journeyStep: JourneyStep;
  stepTitle: string;
  userCity?: string;
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    lab: <Beaker className="w-4 h-4" />,
    accelerator_incubator: <Rocket className="w-4 h-4" />,
    perk: <Gift className="w-4 h-4" />,
    government_grant: <Landmark className="w-4 h-4" />,
    coworking: <Building2 className="w-4 h-4" />,
    university: <GraduationCap className="w-4 h-4" />,
    investor_network: <Briefcase className="w-4 h-4" />,
    community: <Users className="w-4 h-4" />,
    human_capital: <Heart className="w-4 h-4" />,
  };
  return icons[type] || <Building className="w-4 h-4" />;
};

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    lab: "border-orange-500/50 bg-orange-500/10 text-orange-400",
    accelerator_incubator: "border-purple-500/50 bg-purple-500/10 text-purple-400",
    perk: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    government_grant: "border-blue-500/50 bg-blue-500/10 text-blue-400",
    coworking: "border-teal-500/50 bg-teal-500/10 text-teal-400",
    university: "border-red-500/50 bg-red-500/10 text-red-400",
    investor_network: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    community: "border-pink-500/50 bg-pink-500/10 text-pink-400",
    human_capital: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
  };
  return colors[type] || "border-muted/50 bg-muted/10 text-muted-foreground";
};

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] bg-background/95 backdrop-blur-xl border-primary/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
        <DialogHeader className="border-b border-primary/10 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-foreground">Resources for</span>
              <span className="text-primary ml-2 font-bold">{stepTitle}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
            </div>
            <p className="text-muted-foreground text-sm">Loading resources...</p>
          </div>
        ) : resources && resources.length > 0 ? (
          <ScrollArea className="h-[550px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="group relative p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 
                             hover:border-primary/40 hover:bg-card/80 
                             hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]
                             transition-all duration-300 ease-out"
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="relative z-10">
                    {/* Header with logo */}
                    <div className="flex items-start gap-3 mb-3">
                      {resource.logo_url ? (
                        <img
                          src={resource.logo_url}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover border border-border/50 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center flex-shrink-0">
                          {getTypeIcon(resource.resource_type)}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {resource.title}
                          </h4>
                          {resource.is_official_partner && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-1.5 py-0">
                              ⭐ Partner
                            </Badge>
                          )}
                        </div>
                        
                        {resource.city && (
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {resource.city}, {resource.country}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Type badge */}
                    <Badge className={`${getTypeColor(resource.resource_type)} border text-xs mb-3`}>
                      {getTypeIcon(resource.resource_type)}
                      <span className="ml-1.5 capitalize">{resource.resource_type.replace(/_/g, ' ')}</span>
                    </Badge>

                    {/* Description */}
                    {resource.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {resource.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-border/30">
                      {resource.website_url && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          asChild
                          className="flex-1 border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all"
                        >
                          <a href={resource.website_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                            Visit
                          </a>
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="hover:bg-muted/50"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-muted/20 rounded-full blur-xl" />
              <div className="p-4 rounded-xl bg-muted/10 border border-border/50 relative z-10">
                <Building className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">No resources found for "{stepTitle}"</p>
              <p className="text-sm text-muted-foreground mt-1">
                {userCity ? 'Try removing the city filter or check back later' : 'Check back later for new resources'}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
