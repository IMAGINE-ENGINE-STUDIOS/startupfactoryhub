// integrations-set-api-key: validates and stores an API-key style integration (OpenAI/ChatGPT)
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const enc = new TextEncoder();
async function getKey() {
  const raw = Deno.env.get('INTEGRATIONS_ENCRYPTION_KEY');
  if (!raw) throw new Error('INTEGRATIONS_ENCRYPTION_KEY missing');
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  if (bytes.length !== 32) throw new Error('INTEGRATIONS_ENCRYPTION_KEY must decode to 32 bytes');
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt']);
}
async function encrypt(plain: string) {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0); out.set(ct, iv.length);
  return btoa(String.fromCharCode(...out));
}

async function validate(providerId: string, apiKey: string): Promise<{ ok: boolean; label?: string; error?: string }> {
  if (providerId === 'openai') {
    const r = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!r.ok) {
      const t = await r.text();
      return { ok: false, error: `OpenAI validation failed (${r.status}): ${t.slice(0, 200)}` };
    }
    // Mask label: last 4 chars
    return { ok: true, label: `sk-…${apiKey.slice(-4)}` };
  }
  return { ok: true, label: `key-${apiKey.slice(-4)}` };
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

    const { provider_id, api_key } = await req.json();
    if (!provider_id || !api_key || typeof api_key !== 'string' || api_key.length < 10) {
      return new Response(JSON.stringify({ error: 'provider_id and api_key required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const v = await validate(provider_id, api_key.trim());
    if (!v.ok) {
      return new Response(JSON.stringify({ error: v.error ?? 'Invalid key' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const accessEnc = await encrypt(api_key.trim());
    const { error } = await admin.from('user_integrations').upsert({
      user_id: userId,
      provider_id,
      account_label: v.label!,
      access_token: accessEnc,
      refresh_token: null,
      expires_at: null,
      scopes: [],
      metadata: {},
      status: 'active',
    }, { onConflict: 'user_id,provider_id,account_label' });
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, label: v.label }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
