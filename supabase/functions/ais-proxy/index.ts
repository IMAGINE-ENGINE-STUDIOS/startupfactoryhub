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
      // Return demo data when no API key configured
      return new Response(JSON.stringify({
        demo: true,
        message: 'AISStream API key not configured. Showing demo vessels.',
        vessels: generateDemoVessels(latmin, latmax, lonmin, lonmax),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use aisstream.io WebSocket to collect vessels for ~3 seconds
    const vessels = await fetchFromAISStream(
      AISSTREAM_API_KEY,
      latmin, latmax, lonmin, lonmax
    );

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
    const COLLECT_DURATION = 4000; // collect for 4 seconds

    let ws: WebSocket;
    let timeout: ReturnType<typeof setTimeout>;

    try {
      ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
    } catch (err) {
      reject(new Error('Failed to connect to AISStream WebSocket'));
      return;
    }

    const cleanup = () => {
      clearTimeout(timeout);
      try { ws.close(); } catch (_) { /* ignore */ }
    };

    timeout = setTimeout(() => {
      cleanup();
      resolve(Array.from(vessels.values()));
    }, COLLECT_DURATION);

    ws.onopen = () => {
      const subscriptionMessage = {
        Apikey: apiKey,
        BoundingBoxes: [[[latmin, lonmin], [latmax, lonmax]]],
        FilterMessageTypes: ["PositionReport", "ShipStaticData"],
      };
      ws.send(JSON.stringify(subscriptionMessage));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const meta = msg.MetaData;
        if (!meta) return;

        const mmsi = meta.MMSI;
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
            cog: Math.round(pos.Cog * 10),  // store as 0.1 deg units
            sog: Math.round(pos.Sog * 10),  // store as 0.1 knots
            heading: pos.TrueHeading === 511 ? 0 : pos.TrueHeading,
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
        } else if (msg.MessageType === 'ShipStaticData') {
          const sd = msg.Message?.ShipStaticData;
          if (!sd) return;
          vessels.set(mmsi, {
            ...existing,
            mmsi,
            name: sd.Name?.trim() || meta.ShipName?.trim() || existing.name || null,
            type: sd.Type ?? existing.type ?? 0,
            imo: sd.ImoNumber ?? existing.imo ?? 0,
            callsign: sd.CallSign?.trim() || existing.callsign || null,
            dest: sd.Destination?.trim() || existing.dest || null,
            eta: sd.Eta ? `${sd.Eta.Month}/${sd.Eta.Day} ${sd.Eta.Hour}:${sd.Eta.Minute}` : existing.eta || null,
            draught: sd.MaximumStaticDraught ?? existing.draught ?? 0,
            a: sd.Dimension?.A ?? existing.a ?? 0,
            b: sd.Dimension?.B ?? existing.b ?? 0,
            c: sd.Dimension?.C ?? existing.c ?? 0,
            d: sd.Dimension?.D ?? existing.d ?? 0,
            latitude: existing.latitude ?? meta.latitude,
            longitude: existing.longitude ?? meta.longitude,
            cog: existing.cog ?? 0,
            sog: existing.sog ?? 0,
            heading: existing.heading ?? 0,
            navstat: existing.navstat ?? 15,
            time: meta.time_utc || existing.time || new Date().toISOString(),
          });
        }

        // Cap at 200 vessels to keep response reasonable
        if (vessels.size >= 200) {
          cleanup();
          resolve(Array.from(vessels.values()));
        }
      } catch (_) {
        // ignore parse errors
      }
    };

    ws.onerror = (err) => {
      cleanup();
      if (vessels.size > 0) {
        resolve(Array.from(vessels.values()));
      } else {
        reject(new Error('AISStream WebSocket error'));
      }
    };

    ws.onclose = () => {
      clearTimeout(timeout);
      resolve(Array.from(vessels.values()));
    };
  });
}

// Generate demo vessels for when no API key is configured
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
