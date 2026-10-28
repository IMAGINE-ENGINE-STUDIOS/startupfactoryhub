import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Fundability Score (added 2026-10-28)
// ------------------------------------------------------------------
// A 0-100, fully explainable score computed ONLY from real data the
// platform already has: the founder's company profile, their market
// signal (the same numbers useStartupAnalytics already loads), and
// the live grant matcher (match_startup_to_grants RPC, the same one
// Genius and generate-recommendations call). No AI guesses, no
// invented numbers — every point maps to a checklist item the
// founder can fix, and the top gaps become the "fix this" list.

export interface FundabilitySignal {
  followers: number;
  connections: number;
  posts: number;
  engagement: number; // 0-100 signal score from useStartupAnalytics
}

export interface FundabilityItem {
  key: string;
  label: string;
  points: number;
  earned: number;
  fix: string;
}

export interface FundabilityCategory {
  key: 'profile' | 'readiness' | 'signal' | 'grants';
  label: string;
  max: number;
  earned: number;
  items: FundabilityItem[];
}

export interface FundabilityGrant {
  resource_id: string;
  title: string;
  amount_text: string | null;
  deadline: string | null;
  is_rolling: boolean;
  score: number;
  unlocked: boolean;
}

export interface FundabilityData {
  loading: boolean;
  hasCompany: boolean;
  companyName: string | null;
  companyStage: string | null;
  score: number;
  categories: FundabilityCategory[];
  gaps: FundabilityItem[]; // top un-earned items, biggest points first
  grants: FundabilityGrant[];
  unlockedGrantCount: number;
}

const EMPTY: FundabilityData = {
  loading: true,
  hasCompany: false,
  companyName: null,
  companyStage: null,
  score: 0,
  categories: [],
  gaps: [],
  grants: [],
  unlockedGrantCount: 0,
};

export function computeFundability(
  company: Record<string, any> | null,
  signal: FundabilitySignal,
  grants: FundabilityGrant[],
): Omit<FundabilityData, 'loading'> {
  const c = company ?? {};
  const descLen = typeof c.description === 'string' ? c.description.trim().length : 0;
  const lookingFor: string[] = Array.isArray(c.looking_for) ? c.looking_for : [];
  const lookingText = lookingFor.join(' ').toLowerCase();
  const teamSize = typeof c.team_size === 'number' ? c.team_size : 0;
  const network = (signal.followers ?? 0) + (signal.connections ?? 0);
  const unlocked = grants.filter((g) => g.unlocked);
  const topGrantScore = grants.reduce((m, g) => Math.max(m, g.score ?? 0), 0);
  const eligibilityStated =
    !!c.country || !!c.state || c.is_women_owned != null || c.is_minority_owned != null ||
    (Array.isArray(c.tags) && c.tags.length > 0);

  const categories: FundabilityCategory[] = [
    {
      key: 'profile',
      label: 'Company profile',
      max: 30,
      earned: 0,
      items: [
        { key: 'name', label: 'Company name set', points: 3, earned: c.name ? 3 : 0, fix: 'Add your company name in your company profile.' },
        { key: 'description', label: 'Description that sells the company (120+ characters)', points: 7, earned: descLen >= 120 ? 7 : descLen > 0 ? 3 : 0, fix: 'Write a 120+ character description: what you build, who for, why now.' },
        { key: 'industry', label: 'Industry set', points: 5, earned: c.industry ? 5 : 0, fix: 'Set your industry so investors and grants can match you.' },
        { key: 'stage', label: 'Stage set', points: 5, earned: c.stage ? 5 : 0, fix: 'Set your current stage (idea, MVP, seed...).' },
        { key: 'website', label: 'Website linked', points: 5, earned: c.website ? 5 : 0, fix: 'Link your website or landing page.' },
        { key: 'logo', label: 'Logo uploaded', points: 5, earned: c.logo_url ? 5 : 0, fix: 'Upload your logo — profiles with logos get taken seriously.' },
      ],
    },
    {
      key: 'readiness',
      label: 'Investor readiness',
      max: 30,
      earned: 0,
      items: [
        { key: 'deck', label: 'Pitch deck uploaded', points: 12, earned: c.pitch_deck_url ? 12 : 0, fix: 'Upload your pitch deck — this is the single biggest point gain.' },
        { key: 'looking', label: 'States what you are looking for (funding / investors)', points: 6, earned: /fund|invest|capital|raise/.test(lookingText) ? 6 : lookingFor.length > 0 ? 3 : 0, fix: 'Add "funding" or "investors" to what you are looking for.' },
        { key: 'team', label: 'Team of 2 or more', points: 6, earned: teamSize >= 2 ? 6 : teamSize === 1 ? 3 : 0, fix: 'Add your team size — solo profiles score lower with investors.' },
        { key: 'founded', label: 'Founded year set', points: 3, earned: c.founded_year ? 3 : 0, fix: 'Add the year you founded the company.' },
        { key: 'funding', label: 'Funding raised so far stated', points: 3, earned: Number(c.funding_amount) > 0 ? 3 : 0, fix: 'Record any funding raised so far, even a small first check.' },
      ],
    },
    {
      key: 'signal',
      label: 'Market signal',
      max: 20,
      earned: 0,
      items: [
        { key: 'network', label: 'Network on the platform (followers + connections)', points: 8, earned: network >= 10 ? 8 : network >= 1 ? 4 : 0, fix: 'Connect with founders and investors on the platform — 10+ connections maxes this.' },
        { key: 'activity', label: 'Posting activity in range', points: 6, earned: (signal.posts ?? 0) >= 3 ? 6 : (signal.posts ?? 0) >= 1 ? 3 : 0, fix: 'Post your progress — 3+ posts in the period maxes this.' },
        { key: 'engagement', label: 'Engagement signal', points: 6, earned: Math.round(Math.min(100, Math.max(0, signal.engagement ?? 0)) / 100 * 6), fix: 'Comment, share and engage — your signal score feeds this directly.' },
      ],
    },
    {
      key: 'grants',
      label: 'Grant readiness',
      max: 20,
      earned: 0,
      items: [
        { key: 'unlocked', label: 'Grants unlocked for your company', points: 10, earned: unlocked.length >= 3 ? 10 : unlocked.length >= 1 ? 6 : grants.length > 0 ? 3 : 0, fix: 'Complete your profile facts (stage, industry, location) to unlock more grants.' },
        { key: 'grantfit', label: 'Best grant match strength', points: 6, earned: Math.round(Math.min(100, topGrantScore) / 100 * 6), fix: 'Raise your best grant match by finishing the fields each grant checks.' },
        { key: 'eligibility', label: 'Eligibility facts stated (location / ownership / tags)', points: 4, earned: eligibilityStated ? 4 : 0, fix: 'Add your country/state and ownership facts to your company profile.' },
      ],
    },
  ];

  for (const cat of categories) {
    cat.earned = cat.items.reduce((s, i) => s + i.earned, 0);
  }
  const score = categories.reduce((s, cat) => s + cat.earned, 0);
  const gaps = categories
    .flatMap((cat) => cat.items)
    .filter((i) => i.earned < i.points)
    .sort((a, b) => (b.points - b.earned) - (a.points - a.earned))
    .slice(0, 3);

  return {
    hasCompany: !!company,
    companyName: c.name ?? null,
    companyStage: c.stage ?? null,
    score,
    categories,
    gaps,
    grants,
    unlockedGrantCount: unlocked.length,
  };
}

export const useFundabilityScoreForUser = (
  targetUserId: string | undefined,
  signal: FundabilitySignal,
) => {
  const [data, setData] = useState<FundabilityData>(EMPTY);
  const signalKey = `${signal.followers}|${signal.connections}|${signal.posts}|${signal.engagement}`;

  useEffect(() => {
    if (!targetUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        let grants: FundabilityGrant[] = [];
        if (company?.id) {
          // Same matcher Genius + generate-recommendations use. If the
          // RPC is unavailable for any reason, the score still works —
          // the grants category simply earns from profile facts alone.
          const { data: matches } = await (supabase as any).rpc('match_startup_to_grants', {
            p_company_id: company.id,
            p_limit: 10,
          });
          if (Array.isArray(matches)) {
            grants = matches.map((m: any) => ({
              resource_id: m.resource_id,
              title: m.title,
              amount_text: m.amount_text ?? null,
              deadline: m.deadline ?? null,
              is_rolling: !!m.is_rolling,
              score: m.score ?? 0,
              unlocked: !!m.unlocked,
            }));
          }
        }
        if (cancelled) return;
        const computed = computeFundability(company as any, signal, grants);
        setData({ ...computed, loading: false });
      } catch (err) {
        console.error('Fundability score error:', err);
        if (!cancelled) setData({ ...EMPTY, loading: false });
      }
    })();
    return () => { cancelled = true; };
    // signalKey is the stable digest of the signal inputs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, signalKey]);

  return useMemo(() => data, [data]);
};

export const useFundabilityScore = (signal: FundabilitySignal) => {
  const { user } = useAuth();
  return useFundabilityScoreForUser(user?.id, signal);
};
