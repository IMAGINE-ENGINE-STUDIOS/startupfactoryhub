import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Presentation, GraduationCap, Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  pitches: React.ReactNode;
  mentorship: React.ReactNode;
  labels?: { pitches: string; mentorship: string };
  icons?: { pitches: 'pitches' | 'startups'; mentorship: 'mentorship' | 'investors' };
}

const ICONS = {
  pitches: { icon: Presentation, tone: 'text-primary' },
  startups: { icon: Building2, tone: 'text-emerald-500' },
  mentorship: { icon: GraduationCap, tone: 'text-emerald-500' },
  investors: { icon: Users, tone: 'text-blue-500' },
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
