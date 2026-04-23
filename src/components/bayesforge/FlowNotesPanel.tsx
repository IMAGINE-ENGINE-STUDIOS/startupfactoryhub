import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Plus, Pin, PinOff, Trash2, Save } from "lucide-react";
import type { FlowSessionApi } from "@/hooks/useFlowSession";
import { cn } from "@/lib/utils";

interface Props {
  api: FlowSessionApi;
}

export default function FlowNotesPanel({ api }: Props) {
  const { notes, addNote, updateNote, deleteNote, togglePin, sessionId } = api;
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const onAdd = () => {
    const c = draft.trim();
    if (!c) return;
    addNote(c);
    setDraft("");
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-400 to-rose-400 blur-md opacity-60" />
          <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center">
            <StickyNote className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent">
            Investigation Notes
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Personal annotations attached to this investigation. Saved permanently.
          </p>
        </div>
      </div>

      {/* New note */}
      <div className="rounded-2xl border border-amber-400/30 bg-background/60 backdrop-blur-xl p-3 shadow-[0_0_28px_-10px_hsl(40_90%_55%)]">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={sessionId ? "Write a note — insights, decisions, hypotheses…" : "Run an analysis first to start taking notes."}
          disabled={!sessionId}
          rows={3}
          className="resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
        />
        <div className="flex justify-end mt-2">
          <Button
            type="button"
            size="sm"
            onClick={onAdd}
            disabled={!sessionId || !draft.trim()}
            className="gap-1.5 bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-background border-0 font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> Add note
          </Button>
        </div>
      </div>

      {/* Notes list */}
      <div className="space-y-2">
        {sortedNotes.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-white/10 rounded-2xl">
            No notes yet. Add your first observation above.
          </div>
        ) : (
          sortedNotes.map((n) => (
            <div
              key={n.id}
              className={cn(
                "rounded-xl border bg-background/50 backdrop-blur p-3 transition group",
                n.pinned ? "border-amber-400/40 shadow-[0_0_20px_-10px_hsl(40_90%_55%)]" : "border-white/10 hover:border-white/20"
              )}
            >
              {editingId === n.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                    className="text-sm resize-none bg-background/40"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        updateNote(n.id, editingContent);
                        setEditingId(null);
                      }}
                      className="gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="text-sm whitespace-pre-wrap text-foreground/90 cursor-text"
                    onClick={() => {
                      setEditingId(n.id);
                      setEditingContent(n.content);
                    }}
                  >
                    {n.content}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(n.updated_at).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => togglePin(n.id, !n.pinned)}
                        title={n.pinned ? "Unpin" : "Pin"}
                      >
                        {n.pinned ? (
                          <PinOff className="h-3.5 w-3.5 text-amber-400" />
                        ) : (
                          <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:text-rose-400"
                        onClick={() => deleteNote(n.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
