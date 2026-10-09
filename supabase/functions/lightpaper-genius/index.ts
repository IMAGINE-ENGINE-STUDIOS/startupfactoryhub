import { routeChat, aiKeysConfigured } from "../_shared/ai.ts";
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

    const { messages, systemOverride, language, document: doc } = await req.json();
    const AI_KEYS = aiKeysConfigured();
    if (!AI_KEYS)
      throw new Error("AI provider keys are not configured");

    const defaultSystem = `You are **Genius AI**, a writing assistant in LightPaper.

RULES:
1. START WRITING IMMEDIATELY. Do not ask clarifying questions when the topic is known — pick sensible defaults (professional tone, general business audience, appropriate length) and write the full document right away.
2. Only if the request has NO topic at all (e.g. "write something"), ask ONE short question with options "A) ... B) ... C) ..." and nothing else.
3. Begin a long document with one italic line stating the assumptions you used (e.g. "*Assumed: investor audience, formal tone, ~2500 words — ask me to adjust.*"), then the document.
4. Write the FULL document — extensive, thorough, 2000+ words unless the user specifies a length.
5. DOCUMENT STRUCTURE IS MANDATORY: "# Title" once, then abstract, then "## Section" / "### Sub-section" headings. Full prose paragraphs (3-6 sentences), Markdown tables with header rows for data, lists only for real lists, "> " for quotes. No conversational filler, no emojis, no meta commentary — output document content only.
6. For very long works (books, 10+ chapters), give a numbered outline first and then write chapter 1 fully in the same answer.
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

    const docContext = doc && typeof doc === "object"
      ? `

OPEN DOCUMENT (your memory of the file the user is editing):
Title: ${String(doc.title || "Untitled").slice(0, 200)}
Words: ${Number(doc.words) || 0}
${doc.selection ? `SELECTED TEXT:\n"""${String(doc.selection).slice(0, 8000)}"""\n` : ""}FULL TEXT:
"""${String(doc.text || "").slice(0, 60000)}"""`
      : "";

    const formatRules = `

PROFESSIONAL FORMAT RULES (ABSOLUTE):
- Output clean Markdown only: "# " title, "## " / "### " headings, plain paragraphs, "- " or "1. " lists, Markdown tables, "> " quotes, **bold** only for key terms.
- Never output stray asterisks, decorative symbols, emojis, horizontal lines of symbols, HTML tags, code fences, or chat filler like "Sure!", "Here is", "I hope this helps".
- When rewriting, fixing or translating, return ONLY the resulting document content, preserving structure, headings, lists and tables.
- When answering a question about the document, answer briefly in plain sentences.`;

    const systemPrompt = (systemOverride || defaultSystem) + formatRules + docContext + languageDirective;

    const { resp: response } = await routeChat("free", {
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: 8000,
    });

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
