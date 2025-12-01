import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useFollow } from '@/hooks/useFollow';
import { useConnection } from '@/hooks/useConnection';
import { useProfileViews } from '@/hooks/useProfileViews';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AdvisorProfileViewPublic from '@/components/AdvisorProfileViewPublic';
import ProfilePostsMosaic from '@/components/ProfilePostsMosaic';
import { 
  UserPlus, UserMinus, MapPin, Globe, Briefcase, UserCheck, Clock,
  Building, TrendingUp, Users, DollarSign, FileText, ExternalLink,
  Star, Award, Calendar, Loader2, MessageCircle
} from 'lucide-react';

interface UserProfile {
  user_id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
  followers_count: number;
  following_count: number;
  role?: string | null;
}

interface RoleSpecificData {
  company?: any;
  investorProfile?: any;
  mentorProfile?: any;
  portfolio?: any[];
}

interface UserProfileDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserProfileDialog({
  userId,
  open,
  onOpenChange,
}: UserProfileDialogProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roleData, setRoleData] = useState<RoleSpecificData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const {
    isFollowing,
    followersCount,
    followingCount,
    followUser,
    unfollowUser,
  } = useFollow(userId);

  const {
    status: connectionStatus,
    sendConnectionRequest,
    acceptConnection,
    removeConnection,
  } = useConnection(userId);

  // Track profile view when dialog opens
  useProfileViews(open ? userId : null);

  useEffect(() => {
    if (userId && open) {
      fetchProfile();
    }
  }, [userId, open]);

  // Real-time connection updates
  useEffect(() => {
    if (!userId || !currentUser) return;

    const channel = supabase
      .channel(`profile-updates-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'connections',
          filter: `requester_id=eq.${currentUser.id},addressee_id=eq.${userId}` 
        },
        () => fetchProfile()
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'connections',
          filter: `requester_id=eq.${userId},addressee_id=eq.${currentUser.id}` 
        },
        () => fetchProfile()
      )
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [userId, currentUser]);

  const fetchProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch role
      const { data: roleData } = await supabase
        .rpc('get_user_role', { _user_id: userId });

      setProfile({
        ...profileData,
        role: roleData as string | null,
      });

      // Fetch role-specific data
      if (roleData) {
        await fetchRoleSpecificData(userId, roleData as string);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleSpecificData = async (uid: string, userRole: string) => {
    try {
      switch(userRole) {
        case 'startup': {
          const { data: company } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', uid)
            .maybeSingle();
          setRoleData({ company });
          break;
        }
        
        case 'investor': {
          const { data: investorProfile } = await supabase
            .from('investor_profiles')
            .select('*')
            .eq('user_id', uid)
            .maybeSingle();
          
          const { data: portfolio } = await supabase
            .from('portfolio_companies')
            .select('*')
            .eq('investor_id', uid)
            .limit(6);
          
          setRoleData({ investorProfile, portfolio });
          break;
        }
        
        case 'mentor': {
          const { data: mentorProfile } = await supabase
            .from('mentor_profiles')
            .select('*')
            .eq('user_id', uid)
            .maybeSingle();
          
          setRoleData({ mentorProfile });
          break;
        }
      }
    } catch (error) {
      console.error('Error fetching role-specific data:', error);
    }
  };

  const handleFollowToggle = async () => {
    setLoadingAction(true);
    try {
      if (isFollowing) {
        await unfollowUser();
        toast({ description: 'Unfollowed successfully' });
      } else {
        await followUser();
        toast({ description: 'Following user' });
      }
    } catch (error) {
      toast({ description: 'Action failed', variant: 'destructive' });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConnectionAction = async (action: 'send' | 'accept' | 'remove') => {
    setLoadingAction(true);
    try {
      if (action === 'send') {
        await sendConnectionRequest();
        toast({ description: 'Connection request sent' });
      } else if (action === 'accept') {
        await acceptConnection();
        toast({ description: 'Connection accepted' });
      } else {
        await removeConnection();
        toast({ description: 'Connection removed' });
      }
    } catch (error) {
      toast({ description: 'Action failed', variant: 'destructive' });
    } finally {
      setLoadingAction(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      idea: 'bg-blue-500',
      mvp: 'bg-purple-500',
      early_stage: 'bg-yellow-500',
      growth: 'bg-green-500',
      scale: 'bg-orange-500',
    };
    return colors[stage] || 'bg-gray-500';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const getRoleBadgeVariant = (role?: string | null): "default" | "secondary" | "destructive" | "outline" => {
    switch(role) {
      case 'startup': return 'default';
      case 'investor': return 'secondary';
      case 'mentor': return 'outline';
      case 'advisor': return 'outline';
      case 'student': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role?: string | null): string => {
    if (!role) return 'User';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const isOwnProfile = currentUser?.id === userId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] overflow-hidden p-0 flex flex-col" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>{profile?.full_name || 'User Profile'}</DialogTitle>
        </VisuallyHidden>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !profile ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header Section - Fixed */}
            <div className="flex-shrink-0 bg-background border-b p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">{profile.full_name?.[0] || profile.full_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold truncate">{profile.full_name || "User"}</h2>
                    <Badge variant={getRoleBadgeVariant(profile.role)}>
                      {getRoleLabel(profile.role)}
                    </Badge>
                  </div>
                  
                  {!isOwnProfile && currentUser && (
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        variant={isFollowing ? "outline" : "default"}
                        onClick={handleFollowToggle}
                        disabled={loadingAction}
                        className="gap-2"
                      >
                        {loadingAction ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" />
                            Follow
                          </>
                        )}
                      </Button>
                      
                      {connectionStatus === 'none' && (
                        <Button
                          onClick={() => handleConnectionAction('send')}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={loadingAction}
                        >
                          <UserPlus className="h-4 w-4" />
                          Connect
                        </Button>
                      )}
                      {connectionStatus === 'pending_sent' && (
                        <Button variant="outline" size="sm" disabled className="gap-2">
                          <Clock className="h-4 w-4" />
                          Pending
                        </Button>
                      )}
                      {connectionStatus === 'pending_received' && (
                        <Button
                          onClick={() => handleConnectionAction('accept')}
                          variant="default"
                          size="sm"
                          className="gap-2"
                          disabled={loadingAction}
                        >
                          <UserCheck className="h-4 w-4" />
                          Accept
                        </Button>
                      )}
                      {connectionStatus === 'connected' && (
                        <Button
                          onClick={() => handleConnectionAction('remove')}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={loadingAction}
                        >
                          <UserCheck className="h-4 w-4" />
                          Connected
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{followersCount}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{followingCount}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
                {!isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto tech-card"
                    onClick={() => {
                      onOpenChange(false);
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('openFloatingChat', { detail: { userId } }));
                      }, 150);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                )}
              </div>
            </div>

            {/* Content Section - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Overview Section */}
              <Card className="tech-card border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.bio && (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  )}
                  
                  <div className="flex flex-col gap-2">
                    {profile.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Role-Specific Professional Info */}
              {(profile.role === 'advisor' || profile.role === 'mentor') && (
                <AdvisorProfileViewPublic userId={userId!} onMessage={() => window.dispatchEvent(new CustomEvent('openFloatingChat', { detail: { userId } }))} />
              )}

              {profile.role === 'startup' && roleData?.company && (
                <Card className="tech-card border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      {roleData.company.name}
                    </CardTitle>
                    {roleData.company.description && (
                      <p className="text-sm text-muted-foreground mt-2">{roleData.company.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {roleData.company.industry && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Industry</p>
                            <p className="text-sm font-medium">{roleData.company.industry}</p>
                          </div>
                        </div>
                      )}
                      {roleData.company.stage && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Stage</p>
                            <Badge variant="outline" className={getStageColor(roleData.company.stage)}>
                              {roleData.company.stage.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      )}
                      {roleData.company.team_size && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Team Size</p>
                            <p className="text-sm font-medium">{roleData.company.team_size} people</p>
                          </div>
                        </div>
                      )}
                      {roleData.company.funding_amount && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Funding</p>
                            <p className="text-sm font-medium">{formatCurrency(roleData.company.funding_amount)}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {roleData.company.pitch_deck_url && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Pitch Deck
                          </h4>
                          <Button
                            onClick={() => window.open(roleData.company.pitch_deck_url, '_blank')}
                            variant="outline"
                            className="w-full gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Pitch Deck
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {profile.role === 'investor' && roleData?.investorProfile && (
                <Card className="tech-card border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Investment Focus
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {roleData.investorProfile.portfolio_size > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Portfolio Size</p>
                          <p className="text-2xl font-bold">{roleData.investorProfile.portfolio_size}</p>
                        </div>
                      )}
                      {roleData.investorProfile.investment_range_min && roleData.investorProfile.investment_range_max && (
                        <div>
                          <p className="text-xs text-muted-foreground">Check Size</p>
                          <p className="text-sm font-medium">
                            {formatCurrency(roleData.investorProfile.investment_range_min)} - {formatCurrency(roleData.investorProfile.investment_range_max)}
                          </p>
                        </div>
                      )}
                      {roleData.investorProfile.total_invested > 0 && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Total Invested</p>
                          <p className="text-2xl font-bold">{formatCurrency(roleData.investorProfile.total_invested)}</p>
                        </div>
                      )}
                    </div>

                    {roleData.portfolio && roleData.portfolio.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Portfolio Companies</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {roleData.portfolio.slice(0, 4).map((company: any) => (
                              <div key={company.id} className="p-3 border border-border/30 rounded-lg bg-background/50">
                                <p className="font-medium text-sm">{company.company_name}</p>
                                <p className="text-xs text-muted-foreground">{company.industry}</p>
                              </div>
                            ))}
                          </div>
                          {roleData.portfolio.length > 4 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              +{roleData.portfolio.length - 4} more companies
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {profile.role === 'mentor' && roleData?.mentorProfile && (
                <Card className="tech-card border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Mentorship Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {roleData.mentorProfile.years_of_experience && (
                        <div>
                          <p className="text-xs text-muted-foreground">Experience</p>
                          <p className="text-2xl font-bold">{roleData.mentorProfile.years_of_experience} years</p>
                        </div>
                      )}
                      {roleData.mentorProfile.total_sessions > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Sessions</p>
                          <p className="text-2xl font-bold">{roleData.mentorProfile.total_sessions}</p>
                        </div>
                      )}
                      {roleData.mentorProfile.average_rating > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">Rating</p>
                          <p className="text-2xl font-bold">⭐ {roleData.mentorProfile.average_rating.toFixed(1)}</p>
                        </div>
                      )}
                      {roleData.mentorProfile.hourly_rate && (
                        <div>
                          <p className="text-xs text-muted-foreground">Hourly Rate</p>
                          <p className="text-lg font-bold">{formatCurrency(roleData.mentorProfile.hourly_rate)}</p>
                        </div>
                      )}
                    </div>

                    {roleData.mentorProfile.expertise_areas && roleData.mentorProfile.expertise_areas.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Expertise Areas</h4>
                          <div className="flex flex-wrap gap-2">
                            {roleData.mentorProfile.expertise_areas.map((area: string, index: number) => (
                              <Badge key={index} variant="secondary">{area}</Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Posts Section */}
              <Card className="tech-card border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfilePostsMosaic userId={userId!} isOwnProfile={isOwnProfile} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
