import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Video, Clock, Star, CheckCircle2, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SessionRatingDialog } from './SessionRatingDialog';
import { format, formatDistanceToNow, isPast } from 'date-fns';

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
}

export default function StartupMentoringSessions({ type, onSessionUpdated }: StartupMentoringSessionsProps) {
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

    const enrichedSessions = sessionsData.map((session) => ({
      ...session,
      mentor: profileMap.get(session.mentor_id) || { full_name: 'Unknown', avatar_url: null },
      role: roleMap.get(session.mentor_id) || 'mentor',
      hasRated: ratedSessionIds.has(session.id),
    }));

    setSessions(enrichedSessions as MentoringSession[]);
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

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'advisor':
        return 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400';
      case 'mentor':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const EmptyState = () => (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[140px] flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
          {type === 'upcoming' ? (
            <Calendar className="h-5 w-5 text-muted-foreground/50" />
          ) : (
            <History className="h-5 w-5 text-muted-foreground/50" />
          )}
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {type === 'upcoming' ? 'No upcoming sessions' : 'No past sessions'}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          {type === 'upcoming' ? 'Schedule sessions with your mentors' : 'Completed sessions will appear here'}
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
          <div 
            key={session.id} 
            className={`rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-md ${
              type === 'upcoming' 
                ? 'hover:border-emerald-500/30' 
                : 'hover:border-muted-foreground/30'
            }`}
          >
            <div className={`border-l-2 ${type === 'upcoming' ? 'border-emerald-500' : 'border-muted-foreground/30'} p-4`}>
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <Avatar className={`h-10 w-10 ring-2 ${type === 'upcoming' ? 'ring-emerald-500/20' : 'ring-muted/30'}`}>
                    <AvatarImage src={session.mentor?.avatar_url} />
                    <AvatarFallback className={`text-white text-sm font-semibold ${
                      type === 'upcoming' 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500' 
                        : 'bg-gradient-to-br from-muted-foreground to-muted'
                    }`}>
                      {session.mentor?.full_name?.charAt(0) || 'M'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm text-foreground truncate">
                      {session.mentor?.full_name || 'Mentor'}
                    </h4>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-medium uppercase tracking-wide ${getRoleBadgeStyle(session.role)}`}>
                      {session.role || 'mentor'}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-foreground mt-1 line-clamp-1">
                    {session.topic}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(session.scheduled_at), 'EEE, MMM d • h:mm a')}
                    {type === 'past' && (
                      <span className="text-muted-foreground/60 ml-1">
                        ({formatDistanceToNow(new Date(session.scheduled_at), { addSuffix: true })})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                {type === 'upcoming' && session.meeting_link && (
                  <Button 
                    size="sm"
                    className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => window.open(session.meeting_link, '_blank')}
                  >
                    <Video className="h-3.5 w-3.5 mr-1.5" />
                    Join Meeting
                  </Button>
                )}
                {type === 'past' && !session.hasRated && (
                  <Button 
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                    onClick={() => handleRateSession(session)}
                  >
                    <Star className="h-3.5 w-3.5 mr-1.5" />
                    Rate Session
                  </Button>
                )}
                {type === 'past' && session.hasRated && (
                  <div className="flex-1 h-8 flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="font-medium">Rated</span>
                  </div>
                )}
              </div>
            </div>
          </div>
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
