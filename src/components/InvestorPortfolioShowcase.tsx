import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, ExternalLink, TrendingUp } from 'lucide-react';

interface PortfolioCompany {
  id: string;
  company_name: string;
  company_logo_url?: string;
  industry?: string;
  stage?: string;
  investment_amount?: number;
  investment_year?: number;
  exit_status: string;
  website?: string;
  description?: string;
}

interface InvestorPortfolioShowcaseProps {
  investorId: string;
  showTitle?: boolean;
  limit?: number;
}

export default function InvestorPortfolioShowcase({ 
  investorId, 
  showTitle = true,
  limit 
}: InvestorPortfolioShowcaseProps) {
  const [portfolio, setPortfolio] = useState<PortfolioCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
  }, [investorId]);

  const fetchPortfolio = async () => {
    setLoading(true);
    
    let query = supabase
      .from('portfolio_companies')
      .select('*')
      .eq('investor_id', investorId)
      .order('investment_year', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (!error && data) {
      setPortfolio(data);
    }
    setLoading(false);
  };

  const getExitStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500 border-green-500/20',
      acquired: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      ipo: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      closed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };
    return colors[status] || colors.active;
  };

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Investment Portfolio
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Loading portfolio...</p>
        </CardContent>
      </Card>
    );
  }

  if (portfolio.length === 0) {
    return null; // Don't show anything if no portfolio
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Investment Portfolio ({portfolio.length})
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolio.map((company) => (
            <Card key={company.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    {company.company_logo_url ? (
                      <AvatarImage src={company.company_logo_url} alt={company.company_name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {company.company_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{company.company_name}</h4>
                    {company.investment_year && (
                      <p className="text-xs text-muted-foreground">
                        {company.investment_year}
                      </p>
                    )}
                  </div>
                </div>
                
                {company.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {company.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {company.industry && (
                    <Badge variant="secondary" className="text-xs">
                      {company.industry}
                    </Badge>
                  )}
                  {company.stage && (
                    <Badge variant="outline" className="text-xs">
                      {company.stage}
                    </Badge>
                  )}
                  <Badge className={`text-xs ${getExitStatusBadge(company.exit_status)}`}>
                    {company.exit_status.charAt(0).toUpperCase() + company.exit_status.slice(1)}
                  </Badge>
                </div>
                
                {company.investment_amount && (
                  <div className="flex items-center gap-1 text-sm text-green-600 mb-2">
                    <TrendingUp className="h-3 w-3" />
                    <span className="font-semibold">
                      ${(company.investment_amount / 1000000).toFixed(1)}M
                    </span>
                  </div>
                )}
                
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Website
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
