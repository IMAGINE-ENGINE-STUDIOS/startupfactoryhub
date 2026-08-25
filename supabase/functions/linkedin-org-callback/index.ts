import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FALLBACK_ORIGIN = 'https://startupfactoryhub.com'

function parseState(raw: string | null): { userId?: string; org_urn?: string | null; origin?: string | null } {
  try { return raw ? JSON.parse(atob(raw)) : {} } catch { return {} }
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const state = url.searchParams.get('state')
  const appOrigin = parseState(state).origin || FALLBACK_ORIGIN
  const html = (status: string, message: string) => redirect(appOrigin, status, message)

  try {
    const code = url.searchParams.get('code')
    const errorParam = url.searchParams.get('error')

    if (errorParam) return html('error', 'Authorization denied.')
    if (!code || !state) return html('error', 'Missing code or state.')

    const { userId, org_urn } = parseState(state)


    const LINKEDIN_CLIENT_ID = Deno.env.get('LINKEDIN_CLIENT_ID')!
    const LINKEDIN_CLIENT_SECRET = Deno.env.get('LINKEDIN_CLIENT_SECRET')!
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const redirectUri = `${SUPABASE_URL}/functions/v1/linkedin-org-callback`

    const tokenResp = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code, redirect_uri: redirectUri,
        client_id: LINKEDIN_CLIENT_ID, client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    })
    if (!tokenResp.ok) {
      const t = await tokenResp.text()
      console.error('Token exchange failed:', t)
      return html('error', `Token exchange failed: ${t.slice(0, 300)}`)
    }
    const tokenData = await tokenResp.json()
    const accessToken = tokenData.access_token
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString()

    // Fetch organizations the user administers
    let resolvedOrgUrn = org_urn || null
    let orgName: string | null = null
    try {
      const orgsResp = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName)))', {
        headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' },
      })
      if (orgsResp.ok) {
        const orgs = await orgsResp.json()
        const first = orgs?.elements?.[0]?.['organization~']
        if (first?.id) {
          resolvedOrgUrn = resolvedOrgUrn || `urn:li:organization:${first.id}`
          orgName = first.localizedName || null
        }
      }
    } catch (e) { console.warn('org list failed', e) }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    // Deactivate previous
    await admin.from('linkedin_org_tokens').update({ is_active: false }).eq('is_active', true)
    const { error: insertError } = await admin.from('linkedin_org_tokens').insert({
      org_urn: resolvedOrgUrn || 'urn:li:organization:UNSET',
      org_name: orgName,
      access_token: accessToken,
      refresh_token: tokenData.refresh_token || null,
      expires_at: expiresAt,
      scope: tokenData.scope || null,
      connected_by: userId,
      is_active: true,
    })

    if (insertError) {
      console.error('Failed to save org token:', insertError)
      return html('error', `Could not save connection: ${insertError.message}`)
    }

    return html('success', `Connected${orgName ? ' to ' + orgName : ''}!`)
  } catch (err) {
    console.error('org callback error:', err)
    return html('error', `Unexpected error: ${(err as Error).message}`)
  }
})

function redirect(origin: string, status: string, message: string) {
  const target = `${origin}/linkedin/return?scope=org&status=${encodeURIComponent(status)}&message=${encodeURIComponent(message)}`
  return new Response(null, { status: 302, headers: { Location: target } })
}
