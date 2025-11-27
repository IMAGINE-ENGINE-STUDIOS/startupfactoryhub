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
import { TrendingUp, TrendingDown, Users, Target, Activity, Eye, Zap, MessageSquare, Heart, UserPlus, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useStartupAnalytics } from '@/hooks/useStartupAnalytics';
import { useAuth } from '@/contexts/AuthContext';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

interface AnalyticsDashboardProps {
  userId?: string;
}

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const { user } = useAuth();
  const analytics = useStartupAnalytics();

  const effectiveUserId = userId || user?.id;

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

  return (
    <div className="space-y-8">
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
            <div className="grid gap-4 md:grid-cols-2">
              {overviewMetrics.map((metric) => (
                <Card key={metric.title} className="p-6">
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
            <div className="grid gap-4 md:grid-cols-3">
              {activityMetrics.map((metric) => (
                <Card key={metric.title} className="p-6">
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
            <div className="grid gap-4 md:grid-cols-3">
              {networkMetrics.map((metric) => (
                <Card key={metric.title} className="p-6">
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
          <Card className="p-6">
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
            <Card className="p-6">
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

            <Card className="p-6">
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
    </div>
  );
}
