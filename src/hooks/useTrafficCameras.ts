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
  streamUrl?: string;
  refreshRate?: number;
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
  const selectedCameraRef = useRef<TrafficCamera | null>(null);
  const fetchTimeoutRef = useRef<number | null>(null);
  const cacheRef = useRef<{ time: number; bounds: UseBounds } | null>(null);
  
  // ACCUMULATE cameras across fetches - never lose a camera once seen
  const accumulatedCamerasRef = useRef<Map<string, TrafficCamera>>(new Map());

  const handleSetSelectedCamera = useCallback((cam: TrafficCamera | null) => {
    selectedCameraRef.current = cam;
    setSelectedCamera(cam);
  }, []);

  const fetchCameras = useCallback(async (bounds: UseBounds) => {
    // Skip if bounds barely moved and recently fetched
    if (cacheRef.current && Date.now() - cacheRef.current.time < 30000) {
      const cb = cacheRef.current.bounds;
      if (
        Math.abs(cb.north - bounds.north) < 0.5 &&
        Math.abs(cb.south - bounds.south) < 0.5 &&
        Math.abs(cb.east - bounds.east) < 0.5 &&
        Math.abs(cb.west - bounds.west) < 0.5
      ) {
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

      const newCams = (data?.cameras || []) as TrafficCamera[];
      
      // MERGE new cameras into accumulated map - never remove
      let added = false;
      for (const cam of newCams) {
        if (!accumulatedCamerasRef.current.has(cam.id)) {
          accumulatedCamerasRef.current.set(cam.id, cam);
          added = true;
        }
      }
      
      // Only trigger re-render if we added new cameras
      if (added) {
        setCameras(Array.from(accumulatedCamerasRef.current.values()));
      }
      
      cacheRef.current = { time: Date.now(), bounds };
    } catch (err: any) {
      console.error('Traffic cameras fetch error:', err);
      setError(err.message || 'Failed to fetch cameras');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!map || !mapReady || !enabled) {
      // When disabled, clear everything
      if (accumulatedCamerasRef.current.size > 0) {
        accumulatedCamerasRef.current.clear();
        setCameras([]);
      }
      return;
    }

    const handleMoveEnd = () => {
      if (selectedCameraRef.current) return;
      
      const zoom = map.getZoom();
      if (zoom < 9) {
        // Don't clear accumulated cameras at low zoom, just don't fetch more
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

      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = window.setTimeout(() => fetchCameras(bounds), 800);
    };

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
    setSelectedCamera: handleSetSelectedCamera,
  };
};
