-- Create portfolio companies table for investors to showcase their past investments
CREATE TABLE IF NOT EXISTS public.portfolio_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  industry TEXT,
  stage TEXT,
  investment_amount BIGINT,
  investment_year INTEGER,
  exit_status TEXT DEFAULT 'active',
  website TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_companies_investor ON public.portfolio_companies(investor_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_companies_industry ON public.portfolio_companies(industry);
CREATE INDEX IF NOT EXISTS idx_portfolio_companies_stage ON public.portfolio_companies(stage);

-- Enable RLS
ALTER TABLE public.portfolio_companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view portfolio companies"
  ON public.portfolio_companies
  FOR SELECT
  USING (true);

CREATE POLICY "Investors can manage their portfolio"
  ON public.portfolio_companies
  FOR ALL
  USING (auth.uid() = investor_id)
  WITH CHECK (auth.uid() = investor_id);

-- Add trigger for updated_at
CREATE TRIGGER update_portfolio_companies_updated_at
  BEFORE UPDATE ON public.portfolio_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add industry to investor profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'investor_profiles' 
    AND column_name = 'focus_industries'
  ) THEN
    ALTER TABLE public.investor_profiles 
    ADD COLUMN focus_industries TEXT[] DEFAULT '{}';
  END IF;
END $$;