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
  Share2
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
  
  const resourcesRef = useRef<Resource[] | undefined>(undefined);

  // Fetch resources with filters
  const { data: resources, isLoading, refetch: refetchResources } = useResources({ 
    type: selectedType || undefined,
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
      const IconComponent = config.icon;

      const el = document.createElement('div');
      el.className = 'resource-marker cursor-pointer';
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
        ">
          ${resource.logo_url ? `<img src="${resource.logo_url}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" />` : ''}
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });
      el.addEventListener('click', () => {
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

  // Filter resources
  const physicalResources = resources?.filter(r => r.location_type !== 'online' && r.latitude && r.longitude) || [];
  const onlineResources = resources?.filter(r => r.location_type === 'online' || r.resource_type === 'perk') || [];

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Matrix Background */}
      <MatrixBackground />
      
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img src={logo} alt="Startup Factory Hub" className="w-10 h-10" />
            <span className="text-lg font-bold text-white drop-shadow-lg">
              Startup Resources
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="glass"
              onClick={() => navigate('/auth')}
              className="bg-primary/90 hover:bg-primary text-primary-foreground"
            >
              Join Platform
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
        <Button
          variant="glass"
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
          className="bg-background/80 backdrop-blur-sm border border-border"
        >
          {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        <Button
          variant="glass"
          size="icon"
          onClick={requestUserLocation}
          disabled={isLocating}
          className="bg-background/80 backdrop-blur-sm border border-border"
        >
          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
        </Button>
      </div>

      {/* Left Panel Toggle (Mobile) */}
      {isMobile && (
        <Button
          variant="glass"
          size="icon"
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className="absolute top-20 left-4 z-20 bg-background/80 backdrop-blur-sm border border-border"
        >
          {isLeftPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      )}

      {/* Left Panel - Search & Filters */}
      <div className={cn(
        "absolute top-32 left-4 z-10 transition-all duration-300",
        isLeftPanelOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]",
        isMobile ? "w-[calc(100vw-2rem)] max-w-sm" : "w-80"
      )}>
        <Card className="bg-background/90 backdrop-blur-md border-border shadow-xl">
          <CardContent className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Pills */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Categories</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant={selectedType === null ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setSelectedType(null)}
                >
                  All
                </Badge>
                {Object.entries(RESOURCE_CONFIG).map(([type, config]) => (
                  <Badge
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    style={selectedType === type ? { backgroundColor: config.color } : {}}
                    onClick={() => setSelectedType(type as ResourceType)}
                  >
                    {config.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Journey Stage Filter */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Journey Stage</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant={selectedJourneyStep === null ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setSelectedJourneyStep(null)}
                >
                  All Stages
                </Badge>
                {JOURNEY_STEPS.filter(s => s.value !== 'all').map(step => (
                  <Badge
                    key={step.value}
                    variant={selectedJourneyStep === step.value ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => setSelectedJourneyStep(step.value)}
                  >
                    {step.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  <Globe2 className="w-4 h-4 inline mr-1" />
                  {physicalResources.length} locations
                </span>
                <span className="text-muted-foreground">
                  <Gift className="w-4 h-4 inline mr-1" />
                  {onlineResources.length} perks
                </span>
              </div>
            </div>

            {/* Online Resources / Perks */}
            {onlineResources.length > 0 && (
              <div className="pt-2 border-t border-border">
                <button
                  onClick={() => setIsPerksExpanded(!isPerksExpanded)}
                  className="flex items-center justify-between w-full text-sm font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-green-500" />
                    Online Perks & Resources
                  </span>
                  <ChevronRight className={cn("w-4 h-4 transition-transform", isPerksExpanded && "rotate-90")} />
                </button>
                
                {isPerksExpanded && (
                  <ScrollArea className="h-40 mt-2">
                    <div className="space-y-2">
                      {onlineResources.slice(0, 10).map(resource => (
                        <div
                          key={resource.id}
                          onClick={() => setSelectedResource(resource)}
                          className="p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {resource.logo_url && (
                              <img src={resource.logo_url} className="w-6 h-6 rounded object-cover" />
                            )}
                            <span className="text-sm font-medium truncate">{resource.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Selected Resource Details */}
      {selectedResource && (
        <div className={cn(
          "absolute top-32 right-4 z-10 transition-all duration-300",
          isMobile ? "left-4 right-4" : "w-96"
        )}>
          <Card className="bg-background/95 backdrop-blur-md border-border shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {selectedResource.logo_url ? (
                    <img 
                      src={selectedResource.logo_url} 
                      className="w-12 h-12 rounded-lg object-cover border border-border"
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
                <Button variant="ghost" size="icon" onClick={() => setSelectedResource(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {selectedResource.city && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
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
                    <Badge key={step} variant="outline" className="text-xs">
                      {step}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                {selectedResource.website_url && (
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href={selectedResource.website_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Website
                    </a>
                  </Button>
                )}
                {selectedResource.latitude && selectedResource.longitude && (
                  <Button variant="outline" size="sm" asChild>
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
                  onClick={() => handleShareResource(selectedResource)}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading resources...</p>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <Button
          onClick={() => navigate('/auth')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
        >
          <Rocket className="w-4 h-4 mr-2" />
          Join to Access All Features
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default PublicResources;
