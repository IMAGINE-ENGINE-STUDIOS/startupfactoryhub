// Free speech-to-text for Live Video captions: Groq Whisper (free tier), OpenAI Whisper as backup.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size < 1000) return json({ text: "" });
    if (audio.size > 20_000_000) return json({ error: "Chunk too large" }, 400);
    const lang = String(form.get("lang") || "").slice(0, 2);
    const tries: [string, string, string | undefined][] = [
      ["https://api.groq.com/openai/v1/audio/transcriptions", "whisper-large-v3-turbo", Deno.env.get("GROQ_API_KEY")],
      ["https://api.openai.com/v1/audio/transcriptions", "whisper-1", Deno.env.get("OPENAI_API_KEY")],
    ];
    let last = "No transcription key configured";
    for (const [url, model, key] of tries) {
      if (!key) continue;
      const fd = new FormData();
      fd.append("file", audio, audio.name || "chunk.webm");
      fd.append("model", model);
      fd.append("response_format", "json");
      if (/^[a-z]{2}$/.test(lang)) fd.append("language", lang);
      const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: fd });
      if (r.ok) { const d = await r.json(); return json({ text: String(d.text || "").trim() }); }
      last = `[${r.status}] ${await r.text()}`;
      console.error("transcribe failed", model, last);
    }
    return json({ error: last }, 502);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
