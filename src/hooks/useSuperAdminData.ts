import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Super Admin Command Center data layer: aggregates platform-wide signals from
// Supabase (users, companies, AI credit ledger, Genius usage, marketplace sales)
// into KPIs, time series, demographics, AI intelligence and rule-based insights.
// Every query is independent: a table the admin cannot read degrades to empty
// instead of breaking the whole dashboard.

export interface DayPoint { day: string; signups: number; aiCredits: number }
export interface NamedCount { name: string; count: number }
export interface Insight { kind: 'growth' | 'ai' | 'market' | 'money' | 'alert'; text: string }

export interface SuperAdminData {
  loading: boolean;
  totalUsers: number;
  onlineNow: number;
  signups7d: number;
  signups30d: number;
  signupsPrev7d: number;
  totalCompanies: number;
  newCompanies30d: number;
  payingUsers: number;
  conversionPct: number;
  creditBalances: number;
  aiCreditsUsed30d: number;
  geniusTurnsMonth: number;
  geniusUsersMonth: number;
  salesRevenue30d: number;
  salesFees30d: number;
  series: DayPoint[];
  usersByIndustry: NamedCount[];
  usersByRole: NamedCount[];
  topLocations: NamedCount[];
  companiesByIndustry: NamedCount[];
  companiesByStage: NamedCount[];
  fundingByIndustry: { name: string; total: number }[];
  aiByTier: NamedCount[];
  aiByModel: NamedCount[];
  llamaSharePct: number;
  insights: Insight[];
}

const EMPTY: SuperAdminData = {
  loading: true,
  totalUsers: 0, onlineNow: 0, signups7d: 0, signups30d: 0, signupsPrev7d: 0,
  totalCompanies: 0, newCompanies30d: 0, payingUsers: 0, conversionPct: 0,
  creditBalances: 0, aiCreditsUsed30d: 0, geniusTurnsMonth: 0, geniusUsersMonth: 0,
  salesRevenue30d: 0, salesFees30d: 0, series: [],
  usersByIndustry: [], usersByRole: [], topLocations: [],
  companiesByIndustry: [], companiesByStage: [], fundingByIndustry: [],
  aiByTier: [], aiByModel: [], llamaSharePct: 0, insights: [],
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

function countBy<T>(rows: T[], pick: (r: T) => string | null | undefined, limit = 8): NamedCount[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const v = (pick(r) || '').toString().trim();
    if (!v) continue;
    map.set(v, (map.get(v) || 0) + 1);
  }
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}

export function useSuperAdminData(): SuperAdminData {
  const [raw, setRaw] = useState<{
    profiles: any[]; companies: any[]; credits: any[]; ledger: any[];
    genius: any[]; sales: any[]; roles: any[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const since90 = daysAgo(90).toISOString();
      const monthStart = new Date(); monthStart.setDate(1);
      const q = async (p: PromiseLike<{ data: any; error: any }>) => {
        try { const { data, error } = await p; return error ? [] : (data || []); } catch { return []; }
      };
      const [profiles, companies, credits, ledger, genius, sales, roles] = await Promise.all([
        q(supabase.from('profiles').select('user_id,email,created_at,industry,location,is_online').not('email', 'ilike', 'demo-%@startupfactoryhub.com').limit(20000) as any),
        q(supabase.from('companies').select('created_at,industry,stage,location,funding_amount').limit(20000) as any),
        q(supabase.from('user_ai_credits').select('plan,balance').limit(20000) as any),
        q(supabase.from('ai_credit_ledger').select('created_at,delta,reason').gte('created_at', since90).order('created_at', { ascending: true }).limit(50000) as any),
        q(supabase.from('genius_ai_usage').select('user_id,turns_used,input_tokens,output_tokens,period_start').gte('period_start', dayKey(monthStart)).limit(20000) as any),
        q(supabase.from('profile_sales').select('amount_cents,platform_fee_cents,created_at,status').gte('created_at', daysAgo(90).toISOString()).limit(20000) as any),
        q(supabase.from('user_roles').select('role').limit(20000) as any),
      ]);
      if (!cancelled) setRaw({ profiles, companies, credits, ledger, genius, sales, roles });
    })();
    return () => { cancelled = true; };
  }, []);

  return useMemo<SuperAdminData>(() => {
    if (!raw) return EMPTY;
    const { profiles, companies, credits, ledger, genius, sales, roles } = raw;
    const now = Date.now();
    const inDays = (iso: string, n: number) => now - new Date(iso).getTime() <= n * 86400000;
    const betweenDays = (iso: string, from: number, to: number) => {
      const age = (now - new Date(iso).getTime()) / 86400000;
      return age > from && age <= to;
    };

    const totalUsers = profiles.length;
    const onlineNow = profiles.filter((p) => p.is_online).length;
    const signups7d = profiles.filter((p) => inDays(p.created_at, 7)).length;
    const signupsPrev7d = profiles.filter((p) => betweenDays(p.created_at, 7, 14)).length;
    const signups30d = profiles.filter((p) => inDays(p.created_at, 30)).length;
    const totalCompanies = companies.length;
    const newCompanies30d = companies.filter((c) => inDays(c.created_at, 30)).length;
    const payingUsers = credits.filter((c) => c.plan && c.plan !== 'free').length;
    const creditBalances = Math.round(credits.reduce((s, c) => s + (Number(c.balance) || 0), 0) * 100) / 100;

    // AI credit consumption: ledger rows written by imagine-ai settlement are
    // "usage:<tier>:<provider>/<model>:<in>/<out>:$<cost>" (negative delta);
    // "adjust:" rows refund part of a reserve (positive delta).
    let aiCreditsUsed30d = 0;
    const tierMap = new Map<string, number>();
    const modelMap = new Map<string, number>();
    const perDay = new Map<string, number>();
    for (const row of ledger) {
      const reason = String(row.reason || '');
      const delta = Number(row.delta) || 0;
      if (reason.startsWith('usage:')) {
        const parts = reason.split(':');
        const tier = parts[1] || 'unknown';
        const model = parts[2] || 'unknown';
        const used = Math.abs(delta);
        tierMap.set(tier, (tierMap.get(tier) || 0) + used);
        modelMap.set(model, (modelMap.get(model) || 0) + used);
        if (inDays(row.created_at, 30)) {
          aiCreditsUsed30d += used;
          const k = dayKey(new Date(row.created_at));
          perDay.set(k, (perDay.get(k) || 0) + used);
        }
      } else if (reason.startsWith('adjust:') && inDays(row.created_at, 30)) {
        aiCreditsUsed30d = Math.max(0, aiCreditsUsed30d - Math.abs(delta));
      }
    }
    const aiByTier = [...tierMap.entries()].map(([name, count]) => ({ name, count: Math.round(count * 100) / 100 })).sort((a, b) => b.count - a.count);
    const aiByModel = [...modelMap.entries()].map(([name, count]) => ({ name, count: Math.round(count * 100) / 100 })).sort((a, b) => b.count - a.count).slice(0, 8);
    const totalAiCredits = aiByTier.reduce((s, t) => s + t.count, 0);
    const llamaCredits = aiByTier.filter((t) => /llama/i.test(t.name)).reduce((s, t) => s + t.count, 0);
    const llamaSharePct = totalAiCredits > 0 ? Math.round((llamaCredits / totalAiCredits) * 100) : 0;

    const geniusTurnsMonth = genius.reduce((s, g) => s + (Number(g.turns_used) || 0), 0);
    const geniusUsersMonth = new Set(genius.map((g) => g.user_id)).size;
    const okSales = sales.filter((s) => !s.status || s.status === 'completed' || s.status === 'paid');
    const sales30 = okSales.filter((s) => inDays(s.created_at, 30));
    const salesRevenue30d = sales30.reduce((s, r) => s + (Number(r.amount_cents) || 0), 0) / 100;
    const salesFees30d = sales30.reduce((s, r) => s + (Number(r.platform_fee_cents) || 0), 0) / 100;

    const series: DayPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i); const k = dayKey(d);
      series.push({
        day: k.slice(5),
        signups: profiles.filter((p) => dayKey(new Date(p.created_at)) === k).length,
        aiCredits: Math.round((perDay.get(k) || 0) * 100) / 100,
      });
    }

    const usersByIndustry = countBy(profiles, (p) => p.industry);
    const usersByRole = countBy(roles, (r) => r.role);
    const topLocations = countBy(profiles, (p) => p.location, 6);
    const companiesByIndustry = countBy(companies, (c) => c.industry);
    const companiesByStage = countBy(companies, (c) => c.stage);
    const fundMap = new Map<string, number>();
    for (const c of companies) {
      const ind = (c.industry || '').trim(); const amt = Number(c.funding_amount) || 0;
      if (ind && amt > 0) fundMap.set(ind, (fundMap.get(ind) || 0) + amt);
    }
    const fundingByIndustry = [...fundMap.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 6);

    // Rule-based strategic insights.
    const insights: Insight[] = [];
    if (signupsPrev7d > 0) {
      const pct = Math.round(((signups7d - signupsPrev7d) / signupsPrev7d) * 100);
      insights.push({ kind: 'growth', text: `Signups ${pct >= 0 ? 'up' : 'down'} ${Math.abs(pct)}% week over week (${signups7d} vs ${signupsPrev7d}).` });
    } else if (signups7d > 0) {
      insights.push({ kind: 'growth', text: `${signups7d} new signups in the last 7 days.` });
    }
    if (companiesByIndustry.length) insights.push({ kind: 'market', text: `${companiesByIndustry[0].name} is the largest startup segment: ${companiesByIndustry[0].count} of ${totalCompanies} companies.` });
    if (fundingByIndustry.length) insights.push({ kind: 'money', text: `${fundingByIndustry[0].name} startups report the most funding on-platform: $${Math.round(fundingByIndustry[0].total).toLocaleString()}.` });
    if (totalAiCredits > 0) insights.push({ kind: 'ai', text: `Llama powers ${llamaSharePct}% of metered AI credit usage${aiByModel.length ? `; top model: ${aiByModel[0].name}` : ''}.` });
    if (geniusTurnsMonth > 0) insights.push({ kind: 'ai', text: `Genius AI handled ${geniusTurnsMonth.toLocaleString()} turns this month from ${geniusUsersMonth} users.` });
    const conversionPct = totalUsers > 0 ? Math.round((payingUsers / totalUsers) * 1000) / 10 : 0;
    insights.push({ kind: 'money', text: `${payingUsers} paying users — ${conversionPct}% of all accounts hold a paid AI plan.` });
    if (newCompanies30d > 0) insights.push({ kind: 'market', text: `${newCompanies30d} new companies joined in the last 30 days.` });

    return {
      loading: false,
      totalUsers, onlineNow, signups7d, signups30d, signupsPrev7d,
      totalCompanies, newCompanies30d, payingUsers, conversionPct,
      creditBalances, aiCreditsUsed30d, geniusTurnsMonth, geniusUsersMonth,
      salesRevenue30d, salesFees30d, series,
      usersByIndustry, usersByRole, topLocations,
      companiesByIndustry, companiesByStage, fundingByIndustry,
      aiByTier, aiByModel, llamaSharePct, insights,
    };
  }, [raw]);
}
