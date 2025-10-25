-- Create PDF editing sessions table
CREATE TABLE IF NOT EXISTS public.pdf_editing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  current_version_url TEXT,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create PDF operation history table
CREATE TABLE IF NOT EXISTS public.pdf_operation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.pdf_editing_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  operation_data JSONB NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version_number INTEGER NOT NULL DEFAULT 1
);

-- Create PDF collaboration cursors table
CREATE TABLE IF NOT EXISTS public.pdf_collaboration_cursors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.pdf_editing_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_color TEXT NOT NULL,
  position JSONB NOT NULL,
  page_number INTEGER NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pdf_editing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_operation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_collaboration_cursors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdf_editing_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.pdf_editing_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.pdf_editing_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.pdf_editing_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.pdf_editing_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for pdf_operation_history
CREATE POLICY "Users can view operations on their sessions"
  ON public.pdf_operation_history FOR SELECT
  USING (session_id IN (
    SELECT id FROM public.pdf_editing_sessions WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create operations on their sessions"
  ON public.pdf_operation_history FOR INSERT
  WITH CHECK (session_id IN (
    SELECT id FROM public.pdf_editing_sessions WHERE user_id = auth.uid()
  ) AND auth.uid() = user_id);

-- RLS Policies for pdf_collaboration_cursors
CREATE POLICY "Anyone can view cursors on active sessions"
  ON public.pdf_collaboration_cursors FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own cursor"
  ON public.pdf_collaboration_cursors FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_pdf_sessions_user_id ON public.pdf_editing_sessions(user_id);
CREATE INDEX idx_pdf_operations_session_id ON public.pdf_operation_history(session_id);
CREATE INDEX idx_pdf_cursors_session_id ON public.pdf_collaboration_cursors(session_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_pdf_sessions_updated_at
  BEFORE UPDATE ON public.pdf_editing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();