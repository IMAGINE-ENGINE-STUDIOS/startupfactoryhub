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
import { DollarSign, TrendingUp, Building, PieChart, Target, Users, Calendar as CalendarIcon, ExternalLink, Video, Plus, Bell, Clock, MapPin, MessageCircle, Network, UserCircle, BarChart, Brain, Wrench, Briefcase, Check, X, Presentation, LineChart } from 'lucide-react';
import companyLogo from '@/assets/company-logo.png';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import AIFeaturesHub from '@/components/AIFeaturesHub';
import { format, parseISO } from 'date-fns';

import StartupBrowser from '@/components/StartupBrowser';
import NetworkBrowser from '@/components/NetworkBrowser';
import StartupProfileDialog from '@/components/StartupProfileDialog';
import MatchingSystem from '@/components/MatchingSystem';
import FloatingChat from '@/components/FloatingChat';
import InvestorProfileForm from '@/components/InvestorProfileForm';
import InvestorStartupNetwork from '@/components/InvestorStartupNetwork';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MarketIntelligenceWidget from '@/components/MarketIntelligenceWidget';
import InvestorAvailabilityManager from '@/components/InvestorAvailabilityManager';
import InvestorProfileView from '@/components/InvestorProfileView';
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

interface Investment {
  id: string;
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
  const [activeTab, setActiveTab] = useState('social');
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile: profileWithRole } = useProfileWithRole();
  const { upcomingEvents } = useEvents();

  useEffect(() => {
    const pending = pitchMeetings.filter(m => m.status === 'pending').length;
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
    const companyIds = investments
      .filter((inv: any) => !inv.isExternal && inv.id)
      .map((inv: any) => inv.id);

    if (companyIds.length === 0) return;

    const channel = supabase
      .channel('portfolio-companies-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'companies'
        },
        (payload) => {
          // Check if the updated company is in our portfolio
          if (companyIds.includes(payload.new.id)) {
            // Refresh investments to get latest data
            fetchInvestments();
            
            // If this company's dialog is open, update the selected company
            if (selectedPortfolioCompany?.id === payload.new.id) {
              setSelectedPortfolioCompany(payload.new);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, investments, selectedPortfolioCompany]);

  // Real-time subscription for pitch meetings
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('pitch-meetings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pitch_meetings',
          filter: `investor_id=eq.${user.id}`
        },
        () => {
          // Refresh pitch meetings on any change
          fetchPitchMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPortfolioValuations = async () => {
    if (!user) return;
    
    // Get all investments
    const { data: investmentData } = await supabase
      .from('investments')
      .select('id, company_id, amount, valuation_at_investment, equity_percentage, external_company_name')
      .eq('investor_id', user.id);

    if (!investmentData || investmentData.length === 0) {
      setPortfolioValuations([]);
      return;
    }

    // Get company IDs for platform companies only
    const companyIds = investmentData
      .filter(i => i.company_id)
      .map(i => i.company_id);
    
    // Get latest valuations for each platform company
    let latestValuations: Record<string, any> = {};
    if (companyIds.length > 0) {
      const { data: valuations } = await supabase
        .from('company_valuations')
        .select('*')
        .in('company_id', companyIds)
        .order('valuation_date', { ascending: false });

      // Group valuations by company and get latest
      valuations?.forEach(v => {
        if (!latestValuations[v.company_id]) {
          latestValuations[v.company_id] = v;
        }
      });
    }

    // Combine with investment data
    const portfolioData = investmentData.map(inv => ({
      ...inv,
      latestValuation: inv.company_id 
        ? (latestValuations[inv.company_id]?.valuation_amount || inv.valuation_at_investment || 0)
        : (inv.valuation_at_investment || 0) // External companies use initial valuation
    }));

    setPortfolioValuations(portfolioData);
  };

  const fetchInvestorProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('investor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setInvestorProfile(data);
    }
  };

  const fetchPitchMeetings = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('pitch_meetings')
      .select(`
        *,
        company:companies(name, logo_url, pitch_deck_url),
        startup:profiles!pitch_meetings_startup_id_fkey(full_name, avatar_url)
      `)
      .eq('investor_id', user.id)
      .order('scheduled_date', { ascending: true });

    if (!error && data) {
      setPitchMeetings(data);
    }
  };

  const handleAcceptPitch = async (pitchId: string) => {
    try {
      const { error } = await supabase
        .from('pitch_meetings')
        .update({ status: 'scheduled' })
        .eq('id', pitchId);

      if (error) throw error;

      toast({
        title: 'Pitch Accepted',
        description: 'The startup has been notified',
      });

      // Send notification to startup
      const meeting = pitchMeetings.find(m => m.id === pitchId);
      if (meeting) {
        await supabase.from('notifications').insert({
          user_id: meeting.startup_id,
          title: 'Pitch Meeting Accepted',
          message: `Your pitch meeting has been accepted`,
          type: 'success',
        });
      }

      fetchPitchMeetings();
    } catch (error) {
      console.error('Error accepting pitch:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept pitch meeting',
        variant: 'destructive',
      });
    }
  };

  const handleRejectPitch = async (pitchId: string) => {
    try {
      const { error } = await supabase
        .from('pitch_meetings')
        .update({ status: 'cancelled' })
        .eq('id', pitchId);

      if (error) throw error;

      toast({
        title: 'Pitch Declined',
        description: 'The startup has been notified',
      });

      // Send notification to startup
      const meeting = pitchMeetings.find(m => m.id === pitchId);
      if (meeting) {
        await supabase.from('notifications').insert({
          user_id: meeting.startup_id,
          title: 'Pitch Meeting Declined',
          message: `Your pitch meeting request was declined`,
          type: 'info',
        });
      }

      fetchPitchMeetings();
    } catch (error) {
      console.error('Error rejecting pitch:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline pitch meeting',
        variant: 'destructive',
      });
    }
  };

  const expressInterest = async (companyId: string, companyName: string) => {
    if (!user) return;

    try {
      // Get the company owner's user_id
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('user_id')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Insert investment interest
      const { error } = await supabase
        .from('investment_interests')
        .insert({
          investor_id: user.id,
          company_id: companyId,
          status: 'interested'
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Interested",
            description: "You've already expressed interest in this startup.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      // Get investor's profile for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const investorName = profile?.full_name || 'An investor';

      // Create notification for the startup owner
      await supabase
        .from('notifications')
        .insert({
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
        description: `Your interest in ${companyName} has been recorded. The startup owner will be notified.`,
      });
    } catch (error) {
      console.error('Error expressing interest:', error);
      toast({
        title: "Error",
        description: "Failed to express interest. Please try again.",
        variant: "destructive",
      });
    }

    fetchOpportunities();
  };

  const startDueDiligence = async (companyId: string, companyName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('investment_interests')
      .upsert({
        investor_id: user.id,
        company_id: companyId,
        status: 'due_diligence'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start due diligence process.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Due Diligence Started",
      description: `Due diligence process initiated for ${companyName}.`,
    });
  };

  const fetchInvestments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('investments')
      .select(`
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
      `)
      .eq('investor_id', user.id)
      .eq('status', 'active');

    if (!error && data) {
      const formattedInvestments = data.map((inv: any) => {
        const isExternal = !inv.company_id && inv.external_company_name;
        return {
          id: inv.company_id || inv.id, // Use investment id for external companies
          name: isExternal ? inv.external_company_name : (inv.companies?.name || 'Unknown Company'),
          description: inv.companies?.description || '',
          stage: inv.companies?.stage || 'External',
          industry: isExternal ? (inv.external_company_industry || 'General') : (inv.companies?.industry || 'General'),
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

  const fetchOpportunities = async () => {
    if (!user) return;

    // Get companies that the investor hasn't invested in yet
    const { data: existingInvestments } = await supabase
      .from('investments')
      .select('company_id')
      .eq('investor_id', user.id);

    const investedCompanyIds = existingInvestments?.map(i => i.company_id) || [];

    const { data, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        description,
        stage,
        industry,
        funding_amount,
        user_id,
        looking_for,
        logo_url
      `)
      .not('id', 'in', `(${investedCompanyIds.join(',') || 'null'})`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOpportunities(data);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate ROI based on real investment data and valuations
  const calculateROI = () => {
    if (!portfolioValuations.length || !investorProfile?.total_invested) return '0.0%';
    
    let totalInvested = 0;
    let totalCurrentValue = 0;
    
    portfolioValuations.forEach(inv => {
      totalInvested += inv.amount || 0;
      
      // Calculate current value based on equity % and latest valuation
      if (inv.equity_percentage && inv.latestValuation) {
        totalCurrentValue += (inv.latestValuation * inv.equity_percentage / 100);
      } else {
        // If no valuation data, assume invested value unchanged
        totalCurrentValue += inv.amount || 0;
      }
    });
    
    if (totalInvested === 0) return '0.0%';
    
    const roi = ((totalCurrentValue - totalInvested) / totalInvested) * 100;
    return `${roi.toFixed(1)}%`;
  };

  const stats = [
    { 
      title: 'Total Invested', 
      value: investorProfile ? formatCurrency(investorProfile.total_invested || 0) : '$0', 
      icon: DollarSign, 
      color: 'text-green-500' 
    },
    { 
      title: 'Active Investments', 
      value: investorProfile?.portfolio_size?.toString() || '0', 
      icon: Building, 
      color: 'text-primary' 
    },
    { title: 'ROI (Est.)', value: calculateROI(), icon: TrendingUp, color: 'text-accent' },
    { title: 'Opportunities', value: opportunities.length.toString(), icon: Target, color: 'text-yellow-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero pb-6 relative">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 pt-2 sm:pt-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile: Only Avatar */}
          <div className="md:hidden flex justify-start mb-4">
            <RoleBasedAvatar 
              avatarUrl={profileWithRole?.avatar_url} 
              role="investor"
              fallbackText={user?.email || 'I'}
              className="h-16 w-16"
            />
          </div>
          
          {/* Desktop: Full Welcome Section */}
          <div className="hidden md:flex items-center space-x-4">
            <RoleBasedAvatar 
              avatarUrl={profileWithRole?.avatar_url} 
              role="investor"
              fallbackText={user?.email || 'I'}
              className="h-16 w-16"
            />
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
            <TabsList className="inline-flex w-auto lg:grid lg:w-full lg:grid-cols-9 max-w-7xl whitespace-nowrap">
              <TabsTrigger value="social" className="flex-shrink-0 gap-2">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden md:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex-shrink-0 gap-2">
                <Network className="h-4 w-4" />
                <span className="hidden md:inline">Network</span>
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex-shrink-0 gap-2">
                <Building className="h-4 w-4" />
                <span className="hidden md:inline">Portfolio</span>
              </TabsTrigger>
              <TabsTrigger value="pitches" className="flex-shrink-0 gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden md:inline">Pitches</span>
                {pendingPitchesCount > 0 && (
                  <Badge variant="destructive" className="ml-1">{pendingPitchesCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex-shrink-0 gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden md:inline">Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex-shrink-0 gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden md:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-shrink-0 gap-2">
                <BarChart className="h-4 w-4" />
                <span className="hidden md:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="flex-shrink-0 gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden md:inline">Intelligence</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex-shrink-0 gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden md:inline">Tools</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="portfolio" className="space-y-4">
            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="tech-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.title}</p>
                        <p className="text-xl font-bold">{stat.value}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                {investments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No investments recorded yet</p>
                    <p className="text-sm">Click "Record Investment" to add your first investment</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {investments.map((investment: any) => {
                      const portfolioItem = portfolioValuations.find(p => p.company_id === investment.id);
                      const currentValue = portfolioItem?.equity_percentage && portfolioItem?.latestValuation
                        ? (portfolioItem.latestValuation * portfolioItem.equity_percentage / 100)
                        : investment.funding_amount;
                      const investedAmount = portfolioItem?.amount || investment.funding_amount || 0;
                      const roi = investedAmount > 0 ? ((currentValue - investedAmount) / investedAmount * 100) : 0;
                      
                      return (
                        <Card key={investment.id} className="border border-border/50 hover:border-primary/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3 mb-3">
                              <RoleBasedAvatar 
                                avatarUrl={investment.logo_url}
                                role="startup"
                                fallbackText={investment.name}
                                className="h-10 w-10"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-foreground truncate">{investment.name}</h3>
                                  {investment.isExternal && (
                                    <Badge variant="outline" className="text-xs shrink-0">External</Badge>
                                  )}
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
                            
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full mt-3"
                              onClick={() => {
                                if (investment.isExternal) {
                                  setSelectedExternalInvestment(investment);
                                  setShowExternalDialog(true);
                                } else {
                                  // Fetch full company data for platform companies
                                  supabase
                                    .from('companies')
                                    .select('*')
                                    .eq('id', investment.id)
                                    .single()
                                    .then(({ data }) => {
                                      if (data) {
                                        setSelectedPortfolioCompany(data);
                                        setShowPortfolioDialog(true);
                                      }
                                    });
                                }
                              }}
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
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

          <TabsContent value="network" className="space-y-4">
            <MatchingSystem />
            <NetworkBrowser />
          </TabsContent>

          {/* Pitches Tab - Reorganized into 4 sections */}
          <TabsContent value="pitches" className="space-y-6">
            {/* 1. Incoming Pitch Requests (from startups TO investor) */}
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-500" />
                  Incoming Pitch Requests
                  {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.startup_id).length > 0 && (
                    <Badge variant="destructive">
                      {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.startup_id).length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.startup_id).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No incoming pitch requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.startup_id).map((meeting) => (
                      <Card key={meeting.id} className="border-orange-500/30 bg-orange-500/5">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={meeting.company?.logo_url} />
                              <AvatarFallback>{meeting.company?.name?.[0] || 'C'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{meeting.company?.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Requested by {meeting.startup?.full_name}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-sm">
                                <CalendarIcon className="h-4 w-4" />
                                {format(new Date(meeting.scheduled_date), 'PPP p')}
                              </div>
                              <Badge variant="outline" className="mt-2">
                                {meeting.duration_minutes} minutes
                              </Badge>
                            </div>
                          </div>
                          
                          {meeting.company?.pitch_deck_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(meeting.company.pitch_deck_url, '_blank')}
                              className="gap-2 w-full mt-3"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Review Pitch Deck
                            </Button>
                          )}
                          
                          <div className="flex gap-2 mt-3">
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleAcceptPitch(meeting.id)}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleRejectPitch(meeting.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Sent Pitch Requests (from investor TO startups) */}
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Presentation className="h-5 w-5 text-blue-500" />
                  Sent Pitch Requests
                  {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.investor_id).length > 0 && (
                    <Badge variant="secondary">
                      {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.investor_id).length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.investor_id).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No pending sent requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pitchMeetings.filter(m => m.status === 'pending' && m.host_id === m.investor_id).map((meeting) => (
                      <Card key={meeting.id} className="border-blue-500/30 bg-blue-500/5">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={meeting.company?.logo_url} />
                              <AvatarFallback>{meeting.company?.name?.[0] || 'C'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{meeting.company?.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Request sent to {meeting.startup?.full_name}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-sm">
                                <CalendarIcon className="h-4 w-4" />
                                {format(new Date(meeting.scheduled_date), 'PPP p')}
                              </div>
                              <Badge variant="secondary" className="mt-2">
                                <Clock className="h-3 w-3 mr-1" />
                                Awaiting Response
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Upcoming Pitches (scheduled, future date) */}
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-green-500" />
                  Upcoming Pitches
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pitchMeetings.filter(m => m.status === 'scheduled' && new Date(m.scheduled_date) >= new Date()).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No upcoming pitch meetings</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pitchMeetings
                      .filter(m => m.status === 'scheduled' && new Date(m.scheduled_date) >= new Date())
                      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                      .map((meeting) => (
                        <Card key={meeting.id} className="border-green-500/30 bg-green-500/5">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={meeting.company?.logo_url} />
                                <AvatarFallback>{meeting.company?.name?.[0] || 'C'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{meeting.company?.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  with {meeting.startup?.full_name}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-sm">
                                  <CalendarIcon className="h-4 w-4" />
                                  {format(new Date(meeting.scheduled_date), 'PPP p')}
                                </div>
                                <Badge className="mt-2 bg-green-600">Scheduled</Badge>
                              </div>
                            </div>
                            
                            {meeting.meeting_link && (
                              <Button
                                className="w-full mt-3"
                                onClick={() => setActiveVideoUrl(meeting.meeting_link)}
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Join Pitch Meeting
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. Past Pitches (scheduled/completed, past date) */}
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Past Pitches
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pitchMeetings.filter(m => 
                  (m.status === 'scheduled' || m.status === 'completed') && 
                  new Date(m.scheduled_date) < new Date()
                ).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No past pitch meetings</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pitchMeetings
                      .filter(m => 
                        (m.status === 'scheduled' || m.status === 'completed') && 
                        new Date(m.scheduled_date) < new Date()
                      )
                      .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
                      .map((meeting) => (
                        <Card key={meeting.id} className="border-muted">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={meeting.company?.logo_url} />
                                <AvatarFallback>{meeting.company?.name?.[0] || 'C'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{meeting.company?.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  with {meeting.startup?.full_name}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-sm">
                                  <CalendarIcon className="h-4 w-4" />
                                  {format(new Date(meeting.scheduled_date), 'PPP p')}
                                </div>
                                <Badge variant="secondary" className="mt-2">
                                  {meeting.status === 'completed' ? '✓ Completed' : 'Completed'}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
            {upcomingEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <div className="flex gap-4 pb-4">
                      {upcomingEvents.slice(0, 6).map(event => (
                        <div 
                          key={event.id} 
                          className="group cursor-pointer flex-shrink-0 w-[300px] sm:w-[350px]" 
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventDetails(true);
                          }}
                        >
                          <div className="relative overflow-hidden rounded-lg border hover:border-primary transition-all">
                            {event.banner_url ? (
                              <img src={event.banner_url} alt={event.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-48 bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center">
                                <CalendarIcon className="h-16 w-16 text-purple-500/30" />
                              </div>
                            )}
                            <div className="p-4 min-h-[120px] flex flex-col">
                              <h3 className="font-semibold mb-2 line-clamp-1">{event.title}</h3>
                              <div className="space-y-1 text-sm text-muted-foreground flex-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {format(parseISO(event.start_date), 'MMM d, h:mm a')}
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {event.location.startsWith('http') ? (
                                      <a 
                                        href={event.location}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline line-clamp-1"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {event.location}
                                      </a>
                                    ) : (
                                      <span className="line-clamp-1">{event.location}</span>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  {event.attendees} attending
                                  {event.max_attendees && ` / ${event.max_attendees}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
            
            {/* Unified Calendar - IN MIDDLE */}
            <UnifiedCalendar 
              showCreateButton={false}
              userRole="investor"
              filterTypes={['event', 'session', 'pitch']}
              onItemClick={(item) => {
                if (item.type === 'event') {
                  setSelectedEvent(item);
                  setShowEventDetails(true);
                } else if ((item.type === 'session' || item.type === 'pitch') && item.meeting_link) {
                  setActiveVideoUrl(item.meeting_link);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <InvestorProfileView />
            <Card>
              <CardHeader>
                <CardTitle>Investment Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <InvestorProfileForm />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Availability Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <InvestorAvailabilityManager />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Your Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfilePostsMosaic userId={user?.id || ''} isOwnProfile={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <UnifiedCommunityFeed />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {/* Investor Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6">
              {stats.map((stat) => (
                <Card key={stat.title} className="tech-card border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4">
            <MarketIntelligenceWidget />
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <AIFeaturesHub />
          </TabsContent>
        </Tabs>

        {/* Video Conferencing Dialog */}
        <Dialog open={!!activeVideoUrl} onOpenChange={(open) => !open && setActiveVideoUrl(undefined)}>
          <DialogContent className="max-w-5xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>Video Conference</DialogTitle>
            </DialogHeader>
            <div className="h-full">
              {activeVideoUrl && (
                <VideoConferencing
                  roomUrl={activeVideoUrl}
                  onLeave={() => setActiveVideoUrl(undefined)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>


      {/* Floating Chat with AI */}
      <FloatingChat />

      {/* Dialogs */}
      <CreateEventDialog 
        open={createEventDialogOpen} 
        onOpenChange={setCreateEventDialogOpen} 
        onEventCreated={() => {
          setCreateEventDialogOpen(false);
        }} 
      />
      <CreateSessionDialog 
        open={createSessionDialogOpen} 
        onOpenChange={setCreateSessionDialogOpen} 
        onSessionCreated={() => {
          setCreateSessionDialogOpen(false);
        }} 
      />
      <InvestorSchedulePitchDialog
        open={schedulePitchDialogOpen}
        onOpenChange={setSchedulePitchDialogOpen}
        onPitchScheduled={() => {
          fetchPitchMeetings();
        }}
      />
      <RecordInvestmentDialog
        open={recordInvestmentDialogOpen}
        onOpenChange={setRecordInvestmentDialogOpen}
        onInvestmentRecorded={() => {
          fetchInvestments();
          fetchInvestorProfile();
          fetchPortfolioValuations();
        }}
      />
      {selectedEvent && (
        <EventDetailsDialog 
          event={selectedEvent} 
          open={showEventDetails} 
          onOpenChange={setShowEventDetails} 
          onEventUpdated={() => {
            setShowEventDetails(false);
          }} 
        />
      )}

      {/* Platform Company Profile Dialog */}
      <StartupProfileDialog
        company={selectedPortfolioCompany}
        open={showPortfolioDialog}
        onOpenChange={(open) => {
          setShowPortfolioDialog(open);
          if (!open) setSelectedPortfolioCompany(null);
        }}
      />

      {/* External Investment Details Dialog */}
      <Dialog open={showExternalDialog} onOpenChange={(open) => {
        setShowExternalDialog(open);
        if (!open) setSelectedExternalInvestment(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Investment Details</DialogTitle>
          </DialogHeader>
          {selectedExternalInvestment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RoleBasedAvatar 
                  avatarUrl={null}
                  role="startup"
                  fallbackText={selectedExternalInvestment.name}
                  className="h-12 w-12"
                />
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
                    {selectedExternalInvestment.investment_date 
                      ? format(parseISO(selectedExternalInvestment.investment_date), 'MMM d, yyyy')
                      : 'N/A'}
                  </span>
                </div>
                {selectedExternalInvestment.external_company_website && (
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">Website</span>
                    <a 
                      href={selectedExternalInvestment.external_company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
              
              <Button variant="outline" className="w-full mt-4" onClick={() => setShowExternalDialog(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}