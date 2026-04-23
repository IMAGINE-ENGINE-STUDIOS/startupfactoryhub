import { useState, useEffect } from 'react';
import { Calendar, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SessionRatingDialog } from './SessionRatingDialog';
import MentorshipSessionCard from './MentorshipSessionCard';

interface MentoringSession {
  id: string;
  mentor_id: string;
  scheduled_at: string;
  topic: string;
  status: string;
  meeting_link?: string;
  mentor: {
    full_name: string;
    avatar_url: string;
  };
  role: string;
  hasRated: boolean;
}

interface StartupMentoringSessionsProps {
  type: 'upcoming' | 'past';
  onSessionUpdated?: () => void;
  onJoin?: (meetingLink: string) => void;
  onCountChange?: (count: number) => void;
  onOpenTranscript?: (session: { id: string; topic?: string; mentor_id?: string; mentor: { full_name: string } }) => void;
}

export default function StartupMentoringSessions({ type, onSessionUpdated, onJoin, onCountChange, onOpenTranscript }: StartupMentoringSessionsProps) {
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<MentoringSession | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, type]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`startup-sessions-${type}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentoring_sessions',
          filter: `mentee_id=eq.${user.id}`,
        },
        () => {
          fetchSessions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_feedback',
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, type]);

  const fetchSessions = async () => {
    if (!user) return;

    const now = new Date().toISOString();
    
    let query = supabase
      .from('mentoring_sessions')
      .select('id, mentor_id, scheduled_at, topic, status, meeting_link')
      .eq('mentee_id', user.id);

    if (type === 'upcoming') {
      query = query
        .gte('scheduled_at', now)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });
    } else {
      query = query
        .lt('scheduled_at', now)
        .order('scheduled_at', { ascending: false });
    }

    const { data: sessionsData, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return;
    }

    if (!sessionsData || sessionsData.length === 0) {
      setSessions([]);
      onCountChange?.(0);
      return;
    }

    const mentorIds = [...new Set(sessionsData.map(s => s.mentor_id))];
    const sessionIds = sessionsData.map(s => s.id);

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', mentorIds);

    // Fetch roles from user_roles table
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', mentorIds);

    // Fetch existing ratings for past sessions
    let feedbackData: any[] = [];
    if (type === 'past') {
      const { data: feedback } = await supabase
        .from('session_feedback')
        .select('session_id')
        .in('session_id', sessionIds)
        .eq('given_by', user.id);
      feedbackData = feedback || [];
    }

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
    const ratedSessionIds = new Set(feedbackData.map(f => f.session_id));

    const enrichedSessions = sessionsData
      .map((session) => {
        const profile = profileMap.get(session.mentor_id);
        // Skip if no valid profile exists
        if (!profile || !profile.full_name) return null;
        
        return {
          ...session,
          mentor: profile,
          role: roleMap.get(session.mentor_id) || 'mentor',
          hasRated: ratedSessionIds.has(session.id),
        };
      })
      .filter(Boolean); // Remove null entries

    // Filter out already rated sessions for past view
    const filteredSessions = type === 'past' 
      ? enrichedSessions.filter(s => !s.hasRated)
      : enrichedSessions;

    setSessions(filteredSessions as MentoringSession[]);
    onCountChange?.((filteredSessions as MentoringSession[]).length);
  };

  const handleRateSession = (session: MentoringSession) => {
    setSelectedSession(session);
    setRatingDialogOpen(true);
  };

  const handleRatingSubmitted = () => {
    fetchSessions();
    if (onSessionUpdated) {
      onSessionUpdated();
    }
    toast({
      title: 'Rating Submitted',
      description: 'Your feedback helps mentors improve',
    });
  };

  const EmptyState = () => (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {type === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
        </p>
      </div>
    </div>
  );

  if (sessions.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="space-y-3">
        {sessions.map((session) => (
          <MentorshipSessionCard
            key={session.id}
            session={{
              id: session.id,
              scheduled_at: session.scheduled_at,
              topic: session.topic,
              meeting_link: session.meeting_link,
              hasRated: session.hasRated,
              mentor: session.mentor,
              role: session.role,
            }}
            variant={type}
            onJoin={onJoin}
            onRate={handleRateSession}
          />
        ))}
      </div>

      {selectedSession && (
        <SessionRatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          sessionId={selectedSession.id}
          sessionTopic={selectedSession.topic}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </>
  );
}
