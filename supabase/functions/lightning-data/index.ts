import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch recent lightning strikes from Blitzortung's public GeoJSON endpoint
    // This endpoint returns strikes from the last ~20 minutes
    const strikes: any[] = [];

    // Blitzortung provides data split by time periods (0-20 minutes ago)
    // We fetch multiple time slices for coverage
    const timeSlices = ['00', '03', '05', '07'];
    
    const fetchPromises = timeSlices.map(async (slice) => {
      try {
        const url = `https://map.blitzortung.org/GEOjson/getjson.php?f=s&n=${slice}`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://map.blitzortung.org/',
          },
        });
        if (!res.ok) return [];
        const text = await res.text();
        if (!text || text.length < 5) return [];
        const data = JSON.parse(text);
        return data || [];
      } catch {
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    
    // Blitzortung returns arrays of [time, lat, lon, ...] or objects
    // Convert to GeoJSON features
    const features: any[] = [];
    const now = Date.now();
    
    for (let sliceIdx = 0; sliceIdx < results.length; sliceIdx++) {
      const data = results[sliceIdx];
      if (!Array.isArray(data)) continue;
      
      for (const strike of data) {
        // Format: [lon, lat, time, region, ...] or {time, lat, lon}
        let lat: number, lon: number, time: number;
        
        if (Array.isArray(strike)) {
          if (strike.length < 3) continue;
          lon = strike[0];
          lat = strike[1];
          const parsedTime = Date.parse(strike[2]);
          time = Number.isNaN(parsedTime) ? 0 : parsedTime;
        } else if (strike && typeof strike === 'object') {
          lat = strike.lat;
          lon = strike.lon;
          time = strike.time || 0;
        } else continue;

        if (typeof lat !== 'number' || typeof lon !== 'number') continue;
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;

        // Age in minutes (time may be ISO string-derived ms, nanoseconds, or seconds)
        const timeMs = time > 1e15 ? time / 1e6 : time > 1e12 ? time : time * 1000;
        const ageMinutes = Math.max(0, (now - timeMs) / 60000);

        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lon, lat] },
          properties: {
            age: Math.round(ageMinutes),
            slice: sliceIdx,
          },
        });
      }
    }

    const geojson = {
      type: 'FeatureCollection',
      features,
    };

    console.log(`Lightning data: ${features.length} strikes from ${timeSlices.length} slices`);

    return new Response(JSON.stringify(geojson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Lightning data error:', error);
    // Return empty collection on error so the map doesn't break
    return new Response(JSON.stringify({
      type: 'FeatureCollection',
      features: [],
      error: String(error),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
