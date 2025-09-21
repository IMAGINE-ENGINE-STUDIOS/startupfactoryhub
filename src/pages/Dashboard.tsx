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
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome back! 👋</h1>
              <p className="text-muted-foreground mt-1">Here's what's happening with your startup today</p>
            </div>
            <div className="flex items-center space-x-3">
              <NotificationCenter />
              <Button variant="hero" size="sm" onClick={() => navigate('/feed')}>
                <Plus className="w-4 h-4 mr-2" />
                Share Update
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profile Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142</div>
              <p className="text-xs text-muted-foreground">+12% from last week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">3 new this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8/12</div>
              <Progress value={67} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-ocean-primary">A+</div>
              <p className="text-xs text-muted-foreground">Excellent progress!</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievement Badges */}
        <div className="mb-8">
          <AchievementsBadges />
        </div>

        {/* Tabbed Dashboard Content */}
        <Tabs value={currentTab} onValueChange={switchTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="roadmap">Journey</TabsTrigger>
            <TabsTrigger value="company">Profile</TabsTrigger>
            <TabsTrigger value="matching">Connect</TabsTrigger>
            <TabsTrigger value="resources">Learn</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>

          <TabsContent value="roadmap" className="space-y-6">
            <StartupRoadmap />
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <CompanyProfileManager />
          </TabsContent>

          <TabsContent value="matching" className="space-y-6">
            <RoleBasedMatching />
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <EducationalResources />
            <InternshipBoard />
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <ConnectionsWidget />
            <ProfessionalBackground />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;