import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Presentation, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  pitches: React.ReactNode;
  mentorship: React.ReactNode;
}

export default function MeetingsTwoLane({ pitches, mentorship }: Props) {
  const [lane, setLane] = useState<'pitches' | 'mentorship'>('pitches');

  const lanes = [
    { key: 'pitches' as const, label: 'Investor Pitches', icon: Presentation, tone: 'text-primary' },
    { key: 'mentorship' as const, label: 'Mentorship', icon: GraduationCap, tone: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {lanes.map((l) => {
          const Icon = l.icon;
          const active = lane === l.key;
          return (
            <Button
              key={l.key}
              size="sm"
              variant={active ? 'default' : 'outline'}
              onClick={() => setLane(l.key)}
              className={cn('rounded-full h-8 px-3 text-xs gap-1.5 flex-shrink-0')}
            >
              <Icon className={cn('h-3.5 w-3.5', !active && l.tone)} />
              {l.label}
            </Button>
          );
        })}
      </div>

      <div className={lane === 'pitches' ? '' : 'hidden'}>{pitches}</div>
      <div className={lane === 'mentorship' ? '' : 'hidden'}>{mentorship}</div>
    </div>
  );
}
