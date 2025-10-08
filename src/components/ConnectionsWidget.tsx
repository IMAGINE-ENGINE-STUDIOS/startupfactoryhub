import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RecommendedConnection {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
  location: string | null;
}

const ConnectionsWidget = () => {
  const [connections, setConnections] = useState<RecommendedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendedConnections();
  }, [user]);

  const fetchRecommendedConnections = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get current user's role
      const { data: roleData } = await supabase
        .rpc('get_user_role', { _user_id: user.id });

      // Get existing connections
      const { data: existingConnections } = await supabase
        .from('connections')
        .select('addressee_id, requester_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const connectedUserIds = new Set(
        existingConnections?.flatMap(c => [c.requester_id, c.addressee_id]) || []
      );
      connectedUserIds.add(user.id);

      // Fetch users with complementary roles
      type AppRole = 'startup' | 'advisor' | 'investor' | 'student' | 'mentor';
      let targetRoles: AppRole[] = [];
      if (roleData === 'startup') {
        targetRoles = ['investor', 'advisor', 'mentor'];
      } else if (roleData === 'investor') {
        targetRoles = ['startup', 'advisor'];
      } else if (roleData === 'student') {
        targetRoles = ['mentor', 'startup'];
      } else if (roleData === 'mentor') {
        targetRoles = ['student', 'startup'];
      } else {
        targetRoles = ['startup', 'investor', 'mentor'];
      }

      // Get users with target roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', targetRoles)
        .limit(20);

      if (!userRoles || userRoles.length === 0) {
        setConnections([]);
        return;
      }

      // Filter out connected users
      const potentialUserIds = userRoles
        .map(ur => ur.user_id)
        .filter(id => !connectedUserIds.has(id));

      if (potentialUserIds.length === 0) {
        setConnections([]);
        return;
      }

      // Fetch profile details
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, bio, location')
        .in('user_id', potentialUserIds)
        .limit(5);

      if (profiles) {
        // Add role information
        const profilesWithRoles = profiles.map(profile => {
          const userRole = userRoles.find(ur => ur.user_id === profile.user_id);
          return {
            ...profile,
            role: userRole?.role || null
          };
        });
        setConnections(profilesWithRoles);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
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
          description: "Failed to send connection request. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Connection Request Sent!",
      description: `Your request to connect with ${connectionName} has been sent.`,
    });

    // Refresh connections
    fetchRecommendedConnections();
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return 'User';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            Recommended Connections
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Users className="w-5 h-5 mr-2 text-primary" />
          Recommended Connections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connections.length > 0 ? (
          <>
            {connections.map((connection) => (
              <div key={connection.user_id} className="flex items-start space-x-3 p-3 rounded-lg border border-border/50 hover:bg-accent/5 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={connection.avatar_url || undefined} alt={connection.full_name || 'User'} />
                  <AvatarFallback>
                    {connection.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm truncate">{connection.full_name || 'User'}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {getRoleLabel(connection.role)}
                    </Badge>
                  </div>
                  
                  {connection.bio && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {connection.bio}
                    </p>
                  )}
                  
                  {connection.location && (
                    <p className="text-xs text-muted-foreground mb-2">
                      📍 {connection.location}
                    </p>
                  )}
                  
                  <div className="flex space-x-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleConnect(connection.user_id, connection.full_name || 'this user')}
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Connect
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full mt-4">
              View All Recommendations
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No recommendations available</p>
            <p className="text-xs mt-1">Check back later for connection suggestions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionsWidget;
