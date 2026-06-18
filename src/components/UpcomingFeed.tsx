import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Calendar as CalendarIcon, Clock, Users, MapPin, Rocket, Sparkles, ExternalLink, Layers } from 'lucide-react';
import { getIndustryLabel } from '@/lib/constants';
import NvidiaInceptionCard from '@/components/NvidiaInceptionCard';

type Filter = 'all' | 'events' | 'accelerators';

interface Props {
  events: any[];
  cohorts: any[];
  onEventClick: (e: any) => void;
  onCohortApply: (c: any) => void;
}

export default function UpcomingFeed({ events, cohorts, onEventClick, onCohortApply }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const counts = {
    all: events.length + cohorts.length + 1,
    events: events.length,
    accelerators: cohorts.length + 1,
  };

  const chips: { key: Filter; label: string; icon: any; color: string }[] = [
    { key: 'all', label: 'All Upcoming', icon: Layers, color: 'from-primary to-accent' },
    { key: 'events', label: 'Events', icon: CalendarIcon, color: 'from-fuchsia-500 to-pink-600' },
    { key: 'accelerators', label: 'Accelerators', icon: Rocket, color: 'from-emerald-500 to-teal-600' },
  ];

  const showEvents = filter === 'all' || filter === 'events';
  const showCohorts = filter === 'all' || filter === 'accelerators';

  const isEmpty = useMemo(() => {
    if (filter === 'events') return events.length === 0;
    if (filter === 'accelerators') return cohorts.length === 0;
    return events.length === 0 && cohorts.length === 0;
  }, [filter, events, cohorts]);

  return (
    <Card className="tech-card border-0 overflow-hidden">
      {/* Header */}
      <div className="relative overflow-hidden p-5 md:p-6 border-b border-border/40">
        <div className="absolute inset-0 pointer-events-none opacity-60">
          <div className="absolute -top-20 -left-10 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-accent/30 flex items-center justify-center ring-1 ring-primary/30">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                What's coming up
              </h3>
              <p className="text-xs text-muted-foreground">
                Events & accelerator cohorts in one stream
              </p>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {chips.map(c => {
              const Icon = c.icon;
              const active = filter === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setFilter(c.key)}
                  className={`relative shrink-0 inline-flex items-center gap-2 h-9 pl-3 pr-2 rounded-2xl border transition-all duration-300 ${
                    active
                      ? 'border-transparent text-white shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] scale-[1.02]'
                      : 'border-border/60 bg-background/40 backdrop-blur-xl text-muted-foreground hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  {active && <span className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${c.color}`} />}
                  <span className="relative flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold tracking-wide">{c.label}</span>
                    <span className={`ml-1 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-bold ${
                      active ? 'bg-white/25 text-white' : 'bg-primary/10 text-primary'
                    }`}>{counts[c.key]}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <CardContent className="p-5">
        {isEmpty ? (
          <div className="text-center py-12">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center mb-3">
              <CalendarIcon className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Nothing scheduled yet — check back soon.</p>
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-3">
              {/* Events */}
              {showEvents && events.slice(0, 10).map(event => (
                <button
                  key={`ev-${event.id}`}
                  onClick={() => onEventClick(event)}
                  className="group text-left flex-shrink-0 w-[280px] rounded-2xl overflow-hidden border border-border/60 bg-background/30 backdrop-blur-xl hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="relative h-36 overflow-hidden">
                    {event.banner_url ? (
                      <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-fuchsia-500/30 via-pink-500/20 to-primary/10 flex items-center justify-center">
                        <CalendarIcon className="h-12 w-12 text-fuchsia-500/50" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
                    <Badge className="absolute top-3 left-3 text-[10px] gap-1 bg-fuchsia-500/90 text-white border-0">
                      <CalendarIcon className="h-3 w-3" /> Event
                    </Badge>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="truncate">{format(parseISO(event.start_date), 'MMM d · h:mm a')}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Users className="h-3 w-3 shrink-0" />
                      <span>{event.attendees} attending{event.max_attendees ? ` / ${event.max_attendees}` : ''}</span>
                    </div>
                  </div>
                </button>
              ))}

              {/* Cohorts */}
              {showCohorts && <NvidiaInceptionCard />}
              {showCohorts && cohorts.map(cohort => {
                const spotsLeft = (cohort.max_startups || 0) - (cohort.current_startups || 0);
                return (
                  <div
                    key={`co-${cohort.id}`}
                    onClick={() => onCohortApply(cohort)}
                    className="group cursor-pointer flex-shrink-0 w-[300px] rounded-2xl overflow-hidden border border-border/60 bg-background/30 backdrop-blur-xl hover:border-emerald-500/50 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="relative h-24 overflow-hidden bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-primary/10">
                      <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl" />
                      <Badge className="absolute top-3 left-3 text-[10px] gap-1 bg-emerald-500/90 text-white border-0">
                        <Rocket className="h-3 w-3" /> Accelerator
                      </Badge>
                      {cohort.accelerator_profiles?.logo_url ? (
                        <img src={cohort.accelerator_profiles.logo_url} alt="" className="absolute bottom-3 right-3 h-12 w-12 rounded-xl object-cover ring-2 ring-background shadow-lg" />
                      ) : (
                        <div className="absolute bottom-3 right-3 h-12 w-12 rounded-xl bg-emerald-500/20 ring-2 ring-background flex items-center justify-center">
                          <Rocket className="h-5 w-5 text-emerald-500" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div>
                        <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{cohort.name}</h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {cohort.accelerator_profiles?.organization_name}
                        </p>
                      </div>
                      <div className="space-y-1">
                        {cohort.application_deadline && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3 text-orange-500 shrink-0" />
                            <span>Apply by {format(parseISO(cohort.application_deadline), 'MMM d')}</span>
                          </div>
                        )}
                        {cohort.max_startups && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Users className="h-3 w-3 shrink-0" />
                            <span>{spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}</span>
                          </div>
                        )}
                      </div>
                      {cohort.focus_industries && cohort.focus_industries.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {cohort.focus_industries.slice(0, 2).map((ind: string) => (
                            <Badge key={ind} variant="outline" className="text-[9px] px-1.5 py-0">
                              {getIndustryLabel(ind)}
                            </Badge>
                          ))}
                          {cohort.focus_industries.length > 2 && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">+{cohort.focus_industries.length - 2}</Badge>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 h-8 rounded-xl gap-1 bg-gradient-to-br from-emerald-500 to-teal-600 hover:opacity-90 text-white border-0"
                          onClick={(e) => { e.stopPropagation(); onCohortApply(cohort); }}
                        >
                          <Rocket className="h-3 w-3" />
                          Apply
                        </Button>
                        {cohort.accelerator_profiles?.external_link && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-xl"
                            onClick={(e) => { e.stopPropagation(); window.open(cohort.accelerator_profiles.external_link, '_blank'); }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
