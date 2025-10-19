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
import { 
  Linkedin,
  Globe,
  MapPin,
  Mail
} from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card className="tech-card border-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Profile Information</CardTitle>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center space-x-4">
            <AvatarUpload />
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              ) : (
                <p className="text-foreground">{profile?.full_name || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Country"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-foreground">{profile?.location || 'Not set'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              {isEditing ? (
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <p className="text-foreground">{profile?.website || 'Not set'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              {isEditing ? (
                <Input
                  id="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-foreground">{profile?.linkedin_url || 'Not set'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            {isEditing ? (
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            ) : (
              <p className="text-foreground">{profile?.bio || 'No bio added yet.'}</p>
            )}
          </div>

          {/* Education Details */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Education</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                {isEditing ? (
                  <Input
                    id="university"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    placeholder="University name"
                  />
                ) : (
                  <p className="text-foreground">{studentProfile?.university || 'Not set'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                {isEditing ? (
                  <Input
                    id="major"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    placeholder="Your major"
                  />
                ) : (
                  <p className="text-foreground">{studentProfile?.major || 'Not set'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="graduation_year">Graduation Year</Label>
                {isEditing ? (
                  <Input
                    id="graduation_year"
                    value={formData.graduation_year}
                    onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                    placeholder="2025"
                  />
                ) : (
                  <p className="text-foreground">{studentProfile?.graduation_year || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold">Interests</h3>
            {studentProfile?.interests && studentProfile.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {studentProfile.interests.map((interest: string, index: number) => (
                  <Badge key={index} variant="secondary">{interest}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No interests added yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
