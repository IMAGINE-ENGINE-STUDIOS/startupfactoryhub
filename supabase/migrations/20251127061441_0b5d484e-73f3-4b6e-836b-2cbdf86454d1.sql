-- Create study_group_messages table for real-time chat
CREATE TABLE IF NOT EXISTS public.study_group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create study_group_files table for shared research papers
CREATE TABLE IF NOT EXISTS public.study_group_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_group_messages
CREATE POLICY "Members can view messages in their groups"
ON public.study_group_messages
FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM public.study_group_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can send messages in their groups"
ON public.study_group_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  group_id IN (
    SELECT group_id FROM public.study_group_members 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for study_group_files
CREATE POLICY "Members can view files in their groups"
ON public.study_group_files
FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM public.study_group_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can upload files in their groups"
ON public.study_group_files
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  group_id IN (
    SELECT group_id FROM public.study_group_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can delete their own files"
ON public.study_group_files
FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for study room files
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-room-files', 'study-room-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for study room files
CREATE POLICY "Members can upload files to their study rooms"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'study-room-files' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Members can view files from their study rooms"
ON storage.objects
FOR SELECT
USING (bucket_id = 'study-room-files');

CREATE POLICY "Users can delete their own uploaded files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'study-room-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime for study_group_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_group_messages;