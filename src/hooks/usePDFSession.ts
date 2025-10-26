import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePDFEditorStore } from '@/stores/pdfEditorStore';
import { toast } from 'sonner';

export const usePDFSession = (pdfUrl: string | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const { sessionId, setSessionId } = usePDFEditorStore();

  useEffect(() => {
    if (!pdfUrl) return;

    const loadOrCreateSession = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please sign in to save your work');
          return;
        }

        // Try to find existing session for this PDF
        const { data: existingSession, error: fetchError } = await supabase
          .from('pdf_editing_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('pdf_url', pdfUrl)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching session:', fetchError);
          toast.error('Failed to load session');
          return null;
        }

        if (existingSession) {
          // Load existing session
          setSessionId(existingSession.id);
          toast.success('Session loaded');
          return existingSession;
        } else {
          // Create new session
          const fileName = pdfUrl.split('/').pop() || 'Untitled PDF';
          const { data: newSession, error: createError } = await supabase
            .from('pdf_editing_sessions')
            .insert({
              user_id: user.id,
              pdf_url: pdfUrl,
              title: fileName,
              session_data: {},
              is_active: true,
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating session:', createError);
            toast.error('Failed to create session');
            return null;
          }

          setSessionId(newSession.id);
          toast.success('New session created');
          return newSession;
        }
      } catch (error: any) {
        console.error('Session error:', error);
        toast.error('Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrCreateSession();
  }, [pdfUrl, setSessionId]);

  return { sessionId, isLoading };
};
