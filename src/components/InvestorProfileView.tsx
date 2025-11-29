import { useState, useEffect } from 'react';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Globe, 
  Linkedin, 
  Edit, 
  Save,
  DollarSign,
  TrendingUp,
  Building,
  Target,
  Plus,
  X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AvatarUpload from './AvatarUpload';
import InvestorAvailabilityManager from './InvestorAvailabilityManager';

const STAGES = [
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
  'Growth',
  'Late Stage',
];

const INDUSTRIES = [
  'Fintech',
  'Healthtech',
  'AI/ML',
  'SaaS',
  'E-commerce',
  'EdTech',
  'CleanTech',
  'Cybersecurity',
  'DeepTech',
  'Gaming',
  'Real Estate',
  'Logistics',
];

export default function InvestorProfileView() {
  const { profile, loading: profileLoading, refetch } = useProfileWithRole();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [investorProfile, setInvestorProfile] = useState<any>(null);
  
  // Form data for editing
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    location: '',
    website: '',
    linkedin_url: '',
    investment_range_min: 0,
    investment_range_max: 0,
    preferred_stages: [] as string[],
    preferred_industries: [] as string[],
  });

  useEffect(() => {
    const fetchInvestorData = async () => {
      if (!profile?.user_id) return;
      
      const { data: invProfile } = await supabase
        .from('investor_profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      
      setInvestorProfile(invProfile);
      
      // Initialize form data
      setFormData({
        full_name: profile?.full_name || '',
        bio: profile?.bio || '',
        location: profile?.location || '',
        website: profile?.website || '',
        linkedin_url: profile?.linkedin_url || '',
        investment_range_min: invProfile?.investment_range_min || 0,
        investment_range_max: invProfile?.investment_range_max || 0,
        preferred_stages: invProfile?.preferred_stages || [],
        preferred_industries: invProfile?.preferred_industries || [],
      });
    };

    fetchInvestorData();
  }, [profile?.user_id, profile?.full_name, profile?.bio, profile?.location, profile?.website, profile?.linkedin_url]);

  const handleSaveProfile = async () => {
    if (!profile?.user_id) return;

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
      .eq('user_id', profile.user_id);

    if (profileError) {
      toast({ title: 'Error updating profile', variant: 'destructive' });
      return;
    }

    // Update investor_profiles table
    const { error: investorError } = await supabase
      .from('investor_profiles')
      .upsert({
        user_id: profile.user_id,
        investment_range_min: formData.investment_range_min,
        investment_range_max: formData.investment_range_max,
        preferred_stages: formData.preferred_stages,
        preferred_industries: formData.preferred_industries,
      }, { onConflict: 'user_id' });

    if (investorError) {
      toast({ title: 'Error updating investor profile', variant: 'destructive' });
      return;
    }

    // Refresh data
    const { data: updatedInvProfile } = await supabase
      .from('investor_profiles')
      .select('*')
      .eq('user_id', profile.user_id)
      .maybeSingle();
    
    setInvestorProfile(updatedInvProfile);
    refetch();
    
    toast({ title: 'Profile updated successfully' });
    setIsEditing(false);
  };

  const toggleStage = (stage: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_stages: prev.preferred_stages.includes(stage)
        ? prev.preferred_stages.filter(s => s !== stage)
        : [...prev.preferred_stages, stage]
    }));
  };

  const toggleIndustry = (industry: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_industries: prev.preferred_industries.includes(industry)
        ? prev.preferred_industries.filter(i => i !== industry)
        : [...prev.preferred_industries, industry]
    }));
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Edit Mode View
  if (isEditing) {
    return (
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5 text-primary" />
            <span>Edit Investor Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="flex justify-center mb-6">
            <AvatarUpload 
              currentAvatarUrl={profile?.avatar_url}
              onUploadComplete={() => {
                refetch();
                toast({
                  title: "Profile Updated",
                  description: "Your avatar has been updated successfully.",
                });
              }}
              size="lg"
              userRole="investor"
            />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Full Name *</label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., San Francisco, CA"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself and your investment philosophy..."
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Website</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">LinkedIn URL</label>
              <Input
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
                className="mt-1"
              />
            </div>
          </div>

          {/* Investment Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Minimum Investment ($)</label>
              <Input
                type="number"
                value={formData.investment_range_min || ''}
                onChange={(e) => setFormData({ ...formData, investment_range_min: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 25000"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Maximum Investment ($)</label>
              <Input
                type="number"
                value={formData.investment_range_max || ''}
                onChange={(e) => setFormData({ ...formData, investment_range_max: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 500000"
                className="mt-1"
              />
            </div>
          </div>

          {/* Preferred Stages */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Preferred Stages</label>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((stage) => (
                <Badge
                  key={stage}
                  variant={formData.preferred_stages.includes(stage) ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => toggleStage(stage)}
                >
                  {stage}
                  {formData.preferred_stages.includes(stage) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Preferred Industries */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Preferred Industries</label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((industry) => (
                <Badge
                  key={industry}
                  variant={formData.preferred_industries.includes(industry) ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  onClick={() => toggleIndustry(industry)}
                >
                  {industry}
                  {formData.preferred_industries.includes(industry) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button onClick={handleSaveProfile} className="pulse-primary">
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // View Mode
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="tech-card border-0">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                  {profile?.full_name?.charAt(0) || 'I'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{profile?.full_name || 'Investor'}</h1>
                <p className="text-muted-foreground mb-4">Professional Investor</p>
                <div className="flex flex-wrap items-center gap-3">
                  {profile?.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {profile.location}
                    </div>
                  )}
                  {profile?.website && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Globe className="h-4 w-4 mr-1" />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        Website
                      </a>
                    </div>
                  )}
                  {profile?.linkedin_url && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Linkedin className="h-4 w-4 mr-1" />
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        LinkedIn
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portfolio</p>
                <p className="text-2xl font-bold text-foreground">
                  {investorProfile?.portfolio_size || 0}
                </p>
              </div>
              <Building className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(investorProfile?.total_invested || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Min Investment</p>
                <p className="text-2xl font-bold text-foreground">
                  {investorProfile?.investment_range_min 
                    ? formatCurrency(investorProfile.investment_range_min) 
                    : 'N/A'}
                </p>
              </div>
              <Target className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Investment</p>
                <p className="text-2xl font-bold text-foreground">
                  {investorProfile?.investment_range_max 
                    ? formatCurrency(investorProfile.investment_range_max) 
                    : 'N/A'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="about" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="focus">Investment Focus</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {profile?.bio || 'No bio provided yet.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="focus" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Investment Focus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold mb-3">Preferred Stages</h4>
                <div className="flex flex-wrap gap-2">
                  {investorProfile?.preferred_stages?.length > 0 ? (
                    investorProfile.preferred_stages.map((stage: string) => (
                      <Badge key={stage} variant="secondary">{stage}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No preferred stages set</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-3">Preferred Industries</h4>
                <div className="flex flex-wrap gap-2">
                  {investorProfile?.preferred_industries?.length > 0 ? (
                    investorProfile.preferred_industries.map((industry: string) => (
                      <Badge key={industry} variant="outline">{industry}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No preferred industries set</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Two Column Layout for Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Investment Preferences */}
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Investment Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Min Investment</p>
                    <p className="text-lg font-semibold text-foreground">
                      {investorProfile?.investment_range_min 
                        ? formatCurrency(investorProfile.investment_range_min) 
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Max Investment</p>
                    <p className="text-lg font-semibold text-foreground">
                      {investorProfile?.investment_range_max 
                        ? formatCurrency(investorProfile.investment_range_max) 
                        : 'Not set'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Stages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {investorProfile?.preferred_stages?.length > 0 ? (
                      investorProfile.preferred_stages.map((stage: string) => (
                        <Badge key={stage} variant="secondary" className="text-xs">{stage}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Industries</p>
                  <div className="flex flex-wrap gap-1.5">
                    {investorProfile?.preferred_industries?.length > 0 ? (
                      investorProfile.preferred_industries.map((industry: string) => (
                        <Badge key={industry} variant="outline" className="text-xs">{industry}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Preferences
                </Button>
              </CardContent>
            </Card>

            {/* Availability Schedule */}
            <InvestorAvailabilityManager />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
