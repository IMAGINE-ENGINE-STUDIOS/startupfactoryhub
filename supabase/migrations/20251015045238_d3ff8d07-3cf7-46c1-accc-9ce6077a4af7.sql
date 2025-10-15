-- Create investor availability table
CREATE TABLE IF NOT EXISTS public.investor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create pitch meetings table
CREATE TABLE IF NOT EXISTS public.pitch_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  meeting_notes TEXT,
  meeting_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_pitch_slot UNIQUE (investor_id, scheduled_date)
);

-- Enable RLS on investor_availability
ALTER TABLE public.investor_availability ENABLE ROW LEVEL SECURITY;

-- RLS policies for investor_availability
CREATE POLICY "Anyone can view investor availability"
  ON public.investor_availability FOR SELECT
  USING (true);

CREATE POLICY "Investors can manage their own availability"
  ON public.investor_availability FOR ALL
  USING (auth.uid() = investor_id)
  WITH CHECK (auth.uid() = investor_id);

-- Enable RLS on pitch_meetings
ALTER TABLE public.pitch_meetings ENABLE ROW LEVEL SECURITY;

-- RLS policies for pitch_meetings
CREATE POLICY "Startups can view their own pitch meetings"
  ON public.pitch_meetings FOR SELECT
  USING (auth.uid() = startup_id);

CREATE POLICY "Investors can view their pitch meetings"
  ON public.pitch_meetings FOR SELECT
  USING (auth.uid() = investor_id);

CREATE POLICY "Startups can create pitch meetings"
  ON public.pitch_meetings FOR INSERT
  WITH CHECK (auth.uid() = startup_id);

CREATE POLICY "Users can update their own pitch meetings"
  ON public.pitch_meetings FOR UPDATE
  USING (auth.uid() = startup_id OR auth.uid() = investor_id);

CREATE POLICY "Users can delete their own pitch meetings"
  ON public.pitch_meetings FOR DELETE
  USING (auth.uid() = startup_id OR auth.uid() = investor_id);

-- Create indexes for better performance
CREATE INDEX idx_investor_availability_investor ON public.investor_availability(investor_id);
CREATE INDEX idx_investor_availability_day ON public.investor_availability(day_of_week);
CREATE INDEX idx_pitch_meetings_startup ON public.pitch_meetings(startup_id);
CREATE INDEX idx_pitch_meetings_investor ON public.pitch_meetings(investor_id);
CREATE INDEX idx_pitch_meetings_date ON public.pitch_meetings(scheduled_date);

-- Create trigger for updating updated_at
CREATE TRIGGER update_investor_availability_updated_at
  BEFORE UPDATE ON public.investor_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pitch_meetings_updated_at
  BEFORE UPDATE ON public.pitch_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();