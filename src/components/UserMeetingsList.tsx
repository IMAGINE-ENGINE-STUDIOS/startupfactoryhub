import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO, isFuture, isPast } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Users, Video, FileText, Loader2, Briefcase, GraduationCap, CalendarDays } from 'lucide-react';
import MeetingTranscriptDialog, { type MeetingTranscriptMeta } from './MeetingTranscriptDialog';

type Filter = 'upcoming' | 'past' | 'all';

interface UnifiedMeeting {
  id: string;
  meeting_id: string;
  meeting_type: MeetingTranscriptMeta['meeting_type'];
  title: string;
  scheduled_at: string;
  meeting_link?: string | null;
  duration_minutes?: number | null;
  host_id: string;
  participant_ids: string[];
  source_label: string;
  icon: 'session' | 'pitch' | 'booking';
}

export default function UserMeetingsList({ defaultFilter = 'all' as Filter }: { defaultFilter?: Filter }) {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<UnifiedMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>(defaultFilter);
  const [transcriptMeta, setTranscriptMeta] = useState<MeetingTranscriptMeta | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const [sessions, pitches, bookings] = await Promise.all([
        supabase
          .from('mentoring_sessions')
          .select('id, mentor_id, mentee_id, host_id, scheduled_at, topic, duration_minutes, meeting_link, status')
          .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`),
        supabase
          .from('pitch_meetings')
          .select('id, startup_id, investor_id, host_id, scheduled_date, duration_minutes, meeting_link, status')
          .or(`startup_id.eq.${user.id},investor_id.eq.${user.id}`),
        supabase
          .from('calendar_bookings')
          .select('id, host_id, booker_id, scheduled_at, topic, duration_minutes, meeting_link, status')
          .or(`host_id.eq.${user.id},booker_id.eq.${user.id}`),
      ]);

      const merged: UnifiedMeeting[] = [];

      (sessions.data || []).forEach((s: any) => {
        merged.push({
          id: `s-${s.id}`,
          meeting_id: s.id,
          meeting_type: 'mentoring_session',
          title: s.topic || 'Mentoring Session',
          scheduled_at: s.scheduled_at,
          meeting_link: s.meeting_link,
          duration_minutes: s.duration_minutes,
          host_id: s.host_id || s.mentor_id,
          participant_ids: [s.mentor_id, s.mentee_id].filter(Boolean),
          source_label: 'Mentoring',
          icon: 'session',
        });
      });

      (pitches.data || []).forEach((p: any) => {
        merged.push({
          id: `p-${p.id}`,
          meeting_id: p.id,
          meeting_type: 'pitch_meeting',
          title: 'Pitch Meeting',
          scheduled_at: p.scheduled_date,
          meeting_link: p.meeting_link,
          duration_minutes: p.duration_minutes,
          host_id: p.host_id || p.investor_id,
          participant_ids: [p.startup_id, p.investor_id].filter(Boolean),
          source_label: 'Pitch',
          icon: 'pitch',
        });
      });

      (bookings.data || []).forEach((b: any) => {
        merged.push({
          id: `b-${b.id}`,
          meeting_id: b.id,
          meeting_type: 'calendar_booking',
          title: b.topic || 'Calendar Booking',
          scheduled_at: b.scheduled_at,
          meeting_link: b.meeting_link,
          duration_minutes: b.duration_minutes,
          host_id: b.host_id,
          participant_ids: [b.host_id, b.booker_id].filter(Boolean),
          source_label: 'Booking',
          icon: 'booking',
        });
      });

      merged.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
      if (mounted) {
        setMeetings(merged);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  const filtered = meetings.filter((m) => {
    if (filter === 'all') return true;
    const d = new Date(m.scheduled_at);
    return filter === 'upcoming' ? isFuture(d) : isPast(d);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {(['upcoming', 'past', 'all'] as Filter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} meetings</span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            No {filter !== 'all' ? filter : ''} meetings found.
          </div>
        ) : (
          <ScrollArea className="max-h-[480px] pr-2">
            <div className="space-y-2">
              {filtered.map((m) => {
                const Icon = m.icon === 'pitch' ? Briefcase : m.icon === 'session' ? GraduationCap : CalendarDays;
                const past = isPast(new Date(m.scheduled_at));
                return (
                  <Card key={m.id} className="tech-card border-0">
                    <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-medium truncate">{m.title}</h4>
                            <Badge variant="outline" className="text-[10px] py-0">{m.source_label}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(m.scheduled_at), 'MMM d, h:mm a')}
                            </span>
                            {m.duration_minutes && <span>{m.duration_minutes} min</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:ml-auto">
                        {m.meeting_link && !past && (
                          <Button size="sm" variant="outline" onClick={() => window.open(m.meeting_link!, '_blank')}>
                            <Video className="h-3.5 w-3.5 mr-1" /> Join
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={past ? 'default' : 'outline'}
                          onClick={() => {
                            setTranscriptMeta({
                              meeting_id: m.meeting_id,
                              meeting_type: m.meeting_type,
                              host_id: m.host_id,
                              participant_ids: m.participant_ids,
                              title: m.title,
                            });
                            setOpenDialog(true);
                          }}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1" /> Transcript
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      <MeetingTranscriptDialog open={openDialog} onOpenChange={setOpenDialog} meta={transcriptMeta} />
    </>
  );
}
