import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar as CalendarIcon, Clock, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import MentorshipRequests from '@/components/MentorshipRequests';
import MenteeSessions from '@/components/MenteeSessions';
import BookingsList from '@/components/BookingsList';
import MentorSessionHistory from '@/components/MentorSessionHistory';
import MentorOffersBoard from '@/components/MentorOffersBoard';

type View = 'requests' | 'upcoming' | 'past' | 'mentees' | 'offer';

interface Props {
  onJoinMeeting?: (link: string, session: any) => void;
  activeMenteesCount?: number;
  activeMentees?: React.ReactNode; // optional preview row
}

export default function MentorMeetingsSection({ onJoinMeeting, activeMenteesCount = 0, activeMentees }: Props) {
  const [view, setView] = useState<View>('upcoming');

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
              variant={active ? 'default' : 'outline'}
              onClick={() => setView(c.key)}
              className={cn('rounded-full h-8 px-3 text-xs gap-1.5 flex-shrink-0')}
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRequestMode('mentor')}
                className="gap-1.5 h-9 flex-1 rounded-xl"
              >
                <GraduationCap className="h-4 w-4 text-primary" />
                Request mentorship
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRequestMode('advisor')}
                className="gap-1.5 h-9 flex-1 rounded-xl"
              >
                <Briefcase className="h-4 w-4 text-primary" />
                Request advisory service
              </Button>
            </div>
            <MentorshipRequests />
            <BookingsList variant="requests" />
            <MenteeSessions onJoinMeeting={onJoinMeeting} requestsOnly />
          </div>
        )}
        {view === 'upcoming' && <MenteeSessions onJoinMeeting={onJoinMeeting} />}
        {view === 'past' && <MentorSessionHistory showStats={false} />}
        {view === 'mentees' && (
          activeMentees ?? (
            <div className="text-center py-12 rounded-xl border border-dashed border-muted-foreground/20">
              <p className="text-sm text-muted-foreground">No active mentees yet</p>
            </div>
          )
        )}
        {view === 'offer' && <MentorOffersBoard />}
      </div>

      {requestMode && (
        <RequestServiceDialog
          mode={requestMode}
          open={!!requestMode}
          onOpenChange={(o) => { if (!o) setRequestMode(null); }}
        />
      )}
    </div>
  );
}
