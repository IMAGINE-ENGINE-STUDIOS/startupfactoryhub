import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, Calendar as CalendarIcon, History } from 'lucide-react';
import StartupMentorshipOffers from '@/components/StartupMentorshipOffers';
import StartupActiveMentors from '@/components/StartupActiveMentors';
import StartupMentoringSessions from '@/components/StartupMentoringSessions';
import BookingsList from '@/components/BookingsList';
import { cn } from '@/lib/utils';

type View = 'offers' | 'active' | 'upcoming' | 'past';

interface Props {
  onJoin?: (url: string) => void;
  onOpenTranscript?: (meta: any) => void;
  onOfferHandled?: () => void;
  onSessionUpdated?: () => void;
  onCountsChange?: (counts: { offers: number; active: number; upcoming: number; past: number }) => void;
}

export default function MentorshipSection({
  onJoin,
  onOpenTranscript,
  onOfferHandled,
  onSessionUpdated,
  onCountsChange,
}: Props) {
  const [view, setView] = useState<View>('offers');
  const [counts, setCounts] = useState({ offers: 0, active: 0, upcoming: 0, past: 0 });

  const update = (key: keyof typeof counts, n: number) => {
    setCounts((prev) => {
      if (prev[key] === n) return prev;
      const next = { ...prev, [key]: n };
      onCountsChange?.(next);
      return next;
    });
  };

  const chips: Array<{ key: View; label: string; icon: any; count: number; tone: string }> = [
    { key: 'offers', label: 'Offers', icon: Sparkles, count: counts.offers, tone: 'text-amber-500' },
    { key: 'active', label: 'Active', icon: Users, count: counts.active, tone: 'text-emerald-500' },
    { key: 'upcoming', label: 'Upcoming', icon: CalendarIcon, count: counts.upcoming, tone: 'text-emerald-500' },
    { key: 'past', label: 'Past', icon: History, count: counts.past, tone: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {chips.map((c) => {
          const Icon = c.icon;
          const active = view === c.key;
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
              {c.count > 0 && (
                <Badge
                  variant={active ? 'secondary' : 'outline'}
                  className="h-4 min-w-4 px-1 text-[10px] leading-none"
                >
                  {c.count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Keep all panels mounted so child components can report counts, but only show active view */}
      <div className={view === 'offers' ? '' : 'hidden'}>
        <StartupMentorshipOffers
          onOfferHandled={onOfferHandled}
          onCountChange={(n) => update('offers', n)}
        />
      </div>
      <div className={view === 'active' ? '' : 'hidden'}>
        <StartupActiveMentors onJoin={onJoin} onCountChange={(n) => update('active', n)} />
      </div>
      <div className={view === 'upcoming' ? 'space-y-4' : 'hidden'}>
        <BookingsList variant="scheduled" category="mentorship" title="Booked Mentoring Sessions" />
        <StartupMentoringSessions
          type="upcoming"
          onJoin={onJoin}
          onCountChange={(n) => update('upcoming', n)}
        />
      </div>
      <div className={view === 'past' ? '' : 'hidden'}>
        <StartupMentoringSessions
          type="past"
          onSessionUpdated={onSessionUpdated}
          onCountChange={(n) => update('past', n)}
          onOpenTranscript={onOpenTranscript}
        />
      </div>
    </div>
  );
}
