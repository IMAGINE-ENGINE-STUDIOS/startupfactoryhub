import { aiFetch, aiKeysConfigured } from "../_shared/ai.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { disaster, location, language = 'en', question } = await req.json();
    const AI_KEYS = aiKeysConfigured();
    if (!AI_KEYS) {
      return new Response(JSON.stringify({ error: 'AI provider keys are not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const langName = language === 'es' ? 'Spanish' : 'English';
    const systemPrompt = `You are an emergency preparedness and natural-disaster response advisor.
Provide concise, actionable, prioritized safety tips. Output in ${langName}.
Format strictly as short markdown bullets grouped under: "Immediate Actions", "Within 24h", "Avoid", "Emergency Contacts".
Tailor advice to the disaster type and location when provided. Be specific, calm, and authoritative. Keep total under 250 words.`;

    const userPrompt = question
      ? question
      : `Give emergency safety tips for: ${disaster || 'general natural disaster'}${location ? ` in ${location}` : ''}.`;

    const response = await aiFetch('ai:chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_KEYS}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const msg = status === 429
        ? 'Rate limit exceeded. Please try again shortly.'
        : status === 402
          ? 'AI credits exhausted. Please add credits.'
          : `AI API error: ${status}`;
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const tips = data.choices?.[0]?.message?.content ?? '';
    return new Response(JSON.stringify({ tips }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
