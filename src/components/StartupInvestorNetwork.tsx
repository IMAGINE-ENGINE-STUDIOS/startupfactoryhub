import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, Users, MessageSquare, TrendingUp, Eye, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InvestorProfileDialog from './InvestorProfileDialog';
import BookPitchDialog from './BookPitchDialog';

interface Investor {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  preferred_industries: string[];
  preferred_stages?: string[];
  investment_range_min?: number;
  investment_range_max?: number;
  portfolio_size?: number;
  total_invested?: number;
  bio?: string;
  connection_type: 'invested' | 'interested';
  investment_amount?: number;
  investment_date?: string;
}

export default function StartupInvestorNetwork() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookPitchOpen, setBookPitchOpen] = useState(false);
  const [pitchInvestor, setPitchInvestor] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    if (user) {
      fetchCompanyAndInvestors();
    }
  }, [user]);

  const fetchCompanyAndInvestors = async () => {
    if (!user) return;

    try {
      // Get company ID and name
      const { data: company } = await supabase
        .from('companies')
        .select('id, name')
        .eq('user_id', user.id)
        .single();

      if (!company) {
        setLoading(false);
        return;
      }

      setCompanyId(company.id);
      setCompanyName(company.name);

      // Get investors who have invested
      const { data: investments } = await supabase
        .from('investments')
        .select('investor_id, amount, investment_date')
        .eq('company_id', company.id)
        .eq('status', 'active');

      // Get investors who are interested
      const { data: interests } = await supabase
        .from('investment_interests')
        .select('investor_id')
        .eq('company_id', company.id)
        .in('status', ['interested', 'due_diligence']);

      const investorIds = [
        ...(investments?.map(i => i.investor_id) || []),
        ...(interests?.map(i => i.investor_id) || [])
      ];

      if (investorIds.length === 0) {
        setInvestors([]);
        setLoading(false);
        return;
      }

      // Fetch investor profiles
      const { data: investorProfiles } = await supabase
        .from('investor_profiles')
        .select('*')
        .in('user_id', investorIds);

      // Fetch user profiles
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', investorIds);

      const investorsList = investorIds.map(investorId => {
        const investment = investments?.find(i => i.investor_id === investorId);
        const investorProfile = investorProfiles?.find(ip => ip.user_id === investorId);
        const userProfile = userProfiles?.find(up => up.user_id === investorId);

        if (!investorProfile || !userProfile) return null;

        const investor: Investor = {
          id: investorProfile.id,
          user_id: investorId,
          full_name: userProfile.full_name || 'Unknown',
          avatar_url: userProfile.avatar_url || undefined,
          preferred_industries: investorProfile.preferred_industries || [],
          preferred_stages: investorProfile.preferred_stages || [],
          investment_range_min: investorProfile.investment_range_min || undefined,
          investment_range_max: investorProfile.investment_range_max || undefined,
          portfolio_size: investorProfile.portfolio_size || undefined,
          total_invested: investorProfile.total_invested || undefined,
          bio: userProfile.bio || undefined,
          connection_type: investment ? 'invested' : 'interested',
          investment_amount: investment?.amount || undefined,
          investment_date: investment?.investment_date || undefined
        };
        return investor;
      }).filter(inv => inv !== null) as Investor[];

      setInvestors(investorsList);
    } catch (error) {
      console.error('Error fetching investor network:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageInvestor = (investorId: string) => {
    navigate('/messages', { state: { userId: investorId } });
  };

  const handleViewProfile = (investor: Investor) => {
    setSelectedInvestor(investor);
    setDialogOpen(true);
  };

  const handleBookPitch = (investor: Investor) => {
    setPitchInvestor({ id: investor.user_id, name: investor.full_name });
    setBookPitchOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your investor network...</p>
        </CardContent>
      </Card>
    );
  }

  if (investors.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-semibold mb-2">No Investors Yet</h3>
          <p className="text-muted-foreground mb-4">
            Connect with investors who can help fund and grow your startup
          </p>
          <Button onClick={() => navigate('/explore')}>
            <Users className="h-4 w-4 mr-2" />
            Find Investors
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeInvestors = investors.filter(i => i.connection_type === 'invested');
  const interestedInvestors = investors.filter(i => i.connection_type === 'interested');

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  return (
    <div className="space-y-6">
      {activeInvestors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Active Investors ({activeInvestors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeInvestors.map((investor) => (
                <Card key={investor.id} className="hover:shadow-md transition-shadow border-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={investor.avatar_url} alt={investor.full_name} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {investor.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{investor.full_name}</h4>
                        <Badge className="bg-green-500/10 text-green-500 text-xs mt-1">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Invested
                        </Badge>
                      </div>
                    </div>

                    {investor.investment_amount && (
                      <div className="mb-3 p-3 bg-green-500/5 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Investment</span>
                          <span className="font-semibold text-green-500">
                            {formatCurrency(investor.investment_amount)}
                          </span>
                        </div>
                        {investor.investment_date && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(investor.investment_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}

                    {investor.bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {investor.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {investor.preferred_industries?.slice(0, 2).map((industry, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {industry}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewProfile(investor)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleBookPitch(investor)}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Pitch
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleMessageInvestor(investor.user_id)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                    </div>

                    {investor.portfolio_size && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Portfolio: {investor.portfolio_size} companies
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {interestedInvestors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Interested Investors ({interestedInvestors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interestedInvestors.map((investor) => (
                <Card key={investor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={investor.avatar_url} alt={investor.full_name} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {investor.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{investor.full_name}</h4>
                        <Badge variant="outline" className="text-xs mt-1">
                          Interested
                        </Badge>
                      </div>
                    </div>

                    {investor.investment_range_min && investor.investment_range_max && (
                      <div className="mb-3 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Range</span>
                          <span className="font-semibold">
                            {formatCurrency(investor.investment_range_min)} - {formatCurrency(investor.investment_range_max)}
                          </span>
                        </div>
                      </div>
                    )}

                    {investor.bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {investor.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {investor.preferred_industries?.slice(0, 2).map((industry, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {industry}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewProfile(investor)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleBookPitch(investor)}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Pitch
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleMessageInvestor(investor.user_id)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <InvestorProfileDialog
        investor={selectedInvestor}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onMessage={handleMessageInvestor}
      />

      {companyId && companyName && pitchInvestor && (
        <BookPitchDialog
          open={bookPitchOpen}
          onOpenChange={setBookPitchOpen}
          investorId={pitchInvestor.id}
          investorName={pitchInvestor.name}
          companyId={companyId}
          companyName={companyName}
        />
      )}
    </div>
  );
}
