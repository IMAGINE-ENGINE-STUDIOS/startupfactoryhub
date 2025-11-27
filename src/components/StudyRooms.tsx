import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Users, MessageSquare, FileText, Upload, Download, Send } from 'lucide-react';

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
}

interface GroupFile {
  id: string;
  group_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  user_id: string;
  user_name?: string;
}

interface GroupMember {
  user_id: string;
  joined_at: string;
  user_name?: string;
}

export default function StudyRooms() {
  const { user } = useAuth();
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [files, setFiles] = useState<GroupFile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchStudyGroups();
    if (user) {
      fetchMyGroups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchMessages();
      fetchMembers();
      fetchFiles();

      // Subscribe to real-time messages
      const channel = supabase
        .channel(`room-${selectedGroup.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'study_group_messages',
            filter: `group_id=eq.${selectedGroup.id}`
          },
          async (payload) => {
            const newMessage = payload.new as GroupMessage;
            
            // Fetch user profile for the new message
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', newMessage.user_id)
              .single();
            
            setMessages(prev => [...prev, {
              ...newMessage,
              user_name: profile?.full_name || 'Unknown User'
            }]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedGroup]);

  const fetchStudyGroups = async () => {
    const { data, error } = await supabase
      .from('study_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching study groups:', error);
      return;
    }

    setStudyGroups(data || []);
  };

  const fetchMyGroups = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('study_group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching my groups:', error);
      return;
    }

    setMyGroups(data?.map(m => m.group_id) || []);
  };

  const fetchMessages = async () => {
    if (!selectedGroup) return;

    const { data, error } = await supabase
      .from('study_group_messages')
      .select('*')
      .eq('group_id', selectedGroup.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    // Fetch user profiles for all messages
    const userIds = [...new Set(data?.map(m => m.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
    
    const messagesWithNames = data?.map(msg => ({
      ...msg,
      user_name: profileMap.get(msg.user_id) || 'Unknown User'
    })) || [];

    setMessages(messagesWithNames);
  };

  const fetchMembers = async () => {
    if (!selectedGroup) return;

    const { data, error } = await supabase
      .from('study_group_members')
      .select('user_id, joined_at')
      .eq('group_id', selectedGroup.id)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching members:', error);
      return;
    }

    // Fetch user profiles for all members
    const userIds = data?.map(m => m.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
    
    const membersWithNames = data?.map(member => ({
      ...member,
      user_name: profileMap.get(member.user_id) || 'Unknown User'
    })) || [];

    setMembers(membersWithNames);
  };

  const fetchFiles = async () => {
    if (!selectedGroup) return;

    const { data, error } = await supabase
      .from('study_group_files')
      .select('*')
      .eq('group_id', selectedGroup.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
      return;
    }

    // Fetch user profiles for all file uploaders
    const userIds = [...new Set(data?.map(f => f.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
    
    const filesWithNames = data?.map(file => ({
      ...file,
      user_name: profileMap.get(file.user_id) || 'Unknown User'
    })) || [];

    setFiles(filesWithNames);
  };

  const handleCreateRoom = async () => {
    if (!user || !newRoom.name.trim()) {
      toast.error('Please enter a room name');
      return;
    }

    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .insert({
        name: newRoom.name,
        description: newRoom.description || null,
        category: 'General',
        max_members: 50,
        is_public: true,
        created_by: user.id
      })
      .select()
      .single();

    if (groupError) {
      toast.error('Failed to create study room');
      console.error(groupError);
      return;
    }

    // Add creator as member
    const { error: memberError } = await supabase
      .from('study_group_members')
      .insert({
        group_id: group.id,
        user_id: user.id
      });

    if (memberError) {
      console.error('Error adding creator as member:', memberError);
    }

    toast.success('Study room created!');
    setShowCreateDialog(false);
    setNewRoom({ name: '', description: '' });
    fetchStudyGroups();
    fetchMyGroups();
  };

  const handleJoinRoom = async (groupId: string) => {
    if (!user) {
      toast.error('Please sign in to join');
      return;
    }

    const { error } = await supabase
      .from('study_group_members')
      .insert({
        group_id: groupId,
        user_id: user.id
      });

    if (error) {
      toast.error('Failed to join room');
      console.error(error);
      return;
    }

    toast.success('Joined room!');
    fetchMyGroups();
  };

  const handleLeaveRoom = async (groupId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('study_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to leave room');
      console.error(error);
      return;
    }

    toast.success('Left room');
    fetchMyGroups();
    if (selectedGroup?.id === groupId) {
      setSelectedGroup(null);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedGroup || !newMessage.trim()) return;

    const { error } = await supabase
      .from('study_group_messages')
      .insert({
        group_id: selectedGroup.id,
        user_id: user.id,
        content: newMessage.trim()
      });

    if (error) {
      toast.error('Failed to send message');
      console.error(error);
      return;
    }

    setNewMessage('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !selectedGroup || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const filePath = `${selectedGroup.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('study-room-files')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Failed to upload file');
      console.error(uploadError);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('study-room-files')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('study_group_files')
      .insert({
        group_id: selectedGroup.id,
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl
      });

    if (dbError) {
      toast.error('Failed to save file');
      console.error(dbError);
      return;
    }

    toast.success('File uploaded!');
    fetchFiles();
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Study Rooms</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  placeholder="Enter room name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  placeholder="What's this room about?"
                />
              </div>
              <Button onClick={handleCreateRoom} className="w-full">
                Create Room
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Study Rooms List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studyGroups.map((group) => {
          const isMember = myGroups.includes(group.id);

          return (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle className="text-lg">{group.name}</CardTitle>
                {group.description && (
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{members.filter(() => true).length} members</span>
                  </div>
                  {isMember ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => {
                        setSelectedGroup(group);
                        setIsSheetOpen(true);
                      }}>
                        Open
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleLeaveRoom(group.id)}>
                        Leave
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => handleJoinRoom(group.id)}>
                      Join
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Room Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl h-full flex flex-col">
          {selectedGroup && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedGroup.name}</SheetTitle>
                {selectedGroup.description && (
                  <p className="text-sm text-muted-foreground">{selectedGroup.description}</p>
                )}
              </SheetHeader>

              <div className="flex-1 flex flex-col overflow-hidden">
                <Tabs defaultValue="comments" className="flex-1 flex flex-col mt-6 overflow-hidden">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="comments">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments
                  </TabsTrigger>
                  <TabsTrigger value="documents">
                    <FileText className="h-4 w-4 mr-2" />
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="members">
                    <Users className="h-4 w-4 mr-2" />
                    Members
                  </TabsTrigger>
                </TabsList>

                {/* Comments Tab */}
                <TabsContent value="comments" className="flex-1 flex flex-col overflow-hidden space-y-4 mt-0">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4 pt-4">
                      {messages.map((message) => (
                        <div key={message.id} className="border-b pb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{message.user_name || 'Unknown User'}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2 pt-4 border-t">
                    <Input
                      placeholder="Write a comment..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="flex-1 flex flex-col overflow-hidden mt-0 pt-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center mb-4">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload a document
                      </p>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </Label>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="space-y-2 pr-4">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{file.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.user_name} • {new Date(file.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Members Tab */}
                <TabsContent value="members" className="flex-1 flex flex-col overflow-hidden mt-0">
                  <ScrollArea className="flex-1">
                    <div className="space-y-2 pt-4 pr-4">
                      {members.map((member, idx) => (
                        <div
                          key={`${member.user_id}-${idx}`}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          <Users className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{member.user_name || 'Unknown User'}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
