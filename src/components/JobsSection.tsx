import { useState } from 'react';
import UnifiedJobsBoard from '@/components/UnifiedJobsBoard';
import ManageJobPosts from '@/components/ManageJobPosts';
import JobTaskManager from '@/components/JobTaskManager';
import { Search, FileText, CheckSquare } from 'lucide-react';

type View = 'browse' | 'posts' | 'tasks';

const chips: { key: View; label: string; icon: any; color: string; hint: string }[] = [
  { key: 'browse', label: 'Discover', icon: Search, color: 'from-sky-500 to-blue-600', hint: 'Explore openings' },
  { key: 'posts', label: 'My Posts', icon: FileText, color: 'from-fuchsia-500 to-pink-600', hint: 'Manage listings' },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'from-emerald-500 to-teal-600', hint: 'Track work' },
];

export default function JobsSection() {
  const [view, setView] = useState<View>('browse');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {chips.map(chip => {
          const Icon = chip.icon;
          const active = view === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => setView(chip.key)}
              className={`group relative overflow-hidden rounded-2xl border p-3 md:p-4 text-left transition-all duration-300 ${
                active
                  ? 'border-transparent text-white shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5)] scale-[1.02]'
                  : 'border-border/60 bg-background/40 backdrop-blur-xl hover:border-primary/40 hover:-translate-y-0.5'
              }`}
            >
              {active && (
                <span className={`absolute inset-0 bg-gradient-to-br ${chip.color}`} />
              )}
              <div className="relative flex items-center gap-3">
                <div className={`h-9 w-9 md:h-10 md:w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  active ? 'bg-white/20' : 'bg-primary/10'
                }`}>
                  <Icon className={`h-4 w-4 md:h-5 md:w-5 ${active ? 'text-white' : 'text-primary'}`} />
                </div>
                <div className="min-w-0">
                  <div className={`text-sm font-semibold leading-tight ${active ? 'text-white' : 'text-foreground'}`}>
                    {chip.label}
                  </div>
                  <div className={`text-[10px] md:text-xs leading-tight mt-0.5 ${active ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {chip.hint}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="animate-fade-in">
        {view === 'browse' && <UnifiedJobsBoard />}
        {view === 'posts' && <ManageJobPosts />}
        {view === 'tasks' && <JobTaskManager />}
      </div>
    </div>
  );
}
