-- Allow admins to view ALL bookings
CREATE POLICY "Admins can view all bookings"
ON public.hub_bookings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update ANY booking (for approve/reject/flag)
CREATE POLICY "Admins can update all bookings"
ON public.hub_bookings
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));