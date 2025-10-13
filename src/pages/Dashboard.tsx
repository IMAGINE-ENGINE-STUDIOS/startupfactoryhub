import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardNavigation from '@/components/DashboardNavigation';
import ConnectionsWidget from '@/components/ConnectionsWidget';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import NotificationCenter from '@/components/dashboard/NotificationCenter';
import AchievementsBadges from '@/components/dashboard/AchievementsBadges';
import StartupRoadmap from '@/components/StartupRoadmap';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import AIAssistantButton from '@/components/AIAssistantButton';
import FloatingChat from '@/components/FloatingChat';
import StartupAIRecommendations from '@/components/StartupAIRecommendations';
import { 
  Plus,
  Users,
  Target,
  MessageSquare,
  TrendingUp
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import GuestPrompt from '@/components/GuestPrompt';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { useStartupAnalytics } from '@/hooks/useStartupAnalytics';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const { profile: profileWithRole } = useProfileWithRole();
  const analytics = useStartupAnalytics();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  if (loading || analytics.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Guest mode
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavigation />
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <GuestPrompt 
            feature="Full Dashboard"
            description="Create an account to access your personalized dashboard, track progress, connect with mentors, and more."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connect with Mentors</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Find Investors</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Join Community</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <DashboardNavigation />
      
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <RoleBasedAvatar 
              avatarUrl={profile?.avatar_url} 
              role={profileWithRole?.role || 'startup'}
              fallbackText={user?.email || 'U'}
              className="h-16 w-16"
            />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome, {profile?.full_name || 'Startup'}
              </h1>
              <p className="text-muted-foreground">Build, connect, and grow your startup</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <NotificationCenter />
            <Button variant="hero" size="sm" onClick={() => navigate('/feed')} className="flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Share Update</span>
              <span className="sm:hidden">Share</span>
            </Button>
          </div>
        </div>

        {/* Real Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profile Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.profileViews}</div>
              <p className="text-xs text-muted-foreground">Estimated views</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.connections}</div>
              <p className="text-xs text-muted-foreground">Active connections</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{analytics.progress}%</div>
              <p className="text-xs text-muted-foreground">Profile & roadmap</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.engagement}%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <UnifiedCommunityFeed showCreatePost={true} />
          </div>
          
          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/dashboard?tab=matching')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Find Mentors
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/explore')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Browse Investors
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/messages')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/dashboard?tab=roadmap')}
                >
                  <Target className="h-4 w-4 mr-2" />
                  View Roadmap
                </Button>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <StartupAIRecommendations />

            {/* Roadmap Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <StartupRoadmap />
              </CardContent>
            </Card>

            {/* Achievement Badges */}
            <AchievementsBadges />
          </div>
        </div>

        {/* AI Features Hub at Bottom */}
        <div className="mt-8">
          <AIFeaturesHub />
        </div>
      </div>

      {/* Floating Buttons */}
      <AIAssistantButton />
      <FloatingChat />
    </div>
  );
};

export default Dashboard;
