// SOCIALITE "Genius" — the automation helper. The main admin plugs in ANY AI
// provider (OpenAI-compatible, Anthropic or Google Gemini) from Accounts; the
// key is AES-GCM encrypted (SOCIALITE_ENC_KEY) and never leaves the server.
// Every paying user can then use it; tokens/images are metered through
// _shared/socialiteBilling.ts according to the admin's AI revenue model.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, decrypt, encrypt, requireUser } from "../_shared/socialiteVault.ts";
import { meter } from "../_shared/socialiteBilling.ts";
import { loadKnowledge } from "../_shared/socialiteKnowledge.ts";
import { loadConfig, rulesForGenius } from "../_shared/socialiteShield.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const DEFAULT_BASE: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  deepseek: "https://api.deepseek.com/v1",
  mistral: "https://api.mistral.ai/v1",
  xai: "https://api.x.ai/v1",
  anthropic: "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
};

const Body = z.object({
  action: z.enum(["get_config", "save_config", "test", "generate", "image"]),
  provider: z.enum(["openai", "openrouter", "groq", "deepseek", "mistral", "xai", "anthropic", "gemini", "custom"]).optional(),
  base_url: z.string().url().max(300).optional().or(z.literal("")),
  model: z.string().max(120).optional(),
  image_model: z.string().max(120).optional(),
  key: z.string().max(500).optional(),
  enabled: z.boolean().optional(),
  task: z.enum(["post", "campaign", "analyse", "hashtags", "reply", "rewrite", "email", "sms"]).optional(),
  prompt: z.string().max(6000).optional(),
  context: z.string().max(20000).optional(),
  platforms: z.array(z.string().max(20)).max(10).optional(),
});

const SYSTEM: Record<string, string> = {
  post: "You write high-performing social media posts. Return only the post text, adapted to the platforms named, with a strong hook, clear call to action and up to 5 relevant hashtags. No preamble.",
  hashtags: "Return 15 relevant, well-mixed hashtags (broad + niche) for the post, space-separated, nothing else.",
  rewrite: "Rewrite the text to be sharper and more engaging, same meaning, same language. Return only the text.",
  reply: "Write a warm, professional, short reply to the comment or message. Return only the reply.",
  email: "Write a marketing email. First line 'Subject: ...', then a blank line, then the body in plain text with short paragraphs and one clear call to action.",
  sms: "Write an SMS under 300 characters with one clear call to action. Return only the SMS text.",
  analyse: "You are a social media and messaging analyst. From the performance data given, explain in plain language what works, what does not, and give 5 concrete, prioritised actions (best times, platforms, content types, channels). Use short headings and bullets.",
  campaign: `You plan complete multi-channel marketing campaigns. Reply with ONLY valid JSON of this shape:
{"name":string,"goal":string,"audience":string,"summary":string,
 "posts":[{"day":number,"time":"HH:MM","platforms":[string],"text":string,"image_prompt":string}],
 "emails":[{"day":number,"subject":string,"body":string}],
 "sms":[{"day":number,"text":string}]}
Days start at 1. Platforms are from: facebook, instagram, threads, x, tiktok, youtube.`,
};

async function loadConfig(withKey = false) {
  const { data } = await admin().from("socialite_ai_config").select("*").eq("id", 1).maybeSingle();
  if (!data) return null;
  return { ...data, key: withKey && data.key_cipher ? await decrypt(data.key_cipher) : undefined };
}

async function chat(cfg: any, system: string, user: string, jsonMode = false, imgs: string[] = []) {
  const base = (cfg.base_url || DEFAULT_BASE[cfg.provider] || "").replace(/\/$/, "");
  if (cfg.provider === "anthropic") {
    const r = await fetch(`${base}/messages`, {
      method: "POST",
      headers: { "x-api-key": cfg.key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: cfg.model, max_tokens: 4000, system, messages: [{ role: "user", content: imgs.length ? [...imgs.map((url) => ({ type: "image", source: { type: "url", url } })), { type: "text", text: user }] : user }] }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message ?? `Provider error ${r.status}`);
    return { text: (d.content ?? []).map((c: any) => c.text ?? "").join(""), tokens: (d.usage?.input_tokens ?? 0) + (d.usage?.output_tokens ?? 0) };
  }
  if (cfg.provider === "gemini") {
    const r = await fetch(`${base}/models/${cfg.model}:generateContent?key=${encodeURIComponent(cfg.key)}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: jsonMode ? { responseMimeType: "application/json" } : {} }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message ?? `Provider error ${r.status}`);
    return { text: (d.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join(""), tokens: d.usageMetadata?.totalTokenCount ?? 0 };
  }
  const r = await fetch(`${base}/chat/completions`, {
    method: "POST", headers: { Authorization: `Bearer ${cfg.key}`, "content-type": "application/json" },
    body: JSON.stringify({ model: cfg.model, messages: [{ role: "system", content: system }, { role: "user", content: imgs.length ? [...imgs.map((url) => ({ type: "image_url", image_url: { url } })), { type: "text", text: user }] : user }], ...(jsonMode ? { response_format: { type: "json_object" } } : {}) }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message ?? `Provider error ${r.status}`);
  return { text: d.choices?.[0]?.message?.content ?? "", tokens: d.usage?.total_tokens ?? 0 };
}

async function image(cfg: any, prompt: string): Promise<Uint8Array> {
  const base = (cfg.base_url || DEFAULT_BASE[cfg.provider] || "").replace(/\/$/, "");
  const model = cfg.image_model;
  if (!model) throw new Error("No image model set in Accounts → Genius");
  if (cfg.provider === "gemini") {
    const r = await fetch(`${base}/models/${model}:generateContent?key=${encodeURIComponent(cfg.key)}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["IMAGE", "TEXT"] } }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message ?? `Provider error ${r.status}`);
    const part = (d.candidates?.[0]?.content?.parts ?? []).find((p: any) => p.inlineData?.data);
    if (!part) throw new Error("The provider returned no image");
    return Uint8Array.from(atob(part.inlineData.data), (c) => c.charCodeAt(0));
  }
  if (cfg.provider === "anthropic") throw new Error("Anthropic does not create images — set an image-capable provider");
  const r = await fetch(`${base}/images/generations`, {
    method: "POST", headers: { Authorization: `Bearer ${cfg.key}`, "content-type": "application/json" },
    body: JSON.stringify({ model, prompt, size: "1024x1024", n: 1 }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message ?? `Provider error ${r.status}`);
  const item = d.data?.[0];
  if (item?.b64_json) return Uint8Array.from(atob(item.b64_json), (c) => c.charCodeAt(0));
  if (item?.url) return new Uint8Array(await (await fetch(item.url)).arrayBuffer());
  throw new Error("The provider returned no image");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if ("error" in auth) return json({ error: auth.error }, auth.status);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Invalid request" }, 400);
    const b = parsed.data;
    const db = admin();

    if (b.action === "get_config") {
      const c = await loadConfig();
      const pub = { enabled: !!c?.enabled && !!c?.key_cipher, provider: c?.provider ?? null };
      if (!auth.isAdmin) return json(pub);
      return json({ ...pub, base_url: c?.base_url ?? "", model: c?.model ?? "", image_model: c?.image_model ?? "", key_hint: c?.key_hint ?? null, configured: !!c?.key_cipher, enabled_flag: !!c?.enabled });
    }

    if (b.action === "save_config" || b.action === "test") {
      if (!auth.isAdmin) return json({ error: "Admins only" }, 403);
      if (b.action === "save_config") {
        const row: Record<string, unknown> = { id: 1, updated_at: new Date().toISOString() };
        if (b.provider) row.provider = b.provider;
        if (b.base_url !== undefined) row.base_url = b.base_url || null;
        if (b.model !== undefined) row.model = b.model;
        if (b.image_model !== undefined) row.image_model = b.image_model || null;
        if (b.enabled !== undefined) row.enabled = b.enabled;
        if (b.key) { row.key_cipher = await encrypt(b.key.trim()); row.key_hint = b.key.trim().slice(-4); }
        await db.from("socialite_ai_config").upsert(row, { onConflict: "id" });
      }
      const cfg = await loadConfig(true);
      if (!cfg?.key || !cfg.model) return json({ ok: false, error: "Add a key and a model first" });
      try {
        const r = await chat(cfg, "Reply with the single word: ready", "ping");
        return json({ ok: true, reply: r.text.slice(0, 40) });
      } catch (e) {
        return json({ ok: false, error: (e as Error).message });
      }
    }

    const cfg = await loadConfig(true);
    if (!cfg?.enabled || !cfg.key || !cfg.model) return json({ error: "Genius is not connected yet" }, 503);

    if (b.action === "generate") {
      const task = b.task ?? "post";
      const pre = await meter(auth.userId, auth.isAdmin, "ai_tokens", 2000, { task }, true);
      if (!pre.ok) return json({ error: pre.reason, billing: true }, 402);
      const userMsg = [
        b.prompt ?? "",
        b.platforms?.length ? `Platforms: ${b.platforms.join(", ")}` : "",
        b.context ? `Context / data:\n${b.context}` : "",
      ].filter(Boolean).join("\n\n");
      const kn = await loadKnowledge(auth.userId);
      const sys = `${SYSTEM[task]}\n\n${rulesForGenius(await loadConfig())}${kn.text ? `\n\n${kn.text}` : ""}`;
      let r;
      try { r = await chat(cfg, sys, userMsg || "Write something useful.", task === "campaign", cfg.provider === "gemini" ? [] : kn.images); }
      catch { r = await chat(cfg, sys, userMsg || "Write something useful.", task === "campaign"); } // provider without picture support
      const tokens = r.tokens || Math.ceil((userMsg.length + r.text.length) / 4);
      const m = await meter(auth.userId, auth.isAdmin, "ai_tokens", tokens, { task });
      let campaign = null;
      if (task === "campaign") {
        try { campaign = JSON.parse(r.text.replace(/^```(json)?/i, "").replace(/```$/, "").trim()); } catch { /* shown as text */ }
      }
      return json({ text: r.text, campaign, tokens, credits: m.ok ? m.credits : 0 });
    }

    if (b.action === "image") {
      if (!b.prompt) return json({ error: "Describe the picture" }, 400);
      const pre = await meter(auth.userId, auth.isAdmin, "ai_image", 1, {}, true);
      if (!pre.ok) return json({ error: pre.reason, billing: true }, 402);
      const kn = await loadKnowledge(auth.userId, 0);
      const bytes = await image(cfg, kn.text ? `${b.prompt}\n\nFollow these saved rules:\n${kn.text}`.slice(0, 3900) : b.prompt);
      const path = `socialite-genius/${auth.userId}/${crypto.randomUUID()}.png`;
      const up = await db.storage.from("gallery-files").upload(path, bytes, { contentType: "image/png" });
      if (up.error) throw new Error(up.error.message);
      const url = db.storage.from("gallery-files").getPublicUrl(path).data.publicUrl;
      const m = await meter(auth.userId, auth.isAdmin, "ai_image", 1, { path });
      return json({ url, credits: m.ok ? m.credits : 0 });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
