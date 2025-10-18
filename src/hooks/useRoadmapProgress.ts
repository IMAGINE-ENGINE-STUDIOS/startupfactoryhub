import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RoadmapProgressData {
  completedSteps: number;
  totalSteps: number;
  percentage: number;
  loading: boolean;
}

export const useRoadmapProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<RoadmapProgressData>({
    completedSteps: 0,
    totalSteps: 6,
    percentage: 0,
    loading: true,
  });

  useEffect(() => {
    if (user) {
      fetchProgress();
      
      // Real-time subscription for progress updates
      const channel = supabase
        .channel('roadmap-progress-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'roadmap_progress',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchProgress();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchProgress = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('roadmap_progress')
      .select('step_id, completed')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching roadmap progress:', error);
      setProgress({
        completedSteps: 0,
        totalSteps: 6,
        percentage: 0,
        loading: false,
      });
      return;
    }

    // Default steps are IDs 1-6, custom steps start with 'custom-'
    const customSteps = data?.filter(step => step.step_id.startsWith('custom-')) || [];
    const totalSteps = 6 + customSteps.length;
    
    const completedSteps = data?.filter(step => step.completed).length || 0;
    const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    setProgress({
      completedSteps,
      totalSteps,
      percentage,
      loading: false,
    });
  };

  return progress;
};
