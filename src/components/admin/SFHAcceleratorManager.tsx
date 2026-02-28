import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Rocket, 
  ExternalLink, 
  Copy, 
  Save, 
  Users, 
  Building2, 
  FileText, 
  BarChart3,
  CheckCircle,
  XCircle,
  RefreshCw,
  Globe,
  Link,
  Calendar,
  UserPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CohortManagement } from '@/components/accelerator/CohortManagement';
import AddStartupToPortfolioDialog from '@/components/accelerator/AddStartupToPortfolioDialog';

const SFH_ACCELERATOR_ID = 'abd41d15-f707-4e36-b2f5-3a08d7b7b13a';

interface SFHProfile {
  id: string;
  organization_name: string;
  description: string | null;
  website: string | null;
  external_link: string | null;
  program_duration: string | null;
  equity_percentage: number | null;
  funding_offered: number | null;
  is_accepting_applications: boolean | null;
  logo_url: string | null;
  location: string | null;
  total_cohorts: number | null;
  total_startups_supported: number | null;
}

interface Cohort {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  application_deadline: string | null;
  max_startups: number;
  current_startups: number;
  status: string;
  funding_per_startup: number | null;
  equity_percentage: number | null;
  focus_industries: string[] | null;
  enrollment_fee: number | null;
}

const SFHAcceleratorManager = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<SFHProfile | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [stats, setStats] = useState({ totalApplications: 0, totalStartups: 0 });
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<SFHProfile>>({});
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [cohortSheetOpen, setCohortSheetOpen] = useState(false);
  const [cohortEditData, setCohortEditData] = useState<Partial<Cohort>>({});
  const [cohortSaving, setCohortSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [addStartupOpen, setAddStartupOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('accelerator_profiles')
        .select('*')
        .eq('id', SFH_ACCELERATOR_ID)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as SFHProfile);
      setFormData(profileData as SFHProfile);

      // Fetch cohorts
      const { data: cohortsData } = await supabase
        .from('accelerator_cohorts')
        .select('*')
        .eq('accelerator_id', SFH_ACCELERATOR_ID)
        .order('created_at', { ascending: false });

      const cohortsList = (cohortsData || []) as Cohort[];
      setCohorts(cohortsList);

      // Fetch stats
      if (cohortsList.length > 0) {
        const cohortIds = cohortsList.map(c => c.id);

        const { data: appRows } = await supabase
          .from('cohort_applications')
          .select('cohort_id')
          .in('cohort_id', cohortIds);

        const counts: Record<string, number> = {};
        (appRows || []).forEach(row => {
          counts[row.cohort_id] = (counts[row.cohort_id] || 0) + 1;
        });
        setApplicationCounts(counts);

        const totalApps = (appRows || []).length;

        const { count: startupCount } = await supabase
          .from('cohort_startups')
          .select('*', { count: 'exact', head: true })
          .in('cohort_id', cohortIds);

        setStats({
          totalApplications: totalApps,
          totalStartups: startupCount || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching SFH data:', error);
      toast({ title: 'Error loading program data', variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshKey(k => k + 1);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectCohort = (cohort: Cohort) => {
    setSelectedCohort(cohort);
    setCohortEditData({ ...cohort });
    setCohortSheetOpen(true);
  };

  const handleSaveCohort = async () => {
    if (!selectedCohort) return;
    setCohortSaving(true);
    try {
      await handleUpdateCohort(selectedCohort.id, {
        name: cohortEditData.name,
        description: cohortEditData.description,
        status: cohortEditData.status,
        start_date: cohortEditData.start_date,
        end_date: cohortEditData.end_date,
        application_deadline: cohortEditData.application_deadline,
        max_startups: cohortEditData.max_startups,
        funding_per_startup: cohortEditData.funding_per_startup,
        equity_percentage: cohortEditData.equity_percentage,
      });
      toast({ title: 'Cohort updated successfully!' });
      setCohortSheetOpen(false);
      setSelectedCohort(null);
    } catch {
      toast({ title: 'Error updating cohort', variant: 'destructive' });
    } finally {
      setCohortSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('accelerator_profiles')
        .update({
          organization_name: formData.organization_name,
          description: formData.description,
          website: formData.website,
          external_link: formData.external_link,
          program_duration: formData.program_duration,
          equity_percentage: formData.equity_percentage ? Number(formData.equity_percentage) : null,
          funding_offered: formData.funding_offered ? Number(formData.funding_offered) : null,
          is_accepting_applications: formData.is_accepting_applications,
          location: formData.location,
        })
        .eq('id', SFH_ACCELERATOR_ID);

      if (error) throw error;
      toast({ title: 'Program profile saved successfully!' });
      fetchData();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Error saving profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCohort = async (cohortData: Partial<Cohort>) => {
    const { data, error } = await supabase
      .from('accelerator_cohorts')
      .insert({
        ...cohortData,
        accelerator_id: SFH_ACCELERATOR_ID,
        name: cohortData.name || 'New Cohort',
        max_startups: cohortData.max_startups || 10,
        current_startups: 0,
        status: cohortData.status || 'upcoming',
      })
      .select()
      .single();

    if (error) throw error;
    fetchData();
    return data;
  };

  const handleUpdateCohort = async (cohortId: string, updates: Partial<Cohort>) => {
    const { error } = await supabase
      .from('accelerator_cohorts')
      .update(updates)
      .eq('id', cohortId);

    if (error) throw error;
    fetchData();
  };

  const handleDeleteCohort = async (cohortId: string) => {
    try {
      // Delete cascading data first
      await supabase.from('cohort_applications').delete().eq('cohort_id', cohortId);
      await supabase.from('cohort_startups').delete().eq('cohort_id', cohortId);

      const { error } = await supabase
        .from('accelerator_cohorts')
        .delete()
        .eq('id', cohortId);

      if (error) throw error;
      toast({ title: 'Cohort deleted successfully' });
      fetchData();
    } catch (err) {
      console.error('Error deleting cohort:', err);
      toast({ title: 'Error deleting cohort', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };

  const handlePostCohortToFeed = async (cohort: Cohort) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'You must be logged in', variant: 'destructive' });
        return;
      }

      const applicationUrl = `${window.location.origin}/cohorts/${cohort.id}/apply`;

      const cohortData = {
        cohort_id: cohort.id,
        name: cohort.name,
        description: cohort.description,
        deadline: cohort.application_deadline,
        funding: cohort.funding_per_startup,
        equity: cohort.equity_percentage,
        enrollment_fee: cohort.enrollment_fee,
        industries: cohort.focus_industries,
        accelerator_name: profile?.organization_name || 'SFH Accelerator',
        accelerator_logo: profile?.logo_url,
        accelerator_id: SFH_ACCELERATOR_ID,
        application_url: applicationUrl,
      };

      const content = `🚀 New Cohort: ${cohort.name}\n\n${cohort.description || 'Apply now to join our accelerator program!'}`;

      const { error } = await supabase
        .from('feed_posts')
        .insert({
          user_id: user.id,
          post_type: 'cohort' as any,
          content,
          cohort_data: cohortData,
        });

      if (error) throw error;

      toast({ title: 'Cohort posted to community feed!' });
    } catch (error) {
      console.error('Error posting cohort to feed:', error);
      toast({ title: 'Error posting to feed', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">SFH Accelerator profile not found. Please check the database.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile.organization_name}</h2>
            <p className="text-sm text-muted-foreground">Cohorts & Program Management</p>
          </div>
          <Badge variant={profile.is_accepting_applications ? 'default' : 'secondary'} className="ml-2">
            {profile.is_accepting_applications ? (
              <><CheckCircle className="h-3 w-3 mr-1" /> Accepting Applications</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" /> Closed</>
            )}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="tech-card border-0">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Cohorts', value: profile.total_cohorts || cohorts.length, icon: <BarChart3 className="h-5 w-5 text-primary" /> },
          { label: 'Total Startups', value: profile.total_startups_supported || stats.totalStartups, icon: <Building2 className="h-5 w-5 text-primary" /> },
          { label: 'Applications', value: stats.totalApplications, icon: <FileText className="h-5 w-5 text-muted-foreground" /> },
          { label: 'Active Cohorts', value: cohorts.filter(c => c.status === 'in_progress' || c.status === 'applications_open').length, icon: <Users className="h-5 w-5 text-muted-foreground" /> },
        ].map(stat => (
          <Card key={stat.label} className="tech-card border-0">
            <CardContent className="p-4 flex items-center gap-3">
              {stat.icon}
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform Landing Page + External Link Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Platform public page — always shown */}
        <Card className="tech-card border-0 border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <Rocket className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Platform Landing Page</p>
                  <p className="text-sm font-medium truncate">{window.location.origin}/mvp-program</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" className="tech-card border-0" onClick={() => copyToClipboard(`${window.location.origin}/mvp-program`)}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                </Button>
                <Button size="sm" variant="outline" className="tech-card border-0" onClick={() => window.open('/mvp-program', '_blank')}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom external link — only if set */}
        {profile.external_link && (
          <Card className="tech-card border-0 border-l-4 border-l-accent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Link className="h-4 w-4 text-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">External Program Link</p>
                    <p className="text-sm font-medium truncate">{profile.external_link}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="tech-card border-0" onClick={() => copyToClipboard(profile.external_link!)}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                  </Button>
                  <Button size="sm" variant="outline" className="tech-card border-0" onClick={() => window.open(profile.external_link!, '_blank')}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="tech-card border-0">
          <TabsTrigger value="overview">Overview & Profile</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts ({cohorts.length})</TabsTrigger>
          <TabsTrigger value="applications">Applications ({stats.totalApplications})</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio ({stats.totalStartups})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="text-base">Program Profile</CardTitle>
              <CardDescription>Edit the SFH MVP Accelerator program details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input
                    value={formData.organization_name || ''}
                    onChange={e => setFormData(p => ({ ...p, organization_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location || ''}
                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Orlando, FL"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website URL</Label>
                  <Input
                    value={formData.website || ''}
                    onChange={e => setFormData(p => ({ ...p, website: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    External Program Link
                  </Label>
                  <Input
                    value={formData.external_link || ''}
                    onChange={e => setFormData(p => ({ ...p, external_link: e.target.value }))}
                    placeholder="https://apply.startupfactoryhub.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Program Duration</Label>
                  <Input
                    value={formData.program_duration || ''}
                    onChange={e => setFormData(p => ({ ...p, program_duration: e.target.value }))}
                    placeholder="e.g. 4 weeks"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Equity Percentage (%)</Label>
                  <Input
                    type="number"
                    value={formData.equity_percentage ?? ''}
                    onChange={e => setFormData(p => ({ ...p, equity_percentage: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="e.g. 5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Funding Offered ($)</Label>
                  <Input
                    type="number"
                    value={formData.funding_offered ?? ''}
                    onChange={e => setFormData(p => ({ ...p, funding_offered: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="e.g. 25000"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={formData.is_accepting_applications ?? false}
                    onCheckedChange={checked => setFormData(p => ({ ...p, is_accepting_applications: checked }))}
                  />
                  <Label>Accepting Applications</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description || ''}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={4}
                  placeholder="Describe the MVP Accelerator program..."
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cohorts Tab */}
        <TabsContent value="cohorts" className="space-y-4">
          {/* Direct Enrollment Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="gap-2 tech-card border-0"
              onClick={() => setAddStartupOpen(true)}
              disabled={cohorts.length === 0}
            >
              <UserPlus className="h-4 w-4" />
              Add Startup Directly to Cohort
            </Button>
          </div>
          <CohortManagement
            cohorts={cohorts}
            onCreateCohort={handleCreateCohort}
            onUpdateCohort={handleUpdateCohort}
            onSelectCohort={handleSelectCohort}
            onDeleteCohort={handleDeleteCohort}
            onPostToFeed={handlePostCohortToFeed}
            applicationCounts={applicationCounts}
          />
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          {cohorts.length === 0 ? (
            <Card className="tech-card border-0">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Create a cohort first to view applications.</p>
              </CardContent>
            </Card>
          ) : (
            <SFHApplicationsViewer cohorts={cohorts} onRefresh={fetchData} refreshKey={refreshKey} />
          )}
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio">
          {cohorts.length === 0 ? (
            <Card className="tech-card border-0">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No cohorts yet. Create a cohort to start building your portfolio.</p>
              </CardContent>
            </Card>
          ) : (
            <SFHPortfolio cohorts={cohorts} />
          )}
        </TabsContent>
      </Tabs>

      {/* Direct Enrollment Dialog */}
      <AddStartupToPortfolioDialog
        open={addStartupOpen}
        onOpenChange={setAddStartupOpen}
        cohorts={cohorts.map(c => ({ id: c.id, name: c.name }))}
        onStartupAdded={() => { fetchData(); setAddStartupOpen(false); }}
        isAlumniMode={false}
      />

      {/* Cohort Detail Sheet */}
      <Sheet open={cohortSheetOpen} onOpenChange={(open) => { setCohortSheetOpen(open); if (!open) setSelectedCohort(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Cohort Details</SheetTitle>
            <SheetDescription>View and edit cohort settings</SheetDescription>
          </SheetHeader>
          {selectedCohort && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cohort Name</Label>
                <Input
                  value={cohortEditData.name || ''}
                  onChange={e => setCohortEditData(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={cohortEditData.description || ''}
                  onChange={e => setCohortEditData(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={cohortEditData.status || 'upcoming'}
                  onValueChange={v => setCohortEditData(p => ({ ...p, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="applications_open">Applications Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Start Date</Label>
                  <Input
                    type="date"
                    value={cohortEditData.start_date?.split('T')[0] || ''}
                    onChange={e => setCohortEditData(p => ({ ...p, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />End Date</Label>
                  <Input
                    type="date"
                    value={cohortEditData.end_date?.split('T')[0] || ''}
                    onChange={e => setCohortEditData(p => ({ ...p, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Application Deadline</Label>
                <Input
                  type="date"
                  value={cohortEditData.application_deadline?.split('T')[0] || ''}
                  onChange={e => setCohortEditData(p => ({ ...p, application_deadline: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Max Startups</Label>
                  <Input
                    type="number"
                    value={cohortEditData.max_startups ?? ''}
                    onChange={e => setCohortEditData(p => ({ ...p, max_startups: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Funding per Startup ($)</Label>
                  <Input
                    type="number"
                    value={cohortEditData.funding_per_startup ?? ''}
                    onChange={e => setCohortEditData(p => ({ ...p, funding_per_startup: e.target.value ? Number(e.target.value) : null }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Equity Percentage (%)</Label>
                <Input
                  type="number"
                  value={cohortEditData.equity_percentage ?? ''}
                  onChange={e => setCohortEditData(p => ({ ...p, equity_percentage: e.target.value ? Number(e.target.value) : null }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1" onClick={handleSaveCohort} disabled={cohortSaving}>
                  {cohortSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => { setCohortSheetOpen(false); setSelectedCohort(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

// Applications viewer for SFH cohorts
const SFHApplicationsViewer = ({ cohorts, onRefresh, refreshKey }: { cohorts: Cohort[]; onRefresh: () => void; refreshKey: number }) => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      const cohortIds = cohorts.map(c => c.id);
      const { data } = await supabase
        .from('cohort_applications')
        .select(`
          *,
          companies (id, name, industry, logo_url),
          accelerator_cohorts (name)
        `)
        .in('cohort_id', cohortIds)
        .order('applied_at', { ascending: false });
      setApplications(data || []);
      setLoading(false);
    };
    fetchApps();
  }, [cohorts, refreshKey]);

  const updateStatus = async (appId: string, status: string) => {
    const { error } = await supabase
      .from('cohort_applications')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', appId);
    if (error) { toast({ title: 'Error updating status', variant: 'destructive' }); return; }
    toast({ title: `Application ${status}` });
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    onRefresh();
  };

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;

  if (applications.length === 0) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="py-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No applications yet.</p>
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'secondary',
    under_review: 'outline',
    accepted: 'default',
    rejected: 'destructive',
    waitlist: 'outline',
    interview_scheduled: 'outline',
  };

  return (
    <div className="space-y-3">
      {applications.map(app => (
        <Card key={app.id} className="tech-card border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              {app.companies?.logo_url
                ? <img src={app.companies.logo_url} alt={app.companies?.name} className="h-10 w-10 rounded-lg object-cover" />
                : <Building2 className="h-5 w-5 text-muted-foreground" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{app.companies?.name || 'Unknown Startup'}</p>
              <p className="text-sm text-muted-foreground">{app.accelerator_cohorts?.name} · {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={(statusColors[app.status] || 'secondary') as any} className="text-xs capitalize">
                {(app.status || 'pending').replace('_', ' ')}
              </Badge>
              {app.status === 'pending' || app.status === 'under_review' ? (
                <>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(app.id, 'accepted')}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(app.id, 'under_review')}>
                    Review
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus(app.id, 'rejected')}>
                    <XCircle className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};


const SFHPortfolio = ({ cohorts }: { cohorts: Cohort[] }) => {
  const [startups, setStartups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      const cohortIds = cohorts.map(c => c.id);
      const { data } = await supabase
        .from('cohort_startups')
        .select(`
          *,
          companies (id, name, industry, stage, logo_url, website),
          accelerator_cohorts (name, status)
        `)
        .in('cohort_id', cohortIds)
        .order('joined_at', { ascending: false });
      setStartups(data || []);
      setLoading(false);
    };
    if (cohorts.length > 0) fetchPortfolio();
    else setLoading(false);
  }, [cohorts]);

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;

  if (startups.length === 0) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="py-12 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No startups in the portfolio yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {startups.map(s => (
        <Card key={s.id} className="tech-card border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              {s.companies?.logo_url
                ? <img src={s.companies.logo_url} alt={s.companies?.name} className="h-10 w-10 rounded-lg object-cover" />
                : <Building2 className="h-5 w-5 text-muted-foreground" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{s.external_company_name || s.companies?.name || 'Unknown'}</p>
              <p className="text-sm text-muted-foreground">{s.companies?.industry || s.external_company_industry || '—'} · {s.accelerator_cohorts?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{s.current_stage || s.companies?.stage || 'Active'}</Badge>
              {s.payment_status && (
                <Badge variant={s.payment_status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                  {s.payment_status}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SFHAcceleratorManager;
