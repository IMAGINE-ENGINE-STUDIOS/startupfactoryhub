import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Briefcase, GraduationCap, Award, Plus, Edit, Save, X, MapPin, Calendar, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  current: boolean;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  description: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  organization: string;
}

export default function ProfessionalBackground() {
  const [profile, setProfile] = useState<any>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchExperiences();
      fetchEducation();
      fetchAchievements();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setEditingProfile(data);
    }
  };

  const fetchExperiences = async () => {
    // Mock data for experiences - in real app this would be from a dedicated table
    const mockExperiences: Experience[] = [
      {
        id: '1',
        title: 'Senior Product Manager',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        start_date: '2020-01',
        end_date: '',
        description: 'Led product strategy for B2B SaaS platform serving 50k+ users. Increased user engagement by 40% through data-driven feature development.',
        current: true
      },
      {
        id: '2',
        title: 'Product Manager',
        company: 'StartupXYZ',
        location: 'New York, NY',
        start_date: '2018-06',
        end_date: '2019-12',
        description: 'Managed product roadmap for mobile application. Successfully launched 3 major features that increased retention by 25%.',
        current: false
      }
    ];
    setExperiences(mockExperiences);
  };

  const fetchEducation = async () => {
    // Mock data for education
    const mockEducation: Education[] = [
      {
        id: '1',
        degree: 'MBA',
        institution: 'Stanford Graduate School of Business',
        field_of_study: 'Technology Management',
        start_date: '2016-09',
        end_date: '2018-06',
        description: 'Focused on technology entrepreneurship and product management. Graduated with honors.'
      },
      {
        id: '2',
        degree: 'Bachelor of Science',
        institution: 'UC Berkeley',
        field_of_study: 'Computer Science',
        start_date: '2012-09',
        end_date: '2016-05',
        description: 'Concentrated in software engineering and human-computer interaction.'
      }
    ];
    setEducation(mockEducation);
  };

  const fetchAchievements = async () => {
    // Mock data for achievements
    const mockAchievements: Achievement[] = [
      {
        id: '1',
        title: 'Top 40 Under 40 in Tech',
        description: 'Recognized for innovation in product management and startup mentorship.',
        date: '2023-03',
        organization: 'Tech Leadership Awards'
      },
      {
        id: '2',
        title: 'Product Manager of the Year',
        description: 'Awarded for exceptional product strategy and team leadership.',
        date: '2022-11',
        organization: 'Product Management Institute'
      }
    ];
    setAchievements(mockAchievements);
  };

  const updateProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editingProfile.full_name,
        bio: editingProfile.bio,
        linkedin_url: editingProfile.linkedin_url,
        website: editingProfile.website,
        focus_areas: editingProfile.focus_areas,
        experience_level: editingProfile.experience_level,
        location: editingProfile.location
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
      return;
    }

    setProfile(editingProfile);
    setIsEditing(false);
    toast({
      title: "Success",
      description: "Profile updated successfully!",
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getExperienceYears = () => {
    if (!experiences.length) return '0';
    const totalMonths = experiences.reduce((total, exp) => {
      const start = new Date(exp.start_date);
      const end = exp.current ? new Date() : new Date(exp.end_date);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return total + months;
    }, 0);
    return Math.floor(totalMonths / 12).toString();
  };

  if (!profile) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="tech-card border-0">
        <CardContent className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                  {profile.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                {isEditing ? (
                  <div className="space-y-4">
                    <Input
                      value={editingProfile.full_name || ''}
                      onChange={(e) => setEditingProfile({...editingProfile, full_name: e.target.value})}
                      placeholder="Full Name"
                      className="text-xl font-bold"
                    />
                    <Input
                      value={editingProfile.location || ''}
                      onChange={(e) => setEditingProfile({...editingProfile, location: e.target.value})}
                      placeholder="Location"
                    />
                    <Select value={editingProfile.experience_level || ''} onValueChange={(value) => setEditingProfile({...editingProfile, experience_level: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Experience Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                        <SelectItem value="mid">Mid-level (3-5 years)</SelectItem>
                        <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                        <SelectItem value="executive">Executive (10+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{profile.full_name}</h1>
                    <p className="text-lg text-muted-foreground mb-2">
                      {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)} • {getExperienceYears()}+ years experience
                    </p>
                    {profile.location && (
                      <div className="flex items-center text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {profile.location}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button onClick={updateProfile} size="sm" className="pulse-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <Textarea
                value={editingProfile.bio || ''}
                onChange={(e) => setEditingProfile({...editingProfile, bio: e.target.value})}
                placeholder="Professional bio..."
                className="min-h-[100px]"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  value={editingProfile.linkedin_url || ''}
                  onChange={(e) => setEditingProfile({...editingProfile, linkedin_url: e.target.value})}
                  placeholder="LinkedIn URL"
                />
                <Input
                  value={editingProfile.website || ''}
                  onChange={(e) => setEditingProfile({...editingProfile, website: e.target.value})}
                  placeholder="Website URL"
                />
              </div>
              <Input
                value={editingProfile.focus_areas?.join(', ') || ''}
                onChange={(e) => setEditingProfile({...editingProfile, focus_areas: e.target.value.split(', ')})}
                placeholder="Areas of expertise (comma-separated)"
              />
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-4 max-w-3xl">{profile.bio}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.focus_areas?.map((area: string, idx: number) => (
                  <Badge key={idx} variant="secondary">{area}</Badge>
                ))}
              </div>
              <div className="flex space-x-4 text-sm text-muted-foreground">
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    LinkedIn Profile
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    Personal Website
                  </a>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Tabs defaultValue="experience" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="achievements">Awards</TabsTrigger>
        </TabsList>

        <TabsContent value="experience" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span>Professional Experience</span>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 border-primary/20 pl-6 pb-6 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{exp.title}</h3>
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Building className="h-4 w-4" />
                        <span>{exp.company}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(exp.start_date)} - {exp.current ? 'Present' : formatDate(exp.end_date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{exp.location}</span>
                        </div>
                      </div>
                    </div>
                    {exp.current && (
                      <Badge variant="default" className="bg-green-500">Current</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{exp.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span>Education</span>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Education
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {education.map((edu) => (
                <div key={edu.id} className="border-l-2 border-accent/20 pl-6 pb-6 last:pb-0">
                  <h3 className="text-lg font-semibold text-foreground">{edu.degree}</h3>
                  <p className="text-muted-foreground font-medium">{edu.institution}</p>
                  <p className="text-sm text-muted-foreground">{edu.field_of_study}</p>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(edu.start_date)} - {formatDate(edu.end_date)}</span>
                  </div>
                  <p className="text-muted-foreground mt-2">{edu.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span>Awards & Achievements</span>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Achievement
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="border-l-2 border-yellow-500/20 pl-6 pb-6 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{achievement.title}</h3>
                      <p className="text-muted-foreground font-medium">{achievement.organization}</p>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(achievement.date)}</span>
                      </div>
                    </div>
                    <Award className="h-6 w-6 text-yellow-500" />
                  </div>
                  <p className="text-muted-foreground">{achievement.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}