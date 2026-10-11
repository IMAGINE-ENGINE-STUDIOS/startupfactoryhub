import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";

/* Edit these constants to fit the business */
const CRM = { title: "Sales pipeline", currency: "$" };
const STAGES = ["Lead", "Qualified", "Proposal", "Won", "Lost"];

type Deal = { id?: string; name: string; company: string; value: number; stage: string; email?: string };
const db = (window as any).IE?.db?.("deals");

export default function App() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Deal | null>(null);

  async function load() {
    try { setDeals(db ? await db.list({ order: "created_at", desc: true }) : []); } finally { setLoading(false); }
  }
  useEffect(() => { load(); return db?.subscribe ? db.subscribe((rows: Deal[]) => setDeals(rows)) : undefined; }, []);

  const shown = useMemo(() => deals.filter((d) => (d.name + d.company).toLowerCase().includes(q.toLowerCase())), [deals, q]);
  const total = (s: string) => shown.filter((d) => d.stage === s).reduce((a, d) => a + Number(d.value || 0), 0);

  async function save(d: Deal) {
    if (!db) return;
    if (d.id) await db.update(d.id, d); else await db.insert(d);
    setEdit(null); load();
  }
  async function remove(id?: string) { if (db && id) { await db.remove(id); load(); } }
  async function move(d: Deal, stage: string) { if (db && d.id) { await db.update(d.id, { stage }); load(); } }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{CRM.title}</h1>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" /><Input className="pl-9" placeholder="Search deals" value={q} onChange={(e: any) => setQ(e.target.value)} /></div>
          <Button onClick={() => setEdit({ name: "", company: "", value: 0, stage: STAGES[0] })}><Plus className="h-4 w-4" />New deal</Button>
        </div>
      </div>
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {STAGES.map((s) => (
            <Card key={s}>
              <CardHeader><CardTitle className="flex items-center justify-between text-sm">{s}<Badge>{CRM.currency}{total(s).toLocaleString()}</Badge></CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {shown.filter((d) => d.stage === s).map((d) => (
                  <div key={d.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm">
                    <button className="w-full text-left" onClick={() => setEdit(d)}><div className="font-medium">{d.name}</div><div className="text-xs text-zinc-400">{d.company} · {CRM.currency}{Number(d.value).toLocaleString()}</div></button>
                    <div className="mt-2 flex items-center gap-2"><Select value={d.stage} options={STAGES} onValueChange={(v: string) => move(d, v)} className="h-8 text-xs" /><Button size="icon" variant="ghost" onClick={() => remove(d.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button></div>
                  </div>
                ))}
                {!shown.some((d) => d.stage === s) && <p className="text-xs text-zinc-600">No deals</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={() => setEdit(null)} title={edit?.id ? "Edit deal" : "New deal"}>
        {edit && <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (edit.name.trim()) save(edit); }}>
          <div><Label>Deal name</Label><Input required value={edit.name} onChange={(e: any) => setEdit({ ...edit, name: e.target.value })} /></div>
          <div><Label>Company</Label><Input value={edit.company} onChange={(e: any) => setEdit({ ...edit, company: e.target.value })} /></div>
          <div><Label>Email</Label><Input type="email" value={edit.email || ""} onChange={(e: any) => setEdit({ ...edit, email: e.target.value })} /></div>
          <div><Label>Value</Label><Input type="number" min={0} value={edit.value} onChange={(e: any) => setEdit({ ...edit, value: +e.target.value })} /></div>
          <div><Label>Stage</Label><Select value={edit.stage} options={STAGES} onValueChange={(v: string) => setEdit({ ...edit, stage: v })} /></div>
          <Button type="submit" className="w-full">Save</Button>
        </form>}
      </Dialog>
    </div>
  );
}
