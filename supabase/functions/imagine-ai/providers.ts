// Credits: Imagine Engine Studios Corp. Admin-configured direct providers only.
import { routeChat, type Provider, type Tier } from "../_shared/ai.ts";

export type CustomProvider = { id: string; name: string; base_url: string; kind: "openai" | "anthropic" | "ollama"; models: string[] };
export const PROVIDERS: Record<string, { secret: string; url: string; kind: "openai" | "anthropic" | "ollama" }> = {
  groq: { secret: "GROQ_API_KEY", url: "https://api.groq.com/openai/v1/chat/completions", kind: "openai" },
  gemini: { secret: "GEMINI_API_KEY", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", kind: "openai" },
  openai: { secret: "OPENAI_API_KEY", url: "https://api.openai.com/v1/chat/completions", kind: "openai" },
  brain: { secret: "CLOUDFLARE_API_TOKEN", url: "https://genius-brain.nameless-tree-0e27.workers.dev/v1/chat/completions", kind: "openai" },
  xai: { secret: "XAI_API_KEY", url: "https://api.x.ai/v1/chat/completions", kind: "openai" },
  anthropic: { secret: "ANTHROPIC_API_KEY", url: "https://api.anthropic.com/v1/messages", kind: "anthropic" },
};

export function validEndpoint(value: unknown): boolean {
  try {
    const u = new URL(String(value));
    const h = u.hostname.toLowerCase();
    return u.protocol === "https:" && !u.username && !u.password && !u.search && !u.hash &&
      !h.includes(":") && !h.startsWith("[") && !/^\d+(\.\d+)*$/.test(h) &&
      h.includes(".") && !/(^|\.)(localhost|local|internal|test|invalid)$/.test(h) && !h.endsWith(".localhost");
  } catch { return false; }
}
export function validCustom(list: unknown): list is CustomProvider[] {
  if (!Array.isArray(list) || list.length > 20) return false;
  const ids = new Set<string>();
  return list.every((p) => {
    if (!p || !/^[a-z0-9_-]{2,30}$/.test(p.id) || PROVIDERS[p.id] || ["router", "lovable"].includes(p.id) || ids.has(p.id) || !validEndpoint(p.base_url) ||
        !["openai", "anthropic", "ollama"].includes(p.kind) || !Array.isArray(p.models) || !p.models.every((m: unknown) => typeof m === "string" && m.length > 0 && m.length <= 200)) return false;
    ids.add(p.id); return true;
  });
}

type Settings = { provider: string; model: string; custom_providers: CustomProvider[] };
export function validateSelection(settings: Settings): string | null {
  if (["router", "lovable"].includes(settings.provider)) return null; // legacy gateway setting becomes direct router
  if (!PROVIDERS[settings.provider] && !settings.custom_providers.some((p) => p.id === settings.provider)) return "Unknown provider";
  if (typeof settings.model !== "string" || !settings.model.trim() || settings.model.length > 200) return "Select a model for this provider";
  return null;
}

async function publicHost(url: string): Promise<void> {
  if (!validEndpoint(url)) throw new Error("Custom providers require a public HTTPS address");
  const h = new URL(url).hostname;
  const addresses = await Promise.all([
    Deno.resolveDns(h, "A").catch(() => [] as string[]),
    Deno.resolveDns(h, "AAAA").catch(() => [] as string[]),
  ]);
  const all = addresses.flat();
  if (!all.length || all.some((a) => /^(0\.|10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|198\.(18|19)\.|22[4-9]\.|23\d\.|24\d\.|25[0-5]\.|::|f[cd]|fe[89ab]|.*::ffff:)/i.test(a))) {
    throw new Error("Custom providers cannot access private network addresses");
  }
}

export async function configuredChat(tier: Tier, body: Record<string, unknown>, settings: Settings, keys: Record<string, string>) {
  const error = validateSelection(settings);
  if (error) throw new Error(error);
  const overrides = { groq: keys.groq, gemini: keys.gemini, openai: keys.openai };
  if (["router", "lovable"].includes(settings.provider)) return routeChat(tier, body, overrides);
  if (["groq", "gemini", "openai"].includes(settings.provider)) {
    return routeChat(tier, body, overrides, { provider: settings.provider as Provider, model: settings.model });
  }
  const builtin = PROVIDERS[settings.provider];
  const custom = settings.custom_providers.find((p) => p.id === settings.provider);
  const kind = builtin?.kind || custom?.kind;
  const base = (builtin?.url || custom?.base_url || "").replace(/\/+$/, "");
  const key = (builtin ? Deno.env.get(builtin.secret) : "") || keys[settings.provider];
  if (!key) return { resp: new Response(JSON.stringify({ error: "Selected provider key is not configured" }), { status: 503 }), provider: settings.provider, model: settings.model };
  let url = base;
  const suffix = kind === "anthropic" ? "/messages" : kind === "ollama" ? "/api/chat" : "/chat/completions";
  if (!url.endsWith(suffix)) url += suffix;
  if (custom) await publicHost(url);
  const messages = body.messages as { role: string; content: string }[];
  const payload: Record<string, unknown> = { ...body, model: settings.model, stream: !!body.stream };
  const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${key}` };
  if (kind === "anthropic") {
    headers["x-api-key"] = key; headers["anthropic-version"] = "2023-06-01";
    delete payload.stream_options; delete payload.response_format;
    payload.system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
    payload.messages = messages.filter((m) => m.role !== "system");
  } else if (kind === "ollama") {
    delete payload.max_tokens; delete payload.stream_options; delete payload.response_format;
    payload.options = { num_predict: body.max_tokens };
  }
  const send = () => fetch(url, { method: "POST", headers, body: JSON.stringify(payload), redirect: "error", signal: AbortSignal.timeout(120000) });
  // Jobs 4+5 remainder: this direct path (brain / xai / anthropic / custom
  // pins) used to be a single shot — one outage or 429 on the pinned model
  // killed the build. Give it the same policy routeChat has: on a retryable
  // failure (429, 5xx, network error) retry the pin once, honoring
  // retry-after (capped 6s); if it still fails, fall through to the tier's
  // normal chain instead of surfacing the failure. The pin takes over again
  // automatically when it serves. Non-retryable failures (e.g. 400/401) keep
  // the old behavior and are returned as-is; success is untouched.
  const retryable = (s: number) => s === 429 || s >= 500;
  let resp: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try { resp = await send(); } catch { resp = null; }
    if (resp?.ok) break;
    if (resp && !retryable(resp.status)) break;
    if (attempt === 1) break;
    const wait = Math.min((resp ? Number(resp.headers.get("retry-after")) : NaN) || 2, 6);
    console.warn(`[imagine-ai] pinned ${settings.provider}/${settings.model} ${resp ? resp.status : "network error"}, retrying in ${wait}s`);
    if (resp) { try { await resp.body?.cancel(); } catch { /* best effort */ } }
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
  if (!resp || (!resp.ok && retryable(resp.status))) {
    console.warn(`[imagine-ai] pinned ${settings.provider}/${settings.model} unavailable, falling through to the ${tier} chain`);
    return routeChat(tier, body, overrides);
  }
  if (!resp.ok || kind === "openai" || body.stream) return { resp, provider: settings.provider, model: settings.model };
  const data = await resp.json();
  const content = kind === "ollama" ? data.message?.content : (data.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("");
  const normalized = { choices: [{ message: { content } }], usage: {
    prompt_tokens: kind === "ollama" ? data.prompt_eval_count || 0 : data.usage?.input_tokens || 0,
    completion_tokens: kind === "ollama" ? data.eval_count || 0 : data.usage?.output_tokens || 0,
  } };
  return { resp: new Response(JSON.stringify(normalized), { headers: { "Content-Type": "application/json" } }), provider: settings.provider, model: settings.model };
}