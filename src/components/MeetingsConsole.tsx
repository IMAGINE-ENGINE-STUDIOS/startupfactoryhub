import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import {
  Calendar, Clock, Video, MapPin, Check, X, Send, Inbox, History, List, Users, Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendarBookings, type CalendarBooking } from '@/hooks/useCalendarBookings';
import { useLiveRooms } from '@/hooks/useLiveRooms';
import MeetingsHubHeader from '@/components/MeetingsHubHeader';
import LiveRooms from '@/components/LiveRooms';
import VideoMeetingDialog from '@/components/VideoMeetingDialog';
import PitchMeetingsSection from '@/components/PitchMeetingsSection';

/**
 * MeetingsConsole — the modern Meetings tab (founder-approved design,
 * 2026-10-31): section chips (Upcoming / Incoming / Sent / Past) over the
 * REAL calendar_bookings data, a Live Now strip for rooms in session, and
 * the live room integrated in-tab — Join opens VideoMeetingDialog right
 * here instead of sending the user away. Each dashboard passes its own
 * header action (New Meeting / Schedule); pitch meetings and mentorship
 * panels merge into the same four sections via pitchSets + panels —
 * one section with all the data, no parallel lists.
 */

type Section = 'upcoming' | 'incoming' | 'sent' | 'past';
type View = 'list' | 'timeline';

export interface MeetingsPitchSet {
  meetings: any[];
  viewerType: 'startup' | 'investor';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onJoin?: (url: string) => void;
  onOutcomeChange?: (id: string, outcome: any) => void;
  onOpenTranscript?: (meta: any) => void;
}

interface SectionPanels {
  incoming?: ReactNode;
  sent?: ReactNode;
  upcoming?: ReactNode;
  past?: ReactNode;
}

interface Props {
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
  /** Pitch meetings (pitch_meetings table) merged into the same four sections. */
  pitchSets?: MeetingsPitchSet[];
  /** Extra panels per section (mentorship offers/sessions, mentees, offer board). */
  panels?: SectionPanels;
}

const GRADIENT_BTN =
  'bg-[linear-gradient(90deg,#0FD68F,#1FC8A9)] text-[#03301F] hover:opacity-90 shadow-[0_4px_16px_-6px_rgba(15,214,143,0.7)] border-0';

function roomSlug(link: string | null): string | null {
  if (!link) return null;
  try {
    const u = new URL(link, 'https://startupfactoryhub.com');
    return u.searchParams.get('room');
  } catch {
    return null;
  }
}

function startsIn(d: Date, now: Date): string {
  const diff = d.getTime() - now.getTime();
  const mins = Math.round(diff / 60000);
  if (mins <= 0) return 'Join window open';
  if (mins < 60) return `Starts in ${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `Starts in ${h}h ${mins % 60}m`;
  const days = Math.floor(h / 24);
  return `Starts in ${days}d ${h % 24}h`;
}

function dayLabel(d: Date): string {
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEEE, MMM d');
}

function DateBlock({ d }: { d: Date }) {
  return (
    <div className="w-[52px] shrink-0 self-start rounded-[14px] border border-border bg-muted/40 py-2 text-center">
      <span className="block text-[19px] font-bold leading-none">{format(d, 'd')}</span>
      <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
        {format(d, 'MMM')}
      </span>
    </div>
  );
}

function MetaChip({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px]',
        accent
          ? 'border-primary/30 bg-primary/[0.06] font-mono text-primary'
          : 'border-border bg-muted/30 text-muted-foreground'
      )}
    >
      {children}
    </span>
  );
}

export default function MeetingsConsole({ subtitle, icon, action, pitchSets, panels }: Props) {
  const { user } = useAuth();
  const { bookings, loading, updateBookingStatus } = useCalendarBookings();
  const { rooms, joinRoom } = useLiveRooms();
  const [section, setSection] = useState<Section>('upcoming');
  const [view, setView] = useState<View>('list');
  const [room, setRoom] = useState<{ link: string; title: string; hostId?: string } | null>(null);

  const now = useMemo(() => new Date(), [bookings]);
  const isHost = (b: CalendarBooking) => b.host_id === user?.id;

  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => b.status === 'confirmed' && new Date(b.scheduled_at) >= now)
        .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at)),
    [bookings, now]
  );
  const incoming = useMemo(
    () =>
      bookings
        .filter((b) => b.status === 'pending' && new Date(b.scheduled_at) >= now && isHost(b))
        .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookings, now, user?.id]
  );
  const sent = useMemo(
    () =>
      bookings
        .filter((b) => b.booker_id === user?.id)
        .sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at)),
    [bookings, user?.id]
  );
  const past = useMemo(
    () =>
      bookings
        .filter((b) => b.status !== 'pending' && new Date(b.scheduled_at) < now)
        .sort((a, b) => +new Date(b.scheduled_at) - +new Date(a.scheduled_at))
        .slice(0, 30),
    [bookings, now]
  );

  const liveNow = useMemo(() => rooms.filter((r) => r.participant_count > 0), [rooms]);

  const openBookingRoom = (b: CalendarBooking) => {
    if (!b.meeting_link) return;
    setRoom({ link: b.meeting_link, title: b.topic || 'Meeting', hostId: b.host_id });
  };

  const openLiveRoom = async (r: (typeof rooms)[number]) => {
    const ok = await joinRoom(r.id);
    if (ok) setRoom({ link: r.meeting_link, title: r.name, hostId: r.creator_id });
  };

  const pitchCounts = useMemo(() => {
    const counts = { upcoming: 0, incoming: 0, sent: 0, past: 0 };
    const nowMs = now.getTime();
    for (const ps of pitchSets ?? []) {
      const incomingKey = ps.viewerType === 'startup' ? 'investor_id' : 'startup_id';
      const sentKey = ps.viewerType === 'startup' ? 'startup_id' : 'investor_id';
      for (const m of ps.meetings) {
        const t = new Date(m.scheduled_date).getTime();
        if (m.status === 'pending' && m.host_id === m[incomingKey]) counts.incoming++;
        else if (m.status === 'pending' && m.host_id === m[sentKey]) counts.sent++;
        else if (m.status === 'scheduled' && t >= nowMs) counts.upcoming++;
        else if ((m.status === 'scheduled' || m.status === 'completed') && t < nowMs) counts.past++;
      }
    }
    return counts;
  }, [pitchSets, now]);

  const chips: { key: Section; label: string; count?: number; alert?: boolean }[] = [
    { key: 'upcoming', label: 'Upcoming', count: upcoming.length + pitchCounts.upcoming },
    { key: 'incoming', label: 'Incoming', count: incoming.length + pitchCounts.incoming, alert: incoming.length + pitchCounts.incoming > 0 },
    { key: 'sent', label: 'Sent', count: sent.filter((b) => b.status === 'pending').length + pitchCounts.sent },
    { key: 'past', label: 'Past', count: past.length + pitchCounts.past },
  ];

  const groupedUpcoming = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();
    for (const b of upcoming) {
      const key = dayLabel(new Date(b.scheduled_at));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return [...map.entries()];
  }, [upcoming]);

  const renderUpcomingCard = (b: CalendarBooking) => {
    const d = new Date(b.scheduled_at);
    const slug = roomSlug(b.meeting_link);
    const virtual = b.meeting_type === 'virtual';
    return (
      <article key={b.id} className="rounded-[18px] border border-border bg-card p-4 shadow-sm">
        <div className="flex gap-3.5">
          <DateBlock d={d} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-[16px] font-semibold leading-snug">{b.topic || 'Meeting'}</h3>
              <Badge variant="outline" className="border-primary/30 bg-primary/[0.06] text-primary">
                {startsIn(d, now)}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isHost(b) ? `Hosted by you · with ${b.booker_name}` : 'Booked by you'} ·{' '}
              {virtual ? 'SFH Live Video' : b.location || 'In person'}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <MetaChip>
                <Calendar className="h-3 w-3" /> {format(d, 'EEE, MMM d · h:mm a')}
              </MetaChip>
              <MetaChip>
                <Clock className="h-3 w-3" /> {b.duration_minutes} min
              </MetaChip>
              {virtual && slug && (
                <MetaChip accent>
                  <Video className="h-3 w-3" /> room · {slug}
                </MetaChip>
              )}
              {!virtual && b.location && (
                <MetaChip>
                  <MapPin className="h-3 w-3" /> {b.location}
                </MetaChip>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end justify-end gap-2">
            {virtual && b.meeting_link ? (
              <Button size="sm" className={cn('gap-1.5', GRADIENT_BTN)} onClick={() => openBookingRoom(b)}>
                <Video className="h-3.5 w-3.5" /> Join
              </Button>
            ) : null}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-4">
      <MeetingsHubHeader subtitle={subtitle} icon={icon} action={action} />

      {/* Section chips + view toggle — the reference design's left menu,
          promoted to a top row (founder: no left corner menu). */}
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => setSection(c.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors',
              section === c.key
                ? 'border-primary/40 bg-primary/10 text-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            {c.label}
            {typeof c.count === 'number' && c.count > 0 && (
              <span className="rounded-full border border-border bg-muted/40 px-1.5 py-px text-[10.5px] text-foreground">
                {c.count}
              </span>
            )}
            {c.alert && <span className="h-[7px] w-[7px] rounded-full bg-red-500" />}
          </button>
        ))}
        <div className="ml-auto flex rounded-xl border border-border bg-card p-[3px]">
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold',
              view === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground'
            )}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
          <button
            onClick={() => setView('timeline')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold',
              view === 'timeline' ? 'bg-muted text-foreground' : 'text-muted-foreground'
            )}
          >
            <Clock className="h-3.5 w-3.5" /> Timeline
          </button>
        </div>
      </div>

      {/* Live Now — a room in session, joinable without leaving the tab. */}
      {liveNow.length > 0 && section === 'upcoming' && (
        <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-primary/40 bg-primary/[0.05] px-4 py-3.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <div className="min-w-[200px] flex-1">
            <p className="text-[15px] font-bold leading-tight">{liveNow[0].name} — live now</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <Users className="mr-1 inline h-3 w-3" />
              {liveNow[0].participant_count} inside
              {liveNow.length > 1 ? ` · +${liveNow.length - 1} more live below` : ''}
            </p>
          </div>
          <Button size="sm" className={GRADIENT_BTN} onClick={() => openLiveRoom(liveNow[0])}>
            <Radio className="mr-1.5 h-3.5 w-3.5" /> Join — room opens here
          </Button>
        </div>
      )}

      {/* ------------------------------- UPCOMING ------------------------------- */}
      {section === 'upcoming' && (
        <div className="space-y-4">
          {loading ? null : upcoming.length === 0 && pitchCounts.upcoming === 0 && !panels?.upcoming ? (
            <div className="rounded-[18px] border border-border bg-card p-6 text-center">
              <Inbox className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No upcoming meetings yet — schedule one with the button above.
              </p>
            </div>
          ) : view === 'list' ? (
            groupedUpcoming.map(([label, items]) => (
              <div key={label} className="space-y-2.5">
                <p className="px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </p>
                {items.map(renderUpcomingCard)}
              </div>
            ))
          ) : (
            <div className="space-y-2.5">
              {upcoming.map((b) => {
                const d = new Date(b.scheduled_at);
                return (
                  <div key={b.id} className="flex gap-3.5">
                    <div className="w-16 shrink-0 pt-4 text-right text-xs text-muted-foreground">
                      {format(d, 'h:mm a')}
                    </div>
                    <div className="flex w-3.5 flex-col items-center">
                      <span className="mt-[18px] h-[11px] w-[11px] shrink-0 rounded-full border-2 border-primary bg-card" />
                      <span className="mt-1 w-[2px] flex-1 bg-border" />
                    </div>
                    <div className="flex-1 pb-1">{renderUpcomingCard(b)}</div>
                  </div>
                );
              })}
            </div>
          )}

          {pitchSets?.map((ps, i) => (
            <PitchMeetingsSection key={i} {...ps} bareView="upcoming" />
          ))}
          <LiveRooms />
          {panels?.upcoming}
        </div>
      )}

      {/* ------------------------------- INCOMING ------------------------------- */}
      {section === 'incoming' && (
        <div className="space-y-3">
          {incoming.length === 0 && pitchCounts.incoming === 0 && !panels?.incoming ? (
            <div className="rounded-[18px] border border-border bg-card p-6 text-center">
              <Inbox className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No meeting requests waiting on you.</p>
            </div>
          ) : (
            incoming.map((b) => {
              const d = new Date(b.scheduled_at);
              const slug = roomSlug(b.meeting_link);
              return (
                <article
                  key={b.id}
                  className="rounded-[18px] border border-border border-l-[3px] border-l-orange-400 bg-card p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[13px] font-bold text-primary">
                      {(b.booker_name || '?').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{b.booker_name}</p>
                      <p className="text-[11px] text-muted-foreground">invited you · {b.topic || 'Meeting'}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto border-orange-300 bg-orange-50 text-orange-600">
                      Needs reply
                    </Badge>
                  </div>
                  {b.notes && <p className="mt-3 text-[15px] font-medium leading-snug">“{b.notes}”</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <MetaChip>
                      <Calendar className="h-3 w-3" /> {format(d, 'EEE, MMM d · h:mm a')}
                    </MetaChip>
                    <MetaChip>
                      <Clock className="h-3 w-3" /> {b.duration_minutes} min
                    </MetaChip>
                    {b.meeting_type === 'virtual' && slug && (
                      <MetaChip accent>
                        <Video className="h-3 w-3" /> room · {slug}
                      </MetaChip>
                    )}
                    {b.meeting_type !== 'virtual' && b.location && (
                      <MetaChip>
                        <MapPin className="h-3 w-3" /> {b.location}
                      </MetaChip>
                    )}
                    <MetaChip accent>{startsIn(d, now)}</MetaChip>
                  </div>
                  <div className="mt-4 flex gap-2.5">
                    <Button className={cn('flex-1', GRADIENT_BTN)} onClick={() => updateBookingStatus(b.id, 'confirmed')}>
                      <Check className="mr-1.5 h-4 w-4" /> Accept
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => updateBookingStatus(b.id, 'cancelled')}>
                      <X className="mr-1.5 h-4 w-4" /> Decline
                    </Button>
                  </div>
                </article>
              );
            })
          )}
          {pitchSets?.map((ps, i) => (
            <PitchMeetingsSection key={i} {...ps} bareView="incoming" />
          ))}
          {panels?.incoming}
        </div>
      )}

      {/* --------------------------------- SENT --------------------------------- */}
      {section === 'sent' && (
        <div className="space-y-3">
          {sent.length === 0 && pitchCounts.sent === 0 && !panels?.sent ? (
            <div className="rounded-[18px] border border-border bg-card p-6 text-center">
              <Send className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">You haven't sent any meeting requests yet.</p>
            </div>
          ) : (
            sent.map((b) => {
              const d = new Date(b.scheduled_at);
              const slug = roomSlug(b.meeting_link);
              const future = d >= now;
              return (
                <article key={b.id} className="rounded-[18px] border border-border bg-card p-4 shadow-sm">
                  <div className="flex gap-3.5">
                    <DateBlock d={d} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-[16px] font-semibold leading-snug">{b.topic || 'Meeting'}</h3>
                        {b.status === 'pending' && (
                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-600">
                            <Clock className="mr-1 h-3 w-3" /> Pending
                          </Badge>
                        )}
                        {b.status === 'confirmed' && (
                          <Badge variant="outline" className="border-primary/30 bg-primary/[0.06] text-primary">
                            <Check className="mr-1 h-3 w-3" /> Accepted
                          </Badge>
                        )}
                        {b.status === 'cancelled' && (
                          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-500">
                            <X className="mr-1 h-3 w-3" /> Declined
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Request you sent · {format(d, 'EEE, MMM d · h:mm a')} · {b.duration_minutes} min
                        {b.meeting_type === 'virtual' ? ' · SFH Live Video' : b.location ? ` · ${b.location}` : ''}
                      </p>
                      {slug && b.meeting_type === 'virtual' && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          <MetaChip accent>
                            <Video className="h-3 w-3" /> room · {slug}
                          </MetaChip>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-end gap-2">
                      {b.status === 'confirmed' && future && b.meeting_type === 'virtual' && b.meeting_link && (
                        <Button size="sm" className={cn('gap-1.5', GRADIENT_BTN)} onClick={() => openBookingRoom(b)}>
                          <Video className="h-3.5 w-3.5" /> Join
                        </Button>
                      )}
                      {b.status === 'pending' && future && (
                        <Button size="sm" variant="outline" onClick={() => updateBookingStatus(b.id, 'cancelled')}>
                          <X className="mr-1 h-3.5 w-3.5" /> Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
          {pitchSets?.map((ps, i) => (
            <PitchMeetingsSection key={i} {...ps} bareView="sent" />
          ))}
          {panels?.sent}
        </div>
      )}

      {/* --------------------------------- PAST --------------------------------- */}
      {section === 'past' && (
        <div className="space-y-3">
          {past.length === 0 && pitchCounts.past === 0 && !panels?.past ? (
            <div className="rounded-[18px] border border-border bg-card p-6 text-center">
              <History className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No past meetings yet.</p>
            </div>
          ) : (
            past.map((b) => {
              const d = new Date(b.scheduled_at);
              return (
                <article key={b.id} className="rounded-[18px] border border-border bg-card p-4 opacity-90 shadow-sm">
                  <div className="flex gap-3.5">
                    <DateBlock d={d} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-[16px] font-semibold leading-snug">{b.topic || 'Meeting'}</h3>
                        {b.status === 'confirmed' || b.status === 'completed' ? (
                          <Badge variant="outline" className="border-primary/30 bg-primary/[0.06] text-primary">
                            <Check className="mr-1 h-3 w-3" /> Completed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{b.status}</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {format(d, 'EEE, MMM d, yyyy · h:mm a')} · {b.duration_minutes} min ·{' '}
                        {isHost(b) ? `with ${b.booker_name}` : 'Booked by you'} ·{' '}
                        {b.meeting_type === 'virtual' ? 'SFH Live Video' : b.location || 'In person'}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
          {pitchSets?.map((ps, i) => (
            <PitchMeetingsSection key={i} {...ps} bareView="past" />
          ))}
          {panels?.past}
        </div>
      )}

      {/* The room, integrated: opens inside the tab. */}
      <VideoMeetingDialog
        open={!!room}
        onOpenChange={(open) => !open && setRoom(null)}
        meetingLink={room?.link || ''}
        userId={user?.id}
        hostId={room?.hostId}
        userName={user?.user_metadata?.full_name}
        meetingTitle={room?.title}
      />
    </div>
  );
}
