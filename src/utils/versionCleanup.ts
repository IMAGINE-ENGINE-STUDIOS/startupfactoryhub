import { supabase } from "@/integrations/supabase/client";

export interface CleanupResult {
  deletedCount: number;
  success: boolean;
  error?: string;
}

/**
 * Delete temporary document versions older than 24 hours
 */
export async function cleanupOldVersions(userId: string): Promise<CleanupResult> {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data, error } = await supabase
      .from('document_versions')
      .delete()
      .eq('user_id', userId)
      .eq('is_temporary', true)
      .lt('created_at', twentyFourHoursAgo.toISOString())
      .select();

    if (error) {
      console.error('Error cleaning up old versions:', error);
      return {
        deletedCount: 0,
        success: false,
        error: error.message
      };
    }

    return {
      deletedCount: data?.length || 0,
      success: true
    };
  } catch (error: any) {
    console.error('Unexpected error during cleanup:', error);
    return {
      deletedCount: 0,
      success: false,
      error: error.message
    };
  }
}

/**
 * Keep only the last N temporary versions for a specific project session
 */
export async function limitTemporaryVersions(
  userId: string,
  projectId: string | null,
  sessionId: string,
  maxVersions: number = 50
): Promise<CleanupResult> {
  try {
    // Get all temporary versions for this session, ordered by creation date
    const { data: versions, error: fetchError } = await supabase
      .from('document_versions')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .eq('is_temporary', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return {
        deletedCount: 0,
        success: false,
        error: fetchError.message
      };
    }

    // If we have more than maxVersions, delete the oldest ones
    if (versions && versions.length > maxVersions) {
      const versionsToDelete = versions.slice(maxVersions);
      const idsToDelete = versionsToDelete.map(v => v.id);

      const { error: deleteError } = await supabase
        .from('document_versions')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        return {
          deletedCount: 0,
          success: false,
          error: deleteError.message
        };
      }

      return {
        deletedCount: versionsToDelete.length,
        success: true
      };
    }

    return {
      deletedCount: 0,
      success: true
    };
  } catch (error: any) {
    return {
      deletedCount: 0,
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete all temporary versions for a user (use with caution)
 */
export async function clearAllTemporaryVersions(userId: string): Promise<CleanupResult> {
  try {
    const { data, error } = await supabase
      .from('document_versions')
      .delete()
      .eq('user_id', userId)
      .eq('is_temporary', true)
      .select();

    if (error) {
      return {
        deletedCount: 0,
        success: false,
        error: error.message
      };
    }

    return {
      deletedCount: data?.length || 0,
      success: true
    };
  } catch (error: any) {
    return {
      deletedCount: 0,
      success: false,
      error: error.message
    };
  }
}
