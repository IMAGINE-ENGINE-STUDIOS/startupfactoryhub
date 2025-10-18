import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
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
import StudentProfileView from '@/components/StudentProfileView';
import FloatingChat from '@/components/FloatingChat';
import { BookOpen } from 'lucide-react';

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

        {/* Main Tabs Navigation */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-10">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="jobs">Opportunities</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <Card className="tech-card border-0">
              <CardContent className="p-8 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <BookOpen className="h-16 w-16 text-primary mx-auto" />
                  <h2 className="text-2xl font-bold">Welcome to Your Student Dashboard</h2>
                  <p className="text-muted-foreground">
                    Your personalized learning hub. Navigate through the tabs to explore courses, 
                    connect with mentors, find opportunities, and track your progress.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <StudentProfileView />
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <UnifiedCommunityFeed />
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <NetworkBrowser />
          </TabsContent>

          <TabsContent value="learning" className="space-y-4">
            <EducationalResources />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <UnifiedJobsBoard />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <UnifiedCalendar />
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
        </Tabs>
      </div>

      {/* Floating Chat with AI */}
      <FloatingChat />
    </div>
  );
}