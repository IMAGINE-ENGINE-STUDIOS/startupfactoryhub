// Admin tool: give complimentary platform membership to specific users.
// Granted users get the same access as paying members until revoked/expired.
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Trash2, UserPlus } from 'lucide-react';

interface GrantRow {
  id: string;
  user_id: string;
  tier: string;
  note: string | null;
  expires_at: string | null;
  created_at: string;
  email?: string;
  full_name?: string;
}

export default function MembershipGrants() {
  const { toast } = useToast();
  const [rows, setRows] = useState<GrantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('membership_grants')
      .select('id, user_id, tier, note, expires_at, created_at')
      .is('revoked_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Could not load grants', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const ids = (data || []).map((r) => r.user_id);
    let profiles: Record<string, { email?: string; full_name?: string }> = {};
    if (ids.length) {
      const { data: profs } = await supabase
        .from('profiles_data')
        .select('user_id, full_name')
        .in('user_id', ids);
      profiles = Object.fromEntries((profs || []).map((p: any) => [p.user_id, { full_name: p.full_name }]));
    }

    setRows((data || []).map((r) => ({ ...r, ...profiles[r.user_id] })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const grant = async () => {
    const target = email.trim().toLowerCase();
    if (!target) return;
    setSaving(true);
    try {
      // Resolve the user by email through the profiles table.
      const { data: profile, error: pErr } = await supabase
        .from('profiles_data')
        .select('user_id, full_name')
        .ilike('email', target)
        .maybeSingle();

      if (pErr) throw pErr;
      if (!profile?.user_id) {
        throw new Error('No account found with that email address.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('membership_grants').insert({
        user_id: profile.user_id,
        tier: 'basic',
        note: note.trim() || null,
        granted_by: user?.id ?? null,
      });
      if (error) throw error;

      toast({ title: 'Membership granted', description: `${profile.full_name || target} now has full access.` });
      setEmail('');
      setNote('');
      load();
    } catch (e) {
      toast({
        title: 'Could not grant membership',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id: string) => {
    const { error } = await supabase
      .from('membership_grants')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast({ title: 'Could not revoke', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Grant revoked' });
    load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.full_name, r.email, r.note, r.user_id].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [rows, search]);

  return (
    <div className="space-y-6">
      <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-['Space_Grotesk'] tracking-wide">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Membership grants
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Admins always have full access. Grant complimentary membership to anyone else here —
            everyone without a grant or a paid membership stays read-only.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
            <Input
              placeholder="User email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="bg-white/[0.03] border-white/10 focus:border-[#00E5FF]/50"
            />
            <Input
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-white/[0.03] border-white/10 focus:border-[#00E5FF]/50"
            />
            <Button onClick={grant} disabled={saving || !email.trim()} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Grant access
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base font-['Space_Grotesk'] tracking-wide">Active grants ({rows.length})</CardTitle>
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[220px] bg-white/[0.03] border-white/10 focus:border-[#00E5FF]/50"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No active grants.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{r.full_name || r.user_id}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.note || 'No note'} · granted {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="uppercase font-['JetBrains_Mono'] text-[10px] tracking-wider">{r.tier}</Badge>
                    <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => revoke(r.id)}>
                      <Trash2 className="h-4 w-4" /> Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
