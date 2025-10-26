import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePDFEditorStore } from '@/stores/pdfEditorStore';
import { toast } from 'sonner';

export const usePDFAutoSave = (
  sessionId: string | null,
  fabricJSON: string | null,
  currentPage: number
) => {
  const lastSavedRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!sessionId || !fabricJSON) return;

    // Skip if nothing changed
    if (fabricJSON === lastSavedRef.current) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 5 seconds
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        lastSavedRef.current = fabricJSON;

        // Update session with current page's Fabric JSON
        const { error } = await supabase
          .from('pdf_editing_sessions')
          .update({
            session_data: {
              [currentPage]: fabricJSON,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        if (error) {
          console.error('Auto-save error:', error);
          toast.error('Failed to auto-save');
        } else {
          console.log('Auto-saved successfully');
        }
      } catch (error: any) {
        console.error('Auto-save error:', error);
      }
    }, 5000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [sessionId, fabricJSON, currentPage]);
};
