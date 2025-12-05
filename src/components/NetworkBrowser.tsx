import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users, MessageSquare, UserPlus, Eye, UserCheck, UserX, Bell } from 'lucide-react';
import UserProfileDialog from '@/components/UserProfileDialog';
import { useNotifications } from '@/hooks/useNotifications';

interface Connection {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
  location: string | null;
  status?: 'accepted' | 'pending';
}

interface PendingRequest extends Connection {
  connection_id: string;
}

export default function NetworkBrowser() {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Connection | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { createNotification } = useNotifications();

  useEffect(() => {
    if (user) {
      fetchPendingRequests();
      fetchSuggestedUsers();
    }
  }, [user]);

  // Real-time connection updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('connection-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'connections',
          filter: `requester_id=eq.${user.id}` 
        },
        () => {
          fetchPendingRequests();
          fetchSuggestedUsers();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'connections',
          filter: `addressee_id=eq.${user.id}` 
        },
        () => {
          fetchPendingRequests();
          fetchSuggestedUsers();
        }
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchPendingRequests = async () => {
    if (!user) return;

    try {
      // Get pending connection requests where current user is the addressee
      const { data: requests } = await supabase
        .from('connections')
        .select('id, requester_id')
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (!requests || requests.length === 0) {
        setPendingRequests([]);
        return;
      }

      // Get requester user IDs
      const requesterIds = requests.map(r => r.requester_id);

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, bio, location')
        .in('user_id', requesterIds);

      if (profiles) {
        // Get roles
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', requesterIds);

        const profilesWithRoles = profiles.map(profile => {
          const userRole = userRoles?.find(ur => ur.user_id === profile.user_id);
          const request = requests.find(r => r.requester_id === profile.user_id);
          return {
            ...profile,
            role: userRole?.role || null,
            connection_id: request!.id
          };
        });

        setPendingRequests(profilesWithRoles);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
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

    fetchSuggestedUsers(); // Refresh suggested users
  };

  const handleAcceptRequest = async (connectionId: string, requesterName: string, requesterId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept connection request.",
        variant: "destructive",
      });
      return;
    }

    // Get current user profile for notification
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    // Send notification to requester
    await createNotification({
      userId: requesterId,
      title: 'Connection Accepted',
      message: `${userProfile?.full_name || 'Someone'} accepted your connection request`,
      type: 'connection',
    });

    toast({
      title: "Connection Accepted!",
      description: `You are now connected with ${requesterName}.`,
    });

    fetchPendingRequests();
    fetchSuggestedUsers();
  };

  const handleDeclineRequest = async (connectionId: string, requesterName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to decline connection request.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Request Declined",
      description: `Connection request from ${requesterName} has been declined.`,
    });

    fetchPendingRequests();
  };

  const handleMessage = (connectionUserId: string) => {
    window.dispatchEvent(new CustomEvent('openFloatingChat', { 
      detail: { userId: connectionUserId } 
    }));
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
    <Card key={connection.user_id} className="tech-card border-0 hover:scale-[1.02] transition-transform">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={connection.avatar_url || undefined} alt={connection.full_name || 'User'} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
              {connection.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">{connection.full_name || 'User'}</h4>
            <Badge variant="secondary" className={`text-xs ${getRoleBadgeColor(connection.role)}`}>
              {getRoleLabel(connection.role)}
            </Badge>
          </div>
        </div>

        {connection.bio && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {connection.bio}
          </p>
        )}

        {connection.location && (
          <p className="text-xs text-muted-foreground mb-4">
            📍 {connection.location}
          </p>
        )}

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => viewProfile(connection)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          
          {isConnected || connection.status === 'accepted' ? (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => handleMessage(connection.user_id)}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
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
              className="flex-1 pulse-primary"
              onClick={() => handleConnect(connection.user_id, connection.full_name || 'this user')}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Connection Requests Section */}
      {pendingRequests.length > 0 && (
        <Card className="tech-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Connection Requests
              <Badge variant="default" className="ml-auto">
                {pendingRequests.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRequests.map((request) => (
                <Card key={request.connection_id} className="border-primary/30 hover:border-primary transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        <AvatarImage src={request.avatar_url || undefined} alt={request.full_name || 'User'} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {request.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{request.full_name || 'User'}</h4>
                        <Badge variant="secondary" className={`text-xs ${getRoleBadgeColor(request.role)}`}>
                          {getRoleLabel(request.role)}
                        </Badge>
                      </div>
                    </div>

                    {request.bio && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {request.bio}
                      </p>
                    )}

                    {request.location && (
                      <p className="text-xs text-muted-foreground mb-3">
                        📍 {request.location}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => viewProfile(request)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default"
                        className="flex-1 bg-green-500 hover:bg-green-600"
                        onClick={() => handleAcceptRequest(request.connection_id, request.full_name || 'this user', request.user_id)}
                      >
                        <UserCheck className="w-3 h-3 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDeclineRequest(request.connection_id, request.full_name || 'this user')}
                      >
                        <UserX className="w-3 h-3 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


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
      <UserProfileDialog 
        userId={selectedProfile?.user_id || null}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </div>
  );
}
