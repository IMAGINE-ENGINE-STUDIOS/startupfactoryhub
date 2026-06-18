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
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        {lanes.map((l) => {
          const Icon = l.icon;
          const active = lane === l.key;
          return (
            <button
              key={l.key}
              onClick={() => setLane(l.key)}
              className={cn(
                'group relative overflow-hidden rounded-2xl border p-3 md:p-4 text-left transition-all duration-300',
                active
                  ? 'border-transparent text-white shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.5)] scale-[1.02]'
                  : 'border-border/60 bg-background/40 backdrop-blur-xl hover:border-primary/40 hover:-translate-y-0.5'
              )}
            >
              {active && (
                <span className={cn('absolute inset-0 bg-gradient-to-br', l.color)} />
              )}
              <div className="relative flex items-center gap-3">
                <div
                  className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                    active ? 'bg-white/20' : 'bg-primary/10'
                  )}
                >
                  <Icon className={cn('h-5 w-5', active ? 'text-white' : 'text-primary')} />
                </div>
                <div className="min-w-0">
                  <div
                    className={cn(
                      'text-sm font-semibold leading-tight',
                      active ? 'text-white' : 'text-foreground'
                    )}
                  >
                    {l.label}
                  </div>
                  <div
                    className={cn(
                      'text-[10px] md:text-xs leading-tight mt-0.5',
                      active ? 'text-white/80' : 'text-muted-foreground'
                    )}
                  >
                    {active ? 'Currently viewing' : 'Tap to switch'}
                  </div>
                </div>
              </div>
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
