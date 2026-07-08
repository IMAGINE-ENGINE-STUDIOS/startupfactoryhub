import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Building2, MapPin, DollarSign, Mail, Phone, Search,
  Briefcase, CalendarDays, CheckCircle2, XCircle, Download, Loader2,
} from 'lucide-react';

interface DirectoryInvestor {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  manager: string | null;
  vintage_year: number | null;
  fund_size: number | null;
  average_investment: number | null;
  investment_strategy: string | null;
  fund_style: string | null;
  accepting_investments: boolean | null;
  ir_name: string | null;
  ir_email: string | null;
  ir_phone: string | null;
  source: string;
}

const PAGE_SIZE = 30;

const fmtMoney = (n: number | null) => {
  if (n == null) return null;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

interface Props {
  startupName?: string;
}

export default function InvestorDirectoryList({ startupName }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<DirectoryInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [acceptingOnly, setAcceptingOnly] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, count } = await supabase
        .from('directory_investors')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true });
      setItems((data ?? []) as DirectoryInvestor[]);
      setTotal(count ?? 0);
      setLoading(false);
    };
    load();
  }, []);

  const states = useMemo(
    () => Array.from(new Set(items.map(i => i.state).filter(Boolean))).sort() as string[],
    [items]
  );
  const strategies = useMemo(
    () => Array.from(new Set(items.map(i => i.investment_strategy).filter(Boolean))).sort() as string[],
    [items]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(i => {
      if (acceptingOnly && !i.accepting_investments) return false;
      if (stateFilter !== 'all' && i.state !== stateFilter) return false;
      if (strategyFilter !== 'all' && i.investment_strategy !== strategyFilter) return false;
      if (q) {
        const blob = `${i.name} ${i.manager ?? ''} ${i.city ?? ''} ${i.state ?? ''} ${i.investment_strategy ?? ''} ${i.fund_style ?? ''}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, stateFilter, strategyFilter, acceptingOnly]);

  const shown = filtered.slice(0, visible);

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every(i => selected.has(i.id));
  const toggleAllFiltered = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach(i => next.delete(i.id));
      } else {
        filtered.forEach(i => next.add(i.id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const syncSelectedToCRM = async () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'You must be signed in to sync to CRM.', variant: 'destructive' });
      return;
    }
    if (selected.size === 0) return;
    setSyncing(true);
    try {
      // Find or create user's pipeline + leads stage
      let { data: pipelines } = await supabase
        .from('crm_pipelines')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);
      let pipelineId = pipelines?.[0]?.id as string | undefined;
      if (!pipelineId) {
        const { data: newPipe, error: pipeErr } = await supabase
          .from('crm_pipelines')
          .insert({ user_id: user.id, name: 'Default' })
          .select('id')
          .single();
        if (pipeErr) throw pipeErr;
        pipelineId = newPipe.id;
      }

      const { data: stages } = await supabase
        .from('crm_stages')
        .select('id, name, position')
        .eq('pipeline_id', pipelineId)
        .order('position', { ascending: true });
      let leadsStage = stages?.find((s: any) => s.name.toLowerCase() === 'leads') || stages?.[0];
      if (!leadsStage) {
        const { data: newStage, error: stErr } = await supabase
          .from('crm_stages')
          .insert({ pipeline_id: pipelineId, name: 'Leads', color: '#3b82f6', position: 0 })
          .select('id, name')
          .single();
        if (stErr) throw stErr;
        leadsStage = newStage;
      }

      const chosen = items.filter(i => selected.has(i.id));

      const { data: existing } = await supabase
        .from('crm_cards')
        .select('title')
        .eq('user_id', user.id);
      const existingTitles = new Set((existing || []).map((c: any) => (c.title || '').toLowerCase()));

      const rows = chosen
        .filter(inv => !existingTitles.has((inv.name || '').toLowerCase()))
        .map((inv, idx) => ({
          stage_id: leadsStage!.id,
          user_id: user.id,
          title: inv.name,
          company_name: inv.name,
          description: [inv.investment_strategy, inv.fund_style].filter(Boolean).join(' · ') || null,
          contact_name: inv.manager || inv.ir_name || null,
          contact_email: inv.ir_email || null,
          contact_phone: inv.ir_phone || null,
          deal_value: inv.average_investment || null,
          priority: inv.accepting_investments ? 'high' : 'medium',
          tags: [inv.city, inv.state, inv.source].filter(Boolean),
          status: 'active',
          tasks: [],
          position: idx,
        }));

      const skipped = chosen.length - rows.length;

      if (rows.length === 0) {
        toast({ title: 'Already synced', description: 'All selected investors are already in your CRM.' });
        return;
      }

      const { error: insErr } = await supabase.from('crm_cards').insert(rows);
      if (insErr) throw insErr;

      toast({
        title: 'Synced to CRM',
        description: `${rows.length} added to "${leadsStage!.name}"${skipped ? `, ${skipped} already existed` : ''}.`,
      });
      clearSelection();
    } catch (err: any) {
      console.error('Sync selected investors error:', err);
      toast({ title: 'Sync failed', description: err.message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const buildMailto = (inv: DirectoryInvestor) => {
    const subject = encodeURIComponent(
      startupName ? `Introduction: ${startupName}` : 'Investment opportunity'
    );
    const body = encodeURIComponent(
      `Hello ${inv.ir_name ?? 'team'},\n\nI'd like to introduce ${startupName ?? 'our startup'} and explore a potential fit with ${inv.name}.\n\nBest regards`
    );
    return `mailto:${inv.ir_email}?subject=${subject}&body=${body}`;
  };

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Investor Directory ({total.toLocaleString()})
          <Badge variant="outline" className="ml-2 text-xs">SBIC</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          SBA-licensed funds. Not platform users — contact via investor relations email.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, manager, city, strategy..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
            />
          </div>
          <Select value={stateFilter} onValueChange={(v) => { setStateFilter(v); setVisible(PAGE_SIZE); }}>
            <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent className="bg-background backdrop-blur-none max-h-72">
              <SelectItem value="all">All states</SelectItem>
              {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={strategyFilter} onValueChange={(v) => { setStrategyFilter(v); setVisible(PAGE_SIZE); }}>
            <SelectTrigger><SelectValue placeholder="Strategy" /></SelectTrigger>
            <SelectContent className="bg-background backdrop-blur-none max-h-72">
              <SelectItem value="all">All strategies</SelectItem>
              {strategies.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Switch id="accepting" checked={acceptingOnly} onCheckedChange={(v) => { setAcceptingOnly(v); setVisible(PAGE_SIZE); }} />
            <Label htmlFor="accepting" className="text-sm">Accepting new investments only</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            {filtered.length.toLocaleString()} match{filtered.length === 1 ? '' : 'es'}
          </p>
        </div>

        {/* Selection toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3 rounded-md border border-border/50 bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-filtered"
                checked={allFilteredSelected}
                onCheckedChange={toggleAllFiltered}
              />
              <Label htmlFor="select-all-filtered" className="text-sm cursor-pointer">
                Select all filtered ({filtered.length})
              </Label>
            </div>
            <span className="text-sm text-muted-foreground">
              {selected.size} selected
            </span>
            {selected.size > 0 && (
              <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
            )}
          </div>
          <Button
            size="sm"
            onClick={syncSelectedToCRM}
            disabled={syncing || selected.size === 0}
          >
            {syncing ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Syncing...</>
            ) : (
              <><Download className="h-3.5 w-3.5 mr-1" /> Sync selected to CRM</>
            )}
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="mt-3 text-sm text-muted-foreground">Loading directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No matching funds.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shown.map(inv => {
                const isChecked = selected.has(inv.id);
                return (
                <Card
                  key={inv.id}
                  className={`tech-card border-0 hover:scale-[1.01] transition-transform ${isChecked ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleOne(inv.id)}
                          className="mt-1"
                          aria-label={`Select ${inv.name}`}
                        />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground leading-tight">{inv.name}</h4>
                          {inv.manager && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{inv.manager}</p>
                          )}
                        </div>
                      </div>
                      {inv.accepting_investments ? (
                        <Badge className="bg-green-500/10 text-green-500 text-[10px] shrink-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Open
                        </Badge>
                      ) : inv.accepting_investments === false ? (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
                          <XCircle className="h-3 w-3 mr-1" /> Closed
                        </Badge>
                      ) : null}
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {(inv.city || inv.state) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {[inv.city, inv.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {inv.vintage_year && (
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Vintage {inv.vintage_year}
                        </div>
                      )}
                      {inv.fund_size && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5" />
                          Fund size {fmtMoney(inv.fund_size)}
                        </div>
                      )}
                      {inv.average_investment && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5" />
                          Avg check {fmtMoney(inv.average_investment)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {inv.investment_strategy && (
                        <Badge variant="secondary" className="text-[10px]">{inv.investment_strategy}</Badge>
                      )}
                      {inv.fund_style && (
                        <Badge variant="outline" className="text-[10px]">{inv.fund_style}</Badge>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      {inv.ir_email && (
                        <Button asChild size="sm" className="flex-1">
                          <a href={buildMailto(inv)}>
                            <Mail className="h-3.5 w-3.5 mr-1" /> Contact
                          </a>
                        </Button>
                      )}
                      {inv.ir_phone && (
                        <Button asChild size="sm" variant="outline">
                          <a href={`tel:${inv.ir_phone.replace(/[^\d+]/g, '')}`} aria-label={`Call ${inv.ir_name ?? inv.name}`}>
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                    {inv.ir_name && (
                      <p className="text-[10px] text-muted-foreground">Contact: {inv.ir_name}</p>
                    )}
                  </CardContent>
                </Card>
                );
              })}
            </div>

            {visible < filtered.length && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={() => setVisible(v => v + PAGE_SIZE)}>
                  Load more ({filtered.length - visible} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
