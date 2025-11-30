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
    role: string;
    user_id: string;
  };
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
      .select(`
        *,
        mentor:profiles!mentorship_relationships_mentor_id_fkey (
          full_name,
          avatar_url,
          bio,
          role,
          user_id
        )
      `)
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
    const { data: sessions } = await supabase
      .from('mentoring_sessions')
      .select('*')
      .eq('mentee_id', user.id)
      .in('mentor_id', mentorIds)
      .gte('scheduled_at', new Date().toISOString())
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true });

    const mentorsWithSessions = relationships.map((rel: any) => {
      const nextSession = sessions?.find(s => s.mentor_id === rel.mentor_id);
      return {
        ...rel,
        nextSession: nextSession || null
      };
    });

    setMentors(mentorsWithSessions);
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
        return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
      case 'mentor':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (mentors.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-muted-foreground/20 bg-gradient-to-br from-muted/30 to-muted/10 p-8">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
            <Users className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">No active mentors</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Accept offers to start your mentorship journey</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mentors.map((mentor) => (
        <div 
          key={mentor.id} 
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5"
        >
          {/* Success indicator bar */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500" />
          
          <div className="p-4 pl-5 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="h-11 w-11 ring-2 ring-emerald-500/20 shadow-md">
                  <AvatarImage src={mentor.mentor?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-semibold">
                    {mentor.mentor?.full_name?.charAt(0) || 'M'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-background flex items-center justify-center">
                  <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">
                    {mentor.mentor?.full_name || 'Mentor'}
                  </h3>
                  <Badge variant="outline" className={`text-[10px] font-medium uppercase tracking-wide ${getRoleBadgeStyle(mentor.mentor?.role)}`}>
                    {mentor.mentor?.role || 'mentor'}
                  </Badge>
                </div>
                {mentor.mentor?.bio && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {mentor.mentor.bio}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground/70 mt-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Active {mentor.start_date ? formatDistanceToNow(new Date(mentor.start_date), { addSuffix: false }) : 'recently'}
                </p>
              </div>
            </div>

            {/* Next Session Card */}
            {mentor.nextSession && (
              <div className="rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-3 border border-emerald-500/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                      <Calendar className="h-3 w-3" />
                      <span>Next Session</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{mentor.nextSession.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(mentor.nextSession.scheduled_at), 'EEE, MMM d • h:mm a')}
                    </p>
                  </div>
                  {mentor.nextSession.meeting_link && (
                    <Button 
                      size="sm"
                      className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                      onClick={() => window.open(mentor.nextSession?.meeting_link, '_blank')}
                    >
                      <Video className="h-3.5 w-3.5 mr-1" />
                      Join
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex-1 h-9 text-xs"
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
                className="flex-1 h-9 text-xs border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                onClick={() => setSessionDialogOpen(true)}
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                Schedule Session
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
