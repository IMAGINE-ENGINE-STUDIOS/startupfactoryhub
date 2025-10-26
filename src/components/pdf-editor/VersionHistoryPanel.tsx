import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  RotateCcw, 
  Save, 
  Trash2,
  Clock,
  Tag
} from 'lucide-react';
import { useVersionHistory } from '@/hooks/useVersionHistory';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface VersionHistoryPanelProps {
  sessionId: string | null;
  currentCanvasData: any;
  onRestoreVersion: (canvasData: any) => void;
}

export const VersionHistoryPanel = ({ 
  sessionId, 
  currentCanvasData,
  onRestoreVersion 
}: VersionHistoryPanelProps) => {
  const { versions, isLoading, createVersion, loadVersion, deleteVersion } = useVersionHistory(sessionId);
  const [versionName, setVersionName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [restoreVersionId, setRestoreVersionId] = useState<string | null>(null);

  const handleSaveVersion = async () => {
    if (!versionName.trim()) {
      toast.error('Please enter a version name');
      return;
    }
    await createVersion(currentCanvasData, versionName, false);
    setVersionName('');
    setShowSaveDialog(false);
  };

  const handleRestore = async () => {
    if (!restoreVersionId) return;
    const canvasData = await loadVersion(restoreVersionId);
    if (canvasData) {
      onRestoreVersion(canvasData);
      toast.success('Version restored');
    }
    setRestoreVersionId(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5" />
          <h3 className="font-semibold">Version History</h3>
          <Badge variant="secondary" className="ml-auto">
            {versions.length}
          </Badge>
        </div>

        {/* Save Version Button */}
        <Button
          size="sm"
          className="w-full"
          onClick={() => setShowSaveDialog(true)}
          disabled={!sessionId}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Checkpoint
        </Button>

        {/* Save Version Dialog */}
        {showSaveDialog && (
          <div className="space-y-2 p-3 rounded-lg border bg-card animate-fade-in">
            <Input
              placeholder="Version name (e.g., Final Draft)"
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveVersion();
                }
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveVersion}>
                Save
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setShowSaveDialog(false);
                  setVersionName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {versions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No versions saved</p>
            <p className="text-xs mt-1">Create checkpoints as you work</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Version Header */}
                <div className="flex items-start gap-2 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {version.user?.full_name?.substring(0, 2).toUpperCase() || 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {version.version_name || `Version ${version.version_number}`}
                      </p>
                      {index === 0 && (
                        <Badge variant="default" className="text-xs">Latest</Badge>
                      )}
                      {version.is_auto_save && (
                        <Badge variant="outline" className="text-xs">Auto</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      by {version.user?.full_name || 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Version Info */}
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                </div>

                {/* Version Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setRestoreVersionId(version.id)}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => deleteVersion(version.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoreVersionId} onOpenChange={() => setRestoreVersionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current canvas with the selected version. Your current work will be saved as a new version before restoring.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>
              Restore Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
