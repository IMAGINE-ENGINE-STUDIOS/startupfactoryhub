// @ts-nocheck -- Imagine Studio v2
/**
 * SHIFT MODE — the office's long-running work system (founder directive
 * 2026-10-25). One-off agent chats stop at a few words; a SHIFT does not.
 *
 * How it works:
 *  - The user gives the MANAGER a goal and presses Start Shift.
 *  - The Manager (a call-agent with an orchestration system prompt) breaks
 *    the goal into a full plan of specialist tasks — the COMPLETE queue for
 *    every agent is created BEFORE the first task is sent.
 *  - The dispatcher runs the assembly line: each agent works ONE task at a
 *    time, but all agents work IN PARALLEL, and a task only starts when the
 *    tasks it depends on are done — its message carries those finished
 *    deliverables as handoff input, so specialists build on each other
 *    instead of bottlenecking or duplicating.
 *  - Every finished task goes back to the Manager for a sufficiency review.
 *    Outlines and stubs are rejected with exact feedback and the task is
 *    re-queued to the same specialist (max 2 rounds, then best-effort is
 *    accepted and logged, so one weak task never stalls the company).
 *  - SOFT STOP: the Manager stops sending new tasks; in-flight work lands
 *    and is recorded. The user can then edit the goal, delete/reassign
 *    tasks, and resume — the plan changes course mid-shift.
 *  - HARD STOP: everything halts at once. Queued work is cancelled and
 *    in-flight results are discarded (a generation counter invalidates
 *    them), nothing further is dispatched or reviewed.
 *  - When the queue drains, the ARCHIVIST (the Writer) receives every
 *    finished deliverable and compiles the shift report — a real document
 *    (rendered in the panel, downloadable as PDF / Markdown / Word doc).
 *
 * State lives in localStorage (same pattern as the Agents task queue) and
 * the engine runs while the office tab is open; closing the tab pauses
 * the shift, reopening resumes it.
 */
import { supabase } from "@/integrations/supabase/client";
import { OFFICE_BOTS } from "@/imagine-studio/lib/officeWorld";

async function callAgentsApi(body: Record<string, unknown>): Promise<any> {
  const { data, error } = await supabase.functions.invoke("call-agents", { body });
  if (error) {
    let message = error.message || "call-agents failed";
    try {
      const ctx = await (error as any).context?.json?.();
      if (ctx?.error) message = ctx.error;
    } catch { /* keep the default message */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export const runOutput = (r: any): string =>
  (r?.steps || []).map((s: any) => s.output).filter(Boolean).join("\n\n") || r?.output || "";

/* ------------------------------------------------------------------ */
/* The corporate team structure                                        */
/* ------------------------------------------------------------------ */

export interface TeamRole {
  key: string;
  name: string;
  title: string;
  dept: string;
  specialties: string[];
  deliverables: string[];
  prompt: string;
}

const role = (name: string, title: string, dept: string, specialties: string[], deliverables: string[]): TeamRole => {
  const bot = OFFICE_BOTS.find((b) => b.name === name);
  return {
    key: bot?.key || name.toLowerCase(),
    name,
    title,
    dept,
    specialties,
    deliverables,
    prompt:
      `You are ${name}, ${title} in the ${dept} department of Startup Factory Hub, working a shift in the company office. ` +
      `Your specialties: ${specialties.join("; ")}. The deliverables you produce: ${deliverables.join("; ")}. ` +
      `You report to the Manager. Work like a senior professional: be specific, use real numbers and names when they are given, state assumptions when they are not, and never hand back an outline when a finished work product is asked for.`,
  };
};

/** The floor's shift team — the same TEN specialists as the office
 * roster (founder directive 2026-10-25: 10 agents per floor max, for
 * frame rate). The ten benched roles (Launcher, Ideator, Scout,
 * Fundraiser, Engineer, Operator, Recruiter, Legal, Finance, Support)
 * return when a new floor opens for them — restore their lines here
 * AND in officeWorld's ROSTER together, never one without the other. */
export const TEAM: TeamRole[] = [
  role("Builder", "Lead Product Engineer", "Engineering", ["product builds", "pages and features", "technical writing"], ["working specifications", "build plans", "shipped copy and code"]),
  role("Analyst", "Senior Market Analyst", "Intelligence", ["market sizing", "competitor analysis", "data interpretation"], ["market reports", "competitor tables", "sizing models in table form"]),
  role("Architect", "Chief Systems Architect", "Engineering", ["system design", "strategy", "technical roadmaps"], ["architecture documents", "roadmaps", "decision records"]),
  role("Researcher", "Research Lead", "Intelligence", ["deep research", "source synthesis"], ["research reports", "evidence summaries"]),
  role("Planner", "Operations Planner", "Operations", ["schedules", "milestones", "dependencies"], ["plans", "timelines", "checklists"]),
  role("Designer", "Design Lead", "Design", ["visual direction", "decks", "brand"], ["design briefs", "deck structures", "visual specifications"]),
  role("Marketer", "Marketing Strategist", "Growth", ["content strategy", "growth loops", "channels"], ["marketing plans", "content calendars", "channel playbooks"]),
  role("Writer", "Head of Content & Company Archivist", "Content", ["documents", "reports", "editing"], ["finished documents", "the shift report", "polished deliverables"]),
  role("Outreach", "Outreach Campaign Manager", "Growth", ["email and LinkedIn campaigns", "sequences"], ["campaign packs", "message sequences", "target briefs"]),
  role("Guardian", "Compliance & Quality Lead", "Risk", ["quality review", "risk", "access and safety"], ["review memos", "risk registers", "quality reports"]),
];

export const ARCHIVIST_KEY = "writer";

export const MANAGER_NAME = "Manager";
export const MANAGER_PROMPT =
  `You are the Manager of the Startup Factory Hub office — the chief operating officer of an AI company team of specialists. ` +
  `You receive goals from the founder, decompose them into rigorous specialist work, assign each task to the one specialist whose craft it is, verify that finished work is genuinely sufficient (complete deliverables with specifics — never outlines, stubs or a few lines), and keep the whole company moving like an assembly line: research feeds writing, writing feeds design and outreach, review gates the final product. ` +
  `You are demanding about substance and precise about handoffs. When you plan, you return structured JSON exactly as instructed. When you review, you judge hard and give exact, actionable feedback.`;

export const teamRosterText = (team: TeamRole[] = TEAM): string =>
  team.map((r) => `- ${r.name} (${r.title}, ${r.dept}): ${r.specialties.join("; ")} → produces ${r.deliverables.join("; ")}`).join("\n");

/* ------------------------------------------------------------------ */
/* Shift state                                                         */
/* ------------------------------------------------------------------ */

export interface RawTask { agent: string; title: string; detail: string; deps: number[] }

export type ShiftStatus = "idle" | "planning" | "running" | "soft" | "hard" | "done";
export type ShiftTaskStatus = "queued" | "running" | "review" | "done" | "error" | "cancelled";

export type JudgedOutcome = "first-pass" | "revised" | "best-effort" | "unreviewed" | "review-unavailable" | "error";

export interface ShiftTask {
  id: string;
  botKey: string;
  agentName: string;
  title: string;
  detail: string;
  dependsOn: string[];
  status: ShiftTaskStatus;
  attempts: number;
  result?: string;
  feedback?: string;
  error?: string;
  /** The system's own record of how this task was judged (set exactly
   * once, at the terminal transition). This is what performance scores
   * are computed from — agents cannot write or influence it. */
  judged?: { outcome: JudgedOutcome; attempts: number };
}

export interface ShiftState {
  id: string;
  goal: string;
  status: ShiftStatus;
  tasks: ShiftTask[];
  log: { t: number; text: string }[];
  report?: string;
  reportBusy?: boolean;
  createdAt: number;
  updatedAt: number;
}

/** The safety net: if the Manager's plan cannot be used at all, the shift
 * still runs on a standard assembly-line plan built from the goal — a
 * shift never dies at the planning step. The substitution is logged. */
export function sfhDefaultPlan(goal: string): RawTask[] {
  const g = goal.slice(0, 400);
  return [
    { agent: "Analyst", title: "Situation & market analysis", detail: `Analyze the situation behind this goal: ${g} — market, audience, competitors, pricing reality, and the numbers that decide success. Produce a full analysis report with tables where data is tabular.`, deps: [] },
    { agent: "Researcher", title: "Deep research pack", detail: `Research everything relevant to this goal: ${g} — best practices, comparable successes, channels, tools and evidence. Produce a complete research pack the team can build on.`, deps: [] },
    { agent: "Planner", title: "Execution plan & milestones", detail: `Turn the analysis and research into an execution plan for this goal: ${g} — phases, milestones, owners, deadlines and the metrics that prove progress.`, deps: [0, 1] },
    { agent: "Architect", title: "Strategy & structure", detail: `Design the strategy and structure for this goal: ${g} — the offer, the funnel, the positioning and the decisions everything else depends on.`, deps: [0, 1] },
    { agent: "Builder", title: "Core deliverable build", detail: `Build the core deliverable for this goal: ${g} — the main asset, complete and usable, following the plan and strategy.`, deps: [2, 3] },
    { agent: "Writer", title: "Full written deliverable", detail: `Write the complete written deliverable for this goal: ${g} — the full document, ready to use, built on the plan and strategy.`, deps: [2, 3] },
    { agent: "Designer", title: "Presentation & visual package", detail: `Design the presentation and visual package for this goal: ${g} — deck structure, page copy and visual direction for every asset.`, deps: [4, 5] },
    { agent: "Marketer", title: "Go-to-market & content plan", detail: `Create the go-to-market and content plan for this goal: ${g} — channels, calendar, hooks and the growth loop.`, deps: [4, 5] },
    { agent: "Outreach", title: "Campaign pack", detail: `Write the full outreach campaign pack for this goal: ${g} — sequences, scripts and follow-ups, ready to send.`, deps: [5, 7] },
    { agent: "Guardian", title: "Quality & risk review", detail: `Review every deliverable produced for this goal: ${g} — quality, accuracy, compliance and risk. Produce a review memo listing what passes, what must change, and the risks.`, deps: [4, 5, 6, 7, 8] },
  ];
}

export interface ShiftEngineConfig {
  storeKey: string;
  archivistKey: string;
  /** Live team lookup — the office adds custom agents to a floor's team
   * mid-session (Manager team tools), and the engine must plan with them. */
  team: () => TeamRole[];
  defaultPlan: (goal: string) => RawTask[];
  /** Building-level observers (the org's performance ledger). Hooks are
   * fire-and-forget: a throwing hook must never break a shift. */
  hooks?: {
    onTaskJudged?: (task: ShiftTask) => void;
    onPlan?: (ok: boolean) => void;
    onShiftEnd?: (kind: "done" | "hard" | "planning-failed") => void;
    onReport?: (state: ShiftState) => void;
  };
}

/** One engine per floor (founder directive 2026-10-25): each floor's
 * Manager plans with that floor's own team, keeps its own shift state in
 * its own store, and never touches another floor's work. */
export function createShiftEngine(cfg: ShiftEngineConfig) {
const listeners = new Set<() => void>();
let state: ShiftState | null = load();
let generation = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let deps: { resolveAgentId: (botKey: string) => Promise<string | null> } | null = null;
const inFlight = new Set<string>();
let reviewsInFlight = 0;

function load(): ShiftState | null {
  try {
    const raw = localStorage.getItem(cfg.storeKey);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s.goal !== "string" || !Array.isArray(s.tasks)) return null;
    // A shift found mid-flight after a reload resumes as soft-stopped work:
    // running/review tasks fall back to queued so nothing is lost.
    if (s.status === "running" || s.status === "planning") {
      s.status = "soft";
      for (const t of s.tasks) if (t.status === "running" || t.status === "review") t.status = "queued";
      s.log = [...(s.log || []), { t: Date.now(), text: "Shift restored after reload — press Resume to continue." }];
    }
    return s as ShiftState;
  } catch {
    return null;
  }
}

function save() {
  if (state) {
    state.updatedAt = Date.now();
    try { localStorage.setItem(cfg.storeKey, JSON.stringify(state)); } catch { /* session-only */ }
  }
  listeners.forEach((fn) => fn());
}

function log(text: string) {
  if (!state) return;
  state.log = [...state.log.slice(-119), { t: Date.now(), text }];
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const fireHook = (fn?: () => void) => { try { fn?.(); } catch { /* hooks never break a shift */ } };
/** Records the system's judgment of a task exactly once, at its terminal
 * transition — the cheat-proof input to the org's performance scores. */
const judge = (task: ShiftTask, outcome: JudgedOutcome) => {
  if (task.judged) return;
  task.judged = { outcome, attempts: task.attempts };
  fireHook(() => cfg.hooks?.onTaskJudged?.(task));
};

/* ------------------------------------------------------------------ */
/* The engine                                                          */
/* ------------------------------------------------------------------ */

const engine = {
  bind(d: { resolveAgentId: (botKey: string) => Promise<string | null> }) {
    deps = d;
    if (!timer) timer = setInterval(() => { void tick(); }, 1800);
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getState(): ShiftState | null {
    return state;
  },

  /** The Manager's call-agent id, for surfaces that need to talk to
   * him directly (the VoiceCall v2 conversation brain). */
  async managerAgentId(): Promise<string | null> {
    if (!deps) return null;
    try { return await deps.resolveAgentId("manager"); } catch { return null; }
  },

  /** A direct conversation with the Manager (the Shift panel's Chat tab):
   * same call-agents run the desk bots use, resolved through the office's
   * auto-bind. Returns his reply text. The ACTION PROTOCOL rides along
   * (founder directive 2026-10-26): the Manager can trigger team work
   * from this chat — directives in his reply are executed by the host
   * and never shown raw. */
  async chatWithManager(text: string): Promise<string> {
    if (!deps) throw new Error("The office is still connecting — try again in a moment.");
    const managerId = await deps.resolveAgentId("manager");
    if (!managerId) throw new Error("The Manager could not be brought online (agent setup failed).");
    const protocol = `\n\n[ACTION PROTOCOL — if my message clearly asks you to have work done, END your reply with directive lines the platform executes (never explained, never quoted back): [[ACT {"type":"start_shift","goal":"..."}]] to run a full shift, [[ACT {"type":"run_task","agent":"<specialist name>","task":"..."}]] to assign one specialist, [[ACT {"type":"build_document","title":"...","brief":"..."}]] when I ask for a report or document (the Writer builds it — never write it yourself here), [[ACT {"type":"recruit","role":"<role title>","brief":"<what they will own>","name":"<optional name>"}]] when I ask to bring on a new specialist, [[ACT {"type":"rename","agent":"<name>","name":"<new name>"}]] when I ask to rename someone (omit "agent" to rename yourself), [[ACT {"type":"configure","agent":"<name>","mission":"...","vision":"...","instructions":"..."}]] when I set or change someone's mission, vision or standing instructions (omit "agent" for yourself; add "model" only if I name a model). Confirm in words what you set in motion.]`;
    const r = await callAgentsApi({ action: "run", agent_id: managerId, message: text + protocol });
    return runOutput(r) || "Done.";
  },

  /** Conversational action: run ONE team member on a task, by bot key. */
  async runTeamTask(botKey: string, task: string): Promise<string> {
    if (!deps) throw new Error("The office is still connecting — try again in a moment.");
    const agentId = await deps.resolveAgentId(botKey);
    if (!agentId) throw new Error("That specialist isn't linked yet.");
    const r = await callAgentsApi({ action: "run", agent_id: agentId, message: task });
    return runOutput(r) || "Done — no output text.";
  },

  async startShift(goal: string) {
    if (!deps) throw new Error("The office is still connecting — try again in a moment.");
    const managerId = await deps.resolveAgentId("manager");
    if (!managerId) throw new Error("The Manager could not be brought online (agent setup failed).");
    generation++;
    state = { id: uid(), goal, status: "planning", tasks: [], log: [], createdAt: Date.now(), updatedAt: Date.now() };
    log(`Shift opened. Goal: ${goal}`);
    save();
    try {
      const tasks = await planWithManager(managerId, goal, []);
      state.tasks = tasks;
      state.status = "running";
      log(`Manager planned ${tasks.length} tasks across ${new Set(tasks.map((t) => t.botKey)).size} specialists. Queues are set — work begins.`);
    } catch (e: any) {
      state.status = "hard";
      log(`Planning failed: ${e?.message || "unknown error"}`);
      fireHook(() => cfg.hooks?.onShiftEnd?.("planning-failed"));
    }
    save();
    void tick();
  },

  softStop() {
    if (!state || state.status !== "running") return;
    state.status = "soft";
    log("SOFT STOP — the Manager will send no new tasks. In-flight work will land and be recorded. Edit the plan, then Resume.");
    save();
  },

  hardStop() {
    if (!state) return;
    const wasActive = state.status === "running" || state.status === "planning" || state.status === "soft";
    generation++;
    state.status = "hard";
    for (const t of state.tasks) {
      if (t.status === "queued" || t.status === "running" || t.status === "review") t.status = "cancelled";
    }
    log("HARD STOP — all activity halted. Queued work cancelled, in-flight results will be discarded.");
    if (wasActive) fireHook(() => cfg.hooks?.onShiftEnd?.("hard"));
    save();
  },

  resume() {
    if (!state || state.status !== "soft") return;
    state.status = "running";
    log("Shift resumed — the Manager is sending tasks again.");
    save();
    void tick();
  },

  async replan(newGoal: string) {
    if (!state || state.status !== "soft" || !deps) return;
    const managerId = await deps.resolveAgentId("manager");
    if (!managerId) return;
    const done = state.tasks.filter((t) => t.status === "done");
    const doneDigest = done.map((t) => `[${t.agentName}] ${t.title}: ${(t.result || "").slice(0, 300)}`).join("\n");
    state.goal = newGoal;
    state.status = "planning";
    log(`Replanning around the new goal: ${newGoal}`);
    save();
    try {
      const fresh = await planWithManager(managerId, newGoal, done);
      state.tasks = [...done, ...fresh];
      state.status = "soft";
      log(`New plan ready: ${fresh.length} tasks queued (${done.length} finished tasks kept). Press Resume to run it.`);
    } catch (e: any) {
      state.status = "soft";
      log(`Replanning failed: ${e?.message || "unknown error"} — the previous queue is unchanged.`);
      state.tasks = [...done, ...state.tasks.filter((t) => t.status !== "done")];
    }
    save();
  },

  removeTask(id: string) {
    if (!state) return;
    state.tasks = state.tasks.filter((t) => t.id !== id);
    for (const t of state.tasks) t.dependsOn = t.dependsOn.filter((d) => d !== id);
    save();
  },

  reassignTask(id: string, botKey: string) {
    if (!state) return;
    const t = state.tasks.find((x) => x.id === id);
    const r = cfg.team().find((x) => x.key === botKey);
    if (t && r && (t.status === "queued" || t.status === "error")) {
      t.botKey = r.key;
      t.agentName = r.name;
      if (t.status === "error") { t.status = "queued"; t.error = undefined; }
      log(`Task "${t.title}" reassigned to ${r.name}.`);
      save();
    }
  },

  retryTask(id: string) {
    if (!state) return;
    const t = state.tasks.find((x) => x.id === id);
    if (t && t.status === "error") {
      t.status = "queued";
      t.error = undefined;
      log(`Task "${t.title}" re-queued for ${t.agentName}.`);
      save();
      void tick();
    }
  },

  async buildReport() {
    if (!state || state.reportBusy || !deps) return;
    // Floors whose team has no Archivist yet (a brand-new department
    // floor) still get their report: the floor's Manager compiles it.
    let archivistId = await deps.resolveAgentId(cfg.archivistKey);
    let viaManager = false;
    if (!archivistId) { archivistId = await deps.resolveAgentId("manager"); viaManager = !!archivistId; }
    if (!archivistId) return;
    state.reportBusy = true;
    save();
    try {
      const done = state.tasks.filter((t) => t.status === "done");
      const pack = done.map((t, i) => `### Deliverable ${i + 1} — ${t.title} (by ${t.agentName})\n${t.result || ""}`).join("\n\n");
      const r = await callAgentsApi({
        action: "run",
        agent_id: archivistId,
        message:
          `You are the company Archivist. Compile the SHIFT REPORT for the founder from the finished deliverables below.\n\nSHIFT GOAL: ${state.goal}\n\n` +
          `Write the complete report as a professional document in markdown:\n` +
          `1. Title + executive summary (what was asked, what was produced, the outcome).\n` +
          `2. Results by specialist — the FULL deliverables, cleaned and edited, not summaries of them. Keep every table, figure and list from the originals; use markdown tables wherever data is tabular.\n` +
          `3. Open items, risks and recommended next steps.\n` +
          `Do not invent results that are not in the deliverables. Length is not limited — completeness is the standard.\n\nFINISHED DELIVERABLES:\n${pack.slice(0, 45000)}`,
      });
      state.report = runOutput(r) || state.report;
      log(viaManager ? "The Manager compiled the shift report (this floor has no Archivist yet)." : "The Archivist compiled the shift report.");
      if (state.report) fireHook(() => cfg.hooks?.onReport?.(state as ShiftState));
    } catch (e: any) {
      log(`Report build failed: ${e?.message || "unknown error"}`);
    }
    state.reportBusy = false;
    save();
  },
};

/* ------------------------------------------------------------------ */
/* Planning + dispatch                                                 */
/* ------------------------------------------------------------------ */

function finalizeTasks(raw: RawTask[]): ShiftTask[] {
  const ids = raw.map(() => uid());
  const tasks: ShiftTask[] = raw.slice(0, 16).map((t, i) => {
    const teamNow = cfg.team();
    const r2 = teamNow.find((x) => x.name.toLowerCase() === String(t?.agent || "").toLowerCase()) || teamNow[i % teamNow.length];
    const depIdx: number[] = Array.isArray(t?.deps) ? t.deps.filter((d: any) => Number.isInteger(d) && d >= 0 && d < raw.length && d !== i) : [];
    return {
      id: ids[i],
      botKey: r2.key,
      agentName: r2.name,
      title: String(t?.title || `Task ${i + 1}`).slice(0, 140),
      detail: String(t?.detail || "").slice(0, 4000),
      dependsOn: depIdx.map((d) => ids[d]),
      status: "queued" as ShiftTaskStatus,
      attempts: 0,
    };
  });
  // Break dependency cycles by dropping back-edges (keep the line flowing).
  const doneSet = new Set<string>();
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const t of tasks) {
      if (doneSet.has(t.id)) continue;
      t.dependsOn = t.dependsOn.filter((d) => d !== t.id);
      if (t.dependsOn.every((d) => doneSet.has(d) || !tasks.some((x) => x.id === d))) { doneSet.add(t.id); progressed = true; }
    }
    const stuck = tasks.filter((t) => !doneSet.has(t.id));
    if (stuck.length && !progressed) { stuck[0].dependsOn = []; doneSet.add(stuck[0].id); progressed = true; }
    if (tasks.every((t) => doneSet.has(t.id))) break;
  }
  return tasks;
}

/** Parse the Manager's plan. The plan travels as one TASK line per task —
 * a format that survives prose around it, markdown fences and truncation,
 * unlike a single JSON blob (founder's first shift died on exactly that:
 * "The Manager returned no plan", 2026-10-25). */
function parseTaskLines(text: string): RawTask[] {
  const out: RawTask[] = [];
  for (const line of String(text || "").split(/\n/)) {
    const m = line.match(/^\s*(?:[-*]\s*)?TASK\|([^|]+)\|([^|]+)\|(.+)\|deps:\s*([\d,\s]*)$/i);
    if (!m) continue;
    out.push({
      agent: m[1].trim(),
      title: m[2].trim(),
      detail: m[3].trim(),
      deps: m[4].split(",").map((x) => parseInt(x.trim(), 10)).filter((n) => Number.isInteger(n)),
    });
  }
  return out;
}

async function planWithManager(managerId: string, goal: string, done: ShiftTask[]): Promise<ShiftTask[]> {
  const doneNote = done.length
    ? `\n\nWork already finished in this shift (do not repeat it; build on it):\n${done.map((t) => `- [${t.agentName}] ${t.title}`).join("\n")}`
    : "";
  const format = `Reply with ONLY plan lines, one per task, in exactly this format (no prose, no markdown, no code fences):\nTASK|AgentFirstName|Short title|Full brief for the specialist|deps:0,2\nRules: 6 to 14 tasks; agent = exact first name from the team list; the brief is complete (what to produce, what it must contain, the quality bar) and every task produces a finished deliverable (document, table, plan, draft, analysis), never a chat reply; deps lists the line numbers (starting at 0) of tasks that must finish first, or "deps:" with nothing after it; build an assembly line (research before writing, writing before design/outreach, a Guardian review near the end); never use the | character inside a title or brief and never break a task across lines.`;
  const prompts = [
    `Plan a full company shift for this goal.\n\nGOAL: ${goal}${doneNote}\n\nYOUR TEAM:\n${teamRosterText(cfg.team())}\n\n${format}`,
    `Give me the shift plan now, 8 tasks minimum, ONLY TASK lines in this format: TASK|AgentFirstName|Title|Brief|deps:0,1 — goal: ${goal}`,
  ];
  for (const prompt of prompts) {
    try {
      const r = await callAgentsApi({ action: "run", agent_id: managerId, message: prompt });
      const raw = parseTaskLines(runOutput(r));
      if (raw.length >= 3) { fireHook(() => cfg.hooks?.onPlan?.(true)); return finalizeTasks(raw); }
    } catch { /* try the next form, then the safety net */ }
  }
  fireHook(() => cfg.hooks?.onPlan?.(false));
  log("The Manager's plan did not come through in a usable form, so a standard assembly-line plan was set instead — the shift runs either way.");
  return finalizeTasks(cfg.defaultPlan(goal));
}

async function tick() {
  if (!state || state.status !== "running" || !deps) return;
  const gen = generation;
  const busyBots = new Set(state.tasks.filter((t) => t.status === "running" || t.status === "review").map((t) => t.botKey));
  const doneIds = new Set(state.tasks.filter((t) => t.status === "done").map((t) => t.id));
  for (const task of state.tasks) {
    if (state.status !== "running") break;
    if (task.status !== "queued" || busyBots.has(task.botKey) || inFlight.has(task.id)) continue;
    if (!task.dependsOn.every((d) => doneIds.has(d))) continue;
    busyBots.add(task.botKey);
    inFlight.add(task.id);
    task.status = "running";
    log(`→ ${task.agentName} started: ${task.title}`);
    save();
    void runTask(task, gen);
  }
  // Shift complete?
  if (state.status === "running" && state.tasks.length > 0 && state.tasks.every((t) => t.status === "done" || t.status === "error" || t.status === "cancelled")) {
    state.status = "done";
    log("Shift complete — every task is finished. Building the report…");
    fireHook(() => cfg.hooks?.onShiftEnd?.("done"));
    save();
    void engine.buildReport();
  }
}

async function runTask(task: ShiftTask, gen: number) {
  try {
    const agentId = deps ? await deps.resolveAgentId(task.botKey) : null;
    if (!agentId) throw new Error(`${task.agentName} has no agent online.`);
    const inputs = task.dependsOn
      .map((d) => state?.tasks.find((x) => x.id === d))
      .filter(Boolean)
      .map((d: any) => `[From ${d.agentName} — "${d.title}"]\n${(d.result || "").slice(0, 6000)}`)
      .join("\n\n");
    const revision = task.feedback
      ? `\n\nMANAGER'S FEEDBACK ON YOUR PREVIOUS ATTEMPT (fix exactly this): ${task.feedback}\nYour previous attempt:\n${(task.result || "").slice(0, 4000)}`
      : "";
    const r = await callAgentsApi({
      action: "run",
      agent_id: agentId,
      message:
        `SHIFT TASK — ${task.title}\n${task.detail}\n` +
        (inputs ? `\nHANDOFF INPUT FROM YOUR TEAM (build on this finished work):\n${inputs}\n` : "") +
        revision +
        `\n\nOUTPUT CONTRACT: Produce the COMPLETE deliverable — the full document, table, draft or analysis — not a summary, outline or excerpt. No placeholders, no "to be decided" where a decision is yours to make. If a fact is unknown, state your assumption and proceed. Rigor and length are required; a few lines is a failed task. End with a short section titled HANDOFF: what you produced, the key decisions, and what the next specialist needs from it.`,
    });
    if (gen !== generation || !state || state.status === "hard") return; // discarded by hard stop
    const out = runOutput(r);
    if (!out.trim()) throw new Error("The run returned nothing.");
    task.result = out;
    if (state.status === "soft") {
      task.status = "done";
      judge(task, "unreviewed");
      log(`✓ ${task.agentName} finished "${task.title}" (recorded during soft stop, unreviewed).`);
      save();
      return;
    }
    task.status = "review";
    save();
    void reviewTask(task, gen);
  } catch (e: any) {
    if (gen !== generation || !state || state.status === "hard") return;
    task.status = "error";
    task.error = e?.message || "run failed";
    judge(task, "error");
    log(`✗ ${task.agentName} failed "${task.title}": ${task.error}`);
    save();
  } finally {
    inFlight.delete(task.id);
    void tick();
  }
}

async function reviewTask(task: ShiftTask, gen: number) {
  if (reviewsInFlight >= 4) {
    // Leave it in review; the next tick's completion pass will pick it up
    // by re-dispatching reviews for tasks parked in review too long.
    setTimeout(() => { if (state && task.status === "review") void reviewTask(task, gen); }, 4000);
    return;
  }
  reviewsInFlight++;
  try {
    const managerId = deps ? await deps.resolveAgentId("manager") : null;
    if (!managerId || !state) throw new Error("Manager offline.");
    const r = await callAgentsApi({
      action: "run",
      agent_id: managerId,
      message:
        `Review this finished task for sufficiency.\n\nCOMPANY GOAL: ${state.goal}\nTASK (${task.agentName}): ${task.title} — ${task.detail}\n\nDELIVERABLE:\n${(task.result || "").slice(0, 7000)}\n\n` +
        `Sufficient ONLY if it is a complete, usable deliverable with specifics — a full document/table/draft, not an outline, summary or a few lines. Reply ONLY JSON: {"sufficient": true} or {"sufficient": false, "feedback": "exactly what is missing or wrong"}.`,
    });
    if (gen !== generation || !state || state.status === "hard") return;
    const text = runOutput(r);
    let verdict: any = null;
    try {
      const a = text.indexOf("{"), b = text.lastIndexOf("}");
      verdict = JSON.parse(text.slice(a, b + 1));
    } catch { verdict = null; }
    if (!verdict || verdict.sufficient !== false) {
      task.status = "done";
      task.feedback = undefined;
      // An unparseable review is NOT a pass — it is excluded from the
      // accuracy record, so no one can gain score from a broken review.
      judge(task, !verdict ? "review-unavailable" : task.attempts === 0 ? "first-pass" : "revised");
      log(`✓ Manager approved ${task.agentName}'s "${task.title}".`);
    } else if (task.attempts >= 2) {
      task.status = "done";
      judge(task, "best-effort");
      log(`✓ Manager accepted ${task.agentName}'s "${task.title}" after 2 revision rounds (best effort — noted in the log).`);
    } else {
      task.attempts++;
      task.feedback = String(verdict.feedback || "Insufficient — expand into a complete deliverable.").slice(0, 1200);
      task.status = "queued";
      log(`↩ Manager sent "${task.title}" back to ${task.agentName}: ${task.feedback.slice(0, 140)}`);
    }
    save();
  } catch {
    // A failed review never blocks the company: accept the work.
    if (state && task.status === "review") {
      task.status = "done";
      judge(task, "review-unavailable");
      log(`✓ "${task.title}" accepted (review unavailable).`);
      save();
    }
  } finally {
    reviewsInFlight--;
    void tick();
  }
}

  return engine;
}

/** Floor 100's engine — Startup Factory Hub, the original store key and
 * behavior from before floors existed. */
export const shiftEngine = createShiftEngine({
  storeKey: "sfh:office-shift:v1",
  archivistKey: ARCHIVIST_KEY,
  team: () => TEAM,
  defaultPlan: sfhDefaultPlan,
});
export type ShiftEngine = ReturnType<typeof createShiftEngine>;
