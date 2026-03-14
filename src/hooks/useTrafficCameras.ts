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
  feedVerified?: boolean;   // true = confirmed working
  feedDead?: boolean;       // true = confirmed broken
}

interface UseBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Shows ALL cameras immediately, then validates feeds in the background.
 * 
 * - Cameras appear on the map as soon as metadata arrives (amber/unverified).
 * - A background queue probes each feed via proxy; on success → green (verified),
 *   on failure → gray (dead). Both remain visible.
 * - When viewport moves, cameras swap atomically (no flash-clear).
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
  const camerasRef = useRef<TrafficCamera[]>([]);

  const handleSetSelectedCamera = useCallback((cam: TrafficCamera | null) => {
    selectedCameraRef.current = cam;
    setSelectedCamera(cam);
  }, []);

  // Validate a single camera feed
  const validateFeed = useCallback((camera: TrafficCamera, signal: AbortSignal): Promise<{ id: string; ok: boolean }> => {
    return new Promise((resolve) => {
      if (signal.aborted) { resolve({ id: camera.id, ok: false }); return; }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'zqiihhmdsdgwdcwmryym';
      const proxyUrl = `https://${projectId}.supabase.co/functions/v1/proxy-camera-image`;
      const testUrl = `${proxyUrl}?url=${encodeURIComponent(camera.imageUrl)}&_t=${Date.now()}`;

      const img = new Image();
      const timer = setTimeout(() => {
        img.src = '';
        resolve({ id: camera.id, ok: false });
      }, 30000); // 30s timeout per feed

      const onAbort = () => {
        clearTimeout(timer);
        img.src = '';
        resolve({ id: camera.id, ok: false });
      };
      signal.addEventListener('abort', onAbort, { once: true });

      img.onload = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        resolve({ id: camera.id, ok: true });
      };
      img.onerror = () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
        resolve({ id: camera.id, ok: false });
      };
      img.src = testUrl;
    });
  }, []);

  const fetchCameras = useCallback(async (bounds: UseBounds) => {
    // Skip if bounds barely moved and recently fetched (reduced threshold for better coverage)
    if (cacheRef.current && Date.now() - cacheRef.current.time < 8000) {
      const cb = cacheRef.current.bounds;
      if (
        Math.abs(cb.north - bounds.north) < 0.02 &&
        Math.abs(cb.south - bounds.south) < 0.02 &&
        Math.abs(cb.east - bounds.east) < 0.02 &&
        Math.abs(cb.west - bounds.west) < 0.02
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

    try {
      const { data, error: fnError } = await supabase.functions.invoke('traffic-cameras', {
        body: { bounds },
      });

      if (fnError) throw fnError;
      if (abortController.signal.aborted) return;

      const rawCams = (data?.cameras || []) as TrafficCamera[];
      cacheRef.current = { time: Date.now(), bounds };

      if (rawCams.length === 0) {
        setCameras([]);
        camerasRef.current = [];
        setIsLoading(false);
        return;
      }

      // Show ALL cameras immediately (unverified state)
      const allCams = rawCams.map(c => ({ ...c, feedVerified: undefined, feedDead: undefined }));
      camerasRef.current = allCams;
      setCameras([...allCams]);
      setIsLoading(false);

      // Background validation queue — batches of 12
      const BATCH_SIZE = 12;
      for (let i = 0; i < allCams.length; i += BATCH_SIZE) {
        if (abortController.signal.aborted) break;

        const batch = allCams.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(cam => validateFeed(cam, abortController.signal))
        );

        if (abortController.signal.aborted) break;

        // Update verification status in-place
        const resultMap = new Map(results.map(r => [r.id, r.ok]));
        let changed = false;
        for (const cam of camerasRef.current) {
          if (resultMap.has(cam.id)) {
            const ok = resultMap.get(cam.id)!;
            if (cam.feedVerified !== ok || cam.feedDead !== !ok) {
              cam.feedVerified = ok;
              cam.feedDead = !ok;
              changed = true;
            }
          }
        }

        if (changed && !abortController.signal.aborted) {
          setCameras([...camerasRef.current]);
        }
      }
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        console.error('Traffic cameras fetch error:', err);
        setError(err.message || 'Failed to fetch cameras');
        setIsLoading(false);
      }
    }
  }, [validateFeed]);

  useEffect(() => {
    if (!map || !mapReady || !enabled) {
      setCameras([]);
      camerasRef.current = [];
      return;
    }

    const handleMoveEnd = () => {
      if (selectedCameraRef.current) return;

      const zoom = map.getZoom();
      if (zoom < 9) {
        setCameras([]);
        camerasRef.current = [];
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
