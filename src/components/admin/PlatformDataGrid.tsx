// Admin "Platform data" grid: lists the Startup Factory Hub tables and lets admins
// read, edit, add and delete rows. Uses the admin's own sign-in, so the tables'
// security rules decide what can be changed.
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, RefreshCw, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

type Col = { name: string; type: string; pk: boolean; required: boolean };
type Table = { name: string; columns: Col[] };
type Row = Record<string, unknown>;

const URL_ = import.meta.env.VITE_SUPABASE_URL as string;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const PAGE = 50;

const show = (v: unknown) => (v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));
function parse(raw: string, col: Col): unknown {
  if (raw === "") return null;
  if (/integer|bigint|smallint|numeric|double|real/.test(col.type)) { const n = Number(raw); return Number.isFinite(n) ? n : raw; }
  if (col.type === "boolean") return raw === "true";
  if (/json/.test(col.type)) { try { return JSON.parse(raw); } catch { return raw; } }
  return raw;
}

export default function PlatformDataGrid() {
  const [tables, setTables] = useState<Table[] | null>(null);
  const [name, setName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState<{ i: number; col: string; value: string } | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const r = await fetch(URL_ + "/rest/v1/", { headers: { apikey: KEY, Authorization: "Bearer " + (s.session?.access_token || KEY), Accept: "application/openapi+json" } });
      const j = await r.json().catch(() => ({}));
      const d = (j && j.definitions) || {};
      const list: Table[] = Object.keys(d).sort().map((t) => {
        const p = d[t].properties || {}, req: string[] = d[t].required || [];
        return { name: t, columns: Object.keys(p).map((k) => ({ name: k, type: p[k].format || p[k].type || "", pk: /<pk\/>/.test(p[k].description || ""), required: req.includes(k) })) };
      });
      setTables(list);
      if (list.length && !name) setName(list[0].name);
    })().catch(() => setTables([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const table = useMemo(() => tables?.find((t) => t.name === name), [tables, name]);
  const pk = table?.columns.find((c) => c.pk)?.name || (table?.columns.some((c) => c.name === "id") ? "id" : "");

  const load = async () => {
    if (!table) return;
    setLoading(true); setEdit(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase as any).from(table.name).select("*").range(page * PAGE, page * PAGE + PAGE - 1);
    if (table.columns.some((c) => c.name === "created_at")) q = q.order("created_at", { ascending: false });
    const { data, error } = await q;
    setLoading(false);
    if (error) { toast.error(error.message); setRows([]); return; }
    setRows(data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [table, page]);

  const save = async () => {
    if (!edit || !table) return;
    const row = rows[edit.i], col = table.columns.find((c) => c.name === edit.col)!;
    if (!pk) { toast.error("This table has no id column, so rows can't be edited here."); return; }
    const value = parse(edit.value, col);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from(table.name).update({ [edit.col]: value }).eq(pk, row[pk]).select();
    if (error) return toast.error(error.message);
    if (!data?.length) return toast.error("Nothing was saved. The table's security rules blocked this change.");
    setRows((r) => r.map((x, i) => (i === edit.i ? data[0] : x)));
    setEdit(null); toast.success("Saved");
  };

  const addRow = async () => {
    if (!table) return;
    const rec: Row = {};
    for (const c of table.columns.filter((c) => c.required && !c.pk)) {
      const v = prompt(`Value for ${c.name} (${c.type})`);
      if (v === null) return;
      rec[c.name] = parse(v, c);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from(table.name).insert(rec).select();
    if (error) return toast.error(error.message);
    setRows((r) => [...(data || []), ...r]); toast.success("Row added");
  };

  const remove = async (i: number) => {
    if (!table || !pk) return;
    if (!confirm("Delete this row from the live table?")) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from(table.name).delete().eq(pk, rows[i][pk]).select();
    if (error) return toast.error(error.message);
    if (!data?.length) return toast.error("Nothing was deleted. The table's security rules blocked this.");
    setRows((r) => r.filter((_, j) => j !== i)); toast.success("Deleted");
  };

  const shown = filter ? rows.filter((r) => Object.values(r).some((v) => show(v).toLowerCase().includes(filter.toLowerCase()))) : rows;

  if (tables === null) return <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  return (
    <section className="tech-card border-0 p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={name} onValueChange={(v) => { setName(v); setPage(0); }}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Choose a table" /></SelectTrigger>
          <SelectContent className="bg-background backdrop-blur-none max-h-80">
            {tables.map((t) => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
          <Input className="pl-8 w-48" placeholder="Filter this page" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <Button size="sm" variant="secondary" onClick={load}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
        <Button size="sm" onClick={addRow}><Plus className="w-4 h-4 mr-1" />Add row</Button>
        <span className="text-xs text-muted-foreground ml-auto">Page {page + 1} · {rows.length} rows</span>
        <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
        <Button size="sm" variant="ghost" disabled={rows.length < PAGE} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
      <p className="text-xs text-muted-foreground">Click a cell to edit it. Changes save to the live table right away.</p>
      <div className="overflow-auto max-h-[60vh] rounded-lg border border-border">
        {loading ? <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin" /></div> : (
          <table className="w-full text-xs">
            <thead className="bg-muted sticky top-0">
              <tr>{table?.columns.map((c) => <th key={c.name} className="text-left px-2 py-2 font-medium whitespace-nowrap">{c.name}</th>)}<th /></tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const i = rows.indexOf(r);
                return (
                  <tr key={String(r[pk] ?? i)} className="border-t border-border hover:bg-muted/40">
                    {table?.columns.map((c) => (
                      <td key={c.name} className="px-2 py-1 align-top">
                        {edit && edit.i === i && edit.col === c.name ? (
                          <div className="flex gap-1">
                            <Input autoFocus className="h-7 text-xs w-48" value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEdit(null); }} />
                            <Button size="sm" className="h-7" onClick={save}>Save</Button>
                          </div>
                        ) : (
                          <button className="text-left truncate max-w-[220px] block w-full" disabled={c.pk} onClick={() => setEdit({ i, col: c.name, value: show(r[c.name]) })}>{show(r[c.name]) || <span className="text-muted-foreground">-</span>}</button>
                        )}
                      </td>
                    ))}
                    <td className="px-2"><Button size="icon" variant="ghost" aria-label="Delete row" onClick={() => remove(i)}><Trash2 className="w-4 h-4" /></Button></td>
                  </tr>
                );
              })}
              {!shown.length && <tr><td colSpan={99} className="p-6 text-center text-muted-foreground">No rows</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
