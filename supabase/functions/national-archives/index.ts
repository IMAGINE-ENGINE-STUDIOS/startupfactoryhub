import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://catalog.archives.gov/api/v2';

async function logApiUsage(serviceName: string, endpoint: string, estimatedCost?: number) {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    await supabaseClient.from('api_usage_logs').insert({
      service_name: serviceName,
      endpoint: endpoint,
      request_count: 1,
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
    'x-api-key': apiKey,
  };
}

async function fetchJson(url: string, apiKey: string): Promise<any> {
  const res = await fetch(url, { headers: getApiHeaders(apiKey) });
  const rawText = await res.text();
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok || !contentType.includes('application/json')) {
    if (rawText.trim().startsWith('<!') || rawText.includes('<html')) {
      throw new Error(`National Archives API returned an HTML error page (status ${res.status}).`);
    }
    throw new Error(`National Archives API failed with status ${res.status}: ${rawText.substring(0, 200)}`);
  }

  return JSON.parse(rawText);
}

function mapRecord(hit: any) {
  // The catalog API v2 nests data differently — handle multiple possible structures
  const src = hit._source || hit.source || hit || {};
  // Primary data lives in src.record for v2 API responses
  const rec = src.record || {};

  console.log('mapRecord src keys:', Object.keys(src).join(', '));
  console.log('mapRecord rec keys:', Object.keys(rec).join(', '));

  // Title
  const title =
    rec.title ||
    src.title ||
    src.description?.title ||
    'Untitled Record';

  // Date
  const date =
    rec.coverageDates?.proposableQualifiableDate ||
    rec.dateNote ||
    src.date ||
    src.coverageDates?.proposableQualifiableDate ||
    src.description?.coverageDates?.proposableQualifiableDate ||
    src.dateNote ||
    src.description?.dateNote ||
    null;

  // Creator
  const creatingOrgs =
    rec.creatingOrganizations ||
    src.creatingOrganizations ||
    src.description?.creatingOrganizations ||
    [];
  const creator = creatingOrgs.map((o: any) => o.name || o).filter(Boolean).join(', ') || null;

  // Description text
  const description =
    rec.scopeAndContentNote ||
    rec.generalNote ||
    src.scopeAndContentNote ||
    src.description?.scopeAndContentNote ||
    src.generalNote ||
    src.description?.generalNote ||
    src.description?.description ||
    null;

  // Level / type
  const type =
    rec.levelOfDescription ||
    src.levelOfDescription ||
    src.description?.levelOfDescription ||
    src.type ||
    'Record';

  // Digital objects
  const rawObjects = rec.digitalObjects || src.digitalObjects || src.description?.digitalObjects || [];
  const digitalObjects = rawObjects.map((obj: any) => ({
    id: obj.objectId || obj.id || String(Math.random()),
    thumbnailUrl: obj.thumbnailUrl || obj.thumbnail || null,
    objectUrl: obj.objectUrl || obj.url || obj.objectFilename || null,
    objectType: obj.objectType || obj.mimeType || 'image',
    title: obj.objectDescription || obj.description || obj.title || null,
  }));

  const naId = rec.naId || src.naId || hit._id || hit.id || '';

  return {
    id: String(naId),
    naId: String(naId),
    title,
    type,
    date,
    creator,
    description,
    series: rec.series?.title || src.series?.title || src.description?.series?.title || null,
    accessLevel: rec.accessLevel || src.accessLevel || 'public',
    thumbnailUrl: digitalObjects[0]?.thumbnailUrl || null,
    digitalObjects,
    url: `https://catalog.archives.gov/id/${naId}`,
    scopeAndContentNote: rec.scopeAndContentNote || src.scopeAndContentNote || src.description?.scopeAndContentNote || null,
    arrangementNote: rec.arrangementNote || src.arrangementNote || src.description?.arrangementNote || null,
    accessRestriction: rec.accessRestriction?.status || src.accessRestriction?.status || src.description?.accessRestriction?.status || null,
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

    // ── SEARCH ───────────────────────────────────────────────────────────────
    if (type === 'search' || !type) {
      const searchUrl = `${BASE_URL}/records/search?q=${encodeURIComponent(query)}&limit=20&offset=0`;
      console.log('Searching:', searchUrl);

      const searchData = await fetchJson(searchUrl, API_KEY);
      const items = searchData?.body?.hits?.hits || [];
      console.log('Search hits count:', items.length);
      if (items.length > 0) {
        console.log('First hit _source keys:', Object.keys(items[0]._source || {}).join(', '));
      }

      await logApiUsage('national_archives', 'records/search');

      results = {
        type: 'search',
        query,
        total: searchData?.body?.hits?.total?.value || 0,
        records: items.slice(0, 12).map(mapRecord),
      };
    }

    // ── FULL RECORD ──────────────────────────────────────────────────────────
    else if (type === 'record') {
      if (!naId) throw new Error('naId is required for type=record');
      console.log('Fetching full record for naId:', naId);

      // Try direct record endpoint first, then fall back to search by naId
      let record: any = null;
      let transcriptions: any[] = [];

      // Try the direct naId search
      const recordUrl = `${BASE_URL}/records/search?naId=${encodeURIComponent(naId)}`;
      console.log('Fetching record:', recordUrl);

      const [recordData, transcriptionData] = await Promise.allSettled([
        fetchJson(recordUrl, API_KEY),
        fetchJson(`${BASE_URL}/transcriptions/naId/${naId}`, API_KEY),
      ]);

      if (recordData.status === 'fulfilled') {
        const hits = recordData.value?.body?.hits?.hits || [];
        console.log('Record hits:', hits.length);
        if (hits.length > 0) {
          console.log('Record _source keys:', Object.keys(hits[0]._source || {}).join(', '));
          console.log('Record _source sample:', JSON.stringify(hits[0]._source).substring(0, 500));
          record = mapRecord(hits[0]);
        }
      } else {
        console.error('Record fetch failed:', recordData.reason);
      }

      if (transcriptionData.status === 'fulfilled') {
        const tData = transcriptionData.value;
        const tItems = tData?.body?.hits?.hits || tData?.transcriptions || [];
        transcriptions = tItems.map((t: any) => ({
          id: t._id || t.id,
          text: t._source?.transcription?.text || t._source?.text || t.text || '',
          contributor: t._source?.transcription?.contributor || t.contributor || null,
          status: t._source?.transcription?.status || t.status || 'completed',
        })).filter((t: any) => t.text);
      }

      await logApiUsage('national_archives', 'records/full');

      results = {
        type: 'record',
        record,
        transcriptions,
        // No children — removed per user request
      };
    }

    // ── FEATURED ─────────────────────────────────────────────────────────────
    else if (type === 'featured') {
      const featuredNaIds = [
        { naId: '1', title: 'Declaration of Independence', category: 'Founding Documents' },
        { naId: '1667751', title: 'U.S. Constitution', category: 'Founding Documents' },
        { naId: '300389', title: 'Emancipation Proclamation', category: 'Historical Documents' },
        { naId: '594975', title: 'WWII Posters Collection', category: 'Military Records' },
        { naId: '17414036', title: 'Apollo 11 Mission Records', category: 'Scientific Records' },
        { naId: '278669', title: 'Civil War Maps', category: 'Military Records' },
      ];

      const fetchPromises = featuredNaIds.map(async ({ naId: fNaId, title, category }) => {
        try {
          const url = `${BASE_URL}/records/search?naId=${encodeURIComponent(fNaId)}`;
          const data = await fetchJson(url, API_KEY);
          const hits = data?.body?.hits?.hits || [];
          if (hits.length > 0) {
            const mapped = mapRecord(hits[0]);
            // Ensure featured items have at minimum the fallback title
            if (!mapped.title || mapped.title === 'Untitled Record') mapped.title = title;
            if (!mapped.type || mapped.type === 'Record') mapped.type = category;
            return mapped;
          }
        } catch (err) {
          console.warn(`Failed to fetch featured naId ${fNaId}:`, err);
        }
        // Fallback stub
        return {
          id: fNaId, naId: fNaId, title, type: category,
          date: null, creator: null, description: null, series: null,
          accessLevel: 'public', thumbnailUrl: null, digitalObjects: [],
          url: `https://catalog.archives.gov/id/${fNaId}`,
        };
      });

      const records = await Promise.all(fetchPromises);
      await logApiUsage('national_archives', 'records/featured');

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
