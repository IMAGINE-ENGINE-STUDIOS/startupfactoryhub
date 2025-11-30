import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar, MessageCircle, Video, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CreateSessionDialog from './CreateSessionDialog';
import { format } from 'date-fns';

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
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchActiveMentors();
    }
  }, [user]);

  const fetchActiveMentors = async () => {
    if (!user) return;

    // Fetch active mentorship relationships
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

    // Fetch upcoming sessions for each mentor
    const mentorIds = relationships.map(r => r.mentor_id);
    const { data: sessions } = await supabase
      .from('mentoring_sessions')
      .select('*')
      .eq('mentee_id', user.id)
      .in('mentor_id', mentorIds)
      .gte('scheduled_at', new Date().toISOString())
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true });

    // Map sessions to mentors
    const mentorsWithSessions = relationships.map((rel: any) => {
      const nextSession = sessions?.find(s => s.mentor_id === rel.mentor_id);
      return {
        ...rel,
        nextSession: nextSession || null
      };
    });

    setMentors(mentorsWithSessions);
  };

  const handleScheduleSession = (mentorId: string) => {
    setSelectedMentorId(mentorId);
    setSessionDialogOpen(true);
  };

  const handleSessionCreated = () => {
    setSessionDialogOpen(false);
    setSelectedMentorId(null);
    fetchActiveMentors();
    if (onSessionScheduled) {
      onSessionScheduled();
    }
  };

  if (mentors.length === 0) {
    return (
      <div className="text-center py-8 rounded-xl border border-dashed border-muted-foreground/20">
        <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">No active mentors yet</p>
        <p className="text-xs text-muted-foreground mt-1">Accept mentor offers to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mentors.map((mentor) => (
        <Card key={mentor.id} className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Mentor Info */}
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={mentor.mentor?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                    {mentor.mentor?.full_name?.charAt(0) || 'M'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {mentor.mentor?.full_name || 'Mentor'}
                    </h3>
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30">
                      Active
                    </Badge>
                  </div>
                  {mentor.mentor?.bio && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {mentor.mentor.bio}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Since {mentor.start_date ? format(new Date(mentor.start_date), 'MMM d, yyyy') : 'Recently'}
                  </p>
                </div>
              </div>

              {/* Next Session Info */}
              {mentor.nextSession && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Clock className="h-3 w-3 text-emerald-500" />
                    <span>Next Session</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{mentor.nextSession.topic}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(mentor.nextSession.scheduled_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                    {mentor.nextSession.meeting_link && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-1"
                        onClick={() => window.open(mentor.nextSession?.meeting_link, '_blank')}
                      >
                        <Video className="h-3 w-3" />
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    // Navigate to messages with this mentor
                    toast({
                      title: "Coming Soon",
                      description: "Direct messaging will be available soon",
                    });
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleScheduleSession(mentor.mentor_id)}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <CreateSessionDialog 
        open={sessionDialogOpen} 
        onOpenChange={setSessionDialogOpen}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  );
}
