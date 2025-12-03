import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Building, MapPin, Users, DollarSign, Target, Plus, X } from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";
import CompanyLogoUpload from "@/components/CompanyLogoUpload";
import { PasswordChangeDialog } from "@/components/PasswordChangeDialog";

type UserRole = 'startup' | 'advisor' | 'investor' | 'student' | 'mentor' | 'accelerator';

const ProfileSetup = () => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    organization_name: "",
    bio: "",
    industry: "",
    location: "",
    website: "",
    stage: "",
    team_size: "",
    funding_status: "",
    trl_level: "",
    goals: [] as string[],
    looking_for: "",
    avatar_url: "",
    logo_url: "",
    program_duration: "",
    equity_percentage: "",
    funding_offered: "",
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) 
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const saveProfile = async () => {
    if (!user || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // First, save the role to user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{ user_id: user.id, role: selectedRole }])
        .select()
        .single();

      if (roleError && roleError.code !== '23505') { // Ignore unique constraint violation
        throw roleError;
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const profileData = {
        user_id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        avatar_url: formData.avatar_url || null,
      };

      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (error) throw error;
      }

      // Create or update company profile if startup
      if (selectedRole === 'startup' && formData.company_name) {
        const companyData = {
          user_id: user.id,
          name: formData.company_name,
          description: formData.bio,
          industry: formData.industry,
          stage: formData.stage as 'idea' | 'prototype' | 'mvp' | 'growth' | 'scale',
          location: formData.location,
          website: formData.website,
          team_size: parseInt(formData.team_size) || 1,
          looking_for: Array.isArray(formData.goals) ? formData.goals : [],
          logo_url: formData.logo_url || null
        };

        const { error: companyError } = await supabase
          .from('companies')
          .upsert(companyData);

        if (companyError) throw companyError;
      }

      // Create or update accelerator profile if accelerator
      if (selectedRole === 'accelerator') {
        const acceleratorData = {
          user_id: user.id,
          organization_name: formData.organization_name || 'My Accelerator',
          description: formData.bio,
          location: formData.location,
          website: formData.website,
          logo_url: formData.logo_url || null,
          industries_focus: formData.industry ? [formData.industry] : [],
          program_duration: formData.program_duration || null,
          equity_percentage: formData.equity_percentage ? parseFloat(formData.equity_percentage) : null,
          funding_offered: formData.funding_offered ? parseInt(formData.funding_offered) : null,
        };

        const { error: acceleratorError } = await supabase
          .from('accelerator_profiles')
          .upsert(acceleratorData, { onConflict: 'user_id' });

        if (acceleratorError) throw acceleratorError;
      }

      toast({
        title: "Profile saved!",
        description: "Your profile has been updated successfully.",
      });

      navigate("/dashboard");
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

  const handleNext = () => {
    // Validate role selection on step 1
    if (step === 1 && !selectedRole) {
      toast({
        title: "Role required",
        description: "Please select your role to continue.",
        variant: "destructive",
      });
      return;
    }
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      saveProfile();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-6 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <PasswordChangeDialog />
      </div>
      
      <div className="container max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">Help us personalize your startup journey</p>
          <Progress value={(step / 3) * 100} className="mt-4 max-w-md mx-auto" />
        </div>

        <Card className="glass-morphism border-ocean-border">
          <CardHeader>
            <CardTitle className="text-xl">
              Step {step} of 3: {step === 1 ? "Role Selection" : step === 2 ? selectedRole === 'startup' ? "Startup Details" : "Profile Details" : "Goals & Skills"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div className="flex justify-center mb-6">
                  <AvatarUpload 
                    currentAvatarUrl={formData.avatar_url}
                    onUploadComplete={(url) => updateFormData('avatar_url', url)}
                    size="lg"
                    userRole={selectedRole === 'accelerator' ? 'startup' : selectedRole}
                  />
                </div>

                <div>
                  <Label>Select Your Role</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    {[
                      { value: 'startup', label: 'Startup Founder', icon: Building, desc: 'Building a startup' },
                      { value: 'advisor', label: 'Advisor', icon: Users, desc: 'Provide guidance' },
                      { value: 'investor', label: 'Investor', icon: DollarSign, desc: 'Invest in startups' },
                      { value: 'student', label: 'Student', icon: Target, desc: 'Learn and grow' },
                      { value: 'mentor', label: 'Mentor', icon: Users, desc: 'Guide others' },
                      { value: 'accelerator', label: 'Accelerator', icon: Target, desc: 'Run startup programs' },
                    ].map(({ value, label, icon: Icon, desc }) => (
                      <button
                        key={value}
                        onClick={() => setSelectedRole(value as UserRole)}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          selectedRole === value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="w-5 h-5 mt-1 text-primary" />
                          <div>
                            <div className="font-semibold">{label}</div>
                            <div className="text-sm text-muted-foreground">{desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedRole === 'startup' && (
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input 
                      id="companyName" 
                      placeholder="Your company name"
                      value={formData.company_name}
                      onChange={(e) => updateFormData('company_name', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}

                {selectedRole === 'accelerator' && (
                  <div>
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input 
                      id="organizationName" 
                      placeholder="Your accelerator/incubator name"
                      value={formData.organization_name}
                      onChange={(e) => updateFormData('organization_name', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="companyDescription">Company Description</Label>
                  <Textarea 
                    id="companyDescription" 
                    placeholder="Describe what your startup does..."
                    value={formData.bio}
                    onChange={(e) => updateFormData('bio', e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={formData.industry} onValueChange={(value) => updateFormData('industry', value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aerospace">Aerospace</SelectItem>
                        <SelectItem value="ai">AI/ML</SelectItem>
                        <SelectItem value="biotech">Biotech</SelectItem>
                        <SelectItem value="blockchain">Blockchain</SelectItem>
                        <SelectItem value="cleantech">CleanTech</SelectItem>
                        <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                        <SelectItem value="defense">Defense</SelectItem>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="edtech">EdTech</SelectItem>
                        <SelectItem value="fintech">FinTech</SelectItem>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="healthtech">HealthTech</SelectItem>
                        <SelectItem value="quantum">Quantum Computing</SelectItem>
                        <SelectItem value="robotics">Robotics</SelectItem>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="semiconductor">Semiconductors</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="space">Space Tech</SelectItem>
                        <SelectItem value="telecommunications">Telecommunications</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="location" 
                        placeholder="City, Country" 
                        value={formData.location}
                        onChange={(e) => updateFormData('location', e.target.value)}
                        className="pl-10" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website/Demo URL</Label>
                  <Input 
                    id="website" 
                    placeholder="https://yourcompany.com" 
                    value={formData.website}
                    onChange={(e) => updateFormData('website', e.target.value)}
                    className="mt-2" 
                  />
                </div>
              </>
            )}

            {step === 2 && selectedRole === 'startup' && (
              <>
                <div className="mb-6">
                  <Label className="mb-4 block">Company Logo</Label>
                  <CompanyLogoUpload
                    currentLogoUrl={formData.logo_url}
                    onUploadComplete={(url) => updateFormData('logo_url', url)}
                  />
                </div>

                <div>
                  <Label>Startup Stage</Label>
                  <Select value={formData.stage} onValueChange={(value) => updateFormData('stage', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select your current stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea Stage</SelectItem>
                      <SelectItem value="prototype">Prototype/MVP</SelectItem>
                      <SelectItem value="validation">Product-Market Fit</SelectItem>
                      <SelectItem value="growth">Growth Stage</SelectItem>
                      <SelectItem value="scale">Scale Stage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teamSize">Team Size</Label>
                    <div className="relative mt-2">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Select value={formData.team_size} onValueChange={(value) => updateFormData('team_size', value)}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Just me</SelectItem>
                          <SelectItem value="2-5">2-5 people</SelectItem>
                          <SelectItem value="6-10">6-10 people</SelectItem>
                          <SelectItem value="11-25">11-25 people</SelectItem>
                          <SelectItem value="25+">25+ people</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="funding">Funding Status</Label>
                    <div className="relative mt-2">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Select value={formData.funding_status} onValueChange={(value) => updateFormData('funding_status', value)}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bootstrap">Bootstrapped</SelectItem>
                          <SelectItem value="pre-seed">Pre-seed</SelectItem>
                          <SelectItem value="seed">Seed</SelectItem>
                          <SelectItem value="series-a">Series A</SelectItem>
                          <SelectItem value="series-b+">Series B+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="trl">Technology Readiness Level (TRL)</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select TRL level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-3">TRL 1-3: Basic Research</SelectItem>
                      <SelectItem value="4-6">TRL 4-6: Technology Development</SelectItem>
                      <SelectItem value="7-9">TRL 7-9: System Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 2 && selectedRole === 'accelerator' && (
              <>
                <div className="mb-6">
                  <Label className="mb-4 block">Organization Logo</Label>
                  <CompanyLogoUpload
                    currentLogoUrl={formData.logo_url}
                    onUploadComplete={(url) => updateFormData('logo_url', url)}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">About Your Program</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Describe your accelerator program, mission, and what makes it unique..."
                    value={formData.bio}
                    onChange={(e) => updateFormData('bio', e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Program Duration</Label>
                    <Select value={formData.program_duration} onValueChange={(value) => updateFormData('program_duration', value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6 weeks">6 weeks</SelectItem>
                        <SelectItem value="8 weeks">8 weeks</SelectItem>
                        <SelectItem value="12 weeks">12 weeks</SelectItem>
                        <SelectItem value="16 weeks">16 weeks</SelectItem>
                        <SelectItem value="6 months">6 months</SelectItem>
                        <SelectItem value="1 year">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="equity">Typical Equity (%)</Label>
                    <Input 
                      id="equity" 
                      type="number"
                      placeholder="e.g., 6"
                      value={formData.equity_percentage}
                      onChange={(e) => updateFormData('equity_percentage', e.target.value)}
                      className="mt-2"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="funding">Funding Per Startup ($)</Label>
                  <div className="relative mt-2">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="funding" 
                      type="number"
                      placeholder="e.g., 150000"
                      value={formData.funding_offered}
                      onChange={(e) => updateFormData('funding_offered', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="location" 
                        placeholder="City, Country" 
                        value={formData.location}
                        onChange={(e) => updateFormData('location', e.target.value)}
                        className="pl-10" 
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input 
                      id="website" 
                      placeholder="https://..." 
                      value={formData.website}
                      onChange={(e) => updateFormData('website', e.target.value)}
                      className="mt-2" 
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && selectedRole !== 'startup' && selectedRole !== 'accelerator' && (
              <>
                <div>
                  <Label htmlFor="bio">Tell us about yourself</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Your background and experience..."
                    value={formData.bio}
                    onChange={(e) => updateFormData('bio', e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="location" 
                        placeholder="City, Country" 
                        value={formData.location}
                        onChange={(e) => updateFormData('location', e.target.value)}
                        className="pl-10" 
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website">Website/LinkedIn</Label>
                    <Input 
                      id="website" 
                      placeholder="https://..." 
                      value={formData.website}
                      onChange={(e) => updateFormData('website', e.target.value)}
                      className="mt-2" 
                    />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <Label>Primary Goals (Select all that apply)</Label>
                  <div className="mt-2 space-y-2">
                    {(selectedRole === 'accelerator' ? [
                      "Discover promising startups",
                      "Connect startups with mentors/advisors",
                      "Organize Demo Days",
                      "Track portfolio performance",
                      "Source investors for cohort",
                      "Build industry partnerships",
                      "Expand to new markets",
                      "Increase program visibility"
                    ] : [
                      "Find mentors and advisors",
                      "Connect with investors",
                      "Recruit team members",
                      "Access resources and tools",
                      "Join accelerator programs",
                      "Network with other founders",
                      "Get customer feedback",
                      "Learn and develop skills"
                     ]).map((goal) => (
                       <label key={goal} className="flex items-center space-x-2 cursor-pointer">
                         <input 
                           type="checkbox" 
                           className="rounded border-ocean-border"
                           checked={formData.goals.includes(goal)}
                           onChange={() => toggleGoal(goal)}
                         />
                         <span className="text-sm">{goal}</span>
                       </label>
                     ))}
                   </div>
                 </div>

                 <div>
                   <Label htmlFor="skills">Skills & Expertise</Label>
                   <div className="mt-2 space-y-3">
                     <div className="flex space-x-2">
                       <Input
                         placeholder="Add a skill..."
                         value={currentSkill}
                         onChange={(e) => setCurrentSkill(e.target.value)}
                         onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                       />
                       <Button onClick={addSkill} variant="outline" size="sm">
                         <Plus className="w-4 h-4" />
                       </Button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                       {skills.map((skill) => (
                         <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                           {skill}
                           <X 
                             className="w-3 h-3 cursor-pointer" 
                             onClick={() => removeSkill(skill)}
                           />
                         </Badge>
                       ))}
                     </div>
                   </div>
                 </div>

                 <div>
                   <Label htmlFor="lookingFor">What are you looking for most?</Label>
                   <Textarea 
                     id="lookingFor" 
                     placeholder="Describe what you need help with right now..."
                     value={formData.looking_for}
                     onChange={(e) => updateFormData('looking_for', e.target.value)}
                     className="mt-2"
                     rows={3}
                   />
                 </div>
              </>
            )}

            <div className="flex justify-between pt-6">
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={step === 1}
              >
                Back
              </Button>
              <Button 
                variant="hero" 
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? "Saving..." : step === 3 ? "Complete Profile" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;