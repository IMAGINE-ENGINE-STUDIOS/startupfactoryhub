import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Copy, Users, MapPin, Play, Square, Link2, QrCode, Check } from 'lucide-react';
import { toast } from 'sonner';
import { TrackedUser } from '@/hooks/useMapTracking';
import { cn } from '@/lib/utils';

interface TrackingSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  onCreateSession: () => void;
  onJoinSession: (sessionId: string) => void;
  onLeaveSession: () => void;
  trackedUsers: TrackedUser[];
  isTracking: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  userColor: string;
}

export const TrackingSessionDialog = ({
  open,
  onOpenChange,
  sessionId,
  onCreateSession,
  onJoinSession,
  onLeaveSession,
  trackedUsers,
  isTracking,
  onStartTracking,
  onStopTracking,
  userColor,
}: TrackingSessionDialogProps) => {
  const [joinSessionId, setJoinSessionId] = useState('');
  const [copied, setCopied] = useState(false);

  const shareUrl = sessionId 
    ? `${window.location.origin}${window.location.pathname}?tracking=${sessionId}` 
    : '';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Session link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleJoinSession = () => {
    if (joinSessionId.trim()) {
      onJoinSession(joinSessionId.trim());
      setJoinSessionId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md backdrop-blur-2xl bg-background/80 border border-border/50 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Real-Time Location Tracking
          </DialogTitle>
          <DialogDescription>
            Create or join a session to see each other's locations on the map in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!sessionId ? (
            <>
              {/* Create New Session */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Create New Session</Label>
                <Button 
                  onClick={onCreateSession} 
                  className="w-full rounded-xl"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Create Tracking Session
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background/80 px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Join Existing Session */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Join Existing Session</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter session ID..."
                    value={joinSessionId}
                    onChange={(e) => setJoinSessionId(e.target.value)}
                    className="rounded-xl"
                  />
                  <Button 
                    onClick={handleJoinSession}
                    disabled={!joinSessionId.trim()}
                    className="rounded-xl"
                  >
                    Join
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Active Session Info */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Session Active</span>
                  <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                    Live
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    className="text-xs rounded-xl bg-background/50"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="rounded-xl shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Share this link with others to let them join your tracking session.
                </p>
              </div>

              {/* Your Tracking Status */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: userColor }}
                  />
                  Your Location Sharing
                </Label>
                
                {isTracking ? (
                  <Button 
                    onClick={onStopTracking}
                    variant="destructive"
                    className="w-full rounded-xl"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop Sharing Location
                  </Button>
                ) : (
                  <Button 
                    onClick={onStartTracking}
                    className="w-full rounded-xl"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Sharing Location
                  </Button>
                )}
              </div>

              {/* Connected Users */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Connected Users ({trackedUsers.length + 1})
                </Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {/* Current user */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: userColor }}
                    />
                    <span className="text-sm">You</span>
                    {isTracking && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        Sharing
                      </Badge>
                    )}
                  </div>
                  
                  {/* Other users */}
                  {trackedUsers.map((user) => (
                    <div 
                      key={user.userId}
                      className="flex items-center gap-2 p-2 rounded-lg bg-background/50"
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: user.color }}
                      />
                      <span className="text-sm">{user.userName}</span>
                      {user.latitude && user.longitude && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave Session */}
              <Button 
                onClick={onLeaveSession}
                variant="outline"
                className="w-full rounded-xl"
              >
                Leave Session
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
