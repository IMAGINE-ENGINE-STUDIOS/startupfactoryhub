// Credits: Imagine Engine Studios Corp.
// Direct-provider AI client. Uses OPENAI_API_KEY, GROQ_API_KEY and GEMINI_API_KEY from
// Supabase secrets. No Lovable gateway. `aiFetch` is a drop-in replacement for the old
// OpenAI-style chat-completions fetch so existing callers keep their request/response shapes.

export type Tier = "fast" | "standard" | "vision" | "heavy" | "free" | "llama";
export type Provider = "groq" | "gemini" | "openai" | "ollama";

const URLS: Record<Provider, string> = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  openai: "https://api.openai.com/v1/chat/completions",
  ollama: "", // resolved from OLLAMA_BASE_URL at call time
};
const SECRETS: Record<Provider, string> = { groq: "GROQ_API_KEY", gemini: "GEMINI_API_KEY", openai: "OPENAI_API_KEY", ollama: "OLLAMA_API_KEY" };

// Self-hosted Ollama (OpenAI-compatible /v1/chat/completions), e.g. the user's own
// GPU box behind a tunnel. Empty = provider skipped silently.
const ollamaUrl = () => {
  const base = (Deno.env.get("OLLAMA_BASE_URL") || "").replace(/\/+$/, "");
  return base ? `${base}/chat/completions` : "";
};

export const CHAINS: Record<Tier, [Provider, string][]> = {
  fast: [["groq", "openai/gpt-oss-20b"], ["groq", "llama-3.3-70b-versatile"], ["gemini", "gemini-2.5-flash-lite"], ["gemini", "gemini-2.0-flash"], ["openai", "gpt-4o-mini"]],
  standard: [["groq", "openai/gpt-oss-120b"], ["groq", "llama-3.3-70b-versatile"], ["gemini", "gemini-2.5-flash"], ["gemini", "gemini-2.0-flash"], ["openai", "gpt-4o-mini"]],
  vision: [["groq", "qwen/qwen3.8-27b"], ["gemini", "gemini-2.5-flash"], ["gemini", "gemini-2.0-flash"], ["openai", "gpt-4o-mini"]],
  heavy: [["openai", "gpt-4.1"], ["gemini", "gemini-2.5-pro"], ["gemini", "gemini-2.5-flash"]],
  // Groq free-plan models only (no paid OpenAI hop).
  free: [["groq", "openai/gpt-oss-120b"], ["groq", "openai/gpt-oss-20b"], ["groq", "llama-3.3-70b-versatile"], ["groq", "qwen/qwen3.8-27b"], ["gemini", "gemini-2.5-flash"]],
  // Llama: self-hosted Ollama first (free when OLLAMA_BASE_URL is set), then Groq-hosted.
  llama: [["ollama", "llama3.1:8b"], ["groq", "llama-3.3-70b-versatile"], ["groq", "llama-3.1-8b-instant"]],
};

// USD per 1M tokens [input, output] — provider list prices.
export const PRICES: Record<string, [number, number]> = {
  "openai/gpt-oss-20b": [0.075, 0.3],
  "openai/gpt-oss-120b": [0.15, 0.6],
  "llama-3.3-70b-versatile": [0.59, 0.79],
  "qwen/qwen3.8-27b": [0.8, 4],
  "gemini-2.5-flash-lite": [0.1, 0.4],
  "gemini-2.0-flash": [0.1, 0.4],
  "gemini-2.5-flash": [0.3, 2.5],
  "gemini-2.5-pro": [1.25, 10],
  "gpt-4o-mini": [0.15, 0.6],
  "gpt-4.1": [2, 8],
  "llama-3.1-8b-instant": [0.05, 0.08],
  "llama3.1:8b": [0, 0], // self-hosted: no provider cost
};
export const costUsd = (model: string, inTok: number, outTok: number) => {
  const p = PRICES[model] || [2, 10];
  return (inTok * p[0] + outTok * p[1]) / 1_000_000;
};

const keyOf = (p: Provider) => Deno.env.get(SECRETS[p]) || "";
/** Truthy when at least one direct provider key is configured. */
export const aiKeysConfigured = () => (keyOf("groq") || keyOf("gemini") || keyOf("openai") || ollamaUrl() ? "direct" : "");

const jsonResp = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

const hasImages = (messages: any[]) =>
  (messages || []).some((m) => Array.isArray(m?.content) && m.content.some((c: any) => c?.type === "image_url"));

function tierFor(model: string, messages: any[]): Tier {
  if (hasImages(messages)) return "vision";
  if (/llama/i.test(model)) return "llama";
  if (/lite|8b|instant|20b/.test(model)) return "fast";
  return "standard";
}

const RETRY = new Set([400, 401, 403, 404, 408, 413, 429, 500, 502, 503, 504]);

export interface RouteResult { resp: Response; provider: Provider | null; model: string }

/** Calls the tier's provider chain, falling back on missing keys / 413 / 429 / 5xx. */
export async function routeChat(tier: Tier, body: Record<string, unknown>, keyOverrides: Partial<Record<Provider, string>> = {}, selected?: { provider: Provider; model: string }): Promise<RouteResult> {
  const clean: Record<string, unknown> = { ...body };
  delete clean.modalities; delete clean.reasoning_effort; delete clean.reasoning; delete clean.provider;
  let last: RouteResult | null = null;
  const chain: [Provider, string][] = selected ? [[selected.provider, selected.model]] : CHAINS[tier];
  for (const [prov, model] of chain) {
    const url = prov === "ollama" ? ollamaUrl() : URLS[prov];
    const key = keyOf(prov) || String(keyOverrides[prov] || "");
    if (!url || (!key && prov !== "ollama")) { console.warn(`[ai] skip ${prov}/${model}: no url/key`); continue; }
    const payload: Record<string, unknown> = { ...clean, model };
    if (prov === "openai" && payload.max_tokens) { payload.max_completion_tokens = payload.max_tokens; delete payload.max_tokens; }
    if (prov === "groq" && Number(payload.max_tokens) > 8000) payload.max_tokens = 8000;
    if (prov === "groq" && /gpt-oss|qwen/.test(model)) { payload.reasoning_format = "hidden"; if (/gpt-oss/.test(model)) { delete payload.reasoning_format; payload.include_reasoning = false; } }
    if (payload.stream) payload.stream_options = { include_usage: true };
    if (prov === "gemini") delete payload.stream_options;
    try {
      const send = () => fetch(url, {
        method: "POST",
        headers: key ? { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let resp = await send();
      // rate limited: wait the provider's suggested time (max 6s) and try the same model once more
      if (resp.status === 429) {
        const ra = Number(resp.headers.get("retry-after")) || 2;
        console.warn(`[ai] ${prov}/${model} 429, retrying in ${Math.min(ra, 6)}s`);
        await new Promise((r) => setTimeout(r, Math.min(ra, 6) * 1000));
        resp = await send();
      }
      if (resp.ok) return { resp, provider: prov, model };
      last = { resp, provider: prov, model };
      if (!RETRY.has(resp.status)) return last;
      console.warn(`[ai] ${prov}/${model} ${resp.status}: ${(await resp.clone().text()).slice(0, 300)}`);
    } catch (e) {
      console.warn(`[ai] ${prov}/${model} network error`, e);
    }
  }
  return last || { resp: jsonResp({ error: "AI provider keys are not configured" }, 503), provider: null, model: "" };
}

async function toInline(url: string): Promise<{ mime: string; data: string }> {
  const m = url.match(/^data:([^;]+);base64,(.+)$/);
  if (m) return { mime: m[1], data: m[2] };
  const r = await fetch(url);
  const buf = new Uint8Array(await r.arrayBuffer());
  let s = ""; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { mime: r.headers.get("content-type") || "image/png", data: btoa(s) };
}

async function geminiParts(messages: any[]) {
  const parts: any[] = [];
  for (const m of messages || []) {
    if (typeof m.content === "string") parts.push({ text: m.content });
    else for (const c of m.content || []) {
      if (c.type === "text") parts.push({ text: c.text });
      else if (c.type === "image_url") { const i = await toInline(c.image_url?.url || ""); parts.push({ inline_data: { mime_type: i.mime, data: i.data } }); }
    }
  }
  return parts;
}

/** Image generation / editing — Gemini image model, OpenAI gpt-image-1 fallback (generation only). */
async function imageRequest(body: any): Promise<Response> {
  const gk = keyOf("gemini");
  if (gk) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${gk}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: await geminiParts(body.messages) }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }),
    });
    if (r.ok) {
      const d = await r.json();
      const ps = d.candidates?.[0]?.content?.parts || [];
      const img = ps.find((p: any) => p.inlineData || p.inline_data);
      const inl = img?.inlineData || img?.inline_data;
      const text = ps.filter((p: any) => p.text).map((p: any) => p.text).join("");
      return jsonResp({ choices: [{ message: { role: "assistant", content: text, images: inl ? [{ type: "image_url", image_url: { url: `data:${inl.mimeType || inl.mime_type};base64,${inl.data}` } }] : [] } }] });
    }
    if (!RETRY.has(r.status) || !keyOf("openai")) return r;
  }
  const ok = keyOf("openai");
  if (!ok) return jsonResp({ error: "AI provider keys are not configured" }, 503);
  const prompt = (body.messages || []).map((m: any) => typeof m.content === "string" ? m.content : (m.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ")).join("\n");
  const r = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST", headers: { Authorization: `Bearer ${ok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024" }),
  });
  if (!r.ok) return r;
  const d = await r.json();
  const b64 = d.data?.[0]?.b64_json;
  return jsonResp({ choices: [{ message: { role: "assistant", content: "", images: b64 ? [{ type: "image_url", image_url: { url: `data:image/png;base64,${b64}` } }] : [] } }] });
}

/** Live web search grounding via Gemini's google_search tool. */
async function searchRequest(body: any): Promise<Response> {
  const gk = keyOf("gemini");
  if (!gk) return (await routeChat("standard", { messages: body.messages })).resp;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${gk}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: await geminiParts(body.messages) }], tools: [{ google_search: {} }] }),
  });
  if (!r.ok) return r;
  const d = await r.json();
  const text = (d.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || "").join("");
  return jsonResp({ choices: [{ message: { role: "assistant", content: text } }] });
}

/** Responses-API style call (input string, streamed output_text deltas) served by the chat router. */
async function responsesRequest(body: any): Promise<Response> {
  const messages = typeof body.input === "string" ? [{ role: "user", content: body.input }] : body.input;
  const { resp } = await routeChat(/mini|nano|luna/.test(String(body.model)) ? "fast" : "standard", { messages });
  if (!resp.ok) return resp;
  const d = await resp.json();
  const text = d.choices?.[0]?.message?.content ?? "";
  if (!body.stream) return jsonResp({ output_text: text });
  const sse = `data: ${JSON.stringify({ type: "response.output_text.delta", delta: text })}\n\ndata: ${JSON.stringify({ type: "response.completed", response: { output_text: text } })}\n\ndata: [DONE]\n\n`;
  return new Response(sse, { headers: { "Content-Type": "text/event-stream" } });
}

/**
 * Drop-in replacement for `fetch(<old gateway url>, init)`. Reads the OpenAI-style body,
 * picks a tier from the requested model, and routes to the direct providers.
 */
export async function aiFetch(url: string, init: RequestInit & { tier?: Tier } = {}): Promise<Response> {
  const body = JSON.parse(String(init.body || "{}"));
  if (String(url).includes("/responses")) return responsesRequest(body);
  const model = String(body.model || "");
  if (/image/.test(model) || (Array.isArray(body.modalities) && body.modalities.includes("image"))) return imageRequest(body);
  if (Array.isArray(body.tools) && body.tools.some((t: any) => t?.type === "google_search")) return searchRequest(body);
  return (await routeChat(init.tier || tierFor(model, body.messages), body)).resp;
}
