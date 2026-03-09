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

interface VehicleResult {
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

// Cache per agency for 15 seconds
const cache = new Map<string, { data: VehicleResult[]; time: number }>();
const CACHE_TTL = 15_000;

function getCached(key: string): VehicleResult[] | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key: string, data: VehicleResult[]) {
  cache.set(key, { data, time: Date.now() });
}

// MBTA Boston - JSON feed (no key needed)
async function fetchMBTA(bounds: Bounds): Promise<VehicleResult[]> {
  // Only fetch if bounds overlap Boston area roughly
  if (bounds.south > 43 || bounds.north < 41 || bounds.west > -70 || bounds.east < -72) return [];
  
  const cached = getCached('mbta');
  if (cached) return cached.filter(v => v.lat >= bounds.south && v.lat <= bounds.north && v.lng >= bounds.west && v.lng <= bounds.east);

  try {
    const resp = await fetch(
      'https://cdn.mbta.com/realtime/VehiclePositions.json',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();

    const entities = data?.entity || [];
    const vehicles: VehicleResult[] = [];

    for (const entity of entities) {
      const v = entity?.vehicle;
      if (!v?.position) continue;
      const lat = v.position.latitude;
      const lng = v.position.longitude;
      if (!lat || !lng) continue;

      const routeId = v.trip?.route_id || v.vehicle?.label || 'Unknown';
      // Determine type: CR = commuter rail, Red/Blue/Orange/Green = train, else bus
      const isRail = /^(CR|Red|Blue|Orange|Green|Mattapan)/.test(routeId);

      vehicles.push({
        id: `mbta-${v.vehicle?.id || entity.id}`,
        lat,
        lng,
        heading: v.position.bearing || 0,
        speed: v.position.speed || 0,
        route: routeId,
        vehicleType: isRail ? 'train' : 'bus',
        agency: 'MBTA',
        timestamp: v.timestamp ? v.timestamp * 1000 : Date.now(),
      });
    }

    setCache('mbta', vehicles);
    return vehicles.filter(v => v.lat >= bounds.south && v.lat <= bounds.north && v.lng >= bounds.west && v.lng <= bounds.east);
  } catch (e) {
    console.error('MBTA fetch error:', e);
    return [];
  }
}

// MTA NYC Bus - SIRI JSON feed (public, no key)
async function fetchMTABus(bounds: Bounds): Promise<VehicleResult[]> {
  // Only fetch if bounds overlap NYC area
  if (bounds.south > 41.5 || bounds.north < 40 || bounds.west > -73 || bounds.east < -75) return [];

  const cached = getCached('mta-bus');
  if (cached) return cached.filter(v => v.lat >= bounds.south && v.lat <= bounds.north && v.lng >= bounds.west && v.lng <= bounds.east);

  try {
    // MTA BusTime SIRI endpoint - public
    const resp = await fetch(
      'https://bustime.mta.info/api/siri/vehicle-monitoring.json?key=test&VehicleMonitoringDetailLevel=minimum&MaximumNumberOfCallsOnwards=1',
      { signal: AbortSignal.timeout(10000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();

    const deliveries = data?.Siri?.ServiceDelivery?.VehicleMonitoringDelivery || [];
    const vehicles: VehicleResult[] = [];

    for (const delivery of deliveries) {
      const activities = delivery?.VehicleActivity || [];
      for (const act of activities.slice(0, 200)) {
        const journey = act?.MonitoredVehicleJourney;
        if (!journey?.VehicleLocation) continue;

        const lat = journey.VehicleLocation.Latitude;
        const lng = journey.VehicleLocation.Longitude;
        if (!lat || !lng) continue;

        vehicles.push({
          id: `mta-${journey.VehicleRef || Math.random().toString(36).slice(2)}`,
          lat,
          lng,
          heading: journey.Bearing || 0,
          speed: 0,
          route: journey.PublishedLineName || journey.LineRef || 'Bus',
          vehicleType: 'bus',
          agency: 'MTA NYC',
          timestamp: act.RecordedAtTime ? new Date(act.RecordedAtTime).getTime() : Date.now(),
        });
      }
    }

    setCache('mta-bus', vehicles);
    return vehicles.filter(v => v.lat >= bounds.south && v.lat <= bounds.north && v.lng >= bounds.west && v.lng <= bounds.east);
  } catch (e) {
    console.error('MTA Bus fetch error:', e);
    return [];
  }
}

// LA Metro - GTFS-RT JSON
async function fetchLAMetro(bounds: Bounds): Promise<VehicleResult[]> {
  // Only fetch if bounds overlap LA area
  if (bounds.south > 35 || bounds.north < 33 || bounds.west > -117 || bounds.east < -119) return [];

  const cached = getCached('la-metro');
  if (cached) return cached.filter(v => v.lat >= bounds.south && v.lat <= bounds.north && v.lng >= bounds.west && v.lng <= bounds.east);

  try {
    const resp = await fetch(
      'https://api.metro.net/LACMTA/vehicle_positions/all?format=json',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();

    const entities = data?.entity || data || [];
    const vehicles: VehicleResult[] = [];

    const items = Array.isArray(entities) ? entities : [];
    for (const entity of items.slice(0, 300)) {
      const v = entity?.vehicle || entity;
      const pos = v?.position || v;
      const lat = pos?.latitude || pos?.lat;
      const lng = pos?.longitude || pos?.lng || pos?.lon;
      if (!lat || !lng) continue;

      const routeId = v?.trip?.route_id || v?.route_id || 'Metro';
      const isRail = /^(80[0-9])/.test(routeId); // LA Metro rail routes are 800+

      vehicles.push({
        id: `lam-${v?.vehicle?.id || entity?.id || Math.random().toString(36).slice(2)}`,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        heading: pos?.bearing || 0,
        speed: pos?.speed || 0,
        route: routeId,
        vehicleType: isRail ? 'train' : 'bus',
        agency: 'LA Metro',
        timestamp: v?.timestamp ? v.timestamp * 1000 : Date.now(),
      });
    }

    setCache('la-metro', vehicles);
    return vehicles.filter(v => v.lat >= bounds.south && v.lat <= bounds.north && v.lng >= bounds.west && v.lng <= bounds.east);
  } catch (e) {
    console.error('LA Metro fetch error:', e);
    return [];
  }
}

// SF Muni / BART - 511.org GTFS-RT (public JSON)
async function fetchSFMuni(bounds: Bounds): Promise<VehicleResult[]> {
  // Only fetch if bounds overlap SF Bay Area
  if (bounds.south > 38.5 || bounds.north < 37 || bounds.west > -121 || bounds.east < -123) return [];

  const cached = getCached('sf-muni');
  if (cached) return cached.filter(v => v.lat >= bounds.south && v.lat <= bounds.north && v.lng >= bounds.west && v.lng <= bounds.east);

  try {
    // NextBus/Umo feed for SF Muni - public XML converted to simple positions
    const resp = await fetch(
      'https://retro.umoiq.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni&t=0',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();

    const vehicleList = data?.vehicle || [];
    const vehicles: VehicleResult[] = [];
    const items = Array.isArray(vehicleList) ? vehicleList : [vehicleList];

    for (const v of items) {
      if (!v?.lat || !v?.lon) continue;
      vehicles.push({
        id: `sfm-${v.id || Math.random().toString(36).slice(2)}`,
        lat: parseFloat(v.lat),
        lng: parseFloat(v.lon),
        heading: parseFloat(v.heading) || 0,
        speed: parseFloat(v.speedKmHr) || 0,
        route: v.routeTag || 'Muni',
        vehicleType: /^[JKLMNT]/.test(v.routeTag || '') ? 'tram' : 'bus',
        agency: 'SF Muni',
        timestamp: v.lastTime?.time ? parseInt(v.lastTime.time) : Date.now(),
      });
    }

    setCache('sf-muni', vehicles);
    return vehicles.filter(v => v.lat >= bounds.south && v.lat <= bounds.north && v.lng >= bounds.west && v.lng <= bounds.east);
  } catch (e) {
    console.error('SF Muni fetch error:', e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bounds } = await req.json() as { bounds: Bounds };

    if (!bounds || bounds.north == null || bounds.south == null || bounds.east == null || bounds.west == null) {
      return new Response(
        JSON.stringify({ vehicles: [], error: 'Invalid bounds' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch from all agencies concurrently
    const [mbta, mtaBus, laMetro, sfMuni] = await Promise.allSettled([
      fetchMBTA(bounds),
      fetchMTABus(bounds),
      fetchLAMetro(bounds),
      fetchSFMuni(bounds),
    ]);

    const allVehicles: VehicleResult[] = [
      ...(mbta.status === 'fulfilled' ? mbta.value : []),
      ...(mtaBus.status === 'fulfilled' ? mtaBus.value : []),
      ...(laMetro.status === 'fulfilled' ? laMetro.value : []),
      ...(sfMuni.status === 'fulfilled' ? sfMuni.value : []),
    ];

    return new Response(
      JSON.stringify({ vehicles: allVehicles.slice(0, 500) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Realtime vehicles error:', err);
    return new Response(
      JSON.stringify({ vehicles: [], error: String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
