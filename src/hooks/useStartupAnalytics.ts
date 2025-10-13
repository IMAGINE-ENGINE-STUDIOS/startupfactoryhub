import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  profileViews: number;
  connections: number;
  progress: number;
  engagement: number;
  loading: boolean;
}

export const useStartupAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    profileViews: 0,
    connections: 0,
    progress: 0,
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

      // Fetch profile data to calculate completeness
      const profileQuery = await supabase
        .from('profiles')
        .select('full_name, bio, location, website, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      const profileData = profileQuery.data;

      // Fetch company data
      const companyQuery = await supabase
        .from('companies')
        .select('name, description, industry, stage, logo_url')
        .eq('user_id', user.id)
        .maybeSingle();

      const companyData = companyQuery.data;

      // Fetch roadmap progress
      const roadmapQuery = await supabase
        .from('roadmap_progress')
        .select('completed')
        .eq('user_id', user.id);

      const roadmapData = roadmapQuery.data;

      const completedSteps = roadmapData?.filter(step => step.completed).length || 0;
      const totalSteps = roadmapData?.length || 0;

      // Calculate profile completeness (40%)
      let profileScore = 0;
      if (profileData) {
        if (profileData.full_name) profileScore += 8;
        if (profileData.bio) profileScore += 8;
        if (profileData.location) profileScore += 8;
        if (profileData.website) profileScore += 8;
        if (profileData.avatar_url) profileScore += 8;
      }

      // Calculate company completeness (30%)
      let companyScore = 0;
      if (companyData) {
        if (companyData.name) companyScore += 6;
        if (companyData.description) companyScore += 6;
        if (companyData.industry) companyScore += 6;
        if (companyData.stage) companyScore += 6;
        if (companyData.logo_url) companyScore += 6;
      }

      // Calculate roadmap progress (30%)
      const roadmapScore = totalSteps > 0 ? (completedSteps / totalSteps) * 30 : 0;

      const totalProgress = Math.round(profileScore + companyScore + roadmapScore);

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

      const postsCount = postsQuery.count || 0;
      const commentsCount = commentsQuery.count || 0;
      const likesCount = likesQuery.count || 0;

      // Calculate engagement score
      const totalActivity = postsCount * 4 + commentsCount * 2 + likesCount;
      const engagementScore = Math.min(Math.round((totalActivity / 64) * 100), 100);

      const profileViews = Math.round(connectionsCount * 6 + totalActivity * 2);

      setAnalytics({
        profileViews,
        connections: connectionsCount,
        progress: totalProgress,
        engagement: engagementScore,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics({
        profileViews: 0,
        connections: 0,
        progress: 0,
        engagement: 0,
        loading: false,
      });
    }
  };

  return analytics;
};
