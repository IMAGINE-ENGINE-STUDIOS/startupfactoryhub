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
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Activity } from 'lucide-react';

const growthData = [
  { month: 'Jan', users: 120, connections: 45, events: 12 },
  { month: 'Feb', users: 180, connections: 68, events: 15 },
  { month: 'Mar', users: 250, connections: 95, events: 18 },
  { month: 'Apr', users: 340, connections: 128, events: 22 },
  { month: 'May', users: 460, connections: 175, events: 28 },
  { month: 'Jun', users: 590, connections: 225, events: 35 },
];

const engagementData = [
  { name: 'Messages', value: 450 },
  { name: 'Events', value: 320 },
  { name: 'Connections', value: 280 },
  { name: 'Resources', value: 190 },
];

const activityData = [
  { day: 'Mon', active: 65 },
  { day: 'Tue', active: 72 },
  { day: 'Wed', active: 68 },
  { day: 'Thu', active: 80 },
  { day: 'Fri', active: 75 },
  { day: 'Sat', active: 45 },
  { day: 'Sun', active: 40 },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function AnalyticsDashboard() {
  const metrics = [
    {
      title: 'Total Users',
      value: '2,543',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Active Connections',
      value: '1,284',
      change: '+8.2%',
      trend: 'up',
      icon: Target,
    },
    {
      title: 'Funding Raised',
      value: '$4.2M',
      change: '+24.3%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Engagement Rate',
      value: '68%',
      change: '-2.1%',
      trend: 'down',
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
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
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Platform Growth</h3>
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
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="connections"
                  stackId="1"
                  stroke="hsl(var(--secondary))"
                  fill="hsl(var(--secondary))"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Engagement Distribution</h3>
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
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Engagement by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Weekly Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
