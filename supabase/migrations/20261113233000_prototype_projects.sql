-- Prototype Studio: member-owned hardware prototype projects.
-- design holds the canvas document: { components: [...], connections: [...] }.
CREATE TABLE public.prototype_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  design JSONB NOT NULL DEFAULT '{"components":[],"connections":[]}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prototype_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own prototype projects"
  ON public.prototype_projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_prototype_projects_user ON public.prototype_projects (user_id);
