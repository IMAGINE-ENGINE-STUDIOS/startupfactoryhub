import { useState, useEffect } from 'react';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { useAdvisorProfile } from '@/hooks/useAdvisorProfile';
import MyBookings from './MyBookings';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AvailabilityManager from '@/components/AvailabilityManager';
import AvatarUpload from '@/components/AvatarUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, GraduationCap, Award, MapPin, Globe, Linkedin, Edit, Save, Plus, X, Star, Users, Calendar, TrendingUp, Settings as SettingsIcon, ChevronDown, FileText } from 'lucide-react';
import ProfileSubscriptionTab from './ProfileSubscriptionTab';
import ResumeUpload from '@/components/ResumeUpload';

import ProfilePayoutsTab from './ProfilePayoutsTab';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
export default function AdvisorProfileView() {
  const {
    profile,
    loading: profileLoading
  } = useProfileWithRole();
  const { isSubscribed } = useMembershipStatus();
  const {
    experiences,
    education,
    achievements,
    skills,
    loading: dataLoading,
    addExperience,
    addEducation,
    addAchievement,
    addSkill,
    deleteExperience,
    deleteEducation,
    deleteAchievement,
    deleteSkill
  } = useAdvisorProfile();
  const {
    toast
  } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedFullName, setEditedFullName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [editedWebsite, setEditedWebsite] = useState('');
  const [editedLinkedin, setEditedLinkedin] = useState('');
  const [editedExpertiseAreas, setEditedExpertiseAreas] = useState<string[]>([]);
  const [editedYearsOfExperience, setEditedYearsOfExperience] = useState('');
  const [showExpForm, setShowExpForm] = useState(false);
  const [showEduForm, setShowEduForm] = useState(false);
  const [showAchForm, setShowAchForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  useEffect(() => {
    const fetchMentorProfile = async () => {
      if (!profile?.user_id) return;
      const {
        data
      } = await supabase.from('mentor_profiles').select('*').eq('user_id', profile.user_id).maybeSingle();
      setMentorProfile(data);
    };
    fetchMentorProfile();
  }, [profile?.user_id]);

  // Real-time subscription for mentor profile changes
  useEffect(() => {
    if (!profile?.user_id) return;
    
    const channel = supabase
      .channel(`mentor-profile-${profile.user_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mentor_profiles',
        filter: `user_id=eq.${profile.user_id}`
      }, (payload) => {
        if (payload.eventType !== 'DELETE') {
          setMentorProfile(payload.new);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);
  const updateMentorSettings = async (field: string, value: any) => {
    if (!profile?.user_id) return;
    setUpdatingSettings(true);
    try {
      const {
        error
      } = await supabase.from('mentor_profiles').update({
        [field]: value
      }).eq('user_id', profile.user_id);
      if (error) throw error;
      setMentorProfile((prev: any) => ({
        ...prev,
        [field]: value
      }));
      toast({
        description: 'Settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    } finally {
      setUpdatingSettings(false);
    }
  };
  const startEditing = () => {
    // Guard against editing before data loads
    if (profileLoading || !profile) {
      toast({ 
        title: 'Please wait', 
        description: 'Profile data is still loading...' 
      });
      return;
    }
    if (profile) {
      setEditedFullName(profile.full_name || '');
      setEditedBio(profile.bio || '');
      setEditedLocation(profile.location || '');
      setEditedWebsite(profile.website || '');
      setEditedLinkedin(profile.linkedin_url || '');
    }
    if (mentorProfile) {
      setEditedExpertiseAreas(mentorProfile.expertise_areas || []);
      setEditedYearsOfExperience(mentorProfile.years_of_experience?.toString() || '');
    }
    setIsEditing(true);
  };
  const cancelEditing = () => {
    setIsEditing(false);
  };
  const handleSaveProfile = async () => {
    if (!profile?.user_id) return;
    setSaving(true);
    try {
      // Update main profile
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: editedFullName,
        bio: editedBio,
        location: editedLocation,
        website: editedWebsite,
        linkedin_url: editedLinkedin
      }).eq('user_id', profile.user_id);
      if (profileError) throw profileError;

      // Update mentor profile if exists
      if (mentorProfile) {
        const { error: mentorError } = await supabase.from('mentor_profiles').update({
          expertise_areas: editedExpertiseAreas,
          years_of_experience: editedYearsOfExperience ? parseInt(editedYearsOfExperience) : null
        }).eq('user_id', profile.user_id);
        if (mentorError) throw mentorError;

        // Refresh mentor profile
        const { data: updatedMentor } = await supabase
          .from('mentor_profiles')
          .select('*')
          .eq('user_id', profile.user_id)
          .maybeSingle();
        setMentorProfile(updatedMentor);
      }

      toast({
        title: 'Profile updated successfully'
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Error updating profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  if (profileLoading || dataLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="space-y-6">
      <Tabs defaultValue={new URLSearchParams(window.location.search).get('subtab') || "profile"} className="space-y-6">
        <TabsList className="flex w-full max-w-2xl overflow-x-auto scrollbar-hide whitespace-nowrap">
          <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          {isSubscribed && <TabsTrigger value="bookings" className="flex-1">My Bookings</TabsTrigger>}
          <TabsTrigger value="subscription" className="flex-1">Subscription</TabsTrigger>
          <TabsTrigger value="payouts" className="flex-1">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
      {/* Header Section */}
      <Card className="tech-card border-0 overflow-hidden">
        <CardContent className="p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {isEditing ? <AvatarUpload currentAvatarUrl={profile?.avatar_url} size="lg" userRole="advisor" showGradientBorder onUploadComplete={(url) => { toast({ title: 'Avatar updated successfully' }); }} /> : <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                  {profile?.full_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  {isEditing ? (
                    <Input value={editedFullName} onChange={e => setEditedFullName(e.target.value)} placeholder="Your full name" className="text-2xl font-bold mb-2 h-12 max-w-md" />
                  ) : (
                    <h1 className="text-3xl font-bold text-foreground mb-2">{profile?.full_name || 'Advisor'}</h1>
                  )}
                  {isEditing ? <Textarea value={editedBio} onChange={e => setEditedBio(e.target.value)} placeholder="Tell us about yourself..." className="mb-4 max-w-2xl" rows={3} /> : <p className="text-muted-foreground mb-4 max-w-2xl">{profile?.bio || 'Professional Advisor & Mentor'}</p>}
                </div>
                <div className="flex gap-2">
                  {mentorProfile?.scheduling_link && !isEditing && <Button variant="default" onClick={() => window.open(mentorProfile.scheduling_link, '_blank')} className="gap-2" size="sm">
                      <Calendar className="h-4 w-4" />
                      Schedule Session
                    </Button>}
                  {isEditing ? <>
                      <Button onClick={cancelEditing} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={saving} size="sm">
                        <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </> : <Button onClick={startEditing} variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">Advisor</Badge>
                {isEditing ? <>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Input value={editedLocation} onChange={e => setEditedLocation(e.target.value)} placeholder="Location" className="h-8 w-32" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Input value={editedWebsite} onChange={e => setEditedWebsite(e.target.value)} placeholder="Website" className="h-8 w-40" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <Input value={editedLinkedin} onChange={e => setEditedLinkedin(e.target.value)} placeholder="LinkedIn URL" className="h-8 w-40" />
                    </div>
                  </> : <>
                    {profile?.location && <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {profile.location}
                      </div>}
                    {profile?.website && <div className="flex items-center text-sm text-muted-foreground">
                        <Globe className="h-4 w-4 mr-1" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                          Website
                        </a>
                      </div>}
                    {profile?.linkedin_url && <div className="flex items-center text-sm text-muted-foreground">
                        <Linkedin className="h-4 w-4 mr-1" />
                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                          LinkedIn
                        </a>
                      </div>}
                  </>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      

      {/* Professional Settings */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Card className="tech-card border-0">
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Professional Settings
                </CardTitle>
                <ChevronDown className={`h-5 w-5 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Availability Manager */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Availability Schedule</h4>
                <AvailabilityManager />
              </div>

              <Separator />

              {/* Mentor Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold mb-3">Mentorship Settings</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Accepting New Mentees</Label>
                    <p className="text-xs text-muted-foreground">Allow new mentorship requests</p>
                  </div>
                  <Switch checked={mentorProfile?.is_accepting_mentees || false} onCheckedChange={checked => updateMentorSettings('is_accepting_mentees', checked)} disabled={updatingSettings} />
                </div>

                <div className="space-y-2">
                  <Label>Maximum Mentees</Label>
                  <Input type="number" value={mentorProfile?.max_mentees || 5} onChange={e => updateMentorSettings('max_mentees', parseInt(e.target.value))} disabled={updatingSettings} min={1} max={50} />
                </div>

                <div className="space-y-2">
                  <Label>Hourly Rate (USD)</Label>
                  <Input type="number" value={mentorProfile?.hourly_rate || 0} onChange={e => updateMentorSettings('hourly_rate', parseInt(e.target.value))} disabled={updatingSettings} min={0} />
                  <p className="text-xs text-muted-foreground">Set to 0 for free mentorship</p>
                </div>

                <div className="space-y-2">
                  <Label>Scheduling Link</Label>
                  <Input type="url" placeholder="https://calendly.com/your-link" value={mentorProfile?.scheduling_link || ''} onChange={e => updateMentorSettings('scheduling_link', e.target.value)} disabled={updatingSettings} />
                  <p className="text-xs text-muted-foreground">
                    Add your Calendly, Cal.com, or other scheduling tool link
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Resume Section */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume / CV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResumeUpload currentResumeUrl={profile?.resume_url} onUploadComplete={() => {
          // Profile will be refreshed automatically
        }} />
          <p className="text-xs text-muted-foreground mt-3">
            Your resume will be shared with employers when you apply for jobs.
          </p>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? <Textarea value={editedBio} onChange={e => setEditedBio(e.target.value)} rows={4} placeholder="Tell us about yourself..." /> : <p className="text-muted-foreground">{profile?.bio || 'No bio provided yet.'}</p>}
          
          {/* Expertise Areas */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Expertise Areas</Label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {['Strategy', 'Marketing', 'Sales', 'Product', 'Technology', 'Finance', 'Operations', 'HR', 'Legal', 'Fundraising'].map(area => (
                    <Badge
                      key={area}
                      variant={editedExpertiseAreas.includes(area) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setEditedExpertiseAreas(prev => 
                          prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
                        );
                      }}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mentorProfile?.expertise_areas?.length > 0 ? (
                  mentorProfile.expertise_areas.map((area: string) => (
                    <Badge key={area} variant="secondary">{area}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No expertise areas set</p>
                )}
              </div>
            )}
          </div>

          {/* Years of Experience */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Years of Experience</Label>
            {isEditing ? (
              <Input
                type="number"
                value={editedYearsOfExperience}
                onChange={e => setEditedYearsOfExperience(e.target.value)}
                placeholder="e.g., 10"
                className="w-32"
                min={0}
              />
            ) : (
              <p className="text-muted-foreground">{mentorProfile?.years_of_experience ? `${mentorProfile.years_of_experience} years` : 'Not set'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Experience Section */}
      <Card className="tech-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Experience
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowExpForm(!showExpForm)}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showExpForm && <ExperienceForm onSave={exp => {
          addExperience(exp);
          setShowExpForm(false);
        }} onCancel={() => setShowExpForm(false)} />}
          
          {experiences.length === 0 && !showExpForm && <p className="text-muted-foreground text-sm">No experience added yet.</p>}
          
          {experiences.map(exp => <div key={exp.id} className="flex gap-4 relative group">
              <div className="flex-1">
                <h3 className="font-semibold">{exp.title}</h3>
                <p className="text-sm text-muted-foreground">{exp.company} • {exp.location}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(exp.start_date), 'MMM yyyy')} - {exp.is_current ? 'Present' : exp.end_date ? format(new Date(exp.end_date), 'MMM yyyy') : 'N/A'}
                </p>
                {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
              </div>
              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteExperience(exp.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>)}
        </CardContent>
      </Card>

      {/* Education Section */}
      <Card className="tech-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowEduForm(!showEduForm)}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showEduForm && <EducationForm onSave={edu => {
          addEducation(edu);
          setShowEduForm(false);
        }} onCancel={() => setShowEduForm(false)} />}
          
          {education.length === 0 && !showEduForm && <p className="text-muted-foreground text-sm">No education added yet.</p>}
          
          {education.map(edu => <div key={edu.id} className="flex gap-4 relative group">
              <div className="flex-1">
                <h3 className="font-semibold">{edu.degree}</h3>
                <p className="text-sm text-muted-foreground">{edu.institution}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(edu.start_date), 'yyyy')} - {edu.end_date ? format(new Date(edu.end_date), 'yyyy') : 'Present'}
                </p>
                {edu.field_of_study && <p className="text-sm mt-1">Field: {edu.field_of_study}</p>}
              </div>
              <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteEducation(edu.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>)}
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card className="tech-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements & Certifications
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAchForm(!showAchForm)}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAchForm && <AchievementForm onSave={ach => {
          addAchievement(ach);
          setShowAchForm(false);
        }} onCancel={() => setShowAchForm(false)} />}
          
          {achievements.length === 0 && !showAchForm && <p className="text-muted-foreground text-sm">No achievements added yet.</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map(ach => <Card key={ach.id} className="relative group tech-card border-0">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Award className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold">{ach.title}</h4>
                      {ach.organization && <p className="text-sm text-muted-foreground">{ach.organization}</p>}
                      <p className="text-xs text-muted-foreground">{format(new Date(ach.date), 'MMM yyyy')}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteAchievement(ach.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card className="tech-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Skills & Expertise</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowSkillForm(!showSkillForm)}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSkillForm && <SkillForm onSave={skill => {
          addSkill(skill);
          setShowSkillForm(false);
        }} onCancel={() => setShowSkillForm(false)} />}
          
          {skills.length === 0 && !showSkillForm && <p className="text-muted-foreground text-sm">No skills added yet.</p>}
          
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => <Badge key={skill.id} variant="secondary" className="gap-2 group relative">
                {skill.skill_name}
                {skill.endorsement_count > 0 && <span className="text-xs">({skill.endorsement_count})</span>}
                <button onClick={() => deleteSkill(skill.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-3 w-3" />
                </button>
              </Badge>)}
          </div>
        </CardContent>
      </Card>

      {/* Expertise Areas */}
      {mentorProfile?.expertise_areas && mentorProfile.expertise_areas.length > 0 && <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle>Areas of Expertise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mentorProfile.expertise_areas.map((area: string, idx: number) => <Badge key={idx} variant="outline">{area}</Badge>)}
            </div>
          </CardContent>
        </Card>}
        </TabsContent>


        {isSubscribed && (
          <TabsContent value="bookings" className="space-y-4">
            <MyBookings />
          </TabsContent>
        )}

        <TabsContent value="subscription" className="space-y-4">
          <ProfileSubscriptionTab />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <ProfilePayoutsTab />
        </TabsContent>
      </Tabs>
    </div>;
}

// Helper form components
function ExperienceForm({
  onSave,
  onCancel
}: any) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const handleSave = async () => {
    if (!formData.title || !formData.company) {
      setError('Title and Company are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(formData);
      setFormData({
        title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        is_current: false,
        description: ''
      });
      onCancel();
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  return <Card className="bg-muted/50">
      <CardContent className="p-4 space-y-3">
        <Input placeholder="Title" value={formData.title} onChange={e => setFormData({
        ...formData,
        title: e.target.value
      })} />
        <Input placeholder="Company" value={formData.company} onChange={e => setFormData({
        ...formData,
        company: e.target.value
      })} />
        <Input placeholder="Location" value={formData.location} onChange={e => setFormData({
        ...formData,
        location: e.target.value
      })} />
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" placeholder="Start Date" value={formData.start_date} onChange={e => setFormData({
          ...formData,
          start_date: e.target.value
        })} />
          <Input type="date" placeholder="End Date" value={formData.end_date} onChange={e => setFormData({
          ...formData,
          end_date: e.target.value
        })} disabled={formData.is_current} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={formData.is_current} onChange={e => setFormData({
          ...formData,
          is_current: e.target.checked
        })} />
          I currently work here
        </label>
        <Textarea placeholder="Description" value={formData.description} onChange={e => setFormData({
        ...formData,
        description: e.target.value
      })} rows={3} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={onCancel} size="sm" variant="outline" disabled={saving}>Cancel</Button>
        </div>
      </CardContent>
    </Card>;
}
function EducationForm({
  onSave,
  onCancel
}: any) {
  const [formData, setFormData] = useState({
    degree: '',
    institution: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const handleSave = async () => {
    if (!formData.degree || !formData.institution) {
      setError('Degree and Institution are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(formData);
      setFormData({
        degree: '',
        institution: '',
        field_of_study: '',
        start_date: '',
        end_date: '',
        description: ''
      });
      onCancel();
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  return <Card className="bg-muted/50">
      <CardContent className="p-4 space-y-3">
        <Input placeholder="Degree" value={formData.degree} onChange={e => setFormData({
        ...formData,
        degree: e.target.value
      })} />
        <Input placeholder="Institution" value={formData.institution} onChange={e => setFormData({
        ...formData,
        institution: e.target.value
      })} />
        <Input placeholder="Field of Study" value={formData.field_of_study} onChange={e => setFormData({
        ...formData,
        field_of_study: e.target.value
      })} />
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" placeholder="Start Date" value={formData.start_date} onChange={e => setFormData({
          ...formData,
          start_date: e.target.value
        })} />
          <Input type="date" placeholder="End Date" value={formData.end_date} onChange={e => setFormData({
          ...formData,
          end_date: e.target.value
        })} />
        </div>
        <Textarea placeholder="Description" value={formData.description} onChange={e => setFormData({
        ...formData,
        description: e.target.value
      })} rows={2} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={onCancel} size="sm" variant="outline" disabled={saving}>Cancel</Button>
        </div>
      </CardContent>
    </Card>;
}
function AchievementForm({
  onSave,
  onCancel
}: any) {
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    date: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const handleSave = async () => {
    if (!formData.title) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(formData);
      setFormData({
        title: '',
        organization: '',
        date: '',
        description: ''
      });
      onCancel();
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  return <Card className="bg-muted/50">
      <CardContent className="p-4 space-y-3">
        <Input placeholder="Title" value={formData.title} onChange={e => setFormData({
        ...formData,
        title: e.target.value
      })} />
        <Input placeholder="Organization" value={formData.organization} onChange={e => setFormData({
        ...formData,
        organization: e.target.value
      })} />
        <Input type="date" placeholder="Date" value={formData.date} onChange={e => setFormData({
        ...formData,
        date: e.target.value
      })} />
        <Textarea placeholder="Description" value={formData.description} onChange={e => setFormData({
        ...formData,
        description: e.target.value
      })} rows={2} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={onCancel} size="sm" variant="outline" disabled={saving}>Cancel</Button>
        </div>
      </CardContent>
    </Card>;
}
function SkillForm({
  onSave,
  onCancel
}: any) {
  const [formData, setFormData] = useState({
    skill_name: '',
    category: 'technical'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const handleSave = async () => {
    if (!formData.skill_name) {
      setError('Skill name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(formData);
      setFormData({
        skill_name: '',
        category: 'technical'
      });
      onCancel();
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  return <Card className="bg-muted/50">
      <CardContent className="p-4 space-y-3">
        <Input placeholder="Skill name" value={formData.skill_name} onChange={e => setFormData({
        ...formData,
        skill_name: e.target.value
      })} />
        <select className="w-full p-2 rounded-md border bg-background" value={formData.category} onChange={e => setFormData({
        ...formData,
        category: e.target.value
      })}>
          <option value="technical">Technical</option>
          <option value="business">Business</option>
          <option value="soft_skills">Soft Skills</option>
        </select>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm" disabled={saving}>
            {saving ? 'Saving...' : 'Add'}
          </Button>
          <Button onClick={onCancel} size="sm" variant="outline" disabled={saving}>Cancel</Button>
        </div>
      </CardContent>
    </Card>;
}