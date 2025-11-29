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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Briefcase, MapPin, DollarSign, Clock, ExternalLink, CheckCircle, Users, FileText, Mail, Phone, Eye, Copy, MoreVertical, XCircle, Search, ChevronDown, ChevronUp, GraduationCap, Target, Gift, ClipboardList } from 'lucide-react';
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
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [closedJobs, setClosedJobs] = useState<Job[]>([]);
  const [closeJobId, setCloseJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(6);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  // Filter and deduplicate jobs
  const filteredJobs = useMemo(() => {
    // Deduplicate by ID
    const uniqueJobs = Array.from(
      new Map(jobs.map(job => [job.id, job])).values()
    );
    
    // Filter by search query
    if (!searchQuery.trim()) return uniqueJobs;
    
    const query = searchQuery.toLowerCase();
    return uniqueJobs.filter(job =>
      job.title.toLowerCase().includes(query) ||
      job.companies?.name?.toLowerCase().includes(query) ||
      job.description?.toLowerCase().includes(query) ||
      job.location?.toLowerCase().includes(query)
    );
  }, [jobs, searchQuery]);

  const displayedJobs = filteredJobs.slice(0, displayCount);
  const hasMoreJobs = displayCount < filteredJobs.length;

  const toggleExpand = (jobId: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (user) {
      fetchUserCompany();
      fetchJobs();
      fetchAppliedJobs();
    }
  }, [user, categoryFilter]);

  useEffect(() => {
    if (userCompanyId) {
      fetchClosedJobs();
    }
  }, [userCompanyId]);

  const fetchAppliedJobs = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('job_applications')
      .select('job_id')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setAppliedJobs(new Set(data.map(app => app.job_id)));
    }
  };

  const fetchClosedJobs = async () => {
    if (!userCompanyId) return;

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
        .eq('status', 'closed')
        .eq('company_id', userCompanyId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setClosedJobs(data || []);
    } catch (error) {
      console.error('Error fetching closed jobs:', error);
    }
  };

  const handleCloseJob = (jobId: string) => {
    setCloseJobId(jobId);
  };

  const confirmCloseJob = async () => {
    if (!closeJobId) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', closeJobId)
        .eq('company_id', userCompanyId);

      if (error) throw error;

      toast({
        title: 'Job closed',
        description: 'The job posting is no longer active',
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
        .eq('id', jobId)
        .eq('company_id', userCompanyId);

      if (error) throw error;

      toast({
        title: 'Job reopened',
        description: 'The job posting is now active again',
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
    
    // Parse array fields from textareas (each line becomes an item)
    const requirementsText = formData.get('requirements') as string;
    const responsibilitiesText = formData.get('responsibilities') as string;
    const benefitsText = formData.get('benefits') as string;
    
    const requirements = requirementsText?.trim() 
      ? requirementsText.split('\n').map(r => r.trim()).filter(Boolean) 
      : null;
    const responsibilities = responsibilitiesText?.trim() 
      ? responsibilitiesText.split('\n').map(r => r.trim()).filter(Boolean) 
      : null;
    const benefits = benefitsText?.trim() 
      ? benefitsText.split('\n').map(b => b.trim()).filter(Boolean) 
      : null;
    
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
          experience_level: formData.get('experience_level') as string || null,
          requirements,
          responsibilities,
          benefits,
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

      // Add to applied jobs set immediately (optimistic update)
      setAppliedJobs(prev => new Set([...prev, jobId]));

      // Update the applications count optimistically
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, applications_count: (job.applications_count || 0) + 1 }
          : job
      ));

      toast({
        title: 'Success!',
        description: 'Application submitted successfully. The company will review your application.',
      });
    } catch (error) {
      console.error('Error applying:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    }
  };

  const handleCopyPublicLink = (jobId: string) => {
    const publicLink = `${window.location.origin}/jobs/${jobId}/apply`;
    navigator.clipboard.writeText(publicLink);
    toast({
      title: "Public link copied!",
      description: "Anyone can use this link to apply to your job",
    });
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
      fetchAppliedJobs();
    },
    onUpdate: () => {
      if (selectedJobId) fetchApplicationsForJob(selectedJobId);
      fetchJobs();
      fetchAppliedJobs();
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
  const canApply = role === 'student' || role === 'advisor' || role === 'mentor';

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
                      <Textarea id="description" name="description" rows={4} required placeholder="Describe the role and what the candidate will be doing..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" name="location" placeholder="e.g., Remote, New York, NY" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="job_type">Work Type</Label>
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
                        <Label htmlFor="experience_level">Experience Level</Label>
                        <Select name="experience_level">
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entry-level">Entry-Level</SelectItem>
                            <SelectItem value="junior">Junior</SelectItem>
                            <SelectItem value="mid-level">Mid-Level</SelectItem>
                            <SelectItem value="senior">Senior</SelectItem>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="executive">Executive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (for internships/contracts)</Label>
                        <Input id="duration" name="duration" placeholder="e.g., 3 months" />
                      </div>
                    </div>

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
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary_min">Min Salary/Rate</Label>
                        <Input id="salary_min" name="salary_min" type="number" placeholder="50000" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salary_max">Max Salary/Rate</Label>
                        <Input id="salary_max" name="salary_max" type="number" placeholder="80000" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="is_task_based">Task Management</Label>
                        <Select name="is_task_based" defaultValue="false">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">No</SelectItem>
                            <SelectItem value="true">Yes (assign tasks)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="requirements">Requirements</Label>
                      <Textarea 
                        id="requirements" 
                        name="requirements" 
                        rows={4} 
                        placeholder="Enter each requirement on a new line:&#10;• Bachelor's degree in CS or related field&#10;• 3+ years of React experience&#10;• Strong communication skills" 
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
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs by title, company, location, or description..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setDisplayCount(6); // Reset pagination on search
          }}
          className="pl-10"
        />
      </div>

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

      {/* Results count */}
      {filteredJobs.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {displayedJobs.length} of {filteredJobs.length} jobs
        </p>
      )}

      {/* Jobs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayedJobs.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                {searchQuery ? 'No jobs match your search' : 'No jobs found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          displayedJobs.map((job) => {
            const isExpanded = expandedJobs.has(job.id);
            return (
            <Card key={job.id} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3 sm:gap-4">
                  {job.companies?.logo_url && (
                    <img 
                      src={job.companies.logo_url} 
                      alt={job.companies.name} 
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg break-words">{job.title}</CardTitle>
                        <CardDescription className="text-sm truncate">{job.companies?.name}</CardDescription>
                      </div>
                      <Badge className={getCategoryColor(job.category)}>
                        {job.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
                {/* Description - expandable */}
                <div>
                  <p className={`text-sm text-muted-foreground break-words ${isExpanded ? '' : 'line-clamp-3'}`}>
                    {job.description}
                  </p>
                </div>
                
                {/* Expanded details */}
                {isExpanded && (
                  <div className="space-y-4 border-t pt-4">
                    {/* Job Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {job.job_type && (
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <span><span className="font-medium">Work Type:</span> {job.job_type}</span>
                        </div>
                      )}
                      {job.experience_level && (
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="w-4 h-4 text-muted-foreground" />
                          <span><span className="font-medium">Level:</span> {job.experience_level}</span>
                        </div>
                      )}
                      {job.duration && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span><span className="font-medium">Duration:</span> {job.duration}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span><span className="font-medium">Pay:</span> {getCompensationDisplay(job)}</span>
                      </div>
                    </div>
                    
                    {/* Requirements */}
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ClipboardList className="w-4 h-4 text-primary" />
                          Requirements
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                          {job.requirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Responsibilities */}
                    {job.responsibilities && job.responsibilities.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Target className="w-4 h-4 text-primary" />
                          Responsibilities
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                          {job.responsibilities.map((resp, idx) => (
                            <li key={idx}>{resp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Benefits */}
                    {job.benefits && job.benefits.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Gift className="w-4 h-4 text-primary" />
                          Benefits
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                          {job.benefits.map((benefit, idx) => (
                            <li key={idx}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {job.is_task_based && (
                      <div className="text-sm text-primary bg-primary/10 p-2 rounded-md">
                        ✓ This is a task-based position where you'll be assigned specific tasks to complete.
                      </div>
                    )}
                  </div>
                )}
                
                {/* Quick info when collapsed */}
                {!isExpanded && (
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{job.location}</span>
                      </div>
                    )}
                    {job.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{job.duration}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{getCompensationDisplay(job)}</span>
                    </div>
                  </div>
                )}

                {/* Expand/Collapse button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(job.id)}
                  className="w-full justify-center gap-1 text-xs h-8"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show More Details
                    </>
                  )}
                </Button>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 mt-auto">
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground w-full sm:w-auto">
                    {job.is_task_based && (
                      <Badge variant="outline" className="gap-1 text-xs">
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
                          className="gap-1 text-xs sm:text-sm h-8 sm:h-9"
                        >
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">View Applications</span>
                          <span className="sm:hidden">Apps</span> ({job.applications_count})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPublicLink(job.id);
                          }}
                          className="gap-1 text-xs sm:text-sm h-8 sm:h-9"
                          title="Copy public application link - anyone can apply via this link"
                        >
                          <Copy className="w-3 h-3" />
                          <span className="hidden sm:inline">Copy Public Link</span>
                          <span className="sm:hidden">Copy Link</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCloseJob(job.id)}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Close Job Posting
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                    {!isCompanyUser && (
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        {job.applications_count} applicants
                      </div>
                    )}
                  </div>
                  
                  {canApply && (
                    appliedJobs.has(job.id) ? (
                      <Button
                        disabled
                        variant="secondary"
                        size="sm"
                        className="w-full sm:w-auto h-9 text-sm"
                      >
                        <CheckCircle className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Applied
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleApply(job.id, job.external_application_url)}
                        variant={job.external_application_url ? 'outline' : 'default'}
                        size="sm"
                        className="w-full sm:w-auto h-9 text-sm"
                      >
                        {job.external_application_url ? (
                          <>
                            <span className="hidden sm:inline">Apply Externally</span>
                            <span className="sm:hidden">Apply</span>
                            <ExternalLink className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                          </>
                        ) : (
                          'Apply Now'
                        )}
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )})
        )}
      </div>

      {/* Load More Button */}
      {hasMoreJobs && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setDisplayCount(prev => prev + 6)}
            className="gap-2"
          >
            Load More Jobs ({filteredJobs.length - displayCount} remaining)
          </Button>
        </div>
      )}

      {/* Closed Jobs Section (Company Owners Only) */}
      {isCompanyUser && closedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Closed Job Postings</CardTitle>
            </div>
            <CardDescription>Previously closed positions that can be reopened</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {closedJobs.map((job) => (
                <Card key={job.id} className="opacity-60 hover:opacity-100 transition-opacity">
                  <CardHeader>
                    <div className="flex items-start gap-3 sm:gap-4">
                      {job.companies?.logo_url && (
                        <img 
                          src={job.companies.logo_url} 
                          alt={job.companies.name} 
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg break-words">{job.title}</CardTitle>
                            <CardDescription className="text-sm truncate">{job.companies?.name}</CardDescription>
                          </div>
                          <Badge variant="destructive">CLOSED</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{job.location}</span>
                        </div>
                      )}
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
                        Reopen Job Posting
                      </Button>
                      <Button
                        onClick={() => handleViewApplications(job.id)}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View Apps
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Close Job Confirmation Dialog */}
      <AlertDialog open={closeJobId !== null} onOpenChange={(open) => !open && setCloseJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Job Posting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to close this job posting? It will no longer be visible to applicants. You can reopen it later from the Closed Jobs section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCloseJob}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Close Job Posting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
