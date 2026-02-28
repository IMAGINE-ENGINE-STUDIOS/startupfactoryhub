import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RoleBasedAvatar from '@/components/RoleBasedAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'react-router-dom';
import { DollarSign, TrendingUp, Building, Target, Users, Calendar as CalendarIcon, ExternalLink, Plus, Clock, MapPin, MessageCircle, Network, BarChart, Brain, Wrench, Briefcase, Presentation, LineChart, Globe, Bell, Video, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import DistrictRooms from '@/components/DistrictRooms';
import LiveRooms from '@/components/LiveRooms';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import { format, parseISO } from 'date-fns';

import StartupProfileDialog from '@/components/StartupProfileDialog';
import MatchingSystem from '@/components/MatchingSystem';
import FloatingChat from '@/components/FloatingChat';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { IntelligenceHub } from '@/components/intelligence/IntelligenceHub';
import InvestorProfileView from '@/components/InvestorProfileView';
import PitchMeetingCard from '@/components/PitchMeetingCard';
import VideoConferencing from '@/components/VideoConferencing';
import ProfilePostsMosaic from '@/components/ProfilePostsMosaic';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { DashboardHeader } from '@/components/DashboardHeader';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import CreateSessionDialog from '@/components/CreateSessionDialog';
import InvestorSchedulePitchDialog from '@/components/InvestorSchedulePitchDialog';
import RecordInvestmentDialog from '@/components/RecordInvestmentDialog';
import ValuationTracker from '@/components/ValuationTracker';
import { useEvents } from '@/hooks/useEvents';
import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';
interface Investment {
  id: string;
  investment_id?: string;
  name: string;
  description: string;
  stage: string;
  industry: string;
  funding_amount: number;
  user_id: string;
  logo_url?: string | null;
}
export default function InvestorDashboard() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [opportunities, setOpportunities] = useState<Investment[]>([]);
  const [investorProfile, setInvestorProfile] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || 'social');
  const [pitchMeetings, setPitchMeetings] = useState<any[]>([]);
  const [pendingPitchesCount, setPendingPitchesCount] = useState(0);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | undefined>();
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [schedulePitchDialogOpen, setSchedulePitchDialogOpen] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [recordInvestmentDialogOpen, setRecordInvestmentDialogOpen] = useState(false);
  const [portfolioValuations, setPortfolioValuations] = useState<any[]>([]);
  const [selectedPortfolioCompany, setSelectedPortfolioCompany] = useState<any>(null);
  const [showPortfolioDialog, setShowPortfolioDialog] = useState(false);
  const [selectedExternalInvestment, setSelectedExternalInvestment] = useState<any>(null);
  const [showExternalDialog, setShowExternalDialog] = useState(false);
  const [deleteInvestmentDialogOpen, setDeleteInvestmentDialogOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<any>(null);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();

  // Sync URL tab param to activeTab
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
      setSearchParams({});
    }
  }, [urlTab, activeTab, setSearchParams]);
  const {
    profile: profileWithRole
  } = useProfileWithRole();
  const {
    upcomingEvents
  } = useEvents();
  useEffect(() => {
    const pending = pitchMeetings.filter((m) => m.status === 'pending').length;
    setPendingPitchesCount(pending);
  }, [pitchMeetings]);
  useEffect(() => {
    if (user) {
      fetchInvestorProfile();
      fetchInvestments();
      fetchOpportunities();
      fetchPitchMeetings();
      fetchPortfolioValuations();
    }
  }, [user]);

  // Real-time subscription for portfolio company updates
  useEffect(() => {
    if (!user || investments.length === 0) return;

    // Get platform company IDs from investments
    const companyIds = investments.filter((inv: any) => !inv.isExternal && inv.id).map((inv: any) => inv.id);
    if (companyIds.length === 0) return;
    const channel = supabase.channel('portfolio-companies-changes').on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'companies'
    }, (payload) => {
      // Check if the updated company is in our portfolio
      if (companyIds.includes(payload.new.id)) {
        // Refresh investments to get latest data
        fetchInvestments();

        // If this company's dialog is open, update the selected company
        if (selectedPortfolioCompany?.id === payload.new.id) {
          setSelectedPortfolioCompany(payload.new);
        }
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, investments, selectedPortfolioCompany]);

  // Real-time subscription for pitch meetings
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('pitch-meetings-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'pitch_meetings',
      filter: `investor_id=eq.${user.id}`
    }, () => {
      // Refresh pitch meetings on any change
      fetchPitchMeetings();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Real-time subscription for investments (to sync when new investments are recorded)
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('investments-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'investments',
      filter: `investor_id=eq.${user.id}`
    }, () => {
      fetchInvestments();
      fetchPortfolioValuations();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  const fetchPortfolioValuations = async () => {
    if (!user) return;

    // Get all investments
    const {
      data: investmentData
    } = await supabase.from('investments').select('id, company_id, amount, valuation_at_investment, equity_percentage, external_company_name').eq('investor_id', user.id);
    if (!investmentData || investmentData.length === 0) {
      setPortfolioValuations([]);
      return;
    }

    // Get company IDs for platform companies only
    const companyIds = investmentData.filter((i) => i.company_id).map((i) => i.company_id);

    // Get latest valuations for each platform company
    let latestValuations: Record<string, any> = {};
    if (companyIds.length > 0) {
      const {
        data: valuations
      } = await supabase.from('company_valuations').select('*').in('company_id', companyIds).order('valuation_date', {
        ascending: false
      });

      // Group valuations by company and get latest
      valuations?.forEach((v) => {
        if (!latestValuations[v.company_id]) {
          latestValuations[v.company_id] = v;
        }
      });
    }

    // Combine with investment data
    const portfolioData = investmentData.map((inv) => ({
      ...inv,
      latestValuation: inv.company_id ? latestValuations[inv.company_id]?.valuation_amount || inv.valuation_at_investment || 0 : inv.valuation_at_investment || 0 // External companies use initial valuation
    }));
    setPortfolioValuations(portfolioData);
  };
  const fetchInvestorProfile = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('investor_profiles').select('*').eq('user_id', user.id).single();
    if (!error && data) {
      setInvestorProfile(data);
    }
  };
  const fetchPitchMeetings = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('pitch_meetings').select(`
        *,
        company:companies(name, logo_url, pitch_deck_url)
      `).eq('investor_id', user.id).order('scheduled_date', {
      ascending: true
    });
    if (!error && data) {
      // Fetch startup profiles separately
      const startupIds = [...new Set(data.map((m) => m.startup_id))];
      const {
        data: profiles
      } = await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', startupIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      const enrichedData = data.map((meeting) => ({
        ...meeting,
        startup: profileMap.get(meeting.startup_id) || {
          full_name: 'Unknown',
          avatar_url: null
        }
      }));
      setPitchMeetings(enrichedData);
    }
  };
  const handleAcceptPitch = async (pitchId: string) => {
    try {
      const {
        error
      } = await supabase.from('pitch_meetings').update({
        status: 'scheduled'
      }).eq('id', pitchId);
      if (error) throw error;
      toast({
        title: 'Pitch Accepted',
        description: 'The startup has been notified'
      });

      // Send notification to startup
      const meeting = pitchMeetings.find((m) => m.id === pitchId);
      if (meeting) {
        await supabase.from('notifications').insert({
          user_id: meeting.startup_id,
          title: 'Pitch Meeting Accepted',
          message: `Your pitch meeting has been accepted`,
          type: 'success'
        });
      }
      fetchPitchMeetings();
    } catch (error) {
      console.error('Error accepting pitch:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept pitch meeting',
        variant: 'destructive'
      });
    }
  };
  const handleRejectPitch = async (pitchId: string) => {
    try {
      const {
        error
      } = await supabase.from('pitch_meetings').update({
        status: 'cancelled'
      }).eq('id', pitchId);
      if (error) throw error;
      toast({
        title: 'Pitch Declined',
        description: 'The startup has been notified'
      });

      // Send notification to startup
      const meeting = pitchMeetings.find((m) => m.id === pitchId);
      if (meeting) {
        await supabase.from('notifications').insert({
          user_id: meeting.startup_id,
          title: 'Pitch Meeting Declined',
          message: `Your pitch meeting request was declined`,
          type: 'info'
        });
      }
      fetchPitchMeetings();
    } catch (error) {
      console.error('Error rejecting pitch:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline pitch meeting',
        variant: 'destructive'
      });
    }
  };
  const handleOutcomeChange = async (pitchId: string, outcome: string | null) => {
    try {
      const {
        error
      } = await supabase.from('pitch_meetings').update({
        outcome
      }).eq('id', pitchId);
      if (error) throw error;
      toast({
        title: 'Outcome Updated',
        description: `Pitch marked as "${outcome?.replace('_', ' ') || 'unmarked'}"`
      });
      setPitchMeetings((prev) => prev.map((m) => m.id === pitchId ? {
        ...m,
        outcome
      } : m));
    } catch (error) {
      console.error('Error updating outcome:', error);
      toast({
        title: 'Error',
        description: 'Failed to update pitch outcome',
        variant: 'destructive'
      });
    }
  };
  const expressInterest = async (companyId: string, companyName: string) => {
    if (!user) return;
    try {
      // Get the company owner's user_id
      const {
        data: company,
        error: companyError
      } = await supabase.from('companies').select('user_id').eq('id', companyId).single();
      if (companyError) throw companyError;

      // Insert investment interest
      const {
        error
      } = await supabase.from('investment_interests').insert({
        investor_id: user.id,
        company_id: companyId,
        status: 'interested'
      });
      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Interested",
            description: "You've already expressed interest in this startup.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      // Get investor's profile for notification
      const {
        data: profile
      } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
      const investorName = profile?.full_name || 'An investor';

      // Create notification for the startup owner
      await supabase.from('notifications').insert({
        user_id: company.user_id,
        type: 'investment_interest',
        title: 'New Investor Interest',
        message: `${investorName} has expressed interest in ${companyName}`,
        data: {
          investor_id: user.id,
          company_id: companyId,
          company_name: companyName,
          investor_name: investorName
        }
      });
      toast({
        title: "Interest Registered!",
        description: `Your interest in ${companyName} has been recorded. The startup owner will be notified.`
      });
    } catch (error) {
      console.error('Error expressing interest:', error);
      toast({
        title: "Error",
        description: "Failed to express interest. Please try again.",
        variant: "destructive"
      });
    }
    fetchOpportunities();
  };
  const startDueDiligence = async (companyId: string, companyName: string) => {
    if (!user) return;
    const {
      error
    } = await supabase.from('investment_interests').upsert({
      investor_id: user.id,
      company_id: companyId,
      status: 'due_diligence'
    });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to start due diligence process.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Due Diligence Started",
      description: `Due diligence process initiated for ${companyName}.`
    });
  };
  const fetchInvestments = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('investments').select(`
        *,
        companies:company_id (
          id,
          name,
          description,
          stage,
          industry,
          user_id,
          logo_url
        )
      `).eq('investor_id', user.id).eq('status', 'active');
    if (!error && data) {
      const formattedInvestments = data.map((inv: any) => {
        const isExternal = !inv.company_id && inv.external_company_name;
        return {
          id: inv.company_id || inv.id,
          investment_id: inv.id,
          name: isExternal ? inv.external_company_name : inv.companies?.name || 'Unknown Company',
          description: inv.companies?.description || '',
          stage: inv.companies?.stage || 'External',
          industry: isExternal ? inv.external_company_industry || 'General' : inv.companies?.industry || 'General',
          funding_amount: inv.amount,
          user_id: inv.companies?.user_id || '',
          logo_url: inv.companies?.logo_url || null,
          investment_date: inv.investment_date,
          equity_percentage: inv.equity_percentage,
          isExternal,
          external_company_website: inv.external_company_website
        };
      });
      setInvestments(formattedInvestments);
    }
  };

  const handleDeleteInvestment = async () => {
    if (!investmentToDelete?.investment_id) return;
    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', investmentToDelete.investment_id);
      if (error) throw error;
      toast({
        title: "Investment Removed",
        description: `${investmentToDelete.name} has been removed from your portfolio.`,
      });
      fetchInvestments();
      fetchInvestorProfile();
      fetchPortfolioValuations();
    } catch (err) {
      console.error('Error deleting investment:', err);
      toast({
        title: "Error",
        description: "Failed to remove investment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteInvestmentDialogOpen(false);
      setInvestmentToDelete(null);
    }
  };

  const fetchOpportunities = async () => {
    if (!user) return;

    // Get companies that the investor hasn't invested in yet
    const {
      data: existingInvestments
    } = await supabase.from('investments').select('company_id').eq('investor_id', user.id);
    const investedCompanyIds = existingInvestments?.map((i) => i.company_id) || [];
    const {
      data,
      error
    } = await supabase.from('companies').select(`
        id,
        name,
        description,
        stage,
        industry,
        funding_amount,
        user_id,
        looking_for,
        logo_url
      `).not('id', 'in', `(${investedCompanyIds.join(',') || 'null'})`).order('created_at', {
      ascending: false
    });
    if (!error && data) {
      setOpportunities(data);
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate ROI based on real investment data and valuations
  const calculateROI = () => {
    if (!portfolioValuations.length || !investorProfile?.total_invested) return '0.0%';
    let totalInvested = 0;
    let totalCurrentValue = 0;
    portfolioValuations.forEach((inv) => {
      totalInvested += inv.amount || 0;

      // Calculate current value based on equity % and latest valuation
      if (inv.equity_percentage && inv.latestValuation) {
        totalCurrentValue += inv.latestValuation * inv.equity_percentage / 100;
      } else {
        // If no valuation data, assume invested value unchanged
        totalCurrentValue += inv.amount || 0;
      }
    });
    if (totalInvested === 0) return '0.0%';
    const roi = (totalCurrentValue - totalInvested) / totalInvested * 100;
    return `${roi.toFixed(1)}%`;
  };
  const stats = [{
    title: 'Total Invested',
    value: investorProfile ? formatCurrency(investorProfile.total_invested || 0) : '$0',
    icon: DollarSign,
    color: 'text-green-500'
  }, {
    title: 'Active Investments',
    value: investorProfile?.portfolio_size?.toString() || '0',
    icon: Building,
    color: 'text-primary'
  }, {
    title: 'ROI (Est.)',
    value: calculateROI(),
    icon: TrendingUp,
    color: 'text-accent'
  }, {
    title: 'Opportunities',
    value: opportunities.length.toString(),
    icon: Target,
    color: 'text-yellow-500'
  }];
  return <div className="min-h-screen bg-gradient-hero pb-6 relative">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile: Only Avatar */}
          <div className="md:hidden flex justify-start mb-4">
            <RoleBasedAvatar avatarUrl={profileWithRole?.avatar_url} role="investor" fallbackText={user?.email || 'I'} className="h-16 w-16" />
          </div>
          
          {/* Desktop: Full Welcome Section */}
          <div className="hidden md:flex items-center space-x-4">
            <RoleBasedAvatar avatarUrl={profileWithRole?.avatar_url} role="investor" fallbackText={user?.email || 'I'} className="h-16 w-16" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {profileWithRole?.full_name || 'Investor'} Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Discover and fund the next unicorns</p>
            </div>
          </div>
        </div>


        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto scrollbar-thin -mx-2 px-2 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto lg:grid lg:w-full lg:grid-cols-9 max-w-7xl whitespace-nowrap p-1.5 sm:p-1 gap-1 h-auto">
              <TabsTrigger value="social" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Social</span>
              </TabsTrigger>
              <TabsTrigger value="meetings" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Video className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Meetings</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Network className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Network</span>
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Building className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Portfolio</span>
              </TabsTrigger>
              
              <TabsTrigger value="calendar" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <CalendarIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <BarChart className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Brain className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Intelligence</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Wrench className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Tools</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex-shrink-0 gap-1.5 sm:gap-2 px-3 py-3 sm:py-2 rounded-lg data-[state=active]:tech-card data-[state=active]:shadow-[var(--pulse-glow)]">
                <Globe className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden md:inline text-sm">Resources</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="portfolio" className="space-y-4">
            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => <Card key={index} className="tech-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.title}</p>
                        <p className="text-xl font-bold">{stat.value}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                    </div>
                  </CardContent>
                </Card>)}
            </div>

            {/* Record Investment Button */}
            <div className="flex justify-end">
              <Button onClick={() => setRecordInvestmentDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Investment
              </Button>
            </div>

            {/* Current Portfolio */}
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-primary" />
                  <span>Current Portfolio</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {investments.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No investments recorded yet</p>
                    <p className="text-sm">Click "Record Investment" to add your first investment</p>
                  </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {investments.map((investment: any) => {
                  const portfolioItem = portfolioValuations.find((p) => p.company_id === investment.id);
                  const currentValue = portfolioItem?.equity_percentage && portfolioItem?.latestValuation ? portfolioItem.latestValuation * portfolioItem.equity_percentage / 100 : investment.funding_amount;
                  const investedAmount = portfolioItem?.amount || investment.funding_amount || 0;
                  const roi = investedAmount > 0 ? (currentValue - investedAmount) / investedAmount * 100 : 0;
                  return <Card key={investment.id} className="tech-card border-0 hover:scale-[1.02] transition-transform">
                           <CardContent className="p-4">
                            <div className="flex items-start space-x-3 mb-3">
                              <RoleBasedAvatar avatarUrl={investment.logo_url} role="startup" fallbackText={investment.name} className="h-10 w-10" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground truncate">{investment.name}</h3>
                                  {investment.isExternal && <Badge variant="outline" className="text-xs shrink-0">External</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">{investment.industry}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Invested:</span>
                                <span className="font-medium text-foreground">
                                  {formatCurrency(investedAmount)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Equity:</span>
                                <span className="font-medium text-foreground">
                                  {portfolioItem?.equity_percentage ? `${portfolioItem.equity_percentage}%` : '-'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Est. Value:</span>
                                <span className="font-medium text-foreground">
                                  {formatCurrency(currentValue)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">ROI:</span>
                                <span className={`font-medium ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex space-x-1 pt-1">
                                <Badge variant="secondary" className="text-xs">{investment.stage}</Badge>
                              </div>
                            </div>
                            
                            <Button size="sm" variant="outline" className="w-full mt-3" onClick={() => {
                        if (investment.isExternal) {
                          setSelectedExternalInvestment(investment);
                          setShowExternalDialog(true);
                        } else {
                          // Fetch full company data for platform companies
                          supabase.from('companies').select('*').eq('id', investment.id).single().then(({
                            data
                          }) => {
                            if (data) {
                              setSelectedPortfolioCompany(data);
                              setShowPortfolioDialog(true);
                            }
                          });
                        }
                      }}>
                              View Details
                            </Button>
                            <Button size="sm" variant="ghost" className="w-full mt-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => {
                              e.stopPropagation();
                              setInvestmentToDelete(investment);
                              setDeleteInvestmentDialogOpen(true);
                            }}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </CardContent>
                        </Card>;
                })}
                  </div>}
              </CardContent>
            </Card>

            {/* Valuation Tracker */}
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  <span>Valuation Tracker</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ValuationTracker />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <MatchingSystem />
          </TabsContent>

          

          {/* Calendar Tab - Merged Events & Pitches */}
          <TabsContent value="calendar" className="space-y-6">
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <Button onClick={() => setSchedulePitchDialogOpen(true)} variant="outline" className="gap-2 w-full sm:w-auto">
                <Presentation className="h-4 w-4" />
                <span className="sm:inline">Schedule Pitch</span>
              </Button>
              <Button onClick={() => setCreateSessionDialogOpen(true)} variant="outline" className="gap-2 w-full sm:w-auto">
                <CalendarIcon className="h-4 w-4" />
                <span className="sm:inline">Schedule Session</span>
              </Button>
              <Button onClick={() => setCreateEventDialogOpen(true)} className="gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Create Event</span>
              </Button>
            </div>

            {/* Upcoming Events with Banners */}
            {upcomingEvents.length > 0 && <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <div className="flex gap-4 pb-4">
                      {upcomingEvents.slice(0, 6).map((event) => <div key={event.id} className="group cursor-pointer flex-shrink-0 w-[300px] sm:w-[350px]" onClick={() => {
                    setSelectedEvent(event);
                    setShowEventDetails(true);
                  }}>
                          <div className="relative overflow-hidden rounded-lg border hover:border-primary transition-all">
                            {event.banner_url ? <img src={event.banner_url} alt={event.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-48 bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                                <CalendarIcon className="h-16 w-16 text-purple-500/30" />
                              </div>}
                            <div className="p-4 min-h-[120px] flex flex-col">
                              <h3 className="font-semibold mb-2 line-clamp-1">{event.title}</h3>
                              <div className="space-y-1 text-sm text-muted-foreground flex-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {format(parseISO(event.start_date), 'MMM d, h:mm a')}
                                </div>
                                {event.location && <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {event.location.startsWith('http') ? <a href={event.location} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline line-clamp-1" onClick={(e) => e.stopPropagation()}>
                                        {event.location}
                                      </a> : <span className="line-clamp-1">{event.location}</span>}
                                  </div>}
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  {event.attendees} attending
                                  {event.max_attendees && ` / ${event.max_attendees}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>)}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>}
            
            {/* Unified Calendar - IN MIDDLE */}
            <UnifiedCalendar showCreateButton={false} userRole="investor" filterTypes={['event', 'session', 'pitch', 'accelerator']} onItemClick={(item) => {
            if (item.type === 'event') {
              setSelectedEvent(item);
              setShowEventDetails(true);
            } else if ((item.type === 'session' || item.type === 'pitch') && item.meeting_link) {
              setActiveVideoUrl(item.meeting_link);
            }
          }} />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <InvestorProfileView />
            
            










          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <UnifiedCommunityFeed interstitialContent={<DistrictRooms />} interstitialAfterIndex={3} />
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            <LiveRooms />

            {/* Pitches Section */}
            <div className="space-y-8 pt-4">
              {/* 1. Incoming Pitch Requests */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex-shrink-0">
                      <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg">Incoming Requests</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Startup pitch meeting requests</p>
                    </div>
                  </div>
                  {pitchMeetings.filter((m) => m.status === 'pending' && m.host_id === m.startup_id).length > 0 && <Badge className="bg-amber-500 text-white w-fit text-xs">
                      {pitchMeetings.filter((m) => m.status === 'pending' && m.host_id === m.startup_id).length} pending
                    </Badge>}
                </div>
                {pitchMeetings.filter((m) => m.status === 'pending' && m.host_id === m.startup_id).length === 0 ? <div className="text-center py-12 rounded-xl border border-dashed border-muted-foreground/20">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No incoming pitch requests</p>
                  </div> : <div className="grid gap-4">
                    {pitchMeetings.filter((m) => m.status === 'pending' && m.host_id === m.startup_id).map((meeting) => <PitchMeetingCard key={meeting.id} meeting={meeting} variant="incoming" viewerType="investor" onAccept={handleAcceptPitch} onReject={handleRejectPitch} />)}
                  </div>}
              </div>

              {/* 2. Sent Pitch Requests */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex-shrink-0">
                      <Presentation className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg">Sent Requests</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Your pitch requests to startups</p>
                    </div>
                  </div>
                  {pitchMeetings.filter((m) => m.status === 'pending' && m.host_id === m.investor_id).length > 0 && <Badge variant="secondary" className="w-fit text-xs">
                      {pitchMeetings.filter((m) => m.status === 'pending' && m.host_id === m.investor_id).length} pending
                    </Badge>}
                </div>
                {pitchMeetings.filter((m) => m.status === 'pending' && m.host_id === m.investor_id).length === 0 ? <div className="text-center py-12 rounded-xl border border-dashed border-muted-foreground/20">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No pending sent requests</p>
                  </div> : <div className="grid gap-4">
                    {pitchMeetings.filter((m) => m.status === 'pending' && m.host_id === m.investor_id).map((meeting) => <PitchMeetingCard key={meeting.id} meeting={meeting} variant="sent" viewerType="investor" />)}
                  </div>}
              </div>

              {/* 3. Upcoming Pitches */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex-shrink-0">
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg">Upcoming Pitches</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Confirmed pitch meetings</p>
                  </div>
                </div>
                {pitchMeetings.filter((m) => m.status === 'scheduled' && new Date(m.scheduled_date) >= new Date()).length === 0 ? <div className="text-center py-12 rounded-xl border border-dashed border-muted-foreground/20">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No upcoming pitch meetings</p>
                  </div> : <div className="grid gap-4">
                    {pitchMeetings.filter((m) => m.status === 'scheduled' && new Date(m.scheduled_date) >= new Date()).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()).map((meeting) => <PitchMeetingCard key={meeting.id} meeting={meeting} variant="upcoming" viewerType="investor" onJoin={setActiveVideoUrl} />)}
                  </div>}
              </div>

              {/* 4. Past Pitches */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-muted/50 flex-shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base sm:text-lg">Past Pitches</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Completed meetings history</p>
                  </div>
                </div>
                {pitchMeetings.filter((m) => (m.status === 'scheduled' || m.status === 'completed') && new Date(m.scheduled_date) < new Date()).length === 0 ? <div className="text-center py-12 rounded-xl border border-dashed border-muted-foreground/20">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No past pitch meetings</p>
                  </div> : <div className="grid gap-4">
                    {pitchMeetings.filter((m) => (m.status === 'scheduled' || m.status === 'completed') && new Date(m.scheduled_date) < new Date()).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()).map((meeting) => <PitchMeetingCard key={meeting.id} meeting={meeting} variant="past" viewerType="investor" onOutcomeChange={handleOutcomeChange} />)}
                  </div>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4">
            <IntelligenceHub />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <AIFeaturesHub />
          </TabsContent>

          <TabsContent value="resources" className="mt-0 relative overflow-hidden" style={{ height: 'calc(100vh - 12rem)', minHeight: '500px' }}>
            <div className="absolute inset-0">
              <GlobalResourcesMap />
            </div>
          </TabsContent>
        </Tabs>

        {/* Video Conferencing Dialog */}
        <Dialog open={!!activeVideoUrl} onOpenChange={(open) => !open && setActiveVideoUrl(undefined)}>
          <DialogContent className="max-w-5xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>Video Conference</DialogTitle>
            </DialogHeader>
            <div className="h-full">
              {activeVideoUrl && <VideoConferencing roomUrl={activeVideoUrl} onLeave={() => setActiveVideoUrl(undefined)} />}
            </div>
          </DialogContent>
        </Dialog>
      </div>


      {/* Floating Chat with AI */}
      <FloatingChat />

      {/* Dialogs */}
      <CreateEventDialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen} onEventCreated={() => {
      setCreateEventDialogOpen(false);
    }} />
      <CreateSessionDialog open={createSessionDialogOpen} onOpenChange={setCreateSessionDialogOpen} onSessionCreated={() => {
      setCreateSessionDialogOpen(false);
    }} />
      <InvestorSchedulePitchDialog open={schedulePitchDialogOpen} onOpenChange={setSchedulePitchDialogOpen} onPitchScheduled={() => {
      fetchPitchMeetings();
    }} />
      <RecordInvestmentDialog open={recordInvestmentDialogOpen} onOpenChange={setRecordInvestmentDialogOpen} onInvestmentRecorded={() => {
      fetchInvestments();
      fetchInvestorProfile();
      fetchPortfolioValuations();
    }} />
      {selectedEvent && <EventDetailsDialog event={selectedEvent} open={showEventDetails} onOpenChange={setShowEventDetails} onEventUpdated={() => {
      setShowEventDetails(false);
    }} />}

      {/* Platform Company Profile Dialog */}
      <StartupProfileDialog company={selectedPortfolioCompany} open={showPortfolioDialog} onOpenChange={(open) => {
      setShowPortfolioDialog(open);
      if (!open) setSelectedPortfolioCompany(null);
    }} />

      {/* External Investment Details Dialog */}
      <Dialog open={showExternalDialog} onOpenChange={(open) => {
      setShowExternalDialog(open);
      if (!open) setSelectedExternalInvestment(null);
    }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Investment Details</DialogTitle>
          </DialogHeader>
          {selectedExternalInvestment && <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RoleBasedAvatar avatarUrl={null} role="startup" fallbackText={selectedExternalInvestment.name} className="h-12 w-12" />
                <div>
                  <h3 className="font-semibold text-lg">{selectedExternalInvestment.name}</h3>
                  <Badge variant="outline" className="text-xs">External Company</Badge>
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Industry</span>
                  <span className="text-sm font-medium">{selectedExternalInvestment.industry || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Investment Amount</span>
                  <span className="text-sm font-medium">{formatCurrency(selectedExternalInvestment.funding_amount || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Equity</span>
                  <span className="text-sm font-medium">
                    {selectedExternalInvestment.equity_percentage ? `${selectedExternalInvestment.equity_percentage}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Investment Date</span>
                  <span className="text-sm font-medium">
                    {selectedExternalInvestment.investment_date ? format(parseISO(selectedExternalInvestment.investment_date), 'MMM d, yyyy') : 'N/A'}
                  </span>
                </div>
                {selectedExternalInvestment.external_company_website && <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Website</span>
                    <a href={selectedExternalInvestment.external_company_website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>}
              </div>
              
              <Button variant="outline" className="w-full mt-4" onClick={() => setShowExternalDialog(false)}>
                Close
              </Button>
            </div>}
        </DialogContent>
      </Dialog>
      {/* Delete Investment Confirmation Dialog */}
      <AlertDialog open={deleteInvestmentDialogOpen} onOpenChange={setDeleteInvestmentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Investment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {investmentToDelete?.name} from your portfolio. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvestment} className="bg-destructive hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}