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
  X,
  Plus,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import InvestorAvailabilityManager from './InvestorAvailabilityManager';
import AvatarUpload from './AvatarUpload';

const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'IPO'];
const INDUSTRIES = ['Technology', 'Healthcare', 'Fintech', 'E-commerce', 'AI/ML', 'SaaS', 'Biotech', 'Clean Energy', 'Education', 'Real Estate'];

export default function InvestorProfileView() {
  const { profile, loading: profileLoading } = useProfileWithRole();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Profile fields
  const [editedFullName, setEditedFullName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [editedWebsite, setEditedWebsite] = useState('');
  const [editedLinkedin, setEditedLinkedin] = useState('');

  // Investor profile fields
  const [investorProfile, setInvestorProfile] = useState<any>(null);
  const [editedInvestmentMin, setEditedInvestmentMin] = useState('');
  const [editedInvestmentMax, setEditedInvestmentMax] = useState('');
  const [editedPreferredStages, setEditedPreferredStages] = useState<string[]>([]);
  const [editedPreferredIndustries, setEditedPreferredIndustries] = useState<string[]>([]);

  useEffect(() => {
    const fetchInvestorData = async () => {
      if (!profile?.user_id) return;
      
      const { data: invProfile } = await supabase
        .from('investor_profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      
      setInvestorProfile(invProfile);
    };

    fetchInvestorData();
  }, [profile?.user_id]);

  // Real-time subscription for investor profile changes
  useEffect(() => {
    if (!profile?.user_id) return;
    
    const channel = supabase
      .channel(`investor-profile-${profile.user_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'investor_profiles',
        filter: `user_id=eq.${profile.user_id}`
      }, (payload) => {
        if (payload.eventType !== 'DELETE') {
          setInvestorProfile(payload.new);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);

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
    if (investorProfile) {
      setEditedInvestmentMin(investorProfile.investment_range_min?.toString() || '');
      setEditedInvestmentMax(investorProfile.investment_range_max?.toString() || '');
      setEditedPreferredStages(investorProfile.preferred_stages || []);
      setEditedPreferredIndustries(investorProfile.preferred_industries || []);
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
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editedFullName,
          bio: editedBio,
          location: editedLocation,
          website: editedWebsite,
          linkedin_url: editedLinkedin,
        })
        .eq('user_id', profile.user_id);

      if (profileError) throw profileError;

      // Update or create investor profile
      const investorData = {
        user_id: profile.user_id,
        investment_range_min: editedInvestmentMin ? parseInt(editedInvestmentMin) : null,
        investment_range_max: editedInvestmentMax ? parseInt(editedInvestmentMax) : null,
        preferred_stages: editedPreferredStages,
        preferred_industries: editedPreferredIndustries,
      };

      if (investorProfile) {
        const { error: invError } = await supabase
          .from('investor_profiles')
          .update(investorData)
          .eq('user_id', profile.user_id);
        if (invError) throw invError;
      } else {
        const { error: invError } = await supabase
          .from('investor_profiles')
          .insert(investorData);
        if (invError) throw invError;
      }

      // Refresh investor profile data
      const { data: updatedInvProfile } = await supabase
        .from('investor_profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      
      setInvestorProfile(updatedInvProfile);
      toast({ title: 'Profile updated successfully' });
      setIsEditing(false);
    } catch (error) {
      toast({ title: 'Error updating profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStage = (stage: string) => {
    setEditedPreferredStages(prev => 
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const toggleIndustry = (industry: string) => {
    setEditedPreferredIndustries(prev => 
      prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
    );
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="tech-card border-0">
        <CardContent className="p-8">
          <div className="flex items-start space-x-6">
            {isEditing ? (
              <AvatarUpload
                currentAvatarUrl={profile?.avatar_url}
                size="lg"
                userRole="investor"
                showGradientBorder
                onUploadComplete={(url) => {
                  // Real-time subscription will handle the update
                  toast({ title: 'Avatar updated successfully' });
                }}
              />
            ) : (
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name} />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                  {profile?.full_name?.charAt(0) || 'I'}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  {isEditing ? (
                    <Input
                      value={editedFullName}
                      onChange={(e) => setEditedFullName(e.target.value)}
                      placeholder="Your full name"
                      className="text-2xl font-bold mb-2 h-12"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-foreground mb-2">{profile?.full_name || 'Investor'}</h1>
                  )}
                  {isEditing ? (
                    <Textarea
                      value={editedBio}
                      onChange={(e) => setEditedBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="mb-4 max-w-2xl"
                      rows={3}
                    />
                  ) : (
                    <p className="text-muted-foreground mb-4 max-w-2xl">{profile?.bio || 'Professional Investor'}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button onClick={cancelEditing} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" /> Cancel
                      </Button>
                      <Button onClick={handleSaveProfile} disabled={saving} size="sm">
                        <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={startEditing} variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" /> Edit Profile
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">Investor</Badge>
                {isEditing ? (
                  <>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={editedLocation} 
                        onChange={(e) => setEditedLocation(e.target.value)}
                        placeholder="Location"
                        className="h-8 w-32"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={editedWebsite} 
                        onChange={(e) => setEditedWebsite(e.target.value)}
                        placeholder="Website"
                        className="h-8 w-40"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={editedLinkedin} 
                        onChange={(e) => setEditedLinkedin(e.target.value)}
                        placeholder="LinkedIn URL"
                        className="h-8 w-40"
                      />
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
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
                <p className="text-2xl font-bold text-foreground">{investorProfile?.portfolio_size || 0}</p>
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
                  {investorProfile?.total_invested ? formatCurrency(investorProfile.total_invested) : 'N/A'}
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
                  {investorProfile?.investment_range_min ? formatCurrency(investorProfile.investment_range_min) : 'N/A'}
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
                  {investorProfile?.investment_range_max ? formatCurrency(investorProfile.investment_range_max) : 'N/A'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Tabs defaultValue="about" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="preferences">Investment Focus</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  placeholder="Tell us about yourself, your investment philosophy, and experience..."
                  rows={5}
                  className="w-full"
                />
              ) : (
                <p className="text-muted-foreground">
                  {profile?.bio || 'No bio provided yet.'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Key Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Location:</span>
                  {isEditing ? (
                    <Input
                      value={editedLocation}
                      onChange={(e) => setEditedLocation(e.target.value)}
                      placeholder="e.g., New York, NY"
                      className="w-48"
                    />
                  ) : (
                    <span className="font-medium">{profile?.location || 'Not specified'}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Website:</span>
                  {isEditing ? (
                    <Input
                      value={editedWebsite}
                      onChange={(e) => setEditedWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="w-48"
                    />
                  ) : (
                    <span className="font-medium">{profile?.website || 'Not specified'}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">LinkedIn:</span>
                  {isEditing ? (
                    <Input
                      value={editedLinkedin}
                      onChange={(e) => setEditedLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-48"
                    />
                  ) : (
                    <span className="font-medium">{profile?.linkedin_url || 'Not specified'}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Portfolio Size:</span>
                  <span className="font-medium">{investorProfile?.portfolio_size || 0} companies</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Invested:</span>
                  <span className="font-medium">
                    {investorProfile?.total_invested ? formatCurrency(investorProfile.total_invested) : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investment Range:</span>
                  <span className="font-medium">
                    {investorProfile?.investment_range_min && investorProfile?.investment_range_max
                      ? `${formatCurrency(investorProfile.investment_range_min)} - ${formatCurrency(investorProfile.investment_range_max)}`
                      : 'Not specified'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Investment Range */}
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Investment Range
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Minimum Investment ($)</label>
                      <Input
                        type="number"
                        value={editedInvestmentMin}
                        onChange={(e) => setEditedInvestmentMin(e.target.value)}
                        placeholder="e.g., 50000"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Maximum Investment ($)</label>
                      <Input
                        type="number"
                        value={editedInvestmentMax}
                        onChange={(e) => setEditedInvestmentMax(e.target.value)}
                        placeholder="e.g., 500000"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum:</span>
                      <span className="font-medium">
                        {investorProfile?.investment_range_min ? formatCurrency(investorProfile.investment_range_min) : 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Maximum:</span>
                      <span className="font-medium">
                        {investorProfile?.investment_range_max ? formatCurrency(investorProfile.investment_range_max) : 'Not set'}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferred Stages */}
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Preferred Stages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {STAGES.map((stage) => (
                      <Badge
                        key={stage}
                        variant={editedPreferredStages.includes(stage) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleStage(stage)}
                      >
                        {editedPreferredStages.includes(stage) ? (
                          <X className="h-3 w-3 mr-1" />
                        ) : (
                          <Plus className="h-3 w-3 mr-1" />
                        )}
                        {stage}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {investorProfile?.preferred_stages?.length > 0 ? (
                      investorProfile.preferred_stages.map((stage: string) => (
                        <Badge key={stage} variant="secondary">{stage}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No preferred stages set</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferred Industries */}
            <Card className="tech-card border-0 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Preferred Industries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((industry) => (
                      <Badge
                        key={industry}
                        variant={editedPreferredIndustries.includes(industry) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleIndustry(industry)}
                      >
                        {editedPreferredIndustries.includes(industry) ? (
                          <X className="h-3 w-3 mr-1" />
                        ) : (
                          <Plus className="h-3 w-3 mr-1" />
                        )}
                        {industry}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {investorProfile?.preferred_industries?.length > 0 ? (
                      investorProfile.preferred_industries.map((industry: string) => (
                        <Badge key={industry} variant="outline">{industry}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No preferred industries set</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Availability Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InvestorAvailabilityManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
