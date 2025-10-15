import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Search, Building, TrendingUp, DollarSign, Users, Filter, Sparkles, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StartupProfileDialog from './StartupProfileDialog';

interface Company {
  id: string;
  name: string;
  description: string;
  stage: string;
  industry: string;
  funding_amount: number;
  team_size: number;
  location: string;
  looking_for: string[];
  user_id: string;
  ai_summary_id?: string;
  logo_url?: string;
  pitch_deck_url?: string;
  website?: string;
}

export default function StartupBrowser() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchQuery, stageFilter, industryFilter, companies]);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCompanies(data);
    }
    setLoading(false);
  };

  const filterCompanies = () => {
    let filtered = [...companies];

    if (searchQuery) {
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.industry?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (stageFilter !== 'all') {
      filtered = filtered.filter((company) => company.stage === stageFilter);
    }

    if (industryFilter !== 'all') {
      filtered = filtered.filter((company) => company.industry === industryFilter);
    }

    setFilteredCompanies(filtered);
  };

  const expressInterest = async (companyId: string, companyName: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to express interest",
        variant: "destructive",
      });
      return;
    }

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

      setDialogOpen(false);
      fetchCompanies(); // Refresh to update connection status
    } catch (error) {
      console.error('Error expressing interest:', error);
      toast({
        title: "Error",
        description: "Failed to express interest. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return 'Not disclosed';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];
  const stages = [...new Set(companies.map(c => c.stage).filter(Boolean))];

  return (
    <div className="space-y-6">
      <Card className="tech-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Browse Startups
            <Badge variant="secondary" className="ml-auto">
              {filteredCompanies.length} startups
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search startups by name, industry, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Startups Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading startups...</p>
            </div>
          ) : filteredCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map((company) => (
                <Card key={company.id} className="border border-border hover:border-primary transition-colors">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {company.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{company.name}</h3>
                        <p className="text-xs text-muted-foreground">{company.location || 'Remote'}</p>
                      </div>
                       {company.ai_summary_id && (
                        <Badge variant="outline" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                        </Badge>
                      )}
                      {company.pitch_deck_url && (
                        <Badge variant="outline" className="gap-1 text-primary">
                          <FileText className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {company.description || 'No description available'}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {company.stage || 'Unspecified'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {company.industry || 'General'}
                        </Badge>
                      </div>

                      {company.team_size && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{company.team_size} team members</span>
                        </div>
                      )}

                      {company.funding_amount && (
                        <div className="flex items-center gap-2 text-xs font-medium text-primary">
                          <DollarSign className="h-3 w-3" />
                          <span>Seeking: {formatCurrency(company.funding_amount)}</span>
                        </div>
                      )}

                      {company.looking_for && company.looking_for.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {company.looking_for.slice(0, 2).map((item, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                          {company.looking_for.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{company.looking_for.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCompany(company);
                          setDialogOpen(true);
                        }}
                      >
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => expressInterest(company.id, company.name)}
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Interested
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No startups found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setStageFilter('all');
                  setIndustryFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <StartupProfileDialog 
        company={selectedCompany}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onExpressInterest={(companyId) => {
          if (selectedCompany) {
            expressInterest(companyId, selectedCompany.name);
          }
        }}
      />
    </div>
  );
}
