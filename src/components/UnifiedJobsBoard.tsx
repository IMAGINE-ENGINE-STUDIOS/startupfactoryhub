import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, MapPin, DollarSign, Clock, ExternalLink, CheckCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string | null;
  category: 'full-time' | 'part-time' | 'contract' | 'internship';
  job_type: string | null;
  duration: string | null;
  compensation_type: string;
  hourly_rate: number | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  is_task_based: boolean;
  external_application_url: string | null;
  applications_count: number;
  created_at: string;
  companies: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export default function UnifiedJobsBoard() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserCompany();
      fetchJobs();
    }
  }, [user, categoryFilter]);

  const fetchUserCompany = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setUserCompanyId(data.id);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('jobs')
        .select(`
          *,
          companies (
            id,
            name,
            logo_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
      }

      const { data, error } = await query;

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !userCompanyId) return;

    const formData = new FormData(e.currentTarget);
    const category = formData.get('category') as 'full-time' | 'part-time' | 'contract' | 'internship';
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          company_id: userCompanyId,
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          location: formData.get('location') as string,
          category: category,
          job_type: formData.get('job_type') as string,
          duration: category === 'internship' || category === 'contract' ? (formData.get('duration') as string) : null,
          compensation_type: formData.get('compensation_type') as string,
          salary_range_min: formData.get('salary_min') ? Number(formData.get('salary_min')) : null,
          salary_range_max: formData.get('salary_max') ? Number(formData.get('salary_max')) : null,
          is_task_based: formData.get('is_task_based') === 'true',
          external_application_url: formData.get('external_url') as string || null,
          status: 'active',
        }] as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Job posted successfully',
      });

      setShowPostDialog(false);
      fetchJobs();
      e.currentTarget.reset();
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Error',
        description: 'Failed to post job',
        variant: 'destructive',
      });
    }
  };

  const handleApply = async (jobId: string, externalUrl: string | null) => {
    if (externalUrl) {
      window.open(externalUrl, '_blank');
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to apply',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          user_id: user.id,
          status: 'pending',
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already Applied',
            description: 'You have already applied to this job',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Success!',
        description: 'Application submitted successfully',
      });

      fetchJobs();
    } catch (error) {
      console.error('Error applying:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'full-time': 'bg-blue-500',
      'part-time': 'bg-green-500',
      'contract': 'bg-purple-500',
      'internship': 'bg-orange-500',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const getCompensationDisplay = (job: Job) => {
    if (job.compensation_type === 'salary' && job.salary_range_min && job.salary_range_max) {
      return `$${job.salary_range_min.toLocaleString()} - $${job.salary_range_max.toLocaleString()}/year`;
    }
    if (job.compensation_type === 'hourly' && job.hourly_rate) {
      return `$${job.hourly_rate}/hour`;
    }
    return 'Compensation not specified';
  };

  if (loading) {
    return <div className="text-center py-8">Loading jobs...</div>;
  }

  const isCompanyUser = role === 'startup' && userCompanyId;
  const canApply = role === 'student';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Jobs & Opportunities</CardTitle>
              <CardDescription>Browse and apply to positions across all categories</CardDescription>
            </div>
            {isCompanyUser && (
              <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Post Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Post a New Job</DialogTitle>
                    <DialogDescription>Fill in the details for your job posting</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateJob} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Job Title *</Label>
                        <Input id="title" name="title" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select name="category" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full-time">Full-Time</SelectItem>
                            <SelectItem value="part-time">Part-Time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea id="description" name="description" rows={4} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" name="location" placeholder="e.g., Remote, New York, NY" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="job_type">Type</Label>
                        <Select name="job_type">
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="remote">Remote</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="on-site">On-site</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (for internships/contracts)</Label>
                        <Input id="duration" name="duration" placeholder="e.g., 3 months" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="compensation_type">Compensation Type</Label>
                        <Select name="compensation_type" defaultValue="salary">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="salary">Salary</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salary_min">Min Salary/Rate</Label>
                        <Input id="salary_min" name="salary_min" type="number" placeholder="50000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary_max">Max Salary/Rate</Label>
                        <Input id="salary_max" name="salary_max" type="number" placeholder="80000" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="external_url">External Application URL (optional)</Label>
                      <Input 
                        id="external_url" 
                        name="external_url" 
                        type="url" 
                        placeholder="https://company.com/apply" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="is_task_based">Enable Task Management?</Label>
                      <Select name="is_task_based" defaultValue="false">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">No</SelectItem>
                          <SelectItem value="true">Yes (assign tasks to accepted applicants)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full">Post Job</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={categoryFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setCategoryFilter('all')}
        >
          All Jobs
        </Button>
        <Button
          variant={categoryFilter === 'full-time' ? 'default' : 'outline'}
          onClick={() => setCategoryFilter('full-time')}
        >
          Full-Time
        </Button>
        <Button
          variant={categoryFilter === 'part-time' ? 'default' : 'outline'}
          onClick={() => setCategoryFilter('part-time')}
        >
          Part-Time
        </Button>
        <Button
          variant={categoryFilter === 'contract' ? 'default' : 'outline'}
          onClick={() => setCategoryFilter('contract')}
        >
          Contract
        </Button>
        <Button
          variant={categoryFilter === 'internship' ? 'default' : 'outline'}
          onClick={() => setCategoryFilter('internship')}
        >
          Internships
        </Button>
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {jobs.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No jobs found</p>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  {job.companies?.logo_url && (
                    <img 
                      src={job.companies.logo_url} 
                      alt={job.companies.name} 
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription className="text-sm">{job.companies?.name}</CardDescription>
                      </div>
                      <Badge className={getCategoryColor(job.category)}>
                        {job.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
                
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </div>
                  )}
                  {job.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {job.duration}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {getCompensationDisplay(job)}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {job.is_task_based && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Task-Based
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {job.applications_count} applicants
                    </div>
                  </div>
                  
                  {canApply && (
                    <Button 
                      onClick={() => handleApply(job.id, job.external_application_url)}
                      variant={job.external_application_url ? 'outline' : 'default'}
                    >
                      {job.external_application_url ? (
                        <>
                          Apply Externally
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        'Apply Now'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
