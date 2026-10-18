import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, UserPlus, Building2, CreditCard, Sparkles, ShoppingBag, Coins,
  TrendingUp, TrendingDown, BrainCircuit, Globe, Rocket, CircleDollarSign, Radio,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useSuperAdminData, type NamedCount } from '@/hooks/useSuperAdminData';

// Super Admin Command Center: the executive layer of /admin. One screen for
// productivity (AI + Genius usage), demographics, AI intelligence, industry
// insights and rule-based strategic signals — all computed live from Supabase.

const COLORS = ['#10B981', '#8B5CF6', '#38BDF8', '#F59E0B', '#F43F5E', '#22D3EE', '#A3E635', '#FB923C'];
const fmt = (n: number) => n.toLocaleString();
const money = (n: number) => '$' + Math.round(n).toLocaleString();

function Kpi({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string; sub?: string; accent: string }) {
  return (
    <Card className="bg-white/[0.03] border-white/[0.08] backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub ? <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p> : null}
      </CardContent>
    </Card>
  );
}

function RankList({ rows, suffix }: { rows: NamedCount[]; suffix?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) return <p className="text-sm text-muted-foreground">No data yet.</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.name}>
          <div className="flex justify-between text-xs mb-1">
            <span className="capitalize truncate pr-2">{r.name}</span>
            <span className="text-muted-foreground">{fmt(r.count)}{suffix || ''}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-emerald-400/80" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Panel({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card className="bg-white/[0.03] border-white/[0.08] backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const SuperAdminCommand = () => {
  const d = useSuperAdminData();
  const wow = d.signupsPrev7d > 0 ? Math.round(((d.signups7d - d.signupsPrev7d) / d.signupsPrev7d) * 100) : null;

  if (d.loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Collecting platform intelligence…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" /> Command Center
          </h2>
          <p className="text-sm text-muted-foreground">Productivity, demographics, AI intelligence and strategic signals — live from your Supabase.</p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300">
          <Radio className="h-3.5 w-3.5 animate-pulse" /> {fmt(d.onlineNow)} online now
        </div>
      </div>

      {/* Strategic insights */}
      {d.insights.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {d.insights.slice(0, 6).map((ins, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              {ins.kind === 'growth' ? <TrendingUp className="h-4 w-4 mt-0.5 text-emerald-400 shrink-0" />
                : ins.kind === 'ai' ? <Sparkles className="h-4 w-4 mt-0.5 text-violet-400 shrink-0" />
                : ins.kind === 'money' ? <CircleDollarSign className="h-4 w-4 mt-0.5 text-amber-400 shrink-0" />
                : <Rocket className="h-4 w-4 mt-0.5 text-sky-400 shrink-0" />}
              <p className="text-sm leading-snug">{ins.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* KPI row */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Kpi icon={Users} label="Total Users" value={fmt(d.totalUsers)} sub={`${fmt(d.signups30d)} new in 30 days`} accent="#38BDF8" />
        <Kpi icon={UserPlus} label="Signups (7d)" value={fmt(d.signups7d)} sub={wow === null ? 'first week of data' : `${wow >= 0 ? '+' : ''}${wow}% vs prior week`} accent="#10B981" />
        <Kpi icon={CreditCard} label="Paying Users" value={fmt(d.payingUsers)} sub={`${d.conversionPct}% of accounts`} accent="#F59E0B" />
        <Kpi icon={Building2} label="Companies" value={fmt(d.totalCompanies)} sub={`${fmt(d.newCompanies30d)} new in 30 days`} accent="#8B5CF6" />
        <Kpi icon={Coins} label="AI Credits Used (30d)" value={fmt(Math.round(d.aiCreditsUsed30d))} sub={`${fmt(Math.round(d.creditBalances))} credits in user balances`} accent="#F43F5E" />
        <Kpi icon={Sparkles} label="Genius AI Turns (month)" value={fmt(d.geniusTurnsMonth)} sub={`${fmt(d.geniusUsersMonth)} active users`} accent="#A78BFA" />
        <Kpi icon={ShoppingBag} label="Marketplace Sales (30d)" value={money(d.salesRevenue30d)} sub={`${money(d.salesFees30d)} platform fees`} accent="#22D3EE" />
        <Kpi icon={BrainCircuit} label="Llama Share of AI" value={`${d.llamaSharePct}%`} sub="of metered AI credit usage" accent="#A3E635" />
      </div>

      {/* Growth + AI productivity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel icon={TrendingUp} title="Growth — signups, last 30 days">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#888" />
                <YAxis tick={{ fontSize: 10 }} stroke="#888" allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="signups" stroke="#10B981" fill="#10B981" fillOpacity={0.25} name="Signups" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel icon={Coins} title="Productivity — AI credits consumed per day">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#888" />
                <YAxis tick={{ fontSize: 10 }} stroke="#888" />
                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="aiCredits" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="AI credits" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Demographics */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel icon={Users} title="Demographics — users by industry">
          {d.usersByIndustry.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={d.usersByIndustry} dataKey="count" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {d.usersByIndustry.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {d.usersByIndustry.slice(0, 5).map((r, i) => (
                  <span key={r.name} className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} /> {r.name} ({fmt(r.count)})
                  </span>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-muted-foreground">No industry data on profiles yet.</p>}
        </Panel>
        <Panel icon={Users} title="Demographics — users by role">
          <RankList rows={d.usersByRole} />
        </Panel>
        <Panel icon={Globe} title="Demographics — top locations">
          <RankList rows={d.topLocations} />
        </Panel>
      </div>

      {/* Industry insights */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel icon={Building2} title="Industry insights — companies by industry">
          <RankList rows={d.companiesByIndustry} />
        </Panel>
        <Panel icon={Rocket} title="Industry insights — companies by stage">
          <RankList rows={d.companiesByStage} />
        </Panel>
        <Panel icon={CircleDollarSign} title="Industry insights — reported funding">
          {d.fundingByIndustry.length ? (
            <div className="space-y-2.5">
              {d.fundingByIndustry.map((f) => (
                <div key={f.name} className="flex justify-between text-sm">
                  <span className="capitalize truncate pr-2">{f.name}</span>
                  <span className="font-semibold">{money(f.total)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No funding amounts reported yet.</p>}
        </Panel>
      </div>

      {/* AI intelligence */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel icon={BrainCircuit} title="AI intelligence — credits by tier">
          {d.aiByTier.length ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.aiByTier} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="#888" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#888" width={70} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#38BDF8" radius={[0, 4, 4, 0]} name="Credits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground">No metered AI usage recorded yet — usage will appear here as Imagine AI runs.</p>}
        </Panel>
        <Panel icon={Sparkles} title="AI intelligence — credits by model">
          <RankList rows={d.aiByModel} suffix=" cr" />
          <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
            {d.llamaSharePct >= 50 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : <TrendingDown className="h-3.5 w-3.5 text-amber-400" />}
            Llama currently powers {d.llamaSharePct}% of metered AI usage.
          </p>
        </Panel>
      </div>
    </div>
  );
};

export default SuperAdminCommand;
