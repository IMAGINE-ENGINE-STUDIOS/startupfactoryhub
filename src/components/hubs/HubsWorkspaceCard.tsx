import { Workspace } from '@/hooks/useHubsSearch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Star, 
  Wifi, 
  Coffee, 
  Building2, 
  Users,
  DoorOpen,
  Presentation,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HubsWorkspaceCardProps {
  workspace: Workspace;
  isSelected?: boolean;
  onSelect: () => void;
  onBook: () => void;
  compact?: boolean;
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

export const HubsWorkspaceCard = ({ 
  workspace, 
  isSelected, 
  onSelect, 
  onBook,
  compact = false 
}: HubsWorkspaceCardProps) => {
  const Icon = getWorkspaceIcon(workspace.workspace_types[0]);

  if (compact) {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 tech-card border-0",
          "backdrop-blur-xl bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20",
          isSelected && "ring-2 ring-primary bg-white/15 dark:bg-black/30"
        )}
        onClick={onSelect}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Larger image for compact view */}
            {workspace.image_url ? (
              <img
                src={workspace.image_url}
                alt={workspace.name}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shrink-0">
                <Icon className="h-8 w-8 text-primary" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2">{workspace.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{workspace.city}, {workspace.country}</span>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  {workspace.hourly_rate_min && (
                    <span className="text-sm font-bold text-primary">
                      ${workspace.hourly_rate_min}/hr
                    </span>
                  )}
                </div>
                {workspace.rating && (
                  <div className="flex items-center gap-0.5 text-xs text-amber-500">
                    <Star className="h-3 w-3 fill-current" />
                    {workspace.rating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full card view (for list mode)
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 overflow-hidden h-full flex flex-col",
        "tech-card border-0 backdrop-blur-xl bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      {/* Image - Larger */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-purple-500/20 flex-shrink-0">
        {workspace.image_url ? (
          <img
            src={workspace.image_url}
            alt={workspace.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="h-16 w-16 text-primary/40" />
          </div>
        )}
        
        {/* Provider badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-3 right-3 text-xs backdrop-blur-xl bg-black/30 text-white border-0"
        >
          {workspace.provider === 'liquidspace' ? 'LiquidSpace' : 'SFH Network'}
        </Badge>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="font-semibold text-lg line-clamp-1">{workspace.name}</h3>
          
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{workspace.address || workspace.city}, {workspace.country}</span>
          </div>

          {/* Workspace Types */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {workspace.workspace_types.slice(0, 3).map((type) => {
              const TypeIcon = getWorkspaceIcon(type);
              return (
                <Badge 
                  key={type} 
                  variant="outline" 
                  className="text-xs gap-1 backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/30"
                >
                  <TypeIcon className="h-3 w-3" />
                  {getWorkspaceLabel(type)}
                </Badge>
              );
            })}
          </div>

          {/* Amenities */}
          <div className="flex items-center gap-3 mt-3 text-muted-foreground">
            {workspace.amenities.includes('wifi') && (
              <Wifi className="h-4 w-4" />
            )}
            {workspace.amenities.includes('coffee') && (
              <Coffee className="h-4 w-4" />
            )}
            {workspace.amenities.length > 2 && (
              <span className="text-xs">+{workspace.amenities.length - 2} more</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20">
          <div>
            {workspace.hourly_rate_min ? (
              <div className="text-lg font-bold text-primary">
                ${workspace.hourly_rate_min}
                <span className="text-sm font-normal text-muted-foreground">/hr</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Contact for pricing</span>
            )}
            {workspace.rating && (
              <div className="flex items-center gap-1 text-sm text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                {workspace.rating.toFixed(1)}
              </div>
            )}
          </div>
          
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
            className="gap-1.5"
          >
            <Calendar className="h-4 w-4" />
            Book
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
