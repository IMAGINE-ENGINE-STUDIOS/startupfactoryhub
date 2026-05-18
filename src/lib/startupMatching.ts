// Shared scoring helpers for ranking startups against a viewer's profile.
// Mirrors the algorithm in MatchingSystem.tsx so the Network "Recommended" lists
// and the StartupBrowser "Recommended for you" section stay in sync.

export interface ScoreableCompany {
  industry?: string | null;
  stage?: string | null;
  funding_amount?: number | null;
  looking_for?: string[] | null;
}

export interface InvestorViewer {
  preferred_industries?: string[] | null;
  focus_industries?: string[] | null;
  preferred_stages?: string[] | null;
  investment_range_min?: number | null;
  investment_range_max?: number | null;
}

export interface MentorViewer {
  skills?: string[] | null;
  expertise?: string[] | null;
}

export type ViewerRole = 'investor' | 'mentor' | 'advisor' | 'accelerator' | 'startup' | string;

export interface ScoreResult {
  score: number;
  reasons: string[];
}

const lower = (s?: string | null) => (s ?? '').toLowerCase();

function scoreInvestor(company: ScoreableCompany, v: InvestorViewer): ScoreResult {
  let score = 40;
  const reasons: string[] = [];
  const industries = v.preferred_industries || v.focus_industries || [];
  if (company.industry && industries.some(ind =>
    lower(ind) === lower(company.industry) ||
    lower(company.industry).includes(lower(ind)) ||
    lower(ind).includes(lower(company.industry))
  )) {
    score += 25;
    reasons.push(`Industry match: ${company.industry}`);
  }
  const stages = v.preferred_stages || [];
  if (company.stage && stages.some(s => lower(s) === lower(company.stage))) {
    score += 25;
    reasons.push(`Stage match: ${company.stage}`);
  }
  const lookingFor = company.looking_for || [];
  if (lookingFor.some(l => /invest|funding/i.test(l ?? ''))) {
    score += 15;
    reasons.push('Actively seeking investors');
  }
  const amt = company.funding_amount || 0;
  const min = v.investment_range_min || 0;
  const max = v.investment_range_max || Infinity;
  if (amt >= min && amt <= max) {
    score += 15;
    reasons.push('Within your investment range');
  }
  return { score: Math.min(score, 100), reasons };
}

function scoreMentor(company: ScoreableCompany, v: MentorViewer): ScoreResult {
  let score = 45;
  const reasons: string[] = [];
  const skills = [...(v.skills || []), ...(v.expertise || [])];
  const lookingFor = company.looking_for || [];
  if (lookingFor.some(l => /mentor|advisor|guidance/i.test(l ?? ''))) {
    score += 30;
    reasons.push('Seeking mentorship');
  }
  if (company.industry && skills.some(skill =>
    lower(skill).includes(lower(company.industry)) ||
    lower(company.industry).includes(lower(skill))
  )) {
    score += 25;
    reasons.push(`Matches your ${company.industry} expertise`);
  }
  const early = ['idea', 'pre-seed', 'seed', 'mvp'];
  if (company.stage && early.some(s => lower(company.stage).includes(s))) {
    score += 15;
    reasons.push('Early-stage (ideal for mentoring)');
  }
  return { score: Math.min(score, 100), reasons };
}

export function scoreCompanyForViewer(
  role: ViewerRole | null | undefined,
  viewerProfile: InvestorViewer | MentorViewer | null | undefined,
  company: ScoreableCompany
): ScoreResult {
  if (!role || !viewerProfile) return { score: 0, reasons: [] };
  if (role === 'investor' || role === 'accelerator') {
    return scoreInvestor(company, viewerProfile as InvestorViewer);
  }
  if (role === 'mentor' || role === 'advisor') {
    return scoreMentor(company, viewerProfile as MentorViewer);
  }
  return { score: 0, reasons: [] };
}
