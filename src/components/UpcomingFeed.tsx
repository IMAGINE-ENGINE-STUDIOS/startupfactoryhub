import { useState, useMemo } from 'react';
import { format, parseISO, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  Rocket,
  ExternalLink,
  Layers,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { getIndustryLabel } from '@/lib/constants';
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

function relativeLabel(date: Date) {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  const days = differenceInDays(date, new Date());
  if (days > 0 && days < 7) return `in ${days}d`;
  if (days < 0) return 'Past';
  return format(date, 'MMM d');
}

export default function UpcomingFeed({ events, cohorts, onEventClick, onCohortApply }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const items: FeedItem[] = useMemo(() => {
    const evs: FeedItem[] = events.map((e) => ({
      kind: 'event',
      id: `ev-${e.id}`,
      date: parseISO(e.start_date),
      raw: e,
    }));
    const cos: FeedItem[] = cohorts.map((c) => ({
      kind: 'cohort',
      id: `co-${c.id}`,
      date: c.application_deadline ? parseISO(c.application_deadline) : null,
      raw: c,
    }));
    const merged = [...evs, ...cos].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.getTime() - b.date.getTime();
    });
    return merged;
  }, [events, cohorts]);

  const counts = { all: items.length + 1, events: events.length, accelerators: cohorts.length + 1 };

  const filtered = useMemo(() => {
    if (filter === 'events') return items.filter((i) => i.kind === 'event');
    if (filter === 'accelerators') return items.filter((i) => i.kind === 'cohort');
    return items;
  }, [items, filter]);

  const chips: { key: Filter; label: string; icon: any; color: string }[] = [
    { key: 'all', label: 'All', icon: Layers, color: 'from-primary to-accent' },
    { key: 'events', label: 'Events', icon: CalendarIcon, color: 'from-fuchsia-500 to-pink-600' },
    { key: 'accelerators', label: 'Accelerators', icon: Rocket, color: 'from-emerald-500 to-teal-600' },
  ];

  const showInception = filter === 'all' || filter === 'accelerators';

  return (
    <Card className="tech-card border-0 overflow-hidden">
      {/* Slim header */}
      <div className="relative flex items-center justify-between gap-3 px-5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
            <Flame className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold tracking-tight">What's coming up</h3>
          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
            {filtered.length + (showInception ? 1 : 0)}
          </Badge>
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {chips.map((c) => {
            const Icon = c.icon;
            const active = filter === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={`relative shrink-0 inline-flex items-center gap-1.5 h-7 pl-2 pr-2.5 rounded-full text-[11px] font-semibold transition-all ${
                  active
                    ? 'text-white shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.6)]'
                    : 'text-muted-foreground hover:text-foreground bg-background/40 border border-border/60'
                }`}
              >
                {active && <span className={`absolute inset-0 rounded-full bg-gradient-to-r ${c.color}`} />}
                <span className="relative flex items-center gap-1.5">
                  <Icon className="h-3 w-3" />
                  {c.label}
                  <span className={`ml-0.5 ${active ? 'opacity-80' : 'opacity-60'}`}>{counts[c.key]}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-3 sm:p-4">
        {filtered.length === 0 && !showInception ? (
          <div className="text-center py-10">
            <div className="inline-flex h-12 w-12 rounded-2xl bg-primary/10 items-center justify-center mb-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Nothing scheduled — your calendar is clear.</p>
          </div>
        ) : (
          <div className="relative">
            {/* vertical rail */}
            <div className="absolute left-[58px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/30 via-border/40 to-transparent hidden sm:block" />

            <ul className="space-y-2">
              {showInception && (
                <li className="relative">
                  <div className="sm:pl-[88px]">
                    <NvidiaInceptionCard />
                  </div>
                </li>
              )}

              {filtered.map((item) => (
                <li key={item.id} className="relative group">
                  {/* Date stamp rail */}
                  <div className="hidden sm:flex absolute left-0 top-2 w-[68px] flex-col items-center">
                    {item.date ? (
                      <>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                          {format(item.date, 'MMM')}
                        </div>
                        <div className="text-xl font-bold leading-none bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
                          {format(item.date, 'd')}
                        </div>
                        <div className={`mt-1 text-[9px] font-semibold px-1.5 rounded-full ${
                          isToday(item.date)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {relativeLabel(item.date)}
                        </div>
                      </>
                    ) : (
                      <div className="text-[10px] text-muted-foreground">Open</div>
                    )}
                  </div>

                  {/* Connector dot */}
                  <span
                    className={`hidden sm:block absolute left-[55px] top-3 h-2 w-2 rounded-full ring-4 ring-background ${
                      item.kind === 'event' ? 'bg-fuchsia-500' : 'bg-emerald-500'
                    }`}
                  />

                  {/* Card */}
                  <div className="sm:pl-[88px]">
                    {item.kind === 'event' ? (
                      <EventRow event={item.raw} onClick={() => onEventClick(item.raw)} />
                    ) : (
                      <CohortRow cohort={item.raw} onApply={() => onCohortApply(item.raw)} />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function EventRow({ event, onClick }: { event: any; onClick: () => void }) {
  const date = parseISO(event.start_date);
  return (
    <button
      onClick={onClick}
      className="group/row w-full text-left rounded-xl border border-border/60 bg-background/30 backdrop-blur-xl hover:border-fuchsia-500/50 hover:bg-background/50 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      <div className="flex items-stretch gap-3">
        {/* Color stripe */}
        <div className="w-1 bg-gradient-to-b from-fuchsia-500 to-pink-600" />
        {/* Thumb */}
        <div className="relative w-20 sm:w-24 h-20 sm:h-24 shrink-0 my-2 rounded-lg overflow-hidden">
          {event.banner_url ? (
            <img src={event.banner_url} alt="" className="w-full h-full object-cover group-hover/row:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-fuchsia-500/30 to-pink-500/20 flex items-center justify-center">
              <CalendarIcon className="h-7 w-7 text-fuchsia-500/60" />
            </div>
          )}
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0 py-2.5 pr-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Badge className="text-[9px] py-0 px-1.5 h-4 bg-fuchsia-500/15 text-fuchsia-500 border-fuchsia-500/30 hover:bg-fuchsia-500/15">
              EVENT
            </Badge>
            <span className="text-[10px] text-muted-foreground sm:hidden">
              {format(date, 'MMM d')}
            </span>
          </div>
          <h4 className="font-semibold text-sm line-clamp-1 group-hover/row:text-primary transition-colors">
            {event.title}
          </h4>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(date, 'h:mm a')}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1 truncate max-w-[160px]">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event.attendees}{event.max_attendees ? `/${event.max_attendees}` : ''}
            </span>
          </div>
        </div>
        <ArrowRight className="self-center mr-3 h-4 w-4 text-muted-foreground/40 group-hover/row:text-primary group-hover/row:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}

function CohortRow({ cohort, onApply }: { cohort: any; onApply: () => void }) {
  const spotsLeft = (cohort.max_startups || 0) - (cohort.current_startups || 0);
  const deadline = cohort.application_deadline ? parseISO(cohort.application_deadline) : null;
  return (
    <div className="group/row w-full rounded-xl border border-border/60 bg-background/30 backdrop-blur-xl hover:border-emerald-500/50 hover:bg-background/50 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      <div className="flex items-stretch gap-3">
        <div className="w-1 bg-gradient-to-b from-emerald-500 to-teal-600" />
        <div className="relative w-20 sm:w-24 h-20 sm:h-24 shrink-0 my-2 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-500/20 to-teal-500/10 flex items-center justify-center">
          {cohort.accelerator_profiles?.logo_url ? (
            <img src={cohort.accelerator_profiles.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Rocket className="h-7 w-7 text-emerald-500/70" />
          )}
        </div>
        <div className="flex-1 min-w-0 py-2.5 pr-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Badge className="text-[9px] py-0 px-1.5 h-4 bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/15">
              ACCELERATOR
            </Badge>
            {spotsLeft > 0 && spotsLeft <= 5 && (
              <Badge className="text-[9px] py-0 px-1.5 h-4 bg-orange-500/15 text-orange-500 border-orange-500/30">
                {spotsLeft} left
              </Badge>
            )}
          </div>
          <h4 className="font-semibold text-sm line-clamp-1 group-hover/row:text-primary transition-colors">
            {cohort.name}
          </h4>
          <div className="text-[11px] text-muted-foreground line-clamp-1">
            {cohort.accelerator_profiles?.organization_name}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-muted-foreground">
            {deadline && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-500" />
                Apply by {format(deadline, 'MMM d')}
              </span>
            )}
            {cohort.focus_industries?.slice(0, 2).map((ind: string) => (
              <span key={ind} className="text-[10px] opacity-70">· {getIndustryLabel(ind)}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 pr-3">
          {cohort.accelerator_profiles?.external_link && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg"
              onClick={(e) => { e.stopPropagation(); window.open(cohort.accelerator_profiles.external_link, '_blank'); }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            onClick={onApply}
            className="h-8 rounded-lg gap-1 bg-gradient-to-br from-emerald-500 to-teal-600 hover:opacity-90 text-white border-0 shadow-[0_4px_14px_-4px_hsl(160_84%_39%/0.6)]"
          >
            <Rocket className="h-3 w-3" />
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}
