import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { TrendingUp, TrendingDown, Users, Target, Activity, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStartupAnalytics } from '@/hooks/useStartupAnalytics';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

interface AnalyticsDashboardProps {
  userId?: string;
}

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const analytics = useStartupAnalytics();
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      fetchHistoricalData();
    }
  }, [userId]);

  const fetchHistoricalData = async () => {
    if (!userId) return;

    // For now, create basic data structure
    // In production, you'd query historical data grouped by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = months.map((month, idx) => ({
      month,
      connections: Math.round(analytics.connections * (idx + 1) / 6),
      views: Math.round(analytics.profileViews * (idx + 1) / 6),
    }));
    
    setHistoricalData(data);

    // Engagement breakdown
    const engagement = [
      { name: 'Connections', value: analytics.connections },
      { name: 'Profile Views', value: Math.min(analytics.profileViews, 100) },
      { name: 'Engagement', value: analytics.engagement },
    ];
    setEngagementData(engagement);
  };

  const metrics = [
    {
      title: 'Profile Views',
      value: analytics.profileViews.toString(),
      change: analytics.profileViews > 0 ? '+' : '0%',
      trend: 'up',
      icon: Eye,
    },
    {
      title: 'Connections',
      value: analytics.connections.toString(),
      change: analytics.connections > 0 ? '+' : '0%',
      trend: 'up',
      icon: Target,
    },
    {
      title: 'Followers',
      value: analytics.connections.toString(),
      change: analytics.connections > 0 ? '+' : '0%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Engagement Score',
      value: `${analytics.engagement}%`,
      change: analytics.engagement > 50 ? '+' : analytics.engagement > 0 ? '' : '0%',
      trend: analytics.engagement > 50 ? 'up' : 'down',
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {analytics.loading ? (
          <div className="col-span-4 text-center py-8">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        ) : (
          metrics.map((metric) => (
            <Card key={metric.title} className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
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
                <metric.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Charts */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Your Growth Over Time</h3>
            {historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="connections"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                    name="Connections"
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stackId="1"
                    stroke="hsl(var(--secondary))"
                    fill="hsl(var(--secondary))"
                    fillOpacity={0.6}
                    name="Profile Views"
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
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Engagement Distribution</h3>
              {engagementData.length > 0 && engagementData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No engagement data yet</p>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Engagement Metrics</h3>
              {engagementData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
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
    </div>
  );
}
