import { aiFetch, aiKeysConfigured } from "../_shared/ai.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { researchBlock, researchWeb, todayContext } from "../_shared/web-research.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const AI_KEYS = aiKeysConfigured();
    if (!AI_KEYS) throw new Error("AI provider keys are not configured");

    // Ground predictions on the live internet.
    const research = await researchWeb(
      'latest artificial intelligence, fintech and climate tech market funding, growth and forecasts',
      "Cover the three sectors separately with concrete deals, amounts and growth figures.",
    );
    console.log(`Predictions grounded on ${research.sources.length} live web sources`);

    const systemPrompt = `You are a market intelligence analyst. You are given live web research retrieved seconds ago.
Base every prediction on that research: cite concrete companies, amounts or metrics that appear in it.
${todayContext()}`;

    const userPrompt = `Produce 3 forward-looking market predictions (AI/Tech, FinTech, Climate Tech) for the next 12 months.${researchBlock(research)}

Each must be specific and traceable to the research above. Include a realistic growth figure.`;

    const response = await aiFetch("ai:chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AI_KEYS}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_predictions",
            description: "Structured market predictions grounded in the supplied articles",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Short title" },
                      prediction: { type: "string", description: "Detailed prediction with specific metrics from the articles" },
                      trend: { type: "string", description: "Growth figure like '+156%'" },
                      source: { type: "string", description: "Source URL supporting the prediction" }
                    },
                    required: ["title", "prediction", "trend"]
                  }
                }
              },
              required: ["predictions"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_predictions" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const tokensUsed = data.usage?.total_tokens || 500;
    await logApiUsage('gemini', 'market-predictions', tokensUsed, tokensUsed * 0.0001);

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const predictions = JSON.parse(toolCall.function.arguments).predictions;

    return new Response(
      JSON.stringify({ predictions, as_of: new Date().toISOString(), articles_used: research.sources.length, sources: research.sources }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error in market-predictions function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", predictions: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
