/**
 * 3D Studio projects list: every saved 3D level, with create, open, duplicate and delete.
 * Served at /levels (also inside Imagine Engine with ?embedded=1).
 */
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Copy, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createLocalLevel, deleteLocalLevel, listLocalLevels, updateLocalLevel } from "@/imagine-studio/lib/localLevels";

export default function StudioProjectsPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);
  const levels = useMemo(() => listLocalLevels(), [tick]);
  const shown = levels.filter((l) => l.name.toLowerCase().includes(q.toLowerCase()));
  const open = (id: string) => navigate(`/imagine-studio/${id}${search}`);

  const create = () => open(createLocalLevel().id);
  const duplicate = (id: string) => {
    const src = levels.find((l) => l.id === id);
    if (!src) return;
    const copy = createLocalLevel(src.scene);
    updateLocalLevel(copy.id, { name: `${src.name} (copy)` });
    setTick((t) => t + 1);
  };
  const remove = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteLocalLevel(id);
    setTick((t) => t + 1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold mr-auto">My 3D projects</h1>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects" className="pl-9 w-64" />
          </div>
          <Button onClick={create}><Plus className="w-4 h-4 mr-1" />New 3D project</Button>
        </div>
        {shown.length === 0 ? (
          <div className="tech-card border-0 rounded-xl p-10 text-center text-muted-foreground">
            {levels.length ? "No projects match your search." : "You have no 3D projects yet. Create your first one."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((l) => (
              <div key={l.id} className="tech-card border-0 rounded-xl overflow-hidden flex flex-col">
                <button onClick={() => open(l.id)} className="h-36 bg-muted flex items-center justify-center">
                  {l.thumbnail_url ? <img src={l.thumbnail_url} alt={l.name} className="w-full h-full object-cover" /> : <Box className="w-10 h-10 text-muted-foreground" />}
                </button>
                <div className="p-3 flex items-center gap-2">
                  <button onClick={() => open(l.id)} className="text-left mr-auto min-w-0">
                    <div className="font-medium truncate">{l.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(l.scene?.objects?.length ?? 0)} objects · {new Date(l.updated_at).toLocaleDateString()}
                    </div>
                  </button>
                  <Button size="icon" variant="ghost" title="Duplicate" onClick={() => duplicate(l.id)}><Copy className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" title="Delete" onClick={() => remove(l.id, l.name)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
