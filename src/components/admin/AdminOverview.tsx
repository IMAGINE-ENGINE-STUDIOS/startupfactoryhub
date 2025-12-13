import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
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
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PlatformStats {
  totalUsers: number;
  totalCompanies: number;
  totalPosts: number;
  totalEvents: number;
  totalJobs: number;
  activeUsers: number;
  usersByRole: { role: string; count: number }[];
  recentSignups: any[];
  recentActivity: any[];
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

const AdminOverview = () => {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalPosts: 0,
    totalEvents: 0,
    totalJobs: 0,
    activeUsers: 0,
    usersByRole: [],
    recentSignups: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
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
        { data: recentProfiles },
        { data: recentPosts },
        { data: userRoles }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('feed_posts').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_online', true),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('feed_posts').select('*, profiles:user_id(full_name, avatar_url)').order('created_at', { ascending: false }).limit(10),
        supabase.from('user_roles').select('role')
      ]);

      // Count roles
      const roleCounts: Record<string, number> = {};
      userRoles?.forEach((r: any) => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });

      const usersByRole = Object.entries(roleCounts).map(([role, count]) => ({ role, count }));

      // Generate mock growth data for chart
      const growth = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        growth.push({
          date: format(date, 'MMM dd'),
          users: Math.floor(Math.random() * 50) + (usersCount || 0) - 200 + i * 30,
          posts: Math.floor(Math.random() * 20) + (postsCount || 0) - 50 + i * 10
        });
      }
      setGrowthData(growth);

      setStats({
        totalUsers: usersCount || 0,
        totalCompanies: companiesCount || 0,
        totalPosts: postsCount || 0,
        totalEvents: eventsCount || 0,
        totalJobs: jobsCount || 0,
        activeUsers: activeUsersCount || 0,
        usersByRole,
        recentSignups: recentProfiles || [],
        recentActivity: recentPosts || []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-blue-400" />
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </Badge>
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
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Platform Growth (7 days)
            </CardTitle>
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
                {stats.recentSignups.map((user: any) => (
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
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {stats.recentActivity.map((post: any) => (
                  <div key={post.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.profiles?.avatar_url || ''} />
                      <AvatarFallback>{post.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{post.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{post.post_type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(post.created_at), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;