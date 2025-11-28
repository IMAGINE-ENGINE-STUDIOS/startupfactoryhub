-- Create company_valuations table for tracking startup valuation history
CREATE TABLE public.company_valuations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  valuation_amount BIGINT NOT NULL,
  valuation_date DATE NOT NULL,
  round_name TEXT, -- e.g., "Seed", "Series A", "Series B"
  source TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'api', 'external'
  verified BOOLEAN DEFAULT false,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new columns to investments table
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS investment_round TEXT,
ADD COLUMN IF NOT EXISTS valuation_at_investment BIGINT,
ADD COLUMN IF NOT EXISTS current_value BIGINT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_data JSONB;

-- Enable RLS on company_valuations
ALTER TABLE public.company_valuations ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_valuations
CREATE POLICY "Anyone can view valuations" 
ON public.company_valuations 
FOR SELECT 
USING (true);

CREATE POLICY "Investors can create valuations for their portfolio companies" 
ON public.company_valuations 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND
  company_id IN (
    SELECT company_id FROM public.investments WHERE investor_id = auth.uid()
  )
);

CREATE POLICY "Company owners can create valuations" 
ON public.company_valuations 
FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT id FROM public.companies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Creators can update their valuations" 
ON public.company_valuations 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their valuations" 
ON public.company_valuations 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create index for faster queries
CREATE INDEX idx_company_valuations_company_id ON public.company_valuations(company_id);
CREATE INDEX idx_company_valuations_date ON public.company_valuations(valuation_date DESC);
CREATE INDEX idx_investments_investor_id ON public.investments(investor_id);

-- Trigger to update updated_at
CREATE TRIGGER update_company_valuations_updated_at
BEFORE UPDATE ON public.company_valuations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();