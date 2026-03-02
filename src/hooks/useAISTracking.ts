import { useState, useCallback, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '@/integrations/supabase/client';

export interface AISVessel {
  mmsi: number;
  name: string | null;
  type: number;
  latitude: number;
  longitude: number;
  cog: number;     // course over ground (degrees)
  sog: number;     // speed over ground (knots)
  heading: number;
  navstat: number;
  imo: number;
  callsign: string | null;
  dest: string | null;
  eta: string | null;
  draught: number;
  a: number; b: number; c: number; d: number;
  time: string;
}

export interface AISTrackPoint {
  lat: number;
  lng: number;
  time: string;
  sog: number;
  cog: number;
}

export type VesselTypeFilter = 'all' | 'cargo' | 'tanker' | 'passenger' | 'fishing' | 'tug' | 'other';

export interface AISFilters {
  vesselType: VesselTypeFilter;
  minSpeed: number;
  maxSpeed: number;
  onlyInAOI: boolean;
}

// AIS Ship Type classification
export const VESSEL_TYPE_RANGES: Record<VesselTypeFilter, number[]> = {
  all: [],
  cargo: [70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
  tanker: [80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
  passenger: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
  fishing: [30],
  tug: [31, 32, 52],
  other: [], // anything not in the above
};

export const VESSEL_TYPE_LABELS: Record<number, string> = {
  0: 'Not available',
  20: 'Wing in ground',
  30: 'Fishing', 31: 'Towing', 32: 'Towing (large)',
  33: 'Dredging', 34: 'Diving ops', 35: 'Military',
  36: 'Sailing', 37: 'Pleasure craft',
  40: 'HSC', 50: 'Pilot vessel', 51: 'SAR', 52: 'Tug',
  53: 'Port tender', 54: 'Anti-pollution', 55: 'Law enforcement',
  60: 'Passenger', 70: 'Cargo', 80: 'Tanker',
  90: 'Other',
};

export const NAV_STATUS_LABELS: Record<number, string> = {
  0: 'Under way (engine)', 1: 'At anchor', 2: 'Not under command',
  3: 'Restricted maneuverability', 4: 'Constrained by draught',
  5: 'Moored', 6: 'Aground', 7: 'Engaged in fishing',
  8: 'Under way (sailing)', 14: 'AIS-SART active', 15: 'Not defined',
};

export function getVesselTypeLabel(type: number): string {
  if (VESSEL_TYPE_LABELS[type]) return VESSEL_TYPE_LABELS[type];
  const decade = Math.floor(type / 10) * 10;
  if (VESSEL_TYPE_LABELS[decade]) return VESSEL_TYPE_LABELS[decade];
  return 'Unknown';
}

export function getVesselTypeCategory(type: number): VesselTypeFilter {
  for (const [cat, range] of Object.entries(VESSEL_TYPE_RANGES)) {
    if (cat === 'all' || cat === 'other') continue;
    if (range.includes(type)) return cat as VesselTypeFilter;
  }
  return 'other';
}

export function getVesselColor(type: number): string {
  const cat = getVesselTypeCategory(type);
  switch (cat) {
    case 'cargo': return '#3b82f6';
    case 'tanker': return '#ef4444';
    case 'passenger': return '#8b5cf6';
    case 'fishing': return '#10b981';
    case 'tug': return '#f59e0b';
    default: return '#6b7280';
  }
}

const TRACK_BUFFER_SIZE = 20; // last N positions per vessel
const MIN_FETCH_INTERVAL = 60_000; // 60 seconds (AISHub rate limit)
const MIN_ZOOM_FOR_AIS = 4; // Minimum zoom level to fetch AIS data

export const useAISTracking = (map: mapboxgl.Map | null, mapReady: boolean) => {
  const [vessels, setVessels] = useState<AISVessel[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60); // seconds
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<AISVessel | null>(null);
  const [filters, setFilters] = useState<AISFilters>({
    vesselType: 'all',
    minSpeed: 0,
    maxSpeed: 50,
    onlyInAOI: false,
  });

  // Track history buffer per MMSI
  const trackBuffer = useRef<Map<number, AISTrackPoint[]>>(new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchVessels = useCallback(async () => {
    if (!map || !isEnabled) return;

    // Zoom guard - don't fetch at low zoom levels
    const zoom = map.getZoom();
    if (zoom < MIN_ZOOM_FOR_AIS) {
      setError('Zoom in to see vessel data. Current area is too large for AIS tracking.');
      setVessels([]);
      return;
    }

    const bounds = map.getBounds();
    if (!bounds) return;

    setIsRefreshing(true);
    setError(null);

    try {
      // Clamp bounds on client side too
      const latmin = Math.max(-90, Math.min(90, bounds.getSouth()));
      const latmax = Math.max(-90, Math.min(90, bounds.getNorth()));
      const lonmin = Math.max(-180, Math.min(180, bounds.getWest()));
      const lonmax = Math.max(-180, Math.min(180, bounds.getEast()));

      const { data, error: fnError } = await supabase.functions.invoke('ais-proxy', {
        body: { latmin, latmax, lonmin, lonmax },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) {
        setError(data.message || 'AIS service error');
        setVessels([]);
        return;
      }

      const newVessels: AISVessel[] = data?.vessels || [];

      if (newVessels.length === 0) {
        setError('No vessels found in this area. Try zooming into a port or shipping lane.');
      }

      // Update track buffers
      newVessels.forEach(v => {
        const existing = trackBuffer.current.get(v.mmsi) || [];
        existing.push({
          lat: v.latitude,
          lng: v.longitude,
          time: v.time,
          sog: v.sog,
          cog: v.cog,
        });
        if (existing.length > TRACK_BUFFER_SIZE) {
          existing.splice(0, existing.length - TRACK_BUFFER_SIZE);
        }
        trackBuffer.current.set(v.mmsi, existing);
      });

      setVessels(newVessels);
      setLastFetch(new Date());
    } catch (err: any) {
      console.error('AIS fetch error:', err);
      setError(err.message || 'Failed to fetch AIS data');
    } finally {
      setIsRefreshing(false);
    }
  }, [map, isEnabled]);

  // Auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isEnabled || !autoRefresh) return;

    const ms = Math.max(refreshInterval * 1000, MIN_FETCH_INTERVAL);
    intervalRef.current = setInterval(fetchVessels, ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isEnabled, autoRefresh, refreshInterval, fetchVessels]);

  // Initial fetch when enabled
  useEffect(() => {
    if (isEnabled && map && mapReady) {
      fetchVessels();
    }
    if (!isEnabled) {
      setVessels([]);
      setSelectedVessel(null);
      setError(null);
    }
  }, [isEnabled, mapReady]);

  // Debounced fetch on map move
  useEffect(() => {
    if (!map || !isEnabled || !mapReady) return;

    const onMoveEnd = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchVessels, 2000);
    };

    map.on('moveend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [map, isEnabled, mapReady, fetchVessels]);

  // Apply filters
  const filteredVessels = vessels.filter(v => {
    if (filters.vesselType !== 'all') {
      const cat = getVesselTypeCategory(v.type);
      if (cat !== filters.vesselType) return false;
    }
    const speedKnots = v.sog / 10;
    if (speedKnots < filters.minSpeed || speedKnots > filters.maxSpeed) return false;
    return true;
  });

  const getTrackHistory = useCallback((mmsi: number): AISTrackPoint[] => {
    return trackBuffer.current.get(mmsi) || [];
  }, []);

  const toggle = useCallback(() => setIsEnabled(prev => !prev), []);

  return {
    vessels: filteredVessels,
    allVesselsCount: vessels.length,
    isEnabled,
    isRefreshing,
    autoRefresh,
    refreshInterval,
    lastFetch,
    error,
    selectedVessel,
    filters,
    toggle,
    setAutoRefresh,
    setRefreshInterval,
    setFilters,
    setSelectedVessel,
    fetchVessels,
    getTrackHistory,
  };
};
