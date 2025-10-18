import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useRealtime } from '@/hooks/useRealtime';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Briefcase, MapPin, DollarSign, Clock, ExternalLink, CheckCircle, Users, FileText, Mail, Phone, Eye, Copy } from 'lucide-react';
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

interface JobApplication {
  id: string;
  status: string;
  created_at: string;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  user_id: string | null;
  application_type: 'internal' | 'external';
  profiles?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
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
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [showApplicationsDialog, setShowApplicationsDialog] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<string | null>(null);

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
    const externalUrl = (formData.get('external_url') as string)?.trim();
    
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
          external_application_url: externalUrl || null,
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
      await fetchJobs();
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

  const fetchApplicationsForJob = async (jobId: string) => {
    setLoadingApplications(true);
    try {
      // Fetch internal applications
      const { data: internalApps, error: internalError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_id', jobId);

      if (internalError) throw internalError;

      // Fetch profiles for internal applications separately
      const internalAppProfiles = await Promise.all(
        (internalApps || []).map(async (app) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('user_id', app.user_id)
            .single();
          return { ...app, profiles: profile };
        })
      );

      // Fetch external applications
      const { data: externalApps, error: externalError } = await supabase
        .from('public_job_applications')
        .select('*')
        .eq('job_id', jobId);

      if (externalError) throw externalError;

      // Combine and format applications
      const formattedInternal: JobApplication[] = internalAppProfiles.map(app => ({
        id: app.id,
        status: app.status,
        created_at: app.created_at,
        applicant_name: app.profiles?.full_name || null,
        applicant_email: app.profiles?.email || null,
        applicant_phone: null,
        cover_letter: app.cover_letter,
        resume_url: app.resume_url,
        user_id: app.user_id,
        application_type: 'internal' as const,
        profiles: app.profiles,
      }));

      const formattedExternal: JobApplication[] = (externalApps || []).map(app => ({
        id: app.id,
        status: app.status,
        created_at: app.created_at,
        applicant_name: app.applicant_name,
        applicant_email: app.applicant_email,
        applicant_phone: app.applicant_phone,
        cover_letter: app.cover_letter,
        resume_url: app.resume_url,
        user_id: null,
        application_type: 'external' as const,
        profiles: null,
      }));

      setApplications([...formattedInternal, ...formattedExternal]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleViewApplications = (jobId: string) => {
    setSelectedJobId(jobId);
    setShowApplicationsDialog(true);
    fetchApplicationsForJob(jobId);
  };

  const handleCloseApplicationsDialog = () => {
    setShowApplicationsDialog(false);
    setSelectedJobId(null);
    setApplications([]);
  };

  const handleViewResume = (resumeUrl: string | null) => {
    if (!resumeUrl) {
      toast({
        title: 'No Resume',
        description: 'This applicant has not uploaded a resume',
        variant: 'destructive',
      });
      return;
    }

    console.log('Opening resume:', resumeUrl);
    window.open(resumeUrl, '_blank');
    toast({
      title: 'Opening Resume',
      description: 'Resume opened in new tab',
    });
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string, applicationType: 'internal' | 'external', jobId: string) => {
    setUpdatingApplicationId(applicationId);
    
    // Optimistic update - immediately update UI
    setApplications(prev => prev.map(app => 
      app.id === applicationId 
        ? { ...app, status: newStatus }
        : app
    ));
    
    try {
      const table = applicationType === 'internal' ? 'job_applications' : 'public_job_applications';
      
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating application status:', error);
        // Revert optimistic update on error
        await fetchApplicationsForJob(jobId);
        toast({
          title: 'Error',
          description: 'Failed to update application status. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: `Application ${newStatus} successfully`,
      });

      // If it's an external application being accepted for a task-based job, create invitation
      if (applicationType === 'external' && newStatus === 'accepted') {
        const job = jobs.find(j => j.id === jobId);
        if (job?.is_task_based) {
          await createInvitation(applicationId, jobId);
        }
      }

      // Update application count for the job from current applications array
      setJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, applications_count: applications.length }
          : j
      ));
    } catch (error) {
      console.error('Unexpected error:', error);
      // Revert optimistic update on error
      await fetchApplicationsForJob(jobId);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const handleCopyExternalLink = async (externalUrl: string) => {
    try {
      await navigator.clipboard.writeText(externalUrl);
      toast({
        title: 'Link Copied!',
        description: 'External application link copied to clipboard',
      });
    } catch (error) {
      console.error('Error copying link:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const createInvitation = async (applicationId: string, jobId: string) => {
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Get the applicant email from the application
      const application = applications.find(app => app.id === applicationId);
      if (!application || !application.applicant_email) {
        throw new Error('Applicant email not found');
      }

      const { error: inviteError } = await supabase
        .from('application_invitations')
        .insert({
          application_id: applicationId,
          applicant_email: application.applicant_email,
          invitation_token: token,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        });

      if (inviteError) throw inviteError;

      // Call edge function to send invitation email
      const { error: emailError } = await supabase.functions.invoke('send-application-invitation', {
        body: { applicationId, token },
      });

      if (emailError) {
        console.error('Error sending invitation email:', emailError);
      }

      toast({
        title: 'Invitation Sent',
        description: 'Task assignment invitation sent to applicant',
      });
    } catch (error) {
      console.error('Error creating invitation:', error);
    }
  };

  // Real-time updates for applications
  useRealtime({
    table: 'job_applications',
    onInsert: () => {
      if (selectedJobId) fetchApplicationsForJob(selectedJobId);
      fetchJobs();
    },
    onUpdate: () => {
      if (selectedJobId) fetchApplicationsForJob(selectedJobId);
      fetchJobs();
    },
  });

  useRealtime({
    table: 'public_job_applications',
    onInsert: () => {
      if (selectedJobId) fetchApplicationsForJob(selectedJobId);
      fetchJobs();
    },
    onUpdate: () => {
      if (selectedJobId) fetchApplicationsForJob(selectedJobId);
      fetchJobs();
    },
  });

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
                      <div className="flex-1">
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
                    {isCompanyUser && job.companies?.id === userCompanyId && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewApplications(job.id)}
                          className="gap-1"
                        >
                          <Users className="w-4 h-4" />
                          View Applications ({job.applications_count})
                        </Button>
                        {job.external_application_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyExternalLink(job.external_application_url!);
                            }}
                            className="gap-1"
                            title="Copy external application link"
                          >
                            <Copy className="w-3 h-3" />
                            Copy Link
                          </Button>
                        )}
                      </>
                    )}
                    {!isCompanyUser && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {job.applications_count} applicants
                      </div>
                    )}
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

      {/* Applications Dialog */}
      <Dialog open={showApplicationsDialog} onOpenChange={handleCloseApplicationsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Job Applications</DialogTitle>
            <DialogDescription>
              Manage applications for this job posting
            </DialogDescription>
          </DialogHeader>
          
          {loadingApplications ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No applications yet
            </div>
          ) : (
              <div className="h-[60vh] overflow-y-auto pr-4">
                <div className="space-y-4 pb-4">
                {applications.map((app) => (
                  <Card key={app.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{app.applicant_name || 'Anonymous'}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {app.application_type === 'internal' ? 'Platform User' : 'External Applicant'}
                                </Badge>
                              </div>
                              {app.applicant_email && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="w-3 h-3" />
                                  {app.applicant_email}
                                </div>
                              )}
                              {app.applicant_phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  {app.applicant_phone}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {app.application_type === 'external' && app.status === 'accepted' && (
                                <Badge variant="secondary" className="gap-1 text-xs">
                                  <Mail className="w-3 h-3" />
                                  Invitation Sent
                                </Badge>
                              )}
                            </div>
                          </div>

                          {app.cover_letter && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">Cover Letter:</p>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {app.cover_letter}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {app.resume_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewResume(app.resume_url)}
                                className="gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                View Resume
                              </Button>
                            )}
                            
                            {selectedJobId && (
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`status-${app.id}`} className="text-sm">Status:</Label>
                                <Select
                                  value={app.status}
                                  onValueChange={(newStatus) => updateApplicationStatus(app.id, newStatus, app.application_type, selectedJobId)}
                                  disabled={updatingApplicationId === app.id}
                                >
                                  <SelectTrigger id={`status-${app.id}`} className="w-32 h-9 transition-all duration-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background z-50">
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
