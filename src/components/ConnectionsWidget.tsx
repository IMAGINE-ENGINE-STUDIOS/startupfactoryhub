import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2, Star, X, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RecommendedConnection {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
  location: string | null;
  compatibility_score: number;
}

const getCompatibilityColor = (score: number) => {
  if (score >= 90) return 'text-green-500';
  if (score >= 80) return 'text-primary';
  if (score >= 70) return 'text-yellow-500';
  return 'text-orange-500';
};

const getCompatibilityLabel = (score: number) => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Great';
  if (score >= 70) return 'Good';
  return 'Fair';
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
        .limit(6);

      if (profiles) {
        // Add role information and generate compatibility score
        const profilesWithRoles = profiles.map(profile => {
          const userRole = userRoles.find(ur => ur.user_id === profile.user_id);
          // Generate compatibility score based on role complementarity
          let baseScore = 70;
          if (roleData === 'startup' && userRole?.role === 'investor') baseScore = 90;
          else if (roleData === 'startup' && userRole?.role === 'mentor') baseScore = 85;
          else if (roleData === 'student' && userRole?.role === 'mentor') baseScore = 92;
          else if (roleData === 'investor' && userRole?.role === 'startup') baseScore = 88;
          
          // Add some randomness
          const compatibility_score = Math.min(99, baseScore + Math.floor(Math.random() * 10));
          
          return {
            ...profile,
            role: userRole?.role || null,
            compatibility_score
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

  const handlePass = (connectionUserId: string) => {
    // Remove from list locally
    setConnections(prev => prev.filter(c => c.user_id !== connectionUserId));
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
      <CardContent>
        {connections.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {connections.map((connection) => (
                <Card 
                  key={connection.user_id} 
                  className="tech-card border-0 hover:scale-[1.02] transition-transform"
                >
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
                        <div className={`flex items-center gap-1 mt-1 ${getCompatibilityColor(connection.compatibility_score)}`}>
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm font-medium">{connection.compatibility_score}%</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {getCompatibilityLabel(connection.compatibility_score)}
                          </span>
                        </div>
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
                        onClick={() => handlePass(connection.user_id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Pass
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 pulse-primary"
                        onClick={() => handleConnect(connection.user_id, connection.full_name || 'this user')}
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Button variant="outline" className="w-full mt-6">
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
