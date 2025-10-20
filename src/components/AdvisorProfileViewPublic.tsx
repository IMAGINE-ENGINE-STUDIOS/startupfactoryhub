import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdvisorProfile } from '@/hooks/useAdvisorProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Briefcase, GraduationCap, Award, Code2, Star, 
  Calendar, Users, MapPin, Globe, Linkedin, Mail, MessageSquare
} from 'lucide-react';

interface AdvisorProfileViewPublicProps {
  userId: string;
  onMessage?: () => void;
}

export default function AdvisorProfileViewPublic({ userId, onMessage }: AdvisorProfileViewPublicProps) {
  const [profile, setProfile] = useState<any>(null);
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const {
    experiences,
    education,
    achievements,
    skills,
    loading: profileDataLoading
  } = useAdvisorProfile(userId);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: mentorData } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      setProfile(profileData);
      setMentorProfile(mentorData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || profileDataLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const groupedSkills = skills.reduce((acc: any, skill: any) => {
    const category = skill.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24 border-4 border-primary/20">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="text-2xl">
            {profile.full_name?.[0]?.toUpperCase() || 'A'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
          
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                <Globe className="h-4 w-4" />
                <span>Website</span>
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                <Linkedin className="h-4 w-4" />
                <span>LinkedIn</span>
              </a>
            )}
          </div>

          {onMessage && (
            <Button onClick={onMessage} className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Send Message
            </Button>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      {mentorProfile && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{mentorProfile.years_of_experience || 0}</p>
              <p className="text-sm text-muted-foreground">Years Experience</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{mentorProfile.total_sessions || 0}</p>
              <p className="text-sm text-muted-foreground">Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{mentorProfile.average_rating?.toFixed(1) || '0.0'}</p>
              <p className="text-sm text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{mentorProfile.total_mentees || 0}</p>
              <p className="text-sm text-muted-foreground">Mentees</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* About */}
      {profile.bio && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Expertise Areas */}
      {mentorProfile?.expertise_areas && mentorProfile.expertise_areas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Expertise Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mentorProfile.expertise_areas.map((area: string, index: number) => (
                <Badge key={index} variant="secondary">{area}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {experiences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {experiences.map((exp: any) => (
              <div key={exp.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{exp.title}</h4>
                    <p className="text-sm text-muted-foreground">{exp.company}</p>
                    {exp.location && (
                      <p className="text-xs text-muted-foreground">{exp.location}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      {' - '}
                      {exp.is_current ? 'Present' : new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                    {exp.description && (
                      <p className="text-sm mt-2 whitespace-pre-wrap">{exp.description}</p>
                    )}
                  </div>
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {education.map((edu: any) => (
              <div key={edu.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{edu.degree}</h4>
                    <p className="text-sm text-muted-foreground">{edu.institution}</p>
                    {edu.field_of_study && (
                      <p className="text-sm text-muted-foreground">{edu.field_of_study}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(edu.start_date).getFullYear()}
                      {' - '}
                      {edu.is_current ? 'Present' : new Date(edu.end_date).getFullYear()}
                    </p>
                    {edu.description && (
                      <p className="text-sm mt-2 whitespace-pre-wrap">{edu.description}</p>
                    )}
                  </div>
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements & Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {achievements.map((achievement: any) => (
              <div key={achievement.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.issuer}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(achievement.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    {achievement.description && (
                      <p className="text-sm mt-2 whitespace-pre-wrap">{achievement.description}</p>
                    )}
                  </div>
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedSkills).map(([category, categorySkills]: [string, any]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill: any) => (
                    <Badge key={skill.id} variant="outline">{skill.name}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
