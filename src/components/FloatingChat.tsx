import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, X, Minus, Search, Bot, Sparkles, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUserRole } from '@/hooks/useUserRole';

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

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function FloatingChat() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'ai'>('messages');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  
  // AI Assistant state
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchAllUsers();
      
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

  // Handle opening chat from Network tab
  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { userId } = customEvent.detail;
      setIsOpen(true);
      setActiveTab('messages');
      setSelectedConversation(userId);
      fetchMessages(userId);
    };

    window.addEventListener('openFloatingChat', handleOpenChat);
    
    return () => {
      window.removeEventListener('openFloatingChat', handleOpenChat);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

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
      const otherUserIds = conversationsData.map(conv => 
        conv.user1_id === user.id ? conv.user2_id : conv.user1_id
      );

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', otherUserIds);

      const { data: unreadData } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .eq('read', false);

      const unreadCounts = (unreadData || []).reduce((acc, msg) => {
        acc[msg.sender_id] = (acc[msg.sender_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setTotalUnread(unreadData?.length || 0);

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
      
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId)
        .eq('read', false);
      
      fetchConversations();
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to send messages",
      });
      return;
    }

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
  };

  const startNewConversation = (userId: string) => {
    setSelectedConversation(userId);
    setShowNewChat(false);
    fetchMessages(userId);
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim() || isAiLoading) return;
    
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to use AI Assistant",
      });
      return;
    }

    const userMessage = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chatbot', {
        body: { 
          message: userMessage,
          conversationId,
          userRole: role || 'startup'
        }
      });

      if (error) {
        if (error.message?.includes('Rate limit')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Too many requests. Please wait a moment and try again.",
            variant: "destructive",
          });
          return;
        }
        
        if (error.message?.includes('credits exhausted') || error.message?.includes('Payment required')) {
          toast({
            title: "AI Credits Exhausted",
            description: "Please add credits to your workspace to continue using AI features.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      setAiMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error: any) {
      console.error('Error calling AI:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      
      setAiMessages(prev => prev.slice(0, -1));
    } finally {
      setIsAiLoading(false);
    }
  };

  const selectedUser = selectedConversation 
    ? conversations.find(c => 
        c.user1_id === selectedConversation || c.user2_id === selectedConversation
      )?.other_user || allUsers.find(u => u.user_id === selectedConversation)
    : null;

  const filteredUsers = allUsers.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
          {totalUnread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 rounded-full"
            >
              {totalUnread}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-2 right-2 left-2 sm:left-auto sm:bottom-6 sm:right-6 sm:w-96 h-[600px] max-h-[calc(100vh-1rem)] bg-background border rounded-lg shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-card shrink-0">
            <div className="flex items-center gap-2">
              {activeTab === 'ai' ? (
                <>
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-sm">AI Assistant</h3>
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5" />
                  <h3 className="font-semibold text-sm">
                    {selectedConversation ? selectedUser?.full_name : 'Messages'}
                  </h3>
                </>
              )}
            </div>
            <div className="flex gap-1">
              {selectedConversation && activeTab === 'messages' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setSelectedConversation(null);
                    setMessages([]);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Tab Navigation */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'messages' | 'ai')} className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2 mx-3 mt-2 mb-2 shrink-0">
                  <TabsTrigger value="messages" className="gap-2 text-xs">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Messages
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="gap-2 text-xs">
                    <Bot className="h-3.5 w-3.5" />
                    AI Assistant
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden">
                  {/* Conversations List */}
                  {!selectedConversation && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-3 border-b">
                    <Button 
                      size="sm" 
                      onClick={() => setShowNewChat(!showNewChat)}
                      variant="outline"
                      className="w-full"
                    >
                      New Message
                    </Button>
                  </div>

                  {showNewChat && (
                    <div className="p-3 border-b">
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                      <ScrollArea className="h-32">
                        {filteredUsers.map((user) => (
                          <div
                            key={user.user_id}
                            className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg cursor-pointer"
                            onClick={() => startNewConversation(user.user_id)}
                          >
                            <Avatar className="h-8 w-8">
                            {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                            <AvatarFallback className="text-xs">{user.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.full_name}</p>
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
                        <p className="text-sm">No conversations yet</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className="p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            const otherUserId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
                            setSelectedConversation(otherUserId);
                            fetchMessages(otherUserId);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-10 w-10">
                              {conv.other_user?.avatar_url && <AvatarImage src={conv.other_user.avatar_url} />}
                              <AvatarFallback>
                                {conv.other_user?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate">
                                  {conv.other_user?.full_name || 'Unknown User'}
                                </p>
                                {conv.unread_count > 0 && (
                                  <Badge variant="destructive" className="ml-2 h-5 min-w-5 text-xs">
                                    {conv.unread_count}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {conv.last_message_content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </ScrollArea>
                </div>
              )}

              {/* Chat View */}
              {selectedConversation && selectedUser && (
                <div className="flex-1 flex flex-col min-h-0">
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg p-2 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm break-words">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="p-3 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} disabled={!newMessage.trim()} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
                </TabsContent>

                <TabsContent value="ai" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden">
                  <ScrollArea className="flex-1 p-3">
                    {aiMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                        <Bot className="h-10 w-10 mb-3 opacity-50" />
                        <p className="text-sm font-medium">How can I help you today?</p>
                        <p className="text-xs mt-2">Ask me about your startup, funding, mentorship, or learning!</p>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {aiMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg px-3 py-2 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                        </div>
                      ))}
                      
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg px-3 py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                      <div ref={aiMessagesEndRef} />
                    </div>
                  </ScrollArea>
                  
                  <div className="border-t p-3 shrink-0 bg-background">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendAiMessage();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isAiLoading}
                        className="text-sm"
                      />
                      <Button type="submit" size="icon" disabled={isAiLoading || !aiInput.trim()} className="shrink-0">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      )}
    </>
  );
}
