// integrations-start: builds the provider OAuth URL and stores CSRF state
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/integrations-callback`;

type ProviderCfg = {
  auth_url: string;
  client_id_env: string;
  scope_param?: string; // 'scope' default, slack uses 'scope' for bot, 'user_scope' for user
  extra_auth_params?: Record<string, string>;
  pkce?: boolean;
};

const PROVIDERS: Record<string, ProviderCfg> = {
  google_calendar: {
    auth_url: 'https://accounts.google.com/o/oauth2/v2/auth',
    client_id_env: 'GOOGLE_OAUTH_CLIENT_ID',
    extra_auth_params: { access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true' },
  },
  google_drive: {
    auth_url: 'https://accounts.google.com/o/oauth2/v2/auth',
    client_id_env: 'GOOGLE_OAUTH_CLIENT_ID',
    extra_auth_params: { access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true' },
  },
  slack: {
    auth_url: 'https://slack.com/oauth/v2/authorize',
    client_id_env: 'SLACK_CLIENT_ID',
  },
  notion: {
    auth_url: 'https://api.notion.com/v1/oauth/authorize',
    client_id_env: 'NOTION_CLIENT_ID',
    extra_auth_params: { owner: 'user' },
  },
  canva: {
    auth_url: 'https://www.canva.com/api/oauth/authorize',
    client_id_env: 'CANVA_CLIENT_ID',
    pkce: true,
  },
};

function randomString(len = 48) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return btoa(String.fromCharCode(...bytes)).replace(/[^a-zA-Z0-9]/g, '').slice(0, len);
}

async function sha256base64url(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claims.claims.sub as string;

    const { provider_id, redirect_to } = await req.json();
    if (!provider_id || typeof provider_id !== 'string') {
      return new Response(JSON.stringify({ error: 'provider_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const cfg = PROVIDERS[provider_id];
    if (!cfg) {
      return new Response(JSON.stringify({ error: `Unknown provider ${provider_id}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const clientId = Deno.env.get(cfg.client_id_env);
    if (!clientId) {
      return new Response(JSON.stringify({ error: `${cfg.client_id_env} is not configured. Have the workspace owner add it in Project Settings.` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: providerRow } = await admin
      .from('integration_providers').select('default_scopes').eq('id', provider_id).maybeSingle();
    const scopes: string[] = providerRow?.default_scopes ?? [];

    const state = randomString(40);
    const pkceVerifier = cfg.pkce ? randomString(64) : null;
    const pkceChallenge = pkceVerifier ? await sha256base64url(pkceVerifier) : null;

    await admin.from('integration_oauth_states').insert({
      state, user_id: userId, provider_id,
      redirect_to: redirect_to ?? null,
      pkce_verifier: pkceVerifier,
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      state: `${state}.${provider_id}`,
      scope: scopes.join(' '),
      ...(cfg.extra_auth_params ?? {}),
    });
    if (provider_id === 'slack') {
      // Slack uses 'scope' for bot perms; we send user_scope empty
    }
    if (pkceChallenge) {
      params.set('code_challenge', pkceChallenge);
      params.set('code_challenge_method', 'S256');
    }

    const url = `${cfg.auth_url}?${params.toString()}`;
    return new Response(JSON.stringify({ url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('integrations-start error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
