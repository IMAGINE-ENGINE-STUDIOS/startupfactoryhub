import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrafficSensor {
  id: string;
  lat: number;
  lng: number;
  speed: number;
  flow: number;
  occupancy: number;
  congestion: 'free' | 'light' | 'moderate' | 'heavy' | 'severe';
  source: string;
  roadName: string;
  timestamp: number;
}

interface UseBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const useTrafficSensors = (
  map: mapboxgl.Map | null,
  mapReady: boolean,
  enabled: boolean
) => {
  const [sensors, setSensors] = useState<TrafficSensor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchTimeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const fetchSensors = useCallback(async (bounds: UseBounds) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('traffic-sensors', {
        body: { bounds },
      });
      if (error) throw error;
      setSensors((data?.sensors || []) as TrafficSensor[]);
    } catch (err) {
      console.error('Traffic sensors fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentBounds = useCallback((): UseBounds | null => {
    if (!map) return null;
    const b = map.getBounds();
    if (!b) return null;
    return { north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() };
  }, [map]);

  useEffect(() => {
    if (!map || !mapReady || !enabled) {
      setSensors([]);
      return;
    }

    const handleFetch = () => {
      if (map.getZoom() < 10) { setSensors([]); return; }
      const bounds = getCurrentBounds();
      if (!bounds) return;
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = window.setTimeout(() => fetchSensors(bounds), 600);
    };

    handleFetch();
    map.on('moveend', handleFetch);
    
    // Auto-refresh every 30s
    intervalRef.current = window.setInterval(() => {
      const bounds = getCurrentBounds();
      if (bounds && map.getZoom() >= 10) fetchSensors(bounds);
    }, 30000);

    return () => {
      map.off('moveend', handleFetch);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [map, mapReady, enabled, fetchSensors, getCurrentBounds]);

  return { sensors, isLoading };
};
