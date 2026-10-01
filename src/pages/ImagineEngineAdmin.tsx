import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Cpu, DollarSign, Activity, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/imagine-engine-logo.png.asset.json";

type Config = {
  provider: string; model: string; pricing_mode: string;
  cost_per_1k_input: number; cost_per_1k_output: number; markup_multiplier: number;
  flat_fee_monthly: number; monthly_token_limit: number; daily_message_limit: number;
  enabled: boolean; system_prompt_extra: string;
};
type Stats = { requests: number; input_tokens: number; output_tokens: number; cost_usd: number; charge_usd: number; active_users: number };

const MODELS: Record<string, string[]> = {
  lovable: ["openai/gpt-6-astra", "google/gemini-3-flash-preview", "google/gemini-3-pro-preview", "anthropic/claude-sonnet-5"],
  openai: ["gpt-5", "gpt-5-mini", "gpt-4.1"],
  anthropic: ["claude-sonnet-4-5", "claude-opus-4-1", "claude-haiku-4-5"],
  xai: ["grok-4", "grok-4-fast", "grok-code-fast-1"],
};
const PROVIDER_LABEL: Record<string, string> = {
  lovable: "Built-in (no key needed)", openai: "OpenAI (ChatGPT)", anthropic: "Anthropic (Claude)", xai: "xAI (Grok)",
};
// Reference allowances on comparable AI builders (approx. monthly, paid entry tiers).
const MARKET_TOKENS = 2_000_000;

async function call(action: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("imagine-ai", { body: { action, ...extra } });
  if (error) {
    let msg = error.message;
    try { msg = (await (error as any).context.json()).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return data;
}

export default function ImagineEngineAdmin() {
  const { user } = useAuth();
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [cfg, setCfg] = useState<Config | null>(null);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Imagine AI Admin | Startup Factory Hub";
    if (!user) { setState("denied"); return; }
    (async () => {
      try {
        const [c, s] = await Promise.all([call("get_config"), call("stats")]);
        setCfg(c.config); setKeys(c.providerKeys || {}); setStats(s); setState("ready");
      } catch { setState("denied"); }
    })();
  }, [user]);

  if (state === "loading") return <div className="min-h-screen grid place-items-center bg-background"><Loader2 className="animate-spin text-primary" /></div>;
  if (state === "denied" || !cfg) return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="tech-card border-0 p-8 text-center max-w-sm">
        <Lock className="mx-auto mb-3 text-muted-foreground" />
        <h1 className="text-lg font-semibold text-foreground">Admins only</h1>
        <p className="text-sm text-muted-foreground mt-1">This area is restricted to Startup Factory Hub administrators.</p>
      </div>
    </div>
  );

  const set = <K extends keyof Config>(k: K, v: Config[K]) => setCfg({ ...cfg, [k]: v });
  const num = (k: keyof Config) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);
  const retailIn = cfg.cost_per_1k_input * cfg.markup_multiplier;
  const retailOut = cfg.cost_per_1k_output * cfg.markup_multiplier;
  const maxCostPerUser = (cfg.monthly_token_limit / 1000) * (cfg.cost_per_1k_input * 0.6 + cfg.cost_per_1k_output * 0.4);

  const save = async () => {
    setSaving(true);
    try { await call("save_config", { config: cfg }); toast.success("Imagine AI settings saved"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <img src={logo.url} alt="Imagine Engine" className="w-12 h-12 rounded-full object-cover" />
          <div>
            <h1 className="text-2xl font-bold">Imagine AI Control Center</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Admin only · settings are enforced on the server</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Label htmlFor="en" className="text-sm">AI enabled</Label>
            <Switch id="en" checked={cfg.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </div>
        </header>

        {stats && (
          <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              ["Requests (month)", stats.requests.toLocaleString()],
              ["Tokens used", (stats.input_tokens + stats.output_tokens).toLocaleString()],
              ["Our AI cost", `$${stats.cost_usd.toFixed(2)}`],
              ["Billed to users", `$${stats.charge_usd.toFixed(2)}`],
              ["Active users", String(stats.active_users)],
            ].map(([l, v]) => (
              <div key={l} className="tech-card border-0 p-4">
                <div className="text-xs text-muted-foreground">{l}</div>
                <div className="text-xl font-semibold mt-1">{v}</div>
              </div>
            ))}
          </section>
        )}

        <section className="tech-card border-0 p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" /> AI model</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <Select value={cfg.provider} onValueChange={(v) => setCfg({ ...cfg, provider: v, model: MODELS[v][0] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background backdrop-blur-none">
                  {Object.keys(MODELS).map((p) => (
                    <SelectItem key={p} value={p}>{PROVIDER_LABEL[p]}{p !== "lovable" && !keys[p] ? " — key missing" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cfg.provider !== "lovable" && !keys[cfg.provider] && (
                <p className="text-xs text-destructive">This provider's API key isn't added on the server yet, so the AI will be unavailable until it is.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input list="ie-models" value={cfg.model} onChange={(e) => set("model", e.target.value)} />
              <datalist id="ie-models">{MODELS[cfg.provider]?.map((m) => <option key={m} value={m} />)}</datalist>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Extra instructions for the AI (optional)</Label>
            <Textarea rows={3} value={cfg.system_prompt_extra} onChange={(e) => set("system_prompt_extra", e.target.value)} />
          </div>
        </section>

        <section className="tech-card border-0 p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Pricing</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Charging model</Label>
              <Select value={cfg.pricing_mode} onValueChange={(v) => set("pricing_mode", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background backdrop-blur-none">
                  <SelectItem value="metered">Pay per token</SelectItem>
                  <SelectItem value="flat">Flat monthly fee</SelectItem>
                  <SelectItem value="hybrid">Flat fee + tokens over limit</SelectItem>
                  <SelectItem value="free">Free (included)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Flat fee ($/month)</Label><Input type="number" step="1" value={cfg.flat_fee_monthly} onChange={num("flat_fee_monthly")} /></div>
            <div className="space-y-1.5"><Label>Markup (×)</Label><Input type="number" step="0.1" value={cfg.markup_multiplier} onChange={num("markup_multiplier")} /></div>
            <div className="space-y-1.5"><Label>Our cost per 1K input tokens ($)</Label><Input type="number" step="0.0001" value={cfg.cost_per_1k_input} onChange={num("cost_per_1k_input")} /></div>
            <div className="space-y-1.5"><Label>Our cost per 1K output tokens ($)</Label><Input type="number" step="0.0001" value={cfg.cost_per_1k_output} onChange={num("cost_per_1k_output")} /></div>
            <div className="text-sm text-muted-foreground self-end">
              User price: ${retailIn.toFixed(4)} / 1K in · ${retailOut.toFixed(4)} / 1K out
            </div>
          </div>
        </section>

        <section className="tech-card border-0 p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Usage limits per user</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Monthly token allowance</Label><Input type="number" step="100000" value={cfg.monthly_token_limit} onChange={num("monthly_token_limit")} /></div>
            <div className="space-y-1.5"><Label>Messages per day</Label><Input type="number" step="10" value={cfg.daily_message_limit} onChange={num("daily_message_limit")} /></div>
          </div>
          <p className="text-sm text-muted-foreground">
            Max AI cost per user at this limit: about ${maxCostPerUser.toFixed(2)}/month.
            {cfg.monthly_token_limit >= MARKET_TOKENS ? " At or above the typical allowance on similar AI builders." : " Below the typical allowance on similar AI builders (about 2M tokens/month)."}
          </p>
        </section>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save settings</Button>
        </div>
      </div>
    </div>
  );
}
