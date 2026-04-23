import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, X, Minus, Search, Loader2, Plus, Zap, FileText, BarChart3, CalendarPlus, Users, Briefcase, Globe, PenSquare, Brain, Clock, Trash2, BookOpen, FlaskConical, Target, BookText, Pen, Clapperboard, Scale, FileEdit, ClipboardList, Mail, Sparkles, TrendingUp, Megaphone, Smile, ScanText, Upload, type LucideIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUserRole } from '@/hooks/useUserRole';
import { useResources } from '@/hooks/useResources';
import ReactMarkdown from 'react-markdown';
import geniusAILogo from '@/assets/genius-ai-logo.png';
import { useGeniusMemory, useSaveMemory, useDeleteMemory, useGeniusChatLogs, useSaveChatLog, useDeleteChatLog, isLearnIntent, extractMemoryFromContext } from '@/hooks/useGeniusMemory';
import type { ChatLog } from '@/hooks/useGeniusMemory';

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
  icon: LucideIcon;
  category: 'quick' | 'document' | 'ai-tools' | 'actions';
  systemHint: string;
}

const ALL_TOOLS: ToolItem[] = [
  { id: 'quick', name: 'Quick Answer', icon: Zap, category: 'quick',
    systemHint: 'QUICK' },

  { id: 'research', name: 'Research Paper', icon: FlaskConical, category: 'document',
    systemHint: 'Write a formal academic research paper with APA style, citations, and deep analysis.' },
  { id: 'executive-summary', name: 'Executive Summary', icon: BarChart3, category: 'document',
    systemHint: 'Write a concise, high-impact executive summary with key findings, metrics, and recommendations.' },
  { id: 'pitch', name: 'Pitch Deck Script', icon: Target, category: 'document',
    systemHint: 'Write a compelling startup pitch narrative, investor-ready with data points and market statistics.' },
  { id: 'business-plan', name: 'Business Plan', icon: Briefcase, category: 'document',
    systemHint: 'Write a comprehensive, investor-ready business plan with market analysis and financial projections.' },
  { id: 'book', name: 'Book / Chapter', icon: BookText, category: 'document',
    systemHint: 'Write a book chapter with engaging narrative, proper structure, and 3000-5000 words per chapter.' },
  { id: 'novel', name: 'Novel / Fiction', icon: Pen, category: 'document',
    systemHint: 'Write creative fiction with rich characters, vivid scenes, natural dialogue, and compelling plot.' },
  { id: 'movie-script', name: 'Movie Script', icon: Clapperboard, category: 'document',
    systemHint: 'Write in proper screenplay format with scene headings, action lines, and industry-standard formatting.' },
  { id: 'legal', name: 'Legal Document', icon: Scale, category: 'document',
    systemHint: 'Write formal legal documents with proper terminology, numbered clauses, and standard provisions.' },
  { id: 'blog', name: 'Blog / Article', icon: FileEdit, category: 'document',
    systemHint: 'Write an engaging blog post with compelling headline, SEO-friendly structure, and call-to-action.' },
  { id: 'report', name: 'Technical Report', icon: ClipboardList, category: 'document',
    systemHint: 'Write a detailed technical report with data tables, findings, and actionable recommendations.' },
  { id: 'letter', name: 'Formal Letter', icon: Mail, category: 'document',
    systemHint: 'Write a formal letter with proper letterhead, salutation, body paragraphs, and signature block.' },
  { id: 'free', name: 'Free Writing', icon: Sparkles, category: 'document',
    systemHint: 'Write freely based on the user request. Adapt tone, style, and format to match needs.' },

  { id: 'analytics', name: 'My Analytics', icon: TrendingUp, category: 'ai-tools',
    systemHint: 'ANALYTICS: You have access to the user analytics data. Explain metrics, trends, and provide insights.' },
  { id: 'intelligence', name: 'Market Intelligence', icon: Brain, category: 'ai-tools',
    systemHint: 'INTELLIGENCE: Provide market analysis, trending companies, industry insights, and competitive analysis.' },
  { id: 'summarize', name: 'Smart Summary', icon: ScanText, category: 'ai-tools',
    systemHint: 'SUMMARIZE: Produce a concise smart summary of the text the user provides.' },
  { id: 'sentiment', name: 'Sentiment Analysis', icon: Smile, category: 'ai-tools',
    systemHint: 'SENTIMENT: Analyze sentiment, emotion, urgency, and tone of the text the user provides.' },
  { id: 'analyze-document', name: 'Document Analysis', icon: FileText, category: 'ai-tools',
    systemHint: 'DOCUMENT: Extract text, tables, and key information from a document image the user uploads.' },

  { id: 'create-post', name: 'Create Post', icon: Megaphone, category: 'actions',
    systemHint: 'ACTION: Help user draft a social feed post. Ask what they want to post about, then generate the content.' },
  { id: 'create-meeting', name: 'Book Meeting', icon: CalendarPlus, category: 'actions',
    systemHint: 'ACTION: Help user create a meeting link or book a meeting. Ask for details: who, when, topic.' },
  { id: 'contacts', name: 'My Contacts', icon: Users, category: 'actions',
    systemHint: 'ACTION: Help user find or manage contacts from their connections and network.' },
  { id: 'jobs', name: 'Jobs & Opportunities', icon: Briefcase, category: 'actions',
    systemHint: 'ACTION: Summarize current job opportunities, internships, and open positions available on the platform.' },
  { id: 'resources', name: 'Resources & Map', icon: Globe, category: 'actions',
    systemHint: 'ACTION: Guide user to resources available on the platform. Provide direct links to the 3D resource map.' },
];

const CATEGORY_META: Record<string, { label: string; icon: LucideIcon }> = {
  'quick': { label: 'Quick', icon: Zap },
  'document': { label: 'Documents', icon: FileText },
  'ai-tools': { label: 'AI Tools', icon: Brain },
  'actions': { label: 'Actions', icon: Globe },
};

export default function FloatingChat() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();
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
  const [currentChatLogId, setCurrentChatLogId] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const { data: resources } = useResources();
  
  // Memory & chat log hooks
  const { data: memoryItems = [] } = useGeniusMemory();
  const saveMemory = useSaveMemory();
  const deleteMemory = useDeleteMemory();
  const { data: chatLogs = [] } = useGeniusChatLogs();
  const saveChatLog = useSaveChatLog();
  const deleteChatLog = useDeleteChatLog();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const toolMenuRef = useRef<HTMLDivElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);

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

    if (toolId === 'summarize') {
      return `You are **Genius AI** in SMART SUMMARY mode.
Produce a clear, concise summary of whatever the user provides (an article, notes, transcript, document, etc.).

OUTPUT FORMAT (always Markdown):
**TL;DR:** one sentence (max 30 words).
**Summary:** 2–4 sentences capturing the core ideas.
**Key Points:**
- 3–6 bullet points with the most important takeaways
**Action Items / Next Steps:** (only if relevant) 1–3 bullets

RULES:
1. If the user has not yet pasted text, ask them once: "Paste the text or notes you want me to summarize." — nothing else.
2. Do NOT add filler. No "here is your summary…" preface — start directly with the **TL;DR:** line.
3. Faithfully reflect the source — never invent facts.
4. Keep total response under 350 words unless the user explicitly asks for a long-form summary.`;
    }

    if (toolId === 'sentiment') {
      return `You are **Genius AI** in SENTIMENT ANALYSIS mode.
Analyze the emotional tone, sentiment, urgency, and intent of the text the user provides.

OUTPUT FORMAT (always Markdown, in this exact order):
**Sentiment:** Positive / Negative / Neutral / Mixed   (with a 1-line justification)
**Score:** number from -1.0 (very negative) to +1.0 (very positive)
**Emotions Detected:** comma-separated list (e.g. excited, frustrated, hopeful)
**Urgency:** Low / Medium / High
**Topic / Category:** short label
**Insight:** 1–2 sentence interpretation — what the writer is really feeling or asking for
**Recommended Response Tone:** how to reply (e.g. empathetic + reassuring, factual + brief)

RULES:
1. If the user has not pasted text yet, ask once: "Paste the message or text you want analyzed."
2. Be objective — no moralizing.
3. Keep the whole response under 200 words.`;
    }

    if (toolId === 'analyze-document') {
      return `You are **Genius AI** in DOCUMENT ANALYSIS mode.
Tell the user to upload a document image (PDF page screenshot, photo, scan, slide, invoice, contract, pitch deck slide, etc.) using the 📎 attach button next to the input.
After they upload, you will receive an extraction result — then explain it clearly.

OUTPUT FORMAT (after a document is uploaded):
**Document Type:** (invoice / contract / slide / report / form / etc.)
**Extracted Text & Data:** structured Markdown — preserve tables with Markdown table syntax
**Key Information:**
- Important entities, numbers, dates, names, totals
**Summary:** 2–3 sentences explaining what the document is and its main purpose
**Suggested Actions:** 1–3 helpful next steps the user might take

RULES:
1. If no document has been attached yet, instruct the user to tap the 📎 paperclip below to upload one. Nothing else.
2. Never invent content that isn't in the extracted text.
3. Use Markdown tables for any tabular data.`;
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
      return `You are **Genius AI** that AUTOMATICALLY opens the Jobs tab for the user.

CRITICAL RULES:
1. Your FIRST line MUST be a NAV command in this EXACT format: <!--NAV:/jobs?search=SEARCH_TERM-->
   - "search" = the job title, role, skill, industry, or keyword the user asked about (e.g. "frontend developer", "internship marketing", "remote design")
   - Extract the MOST relevant search keywords from the user's request.
2. After the NAV command, write a SHORT 1-2 sentence summary: "💼 Opening job opportunities for [search term]..."
3. Keep total response under 200 characters (excluding the NAV tag).
4. If the user asks follow-up questions about different jobs, ALWAYS include a new NAV command with the updated search.
5. NEVER show raw links. The jobs tab opens AUTOMATICALLY.`;
    }

    if (toolId === 'resources') {
      // Build resource context with direct links
      const resourceContext = resources?.map(r => 
        `- **${r.title}** (${r.resource_type.replace(/_/g, ' ')})${r.city ? ` — ${r.city}${r.country ? ', ' + r.country : ''}` : ''} | ID: ${r.id}${r.website_url ? ` | Website: ${r.website_url}` : ''}`
      ).join('\n') || 'No resources loaded yet.';

      return `You are **Genius AI** that controls a 4D interactive globe with CCTV cameras, traffic sensors, transit vehicles, maritime vessels, buildings, and resources worldwide.

## NAV COMMAND FORMATS (FIRST LINE MUST BE ONE OF THESE):

### 1. Navigate to a RESOURCE (office, lab, coworking, etc.):
<!--NAV:/resources?search=SEARCH_TERM&id=BEST_MATCH_RESOURCE_ID-->

### 2. Navigate to a LOCATION (street, building, city, landmark, address):
<!--NAV:/map?place=PLACE_NAME&lat=LATITUDE&lng=LONGITUDE&zoom=ZOOM_LEVEL-->
- For streets/buildings use zoom 17-19
- For neighborhoods use zoom 14-16
- For cities use zoom 11-13
- You MUST provide approximate lat/lng coordinates for the place. Use your world knowledge of geography.
- Examples:
  - Times Square NYC: <!--NAV:/map?place=Times Square&lat=40.758&lng=-73.9855&zoom=17-->
  - Eiffel Tower: <!--NAV:/map?place=Eiffel Tower&lat=48.8584&lng=2.2945&zoom=18-->
  - Wall Street: <!--NAV:/map?place=Wall Street&lat=40.7074&lng=-74.0113&zoom=17-->

### 3. Navigate to a CCTV CAMERA area (show cameras in an area):
<!--NAV:/map?place=AREA_NAME&lat=LATITUDE&lng=LONGITUDE&zoom=13&layer=cctv-->
- This enables the CCTV layer and flies to the area so cameras load automatically.
- Use zoom 12-14 to show cameras in a region.

### 4. Navigate to TRAFFIC data:
<!--NAV:/map?place=AREA_NAME&lat=LATITUDE&lng=LONGITUDE&zoom=12&layer=sensors-->

### 5. Navigate to TRANSIT vehicles:
<!--NAV:/map?place=CITY_NAME&lat=LATITUDE&lng=LONGITUDE&zoom=12&layer=transit-->

## RULES:
1. FIRST line MUST be a NAV command. Always.
2. After the NAV command, write a SHORT 1-2 sentence summary.
3. NEVER show raw links. The map navigates AUTOMATICALLY.
4. Keep response under 200 chars (excluding NAV tag).
5. If the user asks for a CCTV camera, use layer=cctv.
6. If the user asks to "take me to", "show me", "go to" ANY place on Earth — use the /map NAV with coordinates.
7. You know world geography. Provide accurate lat/lng for any city, street, landmark, or building.

AVAILABLE RESOURCES:
${resourceContext}

Resource categories: Office, Lab, Venue, Perk, Chamber of Commerce, Technology Transfer, Community, Government Grant, Accelerator/Incubator, Entrepreneur Center, University, Coworking, Investor Network, Human Capital, Event, Banking, National Archives.

4D MAP LAYERS: CCTV Cameras (worldwide), Traffic Sensors (PeMS, NYC, Seattle), Transit Vehicles (10 cities GTFS-RT), AIS Maritime Vessels, Earth Intelligence (weather, SST, vegetation), Road Sensors.`;
    }

    // Build memory context string
    const memoryContext = memoryItems.length > 0
      ? `\n\nUSER'S SAVED KNOWLEDGE (use this context when relevant):\n${memoryItems.slice(0, 20).map(m => `- [${m.category}] ${m.title}: ${m.content.slice(0, 200)}`).join('\n')}`
      : '';

    // Default Genius mode
    return `You are **Genius AI**, a helpful assistant on the Imagine Startup Factory platform.

RULES:
1. If the request is vague, ask 2-3 SHORT multiple choice questions. Format: "A) Option B) Option C) Option". NEVER ask free-text questions.
2. Ask ALL clarifying questions in ONE step.
3. STRICT COMPLIANCE: Follow user instructions EXACTLY for word counts, paragraph counts, etc.
4. Do NOT include images unless explicitly asked.
5. Be concise, friendly, and actionable. Use markdown formatting.
6. If user says "learn this", "remember this", "save this" — confirm what you saved to their knowledge memory.

You can help with:
- 📄 Document creation (research papers, business plans, pitch decks, etc.)
- 📈 Analytics & insights about the user's profile and engagement
- 📢 Creating social posts for the feed
- 📅 Booking meetings and managing calendar
- 👥 Finding contacts and connections
- 💼 Exploring jobs and opportunities
- 🌍 Navigating the 4D map — fly to ANY street, building, landmark, or CCTV camera worldwide
- 📹 CCTV cameras, traffic sensors, transit vehicles, maritime vessels on the live map
- 🧠 Market intelligence and startup insights
- 💾 Memory — say "learn this" to save knowledge for future reference${memoryContext}`;
  };

  /** Upload a document image and analyze it with the AI vision analyzer */
  const handleDocumentUpload = async (file: File) => {
    if (!user) {
      toast({ title: 'Sign In Required', description: 'Please sign in to analyze documents.' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Image required',
        description: 'Document Analysis works on images (PNG, JPG, screenshots). For PDFs, take a screenshot of the page first.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 15MB.', variant: 'destructive' });
      return;
    }

    setIsAnalyzingDoc(true);
    setAiMessages(prev => [
      ...prev,
      { role: 'user', content: `📎 Uploaded **${file.name}** for analysis…` },
    ]);

    try {
      // Upload to public feed-media bucket so the vision model can fetch it
      const ext = file.name.split('.').pop() || 'png';
      const path = `genius-docs/${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('feed-media')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('feed-media').getPublicUrl(path);

      // Call vision analyzer
      const { data, error } = await supabase.functions.invoke('ai-vision-analyzer', {
        body: { imageUrl: publicUrl, analysisType: 'document' },
      });
      if (error) throw error;
      const extracted = (data as any)?.analysis || 'No content could be extracted.';

      // Show extraction in chat, then ask Genius AI to format/explain it
      const followup = `Here is the raw extraction from the document the user uploaded. Format it according to your DOCUMENT ANALYSIS output rules and add Key Information, Summary and Suggested Actions.\n\n---\n${extracted}`;
      await sendAiMessage(followup);
    } catch (err: any) {
      console.error('Document analysis error:', err);
      toast({
        title: 'Analysis failed',
        description: err?.message || 'Could not analyze the document.',
        variant: 'destructive',
      });
      setAiMessages(prev => [
        ...prev,
        { role: 'assistant', content: '❌ Sorry, I could not analyze that document. Please try a different image.' },
      ]);
    } finally {
      setIsAnalyzingDoc(false);
      if (docFileInputRef.current) docFileInputRef.current.value = '';
    }
  };

  /** Streaming AI call using lightpaper-genius edge function */
  const sendAiMessage = async (overrideInput?: string) => {
    const inputToUse = overrideInput ?? aiInput;
    if (!inputToUse.trim() || isAiLoading) return;
    
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to use Genius AI",
      });
      return;
    }

    const userMessage = inputToUse.trim();
    setAiInput('');
    
    // Handle "learn this" intent
    if (isLearnIntent(userMessage)) {
      const memory = extractMemoryFromContext(aiMessages);
      if (memory) {
        saveMemory.mutate({ title: memory.title, content: memory.content, category: activeTool?.id || 'general', source: 'conversation' });
        setAiMessages(prev => [...prev, 
          { role: 'user', content: userMessage },
          { role: 'assistant', content: `🧠 **Saved to memory!**\n\n"${memory.title}"\n\nI'll remember this for future conversations. You can view all saved knowledge in the + menu → 📚 Memory.` }
        ]);
        setIsAiLoading(false);
        return;
      } else {
        setAiMessages(prev => [...prev, 
          { role: 'user', content: userMessage },
          { role: 'assistant', content: `🧠 Nothing to save yet — ask me something first, then say "learn this" to save my response to your memory.` }
        ]);
        setIsAiLoading(false);
        return;
      }
    }

    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiLoading(true);

    // Auto-switch to resources tool if user asks about finding offices, coworking, map, cameras, streets, buildings, etc.
    const resourceIntentPattern = /\b(find|search|look for|where|show me|take me|go to|fly to|navigate|office|coworking|lab|workspace|hub|resource|map|venue|accelerator|incubator|camera|cctv|street|building|landmark|tower|bridge|monument|stadium|airport)\b.*\b(in|at|near|around|nyc|new york|miami|london|tokyo|paris|berlin|sf|san francisco|la|los angeles|chicago|boston|dubai|singapore|city|country|location)\b|\b(in|at|near|around|nyc|new york|miami|london|tokyo|paris|berlin|sf|san francisco|la|los angeles|chicago|boston|dubai|singapore)\b.*\b(office|coworking|lab|workspace|hub|resource|venue|accelerator|incubator|camera|cctv|street|building)\b|\b(find me|show me|take me to|go to|fly to|navigate to|search for|look for|get me)\b.*\b(office|coworking|lab|workspace|hub|resource|venue|accelerator|incubator|camera|cctv|street|building|place|city|area|location|landmark|tower|bridge)\b|\b(show|find|take me to|go to)\b.*\b(cctv|camera|cameras|traffic|sensors|transit)\b/i;
    if (!activeTool && resourceIntentPattern.test(userMessage)) {
      const resTool = ALL_TOOLS.find(t => t.id === 'resources');
      if (resTool) setActiveTool(resTool);
    }

    // Auto-switch to jobs tool if user asks about jobs, internships, hiring, etc.
    const jobIntentPattern = /\b(find|search|look for|show me|looking for|get me|any|hiring)\b.*\b(job|jobs|position|positions|internship|internships|opportunity|opportunities|role|roles|career|careers|work|employment|gig|opening|openings)\b|\b(job|jobs|internship|internships|opportunity|opportunities|hiring|career|careers)\b.*\b(find|search|available|open|remote|full.time|part.time|contract)\b/i;
    if (!activeTool && jobIntentPattern.test(userMessage)) {
      const jobTool = ALL_TOOLS.find(t => t.id === 'jobs');
      if (jobTool) setActiveTool(jobTool);
    }

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

      // Auto-navigate if response contains NAV command
      if (fullText) {
        const navMatch = fullText.match(/<!--NAV:(\/[^>]+)-->/);
        if (navMatch) {
          const navPath = navMatch[1];
          // Remove NAV tag from displayed message
          const cleanText = fullText.replace(/<!--NAV:[^>]+-->\n?/, '');
          setAiMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: cleanText };
            return updated;
          });

          // Extract search and id params from the NAV path
          try {
            const url = new URL(navPath, window.location.origin);
            const navSearch = url.searchParams.get('search') || '';
            const navResourceId = url.searchParams.get('id') || '';
            const isJobNav = navPath.startsWith('/jobs');
            const isMapNav = navPath.startsWith('/map');

            if (isJobNav) {
              // Navigate to dashboard jobs tab
              setTimeout(() => {
                navigate('/dashboard?tab=jobs');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('genius-job-navigate', {
                    detail: { search: navSearch }
                  }));
                }, 600);
              }, 800);
            } else if (isMapNav) {
              // Navigate to map with coordinates - for cameras, streets, buildings
              const lat = parseFloat(url.searchParams.get('lat') || '0');
              const lng = parseFloat(url.searchParams.get('lng') || '0');
              const zoom = parseFloat(url.searchParams.get('zoom') || '14');
              const place = url.searchParams.get('place') || '';
              const layer = url.searchParams.get('layer') || '';

              setTimeout(() => {
                navigate('/dashboard?tab=resources');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('genius-map-navigate', {
                    detail: { lat, lng, zoom, place, layer }
                  }));
                }, 600);
              }, 800);
            } else {
              // Navigate to dashboard resources tab
              setTimeout(() => {
                navigate('/dashboard?tab=resources');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('genius-resource-navigate', {
                    detail: { search: navSearch, resourceId: navResourceId }
                  }));
                }, 600);
              }, 800);
            }
          } catch {
            // Fallback
            setTimeout(() => {
              navigate('/dashboard?tab=resources');
            }, 800);
          }

          fullText = cleanText;
        }

        // Auto-save chat log after each AI response
        const allMsgsWithResponse = [...allMsgs, { role: 'assistant' as const, content: fullText }];
        const chatTitle = userMessage.slice(0, 60) || 'Chat';
        saveChatLog.mutate({ title: chatTitle, messages: allMsgsWithResponse, tool_used: activeTool?.id || 'general' });

        // If this was a document-category tool, open the result in LightPaper as a new editable file
        const isDocTool = activeTool && ALL_TOOLS.find(t => t.id === activeTool.id && t.category === 'document');
        if (isDocTool && fullText.length > 200) {
          // Convert markdown to simple HTML for the editor
          const docTitle = activeTool.name + ' — ' + userMessage.slice(0, 40);
          const markdownToHtml = (md: string) => {
            return md
              .replace(/^### (.+)$/gm, '<h3>$1</h3>')
              .replace(/^## (.+)$/gm, '<h2>$1</h2>')
              .replace(/^# (.+)$/gm, '<h1>$1</h1>')
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
              .replace(/^\- (.+)$/gm, '<li>$1</li>')
              .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
              .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
              .replace(/\n{2,}/g, '</p><p style="font-size: 12pt; line-height: 1.6;">')
              .replace(/\n/g, '<br/>')
              .replace(/^/, '<p style="font-size: 12pt; line-height: 1.6;">')
              .replace(/$/, '</p>');
          };
          const htmlContent = markdownToHtml(fullText);

          // Dispatch event for LightPaper to pick up
          window.dispatchEvent(new CustomEvent('genius-open-in-lightpaper', {
            detail: { content: htmlContent, title: docTitle }
          }));

          // Navigate to LightPaper
          setTimeout(() => navigate('/lightpaper'), 300);

          // Notify user in chat
          setAiMessages(prev => [...prev, {
            role: 'assistant',
            content: `📄 **Document opened in LightPaper!** You can now fully edit "${docTitle}" in the workspace.`
          }]);
        }
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
      {/* GENIUS AI Launcher — Futuristic animated orb with clear identity */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2 group">
          {/* Floating tagline (visible on hover & always on mobile) */}
          <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 translate-y-1 sm:group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
            <div className="px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-xl border border-primary/30 shadow-lg shadow-primary/20 text-[10px] font-mono uppercase tracking-[0.18em] flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent font-bold">GENIUS AI</span>
              <span className="text-muted-foreground hidden sm:inline">· Ask · Write · Analyze</span>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            data-tour="floating-chat"
            aria-label="Open Genius AI"
            className="relative h-16 w-16 sm:h-[68px] sm:w-[68px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-full"
          >
            {/* Outer pulsing aura */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/40 via-violet-500/40 to-cyan-400/40 blur-xl animate-pulse" />
            {/* Outer rotating ring */}
            <span className="absolute -inset-1 rounded-full border border-violet-400/30 animate-[spin_8s_linear_infinite]" />
            {/* Counter-rotating dashed ring */}
            <span
              className="absolute -inset-2 rounded-full border border-dashed border-cyan-400/30 animate-[spin_14s_linear_infinite]"
              style={{ animationDirection: 'reverse' }}
            />
            {/* Orbiting nodes */}
            <span className="absolute inset-0 animate-[spin_6s_linear_infinite]">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_hsl(190_90%_60%)]" />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_hsl(263_70%_60%)]" />
            </span>
            {/* Core orb */}
            <span className="absolute inset-1.5 rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 shadow-[0_8px_32px_-4px_hsl(263_70%_50%/0.6)] flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
              {/* Inner highlight */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent" />
              {/* Grid texture */}
              <span className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:8px_8px] [mask-image:radial-gradient(circle,black_30%,transparent_70%)]" />
              {/* Brain icon */}
              <Brain className="relative h-7 w-7 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]" strokeWidth={2.2} />
            </span>
            {/* Bottom mode label */}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-background border border-primary/40 text-[8px] font-bold tracking-[0.15em] text-primary uppercase shadow-md">
              AI
            </span>
            {/* Notification badge */}
            {(totalUnread > 0 || docReadyBadge) && (
              <Badge
                className="absolute -top-1 -right-1 h-6 min-w-[1.5rem] flex items-center justify-center p-0 px-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/40 animate-pulse text-[10px] font-bold border-2 border-background"
              >
                {totalUnread > 0 ? totalUnread : '!'}
              </Badge>
            )}
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-2 right-2 left-2 sm:left-auto sm:bottom-6 sm:right-6 sm:w-[420px] h-[640px] max-h-[calc(100vh-1rem)] backdrop-blur-2xl bg-background/90 border border-primary/30 rounded-3xl shadow-[0_20px_60px_-20px_hsl(263_70%_50%/0.5)] flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom duration-300 relative">
          {/* HUD ambient backdrop */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl animate-pulse" />
            <div className="absolute -bottom-32 -right-16 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl animate-pulse [animation-delay:1.2s]" />
            <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,hsl(var(--primary))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary))_1px,transparent_1px)] [background-size:32px_32px]" />
          </div>

          {/* Header — Futuristic HUD */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-cyan-500/5 shrink-0 backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              {activeTab === 'ai' ? (
                <>
                  <div className="relative">
                    <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 blur-md opacity-70 animate-pulse" />
                    <span className="relative h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <Brain className="h-4 w-4 text-white" />
                    </span>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <h3 className="font-bold text-sm tracking-wide bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">GENIUS AI</h3>
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" /> Online
                    </span>
                  </div>
                  {activeTool && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 gap-1 ml-1 bg-violet-500/20 text-violet-300 border border-violet-400/30">
                      <activeTool.icon className="h-3 w-3" /> {activeTool.name}
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  <span className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-md">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </span>
                  <h3 className="font-bold text-sm tracking-wide">
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
                        <span className="font-medium flex items-center gap-1.5"><activeTool.icon className="h-3.5 w-3.5" /> {activeTool.name}</span>
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
                      <div className="flex flex-col h-full px-1 py-2 animate-fade-in">
                        {/* Hero orb */}
                        <div className="flex flex-col items-center text-center mb-4">
                          <div className="relative inline-block mb-3">
                            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-500/40 blur-2xl animate-pulse" />
                            <span className="absolute -inset-2 rounded-full border border-violet-400/20 animate-[spin_8s_linear_infinite]" />
                            <span className="absolute -inset-3 rounded-full border border-dashed border-cyan-400/20 animate-[spin_14s_linear_infinite]" style={{ animationDirection: 'reverse' }} />
                            <span className="relative flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 shadow-lg shadow-violet-500/40">
                              <Brain className="h-6 w-6 text-white" />
                            </span>
                          </div>
                          <h2 className="text-base font-bold tracking-wide bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                            COMMAND DECK
                          </h2>
                          <p className="text-[10px] text-muted-foreground/80 mt-0.5 font-mono uppercase tracking-[0.18em]">
                            Pick a mission · or just ask
                          </p>
                        </div>

                        {/* Gamified tool grid */}
                        <div className="space-y-3 px-1">
                          {([
                            {
                              key: 'quick', label: 'INSTANT',
                              gradient: 'from-amber-500 to-orange-500',
                              ring: 'ring-amber-400/40',
                              tools: ALL_TOOLS.filter(t => t.category === 'quick'),
                            },
                            {
                              key: 'document', label: 'CREATE',
                              gradient: 'from-violet-500 to-fuchsia-500',
                              ring: 'ring-violet-400/40',
                              tools: ALL_TOOLS.filter(t => t.category === 'document').slice(0, 6),
                            },
                            {
                              key: 'ai-tools', label: 'ANALYZE',
                              gradient: 'from-cyan-500 to-blue-500',
                              ring: 'ring-cyan-400/40',
                              tools: ALL_TOOLS.filter(t => t.category === 'ai-tools'),
                            },
                            {
                              key: 'actions', label: 'EXECUTE',
                              gradient: 'from-emerald-500 to-teal-500',
                              ring: 'ring-emerald-400/40',
                              tools: ALL_TOOLS.filter(t => t.category === 'actions'),
                            },
                          ]).map(group => (
                            <div key={group.key}>
                              <div className="flex items-center gap-2 mb-1.5 px-1">
                                <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${group.gradient} shadow-[0_0_6px_currentColor]`} />
                                <span className="text-[9px] font-bold tracking-[0.22em] text-muted-foreground">
                                  {group.label}
                                </span>
                                <span className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {group.tools.map(tool => {
                                  const ToolIcon = tool.icon;
                                  return (
                                    <button
                                      key={tool.id}
                                      type="button"
                                      onClick={() => { setActiveTool(tool); }}
                                      className={`group relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-background/40 border border-white/10 hover:border-white/30 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:ring-1 ${group.ring} aspect-square`}
                                      title={tool.name}
                                    >
                                      {/* Hover glow */}
                                      <span className={`absolute inset-0 bg-gradient-to-br ${group.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                                      {/* Icon tile */}
                                      <span className={`relative h-8 w-8 rounded-lg bg-gradient-to-br ${group.gradient} flex items-center justify-center shadow-md`}>
                                        <ToolIcon className="h-4 w-4 text-white" strokeWidth={2.2} />
                                      </span>
                                      <span className="relative text-[9px] font-semibold text-foreground leading-tight text-center line-clamp-2 px-0.5">
                                        {tool.name}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}

                          {/* See all tools */}
                          <button
                            type="button"
                            onClick={() => setShowToolMenu(true)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 mt-1 rounded-lg bg-background/30 border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground hover:text-primary transition-all"
                          >
                            <Plus className="h-3 w-3" />
                            View all {ALL_TOOLS.length} tools
                          </button>

                          {/* Helper hint */}
                          <p className="text-center text-[10px] text-muted-foreground/60 pt-1">
                            Or type a question directly below
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {aiMessages.map((message, index) => {
                        const isLast = index === aiMessages.length - 1;
                        const msgOptions = message.role === 'assistant' && isLast ? parseOptions(message.content) : null;
                        const isUser = message.role === 'user';

                        return (
                          <div key={index} className="animate-fade-in">
                            <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
                              {/* AI avatar */}
                              {!isUser && (
                                <div className="relative shrink-0 mb-1">
                                  <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 blur-sm opacity-60" />
                                  <span className="relative h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-md ring-1 ring-violet-400/40">
                                    <Brain className="h-3.5 w-3.5 text-white" />
                                  </span>
                                </div>
                              )}

                              <div className={`relative max-w-[80%] ${isUser ? 'order-1' : ''}`}>
                                {!isUser && (
                                  <div className="flex items-center gap-1.5 mb-1 ml-1">
                                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-violet-400 font-bold">
                                      Genius
                                    </span>
                                    {activeTool && (
                                      <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">
                                        · {activeTool.name}
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div
                                  className={`relative rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 hover:shadow-xl backdrop-blur-sm ${
                                    isUser
                                      ? 'bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 text-white rounded-br-sm shadow-violet-500/30'
                                      : 'bg-gradient-to-br from-background/80 to-muted/40 border border-violet-400/20 rounded-bl-sm'
                                  }`}
                                >
                                  {!isUser && (
                                    <>
                                      <span className="absolute top-0 left-0 h-2 w-2 border-l border-t border-violet-400/50 rounded-tl-2xl" />
                                      <span className="absolute bottom-0 right-0 h-2 w-2 border-r border-b border-cyan-400/50 rounded-br-2xl" />
                                    </>
                                  )}
                                  {message.role === 'assistant' ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_code]:text-cyan-300 [&_strong]:text-violet-200">
                                      <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>
                                  ) : (
                                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed font-medium">{message.content}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {msgOptions && !isAiLoading && (
                              <div className="flex flex-wrap gap-1.5 mt-2 ml-9 animate-fade-in">
                                {msgOptions.map((opt, oi) => (
                                  <button
                                    key={oi}
                                    onClick={() => {
                                      sendAiMessage(opt.value);
                                    }}
                                    className="group relative px-3 py-1.5 rounded-full text-xs font-semibold text-foreground border border-violet-400/30 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 hover:from-violet-500/25 hover:to-cyan-500/25 hover:border-violet-400/60 transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-md hover:shadow-violet-500/20 overflow-hidden"
                                  >
                                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                    <span className="relative">{opt.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {isAiLoading && aiMessages[aiMessages.length - 1]?.role !== 'assistant' && (
                        <div className="flex items-end gap-2 justify-start mb-3 animate-fade-in">
                          <div className="relative shrink-0 mb-1">
                            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 blur-sm opacity-60 animate-pulse" />
                            <span className="relative h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 flex items-center justify-center shadow-md ring-1 ring-violet-400/40">
                              <Brain className="h-3.5 w-3.5 text-white" />
                            </span>
                          </div>
                          <div className="bg-gradient-to-br from-background/80 to-muted/40 border border-violet-400/20 rounded-2xl rounded-bl-sm px-4 py-3 shadow-lg backdrop-blur-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                              <span className="ml-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                                Thinking
                              </span>
                            </div>
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

                          {/* Tool Panel — Keyboard-style sheet, full width, slides up from bottom */}
                          {showToolMenu && (
                            <>
                              {/* Backdrop to close on outside click */}
                              <div
                                className="fixed inset-0 z-40 bg-background/20 backdrop-blur-[2px] animate-in fade-in-0 duration-150"
                                onClick={() => setShowToolMenu(false)}
                              />
                            <div
                              className="absolute left-0 right-0 bottom-full mb-2 -mx-3 rounded-t-2xl bg-popover border-t border-x border-border/60 shadow-2xl z-50 animate-in slide-in-from-bottom-4 fade-in-0 duration-200 overflow-hidden flex flex-col"
                              style={{ maxHeight: 'min(75vh, 520px)' }}
                            >
                              {/* Drag handle */}
                              <div className="flex justify-center pt-2 pb-1 shrink-0">
                                <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                              </div>
                              {/* Tab bar */}
                              <div className="flex shrink-0 border-b border-border/50">
                                {([
                                  { key: 'tools', label: 'Tools', Icon: Zap, active: !showChatHistory && !showMemoryPanel },
                                  { key: 'history', label: `History`, Icon: Clock, active: showChatHistory, count: chatLogs.length },
                                  { key: 'memory', label: `Memory`, Icon: BookOpen, active: showMemoryPanel, count: memoryItems.length },
                                ] as const).map(tab => (
                                  <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => {
                                      setShowChatHistory(tab.key === 'history');
                                      setShowMemoryPanel(tab.key === 'memory');
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-colors ${
                                      tab.active
                                        ? 'text-primary border-b-2 border-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    <tab.Icon className="h-3.5 w-3.5" />
                                    <span>{tab.label}</span>
                                    {'count' in tab && tab.count != null && tab.count > 0 && (
                                      <span className="ml-0.5 text-[9px] bg-muted rounded-full px-1.5 py-px">{tab.count}</span>
                                    )}
                                  </button>
                                ))}
                              </div>

                              {/* Scrollable content */}
                              <div className="overflow-y-auto flex-1 overscroll-contain">
                                {/* ── TOOLS ── */}
                                {!showChatHistory && !showMemoryPanel && (
                                  <div className="p-2.5 space-y-3">
                                    {Object.entries(groupedTools).map(([category, tools]) => {
                                      const meta = CATEGORY_META[category];
                                      const CatIcon = meta?.icon || Zap;
                                      return (
                                        <div key={category}>
                                          <div className="flex items-center gap-1.5 px-1 mb-1.5">
                                            <CatIcon className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                              {meta?.label || category}
                                            </span>
                                          </div>

                                          {category === 'quick' ? (
                                            <button
                                              type="button"
                                              onClick={() => { setActiveTool(tools[0]); setShowToolMenu(false); }}
                                              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                                                activeTool?.id === 'quick'
                                                  ? 'bg-primary text-primary-foreground'
                                                  : 'bg-primary/10 text-foreground hover:bg-primary/20'
                                              }`}
                                            >
                                              <Zap className="h-4 w-4" />
                                              Quick Answer
                                            </button>
                                          ) : (
                                            <div className="flex flex-col gap-1">
                                              {tools.map(tool => {
                                                const ToolIcon = tool.icon;
                                                const isActive = activeTool?.id === tool.id;
                                                return (
                                                  <button
                                                    key={tool.id}
                                                    type="button"
                                                    onClick={() => { setActiveTool(tool); setShowToolMenu(false); }}
                                                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                                                      isActive
                                                        ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                                                        : 'text-foreground hover:bg-accent active:bg-accent/80'
                                                    }`}
                                                  >
                                                    <span className={`h-8 w-8 shrink-0 rounded-md flex items-center justify-center ${isActive ? 'bg-primary/20' : 'bg-muted/60'}`}>
                                                      <ToolIcon className="h-4 w-4" />
                                                    </span>
                                                    <span className="flex-1 truncate">{tool.name}</span>
                                                    {isActive && <span className="text-[10px] uppercase tracking-wider text-primary/80 font-semibold">Active</span>}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}

                                    {/* Actions row */}
                                    <div className="flex gap-1.5 pt-1 border-t border-border/40">
                                      <button
                                        type="button"
                                        onClick={() => { setAiMessages([]); setCurrentChatLogId(null); setActiveTool(null); setShowToolMenu(false); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        New chat
                                      </button>
                                      {activeTool && (
                                        <button
                                          type="button"
                                          onClick={() => { setActiveTool(null); setShowToolMenu(false); }}
                                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                          Clear tool
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* ── HISTORY ── */}
                                {showChatHistory && (
                                  <div className="p-2.5">
                                    {chatLogs.length === 0 ? (
                                      <div className="text-center py-10 text-muted-foreground">
                                        <Clock className="h-6 w-6 mx-auto mb-2 opacity-40" />
                                        <p className="text-xs">No conversations yet</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-0.5">
                                        {chatLogs.slice(0, 20).map(log => (
                                          <div
                                            key={log.id}
                                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent transition-colors group cursor-pointer"
                                            onClick={() => {
                                              setAiMessages((log as ChatLog).messages || []);
                                              setCurrentChatLogId(log.id);
                                              setShowToolMenu(false);
                                              setShowChatHistory(false);
                                            }}
                                          >
                                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-[11px] font-medium text-foreground truncate">{log.title}</p>
                                              <p className="text-[10px] text-muted-foreground">
                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                              </p>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); deleteChatLog.mutate(log.id); }}
                                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* ── MEMORY ── */}
                                {showMemoryPanel && (
                                  <div className="p-2.5">
                                    {memoryItems.length === 0 ? (
                                      <div className="text-center py-10 text-muted-foreground">
                                        <BookOpen className="h-6 w-6 mx-auto mb-2 opacity-40" />
                                        <p className="text-xs">Say "learn this" to save knowledge</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-0.5">
                                        {memoryItems.slice(0, 20).map(item => (
                                          <div
                                            key={item.id}
                                            className="flex items-start gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent transition-colors group"
                                          >
                                            <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-[11px] font-medium text-foreground truncate">{item.title}</p>
                                              <p className="text-[10px] text-muted-foreground line-clamp-2">{item.content.slice(0, 100)}</p>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); deleteMemory.mutate(item.id); }}
                                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            </>
                          )}
                        </div>

                        {/* Document upload — visible only in Document Analysis mode */}
                        {activeTool?.id === 'analyze-document' && (
                          <>
                            <input
                              ref={docFileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleDocumentUpload(f);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => docFileInputRef.current?.click()}
                              disabled={isAnalyzingDoc || isAiLoading}
                              title="Upload a document image"
                              className="shrink-0 h-10 w-10 rounded-full flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary transition-all duration-200 disabled:opacity-50"
                            >
                              {isAnalyzingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            </button>
                          </>
                        )}

                        <Input
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          placeholder={
                            activeTool?.id === 'quick'
                              ? 'Ask a quick question...'
                              : activeTool?.id === 'resources'
                              ? 'Search offices, coworking, labs...'
                              : activeTool?.id === 'jobs'
                              ? 'Search jobs, internships, roles...'
                              : activeTool?.id === 'contacts'
                              ? 'Find contacts, connections...'
                              : activeTool?.id === 'summarize'
                              ? 'Paste text to summarize...'
                              : activeTool?.id === 'sentiment'
                              ? 'Paste text to analyze sentiment...'
                              : activeTool?.id === 'analyze-document'
                              ? 'Upload an image (📎) or describe what to analyze...'
                              : activeTool
                              ? `${activeTool.name}...`
                              : 'Ask Genius AI anything...'
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