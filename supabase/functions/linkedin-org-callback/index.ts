import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const errorParam = url.searchParams.get('error')

    if (errorParam) return html('error', 'Authorization denied.')
    if (!code || !state) return html('error', 'Missing code or state.')

    const { userId, org_urn } = JSON.parse(atob(state))

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
      return html('error', 'Failed to exchange code.')
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
    await admin.from('linkedin_org_tokens').insert({
      org_urn: resolvedOrgUrn || 'urn:li:organization:UNSET',
      org_name: orgName,
      access_token: accessToken,
      refresh_token: tokenData.refresh_token || null,
      expires_at: expiresAt,
      scope: tokenData.scope || null,
      connected_by: userId,
      is_active: true,
    })

    return html('success', `Connected${orgName ? ' to ' + orgName : ''}!`)
  } catch (err) {
    console.error('org callback error:', err)
    return html('error', 'Unexpected error.')
  }
})

function html(status: string, message: string) {
  const ok = status === 'success'
  return new Response(`<!DOCTYPE html><html><head><title>LinkedIn</title><style>body{font-family:system-ui;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.c{text-align:center;padding:2rem}.i{font-size:4rem}h1{margin:1rem 0}.b{background:${ok?'#0077b5':'#666'};color:#fff;border:0;padding:12px 24px;border-radius:8px;cursor:pointer}</style></head><body><div class="c"><div class="i">${ok?'✓':'✗'}</div><h1>${ok?'Company Page Connected':'Failed'}</h1><p>${message}</p><button class="b" onclick="window.close()">Close</button><script>if(window.opener){window.opener.postMessage({type:'linkedin-org-${status}'},'*')}setTimeout(()=>window.close(),3000)</script></div></body></html>`,
    { headers: { 'Content-Type': 'text/html' } })
}
