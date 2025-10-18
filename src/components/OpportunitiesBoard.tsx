import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Briefcase, DollarSign, MapPin, Clock, Users, GraduationCap, Copy, Link as LinkIcon } from 'lucide-react';
import { JobApplicationsViewer } from './JobApplicationsViewer';
import { InternshipApplicationsViewer } from './InternshipApplicationsViewer';

type OpportunityType = 'job' | 'internship';

interface Opportunity {
  id: string;
  type: OpportunityType;
  company_id: string;
  title: string;
  description: string;
  location?: string;
  job_type?: string;
  duration?: string;
  compensation_type?: string;
  compensation_display: string;
  applications_count: number;
  companies: {
    name: string;
    logo_url?: string;
  };
}

export function OpportunitiesBoard() {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'jobs' | 'internships'>('all');
  const [isCreateJobDialogOpen, setIsCreateJobDialogOpen] = useState(false);
  const [isCreateInternshipDialogOpen, setIsCreateInternshipDialogOpen] = useState(false);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  useEffect(() => {
    fetchOpportunities();
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

  const fetchOpportunities = async () => {
    try {
      // Fetch jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*, companies(name, logo_url)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Fetch internships
      const { data: internshipsData } = await supabase
        .from('internships')
        .select('*, companies:company_id(name, logo_url)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Combine and format
      const formattedJobs: Opportunity[] = (jobsData || []).map(job => ({
        id: job.id,
        type: 'job' as OpportunityType,
        company_id: job.company_id,
        title: job.title,
        description: job.description,
        location: job.location,
        job_type: job.job_type,
        compensation_type: job.compensation_type,
        compensation_display: getJobCompensationDisplay(job),
        applications_count: job.applications_count || 0,
        companies: job.companies,
      }));

      const formattedInternships: Opportunity[] = (internshipsData || []).map(internship => ({
        id: internship.id,
        type: 'internship' as OpportunityType,
        company_id: internship.company_id,
        title: internship.title,
        description: internship.description,
        location: internship.location,
        duration: internship.duration,
        compensation_display: internship.compensation || 'Not specified',
        applications_count: internship.applications_count || 0,
        companies: internship.companies,
      }));

      setOpportunities([...formattedJobs, ...formattedInternships]);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const getJobCompensationDisplay = (job: any) => {
    if (job.compensation_type === 'unpaid') return 'Unpaid';
    if (job.compensation_type === 'hourly') return `$${job.hourly_rate}/hour`;
    if (job.compensation_type === 'salary') {
      return `$${job.salary_range_min?.toLocaleString()} - $${job.salary_range_max?.toLocaleString()}/year`;
    }
    return 'Not specified';
  };

  const copyApplicationLink = (opportunityId: string, type: OpportunityType) => {
    const path = type === 'job' ? '/jobs' : '/internships';
    const url = `${window.location.origin}${path}/${opportunityId}/apply`;
    navigator.clipboard.writeText(url);
    toast.success('Application link copied to clipboard!');
  };

  const handleApply = async (opportunityId: string, type: OpportunityType) => {
    if (!user) {
      toast.error('Please sign in to apply');
      return;
    }

    try {
      let error;
      
      if (type === 'job') {
        const result = await supabase.from('job_applications').insert({
          job_id: opportunityId,
          user_id: user.id,
          status: 'pending',
        });
        error = result.error;
      } else {
        const result = await supabase.from('internship_applications').insert({
          internship_id: opportunityId,
          user_id: user.id,
          status: 'pending',
        });
        error = result.error;
      }

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already applied to this opportunity');
        } else {
          throw error;
        }
      } else {
        toast.success('Application submitted successfully!');
        fetchOpportunities();
      }
    } catch (error) {
      console.error('Error applying:', error);
      toast.error('Failed to submit application');
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
      setIsCreateJobDialogOpen(false);
      fetchOpportunities();
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to post job');
    }
  };

  const handleCreateInternship = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userCompanyId) {
      toast.error('You need to create a company profile first');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const requirementsText = formData.get('requirements') as string;

    const internshipData = {
      company_id: userCompanyId,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      location: (formData.get('location') as string) || null,
      duration: (formData.get('duration') as string) || null,
      compensation: (formData.get('compensation') as string) || null,
      requirements: requirementsText.split(',').map(r => r.trim()).filter(r => r),
      status: 'active' as const,
    };

    try {
      const { error } = await supabase.from('internships').insert([internshipData]);
      if (error) throw error;
      toast.success('Internship posted successfully!');
      setIsCreateInternshipDialogOpen(false);
      fetchOpportunities();
    } catch (error) {
      console.error('Error creating internship:', error);
      toast.error('Failed to post internship');
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    if (filter === 'all') return true;
    if (filter === 'jobs') return opp.type === 'job';
    if (filter === 'internships') return opp.type === 'internship';
    return true;
  });

  if (loading) return <div className="text-center p-8">Loading opportunities...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Career Opportunities</h2>
          <p className="text-muted-foreground">
            {userCompanyId ? 'Manage your job postings and applications' : 'Explore jobs and internships'}
          </p>
        </div>
        {userCompanyId && (
          <div className="flex gap-2">
            <Dialog open={isCreateJobDialogOpen} onOpenChange={setIsCreateJobDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Briefcase className="h-4 w-4 mr-2" />
                  Post Job
                </Button>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salary_min">Min Salary ($)</Label>
                      <Input id="salary_min" name="salary_min" type="number" step="1000" />
                    </div>
                    <div>
                      <Label htmlFor="salary_max">Max Salary ($)</Label>
                      <Input id="salary_max" name="salary_max" type="number" step="1000" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Post Job</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateInternshipDialogOpen} onOpenChange={setIsCreateInternshipDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Post Internship
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Post a New Internship</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateInternship} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Position Title *</Label>
                    <Input id="title" name="title" required placeholder="e.g., Software Development Intern" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea id="description" name="description" required rows={4} placeholder="Describe the internship role..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" placeholder="Remote, NYC, etc." />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration *</Label>
                      <Select name="duration" defaultValue="3 months">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3 months">3 months</SelectItem>
                          <SelectItem value="6 months">6 months</SelectItem>
                          <SelectItem value="12 months">12 months</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="compensation">Compensation</Label>
                    <Select name="compensation" defaultValue="$1,000/month">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                        <SelectItem value="$500/month">$500/month</SelectItem>
                        <SelectItem value="$1,000/month">$1,000/month</SelectItem>
                        <SelectItem value="$2,000/month">$2,000/month</SelectItem>
                        <SelectItem value="negotiable">Negotiable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="requirements">Requirements</Label>
                    <Textarea id="requirements" name="requirements" placeholder="Comma-separated requirements..." />
                  </div>
                  <Button type="submit" className="w-full">Post Internship</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {userCompanyId ? (
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse All</TabsTrigger>
            <TabsTrigger value="job_apps">Job Applications</TabsTrigger>
            <TabsTrigger value="internship_apps">Internship Applications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                All ({opportunities.length})
              </Button>
              <Button
                variant={filter === 'jobs' ? 'default' : 'outline'}
                onClick={() => setFilter('jobs')}
                size="sm"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Jobs ({opportunities.filter(o => o.type === 'job').length})
              </Button>
              <Button
                variant={filter === 'internships' ? 'default' : 'outline'}
                onClick={() => setFilter('internships')}
                size="sm"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Internships ({opportunities.filter(o => o.type === 'internship').length})
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredOpportunities.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No opportunities posted yet
                  </CardContent>
                </Card>
              ) : (
                filteredOpportunities.map((opp) => (
                  <Card key={`${opp.type}-${opp.id}`} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                          {opp.companies.logo_url && (
                            <img
                              src={opp.companies.logo_url}
                              alt={opp.companies.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className="text-xl">{opp.title}</CardTitle>
                              <Badge variant="secondary">
                                {opp.type === 'job' ? <Briefcase className="h-3 w-3 mr-1" /> : <GraduationCap className="h-3 w-3 mr-1" />}
                                {opp.type === 'job' ? 'Job' : 'Internship'}
                              </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-2">
                              <span>{opp.companies.name}</span>
                              {opp.location && (
                                <>
                                  <span>•</span>
                                  <MapPin className="h-3 w-3" />
                                  <span>{opp.location}</span>
                                </>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyApplicationLink(opp.id, opp.type)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => handleApply(opp.id, opp.type)}>
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">{opp.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {opp.job_type && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {opp.job_type}
                          </Badge>
                        )}
                        {opp.duration && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {opp.duration}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {opp.compensation_display}
                        </Badge>
                        {opp.applications_count > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {opp.applications_count} applicants
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="job_apps">
            <JobApplicationsViewer />
          </TabsContent>

          <TabsContent value="internship_apps">
            <InternshipApplicationsViewer />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All ({opportunities.length})
            </Button>
            <Button
              variant={filter === 'jobs' ? 'default' : 'outline'}
              onClick={() => setFilter('jobs')}
              size="sm"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Jobs ({opportunities.filter(o => o.type === 'job').length})
            </Button>
            <Button
              variant={filter === 'internships' ? 'default' : 'outline'}
              onClick={() => setFilter('internships')}
              size="sm"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Internships ({opportunities.filter(o => o.type === 'internship').length})
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredOpportunities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No opportunities available yet
                </CardContent>
              </Card>
            ) : (
              filteredOpportunities.map((opp) => (
                <Card key={`${opp.type}-${opp.id}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        {opp.companies.logo_url && (
                          <img
                            src={opp.companies.logo_url}
                            alt={opp.companies.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-xl">{opp.title}</CardTitle>
                            <Badge variant="secondary">
                              {opp.type === 'job' ? <Briefcase className="h-3 w-3 mr-1" /> : <GraduationCap className="h-3 w-3 mr-1" />}
                              {opp.type === 'job' ? 'Job' : 'Internship'}
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center gap-2">
                            <span>{opp.companies.name}</span>
                            {opp.location && (
                              <>
                                <span>•</span>
                                <MapPin className="h-3 w-3" />
                                <span>{opp.location}</span>
                              </>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      <Button onClick={() => handleApply(opp.id, opp.type)}>Apply Now</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{opp.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {opp.job_type && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {opp.job_type}
                        </Badge>
                      )}
                      {opp.duration && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {opp.duration}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {opp.compensation_display}
                      </Badge>
                      {opp.applications_count > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {opp.applications_count} applicants
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
