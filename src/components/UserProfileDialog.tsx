import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useFollow } from '@/hooks/useFollow';
import { useConnection } from '@/hooks/useConnection';
import { useProfileViews } from '@/hooks/useProfileViews';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  UserPlus, UserMinus, MapPin, Globe, Briefcase, UserCheck, Clock,
  Building, TrendingUp, Users, DollarSign, FileText, ExternalLink,
  Star, Award, Calendar
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

  const isOwnProfile = currentUser?.id === userId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading profile...</div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>
                  {profile.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div>
                  <h2 className="text-2xl font-bold">
                    {profile.full_name || 'Anonymous User'}
                  </h2>
                  {profile.role && (
                    <Badge variant="secondary" className="mt-1 capitalize">
                      {profile.role}
                    </Badge>
                  )}
                </div>

                {!isOwnProfile && currentUser && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleFollowToggle}
                      variant={isFollowing ? 'outline' : 'default'}
                      size="sm"
                      className="gap-2"
                      disabled={loadingAction}
                    >
                      {isFollowing ? (
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
            <div className="flex gap-4">
              <Card className="flex-1 p-4">
                <div className="text-2xl font-bold">{followersCount}</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </Card>
              <Card className="flex-1 p-4">
                <div className="text-2xl font-bold">{followingCount}</div>
                <div className="text-sm text-muted-foreground">Following</div>
              </Card>
            </div>

            {/* Tabs for detailed information */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
                {(roleData?.company?.pitch_deck_url || roleData?.portfolio) && (
                  <TabsTrigger value="content">Content</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {profile.bio && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground">{profile.bio}</p>
                  </Card>
                )}

                <div className="space-y-2">
                  {profile.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="professional" className="space-y-4 mt-4">
                {profile.role === 'startup' && roleData?.company && (
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          Company Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">{roleData.company.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{roleData.company.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {roleData.company.industry && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{roleData.company.industry}</span>
                            </div>
                          )}
                          {roleData.company.stage && (
                            <div className="flex items-center gap-2">
                              <Badge className={getStageColor(roleData.company.stage)}>
                                {roleData.company.stage.replace('_', ' ')}
                              </Badge>
                            </div>
                          )}
                          {roleData.company.team_size && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{roleData.company.team_size} team members</span>
                            </div>
                          )}
                          {roleData.company.funding_amount > 0 && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formatCurrency(roleData.company.funding_amount)} raised</span>
                            </div>
                          )}
                        </div>

                        {roleData.company.website && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => window.open(roleData.company.website, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit Website
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {profile.role === 'investor' && roleData?.investorProfile && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Investment Focus
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {roleData.investorProfile.investment_range_min && (
                          <div>
                            <p className="text-sm text-muted-foreground">Check Size</p>
                            <p className="text-lg font-semibold">
                              {formatCurrency(roleData.investorProfile.investment_range_min)} - {formatCurrency(roleData.investorProfile.investment_range_max)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Portfolio</p>
                          <p className="text-lg font-semibold">{roleData.investorProfile.portfolio_size} companies</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Invested</p>
                          <p className="text-lg font-semibold">{formatCurrency(roleData.investorProfile.total_invested)}</p>
                        </div>
                      </div>

                      {roleData.investorProfile.investment_focus && (
                        <div>
                          <p className="text-sm font-medium mb-2">Focus Areas</p>
                          <div className="flex flex-wrap gap-2">
                            {roleData.investorProfile.investment_focus.map((focus: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{focus}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {profile.role === 'mentor' && roleData?.mentorProfile && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Mentorship Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Experience</p>
                          <p className="text-lg font-semibold">{roleData.mentorProfile.years_of_experience} years</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Sessions</p>
                          <p className="text-lg font-semibold">{roleData.mentorProfile.total_sessions}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Rating</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-lg font-semibold">{roleData.mentorProfile.average_rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      {roleData.mentorProfile.expertise_areas && (
                        <div>
                          <p className="text-sm font-medium mb-2">Expertise Areas</p>
                          <div className="flex flex-wrap gap-2">
                            {roleData.mentorProfile.expertise_areas.map((area: string, idx: number) => (
                              <Badge key={idx} variant="secondary">{area}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {roleData.mentorProfile.hourly_rate && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">Hourly Rate</p>
                          <p className="text-xl font-bold">{formatCurrency(roleData.mentorProfile.hourly_rate)}/hr</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {!roleData && (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No professional information available</p>
                  </Card>
                )}
              </TabsContent>

              {(roleData?.company?.pitch_deck_url || roleData?.portfolio) && (
                <TabsContent value="content" className="space-y-4 mt-4">
                  {roleData?.company?.pitch_deck_url && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Pitch Deck
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                          <FileText className="h-12 w-12 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium">{roleData.company.name} - Pitch Deck</p>
                            <p className="text-sm text-muted-foreground">PDF Document</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => window.open(roleData.company.pitch_deck_url, '_blank')}
                          className="w-full mt-4"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Pitch Deck
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {roleData?.portfolio && roleData.portfolio.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Portfolio Companies
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          {roleData.portfolio.map((company: any) => (
                            <Card key={company.id} className="p-4">
                              <div className="flex items-center gap-3">
                                {company.company_logo_url && (
                                  <img 
                                    src={company.company_logo_url} 
                                    alt={company.company_name}
                                    className="h-10 w-10 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{company.company_name}</p>
                                  <p className="text-sm text-muted-foreground">{company.industry}</p>
                                </div>
                              </div>
                              {company.investment_amount && (
                                <p className="text-sm font-medium mt-2">
                                  {formatCurrency(company.investment_amount)}
                                </p>
                              )}
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            Profile not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
