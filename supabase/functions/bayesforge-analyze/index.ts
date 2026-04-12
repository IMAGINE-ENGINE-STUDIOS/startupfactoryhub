import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea, domain, region, constraints, analysisType } = await req.json();

    if (!idea || idea.trim().length < 5) {
      return new Response(JSON.stringify({ error: "Please provide a startup idea (at least 5 characters)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are BayesForge, a probabilistic intelligence engine for startup analysis. You must return ONLY valid JSON with no markdown formatting.

Given a startup idea, domain, region, and constraints, produce a comprehensive analysis with this exact JSON structure:

{
  "network": {
    "nodes": [
      { "id": "string", "label": "string", "category": "market|financial|environmental|technical|regulatory", "probability": 0.0-1.0, "description": "string" }
    ],
    "edges": [
      { "from": "node_id", "to": "node_id", "weight": 0.0-1.0, "relationship": "string" }
    ]
  },
  "simulation": {
    "feasibilityScore": 0-100,
    "confidenceInterval": [low, high],
    "revenueProjections": {
      "year1": { "low": number, "mid": number, "high": number },
      "year2": { "low": number, "mid": number, "high": number },
      "year3": { "low": number, "mid": number, "high": number }
    },
    "scenarios": [
      { "name": "string", "probability": 0.0-1.0, "outcome": "string", "revenue": number }
    ],
    "monteCarloDistribution": [
      { "bucket": "string", "frequency": number }
    ]
  },
  "risk": {
    "overallScore": 0-100,
    "factors": [
      { "name": "string", "category": "market|financial|technical|regulatory|environmental", "severity": 1-5, "likelihood": 1-5, "score": 1-25, "mitigation": "string" }
    ]
  },
  "logic": {
    "rules": [
      { "condition": "string", "implication": "string", "confidence": 0.0-1.0 }
    ],
    "algorithmSchema": "string",
    "summary": "string"
  }
}

Create 8-12 nodes for the Bayesian network covering key startup variables. Create realistic edges showing dependencies. Generate 5-8 risk factors. Provide 3-4 scenarios. Include 8-10 Monte Carlo distribution buckets. All numbers should be realistic for the given domain and region.`;

    const userPrompt = `Analyze this startup:
- Idea: ${idea}
- Domain: ${domain || "General"}
- Region: ${region || "Global"}
- Constraints: ${constraints || "None specified"}
- Analysis focus: ${analysisType || "full"}

Return the complete JSON analysis.`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) throw new Error("No content from AI");

    // Parse JSON from response (strip markdown fences if present)
    let parsed;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content.substring(0, 500));
      throw new Error("Failed to parse AI analysis");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bayesforge error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
