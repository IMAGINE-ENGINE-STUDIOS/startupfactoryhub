import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
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
  RefreshCw,
  Handshake,
  AlertTriangle,
  Rocket
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
import { InvestorsManagement } from '@/components/admin/InvestorsManagement';
import CorporatePartnersManagement from '@/components/admin/CorporatePartnersManagement';
import HubApplicationsManagement from '@/components/admin/HubApplicationsManagement';
import SFHAcceleratorManager from '@/components/admin/SFHAcceleratorManager';

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || "overview");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
    window.location.reload();
  };

  // Show loading while checking auth and role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Block access if not admin - show access denied page
  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin dashboard. 
            This area is restricted to administrators only.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
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
              <Shield className="h-8 w-8 text-destructive" />
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
          <TabsList className="tech-card border-0 p-1 flex flex-wrap h-auto gap-1 overflow-x-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1 py-2 px-2 text-xs">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden lg:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="investors" className="flex items-center gap-1 py-2 px-2 text-xs">
              <DollarSign className="h-4 w-4" />
              <span className="hidden lg:inline">Investors</span>
            </TabsTrigger>
            <TabsTrigger value="startups" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Startups</span>
            </TabsTrigger>
            <TabsTrigger value="accelerators" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Accelerators</span>
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Handshake className="h-4 w-4" />
              <span className="hidden lg:inline">Partners</span>
            </TabsTrigger>
            <TabsTrigger value="hub-leads" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Globe className="h-4 w-4" />
              <span className="hidden lg:inline">Hub Leads</span>
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
            <TabsTrigger value="sfh-program" className="flex items-center gap-1 py-2 px-2 text-xs">
              <Rocket className="h-4 w-4" />
              <span className="hidden lg:inline">Cohorts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><AdminOverview /></TabsContent>
          <TabsContent value="users"><UsersManagement /></TabsContent>
          <TabsContent value="investors"><InvestorsManagement /></TabsContent>
          <TabsContent value="startups"><StartupsManagement /></TabsContent>
          <TabsContent value="accelerators"><AcceleratorsManagement /></TabsContent>
          <TabsContent value="partners"><CorporatePartnersManagement /></TabsContent>
          <TabsContent value="hub-leads"><HubApplicationsManagement /></TabsContent>
          <TabsContent value="resources"><ResourcesManagement /></TabsContent>
          <TabsContent value="events"><EventsManagement /></TabsContent>
          <TabsContent value="jobs"><JobsManagement /></TabsContent>
          <TabsContent value="moderation"><FeedModeration /></TabsContent>
          <TabsContent value="analytics"><AdminAnalytics /></TabsContent>
          <TabsContent value="api-usage"><ApiUsageTracker /></TabsContent>
          <TabsContent value="settings"><AdminSettings /></TabsContent>
          <TabsContent value="sfh-program"><SFHAcceleratorManager /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;