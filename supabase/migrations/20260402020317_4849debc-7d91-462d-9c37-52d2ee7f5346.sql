
-- Calendar Booking Settings table
CREATE TABLE public.calendar_booking_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_slug TEXT NOT NULL UNIQUE,
  default_duration INTEGER NOT NULL DEFAULT 30,
  buffer_minutes INTEGER NOT NULL DEFAULT 10,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  google_calendar_connected BOOLEAN NOT NULL DEFAULT false,
  microsoft_calendar_connected BOOLEAN NOT NULL DEFAULT false,
  is_booking_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_booking_settings ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Users can manage their own booking settings"
ON public.calendar_booking_settings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Public slug lookup (select only, needed for public booking page)
CREATE POLICY "Anyone can lookup booking settings by slug"
ON public.calendar_booking_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_calendar_booking_settings_updated_at
BEFORE UPDATE ON public.calendar_booking_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Calendar Bookings table
CREATE TABLE public.calendar_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booker_name TEXT NOT NULL,
  booker_email TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  topic TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  meeting_type TEXT NOT NULL DEFAULT 'virtual',
  meeting_link TEXT,
  location TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_bookings ENABLE ROW LEVEL SECURITY;

-- Hosts can manage their bookings
CREATE POLICY "Hosts can manage their bookings"
ON public.calendar_bookings
FOR ALL
TO authenticated
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id);

-- Bookers can view their own bookings
CREATE POLICY "Bookers can view their bookings"
ON public.calendar_bookings
FOR SELECT
TO authenticated
USING (auth.uid() = booker_id);

-- Anyone can create a booking (public booking page)
CREATE POLICY "Anyone can create bookings"
ON public.calendar_bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_calendar_bookings_host_id ON public.calendar_bookings(host_id);
CREATE INDEX idx_calendar_bookings_scheduled_at ON public.calendar_bookings(scheduled_at);
CREATE INDEX idx_calendar_booking_settings_slug ON public.calendar_booking_settings(booking_slug);
