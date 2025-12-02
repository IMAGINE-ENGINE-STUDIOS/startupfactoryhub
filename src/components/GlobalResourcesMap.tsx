import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useResources, Resource, ResourceType } from '@/hooks/useResources';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
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
  Bookmark,
  Plus,
  X,
  Menu,
  ChevronRight,
  Pause,
  Play,
  Locate,
  Loader2,
  Mail
} from 'lucide-react';
import { AddResourceDialog } from './AddResourceDialog';
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
  other: { icon: MapPin, color: '#64748b', label: 'Other' },
};

export const GlobalResourcesMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null);
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const isRotatingRef = useRef(true);

  const { data: resources, isLoading } = useResources({ 
    type: selectedType || undefined,
    search: search || undefined
  });

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
      (error) => {
        toast({ title: "Location unavailable", description: "Unable to get your location", variant: "destructive" });
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Helper: Create marker icon for native markers
  const createMarkerIcon = (color: string, type: ResourceType) => {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { width: size, height: size, data: new Uint8Array(size * size * 4) };
    }

    // Draw teardrop pin shape
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.beginPath();
    ctx.arc(0, -6, 12, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw pin tip
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.lineTo(0, 12);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Add white center dot
    ctx.beginPath();
    ctx.arc(0, -6, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    
    ctx.restore();
    
    // Convert to ImageData
    return ctx.getImageData(0, 0, size, size);
  };

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
      
      // Add marker icons for each resource type
      Object.entries(RESOURCE_CONFIG).forEach(([type, config]) => {
        const canvas = createMarkerIcon(config.color, type as ResourceType);
        map.current!.addImage(`marker-${type}`, canvas);
      });

      // Add GeoJSON source for markers
      map.current.addSource('resources', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Add symbol layer for native markers
      map.current.addLayer({
        id: 'resource-markers',
        type: 'symbol',
        source: 'resources',
        layout: {
          'icon-image': ['concat', 'marker-', ['get', 'resourceType']],
          'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.4,
            5, 0.6,
            10, 0.8,
            15, 1.0
          ],
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      });

      // Click handler for native markers
      map.current.on('click', 'resource-markers', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const resourceId = feature.properties?.id;
        const resource = resources?.find(r => r.id === resourceId);
        if (resource) {
          setSelectedResource(resource);
          map.current?.flyTo({
            center: [resource.longitude!, resource.latitude!],
            zoom: 12,
            duration: 2000,
          });
        }
      });

      // Cursor pointer on hover
      map.current.on('mouseenter', 'resource-markers', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'resource-markers', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
      
      // Ensure the map is visible
      map.current.resize();
    });

    // Auto-rotate globe
    let userInteracting = false;
    const spinGlobe = () => {
      if (!map.current || userInteracting || !isRotatingRef.current) return;
      const center = map.current.getCenter();
      center.lng -= 0.15;
      map.current.easeTo({ center, duration: 1000, easing: (n) => n });
    };

    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('mouseup', () => { 
      userInteracting = false; 
      setTimeout(spinGlobe, 100);
    });
    map.current.on('moveend', spinGlobe);
    
    // Initial spin
    setTimeout(spinGlobe, 500);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Sync isRotating state with ref for spinGlobe closure
  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  // User location marker
  useEffect(() => {
    if (!map.current || !userLocation) return;
    
    // Remove existing user marker
    if (userMarker.current) {
      userMarker.current.remove();
    }
    
    // Create pulsing blue dot marker for user
    const el = document.createElement('div');
    el.innerHTML = `
      <style>
        @keyframes pulse-location {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.5); }
        }
      </style>
      <div style="position: relative;">
        <div style="width: 16px; height: 16px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59,130,246,0.5);"></div>
        <div style="position: absolute; top: -4px; left: -4px; width: 24px; height: 24px; background: rgba(59,130,246,0.3); border-radius: 50%; animation: pulse-location 2s infinite;"></div>
      </div>
    `;
    
    userMarker.current = new mapboxgl.Marker(el)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);
    
    return () => {
      userMarker.current?.remove();
    };
  }, [userLocation]);

  useEffect(() => {
    if (!map.current || !resources) return;

    // Clear existing HTML markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Separate resources: with logos (HTML markers) vs without (native markers)
    const resourcesWithLogos = resources.filter(r => r.logo_url && r.latitude && r.longitude);
    const resourcesWithoutLogos = resources.filter(r => !r.logo_url && r.latitude && r.longitude);

    // Update GeoJSON source with resources WITHOUT logos (native markers)
    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: resourcesWithoutLogos.map(resource => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [resource.longitude!, resource.latitude!]
        },
        properties: {
          id: resource.id,
          title: resource.title,
          resourceType: resource.resource_type
        }
      }))
    };

    const source = map.current.getSource('resources') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(geojsonData);
    }

    // Add HTML markers for resources WITH logos
    resourcesWithLogos.forEach(resource => {
      const config = RESOURCE_CONFIG[resource.resource_type];
      const isOfficialPartner = resource.is_official_partner === true;
      
      // Create marker element
      const el = document.createElement('div');
      el.className = 'resource-marker';
      el.style.cssText = `
        width: 28px;
        height: 28px;
        position: relative;
      `;
      
      // Logo container
      const logoEl = document.createElement('div');
      logoEl.style.cssText = `
        width: 28px;
        height: 28px;
        background: url(${resource.logo_url}) center/cover, white;
        border: 2px solid ${config.color};
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 2px ${config.color}30;
        transition: all 0.2s;
      `;
      
      el.appendChild(logoEl);
      
      // Only add golden star for official partners
      if (isOfficialPartner) {
        const starEl = document.createElement('div');
        starEl.innerHTML = '⭐';
        starEl.style.cssText = `
          position: absolute;
          top: -6px;
          right: -6px;
          font-size: 12px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
          pointer-events: none;
        `;
        el.appendChild(starEl);
      }

      // Hover effect
      el.addEventListener('mouseenter', () => {
        logoEl.style.transform = 'scale(1.15)';
        logoEl.style.boxShadow = `0 4px 12px rgba(0,0,0,0.4), 0 0 0 3px ${config.color}50`;
      });
      el.addEventListener('mouseleave', () => {
        logoEl.style.transform = 'scale(1)';
        logoEl.style.boxShadow = `0 2px 8px rgba(0,0,0,0.3), 0 0 0 2px ${config.color}30`;
      });

      // Click handler
      el.addEventListener('click', () => {
        setSelectedResource(resource);
        if (map.current && resource.latitude && resource.longitude) {
          map.current.flyTo({
            center: [resource.longitude, resource.latitude],
            zoom: 12,
            duration: 2000,
          });
        }
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([resource.longitude!, resource.latitude!])
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [resources]);

  const getDirections = (resource: Resource) => {
    if (resource.latitude && resource.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${resource.latitude},${resource.longitude}`, '_blank');
    }
  };

  return (
    <div className="relative w-full h-full bg-background overflow-hidden">
      {/* Full Viewport Map */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* Control Buttons - Top Center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {/* Rotation Toggle Button */}
        <Button
          size="icon"
          onClick={() => setIsRotating(!isRotating)}
          className="backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/30 rounded-2xl hover:bg-white/20 dark:hover:bg-black/30 transition-all"
          title={isRotating ? "Pause rotation" : "Resume rotation"}
        >
          {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        {/* My Location Button */}
        <Button
          size="icon"
          onClick={requestUserLocation}
          disabled={isLocating}
          className="backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/30 rounded-2xl hover:bg-white/20 dark:hover:bg-black/30 transition-all disabled:opacity-50"
          title="Show my location"
        >
          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
        </Button>
      </div>
      
      {/* Single Toggle Button - works for both open and closed states */}
      <Button
        size="icon"
        onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
        className={cn(
          "absolute top-4 z-20 backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:bg-white/20 dark:hover:bg-black/30 rounded-2xl",
          isLeftPanelOpen ? "left-[348px]" : "left-4"
        )}
        variant="ghost"
      >
        {isLeftPanelOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Left Side Sliding Panel */}
      <div 
        className={cn(
          "absolute top-2 bottom-2 w-80 z-10 transition-all duration-300",
          isLeftPanelOpen ? "left-2" : "-left-[330px]"
        )}
      >
        <div className="h-full backdrop-blur-3xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col rounded-3xl">
          {/* Header */}
          <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Resources Map
            </h2>
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
          <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Categories</h3>
            <ScrollArea className="h-64">
              <div className="space-y-1">
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
                {(Object.keys(RESOURCE_CONFIG) as ResourceType[]).map((type) => {
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
            </ScrollArea>
          </div>

          {/* Resource List */}
          <div className="flex-1 overflow-hidden flex flex-col backdrop-blur">
            <div className="p-4 border-b border-white/30 dark:border-white/20">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Resources ({resources?.length || 0})
              </h3>
            </div>
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-2 py-2">
                {resources?.map((resource) => {
                  const config = RESOURCE_CONFIG[resource.resource_type];
                  const Icon = config.icon;
                  const isSelected = selectedResource?.id === resource.id;
                  return (
                    <Card
                      key={resource.id}
                      className={cn(
                        "cursor-pointer transition-all backdrop-blur-2xl bg-white/10 dark:bg-black/20 hover:bg-white/20 dark:hover:bg-black/30 border-white/30 dark:border-white/20 rounded-2xl",
                        isSelected && "ring-2 ring-primary shadow-lg shadow-primary/20 bg-white/20 dark:bg-black/30"
                      )}
                      onClick={() => {
                        setSelectedResource(resource);
                        if (map.current && resource.latitude && resource.longitude) {
                          map.current.flyTo({
                            center: [resource.longitude, resource.latitude],
                            zoom: 12,
                            duration: 2000,
                          });
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-xl"
                            style={{ backgroundColor: config.color + '20' }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{resource.title}</h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {resource.city}, {resource.country}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Add Resource Button */}
          <div className="p-4 border-t border-white/30 dark:border-white/20 backdrop-blur">
            <Button 
              onClick={() => setShowAddDialog(true)} 
              className="w-full gap-2 backdrop-blur-xl bg-primary/90 hover:bg-primary border border-white/20 rounded-2xl"
            >
              <Plus className="w-4 h-4" />
              Add Resource
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side Panel - Resource Details (Slide In) */}
      <div 
        className={cn(
          "absolute right-2 top-2 bottom-2 w-96 z-10 transition-all duration-300",
          selectedResource ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        )}
      >
        <div className="h-full backdrop-blur-3xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden flex flex-col rounded-3xl">
          {selectedResource && (
            <>
              <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <Badge 
                      className="mb-2 backdrop-blur-xl rounded-xl" 
                      style={{ 
                        backgroundColor: RESOURCE_CONFIG[selectedResource.resource_type].color,
                        color: 'white'
                      }}
                    >
                      {RESOURCE_CONFIG[selectedResource.resource_type].label}
                    </Badge>
                    <h3 className="text-lg font-semibold">{selectedResource.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedResource(null)}
                    className="shrink-0 backdrop-blur-xl bg-white/10 dark:bg-black/20 hover:bg-white/20 dark:hover:bg-black/30 rounded-xl"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {selectedResource.logo_url && (
                  <img 
                    src={selectedResource.logo_url} 
                    alt="" 
                    className="w-full h-32 rounded-2xl object-cover mb-3" 
                  />
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedResource.description}
                  </p>

                  {selectedResource.location_type === 'physical' && selectedResource.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p>{selectedResource.address}</p>
                        <p className="text-muted-foreground">
                          {selectedResource.city}, {selectedResource.country}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedResource.location_type !== 'physical' && (
                    <Badge variant="outline" className="backdrop-blur-xl rounded-xl">Online Resource</Badge>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    {selectedResource.latitude && selectedResource.longitude && (
                       <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2 backdrop-blur-2xl bg-white/10 dark:bg-black/20 border-white/30 dark:border-white/20 hover:bg-white/20 dark:hover:bg-black/30 w-full justify-start rounded-xl" 
                        onClick={() => getDirections(selectedResource)}
                      >
                        <Navigation className="w-4 h-4" />
                        Get Directions
                      </Button>
                    )}
                    {selectedResource.website_url && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2 backdrop-blur-2xl bg-white/10 dark:bg-black/20 border-white/30 dark:border-white/20 hover:bg-white/20 dark:hover:bg-black/30 w-full justify-start rounded-xl" 
                        asChild
                      >
                        <a href={selectedResource.website_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          Visit Website
                        </a>
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2 backdrop-blur-2xl bg-white/10 dark:bg-black/20 border-white/30 dark:border-white/20 hover:bg-white/20 dark:hover:bg-black/30 w-full justify-start rounded-xl"
                    >
                      <Bookmark className="w-4 h-4" />
                      Bookmark
                    </Button>

                    {/* Contact Information */}
                    {selectedResource.contact_email && (
                      <div className="mt-4 p-4 rounded-2xl backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Contact Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          {selectedResource.title === 'Nasdaq Interns Match' && (
                            <>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Media Inquiries:</p>
                                <a 
                                  href="mailto:media@theCenter.nasdaq.org" 
                                  className="text-primary hover:underline"
                                >
                                  media@theCenter.nasdaq.org
                                </a>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Partnership Opportunities:</p>
                                <a 
                                  href="mailto:partners@theCenter.nasdaq.org" 
                                  className="text-primary hover:underline"
                                >
                                  partners@theCenter.nasdaq.org
                                </a>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Event Inquiries:</p>
                                <a 
                                  href="mailto:events@theCenter.nasdaq.org" 
                                  className="text-primary hover:underline"
                                >
                                  events@theCenter.nasdaq.org
                                </a>
                              </div>
                            </>
                          )}
                          {selectedResource.title !== 'Nasdaq Interns Match' && (
                            <a 
                              href={`mailto:${selectedResource.contact_email}`} 
                              className="text-primary hover:underline"
                            >
                              {selectedResource.contact_email}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/30 backdrop-blur-sm flex items-center justify-center z-30 pointer-events-none">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      <AddResourceDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
};