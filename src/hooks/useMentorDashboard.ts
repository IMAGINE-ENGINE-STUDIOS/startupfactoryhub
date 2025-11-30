import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from './useRealtime';

interface MentorshipRelationship {
  id: string;
  mentee_id: string;
  status: string;
  goals: string | null;
  created_at: string;
  start_date: string | null;
  mentee: {
    full_name: string;
    avatar_url: string;
    user_id: string;
  };
  companies: {
    id: string;
    name: string;
    stage: string;
    industry: string;
    description: string;
    logo_url?: string;
    location?: string;
    website?: string;
    team_size?: number;
  } | null;
  hasUpcomingSessions?: boolean;
  hasRecentSessions?: boolean;
}

interface MentoringSession {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  topic: string | null;
  meeting_link: string | null;
  status: string;
  mentee: {
    full_name: string;
    user_id: string;
  };
  companies: {
    name: string;
  } | null;
}

export const useMentorDashboard = () => {
  const { user } = useAuth();
  const [mentorships, setMentorships] = useState<MentorshipRelationship[]>([]);
  const [todaySessions, setTodaySessions] = useState<MentoringSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMentorships = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mentorship_relationships')
      .select(`
        *,
        mentee:profiles!mentorship_relationships_mentee_id_fkey (
          full_name,
          avatar_url,
          user_id
        )
      `)
      .eq('mentor_id', user.id)
      .in('status', ['pending', 'active'])
      .order('status', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mentorships:', error);
      return;
    }

    // Fetch company info and session data for each mentee
    if (data) {
      const mentorshipsWithData = await Promise.all(
        data.map(async (mentorship: any) => {
          // Fetch company info
          const { data: companyData } = await supabase
            .from('companies')
            .select('id, name, description, stage, industry, logo_url, location, website, team_size')
            .eq('user_id', mentorship.mentee?.user_id)
            .maybeSingle();
          
          // Check for upcoming sessions
          const { data: upcomingSessions } = await supabase
            .from('mentoring_sessions')
            .select('id, scheduled_at')
            .eq('mentor_id', user.id)
            .eq('mentee_id', mentorship.mentee_id)
            .gte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(1);

          // Check for recent past sessions (within last 30 days)
          const { data: recentSessions } = await supabase
            .from('mentoring_sessions')
            .select('id, scheduled_at')
            .eq('mentor_id', user.id)
            .eq('mentee_id', mentorship.mentee_id)
            .gte('scheduled_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('scheduled_at', { ascending: false })
            .limit(1);
          
          return {
            ...mentorship,
            companies: companyData || null,
            hasUpcomingSessions: (upcomingSessions?.length || 0) > 0,
            hasRecentSessions: (recentSessions?.length || 0) > 0,
          };
        })
      );

      setMentorships(mentorshipsWithData as MentorshipRelationship[]);
    }
  };

  const fetchTodaySessions = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('mentoring_sessions')
      .select(`
        *,
        mentee:profiles!mentoring_sessions_mentee_id_fkey (
          full_name,
          user_id
        )
      `)
      .eq('mentor_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching today sessions:', error);
      return;
    }

    // Fetch company info for each mentee
    if (data) {
      const sessionsWithCompanies = await Promise.all(
        data.map(async (session: any) => {
          const { data: companyData } = await supabase
            .from('companies')
            .select('name')
            .eq('user_id', session.mentee?.user_id)
            .maybeSingle();
          
          return {
            ...session,
            companies: companyData || null
          };
        })
      );

      setTodaySessions(sessionsWithCompanies as MentoringSession[]);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchMentorships(), fetchTodaySessions()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user]);

  // Real-time subscriptions
  useRealtime({
    table: 'mentorship_relationships',
    onInsert: fetchMentorships,
    onUpdate: fetchMentorships,
    onDelete: fetchMentorships,
    filter: user ? `mentor_id=eq.${user.id}` : undefined,
  });

  useRealtime({
    table: 'mentoring_sessions',
    onInsert: fetchTodaySessions,
    onUpdate: fetchTodaySessions,
    onDelete: fetchTodaySessions,
    filter: user ? `mentor_id=eq.${user.id}` : undefined,
  });

  const pendingRequests = mentorships.filter(m => m.status === 'pending');
  const activeMentees = mentorships.filter(m => m.status === 'active');
  const pastMentees = mentorships.filter(m => m.status === 'completed' || m.status === 'ended');

  return {
    mentorships,
    pendingRequests,
    activeMentees,
    pastMentees,
    todaySessions,
    loading,
    refetch: () => Promise.all([fetchMentorships(), fetchTodaySessions()]),
  };
};