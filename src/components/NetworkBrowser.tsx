import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Search, Users, MessageSquare, UserPlus, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Connection {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
  location: string | null;
  status?: 'accepted' | 'pending';
}

export default function NetworkBrowser() {
  const [currentConnections, setCurrentConnections] = useState<Connection[]>([]);
  const [searchResults, setSearchResults] = useState<Connection[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Connection | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCurrentConnections();
      fetchSuggestedUsers();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchCurrentConnections = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get accepted connections
      const { data: connections } = await supabase
        .from('connections')
        .select('requester_id, addressee_id, status')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (!connections || connections.length === 0) {
        setCurrentConnections([]);
        setLoading(false);
        return;
      }

      // Get user IDs of connections
      const connectedUserIds = connections.map(c => 
        c.requester_id === user.id ? c.addressee_id : c.requester_id
      );

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, bio, location')
        .in('user_id', connectedUserIds);

      if (profiles) {
        // Get roles
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', connectedUserIds);

        const profilesWithRoles = profiles.map(profile => {
          const userRole = userRoles?.find(ur => ur.user_id === profile.user_id);
          return {
            ...profile,
            role: userRole?.role || null,
            status: 'accepted' as const
          };
        });

        setCurrentConnections(profilesWithRoles);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!user || searchQuery.length < 2) return;

    setLoading(true);
    try {
      // Search profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, bio, location')
        .neq('user_id', user.id)
        .ilike('full_name', `%${searchQuery}%`)
        .limit(10);

      if (profiles && profiles.length > 0) {
        // Get roles
        const userIds = profiles.map(p => p.user_id);
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        // Get connection status
        const { data: connections } = await supabase
          .from('connections')
          .select('requester_id, addressee_id, status')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .in('addressee_id', userIds);

        const profilesWithInfo = profiles.map(profile => {
          const userRole = userRoles?.find(ur => ur.user_id === profile.user_id);
          const connection = connections?.find(c => 
            c.requester_id === profile.user_id || c.addressee_id === profile.user_id
          );
          
          return {
            ...profile,
            role: userRole?.role || null,
            status: connection?.status as 'accepted' | 'pending' | undefined
          };
        });

        setSearchResults(profilesWithInfo);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
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

    searchUsers(); // Refresh search results
  };

  const handleMessage = (connectionUserId: string) => {
    navigate(`/messages?user=${connectionUserId}`);
  };

  const fetchSuggestedUsers = async () => {
    if (!user) return;

    try {
      // Get existing connection IDs
      const { data: existingConnections } = await supabase
        .from('connections')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const connectedIds = existingConnections?.flatMap(c => 
        [c.requester_id, c.addressee_id]
      ).filter(id => id !== user.id) || [];

      // Fetch random users not already connected
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, bio, location')
        .neq('user_id', user.id)
        .not('user_id', 'in', connectedIds.length > 0 ? `(${connectedIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)')
        .limit(9);

      if (profiles && profiles.length > 0) {
        // Get roles
        const userIds = profiles.map(p => p.user_id);
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        const profilesWithRoles = profiles.map(profile => {
          const userRole = userRoles?.find(ur => ur.user_id === profile.user_id);
          return {
            ...profile,
            role: userRole?.role || null
          };
        });

        setSuggestedUsers(profilesWithRoles);
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  const viewProfile = (connection: Connection) => {
    setSelectedProfile(connection);
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
      default: return '';
    }
  };

  const renderUserCard = (connection: Connection, isConnected: boolean = false) => (
    <Card key={connection.user_id} className="hover:border-primary transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={connection.avatar_url || undefined} alt={connection.full_name || 'User'} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {connection.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{connection.full_name || 'User'}</h4>
            <Badge variant="secondary" className={`text-xs ${getRoleBadgeColor(connection.role)}`}>
              {getRoleLabel(connection.role)}
            </Badge>
          </div>
        </div>

        {connection.bio && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {connection.bio}
          </p>
        )}

        {connection.location && (
          <p className="text-xs text-muted-foreground mb-3">
            📍 {connection.location}
          </p>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => viewProfile(connection)}
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          
          {isConnected || connection.status === 'accepted' ? (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => handleMessage(connection.user_id)}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Message
            </Button>
          ) : connection.status === 'pending' ? (
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
              className="flex-1"
              onClick={() => handleConnect(connection.user_id, connection.full_name || 'this user')}
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="tech-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find People on Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchQuery.length > 0 && (
            <>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((connection) => renderUserCard(connection, false))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No users found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Current Connections */}
      <Card className="tech-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Your Connections
            <Badge variant="secondary" className="ml-auto">
              {currentConnections.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading connections...</p>
            </div>
          ) : currentConnections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentConnections.map((connection) => renderUserCard(connection, true))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
              <p className="text-sm">Use the search above to find and connect with people</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Connections */}
      {suggestedUsers.length > 0 && (
        <Card className="tech-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Suggested Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedUsers.map((user) => renderUserCard(user, false))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedProfile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                    {selectedProfile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedProfile.full_name || 'User'}</h3>
                  <Badge className={getRoleBadgeColor(selectedProfile.role)}>
                    {getRoleLabel(selectedProfile.role)}
                  </Badge>
                </div>
              </div>

              {selectedProfile.bio && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">About</h4>
                  <p className="text-sm text-muted-foreground">{selectedProfile.bio}</p>
                </div>
              )}

              {selectedProfile.location && (
                <div>
                  <h4 className="text-sm font-semibold mb-1">Location</h4>
                  <p className="text-sm text-muted-foreground">📍 {selectedProfile.location}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedProfile.status === 'accepted' ? (
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      handleMessage(selectedProfile.user_id);
                      setProfileDialogOpen(false);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                ) : selectedProfile.status === 'pending' ? (
                  <Button 
                    variant="secondary"
                    className="flex-1"
                    disabled
                  >
                    Connection Pending
                  </Button>
                ) : (
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      handleConnect(selectedProfile.user_id, selectedProfile.full_name || 'this user');
                      setProfileDialogOpen(false);
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
