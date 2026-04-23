import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Search, LogOut, Clock, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { useMyMemberships, useTeamMutations } from '@/hooks/useCompanyMembers';
import { useToast } from '@/hooks/use-toast';
import JoinStartupDialog from './JoinStartupDialog';

interface CompanySearchItem {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  description: string | null;
}

export default function MemberStartupsTab() {
  const { memberships, loading } = useMyMemberships();
  const { removeMember } = useTeamMutations();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanySearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [pickedCompany, setPickedCompany] = useState<CompanySearchItem | null>(null);

  const memberCompanyIds = useMemo(
    () => new Set(memberships.map((m) => m.company_id)),
    [memberships]
  );

  // Search companies (debounced)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('companies')
        .select('id, name, logo_url, industry, description')
        .ilike('name', `%${trimmed}%`)
        .limit(15);
      setResults(data || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const approved = memberships.filter((m) => m.status === 'approved');
  const pending = memberships.filter((m) => m.status === 'pending');
  const rejected = memberships.filter((m) => m.status === 'rejected');

  const leave = async (memberId: string, companyName?: string) => {
    try {
      await removeMember(memberId);
      toast({ title: 'Left team', description: `You left ${companyName || 'the team'}.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Join */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> Join a startup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search startups by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {searching && <p className="text-sm text-muted-foreground">Searching…</p>}

          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="text-sm text-muted-foreground">No startups match "{query}".</p>
          )}

          <div className="space-y-2">
            {results.map((c) => {
              const alreadyMember = memberCompanyIds.has(c.id);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    {c.logo_url ? <AvatarImage src={c.logo_url} alt={c.name} /> : null}
                    <AvatarFallback>{c.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.industry || '—'}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={alreadyMember}
                    onClick={() => setPickedCompany(c)}
                  >
                    {alreadyMember ? 'Already requested' : 'Request to join'}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* My memberships */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" /> My startups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

          {!loading && memberships.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>You haven't joined any startup yet.</p>
              <p className="text-xs mt-1">Search above to find one and request to join.</p>
            </div>
          )}

          {approved.length > 0 && (
            <Section title="Active teams" icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}>
              {approved.map((m) => (
                <MemberRow
                  key={m.id}
                  membership={m}
                  onLeave={() => leave(m.id, m.company?.name)}
                  leaveLabel="Leave team"
                />
              ))}
            </Section>
          )}

          {pending.length > 0 && (
            <Section title="Pending requests" icon={<Clock className="h-4 w-4 text-amber-500" />}>
              {pending.map((m) => (
                <MemberRow
                  key={m.id}
                  membership={m}
                  onLeave={() => leave(m.id, m.company?.name)}
                  leaveLabel="Cancel request"
                />
              ))}
            </Section>
          )}

          {rejected.length > 0 && (
            <Section title="Declined" icon={<XCircle className="h-4 w-4 text-destructive" />}>
              {rejected.map((m) => (
                <MemberRow
                  key={m.id}
                  membership={m}
                  onLeave={() => leave(m.id, m.company?.name)}
                  leaveLabel="Dismiss"
                />
              ))}
            </Section>
          )}
        </CardContent>
      </Card>

      {pickedCompany && (
        <JoinStartupDialog
          open={!!pickedCompany}
          onOpenChange={(o) => !o && setPickedCompany(null)}
          company={{ id: pickedCompany.id, name: pickedCompany.name }}
        />
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
        {icon} {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function MemberRow({
  membership,
  onLeave,
  leaveLabel,
}: {
  membership: ReturnType<typeof useMyMemberships>['memberships'][number];
  onLeave: () => void;
  leaveLabel: string;
}) {
  const c = membership.company;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
      <Avatar className="h-10 w-10">
        {c?.logo_url ? <AvatarImage src={c.logo_url} alt={c.name} /> : null}
        <AvatarFallback>{c?.name?.charAt(0) || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{c?.name || 'Unknown company'}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {membership.title && <Badge variant="secondary" className="text-[10px]">{membership.title}</Badge>}
          <span className="text-xs text-muted-foreground capitalize">{membership.seniority}</span>
        </div>
      </div>
      <Button size="sm" variant="ghost" onClick={onLeave}>
        <LogOut className="h-4 w-4 mr-1" /> {leaveLabel}
      </Button>
    </div>
  );
}
