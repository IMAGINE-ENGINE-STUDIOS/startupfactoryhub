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
  X,
  Users,
  Rocket,
  Percent,
  GraduationCap,
  Locate,
  Building2,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AvatarUpload from './AvatarUpload';
import AddStartupToPortfolioDialog from './accelerator/AddStartupToPortfolioDialog';
import ProfileSubscriptionTab from './ProfileSubscriptionTab';

const INDUSTRIES = ['Technology', 'Healthcare', 'Fintech', 'E-commerce', 'AI/ML', 'SaaS', 'Biotech', 'Clean Energy', 'Education', 'Real Estate'];
const PROGRAM_DURATIONS = ['8 weeks', '10 weeks', '12 weeks', '16 weeks', '6 months', '12 months'];

interface Alumni {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  graduation_year: number | null;
  website: string | null;
}

export default function AcceleratorProfileView() {
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

  // Accelerator profile fields
  const [acceleratorProfile, setAcceleratorProfile] = useState<any>(null);
  const [editedOrgName, setEditedOrgName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedProgramDuration, setEditedProgramDuration] = useState('');
  const [editedEquityPercentage, setEditedEquityPercentage] = useState('');
  const [editedFundingOffered, setEditedFundingOffered] = useState('');
  const [editedIndustriesFocus, setEditedIndustriesFocus] = useState<string[]>([]);
  
  // Address fields
  const [editedAddress, setEditedAddress] = useState('');
  const [editedCity, setEditedCity] = useState('');
  const [editedCountry, setEditedCountry] = useState('');

  // Alumni data
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [alumniLoading, setAlumniLoading] = useState(false);
  const [cohorts, setCohorts] = useState<{ id: string; name: string }[]>([]);
  const [addAlumniDialogOpen, setAddAlumniDialogOpen] = useState(false);

  useEffect(() => {
    const fetchAcceleratorData = async () => {
      if (!profile?.user_id) return;
      
      const { data: accProfile } = await supabase
        .from('accelerator_profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      
      setAcceleratorProfile(accProfile);

      // Fetch cohorts for the alumni dialog
      if (accProfile) {
        const { data: cohortsData } = await supabase
          .from('accelerator_cohorts')
          .select('id, name')
          .eq('accelerator_id', accProfile.id);
        setCohorts(cohortsData || []);
      }
    };

    fetchAcceleratorData();
  }, [profile?.user_id]);

  // Real-time subscription for accelerator profile changes
  useEffect(() => {
    if (!profile?.user_id) return;
    
    const channel = supabase
      .channel(`accelerator-profile-${profile.user_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'accelerator_profiles',
        filter: `user_id=eq.${profile.user_id}`
      }, (payload) => {
        if (payload.eventType !== 'DELETE') {
          setAcceleratorProfile(payload.new);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);

  // Fetch alumni when accelerator profile is loaded
  useEffect(() => {
    const fetchAlumni = async () => {
      if (!acceleratorProfile?.id) return;
      setAlumniLoading(true);

      try {
        // Get cohort IDs for this accelerator
        const { data: cohortIds } = await supabase
          .from('accelerator_cohorts')
          .select('id')
          .eq('accelerator_id', acceleratorProfile.id);

        if (cohortIds && cohortIds.length > 0) {
          const ids = cohortIds.map(c => c.id);
          
          // Fetch graduated startups
          const { data: graduatedStartups } = await supabase
            .from('cohort_startups')
            .select(`
              id,
              graduation_year,
              external_company_name,
              external_company_industry,
              external_company_logo,
              external_company_website,
              is_manual_entry,
              company:companies(id, name, industry, logo_url, website)
            `)
            .in('cohort_id', ids)
            .eq('current_stage', 'graduated');

          if (graduatedStartups) {
            const alumniList: Alumni[] = graduatedStartups.map(s => ({
              id: s.id,
              name: s.is_manual_entry ? s.external_company_name : s.company?.name,
              industry: s.is_manual_entry ? s.external_company_industry : s.company?.industry,
              logo_url: s.is_manual_entry ? s.external_company_logo : s.company?.logo_url,
              graduation_year: s.graduation_year,
              website: s.is_manual_entry ? s.external_company_website : s.company?.website,
            })).filter(a => a.name) as Alumni[];
            setAlumni(alumniList);
          }
        }
      } catch (err) {
        console.error('Error fetching alumni:', err);
      }
      setAlumniLoading(false);
    };

    fetchAlumni();
  }, [acceleratorProfile?.id]);

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
    if (acceleratorProfile) {
      setEditedOrgName(acceleratorProfile.organization_name || '');
      setEditedDescription(acceleratorProfile.description || '');
      setEditedProgramDuration(acceleratorProfile.program_duration || '');
      setEditedEquityPercentage(acceleratorProfile.equity_percentage?.toString() || '');
      setEditedFundingOffered(acceleratorProfile.funding_offered?.toString() || '');
      setEditedIndustriesFocus(acceleratorProfile.industries_focus || []);
      setEditedAddress(acceleratorProfile.address || '');
      setEditedCity(acceleratorProfile.city || '');
      setEditedCountry(acceleratorProfile.country || '');
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation not supported', variant: 'destructive' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Use reverse geocoding with Mapbox
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHc2NGNvbnkwMXhxMm1wdGh4cm16YjhjIn0.O0-Lw80KVFLAVpQQpzVmzg`
          );
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const place = data.features[0];
            const context = place.context || [];
            const city = context.find((c: any) => c.id.startsWith('place'))?.text || '';
            const country = context.find((c: any) => c.id.startsWith('country'))?.text || '';
            setEditedAddress(place.place_name || '');
            setEditedCity(city);
            setEditedCountry(country);
            toast({ title: 'Location detected successfully' });
          }
        } catch (err) {
          toast({ title: 'Failed to get address', variant: 'destructive' });
        }
      },
      () => {
        toast({ title: 'Failed to get location', variant: 'destructive' });
      }
    );
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

      // Geocode the address if provided
      let latitude = null;
      let longitude = null;
      const fullAddress = [editedAddress, editedCity, editedCountry].filter(Boolean).join(', ');
      
      if (fullAddress) {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHc2NGNvbnkwMXhxMm1wdGh4cm16YjhjIn0.O0-Lw80KVFLAVpQQpzVmzg&limit=1`
          );
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            latitude = lat;
            longitude = lng;
          }
        } catch (err) {
          console.error('Geocoding error:', err);
        }
      }

      // Update or create accelerator profile
      const acceleratorData = {
        user_id: profile.user_id,
        organization_name: editedOrgName,
        description: editedDescription,
        location: editedLocation || fullAddress,
        website: editedWebsite,
        program_duration: editedProgramDuration,
        equity_percentage: editedEquityPercentage ? parseFloat(editedEquityPercentage) : null,
        funding_offered: editedFundingOffered ? parseInt(editedFundingOffered) : null,
        industries_focus: editedIndustriesFocus,
        address: editedAddress,
        city: editedCity,
        country: editedCountry,
        latitude,
        longitude,
      };

      let accProfileId = acceleratorProfile?.id;

      if (acceleratorProfile) {
        const { error: accError } = await supabase
          .from('accelerator_profiles')
          .update(acceleratorData)
          .eq('user_id', profile.user_id);
        if (accError) throw accError;
      } else {
        const { data: newProfile, error: accError } = await supabase
          .from('accelerator_profiles')
          .insert(acceleratorData)
          .select()
          .single();
        if (accError) throw accError;
        accProfileId = newProfile?.id;
      }

      // Auto-create or update resource entry for the map (all accelerators are official partners)
      if (accProfileId && fullAddress && latitude && longitude) {
        const resourceData = {
          title: editedOrgName,
          description: editedDescription,
          resource_type: 'accelerator_incubator',
          address: fullAddress,
          city: editedCity,
          country: editedCountry,
          latitude,
          longitude,
          website: editedWebsite,
          logo_url: acceleratorProfile?.logo_url,
          is_official_partner: true,
          is_verified: true,
          linked_accelerator_id: accProfileId,
          created_by: profile.user_id,
        };

        // Check if resource already exists
        const { data: existingResource } = await supabase
          .from('resources')
          .select('id')
          .eq('linked_accelerator_id', accProfileId)
          .maybeSingle();

        if (existingResource) {
          await supabase
            .from('resources')
            .update(resourceData)
            .eq('id', existingResource.id);
        } else {
          await supabase
            .from('resources')
            .insert(resourceData);
        }
      }

      // Refresh accelerator profile data
      const { data: updatedAccProfile } = await supabase
        .from('accelerator_profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      
      setAcceleratorProfile(updatedAccProfile);
      toast({ title: 'Profile updated successfully' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Error updating profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleIndustry = (industry: string) => {
    setEditedIndustriesFocus(prev => 
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
                currentAvatarUrl={acceleratorProfile?.logo_url || profile?.avatar_url}
                size="lg"
                userRole="accelerator"
                showGradientBorder
                onUploadComplete={(url) => {
                  toast({ title: 'Logo updated successfully' });
                }}
              />
            ) : (
              <Avatar className="h-20 w-20">
                <AvatarImage src={acceleratorProfile?.logo_url || profile?.avatar_url || ''} alt={acceleratorProfile?.organization_name} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-2xl">
                  {acceleratorProfile?.organization_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  {isEditing ? (
                    <Input
                      value={editedOrgName}
                      onChange={(e) => setEditedOrgName(e.target.value)}
                      placeholder="Organization Name"
                      className="text-2xl font-bold mb-2 h-12"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      {acceleratorProfile?.organization_name || 'Accelerator'}
                    </h1>
                  )}
                  {isEditing ? (
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Describe your accelerator program..."
                      className="mb-4 max-w-2xl"
                      rows={3}
                    />
                  ) : (
                    <p className="text-muted-foreground mb-4 max-w-2xl">
                      {acceleratorProfile?.description || 'Accelerator/Incubator Program'}
                    </p>
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
                <Badge className="bg-emerald-500/20 text-emerald-400">Accelerator</Badge>
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
                    {(acceleratorProfile?.location || profile?.location) && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {acceleratorProfile?.location || profile?.location}
                      </div>
                    )}
                    {(acceleratorProfile?.website || profile?.website) && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Globe className="h-4 w-4 mr-1" />
                        <a href={acceleratorProfile?.website || profile?.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
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
                <p className="text-sm font-medium text-muted-foreground">Total Cohorts</p>
                <p className="text-2xl font-bold text-foreground">{acceleratorProfile?.total_cohorts || 0}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Startups Supported</p>
                <p className="text-2xl font-bold text-foreground">{acceleratorProfile?.total_startups_supported || 0}</p>
              </div>
              <Rocket className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Funding/Startup</p>
                <p className="text-2xl font-bold text-foreground">
                  {acceleratorProfile?.funding_offered ? formatCurrency(acceleratorProfile.funding_offered) : 'N/A'}
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
                <p className="text-sm font-medium text-muted-foreground">Equity %</p>
                <p className="text-2xl font-bold text-foreground">
                  {acceleratorProfile?.equity_percentage ? `${acceleratorProfile.equity_percentage}%` : 'N/A'}
                </p>
              </div>
              <Percent className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Tabs defaultValue="about" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="program">Program Details</TabsTrigger>
          <TabsTrigger value="alumni">Alumni</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Tell us about your accelerator program, mission, and track record..."
                  rows={5}
                  className="w-full"
                />
              ) : (
                <p className="text-muted-foreground">
                  {acceleratorProfile?.description || 'No description provided yet.'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Address (for Resource Map)</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleUseMyLocation}>
                      <Locate className="h-4 w-4 mr-2" />
                      Use My Location
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Street Address</label>
                    <Input
                      value={editedAddress}
                      onChange={(e) => setEditedAddress(e.target.value)}
                      placeholder="e.g., 123 Innovation Drive"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">City</label>
                      <Input
                        value={editedCity}
                        onChange={(e) => setEditedCity(e.target.value)}
                        placeholder="e.g., San Francisco"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Country</label>
                      <Input
                        value={editedCountry}
                        onChange={(e) => setEditedCountry(e.target.value)}
                        placeholder="e.g., United States"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your accelerator will appear on the Resources map when you save a valid address.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {acceleratorProfile?.address || acceleratorProfile?.city || acceleratorProfile?.country ? (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        {acceleratorProfile?.address && <p>{acceleratorProfile.address}</p>}
                        <p className="text-muted-foreground">
                          {[acceleratorProfile?.city, acceleratorProfile?.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No address specified. Add an address to appear on the Resources map.</p>
                  )}
                </div>
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
                      placeholder="e.g., San Francisco, CA"
                      className="w-48"
                    />
                  ) : (
                    <span className="font-medium">{acceleratorProfile?.location || profile?.location || 'Not specified'}</span>
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
                    <span className="font-medium">{acceleratorProfile?.website || profile?.website || 'Not specified'}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Founded:</span>
                  <span className="font-medium">{acceleratorProfile?.founded_year || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Funding Raised:</span>
                  <span className="font-medium">
                    {acceleratorProfile?.total_funding_raised ? formatCurrency(acceleratorProfile.total_funding_raised) : 'Not specified'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="program" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Program Duration:</span>
                  {isEditing ? (
                    <select
                      value={editedProgramDuration}
                      onChange={(e) => setEditedProgramDuration(e.target.value)}
                      className="w-48 h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="">Select duration</option>
                      {PROGRAM_DURATIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-medium">{acceleratorProfile?.program_duration || 'Not specified'}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Funding per Startup:</span>
                  {isEditing ? (
                    <Input
                      value={editedFundingOffered}
                      onChange={(e) => setEditedFundingOffered(e.target.value)}
                      placeholder="e.g., 100000"
                      type="number"
                      className="w-48"
                    />
                  ) : (
                    <span className="font-medium">
                      {acceleratorProfile?.funding_offered ? formatCurrency(acceleratorProfile.funding_offered) : 'Not specified'}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Equity Taken:</span>
                  {isEditing ? (
                    <Input
                      value={editedEquityPercentage}
                      onChange={(e) => setEditedEquityPercentage(e.target.value)}
                      placeholder="e.g., 7"
                      type="number"
                      step="0.1"
                      className="w-48"
                    />
                  ) : (
                    <span className="font-medium">
                      {acceleratorProfile?.equity_percentage ? `${acceleratorProfile.equity_percentage}%` : 'Not specified'}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Accepting Applications:</span>
                  <Badge className={acceleratorProfile?.is_accepting_applications ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'}>
                    {acceleratorProfile?.is_accepting_applications ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Focus Industries</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((industry) => (
                    <Badge
                      key={industry}
                      variant={editedIndustriesFocus.includes(industry) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleIndustry(industry)}
                    >
                      {industry}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {acceleratorProfile?.industries_focus?.length > 0 ? (
                    acceleratorProfile.industries_focus.map((industry: string) => (
                      <Badge key={industry} variant="secondary">{industry}</Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No industries specified</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alumni" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Alumni ({alumni.length})
                </CardTitle>
              </div>
              <Button onClick={() => setAddAlumniDialogOpen(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Alumni
              </Button>
            </CardHeader>
            <CardContent>
              {alumniLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : alumni.length === 0 ? (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No alumni yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add graduated startups to showcase your program's success
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alumni.map((alum) => (
                    <Card key={alum.id} className="glass-morphism border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={alum.logo_url || ''} />
                            <AvatarFallback className="bg-purple-500/20 text-purple-400">
                              {alum.name?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{alum.name}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {alum.industry || 'Technology'}
                            </p>
                            {alum.graduation_year && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Class of {alum.graduation_year}
                              </Badge>
                            )}
                          </div>
                          {alum.website && (
                            <a href={alum.website} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subscription" className="space-y-4">
          <ProfileSubscriptionTab />
        </TabsContent>
      </Tabs>

      {/* Add Alumni Dialog */}
      <AddStartupToPortfolioDialog
        open={addAlumniDialogOpen}
        onOpenChange={setAddAlumniDialogOpen}
        cohorts={cohorts}
        onStartupAdded={() => {
          // Refresh alumni list
          window.location.reload();
        }}
        isAlumniMode={true}
      />
    </div>
  );
}
