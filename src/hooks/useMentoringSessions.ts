import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from './useRealtime';

interface MentoringSession {
  id: string;
  mentor_id: string;
  mentee_id: string;
  scheduled_at: string;
  duration_minutes: number;
  topic: string;
  description?: string;
  meeting_link?: string;
  status: string;
  notes?: string;
  created_at: string;
  mentor_profile?: {
    full_name: string;
    avatar_url?: string;
  };
  mentee_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

export const useMentoringSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSessions = async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First fetch sessions
      const { data: sessionsData, error: fetchError } = await supabase
        .from('mentoring_sessions')
        .select('*')
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
        .order('scheduled_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Then fetch profiles for mentors and mentees
      const mentorIds = [...new Set((sessionsData || []).map(s => s.mentor_id))];
      const menteeIds = [...new Set((sessionsData || []).map(s => s.mentee_id))];
      const allUserIds = [...new Set([...mentorIds, ...menteeIds])];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', allUserIds);

      if (profilesError) throw profilesError;

      // Map profiles to sessions
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );

      const data = (sessionsData || []).map(session => ({
        ...session,
        mentor_profile: profilesMap.get(session.mentor_id),
        mentee_profile: profilesMap.get(session.mentee_id),
      }));

      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching mentoring sessions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch sessions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  // Real-time updates
  useRealtime({
    table: 'mentoring_sessions',
    onInsert: (payload) => {
      if (payload.mentor_id === user?.id || payload.mentee_id === user?.id) {
        fetchSessions();
      }
    },
    onUpdate: (payload) => {
      if (payload.mentor_id === user?.id || payload.mentee_id === user?.id) {
        fetchSessions();
      }
    },
    onDelete: (payload) => {
      if (payload.mentor_id === user?.id || payload.mentee_id === user?.id) {
        setSessions(prev => prev.filter(s => s.id !== payload.id));
      }
    },
  });

  const createSession = async (sessionData: {
    mentor_id: string;
    mentee_id: string;
    scheduled_at: string;
    duration_minutes: number;
    topic: string;
    description?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('mentoring_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      
      fetchSessions();
      return { data, error: null };
    } catch (err) {
      console.error('Error creating session:', err);
      return { data: null, error: err as Error };
    }
  };

  const updateSession = async (sessionId: string, updates: Partial<MentoringSession>) => {
    try {
      const { data, error } = await supabase
        .from('mentoring_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      
      fetchSessions();
      return { data, error: null };
    } catch (err) {
      console.error('Error updating session:', err);
      return { data: null, error: err as Error };
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('mentoring_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      
      fetchSessions();
      return { error: null };
    } catch (err) {
      console.error('Error deleting session:', err);
      return { error: err as Error };
    }
  };

  const upcomingSessions = sessions.filter(
    s => new Date(s.scheduled_at) > new Date() && s.status !== 'completed' && s.status !== 'cancelled'
  );

  const pastSessions = sessions.filter(
    s => new Date(s.scheduled_at) <= new Date() || s.status === 'completed'
  );

  return {
    sessions,
    upcomingSessions,
    pastSessions,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    refetch: fetchSessions,
  };
};
