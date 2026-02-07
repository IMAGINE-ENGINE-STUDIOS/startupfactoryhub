import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Globe, MapPin, Users, Clock, Eye, Loader2, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface HubApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  linkedin_url: string;
  primary_role: string;
  years_experience: string;
  ecosystem_strength: string;
  stakeholders: string[];
  estimated_startups: string;
  launch_timeline: string;
  team_status: string;
  primary_motivation: string;
  long_term_ambition: string;
  global_framework_readiness: string;
  leadership_style: string;
  greatest_strength: string;
  onboarding_timeline: string;
  three_year_commitment: string;
  digital_signature: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  reviewing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  interview: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function HubApplicationsManagement() {
  const [applications, setApplications] = useState<HubApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<HubApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hub_applications' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setApplications(data as any);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('hub_applications' as any)
      .update({ status } as any)
      .eq('id', id);

    if (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    } else {
      toast({ title: `Status updated to ${status}` });
      fetchApplications();
      if (selectedApp?.id === id) setSelectedApp(prev => prev ? { ...prev, status } : null);
    }
  };

  const saveNotes = async () => {
    if (!selectedApp) return;
    const { error } = await supabase
      .from('hub_applications' as any)
      .update({ admin_notes: adminNotes } as any)
      .eq('id', selectedApp.id);

    if (!error) {
      toast({ title: 'Notes saved' });
      fetchApplications();
    }
  };

  const filtered = applications.filter(a => {
    const matchesSearch = !search || 
      a.full_name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase()) ||
      a.country.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    approved: applications.filter(a => a.status === 'approved').length,
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'City', 'Country', 'LinkedIn', 'Role', 'Experience', 'Status', 'Date'];
    const rows = filtered.map(a => [
      a.full_name, a.email, a.phone, a.city, a.country, a.linkedin_url,
      a.primary_role, a.years_experience, a.status, format(new Date(a.created_at), 'yyyy-MM-dd'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'hub-applications.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: stats.total, icon: Users, color: 'text-foreground' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-500' },
          { label: 'In Review', value: stats.reviewing, icon: Eye, color: 'text-blue-500' },
          { label: 'Approved', value: stats.approved, icon: Globe, color: 'text-emerald-500' },
        ].map(s => (
          <Card key={s.label} className="tech-card border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, city..." className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card className="tech-card border-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium">Applicant</th>
                <th className="text-left p-3 font-medium">Location</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-left p-3 font-medium">Experience</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(app => (
                <tr key={app.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{app.full_name}</p>
                      <p className="text-xs text-muted-foreground">{app.email}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3" /> {app.city}, {app.country}
                    </div>
                  </td>
                  <td className="p-3 text-xs max-w-[120px] truncate">{app.primary_role}</td>
                  <td className="p-3 text-xs">{app.years_experience} yrs</td>
                  <td className="p-3">
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[app.status] || ''}`}>
                      {app.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{format(new Date(app.created_at), 'MMM d, yyyy')}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedApp(app); setAdminNotes(app.admin_notes || ''); }}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                      <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 text-xs">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No applications found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={o => !o && setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedApp.full_name}</span>
                  <Badge variant="outline" className={STATUS_COLORS[selectedApp.status] || ''}>
                    {selectedApp.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 text-sm">
                {/* Contact */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedApp.email}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{selectedApp.phone}</span></div>
                  <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{selectedApp.city}, {selectedApp.country}</span></div>
                  <div><span className="text-muted-foreground">LinkedIn:</span> <a href={selectedApp.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">View Profile</a></div>
                </div>

                {/* Sections */}
                {[
                  { title: 'Profile', items: [['Role', selectedApp.primary_role], ['Experience', selectedApp.years_experience + ' years']] },
                  { title: 'Ecosystem', items: [['Strength', selectedApp.ecosystem_strength], ['Stakeholders', (selectedApp.stakeholders || []).join(', ') || 'None'], ['Est. Startups', selectedApp.estimated_startups]] },
                  { title: 'Operations', items: [['Launch Timeline', selectedApp.launch_timeline], ['Team Status', selectedApp.team_status]] },
                  { title: 'Strategy', items: [['Motivation', selectedApp.primary_motivation], ['Ambition', selectedApp.long_term_ambition]] },
                  { title: 'Framework', items: [['Readiness', selectedApp.global_framework_readiness]] },
                  { title: 'Leadership', items: [['Style', selectedApp.leadership_style], ['Strength', selectedApp.greatest_strength]] },
                  { title: 'Commitment', items: [['Onboarding', selectedApp.onboarding_timeline], ['3-Year Commitment', selectedApp.three_year_commitment], ['Signature', selectedApp.digital_signature]] },
                ].map(section => (
                  <div key={section.title}>
                    <h4 className="font-semibold text-xs text-primary uppercase mb-2">{section.title}</h4>
                    <div className="space-y-1">
                      {section.items.map(([label, value]) => (
                        <div key={label as string} className="flex gap-2">
                          <span className="text-muted-foreground min-w-[120px]">{label}:</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Status Update */}
                <div className="border-t border-border pt-4 space-y-3">
                  <h4 className="font-semibold text-xs text-primary uppercase">Update Status</h4>
                  <div className="flex gap-2 flex-wrap">
                    {['pending', 'reviewing', 'interview', 'approved', 'rejected'].map(s => (
                      <Button
                        key={s}
                        size="sm"
                        variant={selectedApp.status === s ? 'default' : 'outline'}
                        onClick={() => updateStatus(selectedApp.id, s)}
                        className="text-xs capitalize"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-xs text-primary uppercase">Admin Notes</h4>
                  <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} placeholder="Internal notes about this applicant..." />
                  <Button size="sm" onClick={saveNotes}>Save Notes</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
