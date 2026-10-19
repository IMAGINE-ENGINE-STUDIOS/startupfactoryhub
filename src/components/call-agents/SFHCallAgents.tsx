import { useCallback, useEffect, useState } from "react";
import {
  BookOpen, Bot, Check, Code2, Coins, Globe, Loader2, Pencil, Play, Plus,
  Sparkles, Trash2, Wand2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { agentLlama33, agentMaverick, agentScout, agentInstant, agentSpark } from "@/assets/agents/characters";

// ── Startup Factory Hub glassmorphism: light, airy glass panels in the
// platform's emerald + teal palette — the same language as AIFeaturesHub —
// so the Agents tab feels native to the SFH dashboards. ────────────────────

const GLASS_CSS = `
@keyframes ca-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}
@keyframes ca-fadeup {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes ca-pulsering {
  0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.45); }
  70% { box-shadow: 0 0 0 12px rgba(16,185,129,0); }
  100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
}
@keyframes ca-dashflow {
  to { stroke-dashoffset: -28; }
}
@keyframes ca-borderrun {
  0%, 100% { box-shadow: 0 0 0 1px rgba(16,185,129,0.25), 0 12px 40px rgba(16,185,129,0.10); }
  50% { box-shadow: 0 0 0 2px rgba(20,184,166,0.55), 0 12px 48px rgba(20,184,166,0.22); }
}
.ca-float { animation: ca-float 5.5s ease-in-out infinite; }
.ca-fadeup { animation: ca-fadeup 0.5s ease both; }
.ca-avatar-live { animation: ca-pulsering 1.4s ease-out infinite; }
.ca-running { animation: ca-borderrun 1.8s ease-in-out infinite; }
.ca-tilt { transition: transform 0.25s ease-out; transform-style: preserve-3d; will-change: transform; }
.ca-range { -webkit-appearance: none; appearance: none; height: 8px; border-radius: 9999px; outline: none; }
.ca-range::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 9999px;
  background: linear-gradient(135deg, #10b981, #14b8a6); border: 3px solid #ffffff;
  box-shadow: 0 2px 10px rgba(16,185,129,0.45); cursor: pointer;
}
.ca-range::-moz-range-thumb {
  width: 22px; height: 22px; border-radius: 9999px;
  background: linear-gradient(135deg, #10b981, #14b8a6); border: 3px solid #ffffff;
  box-shadow: 0 2px 10px rgba(16,185,129,0.45); cursor: pointer;
}
`;

const GLASS_PANEL =
  "rounded-[2rem] border border-white/60 bg-white/60 shadow-[0_10px_40px_rgba(6,78,59,0.08)] backdrop-blur-xl";
const GLASS_INPUT =
  "rounded-2xl border-emerald-100 bg-white/50 backdrop-blur transition focus-visible:ring-2 focus-visible:ring-emerald-400/60";
const FIELD_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700/80";

const MODEL_OPTIONS = [
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
  { value: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick" },
  { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout" },
  { value: "meta/muse-spark-open", label: "Muse Spark Open (preview)" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
];
const modelLabel = (value: string) =>
  MODEL_OPTIONS.find((m) => m.value === value)?.label ?? value;

// Each model has its own 3D character portrait.
const MODEL_CHARACTERS: Record<string, string> = {
  "llama-3.3-70b-versatile": agentLlama33,
  "meta-llama/llama-4-maverick-17b-128e-instruct": agentMaverick,
  "meta-llama/llama-4-scout-17b-16e-instruct": agentScout,
  "meta/muse-spark-open": agentSpark,
  "llama-3.1-8b-instant": agentInstant,
};
const characterForModel = (model: string) => MODEL_CHARACTERS[model] ?? agentLlama33;

const TOOL_OPTIONS = ["Web search", "Knowledge base", "Imagine Engine", "Code review"];
const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Web search": Globe,
  "Knowledge base": BookOpen,
  "Imagine Engine": Wand2,
  "Code review": Code2,
};

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

// Gentle 3D tilt for character portraits (view-only, direct style writes).
function handleTilt(e: React.MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  el.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.03)`;
}
function resetTilt(e: React.MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.transform = "";
}

function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  return (
    <div className="relative flex rounded-full border border-emerald-100 bg-white/50 p-1 backdrop-blur">
      <span
        className="absolute inset-y-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_4px_14px_rgba(16,185,129,0.35)] transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
          left: "0.25rem",
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`relative z-10 flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-300 ${
            value === o.value ? "text-white" : "text-emerald-900/55 hover:text-emerald-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
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

  const scrollToStudio = () => {
    document
      .getElementById("ca-design-studio")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!user) {
    return (
      <div className="relative">
        <style>{GLASS_CSS}</style>
        <div className={`${GLASS_PANEL} relative overflow-hidden p-6 sm:p-8`}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-300/30 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)]">
              <Bot className="h-5 w-5" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-emerald-950">Agents</h2>
          </div>
          <p className="relative mt-3 text-sm text-emerald-950/60">
            Please sign in to configure and run your agents.
          </p>
        </div>
      </div>
    );
  }

  // The agents that will run, in run order (selection display + avatar chain).
  const vizAgents: CallAgent[] =
    runMode === "solo"
      ? agents.filter((a) => a.id === soloId)
      : pipelineIds
          .map((id) => agents.find((a) => a.id === id))
          .filter((a): a is CallAgent => !!a);

  const isSelectedForRun = (agent: CallAgent) =>
    runMode === "solo" ? soloId === agent.id : pipelineIds.includes(agent.id);

  // Card click feeds the same run selection the Mission Control panel uses:
  // solo picks the one agent; pipeline toggles it in the ordered list.
  const handleCardSelect = (agent: CallAgent) => {
    if (runMode === "solo") {
      setSoloId(agent.id);
    } else {
      togglePipelineAgent(agent.id, !pipelineIds.includes(agent.id));
    }
  };

  const tempPct = ((form.temperature - 0) / 2) * 100;

  return (
    <div className="relative">
      <style>{GLASS_CSS}</style>
      {/* ambient emerald / teal wash */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-200/20 blur-3xl" />
      </div>

      <div className="relative space-y-8">
        {/* ── 1 · Hero strip ─────────────────────────────── */}
        <section className="rounded-[2rem] bg-gradient-to-br from-emerald-300/70 via-white/50 to-teal-300/60 p-[1.5px] shadow-[0_10px_40px_rgba(6,78,59,0.10)]">
          <div className="relative overflow-hidden rounded-[calc(2rem-1.5px)] bg-white/60 px-6 py-6 backdrop-blur-xl sm:px-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-teal-300/30 blur-3xl" />
            <div className="relative flex flex-wrap items-center gap-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_10px_24px_rgba(16,185,129,0.4)]">
                <Bot className="h-7 w-7" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-3xl font-bold tracking-tight text-emerald-950">
                  Agents
                </h2>
                <p className="mt-1 text-sm text-emerald-950/60">
                  Build your AI team. They run on Llama + Groq.
                </p>
                <p className="mt-1 max-w-xl text-xs text-emerald-950/45">
                  Configure your own AI agents, coordinate them in pipelines, and run them
                  on Meta models. Runs are billed from your AI credits based on actual
                  token usage.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/60 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm backdrop-blur">
                  <Coins className="h-4 w-4 text-emerald-500" />
                  {isAdmin
                    ? "Admin — unlimited"
                    : balance == null
                      ? "Credits: —"
                      : `Credits: ${Number(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                </span>
                <Button
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                    scrollToStudio();
                  }}
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition hover:from-emerald-600 hover:to-teal-600"
                >
                  <Plus className="mr-1.5 h-4 w-4" /> New Agent
                </Button>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 px-5 py-3.5 text-sm text-rose-700 backdrop-blur">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 px-5 py-3.5 text-sm text-emerald-700 backdrop-blur">
            {notice}
          </div>
        )}

        {/* ── 2 · Character stage — your team ────────────── */}
        <section className="space-y-4">
          <div className="flex items-end justify-between px-1">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-emerald-950">Your team</h3>
              <p className="text-xs text-emerald-950/50">
                {loading
                  ? "Loading your agents…"
                  : `${agents.length} agent${agents.length === 1 ? "" : "s"} · tap a character to add it to the run`}
              </p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200/70 bg-white/50 px-3 py-1 text-[11px] font-medium text-emerald-800 backdrop-blur sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Groq link live
            </span>
          </div>

          {loading ? (
            <div className={`${GLASS_PANEL} flex items-center gap-3 px-6 py-8 text-sm text-emerald-950/60`}>
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              Loading your agents…
            </div>
          ) : agents.length === 0 ? (
            <div className={`${GLASS_PANEL} flex flex-col items-center gap-5 px-6 py-8 text-center sm:flex-row sm:text-left`}>
              <div className="ca-float shrink-0">
                <img
                  src={agentLlama33}
                  alt="Llama 3.3 70B character"
                  className="h-28 w-28 rounded-3xl object-cover shadow-[0_16px_36px_rgba(16,185,129,0.30)] ring-1 ring-white/70"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-emerald-950">No agents yet</h4>
                <p className="mt-1 max-w-md text-sm text-emerald-950/55">
                  Your team is empty. Create your first agent — pick a character, give it
                  instructions, and put it to work.
                </p>
              </div>
              <Button
                onClick={scrollToStudio}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition hover:from-emerald-600 hover:to-teal-600"
              >
                <Sparkles className="mr-1.5 h-4 w-4" /> Create your first agent
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {agents.map((agent, idx) => {
                const selected = isSelectedForRun(agent);
                const order = pipelineIds.indexOf(agent.id);
                return (
                  <article
                    key={agent.id}
                    onClick={() => handleCardSelect(agent)}
                    className={`group relative cursor-pointer rounded-[2rem] border bg-white/55 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(6,78,59,0.14)] ${
                      selected
                        ? "border-emerald-300 shadow-[0_16px_40px_rgba(16,185,129,0.20)] ring-2 ring-emerald-400"
                        : "border-white/60 shadow-[0_10px_32px_rgba(6,78,59,0.07)]"
                    }`}
                  >
                    {/* aura behind active agents */}
                    {agent.is_active && (
                      <div
                        className="pointer-events-none absolute inset-x-8 top-4 h-40 rounded-full bg-emerald-400/25 blur-2xl"
                        aria-hidden
                      />
                    )}
                    <div
                      className="ca-tilt relative"
                      onMouseMove={handleTilt}
                      onMouseLeave={resetTilt}
                    >
                      <div
                        className="ca-float"
                        style={{ animationDelay: `${(idx % 5) * 0.55}s` }}
                      >
                        <img
                          src={characterForModel(agent.model)}
                          alt={`${modelLabel(agent.model)} character`}
                          className="aspect-square w-full rounded-3xl object-cover shadow-[0_18px_38px_rgba(6,78,59,0.18)] ring-1 ring-white/70"
                        />
                      </div>
                      {/* selected ribbon */}
                      {selected && (
                        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_6px_16px_rgba(16,185,129,0.45)]">
                          <Check className="h-3.5 w-3.5" />
                          {runMode === "pipeline" && order >= 0 ? `Step ${order + 1}` : "In run"}
                        </span>
                      )}
                      {/* status pill */}
                      <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-emerald-900 backdrop-blur">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${agent.is_active ? "animate-pulse bg-emerald-500" : "bg-emerald-950/30"}`}
                        />
                        {agent.is_active ? "Active" : "Paused"}
                      </span>
                    </div>

                    <div className="relative mt-4 flex items-start justify-between gap-2 px-1">
                      <h4 className="text-lg font-bold tracking-tight text-emerald-950">
                        {agent.name}
                      </h4>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={agent.is_active}
                          onCheckedChange={(checked) => handleToggleActive(agent, checked)}
                        />
                      </div>
                    </div>
                    {agent.description && (
                      <p className="mt-1 line-clamp-2 px-1 text-sm text-emerald-950/55">
                        {agent.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 px-1">
                      <span className="rounded-full border border-emerald-200/80 bg-white/60 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 backdrop-blur">
                        {modelLabel(agent.model)}
                      </span>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                        {agent.coordination?.mode === "pipeline" ? "Pipeline" : "Solo"}
                      </span>
                      {(agent.tools ?? []).map((tool) => (
                        <span
                          key={tool}
                          className="rounded-full bg-white/50 px-2.5 py-0.5 text-[11px] text-emerald-950/60 ring-1 ring-emerald-100"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                    <div
                      className="mt-4 flex gap-2 border-t border-emerald-900/5 px-1 pt-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-emerald-200 bg-white/60 backdrop-blur hover:bg-emerald-50"
                        onClick={() => {
                          handleEdit(agent);
                          scrollToStudio();
                        }}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-rose-200 bg-white/60 text-rose-600 backdrop-blur hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => handleDelete(agent)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 3 · Workspace ──────────────────────────────── */}
        <div className="grid items-start gap-6 xl:grid-cols-2">
          {/* ── Design studio (configure) ── */}
          <section
            id="ca-design-studio"
            className="scroll-mt-24 rounded-[2rem] bg-gradient-to-b from-emerald-200/70 via-white/40 to-teal-200/50 p-[1.5px] shadow-[0_10px_40px_rgba(6,78,59,0.08)]"
          >
            <div className="rounded-[calc(2rem-1.5px)] bg-white/65 backdrop-blur-xl">
              <header className="flex items-center justify-between px-6 pb-1 pt-5">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-emerald-950">
                    Design studio
                  </h3>
                  <p className="text-xs text-emerald-950/50">
                    {editingId ? "Edit unit" : "New unit"} ·{" "}
                    {editingId ? "Mode: update" : "Mode: create"}
                  </p>
                </div>
                <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_6px_14px_rgba(16,185,129,0.3)]">
                  {editingId ? "Editing" : "Create"}
                </span>
              </header>
              <div className="space-y-5 px-6 py-5">
                <p className="flex items-center gap-2 text-sm text-emerald-950/55">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  {editingId ? "Edit agent" : "Create an agent"} — pick a model, give it
                  instructions, and choose how it coordinates.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ca-name" className={FIELD_LABEL}>
                      Name
                    </Label>
                    <Input
                      id="ca-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Pitch Reviewer"
                      className={GLASS_INPUT}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ca-description" className={FIELD_LABEL}>
                      Description (optional)
                    </Label>
                    <Input
                      id="ca-description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="What this agent is for"
                      className={GLASS_INPUT}
                    />
                  </div>
                </div>

                {/* Character-select model picker */}
                <div className="space-y-2.5">
                  <Label className={FIELD_LABEL}>Model — choose your character</Label>
                  <div className="flex flex-wrap gap-3">
                    {MODEL_OPTIONS.map((m) => {
                      const active = form.model === m.value;
                      return (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setForm({ ...form, model: m.value })}
                          className="group flex w-[4.75rem] flex-col items-center gap-1.5"
                          aria-pressed={active}
                        >
                          <span
                            className={`relative block overflow-hidden rounded-2xl transition-all duration-300 ${
                              active
                                ? "scale-105 shadow-[0_10px_24px_rgba(16,185,129,0.35)] ring-[3px] ring-emerald-400"
                                : "ring-1 ring-emerald-100 group-hover:scale-[1.03] group-hover:ring-emerald-300"
                            }`}
                          >
                            <img
                              src={MODEL_CHARACTERS[m.value]}
                              alt={m.label}
                              className="h-16 w-16 object-cover"
                            />
                            {active && (
                              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </span>
                          <span
                            className={`text-center text-[11px] font-medium leading-tight ${
                              active ? "text-emerald-800" : "text-emerald-950/50"
                            }`}
                          >
                            {m.label.replace(" (preview)", "")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {form.model === "meta/muse-spark-open" && (
                    <p className="text-xs text-emerald-950/45">
                      Muse Spark Open is a preview model.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className={FIELD_LABEL}>Coordination mode</Label>
                  <SegmentedControl
                    value={form.coordinationMode}
                    options={[
                      { value: "solo", label: "Solo" },
                      { value: "pipeline", label: "Pipeline" },
                    ]}
                    onChange={(v) => setForm({ ...form, coordinationMode: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ca-prompt" className={FIELD_LABEL}>
                    System prompt
                  </Label>
                  <Textarea
                    id="ca-prompt"
                    value={form.systemPrompt}
                    onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                    placeholder="You are a sharp pitch reviewer for early-stage startups…"
                    rows={4}
                    className={`${GLASS_INPUT} resize-none`}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ca-temperature" className={FIELD_LABEL}>
                        Temperature
                      </Label>
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-700">
                        {form.temperature.toFixed(1)}
                      </span>
                    </div>
                    <div className="px-0.5 pt-1">
                      <input
                        id="ca-temperature"
                        type="range"
                        min={0}
                        max={2}
                        step={0.1}
                        value={form.temperature}
                        onChange={(e) =>
                          setForm({ ...form, temperature: Number(e.target.value) })
                        }
                        className="ca-range w-full"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #14b8a6 ${tempPct}%, #d1fae5 ${tempPct}%, #d1fae5 100%)`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-emerald-950/45">
                      Lower is more focused, higher is more creative.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ca-max-tokens" className={FIELD_LABEL}>
                      Max tokens
                    </Label>
                    <Input
                      id="ca-max-tokens"
                      type="number"
                      min={1}
                      max={8000}
                      value={form.maxTokens}
                      onChange={(e) =>
                        setForm({ ...form, maxTokens: Number(e.target.value) || 1024 })
                      }
                      className={GLASS_INPUT}
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className={FIELD_LABEL}>Tools (configuration)</Label>
                  <div className="flex flex-wrap gap-2">
                    {TOOL_OPTIONS.map((tool) => {
                      const ToolIcon = TOOL_ICONS[tool];
                      const active = form.tools.includes(tool);
                      return (
                        <button
                          key={tool}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setForm({
                              ...form,
                              tools: active
                                ? form.tools.filter((t) => t !== tool)
                                : [...form.tools, tool],
                            })
                          }
                          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium backdrop-blur transition-all duration-200 ${
                            active
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_6px_16px_rgba(16,185,129,0.35)]"
                              : "border border-emerald-200/80 bg-white/50 text-emerald-900/70 hover:border-emerald-300 hover:text-emerald-900"
                          }`}
                        >
                          {ToolIcon && <ToolIcon className="h-3.5 w-3.5" />}
                          {tool}
                          {active && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-emerald-950/45">
                    Tools are saved with the agent's configuration.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-emerald-900/5 pt-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  {editingId && (
                    <Button
                      variant="outline"
                      className="rounded-full border-emerald-200 bg-white/60 backdrop-blur hover:bg-emerald-50"
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
                    className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition hover:from-emerald-600 hover:to-teal-600 sm:flex-none sm:px-8"
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? "Save changes" : "Create agent"}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Mission control (run) ── */}
          <section
            className={`rounded-[2rem] bg-gradient-to-b from-teal-200/70 via-white/40 to-emerald-200/50 p-[1.5px] ${
              running ? "ca-running" : "shadow-[0_10px_40px_rgba(6,78,59,0.08)]"
            }`}
          >
            <div className="rounded-[calc(2rem-1.5px)] bg-white/65 backdrop-blur-xl">
              <header className="flex items-center justify-between px-6 pb-1 pt-5">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-emerald-950">
                    Mission control
                  </h3>
                  <p className="text-xs text-emerald-950/50">
                    {runMode === "pipeline" ? "Pipeline // sequence" : "Solo // unit"}
                  </p>
                </div>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    running
                      ? "bg-emerald-500/15 text-emerald-700"
                      : result
                        ? "bg-teal-500/15 text-teal-700"
                        : "bg-emerald-950/5 text-emerald-950/50"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${running ? "animate-pulse bg-emerald-500" : "bg-current opacity-60"}`}
                  />
                  {running ? "Executing…" : result ? "Last run complete" : "Standby"}
                </span>
              </header>
              <div className="space-y-5 px-6 py-5">
                <p className="flex items-center gap-2 text-sm text-emerald-950/55">
                  <Play className="h-4 w-4 text-emerald-500" />
                  Run agents — solo runs one agent. Pipeline runs the agents you pick, in
                  the order you pick them, feeding each output into the next agent.
                </p>

                <div className="space-y-2">
                  <Label className={FIELD_LABEL}>Run mode</Label>
                  <SegmentedControl
                    value={runMode}
                    options={[
                      { value: "solo", label: "Solo" },
                      { value: "pipeline", label: "Pipeline" },
                    ]}
                    onChange={(v) => setRunMode(v as "solo" | "pipeline")}
                  />
                </div>

                {runMode === "solo" ? (
                  <div className="space-y-2">
                    <Label className={FIELD_LABEL}>Agent</Label>
                    <Select value={soloId} onValueChange={setSoloId}>
                      <SelectTrigger className={GLASS_INPUT}>
                        <SelectValue placeholder="Choose an agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className={FIELD_LABEL}>Pipeline agents (in run order)</Label>
                    <div className="space-y-1.5">
                      {agents.length === 0 && (
                        <p className="text-sm text-emerald-950/50">Create an agent first.</p>
                      )}
                      {agents.map((a) => {
                        const order = pipelineIds.indexOf(a.id);
                        return (
                          <label
                            key={a.id}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border px-3 py-2 text-sm backdrop-blur transition ${
                              order >= 0
                                ? "border-emerald-300 bg-emerald-50/70 text-emerald-950"
                                : "border-emerald-100/70 bg-white/40 text-emerald-950/75 hover:border-emerald-200"
                            }`}
                          >
                            <Checkbox
                              checked={order >= 0}
                              onCheckedChange={(checked) =>
                                togglePipelineAgent(a.id, checked === true)
                              }
                            />
                            <img
                              src={characterForModel(a.model)}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-xl object-cover ring-1 ring-white/70"
                            />
                            {order >= 0 && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-[10px] font-bold text-white">
                                {order + 1}
                              </span>
                            )}
                            <span className="font-medium">{a.name}</span>
                            <span className="ml-auto text-xs text-emerald-950/45">
                              {modelLabel(a.model)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Avatar chain — the run, as characters */}
                {vizAgents.length > 0 && (
                  <div className="rounded-3xl border border-emerald-100/80 bg-white/40 px-4 py-3.5 backdrop-blur">
                    <p className={FIELD_LABEL}>
                      {runMode === "pipeline" ? "Run sequence" : "On deck"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center">
                      {vizAgents.map((a, i) => {
                        const done = !!result && i < (result?.steps.length ?? 0);
                        return (
                          <span key={a.id} className="flex items-center">
                            <span className="flex flex-col items-center gap-1">
                              <span
                                className={`relative block rounded-full ${
                                  running ? "ca-avatar-live" : ""
                                }`}
                                style={
                                  running ? { animationDelay: `${i * 0.22}s` } : undefined
                                }
                              >
                                <img
                                  src={characterForModel(a.model)}
                                  alt={a.name}
                                  className={`h-12 w-12 rounded-full object-cover ring-2 ${
                                    done
                                      ? "ring-emerald-400"
                                      : "ring-white/80"
                                  } shadow-[0_8px_18px_rgba(6,78,59,0.18)]`}
                                />
                                {done && (
                                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white">
                                    <Check className="h-3 w-3" />
                                  </span>
                                )}
                              </span>
                              <span className="max-w-[4.5rem] truncate text-[10px] font-medium text-emerald-950/60">
                                {a.name}
                              </span>
                            </span>
                            {i < vizAgents.length - 1 && (
                              <svg
                                className="mx-1.5 mb-4 shrink-0"
                                width="34"
                                height="10"
                                viewBox="0 0 34 10"
                                fill="none"
                                aria-hidden
                              >
                                <path
                                  d="M1 5 H29 M25 1.5 L30 5 L25 8.5"
                                  stroke={done ? "#10b981" : "#6ee7b7"}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeDasharray="5 4"
                                  style={
                                    running
                                      ? { animation: "ca-dashflow 0.8s linear infinite" }
                                      : undefined
                                  }
                                />
                              </svg>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="ca-message" className={FIELD_LABEL}>
                    Message
                  </Label>
                  <Textarea
                    id="ca-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Give your team a task…"
                    rows={3}
                    className={`${GLASS_INPUT} resize-none`}
                  />
                </div>

                <Button
                  onClick={handleRun}
                  disabled={running || agents.length === 0}
                  className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 py-6 text-base font-semibold text-white shadow-[0_10px_26px_rgba(16,185,129,0.4)] transition hover:from-emerald-600 hover:to-teal-600 disabled:shadow-none"
                >
                  {running ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-5 w-5" />
                  )}
                  {running ? "Running…" : "Run"}
                </Button>

                {result && (
                  <div className="space-y-3">
                    <p className={FIELD_LABEL}>
                      Results · {result.steps.length} step{result.steps.length === 1 ? "" : "s"}
                    </p>
                    {result.steps.map((step, i) => (
                      <div
                        key={`${step.agent_id}-${i}`}
                        className="ca-fadeup rounded-3xl border border-white/60 bg-white/55 p-4 shadow-[0_8px_24px_rgba(6,78,59,0.06)] backdrop-blur"
                        style={{ animationDelay: `${i * 140}ms` }}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={characterForModel(step.model)}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-emerald-200"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-emerald-950">
                              {step.name}
                            </p>
                            <p className="text-[11px] text-emerald-950/50">
                              Step {String(i + 1).padStart(2, "0")}
                            </p>
                          </div>
                          <span className="rounded-full border border-emerald-200/80 bg-white/60 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                            {modelLabel(step.model)}
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-emerald-950/80">
                          {step.output}
                        </p>
                        <p className="mt-3 border-t border-emerald-900/5 pt-2 font-mono text-[11px] text-emerald-950/45">
                          {step.prompt_tokens + step.completion_tokens} tokens ·{" "}
                          {step.prompt_tokens} in / {step.completion_tokens} out
                        </p>
                      </div>
                    ))}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-full border border-emerald-200/70 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 px-5 py-3 text-sm text-emerald-950/70 backdrop-blur">
                      <span>
                        Total tokens:{" "}
                        <strong className="font-semibold text-emerald-900">
                          {result.usage.prompt_tokens + result.usage.completion_tokens}
                        </strong>{" "}
                        <span className="text-xs text-emerald-950/45">
                          ({result.usage.prompt_tokens} in / {result.usage.completion_tokens}{" "}
                          out)
                        </span>
                      </span>
                      <span className="ml-auto">
                        Credits charged:{" "}
                        <strong className="font-semibold text-emerald-900">
                          {Number(result.credits.charged).toFixed(2)}
                        </strong>
                        {result.credits.balance != null &&
                          ` · New balance: ${Number(result.credits.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
