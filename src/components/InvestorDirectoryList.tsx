import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Building2, MapPin, DollarSign, Mail, Phone, Search,
  Briefcase, CalendarDays, CheckCircle2, XCircle,
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
  const [items, setItems] = useState<DirectoryInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [acceptingOnly, setAcceptingOnly] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch id="accepting" checked={acceptingOnly} onCheckedChange={(v) => { setAcceptingOnly(v); setVisible(PAGE_SIZE); }} />
            <Label htmlFor="accepting" className="text-sm">Accepting new investments only</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            {filtered.length.toLocaleString()} match{filtered.length === 1 ? '' : 'es'}
          </p>
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
              {shown.map(inv => (
                <Card key={inv.id} className="tech-card border-0 hover:scale-[1.01] transition-transform">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-foreground leading-tight">{inv.name}</h4>
                        {inv.manager && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{inv.manager}</p>
                        )}
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
              ))}
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
