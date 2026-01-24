import { Workspace, WorkspaceType } from '@/hooks/useHubsSearch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  Star, 
  Users,
  DoorOpen,
  Presentation,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HubsWorkspaceCardProps {
  workspace: Workspace;
  isSelected: boolean;
  onSelect: () => void;
  onBook: () => void;
  compact?: boolean;
}

// Workspace type config matching GlobalResourcesMap RESOURCE_CONFIG pattern
const WORKSPACE_CONFIG: Record<WorkspaceType, { icon: any; color: string; label: string }> = {
  hot_desk: { icon: Users, color: '#14b8a6', label: 'Hot Desk' },
  private_office: { icon: DoorOpen, color: '#3b82f6', label: 'Private Office' },
  meeting_room: { icon: Presentation, color: '#8b5cf6', label: 'Meeting Room' },
  coworking: { icon: Building2, color: '#10b981', label: 'Coworking' },
  event_space: { icon: CalendarDays, color: '#f43f5e', label: 'Event Space' },
};

export const HubsWorkspaceCard = ({
  workspace,
  isSelected,
  onSelect,
  onBook,
  compact = false,
}: HubsWorkspaceCardProps) => {
  const primaryType = workspace.workspace_types[0] || 'coworking';
  const config = WORKSPACE_CONFIG[primaryType];
  const Icon = config?.icon || Building2;

  return (
    <Card
      className={cn(
        "tech-card border-0 cursor-pointer transition-all hover:ring-1",
        isSelected && "ring-2 ring-primary"
      )}
      style={{ '--tw-ring-color': config?.color } as any}
      onClick={onSelect}
    >
      <CardContent className={cn("p-2", compact && "p-2")}>
        <div className="flex gap-3">
          {/* Image/Icon */}
          <div className="flex-shrink-0">
            {workspace.image_url ? (
              <img
                src={workspace.image_url}
                alt={workspace.name}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${config?.color || '#10b981'}, ${config?.color || '#10b981'}dd)` }}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{workspace.name}</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{workspace.city}</span>
            </div>
            
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-2">
                {workspace.rating && (
                  <div className="flex items-center gap-0.5 text-amber-500">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-xs font-medium">{workspace.rating.toFixed(1)}</span>
                  </div>
                )}
                <Badge 
                  variant="outline" 
                  className="text-[10px] px-1.5 py-0 h-4 border-0"
                  style={{ backgroundColor: `${config?.color}20`, color: config?.color }}
                >
                  {config?.label}
                </Badge>
              </div>
              {workspace.hourly_rate_min && (
                <span className="text-xs font-semibold text-primary">
                  ${workspace.hourly_rate_min}/hr
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};