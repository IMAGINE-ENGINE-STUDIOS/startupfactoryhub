import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, X, Trash2, GripVertical } from "lucide-react";

/* Edit these constants (or ask Genius AI) to make this board your own. Cards save through IE.db. */
const APP = { name: "Project Board", collection: "kanban_cards" };
const COLUMNS = ["Backlog", "In progress", "Review", "Done"];
const PRIORITIES = ["Low", "Medium", "High"];

type Card = { id: string; title: string; notes?: string; column: string; priority: string; order: number };
const db = () => (window as any).IE?.db?.(APP.collection);
const tone: Record<string, string> = { Low: "bg-emerald-500/15 text-emerald-300", Medium: "bg-amber-500/15 text-amber-300", High: "bg-rose-500/15 text-rose-300" };

function Editor({ card, onSave, onClose }: { card: Partial<Card>; onSave: (c: Partial<Card>) => void; onClose: () => void }) {
  const [c, setC] = useState(card);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{card.id ? "Edit card" : "New card"}</h2><button onClick={onClose}><X className="h-4 w-4" /></button></div>
        <input autoFocus value={c.title || ""} onChange={(e) => setC({ ...c, title: e.target.value })} placeholder="Title" className="mb-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-violet-500" />
        <textarea value={c.notes || ""} onChange={(e) => setC({ ...c, notes: e.target.value })} placeholder="Notes" rows={3} className="mb-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-violet-500" />
        <div className="mb-4 grid grid-cols-2 gap-2">
          <select value={c.column} onChange={(e) => setC({ ...c, column: e.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">{COLUMNS.map((x) => <option key={x}>{x}</option>)}</select>
          <select value={c.priority} onChange={(e) => setC({ ...c, priority: e.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">{PRIORITIES.map((x) => <option key={x}>{x}</option>)}</select>
        </div>
        <button disabled={!c.title?.trim()} onClick={() => onSave(c)} className="w-full rounded-lg bg-violet-600 py-2 font-medium disabled:opacity-40">Save</button>
      </motion.div>
    </div>
  );
}

export default function Kanban() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Partial<Card> | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  useEffect(() => {
    const t = db(); if (!t) { setLoading(false); return; }
    t.list({ order: "order" }).then((rows: Card[]) => setCards(rows || [])).catch((e: any) => setError(e?.message || "Could not load cards")).finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => cards.filter((c) => !q || (c.title + " " + (c.notes || "")).toLowerCase().includes(q.toLowerCase())), [cards, q]);

  async function save(c: Partial<Card>) {
    const t = db(); setEdit(null);
    try {
      if (c.id) { await t?.update(c.id, c); setCards((cs) => cs.map((x) => (x.id === c.id ? { ...x, ...c } as Card : x))); }
      else { const rec = { title: c.title!, notes: c.notes || "", column: c.column || COLUMNS[0], priority: c.priority || "Medium", order: Date.now() }; const r = t ? await t.insert(rec) : { ...rec, id: String(Date.now()) }; setCards((cs) => [...cs, r]); (window as any).IE?.emit?.("cardAdded", r); }
    } catch (e: any) { setError(e?.message || "Could not save"); }
  }
  async function move(id: string, column: string) {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, column } : c)));
    try { await db()?.update(id, { column }); (window as any).IE?.emit?.("cardMoved", { id, column }); } catch (e: any) { setError(e?.message || "Could not move"); }
  }
  async function remove(id: string) {
    setCards((cs) => cs.filter((c) => c.id !== id));
    try { await db()?.remove(id); } catch (e: any) { setError(e?.message || "Could not delete"); }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 text-zinc-100 md:p-8">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">{APP.name}</h1>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3"><Search className="h-4 w-4 text-zinc-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cards" className="bg-transparent py-2 text-sm outline-none" /></div>
          <button onClick={() => setEdit({ column: COLUMNS[0], priority: "Medium" })} className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 text-sm font-medium"><Plus className="h-4 w-4" />Add card</button>
        </div>
      </header>
      {error && <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>}
      {loading ? <div className="text-zinc-400">Loading board...</div> : (
        <div className="grid gap-4 overflow-x-auto md:grid-cols-4">
          {COLUMNS.map((col) => {
            const list = shown.filter((c) => c.column === col);
            return (
              <section key={col} onDragOver={(e) => { e.preventDefault(); setOver(col); }} onDragLeave={() => setOver(null)} onDrop={() => { if (drag) move(drag, col); setDrag(null); setOver(null); }}
                className={"min-h-[200px] rounded-2xl border p-3 transition " + (over === col ? "border-violet-500 bg-violet-500/5" : "border-white/10 bg-white/[0.03]")}>
                <div className="mb-3 flex items-center justify-between text-sm"><span className="font-semibold">{col}</span><span className="rounded-full bg-white/10 px-2 text-xs">{list.length}</span></div>
                <AnimatePresence>
                  {list.map((c) => (
                    <motion.div layout key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} draggable onDragStart={() => setDrag(c.id)} onClick={() => setEdit(c)}
                      className="group mb-2 cursor-grab rounded-xl border border-white/10 bg-zinc-900 p-3 active:cursor-grabbing">
                      <div className="flex items-start gap-2"><GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" /><div className="min-w-0 flex-1"><div className="text-sm font-medium">{c.title}</div>{c.notes && <div className="mt-1 line-clamp-2 text-xs text-zinc-400">{c.notes}</div>}</div>
                        <button onClick={(e) => { e.stopPropagation(); remove(c.id); }} className="opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4 text-zinc-500" /></button></div>
                      <div className="mt-2 flex items-center justify-between"><span className={"rounded-full px-2 py-0.5 text-[10px] " + tone[c.priority]}>{c.priority}</span>
                        <select value={c.column} onClick={(e) => e.stopPropagation()} onChange={(e) => move(c.id, e.target.value)} className="rounded bg-transparent text-[10px] text-zinc-400 md:hidden">{COLUMNS.map((x) => <option key={x}>{x}</option>)}</select></div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!list.length && <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-500">Drop cards here</div>}
              </section>
            );
          })}
        </div>
      )}
      {edit && <Editor card={edit} onSave={save} onClose={() => setEdit(null)} />}
    </div>
  );
}
