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
import ProgressFeed from '@/components/ProgressFeed';
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

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  
  // Get current tab from URL params or default to roadmap (journey)
  const urlParams = new URLSearchParams(window.location.search);
  const currentTab = urlParams.get('tab') || 'roadmap';

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, loading, navigate]);

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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <DashboardNavigation />
      
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Welcome back! 👋</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Here's what's happening with your startup today</p>
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
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Profile Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">142</div>
              <p className="text-xs text-muted-foreground hidden sm:block">+12% from last week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground hidden sm:block">3 new this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">8/12</div>
              <Progress value={67} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-ocean-primary">A+</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Excellent progress!</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Badges */}
        <div className="mb-6 sm:mb-8">
          <AchievementsBadges />
        </div>

        {/* Tabbed Dashboard Content */}
        <Tabs value={currentTab} onValueChange={switchTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex sm:grid w-auto sm:w-full grid-cols-3 sm:grid-cols-6 min-w-full sm:min-w-0 sm:max-w-2xl">
              <TabsTrigger value="roadmap" className="whitespace-nowrap">Journey</TabsTrigger>
              <TabsTrigger value="company" className="whitespace-nowrap">Profile</TabsTrigger>
              <TabsTrigger value="matching" className="whitespace-nowrap">Connect</TabsTrigger>
              <TabsTrigger value="resources" className="whitespace-nowrap">Learn</TabsTrigger>
              <TabsTrigger value="internships" className="whitespace-nowrap">Internships</TabsTrigger>
              <TabsTrigger value="network" className="whitespace-nowrap">Network</TabsTrigger>
            </TabsList>
          </div>

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

          <TabsContent value="company" className="space-y-4 sm:space-y-6">
            <CompanyProfileManager />
          </TabsContent>

          <TabsContent value="matching" className="space-y-4 sm:space-y-6">
            <RoleBasedMatching />
          </TabsContent>

          <TabsContent value="resources" className="space-y-4 sm:space-y-6">
            <EducationalResources />
          </TabsContent>

          <TabsContent value="internships" className="space-y-4 sm:space-y-6">
            <InternshipBoard />
          </TabsContent>

          <TabsContent value="network" className="space-y-4 sm:space-y-6">
            <ConnectionsWidget />
            <ProfessionalBackground />
          </TabsContent>
        </Tabs>

        {/* AI Features Section */}
        <div className="mt-6 sm:mt-8">
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