import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plane, CheckCircle, XCircle, Clock, RefreshCw, User } from 'lucide-react';
import { format } from 'date-fns';

interface FlightPassRequest {
  id: string;
  user_id: string;
  status: string;
  frontier_account_email: string | null;
  frontier_username: string | null;
  admin_notes: string | null;
  requested_at: string;
  reviewed_at: string | null;
  profiles?: { full_name: string | null; email: string | null; avatar_url: string | null };
}

export default function FlightsManagement() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<FlightPassRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState<Record<string, { username: string; password: string }>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const { data: requestsData, error } = await supabase
      .from('flight_pass_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load flight pass requests', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const userIds = (requestsData || []).map(r => r.user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
    const merged = (requestsData || []).map(r => ({
      ...r,
      profiles: profileMap.get(r.user_id) || null,
    })) as FlightPassRequest[];

    setRequests(merged);

    // Initialize credentials state
    const creds: Record<string, { username: string; password: string }> = {};
    merged.forEach(r => {
      creds[r.id] = { username: r.frontier_username || '', password: '' };
    });
    setCredentials(creds);

    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'revoked') => {
    const cred = credentials[id];
    if (status === 'approved' && !cred?.username) {
      toast({ title: 'Error', description: 'You must enter the Frontier username before approving.', variant: 'destructive' });
      return;
    }

    setUpdating(id);
    const { error } = await supabase
      .from('flight_pass_requests')
      .update({
        status,
        admin_notes: notes[id] || null,
        frontier_username: cred?.username || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Pass ${status} successfully` });
      fetchRequests();
    }
    setUpdating(null);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-[#FFB86A] border-[#FFB86A]/50 font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved': return <Badge className="bg-[#2EF8A0] text-[#02141A] font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'revoked': return <Badge variant="secondary">Revoked</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plane className="h-6 w-6 text-[#2EF8A0]" />
          <div>
            <h2 className="text-xl font-bold font-['Space_Grotesk'] tracking-wide">Frontier Airlines Pass Management</h2>
            <p className="text-sm text-muted-foreground">Approve GoWild All-You-Can-Fly passes for Corporate members</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchRequests} className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: requests.length, color: 'text-foreground' },
          { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, color: 'text-[#FFB86A]' },
          { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: 'text-[#2EF8A0]' },
          { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, color: 'text-[#FF3D6E]' },
        ].map(stat => (
          <Card key={stat.label} className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold font-['JetBrains_Mono'] ${stat.color}`}>{stat.value}</p>
              <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading requests...</div>
      ) : requests.length === 0 ? (
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Plane className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No flight pass requests yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <Card key={req.id} className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {req.profiles?.avatar_url ? (
                      <img src={req.profiles.avatar_url} className="h-10 w-10 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{req.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground truncate">{req.profiles?.email}</p>
                      {req.frontier_account_email && (
                        <p className="text-xs text-[#2EF8A0]">Frontier Email: {req.frontier_account_email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
                    {statusBadge(req.status)}
                    <p className="text-[10px] text-muted-foreground">
                      Requested: {format(new Date(req.requested_at), 'MMM dd, yyyy')}
                    </p>
                    {req.reviewed_at && (
                      <p className="text-[10px] text-muted-foreground">
                        Reviewed: {format(new Date(req.reviewed_at), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </div>

                {(req.status === 'pending' || req.status === 'approved') && (
                  <div className="mt-4 space-y-3">
                    {/* Frontier credentials - required for approval */}
                    <div className="p-3 rounded-md border border-[#2EF8A0]/25 bg-[#2EF8A0]/5 space-y-3">
                      <p className="text-xs font-medium text-[#2EF8A0]">Frontier Airlines Username {req.status === 'pending' && '(required for approval)'}</p>
                      <p className="text-[11px] text-muted-foreground">For security, passwords are no longer stored. Share the password with the user through a secure out-of-band channel.</p>
                      <div>
                        <Label className="text-xs">Username / Email</Label>
                        <Input
                          value={credentials[req.id]?.username || ''}
                          onChange={e => setCredentials(prev => ({ ...prev, [req.id]: { ...prev[req.id], username: e.target.value } }))}
                          placeholder="Frontier account username"
                          className="text-sm bg-white/[0.03] border-white/10 focus:border-[#00E5FF]/50"
                        />
                      </div>
                    </div>

                    <Textarea
                      placeholder="Admin notes (optional)..."
                      value={notes[req.id] || req.admin_notes || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                      className="text-sm bg-white/[0.03] border-white/10 focus:border-[#00E5FF]/50"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      {req.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(req.id, 'approved')}
                            disabled={updating === req.id}
                            className="bg-[#2EF8A0] text-[#02141A] hover:bg-[#2EF8A0]/85"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve Pass
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus(req.id, 'rejected')}
                            disabled={updating === req.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(req.id, 'approved')}>Save Credentials</Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(req.id, 'revoked')}
                            disabled={updating === req.id}
                          >
                            Revoke Pass
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {req.admin_notes && req.status !== 'pending' && req.status !== 'approved' && (
                  <p className="mt-3 text-xs text-muted-foreground italic">Note: {req.admin_notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
