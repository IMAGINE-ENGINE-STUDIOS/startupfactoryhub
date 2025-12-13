import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Users, TrendingUp, DollarSign, Edit, Plus, Globe, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PitchDeckUpload from './PitchDeckUpload';
import AvatarUpload from './AvatarUpload';
import { useUserRole } from '@/hooks/useUserRole';
import { INDUSTRIES, getIndustryLabel, normalizeIndustry } from '@/lib/constants';

export default function CompanyProfileManager() {
  const [company, setCompany] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    stage: '',
    website: '',
    location: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const { role } = useUserRole();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      if (user) {
        fetchCompany();
      }
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setUserProfile(data);
    }
  };

  const fetchCompany = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching company:', error);
      return;
    }

    if (data) {
      setCompany(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        industry: normalizeIndustry(data.industry),
        stage: data.stage || '',
        website: data.website || '',
        location: data.location || '',
      });
    }
  };

  const saveCompany = async () => {
    if (!user) return;

    const companyData = {
      name: formData.name,
      description: formData.description,
      industry: formData.industry,
      stage: formData.stage as 'idea' | 'prototype' | 'mvp' | 'growth' | 'scale',
      website: formData.website,
      location: formData.location,
      user_id: user.id
    };

    let error;
    if (company) {
      ({ error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', company.id));
    } else {
      ({ error } = await supabase
        .from('companies')
        .insert([companyData]));
    }

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(false);
    fetchCompany();
    toast({
      title: "Success",
      description: "Profile saved successfully!",
    });
  };

  const getStageColor = (stage: string) => {
    const colors = {
      'pre-seed': 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600',
      'seed': 'bg-green-500/10 border-green-500/20 text-green-600',
      'series-a': 'bg-blue-500/10 border-blue-500/20 text-blue-600',
      'series-b': 'bg-purple-500/10 border-purple-500/20 text-purple-600',
      'series-c': 'bg-red-500/10 border-red-500/20 text-red-600',
      'ipo': 'bg-orange-500/10 border-orange-500/20 text-orange-600'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-500/10 border-gray-500/20 text-gray-600';
  };

  const profileTitle = 'Company Profile';
  const entityName = company?.name || 'Your Company';

  if (!company && !isEditing) {
    return (
      <Card className="tech-card border-0 text-center p-12">
        <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Create Your {profileTitle}</h3>
        <p className="text-muted-foreground mb-6">
          Showcase your startup to investors, mentors, and potential team members
        </p>
        <Button onClick={() => setIsEditing(true)} className="pulse-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create {profileTitle}
        </Button>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5 text-primary" />
            <span>{company ? 'Edit' : 'Create'} {profileTitle}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="flex justify-center mb-6">
            <AvatarUpload 
              currentAvatarUrl={userProfile?.avatar_url}
              onUploadComplete={(url) => {
                fetchUserProfile();
                toast({
                  title: "Profile Updated",
                  description: "Your avatar has been updated successfully.",
                });
              }}
              size="lg"
              userRole={role}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Company Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Industry *</label>
              <Select 
                value={formData.industry} 
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind.value} value={ind.value}>
                      {ind.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Description *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what your company does..."
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Stage</label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
            >
              <option value="">Select stage</option>
              <option value="idea">Idea</option>
              <option value="prototype">Prototype</option>
              <option value="mvp">MVP</option>
              <option value="growth">Growth</option>
              <option value="scale">Scale</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Website</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourcompany.com"
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

          <div className="flex space-x-3">
            <Button onClick={saveCompany} className="pulse-primary">
              {company ? 'Update' : 'Create'} Profile
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="tech-card border-0">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                  {company.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{company.name}</h1>
                <p className="text-muted-foreground mb-4 max-w-2xl">{company.description}</p>
                <div className="flex flex-wrap items-center gap-3">
                  {company.stage && (
                    <Badge className={getStageColor(company.stage)} variant="outline">
                      {company.stage?.replace('-', ' ').charAt(0).toUpperCase() + company.stage?.slice(1)}
                    </Badge>
                  )}
                  <Badge variant="secondary">{company.industry}</Badge>
                  {company.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {company.location}
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Globe className="h-4 w-4 mr-1" />
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        Website
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
                <p className="text-sm font-medium text-muted-foreground">Stage</p>
                <p className="text-2xl font-bold text-foreground capitalize">
                  {company.stage?.replace('-', ' ') || 'N/A'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Size</p>
                <p className="text-2xl font-bold text-foreground">{company.team_size || 'Not set'}</p>
              </div>
              <Users className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Funding</p>
                <p className="text-2xl font-bold text-foreground">
                  {company.funding_amount ? `$${(company.funding_amount / 1000000).toFixed(1)}M` : 'Not raised'}
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
                <p className="text-sm font-medium text-muted-foreground">Industry</p>
                <p className="text-lg font-bold text-foreground">{company.industry || 'N/A'}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Tabs defaultValue="about" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="deck">Pitch Deck</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Company Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {company.description || 'No description provided yet.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Industry</p>
                  <p className="text-foreground">{company.industry}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stage</p>
                  <p className="text-foreground capitalize">{company.stage?.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-foreground">{company.location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Website</p>
                  {company.website ? (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {company.website}
                    </a>
                  ) : (
                    <p className="text-foreground">Not specified</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deck" className="space-y-4">
          <PitchDeckUpload 
            companyId={company.id}
            currentDeckUrl={company.pitch_deck_url}
            onUploadComplete={(url) => {
              setCompany({ ...company, pitch_deck_url: url });
              toast({
                title: 'Success!',
                description: 'Pitch deck updated successfully.',
              });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}