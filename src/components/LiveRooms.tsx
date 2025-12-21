import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLiveRooms } from '@/hooks/useLiveRooms';
import { useAuth } from '@/contexts/AuthContext';
import VideoMeetingDialog from '@/components/VideoMeetingDialog';
import { Plus, Users, Video, Loader2, Radio, X, Globe, Lock, Clock } from 'lucide-react';

const LiveRooms = () => {
  const { user } = useAuth();
  const { rooms, loading, creating, createRoom, joinRoom, leaveRoom, deleteRoom } = useLiveRooms();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [activeMeeting, setActiveMeeting] = useState<{ link: string; name: string; roomId: string } | null>(null);
  const [roomToClose, setRoomToClose] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    
    const room = await createRoom(roomName.trim(), roomDescription.trim() || undefined, isPublic);
    if (room) {
      setRoomName('');
      setRoomDescription('');
      setIsPublic(true);
      setCreateDialogOpen(false);
    }
  };

  const handleJoin = async (room: typeof rooms[0]) => {
    const success = await joinRoom(room.id);
    if (success) {
      setActiveMeeting({
        link: room.meeting_link,
        name: room.name,
        roomId: room.id,
      });
    }
  };

  const handleLeave = async () => {
    if (activeMeeting) {
      await leaveRoom(activeMeeting.roomId);
      setActiveMeeting(null);
    }
  };

  const handleCloseRoom = async () => {
    if (!roomToClose) return;
    setIsClosing(true);
    await deleteRoom(roomToClose);
    setIsClosing(false);
    setRoomToClose(null);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Video className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Rooms</h2>
            <p className="text-xs text-muted-foreground">Live meeting spaces anyone can join</p>
          </div>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Live Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="room-name">Room Name</Label>
                <Input
                  id="room-name"
                  placeholder="e.g., Startup Q&A Session"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="room-description">Description (optional)</Label>
                <Textarea
                  id="room-description"
                  placeholder="What's this room about?"
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="public-toggle" className="text-sm font-medium">Public Room</Label>
                  <p className="text-xs text-muted-foreground">
                    {isPublic ? 'Visible to everyone & posted to feed' : 'Only visible to you in Meetings tab'}
                  </p>
                </div>
                <Switch
                  id="public-toggle"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
              <Button 
                onClick={handleCreate} 
                disabled={!roomName.trim() || creating}
                className="w-full"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create & Go Live'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : rooms.length === 0 ? (
        <Card className="tech-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Video className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Active Rooms</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Be the first to create a live room and start connecting!
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <div 
            className="flex flex-wrap gap-3 pb-2"
            style={{ 
              height: '320px',
              flexDirection: 'column',
              alignContent: 'flex-start'
            }}
          >
            {rooms.map((room) => (
              <Card 
                key={room.id} 
                className="tech-card border-0 hover:shadow-lg transition-shadow w-[300px] h-[145px] shrink-0"
              >
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">{room.name}</CardTitle>
                      {room.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{room.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 flex items-center gap-0.5 border-0 ${
                        room.is_public 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {room.is_public ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 flex items-center gap-0.5 bg-green-500/10 text-green-600 border-0">
                        <Radio className="h-2.5 w-2.5 animate-pulse" />
                        Live
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={room.creator?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {room.creator?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">
                        {room.creator?.full_name || 'Unknown'}
                      </span>
                      <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                        <Users className="h-2.5 w-2.5" />
                        {room.participant_count}
                      </div>
                      {room.expires_at && (
                        <div className="flex items-center gap-0.5 text-[11px] text-amber-500">
                          <Clock className="h-2.5 w-2.5" />
                          {getTimeRemaining(room.expires_at)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {user?.id === room.creator_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => setRoomToClose(room.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="sm" className="h-7 text-xs px-3" onClick={() => handleJoin(room)}>
                        Join
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Video Meeting Dialog */}
      {activeMeeting && (
        <VideoMeetingDialog
          open={!!activeMeeting}
          onOpenChange={(open) => {
            if (!open) handleLeave();
          }}
          meetingLink={activeMeeting.link}
          userId={user?.id}
          meetingTitle={activeMeeting.name}
        />
      )}

      {/* Close Room Confirmation Dialog */}
      <Dialog open={!!roomToClose} onOpenChange={(open) => !open && setRoomToClose(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to close this room? All participants will be removed and the room will no longer be accessible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRoomToClose(null)} disabled={isClosing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCloseRoom} disabled={isClosing}>
              {isClosing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Closing...
                </>
              ) : (
                'Close Room'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveRooms;
