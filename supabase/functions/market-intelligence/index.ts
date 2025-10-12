import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    if (!LOVABLE_API_KEY && !PERPLEXITY_API_KEY) {
      throw new Error("No AI API keys configured");
    }

    let result;

    // Try Lovable AI first (free during promo period)
    if (LOVABLE_API_KEY) {
      const systemPrompt = getSystemPrompt(type);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          tools: type === "structured" ? getStructuredOutputTool() : undefined,
          tool_choice: type === "structured" ? { type: "function", function: { name: "return_market_data" } } : undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (response.status === 402) {
          throw new Error("Credits exhausted. Please add funds to continue.");
        }
        const errorText = await response.text();
        throw new Error(`AI Gateway error: ${errorText}`);
      }

      const data = await response.json();
      
      if (type === "structured" && data.choices[0]?.message?.tool_calls) {
        result = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      } else {
        result = data.choices[0]?.message?.content || "No response";
      }
    } 
    // Fallback to Perplexity if available
    else if (PERPLEXITY_API_KEY) {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-large-128k-online",
          messages: [
            { role: "system", content: getSystemPrompt(type) },
            { role: "user", content: query },
          ],
          temperature: 0.2,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error("Perplexity API error");
      }

      const data = await response.json();
      result = data.choices[0]?.message?.content || "No response";
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Market intelligence error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getSystemPrompt(type: string): string {
  const basePrompt = `You are a market intelligence analyst specializing in startup ecosystems, venture capital, and industry trends. Use real-time web data to provide accurate, data-driven insights.

When analyzing companies or industries:
1. Search for recent funding rounds, valuations, and market activity
2. Analyze industry trends and market size
3. Compare with competitors and market leaders
4. Include data sources and recent news
5. Focus on US markets and government economic data when relevant

Prioritize data from:
- Recent news and press releases
- Government sources (US Census Bureau, Bureau of Economic Analysis, SEC filings)
- Crunchbase, PitchBook, and other startup databases
- Industry reports and market research`;

  if (type === "structured") {
    return basePrompt + "\n\nProvide data in structured format using the provided tool.";
  }
  
  return basePrompt + "\n\nProvide clear, concise analysis with specific data points and sources.";
}

function getStructuredOutputTool() {
  return [
    {
      type: "function",
      function: {
        name: "return_market_data",
        description: "Return structured market intelligence data",
        parameters: {
          type: "object",
          properties: {
            company_name: { type: "string" },
            industry: { type: "string" },
            market_size: { type: "string" },
            latest_funding: {
              type: "object",
              properties: {
                amount: { type: "string" },
                round: { type: "string" },
                date: { type: "string" },
                investors: { type: "array", items: { type: "string" } },
              },
            },
            valuation: { type: "string" },
            competitors: { type: "array", items: { type: "string" } },
            key_metrics: {
              type: "object",
              properties: {
                employees: { type: "string" },
                founded: { type: "string" },
                location: { type: "string" },
              },
            },
            recent_news: { type: "array", items: { type: "string" } },
            industry_trends: { type: "array", items: { type: "string" } },
            data_sources: { type: "array", items: { type: "string" } },
          },
          required: ["company_name", "industry"],
          additionalProperties: false,
        },
      },
    },
  ];
}
