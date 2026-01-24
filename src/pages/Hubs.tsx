import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { HubsMapView } from '@/components/hubs/HubsMapView';
import { HubsWorkspaceCard } from '@/components/hubs/HubsWorkspaceCard';
import { HubsBookingModal } from '@/components/hubs/HubsBookingModal';
import { HubsDetailPanel } from '@/components/hubs/HubsDetailPanel';
import { useHubsSearch, WorkspaceFilters, Workspace, WorkspaceType } from '@/hooks/useHubsSearch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Building2, 
  Menu, 
  X,
  Search,
  Users,
  DoorOpen,
  Presentation,
  CalendarDays,
  MapPinned
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import mapboxgl from 'mapbox-gl';

// Workspace type config matching GlobalResourcesMap RESOURCE_CONFIG pattern
const WORKSPACE_CONFIG: Record<WorkspaceType, { icon: any; color: string; label: string }> = {
  hot_desk: { icon: Users, color: '#14b8a6', label: 'Hot Desk' },
  private_office: { icon: DoorOpen, color: '#3b82f6', label: 'Private Office' },
  meeting_room: { icon: Presentation, color: '#8b5cf6', label: 'Meeting Room' },
  coworking: { icon: Building2, color: '#10b981', label: 'Coworking' },
  event_space: { icon: CalendarDays, color: '#f43f5e', label: 'Event Space' },
};

const Hubs = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<WorkspaceType | null>(null);
  
  // Address search state
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [filters, setFilters] = useState<WorkspaceFilters>({
    workspaceType: [],
    amenities: [],
  });

  const { data: workspaces, isLoading, refetch } = useHubsSearch(filters);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: '/hubs' } });
    }
  }, [user, authLoading, navigate]);

  // Handle booking success from Stripe redirect
  useEffect(() => {
    const bookingStatus = searchParams.get('booking');
    if (bookingStatus === 'success') {
      toast({
        title: "Booking Confirmed!",
        description: "Check your email for booking details",
      });
      window.history.replaceState({}, '', '/hubs');
    } else if (bookingStatus === 'cancelled') {
      toast({
        title: "Booking Cancelled",
        description: "Your booking was not completed",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/hubs');
    }
  }, [searchParams]);

  // Geocode address using Mapbox
  const geocodeAddress = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&types=address,place,poi&limit=5`
      );
      const data = await response.json();
      
      if (data.features) {
        setAddressSuggestions(data.features);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }, []);

  // Debounced search for addresses
  useEffect(() => {
    const timer = setTimeout(() => {
      const isAddressLike = /\d/.test(search) || 
        /\b(st|street|ave|avenue|blvd|road|rd|drive|dr|way|lane|ln|court|ct|place|pl)\b/i.test(search);
      
      if (isAddressLike && search.length >= 5) {
        geocodeAddress(search);
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, geocodeAddress]);

  const handleWorkspaceSelect = (workspace: Workspace | null) => {
    setSelectedWorkspace(workspace);
  };

  const handleBookWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setShowBookingModal(true);
  };

  const handleTypeSelect = (type: WorkspaceType | null) => {
    setSelectedType(type);
    if (type) {
      setFilters(prev => ({ ...prev, workspaceType: [type] }));
    } else {
      setFilters(prev => ({ ...prev, workspaceType: [] }));
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Filter workspaces by search
  const filteredWorkspaces = workspaces?.filter(w => {
    if (!search) return true;
    return w.name.toLowerCase().includes(search.toLowerCase()) ||
           w.city?.toLowerCase().includes(search.toLowerCase()) ||
           w.address?.toLowerCase().includes(search.toLowerCase());
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden rounded-2xl">
      {/* Full Viewport Map */}
      <HubsMapView
        workspaces={filteredWorkspaces || []}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceSelect={handleWorkspaceSelect}
        onWorkspaceBook={handleBookWorkspace}
        isLeftPanelOpen={isLeftPanelOpen}
      />
      
      {/* Single Toggle Button - matches GlobalResourcesMap exactly */}
      {!(isMobile && isLeftPanelOpen) && (
        <Button
          size="icon"
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className={cn(
            "absolute top-4 z-20 backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:bg-white/20 dark:hover:bg-black/30 rounded-2xl",
            isMobile ? "left-4" : (isLeftPanelOpen ? "left-[348px]" : "left-4")
          )}
          variant="ghost"
        >
          {isLeftPanelOpen && !isMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      )}

      {/* Left Side Sliding Panel - matches GlobalResourcesMap exactly */}
      <div 
        className={cn(
          "absolute top-2 bottom-2 z-10 transition-all duration-300",
          isMobile ? "w-[calc(100%-16px)] left-2 right-2" : "w-80",
          isMobile 
            ? (isLeftPanelOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none")
            : (isLeftPanelOpen ? "left-2" : "-left-[330px]")
        )}
      >
        <div className="h-full backdrop-blur-3xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col rounded-3xl">
          {/* Header */}
          <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Workspaces
            </h2>
            {isMobile && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsLeftPanelOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search workspaces or addresses..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-10 bg-white/10 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/20 focus:bg-white/20 dark:focus:bg-black/30 rounded-2xl"
              />
              
              {/* Address Suggestions Dropdown */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-2xl bg-white/20 dark:bg-black/40 border border-white/30 dark:border-white/20 rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="p-2 text-xs text-muted-foreground uppercase tracking-wide border-b border-white/20">
                    <MapPinned className="w-3 h-3 inline mr-1" />
                    Address Results
                  </div>
                  {addressSuggestions.map((feature: any) => (
                    <button
                      key={feature.id}
                      onClick={() => {
                        setSearch(feature.place_name);
                        setShowSuggestions(false);
                        setAddressSuggestions([]);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-white/20 dark:hover:bg-white/10 transition-colors border-b border-white/10 last:border-0"
                    >
                      <div className="font-medium text-sm">{feature.text}</div>
                      <div className="text-xs text-muted-foreground truncate">{feature.place_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tip: Search addresses like "505 Howard St, San Francisco"
            </p>
          </div>

          {/* Categories - matches GlobalResourcesMap exactly */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 backdrop-blur">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide flex-shrink-0">Categories</h3>
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="space-y-1 pr-2">
                <Button
                  variant={selectedType === null ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleTypeSelect(null)}
                  className={cn(
                    "w-full justify-start gap-2 rounded-xl backdrop-blur-xl",
                    selectedType === null ? "bg-primary/90" : "bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20"
                  )}
                >
                  <div className="w-2 h-2 rounded-full bg-current" />
                  All Workspaces
                </Button>
                {(Object.keys(WORKSPACE_CONFIG) as WorkspaceType[]).map((type) => {
                  const config = WORKSPACE_CONFIG[type];
                  const Icon = config.icon;
                  const isSelected = selectedType === type;
                  return (
                    <Button
                      key={type}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTypeSelect(type)}
                      className={cn(
                        "w-full justify-start gap-2 rounded-xl backdrop-blur-xl",
                        isSelected 
                          ? "bg-white/20 dark:bg-black/30 border-l-4" 
                          : "bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20"
                      )}
                      style={isSelected ? { borderLeftColor: config.color } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
              
              {/* Results List */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Results</h3>
                  <Badge variant="outline" className="text-xs bg-primary/20 border-primary/50 text-primary">
                    {filteredWorkspaces?.length || 0}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredWorkspaces && filteredWorkspaces.length > 0 ? (
                    filteredWorkspaces.map((workspace) => (
                      <HubsWorkspaceCard
                        key={workspace.id}
                        workspace={workspace}
                        isSelected={selectedWorkspace?.id === workspace.id}
                        onSelect={() => handleWorkspaceSelect(workspace)}
                        onBook={() => handleBookWorkspace(workspace)}
                        compact
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No workspaces found</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Right Side Panel - Resource/Workspace Details */}
      <HubsDetailPanel
        workspace={selectedWorkspace}
        onClose={() => setSelectedWorkspace(null)}
        onBook={handleBookWorkspace}
      />

      {/* Booking Modal */}
      <HubsBookingModal
        workspace={selectedWorkspace}
        open={showBookingModal}
        onOpenChange={setShowBookingModal}
      />
    </div>
  );
};

export default Hubs;
