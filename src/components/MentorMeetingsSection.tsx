import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar as CalendarIcon, Clock, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import MentorshipRequests from '@/components/MentorshipRequests';
import MenteeSessions from '@/components/MenteeSessions';
import MentorSessionHistory from '@/components/MentorSessionHistory';
import MentorOffersBoard from '@/components/MentorOffersBoard';

type View = 'requests' | 'upcoming' | 'past' | 'mentees' | 'offer';

interface Props {
  onJoinMeeting?: (link: string, session: any) => void;
  activeMenteesCount?: number;
  activeMentees?: React.ReactNode; // optional preview row
  /** When set, render ONLY this panel (no chips) — the Meetings console owns the sections. */
  bareView?: View;
}

export default function MentorMeetingsSection({ onJoinMeeting, activeMenteesCount = 0, activeMentees, bareView }: Props) {
  const [view, setView] = useState<View>('upcoming');

  if (bareView) {
    return (
      <div className="space-y-4">
        {bareView === 'requests' && (
          <>
            <MentorshipRequests />
            <MenteeSessions onJoinMeeting={onJoinMeeting} requestsOnly />
          </>
        )}
        {bareView === 'upcoming' && <MenteeSessions onJoinMeeting={onJoinMeeting} />}
        {bareView === 'past' && <MentorSessionHistory showStats={false} />}
        {bareView === 'mentees' &&
          (activeMentees ?? (
            <div className="text-center py-10 rounded-[18px] border border-border bg-card shadow-sm">
              <p className="text-sm text-muted-foreground">No active mentees yet</p>
            </div>
          ))}
        {bareView === 'offer' && <MentorOffersBoard />}
      </div>
    );
  }

  const chips: Array<{ key: View; label: string; icon: any; tone: string }> = [
    { key: 'requests', label: 'Requests', icon: Bell, tone: 'text-amber-500' },
    { key: 'upcoming', label: 'Upcoming', icon: CalendarIcon, tone: 'text-emerald-500' },
    { key: 'past', label: 'Past', icon: Clock, tone: 'text-muted-foreground' },
    { key: 'mentees', label: 'Mentees', icon: Users, tone: 'text-primary' },
    { key: 'offer', label: 'Offer', icon: TrendingUp, tone: 'text-primary' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {chips.map((c) => {
          const Icon = c.icon;
          const active = view === c.key;
          const showCount = c.key === 'mentees' && activeMenteesCount > 0;
          return (
            <Button
              key={c.key}
              size="sm"
              variant="outline"
              onClick={() => setView(c.key)}
              className={cn('rounded-full h-9 px-3.5 text-xs font-semibold gap-1.5 flex-shrink-0 bg-card hover:bg-card', active && 'border-primary/40 bg-primary/10 text-foreground hover:bg-primary/10')}
            >
              <Icon className={cn('h-3.5 w-3.5', !active && c.tone)} />
              {c.label}
              {showCount && (
                <Badge variant={active ? 'secondary' : 'outline'} className="h-4 min-w-4 px-1 text-[10px] leading-none">
                  {activeMenteesCount}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      <div>
        {view === 'requests' && (
          <div className="space-y-4">
            <MentorshipRequests />
            <MenteeSessions onJoinMeeting={onJoinMeeting} requestsOnly />
          </div>
        )}
        {view === 'upcoming' && <MenteeSessions onJoinMeeting={onJoinMeeting} />}
        {view === 'past' && <MentorSessionHistory showStats={false} />}
        {view === 'mentees' && (
          activeMentees ?? (
            <div className="text-center py-10 rounded-[18px] border border-border bg-card shadow-sm">
              <p className="text-sm text-muted-foreground">No active mentees yet</p>
            </div>
          )
        )}
        {view === 'offer' && <MentorOffersBoard />}
      </div>
    </div>
  );
}
