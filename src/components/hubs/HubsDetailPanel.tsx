import { Workspace, WorkspaceType } from '@/hooks/useHubsSearch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  MapPin, 
  Star, 
  Wifi, 
  Coffee, 
  ParkingCircle,
  Printer,
  Phone,
  Building2, 
  Users,
  DoorOpen,
  Presentation,
  Calendar,
  ExternalLink,
  Navigation,
  Share2,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface HubsDetailPanelProps {
  workspace: Workspace | null;
  onClose: () => void;
  onBook: (workspace: Workspace) => void;
}

// Workspace type config matching GlobalResourcesMap RESOURCE_CONFIG pattern
const WORKSPACE_CONFIG: Record<WorkspaceType, { icon: any; color: string; label: string }> = {
  hot_desk: { icon: Users, color: '#14b8a6', label: 'Hot Desk' },
  private_office: { icon: DoorOpen, color: '#3b82f6', label: 'Private Office' },
  meeting_room: { icon: Presentation, color: '#8b5cf6', label: 'Meeting Room' },
  coworking: { icon: Building2, color: '#10b981', label: 'Coworking' },
  event_space: { icon: CalendarDays, color: '#f43f5e', label: 'Event Space' },
};

const getAmenityIcon = (amenity: string) => {
  switch (amenity) {
    case 'wifi': return Wifi;
    case 'coffee': return Coffee;
    case 'parking': return ParkingCircle;
    case 'printing': return Printer;
    case 'phone_booth': return Phone;
    default: return null;
  }
};

const getAmenityLabel = (amenity: string) => {
  switch (amenity) {
    case 'wifi': return 'High-Speed WiFi';
    case 'coffee': return 'Coffee & Beverages';
    case 'parking': return 'Parking Available';
    case 'printing': return 'Printing Services';
    case 'phone_booth': return 'Phone Booths';
    default: return amenity;
  }
};

export const HubsDetailPanel = ({ workspace, onClose, onBook }: HubsDetailPanelProps) => {
  const isMobile = useIsMobile();
  
  const getDirections = () => {
    if (workspace?.latitude && workspace?.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${workspace.latitude},${workspace.longitude}`, '_blank');
    }
  };

  const handleShare = async () => {
    if (!workspace) return;
    
    const shareData = {
      title: workspace.name,
      text: `Check out ${workspace.name} on Startup Factory Hub`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const primaryType = workspace?.workspace_types[0] || 'coworking';
  const config = WORKSPACE_CONFIG[primaryType];
  const Icon = config?.icon || Building2;

  return (
    <div className={cn(
      "absolute right-2 top-2 bottom-2 w-96 z-10 transition-all duration-300",
      workspace 
        ? "translate-x-0 opacity-100" 
        : "translate-x-full opacity-0 pointer-events-none",
      isMobile && "left-2 right-2 w-auto"
    )}>
      {workspace && (
        <div className="h-full backdrop-blur-3xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col rounded-3xl overflow-hidden">
          {/* Header Image - matching GlobalResourcesMap resource panel */}
          <div className="relative h-32 flex-shrink-0">
            {workspace.image_url ? (
              <img
                src={workspace.image_url}
                alt={workspace.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${config?.color || '#10b981'}, ${config?.color || '#10b981'}dd)` }}
              >
                <Icon className="h-16 w-16 text-white/60" />
              </div>
            )}
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-3 right-3 h-8 w-8 rounded-xl backdrop-blur-xl bg-black/30 hover:bg-black/50 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
            
            {/* Provider Badge */}
            <Badge 
              variant="secondary" 
              className="absolute top-3 left-3 text-xs backdrop-blur-xl bg-black/30 text-white border-0"
            >
              {workspace.provider === 'liquidspace' ? 'LiquidSpace' : 'SFH Network'}
            </Badge>

            {/* Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Title & Location */}
              <div>
                <h2 className="font-semibold text-lg line-clamp-2">{workspace.name}</h2>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{workspace.address || `${workspace.city}, ${workspace.country}`}</span>
                </div>
              </div>

              {/* Rating & Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {workspace.rating && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">{workspace.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {workspace.hourly_rate_min && (
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      ${workspace.hourly_rate_min}
                      <span className="text-sm font-normal text-muted-foreground">/hr</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Workspace Types */}
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Workspace Types</h3>
                <div className="flex flex-wrap gap-2">
                  {workspace.workspace_types.map((type) => {
                    const typeConfig = WORKSPACE_CONFIG[type];
                    const TypeIcon = typeConfig?.icon || Building2;
                    return (
                      <Badge 
                        key={type} 
                        variant="outline" 
                        className="gap-1.5 backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/30"
                        style={{ borderLeftColor: typeConfig?.color, borderLeftWidth: 3 }}
                      >
                        <TypeIcon className="h-3 w-3" />
                        {typeConfig?.label || type}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Amenities */}
              {workspace.amenities.length > 0 && (
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Amenities</h3>
                  <div className="space-y-2">
                    {workspace.amenities.map((amenity) => {
                      const AmenityIcon = getAmenityIcon(amenity);
                      return (
                        <div key={amenity} className="flex items-center gap-2 text-sm">
                          {AmenityIcon && <AmenityIcon className="h-4 w-4 text-muted-foreground" />}
                          <span>{getAmenityLabel(amenity)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Actions - matching GlobalResourcesMap */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getDirections}
                  className="gap-1.5 backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/30 hover:bg-white/20 rounded-xl"
                >
                  <Navigation className="h-3 w-3" />
                  Directions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="gap-1.5 backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/30 hover:bg-white/20 rounded-xl"
                >
                  <Share2 className="h-3 w-3" />
                  Share
                </Button>
              </div>
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/30 dark:border-white/20 backdrop-blur flex-shrink-0">
            <Button
              onClick={() => onBook(workspace)}
              className="w-full gap-2 bg-primary hover:bg-primary/90 rounded-2xl"
            >
              <Calendar className="h-4 w-4" />
              Book Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
