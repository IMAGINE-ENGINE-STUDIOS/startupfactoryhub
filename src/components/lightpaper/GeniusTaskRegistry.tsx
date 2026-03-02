import { useState, useEffect } from "react";
import { X, CheckCircle2, Loader2, AlertCircle, Download, Trash2, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import geniusAILogo from "@/assets/genius-ai-logo.png";

export interface GeniusTask {
  id: string;
  title: string;
  preset: string;
  status: "in-progress" | "done" | "failed";
  progress: { current: number; total: number };
  targetPages: number;
  createdAt: string;
  completedAt?: string;
  content?: string;
}

const STORAGE_KEY = "lightpaper-genius-tasks";

export function loadGeniusTasks(): GeniusTask[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveGeniusTasks(tasks: GeniusTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function addGeniusTask(task: GeniusTask) {
  const tasks = loadGeniusTasks();
  tasks.unshift(task);
  saveGeniusTasks(tasks);
  window.dispatchEvent(new CustomEvent("genius-task-update"));
}

export function updateGeniusTask(id: string, updates: Partial<GeniusTask>) {
  const tasks = loadGeniusTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    tasks[idx] = { ...tasks[idx], ...updates };
    saveGeniusTasks(tasks);
    window.dispatchEvent(new CustomEvent("genius-task-update"));
  }
}

interface GeniusTaskRegistryProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onLoadContent?: (html: string) => void;
}

export function GeniusTaskRegistry({ isOpen, onClose, isDarkMode, onLoadContent }: GeniusTaskRegistryProps) {
  const [tasks, setTasks] = useState<GeniusTask[]>(loadGeniusTasks);

  useEffect(() => {
    const handler = () => setTasks(loadGeniusTasks());
    window.addEventListener("genius-task-update", handler);
    return () => window.removeEventListener("genius-task-update", handler);
  }, []);

  if (!isOpen) return null;

  const fg = isDarkMode ? "text-white" : "text-foreground";
  const bg = isDarkMode ? "bg-black/90" : "bg-background/95";

  const clearAll = () => {
    saveGeniusTasks([]);
    setTasks([]);
  };

  const statusIcon = (status: GeniusTask["status"]) => {
    switch (status) {
      case "in-progress":
        return <Loader2 className="h-3.5 w-3.5 text-emerald-500 animate-spin" />;
      case "done":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "failed":
        return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={`fixed inset-0 z-[300] flex items-center justify-center p-4`} onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={`relative ${bg} backdrop-blur-xl border rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2.5">
            <img src={geniusAILogo} alt="Genius AI" className="h-6 w-6 rounded-full object-cover" />
            <span className={`text-sm font-semibold ${fg}`}>AI Task Log</span>
            <span className="text-xs text-muted-foreground">({tasks.length})</span>
          </div>
          <div className="flex items-center gap-2">
            {tasks.length > 0 && (
              <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                Clear All
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Task list */}
        <ScrollArea className="flex-1 px-4 py-3">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className={`text-sm ${fg} opacity-50`}>No tasks yet</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Genius AI tasks will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-xl border p-3 space-y-2 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {statusIcon(task.status)}
                      <span className={`text-sm font-medium ${fg} truncate`}>{task.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatTime(task.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted text-[10px]">{task.preset}</span>
                    <span>~{task.targetPages} pages</span>
                    {task.status === "in-progress" && task.progress.total > 0 && (
                      <span className="text-emerald-500 font-mono">
                        Ch. {task.progress.current}/{task.progress.total}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {task.status === "in-progress" && task.progress.total > 0 && (
                    <div className="w-full h-2 rounded-full overflow-hidden bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                        style={{
                          width: `${(task.progress.current / task.progress.total) * 100}%`,
                          background: "linear-gradient(90deg, #10b981, #06b6d4)",
                        }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                            animation: "shimmer 1.5s infinite",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions for completed tasks */}
                  {task.status === "done" && task.content && onLoadContent && (
                    <button
                      onClick={() => onLoadContent(task.content!)}
                      className="flex items-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-400 transition-colors mt-1"
                    >
                      <Download className="h-3 w-3" /> Load into document
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    </div>
  );
}
