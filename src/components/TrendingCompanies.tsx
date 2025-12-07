import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Sparkles, Target, Rocket, Trophy, GraduationCap, CheckCircle } from 'lucide-react';
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

interface SuccessStoryData {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  logo_url: string | null;
  stage: string | null;
  website: string | null;
  funding_amount: number | null;
  type: 'graduated' | 'journey_complete';
  graduation_date?: string | null;
}

export default function TrendingCompanies() {
  const [trendingData, setTrendingData] = useState<CompanyData[]>([]);
  const [insightsData, setInsightsData] = useState<InsightData[]>([]);
  const [predictionsData, setPredictionsData] = useState<PredictionData[]>([]);
  const [successStories, setSuccessStories] = useState<SuccessStoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMarketData();
    fetchSuccessStories();
  }, []);

  const fetchSuccessStories = async () => {
    try {
      // Fetch companies with completed roadmaps (all 6 steps)
      const { data: roadmapProgress, error: roadmapError } = await supabase
        .from('roadmap_progress')
        .select('user_id, completed')
        .eq('completed', true);

      if (roadmapError) throw roadmapError;

      // Group by user_id and count completed steps
      const userCompletionCount: Record<string, number> = {};
      roadmapProgress?.forEach(item => {
        userCompletionCount[item.user_id] = (userCompletionCount[item.user_id] || 0) + 1;
      });

      // Get users who completed all 6 steps
      const fullyCompletedUserIds = Object.entries(userCompletionCount)
        .filter(([_, count]) => count >= 6)
        .map(([userId]) => userId);

      // Fetch their companies
      let journeyCompleteCompanies: SuccessStoryData[] = [];
      if (fullyCompletedUserIds.length > 0) {
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, description, industry, logo_url, stage, website, funding_amount')
          .in('user_id', fullyCompletedUserIds);

        if (!companiesError && companies) {
          journeyCompleteCompanies = companies.map(c => ({
            ...c,
            type: 'journey_complete' as const
          }));
        }
      }

      // Fetch graduated cohort startups
      const { data: graduates, error: graduatesError } = await supabase
        .from('cohort_startups')
        .select(`
          company_id,
          graduation_date,
          current_stage,
          companies (
            id, name, description, industry, logo_url, stage, website, funding_amount
          )
        `)
        .or('graduation_date.not.is.null,current_stage.eq.graduated');

      if (graduatesError) throw graduatesError;

      const graduatedCompanies: SuccessStoryData[] = (graduates || [])
        .filter(g => g.companies)
        .map(g => ({
          id: (g.companies as any).id,
          name: (g.companies as any).name,
          description: (g.companies as any).description,
          industry: (g.companies as any).industry,
          logo_url: (g.companies as any).logo_url,
          stage: (g.companies as any).stage,
          website: (g.companies as any).website,
          funding_amount: (g.companies as any).funding_amount,
          type: 'graduated' as const,
          graduation_date: g.graduation_date
        }));

      // Merge and deduplicate
      const allStories = [...journeyCompleteCompanies, ...graduatedCompanies];
      const uniqueStories = allStories.reduce((acc, story) => {
        const existing = acc.find(s => s.id === story.id);
        if (!existing) {
          acc.push(story);
        } else if (story.type === 'graduated' && existing.type !== 'graduated') {
          // Prefer graduated status
          const index = acc.indexOf(existing);
          acc[index] = { ...story, type: 'graduated' };
        }
        return acc;
      }, [] as SuccessStoryData[]);

      setSuccessStories(uniqueStories);
    } catch (error) {
      console.error('Error fetching success stories:', error);
    }
  };

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      // Fetch trending companies
      const { data: trendingResponse, error: trendingError } = await supabase.functions.invoke('market-intelligence', {
        body: { 
          query: 'Top trending technology startups with recent funding, acquisitions, or major product launches in 2025',
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
          query: 'Key market insights and growth metrics for major tech companies in 2025',
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
          query: 'AI and technology startup predictions for funding rounds, acquisitions, and IPOs in 2025',
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

  const formatFunding = (amount: number | null) => {
    if (!amount) return null;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const getStageColor = (stage: string | null) => {
    switch (stage) {
      case 'idea': return 'bg-purple-500/20 text-purple-700 dark:text-purple-400';
      case 'mvp': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
      case 'seed': return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'series_a': return 'bg-amber-500/20 text-amber-700 dark:text-amber-400';
      case 'growth': return 'bg-rose-500/20 text-rose-700 dark:text-rose-400';
      default: return 'bg-muted text-muted-foreground';
    }
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
        <TabsList className="w-full justify-start flex-wrap">
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
          <TabsTrigger value="success">
            <Trophy className="h-4 w-4 mr-2" />
            Success Stories
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

        {/* Success Stories Tab */}
        <TabsContent value="success" className="space-y-4">
          {successStories.length === 0 ? (
            <Card className="tech-card border-0 p-8 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Success Stories Yet</h3>
              <p className="text-sm text-muted-foreground">
                Companies that complete their journey or graduate from accelerator programs will appear here.
              </p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {successStories.map((story) => (
                <Card 
                  key={story.id}
                  className="tech-card border-0 p-5 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {story.logo_url ? (
                        <img 
                          src={story.logo_url} 
                          alt={`${story.name} logo`}
                          className="w-12 h-12 object-contain rounded bg-background p-1"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/48?text=' + story.name.charAt(0);
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {story.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{story.name}</h3>
                        {story.industry && (
                          <Badge variant="secondary" className="text-xs">
                            {story.industry}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge 
                      className={story.type === 'graduated' 
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                      }
                    >
                      {story.type === 'graduated' ? (
                        <><GraduationCap className="h-3 w-3 mr-1" /> Graduated</>
                      ) : (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Journey Complete</>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {story.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {story.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {story.stage && (
                        <Badge className={`text-xs ${getStageColor(story.stage)}`}>
                          {story.stage.replace('_', ' ')}
                        </Badge>
                      )}
                      {story.funding_amount && story.funding_amount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          💰 {formatFunding(story.funding_amount)} Raised
                        </Badge>
                      )}
                    </div>
                    
                    {story.graduation_date && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        Graduated: {new Date(story.graduation_date).toLocaleDateString()}
                      </div>
                    )}
                    
                    {story.website && (
                      <a 
                        href={story.website.startsWith('http') ? story.website : `https://${story.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Visit Website →
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
