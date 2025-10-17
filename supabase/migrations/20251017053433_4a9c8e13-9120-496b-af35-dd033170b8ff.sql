-- Create CRM pipelines table
CREATE TABLE public.crm_pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CRM stages table (columns in the board)
CREATE TABLE public.crm_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CRM cards table (individual client/deal cards)
CREATE TABLE public.crm_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL REFERENCES public.crm_stages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  deal_value BIGINT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  tags TEXT[]
);

-- Enable RLS
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_pipelines
CREATE POLICY "Users can manage their own pipelines"
ON public.crm_pipelines
FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for crm_stages
CREATE POLICY "Users can view stages in their pipelines"
ON public.crm_stages
FOR SELECT
USING (
  pipeline_id IN (
    SELECT id FROM public.crm_pipelines WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage stages in their pipelines"
ON public.crm_stages
FOR ALL
USING (
  pipeline_id IN (
    SELECT id FROM public.crm_pipelines WHERE user_id = auth.uid()
  )
);

-- RLS Policies for crm_cards
CREATE POLICY "Users can manage their own cards"
ON public.crm_cards
FOR ALL
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_crm_stages_pipeline ON public.crm_stages(pipeline_id);
CREATE INDEX idx_crm_cards_stage ON public.crm_cards(stage_id);
CREATE INDEX idx_crm_cards_user ON public.crm_cards(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_crm_pipelines_updated_at
BEFORE UPDATE ON public.crm_pipelines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_cards_updated_at
BEFORE UPDATE ON public.crm_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();