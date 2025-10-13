import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Send, Search, MessageSquare, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  last_message_content: string;
  other_user?: {
    user_id: string;
    full_name: string;
    avatar_url?: string;
  };
  unread_count?: number;
}

interface Profile {
  user_id: string;
  full_name: string;
  avatar_url?: string;
}

const MessagingInterface = memo(function MessagingInterface() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchAllUsers();
      
      // Real-time subscription for new messages
      const channel = supabase
        .channel('messages-changes')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            if (payload.new.receiver_id === user.id || payload.new.sender_id === user.id) {
              fetchConversations();
              if (selectedConversation) {
                fetchMessages(selectedConversation);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAllUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .neq('user_id', user?.id);
    
    if (data) {
      setAllUsers(data);
    }
  };

  const fetchConversations = async () => {
    if (!user) return;

    const { data: conversationsData } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (conversationsData) {
      // Get other user IDs
      const otherUserIds = conversationsData.map(conv => 
        conv.user1_id === user.id ? conv.user2_id : conv.user1_id
      );

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', otherUserIds);

      // Get unread counts
      const { data: unreadData } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .eq('read', false);

      const unreadCounts = (unreadData || []).reduce((acc, msg) => {
        acc[msg.sender_id] = (acc[msg.sender_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, Profile>);

      const formattedConversations = conversationsData.map(conv => {
        const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
        return {
          ...conv,
          other_user: profilesMap[otherUserId],
          unread_count: unreadCounts[otherUserId] || 0
        };
      });

      setConversations(formattedConversations);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId)
        .eq('read', false);
      
      fetchConversations();
    }
  };

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user || !selectedConversation) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedConversation,
        content: newMessage.trim()
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage('');
      fetchMessages(selectedConversation);
      fetchConversations();
    }
  }, [newMessage, user, selectedConversation, toast]);

  const startNewConversation = useCallback((userId: string) => {
    setSelectedConversation(userId);
    setShowNewChat(false);
    fetchMessages(userId);
  }, []);

  const selectedUser = useMemo(() => 
    selectedConversation 
      ? conversations.find(c => 
          c.user1_id === selectedConversation || c.user2_id === selectedConversation
        )?.other_user || allUsers.find(u => u.user_id === selectedConversation)
      : null,
    [selectedConversation, conversations, allUsers]
  );

  const filteredUsers = useMemo(() => 
    allUsers.filter(u => 
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [allUsers, searchQuery]
  );

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col lg:flex-row gap-4">
      {/* Conversations List */}
      <Card className={`w-full lg:w-80 flex flex-col ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
            <Button 
              size="sm" 
              onClick={() => setShowNewChat(!showNewChat)}
              variant="outline"
            >
              New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col min-h-0">
          {showNewChat && (
            <div className="p-4 border-b">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />
              <ScrollArea className="h-48">
                {filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                    onClick={() => startNewConversation(user.user_id)}
                  >
                    <Avatar className="h-10 w-10">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                    <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.full_name}</p>
                  </div>
                </div>
                ))}
              </ScrollArea>
            </div>
          )}
          
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new chat to connect</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    selectedConversation === (conv.user1_id === user?.id ? conv.user2_id : conv.user1_id)
                      ? 'bg-muted'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    const otherUserId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
                    setSelectedConversation(otherUserId);
                    fetchMessages(otherUserId);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {conv.other_user?.avatar_url && <AvatarImage src={conv.other_user.avatar_url} />}
                      <AvatarFallback>
                        {conv.other_user?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {conv.other_user?.full_name || 'Unknown User'}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.last_message_content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.last_message_at))} ago
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Card className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden lg:flex'}`}>
        {selectedConversation && selectedUser ? (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="lg:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  ← Back
                </Button>
                <Avatar>
                {selectedUser.avatar_url && <AvatarImage src={selectedUser.avatar_url} />}
                <AvatarFallback>{selectedUser.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{selectedUser.full_name}</CardTitle>
              </div>
            </div>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {formatDistanceToNow(new Date(msg.created_at))} ago
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <CardContent className="border-t pt-4">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  aria-label="Message input"
                />
                <Button type="submit" disabled={!newMessage.trim()} aria-label="Send message">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose a conversation or start a new one</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
});

export default MessagingInterface;
