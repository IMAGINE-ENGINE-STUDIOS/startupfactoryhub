import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircuitBoard,
  FolderOpen,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import Canvas from "./prototype/Canvas";
import type { DesignDoc } from "./prototype/registry";
import { validateDesign } from "./prototype/validate";

/*
 * Prototype Studio — SFH's connected-device prototyping tool.
 * Design a hardware prototype on a visual canvas, watch its digital
 * twin respond, export the bill of materials, and take it to
 * manufacture — all inside Startup Factory Hub.
 *
 * Job 1 (shell): projects live in the member's account
 * (public.prototype_projects, owner-only RLS). The canvas document is
 * { components: [], connections: [] } — the component library and the
 * twin plug into this same document in the following jobs.
 */

export type ProtoDesign = DesignDoc;

interface ProtoProject {
  id: string;
  name: string;
  design: ProtoDesign;
  created_at: string;
  updated_at: string;
}

const EMPTY_DESIGN: ProtoDesign = { components: [], connections: [] };

// prototype_projects is newer than the generated types; query it
// through a narrow cast until the types are regenerated.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const projectsTable = () => (supabase as any).from("prototype_projects");

export default function PrototypeStudio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProtoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [current, setCurrent] = useState<ProtoProject | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await projectsTable()
      .select("id, name, design, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) {
      toast({ title: "Couldn't load your projects", description: error.message, variant: "destructive" });
    } else {
      setProjects((data ?? []) as ProtoProject[]);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    const name = newName.trim();
    if (!name || !user) return;
    setCreating(true);
    const { data, error } = await projectsTable()
      .insert({ user_id: user.id, name, design: EMPTY_DESIGN })
      .select("id, name, design, created_at, updated_at")
      .single();
    setCreating(false);
    if (error || !data) {
      toast({ title: "Couldn't create the project", description: error?.message || "Try again.", variant: "destructive" });
      return;
    }
    setNewName("");
    setProjects((prev) => [data as ProtoProject, ...prev]);
    setCurrent(data as ProtoProject);
    setSavedAt(null);
  };

  const save = async () => {
    if (!current) return;
    setSaving(true);
    const { error } = await projectsTable()
      .update({ name: current.name, design: current.design, updated_at: new Date().toISOString() })
      .eq("id", current.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    const t = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setSavedAt(t);
    setProjects((prev) => prev.map((p) => (p.id === current.id ? { ...current, updated_at: new Date().toISOString() } : p)));
  };

  const remove = async (p: ProtoProject) => {
    const { error } = await projectsTable().delete().eq("id", p.id);
    if (error) {
      toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
      return;
    }
    setProjects((prev) => prev.filter((x) => x.id !== p.id));
    if (current?.id === p.id) setCurrent(null);
  };

  /* ── Workspace (an open project) ─────────────────────────── */
  if (current) {
    const validity = validateDesign(current.design);
    return (
      <div className="h-full flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { setCurrent(null); load(); }}>
            <ArrowLeft className="h-4 w-4" /> Projects
          </Button>
          <Input
            value={current.name}
            onChange={(e) => setCurrent({ ...current, name: e.target.value })}
            className="h-9 max-w-xs font-medium"
            aria-label="Project name"
          />
          <Button size="sm" className="gap-1.5" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {validity.valid ? "Save design" : "Save draft"}
          </Button>
          {savedAt && <span className="text-xs text-emerald-500">Saved {savedAt} — in your account</span>}
          <span className="text-xs text-muted-foreground ml-auto">
            {current.design.components.length} components · {current.design.connections.length} connections
          </span>
        </div>

        {/* Validity — an invalid design saves as a draft, never as valid. */}
        {current.design.components.length > 0 && (
          <div className={`rounded-xl border px-3 py-2 text-xs flex flex-col gap-1 ${
            validity.valid ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"
          }`}>
            <p className="flex items-center gap-1.5 font-medium">
              {validity.valid
                ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Valid design — safe to build, ready for the twin and the parts list.</>
                : <><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Draft — {validity.errors.length} thing{validity.errors.length === 1 ? "" : "s"} to fix before this design counts as valid:</>}
            </p>
            {validity.errors.slice(0, 3).map((e, i) => <p key={i} className="text-muted-foreground">• {e.message}</p>)}
            {validity.warnings.slice(0, 2).map((w, i) => <p key={`w${i}`} className="text-amber-500/90">• {w.message}</p>)}
          </div>
        )}

        <div className="flex-1 min-h-0">
          <Canvas
            design={current.design}
            onChange={(d) => { setCurrent({ ...current, design: d }); setSavedAt(null); }}
          />
        </div>
      </div>
    );
  }

  /* ── Project home ────────────────────────────────────────── */
  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="max-w-3xl mx-auto space-y-5 py-2">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CircuitBoard className="h-5 w-5 text-sky-400" /> Your prototype projects
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Projects are saved to your account — pick up any design, on any device, right where you left it.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name your prototype — e.g. Smart greenhouse monitor"
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
          <Button onClick={create} disabled={creating || !newName.trim()} className="gap-1.5 shrink-0">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            New project
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            None yet — your first prototype is one name away.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-snug">{p.name}</p>
                  <button
                    onClick={() => remove(p)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(p.design?.components?.length ?? 0)} components · updated{" "}
                  {new Date(p.updated_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                </p>
                <Button size="sm" variant="outline" className="gap-1.5 mt-auto self-start" onClick={() => { setCurrent(p); setSavedAt(null); }}>
                  <FolderOpen className="h-3.5 w-3.5" /> Open
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
