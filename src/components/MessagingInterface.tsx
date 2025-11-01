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
import { OnlineStatusIndicator } from './OnlineStatusIndicator';

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
    <div className="h-[calc(100vh-200px)] flex flex-col lg:flex-row gap-6 p-4 animate-in fade-in duration-700">
      {/* Conversations List */}
      <Card className={`w-full lg:w-80 flex flex-col backdrop-blur-lg bg-background/95 border-2 rounded-3xl shadow-2xl overflow-hidden ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
        <CardHeader className="pb-3 px-6 pt-6 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-3 font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              <MessageSquare className="h-6 w-6 text-primary drop-shadow-lg" />
              Messages
            </CardTitle>
            <Button 
              size="sm" 
              onClick={() => setShowNewChat(!showNewChat)}
              className="rounded-full px-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/80"
            >
              + New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col min-h-0">
          {showNewChat && (
            <div className="px-6 py-4 border-b border-border/50 bg-gradient-to-b from-primary/5 to-transparent">
              <Input
                placeholder="🔍 Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-3 rounded-2xl border-2 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
              />
              <ScrollArea className="h-48">
                {filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center gap-3 p-3 mb-2 hover:bg-primary/10 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md backdrop-blur-sm bg-background/30"
                    onClick={() => startNewConversation(user.user_id)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-md">
                        {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary/60 text-white font-semibold">{user.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <OnlineStatusIndicator 
                        userId={user.user_id} 
                        size="sm" 
                        className="absolute bottom-0 right-0" 
                      />
                    </div>
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
              <div className="p-12 text-center text-muted-foreground">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                  <MessageSquare className="relative h-16 w-16 mx-auto opacity-40 text-primary" />
                </div>
                <p className="text-lg font-semibold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">No conversations yet</p>
                <p className="text-sm text-muted-foreground/70">Start a new chat to connect with others</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-4 mx-3 mb-2 cursor-pointer transition-all duration-300 rounded-2xl ${
                    selectedConversation === (conv.user1_id === user?.id ? conv.user2_id : conv.user1_id)
                      ? 'bg-gradient-to-r from-primary/20 to-primary/10 shadow-lg scale-[1.02] border-2 border-primary/30'
                      : 'hover:bg-primary/5 hover:shadow-md hover:scale-[1.01] backdrop-blur-sm bg-background/30'
                  }`}
                  onClick={() => {
                    const otherUserId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
                    setSelectedConversation(otherUserId);
                    fetchMessages(otherUserId);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-lg">
                        {conv.other_user?.avatar_url && <AvatarImage src={conv.other_user.avatar_url} />}
                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary/60 text-white font-bold">
                          {conv.other_user?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {conv.other_user?.user_id && (
                        <OnlineStatusIndicator 
                          userId={conv.other_user.user_id} 
                          size="sm" 
                          className="absolute bottom-0 right-0" 
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {conv.other_user?.full_name || 'Unknown User'}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge className="ml-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg animate-pulse">
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
      <Card className={`flex-1 flex flex-col backdrop-blur-lg bg-background/95 border-2 rounded-3xl shadow-2xl overflow-hidden ${selectedConversation ? 'flex' : 'hidden lg:flex'}`}>
        {selectedConversation && selectedUser ? (
          <>
            <CardHeader className="pb-4 pt-4 px-6 border-b border-border/50 bg-gradient-to-r from-primary/10 via-background to-background">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="lg:hidden rounded-full hover:bg-primary/10 transition-all duration-300 hover:scale-110"
                  onClick={() => setSelectedConversation(null)}
                >
                  ← Back
                </Button>
                <div className="relative">
                  <Avatar className="h-11 w-11 ring-2 ring-primary/30 ring-offset-2 ring-offset-background shadow-lg">
                    {selectedUser.avatar_url && <AvatarImage src={selectedUser.avatar_url} />}
                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary/60 text-white font-bold">{selectedUser.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <OnlineStatusIndicator 
                    userId={selectedUser.user_id} 
                    size="sm" 
                    className="absolute bottom-0 right-0" 
                  />
                </div>
              <div>
                <CardTitle className="text-lg">{selectedUser.full_name}</CardTitle>
              </div>
            </div>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-4 scroll-smooth">
              <div className="space-y-3">
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
                    >
                      <div
                        className={`max-w-[70%] rounded-3xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl ${
                          isOwn
                            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-br-md'
                            : 'bg-gradient-to-br from-muted to-muted/80 backdrop-blur-sm rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-2 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {formatDistanceToNow(new Date(msg.created_at))} ago
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <CardContent className="border-t border-border/50 pt-4 pb-4 px-6 bg-gradient-to-t from-primary/5 to-transparent">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-3"
              >
                <Input
                  placeholder="💬 Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  aria-label="Message input"
                  className="rounded-full border-2 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm px-6"
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim()} 
                  aria-label="Send message"
                  className="rounded-full h-11 w-11 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:scale-100 bg-gradient-to-r from-primary to-primary/80"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center p-12">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                <MessageSquare className="relative h-16 w-16 mx-auto opacity-40 text-primary" />
              </div>
              <p className="text-lg font-semibold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Select a conversation</p>
              <p className="text-sm text-muted-foreground/70">Choose a conversation or start a new one</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
});

export default MessagingInterface;
