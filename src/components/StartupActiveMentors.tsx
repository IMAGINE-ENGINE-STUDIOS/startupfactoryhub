import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, MessageCircle, Video, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CreateSessionDialog from './CreateSessionDialog';
import { format, formatDistanceToNow } from 'date-fns';

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
}

export default function StartupActiveMentors({ onSessionScheduled }: StartupActiveMentorsProps = {}) {
  const [mentors, setMentors] = useState<ActiveMentor[]>([]);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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
    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    const mentorsWithSessions = relationships.map((rel) => {
      const nextSession = sessions?.find(s => s.mentor_id === rel.mentor_id);
      return {
        ...rel,
        mentor: profileMap.get(rel.mentor_id) || { full_name: 'Unknown', avatar_url: null, bio: null },
        role: roleMap.get(rel.mentor_id) || 'mentor',
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
        <div 
          key={mentor.id} 
          className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-md hover:border-emerald-500/30"
        >
          <div className="border-l-2 border-emerald-500 p-4">
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10 ring-2 ring-emerald-500/20">
                  <AvatarImage src={mentor.mentor?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-sm font-semibold">
                    {mentor.mentor?.full_name?.charAt(0) || 'M'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background flex items-center justify-center">
                  <CheckCircle2 className="h-2 w-2 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-sm text-foreground truncate">
                    {mentor.mentor?.full_name || 'Mentor'}
                  </h4>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-medium uppercase tracking-wide ${getRoleBadgeStyle(mentor.role)}`}>
                    {mentor.role || 'mentor'}
                  </Badge>
                </div>
                {mentor.mentor?.bio && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {mentor.mentor.bio}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Active {mentor.start_date ? formatDistanceToNow(new Date(mentor.start_date), { addSuffix: false }) : 'recently'}
                </p>
              </div>
            </div>

            {/* Next Session */}
            {mentor.nextSession && (
              <div className="mt-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Next Session
                    </p>
                    <p className="text-xs font-medium text-foreground mt-0.5 truncate">{mentor.nextSession.topic}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(mentor.nextSession.scheduled_at), 'EEE, MMM d • h:mm a')}
                    </p>
                  </div>
                  {mentor.nextSession.meeting_link && (
                    <Button 
                      size="sm"
                      className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
                      onClick={() => window.open(mentor.nextSession?.meeting_link, '_blank')}
                    >
                      <Video className="h-3 w-3 mr-1" />
                      Join
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => {
                  toast({
                    title: "Coming Soon",
                    description: "Direct messaging will be available soon",
                  });
                }}
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                Message
              </Button>
              <Button 
                variant="outline"
                size="sm" 
                className="flex-1 h-8 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                onClick={() => setSessionDialogOpen(true)}
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Schedule
              </Button>
            </div>
          </div>
        </div>
      ))}

      <CreateSessionDialog 
        open={sessionDialogOpen} 
        onOpenChange={setSessionDialogOpen}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  );
}