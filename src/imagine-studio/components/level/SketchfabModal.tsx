// @ts-nocheck -- Imagine Studio v2
import { useEffect, useRef, useState } from "react";
import { Search, Loader2, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Model = { uid: string; name: string; author: string; authorUrl: string; url: string; thumbnail: string; faces: number; license: string; animated: boolean };
const POLY = [{ k: 0, l: "Any size" }, { k: 10000, l: "Low" }, { k: 50000, l: "Medium" }, { k: 200000, l: "High" }];
const LIC = [{ k: "", l: "Any license" }, { k: "by", l: "CC-BY" }, { k: "cc0", l: "CC0" }];

async function call(body: any) {
  const { data, error } = await supabase.functions.invoke("sketchfab-proxy", { body });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

/** Sketchfab model library: search downloadable models and spawn them into the level. */
export default function SketchfabModal({ open, onOpenChange, onSpawn }: { open: boolean; onOpenChange: (v: boolean) => void; onSpawn: (file: File, credit: string) => Promise<void> }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [cats, setCats] = useState<{ slug: string; name: string }[]>([]);
  const [poly, setPoly] = useState(50000);
  const [lic, setLic] = useState("");
  const [items, setItems] = useState<Model[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [spawning, setSpawning] = useState<string | null>(null);
  const t = useRef<any>();

  useEffect(() => { if (open && !cats.length) call({ action: "categories" }).then((d) => setCats(d.categories || [])).catch(() => {}); }, [open]);

  const search = async (cursor?: string) => {
    setLoading(true);
    try {
      const d = await call({ action: "search", q, category: cat, maxFaces: poly, license: lic, cursor });
      setItems((cur) => (cursor ? [...cur, ...d.results] : d.results));
      setNext(d.next);
    } catch (e: any) { toast.error(e.message || "Sketchfab search failed"); }
    setLoading(false);
  };
  useEffect(() => { if (!open) return; clearTimeout(t.current); t.current = setTimeout(() => search(), 400); return () => clearTimeout(t.current); }, [open, q, cat, poly, lic]);

  const spawn = async (m: Model) => {
    setSpawning(m.uid);
    try {
      const d = await call({ action: "download", uid: m.uid });
      if (d.format !== "glb") throw new Error("This model only offers a zipped glTF. Try another model.");
      const r = await fetch(d.url);
      if (!r.ok) throw new Error("Download failed");
      const blob = await r.blob();
      const safe = m.name.replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "sketchfab-model";
      await onSpawn(new File([blob], `${safe}.glb`, { type: "model/gltf-binary" }), `${m.name} by ${m.author} (${m.license}) via Sketchfab`);
      toast.success(`Added ${m.name}`);
    } catch (e: any) { toast.error(e.message || "Could not add model"); }
    setSpawning(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col overflow-hidden bg-background backdrop-blur-none">
        <DialogHeader><DialogTitle>Sketchfab model library</DialogTitle></DialogHeader>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search models: car, tree, robot…" className="pl-8" />
          </div>
          <select value={poly} onChange={(e) => setPoly(Number(e.target.value))} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
            {POLY.map((p) => <option key={p.k} value={p.k}>{p.l}</option>)}
          </select>
          <select value={lic} onChange={(e) => setLic(e.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
            {LIC.map((p) => <option key={p.k} value={p.k}>{p.l}</option>)}
          </select>
        </div>
        {cats.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button onClick={() => setCat("")} className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${!cat ? "bg-primary text-primary-foreground border-primary" : "border-border/50"}`}>All</button>
            {cats.map((c) => <button key={c.slug} onClick={() => setCat(c.slug)} className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${cat === c.slug ? "bg-primary text-primary-foreground border-primary" : "border-border/50"}`}>{c.name}</button>)}
          </div>
        )}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && !items.length ? <div className="flex justify-center p-10"><Loader2 className="w-5 h-5 animate-spin" /></div> : items.length === 0 ? <p className="text-sm text-muted-foreground text-center p-10">No downloadable models found.</p> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {items.map((m) => (
                <div key={m.uid} className="rounded-lg border border-border/50 overflow-hidden flex flex-col">
                  <div className="aspect-video bg-muted relative">
                    {m.thumbnail && <img src={m.thumbnail} alt={m.name} loading="lazy" className="w-full h-full object-cover" />}
                    <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-background/80">{m.faces >= 1000 ? `${Math.round(m.faces / 1000)}k` : m.faces} faces</span>
                  </div>
                  <div className="p-2 flex-1 flex flex-col gap-1">
                    <div className="text-xs font-medium truncate" title={m.name}>{m.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{m.author} · {m.license}</div>
                    <div className="flex gap-1 mt-auto pt-1">
                      <Button size="sm" className="h-7 text-[11px] flex-1" disabled={!!spawning} onClick={() => spawn(m)}>
                        {spawning === m.uid ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Download className="w-3 h-3 mr-1" />Add to scene</>}
                      </Button>
                      <a href={m.url} target="_blank" rel="noreferrer" className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border/50" title="View on Sketchfab"><ExternalLink className="w-3 h-3" /></a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {next && <div className="flex justify-center p-3"><Button variant="outline" size="sm" disabled={loading} onClick={() => search(next)}>{loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Load more"}</Button></div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
