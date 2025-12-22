-- Add policy for admins to delete any post
CREATE POLICY "Admins can delete any post"
ON public.feed_posts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));