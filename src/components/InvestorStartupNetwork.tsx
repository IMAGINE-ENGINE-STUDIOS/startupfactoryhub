import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Building, Users, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NetworkStartup {
  id: string;
  name: string;
  description: string;
  stage: string;
  industry: string;
  logo_url?: string;
  connection_type: 'invested' | 'interested';
}

export default function InvestorStartupNetwork() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startups, setStartups] = useState<NetworkStartup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNetworkStartups();
    }
  }, [user]);

  const fetchNetworkStartups = async () => {
    if (!user) return;

    try {
      // Get invested companies
      const { data: investments } = await supabase
        .from('investments')
        .select(`
          company_id,
          companies:company_id (
            id,
            name,
            description,
            stage,
            industry,
            logo_url
          )
        `)
        .eq('investor_id', user.id)
        .eq('status', 'active');

      // Get interested companies
      const { data: interests } = await supabase
        .from('investment_interests')
        .select(`
          company_id,
          companies:company_id (
            id,
            name,
            description,
            stage,
            industry,
            logo_url
          )
        `)
        .eq('investor_id', user.id)
        .in('status', ['interested', 'due_diligence']);

      const investedStartups: NetworkStartup[] = (investments || [])
        .filter(inv => inv.companies)
        .map(inv => ({
          id: inv.companies.id,
          name: inv.companies.name,
          description: inv.companies.description || '',
          stage: inv.companies.stage || 'Unknown',
          industry: inv.companies.industry || 'General',
          logo_url: inv.companies.logo_url,
          connection_type: 'invested' as const,
        }));

      const interestedStartups: NetworkStartup[] = (interests || [])
        .filter(int => int.companies && !investedStartups.some(s => s.id === int.companies.id))
        .map(int => ({
          id: int.companies.id,
          name: int.companies.name,
          description: int.companies.description || '',
          stage: int.companies.stage || 'Unknown',
          industry: int.companies.industry || 'General',
          logo_url: int.companies.logo_url,
          connection_type: 'interested' as const,
        }));

      setStartups([...investedStartups, ...interestedStartups]);
    } catch (error) {
      console.error('Error fetching network startups:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading network...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Your Startup Network
        </CardTitle>
      </CardHeader>
      <CardContent>
        {startups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No startups in your network yet</p>
            <p className="text-sm mt-1">Start by expressing interest in startups</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {startups.map((startup) => (
              <Card key={startup.id} className="border border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      {startup.logo_url ? (
                        <AvatarImage src={startup.logo_url} alt={startup.name} />
                      ) : (
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {startup.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{startup.name}</h3>
                      <Badge
                        variant={startup.connection_type === 'invested' ? 'default' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {startup.connection_type === 'invested' ? 'Invested' : 'Interested'}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {startup.description}
                  </p>
                  
                  <div className="flex gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">{startup.stage}</Badge>
                    <Badge variant="outline" className="text-xs">{startup.industry}</Badge>
                  </div>
                  
                  <Button size="sm" variant="outline" className="w-full">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
