-- Create market_themes table for Emerging Market Scores
CREATE TABLE public.market_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  ems_score DECIMAL(5,2) DEFAULT 50,
  trend_direction TEXT DEFAULT 'stable',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create startup_scores table
CREATE TABLE public.startup_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cohort_startup_id UUID REFERENCES public.cohort_startups(id) ON DELETE SET NULL,
  
  -- Company Coefficient (10 factors, each 1-10)
  cc_founder_team_quality INTEGER DEFAULT 5,
  cc_intellectual_property INTEGER DEFAULT 5,
  cc_product_market_fit INTEGER DEFAULT 5,
  cc_strategic_partnerships INTEGER DEFAULT 5,
  cc_exit_environment INTEGER DEFAULT 5,
  cc_supply_chain_stability INTEGER DEFAULT 5,
  cc_regulatory_momentum INTEGER DEFAULT 5,
  cc_capital_efficiency INTEGER DEFAULT 5,
  cc_recurring_revenue_ratio INTEGER DEFAULT 5,
  cc_tech_replacement_risk INTEGER DEFAULT 5,
  
  -- Traction Score metrics
  ts_revenue_growth DECIMAL(7,2) DEFAULT 0,
  ts_user_pilot_count INTEGER DEFAULT 0,
  ts_retention_rate DECIMAL(5,2) DEFAULT 0,
  ts_sales_cycle_days INTEGER DEFAULT 90,
  ts_stage TEXT DEFAULT 'pre_seed',
  
  -- Market/Theme assignment
  primary_market TEXT,
  market_ems_score DECIMAL(5,2) DEFAULT 50,
  
  -- Calculated scores (cached)
  company_coefficient DECIMAL(5,2),
  traction_score DECIMAL(5,2),
  core_score DECIMAL(5,2),
  startup_score DECIMAL(5,2),
  
  -- Weights (customizable)
  weight_alpha DECIMAL(3,2) DEFAULT 0.50,
  weight_beta DECIMAL(3,2) DEFAULT 0.50,
  weight_gamma DECIMAL(3,2) DEFAULT 1.00,
  
  -- Metadata
  scored_by UUID,
  scored_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_scores ENABLE ROW LEVEL SECURITY;

-- Market themes policies (anyone can view, authenticated can manage)
CREATE POLICY "Anyone can view market themes" ON public.market_themes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage market themes" ON public.market_themes
  FOR ALL USING (auth.role() = 'authenticated');

-- Startup scores policies
CREATE POLICY "Company owners can view their scores" ON public.startup_scores
  FOR SELECT USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Accelerators can view scores for portfolio startups" ON public.startup_scores
  FOR SELECT USING (
    cohort_startup_id IN (
      SELECT cs.id FROM public.cohort_startups cs
      JOIN public.accelerator_cohorts ac ON cs.cohort_id = ac.id
      JOIN public.accelerator_profiles ap ON ac.accelerator_id = ap.id
      WHERE ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Company owners can manage their scores" ON public.startup_scores
  FOR ALL USING (company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid()));

CREATE POLICY "Accelerators can manage scores for portfolio startups" ON public.startup_scores
  FOR ALL USING (
    cohort_startup_id IN (
      SELECT cs.id FROM public.cohort_startups cs
      JOIN public.accelerator_cohorts ac ON cs.cohort_id = ac.id
      JOIN public.accelerator_profiles ap ON ac.accelerator_id = ap.id
      WHERE ap.user_id = auth.uid()
    )
  );

-- Insert default market themes
INSERT INTO public.market_themes (name, description, ems_score, trend_direction) VALUES
  ('AI/Machine Learning', 'Artificial intelligence and machine learning applications', 92, 'rising'),
  ('Climate Tech', 'Clean energy, carbon capture, sustainability solutions', 88, 'rising'),
  ('FinTech', 'Financial technology and digital payments', 75, 'stable'),
  ('HealthTech', 'Healthcare technology and digital health', 82, 'rising'),
  ('EdTech', 'Educational technology and e-learning', 65, 'stable'),
  ('SaaS/Enterprise', 'Software-as-a-Service and enterprise solutions', 70, 'stable'),
  ('E-commerce', 'Online retail and marketplace platforms', 55, 'declining'),
  ('Cybersecurity', 'Security software and data protection', 85, 'rising'),
  ('Biotech', 'Biotechnology and life sciences', 78, 'rising'),
  ('SpaceTech', 'Space exploration and satellite technology', 80, 'rising'),
  ('Web3/Blockchain', 'Decentralized applications and blockchain', 45, 'declining'),
  ('IoT/Hardware', 'Internet of Things and connected devices', 60, 'stable'),
  ('PropTech', 'Real estate and property technology', 58, 'stable'),
  ('FoodTech', 'Food innovation and agtech', 72, 'rising'),
  ('Mobility', 'Transportation and autonomous vehicles', 68, 'stable');

-- Create index for faster lookups
CREATE INDEX idx_startup_scores_company ON public.startup_scores(company_id);
CREATE INDEX idx_startup_scores_cohort ON public.startup_scores(cohort_startup_id);

-- Trigger to update updated_at
CREATE TRIGGER update_startup_scores_updated_at
  BEFORE UPDATE ON public.startup_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();