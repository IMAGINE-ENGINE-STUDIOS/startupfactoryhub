import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://catalog.archives.gov/api/v2';

async function logApiUsage(serviceName: string, endpoint: string, tokensUsed?: number, estimatedCost?: number) {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    await supabaseClient.from('api_usage_logs').insert({
      service_name: serviceName,
      endpoint: endpoint,
      request_count: 1,
      tokens_used: tokensUsed || null,
      estimated_cost: estimatedCost || 0.0001,
      metadata: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    console.error('Failed to log API usage:', err);
  }
}

function getApiHeaders(apiKey: string) {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  };
}

async function fetchJson(url: string, apiKey: string): Promise<any> {
  const res = await fetch(url, { headers: getApiHeaders(apiKey) });
  const contentType = res.headers.get('content-type') || '';
  const rawText = await res.text();

  if (!res.ok || !contentType.includes('application/json')) {
    if (rawText.trim().startsWith('<!') || rawText.includes('<html')) {
      throw new Error(`National Archives API returned an HTML error page (status ${res.status}). The API key may be invalid or expired.`);
    }
    throw new Error(`National Archives API failed with status ${res.status}: ${rawText.substring(0, 200)}`);
  }

  return JSON.parse(rawText);
}

function mapRecord(hit: any) {
  const src = hit._source || {};
  const desc = src.description || {};
  return {
    id: src.naId || hit._id,
    naId: src.naId || hit._id,
    title: desc.title || src.title || 'Untitled Record',
    type: desc.levelOfDescription || src.type || 'Record',
    date: desc.coverageDates?.proposableQualifiableDate || desc.dateNote || null,
    creator: (desc.creatingOrganizations || []).map((o: any) => o.name).filter(Boolean).join(', ') || null,
    description: desc.scopeAndContentNote || desc.generalNote || null,
    series: desc.series?.title || null,
    accessLevel: src.accessLevel || 'public',
    thumbnailUrl: src.digitalObjects?.[0]?.thumbnailUrl || null,
    digitalObjects: (src.digitalObjects || []).map((obj: any) => ({
      id: obj.objectId || obj.id,
      thumbnailUrl: obj.thumbnailUrl || null,
      objectUrl: obj.objectUrl || obj.url || null,
      objectType: obj.objectType || obj.mimeType || 'image',
      title: obj.objectDescription || obj.title || null,
    })),
    url: `https://catalog.archives.gov/id/${src.naId || hit._id}`,
    scopeAndContentNote: desc.scopeAndContentNote || null,
    generalNote: desc.generalNote || null,
    arrangementNote: desc.arrangementNote || null,
    accessRestriction: desc.accessRestriction?.status || null,
    useRestriction: desc.useRestriction?.status || null,
    levelOfDescription: desc.levelOfDescription || null,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type, naId } = await req.json();
    console.log('National Archives request:', { query, type, naId });

    const API_KEY = Deno.env.get('NATIONAL_ARCHIVES_API_KEY');
    if (!API_KEY) {
      throw new Error('NATIONAL_ARCHIVES_API_KEY not configured');
    }

    let results: any = {};

    // ── SEARCH ────────────────────────────────────────────────────────────────
    if (type === 'search' || !type) {
      const searchUrl = `${BASE_URL}/records/search?q=${encodeURIComponent(query)}&limit=20&offset=0`;
      console.log('Searching National Archives:', searchUrl);

      const searchData = await fetchJson(searchUrl, API_KEY);
      await logApiUsage('national_archives', 'records/search', undefined, 0.0001);

      const items = searchData?.body?.hits?.hits || [];

      results = {
        type: 'search',
        query,
        total: searchData?.body?.hits?.total?.value || 0,
        records: items.slice(0, 12).map(mapRecord),
      };
    }

    // ── FULL RECORD ───────────────────────────────────────────────────────────
    else if (type === 'record') {
      if (!naId) throw new Error('naId is required for type=record');

      console.log('Fetching full record for naId:', naId);

      // Fetch record + transcriptions + child records in parallel
      const recordUrl = `${BASE_URL}/records/search?naIds=${naId}`;
      const transcriptionUrl = `${BASE_URL}/transcriptions/naId/${naId}`;
      const childUrl = `${BASE_URL}/records/parentNaId/${naId}?limit=50`;

      const [recordData, transcriptionData, childData] = await Promise.allSettled([
        fetchJson(recordUrl, API_KEY),
        fetchJson(transcriptionUrl, API_KEY),
        fetchJson(childUrl, API_KEY),
      ]);

      await logApiUsage('national_archives', 'records/full', undefined, 0.0003);

      // Parse record
      let record: any = null;
      if (recordData.status === 'fulfilled') {
        const hits = recordData.value?.body?.hits?.hits || [];
        if (hits.length > 0) {
          record = mapRecord(hits[0]);
        }
      }

      // Parse transcriptions
      let transcriptions: any[] = [];
      if (transcriptionData.status === 'fulfilled') {
        const tData = transcriptionData.value;
        const tItems = tData?.body?.hits?.hits || tData?.transcriptions || [];
        transcriptions = tItems.map((t: any) => ({
          id: t._id || t.id,
          text: t._source?.transcription?.text || t.text || t._source?.text || '',
          contributor: t._source?.transcription?.contributor || t.contributor || null,
          status: t._source?.transcription?.status || t.status || 'completed',
        })).filter((t: any) => t.text);
      } else {
        console.warn('Transcriptions fetch failed (may not exist):', transcriptionData.reason);
      }

      // Parse child records (individual pages / objects)
      let children: any[] = [];
      if (childData.status === 'fulfilled') {
        const childHits = childData.value?.body?.hits?.hits || [];
        children = childHits.slice(0, 50).map(mapRecord);
      } else {
        console.warn('Child records fetch failed (may not have children):', childData.reason);
      }

      results = {
        type: 'record',
        record,
        transcriptions,
        children,
      };
    }

    // ── FEATURED ─────────────────────────────────────────────────────────────
    else if (type === 'featured') {
      // Known naIds for famous collections
      const featuredNaIds = [
        { naId: '1', title: 'Declaration of Independence' },
        { naId: '1667751', title: 'U.S. Constitution' },
        { naId: '300389', title: 'Emancipation Proclamation' },
        { naId: '594975', title: 'WWII Posters Collection' },
        { naId: '17414036', title: 'Apollo 11 Mission Records' },
        { naId: '278669', title: 'Civil War Maps' },
      ];

      const fetchPromises = featuredNaIds.map(async ({ naId: fNaId, title }) => {
        try {
          const url = `${BASE_URL}/records/search?naIds=${fNaId}`;
          const data = await fetchJson(url, API_KEY);
          const hits = data?.body?.hits?.hits || [];
          if (hits.length > 0) return mapRecord(hits[0]);
          // Fallback stub if not found
          return {
            id: fNaId, naId: fNaId, title, type: 'Featured Collection',
            date: null, creator: null, description: null, series: null,
            accessLevel: 'public', thumbnailUrl: null, digitalObjects: [],
            url: `https://catalog.archives.gov/id/${fNaId}`,
          };
        } catch {
          return {
            id: fNaId, naId: fNaId, title, type: 'Featured Collection',
            date: null, creator: null, description: null, series: null,
            accessLevel: 'public', thumbnailUrl: null, digitalObjects: [],
            url: `https://catalog.archives.gov/id/${fNaId}`,
          };
        }
      });

      const records = await Promise.all(fetchPromises);
      await logApiUsage('national_archives', 'records/featured', undefined, 0.0006);

      results = {
        type: 'featured',
        query: 'Featured Collections',
        total: records.length,
        records,
      };
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in national-archives function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
