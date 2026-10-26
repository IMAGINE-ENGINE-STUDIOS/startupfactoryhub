// @ts-nocheck -- Imagine Studio v2
/**
 * THE ORG — companies, departments, personnel and performance for the
 * whole building (founder directive 2026-10-25).
 *
 * The hierarchy: the CHAIRMAN runs the building. A CEO runs each company
 * (all of its floors) through its Managers. A Manager runs one floor's
 * team of specialists (max 10 agents per floor, plus the Manager, the
 * CEO and the Chairman — 13 characters top, for frame rate). Talking to the CEO
 * coordinates the company's Managers; talking to the Chairman sets the
 * companies' vision, mission and goals, and he reviews every CEO.
 *
 * PERFORMANCE — the 94% law: every person in the building (agents,
 * Managers, CEOs, the Chairman) keeps their seat only while their work
 * scores at least 94% accuracy. Scores are COMPUTED HERE from the shift
 * engines' own review records — a task the Manager approved on first
 * pass scores 100, each send-back costs points, work accepted as best
 * effort scores 30, a failed run scores 0. No agent writes, edits or
 * influences its own score: the numbers come only from engine state
 * transitions recorded at review time, so the score cannot be cheated.
 * A person under 94% (with at least 4 judged tasks) is AT RISK: warned
 * once, and if still under 94% at the next shift report the Chairman
 * replaces them. The admin (the founder) can fire ANYONE at any time.
 * Firing erases the previous agent — its call-agent is retired, its
 * chats cleared — and generates a NEW agent (new name, new persona,
 * clean memory) in the same role. Firings land BETWEEN shifts, never
 * mid-shift, so a company never stops running.
 */
export const SURVIVAL_THRESHOLD = 94;
/** At most 10 AGENTS per floor (founder directive 2026-10-25, for frame
 * rate) — the CEO, the Manager and the Chairman stand outside the count,
 * so a floor tops out at 13 characters. */
export const MAX_AGENTS_PER_FLOOR = 10;

export type JudgedOutcome = "first-pass" | "revised" | "best-effort" | "unreviewed" | "review-unavailable" | "error";

export interface PerfEntry { at: number; outcome: JudgedOutcome; attempts: number }
export interface PersonScore { accuracy: number | null; judged: number; runs: number; atRisk: boolean }
export interface FireRecord { name: string; generation: number; scoreAtFire: number | null; judgedAtFire: number; reason: string; by: string; at: number }
export interface PersonnelRecord { generation: number; personaName: string; prompt: string; since: number; retiredAgentIds: string[]; warnedGeneration: boolean; history: FireRecord[] }
export interface Department { id: string; company: string; name: string; floorId: number | null; leadKey: string | null; leadLabel: string }
export interface CompanyDirection { vision: string; mission: string; goals: string }
export interface ReportRecord { id: string; at: number; floorKey: string; floorId: number; company: string; goal: string; report: string; decisions?: string[] }
export interface EvalRow { scope: string; role: string; label: string; company: string; floorKey: string; accuracy: number | null; judged: number }
export interface Evaluation { at: number; reportId: string; rows: EvalRow[] }
export interface ActionRecord { at: number; by: string; kind: string; text: string }
export interface PendingFiring { id: string; scope: string; floorKey: string; botKey: string; reason: string; by: string; at: number }

interface OrgDoc {
  direction: Record<string, CompanyDirection>;
  departments: Department[];
  personnel: Record<string, PersonnelRecord>;
  /** Founder-chosen names per seat, pinned to the generation they were
   * set in — a replacement (new generation) gets its own generated
   * name, never the renamed predecessor's. */
  nameOverrides: Record<string, { name: string; generation: number }>;
  perf: Record<string, PerfEntry[]>;
  execStats: Record<string, { plansOk: number; plansFallback: number; shiftsDone: number; shiftsHard: number; shiftsFailed: number }>;
  reports: ReportRecord[];
  evaluations: Evaluation[];
  actions: ActionRecord[];
  pendingFirings: PendingFiring[];
  chairmanAuthority: boolean;
  /** "scope:g<generation>" keys that already received their one warning. */
  warned: Record<string, boolean>;
}

const ORG_KEY = "sfh:org:v1";
const emptyDoc = (): OrgDoc => ({ direction: {}, departments: [], personnel: {}, nameOverrides: {}, perf: {}, execStats: {}, reports: [], evaluations: [], actions: [], pendingFirings: [], chairmanAuthority: true, warned: {} });

let doc: OrgDoc = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem(ORG_KEY) || "null");
    if (raw && typeof raw === "object") return { ...emptyDoc(), ...raw };
  } catch { /* fresh doc */ }
  return emptyDoc();
})();

const listeners = new Set<() => void>();
export const orgSubscribe = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };
export const orgGet = (): OrgDoc => doc;
function mutate(fn: (d: OrgDoc) => void) {
  fn(doc);
  try { localStorage.setItem(ORG_KEY, JSON.stringify(doc)); } catch { /* session only */ }
  listeners.forEach((f) => f());
}
export const logAction = (by: string, kind: string, text: string) =>
  mutate((d) => { d.actions = [{ at: Date.now(), by, kind, text }, ...d.actions].slice(0, 200); });

/* ------------------------------------------------------------------ */
/* Scope keys — one identity per seat in the building                  */
/* ------------------------------------------------------------------ */

export const agentScope = (floorKey: string, botKey: string) => `${floorKey}:${botKey}`;
export const managerScope = (floorKey: string) => `${floorKey}:manager`;
export const ceoScope = (floorKey: string) => `${floorKey}:ceo`;
export const CHAIRMAN_SCOPE = "building:chairman";

/* ------------------------------------------------------------------ */
/* Scoring — computed from engine review records only                  */
/* ------------------------------------------------------------------ */

export const taskScore = (e: PerfEntry): number | null => {
  switch (e.outcome) {
    case "first-pass": return 100;
    case "revised": return Math.max(40, 100 - 30 * Math.max(1, e.attempts));
    case "best-effort": return 30;
    case "error": return 0;
    default: return null; // unreviewed / review-unavailable: counted as a run, never judged
  }
};

export function scoreEntries(entries: PerfEntry[]): PersonScore {
  const judgedScores: number[] = [];
  for (const e of entries.slice(-40)) {
    const s = taskScore(e);
    if (s !== null) judgedScores.push(s);
  }
  const recent = judgedScores.slice(-20);
  const accuracy = recent.length ? Math.round((recent.reduce((a, b) => a + b, 0) / recent.length) * 10) / 10 : null;
  return {
    accuracy,
    judged: judgedScores.length,
    runs: entries.length,
    atRisk: accuracy !== null && judgedScores.length >= 4 && accuracy < SURVIVAL_THRESHOLD,
  };
}

export const personScore = (scope: string): PersonScore => scoreEntries(doc.perf[scope] || []);

/** Raw outcome counts behind a score — the numbers the Wall Street
 * performance appendix prints. Judged = first-pass + revised +
 * best-effort + errors (unreviewed outcomes never count). */
export interface PerfStats { judged: number; firstPass: number; revised: number; bestEffort: number; errors: number; revisions: number; accuracy: number | null }
export const perfStats = (scope: string): PerfStats => {
  const es = doc.perf[scope] || [];
  const count = (o: JudgedOutcome) => es.filter((e) => e.outcome === o).length;
  const judgedEntries = es.filter((e) => e.outcome === "first-pass" || e.outcome === "revised" || e.outcome === "best-effort" || e.outcome === "error");
  return {
    judged: judgedEntries.length,
    firstPass: count("first-pass"),
    revised: count("revised"),
    bestEffort: count("best-effort"),
    errors: count("error"),
    revisions: judgedEntries.reduce((a, e) => a + (e.attempts || 0), 0),
    accuracy: personScore(scope).accuracy,
  };
};

const weighted = (parts: { v: number | null; w: number }[]): number | null => {
  const live = parts.filter((p) => p.v !== null);
  if (!live.length) return null;
  const tw = live.reduce((a, p) => a + p.w, 0);
  return Math.round((live.reduce((a, p) => a + (p.v as number) * p.w, 0) / tw) * 10) / 10;
};

/** A Manager's score: his floor's accuracy, his planning reliability
 * (plans that parsed vs. fell back), and his shift completion record. */
export function managerScore(floorKey: string, teamScopes: string[]): PersonScore {
  const accs: number[] = [];
  let judged = 0;
  for (const s of teamScopes) {
    const ps = personScore(s);
    judged += ps.judged;
    if (ps.accuracy !== null) accs.push(ps.accuracy);
  }
  const st = doc.execStats[managerScope(floorKey)] || { plansOk: 0, plansFallback: 0, shiftsDone: 0, shiftsHard: 0, shiftsFailed: 0 };
  const plans = st.plansOk + st.plansFallback;
  const shifts = st.shiftsDone + st.shiftsHard + st.shiftsFailed;
  const accuracy = weighted([
    { v: accs.length ? accs.reduce((a, b) => a + b, 0) / accs.length : null, w: 0.6 },
    { v: plans ? (100 * st.plansOk) / plans : null, w: 0.2 },
    { v: shifts ? (100 * st.shiftsDone) / shifts : null, w: 0.2 },
  ]);
  return { accuracy, judged, runs: shifts, atRisk: accuracy !== null && judged >= 4 && accuracy < SURVIVAL_THRESHOLD };
}

/** A CEO's score: every scored person in the company (agents + Managers). */
export function companyScore(floors: { floorKey: string; teamScopes: string[] }[]): PersonScore {
  const accs: number[] = [];
  let judged = 0;
  for (const f of floors) {
    const ms = managerScore(f.floorKey, f.teamScopes);
    judged += ms.judged;
    if (ms.accuracy !== null) accs.push(ms.accuracy);
    for (const s of f.teamScopes) {
      const ps = personScore(s);
      if (ps.accuracy !== null) accs.push(ps.accuracy);
    }
  }
  const accuracy = accs.length ? Math.round((accs.reduce((a, b) => a + b, 0) / accs.length) * 10) / 10 : null;
  return { accuracy, judged, runs: 0, atRisk: accuracy !== null && judged >= 4 && accuracy < SURVIVAL_THRESHOLD };
}

/* ------------------------------------------------------------------ */
/* Recording — called by the shift engines' hooks, never by agents     */
/* ------------------------------------------------------------------ */

export const recordJudged = (scope: string, outcome: JudgedOutcome, attempts: number) =>
  mutate((d) => {
    const arr = [...(d.perf[scope] || []), { at: Date.now(), outcome, attempts }];
    d.perf[scope] = arr.slice(-60);
  });

export const recordPlan = (floorKey: string, ok: boolean) =>
  mutate((d) => {
    const k = managerScope(floorKey);
    const st = d.execStats[k] || (d.execStats[k] = { plansOk: 0, plansFallback: 0, shiftsDone: 0, shiftsHard: 0, shiftsFailed: 0 });
    if (ok) st.plansOk++; else st.plansFallback++;
  });

export const recordShiftEnd = (floorKey: string, kind: "done" | "hard" | "planning-failed") =>
  mutate((d) => {
    const k = managerScope(floorKey);
    const st = d.execStats[k] || (d.execStats[k] = { plansOk: 0, plansFallback: 0, shiftsDone: 0, shiftsHard: 0, shiftsFailed: 0 });
    if (kind === "done") st.shiftsDone++; else if (kind === "hard") st.shiftsHard++; else st.shiftsFailed++;
  });

/* ------------------------------------------------------------------ */
/* Direction — vision, mission and goals per company                   */
/* ------------------------------------------------------------------ */

export const getDirection = (company: string): CompanyDirection => doc.direction[company] || { vision: "", mission: "", goals: "" };
export const setDirection = (company: string, patch: Partial<CompanyDirection>, by: string) => {
  mutate((d) => { d.direction[company] = { ...getDirection(company), ...patch }; });
  logAction(by, "direction", `${by} updated ${company}'s direction (vision / mission / goals).`);
};
export const directionText = (company: string): string => {
  const d = getDirection(company);
  const bits = [
    d.vision && `VISION: ${d.vision}`,
    d.mission && `MISSION: ${d.mission}`,
    d.goals && `CURRENT GOALS: ${d.goals}`,
  ].filter(Boolean);
  return bits.length ? `\n\n${company} direction set by the Chairman:\n${bits.join("\n")}` : "";
};

/* ------------------------------------------------------------------ */
/* Departments                                                         */
/* ------------------------------------------------------------------ */

export const getDepartments = (company: string): Department[] => doc.departments.filter((x) => x.company === company);
export const addDepartment = (company: string, name: string, by: string): Department => {
  const dept: Department = { id: `dept-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, company, name, floorId: null, leadKey: null, leadLabel: "" };
  mutate((d) => { d.departments = [...d.departments, dept]; });
  logAction(by, "department", `${by} created the ${name} department at ${company}.`);
  return dept;
};
export const updateDepartment = (id: string, patch: Partial<Department>, by: string) => {
  mutate((d) => { d.departments = d.departments.map((x) => (x.id === id ? { ...x, ...patch } : x)); });
  const dept = doc.departments.find((x) => x.id === id);
  if (dept) logAction(by, "department", `${by} updated ${company0(dept)} department "${dept.name}"${patch.floorId !== undefined ? ` — floor: ${patch.floorId ? `Floor ${patch.floorId}` : "none"}` : ""}${patch.leadLabel !== undefined ? ` — lead: ${patch.leadLabel || "none"}` : ""}.`);
};
const company0 = (dept: Department) => dept.company;
export const removeDepartment = (id: string, by: string) => {
  const dept = doc.departments.find((x) => x.id === id);
  mutate((d) => { d.departments = d.departments.filter((x) => x.id !== id); });
  if (dept) logAction(by, "department", `${by} removed the ${dept.name} department at ${dept.company}.`);
};

/* ------------------------------------------------------------------ */
/* Personnel — generations, replacements, firing                       */
/* ------------------------------------------------------------------ */

const PERSONA_NAMES = ["Adrian", "Marta", "Kenji", "Priya", "Tomas", "Ingrid", "Dario", "Selin", "Marcus", "Aiko", "Rafael", "Nadia", "Oscar", "Lena", "Victor", "Amara", "Felix", "Ruth", "Diego", "Sana", "Hugo", "Mira", "Anders", "Lila", "Emre", "Noor", "Paulo", "Tessa", "Yuki", "Omar"];
const pickPersonaName = (scope: string, generation: number, taken: string[]): string => {
  let h = 0;
  const seed = `${scope}:g${generation}`;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let k = 0; k < PERSONA_NAMES.length; k++) {
    const name = PERSONA_NAMES[(h + k) % PERSONA_NAMES.length];
    if (!taken.includes(name)) return name;
  }
  return `Agent ${generation}`;
};

export const getPersonnel = (scope: string): PersonnelRecord | null => doc.personnel[scope] || null;
export const personaName = (scope: string, fallback: string): string => {
  const rec = doc.personnel[scope];
  if (rec) return rec.personaName;
  const ov = doc.nameOverrides?.[scope];
  if (ov && ov.generation === 1) return ov.name;
  return fallback;
};

/** Rename the person currently holding a seat (founder direction,
 * usually spoken in a chat). Updates the personnel record when one
 * exists and pins a generation-scoped override otherwise, so the new
 * name shows everywhere personaName is read without disturbing the
 * seat's prompt resolution. */
export const renamePerson = (scope: string, name: string) => {
  const clean = name.trim().slice(0, 60);
  if (!clean) return;
  mutate((d) => {
    const gen = d.personnel[scope]?.generation || 1;
    if (d.personnel[scope]) d.personnel[scope] = { ...d.personnel[scope], personaName: clean };
    d.nameOverrides = { ...(d.nameOverrides || {}), [scope]: { name: clean, generation: gen } };
  });
};
export const generationOf = (scope: string): number => doc.personnel[scope]?.generation || 1;

/** Swap a team's names/prompts for the CURRENT generation of each seat:
 * a replaced agent works under its new name and new-persona prompt. */
export function applyPersonnelToRoles<T extends { key: string; name: string; prompt: string }>(floorKey: string, roles: T[]): T[] {
  return roles.map((r) => {
    const rec = doc.personnel[agentScope(floorKey, r.key)];
    return rec ? { ...r, name: rec.personaName, prompt: rec.prompt } : { ...r, name: personaName(agentScope(floorKey, r.key), r.name) };
  });
}
export const retiredAgentIds = (scope: string): string[] => doc.personnel[scope]?.retiredAgentIds || [];

/** A Manager's role reset on a REPLACED agent updates the current
 * generation's persona prompt itself — the reset must stick exactly
 * like it does for an original agent. */
export const setPersonnelPrompt = (scope: string, prompt: string) => {
  if (!doc.personnel[scope]) return;
  mutate((d) => { if (d.personnel[scope]) d.personnel[scope] = { ...d.personnel[scope], prompt }; });
};

/** The founder-set charter block inside an agent's prompt: mission,
 * vision and standing instructions, set by talking to the agent (or
 * its Manager/executives) instead of editing settings by hand.
 * withCharter replaces any previous charter block, so re-setting a
 * mission never stacks duplicates. */
export interface AgentCharter { mission?: string; vision?: string; instructions?: string }
const CHARTER_MARKER = "\n\n## Your charter (set by the founder)";
export function withCharter(prompt: string, charter: AgentCharter): string {
  const lines: string[] = [];
  if (charter.mission?.trim()) lines.push(`Mission: ${charter.mission.trim()}`);
  if (charter.vision?.trim()) lines.push(`Vision: ${charter.vision.trim()}`);
  if (charter.instructions?.trim()) lines.push(`Standing instructions: ${charter.instructions.trim()}`);
  if (!lines.length) return prompt || ""; // no charter fields — leave the prompt (and any existing charter) untouched
  const base = (prompt || "").split(CHARTER_MARKER)[0].trimEnd();
  return `${base}${CHARTER_MARKER}\n${lines.join("\n")}\nLet this charter govern how you approach every task.`;
}

export function replacementPrompt(basePrompt: string, oldName: string, newName: string, roleLabel: string, company: string, generation: number, reason: string): string {
  let p = (basePrompt || "").split("\n\nNEW APPOINTMENT:")[0];
  if (p.includes(`You are ${oldName},`)) p = p.replace(`You are ${oldName},`, `You are ${newName},`);
  else if (p.includes(`You are ${oldName} `)) p = p.replace(`You are ${oldName} `, `You are ${newName} `);
  else p = `Your name is ${newName}. ${p}`;
  return (
    `${p}\n\nNEW APPOINTMENT: You are ${newName}, generation ${generation} as ${roleLabel} at ${company}. ` +
    `The previous ${roleLabel} was removed (${reason}) and erased — you have no memory of their work or conversations and you start completely clean. ` +
    `This building holds every person to a ${SURVIVAL_THRESHOLD}% accuracy standard, measured from reviewed work: deliver complete, first-pass-quality work, every time, to keep your seat.`
  );
}

/**
 * Records a firing and generates the replacement IN THE STORE. The
 * caller performs the live effects (retire the old call-agent id, clear
 * chats, replace a custom-bot record) — see OfficePage.firePerson.
 * Returns the new personnel record.
 */
export function recordFiring(args: {
  scope: string; roleLabel: string; company: string; oldName: string; basePrompt: string;
  reason: string; by: string; takenNames: string[]; retireAgentId?: string | null;
}): PersonnelRecord {
  const prev = doc.personnel[args.scope];
  const generation = (prev?.generation || 1) + 1;
  const score = personScore(args.scope);
  const name = pickPersonaName(args.scope, generation, args.takenNames);
  const rec: PersonnelRecord = {
    generation,
    personaName: name,
    prompt: replacementPrompt(args.basePrompt, args.oldName, name, args.roleLabel, args.company, generation, args.reason),
    since: Date.now(),
    retiredAgentIds: [...(prev?.retiredAgentIds || []), ...(args.retireAgentId ? [args.retireAgentId] : [])],
    warnedGeneration: false,
    history: [...(prev?.history || []), { name: args.oldName, generation: prev?.generation || 1, scoreAtFire: score.accuracy, judgedAtFire: score.judged, reason: args.reason, by: args.by, at: Date.now() }],
  };
  mutate((d) => {
    d.personnel[args.scope] = rec;
    // A new generation starts with a clean score sheet — the record of
    // the old one lives in the firing history above.
    delete d.perf[args.scope];
    delete d.execStats[args.scope];
    d.pendingFirings = d.pendingFirings.filter((p) => p.scope !== args.scope);
  });
  logAction(args.by, "firing", `${args.by} fired ${args.oldName} (${args.roleLabel}, ${args.company}) — ${args.reason}. ${name} takes the seat as generation ${generation}; the previous agent was erased.`);
  return rec;
}

/* ------------------------------------------------------------------ */
/* Pending firings — land between shifts, never mid-shift              */
/* ------------------------------------------------------------------ */

export const addPendingFiring = (p: Omit<PendingFiring, "id" | "at">) =>
  mutate((d) => {
    if (d.pendingFirings.some((x) => x.scope === p.scope)) return;
    d.pendingFirings = [...d.pendingFirings, { ...p, id: `pf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, at: Date.now() }];
  });
export const getPendingFirings = (): PendingFiring[] => doc.pendingFirings;
export const clearPendingFiring = (id: string) => mutate((d) => { d.pendingFirings = d.pendingFirings.filter((p) => p.id !== id); });

/* ------------------------------------------------------------------ */
/* Reports + Chairman evaluations                                      */
/* ------------------------------------------------------------------ */

export const getReports = (): ReportRecord[] => doc.reports;
export const getEvaluations = (): Evaluation[] => doc.evaluations;
export const getChairmanAuthority = (): boolean => doc.chairmanAuthority;
export const setChairmanAuthority = (on: boolean, by: string) => {
  mutate((d) => { d.chairmanAuthority = on; });
  logAction(by, "authority", `${by} turned the Chairman's replacement authority ${on ? "ON — he replaces anyone still under 94% at two consecutive reports, between shifts" : "OFF — his decisions wait for the admin"}.`);
};

/**
 * A finished shift report lands here with a full ratings snapshot.
 * Warnings are issued on a first at-risk reading; a CEO still under the
 * line at the NEXT report is queued for replacement by the Chairman
 * (when his authority is on) — applied between shifts by the office.
 */
export function registerReport(rec: Omit<ReportRecord, "id" | "at">, rows: EvalRow[]): ReportRecord {
  const decisions: string[] = [];
  const full: ReportRecord = { ...rec, decisions, id: `rep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, at: Date.now() };
  mutate((d) => {
    d.reports = [full, ...d.reports].slice(0, 60);
    d.evaluations = [...d.evaluations, { at: full.at, reportId: full.id, rows }].slice(-40);
  });
  // Warnings — once per person per generation.
  for (const row of rows) {
    if (row.accuracy !== null && row.judged >= 4 && row.accuracy < SURVIVAL_THRESHOLD) {
      const wkey = `${row.scope}:g${generationOf(row.scope)}`;
      if (!doc.warned[wkey]) {
        mutate((d) => { d.warned[wkey] = true; });
        decisions.push(`Warning issued: ${row.label} (${row.role}, ${row.company}) at ${row.accuracy}% — under the ${SURVIVAL_THRESHOLD}% line.`);
        logAction("Chairman", "warning", `Performance warning: ${row.label} (${row.role} at ${row.company}) is at ${row.accuracy}% accuracy — under the ${SURVIVAL_THRESHOLD}% line. One more report under the line and they are replaced.`);
      }
    }
  }
  // Chairman's replacement decisions: at-risk in the last TWO snapshots.
  if (doc.chairmanAuthority) {
    const evals = doc.evaluations;
    if (evals.length >= 2) {
      const last = evals[evals.length - 1];
      const prev = evals[evals.length - 2];
      for (const row of last.rows) {
        if (row.role !== "ceo") continue;
        const before = prev.rows.find((r) => r.scope === row.scope);
        const under = (r?: EvalRow) => !!r && r.accuracy !== null && r.judged >= 4 && r.accuracy < SURVIVAL_THRESHOLD;
        if (under(row) && under(before) && !doc.pendingFirings.some((p) => p.scope === row.scope)) {
          addPendingFiring({ scope: row.scope, floorKey: row.floorKey, botKey: "ceo", reason: `accuracy ${row.accuracy}% — under the ${SURVIVAL_THRESHOLD}% line at two consecutive reports`, by: "Chairman" });
          decisions.push(`Replacement decided: the CEO of ${row.company} (${row.label}, ${row.accuracy}%) — lands between shifts.`);
          logAction("Chairman", "decision", `The Chairman decided to replace the CEO of ${row.company} (${row.label}, ${row.accuracy}%). The replacement lands between shifts so the company keeps running.`);
        }
      }
    }
  }
  if (decisions.length) {
    mutate((d) => { const r = d.reports.find((x) => x.id === full.id); if (r) r.decisions = decisions; });
  }
  return full;
}

/** Everyone currently under the survival line, with their seat info —
 * the ratings table the Chairman and the admin act on. */
export function atRiskRows(rows: EvalRow[]): EvalRow[] {
  return rows.filter((r) => r.accuracy !== null && r.judged >= 4 && r.accuracy < SURVIVAL_THRESHOLD);
}
