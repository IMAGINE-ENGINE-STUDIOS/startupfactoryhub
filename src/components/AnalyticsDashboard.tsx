import { Card } from '@/components/ui/card';
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
} from 'recharts';
import { TrendingUp, Users, Building2, DollarSign, Activity, Briefcase, GraduationCap, HandshakeIcon } from 'lucide-react';
import { useCommunityAnalytics } from '@/hooks/useCommunityAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(220 70% 50%)', 'hsl(280 70% 50%)', 'hsl(142 70% 50%)'];

export default function AnalyticsDashboard() {
  const { stats, growthData, industryData, recentInvestments, activityData, loading } = useCommunityAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  const metrics = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Startups',
      value: stats.totalStartups.toLocaleString(),
      icon: Building2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Mentors',
      value: stats.totalMentors.toLocaleString(),
      icon: Briefcase,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Investors',
      value: stats.totalInvestors.toLocaleString(),
      icon: DollarSign,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Students',
      value: stats.totalStudents.toLocaleString(),
      icon: GraduationCap,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      title: 'Active Connections',
      value: stats.activeConnections.toLocaleString(),
      icon: HandshakeIcon,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Total Funding',
      value: formatCurrency(stats.totalFundingRaised),
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Platform Activity',
      value: (stats.totalMessages + stats.totalPosts + stats.totalEvents).toLocaleString(),
      icon: Activity,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <p className="text-3xl font-bold">{metric.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Growth Trends</TabsTrigger>
          <TabsTrigger value="industries">Industries</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="investments">Recent Investments</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Platform Growth (Last 6 Months)</h3>
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stackId="1"
                    stroke="hsl(220 70% 50%)"
                    fill="hsl(220 70% 50%)"
                    fillOpacity={0.6}
                    name="New Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="startups"
                    stackId="1"
                    stroke="hsl(280 70% 50%)"
                    fill="hsl(280 70% 50%)"
                    fillOpacity={0.6}
                    name="New Startups"
                  />
                  <Area
                    type="monotone"
                    dataKey="investments"
                    stackId="1"
                    stroke="hsl(142 70% 50%)"
                    fill="hsl(142 70% 50%)"
                    fillOpacity={0.6}
                    name="Investments"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No growth data available yet</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="industries" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Top Industries</h3>
              {industryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={industryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {industryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No industry data available yet</p>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Startups by Industry</h3>
              {industryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={industryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No industry data available yet</p>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Weekly Platform Activity</h3>
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="hsl(220 70% 50%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(220 70% 50%)' }}
                    name="Messages"
                  />
                  <Line
                    type="monotone"
                    dataKey="connections"
                    stroke="hsl(142 70% 50%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(142 70% 50%)' }}
                    name="Connections"
                  />
                  <Line
                    type="monotone"
                    dataKey="events"
                    stroke="hsl(280 70% 50%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(280 70% 50%)' }}
                    name="Events"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No activity data available yet</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Recent Investment Activity</h3>
            <div className="space-y-4">
              {recentInvestments.length > 0 ? (
                recentInvestments.map((inv, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{inv.startup}</h4>
                      <p className="text-sm text-muted-foreground">Investor: {inv.investor}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-500">{formatCurrency(inv.amount)}</p>
                      <p className="text-xs text-muted-foreground">{inv.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No investment data available yet</p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
