import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

/* Edit STEPS (or ask Genius AI) to change the questions. Submissions save through IE.db. */
const APP = { name: "Application", collection: "wizard_submissions", done: "Thanks! Your application was received." };
type Field = { key: string; label: string; type?: "text" | "email" | "textarea" | "select" | "number"; options?: string[]; required?: boolean };
const STEPS: { title: string; fields: Field[] }[] = [
  { title: "About you", fields: [{ key: "name", label: "Full name", required: true }, { key: "email", label: "Email", type: "email", required: true }] },
  { title: "Your project", fields: [{ key: "company", label: "Company or project name", required: true }, { key: "stage", label: "Stage", type: "select", options: ["Idea", "MVP", "Revenue", "Scaling"], required: true }] },
  { title: "Details", fields: [{ key: "description", label: "What are you building?", type: "textarea", required: true }, { key: "team", label: "Team size", type: "number" }] },
];

function invalid(f: Field, v: string) {
  if (f.required && !String(v || "").trim()) return "Required";
  if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email";
  return "";
}

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const last = step === STEPS.length;
  const cur = STEPS[step];
  const errors = cur ? Object.fromEntries(cur.fields.map((f) => [f.key, invalid(f, data[f.key])])) : {};
  const ok = Object.values(errors).every((e) => !e);

  function next() { setTouched(true); if (ok) { setTouched(false); setStep((s) => s + 1); } }
  async function submit() {
    setState("saving");
    try { const t = (window as any).IE?.db?.(APP.collection); if (t) await t.insert(data); (window as any).IE?.emit?.("formSubmitted", data); setState("done"); }
    catch (e: any) { setErr(e?.message || "Could not submit"); setState("error"); }
  }

  if (state === "done") return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 p-6 text-zinc-100"><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20"><Check className="h-7 w-7 text-emerald-400" /></div><p className="text-lg">{APP.done}</p></motion.div></div>
  );

  const input = "w-full rounded-lg border bg-black/30 px-3 py-2 outline-none focus:border-violet-500";
  return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h1 className="mb-1 text-xl font-bold">{APP.name}</h1>
        <div className="mb-6 flex gap-2">{[...STEPS, { title: "Review" }].map((s, i) => <div key={i} className="flex-1"><div className={"h-1.5 rounded-full " + (i <= step ? "bg-violet-500" : "bg-white/10")} /><div className="mt-1 hidden text-[10px] text-zinc-400 sm:block">{s.title}</div></div>)}</div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            {!last ? cur.fields.map((f) => {
              const e = touched ? errors[f.key] : ""; const cls = input + (e ? " border-rose-500" : " border-white/10");
              const set = (v: string) => setData({ ...data, [f.key]: v });
              return (
                <label key={f.key} className="mb-4 block text-sm">
                  <span className="mb-1 block text-zinc-300">{f.label}{f.required && " *"}</span>
                  {f.type === "textarea" ? <textarea rows={4} className={cls} value={data[f.key] || ""} onChange={(x) => set(x.target.value)} />
                    : f.type === "select" ? <select className={cls} value={data[f.key] || ""} onChange={(x) => set(x.target.value)}><option value="">Choose...</option>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>
                    : <input type={f.type || "text"} className={cls} value={data[f.key] || ""} onChange={(x) => set(x.target.value)} />}
                  {e && <span className="mt-1 block text-xs text-rose-400">{e}</span>}
                </label>
              );
            }) : (
              <dl className="mb-4 space-y-2 text-sm">{STEPS.flatMap((s) => s.fields).map((f) => <div key={f.key} className="flex justify-between gap-4 border-b border-white/5 pb-2"><dt className="text-zinc-400">{f.label}</dt><dd className="text-right">{data[f.key] || "-"}</dd></div>)}</dl>
            )}
          </motion.div>
        </AnimatePresence>
        {state === "error" && <p className="mb-3 text-sm text-rose-400">{err}</p>}
        <div className="flex justify-between">
          <button disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm disabled:opacity-30"><ChevronLeft className="h-4 w-4" />Back</button>
          {last ? <button onClick={submit} disabled={state === "saving"} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium disabled:opacity-50">{state === "saving" ? "Submitting..." : "Submit"}</button>
            : <button onClick={next} className="flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium">Next<ChevronRight className="h-4 w-4" /></button>}
        </div>
      </div>
    </div>
  );
}
