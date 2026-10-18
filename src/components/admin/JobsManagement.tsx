import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Search, 
  Trash2,
  Briefcase,
  RefreshCw,
  MoreVertical,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  DollarSign,
  GraduationCap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string | null;
  salary_range?: string | null;
  job_type: string | null;
  status: string | null;
  applications_count: number | null;
  created_at: string;
  company_id: string;
  companies?: {
    name: string;
    logo_url: string | null;
  };
}

interface Internship {
  id: string;
  title: string;
  description: string;
  location: string | null;
  compensation: string | null;
  duration: string | null;
  status: string | null;
  applications_count: number | null;
  created_at: string;
  companies?: {
    name: string;
    logo_url: string | null;
  };
}

const JobsManagement = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewType, setViewType] = useState<'jobs' | 'internships'>('jobs');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsResult, internshipsResult] = await Promise.all([
        supabase.from('jobs').select('*, companies(name, logo_url)').order('created_at', { ascending: false }),
        supabase.from('internships').select('*, companies(name, logo_url)').order('created_at', { ascending: false })
      ]);

      if (jobsResult.error) throw jobsResult.error;
      if (internshipsResult.error) throw internshipsResult.error;

      setJobs((jobsResult.data || []) as Job[]);
      setInternships((internshipsResult.data || []) as Internship[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch jobs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJobStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
      toast({
        title: "Updated",
        description: `Job status updated to ${status}`
      });
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive"
      });
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setJobs(prev => prev.filter(j => j.id !== id));
      toast({
        title: "Deleted",
        description: "Job has been deleted"
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    const styles: Record<string, string> = {
      open: 'bg-[#2EF8A0]/15 text-[#2EF8A0] border-[#2EF8A0]/30 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider',
      closed: 'bg-white/[0.06] text-white/50 border-white/15 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider',
      pending: 'bg-[#FFB86A]/15 text-[#FFB86A] border-[#FFB86A]/30 font-["JetBrains_Mono"] uppercase text-[10px] tracking-wider'
    };
    return styles[status || ''] || 'bg-muted text-muted-foreground';
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = !searchQuery || 
      j.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.companies?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredInternships = internships.filter(i => {
    const matchesSearch = !searchQuery || 
      i.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.companies?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalApplications = [...jobs, ...internships].reduce((sum, item) => sum + (item.applications_count || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="p-4">
            <Briefcase className="h-5 w-5 text-[#00E5FF] mb-2" />
            <p className="text-2xl font-bold font-['JetBrains_Mono']">{jobs.length}</p>
            <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">Total Jobs</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="p-4">
            <GraduationCap className="h-5 w-5 text-[#00E5FF] mb-2" />
            <p className="text-2xl font-bold font-['JetBrains_Mono']">{internships.length}</p>
            <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">Internships</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="p-4">
            <CheckCircle className="h-5 w-5 text-[#2EF8A0] mb-2" />
            <p className="text-2xl font-bold font-['JetBrains_Mono']">{jobs.filter(j => j.status === 'open').length}</p>
            <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">Open Positions</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="p-4">
            <Users className="h-5 w-5 text-[#00E5FF] mb-2" />
            <p className="text-2xl font-bold font-['JetBrains_Mono']">{totalApplications}</p>
            <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">Total Applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/[0.03] border-white/10 focus:border-[#00E5FF]/50"
              />
            </div>
            <Select value={viewType} onValueChange={(v: 'jobs' | 'internships') => setViewType(v)}>
              <SelectTrigger className="w-[150px] bg-white/[0.03] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jobs">Jobs</SelectItem>
                <SelectItem value="internships">Internships</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-white/[0.03] border-white/10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData} className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs/Internships Table */}
      <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-['Space_Grotesk'] tracking-wide">
            {viewType === 'jobs' ? <Briefcase className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
            {viewType === 'jobs' ? `Jobs (${filteredJobs.length})` : `Internships (${filteredInternships.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Position</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Company</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Location</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">{viewType === 'jobs' ? 'Salary' : 'Compensation'}</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Status</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Applications</TableHead>
                  <TableHead className="text-right font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewType === 'jobs' ? (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.job_type || 'Full-time'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{job.companies?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{job.location || 'Remote'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{job.salary_range || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadge(job.status)}>
                          {job.status || 'open'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>{job.applications_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateJobStatus(job.id, 'open')}>
                              <CheckCircle className="h-4 w-4 mr-2 text-[#2EF8A0]" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateJobStatus(job.id, 'closed')}>
                              <XCircle className="h-4 w-4 mr-2 text-[#FFB86A]" />
                              Close
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteJob(job.id)} className="text-[#FF3D6E]">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredInternships.map((internship) => (
                    <TableRow key={internship.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{internship.title}</p>
                          <p className="text-xs text-muted-foreground">{internship.duration || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{internship.companies?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{internship.location || 'Remote'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{internship.compensation || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadge(internship.status)}>
                          {internship.status || 'open'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>{internship.applications_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobsManagement;