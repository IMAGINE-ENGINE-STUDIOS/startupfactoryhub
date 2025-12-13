import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Search, 
  Eye, 
  Ban, 
  CheckCircle, 
  Trash2, 
  Users,
  RefreshCw,
  Filter,
  MoreVertical,
  Building,
  Briefcase,
  GraduationCap,
  TrendingUp,
  MapPin,
  Globe,
  MessageSquare,
  Link2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getIndustryLabel } from '@/lib/constants';

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
  bio: string | null;
  location: string | null;
  website: string | null;
  linkedin_url: string | null;
}

interface RoleSpecificData {
  company?: any;
  investorProfile?: any;
  mentorProfile?: any;
  acceleratorProfile?: any;
  skills?: any[];
  experiences?: any[];
  postsCount?: number;
  connectionsCount?: number;
}

const UsersManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roleSpecificData, setRoleSpecificData] = useState<RoleSpecificData>({});
  const [loadingRoleData, setLoadingRoleData] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: roles, error: rolesError } = await supabase
        .rpc('get_user_roles_batch', { user_ids: userIds });

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map((r: any) => [r.user_id, r.role]) || []);

      const usersWithRoles: UserWithProfile[] = (profiles || []).map(p => ({
        id: p.user_id,
        email: p.email || '',
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        role: roleMap.get(p.user_id) as AppRole || null,
        is_online: p.is_online || false,
        last_seen: p.last_seen,
        created_at: p.created_at,
        bio: p.bio,
        location: p.location,
        website: p.website,
        linkedin_url: p.linkedin_url
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleSpecificData = async (user: UserWithProfile) => {
    setLoadingRoleData(true);
    const data: RoleSpecificData = {};

    try {
      // Fetch posts count
      const { count: postsCount } = await supabase
        .from('feed_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      data.postsCount = postsCount || 0;

      // Fetch connections count
      const { count: connectionsCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');
      data.connectionsCount = connectionsCount || 0;

      // Role-specific data
      if (user.role === 'startup') {
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .single();
        data.company = company;
      }

      if (user.role === 'investor') {
        const { data: investorProfile } = await supabase
          .from('investor_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        data.investorProfile = investorProfile;
      }

      if (user.role === 'mentor' || user.role === 'advisor') {
        const { data: skills } = await supabase
          .from('advisor_skills')
          .select('*')
          .eq('user_id', user.id);
        data.skills = skills || [];

        const { data: experiences } = await supabase
          .from('advisor_experiences')
          .select('*')
          .eq('user_id', user.id)
          .order('start_date', { ascending: false })
          .limit(3);
        data.experiences = experiences || [];
      }

      if (user.role === 'accelerator') {
        const { data: acceleratorProfile } = await supabase
          .from('accelerator_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        data.acceleratorProfile = acceleratorProfile;
      }

      setRoleSpecificData(data);
    } catch (error) {
      console.error('Error fetching role data:', error);
    } finally {
      setLoadingRoleData(false);
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery || 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleViewUser = async (user: UserWithProfile) => {
    setSelectedUser(user);
    setShowUserDialog(true);
    await fetchRoleSpecificData(user);
  };

  const handleSuspendUser = async (user: UserWithProfile) => {
    toast({
      title: "Action Required",
      description: "User suspension requires backend admin privileges.",
      variant: "destructive"
    });
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
      {/* Filters */}
      <Card className="tech-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 tech-card border-0"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px] tech-card border-0">
                <Filter className="h-4 w-4 mr-2" />
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
            <Button variant="outline" onClick={fetchUsers} className="tech-card border-0">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback>{user.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                        {user.role || 'No role'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_online ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse" />
                          Online
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Offline
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(user.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.last_seen ? format(new Date(user.last_seen), 'MMM dd, HH:mm') : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewUser(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSuspendUser(user)} className="text-amber-500">
                            <Ban className="h-4 w-4 mr-2" />
                            Suspend User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Enhanced User Detail Dialog */}
      <Dialog open={showUserDialog} onOpenChange={(open) => {
        setShowUserDialog(open);
        if (!open) setRoleSpecificData({});
      }}>
        <DialogContent className="tech-card border-0 !transition-none max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>Comprehensive user details and activity</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatar_url || ''} />
                    <AvatarFallback className="text-xl">{selectedUser.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{selectedUser.full_name || 'Unknown'}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getRoleBadgeColor(selectedUser.role)}>
                        {selectedUser.role || 'No role'}
                      </Badge>
                      {selectedUser.is_online && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-1" />
                          Online
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <MessageSquare className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{roleSpecificData.postsCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <Link2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{roleSpecificData.connectionsCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Connections</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <MapPin className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium truncate">{selectedUser.location || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">Location</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <GraduationCap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{format(new Date(selectedUser.created_at), 'MMM yyyy')}</p>
                    <p className="text-xs text-muted-foreground">Joined</p>
                  </div>
                </div>

                {/* Bio */}
                {selectedUser.bio && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Bio</p>
                    <p className="text-sm">{selectedUser.bio}</p>
                  </div>
                )}

                {/* Links */}
                <div className="flex gap-4">
                  {selectedUser.website && (
                    <a href={selectedUser.website} target="_blank" rel="noopener noreferrer" 
                       className="flex items-center gap-1 text-sm text-primary hover:underline">
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  {selectedUser.linkedin_url && (
                    <a href={selectedUser.linkedin_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1 text-sm text-primary hover:underline">
                      <Briefcase className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                </div>

                {/* Role-Specific Content */}
                {loadingRoleData ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <Tabs defaultValue="details" className="mt-4">
                    <TabsList className="w-full">
                      <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                      {(selectedUser.role === 'mentor' || selectedUser.role === 'advisor') && (
                        <TabsTrigger value="experience" className="flex-1">Experience</TabsTrigger>
                      )}
                    </TabsList>
                    
                    <TabsContent value="details" className="mt-4 space-y-4">
                      {/* Startup Details */}
                      {selectedUser.role === 'startup' && roleSpecificData.company && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Company Details
                          </h4>
                          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30">
                            <div>
                              <p className="text-xs text-muted-foreground">Company Name</p>
                              <p className="font-medium">{roleSpecificData.company.name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Industry</p>
                              <p className="font-medium">{getIndustryLabel(roleSpecificData.company.industry) || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Stage</p>
                              <Badge variant="outline" className="capitalize">
                                {roleSpecificData.company.stage || 'N/A'}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Team Size</p>
                              <p className="font-medium">{roleSpecificData.company.team_size || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Funding</p>
                              <p className="font-medium">
                                {roleSpecificData.company.funding_amount 
                                  ? `$${(roleSpecificData.company.funding_amount / 1000000).toFixed(1)}M`
                                  : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Founded</p>
                              <p className="font-medium">{roleSpecificData.company.founded_year || 'N/A'}</p>
                            </div>
                          </div>
                          {roleSpecificData.company.description && (
                            <p className="text-sm text-muted-foreground">{roleSpecificData.company.description}</p>
                          )}
                        </div>
                      )}

                      {/* Investor Details */}
                      {selectedUser.role === 'investor' && roleSpecificData.investorProfile && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Investor Profile
                          </h4>
                          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30">
                            <div>
                              <p className="text-xs text-muted-foreground">Investment Focus</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {roleSpecificData.investorProfile.investment_focus?.map((focus: string) => (
                                  <Badge key={focus} variant="secondary" className="text-xs">{focus}</Badge>
                                )) || <span className="text-sm">N/A</span>}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Preferred Stages</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {roleSpecificData.investorProfile.preferred_stages?.map((stage: string) => (
                                  <Badge key={stage} variant="outline" className="text-xs capitalize">{stage}</Badge>
                                )) || <span className="text-sm">N/A</span>}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Portfolio Size</p>
                              <p className="font-medium">{roleSpecificData.investorProfile.portfolio_size || 0}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Invested</p>
                              <p className="font-medium">
                                {roleSpecificData.investorProfile.total_invested 
                                  ? `$${(roleSpecificData.investorProfile.total_invested / 1000000).toFixed(1)}M`
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Accelerator Details */}
                      {selectedUser.role === 'accelerator' && roleSpecificData.acceleratorProfile && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Accelerator Profile
                          </h4>
                          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30">
                            <div>
                              <p className="text-xs text-muted-foreground">Organization</p>
                              <p className="font-medium">{roleSpecificData.acceleratorProfile.organization_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Program Duration</p>
                              <p className="font-medium">{roleSpecificData.acceleratorProfile.program_duration || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Funding Offered</p>
                              <p className="font-medium">
                                {roleSpecificData.acceleratorProfile.funding_offered 
                                  ? `$${(roleSpecificData.acceleratorProfile.funding_offered / 1000).toFixed(0)}K`
                                  : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Equity %</p>
                              <p className="font-medium">
                                {roleSpecificData.acceleratorProfile.equity_percentage 
                                  ? `${roleSpecificData.acceleratorProfile.equity_percentage}%`
                                  : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Cohorts</p>
                              <p className="font-medium">{roleSpecificData.acceleratorProfile.total_cohorts || 0}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Startups Supported</p>
                              <p className="font-medium">{roleSpecificData.acceleratorProfile.total_startups_supported || 0}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mentor/Advisor Skills */}
                      {(selectedUser.role === 'mentor' || selectedUser.role === 'advisor') && roleSpecificData.skills && roleSpecificData.skills.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {roleSpecificData.skills.map((skill: any) => (
                              <Badge key={skill.id} variant="secondary" className="text-xs">
                                {skill.skill_name}
                                {skill.endorsement_count > 0 && (
                                  <span className="ml-1 text-primary">+{skill.endorsement_count}</span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {(selectedUser.role === 'mentor' || selectedUser.role === 'advisor') && (
                      <TabsContent value="experience" className="mt-4 space-y-4">
                        {roleSpecificData.experiences && roleSpecificData.experiences.length > 0 ? (
                          roleSpecificData.experiences.map((exp: any) => (
                            <div key={exp.id} className="p-3 rounded-lg bg-muted/30">
                              <p className="font-medium">{exp.title}</p>
                              <p className="text-sm text-muted-foreground">{exp.company}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(exp.start_date), 'MMM yyyy')} - {exp.is_current ? 'Present' : exp.end_date ? format(new Date(exp.end_date), 'MMM yyyy') : 'N/A'}
                              </p>
                              {exp.description && (
                                <p className="text-sm mt-2">{exp.description}</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">No experience added</p>
                        )}
                      </TabsContent>
                    )}
                  </Tabs>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;