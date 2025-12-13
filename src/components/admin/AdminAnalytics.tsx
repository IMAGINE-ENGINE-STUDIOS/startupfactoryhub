import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, subDays } from 'date-fns';
import { 
  Users, 
  TrendingUp, 
  Activity,
  MessageSquare,
  RefreshCw,
  ArrowRight,
  Database
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';

const ROLE_COLORS: Record<string, string> = {
  startup: '#3B82F6',
  investor: '#F59E0B',
  mentor: '#8B5CF6',
  advisor: '#06B6D4',
  student: '#22C55E',
  accelerator: '#10B981',
  admin: '#EF4444'
};

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [featureUsage, setFeatureUsage] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [usersByRole, setUsersByRole] = useState<any[]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      await fetchAnalyticsData();
    };
    
    loadData();
    
    // Set up real-time subscription for updates - debounced
    let debounceTimer: NodeJS.Timeout;
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (isMounted) fetchAnalyticsData();
      }, 1000);
    };
    
    const channel = supabase
      .channel('analytics-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_posts' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, debouncedFetch)
      .subscribe();

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        { data: profiles },
        { data: roles },
        { data: posts },
        { data: connections },
        { data: events },
        { data: jobs },
        { data: messages },
        { data: resources }
      ] = await Promise.all([
        supabase.from('profiles').select('created_at, is_online, last_seen, user_id'),
        supabase.from('user_roles').select('role, user_id, created_at'),
        supabase.from('feed_posts').select('created_at, post_type, user_id'),
        supabase.from('connections').select('created_at, status, requester_id'),
        supabase.from('events').select('created_at, organizer_id'),
        supabase.from('jobs').select('created_at, company_id'),
        supabase.from('messages').select('id'),
        supabase.from('resources').select('id')
      ]);

      const dataExists = (profiles?.length || 0) > 0;
      setHasData(dataExists);

      if (!dataExists) {
        setLoading(false);
        return;
      }

      // Calculate user growth over last 30 days
      const growth = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const usersUpToDate = profiles?.filter(p => 
          format(new Date(p.created_at), 'yyyy-MM-dd') <= dateStr
        ).length || 0;
        
        growth.push({
          date: format(date, 'MMM dd'),
          users: usersUpToDate,
          newUsers: profiles?.filter(p => 
            format(new Date(p.created_at), 'yyyy-MM-dd') === dateStr
          ).length || 0
        });
      }
      setUserGrowthData(growth);

      // Calculate users by role from actual data
      const roleCounts: Record<string, number> = {};
      roles?.forEach((r: any) => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });
      
      const roleData = Object.entries(roleCounts).map(([role, count]) => ({
        role: role.charAt(0).toUpperCase() + role.slice(1),
        count,
        fill: ROLE_COLORS[role] || '#888'
      }));
      setUsersByRole(roleData);

      // Create a map of user_id to role for engagement calculation
      const userRoleMap: Record<string, string> = {};
      roles?.forEach((r: any) => {
        userRoleMap[r.user_id] = r.role;
      });

      // Calculate REAL engagement metrics by role
      const engagementByRole: Record<string, { posts: number; connections: number; events: number }> = {};
      
      // Initialize all roles
      Object.keys(ROLE_COLORS).forEach(role => {
        engagementByRole[role] = { posts: 0, connections: 0, events: 0 };
      });

      // Count posts by role
      posts?.forEach(post => {
        const role = userRoleMap[post.user_id];
        if (role && engagementByRole[role]) {
          engagementByRole[role].posts++;
        }
      });

      // Count connections by role (requester)
      connections?.forEach(conn => {
        const role = userRoleMap[conn.requester_id];
        if (role && engagementByRole[role]) {
          engagementByRole[role].connections++;
        }
      });

      // Count events by role (organizer)
      events?.forEach(event => {
        const role = userRoleMap[event.organizer_id];
        if (role && engagementByRole[role]) {
          engagementByRole[role].events++;
        }
      });

      const engagementDataFormatted = Object.entries(engagementByRole)
        .filter(([_, data]) => data.posts > 0 || data.connections > 0 || data.events > 0)
        .map(([role, data]) => ({
          role: role.charAt(0).toUpperCase() + role.slice(1),
          posts: data.posts,
          connections: data.connections,
          events: data.events
        }));
      
      setEngagementData(engagementDataFormatted.length > 0 ? engagementDataFormatted : []);

      // Feature usage - REAL data only
      const featureData = [
        { feature: 'Feed Posts', usage: posts?.length || 0 },
        { feature: 'Connections', usage: connections?.length || 0 },
        { feature: 'Events', usage: events?.length || 0 },
        { feature: 'Jobs', usage: jobs?.length || 0 },
        { feature: 'Messages', usage: messages?.length || 0 },
        { feature: 'Resources', usage: resources?.length || 0 }
      ].filter(f => f.usage > 0);
      
      setFeatureUsage(featureData);

      // Conversion funnel - REAL data
      const totalSignups = profiles?.length || 0;
      const completedProfiles = profiles?.filter(p => p.last_seen).length || 0;
      const recentlyActive = profiles?.filter(p => {
        if (!p.last_seen) return false;
        return new Date(p.last_seen) > subDays(new Date(), 7);
      }).length || 0;
      
      // Engaged users = users with at least one post or connection
      const usersWithPosts = new Set(posts?.map(p => p.user_id) || []);
      const usersWithConnections = new Set(connections?.map(c => c.requester_id) || []);
      const engagedUsers = new Set([...usersWithPosts, ...usersWithConnections]).size;

      setFunnelData([
        { name: 'Signups', value: totalSignups, fill: '#3B82F6' },
        { name: 'Profile Complete', value: completedProfiles, fill: '#8B5CF6' },
        { name: 'Active (7d)', value: recentlyActive, fill: '#10B981' },
        { name: 'Engaged', value: engagedUsers, fill: '#F59E0B' }
      ]);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="p-8 text-center">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Data Yet</h3>
          <p className="text-muted-foreground">
            Analytics will appear here once users start using the platform.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Growth Chart */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            User Growth (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userGrowthData}>
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
              <Area type="monotone" dataKey="users" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Total Users" />
              <Area type="monotone" dataKey="newUsers" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="New Users" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        {usersByRole.length > 0 && (
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Users by Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={250}>
                  <PieChart>
                    <Pie
                      data={usersByRole}
                      dataKey="count"
                      nameKey="role"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ count }) => count}
                    >
                      {usersByRole.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {usersByRole.map((role) => (
                    <div key={role.role} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: role.fill }} 
                        />
                        <span className="text-sm">{role.role}</span>
                      </div>
                      <Badge variant="outline">{role.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Usage */}
        {featureUsage.length > 0 && (
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Feature Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={featureUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="feature" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="usage" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Engagement by Role */}
      {engagementData.length > 0 && (
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Engagement Metrics by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="role" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="posts" fill="#3B82F6" name="Posts" radius={[4, 4, 0, 0]} />
                <Bar dataKey="connections" fill="#10B981" name="Connections" radius={[4, 4, 0, 0]} />
                <Bar dataKey="events" fill="#F59E0B" name="Events" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Conversion Funnel */}
      {funnelData.some(f => f.value > 0) && (
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-primary" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              {funnelData.map((stage, index) => (
                <div key={stage.name} className="flex-1 text-center">
                  <div 
                    className="mx-auto mb-3 rounded-lg p-6"
                    style={{ 
                      backgroundColor: `${stage.fill}20`,
                      borderLeft: `4px solid ${stage.fill}`
                    }}
                  >
                    <p className="text-3xl font-bold" style={{ color: stage.fill }}>{stage.value}</p>
                  </div>
                  <p className="text-sm font-medium">{stage.name}</p>
                  {index < funnelData.length - 1 && funnelData[index + 1]?.value > 0 && stage.value > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((funnelData[index + 1]?.value / stage.value) * 100)}% →
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminAnalytics;
