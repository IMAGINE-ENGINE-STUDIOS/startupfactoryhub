import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useProfileViews = (viewedProfileId: string | null) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!viewedProfileId) return;

    const trackView = async () => {
      try {
        // Don't track if viewing own profile
        if (user?.id === viewedProfileId) return;

        await supabase.from('profile_views').insert({
          viewer_id: user?.id || null,
          viewed_profile_id: viewedProfileId,
        });
      } catch (error) {
        console.error('Error tracking profile view:', error);
      }
    };

    trackView();
  }, [viewedProfileId, user]);
};
