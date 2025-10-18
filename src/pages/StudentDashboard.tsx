import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Trophy, Target, Star } from 'lucide-react';
import { DashboardHeader } from '@/components/DashboardHeader';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import UnifiedJobsBoard from '@/components/UnifiedJobsBoard';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import NetworkBrowser from '@/components/NetworkBrowser';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import EducationalResources from '@/components/EducationalResources';
import FloatingChat from '@/components/FloatingChat';

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const { user } = useAuth();
  const { profile: profileWithRole } = useProfileWithRole();

  useEffect(() => {
    if (user) {
      fetchStudentProfile();
      fetchEnrollments();
      fetchCertificates();
    }
  }, [user]);

  const fetchStudentProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setStudentProfile(data);
    }
  };

  const fetchEnrollments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        course:course_id (
          id,
          title,
          description,
          instructor_name,
          difficulty,
          category,
          duration_hours
        )
      `)
      .eq('student_id', user.id)
      .order('last_accessed_at', { ascending: false });

    if (!error && data) {
      setEnrollments(data);
    }
  };

  const fetchCertificates = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        course:course_id (
          title
        )
      `)
      .eq('student_id', user.id);

    if (!error && data) {
      setCertificates(data);
    }
  };

  const stats = [
    { 
      title: 'Courses Enrolled', 
      value: enrollments.length.toString(), 
      icon: BookOpen, 
      color: 'text-primary' 
    },
    { 
      title: 'Learning Streak', 
      value: `${studentProfile?.learning_streak_days || 0} days`, 
      icon: Target, 
      color: 'text-accent' 
    },
    { 
      title: 'Certificates', 
      value: certificates.length.toString(), 
      icon: Trophy, 
      color: 'text-yellow-500' 
    },
    { 
      title: 'Avg Progress', 
      value: enrollments.length > 0 
        ? `${Math.round(enrollments.reduce((acc, e) => acc + e.progress_percentage, 0) / enrollments.length)}%`
        : '0%', 
      icon: Star, 
      color: 'text-purple-500' 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero p-2 sm:p-4 pb-20 lg:pb-4 relative">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
          <RoleBasedAvatar 
            avatarUrl={profileWithRole?.avatar_url} 
            role="student"
            fallbackText={user?.email || 'S'}
            className="h-12 w-12 sm:h-16 sm:w-16"
          />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {profileWithRole?.full_name || 'Student'} Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Learn, practice, and build your startup skills</p>
          </div>
        </div>

        {/* Student Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="tech-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs Navigation */}
        <Tabs defaultValue="social" className="space-y-6">
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-8">
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="jobs">Opportunities</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="social" className="space-y-4">
            <UnifiedCommunityFeed />
          </TabsContent>

          <TabsContent value="learning" className="space-y-4">
            <EducationalResources />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <UnifiedJobsBoard />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4">
            <MarketIntelligenceWidget />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <AIFeaturesHub />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <UnifiedCalendar />
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <NetworkBrowser />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Chat with AI */}
      <FloatingChat />
    </div>
  );
}