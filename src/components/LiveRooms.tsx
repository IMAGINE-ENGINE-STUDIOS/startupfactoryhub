import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLiveRooms } from '@/hooks/useLiveRooms';
import { useAuth } from '@/contexts/AuthContext';
import VideoMeetingDialog from '@/components/VideoMeetingDialog';
import { Plus, Users, Video, Loader2, Radio, Trash2 } from 'lucide-react';

const LiveRooms = () => {
  const { user } = useAuth();
  const { rooms, loading, creating, createRoom, joinRoom, leaveRoom, deleteRoom } = useLiveRooms();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [activeMeeting, setActiveMeeting] = useState<{ link: string; name: string; roomId: string } | null>(null);

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    
    const room = await createRoom(roomName.trim(), roomDescription.trim() || undefined);
    if (room) {
      setRoomName('');
      setRoomDescription('');
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

  const handleDelete = async (roomId: string) => {
    await deleteRoom(roomId);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card key={room.id} className="tech-card border-0 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold truncate">{room.name}</CardTitle>
                    {room.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{room.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-2 flex items-center gap-1 shrink-0 bg-green-500/10 text-green-600 border-0">
                    <Radio className="h-3 w-3 animate-pulse" />
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={room.creator?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {room.creator?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                      {room.creator?.full_name || 'Unknown'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {room.participant_count}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.id === room.creator_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(room.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" onClick={() => handleJoin(room)}>
                      Join
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
    </div>
  );
};

export default LiveRooms;
