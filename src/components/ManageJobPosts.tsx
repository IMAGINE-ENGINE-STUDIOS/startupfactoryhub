import { useState, useEffect, useMemo } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Briefcase, MapPin, DollarSign, Clock, ExternalLink, CheckCircle, Users, FileText, Mail, Phone, Eye, Copy, MoreVertical, XCircle, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  experience_level: string | null;
  requirements: string[] | null;
  responsibilities: string[] | null;
  benefits: string[] | null;
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

export default function ManageJobPosts() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [closedJobs, setClosedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [showApplicationsDialog, setShowApplicationsDialog] = useState(false);
  const [updatingApplicationId, setUpdatingApplicationId] = useState<string | null>(null);
  const [closeJobId, setCloseJobId] = useState<string | null>(null);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);

  // Check if user can post jobs
  const canPostJobs = role === 'startup' || role === 'accelerator' || role === 'investor';

  // Get user's own posted jobs (active only)
  const myPostedJobs = useMemo(() => {
    if (!userCompanyId) return [];
    return jobs.filter(job => job.companies?.id === userCompanyId);
  }, [jobs, userCompanyId]);

  // Fetch jobs
  useEffect(() => {
    fetchJobs();
  }, []);

  // Fetch user-specific data only when logged in
  useEffect(() => {
    if (user) {
      fetchUserCompany();
      fetchClosedJobs();
    }
  }, [user]);

  // Realtime subscriptions for applications
  useRealtime({
    table: 'job_applications',
    onInsert: () => {
      fetchJobs();
      if (selectedJobId) handleViewApplications(selectedJobId);
    },
    onUpdate: () => {
      if (selectedJobId) handleViewApplications(selectedJobId);
    },
  });

  useRealtime({
    table: 'public_job_applications',
    onInsert: () => {
      fetchJobs();
      if (selectedJobId) handleViewApplications(selectedJobId);
    },
    onUpdate: () => {
      if (selectedJobId) handleViewApplications(selectedJobId);
    },
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCompany = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
      
    if (data) {
      setUserCompanyId(data.id);
    }
  };

  const fetchClosedJobs = async () => {
    if (!user) return;
    
    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!companyData) return;

      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            id,
            name,
            logo_url
          )
        `)
        .eq('company_id', companyData.id)
        .eq('status', 'closed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClosedJobs(data || []);
    } catch (error) {
      console.error('Error fetching closed jobs:', error);
    }
  };

  const handleViewApplications = async (jobId: string) => {
    setSelectedJobId(jobId);
    setLoadingApplications(true);
    setShowApplicationsDialog(true);
    
    try {
      // Fetch internal applications
      const { data: internalData, error: internalError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (internalError) throw internalError;
      
      // Fetch external applications
      const { data: externalData, error: externalError } = await supabase
        .from('public_job_applications')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (externalError) throw externalError;
      
      // Fetch profiles for internal applications
      const userIds = (internalData || []).filter(a => a.user_id).map(a => a.user_id!);
      let profilesMap: Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, email')
          .in('user_id', userIds);
        
        profiles?.forEach(p => {
          profilesMap[p.user_id] = { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url };
        });
      }
      
      // Format internal applications
      const internalApps: JobApplication[] = (internalData || []).map(app => ({
        id: app.id,
        status: app.status,
        created_at: app.created_at,
        applicant_name: null,
        applicant_email: null,
        applicant_phone: null,
        cover_letter: app.cover_letter,
        resume_url: app.resume_url,
        user_id: app.user_id,
        application_type: 'internal' as const,
        profiles: app.user_id ? profilesMap[app.user_id] || null : null,
      }));
      
      // Format external applications
      const externalApps: JobApplication[] = (externalData || []).map(app => ({
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
      
      // Merge and sort by created_at
      const allApps = [...internalApps, ...externalApps].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setApplications(allApps);
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

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    setUpdatingApplicationId(applicationId);
    
    // Find the application to determine its type
    const app = applications.find(a => a.id === applicationId);
    if (!app) {
      setUpdatingApplicationId(null);
      return;
    }
    
    const table = app.application_type === 'internal' ? 'job_applications' : 'public_job_applications';
    
    try {
      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      // If accepting an external application for a task-based job, create invitation
      if (status === 'accepted' && app.application_type === 'external' && app.applicant_email) {
        const job = jobs.find(j => j.id === selectedJobId) || closedJobs.find(j => j.id === selectedJobId);
        if (job?.is_task_based) {
          await createInvitation(applicationId, app.applicant_email);
        }
      }

      setApplications(prev => 
        prev.map(a => a.id === applicationId ? { ...a, status } : a)
      );

      toast({
        title: 'Status Updated',
        description: `Application marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingApplicationId(null);
    }
  };

  const createInvitation = async (applicationId: string, email: string) => {
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      const { error } = await supabase
        .from('application_invitations')
        .insert({
          application_id: applicationId,
          applicant_email: email,
          invitation_token: token,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      await supabase.functions.invoke('send-application-invitation', {
        body: { email, token, applicationId }
      });

      toast({
        title: 'Invitation Sent',
        description: 'An invitation email has been sent to the applicant.',
      });
    } catch (error) {
      console.error('Error creating invitation:', error);
    }
  };

  const handleCloseJob = async (jobId: string) => {
    setCloseJobId(jobId);
  };

  const confirmCloseJob = async () => {
    if (!closeJobId) return;
    
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', closeJobId);

      if (error) throw error;

      toast({
        title: 'Job Closed',
        description: 'The job posting has been closed',
      });
      
      fetchJobs();
      fetchClosedJobs();
    } catch (error) {
      console.error('Error closing job:', error);
      toast({
        title: 'Error',
        description: 'Failed to close job posting',
        variant: 'destructive',
      });
    } finally {
      setCloseJobId(null);
    }
  };

  const handleReopenJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'active' })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Job Reopened',
        description: 'The job posting is now active',
      });
      
      fetchJobs();
      fetchClosedJobs();
    } catch (error) {
      console.error('Error reopening job:', error);
      toast({
        title: 'Error',
        description: 'Failed to reopen job posting',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Job Deleted',
        description: 'The job posting has been permanently deleted',
      });
      
      fetchJobs();
      fetchClosedJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job posting',
        variant: 'destructive',
      });
    }
  };

  const handleCopyPublicLink = (jobId: string) => {
    const url = `${window.location.origin}/apply/job/${jobId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied',
      description: 'Public application link copied to clipboard',
    });
  };

  const handlePostJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userCompanyId) {
      toast({
        title: 'Error',
        description: 'You need a company profile to post jobs',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    
    const requirementsText = formData.get('requirements') as string;
    const responsibilitiesText = formData.get('responsibilities') as string;
    const benefitsText = formData.get('benefits') as string;
    
    const requirements = requirementsText ? requirementsText.split('\n').filter(r => r.trim()) : null;
    const responsibilities = responsibilitiesText ? responsibilitiesText.split('\n').filter(r => r.trim()) : null;
    const benefits = benefitsText ? benefitsText.split('\n').filter(b => b.trim()) : null;
    
    const newJob = {
      company_id: userCompanyId,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string || null,
      category: formData.get('category') as 'full-time' | 'part-time' | 'contract' | 'internship',
      job_type: formData.get('job_type') as string || null,
      experience_level: formData.get('experience_level') as string || null,
      requirements,
      responsibilities,
      benefits,
      compensation_type: formData.get('compensation_type') as string || 'salary',
      hourly_rate: formData.get('hourly_rate') ? parseFloat(formData.get('hourly_rate') as string) : null,
      salary_range_min: formData.get('salary_min') ? parseFloat(formData.get('salary_min') as string) : null,
      salary_range_max: formData.get('salary_max') ? parseFloat(formData.get('salary_max') as string) : null,
      is_task_based: formData.get('is_task_based') === 'true',
      external_application_url: formData.get('external_url') as string || null,
      status: 'active' as const,
    };

    try {
      const { error } = await supabase.from('jobs').insert([newJob]);
      if (error) throw error;
      
      toast({
        title: 'Job Posted',
        description: 'Your job has been posted successfully',
      });
      
      setShowPostDialog(false);
      fetchJobs();
    } catch (error) {
      console.error('Error posting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to post job',
        variant: 'destructive',
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'full-time': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'part-time': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'contract': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'internship': 'bg-green-500/10 text-green-500 border-green-500/20',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  const getCompensationDisplay = (job: Job) => {
    if (job.compensation_type === 'hourly' && job.hourly_rate) {
      return `$${job.hourly_rate}/hr`;
    } else if (job.salary_range_min && job.salary_range_max) {
      return `$${(job.salary_range_min / 1000).toFixed(0)}k - $${(job.salary_range_max / 1000).toFixed(0)}k`;
    } else if (job.salary_range_min) {
      return `From $${(job.salary_range_min / 1000).toFixed(0)}k`;
    }
    return 'Competitive';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'reviewing': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'shortlisted': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'hired': 'bg-green-500/10 text-green-500 border-green-500/20',
      'rejected': 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!canPostJobs || !userCompanyId) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="py-12 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Company Profile Required</h3>
          <p className="text-sm text-muted-foreground">
            You need a company profile to manage job postings
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <Card className="tech-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{myPostedJobs.length}</p>
                <p className="text-xs text-muted-foreground">Active Jobs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">{closedJobs.length}</p>
                <p className="text-xs text-muted-foreground">Closed Jobs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {myPostedJobs.reduce((sum, job) => sum + (job.applications_count || 0), 0) + 
                   closedJobs.reduce((sum, job) => sum + (job.applications_count || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Applications</p>
              </div>
            </div>
            <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Post New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Post a New Job</DialogTitle>
                  <DialogDescription>
                    Create a new job listing for your company
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePostJob} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input id="title" name="title" placeholder="e.g., Senior Frontend Developer" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea id="description" name="description" rows={4} required placeholder="Describe the role, responsibilities, and what you're looking for..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" placeholder="e.g., Remote, NYC" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select name="category" required defaultValue="full-time">
                        <SelectTrigger>
                          <SelectValue />
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="job_type">Job Type</Label>
                      <Select name="job_type" defaultValue="remote">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="onsite">On-site</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience_level">Experience Level</Label>
                      <Select name="experience_level" defaultValue="mid">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior Level</SelectItem>
                          <SelectItem value="lead">Lead/Manager</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="compensation_type">Compensation Type</Label>
                      <Select name="compensation_type" defaultValue="salary">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salary">Salary</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="equity">Equity Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="is_task_based">Task-Based Work</Label>
                      <Select name="is_task_based" defaultValue="false">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">No</SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                      <Input id="hourly_rate" name="hourly_rate" type="number" min="0" placeholder="50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary_min">Min Salary ($)</Label>
                      <Input id="salary_min" name="salary_min" type="number" min="0" placeholder="80000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary_max">Max Salary ($)</Label>
                      <Input id="salary_max" name="salary_max" type="number" min="0" placeholder="120000" />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements</Label>
                    <Textarea 
                      id="requirements" 
                      name="requirements" 
                      rows={4} 
                      placeholder="Enter each requirement on a new line:&#10;• 3+ years of React experience&#10;• Strong TypeScript skills&#10;• Experience with REST APIs" 
                    />
                    <p className="text-xs text-muted-foreground">Enter each requirement on a new line</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsibilities">Responsibilities</Label>
                    <Textarea 
                      id="responsibilities" 
                      name="responsibilities" 
                      rows={4} 
                      placeholder="Enter each responsibility on a new line:&#10;• Lead frontend development&#10;• Mentor junior developers&#10;• Participate in code reviews" 
                    />
                    <p className="text-xs text-muted-foreground">Enter each responsibility on a new line</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="benefits">Benefits</Label>
                    <Textarea 
                      id="benefits" 
                      name="benefits" 
                      rows={4} 
                      placeholder="Enter each benefit on a new line:&#10;• Health, dental, vision insurance&#10;• 401k with company matching&#10;• Flexible work schedule" 
                    />
                    <p className="text-xs text-muted-foreground">Enter each benefit on a new line</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="external_url">External Application URL (optional)</Label>
                    <Input 
                      id="external_url" 
                      name="external_url" 
                      type="url" 
                      placeholder="https://company.com/apply" 
                    />
                    <p className="text-xs text-muted-foreground">If set, applicants will be redirected to this URL</p>
                  </div>

                  <Button type="submit" className="w-full">Post Job</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Active Posted Jobs */}
      {myPostedJobs.length === 0 && closedJobs.length === 0 ? (
        <Card className="tech-card border-0">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No job postings yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first job posting to start receiving applications
            </p>
            <Button onClick={() => setShowPostDialog(true)} className="gap-2">
              <Briefcase className="h-4 w-4" />
              Post Your First Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Jobs */}
          {myPostedJobs.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Active Job Postings ({myPostedJobs.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {myPostedJobs.map((job) => (
                  <Card key={job.id} className="tech-card border-0">
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        {job.companies?.logo_url && (
                          <img 
                            src={job.companies.logo_url} 
                            alt={job.companies.name} 
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base break-words line-clamp-1">{job.title}</CardTitle>
                              <CardDescription className="text-sm">{job.location || 'No location'}</CardDescription>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge className={getCategoryColor(job.category)}>
                                {job.category}
                              </Badge>
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                      
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          <span>{getCompensationDisplay(job)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {job.applications_count} applications
                        </div>
                        {job.is_task_based && (
                          <Badge variant="outline" className="gap-1 text-xs h-5">
                            <CheckCircle className="w-3 h-3" />
                            Task-Based
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleViewApplications(job.id)}
                          className="gap-1 flex-1"
                        >
                          <Users className="w-3 h-3" />
                          View Applications ({job.applications_count})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyPublicLink(job.id)}
                          className="gap-1"
                          title="Copy public application link"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="px-2">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedJobForDetails(job)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCloseJob(job.id)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Close Job Posting
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteJob(job.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Closed Jobs */}
          {closedJobs.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-muted-foreground">
                <XCircle className="h-5 w-5" />
                Closed Job Postings ({closedJobs.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {closedJobs.map((job) => (
                  <Card key={job.id} className="tech-card border-0 opacity-70 hover:opacity-100 transition-opacity">
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        {job.companies?.logo_url && (
                          <img 
                            src={job.companies.logo_url} 
                            alt={job.companies.name} 
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base break-words line-clamp-1">{job.title}</CardTitle>
                              <CardDescription className="text-sm">{job.location || 'No location'}</CardDescription>
                            </div>
                            <Badge variant="destructive">CLOSED</Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                      
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {job.applications_count} applications received
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleReopenJob(job.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          Reopen Job
                        </Button>
                        <Button
                          onClick={() => handleViewApplications(job.id)}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Apps
                        </Button>
                        <Button
                          onClick={() => handleDeleteJob(job.id)}
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Applications Dialog */}
      <Dialog open={showApplicationsDialog} onOpenChange={setShowApplicationsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Job Applications</DialogTitle>
            <DialogDescription>
              Review and manage applications for this position
            </DialogDescription>
          </DialogHeader>
          {loadingApplications ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No applications yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4 pr-4">
                {applications.map((app) => (
                  <Card key={app.id} className="tech-card border-0">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {app.profiles?.full_name || app.applicant_name || 'Unknown'}
                            </h4>
                            <Badge className={getStatusColor(app.status)}>
                              {app.status}
                            </Badge>
                            {app.application_type === 'external' && (
                              <Badge variant="outline" className="gap-1">
                                <ExternalLink className="w-3 h-3" />
                                External
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {(app.profiles?.email || app.applicant_email) && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {app.profiles?.email || app.applicant_email}
                              </div>
                            )}
                            {app.applicant_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {app.applicant_phone}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(app.created_at).toLocaleDateString()}
                            </div>
                          </div>

                          {app.cover_letter && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Cover Letter:</p>
                              <p className="text-sm line-clamp-3">{app.cover_letter}</p>
                            </div>
                          )}

                          {app.resume_url && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto gap-1"
                              onClick={() => window.open(app.resume_url!, '_blank')}
                            >
                              <FileText className="w-3 h-3" />
                              View Resume
                            </Button>
                          )}
                        </div>

                        <Select
                          value={app.status}
                          onValueChange={(value) => handleUpdateApplicationStatus(app.id, value)}
                          disabled={updatingApplicationId === app.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reviewing">Reviewing</SelectItem>
                            <SelectItem value="shortlisted">Shortlisted</SelectItem>
                            <SelectItem value="hired">Hired</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Job Details Dialog */}
      <Dialog open={!!selectedJobForDetails} onOpenChange={() => setSelectedJobForDetails(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedJobForDetails && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  {selectedJobForDetails.companies?.logo_url && (
                    <img 
                      src={selectedJobForDetails.companies.logo_url} 
                      alt={selectedJobForDetails.companies.name} 
                      className="w-14 h-14 rounded object-cover"
                    />
                  )}
                  <div>
                    <DialogTitle className="text-xl">{selectedJobForDetails.title}</DialogTitle>
                    <DialogDescription className="text-base">
                      {selectedJobForDetails.companies?.name}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getCategoryColor(selectedJobForDetails.category)}>
                    {selectedJobForDetails.category}
                  </Badge>
                  {selectedJobForDetails.location && (
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedJobForDetails.location}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <DollarSign className="w-3 h-3" />
                    {getCompensationDisplay(selectedJobForDetails)}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedJobForDetails.description}
                  </p>
                </div>

                {selectedJobForDetails.requirements && selectedJobForDetails.requirements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Requirements</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {selectedJobForDetails.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedJobForDetails.responsibilities && selectedJobForDetails.responsibilities.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Responsibilities</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {selectedJobForDetails.responsibilities.map((resp, i) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedJobForDetails.benefits && selectedJobForDetails.benefits.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Benefits</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {selectedJobForDetails.benefits.map((benefit, i) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Close Job Confirmation */}
      <AlertDialog open={!!closeJobId} onOpenChange={() => setCloseJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Job Posting?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the job as closed and it will no longer accept new applications. You can reopen it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCloseJob}>Close Job</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
