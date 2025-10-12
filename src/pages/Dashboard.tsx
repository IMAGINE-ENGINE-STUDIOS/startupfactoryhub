import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardNavigation from '@/components/DashboardNavigation';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import AchievementsBadges from '@/components/dashboard/AchievementsBadges';
import AIAssistantPreview from '@/components/AIAssistantPreview';
import AIAssistantButton from '@/components/AIAssistantButton';
import FloatingChat from '@/components/FloatingChat';
import ShortsCarousel from '@/components/ShortsCarousel';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import GuestPrompt from '@/components/GuestPrompt';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
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

  if (loading) {
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
                <CardDescription>Get guidance from experienced entrepreneurs</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Find Investors</CardTitle>
                <CardDescription>Pitch your startup to potential investors</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Join Community</CardTitle>
                <CardDescription>Network with other founders and students</CardDescription>
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
        {/* Welcome Header - Social Media Style */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Feed</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Connect, share, and grow with the community</p>
            </div>
          </div>
        </div>

        {/* Main Feed Layout - Social Media Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Feed - Full Screen Experience */}
          <div className="lg:col-span-2">
            <UnifiedCommunityFeed showCreatePost={true} />
          </div>
          
          {/* Sidebar - Quick Access */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Profile Views</span>
                  <span className="font-bold">142</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Connections</span>
                  <span className="font-bold">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="font-bold">67%</span>
                </div>
              </CardContent>
            </Card>

            {/* Achievement Badges */}
            <AchievementsBadges />
            
            {/* Shorts Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Trending Shorts</CardTitle>
              </CardHeader>
              <CardContent>
                <ShortsCarousel onCreateShort={() => navigate('/feed')} />
              </CardContent>
            </Card>

            {/* AI Assistant Preview */}
            <AIAssistantPreview />
          </div>
        </div>
      </div>

      {/* Floating Buttons */}
      <AIAssistantButton />
      <FloatingChat />
    </div>
  );
};

export default Dashboard;