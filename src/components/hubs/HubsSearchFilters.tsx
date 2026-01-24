import { useState } from 'react';
import { WorkspaceFilters, WorkspaceType, useWorkspaceLocations } from '@/hooks/useHubsSearch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  Building2, 
  Users, 
  DoorOpen, 
  Presentation, 
  Wifi, 
  Coffee, 
  ParkingCircle,
  Printer,
  Phone,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HubsSearchFiltersProps {
  filters: WorkspaceFilters;
  onFiltersChange: (filters: WorkspaceFilters) => void;
}

const WORKSPACE_TYPES: { value: WorkspaceType; label: string; icon: any }[] = [
  { value: 'hot_desk', label: 'Hot Desk', icon: Users },
  { value: 'private_office', label: 'Private Office', icon: DoorOpen },
  { value: 'meeting_room', label: 'Meeting Room', icon: Presentation },
  { value: 'coworking', label: 'Coworking', icon: Building2 },
  { value: 'event_space', label: 'Event Space', icon: Users },
];

const AMENITIES = [
  { value: 'wifi', label: 'WiFi', icon: Wifi },
  { value: 'coffee', label: 'Coffee', icon: Coffee },
  { value: 'parking', label: 'Parking', icon: ParkingCircle },
  { value: 'printing', label: 'Printing', icon: Printer },
  { value: 'phone_booth', label: 'Phone Booth', icon: Phone },
];

export const HubsSearchFilters = ({ filters, onFiltersChange }: HubsSearchFiltersProps) => {
  const { data: locations } = useWorkspaceLocations();
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  const handleCityChange = (city: string) => {
    onFiltersChange({ ...filters, city: city === 'all' ? undefined : city });
  };

  const handleWorkspaceTypeToggle = (type: WorkspaceType) => {
    const currentTypes = filters.workspaceType || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    onFiltersChange({ ...filters, workspaceType: newTypes });
  };

  const handleAmenityToggle = (amenity: string) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    onFiltersChange({ ...filters, amenities: newAmenities });
  };

  const handleBudgetChange = (value: number[]) => {
    onFiltersChange({ ...filters, maxBudget: value[0] });
  };

  const clearFilters = () => {
    onFiltersChange({
      workspaceType: [],
      amenities: [],
    });
  };

  const hasActiveFilters = 
    filters.city || 
    (filters.workspaceType && filters.workspaceType.length > 0) ||
    (filters.amenities && filters.amenities.length > 0) ||
    filters.maxBudget;

  return (
    <div className="space-y-4">
      {/* Location Selector */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Location</Label>
        <Select value={filters.city || 'all'} onValueChange={handleCityChange}>
          <SelectTrigger className="backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/30 rounded-xl">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent className="tech-card border-0">
            <SelectItem value="all">All locations</SelectItem>
            {locations?.map((loc) => (
              <SelectItem key={`${loc.city}-${loc.country}`} value={loc.city || ''}>
                {loc.city}, {loc.country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Workspace Types */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Workspace Type</Label>
        <div className="flex flex-wrap gap-2">
          {WORKSPACE_TYPES.map(({ value, label, icon: Icon }) => (
            <Badge
              key={value}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all hover:scale-105 backdrop-blur-xl",
                filters.workspaceType?.includes(value) 
                  ? "bg-primary/90 border-primary text-primary-foreground" 
                  : "bg-white/10 dark:bg-black/20 border-white/30 hover:bg-white/20"
              )}
              onClick={() => handleWorkspaceTypeToggle(value)}
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Amenities</Label>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.slice(0, showAllAmenities ? undefined : 4).map(({ value, label, icon: Icon }) => (
            <div
              key={value}
              className={cn(
                "flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors backdrop-blur-xl",
                filters.amenities?.includes(value)
                  ? "border-primary bg-primary/20"
                  : "border-white/30 bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20"
              )}
              onClick={() => handleAmenityToggle(value)}
            >
              <Checkbox
                checked={filters.amenities?.includes(value)}
                className="pointer-events-none"
              />
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
        {AMENITIES.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs hover:bg-white/10"
            onClick={() => setShowAllAmenities(!showAllAmenities)}
          >
            {showAllAmenities ? 'Show less' : `Show ${AMENITIES.length - 4} more`}
          </Button>
        )}
      </div>

      {/* Budget Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Max Budget ($/hr)</Label>
          <span className="text-sm font-medium">
            {filters.maxBudget ? `$${filters.maxBudget}` : 'Any'}
          </span>
        </div>
        <Slider
          value={[filters.maxBudget || 200]}
          onValueChange={handleBudgetChange}
          max={500}
          min={10}
          step={10}
          className="w-full"
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full gap-2 backdrop-blur-xl bg-white/10 border-white/30 hover:bg-white/20 rounded-xl"
        >
          <X className="h-4 w-4" />
          Clear all filters
        </Button>
      )}
    </div>
  );
};
