import { Workspace } from '@/hooks/useHubsSearch';
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
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HubsDetailPanelProps {
  workspace: Workspace | null;
  onClose: () => void;
  onBook: (workspace: Workspace) => void;
}

const getWorkspaceIcon = (type: string) => {
  switch (type) {
    case 'hot_desk': return Users;
    case 'private_office': return DoorOpen;
    case 'meeting_room': return Presentation;
    case 'coworking': return Building2;
    default: return Building2;
  }
};

const getWorkspaceLabel = (type: string) => {
  switch (type) {
    case 'hot_desk': return 'Hot Desk';
    case 'private_office': return 'Private Office';
    case 'meeting_room': return 'Meeting Room';
    case 'coworking': return 'Coworking';
    case 'event_space': return 'Event Space';
    default: return type;
  }
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
  if (!workspace) return null;

  const Icon = getWorkspaceIcon(workspace.workspace_types[0]);

  return (
    <div className={cn(
      "absolute top-16 bottom-4 right-4 z-10 transition-all duration-300 pointer-events-auto",
      "w-80"
    )}>
      <div className="h-full flex flex-col tech-card border-0 !transition-none backdrop-blur-3xl bg-white/10 dark:bg-black/20 rounded-3xl overflow-hidden">
        {/* Header Image */}
        <div className="relative h-40 flex-shrink-0">
          {workspace.image_url ? (
            <img
              src={workspace.image_url}
              alt={workspace.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
              <Icon className="h-16 w-16 text-primary/60" />
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
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
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
                  const TypeIcon = getWorkspaceIcon(type);
                  return (
                    <Badge 
                      key={type} 
                      variant="outline" 
                      className="gap-1.5 backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/30"
                    >
                      <TypeIcon className="h-3 w-3" />
                      {getWorkspaceLabel(type)}
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

          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/30 dark:border-white/20 backdrop-blur flex-shrink-0">
          <Button
            onClick={() => onBook(workspace)}
            className="w-full gap-2 bg-primary hover:bg-primary/90"
          >
            <Calendar className="h-4 w-4" />
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
};
