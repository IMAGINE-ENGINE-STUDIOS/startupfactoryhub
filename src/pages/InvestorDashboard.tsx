import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, Building, TrendingUp, Target } from 'lucide-react';
import DashboardNavigation from '@/components/DashboardNavigation';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';
import AchievementsBadges from '@/components/dashboard/AchievementsBadges';
import AIAssistantPreview from '@/components/AIAssistantPreview';
import AIAssistantButton from '@/components/AIAssistantButton';
import FloatingChat from '@/components/FloatingChat';
import ShortsCarousel from '@/components/ShortsCarousel';
import { useNavigate } from 'react-router-dom';

export default function InvestorDashboard() {
  const [investorProfile, setInvestorProfile] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchInvestorProfile();
      fetchOpportunities();
    }
  }, [user]);

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

  const fetchOpportunities = async () => {
    if (!user) return;

    const { data: existingInvestments } = await supabase
      .from('investments')
      .select('company_id')
      .eq('investor_id', user.id);

    const investedCompanyIds = existingInvestments?.map(i => i.company_id) || [];

    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .not('id', 'in', `(${investedCompanyIds.join(',') || 'null'})`)
      .order('created_at', { ascending: false })
      .limit(8);

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

  const calculateROI = () => {
    if (!investorProfile?.total_invested) return '0.0%';
    const averageGrowth = 25;
    return `${averageGrowth.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <DashboardNavigation />
      
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Welcome Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Investor Feed</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Discover opportunities and connect with startups
          </p>
        </div>

        {/* Main Feed Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <UnifiedCommunityFeed showCreatePost={true} />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Investment Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Investment Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Total Invested</span>
                  </div>
                  <span className="font-bold">
                    {investorProfile ? formatCurrency(investorProfile.total_invested || 0) : '$0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Portfolio</span>
                  </div>
                  <span className="font-bold">{investorProfile?.portfolio_size || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    <span className="text-sm text-muted-foreground">ROI</span>
                  </div>
                  <span className="font-bold">{calculateROI()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Opportunities</span>
                  </div>
                  <span className="font-bold">{opportunities.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Achievement Badges */}
            <AchievementsBadges />
            
            {/* Shorts Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Trending Shorts</CardTitle>
              </CardHeader>
              <CardContent>
                <ShortsCarousel onCreateShort={() => navigate('/feed')} />
              </CardContent>
            </Card>

            {/* AI Assistant Preview */}
            <AIAssistantPreview />
          </div>
        </div>
      </div>

      {/* Floating Buttons */}
      <AIAssistantButton />
      <FloatingChat />
    </div>
  );
}
