/**
 * 3D Studio projects: every project with its levels. A project holds any
 * number of levels (separate or linked by portals); one is the start level.
 * Served at /levels (also inside Imagine Engine with ?embedded=1).
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { syncPlazaLevelToPublished } from "@/imagine-studio/lib/plazaLevel";
import { syncOfficeLevelToPublished } from "@/imagine-studio/lib/officeWorld";
import { resolveLevelWorld } from "@/imagine-studio/lib/worldBindings";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Box, Copy, Flag, Layers, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteLocalLevel, updateLocalLevel } from "@/imagine-studio/lib/localLevels";
import { addLevelToProject, createProject, deleteProject, duplicateProject, levelsOfProject, listProjects, updateProject } from "@/imagine-studio/lib/localProjects";

export default function StudioProjectsPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const projects = useMemo(() => listProjects(), [tick]);
  const refresh = () => setTick((t) => t + 1);
  // Plaza District follows admin accounts to any browser: seed it from the published version.
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user; if (!u) return;
      const { data: admin } = await supabase.rpc("has_role", { _user_id: u.id, _role: "admin" });
      if (!admin) return;
      // Plaza District edit state always mirrors the published version the game plays.
      await syncPlazaLevelToPublished();
      await syncOfficeLevelToPublished();
      refresh();
    });
  }, []);
  const openLevel = (id: string) => navigate(`/imagine-studio/${id}${search}`);
  const startOf = (p: (typeof projects)[number]) => p.levels.find((l) => l.id === p.defaultLevelId) ?? p.levels[0];

  const current = projects.find((p) => p.id === openId);
  if (current) {
    const levels = levelsOfProject(current.id);
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setOpenId(null)}><ArrowLeft className="w-4 h-4 mr-1" />Projects</Button>
            <h1 className="text-2xl font-semibold mr-auto">{current.name}</h1>
            <Button variant="outline" onClick={() => { const n = prompt("Project name", current.name); if (n?.trim()) { updateProject(current.id, { name: n.trim() }); refresh(); } }}><Pencil className="w-4 h-4 mr-1" />Rename</Button>
            <Button onClick={() => openLevel(addLevelToProject(current.id).id)}><Plus className="w-4 h-4 mr-1" />New level</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {levels.map((l) => (
              <div key={l.id} className="tech-card border-0 rounded-xl overflow-hidden flex flex-col">
                <button onClick={() => openLevel(l.id)} className="h-32 bg-muted flex items-center justify-center">
                  {l.thumbnail_url ? <img src={l.thumbnail_url} alt={l.name} className="w-full h-full object-cover" /> : <Box className="w-10 h-10 text-muted-foreground" />}
                </button>
                <div className="p-3 flex items-center gap-1">
                  <button onClick={() => openLevel(l.id)} className="text-left mr-auto min-w-0">
                    <div className="font-medium truncate">{l.name}{current.defaultLevelId === l.id ? " · start" : ""}</div>
                    <div className="text-xs text-muted-foreground">{l.scene?.objects?.length ?? 0} objects</div>
                    {(() => { const w = resolveLevelWorld(l.id, l.name); return w ? <div className="text-[11px] font-medium text-emerald-500">startupfactoryhub.com{w.livePath}</div> : null; })()}
                  </button>
                  <Button size="icon" variant="ghost" title="Make start level" onClick={() => { updateProject(current.id, { defaultLevelId: l.id }); refresh(); }}><Flag className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" title="Rename" onClick={() => { const n = prompt("Level name", l.name); if (n?.trim()) { updateLocalLevel(l.id, { name: n.trim() }); refresh(); } }}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" title="Delete level" onClick={() => { if (confirm(`Delete level "${l.name}"?`)) { deleteLocalLevel(l.id); refresh(); } }}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const shown = projects.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold mr-auto">My 3D projects</h1>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects" className="pl-9 w-64" />
          </div>
          <Button onClick={() => openLevel(createProject().level.id)}><Plus className="w-4 h-4 mr-1" />New 3D project</Button>
        </div>
        {shown.length === 0 ? (
          <div className="tech-card border-0 rounded-xl p-10 text-center text-muted-foreground">
            {projects.length ? "No projects match your search." : "You have no 3D projects yet. Create your first one."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => {
              const start = startOf(p);
              return (
                <div key={p.id} className="tech-card border-0 rounded-xl overflow-hidden flex flex-col">
                  <button onClick={() => setOpenId(p.id)} className="h-36 bg-muted flex items-center justify-center">
                    {start?.thumbnail_url ? <img src={start.thumbnail_url} alt={p.name} className="w-full h-full object-cover" /> : <Layers className="w-10 h-10 text-muted-foreground" />}
                  </button>
                  <div className="p-3 flex items-center gap-1">
                    <button onClick={() => setOpenId(p.id)} className="text-left mr-auto min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.levels.length} level{p.levels.length === 1 ? "" : "s"} · {new Date(p.updated_at).toLocaleDateString()}</div>
                    </button>
                    {start && <Button size="sm" variant="outline" onClick={() => openLevel(start.id)}>Open</Button>}
                    <Button size="icon" variant="ghost" title="Duplicate" onClick={() => { duplicateProject(p.id); refresh(); }}><Copy className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" title="Delete" onClick={() => { if (confirm(`Delete "${p.name}" and all its levels? This cannot be undone.`)) { deleteProject(p.id, deleteLocalLevel); refresh(); } }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
