import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import CreateSessionDialog from './CreateSessionDialog';
import MentorshipSessionCard from './MentorshipSessionCard';

interface ActiveMentor {
  id: string;
  mentor_id: string;
  status: string;
  start_date: string;
  mentor: {
    full_name: string;
    avatar_url: string;
    bio: string;
  };
  role: string;
  nextSession?: {
    id: string;
    scheduled_at: string;
    topic: string;
    meeting_link?: string;
  };
}

interface StartupActiveMentorsProps {
  onSessionScheduled?: () => void;
  onJoin?: (meetingLink: string) => void;
}

export default function StartupActiveMentors({ onSessionScheduled, onJoin }: StartupActiveMentorsProps = {}) {
  const [mentors, setMentors] = useState<ActiveMentor[]>([]);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchActiveMentors();
    }
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('startup-active-mentors')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentorship_relationships',
          filter: `mentee_id=eq.${user.id}`,
        },
        () => {
          fetchActiveMentors();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentoring_sessions',
          filter: `mentee_id=eq.${user.id}`,
        },
        () => {
          fetchActiveMentors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchActiveMentors = async () => {
    if (!user) return;

    const { data: relationships, error } = await supabase
      .from('mentorship_relationships')
      .select('id, mentor_id, status, start_date')
      .eq('mentee_id', user.id)
      .eq('status', 'active')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching active mentors:', error);
      return;
    }

    if (!relationships || relationships.length === 0) {
      setMentors([]);
      return;
    }

    const mentorIds = relationships.map(r => r.mentor_id);

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, bio')
      .in('user_id', mentorIds);

    // Fetch roles from user_roles table
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', mentorIds);

    // Fetch upcoming sessions
    const { data: sessions } = await supabase
      .from('mentoring_sessions')
      .select('*')
      .eq('mentee_id', user.id)
      .in('mentor_id', mentorIds)
      .gte('scheduled_at', new Date().toISOString())
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true });

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    // Create a map that stores all roles for each user
    const roleMap = new Map<string, string[]>();
    roles?.forEach(r => {
      const existingRoles = roleMap.get(r.user_id) || [];
      roleMap.set(r.user_id, [...existingRoles, r.role]);
    });

    const mentorsWithSessions = relationships.map((rel) => {
      const nextSession = sessions?.find(s => s.mentor_id === rel.mentor_id);
      const userRoles = roleMap.get(rel.mentor_id) || [];
      // Prefer 'advisor' role over 'mentor'
      const displayRole = userRoles.includes('advisor') ? 'advisor' : 
                         userRoles.includes('mentor') ? 'mentor' : 
                         userRoles[0] || 'mentor';
      return {
        ...rel,
        mentor: profileMap.get(rel.mentor_id) || { full_name: 'Unknown', avatar_url: null, bio: null },
        role: displayRole,
        nextSession: nextSession || null
      };
    });

    setMentors(mentorsWithSessions as ActiveMentor[]);
  };

  const handleSessionCreated = () => {
    setSessionDialogOpen(false);
    fetchActiveMentors();
    if (onSessionScheduled) {
      onSessionScheduled();
    }
  };

  if (mentors.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[140px] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
            <Users className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No active mentors</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Accept offers to start your mentorship journey</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mentors.map((mentor) => (
        <MentorshipSessionCard
          key={mentor.id}
          session={{
            id: mentor.id,
            start_date: mentor.start_date,
            mentor: mentor.mentor,
            role: mentor.role,
            nextSession: mentor.nextSession,
          }}
          variant="active"
          onSchedule={() => setSessionDialogOpen(true)}
          onJoin={onJoin}
        />
      ))}

      <CreateSessionDialog 
        open={sessionDialogOpen} 
        onOpenChange={setSessionDialogOpen}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  );
}
