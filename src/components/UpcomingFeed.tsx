import { useState, useMemo } from 'react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock, MapPin, Users, Rocket } from 'lucide-react';
import NvidiaInceptionCard from '@/components/NvidiaInceptionCard';

type Filter = 'all' | 'events' | 'accelerators';

interface Props {
  events: any[];
  cohorts: any[];
  onEventClick: (e: any) => void;
  onCohortApply: (c: any) => void;
}

type FeedItem =
  | { kind: 'event'; id: string; date: Date; raw: any }
  | { kind: 'cohort'; id: string; date: Date | null; raw: any };

export default function UpcomingFeed({ events, cohorts, onEventClick, onCohortApply }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const items: FeedItem[] = useMemo(() => {
    const evs: FeedItem[] = events.map((e) => ({
      kind: 'event', id: `ev-${e.id}`, date: parseISO(e.start_date), raw: e,
    }));
    const cos: FeedItem[] = cohorts.map((c) => ({
      kind: 'cohort', id: `co-${c.id}`,
      date: c.application_deadline ? parseISO(c.application_deadline) : null, raw: c,
    }));
    return [...evs, ...cos].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.getTime() - b.date.getTime();
    });
  }, [events, cohorts]);

  const filtered = useMemo(() => {
    if (filter === 'events') return items.filter((i) => i.kind === 'event');
    if (filter === 'accelerators') return items.filter((i) => i.kind === 'cohort');
    return items;
  }, [items, filter]);

  const showInception = filter === 'all' || filter === 'accelerators';
  const totalCount = filtered.length + (showInception ? 1 : 0);

  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'events', label: 'Events' },
    { key: 'accelerators', label: 'Accelerators' },
  ];

  return (
    <Card className="tech-card border-0 overflow-hidden bg-card/40 backdrop-blur-2xl w-full max-w-full min-w-0">
      {/* Header */}
      <div className="p-3 sm:p-5 pb-3 sm:pb-4 flex flex-col gap-3 sm:gap-4 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight truncate">What's coming up</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
              {totalCount}
            </span>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1 p-1 bg-background/40 rounded-xl border border-border/40 w-fit max-w-full overflow-x-auto">
          {chips.map((c) => {
            const active = filter === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={`px-2.5 sm:px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  active
                    ? 'bg-foreground/10 text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="px-3 sm:px-5 pb-6 sm:pb-8 relative min-w-0">
        {totalCount === 0 ? (
          <div className="text-center py-10">
            <div className="inline-flex h-12 w-12 rounded-2xl bg-primary/10 items-center justify-center mb-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Nothing scheduled — your calendar is clear.</p>
          </div>
        ) : (
          <>
            {/* Vertical rail */}
            <div className="absolute left-[28px] sm:left-[32px] top-0 bottom-6 sm:bottom-8 w-px bg-gradient-to-b from-border via-border/60 to-transparent" />

            <div className="space-y-4 sm:space-y-5 min-w-0">
              {showInception && (
                <div className="relative pl-[52px] sm:pl-[56px] min-w-0">
                  <NvidiaInceptionCard />
                </div>
              )}

              {filtered.map((item) =>
                item.kind === 'event' ? (
                  <EventRow key={item.id} event={item.raw} date={item.date} onClick={() => onEventClick(item.raw)} />
                ) : (
                  <CohortRow key={item.id} cohort={item.raw} date={item.date} onApply={() => onCohortApply(item.raw)} />
                )
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}


function DateStamp({ date, color }: { date: Date | null; color: 'fuchsia' | 'emerald' }) {
  const dotColor = color === 'fuchsia'
    ? 'bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.7)]'
    : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]';
  return (
    <div className="flex flex-col items-center pt-1 w-[44px] shrink-0">
      <div className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center z-10">
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      </div>
      {date && (
        <span className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tighter">
          {isToday(date) ? 'Today' : isTomorrow(date) ? 'Tmrw' : format(date, 'MMM d')}
        </span>
      )}
    </div>
  );
}

function EventRow({ event, date, onClick }: { event: any; date: Date; onClick: () => void }) {
  // Fake avatar gradient set (deterministic by id)
  const avatars = ['bg-zinc-700', 'bg-zinc-600', 'bg-zinc-500'];
  return (
    <button
      onClick={onClick}
      className="relative flex gap-4 group cursor-pointer w-full text-left"
    >
      <DateStamp date={date} color="fuchsia" />
      <div className="flex-1 min-w-0 bg-background/40 hover:bg-background/60 border border-border/50 hover:border-fuchsia-500/40 rounded-2xl p-4 transition-all duration-300 group-hover:translate-x-1">
        <div className="flex justify-between items-start gap-2 mb-1">
          <span className="text-[10px] font-bold text-fuchsia-500 uppercase tracking-widest">Event</span>
          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1 shrink-0">
            <Clock className="h-2.5 w-2.5" />
            {format(date, 'HH:mm')}
            {event.location && <> • <span className="truncate max-w-[100px]">{event.location}</span></>}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-fuchsia-300 transition-colors">
          {event.title}
        </h3>
        {(event.host_name || event.organizer_name) && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
            Hosted by {event.host_name || event.organizer_name}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center">
            <div className="flex -space-x-1.5">
              {avatars.map((c, i) => (
                <div key={i} className={`w-5 h-5 rounded-full border border-background ${c}`} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground pl-2">
              {event.attendees ?? 0} attending{event.max_attendees ? ` / ${event.max_attendees}` : ''}
            </span>
          </div>
          <span className="text-[11px] font-medium text-fuchsia-500 group-hover:text-fuchsia-400 transition-colors">
            Open Details →
          </span>
        </div>
      </div>
    </button>
  );
}

function CohortRow({ cohort, date, onApply }: { cohort: any; date: Date | null; onApply: () => void }) {
  const spotsLeft = (cohort.max_startups || 0) - (cohort.current_startups || 0);
  const isOpen = !date || date.getTime() > Date.now();
  return (
    <div
      onClick={onApply}
      className="relative flex gap-4 group cursor-pointer"
    >
      <DateStamp date={date} color="emerald" />
      <div className="flex-1 min-w-0 bg-background/40 hover:bg-background/60 border border-border/50 hover:border-emerald-500/40 rounded-2xl p-4 transition-all duration-300 group-hover:translate-x-1">
        <div className="flex justify-between items-start gap-2 mb-1">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Accelerator</span>
          {isOpen && (
            <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Batch Open
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-emerald-300 transition-colors">
          {cohort.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
          {cohort.accelerator_profiles?.organization_name}
          {spotsLeft > 0 && cohort.max_startups ? ` • ${spotsLeft} spots left` : ''}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            {cohort.location ? (
              <>
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] text-muted-foreground truncate">{cohort.location}</span>
              </>
            ) : (
              <>
                <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] text-muted-foreground">
                  {cohort.current_startups || 0}/{cohort.max_startups || '∞'} startups
                </span>
              </>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onApply(); }}
            className="px-3 py-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all inline-flex items-center gap-1"
          >
            <Rocket className="h-3 w-3" />
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}
