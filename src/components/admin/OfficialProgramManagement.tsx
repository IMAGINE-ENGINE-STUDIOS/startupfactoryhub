import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Send, Loader2, CheckCircle, Circle, Clock, Search, UserPlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

interface PlatformMentor {
  user_id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
}

export default function OfficialProgramManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<PlatformMentor[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<Set<string>>(new Set());
  const [mentorSearch, setMentorSearch] = useState('');
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);

  useEffect(() => {
    fetchData();
    fetchMentorsAndAdvisors();
  }, []);

  const fetchMentorsAndAdvisors = async () => {
    setLoadingMentors(true);
    try {
      // Get all mentor and advisor user_ids from user_roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['mentor', 'advisor']);

      if (!roles || roles.length === 0) {
        setMentors([]);
        setLoadingMentors(false);
        return;
      }

      const userIds = roles.map(r => r.user_id);
      const roleMap = new Map(roles.map(r => [r.user_id, r.role]));

      // Get profiles for these users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      if (profiles) {
        const mentorList: PlatformMentor[] = profiles.map(p => ({
          user_id: p.user_id,
          full_name: p.full_name,
          email: p.email || '',
          avatar_url: p.avatar_url,
          role: roleMap.get(p.user_id) || 'mentor',
        }));
        setMentors(mentorList);
      }
    } catch (err) {
      console.error('Error fetching mentors:', err);
    }
    setLoadingMentors(false);
  };

  const fetchData = async () => {
    const [invRes, statusRes] = await Promise.all([
      supabase.from('official_mentor_invitations').select('*').order('created_at', { ascending: false }),
      supabase.from('official_mentor_status').select('*').order('created_at', { ascending: false }),
    ]);
    setInvitations(invRes.data || []);
    setStatuses(statusRes.data || []);

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

  const sendBulkInvitations = async () => {
    if (selectedMentors.size === 0) return;
    setBulkSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const odId of selectedMentors) {
      const mentor = mentors.find(m => m.user_id === odId);
      if (!mentor?.email) { failCount++; continue; }
      try {
        const { error } = await supabase.functions.invoke('send-official-mentor-invite', {
          body: { email: mentor.email, message: message.trim() || undefined },
        });
        if (error) throw error;
        successCount++;
      } catch {
        failCount++;
      }
    }

    toast({
      title: 'Bulk Invitations Complete',
      description: `${successCount} sent, ${failCount} failed`,
      variant: failCount > 0 ? 'destructive' : 'default',
    });
    setSelectedMentors(new Set());
    setMessage('');
    fetchData();
    setBulkSending(false);
  };

  // Filter mentors by search & exclude already invited emails
  const invitedEmails = new Set(invitations.map((inv: any) => inv.email?.toLowerCase()));
  const filteredMentors = useMemo(() => {
    return mentors.filter(m => {
      const matchesSearch = !mentorSearch ||
        (m.full_name || '').toLowerCase().includes(mentorSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(mentorSearch.toLowerCase());
      return matchesSearch;
    });
  }, [mentors, mentorSearch]);

  const toggleMentor = (userId: string) => {
    setSelectedMentors(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const selectAll = () => {
    const allIds = filteredMentors.map(m => m.user_id);
    setSelectedMentors(new Set(allIds));
  };

  const clearSelection = () => setSelectedMentors(new Set());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Accepted</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      default: return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Select from Platform Mentors/Advisors */}
      <Card className="tech-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-amber-400" />
            Select Mentors & Advisors to Invite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={mentorSearch}
                onChange={(e) => setMentorSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="outline" size="sm" onClick={clearSelection} disabled={selectedMentors.size === 0}>
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
          </div>

          {selectedMentors.size > 0 && (
            <p className="text-sm text-muted-foreground">{selectedMentors.size} selected</p>
          )}

          {loadingMentors ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[280px] border rounded-md">
              <div className="divide-y divide-border">
                {filteredMentors.map((m) => {
                  const alreadyInvited = invitedEmails.has(m.email.toLowerCase());
                  return (
                    <label
                      key={m.user_id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors ${alreadyInvited ? 'opacity-50' : ''}`}
                    >
                      <Checkbox
                        checked={selectedMentors.has(m.user_id)}
                        onCheckedChange={() => toggleMentor(m.user_id)}
                        disabled={alreadyInvited}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={m.avatar_url || ''} />
                        <AvatarFallback className="text-xs">{(m.full_name || m.email)?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.full_name || 'No name'}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize shrink-0">{m.role}</Badge>
                      {alreadyInvited && <Badge variant="secondary" className="text-xs shrink-0">Invited</Badge>}
                    </label>
                  );
                })}
                {filteredMentors.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">No mentors or advisors found</p>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="space-y-2">
            <Label>Personal Message (optional)</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="We'd love to have you as an official mentor..." rows={2} />
          </div>

          <Button onClick={sendBulkInvitations} disabled={bulkSending || selectedMentors.size === 0}>
            {bulkSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send {selectedMentors.size > 0 ? `${selectedMentors.size} Invitation${selectedMentors.size > 1 ? 's' : ''}` : 'Invitations'}
          </Button>
        </CardContent>
      </Card>

      {/* Manual Email Invitation */}
      <Card className="tech-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-400" />
            Manual Email Invitation
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
