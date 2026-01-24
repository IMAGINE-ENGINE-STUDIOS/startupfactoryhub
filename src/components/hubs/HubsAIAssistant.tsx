import { useState, useRef, useEffect } from 'react';
import { Workspace, WorkspaceFilters, WorkspaceType } from '@/hooks/useHubsSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  MapPin,
  Building2,
  Loader2,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HubsAIAssistantProps {
  onClose: () => void;
  onSearch: (filters: Partial<WorkspaceFilters>) => void;
  workspaces: Workspace[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendations?: Workspace[];
}

// Simple NLP to extract filters from user query
const parseUserQuery = (query: string): Partial<WorkspaceFilters> => {
  const filters: Partial<WorkspaceFilters> = {};
  const lowerQuery = query.toLowerCase();

  // Extract workspace types
  const workspaceTypes: WorkspaceType[] = [];
  if (lowerQuery.includes('private') || lowerQuery.includes('office')) {
    workspaceTypes.push('private_office');
  }
  if (lowerQuery.includes('desk') || lowerQuery.includes('hot desk')) {
    workspaceTypes.push('hot_desk');
  }
  if (lowerQuery.includes('meeting') || lowerQuery.includes('conference')) {
    workspaceTypes.push('meeting_room');
  }
  if (lowerQuery.includes('cowork')) {
    workspaceTypes.push('coworking');
  }
  if (lowerQuery.includes('event')) {
    workspaceTypes.push('event_space');
  }
  if (workspaceTypes.length > 0) {
    filters.workspaceType = workspaceTypes;
  }

  // Extract budget
  const budgetMatch = lowerQuery.match(/(?:under|below|max|less than)\s*\$?(\d+)/);
  if (budgetMatch) {
    filters.maxBudget = parseInt(budgetMatch[1]);
  }

  // Extract city (simple extraction)
  const cityPatterns = [
    'in ([a-zA-Z]+)',
    'near ([a-zA-Z]+)',
    'around ([a-zA-Z]+)',
  ];
  for (const pattern of cityPatterns) {
    const match = lowerQuery.match(new RegExp(pattern));
    if (match) {
      filters.city = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      break;
    }
  }

  // Extract amenities
  const amenities: string[] = [];
  if (lowerQuery.includes('wifi') || lowerQuery.includes('internet')) {
    amenities.push('wifi');
  }
  if (lowerQuery.includes('coffee') || lowerQuery.includes('drinks')) {
    amenities.push('coffee');
  }
  if (lowerQuery.includes('parking')) {
    amenities.push('parking');
  }
  if (lowerQuery.includes('quiet') || lowerQuery.includes('private')) {
    amenities.push('phone_booth');
  }
  if (amenities.length > 0) {
    filters.amenities = amenities;
  }

  return filters;
};

// Generate assistant response based on query and results
const generateResponse = (query: string, filters: Partial<WorkspaceFilters>, workspaces: Workspace[]): string => {
  const filterParts: string[] = [];
  
  if (filters.workspaceType?.length) {
    filterParts.push(`${filters.workspaceType.map(t => t.replace('_', ' ')).join(', ')} spaces`);
  }
  if (filters.city) {
    filterParts.push(`in ${filters.city}`);
  }
  if (filters.maxBudget) {
    filterParts.push(`under $${filters.maxBudget}/hr`);
  }
  if (filters.amenities?.length) {
    filterParts.push(`with ${filters.amenities.join(', ')}`);
  }

  if (workspaces.length === 0) {
    return `I searched for ${filterParts.join(' ') || 'workspaces'} but didn't find any matches. Try adjusting your criteria or searching in a different location.`;
  }

  const topPick = workspaces[0];
  let response = `I found ${workspaces.length} workspace${workspaces.length > 1 ? 's' : ''} ${filterParts.join(' ') || 'matching your criteria'}.\n\n`;
  
  response += `**Top recommendation:** ${topPick.name} in ${topPick.city}`;
  
  if (topPick.hourly_rate_min) {
    response += ` - Starting at $${topPick.hourly_rate_min}/hr`;
  }
  
  if (topPick.rating) {
    response += ` ⭐ ${topPick.rating.toFixed(1)}`;
  }

  if (workspaces.length > 1) {
    response += `\n\nI've also found ${workspaces.length - 1} other option${workspaces.length > 2 ? 's' : ''} for you to explore.`;
  }

  return response;
};

export const HubsAIAssistant = ({ onClose, onSearch, workspaces }: HubsAIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm your workspace assistant. Tell me what kind of space you're looking for, and I'll help you find the perfect match.\n\nTry saying something like:\n• \"Find me a private office in San Francisco\"\n• \"I need a meeting room under $50/hr with wifi\"\n• \"Show me coworking spaces near Orlando\"",
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Parse query and extract filters
    const filters = parseUserQuery(input);
    
    // Apply filters
    onSearch(filters);

    // Wait for workspaces to update
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate response
    const response = generateResponse(input, filters, workspaces);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      recommendations: workspaces.slice(0, 3),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsProcessing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Hub Assistant</h3>
            <p className="text-xs text-muted-foreground">AI-powered search</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={cn(
                  message.role === 'assistant' 
                    ? "bg-gradient-to-br from-primary to-purple-500" 
                    : "bg-muted"
                )}>
                  {message.role === 'assistant' ? (
                    <Bot className="h-4 w-4 text-white" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
              
              <div className={cn(
                "max-w-[85%] space-y-2",
                message.role === 'user' && "text-right"
              )}>
                <div className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                  message.role === 'assistant' 
                    ? "bg-muted/50 border border-border/50" 
                    : "bg-primary text-primary-foreground"
                )}>
                  {message.content}
                </div>
                
                {/* Recommendations */}
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {message.recommendations.map((ws) => (
                      <div
                        key={ws.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-card/50 border border-border/50 text-left"
                      >
                        {ws.image_url ? (
                          <img
                            src={ws.image_url}
                            alt={ws.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ws.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{ws.city}</span>
                            {ws.rating && (
                              <>
                                <Star className="h-3 w-3 text-amber-500 fill-current" />
                                <span>{ws.rating.toFixed(1)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {ws.hourly_rate_min && (
                          <Badge variant="secondary" className="text-xs">
                            ${ws.hourly_rate_min}/hr
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-500">
                  <Bot className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted/50 border border-border/50 rounded-2xl px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your ideal workspace..."
            className="bg-muted/50"
            disabled={isProcessing}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
