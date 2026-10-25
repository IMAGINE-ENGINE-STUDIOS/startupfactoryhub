// @ts-nocheck -- Imagine Studio v2
/**
 * The Manager's console — Shift Mode (founder directive 2026-10-25).
 * Give the Manager a goal, press Start Shift, and the company works it as
 * an assembly line: per-agent queues planned up front, specialists in
 * parallel, Manager-verified deliverables, and an Archivist-compiled
 * report (PDF / Markdown / Word) at the end. Soft stop freezes dispatch
 * so the plan can change course; hard stop halts everything at once.
 */
import { useEffect, useReducer, useState } from "react";
import { X, Play, PauseCircle, OctagonX, FileText, Download, Trash2, RotateCcw, Briefcase, ChevronDown, Loader2, RefreshCw, MessageSquare, ClipboardList, Users, UserPlus, UserX, Wand2 } from "lucide-react";
import { jsPDF } from "jspdf";
import type { ShiftEngine, ShiftState, ShiftTask, TeamRole } from "@/imagine-studio/lib/shiftEngine";
import { AgentChat } from "@/imagine-studio/components/office/AgentChat";
import { AccuracyChart, downloadHtml, reportToHtml } from "@/imagine-studio/components/office/ReportCharts";
import { buildingRosterRows } from "@/imagine-studio/lib/floors";

const STATUS_STYLE: Record<string, string> = {
  queued: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  running: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  review: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  done: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  error: "bg-red-500/15 text-red-600 dark:text-red-400",
  cancelled: "bg-zinc-500/15 text-zinc-500",
};

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function downloadPdf(title: string, md: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  for (const line of doc.splitTextToSize(title, width)) { doc.text(line, margin, y); y += 22; }
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const clean = md.replace(/^#{1,6}\s+/gm, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/`{1,3}/g, "");
  for (const para of clean.split(/\n/)) {
    if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
    if (!para.trim()) { y += 7; continue; }
    for (const line of doc.splitTextToSize(para, width)) {
      if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 14;
    }
  }
  doc.save(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}.pdf`);
}

function TaskRow({ task, shift, expanded, onToggle, engine, team }: { task: ShiftTask; shift: ShiftState; expanded: boolean; onToggle: () => void; engine: ShiftEngine; team: TeamRole[] }) {
  const editable = shift.status === "soft" && (task.status === "queued" || task.status === "error");
  return (
    <div className="rounded-lg border border-border/70 bg-background/60">
      <button onClick={onToggle} className="flex w-full items-center gap-2 px-3 py-2 text-left">
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[task.status]}`}>{task.status}</span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium">{task.title}</span>
        {task.attempts > 0 && <span className="shrink-0 text-[10px] text-muted-foreground">rev {task.attempts}</span>}
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-border/60 px-3 py-2.5">
          <p className="text-xs leading-relaxed text-muted-foreground">{task.detail}</p>
          {task.feedback && <p className="rounded-md bg-violet-500/10 px-2 py-1.5 text-[11px] leading-relaxed">Manager feedback: {task.feedback}</p>}
          {task.error && <p className="rounded-md bg-red-500/10 px-2 py-1.5 text-[11px] leading-relaxed text-red-600 dark:text-red-400">{task.error}</p>}
          {task.result && (
            <div className="max-h-96 overflow-y-auto overscroll-contain whitespace-pre-wrap rounded-md bg-muted/50 px-3 py-2 text-xs leading-relaxed">{task.result}</div>
          )}
          {editable && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <select
                value={task.botKey}
                onChange={(e) => engine.reassignTask(task.id, e.target.value)}
                className="h-7 rounded-md border border-border bg-background px-1.5 text-[11px]"
              >
                {team.map((r) => <option key={r.key} value={r.key}>{r.name} — {r.title}</option>)}
              </select>
              {task.status === "error" && (
                <button onClick={() => engine.retryTask(task.id)} className="flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] hover:bg-muted"><RotateCcw className="h-3 w-3" />Retry</button>
              )}
              <button onClick={() => engine.removeTask(task.id)} className="flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] text-destructive hover:bg-muted"><Trash2 className="h-3 w-3" />Remove</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface TeamTools {
  bots: { key: string; name: string; duty: string }[];
  create: (x: { name: string; duty: string; prompt: string }) => Promise<void>;
  reset: (botKey: string, prompt: string) => Promise<void>;
  resetAll: (prompt: string) => Promise<string>;
  /** Fire & replace (the 94% law): erases the agent and generates a new
   * one in its seat. Queues until the shift ends when one is running. */
  fire?: (botKey: string) => Promise<{ queued: boolean }>;
}

export function ShiftPanel({ engine, team, company, floorLabel, floorKey, floorId, archivistLabel, managerChatKey, teamTools, signedIn, onClose }: { engine: ShiftEngine; team: TeamRole[]; company: string; floorLabel: string; floorKey?: string; floorId?: number; archivistLabel: string; managerChatKey: string; teamTools: TeamTools; signedIn: boolean; onClose: () => void }) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => engine.subscribe(force), []);
  const shift = engine.getState();
  const [goalDraft, setGoalDraft] = useState("");
  const [goalTouched, setGoalTouched] = useState(false);
  const [confirmHard, setConfirmHard] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "shift" | "team">("chat");
  const [newName, setNewName] = useState("");
  const [newDuty, setNewDuty] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [resetKey, setResetKey] = useState("");
  const [resetPrompt, setResetPrompt] = useState("");
  const [fireKey, setFireKey] = useState("");
  const [confirmFire, setConfirmFire] = useState(false);
  const [resetAllPrompt, setResetAllPrompt] = useState("");
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [teamNote, setTeamNote] = useState("");
  const [teamErr, setTeamErr] = useState("");
  const [lastUserMsg, setLastUserMsg] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const goal = goalTouched ? goalDraft : (shift?.goal ?? goalDraft);
  const done = shift?.tasks.filter((t) => t.status === "done").length ?? 0;
  const total = shift?.tasks.length ?? 0;
  const active = shift && (shift.status === "running" || shift.status === "soft" || shift.status === "planning");

  const start = async (explicit?: string) => {
    const g = (explicit ?? goal).trim();
    if (!g) return;
    setBusy("start"); setErr("");
    try { await engine.startShift(g); setGoalTouched(false); }
    catch (e: any) { setErr(e?.message || "Could not start the shift."); }
    setBusy("");
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background text-foreground">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFD166]/20 text-[#b8860b] dark:text-[#FFD166]"><Briefcase className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">Manager — Shift Control · {floorLabel} · {company}</div>
          <div className="truncate text-[11px] text-muted-foreground">The Manager plans, assigns, verifies. Specialists work in parallel, handing finished work down the line.</div>
        </div>
        {shift && <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${shift.status === "running" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : shift.status === "soft" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : shift.status === "hard" ? "bg-red-500/15 text-red-600 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>{shift.status === "soft" ? "soft-stopped" : shift.status}</span>}
        <button onClick={onClose} className="shrink-0 rounded-full p-1.5 hover:bg-muted" aria-label="Close shift control"><X className="h-5 w-5" /></button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-4 py-2">
        <button onClick={() => setTab("chat")} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ${tab === "chat" ? "bg-emerald-500 text-white" : "border border-border hover:bg-muted"}`}><MessageSquare className="h-3.5 w-3.5" /> Chat with the Manager</button>
        <button onClick={() => setTab("shift")} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ${tab === "shift" ? "bg-emerald-500 text-white" : "border border-border hover:bg-muted"}`}><ClipboardList className="h-3.5 w-3.5" /> Shift &amp; team</button>
        <button onClick={() => setTab("team")} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ${tab === "team" ? "bg-emerald-500 text-white" : "border border-border hover:bg-muted"}`}><Users className="h-3.5 w-3.5" /> Team tools</button>
      </div>

      {tab === "chat" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {lastUserMsg && !active && (
            <button
              onClick={() => { void start(lastUserMsg); setTab("shift"); }}
              className="mx-4 mt-3 flex shrink-0 items-center gap-2 rounded-full bg-[#FFD166] px-4 py-2 text-left text-xs font-semibold text-[#5b4300]"
            >
              <Play className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">Start a shift with this goal: “{lastUserMsg}”</span>
            </button>
          )}
          <div className="min-h-0 flex-1">
            <AgentChat
              name="Manager"
              onSend={(text) => engine.chatWithManager(text)}
              emptyText={<>Talk to the Manager — ask him anything, brief him on the company, or describe the work. When you&apos;re ready, turn your last message into a full shift with the gold button above: he&apos;ll plan it, assign the specialists, and verify every deliverable.</>}
              placeholder="Message the Manager…"
              disabledNote={!signedIn ? "Sign in to talk to the Manager — he works through your Agents account." : null}
              persistKey={managerChatKey}
              onUserMessage={setLastUserMsg}
            />
          </div>
        </div>
      ) : tab === "shift" ? (
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          {!signedIn && <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">Sign in to run a shift — the Manager and the team work through your Agents account.</p>}

          <div className="rounded-xl border border-border p-3.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Company goal for this shift</label>
            <textarea
              value={goal}
              onChange={(e) => { setGoalDraft(e.target.value); setGoalTouched(true); }}
              rows={3}
              placeholder="e.g. Produce a complete launch package for the new founder tier: market analysis, pricing table, landing page copy, email sequence and a risk review."
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-base leading-relaxed"
            />
            {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {!active && (
                <button onClick={() => void start()} disabled={!signedIn || busy === "start" || !goal.trim()} className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950 disabled:opacity-50">
                  {busy === "start" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Start Shift
                </button>
              )}
              {shift?.status === "running" && (
                <button onClick={() => engine.softStop()} className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-amber-950"><PauseCircle className="h-4 w-4" /> Soft stop — change plans</button>
              )}
              {shift?.status === "soft" && (
                <>
                  <button onClick={() => engine.resume()} className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950"><Play className="h-4 w-4" /> Resume shift</button>
                  <button onClick={() => { void engine.replan(goal.trim() || shift.goal); setGoalTouched(false); }} className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-muted"><RefreshCw className="h-4 w-4" /> Replan with this goal</button>
                </>
              )}
              {active && (
                confirmHard ? (
                  <button onClick={() => { engine.hardStop(); setConfirmHard(false); }} className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white"><OctagonX className="h-4 w-4" /> Confirm HARD STOP — halt everything</button>
                ) : (
                  <button onClick={() => setConfirmHard(true)} className="flex items-center gap-1.5 rounded-full border border-red-500/50 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10"><OctagonX className="h-4 w-4" /> Hard stop</button>
                )
              )}
            </div>
            {total > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-muted-foreground"><span>{done} of {total} tasks approved by the Manager</span><span>{total ? Math.round((done / total) * 100) : 0}%</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
              </div>
            )}
            <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
              Soft stop: the Manager sends no new tasks — in-flight work lands, then you can edit the goal, remove or reassign queued tasks, and resume on the new course. Hard stop: everything halts at once and in-flight results are discarded. The shift runs while this office is open; closing the tab pauses it.
            </p>
          </div>

          {shift && total > 0 && (
            <div className="space-y-3">
              {team.filter((r) => shift.tasks.some((t) => t.botKey === r.key)).map((r) => (
                <div key={r.key} className="rounded-xl border border-border p-3.5">
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{r.name}</span>
                    <span className="text-[11px] text-muted-foreground">{r.title} · {r.dept}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">{shift.tasks.filter((t) => t.botKey === r.key && t.status === "done").length}/{shift.tasks.filter((t) => t.botKey === r.key).length} done</span>
                  </div>
                  <div className="space-y-1.5">
                    {shift.tasks.filter((t) => t.botKey === r.key).map((t) => (
                      <TaskRow key={t.id} task={t} shift={shift} expanded={expandedId === t.id} onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)} engine={engine} team={team} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {shift && done > 0 && (
            <div className="rounded-xl border border-border p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm font-semibold"><FileText className="h-4 w-4" /> Shift report</span>
                <span className="text-[11px] text-muted-foreground">Compiled by the {archivistLabel} from every approved deliverable</span>
                <span className="ml-auto flex gap-1.5">
                  {!shift.report && <button onClick={() => void engine.buildReport()} disabled={shift.reportBusy} className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium hover:bg-muted disabled:opacity-50">{shift.reportBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} {shift.reportBusy ? "Compiling…" : "Build report"}</button>}
                  {shift.report && (
                    <>
                      <button onClick={() => downloadPdf("Shift Report", shift.report || "")} className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground"><Download className="h-3.5 w-3.5" /> PDF</button>
                      <button onClick={() => download("shift-report.md", shift.report || "", "text/markdown")} className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium hover:bg-muted"><Download className="h-3.5 w-3.5" /> .md</button>
                      <button onClick={() => download("shift-report.doc", `<html><body><pre style="font-family:Georgia,serif;white-space:pre-wrap">${(shift.report || "").replace(/</g, "&lt;")}</pre></body></html>`, "application/msword")} className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium hover:bg-muted"><Download className="h-3.5 w-3.5" /> .doc</button>
                      <button onClick={() => downloadHtml("shift-report-wall-street.html", reportToHtml({ company, floorId: floorId ?? 0, goal: shift.goal, at: Date.now(), reportMd: shift.report || "", rows: buildingRosterRows().filter((r) => !floorKey || r.floorKey === floorKey) }))} className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium hover:bg-muted"><Download className="h-3.5 w-3.5" /> Wall Street HTML</button>
                      <button onClick={() => void engine.buildReport()} disabled={shift.reportBusy} className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium hover:bg-muted disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" /> Rebuild</button>
                    </>
                  )}
                </span>
              </div>
              {shift.report && floorKey && (
                <div className="mt-3 rounded-lg bg-muted/40 px-3.5 py-3 text-foreground">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Team accuracy — computed from the review ledger</div>
                  <AccuracyChart rows={buildingRosterRows().filter((r) => r.floorKey === floorKey)} />
                </div>
              )}
              {shift.report && <div className="mt-3 max-h-[28rem] overflow-y-auto overscroll-contain whitespace-pre-wrap rounded-lg bg-muted/50 px-3.5 py-3 text-xs leading-relaxed">{shift.report}</div>}
            </div>
          )}

          {shift && shift.log.length > 0 && (
            <div className="rounded-xl border border-border p-3.5">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Manager's log</div>
              <div className="max-h-56 space-y-1 overflow-y-auto overscroll-contain">
                {[...shift.log].reverse().map((l, i) => (
                  <div key={i} className="flex gap-2 text-[11px] leading-relaxed"><span className="shrink-0 text-muted-foreground">{new Date(l.t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}</span><span>{l.text}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-4">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          {!signedIn && <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">Sign in to use the team tools — agents are created and reset through your Agents account.</p>}
          {teamNote && <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs">{teamNote}</p>}
          {teamErr && <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">{teamErr}</p>}

          <div className="rounded-xl border border-border p-3.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold"><UserPlus className="h-4 w-4" /> Create a new agent on this floor</div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">The Manager builds the team this floor needs. A new agent appears standing by the windows, joins the Manager's team for shift planning, and gets its own agent in your Agents account.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name — e.g. Prospector" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base" />
              <input value={newDuty} onChange={(e) => setNewDuty(e.target.value)} placeholder="Role — e.g. Hunts new contractor partners" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base" />
            </div>
            <textarea value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} rows={4} placeholder="Role prompt — who this agent is, what it owns, how it works, what it hands back. This prompt IS the agent's role and memory." className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-base leading-relaxed" />
            <button
              disabled={!signedIn || busy === "create" || !newName.trim() || !newPrompt.trim()}
              onClick={async () => { setBusy("create"); setTeamErr(""); setTeamNote(""); try { await teamTools.create({ name: newName.trim(), duty: newDuty.trim(), prompt: newPrompt.trim() }); setTeamNote(`${newName.trim()} joined ${floorLabel} — find them by the windows. They are on the Manager's team from the next plan on.`); setNewName(""); setNewDuty(""); setNewPrompt(""); } catch (e: any) { setTeamErr(e?.message || "Could not create the agent."); } setBusy(""); }}
              className="mt-3 flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950 disabled:opacity-50"
            >{busy === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Create agent</button>
          </div>

          <div className="rounded-xl border border-border p-3.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold"><Wand2 className="h-4 w-4" /> Reset one agent with a new role</div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">The agent keeps its name and its place on this floor; its role prompt — its instructions, which are its memory — is replaced with the new one below.</p>
            <select value={resetKey} onChange={(e) => setResetKey(e.target.value)} className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-base">
              <option value="">Choose an agent on this floor…</option>
              {teamTools.bots.map((b) => <option key={b.key} value={b.key}>{b.name} — {b.duty}</option>)}
            </select>
            <textarea value={resetPrompt} onChange={(e) => setResetPrompt(e.target.value)} rows={4} placeholder="New role prompt for the chosen agent…" className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-base leading-relaxed" />
            <button
              disabled={!signedIn || busy === "reset" || !resetKey || !resetPrompt.trim()}
              onClick={async () => { setBusy("reset"); setTeamErr(""); setTeamNote(""); try { await teamTools.reset(resetKey, resetPrompt.trim()); const b = teamTools.bots.find((x) => x.key === resetKey); setTeamNote(`${b?.name || "Agent"} was reset — new role, memory cleared. It works under the new role from its next task on.`); setResetPrompt(""); } catch (e: any) { setTeamErr(e?.message || "Could not reset that agent."); } setBusy(""); }}
              className="mt-3 flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >{busy === "reset" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Reset this agent</button>
          </div>

          {teamTools.fire && (
            <div className="rounded-xl border border-red-500/30 p-3.5">
              <div className="flex items-center gap-1.5 text-sm font-semibold"><UserX className="h-4 w-4" /> Fire &amp; replace an agent</div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Firing ERASES the agent — its memory, its chats, its history — and a brand-new agent (new name, new persona, clean slate) takes the seat and the role. This is the enforcement behind the 94% accuracy law: scores live in the CEO and Chairman dashboards. If a shift is running, the replacement lands the moment it ends, so the company never stops.</p>
              <select value={fireKey} onChange={(e) => { setFireKey(e.target.value); setConfirmFire(false); }} className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-base">
                <option value="">Choose who to fire…</option>
                {teamTools.bots.map((b) => <option key={b.key} value={b.key}>{b.name} — {b.duty}</option>)}
              </select>
              {confirmFire ? (
                <button
                  disabled={!signedIn || busy === "fire" || !fireKey}
                  onClick={async () => { setBusy("fire"); setTeamErr(""); setTeamNote(""); try { const r = await teamTools.fire!(fireKey); const b = teamTools.bots.find((x) => x.key === fireKey); setTeamNote(r.queued ? `${b?.name || "That agent"} will be replaced the moment the current shift ends.` : `${b?.name || "That agent"} was fired and erased. A new agent has taken the seat — meet them on the floor.`); setFireKey(""); } catch (e: any) { setTeamErr(e?.message || "The firing did not finish."); } setBusy(""); setConfirmFire(false); }}
                  className="mt-3 flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >{busy === "fire" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />} Confirm — fire and erase this agent</button>
              ) : (
                <button disabled={!signedIn || !fireKey} onClick={() => setConfirmFire(true)} className="mt-3 flex items-center gap-1.5 rounded-full border border-red-500/50 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-50"><UserX className="h-4 w-4" /> Fire this agent…</button>
              )}
            </div>
          )}

          <div className="rounded-xl border border-red-500/30 p-3.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold"><Users className="h-4 w-4" /> Reset ALL agents on this floor</div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Every agent on {floorLabel} — the whole team, the executives and the Manager — gets the new role below and a cleared memory. Use placeholders: {"{name}"}, {"{title}"} and {"{company}"} are filled in per agent. Agents on other floors are not touched.</p>
            <textarea value={resetAllPrompt} onChange={(e) => setResetAllPrompt(e.target.value)} rows={4} placeholder={"e.g. You are {name}, {title} at {company}. New directive: …"} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-base leading-relaxed" />
            {confirmResetAll ? (
              <button
                disabled={!signedIn || busy === "resetAll" || !resetAllPrompt.trim()}
                onClick={async () => { setBusy("resetAll"); setTeamErr(""); setTeamNote(""); try { const msg = await teamTools.resetAll(resetAllPrompt.trim()); setTeamNote(msg); setResetAllPrompt(""); } catch (e: any) { setTeamErr(e?.message || "The reset-all did not finish."); } setBusy(""); setConfirmResetAll(false); }}
                className="mt-3 flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >{busy === "resetAll" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Confirm — reset every agent on this floor</button>
            ) : (
              <button disabled={!signedIn || !resetAllPrompt.trim()} onClick={() => setConfirmResetAll(true)} className="mt-3 flex items-center gap-1.5 rounded-full border border-red-500/50 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-50"><Users className="h-4 w-4" /> Reset all agents on this floor…</button>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
