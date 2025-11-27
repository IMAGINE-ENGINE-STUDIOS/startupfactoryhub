import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TimeSeriesData {
  period: string;
  posts: number;
  comments: number;
  likes: number;
  profileViews: number;
  newFollowers: number;
  newConnections: number;
}

interface EngagementReceived {
  likesReceived: number;
  commentsReceived: number;
  sharesReceived: number;
}

interface AnalyticsData {
  profileViews: number;
  connections: number;
  followers: number;
  following: number;
  posts: number;
  comments: number;
  likes: number;
  engagement: number;
  loading: boolean;
  historicalData: TimeSeriesData[];
  engagementReceived: EngagementReceived;
}

export const useStartupAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    profileViews: 0,
    connections: 0,
    followers: 0,
    following: 0,
    posts: 0,
    comments: 0,
    likes: 0,
    engagement: 0,
    loading: true,
    historicalData: [],
    engagementReceived: {
      likesReceived: 0,
      commentsReceived: 0,
      sharesReceived: 0,
    },
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
        .eq('user_id', user.id)
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

      // Fetch historical data (last 6 weeks)
      const sixWeeksAgo = new Date();
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
      const isoDate = sixWeeksAgo.toISOString();

      // Simplified queries to avoid TypeScript deep instantiation errors
      const postsHistResult = await supabase
        .from('feed_posts')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', isoDate);
      const postsHist = postsHistResult.data || [];
      
      const commentsHistResult: any = await supabase
        .from('post_comments' as any)
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', isoDate);
      const commentsHist = commentsHistResult?.data || [];
      
      const likesHistResult: any = await supabase
        .from('post_likes' as any)
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', isoDate);
      const likesHist = likesHistResult?.data || [];
      
      const profileViewsHistResult = await supabase
        .from('profile_views')
        .select('created_at')
        .eq('viewed_profile_id', user.id)
        .gte('created_at', isoDate);
      const profileViewsHist = profileViewsHistResult.data || [];
      
      const followersHistResult = await supabase
        .from('follows')
        .select('created_at')
        .eq('following_id', user.id)
        .gte('created_at', isoDate);
      const followersHist = followersHistResult.data || [];
      
      const connectionsHistResult = await supabase
        .from('connections')
        .select('created_at')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .gte('created_at', isoDate);
      const connectionsHist = connectionsHistResult.data || [];

      // Group by week
      const groupByWeek = (items: any[]) => {
        const weeks = Array(6).fill(0);
        items?.forEach((item) => {
          const date = new Date(item.created_at);
          const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
          const weekIndex = Math.min(Math.floor(daysDiff / 7), 5);
          weeks[5 - weekIndex]++;
        });
        return weeks;
      };

      const postsWeeks = groupByWeek(postsHist);
      const commentsWeeks = groupByWeek(commentsHist);
      const likesWeeks = groupByWeek(likesHist);
      const profileViewsWeeks = groupByWeek(profileViewsHist);
      const followersWeeks = groupByWeek(followersHist);
      const connectionsWeeks = groupByWeek(connectionsHist);

      const historicalData: TimeSeriesData[] = Array(6).fill(0).map((_, i) => ({
        period: `Week ${i + 1}`,
        posts: postsWeeks[i],
        comments: commentsWeeks[i],
        likes: likesWeeks[i],
        profileViews: profileViewsWeeks[i],
        newFollowers: followersWeeks[i],
        newConnections: connectionsWeeks[i],
      }));

      // Fetch engagement received (likes/comments on user's posts)
      const userPostsQuery = await supabase.from('feed_posts').select('id').eq('user_id', user.id);
      const postIds = userPostsQuery.data?.map(p => p.id) || [];

      let likesReceivedCount = 0;
      let commentsReceivedCount = 0;
      let sharesReceivedCount = 0;

      if (postIds.length > 0) {
        const likesRecQuery = await (supabase as any).from('post_likes').select('*', { count: 'exact', head: true }).in('post_id', postIds);
        const commentsRecQuery = await (supabase as any).from('post_comments').select('*', { count: 'exact', head: true }).in('post_id', postIds);
        const sharesRecQuery = await supabase.from('feed_posts').select('*', { count: 'exact', head: true }).in('shared_post_id', postIds);

        likesReceivedCount = likesRecQuery.count || 0;
        commentsReceivedCount = commentsRecQuery.count || 0;
        sharesReceivedCount = sharesRecQuery.count || 0;
      }

      setAnalytics({
        profileViews: calculatedViews,
        connections: connectionsCount,
        followers: followersCount,
        following: followingCount,
        posts: postsCount,
        comments: commentsCount,
        likes: likesCount,
        engagement: engagementScore,
        loading: false,
        historicalData,
        engagementReceived: {
          likesReceived: likesReceivedCount,
          commentsReceived: commentsReceivedCount,
          sharesReceived: sharesReceivedCount,
        },
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics({
        profileViews: 0,
        connections: 0,
        followers: 0,
        following: 0,
        posts: 0,
        comments: 0,
        likes: 0,
        engagement: 0,
        loading: false,
        historicalData: [],
        engagementReceived: {
          likesReceived: 0,
          commentsReceived: 0,
          sharesReceived: 0,
        },
      });
    }
  };

  return analytics;
};
