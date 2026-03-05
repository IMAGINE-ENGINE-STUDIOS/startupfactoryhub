import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Send, Loader2, CheckCircle, Circle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

export default function OfficialProgramManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [invRes, statusRes] = await Promise.all([
      supabase.from('official_mentor_invitations').select('*').order('created_at', { ascending: false }),
      supabase.from('official_mentor_status').select('*').order('created_at', { ascending: false }),
    ]);
    setInvitations(invRes.data || []);
    setStatuses(statusRes.data || []);

    // Fetch profile names for statuses
    const userIds = (statusRes.data || []).map((s: any) => s.user_id);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      if (profiles) {
        const profileMap = profiles.reduce((acc: any, p: any) => { acc[p.user_id] = p; return acc; }, {});
        setStatuses((prev) => prev.map((s: any) => ({ ...s, profile: profileMap[s.user_id] })));
      }
    }
    setLoading(false);
  };

  const sendInvitation = async () => {
    if (!email.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-official-mentor-invite', {
        body: { email: email.trim(), message: message.trim() || undefined },
      });
      if (error) throw error;
      toast({ title: 'Invitation Sent', description: `Invitation sent to ${email}` });
      setEmail('');
      setMessage('');
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSending(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Accepted</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      default: return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Send Invitation */}
      <Card className="tech-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-400" />
            Official Mentor/Advisor Program
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mentor@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Personal Message (optional)</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="We'd love to have you..." rows={1} />
            </div>
          </div>
          <Button onClick={sendInvitation} disabled={sending || !email.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send Invitation
          </Button>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card className="tech-card">
        <CardHeader>
          <CardTitle className="text-base">Invitations ({invitations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.email}</TableCell>
                  <TableCell>{getStatusBadge(inv.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(inv.expires_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {invitations.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No invitations yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Member Progress */}
      {statuses.length > 0 && (
        <Card className="tech-card">
          <CardHeader>
            <CardTitle className="text-base">Member Progress ({statuses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Connection</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.profile?.full_name || s.profile?.email || s.user_id.slice(0, 8)}</TableCell>
                    <TableCell>{s.profile_completed ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell>{s.email_verified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell>{s.connection_invited ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell>{s.is_official ? <Badge className="bg-amber-400/20 text-amber-400 border-amber-400/30">Official</Badge> : <Badge variant="outline">Pending</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
