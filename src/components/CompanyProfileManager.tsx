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

export default function CompanyProfileManager() {
  const [company, setCompany] = useState<any>(null);
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
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCompany();
    }
  }, [user]);

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
        funding_amount: data.funding_amount?.toString() || ''
      });
    }
  };

  const saveCompany = async () => {
    if (!user) return;

    const companyData = {
      ...formData,
      team_size: formData.team_size ? parseInt(formData.team_size) : null,
      funding_amount: formData.funding_amount ? parseInt(formData.funding_amount) : null,
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
        description: "Failed to save company profile",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(false);
    fetchCompany();
    toast({
      title: "Success",
      description: "Company profile saved successfully!",
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

  if (!company && !isEditing) {
    return (
      <Card className="tech-card border-0 text-center p-12">
        <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Create Your Company Profile</h3>
        <p className="text-muted-foreground mb-6">Showcase your startup to investors, mentors, and potential team members</p>
        <Button onClick={() => setIsEditing(true)} className="pulse-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Company Profile
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
            <span>{company ? 'Edit' : 'Create'} Company Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
              <Input
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., Fintech, Healthtech, AI"
                className="mt-1"
              />
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

          <div>
            <label className="text-sm font-medium text-foreground">Funding Amount ($)</label>
            <Input
              type="number"
              value={formData.funding_amount}
              onChange={(e) => setFormData({ ...formData, funding_amount: e.target.value })}
              placeholder="e.g., 1000000"
              className="mt-1"
            />
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
      {/* Company Header */}
      <Card className="tech-card border-0">
        <CardContent className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                  {company.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{company.name}</h1>
                <p className="text-muted-foreground mb-4 max-w-2xl">{company.description}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={getStageColor(company.stage)} variant="outline">
                    {company.stage?.replace('-', ' ').charAt(0).toUpperCase() + company.stage?.slice(1)}
                  </Badge>
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

      {/* Company Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <p className="text-2xl font-bold text-foreground">{company.industry}</p>
              </div>
              <Building className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Details */}
      <Tabs defaultValue="about" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle>Key Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Industry:</span>
                    <span className="font-medium">{company.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stage:</span>
                    <span className="font-medium">{company.stage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{company.location || 'Not specified'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Team management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Company Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Company update features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}