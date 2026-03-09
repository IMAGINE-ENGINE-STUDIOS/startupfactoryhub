import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Allowed camera image domain patterns (matched via endsWith)
const ALLOWED_DOMAINS = [
  'images-dim.divas.cloud',
  'cwwp2.dot.ca.gov',
  'www.511virginia.org',
  '511ny.org',
  // Florida DOT domains
  'fl511.com',
  'fl-cameras.com',
  'fdot.gov',
  'arcgis.com',
  'arcgisonline.com',
  'services.arcgis.com',
  // Windy webcam domains
  'images-webcams.windy.com',
  'webcams.windy.com',
  'windy.com',
  // Other DOTs
  'data.wsdot.wa.gov',
  'wsdot.wa.gov',
  'tripcheck.com',
  'www.cotrip.org',
  'cotrip.org',
  'livetraffic.com',
  'data.highwaysengland.co.uk',
  'highwaysengland.co.uk',
  '511ga.org',
  // Common camera CDNs
  'amazonaws.com',
  'cloudfront.net',
  'akamaized.net',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Support both GET (img src) and POST
    let imageUrl: string | null = null;
    
    if (req.method === 'GET') {
      const params = new URL(req.url).searchParams;
      imageUrl = params.get('url');
    } else {
      const body = await req.json();
      imageUrl = body.url;
    }
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const urlObj = new URL(imageUrl);
    if (!ALLOWED_DOMAINS.some(d => urlObj.hostname.endsWith(d))) {
      return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imgResp = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TrafficCameraViewer/1.0)',
        'Accept': 'image/*',
      },
    });

    if (!imgResp.ok) {
      return new Response(JSON.stringify({ error: `Upstream ${imgResp.status}` }), {
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
