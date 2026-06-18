import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Eye,
  Zap,
  MessageSquare,
  Heart,
  UserPlus,
  Kanban,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useStartupAnalytics } from '@/hooks/useStartupAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import CRMBoard from '@/components/CRMBoard';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  userId?: string;
}

type MetricKey = 'posts' | 'comments' | 'likes' | 'newFollowers';

const METRIC_META: Record<
  MetricKey,
  { label: string; color: string; icon: any }
> = {
  posts: { label: 'Posts', color: 'hsl(var(--primary))', icon: Activity },
  comments: { label: 'Comments', color: 'hsl(160 84% 55%)', icon: MessageSquare },
  likes: { label: 'Likes', color: 'hsl(340 82% 65%)', icon: Heart },
  newFollowers: { label: 'Followers', color: 'hsl(260 84% 70%)', icon: UserPlus },
};

const DONUT_COLORS = ['hsl(var(--primary))', 'hsl(160 84% 55%)', 'hsl(260 84% 70%)'];

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const { user } = useAuth();
  const a = useStartupAnalytics();
  const [activeMetric, setActiveMetric] = useState<MetricKey>('posts');

  // Build trend deltas: compare second-half vs first-half of historicalData
  const deltaFor = (key: MetricKey | 'profileViews'): number => {
    const data = a.historicalData;
    if (!data || data.length < 2) return 0;
    const mid = Math.floor(data.length / 2);
    const first = data.slice(0, mid).reduce((s, d: any) => s + (d[key] ?? 0), 0);
    const second = data.slice(mid).reduce((s, d: any) => s + (d[key] ?? 0), 0);
    if (first === 0) return second > 0 ? 100 : 0;
    return Math.round(((second - first) / first) * 100);
  };

  const kpis = useMemo(
    () => [
      {
        key: 'engagement',
        label: 'Engagement',
        value: `${a.engagement}%`,
        delta: a.engagement > 50 ? 18 : a.engagement > 0 ? 4 : 0,
        icon: Zap,
        tone: 'text-primary',
        ring: 'ring-primary/30',
        glow: 'shadow-[0_0_30px_hsl(var(--primary)/0.35)]',
        sparkKey: 'posts' as const,
      },
      {
        key: 'reach',
        label: 'Reach',
        value: a.followers + a.connections,
        delta: deltaFor('newFollowers'),
        icon: Users,
        tone: 'text-violet-400',
        ring: 'ring-violet-500/30',
        glow: 'shadow-[0_0_30px_hsl(260_84%_70%/0.3)]',
        sparkKey: 'newFollowers' as const,
      },
      {
        key: 'views',
        label: 'Profile Views',
        value: a.profileViews,
        delta: deltaFor('profileViews'),
        icon: Eye,
        tone: 'text-emerald-400',
        ring: 'ring-emerald-500/30',
        glow: 'shadow-[0_0_30px_hsl(160_84%_55%/0.3)]',
        sparkKey: 'posts' as const,
      },
      {
        key: 'interactions',
        label: 'Interactions',
        value: a.likes + a.comments,
        delta: deltaFor('likes'),
        icon: Heart,
        tone: 'text-rose-400',
        ring: 'ring-rose-500/30',
        glow: 'shadow-[0_0_30px_hsl(340_82%_65%/0.3)]',
        sparkKey: 'likes' as const,
      },
    ],
    [a],
  );

  const engagementBreakdown = useMemo(() => {
    const content = a.posts;
    const engagement = a.comments + a.likes;
    const network = a.connections + a.followers;
    const total = content + engagement + network;
    if (total === 0) return [];
    return [
      { name: 'Content', value: Math.round((content / total) * 100) },
      { name: 'Engagement', value: Math.round((engagement / total) * 100) },
      { name: 'Network', value: Math.round((network / total) * 100) },
    ];
  }, [a]);

  const engagementReceivedByWeek = useMemo(
    () =>
      a.historicalData.map(w => ({
        period: w.period,
        Likes: Math.round(a.engagementReceived.likesReceived / Math.max(a.historicalData.length, 1)),
        Comments: Math.round(a.engagementReceived.commentsReceived / Math.max(a.historicalData.length, 1)),
        Followers: w.newFollowers,
      })),
    [a],
  );

  const radialData = [
    { name: 'engagement', value: a.engagement, fill: 'hsl(var(--primary))' },
  ];

  if (a.loading) {
    return (
      <div className="tech-card border-0 rounded-2xl text-center py-20">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <Activity className="w-4 h-4 animate-pulse" /> Loading insights…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Hero insights card ────────────────────────────────────────── */}
      <div className="relative tech-card border-0 rounded-2xl p-5 sm:p-6 overflow-hidden">
        <div className="absolute -top-20 -right-16 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center">
          <div className="space-y-3">
            <Badge className="bg-primary/15 text-primary border-primary/30 gap-1.5 px-2.5 py-1">
              <Sparkles className="w-3 h-3" /> Live insights
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Your{' '}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                signal score
              </span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              An algorithmic read on how your content, network and engagement compound over time.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {(['7D', '30D', '90D', 'All'] as const).map((p, i) => (
                <button
                  key={p}
                  className={cn(
                    'h-7 px-3 rounded-full text-[11px] font-medium uppercase tracking-wider transition-all',
                    i === 1
                      ? 'bg-primary text-primary-foreground shadow-[0_0_14px_hsl(var(--primary)/0.5)]'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-[180px] h-[180px] mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="72%"
                outerRadius="100%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  background={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  dataKey="value"
                  cornerRadius={20}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-3xl font-bold tabular-nums">{a.engagement}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Score
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI strip with sparklines ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(k => {
          const Icon = k.icon;
          const positive = k.delta >= 0;
          return (
            <div
              key={k.key}
              className={cn(
                'group relative tech-card border-0 rounded-2xl p-4 overflow-hidden transition-all hover:-translate-y-0.5',
                'hover:' + k.glow,
              )}
            >
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center bg-background/40 ring-1',
                    k.ring,
                  )}
                >
                  <Icon className={cn('w-4 h-4', k.tone)} />
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full',
                    positive
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-rose-400 bg-rose-500/10',
                  )}
                >
                  {positive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(k.delta)}%
                </span>
              </div>
              <div className="mt-3 text-2xl sm:text-3xl font-bold tabular-nums tracking-tight">
                {k.value}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
                {k.label}
              </div>

              <div className="h-10 mt-3 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={a.historicalData}>
                    <defs>
                      <linearGradient id={`spark-${k.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={METRIC_META[k.sparkKey].color} stopOpacity={0.45} />
                        <stop offset="100%" stopColor={METRIC_META[k.sparkKey].color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey={k.sparkKey}
                      stroke={METRIC_META[k.sparkKey].color}
                      strokeWidth={2}
                      fill={`url(#spark-${k.key})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs: Growth / Audience ─────────────────────────────── */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList className="tech-card border-0 rounded-full p-1 h-auto bg-transparent">
          <TabsTrigger value="growth" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Growth
          </TabsTrigger>
          <TabsTrigger value="audience" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Audience
          </TabsTrigger>
        </TabsList>

        {/* ── Growth tab ─────────────────────────────────────────────── */}
        <TabsContent value="growth" className="space-y-4 mt-0">
          <div className="tech-card border-0 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold text-base">Activity over time</h3>
                <p className="text-xs text-muted-foreground">Last {a.historicalData.length} periods</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(Object.keys(METRIC_META) as MetricKey[]).map(m => {
                  const M = METRIC_META[m];
                  const active = activeMetric === m;
                  const MIcon = M.icon;
                  return (
                    <button
                      key={m}
                      onClick={() => setActiveMetric(m)}
                      className={cn(
                        'h-8 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-all',
                        active
                          ? 'text-foreground bg-background/60 ring-1 ring-border'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                      style={active ? { boxShadow: `0 0 18px ${M.color}55` } : undefined}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: M.color }}
                      />
                      <MIcon className="w-3.5 h-3.5" />
                      {M.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {a.historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={a.historicalData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="main-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={METRIC_META[activeMetric].color} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={METRIC_META[activeMetric].color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="period"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    cursor={{ stroke: METRIC_META[activeMetric].color, strokeOpacity: 0.3, strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey={activeMetric}
                    stroke={METRIC_META[activeMetric].color}
                    strokeWidth={2.5}
                    fill="url(#main-gradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState text="Start engaging to see growth data" />
            )}
          </div>
        </TabsContent>

        {/* ── Audience tab ──────────────────────────────────────────── */}
        <TabsContent value="audience" className="space-y-4 mt-0">
          <div className="grid lg:grid-cols-5 gap-4">
            <div className="tech-card border-0 rounded-2xl p-4 sm:p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-base">Activity mix</h3>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </div>
              {engagementBreakdown.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={engagementBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {engagementBreakdown.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        formatter={(v: any) => `${v}%`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {engagementBreakdown.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: DONUT_COLORS[i] }}
                          />
                          <span className="text-muted-foreground">{d.name}</span>
                        </div>
                        <span className="font-semibold tabular-nums">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState text="No activity data yet" />
              )}
            </div>

            <div className="tech-card border-0 rounded-2xl p-4 sm:p-6 lg:col-span-3">
              <h3 className="font-semibold text-base mb-3">Engagement received</h3>
              {engagementReceivedByWeek.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={engagementReceivedByWeek} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                    <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                    />
                    <Bar dataKey="Likes" fill="hsl(340 82% 65%)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Comments" fill="hsl(160 84% 55%)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Followers" fill="hsl(260 84% 70%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState text="Start engaging to see your metrics" />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-12 text-sm text-muted-foreground">
      <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
      {text}
    </div>
  );
}
