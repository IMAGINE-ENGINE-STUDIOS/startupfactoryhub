import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useResources, Resource, ResourceType } from '@/hooks/useResources';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Plus
} from 'lucide-react';
import { AddResourceDialog } from './AddResourceDialog';

mapboxgl.accessToken = 'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

const RESOURCE_CONFIG: Record<ResourceType, { icon: any; color: string; label: string }> = {
  office: { icon: Building2, color: 'hsl(var(--chart-1))', label: 'Office' },
  lab: { icon: Beaker, color: 'hsl(var(--chart-2))', label: 'Laboratory' },
  venue: { icon: MapPin, color: 'hsl(var(--chart-3))', label: 'Venue' },
  perk: { icon: Gift, color: 'hsl(var(--chart-4))', label: 'Perk' },
  chamber_of_commerce: { icon: Landmark, color: 'hsl(var(--chart-5))', label: 'Chamber of Commerce' },
  technology_transfer: { icon: RefreshCw, color: 'hsl(var(--accent))', label: 'Tech Transfer' },
  community: { icon: Users, color: 'hsl(var(--primary))', label: 'Community' },
  government_grant: { icon: DollarSign, color: 'hsl(220, 80%, 55%)', label: 'Gov Grant' },
  accelerator_incubator: { icon: Rocket, color: 'hsl(var(--primary))', label: 'Accelerator' },
  entrepreneur_center: { icon: GraduationCap, color: 'hsl(280, 70%, 60%)', label: 'Entrepreneur Center' },
  university: { icon: School, color: 'hsl(0, 70%, 60%)', label: 'University' },
  coworking: { icon: Briefcase, color: 'hsl(180, 60%, 50%)', label: 'Coworking' },
  investor_network: { icon: TrendingUp, color: 'hsl(50, 90%, 55%)', label: 'Investor Network' },
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
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.2s;
        `;
        el.innerHTML = `<svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>`;
        
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
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
    <div className="h-full flex flex-col gap-4">
      {/* Search and Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resources by name, city, or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Resource
        </Button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedType === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedType(null)}
        >
          All Resources
        </Button>
        {(Object.keys(RESOURCE_CONFIG) as ResourceType[]).map((type) => {
          const config = RESOURCE_CONFIG[type];
          const Icon = config.icon;
          return (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="gap-2"
            >
              <Icon className="w-4 h-4" />
              {config.label}
            </Button>
          );
        })}
      </div>

      {/* Map and Resource Cards */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Map */}
        <div className="lg:col-span-2 relative rounded-lg overflow-hidden border border-border bg-card shadow-lg">
          <div ref={mapContainer} className="absolute inset-0" />
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Resource Details Card */}
        <div className="overflow-y-auto space-y-4">
          {selectedResource ? (
            <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-2 border-primary/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Badge className="mb-2" style={{ backgroundColor: RESOURCE_CONFIG[selectedResource.resource_type].color }}>
                      {RESOURCE_CONFIG[selectedResource.resource_type].label}
                    </Badge>
                    <CardTitle className="text-xl">{selectedResource.title}</CardTitle>
                  </div>
                  {selectedResource.logo_url && (
                    <img src={selectedResource.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  )}
                </div>
                <CardDescription>{selectedResource.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedResource.location_type === 'physical' && selectedResource.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p>{selectedResource.address}</p>
                      <p className="text-muted-foreground">
                        {selectedResource.city}, {selectedResource.country}
                      </p>
                    </div>
                  </div>
                )}
                {selectedResource.location_type !== 'physical' && (
                  <Badge variant="outline">Online Resource</Badge>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedResource.latitude && selectedResource.longitude && (
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => getDirections(selectedResource)}>
                      <Navigation className="w-4 h-4" />
                      Get Directions
                    </Button>
                  )}
                  {selectedResource.website_url && (
                    <Button size="sm" variant="outline" className="gap-2" asChild>
                      <a href={selectedResource.website_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Visit Website
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-2">
                    <Bookmark className="w-4 h-4" />
                    Bookmark
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/30 backdrop-blur border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Click on a marker on the map to view resource details
                </p>
              </CardContent>
            </Card>
          )}

          {/* Resource List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">
              {resources?.length || 0} Resources Found
            </h3>
            {resources?.slice(0, 5).map((resource) => {
              const config = RESOURCE_CONFIG[resource.resource_type];
              const Icon = config.icon;
              return (
                <Card
                  key={resource.id}
                  className="cursor-pointer hover:border-primary/50 transition-all"
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
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: config.color + '20', color: config.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{resource.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {resource.city}, {resource.country}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <AddResourceDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
};
