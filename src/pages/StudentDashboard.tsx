import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Trophy, Target, Star } from 'lucide-react';
import DashboardNavigation from '@/components/DashboardNavigation';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import AchievementsBadges from '@/components/dashboard/AchievementsBadges';
import AIAssistantPreview from '@/components/AIAssistantPreview';
import AIAssistantButton from '@/components/AIAssistantButton';
import FloatingChat from '@/components/FloatingChat';
import ShortsCarousel from '@/components/ShortsCarousel';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

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
      .select('*, course:course_id (id, title)')
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
      .select('*, course:course_id (title)')
      .eq('student_id', user.id);

    if (!error && data) {
      setCertificates(data);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <DashboardNavigation />
      
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Welcome Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Student Feed</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Learn, share, and connect with the startup community
          </p>
        </div>

        {/* Main Feed Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <UnifiedCommunityFeed showCreatePost={true} />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Learning Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Learning Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Courses Enrolled</span>
                  </div>
                  <span className="font-bold">{enrollments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-accent" />
                    <span className="text-sm text-muted-foreground">Learning Streak</span>
                  </div>
                  <span className="font-bold">{studentProfile?.learning_streak_days || 0} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Certificates</span>
                  </div>
                  <span className="font-bold">{certificates.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Avg Progress</span>
                  </div>
                  <span className="font-bold">
                    {enrollments.length > 0 
                      ? `${Math.round(enrollments.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / enrollments.length)}%`
                      : '0%'}
                  </span>
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
}
