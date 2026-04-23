import { useState, useEffect } from 'react';
import { Users, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import CreateSessionDialog from './CreateSessionDialog';
import MentorshipSessionCard from './MentorshipSessionCard';
import { Badge } from './ui/badge';

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
  source: 'direct' | 'accelerator';
  acceleratorName?: string;
  focusArea?: string;
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
  onCountChange?: (count: number) => void;
}

export default function StartupActiveMentors({ onSessionScheduled, onJoin, onCountChange }: StartupActiveMentorsProps = {}) {
  const [mentors, setMentors] = useState<ActiveMentor[]>([]);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'startup_mentor_assignments',
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
          table: 'startup_advisor_assignments',
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

    // 1. Fetch direct mentorship relationships
    const { data: relationships, error } = await supabase
      .from('mentorship_relationships')
      .select('id, mentor_id, status, start_date')
      .eq('mentee_id', user.id)
      .eq('status', 'active')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching active mentors:', error);
    }

    // 2. Get user's company to find accelerator assignments
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let acceleratorMentorAssignments: any[] = [];
    let acceleratorAdvisorAssignments: any[] = [];

    if (company) {
      // 3. Get cohort startups for this company
      const { data: cohortStartups } = await supabase
        .from('cohort_startups')
        .select(`
          id,
          cohort:accelerator_cohorts(
            id,
            name,
            accelerator:accelerator_profiles(id, organization_name)
          )
        `)
        .eq('company_id', company.id);

      if (cohortStartups && cohortStartups.length > 0) {
        const cohortStartupIds = cohortStartups.map(cs => cs.id);

        // 4. Fetch mentor assignments from accelerator programs
        const { data: mentorAssigns } = await supabase
          .from('startup_mentor_assignments')
          .select('id, mentor_id, focus_area, assigned_at, status, cohort_startup_id')
          .in('cohort_startup_id', cohortStartupIds)
          .eq('status', 'active');

        // 5. Fetch advisor assignments from accelerator programs
        const { data: advisorAssigns } = await supabase
          .from('startup_advisor_assignments')
          .select('id, advisor_id, expertise_area, assigned_at, status, cohort_startup_id')
          .in('cohort_startup_id', cohortStartupIds)
          .eq('status', 'active');

        // Map assignments with accelerator info
        const cohortMap = new Map(cohortStartups.map(cs => [cs.id, cs.cohort]));
        
        acceleratorMentorAssignments = (mentorAssigns || []).map(a => ({
          ...a,
          acceleratorName: (cohortMap.get(a.cohort_startup_id) as any)?.accelerator?.organization_name || 'Accelerator Program'
        }));
        
        acceleratorAdvisorAssignments = (advisorAssigns || []).map(a => ({
          ...a,
          acceleratorName: (cohortMap.get(a.cohort_startup_id) as any)?.accelerator?.organization_name || 'Accelerator Program'
        }));
      }
    }

    // Collect all unique mentor/advisor IDs
    const directMentorIds = (relationships || []).map(r => r.mentor_id);
    const accelMentorIds = acceleratorMentorAssignments.map(a => a.mentor_id);
    const accelAdvisorIds = acceleratorAdvisorAssignments.map(a => a.advisor_id);
    const allMentorIds = [...new Set([...directMentorIds, ...accelMentorIds, ...accelAdvisorIds])];

    if (allMentorIds.length === 0) {
      setMentors([]);
      onCountChange?.(0);
      return;
    }

    // Fetch profiles for all mentors/advisors
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, bio')
      .in('user_id', allMentorIds);

    // Fetch roles from user_roles table
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', allMentorIds);

    // Fetch upcoming sessions
    const { data: sessions } = await supabase
      .from('mentoring_sessions')
      .select('*')
      .eq('mentee_id', user.id)
      .in('mentor_id', allMentorIds)
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

    // Build combined mentor list
    const allMentors: ActiveMentor[] = [];

    // Add direct mentorship relationships
    (relationships || []).forEach((rel) => {
      const profile = profileMap.get(rel.mentor_id);
      if (!profile || !profile.full_name) return;
      
      const nextSession = sessions?.find(s => s.mentor_id === rel.mentor_id);
      const userRoles = roleMap.get(rel.mentor_id) || [];
      const displayRole = userRoles.includes('advisor') ? 'advisor' : 
                         userRoles.includes('mentor') ? 'mentor' : 
                         userRoles[0] || 'mentor';
      allMentors.push({
        id: rel.id,
        mentor_id: rel.mentor_id,
        status: rel.status,
        start_date: rel.start_date,
        mentor: profile,
        role: displayRole,
        source: 'direct',
        nextSession: nextSession || undefined
      });
    });

    // Only add accelerator-assigned mentors if they have an active mentorship_relationship
    acceleratorMentorAssignments.forEach((assignment) => {
      // Skip if already added from direct relationships (which are already filtered by active status)
      if (allMentors.some(m => m.mentor_id === assignment.mentor_id)) return;
      
      // Skip if no active mentorship_relationship exists (must be accepted via pending offer)
      const hasActiveRelationship = relationships?.some(r => r.mentor_id === assignment.mentor_id);
      if (!hasActiveRelationship) return;

      const profile = profileMap.get(assignment.mentor_id);
      if (!profile || !profile.full_name) return;
      
      const nextSession = sessions?.find(s => s.mentor_id === assignment.mentor_id);
      allMentors.push({
        id: assignment.id,
        mentor_id: assignment.mentor_id,
        status: assignment.status,
        start_date: assignment.assigned_at,
        mentor: profile,
        role: 'mentor',
        source: 'accelerator',
        acceleratorName: assignment.acceleratorName,
        focusArea: assignment.focus_area,
        nextSession: nextSession || undefined
      });
    });

    // Only add accelerator-assigned advisors if they have an active mentorship_relationship
    acceleratorAdvisorAssignments.forEach((assignment) => {
      if (allMentors.some(m => m.mentor_id === assignment.advisor_id)) return;
      
      // Skip if no active mentorship_relationship exists (must be accepted via pending offer)
      const hasActiveRelationship = relationships?.some(r => r.mentor_id === assignment.advisor_id);
      if (!hasActiveRelationship) return;

      const profile = profileMap.get(assignment.advisor_id);
      if (!profile || !profile.full_name) return;
      
      const nextSession = sessions?.find(s => s.mentor_id === assignment.advisor_id);
      allMentors.push({
        id: assignment.id,
        mentor_id: assignment.advisor_id,
        status: assignment.status,
        start_date: assignment.assigned_at,
        mentor: profile,
        role: 'advisor',
        source: 'accelerator',
        acceleratorName: assignment.acceleratorName,
        focusArea: assignment.expertise_area,
        nextSession: nextSession || undefined
      });
    });

    setMentors(allMentors);
    onCountChange?.(allMentors.length);
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
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No active mentors</p>
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
            source: mentor.source,
            acceleratorName: mentor.acceleratorName,
            focusArea: mentor.focusArea,
            nextSession: mentor.nextSession,
          }}
          variant="active"
          onSchedule={() => {
            setSelectedMentorId(mentor.mentor_id);
            setSessionDialogOpen(true);
          }}
          onJoin={onJoin}
        />
      ))}

      <CreateSessionDialog 
        open={sessionDialogOpen} 
        onOpenChange={(open) => {
          setSessionDialogOpen(open);
          if (!open) setSelectedMentorId(null);
        }}
        onSessionCreated={handleSessionCreated}
        preSelectedMentorId={selectedMentorId || undefined}
      />
    </div>
  );
}
