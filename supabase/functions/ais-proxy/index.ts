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
    const { latmin, latmax, lonmin, lonmax } = await req.json();

    const AISHUB_USERNAME = Deno.env.get('AISHUB_USERNAME');
    if (!AISHUB_USERNAME) {
      // Return demo data when no API key configured
      return new Response(JSON.stringify({
        demo: true,
        message: 'AISHub username not configured. Showing demo vessels.',
        vessels: generateDemoVessels(latmin, latmax, lonmin, lonmax),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL('https://data.aishub.net/ws.php');
    url.searchParams.set('username', AISHUB_USERNAME);
    url.searchParams.set('format', '1'); // AIS format
    url.searchParams.set('output', 'json');
    url.searchParams.set('compress', '0'); // no compression for edge fn
    if (latmin != null) url.searchParams.set('latmin', String(latmin));
    if (latmax != null) url.searchParams.set('latmax', String(latmax));
    if (lonmin != null) url.searchParams.set('lonmin', String(lonmin));
    if (lonmax != null) url.searchParams.set('lonmax', String(lonmax));

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`AISHub API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();

    // AISHub returns array: [metadata, vessels[]]
    let vessels: any[] = [];
    if (Array.isArray(data) && data.length >= 2) {
      const meta = data[0];
      if (meta.ERROR === false && Array.isArray(data[1])) {
        vessels = data[1].map((v: any) => ({
          mmsi: v.MMSI,
          name: v.NAME?.trim() || null,
          type: v.TYPE,
          latitude: v.LATITUDE,
          longitude: v.LONGITUDE,
          cog: v.COG, // course over ground (0.1 deg)
          sog: v.SOG, // speed over ground (0.1 knots)
          heading: v.HEADING,
          navstat: v.NAVSTAT,
          imo: v.IMO,
          callsign: v.CALLSIGN?.trim() || null,
          dest: v.DEST?.trim() || null,
          eta: v.ETA,
          draught: v.DRAUGHT,
          a: v.A, b: v.B, c: v.C, d: v.D, // ship dimensions
          time: v.TIME,
        }));
      } else if (meta.ERROR_MESSAGE) {
        return new Response(JSON.stringify({
          error: true,
          message: meta.ERROR_MESSAGE,
          vessels: [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({
      demo: false,
      vessels,
      count: vessels.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('AIS proxy error:', errorMessage);
    return new Response(JSON.stringify({
      error: true,
      message: errorMessage,
      vessels: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Generate demo vessels for when no API key is configured
function generateDemoVessels(latmin: number, latmax: number, lonmin: number, lonmax: number) {
  const vesselNames = [
    'EVER GIVEN', 'MAERSK SEALAND', 'MSC OSCAR', 'COSCO SHIPPING VIRGO',
    'CMA CGM MARCO POLO', 'ATLANTIC STAR', 'PACIFIC VOYAGER', 'NORDIC SPIRIT',
    'OCEAN HARMONY', 'SEA EXPLORER', 'HARBOR MASTER', 'WIND DANCER',
    'DEEP BLUE', 'CORAL PRINCESS', 'IRON WOLF', 'GOLDEN HORIZON'
  ];
  const types = [70, 71, 72, 73, 80, 30, 31, 36, 37, 52, 60]; // cargo, tanker, fishing, tug, passenger
  const count = Math.min(50, Math.floor(Math.random() * 30) + 10);
  const vessels = [];

  for (let i = 0; i < count; i++) {
    const lat = latmin + Math.random() * (latmax - latmin);
    const lon = lonmin + Math.random() * (lonmax - lonmin);
    vessels.push({
      mmsi: 200000000 + Math.floor(Math.random() * 99999999),
      name: vesselNames[Math.floor(Math.random() * vesselNames.length)],
      type: types[Math.floor(Math.random() * types.length)],
      latitude: Math.round(lat * 100000) / 100000,
      longitude: Math.round(lon * 100000) / 100000,
      cog: Math.round(Math.random() * 3600) / 10,
      sog: Math.round(Math.random() * 200) / 10,
      heading: Math.floor(Math.random() * 360),
      navstat: Math.floor(Math.random() * 8),
      imo: 9000000 + Math.floor(Math.random() * 999999),
      callsign: String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                Math.floor(Math.random() * 9999),
      dest: ['ROTTERDAM', 'SINGAPORE', 'SHANGHAI', 'HOUSTON', 'DUBAI', 'YOKOHAMA'][Math.floor(Math.random() * 6)],
      eta: null,
      draught: Math.round(Math.random() * 150) / 10,
      a: 100 + Math.floor(Math.random() * 200),
      b: 30 + Math.floor(Math.random() * 50),
      c: 10 + Math.floor(Math.random() * 20),
      d: 10 + Math.floor(Math.random() * 20),
      time: new Date().toISOString(),
    });
  }
  return vessels;
}
