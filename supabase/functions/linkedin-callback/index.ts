import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      return new Response(generateHTML('error', 'LinkedIn authorization was denied.'), {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    if (!code || !state) {
      return new Response(generateHTML('error', 'Missing authorization code or state.'), {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    const { userId } = JSON.parse(atob(state))

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
      return new Response(generateHTML('error', 'Failed to exchange authorization code.'), {
        headers: { 'Content-Type': 'text/html' }
      })
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
      return new Response(generateHTML('error', 'Failed to save LinkedIn connection.'), {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    return new Response(generateHTML('success', `Connected as ${linkedinName || 'LinkedIn User'}!`), {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('Callback error:', error)
    return new Response(generateHTML('error', 'An unexpected error occurred.'), {
      headers: { 'Content-Type': 'text/html' }
    })
  }
})

function generateHTML(status: string, message: string): string {
  const isSuccess = status === 'success'
  return `<!DOCTYPE html>
<html>
<head>
  <title>LinkedIn Connection</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #fff; }
    .container { text-align: center; padding: 2rem; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #888; margin-bottom: 1.5rem; }
    .btn { background: ${isSuccess ? '#0077b5' : '#666'}; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${isSuccess ? '✅' : '❌'}</div>
    <h1>${isSuccess ? 'LinkedIn Connected!' : 'Connection Failed'}</h1>
    <p>${message}</p>
    <button class="btn" onclick="window.close()">Close this window</button>
    <script>
      if (window.opener) {
        window.opener.postMessage({ type: 'linkedin-auth-${status}' }, '*');
      }
      setTimeout(() => window.close(), 3000);
    </script>
  </div>
</body>
</html>`
}
