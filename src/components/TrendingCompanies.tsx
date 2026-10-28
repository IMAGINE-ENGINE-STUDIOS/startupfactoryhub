import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Sparkles, Target, Rocket, Trophy, GraduationCap, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { FlowCard, FlowSectionTitle } from '@/components/intelligence/FlowPanel';
import { cn } from '@/lib/utils';

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
      // Fetch companies with completed roadmaps (all 8 steps)
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

      // Get users who completed all 8 steps
      const fullyCompletedUserIds = Object.entries(userCompletionCount)
        .filter(([_, count]) => count >= 8)
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

  const formatFunding = (amount: number | null) => {
    if (!amount) return null;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const getStageColor = (stage: string | null) => {
    switch (stage) {
      case 'idea': return 'border-purple-400/40 bg-purple-500/10 text-purple-300';
      case 'mvp': return 'border-blue-400/40 bg-blue-500/10 text-blue-300';
      case 'seed': return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300';
      case 'series_a': return 'border-amber-400/40 bg-amber-500/10 text-amber-300';
      case 'growth': return 'border-rose-400/40 bg-rose-500/10 text-rose-300';
      default: return 'border-white/10 bg-white/5 text-muted-foreground';
    }
  };

  const Pill = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border', className)}>
      {children}
    </span>
  );

  if (isLoading) {
    return (
      <div className="space-y-4 font-mono">
        <FlowSectionTitle>flow:~$ trending.fetch</FlowSectionTitle>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <FlowCard key={i}>
              <div className="space-y-3">
                <Skeleton className="h-12 w-12 rounded bg-white/5" />
                <Skeleton className="h-4 w-3/4 bg-white/5" />
                <Skeleton className="h-3 w-full bg-white/5" />
                <Skeleton className="h-3 w-full bg-white/5" />
              </div>
            </FlowCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-mono">
      <FlowSectionTitle>flow:~$ trending.stream</FlowSectionTitle>

      <Tabs defaultValue="trending" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10 backdrop-blur-xl flex-wrap h-auto">
          <TabsTrigger value="trending" className="font-mono text-[11px] uppercase tracking-wider data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> trending
          </TabsTrigger>
          <TabsTrigger value="insights" className="font-mono text-[11px] uppercase tracking-wider data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> insights
          </TabsTrigger>
          <TabsTrigger value="predictions" className="font-mono text-[11px] uppercase tracking-wider data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200">
            <Target className="h-3.5 w-3.5 mr-1.5" /> predictions
          </TabsTrigger>
          <TabsTrigger value="success" className="font-mono text-[11px] uppercase tracking-wider data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200">
            <Trophy className="h-3.5 w-3.5 mr-1.5" /> success
          </TabsTrigger>
        </TabsList>

        {/* Trending */}
        <TabsContent value="trending" className="space-y-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {trendingData.map((company, idx) => (
              <FlowCard key={idx} interactive>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getLogoUrl(company.domain)}
                      alt={`${company.name} logo`}
                      className="w-11 h-11 object-contain rounded bg-white/90 p-1 shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/48?text=' + company.name.charAt(0);
                      }}
                    />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base font-sans truncate">{company.name}</h3>
                      <Pill className="border-white/10 bg-white/5 text-muted-foreground mt-1">{company.category}</Pill>
                    </div>
                  </div>
                  <Pill className="border-emerald-400/40 bg-emerald-500/10 text-emerald-300 shrink-0">
                    {company.change}
                  </Pill>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-violet-300">
                    <Rocket className="h-3.5 w-3.5" />
                    {company.activity}
                  </div>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    {company.description}
                  </p>
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-start gap-2 text-[11px] text-cyan-300 font-sans">
                      <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{company.prediction}</span>
                    </div>
                  </div>
                </div>
              </FlowCard>
            ))}
          </div>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            {insightsData.map((item, idx) => (
              <FlowCard key={idx} interactive>
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={getLogoUrl(item.domain)}
                    alt={`${item.company} logo`}
                    className="w-11 h-11 object-contain rounded bg-white/90 p-1 shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/48?text=' + item.company.charAt(0);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base font-sans mb-1.5">{item.company}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{item.metric}</span>
                      <Pill className="ml-auto border-violet-400/40 bg-violet-500/10 text-violet-300">{item.value}</Pill>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">{item.insight}</p>
              </FlowCard>
            ))}
          </div>
        </TabsContent>

        {/* Predictions */}
        <TabsContent value="predictions" className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            {predictionsData.map((item, idx) => (
              <FlowCard key={idx} interactive>
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={getLogoUrl(item.domain)}
                    alt={`${item.company} logo`}
                    className="w-11 h-11 object-contain rounded bg-white/90 p-1 shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/48?text=' + item.company.charAt(0);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base font-sans mb-1.5">{item.company}</h3>
                    <div className="flex gap-1.5 flex-wrap">
                      <Pill className="border-cyan-400/40 bg-cyan-500/10 text-cyan-300">
                        {item.confidence} confidence
                      </Pill>
                      <Pill className="border-white/10 bg-white/5 text-muted-foreground">
                        {item.timeframe}
                      </Pill>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm font-sans text-foreground/90">{item.prediction}</p>
                </div>
              </FlowCard>
            ))}
          </div>
        </TabsContent>

        {/* Success Stories */}
        <TabsContent value="success" className="space-y-3">
          {successStories.length === 0 ? (
            <FlowCard className="p-8 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="text-base font-semibold mb-2 font-sans">No success stories yet</h3>
              <p className="text-xs text-muted-foreground font-sans">
                Companies that complete their journey or graduate from accelerator programs will appear here.
              </p>
            </FlowCard>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {successStories.map((story) => (
                <FlowCard key={story.id} interactive>
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {story.logo_url ? (
                        <img
                          src={story.logo_url}
                          alt={`${story.name} logo`}
                          className="w-11 h-11 object-contain rounded bg-white/90 p-1 shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/48?text=' + story.name.charAt(0);
                          }}
                        />
                      ) : (
                        <div className="w-11 h-11 rounded bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shrink-0">
                          {story.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base font-sans truncate">{story.name}</h3>
                        {story.industry && (
                          <Pill className="border-white/10 bg-white/5 text-muted-foreground mt-1">
                            {story.industry}
                          </Pill>
                        )}
                      </div>
                    </div>
                    <Pill className={cn(
                      'shrink-0',
                      story.type === 'graduated'
                        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-amber-400/40 bg-amber-500/10 text-amber-300',
                    )}>
                      {story.type === 'graduated' ? (
                        <><GraduationCap className="h-3 w-3" /> graduated</>
                      ) : (
                        <><CheckCircle className="h-3 w-3" /> complete</>
                      )}
                    </Pill>
                  </div>

                  <div className="space-y-2">
                    {story.description && (
                      <p className="text-xs text-muted-foreground font-sans line-clamp-2">
                        {story.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {story.stage && (
                        <Pill className={getStageColor(story.stage)}>
                          {story.stage.replace('_', ' ')}
                        </Pill>
                      )}
                      {story.funding_amount !== null && story.funding_amount > 0 && (
                        <Pill className="border-white/10 bg-white/5 text-muted-foreground">
                          {formatFunding(story.funding_amount)} raised
                        </Pill>
                      )}
                    </div>

                    {story.graduation_date && (
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {new Date(story.graduation_date).toLocaleDateString()}
                      </div>
                    )}

                    {story.website && (
                      <a
                        href={story.website.startsWith('http') ? story.website : `https://${story.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono uppercase tracking-wider text-violet-300 hover:text-violet-200 inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        visit →
                      </a>
                    )}
                  </div>
                </FlowCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
