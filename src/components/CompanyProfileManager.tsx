import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Users, TrendingUp, DollarSign, Edit, Plus, Globe, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PitchDeckUpload from './PitchDeckUpload';
import AvatarUpload from './AvatarUpload';
import { useUserRole } from '@/hooks/useUserRole';

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
    team_size: '',
    funding_amount: '',
    // Investor-specific fields
    investment_min: '',
    investment_max: '',
    investment_focus: [] as string[],
    portfolio_size: '',
    firm_experience: ''
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
        industry: data.industry || '',
        stage: data.stage || '',
        website: data.website || '',
        location: data.location || '',
        team_size: data.team_size?.toString() || '',
        funding_amount: data.funding_amount?.toString() || '',
        // Use existing fields creatively for investor data
        investment_min: data.founded_year?.toString() || '', // Reuse founded_year for investment min
        investment_max: data.team_size?.toString() || '', // Reuse team_size for investment max
        investment_focus: data.looking_for || [],
        portfolio_size: data.funding_amount?.toString() || '', // Reuse funding_amount for portfolio size
        firm_experience: data.founded_year?.toString() || ''
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
      team_size: isInvestor 
        ? (formData.investment_max ? parseInt(formData.investment_max) : null)
        : (formData.team_size ? parseInt(formData.team_size) : null),
      funding_amount: isInvestor 
        ? (formData.portfolio_size ? parseInt(formData.portfolio_size) : null)
        : (formData.funding_amount ? parseInt(formData.funding_amount) : null),
      founded_year: isInvestor 
        ? (formData.firm_experience ? parseInt(formData.firm_experience) : null)
        : null,
      looking_for: isInvestor ? formData.investment_focus : [],
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

  const isInvestor = userProfile?.role === 'investor';
  const profileTitle = isInvestor ? 'Investment Profile' : 'Company Profile';
  const entityName = isInvestor ? (company?.name || 'Investment Firm') : (company?.name || 'Your Company');

  const focusAreas = ['Fintech', 'Healthcare', 'AI/ML', 'SaaS', 'E-commerce', 'Blockchain', 'Climate Tech', 'EdTech', 'Consumer Apps', 'Enterprise Software'];

  if (!company && !isEditing) {
    return (
      <Card className="tech-card border-0 text-center p-12">
        <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Create Your {profileTitle}</h3>
        <p className="text-muted-foreground mb-6">
          {isInvestor 
            ? 'Set up your investment criteria and firm information to connect with promising startups'
            : 'Showcase your startup to investors, mentors, and potential team members'
          }
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
              <label className="text-sm font-medium text-foreground">
                {isInvestor ? 'Firm Name *' : 'Company Name *'}
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isInvestor ? 'Enter firm name' : 'Enter company name'}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                {isInvestor ? 'Investment Focus *' : 'Industry *'}
              </label>
              <Input
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder={isInvestor ? 'e.g., Early-stage SaaS, Fintech' : 'e.g., Fintech, Healthtech, AI'}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Description *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={isInvestor 
                ? 'Describe your investment approach and what you look for in startups...'
                : 'Describe what your company does...'
              }
              className="mt-1 min-h-[100px]"
            />
          </div>

          {isInvestor ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Investment Range ($)</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      type="number"
                      value={formData.investment_min}
                      onChange={(e) => setFormData({ ...formData, investment_min: e.target.value })}
                      placeholder="Min (e.g., 50000)"
                    />
                    <Input
                      type="number"
                      value={formData.investment_max}
                      onChange={(e) => setFormData({ ...formData, investment_max: e.target.value })}
                      placeholder="Max (e.g., 5000000)"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Portfolio Size</label>
                  <Input
                    type="number"
                    value={formData.portfolio_size}
                    onChange={(e) => setFormData({ ...formData, portfolio_size: e.target.value })}
                    placeholder="Number of investments"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Investment Focus Areas</label>
                <div className="flex flex-wrap gap-2">
                  {focusAreas.map((area) => (
                    <Badge
                      key={area}
                      variant={formData.investment_focus.includes(area) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          investment_focus: prev.investment_focus.includes(area)
                            ? prev.investment_focus.filter(f => f !== area)
                            : [...prev.investment_focus, area]
                        }));
                      }}
                    >
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Years of Experience</label>
                <Input
                  type="number"
                  value={formData.firm_experience}
                  onChange={(e) => setFormData({ ...formData, firm_experience: e.target.value })}
                  placeholder="Years in investing"
                  className="mt-1"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                  >
                    <option value="">Select stage</option>
                    <option value="pre-seed">Pre-Seed</option>
                    <option value="seed">Seed</option>
                    <option value="series-a">Series A</option>
                    <option value="series-b">Series B</option>
                    <option value="series-c">Series C</option>
                    <option value="ipo">IPO Ready</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Team Size</label>
                  <Input
                    type="number"
                    value={formData.team_size}
                    onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                    placeholder="e.g., 10"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Funding Raised ($)</label>
                <Input
                  type="number"
                  value={formData.funding_amount}
                  onChange={(e) => setFormData({ ...formData, funding_amount: e.target.value })}
                  placeholder="e.g., 1000000"
                  className="mt-1"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Website</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder={isInvestor ? 'https://yourfirm.com' : 'https://yourcompany.com'}
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
                  {!isInvestor && company.stage && (
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
        {isInvestor ? (
          <>
            <Card className="tech-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Investment Range</p>
                    <p className="text-lg font-bold text-foreground">
                      {formData.investment_min && formData.investment_max 
                        ? `$${(parseInt(formData.investment_min) / 1000)}K - $${(parseInt(formData.investment_max) / 1000000)}M`
                        : 'Not specified'}
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
                    <p className="text-sm font-medium text-muted-foreground">Portfolio Size</p>
                    <p className="text-2xl font-bold text-foreground">
                      {company.funding_amount || 'N/A'}
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
                    <p className="text-sm font-medium text-muted-foreground">Experience</p>
                    <p className="text-2xl font-bold text-foreground">
                      {company.founded_year ? `${company.founded_year}y` : 'N/A'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="tech-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Focus Areas</p>
                    <p className="text-xl font-bold text-foreground">
                      {company.looking_for?.length || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="tech-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Team Size</p>
                    <p className="text-2xl font-bold text-foreground">{company.team_size || 'N/A'}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="tech-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Funding Raised</p>
                    <p className="text-2xl font-bold text-foreground">
                      {company.funding_amount ? `$${(company.funding_amount / 1000000).toFixed(1)}M` : 'N/A'}
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
                    <p className="text-sm font-medium text-muted-foreground">Stage</p>
                    <p className="text-2xl font-bold text-foreground">
                      {company.stage?.replace('-', ' ') || 'Startup'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="tech-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Industry</p>
                    <p className="text-xl font-bold text-foreground">{company.industry}</p>
                  </div>
                  <Building className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Details */}
      <Tabs defaultValue="about" className="space-y-6">
        <TabsList className={`grid w-full ${isInvestor ? 'grid-cols-2' : 'grid-cols-3'} max-w-2xl`}>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="focus">
            {isInvestor ? 'Investment Focus' : 'Company Details'}
          </TabsTrigger>
          {!isInvestor && <TabsTrigger value="deck">Pitch Deck</TabsTrigger>}
        </TabsList>

        <TabsContent value="about" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>{isInvestor ? 'Investment Philosophy' : 'Company Description'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {company.description || 'No description provided yet.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="focus" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>
                {isInvestor ? 'Investment Focus Areas' : 'Key Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isInvestor ? (
                <div className="space-y-4">
                  {company.looking_for && company.looking_for.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {company.looking_for.map((focus: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {focus}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No investment focus areas specified.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Industry:</span>
                    <span className="font-medium">{company.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stage:</span>
                    <span className="font-medium">{company.stage || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{company.location || 'Not specified'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {!isInvestor && (
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
        )}
      </Tabs>
    </div>
  );
}