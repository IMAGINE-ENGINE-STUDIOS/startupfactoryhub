import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to log API usage
async function logApiUsage(serviceName: string, endpoint: string, tokensUsed?: number, estimatedCost?: number) {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    await supabaseClient.from('api_usage_logs').insert({
      service_name: serviceName,
      endpoint: endpoint,
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Fetching real-time market predictions...");

    const systemPrompt = `You are a market intelligence analyst. Generate 3 accurate market predictions based on current 2025 data. 
    Each prediction should include:
    - A specific, measurable prediction
    - The industry/sector
    - A realistic growth percentage
    
    Use your knowledge of current market trends and data from 2025.`;

    const userPrompt = `Provide 3 real market predictions for 2025-2026 covering different sectors (AI/Tech, FinTech, and Climate Tech). 
    Make them specific, data-driven, and realistic based on current market trends.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
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
            description: "Generate market predictions with specific data",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Short title for the prediction" },
                      prediction: { type: "string", description: "Detailed prediction with specific metrics" },
                      trend: { type: "string", description: "Growth percentage like '+156%'" }
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
    console.log("AI response received");

    // Estimate tokens and log usage
    const tokensUsed = data.usage?.total_tokens || 500;
    const estimatedCost = tokensUsed * 0.0001;
    await logApiUsage('gemini', 'market-predictions', tokensUsed, estimatedCost);

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const predictions = JSON.parse(toolCall.function.arguments).predictions;

    return new Response(
      JSON.stringify({ predictions }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in market-predictions function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        predictions: [
          { title: 'AI Market Growth', prediction: 'AI market projected to reach $190B by 2026', trend: '+145%' },
          { title: 'FinTech Expansion', prediction: 'Digital payments adoption growing to 75% globally', trend: '+82%' },
          { title: 'Climate Tech', prediction: 'Climate tech funding expected to double by 2026', trend: '+198%' },
        ]
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
