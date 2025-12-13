import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, subMonths, subYears, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { toast } from 'sonner';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  '1y': 'Last Year',
  'all': 'All Time'
};
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Activity,
  MessageSquare,
  Briefcase,
  Calendar,
  UserPlus,
  Link2,
  Globe,
  Rocket,
  GraduationCap,
  RefreshCw,
  MapPin,
  Factory,
  Package,
  AlertCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface PlatformStats {
  totalUsers: number;
  totalCompanies: number;
  totalPosts: number;
  totalEvents: number;
  totalJobs: number;
  activeUsers: number;
  totalConnections: number;
  pendingConnections: number;
  pendingResources: number;
  usersByRole: { role: string; count: number }[];
  locationData: { location: string; count: number }[];
  industryData: { industry: string; count: number }[];
  recentSignups: any[];
  recentActivity: any[];
  recentConnections: any[];
}

const ROLE_COLORS: Record<string, string> = {
  startup: '#3B82F6',
  investor: '#F59E0B',
  mentor: '#8B5CF6',
  advisor: '#06B6D4',
  student: '#22C55E',
  accelerator: '#10B981',
  admin: '#EF4444'
};

const INDUSTRY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1'
];

const AdminOverview = () => {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalPosts: 0,
    totalEvents: 0,
    totalJobs: 0,
    activeUsers: 0,
    totalConnections: 0,
    pendingConnections: 0,
    pendingResources: 0,
    usersByRole: [],
    locationData: [],
    industryData: [],
    recentSignups: [],
    recentActivity: [],
    recentConnections: []
  });
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  useEffect(() => {
    fetchGrowthData();
  }, [timeRange]);

  useEffect(() => {
    let isMounted = true;
    let debounceTimer: NodeJS.Timeout;
    
    const loadData = async () => {
      if (!isMounted) return;
      await fetchStats();
    };
    
    loadData();

    // Debounced fetch for realtime updates
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (isMounted) fetchStats();
      }, 1000);
    };

    // Subscribe to new resource submissions and feed posts
    const channel = supabase
      .channel('admin-overview-watch')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'resources' },
        (payload) => {
          if (payload.new && !(payload.new as any).is_verified) {
            toast.info('New resource submission pending approval!');
          }
          debouncedFetch();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feed_posts' },
        debouncedFetch
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        debouncedFetch
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch counts in parallel
      const [
        { count: usersCount },
        { count: companiesCount },
        { count: postsCount },
        { count: eventsCount },
        { count: jobsCount },
        { count: activeUsersCount },
        { count: totalConnectionsCount },
        { count: pendingConnectionsCount },
        { count: pendingResourcesCount },
        { data: recentProfiles },
        { data: recentPosts },
        { data: userRoles },
        { data: companiesData },
        { data: recentConnectionsData }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('feed_posts').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_online', true),
        supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
        supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('resources').select('*', { count: 'exact', head: true }).eq('is_verified', false),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('feed_posts').select('*, profiles:user_id(full_name, avatar_url)').order('created_at', { ascending: false }).limit(10),
        supabase.from('user_roles').select('role'),
        supabase.from('companies').select('location, industry'),
        supabase.from('connections').select('*, requester:requester_id(full_name, avatar_url), addressee:addressee_id(full_name, avatar_url)').eq('status', 'accepted').order('created_at', { ascending: false }).limit(5)
      ]);

      // Count roles
      const roleCounts: Record<string, number> = {};
      userRoles?.forEach((r: any) => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });
      const usersByRole = Object.entries(roleCounts).map(([role, count]) => ({ role, count }));

      // Process location data
      const locationCounts: Record<string, number> = {};
      companiesData?.forEach((c: any) => {
        const loc = c.location?.trim() || 'Unknown';
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      });
      const locationData = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Process industry data - normalize to handle typos like 'ecomerce' vs 'ecommerce'
      const industryCounts: Record<string, number> = {};
      companiesData?.forEach((c: any) => {
        let ind = c.industry?.trim()?.toLowerCase() || 'other';
        // Normalize common typos
        if (ind === 'ecomerce') ind = 'ecommerce';
        if (ind === 'e-commerce') ind = 'ecommerce';
        industryCounts[ind] = (industryCounts[ind] || 0) + 1;
      });
      const industryData = Object.entries(industryCounts)
        .map(([industry, count]) => ({ 
          industry: industry.charAt(0).toUpperCase() + industry.slice(1), 
          count 
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Growth data fetched separately via fetchGrowthData

      setStats({
        totalUsers: usersCount || 0,
        totalCompanies: companiesCount || 0,
        totalPosts: postsCount || 0,
        totalEvents: eventsCount || 0,
        totalJobs: jobsCount || 0,
        activeUsers: activeUsersCount || 0,
        totalConnections: totalConnectionsCount || 0,
        pendingConnections: pendingConnectionsCount || 0,
        pendingResources: pendingResourcesCount || 0,
        usersByRole,
        locationData,
        industryData,
        recentSignups: recentProfiles || [],
        recentActivity: recentPosts || [],
        recentConnections: recentConnectionsData || []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGrowthData = async () => {
    const now = new Date();
    let startDate: Date;
    let dateFormat: string;
    let intervals: Date[];

    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        intervals = eachDayOfInterval({ start: startDate, end: now });
        dateFormat = 'MMM dd';
        break;
      case '30d':
        startDate = subDays(now, 30);
        intervals = eachDayOfInterval({ start: startDate, end: now });
        dateFormat = 'MMM dd';
        break;
      case '90d':
        startDate = subDays(now, 90);
        intervals = eachWeekOfInterval({ start: startDate, end: now });
        dateFormat = 'MMM dd';
        break;
      case '1y':
        startDate = subYears(now, 1);
        intervals = eachMonthOfInterval({ start: startDate, end: now });
        dateFormat = 'MMM yy';
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        intervals = eachMonthOfInterval({ start: startDate, end: now });
        dateFormat = 'MMM yy';
        break;
      default:
        startDate = subDays(now, 7);
        intervals = eachDayOfInterval({ start: startDate, end: now });
        dateFormat = 'MMM dd';
    }

    const { data: usersData } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    const { data: postsData } = await supabase
      .from('feed_posts')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    const growth = intervals.map(date => {
      const dateKey = format(date, dateFormat);
      const usersCount = usersData?.filter(u => {
        const d = new Date(u.created_at);
        return format(d, dateFormat) === dateKey;
      }).length || 0;
      const postsCount = postsData?.filter(p => {
        const d = new Date(p.created_at);
        return format(d, dateFormat) === dateKey;
      }).length || 0;
      return { date: dateKey, users: usersCount, posts: postsCount };
    });

    setGrowthData(growth);
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, any> = {
      startup: Rocket,
      investor: TrendingUp,
      mentor: Users,
      advisor: Users,
      student: GraduationCap,
      accelerator: Building2,
      admin: Activity
    };
    const Icon = icons[role] || Users;
    return <Icon className="h-4 w-4" />;
  };

  const navigateToResources = () => {
    setSearchParams({ tab: 'resources' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Activity className="h-5 w-5 text-green-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
              <p className="text-xs text-muted-foreground">Online Now</p>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Building2 className="h-5 w-5 text-purple-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{stats.totalCompanies}</p>
              <p className="text-xs text-muted-foreground">Companies</p>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Link2 className="h-5 w-5 text-teal-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{stats.totalConnections}</p>
              <p className="text-xs text-muted-foreground">Connections</p>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{stats.totalPosts}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Briefcase className="h-5 w-5 text-amber-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{stats.totalJobs}</p>
              <p className="text-xs text-muted-foreground">Jobs</p>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-5 w-5 text-rose-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{stats.totalEvents}</p>
              <p className="text-xs text-muted-foreground">Events</p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Resources - Clickable */}
        <Card 
          className={`tech-card border-0 cursor-pointer hover:bg-muted/50 transition-colors ${stats.pendingResources > 0 ? 'ring-2 ring-amber-500/50' : ''}`}
          onClick={navigateToResources}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Package className="h-5 w-5 text-amber-400" />
              {stats.pendingResources > 0 && (
                <AlertCircle className="h-4 w-4 text-amber-400 animate-pulse" />
              )}
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{stats.pendingResources}</p>
              <p className="text-xs text-muted-foreground">Pending Resources</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card className="tech-card border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Platform Growth
              </CardTitle>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                  <SelectItem value="1y">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey="users" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Users" />
                <Area type="monotone" dataKey="posts" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Posts" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Users by Role Pie Chart */}
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Users by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.usersByRole}
                    dataKey="count"
                    nameKey="role"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.usersByRole.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ROLE_COLORS[entry.role] || '#888'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {stats.usersByRole.map((role) => (
                  <div key={role.role} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: ROLE_COLORS[role.role] || '#888' }} 
                    />
                    <span className="text-sm capitalize">{role.role}</span>
                    <span className="text-sm text-muted-foreground">({role.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - Location & Industry Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Startup Locations */}
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Startup Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.locationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.locationData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="location" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11}
                    width={75}
                    tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} name="Startups" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                No location data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Startup Industries */}
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              Startup Industries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.industryData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie
                      data={stats.industryData}
                      dataKey="count"
                      nameKey="industry"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.industryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={INDUSTRY_COLORS[index % INDUSTRY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <ScrollArea className="h-[200px] flex-1">
                  <div className="space-y-2 pr-4">
                    {stats.industryData.map((ind, index) => (
                      <div key={ind.industry} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: INDUSTRY_COLORS[index % INDUSTRY_COLORS.length] }} 
                        />
                        <span className="text-sm truncate">{ind.industry}</span>
                        <span className="text-sm text-muted-foreground ml-auto">({ind.count})</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                No industry data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connections Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connections Stats */}
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Connection Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Accepted Connections</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {stats.totalConnections}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Pending Requests</span>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  {stats.pendingConnections}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Acceptance Rate</span>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {stats.totalConnections + stats.pendingConnections > 0 
                    ? ((stats.totalConnections / (stats.totalConnections + stats.pendingConnections)) * 100).toFixed(1)
                    : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Connections */}
        <Card className="tech-card border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Recent Connections Made
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[180px]">
              <div className="space-y-3">
                {stats.recentConnections.length > 0 ? (
                  stats.recentConnections.map((conn: any) => (
                    <div key={conn.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={conn.requester?.avatar_url || ''} />
                        <AvatarFallback>{conn.requester?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{conn.requester?.full_name || 'Unknown'}</span>
                        <Link2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{conn.addressee?.full_name || 'Unknown'}</span>
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={conn.addressee?.avatar_url || ''} />
                        <AvatarFallback>{conn.addressee?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {format(new Date(conn.created_at), 'MMM dd')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                    No recent connections
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Recent Signups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {stats.recentSignups.length > 0 ? (
                  stats.recentSignups.map((user: any) => (
                    <div key={user.user_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.full_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM dd, HH:mm')}
                        </span>
                        {user.is_online && (
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    No recent signups
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Activity - Full Post Content */}
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Feed Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((post: any) => (
                    <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={post.profiles?.avatar_url || ''} />
                        <AvatarFallback>{post.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{post.profiles?.full_name || 'Unknown'}</p>
                          <Badge variant="outline" className="text-xs">{post.post_type}</Badge>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap mb-2">{post.content}</p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(post.created_at), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                    No recent posts
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;