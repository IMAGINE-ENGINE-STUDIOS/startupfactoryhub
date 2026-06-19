import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
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
  
  Globe,
  Calendar,
  Briefcase,
  MessageSquare,
  Activity,
  DollarSign,
  
  Handshake,
  AlertTriangle,
  Rocket,
  Mail,
  Crown,
  CreditCard,
  Gift,
  Building,
  Plane,
  Award,
  Star,
  FileText,
  GraduationCap
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
import EmailMonitor from '@/components/admin/EmailMonitor';
import DistrictsManagement from '@/components/admin/DistrictsManagement';
import SubscriptionsManagement from '@/components/admin/SubscriptionsManagement';
import ReferralPartnersManagement from '@/components/admin/ReferralPartnersManagement';
import WorkspaceBookingsManagement from '@/components/admin/WorkspaceBookingsManagement';
import FlightsManagement from '@/components/admin/FlightsManagement';
import SoftLandingManagement from '@/components/admin/SoftLandingManagement';
import OfficialProgramManagement from '@/components/admin/OfficialProgramManagement';
import VCIntroductionsManagement from '@/components/admin/VCIntroductionsManagement';
import HotDealsFeedbackManagement from '@/components/admin/HotDealsFeedbackManagement';
import LegacyUsersImport from '@/components/admin/LegacyUsersImport';
import LegacyStartupsImport from '@/components/admin/LegacyStartupsImport';
import InternsManagement from '@/components/admin/InternsManagement';
import Invoice from '@/pages/Invoice';


const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || "overview");

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
    return <Navigate to="/auth" replace />;
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
      
      <main className="container mx-auto px-4 py-6 pt-16 lg:pt-20">

      

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="p-1 flex flex-wrap h-auto gap-1 overflow-x-auto bg-[var(--gradient-card)] backdrop-blur-3xl border border-[hsl(var(--neon-green)_/_0.25)] rounded-2xl shadow-[0_0_40px_hsl(var(--neon-green)_/_0.12),0_0_80px_hsl(var(--neon-green)_/_0.06),inset_0_0_30px_hsl(var(--neon-green)_/_0.04),var(--shadow-card)]">
            <TabsTrigger value="overview" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden lg:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="investors" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <DollarSign className="h-4 w-4" />
              <span className="hidden lg:inline">Investors</span>
            </TabsTrigger>
            <TabsTrigger value="startups" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Startups</span>
            </TabsTrigger>
            <TabsTrigger value="accelerators" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Accelerators</span>
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Handshake className="h-4 w-4" />
              <span className="hidden lg:inline">Partners</span>
            </TabsTrigger>
            <TabsTrigger value="hub-leads" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Globe className="h-4 w-4" />
              <span className="hidden lg:inline">Hub Leads</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Globe className="h-4 w-4" />
              <span className="hidden lg:inline">Resources</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Calendar className="h-4 w-4" />
              <span className="hidden lg:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Briefcase className="h-4 w-4" />
              <span className="hidden lg:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden lg:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Activity className="h-4 w-4" />
              <span className="hidden lg:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="api-usage" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <DollarSign className="h-4 w-4" />
              <span className="hidden lg:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Settings className="h-4 w-4" />
              <span className="hidden lg:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="sfh-program" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Rocket className="h-4 w-4" />
              <span className="hidden lg:inline">Cohorts</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Mail className="h-4 w-4" />
              <span className="hidden lg:inline">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="districts" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Crown className="h-4 w-4" />
              <span className="hidden lg:inline">Districts</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <CreditCard className="h-4 w-4" />
              <span className="hidden lg:inline">Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="referral-partners" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Gift className="h-4 w-4" />
              <span className="hidden lg:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="workspace-bookings" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Building className="h-4 w-4" />
              <span className="hidden lg:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="flights" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Plane className="h-4 w-4" />
              <span className="hidden lg:inline">Flights</span>
            </TabsTrigger>
            <TabsTrigger value="soft-landing" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Globe className="h-4 w-4" />
              <span className="hidden lg:inline">Soft Landing</span>
            </TabsTrigger>
            <TabsTrigger value="official-program" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Award className="h-4 w-4" />
              <span className="hidden lg:inline">Official</span>
            </TabsTrigger>
            <TabsTrigger value="vc-intros" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Rocket className="h-4 w-4" />
              <span className="hidden lg:inline">VC Intros</span>
            </TabsTrigger>
            <TabsTrigger value="hot-deals-feedback" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Star className="h-4 w-4" />
              <span className="hidden lg:inline">Event Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="proposals" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <FileText className="h-4 w-4" />
              <span className="hidden lg:inline">Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="legacy-import" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">Legacy Users</span>
            </TabsTrigger>
            <TabsTrigger value="legacy-startups" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Legacy Startups</span>
            </TabsTrigger>
            <TabsTrigger value="interns" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-500 hover:border-[hsl(var(--neon-green)_/_0.3)] hover:shadow-[0_0_12px_hsl(var(--neon-green)_/_0.15)] data-[state=active]:bg-primary/15 data-[state=active]:border-[hsl(var(--neon-green)_/_0.5)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--neon-green)_/_0.5),0_0_40px_hsl(var(--neon-green)_/_0.25),var(--pulse-glow)]">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden lg:inline">Interns</span>
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
          <TabsContent value="emails"><EmailMonitor /></TabsContent>
          <TabsContent value="districts"><DistrictsManagement /></TabsContent>
          <TabsContent value="subscriptions"><SubscriptionsManagement /></TabsContent>
          <TabsContent value="referral-partners"><ReferralPartnersManagement /></TabsContent>
          <TabsContent value="workspace-bookings"><WorkspaceBookingsManagement /></TabsContent>
          <TabsContent value="flights"><FlightsManagement /></TabsContent>
          <TabsContent value="soft-landing"><SoftLandingManagement /></TabsContent>
          <TabsContent value="official-program"><OfficialProgramManagement /></TabsContent>
          <TabsContent value="vc-intros"><VCIntroductionsManagement /></TabsContent>
          <TabsContent value="hot-deals-feedback"><HotDealsFeedbackManagement /></TabsContent>
          <TabsContent value="proposals">
            <div className="-mx-4">
              <Invoice />
            </div>
          </TabsContent>
          <TabsContent value="legacy-import"><LegacyUsersImport /></TabsContent>
          <TabsContent value="legacy-startups"><LegacyStartupsImport /></TabsContent>
          <TabsContent value="interns"><InternsManagement /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;