import { Activity, useActivity } from '@/hooks/useActivity';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Activity as ActivityIcon, 
  Type, 
  Square, 
  Circle, 
  Image, 
  Trash2,
  FileText,
  PenTool,
  MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedPanelProps {
  sessionId: string | null;
}

const getActivityIcon = (actionType: string) => {
  switch (actionType) {
    case 'add_text':
      return <Type className="w-4 h-4" />;
    case 'add_rectangle':
      return <Square className="w-4 h-4" />;
    case 'add_circle':
      return <Circle className="w-4 h-4" />;
    case 'add_image':
      return <Image className="w-4 h-4" />;
    case 'add_form_field':
      return <FileText className="w-4 h-4" />;
    case 'add_signature':
      return <PenTool className="w-4 h-4" />;
    case 'delete':
      return <Trash2 className="w-4 h-4" />;
    case 'comment':
      return <MessageSquare className="w-4 h-4" />;
    default:
      return <ActivityIcon className="w-4 h-4" />;
  }
};

const getActivityColor = (actionType: string) => {
  switch (actionType) {
    case 'add_text':
    case 'add_form_field':
      return 'bg-blue-500/20 text-blue-600';
    case 'add_rectangle':
    case 'add_circle':
      return 'bg-purple-500/20 text-purple-600';
    case 'add_image':
    case 'add_signature':
      return 'bg-green-500/20 text-green-600';
    case 'delete':
      return 'bg-red-500/20 text-red-600';
    case 'comment':
      return 'bg-yellow-500/20 text-yellow-600';
    default:
      return 'bg-gray-500/20 text-gray-600';
  }
};

const getActivityLabel = (actionType: string) => {
  return actionType.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const ActivityFeedPanel = ({ sessionId }: ActivityFeedPanelProps) => {
  const { activities, isLoading } = useActivity(sessionId);

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        <div className="h-16 bg-muted animate-pulse rounded-lg" />
        <div className="h-16 bg-muted animate-pulse rounded-lg" />
        <div className="h-16 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <ActivityIcon className="w-5 h-5" />
          <h3 className="font-semibold">Activity Feed</h3>
          <Badge variant="secondary" className="ml-auto">
            {activities.length}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Real-time collaboration activity
        </p>
      </div>

      <ScrollArea className="flex-1">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ActivityIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activity yet</p>
            <p className="text-xs mt-1">Start editing to see activity</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {activities.map((activity: Activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Activity Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getActivityColor(activity.action_type)}`}>
                  {getActivityIcon(activity.action_type)}
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {activity.user?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium truncate">
                      {activity.user?.full_name || 'Unknown User'}
                    </p>
                  </div>

                  <p className="text-sm">
                    <span className="font-medium">{getActivityLabel(activity.action_type)}</span>
                    {activity.page_number && (
                      <span className="text-muted-foreground"> on page {activity.page_number}</span>
                    )}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
