import { useState, useEffect } from 'react';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function InvestorProfileView() {
  const { profile, loading: profileLoading } = useProfileWithRole();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [editedWebsite, setEditedWebsite] = useState('');
  const [editedLinkedin, setEditedLinkedin] = useState('');

  const [investorProfile, setInvestorProfile] = useState<any>(null);

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
                {profile?.full_name?.charAt(0) || 'I'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{profile?.full_name || 'Investor'}</h1>
                  <p className="text-muted-foreground">Professional Investor</p>
                </div>
                <Button onClick={isEditing ? handleSaveProfile : toggleEdit} variant={isEditing ? "default" : "outline"}>
                  {isEditing ? <><Save className="h-4 w-4 mr-2" /> Save</> : <><Edit className="h-4 w-4 mr-2" /> Edit</>}
                </Button>
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
                <Building className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{investorProfile?.portfolio_size || 0}</p>
                  <p className="text-xs text-muted-foreground">Portfolio</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(investorProfile?.total_invested || 0)}</p>
                  <p className="text-xs text-muted-foreground">Invested</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{investorProfile?.investment_range_min ? formatCurrency(investorProfile.investment_range_min) : 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">Min Investment</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{investorProfile?.investment_range_max ? formatCurrency(investorProfile.investment_range_max) : 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">Max Investment</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

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

      {/* Investment Focus */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Focus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Preferred Stages</h4>
            <div className="flex flex-wrap gap-2">
              {investorProfile?.preferred_stages?.map((stage: string) => (
                <Badge key={stage} variant="secondary">{stage}</Badge>
              )) || <p className="text-sm text-muted-foreground">No preferred stages set</p>}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Industries</h4>
            <div className="flex flex-wrap gap-2">
              {investorProfile?.preferred_industries?.map((industry: string) => (
                <Badge key={industry} variant="outline">{industry}</Badge>
              )) || <p className="text-sm text-muted-foreground">No preferred industries set</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
