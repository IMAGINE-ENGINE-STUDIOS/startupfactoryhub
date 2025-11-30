import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, Clock, History, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useRealtime } from '@/hooks/useRealtime';

interface SessionWithRating {
  id: string;
  scheduled_at: string;
  topic: string | null;
  duration_minutes: number;
  status: string;
  mentee: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  rating: number | null;
  feedback_text: string | null;
}

interface MentorSessionHistoryProps {
  showStats?: boolean;
}

export default function MentorSessionHistory({ showStats = true }: MentorSessionHistoryProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithRating[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalRatings: 0,
    averageRating: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);

  const fetchSessionHistory = async () => {
    if (!user) return;

    try {
      // Fetch completed sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('mentoring_sessions')
        .select(`
          id,
          scheduled_at,
          topic,
          duration_minutes,
          status,
          mentee_id
        `)
        .eq('mentor_id', user.id)
        .in('status', ['completed', 'scheduled'])
        .lt('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        return;
      }

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Fetch mentee profiles
      const menteeIds = [...new Set(sessionsData.map(s => s.mentee_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', menteeIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch feedback for these sessions
      const sessionIds = sessionsData.map(s => s.id);
      const { data: feedbackData } = await supabase
        .from('session_feedback')
        .select('session_id, rating, feedback_text')
        .in('session_id', sessionIds);

      const feedbackMap = new Map(feedbackData?.map(f => [f.session_id, f]) || []);

      // Combine data
      const enrichedSessions: SessionWithRating[] = sessionsData.map(session => ({
        id: session.id,
        scheduled_at: session.scheduled_at,
        topic: session.topic,
        duration_minutes: session.duration_minutes,
        status: session.status,
        mentee: profileMap.get(session.mentee_id) || null,
        rating: feedbackMap.get(session.id)?.rating || null,
        feedback_text: feedbackMap.get(session.id)?.feedback_text || null,
      }));

      setSessions(enrichedSessions);

      // Calculate stats
      const ratingsOnly = enrichedSessions.filter(s => s.rating !== null);
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      ratingsOnly.forEach(s => {
        if (s.rating && s.rating >= 1 && s.rating <= 5) {
          breakdown[s.rating as keyof typeof breakdown]++;
        }
      });

      const totalRating = ratingsOnly.reduce((sum, s) => sum + (s.rating || 0), 0);
      const avgRating = ratingsOnly.length > 0 ? totalRating / ratingsOnly.length : 0;

      setStats({
        totalSessions: sessionsData.length,
        totalRatings: ratingsOnly.length,
        averageRating: avgRating,
        ratingBreakdown: breakdown,
      });

    } catch (error) {
      console.error('Error fetching session history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionHistory();
  }, [user]);

  // Real-time subscription for feedback updates
  useRealtime({
    table: 'session_feedback',
    onInsert: fetchSessionHistory,
    onUpdate: fetchSessionHistory,
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading session history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Stats */}
      {showStats && stats.totalRatings > 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Mentor Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Average Rating */}
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div>
                  {renderStars(Math.round(stats.averageRating))}
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on {stats.totalRatings} rating{stats.totalRatings !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingBreakdown[rating as keyof typeof stats.ratingBreakdown];
                  const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2 text-sm">
                      <span className="w-3">{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Session History
            <Badge variant="secondary">{sessions.length}</Badge>
          </CardTitle>
          <CardDescription>
            Past sessions and ratings from your mentees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No completed sessions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session.mentee?.avatar_url || undefined} />
                    <AvatarFallback>
                      {session.mentee?.full_name?.[0] || 'M'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">
                        {session.mentee?.full_name || 'Mentee'}
                      </h4>
                      {session.rating && (
                        <div className="flex items-center gap-1">
                          {renderStars(session.rating)}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {session.topic || 'Mentoring Session'}
                    </p>
                    {session.feedback_text && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1 italic">
                        "{session.feedback_text}"
                      </p>
                    )}
                  </div>

                  <div className="text-right text-sm text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(session.scheduled_at), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.duration_minutes} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
