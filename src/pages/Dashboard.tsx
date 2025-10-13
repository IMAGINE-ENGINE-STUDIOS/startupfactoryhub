import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardNavigation from '@/components/DashboardNavigation';
import AIRoadmapWidget from '@/components/AIRoadmapWidget';
import ConnectionsWidget from '@/components/ConnectionsWidget';
import ResourcesWidget from '@/components/ResourcesWidget';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import NotificationCenter from '@/components/dashboard/NotificationCenter';
import AchievementsBadges from '@/components/dashboard/AchievementsBadges';
import StartupRoadmap from '@/components/StartupRoadmap';
import CompanyProfileManager from '@/components/CompanyProfileManager';
import RoleBasedMatching from '@/components/RoleBasedMatching';
import EducationalResources from '@/components/EducationalResources';
import InternshipBoard from '@/components/InternshipBoard';
import ProfessionalBackground from '@/components/ProfessionalBackground';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import AIAssistantPreview from '@/components/AIAssistantPreview';
import AIAssistantButton from '@/components/AIAssistantButton';
import FloatingChat from '@/components/FloatingChat';
import ShortsCarousel from '@/components/ShortsCarousel';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import companyLogo from '@/assets/company-logo.png';
import { 
  Rocket, 
  TrendingUp, 
  Calendar, 
  MessageSquare,
  Bell,
  Settings,
  Plus,
  Users,
  Target,
  Lightbulb,
  Building,
  BookOpen,
  Heart
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import GuestPrompt from '@/components/GuestPrompt';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const { profile: profileWithRole } = useProfileWithRole();
  const navigate = useNavigate();
  
  // Get current tab from URL params or default to feed (social)
  const urlParams = new URLSearchParams(window.location.search);
  const currentTab = urlParams.get('tab') || 'feed';

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const switchTab = (tab: string) => {
    const newUrl = `${window.location.pathname}?tab=${tab}`;
    window.history.pushState({}, '', newUrl);
    // Trigger a re-render by updating a state or use navigate
    navigate(`/dashboard?tab=${tab}`, { replace: true });
  };

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
                {profile?.full_name || 'Startup'} Dashboard
              </h1>
              <p className="text-muted-foreground">Build, connect, and grow your startup</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <NotificationCenter />
            <Button variant="hero" size="sm" onClick={() => switchTab('feed')} className="flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Share Update</span>
              <span className="sm:hidden">Share</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profile Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142</div>
              <p className="text-xs text-muted-foreground">+12 this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+3 new</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">67%</div>
              <p className="text-xs text-muted-foreground">Profile complete</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Features Section */}
        <div className="mb-6 sm:mb-8">
          <AIFeaturesHub />
        </div>


        {/* Tabbed Dashboard Content - Feed First */}
        <Tabs value={currentTab} onValueChange={switchTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex sm:grid w-auto sm:w-full grid-cols-4 sm:grid-cols-8 min-w-full sm:min-w-0">
              <TabsTrigger value="feed" className="whitespace-nowrap">
                <Heart className="w-4 h-4 mr-1 sm:mr-2" />
                Feed
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="whitespace-nowrap">
                <Target className="w-4 h-4 mr-1 sm:mr-2" />
                Journey
              </TabsTrigger>
              <TabsTrigger value="matching" className="whitespace-nowrap">
                <Users className="w-4 h-4 mr-1 sm:mr-2" />
                Connect
              </TabsTrigger>
              <TabsTrigger value="company" className="whitespace-nowrap">
                <Building className="w-4 h-4 mr-1 sm:mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="resources" className="whitespace-nowrap">
                <BookOpen className="w-4 h-4 mr-1 sm:mr-2" />
                Learn
              </TabsTrigger>
              <TabsTrigger value="network" className="whitespace-nowrap">
                <MessageSquare className="w-4 h-4 mr-1 sm:mr-2" />
                Network
              </TabsTrigger>
              <TabsTrigger value="analytics" className="whitespace-nowrap">
                <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="whitespace-nowrap">
                <Lightbulb className="w-4 h-4 mr-1 sm:mr-2" />
                Intelligence
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Social Feed - Main Focus */}
          <TabsContent value="feed" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Main Feed */}
              <div className="lg:col-span-2">
                <UnifiedCommunityFeed showCreatePost={true} />
              </div>
              
              {/* Sidebar */}
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
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <StartupRoadmap />
              </div>
              <div className="space-y-4 sm:space-y-6">
                <AIRoadmapWidget />
                <AIAssistantPreview />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="matching" className="space-y-4 sm:space-y-6">
            <RoleBasedMatching />
          </TabsContent>

          <TabsContent value="company" className="space-y-4 sm:space-y-6">
            <CompanyProfileManager />
          </TabsContent>

          <TabsContent value="resources" className="space-y-4 sm:space-y-6">
            <EducationalResources />
          </TabsContent>

          <TabsContent value="network" className="space-y-4 sm:space-y-6">
            <ConnectionsWidget />
            <ProfessionalBackground />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4 sm:space-y-6">
            <MarketIntelligenceWidget />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Buttons */}
      <AIAssistantButton />
      <FloatingChat />
    </div>
  );
};

export default Dashboard;