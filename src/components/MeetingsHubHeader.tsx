import { Video } from 'lucide-react';
import { ReactNode } from 'react';

interface MeetingsHubHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: ReactNode;
}

/**
 * Compact, glassmorphic header used at the top of every dashboard's "Meetings" tab.
 * Keeps the visual language consistent and simplified across roles.
 */
export default function MeetingsHubHeader({
  title = 'Meetings',
  subtitle = 'Pitches, sessions & live rooms — all in one place.',
  icon: Icon = Video,
  action,
}: MeetingsHubHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 tech-card border-0 rounded-xl p-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold truncate">{title}</h3>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
