import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const LINKEDIN_CLIENT_ID = Deno.env.get('LINKEDIN_CLIENT_ID')
    if (!LINKEDIN_CLIENT_ID) throw new Error('LINKEDIN_CLIENT_ID not configured')

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }
    const userId = claimsData.claims.sub

    // Verify admin
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: corsHeaders })
    }

    const { action, org_urn, scopes: requestedScopes, origin } = await req.json()

    // Scopes this LinkedIn app is approved for. Anything outside this list
    // makes LinkedIn reject the whole authorization request.
    const ALLOWED_SCOPES = [
      'openid',
      'profile',
      'email',
      'r_liteprofile',
      'r_profile_basicinfo',
      'w_member_social',
      'r_organization_admin',
      'w_organization_social',
      'rw_events',
      'r_events',
      'r_ads',
      'r_ads_leadgen_automation',
      'r_marketing_leadgen_automation',
      'r_verify',
    ]
    const DEFAULT_SCOPES = [
      'openid',
      'profile',
      'r_organization_admin',
      'w_organization_social',
    ]

    if (action === 'get-auth-url') {
      const picked = Array.isArray(requestedScopes) && requestedScopes.length
        ? requestedScopes.filter((s: unknown) => typeof s === 'string' && ALLOWED_SCOPES.includes(s))
        : DEFAULT_SCOPES
      // This connection exists specifically for Company Page automation. Never
      // let a stale saved selection silently omit the permission needed to post.
      const companyScopes = picked.filter((scope: string) =>
        ['openid', 'profile', 'r_organization_admin', 'w_organization_social'].includes(scope)
      )
      const scopeList = Array.from(new Set(['openid', 'profile', 'r_organization_admin', 'w_organization_social', ...companyScopes]))
      const redirectUri = `${SUPABASE_URL}/functions/v1/linkedin-org-callback`
      const safeOrigin = typeof origin === 'string' && /^https?:\/\/[\w.-]+(:\d+)?$/.test(origin) ? origin : null
      const state = btoa(JSON.stringify({ userId, org_urn: org_urn || null, origin: safeOrigin }))
      const scopes = scopeList.join(' ')
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${encodeURIComponent(scopes)}`
      return new Response(JSON.stringify({ authUrl, requestedScopes: scopeList }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'scope-catalog') {
      return new Response(JSON.stringify({ allowed: ALLOWED_SCOPES, defaults: DEFAULT_SCOPES }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'check-connection') {
      const { data } = await admin.from('linkedin_org_tokens').select('org_urn, org_name, expires_at, scope, created_at').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
      const granted = (data?.scope ?? '').split(/[\s,]+/).filter(Boolean)
      const hasValidPage = /^urn:li:organization:\d+$/.test(data?.org_urn ?? '')
      const canPostToPage = hasValidPage && granted.includes('w_organization_social')
      return new Response(JSON.stringify({
        isConnected: canPostToPage,
        hasPageConnection: hasValidPage,
        isAuthorized: !!data,
        canPostToPage,
        blocker: !hasValidPage
          ? 'No administered LinkedIn Company Page was resolved.'
          : !granted.includes('w_organization_social')
            ? 'LinkedIn has not granted w_organization_social, which is required to publish on the Company Page.'
            : null,
        org: data,
        granted,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }


    if (action === 'disconnect') {
      await admin.from('linkedin_org_tokens').update({ is_active: false }).eq('is_active', true)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'set-org-urn') {
      // Manually set the URN for the latest active connection (e.g., urn:li:organization:12345)
      const { error } = await admin.from('linkedin_org_tokens').update({ org_urn }).eq('is_active', true)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders })
  } catch (error) {
    console.error('linkedin-org-auth error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
