import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, Check, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PitchOutcome = 'follow_up' | 'maybe' | 'not_interested' | 'committed' | 'passed' | null;

interface PitchMeetingCardProps {
  meeting: {
    id: string;
    scheduled_date: string;
    duration_minutes?: number;
    meeting_link?: string;
    status: string;
    notes?: string;
    outcome?: PitchOutcome;
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
  onOutcomeChange?: (id: string, outcome: PitchOutcome) => void;
}

const outcomeOptions: { value: PitchOutcome; label: string; colors: string }[] = [
  { value: 'follow_up', label: 'Follow Up', colors: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20' },
  { value: 'maybe', label: 'Maybe', colors: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20' },
  { value: 'committed', label: 'Committed', colors: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' },
  { value: 'not_interested', label: 'Not Interested', colors: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20' },
  { value: 'passed', label: 'Passed', colors: 'bg-muted text-muted-foreground border-muted-foreground/30 hover:bg-muted/80' },
];

const getSelectedOutcomeStyle = (outcome: PitchOutcome) => {
  switch (outcome) {
    case 'follow_up': return 'bg-blue-500 text-white border-blue-600';
    case 'maybe': return 'bg-amber-500 text-white border-amber-600';
    case 'committed': return 'bg-emerald-500 text-white border-emerald-600';
    case 'not_interested': return 'bg-rose-500 text-white border-rose-600';
    case 'passed': return 'bg-muted-foreground text-background border-muted-foreground';
    default: return '';
  }
};

export const PitchMeetingCard = ({
  meeting,
  variant,
  viewerType,
  onAccept,
  onReject,
  onJoin,
  onOutcomeChange,
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
      'group relative rounded-xl border p-3 sm:p-5 transition-all duration-300',
      'hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20',
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
          {variant === 'upcoming' && isToday(scheduledDate) && (
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-emerald-500" />
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground truncate text-sm sm:text-base">
                {displayName}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {variant === 'incoming' && 'Wants to schedule a pitch meeting'}
                {variant === 'sent' && 'Awaiting response to your request'}
                {variant === 'upcoming' && 'Pitch meeting scheduled'}
                {variant === 'past' && 'Meeting completed'}
              </p>
            </div>
            
            {/* Status Badge */}
            <Badge variant="outline" className={cn('shrink-0 text-[10px] sm:text-xs font-medium w-fit', styles.badge)}>
              {variant === 'incoming' && 'Action Required'}
              {variant === 'sent' && 'Pending'}
              {variant === 'upcoming' && 'Confirmed'}
              {variant === 'past' && 'Completed'}
            </Badge>
          </div>

          {/* Date & Time */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate">{getDateDisplay()}</span>
            </div>
            {meeting.duration_minutes && (
              <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>{meeting.duration_minutes} min</span>
              </div>
            )}
            {variant !== 'past' && (
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
                ({getTimeUntil()})
              </span>
            )}
          </div>

          {/* Actions */}
          {variant === 'incoming' && onAccept && onReject && (
            <div className="flex items-center gap-2 mt-3 sm:mt-4">
              <Button
                size="sm"
                onClick={() => onAccept(meeting.id)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(meeting.id)}
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                Decline
              </Button>
            </div>
          )}

          {variant === 'sent' && (
            <div className="flex items-center gap-2 mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
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
              className="mt-3 sm:mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 group/btn text-xs sm:text-sm h-8 sm:h-9"
            >
              <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              Join Meeting
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-1.5 transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
          )}

          {variant === 'past' && (
            <div className="mt-3 sm:mt-4">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">Mark outcome:</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {outcomeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onOutcomeChange?.(meeting.id, option.value)}
                    className={cn(
                      'px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-full border transition-all duration-200',
                      meeting.outcome === option.value
                        ? getSelectedOutcomeStyle(option.value)
                        : option.colors
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PitchMeetingCard;
