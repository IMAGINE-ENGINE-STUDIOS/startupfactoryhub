import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Activity, History, Bell } from 'lucide-react';
import { CommentsPanel } from './CommentsPanel';
import { ActivityFeedPanel } from './ActivityFeedPanel';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { Badge } from '@/components/ui/badge';

interface CollaborationSidebarProps {
  sessionId: string | null;
  currentPage: number;
  currentCanvasData: any;
  onRestoreVersion: (canvasData: any) => void;
  commentsCount?: number;
  activitiesCount?: number;
  versionsCount?: number;
}

export const CollaborationSidebar = ({
  sessionId,
  currentPage,
  currentCanvasData,
  onRestoreVersion,
  commentsCount = 0,
  activitiesCount = 0,
  versionsCount = 0,
}: CollaborationSidebarProps) => {
  return (
    <div className="h-full w-80 border-l bg-background/95 backdrop-blur flex flex-col">
      <Tabs defaultValue="activity" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3 shrink-0">
          <TabsTrigger value="comments" className="relative text-xs">
            <MessageSquare className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Comments</span>
            {commentsCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 h-4 min-w-4 px-1 text-xs"
              >
                {commentsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="relative text-xs">
            <Activity className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Activity</span>
            {activitiesCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 h-4 min-w-4 px-1 text-xs"
              >
                {activitiesCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="versions" className="relative text-xs">
            <History className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Versions</span>
            {versionsCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 h-4 min-w-4 px-1 text-xs"
              >
                {versionsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="flex-1 m-0">
          <CommentsPanel sessionId={sessionId} currentPage={currentPage} />
        </TabsContent>

        <TabsContent value="activity" className="flex-1 m-0">
          <ActivityFeedPanel sessionId={sessionId} />
        </TabsContent>

        <TabsContent value="versions" className="flex-1 m-0">
          <VersionHistoryPanel 
            sessionId={sessionId}
            currentCanvasData={currentCanvasData}
            onRestoreVersion={onRestoreVersion}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
