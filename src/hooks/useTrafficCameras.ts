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

  const fetchCameras = useCallback(async (bounds: UseBounds) => {
    // Check cache (60s)
    if (cacheRef.current && Date.now() - cacheRef.current.time < 60000) {
      const cb = cacheRef.current.bounds;
      if (
        Math.abs(cb.north - bounds.north) < 1 &&
        Math.abs(cb.south - bounds.south) < 1 &&
        Math.abs(cb.east - bounds.east) < 1 &&
        Math.abs(cb.west - bounds.west) < 1
      ) {
        setCameras(cacheRef.current.data);
        return;
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
      setCameras(cams);
      cacheRef.current = { data: cams, time: Date.now(), bounds };
      lastFetchBounds.current = bounds;
    } catch (err: any) {
      console.error('Traffic cameras fetch error:', err);
      setError(err.message || 'Failed to fetch cameras');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on map move when enabled and zoom >= 10
  useEffect(() => {
    if (!map || !mapReady || !enabled) {
      setCameras([]);
      return;
    }

    const handleMoveEnd = () => {
      const zoom = map.getZoom();
      if (zoom < 10) {
        setCameras([]);
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

      // Debounce
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = window.setTimeout(() => fetchCameras(bounds), 500);
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
