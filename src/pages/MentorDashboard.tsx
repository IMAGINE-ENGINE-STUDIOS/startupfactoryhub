import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Calendar, Award, Star } from 'lucide-react';
import DashboardNavigation from '@/components/DashboardNavigation';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import AchievementsBadges from '@/components/dashboard/AchievementsBadges';
import AIAssistantPreview from '@/components/AIAssistantPreview';
import AIAssistantButton from '@/components/AIAssistantButton';
import FloatingChat from '@/components/FloatingChat';
import ShortsCarousel from '@/components/ShortsCarousel';
import { useNavigate } from 'react-router-dom';

export default function MentorDashboard() {
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [activeMentorships, setActiveMentorships] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchMentorProfile();
      fetchActiveMentorships();
    }
  }, [user]);

  const fetchMentorProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mentor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setMentorProfile(data);
    }
  };

  const fetchActiveMentorships = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mentorship_relationships')
      .select('*')
      .eq('mentor_id', user.id)
      .eq('status', 'active');

    if (!error && data) {
      setActiveMentorships(data);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <DashboardNavigation />
      
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Welcome Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mentor Feed</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Share insights and guide the next generation
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
            {/* Mentorship Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mentorship Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Active Mentees</span>
                  </div>
                  <span className="font-bold">{activeMentorships.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    <span className="text-sm text-muted-foreground">Total Sessions</span>
                  </div>
                  <span className="font-bold">{mentorProfile?.total_sessions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Success Stories</span>
                  </div>
                  <span className="font-bold">
                    {mentorProfile?.success_stories?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Impact Score</span>
                  </div>
                  <span className="font-bold">
                    {mentorProfile?.average_rating ? (mentorProfile.average_rating * 20).toFixed(0) : '0'}
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
