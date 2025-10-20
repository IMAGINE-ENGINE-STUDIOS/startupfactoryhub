import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileDialog from '@/components/UserProfileDialog';
import { UserCheck, Users, Star, MessageSquare, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Mentor {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  expertise_areas: string[];
  years_of_experience?: number;
  average_rating?: number;
  total_sessions?: number;
  bio?: string;
  connection_type: 'active' | 'past';
}

export default function MentorAdvisorNetwork() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMentorNetwork();
    }
  }, [user]);

  const fetchMentorNetwork = async () => {
    if (!user) return;

    try {
      // Get active and past mentorship relationships
      const { data: relationships } = await supabase
        .from('mentorship_relationships')
        .select(`
          id,
          mentor_id,
          status
        `)
        .eq('mentee_id', user.id)
        .in('status', ['active', 'completed']);

      if (!relationships || relationships.length === 0) {
        setMentors([]);
        setLoading(false);
        return;
      }

      // Get mentor IDs
      const mentorIds = relationships.map(r => r.mentor_id);

      // Fetch mentor profiles separately
      const { data: mentorProfiles } = await supabase
        .from('mentor_profiles')
        .select('*')
        .in('user_id', mentorIds);

      // Fetch user profiles separately
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', mentorIds);

      const mentorsList = relationships
        .map(rel => {
          const mentorProfile = mentorProfiles?.find(mp => mp.user_id === rel.mentor_id);
          const userProfile = userProfiles?.find(up => up.user_id === rel.mentor_id);

          if (!mentorProfile || !userProfile) return null;

          const mentor: Mentor = {
            id: rel.id,
            user_id: rel.mentor_id,
            full_name: userProfile.full_name || 'Unknown',
            avatar_url: userProfile.avatar_url || undefined,
            expertise_areas: mentorProfile.expertise_areas || [],
            years_of_experience: mentorProfile.years_of_experience || undefined,
            average_rating: mentorProfile.average_rating || undefined,
            total_sessions: mentorProfile.total_sessions || undefined,
            bio: userProfile.bio || undefined,
            connection_type: (rel.status === 'active' ? 'active' : 'past') as 'active' | 'past'
          };
          return mentor;
        })
        .filter(m => m !== null) as Mentor[];

      setMentors(mentorsList);
    } catch (error) {
      console.error('Error fetching mentor network:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageMentor = (mentorId: string) => {
    navigate('/messages', { state: { userId: mentorId } });
  };

  const handleScheduleSession = (mentorId: string) => {
    navigate('/calendar', { state: { mentorId } });
  };

  const handleViewProfile = (mentorId: string) => {
    setSelectedMentorId(mentorId);
    setProfileDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your mentor network...</p>
        </CardContent>
      </Card>
    );
  }

  if (mentors.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <UserCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-semibold mb-2">No Mentors or Advisors Yet</h3>
          <p className="text-muted-foreground mb-4">
            Connect with experienced mentors and advisors to help grow your startup
          </p>
          <Button onClick={() => navigate('/explore')}>
            <Users className="h-4 w-4 mr-2" />
            Find Mentors
          </Button>
        </CardContent>
      </Card>
    );
  }

  const activeMentors = mentors.filter(m => m.connection_type === 'active');
  const pastMentors = mentors.filter(m => m.connection_type === 'past');

  return (
    <div className="space-y-6">
      {activeMentors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Active Mentors & Advisors ({activeMentors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeMentors.map((mentor) => (
                <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={mentor.avatar_url} alt={mentor.full_name} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {mentor.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{mentor.full_name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {mentor.years_of_experience && (
                            <span>{mentor.years_of_experience}+ years exp</span>
                          )}
                          {mentor.average_rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{mentor.average_rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {mentor.bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {mentor.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {mentor.expertise_areas?.slice(0, 3).map((area, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewProfile(mentor.user_id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleMessageMentor(mentor.user_id)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleScheduleSession(mentor.user_id)}
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule
                      </Button>
                    </div>

                    {mentor.total_sessions && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {mentor.total_sessions} sessions completed
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pastMentors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Past Mentors & Advisors ({pastMentors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastMentors.map((mentor) => (
                <Card key={mentor.id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={mentor.avatar_url} alt={mentor.full_name} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {mentor.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{mentor.full_name}</h4>
                        <Badge variant="outline" className="text-xs">
                          Past Mentor
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {mentor.expertise_areas?.slice(0, 3).map((area, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewProfile(mentor.user_id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleMessageMentor(mentor.user_id)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Dialog */}
      <UserProfileDialog 
        userId={selectedMentorId}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </div>
  );
}
