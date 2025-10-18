import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Briefcase, DollarSign, MapPin, Clock, Users } from 'lucide-react';

interface Job {
  id: string;
  company_id: string;
  title: string;
  description: string;
  location?: string;
  job_type: string;
  experience_level?: string;
  compensation_type: string;
  hourly_rate?: number;
  salary_range_min?: number;
  salary_range_max?: number;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  applications_count: number;
  companies: {
    name: string;
    logo_url?: string;
  };
}

export function JobsBoard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
    fetchUserCompany();
  }, [user]);

  const fetchUserCompany = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (data) setUserCompanyId(data.id);
  };

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies(name, logo_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userCompanyId) {
      toast.error('You need to create a company profile first');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const compensationType = formData.get('compensation_type') as string;

    const jobData: any = {
      company_id: userCompanyId,
      title: formData.get('title'),
      description: formData.get('description'),
      location: formData.get('location'),
      job_type: formData.get('job_type'),
      experience_level: formData.get('experience_level'),
      compensation_type: compensationType,
    };

    if (compensationType === 'hourly') {
      jobData.hourly_rate = parseFloat(formData.get('hourly_rate') as string);
    } else if (compensationType === 'salary') {
      jobData.salary_range_min = parseFloat(formData.get('salary_min') as string);
      jobData.salary_range_max = parseFloat(formData.get('salary_max') as string);
    }

    try {
      const { error } = await supabase.from('jobs').insert(jobData);
      if (error) throw error;
      toast.success('Job posted successfully!');
      setIsCreateDialogOpen(false);
      fetchJobs();
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to post job');
    }
  };

  const handleApply = async (jobId: string) => {
    if (!user) {
      toast.error('Please sign in to apply');
      return;
    }

    try {
      const { error } = await supabase.from('job_applications').insert({
        job_id: jobId,
        user_id: user.id,
        status: 'pending',
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already applied to this job');
        } else {
          throw error;
        }
      } else {
        toast.success('Application submitted successfully!');
        fetchJobs();
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      toast.error('Failed to submit application');
    }
  };

  const getCompensationDisplay = (job: Job) => {
    if (job.compensation_type === 'unpaid') return 'Unpaid';
    if (job.compensation_type === 'hourly') return `$${job.hourly_rate}/hour`;
    if (job.compensation_type === 'salary') {
      return `$${job.salary_range_min?.toLocaleString()} - $${job.salary_range_max?.toLocaleString()}/year`;
    }
    return 'Not specified';
  };

  if (loading) return <div className="text-center p-8">Loading jobs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Full-Time Jobs</h2>
          <p className="text-muted-foreground">Explore career opportunities</p>
        </div>
        {userCompanyId && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Post a Job</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post a New Job</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateJob} className="space-y-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input id="title" name="title" required />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" name="description" required rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" placeholder="Remote, NYC, etc." />
                  </div>
                  <div>
                    <Label htmlFor="job_type">Job Type *</Label>
                    <Select name="job_type" defaultValue="full-time">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-Time</SelectItem>
                        <SelectItem value="part-time">Part-Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="experience_level">Experience Level</Label>
                    <Select name="experience_level" defaultValue="mid">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="compensation_type">Compensation Type *</Label>
                    <Select name="compensation_type" defaultValue="salary">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                        <SelectItem value="salary">Salary Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div id="compensation-fields" className="grid grid-cols-2 gap-4">
                  <div className="hourly-field hidden">
                    <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                    <Input id="hourly_rate" name="hourly_rate" type="number" step="0.01" />
                  </div>
                  <div className="salary-field">
                    <Label htmlFor="salary_min">Min Salary ($)</Label>
                    <Input id="salary_min" name="salary_min" type="number" step="1000" />
                  </div>
                  <div className="salary-field">
                    <Label htmlFor="salary_max">Max Salary ($)</Label>
                    <Input id="salary_max" name="salary_max" type="number" step="1000" />
                  </div>
                </div>
                <Button type="submit" className="w-full">Post Job</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No jobs posted yet
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    {job.companies.logo_url && (
                      <img
                        src={job.companies.logo_url}
                        alt={job.companies.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>{job.companies.name}</span>
                        {job.location && (
                          <>
                            <span>•</span>
                            <MapPin className="h-3 w-3" />
                            <span>{job.location}</span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Button onClick={() => handleApply(job.id)}>Apply Now</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{job.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {job.job_type}
                  </Badge>
                  {job.experience_level && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {job.experience_level}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {getCompensationDisplay(job)}
                  </Badge>
                  {job.applications_count > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {job.applications_count} applicants
                    </Badge>
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
