import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import AvatarUpload from '@/components/AvatarUpload';
import ProfilePostsMosaic from '@/components/ProfilePostsMosaic';
import ResumeUpload from '@/components/ResumeUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Linkedin,
  Globe,
  MapPin,
  Mail,
  X,
  Plus,
  FileText
} from 'lucide-react';
import ProfileSubscriptionTab from './ProfileSubscriptionTab';

export default function StudentProfileView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile } = useProfileWithRole();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    location: '',
    website: '',
    linkedin_url: '',
    university: '',
    major: '',
    graduation_year: '',
    interests: [] as string[],
  });
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        linkedin_url: profile.linkedin_url || '',
        university: studentProfile?.university || '',
        major: studentProfile?.major || '',
        graduation_year: studentProfile?.graduation_year || '',
        interests: studentProfile?.interests || [],
      });
    }
  }, [profile, studentProfile]);

  // Real-time subscription for student profile changes
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel(`student-profile-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'student_profiles',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType !== 'DELETE') {
          setStudentProfile(payload.new);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchStudentData = async () => {
    if (!user) return;

    // Fetch student profile
    const { data: studentData } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (studentData) {
      setStudentProfile(studentData);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);

    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          linkedin_url: formData.linkedin_url,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update or insert student_profiles
      const { data: existingStudent } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingStudent) {
        const { error: studentError } = await supabase
          .from('student_profiles')
          .update({
            university: formData.university,
            major: formData.major,
            graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
            interests: formData.interests,
          })
          .eq('user_id', user.id);

        if (studentError) throw studentError;
      } else {
        const { error: studentError } = await supabase
          .from('student_profiles')
          .insert({
            user_id: user.id,
            university: formData.university,
            major: formData.major,
            graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
            interests: formData.interests,
          });

        if (studentError) throw studentError;
      }

      toast({
        title: "Success",
        description: "Your profile has been updated.",
      });

      setIsEditing(false);
      fetchStudentData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddInterest = () => {
    const trimmedInterest = newInterest.trim();
    if (trimmedInterest && !formData.interests.includes(trimmedInterest)) {
      setFormData({
        ...formData,
        interests: [...formData.interests, trimmedInterest]
      });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (indexToRemove: number) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInterest();
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto whitespace-nowrap max-w-lg">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="posts">Your Posts</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
      {/* Profile Header Card */}
      <Card className="overflow-hidden tech-card border-0 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="relative h-32 bg-gradient-to-r from-primary/20 to-accent/20" />
        <CardContent className="relative -mt-16 space-y-6 pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
              <AvatarUpload 
                currentAvatarUrl={profile?.avatar_url}
                userRole="student"
                size="lg"
                showGradientBorder={true}
                onUploadComplete={(url) => {
                  toast({ title: 'Avatar updated successfully' });
                }}
              />
              <div className="text-center sm:text-left space-y-2">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {profile?.full_name || 'Student Profile'}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </div>
                  {profile?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="self-center md:self-auto">
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2 self-center md:self-auto">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card className="tech-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            About Me
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself, your goals, interests, and what you're passionate about..."
              rows={6}
              className="resize-none"
            />
          ) : (
            <p className="text-foreground leading-relaxed">
              {profile?.bio || 'No bio added yet. Share something about yourself!'}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="tech-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-muted-foreground text-xs uppercase tracking-wide">
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Your full name"
                />
              ) : (
                <p className="text-foreground font-medium">{profile?.full_name || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-muted-foreground text-xs uppercase tracking-wide">
                Location
              </Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Country"
                />
              ) : (
                <p className="text-foreground font-medium">{profile?.location || 'Not set'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card className="tech-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website" className="text-muted-foreground text-xs uppercase tracking-wide">
                Website
              </Label>
              {isEditing ? (
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <p className="text-foreground font-medium">{profile?.website || 'Not set'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url" className="text-muted-foreground text-xs uppercase tracking-wide">
                LinkedIn
              </Label>
              {isEditing ? (
                <Input
                  id="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-primary" />
                  <p className="text-foreground font-medium">{profile?.linkedin_url || 'Not set'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Education Section */}
      <Card className="tech-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Education
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="university" className="text-muted-foreground text-xs uppercase tracking-wide">
                University
              </Label>
              {isEditing ? (
                <Input
                  id="university"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  placeholder="University name"
                />
              ) : (
                <p className="text-foreground font-medium text-lg">{studentProfile?.university || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="major" className="text-muted-foreground text-xs uppercase tracking-wide">
                Major / Field of Study
              </Label>
              {isEditing ? (
                <Input
                  id="major"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  placeholder="Your major"
                />
              ) : (
                <p className="text-foreground font-medium text-lg">{studentProfile?.major || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduation_year" className="text-muted-foreground text-xs uppercase tracking-wide">
                Graduation Year
              </Label>
              {isEditing ? (
                <Input
                  id="graduation_year"
                  value={formData.graduation_year}
                  onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                  placeholder="2025"
                  type="number"
                />
              ) : (
                <p className="text-foreground font-medium text-lg">{studentProfile?.graduation_year || 'Not set'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume Section */}
      <Card className="tech-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume / CV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResumeUpload
            currentResumeUrl={profile?.resume_url}
            onUploadComplete={() => {
              // Profile will be refreshed automatically
            }}
          />
          <p className="text-xs text-muted-foreground mt-3">
            Your resume will be shared with employers when you apply for jobs.
          </p>
        </CardContent>
      </Card>

      {/* Interests Section */}
      <Card className="tech-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Interests & Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add an interest or skill (e.g., AI, Web Development, Entrepreneurship)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddInterest}
                  disabled={!newInterest.trim()}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.interests && formData.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest: string, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 transition-all group"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(index)}
                        className="ml-2 hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No interests added yet. Start by adding some above!
                </p>
              )}
            </div>
          ) : (
            <>
              {studentProfile?.interests && studentProfile.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {studentProfile.interests.map((interest: string, index: number) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 transition-all"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No interests added yet. Add some to help others understand your passions!
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Your Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfilePostsMosaic userId={user?.id || ''} isOwnProfile={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <ProfileSubscriptionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
