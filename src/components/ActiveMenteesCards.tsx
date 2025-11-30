import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users, 
  Building2, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Star,
  MessageSquare,
  Video,
  History
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MenteeWithCompany {
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
  } | null;
}

interface SessionWithRating {
  id: string;
  scheduled_at: string;
  topic: string | null;
  status: string;
  duration_minutes: number;
  rating?: number;
  feedback_text?: string;
}

interface ActiveMenteesCardsProps {
  mentees: MenteeWithCompany[];
  onScheduleSession?: (menteeId: string) => void;
  onMessage?: (menteeId: string) => void;
}

export default function ActiveMenteesCards({ mentees, onScheduleSession, onMessage }: ActiveMenteesCardsProps) {
  const { user } = useAuth();
  const [expandedMentee, setExpandedMentee] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<Record<string, SessionWithRating[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null);

  const fetchSessionHistory = async (menteeId: string) => {
    if (!user || sessionHistory[menteeId]) return;
    
    setLoadingHistory(menteeId);
    
    // Fetch all sessions with this mentee
    const { data: sessions, error } = await supabase
      .from('mentoring_sessions')
      .select('id, scheduled_at, topic, status, duration_minutes')
      .eq('mentor_id', user.id)
      .eq('mentee_id', menteeId)
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Error fetching session history:', error);
      setLoadingHistory(null);
      return;
    }

    if (sessions && sessions.length > 0) {
      // Fetch ratings for these sessions
      const sessionIds = sessions.map(s => s.id);
      const { data: feedback } = await supabase
        .from('session_feedback')
        .select('session_id, rating, feedback_text')
        .in('session_id', sessionIds);

      const feedbackMap = new Map(feedback?.map(f => [f.session_id, f]) || []);
      
      const sessionsWithRatings = sessions.map(session => ({
        ...session,
        rating: feedbackMap.get(session.id)?.rating,
        feedback_text: feedbackMap.get(session.id)?.feedback_text
      }));

      setSessionHistory(prev => ({ ...prev, [menteeId]: sessionsWithRatings }));
    } else {
      setSessionHistory(prev => ({ ...prev, [menteeId]: [] }));
    }
    
    setLoadingHistory(null);
  };

  const handleToggleExpand = (menteeId: string) => {
    if (expandedMentee === menteeId) {
      setExpandedMentee(null);
    } else {
      setExpandedMentee(menteeId);
      fetchSessionHistory(menteeId);
    }
  };

  const getStageColor = (stage: string | null) => {
    switch (stage?.toLowerCase()) {
      case 'idea':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'mvp':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'seed':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'series_a':
      case 'series-a':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'growth':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getAverageRating = (sessions: SessionWithRating[]) => {
    const ratedSessions = sessions.filter(s => s.rating !== undefined);
    if (ratedSessions.length === 0) return null;
    return (ratedSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedSessions.length).toFixed(1);
  };

  if (mentees.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
            <Users className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Active Mentees</h3>
          <p className="text-sm text-muted-foreground">
            Accept mentorship requests to start guiding startups
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Active Mentees
          <Badge variant="secondary">{mentees.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mentees.map((mentee) => {
          const isExpanded = expandedMentee === mentee.mentee_id;
          const history = sessionHistory[mentee.mentee_id] || [];
          const avgRating = getAverageRating(history);
          const completedSessions = history.filter(s => s.status === 'completed').length;
          const upcomingSessions = history.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()).length;

          return (
            <Collapsible 
              key={mentee.id} 
              open={isExpanded} 
              onOpenChange={() => handleToggleExpand(mentee.mentee_id)}
            >
              <div className={cn(
                "rounded-xl border transition-all duration-300",
                isExpanded 
                  ? "border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent shadow-lg" 
                  : "border-border hover:border-primary/20 hover:shadow-md"
              )}>
                {/* Main Card */}
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-14 w-14 ring-2 ring-background">
                          <AvatarImage src={mentee.mentee.avatar_url} />
                          <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
                            {mentee.mentee.full_name?.[0] || 'M'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
                          <span className="h-2 w-2 rounded-full bg-white" />
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {mentee.mentee.full_name}
                            </h4>
                            {mentee.companies && (
                              <div className="flex items-center gap-2 mt-1">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {mentee.companies.name}
                                </span>
                                {mentee.companies.stage && (
                                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getStageColor(mentee.companies.stage))}>
                                    {mentee.companies.stage}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Since {mentee.start_date ? format(new Date(mentee.start_date), 'MMM yyyy') : 'N/A'}</span>
                          </div>
                          {completedSessions > 0 && (
                            <div className="flex items-center gap-1">
                              <History className="h-3 w-3" />
                              <span>{completedSessions} session{completedSessions !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {avgRating && (
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="h-3 w-3 fill-current" />
                              <span>{avgRating}</span>
                            </div>
                          )}
                          {upcomingSessions > 0 && (
                            <Badge variant="secondary" className="text-[10px] h-5">
                              {upcomingSessions} upcoming
                            </Badge>
                          )}
                        </div>

                        {/* Industry & Description */}
                        {mentee.companies?.industry && (
                          <Badge variant="outline" className="mt-2 text-[10px]">
                            {mentee.companies.industry}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onScheduleSession?.(mentee.mentee_id);
                        }}
                      >
                        <Video className="h-3 w-3 mr-1.5" />
                        Schedule
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMessage?.(mentee.mentee_id);
                        }}
                      >
                        <MessageSquare className="h-3 w-3 mr-1.5" />
                        Message
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Expanded Content - Session History */}
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-0 border-t border-border/50">
                    <div className="pt-4">
                      <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        Session History
                      </h5>
                      
                      {loadingHistory === mentee.mentee_id ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          Loading history...
                        </div>
                      ) : history.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          No sessions yet. Schedule your first session!
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {history.map((session) => {
                            const isPast = new Date(session.scheduled_at) < new Date();
                            const isUpcoming = session.status === 'scheduled' && !isPast;
                            
                            return (
                              <div 
                                key={session.id}
                                className={cn(
                                  "p-3 rounded-lg border text-sm",
                                  isUpcoming 
                                    ? "bg-emerald-500/5 border-emerald-500/20" 
                                    : "bg-muted/30 border-muted"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                      {session.topic || 'Mentoring Session'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      <span>{format(new Date(session.scheduled_at), 'MMM d, yyyy • h:mm a')}</span>
                                      <span>•</span>
                                      <span>{session.duration_minutes} min</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge 
                                      variant={isUpcoming ? "default" : "secondary"} 
                                      className={cn("text-[10px]", isUpcoming && "bg-emerald-500")}
                                    >
                                      {isUpcoming ? 'Upcoming' : session.status}
                                    </Badge>
                                    {session.rating && (
                                      <div className="flex items-center gap-1 text-amber-500">
                                        {[...Array(5)].map((_, i) => (
                                          <Star 
                                            key={i} 
                                            className={cn(
                                              "h-3 w-3",
                                              i < session.rating! ? "fill-current" : "text-muted"
                                            )} 
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {session.feedback_text && (
                                  <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
                                    "{session.feedback_text}"
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
