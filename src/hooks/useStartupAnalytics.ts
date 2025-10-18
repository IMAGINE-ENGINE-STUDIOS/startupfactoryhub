import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  profileViews: number;
  connections: number;
  followers: number;
  engagement: number;
  loading: boolean;
}

export const useStartupAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    profileViews: 0,
    connections: 0,
    followers: 0,
    engagement: 0,
    loading: true,
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      // Fetch real connections count
      const connectionsQuery = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');
      
      const connectionsCount = connectionsQuery.count || 0;

      // Fetch followers count
      const followersQuery = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);
      
      const followersCount = followersQuery.count || 0;

      // Fetch following count
      const followingQuery = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);
      
      const followingCount = followingQuery.count || 0;

      // Fetch engagement data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const postsQuery = await (supabase as any)
        .from('feed_posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const commentsQuery = await (supabase as any)
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const likesQuery = await (supabase as any)
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Fetch profile views (last 30 days)
      const profileViewsQuery = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('viewed_profile_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const postsCount = postsQuery.count || 0;
      const commentsCount = commentsQuery.count || 0;
      const likesCount = likesQuery.count || 0;
      const profileViewsCount = profileViewsQuery.count || 0;

      // Calculate engagement score including follower interactions
      const totalActivity = postsCount * 4 + commentsCount * 2 + likesCount + followersCount;
      const engagementScore = Math.min(Math.round((totalActivity / 100) * 100), 100);

      // Calculate profile views with enhanced formula
      const calculatedViews = Math.round(
        connectionsCount * 6 + 
        totalActivity * 2 + 
        followersCount * 3 + 
        profileViewsCount
      );

      setAnalytics({
        profileViews: calculatedViews,
        connections: connectionsCount,
        followers: followersCount,
        engagement: engagementScore,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics({
        profileViews: 0,
        connections: 0,
        followers: 0,
        engagement: 0,
        loading: false,
      });
    }
  };

  return analytics;
};
