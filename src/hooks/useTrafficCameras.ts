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
  feedVerified?: boolean;
}

interface UseBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Viewport-only camera loading with feed validation queue.
 * 
 * Algorithm:
 * 1. Analyze viewport → fetch camera metadata (coordinates + URLs)
 * 2. Queue feed validation: try loading each camera's image
 * 3. If feed loads within 90s → mark verified, show icon
 * 4. If no feed after 90s → ignore camera
 * 5. When viewport moves → clear old cameras, fetch new ones
 */
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
  const validationAbortRef = useRef<AbortController | null>(null);

  const handleSetSelectedCamera = useCallback((cam: TrafficCamera | null) => {
    selectedCameraRef.current = cam;
    setSelectedCamera(cam);
  }, []);

  // Validate a single camera feed - resolve true if image loads within 90s
  const validateFeed = useCallback((camera: TrafficCamera, signal: AbortSignal): Promise<TrafficCamera | null> => {
    return new Promise((resolve) => {
      if (signal.aborted) { resolve(null); return; }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'zqiihhmdsdgwdcwmryym';
      const proxyUrl = `https://${projectId}.supabase.co/functions/v1/proxy-camera-image`;
      const testUrl = `${proxyUrl}?url=${encodeURIComponent(camera.imageUrl)}&_t=${Date.now()}`;

      const img = new Image();
      const timer = setTimeout(() => {
        img.src = '';
        resolve(null); // 90s timeout - ignore this camera
      }, 90000);

      const onAbort = () => {
        clearTimeout(timer);
        img.src = '';
        resolve(null);
      };
      signal.addEventListener('abort', onAbort, { once: true });

      img.onload = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        resolve({ ...camera, feedVerified: true });
      };
      img.onerror = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        resolve(null); // Feed failed - ignore
      };
      img.src = testUrl;
    });
  }, []);

  const fetchCameras = useCallback(async (bounds: UseBounds) => {
    // Skip if bounds barely moved and recently fetched
    if (cacheRef.current && Date.now() - cacheRef.current.time < 10000) {
      const cb = cacheRef.current.bounds;
      if (
        Math.abs(cb.north - bounds.north) < 0.1 &&
        Math.abs(cb.south - bounds.south) < 0.1 &&
        Math.abs(cb.east - bounds.east) < 0.1 &&
        Math.abs(cb.west - bounds.west) < 0.1
      ) {
        return;
      }
    }

    // Abort any in-progress validation from previous viewport
    if (validationAbortRef.current) {
      validationAbortRef.current.abort();
    }
    const abortController = new AbortController();
    validationAbortRef.current = abortController;

    setIsLoading(true);
    setError(null);
    // Clear old cameras immediately when viewport changes
    setCameras([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('traffic-cameras', {
        body: { bounds },
      });

      if (fnError) throw fnError;
      if (abortController.signal.aborted) return;

      const rawCams = (data?.cameras || []) as TrafficCamera[];
      cacheRef.current = { time: Date.now(), bounds };

      if (rawCams.length === 0) {
        setIsLoading(false);
        return;
      }

      // Queue: validate feeds in batches of 8
      const BATCH_SIZE = 8;
      const verified: TrafficCamera[] = [];

      for (let i = 0; i < rawCams.length; i += BATCH_SIZE) {
        if (abortController.signal.aborted) break;

        const batch = rawCams.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(cam => validateFeed(cam, abortController.signal))
        );

        for (const cam of results) {
          if (cam) verified.push(cam);
        }

        // Progressively show verified cameras
        if (!abortController.signal.aborted && verified.length > 0) {
          setCameras([...verified]);
        }
      }

      if (!abortController.signal.aborted) {
        setCameras([...verified]);
      }
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        console.error('Traffic cameras fetch error:', err);
        setError(err.message || 'Failed to fetch cameras');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [validateFeed]);

  useEffect(() => {
    if (!map || !mapReady || !enabled) {
      setCameras([]);
      return;
    }

    const handleMoveEnd = () => {
      if (selectedCameraRef.current) return;

      const zoom = map.getZoom();
      if (zoom < 9) {
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

      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = window.setTimeout(() => fetchCameras(bounds), 500);
    };

    handleMoveEnd();

    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if (validationAbortRef.current) validationAbortRef.current.abort();
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
