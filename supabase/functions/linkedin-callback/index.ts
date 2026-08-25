import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FALLBACK_ORIGIN = 'https://startupfactoryhub.com'

function parseState(raw: string | null): { userId?: string; origin?: string | null } {
  try { return raw ? JSON.parse(atob(raw)) : {} } catch { return {} }
}

function redirect(origin: string, status: string, message: string) {
  const target = `${origin}/linkedin/return?scope=member&status=${encodeURIComponent(status)}&message=${encodeURIComponent(message)}`
  return new Response(null, { status: 302, headers: { Location: target } })
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const state = url.searchParams.get('state')
  const appOrigin = parseState(state).origin || FALLBACK_ORIGIN
  const done = (status: string, message: string) => redirect(appOrigin, status, message)

  try {
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    if (error) return done('error', 'LinkedIn authorization was denied.')
    if (!code || !state) return done('error', 'Missing authorization code or state.')

    const { userId } = parseState(state)

    const LINKEDIN_CLIENT_ID = Deno.env.get('LINKEDIN_CLIENT_ID')!
    const LINKEDIN_CLIENT_SECRET = Deno.env.get('LINKEDIN_CLIENT_SECRET')!
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const redirectUri = `${SUPABASE_URL}/functions/v1/linkedin-callback`

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      })
    })

    if (!tokenResponse.ok) {
      const errData = await tokenResponse.text()
      console.error('Token exchange failed:', errData)
      return done('error', 'Failed to exchange authorization code.')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const expiresIn = tokenData.expires_in // seconds
    const refreshToken = tokenData.refresh_token || null

    // Get user info from LinkedIn
    const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    let linkedinSub = null
    let linkedinName = null
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json()
      linkedinSub = userInfo.sub
      linkedinName = userInfo.name
    }

    // Store tokens in database using service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    const { error: upsertError } = await supabase
      .from('linkedin_tokens')
      .upsert({
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        linkedin_sub: linkedinSub,
        linkedin_name: linkedinName,
      }, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('Failed to store tokens:', upsertError)
      return done('error', 'Failed to save LinkedIn connection.')
    }

    return done('success', `Connected as ${linkedinName || 'LinkedIn User'}!`)
  } catch (error) {
    console.error('Callback error:', error)
    return done('error', 'An unexpected error occurred.')
  }
})
