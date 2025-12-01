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
  ChevronRight
} from 'lucide-react';
import { AddResourceDialog } from './AddResourceDialog';

mapboxgl.accessToken = 'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

const RESOURCE_CONFIG: Record<ResourceType, { icon: any; color: string; label: string }> = {
  office: { icon: Building2, color: 'hsl(var(--chart-1))', label: 'Office' },
  lab: { icon: Beaker, color: 'hsl(var(--chart-2))', label: 'Laboratory' },
  venue: { icon: MapPin, color: 'hsl(var(--chart-3))', label: 'Venue' },
  perk: { icon: Gift, color: 'hsl(var(--chart-4))', label: 'Perk' },
  chamber_of_commerce: { icon: Landmark, color: 'hsl(var(--chart-5))', label: 'Chamber' },
  technology_transfer: { icon: RefreshCw, color: 'hsl(var(--accent))', label: 'Tech Transfer' },
  community: { icon: Users, color: 'hsl(var(--primary))', label: 'Community' },
  government_grant: { icon: DollarSign, color: 'hsl(220, 80%, 55%)', label: 'Gov Grant' },
  accelerator_incubator: { icon: Rocket, color: 'hsl(var(--primary))', label: 'Accelerator' },
  entrepreneur_center: { icon: GraduationCap, color: 'hsl(280, 70%, 60%)', label: 'Entrepreneur' },
  university: { icon: School, color: 'hsl(0, 70%, 60%)', label: 'University' },
  coworking: { icon: Briefcase, color: 'hsl(180, 60%, 50%)', label: 'Coworking' },
  investor_network: { icon: TrendingUp, color: 'hsl(50, 90%, 55%)', label: 'Investor Net' },
  other: { icon: MapPin, color: 'hsl(var(--muted-foreground))', label: 'Other' },
};

export const GlobalResourcesMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null);
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);

  const { data: resources, isLoading } = useResources({ 
    type: selectedType || undefined,
    search: search || undefined
  });

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/imagineengine/cmhfkp1ie001d01qi2hyg82lp',
      projection: { name: 'globe' },
      zoom: 1.5,
      center: [0, 20],
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'hsl(var(--background))',
        'high-color': 'hsl(var(--muted))',
        'horizon-blend': 0.2,
      });
    });

    // Auto-rotate globe
    let userInteracting = false;
    const spinGlobe = () => {
      if (!map.current || userInteracting) return;
      const center = map.current.getCenter();
      center.lng -= 0.15;
      map.current.easeTo({ center, duration: 1000, easing: (n) => n });
    };

    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('mouseup', () => { userInteracting = false; spinGlobe(); });
    map.current.on('moveend', spinGlobe);
    spinGlobe();

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !resources) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    resources
      .filter(r => r.latitude && r.longitude)
      .forEach(resource => {
        const config = RESOURCE_CONFIG[resource.resource_type];
        const el = document.createElement('div');
        el.className = 'resource-marker';
        el.style.cssText = `
          width: 32px;
          height: 32px;
          background: ${config.color};
          border: 2px solid hsl(var(--background));
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: all 0.2s;
        `;
        el.innerHTML = `<svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>`;
        
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.3)';
          el.style.boxShadow = `0 6px 20px ${config.color}50`;
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });
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

        const marker = new mapboxgl.Marker(el)
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
    <div className="absolute inset-0 w-full h-full">
      {/* Full Viewport Map */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Left Side Panel Toggle (Always Visible) */}
      <Button
        size="icon"
        onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
        className={cn(
          "absolute top-4 z-20 transition-all duration-300",
          isLeftPanelOpen ? "left-[340px]" : "left-4"
        )}
        variant="default"
      >
        {isLeftPanelOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Left Side Sliding Panel */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-80 z-10 transition-all duration-300",
          isLeftPanelOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full backdrop-blur-2xl bg-background/30 border-r border-white/20 dark:border-white/10 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Resources Map
            </h2>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background/50 backdrop-blur border-white/10"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Categories</h3>
            <ScrollArea className="h-64">
              <div className="space-y-1">
                <Button
                  variant={selectedType === null ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedType(null)}
                  className="w-full justify-start gap-2"
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
                      variant={isSelected ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedType(type)}
                      className="w-full justify-start gap-2"
                      style={isSelected ? { 
                        backgroundColor: config.color + '20',
                        borderLeft: `3px solid ${config.color}`
                      } : {}}
                    >
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Resource List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10">
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
                        "cursor-pointer transition-all backdrop-blur-lg bg-background/60 hover:bg-background/80 border-white/10",
                        isSelected && "ring-2 ring-primary shadow-lg shadow-primary/20"
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
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: config.color + '20', color: config.color }}
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
          <div className="p-4 border-t border-white/10">
            <Button 
              onClick={() => setShowAddDialog(true)} 
              className="w-full gap-2"
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
          "absolute right-0 top-0 bottom-0 w-96 z-10 transition-all duration-300",
          selectedResource ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        )}
      >
        <div className="h-full backdrop-blur-2xl bg-background/30 border-l border-white/20 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col">
          {selectedResource && (
            <>
              <div className="p-4 border-b border-white/10">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <Badge 
                      className="mb-2 backdrop-blur" 
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
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {selectedResource.logo_url && (
                  <img 
                    src={selectedResource.logo_url} 
                    alt="" 
                    className="w-full h-32 rounded-lg object-cover mb-3" 
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
                    <Badge variant="outline" className="backdrop-blur">Online Resource</Badge>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    {selectedResource.latitude && selectedResource.longitude && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2 backdrop-blur w-full justify-start" 
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
                        className="gap-2 backdrop-blur w-full justify-start" 
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
                      className="gap-2 backdrop-blur w-full justify-start"
                    >
                      <Bookmark className="w-4 h-4" />
                      Bookmark
                    </Button>
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