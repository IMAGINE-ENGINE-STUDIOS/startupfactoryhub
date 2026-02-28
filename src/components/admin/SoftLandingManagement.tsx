import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface SoftLandingRequest {
  id: string;
  user_id: string;
  status: string;
  target_country: string;
  company_name: string;
  company_industry: string | null;
  company_website: string | null;
  company_description: string | null;
  business_registration_number: string | null;
  number_of_employees: string | null;
  annual_revenue: string | null;
  expansion_goals: string | null;
  additional_notes: string | null;
  admin_notes: string | null;
  is_corporate_subscriber: boolean;
  price_cents: number;
  created_at: string;
  updated_at: string;
  profile?: { full_name: string | null; email: string | null; avatar_url: string | null };
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  completed: 'bg-green-500/10 text-green-600 border-green-500/30',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

export default function SoftLandingManagement() {
  const [requests, setRequests] = useState<SoftLandingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState('all');

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('soft_landing_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load requests');
      setLoading(false);
      return;
    }

    // Fetch profiles separately
    const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    const enriched = (data || []).map((r: any) => ({
      ...r,
      profile: profileMap.get(r.user_id) || null,
    }));

    setRequests(enriched);
    const notes: Record<string, string> = {};
    enriched.forEach((r: any) => { notes[r.id] = r.admin_notes || ''; });
    setAdminNotes(notes);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('soft_landing_requests')
      .update({ status, admin_notes: adminNotes[id] || null, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(`Request ${status}`);
      fetchRequests();
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6 text-violet-500" />
            Soft Landing Requests
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{requests.length} total requests</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No requests found.</p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((req) => (
          <div key={req.id} className="tech-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{req.company_name}</h3>
                  <Badge className={statusColors[req.status] || ''}>
                    {req.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{req.target_country}</Badge>
                  {req.is_corporate_subscriber && (
                    <Badge variant="secondary" className="text-[10px]">Corporate — $5,000</Badge>
                  )}
                  {!req.is_corporate_subscriber && (
                    <Badge variant="secondary" className="text-[10px]">Standard — $7,500</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {req.profile?.full_name || 'Unknown'} · {req.profile?.email || 'No email'} · {new Date(req.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {req.company_industry && <div><span className="text-muted-foreground">Industry:</span> {req.company_industry}</div>}
              {req.company_website && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Website:</span>
                  <a href={req.company_website} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1">
                    {req.company_website} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {req.business_registration_number && <div><span className="text-muted-foreground">Reg #:</span> {req.business_registration_number}</div>}
              {req.number_of_employees && <div><span className="text-muted-foreground">Employees:</span> {req.number_of_employees}</div>}
              {req.annual_revenue && <div><span className="text-muted-foreground">Revenue:</span> {req.annual_revenue}</div>}
            </div>

            {req.company_description && (
              <div className="text-sm">
                <span className="text-muted-foreground font-medium">Description:</span>
                <p className="mt-1">{req.company_description}</p>
              </div>
            )}

            {req.expansion_goals && (
              <div className="text-sm">
                <span className="text-muted-foreground font-medium">Expansion Goals:</span>
                <p className="mt-1">{req.expansion_goals}</p>
              </div>
            )}

            {req.additional_notes && (
              <div className="text-sm">
                <span className="text-muted-foreground font-medium">User Notes:</span>
                <p className="mt-1">{req.additional_notes}</p>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t">
              <label className="text-xs font-medium text-muted-foreground">Admin Notes</label>
              <Textarea
                value={adminNotes[req.id] || ''}
                onChange={(e) => setAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                placeholder="Internal notes..."
                rows={2}
              />
              <div className="flex gap-2 flex-wrap">
                {req.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(req.id, 'in_progress')}>Start Processing</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(req.id, 'rejected')}>Reject</Button>
                  </>
                )}
                {req.status === 'in_progress' && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(req.id, 'completed')}>Mark Completed</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, 'rejected')}>Reject</Button>
                  </>
                )}
                {['rejected', 'cancelled'].includes(req.status) && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, 'pending')}>Reopen</Button>
                )}
                {!['pending'].includes(req.status) && (
                  <Button size="sm" variant="ghost" onClick={() => updateStatus(req.id, req.status)}>Save Notes</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
