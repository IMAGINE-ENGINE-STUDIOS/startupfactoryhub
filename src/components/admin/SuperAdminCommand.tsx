import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import { useSuperAdminData, type NamedCount } from '@/hooks/useSuperAdminData';

// HUB // MATRIX — Super Admin command interface, styled after the founder's
// Matrix design and wired ONLY to the platform's real data and logic:
// pipeline = companies table, load = imagine-ai credit ledger + genius usage,
// capital = companies.looking_for + reported funding, logs = credit ledger,
// specialists = mentor/advisor roles, network = investor roles, demographics
// and industry = profiles + companies. No placeholder metrics.

const MONO = '"JetBrains Mono", ui-monospace, monospace';
const GROTESK = '"Space Grotesk", ui-sans-serif, system-ui, sans-serif';
const CYAN = '#00E5FF';
const MINT = '#2EF8A0';
const TEAL = '#4E7A73';
const AMBER = '#FFB86A';
const PINK = '#FF3D6E';
const PIE = [CYAN, MINT, '#FFB86A', '#FF8A3D', '#FF3D6E', '#7BC4B6', '#00FFCC', '#6FA99C'];

const fmt = (n: number) => n.toLocaleString();
const money = (n: number) => '$' + Math.round(n).toLocaleString();

function Label({ children, color = TEAL }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{ fontFamily: MONO, color }} className="text-[10px] tracking-[0.18em] uppercase">
      {children}
    </p>
  );
}

function Panel({ title, right, children, className = '' }: { title: string; right?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-md border border-cyan-400/15 bg-[#0A1418] ${className}`}>
      <header className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/[0.05]">
        <Label color={CYAN}>{title}</Label>
        {right ? <Label>{right}</Label> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function RankList({ rows, color = MINT, suffix }: { rows: NamedCount[]; color?: string; suffix?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) return <p className="text-xs" style={{ color: TEAL }}>NO DATA LOGGED</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.name}>
          <div className="flex justify-between text-xs mb-1" style={{ fontFamily: MONO }}>
            <span className="capitalize truncate pr-2 text-white/85">{r.name}</span>
            <span style={{ color: TEAL }}>{fmt(r.count)}{suffix || ''}</span>
          </div>
          <div className="h-1 rounded bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded" style={{ width: `${(r.count / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function stageTone(stage: string): string {
  const s = stage.toLowerCase();
  if (/series|growth|funded|exit/.test(s)) return MINT;
  if (/seed/.test(s)) return CYAN;
  if (/pre|idea|concept|mvp/.test(s)) return AMBER;
  return '#7BC4B6';
}

const SuperAdminCommand = () => {
  const d = useSuperAdminData();
  const wow = d.signupsPrev7d > 0 ? Math.round(((d.signups7d - d.signupsPrev7d) / d.signupsPrev7d) * 100) : null;
  const fundingTotal = d.fundingByIndustry.reduce((s, f) => s + f.total, 0);
  const advisors = d.usersByRole.find((r) => r.name === 'advisor')?.count || 0;
  const histo = d.series.slice(-14);
  const histoMax = Math.max(1, ...histo.map((p) => p.signups));

  if (d.loading) {
    return (
      <div className="flex items-center justify-center py-24" style={{ fontFamily: MONO }}>
        <p className="text-xs tracking-[0.2em]" style={{ color: CYAN }}>ESTABLISHING UPLINK…</p>
      </div>
    );
  }

  const stats: { label: string; value: string; sub: string; color: string }[] = [
    { label: 'MATURITY VELOCITY', value: wow === null ? `${fmt(d.signups7d)} NEW` : `${wow >= 0 ? '+' : ''}${wow}% WoW`, sub: `${fmt(d.signups7d)} signups / 7d · ${fmt(d.totalUsers)} total users`, color: MINT },
    { label: 'FACTORY FLOOR LOAD', value: fmt(Math.round(d.aiCreditsUsed30d)), sub: `AI credits / 30d · ${fmt(d.geniusTurnsMonth)} Genius turns this month`, color: CYAN },
    { label: 'AWAITING CAPITAL', value: fmt(d.seekingCapital), sub: `companies seeking funding · ${money(fundingTotal)} reported raised`, color: AMBER },
    { label: 'PLATFORM REVENUE // 30D', value: money(d.salesRevenue30d), sub: `${money(d.salesFees30d)} platform fees · ${fmt(d.payingUsers)} paying users (${d.conversionPct}%)`, color: '#00FFCC' },
  ];

  return (
    <div style={{ fontFamily: GROTESK }} className="rounded-lg border border-cyan-400/15 bg-[#061016] p-4 sm:p-5 space-y-4 text-white">
      {/* Header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <p style={{ fontFamily: MONO, color: TEAL }} className="text-[10px] tracking-[0.25em]">STARTUP FACTORY</p>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-wide">HUB <span style={{ color: CYAN }}>//</span> MATRIX</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2" style={{ fontFamily: MONO }}>
          <span className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] px-2.5 py-1 rounded border" style={{ color: MINT, borderColor: 'rgba(46,248,160,0.35)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: MINT }} /> OPERATIONAL
          </span>
          <span className="text-[10px] tracking-[0.15em] px-2.5 py-1 rounded border border-white/10" style={{ color: CYAN }}>{fmt(d.onlineNow)} ONLINE</span>
          <span className="text-[10px] tracking-[0.15em] px-2.5 py-1 rounded border border-white/10" style={{ color: TEAL }}>SYNC: LIVE</span>
        </div>
      </div>

      {/* Stat band */}
      <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md border border-white/[0.07] bg-[#0A1418] p-4">
            <Label color={s.color}>{s.label}</Label>
            <p className="text-2xl font-semibold mt-1.5" style={{ fontFamily: MONO }}>{s.value}</p>
            <p className="text-[11px] mt-1" style={{ color: TEAL }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Signals */}
      {d.insights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {d.insights.slice(0, 4).map((ins, i) => (
            <p key={i} className="text-[11px] px-3 py-1.5 rounded border border-white/[0.08] bg-white/[0.02]" style={{ fontFamily: MONO, color: '#BFEFE7' }}>
              <span style={{ color: CYAN }}>▸ </span>{ins.text}
            </p>
          ))}
        </div>
      )}

      {/* Pipeline + right rail */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="PIPELINE OVERVIEW" right={`${fmt(d.totalCompanies)} VENTURES`} className="xl:col-span-2">
          {d.pipeline.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr style={{ fontFamily: MONO, color: TEAL }} className="text-left text-[10px] tracking-[0.18em]">
                    <th className="pb-2 pr-3 font-medium">VENTURE</th>
                    <th className="pb-2 pr-3 font-medium">INDUSTRY</th>
                    <th className="pb-2 pr-3 font-medium">STAGE</th>
                    <th className="pb-2 font-medium">LOCATION</th>
                  </tr>
                </thead>
                <tbody>
                  {d.pipeline.map((co, i) => (
                    <tr key={i} className="border-t border-white/[0.05]">
                      <td className="py-2.5 pr-3">
                        <span className="font-medium text-white/90">{co.name}</span>
                        {co.lookingFor ? <span className="block text-[11px]" style={{ color: TEAL }}>seeking: {co.lookingFor}</span> : null}
                      </td>
                      <td className="py-2.5 pr-3 capitalize text-white/70">{co.industry}</td>
                      <td className="py-2.5 pr-3">
                        <span className="text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider" style={{ fontFamily: MONO, color: stageTone(co.stage), borderColor: stageTone(co.stage) + '55' }}>{co.stage}</span>
                      </td>
                      <td className="py-2.5 text-white/70">{co.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-xs" style={{ color: TEAL }}>NO VENTURES LOGGED</p>}
        </Panel>

        <div className="space-y-4">
          <Panel title="SPECIALISTS // ON-DECK" right="ROLES">
            <div className="space-y-2 text-sm" style={{ fontFamily: MONO }}>
              <p className="flex justify-between"><span className="text-white/80">MENTORS</span><span style={{ color: MINT }}>{fmt(d.mentors)}</span></p>
              <p className="flex justify-between"><span className="text-white/80">ADVISORS</span><span style={{ color: MINT }}>{fmt(advisors)}</span></p>
              <p className="flex justify-between"><span className="text-white/80">INVESTOR NETWORK</span><span style={{ color: CYAN }}>{fmt(d.investors)}</span></p>
              <p className="flex justify-between"><span className="text-white/80">ONLINE NOW</span><span style={{ color: CYAN }}>{fmt(d.onlineNow)}</span></p>
            </div>
          </Panel>
          <Panel title="HISTOGRAM // SIGNUPS 14D">
            <div className="flex items-end gap-1 h-20">
              {histo.map((p, i) => (
                <div key={i} className="flex-1 rounded-t" title={`${p.day}: ${p.signups}`}
                  style={{ height: `${Math.max(6, (p.signups / histoMax) * 100)}%`, background: i === histo.length - 1 ? CYAN : 'rgba(0,229,255,0.35)' }} />
              ))}
            </div>
            <p className="text-[10px] mt-2" style={{ fontFamily: MONO, color: TEAL }}>LAST 14 DAYS · PEAK {fmt(histoMax)}/DAY</p>
          </Panel>
        </div>
      </div>

      {/* Growth + Imagine Engine */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="GROWTH ORBITAL" right="SIGNUPS // 30D">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: MONO }} stroke={TEAL} />
                <YAxis tick={{ fontSize: 10, fontFamily: MONO }} stroke={TEAL} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0A1418', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 4, fontSize: 12, fontFamily: MONO }} />
                <Area type="monotone" dataKey="signups" stroke={MINT} fill={MINT} fillOpacity={0.18} name="Signups" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="IMAGINE ENGINE" right={`LLAMA ${d.llamaSharePct}%`}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>CREDITS BY TIER</Label>
              <div className="mt-2"><RankList rows={d.aiByTier} color={CYAN} suffix=" cr" /></div>
            </div>
            <div>
              <Label>CREDITS BY MODEL</Label>
              <div className="mt-2"><RankList rows={d.aiByModel} color={MINT} suffix=" cr" /></div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Demographics + industry + logs */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="DEMOGRAPHICS // USERS BY INDUSTRY">
          {d.usersByIndustry.length ? (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={d.usersByIndustry} dataKey="count" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={2}>
                      {d.usersByIndustry.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0A1418', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 4, fontSize: 12, fontFamily: MONO }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {d.usersByIndustry.slice(0, 5).map((r, i) => (
                  <span key={r.name} className="text-[10px]" style={{ fontFamily: MONO, color: TEAL }}>
                    <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: PIE[i % PIE.length] }} />{r.name} ({fmt(r.count)})
                  </span>
                ))}
              </div>
            </>
          ) : <p className="text-xs" style={{ color: TEAL }}>NO INDUSTRY DATA ON PROFILES</p>}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div><Label>BY ROLE</Label><div className="mt-2"><RankList rows={d.usersByRole} color={CYAN} /></div></div>
            <div><Label>TOP LOCATIONS</Label><div className="mt-2"><RankList rows={d.topLocations} color={MINT} /></div></div>
          </div>
        </Panel>

        <Panel title="INDUSTRY INSIGHTS // COMPANIES">
          <Label>BY INDUSTRY</Label>
          <div className="mt-2"><RankList rows={d.companiesByIndustry} /></div>
          <div className="mt-4"><Label>BY STAGE</Label></div>
          <div className="mt-2"><RankList rows={d.companiesByStage} color={CYAN} /></div>
          {d.fundingByIndustry.length ? (
            <div className="mt-4">
              <Label>REPORTED FUNDING</Label>
              <div className="mt-2 space-y-1.5" style={{ fontFamily: MONO }}>
                {d.fundingByIndustry.map((f) => (
                  <p key={f.name} className="flex justify-between text-xs"><span className="capitalize text-white/80">{f.name}</span><span style={{ color: AMBER }}>{money(f.total)}</span></p>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>

        <Panel title="SYSTEM LOGS" right="AI CREDIT LEDGER">
          {d.activity.length ? (
            <div className="space-y-1.5" style={{ fontFamily: MONO }}>
              {d.activity.map((a, i) => (
                <p key={i} className="text-[11px] flex items-baseline gap-2">
                  <span style={{ color: TEAL }}>{new Date(a.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="truncate text-white/75 flex-1">{a.label}</span>
                  <span style={{ color: a.delta < 0 ? PINK : MINT }}>{a.delta > 0 ? '+' : ''}{a.delta}</span>
                </p>
              ))}
            </div>
          ) : <p className="text-xs" style={{ color: TEAL }}>NO LEDGER ACTIVITY LOGGED</p>}
        </Panel>
      </div>
    </div>
  );
};

export default SuperAdminCommand;
