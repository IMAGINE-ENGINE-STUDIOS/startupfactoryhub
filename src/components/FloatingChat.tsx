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
import { Send, MessageSquare, X, Minus, Search, Loader2, ChevronDown, Plus, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUserRole } from '@/hooks/useUserRole';
import ReactMarkdown from 'react-markdown';
import geniusAILogo from '@/assets/genius-ai-logo.png';

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
  const [docReadyBadge, setDocReadyBadge] = useState(false);
  
  // AI Assistant state
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<'genius' | 'quick'>('genius');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for document-ready events from Genius AI
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setDocReadyBadge(true);
      // Also add a notification message in AI chat
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: `📄 **Document ready!** "${detail?.title || 'Your document'}" has been generated and inserted into LightPaper.`
      }]);
    };
    window.addEventListener('genius-document-ready', handler);
    return () => window.removeEventListener('genius-document-ready', handler);
  }, []);

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
    const handleOpenChat = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { userId } = customEvent.detail;
      setIsOpen(true);
      setActiveTab('messages');
      setSelectedConversation(userId);
      fetchMessages(userId);
      
      const existingUser = allUsers.find(u => u.user_id === userId);
      if (!existingUser && userId) {
        const { data } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .eq('user_id', userId)
          .single();
        
        if (data) {
          setAllUsers(prev => [...prev, data]);
        }
      }
    };

    window.addEventListener('openFloatingChat', handleOpenChat);
    
    return () => {
      window.removeEventListener('openFloatingChat', handleOpenChat);
    };
  }, [allUsers]);

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

  const CHAT_PRESETS = [
    { id: 'general', name: 'General', icon: '💬' },
    { id: 'startup', name: 'Startup Advice', icon: '🚀' },
    { id: 'funding', name: 'Funding Guide', icon: '💰' },
    { id: 'mentorship', name: 'Mentorship', icon: '🎓' },
    { id: 'writing', name: 'Writing Tips', icon: '✍️' },
    { id: 'legal', name: 'Legal Q&A', icon: '⚖️' },
  ];

  const getSystemOverride = () => {
    if (aiMode === 'quick') {
      return `You are **Genius AI** in QUICK mode. RULES:
1. Give the SHORTEST possible answer. Yes, No, or a few words.
2. MAXIMUM 240 characters total in your response. NEVER exceed this.
3. If the user's intent is a yes/no question, answer ONLY "Yes" or "No" — nothing else.
4. If it needs a short explanation, keep it under 240 characters.
5. No markdown, no formatting, no bullet points. Just plain text.
6. Be direct and decisive. No hedging, no "it depends" unless truly necessary.`;
    }

    const presetInstructions: Record<string, string> = {
      general: 'You help users with startup advice, funding guidance, mentorship questions, document writing tips, and general queries.',
      startup: 'You are a startup advisor. Focus on business strategy, product-market fit, scaling, team building, and common startup pitfalls.',
      funding: 'You are a funding expert. Help with fundraising strategies, investor relations, pitch decks, valuation, and funding rounds.',
      mentorship: 'You are a mentorship guide. Help with career development, skill building, networking, and professional growth.',
      writing: 'You are a writing coach. Help with document structure, tone, clarity, persuasive writing, and professional communication.',
      legal: 'You provide general legal guidance for startups. Help with incorporation, IP, contracts, compliance. Always recommend consulting a lawyer for specific advice.',
    };

    const preset = selectedPreset || 'general';
    return `You are **Genius AI**, a helpful assistant on the Imagine Startup Factory platform. ${presetInstructions[preset] || presetInstructions.general} Be concise, friendly, and actionable. Use markdown formatting.`;
  };

  /** Streaming AI call using lightpaper-genius edge function */
  const sendAiMessage = async () => {
    if (!aiInput.trim() || isAiLoading) return;
    
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to use Genius AI",
      });
      return;
    }

    const userMessage = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

    try {
      const allMessages = [...aiMessages, { role: 'user' as const, content: userMessage }];
      const messagesPayload = allMessages.map(m => ({ role: m.role, content: m.content }));

      const systemOverride = getSystemOverride();

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lightpaper-genius`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: messagesPayload, systemOverride }),
        }
      );

      if (resp.status === 429) {
        toast({ title: "Rate Limit", description: "Too many requests. Please wait.", variant: "destructive" });
        setAiMessages(prev => prev.slice(0, -1));
        return;
      }
      if (resp.status === 402) {
        toast({ title: "Credits Exhausted", description: "Please add credits to continue.", variant: "destructive" });
        setAiMessages(prev => prev.slice(0, -1));
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      // Stream the response
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";

      // Add placeholder message
      setAiMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              fullText += c;
              setAiMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: fullText };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      for (const raw of textBuffer.split("\n")) {
        if (!raw || raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const c = JSON.parse(jsonStr).choices?.[0]?.delta?.content;
          if (c) {
            fullText += c;
            setAiMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: fullText };
              return updated;
            });
          }
        } catch {}
      }

    } catch (error: any) {
      console.error('Error calling Genius AI:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response.",
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
      {/* Chat Toggle Button — Genius AI Logo */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 rounded-full shadow-2xl hover:shadow-3xl z-50 transition-all duration-300 hover:scale-110 bg-gradient-to-br from-primary to-primary/80 p-0 overflow-hidden"
          size="icon"
        >
          <img src={geniusAILogo} alt="Genius AI" className="h-9 w-9 rounded-full object-cover" />
          {(totalUnread > 0 || docReadyBadge) && (
            <Badge 
              className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg animate-pulse"
            >
              {totalUnread > 0 ? totalUnread : '!'}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-2 right-2 left-2 sm:left-auto sm:bottom-6 sm:right-6 sm:w-96 h-[600px] max-h-[calc(100vh-1rem)] backdrop-blur-lg bg-background/95 border-2 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 via-background to-background shrink-0">
            <div className="flex items-center gap-2">
              {activeTab === 'ai' ? (
                <>
                  <img src={geniusAILogo} alt="Genius AI" className="h-5 w-5 rounded-full object-cover" />
                  <h3 className="font-semibold text-sm">Genius AI</h3>
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
                onClick={() => { setIsOpen(false); setDocReadyBadge(false); }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Tab Navigation */}
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'messages' | 'ai'); if (v === 'ai') setDocReadyBadge(false); }} className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2 mt-2 mb-2 mx-2 shrink-0">
                  <TabsTrigger value="messages" className="gap-1 text-xs px-1 sm:px-2 min-w-0 relative">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">Messages</span>
                    {docReadyBadge && activeTab !== 'messages' && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="gap-1 text-xs px-1 sm:px-2 min-w-0">
                    <img src={geniusAILogo} alt="" className="h-3.5 w-3.5 rounded-full object-cover shrink-0" />
                    <span className="hidden sm:inline">Genius AI</span>
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
                      className="w-full rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary to-primary/80"
                    >
                      + New Message
                    </Button>
                  </div>

                  {showNewChat && (
                    <div className="p-3 border-b">
                      <Input
                        placeholder="🔍 Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-3 rounded-2xl border-2 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                      />
                      <ScrollArea className="h-32">
                        {filteredUsers.map((user) => (
                          <div
                            key={user.user_id}
                            className="flex items-center gap-3 p-3 mb-2 hover:bg-primary/10 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md backdrop-blur-sm bg-background/30"
                            onClick={() => startNewConversation(user.user_id)}
                          >
                            <Avatar className="h-10 w-10 ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-md">
                            {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/80 to-primary/60 text-white font-semibold">{user.full_name.charAt(0)}</AvatarFallback>
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
                      <div className="p-10 text-center text-muted-foreground">
                        <div className="relative inline-block mb-4">
                          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                          <MessageSquare className="relative h-14 w-14 mx-auto opacity-40 text-primary" />
                        </div>
                        <p className="text-sm font-medium bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">No conversations yet</p>
                        <p className="text-xs mt-2 text-muted-foreground/70">Start a new chat to connect</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className="p-3 mx-2 mb-2 cursor-pointer hover:bg-primary/10 hover:shadow-md rounded-2xl transition-all duration-300 hover:scale-[1.01] backdrop-blur-sm bg-background/30"
                          onClick={() => {
                            const otherUserId = conv.user1_id === user?.id ? conv.user2_id : conv.user1_id;
                            setSelectedConversation(otherUserId);
                            fetchMessages(otherUserId);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-lg">
                              {conv.other_user?.avatar_url && <AvatarImage src={conv.other_user.avatar_url} />}
                              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary/60 text-white font-bold">
                                {conv.other_user?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate">
                                  {conv.other_user?.full_name || 'Unknown User'}
                                </p>
                                {conv.unread_count > 0 && (
                                  <Badge className="ml-2 h-5 min-w-5 text-xs rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md animate-pulse">
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
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                          >
                            <div
                              className={`max-w-[75%] rounded-3xl p-3 shadow-md transition-all duration-300 hover:shadow-lg ${
                                isOwn
                                  ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-br-md'
                                  : 'bg-gradient-to-br from-muted to-muted/80 backdrop-blur-sm rounded-bl-md'
                              }`}
                            >
                              <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                              <p className={`text-xs mt-2 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t border-border/50 bg-gradient-to-t from-primary/5 to-transparent">
                    <div className="flex gap-2">
                      <Input
                        placeholder="💬 Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1 rounded-full border-2 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm px-4"
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={!newMessage.trim()} 
                        size="icon"
                        className="rounded-full h-10 w-10 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:scale-100 bg-gradient-to-r from-primary to-primary/80"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
                </TabsContent>

                <TabsContent value="ai" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=active]:flex data-[state=inactive]:hidden">
                  {/* Mode selector: Genius AI / QUICK */}
                  <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 shrink-0">
                    <button
                      onClick={() => setAiMode('genius')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        aiMode === 'genius'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <img src={geniusAILogo} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
                      Genius
                    </button>
                    <button
                      onClick={() => setAiMode('quick')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        aiMode === 'quick'
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Quick
                    </button>
                  </div>

                  {/* Preset selector (only in Genius mode) */}
                  {aiMode === 'genius' && (
                    <div className="px-3 pb-1 shrink-0 relative">
                      <button
                        onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs bg-muted/30 hover:bg-muted/50 transition-colors text-foreground"
                      >
                        <span>{CHAT_PRESETS.find(p => p.id === (selectedPreset || 'general'))?.icon} {CHAT_PRESETS.find(p => p.id === (selectedPreset || 'general'))?.name || 'General'}</span>
                        <ChevronDown className={`h-3 w-3 transition-transform ${showPresetDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showPresetDropdown && (
                        <div className="absolute left-3 right-3 mt-1 z-10 rounded-lg bg-popover border border-border shadow-lg max-h-[180px] overflow-auto">
                          {CHAT_PRESETS.map(preset => (
                            <button
                              key={preset.id}
                              onClick={() => { setSelectedPreset(preset.id); setShowPresetDropdown(false); }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors ${
                                (selectedPreset || 'general') === preset.id ? 'bg-accent' : ''
                              }`}
                            >
                              <span>{preset.icon}</span> {preset.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* QUICK mode hint */}
                  {aiMode === 'quick' && (
                    <div className="px-3 pb-1 shrink-0">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]">
                        <Zap className="h-3 w-3" />
                        Yes/No or short answers only (max 240 chars)
                      </div>
                    </div>
                  )}

                  <ScrollArea className="flex-1 p-3">
                    {aiMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                        <div className="relative inline-block mb-4">
                          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                          {aiMode === 'quick' ? (
                            <Zap className="relative h-14 w-14 text-amber-500 opacity-70" />
                          ) : (
                            <img src={geniusAILogo} alt="Genius AI" className="relative h-14 w-14 rounded-full object-cover opacity-70" />
                          )}
                        </div>
                        <p className="text-base font-semibold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                          {aiMode === 'quick' ? 'Quick answers mode' : 'How can I help you today?'}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {aiMode === 'quick' ? 'Ask yes/no questions or get short answers instantly' : 'Ask me about your startup, funding, mentorship, or writing!'}
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {aiMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}
                        >
                          <div
                            className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-md transition-all duration-300 hover:shadow-lg ${
                              message.role === 'user'
                                ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-br-md'
                                : 'bg-gradient-to-br from-muted to-muted/80 backdrop-blur-sm rounded-bl-md'
                            }`}
                          >
                            {message.role === 'assistant' ? (
                              <div className="prose prose-sm max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {isAiLoading && aiMessages[aiMessages.length - 1]?.role !== 'assistant' && (
                        <div className="flex justify-start mb-3">
                          <div className="bg-gradient-to-br from-muted to-muted/80 rounded-3xl rounded-bl-md px-4 py-3 shadow-md backdrop-blur-sm">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        </div>
                      )}
                      <div ref={aiMessagesEndRef} />
                    </div>
                  </ScrollArea>
                  
                  <div className="border-t border-border/50 p-4 shrink-0 bg-gradient-to-t from-primary/5 to-transparent">
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
                        placeholder={aiMode === 'quick' ? '⚡ Ask a quick question...' : '✨ Ask Genius AI...'}
                        disabled={isAiLoading}
                        className="text-sm rounded-full border-2 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm px-4"
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={isAiLoading || !aiInput.trim()} 
                        className={`shrink-0 rounded-full h-10 w-10 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:scale-100 ${
                          aiMode === 'quick' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-primary to-primary/80'
                        }`}
                      >
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
