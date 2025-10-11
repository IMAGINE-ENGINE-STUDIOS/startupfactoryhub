import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Building, DollarSign, TrendingUp, X } from 'lucide-react';

const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth'];
const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'SaaS', 'AI/ML', 'Blockchain', 'Other'];

export default function InvestorProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  
  const [formData, setFormData] = useState({
    investment_range_min: '',
    investment_range_max: '',
    preferred_stages: [] as string[],
    preferred_industries: [] as string[],
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('investor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setProfileExists(true);
      setFormData({
        investment_range_min: data.investment_range_min?.toString() || '',
        investment_range_max: data.investment_range_max?.toString() || '',
        preferred_stages: data.preferred_stages || [],
        preferred_industries: data.preferred_industries || [],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const profileData = {
      user_id: user.id,
      investment_range_min: formData.investment_range_min ? parseInt(formData.investment_range_min) : null,
      investment_range_max: formData.investment_range_max ? parseInt(formData.investment_range_max) : null,
      preferred_stages: formData.preferred_stages,
      preferred_industries: formData.preferred_industries,
    };

    const { error } = await supabase
      .from('investor_profiles')
      .upsert(profileData);

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save investor profile. Please try again.',
        variant: 'destructive',
      });
    } else {
      setProfileExists(true);
      toast({
        title: 'Success!',
        description: 'Your investor profile has been saved.',
      });
    }
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

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          {profileExists ? 'Edit Investment Profile' : 'Create Investment Profile'}
        </CardTitle>
        <CardDescription>
          Set your investment preferences to get better startup recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Investment Range */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-semibold">Investment Range</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min">Minimum Investment ($)</Label>
                <Input
                  id="min"
                  type="number"
                  placeholder="50000"
                  value={formData.investment_range_min}
                  onChange={(e) => setFormData(prev => ({ ...prev, investment_range_min: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max">Maximum Investment ($)</Label>
                <Input
                  id="max"
                  type="number"
                  placeholder="500000"
                  value={formData.investment_range_max}
                  onChange={(e) => setFormData(prev => ({ ...prev, investment_range_max: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Preferred Stages */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-semibold">Preferred Startup Stages</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {STAGES.map(stage => (
                <Badge
                  key={stage}
                  variant={formData.preferred_stages.includes(stage) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80"
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-semibold">Preferred Industries</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map(industry => (
                <Badge
                  key={industry}
                  variant={formData.preferred_industries.includes(industry) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80"
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : profileExists ? 'Update Profile' : 'Create Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
