import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building, Calendar as CalendarIcon, MessageCircle, Network,
  Briefcase, GraduationCap, Brain, Wrench, Globe, BarChart, Presentation,
} from 'lucide-react';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import FloatingChat from '@/components/FloatingChat';
import MatchingSystem from '@/components/MatchingSystem';
import EducationalResources from '@/components/EducationalResources';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { IntelligenceHub } from '@/components/intelligence/IntelligenceHub';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import UnifiedJobsBoard from '@/components/UnifiedJobsBoard';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import DistrictRooms from '@/components/DistrictRooms';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { DashboardHeader } from '@/components/DashboardHeader';
import MemberStartupsTab from '@/components/member/MemberStartupsTab';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';

const MemberDashboard = () => {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { profile: profileWithRole } = useProfileWithRole();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || 'social');

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
      setSearchParams({});
    }
  }, [urlTab, activeTab, setSearchParams]);

  // Redirect if wrong role
  useEffect(() => {
    if (!roleLoading && role && role !== 'member') {
      navigate('/dashboard');
    }
  }, [role, roleLoading, navigate]);

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

  return (
    <div className="min-h-screen bg-background pb-6 relative overflow-x-hidden">
      <DashboardHeader />

      <div className="container mx-auto px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 pb-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="md:hidden flex justify-start mb-4">
            <RoleBasedAvatar
              avatarUrl={profileWithRole?.avatar_url}
              role={profileWithRole?.role || 'member' as any}
              fallbackText={user?.email || 'U'}
              className="h-16 w-16"
            />
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <RoleBasedAvatar
              avatarUrl={profileWithRole?.avatar_url}
              role={profileWithRole?.role || 'member' as any}
              fallbackText={user?.email || 'U'}
              className="h-16 w-16"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate">
                Welcome, {profileWithRole?.full_name || 'Member'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Connect, collaborate, and join startup teams
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto scrollbar-thin -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="flex w-full whitespace-nowrap tech-card border-0 p-1.5 sm:p-1 gap-1 h-auto">
              <TabsTrigger value="social" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.social')}</span>
              </TabsTrigger>
              <TabsTrigger value="startups" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Building className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">My Startups</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Globe className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.resources')}</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Wrench className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.tools')}</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Network className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.network')}</span>
              </TabsTrigger>
              <TabsTrigger value="learn" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <GraduationCap className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.learn')}</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <CalendarIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.calendar')}</span>
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Brain className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.intelligence')}</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex-1 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Briefcase className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">{t('nav.jobs')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {activeTab === 'social' && (
            <TabsContent value="social" className="space-y-4">
              <UnifiedCommunityFeed showCreatePost={true} interstitialContent={<DistrictRooms />} interstitialAfterIndex={3} />
            </TabsContent>
          )}

          {activeTab === 'startups' && (
            <TabsContent value="startups" className="space-y-4">
              <MemberStartupsTab />
            </TabsContent>
          )}

          {activeTab === 'resources' && (
            <TabsContent value="resources" className="space-y-4">
              <GlobalResourcesMap />
            </TabsContent>
          )}

          {activeTab === 'tools' && (
            <TabsContent value="tools" className="space-y-4">
              <AIFeaturesHub />
            </TabsContent>
          )}

          {activeTab === 'network' && (
            <TabsContent value="network" className="space-y-4">
              <MatchingSystem />
            </TabsContent>
          )}

          {activeTab === 'learn' && (
            <TabsContent value="learn" className="space-y-4">
              <EducationalResources />
            </TabsContent>
          )}

          {activeTab === 'calendar' && (
            <TabsContent value="calendar" className="space-y-4">
              <UnifiedCalendar />
            </TabsContent>
          )}

          {activeTab === 'intelligence' && (
            <TabsContent value="intelligence" className="space-y-4">
              <IntelligenceHub />
            </TabsContent>
          )}

          {activeTab === 'jobs' && (
            <TabsContent value="jobs" className="space-y-4">
              <UnifiedJobsBoard />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <FloatingChat />
    </div>
  );
};

export default MemberDashboard;
