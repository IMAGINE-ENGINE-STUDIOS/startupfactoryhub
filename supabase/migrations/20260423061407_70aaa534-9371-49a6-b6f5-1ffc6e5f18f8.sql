-- Flow investigation sessions
CREATE TABLE public.flow_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Investigation',
  idea TEXT,
  domain TEXT,
  region TEXT,
  constraints TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flow_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own flow sessions" ON public.flow_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners insert own flow sessions" ON public.flow_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own flow sessions" ON public.flow_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete own flow sessions" ON public.flow_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_flow_sessions_user ON public.flow_sessions(user_id, updated_at DESC);

CREATE TRIGGER trg_flow_sessions_updated_at
BEFORE UPDATE ON public.flow_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Q&A messages
CREATE TABLE public.flow_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.flow_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flow_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own flow messages" ON public.flow_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners insert own flow messages" ON public.flow_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete own flow messages" ON public.flow_messages FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_flow_messages_session ON public.flow_messages(session_id, created_at ASC);

-- Notes
CREATE TABLE public.flow_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.flow_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flow_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own flow notes" ON public.flow_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners insert own flow notes" ON public.flow_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own flow notes" ON public.flow_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete own flow notes" ON public.flow_notes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_flow_notes_session ON public.flow_notes(session_id, updated_at DESC);

CREATE TRIGGER trg_flow_notes_updated_at
BEFORE UPDATE ON public.flow_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();