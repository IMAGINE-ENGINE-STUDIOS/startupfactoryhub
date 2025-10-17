import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useFollow } from '@/hooks/useFollow';
import { useProfileViews } from '@/hooks/useProfileViews';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, UserMinus, MapPin, Globe, Briefcase } from 'lucide-react';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    isFollowing,
    followersCount,
    followingCount,
    followUser,
    unfollowUser,
  } = useFollow(userId);

  // Track profile view when dialog opens
  useProfileViews(open ? userId : null);

  useEffect(() => {
    if (userId && open) {
      fetchProfile();
    }
  }, [userId, open]);

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
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = () => {
    if (isFollowing) {
      unfollowUser();
    } else {
      followUser();
    }
  };

  const isOwnProfile = currentUser?.id === userId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
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
                  <Button
                    onClick={handleFollowToggle}
                    variant={isFollowing ? 'outline' : 'default'}
                    size="sm"
                    className="gap-2"
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

            <Separator />

            {/* Bio Section */}
            {profile.bio && (
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            {/* Additional Info */}
            <div className="space-y-2">
              {profile.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4" />
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
