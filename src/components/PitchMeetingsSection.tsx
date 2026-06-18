import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Presentation, Calendar as CalendarIcon, Clock } from 'lucide-react';
import PitchMeetingCard, { type PitchOutcome } from '@/components/PitchMeetingCard';
import { cn } from '@/lib/utils';

type View = 'incoming' | 'sent' | 'upcoming' | 'past';

interface Props {
  meetings: any[];
  viewerType: 'startup' | 'investor';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onJoin?: (url: string) => void;
  onOutcomeChange?: (id: string, outcome: PitchOutcome) => void;
  onOpenTranscript?: (meta: any) => void;
}

export default function PitchMeetingsSection({
  meetings,
  viewerType,
  onAccept,
  onReject,
  onJoin,
  onOutcomeChange,
  onOpenTranscript,
}: Props) {
  // viewerType determines which host_id means "incoming" vs "sent"
  // - startup viewer: incoming = investor-hosted, sent = startup-hosted
  // - investor viewer: incoming = startup-hosted, sent = investor-hosted
  const incomingHostKey = viewerType === 'startup' ? 'investor_id' : 'startup_id';
  const sentHostKey = viewerType === 'startup' ? 'startup_id' : 'investor_id';

  const groups = useMemo(() => {
    const now = new Date();
    return {
      incoming: meetings.filter((m) => m.status === 'pending' && m.host_id === m[incomingHostKey]),
      sent: meetings.filter((m) => m.status === 'pending' && m.host_id === m[sentHostKey]),
      upcoming: meetings
        .filter((m) => m.status === 'scheduled' && new Date(m.scheduled_date) >= now)
        .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()),
      past: meetings
        .filter((m) => (m.status === 'scheduled' || m.status === 'completed') && new Date(m.scheduled_date) < now)
        .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()),
    };
  }, [meetings, incomingHostKey, sentHostKey]);

  // Default to the first chip with content
  const defaultView: View =
    groups.incoming.length > 0
      ? 'incoming'
      : groups.upcoming.length > 0
        ? 'upcoming'
        : groups.sent.length > 0
          ? 'sent'
          : 'past';
  const [view, setView] = useState<View>(defaultView);

  const chips: Array<{ key: View; label: string; icon: any; count: number; tone: string }> = [
    { key: 'incoming', label: 'Incoming', icon: Bell, count: groups.incoming.length, tone: 'text-amber-500' },
    { key: 'sent', label: 'Sent', icon: Presentation, count: groups.sent.length, tone: 'text-primary' },
    { key: 'upcoming', label: 'Upcoming', icon: CalendarIcon, count: groups.upcoming.length, tone: 'text-emerald-500' },
    { key: 'past', label: 'Past', icon: Clock, count: groups.past.length, tone: 'text-muted-foreground' },
  ];

  const items = groups[view];
  const emptyLabel: Record<View, string> = {
    incoming: 'No incoming requests',
    sent: 'No pending sent requests',
    upcoming: 'No upcoming meetings',
    past: 'No past meetings',
  };

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

      {items.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-muted-foreground/20">
          <p className="text-sm text-muted-foreground">{emptyLabel[view]}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((meeting) => (
            <PitchMeetingCard
              key={meeting.id}
              meeting={meeting}
              variant={view}
              viewerType={viewerType}
              onAccept={view === 'incoming' ? onAccept : undefined}
              onReject={view === 'incoming' ? onReject : undefined}
              onJoin={view === 'upcoming' ? onJoin : undefined}
              onOutcomeChange={view === 'past' ? onOutcomeChange : undefined}
              onOpenTranscript={view === 'past' ? onOpenTranscript : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
