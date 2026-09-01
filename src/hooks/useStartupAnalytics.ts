import { useState, useEffect, useRef } from 'react';
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
  refreshing: boolean;
  historicalData: TimeSeriesData[];
  engagementReceived: EngagementReceived;
}

export type AnalyticsRange = '7D' | '30D' | '90D' | 'All';

const RANGE_CONFIG: Record<AnalyticsRange, { days: number; buckets: number; label: (i: number, bucketDays: number) => string }> = {
  '7D': { days: 7, buckets: 7, label: (i) => `D${i + 1}` },
  '30D': { days: 30, buckets: 6, label: (i) => `W${i + 1}` },
  '90D': { days: 90, buckets: 6, label: (i) => `P${i + 1}` },
  All: { days: 365, buckets: 6, label: (i) => `M${i + 1}` },
};

export const useStartupAnalytics = (range: AnalyticsRange = '30D') => {
  const { user } = useAuth();
  const cfg = RANGE_CONFIG[range];
  const cacheRef = useRef<Record<string, AnalyticsData>>({});
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
    refreshing: false,
    historicalData: [],
    engagementReceived: {
      likesReceived: 0,
      commentsReceived: 0,
      sharesReceived: 0,
    },
  });

  useEffect(() => {
    if (!user) return;
    const cached = cacheRef.current[`${user.id}:${range}`];
    if (cached) {
      // Instant paint from cache, then refresh silently in the background
      setAnalytics({ ...cached, loading: false, refreshing: true });
    } else {
      setAnalytics(prev => ({ ...prev, loading: !prev.historicalData.length, refreshing: true }));
    }
    fetchAnalytics();
  }, [user, range]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      const rangeStartDate = new Date();
      rangeStartDate.setDate(rangeStartDate.getDate() - cfg.days);
      const rangeIso = rangeStartDate.toISOString();

      const [
        connectionsQuery,
        followersQuery,
        followingQuery,
        postsQuery,
        commentsQuery,
        likesQuery,
        profileViewsQuery,
      ] = await Promise.all([
        supabase
          .from('connections')
          .select('*', { count: 'exact', head: true })
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq('status', 'accepted'),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
        (supabase as any)
          .from('feed_posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', rangeIso),
        (supabase as any)
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', rangeIso),
        (supabase as any)
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', rangeIso),
        supabase
          .from('profile_views')
          .select('*', { count: 'exact', head: true })
          .eq('viewed_profile_id', user.id)
          .gte('created_at', rangeIso),
      ]);

      const connectionsCount = connectionsQuery.count || 0;
      const followersCount = followersQuery.count || 0;
      const followingCount = followingQuery.count || 0;
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

      // Fetch historical data across the selected range
      const rangeStart = new Date();
      rangeStart.setDate(rangeStart.getDate() - cfg.days);
      const isoDate = rangeStart.toISOString();
      const bucketDays = cfg.days / cfg.buckets;

      const [
        postsHistResult,
        commentsHistResult,
        likesHistResult,
        profileViewsHistResult,
        followersHistResult,
        connectionsHistResult,
      ] = await Promise.all([
        supabase.from('feed_posts').select('created_at').eq('user_id', user.id).gte('created_at', isoDate),
        (supabase as any).from('post_comments').select('created_at').eq('user_id', user.id).gte('created_at', isoDate),
        (supabase as any).from('post_likes').select('created_at').eq('user_id', user.id).gte('created_at', isoDate),
        supabase.from('profile_views').select('created_at').eq('viewed_profile_id', user.id).gte('created_at', isoDate),
        supabase.from('follows').select('created_at').eq('following_id', user.id).gte('created_at', isoDate),
        supabase
          .from('connections')
          .select('created_at')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq('status', 'accepted')
          .gte('created_at', isoDate),
      ]);
      const postsHist = postsHistResult.data || [];
      const commentsHist = (commentsHistResult as any)?.data || [];
      const likesHist = (likesHistResult as any)?.data || [];
      const profileViewsHist = profileViewsHistResult.data || [];
      const followersHist = followersHistResult.data || [];
      const connectionsHist = connectionsHistResult.data || [];

      // Group into buckets for the selected range
      const groupByWeek = (items: any[]) => {
        const buckets = Array(cfg.buckets).fill(0);
        items?.forEach((item) => {
          const date = new Date(item.created_at);
          const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff < 0 || daysDiff > cfg.days) return;
          const idx = Math.min(Math.floor(daysDiff / bucketDays), cfg.buckets - 1);
          buckets[cfg.buckets - 1 - idx]++;
        });
        return buckets;
      };

      const postsWeeks = groupByWeek(postsHist);
      const commentsWeeks = groupByWeek(commentsHist);
      const likesWeeks = groupByWeek(likesHist);
      const profileViewsWeeks = groupByWeek(profileViewsHist);
      const followersWeeks = groupByWeek(followersHist);
      const connectionsWeeks = groupByWeek(connectionsHist);

      const historicalData: TimeSeriesData[] = Array(cfg.buckets).fill(0).map((_, i) => ({
        period: cfg.label(i, bucketDays),
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

      const next: AnalyticsData = {
        profileViews: calculatedViews,
        connections: connectionsCount,
        followers: followersCount,
        following: followingCount,
        posts: postsCount,
        comments: commentsCount,
        likes: likesCount,
        engagement: engagementScore,
        loading: false,
        refreshing: false,
        historicalData,
        engagementReceived: {
          likesReceived: likesReceivedCount,
          commentsReceived: commentsReceivedCount,
          sharesReceived: sharesReceivedCount,
        },
      };
      cacheRef.current[`${user.id}:${range}`] = next;
      setAnalytics(next);
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
        refreshing: false,
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
