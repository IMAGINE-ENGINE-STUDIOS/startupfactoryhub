import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  X,
  Check,
  Sparkles,
  ListChecks,
  Zap,
  CircleDot,
  Trophy,
  GripVertical,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface RoadmapChecklistProps {
  items: ChecklistItem[];
  onItemsUpdate: (items: ChecklistItem[]) => void;
  disabled?: boolean;
}

type Filter = 'all' | 'active' | 'done';

export default function RoadmapChecklist({
  items,
  onItemsUpdate,
  disabled = false,
}: RoadmapChecklistProps) {
  const [newItemText, setNewItemText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  const visible = useMemo(() => {
    if (filter === 'active') return items.filter((i) => !i.completed);
    if (filter === 'done') return items.filter((i) => i.completed);
    return items;
  }, [items, filter]);

  const toggleItem = (id: string) => {
    if (disabled) return;
    onItemsUpdate(items.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i)));
  };

  const addItem = () => {
    if (!newItemText.trim() || disabled) return;
    onItemsUpdate([
      ...items,
      { id: `check-${Date.now()}`, text: newItemText.trim(), completed: false },
    ]);
    setNewItemText('');
  };

  const removeItem = (id: string) => {
    if (disabled) return;
    onItemsUpdate(items.filter((i) => i.id !== id));
  };

  const commitEdit = (id: string) => {
    if (!editingText.trim()) {
      setEditingId(null);
      return;
    }
    onItemsUpdate(items.map((i) => (i.id === id ? { ...i, text: editingText.trim() } : i)));
    setEditingId(null);
  };

  const clearCompleted = () => {
    if (disabled) return;
    onItemsUpdate(items.filter((i) => !i.completed));
  };

  const markAll = () => {
    if (disabled) return;
    onItemsUpdate(items.map((i) => ({ ...i, completed: true })));
  };

  const handleDrop = (overId: string) => {
    const from = dragId.current;
    setDragOverId(null);
    dragId.current = null;
    if (!from || from === overId) return;
    const next = [...items];
    const fromIdx = next.findIndex((i) => i.id === from);
    const toIdx = next.findIndex((i) => i.id === overId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onItemsUpdate(next);
  };

  // Ring math
  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative tech-card border-0 rounded-2xl p-4 sm:p-5 overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
        }}
      />

      {/* ── Header: ring + stats + filters ──────────────────────────── */}
      <div className="relative flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <defs>
              <linearGradient id="taskRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(160 80% 45%)" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r={R} stroke="hsl(var(--muted))" strokeWidth="5" fill="none" opacity="0.3" />
            <circle
              cx="32"
              cy="32"
              r={R}
              stroke="url(#taskRing)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct / 100)}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {allDone ? (
              <Trophy className="w-6 h-6 text-emerald-400" />
            ) : (
              <span className="text-sm font-bold tabular-nums bg-gradient-to-br from-primary to-emerald-400 bg-clip-text text-transparent">
                {pct}%
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Task Tracker
            </span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-lg font-semibold tabular-nums">
              {completedCount}
              <span className="text-muted-foreground/70">/{totalCount}</span>
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {allDone ? 'all clear · nice work' : totalCount === 0 ? 'no tasks yet' : `${totalCount - completedCount} left`}
            </span>
          </div>
        </div>

        {/* Filter chips */}
        {totalCount > 0 && (
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-muted/40 border border-border/40">
            {(['all', 'active', 'done'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider rounded-full transition-all',
                  filter === f
                    ? 'bg-gradient-to-r from-primary to-emerald-500 text-white shadow-[0_0_12px_hsl(var(--primary)/0.4)]'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile filters */}
      {totalCount > 0 && (
        <div className="sm:hidden mt-3 flex items-center gap-1 p-1 rounded-full bg-muted/40 border border-border/40 w-fit">
          {(['all', 'active', 'done'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider rounded-full transition-all',
                filter === f
                  ? 'bg-gradient-to-r from-primary to-emerald-500 text-white'
                  : 'text-muted-foreground',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* ── Task list ────────────────────────────────────────────── */}
      <ul className="relative mt-4 space-y-1.5">
        {visible.map((item) => {
          const isEditing = editingId === item.id;
          const isOver = dragOverId === item.id;
          return (
            <li
              key={item.id}
              draggable={!disabled && !isEditing}
              onDragStart={() => (dragId.current = item.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverId(item.id);
              }}
              onDragLeave={() => setDragOverId((p) => (p === item.id ? null : p))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(item.id);
              }}
              className={cn(
                'group relative flex items-center gap-2.5 p-2 pr-2.5 rounded-xl border transition-all duration-200',
                item.completed
                  ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                  : 'bg-background/40 border-border/40 hover:border-primary/40 hover:bg-primary/[0.03]',
                isOver && 'ring-2 ring-primary/50 -translate-y-0.5',
              )}
            >
              {/* Drag handle */}
              {!disabled && (
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0" />
              )}

              {/* Custom check */}
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                disabled={disabled}
                aria-label={item.completed ? 'Mark as not done' : 'Mark as done'}
                className={cn(
                  'relative w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                  item.completed
                    ? 'bg-gradient-to-br from-primary to-emerald-500 border-transparent shadow-[0_0_12px_hsl(var(--primary)/0.5)]'
                    : 'border-muted-foreground/40 hover:border-primary hover:bg-primary/10',
                )}
              >
                {item.completed ? (
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                ) : (
                  <CircleDot className="w-2.5 h-2.5 text-muted-foreground/0 group-hover:text-primary/50 transition-colors" />
                )}
              </button>

              {/* Text / inline edit */}
              {isEditing ? (
                <Input
                  autoFocus
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={() => commitEdit(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit(item.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="h-7 text-sm flex-1 bg-transparent"
                />
              ) : (
                <span
                  onDoubleClick={() => {
                    if (disabled) return;
                    setEditingId(item.id);
                    setEditingText(item.text);
                  }}
                  className={cn(
                    'flex-1 text-sm min-w-0 truncate cursor-text select-text',
                    item.completed && 'line-through text-muted-foreground/70',
                  )}
                  title={item.text}
                >
                  {item.text}
                </span>
              )}

              {/* Row actions */}
              {!disabled && !isEditing && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setEditingText(item.text);
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"
                    aria-label="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    aria-label="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </li>
          );
        })}

        {/* Empty state */}
        {visible.length === 0 && (
          <li className="flex flex-col items-center justify-center py-6 text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCount === 0
                ? 'No tasks yet — add your first one below.'
                : filter === 'active'
                  ? 'All caught up. Nothing active.'
                  : 'No completed tasks yet.'}
            </p>
          </li>
        )}
      </ul>

      {/* ── Quick add bar (sticky-looking) ──────────────────────── */}
      {!disabled && (
        <div className="relative mt-3 flex items-center gap-2 p-1.5 rounded-xl bg-background/60 border border-border/50 focus-within:border-primary/60 focus-within:shadow-[0_0_18px_hsl(var(--primary)/0.18)] transition-all">
          <div className="pl-1.5 text-primary">
            <Zap className="w-4 h-4" />
          </div>
          <Input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addItem();
            }}
            placeholder="Add a task and press Enter…"
            className="h-8 flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm placeholder:text-muted-foreground/60"
          />
          <Button
            size="sm"
            onClick={addItem}
            disabled={!newItemText.trim()}
            className="h-7 px-2.5 gap-1 bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 border-0 disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </Button>
        </div>
      )}

      {/* ── Footer batch actions ──────────────────────────────── */}
      {!disabled && totalCount > 0 && (
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground tabular-nums">
            {completedCount} done · {totalCount - completedCount} active
          </span>
          <div className="flex items-center gap-2">
            {!allDone && (
              <button
                onClick={markAll}
                className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider font-medium"
              >
                Mark all
              </button>
            )}
            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                className="text-muted-foreground hover:text-destructive transition-colors uppercase tracking-wider font-medium"
              >
                Clear done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
