import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useFollow = (userId: string | null) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      checkFollowStatus();
      fetchCounts();
    }
  }, [userId, user]);

  const checkFollowStatus = async () => {
    if (!user || !userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    if (!userId) return;

    try {
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId),
      ]);

      setFollowersCount(followersRes.count || 0);
      setFollowingCount(followingRes.count || 0);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  };

  const followUser = async () => {
    if (!user || !userId) {
      toast.error('Please sign in to follow users');
      return;
    }

    if (user.id === userId) {
      toast.error("You can't follow yourself");
      return;
    }

    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId,
        });

      if (error) throw error;

      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
      toast.success('Successfully followed user');
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  const unfollowUser = async () => {
    if (!user || !userId) return;

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;

      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
      toast.success('Successfully unfollowed user');
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
    }
  };

  return {
    isFollowing,
    followersCount,
    followingCount,
    loading,
    followUser,
    unfollowUser,
  };
};
