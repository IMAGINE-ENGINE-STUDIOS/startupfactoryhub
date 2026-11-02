import { useState } from 'react';
import { Presentation, GraduationCap, Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  pitches: React.ReactNode;
  mentorship: React.ReactNode;
  labels?: { pitches: string; mentorship: string };
  icons?: { pitches: 'pitches' | 'startups'; mentorship: 'mentorship' | 'investors' };
}

const ICONS = {
  pitches: { icon: Presentation, color: 'from-orange-500 to-pink-600' },
  startups: { icon: Building2, color: 'from-emerald-500 to-teal-600' },
  mentorship: { icon: GraduationCap, color: 'from-emerald-500 to-teal-600' },
  investors: { icon: Users, color: 'from-blue-500 to-cyan-600' },
};

export default function MeetingsTwoLane({
  pitches,
  mentorship,
  labels = { pitches: 'Investor Pitches', mentorship: 'Mentorship' },
  icons = { pitches: 'pitches', mentorship: 'mentorship' },
}: Props) {
  const [lane, setLane] = useState<'pitches' | 'mentorship'>('pitches');

  const lanes = [
    { key: 'pitches' as const, label: labels.pitches, ...ICONS[icons.pitches] },
    { key: 'mentorship' as const, label: labels.mentorship, ...ICONS[icons.mentorship] },
  ];

  return (
    <div className="space-y-5">
      <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-[3px]">
        {lanes.map((l) => {
          const Icon = l.icon;
          const active = lane === l.key;
          return (
            <button
              key={l.key}
              onClick={() => setLane(l.key)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors',
                active ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="animate-fade-in">
        <div className={lane === 'pitches' ? '' : 'hidden'}>{pitches}</div>
        <div className={lane === 'mentorship' ? '' : 'hidden'}>{mentorship}</div>
      </div>
    </div>
  );
}
