import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { DashboardHeader } from '@/components/DashboardHeader';
import { format } from 'date-fns';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  Shield, 
  Search,
  UserPlus,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Activity,
  Globe,
  MessageSquare,
  Briefcase,
  Calendar,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

type AppRole = 'startup' | 'advisor' | 'investor' | 'student' | 'mentor' | 'accelerator' | 'admin';

interface UserWithProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole | null;
  is_online: boolean;
  last_seen: string | null;
  created_at: string;
}

interface PlatformStats {
  totalUsers: number;
  totalCompanies: number;
  totalPosts: number;
  totalEvents: number;
  totalJobs: number;
  activeUsers: number;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(urlTab || "overview");
  
  // State
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalPosts: 0,
    totalEvents: 0,
    totalJobs: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sync URL tab param to activeTab
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
      setSearchParams({});
    }
  }, [urlTab, activeTab, setSearchParams]);

  // Redirect if not admin
  useEffect(() => {
    if (!roleLoading && role && role !== 'admin') {
      navigate('/dashboard');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive"
      });
    }
  }, [role, roleLoading, navigate, toast]);

  // Fetch data
  useEffect(() => {
    if (user && role === 'admin') {
      fetchAllData();
    }
  }, [user, role]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUsers(),
      fetchCompanies(),
      fetchPlatformStats()
    ]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: roles, error: rolesError } = await supabase
        .rpc('get_user_roles_batch', { user_ids: userIds });

      if (rolesError) throw rolesError;

      // Map roles to users
      const roleMap = new Map(roles?.map((r: any) => [r.user_id, r.role]) || []);

      const usersWithRoles: UserWithProfile[] = (profiles || []).map(p => ({
        id: p.user_id,
        email: p.email || '',
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        role: roleMap.get(p.user_id) as AppRole || null,
        is_online: p.is_online || false,
        last_seen: p.last_seen,
        created_at: p.created_at
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*, profiles:user_id(full_name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      // Fetch counts in parallel
      const [
        { count: usersCount },
        { count: companiesCount },
        { count: postsCount },
        { count: eventsCount },
        { count: jobsCount },
        { count: activeUsersCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('feed_posts').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_online', true)
      ]);

      setPlatformStats({
        totalUsers: usersCount || 0,
        totalCompanies: companiesCount || 0,
        totalPosts: postsCount || 0,
        totalEvents: eventsCount || 0,
        totalJobs: jobsCount || 0,
        activeUsers: activeUsersCount || 0
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Dashboard data has been updated."
    });
  };

  const handleViewUser = (user: UserWithProfile) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  const handleDeleteUser = (user: UserWithProfile) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      // Note: This would typically require a backend function with proper auth
      toast({
        title: "Action Required",
        description: "User deletion requires backend admin privileges. Contact system administrator.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const getRoleBadgeColor = (role: AppRole | null) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500/20 text-red-400 border-red-500/30',
      startup: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      investor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      mentor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      advisor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      student: 'bg-green-500/20 text-green-400 border-green-500/30',
      accelerator: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    };
    return colors[role || ''] || 'bg-muted text-muted-foreground';
  };

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery || 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-red-500" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Platform management and oversight</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="tech-card border-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="tech-card border-0 p-1 grid grid-cols-4 lg:grid-cols-4 h-auto gap-1">
            <TabsTrigger value="overview" className="flex items-center gap-2 py-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 py-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2 py-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Companies</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 py-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="tech-card border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Users className="h-5 w-5 text-blue-400" />
                    <span className="text-xs text-green-400 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="text-2xl font-bold">{platformStats.totalUsers}</p>
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
                    <p className="text-2xl font-bold">{platformStats.activeUsers}</p>
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
                    <p className="text-2xl font-bold">{platformStats.totalCompanies}</p>
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
                    <p className="text-2xl font-bold">{platformStats.totalPosts}</p>
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
                    <p className="text-2xl font-bold">{platformStats.totalJobs}</p>
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
                    <p className="text-2xl font-bold">{platformStats.totalEvents}</p>
                    <p className="text-xs text-muted-foreground">Events</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Recent Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {users.slice(0, 10).map(user => (
                        <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
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
                            <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                              {user.role || 'No role'}
                            </Badge>
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

              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Recent Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {companies.slice(0, 10).map(company => (
                        <div key={company.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={company.logo_url || ''} />
                              <AvatarFallback>{company.name?.charAt(0) || 'C'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{company.name}</p>
                              <p className="text-xs text-muted-foreground">{company.industry || 'No industry'}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-muted/50">
                            {company.stage || 'Unknown'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="tech-card border-0">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-lg">User Management</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-[200px]"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="startup">Startup</SelectItem>
                        <SelectItem value="investor">Investor</SelectItem>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="advisor">Advisor</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="accelerator">Accelerator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(user => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url || ''} />
                                <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.full_name || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                              {user.role || 'No role'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.is_online ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Online
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Offline
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'Unknown'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewUser(user)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-400 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-6">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="text-lg">Company Management</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map(company => (
                        <TableRow key={company.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={company.logo_url || ''} />
                                <AvatarFallback>{company.name?.charAt(0) || 'C'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{company.name}</p>
                                {company.website && (
                                  <a 
                                    href={company.website} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:underline"
                                  >
                                    {company.website}
                                  </a>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {company.industry || 'Not specified'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-muted/50">
                              {company.stage || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {company.profiles?.full_name || company.profiles?.email || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {company.created_at ? format(new Date(company.created_at), 'MMM d, yyyy') : 'Unknown'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Platform Settings
                </CardTitle>
                <CardDescription>
                  Configure platform-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">Temporarily disable access to the platform</p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/20 text-green-400">
                      Disabled
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                    <div>
                      <p className="font-medium">User Registration</p>
                      <p className="text-sm text-muted-foreground">Allow new users to register</p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/20 text-green-400">
                      Enabled
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Send system email notifications</p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/20 text-green-400">
                      Enabled
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Danger Zone
                  </h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                      Clear All Cache
                    </Button>
                    <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 ml-2">
                      Reset Platform Stats
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="tech-card border-0 !transition-none">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || ''} />
                  <AvatarFallback className="text-xl">{selectedUser.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.full_name || 'Unknown'}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <Badge variant="outline" className={`mt-1 ${getRoleBadgeColor(selectedUser.role)}`}>
                    {selectedUser.role || 'No role'}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedUser.is_online ? 'Online' : 'Offline'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Seen</p>
                  <p className="font-medium">
                    {selectedUser.last_seen 
                      ? format(new Date(selectedUser.last_seen), 'MMM d, yyyy h:mm a') 
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">
                    {selectedUser.created_at 
                      ? format(new Date(selectedUser.created_at), 'MMM d, yyyy') 
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs">{selectedUser.id}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="tech-card border-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.full_name || userToDelete?.email}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
