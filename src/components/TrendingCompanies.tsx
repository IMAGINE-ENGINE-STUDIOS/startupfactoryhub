import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, TrendingUp, Sparkles, Target, Rocket, DollarSign } from 'lucide-react';

const trendingData = [
  {
    name: 'Anthropic',
    logo: '🤖',
    activity: 'Series D Funding',
    description: '$7B valuation after latest funding round',
    category: 'AI/ML',
    prediction: 'Likely to reach unicorn status within 6 months',
    change: '+250%',
    color: 'from-purple-500/10 to-pink-500/10'
  },
  {
    name: 'Stripe',
    logo: '💳',
    activity: 'Product Launch',
    description: 'Launched new embedded finance platform',
    category: 'FinTech',
    prediction: 'Expected to expand into 15 new markets',
    change: '+45%',
    color: 'from-blue-500/10 to-cyan-500/10'
  },
  {
    name: 'OpenAI',
    logo: '🧠',
    activity: 'Partnership',
    description: 'Strategic partnership with Microsoft expanded',
    category: 'AI/ML',
    prediction: 'Revenue projected to exceed $2B this year',
    change: '+180%',
    color: 'from-green-500/10 to-emerald-500/10'
  },
  {
    name: 'Figma',
    logo: '🎨',
    activity: 'User Milestone',
    description: 'Reached 10M+ active users',
    category: 'Design Tools',
    prediction: 'Strong acquisition target for major tech companies',
    change: '+90%',
    color: 'from-orange-500/10 to-amber-500/10'
  },
  {
    name: 'Notion',
    logo: '📝',
    activity: 'Market Expansion',
    description: 'Expanding AI features and enterprise solutions',
    category: 'Productivity',
    prediction: 'IPO expected within next 12-18 months',
    change: '+120%',
    color: 'from-indigo-500/10 to-violet-500/10'
  },
  {
    name: 'Databricks',
    logo: '📊',
    activity: 'Revenue Milestone',
    description: 'ARR surpasses $1.5B',
    category: 'Data & Analytics',
    prediction: 'Market leader in lakehouse architecture',
    change: '+65%',
    color: 'from-red-500/10 to-rose-500/10'
  }
];

const insightsData = [
  {
    company: 'Canva',
    logo: '🖼️',
    insight: 'AI-powered design features driving 40% user growth',
    metric: 'Growth Rate',
    value: '+40%',
    color: 'from-teal-500/10 to-cyan-500/10'
  },
  {
    company: 'Coinbase',
    logo: '💰',
    insight: 'Regulatory clarity improving institutional adoption',
    metric: 'Institutional Users',
    value: '+85%',
    color: 'from-blue-500/10 to-indigo-500/10'
  },
  {
    company: 'SpaceX',
    logo: '🚀',
    insight: 'Starlink revenue exceeding satellite launch revenue',
    metric: 'Revenue Split',
    value: '60/40',
    color: 'from-slate-500/10 to-gray-500/10'
  },
  {
    company: 'Rivian',
    logo: '🔋',
    insight: 'Production capacity doubled, meeting delivery targets',
    metric: 'Production Rate',
    value: '+110%',
    color: 'from-green-500/10 to-lime-500/10'
  }
];

const predictionsData = [
  {
    company: 'Mistral AI',
    logo: '⚡',
    prediction: 'Expected to raise Series C at $5B+ valuation in Q2 2025',
    confidence: 'High',
    timeframe: '3-6 months',
    color: 'from-violet-500/10 to-purple-500/10'
  },
  {
    company: 'Perplexity',
    logo: '🔍',
    prediction: 'Likely acquisition target for major search engines',
    confidence: 'Medium',
    timeframe: '6-12 months',
    color: 'from-cyan-500/10 to-blue-500/10'
  },
  {
    company: 'Character.AI',
    logo: '💬',
    prediction: 'Strategic partnership with social media platform incoming',
    confidence: 'High',
    timeframe: '1-3 months',
    color: 'from-pink-500/10 to-rose-500/10'
  },
  {
    company: 'Scale AI',
    logo: '📈',
    prediction: 'IPO preparation underway, public listing expected',
    confidence: 'Medium',
    timeframe: '12-18 months',
    color: 'from-emerald-500/10 to-teal-500/10'
  }
];

export default function TrendingCompanies() {
  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="text-center space-y-4">
        <Badge className="bg-primary">This month on Market Intelligence</Badge>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-4xl font-bold mb-1">12,082,957</div>
            <div className="text-sm text-muted-foreground">new predictions</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-1">53,719</div>
            <div className="text-sm text-muted-foreground">new insights</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-1">3,631</div>
            <div className="text-sm text-muted-foreground">new funding rounds</div>
          </div>
        </div>
      </div>

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
                    <div className="text-3xl">{company.logo}</div>
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
                  <div className="text-3xl">{item.logo}</div>
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
                  <div className="text-3xl">{item.logo}</div>
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
