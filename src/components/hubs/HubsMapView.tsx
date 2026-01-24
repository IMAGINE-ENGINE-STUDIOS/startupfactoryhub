import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Workspace } from '@/hooks/useHubsSearch';
import { Button } from '@/components/ui/button';
import { Locate, Loader2, Pause, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
      zoom: 2.5,
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

  // Update markers when workspaces change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    workspaces.forEach((workspace) => {
      if (!workspace.latitude || !workspace.longitude) return;

      // Create marker element with proper centering
      const el = document.createElement('div');
      el.className = 'workspace-marker cursor-pointer';
      el.style.pointerEvents = 'auto';
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
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s;
          pointer-events: auto;
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
        el.style.transform = 'scale(1.2)';
        el.style.zIndex = '100';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1';
      });

      // Use anchor: 'center' to ensure marker is centered on coordinates
      const marker = new mapboxgl.Marker({ 
        element: el, 
        anchor: 'center' 
      })
        .setLngLat([workspace.longitude, workspace.latitude])
        .addTo(map.current!);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onWorkspaceSelect(workspace);
        
        // Stop rotation when selecting
        isRotatingRef.current = false;
        setIsRotating(false);
        
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

        userMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
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

  const toggleRotation = useCallback(() => {
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
  }, [isRotating]);

  return (
    <div className="absolute inset-0 z-0">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Control Buttons - Below Mapbox Controls */}
      <div className="absolute top-32 right-3 z-10 flex flex-col gap-2 pointer-events-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleRotation}
          className="tech-card border-0 backdrop-blur-xl bg-white/10 dark:bg-black/20 rounded-xl hover:bg-white/20"
        >
          {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLocateUser}
          disabled={isLocating}
          className="tech-card border-0 backdrop-blur-xl bg-white/10 dark:bg-black/20 rounded-xl hover:bg-white/20"
        >
          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};
