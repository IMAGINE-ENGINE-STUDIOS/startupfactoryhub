import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Mail, Send, CheckCircle, XCircle, Loader2, Bell, Users,
  Handshake, Calendar, UserCheck, RefreshCw, Zap, AlertCircle,
  Search, CheckCheck, Rocket, Star, Gift
} from 'lucide-react';

const EMAIL_TYPES = [
  {
    id: 'notification',
    label: 'Notification Email',
    icon: <Bell className="h-4 w-4" />,
    desc: 'General platform notification (connection, message, event, etc.)',
  },
  {
    id: 'artemis-invite',
    label: 'Artemis Watch Party',
    icon: <Rocket className="h-4 w-4" />,
    desc: 'Individual invitation to the Artemis II Watch Party event',
  },
  {
    id: 'invitation',
    label: 'Application Invitation',
    icon: <UserCheck className="h-4 w-4" />,
    desc: 'Sent when a job applicant is selected',
  },
  {
    id: 'weekly-digest',
    label: 'Weekly Digest',
    icon: <Calendar className="h-4 w-4" />,
    desc: 'Sends weekly digest of new members & resources to all users',
  },
  {
    id: 'partnership',
    label: 'Partnership Announcement',
    icon: <Handshake className="h-4 w-4" />,
    desc: 'Announce a new partner to all users or specific emails',
  },
  {
    id: 'weekly-welcome',
    label: 'Weekly Welcome',
    icon: <Rocket className="h-4 w-4" />,
    desc: 'Welcome email with IWG & HSBC partnership highlights',
  },
  {
    id: 'hot-deals-feedback',
    label: 'Hot Deals Feedback Invite',
    icon: <Star className="h-4 w-4" />,
    desc: 'Invite participants to rate the Hot Deals event (1:1 transactional)',
  },
  {
    id: 'referral-invite',
    label: 'Referral Invite',
    icon: <Gift className="h-4 w-4" />,
    desc: 'Invite users to join the Referral Program and earn 20% commission',
  },
];

const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error', 'message', 'connection', 'event'];

interface PlatformUser {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface SendResult {
  success: boolean;
  label: string;
  detail: string;
  ts: string;
}

const EmailMonitor = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'compose' | 'recipients'>('recipients');
  const [activeType, setActiveType] = useState('notification');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[]>([]);

  // Recipients state
  const [platformUsers, setPlatformUsers] = useState<PlatformUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Notification fields
  const [notifTitle, setNotifTitle] = useState('Test Notification from SFH Admin');
  const [notifMessage, setNotifMessage] = useState('This is a test notification email sent from the Startup Factory Hub admin dashboard.');
  const [notifType, setNotifType] = useState('info');
  const [notifActorName, setNotifActorName] = useState('');
  const [notifActorAvatar, setNotifActorAvatar] = useState('');
  const [notifActorRole, setNotifActorRole] = useState('');

  // Invitation fields
  const [inviteToken, setInviteToken] = useState('test-token-' + Math.random().toString(36).slice(2, 10));
  const [inviteAppId, setInviteAppId] = useState('test-app-001');
  const [inviteJobTitle, setInviteJobTitle] = useState('Full Stack Developer');
  const [inviteCompany, setInviteCompany] = useState('Startup Factory Hub');

  // Partnership fields
  const [partnerName, setPartnerName] = useState('');
  const [partnerLogo, setPartnerLogo] = useState('');
  const [partnerWebsite, setPartnerWebsite] = useState('');
  const [partnerDesc, setPartnerDesc] = useState('');
  const [partnerBenefits, setPartnerBenefits] = useState('');
  const [partnerCTALabel, setPartnerCTALabel] = useState('Learn More');
  const [partnerCTAUrl, setPartnerCTAUrl] = useState('https://startupfactoryhub.com');

  // Fetch all platform users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, avatar_url')
        .not('email', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPlatformUsers((data || []).filter(u => u.email));
    } catch (err: any) {
      toast({ title: 'Failed to load users', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filteredUsers = useMemo(() => {
    let users = platformUsers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      users = users.filter(u =>
        u.email?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q)
      );
    }
    return users;
  }, [platformUsers, searchQuery, roleFilter]);

  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedEmails.has(u.email));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const newSet = new Set(selectedEmails);
      filteredUsers.forEach(u => newSet.delete(u.email));
      setSelectedEmails(newSet);
    } else {
      const newSet = new Set(selectedEmails);
      filteredUsers.forEach(u => newSet.add(u.email));
      setSelectedEmails(newSet);
    }
  };

  const toggleUser = (email: string) => {
    const newSet = new Set(selectedEmails);
    if (newSet.has(email)) newSet.delete(email);
    else newSet.add(email);
    setSelectedEmails(newSet);
  };

  const addResult = (success: boolean, label: string, detail: string) => {
    setResults(prev => [{ success, label, detail, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
  };

  const getRecipients = (): string[] => Array.from(selectedEmails);

  const sendToRecipients = async () => {
    const recipients = getRecipients();
    if (recipients.length === 0) {
      toast({ title: 'No recipients selected', description: 'Select at least one recipient from the Recipients tab.', variant: 'destructive' });
      return;
    }

    setSending(true);

    if (activeType === 'notification') {
      let successCount = 0;
      let failCount = 0;
      for (const email of recipients) {
        try {
          const { error } = await supabase.functions.invoke('send-notification-email', {
            body: {
              to: email, title: notifTitle, message: notifMessage, type: notifType,
              ...(notifActorName && { actorName: notifActorName }),
              ...(notifActorAvatar && { actorAvatarUrl: notifActorAvatar }),
              ...(notifActorRole && { actorRole: notifActorRole }),
            },
          });
          if (error) throw error;
          successCount++;
        } catch {
          failCount++;
        }
      }
      addResult(failCount === 0, `Notification → ${recipients.length} recipients`, `Sent: ${successCount}, Failed: ${failCount}`);
      toast({ title: `✅ Sent to ${successCount}/${recipients.length} recipients` });
    } else if (activeType === 'artemis-invite') {
      let successCount = 0;
      let failCount = 0;
      for (const email of recipients) {
        try {
          const user = platformUsers.find(u => u.email === email);
          const recipientName = user?.full_name || email.split('@')[0];
          const { error } = await supabase.functions.invoke('send-notification-email', {
            body: {
              to: email,
              title: '🚀 You\'re Invited to the Artemis II Watch Party!',
              message: `Hi ${recipientName}! You're personally invited to join the <strong>Artemis II Watch Party</strong> on Startup Factory Hub.<br><br>` +
                '🎥 <strong>Live NASA Stream</strong> — Watch the Artemis II mission in real-time<br>' +
                '📹 <strong>Community Video Room</strong> — Connect face-to-face with up to 200 attendees<br>' +
                '🎮 <strong>Space Arcade</strong> — Play space-themed games while you wait<br>' +
                '🌍 <strong>3D Space Explorer</strong> — Explore NASA spacecraft models<br>' +
                '💬 <strong>Live Chat</strong> — Share the excitement with the community<br><br>' +
                'Join us for this historic moment! Click the button below to access the Watch Party.',
              type: 'event',
              actorName: 'Startup Factory Hub',
              actorRole: 'platform',
              recipientName: recipientName,
              ctaUrl: 'https://startupfactoryhub.com/artemis-watch-party',
              ctaLabel: '🚀 Join the Watch Party',
            },
          });
          if (error) throw error;
          successCount++;
        } catch {
          failCount++;
        }
      }
      addResult(failCount === 0, `Artemis Invite → ${recipients.length} recipients`, `Sent: ${successCount}, Failed: ${failCount}`);
      toast({ title: `✅ Artemis invitations sent to ${successCount}/${recipients.length} recipients` });
    } else if (activeType === 'invitation') {
      let successCount = 0;
      let failCount = 0;
      for (const email of recipients) {
        try {
          const { error } = await supabase.functions.invoke('send-application-invitation', {
            body: { email, token: inviteToken, applicationId: inviteAppId, jobTitle: inviteJobTitle, companyName: inviteCompany },
          });
          if (error) throw error;
          successCount++;
        } catch {
          failCount++;
        }
      }
      addResult(failCount === 0, `Invitation → ${recipients.length} recipients`, `Sent: ${successCount}, Failed: ${failCount}`);
      toast({ title: `✅ Sent to ${successCount}/${recipients.length} recipients` });
    } else if (activeType === 'weekly-digest') {
      try {
        const { data, error } = await supabase.functions.invoke('weekly-digest', { body: {} });
        if (error) throw error;
        addResult(true, 'Weekly Digest → All Users', `Sent: ${data?.sent || 0}, Errors: ${data?.errors || 0}`);
        toast({ title: '✅ Digest sent!', description: `Delivered to ${data?.sent || 0} users` });
      } catch (err: any) {
        addResult(false, 'Weekly Digest', err.message);
        toast({ title: 'Failed', description: err.message, variant: 'destructive' });
      }
    } else if (activeType === 'weekly-welcome') {
      try {
        const { data, error } = await supabase.functions.invoke('send-weekly-welcome', {
          body: { targetEmails: recipients },
        });
        if (error) throw error;
        addResult(true, `Weekly Welcome → ${recipients.length} recipients`, `Sent: ${data?.sent || 0}, Errors: ${data?.errors || 0}`);
        toast({ title: '✅ Weekly Welcome sent!', description: `Delivered to ${data?.sent || 0} recipients` });
      } catch (err: any) {
        addResult(false, 'Weekly Welcome', err.message);
        toast({ title: 'Failed', description: err.message, variant: 'destructive' });
      }
    } else if (activeType === 'partnership') {
      if (!partnerName || !partnerDesc) {
        toast({ title: 'Partner name & description are required', variant: 'destructive' });
        setSending(false);
        return;
      }
      try {
        const benefits = partnerBenefits ? partnerBenefits.split('\n').map(b => b.trim()).filter(Boolean) : [];
        const { data, error } = await supabase.functions.invoke('send-partnership-announcement', {
          body: {
            partnerName, partnerLogo, partnerWebsite,
            partnerDescription: partnerDesc,
            benefitsForStartups: benefits,
            ctaLabel: partnerCTALabel,
            ctaUrl: partnerCTAUrl,
            targetEmails: recipients,
          },
        });
        if (error) throw error;
        addResult(true, `Partnership: ${partnerName}`, `Sent: ${data?.sent || 0}`);
        toast({ title: '✅ Announcement sent!', description: `Delivered to ${data?.sent || 0} recipients` });
      } catch (err: any) {
        addResult(false, `Partnership: ${partnerName}`, err.message);
        toast({ title: 'Failed', description: err.message, variant: 'destructive' });
      }
    } else if (activeType === 'hot-deals-feedback') {
      let successCount = 0;
      let failCount = 0;
      for (const email of recipients) {
        try {
          const user = platformUsers.find(u => u.email === email);
          const recipientName = user?.full_name || undefined;
          const { error } = await supabase.functions.invoke('send-hot-deals-feedback-invite', {
            body: { to: email, recipientName },
          });
          if (error) throw error;
          successCount++;
        } catch {
          failCount++;
        }
        // small throttle to protect deliverability
        await new Promise((r) => setTimeout(r, 250));
      }
      addResult(failCount === 0, `Hot Deals Feedback → ${recipients.length} recipients`, `Sent: ${successCount}, Failed: ${failCount}`);
      toast({ title: `✅ Feedback invites sent to ${successCount}/${recipients.length} recipients` });
    } else if (activeType === 'referral-invite') {
      try {
        const { data, error } = await supabase.functions.invoke('send-referral-invite-email', {
          body: { targetEmails: recipients },
        });
        if (error) throw error;
        addResult(true, `Referral Invite → ${recipients.length} recipients`, `Sent: ${data?.sent || 0}, Errors: ${data?.errors || 0}`);
        toast({ title: `✅ Referral invites sent`, description: `Delivered to ${data?.sent || 0}/${recipients.length} recipients` });
      } catch (err: any) {
        addResult(false, 'Referral Invite', err.message);
        toast({ title: 'Failed', description: err.message, variant: 'destructive' });
      }
    }

    setSending(false);
  };

  const currentType = EMAIL_TYPES.find(t => t.id === activeType)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Email Command Center</h2>
            <p className="text-sm text-muted-foreground">Select recipients, compose emails, and send to your platform users</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Users className="h-3 w-3 mr-1" />
            {platformUsers.length} users
          </Badge>
          <Badge variant="outline" className={`${selectedEmails.size > 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-muted text-muted-foreground'}`}>
            <CheckCheck className="h-3 w-3 mr-1" />
            {selectedEmails.size} selected
          </Badge>
        </div>
      </div>

      {/* Email Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {EMAIL_TYPES.map(t => (
          <Card key={t.id} className={`tech-card border-0 cursor-pointer transition-all ${activeType === t.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setActiveType(t.id)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeType === t.id ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                {t.icon}
              </div>
              <div>
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.id === 'weekly-digest' ? 'Blast to all' : t.id === 'partnership' ? 'Announcement' : 'Transactional'}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2">
        <Button variant={activeTab === 'recipients' ? 'default' : 'outline'} onClick={() => setActiveTab('recipients')} className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Recipients ({selectedEmails.size})
        </Button>
        <Button variant={activeTab === 'compose' ? 'default' : 'outline'} onClick={() => setActiveTab('compose')} className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          Compose & Send
        </Button>
      </div>

      {/* Recipients Tab */}
      {activeTab === 'recipients' && (
        <Card className="tech-card border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Platform Recipients
                </CardTitle>
                <CardDescription>Select users to receive your email. {filteredUsers.length} users shown.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loadingUsers}>
                  <RefreshCw className={`h-3 w-3 mr-1 ${loadingUsers ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setSelectedEmails(new Set(platformUsers.map(u => u.email))); }}>
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Select All ({platformUsers.length})
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedEmails(new Set())}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 tech-card border-0"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading users...</span>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow key={user.user_id} className="cursor-pointer" onClick={() => toggleUser(user.email)}>
                        <TableCell>
                          <Checkbox
                            checked={selectedEmails.has(user.email)}
                            onCheckedChange={() => toggleUser(user.email)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {(user.full_name || user.email)?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-medium">{user.full_name || 'Unnamed'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {currentType.icon}
                  {currentType.label}
                </CardTitle>
                <CardDescription>{currentType.desc}</CardDescription>
                {selectedEmails.size > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <Users className="h-3 w-3 mr-1" />
                      Sending to {selectedEmails.size} recipient{selectedEmails.size !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Notification */}
                {activeType === 'notification' && (
                  <>
                    <div className="space-y-1">
                      <Label>Notification Type</Label>
                      <Select value={notifType} onValueChange={setNotifType}>
                        <SelectTrigger className="tech-card border-0"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {NOTIFICATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Subject / Title *</Label>
                      <Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="tech-card border-0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Message *</Label>
                      <Textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} rows={3} className="tech-card border-0" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Actor Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                        <Input value={notifActorName} onChange={e => setNotifActorName(e.target.value)} placeholder="e.g. John Doe" className="tech-card border-0" />
                      </div>
                      <div className="space-y-1">
                        <Label>Actor Role <span className="text-muted-foreground text-xs">(optional)</span></Label>
                        <Input value={notifActorRole} onChange={e => setNotifActorRole(e.target.value)} placeholder="e.g. mentor, investor" className="tech-card border-0" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Actor Avatar URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input value={notifActorAvatar} onChange={e => setNotifActorAvatar(e.target.value)} placeholder="https://..." className="tech-card border-0" />
                    </div>
                  </>
                )}

                {/* Artemis Watch Party Invite */}
                {activeType === 'artemis-invite' && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Rocket className="h-4 w-4" />
                      Artemis II Watch Party — Individual Invitation
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Send a personalized invitation to each selected user. Each email includes the event features (Live Stream, Video Room, Arcade, 3D Explorer, Chat) and a direct CTA to join the Watch Party.
                    </p>
                    <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
                      <p className="text-xs font-medium text-foreground">📧 Email Preview:</p>
                      <p className="text-xs text-muted-foreground"><strong>Subject:</strong> 🚀 You're Invited to the Artemis II Watch Party!</p>
                      <p className="text-xs text-muted-foreground"><strong>From:</strong> Startup Factory Hub</p>
                      <p className="text-xs text-muted-foreground"><strong>CTA:</strong> "Join the Watch Party" → /artemis-watch-party</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      Each email is sent individually — personalized with the recipient's name.
                    </div>
                  </div>
                )}

                {/* Invitation */}
                {activeType === 'invitation' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Job Title</Label>
                        <Input value={inviteJobTitle} onChange={e => setInviteJobTitle(e.target.value)} className="tech-card border-0" />
                      </div>
                      <div className="space-y-1">
                        <Label>Company Name</Label>
                        <Input value={inviteCompany} onChange={e => setInviteCompany(e.target.value)} className="tech-card border-0" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Invitation Token</Label>
                      <Input value={inviteToken} onChange={e => setInviteToken(e.target.value)} className="tech-card border-0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Application ID</Label>
                      <Input value={inviteAppId} onChange={e => setInviteAppId(e.target.value)} className="tech-card border-0" />
                    </div>
                  </>
                )}

                {/* Weekly Digest */}
                {activeType === 'weekly-digest' && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Zap className="h-4 w-4" />
                      Blast to All Platform Users
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This will send a personalized weekly digest to every user on the platform summarizing new members, resources, and events from the past 7 days.
                    </p>
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      This action sends emails to all users — use carefully.
                    </div>
                  </div>
                )}

                {/* Weekly Welcome */}
                {activeType === 'weekly-welcome' && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Rocket className="h-4 w-4" />
                      Weekly Welcome — IWG & HSBC Partnership
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sends the branded welcome email featuring IWG office spaces (130+ countries) and HSBC Innovation Banking (free accounts in USA) to your selected recipients.
                    </p>
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Emails will be personalized with each recipient's name.
                    </div>
                  </div>
                )}

                {activeType === 'hot-deals-feedback' && (
                  <div className="rounded-lg bg-orange-500/5 border border-orange-500/20 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-orange-400 font-semibold">
                      <Star className="h-4 w-4" />
                      Hot Deals Feedback Invite
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sends a personalized 1:1 invite asking each selected recipient to rate the Hot Deals event (anonymous, ~30 seconds).
                      Each email is transactional and addressed individually — no bulk lists.
                    </p>
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Sends are throttled (250ms between recipients) to protect deliverability.
                    </div>
                  </div>
                )}

                {/* Referral Invite */}
                {activeType === 'referral-invite' && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Gift className="h-4 w-4" />
                      Referral Program Invitation — Earn 20% Commission
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sends a personalized 1:1 invitation to each selected recipient to join the Referral Program. The email walks them through the 3 steps:
                      apply &amp; get approved → connect their Stripe payout account → get their unique referral link.
                    </p>
                    <div className="rounded-lg bg-secondary/50 p-3 space-y-1.5">
                      <p className="text-xs font-medium text-foreground">📧 Email preview</p>
                      <p className="text-xs text-muted-foreground"><strong>Subject:</strong> Earn 20% commission — refer startups to Startup Factory Hub</p>
                      <p className="text-xs text-muted-foreground"><strong>From:</strong> Startup Factory Hub &lt;info@startupfactoryhub.com&gt;</p>
                      <p className="text-xs text-muted-foreground"><strong>CTA:</strong> "Apply to the Referral Program →" → /referral</p>
                      <p className="text-xs text-muted-foreground"><strong>Includes:</strong> Hero (20% commission), 3-step how-to (apply / connect Stripe / get unique link), full commission table by tier, Official Mentor 25% note.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      Each email is sent individually and personalized with the recipient's name.
                    </div>
                  </div>
                )}

                {/* Partnership */}
                {activeType === 'partnership' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Partner Name *</Label>
                        <Input value={partnerName} onChange={e => setPartnerName(e.target.value)} placeholder="e.g. Google for Startups" className="tech-card border-0" />
                      </div>
                      <div className="space-y-1">
                        <Label>Partner Website</Label>
                        <Input value={partnerWebsite} onChange={e => setPartnerWebsite(e.target.value)} placeholder="https://..." className="tech-card border-0" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Partner Logo URL</Label>
                      <Input value={partnerLogo} onChange={e => setPartnerLogo(e.target.value)} placeholder="https://..." className="tech-card border-0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Partner Description *</Label>
                      <Textarea value={partnerDesc} onChange={e => setPartnerDesc(e.target.value)} rows={3} placeholder="Describe the partner..." className="tech-card border-0" />
                    </div>
                    <div className="space-y-1">
                      <Label>Benefits for Startups (one per line)</Label>
                      <Textarea value={partnerBenefits} onChange={e => setPartnerBenefits(e.target.value)} rows={3} placeholder="$5,000 in cloud credits&#10;Free consulting" className="tech-card border-0" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>CTA Button Label</Label>
                        <Input value={partnerCTALabel} onChange={e => setPartnerCTALabel(e.target.value)} className="tech-card border-0" />
                      </div>
                      <div className="space-y-1">
                        <Label>CTA URL</Label>
                        <Input value={partnerCTAUrl} onChange={e => setPartnerCTAUrl(e.target.value)} className="tech-card border-0" />
                      </div>
                    </div>
                  </>
                )}

                <Button onClick={sendToRecipients} disabled={sending} className="w-full" size="lg">
                  {sending
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending to {selectedEmails.size} recipients...</>
                    : <><Send className="h-4 w-4 mr-2" /> Send {currentType.label} to {selectedEmails.size} recipient{selectedEmails.size !== 1 ? 's' : ''}</>
                  }
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Send Log */}
          <div>
            <Card className="tech-card border-0 h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Send Log</span>
                  {results.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setResults([])} className="text-xs h-6 px-2">Clear</Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No emails sent yet</p>
                    <p className="text-xs mt-1">Send an email to see results here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {results.map((r, i) => (
                        <div key={i} className={`rounded-lg p-3 border ${r.success ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                          <div className="flex items-start gap-2">
                            {r.success
                              ? <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                              : <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                            }
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{r.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 break-words">{r.detail}</p>
                              <p className="text-xs text-muted-foreground mt-1">{r.ts}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Automatic Trigger Reference */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Automatic Email Triggers (Active)
          </CardTitle>
          <CardDescription>These emails fire automatically from database events — no action needed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Connection Request', trigger: 'connections INSERT', status: 'active' },
              { label: 'Connection Accepted', trigger: 'connections UPDATE (status=accepted)', status: 'active' },
              { label: 'New Message', trigger: 'messages INSERT', status: 'active' },
              { label: 'Mentorship Request', trigger: 'mentoring_sessions INSERT (pending)', status: 'active' },
              { label: 'Session Booked', trigger: 'mentoring_sessions INSERT', status: 'active' },
              { label: 'Cohort Acceptance', trigger: 'cohort_startups INSERT', status: 'active' },
              { label: 'Cohort Status Change', trigger: 'accelerator_cohorts UPDATE (status)', status: 'active' },
              { label: 'Job Application Received', trigger: 'job_applications INSERT', status: 'active' },
              { label: 'Application Status Update', trigger: 'job_applications UPDATE (status)', status: 'active' },
              { label: 'Event Registration', trigger: 'event_registrations INSERT', status: 'active' },
              { label: 'Account Verification', trigger: 'auth signup/magic-link', status: 'active' },
              { label: 'Password Reset', trigger: 'auth recovery', status: 'active' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.trigger}</p>
                  <Badge variant="outline" className="text-xs mt-1 bg-green-500/10 text-green-400 border-green-500/20">
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailMonitor;
