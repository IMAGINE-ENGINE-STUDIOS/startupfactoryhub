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
  hasSessions?: boolean;
  totalSessions?: number;
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
      .select('*')
      .eq('mentor_id', user.id)
      .in('status', ['pending', 'active'])
      .order('status', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mentorships:', error);
      return;
    }

    // Fetch mentee profiles, company info and session data for each mentee
    if (data) {
      const mentorshipsWithData = await Promise.all(
        data.map(async (mentorship: any) => {
          // Fetch mentee profile
          const { data: menteeData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, user_id')
            .eq('user_id', mentorship.mentee_id)
            .maybeSingle();

          // Fetch company info
          const { data: companyData } = await supabase
            .from('companies')
            .select('id, name, description, stage, industry, logo_url, location, website, team_size')
            .eq('user_id', mentorship.mentee_id)
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

          // Fetch ALL sessions (scheduled or completed) for this mentee
          const { data: allSessions } = await supabase
            .from('mentoring_sessions')
            .select('id')
            .eq('mentor_id', user.id)
            .eq('mentee_id', mentorship.mentee_id)
            .in('status', ['scheduled', 'completed']);
          
          return {
            ...mentorship,
            mentee: menteeData || { full_name: 'Unknown', avatar_url: null, user_id: mentorship.mentee_id },
            companies: companyData || null,
            hasUpcomingSessions: (upcomingSessions?.length || 0) > 0,
            hasRecentSessions: (recentSessions?.length || 0) > 0,
            hasSessions: (allSessions?.length || 0) > 0,
            totalSessions: allSessions?.length || 0,
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
      .select('*')
      .eq('mentor_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching today sessions:', error);
      return;
    }

    // Fetch mentee profile and company info for each session
    if (data) {
      const sessionsWithData = await Promise.all(
        data.map(async (session: any) => {
          // Fetch mentee profile
          const { data: menteeData } = await supabase
            .from('profiles')
            .select('full_name, user_id')
            .eq('user_id', session.mentee_id)
            .maybeSingle();

          // Fetch company info
          const { data: companyData } = await supabase
            .from('companies')
            .select('name')
            .eq('user_id', session.mentee_id)
            .maybeSingle();
          
          return {
            ...session,
            mentee: menteeData || { full_name: 'Unknown', user_id: session.mentee_id },
            companies: companyData || null
          };
        })
      );

      setTodaySessions(sessionsWithData as MentoringSession[]);
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
  const activeMentees = mentorships.filter(m => m.status === 'active' && m.hasSessions === true);
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