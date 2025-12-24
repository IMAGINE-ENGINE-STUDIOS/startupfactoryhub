import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { FileText, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import { useRealtime } from '@/hooks/useRealtime';

interface JobApplication {
  id: string;
  job_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;
  cover_letter?: string;
  resume_url?: string;
  status: string;
  created_at: string;
  applicationType: 'internal' | 'external';
  job: {
    title: string;
    is_task_based: boolean;
  };
}

export const JobApplicationsViewer = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  const fetchApplications = async () => {
    if (!user) return;

    try {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!company) {
        setLoading(false);
        return;
      }

      const { data: jobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('company_id', company.id);

      if (!jobs || jobs.length === 0) {
        setLoading(false);
        return;
      }

      const jobIds = jobs.map(j => j.id);

      const { data: internalApps } = await supabase
        .from('job_applications')
        .select(`
          id,
          job_id,
          user_id,
          status,
          cover_letter,
          resume_url,
          created_at,
          jobs!inner(title, is_task_based)
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      // For internal apps, get user profile data separately
      const formattedInternal = await Promise.all(
        (internalApps || []).map(async (app) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', app.user_id)
            .single();

          return {
            id: app.id,
            job_id: app.job_id,
            applicant_name: profile?.full_name || 'Unknown',
            applicant_email: profile?.email || '',
            applicant_phone: undefined,
            cover_letter: app.cover_letter,
            resume_url: app.resume_url,
            status: app.status,
            created_at: app.created_at,
            applicationType: 'internal' as const,
            job: {
              title: app.jobs.title,
              is_task_based: app.jobs.is_task_based
            }
          };
        })
      );

      const { data: externalApps } = await supabase
        .from('public_job_applications')
        .select(`
          id,
          job_id,
          applicant_name,
          applicant_email,
          applicant_phone,
          status,
          cover_letter,
          resume_url,
          created_at,
          jobs!inner(title, is_task_based)
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      const formattedExternal = (externalApps || []).map(app => ({
        id: app.id,
        job_id: app.job_id,
        applicant_name: app.applicant_name,
        applicant_email: app.applicant_email,
        applicant_phone: app.applicant_phone,
        cover_letter: app.cover_letter,
        resume_url: app.resume_url,
        status: app.status,
        created_at: app.created_at,
        applicationType: 'external' as const,
        job: {
          title: app.jobs.title,
          is_task_based: app.jobs.is_task_based
        }
      }));

      setApplications([...formattedInternal, ...formattedExternal]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

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

  const updateApplicationStatus = async (appId: string, status: 'accepted' | 'rejected', applicationType: 'internal' | 'external') => {
    try {
      const table = applicationType === 'internal' ? 'job_applications' : 'public_job_applications';
      
      const { error } = await supabase
        .from(table)
        .update({ status })
        .eq('id', appId);

      if (error) throw error;

      if (status === 'accepted' && applicationType === 'external') {
        const app = applications.find(a => a.id === appId);
        if (app?.job.is_task_based) {
          await createInvitation(appId, app.applicant_email);
        }
      }

      toast({
        title: "Success",
        description: `Application ${status}`,
      });

      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
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
        title: "Invitation Sent",
        description: "An invitation email has been sent to the applicant.",
      });
    } catch (error) {
      console.error('Error creating invitation:', error);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  if (loading) {
    return <div className="text-center py-8">Loading applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Job Applications</h2>
          <p className="text-muted-foreground">
            {applications.filter(a => a.status === 'pending').length} pending applications
          </p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({applications.filter(a => a.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({applications.filter(a => a.status === 'accepted').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({applications.filter(a => a.status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4 mt-6">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No applications found
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((app) => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {app.applicant_name}
                        <Badge variant={app.applicationType === 'internal' ? 'default' : 'secondary'}>
                          {app.applicationType}
                        </Badge>
                        {app.job.is_task_based && (
                          <Badge variant="outline">Task-Based</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>Applied for: {app.job.title}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        app.status === 'accepted' ? 'default' :
                        app.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                    >
                      {app.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <a href={`mailto:${app.applicant_email}`} className="hover:underline truncate">
                        {app.applicant_email}
                      </a>
                    </div>
                    {app.applicant_phone && (
                      <div className="flex items-center gap-2 text-sm min-w-0">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <a href={`tel:${app.applicant_phone}`} className="hover:underline truncate">
                          {app.applicant_phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {app.cover_letter && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Cover Letter</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words overflow-hidden">
                        {app.cover_letter}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {app.resume_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(app.resume_url, '_blank')}
                        className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Resume
                      </Button>
                    )}
                    
                    {app.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => updateApplicationStatus(app.id, 'accepted', app.applicationType)}
                          className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateApplicationStatus(app.id, 'rejected', app.applicationType)}
                          className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Applied {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
