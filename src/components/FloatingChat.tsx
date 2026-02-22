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
import { Send, MessageSquare, X, Minus, Search, Loader2, Plus, Zap, FileText, BarChart3, CalendarPlus, Users, Briefcase, Globe, PenSquare, Brain } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUserRole } from '@/hooks/useUserRole';
import { useResources } from '@/hooks/useResources';
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

// ─── Tool / Preset definitions ───────────────────────────────────────────────

interface ToolItem {
  id: string;
  name: string;
  icon: string;
  category: 'quick' | 'document' | 'ai-tools' | 'actions';
  systemHint: string;
}

const ALL_TOOLS: ToolItem[] = [
  // Quick mode
  { id: 'quick', name: 'Quick Answer', icon: '⚡', category: 'quick',
    systemHint: 'QUICK' },

  // Document presets (from LightPaper)
  { id: 'research', name: 'Research Paper', icon: '🔬', category: 'document',
    systemHint: 'Write a formal academic research paper with APA style, citations, and deep analysis.' },
  { id: 'executive-summary', name: 'Executive Summary', icon: '📊', category: 'document',
    systemHint: 'Write a concise, high-impact executive summary with key findings, metrics, and recommendations.' },
  { id: 'pitch', name: 'Pitch Deck Script', icon: '🎯', category: 'document',
    systemHint: 'Write a compelling startup pitch narrative, investor-ready with data points and market statistics.' },
  { id: 'business-plan', name: 'Business Plan', icon: '💼', category: 'document',
    systemHint: 'Write a comprehensive, investor-ready business plan with market analysis and financial projections.' },
  { id: 'book', name: 'Book / Chapter', icon: '📖', category: 'document',
    systemHint: 'Write a book chapter with engaging narrative, proper structure, and 3000-5000 words per chapter.' },
  { id: 'novel', name: 'Novel / Fiction', icon: '✍️', category: 'document',
    systemHint: 'Write creative fiction with rich characters, vivid scenes, natural dialogue, and compelling plot.' },
  { id: 'movie-script', name: 'Movie Script', icon: '🎬', category: 'document',
    systemHint: 'Write in proper screenplay format with scene headings, action lines, and industry-standard formatting.' },
  { id: 'legal', name: 'Legal Document', icon: '⚖️', category: 'document',
    systemHint: 'Write formal legal documents with proper terminology, numbered clauses, and standard provisions.' },
  { id: 'blog', name: 'Blog / Article', icon: '📝', category: 'document',
    systemHint: 'Write an engaging blog post with compelling headline, SEO-friendly structure, and call-to-action.' },
  { id: 'report', name: 'Technical Report', icon: '📋', category: 'document',
    systemHint: 'Write a detailed technical report with data tables, findings, and actionable recommendations.' },
  { id: 'letter', name: 'Formal Letter', icon: '✉️', category: 'document',
    systemHint: 'Write a formal letter with proper letterhead, salutation, body paragraphs, and signature block.' },
  { id: 'free', name: 'Free Writing', icon: '🌟', category: 'document',
    systemHint: 'Write freely based on the user request. Adapt tone, style, and format to match needs.' },

  // AI Tools
  { id: 'analytics', name: 'My Analytics', icon: '📈', category: 'ai-tools',
    systemHint: 'ANALYTICS: You have access to the user analytics data. Explain metrics, trends, and provide insights.' },
  { id: 'intelligence', name: 'Market Intelligence', icon: '🧠', category: 'ai-tools',
    systemHint: 'INTELLIGENCE: Provide market analysis, trending companies, industry insights, and competitive analysis.' },

  // Actions
  { id: 'create-post', name: 'Create Post', icon: '📢', category: 'actions',
    systemHint: 'ACTION: Help user draft a social feed post. Ask what they want to post about, then generate the content.' },
  { id: 'create-meeting', name: 'Book Meeting', icon: '📅', category: 'actions',
    systemHint: 'ACTION: Help user create a meeting link or book a meeting. Ask for details: who, when, topic.' },
  { id: 'contacts', name: 'My Contacts', icon: '👥', category: 'actions',
    systemHint: 'ACTION: Help user find or manage contacts from their connections and network.' },
  { id: 'jobs', name: 'Jobs & Opportunities', icon: '💼', category: 'actions',
    systemHint: 'ACTION: Summarize current job opportunities, internships, and open positions available on the platform.' },
  { id: 'resources', name: 'Resources & Map', icon: '🌍', category: 'actions',
    systemHint: 'ACTION: Guide user to resources available on the platform. Provide direct links to the 3D resource map.' },
];

const CATEGORY_LABELS: Record<string, string> = {
  'quick': '⚡ Quick',
  'document': '📄 Documents',
  'ai-tools': '🧠 AI Tools',
  'actions': '🚀 Actions',
};

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
  const [activeTool, setActiveTool] = useState<ToolItem | null>(null);
  const [showToolMenu, setShowToolMenu] = useState(false);
  const { data: resources } = useResources();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const toolMenuRef = useRef<HTMLDivElement>(null);

  // Close tool menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolMenuRef.current && !toolMenuRef.current.contains(e.target as Node)) {
        setShowToolMenu(false);
      }
    };
    if (showToolMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showToolMenu]);

  // Listen for document-ready events from Genius AI
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setDocReadyBadge(true);
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

  const getSystemOverride = () => {
    const toolId = activeTool?.id;

    if (toolId === 'quick') {
      return `You are **Genius AI** in QUICK mode. RULES:
1. Give the SHORTEST possible answer. Yes, No, or a few words.
2. MAXIMUM 240 characters total in your response. NEVER exceed this.
3. If the user's intent is a yes/no question, answer ONLY "Yes" or "No" — nothing else.
4. If it needs a short explanation, keep it under 240 characters.
5. No markdown, no formatting, no bullet points. Just plain text.
6. Be direct and decisive. No hedging, no "it depends" unless truly necessary.`;
    }

    // Document presets
    const docTool = ALL_TOOLS.find(t => t.id === toolId && t.category === 'document');
    if (docTool) {
      return `You are **Genius AI**, a document writing assistant.

RULES:
1. If the request is vague, ask 2-3 SHORT multiple choice questions. Use format: "A) Option B) Option C) Option". NEVER ask free-text questions.
2. Ask ALL clarifying questions in ONE step, not spread across multiple messages.
3. Do NOT write any document until user says "go", "yes", "write it", "proceed" or selects options.
4. When confirmed, write the FULL document — extensive, thorough, 2000+ words minimum.
5. Use Markdown with headings, bold, tables, lists.
6. STRICT COMPLIANCE: Follow user instructions EXACTLY. If they say "1 paragraph" write EXACTLY 1 paragraph. If they say "200 words" write EXACTLY 200 words.
7. Do NOT include [IMAGE: description] tags or any image placeholders unless the user explicitly asks for images.

CONTEXT: ${docTool.systemHint}`;
    }

    // AI Tools
    if (toolId === 'analytics') {
      return `You are **Genius AI** with full access to the user's analytics dashboard.
You can explain their profile views, connections, followers, following, posts, comments, likes, engagement score, and historical trends.
When the user asks about their analytics, provide detailed insights, trends, and actionable recommendations.
Use markdown formatting. Be data-driven and specific.`;
    }

    if (toolId === 'intelligence') {
      return `You are **Genius AI** with access to market intelligence.
Provide market analysis, trending companies, industry insights, competitive analysis, and startup ecosystem data.
Be specific, cite trends, and provide actionable insights. Use markdown formatting.`;
    }

    // Actions
    if (toolId === 'create-post') {
      return `You are **Genius AI** helping the user create a social post for the platform feed.
Ask what they want to post about using simple multiple choice: "A) Option B) Option".
Ask ALL questions in ONE step. Then generate the post content.
Keep posts engaging, professional, and suitable for a startup community.
Use markdown formatting.`;
    }

    if (toolId === 'create-meeting') {
      return `You are **Genius AI** helping the user book a meeting.
Ask for meeting details using simple multiple choice where possible:
- Who to meet with
- When (suggest time slots)
- Meeting type: A) Video Call B) In-Person C) Phone
- Topic/agenda
Ask ALL questions in ONE step. Then confirm the booking details.`;
    }

    if (toolId === 'contacts') {
      return `You are **Genius AI** helping the user manage their contacts and connections.
You can help find contacts, suggest connections, and provide networking advice.
Ask what they need using simple multiple choice options.`;
    }

    if (toolId === 'jobs') {
      return `You are **Genius AI** helping the user explore jobs and opportunities on the platform.
Summarize available positions, internships, and opportunities.
Help the user filter by role, industry, or skills. Use markdown formatting.`;
    }

    if (toolId === 'resources') {
      // Build resource context with direct links
      const resourceContext = resources?.map(r => 
        `- **${r.title}** (${r.resource_type.replace(/_/g, ' ')})${r.city ? ` — ${r.city}${r.country ? ', ' + r.country : ''}` : ''} → [Open on Map](/resources?id=${r.id})${r.website_url ? ` | [Website](${r.website_url})` : ''}`
      ).join('\n') || 'No resources loaded yet.';

      return `You are **Genius AI** giving QUICK, DIRECT answers about platform resources.

RULES:
1. Give SHORT answers — no long explanations. Be concise like Quick mode.
2. ALWAYS include a direct clickable link to the resource on the 3D map: [Resource Name](/resources?id=RESOURCE_ID)
3. If user asks about a category (e.g. "coworking in Miami"), list matching resources with links.
4. If only one match, give one line + link. If multiple, bullet list with links.
5. If no match found, say so briefly and suggest the full map: [Browse All Resources](/resources)
6. Use markdown for links. Keep responses under 300 characters when possible.

AVAILABLE RESOURCES:
${resourceContext}

Resource categories: Office, Lab, Venue, Perk, Chamber of Commerce, Technology Transfer, Community, Government Grant, Accelerator/Incubator, Entrepreneur Center, University, Coworking, Investor Network, Human Capital, Event, Banking, National Archives.`;
    }

    // Default Genius mode
    return `You are **Genius AI**, a helpful assistant on the Imagine Startup Factory platform.

RULES:
1. If the request is vague, ask 2-3 SHORT multiple choice questions. Format: "A) Option B) Option C) Option". NEVER ask free-text questions.
2. Ask ALL clarifying questions in ONE step.
3. STRICT COMPLIANCE: Follow user instructions EXACTLY for word counts, paragraph counts, etc.
4. Do NOT include images unless explicitly asked.
5. Be concise, friendly, and actionable. Use markdown formatting.

You can help with:
- 📄 Document creation (research papers, business plans, pitch decks, etc.)
- 📈 Analytics & insights about the user's profile and engagement
- 📢 Creating social posts for the feed
- 📅 Booking meetings and managing calendar
- 👥 Finding contacts and connections
- 💼 Exploring jobs and opportunities
- 🌍 Navigating platform resources and the 3D map
- 🧠 Market intelligence and startup insights`;
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
      const allMsgs = [...aiMessages, { role: 'user' as const, content: userMessage }];
      const messagesPayload = allMsgs.map(m => ({ role: m.role, content: m.content }));

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

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";

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

  // Parse options from AI response for clickable buttons
  const parseOptions = (text: string): { label: string; value: string }[] | null => {
    const lines = text.split('\n');
    const options: { label: string; value: string }[] = [];
    for (const line of lines) {
      const match = line.match(/^([A-D])\)\s*(.+)/);
      if (match) {
        options.push({ label: match[2].trim(), value: `${match[1]}) ${match[2].trim()}` });
      }
    }
    return options.length >= 2 ? options : null;
  };

  const lastAssistantMsg = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1] : null;
  const lastMsgOptions = lastAssistantMsg?.role === 'assistant' ? parseOptions(lastAssistantMsg.content) : null;
  const hideInput = lastMsgOptions && !isAiLoading;

  // Group tools by category
  const groupedTools = ALL_TOOLS.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, ToolItem[]>);

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
                  {activeTool && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {activeTool.icon} {activeTool.name}
                    </Badge>
                  )}
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
                  {/* Active tool indicator */}
                  {activeTool && activeTool.id !== 'quick' && (
                    <div className="px-3 pt-1 pb-1 shrink-0">
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-primary/10 text-xs">
                        <span className="font-medium">{activeTool.icon} {activeTool.name}</span>
                        <button
                          onClick={() => setActiveTool(null)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Quick mode indicator */}
                  {activeTool?.id === 'quick' && (
                    <div className="px-3 pt-1 pb-1 shrink-0">
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-500/10 text-[10px]">
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Zap className="h-3 w-3" />
                          Quick mode — Yes/No or short answers (max 240 chars)
                        </span>
                        <button
                          onClick={() => setActiveTool(null)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <ScrollArea className="flex-1 p-3">
                    {aiMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                        <div className="relative inline-block mb-4">
                          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                          <img src={geniusAILogo} alt="Genius AI" className="relative h-14 w-14 rounded-full object-cover opacity-70" />
                        </div>
                        <p className="text-base font-semibold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                          How can I help you today?
                        </p>
                        <p className="text-xs text-muted-foreground/70 mb-3">
                          Tap <Plus className="inline h-3 w-3" /> to select a tool or just ask anything!
                        </p>
                        {/* Quick tool chips */}
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {[
                            { id: 'quick', icon: '⚡', label: 'Quick' },
                            { id: 'business-plan', icon: '💼', label: 'Business Plan' },
                            { id: 'analytics', icon: '📈', label: 'Analytics' },
                            { id: 'create-post', icon: '📢', label: 'Post' },
                            { id: 'jobs', icon: '💼', label: 'Jobs' },
                          ].map(chip => (
                            <button
                              key={chip.id}
                              onClick={() => {
                                const tool = ALL_TOOLS.find(t => t.id === chip.id);
                                if (tool) setActiveTool(tool);
                              }}
                              className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted/50 hover:bg-muted text-foreground transition-colors"
                            >
                              {chip.icon} {chip.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {aiMessages.map((message, index) => {
                        const isLast = index === aiMessages.length - 1;
                        const msgOptions = message.role === 'assistant' && isLast ? parseOptions(message.content) : null;

                        return (
                          <div key={index}>
                            <div
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-1`}
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

                            {/* Clickable option buttons */}
                            {msgOptions && !isAiLoading && (
                              <div className="flex flex-wrap gap-1.5 mt-2 ml-2">
                                {msgOptions.map((opt, oi) => (
                                  <button
                                    key={oi}
                                    onClick={() => {
                                      setAiInput(opt.value);
                                      setTimeout(() => {
                                        const form = document.getElementById('genius-ai-form');
                                        if (form) form.dispatchEvent(new Event('submit', { bubbles: true }));
                                      }, 50);
                                    }}
                                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 hover:bg-primary/20 text-foreground border border-primary/20 hover:border-primary/40 transition-all duration-200 cursor-pointer hover:scale-105"
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
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
                  
                  <div className="border-t border-border/50 p-3 shrink-0 bg-gradient-to-t from-primary/5 to-transparent">
                    {/* Show select hint when options available */}
                    {hideInput ? (
                      <p className="text-center text-xs text-muted-foreground py-2">
                        👆 Select an option above to continue
                      </p>
                    ) : (
                      <form
                        id="genius-ai-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendAiMessage();
                        }}
                        className="flex items-center gap-1.5"
                      >
                        {/* + Tool Menu Button */}
                        <div className="relative" ref={toolMenuRef}>
                          <button
                            type="button"
                            onClick={() => setShowToolMenu(!showToolMenu)}
                            className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                              showToolMenu
                                ? 'bg-primary text-primary-foreground rotate-45'
                                : 'bg-muted/50 hover:bg-muted text-foreground'
                            }`}
                          >
                            <Plus className="h-5 w-5" />
                          </button>

                          {/* Tool Dropdown Menu */}
                          {showToolMenu && (
                            <div className="absolute bottom-12 left-0 w-56 rounded-xl bg-popover border border-border shadow-xl max-h-[320px] overflow-auto z-50 animate-in slide-in-from-bottom-2 duration-200">
                              {Object.entries(groupedTools).map(([category, tools]) => (
                                <div key={category}>
                                  <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-popover/95 backdrop-blur-sm border-b border-border/50">
                                    {CATEGORY_LABELS[category] || category}
                                  </div>
                                  {tools.map(tool => (
                                    <button
                                      key={tool.id}
                                      type="button"
                                      onClick={() => {
                                        setActiveTool(tool);
                                        setShowToolMenu(false);
                                      }}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors cursor-pointer ${
                                        activeTool?.id === tool.id ? 'bg-accent' : ''
                                      }`}
                                    >
                                      <span className="text-sm">{tool.icon}</span>
                                      <span>{tool.name}</span>
                                    </button>
                                  ))}
                                </div>
                              ))}
                              {/* Clear selection */}
                              {activeTool && (
                                <button
                                  type="button"
                                  onClick={() => { setActiveTool(null); setShowToolMenu(false); }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors border-t border-border/50"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Clear selection</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <Input
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          placeholder={
                            activeTool?.id === 'quick'
                              ? '⚡ Ask a quick question...'
                              : activeTool
                              ? `✨ ${activeTool.name}...`
                              : '✨ Ask Genius AI...'
                          }
                          disabled={isAiLoading}
                          className="text-sm rounded-full border-2 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-background/50 backdrop-blur-sm px-4"
                        />
                        <Button 
                          type="submit" 
                          size="icon" 
                          disabled={isAiLoading || !aiInput.trim()} 
                          className={`shrink-0 rounded-full h-10 w-10 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:scale-100 ${
                            activeTool?.id === 'quick' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-primary to-primary/80'
                          }`}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    )}
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