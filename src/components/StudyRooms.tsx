import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, MessageCircle, Upload, File, Download, Search, X } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  max_members: number;
  member_count?: number;
  created_at: string;
}

interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

interface GroupFile {
  id: string;
  group_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface GroupMember {
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

const CATEGORIES = [
  'Programming',
  'AI & Machine Learning',
  'Research & Papers',
  'Business & Startups',
  'Design & UX',
  'Science & Math',
  'General'
];

export default function StudyRooms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [files, setFiles] = useState<GroupFile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showMyRoomsOnly, setShowMyRoomsOnly] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showChatSheet, setShowChatSheet] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    category: 'General',
    max_members: 20
  });

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
    }
  }, [selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time message updates
  useRealtime({
    table: 'study_group_messages',
    filter: selectedGroup ? `group_id=eq.${selectedGroup.id}` : undefined,
    onInsert: (payload) => {
      setMessages(prev => [...prev, payload as GroupMessage]);
    }
  });

  const fetchStudyGroups = async () => {
    const { data, error } = await supabase
      .from('study_groups')
      .select('*, study_group_members(count)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching study groups:', error);
      return;
    }

    const groupsWithCount = data.map(group => ({
      ...group,
      member_count: group.study_group_members?.[0]?.count || 0
    }));

    setStudyGroups(groupsWithCount);
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

    setMyGroups(data.map(m => m.group_id));
  };

  const fetchMessages = async () => {
    if (!selectedGroup) return;

    const { data, error } = await supabase
      .from('study_group_messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('group_id', selectedGroup.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const fetchMembers = async () => {
    if (!selectedGroup) return;

    const { data, error } = await supabase
      .from('study_group_members')
      .select('user_id, profiles(full_name, avatar_url)')
      .eq('group_id', selectedGroup.id);

    if (error) {
      console.error('Error fetching members:', error);
      return;
    }

    setMembers(data || []);
  };

  const fetchFiles = async () => {
    if (!selectedGroup) return;

    const { data, error } = await supabase
      .from('study_group_files')
      .select('*, profiles(full_name)')
      .eq('group_id', selectedGroup.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching files:', error);
      return;
    }

    setFiles(data || []);
  };

  const handleCreateRoom = async () => {
    if (!user || !newRoom.name.trim()) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .insert({
        name: newRoom.name,
        description: newRoom.description,
        category: newRoom.category,
        max_members: newRoom.max_members,
        created_by: user.id
      })
      .select()
      .single();

    if (groupError) {
      toast({ title: 'Error', description: 'Failed to create study room', variant: 'destructive' });
      return;
    }

    // Add creator as member
    const { error: memberError } = await supabase
      .from('study_group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin'
      });

    if (memberError) {
      console.error('Error adding creator as member:', memberError);
    }

    toast({ title: 'Success', description: 'Study room created successfully!' });
    setShowCreateDialog(false);
    setNewRoom({ name: '', description: '', category: 'General', max_members: 20 });
    fetchStudyGroups();
    fetchMyGroups();
  };

  const handleJoinRoom = async (groupId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('study_group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member'
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to join study room', variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Joined study room!' });
    fetchMyGroups();
    fetchStudyGroups();
  };

  const handleLeaveRoom = async (groupId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('study_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to leave study room', variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Left study room' });
    fetchMyGroups();
    fetchStudyGroups();
    if (selectedGroup?.id === groupId) {
      setShowChatSheet(false);
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
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
      return;
    }

    setNewMessage('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !selectedGroup || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      toast({ title: 'Error', description: 'File size must be less than 10MB', variant: 'destructive' });
      return;
    }

    setUploading(true);

    const filePath = `${selectedGroup.id}/${user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('study-room-files')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' });
      setUploading(false);
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
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size
      });

    if (dbError) {
      toast({ title: 'Error', description: 'Failed to save file info', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'File uploaded successfully!' });
      fetchFiles();
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openChat = (group: StudyGroup) => {
    setSelectedGroup(group);
    setShowChatSheet(true);
  };

  const filteredGroups = studyGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || group.category === categoryFilter;
    const matchesMyRooms = !showMyRoomsOnly || myGroups.includes(group.id);
    
    return matchesSearch && matchesCategory && matchesMyRooms;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Study Rooms
          </CardTitle>
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
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Room Name *</label>
                  <Input
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    placeholder="e.g., AI Research Group"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    placeholder="What will this study room focus on?"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newRoom.category} onValueChange={(value) => setNewRoom({ ...newRoom, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Max Members</label>
                  <Input
                    type="number"
                    value={newRoom.max_members}
                    onChange={(e) => setNewRoom({ ...newRoom, max_members: parseInt(e.target.value) })}
                    min={2}
                    max={100}
                  />
                </div>
                <Button onClick={handleCreateRoom} className="w-full">
                  Create Study Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search study rooms..."
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showMyRoomsOnly ? 'default' : 'outline'}
            onClick={() => setShowMyRoomsOnly(!showMyRoomsOnly)}
          >
            My Rooms
          </Button>
        </div>

        {/* Study Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map(group => {
            const isMember = myGroups.includes(group.id);
            const isFull = (group.member_count || 0) >= group.max_members;

            return (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge variant="secondary" className="mt-2">{group.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {group.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{group.member_count || 0}/{group.max_members}</span>
                  </div>
                  {isMember ? (
                    <div className="flex gap-2">
                      <Button onClick={() => openChat(group)} className="flex-1">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Open Chat
                      </Button>
                      <Button variant="outline" onClick={() => handleLeaveRoom(group.id)}>
                        Leave
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleJoinRoom(group.id)}
                      disabled={isFull}
                      className="w-full"
                    >
                      {isFull ? 'Room Full' : 'Join Room'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No study rooms found. Create one to get started!</p>
          </div>
        )}
      </CardContent>

      {/* Chat Sheet */}
      <Sheet open={showChatSheet} onOpenChange={setShowChatSheet}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
          {selectedGroup && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 border-b">
                <SheetTitle className="flex items-center justify-between">
                  <span>{selectedGroup.name}</span>
                  <Button variant="outline" size="sm" onClick={() => handleLeaveRoom(selectedGroup.id)}>
                    Leave Room
                  </Button>
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-hidden flex">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div key={msg.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {msg.profiles?.full_name?.[0] || '?'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{msg.profiles?.full_name || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage}>Send</Button>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="w-64 border-l p-4 space-y-4">
                  {/* Members */}
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Members ({members.length})
                    </h3>
                    <ScrollArea className="h-32">
                      <div className="space-y-2">
                        {members.map((member) => (
                          <div key={member.user_id} className="text-sm flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                              {member.profiles?.full_name?.[0] || '?'}
                            </div>
                            <span>{member.profiles?.full_name || 'Unknown'}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Files */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <File className="h-4 w-4" />
                        Files ({files.length})
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                      />
                    </div>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {files.map((file) => (
                          <div key={file.id} className="text-xs bg-muted p-2 rounded space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{file.file_name}</span>
                              <a href={file.file_url} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-3 w-3" />
                              </a>
                            </div>
                            <div className="text-muted-foreground">
                              {file.profiles?.full_name} • {(file.file_size / 1024).toFixed(0)}KB
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}