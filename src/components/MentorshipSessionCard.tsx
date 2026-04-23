import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, Check, X, ArrowRight, Star, CheckCircle2, Building2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MentorshipSessionCardProps {
  session: {
    id: string;
    scheduled_at?: string;
    created_at?: string;
    topic?: string;
    goals?: string;
    status?: string;
    meeting_link?: string;
    start_date?: string;
    hasRated?: boolean;
    source?: 'direct' | 'accelerator';
    acceleratorName?: string;
    focusArea?: string;
    mentor: {
      full_name: string;
      avatar_url?: string;
      bio?: string;
    };
    role: string;
    nextSession?: {
      id: string;
      scheduled_at: string;
      topic: string;
      meeting_link?: string;
    };
  };
  variant: 'offer' | 'active' | 'upcoming' | 'past';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onJoin?: (meetingLink: string) => void;
  onRate?: (session: any) => void;
  onSchedule?: () => void;
  onOpenTranscript?: (session: MentorshipSessionCardProps['session']) => void;
  loading?: boolean;
}

export const MentorshipSessionCard = ({
  session,
  variant,
  onAccept,
  onReject,
  onJoin,
  onRate,
  onSchedule,
  onOpenTranscript,
  loading,
}: MentorshipSessionCardProps) => {
  const displayName = session.mentor?.full_name || 'Mentor';
  const avatarUrl = session.mentor?.avatar_url;
  const avatarFallback = displayName[0]?.toUpperCase() || 'M';

  const getDateDisplay = () => {
    if (variant === 'offer' && session.created_at) {
      return `Sent ${formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}`;
    }
    if (variant === 'active' && session.start_date) {
      return `Active ${formatDistanceToNow(new Date(session.start_date), { addSuffix: false })}`;
    }
    if ((variant === 'upcoming' || variant === 'past') && session.scheduled_at) {
      const scheduledDate = new Date(session.scheduled_at);
      if (isToday(scheduledDate)) {
        return `Today at ${format(scheduledDate, 'h:mm a')}`;
      }
      if (isTomorrow(scheduledDate)) {
        return `Tomorrow at ${format(scheduledDate, 'h:mm a')}`;
      }
      return format(scheduledDate, 'MMM d, yyyy • h:mm a');
    }
    return '';
  };

  const getTimeUntil = () => {
    if (variant === 'upcoming' && session.scheduled_at) {
      return formatDistanceToNow(new Date(session.scheduled_at), { addSuffix: true });
    }
    if (variant === 'past' && session.scheduled_at) {
      return formatDistanceToNow(new Date(session.scheduled_at), { addSuffix: true });
    }
    return '';
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'offer':
        return {
          container: 'bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5 border-amber-500/20 hover:border-amber-500/40',
          accent: 'from-amber-500 to-orange-500',
          badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'active':
      case 'upcoming':
        return {
          container: 'bg-gradient-to-br from-emerald-500/5 via-green-500/5 to-teal-500/5 border-emerald-500/20 hover:border-emerald-500/40',
          accent: 'from-emerald-500 to-teal-500',
          badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'past':
        return {
          container: 'bg-gradient-to-br from-slate-500/5 via-gray-500/5 to-zinc-500/5 border-muted/40 hover:border-muted/60',
          accent: 'from-slate-400 to-gray-400',
          badge: 'bg-muted text-muted-foreground border-muted',
        };
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

  const styles = getVariantStyles();

  return (
    <div className={cn(
      'tech-card group relative rounded-xl border-0 p-3 sm:p-5 transition-all duration-300',
      'hover:scale-[1.02] hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20',
      styles.container
    )}>
      {/* Accent Line */}
      <div className={cn(
        'absolute left-0 top-0 h-full w-1 rounded-l-xl bg-gradient-to-b opacity-60 group-hover:opacity-100 transition-opacity',
        styles.accent
      )} />

      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar with Ring */}
        <div className="relative flex-shrink-0">
          <div className={cn(
            'absolute -inset-1 rounded-full bg-gradient-to-br opacity-50 blur-sm',
            styles.accent
          )} />
          <Avatar className="relative h-10 w-10 sm:h-14 sm:w-14 ring-2 ring-background">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="text-sm sm:text-lg font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          {variant === 'upcoming' && session.scheduled_at && isToday(new Date(session.scheduled_at)) && (
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-emerald-500" />
            </span>
          )}
          {variant === 'active' && (
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center">
              <span className="relative inline-flex h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-emerald-500 ring-2 ring-background items-center justify-center">
                <CheckCircle2 className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />
              </span>
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-foreground truncate text-sm sm:text-base">
                  {displayName}
                </h4>
                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 font-medium uppercase tracking-wide', getRoleBadgeStyle(session.role))}>
                  {session.role || 'mentor'}
                </Badge>
                {session.source === 'accelerator' && session.acceleratorName && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400">
                    <Building2 className="h-2.5 w-2.5 mr-1" />
                    {session.acceleratorName}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {variant === 'offer' && (session.mentor?.bio || 'Wants to mentor you')}
                {variant === 'active' && (session.focusArea || session.mentor?.bio || 'Your active mentor')}
                {variant === 'upcoming' && (session.topic || 'Mentoring session scheduled')}
                {variant === 'past' && (session.topic || 'Session completed')}
              </p>
            </div>
            
            {/* Status Badge */}
            <Badge variant="outline" className={cn('shrink-0 text-[10px] sm:text-xs font-medium w-fit', styles.badge)}>
              {variant === 'offer' && 'Action Required'}
              {variant === 'active' && (session.source === 'accelerator' ? 'Program Assigned' : 'Active')}
              {variant === 'upcoming' && 'Confirmed'}
              {variant === 'past' && 'Completed'}
            </Badge>
          </div>

          {/* Goals for offers */}
          {variant === 'offer' && session.goals && (
            <p className="text-xs text-foreground/80 mt-1.5 line-clamp-2 italic">
              "{session.goals}"
            </p>
          )}

          {/* Date & Time */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate">{getDateDisplay()}</span>
            </div>
            {(variant === 'upcoming' || variant === 'past') && getTimeUntil() && (
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
                ({getTimeUntil()})
              </span>
            )}
          </div>

          {/* Next Session for Active Mentors */}
          {variant === 'active' && session.nextSession && (
            <div className="mt-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Next Session
                  </p>
                  <p className="text-xs font-medium text-foreground mt-0.5 truncate">{session.nextSession.topic}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(session.nextSession.scheduled_at), 'EEE, MMM d • h:mm a')}
                  </p>
                </div>
                {session.nextSession.meeting_link && onJoin && (
                  <Button 
                    size="sm"
                    onClick={() => onJoin(session.nextSession!.meeting_link!)}
                    className="h-7 px-2.5 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white flex-shrink-0"
                  >
                    <Video className="h-3 w-3 mr-1" />
                    Join
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {variant === 'offer' && onAccept && onReject && (
            <div className="flex items-center gap-2 mt-3 sm:mt-4">
              <Button
                size="sm"
                onClick={() => onAccept(session.id)}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(session.id)}
                disabled={loading}
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                Decline
              </Button>
            </div>
          )}

          {variant === 'active' && onSchedule && (
            <div className="flex items-center gap-2 mt-3 sm:mt-4">
              <Button
                size="sm"
                onClick={onSchedule}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                Schedule Session
              </Button>
            </div>
          )}

          {variant === 'upcoming' && session.meeting_link && onJoin && (
            <Button
              size="sm"
              onClick={() => onJoin(session.meeting_link!)}
              className="mt-3 sm:mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 group/btn text-xs sm:text-sm h-8 sm:h-9"
            >
              <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              Join Session
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-1.5 transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
          )}

          {variant === 'past' && (
            <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2">
              {onOpenTranscript && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenTranscript(session)}
                  className="text-xs sm:text-sm h-8 sm:h-9"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  View Transcript
                </Button>
              )}
              {!session.hasRated && onRate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRate(session)}
                  className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400 text-xs sm:text-sm h-8 sm:h-9"
                >
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  Rate Session
                </Button>
              )}
              {session.hasRated && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="font-medium">Rated</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorshipSessionCard;
