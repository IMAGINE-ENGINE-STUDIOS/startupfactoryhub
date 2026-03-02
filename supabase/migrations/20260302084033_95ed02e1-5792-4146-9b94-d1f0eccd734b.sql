
-- Create image_generation_usage table
CREATE TABLE public.image_generation_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  style_preset TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.image_generation_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can view their own image usage"
  ON public.image_generation_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert their own image usage"
  ON public.image_generation_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for fast user lookups
CREATE INDEX idx_image_generation_usage_user_id ON public.image_generation_usage (user_id);

-- Create storage bucket for AI-generated images
INSERT INTO storage.buckets (id, name, public) VALUES ('ai-generated-images', 'ai-generated-images', true);

-- Storage policies
CREATE POLICY "AI generated images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ai-generated-images');

CREATE POLICY "Authenticated users can upload AI generated images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ai-generated-images' AND auth.role() = 'authenticated');
