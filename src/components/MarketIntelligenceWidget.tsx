import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { FlowCard, FlowSectionTitle } from '@/components/intelligence/FlowPanel';
import { cn } from '@/lib/utils';

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

interface MarketPrediction {
  title: string;
  prediction: string;
  trend: string;
}

export default function MarketIntelligenceWidget() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'startup' | 'industry' | 'investor'>('startup');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [predictions, setPredictions] = useState<MarketPrediction[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(true);

  useEffect(() => {
    fetchMarketPredictions();
  }, []);

  const fetchMarketPredictions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('market-predictions');
      
      if (error) throw error;
      
      if (data?.predictions) {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      // Fallback predictions
      setPredictions([
        { title: 'AI Market Growth', prediction: 'AI market projected to reach $190B by 2026', trend: '+145%' },
        { title: 'FinTech Expansion', prediction: 'Digital payments adoption growing to 75% globally', trend: '+82%' },
        { title: 'Climate Tech', prediction: 'Climate tech funding expected to double by 2026', trend: '+198%' },
      ]);
    } finally {
      setLoadingPredictions(false);
    }
  };

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
    <div className="space-y-6 font-mono">
      {/* Search bar — terminal prompt style */}
      <div className="space-y-3">
        <FlowSectionTitle>flow:~$ market.query</FlowSectionTitle>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="search startups, industries, or investors…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 h-11 bg-white/5 border-white/10 backdrop-blur-xl font-mono text-sm placeholder:text-muted-foreground/50 focus-visible:ring-violet-500/40"
          />
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="w-full sm:w-auto sm:px-6 h-11 bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-white border-0 hover:opacity-90 font-mono uppercase tracking-wider text-xs"
          >
            <Search className="h-4 w-4 mr-2" />
            Analyze
          </Button>
        </div>

        {/* Type filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { id: 'startup', label: 'startups', icon: Building2 },
            { id: 'industry', label: 'industries', icon: Globe },
            { id: 'investor', label: 'investors', icon: Briefcase },
          ].map((t) => {
            const Icon = t.icon;
            const active = searchType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSearchType(t.id as any)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-wider transition-all border',
                  active
                    ? 'bg-gradient-to-br from-indigo-500/20 via-violet-500/20 to-cyan-400/20 border-violet-400/50 text-violet-200 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.6)]'
                    : 'border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:border-white/20',
                )}
              >
                <Icon className="h-3 w-3" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Trending suggestions */}
        <div className="space-y-2">
          <FlowSectionTitle className="text-[10px]">// trending</FlowSectionTitle>
          <div className="flex gap-1.5 flex-wrap">
            {trendingTopics.map((topic, idx) => {
              const Icon = topic.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchType(topic.type as any);
                    setQuery(topic.name);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-mono border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:border-violet-400/30 transition-all"
                >
                  <Icon className="h-3 w-3" />
                  {topic.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <FlowCard>
            <Skeleton className="h-7 w-64 mb-3 bg-white/5" />
            <Skeleton className="h-4 w-full mb-2 bg-white/5" />
            <Skeleton className="h-4 w-3/4 bg-white/5" />
          </FlowCard>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Skeleton className="h-28 bg-white/5" />
            <Skeleton className="h-28 bg-white/5" />
            <Skeleton className="h-28 bg-white/5" />
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="space-y-5">
          <FlowCard className="p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                    {results.name}
                  </h2>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-violet-400/40 bg-violet-500/10 text-violet-300">
                    {results.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-sans">{results.description}</p>
              </div>
              <Activity className="h-6 w-6 text-violet-400 flex-shrink-0" />
            </div>
          </FlowCard>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(results.metrics).slice(0, 4).map(([key, value]) => (
              <FlowCard key={key} interactive className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <TrendingUp className="h-3 w-3 text-violet-400" />
                </div>
                <p className="text-xl font-bold font-sans">{String(value)}</p>
              </FlowCard>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="insights" className="space-y-3">
            <TabsList className="bg-white/5 border border-white/10 backdrop-blur-xl">
              <TabsTrigger value="insights" className="font-mono text-[11px] uppercase tracking-wider data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> insights
              </TabsTrigger>
              <TabsTrigger value="predictions" className="font-mono text-[11px] uppercase tracking-wider data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200">
                <Target className="h-3.5 w-3.5 mr-1.5" /> predictions
              </TabsTrigger>
              <TabsTrigger value="trends" className="font-mono text-[11px] uppercase tracking-wider data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200">
                <LineChart className="h-3.5 w-3.5 mr-1.5" /> trends
              </TabsTrigger>
            </TabsList>

            <TabsContent value="insights">
              <div className="grid sm:grid-cols-2 gap-3">
                {results.insights.map((insight, idx) => (
                  <FlowCard key={idx} interactive className="p-3">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm font-sans text-foreground/90">{insight}</p>
                    </div>
                  </FlowCard>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="predictions">
              <div className="space-y-2">
                {results.predictions.map((prediction, idx) => (
                  <FlowCard key={idx} interactive className="p-3">
                    <div className="flex items-start gap-2.5">
                      <Target className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm font-sans text-foreground/90">{prediction}</p>
                    </div>
                  </FlowCard>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trends">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {results.trends.map((trend, idx) => (
                  <FlowCard key={idx} interactive className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{trend.label}</span>
                      <span
                        className={cn(
                          'text-[10px] font-mono px-1.5 py-0.5 rounded border',
                          trend.change >= 0
                            ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                            : 'border-red-400/40 bg-red-500/10 text-red-300',
                        )}
                      >
                        {trend.change >= 0 ? '+' : ''}{trend.change}%
                      </span>
                    </div>
                    <p className="text-xl font-bold mb-1.5 font-sans">{trend.value}</p>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.abs(trend.change) * 10)}%` }}
                      />
                    </div>
                  </FlowCard>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Predictions list (default state) */}
      {!loading && !results && (
        <div className="space-y-3">
          <FlowSectionTitle>flow:~$ predictions.stream</FlowSectionTitle>

          {loadingPredictions ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {predictions.map((pred, idx) => (
                <FlowCard key={idx} interactive className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm font-sans">{pred.title}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-400/40 bg-emerald-500/10 text-emerald-300 flex-shrink-0">
                        {pred.trend}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                      {pred.prediction}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-violet-300">
                      <Sparkles className="h-3 w-3" />
                      ai inference
                    </div>
                  </div>
                </FlowCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
