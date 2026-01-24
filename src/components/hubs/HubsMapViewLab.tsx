import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Workspace, WorkspaceType } from '@/hooks/useHubsSearch';
import { Button } from '@/components/ui/button';
import { Locate, Loader2, Pause, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGISLayers } from '@/hooks/useGISLayers';
import { useExternalTracking, DEMO_PROVIDERS } from '@/hooks/useExternalTracking';
import { ExternalTrackingMarkers } from './ExternalTrackingMarkers';
import { GISControlPanel, MapStyleType } from './GISControlPanel';

mapboxgl.accessToken = 'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

// Map styles
const MAP_STYLES: Record<MapStyleType, string> = {
  default: 'mapbox://styles/imagineengine/cmhfkp1ie001d01qi2hyg82lp',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12',
};

// Workspace type colors matching WORKSPACE_CONFIG
const WORKSPACE_COLORS: Record<WorkspaceType, string> = {
  hot_desk: '#14b8a6',
  private_office: '#3b82f6',
  meeting_room: '#8b5cf6',
  coworking: '#10b981',
  event_space: '#f43f5e',
};

interface HubsMapViewLabProps {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  onWorkspaceSelect: (workspace: Workspace) => void;
  onWorkspaceBook: (workspace: Workspace) => void;
  isLeftPanelOpen?: boolean;
}

export const HubsMapViewLab = ({
  workspaces,
  selectedWorkspace,
  onWorkspaceSelect,
  onWorkspaceBook,
  isLeftPanelOpen = false,
}: HubsMapViewLabProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const isMobile = useIsMobile();
  
  const [isLocating, setIsLocating] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyleType>('default');
  const [mapReady, setMapReady] = useState(false);
  const isRotatingRef = useRef(false);

  // GIS Layers and External Tracking hooks
  const { layers, addLayer, toggleLayerVisibility } = useGISLayers(map.current);
  const { 
    providers, 
    allEntities, 
    isPolling, 
    toggleProvider 
  } = useExternalTracking(DEMO_PROVIDERS);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[mapStyle],
      projection: { name: 'globe' },
      zoom: 2.5,
      center: [-80, 20],
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
      
      setMapReady(true);
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
    
    setTimeout(spinGlobe, 500);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Sync isRotating state with ref
  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  // Handle map style change
  const handleStyleChange = useCallback((style: MapStyleType) => {
    if (!map.current) return;
    
    setMapStyle(style);
    setMapReady(false);
    
    map.current.setStyle(MAP_STYLES[style]);
    
    // Re-apply fog after style load
    map.current.once('style.load', () => {
      if (!map.current) return;
      
      // Re-add fog for non-satellite styles
      if (style === 'default') {
        map.current.setFog({
          color: '#0f172a',
          'high-color': '#1e293b',
          'horizon-blend': 0.02,
          'space-color': '#020617',
          'star-intensity': 0.15
        });
      }
      
      setMapReady(true);
    });
  }, []);

  // Update workspace markers when workspaces change or map is ready
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    workspaces.forEach((workspace) => {
      if (!workspace.latitude || !workspace.longitude) return;

      const primaryType = workspace.workspace_types[0] || 'coworking';
      const color = WORKSPACE_COLORS[primaryType] || '#10b981';
      const markerSize = 36;

      const el = document.createElement('div');
      el.className = 'workspace-marker';
      el.style.cssText = `
        width: ${markerSize}px;
        height: ${markerSize}px;
        cursor: pointer;
        position: absolute;
        transform: translate(-50%, -50%);
      `;
      
      const markerEl = document.createElement('div');
      markerEl.style.cssText = `
        width: ${markerSize}px;
        height: ${markerSize}px;
        min-width: ${markerSize}px;
        min-height: ${markerSize}px;
        max-width: ${markerSize}px;
        max-height: ${markerSize}px;
        background: ${workspace.image_url ? `url(${workspace.image_url}) center/cover,` : ''} linear-gradient(135deg, ${color}, ${color}dd);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px ${color}80, 0 2px 8px rgba(0,0,0,0.3);
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      if (!workspace.image_url) {
        markerEl.innerHTML = `
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
        `;
      }
      
      el.appendChild(markerEl);

      el.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'scale(1.15)';
        markerEl.style.boxShadow = `0 6px 20px ${color}aa, 0 4px 12px rgba(0,0,0,0.4)`;
      });
      el.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'scale(1)';
        markerEl.style.boxShadow = `0 4px 12px ${color}80, 0 2px 8px rgba(0,0,0,0.3)`;
      });

      const marker = new mapboxgl.Marker({ 
        element: el, 
        anchor: 'center',
        offset: [0, 0]
      })
        .setLngLat([workspace.longitude, workspace.latitude])
        .addTo(map.current!);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onWorkspaceSelect(workspace);
        
        isRotatingRef.current = false;
        setIsRotating(false);
        
        map.current?.flyTo({
          center: [workspace.longitude, workspace.latitude],
          zoom: 14,
          duration: 2000,
        });
      });

      markers.current.push(marker);
    });
  }, [workspaces, onWorkspaceSelect, mapReady]);

  // Fly to selected workspace
  useEffect(() => {
    if (!map.current || !selectedWorkspace) return;

    map.current.flyTo({
      center: [selectedWorkspace.longitude, selectedWorkspace.latitude],
      zoom: 14,
      duration: 2000,
    });

    isRotatingRef.current = false;
    setIsRotating(false);
  }, [selectedWorkspace]);

  const requestUserLocation = useCallback(() => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        
        if (userMarker.current) {
          userMarker.current.remove();
        }
        
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
        
        userMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center', offset: [0, 0] })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map.current!);
        
        map.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 12, duration: 2000 });
        setIsLocating(false);
        
        toast({ title: "Location found", description: "Showing workspaces near you" });
      },
      (error) => {
        toast({ title: "Location unavailable", description: "Unable to get your location", variant: "destructive" });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // Handle entity click from tracking
  const handleEntityClick = useCallback((entity: any) => {
    toast({
      title: entity.name,
      description: `Type: ${entity.type} | Speed: ${entity.speed || 'N/A'} km/h`,
    });
    
    map.current?.flyTo({
      center: [entity.longitude, entity.latitude],
      zoom: 14,
      duration: 1500,
    });
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full rounded-2xl">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full rounded-2xl" />
      
      {/* External Tracking Markers */}
      <ExternalTrackingMarkers 
        map={map.current} 
        entities={allEntities} 
        onEntityClick={handleEntityClick}
      />

      {/* GIS Control Panel */}
      <GISControlPanel
        layers={layers}
        trackingProviders={providers}
        onToggleLayer={toggleLayerVisibility}
        onToggleProvider={toggleProvider}
        onStyleChange={handleStyleChange}
        currentStyle={mapStyle}
        isPolling={isPolling}
      />
      
      {/* Control Buttons */}
      {!(isMobile && isLeftPanelOpen) && (
        <div className={cn(
          "absolute z-20 flex gap-2",
          isMobile 
            ? "bottom-52 right-4 flex-col" 
            : "top-4 left-1/2 -translate-x-1/2"
        )}>
          <Button
            size="icon"
            onClick={() => setIsRotating(!isRotating)}
            className="backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/30 rounded-2xl hover:bg-white/20 dark:hover:bg-black/30 transition-all"
            title={isRotating ? "Pause rotation" : "Resume rotation"}
          >
            {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

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
      )}

      {/* Lab Badge */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="backdrop-blur-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2">
          🧪 GIS Lab Environment
        </div>
      </div>
    </div>
  );
};
