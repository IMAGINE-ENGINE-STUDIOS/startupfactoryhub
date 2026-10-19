import { useCallback, useEffect, useState } from "react";
import {
  Bot, Check, ChevronRight, Coins, Cpu, Loader2, Pencil, Play, Plus, Terminal, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── HUB // MATRIX design tokens (self-contained dark console: the component
// renders inside 7 different dashboards, some light-themed, so the panel
// carries its own background, palette and shadcn CSS-variable overrides and
// looks identical everywhere). ─────────────────────────────────────────────
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const GROTESK = '"Space Grotesk", ui-sans-serif, system-ui, sans-serif';
const CYAN = "#00E5FF";
const MINT = "#2EF8A0";
const TEAL = "#4E7A73";
const AMBER = "#FFB86A";
const PINK = "#FF3D6E";

const DARK_VARS = {
  "--background": "199 56% 6%",
  "--foreground": "0 0% 100%",
  "--card": "192 35% 7%",
  "--card-foreground": "0 0% 100%",
  "--popover": "192 35% 7%",
  "--popover-foreground": "0 0% 100%",
  "--primary": "187 100% 50%",
  "--primary-foreground": "203 78% 3%",
  "--secondary": "192 30% 12%",
  "--secondary-foreground": "0 0% 90%",
  "--muted": "192 30% 12%",
  "--muted-foreground": "171 24% 62%",
  "--accent": "192 30% 14%",
  "--accent-foreground": "0 0% 100%",
  "--destructive": "344 100% 62%",
  "--destructive-foreground": "0 0% 100%",
  "--border": "192 40% 18%",
  "--input": "192 40% 18%",
  "--ring": "187 100% 50%",
} as React.CSSProperties;

const CONSOLE_CSS = `
@keyframes ca-borderflow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes ca-scan {
  0% { top: -18%; }
  100% { top: 118%; }
}
@keyframes ca-fadeup {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ca-chipwave {
  0%, 100% { box-shadow: 0 0 0 rgba(0,229,255,0); border-color: rgba(0,229,255,0.25); }
  50% { box-shadow: 0 0 16px rgba(0,229,255,0.35); border-color: rgba(0,229,255,0.8); }
}
.ca-frame {
  background: linear-gradient(120deg, rgba(0,229,255,0.55), rgba(46,248,160,0.12), rgba(0,229,255,0.05), rgba(255,61,110,0.28), rgba(0,229,255,0.55));
  background-size: 300% 300%;
  animation: ca-borderflow 9s ease infinite;
}
.ca-scanline {
  position: absolute; left: 0; right: 0; height: 110px;
  background: linear-gradient(to bottom, transparent, rgba(0,229,255,0.045), transparent);
  animation: ca-scan 8s linear infinite;
  pointer-events: none;
}
.ca-logline { animation: ca-fadeup 0.45s ease both; }
.ca-chip-live { animation: ca-chipwave 1.6s ease-in-out infinite; }
`;

function MicroLabel({ children, color = TEAL }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{ fontFamily: MONO, color }} className="text-[10px] tracking-[0.22em] uppercase">
      {children}
    </p>
  );
}

const MODEL_OPTIONS = [
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
  { value: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick" },
  { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout" },
  { value: "meta/muse-spark-open", label: "Muse Spark Open (preview)" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
];
const modelLabel = (value: string) =>
  MODEL_OPTIONS.find((m) => m.value === value)?.label ?? value;

const TOOL_OPTIONS = ["Web search", "Knowledge base", "Imagine Engine", "Code review"];

interface CallAgent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  tools: string[];
  coordination: { mode?: string };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RunStep {
  agent_id: string;
  name: string;
  model: string;
  output: string;
  prompt_tokens: number;
  completion_tokens: number;
}

interface RunResult {
  steps: RunStep[];
  usage: { prompt_tokens: number; completion_tokens: number };
  credits: { charged: number; balance: number | null };
}

interface AgentForm {
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
  coordinationMode: string;
  isActive: boolean;
}

const EMPTY_FORM: AgentForm = {
  name: "",
  description: "",
  model: "llama-3.3-70b-versatile",
  systemPrompt: "",
  temperature: 0.7,
  maxTokens: 1024,
  tools: [],
  coordinationMode: "solo",
  isActive: true,
};

async function callAgentsApi(body: Record<string, unknown>): Promise<any> {
  const { data, error } = await supabase.functions.invoke("call-agents", { body });
  if (error) {
    let message = error.message;
    try {
      const parsed = await (error as any).context?.json?.();
      if (parsed?.error) message = parsed.error;
    } catch {
      /* keep the default message */
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function SFHCallAgents() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<CallAgent[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AgentForm>(EMPTY_FORM);

  const [runMode, setRunMode] = useState<"solo" | "pipeline">("solo");
  const [soloId, setSoloId] = useState<string>("");
  const [pipelineIds, setPipelineIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await callAgentsApi({ action: "list" });
      setAgents(data.agents ?? []);
      setBalance(data.balance ?? null);
      setIsAdmin(!!data.isAdmin);
      if (!soloId && data.agents?.length) setSoloId(data.agents[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your agents.");
    } finally {
      setLoading(false);
    }
  }, [soloId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAgent = async (payload: Record<string, unknown>) => {
    const data = await callAgentsApi({ action: "save", ...payload });
    return data.agent as CallAgent;
  };

  const handleFormSave = async () => {
    if (!form.name.trim()) {
      setError("Give your agent a name first.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await saveAgent({
        id: editingId ?? undefined,
        name: form.name.trim(),
        description: form.description.trim() || null,
        model: form.model,
        system_prompt: form.systemPrompt,
        temperature: form.temperature,
        max_tokens: form.maxTokens,
        tools: form.tools,
        coordination: { mode: form.coordinationMode },
        is_active: form.isActive,
      });
      setNotice(editingId ? "Agent updated." : "Agent created.");
      setEditingId(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the agent.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (agent: CallAgent, next: boolean) => {
    setError(null);
    try {
      await saveAgent({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        model: agent.model,
        system_prompt: agent.system_prompt,
        temperature: Number(agent.temperature),
        max_tokens: agent.max_tokens,
        tools: agent.tools ?? [],
        coordination: agent.coordination ?? {},
        is_active: next,
      });
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, is_active: next } : a)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the agent.");
    }
  };

  const handleEdit = (agent: CallAgent) => {
    setEditingId(agent.id);
    setForm({
      name: agent.name,
      description: agent.description ?? "",
      model: agent.model,
      systemPrompt: agent.system_prompt ?? "",
      temperature: Number(agent.temperature) || 0.7,
      maxTokens: agent.max_tokens || 1024,
      tools: agent.tools ?? [],
      coordinationMode: agent.coordination?.mode === "pipeline" ? "pipeline" : "solo",
      isActive: agent.is_active,
    });
    setError(null);
    setNotice(null);
  };

  const handleDelete = async (agent: CallAgent) => {
    if (!window.confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await callAgentsApi({ action: "delete", id: agent.id });
      if (editingId === agent.id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
      setPipelineIds((prev) => prev.filter((id) => id !== agent.id));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the agent.");
    }
  };

  const togglePipelineAgent = (id: string, checked: boolean) => {
    setPipelineIds((prev) =>
      checked ? [...prev, id] : prev.filter((existing) => existing !== id)
    );
  };

  const handleRun = async () => {
    if (!message.trim()) {
      setError("Write a message for the agent to work on.");
      return;
    }
    if (runMode === "solo" && !soloId) {
      setError("Pick an agent to run.");
      return;
    }
    if (runMode === "pipeline" && pipelineIds.length === 0) {
      setError("Pick at least one agent for the pipeline.");
      return;
    }
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const data = await callAgentsApi({
        action: "run",
        message: message.trim(),
        ...(runMode === "solo" ? { agent_id: soloId } : { pipeline: pipelineIds }),
      });
      setResult(data as RunResult);
      if (data.credits?.balance != null) setBalance(data.credits.balance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The run failed.");
    } finally {
      setRunning(false);
    }
  };

  if (!user) {
    return (
      <div className="ca-frame rounded-2xl p-[1px]">
        <style>{CONSOLE_CSS}</style>
        <div
          style={{ ...DARK_VARS, fontFamily: GROTESK }}
          className="relative overflow-hidden rounded-2xl bg-[#02070E] p-6 text-white"
        >
          <MicroLabel color={TEAL}>SFH // AGENTS</MicroLabel>
          <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-wide">
            <Bot className="h-5 w-5" style={{ color: CYAN }} /> Agents
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Please sign in to configure and run your agents.
          </p>
        </div>
      </div>
    );
  }

  // Pipeline visualizer: the agents that will run, in run order.
  const vizAgents: CallAgent[] =
    runMode === "solo"
      ? agents.filter((a) => a.id === soloId)
      : pipelineIds
          .map((id) => agents.find((a) => a.id === id))
          .filter((a): a is CallAgent => !!a);
  const completedSteps = result?.steps.length ?? 0;

  return (
    <div className="ca-frame rounded-2xl p-[1px]">
      <style>{CONSOLE_CSS}</style>
      <div
        style={{ ...DARK_VARS, fontFamily: GROTESK }}
        className="relative overflow-hidden rounded-2xl bg-[#02070E] text-white"
      >
        <div className="ca-scanline" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 240px at 15% -5%, rgba(0,229,255,0.08), transparent 60%), radial-gradient(500px 220px at 90% 0%, rgba(46,248,160,0.05), transparent 60%)",
          }}
        />
        <div className="relative space-y-5 p-4 sm:p-6">
          {/* ── Header strip ─────────────────────────────── */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div>
              <MicroLabel color={TEAL}>SFH // AGENTS</MicroLabel>
              <h2 className="mt-1.5 flex items-center gap-2.5 text-2xl font-semibold tracking-wide">
                <Bot className="h-6 w-6" style={{ color: CYAN }} />
                Agents
                <span style={{ color: CYAN }} className="text-lg font-medium">
                  // CALL CONSOLE
                </span>
              </h2>
              <p className="mt-1.5 max-w-xl text-sm text-white/55">
                Configure your own AI agents, coordinate them in pipelines, and run them on
                Meta models. Runs are billed from your AI credits based on actual token usage.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2" style={{ fontFamily: MONO }}>
              <span
                className="flex items-center gap-1.5 rounded border px-2.5 py-1 text-[10px] tracking-[0.15em]"
                style={{ color: MINT, borderColor: "rgba(46,248,160,0.35)" }}
              >
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full"
                  style={{ background: MINT, boxShadow: `0 0 8px ${MINT}` }}
                />
                GROQ LINK: LIVE
              </span>
              <span
                className="rounded border border-white/10 px-2.5 py-1 text-[10px] tracking-[0.15em]"
                style={{ color: CYAN }}
              >
                {agents.length} UNIT{agents.length === 1 ? "" : "S"}
              </span>
              <span
                className="flex items-center gap-1.5 rounded border px-2.5 py-1 text-[10px] tracking-[0.15em]"
                style={
                  isAdmin
                    ? { color: MINT, borderColor: "rgba(46,248,160,0.35)" }
                    : { color: "#FFFFFF", borderColor: "rgba(255,255,255,0.12)" }
                }
              >
                <Coins className="h-3.5 w-3.5" style={{ color: isAdmin ? MINT : CYAN }} />
                {isAdmin
                  ? "Admin — unlimited"
                  : balance == null
                    ? "Credits: —"
                    : `Credits: ${Number(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              </span>
            </div>
          </div>

          {error && (
            <div
              className="rounded-md px-4 py-3 text-sm"
              style={{
                border: `1px solid ${PINK}66`,
                background: "rgba(255,61,110,0.08)",
                color: "#FF8FAD",
              }}
            >
              {error}
            </div>
          )}
          {notice && (
            <div
              className="rounded-md px-4 py-3 text-sm"
              style={{
                border: `1px solid ${MINT}55`,
                background: "rgba(46,248,160,0.07)",
                color: MINT,
              }}
            >
              {notice}
            </div>
          )}

          {/* ── Agent units ──────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <MicroLabel color={CYAN}>YOUR UNITS</MicroLabel>
              <MicroLabel>{loading ? "SYNCING…" : `${agents.length} REGISTERED`}</MicroLabel>
            </div>
            {loading ? (
              <p className="flex items-center gap-2 text-sm" style={{ fontFamily: MONO, color: TEAL }}>
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: CYAN }} />
                Loading your agents…
              </p>
            ) : agents.length === 0 ? (
              <p className="text-sm" style={{ fontFamily: MONO, color: TEAL }}>
                No agents yet. Create your first one below.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="group rounded-lg border border-cyan-400/15 bg-[#0A1418] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/45 hover:shadow-[0_0_28px_rgba(0,229,255,0.13)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${agent.is_active ? "animate-pulse" : ""}`}
                          style={{
                            background: agent.is_active ? MINT : "#33544E",
                            boxShadow: agent.is_active ? `0 0 9px ${MINT}` : "none",
                          }}
                        />
                        <h3 className="text-base font-semibold tracking-wide text-white">
                          {agent.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] tracking-[0.18em]"
                          style={{ fontFamily: MONO, color: agent.is_active ? MINT : TEAL }}
                        >
                          {agent.is_active ? "ACTIVE" : "PAUSED"}
                        </span>
                        <Switch
                          checked={agent.is_active}
                          onCheckedChange={(checked) => handleToggleActive(agent, checked)}
                        />
                      </div>
                    </div>
                    {agent.description && (
                      <p className="mt-1.5 text-sm text-white/55">{agent.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span
                        className="flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] tracking-[0.12em]"
                        style={{ fontFamily: MONO, color: CYAN, borderColor: "rgba(0,229,255,0.35)" }}
                      >
                        <Cpu className="h-3 w-3" />
                        {modelLabel(agent.model)}
                      </span>
                      <Badge variant="outline" style={{ fontFamily: MONO }} className="text-[10px] tracking-[0.12em]">
                        {agent.coordination?.mode === "pipeline" ? "PIPELINE" : "SOLO"}
                      </Badge>
                      {(agent.tools ?? []).map((tool) => (
                        <Badge key={tool} variant="secondary" className="text-[10px]">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-white/[0.05] pt-3">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(agent)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(agent)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Configure ────────────────────────────────── */}
          <section className="rounded-lg border border-cyan-400/15 bg-[#0A1418]">
            <header className="flex items-center justify-between border-b border-white/[0.05] px-4 pb-2 pt-3">
              <MicroLabel color={CYAN}>
                {editingId ? "CONFIGURE // EDIT UNIT" : "CONFIGURE // NEW UNIT"}
              </MicroLabel>
              <MicroLabel>{editingId ? "MODE: UPDATE" : "MODE: CREATE"}</MicroLabel>
            </header>
            <div className="space-y-4 p-4">
              <p className="-mt-1 flex items-center gap-2 text-sm text-white/55">
                <Plus className="h-4 w-4" style={{ color: CYAN }} />
                {editingId ? "Edit agent" : "Create an agent"} — pick a model, give it
                instructions, and choose how it coordinates.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ca-name">Name</Label>
                  <Input
                    id="ca-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Pitch Reviewer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ca-description">Description (optional)</Label>
                  <Input
                    id="ca-description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What this agent is for"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a model" />
                    </SelectTrigger>
                    <SelectContent className="border-cyan-400/20 bg-[#0A1418] text-white">
                      {MODEL_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value} className="focus:bg-cyan-400/10 focus:text-white">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Coordination mode</Label>
                  <Select
                    value={form.coordinationMode}
                    onValueChange={(v) => setForm({ ...form, coordinationMode: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a mode" />
                    </SelectTrigger>
                    <SelectContent className="border-cyan-400/20 bg-[#0A1418] text-white">
                      <SelectItem value="solo" className="focus:bg-cyan-400/10 focus:text-white">Solo</SelectItem>
                      <SelectItem value="pipeline" className="focus:bg-cyan-400/10 focus:text-white">Pipeline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ca-prompt">System prompt</Label>
                <Textarea
                  id="ca-prompt"
                  value={form.systemPrompt}
                  onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                  placeholder="You are a sharp pitch reviewer for early-stage startups…"
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Temperature:{" "}
                    <span style={{ fontFamily: MONO, color: CYAN }}>{form.temperature.toFixed(1)}</span>
                  </Label>
                  <Slider
                    value={[form.temperature]}
                    onValueChange={(v) => setForm({ ...form, temperature: v[0] ?? 0.7 })}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                  <p className="text-xs text-white/45">
                    Lower is more focused, higher is more creative.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ca-max-tokens">Max tokens</Label>
                  <Input
                    id="ca-max-tokens"
                    type="number"
                    min={1}
                    max={8000}
                    value={form.maxTokens}
                    onChange={(e) =>
                      setForm({ ...form, maxTokens: Number(e.target.value) || 1024 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tools (configuration)</Label>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {TOOL_OPTIONS.map((tool) => (
                    <label key={tool} className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
                      <Checkbox
                        checked={form.tools.includes(tool)}
                        onCheckedChange={(checked) =>
                          setForm({
                            ...form,
                            tools:
                              checked === true
                                ? [...form.tools, tool]
                                : form.tools.filter((t) => t !== tool),
                          })
                        }
                      />
                      {tool}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-white/45">
                  Tools are saved with the agent's configuration.
                </p>
              </div>

              <div className="flex items-center gap-3 border-t border-white/[0.05] pt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="ml-auto flex gap-2">
                  {editingId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setForm(EMPTY_FORM);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={handleFormSave}
                    disabled={saving}
                    className="shadow-[0_0_18px_rgba(0,229,255,0.25)]"
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? "Save changes" : "Create agent"}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Run console ──────────────────────────────── */}
          <section className="rounded-lg border border-cyan-400/15 bg-[#0A1418]">
            <header className="flex items-center justify-between border-b border-white/[0.05] px-4 pb-2 pt-3">
              <MicroLabel color={CYAN}>RUN // CONSOLE</MicroLabel>
              <MicroLabel color={running ? MINT : TEAL}>
                {running ? "EXECUTING…" : result ? "LAST RUN COMPLETE" : "STANDBY"}
              </MicroLabel>
            </header>
            <div className="space-y-4 p-4">
              <p className="-mt-1 flex items-center gap-2 text-sm text-white/55">
                <Play className="h-4 w-4" style={{ color: CYAN }} />
                Run agents — solo runs one agent. Pipeline runs the agents you pick, in the
                order you pick them, feeding each output into the next agent.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Run mode</Label>
                  <Select value={runMode} onValueChange={(v) => setRunMode(v as "solo" | "pipeline")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-cyan-400/20 bg-[#0A1418] text-white">
                      <SelectItem value="solo" className="focus:bg-cyan-400/10 focus:text-white">Solo</SelectItem>
                      <SelectItem value="pipeline" className="focus:bg-cyan-400/10 focus:text-white">Pipeline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {runMode === "solo" ? (
                  <div className="space-y-2">
                    <Label>Agent</Label>
                    <Select value={soloId} onValueChange={setSoloId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an agent" />
                      </SelectTrigger>
                      <SelectContent className="border-cyan-400/20 bg-[#0A1418] text-white">
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id} className="focus:bg-cyan-400/10 focus:text-white">
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Pipeline agents (in run order)</Label>
                    <div className="space-y-1.5">
                      {agents.length === 0 && (
                        <p className="text-sm text-white/50">Create an agent first.</p>
                      )}
                      {agents.map((a) => {
                        const order = pipelineIds.indexOf(a.id);
                        return (
                          <label
                            key={a.id}
                            className="flex cursor-pointer items-center gap-2 text-sm text-white/85"
                          >
                            <Checkbox
                              checked={order >= 0}
                              onCheckedChange={(checked) =>
                                togglePipelineAgent(a.id, checked === true)
                              }
                            />
                            {order >= 0 && (
                              <span
                                className="rounded border px-1.5 py-0 text-[10px]"
                                style={{ fontFamily: MONO, color: CYAN, borderColor: "rgba(0,229,255,0.4)" }}
                              >
                                {order + 1}
                              </span>
                            )}
                            {a.name}
                            <span className="text-xs" style={{ color: TEAL }}>
                              {modelLabel(a.model)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Pipeline visualizer */}
              {vizAgents.length > 0 && (
                <div className="rounded-md border border-white/[0.06] bg-black/30 px-3 py-2.5">
                  <MicroLabel>{runMode === "pipeline" ? "PIPELINE // SEQUENCE" : "SOLO // UNIT"}</MicroLabel>
                  <div className="mt-2 flex flex-wrap items-center gap-y-2">
                    {vizAgents.map((a, i) => {
                      const done = !!result && i < completedSteps;
                      const live = running;
                      return (
                        <span key={a.id} className="flex items-center">
                          <span
                            className={`flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] transition-all duration-500 ${live ? "ca-chip-live" : ""}`}
                            style={{
                              fontFamily: MONO,
                              color: done ? MINT : CYAN,
                              borderColor: done ? "rgba(46,248,160,0.55)" : "rgba(0,229,255,0.3)",
                              background: done ? "rgba(46,248,160,0.07)" : "rgba(0,229,255,0.04)",
                              boxShadow: done ? "0 0 14px rgba(46,248,160,0.18)" : "none",
                              animationDelay: live ? `${i * 0.25}s` : undefined,
                            }}
                          >
                            {done ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: done ? MINT : CYAN }}
                              />
                            )}
                            {String(i + 1).padStart(2, "0")} · {a.name}
                          </span>
                          {i < vizAgents.length - 1 && (
                            <ChevronRight
                              className="mx-1 h-4 w-4 shrink-0"
                              style={{ color: done ? MINT : TEAL }}
                            />
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ca-message">Message</Label>
                <Textarea
                  id="ca-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What should the agent(s) work on?"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleRun}
                disabled={running || agents.length === 0}
                className="shadow-[0_0_18px_rgba(0,229,255,0.25)]"
              >
                {running ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {running ? "Running…" : "Run"}
              </Button>

              {result && (
                <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-black/50">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
                    <span
                      className="flex items-center gap-2 text-[10px] tracking-[0.22em]"
                      style={{ fontFamily: MONO, color: CYAN }}
                    >
                      <Terminal className="h-3.5 w-3.5" /> RUN LOG
                    </span>
                    <span className="text-[10px] tracking-[0.18em]" style={{ fontFamily: MONO, color: MINT }}>
                      {result.steps.length} STEP{result.steps.length === 1 ? "" : "S"} OK
                    </span>
                  </div>
                  <div className="space-y-4 p-4">
                    {result.steps.map((step, i) => (
                      <div
                        key={`${step.agent_id}-${i}`}
                        className="ca-logline"
                        style={{ animationDelay: `${i * 140}ms` }}
                      >
                        <p
                          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-[0.08em]"
                          style={{ fontFamily: MONO }}
                        >
                          <span style={{ color: CYAN }}>STEP {String(i + 1).padStart(2, "0")}</span>
                          <span style={{ color: TEAL }}>{"//"}</span>
                          <span className="text-white/90">{step.name}</span>
                          <span
                            className="rounded border px-1.5 py-0 text-[10px]"
                            style={{ color: CYAN, borderColor: "rgba(0,229,255,0.3)" }}
                          >
                            {modelLabel(step.model)}
                          </span>
                          <span style={{ color: TEAL }}>
                            {step.prompt_tokens + step.completion_tokens} TOKENS
                          </span>
                        </p>
                        <p className="mt-1.5 whitespace-pre-wrap border-l-2 py-0.5 pl-3 text-sm text-white/85" style={{ borderColor: "rgba(0,229,255,0.25)" }}>
                          {step.output}
                        </p>
                      </div>
                    ))}
                    <p
                      className="border-t border-white/[0.06] pt-3 text-[11px] tracking-[0.06em]"
                      style={{ fontFamily: MONO, color: TEAL }}
                    >
                      Total tokens:{" "}
                      <span style={{ color: CYAN }}>
                        {result.usage.prompt_tokens + result.usage.completion_tokens}
                      </span>{" "}
                      ({result.usage.prompt_tokens} in / {result.usage.completion_tokens} out) ·
                      Credits charged:{" "}
                      <span style={{ color: AMBER }}>{Number(result.credits.charged).toFixed(2)}</span>
                      {result.credits.balance != null &&
                        ` · New balance: ${Number(result.credits.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
