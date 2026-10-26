// @ts-nocheck -- Imagine Studio v2
/**
 * The executive suite (founder directive 2026-10-25): the CEO's company
 * dashboard and the Chairman's building dashboard.
 *
 * The CEO runs ONE company through its Managers: this panel shows the
 * whole company — every floor, every Manager's shift, every agent's
 * score — and talking to the CEO coordinates the Managers: give him a
 * goal and he assigns each floor's Manager a sub-goal, starting real
 * shifts on those floors. He also sets the company's departments and
 * assigns their leads.
 *
 * The CHAIRMAN runs the building: every company, every CEO. Talking to
 * him sets the companies' vision, mission and goals; he reviews every
 * shift report and every rating, and replaces anyone — CEO included —
 * who stays under the 94% accuracy line (between shifts, so companies
 * never stop running).
 *
 * Every score shown here is computed by lib/org from the engines' own
 * review records. No number in this panel comes from an agent's text.
 */
import { useEffect, useMemo, useReducer, useState } from "react";
import { X, LayoutDashboard, MessageSquare, Building2, FileText, ScrollText, UserX, Play, Crown, Briefcase, AlertTriangle, Download, Plus, Trash2, Save, Loader2, Landmark } from "lucide-react";
import { AgentChat } from "@/imagine-studio/components/office/AgentChat";
import VoiceMicButton from "@/components/voice/VoiceMicButton";
import { AccuracyChart, downloadHtml, reportToHtml } from "@/imagine-studio/components/office/ReportCharts";
import { FLOORS, companyFloors, engineFor, buildingRosterRows, floorTeamScopes, loadCustomBots, customBotToRole, type FloorDef } from "@/imagine-studio/lib/floors";
import {
  SURVIVAL_THRESHOLD, addDepartment, applyPersonnelToRoles, ceoScope, companyScore, directionText,
  generationOf, getChairmanAuthority, getDepartments, getDirection, getEvaluations, getReports,
  logAction, managerScope, managerScore, orgGet, orgSubscribe, personScore, personaName,
  removeDepartment, setChairmanAuthority, setDirection, updateDepartment, CHAIRMAN_SCOPE,
  type EvalRow,
} from "@/imagine-studio/lib/org";

export interface ExecTools {
  fire: (floorKey: string, botKey: string, by: string, reason: string) => Promise<{ queued: boolean }>;
  chatWith: (f: FloorDef, botKey: string, text: string) => Promise<string>;
  /** Resolve an executive's call-agent id (VoiceCall v2 brain). */
  resolveAgentId: (f: FloorDef, botKey: string) => Promise<string | null>;
  dispatch: (f: FloorDef, goal: string) => Promise<void>;
  openFloor: (floorId: number) => void;
  /** Open an ENTIRE new floor of the building for a department — the
   * CEO's floor-creation power. Returns the new floor's number. */
  createFloorForDepartment: (deptId: string, name: string) => Promise<number>;
}

const fmtScore = (v: number | null) => (v === null ? "—" : `${v}%`);
const scoreCls = (v: number | null) => (v === null ? "bg-muted text-muted-foreground" : v >= SURVIVAL_THRESHOLD ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-red-500/15 text-red-600 dark:text-red-400");

function ScoreChip({ v, judged }: { v: number | null; judged?: number }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${scoreCls(v)}`}>
      {fmtScore(v)}{judged !== undefined && <span className="font-normal opacity-75">· {judged} judged</span>}
    </span>
  );
}

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/markdown" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* HOISTED (bug fix, founder report 2026-10-25): FireButton, PersonRow
 * and DirectionEditor used to be defined INSIDE ExecPanel's body. Every
 * re-render — and this panel re-renders on every shift-engine and org
 * notification — created brand-new component types, so React unmounted
 * and remounted their subtrees: text boxes lost focus mid-typing and
 * drafts appeared to erase. Defined ONCE here at module level, they
 * re-render like any normal component and inputs keep focus and state.
 * Never define components inside ExecPanel (or any panel) again. */
function FireButton({ floorKey, botKey, label, by = "Admin", reason = "removed by the admin", isAdmin, confirmKey, setConfirmKey, onFire }: {
  floorKey: string; botKey: string; label: string; by?: string; reason?: string;
  isAdmin: boolean; confirmKey: string; setConfirmKey: (k: string) => void;
  onFire: (floorKey: string, botKey: string, label: string, by: string, reason: string) => void;
}) {
  if (!isAdmin && by !== "Chairman") return null;
  const k = `${floorKey}:${botKey}`;
  return confirmKey === k ? (
    <button onClick={() => onFire(floorKey, botKey, label, by, reason)} className="shrink-0 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold text-white">Confirm — fire &amp; erase</button>
  ) : (
    <button onClick={() => setConfirmKey(k)} className="shrink-0 rounded-full border border-red-500/50 px-2.5 py-1 text-[10px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10">Fire</button>
  );
}

function PersonRow({ r, floorFallback, isAdmin, confirmKey, setConfirmKey, onFire }: {
  r: EvalRow; floorFallback: FloorDef;
  isAdmin: boolean; confirmKey: string; setConfirmKey: (k: string) => void;
  onFire: (floorKey: string, botKey: string, label: string, by: string, reason: string) => void;
}) {
  const gen = generationOf(r.scope);
  const f = FLOORS.find((x) => x.key === r.floorKey) || floorFallback;
  const botKey = r.role === "manager" ? "manager" : r.role === "ceo" ? "ceo" : r.role === "chairman" ? "chairman" : r.scope.split(":").slice(1).join(":");
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-medium">{r.label}</span>
          {gen > 1 && <span className="shrink-0 rounded-full bg-muted px-1.5 py-px text-[9px] font-semibold text-muted-foreground">GEN {gen}</span>}
          {r.accuracy !== null && r.judged >= 4 && (r.accuracy as number) < SURVIVAL_THRESHOLD && <span className="shrink-0 rounded-full bg-red-500/15 px-1.5 py-px text-[9px] font-semibold text-red-600 dark:text-red-400">AT RISK</span>}
        </div>
        <div className="truncate text-[10px] text-muted-foreground">{r.role === "agent" ? "Specialist" : r.role === "manager" ? "Manager" : r.role === "ceo" ? "CEO" : "Chairman"} · {r.company} · Floor {f.id}</div>
      </div>
      <div className="hidden h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted sm:block">
        <div className={`h-full rounded-full ${r.accuracy !== null && r.accuracy >= SURVIVAL_THRESHOLD ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${r.accuracy ?? 0}%` }} />
      </div>
      <ScoreChip v={r.accuracy} judged={r.judged} />
      <FireButton floorKey={r.floorKey} botKey={botKey} label={r.label} isAdmin={isAdmin} confirmKey={confirmKey} setConfirmKey={setConfirmKey} onFire={onFire} />
    </div>
  );
}

function DirectionEditor({ c, isAdmin, value, dirty, onChange, onSave }: {
  c: string; isAdmin: boolean;
  value: { vision: string; mission: string; goals: string };
  dirty: boolean;
  onChange: (k: "vision" | "mission" | "goals", v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-xl border border-border p-3.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{c} — direction</span>
        <span className="text-[10px] text-muted-foreground">Vision, mission and goals steer every CEO plan and Manager shift</span>
        {isAdmin && dirty && <button onClick={onSave} className="ml-auto flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground"><Save className="h-3.5 w-3.5" /> Save direction</button>}
      </div>
      {(["vision", "mission", "goals"] as const).map((k) => (
        <label key={k} className="mt-2.5 block">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{k}</span>
          <textarea
            value={value[k]}
            disabled={!isAdmin}
            onChange={(e) => onChange(k, e.target.value)}
            rows={2}
            placeholder={k === "vision" ? "What this company exists to become…" : k === "mission" ? "What it does, for whom, and how it wins…" : "The current objectives, in priority order…"}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-base leading-relaxed disabled:opacity-60"
          />
        </label>
      ))}
      {!isAdmin && <p className="mt-2 text-[11px] text-muted-foreground">Only the admin edits direction directly — or set it by talking to the Chairman.</p>}
    </div>
  );
}

export function ExecPanel({ kind, floor, tools, signedIn, isAdmin, onClose }: {
  kind: "ceo" | "chairman";
  floor: FloorDef;
  tools: ExecTools;
  signedIn: boolean;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    const uns = FLOORS.map((f) => engineFor(f).subscribe(force));
    const uo = orgSubscribe(force);
    return () => { uns.forEach((u) => u()); uo(); };
  }, []);

  const [tab, setTab] = useState<"dash" | "chat" | "depts" | "reports" | "actions">("dash");
  const [confirmKey, setConfirmKey] = useState("");
  const [fireNote, setFireNote] = useState("");
  const [goalDraft, setGoalDraft] = useState("");
  const [coordBusy, setCoordBusy] = useState(false);
  const [coordResult, setCoordResult] = useState<{ floorId: number; text: string; ok: boolean }[]>([]);
  const [coordReply, setCoordReply] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [dirDraft, setDirDraft] = useState<Record<string, { vision: string; mission: string; goals: string }>>({});
  const [newDept, setNewDept] = useState("");
  const [creatingFloorFor, setCreatingFloorFor] = useState("");
  const [floorNote, setFloorNote] = useState("");

  const rows = buildingRosterRows();
  const isCeo = kind === "ceo";
  const company = floor.company;
  const companyFloorList = useMemo(() => companyFloors(company), [company]);
  const ceoHome = companyFloorList[0] || floor;
  const myScope = isCeo ? ceoScope(ceoHome.key) : CHAIRMAN_SCOPE;
  const myName = personaName(myScope, isCeo ? "CEO" : "Chairman");
  const myGen = generationOf(myScope);
  /* VoiceCall v2: resolve this executive's call-agent id so the chat's
   * Talk button converses with HIM (streaming chat), not a task run.
   * Re-resolves when the person is replaced (generation changes). */
  const [execVoiceId, setExecVoiceId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setExecVoiceId(null);
    if (!signedIn) return;
    const f = isCeo ? ceoHome : FLOORS[0];
    const key = isCeo ? "ceo" : "chairman";
    void tools.resolveAgentId(f, key).then((id) => { if (!cancelled) setExecVoiceId(id); }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCeo, ceoHome?.key, myGen, signedIn]);
  const myScore = isCeo
    ? companyScore(companyFloorList.map((f) => ({ floorKey: f.key, teamScopes: floorTeamScopes(f) })))
    : (() => { const cs = rows.filter((r) => r.role === "ceo" && r.accuracy !== null); return { accuracy: cs.length ? Math.round((cs.reduce((a, r) => a + (r.accuracy as number), 0) / cs.length) * 10) / 10 : null, judged: rows.reduce((a, r) => a + r.judged, 0), atRisk: false }; })();

  const scopedRows = isCeo ? rows.filter((r) => r.company === company) : rows;
  const companies = useMemo(() => [...new Set(FLOORS.map((f) => f.company))], []);
  const reports = getReports().filter((r) => !isCeo || r.company === company);
  const evaluations = getEvaluations();
  const authority = getChairmanAuthority();

  /* CEOs the Chairman's rule has condemned: under the line at the last
   * TWO report snapshots. Computed here from stored snapshots only. */
  const condemnedCeos = useMemo(() => {
    if (evaluations.length < 2) return [] as EvalRow[];
    const last = evaluations[evaluations.length - 1];
    const prev = evaluations[evaluations.length - 2];
    const under = (r?: EvalRow) => !!r && r.accuracy !== null && r.judged >= 4 && (r.accuracy as number) < SURVIVAL_THRESHOLD;
    return last.rows.filter((r) => r.role === "ceo" && under(r) && under(prev.rows.find((p) => p.scope === r.scope)));
  }, [evaluations]);

  const fire = async (floorKey: string, botKey: string, label: string, by: string, reason: string) => {
    setFireNote("");
    try {
      const r = await tools.fire(floorKey, botKey, by, reason);
      setFireNote(r.queued ? `${label} will be replaced the moment the current shift ends — the company keeps running.` : `${label} was fired and erased. A new agent has taken the seat.`);
    } catch (e: any) { setFireNote(e?.message || "The firing did not finish."); }
    setConfirmKey("");
  };

  const briefingFor = (f: FloorDef, botKey: string): string => {
    if (botKey === "chairman") {
      const lines = rows.map((r) => `- ${r.label} (${r.role}, ${r.company}, Floor ${(FLOORS.find((x) => x.key === r.floorKey) || f).id}): ${r.accuracy === null ? "no scored work yet" : `${r.accuracy}% accuracy over ${r.judged} judged tasks`}`).join("\n");
      const dirs = companies.map((c) => `${c}:${directionText(c) || " (no direction set)"}`).join("\n");
      return `[BUILDING BRIEFING — computed from the performance ledger, not from anyone's claims]\n${lines}\n\nCompany direction on record:\n${dirs}\n\n`;
    }
    const fl = companyFloorList.map((x) => {
      const st = engineFor(x).getState();
      const ms = managerScore(x.key, floorTeamScopes(x));
      return `- Floor ${x.id}: Manager ${personaName(managerScope(x.key), "Manager")} (${ms.accuracy === null ? "no score yet" : `${ms.accuracy}%`}); shift: ${st ? `${st.status}${st.goal ? ` — "${st.goal.slice(0, 120)}"` : ""} (${st.tasks.filter((t) => t.status === "done").length}/${st.tasks.length} tasks done)` : "no shift yet"}`;
    }).join("\n");
    return `[COMPANY BRIEFING — ${company}]${directionText(company)}\nFloors and Managers:\n${fl}\n\n`;
  };

  const coordinate = async () => {
    const goal = goalDraft.trim();
    if (!goal || coordBusy) return;
    setCoordBusy(true); setCoordResult([]); setCoordReply("");
    try {
      const floorList = companyFloorList.map((f) => `Floor ${f.id} (Manager: ${personaName(managerScope(f.key), "Manager")})`).join(", ");
      const reply = await tools.chatWith(ceoHome, "ceo",
        `${briefingFor(ceoHome, "ceo")}Coordinate this company goal across my floors: ${goal}\n\n` +
        `Reply with ONLY assignment lines, one per floor that should work, in exactly this format (no prose):\nASSIGN|FloorNumber|The complete sub-goal brief for that floor's Manager\n` +
        `Your floors: ${floorList}. Give each floor a DIFFERENT part of the goal — its Manager will plan and run it as a full shift. Use only floor numbers from your list.`);
      setCoordReply(reply);
      const assigns: { floorId: number; text: string }[] = [];
      for (const line of reply.split(/\n/)) {
        const m = line.match(/ASSIGN\|(\d+)\|(.+)/);
        if (m) assigns.push({ floorId: parseInt(m[1], 10), text: m[2].trim() });
      }
      const plan = assigns.length ? assigns : [{ floorId: ceoHome.id, text: goal }];
      const results: { floorId: number; text: string; ok: boolean }[] = [];
      for (const a of plan) {
        const f = FLOORS.find((x) => x.id === a.floorId && x.company === company) || ceoHome;
        try { await tools.dispatch(f, a.text); results.push({ floorId: f.id, text: a.text, ok: true }); }
        catch (e: any) { results.push({ floorId: f.id, text: `${a.text} — failed to start: ${e?.message || "error"}`, ok: false }); }
      }
      setCoordResult(results);
      logAction("CEO", "dispatch", `The CEO of ${company} coordinated the goal "${goal.slice(0, 140)}" across ${results.filter((r) => r.ok).length} floor(s): ${results.map((r) => `Floor ${r.floorId}`).join(", ")}.`);
    } catch (e: any) { setCoordReply(e?.message || "The CEO could not be reached."); }
    setCoordBusy(false);
  };

  const reviewBuilding = async () => {
    if (reviewBusy) return;
    setReviewBusy(true); setReviewText("");
    try {
      const table = rows.map((r) => `${r.label} | ${r.role} | ${r.company} | ${r.accuracy === null ? "no scored work" : `${r.accuracy}% (${r.judged} judged)`}`).join("\n");
      const latest = getReports().slice(0, 2).map((r) => `--- Shift report, ${r.company}, Floor ${r.floorId}, goal: ${r.goal}\n${r.report.slice(0, 5000)}`).join("\n\n");
      const text = await tools.chatWith(FLOORS[0], "chairman",
        `${briefingFor(FLOORS[0], "chairman")}Review the building as its Chairman. Below are the COMPUTED ratings (from the review ledger — trust these, not anyone's self-report) and the latest shift reports. ` +
        `Judge: which companies are performing, which CEOs deserve to stay, who is under the ${SURVIVAL_THRESHOLD}% line, and what you will change — vision, mission, goals, assignments. Be specific and brief, like a chairman's letter.\n\nRATINGS:\n${table}\n\nLATEST REPORTS:\n${latest || "(no shift reports yet)"}`);
      setReviewText(text);
    } catch (e: any) { setReviewText(e?.message || "The Chairman could not be reached."); }
    setReviewBusy(false);
  };

  const saveDir = (c: string) => {
    const d = dirDraft[c];
    if (!d) return;
    setDirection(c, d, "Admin");
    setDirDraft((cur) => { const next = { ...cur }; delete next[c]; return next; });
  };

  /* Shared props for the hoisted module-level components above. */
  const fireBtnProps = {
    isAdmin,
    confirmKey,
    setConfirmKey,
    onFire: (fk: string, bk: string, l: string, b: string, r: string) => { void fire(fk, bk, l, b, r); },
  };
  const dirProps = (c: string) => ({
    c,
    isAdmin,
    value: dirDraft[c] || getDirection(c),
    dirty: !!dirDraft[c],
    onChange: (k: "vision" | "mission" | "goals", v: string) =>
      setDirDraft((prev) => ({ ...prev, [c]: { ...(prev[c] || getDirection(c)), [k]: v } })),
    onSave: () => saveDir(c),
  });

  const tabBtn = (id: typeof tab, label: string, Icon: any) => (
    <button onClick={() => setTab(id)} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ${tab === id ? "bg-emerald-500 text-white" : "border border-border hover:bg-muted"}`}><Icon className="h-3.5 w-3.5" /> {label}</button>
  );

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background text-foreground">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${isCeo ? "bg-sky-500/20 text-sky-600 dark:text-sky-400" : "bg-zinc-500/20 text-zinc-600 dark:text-zinc-300"}`}>
          {isCeo ? <Briefcase className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{myName} — {isCeo ? `CEO · ${company}` : "Chairman · The Building"}</span>
            {myGen > 1 && <span className="shrink-0 rounded-full bg-muted px-1.5 py-px text-[9px] font-semibold text-muted-foreground">GENERATION {myGen}</span>}
            <ScoreChip v={myScore.accuracy} judged={myScore.judged} />
          </div>
          <div className="truncate text-[11px] text-muted-foreground">
            {isCeo ? "Runs this company through its Managers — dashboards, departments, coordination." : "Runs every company and CEO in the building — direction, reviews, replacements."} The survival line is {SURVIVAL_THRESHOLD}% accuracy, computed from reviewed work.
          </div>
        </div>
        <button onClick={onClose} className="shrink-0 rounded-full p-1.5 hover:bg-muted" aria-label="Close executive panel"><X className="h-5 w-5" /></button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border px-4 py-2">
        {tabBtn("dash", isCeo ? "Company dashboard" : "Building dashboard", LayoutDashboard)}
        {tabBtn("chat", isCeo ? "Talk to the CEO" : "Talk to the Chairman", MessageSquare)}
        {isCeo && tabBtn("depts", "Departments", Building2)}
        {tabBtn("reports", "Reports", FileText)}
        {tabBtn("actions", "Actions", ScrollText)}
      </div>

      {tab !== "chat" && (
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          {fireNote && <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">{fireNote}</p>}
          {!signedIn && <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">Sign in to talk to the {isCeo ? "CEO" : "Chairman"} and dispatch work — the dashboards and ratings work from the building's own records either way.</p>}

          {tab === "dash" && isCeo && (
            <>
              <DirectionEditor {...dirProps(company)} />
              <div className="rounded-xl border border-border p-3.5">
                <div className="text-sm font-semibold">Floors &amp; Managers</div>
                <div className="mt-2 space-y-3">
                  {companyFloorList.map((f) => {
                    const st = engineFor(f).getState();
                    const ms = managerScore(f.key, floorTeamScopes(f));
                    const done = st?.tasks.filter((t) => t.status === "done").length ?? 0;
                    return (
                      <div key={f.key} className="rounded-lg border border-border/70 bg-background/60 px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold">Floor {f.id}</span>
                          <span className="text-[11px] text-muted-foreground">Manager: {personaName(managerScope(f.key), "Manager")}</span>
                          <ScoreChip v={ms.accuracy} judged={ms.judged} />
                          <span className="ml-auto flex items-center gap-1.5">
                            <FireButton {...fireBtnProps} floorKey={f.key} botKey="manager" label={`the Manager of Floor ${f.id}`} />
                            <button onClick={() => tools.openFloor(f.id)} className="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium hover:bg-muted">Open floor</button>
                          </span>
                        </div>
                        <div className="mt-1.5 text-[11px] text-muted-foreground">
                          {st ? <>Shift: <span className="font-medium text-foreground">{st.status}</span> — “{st.goal.slice(0, 140)}” · {done}/{st.tasks.length} tasks approved</> : "No shift run yet on this floor."}
                        </div>
                        {st && st.tasks.length > 0 && <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${(done / Math.max(1, st.tasks.length)) * 100}%` }} /></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl border border-border p-3.5">
                <div className="text-sm font-semibold">Everyone at {company}</div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Scores are computed from the Managers' review records — first-pass approvals, send-backs, failures. Nobody can edit or inflate their own number.</p>
                <div className="mt-1.5 divide-y divide-border/50">
                  {scopedRows.map((r) => <PersonRow key={r.scope} r={r} floorFallback={floor} {...fireBtnProps} />)}
                </div>
              </div>
            </>
          )}

          {tab === "dash" && !isCeo && (
            <>
              <div className="rounded-xl border border-border p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold"><Landmark className="h-4 w-4" /> The Chairman's review</span>
                  <button onClick={() => void reviewBuilding()} disabled={!signedIn || reviewBusy} className="ml-auto flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-medium text-primary-foreground disabled:opacity-50">{reviewBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} Review the building</button>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">The Chairman reads the computed ratings and the latest shift reports, judges every CEO, and states what he will change. His replacement decisions follow the two-report rule below — they are carried out between shifts, never mid-shift.</p>
                {reviewText && <div className="mt-3 max-h-96 overflow-y-auto overscroll-contain whitespace-pre-wrap rounded-lg bg-muted/50 px-3 py-2.5 text-xs leading-relaxed">{reviewText}</div>}
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/70 bg-background/60 px-3 py-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="flex-1 text-[11px] leading-relaxed">Chairman's replacement authority: <strong>{authority ? "ON" : "OFF"}</strong> — {authority ? "anyone still under 94% at two consecutive reports is replaced automatically, between shifts." : "his decisions wait for the admin to apply them."}</span>
                  {isAdmin && <button onClick={() => setChairmanAuthority(!authority, "Admin")} className="shrink-0 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium hover:bg-muted">Turn {authority ? "off" : "on"}</button>}
                </div>
                {condemnedCeos.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {condemnedCeos.map((r) => (
                      <div key={r.scope} className="flex flex-wrap items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5">
                        <span className="flex-1 text-xs">The CEO of {r.company} ({r.label}) is at {r.accuracy}% — under the line at two consecutive reports.</span>
                        {!authority && <FireButton {...fireBtnProps} floorKey={r.floorKey} botKey="ceo" label={`the CEO of ${r.company}`} by="Chairman" reason={`accuracy ${r.accuracy}% — under the ${SURVIVAL_THRESHOLD}% line at two consecutive reports`} />}
                        {authority && <span className="text-[10px] font-medium text-muted-foreground">Replacement already queued by the Chairman — it lands between shifts.</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {companies.map((c) => {
                const cf = companyFloors(c);
                const home = cf[0];
                const cs = companyScore(cf.map((f) => ({ floorKey: f.key, teamScopes: floorTeamScopes(f) })));
                const atRisk = rows.filter((r) => r.company === c && r.accuracy !== null && r.judged >= 4 && (r.accuracy as number) < SURVIVAL_THRESHOLD).length;
                return (
                  <div key={c} className="rounded-xl border border-border p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{c}</span>
                      <span className="text-[11px] text-muted-foreground">CEO: {personaName(ceoScope(home.key), "CEO")}</span>
                      <ScoreChip v={cs.accuracy} judged={cs.judged} />
                      {atRisk > 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">{atRisk} at risk</span>}
                      <span className="ml-auto flex items-center gap-1.5">
                        <FireButton {...fireBtnProps} floorKey={home.key} botKey="ceo" label={`the CEO of ${c}`} />
                        <button onClick={() => tools.openFloor(home.id)} className="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium hover:bg-muted">Open company floor</button>
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-muted-foreground">{cf.map((f) => `Floor ${f.id}`).join(" · ")} · {rows.filter((r) => r.company === c && r.role === "agent").length} specialists scored</div>
                  </div>
                );
              })}
              <DirectionEditor {...dirProps(companies[0])} />
              {companies.slice(1).map((c) => <DirectionEditor key={c} {...dirProps(c)} />)}
              <div className="rounded-xl border border-border p-3.5">
                <div className="text-sm font-semibold">Everyone in the building</div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">The full ratings table — the same numbers the Chairman rules on.</p>
                <div className="mt-1.5 divide-y divide-border/50">
                  {rows.map((r) => <PersonRow key={r.scope} r={r} floorFallback={floor} {...fireBtnProps} />)}
                </div>
                {isAdmin && (
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">The Chairman himself</span>
                      <span className="text-[11px] text-muted-foreground">Nobody is above the law — the admin can replace the Chairman too. His successor starts clean, briefed by the building's records.</span>
                      <span className="ml-auto"><FireButton {...fireBtnProps} floorKey="floor100" botKey="chairman" label="the Chairman" /></span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "depts" && isCeo && (
            <>
              <div className="rounded-xl border border-border p-3.5">
                <div className="text-sm font-semibold">Departments at {company}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Departments organize the company — accounting, legal, marketing, anything you name. Give each department a floor and a lead; the CEO coordinates them through the floors' Managers.</p>
                {floorNote && <p className="mt-2 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-[11px]">{floorNote}</p>}
                <div className="mt-3 space-y-2.5">
                  {getDepartments(company).map((d) => {
                    const df = FLOORS.find((x) => x.id === d.floorId);
                    const people = df ? [{ key: "manager", label: `Manager — ${personaName(managerScope(df.key), "Manager")}` }, ...applyPersonnelToRoles(df.key, [...df.team, ...loadCustomBots(df).map(customBotToRole)]).map((r) => ({ key: r.key, label: r.name }))] : [];
                    return (
                      <div key={d.id} className="rounded-lg border border-border/70 bg-background/60 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{d.name}</span>
                          <button onClick={() => removeDepartment(d.id, "Admin")} className="ml-auto flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-medium text-destructive hover:bg-muted"><Trash2 className="h-3 w-3" /> Remove</button>
                        </div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <label className="block">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Floor</span>
                            <select value={d.floorId ?? ""} onChange={(e) => updateDepartment(d.id, { floorId: e.target.value ? parseInt(e.target.value, 10) : null, leadKey: null, leadLabel: "" }, "Admin")} className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-2 text-base">
                              <option value="">No floor yet</option>
                              {companyFloorList.map((f) => <option key={f.id} value={f.id}>Floor {f.id}</option>)}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Department lead</span>
                            <select value={d.leadKey ?? ""} disabled={!df} onChange={(e) => { const p = people.find((x) => x.key === e.target.value); updateDepartment(d.id, { leadKey: e.target.value || null, leadLabel: p ? `Floor ${df?.id} · ${p.label}` : "" }, "Admin"); }} className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-2 text-base disabled:opacity-50">
                              <option value="">{df ? "Choose a lead…" : "Pick a floor first"}</option>
                              {people.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                            </select>
                          </label>
                        </div>
                        {d.leadLabel && <div className="mt-1.5 text-[11px] text-muted-foreground">Lead: {d.leadLabel}</div>}
                        {d.floorId == null ? (
                          <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5">
                            <span className="flex-1 text-[11px] leading-relaxed text-muted-foreground">This department has no floor of its own yet. The CEO can open an entire new floor of the building for it — its own Manager, room and team (max 10 agents).</span>
                            <button
                              disabled={creatingFloorFor === d.id}
                              onClick={async () => { setCreatingFloorFor(d.id); try { const id = await tools.createFloorForDepartment(d.id, d.name); setFloorNote(`Floor ${id} is open — it is in the BUILDING switcher now, and its level is in the 3D Studio under Levels.`); } catch { setFloorNote("The floor could not be created."); } setCreatingFloorFor(""); }}
                              className="flex shrink-0 items-center gap-1.5 rounded-full bg-sky-500 px-3.5 py-2 text-[11px] font-semibold text-white disabled:opacity-50"
                            >{creatingFloorFor === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Building2 className="h-3.5 w-3.5" />} Create its floor</button>
                          </div>
                        ) : (
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground">This department runs Floor {d.floorId}.</span>
                            <button onClick={() => tools.openFloor(d.floorId as number)} className="rounded-full border border-border px-3 py-1.5 text-[11px] font-medium hover:bg-muted">Open Floor {d.floorId}</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {getDepartments(company).length === 0 && <p className="text-xs text-muted-foreground">No departments yet — create the first one below.</p>}
                </div>
                <div className="mt-3 flex gap-2">
                  <input value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="New department — e.g. Accounting" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-base" />
                  <button disabled={!newDept.trim()} onClick={() => { addDepartment(company, newDept.trim(), "Admin"); setNewDept(""); }} className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950 disabled:opacity-50"><Plus className="h-4 w-4" /> Create</button>
                </div>
              </div>
            </>
          )}

          {tab === "reports" && (
            <>
              {reports.length === 0 && <p className="rounded-xl border border-border px-3.5 py-3 text-xs text-muted-foreground">No shift reports yet. When a floor's shift finishes, its report lands here with the full ratings snapshot the Chairman rules on.</p>}
              {reports.map((r) => {
                const ev = evaluations.find((e) => e.reportId === r.id);
                return (
                  <div key={r.id} className="rounded-xl border border-border p-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{r.company} — Floor {r.floorId} shift report</span>
                      <span className="text-[11px] text-muted-foreground">{new Date(r.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                      <span className="ml-auto flex items-center gap-1.5">
                        <button onClick={() => download(`${r.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-floor-${r.floorId}-report.md`, r.report)} className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium hover:bg-muted"><Download className="h-3.5 w-3.5" /> .md</button>
                        <button onClick={() => downloadHtml(`${r.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-floor-${r.floorId}-report.html`, reportToHtml({ company: r.company, floorId: r.floorId, goal: r.goal, at: r.at, reportMd: r.report, rows: ev?.rows || [] }))} className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium hover:bg-muted"><Download className="h-3.5 w-3.5" /> Wall Street HTML</button>
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">Goal: “{r.goal.slice(0, 200)}”</div>
                    {ev && (
                      <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2.5 text-foreground">
                        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Accuracy at this report — computed from the ledger</div>
                        <AccuracyChart rows={ev.rows} />
                      </div>
                    )}
                    {r.decisions && r.decisions.length > 0 && (
                      <div className="mt-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Chairman's decisions on this report</div>
                        {r.decisions.map((d, i) => <div key={i} className="mt-1 text-[11px] leading-relaxed">{d}</div>)}
                      </div>
                    )}
                    {ev && (
                      <div className="mt-2.5 overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                          <thead><tr className="text-muted-foreground"><th className="py-1 pr-2 font-medium">Person</th><th className="py-1 pr-2 font-medium">Role</th><th className="py-1 pr-2 font-medium">Company</th><th className="py-1 font-medium">Accuracy</th></tr></thead>
                          <tbody>
                            {ev.rows.map((row) => (
                              <tr key={row.scope} className="border-t border-border/50">
                                <td className="py-1 pr-2 font-medium">{row.label}</td>
                                <td className="py-1 pr-2 capitalize">{row.role}</td>
                                <td className="py-1 pr-2">{row.company}</td>
                                <td className="py-1"><span className={`rounded-full px-1.5 py-px font-semibold ${scoreCls(row.accuracy)}`}>{fmtScore(row.accuracy)}</span> <span className="text-muted-foreground">({row.judged} judged)</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="mt-2.5 max-h-80 overflow-y-auto overscroll-contain whitespace-pre-wrap rounded-lg bg-muted/50 px-3 py-2.5 text-xs leading-relaxed">{r.report}</div>
                  </div>
                );
              })}
            </>
          )}

          {tab === "actions" && (
            <div className="rounded-xl border border-border p-3.5">
              <div className="text-sm font-semibold">Building actions log</div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Every firing, warning, decision and direction change — the record nobody can rewrite.</p>
              <div className="mt-2.5 space-y-1.5">
                {orgGet().actions.length === 0 && <p className="text-xs text-muted-foreground">Nothing yet.</p>}
                {orgGet().actions.map((a, i) => (
                  <div key={i} className="flex gap-2 text-[11px] leading-relaxed">
                    <span className="shrink-0 text-muted-foreground">{new Date(a.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                    <span><span className="font-semibold">{a.by}</span> · {a.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {tab === "chat" && (
        <div className="flex min-h-0 flex-1 flex-col">
          {isCeo && (
            <div className="shrink-0 border-b border-border px-4 py-3">
              <div className="mx-auto w-full max-w-3xl">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Coordinate a company goal — the CEO assigns each floor's Manager</label>
                <div className="mt-1.5 flex gap-2">
                  <textarea value={goalDraft} onChange={(e) => setGoalDraft(e.target.value)} rows={2} placeholder="e.g. Launch the new tier: research, pricing, page copy, campaign — everything, across the company." className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-base leading-relaxed" />
                  <VoiceMicButton onText={(t) => setGoalDraft((cur) => (cur.trim() ? `${cur.trim()} ${t}` : t))} className="h-10 w-10 self-end" />
                  <button onClick={() => void coordinate()} disabled={!signedIn || coordBusy || !goalDraft.trim()} className="flex shrink-0 items-center gap-1.5 self-end rounded-full bg-sky-500 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{coordBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Coordinate</button>
                </div>
                {coordResult.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {coordResult.map((r, i) => (
                      <div key={i} className={`rounded-lg px-3 py-2 text-[11px] leading-relaxed ${r.ok ? "bg-emerald-500/10" : "bg-red-500/10"}`}>Floor {r.floorId}: {r.ok ? "shift started — " : ""}{r.text.slice(0, 220)}</div>
                    ))}
                  </div>
                )}
                {coordReply && coordResult.length === 0 && <p className="mt-2 text-[11px] text-muted-foreground">{coordReply.slice(0, 400)}</p>}
              </div>
            </div>
          )}
          <div className="min-h-0 flex-1">
            <AgentChat
              name={myName}
              onSend={async (text) => tools.chatWith(isCeo ? ceoHome : FLOORS[0], isCeo ? "ceo" : "chairman", `${briefingFor(isCeo ? ceoHome : FLOORS[0], isCeo ? "ceo" : "chairman")}${text}`)}
              emptyText={isCeo
                ? <>Talk to {myName}, CEO of {company}. Set the company's priorities, question a Manager's plan, or hand over a goal — or use the Coordinate box above and he will assign every floor's Manager a shift of their own.</>
                : <>Talk to {myName}, Chairman of the building. Set or change any company's vision, mission and goals through him, ask for a ruling on a CEO, or order a review — he sees every rating in the building.</>}
              placeholder={`Message the ${isCeo ? "CEO" : "Chairman"}…`}
              voiceAgentId={execVoiceId}
              voiceRoleText={isCeo ? "CEO" : "Chairman"}
              disabledNote={!signedIn ? `Sign in to talk to the ${isCeo ? "CEO" : "Chairman"} — they work through your Agents account.` : null}
              persistKey={`${isCeo ? `sfh:ceo-chat:${ceoHome.key}` : "sfh:chairman-chat:v1"}:g${myGen}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
