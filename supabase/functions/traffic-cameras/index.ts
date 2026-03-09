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

// Cache cameras per state for 60 seconds
const cache = new Map<string, { data: CameraResult[]; time: number }>();
const CACHE_TTL = 60_000;

// Determine which US state feeds to query based on bounds
function getRelevantFeeds(bounds: Bounds): { state: string; url: string }[] {
  const feeds: { state: string; url: string; lat: number; lng: number }[] = [
    // New York - 511NY
    { state: 'NY', url: 'https://511ny.org/api/getevents?format=json&eventType=cameras', lat: 40.7, lng: -74.0 },
    // California - Caltrans (CWWP2)
    { state: 'CA', url: 'https://cwwp2.dot.ca.gov/data/d7/cctv/cctvStatusD07.json', lat: 34.0, lng: -118.2 },
    // Florida - FL511
    { state: 'FL', url: 'https://fl511.com/api/cameras', lat: 28.5, lng: -81.4 },
    // Texas - TxDOT
    { state: 'TX', url: 'https://its.txdot.gov/ITS_WEB/FrontEnd/default.html', lat: 30.3, lng: -97.7 },
  ];

  // Filter feeds whose center is within extended bounds (±5 degrees to catch nearby states)
  return feeds.filter(f =>
    f.lat >= bounds.south - 5 &&
    f.lat <= bounds.north + 5 &&
    f.lng >= bounds.west - 5 &&
    f.lng <= bounds.east + 5
  ).map(f => ({ state: f.state, url: f.url }));
}

// Fetch cameras from 511NY
async function fetchNYCameras(bounds: Bounds): Promise<CameraResult[]> {
  try {
    // Use the NYSDOT open data feed 
    const resp = await fetch(
      'https://511ny.org/api/getcameras?format=json&key=public',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    
    if (!Array.isArray(data)) return [];
    
    return data
      .filter((cam: any) => {
        const lat = parseFloat(cam.Latitude || cam.latitude || 0);
        const lng = parseFloat(cam.Longitude || cam.longitude || 0);
        return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
      })
      .slice(0, 50)
      .map((cam: any) => ({
        id: `ny-${cam.ID || cam.id}`,
        name: cam.Name || cam.name || cam.RoadwayName || 'NY Camera',
        lat: parseFloat(cam.Latitude || cam.latitude),
        lng: parseFloat(cam.Longitude || cam.longitude),
        imageUrl: cam.Url || cam.url || cam.VideoUrl || '',
        source: '511NY',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch (e) {
    console.error('NY cameras error:', e);
    return [];
  }
}

// Fetch cameras from Caltrans District 7 (LA area)
async function fetchCACameras(bounds: Bounds): Promise<CameraResult[]> {
  try {
    const resp = await fetch(
      'https://cwwp2.dot.ca.gov/data/d7/cctv/cctvStatusD07.json',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();

    const cameras = data?.data || data;
    if (!Array.isArray(cameras)) return [];

    return cameras
      .filter((cam: any) => {
        const loc = cam.location || cam.cctv || cam;
        const lat = parseFloat(loc.latitude || loc.lat || 0);
        const lng = parseFloat(loc.longitude || loc.lng || loc.lon || 0);
        return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east && lat !== 0;
      })
      .slice(0, 50)
      .map((cam: any) => {
        const loc = cam.location || cam.cctv || cam;
        return {
          id: `ca-${loc.id || loc.index || Math.random().toString(36).slice(2)}`,
          name: loc.name || loc.description || loc.location?.description || 'CA Camera',
          lat: parseFloat(loc.latitude || loc.lat),
          lng: parseFloat(loc.longitude || loc.lng || loc.lon),
          imageUrl: loc.imageUrl || loc.image?.url || loc.currentImageURL || '',
          source: 'Caltrans',
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch (e) {
    console.error('CA cameras error:', e);
    return [];
  }
}

// Generic fallback: TomTom Traffic Cameras (if available in the area)
// We'll use the open Caltrans feeds across all districts as a broader source
async function fetchCaltransAllDistricts(bounds: Bounds): Promise<CameraResult[]> {
  const districts = ['d1','d2','d3','d4','d5','d6','d7','d8','d9','d10','d11','d12'];
  const results: CameraResult[] = [];
  
  // Only query if bounds overlap California roughly
  if (bounds.east < -130 || bounds.west > -114 || bounds.south > 42 || bounds.north < 32) {
    return [];
  }

  // Try up to 3 districts concurrently
  const relevantDistricts = districts.filter((_, i) => i % 2 === 0).slice(0, 3);
  
  await Promise.allSettled(
    relevantDistricts.map(async (dist) => {
      try {
        const resp = await fetch(
          `https://cwwp2.dot.ca.gov/data/${dist}/cctv/cctvStatus${dist.charAt(0).toUpperCase() + dist.slice(1)}.json`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (!resp.ok) return;
        const data = await resp.json();
        const cameras = data?.data || data;
        if (!Array.isArray(cameras)) return;

        for (const cam of cameras.slice(0, 20)) {
          const loc = cam.location || cam.cctv || cam;
          const lat = parseFloat(loc.latitude || loc.lat || 0);
          const lng = parseFloat(loc.longitude || loc.lng || loc.lon || 0);
          if (lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east && lat !== 0) {
            const imgUrl = loc.imageUrl || loc.image?.url || loc.currentImageURL || '';
            if (imgUrl) {
              results.push({
                id: `ca-${dist}-${loc.id || results.length}`,
                name: loc.name || loc.description || `CA ${dist.toUpperCase()} Camera`,
                lat, lng,
                imageUrl: imgUrl,
                source: `Caltrans ${dist.toUpperCase()}`,
              });
            }
          }
        }
      } catch {
        // skip
      }
    })
  );

  return results.slice(0, 50);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bounds } = await req.json() as { bounds: Bounds };

    if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
      return new Response(
        JSON.stringify({ cameras: [], error: 'Invalid bounds' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Collect cameras from multiple sources concurrently
    const [nyCams, caCams, caAllCams] = await Promise.allSettled([
      fetchNYCameras(bounds),
      fetchCACameras(bounds),
      fetchCaltransAllDistricts(bounds),
    ]);

    const allCameras: CameraResult[] = [
      ...(nyCams.status === 'fulfilled' ? nyCams.value : []),
      ...(caCams.status === 'fulfilled' ? caCams.value : []),
      ...(caAllCams.status === 'fulfilled' ? caAllCams.value : []),
    ];

    // Deduplicate by proximity (within 0.001 degrees ≈ 100m)
    const deduped: CameraResult[] = [];
    for (const cam of allCameras) {
      const isDupe = deduped.some(
        d => Math.abs(d.lat - cam.lat) < 0.001 && Math.abs(d.lng - cam.lng) < 0.001
      );
      if (!isDupe) deduped.push(cam);
    }

    return new Response(
      JSON.stringify({ cameras: deduped.slice(0, 100) }),
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
