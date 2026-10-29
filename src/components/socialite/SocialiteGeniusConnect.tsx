/**
 * SOCIALITE → Accounts → Genius connection (main admin only).
 * Plug in any AI provider. The key is encrypted server-side by socialite-ai
 * and never returned — only its last 4 characters.
 */
import { useEffect, useState } from "react";
import { genius } from "@/lib/socialite/billing";

const PROVIDERS = [
  { id: "openai", label: "OpenAI", model: "gpt-4o-mini", image: "gpt-image-1" },
  { id: "gemini", label: "Google Gemini", model: "gemini-2.5-flash", image: "gemini-2.5-flash-image" },
  { id: "anthropic", label: "Anthropic Claude", model: "claude-sonnet-4-5", image: "" },
  { id: "openrouter", label: "OpenRouter", model: "openai/gpt-4o-mini", image: "" },
  { id: "groq", label: "Groq", model: "llama-3.3-70b-versatile", image: "" },
  { id: "deepseek", label: "DeepSeek", model: "deepseek-chat", image: "" },
  { id: "mistral", label: "Mistral", model: "mistral-large-latest", image: "" },
  { id: "xai", label: "xAI Grok", model: "grok-3", image: "" },
  { id: "custom", label: "Other (OpenAI-compatible)", model: "", image: "" },
];
const input = "bg-[#0f0f10] border border-zinc-800 rounded-lg px-2.5 py-2 text-[12.5px] text-zinc-100 outline-none focus:border-zinc-600 w-full";

export default function SocialiteGeniusConnect() {
  const [f, setF] = useState({ provider: "openai", base_url: "", model: "gpt-4o-mini", image_model: "gpt-image-1", key: "", enabled: true });
  const [hint, setHint] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    genius({ action: "get_config" }).then((c) => {
      if (c?.provider) setF((x) => ({ ...x, provider: c.provider, base_url: c.base_url ?? "", model: c.model ?? "", image_model: c.image_model ?? "", enabled: !!c.enabled_flag }));
      setHint(c?.key_hint ?? null);
    }).catch(() => {});
  }, []);

  const go = async (action: "save_config" | "test") => {
    setBusy(true); setMsg("");
    try {
      const r = await genius({ action, ...(action === "save_config" ? { ...f, key: f.key || undefined } : {}) });
      if (f.key) { setHint(f.key.slice(-4)); setF((x) => ({ ...x, key: "" })); }
      setMsg(r.ok ? "Connected — Genius answered." : `Saved, but the provider said: ${r.error}`);
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="rounded-[18px] border border-zinc-800 bg-[#161617] p-5 space-y-4">
      <div>
        <div className="text-[15px] font-semibold">Genius — automation helper</div>
        <div className="text-[12px] text-zinc-500 mt-1">Connect any AI provider. Genius writes posts, emails and texts, creates pictures, plans full campaigns and reads your results. Only you can change this; your customers use it through their plan.</div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-[11px] text-zinc-500">Provider
          <select className={input} value={f.provider} onChange={(e) => { const p = PROVIDERS.find((x) => x.id === e.target.value)!; setF({ ...f, provider: p.id, model: p.model, image_model: p.image }); }}>
            {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-zinc-500">API key {hint && <span className="text-zinc-400">(saved · ends {hint})</span>}
          <input type="password" autoComplete="off" className={input} placeholder={hint ? "Leave empty to keep the saved key" : "Paste the key"} value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })} />
        </label>
        <label className="text-[11px] text-zinc-500">Text model<input className={input} value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} /></label>
        <label className="text-[11px] text-zinc-500">Picture model (optional)<input className={input} value={f.image_model} onChange={(e) => setF({ ...f, image_model: e.target.value })} /></label>
        {(f.provider === "custom" || f.base_url) && <label className="text-[11px] text-zinc-500 sm:col-span-2">Address (base URL)<input className={input} placeholder="https://…/v1" value={f.base_url} onChange={(e) => setF({ ...f, base_url: e.target.value })} /></label>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button disabled={busy} onClick={() => go("save_config")} className="px-4 py-2 rounded-full bg-white text-black text-[12px] font-semibold disabled:opacity-40">{busy ? "Checking…" : "Save & check"}</button>
        <button disabled={busy} onClick={() => go("test")} className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[12px] text-zinc-200">Check again</button>
        <label className="flex items-center gap-2 text-[12px] text-zinc-400 ml-auto">
          <input type="checkbox" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} /> Genius on (save to apply)
        </label>
      </div>
      {msg && <div className="text-[12px] text-zinc-300">{msg}</div>}
    </div>
  );
}
