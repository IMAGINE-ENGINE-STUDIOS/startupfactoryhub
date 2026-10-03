import { aiFetch, aiKeysConfigured } from "../_shared/ai.ts";
// Public document translation for the Signature Suite / LightPaper.
// Preserves HTML structure and only translates human-readable text.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  it: "Italian",
  nl: "Dutch",
  pl: "Polish",
  ru: "Russian",
  uk: "Ukrainian",
  tr: "Turkish",
  ar: "Arabic",
  he: "Hebrew",
  hi: "Hindi",
  id: "Indonesian",
  vi: "Vietnamese",
  th: "Thai",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese (Simplified)",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { html, text, targetLanguage } = await req.json();
    const target = LANGUAGE_NAMES[targetLanguage] ?? targetLanguage;
    const payload = (html ?? text ?? "").toString();

    if (!payload.trim()) {
      return new Response(JSON.stringify({ translated: payload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (payload.length > 60000) {
      return new Response(JSON.stringify({ error: "Document too large to translate" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const AI_KEYS = aiKeysConfigured();
    const res = await aiFetch("ai:chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_KEYS}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a professional legal-document translator. Translate the user's content into the requested language with precise, natural, contract-grade wording. If the content is HTML, keep every tag, attribute, inline style and structure exactly as-is and translate only visible text. Never add commentary, never wrap the answer in code fences. Keep names, emails, URLs, numbers, dates and signature placeholders unchanged.",
          },
          { role: "user", content: `Target language: ${target}\n\n${payload}` },
        ],
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached, try again shortly" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const detail = await res.text();
      console.error("translate-document gateway error", res.status, detail);
      return new Response(JSON.stringify({ error: "Translation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    let translated: string = data?.choices?.[0]?.message?.content ?? "";
    translated = translated.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();

    return new Response(JSON.stringify({ translated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-document error", e);
    return new Response(JSON.stringify({ error: "Translation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
