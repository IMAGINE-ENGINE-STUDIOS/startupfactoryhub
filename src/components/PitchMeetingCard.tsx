import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, Check, X, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PitchMeetingCardProps {
  meeting: {
    id: string;
    scheduled_date: string;
    duration_minutes?: number;
    meeting_link?: string;
    status: string;
    notes?: string;
    company?: {
      name: string;
      logo_url?: string;
    };
    investor?: {
      full_name: string;
      avatar_url?: string;
    };
    startup?: {
      full_name: string;
      avatar_url?: string;
    };
  };
  variant: 'incoming' | 'sent' | 'upcoming' | 'past';
  viewerType: 'startup' | 'investor';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onJoin?: (meetingLink: string) => void;
}

export const PitchMeetingCard = ({
  meeting,
  variant,
  viewerType,
  onAccept,
  onReject,
  onJoin,
}: PitchMeetingCardProps) => {
  const scheduledDate = new Date(meeting.scheduled_date);
  
  // Get display name and avatar based on viewer type
  const displayName = viewerType === 'startup' 
    ? meeting.investor?.full_name || 'Investor'
    : meeting.company?.name || meeting.startup?.full_name || 'Startup';
    
  const avatarUrl = viewerType === 'startup'
    ? meeting.investor?.avatar_url
    : meeting.company?.logo_url || meeting.startup?.avatar_url;
    
  const avatarFallback = displayName[0]?.toUpperCase() || '?';

  // Format date nicely
  const getDateDisplay = () => {
    if (isToday(scheduledDate)) {
      return `Today at ${format(scheduledDate, 'h:mm a')}`;
    }
    if (isTomorrow(scheduledDate)) {
      return `Tomorrow at ${format(scheduledDate, 'h:mm a')}`;
    }
    return format(scheduledDate, 'MMM d, yyyy • h:mm a');
  };

  const getTimeUntil = () => {
    if (variant === 'past') {
      return formatDistanceToNow(scheduledDate, { addSuffix: true });
    }
    return formatDistanceToNow(scheduledDate, { addSuffix: true });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'incoming':
        return {
          container: 'bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-red-500/5 border-amber-500/20 hover:border-amber-500/40',
          accent: 'from-amber-500 to-orange-500',
          badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'sent':
        return {
          container: 'bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 border-blue-500/20 hover:border-blue-500/40',
          accent: 'from-blue-500 to-indigo-500',
          badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        };
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

  const styles = getVariantStyles();

  return (
    <div className={cn(
      'group relative rounded-xl border p-5 transition-all duration-300',
      'hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20',
      styles.container
    )}>
      {/* Accent Line */}
      <div className={cn(
        'absolute left-0 top-0 h-full w-1 rounded-l-xl bg-gradient-to-b opacity-60 group-hover:opacity-100 transition-opacity',
        styles.accent
      )} />

      <div className="flex items-start gap-4">
        {/* Avatar with Ring */}
        <div className="relative">
          <div className={cn(
            'absolute -inset-1 rounded-full bg-gradient-to-br opacity-50 blur-sm',
            styles.accent
          )} />
          <Avatar className="relative h-14 w-14 ring-2 ring-background">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          {variant === 'upcoming' && isToday(scheduledDate) && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-foreground truncate">
                {displayName}
              </h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                {variant === 'incoming' && 'Wants to schedule a pitch meeting'}
                {variant === 'sent' && 'Awaiting response to your request'}
                {variant === 'upcoming' && 'Pitch meeting scheduled'}
                {variant === 'past' && 'Meeting completed'}
              </p>
            </div>
            
            {/* Status Badge */}
            <Badge variant="outline" className={cn('shrink-0 text-xs font-medium', styles.badge)}>
              {variant === 'incoming' && 'Action Required'}
              {variant === 'sent' && 'Pending'}
              {variant === 'upcoming' && 'Confirmed'}
              {variant === 'past' && 'Completed'}
            </Badge>
          </div>

          {/* Date & Time */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{getDateDisplay()}</span>
            </div>
            {meeting.duration_minutes && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{meeting.duration_minutes} min</span>
              </div>
            )}
            {variant !== 'past' && (
              <span className="text-xs text-muted-foreground">
                ({getTimeUntil()})
              </span>
            )}
          </div>

          {/* Actions */}
          {variant === 'incoming' && onAccept && onReject && (
            <div className="flex items-center gap-2 mt-4">
              <Button
                size="sm"
                onClick={() => onAccept(meeting.id)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(meeting.id)}
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
              >
                <X className="h-4 w-4 mr-1.5" />
                Decline
              </Button>
            </div>
          )}

          {variant === 'sent' && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Waiting for response...
              </div>
            </div>
          )}

          {variant === 'upcoming' && meeting.meeting_link && onJoin && (
            <Button
              size="sm"
              onClick={() => onJoin(meeting.meeting_link!)}
              className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 group/btn"
            >
              <Video className="h-4 w-4 mr-1.5" />
              Join Meeting
              <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
          )}

          {variant === 'past' && (
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                {getTimeUntil()}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PitchMeetingCard;
