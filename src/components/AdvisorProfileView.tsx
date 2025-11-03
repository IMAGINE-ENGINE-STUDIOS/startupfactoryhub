import { useState, useEffect } from 'react';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { useAdvisorProfile } from '@/hooks/useAdvisorProfile';
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
import { 
  Briefcase, 
  GraduationCap, 
  Award, 
  MapPin, 
  Globe, 
  Linkedin, 
  Edit, 
  Save, 
  Plus,
  X,
  Star,
  Users,
  Calendar,
  TrendingUp,
  Settings as SettingsIcon,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function AdvisorProfileView() {
  const { profile, loading: profileLoading } = useProfileWithRole();
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
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [editedWebsite, setEditedWebsite] = useState('');
  const [editedLinkedin, setEditedLinkedin] = useState('');

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
      
      const { data } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      
      setMentorProfile(data);
    };

    fetchMentorProfile();
  }, [profile?.user_id]);

  const updateMentorSettings = async (field: string, value: any) => {
    if (!profile?.user_id) return;
    
    setUpdatingSettings(true);
    try {
      const { error } = await supabase
        .from('mentor_profiles')
        .update({ [field]: value })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setMentorProfile((prev: any) => ({ ...prev, [field]: value }));
      toast({ description: 'Settings updated successfully' });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({ description: 'Failed to update settings', variant: 'destructive' });
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?.user_id) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        bio: editedBio,
        location: editedLocation,
        website: editedWebsite,
        linkedin_url: editedLinkedin,
      })
      .eq('user_id', profile.user_id);

    if (!error) {
      toast({ title: 'Profile updated successfully' });
      setIsEditing(false);
    } else {
      toast({ title: 'Error updating profile', variant: 'destructive' });
    }
  };

  const toggleEdit = () => {
    if (!isEditing && profile) {
      setEditedBio(profile.bio || '');
      setEditedLocation(profile.location || '');
      setEditedWebsite(profile.website || '');
      setEditedLinkedin(profile.linkedin_url || '');
    }
    setIsEditing(!isEditing);
  };

  if (profileLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-2xl">
                {profile?.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{profile?.full_name || 'Advisor'}</h1>
                  <p className="text-muted-foreground">Professional Advisor & Mentor</p>
                </div>
                <div className="flex gap-2">
                  {mentorProfile?.scheduling_link && !isEditing && (
                    <Button 
                      variant="default" 
                      onClick={() => window.open(mentorProfile.scheduling_link, '_blank')}
                      className="gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule Session
                    </Button>
                  )}
                  <Button onClick={isEditing ? handleSaveProfile : toggleEdit} variant={isEditing ? "default" : "outline"}>
                    {isEditing ? <><Save className="h-4 w-4 mr-2" /> Save</> : <><Edit className="h-4 w-4 mr-2" /> Edit</>}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {(isEditing ? editedLocation : profile?.location) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {isEditing ? (
                      <Input 
                        value={editedLocation} 
                        onChange={(e) => setEditedLocation(e.target.value)}
                        className="h-7 w-40"
                      />
                    ) : (
                      <span>{profile?.location}</span>
                    )}
                  </div>
                )}
                {(isEditing ? editedWebsite : profile?.website) && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    {isEditing ? (
                      <Input 
                        value={editedWebsite} 
                        onChange={(e) => setEditedWebsite(e.target.value)}
                        className="h-7 w-40"
                      />
                    ) : (
                      <a href={profile?.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        {profile?.website}
                      </a>
                    )}
                  </div>
                )}
                {(isEditing ? editedLinkedin : profile?.linkedin_url) && (
                  <div className="flex items-center gap-1">
                    <Linkedin className="h-4 w-4" />
                    {isEditing ? (
                      <Input 
                        value={editedLinkedin} 
                        onChange={(e) => setEditedLinkedin(e.target.value)}
                        className="h-7 w-40"
                      />
                    ) : (
                      <a href={profile?.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        LinkedIn
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{mentorProfile?.total_sessions || 0}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{mentorProfile?.total_mentees || 0}</p>
                  <p className="text-xs text-muted-foreground">Mentees</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Star className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{mentorProfile?.average_rating || 0}</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{mentorProfile?.years_of_experience || 0}</p>
                  <p className="text-xs text-muted-foreground">Years Exp</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Professional Settings */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Card>
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
                  <Switch
                    checked={mentorProfile?.is_accepting_mentees || false}
                    onCheckedChange={(checked) => updateMentorSettings('is_accepting_mentees', checked)}
                    disabled={updatingSettings}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Maximum Mentees</Label>
                  <Input
                    type="number"
                    value={mentorProfile?.max_mentees || 5}
                    onChange={(e) => updateMentorSettings('max_mentees', parseInt(e.target.value))}
                    disabled={updatingSettings}
                    min={1}
                    max={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hourly Rate (USD)</Label>
                  <Input
                    type="number"
                    value={mentorProfile?.hourly_rate || 0}
                    onChange={(e) => updateMentorSettings('hourly_rate', parseInt(e.target.value))}
                    disabled={updatingSettings}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">Set to 0 for free mentorship</p>
                </div>

                <div className="space-y-2">
                  <Label>Scheduling Link</Label>
                  <Input
                    type="url"
                    placeholder="https://calendly.com/your-link"
                    value={mentorProfile?.scheduling_link || ''}
                    onChange={(e) => updateMentorSettings('scheduling_link', e.target.value)}
                    disabled={updatingSettings}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add your Calendly, Cal.com, or other scheduling tool link
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editedBio}
              onChange={(e) => setEditedBio(e.target.value)}
              rows={4}
              placeholder="Tell us about yourself..."
            />
          ) : (
            <p className="text-muted-foreground">{profile?.bio || 'No bio provided yet.'}</p>
          )}
        </CardContent>
      </Card>

      {/* Experience Section */}
      <Card>
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
          {showExpForm && <ExperienceForm onSave={(exp) => { addExperience(exp); setShowExpForm(false); }} onCancel={() => setShowExpForm(false)} />}
          
          {experiences.length === 0 && !showExpForm && (
            <p className="text-muted-foreground text-sm">No experience added yet.</p>
          )}
          
          {experiences.map((exp) => (
            <div key={exp.id} className="flex gap-4 relative group">
              <div className="flex-1">
                <h3 className="font-semibold">{exp.title}</h3>
                <p className="text-sm text-muted-foreground">{exp.company} • {exp.location}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(exp.start_date), 'MMM yyyy')} - {exp.is_current ? 'Present' : exp.end_date ? format(new Date(exp.end_date), 'MMM yyyy') : 'N/A'}
                </p>
                {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteExperience(exp.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Education Section */}
      <Card>
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
          {showEduForm && <EducationForm onSave={(edu) => { addEducation(edu); setShowEduForm(false); }} onCancel={() => setShowEduForm(false)} />}
          
          {education.length === 0 && !showEduForm && (
            <p className="text-muted-foreground text-sm">No education added yet.</p>
          )}
          
          {education.map((edu) => (
            <div key={edu.id} className="flex gap-4 relative group">
              <div className="flex-1">
                <h3 className="font-semibold">{edu.degree}</h3>
                <p className="text-sm text-muted-foreground">{edu.institution}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(edu.start_date), 'yyyy')} - {edu.end_date ? format(new Date(edu.end_date), 'yyyy') : 'Present'}
                </p>
                {edu.field_of_study && <p className="text-sm mt-1">Field: {edu.field_of_study}</p>}
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteEducation(edu.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card>
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
          {showAchForm && <AchievementForm onSave={(ach) => { addAchievement(ach); setShowAchForm(false); }} onCancel={() => setShowAchForm(false)} />}
          
          {achievements.length === 0 && !showAchForm && (
            <p className="text-muted-foreground text-sm">No achievements added yet.</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((ach) => (
              <Card key={ach.id} className="relative group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Award className="h-8 w-8 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold">{ach.title}</h4>
                      {ach.organization && <p className="text-sm text-muted-foreground">{ach.organization}</p>}
                      <p className="text-xs text-muted-foreground">{format(new Date(ach.date), 'MMM yyyy')}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteAchievement(ach.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Skills & Expertise</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowSkillForm(!showSkillForm)}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSkillForm && <SkillForm onSave={(skill) => { addSkill(skill); setShowSkillForm(false); }} onCancel={() => setShowSkillForm(false)} />}
          
          {skills.length === 0 && !showSkillForm && (
            <p className="text-muted-foreground text-sm">No skills added yet.</p>
          )}
          
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill.id} variant="secondary" className="gap-2 group relative">
                {skill.skill_name}
                {skill.endorsement_count > 0 && (
                  <span className="text-xs">({skill.endorsement_count})</span>
                )}
                <button
                  onClick={() => deleteSkill(skill.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expertise Areas */}
      {mentorProfile?.expertise_areas && mentorProfile.expertise_areas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Areas of Expertise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mentorProfile.expertise_areas.map((area: string, idx: number) => (
                <Badge key={idx} variant="outline">{area}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper form components
function ExperienceForm({ onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    start_date: '',
    end_date: '',
    is_current: false,
    description: '',
  });

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4 space-y-3">
        <Input placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        <Input placeholder="Company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
        <Input placeholder="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" placeholder="Start Date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
          <Input type="date" placeholder="End Date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} disabled={formData.is_current} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={formData.is_current} onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })} />
          I currently work here
        </label>
        <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
        <div className="flex gap-2">
          <Button onClick={() => onSave(formData)} size="sm">Save</Button>
          <Button onClick={onCancel} size="sm" variant="outline">Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EducationForm({ onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    degree: '',
    institution: '',
    field_of_study: '',
    start_date: '',
    end_date: '',
    description: '',
  });

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4 space-y-3">
        <Input placeholder="Degree" value={formData.degree} onChange={(e) => setFormData({ ...formData, degree: e.target.value })} />
        <Input placeholder="Institution" value={formData.institution} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} />
        <Input placeholder="Field of Study" value={formData.field_of_study} onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" placeholder="Start Date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
          <Input type="date" placeholder="End Date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
        </div>
        <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
        <div className="flex gap-2">
          <Button onClick={() => onSave(formData)} size="sm">Save</Button>
          <Button onClick={onCancel} size="sm" variant="outline">Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementForm({ onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    date: '',
    description: '',
  });

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4 space-y-3">
        <Input placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        <Input placeholder="Organization" value={formData.organization} onChange={(e) => setFormData({ ...formData, organization: e.target.value })} />
        <Input type="date" placeholder="Date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
        <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
        <div className="flex gap-2">
          <Button onClick={() => onSave(formData)} size="sm">Save</Button>
          <Button onClick={onCancel} size="sm" variant="outline">Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SkillForm({ onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    skill_name: '',
    category: 'technical',
  });

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4 space-y-3">
        <Input placeholder="Skill name" value={formData.skill_name} onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })} />
        <select 
          className="w-full p-2 rounded-md border bg-background"
          value={formData.category} 
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        >
          <option value="technical">Technical</option>
          <option value="business">Business</option>
          <option value="soft_skills">Soft Skills</option>
        </select>
        <div className="flex gap-2">
          <Button onClick={() => onSave(formData)} size="sm">Add</Button>
          <Button onClick={onCancel} size="sm" variant="outline">Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
