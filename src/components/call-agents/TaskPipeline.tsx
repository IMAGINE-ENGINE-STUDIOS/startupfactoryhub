import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check, ChevronDown, ChevronLeft, ChevronRight, Clock, KanbanSquare, Loader2,
  Play, Plus, RefreshCw, Trash2, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Same glass tokens as SFHCallAgents, so this section reads as part of the
// one Agents console (dashboards and the 3D office alike).
const GLASS_PANEL =
  "rounded-[2rem] border border-border bg-card/70 shadow-[0_10px_40px_rgba(6,78,59,0.08)] backdrop-blur-xl";
const GLASS_INPUT =
  "rounded-2xl border-input bg-background/60 backdrop-blur transition focus-visible:ring-2 focus-visible:ring-emerald-400/60";
const FIELD_LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";
const GRADIENT_BUTTON =
  "rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)] transition hover:from-emerald-600 hover:to-teal-600 disabled:shadow-none";

// Same call-agents edge-function helper as SFHCallAgents / OfficePage (each
// surface carries its own copy; errors surface the server's message).
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

export interface TaskQueueItem {
  id: string;
  agentId: string;
  agentName: string;
  message: string;
  queuedAt: number;
}

interface DoneRun {
  id: string;
  agent_id: string | null;
  input: string | null;
  output: string | null;
  status: string;
  created_at: string;
}

const QUEUE_KEY = "sfh:agents-task-queue:v1";

function loadStoredQueue(): TaskQueueItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is TaskQueueItem =>
        !!i && typeof i.id === "string" && typeof i.agentId === "string" &&
        typeof i.message === "string"
    );
  } catch {
    return [];
  }
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const formatElapsed = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

const formatRunTime = (iso: string) =>
  new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function StatusBadge({ status }: { status: string }) {
  if (status === "ok") {
    return (
      <span
        title="Done"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_4px_10px_rgba(16,185,129,0.4)]"
      >
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        title="Failed"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_4px_10px_rgba(239,68,68,0.35)]"
      >
        <X className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span
      title={status === "refunded" ? "Refunded" : status}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border"
    >
      <Clock className="h-3.5 w-3.5" />
    </span>
  );
}

/**
 * Task pipeline for the Agents tab: a client-side queue (persisted in
 * localStorage) drained one task at a time through the same call-agents run
 * action Mission Control uses, an in-progress lane with a live elapsed
 * timer, and a Done carousel fed by the server-side call_agent_runs table
 * (runs are only recorded there once they finish). Any run error halts the
 * queue on the spot — the remaining tasks are never burned through.
 */
export default function TaskPipeline({
  agents,
  onRunComplete,
}: {
  agents: { id: string; name: string }[];
  onRunComplete?: () => void;
}) {
  const [queue, setQueue] = useState<TaskQueueItem[]>(loadStoredQueue);
  const [current, setCurrent] = useState<{ item: TaskQueueItem; startedAt: number } | null>(null);
  const [failure, setFailure] = useState<{ item: TaskQueueItem; error: string } | null>(null);
  const [done, setDone] = useState<DoneRun[]>([]);
  const [doneLoading, setDoneLoading] = useState(false);
  const [formAgentId, setFormAgentId] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const carouselRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const onRunCompleteRef = useRef(onRunComplete);
  onRunCompleteRef.current = onRunComplete;

  /* ── Done lane: finished runs, straight from call_agent_runs (RLS scopes
   *    the rows to the signed-in owner). ─────────────────────────────── */
  const refreshDone = useCallback(async () => {
    setDoneLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("call_agent_runs")
        .select("id, agent_id, input, output, status, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      setDone((data ?? []) as DoneRun[]);
    } catch {
      /* a failed refresh keeps the last list on screen */
    } finally {
      setDoneLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDone();
  }, [refreshDone]);

  /* ── Queue persistence ─────────────────────────────────────────────── */
  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch {
      /* storage full/blocked — the queue still works for this session */
    }
  }, [queue]);

  // Preselect the first agent in the add form once the team loads.
  useEffect(() => {
    if (!formAgentId && agents.length) setFormAgentId(agents[0].id);
  }, [agents, formAgentId]);

  /* ── Live elapsed ticker for the in-progress lane ──────────────────── */
  useEffect(() => {
    if (!current) return;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [current]);

  /* ── Queue runner: one task at a time. The head item leaves the queue
   *    the moment it is dispatched (so a reload mid-run can never charge
   *    it twice — its result still lands in Done from the server). Any
   *    error parks the item in the failure card and halts the runner
   *    until the user dismisses or requeues it. ──────────────────────── */
  useEffect(() => {
    if (busyRef.current || failure || current || queue.length === 0) return;
    const item = queue[0];
    busyRef.current = true;
    setQueue((q) => q.filter((i) => i.id !== item.id));
    setCurrent({ item, startedAt: Date.now() });
    void (async () => {
      try {
        await callAgentsApi({ action: "run", agent_id: item.agentId, message: item.message });
        await refreshDone();
        onRunCompleteRef.current?.();
      } catch (e) {
        setFailure({
          item,
          error: e instanceof Error ? e.message : "The run failed.",
        });
      } finally {
        busyRef.current = false;
        setCurrent(null);
      }
    })();
  }, [queue, current, failure, refreshDone]);

  const addToQueue = () => {
    const agent = agents.find((a) => a.id === formAgentId);
    if (!agent) {
      setFormError("Pick an agent for the task.");
      return;
    }
    if (!formMessage.trim()) {
      setFormError("Write the task first.");
      return;
    }
    setFormError(null);
    setQueue((q) => [
      ...q,
      {
        id: newId(),
        agentId: agent.id,
        agentName: agent.name,
        message: formMessage.trim(),
        queuedAt: Date.now(),
      },
    ]);
    setFormMessage("");
  };

  const removeFromQueue = (id: string) =>
    setQueue((q) => q.filter((i) => i.id !== id));

  const requeueFailure = () => {
    if (!failure) return;
    setQueue((q) => [failure.item, ...q]);
    setFailure(null);
  };

  const scrollCarousel = (dir: number) =>
    carouselRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

  const agentNameFor = (run: DoneRun) =>
    agents.find((a) => a.id === run.agent_id)?.name ?? "Agent";

  return (
    <section className={`${GLASS_PANEL} relative overflow-hidden px-4 py-5 sm:px-8 sm:py-6`}>
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-emerald-300/25 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)]">
            <KanbanSquare className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Task pipeline
            </h3>
            <p className="text-xs text-muted-foreground">
              Queue tasks for your agents — they run one at a time, and finished
              work lands in Done.
            </p>
          </div>
        </div>

        <div className="mt-5 grid min-w-0 items-start gap-4 lg:grid-cols-2">
          {/* ── In progress ─────────────────────────────────────────── */}
          <div className="min-w-0 rounded-3xl border border-border bg-muted/40 p-4 backdrop-blur">
            <p className={FIELD_LABEL}>In progress</p>
            {current ? (
              <div className="ca-running mt-3 rounded-2xl border border-emerald-400/50 bg-card/70 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-500" />
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {current.item.agentName}
                  </p>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    {formatElapsed(now - current.startedAt)}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                  {current.item.message}
                </p>
              </div>
            ) : failure ? (
              <div className="mt-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                    <X className="h-3.5 w-3.5" />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {failure.item.agentName} — task failed
                  </p>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                  {failure.item.message}
                </p>
                <p className="mt-2 text-xs font-medium text-destructive">{failure.error}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  The queue is stopped — nothing else will run until you decide.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={requeueFailure}
                    className={`${GRADIENT_BUTTON} px-4`}
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5" /> Requeue task
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFailure(null)}
                    className="rounded-full border-border bg-background/60 backdrop-blur hover:bg-muted"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                Nothing running. Queued tasks start automatically, one at a time.
              </p>
            )}
          </div>

          {/* ── Queue ───────────────────────────────────────────────── */}
          <div className="min-w-0 rounded-3xl border border-border bg-muted/40 p-4 backdrop-blur">
            <p className={FIELD_LABEL}>
              Queue{queue.length > 0 ? ` · ${queue.length} waiting` : ""}
            </p>
            <div className="mt-3 space-y-2.5">
              <div className="space-y-2">
                <Label className={FIELD_LABEL}>Agent</Label>
                <Select value={formAgentId} onValueChange={setFormAgentId}>
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
              <div className="space-y-2">
                <Label htmlFor="tp-task" className={FIELD_LABEL}>
                  Task
                </Label>
                <Textarea
                  id="tp-task"
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="Describe the task for this agent…"
                  rows={2}
                  className={`${GLASS_INPUT} min-h-[40px] resize-none`}
                />
              </div>
              {formError && <p className="text-xs font-medium text-destructive">{formError}</p>}
              <Button
                onClick={addToQueue}
                disabled={agents.length === 0}
                className={`${GRADIENT_BUTTON} w-full px-5 sm:w-auto`}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add to queue
              </Button>
              {agents.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Create an agent first — then you can line up tasks for it here.
                </p>
              )}
            </div>

            {queue.length > 0 && (
              <div className="mt-4 space-y-1.5 border-t border-border pt-3">
                {queue.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 rounded-2xl border border-border bg-background/50 px-3 py-2 text-sm backdrop-blur"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.agentName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground" title={item.message}>
                        {item.message}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {new Date(item.queuedAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      title="Remove from queue"
                      aria-label={`Remove task for ${item.agentName}`}
                      className="shrink-0 rounded-full border-destructive/30 bg-background/60 px-2.5 text-destructive backdrop-blur hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeFromQueue(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {queue.length === 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Queue is empty — add a task above and it starts on its own.
              </p>
            )}
          </div>
        </div>

        {/* ── Done carousel ─────────────────────────────────────────── */}
        <div className="mt-4 min-w-0 rounded-3xl border border-border bg-muted/40 p-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <p className={`${FIELD_LABEL} flex-1`}>
              Done{done.length > 0 ? ` · ${done.length} recent` : ""}
            </p>
            <button
              type="button"
              onClick={() => void refreshDone()}
              title="Refresh finished tasks"
              aria-label="Refresh finished tasks"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground backdrop-blur transition hover:text-foreground"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${doneLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel(-1)}
              title="Scroll back"
              aria-label="Scroll finished tasks back"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground backdrop-blur transition hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel(1)}
              title="Scroll forward"
              aria-label="Scroll finished tasks forward"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background/60 text-muted-foreground backdrop-blur transition hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {doneLoading && done.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
              Loading finished tasks…
            </p>
          ) : done.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No finished tasks yet — completed runs will appear here.
            </p>
          ) : (
            <div
              ref={carouselRef}
              className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1.5"
            >
              {done.map((run) => {
                const expanded = expandedId === run.id;
                return (
                  <article
                    key={run.id}
                    className="w-[270px] shrink-0 snap-start rounded-2xl border border-border bg-card/70 p-3.5 backdrop-blur"
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge status={run.status} />
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                        {agentNameFor(run)}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatRunTime(run.created_at)}
                      </span>
                    </div>
                    <p
                      className="mt-2 line-clamp-2 min-h-[2rem] text-xs leading-relaxed text-muted-foreground"
                      title={run.input ?? ""}
                    >
                      {run.input || "—"}
                    </p>
                    {run.output && (
                      <>
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : run.id)}
                          className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-300"
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                          />
                          {expanded ? "Hide output" : "View output"}
                        </button>
                        {expanded && (
                          <div className="mt-2 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted/50 p-2.5 text-[11px] leading-relaxed text-foreground/90">
                            {run.output}
                          </div>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
