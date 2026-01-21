import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useResources, Resource, ResourceType, JOURNEY_STEPS, JourneyStep } from '@/hooks/useResources';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import MatrixBackground from '@/components/MatrixBackground';
import logo from '@/assets/logo.png';
import { AddResourceDialog } from '@/components/AddResourceDialog';
import { 
  Building2, 
  Beaker, 
  MapPin, 
  Gift, 
  Landmark, 
  RefreshCw, 
  Users, 
  DollarSign, 
  Rocket, 
  GraduationCap, 
  School, 
  Briefcase, 
  TrendingUp,
  Search,
  ExternalLink,
  Navigation,
  X,
  Menu,
  ChevronRight,
  ChevronLeft,
  Pause,
  Play,
  Locate,
  Loader2,
  CalendarDays,
  Globe2,
  ArrowRight,
  Share2,
  Plus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

mapboxgl.accessToken = 'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

const RESOURCE_CONFIG: Record<ResourceType, { icon: any; color: string; label: string }> = {
  office: { icon: Building2, color: '#ef4444', label: 'Office' },
  lab: { icon: Beaker, color: '#f97316', label: 'Laboratory' },
  venue: { icon: MapPin, color: '#eab308', label: 'Venue' },
  perk: { icon: Gift, color: '#22c55e', label: 'Perk' },
  chamber_of_commerce: { icon: Landmark, color: '#06b6d4', label: 'Chamber' },
  technology_transfer: { icon: RefreshCw, color: '#8b5cf6', label: 'Tech Transfer' },
  community: { icon: Users, color: '#ec4899', label: 'Community' },
  government_grant: { icon: DollarSign, color: '#3b82f6', label: 'Gov Grant' },
  accelerator_incubator: { icon: Rocket, color: '#6366f1', label: 'Accelerator' },
  entrepreneur_center: { icon: GraduationCap, color: '#a855f7', label: 'Entrepreneur' },
  university: { icon: School, color: '#dc2626', label: 'University' },
  coworking: { icon: Briefcase, color: '#14b8a6', label: 'Coworking' },
  investor_network: { icon: TrendingUp, color: '#facc15', label: 'Investor Net' },
  human_capital: { icon: Users, color: '#0ea5e9', label: 'Human Capital' },
  event: { icon: CalendarDays, color: '#f43f5e', label: 'Events' },
  other: { icon: MapPin, color: '#64748b', label: 'Other' },
};

const PublicResources = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [searchParams] = useSearchParams();
  
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null);
  const [selectedJourneyStep, setSelectedJourneyStep] = useState<JourneyStep | null>(null);
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(!isMobile);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const isRotatingRef = useRef(true);
  const [isPerksExpanded, setIsPerksExpanded] = useState(true);
  const [isOnlineResourcesExpanded, setIsOnlineResourcesExpanded] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const resourcesRef = useRef<Resource[] | undefined>(undefined);

  // Fetch resources with filters
  const { data: resources, isLoading, refetch: refetchResources } = useResources({ 
    type: selectedType === 'event' ? undefined : selectedType || undefined,
    search: search || undefined,
    journeyStep: selectedJourneyStep || undefined
  });

  // Keep resourcesRef in sync
  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

  // Real-time subscription for resource changes
  useEffect(() => {
    const channel = supabase
      .channel('public-resources-sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'resources' },
        (payload) => {
          refetchResources();
          if (selectedResource && payload.new && (payload.new as any).id === selectedResource.id) {
            setSelectedResource(payload.new as Resource);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchResources, selectedResource?.id]);

  // Handle deep-link to specific resource
  useEffect(() => {
    const resourceId = searchParams.get('id');
    if (resourceId && resources) {
      const resource = resources.find(r => r.id === resourceId);
      if (resource) {
        setSelectedResource(resource);
        if (resource.latitude && resource.longitude && map.current) {
          map.current.flyTo({
            center: [resource.longitude, resource.latitude],
            zoom: 12,
            duration: 2000
          });
        }
      }
    }
  }, [searchParams, resources]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/imagineengine/cmhfkp1ie001d01qi2hyg82lp',
      projection: { name: 'globe' },
      zoom: 2.5,
      center: [-122.4, 37.8],
      pitch: 45,
      antialias: true,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.on('style.load', () => {
      if (!map.current) return;
      
      map.current.setFog({
        color: '#0f172a',
        'high-color': '#1e293b',
        'horizon-blend': 0.02,
        'space-color': '#020617',
        'star-intensity': 0.15
      });
    });

    // Globe rotation
    const rotateGlobe = () => {
      if (!map.current || !isRotatingRef.current) return;
      const center = map.current.getCenter();
      center.lng += 0.01;
      map.current.setCenter(center);
      requestAnimationFrame(rotateGlobe);
    };
    rotateGlobe();

    // Stop rotation on user interaction
    map.current.on('mousedown', () => {
      isRotatingRef.current = false;
      setIsRotating(false);
    });
    map.current.on('touchstart', () => {
      isRotatingRef.current = false;
      setIsRotating(false);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when resources change
  useEffect(() => {
    if (!map.current || !resources) return;

    // Clear existing markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    // Add new markers
    resources.forEach(resource => {
      if (!resource.latitude || !resource.longitude) return;

      const config = RESOURCE_CONFIG[resource.resource_type] || RESOURCE_CONFIG.other;

      const el = document.createElement('div');
      el.className = 'resource-marker cursor-pointer';
      el.style.pointerEvents = 'auto';
      el.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background: ${config.color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s;
          pointer-events: auto;
        ">
          ${resource.logo_url ? `<img src="${resource.logo_url}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; pointer-events: none;" />` : ''}
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        el.style.zIndex = '100';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1';
      });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedResource(resource);
        map.current?.flyTo({
          center: [resource.longitude!, resource.latitude!],
          zoom: 12,
          duration: 1500
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([resource.longitude, resource.latitude])
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [resources]);

  // Request user location
  const requestUserLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(coords);
        map.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 10, duration: 2000 });
        setIsLocating(false);
        toast({ title: "Location found", description: "Showing your current location" });
      },
      () => {
        toast({ title: "Location unavailable", description: "Unable to get your location", variant: "destructive" });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Share resource link
  const handleShareResource = (resource: Resource) => {
    const url = `${window.location.origin}/resources?id=${resource.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Share this link to highlight this resource" });
  };

  // Filter resources - same logic as GlobalResourcesMap
  const perks = resources?.filter(r => r.resource_type === 'perk') || [];
  const onlineResources = resources?.filter(r => r.location_type === 'online' && r.resource_type !== 'perk') || [];

  // Group online resources by type
  const groupedOnlineByType = onlineResources.reduce((acc, resource) => {
    const type = resource.resource_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(resource);
    return acc;
  }, {} as Record<ResourceType, Resource[]>);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Matrix Background */}
      <MatrixBackground />
      
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* Header - Centered Title/Logo */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none">
        <div className="flex items-center justify-center pointer-events-auto">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img src={logo} alt="Startup Factory Hub" className="w-10 h-10" />
            <span className="text-lg font-bold text-white drop-shadow-lg">
              Startup Resources
            </span>
          </div>
        </div>
        
        {/* Join Platform Button - Top Right */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="tech-card border-0 bg-primary/90 hover:bg-primary text-primary-foreground"
          >
            Join Platform
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Control Buttons - Below Mapbox Controls (top-32 to be under mapbox nav) */}
      <div className="absolute top-32 right-3 z-10 flex flex-col gap-2 pointer-events-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            isRotatingRef.current = !isRotatingRef.current;
            setIsRotating(!isRotating);
            if (isRotatingRef.current) {
              const rotateGlobe = () => {
                if (!map.current || !isRotatingRef.current) return;
                const center = map.current.getCenter();
                center.lng += 0.01;
                map.current.setCenter(center);
                requestAnimationFrame(rotateGlobe);
              };
              rotateGlobe();
            }
          }}
          className="tech-card border-0 backdrop-blur-xl bg-white/10 dark:bg-black/20 rounded-xl hover:bg-white/20"
        >
          {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={requestUserLocation}
          disabled={isLocating}
          className="tech-card border-0 backdrop-blur-xl bg-white/10 dark:bg-black/20 rounded-xl hover:bg-white/20"
        >
          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
        </Button>
      </div>

      {/* Left Panel Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
        className={cn(
          "absolute top-20 z-20 tech-card border-0 backdrop-blur-xl bg-white/10 dark:bg-black/20 rounded-xl hover:bg-white/20 pointer-events-auto",
          isLeftPanelOpen ? "left-[340px]" : "left-4"
        )}
      >
        {isLeftPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      {/* Left Panel - Sliding Glassmorphism Panel (Same as GlobalResourcesMap) */}
      <div className={cn(
        "absolute top-16 bottom-4 left-0 z-10 transition-all duration-300 pointer-events-auto",
        isLeftPanelOpen ? "translate-x-0" : "-translate-x-full",
        "w-80"
      )}>
        <div className="h-full flex flex-col tech-card border-0 !transition-none backdrop-blur-3xl bg-white/10 dark:bg-black/20 rounded-r-3xl overflow-hidden ml-4">
          {/* Header */}
          <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-primary" />
              Resources
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Discover startup resources worldwide
            </p>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/10 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/20 focus:bg-white/20 dark:focus:bg-black/30 rounded-2xl"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex-1 flex flex-col overflow-hidden p-4 backdrop-blur">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide flex-shrink-0">Categories</h3>
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="space-y-1 pr-2">
                <Button
                  variant={selectedType === null ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedType(null)}
                  className={cn(
                    "w-full justify-start gap-2 rounded-xl backdrop-blur-xl",
                    selectedType === null ? "bg-primary/90" : "bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20"
                  )}
                >
                  <div className="w-2 h-2 rounded-full bg-current" />
                  All Resources
                </Button>
                {(Object.keys(RESOURCE_CONFIG) as ResourceType[]).filter(type => type !== 'perk').map((type) => {
                  const config = RESOURCE_CONFIG[type];
                  const Icon = config.icon;
                  const isSelected = selectedType === type;
                  return (
                    <Button
                      key={type}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "w-full justify-start gap-2 rounded-xl backdrop-blur-xl",
                        isSelected 
                          ? "bg-white/20 dark:bg-black/30 border-l-4" 
                          : "bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20"
                      )}
                      style={isSelected ? { 
                        borderLeftColor: config.color
                      } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
              
              {/* Journey Step Filter */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Journey Stage</h3>
                <div className="space-y-1">
                  <Button
                    variant={selectedJourneyStep === null ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedJourneyStep(null)}
                    className={cn(
                      "w-full justify-start gap-2 rounded-xl backdrop-blur-xl",
                      selectedJourneyStep === null ? "bg-primary/90" : "bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20"
                    )}
                  >
                    All Stages
                  </Button>
                  {JOURNEY_STEPS.filter(s => s.value !== 'all').map((step) => (
                    <Button
                      key={step.value}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedJourneyStep(step.value)}
                      className={cn(
                        "w-full justify-start gap-2 rounded-xl backdrop-blur-xl text-left",
                        selectedJourneyStep === step.value
                          ? "bg-white/20 dark:bg-black/30 border-l-4 border-primary" 
                          : "bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20"
                      )}
                    >
                      {step.label}
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>
            
            {/* Add Resource Button */}
            <Button 
              onClick={() => setShowAddDialog(true)} 
              className="w-full gap-2 backdrop-blur-xl bg-primary/90 hover:bg-primary border border-white/20 rounded-2xl mt-4 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Resource
            </Button>
          </div>
        </div>
      </div>

      {/* Online Resources Section - Collapsible (Same as GlobalResourcesMap) */}
      {onlineResources.length > 0 && (() => {
        // Collapsed state - pill on the right (higher to not overlap with perks)
        if (!isOnlineResourcesExpanded) {
          return (
            <div className="absolute bottom-44 right-4 z-10 pointer-events-auto">
              <Button
                onClick={() => setIsOnlineResourcesExpanded(true)}
                className="tech-card border-0 backdrop-blur-3xl bg-white/10 dark:bg-black/20 rounded-2xl px-3 py-6 flex flex-col items-center gap-2 hover:ring-1 hover:ring-blue-500/50"
                variant="ghost"
              >
                <ChevronLeft className="w-4 h-4 text-blue-400" />
                <Globe2 className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400 [writing-mode:vertical-rl]">{onlineResources.length}</span>
              </Button>
            </div>
          );
        }
        
        // Expanded state - positioned higher (bottom-44 to be above perks)
        return (
          <div className={cn(
            "absolute bottom-44 right-4 z-10 pointer-events-auto transition-all duration-300 max-w-[600px]",
            isLeftPanelOpen ? "left-[348px]" : "left-4"
          )}>
            <div className="tech-card border-0 !transition-none backdrop-blur-3xl bg-white/10 dark:bg-black/20 rounded-2xl p-4 overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold">Online Resources</h3>
                  <Badge variant="outline" className="text-xs bg-blue-500/20 border-blue-500/50 text-blue-400">
                    {onlineResources.length} available
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOnlineResourcesExpanded(false)}
                  className="h-6 w-6 rounded-lg backdrop-blur-xl bg-white/10 dark:bg-black/20 hover:bg-white/20"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <ScrollArea className="max-h-48">
                <div className="space-y-3">
                  {Object.entries(groupedOnlineByType).map(([type, typeResources]) => {
                    const config = RESOURCE_CONFIG[type as ResourceType];
                    const Icon = config.icon;
                    return (
                      <div key={type}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-3 h-3" style={{ color: config.color }} />
                          <span className="text-xs text-muted-foreground font-medium">{config.label} ({typeResources.length})</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {typeResources.slice(0, 5).map((resource) => (
                            <Card
                              key={resource.id}
                              className="tech-card border-0 !transition-none min-w-[180px] max-w-[180px] cursor-pointer hover:ring-1 flex-shrink-0"
                              style={{ '--tw-ring-color': config.color } as any}
                              onClick={() => setSelectedResource(resource)}
                            >
                              <CardContent className="p-2">
                                <div className="flex items-center gap-2">
                                  {resource.logo_url ? (
                                    <img src={resource.logo_url} alt="" className="w-6 h-6 rounded-md object-cover" />
                                  ) : (
                                    <div 
                                      className="w-6 h-6 rounded-md flex items-center justify-center"
                                      style={{ backgroundColor: config.color }}
                                    >
                                      <Icon className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-xs truncate">{resource.title}</h4>
                                    {resource.is_official_partner && (
                                      <span className="text-[10px] text-amber-400">⭐ Partner</span>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {typeResources.length > 5 && (
                            <div className="text-xs text-muted-foreground flex items-center">
                              +{typeResources.length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        );
      })()}

      {/* Bottom Perks Section - Collapsible (Same as GlobalResourcesMap) */}
      {perks.length > 0 && (() => {
        // Collapsed state - pill on the right
        if (!isPerksExpanded) {
          return (
            <div className="absolute bottom-24 right-4 z-10 pointer-events-auto">
              <Button
                onClick={() => setIsPerksExpanded(true)}
                className="tech-card border-0 backdrop-blur-3xl bg-white/10 dark:bg-black/20 rounded-2xl px-3 py-6 flex flex-col items-center gap-2 hover:ring-1 hover:ring-green-500/50"
                variant="ghost"
              >
                <ChevronLeft className="w-4 h-4 text-green-400" />
                <Gift className="w-5 h-5 text-green-400" />
                <span className="text-xs font-semibold text-green-400 [writing-mode:vertical-rl]">{perks.length}</span>
              </Button>
            </div>
          );
        }
        
        // Expanded state - positioned higher to be above messaging icon
        return (
          <div className={cn(
            "absolute bottom-20 right-4 z-10 pointer-events-auto transition-all duration-300",
            isLeftPanelOpen ? "left-[348px]" : "left-4"
          )}>
            <div className="tech-card border-0 !transition-none backdrop-blur-3xl bg-white/10 dark:bg-black/20 rounded-2xl p-4 overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-green-400" />
                  <h3 className="text-sm font-semibold">Network Perks</h3>
                  <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500/50 text-green-400">
                    {perks.length} available
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPerksExpanded(false)}
                  className="h-6 w-6 rounded-lg backdrop-blur-xl bg-white/10 dark:bg-black/20 hover:bg-white/20"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Manual Infinite Scroll Container */}
              <div 
                className="overflow-x-auto scrollbar-thin pb-2"
                onScroll={(e) => {
                  const container = e.currentTarget;
                  const scrollWidth = container.scrollWidth;
                  const scrollLeft = container.scrollLeft;
                  const sectionWidth = scrollWidth / 3;
                  
                  // If scrolled to near the end, jump back to middle section
                  if (scrollLeft >= sectionWidth * 2 - 10) {
                    container.scrollLeft = sectionWidth;
                  }
                  // If scrolled to near the beginning, jump to middle section
                  else if (scrollLeft <= 10) {
                    container.scrollLeft = sectionWidth;
                  }
                }}
                ref={(el) => {
                  // Initialize scroll position to middle section on mount
                  if (el && el.scrollLeft === 0) {
                    const sectionWidth = el.scrollWidth / 3;
                    el.scrollLeft = sectionWidth;
                  }
                }}
              >
                <div className="flex gap-3" style={{ width: 'max-content' }}>
                  {/* Triple the perks for seamless circular scroll */}
                  {[...perks, ...perks, ...perks].map((perk, index) => (
                    <Card
                      key={`perk-${index}-${perk.id}`}
                      className="tech-card border-0 !transition-none min-w-[220px] max-w-[220px] cursor-pointer hover:ring-1 hover:ring-green-500/50 flex-shrink-0"
                      onClick={() => {
                        setSelectedResource(perk);
                        if (map.current && perk.latitude && perk.longitude) {
                          map.current.flyTo({
                            center: [perk.longitude, perk.latitude],
                            zoom: 12,
                            duration: 2000,
                          });
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          {perk.logo_url ? (
                            <img src={perk.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <Gift className="w-6 h-6 text-green-400" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{perk.title}</h4>
                            {perk.is_official_partner && (
                              <span className="text-xs text-amber-400">⭐ Partner</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Right Side Panel - Resource Details (Slide In) */}
      {selectedResource && (
        <div className={cn(
          "absolute top-16 bottom-4 right-0 z-20 transition-all duration-300 pointer-events-auto",
          "w-80 translate-x-0"
        )}>
          <div className="h-full tech-card border-0 !transition-none backdrop-blur-3xl bg-white/10 dark:bg-black/20 rounded-l-3xl overflow-hidden mr-4">
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {selectedResource.logo_url ? (
                      <img 
                        src={selectedResource.logo_url} 
                        className="w-12 h-12 rounded-lg object-cover border border-white/20"
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: RESOURCE_CONFIG[selectedResource.resource_type]?.color || '#666' }}
                      >
                        {(() => {
                          const Icon = RESOURCE_CONFIG[selectedResource.resource_type]?.icon || MapPin;
                          return <Icon className="w-6 h-6 text-white" />;
                        })()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{selectedResource.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          style={{ backgroundColor: RESOURCE_CONFIG[selectedResource.resource_type]?.color }}
                          className="text-white text-xs"
                        >
                          {RESOURCE_CONFIG[selectedResource.resource_type]?.label}
                        </Badge>
                        {selectedResource.is_official_partner && (
                          <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600">
                            ⭐ Partner
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedResource(null)} className="hover:bg-white/10">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {selectedResource.city && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    {selectedResource.city}{selectedResource.country && `, ${selectedResource.country}`}
                  </div>
                )}

                {selectedResource.description && (
                  <p className="text-sm text-muted-foreground mb-4">{selectedResource.description}</p>
                )}

                {selectedResource.journey_steps && selectedResource.journey_steps.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {selectedResource.journey_steps.map(step => (
                      <Badge key={step} variant="outline" className="text-xs bg-white/5">
                        {step}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {selectedResource.website_url && (
                    <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/20 hover:bg-white/10" asChild>
                      <a href={selectedResource.website_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit Website
                      </a>
                    </Button>
                  )}
                  {selectedResource.latitude && selectedResource.longitude && (
                    <Button variant="outline" size="sm" className="bg-white/5 border-white/20 hover:bg-white/10" asChild>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedResource.latitude},${selectedResource.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white/5 border-white/20 hover:bg-white/10"
                    onClick={() => handleShareResource(selectedResource)}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* CTA for non-authenticated users */}
                <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-3">
                    Join the platform to access more features and connect with startups!
                  </p>
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Join Platform
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading resources...</p>
          </div>
        </div>
      )}

      {/* Add Resource Dialog - Syncs with Admin Dashboard */}
      <AddResourceDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
};

export default PublicResources;
