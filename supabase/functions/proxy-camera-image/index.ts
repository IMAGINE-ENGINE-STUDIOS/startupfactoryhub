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
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only allow known camera image domains
    const allowed = [
      'images-dim.divas.cloud',
      'cwwp2.dot.ca.gov',
      'www.511virginia.org',
      '511ny.org',
      'fl511.com',
      'images-webcams.windy.com',
      'data.wsdot.wa.gov',
      'tripcheck.com',
      'www.cotrip.org',
      'livetraffic.com',
      'data.highwaysengland.co.uk',
    ];
    
    const urlObj = new URL(url);
    if (!allowed.some(d => urlObj.hostname.endsWith(d))) {
      return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imgResp = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TrafficCameraViewer/1.0)',
        'Accept': 'image/*',
      },
    });

    if (!imgResp.ok) {
      return new Response(JSON.stringify({ error: `Upstream returned ${imgResp.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = imgResp.headers.get('content-type') || 'image/jpeg';
    const body = await imgResp.arrayBuffer();

    return new Response(body, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=10',
      },
    });
  } catch (err) {
    console.error('Proxy image error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
