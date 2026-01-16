import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, Building2, Calendar, ChevronDown, ChevronUp, Clock, Star, MessageSquare, Video, History, Globe, MapPin, Briefcase, User } from 'lucide-react';
import { format } from 'date-fns';
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
  totalSessions?: number;
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
export default function ActiveMenteesCards({
  mentees,
  onScheduleSession,
  onMessage
}: ActiveMenteesCardsProps) {
  const {
    user
  } = useAuth();
  const [expandedMentee, setExpandedMentee] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<Record<string, SessionWithRating[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null);
  const fetchSessionHistory = async (menteeId: string) => {
    if (!user || sessionHistory[menteeId]) return;
    setLoadingHistory(menteeId);
    const {
      data: sessions,
      error
    } = await supabase.from('mentoring_sessions').select('id, scheduled_at, topic, status, duration_minutes').eq('mentor_id', user.id).eq('mentee_id', menteeId).order('scheduled_at', {
      ascending: false
    });
    if (error) {
      console.error('Error fetching session history:', error);
      setLoadingHistory(null);
      return;
    }
    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.id);
      const {
        data: feedback
      } = await supabase.from('session_feedback').select('session_id, rating, feedback_text').in('session_id', sessionIds);
      const feedbackMap = new Map(feedback?.map(f => [f.session_id, f]) || []);
      const sessionsWithRatings = sessions.map(session => ({
        ...session,
        rating: feedbackMap.get(session.id)?.rating,
        feedback_text: feedbackMap.get(session.id)?.feedback_text
      }));
      setSessionHistory(prev => ({
        ...prev,
        [menteeId]: sessionsWithRatings
      }));
    } else {
      setSessionHistory(prev => ({
        ...prev,
        [menteeId]: []
      }));
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
    return <Card className="tech-card border-0">
        <CardContent className="py-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Active Mentees</h3>
          <p className="text-sm text-muted-foreground">
            Accept mentorship requests to start guiding startups
          </p>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Active Startups</h3>
        <Badge variant="secondary">{mentees.length}</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mentees.map(mentee => {
          const isExpanded = expandedMentee === mentee.mentee_id;
          const history = sessionHistory[mentee.mentee_id] || [];
          const avgRating = getAverageRating(history);
          const completedSessions = history.filter(s => s.status === 'completed').length;
          const company = mentee.companies;
          
          return (
            <Collapsible key={mentee.id} open={isExpanded} onOpenChange={() => handleToggleExpand(mentee.mentee_id)}>
              <Card className={cn(
                "tech-card border-0 transition-all duration-200",
                isExpanded && "ring-1 ring-primary/20"
              )}>
                <CardContent className="p-4">
                  {/* Compact Header Row */}
                  <div className="flex items-start gap-3">
                    {/* Company Logo - Compact */}
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={company?.logo_url} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Building2 className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm truncate">{company?.name || 'Startup'}</h4>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      
                      {/* Description - single line */}
                      {company?.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {company.description}
                        </p>
                      )}

                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {mentee.totalSessions === 0 && (
                          <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0 h-4 text-amber-500 border-amber-500/30 bg-amber-500/10">
                            No sessions yet
                          </Badge>
                        )}
                        {company?.stage && (
                          <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0 h-4", getStageColor(company.stage))}>
                            {company.stage}
                          </Badge>
                        )}
                        {company?.industry && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            {company.industry}
                          </Badge>
                        )}
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        {company?.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[80px]">{company.location}</span>
                          </div>
                        )}
                        {company?.team_size && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{company.team_size}</span>
                          </div>
                        )}
                        {completedSessions > 0 && (
                          <div className="flex items-center gap-1">
                            <History className="h-3 w-3" />
                            <span>{completedSessions} sessions</span>
                          </div>
                        )}
                        {avgRating && (
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="h-3 w-3 fill-current" />
                            <span>{avgRating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Founder + Actions Row */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={mentee.mentee.avatar_url} />
                        <AvatarFallback className="text-[8px]">
                          {mentee.mentee.full_name?.[0] || 'F'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{mentee.mentee.full_name}</span>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onScheduleSession?.(mentee.mentee_id);
                      }}
                    >
                      <Video className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                  </div>

                  {/* Expanded Session History */}
                  <CollapsibleContent>
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <h5 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
                        <History className="h-3.5 w-3.5" />
                        Session History
                      </h5>
                      
                      {loadingHistory === mentee.mentee_id ? (
                        <p className="text-xs text-muted-foreground py-2">Loading...</p>
                      ) : history.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">No sessions yet</p>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {history.slice(0, 5).map(session => {
                            const isPast = new Date(session.scheduled_at) < new Date();
                            const isUpcoming = session.status === 'scheduled' && !isPast;
                            return (
                              <div 
                                key={session.id} 
                                className={cn(
                                  "p-2 rounded-md text-xs flex items-center justify-between",
                                  isUpcoming ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-muted/50"
                                )}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate text-[11px]">
                                    {session.topic || 'Mentoring Session'}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {format(new Date(session.scheduled_at), 'MMM d, h:mm a')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {session.rating && (
                                    <div className="flex items-center gap-0.5 text-amber-500">
                                      <Star className="h-2.5 w-2.5 fill-current" />
                                      <span className="text-[10px]">{session.rating}</span>
                                    </div>
                                  )}
                                  <Badge 
                                    variant={isUpcoming ? "default" : "secondary"} 
                                    className={cn("text-[9px] px-1 py-0 h-4", isUpcoming && "bg-emerald-500")}
                                  >
                                    {isUpcoming ? 'Upcoming' : session.status}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>;
}