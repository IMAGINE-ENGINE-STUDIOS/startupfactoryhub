import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Search, 
  FileText, 
  Video, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Globe,
  LayoutList,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Presentation
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
  onAcceptStartup: (application: Application) => Promise<void | { paymentUrl?: string | null }>;
  onSchedulePitch?: (application: Application) => void;
}

const STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  { value: 'under_review', label: 'Under Review', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'interview_scheduled', label: 'Interview', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'waitlist', label: 'Waitlist', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
];

export const CohortApplicationsManager = ({
  applications,
  cohorts,
  onUpdateStatus,
  onAcceptStartup,
  onSchedulePitch
}: CohortApplicationsManagerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('platform');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [publicApplications, setPublicApplications] = useState<PublicApplication[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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

  // Stats
  const pendingCount = [...filteredApplications, ...filteredPublicApplications].filter(a => a.status === 'pending').length;
  const reviewCount = [...filteredApplications, ...filteredPublicApplications].filter(a => a.status === 'under_review').length;
  const acceptedCount = [...filteredApplications, ...filteredPublicApplications].filter(a => a.status === 'accepted').length;

  const renderPlatformListView = () => (
    <Card className="tech-card border-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="w-[300px]">Startup</TableHead>
            <TableHead>Cohort</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied</TableHead>
            <TableHead>Links</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredApplications.map((app) => {
            const statusConfig = getStatusBadge(app.status);
            const isExpanded = expandedRow === app.id;
            
            return (
              <>
                <TableRow 
                  key={app.id} 
                  className="border-border/50 cursor-pointer hover:bg-muted/30"
                  onClick={() => setExpandedRow(isExpanded ? null : app.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={app.startup?.logo_url || undefined} />
                        <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                          {app.startup?.name?.charAt(0) || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{app.startup?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{app.startup?.industry || 'No industry'}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 ml-2 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 ml-2 text-muted-foreground" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{getCohortName(app.cohort_id)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(app.applied_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {app.pitch_deck_url && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); window.open(app.pitch_deck_url!, '_blank'); }}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                      {app.video_pitch_url && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); window.open(app.video_pitch_url!, '_blank'); }}
                        >
                          <Video className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {app.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => onUpdateStatus(app.id, 'under_review')}>
                          Review
                        </Button>
                      )}
                      {app.status === 'under_review' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => onUpdateStatus(app.id, 'interview_scheduled')}>
                            <Calendar className="w-3 h-3 mr-1" />
                            Interview
                          </Button>
                          {onSchedulePitch && (
                            <Button size="sm" variant="outline" onClick={() => onSchedulePitch(app)}>
                              <Presentation className="w-3 h-3 mr-1" />
                              Pitch
                            </Button>
                          )}
                        </>
                      )}
                      {app.status === 'interview_scheduled' && (
                        <>
                          {onSchedulePitch && (
                            <Button size="sm" variant="outline" onClick={() => onSchedulePitch(app)}>
                              <Presentation className="w-3 h-3 mr-1" />
                              Pitch
                            </Button>
                          )}
                          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => onAcceptStartup(app)}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => onUpdateStatus(app.id, 'rejected')}>
                            <XCircle className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      {(app.status === 'accepted' || app.status === 'rejected' || app.status === 'waitlist') && (
                        <Button size="sm" variant="outline" onClick={() => onUpdateStatus(app.id, 'under_review')}>
                          Reconsider
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="border-border/50 bg-muted/20">
                    <TableCell colSpan={6} className="p-4">
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">{app.startup?.description || 'No description available'}</p>
                        {app.startup?.stage && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Stage:</span>
                            <Badge variant="outline" className="text-xs">{app.startup.stage}</Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
          {filteredApplications.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                No applications found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );

  const renderPlatformKanbanView = () => (
    <ScrollArea className="w-full">
      <div className="flex gap-3 pb-4 min-w-max">
        {STATUSES.map((status) => {
          const statusApps = filteredApplications.filter(app => app.status === status.value);
          return (
            <div key={status.value} className="flex-shrink-0 w-[220px] sm:w-[240px]">
            <div className="mb-3 flex items-center gap-2">
              <Badge className={status.color}>{status.label}</Badge>
              <span className="text-sm text-muted-foreground">({statusApps.length})</span>
            </div>
            <div className="space-y-3">
              {statusApps.map((app) => (
                <Card key={app.id} className="tech-card border-0 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={app.startup?.logo_url || undefined} />
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                        {app.startup?.name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{app.startup?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{app.startup?.industry || 'No industry'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">{getCohortName(app.cohort_id)}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {app.pitch_deck_url && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(app.pitch_deck_url!, '_blank')}>
                        <FileText className="w-3 h-3" />
                      </Button>
                    )}
                    {app.video_pitch_url && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(app.video_pitch_url!, '_blank')}>
                        <Video className="w-3 h-3" />
                      </Button>
                    )}
                    {app.status === 'pending' && (
                      <Button size="sm" variant="outline" className="ml-auto text-xs h-7" onClick={() => onUpdateStatus(app.id, 'under_review')}>
                        Review
                      </Button>
                    )}
                    {app.status === 'under_review' && (
                      <Button size="sm" variant="outline" className="ml-auto text-xs h-7" onClick={() => {
                        onUpdateStatus(app.id, 'interview_scheduled');
                        if (onSchedulePitch) onSchedulePitch(app);
                      }}>
                        <Calendar className="w-3 h-3 mr-1" />
                        Interview
                      </Button>
                    )}
                    {app.status === 'interview_scheduled' && (
                      <div className="ml-auto flex gap-1">
                        {onSchedulePitch && (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onSchedulePitch(app)}>
                            <Presentation className="w-3 h-3" />
                          </Button>
                        )}
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-xs h-7" onClick={() => onAcceptStartup(app)}>
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => onUpdateStatus(app.id, 'rejected')}>
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              {statusApps.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No applications</p>
              )}
            </div>
          </div>
        );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );

  const renderExternalKanbanView = () => (
    <ScrollArea className="w-full">
      <div className="flex gap-3 pb-4 min-w-max">
        {STATUSES.map((status) => {
          const statusApps = filteredPublicApplications.filter(app => app.status === status.value);
          return (
            <div key={status.value} className="flex-shrink-0 w-[220px] sm:w-[240px]">
            <div className="mb-3 flex items-center gap-2">
              <Badge className={status.color}>{status.label}</Badge>
              <span className="text-sm text-muted-foreground">({statusApps.length})</span>
            </div>
            <div className="space-y-3">
              {statusApps.map((app) => (
                <Card key={app.id} className="tech-card border-0 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-amber-500/20 text-amber-400">
                        {app.startup_name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="font-medium text-sm">{app.startup_name}</p>
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30">Ext</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{app.industry || 'No industry'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{app.founder_name}</p>
                  <div className="flex items-center gap-1">
                    {app.website && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(app.website!, '_blank')}>
                        <Globe className="w-3 h-3" />
                      </Button>
                    )}
                    {app.pitch_deck_url && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(app.pitch_deck_url!, '_blank')}>
                        <FileText className="w-3 h-3" />
                      </Button>
                    )}
                    {app.status === 'pending' && (
                      <Button size="sm" variant="outline" className="ml-auto text-xs h-7" onClick={() => updatePublicApplicationStatus(app.id, 'under_review')}>
                        Review
                      </Button>
                    )}
                    {app.status === 'under_review' && (
                      <Button size="sm" variant="outline" className="ml-auto text-xs h-7" onClick={() => updatePublicApplicationStatus(app.id, 'interview_scheduled')}>
                        <Calendar className="w-3 h-3 mr-1" />
                        Interview
                      </Button>
                    )}
                    {app.status === 'interview_scheduled' && (
                      <div className="ml-auto flex gap-1">
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-xs h-7" onClick={() => updatePublicApplicationStatus(app.id, 'accepted')}>
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => updatePublicApplicationStatus(app.id, 'rejected')}>
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              {statusApps.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No applications</p>
              )}
            </div>
          </div>
        );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );

  const renderExternalListView = () => (
    <Card className="tech-card border-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="w-[300px]">Startup</TableHead>
            <TableHead>Founder</TableHead>
            <TableHead>Cohort</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied</TableHead>
            <TableHead>Links</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPublicApplications.map((app) => {
            const statusConfig = getStatusBadge(app.status);
            const isExpanded = expandedRow === app.id;
            
            return (
              <>
                <TableRow 
                  key={app.id} 
                  className="border-border/50 cursor-pointer hover:bg-muted/30"
                  onClick={() => setExpandedRow(isExpanded ? null : app.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-amber-500/20 text-amber-400">
                          {app.startup_name?.charAt(0) || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{app.startup_name}</p>
                          <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
                            External
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{app.industry || 'No industry'}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 ml-2 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 ml-2 text-muted-foreground" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{app.founder_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{getCohortName(app.cohort_id)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(app.applied_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {app.website && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); window.open(app.website!, '_blank'); }}
                        >
                          <Globe className="w-4 h-4" />
                        </Button>
                      )}
                      {app.pitch_deck_url && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); window.open(app.pitch_deck_url!, '_blank'); }}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                      {app.video_pitch_url && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); window.open(app.video_pitch_url!, '_blank'); }}
                        >
                          <Video className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {app.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => updatePublicApplicationStatus(app.id, 'under_review')}>
                          Review
                        </Button>
                      )}
                      {app.status === 'under_review' && (
                        <Button size="sm" variant="outline" onClick={() => updatePublicApplicationStatus(app.id, 'interview_scheduled')}>
                          <Calendar className="w-3 h-3 mr-1" />
                          Interview
                        </Button>
                      )}
                      {app.status === 'interview_scheduled' && (
                        <>
                          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => updatePublicApplicationStatus(app.id, 'accepted')}>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => updatePublicApplicationStatus(app.id, 'rejected')}>
                            <XCircle className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      {(app.status === 'accepted' || app.status === 'rejected' || app.status === 'waitlist') && (
                        <Button size="sm" variant="outline" onClick={() => updatePublicApplicationStatus(app.id, 'under_review')}>
                          Reconsider
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="border-border/50 bg-muted/20">
                    <TableCell colSpan={7} className="p-4">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-muted-foreground">Email:</span>
                            <p className="text-sm">{app.email}</p>
                          </div>
                          {app.phone && (
                            <div>
                              <span className="text-xs text-muted-foreground">Phone:</span>
                              <p className="text-sm">{app.phone}</p>
                            </div>
                          )}
                        </div>
                        {app.why_applying && (
                          <div>
                            <span className="text-xs text-muted-foreground">Why Applying:</span>
                            <p className="text-sm mt-1">{app.why_applying}</p>
                          </div>
                        )}
                        {app.stage && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Stage:</span>
                            <Badge variant="outline" className="text-xs">{app.stage}</Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
          {filteredPublicApplications.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                No external applications found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Applications</h2>
          <p className="text-muted-foreground">
            {filteredApplications.length + filteredPublicApplications.length} total applications
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium">{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Search className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">{reviewCount} In Review</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium">{acceptedCount} Accepted</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        {/* View Toggle - First on mobile */}
        <div className="flex items-center gap-1 order-first sm:order-last sm:ml-auto">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === 'kanban' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative flex-1 min-w-[200px] max-w-full sm:max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search startups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCohort} onValueChange={setSelectedCohort}>
          <SelectTrigger className="w-full sm:w-[150px]">
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
          <SelectTrigger className="w-full sm:w-[150px]">
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
          {viewMode === 'list' ? renderPlatformListView() : renderPlatformKanbanView()}
        </TabsContent>

        <TabsContent value="external" className="mt-6">
          {viewMode === 'list' ? renderExternalListView() : renderExternalKanbanView()}
        </TabsContent>
      </Tabs>
    </div>
  );
};
