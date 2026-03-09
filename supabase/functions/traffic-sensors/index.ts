import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface SensorResult {
  id: string;
  lat: number;
  lng: number;
  speed: number;        // mph or km/h
  flow: number;         // vehicles per hour
  occupancy: number;    // percentage 0-100
  congestion: 'free' | 'light' | 'moderate' | 'heavy' | 'severe';
  source: string;
  roadName: string;
  timestamp: number;
}

const cache = new Map<string, { data: SensorResult[]; time: number }>();
const CACHE_TTL = 30_000; // 30s for sensor data

function getCached(key: string): SensorResult[] | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key: string, data: SensorResult[]) {
  cache.set(key, { data, time: Date.now() });
}

function congestionFromSpeed(speed: number, freeflowSpeed: number): SensorResult['congestion'] {
  const ratio = speed / Math.max(freeflowSpeed, 1);
  if (ratio > 0.85) return 'free';
  if (ratio > 0.65) return 'light';
  if (ratio > 0.45) return 'moderate';
  if (ratio > 0.25) return 'heavy';
  return 'severe';
}

// ═══════════════════════════════════════════════════
// California PeMS (Caltrans Performance Measurement System)
// Real-time freeway sensor data from 40,000+ detectors
// ═══════════════════════════════════════════════════
async function fetchPeMS(bounds: Bounds): Promise<SensorResult[]> {
  // Only if bounds overlap California
  if (bounds.south > 42 || bounds.north < 32 || bounds.west > -114 || bounds.east < -125) return [];
  
  const cached = getCached('pems');
  if (cached) return cached.filter(s => s.lat >= bounds.south && s.lat <= bounds.north && s.lng >= bounds.west && s.lng <= bounds.east);

  try {
    // Caltrans provides district-level real-time data
    const districts = [
      { id: 'd3', lat: 38.5, lng: -121.5, name: 'Sacramento' },
      { id: 'd4', lat: 37.8, lng: -122.3, name: 'Bay Area' },
      { id: 'd7', lat: 34.0, lng: -118.2, name: 'Los Angeles' },
      { id: 'd8', lat: 34.1, lng: -117.3, name: 'San Bernardino' },
      { id: 'd11', lat: 32.7, lng: -117.1, name: 'San Diego' },
      { id: 'd12', lat: 33.7, lng: -117.8, name: 'Orange County' },
    ];

    const relevantDistricts = districts.filter(d =>
      d.lat >= bounds.south - 2 && d.lat <= bounds.north + 2 &&
      d.lng >= bounds.west - 2 && d.lng <= bounds.east + 2
    ).slice(0, 3);

    const sensors: SensorResult[] = [];

    await Promise.allSettled(
      relevantDistricts.map(async (dist) => {
        try {
          const resp = await fetch(
            `https://cwwp2.dot.ca.gov/data/${dist.id}/lcs/lcsStatusD${dist.id.replace('d', '')}.json`,
            { signal: AbortSignal.timeout(6000) }
          );
          if (!resp.ok) return;
          const data = await resp.json();
          const detectors = data?.data || data;
          if (!Array.isArray(detectors)) return;

          for (const det of detectors.slice(0, 100)) {
            const loc = det?.location || det;
            const lat = parseFloat(loc?.latitude || loc?.lat || 0);
            const lng = parseFloat(loc?.longitude || loc?.lng || loc?.lon || 0);
            if (!lat || !lng) continue;

            const speed = parseFloat(det?.speed || det?.averageSpeed || 0);
            const flow = parseFloat(det?.flow || det?.volume || 0);
            const occ = parseFloat(det?.occupancy || 0);
            
            sensors.push({
              id: `pems-${dist.id}-${det?.id || sensors.length}`,
              lat, lng,
              speed,
              flow,
              occupancy: occ,
              congestion: congestionFromSpeed(speed, 65),
              source: `PeMS ${dist.name}`,
              roadName: loc?.name || loc?.freeway || `${dist.name} Freeway`,
              timestamp: Date.now(),
            });
          }
        } catch { /* skip district */ }
      })
    );

    setCache('pems', sensors);
    return sensors.filter(s => s.lat >= bounds.south && s.lat <= bounds.north && s.lng >= bounds.west && s.lng <= bounds.east);
  } catch (e) {
    console.error('PeMS error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// NYC DOT Traffic Sensors
// Real-time speed data from Manhattan, Brooklyn, etc.
// ═══════════════════════════════════════════════════
async function fetchNYCDOT(bounds: Bounds): Promise<SensorResult[]> {
  if (bounds.south > 41 || bounds.north < 40 || bounds.west > -73 || bounds.east < -75) return [];

  const cached = getCached('nycdot');
  if (cached) return cached.filter(s => s.lat >= bounds.south && s.lat <= bounds.north && s.lng >= bounds.west && s.lng <= bounds.east);

  try {
    // NYC Real-Time Traffic Speed Data (Socrata API)
    const resp = await fetch(
      'https://data.cityofnewyork.us/resource/i4gi-tjb9.json?$limit=200&$order=data_as_of DESC',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    const sensors: SensorResult[] = [];

    for (const row of data) {
      // NYC speed data has link_id with encoded lat/lng
      const speed = parseFloat(row?.speed || 0);
      const linkName = row?.link_name || row?.encoded_poly_line_lvl || '';
      // Use approximate coordinates from link points
      const lat = parseFloat(row?.link_points?.split(' ')?.[0] || 0);
      const lng = parseFloat(row?.link_points?.split(' ')?.[1] || 0);
      
      if (!lat || !lng) continue;
      
      sensors.push({
        id: `nyc-${row?.id || sensors.length}`,
        lat, lng,
        speed,
        flow: parseInt(row?.travel_time || '0') || 0,
        occupancy: 0,
        congestion: congestionFromSpeed(speed, 30),
        source: 'NYC DOT',
        roadName: linkName || 'NYC Road',
        timestamp: row?.data_as_of ? new Date(row.data_as_of).getTime() : Date.now(),
      });
    }

    setCache('nycdot', sensors);
    return sensors.filter(s => s.lat >= bounds.south && s.lat <= bounds.north && s.lng >= bounds.west && s.lng <= bounds.east);
  } catch (e) {
    console.error('NYC DOT error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// Seattle DOT Traffic Flow
// ═══════════════════════════════════════════════════
async function fetchSeattleDOT(bounds: Bounds): Promise<SensorResult[]> {
  if (bounds.south > 48 || bounds.north < 47 || bounds.west > -121 || bounds.east < -123) return [];

  const cached = getCached('seattle');
  if (cached) return cached.filter(s => s.lat >= bounds.south && s.lat <= bounds.north && s.lng >= bounds.west && s.lng <= bounds.east);

  try {
    const resp = await fetch(
      'https://data.seattle.gov/resource/7svg-ds5z.json?$limit=200',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    const sensors: SensorResult[] = [];

    for (const row of data) {
      const lat = parseFloat(row?.latitude || 0);
      const lng = parseFloat(row?.longitude || 0);
      if (!lat || !lng) continue;

      const flow = parseInt(row?.volume || row?.adt || '0') || 0;
      const speed = parseFloat(row?.speed || row?.avg_speed || '0') || 0;
      
      sensors.push({
        id: `sea-${row?.stdy_id || row?.objectid || sensors.length}`,
        lat, lng,
        speed,
        flow,
        occupancy: 0,
        congestion: speed > 0 ? congestionFromSpeed(speed, 35) : (flow > 2000 ? 'heavy' : flow > 1000 ? 'moderate' : 'free'),
        source: 'Seattle DOT',
        roadName: row?.stname || row?.street || 'Seattle Road',
        timestamp: Date.now(),
      });
    }

    setCache('seattle', sensors);
    return sensors.filter(s => s.lat >= bounds.south && s.lat <= bounds.north && s.lng >= bounds.west && s.lng <= bounds.east);
  } catch (e) {
    console.error('Seattle DOT error:', e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bounds } = await req.json() as { bounds: Bounds };

    if (!bounds || bounds.north == null || bounds.south == null) {
      return new Response(
        JSON.stringify({ sensors: [], error: 'Invalid bounds' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [pems, nycdot, seattle] = await Promise.allSettled([
      fetchPeMS(bounds),
      fetchNYCDOT(bounds),
      fetchSeattleDOT(bounds),
    ]);

    const allSensors: SensorResult[] = [
      ...(pems.status === 'fulfilled' ? pems.value : []),
      ...(nycdot.status === 'fulfilled' ? nycdot.value : []),
      ...(seattle.status === 'fulfilled' ? seattle.value : []),
    ];

    return new Response(
      JSON.stringify({ sensors: allSensors.slice(0, 500) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Traffic sensors error:', err);
    return new Response(
      JSON.stringify({ sensors: [], error: String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
