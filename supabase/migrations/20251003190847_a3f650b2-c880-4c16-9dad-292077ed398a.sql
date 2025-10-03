-- Create AI-related tables for the platform

-- AI Conversations table (for chatbot history)
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL, -- 'general', 'document_qa', 'assistant'
  title TEXT,
  context JSONB, -- Store conversation context
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Messages table (individual messages in conversations)
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB, -- Store additional info like tokens used, model, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Summaries table (cache summaries)
CREATE TABLE IF NOT EXISTS public.ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'post', 'document', 'profile', 'course'
  source_id UUID, -- Reference to the original content
  original_text TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  key_points JSONB, -- Array of key points
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Insights table (sentiment analysis and other insights)
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'feedback', 'message', 'post'
  content_id UUID, -- Reference to the content
  insight_type TEXT NOT NULL, -- 'sentiment', 'urgency', 'category'
  insight_data JSONB NOT NULL, -- Store sentiment scores, categories, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Translations table (cache translations)
CREATE TABLE IF NOT EXISTS public.ai_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_text TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Task Automations table (workflow rules)
CREATE TABLE IF NOT EXISTS public.ai_task_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'event', 'schedule', 'condition'
  trigger_config JSONB NOT NULL,
  action_type TEXT NOT NULL, -- 'notify', 'create_task', 'send_message'
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Documents table (uploaded documents for Q&A)
CREATE TABLE IF NOT EXISTS public.ai_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  document_type TEXT, -- 'pdf', 'image', 'text'
  embeddings JSONB, -- Store document embeddings for semantic search
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_task_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON public.ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON public.ai_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for ai_messages
CREATE POLICY "Users can view messages from their conversations"
  ON public.ai_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON public.ai_messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for ai_summaries
CREATE POLICY "Users can view their own summaries"
  ON public.ai_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own summaries"
  ON public.ai_summaries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_insights
CREATE POLICY "Users can view their own insights"
  ON public.ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create insights"
  ON public.ai_insights FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ai_translations (public cache)
CREATE POLICY "Anyone can view translations"
  ON public.ai_translations FOR SELECT
  USING (true);

CREATE POLICY "System can create translations"
  ON public.ai_translations FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ai_task_automations
CREATE POLICY "Users can manage their own automations"
  ON public.ai_task_automations FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for ai_documents
CREATE POLICY "Users can manage their own documents"
  ON public.ai_documents FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX idx_ai_summaries_source ON public.ai_summaries(source_type, source_id);
CREATE INDEX idx_ai_insights_content ON public.ai_insights(content_type, content_id);
CREATE INDEX idx_ai_translations_lookup ON public.ai_translations(original_text, source_language, target_language);
CREATE INDEX idx_ai_documents_user_id ON public.ai_documents(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_summaries_updated_at
  BEFORE UPDATE ON public.ai_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_task_automations_updated_at
  BEFORE UPDATE ON public.ai_task_automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();