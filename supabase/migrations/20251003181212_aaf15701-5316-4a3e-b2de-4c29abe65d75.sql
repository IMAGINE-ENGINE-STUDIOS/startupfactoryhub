-- Create investments table to track actual investments
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  investment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  equity_percentage DECIMAL(5,2),
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'exited', 'written_off')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(investor_id, company_id)
);

-- Enable RLS on investments
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investments
CREATE POLICY "Investors can view their own investments"
ON public.investments
FOR SELECT
USING (auth.uid() = investor_id);

CREATE POLICY "Investors can manage their own investments"
ON public.investments
FOR ALL
USING (auth.uid() = investor_id);

CREATE POLICY "Company owners can view their investors"
ON public.investments
FOR SELECT
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE user_id = auth.uid()
  )
);

-- Create investment_interests table for due diligence and expressions of interest
CREATE TABLE IF NOT EXISTS public.investment_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'interested' CHECK (status IN ('interested', 'due_diligence', 'committed', 'passed')),
  interest_type TEXT DEFAULT 'general' CHECK (interest_type IN ('general', 'seed', 'series_a', 'series_b', 'growth')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(investor_id, company_id)
);

-- Enable RLS on investment_interests
ALTER TABLE public.investment_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investment_interests
CREATE POLICY "Investors can view their own interests"
ON public.investment_interests
FOR SELECT
USING (auth.uid() = investor_id);

CREATE POLICY "Investors can manage their own interests"
ON public.investment_interests
FOR ALL
USING (auth.uid() = investor_id);

CREATE POLICY "Company owners can view interest in their companies"
ON public.investment_interests
FOR SELECT
USING (
  company_id IN (
    SELECT id FROM public.companies WHERE user_id = auth.uid()
  )
);

-- Create investor_profiles table for additional investor-specific data
CREATE TABLE IF NOT EXISTS public.investor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  investment_range_min BIGINT,
  investment_range_max BIGINT,
  preferred_stages TEXT[],
  preferred_industries TEXT[],
  portfolio_size INTEGER DEFAULT 0,
  total_invested BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on investor_profiles
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investor_profiles
CREATE POLICY "Investors can view their own profile"
ON public.investor_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Investors can manage their own profile"
ON public.investor_profiles
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view investor profiles"
ON public.investor_profiles
FOR SELECT
USING (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_investments_updated_at
BEFORE UPDATE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investment_interests_updated_at
BEFORE UPDATE ON public.investment_interests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investor_profiles_updated_at
BEFORE UPDATE ON public.investor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update portfolio stats when investment is made
CREATE OR REPLACE FUNCTION update_investor_portfolio_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.investor_profiles
    SET 
      portfolio_size = portfolio_size + 1,
      total_invested = total_invested + NEW.amount
    WHERE user_id = NEW.investor_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.investor_profiles
    SET 
      portfolio_size = GREATEST(0, portfolio_size - 1),
      total_invested = GREATEST(0, total_invested - OLD.amount)
    WHERE user_id = OLD.investor_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_portfolio_on_investment
AFTER INSERT OR DELETE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION update_investor_portfolio_stats();