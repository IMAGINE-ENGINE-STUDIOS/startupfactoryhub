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
        error: true,
        message: 'AISStream API key not configured. Please add the AISSTREAM_API_KEY secret.',
        vessels: [],
      }), {
        status: 500,
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
      const subscriptionMessage = {
        APIKey: apiKey,
        BoundingBoxes: [[[latmin, lonmin], [latmax, lonmax]]],
        FilterMessageTypes: ["PositionReport"],
      };
      console.log('Sending subscription:', JSON.stringify(subscriptionMessage));
      ws.send(JSON.stringify(subscriptionMessage));
    };

    ws.onmessage = async (event) => {
      try {
        let raw: string;
        if (typeof event.data === 'string') {
          raw = event.data;
        } else if (event.data instanceof Blob) {
          raw = await event.data.text();
        } else if (event.data instanceof ArrayBuffer) {
          raw = new TextDecoder().decode(event.data);
        } else {
          raw = String(event.data);
        }
        
        if (!raw || raw.length === 0) return;
        
        const msg = JSON.parse(raw);
        if (msg.ERROR || msg.error) {
          console.error('AISStream error:', msg.ERROR || msg.error);
          cleanup();
          reject(new Error(`AISStream error: ${msg.ERROR || msg.error}`));
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
