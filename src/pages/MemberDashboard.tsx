import { useRememberedTab } from '@/lib/tabMemory';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building, Calendar as CalendarIcon, MessageCircle, Network,
  Briefcase, GraduationCap, Brain, Wrench, Globe, BarChart, Presentation,
  FileText, Bot,
} from 'lucide-react';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import SFHCallAgents from '@/components/call-agents/SFHCallAgents';
import { LightPaperWorkspace } from '@/components/lightpaper/LightPaperWorkspace';
import BookingsList from '@/components/BookingsList';
import MVPReferralCard from '@/components/referral/MVPReferralCard';
import FloatingChat from '@/components/FloatingChat';
import MatchingSystem from '@/components/MatchingSystem';
import MeetingsHubHeader from '@/components/MeetingsHubHeader';
import LiveRooms from '@/components/LiveRooms';
import { Video } from 'lucide-react';
import EducationalResources from '@/components/EducationalResources';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { IntelligenceHub } from '@/components/intelligence/IntelligenceHub';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import JobsSection from '@/components/JobsSection';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
import InvestorCommunity from '@/components/InvestorCommunity';

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
  const [activeTab, setActiveTab] = useRememberedTab('member', urlTab, 'social');

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
      setSearchParams({});
    }
  }, [urlTab, activeTab, setSearchParams]);

  // Redirect if wrong role
  useEffect(() => {
    if (!roleLoading && role && role !== 'member') {
      /* routed by DashboardRouter */
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

      <div className="w-full max-w-none px-4 sm:px-6 xl:px-8 pt-2 sm:pt-4 pb-4">

        {/* User avatar */}
        <div className="mb-4 sm:mb-6 flex justify-start">
          <RoleBasedAvatar
            avatarUrl={profileWithRole?.avatar_url}
            role={profileWithRole?.role || 'member'}
            fallbackText={user?.email || 'U'}
            className="h-14 w-14 sm:h-16 sm:w-16"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <DashboardTabsNav
            showProfile={false}
            items={[
              { value: 'social', icon: MessageCircle, label: t('nav.social') },
              { value: 'startups', icon: Building, label: 'My Startups' },
              { value: 'resources', icon: Globe, label: t('nav.resources') },
              { value: 'tools', icon: Wrench, label: t('nav.tools') },
              { value: 'calendar', icon: CalendarIcon, label: 'Calendar' },
              { value: 'call-agents', icon: Bot, label: 'Agents' },
              { value: 'lightpaper', icon: FileText, label: 'LightPaper' },
              { value: 'network', icon: Network, label: t('nav.network') },
              { value: 'learn', icon: GraduationCap, label: t('nav.learn') },
              { value: 'intelligence', icon: Brain, label: t('nav.intelligence') },
              { value: 'jobs', icon: Briefcase, label: t('nav.jobs') },
            ]}
          />


          {activeTab === 'social' && (
            <TabsContent value="social" className="space-y-4">
              <UnifiedCommunityFeed showCreatePost={true} interstitialContent={<InvestorCommunity />} interstitialAfterIndex={3} />
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
              <MVPReferralCard />
              <AIFeaturesHub />
            </TabsContent>
          )}

          {activeTab === 'call-agents' && (
            <TabsContent value="call-agents" className="space-y-4">
              <SFHCallAgents />
            </TabsContent>
          )}

          {/* LightPaper Tab */}
          <TabsContent value="lightpaper" className="space-y-4">
            <LightPaperWorkspace />
          </TabsContent>

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
              <MeetingsHubHeader subtitle="Join live rooms and upcoming sessions." />
              <LiveRooms />
              <BookingsList variant="requests" />
              <BookingsList variant="scheduled" emptyLabel="No confirmed meetings yet." />
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
