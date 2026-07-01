// firms-data: proxy NASA FIRMS Active Fires CSV → GeoJSON (keeps MAP_KEY server-side)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const MAP_KEY = Deno.env.get('FIRMS_MAP_KEY');

// Predefined bounding boxes: west,south,east,north
const REGIONS: Record<string, string> = {
  world: '-180,-60,180,75',
  americas: '-170,-56,-30,72',
  europe: '-25,34,45,72',
  africa: '-20,-35,55,38',
  seasia: '60,-11,150,55',
  oceania: '110,-50,180,0',
};

// Available NRT sources (all 375m or 1km NRT products)
const SOURCES = new Set([
  'VIIRS_SNPP_NRT',
  'VIIRS_NOAA20_NRT',
  'VIIRS_NOAA21_NRT',
  'MODIS_NRT',
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!MAP_KEY) {
      return new Response(JSON.stringify({ error: 'FIRMS_MAP_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const url = new URL(req.url);
    const region = (url.searchParams.get('region') || 'world').toLowerCase();
    const daysRaw = parseInt(url.searchParams.get('days') || '1', 10);
    const days = Math.min(Math.max(isFinite(daysRaw) ? daysRaw : 1, 1), 10);
    const source = url.searchParams.get('source') || 'VIIRS_SNPP_NRT';
    if (!SOURCES.has(source)) {
      return new Response(JSON.stringify({ error: `Unknown source ${source}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const area = REGIONS[region] || REGIONS.world;

    const firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${MAP_KEY}/${source}/${area}/${days}`;
    const res = await fetch(firmsUrl, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: `FIRMS ${res.status}: ${t.slice(0, 200)}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const csv = await res.text();
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      return new Response(JSON.stringify({ type: 'FeatureCollection', features: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
      });
    }
    const header = lines[0].split(',').map(h => h.trim());
    const idx = (k: string) => header.indexOf(k);
    const iLat = idx('latitude');
    const iLon = idx('longitude');
    const iFrp = idx('frp');
    const iBright = idx('bright_ti4') !== -1 ? idx('bright_ti4') : idx('brightness');
    const iConf = idx('confidence');
    const iAcqDate = idx('acq_date');
    const iAcqTime = idx('acq_time');
    const iDayNight = idx('daynight');

    const features: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const lat = parseFloat(cols[iLat]);
      const lon = parseFloat(cols[iLon]);
      if (!isFinite(lat) || !isFinite(lon)) continue;
      const frp = iFrp >= 0 ? parseFloat(cols[iFrp]) : 0;
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: {
          frp: isFinite(frp) ? frp : 0,
          bright: iBright >= 0 ? parseFloat(cols[iBright]) : null,
          confidence: iConf >= 0 ? cols[iConf] : null,
          acq_date: iAcqDate >= 0 ? cols[iAcqDate] : null,
          acq_time: iAcqTime >= 0 ? cols[iAcqTime] : null,
          daynight: iDayNight >= 0 ? cols[iDayNight] : null,
        },
      });
    }

    return new Response(JSON.stringify({
      type: 'FeatureCollection',
      features,
      meta: { source, region, days, count: features.length, fetched_at: new Date().toISOString() },
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=600',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
