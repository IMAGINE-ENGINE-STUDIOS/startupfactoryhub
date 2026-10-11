import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Cpu, DollarSign, Activity, Loader2, Lock, KeyRound, Plus, Trash2, Layers, Power, Database } from "lucide-react";
import { toast } from "sonner";
import PlatformDataGrid from "@/components/admin/PlatformDataGrid";
import logo from "@/assets/imagine-engine-logo.png.asset.json";

type Plan = { id: string; name: string; price_monthly: number; price_yearly: number; monthly_tokens: number; daily_messages: number };
type Custom = { id: string; name: string; base_url: string; kind: "openai" | "anthropic"; models: string[] };
type Config = {
  provider: string; model: string; pricing_mode: string;
  cost_per_1k_input: number; cost_per_1k_output: number; markup_multiplier: number;
  flat_fee_monthly: number; monthly_token_limit: number; daily_message_limit: number;
  enabled: boolean; system_prompt_extra: string; maintenance_message: string;
  business_model: string; platform_fee_percent: number; free_trial_days: number;
  storage_included_mb: number; storage_price_per_gb: number;
  plans: Plan[]; custom_providers: Custom[];
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
  const embed = new URLSearchParams(window.location.search).has("embed");
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [cfg, setCfg] = useState<Config | null>(null);
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [hints, setHints] = useState<Record<string, string>>({});
  const [keyDraft, setKeyDraft] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [c, s] = await Promise.all([call("get_config"), call("stats")]);
    setCfg({ plans: [], custom_providers: [], ...c.config });
    setKeys(c.providerKeys || {}); setHints(c.keyHints || {}); setStats(s); setState("ready");
  };

  useEffect(() => {
    document.title = "Imagine Engine Admin | Startup Factory Hub";
    if (!user) { setState("denied"); return; }
    load().catch(() => setState("denied"));
  }, [user]);

  const wrap = embed ? "fixed inset-0 z-[100] overflow-auto bg-background text-foreground p-4 md:p-6" : "min-h-screen bg-background text-foreground p-4 md:p-8";

  if (state === "loading") return <div className={`${wrap} grid place-items-center`}><Loader2 className="animate-spin text-primary" /></div>;
  if (state === "denied" || !cfg) return (
    <div className={`${wrap} grid place-items-center`}>
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
  const allProviders = [...Object.keys(MODELS), ...cfg.custom_providers.map((p) => p.id)];
  const providerName = (id: string) => PROVIDER_LABEL[id] || cfg.custom_providers.find((p) => p.id === id)?.name || id;
  const modelsFor = (id: string) => MODELS[id] || cfg.custom_providers.find((p) => p.id === id)?.models || [];
  const profit = stats ? stats.charge_usd - stats.cost_usd : 0;

  const setPlan = (i: number, patch: Partial<Plan>) => set("plans", cfg.plans.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const setCustom = (i: number, patch: Partial<Custom>) => set("custom_providers", cfg.custom_providers.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const save = async () => {
    setSaving(true);
    try { await call("save_config", { config: cfg }); toast.success("Settings saved"); await load(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };
  const saveKey = async (id: string) => {
    try { await call("save_key", { provider: id, key: keyDraft[id] || "" }); setKeyDraft({ ...keyDraft, [id]: "" }); toast.success("Key saved securely"); await load(); }
    catch (e) { toast.error((e as Error).message); }
  };
  const deleteKey = async (id: string) => {
    try { await call("delete_key", { provider: id }); toast.success("Key removed"); await load(); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className={wrap}>
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center gap-3">
          <img src={logo.url} alt="Imagine Engine" className="w-12 h-12 rounded-full object-cover" />
          <div>
            <h1 className="text-2xl font-bold">Imagine Engine Admin</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Admin only · settings are enforced on the server</p>
          </div>
          <Button className="ml-auto" onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save settings</Button>
        </header>

        {stats && (
          <section className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              ["Requests (month)", stats.requests.toLocaleString()],
              ["Tokens used", (stats.input_tokens + stats.output_tokens).toLocaleString()],
              ["Our AI cost", `$${stats.cost_usd.toFixed(2)}`],
              ["Billed to users", `$${stats.charge_usd.toFixed(2)}`],
              ["Profit", `$${profit.toFixed(2)}`],
              ["Active users", String(stats.active_users)],
            ].map(([l, v]) => (
              <div key={l} className="tech-card border-0 p-4">
                <div className="text-xs text-muted-foreground">{l}</div>
                <div className="text-xl font-semibold mt-1">{v}</div>
              </div>
            ))}
          </section>
        )}

        <Tabs defaultValue="service">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="service"><Power className="w-4 h-4 mr-1" />Service</TabsTrigger>
            <TabsTrigger value="business"><DollarSign className="w-4 h-4 mr-1" />Business & costs</TabsTrigger>
            <TabsTrigger value="plans"><Layers className="w-4 h-4 mr-1" />Paid plans</TabsTrigger>
            <TabsTrigger value="models"><Cpu className="w-4 h-4 mr-1" />AI models & keys</TabsTrigger>
            <TabsTrigger value="data"><Database className="w-4 h-4 mr-1" />Platform data</TabsTrigger>
          </TabsList>

          <TabsContent value="service" className="space-y-4">
            <section className="tech-card border-0 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Genius AI service</h2>
                  <p className="text-sm text-muted-foreground">Turn the AI off for everyone instantly.</p>
                </div>
                <Switch checked={cfg.enabled} onCheckedChange={(v) => set("enabled", v)} />
              </div>
              <div className="space-y-1.5">
                <Label>Message shown to users while the AI is off</Label>
                <Input value={cfg.maintenance_message} placeholder="Genius AI is under maintenance. Back soon." onChange={(e) => set("maintenance_message", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Extra instructions for the AI (optional)</Label>
                <Textarea rows={3} value={cfg.system_prompt_extra} onChange={(e) => set("system_prompt_extra", e.target.value)} />
              </div>
            </section>
            <section className="tech-card border-0 p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Default usage limits per user</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Monthly token allowance</Label><Input type="number" step="100000" value={cfg.monthly_token_limit} onChange={num("monthly_token_limit")} /></div>
                <div className="space-y-1.5"><Label>Messages per day</Label><Input type="number" step="10" value={cfg.daily_message_limit} onChange={num("daily_message_limit")} /></div>
              </div>
              <p className="text-sm text-muted-foreground">
                Max AI cost per user at this limit: about ${maxCostPerUser.toFixed(2)}/month.
                {cfg.monthly_token_limit >= MARKET_TOKENS ? " At or above the typical allowance on similar AI builders." : " Below the typical allowance on similar AI builders (about 2M tokens/month)."}
              </p>
            </section>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <section className="tech-card border-0 p-5 space-y-4">
              <h2 className="font-semibold">Business & revenue model</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Revenue model</Label>
                  <Select value={cfg.business_model} onValueChange={(v) => set("business_model", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background backdrop-blur-none">
                      <SelectItem value="subscription">Subscription plans</SelectItem>
                      <SelectItem value="usage">Pure usage (pay as you go)</SelectItem>
                      <SelectItem value="freemium">Freemium (free plan + upgrades)</SelectItem>
                      <SelectItem value="included">Included in membership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Platform fee on user sales (%)</Label><Input type="number" step="0.5" value={cfg.platform_fee_percent} onChange={num("platform_fee_percent")} /></div>
                <div className="space-y-1.5"><Label>Free trial (days)</Label><Input type="number" step="1" value={cfg.free_trial_days} onChange={num("free_trial_days")} /></div>
                <div className="space-y-1.5"><Label>Included storage per user (MB)</Label><Input type="number" step="50" value={cfg.storage_included_mb ?? 500} onChange={num("storage_included_mb")} /></div>
                <div className="space-y-1.5"><Label>Extra storage price ($ per GB / month)</Label><Input type="number" step="0.25" value={cfg.storage_price_per_gb ?? 2.5} onChange={num("storage_price_per_gb")} /></div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Button type="button" variant="outline" onClick={async () => {
                    const { data, error } = await supabase.functions.invoke("imagine-commerce", { body: { action: "bill_storage" } });
                    if (error || data?.error) toast.error(data?.error || error?.message || "Billing failed");
                    else toast.success(`Storage invoices sent: ${data.charged.length}`);
                  }}>Charge this month's extra storage</Button>
                  <p className="text-xs text-muted-foreground">Sends each user over their included storage a Stripe invoice. Run once a month; users are only charged once per month.</p>
                </div>
              </div>
            </section>
            <section className="tech-card border-0 p-5 space-y-4">
              <h2 className="font-semibold">AI charging & costs</h2>
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
                <div className="text-sm text-muted-foreground self-end">User price: ${retailIn.toFixed(4)} / 1K in · ${retailOut.toFixed(4)} / 1K out</div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <section className="tech-card border-0 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Paid plans for users</h2>
                <Button size="sm" variant="outline" onClick={() => set("plans", [...cfg.plans, { id: `plan_${Date.now().toString(36)}`, name: "New plan", price_monthly: 0, price_yearly: 0, monthly_tokens: 500000, daily_messages: 50 }])}><Plus className="w-4 h-4 mr-1" />Add plan</Button>
              </div>
              {cfg.plans.map((p, i) => (
                <div key={p.id} className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end border-t border-border pt-3">
                  <div className="space-y-1.5 col-span-2 md:col-span-1"><Label>Name</Label><Input value={p.name} onChange={(e) => setPlan(i, { name: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>$ / month</Label><Input type="number" value={p.price_monthly} onChange={(e) => setPlan(i, { price_monthly: Number(e.target.value) })} /></div>
                  <div className="space-y-1.5"><Label>$ / year</Label><Input type="number" value={p.price_yearly} onChange={(e) => setPlan(i, { price_yearly: Number(e.target.value) })} /></div>
                  <div className="space-y-1.5"><Label>Tokens / month</Label><Input type="number" step="100000" value={p.monthly_tokens} onChange={(e) => setPlan(i, { monthly_tokens: Number(e.target.value) })} /></div>
                  <div className="space-y-1.5"><Label>Messages / day</Label><Input type="number" value={p.daily_messages} onChange={(e) => setPlan(i, { daily_messages: Number(e.target.value) })} /></div>
                  <Button variant="ghost" size="icon" aria-label="Remove plan" onClick={() => set("plans", cfg.plans.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Plans are saved here; card payments for them are not connected yet.</p>
            </section>
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <section className="tech-card border-0 p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" /> Active AI model</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Provider</Label>
                  <Select value={cfg.provider} onValueChange={(v) => setCfg({ ...cfg, provider: v, model: modelsFor(v)[0] || "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background backdrop-blur-none">
                      {allProviders.map((p) => (
                        <SelectItem key={p} value={p}>{providerName(p)}{p !== "lovable" && !keys[p] ? " — key missing" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Model</Label>
                  <Input list="ie-models" value={cfg.model} onChange={(e) => set("model", e.target.value)} />
                  <datalist id="ie-models">{modelsFor(cfg.provider).map((m) => <option key={m} value={m} />)}</datalist>
                </div>
              </div>
            </section>

            <section className="tech-card border-0 p-5 space-y-3">
              <h2 className="font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" /> API keys</h2>
              <p className="text-xs text-muted-foreground">Keys are stored privately on the server and never shown again — only the last 4 characters.</p>
              {allProviders.filter((p) => p !== "lovable").map((p) => (
                <div key={p} className="flex flex-wrap items-center gap-2">
                  <div className="w-44 text-sm">{providerName(p)}</div>
                  <div className="text-xs text-muted-foreground w-24">{hints[p] || (keys[p] ? "set on server" : "not set")}</div>
                  <Input type="password" className="flex-1 min-w-[180px]" placeholder="Paste new key" value={keyDraft[p] || ""} onChange={(e) => setKeyDraft({ ...keyDraft, [p]: e.target.value })} />
                  <Button size="sm" onClick={() => saveKey(p)} disabled={!keyDraft[p]}>Save key</Button>
                  {hints[p] && <Button size="sm" variant="ghost" onClick={() => deleteKey(p)}>Remove</Button>}
                </div>
              ))}
            </section>

            <section className="tech-card border-0 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Custom models</h2>
                  <p className="text-xs text-muted-foreground">Add any OpenAI-compatible or Claude-compatible service (DeepSeek, Mistral, Groq, Together, OpenRouter, your own server...). Save settings, then add its key above.</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => set("custom_providers", [...cfg.custom_providers, { id: `custom${cfg.custom_providers.length + 1}`, name: "My model", base_url: "https://", kind: "openai", models: [] }])}><Plus className="w-4 h-4 mr-1" />Add</Button>
              </div>
              {cfg.custom_providers.map((c, i) => (
                <div key={i} className="grid md:grid-cols-6 gap-3 items-end border-t border-border pt-3">
                  <div className="space-y-1.5"><Label>Short id</Label><Input value={c.id} onChange={(e) => setCustom(i, { id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })} /></div>
                  <div className="space-y-1.5"><Label>Name</Label><Input value={c.name} onChange={(e) => setCustom(i, { name: e.target.value })} /></div>
                  <div className="space-y-1.5 md:col-span-2"><Label>Address (base URL)</Label><Input value={c.base_url} placeholder="https://api.deepseek.com/v1" onChange={(e) => setCustom(i, { base_url: e.target.value })} /></div>
                  <div className="space-y-1.5">
                    <Label>Format</Label>
                    <Select value={c.kind} onValueChange={(v) => setCustom(i, { kind: v as Custom["kind"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-background backdrop-blur-none">
                        <SelectItem value="openai">OpenAI style</SelectItem>
                        <SelectItem value="anthropic">Claude style</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Remove model" onClick={() => set("custom_providers", cfg.custom_providers.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                  <div className="space-y-1.5 md:col-span-6"><Label>Model names (comma separated)</Label><Input value={c.models.join(", ")} placeholder="deepseek-chat, deepseek-reasoner" onChange={(e) => setCustom(i, { models: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></div>
                </div>
              ))}
            </section>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <PlatformDataGrid />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
