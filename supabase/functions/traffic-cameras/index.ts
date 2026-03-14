import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bounds, cursor, limit: reqLimit } = await req.json() as {
      bounds: Bounds;
      cursor?: number;
      limit?: number;
    };

    if (!bounds || bounds.north == null || bounds.south == null || bounds.east == null || bounds.west == null) {
      return new Response(
        JSON.stringify({ cameras: [], error: 'Invalid bounds' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const PAGE_SIZE = reqLimit || 2000;
    const offset = cursor || 0;

    // Query camera_catalog by bounds
    const { data, error, count } = await supabase
      .from('camera_catalog')
      .select('*', { count: 'exact' })
      .gte('lat', bounds.south)
      .lte('lat', bounds.north)
      .gte('lng', bounds.west)
      .lte('lng', bounds.east)
      .order('id')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('DB query error:', error);
      throw new Error(error.message);
    }

    const cameras = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      lat: row.lat,
      lng: row.lng,
      imageUrl: row.image_url,
      source: row.source,
      streamUrl: row.stream_url || undefined,
      refreshRate: row.refresh_rate || 10,
    }));

    const total = count || 0;
    const hasMore = offset + PAGE_SIZE < total;
    const nextCursor = hasMore ? offset + PAGE_SIZE : undefined;

    console.log(`DB query: ${cameras.length} cameras (offset=${offset}, total=${total}) for bounds [${bounds.south.toFixed(1)},${bounds.west.toFixed(1)} → ${bounds.north.toFixed(1)},${bounds.east.toFixed(1)}]`);

    return new Response(
      JSON.stringify({ cameras, total, hasMore, nextCursor }),
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
