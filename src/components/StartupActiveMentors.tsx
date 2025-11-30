import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, MessageCircle, Video, CheckCircle2, Star } from 'lucide-react';
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
    user_id: string;
  };
  mentorRole?: string;
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
      .select('*')
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

    // Get mentor IDs
    const mentorIds = relationships.map(r => r.mentor_id);
    
    // Fetch profiles, roles, and sessions in parallel
    const [{ data: profiles }, { data: rolesData }, { data: sessions }] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, bio')
        .in('user_id', mentorIds),
      supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', mentorIds)
        .in('role', ['mentor', 'advisor']),
      supabase
        .from('mentoring_sessions')
        .select('*')
        .eq('mentee_id', user.id)
        .in('mentor_id', mentorIds)
        .gte('scheduled_at', new Date().toISOString())
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true })
    ]);

    // Create maps
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    const roleMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

    const mentorsWithData = relationships.map((rel) => {
      const nextSession = sessions?.find(s => s.mentor_id === rel.mentor_id);
      return {
        ...rel,
        mentor: profileMap.get(rel.mentor_id) || { full_name: '', avatar_url: '', bio: '', user_id: rel.mentor_id },
        mentorRole: roleMap.get(rel.mentor_id) || 'mentor',
        nextSession: nextSession || null
      };
    });

    setMentors(mentorsWithData as ActiveMentor[]);
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
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 min-h-[180px] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center ring-1 ring-slate-700">
            <Users className="h-7 w-7 text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">No active mentors</p>
          <p className="text-xs text-slate-500 mt-1">Accept offers to start your mentorship journey</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mentors.map((mentor) => (
        <div 
          key={mentor.id} 
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-5 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10"
        >
          {/* Active indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500" />
          
          {/* Header with Avatar */}
          <div className="flex items-start gap-4 pl-2">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-emerald-500/30 shadow-lg">
                <AvatarImage src={mentor.mentor?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-lg">
                  {mentor.mentor?.full_name?.charAt(0) || 'M'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-slate-900 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg">
                {mentor.mentor?.full_name || 'Mentor'}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className="bg-slate-700/80 text-slate-200 border-0 text-[10px] uppercase tracking-wider font-medium">
                  {mentor.mentorRole || 'mentor'}
                </Badge>
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="font-medium">Active</span>
                </div>
              </div>
              {mentor.mentor?.bio && (
                <p className="text-slate-400 text-sm mt-2 line-clamp-1">
                  {mentor.mentor.bio}
                </p>
              )}
              <p className="text-slate-500 text-xs mt-1">
                Since {mentor.start_date ? formatDistanceToNow(new Date(mentor.start_date), { addSuffix: false }) : 'recently'} ago
              </p>
            </div>
          </div>

          {/* Next Session Card */}
          {mentor.nextSession && (
            <div className="ml-3 mt-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4 border border-emerald-500/20">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    <Calendar className="h-3 w-3" />
                    <span>Next Session</span>
                  </div>
                  <p className="text-white font-medium">{mentor.nextSession.topic}</p>
                  <p className="text-slate-400 text-sm">
                    {format(new Date(mentor.nextSession.scheduled_at), 'EEE, MMM d • h:mm a')}
                  </p>
                </div>
                {mentor.nextSession.meeting_link && (
                  <Button 
                    size="sm"
                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25"
                    onClick={() => window.open(mentor.nextSession?.meeting_link, '_blank')}
                  >
                    <Video className="h-4 w-4 mr-1.5" />
                    Join
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-5 pl-3">
            <Button 
              variant="outline"
              className="flex-1 h-10 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Direct messaging will be available soon",
                });
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button 
              className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25"
              onClick={() => setSessionDialogOpen(true)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
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