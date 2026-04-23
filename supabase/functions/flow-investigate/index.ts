// Flow Investigate — conversational deep-dive over an existing Flow analysis result.
// Uses the Lovable AI Gateway. Validates JWT in code.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface Msg { role: "user" | "assistant" | "system"; content: string; }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { question, context, history } = body as {
      question?: string;
      context?: { idea?: string; domain?: string; region?: string; result?: any };
      history?: Msg[];
    };

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return new Response(JSON.stringify({ error: "question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (question.length > 2000) {
      return new Response(JSON.stringify({ error: "question too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a compact context summary so we don't blow the window.
    const ctxSummary = context?.result
      ? {
          idea: context.idea,
          domain: context.domain,
          region: context.region,
          feasibilityScore: context.result?.simulation?.feasibilityScore,
          riskScore: context.result?.risk?.overallScore,
          nodes: (context.result?.network?.nodes || []).slice(0, 30).map((n: any) => ({
            label: n.label,
            category: n.category,
            probability: n.probability,
            description: n.description,
          })),
          edges: (context.result?.network?.edges || []).slice(0, 40).map((e: any) => ({
            from: e.from, to: e.to, weight: e.weight, relationship: e.relationship,
          })),
          topRisks: (context.result?.risk?.factors || []).slice(0, 8),
          rules: (context.result?.logic?.rules || []).slice(0, 10),
          summary: context.result?.logic?.summary,
        }
      : null;

    const systemPrompt = `You are FLOW Investigator, an expert analyst that helps founders dig deeper into a Bayesian startup model.
You have access to the model below. Always ground answers in this data; cite specific variables, edges, rules or risk factors when relevant.
Be concise, structured, and use markdown (bullets, bold). When uncertain, state assumptions.

MODEL CONTEXT:
${ctxSummary ? JSON.stringify(ctxSummary, null, 2) : "(no model — answer generally about Flow methodology)"}`;

    const messages: Msg[] = [
      { role: "system", content: systemPrompt },
      ...((history || []).slice(-12).map((m) => ({ role: m.role, content: m.content }))),
      { role: "user", content: question },
    ];

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const answer = aiData?.choices?.[0]?.message?.content || "(no response)";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("flow-investigate error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
