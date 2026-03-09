import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TransitVehicle {
  id: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  route: string;
  vehicleType: 'bus' | 'train' | 'tram';
  agency: string;
  timestamp: number;
}

interface UseBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const useRealtimeVehicles = (
  map: mapboxgl.Map | null,
  mapReady: boolean,
  enabled: boolean
) => {
  const [vehicles, setVehicles] = useState<TransitVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchTimeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastBoundsRef = useRef<UseBounds | null>(null);

  const fetchVehicles = useCallback(async (bounds: UseBounds) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('realtime-vehicles', {
        body: { bounds },
      });

      if (fnError) throw fnError;

      const v = (data?.vehicles || []) as TransitVehicle[];
      setVehicles(v);
      lastBoundsRef.current = bounds;
    } catch (err: any) {
      console.error('Realtime vehicles fetch error:', err);
      setError(err.message || 'Failed to fetch vehicles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentBounds = useCallback((): UseBounds | null => {
    if (!map) return null;
    const b = map.getBounds();
    if (!b) return null;
    return {
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    };
  }, [map]);

  // Fetch on map move + auto-refresh every 15s
  useEffect(() => {
    if (!map || !mapReady || !enabled) {
      setVehicles([]);
      return;
    }

    const handleFetch = () => {
      const zoom = map.getZoom();
      if (zoom < 10) {
        setVehicles([]);
        return;
      }
      const bounds = getCurrentBounds();
      if (!bounds) return;

      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = window.setTimeout(() => fetchVehicles(bounds), 500);
    };

    // Initial fetch
    handleFetch();

    // On map move
    map.on('moveend', handleFetch);

    // Auto-refresh every 15s
    intervalRef.current = window.setInterval(() => {
      const bounds = getCurrentBounds();
      if (bounds && map.getZoom() >= 10) {
        fetchVehicles(bounds);
      }
    }, 15000);

    return () => {
      map.off('moveend', handleFetch);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [map, mapReady, enabled, fetchVehicles, getCurrentBounds]);

  return {
    vehicles,
    isLoading,
    error,
  };
};
