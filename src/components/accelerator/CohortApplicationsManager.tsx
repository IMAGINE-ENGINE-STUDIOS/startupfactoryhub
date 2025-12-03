import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  FileText, 
  Video, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  ExternalLink,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface Application {
  id: string;
  cohort_id: string;
  startup_id: string;
  applicant_user_id: string;
  status: string;
  pitch_deck_url: string | null;
  video_pitch_url: string | null;
  application_answers: any;
  reviewer_notes: string | null;
  interview_date: string | null;
  applied_at: string;
  startup?: {
    id: string;
    name: string;
    description: string | null;
    industry: string | null;
    stage: string | null;
    logo_url: string | null;
  };
}

interface PublicApplication {
  id: string;
  cohort_id: string;
  startup_name: string;
  founder_name: string;
  email: string;
  phone: string | null;
  industry: string | null;
  stage: string | null;
  website: string | null;
  pitch_deck_url: string | null;
  video_pitch_url: string | null;
  why_applying: string | null;
  status: string;
  applied_at: string;
  reviewer_notes: string | null;
}

interface Cohort {
  id: string;
  name: string;
}

interface CohortApplicationsManagerProps {
  applications: Application[];
  cohorts: Cohort[];
  onUpdateStatus: (applicationId: string, status: string, notes?: string) => Promise<void>;
  onAcceptStartup: (application: Application) => Promise<void>;
}

const STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-slate-500/20 text-slate-400' },
  { value: 'under_review', label: 'Under Review', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'interview_scheduled', label: 'Interview', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/20 text-red-400' },
  { value: 'waitlist', label: 'Waitlist', color: 'bg-purple-500/20 text-purple-400' },
];

export const CohortApplicationsManager = ({
  applications,
  cohorts,
  onUpdateStatus,
  onAcceptStartup
}: CohortApplicationsManagerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('platform');
  const [publicApplications, setPublicApplications] = useState<PublicApplication[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);

  useEffect(() => {
    if (cohorts.length > 0) {
      fetchPublicApplications();
    }
  }, [cohorts]);

  const fetchPublicApplications = async () => {
    if (cohorts.length === 0) return;
    
    setLoadingPublic(true);
    try {
      const cohortIds = cohorts.map(c => c.id);
      const { data, error } = await supabase
        .from('public_cohort_applications')
        .select('*')
        .in('cohort_id', cohortIds)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setPublicApplications(data || []);
    } catch (err) {
      console.error('Error fetching public applications:', err);
    } finally {
      setLoadingPublic(false);
    }
  };

  const updatePublicApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('public_cohort_applications')
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;
      await fetchPublicApplications();
    } catch (err) {
      console.error('Error updating public application:', err);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchQuery || 
      app.startup?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.startup?.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCohort = selectedCohort === 'all' || app.cohort_id === selectedCohort;
    const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;
    return matchesSearch && matchesCohort && matchesStatus;
  });

  const filteredPublicApplications = publicApplications.filter(app => {
    const matchesSearch = !searchQuery || 
      app.startup_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.founder_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCohort = selectedCohort === 'all' || app.cohort_id === selectedCohort;
    const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;
    return matchesSearch && matchesCohort && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUSES.find(s => s.value === status);
    return statusConfig || STATUSES[0];
  };

  const getCohortName = (cohortId: string) => {
    return cohorts.find(c => c.id === cohortId)?.name || 'Unknown';
  };

  // Group applications by status for Kanban view
  const applicationsByStatus = STATUSES.reduce((acc, status) => {
    acc[status.value] = filteredApplications.filter(app => app.status === status.value);
    return acc;
  }, {} as Record<string, Application[]>);

  const publicAppsByStatus = STATUSES.reduce((acc, status) => {
    acc[status.value] = filteredPublicApplications.filter(app => app.status === status.value);
    return acc;
  }, {} as Record<string, PublicApplication[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Applications</h2>
          <p className="text-muted-foreground">
            {filteredApplications.length + filteredPublicApplications.length} total applications across {cohorts.length} cohorts
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search startups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[200px]"
            />
          </div>
          <Select value={selectedCohort} onValueChange={setSelectedCohort}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Cohorts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cohorts</SelectItem>
              {cohorts.map((cohort) => (
                <SelectItem key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs for Platform vs External Applications */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="platform" className="flex items-center gap-2">
            Platform ({filteredApplications.length})
          </TabsTrigger>
          <TabsTrigger value="external" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            External ({filteredPublicApplications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="mt-6">
          {/* Platform Applications Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <div key={status.value} className="min-w-[280px]">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({applicationsByStatus[status.value]?.length || 0})
                  </span>
                </div>

                <div className="space-y-3">
                  {applicationsByStatus[status.value]?.map((app) => (
                    <Card 
                      key={app.id}
                      className="tech-card border-0 hover:border-emerald-500/30 transition-all duration-300"
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Startup Info */}
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={app.startup?.logo_url || undefined} />
                            <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                              {app.startup?.name?.charAt(0) || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{app.startup?.name || 'Unknown'}</h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {app.startup?.industry || 'No industry'}
                            </p>
                          </div>
                        </div>

                        {/* Cohort */}
                        <Badge variant="outline" className="text-xs">
                          {getCohortName(app.cohort_id)}
                        </Badge>

                        {/* Description */}
                        {app.startup?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {app.startup.description}
                          </p>
                        )}

                        {/* Links */}
                        <div className="flex items-center gap-2">
                          {app.pitch_deck_url && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => window.open(app.pitch_deck_url!, '_blank')}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Deck
                            </Button>
                          )}
                          {app.video_pitch_url && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => window.open(app.video_pitch_url!, '_blank')}
                            >
                              <Video className="w-3 h-3 mr-1" />
                              Video
                            </Button>
                          )}
                        </div>

                        {/* Applied Date */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Applied {format(new Date(app.applied_at), 'MMM d, yyyy')}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                          {app.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 h-8"
                              onClick={() => onUpdateStatus(app.id, 'under_review')}
                            >
                              Review
                            </Button>
                          )}
                          {app.status === 'under_review' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 h-8"
                              onClick={() => onUpdateStatus(app.id, 'interview_scheduled')}
                            >
                              <Calendar className="w-3 h-3 mr-1" />
                              Interview
                            </Button>
                          )}
                          {app.status === 'interview_scheduled' && (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1 h-8 bg-emerald-500 hover:bg-emerald-600"
                                onClick={() => onAcceptStartup(app)}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="h-8"
                                onClick={() => onUpdateStatus(app.id, 'rejected')}
                              >
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          {(app.status === 'accepted' || app.status === 'rejected' || app.status === 'waitlist') && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 h-8"
                              onClick={() => onUpdateStatus(app.id, 'under_review')}
                            >
                              Reconsider
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(!applicationsByStatus[status.value] || applicationsByStatus[status.value].length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No applications
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="external" className="mt-6">
          {/* External Applications Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
            {STATUSES.map((status) => (
              <div key={status.value} className="min-w-[280px]">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={status.color}>
                    {status.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({publicAppsByStatus[status.value]?.length || 0})
                  </span>
                </div>

                <div className="space-y-3">
                  {publicAppsByStatus[status.value]?.map((app) => (
                    <Card 
                      key={app.id}
                      className="tech-card border-0 hover:border-amber-500/30 transition-all duration-300"
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* External Badge */}
                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
                          <Globe className="w-3 h-3 mr-1" />
                          External
                        </Badge>

                        {/* Startup Info */}
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-amber-500/20 text-amber-400">
                              {app.startup_name?.charAt(0) || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{app.startup_name}</h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {app.founder_name} • {app.industry || 'No industry'}
                            </p>
                          </div>
                        </div>

                        {/* Cohort */}
                        <Badge variant="outline" className="text-xs">
                          {getCohortName(app.cohort_id)}
                        </Badge>

                        {/* Contact */}
                        <p className="text-xs text-muted-foreground truncate">
                          {app.email}
                        </p>

                        {/* Why Applying */}
                        {app.why_applying && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {app.why_applying}
                          </p>
                        )}

                        {/* Links */}
                        <div className="flex items-center gap-2">
                          {app.website && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => window.open(app.website!, '_blank')}
                            >
                              <Globe className="w-3 h-3 mr-1" />
                              Site
                            </Button>
                          )}
                          {app.pitch_deck_url && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => window.open(app.pitch_deck_url!, '_blank')}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Deck
                            </Button>
                          )}
                          {app.video_pitch_url && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => window.open(app.video_pitch_url!, '_blank')}
                            >
                              <Video className="w-3 h-3 mr-1" />
                              Video
                            </Button>
                          )}
                        </div>

                        {/* Applied Date */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Applied {format(new Date(app.applied_at), 'MMM d, yyyy')}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                          {app.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 h-8"
                              onClick={() => updatePublicApplicationStatus(app.id, 'under_review')}
                            >
                              Review
                            </Button>
                          )}
                          {app.status === 'under_review' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 h-8"
                              onClick={() => updatePublicApplicationStatus(app.id, 'interview_scheduled')}
                            >
                              <Calendar className="w-3 h-3 mr-1" />
                              Interview
                            </Button>
                          )}
                          {app.status === 'interview_scheduled' && (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1 h-8 bg-emerald-500 hover:bg-emerald-600"
                                onClick={() => updatePublicApplicationStatus(app.id, 'accepted')}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="h-8"
                                onClick={() => updatePublicApplicationStatus(app.id, 'rejected')}
                              >
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          {(app.status === 'accepted' || app.status === 'rejected' || app.status === 'waitlist') && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 h-8"
                              onClick={() => updatePublicApplicationStatus(app.id, 'under_review')}
                            >
                              Reconsider
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(!publicAppsByStatus[status.value] || publicAppsByStatus[status.value].length === 0) && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No applications
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};