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
import NotificationCenter from '@/components/dashboard/NotificationCenter';
import AchievementsBadges from '@/components/dashboard/AchievementsBadges';
import StartupRoadmap from '@/components/StartupRoadmap';
import CompanyProfileManager from '@/components/CompanyProfileManager';
import MatchingSystem from '@/components/MatchingSystem';
import EducationalResources from '@/components/EducationalResources';
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
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="matching">Matching</TabsTrigger>
            <TabsTrigger value="resources">Learn</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* AI Roadmap */}
                <AIRoadmapWidget />

                {/* Progress Feed */}
                <ProgressFeed />
              </div>

              {/* Right Column - Widgets */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/dashboard?tab=matching')}>
                      <Users className="w-4 h-4 mr-2" />
                      Find Mentors
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/dashboard?tab=resources')}>
                      <Target className="w-4 h-4 mr-2" />
                      Browse Resources
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Join Events
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/feed')}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Community Feed
                    </Button>
                  </CardContent>
                </Card>

                {/* Recommended Connections */}
                <ConnectionsWidget />

                {/* Suggested Resources */}
                <ResourcesWidget />

                {/* Upcoming Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-ocean-primary" />
                      Upcoming Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="border-l-4 border-ocean-primary pl-4 py-2">
                      <h4 className="font-medium">FinTech Founder Meetup</h4>
                      <p className="text-sm text-muted-foreground">Tomorrow, 6:00 PM</p>
                      <Badge variant="secondary" className="mt-1">Virtual</Badge>
                    </div>
                    <div className="border-l-4 border-accent pl-4 py-2">
                      <h4 className="font-medium">Investor Pitch Workshop</h4>
                      <p className="text-sm text-muted-foreground">Friday, 2:00 PM</p>
                      <Badge variant="secondary" className="mt-1">NYC</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      View All Events
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-6">
            <StartupRoadmap />
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <CompanyProfileManager />
          </TabsContent>

          <TabsContent value="matching" className="space-y-6">
            <MatchingSystem />
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <EducationalResources />
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <ConnectionsWidget />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;