
-- Knowledge memory items - user can say "learn this" to save knowledge
CREATE TABLE public.genius_ai_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat conversation logs for Genius AI
CREATE TABLE public.genius_ai_chat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  messages JSONB NOT NULL DEFAULT '[]',
  tool_used TEXT DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_genius_ai_memory_user_id ON public.genius_ai_memory(user_id);
CREATE INDEX idx_genius_ai_memory_category ON public.genius_ai_memory(user_id, category);
CREATE INDEX idx_genius_ai_chat_logs_user_id ON public.genius_ai_chat_logs(user_id);
CREATE INDEX idx_genius_ai_chat_logs_updated ON public.genius_ai_chat_logs(user_id, updated_at DESC);

-- Enable RLS
ALTER TABLE public.genius_ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genius_ai_chat_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for memory
CREATE POLICY "Users can view own memory" ON public.genius_ai_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own memory" ON public.genius_ai_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memory" ON public.genius_ai_memory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memory" ON public.genius_ai_memory FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for chat logs
CREATE POLICY "Users can view own chat logs" ON public.genius_ai_chat_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chat logs" ON public.genius_ai_chat_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat logs" ON public.genius_ai_chat_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat logs" ON public.genius_ai_chat_logs FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_genius_ai_memory_updated_at
  BEFORE UPDATE ON public.genius_ai_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_genius_ai_chat_logs_updated_at
  BEFORE UPDATE ON public.genius_ai_chat_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
