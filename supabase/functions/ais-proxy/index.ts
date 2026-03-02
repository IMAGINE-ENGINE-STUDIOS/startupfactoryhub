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

    const AISSTREAM_API_KEY = Deno.env.get('AISSTREAM_API_KEY');
    if (!AISSTREAM_API_KEY) {
      return new Response(JSON.stringify({
        demo: true,
        message: 'AISStream API key not configured. Showing demo vessels.',
        vessels: generateDemoVessels(latmin, latmax, lonmin, lonmax),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching AIS data for bbox: ${latmin},${lonmin} to ${latmax},${lonmax}`);

    const vessels = await fetchFromAISStream(
      AISSTREAM_API_KEY,
      latmin, latmax, lonmin, lonmax
    );

    console.log(`Collected ${vessels.length} vessels from AISStream`);

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

async function fetchFromAISStream(
  apiKey: string,
  latmin: number, latmax: number,
  lonmin: number, lonmax: number
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const vessels = new Map<number, any>();
    const COLLECT_DURATION = 6000; // collect for 6 seconds

    let ws: WebSocket;
    let timeout: ReturnType<typeof setTimeout>;
    let connected = false;

    try {
      ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
    } catch (err) {
      console.error('WebSocket creation failed:', err);
      reject(new Error('Failed to connect to AISStream WebSocket'));
      return;
    }

    const cleanup = () => {
      clearTimeout(timeout);
      try { ws.close(); } catch (_) { /* ignore */ }
    };

    timeout = setTimeout(() => {
      console.log(`Timeout reached. Collected ${vessels.size} vessels. Connected: ${connected}`);
      cleanup();
      resolve(Array.from(vessels.values()));
    }, COLLECT_DURATION);

    ws.onopen = () => {
      connected = true;
      console.log('AISStream WebSocket connected');
      // aisstream.io expects BoundingBoxes as array of [[min_lat, min_lon], [max_lat, max_lon]]
      // and the key field as "APIKey" (capital K)
      const subscriptionMessage = {
        Apikey: apiKey,
        BoundingBoxes: [[[latmin, lonmin], [latmax, lonmax]]],
        FilterMessageTypes: ["PositionReport"],
      };
      console.log('Sending subscription:', JSON.stringify(subscriptionMessage));
      ws.send(JSON.stringify(subscriptionMessage));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(typeof event.data === 'string' ? event.data : '{}');
        
        // Check for error responses
        if (msg.ERROR) {
          console.error('AISStream error:', msg.ERROR);
          cleanup();
          reject(new Error(`AISStream error: ${msg.ERROR}`));
          return;
        }

        const meta = msg.MetaData || msg.Metadata;
        if (!meta) return;

        const mmsi = meta.MMSI;
        if (!mmsi) return;
        
        const existing = vessels.get(mmsi) || {};

        if (msg.MessageType === 'PositionReport') {
          const pos = msg.Message?.PositionReport;
          if (!pos) return;
          vessels.set(mmsi, {
            ...existing,
            mmsi,
            name: meta.ShipName?.trim() || existing.name || null,
            type: meta.ShipType ?? existing.type ?? 0,
            latitude: pos.Latitude,
            longitude: pos.Longitude,
            cog: Math.round((pos.Cog ?? 0) * 10),
            sog: Math.round((pos.Sog ?? 0) * 10),
            heading: pos.TrueHeading === 511 ? 0 : (pos.TrueHeading ?? 0),
            navstat: pos.NavigationalStatus ?? 15,
            imo: existing.imo ?? 0,
            callsign: existing.callsign ?? null,
            dest: existing.dest ?? null,
            eta: existing.eta ?? null,
            draught: existing.draught ?? 0,
            a: existing.a ?? 0, b: existing.b ?? 0,
            c: existing.c ?? 0, d: existing.d ?? 0,
            time: meta.time_utc || new Date().toISOString(),
          });
        }

        // Cap at 300 vessels
        if (vessels.size >= 300) {
          console.log('Vessel cap reached (300)');
          cleanup();
          resolve(Array.from(vessels.values()));
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      cleanup();
      if (vessels.size > 0) {
        resolve(Array.from(vessels.values()));
      } else {
        reject(new Error('AISStream WebSocket connection error'));
      }
    };

    ws.onclose = (ev) => {
      console.log(`WebSocket closed: code=${ev.code} reason=${ev.reason}`);
      clearTimeout(timeout);
      resolve(Array.from(vessels.values()));
    };
  });
}

// Demo vessels fallback
function generateDemoVessels(latmin: number, latmax: number, lonmin: number, lonmax: number) {
  const vesselNames = [
    'EVER GIVEN', 'MAERSK SEALAND', 'MSC OSCAR', 'COSCO SHIPPING VIRGO',
    'CMA CGM MARCO POLO', 'ATLANTIC STAR', 'PACIFIC VOYAGER', 'NORDIC SPIRIT',
    'OCEAN HARMONY', 'SEA EXPLORER', 'HARBOR MASTER', 'WIND DANCER',
    'DEEP BLUE', 'CORAL PRINCESS', 'IRON WOLF', 'GOLDEN HORIZON'
  ];
  const types = [70, 71, 72, 73, 80, 30, 31, 36, 37, 52, 60];
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
