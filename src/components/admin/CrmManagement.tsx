import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, RefreshCw, Download, Users, Reply, DollarSign, Rocket, Handshake, ContactRound, ExternalLink } from 'lucide-react';
import CRMBoard from '@/components/CRMBoard';

/**
 * ADMIN CRM — new tab inside the Admin panel (added 2026-11-03 at the
 * founder's order, integrating the Library "SFH CRM Dashboard").
 *
 * Branding: inherits the Admin Matrix shell (same colors, mono labels,
 * right-side nav) — it carries no colors of its own beyond the Matrix
 * palette, so admin rebrands update this tab automatically.
 *
 * Auto-update: on mount, on demand (Sync now) and live via realtime
 * subscriptions, it rebuilds one unified contact list from the platform's
 * own tables — profiles (+ roles), companies, investor_profiles,
 * accelerator_profiles and user_subscriptions — so every new client,
 * investor, startup or partner who joins the platform appears here
 * without manual entry.
 *
 * External contacts (LinkedIn / email relationships that live outside the
 * platform, seeded from the founder's verified records) are stored in the
 * EXISTING CRM tables (crm_pipelines / crm_stages / crm_cards, tagged
 * "sfh-external") — the same tables the member CRM board uses — so stage
 * and next-step edits here show up on the pipeline board below and in
 * the CRM tool, and vice versa. No new table is required; the optional
 * dedicated table migration lives in
 * supabase/migrations/20261104000000_crm_contacts.sql for a future move.
 */

export const CRM_STAGES = [
  'New Prospect', 'Research Complete', 'Qualified', 'Contacted', 'Replied',
  'Interested', 'Meeting Booked', 'Meeting Done', 'Awaiting Reply',
  'Paid Subscriber', 'Member', 'Nurture', 'Closed/Disqualified',
] as const;

export type CrmType = 'Investor' | 'Startup' | 'Client/Member' | 'Partner/Ecosystem' | 'Advisor' | 'External';

export interface CrmRow {
  key: string;
  name: string;
  company: string;
  email: string | null;
  type: CrmType | string;
  stage: string;
  source: string;
  lastContact: string | null;
  reply: string;
  nextStep: string;
  profileUserId: string | null;
  cardId: string | null; // crm_cards id for external rows (editable)
}

interface SeedContact {
  name: string; company: string; email?: string; type: string; stage: string;
  last: string; reply: string; next: string; source: string;
}

export const EXTERNAL_SEED: SeedContact[] = [
  { name: 'Nathan Desplaines', company: 'NJD Technologies', type: 'Startup', stage: 'Interested', last: '2026-10-19', reply: 'Replied INTERESTED — 3 companies (Genius Engine Labs, Ingenuity Systems, Orion Grant Co.), priority = customers/MRR, open to capital', next: 'Subscription close — membership link + Calendly already sent', source: 'LinkedIn' },
  { name: 'Lan Lam', company: 'SpaceWERX', type: 'Partner/Ecosystem', stage: 'Meeting Booked', last: '2026-10-20', reply: 'Replied positively and booked Fri Oct 23, 11am ET himself — federal funding for companies in her programs', next: 'Follow up on funding opportunities for SFH companies', source: 'LinkedIn' },
  { name: 'Robert Perez-Alemany', company: 'DIU (space portfolio)', email: 'rperez@diu.mil', type: 'Partner/Ecosystem', stage: 'Awaiting Reply', last: '2026-10-21', reply: 'Replied — asked for an email; sent 2026-10-21 naming LuftCar, Copernic Space, Korb', next: 'Wait for his reply before any follow-up (founder rule)', source: 'LinkedIn' },
  { name: 'Curtis Cox', company: 'CUNY / Lehman College', type: 'Partner/Ecosystem', stage: 'Meeting Booked', last: '2026-10-27', reply: 'Replied warm — students engaging the startup community; rebooked Wed Nov 4, 3:30pm ET after Oct 26 no-show', next: '$50-per-seat student offer sent Oct 27 — meeting Nov 4', source: 'LinkedIn' },
  { name: 'Sean Park', company: 'Citizens Private Bank', email: 'Sean.park@citizensprivatebank.com', type: 'Investor', stage: 'Awaiting Reply', last: '2026-11-02', reply: 'Replied — happy to make connections; warm-intro bridge to target fund-of-funds', next: 'Awaiting reply on deck / track record / data room (follow-ups sent Nov 1 + Nov 2)', source: 'LinkedIn + Email' },
  { name: 'Karina Taboelle', company: 'South Summit', type: 'Partner/Ecosystem', stage: 'Replied', last: '2026-10-20', reply: 'Replied — shared SFH with the partnership team to check fit', next: 'Partnership follow-through via Cristina De Corral', source: 'LinkedIn' },
  { name: 'Cristina De Corral', company: 'South Summit Partnerships', type: 'Partner/Ecosystem', stage: 'Meeting Done', last: '2026-10-28', reply: 'Exploratory call completed Oct 28 — exploring a fit', next: 'Continue partnership exploration', source: 'LinkedIn' },
  { name: 'Melissa Patton', company: 'Space Grove', type: 'Partner/Ecosystem', stage: 'Meeting Done', last: '2026-10-19', reply: '30-min Zoom Oct 19 on partnerships and collaboration; follow-up thread active', next: 'Keep follow-up thread moving', source: 'Email' },
  { name: 'Samuel Keshinro', company: 'Founder prospect', type: 'Startup', stage: 'Replied', last: '2026-10-19', reply: 'Replied with a membership question', next: 'Answer + call offer (no membership pitch on LinkedIn)', source: 'LinkedIn' },
  { name: 'Moamen Said', company: 'I-Gamify / Khemet.ai', type: 'Startup', stage: 'Meeting Done', last: '2026-10-26', reply: 'Replied asking about a COO role; call held Oct 26, 11:30am', next: 'Founder decision on COO question', source: 'LinkedIn' },
  { name: 'Allison Berardi', company: 'Nasdaq Entrepreneurial Center', type: 'Partner/Ecosystem', stage: 'Replied', last: '2026-10-26', reply: 'Human reply about SFH and the Nasdaq EC', next: 'Continue Nasdaq EC conversation', source: 'Email' },
  { name: 'Andrew Romans', company: '7BC Venture Capital', email: 'andrew@7bc.vc', type: 'Investor', stage: 'Awaiting Reply', last: '2026-11-02', reply: 'Co-GP collaborator on Higgsfield, OpenAI and Crusoe vehicles', next: 'Awaiting reply on SPV economics follow-up sent Nov 2', source: 'Email' },
  { name: 'Edward Janes', company: 'Source Capital', type: 'Investor', stage: 'Meeting Done', last: '2026-10-27', reply: 'Booked his own discovery meeting Oct 27, 1–2pm ET', next: 'Follow up from discovery call', source: 'Email' },
  { name: 'Grant Rogers', company: 'Investor prospect', type: 'Investor', stage: 'Awaiting Reply', last: '2026-11-03', reply: 'Reply sent Nov 3 as drafted', next: 'Awaiting his time pick for next week', source: 'Email' },
  { name: 'Phil Sanderson', company: 'Fund-of-funds bridge', type: 'Investor', stage: 'Contacted', last: '2026-10-19', reply: 'Warm-intro DM sent — no reply recorded as of Oct 21', next: 'Hold — warm intro path', source: 'LinkedIn' },
  { name: 'Tyler Dean', company: 'Fund-of-funds bridge (ex-family-office/LP)', type: 'Investor', stage: 'Contacted', last: '2026-10-19', reply: 'Warm-intro DM sent — no reply recorded as of Oct 21', next: 'Hold — warm intro path', source: 'LinkedIn' },
  { name: 'Georgia Lu', company: 'Fund-of-funds bridge', type: 'Investor', stage: 'Contacted', last: '2026-10-19', reply: 'Warm-intro DM sent — no reply recorded as of Oct 21', next: 'Hold — warm intro path', source: 'LinkedIn' },
  { name: 'Michael Palank', company: 'Fund-of-funds bridge', type: 'Investor', stage: 'Contacted', last: '2026-10-19', reply: 'Warm-intro DM sent — no reply recorded as of Oct 21', next: 'Hold — warm intro path', source: 'LinkedIn' },
  { name: 'Yanis Grigy', company: 'Fleuret AI', type: 'Startup', stage: 'Qualified', last: '2026-10-18', reply: 'Pilot founder prospect (score 83) — subscription pitch approved, confirmation pending', next: 'Confirm pitch delivery', source: 'LinkedIn' },
  { name: 'Uku Joost Annus', company: 'bilt.me', type: 'Startup', stage: 'Qualified', last: '2026-10-18', reply: 'Pilot founder prospect (score 79) — subscription pitch approved, confirmation pending', next: 'Confirm pitch delivery', source: 'LinkedIn' },
  { name: 'Johan Torssell', company: 'Spiich', type: 'Startup', stage: 'Qualified', last: '2026-10-18', reply: 'Pilot founder prospect (score 78) — subscription pitch approved, confirmation pending', next: 'Confirm pitch delivery', source: 'LinkedIn' },
  { name: 'Andrés Molina', company: 'Remote', type: 'Partner/Ecosystem', stage: 'Replied', last: '2026-11-01', reply: 'Introduced Jonah Brotman (Remote VC/accelerator partnerships); meeting invite Mon Nov 9, 6pm ET unanswered', next: 'Answer the Nov 9 meeting invitation', source: 'Email' },
  { name: 'Cailan Baker', company: 'Salesforce', type: 'Partner/Ecosystem', stage: 'Replied', last: '2026-11-01', reply: 'Salesforce intro thread (3 messages, 1 unread at scan)', next: 'Read and reply to intro thread', source: 'Email' },
  { name: 'Maggie Shrader', company: 'Every.io', type: 'Partner/Ecosystem', stage: 'Replied', last: '2026-11-01', reply: 'Partner reply waiting (Nov 1 inbox scan)', next: 'Reply to partner thread', source: 'Email' },
  { name: 'Carlos Sanabria', company: 'Designli', type: 'Partner/Ecosystem', stage: 'Replied', last: '2026-11-01', reply: 'Partner reply waiting (Nov 1 inbox scan)', next: 'Reply to partner thread', source: 'Email' },
  { name: 'Alyssa Hobal', company: 'Backblaze', type: 'Partner/Ecosystem', stage: 'Replied', last: '2026-11-01', reply: 'Partner reply waiting (Nov 1 inbox scan)', next: 'Reply to partner thread', source: 'Email' },
  { name: 'Alessandro De Angelis', company: 'Founder prospect', type: 'Startup', stage: 'Closed/Disqualified', last: '2026-10-19', reply: 'DECLINED — "not looking for other services", focused on closing his round', next: 'Closed — no follow-up ever', source: 'LinkedIn' },
  { name: 'Babulal Meena', company: 'Artane Partners', type: 'External', stage: 'Closed/Disqualified', last: '2026-10-20', reply: 'Pitched his own paid placement service (EUR 15k) — pass under the no-paid-programs rule', next: 'Closed — pass', source: 'LinkedIn' },
];

const BOARD_STAGE: Record<string, string> = {
  'New Prospect': 'Leads', 'Research Complete': 'Leads', 'Qualified': 'Leads',
  'Contacted': 'Contacted', 'Replied': 'Contacted', 'Interested': 'Contacted',
  'Awaiting Reply': 'Contacted', 'Meeting Booked': 'Meeting', 'Meeting Done': 'Meeting',
  'Paid Subscriber': 'Closed', 'Member': 'Closed', 'Nurture': 'Leads',
  'Closed/Disqualified': 'Closed',
};
const DEFAULT_BOARD_STAGES = [
  { name: 'Leads', color: 'blue', position: 0 },
  { name: 'Contacted', color: 'purple', position: 1 },
  { name: 'Meeting', color: 'yellow', position: 2 },
  { name: 'Proposal', color: 'orange', position: 3 },
  { name: 'Closed', color: 'green', position: 4 },
];
const REPLIED_STAGES = new Set(['Replied', 'Interested', 'Meeting Booked', 'Meeting Done', 'Awaiting Reply']);
const MONO = { fontFamily: '"JetBrains Mono", monospace' } as const;

export default function CrmManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<CrmRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [editing, setEditing] = useState<CrmRow | null>(null);
  const [editStage, setEditStage] = useState('');
  const [editNext, setEditNext] = useState('');
  const loadRef = useRef<() => Promise<void>>(async () => {});

  const ensurePipeline = useCallback(async (): Promise<{ pipelineId: string; stages: any[] } | null> => {
    if (!user) return null;
    const { data: pipelines } = await supabase.from('crm_pipelines').select('*').eq('user_id', user.id).limit(1);
    let pipelineId: string;
    if (pipelines && pipelines.length > 0) {
      pipelineId = pipelines[0].id;
    } else {
      const { data: created, error } = await supabase.from('crm_pipelines')
        .insert({ user_id: user.id, name: 'Sales Pipeline', description: 'Default sales pipeline' })
        .select().single();
      if (error || !created) return null;
      pipelineId = created.id;
      await supabase.from('crm_stages').insert(DEFAULT_BOARD_STAGES.map(s => ({ ...s, pipeline_id: pipelineId })));
    }
    const { data: stages } = await supabase.from('crm_stages').select('*').eq('pipeline_id', pipelineId).order('position');
    return { pipelineId, stages: stages || [] };
  }, [user]);

  const syncExternalToCards = useCallback(async (stages: any[]) => {
    if (!user || stages.length === 0) return;
    const stageByName = new Map(stages.map((s: any) => [String(s.name).toLowerCase(), s]));
    const { data: existing } = await supabase.from('crm_cards')
      .select('id, contact_name, tags').eq('user_id', user.id).contains('tags', ['sfh-external']);
    const have = new Set((existing || []).map((c: any) => String(c.contact_name || '').toLowerCase()));
    const missing = EXTERNAL_SEED.filter(s => !have.has(s.name.toLowerCase()));
    if (missing.length === 0) return;
    const rowsToInsert = missing.map((s, i) => {
      const board = stageByName.get((BOARD_STAGE[s.stage] || 'Leads').toLowerCase()) || stages[0];
      return {
        stage_id: board.id, user_id: user.id, title: s.name, company_name: s.company,
        contact_name: s.name, contact_email: s.email || null, description: s.reply,
        notes: s.next, priority: REPLIED_STAGES.has(s.stage) ? 'high' : 'medium',
        tags: ['sfh-external', s.type, `stage:${s.stage}`, s.source], status: 'active', tasks: [], position: i,
      };
    });
    const { error } = await supabase.from('crm_cards').insert(rowsToInsert as any);
    if (error) console.error('CRM external seed sync failed:', error);
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const pipe = await ensurePipeline();
      if (pipe) await syncExternalToCards(pipe.stages);

      const [profilesRes, companiesRes, investorsRes, subsRes, cardsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, email, avatar_url, created_at, location').order('created_at', { ascending: false }).limit(1000),
        supabase.from('companies').select('*').limit(1000),
        supabase.from('investor_profiles').select('*').limit(1000),
        supabase.from('user_subscriptions').select('*').limit(1000),
        supabase.from('crm_cards').select('*').eq('user_id', user.id).contains('tags', ['sfh-external']),
      ]);

      const profiles: any[] = profilesRes.data || [];
      // Roles: batch rpc needs ids — fetch in one call with the profile ids.
      let roleByUser = new Map<string, string>();
      if (profiles.length > 0) {
        const { data: roleData } = await supabase.rpc('get_user_roles_batch', { user_ids: profiles.map(p => p.user_id) } as any);
        (roleData || []).forEach((r: any) => { if (r.user_id && r.role) roleByUser.set(r.user_id, r.role); });
      }

      const activeSubs = new Set((subsRes.data || []).filter((s: any) => ['active', 'trialing'].includes(String(s.status || 'active'))).map((s: any) => s.user_id));
      const investorUsers = new Set((investorsRes.data || []).map((i: any) => i.user_id));
      const companyByUser = new Map<string, any>();
      (companiesRes.data || []).forEach((c: any) => { const uid = c.user_id || c.owner_id; if (uid && !companyByUser.has(uid)) companyByUser.set(uid, c); });

      const unified: CrmRow[] = [];
      const seenUsers = new Set<string>();

      profiles.forEach((p: any) => {
        const role = roleByUser.get(p.user_id) || (investorUsers.has(p.user_id) ? 'investor' : 'startup');
        if (role === 'admin') return;
        seenUsers.add(p.user_id);
        const comp = companyByUser.get(p.user_id);
        const type = role === 'investor' ? 'Investor' : role === 'advisor' || role === 'mentor' ? 'Advisor'
          : role === 'accelerator' ? 'Partner/Ecosystem' : role === 'student' ? 'Client/Member' : 'Startup';
        unified.push({
          key: `profile-${p.user_id}`, name: p.full_name || p.email || 'Member',
          company: comp?.name || '', email: p.email || null, type,
          stage: activeSubs.has(p.user_id) ? 'Paid Subscriber' : 'Member',
          source: 'Platform', lastContact: p.created_at ? String(p.created_at).slice(0, 10) : null,
          reply: comp ? `Startup: ${comp.name}${comp.industry ? ` · ${comp.industry}` : ''}${comp.stage ? ` · ${comp.stage}` : ''}` : 'Platform member',
          nextStep: activeSubs.has(p.user_id) ? 'Subscriber — nurture' : 'Member — invite to a paid plan',
          profileUserId: p.user_id, cardId: null,
        });
      });

      (companiesRes.data || []).forEach((c: any) => {
        const uid = c.user_id || c.owner_id;
        if (uid && seenUsers.has(uid)) return;
        unified.push({
          key: `company-${c.id}`, name: c.name || 'Startup', company: c.name || '', email: null,
          type: 'Startup', stage: 'Member', source: 'Platform',
          lastContact: c.created_at ? String(c.created_at).slice(0, 10) : null,
          reply: [c.industry, c.stage, c.description].filter(Boolean).join(' · ').slice(0, 220) || 'Startup on the platform',
          nextStep: 'Startup — engage founder', profileUserId: uid || null, cardId: null,
        });
      });

      const cardStageLabel = (tags: string[] | null) => {
        const t = (tags || []).find(t => t.startsWith('stage:'));
        return t ? t.slice(6) : 'Contacted';
      };
      (cardsRes.data || []).forEach((c: any) => {
        unified.push({
          key: `card-${c.id}`, name: c.contact_name || c.title || 'Contact',
          company: c.company_name || '', email: c.contact_email || null,
          type: (c.tags || []).find((t: string) => ['Investor', 'Startup', 'Partner/Ecosystem', 'Client/Member', 'Advisor', 'External'].includes(t)) || 'External',
          stage: cardStageLabel(c.tags), source: (c.tags || []).find((t: string) => ['LinkedIn', 'Email', 'LinkedIn + Email'].includes(t)) || 'External',
          lastContact: null, reply: c.description || '', nextStep: c.notes || '',
          profileUserId: null, cardId: c.id,
        });
      });

      // Replied first, then newest.
      unified.sort((a, b) => Number(REPLIED_STAGES.has(b.stage)) - Number(REPLIED_STAGES.has(a.stage))
        || String(b.lastContact || '').localeCompare(String(a.lastContact || '')));
      setRows(unified);
      setLastSync(new Date());
    } catch (e: any) {
      console.error('CRM load failed:', e);
      toast({ title: 'CRM sync failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [user, ensurePipeline, syncExternalToCards, toast]);

  useEffect(() => { loadRef.current = load; }, [load]);
  useEffect(() => { if (user) void load(); }, [user, load]);

  // Live auto-update: any change in the source tables refreshes the CRM.
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('admin-crm-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { void loadRef.current(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => { void loadRef.current(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'investor_profiles' }, () => { void loadRef.current(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_subscriptions' }, () => { void loadRef.current(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_cards' }, () => { void loadRef.current(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user]);

  const filtered = useMemo(() => rows.filter(r => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [r.name, r.company, r.email || '', r.reply].join(' ').toLowerCase().includes(q);
    const matchesType = typeFilter === 'all' || (typeFilter === 'replied' ? REPLIED_STAGES.has(r.stage) : r.type === typeFilter);
    const matchesStage = stageFilter === 'all' || r.stage === stageFilter;
    return matchesSearch && matchesType && matchesStage;
  }), [rows, search, typeFilter, stageFilter]);

  const kpis = useMemo(() => ({
    total: rows.length,
    replied: rows.filter(r => REPLIED_STAGES.has(r.stage)).length,
    investors: rows.filter(r => r.type === 'Investor').length,
    startups: rows.filter(r => r.type === 'Startup').length,
    members: rows.filter(r => r.source === 'Platform').length,
    partners: rows.filter(r => r.type === 'Partner/Ecosystem').length,
  }), [rows]);

  const pipelineCounts = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach(r => m.set(r.stage, (m.get(r.stage) || 0) + 1));
    return CRM_STAGES.filter(s => m.has(s)).map(s => ({ stage: s, count: m.get(s)! }));
  }, [rows]);

  const exportCsv = () => {
    const header = 'id,name,company,email,type,stage,source,last_contact,reply_summary,next_step,score';
    const esc = (v: string) => `"${String(v || '').replace(/"/g, '""')}"`;
    const score = (r: CrmRow) => REPLIED_STAGES.has(r.stage) ? 85 : r.stage === 'Paid Subscriber' ? 95 : r.stage === 'Qualified' ? 65 : 40;
    const lines = filtered.map(r => [r.key, r.name, r.company, r.email || '', r.type, r.stage, r.source, r.lastContact || '', r.reply, r.nextStep, score(r)].map(esc).join(','));
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sfh-crm-contacts.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const saveEdit = async () => {
    if (!editing?.cardId) { setEditing(null); return; }
    const pipe = await ensurePipeline();
    const boardStage = pipe?.stages.find((s: any) => String(s.name).toLowerCase() === (BOARD_STAGE[editStage] || 'Contacted').toLowerCase());
    const { data: card } = await supabase.from('crm_cards').select('tags').eq('id', editing.cardId).single();
    const tags = ((card?.tags as string[]) || []).filter(t => !t.startsWith('stage:'));
    tags.push(`stage:${editStage}`);
    const patch: any = { notes: editNext, tags };
    if (boardStage) patch.stage_id = boardStage.id;
    const { error } = await supabase.from('crm_cards').update(patch).eq('id', editing.cardId);
    if (error) { toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'CRM updated', description: `${editing.name} → ${editStage}` });
    setEditing(null);
    void load();
  };

  const kpiCards = [
    { label: 'Total contacts', value: kpis.total, icon: ContactRound, color: '#00E5FF' },
    { label: 'Replied & engaged', value: kpis.replied, icon: Reply, color: '#2EF8A0' },
    { label: 'Investors', value: kpis.investors, icon: DollarSign, color: '#00E5FF' },
    { label: 'Startups', value: kpis.startups, icon: Rocket, color: '#2EF8A0' },
    { label: 'Platform members', value: kpis.members, icon: Users, color: '#00E5FF' },
    { label: 'Partners / ecosystems', value: kpis.partners, icon: Handshake, color: '#2EF8A0' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-[9px] tracking-[0.25em] text-[#4E7A73]" style={MONO}>ADMIN // CRM</p>
          <h2 className="text-xl font-semibold mt-1">CRM <span className="text-[#00E5FF]">//</span> All Contacts</h2>
          <p className="text-xs text-white/50 mt-1">
            Clients, investors, startups and partners — platform members sync automatically, external contacts live in your CRM pipeline.
            {lastSync && <> Last synced {lastSync.toLocaleTimeString()} · auto-update ON</>}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={syncing} className="border-cyan-400/30 text-[#00E5FF]">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} /> Sync now
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} className="border-[#2EF8A0]/30 text-[#2EF8A0]">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map(k => (
          <Card key={k.label} className="bg-[#061016] border-cyan-400/15">
            <CardContent className="p-4">
              <k.icon className="h-5 w-5 mb-2" style={{ color: k.color }} />
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45" style={MONO}>{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {pipelineCounts.map(p => (
          <button key={p.stage} onClick={() => setStageFilter(stageFilter === p.stage ? 'all' : p.stage)}
            className={`px-2.5 py-1 rounded-full border text-[11px] ${stageFilter === p.stage ? 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/10' : 'border-white/15 text-white/60'}`} style={MONO}>
            {p.stage} · {p.count}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, company, email, reply…" className="pl-9 bg-[#061016] border-white/10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[190px] bg-[#061016] border-white/10"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="replied">Replied only</SelectItem>
            <SelectItem value="Investor">Investors</SelectItem>
            <SelectItem value="Startup">Startups / Founders</SelectItem>
            <SelectItem value="Client/Member">Clients / Members</SelectItem>
            <SelectItem value="Partner/Ecosystem">Partners / Ecosystems</SelectItem>
            <SelectItem value="Advisor">Advisors</SelectItem>
            <SelectItem value="External">External</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[190px] bg-[#061016] border-white/10"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {CRM_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-white/50 text-sm py-10 text-center">Syncing your CRM…</p>
      ) : (
        <div className="rounded-lg border border-cyan-400/15 bg-[#061016] overflow-x-auto">
          <table className="w-full text-sm min-w-[880px]">
            <thead>
              <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-[0.12em] text-white/45" style={MONO}>
                <th className="p-3">Contact</th><th className="p-3">Type</th><th className="p-3">Stage</th>
                <th className="p-3">Reply / About</th><th className="p-3">Next step</th><th className="p-3">Source</th><th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.key} className={`border-b border-white/5 hover:bg-white/[0.03] ${REPLIED_STAGES.has(r.stage) ? 'bg-[#2EF8A0]/[0.04]' : ''}`}>
                  <td className="p-3">
                    <p className="font-medium text-white">{r.name}</p>
                    <p className="text-xs text-white/45">{r.company}{r.email ? ` · ${r.email}` : ''}</p>
                  </td>
                  <td className="p-3"><Badge variant="outline" className="border-white/15 text-white/70">{r.type}</Badge></td>
                  <td className="p-3">
                    <Badge className={REPLIED_STAGES.has(r.stage) ? 'bg-[#2EF8A0]/15 text-[#2EF8A0] border border-[#2EF8A0]/30' : 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/25'}>{r.stage}</Badge>
                  </td>
                  <td className="p-3 text-white/65 max-w-[340px]"><span className="line-clamp-3">{r.reply}</span></td>
                  <td className="p-3 text-white/65 max-w-[260px]"><span className="line-clamp-3">{r.nextStep}</span></td>
                  <td className="p-3 text-white/50 text-xs">{r.source}{r.lastContact ? <><br />{r.lastContact}</> : null}</td>
                  <td className="p-3 whitespace-nowrap">
                    {r.profileUserId && (
                      <Button variant="ghost" size="sm" onClick={() => window.open(`/u/${r.profileUserId}`, '_blank')} title="Open profile">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    {r.cardId && (
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setEditStage(r.stage); setEditNext(r.nextStep); }}>
                        Edit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-white/40">No contacts match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="pt-2">
        <p className="text-[9px] tracking-[0.25em] text-[#4E7A73] mb-1" style={MONO}>PIPELINE BOARD // ALL CRM FUNCTIONS</p>
        <h3 className="text-base font-semibold mb-3">Your CRM board — drag cards, add contacts, sync the investor directory, scan business cards</h3>
        <CRMBoard />
      </div>

      <p className="text-[11px] text-white/35">
        Integration schema (same as the Library CRM Dashboard): id, name, company, email, type, stage, source, last_contact,
        reply_summary, next_step, score — exported by the CSV button above. External contacts are stored in crm_cards
        (tag: sfh-external); a dedicated crm_contacts migration is included in the repo for a future move.
      </p>

      <Dialog open={!!editing} onOpenChange={o => { if (!o) setEditing(null); }}>
        <DialogContent className="bg-[#061016] border-cyan-400/20">
          <DialogHeader><DialogTitle>{editing?.name} — {editing?.company}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-white/50 mb-1">Stage</p>
              <Select value={editStage} onValueChange={setEditStage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CRM_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-white/50 mb-1">Next step</p>
              <Textarea value={editNext} onChange={e => setEditNext(e.target.value)} rows={3} />
            </div>
            {editing?.reply && <p className="text-xs text-white/50">{editing.reply}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void saveEdit()} className="bg-[#00E5FF] text-black hover:bg-[#00E5FF]/85">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
