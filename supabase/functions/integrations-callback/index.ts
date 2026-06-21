// integrations-callback: receives OAuth code, exchanges for tokens, stores encrypted, redirects
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://startupfactoryhub.com';
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/integrations-callback`;

type ProviderCfg = {
  token_url: string;
  client_id_env: string;
  client_secret_env: string;
  auth_basic?: boolean;
  label?: (tokenData: any, accessToken: string) => Promise<string | null>;
};

async function googleLabel(_t: any, accessToken: string) {
  const r = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) return null;
  const j = await r.json();
  return j.email ?? null;
}

const PROVIDERS: Record<string, ProviderCfg> = {
  google_calendar: { token_url: 'https://oauth2.googleapis.com/token', client_id_env: 'GOOGLE_OAUTH_CLIENT_ID', client_secret_env: 'GOOGLE_OAUTH_CLIENT_SECRET', label: googleLabel },
  google_drive:    { token_url: 'https://oauth2.googleapis.com/token', client_id_env: 'GOOGLE_OAUTH_CLIENT_ID', client_secret_env: 'GOOGLE_OAUTH_CLIENT_SECRET', label: googleLabel },
  slack: {
    token_url: 'https://slack.com/api/oauth.v2.access',
    client_id_env: 'SLACK_CLIENT_ID', client_secret_env: 'SLACK_CLIENT_SECRET',
    label: async (t) => t.team?.name ?? t.authed_user?.id ?? null,
  },
  notion: {
    token_url: 'https://api.notion.com/v1/oauth/token',
    client_id_env: 'NOTION_CLIENT_ID', client_secret_env: 'NOTION_CLIENT_SECRET',
    auth_basic: true,
    label: async (t) => t.workspace_name ?? t.workspace_id ?? null,
  },
  canva: {
    token_url: 'https://api.canva.com/rest/v1/oauth/token',
    client_id_env: 'CANVA_CLIENT_ID', client_secret_env: 'CANVA_CLIENT_SECRET',
    auth_basic: true,
  },
};

const enc = new TextEncoder();
async function getKey() {
  const raw = Deno.env.get('INTEGRATIONS_ENCRYPTION_KEY');
  if (!raw) throw new Error('INTEGRATIONS_ENCRYPTION_KEY missing');
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  if (bytes.length !== 32) throw new Error('INTEGRATIONS_ENCRYPTION_KEY must decode to 32 bytes');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt']);
}
async function encrypt(plain: string | null | undefined): Promise<string | null> {
  if (!plain) return null;
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0); out.set(ct, iv.length);
  return btoa(String.fromCharCode(...out));
}

function redirect(to: string) {
  return new Response(null, { status: 302, headers: { Location: to } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateRaw = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');
  const back = (status: 'success' | 'error', provider?: string, message?: string) => {
    const dest = new URL('/tools', SITE_URL);
    dest.searchParams.set('integration', status);
    if (provider) dest.searchParams.set('provider', provider);
    if (message) dest.searchParams.set('message', message);
    return redirect(dest.toString());
  };

  try {
    if (errorParam) return back('error', undefined, errorParam);
    if (!code || !stateRaw) return back('error', undefined, 'missing_code_or_state');

    const [stateToken, providerFromState] = stateRaw.split('.');
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: stateRow } = await admin
      .from('integration_oauth_states').select('*').eq('state', stateToken).maybeSingle();
    if (!stateRow) return back('error', providerFromState, 'invalid_state');
    // Single-use
    await admin.from('integration_oauth_states').delete().eq('state', stateToken);

    const providerId: string = stateRow.provider_id;
    const cfg = PROVIDERS[providerId];
    if (!cfg) return back('error', providerId, 'unknown_provider');

    const clientId = Deno.env.get(cfg.client_id_env);
    const clientSecret = Deno.env.get(cfg.client_secret_env);
    if (!clientId || !clientSecret) return back('error', providerId, 'oauth_app_not_configured');

    // Exchange code
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    });
    if (stateRow.pkce_verifier) body.set('code_verifier', stateRow.pkce_verifier);
    const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' };
    if (cfg.auth_basic) {
      headers['Authorization'] = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
    } else {
      body.set('client_id', clientId);
      body.set('client_secret', clientSecret);
    }
    const tokenRes = await fetch(cfg.token_url, { method: 'POST', headers, body });
    const tokenText = await tokenRes.text();
    let tokenData: any;
    try { tokenData = JSON.parse(tokenText); } catch { return back('error', providerId, `token_parse_${tokenRes.status}`); }
    if (!tokenRes.ok || tokenData.error || tokenData.ok === false) {
      console.error('Token exchange failed', providerId, tokenText);
      return back('error', providerId, tokenData.error ?? `http_${tokenRes.status}`);
    }

    // Slack returns access_token for bot, plus authed_user.access_token for user
    const accessToken = tokenData.access_token ?? tokenData.authed_user?.access_token;
    const refreshToken = tokenData.refresh_token ?? tokenData.authed_user?.refresh_token ?? null;
    const expiresIn = tokenData.expires_in ?? tokenData.authed_user?.expires_in ?? null;
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;
    const scopes: string[] = (tokenData.scope ?? '').split(/[\s,]+/).filter(Boolean);

    let label: string | null = null;
    try { label = cfg.label ? await cfg.label(tokenData, accessToken) : null; } catch (e) { console.warn('label fetch failed', e); }

    const accessEnc = await encrypt(accessToken);
    const refreshEnc = await encrypt(refreshToken);

    const { error: upsertError } = await admin.from('user_integrations').upsert({
      user_id: stateRow.user_id,
      provider_id: providerId,
      account_label: label,
      access_token: accessEnc,
      refresh_token: refreshEnc,
      expires_at: expiresAt,
      scopes,
      metadata: {
        team_id: tokenData.team?.id ?? null,
        workspace_id: tokenData.workspace_id ?? null,
        bot_user_id: tokenData.bot_user_id ?? null,
        raw_token_type: tokenData.token_type ?? null,
      },
      status: 'active',
    }, { onConflict: 'user_id,provider_id,account_label' });
    if (upsertError) {
      console.error('upsert failed', upsertError);
      return back('error', providerId, 'storage_failed');
    }

    return back('success', providerId);
  } catch (e) {
    console.error('callback error', e);
    return back('error', undefined, 'unexpected_error');
  }
});
