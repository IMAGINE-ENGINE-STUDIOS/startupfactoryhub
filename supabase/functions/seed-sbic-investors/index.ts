import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch JSON from the published static asset
    const dataUrl = new URL(req.url).searchParams.get('dataUrl')
      ?? 'https://startupfactoryhub.lovable.app/sbic-investors.json';

    const res = await fetch(dataUrl);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Fetch failed: ${res.status}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const rows = await res.json();

    // Check existing count to avoid duplicates
    const { count } = await supabase
      .from('directory_investors')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'SBIC');

    if ((count ?? 0) > 0) {
      return new Response(JSON.stringify({ skipped: true, existing: count }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert in chunks of 100
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase.from('directory_investors').insert(chunk);
      if (error) {
        return new Response(JSON.stringify({ error: error.message, inserted }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      inserted += chunk.length;
    }

    return new Response(JSON.stringify({ inserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
