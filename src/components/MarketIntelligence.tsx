import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Search, TrendingUp, Building2, DollarSign, Users, ExternalLink, BarChart3, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MarketData {
  company_name?: string;
  industry?: string;
  market_size?: string;
  latest_funding?: {
    amount?: string;
    round?: string;
    date?: string;
    investors?: string[];
  };
  valuation?: string;
  competitors?: string[];
  key_metrics?: {
    employees?: string;
    founded?: string;
    location?: string;
  };
  recent_news?: string[];
  industry_trends?: string[];
  data_sources?: string[];
}

interface GovData {
  source?: string;
  establishments?: string;
  employees?: string;
  annual_payroll?: string;
  industry_code?: string;
  error?: string;
  message?: string;
  note?: string;
}

export default function MarketIntelligence() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [govData, setGovData] = useState<GovData | null>(null);
  const [rawAnalysis, setRawAnalysis] = useState('');
  const { toast } = useToast();

  const searchMarketData = async () => {
    if (!query.trim()) {
      toast({
        title: "Enter a search query",
        description: "Please enter a company name or industry to analyze",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setMarketData(null);
    setGovData(null);
    setRawAnalysis('');

    try {
      // Fetch AI-powered market intelligence
      const { data: aiData, error: aiError } = await supabase.functions.invoke('market-intelligence', {
        body: { 
          query: `Analyze the startup/company "${query}" - provide recent funding data, market position, industry trends, and competitive landscape. Include specific numbers and sources.`,
          type: 'structured'
        }
      });

      if (aiError) {
        if (aiError.message?.includes('Rate limit')) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Too many requests. Please wait a moment and try again.",
            variant: "destructive",
          });
        } else if (aiError.message?.includes('Credits exhausted')) {
          toast({
            title: "Credits Exhausted",
            description: "Please add funds to your workspace to continue.",
            variant: "destructive",
          });
        } else {
          throw aiError;
        }
        setLoading(false);
        return;
      }

      if (aiData?.data) {
        if (typeof aiData.data === 'string') {
          setRawAnalysis(aiData.data);
        } else {
          setMarketData(aiData.data);
        }
      }

      // Fetch government data if industry is identified
      const industry = typeof aiData?.data === 'object' ? aiData.data.industry : null;
      if (industry) {
        const { data: censusData } = await supabase.functions.invoke('government-data', {
          body: { dataType: 'census', industry }
        });
        
        if (censusData?.data) {
          setGovData(censusData.data);
        }
      }

    } catch (error) {
      console.error('Market intelligence error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Could not fetch market data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Market Intelligence Search</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Search for companies, startups, or industries to get real-time market data, funding information, and government statistics
          </p>
          
          <div className="flex gap-2">
            <Input
              placeholder="Enter company name or industry (e.g., 'Stripe', 'FinTech startups')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchMarketData()}
              className="flex-1"
            />
            <Button onClick={searchMarketData} disabled={loading}>
              {loading ? 'Analyzing...' : 'Search'}
            </Button>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-24 w-full" />
            </Card>
          ))}
        </div>
      )}

      {marketData && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="funding">Funding</TabsTrigger>
            <TabsTrigger value="market">Market Data</TabsTrigger>
            <TabsTrigger value="government">Gov Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Company</h3>
                </div>
                <p className="text-2xl font-bold">{marketData.company_name || 'N/A'}</p>
                <Badge className="mt-2">{marketData.industry || 'N/A'}</Badge>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Valuation</h3>
                </div>
                <p className="text-2xl font-bold">{marketData.valuation || 'N/A'}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Market Size</h3>
                </div>
                <p className="text-2xl font-bold">{marketData.market_size || 'N/A'}</p>
              </Card>

              {marketData.key_metrics && (
                <>
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="h-5 w-5 text-purple-500" />
                      <h3 className="font-semibold">Employees</h3>
                    </div>
                    <p className="text-2xl font-bold">{marketData.key_metrics.employees || 'N/A'}</p>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold">Founded</h3>
                    </div>
                    <p className="text-2xl font-bold">{marketData.key_metrics.founded || 'N/A'}</p>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Building2 className="h-5 w-5 text-cyan-500" />
                      <h3 className="font-semibold">Location</h3>
                    </div>
                    <p className="text-2xl font-bold">{marketData.key_metrics.location || 'N/A'}</p>
                  </Card>
                </>
              )}
            </div>

            {marketData.recent_news && marketData.recent_news.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Recent News</h3>
                <ul className="space-y-2">
                  {marketData.recent_news.map((news, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <ExternalLink className="h-4 w-4 mt-1 text-muted-foreground" />
                      <span className="text-sm">{news}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="funding" className="space-y-4">
            {marketData.latest_funding && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Latest Funding Round</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-3xl font-bold text-green-500">{marketData.latest_funding.amount || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Round Type</p>
                      <Badge variant="outline">{marketData.latest_funding.round || 'N/A'}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{marketData.latest_funding.date || 'N/A'}</p>
                    </div>
                  </div>
                  {marketData.latest_funding.investors && marketData.latest_funding.investors.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Investors</p>
                      <div className="flex flex-wrap gap-2">
                        {marketData.latest_funding.investors.map((investor, index) => (
                          <Badge key={index}>{investor}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="market" className="space-y-4">
            {marketData.competitors && marketData.competitors.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Competitors</h3>
                <div className="flex flex-wrap gap-2">
                  {marketData.competitors.map((competitor, index) => (
                    <Badge key={index} variant="outline">{competitor}</Badge>
                  ))}
                </div>
              </Card>
            )}

            {marketData.industry_trends && marketData.industry_trends.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Industry Trends</h3>
                <ul className="space-y-2">
                  {marketData.industry_trends.map((trend, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <BarChart3 className="h-4 w-4 mt-1 text-muted-foreground" />
                      <span className="text-sm">{trend}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {marketData.data_sources && marketData.data_sources.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Data Sources</h3>
                <ul className="space-y-1">
                  {marketData.data_sources.map((source, index) => (
                    <li key={index} className="text-sm text-muted-foreground">• {source}</li>
                  ))}
                </ul>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="government" className="space-y-4">
            {govData && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">US Government Data</h3>
                {govData.error ? (
                  <p className="text-sm text-muted-foreground">{govData.error}</p>
                ) : govData.message ? (
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-600">{govData.message}</p>
                    {govData.note && <p className="text-xs text-muted-foreground">{govData.note}</p>}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">{govData.source}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Establishments</p>
                        <p className="text-2xl font-bold">{govData.establishments}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Employees</p>
                        <p className="text-2xl font-bold">{govData.employees}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Annual Payroll</p>
                        <p className="text-2xl font-bold">{govData.annual_payroll}</p>
                      </div>
                    </div>
                    {govData.industry_code && (
                      <p className="text-xs text-muted-foreground">NAICS Code: {govData.industry_code}</p>
                    )}
                  </div>
                )}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {rawAnalysis && !marketData && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Market Analysis</h3>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{rawAnalysis}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
