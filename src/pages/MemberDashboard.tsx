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
import JobsSection from '@/components/JobsSection';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import DistrictRooms from '@/components/DistrictRooms';

import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardTabsNav } from '@/components/DashboardTabsNav';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <DashboardTabsNav
            items={[
              { value: 'social', icon: MessageCircle, label: t('nav.social') },
              { value: 'startups', icon: Building, label: 'My Startups' },
              { value: 'resources', icon: Globe, label: t('nav.resources') },
              { value: 'tools', icon: Wrench, label: t('nav.tools') },
              { value: 'network', icon: Network, label: t('nav.network') },
              { value: 'learn', icon: GraduationCap, label: t('nav.learn') },
              { value: 'intelligence', icon: Brain, label: t('nav.intelligence') },
              { value: 'jobs', icon: Briefcase, label: t('nav.jobs') },
            ]}
          />


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
              <UnifiedCalendar userRole="member" />
            </TabsContent>
          )}

          {activeTab === 'intelligence' && (
            <TabsContent value="intelligence" className="space-y-4">
              <IntelligenceHub />
            </TabsContent>
          )}

          {activeTab === 'jobs' && (
            <TabsContent value="jobs" className="space-y-4">
              <JobsSection />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <FloatingChat />
    </div>
  );
};

export default MemberDashboard;
