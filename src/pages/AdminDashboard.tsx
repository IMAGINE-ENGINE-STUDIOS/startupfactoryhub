import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  BarChart3, 
  Users, 
  Building2, 
  Settings, 
  Shield,
  Globe,
  Calendar,
  Briefcase,
  MessageSquare,
  Activity,
  DollarSign,
  RefreshCw
} from 'lucide-react';

// Admin components
import AdminOverview from '@/components/admin/AdminOverview';
import UsersManagement from '@/components/admin/UsersManagement';
import StartupsManagement from '@/components/admin/StartupsManagement';
import AcceleratorsManagement from '@/components/admin/AcceleratorsManagement';
import ResourcesManagement from '@/components/admin/ResourcesManagement';
import EventsManagement from '@/components/admin/EventsManagement';
import JobsManagement from '@/components/admin/JobsManagement';
import FeedModeration from '@/components/admin/FeedModeration';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import ApiUsageTracker from '@/components/admin/ApiUsageTracker';
import AdminSettings from '@/components/admin/AdminSettings';

const AdminDashboard = () => {
  const { role, loading: roleLoading } = useUserRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || "overview");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
      setSearchParams({});
    }
  }, [urlTab, activeTab, setSearchParams]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
    window.location.reload();
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-red-500" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Platform management and oversight</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="tech-card border-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="tech-card border-0 p-1 grid grid-cols-6 lg:grid-cols-11 h-auto gap-1 overflow-x-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1 py-2 px-2 text-xs">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden lg:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="startups" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Startups</span>
            </TabsTrigger>
            <TabsTrigger value="accelerators" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Accelerators</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Globe className="h-4 w-4" />
              <span className="hidden lg:inline">Resources</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Calendar className="h-4 w-4" />
              <span className="hidden lg:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Briefcase className="h-4 w-4" />
              <span className="hidden lg:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-1 py-2 px-2 text-xs">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden lg:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Activity className="h-4 w-4" />
              <span className="hidden lg:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="api-usage" className="flex items-center gap-1 py-2 px-2 text-xs">
              <DollarSign className="h-4 w-4" />
              <span className="hidden lg:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Settings className="h-4 w-4" />
              <span className="hidden lg:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><AdminOverview /></TabsContent>
          <TabsContent value="users"><UsersManagement /></TabsContent>
          <TabsContent value="startups"><StartupsManagement /></TabsContent>
          <TabsContent value="accelerators"><AcceleratorsManagement /></TabsContent>
          <TabsContent value="resources"><ResourcesManagement /></TabsContent>
          <TabsContent value="events"><EventsManagement /></TabsContent>
          <TabsContent value="jobs"><JobsManagement /></TabsContent>
          <TabsContent value="moderation"><FeedModeration /></TabsContent>
          <TabsContent value="analytics"><AdminAnalytics /></TabsContent>
          <TabsContent value="api-usage"><ApiUsageTracker /></TabsContent>
          <TabsContent value="settings"><AdminSettings /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;