import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Sparkles, Target, Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface CompanyData {
  name: string;
  domain: string;
  activity: string;
  description: string;
  category: string;
  prediction: string;
  change: string;
  color: string;
}

interface InsightData {
  company: string;
  domain: string;
  insight: string;
  metric: string;
  value: string;
  color: string;
}

interface PredictionData {
  company: string;
  domain: string;
  prediction: string;
  confidence: string;
  timeframe: string;
  color: string;
}

export default function TrendingCompanies() {
  const [trendingData, setTrendingData] = useState<CompanyData[]>([]);
  const [insightsData, setInsightsData] = useState<InsightData[]>([]);
  const [predictionsData, setPredictionsData] = useState<PredictionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      // Fetch trending companies
      const { data: trendingResponse, error: trendingError } = await supabase.functions.invoke('market-intelligence', {
        body: { 
          query: 'Top trending technology startups with recent funding, acquisitions, or major product launches',
          type: 'STARTUPS'
        }
      });

      if (trendingError) throw trendingError;
      if (trendingResponse?.companies) {
        setTrendingData(trendingResponse.companies.slice(0, 6));
      }

      // Fetch market insights
      const { data: insightsResponse, error: insightsError } = await supabase.functions.invoke('market-intelligence', {
        body: { 
          query: 'Key market insights and growth metrics for major tech companies',
          type: 'INDUSTRIES'
        }
      });

      if (insightsError) throw insightsError;
      if (insightsResponse?.insights) {
        setInsightsData(insightsResponse.insights.slice(0, 4));
      }

      // Fetch predictions
      const { data: predictionsResponse, error: predictionsError } = await supabase.functions.invoke('market-intelligence', {
        body: { 
          query: 'AI and technology startup predictions for funding rounds, acquisitions, and IPOs',
          type: 'STARTUPS'
        }
      });

      if (predictionsError) throw predictionsError;
      if (predictionsResponse?.predictions) {
        setPredictionsData(predictionsResponse.predictions.slice(0, 4));
      }

    } catch (error) {
      console.error('Error fetching market data:', error);
      toast({
        title: "Error loading market data",
        description: "Failed to fetch real-time market intelligence. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLogoUrl = (domain: string) => {
    return `https://logo.clearbit.com/${domain}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-5">
              <div className="space-y-3">
                <Skeleton className="h-12 w-12 rounded" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs for different views */}
      <Tabs defaultValue="trending" className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Sparkles className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="predictions">
            <Target className="h-4 w-4 mr-2" />
            Predictions
          </TabsTrigger>
        </TabsList>

        {/* Trending Tab */}
        <TabsContent value="trending" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingData.map((company, idx) => (
              <Card 
                key={idx} 
                className={`p-5 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br ${company.color} border-primary/20`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={getLogoUrl(company.domain)} 
                      alt={`${company.name} logo`}
                      className="w-12 h-12 object-contain rounded bg-white p-1"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/48?text=' + company.name.charAt(0);
                      }}
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{company.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {company.category}
                      </Badge>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                    {company.change}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Rocket className="h-4 w-4 text-primary" />
                    {company.activity}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {company.description}
                  </p>
                  <div className="pt-2 border-t">
                    <div className="flex items-start gap-2 text-xs text-primary">
                      <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{company.prediction}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {insightsData.map((item, idx) => (
              <Card 
                key={idx}
                className={`p-5 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br ${item.color} border-primary/20`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <img 
                    src={getLogoUrl(item.domain)} 
                    alt={`${item.company} logo`}
                    className="w-12 h-12 object-contain rounded bg-white p-1"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/48?text=' + item.company.charAt(0);
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{item.company}</h3>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{item.metric}</span>
                      <Badge className="ml-auto">{item.value}</Badge>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{item.insight}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {predictionsData.map((item, idx) => (
              <Card 
                key={idx}
                className={`p-5 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br ${item.color} border-primary/20`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <img 
                    src={getLogoUrl(item.domain)} 
                    alt={`${item.company} logo`}
                    className="w-12 h-12 object-contain rounded bg-white p-1"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/48?text=' + item.company.charAt(0);
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{item.company}</h3>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.confidence} Confidence
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {item.timeframe}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{item.prediction}</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
