import { useRememberedTab } from '@/lib/tabMemory';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

import { DashboardHeader } from '@/components/DashboardHeader';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart3,
  LayoutDashboard,
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
  FileSignature,
  ShieldCheck,
  Gift,
  Building,
  Plane,
  Award,
  Star,
  FileText,
  GraduationCap,
  Megaphone,
  ShoppingBag,
} from 'lucide-react';
import ProfileSalesManagement from '@/components/admin/ProfileSalesManagement';
import SuperAdminCommand from '@/components/admin/SuperAdminCommand';

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
import EquityContractsManager from '@/components/admin/EquityContractsManager';
import MembershipGrants from '@/components/admin/MembershipGrants';
import LiveGuestsManagement from '@/components/admin/LiveGuestsManagement';
import LiveSessionLogs from '@/components/admin/LiveSessionLogs';
import Invoice from '@/pages/Invoice';


const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useRememberedTab('admin', searchParams.get('tab'), "command");
  // People can hold several roles (e.g. startup + admin); check admin directly.
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    if (!user) { setIsAdmin(null); return; }
    supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' } as any).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  // Show loading while checking auth and role
  if (authLoading || roleLoading || (user && isAdmin === null)) {
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
  if (role !== 'admin' && !isAdmin) {
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
    <div className="matrix-page min-h-screen bg-[#02070E]">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6 pt-16 lg:pt-20">

      

        <Tabs value={activeTab} onValueChange={setActiveTab} className="matrix-admin">
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <aside className="order-1 lg:order-2 w-full lg:w-64 shrink-0 lg:sticky lg:top-20 rounded-lg border border-cyan-400/15 bg-[#061016] flex flex-col lg:max-h-[calc(100vh-6.5rem)]">
            <div className="px-4 pt-4 pb-1">
              <p className="text-[9px] tracking-[0.25em] text-[#4E7A73]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>SYSTEM NAVIGATION</p>
              <p className="text-sm font-semibold tracking-wide mt-1">HUB <span className="text-[#00E5FF]">//</span> MATRIX</p>
            </div>
            <TabsList className="flex lg:flex-col flex-row items-stretch gap-[2px] p-3 bg-transparent border-0 rounded-none overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto flex-1 justify-start">
            <TabsTrigger value="command" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <LayoutDashboard className="h-4 w-4" />
              <span className="whitespace-nowrap">Matrix</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="overview" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <BarChart3 className="h-4 w-4" />
              <span className="whitespace-nowrap">Overview</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="users" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Users className="h-4 w-4" />
              <span className="whitespace-nowrap">Users</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="investors" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <DollarSign className="h-4 w-4" />
              <span className="whitespace-nowrap">Investors</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="startups" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Building2 className="h-4 w-4" />
              <span className="whitespace-nowrap">Startups</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="accelerators" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Building2 className="h-4 w-4" />
              <span className="whitespace-nowrap">Accelerators</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="partners" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Handshake className="h-4 w-4" />
              <span className="whitespace-nowrap">Partners</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="hub-leads" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Globe className="h-4 w-4" />
              <span className="whitespace-nowrap">Hub Leads</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="resources" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Globe className="h-4 w-4" />
              <span className="whitespace-nowrap">Resources</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="events" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Calendar className="h-4 w-4" />
              <span className="whitespace-nowrap">Events</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="jobs" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Briefcase className="h-4 w-4" />
              <span className="whitespace-nowrap">Jobs</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="moderation" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <MessageSquare className="h-4 w-4" />
              <span className="whitespace-nowrap">Feed</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="analytics" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Activity className="h-4 w-4" />
              <span className="whitespace-nowrap">Analytics</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="api-usage" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <DollarSign className="h-4 w-4" />
              <span className="whitespace-nowrap">API</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="settings" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Settings className="h-4 w-4" />
              <span className="whitespace-nowrap">Settings</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="sfh-program" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Rocket className="h-4 w-4" />
              <span className="whitespace-nowrap">Cohorts</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="marketing" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Megaphone className="h-4 w-4" />
              <span className="whitespace-nowrap">Marketing</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="emails" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Mail className="h-4 w-4" />
              <span className="whitespace-nowrap">Emails</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="districts" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Crown className="h-4 w-4" />
              <span className="whitespace-nowrap">Districts</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="subscriptions" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <CreditCard className="h-4 w-4" />
              <span className="whitespace-nowrap">Subscriptions</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="sales" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <ShoppingBag className="h-4 w-4" />
              <span className="whitespace-nowrap">Sales</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="live-guests" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Users className="h-4 w-4" />
              <span className="whitespace-nowrap">Live Guests</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="referral-partners" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Gift className="h-4 w-4" />
              <span className="whitespace-nowrap">Referrals</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="workspace-bookings" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Building className="h-4 w-4" />
              <span className="whitespace-nowrap">Bookings</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="flights" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Plane className="h-4 w-4" />
              <span className="whitespace-nowrap">Flights</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="soft-landing" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Globe className="h-4 w-4" />
              <span className="whitespace-nowrap">Soft Landing</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="official-program" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Award className="h-4 w-4" />
              <span className="whitespace-nowrap">Official</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="vc-intros" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Rocket className="h-4 w-4" />
              <span className="whitespace-nowrap">VC Intros</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="hot-deals-feedback" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Star className="h-4 w-4" />
              <span className="whitespace-nowrap">Event Feedback</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="proposals" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <FileText className="h-4 w-4" />
              <span className="whitespace-nowrap">Proposals</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="legacy-import" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Users className="h-4 w-4" />
              <span className="whitespace-nowrap">Legacy Users</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="legacy-startups" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <Building2 className="h-4 w-4" />
              <span className="whitespace-nowrap">Legacy Startups</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="interns" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <GraduationCap className="h-4 w-4" />
              <span className="whitespace-nowrap">Interns</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="invoices" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <CreditCard className="h-4 w-4" />
              <span className="whitespace-nowrap">Invoices</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="equity-contracts" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <FileSignature className="h-4 w-4" />
              <span className="whitespace-nowrap">Contracts</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
            <TabsTrigger value="membership-grants" className="w-full shrink-0 lg:shrink flex items-center gap-2.5 px-3 py-[9px] rounded-[4px] border border-transparent text-left text-[10px] tracking-[0.08em] uppercase text-white/55 transition-all hover:text-white hover:bg-white/[0.04] data-[state=active]:text-[#00E5FF] data-[state=active]:bg-[#00E5FF]/[0.08] data-[state=active]:border-[#00E5FF]/30" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              <ShieldCheck className="h-4 w-4" />
              <span className="whitespace-nowrap">Grants</span>
            <span className="nav-dot ml-auto w-1.5 h-1.5 rounded-full bg-[#2EF8A0] opacity-0 shadow-[0_0_6px_#2EF8A0]" /></TabsTrigger>
          </TabsList>
            </aside>
            <div className="order-2 lg:order-1 flex-1 min-w-0 w-full">



          <TabsContent value="command"><SuperAdminCommand /></TabsContent>
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
          <TabsContent value="sales"><ProfileSalesManagement /></TabsContent>
          <TabsContent value="live-guests"><LiveGuestsManagement /><LiveSessionLogs /></TabsContent>
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
          <TabsContent value="equity-contracts"><EquityContractsManager /></TabsContent>
          <TabsContent value="membership-grants"><MembershipGrants /></TabsContent>
            </div>
        </div>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;