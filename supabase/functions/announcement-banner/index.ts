import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { renderAnnouncementBanner } from '../_shared/announcement-banner.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Public: returns the branded 1200x627 announcement banner PNG for a company.
// Used by the RSS feed (LinkedIn auto-posting) and the announcement studio preview.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const companyId = url.searchParams.get('company_id')
    if (!companyId) {
      return new Response(JSON.stringify({ error: 'company_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    )

    const { data: company, error } = await admin
      .from('companies')
      .select('name, description, industry, stage, logo_url')
      .eq('id', companyId)
      .maybeSingle()

    if (error || !company) {
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: template } = await admin
      .from('marketing_templates')
      .select('primary_color, accent_color')
      .eq('type', 'startup_announcement')
      .eq('is_default', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const png = await renderAnnouncementBanner({
      name: company.name || 'New Startup',
      industry: company.industry,
      stage: company.stage,
      tagline: company.description,
      logoUrl: company.logo_url,
      primaryColor: template?.primary_color,
      accentColor: template?.accent_color,
    })

    return new Response(png, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('announcement-banner error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
