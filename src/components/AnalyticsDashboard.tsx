import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { TrendingUp, TrendingDown, Users, Target, Activity, Eye, Zap, MessageSquare, Heart, UserPlus, UserCheck, Calculator, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStartupAnalytics } from '@/hooks/useStartupAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { useStartupScoring } from '@/hooks/useStartupScoring';
import { StartupScoringCard } from '@/components/StartupScoringCard';
import { StartupScoringDialog } from '@/components/StartupScoringDialog';
import { CC_FACTOR_LABELS, getScoreTier, getTierColorClasses } from '@/lib/startupScoring';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

interface AnalyticsDashboardProps {
  userId?: string;
  companyId?: string;
  companyName?: string;
}

export default function AnalyticsDashboard({ userId, companyId, companyName }: AnalyticsDashboardProps) {
  const { user } = useAuth();
  const analytics = useStartupAnalytics();
  const [scoringDialogOpen, setScoringDialogOpen] = useState(false);
  const [effectiveCompanyId, setEffectiveCompanyId] = useState<string | null>(companyId || null);

  const effectiveUserId = userId || user?.id;

  // Fetch company for this user if not provided
  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId && effectiveUserId) {
        const { data } = await supabase
          .from('companies')
          .select('id, name')
          .eq('user_id', effectiveUserId)
          .limit(1)
          .maybeSingle();
        if (data) {
          setEffectiveCompanyId(data.id);
        }
      }
    };
    fetchCompany();
  }, [companyId, effectiveUserId]);

  const { score, loading: scoreLoading, refetch: refetchScore } = useStartupScoring(effectiveCompanyId || undefined);

  // Prepare radar chart data for CC factors
  const ccRadarData = score ? [
    { factor: 'Team', value: score.cc_founder_team_quality, fullMark: 10 },
    { factor: 'IP', value: score.cc_intellectual_property, fullMark: 10 },
    { factor: 'PMF', value: score.cc_product_market_fit, fullMark: 10 },
    { factor: 'Partners', value: score.cc_strategic_partnerships, fullMark: 10 },
    { factor: 'Exit Env', value: score.cc_exit_environment, fullMark: 10 },
    { factor: 'Supply', value: score.cc_supply_chain_stability, fullMark: 10 },
    { factor: 'Regulatory', value: score.cc_regulatory_momentum, fullMark: 10 },
    { factor: 'Capital Eff', value: score.cc_capital_efficiency, fullMark: 10 },
    { factor: 'Recurring Rev', value: score.cc_recurring_revenue_ratio, fullMark: 10 },
    { factor: 'Tech Risk', value: 10 - score.cc_tech_replacement_risk, fullMark: 10 }, // Invert for radar
  ] : [];

  // Calculate engagement breakdown for charts
  const engagementBreakdown = () => {
    const totalContent = analytics.posts;
    const totalEngagement = analytics.comments + analytics.likes;
    const totalNetwork = analytics.connections + analytics.followers;
    const total = totalContent + totalEngagement + totalNetwork;

    if (total === 0) return [];

    return [
      { name: 'Content Created', value: Math.round((totalContent / total) * 100) },
      { name: 'Engagement Given', value: Math.round((totalEngagement / total) * 100) },
      { name: 'Network Activity', value: Math.round((totalNetwork / total) * 100) },
    ];
  };

  // Calculate engagement received by week
  const engagementReceivedByWeek = () => {
    return analytics.historicalData.map(week => ({
      period: week.period,
      'Likes Received': Math.round((analytics.engagementReceived.likesReceived / 6)),
      'Comments Received': Math.round((analytics.engagementReceived.commentsReceived / 6)),
      'New Followers': week.newFollowers,
    }));
  };

  const overviewMetrics = [
    {
      title: 'Engagement Score',
      value: `${analytics.engagement}%`,
      change: analytics.engagement > 50 ? '+High' : analytics.engagement > 0 ? 'Moderate' : 'Low',
      trend: analytics.engagement > 50 ? 'up' : 'down',
      icon: Zap,
      description: 'Overall activity impact'
    },
    {
      title: 'Profile Views',
      value: analytics.profileViews.toString(),
      change: analytics.profileViews > 0 ? `${analytics.profileViews} views` : 'No views yet',
      trend: 'up',
      icon: Eye,
      description: 'People checking your profile'
    },
  ];

  const activityMetrics = [
    {
      title: 'Posts Created',
      value: analytics.posts.toString(),
      change: analytics.posts > 0 ? `${analytics.posts} posts` : 'Start posting',
      trend: 'up',
      icon: Activity,
      description: 'Your content contributions'
    },
    {
      title: 'Comments',
      value: analytics.comments.toString(),
      change: analytics.comments > 0 ? `${analytics.comments} comments` : 'No comments yet',
      trend: 'up',
      icon: MessageSquare,
      description: 'Your discussions'
    },
    {
      title: 'Likes Given',
      value: analytics.likes.toString(),
      change: analytics.likes > 0 ? `${analytics.likes} likes` : 'No likes yet',
      trend: 'up',
      icon: Heart,
      description: 'Content you appreciated'
    },
  ];

  const networkMetrics = [
    {
      title: 'Connections',
      value: analytics.connections.toString(),
      change: analytics.connections > 0 ? `${analytics.connections} active` : 'Build connections',
      trend: 'up',
      icon: UserCheck,
      description: 'Your network size'
    },
    {
      title: 'Followers',
      value: analytics.followers.toString(),
      change: analytics.followers > 0 ? `${analytics.followers} followers` : 'No followers yet',
      trend: 'up',
      icon: Users,
      description: 'People following you'
    },
    {
      title: 'Following',
      value: analytics.following.toString(),
      change: analytics.following > 0 ? `${analytics.following} following` : 'Follow others',
      trend: 'up',
      icon: UserPlus,
      description: 'People you follow'
    },
  ];

  const tier = score ? getScoreTier(score.startup_score || 0) : null;
  const tierColors = tier ? getTierColorClasses(tier) : null;

  return (
    <div className="space-y-8">
      {/* Startup Score Section - Only show if company exists */}
      {effectiveCompanyId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Startup Score</h2>
              <p className="text-sm text-muted-foreground ml-2">Your company's potential rating</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScoringDialogOpen(true)}
            >
              <Calculator className="h-4 w-4 mr-2" />
              {score ? 'Update Score' : 'Calculate Score'}
            </Button>
          </div>

          {scoreLoading ? (
            <Card className="tech-card border-0 p-6">
              <p className="text-muted-foreground text-center">Loading score...</p>
            </Card>
          ) : score ? (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Main Score Card */}
              <Card className={cn(
                "tech-card border-0 p-6",
                tierColors?.border
              )}>
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">Overall Startup Score</p>
                  <div className={cn("text-6xl font-bold", tierColors?.text)}>
                    {score.startup_score || 0}
                  </div>
                  <Badge variant="outline" className={cn(tierColors?.bg, tierColors?.text, tierColors?.border, "text-sm")}>
                    {tier?.emoji} {tier?.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{tier?.description}</p>
                </div>
              </Card>

              {/* Score Components */}
              <Card className="tech-card border-0 p-6">
                <h3 className="font-semibold mb-4 text-sm">Score Components</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Company Coefficient</span>
                      <span className="font-medium">{score.company_coefficient?.toFixed(1)}/10</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${(score.company_coefficient || 0) * 10}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Traction Score</span>
                      <span className="font-medium">{score.traction_score?.toFixed(0)}/100</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all" 
                        style={{ width: `${score.traction_score || 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Market Emergence</span>
                      <span className="font-medium">{score.market_ems_score?.toFixed(0)}/100</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all" 
                        style={{ width: `${score.market_ems_score || 50}%` }}
                      />
                    </div>
                  </div>
                </div>
                {score.primary_market && (
                  <Badge variant="secondary" className="mt-4 text-xs">
                    {score.primary_market}
                  </Badge>
                )}
              </Card>

              {/* Radar Chart */}
              <Card className="tech-card border-0 p-6">
                <h3 className="font-semibold mb-2 text-sm">Company Coefficient Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={ccRadarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="factor" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 10]} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          ) : (
            <Card className="tech-card border-0 p-8 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Score Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Calculate your startup's potential score based on company quality, traction, and market opportunity.
              </p>
              <Button onClick={() => setScoringDialogOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Calculate Your Score
              </Button>
            </Card>
          )}
        </div>
      )}

      {analytics.loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Overview Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Overview</h2>
              <p className="text-sm text-muted-foreground ml-2">Your impact at a glance</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {overviewMetrics.map((metric) => (
                <Card key={metric.title} className="tech-card border-0 hover:scale-[1.02] transition-transform p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{metric.title}</p>
                      <p className="text-3xl font-bold">{metric.value}</p>
                      <p className="text-xs text-muted-foreground">{metric.description}</p>
                      <Badge
                        variant={metric.trend === 'up' ? 'default' : 'secondary'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {metric.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {metric.change}
                      </Badge>
                    </div>
                    <metric.icon className="h-10 w-10 text-primary" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Activity Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Your Activity</h2>
              <p className="text-sm text-muted-foreground ml-2">Content you've created and shared</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {activityMetrics.map((metric) => (
                <Card key={metric.title} className="tech-card border-0 hover:scale-[1.02] transition-transform p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                      <metric.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Network Growth Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Network Growth</h2>
              <p className="text-sm text-muted-foreground ml-2">Your community connections</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {networkMetrics.map((metric) => (
                <Card key={metric.title} className="tech-card border-0 hover:scale-[1.02] transition-transform p-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                      <metric.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Charts */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-4">
          <Card className="tech-card border-0 p-6">
            <h3 className="font-semibold mb-4">Your Activity (Last 6 Weeks)</h3>
            {analytics.historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="posts"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                    name="Posts"
                  />
                  <Area
                    type="monotone"
                    dataKey="comments"
                    stroke="hsl(var(--secondary))"
                    fill="hsl(var(--secondary))"
                    fillOpacity={0.6}
                    name="Comments"
                  />
                  <Area
                    type="monotone"
                    dataKey="likes"
                    stroke="hsl(var(--accent))"
                    fill="hsl(var(--accent))"
                    fillOpacity={0.6}
                    name="Likes"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Start connecting and engaging to see your growth data</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="tech-card border-0 p-6">
              <h3 className="font-semibold mb-4">What You're Doing</h3>
              {engagementBreakdown().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementBreakdown()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {engagementBreakdown().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No activity data yet</p>
                </div>
              )}
            </Card>

            <Card className="tech-card border-0 p-6">
              <h3 className="font-semibold mb-4">Engagement Received (Weekly Avg)</h3>
              {engagementReceivedByWeek().length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementReceivedByWeek()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Likes Received" fill="hsl(var(--primary))" />
                    <Bar dataKey="Comments Received" fill="hsl(var(--secondary))" />
                    <Bar dataKey="New Followers" fill="hsl(var(--accent))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Start engaging to see your metrics</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Scoring Dialog */}
      {effectiveCompanyId && (
        <StartupScoringDialog
          open={scoringDialogOpen}
          onOpenChange={setScoringDialogOpen}
          companyId={effectiveCompanyId}
          companyName={companyName}
          onScoreSaved={refetchScore}
        />
      )}
    </div>
  );
}
