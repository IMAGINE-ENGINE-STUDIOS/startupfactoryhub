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
  ShieldCheck,
  Gift,
  Building,
  Plane,
  Award,
  Star,
  FileText,
  GraduationCap,
  Megaphone
} from 'lucide-react';

import AutoPostingHub from '@/components/marketing/AutoPostingHub';

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
import InvoiceBilling from '@/components/admin/InvoiceBilling';
import MembershipGrants from '@/components/admin/MembershipGrants';
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
          <TabsList className="p-1 flex flex-wrap h-auto gap-1 overflow-x-auto bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.05)]">
            <TabsTrigger value="overview" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden lg:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="investors" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <DollarSign className="h-4 w-4" />
              <span className="hidden lg:inline">Investors</span>
            </TabsTrigger>
            <TabsTrigger value="startups" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Startups</span>
            </TabsTrigger>
            <TabsTrigger value="accelerators" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Accelerators</span>
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Handshake className="h-4 w-4" />
              <span className="hidden lg:inline">Partners</span>
            </TabsTrigger>
            <TabsTrigger value="hub-leads" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Globe className="h-4 w-4" />
              <span className="hidden lg:inline">Hub Leads</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Globe className="h-4 w-4" />
              <span className="hidden lg:inline">Resources</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Calendar className="h-4 w-4" />
              <span className="hidden lg:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Briefcase className="h-4 w-4" />
              <span className="hidden lg:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden lg:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Activity className="h-4 w-4" />
              <span className="hidden lg:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="api-usage" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <DollarSign className="h-4 w-4" />
              <span className="hidden lg:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Settings className="h-4 w-4" />
              <span className="hidden lg:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="sfh-program" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Rocket className="h-4 w-4" />
              <span className="hidden lg:inline">Cohorts</span>
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Megaphone className="h-4 w-4" />
              <span className="hidden lg:inline">Marketing</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Mail className="h-4 w-4" />
              <span className="hidden lg:inline">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="districts" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Crown className="h-4 w-4" />
              <span className="hidden lg:inline">Districts</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <CreditCard className="h-4 w-4" />
              <span className="hidden lg:inline">Subscriptions</span>
            </TabsTrigger>
            <TabsTrigger value="referral-partners" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Gift className="h-4 w-4" />
              <span className="hidden lg:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="workspace-bookings" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Building className="h-4 w-4" />
              <span className="hidden lg:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="flights" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Plane className="h-4 w-4" />
              <span className="hidden lg:inline">Flights</span>
            </TabsTrigger>
            <TabsTrigger value="soft-landing" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Globe className="h-4 w-4" />
              <span className="hidden lg:inline">Soft Landing</span>
            </TabsTrigger>
            <TabsTrigger value="official-program" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Award className="h-4 w-4" />
              <span className="hidden lg:inline">Official</span>
            </TabsTrigger>
            <TabsTrigger value="vc-intros" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Rocket className="h-4 w-4" />
              <span className="hidden lg:inline">VC Intros</span>
            </TabsTrigger>
            <TabsTrigger value="hot-deals-feedback" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Star className="h-4 w-4" />
              <span className="hidden lg:inline">Event Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="proposals" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <FileText className="h-4 w-4" />
              <span className="hidden lg:inline">Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="legacy-import" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">Legacy Users</span>
            </TabsTrigger>
            <TabsTrigger value="legacy-startups" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Legacy Startups</span>
            </TabsTrigger>
            <TabsTrigger value="interns" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden lg:inline">Interns</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <CreditCard className="h-4 w-4" />
              <span className="hidden lg:inline">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="equity-contracts" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <FileSignature className="h-4 w-4" />
              <span className="hidden lg:inline">Contracts</span>
            </TabsTrigger>
            <TabsTrigger value="membership-grants" className="flex items-center gap-1 py-2 px-2 text-xs rounded-lg border border-transparent transition-all duration-300 hover:text-foreground hover:bg-white/[0.05] data-[state=active]:bg-white/[0.10] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_16px_hsl(var(--primary)/0.15)]">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden lg:inline">Grants</span>
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
          <TabsContent value="marketing"><AutoPostingHub /></TabsContent>
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
          <TabsContent value="invoices"><InvoiceBilling /></TabsContent>
          <TabsContent value="membership-grants"><MembershipGrants /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;