import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  TrendingUp,
  Building2,
  Target,
  Sparkles,
  LineChart,
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

const trendingTopics = [
  { type: 'startup', name: 'AI SaaS', icon: Building2 },
  { type: 'industry', name: 'FinTech', icon: TrendingUp },
  { type: 'investor', name: 'Sequoia Capital', icon: Briefcase },
  { type: 'startup', name: 'Web3 Companies', icon: Building2 },
  { type: 'industry', name: 'HealthTech', icon: Globe },
];

const existingPredictions = [
  { title: 'AI Market Growth', prediction: 'AI SaaS market expected to reach $200B by 2026', trend: '+156%' },
  { title: 'FinTech Expansion', prediction: 'Digital payments to dominate 80% of transactions', trend: '+89%' },
  { title: 'Climate Tech', prediction: 'Climate tech investments projected to triple', trend: '+210%' },
];

export default function MarketIntelligenceWidget() {
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
    <div className="space-y-6">
      {/* Modern Search Section */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 via-background to-background border-primary/10">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Market Intelligence</h2>
            <p className="text-muted-foreground">AI-powered insights on startups, industries, and investors</p>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Search startups, industries, or investors..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 h-12"
            />
            <Button onClick={handleSearch} disabled={loading} size="lg" className="px-6">
              <Search className="h-4 w-4 mr-2" />
              Analyze
            </Button>
          </div>

          <div className="flex gap-2 justify-center flex-wrap">
            <Badge
              variant={searchType === 'startup' ? 'default' : 'outline'}
              onClick={() => setSearchType('startup')}
              className="cursor-pointer px-4 py-2"
            >
              <Building2 className="h-3 w-3 mr-1" />
              Startups
            </Badge>
            <Badge
              variant={searchType === 'industry' ? 'default' : 'outline'}
              onClick={() => setSearchType('industry')}
              className="cursor-pointer px-4 py-2"
            >
              <Globe className="h-3 w-3 mr-1" />
              Industries
            </Badge>
            <Badge
              variant={searchType === 'investor' ? 'default' : 'outline'}
              onClick={() => setSearchType('investor')}
              className="cursor-pointer px-4 py-2"
            >
              <Briefcase className="h-3 w-3 mr-1" />
              Investors
            </Badge>
          </div>

          {/* Trending Topics */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Trending searches:</p>
            <div className="flex gap-2 flex-wrap">
              {trendingTopics.map((topic, idx) => {
                const Icon = topic.icon;
                return (
                  <Button
                    key={idx}
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearchType(topic.type as any);
                      setQuery(topic.name);
                    }}
                    className="text-xs"
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {topic.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

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
        </div>
      )}

      {/* Market Predictions - Always Visible */}
      {!loading && !results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Market Predictions & Trends
            </h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {existingPredictions.map((pred, idx) => (
              <Card key={idx} className="p-5 hover:border-primary/50 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold">{pred.title}</h4>
                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                      {pred.trend}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pred.prediction}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <Sparkles className="h-3 w-3" />
                    AI-Generated Insight
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
