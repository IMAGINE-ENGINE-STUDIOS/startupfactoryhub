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

    if (!/^[0-9a-f-]{36}$/i.test(userId)) {
      toast.error('This profile can’t be followed');
      return;
    }

    try {
      // Upsert so a repeat click (or stale state) never hits the unique constraint
      const { error } = await supabase
        .from('follows')
        .upsert(
          { follower_id: user.id, following_id: userId },
          { onConflict: 'follower_id,following_id', ignoreDuplicates: true },
        );

      if (error) throw error;

      if (!isFollowing) setFollowersCount(prev => prev + 1);
      setIsFollowing(true);
      toast.success('Following');
    } catch (error: any) {
      console.error('Error following user:', error);
      toast.error(error?.message ? `Couldn't follow: ${error.message}` : 'Failed to follow user');
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
