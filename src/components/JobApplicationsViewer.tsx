import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useRealtime } from '@/hooks/useRealtime';
import { format } from 'date-fns';
import { Mail, FileText, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';

interface JobApplication {
  id: string;
  job_id: string;
  user_id?: string;
  status: 'pending' | 'accepted' | 'rejected';
  cover_letter?: string;
  resume_url?: string;
  created_at: string;
  applicant_type: 'platform' | 'external';
  applicant_name?: string;
  applicant_email?: string;
  applicant_phone?: string;
  profiles?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  jobs: {
    title: string;
  };
}

export function JobApplicationsViewer() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const { toast } = useToast();

  const fetchApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's company
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!company) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // Get company's jobs first
      const { data: companyJobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('company_id', company.id);

      if (!companyJobs || companyJobs.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const jobIds = companyJobs.map(j => j.id);

      // Get platform applications
      const { data: platformApps, error: platformError } = await supabase
        .from('job_applications')
        .select(`
          *,
          profiles (
            full_name,
            email,
            avatar_url
          ),
          jobs (
            title
          )
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      if (platformError) throw platformError;

      // Get public applications
      const { data: publicApps, error: publicError } = await supabase
        .from('public_job_applications')
        .select(`
          *,
          jobs (
            title
          )
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      if (publicError) throw publicError;

      // Merge and format all applications
      const allApplications = [
        ...(platformApps || []).map((app: any) => ({
          ...app,
          applicant_type: 'platform' as const,
        })),
        ...(publicApps || []).map((app: any) => ({
          ...app,
          applicant_type: 'external' as const,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setApplications(allApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useRealtime({
    table: 'job_applications',
    onInsert: fetchApplications,
    onUpdate: fetchApplications,
  });

  useRealtime({
    table: 'public_job_applications',
    onInsert: fetchApplications,
    onUpdate: fetchApplications,
  });

  const updateApplicationStatus = async (
    applicationId: string,
    newStatus: 'accepted' | 'rejected',
    applicationType: 'platform' | 'external'
  ) => {
    try {
      const table = applicationType === 'platform' ? 'job_applications' : 'public_job_applications';
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Application ${newStatus}`,
      });

      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        variant: 'destructive',
      });
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const pendingCount = applications.filter((app) => app.status === 'pending').length;

  if (loading) {
    return <div className="text-center py-8">Loading applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Applications</h2>
          <p className="text-muted-foreground">
            Manage applications for your job postings
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({applications.filter((a) => a.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({applications.filter((a) => a.status === 'accepted').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({applications.filter((a) => a.status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4 mt-6">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No {filter !== 'all' && filter} applications yet
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={application.profiles?.avatar_url} />
                        <AvatarFallback>
                          {(application.profiles?.full_name || application.applicant_name)?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>
                            {application.profiles?.full_name || application.applicant_name}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {application.applicant_type === 'platform' ? 'Platform User' : 'External Applicant'}
                          </Badge>
                        </div>
                        <CardDescription>
                          Applied to: <strong>{application.jobs.title}</strong>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={
                        application.status === 'accepted'
                          ? 'default'
                          : application.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {application.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {application.status === 'accepted' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {application.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                      {application.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {application.profiles?.email || application.applicant_email}
                  </div>
                  {application.applicant_phone && (
                    <div className="text-sm text-muted-foreground">
                      Phone: {application.applicant_phone}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Applied on {format(new Date(application.created_at), 'MMM d, yyyy')}
                  </div>

                  {application.cover_letter && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4" />
                        Cover Letter
                      </div>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {application.cover_letter}
                      </p>
                    </div>
                  )}

                  {application.resume_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Resume
                      </a>
                    </Button>
                  )}

                  {application.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => updateApplicationStatus(application.id, 'accepted', application.applicant_type)}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(application.id, 'rejected', application.applicant_type)}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
