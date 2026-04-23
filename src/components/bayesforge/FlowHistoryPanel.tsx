import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, Search, Trash2, FolderOpen, Pencil, Check, X } from "lucide-react";
import type { FlowSessionApi } from "@/hooks/useFlowSession";
import { cn } from "@/lib/utils";

interface Props {
  api: FlowSessionApi;
  onOpen?: (id: string) => void;
}

export default function FlowHistoryPanel({ api, onOpen }: Props) {
  const { sessions, sessionId, deleteSession, renameSession } = api;
  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const filtered = sessions.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      (s.idea || "").toLowerCase().includes(q) ||
      (s.domain || "").toLowerCase().includes(q) ||
      (s.region || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 blur-md opacity-60" />
          <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
            <History className="h-4 w-4 text-background" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            Investigation History
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Every Flow analysis is permanently saved. Continue investigations months later.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, idea, domain or region…"
          className="pl-9 bg-background/60 border-white/10"
        />
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground border border-dashed border-white/10 rounded-2xl">
            {sessions.length === 0
              ? "No investigations yet. Run your first Flow analysis to start the record."
              : "No matches for that search."}
          </div>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              className={cn(
                "rounded-xl border bg-background/50 backdrop-blur p-3 transition group",
                sessionId === s.id
                  ? "border-cyan-400/50 shadow-[0_0_20px_-10px_hsl(190_90%_55%)]"
                  : "border-white/10 hover:border-white/20"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {renamingId === s.id ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          if (draftTitle.trim()) renameSession(s.id, draftTitle.trim());
                          setRenamingId(null);
                        }}
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setRenamingId(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <h4 className="text-sm font-semibold truncate">{s.title}</h4>
                  )}
                  {s.idea && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                      {s.idea}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {s.domain && (
                      <span className="px-1.5 py-0.5 rounded border border-white/10 bg-background/40">
                        {s.domain}
                      </span>
                    )}
                    {s.region && (
                      <span className="px-1.5 py-0.5 rounded border border-white/10 bg-background/40">
                        {s.region}
                      </span>
                    )}
                    <span>{new Date(s.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setRenamingId(s.id);
                      setDraftTitle(s.title);
                    }}
                    title="Rename"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 hover:text-cyan-400"
                    onClick={() => onOpen?.(s.id)}
                    title="Open"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 hover:text-rose-400"
                    onClick={() => {
                      if (confirm(`Delete investigation "${s.title}"? This cannot be undone.`)) {
                        deleteSession(s.id);
                      }
                    }}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
