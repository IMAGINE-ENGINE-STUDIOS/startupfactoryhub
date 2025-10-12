import { useState } from 'react';
import DashboardNavigation from '@/components/DashboardNavigation';
import TrendingCompanies from '@/components/TrendingCompanies';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  TrendingUp,
  Building2,
  Users,
  DollarSign,
  Target,
  Sparkles,
  LineChart,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Briefcase,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchResult {
  type: 'startup' | 'industry' | 'investor';
  name: string;
  description: string;
  metrics: Record<string, any>;
  insights: string[];
  predictions: string[];
  trends: Array<{ label: string; value: number; change: number }>;
}

export default function MarketIntelligence() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'startup' | 'industry' | 'investor'>('startup');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Search required",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-intelligence', {
        body: {
          query: query.trim(),
          type: searchType,
        },
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Analysis complete",
        description: "Market intelligence data retrieved successfully",
      });
    } catch (error) {
      console.error('Market intelligence error:', error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Failed to fetch market data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      
      <div className="container mx-auto px-6 py-8 pt-24">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Market Intelligence</h1>
              <p className="text-muted-foreground">
                AI-powered insights on startups, industries, and investors
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <Card className="p-6 mb-8">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={searchType === 'startup' ? 'default' : 'outline'}
                onClick={() => setSearchType('startup')}
                className="flex-1"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Startups
              </Button>
              <Button
                variant={searchType === 'industry' ? 'default' : 'outline'}
                onClick={() => setSearchType('industry')}
                className="flex-1"
              >
                <Globe className="h-4 w-4 mr-2" />
                Industries
              </Button>
              <Button
                variant={searchType === 'investor' ? 'default' : 'outline'}
                onClick={() => setSearchType('investor')}
                className="flex-1"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Investors
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder={`Search for ${searchType}s... (e.g., ${
                  searchType === 'startup' ? 'AI SaaS companies' :
                  searchType === 'industry' ? 'FinTech industry' :
                  'Sequoia Capital'
                })`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Analyze
              </Button>
            </div>
          </div>
        </Card>

        {/* Trending Companies Section - Only show when no results */}
        {!loading && !results && (
          <div className="mb-8">
            <TrendingCompanies />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <Card className="p-6">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
            <div className="grid md:grid-cols-3 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && results && (
          <div className="space-y-6">
            {/* Overview Card */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold">{results.name}</h2>
                    <Badge>{results.type}</Badge>
                  </div>
                  <p className="text-muted-foreground">{results.description}</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </Card>

            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-4">
              {Object.entries(results.metrics).slice(0, 4).map(([key, value]) => (
                <Card key={key} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{value}</p>
                </Card>
              ))}
            </div>

            {/* Tabs for detailed data */}
            <Tabs defaultValue="insights" className="space-y-4">
              <TabsList>
                <TabsTrigger value="insights">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Insights
                </TabsTrigger>
                <TabsTrigger value="predictions">
                  <Target className="h-4 w-4 mr-2" />
                  Predictions
                </TabsTrigger>
                <TabsTrigger value="trends">
                  <LineChart className="h-4 w-4 mr-2" />
                  Trends
                </TabsTrigger>
              </TabsList>

              <TabsContent value="insights">
                <div className="grid md:grid-cols-2 gap-4">
                  {results.insights.map((insight, idx) => (
                    <Card key={idx} className="p-4 bg-primary/5 border-primary/20">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{insight}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="predictions">
                <div className="space-y-3">
                  {results.predictions.map((prediction, idx) => (
                    <Card key={idx} className="p-4 bg-blue-500/5 border-blue-500/20">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{prediction}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="trends">
                <div className="grid md:grid-cols-3 gap-4">
                  {results.trends.map((trend, idx) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{trend.label}</span>
                        <Badge variant={trend.change >= 0 ? 'default' : 'secondary'}>
                          {trend.change >= 0 ? '+' : ''}{trend.change}%
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold mb-1">{trend.value}</p>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.abs(trend.change) * 10)}%` }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* Additional Metrics Grid */}
            {Object.keys(results.metrics).length > 4 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Additional Metrics</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(results.metrics).slice(4).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !results && (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Search className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Start Your Market Research
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Search for startups, industries, or investors to get AI-powered insights,
                  predictions, and real-time market intelligence.
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <Badge variant="outline">Real-time Data</Badge>
                <Badge variant="outline">AI Analysis</Badge>
                <Badge variant="outline">Market Predictions</Badge>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
