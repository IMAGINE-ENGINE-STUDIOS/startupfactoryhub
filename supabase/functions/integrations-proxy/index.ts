// integrations-proxy: server-side proxy that decrypts the user's token, refreshes when needed,
// and forwards a request to the upstream provider.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PROVIDER_BASE: Record<string, string> = {
  google_calendar: 'https://www.googleapis.com',
  google_drive: 'https://www.googleapis.com',
  slack: 'https://slack.com/api',
  notion: 'https://api.notion.com',
  canva: 'https://api.canva.com',
  openai: 'https://api.openai.com',
};

const TOKEN_URL: Record<string, string> = {
  google_calendar: 'https://oauth2.googleapis.com/token',
  google_drive: 'https://oauth2.googleapis.com/token',
  notion: 'https://api.notion.com/v1/oauth/token',
  canva: 'https://api.canva.com/rest/v1/oauth/token',
  // Slack tokens don't expire by default
};

const CLIENT_ENV: Record<string, [string, string, boolean]> = {
  // provider: [clientIdEnv, clientSecretEnv, useBasicAuth]
  google_calendar: ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET', false],
  google_drive: ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET', false],
  notion: ['NOTION_CLIENT_ID', 'NOTION_CLIENT_SECRET', true],
  canva: ['CANVA_CLIENT_ID', 'CANVA_CLIENT_SECRET', true],
};

const EXTRA_HEADERS: Record<string, Record<string, string>> = {
  notion: { 'Notion-Version': '2022-06-28' },
};

const enc = new TextEncoder(); const dec = new TextDecoder();
async function getKey() {
  const raw = Deno.env.get('INTEGRATIONS_ENCRYPTION_KEY');
  if (!raw) throw new Error('INTEGRATIONS_ENCRYPTION_KEY missing');
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function encrypt(plain: string) {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0); out.set(ct, iv.length);
  return btoa(String.fromCharCode(...out));
}
async function decrypt(payload: string) {
  const key = await getKey();
  const bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
  const iv = bytes.slice(0, 12), ct = bytes.slice(12);
  return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
}

async function refreshIfNeeded(admin: any, row: any): Promise<string> {
  const accessToken = await decrypt(row.access_token);
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : null;
  const stillValid = !expiresAt || expiresAt - Date.now() > 60_000;
  if (stillValid || !row.refresh_token || !TOKEN_URL[row.provider_id]) return accessToken;

  const refreshToken = await decrypt(row.refresh_token);
  const envCfg = CLIENT_ENV[row.provider_id];
  if (!envCfg) return accessToken;
  const [idEnv, secretEnv, basic] = envCfg;
  const clientId = Deno.env.get(idEnv)!;
  const clientSecret = Deno.env.get(secretEnv)!;
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken });
  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' };
  if (basic) headers['Authorization'] = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
  else { body.set('client_id', clientId); body.set('client_secret', clientSecret); }
  const r = await fetch(TOKEN_URL[row.provider_id], { method: 'POST', headers, body });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error(`refresh_failed: ${JSON.stringify(j)}`);

  const newAccess = j.access_token as string;
  const newExpires = j.expires_in ? new Date(Date.now() + j.expires_in * 1000).toISOString() : null;
  const newRefreshEnc = j.refresh_token ? await encrypt(j.refresh_token) : row.refresh_token;
  await admin.from('user_integrations').update({
    access_token: await encrypt(newAccess),
    refresh_token: newRefreshEnc,
    expires_at: newExpires,
  }).eq('id', row.id);
  return newAccess;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (!claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claims.claims.sub as string;

    const { provider_id, method = 'GET', path, body, query } = await req.json();
    if (!provider_id || !path) {
      return new Response(JSON.stringify({ error: 'provider_id and path are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const base = PROVIDER_BASE[provider_id];
    if (!base) {
      return new Response(JSON.stringify({ error: `Unknown provider ${provider_id}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: row, error } = await admin
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider_id', provider_id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!row) return new Response(JSON.stringify({ error: 'not_connected' }), { status: 412, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const accessToken = await refreshIfNeeded(admin, row);

    const url = new URL(path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`);
    if (query && typeof query === 'object') {
      for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v));
    }
    const upstreamHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...(EXTRA_HEADERS[provider_id] ?? {}),
    };
    if (body) upstreamHeaders['Content-Type'] = 'application/json';

    const res = await fetch(url.toString(), {
      method,
      headers: upstreamHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
    });
  } catch (e) {
    console.error('proxy error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
