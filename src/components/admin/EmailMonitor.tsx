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
import { ProductUpdateBroadcast } from '@/components/admin/ProductUpdateBroadcast';
import { ScheduledEmailsPanel } from '@/components/admin/ScheduledEmailsPanel';
import { WeeklyNewsletterPanel } from '@/components/admin/WeeklyNewsletterPanel';
import { UnsubscribesPanel } from '@/components/admin/UnsubscribesPanel';
import { UnverifiedUsersPanel } from '@/components/admin/UnverifiedUsersPanel';


import {
  Mail, Send, CheckCircle, XCircle, Loader2, Bell, Users,
  Handshake, Calendar, UserCheck, RefreshCw, Zap, AlertCircle,
  Search, CheckCheck, Rocket, Star, Gift, TrendingUp, Megaphone, CalendarClock
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
  {
    id: 'investor-update',
    label: 'Investor Activity Update',
    icon: <TrendingUp className="h-4 w-4" />,
    desc: '1:1 investor activity update — active investors looking to invest',
  },
  {
    id: 'product-update',
    label: 'Product Update (What\'s New)',
    icon: <Megaphone className="h-4 w-4" />,
    desc: 'Send the "What\'s New" product update email to selected recipients',
  },
  {
    id: 'mvp-program',
    label: 'MVP Development Program',
    icon: <Megaphone className="h-4 w-4" />,
    desc: 'Program benefits, seats, deadline and apply link — sent to selected recipients',
  },
  {
    id: 'mvp-welcome',
    label: 'MVP Program Welcome',
    icon: <Rocket className="h-4 w-4" />,
    desc: 'Welcome email with application link, program cost and Calendly — sent to selected recipients',
  },
  {
    id: 'mvp-interview-invite',
    label: 'MVP Interview Invite',
    icon: <CalendarClock className="h-4 w-4" />,
    desc: '"We reviewed your application" — 1:1 interview invitation with Calendly link',
  },
  {
    id: 'mvp-acceptance',
    label: 'MVP Acceptance + Payment',
    icon: <CheckCircle className="h-4 w-4" />,
    desc: 'Send acceptance email with a Stripe payment link for the MVP program fee',
  },
  {
    id: 'mvp-payment-reminder',
    label: 'MVP Payment Reminder',
    icon: <RefreshCw className="h-4 w-4" />,
    desc: 'Follow-up email for accepted MVP startups that have not paid yet',
  },
  {
    id: 'mvp-no-show',
    label: 'MVP No-Show Follow-Up',
    icon: <AlertCircle className="h-4 w-4" />,
    desc: '"Sorry we missed you" email for startups that missed their MVP interview',
  },
  {
    id: 'af-welcome',
    label: 'AF Welcome',
    icon: <Rocket className="h-4 w-4" />,
    desc: 'Welcome email after email verification with direct Accelerated Fundraising application link',
  },
  {
    id: 'af-acceptance',
    label: 'AF Acceptance',
    icon: <CheckCircle className="h-4 w-4" />,
    desc: 'Acceptance email for the Accelerated Fundraising investor-matching batch',
  },
  {
    id: 'af-follow-up',
    label: 'AF Follow-Up',
    icon: <RefreshCw className="h-4 w-4" />,
    desc: 'Reminder for accepted AF startups that have not completed onboarding',
  },
  {
    id: 'af-no-show',
    label: 'AF No-Show Follow-Up',
    icon: <AlertCircle className="h-4 w-4" />,
    desc: '"Sorry we missed you" email for AF interview no-shows',
  },
  {
    id: 'moonshotnx-partnership',
    label: 'Partnership — MoonshotNX',
    icon: <Handshake className="h-4 w-4" />,
    desc: 'Announce the Startup Factory Hub × MoonshotNX partnership (M1 Grant + Fundraising Sprint)',
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

  // Investor update fields
  const [investorCount, setInvestorCount] = useState(200);
  const [investorHeadline, setInvestorHeadline] = useState('');

  // Scheduling
  const [scheduleAt, setScheduleAt] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [scheduleRefresh, setScheduleRefresh] = useState(0);

  // MVP / AF program email fields
  const [programEmailName, setProgramEmailName] = useState('Founder');
  const [programEmailStartup, setProgramEmailStartup] = useState('Your startup');
  const [programEmailCohort, setProgramEmailCohort] = useState('');
  const [programEmailInterviewDate, setProgramEmailInterviewDate] = useState('');
  const [programEmailDeadline, setProgramEmailDeadline] = useState('September 29, 2026');
  const [programEmailRescheduleUrl, setProgramEmailRescheduleUrl] = useState('');
  const [programEmailApplyUrl, setProgramEmailApplyUrl] = useState('');
  const [programEmailAmountCents, setProgramEmailAmountCents] = useState(500000);



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
    } else if (activeType === 'investor-update') {
      try {
        const { data, error } = await supabase.functions.invoke('send-investor-update', {
          body: {
            targetEmails: recipients,
            investorCount,
            headline: investorHeadline || undefined,
          },
        });
        if (error) throw error;
        addResult(true, `Investor Update → ${recipients.length} recipients`, `Sent: ${data?.sent || 0}, Errors: ${data?.errors || 0}`);
        toast({ title: `✅ Investor updates sent`, description: `Delivered to ${data?.sent || 0}/${recipients.length} recipients` });
      } catch (err: any) {
        addResult(false, 'Investor Update', err.message);
        toast({ title: 'Failed', description: err.message, variant: 'destructive' });
      }
    } else if (activeType === 'mvp-program') {
      try {
        const { data, error } = await supabase.functions.invoke('send-mvp-program', {
          body: { targetEmails: recipients },
        });
        if (error) throw error;
        addResult(true, `MVP Program → ${recipients.length} recipients`, `Sent: ${data?.sent || 0}, Errors: ${data?.errors || 0}`);
        toast({ title: '✅ MVP Program email sent', description: `Delivered to ${data?.sent || 0}/${recipients.length} recipients` });
      } catch (err: any) {
        addResult(false, 'MVP Program', err.message);
        toast({ title: 'Failed', description: err.message, variant: 'destructive' });
      }
    } else if (activeType === 'mvp-welcome') {
      let successCount = 0;
      let failCount = 0;
      for (const to of recipients) {
        try {
          const { error } = await supabase.functions.invoke('send-mvp-welcome', {
            body: { email: to },
          });
          if (error) throw error;
          successCount++;
        } catch (err: any) {
          failCount++;
          console.error('MVP welcome failed for', to, err);
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      addResult(failCount === 0, `MVP Welcome → ${recipients.length} recipients`, `Sent: ${successCount}, Failed: ${failCount}`);
      toast({ title: `✅ MVP Welcome sent`, description: `Delivered to ${successCount}/${recipients.length} recipients` });
    } else if (activeType === 'mvp-interview-invite') {
      let successCount = 0;
      let failCount = 0;
      for (const to of recipients) {
        try {
          const { error } = await supabase.functions.invoke('send-mvp-interview-invite', {
            body: { email: to },
          });
          if (error) throw error;
          successCount++;
        } catch (err: any) {
          failCount++;
          console.error('MVP interview invite failed for', to, err);
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      addResult(failCount === 0, `MVP Interview Invite → ${recipients.length} recipients`, `Sent: ${successCount}, Failed: ${failCount}`);
      toast({ title: `✅ MVP Interview Invite sent`, description: `Delivered to ${successCount}/${recipients.length} recipients` });
    } else if (activeType === 'mvp-acceptance') {
      let successCount = 0;
      let failCount = 0;
      for (const to of recipients) {
        try {
          const { error } = await supabase.functions.invoke('send-mvp-acceptance-email', {
            body: {
              email: to,
              name: programEmailName,
              startupName: programEmailStartup,
              cohortName: programEmailCohort || 'MVP Program',
              amountCents: programEmailAmountCents,
            },
          });
          if (error) throw error;
          successCount++;
        } catch (err: any) {
          failCount++;
          console.error('MVP acceptance failed for', to, err);
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      addResult(failCount === 0, `MVP Acceptance → ${recipients.length} recipients`, `Sent: ${successCount}, Failed: ${failCount}`);
      toast({ title: `✅ MVP Acceptance sent`, description: `Delivered to ${successCount}/${recipients.length} recipients` });
    } else if (activeType === 'mvp-payment-reminder') {
      let successCount = 0;
      let failCount = 0;
      for (const to of recipients) {
        try {
          const { error } = await supabase.functions.invoke('send-mvp-payment-reminder', {
            body: {
              email: to,
              name: programEmailName,
              startupName: programEmailStartup,
              cohortName: programEmailCohort || 'MVP Program',
              deadline: programEmailDeadline,
              amountCents: programEmailAmountCents,
            },
          });
          if (error) throw error;
          successCount++;
        } catch (err: any) {
          failCount++;
          console.error('MVP payment reminder failed for', to, err);
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      addResult(failCount === 0, `MVP Payment Reminder → ${recipients.length} recipients`, `Sent: ${successCount}, Failed: ${failCount}`);
      toast({ title: `✅ MVP Payment Reminder sent`, description: `Delivered to ${successCount}/${recipients.length} recipients` });
    } else if (activeType === 'mvp-no-show') {
      let successCount = 0;
      let failCount = 0;
      for (const to of recipients) {
        try {
          const { error } = await supabase.functions.invoke('send-mvp-no-show-email', {
            body: {
              email: to,
              name: programEmailName,
              startupName: programEmailStartup,
              cohortName: programEmailCohort || 'MVP Program',
              interviewDate: programEmailInterviewDate,
              rescheduleUrl: programEmailRescheduleUrl || undefined,
            },
          });
          if (error) throw error;
          successCount++;
        } catch (err: any) {
          failCount++;
          console.error('MVP no-show failed for', to, err);
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      addResult(failCount === 0, `MVP No-Show → ${recipients.length} recipients`, `Sent: ${successCount}, Failed: ${failCount}`);
      toast({ title: `✅ MVP No-Show follow-up sent`, description: `Delivered to ${successCount}/${recipients.length} recipients` });
    } else if (activeType === 'af-welcome') {
      let successCount = 0;
      let failCount = 0;
      for (const to of recipients) {
        try {
          const { error } = await supabase.functions.invoke('send-af-welcome', {
            body: {
              email: to,
              name: programEmailName,
              applyUrl: programEmailApplyUrl || undefined,
            },
          });
          if (error) throw error;
          successCount++;
        } catch (err: any) {
          failCount++;
          console.error('AF welcome failed for', to, err);
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      addResult(failCount === 0, `AF Welcome → ${recipients.length} recipients`, `Sent: ${successCount}, Failed: ${failCount}`);
      toast({ title: `✅ AF Welcome sent`, description: `Delivered to ${successCount}/${recipients.length} recipients` });
    } else if (activeType === 'af-acceptance') {
      let successCount = 0;
      let failCount = 0;
      for (const to of recipients) {
        try {
          const { error } = await supabase.functions.invoke('send-af-acceptance-email', {
            body: {
              email: to,
              name: programEmailName,
              startupName: programEmailStartup,
              cohortName: programEmailCohort || 'Accelerated Fundraising',
              interviewDate: programEmailInterviewDate,
            },
          });
          if (error) throw error;
          successCount++;
        } catch (err: any) {
          failCount++;
          console.error('AF acceptance failed for', to, err);
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      addResult(failCount === 0, `AF Acceptance → ${recipients.length} recipients`, `Sent: ${successCount}, Failed: ${failCount}`);
      toast({ title: `✅ AF Acceptance sent`, description: `Delivered to ${successCount}/${recipients.length} recipients` });
    } else if (activeType === 'af-follow-up') {
      let successCount = 0;
      let failCount = 0;
      for (const to of recipients) {
        try {
          const { error } = await supabase.functions.invoke('send-af-follow-up', {
            body: {
              email: to,
              name: programEmailName,
              startupName: programEmailStartup,
              cohortName: programEmailCohort || 'Accelerated Fundraising',
              deadline: programEmailDeadline,
            },
          });
          if (error) throw error;
          successCount++;
        } catch (err: any) {
          failCount++;
          console.error('AF follow-up failed for', to, err);
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      addResult(failCount === 0, `AF Follow-Up → ${recipients.length} recipients`, `Sent: ${successCount}, Failed: ${failCount}`);
      toast({ title: `✅ AF Follow-Up sent`, description: `Delivered to ${successCount}/${recipients.length} recipients` });
    } else if (activeType === 'af-no-show') {
      let successCount = 0;
      let failCount = 0;
      for (const to of recipients) {
        try {
          const { error } = await supabase.functions.invoke('send-af-no-show-email', {
            body: {
              email: to,
              name: programEmailName,
              startupName: programEmailStartup,
              cohortName: programEmailCohort || 'Accelerated Fundraising',
              interviewDate: programEmailInterviewDate,
              rescheduleUrl: programEmailRescheduleUrl || undefined,
            },
          });
          if (error) throw error;
          successCount++;
        } catch (err: any) {
          failCount++;
          console.error('AF no-show failed for', to, err);
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      addResult(failCount === 0, `AF No-Show → ${recipients.length} recipients`, `Sent: ${successCount}, Failed: ${failCount}`);
      toast({ title: `✅ AF No-Show follow-up sent`, description: `Delivered to ${successCount}/${recipients.length} recipients` });
    } else if (activeType === 'product-update') {
      try {
        const { data, error } = await supabase.functions.invoke('send-product-update', {
          body: { targetEmails: recipients },
        });
        if (error) throw error;
        addResult(true, `Product Update → ${recipients.length} recipients`, `Sent: ${data?.sent || 0}, Errors: ${data?.errors || 0}`);
        toast({ title: '✅ Product update sent', description: `Delivered to ${data?.sent || 0}/${recipients.length} recipients` });
      } catch (err: any) {
        addResult(false, 'Product Update', err.message);
        toast({ title: 'Failed', description: err.message, variant: 'destructive' });
      }
    } else if (activeType === 'moonshotnx-partnership') {
      try {
        const { data, error } = await supabase.functions.invoke('send-moonshotnx-partnership', {
          body: { targetEmails: recipients },
        });
        if (error) throw error;
        addResult(true, `MoonshotNX Partnership → ${recipients.length} recipients`, `Sent: ${data?.sent || 0}, Errors: ${data?.errors || 0}`);
        toast({ title: '✅ Partnership announcement sent', description: `Delivered to ${data?.sent || 0}/${recipients.length} recipients` });
      } catch (err: any) {
        addResult(false, 'MoonshotNX Partnership', err.message);
        toast({ title: 'Failed', description: err.message, variant: 'destructive' });
      }
    }


    setSending(false);
  };

  // Build the payload that the scheduler will replay at the programmed time
  const buildScheduledJob = (recipients: string[]) => {
    switch (activeType) {
      case 'notification':
        return {
          function_name: 'send-notification-email',
          mode: 'per_recipient',
          recipient_field: 'to',
          body: {
            title: notifTitle, message: notifMessage, type: notifType,
            ...(notifActorName && { actorName: notifActorName }),
            ...(notifActorAvatar && { actorAvatarUrl: notifActorAvatar }),
            ...(notifActorRole && { actorRole: notifActorRole }),
          },
        };
      case 'artemis-invite':
        return {
          function_name: 'send-notification-email',
          mode: 'per_recipient',
          recipient_field: 'to',
          body: {
            title: '🚀 You\'re Invited to the Artemis II Watch Party!',
            message: 'You\'re personally invited to join the <strong>Artemis II Watch Party</strong> on Startup Factory Hub.',
            type: 'event',
            actorName: 'Startup Factory Hub',
            actorRole: 'platform',
            ctaUrl: 'https://startupfactoryhub.com/artemis-watch-party',
            ctaLabel: '🚀 Join the Watch Party',
          },
        };
      case 'invitation':
        return {
          function_name: 'send-application-invitation',
          mode: 'per_recipient',
          recipient_field: 'email',
          body: { token: inviteToken, applicationId: inviteAppId, jobTitle: inviteJobTitle, companyName: inviteCompany },
        };
      case 'weekly-welcome':
        return { function_name: 'send-weekly-welcome', mode: 'batch', recipient_field: 'targetEmails', body: {} };
      case 'partnership':
        return {
          function_name: 'send-partnership-announcement',
          mode: 'batch',
          recipient_field: 'targetEmails',
          body: {
            partnerName, partnerLogo, partnerWebsite,
            partnerDescription: partnerDesc,
            benefitsForStartups: partnerBenefits ? partnerBenefits.split('\n').map(b => b.trim()).filter(Boolean) : [],
            ctaLabel: partnerCTALabel,
            ctaUrl: partnerCTAUrl,
          },
        };
      case 'hot-deals-feedback':
        return { function_name: 'send-hot-deals-feedback-invite', mode: 'per_recipient', recipient_field: 'to', body: {} };
      case 'referral-invite':
        return { function_name: 'send-referral-invite-email', mode: 'batch', recipient_field: 'targetEmails', body: {} };
      case 'investor-update':
        return {
          function_name: 'send-investor-update',
          mode: 'batch',
          recipient_field: 'targetEmails',
          body: { investorCount, ...(investorHeadline && { headline: investorHeadline }) },
        };
      case 'moonshotnx-partnership':
        return { function_name: 'send-moonshotnx-partnership', mode: 'batch', recipient_field: 'targetEmails', body: {} };
      case 'mvp-program':
        return { function_name: 'send-mvp-program', mode: 'batch', recipient_field: 'targetEmails', body: {} };
      case 'mvp-welcome':
        return { function_name: 'send-mvp-welcome', mode: 'per_recipient', recipient_field: 'email', body: {} };
      case 'mvp-interview-invite':
        return { function_name: 'send-mvp-interview-invite', mode: 'per_recipient', recipient_field: 'email', body: {} };
      case 'product-update':
      default:
        return { function_name: 'send-product-update', mode: 'batch', recipient_field: 'targetEmails', body: {} };
    }
  };

  const scheduleSend = async () => {
    const recipients = getRecipients();
    if (!scheduleAt) {
      toast({ title: 'Pick a date & time', description: 'Choose when this email should go out.', variant: 'destructive' });
      return;
    }
    const when = new Date(scheduleAt);
    if (isNaN(when.getTime()) || when.getTime() < Date.now() - 60000) {
      toast({ title: 'Invalid date', description: 'The scheduled time must be in the future.', variant: 'destructive' });
      return;
    }
    if (recipients.length === 0) {
      toast({ title: 'No recipients selected', description: 'Select at least one recipient from the Recipients tab.', variant: 'destructive' });
      return;
    }

    setScheduling(true);
    try {
      const job = buildScheduledJob(recipients);
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('scheduled_emails').insert({
        created_by: userData?.user?.id ?? null,
        label: `${currentType.label} → ${recipients.length || 'all'} recipient${recipients.length === 1 ? '' : 's'}`,
        email_type: activeType,
        function_name: job.function_name,
        mode: job.mode,
        recipient_field: job.recipient_field,
        recipients,
        body: job.body,
        scheduled_at: when.toISOString(),
      });
      if (error) throw error;
      addResult(true, `Scheduled: ${currentType.label}`, `Programmed for ${when.toLocaleString()} · ${recipients.length} recipients`);
      toast({ title: '🗓️ Email scheduled', description: `Will be sent on ${when.toLocaleString()}` });
      setScheduleRefresh(k => k + 1);
    } catch (err: any) {
      toast({ title: 'Could not schedule', description: err.message, variant: 'destructive' });
    } finally {
      setScheduling(false);
    }
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

      {/* Product update broadcast (batched) */}
      <ProductUpdateBroadcast />

      {/* Weekly investment newsletter (automatic Fridays 1PM EST) */}
      <WeeklyNewsletterPanel />

      <UnverifiedUsersPanel />

      <UnsubscribesPanel />

      {/* Scheduled (programmed) emails */}
      <ScheduledEmailsPanel refreshKey={scheduleRefresh} />




      {/* Email Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {EMAIL_TYPES.map(t => (
          <Card key={t.id} className={`tech-card border-0 cursor-pointer transition-all ${activeType === t.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setActiveType(t.id)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeType === t.id ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                {t.icon}
              </div>
              <div>
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.id === 'partnership' ? 'Announcement' : 'Transactional'}</p>
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

                {activeType === 'product-update' && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Megaphone className="h-4 w-4" />
                      Product Update — What's New
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sends the branded "What's New" product update email (Resource Map, Emergency/ATLAS, Venezuela Rebuild, Genius AI, LightPaper, CRM & Marketing) to your selected recipients.
                    </p>
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      For large sends in batches of 100, use the broadcast panel at the top.
                    </div>
                  </div>
                )}

                {activeType === 'moonshotnx-partnership' && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Handshake className="h-4 w-4" />
                      Partnership — Startup Factory Hub × MoonshotNX
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sends the branded partnership announcement (M1 Innovation Grant + 3-Month Fundraising Sprint) to your selected recipients.
                    </p>
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Emails are personalized with each recipient's name.
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

                {/* Investor Activity Update */}
                {activeType === 'investor-update' && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <TrendingUp className="h-4 w-4" />
                      Investor Activity Update — 1:1 Transactional
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sends a personalized investor activity update to each selected recipient. Highlights active investors on the platform and includes a referral CTA.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Active Investor Count</Label>
                        <Input type="number" value={investorCount} onChange={e => setInvestorCount(Number(e.target.value))} className="tech-card border-0" />
                      </div>
                      <div className="space-y-1">
                        <Label>Custom Headline <span className="text-muted-foreground text-xs">(optional)</span></Label>
                        <Input value={investorHeadline} onChange={e => setInvestorHeadline(e.target.value)} placeholder="Leave blank for default" className="tech-card border-0" />
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3 space-y-1.5">
                      <p className="text-xs font-medium text-foreground">Email preview</p>
                      <p className="text-xs text-muted-foreground"><strong>Subject:</strong> {investorCount}+ active investors are looking — and you can refer founders for 20%</p>
                      <p className="text-xs text-muted-foreground"><strong>From:</strong> Startup Factory Hub &lt;info@startupfactoryhub.com&gt;</p>
                      <p className="text-xs text-muted-foreground"><strong>CTA:</strong> Open the Investor Browser + Refer a founder</p>
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

                {/* Schedule in advance */}
                <div className="rounded-lg border border-primary/15 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Schedule for later</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Program this email with the current settings and recipients. It will be sent automatically at the chosen date & time.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={e => setScheduleAt(e.target.value)}
                      className="tech-card border-0"
                    />
                    <Button onClick={scheduleSend} disabled={scheduling} variant="outline" className="shrink-0">
                      {scheduling
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scheduling...</>
                        : <><CalendarClock className="h-4 w-4 mr-2" /> Schedule</>
                      }
                    </Button>
                  </div>
                </div>

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
