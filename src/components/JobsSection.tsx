import { useState } from 'react';
import { Button } from '@/components/ui/button';
import UnifiedJobsBoard from '@/components/UnifiedJobsBoard';
import ManageJobPosts from '@/components/ManageJobPosts';
import JobTaskManager from '@/components/JobTaskManager';

type View = 'browse' | 'posts' | 'tasks';

const chips: { key: View; label: string }[] = [
  { key: 'browse', label: 'Browse' },
  { key: 'posts', label: 'My Posts' },
  { key: 'tasks', label: 'Tasks' },
];

export default function JobsSection() {
  const [view, setView] = useState<View>('browse');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {chips.map(chip => (
          <Button
            key={chip.key}
            variant={view === chip.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView(chip.key)}
            className="rounded-full shrink-0 h-8 px-3 text-xs"
          >
            {chip.label}
          </Button>
        ))}
      </div>

      {view === 'browse' && <UnifiedJobsBoard />}
      {view === 'posts' && <ManageJobPosts />}
      {view === 'tasks' && <JobTaskManager />}
    </div>
  );
}
