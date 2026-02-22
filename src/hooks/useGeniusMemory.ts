import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MemoryItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ChatLog {
  id: string;
  user_id: string;
  title: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  tool_used: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export const useGeniusMemory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['genius-memory', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('genius_ai_memory' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MemoryItem[];
    },
    enabled: !!user,
  });
};

export const useSaveMemory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (item: { title: string; content: string; category?: string; tags?: string[]; source?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('genius_ai_memory' as any)
        .insert({ ...item, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genius-memory'] });
      toast.success('🧠 Saved to Genius memory!');
    },
    onError: (e: any) => toast.error('Failed to save: ' + e.message),
  });
};

export const useDeleteMemory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('genius_ai_memory' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genius-memory'] });
      toast.success('Memory item deleted');
    },
  });
};

// Chat logs
export const useGeniusChatLogs = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['genius-chat-logs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('genius_ai_chat_logs' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as ChatLog[];
    },
    enabled: !!user,
  });
};

export const useSaveChatLog = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (log: { title: string; messages: any[]; tool_used?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('genius_ai_chat_logs' as any)
        .insert({ ...log, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genius-chat-logs'] });
    },
  });
};

export const useUpdateChatLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, messages, title }: { id: string; messages: any[]; title?: string }) => {
      const update: any = { messages };
      if (title) update.title = title;
      const { error } = await supabase
        .from('genius_ai_chat_logs' as any)
        .update(update)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genius-chat-logs'] });
    },
  });
};

export const useDeleteChatLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('genius_ai_chat_logs' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genius-chat-logs'] });
      toast.success('Chat log deleted');
    },
  });
};

// Detect "learn this" intent
export const isLearnIntent = (text: string): boolean => {
  const lower = text.toLowerCase().trim();
  return /^(learn this|remember this|save this|memorize this|store this|keep this)/i.test(lower);
};

// Extract memory from conversation context
export const extractMemoryFromContext = (messages: { role: string; content: string }[]): { title: string; content: string } | null => {
  // Get the last few messages for context
  const recent = messages.slice(-4);
  const assistantMsgs = recent.filter(m => m.role === 'assistant');
  const userMsgs = recent.filter(m => m.role === 'user');
  
  if (assistantMsgs.length === 0 && userMsgs.length <= 1) return null;

  const lastAssistant = assistantMsgs[assistantMsgs.length - 1];
  const content = lastAssistant?.content || userMsgs[userMsgs.length - 2]?.content || '';
  const title = content.slice(0, 80).replace(/[#*_\n]/g, '').trim() || 'Saved knowledge';

  return { title, content };
};
