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
  vehicleType: 'bus' | 'train' | 'tram' | 'taxi';
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

function filterByBounds(vehicles: VehicleResult[], bounds: Bounds): VehicleResult[] {
  return vehicles.filter(v =>
    v.lat >= bounds.south && v.lat <= bounds.north &&
    v.lng >= bounds.west && v.lng <= bounds.east
  );
}

function boundsOverlap(bounds: Bounds, minLat: number, maxLat: number, minLng: number, maxLng: number): boolean {
  return bounds.south <= maxLat && bounds.north >= minLat && bounds.west <= maxLng && bounds.east >= minLng;
}

// ═══════════════════════════════════════════════════
// MBTA Boston
// ═══════════════════════════════════════════════════
async function fetchMBTA(bounds: Bounds): Promise<VehicleResult[]> {
  if (!boundsOverlap(bounds, 41, 43, -72, -70)) return [];
  
  const cached = getCached('mbta');
  if (cached) return filterByBounds(cached, bounds);

  try {
    const resp = await fetch('https://cdn.mbta.com/realtime/VehiclePositions.json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const entities = data?.entity || [];
    const vehicles: VehicleResult[] = [];

    for (const entity of entities) {
      const v = entity?.vehicle;
      if (!v?.position?.latitude) continue;
      const routeId = v.trip?.route_id || v.vehicle?.label || 'Unknown';
      const isRail = /^(CR|Red|Blue|Orange|Green|Mattapan)/.test(routeId);
      vehicles.push({
        id: `mbta-${v.vehicle?.id || entity.id}`,
        lat: v.position.latitude,
        lng: v.position.longitude,
        heading: v.position.bearing || 0,
        speed: v.position.speed || 0,
        route: routeId,
        vehicleType: isRail ? 'train' : 'bus',
        agency: 'MBTA',
        timestamp: v.timestamp ? v.timestamp * 1000 : Date.now(),
      });
    }

    setCache('mbta', vehicles);
    return filterByBounds(vehicles, bounds);
  } catch (e) {
    console.error('MBTA error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// MTA NYC Bus (SIRI)
// ═══════════════════════════════════════════════════
async function fetchMTABus(bounds: Bounds): Promise<VehicleResult[]> {
  if (!boundsOverlap(bounds, 40, 41.5, -75, -73)) return [];
  const cached = getCached('mta-bus');
  if (cached) return filterByBounds(cached, bounds);

  try {
    const resp = await fetch(
      'https://bustime.mta.info/api/siri/vehicle-monitoring.json?key=test&VehicleMonitoringDetailLevel=minimum&MaximumNumberOfCallsOnwards=1',
      { signal: AbortSignal.timeout(10000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    const deliveries = data?.Siri?.ServiceDelivery?.VehicleMonitoringDelivery || [];
    const vehicles: VehicleResult[] = [];

    for (const delivery of deliveries) {
      for (const act of (delivery?.VehicleActivity || []).slice(0, 300)) {
        const j = act?.MonitoredVehicleJourney;
        if (!j?.VehicleLocation?.Latitude) continue;
        vehicles.push({
          id: `mta-${j.VehicleRef || Math.random().toString(36).slice(2)}`,
          lat: j.VehicleLocation.Latitude,
          lng: j.VehicleLocation.Longitude,
          heading: j.Bearing || 0,
          speed: 0,
          route: j.PublishedLineName || j.LineRef || 'Bus',
          vehicleType: 'bus',
          agency: 'MTA NYC',
          timestamp: act.RecordedAtTime ? new Date(act.RecordedAtTime).getTime() : Date.now(),
        });
      }
    }

    setCache('mta-bus', vehicles);
    return filterByBounds(vehicles, bounds);
  } catch (e) {
    console.error('MTA Bus error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// LA Metro
// ═══════════════════════════════════════════════════
async function fetchLAMetro(bounds: Bounds): Promise<VehicleResult[]> {
  if (!boundsOverlap(bounds, 33, 35, -119, -117)) return [];
  const cached = getCached('la-metro');
  if (cached) return filterByBounds(cached, bounds);

  try {
    const resp = await fetch('https://api.metro.net/LACMTA/vehicle_positions/all?format=json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const entities = Array.isArray(data?.entity) ? data.entity : Array.isArray(data) ? data : [];
    const vehicles: VehicleResult[] = [];

    for (const entity of entities.slice(0, 400)) {
      const v = entity?.vehicle || entity;
      const pos = v?.position || v;
      const lat = parseFloat(pos?.latitude || pos?.lat || 0);
      const lng = parseFloat(pos?.longitude || pos?.lng || pos?.lon || 0);
      if (!lat || !lng) continue;
      const routeId = v?.trip?.route_id || v?.route_id || 'Metro';
      vehicles.push({
        id: `lam-${v?.vehicle?.id || entity?.id || Math.random().toString(36).slice(2)}`,
        lat, lng,
        heading: pos?.bearing || 0,
        speed: pos?.speed || 0,
        route: routeId,
        vehicleType: /^80[0-9]/.test(routeId) ? 'train' : 'bus',
        agency: 'LA Metro',
        timestamp: v?.timestamp ? v.timestamp * 1000 : Date.now(),
      });
    }

    setCache('la-metro', vehicles);
    return filterByBounds(vehicles, bounds);
  } catch (e) {
    console.error('LA Metro error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// SF Muni (NextBus/Umo)
// ═══════════════════════════════════════════════════
async function fetchSFMuni(bounds: Bounds): Promise<VehicleResult[]> {
  if (!boundsOverlap(bounds, 37, 38.5, -123, -121)) return [];
  const cached = getCached('sf-muni');
  if (cached) return filterByBounds(cached, bounds);

  try {
    const resp = await fetch('https://retro.umoiq.com/service/publicJSONFeed?command=vehicleLocations&a=sf-muni&t=0', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const vehicleList = data?.vehicle || [];
    const items = Array.isArray(vehicleList) ? vehicleList : [vehicleList];
    const vehicles: VehicleResult[] = [];

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
    return filterByBounds(vehicles, bounds);
  } catch (e) {
    console.error('SF Muni error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// Chicago CTA Bus (XML/JSON)
// ═══════════════════════════════════════════════════
async function fetchChicagoCTA(bounds: Bounds): Promise<VehicleResult[]> {
  if (!boundsOverlap(bounds, 41, 42.5, -88.5, -87)) return [];
  const cached = getCached('cta');
  if (cached) return filterByBounds(cached, bounds);

  try {
    // CTA Bus Tracker API - public endpoint for vehicle positions
    const resp = await fetch('https://www.ctabustracker.com/bustime/api/v2/getvehicles?key=pBq9aREgVtP4CBMZSjmnSWfCe&format=json&rt=22,8,9,77,49,79,66,63,4,X9', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const busList = data?.['bustime-response']?.vehicle || [];
    const vehicles: VehicleResult[] = [];

    for (const bus of busList) {
      if (!bus?.lat || !bus?.lon) continue;
      vehicles.push({
        id: `cta-${bus.vid || Math.random().toString(36).slice(2)}`,
        lat: parseFloat(bus.lat),
        lng: parseFloat(bus.lon),
        heading: parseInt(bus.hdg) || 0,
        speed: 0,
        route: bus.rt || 'CTA',
        vehicleType: 'bus',
        agency: 'CTA Chicago',
        timestamp: Date.now(),
      });
    }

    setCache('cta', vehicles);
    return filterByBounds(vehicles, bounds);
  } catch (e) {
    console.error('CTA Chicago error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// Washington DC Metro (WMATA) - public feed
// ═══════════════════════════════════════════════════
async function fetchWMATA(bounds: Bounds): Promise<VehicleResult[]> {
  if (!boundsOverlap(bounds, 38, 39.5, -78, -76)) return [];
  const cached = getCached('wmata');
  if (cached) return filterByBounds(cached, bounds);

  try {
    const resp = await fetch('https://api.wmata.com/Bus.svc/json/jBusPositions?Lat=38.9&Lon=-77.0&Radius=20000', {
      headers: { 'api_key': 'e13626d03d8e4c03ac07f95541b3091b' }, // WMATA demo key
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const busList = data?.BusPositions || [];
    const vehicles: VehicleResult[] = [];

    for (const bus of busList) {
      if (!bus?.Lat || !bus?.Lon) continue;
      vehicles.push({
        id: `wmata-${bus.VehicleID || Math.random().toString(36).slice(2)}`,
        lat: bus.Lat,
        lng: bus.Lon,
        heading: bus.DirectionNum === '1' ? 0 : 180,
        speed: 0,
        route: bus.RouteID || 'Metro Bus',
        vehicleType: 'bus',
        agency: 'WMATA DC',
        timestamp: bus.DateTime ? new Date(bus.DateTime).getTime() : Date.now(),
      });
    }

    setCache('wmata', vehicles);
    return filterByBounds(vehicles, bounds);
  } catch (e) {
    console.error('WMATA error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// Portland TriMet
// ═══════════════════════════════════════════════════
async function fetchTriMet(bounds: Bounds): Promise<VehicleResult[]> {
  if (!boundsOverlap(bounds, 44.5, 46, -123.5, -122)) return [];
  const cached = getCached('trimet');
  if (cached) return filterByBounds(cached, bounds);

  try {
    const resp = await fetch('https://developer.trimet.org/ws/v2/vehicles?appID=B393B2CE96A258A72BAB481CA', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const vehicleList = data?.resultSet?.vehicle || [];
    const vehicles: VehicleResult[] = [];

    for (const v of vehicleList) {
      if (!v?.latitude || !v?.longitude) continue;
      const isRail = v.type === 'rail' || v.type === 'streetcar';
      vehicles.push({
        id: `trimet-${v.vehicleID || Math.random().toString(36).slice(2)}`,
        lat: v.latitude,
        lng: v.longitude,
        heading: v.bearing || 0,
        speed: v.speed || 0,
        route: v.signMessage || v.routeNumber?.toString() || 'TriMet',
        vehicleType: isRail ? 'tram' : 'bus',
        agency: 'TriMet',
        timestamp: v.time || Date.now(),
      });
    }

    setCache('trimet', vehicles);
    return filterByBounds(vehicles, bounds);
  } catch (e) {
    console.error('TriMet error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// London TfL Bus
// ═══════════════════════════════════════════════════
async function fetchTfLBus(bounds: Bounds): Promise<VehicleResult[]> {
  if (!boundsOverlap(bounds, 51, 52, -1, 1)) return [];
  const cached = getCached('tfl');
  if (cached) return filterByBounds(cached, bounds);

  try {
    // TfL unified API - free, no key required for basic vehicle positions
    const resp = await fetch('https://api.tfl.gov.uk/Vehicle/Mode/bus', { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const vehicles: VehicleResult[] = [];

    if (Array.isArray(data)) {
      for (const v of data.slice(0, 500)) {
        if (!v?.lat || !v?.lon) continue;
        vehicles.push({
          id: `tfl-${v.vehicleId || Math.random().toString(36).slice(2)}`,
          lat: v.lat,
          lng: v.lon,
          heading: v.bearing || 0,
          speed: 0,
          route: v.lineName || v.lineId || 'TfL Bus',
          vehicleType: 'bus',
          agency: 'TfL London',
          timestamp: v.timestamp ? new Date(v.timestamp).getTime() : Date.now(),
        });
      }
    }

    setCache('tfl', vehicles);
    return filterByBounds(vehicles, bounds);
  } catch (e) {
    console.error('TfL error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// Toronto TTC
// ═══════════════════════════════════════════════════
async function fetchTTC(bounds: Bounds): Promise<VehicleResult[]> {
  if (!boundsOverlap(bounds, 43, 44.5, -80, -79)) return [];
  const cached = getCached('ttc');
  if (cached) return filterByBounds(cached, bounds);

  try {
    const resp = await fetch('https://retro.umoiq.com/service/publicJSONFeed?command=vehicleLocations&a=ttc&t=0', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const vehicleList = data?.vehicle || [];
    const items = Array.isArray(vehicleList) ? vehicleList : [vehicleList];
    const vehicles: VehicleResult[] = [];

    for (const v of items) {
      if (!v?.lat || !v?.lon) continue;
      vehicles.push({
        id: `ttc-${v.id || Math.random().toString(36).slice(2)}`,
        lat: parseFloat(v.lat),
        lng: parseFloat(v.lon),
        heading: parseFloat(v.heading) || 0,
        speed: parseFloat(v.speedKmHr) || 0,
        route: v.routeTag || 'TTC',
        vehicleType: /^(5[0-9][0-9])/.test(v.routeTag || '') ? 'tram' : 'bus',
        agency: 'TTC Toronto',
        timestamp: v.lastTime?.time ? parseInt(v.lastTime.time) : Date.now(),
      });
    }

    setCache('ttc', vehicles);
    return filterByBounds(vehicles, bounds);
  } catch (e) {
    console.error('TTC error:', e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// Sydney Buses (Transport NSW)
// ═══════════════════════════════════════════════════
async function fetchSydney(bounds: Bounds): Promise<VehicleResult[]> {
  if (!boundsOverlap(bounds, -34.5, -33, 150, 152)) return [];
  const cached = getCached('sydney');
  if (cached) return filterByBounds(cached, bounds);

  try {
    // Transport NSW open data - GTFS-RT JSON
    const resp = await fetch('https://api.transport.nsw.gov.au/v1/gtfs/vehiclepos/buses', {
      headers: { 'Authorization': 'apikey eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9' }, // public demo key
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const entities = data?.entity || [];
    const vehicles: VehicleResult[] = [];

    for (const entity of entities.slice(0, 300)) {
      const v = entity?.vehicle;
      if (!v?.position?.latitude) continue;
      vehicles.push({
        id: `syd-${v.vehicle?.id || entity.id || Math.random().toString(36).slice(2)}`,
        lat: v.position.latitude,
        lng: v.position.longitude,
        heading: v.position.bearing || 0,
        speed: v.position.speed || 0,
        route: v.trip?.route_id || 'Sydney Bus',
        vehicleType: 'bus',
        agency: 'Sydney',
        timestamp: v.timestamp ? v.timestamp * 1000 : Date.now(),
      });
    }

    setCache('sydney', vehicles);
    return filterByBounds(vehicles, bounds);
  } catch (e) {
    console.error('Sydney error:', e);
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
    const results = await Promise.allSettled([
      fetchMBTA(bounds),
      fetchMTABus(bounds),
      fetchLAMetro(bounds),
      fetchSFMuni(bounds),
      fetchChicagoCTA(bounds),
      fetchWMATA(bounds),
      fetchTriMet(bounds),
      fetchTfLBus(bounds),
      fetchTTC(bounds),
      fetchSydney(bounds),
    ]);

    const allVehicles: VehicleResult[] = [];
    const agencies: string[] = [];
    
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.length > 0) {
        allVehicles.push(...r.value);
        // Track which agencies returned data
        const agencyName = r.value[0]?.agency;
        if (agencyName && !agencies.includes(agencyName)) agencies.push(agencyName);
      }
    }

    return new Response(
      JSON.stringify({ 
        vehicles: allVehicles.slice(0, 1000),
        agencies,
        total: allVehicles.length,
      }),
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
