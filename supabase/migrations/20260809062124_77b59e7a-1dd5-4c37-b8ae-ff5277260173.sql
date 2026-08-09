CREATE TABLE public.company_investor_qa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (company_id, question_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_investor_qa TO authenticated;
GRANT ALL ON public.company_investor_qa TO service_role;

ALTER TABLE public.company_investor_qa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read investor Q&A"
ON public.company_investor_qa FOR SELECT TO authenticated USING (true);

CREATE POLICY "Company owners can insert their investor Q&A"
ON public.company_investor_qa FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.user_id = auth.uid()));

CREATE POLICY "Company owners can update their investor Q&A"
ON public.company_investor_qa FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.user_id = auth.uid()));

CREATE POLICY "Company owners can delete their investor Q&A"
ON public.company_investor_qa FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND c.user_id = auth.uid()));

CREATE TRIGGER update_company_investor_qa_updated_at
BEFORE UPDATE ON public.company_investor_qa
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();