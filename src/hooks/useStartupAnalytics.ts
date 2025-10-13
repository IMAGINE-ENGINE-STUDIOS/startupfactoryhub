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
      const { count: connectionsCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      

      // Fetch profile data to calculate completeness
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, bio, location, website, avatar_url')
        .eq('user_id', user.id)
        .single();

      // Fetch company data
      const { data: companyData } = await supabase
        .from('companies')
        .select('name, description, industry, stage, logo_url')
        .eq('user_id', user.id)
        .single();

      // Fetch roadmap progress
      const { data: roadmapData } = await supabase
        .from('roadmap_progress')
        .select('completed')
        .eq('user_id', user.id);

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

      const { data: postsData } = await supabase
        .from('feed_posts')
        .select('id')
        .eq('author_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: commentsData } = await supabase
        .from('post_comments')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: likesData } = await supabase
        .from('post_likes')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const postsCount = postsData?.length || 0;
      const commentsCount = commentsData?.length || 0;
      const likesCount = likesData?.length || 0;

      // Calculate engagement score
      const totalActivity = postsCount * 4 + commentsCount * 2 + likesCount;
      const engagementScore = Math.min(Math.round((totalActivity / 64) * 100), 100);

      const profileViews = Math.round((connectionsCount || 0) * 6 + totalActivity * 2);

      setAnalytics({
        profileViews,
        connections: connectionsCount || 0,
        progress: totalProgress,
        engagement: engagementScore,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(prev => ({ ...prev, loading: false }));
    }
  };

  return analytics;
};
