import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PDFVersion {
  id: string;
  session_id: string;
  user_id: string;
  version_number: number;
  version_name: string | null;
  canvas_data: any;
  is_auto_save: boolean;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export const useVersionHistory = (sessionId: string | null) => {
  const [versions, setVersions] = useState<PDFVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch versions
  const fetchVersions = useCallback(async () => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('pdf_versions')
        .select(`
          *,
          user:profiles!pdf_versions_user_id_fkey(full_name, email, avatar_url)
        `)
        .eq('session_id', sessionId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      setVersions(data || []);
    } catch (error: any) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Create version
  const createVersion = useCallback(async (
    canvasData: any,
    versionName?: string,
    isAutoSave: boolean = true
  ) => {
    if (!sessionId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get latest version number
      const { data: latestVersion } = await supabase
        .from('pdf_versions')
        .select('version_number')
        .eq('session_id', sessionId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

      const { data, error } = await supabase
        .from('pdf_versions')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          version_number: nextVersionNumber,
          version_name: versionName || null,
          canvas_data: canvasData,
          is_auto_save: isAutoSave,
        })
        .select()
        .single();

      if (error) throw error;

      if (!isAutoSave) {
        toast.success('Version saved');
      }
      
      await fetchVersions();
      return data;
    } catch (error: any) {
      console.error('Error creating version:', error);
      if (!isAutoSave) {
        toast.error('Failed to save version');
      }
    }
  }, [sessionId, fetchVersions]);

  // Load version
  const loadVersion = useCallback(async (versionId: string) => {
    try {
      const { data, error } = await supabase
        .from('pdf_versions')
        .select('canvas_data')
        .eq('id', versionId)
        .single();

      if (error) throw error;

      return data.canvas_data;
    } catch (error: any) {
      console.error('Error loading version:', error);
      toast.error('Failed to load version');
    }
  }, []);

  // Delete version
  const deleteVersion = useCallback(async (versionId: string) => {
    try {
      const { error } = await supabase
        .from('pdf_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;

      toast.success('Version deleted');
      await fetchVersions();
    } catch (error: any) {
      console.error('Error deleting version:', error);
      toast.error('Failed to delete version');
    }
  }, [fetchVersions]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  return {
    versions,
    isLoading,
    createVersion,
    loadVersion,
    deleteVersion,
    refetch: fetchVersions,
  };
};
