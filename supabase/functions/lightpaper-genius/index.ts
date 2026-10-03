import { aiFetch, aiKeysConfigured } from "../_shared/ai.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // Require authentication to prevent anonymous AI credit drain
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, systemOverride, language } = await req.json();
    const AI_KEYS = aiKeysConfigured();
    if (!AI_KEYS)
      throw new Error("AI provider keys are not configured");

    const defaultSystem = `You are **Genius AI**, a writing assistant in LightPaper.

RULES:
1. If the request is vague, ask 2-3 SHORT questions (under 15 words each). Use multiple choice: "A) Option B) Option C) Option". NEVER ask free-text questions — ALWAYS provide selectable options.
2. Do NOT write any document until user says "go", "yes", "write it", "proceed".
3. When confirmed, write the FULL document — extensive, thorough, 2000+ words minimum.
4. DOCUMENT STRUCTURE IS MANDATORY: "# Title" once, then abstract, then "## Section" / "### Sub-section" headings. Full prose paragraphs (3-6 sentences), Markdown tables with header rows for data, lists only for real lists, "> " for quotes. No conversational filler, no emojis, no meta commentary — output document content only.
5. For 10+ sections, provide OUTLINE: first with numbered chapters.
6. Keep clarifying questions conversational and brief — they appear in a small chat bubble.
7. STRICT COMPLIANCE: Follow user instructions EXACTLY. If they say "1 paragraph" write EXACTLY 1 paragraph. If they say "200 words" write EXACTLY 200 words — not one more, not one less. Word counts and paragraph counts are HARD constraints, never approximate.
8. Do NOT include [IMAGE: description] tags or any image placeholders unless the user explicitly asks for images.`;

    const LANGUAGE_NAMES: Record<string, string> = {
      en: "English", es: "Spanish (Latin American)", pt: "Portuguese (Brazilian)",
      fr: "French", de: "German", it: "Italian", nl: "Dutch", pl: "Polish",
      ru: "Russian", uk: "Ukrainian", tr: "Turkish", ar: "Arabic", he: "Hebrew",
      hi: "Hindi", id: "Indonesian", vi: "Vietnamese", th: "Thai", ja: "Japanese",
      ko: "Korean", zh: "Chinese (Simplified)",
    };
    const langName = LANGUAGE_NAMES[String(language || "en")] || "English";
    const languageDirective = `

OUTPUT LANGUAGE - ABSOLUTE RULE:
- Write EVERY word of your response in ${langName}.
- This includes document titles, headings, tables, bullet lists, clarifying questions and option buttons.
- Never mix languages. Only proper nouns, brand names, code and quoted source text keep their original form.
- If the user writes in another language, still answer in ${langName}.`;

    const systemPrompt = (systemOverride || defaultSystem) + languageDirective;

    const response = await aiFetch("ai:chat",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AI_KEYS}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
          max_tokens: 16000,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("lightpaper-genius error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
