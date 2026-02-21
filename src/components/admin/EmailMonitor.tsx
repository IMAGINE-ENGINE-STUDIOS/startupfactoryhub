import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Mail, Send, CheckCircle, XCircle, Loader2, Bell, Users,
  Handshake, Calendar, UserCheck, RefreshCw, Zap, AlertCircle
} from 'lucide-react';

const EMAIL_TYPES = [
  {
    id: 'notification',
    label: 'Notification Email',
    icon: <Bell className="h-4 w-4" />,
    desc: 'General platform notification (connection, message, event, etc.)',
    fields: ['to', 'title', 'message', 'type'],
  },
  {
    id: 'invitation',
    label: 'Application Invitation',
    icon: <UserCheck className="h-4 w-4" />,
    desc: 'Sent when a job applicant is selected',
    fields: ['email', 'token', 'applicationId', 'jobTitle', 'companyName'],
  },
  {
    id: 'weekly-digest',
    label: 'Weekly Digest',
    icon: <Calendar className="h-4 w-4" />,
    desc: 'Sends weekly digest of new members & resources to all users',
    fields: [],
  },
  {
    id: 'partnership',
    label: 'Partnership Announcement',
    icon: <Handshake className="h-4 w-4" />,
    desc: 'Announce a new partner to all users or specific emails',
    fields: ['partnerName', 'partnerLogo', 'partnerWebsite', 'partnerDescription', 'benefitsForStartups', 'ctaLabel', 'ctaUrl', 'targetEmails'],
  },
];

const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error', 'message', 'connection', 'event'];

interface SendResult {
  success: boolean;
  label: string;
  detail: string;
  ts: string;
}

const EmailMonitor = () => {
  const { toast } = useToast();
  const [activeType, setActiveType] = useState('notification');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[]>([]);

  // Notification fields
  const [notifTo, setNotifTo] = useState('');
  const [notifTitle, setNotifTitle] = useState('Test Notification from SFH Admin');
  const [notifMessage, setNotifMessage] = useState('This is a test notification email sent from the Startup Factory Hub admin dashboard.');
  const [notifType, setNotifType] = useState('info');
  const [notifActorName, setNotifActorName] = useState('');
  const [notifActorAvatar, setNotifActorAvatar] = useState('');
  const [notifActorRole, setNotifActorRole] = useState('');

  // Invitation fields
  const [inviteTo, setInviteTo] = useState('');
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
  const [partnerCTAUrl, setPartnerCTAUrl] = useState('https://startupfactoryhub.lovable.app/dashboard');
  const [partnerTargetEmails, setPartnerTargetEmails] = useState('');

  const addResult = (success: boolean, label: string, detail: string) => {
    setResults(prev => [{
      success, label, detail,
      ts: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 20));
  };

  const sendNotification = async () => {
    if (!notifTo) { toast({ title: 'Enter recipient email', variant: 'destructive' }); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: { 
          to: notifTo, title: notifTitle, message: notifMessage, type: notifType,
          ...(notifActorName && { actorName: notifActorName }),
          ...(notifActorAvatar && { actorAvatarUrl: notifActorAvatar }),
          ...(notifActorRole && { actorRole: notifActorRole }),
        },
      });
      if (error) throw error;
      addResult(true, `Notification → ${notifTo}`, `Type: ${notifType} | ${notifTitle}`);
      toast({ title: '✅ Email sent!', description: `Notification delivered to ${notifTo}` });
    } catch (err: any) {
      addResult(false, `Notification → ${notifTo}`, err.message);
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    } finally { setSending(false); }
  };

  const sendInvitation = async () => {
    if (!inviteTo) { toast({ title: 'Enter recipient email', variant: 'destructive' }); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-application-invitation', {
        body: {
          email: inviteTo,
          token: inviteToken,
          applicationId: inviteAppId,
          jobTitle: inviteJobTitle,
          companyName: inviteCompany,
        },
      });
      if (error) throw error;
      addResult(true, `Invitation → ${inviteTo}`, `Job: ${inviteJobTitle} @ ${inviteCompany}`);
      toast({ title: '✅ Invitation sent!', description: `Invitation delivered to ${inviteTo}` });
    } catch (err: any) {
      addResult(false, `Invitation → ${inviteTo}`, err.message);
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    } finally { setSending(false); }
  };

  const sendWeeklyDigest = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('weekly-digest', { body: {} });
      if (error) throw error;
      addResult(true, `Weekly Digest → All Users`, `Sent: ${data?.sent || 0}, Errors: ${data?.errors || 0}`);
      toast({ title: '✅ Digest sent!', description: `Delivered to ${data?.sent || 0} users` });
    } catch (err: any) {
      addResult(false, 'Weekly Digest', err.message);
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    } finally { setSending(false); }
  };

  const sendPartnership = async () => {
    if (!partnerName || !partnerDesc) {
      toast({ title: 'Partner name & description are required', variant: 'destructive' }); return;
    }
    setSending(true);
    try {
      const benefits = partnerBenefits
        ? partnerBenefits.split('\n').map(b => b.trim()).filter(Boolean)
        : [];
      const targetEmails = partnerTargetEmails
        ? partnerTargetEmails.split(',').map(e => e.trim()).filter(Boolean)
        : undefined;

      const { data, error } = await supabase.functions.invoke('send-partnership-announcement', {
        body: {
          partnerName, partnerLogo, partnerWebsite,
          partnerDescription: partnerDesc,
          benefitsForStartups: benefits,
          ctaLabel: partnerCTALabel,
          ctaUrl: partnerCTAUrl,
          targetEmails,
        },
      });
      if (error) throw error;
      addResult(true, `Partnership: ${partnerName}`, `Sent: ${data?.sent || 0}`);
      toast({ title: '✅ Announcement sent!', description: `Delivered to ${data?.sent || 0} recipients` });
    } catch (err: any) {
      addResult(false, `Partnership: ${partnerName}`, err.message);
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    } finally { setSending(false); }
  };

  const handleSend = () => {
    if (activeType === 'notification') sendNotification();
    else if (activeType === 'invitation') sendInvitation();
    else if (activeType === 'weekly-digest') sendWeeklyDigest();
    else if (activeType === 'partnership') sendPartnership();
  };

  const currentType = EMAIL_TYPES.find(t => t.id === activeType)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Email System Monitor</h2>
          <p className="text-sm text-muted-foreground">Send, test, and monitor all platform email types</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Panel */}
        <div className="lg:col-span-2">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {currentType.icon}
                {currentType.label}
              </CardTitle>
              <CardDescription>{currentType.desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Notification */}
              {activeType === 'notification' && (
                <>
                  <div className="space-y-1">
                    <Label>Recipient Email *</Label>
                    <Input value={notifTo} onChange={e => setNotifTo(e.target.value)} placeholder="user@example.com" className="tech-card border-0" />
                  </div>
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

              {/* Invitation */}
              {activeType === 'invitation' && (
                <>
                  <div className="space-y-1">
                    <Label>Applicant Email *</Label>
                    <Input value={inviteTo} onChange={e => setInviteTo(e.target.value)} placeholder="applicant@example.com" className="tech-card border-0" />
                  </div>
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
                    <Textarea value={partnerDesc} onChange={e => setPartnerDesc(e.target.value)} rows={3} placeholder="Describe the partner and what they do..." className="tech-card border-0" />
                  </div>
                  <div className="space-y-1">
                    <Label>Benefits for Startups (one per line)</Label>
                    <Textarea value={partnerBenefits} onChange={e => setPartnerBenefits(e.target.value)} rows={3} placeholder="$5,000 in cloud credits&#10;Free 1:1 consulting sessions&#10;Priority access to events" className="tech-card border-0" />
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
                  <div className="space-y-1">
                    <Label>Target Emails (optional, comma-separated — leave empty to send to all)</Label>
                    <Input value={partnerTargetEmails} onChange={e => setPartnerTargetEmails(e.target.value)} placeholder="email1@example.com, email2@example.com" className="tech-card border-0" />
                  </div>
                </>
              )}

              <Button onClick={handleSend} disabled={sending} className="w-full" size="lg">
                {sending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                  : <><Send className="h-4 w-4 mr-2" /> Send {currentType.label}</>
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
                  <p className="text-xs mt-1">Send a test email to see results here</p>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
              { label: 'Connection Request', trigger: 'connections INSERT', type: 'connection', status: 'active' },
              { label: 'Connection Accepted', trigger: 'connections UPDATE (status=accepted)', type: 'success', status: 'active' },
              { label: 'New Message', trigger: 'messages INSERT', type: 'message', status: 'active' },
              { label: 'Mentorship Request', trigger: 'mentoring_sessions INSERT (pending)', type: 'info', status: 'active' },
              { label: 'Session Booked', trigger: 'mentoring_sessions INSERT', type: 'info', status: 'active' },
              { label: 'Cohort Acceptance', trigger: 'cohort_startups INSERT', type: 'success', status: 'active' },
              { label: 'Cohort Status Change', trigger: 'accelerator_cohorts UPDATE (status)', type: 'info', status: 'active' },
              { label: 'Job Application Received', trigger: 'job_applications INSERT', type: 'info', status: 'active' },
              { label: 'Application Status Update', trigger: 'job_applications UPDATE (status)', type: 'info', status: 'active' },
              { label: 'Event Registration', trigger: 'event_registrations INSERT', type: 'success', status: 'active' },
              { label: 'Account Verification', trigger: 'auth signup/magic-link', type: 'info', status: 'active' },
              { label: 'Password Reset', trigger: 'auth recovery', type: 'info', status: 'active' },
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
