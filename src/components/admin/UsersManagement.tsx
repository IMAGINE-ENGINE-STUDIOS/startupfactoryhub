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
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        location: p.location
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

  const handleViewUser = (user: UserWithProfile) => {
    setSelectedUser(user);
    setShowUserDialog(true);
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

      {/* User Detail Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="tech-card border-0 !transition-none max-w-lg">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>View user details and activity</DialogDescription>
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
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  <Badge variant="outline" className={`mt-1 ${getRoleBadgeColor(selectedUser.role)}`}>
                    {selectedUser.role || 'No role'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedUser.location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{format(new Date(selectedUser.created_at), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedUser.is_online ? 'Online' : 'Offline'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Seen</p>
                  <p className="font-medium">
                    {selectedUser.last_seen ? format(new Date(selectedUser.last_seen), 'MMM dd, HH:mm') : 'Never'}
                  </p>
                </div>
              </div>
              {selectedUser.bio && (
                <div>
                  <p className="text-sm text-muted-foreground">Bio</p>
                  <p className="text-sm">{selectedUser.bio}</p>
                </div>
              )}
            </div>
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