import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Search, MessageSquare, UserPlus, Eye, Loader2 } from 'lucide-react';
import UserProfileDialog from '@/components/UserProfileDialog';

interface FilteredUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
  location: string | null;
  status?: 'accepted' | 'pending';
}

interface RoleFilteredNetworkBrowserProps {
  roleFilter: 'mentor' | 'investor' | 'startup' | 'advisor' | 'student' | 'accelerator';
  title?: string;
  emptyMessage?: string;
}

export default function RoleFilteredNetworkBrowser({ 
  roleFilter, 
  title,
  emptyMessage 
}: RoleFilteredNetworkBrowserProps) {
  const [users, setUsers] = useState<FilteredUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<FilteredUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<FilteredUser | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUsersByRole();
    }
  }, [user, roleFilter]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(u => 
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsersByRole = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get users with the specified role
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', roleFilter);

      if (!userRoles || userRoles.length === 0) {
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }

      const userIds = userRoles.map(ur => ur.user_id).filter(id => id !== user.id);

      if (userIds.length === 0) {
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, bio, location')
        .in('user_id', userIds);

      if (!profiles) {
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }

      // Get connection status for each user
      const { data: connections } = await supabase
        .from('connections')
        .select('requester_id, addressee_id, status')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const profilesWithInfo = profiles.map(profile => {
        const connection = connections?.find(c => 
          c.requester_id === profile.user_id || c.addressee_id === profile.user_id
        );
        
        return {
          ...profile,
          role: roleFilter,
          status: connection?.status as 'accepted' | 'pending' | undefined
        };
      });

      setUsers(profilesWithInfo);
      setFilteredUsers(profilesWithInfo);
    } catch (error) {
      console.error('Error fetching users by role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (connectionUserId: string, connectionName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('connections')
      .insert({
        requester_id: user.id,
        addressee_id: connectionUserId,
        status: 'pending'
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already Connected",
          description: "You've already sent a connection request to this user.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send connection request.",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Connection Request Sent!",
      description: `Your request to connect with ${connectionName} has been sent.`,
    });

    fetchUsersByRole();
  };

  const handleMessage = (connectionUserId: string) => {
    window.dispatchEvent(new CustomEvent('openFloatingChat', { 
      detail: { userId: connectionUserId } 
    }));
  };

  const viewProfile = (profile: FilteredUser) => {
    setSelectedProfile(profile);
    setProfileDialogOpen(true);
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return 'User';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'startup': return 'bg-blue-500/10 text-blue-500';
      case 'investor': return 'bg-green-500/10 text-green-500';
      case 'mentor': return 'bg-purple-500/10 text-purple-500';
      case 'advisor': return 'bg-yellow-500/10 text-yellow-500';
      case 'student': return 'bg-pink-500/10 text-pink-500';
      case 'accelerator': return 'bg-emerald-500/10 text-emerald-500';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${roleFilter}s...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-muted-foreground/20">
          <p className="text-muted-foreground">
            {emptyMessage || `No ${roleFilter}s found`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((profile) => (
            <Card key={profile.user_id} className="tech-card border-0 hover:scale-[1.02] transition-transform">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || 'User'} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
                      {profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{profile.full_name || 'User'}</h4>
                    <Badge variant="secondary" className={`text-xs ${getRoleBadgeColor(profile.role)}`}>
                      {getRoleLabel(profile.role)}
                    </Badge>
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {profile.bio}
                  </p>
                )}

                {profile.location && (
                  <p className="text-xs text-muted-foreground mb-4">
                    📍 {profile.location}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => viewProfile(profile)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  
                  {profile.status === 'accepted' ? (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleMessage(profile.user_id)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                  ) : profile.status === 'pending' ? (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      className="flex-1"
                      disabled
                    >
                      Pending
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      className="flex-1 pulse-primary"
                      onClick={() => handleConnect(profile.user_id, profile.full_name || 'this user')}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Profile Dialog */}
      <UserProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        userId={selectedProfile?.user_id || ''}
      />
    </div>
  );
}
