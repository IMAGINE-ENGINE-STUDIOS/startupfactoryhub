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

    // Fetch organizations the user administers. The REST endpoint is the
    // current LinkedIn API; the old v2 projection can return no elements while
    // still responding successfully, which previously saved an UNSET author.
    let resolvedOrgUrn = org_urn || null
    let orgName: string | null = null
    try {
      const orgsResp = await fetch('https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&state=APPROVED&count=100', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'LinkedIn-Version': '202601',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      })
      if (orgsResp.ok) {
        const orgs = await orgsResp.json()
        const organizationUrns = (orgs?.elements ?? [])
          .map((item: Record<string, unknown>) => String(item.organization ?? ''))
          .filter((urn: string) => /^urn:li:organization:\d+$/.test(urn))
        resolvedOrgUrn = resolvedOrgUrn || organizationUrns[0] || null

        if (resolvedOrgUrn) {
          const organizationId = resolvedOrgUrn.split(':').pop()
          const detailResp = await fetch(`https://api.linkedin.com/rest/organizations/${organizationId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'LinkedIn-Version': '202601',
              'X-Restli-Protocol-Version': '2.0.0',
            },
          })
          if (detailResp.ok) {
            const detail = await detailResp.json()
            orgName = detail.localizedName || detail.vanityName || null
          } else {
            console.error('Organization detail failed:', detailResp.status, await detailResp.text())
          }
        }
      } else {
        console.error('Organization ACL lookup failed:', orgsResp.status, await orgsResp.text())
      }
    } catch (e) { console.warn('org list failed', e) }

    if (!resolvedOrgUrn || !/^urn:li:organization:\d+$/.test(resolvedOrgUrn)) {
      return html(
        'error',
        'LinkedIn authorized the account but did not return an administered Company Page. Confirm this member is a Startup Factory Hub Page super admin.',
      )
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    // Deactivate previous
    await admin.from('linkedin_org_tokens').update({ is_active: false }).eq('is_active', true)
    const { error: insertError } = await admin.from('linkedin_org_tokens').insert({
      org_urn: resolvedOrgUrn,
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
