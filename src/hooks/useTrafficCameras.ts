import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrafficCamera {
  id: string;
  name: string;
  lat: number;
  lng: number;
  imageUrl: string;
  source: string;
  lastUpdated?: string;
}

interface UseBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Deep compare camera arrays by id set - only trigger re-render if actual data changed
function camerasChanged(prev: TrafficCamera[], next: TrafficCamera[]): boolean {
  if (prev.length !== next.length) return true;
  const prevIds = new Set(prev.map(c => c.id));
  for (const cam of next) {
    if (!prevIds.has(cam.id)) return true;
  }
  return false;
}

export const useTrafficCameras = (
  map: mapboxgl.Map | null,
  mapReady: boolean,
  enabled: boolean
) => {
  const [cameras, setCameras] = useState<TrafficCamera[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<TrafficCamera | null>(null);
  const lastFetchBounds = useRef<UseBounds | null>(null);
  const fetchTimeoutRef = useRef<number | null>(null);
  const cacheRef = useRef<{ data: TrafficCamera[]; time: number; bounds: UseBounds } | null>(null);
  const currentCamerasRef = useRef<TrafficCamera[]>([]);

  const fetchCameras = useCallback(async (bounds: UseBounds) => {
    // Check cache - skip if bounds barely moved
    if (cacheRef.current && Date.now() - cacheRef.current.time < 30000) {
      const cb = cacheRef.current.bounds;
      if (
        Math.abs(cb.north - bounds.north) < 0.5 &&
        Math.abs(cb.south - bounds.south) < 0.5 &&
        Math.abs(cb.east - bounds.east) < 0.5 &&
        Math.abs(cb.west - bounds.west) < 0.5
      ) {
        return; // Don't even re-set cameras, nothing changed
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('traffic-cameras', {
        body: { bounds },
      });

      if (fnError) throw fnError;

      const cams = (data?.cameras || []) as TrafficCamera[];
      
      // Only update state if cameras actually changed
      if (camerasChanged(currentCamerasRef.current, cams)) {
        currentCamerasRef.current = cams;
        setCameras(cams);
      }
      
      cacheRef.current = { data: cams, time: Date.now(), bounds };
      lastFetchBounds.current = bounds;
    } catch (err: any) {
      console.error('Traffic cameras fetch error:', err);
      setError(err.message || 'Failed to fetch cameras');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on map move when enabled and zoom >= 9
  useEffect(() => {
    if (!map || !mapReady || !enabled) {
      if (currentCamerasRef.current.length > 0) {
        currentCamerasRef.current = [];
        setCameras([]);
      }
      return;
    }

    const handleMoveEnd = () => {
      const zoom = map.getZoom();
      if (zoom < 9) {
        if (currentCamerasRef.current.length > 0) {
          currentCamerasRef.current = [];
          setCameras([]);
        }
        return;
      }

      const b = map.getBounds();
      if (!b) return;

      const bounds: UseBounds = {
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      };

      // Debounce with longer delay to prevent rapid re-fetches
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = window.setTimeout(() => fetchCameras(bounds), 800);
    };

    // Initial fetch
    handleMoveEnd();

    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [map, mapReady, enabled, fetchCameras]);

  return {
    cameras,
    isLoading,
    error,
    selectedCamera,
    setSelectedCamera,
  };
};
