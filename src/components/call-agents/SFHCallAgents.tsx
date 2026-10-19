import { useCallback, useEffect, useState } from "react";
import {
  BookOpen, Bot, Check, Code2, Coins, FileText, Globe, KanbanSquare, Loader2,
  Pencil, Play, Plus, Route, Sparkles, Trash2, Wand2,
} from "lucide-react";
import { toast } from "sonner";
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
import { agentLlama33, agentMaverick, agentScout, agentInstant, agentSpark, agentGreeter } from "@/assets/agents/characters";
import { agentChatBus } from "@/lib/agentChatBus";

// ── Startup Factory Hub glassmorphism: light, airy glass panels in the
// platform's emerald + teal palette — the same language as AIFeaturesHub —
// so the Agents tab feels native to the SFH dashboards. ────────────────────

const GLASS_CSS = `
@keyframes ca-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
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
  background: linear-gradient(135deg, #10b981, #14b8a6); border: 3px solid hsl(var(--background));
  box-shadow: 0 2px 10px rgba(16,185,129,0.45); cursor: pointer;
}
.ca-range::-moz-range-thumb {
  width: 22px; height: 22px; border-radius: 9999px;
  background: linear-gradient(135deg, #10b981, #14b8a6); border: 3px solid hsl(var(--background));
  box-shadow: 0 2px 10px rgba(16,185,129,0.45); cursor: pointer;
}
`;

const GLASS_PANEL =
  "rounded-[2rem] border border-border bg-card/70 shadow-[0_10px_40px_rgba(6,78,59,0.08)] backdrop-blur-xl";
const GLASS_INPUT =
  "rounded-2xl border-input bg-background/60 backdrop-blur transition focus-visible:ring-2 focus-visible:ring-emerald-400/60";
const FIELD_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";

// Users pick specialists by what they do, never by the model underneath:
// the model id stays in state/data (the backend needs it), while the UI only
// ever speaks in personas — role, skill, and character.
interface Persona {
  role: string;
  skill: string;
  img: string;
}
const PERSONAS: Record<string, Persona> = {
  "llama-3.3-70b-versatile": {
    role: "Builder",
    skill: "Builds, writes and ships — pages, plans, code and documents.",
    img: agentLlama33,
  },
  "meta-llama/llama-4-maverick-17b-128e-instruct": {
    role: "Launcher",
    skill: "Launches ideas fast — campaigns, pitches and go-to-market.",
    img: agentMaverick,
  },
  "meta-llama/llama-4-scout-17b-16e-instruct": {
    role: "Analyst",
    skill: "Researches and analyzes — markets, data and competitors.",
    img: agentScout,
  },
  "meta/muse-spark-open": {
    role: "Architect",
    skill: "Designs systems and strategy — deep, structured thinking.",
    img: agentSpark,
  },
  "llama-3.1-8b-instant": {
    role: "Ideator",
    skill: "Quick ideas and snappy answers in seconds.",
    img: agentInstant,
  },
};
const MODEL_ORDER = [
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "meta/muse-spark-open",
  "llama-3.1-8b-instant",
];
const personaForModel = (model: string): Persona =>
  PERSONAS[model] ?? PERSONAS["llama-3.3-70b-versatile"];

const TOOL_OPTIONS = ["Web search", "Knowledge base", "Imagine Engine", "Code review"];
const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Web search": Globe,
  "Knowledge base": BookOpen,
  "Imagine Engine": Wand2,
  "Code review": Code2,
};

// Optional app integrations: when enabled on an agent, each of its run
// results can be sent into that app with one tap. Persisted inside the
// agent's coordination jsonb — no separate storage.
export interface AgentIntegrations {
  lightpaper: boolean;
  crm: boolean;
  journey: boolean;
  resourcemap: boolean;
}
type IntegrationKey = keyof AgentIntegrations;
const NO_INTEGRATIONS: AgentIntegrations = {
  lightpaper: false,
  crm: false,
  journey: false,
  resourcemap: false,
};
const INTEGRATION_DEFS: {
  key: IntegrationKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "lightpaper", label: "Lite Paper", icon: FileText },
  { key: "crm", label: "CRM", icon: KanbanSquare },
  { key: "journey", label: "Journey", icon: Route },
  { key: "resourcemap", label: "Resource Map", icon: Globe },
];
const integrationsOf = (agent: CallAgent): AgentIntegrations => ({
  ...NO_INTEGRATIONS,
  ...(agent.coordination?.integrations ?? {}),
});

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
  coordination: { mode?: string; integrations?: Partial<AgentIntegrations> };
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
  integrations: AgentIntegrations;
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
  integrations: { ...NO_INTEGRATIONS },
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
    <div className="relative flex rounded-full border border-border bg-muted/50 p-1 backdrop-blur">
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
            value === o.value ? "text-white" : "text-muted-foreground hover:text-foreground"
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
  const [sendingKey, setSendingKey] = useState<string | null>(null);

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
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await saveAgent({
        id: editingId ?? undefined,
        // An unnamed agent takes its specialist's name.
        name: form.name.trim() || personaForModel(form.model).role,
        description: form.description.trim() || null,
        model: form.model,
        system_prompt: form.systemPrompt,
        temperature: form.temperature,
        max_tokens: form.maxTokens,
        tools: form.tools,
        coordination: { mode: form.coordinationMode, integrations: form.integrations },
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
      integrations: integrationsOf(agent),
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
      const runData = data as RunResult;
      setResult(runData);
      if (data.credits?.balance != null) setBalance(data.credits.balance);
      // Mirror the finished run into the Genius bubble (live, via the bus)
      // and into the saved Genius chat logs. Best-effort only — a mirror
      // failure must never fail a completed run.
      try {
        const busSteps = runData.steps.map((s) => {
          const agent = agents.find((a) => a.id === s.agent_id);
          return {
            agentName: s.name,
            persona: personaForModel(agent?.model ?? s.model).role,
            output: s.output,
          };
        });
        const first = busSteps[0];
        if (first && user) {
          await (supabase as any).from("genius_ai_chat_logs").insert({
            user_id: user.id,
            title: `Agent · ${first.agentName} (${first.persona})`,
            messages: [
              { role: "user", content: message.trim() },
              ...runData.steps.map((s) => ({ role: "assistant", content: s.output })),
            ],
            tool_used: "sfh-agent",
          });
        }
        if (first) {
          agentChatBus.publish({
            agentName: first.agentName,
            persona: first.persona,
            task: message.trim(),
            steps: busSteps,
            at: Date.now(),
          });
        }
      } catch {
        /* Genius mirroring is best-effort. */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "The run failed.");
    } finally {
      setRunning(false);
    }
  };

  // Send one step's output into another SFH app (client-side, the user's own
  // session/RLS — the same write paths those apps use themselves).
  const sendStepToApp = async (step: RunStep, key: IntegrationKey) => {
    if (!user) return;
    const title = message.trim().slice(0, 80) || "Agent output";
    const body = step.output;
    const busyKey = `${step.agent_id}:${key}`;
    setSendingKey(busyKey);
    try {
      if (key === "lightpaper") {
        // Lite Paper documents store the editor payload from buildSaveContent()
        // in LightPaperDocument: page HTML + editor defaults.
        const escapeHtml = (s: string) =>
          s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const pageHtml =
          body
            .split(/\n{2,}/)
            .map(
              (p) =>
                `<p style="font-size: 14pt; color: inherit;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`
            )
            .join("") || `<p style="font-size: 14pt; color: inherit;"></p>`;
        const { error } = await supabase.from("lightpaper_projects").insert({
          user_id: user.id,
          project_type: "document",
          title,
          content: {
            html: pageHtml,
            pages: [pageHtml],
            font: "Arial",
            size: "14",
            darkMode: false,
            currentPage: 1,
            totalPages: 1,
            pageFormat: "a4",
            orientation: "portrait",
            viewMode: false,
            viewModeImages: [],
            overlayTextBoxes: [],
          },
        });
        if (error) throw error;
        toast.success("Sent to Lite Paper");
      } else if (key === "crm") {
        // Same lazy bootstrap as CRMBoard.initializePipeline: first pipeline
        // (creating it with the default stages when the user has none).
        const { data: pipelines, error: pipelineError } = await supabase
          .from("crm_pipelines")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);
        if (pipelineError) throw pipelineError;
        let pipelineId = pipelines?.[0]?.id as string | undefined;
        if (!pipelineId) {
          const { data: newPipeline, error: createError } = await supabase
            .from("crm_pipelines")
            .insert({
              user_id: user.id,
              name: "Sales Pipeline",
              description: "Default sales pipeline",
            })
            .select()
            .single();
          if (createError) throw createError;
          pipelineId = newPipeline.id;
          const { error: stageError } = await supabase.from("crm_stages").insert(
            [
              { name: "Leads", color: "blue", position: 0 },
              { name: "Contacted", color: "purple", position: 1 },
              { name: "Meeting", color: "yellow", position: 2 },
              { name: "Proposal", color: "orange", position: 3 },
              { name: "Closed", color: "green", position: 4 },
            ].map((stage) => ({ ...stage, pipeline_id: pipelineId }))
          );
          if (stageError) throw stageError;
        }
        const { data: stages, error: stagesError } = await supabase
          .from("crm_stages")
          .select("id")
          .eq("pipeline_id", pipelineId)
          .order("position");
        if (stagesError) throw stagesError;
        if (!stages?.length) throw new Error("No CRM stage is available yet.");
        const { error } = await supabase.from("crm_cards").insert({
          stage_id: stages[0].id,
          user_id: user.id,
          title,
          description: body,
          notes: `From SFH Agent ${step.name}`,
          status: "active",
          priority: "medium",
          tasks: [],
        } as any);
        if (error) throw error;
        toast.success("Sent to CRM");
      } else if (key === "journey") {
        // Custom journey step, same shape as StartupRoadmap.addCustomStep.
        const { error } = await supabase.from("roadmap_progress").insert({
          user_id: user.id,
          step_id: `custom-${Date.now()}`,
          completed: false,
          notes: JSON.stringify({ title, description: body, checklist: [] }),
        });
        if (error) throw error;
        toast.success("Sent to Journey");
      } else {
        const { error } = await supabase.from("resources").insert({
          author_id: user.id,
          is_verified: false,
          title,
          description: body,
          resource_type: "other",
          location_type: "online",
        });
        if (error) throw error;
        toast.success("Sent to Resource Map");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send that just now.");
    } finally {
      setSendingKey(null);
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
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Agents</h2>
          </div>
          <p className="relative mt-3 text-sm text-muted-foreground">
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
        <section className="rounded-[2rem] bg-gradient-to-br from-emerald-400/60 via-border to-teal-400/60 p-[1.5px] shadow-[0_10px_40px_rgba(6,78,59,0.10)]">
          <div className="relative overflow-hidden rounded-[calc(2rem-1.5px)] bg-card/70 px-6 py-6 backdrop-blur-xl sm:px-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-teal-300/30 blur-3xl" />
            <div className="relative flex flex-wrap items-center gap-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_10px_24px_rgba(16,185,129,0.4)]">
                <Bot className="h-7 w-7" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  Agents
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Build your AI team of specialists.
                </p>
                <p className="mt-1 max-w-xl text-xs text-muted-foreground">
                  Configure your own AI agents, coordinate them in pipelines, and put
                  them to work. Runs are billed from your AI credits based on actual
                  token usage.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur">
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
          <div className="rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-3.5 text-sm text-destructive backdrop-blur">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-sm text-emerald-700 backdrop-blur dark:text-emerald-300">
            {notice}
          </div>
        )}

        {/* ── 2 · Character stage — your team ────────────── */}
        <section className="space-y-4">
          <div className="flex items-end justify-between px-1">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">Your team</h3>
              <p className="text-xs text-muted-foreground">
                {loading
                  ? "Loading your agents…"
                  : `${agents.length} agent${agents.length === 1 ? "" : "s"} · tap a character to add it to the run`}
              </p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-[11px] font-medium text-foreground backdrop-blur sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Specialists ready
            </span>
          </div>

          {loading ? (
            <div className={`${GLASS_PANEL} flex items-center gap-3 px-6 py-8 text-sm text-muted-foreground`}>
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              Loading your agents…
            </div>
          ) : agents.length === 0 ? (
            <div className={`${GLASS_PANEL} flex flex-col items-center gap-5 px-6 py-6 text-center sm:flex-row sm:text-left`}>
              <div className="ca-float shrink-0">
                <img
                  src={agentGreeter}
                  alt="Agent greeter character"
                  className="h-20 w-20 object-contain drop-shadow-[0_16px_24px_rgba(16,185,129,0.35)]"
                />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-foreground">No agents yet</h4>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {agents.map((agent, idx) => {
                const selected = isSelectedForRun(agent);
                const order = pipelineIds.indexOf(agent.id);
                return (
                  <article
                    key={agent.id}
                    onClick={() => handleCardSelect(agent)}
                    className={`group relative cursor-pointer rounded-3xl border bg-card/70 p-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(6,78,59,0.13)] ${
                      selected
                        ? "border-emerald-400/60 shadow-[0_14px_34px_rgba(16,185,129,0.20)] ring-2 ring-emerald-400/70"
                        : "border-border shadow-[0_8px_26px_rgba(6,78,59,0.07)]"
                    }`}
                  >
                    {/* aura behind active agents */}
                    {agent.is_active && (
                      <div
                        className="pointer-events-none absolute inset-x-6 top-3 h-24 rounded-full bg-emerald-400/20 blur-2xl"
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
                          src={personaForModel(agent.model).img}
                          alt={`${personaForModel(agent.model).role} character`}
                          className="h-44 w-full object-contain px-2 pt-2 drop-shadow-[0_18px_24px_rgba(6,78,59,0.28)]"
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
                      <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${agent.is_active ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/40"}`}
                        />
                        {agent.is_active ? "Active" : "Paused"}
                      </span>
                    </div>

                    <div className="relative mt-3 flex items-center gap-2 px-0.5">
                      <h4 className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-foreground">
                        {agent.name}
                      </h4>
                      <span className="shrink-0 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-foreground backdrop-blur">
                        {personaForModel(agent.model).role}
                      </span>
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={agent.is_active}
                          onCheckedChange={(checked) => handleToggleActive(agent, checked)}
                        />
                      </div>
                    </div>
                    {agent.description && (
                      <p className="mt-1 line-clamp-2 px-0.5 text-xs text-muted-foreground">
                        {agent.description}
                      </p>
                    )}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 px-0.5">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                        {agent.coordination?.mode === "pipeline" ? "Pipeline" : "Solo"}
                      </span>
                      {(agent.tools ?? []).map((tool) => (
                        <span
                          key={tool}
                          className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground ring-1 ring-border"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                    <div
                      className="mt-3 flex gap-2 border-t border-border px-0.5 pt-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-border bg-background/60 backdrop-blur hover:bg-muted"
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
                        className="rounded-full border-destructive/30 bg-background/60 text-destructive backdrop-blur hover:bg-destructive/10 hover:text-destructive"
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
            className="scroll-mt-24 rounded-[2rem] bg-gradient-to-b from-emerald-400/40 via-border to-teal-400/40 p-[1.5px] shadow-[0_10px_40px_rgba(6,78,59,0.08)]"
          >
            <div className="rounded-[calc(2rem-1.5px)] bg-card/70 backdrop-blur-xl">
              <header className="flex items-center justify-between px-6 pb-1 pt-5">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    Design studio
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {editingId ? "Edit unit" : "New unit"} ·{" "}
                    {editingId ? "Mode: update" : "Mode: create"}
                  </p>
                </div>
                <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_6px_14px_rgba(16,185,129,0.3)]">
                  {editingId ? "Editing" : "Create"}
                </span>
              </header>
              <div className="space-y-5 px-6 py-5">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  {editingId ? "Edit agent" : "Create an agent"} — pick a specialist, give
                  it instructions, and choose how it coordinates.
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

                {/* Character-select specialist picker */}
                <div className="space-y-2.5">
                  <Label className={FIELD_LABEL}>Specialist — choose your character</Label>
                  <div className="flex flex-wrap gap-3">
                    {MODEL_ORDER.map((id) => {
                      const persona = PERSONAS[id];
                      const active = form.model === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setForm({ ...form, model: id })}
                          className="group flex w-[4.5rem] flex-col items-center gap-1.5"
                          aria-pressed={active}
                        >
                          <span
                            className={`relative block overflow-hidden rounded-2xl transition-all duration-300 ${
                              active
                                ? "scale-105 shadow-[0_10px_24px_rgba(16,185,129,0.35)] ring-[3px] ring-emerald-400"
                                : "ring-1 ring-border group-hover:scale-[1.03] group-hover:ring-emerald-400/60"
                            }`}
                          >
                            <img
                              src={persona.img}
                              alt={persona.role}
                              className="h-14 w-14 object-contain drop-shadow-[0_6px_10px_rgba(6,78,59,0.25)]"
                            />
                            {active && (
                              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </span>
                          <span
                            className={`text-center text-[11px] font-medium leading-tight ${
                              active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                            }`}
                          >
                            {persona.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {personaForModel(form.model).role}
                    </span>{" "}
                    — {personaForModel(form.model).skill}
                  </p>
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
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
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
                          background: `linear-gradient(to right, #10b981 0%, #14b8a6 ${tempPct}%, hsl(var(--muted)) ${tempPct}%, hsl(var(--muted)) 100%)`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
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
                              : "border border-border bg-background/60 text-muted-foreground hover:border-emerald-400/50 hover:text-foreground"
                          }`}
                        >
                          {ToolIcon && <ToolIcon className="h-3.5 w-3.5" />}
                          {tool}
                          {active && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tools are saved with the agent's configuration.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <Label className={FIELD_LABEL}>App integrations</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTEGRATION_DEFS.map(({ key, label, icon: IntegrationIcon }) => {
                      const active = form.integrations[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setForm({
                              ...form,
                              integrations: { ...form.integrations, [key]: !active },
                            })
                          }
                          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium backdrop-blur transition-all duration-200 ${
                            active
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_6px_16px_rgba(16,185,129,0.35)]"
                              : "border border-border bg-background/60 text-muted-foreground hover:border-emerald-400/50 hover:text-foreground"
                          }`}
                        >
                          <IntegrationIcon className="h-3.5 w-3.5" />
                          {label}
                          {active && <Check className="h-3.5 w-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Let this agent work inside your other apps — send its work there
                    after a run.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
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
                      className="rounded-full border-border bg-background/60 backdrop-blur hover:bg-muted"
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
            className={`rounded-[2rem] bg-gradient-to-b from-teal-400/40 via-border to-emerald-400/40 p-[1.5px] ${
              running ? "ca-running" : "shadow-[0_10px_40px_rgba(6,78,59,0.08)]"
            }`}
          >
            <div className="rounded-[calc(2rem-1.5px)] bg-card/70 backdrop-blur-xl">
              <header className="flex items-center justify-between px-6 pb-1 pt-5">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    Mission control
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {runMode === "pipeline" ? "Pipeline // sequence" : "Solo // unit"}
                  </p>
                </div>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                    running
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : result
                        ? "bg-teal-500/15 text-teal-600 dark:text-teal-400"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${running ? "animate-pulse bg-emerald-500" : "bg-current opacity-60"}`}
                  />
                  {running ? "Executing…" : result ? "Last run complete" : "Standby"}
                </span>
              </header>
              <div className="space-y-5 px-6 py-5">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
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
                        <p className="text-sm text-muted-foreground">Create an agent first.</p>
                      )}
                      {agents.map((a) => {
                        const order = pipelineIds.indexOf(a.id);
                        return (
                          <label
                            key={a.id}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border px-3 py-2 text-sm backdrop-blur transition ${
                              order >= 0
                                ? "border-emerald-400/60 bg-emerald-500/10 text-foreground"
                                : "border-border bg-background/50 text-foreground/80 hover:border-emerald-400/40"
                            }`}
                          >
                            <Checkbox
                              checked={order >= 0}
                              onCheckedChange={(checked) =>
                                togglePipelineAgent(a.id, checked === true)
                              }
                            />
                            <img
                              src={personaForModel(a.model).img}
                              alt=""
                              className="h-8 w-8 shrink-0 object-contain"
                            />
                            {order >= 0 && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-[10px] font-bold text-white">
                                {order + 1}
                              </span>
                            )}
                            <span className="font-medium">{a.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {personaForModel(a.model).role}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Avatar chain — the run, as characters */}
                {vizAgents.length > 0 && (
                  <div className="rounded-3xl border border-border bg-muted/40 px-4 py-3.5 backdrop-blur">
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
                                  src={personaForModel(a.model).img}
                                  alt={a.name}
                                  className={`h-12 w-12 rounded-full object-contain ring-2 ${
                                    done
                                      ? "ring-emerald-400"
                                      : "ring-border"
                                  } shadow-[0_8px_18px_rgba(6,78,59,0.18)]`}
                                />
                                {done && (
                                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-background">
                                    <Check className="h-3 w-3" />
                                  </span>
                                )}
                              </span>
                              <span className="max-w-[4.5rem] truncate text-[10px] font-medium text-muted-foreground">
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
                    {result.steps.map((step, i) => {
                      const stepAgent = agents.find((a) => a.id === step.agent_id);
                      const stepIntegrations = stepAgent
                        ? INTEGRATION_DEFS.filter(
                            (d) => integrationsOf(stepAgent)[d.key]
                          )
                        : [];
                      return (
                      <div
                        key={`${step.agent_id}-${i}`}
                        className="ca-fadeup rounded-3xl border border-border bg-card/60 p-4 shadow-[0_8px_24px_rgba(6,78,59,0.06)] backdrop-blur"
                        style={{ animationDelay: `${i * 140}ms` }}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={personaForModel(step.model).img}
                            alt=""
                            className="h-9 w-9 rounded-full object-contain ring-2 ring-emerald-400/50"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {step.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Step {String(i + 1).padStart(2, "0")}
                            </p>
                          </div>
                          <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                            {personaForModel(step.model).role}
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
                          {step.output}
                        </p>
                        {stepIntegrations.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              Send to
                            </span>
                            {stepIntegrations.map(({ key, label, icon: SendIcon }) => {
                              const busy = sendingKey === `${step.agent_id}:${key}`;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  disabled={busy}
                                  onClick={() => sendStepToApp(step, key)}
                                  className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 backdrop-blur transition hover:bg-emerald-500/20 disabled:opacity-60 dark:text-emerald-300"
                                >
                                  {busy ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <SendIcon className="h-3 w-3" />
                                  )}
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <p className="mt-3 border-t border-border pt-2 font-mono text-[11px] text-muted-foreground">
                          {step.prompt_tokens + step.completion_tokens} tokens ·{" "}
                          {step.prompt_tokens} in / {step.completion_tokens} out
                        </p>
                      </div>
                      );
                    })}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-full border border-border bg-muted/50 px-5 py-3 text-sm text-muted-foreground backdrop-blur">
                      <span>
                        Total tokens:{" "}
                        <strong className="font-semibold text-foreground">
                          {result.usage.prompt_tokens + result.usage.completion_tokens}
                        </strong>{" "}
                        <span className="text-xs text-muted-foreground">
                          ({result.usage.prompt_tokens} in / {result.usage.completion_tokens}{" "}
                          out)
                        </span>
                      </span>
                      <span className="ml-auto">
                        Credits charged:{" "}
                        <strong className="font-semibold text-foreground">
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
