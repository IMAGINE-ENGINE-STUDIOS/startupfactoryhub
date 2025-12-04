// Startup Scoring System - Company Coefficient, Traction Score, and Emerging Market Score calculations

// Company Coefficient factor weights (as provided)
export const CC_FACTOR_WEIGHTS = {
  founder_team_quality: 2.0,
  intellectual_property: 1.8,
  product_market_fit: 2.0,
  strategic_partnerships: 1.5,
  exit_environment: 1.5,
  supply_chain_stability: 1.2,
  regulatory_momentum: 1.3,
  capital_efficiency: 1.6,
  recurring_revenue_ratio: 1.8,
  tech_replacement_risk: 1.4
};

export const CC_FACTOR_LABELS: Record<string, string> = {
  founder_team_quality: 'Founder / Team Quality',
  intellectual_property: 'Intellectual Property (IP)',
  product_market_fit: 'Product-Market Fit (PMF)',
  strategic_partnerships: 'Strategic Partnerships',
  exit_environment: 'Exit Environment / M&A Trend',
  supply_chain_stability: 'Supply Chain Stability',
  regulatory_momentum: 'Regulatory Momentum',
  capital_efficiency: 'Capital Efficiency',
  recurring_revenue_ratio: 'Recurring Revenue Ratio',
  tech_replacement_risk: 'Technological Replacement Risk'
};

export const CC_FACTOR_DESCRIPTIONS: Record<string, string> = {
  founder_team_quality: 'Experience, domain expertise, and execution capability of the founding team',
  intellectual_property: 'Patents, trade secrets, proprietary technology, and defensible moats',
  product_market_fit: 'Evidence of strong demand and customer validation',
  strategic_partnerships: 'Quality and value of strategic relationships and partnerships',
  exit_environment: 'Favorable conditions for M&A or IPO in the sector',
  supply_chain_stability: 'Reliability and resilience of supply chain dependencies',
  regulatory_momentum: 'Favorable regulatory trends and compliance positioning',
  capital_efficiency: 'Ability to generate results with minimal capital burn',
  recurring_revenue_ratio: 'Percentage of revenue that is recurring (SaaS, subscriptions)',
  tech_replacement_risk: 'Risk of technology becoming obsolete (lower = better)'
};

// Traction Score stage multipliers
export const STAGE_MULTIPLIERS: Record<string, number> = {
  pre_seed: 0.6,
  seed: 0.75,
  series_a: 0.9,
  series_b: 1.0,
  growth: 1.1
};

export const STAGE_LABELS: Record<string, string> = {
  pre_seed: 'Pre-Seed',
  seed: 'Seed',
  series_a: 'Series A',
  series_b: 'Series B',
  growth: 'Growth'
};

// Score tier definitions
export const SCORE_TIERS = [
  { min: 80, max: 100, label: 'High Potential', emoji: '🔥', color: 'emerald', description: 'Top performer, prioritize' },
  { min: 60, max: 79, label: 'Promising', emoji: '⭐', color: 'blue', description: 'Strong potential' },
  { min: 40, max: 59, label: 'Developing', emoji: '📈', color: 'amber', description: 'Needs attention' },
  { min: 0, max: 39, label: 'At Risk', emoji: '⚠️', color: 'red', description: 'Requires intervention' }
];

export interface CCFactorScores {
  founder_team_quality: number;
  intellectual_property: number;
  product_market_fit: number;
  strategic_partnerships: number;
  exit_environment: number;
  supply_chain_stability: number;
  regulatory_momentum: number;
  capital_efficiency: number;
  recurring_revenue_ratio: number;
  tech_replacement_risk: number;
}

export interface TractionMetrics {
  revenue_growth: number; // percentage
  user_pilot_count: number;
  retention_rate: number; // percentage (0-100)
  sales_cycle_days: number;
  stage: string;
}

export interface ScoreWeights {
  alpha: number; // CC weight
  beta: number;  // TS weight
  gamma: number; // EMS multiplier
}

export interface StartupScoreResult {
  companyCoefficient: number;
  tractionScore: number;
  coreScore: number;
  startupScore: number;
  tier: typeof SCORE_TIERS[number];
}

/**
 * Calculate Company Coefficient (1-10 scale)
 * Weighted average of 10 factors
 */
export function calculateCompanyCoefficient(scores: Partial<CCFactorScores>): number {
  const weights = Object.values(CC_FACTOR_WEIGHTS);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  let weightedSum = 0;
  Object.entries(CC_FACTOR_WEIGHTS).forEach(([key, weight]) => {
    const score = scores[key as keyof CCFactorScores] ?? 5;
    weightedSum += score * weight;
  });
  
  return Number((weightedSum / totalWeight).toFixed(2));
}

/**
 * Calculate Traction Score (0-100 scale)
 * Based on revenue growth, users, retention, sales cycle, and stage
 */
export function calculateTractionScore(metrics: TractionMetrics): number {
  // Revenue growth: 0-50% growth = 0-25 points (linear)
  const revenueScore = Math.min(metrics.revenue_growth / 2, 25);
  
  // User/pilot count: 0-100 users = 0-25 points (logarithmic scale)
  const userScore = metrics.user_pilot_count > 0 
    ? Math.min(Math.log10(metrics.user_pilot_count + 1) * 10, 25)
    : 0;
  
  // Retention rate: 0-100% = 0-25 points
  const retentionScore = (metrics.retention_rate / 100) * 25;
  
  // Sales cycle: Shorter is better. 0-300 days maps to 25-0 points
  const cycleScore = Math.max(0, 25 - (metrics.sales_cycle_days / 12));
  
  const baseScore = revenueScore + userScore + retentionScore + cycleScore;
  const stageMultiplier = STAGE_MULTIPLIERS[metrics.stage] ?? 0.75;
  
  return Math.min(Number((baseScore * stageMultiplier).toFixed(2)), 100);
}

/**
 * Normalize an array of scores to 0-1 range
 */
export function normalizeScores(scores: number[]): number[] {
  if (scores.length === 0) return [];
  if (scores.length === 1) return [0.5];
  
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  
  if (max === min) return scores.map(() => 0.5);
  
  return scores.map(s => Number(((s - min) / (max - min)).toFixed(4)));
}

/**
 * Normalize a single score given min/max of cohort
 */
export function normalizeScore(score: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Number(((score - min) / (max - min)).toFixed(4));
}

/**
 * Calculate final Startup Score (0-100)
 * CoreScore = α * CC_normalized + β * TS_normalized
 * StartupScore = CoreScore * γ * EMS_normalized
 */
export function calculateStartupScore(
  ccNormalized: number,
  tsNormalized: number,
  emsNormalized: number,
  weights: ScoreWeights = { alpha: 0.5, beta: 0.5, gamma: 1.0 }
): number {
  const coreScore = weights.alpha * ccNormalized + weights.beta * tsNormalized;
  // Apply EMS as a multiplier that can boost or reduce the score
  const emsMultiplier = 0.5 + (emsNormalized * weights.gamma * 0.5); // Range: 0.5 to 1.0
  const startupScore = coreScore * emsMultiplier * 100;
  
  return Math.round(Math.min(Math.max(startupScore, 0), 100));
}

/**
 * Get score tier based on startup score
 */
export function getScoreTier(score: number): typeof SCORE_TIERS[number] {
  for (const tier of SCORE_TIERS) {
    if (score >= tier.min && score <= tier.max) {
      return tier;
    }
  }
  return SCORE_TIERS[SCORE_TIERS.length - 1];
}

/**
 * Calculate all scores for a single startup
 */
export function calculateAllScores(
  ccFactors: Partial<CCFactorScores>,
  tractionMetrics: TractionMetrics,
  emsScore: number, // 0-100
  weights: ScoreWeights = { alpha: 0.5, beta: 0.5, gamma: 1.0 },
  cohortStats?: { ccMin: number; ccMax: number; tsMin: number; tsMax: number }
): StartupScoreResult {
  const companyCoefficient = calculateCompanyCoefficient(ccFactors);
  const tractionScore = calculateTractionScore(tractionMetrics);
  
  // Normalize scores (if cohort stats provided, use them; otherwise assume this is standalone)
  const ccNormalized = cohortStats 
    ? normalizeScore(companyCoefficient, cohortStats.ccMin, cohortStats.ccMax)
    : companyCoefficient / 10; // Simple 0-1 normalization for standalone
    
  const tsNormalized = cohortStats
    ? normalizeScore(tractionScore, cohortStats.tsMin, cohortStats.tsMax)
    : tractionScore / 100; // Simple 0-1 normalization for standalone
    
  const emsNormalized = emsScore / 100;
  
  const coreScore = weights.alpha * ccNormalized + weights.beta * tsNormalized;
  const startupScore = calculateStartupScore(ccNormalized, tsNormalized, emsNormalized, weights);
  
  return {
    companyCoefficient,
    tractionScore,
    coreScore: Number((coreScore * 100).toFixed(2)),
    startupScore,
    tier: getScoreTier(startupScore)
  };
}

/**
 * Get tier color classes for Tailwind
 */
export function getTierColorClasses(tier: typeof SCORE_TIERS[number]): {
  bg: string;
  text: string;
  border: string;
  glow: string;
} {
  switch (tier.color) {
    case 'emerald':
      return {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/50',
        glow: 'shadow-emerald-500/20'
      };
    case 'blue':
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/50',
        glow: 'shadow-blue-500/20'
      };
    case 'amber':
      return {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/50',
        glow: 'shadow-amber-500/20'
      };
    case 'red':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/50',
        glow: 'shadow-red-500/20'
      };
    default:
      return {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        border: 'border-border',
        glow: ''
      };
  }
}
