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

interface CameraResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  imageUrl: string;
  source: string;
}

// Global cache by region key
const cache = new Map<string, { data: CameraResult[]; time: number }>();
const CACHE_TTL = 120_000; // 2 min cache - cameras don't move

function regionKey(bounds: Bounds): string {
  return `${Math.floor(bounds.south)}_${Math.floor(bounds.west)}_${Math.floor(bounds.north)}_${Math.floor(bounds.east)}`;
}

function inBounds(lat: number, lng: number, bounds: Bounds): boolean {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east && lat !== 0 && lng !== 0;
}

// ====== NORTH AMERICA ======

async function fetchNYCameras(bounds: Bounds): Promise<CameraResult[]> {
  try {
    const resp = await fetch('https://511ny.org/api/getcameras?format=json&key=public', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => inBounds(parseFloat(c.Latitude || c.latitude || 0), parseFloat(c.Longitude || c.longitude || 0), bounds))
      .slice(0, 80)
      .map((c: any) => ({
        id: `ny-${c.ID || c.id}`,
        name: c.Name || c.name || c.RoadwayName || 'NY Camera',
        lat: parseFloat(c.Latitude || c.latitude),
        lng: parseFloat(c.Longitude || c.longitude),
        imageUrl: c.Url || c.url || c.VideoUrl || '',
        source: '511NY',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

async function fetchCaltransDistrict(dist: string, bounds: Bounds): Promise<CameraResult[]> {
  try {
    const label = dist.charAt(0).toUpperCase() + dist.slice(1);
    const resp = await fetch(`https://cwwp2.dot.ca.gov/data/${dist}/cctv/cctvStatus${label}.json`, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = data?.data || data;
    if (!Array.isArray(cameras)) return [];
    const results: CameraResult[] = [];
    for (const cam of cameras) {
      const loc = cam.location || cam.cctv || cam;
      const lat = parseFloat(loc.latitude || loc.lat || 0);
      const lng = parseFloat(loc.longitude || loc.lng || loc.lon || 0);
      if (inBounds(lat, lng, bounds)) {
        const imgUrl = loc.imageUrl || loc.image?.url || loc.currentImageURL || '';
        if (imgUrl) {
          results.push({
            id: `ca-${dist}-${loc.id || results.length}`,
            name: loc.name || loc.description || `CA ${dist.toUpperCase()} Camera`,
            lat, lng, imageUrl: imgUrl,
            source: `Caltrans ${dist.toUpperCase()}`,
          });
        }
      }
      if (results.length >= 40) break;
    }
    return results;
  } catch { return []; }
}

async function fetchAllCaltrans(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.east < -130 || bounds.west > -114 || bounds.south > 42 || bounds.north < 32) return [];
  const districts = ['d1','d2','d3','d4','d5','d6','d7','d8','d9','d10','d11','d12'];
  const results: CameraResult[] = [];
  const settled = await Promise.allSettled(districts.map(d => fetchCaltransDistrict(d, bounds)));
  for (const r of settled) {
    if (r.status === 'fulfilled') results.push(...r.value);
  }
  return results.slice(0, 200);
}

// Washington State DOT
async function fetchWSDOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 49 || bounds.north < 45 || bounds.west > -116 || bounds.east < -125) return [];
  try {
    const resp = await fetch('https://data.wsdot.wa.gov/log/Public/cameras.json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => inBounds(c.CameraLocation?.Latitude || 0, c.CameraLocation?.Longitude || 0, bounds))
      .slice(0, 60)
      .map((c: any) => ({
        id: `wa-${c.CameraID}`,
        name: c.Title || c.Description || 'WA Camera',
        lat: c.CameraLocation.Latitude,
        lng: c.CameraLocation.Longitude,
        imageUrl: c.ImageURL || c.ImageUrl || '',
        source: 'WSDOT',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// Oregon DOT - TripCheck
async function fetchODOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 46.5 || bounds.north < 42 || bounds.west > -116 || bounds.east < -125) return [];
  try {
    const resp = await fetch('https://tripcheck.com/Scripts/map/data/cameraData.js', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const text = await resp.text();
    // Parse JS array
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const data = JSON.parse(match[0]);
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => inBounds(c.lat || c.latitude || 0, c.lon || c.lng || c.longitude || 0, bounds))
      .slice(0, 40)
      .map((c: any, i: number) => ({
        id: `or-${c.id || i}`,
        name: c.title || c.name || 'OR Camera',
        lat: c.lat || c.latitude,
        lng: c.lon || c.lng || c.longitude,
        imageUrl: c.imageUrl || c.url || '',
        source: 'ODOT',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// Colorado DOT
async function fetchCDOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 41.5 || bounds.north < 37 || bounds.west > -102 || bounds.east < -109.5) return [];
  try {
    const resp = await fetch('https://www.cotrip.org/speed/getTrafficCameras.do', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = data?.features || data;
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const coords = c.geometry?.coordinates || [];
        return coords.length >= 2 && inBounds(coords[1], coords[0], bounds);
      })
      .slice(0, 40)
      .map((c: any) => ({
        id: `co-${c.properties?.id || c.id || Math.random().toString(36).slice(2)}`,
        name: c.properties?.camera_label || c.properties?.name || 'CO Camera',
        lat: c.geometry.coordinates[1],
        lng: c.geometry.coordinates[0],
        imageUrl: c.properties?.https_url || c.properties?.camera_url || '',
        source: 'CDOT',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// 511 Virginia
async function fetch511VA(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 40 || bounds.north < 36 || bounds.west > -75 || bounds.east < -84) return [];
  try {
    const resp = await fetch('https://www.511virginia.org/data/geojson/icons.cameras.geojson', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const features = data?.features || [];
    return features
      .filter((f: any) => {
        const [lng, lat] = f.geometry?.coordinates || [0, 0];
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 60)
      .map((f: any) => ({
        id: `va-${f.properties?.id || Math.random().toString(36).slice(2)}`,
        name: f.properties?.name || f.properties?.description || 'VA Camera',
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        imageUrl: f.properties?.image_url || f.properties?.url || '',
        source: '511VA',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// Florida DOT - FL511
async function fetchFLDOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 31.5 || bounds.north < 24.3 || bounds.west > -79.5 || bounds.east < -88) return [];
  try {
    // FL511 Open Data GeoJSON endpoint
    const resp = await fetch('https://fl511.com/List/GetData/Cameras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) {
      // Fallback: try the map data endpoint
      const resp2 = await fetch('https://fl511.com/map/mapIcons/Cameras', { signal: AbortSignal.timeout(10000) });
      if (!resp2.ok) return [];
      const data2 = await resp2.json();
      const items = Array.isArray(data2) ? data2 : (data2?.features || data2?.items || []);
      return items
        .filter((c: any) => {
          const lat = c.latitude || c.lat || c.geometry?.coordinates?.[1] || 0;
          const lng = c.longitude || c.lng || c.lon || c.geometry?.coordinates?.[0] || 0;
          return inBounds(lat, lng, bounds);
        })
        .slice(0, 200)
        .map((c: any, i: number) => ({
          id: `fl-${c.id || c.cameraId || i}`,
          name: c.name || c.description || c.roadway || c.title || 'FL Camera',
          lat: c.latitude || c.lat || c.geometry?.coordinates?.[1],
          lng: c.longitude || c.lng || c.lon || c.geometry?.coordinates?.[0],
          imageUrl: c.imageUrl || c.url || c.views?.[0]?.url || '',
          source: 'FL511',
        }))
        .filter((c: CameraResult) => c.imageUrl);
    }
    const data = await resp.json();
    const items = Array.isArray(data) ? data : (data?.features || data?.items || data?.cameras || []);
    return items
      .filter((c: any) => {
        const lat = parseFloat(c.latitude || c.lat || c.Latitude || 0);
        const lng = parseFloat(c.longitude || c.lng || c.lon || c.Longitude || 0);
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 200)
      .map((c: any, i: number) => ({
        id: `fl-${c.id || c.cameraId || c.ID || i}`,
        name: c.name || c.description || c.roadway || c.Name || c.LocationDescription || 'FL Camera',
        lat: parseFloat(c.latitude || c.lat || c.Latitude),
        lng: parseFloat(c.longitude || c.lng || c.lon || c.Longitude),
        imageUrl: c.imageUrl || c.url || c.Url || c.views?.[0]?.url || c.VideoUrl || '',
        source: 'FL511',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch (e) {
    console.error('FL DOT cameras error:', e);
    return [];
  }
}

// Florida Turnpike / SunGuide cameras (additional FDOT districts)
async function fetchFLSunGuide(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 31.5 || bounds.north < 24.3 || bounds.west > -79.5 || bounds.east < -88) return [];
  try {
    // SunGuide District 4 (SE FL - Miami, Fort Lauderdale, Palm Beach)
    const districts = [
      { url: 'https://fl511.com/api/v2/cameras?format=json', label: 'FL511 API' },
    ];
    const allCams: CameraResult[] = [];
    
    for (const d of districts) {
      try {
        const resp = await fetch(d.url, { signal: AbortSignal.timeout(8000) });
        if (!resp.ok) continue;
        const data = await resp.json();
        const cams = Array.isArray(data) ? data : (data?.cameras || data?.features || data?.results || []);
        for (const c of cams) {
          const lat = parseFloat(c.latitude || c.lat || c.Latitude || c.geometry?.coordinates?.[1] || 0);
          const lng = parseFloat(c.longitude || c.lng || c.Longitude || c.geometry?.coordinates?.[0] || 0);
          if (!inBounds(lat, lng, bounds)) continue;
          const imgUrl = c.imageUrl || c.url || c.Url || c.views?.[0]?.url || c.VideoUrl || '';
          if (!imgUrl) continue;
          allCams.push({
            id: `fl-sg-${c.id || c.cameraId || allCams.length}`,
            name: c.name || c.description || c.Name || 'FL SunGuide Camera',
            lat, lng, imageUrl: imgUrl,
            source: d.label,
          });
          if (allCams.length >= 100) break;
        }
      } catch { continue; }
    }
    return allCams;
  } catch { return []; }
}


async function fetch511GA(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 35.5 || bounds.north < 30.5 || bounds.west > -80.5 || bounds.east < -86) return [];
  try {
    const resp = await fetch('https://511ga.org/api/v2/get/cameras', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => inBounds(c.latitude || 0, c.longitude || 0, bounds))
      .slice(0, 60)
      .map((c: any) => ({
        id: `ga-${c.id}`,
        name: c.name || c.location || 'GA Camera',
        lat: c.latitude,
        lng: c.longitude,
        imageUrl: c.image_url || c.url || '',
        source: '511GA',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== EUROPE ======

// UK Highways England
async function fetchUKCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 61 || bounds.north < 49 || bounds.west > 2 || bounds.east < -11) return [];
  try {
    const resp = await fetch('https://data.highwaysengland.co.uk/ntis/NTIS/Camera/content.json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = data?.cameras || data?.features || data;
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const lat = c.latitude || c.lat || c.geometry?.coordinates?.[1] || 0;
        const lng = c.longitude || c.lng || c.geometry?.coordinates?.[0] || 0;
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 60)
      .map((c: any, i: number) => ({
        id: `uk-${c.id || i}`,
        name: c.description || c.name || c.title || 'UK Highway Camera',
        lat: c.latitude || c.lat || c.geometry?.coordinates?.[1],
        lng: c.longitude || c.lng || c.geometry?.coordinates?.[0],
        imageUrl: c.image || c.imageUrl || c.url || '',
        source: 'Highways England',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// Netherlands - Rijkswaterstaat NDW
async function fetchNLCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 54 || bounds.north < 50.5 || bounds.west > 7.5 || bounds.east < 3) return [];
  try {
    const resp = await fetch('https://opendata.ndw.nu/MSt_Camera.json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const features = data?.features || data;
    if (!Array.isArray(features)) return [];
    return features
      .filter((f: any) => {
        const coords = f.geometry?.coordinates || [];
        return coords.length >= 2 && inBounds(coords[1], coords[0], bounds);
      })
      .slice(0, 40)
      .map((f: any) => ({
        id: `nl-${f.properties?.id || Math.random().toString(36).slice(2)}`,
        name: f.properties?.name || f.properties?.description || 'NL Camera',
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        imageUrl: f.properties?.imageUrl || f.properties?.url || '',
        source: 'NDW Netherlands',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== AUSTRALIA ======

async function fetchAUCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > -10 || bounds.north < -44 || bounds.west > 155 || bounds.east < 112) return [];
  try {
    // NSW RMS cameras
    const resp = await fetch('https://www.livetraffic.com/traffic/cameras/geojson', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const features = data?.features || [];
    return features
      .filter((f: any) => {
        const [lng, lat] = f.geometry?.coordinates || [0, 0];
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 60)
      .map((f: any) => ({
        id: `au-${f.properties?.id || Math.random().toString(36).slice(2)}`,
        name: f.properties?.title || f.properties?.name || 'AU Camera',
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        imageUrl: f.properties?.href || f.properties?.imageUrl || '',
        source: 'NSW LiveTraffic',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== FLORIDA CITY-SPECIFIC WINDY CAMERAS (Weather + CCTV) ======
async function fetchFloridaWindyCameras(bounds: Bounds): Promise<CameraResult[]> {
  // Only run if bounds overlap Florida
  if (bounds.south > 31.5 || bounds.north < 24.3 || bounds.west > -79.5 || bounds.east < -88) return [];
  
  const floridaCities = [
    { name: 'Orlando', lat: 28.5383, lng: -81.3792 },
    { name: 'Miami', lat: 25.7617, lng: -80.1918 },
    { name: 'Tampa', lat: 27.9506, lng: -82.4572 },
    { name: 'Naples', lat: 26.1420, lng: -81.7948 },
    { name: 'Cape Coral', lat: 26.5629, lng: -81.9495 },
    { name: 'Fort Lauderdale', lat: 26.1224, lng: -80.1373 },
    { name: 'Jacksonville', lat: 30.3322, lng: -81.6557 },
    { name: 'West Palm Beach', lat: 26.7153, lng: -80.0534 },
    { name: 'Fort Myers', lat: 26.6406, lng: -81.8723 },
    { name: 'Daytona Beach', lat: 29.2108, lng: -81.0228 },
    { name: 'Tallahassee', lat: 30.4383, lng: -84.2807 },
    { name: 'Gainesville', lat: 29.6516, lng: -82.3248 },
    { name: 'Sarasota', lat: 27.3364, lng: -82.5307 },
    { name: 'Lakeland', lat: 28.0395, lng: -81.9498 },
    { name: 'Kissimmee', lat: 28.2920, lng: -81.4076 },
    { name: 'St Petersburg', lat: 27.7676, lng: -82.6403 },
    { name: 'Hollywood FL', lat: 26.0112, lng: -80.1495 },
    { name: 'Pompano Beach', lat: 26.2379, lng: -80.1248 },
    { name: 'Key West', lat: 24.5551, lng: -81.7800 },
  ];
  
  // Filter cities within bounds
  const citiesInBounds = floridaCities.filter(c => inBounds(c.lat, c.lng, bounds));
  if (citiesInBounds.length === 0) return [];
  
  const allCams: CameraResult[] = [];
  const settled = await Promise.allSettled(
    citiesInBounds.map(async (city) => {
      try {
        const resp = await fetch(
          `https://api.windy.com/webcams/api/v3/webcams?lang=en&limit=50&offset=0&nearby=${city.lat},${city.lng},50`,
          {
            headers: { 'x-windy-api-key': 'PGbLONaQtxGGGTZ0NXPEr4BbPtTOqo5f' },
            signal: AbortSignal.timeout(8000),
          }
        );
        if (!resp.ok) return [];
        const data = await resp.json();
        const webcams = data?.webcams || [];
        return webcams
          .filter((w: any) => {
            const lat = w.location?.latitude || w.position?.latitude || 0;
            const lng = w.location?.longitude || w.position?.longitude || 0;
            return inBounds(lat, lng, bounds);
          })
          .map((w: any) => ({
            id: `windy-fl-${w.webcamId || w.id}`,
            name: w.title || `${city.name} Webcam`,
            lat: w.location?.latitude || w.position?.latitude,
            lng: w.location?.longitude || w.position?.longitude,
            imageUrl: w.images?.current?.preview || w.image?.current?.preview || w.images?.daylight?.preview || `https://images-webcams.windy.com/webcams/${w.webcamId || w.id}/current/preview/${w.webcamId || w.id}.jpg`,
            source: `Windy (${city.name}, FL)`,
          }))
          .filter((c: CameraResult) => c.imageUrl);
      } catch { return []; }
    })
  );
  
  for (const r of settled) {
    if (r.status === 'fulfilled') allCams.push(...r.value);
  }
  return allCams.slice(0, 500);
}

// ====== WINDY.COM WEBCAMS - WORLDWIDE ======
async function fetchWindyCameras(bounds: Bounds): Promise<CameraResult[]> {
  try {
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    const radius = Math.min(250, Math.max(10, Math.round(
      Math.max(bounds.north - bounds.south, bounds.east - bounds.west) * 55
    )));
    
    const resp = await fetch(
      `https://api.windy.com/webcams/api/v3/webcams?lang=en&limit=100&offset=0&nearby=${centerLat},${centerLng},${radius}`,
      {
        headers: {
          'x-windy-api-key': 'PGbLONaQtxGGGTZ0NXPEr4BbPtTOqo5f',
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    const webcams = data?.webcams || [];
    
    return webcams
      .filter((w: any) => {
        const lat = w.location?.latitude || w.position?.latitude || 0;
        const lng = w.location?.longitude || w.position?.longitude || 0;
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 100)
      .map((w: any) => ({
        id: `windy-${w.webcamId || w.id}`,
        name: w.title || 'Webcam',
        lat: w.location?.latitude || w.position?.latitude,
        lng: w.location?.longitude || w.position?.longitude,
        imageUrl: w.images?.current?.preview || w.image?.current?.preview || w.images?.daylight?.preview || `https://images-webcams.windy.com/webcams/${w.webcamId || w.id}/current/preview/${w.webcamId || w.id}.jpg`,
        source: `Windy (${w.location?.country || 'Global'})`,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch (e) {
    console.error('Windy cameras error:', e);
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
        JSON.stringify({ cameras: [], error: 'Invalid bounds' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check region cache
    const key = regionKey(bounds);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return new Response(
        JSON.stringify({ cameras: cached.data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch from ALL sources concurrently
    const results = await Promise.allSettled([
      fetchNYCameras(bounds),
      fetchAllCaltrans(bounds),
      fetchWSDOT(bounds),
      fetchODOT(bounds),
      fetchCDOT(bounds),
      fetch511VA(bounds),
      fetch511GA(bounds),
      fetchFLDOT(bounds),
      fetchFLSunGuide(bounds),
      fetchFloridaWindyCameras(bounds),
      fetchUKCameras(bounds),
      fetchNLCameras(bounds),
      fetchAUCameras(bounds),
      fetchWindyCameras(bounds),
    ]);

    const allCameras: CameraResult[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') allCameras.push(...r.value);
    }

    // Deduplicate by proximity (0.0005 degrees ≈ 50m)
    const deduped: CameraResult[] = [];
    for (const cam of allCameras) {
      const isDupe = deduped.some(
        d => Math.abs(d.lat - cam.lat) < 0.0005 && Math.abs(d.lng - cam.lng) < 0.0005
      );
      if (!isDupe) deduped.push(cam);
    }

    const final = deduped.slice(0, 500);
    cache.set(key, { data: final, time: Date.now() });

    return new Response(
      JSON.stringify({ cameras: final }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Traffic cameras error:', err);
    return new Response(
      JSON.stringify({ cameras: [], error: String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
