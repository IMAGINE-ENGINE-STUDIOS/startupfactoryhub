import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useCourseCompletion = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCompletedCourses();
    }
  }, [user]);

  const fetchCompletedCourses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('course_completions')
        .select('course_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setCompletedCourses(new Set(data.map(c => c.course_id)));
    } catch (error) {
      console.error('Error fetching completed courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = (courseId: string) => {
    return completedCourses.has(courseId);
  };

  const markCourseComplete = async (courseId: string, courseTitle: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to earn points for completing courses.",
        variant: "destructive",
      });
      return false;
    }

    if (completedCourses.has(courseId)) {
      toast({
        title: "Already completed",
        description: "You've already earned points for this course!",
      });
      return false;
    }

    try {
      // Insert course completion
      const { error: completionError } = await supabase
        .from('course_completions')
        .insert({
          user_id: user.id,
          course_id: courseId,
          points_earned: 50,
        });

      if (completionError) throw completionError;

      // Update leaderboard points
      const { data: existingEntry } = await supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingEntry) {
        await supabase
          .from('leaderboard_entries')
          .update({
            points: existingEntry.points + 50,
            courses_completed: existingEntry.courses_completed + 1,
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('leaderboard_entries')
          .insert({
            user_id: user.id,
            points: 50,
            courses_completed: 1,
          });
      }

      // Update local state
      setCompletedCourses(prev => new Set([...prev, courseId]));

      // Show success message
      toast({
        title: "🎉 Course completed!",
        description: `+50 points earned for completing "${courseTitle}"`,
      });

      return true;
    } catch (error) {
      console.error('Error marking course complete:', error);
      toast({
        title: "Error",
        description: "Failed to award points. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getStats = async () => {
    if (!user) return { totalCompleted: 0, totalPoints: 0 };

    try {
      const { data, error } = await supabase
        .from('course_completions')
        .select('points_earned')
        .eq('user_id', user.id);

      if (error) throw error;

      return {
        totalCompleted: data.length,
        totalPoints: data.reduce((sum, c) => sum + c.points_earned, 0),
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return { totalCompleted: 0, totalPoints: 0 };
    }
  };

  return {
    isCompleted,
    markCourseComplete,
    getStats,
    completedCourses,
    loading,
  };
};
