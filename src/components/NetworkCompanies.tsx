import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Building2, TrendingUp, MapPin, Users, DollarSign, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  logo_url: string | null;
  funding_amount: number;
  stage: string;
  location: string;
  team_size: number;
  website: string | null;
  founded_year: number | null;
}

export default function NetworkCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'funded' | 'growing'>('all');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('funding_amount', { ascending: false })
        .limit(12);

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFunding = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const getFilteredCompanies = () => {
    switch (filter) {
      case 'funded':
        return companies.filter(c => c.funding_amount > 0);
      case 'growing':
        return companies.filter(c => c.team_size > 5);
      default:
        return companies;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-32 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Companies
        </Button>
        <Button
          variant={filter === 'funded' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('funded')}
        >
          Recently Funded
        </Button>
        <Button
          variant={filter === 'growing' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('growing')}
        >
          Fast Growing
        </Button>
      </div>

      {/* Company Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {getFilteredCompanies().map((company) => (
          <Card 
            key={company.id} 
            className="p-5 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="space-y-4">
              {/* Company Logo & Name */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {company.logo_url ? (
                    <img 
                      src={company.logo_url} 
                      alt={company.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {company.name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {company.industry || 'Technology'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                {company.description || 'Building innovative solutions for the future'}
              </p>

              {/* Metrics */}
              <div className="flex flex-wrap gap-2">
                {company.funding_amount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {formatFunding(company.funding_amount)}
                  </Badge>
                )}
                {company.stage && (
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {company.stage}
                  </Badge>
                )}
              </div>

              {/* Footer Info */}
              <div className="pt-2 border-t space-y-2">
                {company.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{company.location}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{company.team_size} employees</span>
                  </div>
                  {company.founded_year && (
                    <span className="text-xs">Est. {company.founded_year}</span>
                  )}
                </div>
              </div>

              {/* Website Link */}
              {company.website && (
                <a 
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Visit website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>

      {getFilteredCompanies().length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No companies found in this category</p>
        </div>
      )}
    </div>
  );
}
