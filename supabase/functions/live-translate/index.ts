// Free transcript translation for Live Video: the platform's own AI keys
// (Groq first, then Gemini, then OpenAI — the same providers as _shared/ai.ts).
// No credits are charged; this runs on the platform's existing AI setup.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const LANGS: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", pt: "Portuguese", de: "German",
  it: "Italian", nl: "Dutch", ar: "Arabic", hi: "Hindi", zh: "Chinese (Simplified)",
  ja: "Japanese", ko: "Korean", ru: "Russian", tr: "Turkish", pl: "Polish",
  uk: "Ukrainian", vi: "Vietnamese", id: "Indonesian", tl: "Tagalog", th: "Thai",
  sv: "Swedish", el: "Greek", he: "Hebrew", fa: "Persian",
};

async function chatComplete(messages: { role: string; content: string }[]): Promise<string | null> {
  const groq = Deno.env.get("GROQ_API_KEY");
  if (groq) {
    for (const model of ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]) {
      try {
        const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${groq}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages, temperature: 0 }),
        });
        if (r.ok) { const d = await r.json(); const t = String(d?.choices?.[0]?.message?.content || "").trim(); if (t) return t; }
        else console.error("translate groq", model, r.status, await r.text());
      } catch (e) { console.error("translate groq", model, e); }
    }
  }
  const gem = Deno.env.get("GEMINI_API_KEY");
  if (gem) {
    for (const model of ["gemini-2.5-flash-lite", "gemini-2.0-flash"]) {
      try {
        const prompt = messages.map((m) => m.content).join("\n\n");
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${gem}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0 } }),
        });
        if (r.ok) { const d = await r.json(); const t = String(d?.candidates?.[0]?.content?.parts?.map((x: any) => x.text || "").join("") || "").trim(); if (t) return t; }
        else console.error("translate gemini", model, r.status, await r.text());
      } catch (e) { console.error("translate gemini", model, e); }
    }
  }
  const oai = Deno.env.get("OPENAI_API_KEY");
  if (oai) {
    try {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${oai}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini", messages, temperature: 0 }),
      });
      if (r.ok) { const d = await r.json(); const t = String(d?.choices?.[0]?.message?.content || "").trim(); if (t) return t; }
      else console.error("translate openai", r.status, await r.text());
    } catch (e) { console.error("translate openai", e); }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const target = LANGS[String(body.target || "").slice(0, 2)];
    if (!target) return json({ error: "Unknown target language" }, 400);
    const texts = (Array.isArray(body.texts) ? body.texts : []).slice(0, 40).map((t: unknown) => String(t ?? "").slice(0, 1000));
    if (!texts.length) return json({ translations: [] });

    const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join("\n");
    const out = await chatComplete([
      { role: "system", content: `You are a translation engine for a live meeting transcript. Translate each numbered line into ${target}. Keep speaker names, numbers and formatting as-is. If a line is already in ${target}, return it unchanged. Return ONLY a JSON array of strings, one per line, in order — no commentary, no markdown fences.` },
      { role: "user", content: numbered },
    ]);
    if (!out) return json({ error: "Translation unavailable" }, 502);

    let arr: unknown = null;
    try { arr = JSON.parse(out.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "")); } catch { /* fall through */ }
    if (!Array.isArray(arr) || arr.length !== texts.length) {
      // Fallback: one translation per line, split by lines.
      const lines = out.split("\n").map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim()).filter(Boolean);
      if (lines.length === texts.length) arr = lines;
    }
    if (!Array.isArray(arr)) return json({ error: "Bad translation shape" }, 502);
    return json({ translations: arr.map((t) => String(t ?? "")) });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
