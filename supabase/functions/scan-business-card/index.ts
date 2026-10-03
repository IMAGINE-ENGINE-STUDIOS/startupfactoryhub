import { aiFetch, aiKeysConfigured } from "../_shared/ai.ts";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const image = body?.image as string | undefined;
    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid image (must be data URL)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiKeys = aiKeysConfigured();
    if (!aiKeys) {
      return new Response(JSON.stringify({ error: 'AI provider keys are not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `Extract contact information from this business card image. Return ONLY strict JSON with these exact keys (empty string if not found):
{
  "name": "person's full name",
  "title": "job title / role",
  "company": "company or organization name",
  "email": "primary email address",
  "phone": "primary phone number",
  "website": "website URL",
  "address": "physical / mailing address",
  "notes": "any other relevant info (tagline, secondary contacts)"
}
Do not include any prose, markdown fences, or explanations. Return the JSON object only.`;

    const aiRes = await aiFetch('ai:chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: image } },
            ],
          },
        ],
      }),
    });

    if (aiRes.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({ error: 'AI credits exhausted. Add credits in workspace settings.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI gateway error:', aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: `AI extraction failed (${aiRes.status})` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? '';

    // Parse — try direct JSON first, then extract first {...} block
    const clean = raw.replace(/```json\s*|```\s*/gi, '').trim();
    let extracted: Record<string, string> = {};
    try {
      extracted = JSON.parse(clean);
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          extracted = JSON.parse(match[0]);
        } catch {
          extracted = {};
        }
      }
    }

    const fields = {
      name: String(extracted.name ?? '').trim(),
      title: String(extracted.title ?? '').trim(),
      company: String(extracted.company ?? '').trim(),
      email: String(extracted.email ?? '').trim(),
      phone: String(extracted.phone ?? '').trim(),
      website: String(extracted.website ?? '').trim(),
      address: String(extracted.address ?? '').trim(),
      notes: String(extracted.notes ?? '').trim(),
    };

    return new Response(JSON.stringify({ fields }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('scan-business-card error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
