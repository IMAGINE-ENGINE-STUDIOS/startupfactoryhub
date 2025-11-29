-- Add DELETE policy for connections table
CREATE POLICY "Users can delete connections they're involved in" 
ON public.connections 
FOR DELETE 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);