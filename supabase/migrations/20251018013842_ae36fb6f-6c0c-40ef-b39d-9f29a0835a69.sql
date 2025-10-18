-- Allow mentors/advisors to offer mentorship (insert as mentor)
CREATE POLICY "Mentors can create mentorship offers"
ON public.mentorship_relationships
FOR INSERT
WITH CHECK (auth.uid() = mentor_id);