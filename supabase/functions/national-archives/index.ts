import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type } = await req.json();
    console.log('National Archives search:', { query, type });

    const API_KEY = Deno.env.get('NATIONAL_ARCHIVES_API_KEY');
    if (!API_KEY) {
      throw new Error('NATIONAL_ARCHIVES_API_KEY not configured');
    }

    const BASE_URL = 'https://catalog.archives.gov/api/v2';

    let results: any = {};

    if (type === 'search' || !type) {
      // Search records
      const searchUrl = `${BASE_URL}/records/search?q=${encodeURIComponent(query)}&limit=20&offset=0&apikey=${API_KEY}`;
      console.log('Searching National Archives:', searchUrl);

      const searchRes = await fetch(searchUrl, {
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      });

      const contentType = searchRes.headers.get('content-type') || '';
      const rawText = await searchRes.text();

      if (!searchRes.ok || !contentType.includes('application/json')) {
        console.error('National Archives API error:', searchRes.status, contentType);
        console.error('Response preview:', rawText.substring(0, 300));
        if (rawText.trim().startsWith('<!') || rawText.includes('<html')) {
          throw new Error(`National Archives API returned an HTML error page (status ${searchRes.status}). The API key may be invalid, expired, or the endpoint has changed.`);
        }
        throw new Error(`National Archives API failed with status ${searchRes.status}: ${rawText.substring(0, 200)}`);
      }

      const searchData = JSON.parse(rawText);
      await logApiUsage('national_archives', 'records/search', undefined, 0.0001);

      const items = searchData?.body?.hits?.hits || [];

      results = {
        type: 'search',
        query,
        total: searchData?.body?.hits?.total?.value || 0,
        records: items.slice(0, 12).map((hit: any) => {
          const src = hit._source || {};
          const desc = src.description || {};
          return {
            id: src.naId || hit._id,
            title: desc.title || src.title || 'Untitled Record',
            type: desc.levelOfDescription || src.type || 'Record',
            date: desc.coverageDates?.proposableQualifiableDate || desc.dateNote || null,
            creator: (desc.creatingOrganizations || []).map((o: any) => o.name).filter(Boolean).join(', ') || null,
            description: desc.scopeAndContentNote || desc.generalNote || null,
            series: desc.series?.title || null,
            accessLevel: src.accessLevel || 'public',
            thumbnailUrl: src.digitalObjects?.[0]?.thumbnailUrl || null,
            url: `https://catalog.archives.gov/id/${src.naId || hit._id}`,
          };
        }),
      };
    } else if (type === 'featured') {
      // Return curated featured collections
      const featuredCollections = [
        {
          id: '101',
          title: 'Declaration of Independence',
          type: 'Founding Documents',
          date: '1776',
          creator: 'Continental Congress',
          description: 'The unanimous declaration of the thirteen United States of America.',
          url: 'https://catalog.archives.gov/id/1',
          thumbnailUrl: null,
          accessLevel: 'public',
        },
        {
          id: '102',
          title: 'U.S. Constitution',
          type: 'Founding Documents',
          date: '1787',
          creator: 'Constitutional Convention',
          description: 'The supreme law of the United States of America.',
          url: 'https://catalog.archives.gov/id/1667751',
          thumbnailUrl: null,
          accessLevel: 'public',
        },
        {
          id: '103',
          title: 'Civil War Service Records',
          type: 'Military Records',
          date: '1861–1865',
          creator: 'War Department',
          description: 'Compiled military service records for Union and Confederate soldiers.',
          url: 'https://catalog.archives.gov/search?q=civil+war+service+records',
          thumbnailUrl: null,
          accessLevel: 'public',
        },
        {
          id: '104',
          title: 'Homestead Act Records',
          type: 'Land Records',
          date: '1862–1934',
          creator: 'General Land Office',
          description: 'Records of land grants issued under the Homestead Act.',
          url: 'https://catalog.archives.gov/search?q=homestead+act',
          thumbnailUrl: null,
          accessLevel: 'public',
        },
        {
          id: '105',
          title: 'NASA Historical Records',
          type: 'Scientific Records',
          date: '1958–present',
          creator: 'NASA',
          description: 'Historical documents and photographs from NASA\'s space exploration missions.',
          url: 'https://catalog.archives.gov/search?q=nasa+apollo',
          thumbnailUrl: null,
          accessLevel: 'public',
        },
        {
          id: '106',
          title: 'Ellis Island Immigration Records',
          type: 'Immigration Records',
          date: '1892–1957',
          creator: 'Immigration and Naturalization Service',
          description: 'Arrival records for immigrants who entered the United States through Ellis Island.',
          url: 'https://catalog.archives.gov/search?q=ellis+island',
          thumbnailUrl: null,
          accessLevel: 'public',
        },
      ];

      results = {
        type: 'featured',
        query: 'Featured Collections',
        total: featuredCollections.length,
        records: featuredCollections,
      };
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in national-archives function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
