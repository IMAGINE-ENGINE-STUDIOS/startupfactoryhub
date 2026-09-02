import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { articlesBlock, fetchMarketNews, todayContext } from "../_shared/market-news.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function logApiUsage(serviceName: string, endpoint: string, tokensUsed?: number, estimatedCost?: number) {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    await supabaseClient.from('api_usage_logs').insert({
      service_name: serviceName,
      endpoint,
      request_count: 1,
      tokens_used: tokensUsed || null,
      estimated_cost: estimatedCost || 0.001,
      metadata: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    console.error('Failed to log API usage:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, type } = await req.json();
    console.log('Market intelligence search:', { query, type });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const upperType = String(type || 'STARTUPS').toUpperCase();
    const lowerQuery = String(query || '').toLowerCase();

    // ---- 1. Ground on real, recent news --------------------------------------
    let newsQuery = query;
    if (lowerQuery.includes('trending') || lowerQuery.includes('top')) {
      newsQuery = 'startup ("raises" OR "funding round" OR "Series A" OR "Series B" OR "acquired" OR "launches")';
    } else if (lowerQuery.includes('insight') || lowerQuery.includes('metric')) {
      newsQuery = 'technology company (earnings OR growth OR revenue OR "market share")';
    } else if (lowerQuery.includes('prediction')) {
      newsQuery = 'startup (IPO OR acquisition OR "funding round") outlook';
    }

    const articles = await fetchMarketNews(newsQuery, 45, 22);
    console.log(`Grounding on ${articles.length} live articles`);

    const asOf = new Date().toISOString();
    const grounding = `${todayContext()}${articlesBlock(articles)}

RULES:
- Use ONLY the live articles above for facts, names, amounts and dates. Do not invent companies or rounds.
- If the articles do not cover something, return fewer items rather than fabricating.
- Every item must include the "source" URL of the article it came from and its "date" (YYYY-MM-DD).`;

    const systemPrompt = `You are a market intelligence analyst. You receive real news articles retrieved seconds ago and turn them into structured intelligence.
Return ONLY valid JSON, no markdown, no code fences.`;

    let schema = '';
    if (upperType === 'STARTUP' || upperType === 'STARTUPS') {
      if (lowerQuery.includes('prediction')) {
        schema = `{"predictions":[{"company":"","domain":"company.com","prediction":"","confidence":"High|Medium|Low","timeframe":"","source":"","date":"YYYY-MM-DD","color":"from-violet-500/10 to-purple-500/10"}]}
Return 4-6 items drawn from the articles.`;
      } else if (lowerQuery.includes('trending') || lowerQuery.includes('top')) {
        schema = `{"companies":[{"name":"","domain":"company.com","activity":"e.g. Series B Funding","description":"what happened, with the real amount/investors","category":"","prediction":"grounded near-term outlook","change":"e.g. +250% or $40M","source":"","date":"YYYY-MM-DD","color":"from-purple-500/10 to-pink-500/10"}]}
Return 6-8 items drawn from the articles.`;
      } else {
        schema = `{"type":"${type}","name":"","description":"2-3 sentences","metrics":{"metric1":"value","metric2":"value","metric3":"value","metric4":"value"},"insights":["","","",""],"predictions":["","",""],"trends":[{"label":"","value":100,"change":15}],"sources":[""]}`;
      }
    } else if (upperType === 'INDUSTRY' || upperType === 'INDUSTRIES') {
      if (lowerQuery.includes('insight') || lowerQuery.includes('metric')) {
        schema = `{"insights":[{"company":"","domain":"company.com","insight":"","metric":"","value":"","source":"","date":"YYYY-MM-DD","color":"from-teal-500/10 to-cyan-500/10"}]}
Return 4-6 items drawn from the articles.`;
      } else {
        schema = `{"type":"${type}","name":"","description":"2-3 sentences","metrics":{"metric1":"value","metric2":"value","metric3":"value"},"insights":["","",""],"predictions":["",""],"trends":[{"label":"","value":100,"change":15}],"sources":[""]}`;
      }
    } else {
      schema = `{"type":"${type}","name":"","description":"2-3 sentences","metrics":{"metric1":"value","metric2":"value"},"insights":["",""],"predictions":[""],"trends":[{"label":"","value":100,"change":15}],"sources":[""]}`;
    }

    const userPrompt = `Request: "${query}"

${grounding}

Respond with exactly this JSON shape:
${schema}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited. Try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content ?? '';

    const tokensUsed = aiData.usage?.total_tokens || (userPrompt.length + content.length) / 4;
    await logApiUsage('gemini', 'market-intelligence', tokensUsed, tokensUsed * 0.0001);

    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let analysisData: any;
    try {
      analysisData = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response:', content.slice(0, 500));
      return new Response(
        JSON.stringify({ error: 'Live market data could not be structured. Please retry.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    analysisData.as_of = asOf;
    analysisData.articles_used = articles.length;

    console.log('Analysis complete', { articles: articles.length });
    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in market-intelligence function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
