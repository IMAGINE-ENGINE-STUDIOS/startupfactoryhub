import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Workspace } from '@/hooks/useHubsSearch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Locate, Loader2, MapPin, Star, Calendar, Building2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

mapboxgl.accessToken = 'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

interface HubsMapViewProps {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  onWorkspaceSelect: (workspace: Workspace) => void;
  onWorkspaceBook: (workspace: Workspace) => void;
}

export const HubsMapView = ({
  workspaces,
  selectedWorkspace,
  onWorkspaceSelect,
  onWorkspaceBook,
}: HubsMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  
  const [isLocating, setIsLocating] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const isRotatingRef = useRef(true);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/imagineengine/cmhfkp1ie001d01qi2hyg82lp',
      projection: { name: 'globe' },
      zoom: 2,
      center: [-40, 30],
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

    // Auto-rotate globe
    const rotateGlobe = () => {
      if (!map.current || !isRotatingRef.current) return;
      const center = map.current.getCenter();
      center.lng -= 0.5;
      map.current.easeTo({ center, duration: 1000, easing: (n) => n });
    };

    const interval = setInterval(rotateGlobe, 100);

    // Stop rotation on interaction
    map.current.on('mousedown', () => {
      isRotatingRef.current = false;
      setIsRotating(false);
    });

    map.current.on('touchstart', () => {
      isRotatingRef.current = false;
      setIsRotating(false);
    });

    return () => {
      clearInterval(interval);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when workspaces change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    workspaces.forEach((workspace) => {
      if (!workspace.latitude || !workspace.longitude) return;

      // Create marker element
      const el = document.createElement('div');
      el.className = 'workspace-marker';
      el.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(280 100% 60%));
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <path d="M9 22v-4h6v4"></path>
            <path d="M8 6h.01"></path>
            <path d="M16 6h.01"></path>
            <path d="M12 6h.01"></path>
            <path d="M12 10h.01"></path>
            <path d="M12 14h.01"></path>
            <path d="M16 10h.01"></path>
            <path d="M16 14h.01"></path>
            <path d="M8 10h.01"></path>
            <path d="M8 14h.01"></path>
          </svg>
        </div>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([workspace.longitude, workspace.latitude])
        .addTo(map.current!);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onWorkspaceSelect(workspace);
        
        map.current?.flyTo({
          center: [workspace.longitude, workspace.latitude],
          zoom: 14,
          duration: 1500,
        });
      });

      markers.current.push(marker);
    });
  }, [workspaces, onWorkspaceSelect]);

  // Fly to selected workspace
  useEffect(() => {
    if (!map.current || !selectedWorkspace) return;

    map.current.flyTo({
      center: [selectedWorkspace.longitude, selectedWorkspace.latitude],
      zoom: 14,
      duration: 1500,
    });

    // Stop rotation
    isRotatingRef.current = false;
    setIsRotating(false);
  }, [selectedWorkspace]);

  const handleLocateUser = useCallback(() => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Add user marker
        if (userMarker.current) {
          userMarker.current.remove();
        }

        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            width: 20px;
            height: 20px;
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
          "></div>
        `;

        userMarker.current = new mapboxgl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(map.current!);

        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 12,
          duration: 2000,
        });

        isRotatingRef.current = false;
        setIsRotating(false);
        setIsLocating(false);

        toast({
          title: 'Location found',
          description: 'Showing workspaces near you',
        });
      },
      (error) => {
        toast({
          title: 'Location unavailable',
          description: 'Unable to get your location',
          variant: 'destructive',
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleLocateUser}
          disabled={isLocating}
          className="bg-background/80 backdrop-blur-sm shadow-lg"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Locate className="h-4 w-4" />
          )}
          <span className="ml-2">My Location</span>
        </Button>
      </div>

      {/* Selected Workspace Card */}
      {selectedWorkspace && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-10">
          <Card className="bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {selectedWorkspace.image_url ? (
                  <img
                    src={selectedWorkspace.image_url}
                    alt={selectedWorkspace.name}
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold truncate">{selectedWorkspace.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {selectedWorkspace.city}, {selectedWorkspace.country}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      onClick={() => onWorkspaceSelect(null as any)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      {selectedWorkspace.hourly_rate_min && (
                        <span className="font-bold text-primary">
                          ${selectedWorkspace.hourly_rate_min}/hr
                        </span>
                      )}
                      {selectedWorkspace.rating && (
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-4 w-4 fill-current" />
                          {selectedWorkspace.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onWorkspaceBook(selectedWorkspace)}
                      className="gap-1.5"
                    >
                      <Calendar className="h-4 w-4" />
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Overlay */}
      <div className="absolute bottom-4 right-4 z-10">
        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
          {workspaces.length} workspaces
        </Badge>
      </div>
    </div>
  );
};
