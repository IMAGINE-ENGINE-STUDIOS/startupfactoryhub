import { useCallback, useEffect, useState } from "react";
import { Bot, Coins, Loader2, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" /> SFH Call Agents
          </CardTitle>
          <CardDescription>Please sign in to configure and run your agents.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" /> SFH Call Agents
              </CardTitle>
              <CardDescription>
                Configure your own AI agents, coordinate them in pipelines, and run them on
                Meta models. Runs are billed from your AI credits based on actual token usage.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1.5 text-sm">
              <Coins className="h-4 w-4" />
              {isAdmin
                ? "Admin — unlimited"
                : balance == null
                  ? "Credits: —"
                  : `Credits: ${Number(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          {notice}
        </div>
      )}

      {/* Agent list */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Your agents</h3>
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your agents…
          </p>
        ) : agents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No agents yet. Create your first one below.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {agent.is_active ? "Active" : "Paused"}
                      </span>
                      <Switch
                        checked={agent.is_active}
                        onCheckedChange={(checked) => handleToggleActive(agent, checked)}
                      />
                    </div>
                  </div>
                  {agent.description && (
                    <CardDescription>{agent.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline">{modelLabel(agent.model)}</Badge>
                    <Badge variant="outline">
                      {agent.coordination?.mode === "pipeline" ? "Pipeline" : "Solo"}
                    </Badge>
                    {(agent.tools ?? []).map((tool) => (
                      <Badge key={tool} variant="secondary">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            {editingId ? "Edit agent" : "Create an agent"}
          </CardTitle>
          <CardDescription>
            Pick a model, give it instructions, and choose how it coordinates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                <SelectContent>
                  {MODEL_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
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
                <SelectContent>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="pipeline">Pipeline</SelectItem>
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
              <Label>Temperature: {form.temperature.toFixed(1)}</Label>
              <Slider
                value={[form.temperature]}
                onValueChange={(v) => setForm({ ...form, temperature: v[0] ?? 0.7 })}
                min={0}
                max={2}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
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
                <label key={tool} className="flex cursor-pointer items-center gap-2 text-sm">
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
            <p className="text-xs text-muted-foreground">
              Tools are saved with the agent's configuration.
            </p>
          </div>

          <div className="flex items-center gap-3">
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
              <Button onClick={handleFormSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Save changes" : "Create agent"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Run panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Play className="h-4 w-4" /> Run agents
          </CardTitle>
          <CardDescription>
            Solo runs one agent. Pipeline runs the agents you pick, in the order you pick
            them, feeding each output into the next agent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Run mode</Label>
              <Select value={runMode} onValueChange={(v) => setRunMode(v as "solo" | "pipeline")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="pipeline">Pipeline</SelectItem>
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
                <Label>Pipeline agents (in run order)</Label>
                <div className="space-y-1.5">
                  {agents.length === 0 && (
                    <p className="text-sm text-muted-foreground">Create an agent first.</p>
                  )}
                  {agents.map((a) => {
                    const order = pipelineIds.indexOf(a.id);
                    return (
                      <label
                        key={a.id}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={order >= 0}
                          onCheckedChange={(checked) =>
                            togglePipelineAgent(a.id, checked === true)
                          }
                        />
                        {order >= 0 && (
                          <Badge variant="secondary" className="px-1.5 py-0">
                            {order + 1}
                          </Badge>
                        )}
                        {a.name}
                        <span className="text-xs text-muted-foreground">
                          {modelLabel(a.model)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

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

          <Button onClick={handleRun} disabled={running || agents.length === 0}>
            {running ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {running ? "Running…" : "Run"}
          </Button>

          {result && (
            <div className="space-y-3">
              {result.steps.map((step, i) => (
                <div key={`${step.agent_id}-${i}`} className="rounded-md border p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      Step {i + 1}: {step.name}
                    </span>
                    <Badge variant="outline">{modelLabel(step.model)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {step.prompt_tokens + step.completion_tokens} tokens
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{step.output}</p>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                Total tokens:{" "}
                {result.usage.prompt_tokens + result.usage.completion_tokens} (
                {result.usage.prompt_tokens} in / {result.usage.completion_tokens} out) ·
                Credits charged: {Number(result.credits.charged).toFixed(2)}
                {result.credits.balance != null &&
                  ` · New balance: ${Number(result.credits.balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
