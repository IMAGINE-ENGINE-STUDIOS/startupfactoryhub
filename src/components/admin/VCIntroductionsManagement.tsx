import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Rocket, Search, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface VCRequest {
  id: string;
  user_id: string;
  status: string;
  company_name: string | null;
  industry: string | null;
  arr_amount: number | null;
  admin_notes: string | null;
  vc_firm_name: string | null;
  introduction_date: string | null;
  created_at: string;
  profile?: { full_name: string; avatar_url: string | null; email: string } | null;
}

export default function VCIntroductionsManagement() {
  const [requests, setRequests] = useState<VCRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [editingVcFirm, setEditingVcFirm] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('vc_introduction_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching VC requests:', error);
      setLoading(false);
      return;
    }

    // Fetch profiles for all user_ids
    const userIds = [...new Set((data || []).map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, email')
      .in('user_id', userIds);

    const profilesMap = (profiles || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {} as Record<string, any>);

    setRequests((data || []).map(r => ({ ...r, profile: profilesMap[r.user_id] || null })));
    setLoading(false);
  };

  const updateRequest = async (id: string, updates: Record<string, any>) => {
    const { error } = await supabase
      .from('vc_introduction_requests')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ description: 'Request updated successfully' });
    fetchRequests();
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    approved: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    rejected: 'bg-red-500/20 text-red-600 border-red-500/30',
    completed: 'bg-green-500/20 text-green-600 border-green-500/30',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-3 w-3" />,
    approved: <CheckCircle className="h-3 w-3" />,
    rejected: <XCircle className="h-3 w-3" />,
    completed: <CheckCircle className="h-3 w-3" />,
  };

  const filtered = requests.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.profile?.full_name?.toLowerCase().includes(s) ||
      r.company_name?.toLowerCase().includes(s) ||
      r.industry?.toLowerCase().includes(s) ||
      r.status.includes(s)
    );
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            VC Direct Introductions
          </CardTitle>
          <CardDescription>
            Manage venture capital introduction requests from official members. 
            Eligible startups must be in <strong>Space, Deep Tech, or Quantum</strong> industries 
            and have at least <strong>$1M ARR</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or industry..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="outline" className="shrink-0">{requests.length} Total</Badge>
          </div>

          {/* Eligibility Note */}
          <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Eligibility Criteria:</strong> The startup must operate in 
              Space, Deep Tech, or Quantum industries and demonstrate at least $1M in Annual Recurring Revenue (ARR) 
              to qualify for a direct introduction to venture capital firms.
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Rocket className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No VC introduction requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(req => (
                <Card key={req.id} className="tech-card border-0">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={req.profile?.avatar_url || ''} />
                          <AvatarFallback>{req.profile?.full_name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{req.profile?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{req.profile?.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={statusColors[req.status]}>
                        {statusIcons[req.status]}
                        <span className="ml-1 capitalize">{req.status}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Company:</span>
                        <p className="font-medium">{req.company_name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Industry:</span>
                        <p className="font-medium">{req.industry || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ARR:</span>
                        <p className="font-medium">
                          {req.arr_amount ? `$${(req.arr_amount / 1000000).toFixed(1)}M` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Requested:</span>
                        <p className="font-medium">{new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Admin controls */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground shrink-0">Status:</label>
                        <Select
                          value={req.status}
                          onValueChange={val => updateRequest(req.id, { status: val })}
                        >
                          <SelectTrigger className="h-7 text-xs w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground shrink-0">VC Firm:</label>
                        <Input
                          placeholder="Enter VC firm name..."
                          className="h-7 text-xs"
                          value={editingVcFirm[req.id] ?? req.vc_firm_name ?? ''}
                          onChange={e => setEditingVcFirm(prev => ({ ...prev, [req.id]: e.target.value }))}
                          onBlur={() => {
                            const val = editingVcFirm[req.id];
                            if (val !== undefined && val !== req.vc_firm_name) {
                              updateRequest(req.id, { vc_firm_name: val });
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Admin Notes:</label>
                        <Textarea
                          placeholder="Add notes about this introduction..."
                          className="text-xs mt-1"
                          rows={2}
                          value={editingNotes[req.id] ?? req.admin_notes ?? ''}
                          onChange={e => setEditingNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                          onBlur={() => {
                            const val = editingNotes[req.id];
                            if (val !== undefined && val !== req.admin_notes) {
                              updateRequest(req.id, { admin_notes: val });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
